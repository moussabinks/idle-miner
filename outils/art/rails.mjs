// Les rails du village (25/10), en SVG, dans le style cartoon du jeu : une bande de ballast
// claire à plat sur l'herbe, des traverses en bois et deux rails gris, tous cernés d'encre.
//
// Un rail se pose sur UNE case, mais la voie est large de presque DEUX cases. Deux couches,
// comme les dessine RailsDuVillage (src/composants/DessinsVillage.tsx) :
//
//   1. le BALLAST, à plat sur le sol : des tuiles vues de dessus, de 2 × 2 cases centrées sur la
//      case du rail (3 × 3 pour un virage doux), que le jeu pose en losange et tourne dans le bon
//      sens. Chaque forme a deux images : « talus_<forme>_bord » (la bande, un peu plus large, en
//      encre) et « talus_<forme> » (la bande claire). Le jeu pose d'abord tous les bords, puis
//      toutes les bandes : les bandes de deux cases voisines se fondent, et il ne reste un trait
//      d'encre que tout autour de la voie.
//   2. la VOIE (traverses et rails), dessinée en vue isométrique comme le village : une image
//      par forme de case (« voie_ns », « voie_es », « voie_nes », « voie_fin_n »...), dans le
//      même cadre que le jeu attend (CADRE, et CADRE_DOUX pour les virages doux).
//
// Usage : node outils/art/rails.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DOSSIER = join(RACINE, 'public/images/rails')

// --- La vue (la même que le jeu, voir src/composants/iso.ts) -------------------------------------
const DEMI_LARGEUR = 16.5
const DEMI_HAUTEUR = 9.57
const HAUTEUR_Z = 19.05 // une case de hauteur, en pixels du monde
// Le cadre des images de la voie, en pixels du monde, autour du coin du haut de la case
// (le même que CADRE_VOIE et CADRE_DOUX dans DessinsVillage.tsx).
const CADRE = { x: -35, y: -15, largeur: 70, hauteur: 46 }
const CADRE_DOUX = { x: -42, y: -12, largeur: 84, hauteur: 58 }

// --- La palette ----------------------------------------------------------------------------------
const ENCRE = '#2a2140'
const BALLAST = '#d8cbb0'
const CAILLOU = '#c4b593'
const BOIS = '#c98a55'
const BOIS_FONCE = '#9a6237'
const PLANCHE = '#d69a62'
const METAL = '#b8c0cc'
const METAL_FONCE = '#8d96a5'
const ROUGE = '#ef6b5b'
const ROUGE_FONCE = '#c24f45'
const CREME = '#fdf6e3'

// --- Les dimensions de la voie (en cases) --------------------------------------------------------
const C = 0.5 // le milieu de la case
const D = 0.4 // le demi-écartement des rails
const A = C - D // le rail de gauche (ou du haut)
const B = C + D // le rail de droite (ou du bas)
const R_COIN = 0.1 // l'arrondi des rails en L (embranchements)
const TRAVERSE = { demi: 0.58, courte: 0.52, largeur: 0.14, haut: 0.07 }
const RAIL = { bas: 0.07, haut: 0.17 }
const PAS = [1 / 6, 1 / 2, 5 / 6] // les traverses, à 1/6, 1/2 et 5/6 de la case : sans couture
const LARGEUR_BALLAST = 0.8 // la demi-largeur de la bande de ballast
const BORD = 0.065 // l'épaisseur du trait d'encre autour du ballast

const n = (v) => String(Math.round(v * 100) / 100)

// =================================================================================================
// 1. Le ballast (des tuiles carrées, vues de dessus : 1 unité = 1 case)
// =================================================================================================

