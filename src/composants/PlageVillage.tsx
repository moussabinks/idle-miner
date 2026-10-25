// La plage (22/10) : en bas à gauche de la clairière, à la place de la forêt, une bande de
// sable puis la mer, avec un ponton, une barque, des palmiers, un parasol, un feu de camp...
// Inspirée de la plage du décor « terrain-3d » de l'équipe, mais dessinée par le jeu (en SVG,
// à l'angle des cases, comme le reste du village), dans le même style cartoon que les bâtiments.
// On ne peut pas y construire ni y marcher : elle est hors de la grille.
//
// Le côté de la plage est celui des y > TAILLE_GRILLE. On mesure tout en « cases au-delà du
// bord » (d = y - TAILLE_GRILLE) : le sable commence au bord de la clairière, la mer au rivage.

import { memo, type ReactNode } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { PALMIER } from './arbres'
import { DessinDecoration, TouffeHerbe } from './DessinsVillage'
import { ImageFigee } from './ImageFigee'
import { Rocher } from './Rochers'
import { DEMI_LARGEUR, LIMITES_TERRAIN, profondeur, versEcran } from './iso'
import { distanceRivage, distanceSable } from './plage'
import { cheminPublic } from '../chemins'

const N = TAILLE_GRILLE

// Un point au-delà du bord (x, d) → un point du monde.
const ecran = (x: number, d: number) => versEcran(x, N + d)
const pt = (x: number, d: number) => {
  const e = ecran(x, d)
  return `${e.x.toFixed(1)},${e.y.toFixed(1)}`
}

// Une bande entre deux courbes (d = haut(x) et d = bas(x)), de x0 à x1.
function bande(haut: (x: number) => number, bas: (x: number) => number, x0 = -45, x1 = N + 40, pas = 0.5): string {
  const points: string[] = []
  for (let x = x0; x <= x1; x += pas) points.push(pt(x, haut(x)))
  for (let x = x1; x >= x0; x -= pas) points.push(pt(x, bas(x)))
  return points.join(' ')
}

// Une ligne qui suit une courbe (pour l'écume).
function ligne(courbe: (x: number) => number, x0: number, x1: number, pas = 0.4): string {
  let d = ''
  for (let x = x0; x <= x1; x += pas) {
    const e = ecran(x, courbe(x))
    d += `${d === '' ? 'M' : 'L'}${e.x.toFixed(1)} ${e.y.toFixed(1)} `
  }
  return d
}

const LOIN = 90 // la mer va jusque-là (bien au-delà de ce que montre la caméra)

// ---------------------------------------------------------------------------
// Le sol : le sable, la mer, l'écume (dessinés dans le terrain, sous tout le reste)
// ---------------------------------------------------------------------------

type Point2 = { x: number; d: number; r: number; teinte: number }

// Des petits détails semés au hasard (toujours aux mêmes places).
const hasard = aleatoireAvecGraine(1907)
const GRAINS: Point2[] = []
for (let x = -6; x < N + 8; x += 0.55) {
  for (let k = 0; k < 3; k++) {
    const gx = x + hasard() * 0.5
    const d = distanceSable(gx) + hasard() * (distanceRivage(gx) - distanceSable(gx))
    GRAINS.push({ x: gx, d, r: 0.6 + hasard() * 0.9, teinte: hasard() })
  }
}
const RECIFS: Point2[] = []
for (let i = 0; i < 26; i++) {
  const x = -10 + hasard() * (N + 14)
  RECIFS.push({ x, d: distanceRivage(x) + 3 + hasard() * 9, r: 14 + hasard() * 26, teinte: hasard() })
}
// (35 : assez pour faire scintiller la mer, sans trop de travail pour le navigateur)
const REFLETS: Point2[] = []
for (let i = 0; i < 35; i++) {
  const x = -14 + hasard() * (N + 20)
  REFLETS.push({ x, d: distanceRivage(x) + 0.8 + hasard() * 16, r: 3 + hasard() * 5, teinte: hasard() })
}

