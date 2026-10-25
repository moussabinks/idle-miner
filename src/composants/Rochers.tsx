// Les rochers (25/10, le style cartoon) : un galet cabossé tout plat, avec deux teintes (le corps
// à l'ombre, et son dessus éclairé, décalé vers la lumière en haut à gauche) et un contour bleu
// nuit. Pas de dégradé ni de facettes : simple et lisible, même tout petit.
//
// Comment on le fabrique (toujours pareil pour une même « graine ») : une demi-ellipse un peu
// cabossée (des points tirés au hasard autour du haut), posée sur un pied presque plat.

import { aleatoireAvecGraine } from '../jeu/aleatoire'

const ENCRE = '#2a2140'

// Une couleur « #rrggbb » mélangée avec une autre (t = 0 : la première, t = 1 : la seconde).
function melanger(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const canal = (d: number) => Math.round(((na >> d) & 255) * (1 - t) + ((nb >> d) & 255) * t)
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}

type Forme = { contour: string; eclaire: string; mousse: string }

// La forme d'un rocher (en pixels, autour de son pied en 0,0), calculée une fois par graine et taille.
const formes = new Map<string, Forme>()

function formeDuRocher(graine: number, largeur: number, hauteur: number): Forme {
  const cle = `${graine}|${largeur}|${hauteur}`
  const deja = formes.get(cle)
  if (deja) return deja
  const hasard = aleatoireAvecGraine(graine)
  const n = 8
  const points: [number, number][] = []
  for (let i = 0; i < n; i++) {
    // De la gauche à la droite, en passant par le haut.
    const a = Math.PI + (i / (n - 1)) * Math.PI
    const k = 0.86 + hasard() * 0.22
    points.push([Math.cos(a) * (largeur / 2) * k, -hauteur * 0.12 + Math.sin(a) * hauteur * 0.88 * k])
  }
  points.push([largeur * 0.4, 0], [-largeur * 0.4, 0])
  const texte = (liste: [number, number][]) => liste.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  // Le dessus éclairé : la même forme, plus petite, poussée vers le haut et la gauche.
  const eclaire = points.map(([x, y]): [number, number] => [x * 0.7 - largeur * 0.08, y * 0.7 - hauteur * 0.24])
  // La mousse : une petite calotte verte tout en haut.
  const mousse = points.slice(2, n - 2).map(([x, y]): [number, number] => [x * 0.8, y * 0.95])
  const forme = { contour: texte(points), eclaire: texte(eclaire), mousse: texte([...mousse, [mousse[mousse.length - 1][0], -hauteur * 0.62], [mousse[0][0], -hauteur * 0.62]]) }
  formes.set(cle, forme)
  return forme
}

type PropsRocher = {
  x: number // le pied du rocher, à l'écran (pixels du monde)
  y: number
  largeur: number // en pixels
  hauteur: number
  graine: number // la même graine donne toujours le même rocher
  couleur?: string
  mousse?: boolean // de la mousse verte sur le dessus
  mouille?: boolean // dans l'eau : le corps est un peu bleuté
  ombre?: boolean
}

export function Rocher({ x, y, largeur, hauteur, graine, couleur = '#c9ccd6', mousse = false, mouille = false, ombre = true }: PropsRocher) {
  const forme = formeDuRocher(graine, Math.round(largeur), Math.round(hauteur))
  const trait = Math.max(0.8, Math.min(2, largeur / 14))
  const corps = melanger(mouille ? melanger(couleur, '#5fa8de', 0.25) : couleur, ENCRE, 0.18)
  return (
    <g className="rocher-relief" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} strokeLinejoin="round">
      {/* Une ombre plate, un peu vers la droite (la lumière vient de la gauche). */}
      {ombre && <ellipse cx={largeur * 0.1} cy={largeur * 0.02} rx={largeur * 0.56} ry={largeur * 0.18} fill="rgb(42 33 64 / 0.16)" />}
      <polygon points={forme.contour} fill={corps} />
      <polygon points={forme.eclaire} fill={couleur} />
      {mousse && <polygon points={forme.mousse} fill="#6cc66e" stroke={ENCRE} strokeWidth={trait * 0.7} />}
      <polygon points={forme.contour} fill="none" stroke={ENCRE} strokeWidth={trait} />
    </g>
  )
}

// Un groupe de rochers : un gros et deux petits à côté (pour la décoration « rocher »).
export function TasDeRochers({ x, y, graine, echelle = 1, mousse = true }: { x: number; y: number; graine: number; echelle?: number; mousse?: boolean }) {
  return (
    <g>
      <Rocher x={x - 9 * echelle} y={y - 2 * echelle} largeur={11 * echelle} hauteur={7 * echelle} graine={graine + 2} couleur="#d3d6df" />
      <Rocher x={x} y={y} largeur={26 * echelle} hauteur={19 * echelle} graine={graine} mousse={mousse} />
      <Rocher x={x + 12 * echelle} y={y + 3 * echelle} largeur={9 * echelle} hauteur={6 * echelle} graine={graine + 1} couleur="#b9bdc9" />
    </g>
  )
}
