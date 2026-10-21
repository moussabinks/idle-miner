// La forme de la plage (22/10), en bas à gauche de la clairière (voir PlageVillage.tsx). On
// mesure en « cases au-delà du bord » : d = y - TAILLE_GRILLE.

import { TAILLE_GRILLE } from '../jeu/donnees'

const N = TAILLE_GRILLE

// Le rivage (où la mer commence), en cases au-delà du bord, selon x : une côte qui ondule
// doucement, et qui s'écarte vers le bas après le coin du bas (la forêt reprend à droite).
export function distanceRivage(x: number): number {
  const vague = 0.45 * Math.sin(0.31 * x) + 0.3 * Math.sin(0.83 * x + 1.3)
  const apresLeCoin = Math.max(0, x - (N - 3)) * 1.25
  return 4.8 + vague + apresLeCoin
}

// Où le sable commence : au bord de la clairière le long de la grille, et en une bande plus
// étroite au pied de la forêt, au-delà des deux coins.
export function distanceSable(x: number): number {
  const etroit = distanceRivage(x) - 2
  const versDehors = x < 0 ? Math.min(1, -x / 2.5) : x > N ? Math.min(1, (x - N) / 2.5) : 0
  return 0.12 + (etroit - 0.12) * versDehors
}

// Un arbre de la forêt planté là serait-il sur la plage (ou dans l'eau) ? Alors on ne le plante pas.
export function surLaPlage(x: number, y: number): boolean {
  return y - N > distanceSable(x) - 0.35
}

