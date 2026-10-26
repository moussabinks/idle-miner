// Les bâtiments du village (5 × 5 cases), chacun posé sur sa dalle de pavés : le marché, le
// forgeron, le Personnel, la foreuse, le générateur, (26/10) la fonderie et la joaillerie. La
// mine (10 × 10) est dans mine.mjs.
//
// Chaque dessin est fait en « cases » (x et y de 0 à 5, z en pixels vers le haut), du fond vers
// l'avant : ce qui est dessiné après passe devant. La porte de chaque bâtiment est du côté donné
// dans src/jeu/donnees.ts : « gauche » = la façade en bas à gauche (y = 5), « droite » = celle en
// bas à droite (x = 5).

import { C, DX, DY, Toile, TRAIT, TRAIT_FIN, clair, fonce, minerai, points, polygone, r1, rocher, teintes } from './formes.mjs'

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
// Le forgeron (25/10, redessiné) : une vraie forge. Au fond à droite, un grand four en pierre
// sombre dont la bouche crache un feu orange, et sa haute cheminée en briques qui fume ; les
// outils accrochés sur son mur et un tonneau d'eau qui fume (pour tremper le fer). Devant, la
// grosse enclume noire sur sa souche, une barre de fer rouge dessus, le marteau et des
// étincelles ; une meule à aiguiser, un tonneau plein d'épées et un tas de charbon.
// ---------------------------------------------------------------------------

// Les couleurs de la forge : la pierre sombre, les briques de la cheminée, le feu.
const PIERRE_FORGE = '#8f91a8'
const BRIQUE = '#c4664a'
const FEU = '#ff9a3c'
const FEU_CLAIR = '#ffd84a'

// L'enclume, vue de côté : sa silhouette (le pied, la taille, la table et la bigorne pointue)
// en [u, hauteur], u en cases le long des x depuis (x, y), découpée dans une plaque épaisse de
// « epaisseur » cases (de y - epaisseur à y). On dessine la plaque du fond (à l'ombre), le dessus de
// la table et de la bigorne (éclairés), puis la silhouette de devant.
const SILHOUETTE_ENCLUME = [
  [0.3, 0],
  [1.3, 0],
  [1.15, 7],
  [1.0, 10],
  [1.0, 18],
  [1.4, 22],
  [1.55, 34],
  [0.5, 34],
  [-0.2, 31],
  [0.2, 26],
  [0.55, 22],
  [0.62, 18],
  [0.62, 10],
  [0.45, 7],
]
function enclume(t, x, y, z, epaisseur, teinte) {
  const sommet = (y_) => SILHOUETTE_ENCLUME.map(([u, h]) => [x + u, y_, z + h])
  t.poly(sommet(y - epaisseur), teinte.droite)
  // Le dessus de la table, puis celui de la bigorne (entre la silhouette du fond et celle de devant).
  for (const [a, b] of [
    [6, 7],
    [7, 8],
  ]) {
    const [ua, ha] = SILHOUETTE_ENCLUME[a]
    const [ub, hb] = SILHOUETTE_ENCLUME[b]
    t.poly(
      [
        [x + ua, y, z + ha],
        [x + ub, y, z + hb],
        [x + ub, y - epaisseur, z + hb],
        [x + ua, y - epaisseur, z + ha],
      ],
      teinte.haut,
    )
  }
  t.poly(sommet(y), teinte.gauche)
  // Un reflet sur le bord de la table.
  t.ligne([x + 0.55, y, z + 31], [x + 1.45, y, z + 31], clair(teinte.gauche, 0.35), 3)
}

// Une étincelle de forge (une petite étoile jaune à quatre branches), en points du dessin.
function etincelleForge(x, y, r) {
  return `<path d="M${r1(x)} ${r1(y - r)} L${r1(x + r * 0.28)} ${r1(y - r * 0.28)} L${r1(x + r)} ${r1(y)} L${r1(x + r * 0.28)} ${r1(y + r * 0.28)} L${r1(x)} ${r1(y + r)} L${r1(x - r * 0.28)} ${r1(y + r * 0.28)} L${r1(x - r)} ${r1(y)} L${r1(x - r * 0.28)} ${r1(y - r * 0.28)} Z" fill="${FEU_CLAIR}" stroke="${C.encre}" stroke-width="2.5"/>`
}

