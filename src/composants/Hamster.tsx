// Les personnages du village (vue du ciel) : des hamsters de trois quarts, dans le style des
// dessins du jeu (fourrure orange, ventre crème, oreilles roses, bottes en cuir).
//   - le joueur : sans casque au début, sa pioche à la main, et la tenue achetée au Bazar ;
//   - les mineurs employés : un casque de la couleur de leur rareté, un sac à dos, leur pioche ;
//   - le manager : gilet rayé, chemise et cravate rouge, un porte-documents ;
//   - le recruteur : casquette verte, lunettes rondes, manteau vert et nœud papillon.
// On les voit de face quand ils viennent vers nous, de dos quand ils s'éloignent. Ils se
// retournent en douceur (gauche / droite) et sautillent en marchant (voir village.css).

import type { IdTenue } from '../jeu/donnees'
import { CONTOUR, CREME, FOURRURE, FOURRURE_CLAIRE } from './Personnage'

export type RoleHamster = 'joueur' | 'mineur' | 'manager' | 'recruteur'

type Props = {
  role: RoleHamster
  vue?: 'face' | 'dos'
  couleurPioche?: string | null // la pioche à la main (null = rien)
  casque?: string // la couleur du casque (mineurs)
  chapeau?: IdTenue | null
  haut?: IdTenue | null
  charge?: boolean // il porte un sac de minerais (un mineur qui va au marché)
}

// ---------------------------------------------------------------------------
// Les chapeaux
// ---------------------------------------------------------------------------

function Chapeau({ role, casque, chapeau, dos }: { role: RoleHamster; casque?: string; chapeau?: IdTenue | null; dos: boolean }) {
  if (role === 'mineur' || chapeau === 'chantier') {
    const couleur = role === 'mineur' ? (casque ?? '#f7c51d') : '#f7c51d'
    return (
      <g>
        <path d="M18 34 Q20 6 52 5 Q84 6 86 34 Z" fill={couleur} stroke={CONTOUR} strokeWidth="1.8" />
        <path d="M30 18 Q42 9 56 10" stroke="rgb(255 255 255 / 0.5)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M13 34 Q52 42 91 34 L90 39 Q52 47 14 39 Z" fill={couleur} stroke={CONTOUR} strokeWidth="1.5" />
        <path d="M48 6 L48 33" stroke="rgb(0 0 0 / 0.18)" strokeWidth="3" />
        {!dos && role === 'mineur' && (
          <g>
            <rect x="55" y="17" width="16" height="12" rx="3" fill="#4a3a2a" stroke={CONTOUR} strokeWidth="1.2" />
            <circle className="lampe-frontale" cx="63" cy="23" r="5" fill="#fff6b0" stroke="#b88a16" strokeWidth="1" />
          </g>
        )}
      </g>
    )
  }
  if (role === 'recruteur') {
    return (
      <g>
        <path d="M22 30 Q22 8 52 8 Q82 8 82 30 Z" fill="#3e5a2e" stroke={CONTOUR} strokeWidth="1.6" />
        {!dos && <path d="M48 28 Q75 25 92 33 Q72 38 48 34 Z" fill="#2e4622" stroke={CONTOUR} strokeWidth="1.4" />}
        <circle cx="52" cy="18" r="4" fill="#e2b34a" stroke="#8a5a00" strokeWidth="1" />
      </g>
    )
  }
  switch (chapeau) {
    case 'bandana':
      return (
        <g>
          <path d="M20 30 Q24 10 52 10 Q80 10 84 30 Q52 22 20 30 Z" fill="#d93a3a" stroke={CONTOUR} strokeWidth="1.5" />
          {[30, 44, 58, 72].map((x) => (
            <circle key={x} cx={x} cy={19} r="1.6" fill="#fff" />
          ))}
          <path d="M20 29 L8 36 L13 25 Z" fill="#b82c2c" stroke={CONTOUR} strokeWidth="1.2" />
        </g>
      )
    case 'casquette':
      return (
        <g>
          <path d="M22 29 Q22 8 52 8 Q82 8 82 29 Z" fill="#3f7fe0" stroke={CONTOUR} strokeWidth="1.6" />
          {!dos && <path d="M50 27 Q76 24 93 32 Q72 37 50 33 Z" fill="#2b5fae" stroke={CONTOUR} strokeWidth="1.4" />}
          <circle cx="52" cy="9" r="3" fill="#2b5fae" />
        </g>
      )
    case 'paille':
      return (
        <g>
          <ellipse cx="52" cy="28" rx="44" ry="10" fill="#e8c56a" stroke={CONTOUR} strokeWidth="1.5" />
          <path d="M28 28 Q30 4 52 4 Q74 4 76 28 Z" fill="#f0d27e" stroke={CONTOUR} strokeWidth="1.5" />
          <path d="M29 23 Q52 28 75 23" stroke="#c9402f" strokeWidth="4" fill="none" />
        </g>
      )
    case 'haut-de-forme':
      return (
        <g>
          <ellipse cx="52" cy="27" rx="30" ry="7" fill="#222" stroke="#000" strokeWidth="1.2" />
          <rect x="35" y="-10" width="34" height="37" rx="4" fill="#2a2a2a" stroke="#000" strokeWidth="1.2" />
          <rect x="35" y="16" width="34" height="6" fill="#b8323a" />
        </g>
      )
    case 'couronne':
      return (
        <g>
          <path d="M30 26 L30 6 L41 16 L52 0 L63 16 L74 6 L74 26 Z" fill="#ffd23f" stroke="#8a5a00" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="52" cy="18" r="3.4" fill="#e0245e" />
          <circle cx="38" cy="21" r="2" fill="#3fa9f5" />
          <circle cx="66" cy="21" r="2" fill="#3fe07a" />
        </g>
      )
    default:
      // Pas de chapeau : une petite houppette de poils sur le haut de la tête.
      return <path d="M42 16 Q46 4 52 12 Q57 2 62 14" stroke={CONTOUR} strokeWidth="1.6" fill={FOURRURE_CLAIRE} strokeLinejoin="round" />
  }
}

