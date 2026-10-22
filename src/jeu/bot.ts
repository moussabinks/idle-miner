// Bot de simulation : il joue une partie complète tout seul (22/10 : la mine automatique).
// Il sert dans les tests à vérifier l'équilibrage (combien de temps pour descendre la mine au
// niveau 5 ?). Il ne fait que des actions qu'un joueur peut faire :
//   - devant la mine, il clique sur le bloc (2 clics par seconde) ;
//   - quand le coffre se remplit, il le vide dans son sac et va vendre au marché (à pied) ;
//   - il pose ses bâtiments, embauche des mineurs, paie leurs salaires, améliore tout ;
//   - il relie la mine au marché avec des rails, y envoie un wagonnet, met un mineur à le pousser, puis
//     électrifie la ligne avec le générateur.
// Les achats se font sans compter la marche (on suppose qu'il passe devant en allant vendre).

import { aleatoireAvecGraine, type Aleatoire } from './aleatoire'
import { BATIMENTS, PIOCHES, SECONDES_PAR_PAIE, VITESSE_JOUEUR, type Cout, type IdBatiment, type IdBloc } from './donnees'
import { construireBatiment, estPose, peutConstruire, peutPoserSol, poserSol } from './batiments'
import {
  ameliorerEmploye,
  ameliorerRecruteur,
  coutAmeliorationEmploye,
  deposerTresorerie,
  depensesParPaie,
  embaucher,
  embaucherPousseur,
  peutEmbaucherPousseur,
  embaucherManager,
  managerDebloque,
  nbSansSalaire,
  payerSalaires,
  peutAmeliorerRecruteur,
  peutPayerSalaires,
  prixEmbauche,
  salairesParPaie,
  tempsPayeMin,
} from './employes'
import { ameliorerChariot, ameliorerForage, peutAmeliorerChariot, peutAmeliorerForage, prendreDuChariot, remplirForeuse } from './foreuse'
import { ameliorerGenerateur, basculerPuisage, prochainNiveauGenerateur, puisageDisponible, remplirGenerateur } from './generateur'
import {
  acheterPioche,
  acheterSac,
  agrandirCoffre,
  ameliorerAscenseur,
  capaciteCoffre,
  cliquerMine,
  creerPartie,
  descendreNiveauMine,
  estCassee,
  nbDansCoffre,
  objetsAVendre,
  peutAcheterPioche,
  peutPayer,
  peutReparer,
  prendreDuCoffre,
  prixProchainSac,
  prochainNiveauAscenseur,
  prochainNiveauCoffre,
  prochainNiveauMine,
  reparer,
  vendre,
  type EtatJeu,
  type Inventaire,
} from './mineur'
import { verifierSucces } from './succes'
import { avancerTemps } from './temps'
import { distanceEntre, railsMineMarche } from './village'
import { ameliorerWagonnet, creerTrajet, peutCreerTrajet, prochainNiveauWagonnet, railsAlimentes, trajetDe } from './wagonnet'

// Où le bot pose ses bâtiments autour de la mine (posée en 25,25 et large de 10 cases).
const PLAN_DU_BOT: { id: IdBatiment; x: number; y: number }[] = [
  { id: 'marche', x: 28, y: 38 },
  { id: 'forgeron', x: 36, y: 24 },
  { id: 'employes', x: 19, y: 31 },
  { id: 'bazar', x: 19, y: 25 },
  { id: 'generateur', x: 35, y: 37 },
  { id: 'foreuse', x: 36, y: 31 },
]

// Les rails de la mine (dont le bas est en y = 34) au marché (dont le haut est en y = 38).
const RAILS_DU_BOT = [
  { x: 30, y: 35 },
  { x: 30, y: 36 },
  { x: 30, y: 37 },
]

const CLICS_PAR_SECONDE = 2
const PAS = 1 // le bot décide toutes les secondes

export type ResultatBot = {
  etat: EtatJeu
  temps: number // temps de jeu simulé, en secondes
  tempsNiveaux: Record<number, number> // l'heure (en s) où la mine est arrivée à chaque niveau
  tempsRails: number | null // quand la mine a été reliée au marché
  tempsElectrique: number | null // quand les rails ont été électrifiés
  allersRetours: number // les voyages à pied jusqu'au marché
}