export function forgeron() {
  const t = new Toile({ taille: 5, haut: 214 })
  dalle(t, 5)
  const z = DALLE
  const pierre = teintes(PIERRE_FORGE, fonce(PIERRE_FORGE, 0.22), clair(PIERRE_FORGE, 0.3))
  const briques = teintes(BRIQUE, fonce(BRIQUE, 0.25), clair(BRIQUE, 0.25))
  const bois = teintes(C.bois, C.boisFonce)

  // Le four : un gros bloc de pierre sombre, au fond à droite. Sa bouche est sur la façade de
  // gauche (celle qu'on voit le mieux), les outils sont accrochés sur celle de droite.
  const [x0, y0, x1, y1, zMur] = [1.95, 0.4, 4.25, 2.5, 80]

  // La lueur du feu, à plat sur les pavés devant la bouche du four.
  const [lx, ly] = t.pt(3.3, 3.25, z)
  t.ajouter(`<ellipse cx="${r1(lx)}" cy="${r1(ly)}" rx="74" ry="34" fill="${FEU}" opacity="0.32"/>`)

  // Le tonneau plein d'épées, au fond à gauche.
  const [ex, ey] = t.pt(0.65, 1.45, z + 30)
  for (const [dx, h] of [
    [-9, 40],
    [8, 34],
    [0, 48],
  ]) {
    const lame = `M${r1(ex + dx)} ${r1(ey)} L${r1(ex + dx)} ${r1(ey - h)}`
    t.ajouter(`<path d="${lame}" stroke="${C.encre}" stroke-width="13"/><path d="${lame}" stroke="${C.metal}" stroke-width="7"/>`)
    t.ajouter(`<path d="M${r1(ex + dx - 2)} ${r1(ey - h + 4)} L${r1(ex + dx - 2)} ${r1(ey - 8)}" stroke="${C.blanc}" stroke-width="2.5"/>`)
    t.ajouter(`<rect x="${r1(ex + dx - 8)}" y="${r1(ey - 9)}" width="16" height="6" rx="2" fill="${C.or}" stroke="${C.encre}" stroke-width="3"/>`)
  }
  t.cylindre(0.65, 1.45, 0.32, z, z + 30, bois, { cerclages: [z + 8, z + 22] })

  t.boite(x0, y0, x1, y1, z, zMur, pierre)
  // Les pierres dessinées sur les deux façades qu'on voit.
  const pierresMur = (cote, liste) => {
    for (const [u, v, l] of liste) {
      t.surFace(cote, cote === 'gauche' ? x0 : x1, y1, z, `<rect x="${u}" y="${-v}" width="${l}" height="11" rx="5" fill="none" stroke="${fonce(PIERRE_FORGE, 0.3)}" stroke-width="3"/>`)
    }
  }
  pierresMur('gauche', [
    [6, 20, 14],
    [8, 64, 18],
    [84, 66, 16],
    [86, 20, 12],
  ])
  pierresMur('droite', [[50, 14, 18]])
  // La bouche du four : une grande arche de pierres claires, le noir du four, de grandes flammes
  // et des braises.
  const faceFour = (x1 - x0) * 38.15
  const m = faceFour / 2
  t.surFace(
    'gauche',
    x0,
    y1,
    z,
    `<path d="M${r1(m - 41)} 0 V-34 A41 41 0 0 1 ${r1(m + 41)} -34 V0 Z" fill="${clair(PIERRE_FORGE, 0.3)}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(m - 41)} -34 A41 41 0 0 1 ${r1(m + 41)} -34" fill="none" stroke="${C.encre}" stroke-width="3" stroke-dasharray="3 14"/>` +
      `<path d="M${r1(m - 30)} -6 V-34 A30 30 0 0 1 ${r1(m + 30)} -34 V-6 Z" fill="${C.encre}"/>` +
      `<path d="M${r1(m - 26)} -8 Q${r1(m - 30)} -30 ${r1(m - 14)} -44 Q${r1(m - 12)} -30 ${r1(m - 4)} -34 Q${r1(m - 2)} -50 ${r1(m + 6)} -58 Q${r1(m + 10)} -40 ${r1(m + 16)} -42 Q${r1(m + 30)} -26 ${r1(m + 26)} -8 Z" fill="${FEU}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M${r1(m - 16)} -8 Q${r1(m - 18)} -24 ${r1(m - 6)} -30 Q${r1(m - 2)} -22 ${r1(m + 4)} -40 Q${r1(m + 18)} -24 ${r1(m + 16)} -8 Z" fill="${FEU_CLAIR}"/>` +
      [-20, -8, 4, 16].map((dx, i) => `<circle cx="${r1(m + dx)}" cy="-8" r="7" fill="${i % 2 ? '#ff6b3a' : '#e2483d'}" stroke="${C.encre}" stroke-width="3"/>`).join('') +
      `<rect x="${r1(m - 46)}" y="-7" width="92" height="9" rx="3" fill="${clair(PIERRE_FORGE, 0.15)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
  )
  // Sur la façade de droite, le râtelier : une planche et les outils accrochés (une pioche, une
  // pince, un marteau, une épée).
  const faceDroite = (y1 - y0) * 38.15
  const outil = (chemin, couleur, largeur) => `<path d="${chemin}" stroke="${C.encre}" stroke-width="${largeur + 6}" fill="none"/><path d="${chemin}" stroke="${couleur}" stroke-width="${largeur}" fill="none"/>`
  t.surFace(
    'droite',
    x1,
    y1,
    z,
    `<rect x="6" y="-62" width="${r1(faceDroite - 12)}" height="9" rx="3" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      // la pioche
      outil('M20 -54 L20 -18', C.bois, 4) +
      outil('M7 -48 Q20 -60 33 -48', C.metal, 5) +
      // la pince
      outil('M40 -54 L36 -22 M44 -54 L48 -22', C.metal, 3) +
      // le marteau
      outil('M62 -54 L62 -22', C.bois, 4) +
      `<rect x="54" y="-34" width="16" height="11" rx="2" fill="${C.metal}" stroke="${C.encre}" stroke-width="3"/>`,
  )
  // Le dessus du four : une dalle qui déborde un peu, puis la haute cheminée en briques qui fume.
  t.boite(x0 - 0.08, y0 - 0.08, x1 + 0.08, y1 + 0.08, zMur, zMur + 10, teintes(fonce(PIERRE_FORGE, 0.08), fonce(PIERRE_FORGE, 0.3), clair(PIERRE_FORGE, 0.2)))
  const [c0, c1, d0, d1] = [3.2, 3.95, 0.6, 1.35]
  t.boite(c0, d0, c1, d1, zMur + 10, zMur + 30, pierre)
  const zCheminee = 196
  t.boite(c0 + 0.08, d0 + 0.08, c1 - 0.08, d1 - 0.08, zMur + 30, zCheminee, briques)
  for (let zz = zMur + 44; zz < zCheminee - 6; zz += 16) {
    t.ligne([c0 + 0.1, d1 - 0.08, zz], [c1 - 0.1, d1 - 0.08, zz], fonce(BRIQUE, 0.35), 3)
    t.ligne([c1 - 0.08, d1 - 0.1, zz], [c1 - 0.08, d0 + 0.1, zz], fonce(BRIQUE, 0.45), 3)
  }
  t.boite(c0, d0, c1, d1, zCheminee, zCheminee + 12, teintes(fonce(PIERRE_FORGE, 0.1), fonce(PIERRE_FORGE, 0.3)))
  // La fumée, un peu grise (le charbon).
  const [fx, fy] = t.pt((c0 + c1) / 2, (d0 + d1) / 2, zCheminee + 30)
  ;[
    [0, 0, 11],
    [-12, -16, 14],
    [-2, -38, 17],
  ].forEach(([dx, dy, r]) => t.ajouter(`<circle cx="${r1(fx + dx)}" cy="${r1(fy + dy)}" r="${r}" fill="#e6e1d8" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`))

  // Un tas de charbon au pied de la bouche du four.
  const [kx, ky] = t.pt(2.55, 3.3, z)
  for (const [dx, dy, taille, angle] of [
    [-12, -4, 20, -20],
    [10, -6, 18, 15],
    [-1, -14, 20, 5],
    [0, 2, 20, -35],
  ]) {
    t.ajouter(minerai('charbon', kx + dx, ky + dy, taille, angle))
  }

  // L'enclume, devant à gauche : une souche, la grosse enclume noire, une barre de fer rouge sur
  // sa table, le marteau appuyé contre la souche et des étincelles qui jaillissent.
  const [ax, ay] = [1.7, 4.2]
  const zs = z + 14
  t.cylindre(ax, ay, 0.46, z, zs, bois)
  const noir = teintes('#4a4658', '#2f2c3a', '#8a869c')
  enclume(t, ax - 0.75, ay + 0.22, zs, 0.44, noir)
  // La barre de fer rouge, posée sur la table.
  t.boite(ax - 0.1, ay - 0.12, ax + 0.55, ay + 0.04, zs + 34, zs + 40, teintes(FEU, fonce(FEU, 0.25), FEU_CLAIR), { trait: TRAIT_FIN })
  // Le marteau, appuyé contre la souche.
  const [hx, hy] = t.pt(ax - 0.3, ay + 0.5, z)
  t.ajouter(
    `<path d="M${r1(hx)} ${r1(hy)} L${r1(hx - 10)} ${r1(hy - 34)}" stroke="${C.encre}" stroke-width="11"/><path d="M${r1(hx)} ${r1(hy)} L${r1(hx - 10)} ${r1(hy - 34)}" stroke="${C.bois}" stroke-width="5"/>` +
      `<rect x="${r1(hx - 22)}" y="${r1(hy - 44)}" width="24" height="13" rx="3" fill="#9a9fb8" stroke="${C.encre}" stroke-width="${TRAIT_FIN}" transform="rotate(-16 ${r1(hx - 10)} ${r1(hy - 37)})"/>`,
  )
  const [px, py] = t.pt(ax + 0.2, ay - 0.05, zs + 44)
  t.ajouter(
    [
      [-24, -14, 8],
      [-6, -30, 10],
      [14, -20, 7],
      [-34, 0, 5],
      [26, -2, 5],
      [6, -48, 6],
    ]
      .map(([dx, dy, r]) => etincelleForge(px + dx, py + dy, r))
      .join(''),
  )

  // La meule à aiguiser, devant : une roue de pierre dans un bâti en bois.
  t.boite(3.6, 4.05, 4.3, 4.4, z, z + 12, bois)
  const meule = 0.7 * 19
  t.surFace(
    'gauche',
    3.6,
    4.23,
    z + 12,
    `<circle cx="${r1(meule)}" cy="-8" r="19" fill="${C.pierre}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<circle cx="${r1(meule)}" cy="-8" r="11" fill="none" stroke="${C.pierreFoncee}" stroke-width="3"/>` +
      `<circle cx="${r1(meule)}" cy="-8" r="4" fill="#6d7290" stroke="${C.encre}" stroke-width="3"/>` +
      `<path d="M${r1(meule)} -8 L${r1(meule + 26)} -20" stroke="${C.encre}" stroke-width="9"/><path d="M${r1(meule)} -8 L${r1(meule + 25)} -20" stroke="${C.bois}" stroke-width="4"/>`,
  )

  // Le tonneau d'eau pour tremper le fer, contre le four à droite, et sa vapeur.
  t.cylindre(4.62, 0.95, 0.36, z, z + 32, bois, { cerclages: [z + 8, z + 24] })
  t.ellipseSol(4.62, 0.95, 0.28, z + 32, C.bleu, { trait: 0 })
  const [vx, vy] = t.pt(4.62, 0.95, z + 44)
  ;[
    [-4, 0, 6],
    [4, -10, 7],
    [-2, -22, 8],
  ].forEach(([dx, dy, r]) => t.ajouter(`<circle cx="${r1(vx + dx)}" cy="${r1(vy + dy)}" r="${r}" fill="${C.blanc}" stroke="${C.encre}" stroke-width="3"/>`))
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
// La foreuse (25/10, redessinée) : une mèche en acier en forme de carotte (longue, pointue, avec
// ses rainures en spirale), qui s'enfonce dans un trou plein de terre, tenue par un portique
// jaune ; au-dessus, une roue dentée et un petit moteur rond en acier qui fume. Juste à côté de la mèche, un petit coffre en
// bois cerclé de fer, plein de charbon (ce que la foreuse a sorti) ; un bidon au fond.
// ---------------------------------------------------------------------------

// L'acier de la mèche : le clair, le foncé (les rainures en spirale) et le reflet.
const ACIER = '#b8c0cc'
const ACIER_FONCE = '#7f889a'
const ACIER_REFLET = '#eef1f6'
// La terre retournée autour du trou.
const TERRE = '#c9a274'

// Des bandes de chantier (jaunes et noires, en biais) sur une façade, à dessiner avec surFace :
// un rectangle de « longueur » sur « hauteur », posé sur le point d'origine de la façade.
function bandesChantier(t, longueur, hauteur, jaune = C.jaune) {
  const id = t.nouvelId('chantier')
  t.defs.push(`<clipPath id="${id}"><rect x="0" y="${-hauteur}" width="${r1(longueur)}" height="${hauteur}"/></clipPath>`)
  let raies = ''
  for (let u = -hauteur; u < longueur; u += 22) {
    raies += `<path d="M${r1(u)} 0 L${r1(u + hauteur)} ${-hauteur} L${r1(u + hauteur + 11)} ${-hauteur} L${r1(u + 11)} 0 Z" fill="${C.encre}"/>`
  }
  return (
    `<rect x="0" y="${-hauteur}" width="${r1(longueur)}" height="${hauteur}" fill="${jaune}"/>` +
    `<g clip-path="url(#${id})">${raies}</g>` +
    `<rect x="0" y="${-hauteur}" width="${r1(longueur)}" height="${hauteur}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`
  )
}

// (26/10) Une petite animation dans l'image elle-même (SMIL, sans CSS) : les « images » (des bouts
// de SVG) sont montrées l'une après l'autre, en boucle, chacune pendant sa part de « duree »
// secondes (calcMode discrete : on passe d'une image à l'autre d'un coup, sans fondu). Avec une
// seule image, rien ne bouge. La mèche de la foreuse et la fonderie s'en servent.
function enBoucle(images, duree) {
  const n = images.length
  if (n <= 1) return images[0] ?? ''
  const cles = Array.from({ length: n }, (_, i) => r1((i / n) * 1000) / 1000).join(';')
  let svg = ''
  for (let i = 0; i < n; i++) {
    const valeurs = Array.from({ length: n }, (_, j) => (j === i ? 'visible' : 'hidden')).join(';')
    svg += `<g visibility="${i === 0 ? 'visible' : 'hidden'}"><animate attributeName="visibility" values="${valeurs}" keyTimes="${cles}" calcMode="discrete" dur="${duree}s" repeatCount="indefinite"/>${images[i]}</g>`
  }
  return svg
}

// La mèche en forme de carotte, vue de côté : large en haut, de plus en plus fine jusqu'à sa
// pointe, entourée de rainures en spirale. (mx, yHaut) : le milieu de son haut, en pixels du
// dessin ; rx : son rayon en haut (en pixels) ; longueur : de son haut à sa pointe (en pixels).
// « coupe » : un clipPath qui cache ce qui est enfoncé dans le trou.
// (26/10) « images » : 1 pour une mèche immobile ; plus, pour une mèche qui TOURNE (la version
// « en marche » de la foreuse) : les rainures en spirale sont dessinées autant de fois, chaque fois
// un peu plus bas, et le SVG les montre l'une après l'autre en boucle (une animation SMIL, dans
// l'image elle-même : aucune animation CSS sur l'image, qui la rendait floue).
const IMAGES_MECHE = 6
const DUREE_TOUR_MECHE = 0.42 // secondes pour un demi-pas de spirale (le motif se répète)
function meche(t, mx, yHaut, rx, longueur, coupe, images = 1) {
  const ry = rx * 0.58 // un cercle couché, vu à l'angle du jeu
  // Le rayon de la mèche à la profondeur h (en pixels sous son haut) : comme une carotte, il
  // diminue doucement puis plus vite vers la pointe.
  const rayon = (h) => rx * Math.pow(Math.max(0, 1 - h / longueur), 0.7)
  // Le contour : le côté gauche de haut en bas, la pointe, le côté droit de bas en haut, et
  // l'arrondi du haut (la moitié de devant de l'ellipse).
  const cotes = []
  for (let i = 0; i <= 12; i++) cotes.push([mx - rayon((i / 12) * longueur), yHaut + (i / 12) * longueur])
  for (let i = 12; i >= 0; i--) cotes.push([mx + rayon((i / 12) * longueur), yHaut + (i / 12) * longueur])
  const corps = `M${points(cotes).replace(/ /g, ' L')} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(mx - rx)} ${r1(yHaut)} Z`
  const idCorps = t.nouvelId('meche')
  t.defs.push(`<clipPath id="${idCorps}"><path d="${corps}"/></clipPath>`)
  // Le côté droit, à l'ombre : la même mèche, en plus sombre, au-delà de cette ligne.
  const idOmbre = t.nouvelId('ombre')
  t.defs.push(`<clipPath id="${idOmbre}"><rect x="${r1(mx + rx * 0.3)}" y="${r1(yHaut - ry - 10)}" width="${r1(rx)}" height="${r1(longueur + ry + 20)}"/></clipPath>`)

  // Une rainure en spirale (une hélice) : on suit le devant de la mèche, de la gauche (angle
  // -90°) à la droite (+90°) ; elle descend d'un demi-pas pendant ce temps. h : où elle commence.
  const pas = 84
  const helice = (h) => {
    const liste = []
    for (let i = 0; i <= 16; i++) {
      const a = -Math.PI / 2 + (i / 16) * Math.PI
      const hh = h + (pas / 2) * (i / 16)
      const r = rayon(Math.max(0, hh))
      liste.push([mx + r * Math.sin(a), yHaut + hh + r * 0.4 * Math.cos(a)])
    }
    return liste
  }
  const largeurRainure = 20
  // « decalage » : de 0 à 1, de combien la spirale est descendue (une image de l'animation).
  const rainures = (clair, fonce_, decalage = 0) => {
    let svg = `<rect x="${r1(mx - rx - 4)}" y="${r1(yHaut - ry - 4)}" width="${r1(2 * rx + 8)}" height="${r1(longueur + ry + 8)}" fill="${clair}"/>`
    for (let h = -pas + (decalage * pas) / 2; h < longueur; h += pas / 2) {
      const haut = helice(h)
      const bas = helice(h + largeurRainure)
      svg += polygone([...haut, ...bas.reverse()], fonce_, 0)
      // Les bords de la rainure, soulignés à l'encre.
      for (const bord of [helice(h), helice(h + largeurRainure)]) {
        svg += `<polyline points="${points(bord)}" fill="none" stroke="${C.encre}" stroke-width="3"/>`
      }
    }
    return svg
  }
  // Une image de la mèche : ses rainures (au soleil, et à l'ombre à droite).
  const uneImage = (decalage) => rainures(ACIER, ACIER_FONCE, decalage) + `<g clip-path="url(#${idOmbre})">${rainures(fonce(ACIER, 0.18), fonce(ACIER_FONCE, 0.2), decalage)}</g>`
  let svg = `<g clip-path="url(#${idCorps})">`
  svg += enBoucle(
    Array.from({ length: Math.max(1, images) }, (_, i) => uneImage(i / Math.max(1, images))),
    DUREE_TOUR_MECHE,
  )
  // Le reflet : une bande claire qui suit le côté gauche de la mèche.
  const reflet = []
  for (let i = 0; i <= 10; i++) reflet.push([mx - rayon((i / 10) * longueur) * 0.55, yHaut - ry * 0.6 + (i / 10) * longueur * 0.9])
  for (let i = 10; i >= 0; i--) reflet.push([mx - rayon((i / 10) * longueur) * 0.3, yHaut - ry * 0.6 + (i / 10) * longueur * 0.9])
  svg += polygone(reflet, ACIER_REFLET, 0).replace('/>', ' opacity="0.85"/>')
  svg += `</g>`
  svg += `<path d="${corps}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`
  t.ajouter(coupe ? `<g clip-path="url(#${coupe})">${svg}</g>` : svg)
}

// Quelques morceaux de charbon (de la forme de l'icône du jeu) posés en tas autour de (x, y, z).
function tasDeCharbon(t, x, y, z, k = 1) {
  const [cx, cy] = t.pt(x, y, z)
  for (const [dx, dy, taille, angle] of [
    [-12, -6, 22, -20],
    [10, -8, 20, 15],
    [-1, -16, 22, 5],
    [-14, 4, 18, 30],
    [13, 3, 19, -10],
    [0, 2, 22, -35],
  ]) {
    t.ajouter(minerai('charbon', cx + dx * k, cy + dy * k, taille * k, angle))
  }
}

// Le petit coffre de la foreuse : en bois, cerclé de fer, le couvercle ouvert (penché vers le
// fond) et plein de charbon. Son coin du fond en (x0, y0), « lx » cases dans le sens des x, « ly »
// dans le sens des y.
function coffreForeuse(t, x0, y0, lx, ly, z) {
  const [x1, y1, z1] = [x0 + lx, y0 + ly, z + 28]
  const ferrure = teintes('#6d7290', '#535774', '#8b90ab')
  // Le couvercle ouvert, penché vers le fond (on voit son dedans, plus sombre).
  t.poly(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y0 - 0.3, z1 + 30],
      [x0, y0 - 0.3, z1 + 30],
    ],
    fonce(C.boisFonce, 0.25),
  )
  t.boite(x0, y0, x1, y1, z, z1, teintes(C.bois, C.boisFonce))
  // Le dedans, sombre, puis le charbon qui dépasse.
  t.poly(
    [
      [x0 + 0.07, y0 + 0.07, z1],
      [x1 - 0.07, y0 + 0.07, z1],
      [x1 - 0.07, y1 - 0.07, z1],
      [x0 + 0.07, y1 - 0.07, z1],
    ],
    fonce(C.boisFonce, 0.45),
    { trait: TRAIT_FIN },
  )
  // Les bandes de fer (deux sur chaque façade qu'on voit) et la serrure dorée.
  for (const x of [x0 + 0.13, x1 - 0.13]) t.ligne([x, y1, z + 3], [x, y1, z1 - 2], ferrure.droite, 4)
  for (const y of [y0 + 0.12, y1 - 0.12]) t.ligne([x1, y, z + 3], [x1, y, z1 - 2], fonce(ferrure.droite, 0.2), 4)
  const [sx, sy] = t.pt((x0 + x1) / 2, y1, z1 - 9)
  t.ajouter(`<rect x="${r1(sx - 5)}" y="${r1(sy - 4)}" width="10" height="12" rx="2" fill="${C.jaune}" stroke="${C.encre}" stroke-width="3"/>`)
  tasDeCharbon(t, (x0 + x1) / 2, (y0 + y1) / 2, z1 + 2, 0.9)
}

