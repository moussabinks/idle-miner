// La fenêtre d'un rail qui ne relie encore rien (30/10) : on le touche, et on peut le déplacer
// (comme un bâtiment) ou le retirer (ses 3 fer sont rendus). Quand le rail fait partie d'un
// trajet, ces deux boutons sont en bas de la fenêtre des trajets (FenetreTrajet).

import { BLOCS, COUT_RAIL } from '../jeu/donnees'
import { t } from '../jeu/langue'
import { Fenetre } from './Fenetre'

type Props = {
  onDeplacer: () => void
  onRetirer: () => void
  onFermer: () => void
}

// Les deux boutons d'un rail, les mêmes dans les deux fenêtres.
export function BoutonsRail({ onDeplacer, onRetirer }: Pick<Props, 'onDeplacer' | 'onRetirer'>) {
  return (
    <div className="rangee rangee-centre">
      <button className="btn btn-bleu btn-petit" onClick={onDeplacer}>
        ✏️ {t('Déplacer')}
      </button>
      <button className="btn btn-rose btn-petit" onClick={onRetirer}>
        🗑️ {t('Retirer')} · +{COUT_RAIL.materiaux.fer} {BLOCS.fer.emoji}
      </button>
    </div>
  )
}

export function FenetreRail({ onDeplacer, onRetirer, onFermer }: Props) {
  return (
    <Fenetre titre={t('Rail')} icone="🛤️" couleur="bleu" taille="petite" classe="fenetre-confirmation" onFermer={onFermer} pied={<BoutonsRail onDeplacer={onDeplacer} onRetirer={onRetirer} />}>
      <p>{t('Ce rail ne relie encore rien. Continue la voie jusqu’à un autre bâtiment : un wagonnet pourra y rouler.')}</p>
    </Fenetre>
  )
}