export function jouerPartie(aleatoire: Aleatoire, maxSecondes = 4 * 3600): ResultatBot {
  const etat = creerPartie(aleatoire)
  const aleatoireTemps = aleatoireAvecGraine(0)
  const tempsNiveaux: Record<number, number> = { 1: 0 }
  let tempsRails: number | null = null
  let tempsElectrique: number | null = null
  let allersRetours = 0
  let temps = 0

  function attendre(secondes: number): void {
    temps += secondes
    avancerTemps(etat, secondes, aleatoireTemps)
  }

  // Les prochains achats qui demandent des minerais : le bot les garde (le wagonnet ne les
  // emporte pas, et il ne les vend pas au marché).
  function prochainsCouts(): Cout[] {
    const couts: Cout[] = []
    const batiment = PLAN_DU_BOT.find((p) => !estPose(etat, p.id) && etat.niveauMine >= BATIMENTS[p.id].niveauMine)
    if (batiment) couts.push(BATIMENTS[batiment.id].cout)
    const pioche = PIOCHES[etat.meilleure + 1]
    if (pioche) couts.push(pioche.cout)
    if (estCassee(etat)) couts.push(PIOCHES[etat.niveauPioche].reparation)
    const niveau = prochainNiveauMine(etat)
    if (niveau) couts.push(niveau.cout)
    const coffre = prochainNiveauCoffre(etat)
    if (coffre) couts.push(coffre.cout)
    if (railsMineMarche(etat.village) === null) couts.push({ materiaux: { fer: 3 * RAILS_DU_BOT.length } })
    if (estPose(etat, 'generateur')) couts.push({ materiaux: { redstone: 20 } })
    return couts
  }

  // Ce qu'il garde : de chaque minerai, ce que demande le plus gourmand des prochains achats
  // (jamais plus de la moitié du coffre en tout).
  function reserve(): Inventaire {
    const garde: Inventaire = {}
    for (const cout of prochainsCouts()) {
      for (const [bloc, nombre] of Object.entries(cout.materiaux)) garde[bloc as IdBloc] = Math.max(garde[bloc as IdBloc] ?? 0, nombre ?? 0)
    }
    return garde
  }

  function reglerGarde(): void {
    const garde = reserve()
    // On garde un minerai tant qu'on n'en a pas assez (ensuite, le surplus part au marché).
    etat.nonAVendre = (Object.keys(garde) as IdBloc[]).filter((bloc) => (etat.coffre.contenu[bloc] ?? 0) < (garde[bloc] ?? 0) * 1.5 && nbDansCoffre(etat) < capaciteCoffre(etat) * 0.8)
  }

  // Un voyage à pied : il prend le coffre (sauf ce qu'il garde) et va le vendre au marché.
  function allerVendre(): void {
    const garde = reserve()
    const lot: Inventaire = {}
    for (const [id, nombre] of Object.entries(etat.coffre.contenu)) {
      const bloc = id as IdBloc
      const surplus = (nombre ?? 0) - (etat.nonAVendre.includes(bloc) ? (garde[bloc] ?? 0) : 0)
      if (surplus > 0) lot[bloc] = surplus
    }
    prendreDuCoffre(etat, lot)
    // (le chariot de la foreuse ne se vend plus sur place, 27/10 : il le porte au marché aussi)
    if (estPose(etat, 'foreuse')) prendreDuChariot(etat)
    const aller = distanceEntre(etat.village, 'puits', 'marche') / VITESSE_JOUEUR
    attendre(aller)
    etat.nonAVendre = []
    if (Object.keys(objetsAVendre(etat)).length > 0) vendre(etat)
    attendre(aller)
    allersRetours += 1
  }

  function acheterSiPossible(): void {
    for (const { id, x, y } of PLAN_DU_BOT) if (peutConstruire(etat, id)) construireBatiment(etat, id, x, y)

    // Les rails d'abord : c'est le début de l'automatisation.
    if (estPose(etat, 'marche') && railsMineMarche(etat.village) === null) {
      for (const c of RAILS_DU_BOT) if (peutPoserSol(etat, 'rail', c.x, c.y)) poserSol(etat, 'rail', c.x, c.y)
    }
    // Puis il envoie un wagonnet de la mine au marché.
    if (peutCreerTrajet(etat, 'mine-marche')) creerTrajet(etat, 'mine-marche')

    if (estCassee(etat) && peutReparer(etat)) reparer(etat)
    const pioche = PIOCHES[etat.meilleure + 1]
    if (pioche && estPose(etat, 'forgeron') && peutAcheterPioche(etat, pioche.niveau)) acheterPioche(etat, pioche.niveau)

    const niveau = prochainNiveauMine(etat)
    if (niveau && peutPayer(etat, niveau.cout)) {
      descendreNiveauMine(etat, aleatoire)
      tempsNiveaux[etat.niveauMine] = temps
    }

    // Les salaires : le bot paie dès que quelqu'un a moins d'une minute payée.
    if (!etat.manager.embauche && etat.employes.length > 0 && (tempsPayeMin(etat) < 60 || nbSansSalaire(etat) > 0) && peutPayerSalaires(etat, SECONDES_PAR_PAIE)) {
      payerSalaires(etat, SECONDES_PAR_PAIE)
    }
    if (etat.manager.embauche && etat.tresorerie < depensesParPaie(etat) * 2) deposerTresorerie(etat, Math.max(0, etat.argent - 500))

    // Il garde toujours de quoi payer une paie d'avance.
    const marge = () => salairesParPaie(etat) + 20
    const prix = prixEmbauche(etat)
    if (estPose(etat, 'employes') && prix !== null && etat.argent >= prix + marge()) embaucher(etat, aleatoire)
    for (let i = 0; i < etat.employes.length; i++) {
      const cout = coutAmeliorationEmploye(etat.employes[i])
      if (cout && etat.argent >= (cout.argent ?? 0) + marge() && peutPayer(etat, cout)) ameliorerEmploye(etat, i)
    }
    if (peutAmeliorerRecruteur(etat)) ameliorerRecruteur(etat)
    if (managerDebloque(etat) && !etat.manager.embauche && etat.argent >= 20000) embaucherManager(etat)

    // Un pousseur pour le wagonnet (27/10 : il en faut un même sur des rails électriques).
    const pousseurs = etat.employes.filter((e) => e.role === 'pousseur')
    if (trajetDe(etat, 'mine-marche') && pousseurs.length === 0 && etat.employes.length >= 1 && peutEmbaucherPousseur(etat, 'mine-marche')) {
      embaucherPousseur(etat, aleatoire, 'mine-marche')
    }
    // Le générateur : il le remplit de redstone, puis le laisse se servir dans le coffre.
    if (estPose(etat, 'generateur')) {
      if (etat.generateur.carburant < 120) remplirGenerateur(etat, 10)
      if (puisageDisponible(etat) && !etat.generateur.puiseDansLeCoffre) basculerPuisage(etat)
      const prochain = prochainNiveauGenerateur(etat)
      if (prochain && etat.argent >= (prochain.cout.argent ?? 0) * 2 && peutPayer(etat, prochain.cout)) ameliorerGenerateur(etat)
    }

    // La foreuse : du charbon (son chariot part au marché avec le coffre, voir allerVendre).
    if (estPose(etat, 'foreuse')) {
      if (etat.foreuse.carburant < 60) remplirForeuse(etat, 10)
      if (peutAmeliorerForage(etat) && etat.argent > 3000) ameliorerForage(etat)
      if (peutAmeliorerChariot(etat) && etat.argent > 3000) ameliorerChariot(etat)
    }

    // Les améliorations de la mine, avec une marge (l'argent sert d'abord aux niveaux).
    const ascenseur = prochainNiveauAscenseur(etat)
    if (ascenseur && etat.employes.length >= 2 && etat.argent >= (ascenseur.cout.argent ?? 0) + marge() && peutPayer(etat, ascenseur.cout)) ameliorerAscenseur(etat)
    const coffre = prochainNiveauCoffre(etat)
    if (coffre && etat.argent >= (coffre.cout.argent ?? 0) + marge() && peutPayer(etat, coffre.cout)) agrandirCoffre(etat)
    const wagonnet = prochainNiveauWagonnet(etat)
    if (wagonnet && etat.trajets.length > 0 && etat.argent >= (wagonnet.cout.argent ?? 0) * 2 && peutPayer(etat, wagonnet.cout)) ameliorerWagonnet(etat)
    const prixSac = prixProchainSac(etat)
    if (estPose(etat, 'bazar') && prixSac !== null && etat.argent >= 3 * prixSac) acheterSac(etat)
  }

  while (etat.niveauMine < 5 && temps < maxSecondes) {
    reglerGarde()
    acheterSiPossible()
    // Sans wagonnet qui roule, il va vendre à pied quand le coffre est à moitié plein. (27/10 : le
    // wagonnet ne part qu'avec un pousseur payé, même électrique : sans paie, il va vendre lui-même.)
    const wagonnetActif = trajetDe(etat, 'mine-marche') !== null && etat.employes.some((e) => e.role === 'pousseur' && e.trajet === 'mine-marche' && e.tempsPaye > 0)
    if (!wagonnetActif && nbDansCoffre(etat) >= capaciteCoffre(etat) / 2) allerVendre()
    for (let i = 0; i < CLICS_PAR_SECONDE * PAS; i++) cliquerMine(etat, aleatoire)
    attendre(PAS)
    if (trajetDe(etat, 'mine-marche') && tempsRails === null) tempsRails = temps
    if (railsAlimentes(etat) && tempsElectrique === null) tempsElectrique = temps
    verifierSucces(etat)
  }

  return { etat, temps, tempsNiveaux, tempsRails, tempsElectrique, allersRetours }
}
