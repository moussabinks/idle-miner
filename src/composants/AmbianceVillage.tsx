// La vie du village (23/10) : ce qui bouge tout seul, juste pour faire joli.
//   - des papillons qui volettent au-dessus de l'herbe ;
//   - des oiseaux qui traversent le ciel, avec leur ombre sur le sol ;
//   - l'ombre des nuages qui glisse lentement sur la clairière.
// Tout est en CSS (voir « La vie du village » dans village.css) : rien à calculer à chaque image.
// Les places sont tirées une fois pour toutes (hasard à graine fixe).

import { memo, type CSSProperties } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { LARGEUR_MONDE, versEcran } from './iso'

const COULEURS_PAPILLONS = ['#ffd84a', '#ff8fb1', '#8fd3ff', '#ffffff', '#ffa94d', '#c9a2ff']

const hasard = aleatoireAvecGraine(2311)

const PAPILLONS = Array.from({ length: 9 }, (_, i) => {
  const e = versEcran(6 + hasard() * (TAILLE_GRILLE - 12), 6 + hasard() * (TAILLE_GRILLE - 12))
  return { x: e.x, y: e.y, couleur: COULEURS_PAPILLONS[i % COULEURS_PAPILLONS.length], duree: 14 + hasard() * 10, retard: -hasard() * 20, sens: hasard() < 0.5 ? 1 : -1 }
})

const OISEAUX = Array.from({ length: 3 }, (_, i) => ({ y: 180 + i * 320 + hasard() * 120, duree: 26 + hasard() * 14, retard: -i * 11 - hasard() * 8, nombre: 2 + Math.floor(hasard() * 3) }))

const NUAGES = Array.from({ length: 4 }, (_, i) => ({ y: 150 + i * 300 + hasard() * 120, taille: 260 + hasard() * 220, duree: 90 + hasard() * 60, retard: -i * 35 - hasard() * 20 }))

// Un papillon : deux ailes qui battent (vu de dessus).
function Papillon({ couleur }: { couleur: string }) {
  return (
    <svg className="papillon-dessin" viewBox="-6 -5 12 10" width="12" height="10">
      <g className="aile-gauche">
        <ellipse cx="-2.6" cy="-1.4" rx="2.8" ry="2.2" fill={couleur} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.4" />
        <ellipse cx="-2" cy="1.8" rx="1.8" ry="1.5" fill={couleur} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.4" />
      </g>
      <g className="aile-droite">
        <ellipse cx="2.6" cy="-1.4" rx="2.8" ry="2.2" fill={couleur} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.4" />
        <ellipse cx="2" cy="1.8" rx="1.8" ry="1.5" fill={couleur} stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.4" />
      </g>
      <rect x="-0.4" y="-3" width="0.8" height="6" rx="0.4" fill="#3a2410" />
    </svg>
  )
}

// Un oiseau en « V » qui bat des ailes.
function Oiseau() {
  return (
    <svg className="oiseau-dessin" viewBox="-8 -4 16 8" width="16" height="8">
      <path d="M-7 -1 Q-3.5 -3.5 0 0 Q3.5 -3.5 7 -1" fill="none" stroke="#3a2a1a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export const AmbianceVillage = memo(function AmbianceVillage() {
  return (
    <div className="ambiance-village" aria-hidden="true">
      {NUAGES.map((n, i) => (
        <div
          key={`n${i}`}
          className="ombre-nuage"
          style={{ top: n.y, width: n.taille, height: n.taille * 0.45, animationDuration: `${n.duree}s`, animationDelay: `${n.retard}s`, ['--largeur-monde' as string]: `${LARGEUR_MONDE}px` } as CSSProperties}
        />
      ))}
      {PAPILLONS.map((p, i) => (
        <div
          key={`p${i}`}
          className="papillon"
          style={{ left: p.x, top: p.y - 18, animationDuration: `${p.duree}s`, animationDelay: `${p.retard}s`, scale: `${p.sens} 1` } as CSSProperties}
        >
          <Papillon couleur={p.couleur} />
        </div>
      ))}
      {OISEAUX.map((o, i) => (
        <div
          key={`o${i}`}
          className="vol-oiseaux"
          style={{ top: o.y, animationDuration: `${o.duree}s`, animationDelay: `${o.retard}s`, ['--largeur-monde' as string]: `${LARGEUR_MONDE}px` } as CSSProperties}
        >
          {Array.from({ length: o.nombre }, (_, k) => (
            <span key={k} className="oiseau" style={{ left: k * 18, top: (k % 2) * 10 + k * 3, animationDelay: `${-k * 0.15}s` }}>
              <Oiseau />
              {/* Son ombre, plus bas sur l'herbe. */}
              <span className="ombre-oiseau" />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
})
