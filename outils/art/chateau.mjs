// Le château de la quête finale (27/10, demandé par le propriétaire) : au fond de la carte, entre
// les deux chaînes de montagnes, sur une colline au bout d'un chemin qui part du coin du haut de la
// clairière. Au début de la partie, c'est une ruine ; quand le joueur paie sa restauration
// (20 millions), il devient un château flambant neuf.
//
// Deux dessins de la même taille, calés pareil (on passe de l'un à l'autre sans que rien ne
// bouge) : chateau-ruine.svg et chateau-neuf.svg. Les deux ont la même colline : un plateau
// d'herbe aux flancs de roche, avec une rampe de terre qui descend vers le chemin (vers le bas à
// gauche de l'écran).
//
// La toile fait 16 × 16 cases ; le château est au milieu (de 3 à 13), la rampe sort du plateau
// jusqu'à la case (8, 18,6) : c'est là que le chemin du jeu arrive (PIED_RAMPE).

import { C, DX, DY, TRAIT, TRAIT_FIN, Toile, clair, fonce, hasardAvecGraine, r1, rocher, teintes } from './formes.mjs'

const TAILLE = 16
const CENTRE = 8 // le milieu du plateau et du château
const RAYON_PLATEAU = 7.2
const HAUTEUR_PLATEAU = 100 // le dessus de la colline (en pixels du dessin)
const [A, B] = [3, 13] // le château, de la case A à la case B
const MUR = 0.7 // l'épaisseur des murs
// Le pied de la rampe, sur la toile (en cases) : le jeu y fait arriver son chemin.
export const PIED_RAMPE = { x: CENTRE, y: 18.6 }

// Les couleurs.
const ROCHE = '#b9b4d6' // la roche des flancs (celle des montagnes)
const ROCHE_OMBRE = '#918ab8'
const HERBE = '#99d775'
const HERBE_OMBRE = '#76bd59'
const TERRE = '#d9b27c'
const TERRE_OMBRE = '#b98f5b'
// Le château neuf : des pierres crème, des toits bleu roi, de l'or.
const PIERRE_NEUVE = teintes('#f3e7cc', '#d8c6a2', '#fbf4e4')
const SOCLE_NEUF = teintes(C.pierre, C.pierreFoncee)
const TOIT = teintes('#5f7fe8', fonce('#5f7fe8', 0.25), clair('#5f7fe8', 0.2))
// La ruine : des pierres grises et lilas, de la mousse.
const PIERRE_RUINE = teintes('#bdb6cf', '#958daf', '#d3cde2')
const MOUSSE = '#7cc35e'

// ---------------------------------------------------------------------------
// La colline (la même pour les deux dessins)
// ---------------------------------------------------------------------------

// Un polygone rond (pour le plateau et les tours) : n points autour de (cx, cy).
function rond(cx, cy, r, n = 20, ecraseY = 1) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle) * ecraseY]
  })
}

