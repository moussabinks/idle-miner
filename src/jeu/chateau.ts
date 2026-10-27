// La quête finale (27/10, demandé par le propriétaire) : au fond de la carte, entre les deux
// chaînes de montagnes, un château en ruine attend depuis le début de la partie. Le restaurer coûte
// 20 millions (PRIX_CHATEAU) : c'est l'objectif de fin du jeu. Une fois payé, le château devient
// flambant neuf (une grande animation et des feux d'artifice), et la partie continue.
//
// On peut toucher le château à tout moment pour voir son prix. La quête, elle, n'apparaît dans la
// liste des tâches qu'à la fin du jeu : la mine au niveau 7 et tous les bâtiments posés (pas besoin
// d'avoir tout amélioré).

import { LISTE_BATIMENTS, NIVEAU_MINE_MAX, PRIX_CHATEAU } from './donnees'
import type { EtatJeu } from './mineur'
import { batimentPose } from './village'

export function chateauRestaure(etat: EtatJeu): boolean {
  return etat.chateau?.restaure === true
}

// La fin du jeu approche : la mine tout au fond, et tous les bâtiments posés.
export function finDuJeuProche(etat: EtatJeu): boolean {
  return etat.niveauMine >= NIVEAU_MINE_MAX && batimentPose(etat.village, 'puits') !== null && LISTE_BATIMENTS.every((id) => batimentPose(etat.village, id) !== null)
}

// La quête se montre dans la liste des tâches (tant que le château n'est pas restauré).
export function queteChateauVisible(etat: EtatJeu): boolean {
  return finDuJeuProche(etat) && !chateauRestaure(etat)
}

export function peutRestaurerChateau(etat: EtatJeu): boolean {
  return !chateauRestaure(etat) && etat.argent >= PRIX_CHATEAU
}

export function restaurerChateau(etat: EtatJeu): string[] {
  if (!peutRestaurerChateau(etat)) return []
  etat.argent -= PRIX_CHATEAU
  etat.chateau = { restaure: true, tempsDeJeu: etat.stats.tempsDeJeu }
  // (pas de message : la grande animation, les feux d'artifice et la fenêtre de victoire le disent)
  return []
}
