// Le paysage autour de la clairière (25/10) : au-delà de la rangée d'arbres qui entoure le terrain,
// des collines vertes et des montagnes cartoon, avec de la neige au sommet. Dans les montagnes, des
// filons de minerais (or, diamant, émeraude, redstone : les mêmes formes que les icônes du jeu),
// des grappes de cristaux, une cascade qui tombe dans un petit bassin et l'entrée d'une galerie de
// mine avec ses rails et son wagonnet.
//
// Chaque dessin est une « vignette » (comme un arbre) : le jeu les plante tout autour de la
// clairière et les dessine dans ses « toiles » (src/composants/ForetVillage.tsx et paysage.ts).
// Les dessins sont faits 2 fois plus grands que le monde du jeu (comme les bâtiments).
//
// Le style : des aplats (le côté gauche éclairé, le côté droit à l'ombre, la lumière vient d'en haut
// à gauche), un contour bleu nuit épais sur le dessus des formes. Le pied des collines et des
// montagnes n'a pas de contour : elles sortent du sol, elles ne sont pas posées dessus.

import { C, TRAIT, TRAIT_FIN, clair, fonce, hasardAvecGraine, minerai, r1, rocher } from './formes.mjs'
import { courbeRonde } from './mine.mjs'
import { arbreRond, buisson, sapin } from './arbres.mjs'

// Les couleurs du paysage.
const ROCHE = '#b9b4d6' // la roche éclairée (un gris lilas, qui va bien avec l'herbe et l'encre)
const ROCHE_OMBRE = '#918ab8' // la roche à l'ombre
const ROCHE_FILON = '#6c6592' // le fond sombre d'un filon de minerais
const NEIGE = '#ffffff'
const NEIGE_OMBRE = '#d3def3'
const HERBE = '#99d775' // l'herbe des collines et du bas des montagnes, éclairée
const HERBE_OMBRE = '#76bd59' // et à l'ombre
const EAU = '#8cc8f5'
const EAU_CLAIRE = '#c4e6fb'
const NUIT = '#3a3150' // le fond de la galerie

// Une liste de points → « x,y x,y ... ».
const liste = (pts) => pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')
// Une courbe toute ronde qui continue un chemin déjà commencé (sans « M » au début).
const suiteRonde = (pts) => courbeRonde(pts).replace(/^M/, 'L')
const entre = (a, b, t) => a + (b - a) * t

// Un dessin en cours : ses morceaux, ses définitions (clipPath) et un compteur pour leurs noms.
class Vignette {
  constructor(nom) {
    this.nom = nom
    this.morceaux = []
    this.defs = []
    this.nbIds = 0
  }
  ajouter(svg) {
    this.morceaux.push(svg)
  }
  nouvelId(prefixe) {
    this.nbIds += 1
    return `${this.nom}-${prefixe}${this.nbIds}`
  }
  // Un « clipPath » fait de ces chemins ; renvoie son nom.
  decoupe(chemins) {
    const id = this.nouvelId('d')
    this.defs.push(`<clipPath id="${id}">${chemins.map((d) => `<path d="${d}"/>`).join('')}</clipPath>`)
    return id
  }
  // Le fichier SVG : le dessin est fait autour de son pied (0, 0) ; on le décale dans son cadre.
  // cadre : { x0, y0, x1, y1 } autour du pied.
  svg(cadre) {
    const largeur = Math.round(cadre.x1 - cadre.x0)
    const hauteur = Math.round(cadre.y1 - cadre.y0)
    const pied = { x: r1(-cadre.x0), y: r1(-cadre.y0) }
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''
    return {
      nom: this.nom,
      largeur,
      hauteur,
      pied,
      svg:
        `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}" stroke-linejoin="round" stroke-linecap="round">` +
        `${defs}<g transform="translate(${pied.x} ${pied.y})">${this.morceaux.join('')}</g></svg>\n`,
    }
  }
}

// ---------------------------------------------------------------------------
// Les petits détails
// ---------------------------------------------------------------------------

// Un cristal à plat (une pointe à six côtés), son pied en (x, y), penché de « angle » degrés : la
// moitié gauche claire, la droite sombre, un reflet blanc.
function cristal(x, y, longueur, largeur, angle, couleur) {
  const l = largeur / 2
  const gauche = [
    [-l, 0],
    [-l, -longueur * 0.72],
    [0, -longueur],
    [0, 0],
  ]
  const droite = [
    [0, 0],
    [0, -longueur],
    [l, -longueur * 0.72],
    [l, 0],
  ]
  const tout = [
    [-l, 4],
    [-l, -longueur * 0.72],
    [0, -longueur],
    [l, -longueur * 0.72],
    [l, 4],
  ]
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})">` +
    `<polygon points="${liste(gauche)}" fill="${clair(couleur, 0.35)}"/>` +
    `<polygon points="${liste(droite)}" fill="${fonce(couleur, 0.22)}"/>` +
    `<path d="M${r1(-l * 0.45)} ${r1(-longueur * 0.15)} L${r1(-l * 0.45)} ${r1(-longueur * 0.62)}" stroke="#ffffff" stroke-width="4" opacity="0.85"/>` +
    `<polygon points="${liste(tout)}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>` +
    `</g>`
  )
}

// Une grappe de trois cristaux qui sortent de la roche, en (x, y) ; k : la taille.
function grappe(x, y, couleur, k = 1) {
  return cristal(x - 16 * k, y, 38 * k, 18 * k, -28, couleur) + cristal(x + 16 * k, y + 2 * k, 34 * k, 17 * k, 30, couleur) + cristal(x, y + 2 * k, 56 * k, 24 * k, 4, couleur)
}

