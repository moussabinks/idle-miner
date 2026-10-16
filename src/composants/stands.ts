// Les stands du village, à la surface, de gauche à droite.
// Le puits est tout à gauche, juste au-dessus de l'échelle de la mine.

import type { NomIcone } from './IconePixel'

export type IdStand = 'puits' | 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'foreuse'

export type Stand = { id: IdStand; nom: string; icone: NomIcone | null; description: string }

export const STANDS: Stand[] = [
  { id: 'puits', nom: 'Puits', icone: null, description: "L'échelle qui descend dans la mine (flèche ↓)." },
  { id: 'marche', nom: 'Marché', icone: 'marche', description: 'Vends tes blocs et minerais.' },
  { id: 'forgeron', nom: 'Forgeron', icone: 'forgeron', description: 'Achète et répare tes pioches.' },
  { id: 'bazar', nom: 'Bazar', icone: 'bazar', description: "Sacs à dos, seaux d'eau et torches." },
  { id: 'enchanteur', nom: 'Enchanteur', icone: 'enchanteur', description: 'Enchante tes pioches avec lapis et émeraudes.' },
  { id: 'foreuse', nom: 'Foreuse', icone: 'foreuse', description: 'Elle creuse toute seule si tu lui donnes du charbon.' },
]

export const POSITION_PUITS = 0
