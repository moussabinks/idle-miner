// La vue isométrique du village (vue du ciel, à 45°) : passer d'une case de la grille à un point
// de l'image de fond, et inversement. C'est seulement de l'affichage : la logique du jeu ne
// connaît que les cases (src/jeu/village.ts).
//
// Le monde est mesuré en pixels : la clairière y est un losange (60 × 60 cases), son coin du haut
// (la case 0, 0) est en (1131 ; 57), et une case fait 33 pixels de large sur 19 de haut. Le sol
// en damier et la forêt autour sont dessinés par le jeu (TerrainVillage, ForetVillage).

import { TAILLE_GRILLE, type IdBatiment, type IdDecoration } from '../jeu/donnees'
import { porte, porteAGauche, type BatimentPose, type Case } from '../jeu/village'

// La moitié de la largeur et de la hauteur d'une case à l'écran (la taille des images des
// bâtiments est calée dessus : elle ne change pas si la clairière grandit).
export const DEMI_LARGEUR = 16.5
export const DEMI_HAUTEUR = 9.57
// Une marge autour de la clairière, à gauche et en haut.
const MARGE = { x: 141, y: 57.2 }
const ORIGINE = { x: MARGE.x + TAILLE_GRILLE * DEMI_LARGEUR, y: MARGE.y }
// La taille du monde (la clairière et ses marges), en pixels. Les mêmes chiffres sont dans
// village.css (.monde-village) : les changer ensemble.
export const LARGEUR_MONDE = 2262
export const HAUTEUR_MONDE = 1407

export type Point = { x: number; y: number }

// Jusqu'où la caméra peut aller (en pixels du monde) : la clairière et une bande de forêt tout
// autour. On ne voit jamais le bord du décor (la forêt continue bien plus loin).
export const LIMITES_CAMERA = { x0: -80, y0: -140, x1: LARGEUR_MONDE + 78, y1: HAUTEUR_MONDE - 4 }
// Le terrain dessiné (l'herbe sous la forêt) déborde largement des limites de la caméra.
export const LIMITES_TERRAIN = { x0: -700, y0: -700, x1: LARGEUR_MONDE + 700, y1: HAUTEUR_MONDE + 680 }

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
// en pixels de l'image. Les coins gauche et droit donnent sa largeur et le milieu de son pied.
// « retrait » : de combien de cases on rentre le dessin à l'intérieur de son emprise (pour qu'un
// bâtiment ne déborde pas de ses 5 × 5 cases, comme dans Clash of Clans).
type Calage = { largeur: number; hauteur: number; gauche: Point; bas: Point; droite: Point; retrait?: number }

// Les bâtiments de 5 × 5 sont dessinés un peu en retrait de leur emprise.
export const RETRAIT_BATIMENT = 0.3

export const CALAGES: Record<IdBatiment, Calage> = {
  // La mine (10 × 10) : l'image fournie, upscalée et rendue plus nette, sans la redresser (21/10).
  puits: { largeur: 2109, hauteur: 1346, gauche: { x: 9, y: 722 }, bas: { x: 1259, y: 1336 }, droite: { x: 2099, y: 766 }, retrait: 0 },
  bazar: { largeur: 1120, hauteur: 1020, gauche: { x: 2, y: 726 }, bas: { x: 458, y: 1016 }, droite: { x: 1116, y: 718 } },
  enchanteur: { largeur: 1120, hauteur: 1022, gauche: { x: 0, y: 704 }, bas: { x: 520, y: 1020 }, droite: { x: 1118, y: 678 } },
  foreuse: { largeur: 1120, hauteur: 1130, gauche: { x: 2, y: 752 }, bas: { x: 568, y: 1128 }, droite: { x: 1116, y: 792 } },
  forgeron: { largeur: 1120, hauteur: 1016, gauche: { x: 4, y: 686 }, bas: { x: 444, y: 1014 }, droite: { x: 1116, y: 706 } },
  marche: { largeur: 1120, hauteur: 914, gauche: { x: 2, y: 636 }, bas: { x: 480, y: 910 }, droite: { x: 1118, y: 562 } },
  employes: { largeur: 1120, hauteur: 1020, gauche: { x: 2, y: 670 }, bas: { x: 436, y: 1014 }, droite: { x: 1114, y: 732 } },
  prestige: { largeur: 1120, hauteur: 1030, gauche: { x: 2, y: 712 }, bas: { x: 452, y: 1026 }, droite: { x: 1114, y: 788 } },
}

// La transformation CSS (matrix) qui pose l'image sur l'emprise (x, y, taille), SANS la déformer
// (21/10) : on l'agrandit (ou la rétrécit) d'un seul coup, de façon que ses coins gauche et droit
// tombent sur la largeur de l'emprise, et que le milieu de son pied tombe au milieu de l'emprise.
// (Avant, on forçait trois coins du pied sur les coins de l'emprise : comme les dessins n'ont pas
// tous exactement le même angle, l'image était penchée et tassée.) Avec « miroir », l'image est
// retournée (la gauche passe à droite).
export function transformationSprite(calage: Calage, x: number, y: number, taille: number, miroir: boolean): string {
  const { echelle, e, f } = placementSprite(calage, x, y, taille, miroir)
  const retourne = miroir ? `matrix(-1, 0, 0, 1, ${calage.largeur}, 0)` : ''
  return `matrix(${echelle}, 0, 0, ${echelle}, ${e}, ${f}) ${retourne}`.trim()
}

// L'échelle et le décalage (e, f) de l'image posée sur son emprise.
function placementSprite(calage: Calage, x: number, y: number, taille: number, miroir: boolean): { echelle: number; e: number; f: number } {
  const r = calage.retrait ?? RETRAIT_BATIMENT
  const gauche = versEcran(x + r, y + taille - r)
  const droite = versEcran(x + taille - r, y + r)
  const echelle = (droite.x - gauche.x) / (calage.droite.x - calage.gauche.x)
  // Le milieu du pied de l'image (entre ses coins gauche et droit), retourné si besoin.
  const milieuImageX = miroir ? calage.largeur - (calage.gauche.x + calage.droite.x) / 2 : (calage.gauche.x + calage.droite.x) / 2
  const milieuImageY = (calage.gauche.y + calage.droite.y) / 2
  const milieu = versEcran(x + taille / 2, y + taille / 2)
  return { echelle, e: milieu.x - milieuImageX * echelle, f: milieu.y - milieuImageY * echelle }
}

// Où tombe, à l'écran, un point de l'image d'un bâtiment (en pixels de l'image) : pour dessiner
// par-dessus (les cages d'ascenseur de la mine, par exemple), miroir compris.
export function pointSurSprite(calage: Calage, x: number, y: number, taille: number, miroir: boolean, px: number, py: number): Point {
  const { echelle, e, f } = placementSprite(calage, x, y, taille, miroir)
  return { x: e + (miroir ? calage.largeur - px : px) * echelle, y: f + py * echelle }
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
