// La mine (10 × 10 cases) : un puits carré au milieu, entouré de poutres, un chevalement en bois
// (deux poteaux, une poutre, deux lanternes, une grande roue et le treuil). Les parois du puits
// sont pleines de minerais et de cristaux. Tout le reste reste bas (25/10 : plus de grosse
// montagne au fond, qui cachait le décor derrière la mine) : à gauche, une petite butte de rochers
// avec l'entrée d'une galerie, sa voie et un wagonnet plein de minerais ; au fond, un tas de
// rochers à minerais et à cristaux ; devant, un coffre au trésor ; à droite, la cabane à outils,
// un rocher à cristaux, des tonneaux et des caisses.
//
// Les minerais ont la forme des icônes du jeu (minerai() dans formes.mjs) : un caillou, un
// morceau de charbon, (26/10) du fer et de l'or bruts (un caillou à grosses pépites), des cristaux
// de redstone, des émeraudes, des saphirs, des rubis et des diamants (plus des petits cubes) ; un
// lingot d'or dans le coffre au trésor.
//
// Le jeu dessine par-dessus (src/composants/DessinsVillage.tsx, DessinEvolutionMine) : les câbles
// qui tombent du treuil, la caisse de l'ascenseur qui monte et descend dans le puits, puis le
// calque « mine-devant » (les poutres du bord de devant du puits) qui passe devant la caisse.
// Tous ces dessins ont le même cadre que mine.svg (les mêmes pixels) ; les points utiles (où
// sortent les câbles, le bord du puits...) sont renvoyés dans « points ».

import { C, DX, DY, TRAIT, TRAIT_FIN, Toile, clair, fonce, hasardAvecGraine, minerai, polygone, r1, rocher, teintes } from './formes.mjs'

const TAILLE = 10
const HAUT = 110 // la place au-dessus du coin du haut (pour la roue du chevalement)
const SOL = 12 // l'épaisseur de la dalle : le sol de la mine est à cette hauteur
// Le puits : de 3,4 à 6,6 cases, dans les deux sens.
const P0 = 3.4
const P1 = 6.6
const POUTRE = 0.35 // la largeur des poutres du bord
const Z_POUTRE = SOL + 12
// Le chevalement.
const Z_TRAVERSE = 176 // le bas de la grande poutre du haut
const Z_TREUIL = 152 // le milieu du treuil (sous la poutre)
const R_TREUIL = 16
// La caisse de l'ascenseur : un carré de 1,5 case au milieu du puits, haute de 50 pixels. À sa
// hauteur de référence (décalage 0), elle est posée au niveau du sol.
const K0 = 4.25
const K1 = 5.75
const HAUTEUR_CAISSE = 50

const bois = teintes(C.bois, C.boisFonce)

// Une nouvelle toile dans le cadre de la mine.
const toileMine = () => new Toile({ taille: TAILLE, haut: HAUT })

