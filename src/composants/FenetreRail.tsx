// La fenêtre d'un rail qui ne relie encore rien (30/10) : on le touche, et on peut le déplacer
// (comme un bâtiment) ou le retirer (ses 3 fer sont rendus). Quand le rail fait partie d'un
// trajet, ces deux boutons sont en bas de la fenêtre des trajets (FenetreTrajet).

import { useEffect } from 'react'
import { COUT_RAIL } from '../jeu/donnees'

type Props = {
  onDeplacer: () => void
  onRetirer: () => void
  onFermer: () => void
}

// Les deux boutons d'un rail, les mêmes dans les deux fenêtres.
export function BoutonsRail({ onDeplacer, onRetirer }: Pick<Props, 'onDeplacer' | 'onRetirer'>) {
  return (
    <div className="boutons boutons-centre boutons-rail">
      <button className="bouton bouton-petit bouton-neutre" onClick={onDeplacer}>
        ✏️ Déplacer ce rail
      </button>
      <button className="bouton bouton-petit bouton-stop" onClick={onRetirer}>
        🗑️ Retirer (+{COUT_RAIL.materiaux.fer} 🔩 fer)
      </button>
    </div>
  )
}

export function FenetreRail({ onDeplacer, onRetirer, onFermer }: Props) {
  // Échap ferme la fenêtre.
  useEffect(() => {
    function clavier(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', clavier)
    return () => window.removeEventListener('keydown', clavier)
  }, [onFermer])

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-fenetre-rail" onClick={onFermer}>
      <div className="carte fenetre-rail" onClick={(e) => e.stopPropagation()}>
        <div className="entete-trajet">
          <h2 id="titre-fenetre-rail">🛤️ Rail</h2>
          <button className="bouton-fermer" onClick={onFermer} aria-label="Fermer">
            ✖
          </button>
        </div>
        <p className="discret">
          Ce rail ne relie encore rien. Continue la voie jusqu’à un autre bâtiment (mine, marché, foreuse, générateur) : un wagonnet pourra y faire
          des voyages.
        </p>
        <BoutonsRail onDeplacer={onDeplacer} onRetirer={onRetirer} />
      </div>
    </div>
  )
}
