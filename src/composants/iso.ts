// La vue isométrique du village (vue du ciel, à 45°) : passer d'une case de la grille à un point
// de l'image de fond, et inversement. C'est seulement de l'affichage : la logique du jeu ne
// connaît que les cases (src/jeu/village.ts).
//
// Le monde est mesuré en pixels : la clairière y est un losange (40 × 40 cases depuis le 25/10),
// son coin du haut (la case 0, 0) est en (801 ; 57), et une case fait 33 pixels de large sur 19 de haut. Le sol
// en damier et la forêt autour sont dessinés par le jeu (TerrainVillage, ForetVillage).

import { TAILLE_GRILLE, type IdBatiment, type IdDecoration } from '../jeu/donnees'
import { batimentPose, cleCase, empriseBatiment, porte, porteAGauche, viragesDoux, type BatimentPose, type Case, type Village } from '../jeu/village'
import { cheminPublic } from '../chemins'

// La moitié de la largeur et de la hauteur d'une case à l'écran (la taille des images des
// bâtiments est calée dessus : elle ne change pas si la clairière grandit).
export const DEMI_LARGEUR = 16.5
export const DEMI_HAUTEUR = 9.57
// Une marge autour de la clairière, à gauche et en haut.
const MARGE = { x: 141, y: 57.2 }
const ORIGINE = { x: MARGE.x + TAILLE_GRILLE * DEMI_LARGEUR, y: MARGE.y }
// La taille du monde (la clairière et ses marges), en pixels. Les mêmes chiffres sont dans
// village.css (.monde-village) : les changer ensemble.
export const LARGEUR_MONDE = Math.round(2 * MARGE.x + 2 * TAILLE_GRILLE * DEMI_LARGEUR) // 1 602
export const HAUTEUR_MONDE = Math.round(MARGE.y + 2 * TAILLE_GRILLE * DEMI_HAUTEUR + 201.4) // 1 024

export type Point = { x: number; y: number }

// Jusqu'où la caméra peut aller (en pixels du monde) : la clairière et une bande de forêt tout
// autour. On ne voit jamais le bord du décor (la forêt continue bien plus loin).
// (27/10) Bien plus haut qu'avant (y0 : -140) : on monte voir le château de la quête finale, sur sa
// colline au milieu des montagnes (src/composants/chateau.ts).
export const LIMITES_CAMERA = { x0: -80, y0: -560, x1: LARGEUR_MONDE + 78, y1: HAUTEUR_MONDE - 4 }
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
// Les dessins des bâtiments (25/10 : des dessins SVG au style cartoon, fabriqués par
// outils/art/fabriquer.mjs, voir son LISEZMOI)
// ---------------------------------------------------------------------------

// Pour chaque image : sa taille, et les trois coins du sol de son dessin (gauche, bas, droite),
// en pixels de l'image. Les coins gauche et droit donnent sa largeur et le milieu de son pied.
// « retrait » : de combien de cases on rentre le dessin à l'intérieur de son emprise (pour qu'un
// bâtiment ne déborde pas de ses 5 × 5 cases, comme dans Clash of Clans).
type Calage = { largeur: number; hauteur: number; gauche: Point; bas: Point; droite: Point; retrait?: number }

// De combien de cases on rentre un bâtiment de 5 × 5 dans son emprise. Les dessins sont posés sur
// une dalle de 5 × 5 pavés : le pied de cette dalle tombe pile sur le bord de l'emprise, sans
// retrait ni débordement sur les cases voisines.
export const RETRAIT_BATIMENT = 0

// Les coins du pied de la dalle (là où elle touche l'herbe). Les dessins sont faits exactement à
// l'angle des cases, deux fois plus grands que le monde : une case y fait 66 pixels de large.
// Ces chiffres sont affichés par « node outils/art/fabriquer.mjs » : les recopier s'ils changent.
export const CALAGES: Record<IdBatiment, Calage> = {
  // La mine (10 × 10) : le puits aux parois pleines de minerais, son chevalement, la galerie. (25/10 :
  // plus de montagne au fond, le dessin reste bas pour ne pas cacher le décor derrière la mine.)
  puits: { largeur: 684, hauteur: 505, gauche: { x: 12, y: 301.4 }, bas: { x: 342, y: 492.8 }, droite: { x: 672, y: 301.4 } },
  employes: { largeur: 354, hauteur: 383, gauche: { x: 12, y: 275.7 }, bas: { x: 177, y: 371.4 }, droite: { x: 342, y: 275.7 } },
  foreuse: { largeur: 354, hauteur: 417, gauche: { x: 12, y: 309.7 }, bas: { x: 177, y: 405.4 }, droite: { x: 342, y: 309.7 } },
  forgeron: { largeur: 354, hauteur: 417, gauche: { x: 12, y: 309.7 }, bas: { x: 177, y: 405.4 }, droite: { x: 342, y: 309.7 } },
  generateur: { largeur: 354, hauteur: 403, gauche: { x: 12, y: 295.7 }, bas: { x: 177, y: 391.4 }, droite: { x: 342, y: 295.7 } },
  marche: { largeur: 354, hauteur: 393, gauche: { x: 12, y: 285.7 }, bas: { x: 177, y: 381.4 }, droite: { x: 342, y: 285.7 } },
  // (26/10) La fonderie est plus haute que les autres : sa fumée monte haut.
  fonderie: { largeur: 354, hauteur: 443, gauche: { x: 12, y: 335.7 }, bas: { x: 177, y: 431.4 }, droite: { x: 342, y: 335.7 } },
  joaillerie: { largeur: 354, hauteur: 409, gauche: { x: 12, y: 301.7 }, bas: { x: 177, y: 397.4 }, droite: { x: 342, y: 301.7 } },
}

