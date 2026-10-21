// Bot de simulation : il joue une partie complète tout seul.
// Il sert dans les tests à vérifier l'équilibrage (combien de blocs pour
// atteindre la bedrock ?). Il ne fait que des actions qu'un joueur peut faire :
// il creuse, remonte à l'échelle pour vendre et acheter, puis redescend.
// Au village (20/10), il pose ses bâtiments autour de la mine dès qu'il peut les payer (le
// marché tout de suite, il est gratuit), et il compte le temps de marche jusqu'au marché.

import { aleatoireAvecGraine, type Aleatoire } from './aleatoire'
import { BATIMENTS, LARGEUR_MINE, LISTE_ENCHANTEMENTS, MINERAIS_REPARATION, PIOCHES, PRIX_SEAU, VITESSE_JOUEUR, type IdBatiment, type IdBloc } from './donnees'
import { construireBatiment, estPose, peutConstruire } from './batiments'
import { distanceEntre } from './village'
import {
  acheterPioche,
  acheterSac,
  acheterSeau,
  allerA,
  appelerAscenseur,
  ascenseurEnMouvement,
  ameliorerAscenseur,
  ascenseurDisponible,
  casserBloc,
  creerPartie,
  enchanter,
  envoyerAscenseur,
  estCassee,
  niveauAscenseur,
  peutAcheterPioche,
  peutAmeliorerAscenseur,
  peutEnchanter,
  peutEncoreEnchanter,
  peutReparer,
  positionFront,
  prendreAscenseur,
  peutStocker,
  prixProchainSac,
  prochainNiveauAscenseur,
  reparer,
  placeLibre,
  sacPlein,
  tailleSac,
  objetsAVendre,
  quantite,
  equiper,
  vendreLot,
  type EtatJeu,
  type Inventaire,
} from './mineur'
import { verifierSucces } from './succes'
import { avancerTemps } from './temps'

// Le bot creuse 10 couches entre deux décisions.
const BLOCS_PAR_SERIE = 10 * LARGEUR_MINE

// Où le bot pose ses bâtiments, autour de la mine (posée en 15,15 et large de 10 cases), dans
// l'ordre où il les construit.
const PLAN_DU_BOT: { id: IdBatiment; x: number; y: number }[] = [
  { id: 'marche', x: 18, y: 26 },
  { id: 'forgeron', x: 26, y: 18 },
  { id: 'bazar', x: 12, y: 26 },
  { id: 'enchanteur', x: 26, y: 12 },
  { id: 'prestige', x: 9, y: 9 },
]

// L'arbre de prestige ne sert qu'à la fin : le bot le construit une fois la pioche en netherite achetée.
function planUtile(etat: EtatJeu): typeof PLAN_DU_BOT {
  return PLAN_DU_BOT.filter((p) => p.id !== 'prestige' || etat.meilleure >= 4)
}

export type ResultatBot = {
  etat: EtatJeu
  blocs: number // blocs cassés pour atteindre la bedrock
  temps: number // temps de jeu simulé (minage + échelle + attente), en secondes
  profondeurPiocheFer: number | null // profondeur à l'achat de la pioche en fer
  profondeurAscenseur: number | null // profondeur à la construction de l'ascenseur
  allersRetours: number // nombre de fois où le bot est remonté au village
}

// Ce que le bot décoche au marché : ce qu'il lui faut pour les pioches,
// les enchantements et l'ascenseur.
function objetsAGarder(etat: EtatJeu): IdBloc[] {
  const garder: IdBloc[] = []
  if (etat.meilleure < 3) garder.push('diamant')
  if (etat.meilleure < 4) garder.push('debris', 'or')
  if (peutEncoreEnchanter(etat)) garder.push('lapis', 'emeraude')
  // Les minerais du prochain niveau de l'ascenseur (l'argent, lui, vient des ventes).
  const prochainAscenseur = prochainNiveauAscenseur(etat)
  if (prochainAscenseur !== null) garder.push(...(Object.keys(prochainAscenseur.cout.materiaux) as IdBloc[]))
  return garder
}

