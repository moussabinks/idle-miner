// Le paysage autour de la clairière (25/10) : au-delà de la rangée d'arbres qui entoure le terrain,
// des collines vertes, puis des montagnes cartoon avec de la neige au sommet, des filons de
// minerais, une cascade et l'entrée d'une galerie de mine. On ne peut pas y aller : tout est hors
// de la grille.
//
// Les dessins (« vignettes ») sont des SVG fabriqués par outils/art/montagnes.mjs (voir son
// LISEZMOI). Ici, on choisit seulement où les planter : toujours aux mêmes places (hasard à graine
// fixe), le paysage ne change pas d'une partie à l'autre. ForetVillage.tsx les dessine, avec les
// arbres de la lisière, dans ses « toiles » (canvas) : une fois pour toutes, sans rien qui bouge
// (sauf l'eau de la cascade, une toute petite animation à part).
//
// Les deux grands côtés du fond (en haut à gauche et en haut à droite de l'écran) ont des
// montagnes : elles sont derrière la clairière, elles peuvent être hautes. Le côté de devant (en
// bas à droite) n'a que des collines, de plus en plus hautes en s'éloignant, pour ne jamais cacher
// la clairière. Le dernier côté (en bas à gauche) est la plage.

import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { cheminPublic } from '../chemins'
import { DEMI_LARGEUR, LIMITES_CAMERA, profondeur, versEcran, versGrille, type Point } from './iso'
import { surLaPlage } from './plage'

const N = TAILLE_GRILLE

// Une vignette : son image, sa taille et le milieu de son pied (en pixels de l'image).
export type Vignette = { fichier: string; largeur: number; hauteur: number; pied: Point }

const vignette = (nom: string, largeur: number, hauteur: number, x: number, y: number): Vignette => ({
  fichier: cheminPublic(`/images/village/paysage/${nom}.svg`),
  largeur,
  hauteur,
  pied: { x, y },
})

// Les tailles et les pieds affichés par outils/art/fabriquer.mjs (à recopier s'ils changent).
export const VIGNETTES = {
  'montagne-geante': vignette('montagne-geante', 820, 685, 410, 615),
  'montagne-geante-b': vignette('montagne-geante-b', 820, 695, 410, 625),
  'montagne-grande': vignette('montagne-grande', 680, 605, 340, 535),
  'montagne-grande-b': vignette('montagne-grande-b', 666, 585, 330, 515),
  'montagne-double': vignette('montagne-double', 776, 585, 396, 515),
  'montagne-double-b': vignette('montagne-double-b', 756, 575, 386, 505),
  'montagne-moyenne': vignette('montagne-moyenne', 576, 465, 296, 395),
  'montagne-moyenne-b': vignette('montagne-moyenne-b', 606, 445, 290, 375),
  'montagne-petite': vignette('montagne-petite', 506, 355, 266, 285),
  'montagne-petite-b': vignette('montagne-petite-b', 486, 335, 230, 265),
  'montagne-cascade': vignette('montagne-cascade', 806, 720, 416, 595),
  'montagne-grotte': vignette('montagne-grotte', 646, 550, 310, 415),
  'colline-sapins': vignette('colline-sapins', 416, 416, 200, 356),
  'colline-buisson': vignette('colline-buisson', 320, 220, 160, 170),
  'colline-grande': vignette('colline-grande', 520, 464, 260, 394),
  'colline-petite': vignette('colline-petite', 260, 155, 130, 110),
  'colline-fleurie': vignette('colline-fleurie', 360, 270, 180, 215),
  'colline-douce': vignette('colline-douce', 460, 215, 230, 150),
  'colline-large': vignette('colline-large', 800, 425, 400, 330),
  'colline-longue': vignette('colline-longue', 920, 290, 460, 200),
  bosquet: vignette('bosquet', 336, 333, 166, 283),
  rochers: vignette('rochers', 220, 160, 110, 110),
} satisfies Record<string, Vignette>

export type SorteVignette = keyof typeof VIGNETTES

// L'eau qui tombe de la cascade, dans l'image de « montagne-cascade » (en pixels de l'image) :
// le jeu la fait couler par-dessus (voir Cascade dans ForetVillage.tsx).
export const EAU_CASCADE = { x: 296, y: 350, largeur: 40, hauteur: 243 }

