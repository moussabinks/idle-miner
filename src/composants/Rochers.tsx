// Les rochers en relief (24/10) : au lieu d'une tache grise toute plate, chaque rocher est un
// petit volume à facettes, éclairé comme les bâtiments (la lumière vient d'en haut à gauche).
//
// Comment on le fabrique (toujours pareil pour une même « graine ») :
//   1. on pose une couronne de points sur le sol (une ellipse un peu cabossée), une deuxième
//      couronne plus petite à mi-hauteur, et un sommet ;
//   2. on relie ces points en facettes (des quadrilatères sur les flancs, des triangles en haut) ;
//   3. chaque facette est plus ou moins claire selon qu'elle regarde la lumière ou non, et on ne
//      dessine que celles qui sont tournées vers nous.
// Par-dessus : un contour foncé, quelques fissures, un reflet sur l'arête éclairée, et parfois
// de la mousse sur le dessus.

import { aleatoireAvecGraine } from '../jeu/aleatoire'

type Point3 = { x: number; y: number; z: number } // x : vers la droite, y : vers nous, z : vers le haut

// D'où vient la lumière (en haut à gauche, un peu de derrière), et d'où on regarde (de devant, d'en haut).
const LUMIERE = normer({ x: -0.55, y: -0.3, z: 0.78 })
const REGARD = normer({ x: 0, y: 0.58, z: 1 })
// La vue d'en haut écrase la profondeur (comme la grille du village).
const ECRASEMENT = 0.58

function normer(p: Point3): Point3 {
  const l = Math.hypot(p.x, p.y, p.z) || 1
  return { x: p.x / l, y: p.y / l, z: p.z / l }
}

function moins(a: Point3, b: Point3): Point3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function vectoriel(a: Point3, b: Point3): Point3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}

const scalaire = (a: Point3, b: Point3) => a.x * b.x + a.y * b.y + a.z * b.z

// Une couleur « #rrggbb » éclaircie ou assombrie (facteur 1 : la même).
function teinter(couleur: string, facteur: number): string {
  const n = parseInt(couleur.slice(1), 16)
  const canal = (decalage: number) => Math.max(0, Math.min(255, Math.round(((n >> decalage) & 255) * facteur)))
  return `rgb(${canal(16)} ${canal(8)} ${canal(0)})`
}

function melanger(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const canal = (d: number) => Math.round(((na >> d) & 255) * (1 - t) + ((nb >> d) & 255) * t)
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}

type Facette = { points: string; couleur: string; profondeur: number; dessus: boolean }

type Forme = { facettes: Facette[]; contour: string; fissures: string[]; reflet: string }

// La forme d'un rocher (en pixels, autour de son pied en 0,0), calculée une fois par graine et taille.
const formes = new Map<string, Forme>()

