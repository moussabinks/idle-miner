// Bot de simulation : il joue une partie complète tout seul.
// Il sert dans les tests à vérifier l'équilibrage (combien de blocs pour
// atteindre la bedrock ?). Il ne fait que des actions qu'un joueur peut faire :
// il creuse, remonte à l'échelle pour vendre et acheter, puis redescend.

import type { Aleatoire } from './aleatoire'
import { LARGEUR_MINE, LISTE_ENCHANTEMENTS, PIOCHES, PRIX_SEAU, type IdBloc } from './donnees'
import {
  acheterAscenseur,
  acheterPioche,
  acheterSac,
  acheterSeau,
  ascenseurDisponible,
  avancerTemps,
  casserBloc,
  creerPartie,
  descendreDansLaMine,
  enchanter,
  envoyerAscenseur,
  estCassee,
  fabriquerTorches,
  monterALaSurface,
  peutAcheterAscenseur,
  peutAcheterPioche,
  peutEnchanter,
  peutEncoreEnchanter,
  peutReparer,
  prixProchainSac,
  quantite,
  reparer,
  sacPlein,
  vendre,
  type EtatJeu,
} from './mineur'
import { verifierSucces } from './succes'

// Le bot creuse 10 couches entre deux décisions.
const BLOCS_PAR_SERIE = 10 * LARGEUR_MINE

export type ResultatBot = {
  etat: EtatJeu
  blocs: number // blocs cassés pour atteindre la bedrock
  temps: number // temps de jeu simulé (minage + échelle), en secondes
  profondeurPiocheFer: number | null // profondeur à l'achat de la pioche en fer
  allersRetours: number // nombre de fois où le bot est remonté à la surface
}

// Ce que le bot décoche au marché : ce qu'il lui faut pour les pioches et les enchantements.
function objetsAGarder(etat: EtatJeu): IdBloc[] {
  const garder: IdBloc[] = []
  if (etat.meilleure < 3) garder.push('diamant')
  if (etat.meilleure < 4) garder.push('debris', 'or')
  if (peutEncoreEnchanter(etat)) garder.push('lapis', 'emeraude')
  if (!etat.ascenseur.possede) garder.push('redstone')
  return garder
}

// Laisse passer le temps jusqu'à la fin du trajet à l'échelle.
function finirTrajet(etat: EtatJeu): void {
  if (etat.trajet !== null) avancerTemps(etat, etat.trajet.tempsRestant)
}

// Faut-il remonter ? Pour vendre (sans ascenseur), ou pour dépenser son argent.
function doitRemonter(etat: EtatJeu): boolean {
  const prochaine = PIOCHES[etat.meilleure + 1]
  if (sacPlein(etat) && !etat.ascenseur.possede) return true
  if (prochaine && peutAcheterPioche(etat, prochaine.niveau)) return true
  if (estCassee(etat) && peutReparer(etat)) return true
  return peutAcheterAscenseur(etat)
}

// Tout ce que le bot fait à la surface, avant de redescendre.
function faireLesCourses(etat: EtatJeu): void {
  const prochaine = PIOCHES[etat.meilleure + 1]

  etat.nonAVendre = objetsAGarder(etat)
  vendre(etat)

  if (prochaine && peutAcheterPioche(etat, prochaine.niveau)) acheterPioche(etat, prochaine.niveau)
  if (peutAcheterAscenseur(etat)) acheterAscenseur(etat)
  for (const id of LISTE_ENCHANTEMENTS) {
    while (peutEnchanter(etat, id)) enchanter(etat, id)
  }
  const prixSac = prixProchainSac(etat)
  if (prixSac !== null && etat.argent >= 2 * prixSac) acheterSac(etat)
  if (etat.profondeur >= 18) {
    while (etat.seaux < 2 && etat.argent >= 2 * PRIX_SEAU) acheterSeau(etat)
  }
  if (estCassee(etat) && peutReparer(etat)) reparer(etat)
}

export function jouerPartie(aleatoire: Aleatoire, maxBlocs = 20000): ResultatBot {
  const etat = creerPartie(aleatoire)
  let profondeurPiocheFer: number | null = null
  let allersRetours = 0
  let temps = 0

  // On commence à la surface : on descend.
  descendreDansLaMine(etat)
  temps += etat.trajet?.tempsTotal ?? 0
  finirTrajet(etat)

  while (!etat.victoire && etat.stats.blocsCasses < maxBlocs) {
    // L'ascenseur remonte le sac quand il est plein (on l'attend s'il est en route).
    if (sacPlein(etat) && etat.ascenseur.possede) {
      if (!ascenseurDisponible(etat)) {
        temps += etat.ascenseur.tempsRestant
        avancerTemps(etat, etat.ascenseur.tempsRestant)
      }
      etat.nonAVendre = objetsAGarder(etat)
      envoyerAscenseur(etat)
    }

    if (doitRemonter(etat)) {
      allersRetours += 1
      monterALaSurface(etat)
      temps += 2 * (etat.trajet?.tempsTotal ?? 0) // montée + descente
      finirTrajet(etat)
      faireLesCourses(etat)
      if (profondeurPiocheFer === null && etat.meilleure >= 2) profondeurPiocheFer = etat.profondeur
      descendreDansLaMine(etat)
      finirTrajet(etat)
    }

    // Des torches pour y voir clair (ça se fabrique partout).
    if (etat.torches < 2 && quantite(etat, 'charbon') > 0) fabriquerTorches(etat)

    // Comme un joueur qui clique sur « Creuser x10 » : 10 couches d'affilée,
    // en s'arrêtant si le sac est plein (mais toujours au moins un bloc, pour
    // avancer même si le sac reste plein d'objets gardés).
    for (let i = 0; i < BLOCS_PAR_SERIE && !etat.victoire && (i === 0 || !sacPlein(etat)); i++) {
      const tempsAvant = etat.stats.tempsMinage
      casserBloc(etat, aleatoire)
      const duree = etat.stats.tempsMinage - tempsAvant
      temps += duree
      avancerTemps(etat, duree) // l'ascenseur voyage pendant qu'on creuse
      verifierSucces(etat)
    }
  }

  return { etat, blocs: etat.stats.blocsCasses, temps, profondeurPiocheFer, allersRetours }
}