// Les vignettes sont dessinées deux fois plus grandes que le monde : à l'échelle 0,5, elles ont
// la taille prévue. (26/10) Toutes à la même échelle : leurs arbres ont ainsi exactement la taille
// des arbres de la lisière (avant, on les grossissait ou rapetissait un peu, pour varier).
const ECHELLE = 0.5

// Une vignette plantée : sa sorte, son pied (en cases, à virgule), son échelle.
export type Plante = { sorte: SorteVignette; x: number; y: number; echelle: number }

// De combien de cases on est sorti de la clairière.
export const dehors = (x: number, y: number) => Math.max(-x, -y, x - N, y - N)

// Le côté de devant (en bas à droite de l'écran) : ce qui y pousse passe devant la clairière.
export const deDevant = (x: number, y: number) => (x > N && y > -2) || y > N

// Le cadre d'une vignette plantée, en pixels du monde.
export function cadreDe(p: Plante): { x0: number; y0: number; x1: number; y1: number } {
  const image = VIGNETTES[p.sorte]
  const e = versEcran(p.x, p.y)
  return {
    x0: e.x - image.pied.x * p.echelle,
    y0: e.y - image.pied.y * p.echelle,
    x1: e.x + (image.largeur - image.pied.x) * p.echelle,
    y1: e.y + (image.hauteur - image.pied.y) * p.echelle,
  }
}

type Rectangle = { x0: number; y0: number; x1: number; y1: number }
const seCroisent = (a: Rectangle, b: Rectangle) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

// Les montagnes du fond (sauf les deux posées à la main), de la plus grande à la plus petite (leur
// hauteur au-dessus du pied).
const MONTAGNES = (Object.keys(VIGNETTES) as SorteVignette[])
  .filter((sorte) => sorte.startsWith('montagne-') && sorte !== 'montagne-cascade' && sorte !== 'montagne-grotte')
  .sort((a, b) => VIGNETTES[b].pied.y - VIGNETTES[a].pied.y)
// Les collines (surtout des collines toutes simples : le décor doit rester calme autour du
// village), avec leurs chances d'être tirées : juste derrière la lisière (au fond), tout près du
// bord devant, et loin devant (de grandes collines douces).
type Tirage = { sorte: SorteVignette; poids: number }[]
const COLLINES_FOND: Tirage = [
  { sorte: 'colline-douce', poids: 3 },
  { sorte: 'colline-buisson', poids: 2 },
  { sorte: 'colline-fleurie', poids: 2 },
  { sorte: 'colline-large', poids: 1.6 },
  { sorte: 'colline-sapins', poids: 0.7 },
  { sorte: 'colline-grande', poids: 1 },
  { sorte: 'colline-longue', poids: 1 },
  { sorte: 'colline-petite', poids: 0.8 },
  { sorte: 'bosquet', poids: 0.4 },
  { sorte: 'rochers', poids: 0.4 },
]
const COLLINES_DEVANT_PRES: Tirage = [
  { sorte: 'colline-douce', poids: 3 },
  { sorte: 'colline-longue', poids: 2 },
  { sorte: 'colline-buisson', poids: 2 },
  { sorte: 'colline-fleurie', poids: 2 },
  { sorte: 'colline-petite', poids: 0.8 },
  { sorte: 'rochers', poids: 0.4 },
]
const COLLINES_DEVANT_LOIN: Tirage = [
  { sorte: 'colline-large', poids: 3 },
  { sorte: 'colline-longue', poids: 3 },
  { sorte: 'colline-douce', poids: 2 },
  { sorte: 'colline-grande', poids: 1 },
  { sorte: 'colline-sapins', poids: 0.6 },
  { sorte: 'bosquet', poids: 0.3 },
]
// Si la colline tirée est trop haute (devant), on essaie celles-ci, de plus en plus basses.
const PLUS_BASSES: SorteVignette[] = ['colline-longue', 'colline-buisson', 'colline-petite']

// Les deux montagnes posées à la main, là où on les voit bien : la cascade (au fond à gauche,
// près de la plage) et la galerie de mine (loin devant, à droite).
export const CASCADE: Plante = { sorte: 'montagne-cascade', x: -11.5, y: 28, echelle: ECHELLE }
const GROTTE: Plante = { sorte: 'montagne-grotte', x: 53, y: 15, echelle: ECHELLE }