// (26/10) « enMarche » : la mèche tourne (le dessin foreuse-active.svg, montré quand elle fore).
export function foreuse({ enMarche = false } = {}) {
  const t = new Toile({ taille: 5, haut: 214 })
  dalle(t, 5)
  const z = DALLE
  const jaune = teintes(C.jaune, fonce(C.jaune, 0.2), clair(C.jaune, 0.35))
  const metalFonce = teintes('#6d7290', '#535774', '#8b90ab')

  // La plateforme en acier, rayée de bandes de chantier sur ses deux façades de devant.
  const zp = z + 14
  const [p0, p1] = [0.3, 4.7]
  t.boite(p0, p0, p1, p1, z, zp, teintes(C.metal, fonce(C.metal, 0.22)))
  t.surFace('gauche', p0, p1, z + 3, bandesChantier(t, (p1 - p0) * 38.15, 9))
  t.surFace('droite', p1, p1, z + 3, bandesChantier(t, (p1 - p0) * 38.15, 9, fonce(C.jaune, 0.2)))

  // L'axe de la mèche : au milieu de la dalle.
  const A = 2.45
  // Un bidon de carburant, au fond à droite.
  t.cylindre(4.1, 0.75, 0.24, zp, zp + 32, teintes(C.redstone, fonce(C.redstone, 0.25)), { cerclages: [zp + 11, zp + 21] })

  // La terre retournée autour du trou, puis le trou (sa paroi du fond, plus claire, et le noir).
  t.ellipseSol(A, A, 1.25, zp, TERRE)
  t.ellipseSol(A, A, 0.82, zp, fonce(TERRE, 0.55))
  const [tx, ty] = t.pt(A, A, zp)
  const rxTrou = 0.82 * DX * Math.SQRT2
  const ryTrou = 0.82 * DY * Math.SQRT2
  t.ajouter(`<ellipse cx="${r1(tx)}" cy="${r1(ty + 5)}" rx="${r1(rxTrou - 6)}" ry="${r1(ryTrou - 6)}" fill="${C.encre}"/>`)

  // Le portique : deux pieds jaunes de part et d'autre du trou, des croisillons entre eux, et la
  // grosse poutre du haut, sur la diagonale qui passe par l'axe (elle est en travers à l'écran).
  const zPoutre = 150
  const pieds = [
    [1.0, 3.9],
    [3.9, 1.0],
  ]
  const [g, d] = pieds
  // Les croisillons (derrière la mèche).
  t.poutre([g[0], g[1], zp + 16], [d[0], d[1], zPoutre - 6], C.jaune, 7)
  t.poutre([d[0], d[1], zp + 16], [g[0], g[1], zPoutre - 6], C.jaune, 7)
  for (const [x, y] of pieds) {
    const e = 0.22
    t.boite(x - e - 0.07, y - e - 0.07, x + e + 0.07, y + e + 0.07, zp, zp + 8, metalFonce) // le sabot
    t.boite(x - e, y - e, x + e, y + e, zp + 8, zPoutre, jaune)
    // Des bandes de chantier en bas du pied, et des rivets.
    t.surFace('gauche', x - e, y + e, zp + 12, bandesChantier(t, 2 * e * 38.15, 26))
    t.surFace('droite', x + e, y + e, zp + 12, bandesChantier(t, 2 * e * 38.15, 26, fonce(C.jaune, 0.2)))
    for (const zr of [70, 96, 122]) {
      const [rx_, ry_] = t.pt(x - e + 0.22, y + e, zr)
      t.ajouter(`<circle cx="${r1(rx_)}" cy="${r1(ry_)}" r="3.2" fill="${fonce(C.jaune, 0.35)}"/>`)
    }
  }
  // La poutre du haut, de pied en pied.
  const k = 0.26
  t.prisme(
    [
      [g[0] - 0.3 - k, g[1] + 0.3 - k],
      [d[0] + 0.3 - k, d[1] - 0.3 - k],
      [d[0] + 0.3 + k, d[1] - 0.3 + k],
      [g[0] - 0.3 + k, g[1] + 0.3 + k],
    ],
    zPoutre,
    zPoutre + 20,
    jaune,
  )

  // Le moteur (25/10 : plus de grosse caisse orange) : sur la poutre, une grande roue dentée
  // couchée qui fait tourner l'axe de la mèche, et au-dessus un petit moteur rond en acier, cerclé,
  // boulonné, avec son pot d'échappement qui fume.
  const acier = teintes('#a9b1bf', '#7f889a', '#d3d8e1')
  const zRoue = zPoutre + 20
  // La roue dentée : son épaisseur (la même roue, plus sombre, un peu plus bas), puis son dessus.
  const roue = (zz, rInt, rExt, dents) => {
    const liste = []
    for (let i = 0; i < dents * 4; i++) {
      const a = (i / (dents * 4)) * 2 * Math.PI
      const r = i % 4 === 1 || i % 4 === 2 ? rExt : rInt
      liste.push(t.pt(A + r * Math.cos(a), A + r * Math.sin(a), zz))
    }
    return liste
  }
  t.ajouter(polygone(roue(zRoue, 0.8, 1.0, 10), acier.droite, TRAIT_FIN))
  t.ajouter(polygone(roue(zRoue + 10, 0.8, 1.0, 10), acier.haut, TRAIT_FIN))
  t.ellipseSol(A, A, 0.6, zRoue + 10, acier.gauche, { trait: 3 })
  // Les boulons sur la roue.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * Math.PI + 0.3
    const [bx, by] = t.pt(A + 0.7 * Math.cos(a), A + 0.7 * Math.sin(a), zRoue + 10)
    t.ajouter(`<circle cx="${r1(bx)}" cy="${r1(by)}" r="3.4" fill="${C.encre}"/>`)
  }
  // Le petit moteur rond, posé sur la roue : un cylindre d'acier cerclé, un dôme, un voyant.
  const [zm0, zm1] = [zRoue + 10, zRoue + 42]
  t.cylindre(A, A, 0.42, zm0, zm1, acier, { cerclages: [zm0 + 8] })
  const [dx_, dy_] = t.pt(A, A, zm1)
  const rxDome = 0.42 * DX * Math.SQRT2
  t.ajouter(`<path d="M${r1(dx_ - rxDome)} ${r1(dy_)} A${r1(rxDome)} ${r1(rxDome * 0.8)} 0 0 1 ${r1(dx_ + rxDome)} ${r1(dy_)} Z" fill="${acier.haut}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<circle cx="${r1(dx_)}" cy="${r1(dy_ - rxDome * 0.8 - 2)}" r="5" fill="${C.encre}"/>`)
  const [vx_, vy_] = t.pt(A - 0.12, A + 0.42, zm0 + 20)
  t.ajouter(`<circle cx="${r1(vx_)}" cy="${r1(vy_)}" r="6" fill="${C.redstone}" stroke="${C.encre}" stroke-width="3"/><circle cx="${r1(vx_ - 2)}" cy="${r1(vy_ - 2)}" r="1.8" fill="${C.blanc}"/>`)
  // Le pot d'échappement, un tuyau coudé qui sort du moteur, et sa fumée.
  const [ex0, ey0] = t.pt(A + 0.3, A - 0.3, zm0 + 18)
  const tuyau = `M${r1(ex0)} ${r1(ey0)} L${r1(ex0 + 22)} ${r1(ey0)} L${r1(ex0 + 22)} ${r1(ey0 - 40)}`
  t.ajouter(`<path d="${tuyau}" stroke="${C.encre}" stroke-width="${10 + 2 * TRAIT_FIN}" fill="none"/><path d="${tuyau}" stroke="#6d7290" stroke-width="10" fill="none"/>`)
  ;[
    [22, -54, 9],
    [32, -70, 12],
    [24, -91, 15],
  ].forEach(([dx, dy, r]) => t.ajouter(`<circle cx="${r1(ex0 + dx)}" cy="${r1(ey0 + dy)}" r="${r}" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`))

  // Le mandrin (ce qui tient la mèche, sous la poutre), puis la mèche en carotte, dont la pointe
  // entre dans le trou : on la coupe sous le bord de devant du trou.
  const zMeche = 112
  t.cylindre(A, A, 0.3, zMeche, zPoutre, metalFonce, { cerclages: [zMeche + 14, zMeche + 22] })
  const coupe = t.nouvelId('trou')
  t.defs.push(
    `<clipPath id="${coupe}"><path d="M${r1(tx - 300)} ${r1(ty - 600)} L${r1(tx + 300)} ${r1(ty - 600)} L${r1(tx + 300)} ${r1(ty)} L${r1(tx + rxTrou)} ${r1(ty)} A${r1(rxTrou)} ${r1(ryTrou)} 0 0 1 ${r1(tx - rxTrou)} ${r1(ty)} L${r1(tx - 300)} ${r1(ty)} Z"/></clipPath>`,
  )
  const [, yMeche] = t.pt(A, A, zMeche)
  meche(t, tx, yMeche, 30, zMeche - zp + 14, coupe, enMarche ? IMAGES_MECHE : 1)
  // Le bord de devant du trou, et des mottes de terre et des cailloux autour.
  t.ajouter(`<path d="M${r1(tx - rxTrou)} ${r1(ty)} A${r1(rxTrou)} ${r1(ryTrou)} 0 0 0 ${r1(tx + rxTrou)} ${r1(ty)}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  for (const [dx, dy, l, h, graine, couleur] of [
    [-62, 12, 26, 18, 3, TERRE],
    [-40, 30, 20, 14, 5, C.pierre],
    [56, 16, 26, 18, 7, TERRE],
    [-8, 40, 18, 12, 11, C.pierre],
  ]) {
    t.ajouter(rocher(tx + dx, ty + dy, l, h, graine, couleur, TRAIT_FIN))
  }
  // Des cailloux qui volent autour de la pointe (elle creuse !).
  for (const [dx, dy, r] of [
    [-44, -22, 5],
    [-36, -42, 3.5],
    [46, -26, 4.5],
    [40, -46, 3],
  ]) {
    t.ajouter(`<circle cx="${r1(tx + dx)}" cy="${r1(ty + dy)}" r="${r}" fill="${fonce(TERRE, 0.25)}" stroke="${C.encre}" stroke-width="3"/>`)
  }
  // Juste à côté de la mèche, devant à droite : le petit coffre de la foreuse, plein de charbon.
  coffreForeuse(t, 3.75, 2.2, 1.0, 0.7, zp)
  // Quelques morceaux de charbon par terre, devant à gauche.
  tasDeCharbon(t, 0.95, 4.3, zp, 0.8)
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
// (26/10) Les outils de la fonderie et de la joaillerie
// ---------------------------------------------------------------------------

// Un tronc de pyramide : un polygone en bas (à la hauteur zBas) et un plus petit en haut (zHaut),
// avec le même nombre de coins. Pour le haut du four de la fonderie, le toit de la joaillerie, la
// couronne de la gemme...
function tronc(t, bas, zBas, haut, zHaut, teinte, options) {
  const n = bas.length
  const sommets = [...bas.map(([x, y]) => [x, y, zBas]), ...haut.map(([x, y]) => [x, y, zHaut])]
  const faces = [haut.map((_, i) => n + i)]
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i])
  t.volume(sommets, faces, teinte, options)
}

// Un rectangle (de x0, y0 à x1, y1), comme liste de coins, pour tronc().
const coins = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

// Un polygone régulier (n coins) de rayon r en cases, autour de (cx, cy).
const polygoneRegulier = (cx, cy, r, n, depart = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(depart + (i / n) * 2 * Math.PI), cy + r * Math.sin(depart + (i / n) * 2 * Math.PI)])

// Un lingot couché (un peu plus étroit en haut qu'en bas), de lx cases sur ly, haut de h pixels.
function lingot3d(t, x, y, lx, ly, z, h, teinte) {
  const e = 0.05
  tronc(t, coins(x, y, x + lx, y + ly), z, coins(x + e, y + e, x + lx - e, y + ly - e), z + h, teinte, { trait: TRAIT_FIN })
}

// Une étincelle qui brille (une étoile à quatre branches, blanche ou dorée), en points du dessin.
function brillant(x, y, r, couleur = C.blanc) {
  const k = 0.28
  return `<path d="M${r1(x)} ${r1(y - r)} L${r1(x + r * k)} ${r1(y - r * k)} L${r1(x + r)} ${r1(y)} L${r1(x + r * k)} ${r1(y + r * k)} L${r1(x)} ${r1(y + r)} L${r1(x - r * k)} ${r1(y + r * k)} L${r1(x - r)} ${r1(y)} L${r1(x - r * k)} ${r1(y - r * k)} Z" fill="${couleur}" stroke="${C.encre}" stroke-width="2.5"/>`
}

// ---------------------------------------------------------------------------
// (26/10) La fonderie : elle fond le fer et l'or bruts en lingots. Un gros haut-fourneau en briques
// rouges (bien plus grand et plus chaud que le four du forgeron, qui est en pierre grise) : sa
// bouche crache un feu orange, son haut se resserre en une grosse cheminée qui fume. Devant, un
// creuset sur son support verse le métal fondu dans un moule à lingots (une plaque de fonte à trois
// creux). À droite, contre le four, une pile de lingots de fer (gris) et d'or ; au fond, le tas
// de charbon ; devant à droite, une caisse de minerai brut.
// « enMarche » : le dessin fonderie-active.svg (le feu danse, le creuset verse, la fumée monte).
// ---------------------------------------------------------------------------

const BRIQUE_FONDERIE = '#d0603f'
const FONTE = '#4a4658' // la fonte (le fer noir des moules, du creuset, des cerclages)
const FONDU = '#ff8a1f' // le métal fondu
const FONDU_CLAIR = '#ffd84a'

// Quelques briques dessinées sur une façade (pas toutes : le style reste simple). « liste » :
// [u, v, largeur] en pixels de la façade (v vers le haut).
function briquesSurFace(t, cote, x, y, z, liste, couleur) {
  t.surFace(cote, x, y, z, liste.map(([u, v, l]) => `<rect x="${u}" y="${-v}" width="${l}" height="10" rx="3" fill="none" stroke="${couleur}" stroke-width="3"/>`).join(''))
}

// Les flammes dans la bouche du four (sur la façade), au milieu en m : une image de l'animation.
function flammesFonderie(m, i) {
  const h = [
    [-44, -58, -40],
    [-50, -46, -52],
    [-38, -62, -46],
  ][i % 3]
  return (
    `<path d="M${r1(m - 24)} -6 Q${r1(m - 28)} -24 ${r1(m - 14)} ${h[0]} Q${r1(m - 12)} -28 ${r1(m - 4)} -32 Q${r1(m - 2)} ${h[1] + 8} ${r1(m + 4)} ${h[1]} Q${r1(m + 10)} -36 ${r1(m + 14)} ${h[2]} Q${r1(m + 28)} -24 ${r1(m + 24)} -6 Z" fill="${FEU}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
    `<path d="M${r1(m - 14)} -6 Q${r1(m - 16)} -20 ${r1(m - 6)} ${r1(h[0] * 0.6)} Q${r1(m)} -18 ${r1(m + 4)} ${r1(h[1] * 0.68)} Q${r1(m + 16)} -20 ${r1(m + 14)} -6 Z" fill="${FEU_CLAIR}"/>`
  )
}

