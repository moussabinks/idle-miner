// Les dessins du village faits à la main en SVG, dans le style des images des bâtiments
// (bois, pierre grise, coins dorés, lanternes) : la mine (10 × 10 cases, de plus en plus
// profonde), les rails et les chemins de pavés (ils se raccordent tout seuls), les décorations,
// le wagonnet, et le petit losange de la grille.
// Tout est dessiné dans les coordonnées de l'image du monde (voir iso.ts).

import { memo, type ReactNode } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE, type IdDecoration } from '../jeu/donnees'
import { CALAGES, DEMI_HAUTEUR, DEMI_LARGEUR, LIMITES_TERRAIN, pointSurSprite, transformationSprite, versEcran, type Point } from './iso'

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

// Le losange de la clairière, un peu agrandi (marge en cases), en points « x,y ».
function losangeClairiere(marge: number): string {
  const n = TAILLE_GRILLE
  return [versEcran(-marge, -marge), versEcran(n + marge, -marge), versEcran(n + marge, n + marge), versEcran(-marge, n + marge)].map((p) => `${p.x},${p.y}`).join(' ')
}

// Les petits détails sur l'herbe de la clairière (22/10) : des touffes d'herbe, quelques brins
// plus clairs, et de temps en temps une petite fleur ou un caillou, pour que le damier ait l'air
// vivant. Toujours aux mêmes places (hasard à graine fixe). Ils sont au sol : les bâtiments, les
// chemins et les personnages passent par-dessus.
type Detail = { sorte: 'touffe' | 'brins' | 'fleur' | 'caillou'; x: number; y: number; echelle: number; miroir: boolean; couleur: string }

const COULEURS_FLEURS = ['#ffffff', '#ffe066', '#ff8fb1', '#c9a2ff']

function semerDetails(): Detail[] {
  const hasard = aleatoireAvecGraine(2210)
  const details: Detail[] = []
  const n = TAILLE_GRILLE
  for (let cx = 0; cx < n; cx++) {
    for (let cy = 0; cy < n; cy++) {
      // Environ deux détails pour trois cases, posés n'importe où dans la case.
      if (hasard() > 0.65) continue
      const x = cx + 0.1 + hasard() * 0.8
      const y = cy + 0.1 + hasard() * 0.8
      const tirage = hasard()
      const sorte = tirage < 0.6 ? 'touffe' : tirage < 0.88 ? 'brins' : tirage < 0.96 ? 'fleur' : 'caillou'
      const e = versEcran(x, y)
      details.push({
        sorte,
        x: e.x,
        y: e.y,
        echelle: 0.8 + hasard() * 0.45,
        miroir: hasard() < 0.5,
        couleur: COULEURS_FLEURS[Math.floor(hasard() * COULEURS_FLEURS.length)],
      })
    }
  }
  // Du fond vers l'avant, pour qu'une touffe plus basse passe devant.
  return details.sort((a, b) => a.y - b.y)
}

const DETAILS_HERBE = semerDetails()

// Les dessins des détails (centrés sur leur pied, en pixels du monde).
function DetailsHerbe() {
  return (
    <g className="details-herbe">
      {DETAILS_HERBE.map((d, i) => {
        const transformation = `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${(d.miroir ? -1 : 1) * d.echelle} ${d.echelle})`
        if (d.sorte === 'touffe') return <use key={i} href="#touffe-herbe" transform={transformation} />
        if (d.sorte === 'brins') return <use key={i} href="#brins-herbe" transform={transformation} />
        if (d.sorte === 'caillou') return <use key={i} href="#caillou-herbe" transform={transformation} />
        return (
          <g key={i} transform={transformation}>
            <use href="#tige-fleur" />
            <circle cx="0.6" cy="-5.2" r="1.5" fill={d.couleur} stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.4" />
            <circle cx="0.6" cy="-5.2" r="0.55" fill="#f2b33d" />
          </g>
        )
      })}
    </g>
  )
}

// Tout le sol, dessiné une seule fois (il ne change jamais). Du plus loin au plus près :
// - une herbe sombre partout (le sous-bois, sous les arbres de la forêt) ;
// - une large auréole d'herbe plus claire autour de la clairière, aux bords très flous ;
// - le damier, dont le bord se fond dans cette herbe (sur un peu plus d'une case) : on passe
//   doucement du damier à l'herbe, puis aux arbres (voir ForetVillage), sans coupure nette.
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
        {/* Les petits détails de l'herbe (voir DetailsHerbe) */}
        <path id="touffe-herbe" d="M-3.6 0 Q-3.4 -3 -5 -5.4 Q-2.2 -3.6 -1.6 0 Z M-1.4 0 Q-1 -4.4 0.2 -7 Q0.8 -3.8 1 0 Z M0.8 0 Q2 -3.2 4.6 -4.8 Q2.8 -2.4 2.8 0 Z" fill="#5f9a2a" />
        <path id="brins-herbe" d="M-1.6 0 Q-1.6 -2.6 -2.8 -4.4 M0 0 Q0.2 -3 1 -5.2 M1.4 0 Q2 -1.8 3.2 -2.8" stroke="#a5d65a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path id="tige-fleur" d="M0 0 Q-0.2 -2.6 0.6 -5 M0 -1.6 Q-1.6 -2.2 -2.2 -1.2" stroke="#4e8a24" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <g id="caillou-herbe">
          <ellipse cx="0" cy="-0.6" rx="2.4" ry="1.3" fill="#9a958c" />
          <ellipse cx="-0.5" cy="-1" rx="1.2" ry="0.55" fill="#c4bfb5" />
        </g>
        <filter id="flou-aureole" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="38" />
        </filter>
        <filter id="flou-bord-damier" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        {/* Le damier s'efface doucement sur son bord. */}
        <mask id="masque-damier" maskUnits="userSpaceOnUse" x={x0} y={y0} width={l} height={h}>
          <polygon points={losangeClairiere(0.5)} fill="#fff" filter="url(#flou-bord-damier)" />
        </mask>
      </defs>
      <rect x={x0} y={y0} width={l} height={h} fill="#2f5e1d" />
      <polygon points={losangeClairiere(5)} fill="#4f8a2a" filter="url(#flou-aureole)" />
      <polygon points={losangeClairiere(1.5)} fill="#6aa534" filter="url(#flou-bord-damier)" />
      <polygon points={losangeClairiere(1.6)} fill="url(#motif-damier)" mask="url(#masque-damier)" />
      <DetailsHerbe />
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
  niveau: number // le niveau de la mine (1 à 5), pour le panneau
  ascenseur: boolean // l'ascenseur est construit (on voit sa cabine)
  hauteurCabine: number // où est la cabine : 0 = en haut (au village), 1 = tout en bas
}

