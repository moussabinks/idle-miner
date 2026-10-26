// Le wagonnet (26/10, redessiné le 25/10 dans le style cartoon du jeu) : une caisse en planches
// de bois, évasée vers le haut, avec un rebord et des montants en acier, sur quatre roues rondes,
// et un attelage devant. Chargé, il se remplit de minerais (charbon, pierre, fer, redstone, or,
// émeraude, diamant), plus ou moins haut selon ce qu'il porte : vide, à moitié plein, ou plein à
// ras bord (avec un petit tas qui dépasse).
//
// C'est un petit modèle en 3D, recalculé à chaque image : chaque face est un polygone en 3D,
// projeté dans la vue du village (la même que les rails). Comme il est recalculé, il peut tourner
// d'un tout petit angle à la fois : il prend les virages en douceur.
// Le style : des aplats de couleur (une seule nuance plus foncée pour les côtés), un contour
// d'encre épais sur chaque face, ni dégradé ni lumière.
//
// Les coordonnées : en cases. « a » va vers l'avant du wagonnet, « b » vers sa gauche, « z » vers
// le haut (0 : le sol ; le dessus des rails est à 0,17).

import type { IdBloc } from '../jeu/donnees'
import { versEcran } from './iso'
import { minerais } from './minerais'

type P3 = [number, number, number]
type Point = { x: number; y: number }

const HAUTEUR_Z = 19.05 // une case de hauteur, en pixels du monde (comme les rails)

// --- Les dimensions (en cases) ----------------------------------------------------------------
const RAIL = 0.17 // le dessus des rails
const ROUE = { r: 0.13, a: 0.3, b: 0.4 } // les roues roulent sur les rails (à ±0,4)
const CAISSE = { bas: 0.36, haut: 0.86, a0: 0.38, b0: 0.27, a1: 0.5, b1: 0.4 } // évasée vers le haut
const REBORD = 0.03 // le cadre d'acier qui fait le tour du haut

// --- Les couleurs (la palette du jeu) ----------------------------------------------------------
const ENCRE = '#2a2140'
const BOIS = '#c98a55'
const BOIS_FONCE = '#9a6237'
const BOIS_DEDANS = '#87552f'
const ACIER = '#b8c0cc'
const ACIER_FONCE = '#8d96a5'
const ROUE_FER = '#5b5468'
const OMBRE = 'rgb(42 33 64 / 0.22)'
const TRAIT = 0.8 // l'épaisseur des contours (en pixels du monde)

// La caméra regarde depuis le sud-est, d'en haut : une face est tournée vers nous si sa normale
// va vers l'est ou le sud.
const versCamera = (n: P3) => n[0] + n[1] + n[2] > 0

// Une seule nuance plus foncée : une face tournée vers la droite de l'écran (vers l'est) est
// foncée, une face tournée vers la gauche (vers le sud) est claire. Entre les deux (le wagonnet
// tourne dans un virage), on passe d'un aplat à l'autre sans à-coup.
function teinteCote(n: P3, clair: string, fonce: string, cache: Map<string, string>): string {
  const t = Math.max(0, Math.min(1, (n[0] - n[1]) * 0.5 + 0.5))
  const pas = Math.round(t * 8) // 9 nuances au plus : on les garde en mémoire
  const cle = `${clair}${pas}`
  let couleur = cache.get(cle)
  if (!couleur) {
    couleur = melanger(clair, fonce, pas / 8)
    cache.set(cle, couleur)
  }
  return couleur
}

function melanger(a: string, b: string, t: number): string {
  const x = parseInt(a.slice(1), 16)
  const y = parseInt(b.slice(1), 16)
  const c = (decalage: number) => Math.round(((x >> decalage) & 255) * (1 - t) + ((y >> decalage) & 255) * t)
  return `rgb(${c(16)} ${c(8)} ${c(0)})`
}
const NUANCES = new Map<string, string>()

// Un tour de roue (12 points), calculé une fois pour toutes.
const TOUR = Array.from({ length: 12 }, (_, k) => [Math.cos((k / 12) * Math.PI * 2), Math.sin((k / 12) * Math.PI * 2)])

