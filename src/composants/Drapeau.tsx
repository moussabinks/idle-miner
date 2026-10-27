// Le drapeau d'une langue (25/10) : dessiné ici, au style du jeu (aplats, contour d'encre), et pas
// avec un emoji 🇬🇧 🇫🇷 (chaque téléphone les dessine à sa façon). (27/10) L'Espagne et le Brésil.

import type { Langue } from '../jeu/langue'

export function Drapeau({ langue, taille = 22 }: { langue: Langue; taille?: number }) {
  const hauteur = Math.round((taille * 2) / 3)
  return (
    <svg className="drapeau" viewBox="0 0 30 20" width={taille} height={hauteur} aria-hidden="true">
      <defs>
        <clipPath id={`cadre-${langue}`}>
          <rect x="1" y="1" width="28" height="18" rx="3" />
        </clipPath>
      </defs>
      <g clipPath={`url(#cadre-${langue})`}>
        {langue === 'fr' && (
          <>
            <rect x="0" y="0" width="10" height="20" fill="#3b5bdb" />
            <rect x="10" y="0" width="10" height="20" fill="#ffffff" />
            <rect x="20" y="0" width="10" height="20" fill="#e2483d" />
          </>
        )}
        {langue === 'en' && (
          <>
            {/* Le Royaume-Uni, simplifié : fond bleu, croix blanches, croix rouges. */}
            <rect x="0" y="0" width="30" height="20" fill="#2b4ea2" />
            <path d="M0 0 L30 20 M30 0 L0 20" stroke="#ffffff" strokeWidth="5" />
            <path d="M0 0 L30 20 M30 0 L0 20" stroke="#e2483d" strokeWidth="2" />
            <path d="M15 0 V20 M0 10 H30" stroke="#ffffff" strokeWidth="7" />
            <path d="M15 0 V20 M0 10 H30" stroke="#e2483d" strokeWidth="4" />
          </>
        )}
        {langue === 'es' && (
          <>
            {/* (27/10) L'Espagne, simplifiée : rouge, une large bande jaune, rouge. */}
            <rect x="0" y="0" width="30" height="20" fill="#d9353a" />
            <rect x="0" y="5" width="30" height="10" fill="#f9d65a" />
          </>
        )}
        {langue === 'pt' && (
          <>
            {/* (27/10) Le Brésil, simplifié : fond vert, losange jaune, rond bleu et sa bande blanche. */}
            <rect x="0" y="0" width="30" height="20" fill="#2e9e4f" />
            <path d="M15 3 L27 10 L15 17 L3 10 Z" fill="#f9d65a" />
            <circle cx="15" cy="10" r="4.6" fill="#2b4ea2" />
            <path d="M10.6 9.2 Q15 7.8 19.4 10.4" stroke="#ffffff" strokeWidth="1.2" fill="none" />
          </>
        )}
      </g>
      <rect x="1" y="1" width="28" height="18" rx="3" fill="none" stroke="#2a2140" strokeWidth="2" />
    </svg>
  )
}
