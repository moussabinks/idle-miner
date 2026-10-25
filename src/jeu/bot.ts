// Bot de simulation : il joue une partie complète tout seul (22/10 : la mine automatique).
// Il sert dans les tests à vérifier l'équilibrage (combien de temps pour descendre la mine au
// niveau 5 ?). Depuis le 29/10, il gagne de l'XP comme un joueur et attend ses niveaux pour
// débloquer bâtiments et améliorations. Il ne fait que des actions qu'un joueur peut faire :
//   - devant la mine, il clique sur le bloc (2 clics par seconde) ;
//   - quand le coffre se remplit, il le vend depuis la mine (25/10 : plus de sac ni de marche) ;
//   - il pose ses bâtiments, embauche des mineurs, paie leurs salaires, améliore tout ;
//   - il relie la mine au marché avec des rails, y envoie un wagonnet, met un mineur à le pousser, puis
//     électrifie la ligne avec le générateur.
// Les achats se font sans compter la marche (on suppose qu'il passe devant en allant vendre).

import { aleatoireAvecGraine, type Aleatoire } from './aleatoire'
import { BATIMENTS, PIOCHES, SECONDES_PAR_PAIE, type Cout, type IdBatiment, type IdBloc } from './donnees'
import { construireBatiment, estPose, peutConstruire, peutPoserSol, poserSol } from './batiments'
import {
  agrandirChariot,
  ameliorerEmploye,
  ameliorerRecruteur,
  coutAmeliorationEmploye,
  coutChariotPousseur,
  embaucher,
  embaucherPousseur,
  peutAgrandirChariot,
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
  fatigueManager,
  managerPaieLesSalaires,
  reveillerManager,
} from './employes'
import { ameliorerChariot, ameliorerForage, peutAmeliorerChariot, peutAmeliorerForage, vendreChariot, prochainNiveauChariot, prochainNiveauForage, remplirForeuse } from './foreuse'
import { ameliorerGenerateur, prochainNiveauGenerateur, remplirGenerateur } from './generateur'
import {
  acheterPioche,
  disponible,
  agrandirCoffre,
  ameliorerAscenseur,
  capaciteCoffre,
  cliquerMine,
  creerPartie,
  descendreNiveauMine,
  estCassee,
  nbDansCoffre,
  peutAcheterPioche,
  peutPayer,
  peutReparer,
  vendreCoffre,
  prochainNiveauAscenseur,
  prochainNiveauCoffre,
  prochainNiveauMine,
  reparer,
  type EtatJeu,
  type Inventaire,
} from './mineur'
import { debloque, niveauJoueur } from './niveaux'
import { verifierSucces } from './succes'
import { avancerTemps } from './temps'
import { railsMineMarche } from './village'
import { creerTrajet, peutCreerTrajet, railsAlimentes, trajetDe } from './wagonnet'

// Où le bot pose ses bâtiments autour de la mine (posée en 15,15 et large de 10 cases), dans
// l'ordre où il les construit.
const PLAN_DU_BOT: { id: IdBatiment; x: number; y: number }[] = [
  { id: 'employes', x: 9, y: 21 },
  { id: 'marche', x: 18, y: 28 },
  { id: 'forgeron', x: 26, y: 14 },
  { id: 'generateur', x: 25, y: 27 },
  { id: 'foreuse', x: 26, y: 21 },
]

// Les rails de la mine (dont le bas est en y = 24) au marché (dont le haut est en y = 28).
const RAILS_DU_BOT = [
  { x: 20, y: 25 },
  { x: 20, y: 26 },
  { x: 20, y: 27 },
]

const CLICS_PAR_SECONDE = 2
const PAS = 1 // le bot décide toutes les secondes

export type ResultatBot = {
  etat: EtatJeu
  temps: number // temps de jeu simulé, en secondes
  tempsNiveaux: Record<number, number> // l'heure (en s) où la mine est arrivée à chaque niveau
  tempsRails: number | null // quand la mine a été reliée au marché
  tempsElectrique: number | null // quand les rails ont été électrifiés
  tempsNiveauxJoueur: Record<number, number> // l'heure (en s) où le joueur est arrivé à chaque niveau
  allersRetours: number // les ventes faites à la main, depuis la mine (25/10 : plus de marche)
}