// Le sol de la plage, dans sa propre couche juste au-dessus du terrain (le damier). Il ne bouge
// pas : il est figé en image (ImageFigee), comme le terrain. Ce qui bouge (reflets, écume,
// vagues) est à part, dans EauPlage.
export const SolPlage = memo(function SolPlage() {
  const rivage = distanceRivage
  const sable = distanceSable
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  return (
    <ImageFigee nom="plage">
      <svg className="terrain-village sol-plage" style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }} viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} aria-hidden="true">
        <defs>
          <TouffeHerbe />
          <filter id="flou-plage" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <filter id="flou-eau" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          {/* La texture du sable (grains et ondulations, sans couture, sable.webp). */}
          <pattern id="motif-sable" patternUnits="userSpaceOnUse" width="256" height="256">
            <image href={cheminPublic('/images/sol/sable.webp')} width="256" height="256" />
          </pattern>
          <clipPath id="cadre-plage">
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
          </clipPath>
        </defs>
        <g clipPath="url(#cadre-plage)">
          {/* La mer : du bleu profond au loin, turquoise près du bord. */}
          <polygon points={bande((x) => rivage(x) - 0.2, () => LOIN)} fill="#1d5fa8" />
          <polygon points={bande((x) => rivage(x) + 3.5, (x) => rivage(x) + 14)} fill="#2777c0" filter="url(#flou-eau)" />
          <polygon points={bande((x) => rivage(x) - 0.2, (x) => rivage(x) + 5)} fill="#2fa6c9" filter="url(#flou-eau)" />
          <polygon points={bande((x) => rivage(x) - 0.2, (x) => rivage(x) + 1.7)} fill="#58d3d6" filter="url(#flou-plage)" />
          {/* Les récifs sous l'eau (les reflets qui scintillent sont dans EauPlage). */}
          {RECIFS.map((r, i) => {
            const e = ecran(r.x, r.d)
            return <ellipse key={`r${i}`} cx={e.x} cy={e.y} rx={r.r} ry={r.r * 0.55} fill={r.teinte < 0.5 ? '#1a6f8f' : '#227f8a'} opacity="0.55" filter="url(#flou-plage)" />
          })}
          {/* Le sable : sec près de l'herbe, plus foncé et mouillé près de l'eau. */}
          <polygon points={bande(sable, rivage)} fill="#efd59a" filter="url(#flou-plage)" />
          <polygon points={bande((x) => sable(x) + 0.35, (x) => rivage(x) - 0.25)} fill="#f6e2ad" filter="url(#flou-plage)" />
          <polygon points={bande((x) => rivage(x) - 0.75, (x) => rivage(x) + 0.05)} fill="#d9b874" filter="url(#flou-plage)" />
          <polygon points={bande(sable, rivage)} fill="url(#motif-sable)" />
          {/* Les ondulations du sable sec, que le vent dessine parallèles au rivage. */}
          {[0.9, 1.45, 2.05, 2.7].map((k, i) => (
            <path
              key={`o${i}`}
              d={ligne((x) => Math.min(rivage(x) - 1.1, sable(x) + k + 0.18 * Math.sin(x * 0.9 + i)), -45, N + 40)}
              stroke={i % 2 ? '#e2c27e' : '#d8b46e'}
              strokeWidth="1.3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${18 + i * 6} ${10 + i * 4}`}
              opacity="0.55"
            />
          ))}
          {/* Le sable mouillé : une bande plus sombre et brillante juste avant l'écume. */}
          <polygon points={bande((x) => rivage(x) - 1.1, (x) => rivage(x) + 0.05)} fill="#c9a160" opacity="0.35" filter="url(#flou-plage)" />
          <polygon points={bande((x) => rivage(x) - 0.45, (x) => rivage(x) + 0.05)} fill="#fff6dc" opacity="0.3" filter="url(#flou-plage)" />
          {GRAINS.map((g, i) => {
            const e = ecran(g.x, g.d)
            return <circle key={`g${i}`} cx={e.x} cy={e.y} r={g.r} fill={g.teinte < 0.5 ? '#c9a462' : '#fff4cf'} opacity="0.7" />
          })}
        </g>
        {/* Une frange d'herbe le long du sable, pour passer doucement du damier à la plage. */}
        {Array.from({ length: Math.round(N / 0.45) }, (_, i) => {
          const x = i * 0.45 + 0.2
          const e = ecran(x, 0.08 + ((i * 37) % 10) / 40)
          const echelle = 0.9 + ((i * 53) % 10) / 20
          return <use key={`h${i}`} href="#touffe-herbe" transform={`translate(${e.x.toFixed(1)} ${e.y.toFixed(1)}) scale(${(i % 2 ? -1 : 1) * echelle} ${echelle})`} />
        })}
      </svg>
    </ImageFigee>
  )
})

