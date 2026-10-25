// La fenêtre du jeu (25/10) : la même partout (bâtiments, succès, statistiques, boutique...).
//   - un voile derrière (sombre, ou presque transparent pour les bâtiments : on voit le village) ;
//   - un bandeau de couleur en haut avec l'icône et le titre, et le bouton ✖ rond ;
//   - Échap ou un clic à côté la ferment (sauf si « fermable » est faux) ;
//   - « pied » : les boutons du bas (« Continuer », « Annuler »...).
// Sur téléphone, elle monte du bas de l'écran (voir src/styles/theme.css).

import { useEffect, useId, type ReactNode } from 'react'
import { t } from '../jeu/langue'

export type CouleurFenetre = 'vert' | 'jaune' | 'bleu' | 'rose' | 'violet' | 'orange' | 'creme'

type Props = {
  titre: ReactNode
  icone?: string
  couleur?: CouleurFenetre
  taille?: 'petite' | 'moyenne' | 'grande'
  voile?: 'sombre' | 'clair'
  devant?: boolean // au-dessus de tout (pendant le tutoriel, une confirmation...)
  fermable?: boolean // false : pas de ✖, ni Échap, ni clic à côté (il faut choisir en bas)
  onFermer: () => void
  pied?: ReactNode
  classe?: string // une classe de plus sur la fenêtre (pour placer son contenu)
  children: ReactNode
}

export function Fenetre({ titre, icone, couleur = 'vert', taille = 'moyenne', voile = 'sombre', devant = false, fermable = true, onFermer, pied, classe = '', children }: Props) {
  const idTitre = useId()

  // Échap ferme la fenêtre.
  useEffect(() => {
    if (!fermable) return
    function touche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [fermable, onFermer])

  return (
    <div
      className={`voile ${voile === 'clair' ? 'voile-clair' : ''} ${devant ? 'voile-devant' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      onClick={fermable ? onFermer : undefined}
    >
      <div className={`fenetre ${taille === 'moyenne' ? '' : `fenetre-${taille}`} ${classe}`} onClick={(e) => e.stopPropagation()}>
        <header className={`fenetre-entete ${couleur === 'vert' ? '' : `fenetre-entete-${couleur}`}`}>
          {icone && (
            <span className="fenetre-icone" aria-hidden="true">
              {icone}
            </span>
          )}
          <h2 id={idTitre}>{titre}</h2>
          {fermable && (
            <button className="btn btn-blanc btn-rond" onClick={onFermer} aria-label={t('Fermer')}>
              ✖
            </button>
          )}
        </header>
        <div className="fenetre-corps">{children}</div>
        {pied && <footer className="fenetre-pied">{pied}</footer>}
      </div>
    </div>
  )
}
