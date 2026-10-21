// Les dessins du village faits à la main en SVG, dans le style des images des bâtiments
// (bois, pierre grise, coins dorés, lanternes) : la mine (10 × 10 cases, de plus en plus
// profonde), les rails et les chemins de pavés (ils se raccordent tout seuls), les décorations,
// le wagonnet, et le petit losange de la grille.
// Tout est dessiné dans les coordonnées de l'image du monde (voir iso.ts).

import type { ReactNode } from 'react'
import type { IdDecoration } from '../jeu/donnees'
import { versEcran, type Point } from './iso'

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
// La mine
// ---------------------------------------------------------------------------

type PropsMine = {
  x: number
  y: number
  miroir: boolean
  fraction: number // la profondeur atteinte, de 0 (à peine creusée) à 1 (la bedrock)
  ascenseur: number // niveau de l'ascenseur (0 = pas construit)
  cabineEnHaut: boolean // la cabine attend au village
  enMouvement: boolean // la cabine roule (la poulie tourne)
  nbMineurs: number // une petite poulie par mineur employé
}

// Un poteau en bois avec son chapeau doré (comme sur les dessins des bâtiments).
function Poteau({ gx, gy, haut = 16, lanterne = false }: { gx: number; gy: number; haut?: number; lanterne?: boolean }) {
  const e = versEcran(gx, gy)
  return (
    <g>
      <rect x={e.x - 3} y={e.y - haut} width="6" height={haut} rx="1.2" fill="#8a5a2b" stroke="#3a2210" strokeWidth="1" />
      <rect x={e.x - 4} y={e.y - haut - 4} width="8" height="5" rx="1.2" fill="#e2b13a" stroke="#7a5308" strokeWidth="1" />
      {lanterne && (
        <g className="lanterne-mine">
          <circle cx={e.x} cy={e.y - haut - 12} r="9" fill="#ffcf5a" opacity="0.35" />
          <rect x={e.x - 3.5} y={e.y - haut - 16} width="7" height="9" rx="1.5" fill="#ffd86b" stroke="#6b4a10" strokeWidth="1" />
        </g>
      )}
    </g>
  )
}

