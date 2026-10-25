// Les bâtiments du village (5 × 5 cases), chacun posé sur sa dalle de pavés : le marché, le
// forgeron, le Personnel, la foreuse et le générateur. La mine (10 × 10) est dans mine.mjs.
//
// Chaque dessin est fait en « cases » (x et y de 0 à 5, z en pixels vers le haut), du fond vers
// l'avant : ce qui est dessiné après passe devant. La porte de chaque bâtiment est du côté donné
// dans src/jeu/donnees.ts : « gauche » = la façade en bas à gauche (y = 5), « droite » = celle en
// bas à droite (x = 5).

import { C, Toile, TRAIT, TRAIT_FIN, clair, fonce, r1, teintes } from './formes.mjs'

// L'épaisseur de la dalle de pavés, et la hauteur de son dessus.
const DALLE = 8

// La dalle de pavés de 5 × 5 cases (taille × taille), avec ses joints.
export function dalle(t, taille, epaisseur = DALLE, joint = 1) {
  t.boite(0, 0, taille, taille, 0, epaisseur, teintes(C.pierre, fonce(C.pierreFoncee, 0.12), C.pierre))
  const ligne = (a, b) => t.ligne(a, b, '#b3b7c5', 3)
  for (let i = joint; i < taille - 0.01; i += joint) {
    ligne([i, 0.08, epaisseur], [i, taille - 0.08, epaisseur])
    ligne([0.08, i, epaisseur], [taille - 0.08, i, epaisseur])
  }
  // Les joints du dessus passent sur le contour : on le redessine par-dessus.
  t.poly(
    [
      [0, 0, epaisseur],
      [taille, 0, epaisseur],
      [taille, taille, epaisseur],
      [0, taille, epaisseur],
    ],
    'none',
  )
}