// La fumée qui sort de la cheminée, autour de (fx, fy) : une image de l'animation (« decalage »,
// de 0 à 1 : de combien les bouffées sont montées).
function fumeeFonderie(fx, fy, decalage) {
  let svg = ''
  for (let i = 2; i >= 0; i--) {
    const s = (i + decalage) / 3 // 0 : au ras de la cheminée, 1 : tout en haut
    const x = fx - 14 * Math.sin(s * Math.PI) + 4 * s
    const y = fy - 54 * s
    svg += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(10 + 8 * s)}" fill="#e6e1d8" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`
  }
  return svg
}

export function fonderie({ enMarche = false } = {}) {
  const t = new Toile({ taille: 5, haut: 240 })
  dalle(t, 5)
  const z = DALLE
  const briques = teintes(BRIQUE_FONDERIE, fonce(BRIQUE_FONDERIE, 0.25), clair(BRIQUE_FONDERIE, 0.25))
  const joint = fonce(BRIQUE_FONDERIE, 0.3)
  const fonte = teintes(FONTE, '#2f2c3a', '#8a869c')
  const pierre = teintes(C.pierre, C.pierreFoncee, clair(C.pierre, 0.3))

  // Au fond à droite, le tas de charbon (le four en brûle beaucoup).
  tasDeCharbon(t, 4.05, 0.95, z, 1.15)

  // La lueur du feu, à plat sur les pavés devant la bouche du four.
  const [lx, ly] = t.pt(1.75, 3.25, z)
  t.ajouter(`<ellipse cx="${r1(lx)}" cy="${r1(ly)}" rx="80" ry="36" fill="${FEU}" opacity="0.32"/>`)

  // Le haut-fourneau : un socle de pierre, le corps en briques, un cerclage de fonte.
  const [x0, y0, x1, y1] = [0.5, 0.4, 2.9, 2.6]
  const zSocle = z + 12
  const zCorps = 92
  t.boite(x0 - 0.08, y0 - 0.08, x1 + 0.08, y1 + 0.08, z, zSocle, pierre)
  t.boite(x0, y0, x1, y1, zSocle, zCorps, briques)
  const faceGauche = (x1 - x0) * 38.15
  const faceDroite = (y1 - y0) * 38.15
  briquesSurFace(t, 'gauche', x0, y1, zSocle, [[6, 22, 16], [4, 50, 18], [10, 66, 14], [72, 64, 16], [70, 34, 16]], joint)
  briquesSurFace(t, 'droite', x1, y1, zSocle, [[8, 18, 16], [6, 60, 18], [62, 66, 14], [64, 14, 16]], fonce(BRIQUE_FONDERIE, 0.45))

  // La bouche du four, sur la façade de gauche : une arche de pierres claires, le noir du four, le
  // métal fondu qui rougeoie au fond, les flammes (elles dansent quand la fonderie marche).
  const m = faceGauche / 2
  const flammes = Array.from({ length: enMarche ? 3 : 1 }, (_, i) => flammesFonderie(m, i))
  t.surFace(
    'gauche',
    x0,
    y1,
    zSocle,
    `<path d="M${r1(m - 34)} 0 V-30 A34 34 0 0 1 ${r1(m + 34)} -30 V0 Z" fill="${clair(C.pierre, 0.2)}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(m - 34)} -30 A34 34 0 0 1 ${r1(m + 34)} -30" fill="none" stroke="${C.encre}" stroke-width="3" stroke-dasharray="3 13"/>` +
      `<path d="M${r1(m - 25)} 0 V-30 A25 25 0 0 1 ${r1(m + 25)} -30 V0 Z" fill="${C.encre}"/>` +
      enBoucle(flammes, 0.36) +
      `<rect x="${r1(m - 25)}" y="-7" width="50" height="7" fill="${FONDU}"/>` +
      `<rect x="${r1(m - 38)}" y="-5" width="76" height="8" rx="3" fill="${clair(C.pierre, 0.1)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
  )
  // Sur la façade de droite : une petite trappe ronde en fonte, avec son judas qui rougeoie.
  const judas = (couleur) => `<circle cx="${r1(faceDroite / 2)}" cy="-42" r="6" fill="${couleur}" stroke="${C.encre}" stroke-width="3"/>`
  t.surFace(
    'droite',
    x1,
    y1,
    zSocle,
    `<circle cx="${r1(faceDroite / 2)}" cy="-42" r="16" fill="${FONTE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      [0, 1, 2, 3].map((i) => `<circle cx="${r1(faceDroite / 2 + 11 * Math.cos(i * 1.571 + 0.785))}" cy="${r1(-42 + 11 * Math.sin(i * 1.571 + 0.785))}" r="2.2" fill="#8a869c"/>`).join('') +
      enBoucle(enMarche ? [judas(FEU_CLAIR), judas(FEU)] : [judas(FEU)], 0.5),
  )
  // Le cerclage de fonte, puis le haut du four qui se resserre, un autre cerclage, et la cheminée.
  t.boite(x0 - 0.05, y0 - 0.05, x1 + 0.05, y1 + 0.05, zCorps, zCorps + 10, fonte)
  const zHaut = 136
  tronc(t, coins(x0, y0, x1, y1), zCorps + 10, coins(x0 + 0.45, y0 + 0.45, x1 - 0.45, y1 - 0.45), zHaut, briques)
  t.boite(x0 + 0.4, y0 + 0.4, x1 - 0.4, y1 - 0.4, zHaut, zHaut + 8, fonte)
  const [c0, c1, d0, d1] = [1.32, 2.08, 1.12, 1.88]
  const zCheminee = 200
  t.boite(c0, d0, c1, d1, zHaut + 8, zCheminee, briques)
  for (let zz = zHaut + 22; zz < zCheminee - 6; zz += 16) {
    t.ligne([c0 + 0.08, d1, zz], [c1 - 0.08, d1, zz], joint, 3)
    t.ligne([c1, d1 - 0.08, zz], [c1, d0 + 0.08, zz], fonce(BRIQUE_FONDERIE, 0.45), 3)
  }
  t.boite(c0 - 0.08, d0 - 0.08, c1 + 0.08, d1 + 0.08, zCheminee, zCheminee + 10, fonte)
  const [fx, fy] = t.pt((c0 + c1) / 2, (d0 + d1) / 2, zCheminee + 26)
  t.ajouter(enBoucle(enMarche ? [0, 0.25, 0.5, 0.75].map((d) => fumeeFonderie(fx, fy, d)) : [fumeeFonderie(fx, fy, 0.35)], 1.2))

  // La pile de lingots, à droite contre le four : quatre lingots de fer en bas, puis l'or (trois,
  // deux, un).
  const fer = teintes('#c3ccd6', '#8e9aa6', '#e9eef3')
  const or = teintes(C.or, fonce(C.or, 0.22), '#ffe68a')
  const [px, lxL, lyL, hL] = [3.2, 0.62, 0.26, 9]
  const rangees = [
    [fer, [1.62, 1.92, 2.22, 2.52]],
    [or, [1.77, 2.07, 2.37]],
    [or, [1.92, 2.22]],
    [or, [2.07]],
  ]
  rangees.forEach(([teinte, ys], n) => ys.forEach((y) => lingot3d(t, px + n * 0.02, y, lxL - n * 0.04, lyL, z + n * hL, hL, teinte)))
  const [bx, by] = t.pt(px + 0.3, 2.2, z + 4 * hL + 12)
  t.ajouter(brillant(bx + 6, by - 4, 9) + brillant(bx - 22, by + 16, 6))

  // Le moule à lingots, devant à gauche : une plaque de fonte à trois creux. Dans les deux premiers,
  // un lingot de fer et un lingot d'or déjà durcis ; le troisième reçoit le métal fondu du creuset.
  const [m0, m1, n0, n1, zm] = [0.55, 2.5, 3.6, 4.3, z + 14]
  t.boite(m0, n0, m1, n1, z, zm, fonte)
  const creux = [
    [0.7, 1.25],
    [1.35, 1.9],
    [2.0, 2.4],
  ]
  creux.forEach(([a, b], i) => {
    const creu = [
      [a, n0 + 0.14, zm],
      [b, n0 + 0.14, zm],
      [b, n1 - 0.14, zm],
      [a, n1 - 0.14, zm],
    ]
    t.poly(creu, '#2f2c3a', { trait: 3 })
    const dedans = creu.map(([x, y]) => [x + (x === a ? 0.05 : -0.05), y + (y < (n0 + n1) / 2 ? 0.05 : -0.05), zm])
    if (i === 0) t.poly(dedans, '#d6dee6', { trait: 0 })
    if (i === 1) t.poly(dedans, '#ffe68a', { trait: 0 })
    if (i === 2 && enMarche) {
      // Le métal fondu qui remplit le creux, et ses reflets qui bougent.
      t.poly(dedans, FONDU, { trait: 0 })
      const [cx, cy] = t.pt((a + b) / 2, (n0 + n1) / 2, zm)
      t.ajouter(
        enBoucle(
          [
            `<ellipse cx="${r1(cx - 4)}" cy="${r1(cy - 2)}" rx="7" ry="3" fill="${FONDU_CLAIR}"/>`,
            `<ellipse cx="${r1(cx + 4)}" cy="${r1(cy + 1)}" rx="8" ry="3.5" fill="${FONDU_CLAIR}"/>`,
            `<ellipse cx="${r1(cx)}" cy="${r1(cy - 1)}" rx="6" ry="2.5" fill="${FONDU_CLAIR}"/>`,
          ],
          0.3,
        ),
      )
    }
  })

  // Le creuset, sur son support de fonte (deux poteaux et un axe) : penché pour verser quand la
  // fonderie marche, presque droit sinon.
  const [kx, ky0, ky1, zk] = [3.5, 3.55, 4.25, z + 74]
  t.boite(kx - 0.07, ky0 - 0.07, kx + 0.07, ky0 + 0.07, z, zk, fonte, { trait: TRAIT_FIN })
  t.poutre([kx, ky0, zk], [kx, ky1, zk], '#6d7290', 4)
  const [cx, cy] = t.pt(kx, (ky0 + ky1) / 2, zk)
  const angle = enMarche ? -58 : -12
  const a = (angle * Math.PI) / 180
  const tourne = ([u, v]) => [cx + 1.25 * (u * Math.cos(a) - v * Math.sin(a)), cy + 1.25 * (u * Math.sin(a) + v * Math.cos(a))]
  if (enMarche) {
    // Le filet de métal fondu, du bec du creuset au troisième creux du moule.
    const [bxx, byy] = tourne([-24, -17])
    const [ex, ey] = t.pt(2.2, (n0 + n1) / 2, zm)
    const filet = `M${r1(bxx)} ${r1(byy)} Q${r1(ex + 2)} ${r1(byy - 8)} ${r1(ex + 2)} ${r1(ey - 2)}`
    t.ajouter(`<path d="${filet}" stroke="${C.encre}" stroke-width="18" fill="none"/><path d="${filet}" stroke="${FONDU}" stroke-width="10" fill="none"/>`)
    t.ajouter(enBoucle([0, 6, 12].map((d) => `<path d="${filet}" stroke="${FONDU_CLAIR}" stroke-width="3.5" fill="none" stroke-dasharray="6 12" stroke-dashoffset="${-d}"/>`), 0.24))
    t.ajouter(`<ellipse cx="${r1(ex + 2)}" cy="${r1(ey)}" rx="12" ry="5" fill="${FONDU_CLAIR}" stroke="${C.encre}" stroke-width="3"/>`)
  }
  t.ajouter(
    `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${angle}) scale(1.25)">` +
      `<path d="M-18 -15 L-26 -19 L-17 -10 Z" fill="${FONTE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M-18 -15 L18 -15 L14 12 Q0 19 -14 12 Z" fill="${FONTE}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M6 -12 L4 10" stroke="#2f2c3a" stroke-width="6"/>` +
      `<ellipse cx="0" cy="-15" rx="18" ry="5.5" fill="#2f2c3a" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<ellipse cx="0" cy="-15" rx="13" ry="3.5" fill="${FONDU}"/><ellipse cx="-4" cy="-16" rx="5" ry="1.6" fill="${FONDU_CLAIR}"/>` +
      `<circle cx="0" cy="-2" r="5" fill="#6d7290" stroke="${C.encre}" stroke-width="3"/>` +
      `</g>`,
  )
  t.boite(kx - 0.07, ky1 - 0.07, kx + 0.07, ky1 + 0.07, z, zk, fonte, { trait: TRAIT_FIN })

  // Devant à droite, une caisse de minerai brut (du fer et de l'or) à fondre.
  caisse(t, 4.2, 3.95, 0.6, z, 22, [C.fer, C.or, fonce(C.fer, 0.12)])
  return t
}

