// Ce qu'on touche sur la carte du village, et l'élément qu'on est en train de placer (ou de
// déplacer) avant de le poser : son « fantôme », vert si la place est libre, rouge sinon.

import type { TypeSol } from '../jeu/batiments'
import { BATIMENTS, type IdBatiment } from '../jeu/donnees'
import type { Case } from '../jeu/village'

// Ce qu'on touche sur la carte.
export type CibleVillage =
  | { type: 'batiment'; id: IdBatiment }
  | { type: 'rail'; x: number; y: number }
  | { type: 'chemin'; x: number; y: number }

// L'élément qu'on est en train de placer (ou de déplacer), avant de le poser.
export type Fantome =
  | { type: 'batiment'; id: IdBatiment; x: number; y: number; miroir: boolean }
  | { type: 'sol'; sol: TypeSol; x: number; y: number; de: Case | null }

export function tailleFantome(f: Fantome): number {
  if (f.type === 'batiment') return BATIMENTS[f.id].taille
  return 1
}