// Une étincelle (une étoile à quatre branches).
function etincelle(x, y, k = 1) {
  const p = (dx, dy) => `${r1(x + dx * k)} ${r1(y + dy * k)}`
  return `<path d="M${p(0, -11)} L${p(3, -3)} L${p(11, 0)} L${p(3, 3)} L${p(0, 11)} L${p(-3, 3)} L${p(-11, 0)} L${p(-3, -3)} Z" fill="#ffffff" stroke="${C.encre}" stroke-width="3"/>`
}

// Un filon : une veine de roche sombre qui traverse la paroi (un peu penchée), d'où sortent deux
// ou trois minerais bien gros, pour qu'on les reconnaisse de loin.
function filon(x, y, sortes, k = 1, graine = 1) {
  const hasard = hasardAvecGraine(graine)
  const angle = -18 + hasard() * 22
  const l = 62 * k
  const veine = `M${-l} ${r1(8 * k)} Q${r1(-l * 0.3)} ${r1(-14 * k)} 0 0 T${l} ${r1(-6 * k)}`
  let dessin =
    `<path d="${veine}" stroke="${C.encre}" stroke-width="${r1(22 * k + 2 * TRAIT_FIN)}" fill="none"/>` +
    `<path d="${veine}" stroke="${ROCHE_FILON}" stroke-width="${r1(22 * k)}" fill="none"/>`
  const places = [
    [-34, 0, 38],
    [8, -4, 42],
    [44, -6, 34],
  ]
  sortes.forEach((sorte, i) => {
    const [dx, dy, taille] = places[i % places.length]
    dessin += minerai(sorte, dx * k, dy * k, taille * k, (hasard() - 0.5) * 50, 4)
  })
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})">${dessin}</g>`
}

// Une petite fissure dans la roche (un « v » couché).
function fissure(x, y, k = 1, couleur = fonce(ROCHE_OMBRE, 0.25)) {
  return `<path d="M${r1(x - 14 * k)} ${r1(y - 6 * k)} L${r1(x)} ${r1(y)} L${r1(x + 10 * k)} ${r1(y - 9 * k)} M${r1(x)} ${r1(y)} L${r1(x + 4 * k)} ${r1(y + 10 * k)}" stroke="${couleur}" stroke-width="4" fill="none"/>`
}

// Une touffe d'herbe (trois brins).
function touffe(x, y, k = 1, couleur = HERBE_OMBRE) {
  const p = (dx, dy) => `${r1(x + dx * k)} ${r1(y + dy * k)}`
  return `<path d="M${p(-8, 0)} Q${p(-9, -8)} ${p(-13, -13)} M${p(0, 0)} Q${p(0, -10)} ${p(1, -17)} M${p(8, 0)} Q${p(9, -8)} ${p(14, -12)}" stroke="${couleur}" stroke-width="4" fill="none"/>`
}

// Une fleur (un rond de couleur, le cœur orange).
function fleur(x, y, couleur) {
  return `<circle cx="${r1(x)}" cy="${r1(y)}" r="5.5" fill="${couleur}" stroke="${C.encre}" stroke-width="2.5"/><circle cx="${r1(x)}" cy="${r1(y)}" r="2" fill="${C.orange}"/>`
}

// Un arbre de la forêt (arbres.mjs, dessiné dans un cadre de 360 × 460), en petit : son pied en (x, y).
const petitArbre = (dessin, x, y, k) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${k})">${dessin}</g>`

// ---------------------------------------------------------------------------
// Une montagne
// ---------------------------------------------------------------------------

