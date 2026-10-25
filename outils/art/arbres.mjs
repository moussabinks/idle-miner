// Les arbres de la forêt (et de la plage) : des arbres « sucette » tout simples, au feuillage rond
// et plat, avec un contour épais. Sept sortes : le rond, le nuage, le sapin, le buisson, le
// cerisier (rose), l'arbre d'automne (jaune, à mettre avec parcimonie) et le palmier.
//
// Chaque arbre est dessiné dans le même cadre (360 × 460), son pied au point PIED. À ses pieds,
// une petite ombre plate d'un vert à peine plus sombre que l'herbe, et une touffe d'herbe qui
// cache le bas du tronc : l'arbre se fond dans le sol (pas de tache sombre).

import { C, clair, fonce, r1 } from './formes.mjs'

const LARGEUR = 360
const HAUTEUR = 460
const PIED = { x: 180, y: 420 }
const LARGEUR_PIED = 200 // la largeur de l'ombre : le jeu la cale sur la taille voulue (en cases)
const T = 8 // le contour

// Une ombre plate sous l'arbre.
const ombre = (couleur = C.herbeFoncee) => `<ellipse cx="0" cy="0" rx="${LARGEUR_PIED / 2}" ry="30" fill="${couleur}"/>`

// Le tronc : un peu plus large en bas, de la hauteur donnée.
function tronc(hauteur, largeur = 42, couleur = C.tronc) {
  const l = largeur / 2
  return (
    `<path d="M${-l - 8} 4 Q${-l} -6 ${-l + 2} -30 L${-l + 6} ${-hauteur} L${l - 6} ${-hauteur} L${l - 2} -30 Q${l} -6 ${l + 8} 4 Z" fill="${couleur}" stroke="${C.encre}" stroke-width="${T}"/>` +
    // le côté droit du tronc, à l'ombre
    `<path d="M${l * 0.25} -6 L${l * 0.3} ${-hauteur + 4}" stroke="${fonce(couleur, 0.25)}" stroke-width="${l * 0.7}"/>`
  )
}

// Une touffe d'herbe (de la couleur de l'herbe) devant le pied du tronc.
const touffe = () =>
  `<path d="M-40 6 Q-38 -14 -50 -26 Q-28 -16 -22 2 Q-20 -22 -8 -34 Q-4 -12 4 2 Q10 -18 26 -28 Q18 -8 22 4 Q30 -12 46 -18 Q36 -4 40 8 Z" fill="${C.herbe}" stroke="${C.herbeFoncee}" stroke-width="5"/>`

// Un feuillage fait de plusieurs ronds : un seul contour autour de tous, une teinte sombre (en
// bas à droite) et la teinte claire décalée vers la lumière (en haut à gauche).
let nbIds = 0
function feuillage(cercles, couleur, sombre, decalage = 20) {
  nbIds += 1
  const id = `feuillage${nbIds}`
  const ronds = (attributs, dx = 0, dy = 0) => cercles.map(([x, y, r]) => `<circle cx="${r1(x + dx)}" cy="${r1(y + dy)}" r="${r}" ${attributs}/>`).join('')
  return (
    `<defs><clipPath id="${id}">${ronds('')}</clipPath></defs>` +
    ronds(`fill="${C.encre}" stroke="${C.encre}" stroke-width="${2 * T}"`) +
    ronds(`fill="${sombre}"`) +
    `<g clip-path="url(#${id})">${ronds(`fill="${couleur}"`, -decalage, -decalage * 1.1)}</g>`
  )
}

// Un reflet en arc de cercle, en haut à gauche d'un rond du feuillage (comme sur un ballon).
function reflet(cx, cy, r, couleur) {
  const point = (degres) => [cx + Math.cos((degres * Math.PI) / 180) * r * 0.7, cy + Math.sin((degres * Math.PI) / 180) * r * 0.7]
  const [xa, ya] = point(200)
  const [xb, yb] = point(250)
  return `<path d="M${r1(xa)} ${r1(ya)} A${r1(r * 0.7)} ${r1(r * 0.7)} 0 0 1 ${r1(xb)} ${r1(yb)}" stroke="${couleur}" stroke-width="12" fill="none"/>`
}

function arbreRond(couleur = C.feuillage, sombre = C.feuillageFonce) {
  return ombre() + tronc(180) + feuillage([[0, -255, 140]], couleur, sombre, 24) + reflet(-24, -280, 140, clair(couleur, 0.35)) + touffe()
}

function arbreNuage() {
  const cercles = [
    [-78, -205, 82],
    [78, -205, 82],
    [0, -290, 100],
    [0, -190, 90],
  ]
  return ombre() + tronc(150) + feuillage(cercles, C.feuillage, C.feuillageFonce) + reflet(-20, -310, 100, clair(C.feuillage, 0.35)) + touffe()
}