// Ce qui bouge sur l'eau : les reflets qui scintillent, l'écume et les vagues du rivage. Un
// dessin à part, léger (sans flou), dans sa propre couche : quand il bouge, le navigateur ne
// redessine que lui.
export const EauPlage = memo(function EauPlage() {
  const rivage = distanceRivage
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  return (
    <svg className="terrain-village eau-plage" style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }} viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} aria-hidden="true">
      <defs>
        <clipPath id="cadre-eau">
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
      </defs>
      <g clipPath="url(#cadre-eau)">
        {REFLETS.map((r, i) => {
          const e = ecran(r.x, r.d)
          return (
            <path
              key={`f${i}`}
              className="reflet-mer"
              style={{ animationDelay: `${(r.teinte * 4).toFixed(2)}s` }}
              d={`M${e.x - r.r} ${e.y} Q${e.x} ${e.y - r.r * 0.35} ${e.x + r.r} ${e.y}`}
              stroke="#e8fbff"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
          )
        })}
        {/* L'écume : une ligne blanche qui suit le rivage, et une vague qui va et vient. */}
        <path className="ecume" d={ligne((x) => rivage(x) - 0.08, -45, N + 40)} stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.92" />
        <path className="vague" d={ligne((x) => rivage(x) + 0.55, -45, N + 40)} stroke="#e6fbff" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="22 14" />
        <path className="vague vague-2" d={ligne((x) => rivage(x) + 1.3, -45, N + 40)} stroke="#d7f6ff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="12 22" />
      </g>
    </svg>
  )
})

// ---------------------------------------------------------------------------
// Les objets de la plage (par-dessus le terrain)
// ---------------------------------------------------------------------------

// Le ponton : deux cases de large, du sable jusque dans l'eau, posé sur la grille.
const PONTON = { x: 30, debut: 1.1, fin: distanceRivage(31) + 5.2, largeur: 2 }

