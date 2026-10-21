// Les « +X $ » qui s'envolent : en grand au milieu de l'écran pour tes ventes (avec une gerbe de
// pièces), en petit pour le reste (le wagonnet qui vend le coffre, par exemple).

import type { Gain } from '../usePartie'

const PIECES_VENTE = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  return { dx: Math.round(Math.cos(angle) * (60 + (i % 3) * 18)), dy: Math.round(Math.sin(angle) * (40 + (i % 2) * 16)) - 20 }
})

export function Gains({ gains }: { gains: Gain[] }) {
  return (
    <>
      <div className="ventes" aria-hidden="true">
        {gains
          .filter((g) => g.vente)
          .map((g) => (
            <span key={g.id} className="gain-vente">
              <span className="gain-vente-texte">+{Math.round(g.montant).toLocaleString('fr-FR')} $</span>
              {PIECES_VENTE.map((p, i) => (
                <i key={i} className="piece" style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, animationDelay: `${(i % 4) * 40}ms` }} />
              ))}
            </span>
          ))}
      </div>
      <div className="gains gains-village" aria-hidden="true">
        {gains
          .filter((g) => !g.vente)
          .map((g) => (
            <span key={g.id} className="gain">
              +{Math.round(g.montant).toLocaleString('fr-FR')} $
            </span>
          ))}
      </div>
    </>
  )
}
