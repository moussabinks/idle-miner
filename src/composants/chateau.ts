// Où est le château de la quête finale (27/10), au fond de la carte : sur sa colline, entre les
// deux chaînes de montagnes, au bout d'un chemin qui part du coin du haut de la clairière.
// C'est seulement de l'affichage (la logique est dans src/jeu/chateau.ts).
//
// Les dessins (chateau-ruine.svg et chateau-neuf.svg) sont fabriqués par outils/art/chateau.mjs :
// une toile de 18 × 18 cases, deux fois plus grande que le monde. Sa case (0, 0) est posée sur la
// case (ORIGINE, ORIGINE) de la grille : le château est donc pile au-dessus du coin du haut de la
// clairière, sur l'axe du milieu de l'écran. (27/10) Il est tourné de 45° : sa porte est face à
// nous, et le chemin monte tout droit vers elle.

import { cheminPublic } from '../chemins'
import { versEcran, type Point } from './iso'

// Les chiffres affichés par outils/art/fabriquer.mjs (« CHÂTEAU ») : la taille du dessin, le coin du
// haut de sa toile (la case 0, 0) et le pied de sa colline (où arrive le chemin), en pixels du dessin.
export const CALAGE_CHATEAU = { largeur: 1212, hauteur: 1239, coin: { x: 606, y: 520 }, piedChemin: { x: 606, y: 1167.7 } }
export const IMAGE_CHATEAU_RUINE = cheminPublic('/images/village/chateau/chateau-ruine.svg')
export const IMAGE_CHATEAU_NEUF = cheminPublic('/images/village/chateau/chateau-neuf.svg')

// Le dessin est deux fois plus grand que le monde.
const ECHELLE = 0.5
// La case de la grille où tombe la case (0, 0) de la toile du château.
const ORIGINE = -23
// Sur la toile : le milieu du château (9, 9) et le pied de la colline, juste devant lui (17,9 ;
// 17,9 : le rayon du pied de la colline, 11,2 cases, en diagonale), voir chateau.mjs.
export const CENTRE_CHATEAU = { x: ORIGINE + 9, y: ORIGINE + 9 }
export const PIED_CHEMIN = { x: ORIGINE + 9 + 11.2 / Math.SQRT2, y: ORIGINE + 9 + 11.2 / Math.SQRT2 }

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

// Le chemin, en cases de la grille : du coin du haut de la clairière jusqu'au pied de la colline,
// presque tout droit (vers le haut de l'écran), avec une petite ondulation.
export const CHEMIN_CHATEAU: Point[] = [
  { x: 0.6, y: 0.6 },
  { x: -1.2, y: -0.9 },
  { x: -2.9, y: -2.9 },
  { x: -4.4, y: -4.7 },
  { x: PIED_CHEMIN.x + 0.05, y: PIED_CHEMIN.y + 0.05 },
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