// Où est l'eau qui tombe, en pixels du monde.
export function eauDeLaCascade(): Rectangle {
  const image = VIGNETTES[CASCADE.sorte]
  const e = versEcran(CASCADE.x, CASCADE.y)
  const k = CASCADE.echelle
  const x0 = e.x + (EAU_CASCADE.x - image.pied.x) * k
  const y0 = e.y + (EAU_CASCADE.y - image.pied.y) * k
  return { x0, y0, x1: x0 + EAU_CASCADE.largeur * k, y1: y0 + EAU_CASCADE.hauteur * k }
}

// Ce qu'il faut garder visible devant les deux montagnes posées à la main (rien ne pousse devant) :
// la cascade et son bassin, l'entrée de la galerie, ses rails et son wagonnet.
function zonesAGarder(): { zone: Rectangle; profondeur: number }[] {
  const zone = (p: Plante, x0: number, y0: number, x1: number, y1: number) => {
    const image = VIGNETTES[p.sorte]
    const e = versEcran(p.x, p.y)
    const k = p.echelle
    const rectangle = { x0: e.x + (x0 - image.pied.x) * k, y0: e.y + (y0 - image.pied.y) * k, x1: e.x + (x1 - image.pied.x) * k, y1: e.y + (y1 - image.pied.y) * k }
    return { zone: rectangle, profondeur: profondeur(p.x, p.y) }
  }
  return [zone(CASCADE, 256, 300, 586, 700), zone(GROTTE, 140, 270, 470, 540)]
}

// Le bas de l'écran le plus haut où peut monter une vignette de devant, au point x du monde : la
// ligne des pieds des arbres de la lisière (un peu derrière), pour ne jamais cacher la clairière.
function plafondDevant(px: number): number {
  const X = N + 1.9
  const y = X - (px - versEcran(0, 0).x) / DEMI_LARGEUR
  if (y < -3 || y > N + 3) return -Infinity
  return versEcran(X, y).y
}

