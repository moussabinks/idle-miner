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
// Le pied de la colline, au bout du chemin du jeu (sur la toile, en cases).
export const PIED_CHEMIN = { x: CENTRE + RAYON_PIED / Math.SQRT2, y: CENTRE + RAYON_PIED / Math.SQRT2 }

// Les couleurs.
const HERBE = '#99d775'
const HERBE_OMBRE = '#76bd59'
const HERBE_CLAIRE = '#b3e48f'
const TERRE = '#d9b27c'
// Le château neuf : des pierres crème, des toits bleu roi, de l'or.
const PIERRE_NEUVE = teintes('#f3e7cc', '#d8c6a2', '#fbf4e4')
const SOCLE_NEUF = teintes(C.pierre, C.pierreFoncee)
const TOIT = teintes('#5f7fe8', fonce('#5f7fe8', 0.25), clair('#5f7fe8', 0.2))
// La ruine : des pierres grises et lilas, de la mousse.
const PIERRE_RUINE = teintes('#bdb4a6', '#968c7f', '#cdc5b7')
const JOINT = '#9f9586' // les joints des pierres
const MOUSSE = '#7cc35e'
const HERBE_MUR = '#8cc96a' // l'herbe qui a poussé sur le haut des murs en ruine
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
  // (27/10) Le chemin n'est plus dans le dessin : le jeu le dessine d'un seul trait, de la
  // clairière jusqu'à la porte (ChateauVillage.tsx), pour qu'il soit partout pareil.
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
  const [hMin, hMax] = sens === 'face' ? [hauteur * 0.45, hauteur * 0.95] : [hauteur * 0.12, hauteur * 0.3]
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
  // Le dessus : d'abord tout d'un bloc (pas de fente), puis morceau par morceau (sans contour),
  // puis un seul contour tout autour.
  const couleurDessus = sens === 'face' ? t3.haut : HERBE_MUR
  t.poly([...profil.map(([f, h]) => point(f, 0, h)), ...[...profil].reverse().map(([f, h]) => point(f, 1, h))], couleurDessus, { trait: 0 })
  for (let i = 0; i < profil.length - 1; i++) {
    const [fa, ha] = profil[i]
    const [fb, hb] = profil[i + 1]
    if (fb - fa < 1e-6) continue
    // (le dessus des murs des côtés, bas et envahis par l'herbe : il s'efface derrière les tours)
    t.poly([point(fa, 0, ha), point(fa, 1, ha), point(fb, 1, hb), point(fb, 0, hb)], couleurDessus, { trait: 0 })
  }
  t.poly([...profil.map(([f, h]) => point(f, 0, h)), ...[...profil].reverse().map(([f, h]) => point(f, 1, h))], 'none', { trait: TRAIT_FIN })
  if (sens === 'face') pierres(t, u1, v0, long, z, profil, graine + 100, Math.round(long * 2.2))
}