// Les points utiles de l'image de la mine (pour ce que DessinsVillage dessine par-dessus : la
// caisse de l'ascenseur, ses câbles, le panneau du niveau), en pixels de l'image. Ils sont affichés par
// « node outils/art/fabriquer.mjs » : les recopier si on change le dessin de la mine.
export const POINTS_MINE = {
  // où est posée la caisse (son image), à sa hauteur de référence (décalage 0 : posée au sol)
  caisse: { x: 282, y: 150, largeur: 120, hauteur: 177 },
  // où les deux câbles sortent du treuil, et où ils s'accrochent à la caisse
  treuil: [
    [292.5, 165.4],
    [391.5, 165.4],
  ] as [number, number][],
  accroches: [
    [292.5, 237.4],
    [391.5, 237.4],
  ] as [number, number][],
  // où se tient un mineur dans la caisse (ses pieds), et le bord de devant de la caisse (de
  // droite à gauche) : on ne le voit qu'au-dessus de ce bord
  piedDansLaCaisse: [342, 285.4] as [number, number],
  bordCaisse: [
    [391.5, 239.4],
    [342, 268.1],
    [292.5, 239.4],
  ] as [number, number][],
  // le bord de devant du puits (là où le sol s'arrête), de gauche à droite : la caisse ne se voit
  // qu'au-dessus de ce bord (en dessous, elle est dans le puits)
  bordDuPuits: [
    [236.4, 289.4],
    [342, 350.6],
    [447.6, 289.4],
  ] as [number, number][],
  // le pied du panneau du niveau de la mine, sur le sol de devant, près de la porte
  panneau: [246.3, 406.2] as [number, number],
  // au-dessus de la roue du chevalement et de la jauge du coffre (pour la mini-jauge du déchargement)
  dessus: [342, 1.4] as [number, number],
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

// Combien de pixels du monde pour un pixel de l'image d'un bâtiment (la même partout).
export function echelleSprite(calage: Calage, taille: number): number {
  const r = calage.retrait ?? RETRAIT_BATIMENT
  return (2 * DEMI_LARGEUR * (taille - 2 * r)) / (calage.droite.x - calage.gauche.x)
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
  puits: cheminPublic('/images/batiments/mine.svg'),
  foreuse: cheminPublic('/images/batiments/foreuse.svg'),
  forgeron: cheminPublic('/images/batiments/forgeron.svg'),
  marche: cheminPublic('/images/batiments/marche.svg'),
  employes: cheminPublic('/images/batiments/employes.svg'),
  generateur: cheminPublic('/images/batiments/generateur.svg'),
  fonderie: cheminPublic('/images/batiments/fonderie.svg'),
  joaillerie: cheminPublic('/images/batiments/joaillerie.svg'),
}

// (26/10) La foreuse en marche : le même dessin, avec la mèche qui tourne (une animation dans le SVG).
export const IMAGE_FOREUSE_ACTIVE = cheminPublic('/images/batiments/foreuse-active.svg')

// (26/10) La fonderie qui fond : les flammes dansent, le creuset verse le métal dans le moule.
export const IMAGE_FONDERIE_ACTIVE = cheminPublic('/images/batiments/fonderie-active.svg')

// (28/10) Le marché retourné : son image a le « $ » de la pièce dessiné à l'envers, pour qu'il se
// lise dans le bon sens une fois le bâtiment retourné (outils/art, marche-miroir.svg).
const IMAGE_MARCHE_MIROIR = cheminPublic('/images/batiments/marche-miroir.svg')

// L'image à afficher pour un bâtiment. (25/10 : les dessins n'ont plus d'écritures, un bâtiment
// retourné (miroir) utilise donc la même image, simplement retournée ; sauf le marché, 28/10.)
export function imageBatiment(id: IdBatiment, miroir = false): string {
  if (miroir && id === 'marche') return IMAGE_MARCHE_MIROIR
  return IMAGES_BATIMENTS[id]
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