// Une montagne vue du ciel, en biais : une silhouette de pics (pics : [{ x en part de la largeur,
// h en pixels }]), chaque pic coupé par une arête (à gauche la face éclairée, à droite celle à
// l'ombre), de la neige en haut (neige : la part de la hauteur), de l'herbe en bas (herbe : en
// pixels). Renvoie aussi des fonctions pour savoir où est la roche (pour y poser des filons).
function montagne(v, { largeur: W, pics, graine, neige = 0.34, herbe = 70 }) {
  const hasard = hasardAvecGraine(graine)
  const bruit = (a) => (hasard() - 0.5) * 2 * a
  // Le pied de la montagne, vu en biais : une courbe qui avance vers nous au milieu.
  const bas = (x) => W * 0.07 * Math.max(0, 1 - ((2 * x) / W) ** 2)
  const tries = [...pics].sort((a, b) => a.x - b.x).map((p) => ({ x: p.x * W, h: p.h }))

  // La silhouette, de gauche à droite.
  const silhouette = [[-W / 2, 0]]
  const sommets = [] // l'indice de chaque pic dans la silhouette
  const vallees = [] // l'indice du creux après chaque pic (ou du pied de droite)
  tries.forEach((pic, i) => {
    const [x0, y0] = silhouette[silhouette.length - 1]
    // la pente qui monte : deux épaulements un peu cabossés
    for (const t of [0.38, 0.7]) {
      silhouette.push([entre(x0, pic.x, t) + bruit(W * 0.015), entre(y0, -pic.h, t ** 0.85) + bruit(pic.h * 0.04)])
    }
    sommets.push(silhouette.length)
    silhouette.push([pic.x, -pic.h])
    const suivant = tries[i + 1]
    if (suivant) {
      const vx = (pic.x + suivant.x) / 2 + bruit(W * 0.02)
      const vy = -Math.min(pic.h, suivant.h) * (0.5 + hasard() * 0.1)
      silhouette.push([entre(pic.x, vx, 0.5) + bruit(W * 0.01), entre(-pic.h, vy, 0.55)])
      vallees.push(silhouette.length)
      silhouette.push([vx, vy])
    } else {
      for (const t of [0.32, 0.66]) {
        silhouette.push([entre(pic.x, W / 2, t) + bruit(W * 0.015), entre(-pic.h, 0, t ** 1.15) + bruit(pic.h * 0.04)])
      }
      vallees.push(silhouette.length)
      silhouette.push([W / 2, 0])
    }
  })
  // Le contour complet (la silhouette, puis le pied qui revient vers la gauche).
  const pied = []
  for (let k = 1; k < 12; k++) {
    const x = W / 2 - (k / 12) * W
    pied.push([x, bas(x)])
  }
  const forme = `M${liste(silhouette).replace(/ /g, ' L')} L${liste(pied).replace(/ /g, ' L')} Z`

  // Les faces à l'ombre : pour chaque pic, de l'arête (qui descend du sommet un peu vers la
  // droite) jusqu'au creux suivant, puis le pli qui redescend du creux jusqu'au pied.
  const ombres = []
  const aretes = []
  tries.forEach((pic, i) => {
    const arete = [
      [pic.x, -pic.h],
      [pic.x + W * 0.045 + bruit(W * 0.01), -pic.h * 0.62],
      [pic.x + W * 0.015 + bruit(W * 0.01), -pic.h * 0.3],
    ]
    const xPied = pic.x + W * 0.05
    arete.push([xPied, bas(xPied)])
    aretes.push(arete)
    const versLeCreux = silhouette.slice(sommets[i], vallees[i] + 1)
    const [vx, vy] = silhouette[vallees[i]]
    const pli = vallees[i] === silhouette.length - 1 ? [] : [[vx - W * 0.01, entre(vy, bas(vx), 0.5)], [vx + W * 0.01, bas(vx)]]
    const piedOmbre = []
    const xFin = pli.length ? pli[pli.length - 1][0] : W / 2
    for (let k = 1; k < 6; k++) {
      const x = entre(xFin, xPied, k / 6)
      piedOmbre.push([x, bas(x)])
    }
    const contour = [...versLeCreux, ...pli, ...piedOmbre, ...arete.slice().reverse()]
    ombres.push(`M${liste(contour).replace(/ /g, ' L')} Z`)
  })

  const silh = v.decoupe([forme])
  const ombre = v.decoupe(ombres)
  v.ajouter(`<path d="${forme}" fill="${ROCHE}"/>`)
  v.ajouter(`<g clip-path="url(#${silh})">${ombres.map((d) => `<path d="${d}" fill="${ROCHE_OMBRE}"/>`).join('')}</g>`)

  // L'herbe du bas : une bande qui monte un peu en langues, plus haute par endroits.
  const haut = Math.max(...tries.map((p) => p.h))
  const herbeBord = []
  for (let k = 0; k <= 16; k++) {
    const x = -W / 2 - 10 + (k / 16) * (W + 20)
    herbeBord.push([x, -herbe * (0.55 + hasard() * 0.6) * (k % 2 ? 1 : 0.6)])
  }
  const formeHerbe = `M${r1(-W / 2 - 20)} ${r1(W * 0.2)} ${suiteRonde(herbeBord)} L${r1(W / 2 + 20)} ${r1(W * 0.2)} Z`
  v.ajouter(`<g clip-path="url(#${silh})"><path d="${formeHerbe}" fill="${HERBE}" stroke="${fonce(HERBE_OMBRE, 0.15)}" stroke-width="${TRAIT_FIN}"/></g>`)
  v.ajouter(`<g clip-path="url(#${ombre})"><path d="${formeHerbe}" fill="${HERBE_OMBRE}" stroke="${fonce(HERBE_OMBRE, 0.15)}" stroke-width="${TRAIT_FIN}"/></g>`)

  // La neige : pour chaque pic, un bonnet blanc qui coule en gouttes sous le sommet, de son creux
  // de gauche à son creux de droite.
  tries.forEach((pic, i) => {
    if (neige <= 0) return
    const ligne = -pic.h * (1 - neige * (0.85 + hasard() * 0.3))
    const xg = i === 0 ? -W / 2 - 20 : silhouette[vallees[i - 1]][0]
    const xd = i === tries.length - 1 ? W / 2 + 20 : silhouette[vallees[i]][0]
    const gouttes = []
    const n = Math.max(4, Math.round((xd - xg) / 46))
    for (let k = 0; k <= n; k++) {
      const x = entre(xd, xg, k / n)
      const goutte = k % 2 ? pic.h * neige * (0.25 + hasard() * 0.3) : bruit(6)
      gouttes.push([x, ligne + goutte])
    }
    const bonnet = `M${r1(xg)} ${r1(-pic.h - 60)} L${r1(xd)} ${r1(-pic.h - 60)} ${suiteRonde(gouttes)} Z`
    v.ajouter(`<g clip-path="url(#${silh})"><path d="${bonnet}" fill="${NEIGE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/></g>`)
    v.ajouter(`<g clip-path="url(#${ombre})"><path d="${bonnet}" fill="${NEIGE_OMBRE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/></g>`)
  })

  // L'arête de chaque pic, un trait fin (seulement en haut : plus bas, le changement de teinte suffit).
  for (const arete of aretes) {
    v.ajouter(`<path d="M${liste(arete.slice(0, 3)).replace(/ /g, ' L')}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}" fill="none" opacity="0.55"/>`)
  }

  // Où peut-on poser un filon ? Dans la roche : sous la neige, au-dessus de l'herbe, dans la forme.
  const contour = [...silhouette, ...pied]
  const dedans = (x, y) => {
    let oui = false
    for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
      const [xi, yi] = contour[i]
      const [xj, yj] = contour[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) oui = !oui
    }
    return oui
  }
  return {
    // le contour d'encre : seulement le dessus (la silhouette), pas le pied
    finir: () => v.ajouter(`<path d="M${liste(silhouette).replace(/ /g, ' L')}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`),
    dedans,
    haut,
    bas,
    silhouette,
  }
}

