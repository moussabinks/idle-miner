// Le château de la quête finale (27/10, demandé par le propriétaire) : au fond de la carte, entre
// les deux chaînes de montagnes, sur une colline au bout d'un chemin qui part du coin du haut de la
// clairière. Au début de la partie, c'est une ruine ; quand le joueur paie sa restauration
// (20 millions), il devient un château flambant neuf.
//
// (27/10, retours du propriétaire) Le château est tourné de 45° : sa grande porte est face à nous,
// au milieu du mur de devant, et le chemin monte tout droit vers elle. Il est posé sur une colline
// toute ronde, en herbe (plus de falaise de roche ni de rampe).
//
// Deux dessins de la même taille, calés pareil (on passe de l'un à l'autre sans que rien ne
// bouge) : chateau-ruine.svg et chateau-neuf.svg, avec la même colline.
//
// Les mesures du château se font sur deux axes tournés de 45° : u va vers nous (vers le bas de
// l'écran), v va vers la droite de l'écran. Un mur « de face » (u constant) se voit donc tout droit,
// comme sur un dessin de face ; les murs des côtés (v constant) se voient par le dessus.

import { C, DX, TRAIT, TRAIT_FIN, Toile, clair, fonce, hasardAvecGraine, r1, rocher, teintes } from './formes.mjs'

const TAILLE = 18 // la toile, en cases
const CENTRE = 9 // le milieu de la colline et du château (sur la toile)
const RAYON_HAUT = 8.4 // le dessus de la colline, presque plat (en cases)
const RAYON_PIED = 11.2 // le pied de la colline
const HAUTEUR_COLLINE = 64 // en pixels du dessin
const S = 4.6 // la moitié du côté du château (en cases, sur les axes u et v)
const MUR = 0.7 // l'épaisseur des murs
const DEMI_CHEMIN = 0.62 // la moitié de la largeur du chemin
// Le pied de la colline, au bout du chemin du jeu (sur la toile, en cases).
export const PIED_CHEMIN = { x: CENTRE + RAYON_PIED / Math.SQRT2, y: CENTRE + RAYON_PIED / Math.SQRT2 }

// Les couleurs.
const HERBE = '#99d775'
const HERBE_OMBRE = '#76bd59'
const HERBE_CLAIRE = '#b3e48f'
const TERRE = '#d9b27c'
const TERRE_OMBRE = '#b98f5b'
// Le château neuf : des pierres crème, des toits bleu roi, de l'or.
const PIERRE_NEUVE = teintes('#f3e7cc', '#d8c6a2', '#fbf4e4')
const SOCLE_NEUF = teintes(C.pierre, C.pierreFoncee)
const TOIT = teintes('#5f7fe8', fonce('#5f7fe8', 0.25), clair('#5f7fe8', 0.2))
// La ruine : des pierres grises et lilas, de la mousse.
const PIERRE_RUINE = teintes('#aaa3c2', '#857ca3', '#cfc8e0')
const INTERIEUR = '#7a7099' // l'intérieur sombre d'une tour éventrée
const INTERIEUR_DONJON = '#9a91b8' // l'intérieur du donjon : des éboulis, plus clair
const JOINT = '#8d84ab' // les joints des pierres
const MOUSSE = '#7cc35e'
const NUIT = '#3a3150'

// Un point (u, v) du château → une case de la toile (x, y).
const g = (u, v) => [CENTRE + (u + v) / Math.SQRT2, CENTRE + (u - v) / Math.SQRT2]
// Un rectangle sur les axes u, v → les quatre coins sur la toile (pour Toile.prisme).
const rectUV = (u0, v0, u1, v1) => [g(u0, v0), g(u1, v0), g(u1, v1), g(u0, v1)]
// Sur un mur de face, une case le long de v fait tant de pixels du dessin vers la droite.
const PIXELS_PAR_CASE = DX * Math.SQRT2

// Dessiner à plat sur une face qui nous regarde (u constant) : l'origine est le point (u, v, z),
// x va vers la droite, y vers le bas (en pixels du dessin).
function surFaceAvant(t, u, v, z, contenu) {
  const [x, y] = t.pt(...g(u, v), z)
  t.ajouter(`<g transform="translate(${r1(x)} ${r1(y)})">${contenu}</g>`)
}

// ---------------------------------------------------------------------------
// La colline : une grande butte d'herbe toute ronde (sans falaise)
// ---------------------------------------------------------------------------

