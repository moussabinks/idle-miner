// La forme de la plage (22/10), en bas à gauche de la clairière (voir PlageVillage.tsx). On
// mesure en « cases au-delà du bord » : d = y - TAILLE_GRILLE.

import { TAILLE_GRILLE } from '../jeu/donnees'
import { versEcran } from './iso'

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

// Un point au-delà du bord de la clairière (x, d cases plus bas) → un point du monde.
const ecranPlage = (x: number, d: number) => versEcran(x, N + d)

// Où il se passe quelque chose sur la plage (l'eau qui bouge, les objets animés), en pixels du
// monde : des rectangles le long de la côte, morceau par morceau (la plage est en diagonale, un
// seul rectangle couvrirait presque toute la carte). Quand la caméra n'en voit aucun, le village
// met ces animations en pause (27/10) : elles faisaient travailler le navigateur pour rien.
export type Rectangle = { x0: number; y0: number; x1: number; y1: number }
export const BOITES_PLAGE: Rectangle[] = Array.from({ length: 24 }, (_, i) => {
  const debut = -16 + i * 3.5
  const coins = [ecranPlage(debut, 0), ecranPlage(debut + 3.5, 0), ecranPlage(debut, 24), ecranPlage(debut + 3.5, 24)]
  return {
    x0: Math.min(...coins.map((c) => c.x)),
    x1: Math.max(...coins.map((c) => c.x)),
    y0: Math.min(...coins.map((c) => c.y)) - 60, // (les palmiers dépassent vers le haut)
    y1: Math.max(...coins.map((c) => c.y)),
  }
})