// Les formes de la bande, dans une tuile de 2 × 2 cases (la case du rail va de 0,5 à 1,5).
// « e » : de combien on l'élargit (0 pour la bande claire, BORD pour le trait d'encre).
// On peut superposer plusieurs morceaux : ils ont la même couleur, ils se fondent.
function formesBallast(forme, e) {
  const w = LARGEUR_BALLAST + e
  const nordSud = `<rect x="${n(1 - w)}" y="0.5" width="${n(2 * w)}" height="1"/>`
  const brasEst = `<rect x="1" y="${n(1 - w)}" width="0.5" height="${n(2 * w)}"/>`
  const estOuest = `<rect x="0.5" y="${n(1 - w)}" width="1" height="${n(2 * w)}"/>`
  if (forme === 'droit') return nordSud
  if (forme === 't') return nordSud + brasEst
  if (forme === 'croix') return nordSud + estOuest
  if (forme === 'virage') {
    // Un quart de disque autour du coin sud-est de la case (1,5 ; 1,5) : du sud vers l'est.
    const r = 0.5 + w
    return `<path d="M1.5 1.5L1.5 ${n(1.5 - r)}A${n(r)} ${n(r)} 0 0 0 ${n(1.5 - r)} 1.5Z"/>`
  }
  // Le virage doux, dans une tuile de 3 × 3 cases : un anneau de rayon 1,5 autour de (2,5 ; 2,5).
  const grand = 1.5 + w
  const petit = 1.5 - w
  return `<path d="M2.5 ${n(2.5 - grand)}A${n(grand)} ${n(grand)} 0 0 0 ${n(2.5 - grand)} 2.5L${n(2.5 - petit)} 2.5A${n(petit)} ${n(petit)} 0 0 1 2.5 ${n(2.5 - petit)}Z"/>`
}

// Quelques petits cailloux sur la bande, toujours les mêmes (un hasard « fixé »), jamais près
// des bords de la case : là où les tuiles se raccordent.
function hasardFixe(graine) {
  let x = graine
  return () => {
    x = (x * 16807) % 2147483647
    return x / 2147483647
  }
}

function cailloux(forme, taille) {
  const hasard = hasardFixe(7 + forme.length * 31)
  const dans = (u, v) => {
    if (forme === 'doux') {
      const r = Math.hypot(u - 2.5, v - 2.5)
      return u < 2.42 && v < 2.42 && Math.abs(r - 1.5) < LARGEUR_BALLAST - 0.1
    }
    const loin = u > 0.58 && u < 1.42 && v > 0.58 && v < 1.42 // pas sur les bords de la case
    if (forme === 'virage') return loin && Math.hypot(u - 1.5, v - 1.5) < 0.5 + LARGEUR_BALLAST - 0.1
    return loin
  }
  let texte = ''
  for (let k = 0, poses = 0; k < 400 && poses < (forme === 'doux' ? 26 : 9); k++) {
    const u = hasard() * taille
    const v = hasard() * taille
    if (!dans(u, v)) continue
    poses++
    texte += `<ellipse cx="${n(u)}" cy="${n(v)}" rx="${n(0.035 + hasard() * 0.025)}" ry="${n(0.03 + hasard() * 0.02)}"/>`
  }
  return texte
}

function tuileBallast(forme, bord) {
  const taille = forme === 'doux' ? 3 : 2
  const corps = bord
    ? `<g fill="${ENCRE}">${formesBallast(forme, BORD)}</g>`
    : `<g fill="${BALLAST}">${formesBallast(forme, 0)}</g><g fill="${CAILLOU}">${cailloux(forme, taille)}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${taille} ${taille}" width="${taille * 100}" height="${taille * 100}" preserveAspectRatio="none">${corps}</svg>\n`
}

// =================================================================================================
// 2. La voie, en vue isométrique
// =================================================================================================

// Un point de la case (x vers l'est, y vers le sud, z vers le haut, en cases) → l'image.
const versImage = (x, y, z) => ({ x: (x - y) * DEMI_LARGEUR, y: (x + y) * DEMI_HAUTEUR - z * HAUTEUR_Z })
const point = (p) => `${n(p.x)},${n(p.y)}`

// Un modèle : des boîtes (traverses, planches, butoirs) et des rails (des lignes au sol).
// On le construit dans la position « de base », puis on le tourne d'un quart de tour à la fois.
function nouveauModele() {
  return { boites: [], rails: [], hautes: [], disques: [] }
}

// Une boîte posée à plat, tournée de « angle » (sa longueur le long de cet angle).
function boite(liste, cx, cy, angle, long, large, bas, haut, dessus, cote) {
  const ca = Math.cos(angle)
  const sa = Math.sin(angle)
  const coins = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sl, sw]) => {
    const l = (sl * long) / 2
    const w = (sw * large) / 2
    return [cx + l * ca - w * sa, cy + l * sa + w * ca]
  })
  liste.push({ coins, bas, haut, dessus, cote })
}

