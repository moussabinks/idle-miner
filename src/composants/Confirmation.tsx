// Une fenêtre de confirmation dans le style du jeu (au lieu de la boîte grise du navigateur, qui
// ne marche pas toujours quand le jeu est dans la page d'un autre site) : un titre, une
// explication, et deux boutons : confirmer et annuler. Échap ou un clic à côté annulent.

import type { ReactNode } from 'react'
import { t } from '../jeu/langue'
import { Fenetre } from './Fenetre'

type Props = {
  titre: string
  children: ReactNode // l'explication
  texteConfirmer?: string
  danger?: boolean // le bouton Confirmer est rose (supprimer, licencier, recommencer...)
  possible?: boolean // false : le bouton Confirmer est grisé (pas assez d'argent, par exemple)
  onConfirmer: () => void
  onAnnuler: () => void
}

export function Confirmation({ titre, children, texteConfirmer, danger = false, possible = true, onConfirmer, onAnnuler }: Props) {
  return (
    <Fenetre
      titre={titre}
      icone={danger ? '⚠️' : '❓'}
      couleur={danger ? 'rose' : 'jaune'}
      taille="petite"
      classe="fenetre-confirmation"
      devant
      onFermer={onAnnuler}
      pied={
        <>
          <button className="btn btn-blanc" onClick={onAnnuler}>
            {t('Annuler')}
          </button>
          <button className={`btn ${danger ? 'btn-rose' : 'btn-jaune'}`} onClick={onConfirmer} disabled={!possible} autoFocus>
            {texteConfirmer ?? t('Confirmer')}
          </button>
        </>
      }
    >
      <div className="confirmation-message">{children}</div>
    </Fenetre>
  )
}