// Ce que le bot garde en petite quantité : 3 minerais de sa meilleure pioche (pour la réparer)
// et la pierre et le fer du prochain bâtiment à construire (la pierre se paie aussi en roche
// dure). On les enlève du lot à vendre ou à envoyer.
function enleverReserve(etat: EtatJeu, lot: Inventaire): void {
  const reserve: Inventaire = {}
  const minerai = PIOCHES[etat.meilleure].reparation
  if (minerai) reserve[minerai] = MINERAIS_REPARATION
  const prochainBatiment = planUtile(etat).find((p) => !estPose(etat, p.id))
  // Seulement quand il a déjà au moins la moitié de l'argent du bâtiment.
  if (prochainBatiment && etat.argent >= (BATIMENTS[prochainBatiment.id].cout.argent ?? 0) / 2) {
    for (const [bloc, nombre] of Object.entries(BATIMENTS[prochainBatiment.id].cout.materiaux)) {
      // Toujours en laissant un peu de place dans le sac.
      const garde = Math.min(nombre ?? 0, tailleSac(etat) - 8)
      reserve[bloc as IdBloc] = (reserve[bloc as IdBloc] ?? 0) + garde
      if (bloc === 'pierre') reserve.deepslate = (reserve.deepslate ?? 0) + Math.max(0, garde - quantite(etat, 'pierre'))
    }
  }
  for (const [id, nombre] of Object.entries(reserve)) {
    const bloc = id as IdBloc
    if (lot[bloc] === undefined) continue
    const reste = (lot[bloc] ?? 0) - (nombre ?? 0)
    if (reste > 0) lot[bloc] = reste
    else delete lot[bloc]
  }
}