function sapin() {
  const vert = '#4fb064'
  const sombre = '#3e9254'
  // Trois étages, du bas vers le haut : demi-largeur, bas, pointe.
  const etages = [
    [150, -60, -240],
    [120, -160, -330],
    [88, -255, -410],
  ]
  let dessin = ombre() + tronc(90, 38)
  for (const [l, bas, pointe] of etages) {
    const forme = `M${-l} ${bas} L0 ${pointe} L${l} ${bas} Q0 ${bas + 34} ${-l} ${bas} Z`
    dessin +=
      `<path d="${forme}" fill="${vert}" stroke="${C.encre}" stroke-width="${T}"/>` +
      `<path d="M0 ${pointe + 10} L${l - 10} ${bas - 2} Q${l / 2} ${bas + 20} 2 ${bas + 26} Z" fill="${sombre}"/>` +
      `<path d="${forme}" fill="none" stroke="${C.encre}" stroke-width="${T}"/>`
  }
  return dessin + touffe()
}

function buisson() {
  const cercles = [
    [-85, -140, 80],
    [85, -140, 80],
    [0, -195, 98],
    [0, -130, 88],
  ]
  return ombre() + tronc(90, 40) + feuillage(cercles, '#6cc66e', C.feuillageFonce) + reflet(-20, -215, 98, clair('#6cc66e', 0.35)) + touffe()
}

function cerisier() {
  const cercles = [
    [-75, -215, 80],
    [75, -215, 80],
    [0, -285, 100],
  ]
  const fleurs = [
    [-90, -230],
    [-40, -300],
    [30, -250],
    [80, -200],
    [10, -340],
    [60, -290],
    [-60, -180],
  ]
  return (
    ombre() +
    tronc(170, 32, '#8a5a3c') +
    feuillage(cercles, C.rose, fonce(C.rose, 0.15)) +
    fleurs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${clair(C.rose, 0.6)}"/>`).join('') +
    touffe()
  )
}

function automne() {
  return ombre() + tronc(180) + feuillage([[0, -255, 135]], C.jaune, C.orange, 24) + reflet(-24, -280, 135, clair(C.jaune, 0.5)) + touffe()
}

function palmier() {
  // Le tronc courbé, en anneaux, de (0, 0) à (34, -300).
  const point = (k) => [34 * k * k, -300 * k]
  // (il pousse sur le sable : une ombre couleur de sable mouillé, et pas de touffe d'herbe)
  let dessin = ombre('#e2c27e')
  const anneaux = 7
  for (let i = 0; i < anneaux; i++) {
    const [xa, ya] = point(i / anneaux)
    const [xb, yb] = point((i + 1) / anneaux)
    const la = 20 - i * 1.2
    const lb = 20 - (i + 1) * 1.2
    dessin += `<path d="M${r1(xa - la)} ${r1(ya)} L${r1(xb - lb)} ${r1(yb)} L${r1(xb + lb)} ${r1(yb)} L${r1(xa + la)} ${r1(ya)} Z" fill="${i % 2 ? C.bois : clair(C.bois, 0.15)}" stroke="${C.encre}" stroke-width="${T}"/>`
  }
  // Les palmes : six grandes feuilles qui partent de la couronne.
  const [cx, cy] = point(1)
  const palmes = [
    [-150, -10],
    [-115, 60],
    [-45, -90],
    [60, -95],
    [130, 55],
    [140, -15],
  ]
  for (const [dx, dy] of palmes) {
    const bout = [cx + dx, cy + dy + 30]
    const milieu = [cx + dx / 2, cy + dy / 2 - 30]
    const l = Math.hypot(dx, dy)
    const nx = (-dy / l) * 34
    const ny = (dx / l) * 34
    dessin +=
      `<path d="M${r1(cx)} ${r1(cy)} Q${r1(milieu[0] + nx)} ${r1(milieu[1] + ny)} ${r1(bout[0])} ${r1(bout[1])} Q${r1(milieu[0] - nx)} ${r1(milieu[1] - ny)} ${r1(cx)} ${r1(cy)} Z" fill="${C.feuillage}" stroke="${C.encre}" stroke-width="${T}"/>` +
      `<path d="M${r1(cx)} ${r1(cy)} Q${r1(milieu[0])} ${r1(milieu[1])} ${r1(bout[0])} ${r1(bout[1])}" stroke="${C.feuillageFonce}" stroke-width="6" fill="none"/>`
  }
  // Les noix de coco.
  for (const [dx, dy] of [
    [-12, 10],
    [12, 12],
    [0, 24],
  ]) {
    dessin += `<circle cx="${r1(cx + dx)}" cy="${r1(cy + dy)}" r="14" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="${T - 2}"/>`
  }
  return dessin
}

// Tous les arbres : leur nom de fichier, leur SVG et leur calage pour src/composants/arbres.ts.
export function arbres() {
  const sortes = [
    ['arbre-rond', arbreRond()],
    ['arbre-nuage', arbreNuage()],
    ['arbre-sapin', sapin()],
    ['arbre-buisson', buisson()],
    ['arbre-cerisier', cerisier()],
    ['arbre-automne', automne()],
    ['arbre-palmier', palmier()],
  ]
  return sortes.map(([nom, dessin]) => ({
    nom,
    largeur: LARGEUR,
    hauteur: HAUTEUR,
    pied: PIED,
    largeurPied: LARGEUR_PIED,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" stroke-linejoin="round" stroke-linecap="round">` +
      `<g transform="translate(${PIED.x} ${PIED.y})">${dessin}</g></svg>\n`,
  }))
}