function formeDuRocher(graine: number, largeur: number, hauteur: number, couleur: string, mousse: boolean, mouille: boolean): Forme {
  const cle = `${graine}|${largeur}|${hauteur}|${couleur}|${mousse}|${mouille}`
  const deja = formes.get(cle)
  if (deja) return deja
  const hasard = aleatoireAvecGraine(graine)
  const n = 9
  const rx = largeur / 2
  const ry = largeur * 0.36
  const depart = hasard() * Math.PI * 2
  // Trois couronnes (au sol, au milieu, près du haut) puis un sommet un peu aplati : un bloc
  // arrondi, cabossé, plutôt qu'une pointe.
  const couronnes: Point3[][] = [[], [], []]
  const etages = [
    { z: 0, r: 1 },
    { z: 0.5 + hasard() * 0.12, r: 0.88 },
    { z: 0.84 + hasard() * 0.08, r: 0.55 },
  ]
  // Le haut penche un peu vers l'arrière gauche (comme si l'érosion venait de la mer).
  const penche = { x: -rx * 0.08, y: -ry * 0.12 }
  for (let i = 0; i < n; i++) {
    const a = depart + (i / n) * Math.PI * 2 + (hasard() - 0.5) * 0.45
    const r = 0.8 + hasard() * 0.3
    etages.forEach((etage, k) => {
      const rk = r * etage.r * (k === 0 ? 1 : 0.9 + hasard() * 0.2)
      const decalage = etage.z
      couronnes[k].push({ x: Math.cos(a) * rx * rk + penche.x * decalage, y: Math.sin(a) * ry * rk + penche.y * decalage, z: hauteur * etage.z * (k === 0 ? 1 : 0.92 + hasard() * 0.16) })
    })
  }
  const [bas, milieu, haut] = couronnes
  const sommet: Point3 = { x: penche.x + (hasard() - 0.5) * rx * 0.25, y: penche.y + (hasard() - 0.5) * ry * 0.25, z: hauteur }
  const centre: Point3 = { x: 0, y: 0, z: hauteur * 0.4 }
  const ecran = (p: Point3) => ({ x: p.x, y: p.y * ECRASEMENT - p.z })
  const texte = (liste: Point3[]) =>
    liste
      .map(ecran)
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ')

  const facettes: Facette[] = []
  const ajouter = (sommets: Point3[]) => {
    let normale = normer(vectoriel(moins(sommets[1], sommets[0]), moins(sommets[2], sommets[0])))
    // La normale doit pointer vers l'extérieur du rocher.
    const milieuFacette = sommets.reduce((s, p) => ({ x: s.x + p.x / sommets.length, y: s.y + p.y / sommets.length, z: s.z + p.z / sommets.length }), { x: 0, y: 0, z: 0 })
    if (scalaire(normale, moins(milieuFacette, centre)) < 0) normale = { x: -normale.x, y: -normale.y, z: -normale.z }
    if (scalaire(normale, REGARD) <= 0.02) return // tournée vers l'arrière : on ne la voit pas
    const lumiere = Math.max(0, scalaire(normale, LUMIERE))
    const dessus = normale.z > 0.55
    let teinte = couleur
    if (mousse && dessus && hasard() < 0.75) teinte = melanger(couleur, '#5f9e3a', 0.65)
    // Dans l'eau, le bas du rocher est mouillé : plus sombre et un peu bleuté.
    if (mouille && milieuFacette.z < hauteur * 0.3) teinte = melanger(teinte, '#3a5a6a', 0.28)
    facettes.push({
      points: texte(sommets),
      couleur: teinter(teinte, 0.58 + lumiere * 0.78),
      profondeur: milieuFacette.y * ECRASEMENT + milieuFacette.z,
      dessus,
    })
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    ajouter([bas[i], bas[j], milieu[j], milieu[i]])
    ajouter([milieu[i], milieu[j], haut[j], haut[i]])
    ajouter([haut[i], haut[j], sommet])
  }
  facettes.sort((a, b) => a.profondeur - b.profondeur)

  // Le contour : l'enveloppe de tous les points à l'écran.
  const tous = [...bas, ...milieu, ...haut, sommet].map(ecran)
  const contour = enveloppe(tous)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  // Deux petites fissures sur le devant.
  const fissures: string[] = []
  for (let k = 0; k < (largeur >= 16 ? 2 : 0); k++) {
    const x = (hasard() - 0.5) * rx * 0.8
    const y = -hauteur * (0.25 + hasard() * 0.3)
    fissures.push(`M${x.toFixed(1)} ${y.toFixed(1)} l${(rx * 0.08).toFixed(1)} ${(hauteur * 0.1).toFixed(1)} l${(-rx * 0.04).toFixed(1)} ${(hauteur * 0.09).toFixed(1)}`)
  }
  // Le reflet : l'arête du haut, du côté de la lumière (à gauche et devant).
  let reflet = ''
  for (let i = 0; i < n; i++) {
    const a = haut[i]
    const b = haut[(i + 1) % n]
    if (a.x > rx * 0.15 || b.x > rx * 0.15 || a.y < -ry * 0.3 || b.y < -ry * 0.3) continue
    const ea = ecran(a)
    const eb = ecran(b)
    reflet += `M${ea.x.toFixed(1)} ${ea.y.toFixed(1)} L${eb.x.toFixed(1)} ${eb.y.toFixed(1)} `
  }
  const forme = { facettes, contour, fissures, reflet }
  formes.set(cle, forme)
  return forme
}