function traverse(m, cx, cy, angle, demi = TRAVERSE.demi) {
  boite(m.boites, cx, cy, angle, 2 * demi, TRAVERSE.largeur, 0, TRAVERSE.haut, BOIS, BOIS_FONCE)
}

const droite = (a, b, nb = 2) => Array.from({ length: nb }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / (nb - 1), a[1] + ((b[1] - a[1]) * i) / (nb - 1)])
const arc = (centre, rayon, a0, a1, nb = 24) => Array.from({ length: nb }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / (nb - 1)
  return [centre[0] + rayon * Math.cos(a), centre[1] + rayon * Math.sin(a)]
})
const joindre = (...morceaux) => morceaux.flat().filter((p, i, t) => i === 0 || Math.hypot(p[0] - t[i - 1][0], p[1] - t[i - 1][1]) > 1e-6)

const H = Math.PI / 2
// Les rails en L des embranchements (un petit arrondi dans chaque coin).
const coinNE = () => joindre(droite([B, 0], [B, A - R_COIN]), arc([B + R_COIN, A - R_COIN], R_COIN, Math.PI, H, 8), droite([B + R_COIN, A], [1, A]))
const coinSE = () => joindre(droite([1, B], [B + R_COIN, B]), arc([B + R_COIN, B + R_COIN], R_COIN, -H, -Math.PI, 8), droite([B, B + R_COIN], [B, 1]))
const coinNO = () => joindre(droite([0, A], [A - R_COIN, A]), arc([A - R_COIN, A - R_COIN], R_COIN, H, 0, 8), droite([A, A - R_COIN], [A, 0]))
const coinSO = () => joindre(droite([A, 1], [A, B + R_COIN]), arc([A - R_COIN, B + R_COIN], R_COIN, 0, -H, 8), droite([A - R_COIN, B], [0, B]))

// Le plancher au centre d'un embranchement : trois grosses planches.
function plancher(m) {
  const c = D + 0.1
  for (const k of [-1, 0, 1]) boite(m.boites, C, C + k * ((2 * c) / 3), 0, 2 * c, (2 * c) / 3 - 0.02, 0, TRAVERSE.haut, PLANCHE, BOIS_FONCE)
}

// Un butoir au bout de la voie (au nord de la case) : deux poteaux en bois et une grosse poutre
// rouge à bandes blanches, avec deux tampons tournés vers la voie.
function butoir(m) {
  const v = 0.1
  boite(m.boites, C, v + 0.03, 0, 1.24, 0.24, 0, TRAVERSE.haut + 0.01, BOIS, BOIS_FONCE)
  for (const u of [A, B]) boite(m.hautes, u, v, 0, 0.12, 0.12, TRAVERSE.haut, 0.44, BOIS, BOIS_FONCE)
  boite(m.hautes, C, v, 0, 2 * D + 0.32, 0.14, 0.27, 0.45, ROUGE, ROUGE_FONCE, true)
  for (const u of [A, B]) m.disques.push({ x: u, y: v + 0.09, z: 0.36 })
}