function Ponton() {
  const { x, debut, fin, largeur } = PONTON
  const epaisseur = 4
  const morceaux: ReactNode[] = []
  // Les pieux (sous le plancher), tous les mètres, des deux côtés.
  for (let d = Math.ceil(debut); d <= fin; d += 1) {
    for (const cx of [x, x + largeur]) {
      const e = ecran(cx, d)
      const dansLEau = d > distanceRivage(cx) - 0.3
      morceaux.push(
        <g key={`p${cx}-${d}`}>
          {dansLEau && <ellipse cx={e.x} cy={e.y + 10} rx="6" ry="2.4" fill="none" stroke="#e8fbff" strokeWidth="1.2" opacity="0.8" />}
          <rect x={e.x - 2.6} y={e.y - 2} width="5.2" height={dansLEau ? 13 : 7} rx="1.2" fill="#6d4321" stroke="#3a2210" strokeWidth="1" />
        </g>,
      )
    }
  }
  // Le plancher : une planche par demi-case, en travers, avec l'épaisseur sur le côté.
  const planches: ReactNode[] = []
  for (let d = debut; d < fin - 0.01; d += 0.5) {
    const d2 = Math.min(fin, d + 0.5)
    const a = ecran(x, d)
    const b = ecran(x + largeur, d)
    const c = ecran(x + largeur, d2)
    const e = ecran(x, d2)
    const teinte = Math.round(d * 2) % 3 === 0 ? '#c98d52' : Math.round(d * 2) % 3 === 1 ? '#bd8248' : '#d39a5c'
    planches.push(
      <g key={`l${d}`}>
        <polygon points={`${e.x},${e.y} ${c.x},${c.y} ${c.x},${c.y + epaisseur} ${e.x},${e.y + epaisseur}`} fill="#7a4a24" />
        <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${e.x},${e.y}`} fill={teinte} stroke="#5b3618" strokeWidth="0.8" />
      </g>,
    )
  }
  // Le bord droit du plancher (on voit son épaisseur), et deux lanternes au bout.
  const finG = ecran(x, fin)
  const finD = ecran(x + largeur, fin)
  const debD = ecran(x + largeur, debut)
  return (
    <g className="ponton">
      {morceaux}
      <polygon points={`${debD.x},${debD.y} ${finD.x},${finD.y} ${finD.x},${finD.y + epaisseur} ${debD.x},${debD.y + epaisseur}`} fill="#6a3f1d" />
      {planches}
      <Lanterne p={finG} />
      <Lanterne p={finD} />
    </g>
  )
}

function Lanterne({ p }: { p: { x: number; y: number } }) {
  return (
    <g className="lanterne-plage">
      <circle cx={p.x} cy={p.y - 26} r="11" fill="#ffd36b" opacity="0.28" className="lueur-lanterne" />
      <rect x={p.x - 1.6} y={p.y - 24} width="3.2" height="24" fill="#5b3618" stroke="#2a1608" strokeWidth="0.7" />
      <rect x={p.x - 4.5} y={p.y - 32} width="9" height="9" rx="1.5" fill="#ffd36b" stroke="#3a2210" strokeWidth="1.1" />
      <path d={`M${p.x - 5.5} ${p.y - 32} L${p.x} ${p.y - 37} L${p.x + 5.5} ${p.y - 32} Z`} fill="#3d434a" stroke="#1a1d21" strokeWidth="0.8" />
    </g>
  )
}

// Une barque en bois (rouge et blanche), posée sur le sable ou sur l'eau.
function Barque({ x, d, surLEau }: { x: number; d: number; surLEau?: boolean }) {
  // La coque est allongée le long du rivage (axe x de la grille).
  const avant = ecran(x + 1.25, d)
  const arriere = ecran(x - 1.25, d)
  const gauche = ecran(x, d - 0.45)
  const droite = ecran(x, d + 0.45)
  const c = ecran(x, d)
  const bord = `M${arriere.x} ${arriere.y} Q${gauche.x} ${gauche.y - 3} ${avant.x} ${avant.y} Q${droite.x} ${droite.y + 3} ${arriere.x} ${arriere.y} Z`
  return (
    <g className={surLEau ? 'barque barque-flotte' : 'barque'}>
      <ellipse cx={c.x} cy={c.y + 6} rx="30" ry="8" fill={surLEau ? 'rgb(10 60 90 / 0.35)' : 'rgb(80 50 20 / 0.25)'} />
      {/* la coque vue de côté, puis le dessus */}
      <path d={`M${arriere.x} ${arriere.y} Q${droite.x} ${droite.y + 3} ${avant.x} ${avant.y} L${avant.x - 2} ${avant.y + 6} Q${droite.x} ${droite.y + 12} ${arriere.x + 2} ${arriere.y + 6} Z`} fill="#c8473c" stroke="#5a1d17" strokeWidth="1.2" />
      <path d={`M${arriere.x + 1} ${arriere.y + 3} Q${droite.x} ${droite.y + 8} ${avant.x - 1} ${avant.y + 3}`} stroke="#f4eee0" strokeWidth="2" fill="none" />
      <path d={bord} fill="#b57a45" stroke="#4a2c12" strokeWidth="1.4" />
      <path d={`M${gauche.x - 2} ${gauche.y + 2} L${droite.x - 2} ${droite.y - 2} M${gauche.x + 9} ${gauche.y + 4} L${droite.x + 9} ${droite.y}`} stroke="#7a4a22" strokeWidth="3" />
      {/* une rame posée dedans */}
      <path d={`M${arriere.x + 8} ${arriere.y - 4} L${avant.x - 4} ${avant.y + 1}`} stroke="#d9a46a" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx={avant.x - 4} cy={avant.y + 1} rx="4" ry="2" fill="#d9a46a" stroke="#4a2c12" strokeWidth="0.8" />
    </g>
  )
}

// Un parasol rayé, une serviette et une chaise longue.
function CoinDetente({ x, d }: { x: number; d: number }) {
  const pied = ecran(x, d)
  const serviette = [ecran(x - 1.1, d - 0.15), ecran(x - 0.2, d - 0.15), ecran(x - 0.2, d + 0.85), ecran(x - 1.1, d + 0.85)]
  const haut = { x: pied.x, y: pied.y - 44 }
  const parts = 8
  const toile: ReactNode[] = []
  for (let i = 0; i < parts; i++) {
    const a1 = (i / parts) * Math.PI * 2
    const a2 = ((i + 1) / parts) * Math.PI * 2
    const p1 = { x: haut.x + Math.cos(a1) * 30, y: haut.y + 8 + Math.sin(a1) * 12 }
    const p2 = { x: haut.x + Math.cos(a2) * 30, y: haut.y + 8 + Math.sin(a2) * 12 }
    toile.push(<path key={i} d={`M${haut.x} ${haut.y} L${p1.x} ${p1.y} Q${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2 + 4} ${p2.x} ${p2.y} Z`} fill={i % 2 ? '#f4eee0' : '#e5534b'} stroke="#7a2a22" strokeWidth="0.8" />)
  }
  return (
    <g className="coin-detente">
      <polygon points={serviette.map((p) => `${p.x},${p.y}`).join(' ')} fill="#4a8af0" stroke="#2457b8" strokeWidth="1" />
      <path d={`M${serviette[0].x + 6} ${serviette[0].y + 4} L${serviette[3].x + 6} ${serviette[3].y - 4}`} stroke="#ffffff" strokeWidth="2" opacity="0.8" />
      <ellipse cx={pied.x + 4} cy={pied.y + 3} rx="26" ry="9" fill="rgb(80 50 20 / 0.2)" />
      <rect x={pied.x - 1.4} y={haut.y} width="2.8" height="44" fill="#d9d4c8" stroke="#5a554c" strokeWidth="0.7" />
      {toile}
      <circle cx={haut.x} cy={haut.y} r="2.6" fill="#f2b33d" stroke="#7a4a12" strokeWidth="0.8" />
    </g>
  )
}

// Un feu de camp : des pierres en rond, des bûches, une flamme qui danse et sa lueur.
function FeuDeCamp({ x, d }: { x: number; d: number }) {
  const c = ecran(x, d)
  const pierres = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2
    return { x: c.x + Math.cos(a) * 13, y: c.y + Math.sin(a) * 5.5 }
  })
  const buche = (dx: number) => ecran(x + dx, d + 1.15)
  return (
    <g className="feu-de-camp">
      <ellipse cx={c.x} cy={c.y} rx="40" ry="16" fill="#ffb347" opacity="0.22" className="lueur-feu" />
      {pierres
        .filter((p) => p.y <= c.y)
        .map((p, i) => (
          <Rocher key={`a${i}`} x={p.x} y={p.y + 1.5} largeur={8.5} hauteur={5.5} graine={40 + i} couleur="#8f8a82" ombre={false} />
        ))}
      <path d={`M${c.x - 9} ${c.y + 1} L${c.x + 8} ${c.y - 4} M${c.x - 8} ${c.y - 4} L${c.x + 9} ${c.y + 1}`} stroke="#6d4321" strokeWidth="4.5" strokeLinecap="round" />
      <g className="flamme">
        <path d={`M${c.x - 7} ${c.y - 1} Q${c.x - 9} ${c.y - 12} ${c.x - 1} ${c.y - 24} Q${c.x + 1} ${c.y - 14} ${c.x + 5} ${c.y - 18} Q${c.x + 9} ${c.y - 8} ${c.x + 7} ${c.y - 1} Z`} fill="#ff8a1f" />
        <path d={`M${c.x - 3.5} ${c.y - 1} Q${c.x - 4.5} ${c.y - 9} ${c.x} ${c.y - 15} Q${c.x + 4} ${c.y - 8} ${c.x + 3.5} ${c.y - 1} Z`} fill="#ffd84a" />
      </g>
      {pierres
        .filter((p) => p.y > c.y)
        .map((p, i) => (
          <Rocher key={`b${i}`} x={p.x} y={p.y + 1.5} largeur={9} hauteur={6} graine={60 + i} couleur="#9b968e" ombre={false} />
        ))}
      {/* deux bûches pour s'asseoir */}
      {[-0.6, 0.6].map((dx) => {
        const b = buche(dx)
        return (
          <g key={dx}>
            <rect x={b.x - 11} y={b.y - 8} width="22" height="8" rx="4" fill="#8a5a2e" stroke="#3a2210" strokeWidth="1" />
            <ellipse cx={b.x + 11} cy={b.y - 4} rx="3" ry="4" fill="#d9a46a" stroke="#3a2210" strokeWidth="0.8" />
          </g>
        )
      })}
    </g>
  )
}

// Une étoile de mer ou un coquillage.
function Coquillage({ x, d, etoile, couleur }: { x: number; d: number; etoile: boolean; couleur: string }) {
  const c = ecran(x, d)
  if (etoile) {
    const branches = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 5 : 2.2
      return `${(c.x + Math.cos(a) * r).toFixed(1)},${(c.y + Math.sin(a) * r * 0.6).toFixed(1)}`
    })
    return <polygon points={branches.join(' ')} fill={couleur} stroke="rgb(0 0 0 / 0.3)" strokeWidth="0.6" />
  }
  return (
    <g>
      <path d={`M${c.x - 4} ${c.y} Q${c.x} ${c.y - 6} ${c.x + 4} ${c.y} Z`} fill={couleur} stroke="rgb(0 0 0 / 0.3)" strokeWidth="0.6" />
      <path d={`M${c.x} ${c.y} L${c.x} ${c.y - 3.5} M${c.x - 2} ${c.y} L${c.x - 1} ${c.y - 3} M${c.x + 2} ${c.y} L${c.x + 1} ${c.y - 3}`} stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.5" />
    </g>
  )
}

// Un rocher dans l'eau, avec l'écume tout autour.
function RocherDansLEau({ x, d, taille }: { x: number; d: number; taille: number }) {
  const c = ecran(x, d)
  const r = 12 * taille
  return (
    <g className="rocher-eau">
      <ellipse cx={c.x} cy={c.y + 1} rx={r + 5} ry={(r + 5) * 0.42} fill="none" stroke="#eafcff" strokeWidth="2" opacity="0.85" className="ecume-rocher" />
      <Rocher x={c.x} y={c.y + 1} largeur={r * 2.1} hauteur={r * 1.35} graine={Math.round(x * 13 + d * 7)} couleur="#8e8a83" mousse mouille ombre={false} />
      {/* L'eau qui lèche le pied du rocher, par-devant. */}
      <path d={`M${c.x - r - 3} ${c.y + 1} Q${c.x} ${c.y + r * 0.5} ${c.x + r + 3} ${c.y + 1}`} stroke="#eafcff" strokeWidth="1.6" fill="none" opacity="0.8" strokeLinecap="round" />
    </g>
  )
}

// Des algues échouées : quelques brins verts ondulés sur le sable mouillé.
function Algues({ x, d, graine }: { x: number; d: number; graine: number }) {
  const c = ecran(x, d)
  const brins = [0, 1, 2, 3].map((k) => {
    const dx = ((graine * 7 + k * 13) % 11) - 5
    const long = 7 + ((graine + k * 5) % 6)
    return `M${c.x + dx} ${c.y} q${long * 0.3} ${-2} ${long * 0.5} 0 t${long * 0.5} 0`
  })
  return (
    <g className="algues">
      {brins.map((b, i) => (
        <path key={i} d={b} stroke={i % 2 ? '#3f7a3a' : '#2f6a4a'} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ))}
    </g>
  )
}

// Un morceau de bois flotté, blanchi par la mer.
function BoisFlotte({ x, d, angle }: { x: number; d: number; angle: number }) {
  const c = ecran(x, d)
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${angle})`}>
      <ellipse cx="2" cy="2.5" rx="16" ry="3" fill="rgb(80 50 20 / 0.22)" />
      <rect x="-14" y="-3.5" width="28" height="6" rx="3" fill="#c9b79a" stroke="#6e5a40" strokeWidth="0.9" />
      <path d="M-10 -1.5 H6 M-6 1 H10" stroke="#a8946f" strokeWidth="0.7" />
      <path d="M6 -3 l5 -5" stroke="#c9b79a" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="14" cy="-0.5" rx="1.6" ry="3" fill="#e0d2b8" stroke="#6e5a40" strokeWidth="0.7" />
    </g>
  )
}