// Les poutres du bord du puits : celles du fond (derrière la caisse) et celles de devant.
function poutresDuFond(t) {
  t.boite(P0 - POUTRE, P0 - POUTRE, P1, P0, SOL, Z_POUTRE, bois)
  t.boite(P0 - POUTRE, P0, P0, P1, SOL, Z_POUTRE, bois)
}
function poutresDeDevant(t) {
  t.boite(P0, P1, P1, P1 + POUTRE, SOL, Z_POUTRE, bois)
  t.boite(P1, P0, P1 + POUTRE, P1 + POUTRE, SOL, Z_POUTRE, bois)
  // Les clous aux coins.
  for (const [x, y] of [
    [P0 + 0.25, P1 + POUTRE],
    [P1 - 0.25, P1 + POUTRE],
  ]) {
    const [cx, cy] = t.pt(x, y, (SOL + Z_POUTRE) / 2)
    t.ajouter(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="3" fill="${C.encre}"/>`)
  }
}

// ---------------------------------------------------------------------------
// Les petits dessins de la mine
// ---------------------------------------------------------------------------

// Un filon : deux ou trois minerais (en vraies formes, voir minerai()) serrés les uns contre les
// autres, au point (x, y, z) de la mine. k : la taille (1 : des minerais de 24 pixels).
function filon(t, x, y, z, sortes, k = 1, graine = 1) {
  const [cx, cy] = t.pt(x, y, z)
  const hasard = hasardAvecGraine(graine)
  const places = [
    [0, 0, 24],
    [16, 8, 19],
    [-15, 9, 17],
  ]
  sortes.forEach((sorte, i) => {
    const [dx, dy, taille] = places[i % places.length]
    t.ajouter(minerai(sorte, cx + dx * k, cy + dy * k, taille * k, (hasard() - 0.5) * 40))
  })
}

// Un tas de minerais (en vraies formes), posé à la hauteur z sur le carré (x0, y0) - (x1, y1) :
// plus haut au milieu, dessiné du fond vers l'avant. « pas » : l'écart entre deux minerais (en
// cases), « taille » : leur largeur (en pixels), « bosse » : de combien le milieu monte.
function tasDeMinerais(t, x0, y0, x1, y1, z, sortes, graine, { pas = 0.3, taille = 26, bosse = 16 } = {}) {
  const hasard = hasardAvecGraine(graine)
  const tas = []
  const nx = Math.max(1, Math.round((x1 - x0) / pas))
  const ny = Math.max(1, Math.round((y1 - y0) / pas))
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x = x0 + (i + 0.5) * ((x1 - x0) / nx) + (hasard() - 0.5) * pas * 0.4
      const y = y0 + (j + 0.5) * ((y1 - y0) / ny) + (hasard() - 0.5) * pas * 0.4
      // Plus haut au milieu : un petit tas bombé.
      const milieu = Math.max(0, 1 - Math.hypot((i - (nx - 1) / 2) / (nx / 2), (j - (ny - 1) / 2) / (ny / 2)))
      tas.push({ x, y, z: z + milieu * bosse, sorte: sortes[Math.floor(hasard() * sortes.length)], angle: (hasard() - 0.5) * 50 })
    }
  }
  // Un dernier minerai tout en haut du tas.
  tas.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: z + bosse + 8, sorte: sortes[sortes.length - 1], angle: -8 })
  tas.sort((a, b) => a.x + a.y + a.z / 60 - (b.x + b.y + b.z / 60))
  for (const m of tas) {
    const [px, py] = t.pt(m.x, m.y, m.z)
    t.ajouter(minerai(m.sorte, px, py - taille * 0.3, taille * (0.9 + hasard() * 0.2), m.angle))
  }
}

// Un cristal : un prisme à six faces, pointu, qui sort de la roche (penché de « penche » cases).
function cristal(t, x, y, z, rayon, hauteur, penche, couleur) {
  const [dx, dy] = penche
  const hexagone = (cx, cy, zz) => Array.from({ length: 6 }, (_, i) => [cx + rayon * Math.cos((i / 6) * 2 * Math.PI + Math.PI / 4), cy + rayon * Math.sin((i / 6) * 2 * Math.PI + Math.PI / 4), zz])
  const sommets = [...hexagone(x, y, z), ...hexagone(x + dx, y + dy, z + hauteur), [x + dx * 1.3, y + dy * 1.3, z + hauteur * 1.35]]
  const faces = [[0, 1, 2, 3, 4, 5]]
  for (let i = 0; i < 6; i++) {
    faces.push([i, (i + 1) % 6, 6 + ((i + 1) % 6), 6 + i])
    faces.push([6 + i, 6 + ((i + 1) % 6), 12])
  }
  t.volume(sommets, faces, teintes(couleur, fonce(couleur, 0.3), clair(couleur, 0.45)), { trait: TRAIT_FIN })
  // Un reflet blanc sur la face éclairée.
  const [ax, ay] = t.pt(x - rayon * 0.35, y + rayon * 0.35, z + hauteur * 0.2)
  const [bx, by] = t.pt(x + dx - rayon * 0.35, y + dy + rayon * 0.35, z + hauteur * 0.9)
  t.ajouter(`<path d="M${r1(ax)} ${r1(ay)} L${r1(bx)} ${r1(by)}" stroke="${C.blanc}" stroke-width="4" opacity="0.8"/>`)
}

// Une grappe de trois cristaux de la même couleur (k : la taille).
function grappe(t, x, y, z, couleur, k = 1) {
  cristal(t, x + 0.2 * k, y - 0.2 * k, z, 0.13 * k, 30 * k, [0.16 * k, -0.12 * k], couleur)
  cristal(t, x - 0.2 * k, y + 0.2 * k, z, 0.14 * k, 34 * k, [-0.14 * k, 0.14 * k], couleur)
  cristal(t, x, y, z, 0.19 * k, 52 * k, [0.02 * k, 0.04 * k], couleur)
}

// Une étincelle (une étoile à quatre branches) : les cristaux brillent.
function etincelle(t, x, y, z, k = 1, couleur = C.blanc) {
  const [ex, ey] = t.pt(x, y, z)
  t.ajouter(
    `<path d="M${r1(ex)} ${r1(ey - 11 * k)} L${r1(ex + 3 * k)} ${r1(ey - 3 * k)} L${r1(ex + 11 * k)} ${r1(ey)} L${r1(ex + 3 * k)} ${r1(ey + 3 * k)} L${r1(ex)} ${r1(ey + 11 * k)} L${r1(ex - 3 * k)} ${r1(ey + 3 * k)} L${r1(ex - 11 * k)} ${r1(ey)} L${r1(ex - 3 * k)} ${r1(ey - 3 * k)} Z" fill="${couleur}" stroke="${C.encre}" stroke-width="3"/>`,
  )
}

// Une courbe toute ronde qui passe par tous ces points (en pixels du dessin) : un chemin SVG
// (des courbes de Bézier calculées à la façon de Catmull-Rom). « ferme » : on revient au début.
export function courbeRonde(liste, ferme = false) {
  const n = liste.length
  const pris = (i) => (ferme ? liste[(i + n) % n] : liste[Math.max(0, Math.min(n - 1, i))])
  let d = `M${r1(liste[0][0])} ${r1(liste[0][1])}`
  const fin = ferme ? n : n - 1
  for (let i = 0; i < fin; i++) {
    const [a, b, c, e] = [pris(i - 1), pris(i), pris(i + 1), pris(i + 2)]
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6]
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6]
    d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(c[0])} ${r1(c[1])}`
  }
  return ferme ? d + ' Z' : d
}

// Une butte de rochers toute ronde (pour l'entrée de la galerie) : son contour passe par ces
// points [x, y, hauteur] (en cases, en pixels au-dessus du sol), de son pied à gauche jusqu'à son
// pied à droite. Comme les rochers du village : le corps un peu à l'ombre, un grand reflet plus
// clair en haut à gauche. Elle reste basse : elle ne doit rien cacher derrière la mine.
function butte(t, contour3d, eclats = []) {
  const contour = contour3d.map(([x, y, z]) => t.pt(x, y, SOL + z))
  const centre = contour.reduce((s, [x, y]) => [s[0] + x / contour.length, s[1] + y / contour.length], [0, 0])
  const reflet = contour.map(([x, y]) => [centre[0] - 16 + (x - centre[0]) * 0.8, centre[1] - 20 + (y - centre[1]) * 0.8])
  const chemin = courbeRonde(contour, true)
  const id = t.nouvelId('butte')
  t.defs.push(`<clipPath id="${id}"><path d="${chemin}"/></clipPath>`)
  t.ajouter(`<path d="${chemin}" fill="${fonce(C.pierre, 0.24)}"/>`)
  t.ajouter(`<path d="${courbeRonde(reflet, true)}" fill="${C.pierre}" clip-path="url(#${id})"/>`)
  for (const [x, y, z, l, h] of eclats) {
    const [ex, ey] = t.pt(x, y, SOL + z)
    t.ajouter(`<ellipse cx="${r1(ex)}" cy="${r1(ey)}" rx="${l}" ry="${h}" fill="${clair(C.pierre, 0.45)}" transform="rotate(-18 ${r1(ex)} ${r1(ey)})" clip-path="url(#${id})"/>`)
  }
  t.ajouter(`<path d="${chemin}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
}

// Une lanterne accrochée (le point d'accroche en x, y, z) : son crochet, son halo, sa flamme.
function lanterne(t, x, y, z) {
  const [lx, ly] = t.pt(x, y, z)
  t.ajouter(`<circle cx="${r1(lx)}" cy="${r1(ly + 22)}" r="21" fill="${C.jaune}" opacity="0.35"/>`)
  t.ajouter(`<path d="M${r1(lx)} ${r1(ly)} L${r1(lx)} ${r1(ly + 9)}" stroke="${C.encre}" stroke-width="4"/>`)
  t.ajouter(`<path d="M${r1(lx - 9)} ${r1(ly + 14)} L${r1(lx)} ${r1(ly + 7)} L${r1(lx + 9)} ${r1(ly + 14)} Z" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  t.ajouter(`<rect x="${r1(lx - 8)}" y="${r1(ly + 14)}" width="16" height="19" rx="4" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  t.ajouter(`<path d="M${r1(lx)} ${r1(ly + 19)} Q${r1(lx + 4)} ${r1(ly + 25)} ${r1(lx)} ${r1(ly + 29)} Q${r1(lx - 4)} ${r1(ly + 25)} ${r1(lx)} ${r1(ly + 19)} Z" fill="${C.orange}"/>`)
  t.ajouter(`<rect x="${r1(lx - 9)}" y="${r1(ly + 32)}" width="18" height="5" rx="2" fill="${C.charbon}" stroke="${C.encre}" stroke-width="3"/>`)
}

// Un buisson tout rond (trois boules vertes), posé au sol en (x, y).
function buisson(t, x, y, k = 1) {
  const [bx, by] = t.pt(x, y, SOL)
  for (const [dx, dy, r] of [
    [-13, -10, 13],
    [13, -10, 12],
    [0, -20, 15],
  ]) {
    t.ajouter(`<circle cx="${r1(bx + dx * k)}" cy="${r1(by + dy * k)}" r="${r1(r * k)}" fill="${C.feuillage}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  t.ajouter(`<circle cx="${r1(bx - 4 * k)}" cy="${r1(by - 25 * k)}" r="${r1(4 * k)}" fill="${C.herbeClaire}"/>`)
}

// Un coffre au trésor ouvert, plein de pièces d'or et de pierres précieuses : son coin du fond
// en (x0, y0), 1,2 case de long (dans le sens des x) sur 0,75 de large.
function coffreTresor(t, x0, y0) {
  const [x1, y1, z0, z1] = [x0 + 1.2, y0 + 0.75, SOL, SOL + 30]
  // Le couvercle ouvert, penché vers le fond (on voit son dedans, plus sombre).
  t.poly(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y0 - 0.34, z1 + 38],
      [x0, y0 - 0.34, z1 + 38],
    ],
    fonce(C.boisFonce, 0.25),
  )
  t.boite(x0, y0, x1, y1, z0, z1, teintes(C.bois, C.boisFonce))
  // Les ferrures dorées sur les deux faces qu'on voit, et la serrure.
  for (const x of [x0 + 0.15, x1 - 0.15]) t.ligne([x, y1, z0 + 2], [x, y1, z1 - 1], fonce(C.or, 0.15), 5)
  t.ligne([x1, y1 - 0.12, z0 + 2], [x1, y1 - 0.12, z1 - 1], fonce(C.or, 0.3), 5)
  const [sx, sy] = t.pt((x0 + x1) / 2, y1, z1 - 8)
  t.ajouter(`<rect x="${r1(sx - 5)}" y="${r1(sy - 4)}" width="10" height="11" rx="2" fill="${C.or}" stroke="${C.encre}" stroke-width="3"/>`)
  // Le tas de pièces d'or, bombé, et des pierres précieuses dessus.
  const [cx, cy] = t.pt((x0 + x1) / 2, (y0 + y1) / 2, z1)
  for (const [dx, dy] of [
    [-27, 3],
    [-13, 7],
    [1, 8],
    [15, 6],
    [28, 2],
    [-20, -5],
    [-6, -3],
    [8, -3],
    [22, -6],
    [-12, -12],
    [3, -12],
    [15, -14],
    [-3, -20],
  ]) {
    t.ajouter(`<ellipse cx="${r1(cx + dx)}" cy="${r1(cy + dy)}" rx="9" ry="6.5" fill="${C.or}" stroke="${C.encre}" stroke-width="3"/>`)
  }
  t.ajouter(minerai('lingotOr', cx - 24, cy - 10, 24, -12)) // (26/10)
  t.ajouter(minerai('redstone', cx - 16, cy - 20, 20, -14))
  t.ajouter(minerai('diamant', cx + 10, cy - 26, 28, 8))
  t.ajouter(minerai('emeraude', cx + 28, cy - 12, 19, 18))
  // Deux pièces tombées par terre.
  for (const [x, y] of [
    [x1 + 0.2, y1 + 0.1],
    [x0 + 0.1, y1 + 0.3],
  ]) {
    const [px, py] = t.pt(x, y, SOL)
    t.ajouter(`<ellipse cx="${r1(px)}" cy="${r1(py)}" rx="7" ry="4.5" fill="${C.or}" stroke="${C.encre}" stroke-width="3"/>`)
  }
}

// Un wagonnet sur une voie qui va dans le sens des y (son milieu en x, y) : une caisse en métal
// plus large en haut, ses roues, et un tas de minerais (de l'or, des diamants, des émeraudes...).
function wagonnet(t, x, y) {
  const [w0, w1, wy0, wy1, zw0, zw1] = [x - 0.55, x + 0.55, y - 0.65, y + 0.65, SOL + 14, SOL + 50]
  const metal = teintes('#7c82a3', '#5d6283', fonce('#5d6283', 0.4))
  // les roues du côté caché, puis la caisse, puis les roues de devant
  for (const yy of [wy0 + 0.32, wy1 - 0.32]) {
    const [ex, ey] = t.pt(w1 - 0.12, yy, SOL + 12)
    t.ajouter(`<circle cx="${r1(ex)}" cy="${r1(ey)}" r="9" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  t.volume(
    [
      [w0 + 0.1, wy0 + 0.1, zw0],
      [w1 - 0.1, wy0 + 0.1, zw0],
      [w1 - 0.1, wy1 - 0.1, zw0],
      [w0 + 0.1, wy1 - 0.1, zw0],
      [w0, wy0, zw1],
      [w1, wy0, zw1],
      [w1, wy1, zw1],
      [w0, wy1, zw1],
    ],
    [
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ],
    metal,
  )
  // une bande orange tout autour du haut
  t.surFace('droite', w1, wy1, zw1 - 14, `<rect x="4" y="-8" width="${r1((wy1 - wy0) * 38.15 - 8)}" height="7" rx="3" fill="${fonce(C.orange, 0.2)}" stroke="${C.encre}" stroke-width="3"/>`)
  t.surFace('gauche', w0, wy1, zw1 - 14, `<rect x="4" y="-8" width="${r1((w1 - w0) * 38.15 - 8)}" height="7" rx="3" fill="${C.orange}" stroke="${C.encre}" stroke-width="3"/>`)
  for (const yy of [wy0 + 0.32, wy1 - 0.32]) {
    const [ex, ey] = t.pt(w1 - 0.05, yy, SOL + 12)
    t.ajouter(`<circle cx="${r1(ex)}" cy="${r1(ey)}" r="10" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/><circle cx="${r1(ex)}" cy="${r1(ey)}" r="3.5" fill="${C.metal}"/>`)
  }
  tasDeMinerais(t, w0 + 0.1, wy0 + 0.1, w1 - 0.1, wy1 - 0.1, zw1 - 4, ['or', 'emeraude', 'redstone', 'or', 'diamant'], 9, { pas: 0.36, taille: 24, bosse: 12 })
  etincelle(t, x - 0.3, y - 0.5, zw1 + 46, 0.9)
}

// Le fond de la mine : tout, sauf ce qui bouge.
function fond() {
  const t = toileMine()
  // Le sol de la mine : de la terre battue (pas des pavés), avec des petits cailloux.
  t.boite(0, 0, TAILLE, TAILLE, 0, SOL, teintes('#dcc398', fonce('#c2a57a', 0.15), '#dcc398'))
  const hasard = hasardAvecGraine(77)
  for (let i = 0; i < 46; i++) {
    const x = 0.4 + hasard() * (TAILLE - 0.8)
    const y = 0.4 + hasard() * (TAILLE - 0.8)
    if (x > P0 - 0.8 && x < P1 + 0.8 && y > P0 - 0.8 && y < P1 + 0.8) continue
    const [px, py] = t.pt(x, y, SOL)
    t.ajouter(`<ellipse cx="${r1(px)}" cy="${r1(py)}" rx="${r1(4 + hasard() * 4)}" ry="${r1(2.5 + hasard() * 2)}" fill="#c2a57a"/>`)
  }

  const roche = (x, y, l, h, graine) => {
    const [px, py] = t.pt(x, y, SOL)
    t.ajouter(rocher(px, py, l, h, graine, C.pierre))
  }
  // Au fond, de chaque côté, sous la poutre du chevalement : deux rochers bien bas (25/10 : plus
  // de montagne, qui cachait tout le décor), pleins de filons de minerais. (Le coin tout au fond
  // est caché par le chevalement : on n'y met rien.)
  roche(1.7, 3.75, 70, 42, 41)
  filon(t, 1.7, 3.7, SOL + 24, ['or', 'or'], 0.9, 3)
  roche(3.75, 1.7, 64, 40, 45)
  filon(t, 3.75, 1.65, SOL + 22, ['emeraude', 'redstone'], 0.85, 4)
  etincelle(t, 1.0, 3.0, SOL + 68, 0.85)
  etincelle(t, 3.1, 1.0, SOL + 58, 0.7, C.jaune)

  // À gauche : une petite butte de rochers, basse et toute ronde, avec l'entrée d'une galerie.
  butte(
    t,
    [
      [0, 7.05, 0],
      [0, 6.75, 46],
      [0.02, 6.25, 84],
      [0.2, 5.65, 98],
      [0.45, 5.15, 86],
      [0.85, 4.75, 92],
      [1.45, 4.6, 64],
      [2.05, 4.85, 34],
      [2.4, 5.45, 10],
      [2.3, 6.3, 0],
      [1.2, 7.05, 0],
    ],
    [[0.3, 5.5, 88, 24, 9]],
  )
  filon(t, 0.95, 4.95, SOL + 62, ['diamant', 'charbon'], 0.9, 7)
  filon(t, 1.9, 5.3, SOL + 24, ['or', 'redstone'], 0.85, 8)

  // L'entrée de la galerie, dans la butte : un trou noir dans la roche, tenu par un cadre en
  // bois, et des rails qui en sortent.
  const [ga0, ga1, yGalerie, zGalerie] = [0.1, 1.5, 6.7, 64]
  const largeurGalerie = (ga1 - ga0) * 38.15
  t.surFace(
    'gauche',
    ga0,
    yGalerie,
    SOL,
    // le noir de la galerie, voûté
    `<path d="M8 0 V${-zGalerie + 22} Q${r1(largeurGalerie / 2)} ${-zGalerie - 14} ${r1(largeurGalerie - 8)} ${-zGalerie + 22} V0 Z" fill="${C.encre}"/>` +
      // les poteaux et le linteau du cadre
      `<rect x="0" y="${-zGalerie + 4}" width="11" height="${zGalerie - 4}" rx="2" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<rect x="${r1(largeurGalerie - 11)}" y="${-zGalerie + 4}" width="11" height="${zGalerie - 4}" rx="2" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<rect x="-6" y="${-zGalerie - 8}" width="${r1(largeurGalerie + 12)}" height="13" rx="3" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      // deux yeux qui brillent dans le noir (une taupe au travail !)
      `<circle cx="${r1(largeurGalerie / 2 - 6)}" cy="-28" r="3.6" fill="${C.jaune}"/><circle cx="${r1(largeurGalerie / 2 + 6)}" cy="-28" r="3.6" fill="${C.jaune}"/>`,
  )
  // La voie qui sort de la galerie et descend vers le devant de la mine.
  const [rv0, rv1, xv] = [yGalerie + 0.05, 9.7, (ga0 + ga1) / 2]
  for (let y = rv0 + 0.18; y < rv1; y += 0.42) t.boite(xv - 0.55, y - 0.09, xv + 0.55, y + 0.09, SOL, SOL + 4, teintes(C.bois, C.boisFonce), { trait: TRAIT_FIN })
  for (const x of [xv - 0.3, xv + 0.3]) t.boite(x - 0.05, rv0, x + 0.05, rv1, SOL + 4, SOL + 9, teintes(C.metal, fonce(C.metal, 0.3), clair(C.metal, 0.4)), { trait: TRAIT_FIN })
  t.boite(xv - 0.6, rv1 - 0.25, xv + 0.6, rv1, SOL, SOL + 16, teintes(C.toit, fonce(C.toit, 0.22)), { trait: TRAIT_FIN })
  // Le wagonnet, plein à ras bord de minerais et de pierres précieuses.
  wagonnet(t, xv, 8.65)
  // Une lanterne accrochée au linteau de la galerie.
  lanterne(t, ga1 + 0.05, yGalerie + 0.05, SOL + zGalerie + 6)

  // Un buisson à côté de la galerie (un peu de vert, comme le village autour).
  buisson(t, 2.4, 6.6, 0.9)

  // La cabane à outils, à droite au fond : sa porte et son pignon sur la façade de gauche.
  const planches = teintes(C.bois, C.boisFonce)
  const [c0, c1, d0, d1, zc] = [7.0, 9.1, 0.8, 2.6, 70]
  t.boite(c0, d0, c1, d1, SOL, zc, planches)
  t.poly(
    [
      [c0, d1, zc],
      [c1, d1, zc],
      [(c0 + c1) / 2, d1, zc + 34],
    ],
    planches.gauche,
  )
  const faceCabane = (c1 - c0) * 38.15
  t.surFace(
    'gauche',
    c0,
    d1,
    SOL,
    `<path d="M30 0 V-36 A11 11 0 0 1 52 -36 V0 Z" fill="${fonce(C.boisFonce, 0.3)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      [12, 66].map((u) => `<path d="M${u} -4 V-50" stroke="${C.boisFonce}" stroke-width="3"/>`).join('') +
      // deux pioches croisées, dans le pignon
      `<g transform="translate(${r1(faceCabane / 2)} -74)">` +
      `<path d="M-11 11 L11 -11 M11 11 L-11 -11" stroke="${C.encre}" stroke-width="9"/><path d="M-11 11 L11 -11 M11 11 L-11 -11" stroke="${C.bois}" stroke-width="4"/>` +
      `<path d="M3 -17 Q13 -15 17 -3 M-3 -17 Q-13 -15 -17 -3" stroke="${C.encre}" stroke-width="9" fill="none"/><path d="M3 -17 Q13 -15 17 -3 M-3 -17 Q-13 -15 -17 -3" stroke="${C.metal}" stroke-width="4" fill="none"/></g>`,
  )
  t.toit(c0 - 0.15, d0 - 0.15, c1 + 0.15, d1 + 0.15, zc - 4, zc + 38, 'y', teintes(C.toit, fonce(C.toit, 0.22), C.toit))
  // Une pioche posée contre la cabane.
  t.poutre([9.2, 1.4, SOL], [9.2, 2.1, 52], C.bois, 5)
  const [pxp, pyp] = t.pt(9.2, 2.1, 52)
  const pioche = `M${r1(pxp - 17)} ${r1(pyp + 12)} Q${r1(pxp - 2)} ${r1(pyp - 10)} ${r1(pxp + 17)} ${r1(pyp - 2)}`
  t.ajouter(`<path d="${pioche}" stroke="${C.encre}" stroke-width="${6 + 2 * TRAIT}" fill="none"/><path d="${pioche}" stroke="${C.metal}" stroke-width="6" fill="none"/>`)

  // Le puits : un trou tout noir, ses deux parois du fond (en roche, pleines de minerais et de
  // cristaux : on a envie d'y descendre !), une planche tout en haut, et ses poutres.
  const trou = [t.pt(P0, P0, SOL), t.pt(P1, P0, SOL), t.pt(P1, P1, SOL), t.pt(P0, P1, SOL)]
  t.ajouter(polygone(trou, C.encre, 0))
  const idTrou = t.nouvelId('trou')
  t.defs.push(`<clipPath id="${idTrou}"><polygon points="${trou.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}"/></clipPath>`)
  let parois = ''
  const PROFOND = -140
  const paroi = (a, b, couleur) => {
    parois += polygone([t.pt(...a, SOL), t.pt(...b, SOL), t.pt(...b, PROFOND), t.pt(...a, PROFOND)], couleur, TRAIT_FIN)
  }
  const ROCHE_CLAIRE = '#7d7092'
  const ROCHE_SOMBRE = '#5f5376'
  paroi([P0, P0], [P1, P0], ROCHE_CLAIRE)
  paroi([P0, P0], [P0, P1], ROCHE_SOMBRE)
  // Le bas des parois se perd dans le noir : une bande plus sombre, puis le noir du trou.
  for (const [a, b] of [
    [
      [P0, P0],
      [P1, P0],
    ],
    [
      [P0, P0],
      [P0, P1],
    ],
  ]) {
    parois += polygone([t.pt(...a, -96), t.pt(...b, -96), t.pt(...b, PROFOND), t.pt(...a, PROFOND)], fonce(ROCHE_SOMBRE, 0.45), 0)
  }
  // Des fentes dans la roche.
  for (const ligne of [
    [
      [4.6, P0, -6],
      [4.9, P0, -26],
      [4.75, P0, -48],
    ],
    [
      [P0, 4.7, -10],
      [P0, 4.95, -34],
    ],
    [
      [3.9, P0, -44],
      [4.2, P0, -58],
    ],
  ]) {
    const p = ligne.map(([x, y, z]) => t.pt(x, y, z))
    parois += `<polyline points="${p.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="none" stroke="${fonce(ROCHE_SOMBRE, 0.35)}" stroke-width="3"/>`
  }
  // La planche qui tient le haut des parois.
  for (const [a, b, couleur] of [
    [[P0, P0], [P1, P0], fonce(C.bois, 0.2)],
    [[P0, P0], [P0, P1], fonce(C.boisFonce, 0.2)],
  ]) {
    parois += polygone([t.pt(...a, SOL - 2), t.pt(...b, SOL - 2), t.pt(...b, SOL - 14), t.pt(...a, SOL - 14)], couleur, TRAIT_FIN)
  }
  // Les minerais dans les parois (de la forme des icônes du jeu), du haut vers le bas.
  const dansLaParoi = (x, y, z, sorte, taille, angle) => {
    const [px, py] = t.pt(x, y, z)
    parois += minerai(sorte, px, py, taille, angle)
  }
  for (const [x, y, z, sorte, taille, angle] of [
    // la paroi de droite (au fond à droite)
    [3.85, P0, -24, 'or', 26, -10],
    [4.45, P0, -38, 'diamant', 26, 12],
    [5.1, P0, -16, 'charbon', 22, 20],
    [5.55, P0, -30, 'redstone', 20, -15],
    [3.75, P0, -66, 'redstone', 22, 18],
    [4.35, P0, -78, 'emeraude', 22, -12],
    [3.9, P0, -108, 'diamant', 22, -6],
    // la paroi de gauche (au fond à gauche)
    [P0, 3.85, -26, 'emeraude', 24, 8],
    [P0, 4.5, -44, 'or', 26, 14],
    [P0, 5.15, -14, 'fer', 22, -12],
    [P0, 5.6, -32, 'diamant', 20, 10],
    [P0, 3.75, -70, 'charbon', 22, -18],
    [P0, 4.3, -86, 'redstone', 22, 10],
    [P0, 3.9, -112, 'or', 20, 0],
  ]) {
    dansLaParoi(x, y, z, sorte, taille, angle)
  }
  // Des étincelles sur les plus belles pierres.
  for (const [x, y, z, k] of [
    [4.6, P0, -24, 0.6],
    [P0, 4.7, -30, 0.6],
    [3.6, P0, -96, 0.5],
  ]) {
    const [ex, ey] = t.pt(x, y, z)
    parois += `<path d="M${r1(ex)} ${r1(ey - 11 * k)} L${r1(ex + 3 * k)} ${r1(ey - 3 * k)} L${r1(ex + 11 * k)} ${r1(ey)} L${r1(ex + 3 * k)} ${r1(ey + 3 * k)} L${r1(ex)} ${r1(ey + 11 * k)} L${r1(ex - 3 * k)} ${r1(ey + 3 * k)} L${r1(ex - 11 * k)} ${r1(ey)} L${r1(ex - 3 * k)} ${r1(ey - 3 * k)} Z" fill="${C.blanc}" stroke="${C.encre}" stroke-width="2.5"/>`
  }
  t.ajouter(`<g clip-path="url(#${idTrou})">${parois}</g>`)
  poutresDuFond(t)

  // Le chevalement : deux gros poteaux aux coins gauche et droit du puits, leurs jambes de force,
  // la grande poutre du haut (et ses équerres), le treuil dessous et la roue dessus.
  const zHaut = Z_TRAVERSE + 22
  const e = 0.46 // l'épaisseur des poteaux
  t.poutre([P0 - 1.4, P1 + 1.4, SOL], [P0 - e / 2, P1 + e / 2, 124], C.bois, 10)
  t.poutre([P1 + 1.4, P0 - 1.4, SOL], [P1 + e / 2, P0 - e / 2, 124], C.bois, 10)
  // les pieds en pierre des poteaux, puis les poteaux, cerclés de fer
  t.boite(P0 - e - 0.1, P1 - 0.1, P0 + 0.1, P1 + e + 0.1, SOL, SOL + 16, teintes(C.pierre, C.pierreFoncee, clair(C.pierre, 0.3)))
  t.boite(P1 - 0.1, P0 - e - 0.1, P1 + e + 0.1, P0 + 0.1, SOL, SOL + 16, teintes(C.pierre, C.pierreFoncee, clair(C.pierre, 0.3)))
  t.boite(P0 - e, P1, P0, P1 + e, SOL + 16, zHaut, bois)
  t.boite(P1, P0 - e, P1 + e, P0, SOL + 16, zHaut, bois)
  for (const zc of [70, 150]) {
    t.boite(P0 - e - 0.03, P1 - 0.03, P0 + 0.03, P1 + e + 0.03, zc, zc + 9, teintes(C.metal, fonce(C.metal, 0.25)), { trait: TRAIT_FIN })
    t.boite(P1 - 0.03, P0 - e - 0.03, P1 + e + 0.03, P0 + 0.03, zc, zc + 9, teintes(C.metal, fonce(C.metal, 0.25)), { trait: TRAIT_FIN })
  }
  // les équerres, entre les poteaux et la poutre
  t.poutre([P0 - e / 2 + 0.05, P1 + e / 2 - 0.05, Z_TRAVERSE - 40], [P0 + 0.5, P1 - 0.5, Z_TRAVERSE], C.boisFonce, 7)
  t.poutre([P1 + e / 2 - 0.05, P0 - e / 2 + 0.05, Z_TRAVERSE - 40], [P1 - 0.5, P0 + 0.5, Z_TRAVERSE], C.boisFonce, 7)
  t.prisme(
    [
      [P0 - e - 0.12, P1 - 0.12],
      [P1 - 0.12, P0 - e - 0.12],
      [P1 + e + 0.12, P0 + 0.12],
      [P0 + 0.12, P1 + e + 0.12],
    ],
    Z_TRAVERSE,
    zHaut,
    teintes(C.bois, C.boisFonce),
  )
  // Des clous sur la poutre.
  for (const k of [0.12, 0.88]) {
    const [cx, cy] = t.pt(P0 + 0.12 + (P1 + e - P0) * k, P1 + e + 0.12 - (P1 + e - P0) * k, (Z_TRAVERSE + zHaut) / 2)
    t.ajouter(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="3.5" fill="${C.encre}"/>`)
  }
  // Une lanterne accrochée à chaque bout de la poutre.
  lanterne(t, P0 - e - 0.05, P1 + e + 0.05, Z_TRAVERSE)
  lanterne(t, P1 + e + 0.05, P0 - e - 0.05, Z_TRAVERSE)
  // La roue, sur son support en A au-dessus de la poutre.
  const zRoue = zHaut + 46
  const [rx, ry] = t.pt(5, 5, zRoue)
  for (const s of [-1, 1]) {
    const [bx, by] = t.pt(5 + s * 0.42, 5 - s * 0.42, zHaut)
    t.ajouter(`<path d="M${r1(bx)} ${r1(by)} L${r1(rx)} ${r1(ry)}" stroke="${C.encre}" stroke-width="${8 + 2 * TRAIT}"/><path d="M${r1(bx)} ${r1(by)} L${r1(rx)} ${r1(ry)}" stroke="${C.boisFonce}" stroke-width="8"/>`)
  }
  t.ajouter(`<circle cx="${r1(rx)}" cy="${r1(ry)}" r="42" fill="${C.toit}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<circle cx="${r1(rx)}" cy="${r1(ry)}" r="29" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI + 0.3
    t.ajouter(`<path d="M${r1(rx + Math.cos(a) * 29)} ${r1(ry + Math.sin(a) * 29)} L${r1(rx - Math.cos(a) * 29)} ${r1(ry - Math.sin(a) * 29)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  // les rivets de la jante
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * 2 * Math.PI
    t.ajouter(`<circle cx="${r1(rx + Math.cos(a) * 35.5)}" cy="${r1(ry + Math.sin(a) * 35.5)}" r="2.8" fill="${fonce(C.toit, 0.35)}"/>`)
  }
  t.ajouter(`<circle cx="${r1(rx)}" cy="${r1(ry)}" r="9" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  t.ajouter(`<path d="M${r1(rx - 30)} ${r1(ry - 16)} A34 34 0 0 1 ${r1(rx - 12)} ${r1(ry - 32)}" stroke="${C.blanc}" stroke-width="4" fill="none" opacity="0.7"/>`)
  // Le treuil : un gros tambour couché sous la poutre, tenu par deux pattes.
  const [gx, gy] = t.pt(K0 - 0.15, K1 + 0.15, Z_TREUIL)
  const [dx] = t.pt(K1 + 0.15, K0 - 0.15, Z_TREUIL)
  for (const x of [gx + 8, dx - 8]) t.ajouter(`<path d="M${r1(x)} ${r1(gy)} L${r1(x)} ${r1(gy - (Z_TRAVERSE - Z_TREUIL))}" stroke="${C.encre}" stroke-width="8"/>`)
  t.ajouter(`<rect x="${r1(gx)}" y="${r1(gy - R_TREUIL)}" width="${r1(dx - gx)}" height="${2 * R_TREUIL}" rx="6" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  for (let k = 1; k < 8; k++) {
    const x = gx + ((dx - gx) * k) / 8
    t.ajouter(`<path d="M${r1(x - 4)} ${r1(gy - R_TREUIL + 4)} L${r1(x + 4)} ${r1(gy + R_TREUIL - 4)}" stroke="${fonce(C.boisFonce, 0.35)}" stroke-width="3"/>`)
  }
  for (const x of [gx, dx]) t.ajouter(`<ellipse cx="${r1(x)}" cy="${r1(gy)}" rx="6" ry="${R_TREUIL + 3}" fill="${C.metal}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)

  // Les poutres de devant du puits (elles sont aussi dans le calque de devant).
  poutresDeDevant(t)

  // Devant à gauche, près de la porte : un coffre au trésor ouvert.
  coffreTresor(t, 3.3, 8.55)
  etincelle(t, 3.5, 8.5, SOL + 92, 1.1)
  buisson(t, 9.5, 3.4, 0.85)

  // Devant à droite : des rochers, l'un avec une grappe de diamants.
  for (const [x, y, l, h, graine] of [
    [8.7, 4.6, 80, 58, 31],
    [9.3, 6.2, 52, 36, 33],
  ]) {
    roche(x, y, l, h, graine)
  }
  grappe(t, 8.75, 4.55, SOL + 34, C.diamant, 0.8)
  etincelle(t, 8.3, 4.2, SOL + 110, 0.8)
  filon(t, 9.3, 6.2, SOL + 20, ['emeraude', 'emeraude'], 0.8, 11)

  // Devant à droite, plus près : des tonneaux, une caisse de charbon et une caisse d'or.
  t.cylindre(8.7, 6.7, 0.3, SOL, SOL + 34, bois, { cerclages: [SOL + 9, SOL + 25] })
  t.cylindre(9.35, 7.2, 0.3, SOL, SOL + 34, bois, { cerclages: [SOL + 9, SOL + 25] })
  for (const [x0, y0, sorte] of [
    [7.6, 7.9, 'charbon'],
    [8.6, 8.0, 'or'],
  ]) {
    t.boite(x0, y0, x0 + 0.7, y0 + 0.7, SOL, SOL + 26, bois)
    tasDeMinerais(t, x0 + 0.08, y0 + 0.08, x0 + 0.62, y0 + 0.62, SOL + 24, [sorte], 20 + x0, { pas: 0.27, taille: 21, bosse: 8 })
  }
  return t
}

// Le calque de devant : seulement les poutres du bord de devant du puits.
function devant() {
  const t = toileMine()
  poutresDeDevant(t)
  return t
}

// Les minerais de chaque niveau de la caisse, un par niveau de la mine (26/10 : 7 niveaux) :
// 1 pierre, charbon, fer ; 2 + redstone ; 3 + or ; 4 + émeraude ; 5 + saphir ; 6 + rubis ;
// 7 + diamant. Chaque caisse garde les minerais les plus beaux du niveau d'avant, et le nouveau
// minerai est le dernier de la liste : il est posé tout en haut du tas (et parfois dedans).
const MINERAIS_CAISSE = [
  [],
  ['pierre', 'charbon', 'pierre', 'fer', 'charbon'],
  ['pierre', 'charbon', 'fer', 'redstone', 'redstone'],
  ['charbon', 'fer', 'redstone', 'or', 'or'],
  ['charbon', 'fer', 'redstone', 'or', 'emeraude', 'emeraude'],
  ['fer', 'redstone', 'or', 'emeraude', 'saphir', 'saphir'],
  ['redstone', 'or', 'emeraude', 'saphir', 'rubis', 'rubis'],
  ['or', 'emeraude', 'saphir', 'rubis', 'diamant', 'diamant'],
]

// La caisse de l'ascenseur, vide (0) ou pleine (1 à 7 : les minerais du niveau de la mine), dans
// le cadre de la mine.
function caisse(niveau) {
  const t = toileMine()
  const z0 = SOL
  const z1 = SOL + HAUTEUR_CAISSE
  const caisseBois = teintes(C.bois, C.boisFonce)
  t.boite(K0, K0, K1, K1, z0, z1, caisseBois)
  // L'intérieur : un bord de planches, et le fond sombre.
  const e = 0.12
  t.poly(
    [
      [K0 + e, K0 + e, z1],
      [K1 - e, K0 + e, z1],
      [K1 - e, K1 - e, z1],
      [K0 + e, K1 - e, z1],
    ],
    fonce(C.boisFonce, 0.35),
    { trait: TRAIT_FIN },
  )
  // Les planches et les coins en métal des deux faces qu'on voit.
  t.ligne([K0 + 0.05, K1, z0 + HAUTEUR_CAISSE / 2], [K1 - 0.05, K1, z0 + HAUTEUR_CAISSE / 2], C.boisFonce, 3)
  t.ligne([K1, K1 - 0.05, z0 + HAUTEUR_CAISSE / 2], [K1, K0 + 0.05, z0 + HAUTEUR_CAISSE / 2], fonce(C.boisFonce, 0.3), 3)
  for (const [x, y] of [
    [K0, K1],
    [K1, K1],
    [K1, K0],
  ]) {
    t.poutre([x, y, z0 + 4], [x, y, z1 - 2], C.metal, 3)
  }
  // Le tas de minerais (de la forme des icônes du jeu), qui dépasse du haut de la caisse.
  const sortes = MINERAIS_CAISSE[niveau]
  if (sortes.length) tasDeMinerais(t, K0 + 0.14, K0 + 0.14, K1 - 0.14, K1 - 0.14, z1 - 4, sortes, 40 + niveau, { pas: 0.34, taille: 28, bosse: 18 })
  // Les anneaux où s'accrochent les câbles (aux coins gauche et droit).
  for (const [x, y] of [
    [K0, K1],
    [K1, K0],
  ]) {
    const [ax, ay] = t.pt(x, y, z1 + 2)
    t.ajouter(`<circle cx="${r1(ax)}" cy="${r1(ay)}" r="6" fill="none" stroke="${C.encre}" stroke-width="5"/>`)
  }
  // Le cadre de l'image : juste autour de la caisse et de son tas.
  const gauche = Math.floor(t.pt(K0, K1, 0)[0] - 10)
  const droite = Math.ceil(t.pt(K1, K0, 0)[0] + 10)
  const haut = Math.floor(t.pt(K0, K0, z1 + 60)[1])
  const bas = Math.ceil(t.pt(K1, K1, z0)[1] + 8)
  return { t, cadre: { x: gauche, y: haut, largeur: droite - gauche, hauteur: bas - haut } }
}

// Le même dessin, recadré (pour les caisses : une petite image, posée par le jeu au bon endroit).
function svgRecadre(t, cadre) {
  const { x, y, largeur, hauteur } = cadre
  const defs = t.defs.length ? `<defs>${t.defs.join('')}</defs>` : ''
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="${x} ${y} ${largeur} ${hauteur}" stroke-linejoin="round" stroke-linecap="round">` +
    `${defs}${t.morceaux.join('')}</svg>\n`
  )
}

export function mine() {
  const leFond = fond()
  const caisses = MINERAIS_CAISSE.map((_, niveau) => caisse(niveau))
  const cadre = caisses[0].cadre
  const t = leFond
  const p = (x, y, z) => t.pt(x, y, z).map(r1)
  const zAccroche = SOL + HAUTEUR_CAISSE + 2
  const points = {
    // la caisse (en pixels de mine.svg), à sa hauteur de référence
    caisse: cadre,
    // où les câbles sortent du treuil, et où ils s'accrochent à la caisse
    treuil: [p(K0, K1, Z_TREUIL - R_TREUIL), p(K1, K0, Z_TREUIL - R_TREUIL)],
    accroches: [p(K0, K1, zAccroche), p(K1, K0, zAccroche)],
    // les pieds d'un mineur dans la caisse, et le bord de devant de la caisse (de droite à gauche)
    piedDansLaCaisse: p(5, 5, SOL + 4),
    bordCaisse: [p(K1, K0, SOL + HAUTEUR_CAISSE), p(K1, K1, SOL + HAUTEUR_CAISSE), p(K0, K1, SOL + HAUTEUR_CAISSE)],
    // le bord de devant du puits, de gauche à droite
    bordDuPuits: [p(P0, P1, SOL), p(P1, P1, SOL), p(P1, P0, SOL)],
    // le pied du panneau du niveau, et le haut du chevalement (pour la jauge)
    panneau: p(6.6, 9.5, SOL),
    // (la jauge du coffre est juste au-dessus de la roue ; la mini-jauge encore au-dessus)
    dessus: p(5, 5, 300),
    // la caisse tout en haut (son fond sous le treuil), et tout en bas (cachée dans le puits)
    cabineEnHaut: -Math.round(Z_TREUIL - R_TREUIL - 30 - zAccroche),
    cabineEnBas: Math.round(t.pt(P1, P1, SOL)[1] - t.pt(K0, K0, SOL + HAUTEUR_CAISSE + 40)[1] + 10),
    taillePixelsParCase: { dx: DX, dy: DY },
  }
  return { fond: leFond, devant: devant(), caisses: caisses.map((c) => svgRecadre(c.t, cadre)), points }
}

