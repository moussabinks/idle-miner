// Une fenêtre de confirmation dans le style du jeu (au lieu de la boîte grise du navigateur) :
// un titre, une explication, et deux boutons : confirmer (vert) et annuler (rouge).
// Échap ou un clic à côté de la fenêtre annulent.

import { useEffect, type ReactNode } from 'react'

type Props = {
  titre: string
  children: ReactNode // l'explication
  texteConfirmer?: string
  possible?: boolean // false : le bouton Confirmer est grisé (pas assez d'argent, par exemple)
  onConfirmer: () => void
  onAnnuler: () => void
  classe?: string // une classe de plus sur le voile (« voile-devant » : au-dessus du tutoriel)
}

export function Confirmation({ titre, children, texteConfirmer = 'Confirmer', possible = true, onConfirmer, onAnnuler, classe = '' }: Props) {
  // Échap ferme la fenêtre sans rien faire.
  useEffect(() => {
    function touche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onAnnuler()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [onAnnuler])

  return (
    <div className={`voile ${classe}`} role="dialog" aria-modal="true" aria-labelledby="titre-confirmation" onClick={onAnnuler}>
      <div className="carte fenetre-confirmation" onClick={(e) => e.stopPropagation()}>
        <h2 id="titre-confirmation">{titre}</h2>
        <div className="confirmation-message">{children}</div>
        <div className="boutons boutons-centre">
          <button className="bouton bouton-vendre" onClick={onConfirmer} disabled={!possible} autoFocus>
            ✔ {texteConfirmer}
          </button>
          <button className="bouton bouton-stop" onClick={onAnnuler}>
            ✖ Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
