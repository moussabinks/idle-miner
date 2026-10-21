// La vue isométrique du village (vue du ciel, à 45°) : passer d'une case de la grille à un point
// de l'image de fond, et inversement. C'est seulement de l'affichage : la logique du jeu ne
// connaît que les cases (src/jeu/village.ts).
//
// Le monde est mesuré en pixels : la clairière y est un losange, son coin du haut (la case 0, 0)
// est en (801 ; 57), et une case fait 33 pixels de large sur 19 de haut (40 cases d'un coin à
// l'autre). Le sol en damier et la forêt autour sont dessinés par le jeu (TerrainVillage).

import { TAILLE_GRILLE, type IdBatiment, type IdDecoration } from '../jeu/donnees'
import { porte, porteAGauche, type BatimentPose, type Case } from '../jeu/village'

export const LARGEUR_MONDE = 1536
export const HAUTEUR_MONDE = 1024
const ORIGINE = { x: 801, y: 57.2 }
// La moitié de la largeur et de la hauteur d'une case à l'écran.
export const DEMI_LARGEUR = 660 / TAILLE_GRILLE
export const DEMI_HAUTEUR = 382.8 / TAILLE_GRILLE

export type Point = { x: number; y: number }

// Jusqu'où la caméra peut aller (en pixels du monde) : la clairière et une bande de forêt tout
// autour. On ne voit jamais le bord du décor (la forêt continue bien plus loin).
export const LIMITES_CAMERA = { x0: -80, y0: -140, x1: 1680, y1: 1020 }
// Le terrain dessiné (la forêt qui se répète) déborde largement des limites de la caméra.
export const LIMITES_TERRAIN = { x0: -700, y0: -700, x1: 2300, y1: 1700 }

// Une position sur la grille (en cases, à virgule) → un point de l'image du monde (en pixels).
export function versEcran(x: number, y: number): Point {
  return { x: ORIGINE.x + (x - y) * DEMI_LARGEUR, y: ORIGINE.y + (x + y) * DEMI_HAUTEUR }
}

// Un point de l'image du monde → une position sur la grille (à virgule).
export function versGrille(px: number, py: number): Point {
  const a = (px - ORIGINE.x) / DEMI_LARGEUR
  const b = (py - ORIGINE.y) / DEMI_HAUTEUR
  return { x: (a + b) / 2, y: (b - a) / 2 }
}

// Le losange d'une emprise (pour la dessiner en SVG) : « x1,y1 x2,y2 ... ».
export function losange(x: number, y: number, taille: number): string {
  return [versEcran(x, y), versEcran(x + taille, y), versEcran(x + taille, y + taille), versEcran(x, y + taille)].map((p) => `${p.x},${p.y}`).join(' ')
}

// La profondeur d'un objet pour l'ordre d'affichage : plus il est bas sur l'écran (plus près de
// nous), plus il passe devant. On prend la somme x + y de son centre.
export function profondeur(x: number, y: number): number {
  return Math.round((x + y) * 100)
}

// ---------------------------------------------------------------------------
// Les dessins des bâtiments (des images en vue isométrique, upscalées par IA le 21/10)
// ---------------------------------------------------------------------------

// Pour chaque image : sa taille, et les trois coins du sol de son dessin (gauche, bas, droite),
// en pixels de l'image. On déforme très légèrement l'image pour que ces trois coins tombent
// pile sur les coins de l'emprise du bâtiment (5 × 5 cases) : le dessin colle à la grille.
// « retrait » : de combien de cases on rentre le dessin à l'intérieur de son emprise (pour qu'un
// bâtiment ne déborde pas de ses 5 × 5 cases, comme dans Clash of Clans).
type Calage = { largeur: number; hauteur: number; gauche: Point; bas: Point; droite: Point; retrait?: number }

// Les bâtiments de 5 × 5 sont dessinés un peu en retrait de leur emprise.
export const RETRAIT_BATIMENT = 0.3

export const CALAGES: Record<IdBatiment, Calage> = {
  // La mine (10 × 10) : l'image fournie, redressée pour que son emprise soit déjà un losange du jeu.
  puits: { largeur: 1680, hauteur: 1004, gauche: { x: 40, y: 500 }, bas: { x: 840, y: 964 }, droite: { x: 1640, y: 500 }, retrait: 0 },
  bazar: { largeur: 1120, hauteur: 1020, gauche: { x: 2, y: 726 }, bas: { x: 458, y: 1016 }, droite: { x: 1116, y: 718 } },
  enchanteur: { largeur: 1120, hauteur: 1022, gauche: { x: 0, y: 704 }, bas: { x: 520, y: 1020 }, droite: { x: 1118, y: 678 } },
  foreuse: { largeur: 1120, hauteur: 1130, gauche: { x: 2, y: 752 }, bas: { x: 568, y: 1128 }, droite: { x: 1116, y: 792 } },
  forgeron: { largeur: 1120, hauteur: 1016, gauche: { x: 4, y: 686 }, bas: { x: 444, y: 1014 }, droite: { x: 1116, y: 706 } },
  marche: { largeur: 1120, hauteur: 914, gauche: { x: 2, y: 636 }, bas: { x: 480, y: 910 }, droite: { x: 1118, y: 562 } },
  employes: { largeur: 1120, hauteur: 1020, gauche: { x: 2, y: 670 }, bas: { x: 436, y: 1014 }, droite: { x: 1114, y: 732 } },
  prestige: { largeur: 1120, hauteur: 1030, gauche: { x: 2, y: 712 }, bas: { x: 452, y: 1026 }, droite: { x: 1114, y: 788 } },
}

