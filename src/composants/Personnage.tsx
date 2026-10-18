// Le personnage du joueur : une taupe mineuse avec son casque, son gilet
// et son sac à dos. Elle tient une pioche de la couleur de la pioche équipée
// (rien si la pioche est cassée : elle mine à mains nues).
// Dessin en SVG pour rester net à toutes les tailles.

export type ActionPersonnage = 'repos' | 'creuse' | 'marche' | 'grimpe'

type Props = {
  couleurPioche: string | null // null = mains nues
  action: ActionPersonnage
  versLaGauche?: boolean
}

// La pioche tenue dans la main (en 47,5 ; 40,5) : un contour sombre puis la couleur.
// Elle sert aussi à l'assistant, qui a la même pioche que le joueur.
export function DessinPioche({ couleur }: { couleur: string }) {
  return (
    <g className="pioche">
      <path d="M47.5 40.5 L57.5 17.5" stroke="#2a1a0c" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M47.5 40.5 L57.5 17.5" stroke="#9a6532" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M46 16.5 Q57 9 65 22" stroke="#141414" strokeWidth="6.4" fill="none" strokeLinecap="round" />
      <path d="M46 16.5 Q57 9 65 22" stroke={couleur} strokeWidth="4.2" fill="none" strokeLinecap="round" />
      <path d="M49 14.2 Q56 10.5 61 14.5" stroke="rgb(255 255 255 / 0.45)" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Personnage({ couleurPioche, action, versLaGauche = false }: Props) {
  return (
    <svg
      className={`personnage personnage-${action} ${versLaGauche ? 'vers-la-gauche' : ''}`}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Le mineur"
    >
      {/* Sac à dos jaune */}
      <path d="M3 31 Q1 45 7 52 Q15 57 22 51 L22 30 Q13 26 3 31 Z" fill="#f3c22e" stroke="#7a5a08" strokeWidth="1.3" />
      <path d="M6 37 Q12 35 19 38" stroke="#b8890c" strokeWidth="1.1" fill="none" />

      {/* Pieds */}
      <ellipse cx="25" cy="60" rx="6" ry="2.8" fill="#f2a3a8" stroke="#9c5a60" strokeWidth="0.8" />
      <ellipse cx="40" cy="60" rx="6" ry="2.8" fill="#f2a3a8" stroke="#9c5a60" strokeWidth="0.8" />

      {/* Corps tout rond (avec un contour pour se voir sur les fonds sombres) */}
      <ellipse cx="30.5" cy="39" rx="16.5" ry="20.5" fill="#4a4150" stroke="#100d12" strokeWidth="1.4" />
      <ellipse cx="37" cy="43" rx="9.5" ry="12.5" fill="#cdc6c1" />

      {/* Gilet jaune ouvert, avec ses bandes réfléchissantes */}
      <path d="M14.3 40 Q15 55 27 58.8 L29.5 59 L30.5 46 Q21 45 14.3 40 Z" fill="#f6c41f" stroke="#7a5a08" strokeWidth="0.8" />
      <path d="M46.5 42 Q45 54 35 58.8 L33 59 L34.5 48 Q42 47 46.5 42 Z" fill="#f6c41f" stroke="#7a5a08" strokeWidth="0.8" />
      <path d="M15.5 49.5 Q22 53 30 53.5 L29.8 56 Q21 55.5 16.5 52.5 Z" fill="#f4f1e6" />
      <path d="M34 53.6 Q41 53 45.4 49.5 L44.4 52.6 Q40 55.6 33.8 56 Z" fill="#f4f1e6" />

      {/* Bretelle du sac */}
      <path d="M19 31 Q28 36 32 47" stroke="#8a5a2b" strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {/* Tête : joues, museau, nez rose, œil et moustaches */}
      <ellipse cx="42" cy="27.5" rx="9.5" ry="7" fill="#cdc6c1" />
      <ellipse cx="50.5" cy="28" rx="5" ry="3.4" fill="#cdc6c1" />
      <circle cx="55.3" cy="27.2" r="2.3" fill="#f07f8c" stroke="#9c4a55" strokeWidth="0.6" />
      <circle cx="44" cy="22.8" r="2" fill="#111" />
      <circle cx="44.7" cy="22.1" r="0.65" fill="#fff" />
      <path d="M51 30 L60.5 28.5 M51 31 L60.5 32.5 M50 32 L58 35.5" stroke="#3a3340" strokeWidth="0.6" />

      {/* Casque de chantier avec sa lampe */}
      <path d="M17 20 Q19 5 34 5 Q48 5 49 18 Z" fill="#f7c51d" stroke="#7a5a08" strokeWidth="1.1" />
      <path d="M24 9 Q30 6 36 7" stroke="#fff3a6" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <rect x="15" y="17.5" width="37" height="4" rx="2" fill="#e2ab0c" stroke="#7a5a08" strokeWidth="0.9" />
      <rect x="43.5" y="9" width="5.5" height="6.5" rx="1.2" fill="#3d3d3d" />
      <circle className="lampe" cx="49.5" cy="12.2" r="2.3" fill="#fff6b0" />

      {/* La pioche (elle pivote autour de la main) */}
      {couleurPioche !== null && <DessinPioche couleur={couleurPioche} />}

      {/* Le bras et la main qui tient la pioche */}
      <ellipse cx="45" cy="43" rx="4" ry="6" fill="#4a4150" stroke="#100d12" strokeWidth="1" transform="rotate(-35 45 43)" />
      <circle cx="47.5" cy="40.5" r="2.9" fill="#f2a3a8" stroke="#9c5a60" strokeWidth="0.7" />
    </svg>
  )
}