function modeleDeBase(forme) {
  const m = nouveauModele()
  if (forme === 'droit') {
    for (const v of PAS) traverse(m, C, v, 0)
    m.rails.push(droite([A, 0], [A, 1]), droite([B, 0], [B, 1]))
  } else if (forme === 'virage') {
    // Du sud vers l'est, autour du coin sud-est de la case.
    for (let k = 0; k < 3; k++) {
      const a = Math.PI + (H * (k + 0.5)) / 3
      traverse(m, 1 + 0.5 * Math.cos(a), 1 + 0.5 * Math.sin(a), a)
    }
    m.rails.push(arc([1, 1], 0.5 - D, Math.PI, 1.5 * Math.PI, 8), arc([1, 1], 0.5 + D, Math.PI, 1.5 * Math.PI, 28))
  } else if (forme === 'doux') {
    // Le virage doux, dans un carré de 2 × 2 cases : un quart de cercle de rayon 1,5 autour de
    // (2, 2), du bas de la case du sud au bout de la case de l'est. Sept traverses.
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (H * (k + 0.5)) / 7
      traverse(m, 2 + 1.5 * Math.cos(a), 2 + 1.5 * Math.sin(a), a)
    }
    m.rails.push(arc([2, 2], 1.5 - D, Math.PI, 1.5 * Math.PI, 40), arc([2, 2], 1.5 + D, Math.PI, 1.5 * Math.PI, 56))
  } else if (forme === 'fin' || forme === 'seul') {
    // Un bout de ligne : un butoir au nord (et aussi au sud pour un rail tout seul).
    const seul = forme === 'seul'
    for (const v of seul ? [PAS[1]] : PAS.slice(1)) traverse(m, C, v, 0)
    const fin = seul ? 0.73 : 1
    m.rails.push(droite([A, 0.27], [A, fin]), droite([B, 0.27], [B, fin]))
    butoir(m)
    if (seul) {
      const sud = nouveauModele()
      butoir(sud)
      demiTour(sud)
      m.boites.push(...sud.boites)
      m.hautes.push(...sud.hautes)
      m.disques.push(...sud.disques)
    }
  } else if (forme === 't') {
    // La ligne nord – sud, et l'embranchement vers l'est.
    traverse(m, C, PAS[0], 0, TRAVERSE.courte)
    traverse(m, C, PAS[2], 0, TRAVERSE.courte)
    traverse(m, PAS[2], C, H, TRAVERSE.courte)
    plancher(m)
    m.rails.push(droite([A, 0], [A, 1]), coinNE(), coinSE())
  } else {
    // Le croisement : quatre rails en L (les rails ne se croisent jamais).
    traverse(m, C, PAS[0], 0, TRAVERSE.courte)
    traverse(m, C, PAS[2], 0, TRAVERSE.courte)
    traverse(m, PAS[0], C, H, TRAVERSE.courte)
    traverse(m, PAS[2], C, H, TRAVERSE.courte)
    plancher(m)
    m.rails.push(coinNE(), coinSE(), coinNO(), coinSO())
  }
  return m
}

// Tourner tout le modèle autour du centre de la vue (un quart de tour : nord → est → sud → ouest).
function transformer(m, f) {
  for (const b of [...m.boites, ...m.hautes]) b.coins = b.coins.map(f)
  m.rails = m.rails.map((r) => r.map(f))
  m.disques = m.disques.map((d) => {
    const [x, y] = f([d.x, d.y])
    return { ...d, x, y }
  })
}
function quartDeTour(m, centre) {
  transformer(m, ([x, y]) => [centre - (y - centre), centre + (x - centre)])
}
function demiTour(m) {
  transformer(m, ([x, y]) => [1 - x, 1 - y])
}

// --- Le dessin ------------------------------------------------------------------------------------

// Une boîte : ses côtés tournés vers nous (plus foncés), puis son dessus.
function dessinBoite(b, rayures = false) {
  const bas = b.coins.map(([x, y]) => versImage(x, y, b.bas))
  const haut = b.coins.map(([x, y]) => versImage(x, y, b.haut))
  const centre = b.coins.reduce((s, [x, y]) => [s[0] + x / 4, s[1] + y / 4], [0, 0])
  let texte = ''
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    // La face se voit si elle regarde vers l'est ou le sud (vers la caméra).
    const mx = (b.coins[i][0] + b.coins[j][0]) / 2 - centre[0]
    const my = (b.coins[i][1] + b.coins[j][1]) / 2 - centre[1]
    if (mx + my <= 1e-6) continue
    texte += `<polygon points="${[bas[i], bas[j], haut[j], haut[i]].map(point).join(' ')}" fill="${b.cote}"/>`
    // Les bandes blanches de la poutre du butoir.
    if (rayures) {
      for (let k = 1; k < 6; k += 2) {
        const t0 = k / 6
        const t1 = (k + 1) / 6
        const mix = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t })
        texte += `<polygon points="${[mix(bas[i], bas[j], t0), mix(bas[i], bas[j], t0 + 0.08), mix(haut[i], haut[j], t1), mix(haut[i], haut[j], t1 - 0.08)].map(point).join(' ')}" fill="${CREME}" stroke="none"/>`
      }
    }
  }
  texte += `<polygon points="${haut.map(point).join(' ')}" fill="${b.dessus}"/>`
  return `<g stroke="${ENCRE}" stroke-width="0.8">${texte}</g>`
}