export function DessinMine({ x, y, miroir, fraction, ascenseur, cabineEnHaut, enMouvement, nbMineurs }: PropsMine) {
  const t = 10
  const cx = versEcran(x + t / 2, y + t / 2).x
  // Plus on descend, plus le trou est profond : de 1 à 6 paliers de plus en plus sombres.
  // Au tout début, ce n'est qu'un trou de terre à peine creusé.
  const paliers = 1 + Math.min(5, Math.floor(fraction * 6))
  const couleursPaliers = ['#9a6a3e', '#7a5232', '#5e4030', '#47322b', '#332427', '#231a22']
  const rebord = 1.3 // la largeur du rebord en pierre (en cases)
  const pente = 0.55 // chaque palier est un peu plus petit
  const descente = 7 // et un peu plus bas (en pixels)
  const paliersDessin: ReactNode[] = []
  for (let i = 0; i < paliers; i++) {
    const m = rebord + i * pente
    const decal = i * descente
    const pts: [number, number][] = [
      [x + m, y + m],
      [x + t - m, y + m],
      [x + t - m, y + t - m],
      [x + m, y + t - m],
    ]
    paliersDessin.push(
      <g key={i} transform={`translate(0 ${decal})`}>
        <polygon points={poly(pts)} fill={couleursPaliers[i]} stroke="rgb(0 0 0 / 0.35)" strokeWidth="1.2" />
        {/* Les strates de terre sur le bord du fond (la partie qu'on voit) */}
        <polyline points={poly([pts[3], pts[0], pts[1]])} fill="none" stroke="rgb(255 220 170 / 0.12)" strokeWidth="2" />
      </g>,
    )
  }
  const fond = rebord + paliers * pente
  const milieuFond = versEcran(x + t / 2, y + t / 2)
  const entree: [number, number] = [x + t / 2, y + t] // sur la face avant gauche

  // Le chevalement de l'ascenseur, au-dessus du coin du haut du trou.
  const pied1 = versEcran(x + 2.4, y + 3.6)
  const pied2 = versEcran(x + 3.6, y + 2.4)
  const sommet = { x: (pied1.x + pied2.x) / 2, y: Math.min(pied1.y, pied2.y) - 74 }
  const poulies: ReactNode[] = []
  for (let i = 0; i < Math.min(nbMineurs, 7); i++) {
    const e = versEcran(x + 5.2 + i * 0.6, y + 1.2)
    poulies.push(
      <g key={i}>
        <rect x={e.x - 1.5} y={e.y - 26} width="3" height="26" fill="#6b4422" />
        <circle className={enMouvement ? 'poulie-tourne' : ''} cx={e.x} cy={e.y - 28} r="5" fill="#9aa0a8" stroke="#3a3a42" strokeWidth="1.4" style={{ transformOrigin: `${e.x}px ${e.y - 28}px` }} />
      </g>,
    )
  }

  return (
    <g transform={miroir ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
      {/* Le socle : un rebord de pierres grises, épais sur les deux faces avant */}
      <polygon points={poly([[x, y + t], [x + t, y + t], [x + t, y]])} fill="none" />
      <polygon
        points={`${p(x, y + t)} ${p(x + t, y + t)} ${p(x + t, y)} ${versEcran(x + t, y).x},${versEcran(x + t, y).y + 10} ${versEcran(x + t, y + t).x},${versEcran(x + t, y + t).y + 10} ${versEcran(x, y + t).x},${versEcran(x, y + t).y + 10}`}
        fill="#6e6a66"
        stroke="#2e2b28"
        strokeWidth="1.5"
      />
      <polygon points={poly([[x, y], [x + t, y], [x + t, y + t], [x, y + t]])} fill="#9b968e" stroke="#2e2b28" strokeWidth="1.5" />
      {/* Des pierres sur le rebord */}
      {Array.from({ length: 18 }, (_, i) => {
        const cote = i % 4
        const u = ((i * 37) % 9) + 0.5
        const pos: [number, number] = cote === 0 ? [x + u, y + 0.55] : cote === 1 ? [x + t - 0.55, y + u] : cote === 2 ? [x + u, y + t - 0.55] : [x + 0.55, y + u]
        const e = versEcran(pos[0], pos[1])
        return <ellipse key={i} cx={e.x} cy={e.y} rx={7 + (i % 3)} ry={4 + (i % 2)} fill={i % 2 ? '#b2ada4' : '#857f77'} stroke="#3c3833" strokeWidth="0.8" />
      })}

      {/* Le trou, palier par palier */}
      <g className="trou-mine">{paliersDessin}</g>
      {/* Tout au fond : de l'ombre, et une petite lueur quand on est profond */}
      <polygon
        points={poly([
          [x + fond, y + fond],
          [x + t - fond, y + fond],
          [x + t - fond, y + t - fond],
          [x + fond, y + t - fond],
        ])}
        transform={`translate(0 ${paliers * descente})`}
        fill="#120c10"
        opacity={0.25 + fraction * 0.65}
      />
      {fraction > 0.3 && <ellipse cx={milieuFond.x} cy={milieuFond.y + paliers * descente} rx={18 + fraction * 18} ry={8 + fraction * 8} fill="#ff9d3a" opacity={0.12 + fraction * 0.18} className="lueur-fond" />}

      {/* L'échelle qui descend dans le trou (côté gauche) */}
      <g>
        {(() => {
          const a = versEcran(x + rebord, y + t * 0.62)
          const b = versEcran(x + fond, y + t * 0.62)
          const bas = { x: b.x, y: b.y + paliers * descente }
          return (
            <g stroke="#8a5a2b" strokeWidth="2.4">
              <line x1={a.x - 4} y1={a.y - 4} x2={bas.x - 4} y2={bas.y} />
              <line x1={a.x + 4} y1={a.y - 2} x2={bas.x + 4} y2={bas.y + 2} />
              {Array.from({ length: 5 }, (_, i) => {
                const k = (i + 0.5) / 5
                return <line key={i} x1={a.x - 4 + (bas.x - a.x) * k} y1={a.y - 4 + (bas.y - a.y + 4) * k} x2={a.x + 4 + (bas.x - a.x) * k} y2={a.y - 2 + (bas.y - a.y + 4) * k} strokeWidth="1.6" />
              })}
            </g>
          )
        })()}
      </g>

      {/* Le chevalement de l'ascenseur (ou une simple grue en bois avant sa construction) */}
      {ascenseur > 0 ? (
        <g>
          <line x1={pied1.x} y1={pied1.y} x2={sommet.x} y2={sommet.y} stroke="#6b4422" strokeWidth="5" strokeLinecap="round" />
          <line x1={pied2.x} y1={pied2.y} x2={sommet.x} y2={sommet.y} stroke="#6b4422" strokeWidth="5" strokeLinecap="round" />
          <line x1={(pied1.x + sommet.x) / 2} y1={(pied1.y + sommet.y) / 2} x2={(pied2.x + sommet.x) / 2} y2={(pied2.y + sommet.y) / 2} stroke="#8a5a2b" strokeWidth="3.5" />
          <circle className={enMouvement ? 'poulie-tourne' : ''} cx={sommet.x} cy={sommet.y} r="11" fill="#5b5e66" stroke="#24252a" strokeWidth="2" style={{ transformOrigin: `${sommet.x}px ${sommet.y}px` }} />
          <circle cx={sommet.x} cy={sommet.y} r="4" fill="#e2b13a" stroke="#7a5308" strokeWidth="1" />
          <path d={`M${sommet.x - 11} ${sommet.y} L${sommet.x + 11} ${sommet.y} M${sommet.x} ${sommet.y - 11} L${sommet.x} ${sommet.y + 11}`} stroke="#24252a" strokeWidth="1.5" />
          {/* Le câble et la cabine */}
          <line x1={sommet.x + 10} y1={sommet.y} x2={sommet.x + 10} y2={cabineEnHaut ? sommet.y + 46 : sommet.y + 90} stroke="#3a3a42" strokeWidth="1.5" />
          {cabineEnHaut && (
            <g>
              <rect x={sommet.x + 2} y={sommet.y + 46} width="17" height="19" rx="2" fill="#3a3a44" stroke="#1a1a20" strokeWidth="1.5" />
              <rect x={sommet.x + 1} y={sommet.y + 43} width="19" height="4" rx="1" fill="#e2b13a" stroke="#7a5308" strokeWidth="1" />
              <path d={`M${sommet.x + 6} ${sommet.y + 49} V${sommet.y + 63} M${sommet.x + 10.5} ${sommet.y + 49} V${sommet.y + 63} M${sommet.x + 15} ${sommet.y + 49} V${sommet.y + 63}`} stroke="#8a8a96" strokeWidth="1.2" />
            </g>
          )}
        </g>
      ) : (
        <g>
          <line x1={pied1.x} y1={pied1.y} x2={pied1.x + 8} y2={pied1.y - 46} stroke="#8a5a2b" strokeWidth="4" strokeLinecap="round" />
          <line x1={pied1.x + 8} y1={pied1.y - 46} x2={pied1.x + 40} y2={pied1.y - 36} stroke="#8a5a2b" strokeWidth="3.5" strokeLinecap="round" />
          <line x1={pied1.x + 38} y1={pied1.y - 36} x2={pied1.x + 38} y2={pied1.y - 6} stroke="#6b5a48" strokeWidth="1.2" />
          <rect x={pied1.x + 32} y={pied1.y - 8} width="12" height="9" rx="1.5" fill="#8a5a2b" stroke="#3a2210" strokeWidth="1" />
        </g>
      )}
      {/* Les poulies des cabines des mineurs employés */}
      {poulies}

      {/* Les poteaux dorés et les lanternes aux coins */}
      <Poteau gx={x + 0.3} gy={y + 0.3} haut={20} lanterne />
      <Poteau gx={x + t - 0.3} gy={y + 0.3} haut={18} />
      <Poteau gx={x + 0.3} gy={y + t - 0.3} haut={18} />
      <Poteau gx={x + t - 0.3} gy={y + t - 0.3} haut={22} lanterne />

      {/* L'entrée : des rails qui sortent, un wagonnet et le panneau « MINE » */}
      {(() => {
        const a = versEcran(entree[0] - 0.7, entree[1] - 1.4)
        const b = versEcran(entree[0] + 0.7, entree[1] - 1.4)
        const c = versEcran(entree[0] - 0.7, entree[1] + 0.3)
        const d = versEcran(entree[0] + 0.7, entree[1] + 0.3)
        const panneau = versEcran(entree[0] - 2.2, entree[1] - 0.2)
        const wagon = versEcran(entree[0], entree[1] - 0.7)
        return (
          <g>
            <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${d.x},${d.y} ${c.x},${c.y}`} fill="#7a5c3a" opacity="0.9" />
            <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#c9c9d2" strokeWidth="2" />
            <line x1={b.x} y1={b.y} x2={d.x} y2={d.y} stroke="#c9c9d2" strokeWidth="2" />
            <g transform={`translate(${wagon.x} ${wagon.y})`}>
              <path d="M-13 -9 L13 -9 L10 3 L-10 3 Z" fill="#6e6e78" stroke="#25252b" strokeWidth="1.4" />
              <circle cx="-5" cy="-11" r="3.4" fill="#4ee8dc" />
              <circle cx="2" cy="-12" r="3.2" fill="#ffd84a" />
              <circle cx="7" cy="-10" r="3" fill="#e04848" />
              <circle cx="-7" cy="4" r="2.6" fill="#2a2a30" />
              <circle cx="7" cy="4" r="2.6" fill="#2a2a30" />
            </g>
            <g transform={`translate(${panneau.x} ${panneau.y - 26})`}>
              <rect x="-2" y="8" width="4" height="22" fill="#6b4422" />
              <rect x="-24" y="-6" width="48" height="17" rx="4" fill="#a8743e" stroke="#4a2c12" strokeWidth="1.6" />
              <text x="0" y="7" textAnchor="middle" fontSize="11" fontWeight="900" fill="#3a2210" fontFamily="system-ui, sans-serif" transform={miroir ? 'scale(-1 1)' : undefined}>
                MINE
              </text>
            </g>
          </g>
        )
      })()}
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