export function jouerPartie(aleatoire: Aleatoire, maxSecondes = 12 * 3600): ResultatBot {
  const etat = creerPartie(aleatoire)
  const aleatoireTemps = aleatoireAvecGraine(0)
  const tempsNiveaux: Record<number, number> = { 1: 0 }
  const tempsNiveauxJoueur: Record<number, number> = { 1: 0 }
  let tempsRails: number | null = null
  let tempsElectrique: number | null = null
  let allersRetours = 0
  let temps = 0

  function attendre(secondes: number): void {
    temps += secondes
    avancerTemps(etat, secondes, aleatoireTemps)
  }

  // Les prochains achats qui demandent des minerais, du plus important au moins important : le
  // bot les garde dans le coffre (il ne les vend pas, le wagonnet ne les emporte pas).
  function prochainsCouts(): Cout[] {
    const couts: Cout[] = []
    // (le coffre d'abord : le prochain niveau de la mine ne tient pas toujours dans le coffre actuel)
    const coffre = prochainNiveauCoffre(etat)
    if (coffre && debloque(etat, 'coffre', etat.coffre.niveau + 1)) couts.push(coffre.cout)
    const niveau = prochainNiveauMine(etat)
    if (niveau) couts.push(niveau.cout)
    if (railsMineMarche(etat.village) === null) couts.push({ materiaux: { fer: 3 * RAILS_DU_BOT.length } })
    if (estCassee(etat)) couts.push(PIOCHES[etat.niveauPioche].reparation)
    const batiment = PLAN_DU_BOT.find((p) => !estPose(etat, p.id) && etat.niveauMine >= BATIMENTS[p.id].niveauMine)
    if (batiment) couts.push(BATIMENTS[batiment.id].cout)
    if (estPose(etat, 'generateur')) couts.push({ materiaux: { redstone: 20 } })
    const pioche = PIOCHES[etat.meilleure + 1]
    if (pioche) couts.push(pioche.cout)
    return couts
  }

  // Ce qu'il garde dans le coffre (« 📌 Garder N ») : de quoi payer ses prochains achats, dans
  // l'ordre, tant que ça tient dans 70 % du coffre (sinon il se bloquerait, plein de ce qu'il garde).
  function reglerGarde(): void {
    const garde: Inventaire = {}
    let total = 0
    const place = capaciteCoffre(etat) * 0.7
    for (const cout of prochainsCouts()) {
      for (const [id, nombre] of Object.entries(cout.materiaux)) {
        const bloc = id as IdBloc
        const enPlus = Math.max(0, (nombre ?? 0) - (garde[bloc] ?? 0))
        if (total + enPlus > place) continue
        garde[bloc] = (garde[bloc] ?? 0) + enPlus
        total += enPlus
      }
    }
    etat.coffre.garder = garde
  }

  // Une vente à la main : il vend le coffre (sauf ce qu'il garde) et le chariot de la foreuse.
  function allerVendre(): void {
    vendreCoffre(etat)
    if (estPose(etat, 'foreuse')) vendreChariot(etat)
    allersRetours += 1
  }

  // (23/10) Les améliorations « en plus » (foreuse, chariot, générateur) ne prennent pas les
  // minerais mis de côté pour descendre au niveau suivant de la mine (avec 1 mineur de plus par
  // niveau seulement, le fer arrive moins vite : sinon, il restait bloqué au niveau 2).
  function gardeLaMine(cout: Cout | null | undefined): boolean {
    const niveau = prochainNiveauMine(etat)
    if (!cout || !niveau) return true
    return Object.entries(cout.materiaux).every(([bloc, nombre]) => {
      const pourLaMine = niveau.cout.materiaux[bloc as IdBloc] ?? 0
      return pourLaMine === 0 || disponible(etat, bloc as IdBloc) - (nombre ?? 0) >= pourLaMine
    })
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
    // (23/10) Le manager fatigue : le bot le réveille quand il a dépassé la moitié.
    if (etat.manager.embauche && fatigueManager(etat) > 0.5) reveillerManager(etat)
    if (!managerPaieLesSalaires(etat) && etat.employes.length > 0 && (tempsPayeMin(etat) < 60 || nbSansSalaire(etat) > 0) && peutPayerSalaires(etat, SECONDES_PAR_PAIE)) {
      payerSalaires(etat, SECONDES_PAR_PAIE)
    }

    // Il garde toujours de quoi payer une paie d'avance.
    const marge = () => salairesParPaie(etat) + 20
    const prix = prixEmbauche(etat)
    if (estPose(etat, 'employes') && prix !== null && etat.argent >= prix + marge()) embaucher(etat, aleatoire)
    for (let i = 0; i < etat.employes.length; i++) {
      const cout = coutAmeliorationEmploye(etat, etat.employes[i])
      // (23/10 : il n'améliore pas les pousseurs, son wagonnet suit sans)
      if (etat.employes[i].role === 'pousseur') continue
      if (cout && etat.argent >= (cout.argent ?? 0) + marge() && peutPayer(etat, cout)) ameliorerEmploye(etat, i)
    }
    if (peutAmeliorerRecruteur(etat)) ameliorerRecruteur(etat)
    if (managerDebloque(etat) && !etat.manager.embauche && etat.argent >= 15000) embaucherManager(etat)

    // Un pousseur pour le wagonnet (27/10 : il en faut un même sur des rails électriques).
    const pousseurs = etat.employes.filter((e) => e.role === 'pousseur')
    if (trajetDe(etat, 'mine-marche') && pousseurs.length === 0 && etat.employes.length >= 1 && peutEmbaucherPousseur(etat, 'mine-marche')) {
      embaucherPousseur(etat, aleatoire, 'mine-marche')
    }
    // Le générateur : il le remplit de redstone (23/10 : il ne se sert plus dans le coffre).
    if (estPose(etat, 'generateur')) {
      if (etat.generateur.carburant < 120) remplirGenerateur(etat, 10)
      const prochain = prochainNiveauGenerateur(etat)
      if (prochain && etat.argent >= (prochain.cout.argent ?? 0) * 2 && peutPayer(etat, prochain.cout) && gardeLaMine(prochain.cout)) ameliorerGenerateur(etat)
    }

    // La foreuse : du charbon (son chariot part au marché avec le coffre, voir allerVendre).
    if (estPose(etat, 'foreuse')) {
      if (etat.foreuse.carburant < 60) remplirForeuse(etat, 10)
      if (peutAmeliorerForage(etat) && etat.argent > 3000 && gardeLaMine(prochainNiveauForage(etat)?.cout)) ameliorerForage(etat)
      if (peutAmeliorerChariot(etat) && etat.argent > 3000 && gardeLaMine(prochainNiveauChariot(etat)?.cout)) ameliorerChariot(etat)
    }

    // Les améliorations de la mine, avec une marge (l'argent sert d'abord aux niveaux).
    const ascenseur = prochainNiveauAscenseur(etat)
    if (ascenseur && etat.employes.length >= 2 && etat.argent >= (ascenseur.cout.argent ?? 0) + marge() && peutPayer(etat, ascenseur.cout) && gardeLaMine(ascenseur.cout)) ameliorerAscenseur(etat)
    const coffre = prochainNiveauCoffre(etat)
    if (coffre && etat.argent >= (coffre.cout.argent ?? 0) + marge() && peutPayer(etat, coffre.cout)) agrandirCoffre(etat)
    // (23/10) Le chariot du pousseur du marché est petit : quand le coffre se remplit, il l'agrandit
    // tout de suite (au Personnel), sinon quand il a deux fois son prix.
    const coffreSeRemplit = nbDansCoffre(etat) >= capaciteCoffre(etat) * 0.7
    const indexPousseur = etat.employes.findIndex((e) => e.role === 'pousseur' && e.trajet === 'mine-marche')
    const pousseurMarche = indexPousseur >= 0 ? etat.employes[indexPousseur] : null
    const coutChariot = pousseurMarche ? coutChariotPousseur(etat, pousseurMarche) : null
    if (pousseurMarche && coutChariot && peutAgrandirChariot(etat, pousseurMarche) && gardeLaMine(coutChariot) && (coffreSeRemplit || etat.argent >= (coutChariot.argent ?? 0) * 2)) agrandirChariot(etat, indexPousseur)
  }

  while (etat.niveauMine < 5 && temps < maxSecondes) {
    reglerGarde()
    acheterSiPossible()
    // Sans wagonnet qui roule, il vend le coffre quand il est à moitié plein. (27/10 : le
    // wagonnet ne part qu'avec un pousseur payé, même électrique : sans paie, il vend lui-même.)
    const wagonnetActif = trajetDe(etat, 'mine-marche') !== null && etat.employes.some((e) => e.role === 'pousseur' && e.trajet === 'mine-marche' && e.tempsPaye > 0)
    if (!wagonnetActif && nbDansCoffre(etat) >= capaciteCoffre(etat) / 2) allerVendre()
    // (23/10) Le wagonnet ne suit pas (il est petit) : il vend aussi à la main.
    else if (wagonnetActif && nbDansCoffre(etat) >= capaciteCoffre(etat) * 0.85) allerVendre()
    for (let i = 0; i < CLICS_PAR_SECONDE * PAS; i++) cliquerMine(etat, aleatoire)
    attendre(PAS)
    if (trajetDe(etat, 'mine-marche') && tempsRails === null) tempsRails = temps
    if (railsAlimentes(etat) && tempsElectrique === null) tempsElectrique = temps
    if (tempsNiveauxJoueur[niveauJoueur(etat)] === undefined) tempsNiveauxJoueur[niveauJoueur(etat)] = temps
    verifierSucces(etat)
  }

  return { etat, temps, tempsNiveaux, tempsRails, tempsElectrique, tempsNiveauxJoueur, allersRetours }
}
