// La vue isométrique du village (vue du ciel, à 45°) : passer d'une case de la grille à un point
// de l'image de fond, et inversement. C'est seulement de l'affichage : la logique du jeu ne
// connaît que les cases (src/jeu/village.ts).
//
// Le monde est mesuré en pixels : la clairière y est un losange (60 × 60 cases), son coin du haut
// (la case 0, 0) est en (1131 ; 57), et une case fait 33 pixels de large sur 19 de haut. Le sol
// en damier et la forêt autour sont dessinés par le jeu (TerrainVillage, ForetVillage).

import { TAILLE_GRILLE, type IdBatiment, type IdDecoration } from '../jeu/donnees'
import { batimentPose, cleCase, empriseBatiment, porte, porteAGauche, viragesDoux, type BatimentPose, type Case, type Village } from '../jeu/village'

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

// De combien de cases on rentre un bâtiment de 5 × 5 dans son emprise. Depuis le 22/10, les dessins
// de l'équipe sont posés sur une dalle de 5 × 5 pavés : le pied de cette dalle tombe pile sur le
// bord de l'emprise, sans retrait ni débordement sur les cases voisines.
export const RETRAIT_BATIMENT = 0

// Les coins mesurés sont ceux du pied de la dalle de pavés (là où elle touche l'herbe), mesurés
// par un script sur les images détourées (22/10).
export const CALAGES: Record<IdBatiment, Calage> = {
  // La mine (10 × 10, 22/10) : le dessin de l'équipe, vu plus d'en haut que les autres, remis à
  // l'angle du jeu par un script (le sol est ramené à l'angle des cases, les poteaux et les murs
  // du puits gardent leur hauteur). Le pied de son losange tombe pile sur ses 10 × 10 cases.
  puits: { largeur: 1233, hauteur: 774, gauche: { x: 3, y: 403.4 }, bas: { x: 625, y: 765.4 }, droite: { x: 1225, y: 418.6 } },
  bazar: { largeur: 1037, hauteur: 945, gauche: { x: 2, y: 652 }, bas: { x: 520, y: 942 }, droite: { x: 1034, y: 653 } },
  employes: { largeur: 1074, hauteur: 1046, gauche: { x: 2, y: 724 }, bas: { x: 530, y: 1043 }, droite: { x: 1071, y: 726 } },
  foreuse: { largeur: 971, hauteur: 913, gauche: { x: 2, y: 608 }, bas: { x: 483, y: 910 }, droite: { x: 968, y: 612 } },
  forgeron: { largeur: 1091, hauteur: 994, gauche: { x: 2, y: 670 }, bas: { x: 546, y: 991 }, droite: { x: 1088, y: 673 } },
  generateur: { largeur: 1107, hauteur: 1040, gauche: { x: 2, y: 708 }, bas: { x: 553, y: 1037 }, droite: { x: 1104, y: 711 } },
  marche: { largeur: 1089, hauteur: 1027, gauche: { x: 2, y: 703 }, bas: { x: 512, y: 1024 }, droite: { x: 1073, y: 702 } },
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
  foreuse: '/images/batiments/foreuse.webp',
  forgeron: '/images/batiments/forgeron.webp',
  marche: '/images/batiments/marche.webp',
  employes: '/images/batiments/employes.webp',
  generateur: '/images/batiments/generateur.webp',
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

// Une position le long d'une trace (des points de la grille, à virgule), à une distance donnée.
export function surLaTrace(points: { x: number; y: number }[], distance: number): { x: number; y: number; dx: number; dy: number } {
  return surLeChemin(
    points.map((p) => ({ x: p.x - 0.5, y: p.y - 0.5 })),
    distance,
  )
}

export function longueurTrace(points: { x: number; y: number }[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  return total
}

// La trace d'un wagonnet sur une ligne de rails (23/10) : il part du bord du bâtiment de départ
// (la mine, par exemple), suit le milieu de la voie (tout droit au centre des cases, en quart de
// cercle dans les virages, comme le dessin des rails ; un grand quart de cercle sur trois cases
// dans les virages doux), et arrive au bord du bâtiment d'arrivée.
export function traceDeLaVoie(village: Village, ligne: Case[], depart: IdBatiment = 'puits', arrivee: IdBatiment = 'marche'): { x: number; y: number }[] {
  const dans = (id: IdBatiment, c: Case) => {
    const b = batimentPose(village, id)
    if (!b) return false
    const e = empriseBatiment(b)
    return c.x >= e.x && c.y >= e.y && c.x < e.x + e.taille && c.y < e.y + e.taille
  }
  const voisins = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ]
  // Le côté de la case qui donne vers la case précédente (ou la mine) et vers la suivante (ou le marché).
  const cote = (c: Case, vers: Case | IdBatiment, sens: 1 | -1) => {
    if (typeof vers !== 'string') return { x: Math.sign(vers.x - c.x), y: Math.sign(vers.y - c.y) }
    return voisins.find((d) => dans(vers, { x: c.x + d.x, y: c.y + d.y })) ?? { x: 0, y: sens }
  }
  const trace: { x: number; y: number }[] = []
  // Les virages doux (sur trois cases) : la case du coin, et les cases de ses deux bras.
  const doux = new Map(viragesDoux(village).map((v) => [cleCase(v.coin.x, v.coin.y), v]))
  const sauter = new Set<number>() // les cases déjà faites par un virage doux
  ligne.forEach((c, i) => {
    if (sauter.has(i)) return
    // Un virage doux : la case d'avant, le coin, la case d'après forment un grand quart de cercle
    // (rayon 1,5 case) autour du coin de leur carré de 2 × 2 cases.
    const coinDoux = i + 1 < ligne.length - 1 ? doux.get(cleCase(ligne[i + 1].x, ligne[i + 1].y)) : undefined
    if (coinDoux) {
      const k = ligne[i + 1]
      const centreK = { x: k.x + 0.5, y: k.y + 0.5 }
      const da = { x: c.x - k.x, y: c.y - k.y }
      const db = { x: ligne[i + 2].x - k.x, y: ligne[i + 2].y - k.y }
      const debut = { x: centreK.x + 1.5 * da.x, y: centreK.y + 1.5 * da.y }
      const fin = { x: centreK.x + 1.5 * db.x, y: centreK.y + 1.5 * db.y }
      const centre = { x: centreK.x + 1.5 * (da.x + db.x), y: centreK.y + 1.5 * (da.y + db.y) }
      if (i === 0) trace.push(debut)
      const a = { x: debut.x - centre.x, y: debut.y - centre.y }
      const b = { x: fin.x - centre.x, y: fin.y - centre.y }
      for (let n = 1; n <= 18; n++) {
        const angle = (n / 18) * (Math.PI / 2)
        trace.push({ x: centre.x + a.x * Math.cos(angle) + b.x * Math.sin(angle), y: centre.y + a.y * Math.cos(angle) + b.y * Math.sin(angle) })
      }
      sauter.add(i + 1)
      sauter.add(i + 2)
      return
    }
    const entree = cote(c, i > 0 ? ligne[i - 1] : depart, -1)
    const sortie = cote(c, i < ligne.length - 1 ? ligne[i + 1] : arrivee, 1)
    const centre = { x: c.x + 0.5, y: c.y + 0.5 }
    const bordEntree = { x: centre.x + entree.x * 0.5, y: centre.y + entree.y * 0.5 }
    const bordSortie = { x: centre.x + sortie.x * 0.5, y: centre.y + sortie.y * 0.5 }
    if (i === 0) trace.push(bordEntree)
    if (entree.x === -sortie.x && entree.y === -sortie.y) {
      trace.push(centre, bordSortie)
      return
    }
    // Un virage : un quart de cercle de rayon 0,5 autour du coin commun aux deux côtés.
    const coin = { x: centre.x + (entree.x + sortie.x) * 0.5, y: centre.y + (entree.y + sortie.y) * 0.5 }
    for (let k = 1; k <= 6; k++) {
      const angle = (k / 6) * (Math.PI / 2)
      const a = { x: bordEntree.x - coin.x, y: bordEntree.y - coin.y }
      const b = { x: bordSortie.x - coin.x, y: bordSortie.y - coin.y }
      trace.push({ x: coin.x + a.x * Math.cos(angle) + b.x * Math.sin(angle), y: coin.y + a.y * Math.cos(angle) + b.y * Math.sin(angle) })
    }
  })
  return trace
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