// ---------------------------------------------------------------------------
// (26/10) La joaillerie : elle taille les gemmes en bijoux. Une jolie boutique aux murs de pierre
// claire, au toit violet (un toit « à la Mansart », bordé d'or) ; sur le toit, une grosse gemme
// taillée sert d'enseigne. Sur la façade de gauche, la vitrine où brillent les bijoux, sous un auvent
// violet et lilas ; sur celle de droite, la porte (côté « droite » dans donnees.ts) et deux petits
// buis en pot. Devant, l'établi du joaillier avec sa loupe, et un petit coffre ouvert plein de gemmes.
// ---------------------------------------------------------------------------

const VIOLET_JOAILLERIE = '#9a6ae0'
const LILAS = '#d9c6fb'

// La grosse gemme de l'enseigne, posée sur sa pointe : le dessous (la culasse, une pyramide à
// l'envers), puis le dessus (la couronne, un tronc de pyramide). Au milieu en (cx, cy).
function grosseGemme(t, cx, cy, zPointe, r, couleur) {
  const teinte = teintes(couleur, fonce(couleur, 0.3), clair(couleur, 0.45))
  const zFiletage = zPointe + r * 44
  const octogone = (rr) => polygoneRegulier(cx, cy, rr, 8, Math.PI / 8)
  t.pyramide(octogone(r), zFiletage, [cx, cy, zPointe], teinte)
  tronc(t, octogone(r), zFiletage, octogone(r * 0.58), zFiletage + r * 22, teinte)
  return zFiletage + r * 22
}