// ---------------------------------------------------------------------------
// Les habits (sur le corps)
// ---------------------------------------------------------------------------

function Habits({ role, haut }: { role: RoleHamster; haut?: IdTenue | null }) {
  if (role === 'manager') {
    return (
      <g>
        {/* Chemise blanche et cravate rouge, sous un gilet brun rayé */}
        <path d="M38 70 L52 84 L66 70 L66 108 L38 108 Z" fill="#f4efe6" />
        <path d="M52 76 L48 82 L52 102 L56 82 Z" fill="#c8202c" stroke="#7a1018" strokeWidth="1" />
        <path d="M27 76 Q26 104 40 112 L46 112 L47 82 Q36 80 27 76 Z" fill="#4a2c1a" stroke={CONTOUR} strokeWidth="1.3" />
        <path d="M77 76 Q78 104 64 112 L58 112 L57 82 Q68 80 77 76 Z" fill="#4a2c1a" stroke={CONTOUR} strokeWidth="1.3" />
        {[33, 39, 66, 72].map((x) => (
          <path key={x} d={`M${x} 82 L${x} 108`} stroke="rgb(255 255 255 / 0.14)" strokeWidth="1" />
        ))}
        <circle cx="45" cy="92" r="1.6" fill="#e2b34a" />
        <circle cx="45" cy="100" r="1.6" fill="#e2b34a" />
        <path d="M58 96 Q66 101 72 96" stroke="#e2b34a" strokeWidth="1.4" fill="none" />
      </g>
    )
  }
  if (role === 'recruteur') {
    return (
      <g>
        <path d="M24 74 Q20 106 34 114 L46 114 L48 80 Q34 80 24 74 Z" fill="#3e5a2e" stroke={CONTOUR} strokeWidth="1.3" />
        <path d="M80 74 Q84 106 70 114 L58 114 L56 80 Q70 80 80 74 Z" fill="#3e5a2e" stroke={CONTOUR} strokeWidth="1.3" />
        <path d="M34 92 L42 96 M70 92 L62 96" stroke="#e2b34a" strokeWidth="2" />
        <path d="M44 74 L52 79 L60 74 L60 82 L52 79 L44 82 Z" fill="#c8202c" stroke="#7a1018" strokeWidth="1" />
      </g>
    )
  }
  if (role === 'mineur') {
    return (
      <g>
        <path d="M30 78 L40 112 M74 78 L64 112" stroke="#6b3a17" strokeWidth="4" strokeLinecap="round" />
        <path d="M26 96 Q52 104 78 96 L77 102 Q52 110 27 102 Z" fill="#6b3a17" stroke={CONTOUR} strokeWidth="1" />
        <rect x="47" y="98" width="9" height="7" rx="1.5" fill="#f2c23a" stroke="#8a5a00" strokeWidth="1" />
      </g>
    )
  }
  // Le joueur : sa tenue (au début, juste une ceinture).
  if (haut === 'salopette') {
    return (
      <g>
        <path d="M30 92 Q32 114 52 116 Q72 114 74 92 L74 88 L30 88 Z" fill="#3b6fc4" stroke={CONTOUR} strokeWidth="1.3" />
        <path d="M36 88 L40 70 M68 88 L64 70" stroke="#3b6fc4" strokeWidth="5" strokeLinecap="round" />
        <circle cx="38" cy="88" r="2.4" fill="#ffd23f" />
        <circle cx="66" cy="88" r="2.4" fill="#ffd23f" />
        <rect x="44" y="96" width="16" height="10" rx="2" fill="#2f5aa3" stroke={CONTOUR} strokeWidth="1" />
      </g>
    )
  }
  if (haut === 'gilet-cuir' || haut === 'gilet-or') {
    const couleur = haut === 'gilet-or' ? '#f2c23a' : '#7a4a22'
    const bouton = haut === 'gilet-or' ? '#fff3b0' : '#e2b34a'
    return (
      <g>
        <path d="M26 76 Q24 106 40 114 L46 114 L47 82 Q35 81 26 76 Z" fill={couleur} stroke={CONTOUR} strokeWidth="1.3" />
        <path d="M78 76 Q80 106 64 114 L58 114 L57 82 Q69 81 78 76 Z" fill={couleur} stroke={CONTOUR} strokeWidth="1.3" />
        <circle cx="61" cy="92" r="1.8" fill={bouton} />
        <circle cx="61" cy="101" r="1.8" fill={bouton} />
      </g>
    )
  }
  return (
    <g>
      <path d="M25 96 Q52 104 79 96 L78 102 Q52 110 26 102 Z" fill="#6b3a17" stroke={CONTOUR} strokeWidth="1" />
      <rect x="47" y="98" width="9" height="7" rx="1.5" fill="#f2c23a" stroke="#8a5a00" strokeWidth="1" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Ce qu'il tient
// ---------------------------------------------------------------------------

function PiocheEpaule({ couleur }: { couleur: string }) {
  // La pioche posée sur l'épaule (le manche dans la patte droite).
  return (
    <g>
      <path d="M80 92 L64 40" stroke="#2a1a0c" strokeWidth="6" strokeLinecap="round" />
      <path d="M80 92 L64 40" stroke="#9a6532" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M46 46 Q62 30 84 40" stroke="#141414" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M46 46 Q62 30 84 40" stroke={couleur} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M52 40 Q62 33 74 36" stroke="rgb(255 255 255 / 0.5)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  )
}

function PorteDocuments() {
  return (
    <g>
      <rect x="10" y="76" width="20" height="26" rx="2" fill="#8a5a2b" stroke={CONTOUR} strokeWidth="1.3" transform="rotate(-12 20 89)" />
      <rect x="13" y="80" width="14" height="18" fill="#f4efe6" transform="rotate(-12 20 89)" />
      <path d="M15 85 L24 83 M16 89 L25 87 M17 93 L24 91.5" stroke="#9a8a7a" strokeWidth="1.2" />
      <rect x="16" y="75" width="8" height="4" rx="1" fill="#c9a23a" transform="rotate(-12 20 89)" />
    </g>
  )
}

function SacMinerais() {
  return (
    <g>
      <path d="M8 66 Q2 86 14 94 Q26 98 30 86 Q32 70 20 64 Z" fill="#c8a36a" stroke={CONTOUR} strokeWidth="1.4" />
      <path d="M14 64 Q18 58 24 63" stroke={CONTOUR} strokeWidth="1.6" fill="none" />
      <circle cx="16" cy="70" r="3" fill="#4ee8dc" />
      <circle cx="22" cy="74" r="2.6" fill="#ffd84a" />
      <circle cx="13" cy="76" r="2.4" fill="#e04848" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Le hamster
// ---------------------------------------------------------------------------

export function Hamster({ role, vue = 'face', couleurPioche = null, casque, chapeau, haut, charge = false }: Props) {
  const dos = vue === 'dos'
  return (
    <svg className={`hamster hamster-${role} ${dos ? 'hamster-dos' : ''}`} viewBox="-6 -12 112 136" aria-hidden="true">
      <g className="hamster-corps">
        {/* Les bottes */}
        <ellipse className="pied pied-g" cx="38" cy="116" rx="11" ry="6" fill="#5b3417" stroke="#2c1608" strokeWidth="1.3" />
        <ellipse className="pied pied-d" cx="64" cy="116" rx="11" ry="6" fill="#5b3417" stroke="#2c1608" strokeWidth="1.3" />

        {/* Le sac à dos des mineurs (de dos, il est devant tout le reste) */}
        {role === 'mineur' && !dos && <path d="M10 70 Q4 92 14 104 L26 104 L26 70 Z" fill="#7a4a22" stroke={CONTOUR} strokeWidth="1.4" />}

        {/* Le corps tout rond */}
        <ellipse cx="52" cy="90" rx="28" ry="26" fill={FOURRURE} stroke={CONTOUR} strokeWidth="2" />
        {!dos && <ellipse cx="54" cy="96" rx="18" ry="17" fill={CREME} />}
        {dos && <circle cx="52" cy="108" r="5" fill={FOURRURE_CLAIRE} stroke={CONTOUR} strokeWidth="1.4" />}
        {!dos && <Habits role={role} haut={haut} />}
        {dos && role === 'mineur' && (
          <g>
            <rect x="32" y="70" width="40" height="36" rx="8" fill="#7a4a22" stroke={CONTOUR} strokeWidth="1.6" />
            <rect x="36" y="64" width="32" height="10" rx="5" fill="#c8a36a" stroke={CONTOUR} strokeWidth="1.3" />
            <rect x="46" y="84" width="12" height="8" rx="1.5" fill="#f2c23a" stroke="#8a5a00" strokeWidth="1" />
          </g>
        )}
        {dos && (role === 'manager' || role === 'recruteur') && (
          <path d="M26 76 Q22 106 38 114 L66 114 Q82 106 78 76 Q52 84 26 76 Z" fill={role === 'manager' ? '#4a2c1a' : '#3e5a2e'} stroke={CONTOUR} strokeWidth="1.4" />
        )}

        {/* Les bras et les pattes */}
        <ellipse cx="25" cy="88" rx="7" ry="11" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1.6" transform="rotate(20 25 88)" />
        <ellipse cx="79" cy="88" rx="7" ry="11" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1.6" transform="rotate(-20 79 88)" />
        {charge && <SacMinerais />}
        {!dos && (role === 'manager' || role === 'recruteur') && <PorteDocuments />}
        {couleurPioche && !dos && <PiocheEpaule couleur={couleurPioche} />}
        <circle cx="22" cy="97" r="5.5" fill="#6b3a17" stroke="#2c1608" strokeWidth="1.2" />
        <circle cx="81" cy="96" r="5.5" fill="#6b3a17" stroke="#2c1608" strokeWidth="1.2" />

        {/* La tête : les oreilles roses, la fourrure, les joues crème */}
        <circle cx="26" cy="27" r="11" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1.8" />
        <circle cx="78" cy="26" r="11" fill={FOURRURE} stroke={CONTOUR} strokeWidth="1.8" />
        {!dos && <circle cx="26.5" cy="27.5" r="6.4" fill="#f3a3ae" />}
        {!dos && <circle cx="77.5" cy="26.5" r="6.4" fill="#f3a3ae" />}
        <ellipse cx="52" cy="50" rx="32" ry="28" fill={FOURRURE} stroke={CONTOUR} strokeWidth="2" />
        <path d="M30 36 Q44 22 66 25" stroke={FOURRURE_CLAIRE} strokeWidth="6" fill="none" strokeLinecap="round" />
        {!dos && (
          <g>
            <ellipse cx="55" cy="62" rx="22" ry="14" fill={CREME} />
            {/* Les yeux brillants */}
            <ellipse cx="44" cy="50" rx="5.6" ry="6.2" fill="#1a0f08" />
            <ellipse cx="65" cy="50" rx="5.6" ry="6.2" fill="#1a0f08" />
            <circle cx="46" cy="47.5" r="2" fill="#fff" />
            <circle cx="67" cy="47.5" r="2" fill="#fff" />
            {role === 'manager' && <path d="M37 40 L50 43 M72 40 L60 43" stroke={CONTOUR} strokeWidth="2.4" strokeLinecap="round" />}
            {/* Le nez rose, la bouche et les deux dents */}
            <ellipse cx="56" cy="58" rx="3.6" ry="2.6" fill="#f07f8c" stroke="#9c4a55" strokeWidth="0.8" />
            <path d="M50 63 Q56 67 62 63" stroke={CONTOUR} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <rect x="53" y="64" width="6" height="5" rx="1" fill="#fff" stroke="#b9a99a" strokeWidth="0.6" />
            <path d="M68 60 L84 57 M68 63 L84 65 M44 60 L30 57 M44 63 L30 65" stroke="#7a4a2a" strokeWidth="0.8" />
            {/* Les joues roses */}
            <ellipse cx="38" cy="60" rx="5" ry="3" fill="#f3a3ae" opacity="0.55" />
            <ellipse cx="72" cy="60" rx="5" ry="3" fill="#f3a3ae" opacity="0.55" />
            {role === 'recruteur' && (
              <g fill="none" stroke="#c9a23a" strokeWidth="2">
                <circle cx="44" cy="50" r="8.5" />
                <circle cx="65" cy="50" r="8.5" />
                <path d="M52.5 50 L56.5 50" />
              </g>
            )}
          </g>
        )}
        <Chapeau role={role} casque={casque} chapeau={chapeau} dos={dos} />
      </g>
    </svg>
  )
}
