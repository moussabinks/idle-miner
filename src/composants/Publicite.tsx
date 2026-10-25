// La publicité (25/10) : pour l'instant une FAUSSE publicité, pour tester le jeu sans régie de
// pub. Un écran noir, un compte à rebours de 30 secondes, puis le bouton de la récompense. Quitter
// avant la fin ne donne rien. La version CrazyGames remplacera cet écran par leur vraie publicité
// « récompensée » (voir src/portail.ts).

import { useEffect, useState } from 'react'
import { SECONDES_PUB } from '../jeu/gemmes'
import { t } from '../jeu/langue'

type Props = {
  onFinie: () => void // regardée jusqu'au bout : la récompense
  onAnnulee: () => void
}

export function Publicite({ onFinie, onAnnulee }: Props) {
  const [reste, setReste] = useState(SECONDES_PUB)

  useEffect(() => {
    if (reste <= 0) return
    const minuteur = window.setTimeout(() => setReste((r) => r - 1), 1000)
    return () => clearTimeout(minuteur)
  }, [reste])

  const finie = reste <= 0
  return (
    <div className="publicite" role="dialog" aria-modal="true" aria-label={t('Publicité')}>
      <span className="publicite-etiquette">{t('Publicité')}</span>
      {!finie && (
        <button className="btn btn-blanc btn-petit publicite-quitter" onClick={onAnnulee}>
          ✖ {t('Quitter (sans récompense)')}
        </button>
      )}
      <div className="publicite-centre">
        {finie ? (
          <>
            <p className="publicite-texte">{t('Merci ! Ta récompense est prête.')}</p>
            <button className="btn btn-violet btn-grand btn-attention" onClick={onFinie} autoFocus>
              🎁 {t('Récupérer')}
            </button>
          </>
        ) : (
          <>
            <div className="publicite-compte" aria-live="polite">
              {reste}
            </div>
            <p className="publicite-texte">{t('La récompense arrive dans {n} s…', { n: reste })}</p>
          </>
        )}
      </div>
    </div>
  )
}
