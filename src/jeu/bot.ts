// Bot de simulation : il joue une partie complète tout seul.
// Il sert dans les tests à vérifier l'équilibrage (combien de blocs pour
// atteindre la bedrock ?). Il ne fait que des actions qu'un joueur peut faire.

import type { Aleatoire } from './aleatoire'
import { LARGEUR_MINE, LISTE_ENCHANTEMENTS, PIOCHES, PRIX_SEAU } from './donnees'
import {
  acheterPioche,
  acheterSac,
  acheterSeau,
  casserBloc,
  creerPartie,
  enchanter,
  estCassee,
  fabriquerTorches,
  peutAcheterPioche,
  peutEnchanter,
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
  temps: number // temps de minage simulé, en secondes
  profondeurPiocheFer: number | null // profondeur à l'achat de la pioche en fer
}

// Une décision du bot avant de casser un bloc.
function jouerUnTour(etat: EtatJeu): void {
  const prochaine = PIOCHES[etat.meilleure + 1]

  // 1. Vendre quand le sac est plein.
  if (sacPlein(etat)) vendre(etat)

  // 2. Débloquer la prochaine pioche dès que possible.
  if (prochaine && peutAcheterPioche(etat, prochaine.niveau)) acheterPioche(etat, prochaine.niveau)

  // 3. Enchanter dès qu'on a les lapis et les émeraudes.
  for (const id of LISTE_ENCHANTEMENTS) {
    while (peutEnchanter(etat, id)) enchanter(etat, id)
  }

  // 4. Un plus grand sac si on a de quoi le payer deux fois.
  const prixSac = prixProchainSac(etat)
  if (prixSac !== null && etat.argent >= 2 * prixSac) acheterSac(etat)

  // 5. Des seaux d'eau avant la zone de lave.
  if (etat.profondeur >= 18 && etat.seaux < 2 && etat.argent >= 2 * PRIX_SEAU) acheterSeau(etat)

  // 6. Des torches pour y voir clair.
  if (etat.torches < 2 && quantite(etat, 'charbon') > 0) fabriquerTorches(etat)

  // 7. Réparer la pioche cassée si possible (sinon on mine à mains nues).
  if (estCassee(etat) && peutReparer(etat)) reparer(etat)
}

export function jouerPartie(aleatoire: Aleatoire, maxBlocs = 20000): ResultatBot {
  const etat = creerPartie(aleatoire)
  let profondeurPiocheFer: number | null = null

  while (!etat.victoire && etat.stats.blocsCasses < maxBlocs) {
    jouerUnTour(etat)
    if (profondeurPiocheFer === null && etat.meilleure >= 2) profondeurPiocheFer = etat.profondeur

    // Comme un joueur qui clique sur « Creuser x10 » : 10 couches d'affilée,
    // en s'arrêtant si le sac est plein (mais toujours au moins un bloc, pour
    // avancer même si le sac reste plein de lapis gardés pour les enchantements).
    for (let i = 0; i < BLOCS_PAR_SERIE && !etat.victoire && (i === 0 || !sacPlein(etat)); i++) {
      casserBloc(etat, aleatoire)
      verifierSucces(etat)
    }
  }

  return { etat, blocs: etat.stats.blocsCasses, temps: etat.stats.tempsMinage, profondeurPiocheFer }
}
