// Les stands du village, le long du chemin, de gauche à droite.
// Les stands sont serrés les uns contre les autres pour que les allers-retours soient rapides.
// Les positions sont en « tuiles » (une tuile = la largeur d'un pas du mineur).

import type { NomIcone } from './IconePixel'

export type IdStand = 'puits' | 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'foreuse'

export type Stand = {
  id: IdStand
  nom: string
  icone: NomIcone | null
  description: string
  x: number // position le long du chemin, en tuiles
}

export const STANDS: Stand[] = [
  { id: 'puits', nom: 'Mine', icone: null, description: "L'entrée de la mine : l'échelle et l'ascenseur pour descendre (flèche ↓).", x: 1.5 },
  { id: 'marche', nom: 'Marché', icone: 'marche', description: 'Vends tes blocs et minerais.', x: 4.5 },
  { id: 'forgeron', nom: 'Forgeron', icone: 'forgeron', description: 'Pioches et réparations.', x: 7.5 },
  { id: 'bazar', nom: 'Bazar', icone: 'bazar', description: "Sacs à dos et seaux d'eau.", x: 10.5 },
  { id: 'enchanteur', nom: 'Enchanteur', icone: 'enchanteur', description: 'Enchante tes pioches avec lapis et émeraudes.', x: 13.5 },
  { id: 'foreuse', nom: 'Foreuse', icone: 'foreuse', description: 'Elle creuse toute seule si tu lui donnes du charbon.', x: 16.8 },
]

// Longueur du village (en tuiles) et taille d'une tuile à l'écran (en pixels).
export const LONGUEUR_VILLAGE = 22
export const TUILE = 40

export const X_PUITS = STANDS[0].x

// Distance (en tuiles) à laquelle on est « devant » un stand.
const PORTEE_STAND = 1.4

// Le stand devant lequel se trouve le mineur (null s'il est entre deux stands).
export function standProche(x: number): Stand | null {
  return STANDS.find((stand) => Math.abs(stand.x - x) <= PORTEE_STAND) ?? null
}