// L'enveloppe convexe de points (l'algorithme du « ruban » : on garde les points du bord).
function enveloppe(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const tries = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const croix = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const bas: { x: number; y: number }[] = []
  for (const p of tries) {
    while (bas.length >= 2 && croix(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop()
    bas.push(p)
  }
  const haut: { x: number; y: number }[] = []
  for (const p of [...tries].reverse()) {
    while (haut.length >= 2 && croix(haut[haut.length - 2], haut[haut.length - 1], p) <= 0) haut.pop()
    haut.push(p)
  }
  return [...bas.slice(0, -1), ...haut.slice(0, -1)]
}

type PropsRocher = {
  x: number // le pied du rocher, à l'écran (pixels du monde)
  y: number
  largeur: number // en pixels
  hauteur: number
  graine: number // la même graine donne toujours le même rocher
  couleur?: string
  mousse?: boolean // de la mousse verte sur le dessus
  mouille?: boolean // dans l'eau : le bas est plus sombre et brillant
  ombre?: boolean
}

export function Rocher({ x, y, largeur, hauteur, graine, couleur = '#9c978d', mousse = false, mouille = false, ombre = true }: PropsRocher) {
  const forme = formeDuRocher(graine, Math.round(largeur), Math.round(hauteur), couleur, mousse, mouille)
  const contour = Math.max(0.6, Math.min(1.4, largeur / 22))
  return (
    <g className="rocher-relief" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {/* L'ombre portée, vers la droite (la lumière vient de la gauche). */}
      {ombre && <ellipse cx={largeur * 0.12} cy={largeur * 0.04} rx={largeur * 0.6} ry={largeur * 0.22} fill="rgb(0 0 0 / 0.26)" />}
      {forme.facettes.map((f, i) => (
        <polygon key={i} points={f.points} fill={f.couleur} stroke={f.couleur} strokeWidth={0.5} strokeLinejoin="round" />
      ))}
      {forme.fissures.map((d, i) => (
        <path key={`f${i}`} d={d} stroke="rgb(40 36 32 / 0.55)" strokeWidth={Math.max(0.5, contour * 0.7)} fill="none" strokeLinecap="round" />
      ))}
      {forme.reflet && <path d={forme.reflet} stroke="rgb(255 255 255 / 0.45)" strokeWidth={Math.max(0.5, contour * 0.9)} fill="none" strokeLinecap="round" />}
      <polygon points={forme.contour} fill="none" stroke="#2f2b27" strokeWidth={contour} strokeLinejoin="round" />
    </g>
  )
}

// Un groupe de rochers : un gros et deux petits à côté (pour la décoration « rocher »).
export function TasDeRochers({ x, y, graine, echelle = 1, mousse = true }: { x: number; y: number; graine: number; echelle?: number; mousse?: boolean }) {
  return (
    <g>
      <Rocher x={x - 9 * echelle} y={y - 2 * echelle} largeur={11 * echelle} hauteur={7 * echelle} graine={graine + 2} couleur="#a39e94" />
      <Rocher x={x} y={y} largeur={26 * echelle} hauteur={19 * echelle} graine={graine} mousse={mousse} />
      <Rocher x={x + 12 * echelle} y={y + 3 * echelle} largeur={9 * echelle} hauteur={6 * echelle} graine={graine + 1} couleur="#8f8a81" />
    </g>
  )
}
