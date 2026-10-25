// La publicité (25/10) : pour l'instant une FAUSSE publicité, pour tester le jeu sans régie de
// pub. Un écran noir « Simulation de pub », un compte à rebours de 30 à 0 secondes, puis le
// bouton de la récompense. Quitter avant la fin ne donne rien. La version CrazyGames remplacera
// cet écran par leur vraie publicité « récompensée » (voir src/portail.ts).
//
// (25/10) ⚠️ Pas de mot « pub », « publicite », « ad »... dans les noms de classes CSS : les
// bloqueurs de publicités cachent ces éléments, et le joueur ne voyait rien (seule la musique se
// coupait). D'où « ecran-video ». L'écran est aussi posé directement dans <body> (createPortal),
// par-dessus tout le reste du jeu.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  // L'anneau autour du compte à rebours se vide avec le temps.
  const part = reste / SECONDES_PUB
  return createPortal(
    <div className="ecran-video" role="dialog" aria-modal="true" aria-label={t('Simulation de pub')}>
      {!finie && (
        <button className="btn btn-blanc btn-petit ecran-video-quitter" onClick={onAnnulee}>
          ✖ {t('Quitter (sans récompense)')}
        </button>
      )}
      <div className="ecran-video-centre">
        {finie ? (
          <>
            <p className="ecran-video-titre">{t('Merci ! Ta récompense est prête.')}</p>
            <button className="btn btn-violet btn-grand btn-attention" onClick={onFinie} autoFocus>
              🎁 {t('Récupérer')}
            </button>
          </>
        ) : (
          <>
            <p className="ecran-video-titre">{t('Simulation de pub')}</p>
            <div className="ecran-video-compte" style={{ ['--part' as string]: `${part * 360}deg` }} aria-live="polite">
              <span>{reste}</span>
            </div>
            <p className="ecran-video-texte">{t('La récompense arrive dans {n} s…', { n: reste })}</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