// Le coffre ouvert plein de gemmes (comme celui de la foreuse, mais cerclé d'or).
function coffreGemmes(t, x0, y0, lx, ly, z) {
  const [x1, y1, z1] = [x0 + lx, y0 + ly, z + 24]
  t.poly(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y0 - 0.28, z1 + 26],
      [x0, y0 - 0.28, z1 + 26],
    ],
    fonce(VIOLET_JOAILLERIE, 0.35),
  )
  t.boite(x0, y0, x1, y1, z, z1, teintes(C.bois, C.boisFonce))
  t.poly(
    [
      [x0 + 0.07, y0 + 0.07, z1],
      [x1 - 0.07, y0 + 0.07, z1],
      [x1 - 0.07, y1 - 0.07, z1],
      [x0 + 0.07, y1 - 0.07, z1],
    ],
    fonce(VIOLET_JOAILLERIE, 0.45),
    { trait: TRAIT_FIN },
  )
  for (const x of [x0 + 0.12, x1 - 0.12]) t.ligne([x, y1, z + 3], [x, y1, z1 - 2], fonce(C.or, 0.15), 4)
  for (const y of [y0 + 0.1, y1 - 0.1]) t.ligne([x1, y, z + 3], [x1, y, z1 - 2], fonce(C.or, 0.3), 4)
  const [sx, sy] = t.pt((x0 + x1) / 2, y1, z1 - 8)
  t.ajouter(`<rect x="${r1(sx - 5)}" y="${r1(sy - 4)}" width="10" height="12" rx="2" fill="${C.or}" stroke="${C.encre}" stroke-width="3"/>`)
  const [gx, gy] = t.pt((x0 + x1) / 2, (y0 + y1) / 2, z1 + 2)
  for (const [sorte, dx, dy, taille, angle] of [
    ['emeraude', -13, -4, 17, -12],
    ['rubis', 11, -6, 17, 10],
    ['saphir', -1, -12, 18, 0],
    ['diamant', 1, 2, 18, -8],
  ]) {
    t.ajouter(minerai(sorte, gx + dx, gy + dy, taille, angle))
  }
  t.ajouter(brillant(gx + 18, gy - 22, 6))
}