// --- Les minerais du chargement ----------------------------------------------------------------
// Chaque bloc a son minerai : un cristal (redstone, or, émeraude, diamant) ou un caillou (pierre,
// charbon, fer). Un aplat de sa couleur, une facette plus claire, et le contour d'encre.
const MINERAIS: Record<IdBloc, { couleur: string; clair: string; cristal: boolean }> = {
  pierre: { couleur: '#a9a39b', clair: '#cdc8c0', cristal: false },
  charbon: { couleur: '#46424f', clair: '#6c6779', cristal: false },
  fer: { couleur: '#d2a682', clair: '#ecc9a8', cristal: false },
  redstone: { couleur: '#e5484d', clair: '#ff8a8a', cristal: true },
  or: { couleur: '#f5c02e', clair: '#ffe27a', cristal: true },
  emeraude: { couleur: '#3cc47a', clair: '#8be8a8', cristal: true },
  saphir: { couleur: '#3a66e0', clair: '#9db8ff', cristal: true },
  rubis: { couleur: '#e8304f', clair: '#ff9aab', cristal: true },
  diamant: { couleur: '#5cc8f5', clair: '#b4ecff', cristal: true },
  // (26/10) Ce que fabriquent la fonderie (des lingots) et la joaillerie (des bijoux).
  lingot_fer: { couleur: '#c9ccd6', clair: '#eef0f6', cristal: false },
  lingot_or: { couleur: '#f5c02e', clair: '#ffe27a', cristal: false },
  bijou_emeraude: { couleur: '#3cc47a', clair: '#8be8a8', cristal: true },
  bijou_saphir: { couleur: '#3a66e0', clair: '#9db8ff', cristal: true },
  bijou_rubis: { couleur: '#e8304f', clair: '#ff9aab', cristal: true },
  bijou_diamant: { couleur: '#5cc8f5', clair: '#b4ecff', cristal: true },
}

// Les formes des minerais (en tailles de minerai : x et y de -1 à 1).
const CRISTAL: [number, number][] = [[-1, -0.15], [-0.55, -0.75], [0.55, -0.75], [1, -0.15], [0, 0.85]]
const FACETTE_CRISTAL: [number, number][] = [[-0.55, -0.75], [0.55, -0.75], [0.3, -0.3], [-0.3, -0.3]]
const CAILLOUX: [number, number][][] = [
  [[-0.95, 0.2], [-0.7, -0.55], [0.05, -0.85], [0.8, -0.45], [0.95, 0.25], [0.2, 0.75], [-0.55, 0.65]],
  [[-0.9, 0.05], [-0.45, -0.7], [0.45, -0.75], [0.95, -0.1], [0.6, 0.6], [-0.3, 0.75]],
  [[-1, -0.1], [-0.5, -0.65], [0.3, -0.8], [0.9, -0.3], [0.85, 0.4], [0, 0.8], [-0.7, 0.55]],
]

function points2d(x: number, y: number, t: number, forme: [number, number][]): string {
  let texte = ''
  for (const [a, b] of forme) texte += `${(x + a * t).toFixed(1)},${(y + b * t).toFixed(1)} `
  return texte
}

// Un minerai à l'écran (taille t en pixels).
export function Minerai({ x, y, t, bloc, variante }: { x: number; y: number; t: number; bloc: IdBloc; variante: number }) {
  const { couleur, clair, cristal } = MINERAIS[bloc]
  const forme = cristal ? CRISTAL : CAILLOUX[variante % CAILLOUX.length]
  // La facette claire : le haut du cristal, ou le coin du haut à gauche du caillou.
  const facette = cristal ? FACETTE_CRISTAL : [forme[0], forme[1], forme[2], [0.05, -0.1] as [number, number]]
  return (
    <g>
      <polygon points={points2d(x, y, t, forme)} fill={couleur} stroke={ENCRE} strokeWidth={0.7} strokeLinejoin="round" />
      <polygon points={points2d(x, y, t, facette)} fill={clair} />
    </g>
  )
}

// Les minerais d'un chargement : on garde la liste tant que le chargement est le même objet.
const listesDeMinerais = new WeakMap<object, IdBloc[]>()
function mineraisDe(contenu: Partial<Record<IdBloc, number>>): IdBloc[] {
  let liste = listesDeMinerais.get(contenu)
  if (!liste) {
    liste = minerais(contenu)
    listesDeMinerais.set(contenu, liste)
  }
  return liste
}

// --- Le dessin ----------------------------------------------------------------------------------
type Props = {
  x: number // le milieu du wagonnet, sur la grille (en cases)
  y: number
  dx: number // sa direction (vers l'avant)
  dy: number
  remplissage: number // de 0 (vide) à 1 (plein)
  contenu: Partial<Record<IdBloc, number>> // ce qu'il porte (pour les couleurs des minerais)
}

