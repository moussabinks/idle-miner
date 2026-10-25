// La mine (10 × 10 cases) : un puits carré au milieu, entouré de poutres, un chevalement en bois
// (deux poteaux, une poutre, une grande roue et le treuil), des rochers pleins de minerais au fond.
//
// Le jeu dessine par-dessus (src/composants/DessinsVillage.tsx, DessinEvolutionMine) : les câbles
// qui tombent du treuil, la caisse de l'ascenseur qui monte et descend dans le puits, puis le
// calque « mine-devant » (les poutres du bord de devant du puits) qui passe devant la caisse.
// Tous ces dessins ont le même cadre que mine.svg (les mêmes pixels) ; les points utiles (où
// sortent les câbles, le bord du puits...) sont renvoyés dans « points ».

import { C, DX, DY, TRAIT, TRAIT_FIN, Toile, fonce, hasardAvecGraine, polygone, r1, rocher, teintes } from './formes.mjs'

const TAILLE = 10
const HAUT = 175 // la place au-dessus du coin du haut (pour le chevalement)
const SOL = 12 // l'épaisseur de la dalle : le sol de la mine est à cette hauteur
// Le puits : de 3,4 à 6,6 cases, dans les deux sens.
const P0 = 3.4
const P1 = 6.6
const POUTRE = 0.35 // la largeur des poutres du bord
const Z_POUTRE = SOL + 12
// Le chevalement.
const Z_TRAVERSE = 196 // le bas de la grande poutre du haut
const Z_TREUIL = 172 // le milieu du treuil (sous la poutre)
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