// Un petit tas de minerais (des cailloux ronds) posé à plat, autour du point (x, y, z).
function tasDeMinerais(t, x, y, z, couleurs, taille = 1) {
  const [cx, cy] = t.pt(x, y, z)
  const places = [
    [-9, 0],
    [9, 0],
    [0, 4],
    [-4, -7],
    [6, -7],
    [0, -13],
  ]
  places.forEach(([dx, dy], i) => {
    const couleur = couleurs[i % couleurs.length]
    t.ajouter(`<circle cx="${r1(cx + dx * taille)}" cy="${r1(cy + dy * taille)}" r="${r1(7 * taille)}" fill="${couleur}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
    t.ajouter(`<circle cx="${r1(cx + dx * taille - 2.2 * taille)}" cy="${r1(cy + dy * taille - 2.4 * taille)}" r="${r1(2.2 * taille)}" fill="${C.blanc}" opacity="0.7"/>`)
  })
}

// Une caisse en bois (avec ses planches), et des minerais dessus.
function caisse(t, x, y, cote, z, hauteur, minerais) {
  t.boite(x, y, x + cote, y + cote, z, z + hauteur, teintes(C.bois, C.boisFonce))
  t.ligne([x + 0.04, y + cote, z + hauteur / 2], [x + cote - 0.04, y + cote, z + hauteur / 2], C.boisFonce, 3)
  t.ligne([x + cote, y + cote - 0.04, z + hauteur / 2], [x + cote, y + 0.04, z + hauteur / 2], fonce(C.boisFonce, 0.25), 3)
  if (minerais) tasDeMinerais(t, x + cote / 2, y + cote / 2, z + hauteur, minerais, cote * 1.3)
}

// Un tonneau en bois cerclé.
function tonneau(t, x, y, z, r = 0.3, hauteur = 34) {
  t.cylindre(x, y, r, z, z + hauteur, teintes(C.bois, C.boisFonce), { cerclages: [z + hauteur * 0.25, z + hauteur * 0.75] })
}

// ---------------------------------------------------------------------------
// Le marché : un étal à l'auvent rayé rouge et blanc, des caisses de minerais, une grosse pièce
// ---------------------------------------------------------------------------

export function marche() {
  const t = new Toile({ taille: 5, haut: 190 })
  dalle(t, 5)
  const z = DALLE
  const bois = teintes(C.bois, C.boisFonce)
  // Les deux poteaux du fond, une étagère avec des bocaux de minerais, et les poteaux de devant.
  t.boite(0.85, 0.75, 1.1, 1.0, z, 134, bois)
  t.boite(3.9, 0.75, 4.15, 1.0, z, 134, bois)
  t.boite(1.1, 0.8, 3.9, 1.0, 62, 70, bois)
  ;[
    [1.5, C.diamant],
    [2.2, C.emeraude],
    [2.9, C.redstone],
    [3.5, C.or],
  ].forEach(([x, couleur]) => t.cylindre(x, 0.9, 0.13, 70, 86, teintes(couleur)))
  t.boite(0.85, 2.6, 1.1, 2.85, z, 108, bois)
  t.boite(3.9, 2.6, 4.15, 2.85, z, 108, bois)

  // L'auvent rayé : il descend du fond (y = 0,55, haut) vers l'avant (y = 2,95, plus bas).
  const [ax0, ax1, ay0, ay1, zFond, zAvant] = [0.6, 4.4, 0.55, 2.95, 138, 110]
  const bandes = 7
  for (let i = 0; i < bandes; i++) {
    const xa = ax0 + ((ax1 - ax0) * i) / bandes
    const xb = ax0 + ((ax1 - ax0) * (i + 1)) / bandes
    t.poly(
      [
        [xa, ay0, zFond],
        [xb, ay0, zFond],
        [xb, ay1, zAvant],
        [xa, ay1, zAvant],
      ],
      i % 2 ? C.creme : C.toit,
      { trait: 0 },
    )
  }
  t.poly(
    [
      [ax0, ay0, zFond],
      [ax1, ay0, zFond],
      [ax1, ay1, zAvant],
      [ax0, ay1, zAvant],
    ],
    'none',
  )
  // Le lambrequin de devant (la frange festonnée), sur la façade de gauche.
  const frange = (pointsBande, couleur) => {
    const p = pointsBande.map(([x, y, zz]) => t.pt(x, y, zz))
    const [a, b, c, d] = p
    const creux = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2 + 12]
    t.ajouter(`<path d="M${r1(a[0])} ${r1(a[1])} L${r1(b[0])} ${r1(b[1])} L${r1(c[0])} ${r1(c[1])} Q${r1(creux[0])} ${r1(creux[1])} ${r1(d[0])} ${r1(d[1])} Z" fill="${couleur}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  for (let i = 0; i < bandes; i++) {
    const xa = ax0 + ((ax1 - ax0) * i) / bandes
    const xb = ax0 + ((ax1 - ax0) * (i + 1)) / bandes
    frange(
      [
        [xa, ay1, zAvant],
        [xb, ay1, zAvant],
        [xb, ay1, zAvant - 14],
        [xa, ay1, zAvant - 14],
      ],
      i % 2 ? C.creme : C.toit,
    )
  }
  // Le lambrequin du côté droit (à l'ombre).
  const cotes = 6
  for (let i = 0; i < cotes; i++) {
    const ya = ay1 - ((ay1 - ay0) * i) / cotes
    const yb = ay1 - ((ay1 - ay0) * (i + 1)) / cotes
    const za = zAvant + ((zFond - zAvant) * i) / cotes
    const zb = zAvant + ((zFond - zAvant) * (i + 1)) / cotes
    frange(
      [
        [ax1, ya, za],
        [ax1, yb, zb],
        [ax1, yb, zb - 14],
        [ax1, ya, za - 14],
      ],
      i % 2 ? fonce(C.creme, 0.12) : fonce(C.toit, 0.15),
    )
  }

  // Le comptoir, devant l'auvent, avec ses planches et ses caisses de minerais.
  t.boite(0.8, 3.0, 4.2, 3.9, z, 52, bois)
  for (const x of [1.45, 2.1, 2.8, 3.5]) t.ligne([x, 3.9, z + 3], [x, 3.9, 49], C.boisFonce, 3)
  ;[
    [0.95, [C.redstone, fonce(C.redstone, 0.1)]],
    [1.75, [C.diamant, clair(C.diamant, 0.2)]],
    [2.55, [C.emeraude, fonce(C.emeraude, 0.1)]],
    [3.35, [C.or, fonce(C.or, 0.08)]],
  ].forEach(([x, couleurs]) => caisse(t, x, 3.12, 0.66, 52, 14, couleurs))

  // La grosse pièce d'or, plantée au-dessus de l'auvent.
  t.boite(2.38, 0.55, 2.62, 0.79, 136, 180, bois)
  const [px, py] = t.pt(2.5, 0.67, 200)
  t.ajouter(`<ellipse cx="${r1(px + 6)}" cy="${r1(py)}" rx="30" ry="32" fill="${fonce(C.or, 0.25)}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<ellipse cx="${r1(px)}" cy="${r1(py)}" rx="30" ry="32" fill="${C.or}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<ellipse cx="${r1(px)}" cy="${r1(py)}" rx="20" ry="22" fill="none" stroke="${fonce(C.or, 0.2)}" stroke-width="${TRAIT_FIN}"/>`)
  // Le signe « $ », dessiné au trait.
  t.ajouter(
    `<path d="M${r1(px + 8)} ${r1(py - 9)} Q${r1(px + 6)} ${r1(py - 14)} ${r1(px)} ${r1(py - 14)} Q${r1(px - 9)} ${r1(py - 14)} ${r1(px - 9)} ${r1(py - 6)} Q${r1(px - 9)} ${r1(py)} ${r1(px)} ${r1(py)} Q${r1(px + 9)} ${r1(py)} ${r1(px + 9)} ${r1(py + 7)} Q${r1(px + 9)} ${r1(py + 14)} ${r1(px)} ${r1(py + 14)} Q${r1(px - 6)} ${r1(py + 14)} ${r1(px - 8)} ${r1(py + 9)} M${r1(px)} ${r1(py - 20)} L${r1(px)} ${r1(py + 20)}" stroke="${C.encre}" stroke-width="5" fill="none"/>`,
  )
  t.ajouter(`<ellipse cx="${r1(px - 13)}" cy="${r1(py - 15)}" rx="5" ry="7" fill="${C.blanc}" opacity="0.75"/>`)

  // Devant l'étal : une caisse de charbon, un tonneau, un tas de pièces.
  caisse(t, 4.35, 0.6, 0.55, z, 22, [C.fer, fonce(C.fer, 0.12)])
  caisse(t, 0.25, 4.15, 0.62, z, 24, [C.charbon, fonce(C.charbon, 0.3)])
  tonneau(t, 4.5, 4.0, z)
  tasDeMinerais(t, 2.6, 4.5, z, [C.or, fonce(C.or, 0.1)], 1.1)
  return t
}

// ---------------------------------------------------------------------------
// Le forgeron : une forge en pierre, sa cheminée qui fume, la forge rougeoyante et l'enclume
// ---------------------------------------------------------------------------

export function forgeron() {
  const t = new Toile({ taille: 5, haut: 200 })
  dalle(t, 5)
  const z = DALLE
  const pierre = teintes(C.pierre, C.pierreFoncee, clair(C.pierre, 0.3))
  // La maison en pierre.
  const [x0, y0, x1, y1, zMur] = [0.7, 0.7, 3.4, 4.3, 92]
  t.boite(x0, y0, x1, y1, z, zMur, pierre)
  // Quelques pierres dessinées sur les murs.
  const pierresMur = (cote, liste) => {
    for (const [u, v, l] of liste) {
      t.surFace(cote, cote === 'gauche' ? x0 : x1, y1, z, `<rect x="${u}" y="${-v}" width="${l}" height="12" rx="5" fill="none" stroke="${fonce(C.pierreFoncee, 0.15)}" stroke-width="3"/>`)
    }
  }
  pierresMur('gauche', [
    [12, 30, 26],
    [48, 58, 30],
    [80, 22, 24],
    [22, 70, 22],
  ])
  // Le pignon (le triangle sous le toit), sur la façade de gauche.
  const zFaite = 140
  t.poly(
    [
      [x0, y1, zMur],
      [x1, y1, zMur],
      [(x0 + x1) / 2, y1, zFaite - 6],
    ],
    pierre.gauche,
  )
  // Le toit en ardoise, puis la cheminée qui sort de sa pente de droite (son pied suit la pente).
  const ardoise = '#7c7f9e'
  const [tx0, tx1] = [x0 - 0.18, x1 + 0.18]
  t.toit(tx0, y0 - 0.18, tx1, y1 + 0.18, zMur - 4, zFaite, 'y', teintes(ardoise, fonce(ardoise, 0.25), ardoise))
  const zToit = (x) => zFaite - ((x - (tx0 + tx1) / 2) / ((tx1 - tx0) / 2)) * (zFaite - zMur + 4)
  const [cx0, cx1, cy0, cy1, zc] = [2.45, 3.0, 1.0, 1.55, 182]
  t.volume(
    [
      [cx0, cy0, zToit(cx0)],
      [cx1, cy0, zToit(cx1)],
      [cx1, cy1, zToit(cx1)],
      [cx0, cy1, zToit(cx0)],
      [cx0, cy0, zc],
      [cx1, cy0, zc],
      [cx1, cy1, zc],
      [cx0, cy1, zc],
    ],
    [
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ],
    pierre,
  )
  t.boite(cx0 - 0.07, cy0 - 0.07, cx1 + 0.07, cy1 + 0.07, zc, zc + 10, teintes(C.pierreFoncee))
  // La fumée.
  const [fx, fy] = t.pt((cx0 + cx1) / 2, (cy0 + cy1) / 2, zc + 22)
  ;[
    [0, 0, 11],
    [10, -16, 14],
    [2, -36, 17],
  ].forEach(([dx, dy, r]) => t.ajouter(`<circle cx="${r1(fx + dx)}" cy="${r1(fy + dy)}" r="${r}" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`))
  // La forge, une grande arche sur la façade de droite (x = 3,4), rouge de braises.
  t.surFace(
    'droite',
    x1,
    y1,
    z,
    `<path d="M30 0 L30 -44 A30 30 0 0 1 90 -44 L90 0 Z" fill="${C.orange}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M42 0 Q36 -22 52 -40 Q54 -24 62 -30 Q66 -42 70 -48 Q86 -26 78 0 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M30 -2 L90 -2" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      // les pierres de l'arche
      `<path d="M24 -44 A36 36 0 0 1 96 -44" fill="none" stroke="${fonce(C.pierreFoncee, 0.2)}" stroke-width="5" stroke-dasharray="10 7"/>`,
  )
  // Un seau d'eau et un tas de charbon contre la forge.
  t.cylindre(3.75, 1.0, 0.22, z, z + 20, teintes(C.bois, C.boisFonce))
  t.ellipseSol(3.75, 1.0, 0.15, z + 20, C.bleu, { trait: 0 })
  tasDeMinerais(t, 3.8, 3.9, z, [C.charbon, fonce(C.charbon, 0.3)], 1.2)
  // L'enclume sur sa souche, devant la forge.
  t.cylindre(4.35, 2.45, 0.3, z, z + 22, teintes(C.bois, C.boisFonce))
  const enclume = teintes('#6d7290', '#535774', '#8b90ab')
  t.boite(4.18, 2.2, 4.52, 2.7, z + 22, z + 30, enclume)
  t.boite(4.05, 2.05, 4.65, 2.85, z + 30, z + 44, enclume)
  // La pointe de l'enclume (la bigorne), vers le fond.
  t.volume(
    [
      [4.15, 2.05, z + 32],
      [4.55, 2.05, z + 32],
      [4.55, 2.05, z + 44],
      [4.15, 2.05, z + 44],
      [4.35, 1.55, z + 42],
    ],
    [
      [0, 1, 2, 3],
      [0, 1, 4],
      [1, 2, 4],
      [2, 3, 4],
      [3, 0, 4],
    ],
    enclume,
  )
  // Un marteau posé dessus.
  t.poutre([4.2, 2.6, z + 48], [4.5, 2.25, z + 48], C.bois, 5)
  t.boite(4.42, 2.12, 4.6, 2.36, z + 44, z + 54, teintes(C.metal))
  return t
}

// ---------------------------------------------------------------------------
// Le Personnel : le bureau d'embauche au toit bleu, son enseigne au casque de mineur
// ---------------------------------------------------------------------------

export function employes() {
  const t = new Toile({ taille: 5, haut: 180 })
  dalle(t, 5)
  const z = DALLE
  const murs = teintes(C.creme, '#e3d5b8', C.creme)
  const [x0, y0, x1, y1, zMur] = [0.8, 0.85, 3.7, 4.15, 84]
  // Le bas des murs en pierre, puis les murs.
  t.boite(x0, y0, x1, y1, z, z + 14, teintes(C.pierre, C.pierreFoncee))
  t.boite(x0, y0, x1, y1, z + 14, zMur, murs)
  // Les poutres d'angle en bois.
  const bois = teintes(C.bois, C.boisFonce)
  t.boite(x0 - 0.05, y1 - 0.2, x0 + 0.15, y1 + 0.05, z, zMur, bois)
  t.boite(x1 - 0.2, y1 - 0.2, x1 + 0.05, y1 + 0.05, z, zMur, bois)
  t.boite(x1 - 0.2, y0 - 0.05, x1 + 0.05, y0 + 0.15, z, zMur, bois)
  // Deux fenêtres sur la façade de gauche, avec une jardinière de fleurs roses.
  const fenetre = (u) =>
    `<rect x="${u}" y="-62" width="30" height="30" rx="4" fill="${C.bleu}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
    `<path d="M${u + 15} -62 V-32 M${u} -47 H${u + 30}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
    `<path d="M${u + 5} -56 L${u + 11} -50" stroke="${C.blanc}" stroke-width="4"/>` +
    `<rect x="${u - 4}" y="-30" width="38" height="9" rx="3" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
    [6, 15, 24].map((d) => `<circle cx="${u + d}" cy="-33" r="5" fill="${C.rose}" stroke="${C.encre}" stroke-width="3"/>`).join('')
  t.surFace('gauche', x0, y1, z, fenetre(22) + fenetre(72))
  // Le pignon sur la façade de droite (la porte), puis le toit bleu.
  const zFaite = 132
  const bleu = teintes(C.bleu, fonce(C.bleu, 0.22), C.bleu)
  t.poly(
    [
      [x1, y1, zMur],
      [x1, y0, zMur],
      [x1, (y0 + y1) / 2, zFaite - 6],
    ],
    murs.droite,
  )
  t.toit(x0 - 0.2, y0 - 0.2, x1 + 0.2, y1 + 0.2, zMur - 4, zFaite, 'x', bleu)
  // Les tuiles : des lignes sur la pente de devant.
  for (const k of [0.33, 0.66]) {
    const yy = (y0 + y1) / 2 + ((y1 + 0.2 - (y0 + y1) / 2) * k)
    const zz = zFaite - (zFaite - zMur + 4) * k
    t.ligne([x0 - 0.12, yy, zz], [x1 + 0.12, yy, zz], fonce(C.bleu, 0.15), 3)
  }
  // La porte bleue, au milieu de la façade de droite, avec sa marche.
  const largeurFace = (y1 - y0) * 38.15
  const milieu = largeurFace / 2
  t.surFace(
    'droite',
    x1,
    y1,
    z,
    `<path d="M${milieu - 15} 0 V-36 A15 15 0 0 1 ${milieu + 15} -36 V0 Z" fill="${fonce(C.bleu, 0.15)}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<circle cx="${milieu + 8}" cy="-20" r="3" fill="${C.jaune}" stroke="${C.encre}" stroke-width="2"/>`,
  )
  t.boite(x1, 2.15, x1 + 0.3, 2.85, z, z + 5, teintes(C.pierre, C.pierreFoncee))
  // L'enseigne ronde au casque de mineur, accrochée au pignon.
  t.surFace(
    'droite',
    x1 + 0.02,
    y1,
    zMur + 26,
    `<circle cx="${milieu}" cy="0" r="25" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<circle cx="${milieu}" cy="0" r="19" fill="none" stroke="${C.bleu}" stroke-width="5"/>` +
      // le casque : la calotte jaune, la visière, la lampe
      `<path d="M${milieu - 14} 7 Q${milieu - 14} -13 ${milieu} -13 Q${milieu + 14} -13 ${milieu + 14} 7 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<rect x="${milieu - 17}" y="5" width="34" height="6" rx="3" fill="${fonce(C.jaune, 0.15)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<circle cx="${milieu}" cy="-4" r="5" fill="${C.blanc}" stroke="${C.encre}" stroke-width="3"/>`,
  )
  // Un tableau d'annonces devant, à gauche (les offres d'embauche).
  t.boite(1.35, 4.5, 1.47, 4.62, z, 58, bois)
  t.boite(2.75, 4.5, 2.87, 4.62, z, 58, bois)
  t.boite(1.25, 4.5, 2.97, 4.58, 30, 62, teintes(C.bois, C.boisFonce))
  t.surFace(
    'gauche',
    1.25,
    4.58,
    30,
    `<rect x="8" y="-27" width="14" height="18" fill="${C.creme}" stroke="${C.encre}" stroke-width="3"/>` +
      `<rect x="28" y="-25" width="14" height="18" fill="${C.jaune}" stroke="${C.encre}" stroke-width="3"/>` +
      `<rect x="48" y="-28" width="12" height="16" fill="${C.rose}" stroke="${C.encre}" stroke-width="3"/>`,
  )
  // Un tonneau et une caisse sur le côté.
  tonneau(t, 4.4, 0.75, z, 0.28, 30)
  caisse(t, 4.1, 3.9, 0.6, z, 24, null)
  return t
}

// ---------------------------------------------------------------------------
// La foreuse : une machine orange, son moteur qui fume, et une grosse mèche en spirale
// ---------------------------------------------------------------------------

export function foreuse() {
  const t = new Toile({ taille: 5, haut: 190 })
  dalle(t, 5)
  const z = DALLE
  const metal = teintes(C.metal, fonce(C.metal, 0.22))
  const orange = teintes(C.orange, fonce(C.orange, 0.2))
  // La plateforme en métal, avec des bandes jaunes et noires sur le devant.
  const zp = z + 14
  t.boite(0.5, 0.5, 4.5, 4.5, z, zp, metal)
  t.surFace('gauche', 0.5, 4.5, z, Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 16} -2 L${18 + i * 16} -12" stroke="${C.jaune}" stroke-width="6"/>`).join(''))
  // Le pot d'échappement et sa fumée (derrière le moteur).
  t.cylindre(1.05, 0.95, 0.17, 100, 150, teintes('#6d7290', '#535774', '#8b90ab'))
  const [fx, fy] = t.pt(1.05, 0.95, 166)
  ;[
    [0, 0, 10],
    [-10, -16, 13],
  ].forEach(([dx, dy, r]) => t.ajouter(`<circle cx="${r1(fx + dx)}" cy="${r1(fy + dy)}" r="${r}" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`))
  // Le moteur : une grosse boîte orange, sa vitre, sa grille et une roue dentée.
  t.boite(0.75, 0.75, 3.1, 2.6, zp, 104, orange)
  t.boite(0.7, 0.7, 3.15, 2.65, 104, 112, teintes(fonce(C.orange, 0.12), fonce(C.orange, 0.32)))
  t.surFace(
    'gauche',
    0.75,
    2.6,
    zp,
    `<rect x="10" y="-72" width="30" height="26" rx="5" fill="${C.bleu}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/><path d="M15 -66 L22 -59" stroke="${C.blanc}" stroke-width="4"/>` +
      [24, 34].map((v) => `<path d="M58 ${-v} H82" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`).join(''),
  )
  t.surFace(
    'droite',
    3.1,
    2.6,
    zp,
    `<circle cx="36" cy="-46" r="17" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}" stroke-dasharray="7 4"/>` +
      `<circle cx="36" cy="-46" r="11" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/><circle cx="36" cy="-46" r="4" fill="${C.encre}"/>`,
  )
  // Le bras qui avance au-dessus du trou, avec ses bandes de chantier.
  const [bx0, bx1] = [1.45, 2.25]
  t.boite(bx0, 1.6, bx1, 4.05, 112, 132, orange)
  t.surFace('gauche', bx0, 4.05, 112, Array.from({ length: 3 }, (_, i) => `<path d="M${6 + i * 10} -3 L${12 + i * 10} -17" stroke="${C.encre}" stroke-width="5"/>`).join(''))
  // Le trou, la mèche en spirale et son moteur, au bout du bras.
  const [cx, cy] = [(bx0 + bx1) / 2, 3.6]
  t.ellipseSol(cx, cy, 0.62, zp, C.encre)
  const [mx, mHaut] = t.pt(cx, cy, 96)
  const [, mBas] = t.pt(cx, cy, zp + 4)
  const rx = 28
  const meche = `M${r1(mx - rx)} ${r1(mHaut)} Q${r1(mx - rx * 0.6)} ${r1((mHaut + mBas) / 2)} ${r1(mx)} ${r1(mBas)} Q${r1(mx + rx * 0.6)} ${r1((mHaut + mBas) / 2)} ${r1(mx + rx)} ${r1(mHaut)} Z`
  const id = t.nouvelId('meche')
  t.defs.push(`<clipPath id="${id}"><path d="${meche}"/></clipPath>`)
  t.ajouter(`<path d="${meche}" fill="#e3e8ef"/>`)
  for (let k = -1; k < 6; k++) {
    const y = mHaut + k * 15
    t.ajouter(`<path d="M${r1(mx - rx)} ${r1(y)} L${r1(mx + rx)} ${r1(y + 14)}" stroke="${fonce(C.metal, 0.2)}" stroke-width="7" clip-path="url(#${id})"/>`)
  }
  t.ajouter(`<path d="${meche}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.cylindre(cx, cy, 0.45, 92, 114, teintes(C.jaune, fonce(C.jaune, 0.2)))
  // Des cailloux qui volent autour de la mèche.
  for (const [dx, dy, r] of [
    [-36, -6, 5],
    [38, -12, 4],
    [-30, -24, 3.5],
  ]) {
    t.ajouter(`<circle cx="${r1(mx + dx)}" cy="${r1(mBas + dy)}" r="${r}" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="3"/>`)
  }
  // Un tas de charbon à droite (la foreuse en mange) et un bidon.
  tasDeMinerais(t, 3.9, 3.4, zp, [C.charbon, fonce(C.charbon, 0.3)], 1.5)
  t.cylindre(3.95, 1.2, 0.26, zp, zp + 30, teintes(C.redstone, fonce(C.redstone, 0.25)), { cerclages: [zp + 10, zp + 20] })
  return t
}

// ---------------------------------------------------------------------------
// Le générateur : une grosse machine en métal, avec un gros cristal de redstone et un éclair
// ---------------------------------------------------------------------------

export function generateur() {
  const t = new Toile({ taille: 5, haut: 200 })
  dalle(t, 5)
  const z = DALLE
  const metal = teintes(C.metal, fonce(C.metal, 0.22))
  const metalFonce = teintes('#6d7290', '#535774', '#8b90ab')
  // Le socle en pierre.
  const zs = z + 16
  t.boite(0.6, 0.6, 4.4, 4.4, z, zs, teintes(C.pierre, C.pierreFoncee, clair(C.pierre, 0.3)))
  // Le corps de la machine : du métal, une bande violette, un couvercle sombre.
  t.boite(1.15, 1.15, 3.85, 3.85, zs, 82, metal)
  t.boite(1.1, 1.1, 3.9, 3.9, 44, 56, teintes(C.violet, fonce(C.violet, 0.22)))
  t.boite(1.0, 1.0, 4.0, 4.0, 82, 92, metalFonce)
  // Une jauge sur la façade de gauche.
  t.surFace(
    'gauche',
    1.15,
    3.85,
    zs,
    `<circle cx="70" cy="-44" r="12" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M70 -44 L77 -50" stroke="${C.redstone}" stroke-width="4"/>` +
      [24, 34].map((u) => `<rect x="${u}" y="-30" width="6" height="16" rx="3" fill="${fonce(C.metal, 0.35)}"/>`).join(''),
  )
  // Le panneau à l'éclair sur la façade de droite (la porte).
  t.surFace(
    'droite',
    3.85,
    3.85,
    zs,
    `<rect x="32" y="-54" width="40" height="44" rx="8" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M56 -50 L40 -30 L51 -30 L46 -14 L64 -36 L53 -36 Z" fill="${C.redstone}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
  )
  // Les deux bobines de cuivre, aux coins gauche et droit, avec une boule rouge.
  const cuivre = teintes(C.orange, fonce(C.orange, 0.22))
  for (const [x, y] of [
    [0.95, 4.05],
    [4.05, 0.95],
  ]) {
    t.cylindre(x, y, 0.3, zs, 104, cuivre, { cerclages: [44, 58, 72, 86] })
    const [bx, by] = t.pt(x, y, 114)
    t.ajouter(`<circle cx="${r1(bx)}" cy="${r1(by)}" r="12" fill="${C.redstone}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
    t.ajouter(`<circle cx="${r1(bx - 4)}" cy="${r1(by - 4)}" r="3.5" fill="${C.blanc}" opacity="0.8"/>`)
  }
  // Le support du cristal, puis le gros cristal de redstone (un prisme à six faces, pointu).
  const [cx, cy] = [2.5, 2.5]
  t.cylindre(cx, cy, 0.85, 92, 102, metalFonce)
  const hexagone = (r) => Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((i / 6) * 2 * Math.PI + Math.PI / 4), cy + r * Math.sin((i / 6) * 2 * Math.PI + Math.PI / 4)])
  const rouge = teintes(C.redstone, fonce(C.redstone, 0.3), clair(C.redstone, 0.35))
  t.prisme(hexagone(0.6), 98, 152, rouge)
  t.pyramide(hexagone(0.6), 152, [cx, cy, 214], rouge)
  // Un reflet sur le cristal, et des étincelles autour.
  const [rx, ry] = t.pt(cx - 0.3, cy + 0.3, 146)
  t.ajouter(`<path d="M${r1(rx)} ${r1(ry)} L${r1(rx)} ${r1(ry - 34)}" stroke="${clair(C.redstone, 0.6)}" stroke-width="6"/>`)
  const etincelle = (x, y, zz, k) => {
    const [ex, ey] = t.pt(x, y, zz)
    t.ajouter(`<path d="M${r1(ex)} ${r1(ey - 10 * k)} L${r1(ex + 3 * k)} ${r1(ey - 3 * k)} L${r1(ex + 10 * k)} ${r1(ey)} L${r1(ex + 3 * k)} ${r1(ey + 3 * k)} L${r1(ex)} ${r1(ey + 10 * k)} L${r1(ex - 3 * k)} ${r1(ey + 3 * k)} L${r1(ex - 10 * k)} ${r1(ey)} L${r1(ex - 3 * k)} ${r1(ey - 3 * k)} Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="3"/>`)
  }
  etincelle(1.5, 3.1, 200, 1.2)
  etincelle(3.3, 1.8, 226, 1)
  etincelle(1.2, 2.2, 150, 0.8)
  return t
}

// ---------------------------------------------------------------------------
// L'icône des rails (pour les menus) : un petit bout de voie sur sa case de terre
// ---------------------------------------------------------------------------

export function iconeRails() {
  const t = new Toile({ taille: 2, haut: 20, marge: 8, bas: 8 })
  t.boite(0, 0, 2, 2, 0, 6, teintes('#d9b98a', '#b8956a', '#d9b98a'))
  const z = 6
  for (const y of [0.25, 0.75, 1.25, 1.75]) t.boite(0.3, y - 0.1, 1.7, y + 0.1, z, z + 5, teintes(C.bois, C.boisFonce))
  for (const x of [0.6, 1.4]) t.boite(x - 0.06, 0.05, x + 0.06, 1.95, z + 5, z + 11, teintes(C.metal, fonce(C.metal, 0.25), clair(C.metal, 0.4)))
  return t
}