function colline(t, neuf) {
  const H = HAUTEUR_PLATEAU
  // Le bas de la colline : une grande butte d'herbe en pente douce, puis le plateau, aux flancs
  // de roche un peu penchés.
  butte(t, RAYON_PLATEAU + 2.8, 0, RAYON_PLATEAU + 0.8, 46, HERBE, HERBE_OMBRE, HERBE, false)
  butte(t, RAYON_PLATEAU + 0.45, 40, RAYON_PLATEAU, H, ROCHE, ROCHE_OMBRE, HERBE, true)
  // Une bordure d'herbe plus foncée tout autour du dessus (l'herbe qui déborde un peu).
  const [cx, cy] = t.pt(CENTRE, CENTRE, H)
  const [rx, ry] = [RAYON_PLATEAU * DX * Math.SQRT2, RAYON_PLATEAU * DY * Math.SQRT2]
  t.ajouter(`<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${HERBE_OMBRE}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<ellipse cx="${r1(cx - 4)}" cy="${r1(cy - 4)}" rx="${r1(rx - 22)}" ry="${r1(ry - 13)}" fill="${HERBE}"/>`)
  // Des langues d'herbe qui coulent sur la roche (devant), et des fissures.
  for (const [angle, longueur] of [
    [0.55, 26],
    [0.95, 38],
    [1.35, 22],
    [1.9, 30],
    [2.4, 18],
  ]) {
    const x = CENTRE + RAYON_PLATEAU * Math.cos(angle)
    const y = CENTRE + RAYON_PLATEAU * Math.sin(angle)
    const [px, py] = t.pt(x, y, H)
    t.ajouter(`<path d="M${r1(px - 16)} ${r1(py - 2)} Q${r1(px - 10)} ${r1(py + longueur)} ${r1(px)} ${r1(py + longueur * 0.8)} Q${r1(px + 10)} ${r1(py + longueur)} ${r1(px + 16)} ${r1(py - 2)} Z" fill="${HERBE_OMBRE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  for (const [angle, z] of [
    [0.75, 30],
    [1.65, 24],
    [2.2, 40],
  ]) {
    const [px, py] = t.pt(CENTRE + RAYON_PLATEAU * Math.cos(angle), CENTRE + RAYON_PLATEAU * Math.sin(angle), z)
    t.ajouter(`<path d="M${r1(px)} ${r1(py)} l8 10 l-6 8 l7 9" fill="none" stroke="${fonce(ROCHE_OMBRE, 0.25)}" stroke-width="${TRAIT_FIN}"/>`)
  }

  // La rampe de terre qui descend du plateau, vers le bas à gauche de l'écran.
  const [x0, x1] = [CENTRE - 0.9, CENTRE + 0.9]
  const yHaut = CENTRE + RAYON_PLATEAU - 0.6
  const yBas = PIED_RAMPE.y
  t.volume(
    [
      [x0, yHaut, H],
      [x1, yHaut, H],
      [x1, yBas, 0],
      [x0, yBas, 0],
      [x0, yHaut, 0],
      [x1, yHaut, 0],
    ],
    [
      [0, 1, 2, 3], // la pente
      [1, 5, 2], // le flanc de droite
    ],
    teintes(TERRE, TERRE_OMBRE, clair(TERRE, 0.15)),
  )
  // Sur la pente : des marches de pierre (neuf) ou des cailloux et de l'herbe (ruine).
  for (let k = 1; k < 8; k++) {
    const f = k / 8
    const y = yHaut + (yBas - yHaut) * f
    const z = H * (1 - f)
    if (neuf) t.ligne([x0 + 0.08, y, z], [x1 - 0.08, y, z], fonce(TERRE, 0.3), TRAIT_FIN)
  }
  if (!neuf) {
    const [a, b] = t.pt(CENTRE - 0.3, yHaut + 2, H * 0.55)
    t.ajouter(rocher(a, b, 26, 18, 41, ROCHE, TRAIT_FIN))
    const [c, d] = t.pt(CENTRE + 0.5, yHaut + 3.4, H * 0.25)
    t.ajouter(rocher(c, d, 20, 14, 42, ROCHE, TRAIT_FIN))
  }
  // Des rochers sur la butte, au pied du plateau.
  for (const [angle, k, graine] of [
    [0.25, 1, 51],
    [2.75, 1.2, 52],
    [1.2, 0.8, 53],
  ]) {
    const [px, py] = t.pt(CENTRE + (RAYON_PLATEAU + 0.7) * Math.cos(angle), CENTRE + (RAYON_PLATEAU + 0.7) * Math.sin(angle), 40)
    t.ajouter(rocher(px, py, 64 * k, 44 * k, graine, ROCHE, TRAIT))
  }
}

// Une butte ronde (un cône coupé, à plat dessus) : large de rBas en bas (à zBas), de rHaut en haut
// (à zHaut). Le flanc a sa couleur, et la part de droite est à l'ombre ; le dessus est à plat. Le
// pied n'a pas de contour : la butte sort du sol (comme les collines des montagnes).
function butte(t, rBas, zBas, rHaut, zHaut, flanc, ombre, dessus, contourPied) {
  const [cx, yBas] = t.pt(CENTRE, CENTRE, zBas)
  const [, yHaut] = t.pt(CENTRE, CENTRE, zHaut)
  const k = Math.SQRT2
  const [rxB, ryB, rxH, ryH] = [rBas * DX * k, rBas * DY * k, rHaut * DX * k, rHaut * DY * k]
  const corps =
    `M${r1(cx - rxH)} ${r1(yHaut)} L${r1(cx - rxB)} ${r1(yBas)} ` +
    `A${r1(rxB)} ${r1(ryB)} 0 0 0 ${r1(cx + rxB)} ${r1(yBas)} L${r1(cx + rxH)} ${r1(yHaut)} ` +
    `A${r1(rxH)} ${r1(ryH)} 0 0 1 ${r1(cx - rxH)} ${r1(yHaut)} Z`
  const id = t.nouvelId('butte')
  t.defs.push(`<clipPath id="${id}"><path d="${corps}"/></clipPath>`)
  t.ajouter(`<path d="${corps}" fill="${flanc}"/>`)
  // L'ombre : la part de droite du flanc (une bande qui suit la pente).
  t.ajouter(
    `<path d="M${r1(cx + rxH * 0.35)} ${r1(yHaut + ryH)} L${r1(cx + rxB * 0.35)} ${r1(yBas + ryB)} L${r1(cx + rxB + 20)} ${r1(yBas + ryB)} L${r1(cx + rxH + 20)} ${r1(yHaut - ryH)} Z" fill="${ombre}" clip-path="url(#${id})"/>`,
  )
  // Le contour : les deux côtés et le devant du pied (si on le veut), puis le dessus.
  const bord = contourPied
    ? `<path d="${corps}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`
    : ''
  t.ajouter(bord)
  t.ajouter(`<ellipse cx="${r1(cx)}" cy="${r1(yHaut)}" rx="${r1(rxH)}" ry="${r1(ryH)}" fill="${dessus}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
}

// Un petit buisson rond (sur le plateau).
function buisson(t, x, y, z, k = 1, couleur = C.feuillage) {
  const [px, py] = t.pt(x, y, z)
  t.ajouter(
    `<path d="M${r1(px - 22 * k)} ${r1(py)} Q${r1(px - 26 * k)} ${r1(py - 22 * k)} ${r1(px - 8 * k)} ${r1(py - 24 * k)} Q${r1(px)} ${r1(py - 38 * k)} ${r1(px + 12 * k)} ${r1(py - 26 * k)} Q${r1(px + 28 * k)} ${r1(py - 22 * k)} ${r1(px + 22 * k)} ${r1(py)} Z" fill="${couleur}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(px - 12 * k)} ${r1(py - 18 * k)} Q${r1(px - 6 * k)} ${r1(py - 26 * k)} ${r1(px + 2 * k)} ${r1(py - 24 * k)}" fill="none" stroke="${clair(couleur, 0.45)}" stroke-width="5"/>`,
  )
}

// ---------------------------------------------------------------------------
// Les morceaux du château
// ---------------------------------------------------------------------------

// Des créneaux sur le dessus d'un mur, de (x0, y0) à (x1, y1) (un mur mince), à la hauteur z.
function creneaux(t, x0, y0, x1, y1, z, pierre, haut = 18) {
  const long = Math.max(x1 - x0, y1 - y0)
  const n = Math.max(2, Math.round(long / 0.7))
  for (let i = 0; i < n; i++) {
    if (i % 2) continue
    const f0 = i / n
    const f1 = (i + 1) / n
    if (x1 - x0 >= y1 - y0) t.boite(x0 + (x1 - x0) * f0, y0, x0 + (x1 - x0) * f1, y1, z, z + haut, pierre)
    else t.boite(x0, y0 + (y1 - y0) * f0, x1, y0 + (y1 - y0) * f1, z, z + haut, pierre)
  }
}

// Un mur droit, neuf (avec ses créneaux) ou en ruine (des morceaux de hauteurs différentes).
function mur(t, x0, y0, x1, y1, z, hauteur, neuf, graine) {
  if (neuf) {
    t.boite(x0, y0, x1, y1, z, z + 16, SOCLE_NEUF)
    t.boite(x0, y0, x1, y1, z + 16, z + hauteur, PIERRE_NEUVE)
    creneaux(t, x0, y0, x1, y1, z + hauteur, PIERRE_NEUVE)
    return
  }
  murEnRuine(t, x0, y0, x1, y1, z, hauteur, graine)
}

// Un mur en ruine (27/10) : un seul bloc au dessus tout déchiqueté (une ligne brisée de hauteurs
// au hasard, avec de grandes brèches), au lieu d'une rangée de piliers.
function murEnRuine(t, x0, y0, x1, y1, z, hauteur, graine) {
  const hasard = hasardAvecGraine(graine)
  const enX = x1 - x0 >= y1 - y0 // le mur va dans le sens des x (sinon des y)
  const long = enX ? x1 - x0 : y1 - y0
  // Le profil du haut : des points (position le long du mur, hauteur).
  const profil = []
  let pos = 0
  while (pos < long) {
    const breche = hasard() < 0.16
    const h = breche ? 18 + hasard() * 10 : hauteur * (0.4 + hasard() * 0.5)
    profil.push([pos, h])
    pos += 0.3 + hasard() * 0.45
  }
  profil.push([long, hauteur * (0.3 + hasard() * 0.4)])
  // Un point du mur : f le long du mur, c = 0 (dos) ou 1 (face qu'on voit), h la hauteur.
  const point = (f, c, h) => (enX ? [x0 + f, c ? y1 : y0, z + h] : [c ? x1 : x0, y0 + f, z + h])
  const t3 = PIERRE_RUINE
  // La grande face qu'on voit (en bas à gauche pour un mur en x, en bas à droite pour un mur en y).
  t.poly([point(0, 1, 0), point(long, 1, 0), ...[...profil].reverse().map(([f, h]) => point(f, 1, h))], enX ? t3.gauche : t3.droite)
  // Le bout du mur (vers nous).
  const [, hFin] = profil[profil.length - 1]
  t.poly([point(long, 0, 0), point(long, 1, 0), point(long, 1, hFin), point(long, 0, hFin)], enX ? t3.droite : t3.gauche)
  // Le dessus, morceau par morceau.
  for (let i = 0; i < profil.length - 1; i++) {
    const [fa, ha] = profil[i]
    const [fb, hb] = profil[i + 1]
    t.poly([point(fa, 0, ha), point(fa, 1, ha), point(fb, 1, hb), point(fb, 0, hb)], t3.haut, { trait: TRAIT_FIN })
  }
  // Quelques pierres qui dépassent (des joints) et une fissure.
  const [fx, fy] = t.pt(...point(long * 0.3, 1, hauteur * 0.15))
  t.ajouter(`<path d="M${r1(fx)} ${r1(fy)} l6 -10 l-5 -8 l7 -10" fill="none" stroke="${fonce(t3.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>`)
}

// Une tour ronde, neuve (un toit pointu bleu et un drapeau doré) ou en ruine (cassée en haut).
function tour(t, cx, cy, r, z, hauteur, neuf, graine) {
  if (neuf) {
    t.cylindre(cx, cy, r, z, z + 22, SOCLE_NEUF)
    t.cylindre(cx, cy, r, z + 22, z + hauteur, PIERRE_NEUVE)
    // Une couronne de créneaux, un peu plus large que la tour.
    t.cylindre(cx, cy, r * 1.12, z + hauteur, z + hauteur + 12, PIERRE_NEUVE)
    // Deux fenêtres en arc, vers nous.
    for (const [dx, dz] of [
      [-0.35, 0.45],
      [0.3, 0.7],
    ]) {
      const [fx, fy] = t.pt(cx + r * 0.62 + dx * r, cy + r * 0.62 - dx * r, z + hauteur * dz)
      t.ajouter(fenetreArc(fx, fy, 1))
    }
    // Le toit pointu (un cône), sa boule d'or et son drapeau.
    const pointe = z + hauteur + 12 + r * 105
    t.pyramide(rond(cx, cy, r * 1.25, 16), z + hauteur + 10, [cx, cy, pointe], TOIT)
    drapeau(t, cx, cy, pointe, graine)
    return
  }
  const hasard = hasardAvecGraine(graine)
  t.cylindre(cx, cy, r, z, z + hauteur, PIERRE_RUINE)
  // Le haut est cassé : quelques blocs de hauteurs différentes sur le bord, côté fond.
  for (let i = 0; i < 5; i++) {
    const angle = Math.PI * (0.85 + i * 0.32)
    const bx = cx + r * 0.72 * Math.cos(angle)
    const by = cy + r * 0.72 * Math.sin(angle)
    const h = 8 + hasard() * 30
    t.boite(bx - 0.22, by - 0.22, bx + 0.22, by + 0.22, z + hauteur, z + hauteur + h, PIERRE_RUINE)
  }
  // Une fenêtre éventrée et de la mousse.
  const [fx, fy] = t.pt(cx + r * 0.7, cy + r * 0.7, z + hauteur * 0.55)
  t.ajouter(`<path d="M${r1(fx - 9)} ${r1(fy + 12)} L${r1(fx - 10)} ${r1(fy - 6)} L${r1(fx - 2)} ${r1(fy - 16)} L${r1(fx + 5)} ${r1(fy - 9)} L${r1(fx + 10)} ${r1(fy - 13)} L${r1(fx + 9)} ${r1(fy + 12)} Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  mousse(t, cx + r * 0.5, cy + r * 0.9, z + hauteur * 0.25, 0.9)
}

// Une fenêtre en arc (neuve), en points du dessin.
function fenetreArc(x, y, k = 1) {
  return (
    `<path d="M${r1(x - 7 * k)} ${r1(y + 12 * k)} V${r1(y - 4 * k)} A${r1(7 * k)} ${r1(7 * k)} 0 0 1 ${r1(x + 7 * k)} ${r1(y - 4 * k)} V${r1(y + 12 * k)} Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
    `<path d="M${r1(x - 3 * k)} ${r1(y + 1 * k)} V${r1(y - 3 * k)}" stroke="${C.jaune}" stroke-width="3"/>`
  )
}

// Un drapeau doré au bout d'une hampe, qui flotte vers la droite.
function drapeau(t, cx, cy, z, graine) {
  const [x, y] = t.pt(cx, cy, z)
  const couleur = graine % 2 ? C.toit : C.jaune
  t.ajouter(
    `<path d="M${r1(x)} ${r1(y + 2)} V${r1(y - 46)}" stroke="${C.encre}" stroke-width="7"/>` +
      `<path d="M${r1(x)} ${r1(y + 2)} V${r1(y - 46)}" stroke="${C.boisFonce}" stroke-width="3"/>` +
      `<path d="M${r1(x + 2)} ${r1(y - 46)} Q${r1(x + 20)} ${r1(y - 52)} ${r1(x + 38)} ${r1(y - 40)} Q${r1(x + 22)} ${r1(y - 34)} ${r1(x + 2)} ${r1(y - 26)} Z" fill="${couleur}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<circle cx="${r1(x)}" cy="${r1(y - 48)}" r="5" fill="${C.jaune}" stroke="${C.encre}" stroke-width="3"/>`,
  )
}

// Une touffe de mousse et de lierre accrochée à un mur.
function mousse(t, x, y, z, k = 1) {
  const [px, py] = t.pt(x, y, z)
  t.ajouter(
    `<path d="M${r1(px - 16 * k)} ${r1(py + 6 * k)} Q${r1(px - 20 * k)} ${r1(py - 10 * k)} ${r1(px - 6 * k)} ${r1(py - 12 * k)} Q${r1(px + 2 * k)} ${r1(py - 24 * k)} ${r1(px + 12 * k)} ${r1(py - 12 * k)} Q${r1(px + 22 * k)} ${r1(py - 6 * k)} ${r1(px + 14 * k)} ${r1(py + 8 * k)} Q${r1(px)} ${r1(py + 16 * k)} ${r1(px - 16 * k)} ${r1(py + 6 * k)} Z" fill="${MOUSSE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M${r1(px + 4 * k)} ${r1(py + 10 * k)} q4 14 -2 26" fill="none" stroke="${fonce(MOUSSE, 0.25)}" stroke-width="4"/>`,
  )
}

// ---------------------------------------------------------------------------
// Le château
// ---------------------------------------------------------------------------

function chateau(neuf) {
  const t = new Toile({ taille: TAILLE, haut: 560, bas: 40 })
  colline(t, neuf)
  const z = HAUTEUR_PLATEAU
  const tours = 1.15 // le rayon des tours d'angle
  const [a, b] = [A + 0.45, B - 0.45] // le centre des tours d'angle

  // La cour : de la terre battue (neuf) ou de l'herbe folle et des cailloux (ruine).
  t.poly(
    [
      [A, A, z],
      [B, A, z],
      [B, B, z],
      [A, B, z],
    ],
    neuf ? clair(TERRE, 0.25) : HERBE_OMBRE,
    { trait: TRAIT_FIN },
  )
  // Le chemin du plateau, de la porte jusqu'à la rampe.
  t.poly(
    [
      [CENTRE - 0.9, B, z],
      [CENTRE + 0.9, B, z],
      [CENTRE + 0.9, CENTRE + RAYON_PLATEAU - 0.55, z],
      [CENTRE - 0.9, CENTRE + RAYON_PLATEAU - 0.55, z],
    ],
    clair(TERRE, 0.15),
    { trait: TRAIT_FIN },
  )

  const hMur = 110
  const hTour = 190
  // Au fond : la tour du fond, le mur du fond et celui de gauche.
  tour(t, a, a, tours, z, neuf ? hTour + 20 : 120, neuf, 1)
  mur(t, a, A, b, A + MUR, z, hMur, neuf, 11)
  mur(t, A, a, A + MUR, b, z, hMur, neuf, 12)

  // Le donjon, au milieu.
  const [d0, d1] = [CENTRE - 2.1, CENTRE + 2.1]
  if (neuf) {
    t.boite(d0, d0, d1, d1, z, z + 20, SOCLE_NEUF)
    t.boite(d0, d0, d1, d1, z + 20, z + 250, PIERRE_NEUVE)
    creneaux(t, d0, d1 - 0.35, d1, d1, z + 250, PIERRE_NEUVE, 20)
    creneaux(t, d1 - 0.35, d0, d1, d1, z + 250, PIERRE_NEUVE, 20)
    t.pyramide(
      [
        [d0 + 0.3, d0 + 0.3],
        [d1 - 0.3, d0 + 0.3],
        [d1 - 0.3, d1 - 0.3],
        [d0 + 0.3, d1 - 0.3],
      ],
      z + 250,
      [CENTRE, CENTRE, z + 430],
      TOIT,
    )
    drapeau(t, CENTRE, CENTRE, z + 430, 2)
    // Les fenêtres du donjon et sa grande bannière rouge à la couronne d'or.
    const largeur = (d1 - d0) * 38.15
    t.surFace(
      'gauche',
      d0,
      d1,
      z,
      [0.22, 0.78]
        .map(
          (f) =>
            `<path d="M${r1(largeur * f - 10)} -150 V-176 A10 10 0 0 1 ${r1(largeur * f + 10)} -176 V-150 Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
            `<path d="M${r1(largeur * f - 4)} -162 V-174" stroke="${C.jaune}" stroke-width="3"/>`,
        )
        .join('') +
        `<path d="M${r1(largeur / 2 - 26)} -230 H${r1(largeur / 2 + 26)} V-120 L${r1(largeur / 2)} -100 L${r1(largeur / 2 - 26)} -120 Z" fill="${C.toit}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
        `<path d="M${r1(largeur / 2 - 14)} -168 L${r1(largeur / 2 - 14)} -188 L${r1(largeur / 2 - 7)} -178 L${r1(largeur / 2)} -192 L${r1(largeur / 2 + 7)} -178 L${r1(largeur / 2 + 14)} -188 L${r1(largeur / 2 + 14)} -168 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
    )
    t.surFace(
      'droite',
      d1,
      d1,
      z,
      [0.3, 0.7]
        .map(
          (f) =>
            `<path d="M${r1(largeur * f - 10)} -170 V-196 A10 10 0 0 1 ${r1(largeur * f + 10)} -196 V-170 Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
            `<path d="M${r1(largeur * f - 4)} -182 V-194" stroke="${C.jaune}" stroke-width="3"/>`,
        )
        .join(''),
    )
  } else {
    // Le donjon en ruine : moins haut, le haut tout cassé, un grand trou dans le mur.
    t.boite(d0, d0, d1, d1, z, z + 150, PIERRE_RUINE)
    const hasard = hasardAvecGraine(7)
    for (let i = 0; i < 6; i++) {
      const f = i / 6
      const h = 10 + hasard() * 50
      t.boite(d0 + (d1 - d0) * f, d0, d0 + (d1 - d0) * (f + 1 / 6), d0 + 0.6, z + 150, z + 150 + h, PIERRE_RUINE)
    }
    for (let i = 1; i < 6; i++) {
      const f = i / 6
      const h = 6 + hasard() * 36
      t.boite(d0, d0 + (d1 - d0) * f, d0 + 0.6, d0 + (d1 - d0) * (f + 1 / 6), z + 150, z + 150 + h, PIERRE_RUINE)
    }
    const largeur = (d1 - d0) * 38.15
    t.surFace(
      'gauche',
      d0,
      d1,
      z,
      `<path d="M${r1(largeur * 0.3)} -40 L${r1(largeur * 0.26)} -90 L${r1(largeur * 0.4)} -118 L${r1(largeur * 0.52)} -100 L${r1(largeur * 0.62)} -122 L${r1(largeur * 0.7)} -80 L${r1(largeur * 0.66)} -40 Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
        `<path d="M${r1(largeur * 0.12)} -20 l10 -16 l-6 -12 l10 -14" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>` +
        `<path d="M${r1(largeur * 0.85)} -130 l-8 14 l8 10 l-6 16" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>`,
    )
    t.surFace(
      'droite',
      d1,
      d1,
      z,
      `<path d="M${r1(largeur * 0.4)} -60 L${r1(largeur * 0.36)} -96 L${r1(largeur * 0.5)} -110 L${r1(largeur * 0.6)} -92 L${r1(largeur * 0.58)} -60 Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
    )
    mousse(t, d0 + 0.6, d1, z + 40, 1.2)
    mousse(t, d1, d1 - 0.8, z + 90, 1)
    mousse(t, d0 + 2.6, d1, z + 120, 0.8)
    // Une poutre tombée, appuyée contre le donjon.
    t.poutre([d0 + 0.8, d1 + 1.6, z], [d0 + 1.6, d1 + 0.05, z + 80], C.boisFonce, 8)
  }

  // Les deux tours des côtés.
  tour(t, b, a, tours, z, neuf ? hTour : 50, neuf, 3)
  tour(t, a, b, tours, z, neuf ? hTour : 140, neuf, 4)
  // Le mur de droite et celui de devant (avec la porte au milieu).
  mur(t, B - MUR, a, B, b, z, hMur, neuf, 13)
  mur(t, a, B - MUR, CENTRE - 1.2, B, z, hMur, neuf, 14)
  mur(t, CENTRE + 1.2, B - MUR, b, B, z, hMur, neuf, 15)

  // La porte : une tour carrée sur le mur de devant.
  const [p0, p1] = [CENTRE - 1.2, CENTRE + 1.2]
  const hPorte = neuf ? 160 : 100
  t.boite(p0, B - 1.0, p1, B + 0.3, z, z + hPorte, neuf ? PIERRE_NEUVE : PIERRE_RUINE)
  if (neuf) {
    creneaux(t, p0, B, p1, B + 0.3, z + hPorte, PIERRE_NEUVE)
    creneaux(t, p1 - 0.3, B - 1.0, p1, B + 0.3, z + hPorte, PIERRE_NEUVE)
  }
  const largeurPorte = (p1 - p0) * 38.15
  const m = largeurPorte / 2
  t.surFace(
    'gauche',
    p0,
    B + 0.3,
    z,
    neuf
      ? // Une grande porte en bois aux clous dorés, sous un arc de pierre, et un écusson d'or.
        `<path d="M${r1(m - 30)} 0 V-50 A30 30 0 0 1 ${r1(m + 30)} -50 V0 Z" fill="${C.pierreFoncee}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m - 22)} 0 V-48 A22 22 0 0 1 ${r1(m + 22)} -48 V0 Z" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m)} 0 V-70 M${r1(m - 22)} -20 H${r1(m + 22)} M${r1(m - 22)} -44 H${r1(m + 22)}" stroke="${C.boisFonce}" stroke-width="${TRAIT_FIN}"/>` +
          [-12, 12].map((d) => `<circle cx="${r1(m + d)}" cy="-30" r="3.5" fill="${C.jaune}" stroke="${C.encre}" stroke-width="2"/>`).join('') +
          `<path d="M${r1(m - 16)} -118 H${r1(m + 16)} V-98 Q${r1(m + 16)} -82 ${r1(m)} -76 Q${r1(m - 16)} -82 ${r1(m - 16)} -98 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
          `<path d="M${r1(m)} -110 V-86 M${r1(m - 9)} -100 H${r1(m + 9)}" stroke="${C.toit}" stroke-width="5"/>`
      : // Un trou noir, la herse tordue, des fissures.
        `<path d="M${r1(m - 28)} 0 V-46 A28 28 0 0 1 ${r1(m + 28)} -46 V0 Z" fill="#3a3150" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m - 16)} -66 V-30 M${r1(m - 4)} -72 V-14 M${r1(m + 8)} -70 V-40 M${r1(m + 18)} -60 V-24" stroke="${C.metal}" stroke-width="4"/>` +
          `<path d="M${r1(m - 26)} -50 L${r1(m + 26)} -46" stroke="${C.metal}" stroke-width="4"/>` +
          `<path d="M${r1(m + 34)} -94 l-8 12 l6 10 l-6 14" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>`,
  )

  // La tour de devant, en dernier (elle passe devant tout).
  tour(t, b, b, tours, z, neuf ? hTour + 10 : 90, neuf, 5)

  // Les détails sur le plateau.
  if (neuf) {
    buisson(t, CENTRE - 2.2, B + 1.2, z, 0.9, C.feuillage)
    buisson(t, CENTRE + 2.4, B + 1.4, z, 1, C.feuillage)
    buisson(t, B + 1.1, CENTRE + 2, z, 0.9, C.feuillage)
    // Deux fanions sur la porte, et des fleurs au pied des murs.
    for (const [x, y] of [
      [CENTRE - 2.6, B + 0.6],
      [CENTRE + 2.8, B + 0.8],
      [B + 0.6, CENTRE + 3],
      [A + 1.2, B + 0.7],
    ]) {
      const [px, py] = t.pt(x, y, z)
      for (const [dx, couleur] of [
        [-8, C.rose],
        [4, C.jaune],
        [14, C.blanc],
      ]) {
        t.ajouter(`<circle cx="${r1(px + dx)}" cy="${r1(py - 4)}" r="5" fill="${couleur}" stroke="${C.encre}" stroke-width="3"/>`)
      }
    }
  } else {
    // Des éboulis : des pierres tombées partout, de l'herbe folle.
    const tas = [
      [CENTRE - 2.5, B + 0.9, 70, 48, 61],
      [CENTRE + 2.2, B + 1.1, 54, 38, 62],
      [B + 0.9, CENTRE + 1.5, 60, 42, 63],
      [B + 1.1, A + 2.5, 46, 32, 64],
      [A + 2.2, B + 1.3, 50, 34, 65],
      [CENTRE + 1, CENTRE + 3.3, 44, 30, 66],
    ]
    for (const [x, y, l, h, graine] of tas) {
      const [px, py] = t.pt(x, y, z)
      t.ajouter(rocher(px, py, l, h, graine, PIERRE_RUINE.gauche, TRAIT))
      t.ajouter(rocher(px + l * 0.35, py + 6, l * 0.5, h * 0.5, graine + 10, PIERRE_RUINE.droite, TRAIT_FIN))
    }
    buisson(t, B + 1.4, CENTRE + 3.6, z, 0.8, MOUSSE)
    buisson(t, A + 0.8, B + 1.6, z, 0.7, MOUSSE)
    mousse(t, B, CENTRE + 2.6, z + 30, 1)
    mousse(t, CENTRE - 2.6, B, z + 50, 1.1)
  }
  return t
}

// Les deux dessins, et le calage pour le jeu.
export function chateaux() {
  const ruine = chateau(false)
  const neuf = chateau(true)
  // Où tombe le pied de la rampe, dans l'image (pour caler le dessin au bout du chemin du jeu).
  const [px, py] = ruine.pt(PIED_RAMPE.x, PIED_RAMPE.y, 0)
  return {
    ruine: ruine.svg(),
    neuf: neuf.svg(),
    calage: { largeur: ruine.largeur, hauteur: ruine.hauteur, coin: { x: r1(ruine.ox), y: r1(ruine.oy) }, piedRampe: { x: r1(px), y: r1(py) } },
  }
}

// (pour vérifier : la case et l'échelle)
export const CASE_DESSIN = { dx: DX, dy: DY }