// Les filons, les cristaux et les fissures d'une montagne. places : [x, y, sortes, k] (en pixels,
// autour du pied), cristaux : [x, y, couleur, k].
function decorerRoche(v, m, { filons = [], cristaux = [], fissures = [], graine = 3 }) {
  filons.forEach(([x, y, sortes, k = 1], i) => {
    v.ajouter(filon(x, y, sortes, k, graine + i))
    if (i % 2 === 0) v.ajouter(etincelle(x + 26 * k, y - 22 * k, 0.8 * k))
  })
  for (const [x, y, k = 1] of fissures) v.ajouter(fissure(x, y, k))
  for (const [x, y, couleur, k = 1] of cristaux) {
    v.ajouter(grappe(x, y, couleur, k))
    v.ajouter(etincelle(x + 24 * k, y - 50 * k, 0.9 * k))
  }
}

// Quelques sapins et rochers au pied d'une montagne (sur l'herbe du bas).
function piedDeMontagne(v, places) {
  for (const [sorte, x, y, k] of places) {
    if (sorte === 'sapin') v.ajouter(petitArbre(sapin(), x, y, k))
    else if (sorte === 'rond') v.ajouter(petitArbre(arbreRond(), x, y, k))
    else if (sorte === 'rocher') v.ajouter(rocher(x, y, 46 * k, 34 * k, Math.round(x + y), ROCHE, TRAIT_FIN))
  }
}

// ---------------------------------------------------------------------------
// Les montagnes
// ---------------------------------------------------------------------------

function montagneGeante() {
  const v = new Vignette('montagne-geante')
  const m = montagne(v, {
    largeur: 780,
    graine: 11,
    pics: [
      { x: -0.1, h: 600 },
      { x: 0.27, h: 430 },
    ],
  })
  decorerRoche(v, m, {
    filons: [
      [-160, -200, ['or', 'diamant', 'or']],
      [230, -160, ['redstone', 'redstone'], 0.9],
    ],
    fissures: [
      [-250, -120],
      [120, -260],
      [-110, -380, 0.8],
      [300, -110],
    ],
    cristaux: [[-10, -95, C.violet, 1]],
  })
  m.finir()
  piedDeMontagne(v, [
    ['sapin', -300, 10, 0.32],
    ['sapin', -250, 30, 0.38],
    ['rocher', 150, 40, 1],
    ['sapin', 320, 20, 0.3],
  ])
  return v.svg({ x0: -400, y0: -615, x1: 400, y1: 70 })
}

function montagneGrande() {
  const v = new Vignette('montagne-grande')
  const m = montagne(v, { largeur: 640, graine: 23, pics: [{ x: 0.02, h: 520 }] })
  decorerRoche(v, m, {
    filons: [
      [-100, -180, ['diamant', 'or', 'diamant']],
    ],
    fissures: [
      [-190, -90],
      [70, -120],
      [170, -90, 0.8],
    ],
  })
  m.finir()
  piedDeMontagne(v, [
    ['sapin', -230, 18, 0.34],
    ['rocher', 60, 40, 0.9],
    ['sapin', 240, 16, 0.3],
  ])
  return v.svg({ x0: -330, y0: -535, x1: 330, y1: 60 })
}

function montagneDouble() {
  const v = new Vignette('montagne-double')
  const m = montagne(v, {
    largeur: 720,
    graine: 37,
    pics: [
      { x: -0.22, h: 420 },
      { x: 0.18, h: 500 },
    ],
  })
  decorerRoche(v, m, {
    filons: [
      [-190, -160, ['emeraude', 'or', 'emeraude']],
      [170, -150, ['redstone', 'diamant'], 0.9],
    ],
    fissures: [
      [-110, -110],
      [140, -280, 0.8],
      [-260, -80],
    ],
    cristaux: [[260, -60, C.diamant, 0.9]],
  })
  m.finir()
  piedDeMontagne(v, [
    ['sapin', -290, 20, 0.34],
    ['rond', -60, 40, 0.28],
    ['sapin', 300, 20, 0.3],
  ])
  return v.svg({ x0: -380, y0: -515, x1: 380, y1: 60 })
}

function montagneMoyenne() {
  const v = new Vignette('montagne-moyenne')
  const m = montagne(v, { largeur: 520, graine: 41, pics: [{ x: -0.05, h: 380 }], neige: 0.3 })
  decorerRoche(v, m, {
    filons: [
      [-80, -150, ['or', 'or', 'emeraude']],
    ],
    fissures: [
      [-160, -80],
      [40, -230, 0.8],
    ],
    cristaux: [[30, -75, C.emeraude, 0.9]],
  })
  m.finir()
  piedDeMontagne(v, [
    ['sapin', -190, 20, 0.32],
    ['rocher', 180, 36, 0.8],
  ])
  return v.svg({ x0: -270, y0: -395, x1: 270, y1: 55 })
}