export function planterPaysage(): Plante[] {
  const hasard = aleatoireAvecGraine(1789)
  const { x0, y0, x1, y1 } = LIMITES_CAMERA
  // Ce que la caméra peut voir, avec une marge (une vignette qui dépasse à peine est gardée).
  const vue: Rectangle = { x0: x0 - 40, y0: y0 - 20, x1: x1 + 40, y1: y1 + 40 }
  const garder = zonesAGarder()
  const plantes: Plante[] = [CASCADE, GROTTE]

  // Peut-on planter cette vignette ici ?
  const possible = (p: Plante): boolean => {
    const cadre = cadreDe(p)
    if (!seCroisent(cadre, vue)) return false
    // Pas sur la plage ni dans la mer : ni le pied, ni les deux bouts du pied.
    const e = versEcran(p.x, p.y)
    const demi = (VIGNETTES[p.sorte].largeur / 2) * p.echelle * 0.8
    const basImage = e.y + (VIGNETTES[p.sorte].hauteur - VIGNETTES[p.sorte].pied.y) * p.echelle * 0.5
    for (const [px, py] of [
      [e.x, basImage],
      [e.x - demi, e.y],
      [e.x + demi, e.y],
    ]) {
      const g = versGrille(px, py)
      if (surLaPlage(g.x, g.y + 0.4)) return false
    }
    // Rien devant la cascade ni devant la galerie.
    if (garder.some((g) => profondeur(p.x, p.y) > g.profondeur - 300 && seCroisent(g.zone, cadre))) return false
    // Devant la clairière : jamais plus haut que le pied des arbres de la lisière.
    if (deDevant(p.x, p.y)) {
      const plafond = Math.max(plafondDevant(cadre.x0 + 10), plafondDevant(cadre.x1 - 10), plafondDevant((cadre.x0 + cadre.x1) / 2))
      if (cadre.y0 + 12 * p.echelle < plafond) return false
    }
    return true
  }

  // Un point sur une grille un peu bousculée (pour qu'on ne devine pas de quadrillage).
  const coins = [versGrille(x0, y0), versGrille(x1, y0), versGrille(x0, y1), versGrille(x1, y1)]
  const minX = Math.floor(Math.min(...coins.map((c) => c.x))) - 8
  const maxX = Math.ceil(Math.max(...coins.map((c) => c.x))) + 8
  const minY = Math.floor(Math.min(...coins.map((c) => c.y))) - 8
  const maxY = Math.ceil(Math.max(...coins.map((c) => c.y))) + 8
  const grille = (pas: number, bouge: number, faire: (x: number, y: number) => void) => {
    for (let gx = minX; gx < maxX; gx += pas) {
      for (let gy = minY; gy < maxY; gy += pas) faire(gx + (hasard() - 0.5) * bouge, gy + (hasard() - 0.5) * bouge)
    }
  }
  const pres = (x: number, y: number, p: Plante, distance: number) => Math.hypot(p.x - x, p.y - y) < distance

  // 1. Les montagnes, au fond (à partir de 6 cases de la clairière). Les plus proches gardent
  // leur sommet enneigé à l'écran : on prend la plus grande qui tient sous le haut de la caméra.
  // (26/10) Deux fois moins de montagnes qu'avant (une tous les 8 cases au lieu de 5,6) : entre
  // elles, des collines (étape 2).
  grille(8, 3, (x, y) => {
    const d = dehors(x, y)
    if (d < 6.2 || deDevant(x, y)) return
    if (pres(x, y, CASCADE, 9) || pres(x, y, GROTTE, 8)) return
    const e = versEcran(x, y)
    const echelle = ECHELLE
    const place = e.y - (y0 + 14) // la hauteur qu'on a au-dessus du pied, jusqu'au haut de la caméra
    const loin = d > 13
    const choix = MONTAGNES.filter((sorte) => loin || VIGNETTES[sorte].pied.y * echelle < place)
    // (au hasard parmi les cinq plus grandes qui tiennent)
    const sorte = choix[Math.min(choix.length - 1, Math.floor(hasard() * 5))]
    if (sorte) {
      const p = { sorte, x, y, echelle }
      if (possible(p)) plantes.push(p)
    } else {
      // Pas la place pour une montagne (tout en haut de l'écran) : une grande colline.
      const p: Plante = { sorte: 'colline-grande', x, y, echelle }
      if (possible(p)) plantes.push(p)
    }
  })

  // 2. Les collines : juste derrière la lisière (au fond, entre les arbres et les montagnes), et
  // partout devant, de plus en plus grandes en s'éloignant.
  const tirer = (tirage: Tirage): SorteVignette => {
    let r = hasard() * tirage.reduce((somme, c) => somme + c.poids, 0)
    for (const c of tirage) {
      r -= c.poids
      if (r < 0) return c.sorte
    }
    return tirage[0].sorte
  }
  const planterColline = (x: number, y: number, tirage: Tirage, echelle: number) => {
    for (const sorte of [tirer(tirage), ...PLUS_BASSES]) {
      const p = { sorte, x, y, echelle }
      if (possible(p)) {
        plantes.push(p)
        return
      }
    }
  }
  grille(3.5, 1.8, (x, y) => {
    const d = dehors(x, y)
    if (d < 3 || d > 9.5 || deDevant(x, y) || hasard() < 0.2) return
    planterColline(x, y, COLLINES_FOND, ECHELLE)
  })
  grille(5, 2.2, (x, y) => {
    const d = dehors(x, y)
    if (d < 3 || !deDevant(x, y) || hasard() < 0.12) return
    planterColline(x, y, d < 7 ? COLLINES_DEVANT_PRES : COLLINES_DEVANT_LOIN, ECHELLE)
  })

  // 3. Loin devant, tout à droite (après le coin de droite de la clairière), quelques petites
  // montagnes, si elles ne cachent rien.
  let montagnesDevant = 0
  grille(7, 3, (x, y) => {
    if (montagnesDevant >= 3 || !deDevant(x, y) || y > N || dehors(x, y) < 14 || versEcran(x, y).x < versEcran(N, 0).x + 60) return
    const b = hasard() < 0.5 ? '-b' : ''
    for (const sorte of [`montagne-moyenne${b}`, `montagne-petite${b}`] as SorteVignette[]) {
      const p = { sorte, x, y, echelle: ECHELLE }
      if (possible(p)) {
        plantes.push(p)
        montagnesDevant += 1
        return
      }
    }
  })

  return plantes
}
