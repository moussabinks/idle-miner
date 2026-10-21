// Le personnage de profil, dans la vue en coupe de la mine (et sur l'écran d'accueil) : un hamster
// tout rond (le style des dessins du jeu). Le joueur n'a pas de casque au début, juste sa pioche
// (de la couleur de la pioche équipée) et sa tenue achetée au Bazar ; les mineurs employés ont un
// casque de la couleur de leur rareté. Rien dans la main si la pioche est cassée.
// Dessin en SVG pour rester net à toutes les tailles. Dans le village (vue du ciel), c'est
// Hamster.tsx qui dessine les personnages de trois quarts.

import type { IdTenue } from '../jeu/donnees'

export type ActionPersonnage = 'repos' | 'creuse' | 'marche' | 'grimpe'

// Ce que porte le personnage : un casque de mineur (sa couleur), ou la tenue du joueur.
export type Habits = { casque?: string | null; chapeau?: IdTenue | null; haut?: IdTenue | null }

type Props = {
  couleurPioche: string | null // null = mains nues
  action: ActionPersonnage
  versLaGauche?: boolean
  habits?: Habits
}

// Les couleurs du hamster (les mêmes que dans Hamster.tsx).
export const FOURRURE = '#ec8a3c'
export const FOURRURE_CLAIRE = '#f6a85a'
export const CREME = '#fde7c6'
export const CONTOUR = '#5a2a0c'

// La pioche tenue dans la main (en 47,5 ; 40,5) : un contour sombre puis la couleur.
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

// Le chapeau, de profil (centré sur le haut de la tête, en 38 ; 12).
function ChapeauProfil({ habits }: { habits: Habits }) {
  if (habits.casque) {
    return (
      <g>
        <path d="M24 17 Q25 4 38 3.5 Q51 4 52 15 Z" fill={habits.casque} stroke={CONTOUR} strokeWidth="1.1" />
        <path d="M29 8 Q34 5.5 40 6" stroke="rgb(255 255 255 / 0.55)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <rect x="22" y="14.5" width="33" height="3.6" rx="1.8" fill={habits.casque} stroke={CONTOUR} strokeWidth="0.9" />
        <rect x="47" y="7" width="5" height="6" rx="1.2" fill="#3d3d3d" />
        <circle className="lampe" cx="52.5" cy="10" r="2.2" fill="#fff6b0" />
      </g>
    )
  }
  switch (habits.chapeau) {
    case 'chantier':
      return (
        <g>
          <path d="M24 17 Q25 4 38 3.5 Q51 4 52 15 Z" fill="#f7c51d" stroke={CONTOUR} strokeWidth="1.1" />
          <rect x="22" y="14.5" width="33" height="3.6" rx="1.8" fill="#e2ab0c" stroke={CONTOUR} strokeWidth="0.9" />
        </g>
      )
    case 'bandana':
      return (
        <g>
          <path d="M25 16 Q27 7 38 7 Q49 7 51 15 Q38 12 25 16 Z" fill="#d93a3a" stroke={CONTOUR} strokeWidth="1" />
          <circle cx="30" cy="10" r="1" fill="#fff" />
          <circle cx="40" cy="9" r="1" fill="#fff" />
          <path d="M25 15 L18 19 L21 13 Z" fill="#b82c2c" stroke={CONTOUR} strokeWidth="0.8" />
        </g>
      )
    case 'casquette':
      return (
        <g>
          <path d="M26 15 Q27 5 38 5 Q49 5 50 14 Z" fill="#3f7fe0" stroke={CONTOUR} strokeWidth="1" />
          <path d="M48 13 Q56 12 59 15 Q53 16 48 15.5 Z" fill="#2b5fae" stroke={CONTOUR} strokeWidth="0.9" />
          <circle cx="38" cy="5.5" r="1.3" fill="#2b5fae" />
        </g>
      )
    case 'paille':
      return (
        <g>
          <ellipse cx="38" cy="13" rx="20" ry="4" fill="#e8c56a" stroke={CONTOUR} strokeWidth="1" />
          <path d="M28 13 Q29 3 38 3 Q47 3 48 13 Z" fill="#f0d27e" stroke={CONTOUR} strokeWidth="1" />
          <path d="M28.5 11 Q38 13 47.5 11" stroke="#c9402f" strokeWidth="2" fill="none" />
        </g>
      )
    case 'haut-de-forme':
      return (
        <g>
          <ellipse cx="38" cy="13" rx="15" ry="3" fill="#222" stroke="#000" strokeWidth="0.8" />
          <rect x="30" y="-4" width="16" height="17" rx="2" fill="#2a2a2a" stroke="#000" strokeWidth="0.8" />
          <rect x="30" y="8" width="16" height="3" fill="#b8323a" />
        </g>
      )
    case 'couronne':
      return (
        <g>
          <path d="M28 14 L28 4 L33 9 L38 2 L43 9 L48 4 L48 14 Z" fill="#ffd23f" stroke="#8a5a00" strokeWidth="1" strokeLinejoin="round" />
          <circle cx="38" cy="10" r="1.6" fill="#e0245e" />
        </g>
      )
    default:
      // Pas de chapeau : une petite mèche de poils sur le haut de la tête.
      return <path d="M34 13 Q36 8 39 11 Q41 7 43 12" stroke={CONTOUR} strokeWidth="1" fill={FOURRURE_CLAIRE} />
  }
}