function montagnePetite() {
  const v = new Vignette('montagne-petite')
  const m = montagne(v, { largeur: 440, graine: 53, pics: [{ x: 0.04, h: 270 }], neige: 0.3, herbe: 60 })
  decorerRoche(v, m, {
    filons: [[-50, -110, ['redstone', 'or'], 0.85]],
    fissures: [[80, -90, 0.8]],
    cristaux: [[110, -70, C.diamant, 0.75]],
  })
  m.finir()
  piedDeMontagne(v, [
    ['sapin', -160, 18, 0.3],
    ['rond', 150, 26, 0.24],
  ])
  return v.svg({ x0: -230, y0: -285, x1: 230, y1: 50 })
}

// La montagne à la cascade : l'eau sort d'une fente de la roche, tombe tout droit jusqu'en bas et
// remplit un petit bassin entouré de rochers. Le jeu fait couler l'eau par-dessus (une petite
// animation, seulement sur la bande d'eau : voir CASCADE dans src/composants/paysage.ts).
function montagneCascade() {
  const v = new Vignette('montagne-cascade')
  const m = montagne(v, {
    largeur: 760,
    graine: 67,
    pics: [
      { x: -0.08, h: 580 },
      { x: 0.28, h: 420 },
    ],
  })
  decorerRoche(v, m, {
    filons: [
      [-250, -150, ['or', 'diamant']],
      [140, -190, ['emeraude', 'redstone', 'emeraude'], 0.9],
    ],
    fissures: [
      [-280, -90],
      [210, -250, 0.8],
      [270, -100],
    ],
  })
  m.finir()
  // La cascade : une bande d'eau verticale, de la fente (en haut) jusqu'au pied.
  const cx = -100
  const largeur = 46
  const haut = -255
  const bas = 18
  const x0 = cx - largeur / 2
  const x1 = cx + largeur / 2
  // la fente d'où sort l'eau
  v.ajouter(`<ellipse cx="${cx}" cy="${haut}" rx="${largeur * 0.75}" ry="16" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // la bande d'eau (un peu plus large en bas), ses bords d'encre et ses traits blancs
  const bande = `M${x0} ${haut} L${x1} ${haut} L${x1 + 6} ${bas} L${x0 - 6} ${bas} Z`
  v.ajouter(`<path d="${bande}" fill="${EAU}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  for (const [dx, y0, y1] of [
    [-12, haut + 20, haut + 90],
    [4, haut + 60, haut + 170],
    [14, haut + 10, haut + 60],
    [-8, haut + 130, haut + 230],
    [12, haut + 200, bas - 20],
  ]) {
    v.ajouter(`<path d="M${cx + dx} ${y0} L${cx + dx} ${y1}" stroke="#ffffff" stroke-width="6"/>`)
  }
  // l'eau qui déborde de la fente
  v.ajouter(`<path d="M${x0 - 4} ${haut + 2} Q${cx} ${haut - 14} ${x1 + 4} ${haut + 2} Q${cx} ${haut + 12} ${x0 - 4} ${haut + 2} Z" fill="${EAU_CLAIRE}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  // le bassin, au pied (rond et plat, vu en biais), avec un reflet et des rochers autour
  const bx = cx + 10
  const by = 52
  v.ajouter(`<ellipse cx="${bx}" cy="${by}" rx="120" ry="42" fill="${EAU}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  v.ajouter(`<ellipse cx="${bx - 6}" cy="${by - 2}" rx="88" ry="26" fill="none" stroke="${EAU_CLAIRE}" stroke-width="5"/>`)
  v.ajouter(`<path d="M${bx + 30} ${by + 14} Q${bx + 55} ${by + 8} ${bx + 75} ${by + 14}" stroke="#ffffff" stroke-width="5" fill="none"/>`)
  // l'écume, en bas de la chute (redessinée aussi par l'animation du jeu)
  for (const [dx, dy, r] of [
    [-30, 22, 18],
    [30, 22, 17],
    [-10, 12, 22],
    [14, 12, 20],
  ]) {
    v.ajouter(`<circle cx="${cx + dx}" cy="${dy}" r="${r}" fill="#ffffff" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  for (const [dx, dy, l, h, g] of [
    [-128, 40, 48, 34, 1],
    [118, 46, 56, 38, 2],
    [-96, 82, 40, 28, 3],
    [86, 86, 44, 30, 4],
  ]) {
    v.ajouter(rocher(bx + dx, by + dy - 20, l, h, g, ROCHE, TRAIT_FIN))
  }
  // un nénuphar
  v.ajouter(`<ellipse cx="${bx + 52}" cy="${by - 6}" rx="14" ry="7" fill="${C.feuillage}" stroke="${C.encre}" stroke-width="3"/><circle cx="${bx + 50}" cy="${by - 10}" r="5" fill="${C.rose}" stroke="${C.encre}" stroke-width="2.5"/>`)
  piedDeMontagne(v, [
    ['sapin', -320, 14, 0.34],
    ['sapin', -280, 34, 0.28],
    ['sapin', 300, 20, 0.32],
    ['rond', 200, 40, 0.26],
  ])
  const cadre = { x0: -390, y0: -595, x1: 390, y1: 125 }
  const vignette = v.svg(cadre)
  // Où est l'eau qui tombe, dans l'image (pour l'animation du jeu) : l'intérieur de la bande.
  vignette.cascade = { x: r1(x0 + 3 - cadre.x0), y: r1(haut + 10 - cadre.y0), largeur: largeur - 6, hauteur: bas - haut - 30 }
  return vignette
}

// La montagne à la galerie : l'entrée d'une mine (un trou noir dans un cadre en bois, une lanterne)
// d'où sortent des rails, avec un wagonnet plein de minerais.
function montagneGrotte() {
  const v = new Vignette('montagne-grotte')
  const m = montagne(v, { largeur: 600, graine: 79, pics: [{ x: 0.12, h: 400 }], neige: 0.32 })
  decorerRoche(v, m, {
    filons: [
      [110, -190, ['diamant', 'or', 'diamant'], 0.9],
    ],
    fissures: [
      [-200, -90],
      [200, -110],
    ],
    cristaux: [[190, -60, C.violet, 0.8]],
  })
  m.finir()
  // L'entrée de la galerie.
  const gx = -70
  const pied = 30
  const l = 64
  const h = 120
  v.ajouter(`<path d="M${gx - l} ${pied} L${gx - l} ${-h + 40} Q${gx - l} ${-h} ${gx} ${-h} Q${gx + l} ${-h} ${gx + l} ${-h + 40} L${gx + l} ${pied} Z" fill="${NUIT}" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  // les rails qui s'enfoncent dans le noir
  v.ajouter(`<path d="M${gx - 30} ${pied} L${gx - 12} ${-30} M${gx + 30} ${pied} L${gx + 12} ${-30}" stroke="#7c7690" stroke-width="5"/>`)
  // le cadre en bois : deux poteaux et une poutre
  const bois = C.bois
  for (const x of [gx - l + 4, gx + l - 18]) {
    v.ajouter(`<rect x="${x - 2}" y="${-h + 30}" width="18" height="${pied + h - 30}" fill="${x < gx ? bois : C.boisFonce}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  }
  v.ajouter(`<rect x="${gx - l - 12}" y="${-h + 16}" width="${2 * l + 24}" height="20" rx="3" fill="${bois}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  v.ajouter(`<circle cx="${gx - l + 2}" cy="${-h + 26}" r="3" fill="${C.encre}"/><circle cx="${gx + l - 2}" cy="${-h + 26}" r="3" fill="${C.encre}"/>`)
  // la lanterne, accrochée à la poutre
  const lx = gx + l + 2
  const ly = -h + 36
  v.ajouter(`<circle cx="${lx}" cy="${ly + 22}" r="22" fill="${C.jaune}" opacity="0.35"/>`)
  v.ajouter(`<path d="M${lx} ${ly} L${lx} ${ly + 9}" stroke="${C.encre}" stroke-width="4"/>`)
  v.ajouter(`<rect x="${lx - 8}" y="${ly + 9}" width="16" height="20" rx="4" fill="${C.jaune}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  v.ajouter(`<path d="M${lx} ${ly + 14} Q${lx + 4} ${ly + 20} ${lx} ${ly + 24} Q${lx - 4} ${ly + 20} ${lx} ${ly + 14} Z" fill="${C.orange}"/>`)
  // les rails qui sortent vers nous : deux rails qui s'écartent, des traverses
  const rail = (t) => [entre(gx - 30, gx - 120, t), entre(pied, pied + 90, t), entre(gx + 30, gx - 20, t), entre(pied, pied + 100, t)]
  for (let k = 0; k <= 4; k++) {
    const [ax, ay, bx, by] = rail(k / 4 - 0.02)
    v.ajouter(`<path d="M${r1(ax - 8)} ${r1(ay)} L${r1(bx + 8)} ${r1(by)}" stroke="${C.encre}" stroke-width="13"/><path d="M${r1(ax - 8)} ${r1(ay)} L${r1(bx + 8)} ${r1(by)}" stroke="${C.boisFonce}" stroke-width="7"/>`)
  }
  const [a0x, a0y, b0x, b0y] = rail(0)
  const [a1x, a1y, b1x, b1y] = rail(1)
  v.ajouter(`<path d="M${a0x} ${a0y} L${r1(a1x)} ${r1(a1y)} M${b0x} ${b0y} L${r1(b1x)} ${r1(b1y)}" stroke="${C.encre}" stroke-width="9"/>`)
  v.ajouter(`<path d="M${a0x} ${a0y} L${r1(a1x)} ${r1(a1y)} M${b0x} ${b0y} L${r1(b1x)} ${r1(b1y)}" stroke="${C.metal}" stroke-width="4"/>`)
  // le wagonnet, à côté des rails, plein de minerais
  const wx = gx + 120
  const wy = 70
  v.ajouter(`<circle cx="${wx - 26}" cy="${wy}" r="11" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/><circle cx="${wx + 26}" cy="${wy}" r="11" fill="${C.charbon}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  for (const [sorte, dx, dy, t, a] of [
    ['or', -22, -54, 28, -20],
    ['diamant', 2, -60, 28, 10],
    ['emeraude', 24, -52, 26, 25],
    ['redstone', -6, -46, 24, 0],
  ]) {
    v.ajouter(minerai(sorte, wx + dx, wy + dy, t, a, 3.5))
  }
  v.ajouter(`<path d="M${wx - 48} ${wy - 46} L${wx + 48} ${wy - 46} L${wx + 38} ${wy - 4} L${wx - 38} ${wy - 4} Z" fill="#7c82a3" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  v.ajouter(`<path d="M${wx + 10} ${wy - 46} L${wx + 48} ${wy - 46} L${wx + 38} ${wy - 4} L${wx + 6} ${wy - 4} Z" fill="#5d6283"/>`)
  v.ajouter(`<path d="M${wx - 48} ${wy - 46} L${wx + 48} ${wy - 46} L${wx + 38} ${wy - 4} L${wx - 38} ${wy - 4} Z" fill="none" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  v.ajouter(`<rect x="${wx - 46}" y="${wy - 36}" width="92" height="8" rx="3" fill="${C.orange}" stroke="${C.encre}" stroke-width="3"/>`)
  v.ajouter(etincelle(wx + 40, wy - 70, 0.9))
  // une pioche posée contre la roche, et un tonneau
  v.ajouter(`<path d="M${gx - 110} ${pied + 10} L${gx - 84} ${-50}" stroke="${C.encre}" stroke-width="12"/><path d="M${gx - 110} ${pied + 10} L${gx - 84} ${-50}" stroke="${C.bois}" stroke-width="6"/>`)
  v.ajouter(`<path d="M${gx - 112} ${-48} Q${gx - 84} ${-70} ${gx - 54} ${-44} Q${gx - 84} ${-58} ${gx - 112} ${-48} Z" fill="${C.metal}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}"/>`)
  piedDeMontagne(v, [
    ['sapin', 230, 20, 0.32],
    ['rocher', -230, 40, 0.9],
  ])
  return v.svg({ x0: -310, y0: -415, x1: 310, y1: 135 })
}

// ---------------------------------------------------------------------------
// Les collines
// ---------------------------------------------------------------------------

// Une colline toute ronde, large de W, haute de H : la teinte à l'ombre en bas à droite, la teinte
// éclairée décalée vers la lumière (comme le feuillage des arbres), un contour sur le dessus.
// Renvoie la hauteur de la colline à chaque x (pour y poser des arbres).
function colline(v, { largeur: W, hauteur: H, graine, bosse = 0 }) {
  const hasard = hasardAvecGraine(graine)
  const dessus = [
    [-W / 2, 0],
    [-W * 0.36, -H * (0.5 + hasard() * 0.1)],
    [-W * 0.16 + bosse, -H * (0.92 + hasard() * 0.08)],
    [W * 0.06 + bosse, -H],
    [W * 0.27, -H * (0.68 + hasard() * 0.1)],
    [W * 0.42, -H * 0.3],
    [W / 2, 0],
  ]
  const piedDevant = H * 0.22
  const forme = `${courbeRonde(dessus)} Q0 ${r1(piedDevant * 2)} ${r1(-W / 2)} 0 Z`
  const decale = dessus.map(([x, y]) => [x - W * 0.07, y - H * 0.16])
  const formeClaire = `${courbeRonde(decale)} Q${r1(-W * 0.07)} ${r1(piedDevant * 2 - H * 0.3)} ${r1(-W / 2 - W * 0.07)} ${r1(-H * 0.16)} Z`
  const id = v.decoupe([forme])
  v.ajouter(`<path d="${forme}" fill="${HERBE_OMBRE}"/>`)
  v.ajouter(`<path d="${formeClaire}" fill="${HERBE}" clip-path="url(#${id})"/>`)
  v.ajouter(`<path d="${courbeRonde(dessus)}" fill="none" stroke="${C.encre}" stroke-width="${TRAIT}"/>`)
  // La hauteur du dessus à l'abscisse x (en suivant les points, à peu près).
  const surface = (x) => {
    for (let i = 0; i < dessus.length - 1; i++) {
      const [xa, ya] = dessus[i]
      const [xb, yb] = dessus[i + 1]
      if (x >= xa && x <= xb) return entre(ya, yb, (x - xa) / (xb - xa))
    }
    return 0
  }
  return { surface, clip: id }
}

// Des détails sur une colline : des touffes, des fleurs, des arbres, des rochers.
// places : [sorte, x, enfoncement, taille].
function garnirColline(v, c, places) {
  for (const [sorte, x, dy = 0, k = 1] of places) {
    const y = c.surface(x) + dy
    if (sorte === 'touffe') v.ajouter(touffe(x, y, k))
    else if (sorte === 'fleur') v.ajouter(fleur(x, y, k))
    else if (sorte === 'sapin') v.ajouter(petitArbre(sapin(), x, y, k))
    else if (sorte === 'rond') v.ajouter(petitArbre(arbreRond(), x, y, k))
    else if (sorte === 'buisson') v.ajouter(petitArbre(buisson(), x, y, k))
    else if (sorte === 'rocher') v.ajouter(rocher(x, y, 44 * k, 30 * k, Math.round(x * 7), ROCHE, TRAIT_FIN))
    else if (sorte === 'pepite') {
      // un rocher d'où dépasse une pépite d'or (ou un autre minerai)
      v.ajouter(rocher(x, y, 50, 36, 9, ROCHE, TRAIT_FIN))
      v.ajouter(minerai(k, x + 8, y - 22, 24, 15, 3))
    }
  }
}

function collineSapins() {
  const v = new Vignette('colline-sapins')
  const c = colline(v, { largeur: 380, hauteur: 116, graine: 5 })
  garnirColline(v, c, [
    ['touffe', -110, 26],
    ['fleur', -60, 40, C.jaune],
    ['sapin', 40, 22, 0.36],
    ['sapin', 100, 30, 0.3],
    ['touffe', 140, 30],
  ])
  return v.svg({ x0: -200, y0: -275, x1: 200, y1: 60 })
}

function collineBuisson() {
  const v = new Vignette('colline-buisson')
  const c = colline(v, { largeur: 300, hauteur: 86, graine: 9, bosse: 10 })
  garnirColline(v, c, [
    ['buisson', -40, 26, 0.26],
    ['fleur', 40, 30, C.rose],
    ['fleur', 70, 38, '#ffffff'],
    ['fleur', -96, 36, C.violet],
    ['touffe', 90, 22],
  ])
  return v.svg({ x0: -160, y0: -170, x1: 160, y1: 50 })
}

function collineGrande() {
  const v = new Vignette('colline-grande')
  const c = colline(v, { largeur: 500, hauteur: 160, graine: 13 })
  garnirColline(v, c, [
    ['sapin', -120, 40, 0.34],
    ['sapin', -70, 22, 0.4],
    ['rond', 30, 26, 0.3],
    ['rocher', 120, 40, 1],
    ['touffe', 170, 40],
    ['fleur', 70, 70, C.jaune],
    ['fleur', -160, 60, C.rose],
  ])
  return v.svg({ x0: -260, y0: -330, x1: 260, y1: 70 })
}

function collinePetite() {
  const v = new Vignette('colline-petite')
  const c = colline(v, { largeur: 240, hauteur: 66, graine: 17 })
  garnirColline(v, c, [
    ['touffe', -60, 18],
    ['pepite', 10, 30, 'or'],
    ['fleur', 70, 22, C.jaune],
  ])
  return v.svg({ x0: -130, y0: -110, x1: 130, y1: 45 })
}

function collineFleurie() {
  const v = new Vignette('colline-fleurie')
  const c = colline(v, { largeur: 340, hauteur: 100, graine: 21, bosse: -16 })
  garnirColline(v, c, [
    ['fleur', -100, 30, C.rose],
    ['fleur', -60, 18, C.jaune],
    ['fleur', -20, 34, '#ffffff'],
    ['fleur', 30, 20, C.violet],
    ['fleur', 80, 34, C.rose],
    ['touffe', 0, 50],
    ['rond', 110, 40, 0.24],
    ['pepite', -40, 64, 'diamant'],
  ])
  return v.svg({ x0: -180, y0: -215, x1: 180, y1: 55 })
}

function collineDouce() {
  const v = new Vignette('colline-douce')
  const c = colline(v, { largeur: 440, hauteur: 124, graine: 29, bosse: 20 })
  garnirColline(v, c, [
    ['touffe', -130, 34],
    ['touffe', 20, 22],
    ['fleur', -40, 40, C.jaune],
    ['fleur', 110, 46, '#ffffff'],
    ['touffe', 150, 44],
  ])
  return v.svg({ x0: -230, y0: -150, x1: 230, y1: 65 })
}

// Deux grandes collines toutes douces (pour le devant de la carte, et entre les montagnes) : de
// grandes formes calmes, avec peu de détails.
function collineLarge() {
  const v = new Vignette('colline-large')
  const c = colline(v, { largeur: 780, hauteur: 190, graine: 41, bosse: -40 })
  garnirColline(v, c, [
    ['touffe', -260, 50],
    ['fleur', -170, 70, C.rose],
    ['touffe', -60, 34],
    ['fleur', 40, 60, C.jaune],
    ['sapin', 170, 34, 0.34],
    ['sapin', 220, 50, 0.28],
    ['touffe', 300, 50],
  ])
  return v.svg({ x0: -400, y0: -330, x1: 400, y1: 95 })
}

function collineLongue() {
  const v = new Vignette('colline-longue')
  const c = colline(v, { largeur: 900, hauteur: 150, graine: 47, bosse: 60 })
  garnirColline(v, c, [
    ['touffe', -320, 40],
    ['fleur', -230, 50, '#ffffff'],
    ['touffe', -120, 30],
    ['buisson', 0, 30, 0.24],
    ['fleur', 120, 46, C.violet],
    ['touffe', 250, 36],
    ['fleur', 330, 40, C.jaune],
  ])
  return v.svg({ x0: -460, y0: -200, x1: 460, y1: 90 })
}

// Un bosquet de sapins (au sol, pour les endroits sans colline).
function bosquet() {
  const v = new Vignette('bosquet')
  v.ajouter(`<ellipse cx="0" cy="6" rx="120" ry="30" fill="${HERBE_OMBRE}" opacity="0.6"/>`)
  for (const [x, y, k] of [
    [-50, -10, 0.36],
    [40, -16, 0.42],
    [-80, 16, 0.3],
    [0, 14, 0.4],
    [76, 20, 0.32],
  ]) {
    v.ajouter(petitArbre(sapin(), x, y, k))
  }
  return v.svg({ x0: -140, y0: -200, x1: 140, y1: 50 })
}

// Des rochers, dont un avec des cristaux.
function rochers() {
  const v = new Vignette('rochers')
  v.ajouter(rocher(-50, 0, 90, 66, 31, ROCHE, TRAIT))
  v.ajouter(grappe(-50, -50, C.diamant, 0.6))
  v.ajouter(rocher(40, 14, 70, 50, 32, ROCHE, TRAIT))
  v.ajouter(rocher(5, 30, 44, 30, 33, ROCHE, TRAIT_FIN))
  v.ajouter(touffe(80, 32))
  return v.svg({ x0: -110, y0: -110, x1: 110, y1: 50 })
}

// Tout le paysage : les vignettes, dans l'ordre de PAYSAGE (src/composants/paysage.ts).
export function montagnes() {
  return [
    montagneGeante(),
    montagneGrande(),
    montagneDouble(),
    montagneMoyenne(),
    montagnePetite(),
    montagneCascade(),
    montagneGrotte(),
    collineSapins(),
    collineBuisson(),
    collineGrande(),
    collinePetite(),
    collineFleurie(),
    collineDouce(),
    collineLarge(),
    collineLongue(),
    bosquet(),
    rochers(),
  ]
}