// Un minerai qui dépasse d'un rocher : un petit losange brillant.
function gemme(t, x, y, couleur, k = 1) {
  const p = [
    [x, y - 10 * k],
    [x + 7 * k, y],
    [x, y + 8 * k],
    [x - 7 * k, y],
  ]
  t.ajouter(polygone(p, couleur, TRAIT_FIN))
  t.ajouter(`<path d="M${r1(x - 2 * k)} ${r1(y - 4 * k)} L${r1(x + 1 * k)} ${r1(y - 7 * k)}" stroke="${C.blanc}" stroke-width="3"/>`)
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

  // La petite montagne du fond : de gros rochers pleins de minerais.
  const rochers = [
    [1.0, 1.0, 170, 150, 3],
    [2.6, 0.55, 130, 104, 5],
    [0.55, 2.6, 130, 104, 8],
    [2.25, 2.1, 150, 118, 1],
    [3.9, 0.7, 104, 74, 12],
    [0.7, 3.9, 104, 74, 15],
    [5.3, 0.6, 80, 50, 21],
    [0.6, 5.3, 80, 50, 22],
  ]
  rochers.sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
  for (const [x, y, l, h, graine] of rochers) {
    const [px, py] = t.pt(x, y, SOL)
    t.ajouter(rocher(px, py, l, h, graine, C.pierre))
  }
  ;[
    [1.0, 1.0, -30, -110, C.diamant, 1.6],
    [1.0, 1.0, 34, -80, C.or, 1.3],
    [2.25, 2.1, -30, -70, C.redstone, 1.4],
    [2.25, 2.1, 30, -50, C.diamant, 1.1],
    [0.55, 2.6, 6, -60, C.emeraude, 1.3],
    [2.6, 0.55, 10, -66, C.redstone, 1.1],
    [3.9, 0.7, -4, -40, C.or, 1.1],
    [0.7, 3.9, -6, -40, C.emeraude, 1],
    [5.3, 0.6, 2, -26, C.diamant, 0.9],
  ].forEach(([x, y, dx, dy, couleur, k]) => {
    const [px, py] = t.pt(x, y, SOL)
    gemme(t, px + dx, py + dy, couleur, k)
  })

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
  t.surFace(
    'gauche',
    c0,
    d1,
    SOL,
    `<path d="M30 0 V-36 A11 11 0 0 1 52 -36 V0 Z" fill="${fonce(C.boisFonce, 0.3)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      [12, 66].map((u) => `<path d="M${u} -4 V-50" stroke="${C.boisFonce}" stroke-width="3"/>`).join(''),
  )
  t.toit(c0 - 0.15, d0 - 0.15, c1 + 0.15, d1 + 0.15, zc - 4, zc + 38, 'y', teintes(C.toit, fonce(C.toit, 0.22), C.toit))
  // Une pioche posée contre la cabane.
  t.poutre([9.2, 1.4, SOL], [9.2, 2.1, 52], C.bois, 5)
  const [pxp, pyp] = t.pt(9.2, 2.1, 52)
  const pioche = `M${r1(pxp - 17)} ${r1(pyp + 12)} Q${r1(pxp - 2)} ${r1(pyp - 10)} ${r1(pxp + 17)} ${r1(pyp - 2)}`
  t.ajouter(`<path d="${pioche}" stroke="${C.encre}" stroke-width="${6 + 2 * TRAIT}" fill="none"/><path d="${pioche}" stroke="${C.metal}" stroke-width="6" fill="none"/>`)

  // Le puits : un trou tout noir, ses deux parois du fond (avec des planches), et ses poutres.
  const trou = [t.pt(P0, P0, SOL), t.pt(P1, P0, SOL), t.pt(P1, P1, SOL), t.pt(P0, P1, SOL)]
  t.ajouter(polygone(trou, C.encre, 0))
  const idTrou = t.nouvelId('trou')
  t.defs.push(`<clipPath id="${idTrou}"><polygon points="${trou.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}"/></clipPath>`)
  const paroi = (a, b, couleur) => {
    const p = [t.pt(...a, SOL), t.pt(...b, SOL), t.pt(...b, -90), t.pt(...a, -90)]
    t.ajouter(`<g clip-path="url(#${idTrou})">${polygone(p, couleur, TRAIT_FIN)}</g>`)
  }
  paroi([P0, P0], [P1, P0], '#6a5a7e')
  paroi([P0, P0], [P0, P1], '#54476a')
  for (const z of [-10, -50]) {
    const planche = (a, b, couleur) => {
      const p = [t.pt(...a, z + 9), t.pt(...b, z + 9), t.pt(...b, z), t.pt(...a, z)]
      t.ajouter(`<g clip-path="url(#${idTrou})">${polygone(p, couleur, TRAIT_FIN)}</g>`)
    }
    planche([P0, P0], [P1, P0], fonce(C.bois, 0.3))
    planche([P0, P0], [P0, P1], fonce(C.boisFonce, 0.3))
  }
  poutresDuFond(t)

  // Le chevalement : deux gros poteaux aux coins gauche et droit du puits, leurs jambes de force,
  // la grande poutre du haut (et ses équerres), le treuil dessous et la roue dessus.
  const zHaut = Z_TRAVERSE + 22
  const e = 0.42 // l'épaisseur des poteaux
  t.poutre([P0 - 1.3, P1 + 1.3, SOL], [P0 - e / 2, P1 + e / 2, 120], C.bois, 9)
  t.poutre([P1 + 1.3, P0 - 1.3, SOL], [P1 + e / 2, P0 - e / 2, 120], C.bois, 9)
  t.boite(P0 - e, P1, P0, P1 + e, SOL, zHaut, bois)
  t.boite(P1, P0 - e, P1 + e, P0, SOL, zHaut, bois)
  // les équerres, entre les poteaux et la poutre
  t.poutre([P0 - e / 2 + 0.05, P1 + e / 2 - 0.05, Z_TRAVERSE - 40], [P0 + 0.5, P1 - 0.5, Z_TRAVERSE], C.boisFonce, 7)
  t.poutre([P1 + e / 2 - 0.05, P0 - e / 2 + 0.05, Z_TRAVERSE - 40], [P1 - 0.5, P0 + 0.5, Z_TRAVERSE], C.boisFonce, 7)
  t.prisme(
    [
      [P0 - e - 0.08, P1 - 0.08],
      [P1 - 0.08, P0 - e - 0.08],
      [P1 + e + 0.08, P0 + 0.08],
      [P0 + 0.08, P1 + e + 0.08],
    ],
    Z_TRAVERSE,
    zHaut,
    teintes(C.bois, C.boisFonce),
  )
  // La roue, sur la poutre.
  const [rx, ry] = t.pt(5, 5, zHaut + 40)
  t.boite(4.8, 4.8, 5.2, 5.2, zHaut, zHaut + 26, teintes(C.metal, fonce(C.metal, 0.25)))
  t.ajouter(`<circle cx="${r1(rx)}" cy="${r1(ry)}" r="38" fill="${C.toit}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<circle cx="${r1(rx)}" cy="${r1(ry)}" r="26" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI + 0.3
    t.ajouter(`<path d="M${r1(rx + Math.cos(a) * 26)} ${r1(ry + Math.sin(a) * 26)} L${r1(rx - Math.cos(a) * 26)} ${r1(ry - Math.sin(a) * 26)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  t.ajouter(`<circle cx="${r1(rx)}" cy="${r1(ry)}" r="8" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
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

  // Devant : des rochers à droite, une lanterne, des tonneaux et une caisse de charbon à gauche.
  for (const [x, y, l, h, graine] of [
    [8.7, 4.6, 76, 54, 31],
    [9.3, 6.2, 52, 36, 33],
    [6.3, 9.3, 60, 40, 37],
  ]) {
    const [px, py] = t.pt(x, y, SOL)
    t.ajouter(rocher(px, py, l, h, graine, C.pierre))
  }
  const [gx2, gy2] = t.pt(8.7, 4.6, SOL)
  gemme(t, gx2 - 12, gy2 - 30, C.emeraude, 1)
  t.boite(7.9, 3.4, 8.04, 3.54, SOL, 84, bois)
  const [lx, ly] = t.pt(7.97, 3.47, 84)
  t.ajouter(`<rect x="${r1(lx - 10)}" y="${r1(ly - 24)}" width="20" height="24" rx="5" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  t.ajouter(`<path d="M${r1(lx - 13)} ${r1(ly - 24)} L${r1(lx)} ${r1(ly - 35)} L${r1(lx + 13)} ${r1(ly - 24)} Z" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  t.cylindre(1.4, 6.9, 0.3, SOL, SOL + 34, bois, { cerclages: [SOL + 9, SOL + 25] })
  t.cylindre(1.0, 7.6, 0.3, SOL, SOL + 34, bois, { cerclages: [SOL + 9, SOL + 25] })
  t.boite(1.9, 7.5, 2.6, 8.2, SOL, SOL + 26, bois)
  const [cx, cy] = t.pt(2.25, 7.85, SOL + 26)
  for (const [ddx, ddy] of [
    [-8, 0],
    [8, 0],
    [0, -7],
  ]) {
    t.ajouter(`<circle cx="${r1(cx + ddx)}" cy="${r1(cy + ddy)}" r="8" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  return t
}

// Le calque de devant : seulement les poutres du bord de devant du puits.
function devant() {
  const t = toileMine()
  poutresDeDevant(t)
  return t
}

// Les minerais de chaque niveau de la caisse : 1 pierre, charbon, fer ; 2 + redstone ;
// 3 + or et émeraude ; 4 + diamant.
const MINERAIS_CAISSE = [
  [],
  [C.pierre, C.charbon, C.fer],
  [C.pierre, C.charbon, C.fer, C.redstone, C.redstone],
  [C.charbon, C.fer, C.redstone, C.or, C.emeraude, C.or],
  [C.fer, C.redstone, C.or, C.emeraude, C.diamant, C.diamant],
]

// La caisse de l'ascenseur, vide (0) ou pleine (1 à 4), dans le cadre de la mine.
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
  // Le tas de minerais (des petits cubes), du fond vers l'avant.
  const couleurs = MINERAIS_CAISSE[niveau]
  if (couleurs.length) {
    const hasard = hasardAvecGraine(40 + niveau)
    const cubes = []
    const c = 0.3
    for (const [x, y, z] of [
      [4.45, 4.45, 0],
      [4.85, 4.4, 0],
      [5.25, 4.45, 0],
      [4.4, 4.85, 0],
      [5.3, 4.85, 0],
      [4.45, 5.25, 0],
      [4.85, 5.3, 0],
      [5.25, 5.25, 0],
      [4.85, 4.85, 2],
      [4.62, 4.62, 12],
      [5.05, 4.6, 12],
      [4.6, 5.05, 12],
      [5.05, 5.05, 12],
      [4.83, 4.83, 24],
    ]) {
      cubes.push({ x: x + (hasard() - 0.5) * 0.06, y: y + (hasard() - 0.5) * 0.06, z, couleur: couleurs[Math.floor(hasard() * couleurs.length)] })
    }
    cubes.sort((a, b) => a.x + a.y + a.z / 40 - (b.x + b.y + b.z / 40))
    for (const cube of cubes) {
      const zb = z1 - 6 + cube.z
      t.boite(cube.x, cube.y, cube.x + c, cube.y + c, zb, zb + 13, teintes(cube.couleur), { trait: TRAIT_FIN })
    }
  }
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
  const caisses = [0, 1, 2, 3, 4].map(caisse)
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
    panneau: p(2.6, 9.2, SOL),
    // (la jauge du coffre est juste au-dessus de la roue ; la mini-jauge encore au-dessus)
    dessus: p(5, 5, 390),
    // la caisse tout en haut (son fond sous le treuil), et tout en bas (cachée dans le puits)
    cabineEnHaut: -Math.round(Z_TREUIL - R_TREUIL - 30 - zAccroche),
    cabineEnBas: Math.round(t.pt(P1, P1, SOL)[1] - t.pt(K0, K0, SOL + HAUTEUR_CAISSE + 40)[1] + 10),
    taillePixelsParCase: { dx: DX, dy: DY },
  }
  return { fond: leFond, devant: devant(), caisses: caisses.map((c) => svgRecadre(c.t, cadre)), points }
}