export function joaillerie() {
  const t = new Toile({ taille: 5, haut: 206 })
  dalle(t, 5)
  const z = DALLE
  const murs = teintes('#f1e7d8', '#dccbb2', '#f1e7d8')
  const blanc = teintes('#fffaf0', '#e8dcc4', '#ffffff')
  const violet = teintes(VIOLET_JOAILLERIE, fonce(VIOLET_JOAILLERIE, 0.25), clair(VIOLET_JOAILLERIE, 0.25))
  const or = teintes(C.or, fonce(C.or, 0.22), '#ffe68a')
  const bois = teintes(C.bois, C.boisFonce)

  // La boutique : un socle de pierre, les murs, des pilastres blancs aux coins, une corniche.
  const [x0, y0, x1, y1, zMur] = [0.6, 0.7, 3.9, 3.7, 104]
  const zSocle = z + 12
  t.boite(x0 - 0.06, y0 - 0.06, x1 + 0.06, y1 + 0.06, z, zSocle, teintes(C.pierre, C.pierreFoncee, clair(C.pierre, 0.3)))
  t.boite(x0, y0, x1, y1, zSocle, zMur, murs)
  t.boite(x0 - 0.04, y1 - 0.2, x0 + 0.16, y1 + 0.04, zSocle, zMur, blanc)
  t.boite(x1 - 0.2, y1 - 0.2, x1 + 0.04, y1 + 0.04, zSocle, zMur, blanc)
  t.boite(x1 - 0.2, y0 - 0.04, x1 + 0.04, y0 + 0.16, zSocle, zMur, blanc)
  t.boite(x0 - 0.1, y0 - 0.1, x1 + 0.1, y1 + 0.1, zMur, zMur + 8, blanc)
  t.ligne([x0 - 0.1, y1 + 0.1, zMur + 3], [x1 + 0.1, y1 + 0.1, zMur + 3], C.or, 3)
  t.ligne([x1 + 0.1, y1 + 0.1, zMur + 3], [x1 + 0.1, y0 - 0.1, zMur + 3], fonce(C.or, 0.2), 3)

  // Le toit violet, bordé d'or, et ses rangées d'ardoises.
  const zToit = zMur + 8
  const zHautToit = zToit + 30
  const retrait = 0.55
  tronc(t, coins(x0 - 0.12, y0 - 0.12, x1 + 0.12, y1 + 0.12), zToit, coins(x0 + retrait, y0 + retrait, x1 - retrait, y1 - retrait), zHautToit, violet)
  for (const k of [0.33, 0.66]) {
    const zz = zToit + (zHautToit - zToit) * k
    const e = -0.12 + (retrait + 0.12) * k
    t.ligne([x0 + e + 0.04, y1 - e, zz], [x1 - e, y1 - e, zz], fonce(VIOLET_JOAILLERIE, 0.12), 3)
    t.ligne([x1 - e, y1 - e, zz], [x1 - e, y0 + e + 0.04, zz], fonce(VIOLET_JOAILLERIE, 0.38), 3)
  }
  t.poly(
    [
      [x0 + retrait, y0 + retrait, zHautToit],
      [x1 - retrait, y0 + retrait, zHautToit],
      [x1 - retrait, y1 - retrait, zHautToit],
      [x0 + retrait, y1 - retrait, zHautToit],
    ],
    'none',
    { trait: TRAIT_FIN, contour: C.or },
  )

  // L'enseigne : une grosse gemme bleu ciel sur un socle doré, qui brille.
  const [gx, gy] = [(x0 + x1) / 2, (y0 + y1) / 2]
  t.cylindre(gx, gy, 0.3, zHautToit, zHautToit + 8, or)
  t.cylindre(gx, gy, 0.1, zHautToit + 8, zHautToit + 20, or, { trait: TRAIT_FIN })
  const zHautGemme = grosseGemme(t, gx, gy, zHautToit + 16, 0.95, C.diamant)
  const [rx, ry] = t.pt(gx - 0.35, gy + 0.35, zHautGemme - 6)
  t.ajouter(`<path d="M${r1(rx)} ${r1(ry)} L${r1(rx + 14)} ${r1(ry - 6)}" stroke="${C.blanc}" stroke-width="5"/>`)
  const [ex, ey] = t.pt(gx, gy, zHautGemme)
  t.ajouter(brillant(ex - 44, ey - 2, 10) + brillant(ex + 40, ey - 16, 8) + brillant(ex + 30, ey + 40, 6))

  // La vitrine, sur la façade de gauche : un cadre doré, la vitre bleu pâle, et derrière, sur des
  // coussins violets, une bague, un collier et une couronne qui brillent.
  const faceGauche = (x1 - x0) * 38.15
  const [vu0, vu1] = [16, faceGauche - 16]
  const coussin = (u) => `<ellipse cx="${u}" cy="-16" rx="13" ry="5" fill="${VIOLET_JOAILLERIE}" stroke="${C.encre}" stroke-width="3"/>`
  const bijoux =
    // la bague : un anneau d'or et un diamant
    `<ellipse cx="34" cy="-25" rx="7" ry="6" fill="none" stroke="${C.encre}" stroke-width="7"/><ellipse cx="34" cy="-25" rx="7" ry="6" fill="none" stroke="${C.or}" stroke-width="3"/>` +
    `<path d="M29 -34 L39 -34 L34 -27 Z" fill="${C.diamant}" stroke="${C.encre}" stroke-width="2.5"/>` +
    // le collier : une chaîne d'or et une émeraude
    `<path d="M${r1(faceGauche / 2 - 11)} -44 Q${r1(faceGauche / 2)} -22 ${r1(faceGauche / 2 + 11)} -44" fill="none" stroke="${C.encre}" stroke-width="6"/><path d="M${r1(faceGauche / 2 - 11)} -44 Q${r1(faceGauche / 2)} -22 ${r1(faceGauche / 2 + 11)} -44" fill="none" stroke="${C.or}" stroke-width="2.5"/>` +
    `<rect x="${r1(faceGauche / 2 - 4)}" y="-31" width="8" height="10" rx="2" fill="${C.emeraude}" stroke="${C.encre}" stroke-width="2.5"/>` +
    // la couronne : de l'or et des rubis
    `<path d="M${r1(faceGauche - 44)} -20 L${r1(faceGauche - 45)} -34 L${r1(faceGauche - 39)} -28 L${r1(faceGauche - 34)} -37 L${r1(faceGauche - 29)} -28 L${r1(faceGauche - 23)} -34 L${r1(faceGauche - 24)} -20 Z" fill="${C.or}" stroke="${C.encre}" stroke-width="2.5"/>` +
    `<circle cx="${r1(faceGauche - 34)}" cy="-24" r="2.6" fill="${C.rubis}"/>`
  t.surFace(
    'gauche',
    x0,
    y1,
    zSocle,
    `<rect x="${vu0}" y="-54" width="${r1(vu1 - vu0)}" height="46" rx="4" fill="#d6eefc" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<rect x="${vu0 + 4}" y="-14" width="${r1(vu1 - vu0 - 8)}" height="5" fill="${LILAS}"/>` +
      coussin(34) +
      coussin(r1(faceGauche / 2)) +
      coussin(r1(faceGauche - 34)) +
      bijoux +
      `<path d="M${vu0 + 6} -36 L${vu0 + 18} -50 M${vu0 + 12} -30 L${vu0 + 28} -50" stroke="${C.blanc}" stroke-width="4"/>` +
      `<rect x="${vu0}" y="-54" width="${r1(vu1 - vu0)}" height="46" rx="4" fill="none" stroke="${C.or}" stroke-width="3"/>` +
      `<rect x="${vu0 - 6}" y="-9" width="${r1(vu1 - vu0 + 12)}" height="8" rx="3" fill="${blanc.haut}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      brillant(46, -40, 6) +
      brillant(faceGauche - 50, -44, 5),
  )

  // L'auvent violet et lilas, au-dessus de la vitrine, avec sa frange festonnée.
  const [ax0, ax1, ay0, ay1, zFond, zAvant] = [x0 + 0.25, x1 - 0.3, y1, y1 + 0.36, zMur - 4, zMur - 14]
  const bandes = 6
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
      i % 2 ? LILAS : VIOLET_JOAILLERIE,
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
  for (let i = 0; i < bandes; i++) {
    const xa = ax0 + ((ax1 - ax0) * i) / bandes
    const xb = ax0 + ((ax1 - ax0) * (i + 1)) / bandes
    const [a, b, c, d] = [
      [xa, ay1, zAvant],
      [xb, ay1, zAvant],
      [xb, ay1, zAvant - 10],
      [xa, ay1, zAvant - 10],
    ].map(([x, y, zz]) => t.pt(x, y, zz))
    const creux = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2 + 9]
    t.ajouter(`<path d="M${r1(a[0])} ${r1(a[1])} L${r1(b[0])} ${r1(b[1])} L${r1(c[0])} ${r1(c[1])} Q${r1(creux[0])} ${r1(creux[1])} ${r1(d[0])} ${r1(d[1])} Z" fill="${i % 2 ? LILAS : VIOLET_JOAILLERIE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  // Les côtés de l'auvent (des triangles, à l'ombre).
  for (const x of [ax1]) {
    t.poly(
      [
        [x, ay0, zFond],
        [x, ay1, zAvant],
        [x, ay1, zAvant - 10],
        [x, ay0, zFond - 4],
      ],
      fonce(VIOLET_JOAILLERIE, 0.3),
      { trait: TRAIT_FIN },
    )
  }

  // La porte, au milieu de la façade de droite : violette, en arc, avec sa petite vitre ronde et
  // sa poignée dorée ; au-dessus, une petite enseigne ronde à la bague.
  const faceDroite = (y1 - y0) * 38.15
  const mp = faceDroite / 2
  t.surFace(
    'droite',
    x1,
    y1,
    zSocle,
    `<path d="M${r1(mp - 17)} 0 V-40 A17 17 0 0 1 ${r1(mp + 17)} -40 V0 Z" fill="${VIOLET_JOAILLERIE}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(mp - 17)} -40 A17 17 0 0 1 ${r1(mp + 17)} -40" fill="none" stroke="${C.or}" stroke-width="3"/>` +
      `<circle cx="${r1(mp)}" cy="-40" r="7" fill="#d6eefc" stroke="${C.encre}" stroke-width="3"/>` +
      `<circle cx="${r1(mp + 9)}" cy="-20" r="3" fill="${C.or}" stroke="${C.encre}" stroke-width="2"/>` +
      `<circle cx="${r1(mp)}" cy="-68" r="11" fill="${C.creme}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<circle cx="${r1(mp)}" cy="-65" r="5" fill="none" stroke="${C.encre}" stroke-width="5"/><circle cx="${r1(mp)}" cy="-65" r="5" fill="none" stroke="${C.or}" stroke-width="2"/>` +
      `<path d="M${r1(mp - 4)} -74 L${r1(mp + 4)} -74 L${r1(mp)} -69 Z" fill="${C.diamant}" stroke="${C.encre}" stroke-width="2"/>`,
  )
  // La marche devant la porte, et un buis taillé en boule dans un pot de chaque côté.
  const [ym0, ym1] = [y1 - (mp + 22) / 38.15, y1 - (mp - 22) / 38.15]
  t.boite(x1, ym0, x1 + 0.3, ym1, z, z + 5, teintes(C.pierre, C.pierreFoncee))
  for (const y of [ym0 - 0.35, ym1 + 0.35]) {
    t.cylindre(x1 + 0.32, y, 0.17, z, z + 14, teintes(VIOLET_JOAILLERIE, fonce(VIOLET_JOAILLERIE, 0.25), clair(VIOLET_JOAILLERIE, 0.3)), { trait: TRAIT_FIN })
    const [bx, by] = t.pt(x1 + 0.32, y, z + 26)
    t.ajouter(`<circle cx="${r1(bx)}" cy="${r1(by)}" r="13" fill="${C.feuillage}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/><circle cx="${r1(bx - 4)}" cy="${r1(by - 4)}" r="6" fill="${clair(C.feuillage, 0.3)}"/>`)
  }

  // L'établi du joaillier, devant à gauche : un meuble en bois à tiroir, des gemmes à tailler, et la loupe
  // sur son bras doré.
  const [tx0, tx1, ty0, ty1, zt] = [0.35, 1.55, 4.15, 4.65, z + 28]
  t.boite(tx0 + 0.06, ty0 + 0.06, tx1 - 0.06, ty1 - 0.06, z, zt, bois)
  t.surFace('gauche', tx0 + 0.06, ty1 - 0.06, z, `<rect x="10" y="-22" width="${r1((tx1 - tx0 - 0.12) * 38.15 - 20)}" height="12" rx="3" fill="${clair(C.bois, 0.15)}" stroke="${C.encre}" stroke-width="3"/><circle cx="${r1(((tx1 - tx0 - 0.12) * 38.15) / 2)}" cy="-16" r="2.5" fill="${C.or}" stroke="${C.encre}" stroke-width="2"/>`)
  t.boite(tx0, ty0, tx1, ty1, zt, zt + 6, teintes(clair(C.bois, 0.1), C.boisFonce), { trait: TRAIT_FIN })
  const [ox, oy] = t.pt(0.75, 4.4, zt + 6)
  t.ajouter(minerai('saphir', ox, oy - 6, 16, -10) + minerai('rubis', ox + 20, oy + 4, 15, 8))
  // La loupe : un pied, un bras coudé, et le verre rond qui brille.
  const [lpx, lpy] = t.pt(1.3, 4.35, zt + 6)
  const bras = `M${r1(lpx)} ${r1(lpy)} L${r1(lpx)} ${r1(lpy - 30)} L${r1(lpx - 18)} ${r1(lpy - 40)}`
  t.ajouter(`<ellipse cx="${r1(lpx)}" cy="${r1(lpy)}" rx="9" ry="4" fill="${C.or}" stroke="${C.encre}" stroke-width="3"/>`)
  t.ajouter(`<path d="${bras}" stroke="${C.encre}" stroke-width="10" fill="none"/><path d="${bras}" stroke="${C.or}" stroke-width="4" fill="none"/>`)
  t.ajouter(
    `<circle cx="${r1(lpx - 26)}" cy="${r1(lpy - 44)}" r="13" fill="#d6eefc" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<circle cx="${r1(lpx - 26)}" cy="${r1(lpy - 44)}" r="10" fill="none" stroke="${C.or}" stroke-width="3"/>` +
      `<path d="M${r1(lpx - 32)} ${r1(lpy - 46)} Q${r1(lpx - 30)} ${r1(lpy - 52)} ${r1(lpx - 24)} ${r1(lpy - 52)}" stroke="${C.blanc}" stroke-width="3" fill="none"/>`,
  )

  // Devant à droite, le petit coffre ouvert plein de gemmes.
  coffreGemmes(t, 3.75, 4.05, 0.75, 0.5, z)
  return t
}

// ---------------------------------------------------------------------------
// L'icône des rails (pour les menus) : un petit bout de voie sur sa case de terre
// ---------------------------------------------------------------------------

export function iconeRails() {
  // (25/10) Plus clair : à 56 px dans le menu Bâtiments, les gros contours (6) et le bois foncé
  // faisaient une icône presque noire, « à l'ombre ». Contours fins, sol d'herbe, bois et acier clairs.
  const t = new Toile({ taille: 2, haut: 20, marge: 6, bas: 6 })
  const fin = { trait: 3 }
  t.boite(0, 0, 2, 2, 0, 5, teintes('#9fdc7c', '#7cc35f', '#9fdc7c'), fin)
  const z = 5
  for (const y of [0.3, 0.8, 1.3, 1.8]) t.boite(0.3, y - 0.12, 1.7, y + 0.12, z, z + 5, teintes(clair(C.bois, 0.25), C.bois), fin)
  for (const x of [0.6, 1.4]) t.boite(x - 0.07, 0.05, x + 0.07, 1.95, z + 5, z + 11, teintes(clair(C.metal, 0.35), C.metal, clair(C.metal, 0.55)), fin)
  return t
}