const profondeur = (b) => b.coins.reduce((s, [x, y]) => s + x + y, 0) / 4

// Un rail : un trait d'encre épais, puis l'acier foncé (le côté) et l'acier clair (le dessus).
function dessinRails(rails) {
  const ligne = (r, z) => r.map(([x, y]) => point(versImage(x, y, z))).join(' ')
  let encre = ''
  let acier = ''
  for (const r of rails) {
    encre += `<polyline points="${ligne(r, RAIL.bas)}"/><polyline points="${ligne(r, RAIL.haut)}"/>`
    acier += `<polyline points="${ligne(r, RAIL.bas + 0.025)}" stroke="${METAL_FONCE}"/><polyline points="${ligne(r, RAIL.haut)}" stroke="${METAL}"/>`
  }
  return (
    `<g fill="none" stroke-linejoin="round" stroke-linecap="butt">` +
    `<g stroke="${ENCRE}" stroke-width="2.5">${encre}</g>` +
    `<g stroke-width="1">${acier}</g></g>`
  )
}

function dessinModele(m) {
  const boites = [...m.boites].sort((a, b) => profondeur(a) - profondeur(b)).map((b) => dessinBoite(b)).join('')
  const hautes = [...m.hautes].sort((a, b) => profondeur(a) - profondeur(b)).map((b) => dessinBoite(b, b.dessus === ROUGE)).join('')
  const disques = m.disques
    .map((d) => {
      const p = versImage(d.x, d.y, d.z)
      return `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="1.9" ry="1.6" fill="${METAL}" stroke="${ENCRE}" stroke-width="0.8"/>`
    })
    .join('')
  return boites + dessinRails(m.rails) + hautes + disques
}

function imageVoie(m, cadre) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cadre.x} ${cadre.y} ${cadre.largeur} ${cadre.hauteur}" width="${cadre.largeur * 4}" height="${cadre.hauteur * 4}">` +
    `<g stroke-linejoin="round">${dessinModele(m)}</g></svg>\n`
  )
}

// Les côtés de chaque forme de base, et comment on obtient les autres en tournant.
const COTES_DE_BASE = { droit: 'ns', virage: 'se', t: 'nse', croix: 'nseo' }
const QUART = { n: 'e', e: 's', s: 'o', o: 'n' }
const codeDe = (cotes) => [...'neso'].filter((c) => cotes.has(c)).join('')

function toutesLesFormes() {
  // Les 11 formes d'une case : le nom du fichier → (forme de base, quarts de tour).
  const formes = {}
  for (const [base, cotes] of Object.entries(COTES_DE_BASE)) {
    let c = new Set(cotes)
    for (let k = 0; k < 4; k++) {
      const code = codeDe(c)
      if (!(code in formes)) formes[code] = { base, quarts: k }
      c = new Set([...c].map((x) => QUART[x]))
    }
  }
  // Les bouts de ligne (le butoir du côté où la voie s'arrête) et le rail tout seul.
  ;['n', 'e', 's', 'o'].forEach((cote, k) => (formes[`fin_${cote}`] = { base: 'fin', quarts: k }))
  formes.seul_ns = { base: 'seul', quarts: 0 }
  return formes
}

function ecrire(nom, texte) {
  mkdirSync(DOSSIER, { recursive: true })
  writeFileSync(join(DOSSIER, nom), texte)
  console.log('écrit', `public/images/rails/${nom}`)
}

for (const forme of ['droit', 'virage', 't', 'croix', 'doux']) {
  ecrire(`talus_${forme}.svg`, tuileBallast(forme, false))
  ecrire(`talus_${forme}_bord.svg`, tuileBallast(forme, true))
}
for (const [code, { base, quarts }] of Object.entries(toutesLesFormes())) {
  const m = modeleDeBase(base)
  for (let k = 0; k < quarts; k++) quartDeTour(m, C)
  ecrire(`voie_${code}.svg`, imageVoie(m, CADRE))
}
// Les virages doux : le coin du carré et ses deux bras (es : la forme de base, puis tournée).
;['es', 'so', 'no', 'ne'].forEach((code, k) => {
  const m = modeleDeBase('doux')
  for (let i = 0; i < k; i++) quartDeTour(m, 1)
  ecrire(`voie_doux_${code}.svg`, imageVoie(m, CADRE_DOUX))
})
