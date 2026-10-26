// La barre de la réorganisation du village (26/10, demandé par le propriétaire, façon Clash of
// Clans) : tous les bâtiments rangés, les rails et les pavés, en bas de l'écran. On en touche un,
// il apparaît sur la carte, on le place, puis ✔. On ne peut finir qu'une fois tous les bâtiments
// posés ; les rails et les pavés qui restent vont dans le stock (menu Bâtiments).
// Aucune règle du jeu ici : voir src/jeu/reorganiser.ts.

import { cheminPublic } from '../chemins'
import { BATIMENTS, type IdBatiment } from '../jeu/donnees'
import { nombre, t } from '../jeu/langue'
import type { TypeSol } from '../jeu/batiments'
import { IMAGES_BATIMENTS } from './iso'

type Props = {
  ranges: IdBatiment[] // les bâtiments encore dans la barre
  rails: number
  chemins: number
  peutTerminer: boolean
  onPoser: (id: IdBatiment) => void
  onPinceau: (sol: TypeSol) => void
  onAnnuler: () => void
  onTerminer: () => void
}

export function BarreReorganisation({ ranges, rails, chemins, peutTerminer, onPoser, onPinceau, onAnnuler, onTerminer }: Props) {
  return (
    <div className="barre-edition barre-reorganisation">
      <p className="consigne">
        🏡{' '}
        {ranges.length > 0
          ? ranges.length > 1
            ? t('Touche un bâtiment de la barre, puis place-le. Encore {n} bâtiments à poser.', { n: ranges.length })
            : t('Touche un bâtiment de la barre, puis place-le. Encore 1 bâtiment à poser.')
          : t('Tous les bâtiments sont posés ! Les rails et les pavés qui restent iront dans le stock.')}{' '}
        <span className="discret">{t('Le jeu est en pause.')}</span>
      </p>
      <div className="reorganisation-objets" role="list">
        {ranges.map((id) => (
          <button key={id} role="listitem" className="reorganisation-objet" onClick={() => onPoser(id)}>
            <img src={IMAGES_BATIMENTS[id]} alt="" draggable={false} />
            <span className="reorganisation-nom">{t(BATIMENTS[id].nom)}</span>
          </button>
        ))}
        {rails > 0 && (
          <button role="listitem" className="reorganisation-objet reorganisation-sol" onClick={() => onPinceau('rail')}>
            <img src={cheminPublic('/images/batiments/rails.svg')} alt="" draggable={false} />
            <span className="reorganisation-nom">{t('Rails')}</span>
            <span className="pastille">×{nombre(rails)}</span>
          </button>
        )}
        {chemins > 0 && (
          <button role="listitem" className="reorganisation-objet reorganisation-sol" onClick={() => onPinceau('chemin')}>
            <span className="reorganisation-icone" aria-hidden="true">
              🪨
            </span>
            <span className="reorganisation-nom">{t('Pavés')}</span>
            <span className="pastille">×{nombre(chemins)}</span>
          </button>
        )}
      </div>
      <div className="rangee rangee-centre">
        <button className="btn btn-blanc" onClick={onAnnuler}>
          ✖ {t('Annuler')}
        </button>
        <button className="btn btn-jaune" disabled={!peutTerminer} onClick={onTerminer}>
          ✔ {t('Terminer')}
        </button>
      </div>
    </div>
  )
}
