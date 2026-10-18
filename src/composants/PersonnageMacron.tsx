// L'assistant : une caricature d'Emmanuel Macron, dessinée en SVG dans le même
// style que la taupe. Il tient la même pioche que le joueur.

import type { ActionPersonnage } from './Personnage'
import { DessinPioche } from './Personnage'

type Props = {
  couleurPioche: string | null // null = mains nues (comme le joueur)
  action: ActionPersonnage
}

export function PersonnageMacron({ couleurPioche, action }: Props) {
  return (
    <svg className={`personnage personnage-${action}`} viewBox="0 0 64 64" role="img" aria-label="Emmanuel Macron, ton assistant">
      {/* Chaussures et pantalon */}
      <ellipse cx="26" cy="61" rx="5.5" ry="2.4" fill="#111" />
      <ellipse cx="38" cy="61" rx="5.5" ry="2.4" fill="#111" />
      <rect x="23" y="50" width="6" height="10" rx="1.5" fill="#1b2440" stroke="#0a0f1e" strokeWidth="0.8" />
      <rect x="35" y="50" width="6" height="10" rx="1.5" fill="#1b2440" stroke="#0a0f1e" strokeWidth="0.8" />

      {/* Costume bleu marine, chemise blanche et cravate */}
      <path d="M18 36 Q18 31 24 30.5 L40 30.5 Q46 31 46 36 L46 52 Q32 55 18 52 Z" fill="#22305a" stroke="#0a0f1e" strokeWidth="1.2" />
      <path d="M27.5 30.8 L36.5 30.8 L32 42 Z" fill="#f4f4f4" />
      <path d="M31 32 L33 32 L33.8 41 L32 44 L30.2 41 Z" fill="#14204a" />
      <path d="M27.5 30.8 L31 38 M36.5 30.8 L33 38" stroke="#0a0f1e" strokeWidth="0.8" />

      {/* Petit pin's tricolore sur le revers */}
      <rect x="38.5" y="35" width="1.4" height="2.4" fill="#1f4fbf" />
      <rect x="39.9" y="35" width="1.4" height="2.4" fill="#ffffff" />
      <rect x="41.3" y="35" width="1.4" height="2.4" fill="#d01414" />

      {/* La tête : oreilles, visage */}
      <ellipse cx="20.5" cy="19.5" rx="2.4" ry="3.2" fill="#eab894" stroke="#9c6a4a" strokeWidth="0.7" />
      <ellipse cx="43.5" cy="19.5" rx="2.4" ry="3.2" fill="#eab894" stroke="#9c6a4a" strokeWidth="0.7" />
      <ellipse cx="32" cy="18.5" rx="11.5" ry="12.5" fill="#f3c7a3" stroke="#9c6a4a" strokeWidth="1" />

      {/* Cheveux courts, raie sur le côté, un peu grisonnants sur les tempes */}
      <path d="M20.5 16 Q19 5 32 4.5 Q45 5 43.5 16 Q42 11 37 9.5 Q30 8.5 25 10.5 Q22 12.5 20.5 16 Z" fill="#4a3a30" stroke="#2a1f19" strokeWidth="0.8" />
      <path d="M25 10.5 Q28 7.5 34 7.2" stroke="#6b5a4f" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M20.8 15 Q21 13 22 12" stroke="#8a7a70" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M43.2 15 Q43 13 42 12" stroke="#8a7a70" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Sourcils, yeux bleus */}
      <path d="M24.5 15.2 Q27 13.8 29.5 15" stroke="#3a2c24" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M34.5 15 Q37 13.8 39.5 15.2" stroke="#3a2c24" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="27" cy="18.3" rx="2.1" ry="1.7" fill="#fff" />
      <ellipse cx="37" cy="18.3" rx="2.1" ry="1.7" fill="#fff" />
      <circle cx="27.4" cy="18.4" r="1.15" fill="#3b7dd8" />
      <circle cx="37.4" cy="18.4" r="1.15" fill="#3b7dd8" />
      <circle cx="27.5" cy="18.5" r="0.5" fill="#111" />
      <circle cx="37.5" cy="18.5" r="0.5" fill="#111" />

      {/* Nez et grand sourire */}
      <path d="M32.5 19.5 L33.5 23.5 L31.5 23.8" stroke="#b07a58" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M26.5 25.5 Q32 31 37.5 25.5 Z" fill="#fff" stroke="#7a3a2a" strokeWidth="0.9" strokeLinejoin="round" />
      <ellipse cx="24.5" cy="23.5" rx="1.8" ry="1" fill="#f0a08a" opacity="0.5" />
      <ellipse cx="39.5" cy="23.5" rx="1.8" ry="1" fill="#f0a08a" opacity="0.5" />

      {/* La même pioche que le joueur */}
      {couleurPioche !== null && <DessinPioche couleur={couleurPioche} />}

      {/* Le bras (manche de costume) et la main */}
      <ellipse cx="45" cy="43" rx="4" ry="6" fill="#22305a" stroke="#0a0f1e" strokeWidth="1" transform="rotate(-35 45 43)" />
      <circle cx="47.5" cy="40.5" r="2.9" fill="#f3c7a3" stroke="#9c6a4a" strokeWidth="0.7" />
    </svg>
  )
}
