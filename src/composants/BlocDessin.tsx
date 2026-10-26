// Le bloc de la mine à casser (25/10) : un cube vu de 3/4, dessiné à plat avec un gros contour,
// comme les bâtiments. La pierre est grise ; un minerai y met ses pépites de couleur (qui brillent
// pour les plus rares). « fissures » : de 0 à 2, les fêlures quand il faut plusieurs coups.

import type { IdBloc } from '../jeu/donnees'

const ENCRE = '#2a2140'

// La couleur des pépites de chaque minerai (et un reflet plus clair).
// (26/10) Les lingots et les bijoux ne sont pas dans la mine : ils n'ont pas de pépites.
const PEPITES: Partial<Record<IdBloc, { couleur: string; clair: string } | null>> = {
  pierre: null,
  charbon: { couleur: '#3d3a46', clair: '#6b6878' },
  fer: { couleur: '#e7c9a6', clair: '#fbe8d3' },
  redstone: { couleur: '#e2483d', clair: '#ff8a7a' },
  or: { couleur: '#f9d65a', clair: '#fff1a8' },
  emeraude: { couleur: '#3ccf7a', clair: '#a8f5c6' },
  saphir: { couleur: '#3a66e0', clair: '#9db8ff' },
  rubis: { couleur: '#e8304f', clair: '#ff9aab' },
  diamant: { couleur: '#5fe0e6', clair: '#c9fbfd' },
}

// Les pépites : où elles sont sur chaque face (en coordonnées du dessin, 0 à 100).
const POSITIONS = {
  dessus: [
    [50, 20],
    [36, 27],
    [62, 30],
  ],
  gauche: [
    [24, 52],
    [36, 70],
    [20, 74],
  ],
  droite: [
    [66, 56],
    [78, 50],
    [72, 74],
  ],
}

export function BlocDessin({ bloc, fissures = 0, brille = false }: { bloc: IdBloc; fissures?: number; brille?: boolean }) {
  const pepite = PEPITES[bloc]
  const toutes = [...POSITIONS.dessus, ...POSITIONS.gauche, ...POSITIONS.droite]
  return (
    <svg className={`bloc-dessin ${brille ? 'bloc-brille' : ''}`} viewBox="0 0 100 100" aria-hidden="true">
      {/* L'ombre au sol. */}
      <ellipse cx="50" cy="94" rx="36" ry="5" fill="rgb(42 33 64 / 0.18)" />
      {/* Les trois faces : le dessus clair, la gauche moyenne, la droite plus foncée. */}
      <polygon points="50,6 90,26 50,46 10,26" fill="#d9dbe4" stroke={ENCRE} strokeWidth="3.5" strokeLinejoin="round" />
      <polygon points="10,26 50,46 50,90 10,70" fill="#b4b8c6" stroke={ENCRE} strokeWidth="3.5" strokeLinejoin="round" />
      <polygon points="90,26 50,46 50,90 90,70" fill="#979cad" stroke={ENCRE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* Quelques taches de roche, pour le relief. */}
      <path d="M26 40 l6 3 l-2 5 l-6 -2 z M70 64 l7 -3 l1 6 l-6 2 z M44 22 l7 -2 l2 4 l-7 2 z" fill="rgb(42 33 64 / 0.12)" />
      {/* Les pépites du minerai. */}
      {pepite &&
        toutes.map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y - 5} L${x + 5} ${y} L${x} ${y + 5} L${x - 5} ${y} Z`} fill={pepite.couleur} stroke={ENCRE} strokeWidth="2" strokeLinejoin="round" />
            <path d={`M${x - 1.5} ${y - 2} L${x + 1} ${y - 3}`} stroke={pepite.clair} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}
      {/* Les fêlures. */}
      {fissures >= 1 && <path d="M50 46 L46 58 L52 64 L47 76" fill="none" stroke={ENCRE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {fissures >= 2 && <path d="M50 46 L60 40 L66 46 M30 34 L38 38 L36 44" fill="none" stroke={ENCRE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}