// Les calques de la mine, dans le même cadre que mine.webp (mêmes pixels, 1 233 × 774) :
// la cabine (posée en haut du puits), et le devant (la barrière et le sol de devant), dessiné
// par-dessus la cabine quand elle descend.
const IMAGE_CABINE = '/images/batiments/mine-cabine.webp'
const IMAGE_DEVANT_MINE = '/images/batiments/mine-devant.webp'

// Les points utiles de l'image de la mine, en pixels de l'image.
const POINTS_MINE = {
  // où les deux câbles sortent du treuil, et où ils s'accrochent à la cabine (posée en haut)
  treuil: [[632, 264], [732, 253]] as [number, number][],
  accroches: [[634, 476], [744, 545]] as [number, number][],
  // le pied du panneau du niveau de la mine, sur le sol de devant à gauche
  panneau: [250, 470] as [number, number],
}

// De combien de pixels de l'image la cabine descend : tout en haut (au ras du treuil) et tout en
// bas (cachée à moitié derrière la barrière de devant). Sans ascenseur, les câbles pendent au fond.
const CABINE_EN_HAUT = -150
const CABINE_EN_BAS = 35
const CABLES_SANS_ASCENSEUR = 240

export function DessinEvolutionMine({ x, y, miroir, niveau, ascenseur, hauteurCabine }: PropsEvolutionMine) {
  const calage = CALAGES.puits
  const f = Math.max(0, Math.min(1, hauteurCabine))
  const decalage = ascenseur ? CABINE_EN_HAUT + (CABINE_EN_BAS - CABINE_EN_HAUT) * f : CABLES_SANS_ASCENSEUR
  const panneau = pointSurSprite(calage, x, y, 10, miroir, ...POINTS_MINE.panneau)
  return (
    <g className="evolution-mine">
      {/* Les câbles, la cabine et le devant, posés comme l'image de la mine (miroir compris). */}
      <g transform={transformationSprite(calage, x, y, 10, miroir)}>
        {POINTS_MINE.treuil.map(([tx, ty], i) => {
          const [ax, ay] = POINTS_MINE.accroches[i]
          const chemin = `M${tx} ${ty} L${ax} ${ay + decalage}`
          return (
            <g key={i} className="cable-mine">
              <path d={chemin} stroke="#2b2b30" strokeWidth="9" strokeLinecap="round" />
              <path d={chemin} stroke="#a9adb5" strokeWidth="5" strokeDasharray="5 4" strokeLinecap="round" />
            </g>
          )
        })}
        {ascenseur && <image href={IMAGE_CABINE} x="0" y={decalage} width={calage.largeur} height={calage.hauteur} />}
        <image href={IMAGE_DEVANT_MINE} x="0" y="0" width={calage.largeur} height={calage.hauteur} />
      </g>
      {/* Le panneau du niveau de la mine, planté sur le sol de devant. */}
      <g transform={`translate(${panneau.x} ${panneau.y})`}>
        <rect x="-2" y="-30" width="4" height="30" fill="#6b4422" stroke="#2a1608" strokeWidth="0.8" />
        <rect x="-21" y="-42" width="42" height="17" rx="3" fill="#a8743e" stroke="#4a2c12" strokeWidth="1.5" />
        <text x="0" y="-29.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#2a1606" fontFamily="system-ui, sans-serif">
          Niv. {niveau}
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
// Le wagonnet (sur les rails)
// ---------------------------------------------------------------------------

export function DessinWagonnet({ c, plein = true }: { c: Point; plein?: boolean }) {
  return (
    <g transform={`translate(${c.x} ${c.y})`}>
      <ellipse cx="0" cy="3" rx="13" ry="5" fill="rgb(0 0 0 / 0.25)" />
      {/* Le chargement (des minerais qui dépassent), seulement quand il est plein. */}
      {plein && (
        <>
          <circle cx="-5" cy="-15" r="3.4" fill="#4ee8dc" />
          <circle cx="2" cy="-16" r="3.2" fill="#ffd84a" />
          <circle cx="7" cy="-14" r="3" fill="#e04848" />
        </>
      )}
      <path d="M-12 -13 L12 -13 L9 0 L-9 0 Z" fill="#6e6e78" stroke="#25252b" strokeWidth="1.3" />
      <path d="M-12 -13 L12 -13" stroke="#e2b13a" strokeWidth="2" />
      <circle cx="-6" cy="1" r="2.6" fill="#2a2a30" />
      <circle cx="6" cy="1" r="2.6" fill="#2a2a30" />
    </g>
  )
}