// Des traces de pas dans le sable (quelqu'un est descendu du ponton).
function TracesDePas({ de, vers }: { de: [number, number]; vers: [number, number] }) {
  const pas: ReactNode[] = []
  const n = Math.max(2, Math.round(Math.hypot(vers[0] - de[0], vers[1] - de[1]) / 0.3))
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const x = de[0] + (vers[0] - de[0]) * t
    const d = de[1] + (vers[1] - de[1]) * t + Math.sin(t * Math.PI) * 0.8
    const cote = i % 2 === 0 ? 0.12 : -0.12
    const c = ecran(x, d + cote)
    pas.push(<ellipse key={i} cx={c.x} cy={c.y} rx="2" ry="1.1" fill="#c9a462" opacity="0.6" />)
  }
  return <g className="traces-de-pas">{pas}</g>
}

// Un petit crabe qui se promène de côté sur le sable mouillé.
function Crabe({ x, d, retard }: { x: number; d: number; retard: number }) {
  const c = ecran(x, d)
  return (
    <g transform={`translate(${c.x} ${c.y})`}>
      <g className="crabe" style={{ animationDelay: `${retard}s` }}>
        <ellipse cx="0" cy="1" rx="5" ry="1.6" fill="rgb(80 50 20 / 0.25)" />
        <path d="M-4 -1 l-2.5 2 M-3 0 l-2 2.4 M4 -1 l2.5 2 M3 0 l2 2.4" stroke="#b8322a" strokeWidth="0.9" strokeLinecap="round" />
        <ellipse cx="0" cy="-1.6" rx="4.4" ry="2.8" fill="#e5534b" stroke="#7a1a14" strokeWidth="0.8" />
        <ellipse cx="-1" cy="-2.6" rx="1.8" ry="0.8" fill="#ff8a7a" />
        <circle cx="-5.6" cy="-3.6" r="1.7" fill="#e5534b" stroke="#7a1a14" strokeWidth="0.7" />
        <circle cx="5.6" cy="-3.6" r="1.7" fill="#e5534b" stroke="#7a1a14" strokeWidth="0.7" />
        <circle cx="-1.4" cy="-4.6" r="0.8" fill="#fff" stroke="#222" strokeWidth="0.4" />
        <circle cx="1.4" cy="-4.6" r="0.8" fill="#fff" stroke="#222" strokeWidth="0.4" />
      </g>
    </g>
  )
}

