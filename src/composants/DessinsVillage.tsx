// Les dessins du village faits à la main en SVG, dans le style des images des bâtiments
// (bois, pierre grise, coins dorés, lanternes) : la mine (10 × 10 cases, de plus en plus
// profonde), les rails et les chemins de pavés (ils se raccordent tout seuls), les décorations,
// le wagonnet, et le petit losange de la grille.
// Tout est dessiné dans les coordonnées de l'image du monde (voir iso.ts).

import { memo, type ReactNode } from 'react'
import { TAILLE_GRILLE, type IdDecoration } from '../jeu/donnees'
import { DEMI_HAUTEUR, DEMI_LARGEUR, LIMITES_TERRAIN, versEcran, type Point } from './iso'

// Un point de la grille → « x,y » pour un attribut SVG.
const p = (x: number, y: number) => {
  const e = versEcran(x, y)
  return `${e.x.toFixed(1)},${e.y.toFixed(1)}`
}

// Un polygone de la grille (une liste de cases), projeté à l'écran.
const poly = (points: [number, number][]) => points.map(([x, y]) => p(x, y)).join(' ')

// Une boîte SVG posée dans le monde, autour d'une emprise (avec de la place au-dessus pour ce
// qui dépasse : un toit, un arbre...). Les enfants dessinent en coordonnées du monde.
export function BoiteSvg({ x, y, taille, hauteur, marge = 12, classe = '', style, children }: {
  x: number
  y: number
  taille: number
  hauteur: number
  marge?: number
  classe?: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  const gauche = versEcran(x, y + taille).x - marge
  const droite = versEcran(x + taille, y).x + marge
  const haut = versEcran(x, y).y - hauteur
  const bas = versEcran(x + taille, y + taille).y + marge
  return (
    <svg
      className={`boite-svg ${classe}`}
      style={{ left: gauche, top: haut, width: droite - gauche, height: bas - haut, ...style }}
      viewBox={`${gauche} ${haut} ${droite - gauche} ${bas - haut}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Le terrain (21/10) : le sol en damier de la clairière, et la forêt tout autour
// ---------------------------------------------------------------------------

// Les deux verts du damier (comme le sol de Clash of Clans). Une case sur deux est plus claire :
// le quadrillage se devine sans lignes, et il sert à poser les bâtiments.
const VERT_CLAIR = '#86c13f'
const VERT_FONCE = '#79b437'

// La forêt : une image qui se répète sans raccord (public/images/village/foret.webp, fabriquée à
// partir de la forêt du décor fourni, upscalée par IA). Elle fait 768 pixels du monde de côté.
const TAILLE_FORET = 768

// Le losange de la clairière, un peu agrandi (marge en cases), en points « x,y ».
function losangeClairiere(marge: number): string {
  const n = TAILLE_GRILLE
  return [versEcran(-marge, -marge), versEcran(n + marge, -marge), versEcran(n + marge, n + marge), versEcran(-marge, n + marge)].map((p) => `${p.x},${p.y}`).join(' ')
}

// Tout le terrain, dessiné une seule fois (il ne change jamais).
export const TerrainVillage = memo(function TerrainVillage() {
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  const l = x1 - x0
  const h = y1 - y0
  const origine = versEcran(0, 0)
  // Le motif du damier est dessiné en cases, puis posé en vue isométrique par cette matrice.
  const enIso = `matrix(${DEMI_LARGEUR} ${DEMI_HAUTEUR} ${-DEMI_LARGEUR} ${DEMI_HAUTEUR} ${origine.x} ${origine.y})`
  return (
    <svg className="terrain-village" style={{ left: x0, top: y0, width: l, height: h }} viewBox={`${x0} ${y0} ${l} ${h}`} aria-hidden="true">
      <defs>
        <pattern id="motif-damier" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform={enIso}>
          <rect width="2" height="2" fill={VERT_CLAIR} />
          <rect x="1" width="1" height="1" fill={VERT_FONCE} />
          <rect y="1" width="1" height="1" fill={VERT_FONCE} />
        </pattern>
        <pattern id="motif-foret" patternUnits="userSpaceOnUse" width={TAILLE_FORET} height={TAILLE_FORET}>
          <image href="/images/village/foret.webp" width={TAILLE_FORET} height={TAILLE_FORET} />
        </pattern>
        <filter id="flou-lisiere" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        {/* La forêt partout, sauf sur la clairière (avec un bord adouci). */}
        <mask id="masque-foret" maskUnits="userSpaceOnUse" x={x0} y={y0} width={l} height={h}>
          <rect x={x0} y={y0} width={l} height={h} fill="#fff" />
          <polygon points={losangeClairiere(1.2)} fill="#000" filter="url(#flou-lisiere)" />
        </mask>
        {/* Une ombre douce de la forêt sur le bord de la clairière. */}
        <filter id="ombre-lisiere" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* Sous la forêt : une bande d'herbe un peu plus sombre autour de la clairière. */}
      <rect x={x0} y={y0} width={l} height={h} fill="#4f8a26" />
      <polygon points={losangeClairiere(0)} fill="url(#motif-damier)" />
      <polygon points={losangeClairiere(0)} fill="none" stroke="#2f5a14" strokeWidth="14" opacity="0.45" filter="url(#ombre-lisiere)" />
      <rect x={x0} y={y0} width={l} height={h} fill="url(#motif-foret)" mask="url(#masque-foret)" />
    </svg>
  )
})

// ---------------------------------------------------------------------------
// La mine (10 × 10) : l'image fournie (mine.webp), et ce qui évolue par-dessus
// ---------------------------------------------------------------------------

type PropsEvolutionMine = {
  x: number
  y: number
  miroir: boolean
  fraction: number // la profondeur atteinte, de 0 (à peine creusée) à 1 (la bedrock)
  profondeur: number // en mètres, pour le panneau
  nbCages: number // une cage d'ascenseur par ascenseur : le tien, puis une par mineur employé
  enMouvement: boolean // une cabine roule (les poulies tournent)
}

// Un point de l'image de la mine, en cases depuis le coin de son emprise (u vers la droite,
// v vers la gauche de l'écran). Retournée en miroir, la gauche et la droite s'échangent.
function pointMine(x: number, y: number, u: number, v: number, miroir: boolean): Point {
  return miroir ? versEcran(x + v, y + u) : versEcran(x + u, y + v)
}

// Les places des cages, le long du mur du fond, dans le trou (d'après l'image de la mine).
const PLACES_CAGES: [number, number][] = [
  [4.2, 3.8],
  [5.8, 3.1],
  [7.4, 2.5],
  [5.6, 4.1],
  [7.1, 3.5],
  [4.0, 4.9],
  [8.4, 3.4],
]

// Une cage d'ascenseur : deux montants d'acier, une poutre, une poulie, le câble et la cabine
// rayée jaune et noir (la tienne a un toit doré).
function CageAscenseur({ p, numero, enMouvement }: { p: Point; numero: number; enMouvement: boolean }) {
  const haut = 48
  const demi = 6
  const cabine = numero === 0 ? '#f2b33d' : '#9aa3ad'
  return (
    <g className="cage-ascenseur">
      <ellipse cx={p.x} cy={p.y + 1} rx={demi + 3} ry="3" fill="rgb(0 0 0 / 0.35)" />
      {/* Les montants et les entretoises */}
      <rect x={p.x - demi - 1.5} y={p.y - haut} width="3" height={haut} fill="#5b636d" stroke="#22272d" strokeWidth="0.8" />
      <rect x={p.x + demi - 1.5} y={p.y - haut} width="3" height={haut} fill="#6f7882" stroke="#22272d" strokeWidth="0.8" />
      <path
        d={`M${p.x - demi} ${p.y - haut + 6} L${p.x + demi} ${p.y - haut + 20} M${p.x + demi} ${p.y - haut + 6} L${p.x - demi} ${p.y - haut + 20}`}
        stroke="#4a5058"
        strokeWidth="1.2"
      />
      <rect x={p.x - demi - 3} y={p.y - haut - 3} width={2 * demi + 6} height="4" rx="1.2" fill="#3d434a" stroke="#1a1d21" strokeWidth="0.8" />
      {/* La poulie */}
      <g transform={`translate(${p.x} ${p.y - haut - 7})`}>
        <g className={enMouvement ? 'poulie-tourne' : undefined}>
          <circle r="5" fill="#c9cfd6" stroke="#2a2f35" strokeWidth="1.3" />
          <path d="M-4 0 H4 M0 -4 V4" stroke="#2a2f35" strokeWidth="1.1" />
        </g>
      </g>
      {/* Le câble et la cabine */}
      <line x1={p.x} y1={p.y - haut - 3} x2={p.x} y2={p.y - 17} stroke="#1a1a1a" strokeWidth="1" />
      <rect x={p.x - 5} y={p.y - 17} width="10" height="13" rx="1.2" fill="#2b2b2b" stroke="#111" strokeWidth="0.8" />
      <rect x={p.x - 5} y={p.y - 19} width="10" height="3" rx="1" fill={cabine} stroke="#111" strokeWidth="0.6" />
      <path d={`M${p.x - 5} ${p.y - 6} h10`} stroke="#f2c230" strokeWidth="2.2" strokeDasharray="2 2" />
      <rect x={p.x - 3} y={p.y - 14} width="6" height="5" fill="#ffd86b" opacity="0.7" />
    </g>
  )
}

export function DessinEvolutionMine({ x, y, miroir, fraction, profondeur, nbCages, enMouvement }: PropsEvolutionMine) {
  const f = Math.max(0, Math.min(1, fraction))
  // Le fond du trou (la partie en pierre) devient de plus en plus sombre en descendant, avec une
  // lueur de minerais au fond quand on est bas.
  const fond = [
    pointMine(x, y, 2.6, 5.4, miroir),
    pointMine(x, y, 6.2, 2.6, miroir),
    pointMine(x, y, 8.6, 5.0, miroir),
    pointMine(x, y, 5.2, 8.2, miroir),
  ]
  const centre = pointMine(x, y, 5.6, 5.3, miroir)
  const panneau = pointMine(x, y, 1.2, 8.4, miroir)
  return (
    <g className="evolution-mine">
      <polygon points={fond.map((p) => `${p.x},${p.y}`).join(' ')} fill="#0c0a12" opacity={0.08 + 0.42 * f} style={{ mixBlendMode: 'multiply' }} />
      {f > 0.35 && <ellipse cx={centre.x} cy={centre.y} rx={34 + 20 * f} ry={14 + 8 * f} fill="#7fd6ff" opacity={0.08 + 0.18 * f} className="lueur-fond-mine" />}
      {PLACES_CAGES.slice(0, nbCages)
        .map((place, i) => ({ i, p: pointMine(x, y, place[0], place[1], miroir) }))
        .map(({ i, p }) => (
          <CageAscenseur key={i} p={p} numero={i} enMouvement={enMouvement} />
        ))}
      {/* Le panneau de profondeur, planté devant l'entrée de la galerie. */}
      <g transform={`translate(${panneau.x} ${panneau.y})`}>
        <rect x="-2" y="-30" width="4" height="30" fill="#6b4422" stroke="#2a1608" strokeWidth="0.8" />
        <rect x="-21" y="-42" width="42" height="17" rx="3" fill="#a8743e" stroke="#4a2c12" strokeWidth="1.5" />
        <text x="0" y="-29.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#2a1606" fontFamily="system-ui, sans-serif">
          -{profondeur} m
        </text>
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Les rails et les chemins (une case chacun, ils se raccordent tout seuls)
// ---------------------------------------------------------------------------

type Raccords = { n: boolean; e: boolean; s: boolean; o: boolean }

// Le milieu de chaque bord d'une case, et les coins (pour les virages).
function bords(x: number, y: number) {
  return {
    n: [x + 0.5, y] as [number, number],
    e: [x + 1, y + 0.5] as [number, number],
    s: [x + 0.5, y + 1] as [number, number],
    o: [x, y + 0.5] as [number, number],
  }
}

// Les morceaux de voie d'une case : des lignes droites (de bord à bord) ou des virages (quart de
// cercle autour d'un coin de la case).
function morceauxDeVoie(r: Raccords): ['droit', 'n' | 'e'] | ['virage', 'ne' | 'es' | 'so' | 'on'] | null {
  const liste = (['n', 'e', 's', 'o'] as const).filter((c) => r[c])
  if (liste.length === 2) {
    const [a, b] = liste
    if ((a === 'n' && b === 's') || (a === 'e' && b === 'o')) return ['droit', a === 'n' ? 'n' : 'e']
    const cle = `${a}${b}`
    if (cle === 'ne') return ['virage', 'ne']
    if (cle === 'es') return ['virage', 'es']
    if (cle === 'so') return ['virage', 'so']
    if (cle === 'no') return ['virage', 'on']
  }
  return null
}

// Un quart de cercle de rayon r autour du coin K, du côté (ux, uy) au côté (vx, vy).
function quartDeCercle(K: [number, number], r: number, u: [number, number], v: [number, number]): string {
  const debut = versEcran(K[0] + u[0] * r, K[1] + u[1] * r)
  const controle = versEcran(K[0] + (u[0] + v[0]) * r, K[1] + (u[1] + v[1]) * r)
  const fin = versEcran(K[0] + v[0] * r, K[1] + v[1] * r)
  return `M${debut.x} ${debut.y} Q${controle.x} ${controle.y} ${fin.x} ${fin.y}`
}

const VIRAGES = {
  // coin, direction vers le premier bord, direction vers le second bord
  ne: { coin: [1, 0], u: [-1, 0], v: [0, 1] },
  es: { coin: [1, 1], u: [0, -1], v: [-1, 0] },
  so: { coin: [0, 1], u: [1, 0], v: [0, -1] },
  on: { coin: [0, 0], u: [0, 1], v: [1, 0] },
} as const

export function CaseRail({ x, y, raccords }: { x: number; y: number; raccords: Raccords }) {
  const forme = morceauxDeVoie(raccords)
  const b = bords(x, y)
  const traverses: ReactNode[] = []
  const rails: string[] = []
  if (forme === null || forme[0] === 'droit') {
    // Tout droit (ou croisement : on dessine les deux sens).
    const sens: ('n' | 'e')[] =
      forme !== null ? [forme[1]] : raccords.n || raccords.s ? (raccords.e || raccords.o ? ['n', 'e'] : ['n']) : ['e']
    for (const s of sens) {
      const [a1, a2] = s === 'n' ? [b.n, b.s] : [b.o, b.e]
      const perp: [number, number] = s === 'n' ? [1, 0] : [0, 1]
      for (const k of [0.2, 0.5, 0.8]) {
        const cx = a1[0] + (a2[0] - a1[0]) * k
        const cy = a1[1] + (a2[1] - a1[1]) * k
        const g = versEcran(cx - perp[0] * 0.38, cy - perp[1] * 0.38)
        const d = versEcran(cx + perp[0] * 0.38, cy + perp[1] * 0.38)
        traverses.push(<line key={`${s}${k}`} x1={g.x} y1={g.y} x2={d.x} y2={d.y} />)
      }
      for (const decal of [-0.22, 0.22]) {
        const debut = versEcran(a1[0] + perp[0] * decal, a1[1] + perp[1] * decal)
        const fin = versEcran(a2[0] + perp[0] * decal, a2[1] + perp[1] * decal)
        rails.push(`M${debut.x} ${debut.y} L${fin.x} ${fin.y}`)
      }
    }
  } else {
    const v = VIRAGES[forme[1]]
    const K: [number, number] = [x + v.coin[0], y + v.coin[1]]
    for (const k of [0.18, 0.5, 0.82]) {
      const angle = (k * Math.PI) / 2
      const dir: [number, number] = [v.u[0] * Math.cos(angle) + v.v[0] * Math.sin(angle), v.u[1] * Math.cos(angle) + v.v[1] * Math.sin(angle)]
      const g = versEcran(K[0] + dir[0] * 0.12, K[1] + dir[1] * 0.12)
      const d = versEcran(K[0] + dir[0] * 0.88, K[1] + dir[1] * 0.88)
      traverses.push(<line key={k} x1={g.x} y1={g.y} x2={d.x} y2={d.y} />)
    }
    rails.push(quartDeCercle(K, 0.28, v.u as unknown as [number, number], v.v as unknown as [number, number]))
    rails.push(quartDeCercle(K, 0.72, v.u as unknown as [number, number], v.v as unknown as [number, number]))
  }
  return (
    <g className="case-rail">
      <polygon points={poly([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]])} className="ballast" />
      <g className="traverses">{traverses}</g>
      <path d={rails.join(' ')} className="rail-ombre" />
      <path d={rails.join(' ')} className="rail-acier" />
    </g>
  )
}

export function CaseChemin({ x, y }: { x: number; y: number }) {
  // Quatre pavés arrondis par case, de deux gris différents.
  const paves: [number, number, number][] = [
    [0.27, 0.27, 0],
    [0.73, 0.27, 1],
    [0.27, 0.73, 1],
    [0.73, 0.73, 0],
  ]
  return (
    <g className="case-chemin">
      <polygon points={poly([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]])} fill="#b49a72" />
      {paves.map(([dx, dy, teinte], i) => (
        <polygon
          key={i}
          points={poly([
            [x + dx - 0.2, y + dy - 0.2],
            [x + dx + 0.2, y + dy - 0.2],
            [x + dx + 0.2, y + dy + 0.2],
            [x + dx - 0.2, y + dy + 0.2],
          ])}
          fill={teinte ? '#a8a49c' : '#c4c0b6'}
          stroke="#6d6860"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}

// Le losange d'une emprise (vert si on peut poser, rouge sinon), pendant qu'on place un élément.
export function LosangeEmprise({ x, y, taille, libre }: { x: number; y: number; taille: number; libre: boolean }) {
  return (
    <polygon
      className={`emprise ${libre ? 'emprise-libre' : 'emprise-occupee'}`}
      points={poly([[x, y], [x + taille, y], [x + taille, y + taille], [x, y + taille]])}
    />
  )
}

// ---------------------------------------------------------------------------
// Les décorations
// ---------------------------------------------------------------------------

function Fleurs({ c, couleur }: { c: Point; couleur: string }) {
  const positions = [
    [-7, -2],
    [5, -4],
    [0, 3],
    [-3, -7],
    [8, 2],
  ]
  return (
    <g>
      <ellipse cx={c.x} cy={c.y} rx="14" ry="7" fill="#4f9a34" opacity="0.8" />
      {positions.map(([dx, dy], i) => (
        <g key={i}>
          <line x1={c.x + dx} y1={c.y + dy} x2={c.x + dx} y2={c.y + dy - 7} stroke="#2f6e20" strokeWidth="1.4" />
          <circle cx={c.x + dx} cy={c.y + dy - 8} r="3.2" fill={couleur} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.6" />
          <circle cx={c.x + dx} cy={c.y + dy - 8} r="1.1" fill="#ffe27a" />
        </g>
      ))}
    </g>
  )
}

function ArbreRond({ c, couleurs, tronc = '#7a4a22', fleurs = false }: { c: Point; couleurs: [string, string, string]; tronc?: string; fleurs?: boolean }) {
  return (
    <g>
      <ellipse cx={c.x} cy={c.y + 2} rx="24" ry="11" fill="rgb(0 0 0 / 0.25)" />
      <path d={`M${c.x - 5} ${c.y} Q${c.x - 4} ${c.y - 30} ${c.x - 1} ${c.y - 40} L${c.x + 4} ${c.y - 40} Q${c.x + 6} ${c.y - 26} ${c.x + 6} ${c.y} Z`} fill={tronc} stroke="#3a2210" strokeWidth="1.2" />
      <circle cx={c.x - 16} cy={c.y - 46} r="17" fill={couleurs[0]} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1.2" />
      <circle cx={c.x + 16} cy={c.y - 48} r="17" fill={couleurs[0]} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1.2" />
      <circle cx={c.x} cy={c.y - 62} r="21" fill={couleurs[1]} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1.2" />
      <circle cx={c.x - 6} cy={c.y - 70} r="8" fill={couleurs[2]} opacity="0.7" />
      {fleurs &&
        [
          [-14, -54],
          [10, -66],
          [18, -46],
          [-4, -78],
          [-20, -40],
        ].map(([dx, dy], i) => <circle key={i} cx={c.x + dx} cy={c.y + dy} r="3" fill="#fff0f6" opacity="0.9" />)}
    </g>
  )
}

export function DessinDecoration({ id, x, y, taille, miroir }: { id: IdDecoration; x: number; y: number; taille: number; miroir: boolean }) {
  const c = versEcran(x + taille / 2, y + taille / 2)
  let dessin: ReactNode = null
  switch (id) {
    case 'fleurs-rouges':
      dessin = <Fleurs c={c} couleur="#e5534b" />
      break
    case 'fleurs-jaunes':
      dessin = <Fleurs c={c} couleur="#f5d142" />
      break
    case 'fleurs-violettes':
      dessin = <Fleurs c={c} couleur="#b48ee8" />
      break
    case 'buisson':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 2} rx="15" ry="6" fill="rgb(0 0 0 / 0.22)" />
          <circle cx={c.x - 7} cy={c.y - 6} r="9" fill="#3f8a2c" stroke="rgb(0 0 0 / 0.3)" />
          <circle cx={c.x + 7} cy={c.y - 7} r="9" fill="#4c9c34" stroke="rgb(0 0 0 / 0.3)" />
          <circle cx={c.x} cy={c.y - 13} r="9" fill="#5fb340" stroke="rgb(0 0 0 / 0.3)" />
          <circle cx={c.x + 4} cy={c.y - 12} r="1.6" fill="#e5534b" />
          <circle cx={c.x - 5} cy={c.y - 5} r="1.6" fill="#e5534b" />
        </g>
      )
      break
    case 'rocher':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 2} rx="15" ry="6" fill="rgb(0 0 0 / 0.25)" />
          <path d={`M${c.x - 14} ${c.y} Q${c.x - 15} ${c.y - 14} ${c.x - 4} ${c.y - 18} Q${c.x + 10} ${c.y - 20} ${c.x + 14} ${c.y - 6} Q${c.x + 15} ${c.y + 2} ${c.x} ${c.y + 3} Z`} fill="#9b968e" stroke="#3c3833" strokeWidth="1.4" />
          <path d={`M${c.x - 6} ${c.y - 14} Q${c.x + 2} ${c.y - 17} ${c.x + 8} ${c.y - 12}`} stroke="#c9c4ba" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <ellipse cx={c.x + 7} cy={c.y - 2} rx="4" ry="2" fill="#5fa040" />
        </g>
      )
      break
    case 'tonneau':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 1} rx="12" ry="5" fill="rgb(0 0 0 / 0.25)" />
          <path d={`M${c.x - 10} ${c.y - 2} Q${c.x - 13} ${c.y - 14} ${c.x - 10} ${c.y - 26} L${c.x + 10} ${c.y - 26} Q${c.x + 13} ${c.y - 14} ${c.x + 10} ${c.y - 2} Z`} fill="#9a6532" stroke="#3a2210" strokeWidth="1.4" />
          <ellipse cx={c.x} cy={c.y - 26} rx="10" ry="4" fill="#7a4a22" stroke="#3a2210" strokeWidth="1.2" />
          <path d={`M${c.x - 12} ${c.y - 8} H${c.x + 12} M${c.x - 12} ${c.y - 20} H${c.x + 12}`} stroke="#5b5e66" strokeWidth="2.4" />
          <circle cx={c.x - 3} cy={c.y - 27} r="2.4" fill="#ffd84a" />
          <circle cx={c.x + 3} cy={c.y - 26} r="2.2" fill="#ffd84a" />
        </g>
      )
      break
    case 'caisse':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 2} rx="15" ry="6" fill="rgb(0 0 0 / 0.25)" />
          <polygon points={`${c.x - 14},${c.y - 6} ${c.x},${c.y + 2} ${c.x + 14},${c.y - 6} ${c.x + 14},${c.y - 18} ${c.x},${c.y - 10} ${c.x - 14},${c.y - 18}`} fill="#a8743e" stroke="#3a2210" strokeWidth="1.3" />
          <polygon points={`${c.x - 14},${c.y - 18} ${c.x},${c.y - 26} ${c.x + 14},${c.y - 18} ${c.x},${c.y - 10}`} fill="#5a3a1a" stroke="#3a2210" strokeWidth="1.3" />
          <circle cx={c.x - 5} cy={c.y - 19} r="3.6" fill="#4ee8dc" stroke="rgb(0 0 0 / 0.3)" />
          <circle cx={c.x + 4} cy={c.y - 20} r="3.6" fill="#e04848" stroke="rgb(0 0 0 / 0.3)" />
          <circle cx={c.x} cy={c.y - 15} r="3.4" fill="#ffd84a" stroke="rgb(0 0 0 / 0.3)" />
          <rect x={c.x - 15.5} y={c.y - 19.5} width="4" height="4" fill="#e2b13a" />
          <rect x={c.x + 11.5} y={c.y - 19.5} width="4" height="4" fill="#e2b13a" />
        </g>
      )
      break
    case 'lanterne':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 1} rx="9" ry="4" fill="rgb(0 0 0 / 0.25)" />
          <circle cx={c.x} cy={c.y - 44} r="16" fill="#ffcf5a" opacity="0.28" className="lueur-lanterne" />
          <rect x={c.x - 2.5} y={c.y - 40} width="5" height="40" fill="#6b4422" stroke="#3a2210" strokeWidth="1" />
          <rect x={c.x - 6} y={c.y - 4} width="12" height="5" rx="1.5" fill="#857f77" stroke="#3c3833" />
          <rect x={c.x - 6} y={c.y - 52} width="12" height="14" rx="2" fill="#ffd86b" stroke="#6b4a10" strokeWidth="1.4" />
          <rect x={c.x - 8} y={c.y - 55} width="16" height="4" rx="1.5" fill="#e2b13a" stroke="#7a5308" />
        </g>
      )
      break
    case 'banc':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 2} rx="16" ry="6" fill="rgb(0 0 0 / 0.22)" />
          <polygon points={`${c.x - 15},${c.y - 8} ${c.x + 3},${c.y + 2} ${c.x + 15},${c.y - 4} ${c.x - 3},${c.y - 14}`} fill="#b07a3f" stroke="#3a2210" strokeWidth="1.3" />
          <polygon points={`${c.x - 3},${c.y - 14} ${c.x + 15},${c.y - 4} ${c.x + 15},${c.y - 14} ${c.x - 3},${c.y - 24}`} fill="#9a6532" stroke="#3a2210" strokeWidth="1.3" />
          <line x1={c.x - 12} y1={c.y - 7} x2={c.x - 12} y2={c.y} stroke="#3a2210" strokeWidth="2" />
          <line x1={c.x + 12} y1={c.y - 4} x2={c.x + 12} y2={c.y + 2} stroke="#3a2210" strokeWidth="2" />
        </g>
      )
      break
    case 'arbre':
      dessin = <ArbreRond c={c} couleurs={['#3f8a2c', '#4fa236', '#8fd65a']} />
      break
    case 'cerisier':
      dessin = <ArbreRond c={c} couleurs={['#f08ab8', '#f6a3c8', '#ffd3e6']} tronc="#6b3f2a" fleurs />
      break
    case 'sapin':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 2} rx="20" ry="9" fill="rgb(0 0 0 / 0.25)" />
          <rect x={c.x - 4} y={c.y - 14} width="8" height="15" fill="#6b4422" stroke="#3a2210" />
          {[0, 1, 2].map((i) => (
            <polygon
              key={i}
              points={`${c.x - 24 + i * 5},${c.y - 12 - i * 20} ${c.x},${c.y - 44 - i * 20} ${c.x + 24 - i * 5},${c.y - 12 - i * 20}`}
              fill={i === 2 ? '#3e9a46' : '#2f7d3a'}
              stroke="rgb(0 0 0 / 0.35)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          ))}
        </g>
      )
      break
    case 'fontaine':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 4} rx="34" ry="16" fill="rgb(0 0 0 / 0.25)" />
          <ellipse cx={c.x} cy={c.y} rx="32" ry="15" fill="#9b968e" stroke="#3c3833" strokeWidth="1.6" />
          <ellipse cx={c.x} cy={c.y - 3} rx="26" ry="11" fill="#4fb7e8" stroke="#2a6f99" strokeWidth="1.2" />
          <ellipse className="eau-fontaine" cx={c.x} cy={c.y - 3} rx="20" ry="8" fill="none" stroke="#bfeaff" strokeWidth="1.4" opacity="0.8" />
          <rect x={c.x - 5} y={c.y - 34} width="10" height="31" rx="3" fill="#b2ada4" stroke="#3c3833" strokeWidth="1.2" />
          <ellipse cx={c.x} cy={c.y - 34} rx="13" ry="5" fill="#c4c0b6" stroke="#3c3833" strokeWidth="1.2" />
          <path className="jet-fontaine" d={`M${c.x} ${c.y - 36} Q${c.x - 12} ${c.y - 54} ${c.x - 16} ${c.y - 32} M${c.x} ${c.y - 36} Q${c.x + 12} ${c.y - 54} ${c.x + 16} ${c.y - 32}`} stroke="#9fdcff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x={c.x - 34} y={c.y - 4} width="6" height="6" fill="#e2b13a" />
          <rect x={c.x + 28} y={c.y - 4} width="6" height="6" fill="#e2b13a" />
        </g>
      )
      break
    case 'statue':
      dessin = (
        <g>
          <ellipse cx={c.x} cy={c.y + 4} rx="28" ry="13" fill="rgb(0 0 0 / 0.28)" />
          <polygon points={`${c.x - 26},${c.y - 4} ${c.x},${c.y + 9} ${c.x + 26},${c.y - 4} ${c.x + 26},${c.y - 16} ${c.x},${c.y - 3} ${c.x - 26},${c.y - 16}`} fill="#857f77" stroke="#3c3833" strokeWidth="1.4" />
          <polygon points={`${c.x - 26},${c.y - 16} ${c.x},${c.y - 29} ${c.x + 26},${c.y - 16} ${c.x},${c.y - 3}`} fill="#b2ada4" stroke="#3c3833" strokeWidth="1.4" />
          {/* Le hamster doré, pioche levée */}
          <g fill="#f2c23a" stroke="#8a5a00" strokeWidth="1.4" className="statue-or">
            <ellipse cx={c.x} cy={c.y - 34} rx="15" ry="14" />
            <circle cx={c.x} cy={c.y - 58} r="15" />
            <circle cx={c.x - 12} cy={c.y - 70} r="5" />
            <circle cx={c.x + 12} cy={c.y - 70} r="5" />
            <path d={`M${c.x + 12} ${c.y - 40} L${c.x + 24} ${c.y - 78}`} strokeWidth="3" />
            <path d={`M${c.x + 12} ${c.y - 80} Q${c.x + 24} ${c.y - 90} ${c.x + 36} ${c.y - 76}`} strokeWidth="4" fill="none" />
          </g>
          <circle cx={c.x - 5} cy={c.y - 60} r="2" fill="#5a3a00" />
          <circle cx={c.x + 5} cy={c.y - 60} r="2" fill="#5a3a00" />
          <circle cx={c.x - 6} cy={c.y - 64} r="5" fill="#fff8d0" opacity="0.5" />
        </g>
      )
      break
  }
  return <g transform={miroir ? `translate(${2 * c.x} 0) scale(-1 1)` : undefined}>{dessin}</g>
}

// ---------------------------------------------------------------------------
// Le wagonnet (sur les rails) et la brouette (à pied)
// ---------------------------------------------------------------------------

export function DessinWagonnet({ c, parRails }: { c: Point; parRails: boolean }) {
  if (!parRails) {
    return (
      <g transform={`translate(${c.x} ${c.y})`}>
        <ellipse cx="0" cy="2" rx="11" ry="4" fill="rgb(0 0 0 / 0.25)" />
        <path d="M-10 -10 L8 -10 L5 -2 L-8 -2 Z" fill="#9a6532" stroke="#3a2210" strokeWidth="1.2" />
        <circle cx="-4" cy="-12" r="2.8" fill="#ffd84a" />
        <circle cx="2" cy="-12.5" r="2.6" fill="#4ee8dc" />
        <circle cx="6" cy="1" r="3" fill="#3a3a42" stroke="#111" />
        <path d="M-10 -8 L-16 -4" stroke="#6b4422" strokeWidth="2" strokeLinecap="round" />
      </g>
    )
  }
  return (
    <g transform={`translate(${c.x} ${c.y})`}>
      <ellipse cx="0" cy="3" rx="13" ry="5" fill="rgb(0 0 0 / 0.25)" />
      <path d="M-12 -13 L12 -13 L9 0 L-9 0 Z" fill="#6e6e78" stroke="#25252b" strokeWidth="1.3" />
      <path d="M-12 -13 L12 -13" stroke="#e2b13a" strokeWidth="2" />
      <circle cx="-5" cy="-15" r="3.4" fill="#4ee8dc" />
      <circle cx="2" cy="-16" r="3.2" fill="#ffd84a" />
      <circle cx="7" cy="-14" r="3" fill="#e04848" />
      <circle cx="-6" cy="1" r="2.6" fill="#2a2a30" />
      <circle cx="6" cy="1" r="2.6" fill="#2a2a30" />
    </g>
  )
}
