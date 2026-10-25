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
  'montagne-geante': vignette('montagne-geante', 800, 685, 400, 615),
  'montagne-grande': vignette('montagne-grande', 660, 595, 330, 535),
  'montagne-double': vignette('montagne-double', 760, 575, 380, 515),
  'montagne-moyenne': vignette('montagne-moyenne', 540, 450, 270, 395),
  'montagne-petite': vignette('montagne-petite', 460, 335, 230, 285),
  'montagne-cascade': vignette('montagne-cascade', 780, 720, 390, 595),
  'montagne-grotte': vignette('montagne-grotte', 620, 550, 310, 415),
  'colline-sapins': vignette('colline-sapins', 400, 335, 200, 275),
  'colline-buisson': vignette('colline-buisson', 320, 220, 160, 170),
  'colline-grande': vignette('colline-grande', 520, 400, 260, 330),
  'colline-petite': vignette('colline-petite', 260, 155, 130, 110),
  'colline-fleurie': vignette('colline-fleurie', 360, 270, 180, 215),
  bosquet: vignette('bosquet', 280, 250, 140, 200),
  rochers: vignette('rochers', 220, 160, 110, 110),
} satisfies Record<string, Vignette>

export type SorteVignette = keyof typeof VIGNETTES

// L'eau qui tombe de la cascade, dans l'image de « montagne-cascade » (en pixels de l'image) :
// le jeu la fait couler par-dessus (voir Cascade dans ForetVillage.tsx).
export const EAU_CASCADE = { x: 270, y: 350, largeur: 40, hauteur: 243 }

// Les vignettes sont dessinées deux fois plus grandes que le monde : à l'échelle 0,5, elles ont
// la taille prévue. On les grossit ou les rapetisse un tout petit peu, pour varier.
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

// Les montagnes du fond, de la plus grande à la plus petite (hauteur au-dessus du pied, en pixels
// de l'image), et les collines.
const MONTAGNES: SorteVignette[] = ['montagne-geante', 'montagne-grande', 'montagne-double', 'montagne-moyenne', 'montagne-petite']
const COLLINES: { sorte: SorteVignette; poids: number }[] = [
  { sorte: 'colline-sapins', poids: 3 },
  { sorte: 'colline-buisson', poids: 2.5 },
  { sorte: 'colline-grande', poids: 2 },
  { sorte: 'colline-petite', poids: 2.5 },
  { sorte: 'colline-fleurie', poids: 2 },
  { sorte: 'bosquet', poids: 1.4 },
  { sorte: 'rochers', poids: 1 },
]

// Les deux montagnes posées à la main, là où on les voit bien : la cascade (au fond à gauche,
// près de la plage) et la galerie de mine (au fond à droite).
export const CASCADE: Plante = { sorte: 'montagne-cascade', x: -11.5, y: 28, echelle: ECHELLE }
const GROTTE: Plante = { sorte: 'montagne-grotte', x: 31, y: -11, echelle: ECHELLE }

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
  const zone = (p: Plante, x0: number, y0: number, x1: number, y1: number): Rectangle => {
    const image = VIGNETTES[p.sorte]
    const e = versEcran(p.x, p.y)
    const k = p.echelle
    const rectangle = { x0: e.x + (x0 - image.pied.x) * k, y0: e.y + (y0 - image.pied.y) * k, x1: e.x + (x1 - image.pied.x) * k, y1: e.y + (y1 - image.pied.y) * k }
    return { zone: rectangle, profondeur: profondeur(p.x, p.y) }
  }
  return [zone(CASCADE, 230, 300, 560, 700), zone(GROTTE, 140, 270, 470, 540)]
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
  grille(4.6, 2.4, (x, y) => {
    const d = dehors(x, y)
    if (d < 6.2 || deDevant(x, y)) return
    if (pres(x, y, CASCADE, 8) || pres(x, y, GROTTE, 7)) return
    const e = versEcran(x, y)
    const echelle = ECHELLE * (0.92 + hasard() * 0.16)
    const place = e.y - (y0 + 14) // la hauteur qu'on a au-dessus du pied, jusqu'au haut de la caméra
    const loin = d > 13
    const choix = MONTAGNES.filter((sorte) => loin || VIGNETTES[sorte].pied.y * echelle < place)
    // (un peu au hasard parmi les plus grandes qui tiennent)
    const sorte = choix[Math.min(choix.length - 1, Math.floor(hasard() * 2.2))]
    if (sorte) {
      const p = { sorte, x, y, echelle }
      if (possible(p)) plantes.push(p)
    } else {
      // Pas la place pour une montagne (tout en haut de l'écran) : une grande colline.
      const p: Plante = { sorte: 'colline-grande', x, y, echelle }
      if (possible(p)) plantes.push(p)
    }
  })

  // 2. Les collines, juste derrière la lisière, et partout devant.
  const total = COLLINES.reduce((s, c) => s + c.poids, 0)
  const tirerColline = (): SorteVignette => {
    let r = hasard() * total
    for (const c of COLLINES) {
      r -= c.poids
      if (r < 0) return c.sorte
    }
    return COLLINES[0].sorte
  }
  grille(3.1, 1.8, (x, y) => {
    const d = dehors(x, y)
    const devant = deDevant(x, y)
    if (d < 3 || (!devant && d > 9.5)) return
    if (hasard() < 0.12) return // quelques trous d'herbe
    const echelle = ECHELLE * (0.9 + hasard() * 0.25) * (devant && d > 7 ? 1.15 : 1)
    // On essaie une colline au hasard ; si elle est trop haute (devant), une plus petite.
    for (const sorte of [tirerColline(), 'colline-buisson', 'colline-petite', 'rochers'] as SorteVignette[]) {
      const p = { sorte, x, y, echelle }
      if (possible(p)) {
        plantes.push(p)
        return
      }
    }
  })

  // 3. Loin devant (en bas à droite), quelques petites montagnes, si elles ne cachent rien.
  grille(6, 3, (x, y) => {
    if (!deDevant(x, y) || y > N || dehors(x, y) < 10) return
    for (const sorte of ['montagne-moyenne', 'montagne-petite'] as SorteVignette[]) {
      const p = { sorte, x, y, echelle: ECHELLE * (0.95 + hasard() * 0.1) }
      if (possible(p)) {
        plantes.push(p)
        return
      }
    }
  })

  return plantes
}