// Un palmier : l'image des arbres de la forêt (le palmier), posé sur le sable.
function Palmier({ x, d, taille, miroir }: { x: number; d: number; taille: number; miroir: boolean }) {
  const p = ecran(x, d)
  const echelle = (taille * 2 * DEMI_LARGEUR) / PALMIER.largeurPied
  const largeur = PALMIER.largeur * echelle
  const hauteur = PALMIER.hauteur * echelle
  const gauche = p.x - (miroir ? PALMIER.largeur - PALMIER.pied.x : PALMIER.pied.x) * echelle
  const haut = p.y - PALMIER.pied.y * echelle
  return (
    <image
      href={PALMIER.fichier}
      x={gauche}
      y={haut}
      width={largeur}
      height={hauteur}
      transform={miroir ? `translate(${2 * gauche + largeur} 0) scale(-1 1)` : undefined}
    />
  )
}

type ObjetPlage = { x: number; d: number; dessin: ReactNode }

function objetsDeLaPlage(): ObjetPlage[] {
  const objets: ObjetPlage[] = []
  const ajouter = (x: number, d: number, dessin: ReactNode) => objets.push({ x, d, dessin })
  // Des palmiers au bord de l'herbe.
  for (const [x, d, t, m] of [
    [3.5, 1.2, 2.1, false],
    [11.5, 1.5, 1.9, true],
    [21, 1.1, 2.2, false],
    [24.5, 2.6, 1.8, true],
    [38.5, 1.3, 2.0, true],
    [46, 1.1, 2.3, false],
    [55.5, 1.5, 2.0, true],
  ] as [number, number, number, boolean][]) {
    ajouter(x, d, <Palmier key={`palmier${x}`} x={x} d={d} taille={t} miroir={m} />)
  }
  ajouter(PONTON.x + 1, PONTON.debut, <Ponton key="ponton" />)
  ajouter(PONTON.x + 4.3, PONTON.fin - 1.6, <Barque key="barque-eau" x={PONTON.x + 4.3} d={PONTON.fin - 1.6} surLEau />)
  ajouter(41.5, 3.2, <Barque key="barque" x={41.5} d={3.2} />)
  ajouter(17, 2.2, <CoinDetente key="detente" x={17} d={2.2} />)
  ajouter(7.5, 2.4, <FeuDeCamp key="feu" x={7.5} d={2.4} />)
  // Des caisses et des tonneaux au pied du ponton (les décorations du village).
  for (const [id, x, d] of [
    ['caisse', 28.4, 0.9],
    ['tonneau', 28.2, 1.9],
    ['tonneau', 33.2, 1.2],
    ['lanterne', 26.6, 1.5],
    ['rocher', 27, 3.3],
    ['rocher', 51.5, 3.4],
    ['buisson', 14.2, 0.5],
    ['buisson', 50, 0.6],
  ] as ['caisse' | 'tonneau' | 'lanterne' | 'rocher' | 'buisson', number, number][]) {
    ajouter(x, d, <DessinDecoration key={`${id}${x}`} id={id} x={x - 0.5} y={N + d - 0.5} taille={1} miroir={false} />)
  }
  // Des rochers dans l'eau.
  for (const [x, dd, t] of [
    [5, 1.6, 1.1],
    [14.5, 2.4, 0.8],
    [23, 1.2, 1.3],
    [44, 3.2, 0.9],
    [52, 1.4, 1.2],
    [-3, 2.2, 1.4],
  ] as [number, number, number][]) {
    ajouter(x, distanceRivage(x) + dd, <RocherDansLEau key={`re${x}`} x={x} d={distanceRivage(x) + dd} taille={t} />)
  }
  // Des galets en relief sur le sable, des algues et du bois flotté près de l'eau.
  const g = aleatoireAvecGraine(4242)
  for (let i = 0; i < 22; i++) {
    const x = 1 + g() * (N - 2)
    const d = distanceSable(x) + 0.5 + g() * (distanceRivage(x) - distanceSable(x) - 0.8)
    const taille = 4 + g() * 6
    ajouter(x, d, <Rocher key={`galet${i}`} x={ecran(x, d).x} y={ecran(x, d).y} largeur={taille} hauteur={taille * 0.6} graine={500 + i} couleur={g() < 0.5 ? '#a8a296' : '#8f8a80'} />)
  }
  for (let i = 0; i < 9; i++) {
    const x = 2 + g() * (N - 4)
    const d = distanceRivage(x) - 0.35 - g() * 0.6
    ajouter(x, d, <Algues key={`algue${i}`} x={x} d={d} graine={i * 3 + 1} />)
  }
  for (const [x, d, angle] of [
    [13.5, 3.1, -12],
    [35.5, 2.6, 18],
    [49, 2.9, -6],
  ] as [number, number, number][]) {
    ajouter(x, d, <BoisFlotte key={`bois${x}`} x={x} d={d} angle={angle} />)
  }
  ajouter(26, 2.2, <TracesDePas key="traces" de={[PONTON.x - 0.4, 1.9]} vers={[22.5, 3.4]} />)
  for (const [x, retard] of [
    [19.5, 0],
    [44.5, 2.3],
  ] as [number, number][]) {
    const d = distanceRivage(x) - 0.55
    ajouter(x, d, <Crabe key={`crabe${x}`} x={x} d={d} retard={retard} />)
  }
  // Des étoiles de mer et des coquillages sur le sable mouillé.
  const h = aleatoireAvecGraine(77)
  for (let i = 0; i < 26; i++) {
    const x = 1 + h() * (N - 2)
    const d = distanceRivage(x) - 0.3 - h() * 1.4
    const etoile = h() < 0.4
    const couleur = etoile ? (h() < 0.5 ? '#ff8a5c' : '#f2b33d') : h() < 0.5 ? '#fff0e0' : '#f6c6d0'
    ajouter(x, d, <Coquillage key={`c${i}`} x={x} d={d} etoile={etoile} couleur={couleur} />)
  }
  // Du fond vers l'avant.
  return objets.sort((a, b) => profondeur(a.x, N + a.d) - profondeur(b.x, N + b.d))
}

const OBJETS = objetsDeLaPlage()

export const ObjetsPlage = memo(function ObjetsPlage() {
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  return (
    <svg className="objets-plage" style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }} viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} aria-hidden="true">
      {OBJETS.map((o) => o.dessin)}
    </svg>
  )
})