// Une tour en ruine (27/10, redessinée) : pleine, cassée en biais (un côté plus haut que l'autre),
// le bord du haut ébréché ; un créneau tient encore du côté haut. Une fenêtre noire, une fissure,
// du lierre.
function tourEnRuine(t, u, v, r, z, hauteur, graine, versLaGauche = true) {
  const hasard = hasardAvecGraine(graine)
  const [x, y] = g(u, v)
  const [cx, yb] = t.pt(x, y, z)
  const rx = r * DX * Math.SQRT2
  const ry = r * 19.14 * Math.SQRT2
  // La hauteur du haut, selon l'angle (0 : à droite, π : à gauche) : la cassure est en biais.
  const [hHaut, hBas] = [hauteur, hauteur * 0.86]
  const h = (a) => {
    const f = (1 - Math.cos(a)) / 2 // 0 à droite, 1 à gauche
    return versLaGauche ? hBas + (hHaut - hBas) * f : hHaut - (hHaut - hBas) * f
  }
  const pt = (a, hh) => [cx + rx * Math.cos(a), yb + ry * Math.sin(a) - hh]
  const txt = (liste) => liste.map(([px, py]) => `${r1(px)},${r1(py)}`).join(' ')
  // 1. Le dessus (une ellipse penchée), à plat, éclairé.
  const dessus = Array.from({ length: 33 }, (_, i) => (i / 32) * 2 * Math.PI).map((a) => pt(a, h(a)))
  t.ajouter(`<polygon points="${txt(dessus)}" fill="${PIERRE_RUINE.haut}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  // De l'herbe et un petit buisson ont poussé sur le dessus.
  const [hx, hy] = pt(Math.PI * 1.35, h(Math.PI * 1.35))
  t.ajouter(`<ellipse cx="${r1((hx + cx) / 2)}" cy="${r1((hy + yb - h(0)) / 2)}" rx="${r1(rx * 0.5)}" ry="${r1(ry * 0.45)}" fill="${HERBE_MUR}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // 2. Le corps, devant : son bord du haut est ébréché (des pierres qui manquent, en marches).
  const bord = []
  const n = 9
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI
    const creux = i > 0 && i < n && hasard() < 0.55 ? 8 + hasard() * 16 : 0
    if (i > 0) bord.push(pt(a - 0.001, h(a) - (bord.creux ?? 0)))
    bord.push(pt(a, h(a) - creux))
    bord.creux = creux
  }
  const pied = Array.from({ length: 17 }, (_, i) => Math.PI - (i / 16) * Math.PI).map((a) => pt(a, 0))
  const corps = txt([...pied, ...bord])
  const id = t.nouvelId('tour')
  t.defs.push(`<clipPath id="${id}"><polygon points="${corps}"/></clipPath>`)
  t.ajouter(`<polygon points="${corps}" fill="${PIERRE_RUINE.gauche}"/>`)
  t.ajouter(`<rect x="${r1(cx + rx * 0.3)}" y="${r1(yb - hauteur * 1.5)}" width="${r1(rx)}" height="${r1(hauteur * 1.5 + ry * 2)}" fill="${PIERRE_RUINE.droite}" clip-path="url(#${id})"/>`)
  // Quelques pierres sur le corps, et une fissure.
  let joints = ''
  for (let i = 0; i < 6; i++) {
    const a = 0.45 + hasard() * (Math.PI - 0.9)
    const hh = 16 + hasard() * hBas * 0.7
    const [px, py] = pt(a, hh)
    joints += `<rect x="${r1(px - 11)}" y="${r1(py - 5)}" width="22" height="10" rx="3" fill="none" stroke="${JOINT}" stroke-width="3"/>`
  }
  const [fx0, fy0] = pt(Math.PI * 0.62, hBas * 0.85)
  joints += `<path d="M${r1(fx0)} ${r1(fy0)} l7 12 l-6 9 l6 13" fill="none" stroke="${fonce(PIERRE_RUINE.gauche, 0.35)}" stroke-width="${TRAIT_FIN}"/>`
  t.ajouter(`<g clip-path="url(#${id})">${joints}</g>`)
  t.ajouter(`<polygon points="${corps}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  // 3. Un créneau qui tient encore, du côté haut.
  const aCreneau = versLaGauche ? Math.PI * 0.82 : Math.PI * 0.18
  const [mx, my] = pt(aCreneau, h(aCreneau))
  t.ajouter(`<path d="M${r1(mx - 13)} ${r1(my + 4)} V${r1(my - 22)} H${r1(mx + 13)} V${r1(my + 4)}" fill="${PIERRE_RUINE.gauche}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  t.ajouter(`<rect x="${r1(mx - 13)}" y="${r1(my - 28)}" width="26" height="8" rx="2" fill="${PIERRE_RUINE.haut}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // Une fenêtre noire (un peu de travers), et de la mousse au pied.
  const [wx, wy] = pt(Math.PI * 0.5, hBas * 0.5)
  t.ajouter(`<path d="M${r1(wx - 8)} ${r1(wy + 12)} V${r1(wy - 2)} A8 8 0 0 1 ${r1(wx + 8)} ${r1(wy - 2)} V${r1(wy + 12)} Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  mousse(t, u + r * 0.75, v - r * 0.5, z + 10, 0.8)
}

// Le donjon en ruine (27/10, redessiné) : plein, son toit a brûlé (il en reste les poutres noires
// qui dépassent), le haut cassé en biais (plus haut à gauche), un arbre a poussé dessus.
function donjonEnRuine(t, D, z) {
  const hasard = hasardAvecGraine(7)
  const long = 2 * D
  // Le profil du haut : il descend de gauche à droite, en marches.
  const profil = []
  const n = 7
  let avant = null
  for (let i = 0; i < n; i++) {
    const f = (i / n) * long
    const hh = 205 - (i / (n - 1)) * 70 + (hasard() - 0.5) * 22
    if (avant !== null) profil.push([f, avant])
    profil.push([f, hh])
    avant = hh
  }
  profil.push([long, avant])
  const t3 = PIERRE_RUINE
  // Le dessus, du fond vers le devant, en marches : d'abord tout d'un bloc (pas de fente entre les
  // morceaux), puis morceau par morceau, puis le contour.
  t.poly([...profil.map(([f, h]) => [...g(-D, -D + f), z + h]), ...[...profil].reverse().map(([f, h]) => [...g(D, -D + f), z + h])], t3.haut, { trait: 0 })
  for (let i = 0; i < profil.length - 1; i++) {
    const [fa, ha] = profil[i]
    const [fb, hb] = profil[i + 1]
    if (fb - fa < 1e-6) continue
    t.poly([[...g(-D, -D + fa), z + ha], [...g(D, -D + fa), z + ha], [...g(D, -D + fb), z + hb], [...g(-D, -D + fb), z + hb]], t3.haut, { trait: 0 })
  }
  t.poly([...profil.map(([f, h]) => [...g(-D, -D + f), z + h]), ...[...profil].reverse().map(([f, h]) => [...g(D, -D + f), z + h])], 'none', { trait: TRAIT })
  // Les poutres brûlées du toit, qui dépassent du haut.
  for (const [f, du, longueur, angle] of [
    [0.7, -1.2, 70, -0.5],
    [1.6, -0.4, 60, 0.35],
    [2.5, -1.4, 52, -0.2],
  ]) {
    const [bx, by] = t.pt(...g(du, -D + f), z + hauteurDuProfil(profil, f) - 4)
    const ex = bx + Math.sin(angle) * longueur
    const ey = by - Math.cos(angle) * longueur
    t.ajouter(`<path d="M${r1(bx)} ${r1(by)} L${r1(ex)} ${r1(ey)}" stroke="${C.encre}" stroke-width="16" stroke-linecap="round"/>`)
    t.ajouter(`<path d="M${r1(bx)} ${r1(by)} L${r1(ex)} ${r1(ey)}" stroke="#4a3b3a" stroke-width="8" stroke-linecap="round"/>`)
  }
  // Un petit arbre qui a poussé sur le donjon (à droite, là où c'est le plus bas).
  const [ax, ay] = t.pt(...g(0, D - 0.9), z + hauteurDuProfil(profil, long - 0.9))
  t.ajouter(`<path d="M${r1(ax)} ${r1(ay)} Q${r1(ax - 4)} ${r1(ay - 24)} ${r1(ax + 2)} ${r1(ay - 44)}" stroke="${C.encre}" stroke-width="12" fill="none" stroke-linecap="round"/>`)
  t.ajouter(`<path d="M${r1(ax)} ${r1(ay)} Q${r1(ax - 4)} ${r1(ay - 24)} ${r1(ax + 2)} ${r1(ay - 44)}" stroke="${C.tronc}" stroke-width="6" fill="none" stroke-linecap="round"/>`)
  t.ajouter(
    `<path d="M${r1(ax - 30)} ${r1(ay - 40)} Q${r1(ax - 36)} ${r1(ay - 66)} ${r1(ax - 12)} ${r1(ay - 70)} Q${r1(ax)} ${r1(ay - 90)} ${r1(ax + 18)} ${r1(ay - 72)} Q${r1(ax + 38)} ${r1(ay - 66)} ${r1(ax + 30)} ${r1(ay - 42)} Q${r1(ax)} ${r1(ay - 30)} ${r1(ax - 30)} ${r1(ay - 40)} Z" fill="${C.feuillage}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(ax - 18)} ${r1(ay - 62)} Q${r1(ax - 8)} ${r1(ay - 76)} ${r1(ax + 4)} ${r1(ay - 72)}" fill="none" stroke="${clair(C.feuillage, 0.45)}" stroke-width="5"/>`,
  )
  // La face de devant, au haut cassé, avec ses pierres, ses fenêtres noires et un grand trou.
  t.poly([[...g(D, -D), z], [...g(D, D), z], ...[...profil].reverse().map(([f, h]) => [...g(D, -D + f), z + h])], t3.gauche)
  pierres(t, D, -D, long, z, profil, 107, 12)
  const l = long * PIXELS_PAR_CASE
  surFaceAvant(
    t,
    D,
    -D,
    z,
    `<path d="M${r1(l * 0.2 - 11)} -140 V-166 A11 11 0 0 1 ${r1(l * 0.2 + 11)} -166 V-140 Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M${r1(l * 0.42)} -36 L${r1(l * 0.38)} -84 L${r1(l * 0.48)} -110 L${r1(l * 0.58)} -96 L${r1(l * 0.66)} -112 L${r1(l * 0.72)} -74 L${r1(l * 0.7)} -36 Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<path d="M${r1(l * 0.1)} -20 l10 -16 l-6 -12 l10 -14" fill="none" stroke="${fonce(t3.gauche, 0.35)}" stroke-width="${TRAIT_FIN}"/>`,
  )
}

// La tour de la porte en ruine (27/10, redessinée) : pleine, le haut cassé en marches avec deux
// créneaux qui tiennent encore ; la grande porte en bois pend, à moitié arrachée.
function porteEnRuine(t, u0, v0, u1, v1, z) {
  const hasard = hasardAvecGraine(8)
  const long = v1 - v0
  const profil = profilCasse(hasard, long, 92, 120, [0.35, 0.6], 0)
  const t3 = PIERRE_RUINE
  t.poly([...profil.map(([f, h]) => [...g(u0, v0 + f), z + h]), ...[...profil].reverse().map(([f, h]) => [...g(u1, v0 + f), z + h])], t3.haut, { trait: 0 })
  for (let i = 0; i < profil.length - 1; i++) {
    const [fa, ha] = profil[i]
    const [fb, hb] = profil[i + 1]
    if (fb - fa < 1e-6) continue
    t.poly([[...g(u0, v0 + fa), z + ha], [...g(u1, v0 + fa), z + ha], [...g(u1, v0 + fb), z + hb], [...g(u0, v0 + fb), z + hb]], t3.haut, { trait: 0 })
  }
  t.poly([...profil.map(([f, h]) => [...g(u0, v0 + f), z + h]), ...[...profil].reverse().map(([f, h]) => [...g(u1, v0 + f), z + h])], 'none', { trait: TRAIT })
  // Deux créneaux qui tiennent encore (aux deux bouts).
  for (const f of [0.18, long - 0.48]) t.prisme(rectUV(u1 - 0.3, v0 + f, u1, v0 + f + 0.32), z + hauteurDuProfil(profil, f + 0.1), z + hauteurDuProfil(profil, f + 0.1) + 20, t3)
  t.poly([[...g(u1, v0), z], [...g(u1, v1), z], ...[...profil].reverse().map(([f, h]) => [...g(u1, v0 + f), z + h])], t3.gauche)
  pierres(t, u1, v0, long, z, profil, 108, 6)
  const m = (long / 2) * PIXELS_PAR_CASE
  // La porte : le trou noir sous l'arc, un battant en bois qui pend de travers, l'autre est tombé.
  surFaceAvant(
    t,
    u1,
    v0,
    z,
    `<path d="M${r1(m - 30)} 0 V-50 A30 30 0 0 1 ${r1(m + 30)} -50 V0 Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
      `<g transform="rotate(14 ${r1(m - 26)} -52)"><path d="M${r1(m - 26)} -52 H${r1(m - 2)} V-6 H${r1(m - 26)} Z" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
      `<path d="M${r1(m - 14)} -52 V-6 M${r1(m - 26)} -36 H${r1(m - 2)} M${r1(m - 26)} -20 H${r1(m - 2)}" stroke="${fonce(C.boisFonce, 0.3)}" stroke-width="3"/></g>` +
      `<path d="M${r1(m + 2)} 2 L${r1(m + 38)} -6 L${r1(m + 42)} 4 L${r1(m + 6)} 12 Z" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`,
  )
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
  tourEnRuine(t, u, v, r, z, hauteur, graine, v < 0)
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
    donjonEnRuine(t, D, z)
    lierre(t, D, D - 0.5, z + 115, 60, 21)
    lierre(t, D, -D + 0.7, z + 150, 70, 22)
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
  else porteEnRuine(t, S - 1.0, -P, S + 0.35, P, z)
  if (neuf) creneaux(t, 'face', S + 0.05, -P, S + 0.35, P, z + hPorte, PIERRE_NEUVE)
  const m = P * PIXELS_PAR_CASE // le milieu de la face (en pixels depuis son bord gauche)
  // Une grande porte en bois aux clous dorés, sous un arc de pierre, et un écusson d'or.
  if (neuf)
    surFaceAvant(
      t,
      S + 0.35,
      -P,
      z,
      // (la porte de la ruine : voir porteEnRuine)
      // Une grande porte en bois aux clous dorés, sous un arc de pierre, et un écusson d'or.
        `<path d="M${r1(m - 34)} 0 V-56 A34 34 0 0 1 ${r1(m + 34)} -56 V0 Z" fill="${C.pierreFoncee}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m - 25)} 0 V-54 A25 25 0 0 1 ${r1(m + 25)} -54 V0 Z" fill="${C.bois}" stroke="${C.encre}" stroke-width="${TRAIT}"/>` +
          `<path d="M${r1(m)} 0 V-79 M${r1(m - 25)} -22 H${r1(m + 25)} M${r1(m - 25)} -48 H${r1(m + 25)}" stroke="${C.boisFonce}" stroke-width="${TRAIT_FIN}"/>` +
          [-13, 13].map((d) => `<circle cx="${r1(m + d)}" cy="-34" r="4" fill="${C.jaune}" stroke="${C.encre}" stroke-width="2"/>`).join('') +
          `<path d="M${r1(m - 18)} -130 H${r1(m + 18)} V-108 Q${r1(m + 18)} -90 ${r1(m)} -84 Q${r1(m - 18)} -90 ${r1(m - 18)} -108 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
          `<path d="M${r1(m)} -122 V-94 M${r1(m - 10)} -110 H${r1(m + 10)}" stroke="${C.toit}" stroke-width="5"/>` +
          // deux torches de chaque côté de la porte
          [-48, 48]
            .map((d) => `<rect x="${r1(m + d - 3)}" y="-76" width="6" height="18" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="2"/><path d="M${r1(m + d)} -92 Q${r1(m + d + 8)} -82 ${r1(m + d)} -76 Q${r1(m + d - 8)} -82 ${r1(m + d)} -92 Z" fill="${C.orange}" stroke="${C.encre}" stroke-width="2"/>`)
            .join(''),
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
  // Le pied de la porte (le bas du mur de la tour de la porte, au milieu) : le chemin du jeu y monte.
  const [qx, qy] = ruine.pt(...g(S + 0.35, 0), HAUTEUR_COLLINE)
  return {
    ruine: ruine.svg(),
    neuf: neuf.svg(),
    calage: { largeur: ruine.largeur, hauteur: ruine.hauteur, coin: { x: r1(ruine.ox), y: r1(ruine.oy) }, piedChemin: { x: r1(px), y: r1(py) }, porte: { x: r1(qx), y: r1(qy) } },
  }
}