// Le haut (gilet, salopette...), sur le ventre.
function HautProfil({ haut }: { haut: IdTenue | null | undefined }) {
  if (haut === 'salopette') {
    return (
      <g>
        <path d="M20 44 Q21 57 31 58.5 Q41 57 43 46 L43 43 L21 43 Z" fill="#3b6fc4" stroke={CONTOUR} strokeWidth="0.9" />
        <path d="M24 43 L27 31 M39 43 L37 31" stroke="#3b6fc4" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="26.5" cy="43" r="1.2" fill="#ffd23f" />
        <circle cx="38.5" cy="43" r="1.2" fill="#ffd23f" />
      </g>
    )
  }
  if (haut === 'gilet-cuir' || haut === 'gilet-or') {
    const couleur = haut === 'gilet-or' ? '#f2c23a' : '#7a4a22'
    return (
      <g>
        <path d="M16 38 Q16 55 27 58 L28 44 Q22 43 16 38 Z" fill={couleur} stroke={CONTOUR} strokeWidth="0.9" />
        <path d="M44 40 Q44 54 37 58 L36 45 Q41 44 44 40 Z" fill={couleur} stroke={CONTOUR} strokeWidth="0.9" />
        <circle cx="36.6" cy="49" r="0.9" fill={haut === 'gilet-or' ? '#fff3b0' : '#e2b34a'} />
        <circle cx="36.8" cy="53" r="0.9" fill={haut === 'gilet-or' ? '#fff3b0' : '#e2b34a'} />
      </g>
    )
  }
  // La tenue de départ : juste une ceinture en cuir avec une boucle dorée.
  return (
    <g>
      <path d="M15.5 47 Q30 52 46 47 L45.5 50.5 Q30 55.5 16 50.5 Z" fill="#6b3a17" stroke={CONTOUR} strokeWidth="0.7" />
      <rect x="33" y="48.6" width="5" height="4" rx="0.8" fill="#f2c23a" stroke="#8a5a00" strokeWidth="0.6" />
    </g>
  )
}

export function Personnage({ couleurPioche, action, versLaGauche = false, habits = {} }: Props) {
  return (
    <svg className={`personnage personnage-${action} ${versLaGauche ? 'vers-la-gauche' : ''}`} viewBox="0 0 64 64" role="img" aria-label="Le mineur">
      {/* Petite queue */}
      <circle cx="13.5" cy="47" r="3" fill={FOURRURE} stroke={CONTOUR} strokeWidth="0.9" />

      {/* Bottes */}
      <ellipse cx="25" cy="60" rx="6.2" ry="3" fill="#5b3417" stroke="#2c1608" strokeWidth="0.8" />
      <ellipse cx="38" cy="60" rx="6.2" ry="3" fill="#5b3417" stroke="#2c1608" strokeWidth="0.8" />

      {/* Corps tout rond, et le ventre crème */}
      <ellipse cx="30" cy="44" rx="16" ry="16" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1.3" />
      <ellipse cx="34.5" cy="47.5" rx="9.5" ry="10.5" fill={CREME} />
      <HautProfil haut={habits.casque ? undefined : habits.haut} />
      {/* Les mineurs employés portent un sac à dos */}
      {habits.casque && <path d="M12 33 Q9 45 14 52 Q19 55 22 50 L22 33 Q17 30 12 33 Z" fill="#7a4a22" stroke={CONTOUR} strokeWidth="1" />}

      {/* Tête : grosse et ronde, oreille rose, joues crème, museau, œil brillant, dents */}
      <circle cx="31" cy="12.5" r="5.6" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1" />
      <circle cx="31" cy="12.8" r="3.2" fill="#f3a3ae" />
      <circle cx="38" cy="25" r="13.5" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1.3" />
      <path d="M27 21 Q32 13 43 15" stroke={FOURRURE_CLAIRE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="44" cy="30.5" rx="8.5" ry="6.2" fill={CREME} />
      <circle cx="51.6" cy="26.8" r="2" fill="#f07f8c" stroke="#9c4a55" strokeWidth="0.5" />
      <circle cx="43.5" cy="22.5" r="2.5" fill="#1a0f08" />
      <circle cx="44.3" cy="21.6" r="0.9" fill="#fff" />
      <rect x="47.4" y="31" width="3" height="3.2" rx="0.6" fill="#fff" stroke="#b9a99a" strokeWidth="0.4" />
      <path d="M49 29.5 L57 28 M49 30.6 L57 31.6" stroke="#7a4a2a" strokeWidth="0.45" />

      <ChapeauProfil habits={habits} />

      {/* La pioche (elle pivote autour de la main) */}
      {couleurPioche !== null && <DessinPioche couleur={couleurPioche} />}

      {/* Le bras et la patte qui tient la pioche */}
      <ellipse cx="44.5" cy="43" rx="4" ry="6" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1" transform="rotate(-35 44.5 43)" />
      <circle cx="47.5" cy="40.5" r="3" fill="#6b3a17" stroke="#2c1608" strokeWidth="0.7" />
    </svg>
  )
}