function colline(t, neuf) {
  const H = HAUTEUR_COLLINE
  const [cx, yHaut] = t.pt(CENTRE, CENTRE, H)
  const [, yBas] = t.pt(CENTRE, CENTRE, 0)
  const k = Math.SQRT2
  const [rxH, ryH, rxB, ryB] = [RAYON_HAUT * DX * k, RAYON_HAUT * 19.14 * k, RAYON_PIED * DX * k, RAYON_PIED * 19.14 * k]
  // La silhouette : une seule grande courbe toute ronde, du pied à gauche jusqu'au pied à droite,
  // en passant par le haut (derrière le château) ; puis le devant du pied, sans contour (la colline
  // sort du sol, comme les collines des montagnes).
  const sommet = yHaut - ryH * 1.05
  const dessus =
    `M${r1(cx - rxB)} ${r1(yBas)} ` +
    `C${r1(cx - rxB * 0.98)} ${r1(sommet + (yBas - sommet) * 0.25)} ${r1(cx - rxB * 0.62)} ${r1(sommet)} ${r1(cx)} ${r1(sommet)} ` +
    `C${r1(cx + rxB * 0.62)} ${r1(sommet)} ${r1(cx + rxB * 0.98)} ${r1(sommet + (yBas - sommet) * 0.25)} ${r1(cx + rxB)} ${r1(yBas)}`
  const forme = `${dessus} A${r1(rxB)} ${r1(ryB)} 0 0 1 ${r1(cx - rxB)} ${r1(yBas)} Z`
  const id = t.nouvelId('colline')
  t.defs.push(`<clipPath id="${id}"><path d="${forme}"/></clipPath>`)
  t.ajouter(`<path d="${forme}" fill="${HERBE}"/>`)
  // L'ombre : le côté droit de la colline (la lumière vient d'en haut à gauche).
  t.ajouter(`<ellipse cx="${r1(cx + rxB * 0.55)}" cy="${r1(yBas)}" rx="${r1(rxB * 0.75)}" ry="${r1(ryB * 1.3)}" fill="${HERBE_OMBRE}" clip-path="url(#${id})"/>`)
  // La lumière : une grande tache claire en haut à gauche.
  t.ajouter(`<ellipse cx="${r1(cx - rxH * 0.35)}" cy="${r1(yHaut - ryH * 0.2)}" rx="${r1(rxH * 0.6)}" ry="${r1(ryH * 0.55)}" fill="${HERBE_CLAIRE}" clip-path="url(#${id})"/>`)
  t.ajouter(`<path d="${dessus}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  // Des touffes d'herbe et des fleurs sur les flancs.
  const hasard = hasardAvecGraine(neuf ? 5 : 6)
  for (let i = 0; i < 14; i++) {
    const angle = Math.PI * (0.08 + hasard() * 0.84) // devant seulement
    const r = RAYON_HAUT + 0.6 + hasard() * (RAYON_PIED - RAYON_HAUT - 1)
    const f = (r - RAYON_HAUT) / (RAYON_PIED - RAYON_HAUT)
    const [px, py] = t.pt(CENTRE + r * Math.cos(angle) * 0.72 + r * Math.sin(angle) * 0.72, CENTRE - r * Math.cos(angle) * 0.72 + r * Math.sin(angle) * 0.72, H * (1 - f) ** 1.5)
    if (i % 3 === 0) {
      const couleur = [C.jaune, C.rose, C.blanc, C.violet][i % 4]
      t.ajouter(`<circle cx="${r1(px)}" cy="${r1(py)}" r="6" fill="${couleur}" stroke="${C.encre}" stroke-width="3"/><circle cx="${r1(px)}" cy="${r1(py)}" r="2" fill="${C.jaune}"/>`)
    } else {
      t.ajouter(`<path d="M${r1(px - 10)} ${r1(py)} l4 -12 l3 9 l4 -14 l3 12 l4 -9 l2 14" fill="none" stroke="${HERBE_OMBRE}" stroke-width="4"/>`)
    }
  }
  // Le chemin de terre : du pied de la colline jusqu'à la porte, tout droit vers nous.
  const p = (u, z) => [g(u, -DEMI_CHEMIN), g(u, DEMI_CHEMIN)].map(([x, y]) => t.pt(x, y, z))
  const pente = []
  const n = 8
  for (let i = 0; i <= n; i++) {
    const f = i / n
    const u = RAYON_HAUT + (RAYON_PIED - RAYON_HAUT) * f
    pente.push([u, H * (1 - f) ** 1.5])
  }
  const gauche = [[S + 0.4, H], [RAYON_HAUT - 0.3, H], ...pente].map(([u, z]) => p(u, z)[0])
  const droite = [[S + 0.4, H], [RAYON_HAUT - 0.3, H], ...pente].map(([u, z]) => p(u, z)[1])
  const chemin = [...gauche, ...droite.reverse()].map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')
  t.ajouter(`<polygon points="${chemin}" fill="${neuf ? clair(TERRE, 0.1) : TERRE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // Neuf : des pavés (des traits en travers) ; en ruine : des cailloux et de l'herbe folle.
  for (let i = 1; i < pente.length; i++) {
    const [a, b] = p(pente[i][0], pente[i][1])
    if (neuf) t.ajouter(`<path d="M${r1(a[0] + 3)} ${r1(a[1])} L${r1(b[0] - 3)} ${r1(b[1])}" stroke="${TERRE_OMBRE}" stroke-width="3"/>`)
    else if (i % 3 === 1) t.ajouter(rocher((a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2, 16, 11, 40 + i, PIERRE_RUINE.gauche, 3))
  }
}

// Un petit buisson rond.
function buisson(t, u, v, z, k = 1, couleur = C.feuillage) {
  const [px, py] = t.pt(...g(u, v), z)
  t.ajouter(
    `<path d="M${r1(px - 22 * k)} ${r1(py)} Q${r1(px - 26 * k)} ${r1(py - 22 * k)} ${r1(px - 8 * k)} ${r1(py - 24 * k)} Q${r1(px)} ${r1(py - 38 * k)} ${r1(px + 12 * k)} ${r1(py - 26 * k)} Q${r1(px + 28 * k)} ${r1(py - 22 * k)} ${r1(px + 22 * k)} ${r1(py)} Z" fill="${couleur}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(px - 12 * k)} ${r1(py - 18 * k)} Q${r1(px - 6 * k)} ${r1(py - 26 * k)} ${r1(px + 2 * k)} ${r1(py - 24 * k)}" fill="none" stroke="${clair(couleur, 0.45)}" stroke-width="5"/>`,
  )
}

// ---------------------------------------------------------------------------
// Les morceaux du château
// ---------------------------------------------------------------------------

// Des créneaux sur un mur : le mur va le long de v (« face », de v0 à v1, entre u0 et u1) ou le long
// de u (« cote », de u0 à u1, entre v0 et v1).
function creneaux(t, sens, u0, v0, u1, v1, z, pierre, haut = 18) {
  const long = sens === 'face' ? v1 - v0 : u1 - u0
  const n = Math.max(3, Math.round(long / 0.62))
  for (let i = 0; i < n; i += 2) {
    const [a, b] = [i / n, (i + 1) / n]
    const base = sens === 'face' ? rectUV(u0, v0 + (v1 - v0) * a, u1, v0 + (v1 - v0) * b) : rectUV(u0 + (u1 - u0) * a, v0, u0 + (u1 - u0) * b, v1)
    t.prisme(base, z, z + haut, pierre)
  }
}

// Un mur neuf (avec ses créneaux), de (u0, v0) à (u1, v1).
function murNeuf(t, sens, u0, v0, u1, v1, z, hauteur) {
  t.prisme(rectUV(u0, v0, u1, v1), z, z + 16, SOCLE_NEUF)
  t.prisme(rectUV(u0, v0, u1, v1), z + 16, z + hauteur, PIERRE_NEUVE)
  // (les créneaux seulement sur les murs de face : vus par le dessus, ceux des côtés faisaient une
  // échelle)
  if (sens === 'face') creneaux(t, sens, u0, v0, u1, v1, z + hauteur, PIERRE_NEUVE)
}

// Le profil du haut d'un mur cassé : des marches de hauteurs au hasard (des pierres tombées), de
// temps en temps une grande brèche. Une liste de points [position le long du mur, hauteur], avec
// deux points à chaque marche (le haut et le bas de la marche).
function profilCasse(hasard, long, hMin, hMax, pas = [0.35, 0.7], breches = 0.14) {
  const profil = []
  let pos = 0
  let avant = null
  while (pos < long - 0.05) {
    const h = hasard() < breches ? hMin * 0.35 + hasard() * 10 : hMin + hasard() * (hMax - hMin)
    if (avant !== null) profil.push([pos, avant])
    profil.push([pos, h])
    avant = h
    pos += pas[0] + hasard() * (pas[1] - pas[0])
  }
  profil.push([long, avant ?? hMin])
  return profil
}

// La hauteur d'un profil à la position f.
function hauteurDuProfil(profil, f) {
  for (let i = profil.length - 1; i >= 0; i--) if (profil[i][0] <= f) return profil[i][1]
  return profil[0][1]
}

// Des pierres dessinées sur une face qui nous regarde (u constant, de v0 sur « long » cases) : des
// petits rectangles aux coins ronds, un peu plus sombres, sous le haut cassé du mur.
function pierres(t, u, v0, long, z, profil, graine, nombre) {
  const hasard = hasardAvecGraine(graine)
  let dessin = ''
  for (let i = 0; i < nombre; i++) {
    const f = 0.15 + hasard() * (long - 0.3)
    const haut = hauteurDuProfil(profil, f)
    if (haut < 34) continue
    const h = 10 + hasard() * (haut - 30)
    const x = (f * PIXELS_PAR_CASE) - 13
    dessin += `<rect x="${r1(x)}" y="${r1(-h - 6)}" width="${hasard() < 0.5 ? 26 : 18}" height="11" rx="3" fill="${fonce(PIERRE_RUINE.gauche, 0.08)}" stroke="${JOINT}" stroke-width="3"/>`
  }
  surFaceAvant(t, u, v0, z, dessin)
}

// Une branche de lierre qui pend du haut d'un mur (des feuilles rondes le long d'une tige qui ondule).
function lierre(t, u, v, z, longueur, graine) {
  const hasard = hasardAvecGraine(graine)
  const [x, y] = t.pt(...g(u, v), z)
  let tige = `M${r1(x)} ${r1(y)}`
  const feuilles = []
  for (let i = 1; i <= 5; i++) {
    const yy = y + (longueur * i) / 5
    const xx = x + (i % 2 ? 7 : -7) * (0.6 + hasard() * 0.6)
    tige += ` Q${r1(x + (i % 2 ? -8 : 8))} ${r1(yy - longueur / 10)} ${r1(xx)} ${r1(yy)}`
    feuilles.push([xx + (i % 2 ? 8 : -8), yy - 4])
  }
  t.ajouter(`<path d="${tige}" fill="none" stroke="${fonce(MOUSSE, 0.35)}" stroke-width="4"/>`)
  for (const [fx, fy] of feuilles) t.ajouter(`<ellipse cx="${r1(fx)}" cy="${r1(fy)}" rx="8" ry="6" fill="${MOUSSE}" stroke="${C.encre}" stroke-width="3"/>`)
}

// Un mur en ruine : un seul bloc au dessus cassé en marches (des pierres tombées, des brèches),
// avec des pierres dessinées sur sa face.
function murEnRuine(t, sens, u0, v0, u1, v1, z, hauteur, graine) {
  const hasard = hasardAvecGraine(graine)
  const long = sens === 'face' ? v1 - v0 : u1 - u0
  // (les murs des côtés sont plus bas : vus par le dessus, hauts, ils faisaient des piliers)
  const [hMin, hMax] = sens === 'face' ? [hauteur * 0.45, hauteur * 0.95] : [hauteur * 0.25, hauteur * 0.5]
  const profil = profilCasse(hasard, long, hMin, hMax, sens === 'face' ? [0.35, 0.75] : [0.9, 1.6])
  // Un point du mur : f le long du mur, c = 0 (dos ou gauche) ou 1 (devant ou droite), h la hauteur.
  const point = (f, c, h) => [...(sens === 'face' ? g(c ? u1 : u0, v0 + f) : g(u0 + f, c ? v1 : v0)), z + h]
  const t3 = PIERRE_RUINE
  if (sens === 'face') {
    // La face qui nous regarde, au haut cassé.
    t.poly([point(0, 1, 0), point(long, 1, 0), ...[...profil].reverse().map(([f, h]) => point(f, 1, h))], t3.gauche)
  } else {
    // Un mur de côté : on voit son bout (vers nous).
    const [, hFin] = profil[profil.length - 1]
    t.poly([point(long, 0, 0), point(long, 1, 0), point(long, 1, hFin), point(long, 0, hFin)], t3.gauche)
  }
  // Le dessus, morceau par morceau (sans contour), puis un seul contour tout autour.
  for (let i = 0; i < profil.length - 1; i++) {
    const [fa, ha] = profil[i]
    const [fb, hb] = profil[i + 1]
    if (fb - fa < 1e-6) continue
    // (le dessus des murs des côtés un peu plus sombre : il s'efface derrière les tours)
    t.poly([point(fa, 0, ha), point(fa, 1, ha), point(fb, 1, hb), point(fb, 0, hb)], sens === 'face' ? t3.haut : t3.gauche, { trait: 0 })
  }
  t.poly([...profil.map(([f, h]) => point(f, 0, h)), ...[...profil].reverse().map(([f, h]) => point(f, 1, h))], 'none', { trait: TRAIT_FIN })
  if (sens === 'face') pierres(t, u1, v0, long, z, profil, graine + 100, Math.round(long * 2.2))
}

// Une tour en ruine (27/10) : creuse, le haut cassé en marches tout autour ; par-dessus le bord, on
// voit l'intérieur sombre et le mur du fond, plus haut. Une fenêtre éventrée, du lierre.
function tourEnRuine(t, u, v, r, z, hauteur, graine) {
  const hasard = hasardAvecGraine(graine)
  const [x, y] = g(u, v)
  const [cx, yb] = t.pt(x, y, z)
  const rx = r * DX * Math.SQRT2
  const ry = r * 19.14 * Math.SQRT2
  const epaisseur = 0.74 // le rayon de l'intérieur (la tour est creuse)
  // Les hauteurs du bord, en marches : devant (de droite à gauche, en passant devant) et au fond.
  const marches = (debut, fin, hMin, hMax) => {
    const liste = []
    const n = 7
    let avant = null
    for (let i = 0; i < n; i++) {
      const a = debut + ((fin - debut) * i) / n
      const h = hMin + hasard() * (hMax - hMin)
      if (avant !== null) liste.push([a, avant])
      liste.push([a, h])
      avant = h
    }
    liste.push([fin, avant])
    return liste
  }
  const devant = marches(0, Math.PI, hauteur * 0.72, hauteur)
  const fond = marches(Math.PI, 2 * Math.PI, hauteur * 0.95, hauteur * 1.3)
  // Un point du bord (angle a, hauteur h), à l'extérieur (k = 1) ou à l'intérieur (k = epaisseur).
  const pt = (a, h, k = 1) => `${r1(cx + rx * k * Math.cos(a))},${r1(yb + ry * k * Math.sin(a) - h)}`
  const liste = (points, k) => points.map(([a, h]) => pt(a, h, k)).join(' ')
  const inverse = (points) => [...points].reverse()
  // 1. L'intérieur : le mur du fond vu de dedans (sombre), jusqu'au bord de devant.
  t.ajouter(`<polygon points="${liste(fond, epaisseur)} ${liste(devant, epaisseur)}" fill="${INTERIEUR}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // 2. Le dessus du mur du fond (l'épaisseur de la pierre).
  t.ajouter(`<polygon points="${liste(fond, 1)} ${liste(inverse(fond), epaisseur)}" fill="${PIERRE_RUINE.haut}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // 3. Le corps de la tour, devant : du pied jusqu'au bord cassé, avec son ombre à droite.
  const pied = Array.from({ length: 13 }, (_, i) => Math.PI - (i / 12) * Math.PI).map((a) => pt(a, 0)).join(' ')
  const corps = `${pied} ${liste(devant, 1)}`
  const id = t.nouvelId('tour')
  t.defs.push(`<clipPath id="${id}"><polygon points="${corps}"/></clipPath>`)
  t.ajouter(`<polygon points="${corps}" fill="${PIERRE_RUINE.gauche}"/>`)
  t.ajouter(`<rect x="${r1(cx + rx * 0.3)}" y="${r1(yb - hauteur * 1.4)}" width="${r1(rx)}" height="${r1(hauteur * 1.4 + ry * 2)}" fill="${PIERRE_RUINE.droite}" clip-path="url(#${id})"/>`)
  // Des pierres sur le corps (des rangées qui suivent la courbe de la tour).
  let joints = ''
  for (let i = 0; i < 9; i++) {
    const a = 0.35 + hasard() * (Math.PI - 0.7)
    const h = 14 + hasard() * (hauteur * 0.6)
    const px = cx + rx * Math.cos(a)
    const py = yb + ry * Math.sin(a) - h
    joints += `<rect x="${r1(px - 11)}" y="${r1(py - 5)}" width="22" height="10" rx="3" fill="none" stroke="${JOINT}" stroke-width="3"/>`
  }
  t.ajouter(`<g clip-path="url(#${id})">${joints}</g>`)
  t.ajouter(`<polygon points="${corps}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  // 4. Le dessus du bord de devant (l'épaisseur de la pierre).
  t.ajouter(`<polygon points="${liste(devant, 1)} ${liste(inverse(devant), epaisseur)}" fill="${PIERRE_RUINE.haut}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // Une fenêtre éventrée, et du lierre.
  const fx = cx + rx * 0.15
  const fy = yb + ry - hauteur * 0.5
  t.ajouter(`<path d="M${r1(fx - 9)} ${r1(fy + 13)} V${r1(fy - 3)} A9 9 0 0 1 ${r1(fx + 9)} ${r1(fy - 3)} V${r1(fy + 13)} Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  mousse(t, u + r * 0.75, v - r * 0.5, z + hauteur * 0.2, 0.8)
}

// Un bloc carré creux en ruine (le donjon, la tour de la porte) : la face de devant au haut cassé,
// le mur du fond plus haut, vu de dedans (sombre), et le dessus des murs des côtés.
function blocCreux(t, u0, v0, u1, v1, z, devant, fond, graine) {
  const hasard = hasardAvecGraine(graine)
  const e = 0.42 // l'épaisseur des murs
  const long = v1 - v0
  const pDevant = profilCasse(hasard, long, devant[0], devant[1], [0.3, 0.6], 0.1)
  const pFond = profilCasse(hasard, long, fond[0], fond[1], [0.3, 0.6], 0.05)
  const t3 = PIERRE_RUINE
  const face = (u, profil, couleur) => t.poly([[...g(u, v0), z], [...g(u, v1), z], ...[...profil].reverse().map(([f, h]) => [...g(u, v0 + f), z + h])], couleur)
  const dessus = (ua, ub, profil) => {
    for (let i = 0; i < profil.length - 1; i++) {
      const [fa, ha] = profil[i]
      const [fb, hb] = profil[i + 1]
      if (fb - fa < 1e-6) continue
      t.poly([[...g(ua, v0 + fa), z + ha], [...g(ub, v0 + fa), z + ha], [...g(ub, v0 + fb), z + hb], [...g(ua, v0 + fb), z + hb]], t3.haut, { trait: 0 })
    }
    t.poly([...profil.map(([f, h]) => [...g(ua, v0 + f), z + h]), ...[...profil].reverse().map(([f, h]) => [...g(ub, v0 + f), z + h])], 'none', { trait: TRAIT_FIN })
  }
  // Le mur du fond (vu de dedans : sombre) et son dessus.
  face(u0 + e, pFond, INTERIEUR_DONJON)
  dessus(u0, u0 + e, pFond)
  // Le dessus des murs des côtés : il descend du fond vers le devant.
  for (const [va, vb, f] of [
    [v0, v0 + e, 0],
    [v1 - e, v1, long],
  ]) {
    const hf = hauteurDuProfil(pFond, Math.min(f, long - 0.01))
    const hd = hauteurDuProfil(pDevant, Math.min(f, long - 0.01))
    t.poly([[...g(u0, va), z + hf], [...g(u0, vb), z + hf], [...g(u1, vb), z + hd], [...g(u1, va), z + hd]], t3.haut, { trait: TRAIT_FIN })
  }
  // La face de devant, son dessus et ses pierres.
  face(u1, pDevant, t3.gauche)
  dessus(u1 - e, u1, pDevant)
  pierres(t, u1, v0, long, z, pDevant, graine + 100, Math.round(long * 3))
}

// Une tour ronde, neuve (un toit pointu bleu et un drapeau doré) ou en ruine (cassée en haut).
function tour(t, u, v, r, z, hauteur, neuf, graine) {
  const [cx, cy] = g(u, v)
  if (neuf) {
    t.cylindre(cx, cy, r, z, z + 22, SOCLE_NEUF)
    t.cylindre(cx, cy, r, z + 22, z + hauteur, PIERRE_NEUVE)
    t.cylindre(cx, cy, r * 1.12, z + hauteur, z + hauteur + 12, PIERRE_NEUVE)
    // Deux fenêtres en arc, vers nous.
    for (const [dv, dz] of [
      [-0.3, 0.42],
      [0.25, 0.68],
    ]) {
      const [fx, fy] = t.pt(...g(u + r * 0.85, v + dv * r), z + hauteur * dz)
      t.ajouter(fenetreArc(fx, fy))
    }
    const pointe = z + hauteur + 12 + r * 105
    const base = Array.from({ length: 16 }, (_, i) => [cx + r * 1.25 * Math.cos((i / 16) * 2 * Math.PI), cy + r * 1.25 * Math.sin((i / 16) * 2 * Math.PI)])
    t.pyramide(base, z + hauteur + 10, [cx, cy, pointe], TOIT)
    drapeau(t, cx, cy, pointe, graine)
    return
  }
  tourEnRuine(t, u, v, r, z, hauteur, graine)
}

// Une fenêtre en arc (neuve), en points du dessin.
function fenetreArc(x, y, k = 1) {
  return (
    `<path d="M${r1(x - 7 * k)} ${r1(y + 12 * k)} V${r1(y - 4 * k)} A${r1(7 * k)} ${r1(7 * k)} 0 0 1 ${r1(x + 7 * k)} ${r1(y - 4 * k)} V${r1(y + 12 * k)} Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
    `<path d="M${r1(x - 3 * k)} ${r1(y + 1 * k)} V${r1(y - 3 * k)}" stroke="${C.jaune}" stroke-width="3"/>`
  )
}

// Un drapeau au bout d'une hampe, qui flotte vers la droite.
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
function mousse(t, u, v, z, k = 1) {
  const [px, py] = t.pt(...g(u, v), z)
  t.ajouter(
    `<path d="M${r1(px - 16 * k)} ${r1(py + 6 * k)} Q${r1(px - 20 * k)} ${r1(py - 10 * k)} ${r1(px - 6 * k)} ${r1(py - 12 * k)} Q${r1(px + 2 * k)} ${r1(py - 24 * k)} ${r1(px + 12 * k)} ${r1(py - 12 * k)} Q${r1(px + 22 * k)} ${r1(py - 6 * k)} ${r1(px + 14 * k)} ${r1(py + 8 * k)} Q${r1(px)} ${r1(py + 16 * k)} ${r1(px - 16 * k)} ${r1(py + 6 * k)} Z" fill="${MOUSSE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M${r1(px + 4 * k)} ${r1(py + 10 * k)} q4 14 -2 26" fill="none" stroke="${fonce(MOUSSE, 0.25)}" stroke-width="4"/>`,
  )
}

// ---------------------------------------------------------------------------
// Le château
// ---------------------------------------------------------------------------

function chateau(neuf) {
  const t = new Toile({ taille: TAILLE, haut: 520, bas: 30 })
  colline(t, neuf)
  const z = HAUTEUR_COLLINE
  const rTour = 1.2
  const hMur = 110
  const hTour = neuf ? 190 : 0
  const mur = (sens, u0, v0, u1, v1, graine) => (neuf ? murNeuf(t, sens, u0, v0, u1, v1, z, hMur) : murEnRuine(t, sens, u0, v0, u1, v1, z, hMur, graine))

  // La cour : de la terre battue (neuf) ou de l'herbe folle (ruine).
  t.poly(
    rectUV(-S, -S, S, S).map(([x, y]) => [x, y, z]),
    neuf ? clair(TERRE, 0.25) : HERBE_OMBRE,
    { trait: TRAIT_FIN },
  )

  // Au fond : le mur du fond et ses deux tours.
  mur('face', -S, -S, -S + MUR, S, 11)
  // (plus vers le milieu que les tours de devant, et plus hautes : on les voit derrière)
  tour(t, -S + 0.2, -2.9, rTour * 0.95, z, neuf ? hTour + 50 : 120, neuf, 1)
  tour(t, -S + 0.2, 2.9, rTour * 0.95, z, neuf ? hTour + 50 : 60, neuf, 2)
  // Les murs des côtés.
  mur('cote', -S, -S, S, -S + MUR, 12)
  mur('cote', -S, S - MUR, S, S, 13)

  // Le donjon, au milieu.
  const D = 2.1
  if (neuf) {
    t.prisme(rectUV(-D, -D, D, D), z, z + 20, SOCLE_NEUF)
    t.prisme(rectUV(-D, -D, D, D), z + 20, z + 250, PIERRE_NEUVE)
    creneaux(t, 'face', D - 0.35, -D, D, D, z + 250, PIERRE_NEUVE, 20)
    t.pyramide(rectUV(-D + 0.3, -D + 0.3, D - 0.3, D - 0.3), z + 250, [...g(0, 0), z + 440], TOIT)
    drapeau(t, ...g(0, 0), z + 440, 2)
    // Ses fenêtres, et sa grande bannière rouge à la couronne d'or (sur la face qui nous regarde).
    const l = 2 * D * PIXELS_PAR_CASE
    surFaceAvant(
      t,
      D,
      -D,
      z,
      [0.2, 0.8]
        .map((f) => `<path d="M${r1(l * f - 11)} -150 V-178 A11 11 0 0 1 ${r1(l * f + 11)} -178 V-150 Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/><path d="M${r1(l * f - 4)} -162 V-176" stroke="${C.jaune}" stroke-width="3"/>`)
        .join('') +
        `<path d="M${r1(l / 2 - 30)} -236 H${r1(l / 2 + 30)} V-116 L${r1(l / 2)} -94 L${r1(l / 2 - 30)} -116 Z" fill="${C.toit}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
        `<path d="M${r1(l / 2 - 16)} -168 L${r1(l / 2 - 16)} -190 L${r1(l / 2 - 8)} -179 L${r1(l / 2)} -195 L${r1(l / 2 + 8)} -179 L${r1(l / 2 + 16)} -190 L${r1(l / 2 + 16)} -168 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
    )
  } else {
    // Le donjon en ruine : creux, le haut cassé, un grand trou dans le mur de devant.
    blocCreux(t, -D, -D, D, D, z, [135, 180], [165, 205], 7)
    const l = 2 * D * PIXELS_PAR_CASE
    surFaceAvant(
      t,
      D,
      -D,
      z,
      `<path d="M${r1(l * 0.32)} -40 L${r1(l * 0.28)} -92 L${r1(l * 0.42)} -120 L${r1(l * 0.54)} -100 L${r1(l * 0.64)} -124 L${r1(l * 0.72)} -82 L${r1(l * 0.68)} -40 Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
        `<path d="M${r1(l * 0.12)} -20 l10 -16 l-6 -12 l10 -14" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>` +
        `<path d="M${r1(l * 0.86)} -130 l-8 14 l8 10 l-6 16" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>`,
    )
    mousse(t, D, -D + 0.6, z + 40, 1.2)
    lierre(t, D, D - 0.6, z + 120, 70, 21)
    lierre(t, D, -D + 1.4, z + 110, 55, 22)
    t.poutre([...g(D + 1.6, -0.6), z], [...g(D + 0.05, -1.2), z + 80], C.boisFonce, 8)
  }

  // Devant : le mur de devant (avec la porte au milieu) et ses deux tours.
  const P = 1.35 // la moitié de la largeur de la tour de la porte
  mur('face', S - MUR, -S, S, -P, 14)
  mur('face', S - MUR, P, S, S, 15)
  tour(t, S, -S, rTour, z, neuf ? hTour : 90, neuf, 3)
  tour(t, S, S, rTour, z, neuf ? hTour : 140, neuf, 4)

  // La porte : une tour carrée sur le mur de devant, face à nous.
  const hPorte = neuf ? 165 : 100
  if (neuf) t.prisme(rectUV(S - 1.0, -P, S + 0.35, P), z, z + hPorte, PIERRE_NEUVE)
  else blocCreux(t, S - 1.0, -P, S + 0.35, P, z, [80, 104], [98, 124], 8)
  if (neuf) creneaux(t, 'face', S + 0.05, -P, S + 0.35, P, z + hPorte, PIERRE_NEUVE)
  const m = P * PIXELS_PAR_CASE // le milieu de la face (en pixels depuis son bord gauche)
  surFaceAvant(
    t,
    S + 0.35,
    -P,
    z,
    neuf
      ? // Une grande porte en bois aux clous dorés, sous un arc de pierre, et un écusson d'or.
        `<path d="M${r1(m - 34)} 0 V-56 A34 34 0 0 1 ${r1(m + 34)} -56 V0 Z" fill="${C.pierreFoncee}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m - 25)} 0 V-54 A25 25 0 0 1 ${r1(m + 25)} -54 V0 Z" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m)} 0 V-79 M${r1(m - 25)} -22 H${r1(m + 25)} M${r1(m - 25)} -48 H${r1(m + 25)}" stroke="${C.boisFonce}" stroke-width="${TRAIT_FIN}"/>` +
          [-13, 13].map((d) => `<circle cx="${r1(m + d)}" cy="-34" r="4" fill="${C.jaune}" stroke="${C.encre}" stroke-width="2"/>`).join('') +
          `<path d="M${r1(m - 18)} -130 H${r1(m + 18)} V-108 Q${r1(m + 18)} -90 ${r1(m)} -84 Q${r1(m - 18)} -90 ${r1(m - 18)} -108 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
          `<path d="M${r1(m)} -122 V-94 M${r1(m - 10)} -110 H${r1(m + 10)}" stroke="${C.toit}" stroke-width="5"/>` +
          // deux torches de chaque côté de la porte
          [-48, 48]
            .map((d) => `<rect x="${r1(m + d - 3)}" y="-76" width="6" height="18" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="2"/><path d="M${r1(m + d)} -92 Q${r1(m + d + 8)} -82 ${r1(m + d)} -76 Q${r1(m + d - 8)} -82 ${r1(m + d)} -92 Z" fill="${C.orange}" stroke="${C.encre}" stroke-width="2"/>`)
            .join('')
      : // Un trou noir, la herse tordue, des fissures.
        `<path d="M${r1(m - 30)} 0 V-50 A30 30 0 0 1 ${r1(m + 30)} -50 V0 Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m - 17)} -70 V-32 M${r1(m - 4)} -76 V-14 M${r1(m + 9)} -74 V-42 M${r1(m + 20)} -62 V-26" stroke="${C.metal}" stroke-width="4"/>` +
          `<path d="M${r1(m - 28)} -54 L${r1(m + 28)} -50" stroke="${C.metal}" stroke-width="4"/>` +
          `<path d="M${r1(m + 40)} -94 l-8 12 l6 10 l-6 14" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.3)}" stroke-width="${TRAIT_FIN}"/>`,
  )

  // Les détails sur la colline, devant le château.
  if (neuf) {
    buisson(t, S + 1.3, -2.6, z, 0.9)
    buisson(t, S + 1.3, 2.8, z, 1)
    buisson(t, 1.5, S + 1.4, z, 0.8)
    buisson(t, 0.5, -S - 1.4, z, 0.8)
    for (const [u, v] of [
      [S + 0.9, -4],
      [S + 0.9, 4.2],
      [S + 1.8, -1.6],
      [S + 1.8, 1.8],
    ]) {
      const [px, py] = t.pt(...g(u, v), z)
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
    for (const [u, v, l, h, graine] of [
      [S + 1.1, -2.8, 70, 48, 61],
      [S + 1.3, 2.5, 54, 38, 62],
      [S + 0.9, 4.5, 60, 42, 63],
      [0.5, S + 1.2, 46, 32, 64],
      [1, -S - 1.1, 50, 34, 65],
      [S + 2, -4.4, 44, 30, 66],
    ]) {
      const [px, py] = t.pt(...g(u, v), z)
      t.ajouter(rocher(px, py, l, h, graine, PIERRE_RUINE.gauche, TRAIT))
      t.ajouter(rocher(px + l * 0.35, py + 6, l * 0.5, h * 0.5, graine + 10, PIERRE_RUINE.droite, TRAIT_FIN))
    }
    buisson(t, S + 1.6, 1.2, z, 0.8, MOUSSE)
    buisson(t, -1, -S - 1.4, z, 0.7, MOUSSE)
    mousse(t, S, -3.2, z + 40, 1)
    mousse(t, S, 3, z + 50, 1.1)
    lierre(t, S, -2.2, z + 70, 50, 31)
    lierre(t, S, 2.4, z + 60, 45, 32)
  }
  return t
}

// Les deux dessins, et le calage pour le jeu.
export function chateaux() {
  const ruine = chateau(false)
  const neuf = chateau(true)
  // Où tombe le pied du chemin, dans l'image (pour caler le dessin au bout du chemin du jeu).
  const [px, py] = ruine.pt(PIED_CHEMIN.x, PIED_CHEMIN.y, 0)
  return {
    ruine: ruine.svg(),
    neuf: neuf.svg(),
    calage: { largeur: ruine.largeur, hauteur: ruine.hauteur, coin: { x: r1(ruine.ox), y: r1(ruine.oy) }, piedChemin: { x: r1(px), y: r1(py) } },
  }
}
