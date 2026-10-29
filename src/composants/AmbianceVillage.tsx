// La vie du village (23/10) : ce qui bouge tout seul, juste pour faire joli.
//   - des oiseaux qui traversent le ciel, avec leur ombre sur le sol ;
//   - l'ombre des nuages qui glisse lentement sur la clairière.
// (29/10, demandé par le propriétaire) Plus de papillons.
// Tout est en CSS (voir « La vie du village » dans village.css) : rien à calculer à chaque image.
// Les places sont tirées une fois pour toutes (hasard à graine fixe).

import { memo, type CSSProperties } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { LARGEUR_MONDE } from './iso'

const hasard = aleatoireAvecGraine(2311)

const OISEAUX = Array.from({ length: 3 }, (_, i) => ({ y: 180 + i * 320 + hasard() * 120, duree: 26 + hasard() * 14, retard: -i * 11 - hasard() * 8, nombre: 2 + Math.floor(hasard() * 3) }))

const NUAGES = Array.from({ length: 4 }, (_, i) => ({ y: 150 + i * 300 + hasard() * 120, taille: 260 + hasard() * 220, duree: 90 + hasard() * 60, retard: -i * 35 - hasard() * 20 }))

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
