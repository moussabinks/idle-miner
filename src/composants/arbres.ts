// Les 12 arbres de la forêt (21/10) : les dessins fournis par l'équipe, upscalés par IA et détourés.
// Pour chacun : la taille de l'image, le milieu de son pied (la petite dalle d'herbe où il pousse)
// et la largeur de cette dalle, en pixels de l'image. Mesurés par un script, à refaire si on
// change les images.

import { cheminPublic } from '../chemins'

export type ImageArbre = { fichier: string; largeur: number; hauteur: number; pied: { x: number; y: number }; largeurPied: number }

export const ARBRES: ImageArbre[] = [
  { fichier: cheminPublic('/images/village/arbres/arbre01.webp'), largeur: 612, hauteur: 645, pied: { x: 321, y: 527 }, largeurPied: 333 },
  { fichier: cheminPublic('/images/village/arbres/arbre02.webp'), largeur: 597, hauteur: 645, pied: { x: 307, y: 528 }, largeurPied: 333 },
  { fichier: cheminPublic('/images/village/arbres/arbre03.webp'), largeur: 600, hauteur: 645, pied: { x: 298, y: 528 }, largeurPied: 329 },
  { fichier: cheminPublic('/images/village/arbres/arbre04.webp'), largeur: 600, hauteur: 640, pied: { x: 308, y: 523 }, largeurPied: 328 },
  { fichier: cheminPublic('/images/village/arbres/arbre05.webp'), largeur: 612, hauteur: 648, pied: { x: 322, y: 528 }, largeurPied: 336 },
  { fichier: cheminPublic('/images/village/arbres/arbre06.webp'), largeur: 597, hauteur: 648, pied: { x: 308, y: 529 }, largeurPied: 336 },
  { fichier: cheminPublic('/images/village/arbres/arbre07.webp'), largeur: 600, hauteur: 648, pied: { x: 298, y: 529 }, largeurPied: 331 },
  { fichier: cheminPublic('/images/village/arbres/arbre08.webp'), largeur: 600, hauteur: 648, pied: { x: 310, y: 533 }, largeurPied: 321 },
  { fichier: cheminPublic('/images/village/arbres/arbre09.webp'), largeur: 612, hauteur: 638, pied: { x: 324, y: 519 }, largeurPied: 337 },
  { fichier: cheminPublic('/images/village/arbres/arbre10.webp'), largeur: 597, hauteur: 638, pied: { x: 308, y: 520 }, largeurPied: 334 },
  { fichier: cheminPublic('/images/village/arbres/arbre11.webp'), largeur: 600, hauteur: 638, pied: { x: 295, y: 523 }, largeurPied: 331 },
  { fichier: cheminPublic('/images/village/arbres/arbre12.webp'), largeur: 600, hauteur: 638, pied: { x: 308, y: 522 }, largeurPied: 327 },
]
