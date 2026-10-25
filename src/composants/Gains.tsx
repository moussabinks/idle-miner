// Les « +X $ » qui s'envolent (25/10, nouveau style : une grosse étiquette jaune au contour
// sombre). En grand au milieu de l'écran pour tes ventes (avec une gerbe de pièces), en petit
// en haut pour le reste (le wagonnet qui vend le coffre, par exemple).
// Le style est dans src/styles/fenetres.css (« Les gains »).

import { nombre } from '../jeu/langue'
import type { Gain } from '../usePartie'

const PIECES_VENTE = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2
  return { dx: Math.round(Math.cos(angle) * (70 + (i % 3) * 18)), dy: Math.round(Math.sin(angle) * (44 + (i % 2) * 16)) - 20 }
})

export function Gains({ gains }: { gains: Gain[] }) {
  return (
    <>
      <div className="envol-ventes" aria-hidden="true">
        {gains
          .filter((g) => g.vente)
          .map((g) => (
            <span key={g.id} className="envol-vente">
              {PIECES_VENTE.map((p, i) => (
                <i key={i} className="envol-piece" style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, animationDelay: `${(i % 4) * 40}ms` }} />
              ))}
              <span className="envol-vente-texte">+{nombre(Math.round(g.montant))} $</span>
            </span>
          ))}
      </div>
      <div className="envol-petits" aria-hidden="true">
        {gains
          .filter((g) => !g.vente)
          .map((g) => (
            <span key={g.id} className="envol-petit">
              +{nombre(Math.round(g.montant))} $
            </span>
          ))}
      </div>
    </>
  )
}