// La transformation CSS (matrix) qui pose l'image sur l'emprise (x, y, taille) : les trois coins du
// sol de l'image vont sur les coins gauche, bas et droit de l'emprise. Avec « miroir », l'image
// est retournée (le coin gauche de l'image va à droite).
export function transformationSprite(calage: Calage, x: number, y: number, taille: number, miroir: boolean): string {
  const g = miroir ? { x: calage.largeur - calage.droite.x, y: calage.droite.y } : calage.gauche
  const b = miroir ? { x: calage.largeur - calage.bas.x, y: calage.bas.y } : calage.bas
  const d = miroir ? { x: calage.largeur - calage.gauche.x, y: calage.gauche.y } : calage.droite
  const r = calage.retrait ?? RETRAIT_BATIMENT
  const G = versEcran(x + r, y + taille - r)
  const B = versEcran(x + taille - r, y + taille - r)
  const D = versEcran(x + taille - r, y + r)
  // On cherche a, b, c, d, e, f tels que : X = a·u + c·v + e et Y = b·u + d·v + f
  // pour les trois couples de points (u, v) → (X, Y).
  const det = g.x * (b.y - d.y) - g.y * (b.x - d.x) + (b.x * d.y - d.x * b.y)
  const resoudre = (p: number, q: number, r: number) => {
    // Coefficients (m1, m2, m3) tels que m1·u + m2·v + m3 = valeur, pour les trois points.
    const m1 = (p * (b.y - d.y) - g.y * (q - r) + (q * d.y - r * b.y)) / det
    const m2 = (g.x * (q - r) - p * (b.x - d.x) + (b.x * r - d.x * q)) / det
    const m3 = (g.x * (b.y * r - d.y * q) - g.y * (b.x * r - d.x * q) + p * (b.x * d.y - d.x * b.y)) / det
    return [m1, m2, m3]
  }
  const [a, c, e] = resoudre(G.x, B.x, D.x)
  const [bb, dd, f] = resoudre(G.y, B.y, D.y)
  const retourne = miroir ? `matrix(-1, 0, 0, 1, ${calage.largeur}, 0)` : ''
  // D'abord le miroir (dans l'image), puis la mise en place (dans le monde).
  return `matrix(${a}, ${bb}, ${c}, ${dd}, ${e}, ${f}) ${retourne}`.trim()
}

export const IMAGES_BATIMENTS: Record<IdBatiment, string> = {
  puits: '/images/batiments/mine.webp',
  bazar: '/images/batiments/bazar.webp',
  enchanteur: '/images/batiments/enchanteur.webp',
  foreuse: '/images/batiments/foreuse.webp',
  forgeron: '/images/batiments/forgeron.webp',
  marche: '/images/batiments/marche.webp',
  employes: '/images/batiments/employes.webp',
  prestige: '/images/batiments/prestige.webp',
}

// La hauteur (en pixels) de ce qui dépasse au-dessus d'une décoration (pour sa boîte SVG).
export function hauteurDecoration(id: IdDecoration): number {
  if (id === 'arbre' || id === 'cerisier' || id === 'sapin') return 100
  if (id === 'statue') return 100
  if (id === 'fontaine' || id === 'lanterne') return 70
  return 36
}

// ---------------------------------------------------------------------------
// Les personnages : où ils se tiennent, et dans quel sens ils regardent
// ---------------------------------------------------------------------------

// Une position le long d'un chemin (une liste de cases), à une distance donnée depuis le début.
export function surLeChemin(points: Case[], distance: number): { x: number; y: number; dx: number; dy: number } {
  const centres = points.map((c) => ({ x: c.x + 0.5, y: c.y + 0.5 }))
  if (centres.length === 0) return { x: 0, y: 0, dx: 0, dy: 1 }
  let reste = Math.max(0, distance)
  for (let i = 1; i < centres.length; i++) {
    const a = centres[i - 1]
    const b = centres[i]
    const longueur = Math.hypot(b.x - a.x, b.y - a.y)
    if (reste <= longueur) {
      const k = longueur === 0 ? 0 : reste / longueur
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: b.x - a.x, dy: b.y - a.y }
    }
    reste -= longueur
  }
  const dernier = centres[centres.length - 1]
  const avant = centres[centres.length - 2] ?? dernier
  return { x: dernier.x, y: dernier.y, dx: dernier.x - avant.x, dy: dernier.y - avant.y }
}

// Où se tient quelqu'un devant un bâtiment : le long de sa face avant (rang 0 = juste devant la
// porte, puis de chaque côté), un peu plus loin pour les rangs suivants.
export function devant(b: BatimentPose, place: number, recul = 0.8): { x: number; y: number } {
  const p = porte(b)
  const decalage = (place % 2 === 0 ? 1 : -1) * Math.ceil(place / 2) * 0.9
  const rang = Math.floor(place / 6)
  if (porteAGauche(b)) return { x: p.x + decalage, y: p.y + recul - 0.5 + rang * 0.9 }
  return { x: p.x + recul - 0.5 + rang * 0.9, y: p.y + decalage }
}

// L'orientation d'un personnage qui va dans la direction (dx, dy) de la grille.
export function orienter(dx: number, dy: number): { sens: 1 | -1; vue: 'face' | 'dos' } {
  return { sens: dx - dy >= 0 ? 1 : -1, vue: dx + dy < 0 ? 'dos' : 'face' }
}
