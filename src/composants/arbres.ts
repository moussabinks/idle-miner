// Les arbres de la forêt (25/10) : des arbres « sucette » au style cartoon (feuillage rond et
// plat, contour épais), dessinés en SVG par outils/art/fabriquer.mjs (voir son LISEZMOI).
// Pour chacun : la taille de l'image, le milieu de son pied (le centre de sa petite ombre) et la
// largeur de cette ombre, en pixels de l'image. Tous les arbres ont le même cadre.

import { cheminPublic } from '../chemins'

export type ImageArbre = { fichier: string; largeur: number; hauteur: number; pied: { x: number; y: number }; largeurPied: number }

const arbre = (nom: string): ImageArbre => ({
  fichier: cheminPublic(`/images/village/arbres/${nom}.svg`),
  largeur: 360,
  hauteur: 460,
  pied: { x: 180, y: 420 },
  largeurPied: 200,
})

// L'ordre compte : la forêt tire ses arbres avec des poids dans le même ordre (ForetVillage).
export const ARBRES: ImageArbre[] = [
  arbre('arbre-rond'),
  arbre('arbre-nuage'),
  arbre('arbre-sapin'),
  arbre('arbre-buisson'),
  arbre('arbre-cerisier'),
  arbre('arbre-automne'),
  arbre('arbre-palmier'),
]

// Quelques arbres par leur nom (pour les décorations et la plage).
export const ARBRE_ROND = ARBRES[0]
export const SAPIN = ARBRES[2]
export const CERISIER = ARBRES[4]
export const PALMIER = ARBRES[6]