export function DessinWagonnet3D({ x, y, dx, dy, remplissage, contenu }: Props) {
  const l = Math.hypot(dx, dy) || 1
  const avX = dx / l // vers l'avant
  const avY = dy / l
  const gaX = -avY // vers la gauche
  const gaY = avX
  // Un point du wagonnet (a, b, z) → la grille en 3D.
  const monde = (a: number, b: number, z: number): P3 => [x + a * avX + b * gaX, y + a * avY + b * gaY, z]
  // → l'écran.
  const ecran = (p: P3): Point => {
    const e = versEcran(p[0], p[1])
    return { x: e.x, y: e.y - p[2] * HAUTEUR_Z }
  }
  // Une liste de points 3D → le texte « x,y x,y ... » d'un polygone.
  const pts = (liste: P3[]) => {
    let texte = ''
    for (const p of liste) {
      const e = versEcran(p[0], p[1])
      texte += `${e.x.toFixed(1)},${(e.y - p[2] * HAUTEUR_Z).toFixed(1)} `
    }
    return texte
  }
  const melange = (p: P3, q: P3, t: number): P3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]

  // Les huit coins de la caisse.
  const { a0, b0, a1, b1, bas, haut } = CAISSE
  const coinsBas = [monde(a0, b0, bas), monde(a0, -b0, bas), monde(-a0, -b0, bas), monde(-a0, b0, bas)]
  const coinsHaut = [monde(a1, b1, haut), monde(a1, -b1, haut), monde(-a1, -b1, haut), monde(-a1, b1, haut)]
  // Le sens (vers l'extérieur) de chaque paroi : l'avant, la droite, l'arrière, la gauche.
  const dehors: P3[] = [
    [avX, avY, 0],
    [-gaX, -gaY, 0],
    [-avX, -avY, 0],
    [gaX, gaY, 0],
  ]

  // L'ombre au sol : un aplat d'encre transparent, juste sous la caisse.
  const ombre = pts([monde(a1, b1, 0), monde(a1, -b1, 0), monde(-a1, -b1, 0), monde(-a1, b1, 0)])

  // Les quatre parois : celles tournées vers nous sont « devant » (on voit leur face extérieure),
  // les autres « derrière » (on voit leur face intérieure, par l'ouverture).
  const parois = [0, 1, 2, 3].map((i) => {
    const j = (i + 1) % 4
    return { quad: [coinsBas[i], coinsBas[j], coinsHaut[j], coinsHaut[i]], n: dehors[i], devant: versCamera(dehors[i]) }
  })

  // Une roue : un disque de fer et son moyeu d'acier, sur la face tournée vers l'extérieur.
  const roue = (a: number, b: number, cle: string) => {
    const disque = (rayon: number) => {
      const liste: P3[] = []
      for (const [c, s] of TOUR) liste.push(monde(a + c * rayon, b, RAIL + ROUE.r + s * rayon))
      return pts(liste)
    }
    return (
      <g key={cle} stroke={ENCRE} strokeWidth={TRAIT} strokeLinejoin="round">
        <polygon points={disque(ROUE.r)} fill={ROUE_FER} />
        <polygon points={disque(ROUE.r * 0.42)} fill={ACIER} />
      </g>
    )
  }
  const gaucheDevant = versCamera([gaX, gaY, 0]) // les roues de gauche sont-elles du côté de la caméra ?
  const bDerriere = gaucheDevant ? -ROUE.b : ROUE.b
  const rouesDerriere = [roue(ROUE.a, bDerriere, 'rd1'), roue(-ROUE.a, bDerriere, 'rd2')]
  const rouesDevant = [roue(ROUE.a, -bDerriere, 'rv1'), roue(-ROUE.a, -bDerriere, 'rv2')]

  // Le chargement : des minerais posés sur une surface qui monte avec le remplissage (et un petit
  // tas au-dessus du bord quand il est presque plein).
  const liste = remplissage > 0 ? mineraisDe(contenu) : []
  const niveau = bas + 0.05 + Math.min(1, remplissage) * (haut - bas - 0.06)
  const t = (niveau - bas) / (haut - bas)
  const ha = a0 + (a1 - a0) * t - 0.06
  const hb = b0 + (b1 - b0) * t - 0.06
  const tas = Math.max(0, remplissage - 0.75) / 0.25
  const cailloux: { p: Point; profondeur: number; bloc: IdBloc; taille: number; variante: number }[] = []
  if (liste.length > 0) {
    let k = 0
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const decale = ((i + j) % 2) * 0.05
        const a = -ha + ((i + 0.5) / 4) * 2 * ha + decale
        const b = -hb + ((j + 0.5) / 3) * 2 * hb - decale
        const bosse = tas * 0.12 * (1 - (a / (ha + 0.06)) ** 2) * (1 - (b / (hb + 0.06)) ** 2)
        const p = monde(a, b, niveau + bosse)
        cailloux.push({ p: ecran(p), profondeur: p[0] + p[1] + p[2], bloc: liste[k % liste.length], taille: 3.4 + ((i * 3 + j) % 3) * 0.5, variante: k })
        k++
      }
    }
    // Plein à ras bord : une deuxième couche, plus haut, au milieu.
    if (tas > 0.3) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          const a = -ha * 0.6 + ((i + 0.5) / 3) * 1.2 * ha
          const b = -hb * 0.5 + ((j + 0.5) / 2) * hb
          const p = monde(a, b, niveau + tas * 0.13)
          cailloux.push({ p: ecran(p), profondeur: p[0] + p[1] + p[2], bloc: liste[k % liste.length], taille: 3.8, variante: k })
          k++
        }
      }
    }
    cailloux.sort((u, v) => u.profondeur - v.profondeur)
  }

  // Le rebord d'acier en haut d'une paroi : son dessus (et son côté, si la paroi est devant).
  const rebord = (i: number) => {
    const j = (i + 1) % 4
    const [ox, oy] = dehors[i]
    const pousse = (p: P3, z: number): P3 => [p[0] + ox * REBORD, p[1] + oy * REBORD, z]
    const h = haut + 0.03
    const dessus = [
      [coinsHaut[i][0], coinsHaut[i][1], h] as P3,
      [coinsHaut[j][0], coinsHaut[j][1], h] as P3,
      pousse(coinsHaut[j], h),
      pousse(coinsHaut[i], h),
    ]
    const cote = [pousse(coinsHaut[i], haut - 0.07), pousse(coinsHaut[j], haut - 0.07), pousse(coinsHaut[j], h), pousse(coinsHaut[i], h)]
    return (
      <g key={`re${i}`}>
        {parois[i].devant && <polygon points={pts(cote)} fill={teinteCote(dehors[i], ACIER, ACIER_FONCE, NUANCES)} />}
        <polygon points={pts(dessus)} fill={ACIER} />
      </g>
    )
  }

  // L'attelage (un bloc d'acier), au bout qui est tourné vers nous.
  const s = versCamera([avX, avY, 0]) ? 1 : -1
  const aAttelage = s * (a0 + 0.09)
  const coinAttelage = (da: number, db: number, z: number) => monde(aAttelage + da * s, db, z)
  const faceAttelage = [coinAttelage(0.05, -0.07, 0.4), coinAttelage(0.05, 0.07, 0.4), coinAttelage(0.05, 0.07, 0.5), coinAttelage(0.05, -0.07, 0.5)]
  const dessusAttelage = [coinAttelage(-0.05, -0.07, 0.5), coinAttelage(-0.05, 0.07, 0.5), coinAttelage(0.05, 0.07, 0.5), coinAttelage(0.05, -0.07, 0.5)]

  // Le fond de la caisse (vu par l'ouverture).
  const fond = [monde(a0 - 0.02, b0 - 0.02, bas + 0.01), monde(a0 - 0.02, -b0 + 0.02, bas + 0.01), monde(-a0 + 0.02, -b0 + 0.02, bas + 0.01), monde(-a0 + 0.02, b0 - 0.02, bas + 0.01)]

  return (
    <g className="wagonnet-3d" strokeLinejoin="round">
      <polygon points={ombre} fill={OMBRE} />
      {rouesDerriere}
      <g stroke={ENCRE} strokeWidth={TRAIT}>
        {/* Le fond, puis l'intérieur des parois de derrière (un bois plus foncé, à l'ombre). */}
        <polygon points={pts(fond)} fill={BOIS_DEDANS} />
        {parois.map((p, i) => !p.devant && <polygon key={`pd${i}`} points={pts(p.quad)} fill={BOIS_FONCE} />)}
        {parois.map((p, i) => !p.devant && rebord(i))}
      </g>
      {/* Le chargement. */}
      {cailloux.map((c, i) => (
        <Minerai key={`m${i}`} x={c.p.x} y={c.p.y} t={c.taille} bloc={c.bloc} variante={c.variante} />
      ))}
      {/* Les parois de devant : le bois, une planche marquée au milieu, les montants d'acier. */}
      <g stroke={ENCRE} strokeWidth={TRAIT}>
        {parois.map((p, i) => {
          if (!p.devant) return null
          const [p0, p1, p2, p3] = p.quad
          const k = 0.1
          return (
            <g key={`pv${i}`}>
              <polygon points={pts(p.quad)} fill={teinteCote(p.n, BOIS, BOIS_FONCE, NUANCES)} />
              <polyline points={pts([melange(p0, p3, 0.5), melange(p1, p2, 0.5)])} fill="none" strokeWidth={0.7} />
              <polygon points={pts([p0, melange(p0, p1, k), melange(p3, p2, k), p3])} fill={teinteCote(p.n, ACIER, ACIER_FONCE, NUANCES)} />
              <polygon points={pts([melange(p0, p1, 1 - k), p1, p2, melange(p3, p2, 1 - k)])} fill={teinteCote(p.n, ACIER, ACIER_FONCE, NUANCES)} />
            </g>
          )
        })}
        {parois.map((p, i) => p.devant && rebord(i))}
        <polygon points={pts(dessusAttelage)} fill={ACIER} />
        <polygon points={pts(faceAttelage)} fill={ACIER_FONCE} />
      </g>
      {rouesDevant}
    </g>
  )
}
