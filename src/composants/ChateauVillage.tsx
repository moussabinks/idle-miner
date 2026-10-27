// Le château de la quête finale sur la carte (27/10) : le chemin de terre qui part du coin du haut
// de la clairière, et le château sur sa colline (en ruine, puis restauré). On le touche pour ouvrir
// sa fenêtre (VueVillage le reconnaît à son « data-cible »).
//
// La restauration (« animation ») : la ruine tremble dans un nuage de poussière, des étincelles
// dorées montent, un éclair blanc, et le château neuf jaillit en rebondissant au milieu de rayons
// dorés et d'étoiles. Les feux d'artifice sont à part (FeuxArtifice.tsx), par-dessus tout l'écran.

import { memo } from 'react'
import { versEcran } from './iso'
import { CHEMIN_CHATEAU, IMAGE_CHATEAU_NEUF, IMAGE_CHATEAU_RUINE, cadreChateau, zoneChemin } from './chateau'

// Le chemin de terre : une courbe douce qui passe par les points de CHEMIN_CHATEAU (une courbe de
// Catmull-Rom, changée en courbes de Bézier pour le SVG).
function courbe(points: { x: number; y: number }[]): string {
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// Des petits cailloux plats au bord du chemin (toujours aux mêmes places).
const CAILLOUX = [
  [0.12, -1],
  [0.27, 1],
  [0.4, -1],
  [0.55, 1],
  [0.68, -1],
  [0.83, 1],
] as const

export const CheminChateau = memo(function CheminChateau() {
  const zone = zoneChemin()
  const points = CHEMIN_CHATEAU.map((c) => versEcran(c.x, c.y)).map((p) => ({ x: p.x - zone.x0, y: p.y - zone.y0 }))
  const d = courbe(points)
  // Les cailloux : à peu près le long du chemin (entre deux points), d'un côté ou de l'autre.
  const cailloux = CAILLOUX.map(([t, cote]) => {
    const f = t * (points.length - 1)
    const i = Math.floor(f)
    const a = points[i]
    const b = points[i + 1]
    const k = f - i
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l = Math.hypot(dx, dy) || 1
    return { x: a.x + dx * k - (dy / l) * 17 * cote, y: a.y + dy * k + (dx / l) * 17 * cote }
  })
  return (
    <svg className="chemin-chateau" style={{ left: zone.x0, top: zone.y0 }} width={zone.x1 - zone.x0} height={zone.y1 - zone.y0} aria-hidden="true">
      <path d={d} fill="none" stroke="#2a2140" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#d9b27c" strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#e8c995" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14 22" />
      {cailloux.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={5} ry={3.4} fill="#c9ccd6" stroke="#2a2140" strokeWidth={2} />
      ))}
    </svg>
  )
})

type Props = {
  restaure: boolean
  animation: boolean // la restauration est en train de se jouer
  touchable: boolean // false pendant une visite : on ne peut pas l'ouvrir
}

export const ChateauVillage = memo(function ChateauVillage({ restaure, animation, touchable }: Props) {
  const cadre = cadreChateau()
  const style = { left: cadre.x0, top: cadre.y0, width: cadre.x1 - cadre.x0, height: cadre.y1 - cadre.y0 }
  const cible = touchable ? 'chateau' : undefined
  return (
    <div className={`chateau-village ${animation ? 'chateau-en-restauration' : ''} ${touchable ? '' : 'chateau-inerte'}`} style={style}>
      {/* Les rayons dorés derrière le château neuf (seulement pendant la restauration). */}
      {animation && <span className="chateau-rayons" aria-hidden="true" />}
      {(!restaure || animation) && <img className="chateau-image chateau-ruine" src={IMAGE_CHATEAU_RUINE} alt="" draggable={false} data-cible={cible} />}
      {restaure && <img className="chateau-image chateau-neuf" src={IMAGE_CHATEAU_NEUF} alt="" draggable={false} data-cible={cible} />}
      {animation && (
        <span className="chateau-effets" aria-hidden="true">
          {/* La poussière autour du pied, les étincelles qui montent, l'éclair, les étoiles. */}
          {Array.from({ length: 14 }, (_, i) => (
            <i key={`p${i}`} className="chateau-poussiere" style={{ ['--x' as string]: `${10 + i * 6.2}%`, animationDelay: `${(i % 5) * 110}ms` }} />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <i key={`e${i}`} className="chateau-etincelle" style={{ ['--x' as string]: `${18 + ((i * 37) % 64)}%`, animationDelay: `${300 + ((i * 97) % 1100)}ms` }} />
          ))}
          <i className="chateau-eclair" />
          {Array.from({ length: 10 }, (_, i) => (
            <b key={`s${i}`} className="chateau-etoile" style={{ ['--x' as string]: `${8 + ((i * 41) % 84)}%`, ['--y' as string]: `${10 + ((i * 29) % 55)}%`, animationDelay: `${2000 + i * 110}ms` }}>
              ✨
            </b>
          ))}
        </span>
      )}
    </div>
  )
})
