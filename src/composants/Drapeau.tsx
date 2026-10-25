// Le drapeau d'une langue (25/10) : dessiné ici, au style du jeu (aplats, contour d'encre), et pas
// avec un emoji 🇬🇧 🇫🇷 (chaque téléphone les dessine à sa façon).

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
        {langue === 'fr' ? (
          <>
            <rect x="0" y="0" width="10" height="20" fill="#3b5bdb" />
            <rect x="10" y="0" width="10" height="20" fill="#ffffff" />
            <rect x="20" y="0" width="10" height="20" fill="#e2483d" />
          </>
        ) : (
          <>
            {/* Le Royaume-Uni, simplifié : fond bleu, croix blanches, croix rouges. */}
            <rect x="0" y="0" width="30" height="20" fill="#2b4ea2" />
            <path d="M0 0 L30 20 M30 0 L0 20" stroke="#ffffff" strokeWidth="5" />
            <path d="M0 0 L30 20 M30 0 L0 20" stroke="#e2483d" strokeWidth="2" />
            <path d="M15 0 V20 M0 10 H30" stroke="#ffffff" strokeWidth="7" />
            <path d="M15 0 V20 M0 10 H30" stroke="#e2483d" strokeWidth="4" />
          </>
        )}
      </g>
      <rect x="1" y="1" width="28" height="18" rx="3" fill="none" stroke="#2a2140" strokeWidth="2" />
    </svg>
  )
}
