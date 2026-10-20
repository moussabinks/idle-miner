// Les stands du village, le long du chemin, de gauche à droite.
// Les stands sont serrés les uns contre les autres pour que les allers-retours soient rapides.
// Les positions sont en « tuiles » (une tuile = la largeur d'un pas du mineur).

import type { NomIcone } from './Icone'

// Les identifiants des stands sont définis avec la logique du jeu (objectifs.ts).
import type { IdStand } from '../jeu/objectifs'
export type { IdStand }

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
  // Le stand du personnel (son identifiant reste « employes », pour les sauvegardes) : mineurs, salaires,
  // recruteur (prestige 4) et manager (prestige 5).
  { id: 'employes', nom: 'Personnel', icone: 'employes', description: 'Embauche des mineurs qui creusent et vendent pour toi, et paie leurs salaires.', x: 19.8 },
]

// Longueur du village (en tuiles) et taille d'une tuile à l'écran (en pixels).
export const LONGUEUR_VILLAGE = 24
export const TUILE = 40

export const X_PUITS = STANDS[0].x

// Distance (en tuiles) à laquelle on est « devant » un stand.
const PORTEE_STAND = 1.4

// Le stand devant lequel se trouve le mineur (null s'il est entre deux stands).
export function standProche(x: number): Stand | null {
  return STANDS.find((stand) => Math.abs(stand.x - x) <= PORTEE_STAND) ?? null
}