export function jouerPartie(aleatoire: Aleatoire, maxBlocs = 40000): ResultatBot {
  const etat = creerPartie(aleatoire)
  // Le marché est gratuit : il le pose tout de suite.
  construireBatiment(etat, 'marche', PLAN_DU_BOT[0].x, PLAN_DU_BOT[0].y)
  // L'aléatoire de la foreuse est à part : elle n'est pas débloquée au prestige 0.
  const aleatoireTemps = aleatoireAvecGraine(0)
  let profondeurPiocheFer: number | null = null
  let profondeurAscenseur: number | null = null
  let allersRetours = 0
  let temps = 0

  // Laisse passer un peu de temps (l'ascenseur et l'échelle avancent).
  function attendre(secondes: number): void {
    temps += secondes
    avancerTemps(etat, secondes, aleatoireTemps)
  }

  // Attend que la cabine de l'ascenseur s'arrête.
  function attendreAscenseur(): void {
    const niveau = niveauAscenseur(etat)
    while (niveau !== null && ascenseurEnMouvement(etat)) {
      attendre(Math.abs(etat.ascenseur.cible - etat.ascenseur.position) * niveau.secondesParMetre + 0.01)
    }
  }

  // Va quelque part dans le puits : en ascenseur s'il est là, sinon à l'échelle.
  function voyager(position: number): void {
    if (etat.ascenseur.niveau > 0) attendreAscenseur()
    if (ascenseurDisponible(etat) && prendreAscenseur(etat, position).length > 0) {
      attendreAscenseur()
      return
    }
    allerA(etat, position)
    attendre(Math.abs(etat.cible - etat.position) * 0.15 + 0.01)
  }

  // Faut-il remonter ? Pour vendre (si l'ascenseur ne le fait pas), ou pour dépenser son argent.
  function doitRemonter(): boolean {
    const prochaine = PIOCHES[etat.meilleure + 1]
    if (sacPlein(etat) && etat.ascenseur.niveau === 0) return true
    if (!peutStocker(etat)) return true // plus aucune place (sac et quai pleins, d'objets gardés) : on va vendre
    if (planUtile(etat).some((p) => peutConstruire(etat, p.id))) return true // un bâtiment à poser
    if (prochaine && peutAcheterPioche(etat, prochaine.niveau)) return true
    return (estCassee(etat) || etat.niveauPioche !== etat.meilleure) && solutionPourLaPioche()
  }

  // Une pioche qu'on peut utiliser (ou réparer) au village : la meilleure d'abord.
  function piocheUtilisable(niveau: number): boolean {
    if (!(niveau in etat.pioches)) return false
    const intacte = (etat.pioches[niveau] ?? 0) < PIOCHES[niveau].durabilite
    return intacte || peutReparer(etat, niveau) || peutAcheterPioche(etat, niveau)
  }

  // Est-ce que remonter servirait à quelque chose pour la pioche (réparer, racheter, changer) ?
  function solutionPourLaPioche(): boolean {
    for (let niveau = etat.meilleure; niveau >= 0; niveau--) {
      if (niveau === etat.niveauPioche && !estCassee(etat)) return false // déjà la meilleure possible
      if (piocheUtilisable(niveau)) return true
    }
    return false
  }

  // Au village : on reprend la meilleure pioche qu'on peut (réparée avec l'argent et 3 minerais,
  // ou rachetée neuve) ; sinon une moins bonne qu'on possède encore, en attendant.
  function choisirPioche(): void {
    for (let niveau = etat.meilleure; niveau >= 0; niveau--) {
      if (!(niveau in etat.pioches)) continue
      if ((etat.pioches[niveau] ?? 0) >= PIOCHES[niveau].durabilite) {
        if (peutReparer(etat, niveau)) reparer(etat, niveau)
        else if (peutAcheterPioche(etat, niveau)) acheterPioche(etat, niveau)
      }
      if ((etat.pioches[niveau] ?? 0) < PIOCHES[niveau].durabilite) {
        equiper(etat, niveau)
        return
      }
    }
  }

  // Tout ce que le bot fait au village, avant de redescendre.
  function faireLesCourses(): void {
    // Il marche de la mine au marché (et revient), en passant devant les autres bâtiments.
    temps += (2 * distanceEntre(etat.village, 'puits', 'marche')) / VITESSE_JOUEUR
    const prochaine = PIOCHES[etat.meilleure + 1]
    etat.nonAVendre = [...new Set(objetsAGarder(etat))]
    // Il vend tout, sauf 3 minerais de sa meilleure pioche : de quoi la réparer quand elle cassera.
    const lot = objetsAVendre(etat)
    enleverReserve(etat, lot)
    vendreLot(etat, lot)
    // Le sac est quand même presque plein d'objets gardés : il vend tout (sinon il ne pourrait
    // plus creuser du tout).
    if (placeLibre(etat) < 8) vendreLot(etat, etat.inventaire)
    // Les bâtiments d'abord (dans l'ordre de son plan), puis les achats dans ceux qui sont posés.
    for (const { id, x, y } of planUtile(etat)) {
      if (peutConstruire(etat, id)) construireBatiment(etat, id, x, y)
    }
    const forgeron = estPose(etat, 'forgeron')
    const bazar = estPose(etat, 'bazar')
    if (forgeron && prochaine && peutAcheterPioche(etat, prochaine.niveau)) acheterPioche(etat, prochaine.niveau)
    // Les enchantements attendent que l'ascenseur soit construit (il fait gagner bien plus de temps).
    if (estPose(etat, 'enchanteur') && etat.ascenseur.niveau > 0) {
      for (const id of LISTE_ENCHANTEMENTS) {
        while (peutEnchanter(etat, id)) enchanter(etat, id)
      }
    }
    const prixSac = prixProchainSac(etat)
    if (bazar && prixSac !== null && etat.argent >= 2 * prixSac) acheterSac(etat)
    if (bazar && etat.profondeur >= 36) {
      while (etat.seaux < 2 && etat.argent >= 2 * PRIX_SEAU) acheterSeau(etat)
    }
    if (forgeron) choisirPioche()
  }

  while (!etat.victoire && etat.stats.blocsCasses < maxBlocs) {
    // L'ascenseur se construit et s'améliore directement dans la mine.
    while (peutAmeliorerAscenseur(etat) && !ascenseurEnMouvement(etat)) {
      ameliorerAscenseur(etat)
      if (profondeurAscenseur === null) profondeurAscenseur = etat.profondeur
    }

    // Il remonte le sac quand il est plein (on l'attend, ou on l'appelle, s'il n'est pas là).
    if (sacPlein(etat) && etat.ascenseur.niveau > 0 && etat.position > 0) {
      attendreAscenseur()
      if (!ascenseurDisponible(etat)) {
        appelerAscenseur(etat)
        attendreAscenseur()
      }
      // Il envoie tout ce qu'il ne garde pas, sauf la réserve (réparation, prochain bâtiment).
      etat.ascenseur.garder = objetsAGarder(etat)
      const lot: Inventaire = {}
      for (const [id, nombre] of Object.entries(etat.inventaire)) {
        if (!etat.ascenseur.garder.includes(id as IdBloc)) lot[id as IdBloc] = nombre
      }
      enleverReserve(etat, lot)
      envoyerAscenseur(etat, lot)
    }

    if (doitRemonter()) {
      allersRetours += 1
      voyager(0)
      faireLesCourses()
      if (profondeurPiocheFer === null && etat.meilleure >= 2) profondeurPiocheFer = etat.profondeur
      voyager(positionFront(etat))
    }

    // Toujours retourner au front de taille avant de creuser (au début, on part du village).
    if (etat.position !== positionFront(etat)) voyager(positionFront(etat))

    // Comme un joueur qui clique sur « Creuser x10 » : 10 couches d'affilée,
    // en s'arrêtant si le sac est plein (on ne casse jamais un bloc qu'on ne pourrait pas ranger).
    for (let i = 0; i < BLOCS_PAR_SERIE && !etat.victoire && peutStocker(etat); i++) {
      const tempsAvant = etat.stats.tempsMinage
      casserBloc(etat, aleatoire)
      const duree = etat.stats.tempsMinage - tempsAvant
      temps += duree
      avancerTemps(etat, duree, aleatoireTemps) // l'ascenseur voyage pendant qu'on creuse
      verifierSucces(etat)
    }
  }

  return { etat, blocs: etat.stats.blocsCasses, temps, profondeurPiocheFer, profondeurAscenseur, allersRetours }
}
