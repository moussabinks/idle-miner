// Où est le château de la quête finale (27/10), au fond de la carte : sur sa colline, entre les
// deux chaînes de montagnes, au bout d'un chemin qui part du coin du haut de la clairière.
// C'est seulement de l'affichage (la logique est dans src/jeu/chateau.ts).
//
// Les dessins (chateau-ruine.svg et chateau-neuf.svg) sont fabriqués par outils/art/chateau.mjs :
// une toile de 16 × 16 cases, deux fois plus grande que le monde. Sa case (0, 0) est posée sur la
// case (ORIGINE, ORIGINE) de la grille : le château est donc pile au-dessus du coin du haut de la
// clairière, sur l'axe du milieu de l'écran.

import { cheminPublic } from '../chemins'
import { versEcran, type Point } from './iso'

// Les chiffres affichés par outils/art/fabriquer.mjs (« CHÂTEAU ») : la taille du dessin, le coin du
// haut de sa toile (la case 0, 0) et le pied de sa rampe, en pixels du dessin.
export const CALAGE_CHATEAU = { largeur: 1080, hauteur: 1212, coin: { x: 540, y: 560 }, piedRampe: { x: 190.2, y: 1069.1 } }
export const IMAGE_CHATEAU_RUINE = cheminPublic('/images/village/chateau/chateau-ruine.svg')
export const IMAGE_CHATEAU_NEUF = cheminPublic('/images/village/chateau/chateau-neuf.svg')

// Le dessin est deux fois plus grand que le monde.
const ECHELLE = 0.5
// La case de la grille où tombe la case (0, 0) de la toile du château.
const ORIGINE = -22
// Sur la toile : le milieu du château (8, 8) et le pied de la rampe (8 ; 18,6) (voir chateau.mjs).
export const CENTRE_CHATEAU = { x: ORIGINE + 8, y: ORIGINE + 8 }
export const PIED_RAMPE = { x: ORIGINE + 8, y: ORIGINE + 18.6 }

export type Rectangle = { x0: number; y0: number; x1: number; y1: number }

// Le cadre du dessin, en pixels du monde.
export function cadreChateau(): Rectangle {
  const coin = versEcran(ORIGINE, ORIGINE)
  const x0 = coin.x - CALAGE_CHATEAU.coin.x * ECHELLE
  const y0 = coin.y - CALAGE_CHATEAU.coin.y * ECHELLE
  return { x0, y0, x1: x0 + CALAGE_CHATEAU.largeur * ECHELLE, y1: y0 + CALAGE_CHATEAU.hauteur * ECHELLE }
}

// Ce qui se voit vraiment du château (sa colline et ses tours), un peu plus petit que le cadre
// du dessin (qui a de la place vide autour) : rien du décor ne doit passer devant.
export function zoneChateau(): Rectangle {
  const c = cadreChateau()
  const l = c.x1 - c.x0
  const h = c.y1 - c.y0
  return { x0: c.x0 + l * 0.04, y0: c.y0 + h * 0.08, x1: c.x1 - l * 0.04, y1: c.y1 - h * 0.04 }
}

// Le chemin, en cases de la grille : du coin du haut de la clairière jusqu'au pied de la rampe.
// Il fait une grande courbe douce vers la gauche (la rampe descend vers le bas à gauche).
export const CHEMIN_CHATEAU: Point[] = [
  { x: 0.6, y: 0.6 },
  { x: -1.2, y: -0.4 },
  { x: -3.6, y: -0.9 },
  { x: -6.2, y: -1.2 },
  { x: -8.8, y: -1.9 },
  { x: -11.4, y: -2.7 },
  { x: PIED_RAMPE.x, y: PIED_RAMPE.y + 0.1 },
]

// Le cadre du chemin, en pixels du monde (avec sa largeur).
export function zoneChemin(): Rectangle {
  const points = CHEMIN_CHATEAU.map((c) => versEcran(c.x, c.y))
  const marge = 30
  return {
    x0: Math.min(...points.map((p) => p.x)) - marge,
    y0: Math.min(...points.map((p) => p.y)) - marge,
    x1: Math.max(...points.map((p) => p.x)) + marge,
    y1: Math.max(...points.map((p) => p.y)) + marge,
  }
}
