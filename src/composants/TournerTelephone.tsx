// (27/10, demandé par le propriétaire) Sur téléphone, le jeu se joue à l'horizontale. Tenu debout,
// un écran crème demande de tourner le téléphone (un dessin de téléphone qui pivote). Il n'apparaît
// que sur un écran tactile étroit tenu debout (voir src/styles/paysage.css) : rien ne change sur
// un ordinateur.
// (28/10) Si le navigateur sait passer en plein écran (Android), un bouton le fait et verrouille
// l'écran à l'horizontale : le jeu se tourne tout seul, sans avoir à tourner le téléphone.

import { t } from '../jeu/langue'
import { entrerPleinEcran, pleinEcranPossible } from '../pleinEcran'

export function TournerTelephone() {
  return (
    <div className="tourner-telephone" role="alert">
      <svg className="tourner-telephone-dessin" viewBox="0 0 100 100" aria-hidden="true">
        <rect x="30" y="10" width="40" height="80" rx="9" fill="#fdf6e3" stroke="#2a2140" strokeWidth="6" />
        <rect x="37" y="20" width="26" height="54" rx="3" fill="#8cc8f5" stroke="#2a2140" strokeWidth="3" />
        <circle cx="50" cy="82" r="3.5" fill="#2a2140" />
        <path d="M80 28 A34 34 0 0 1 86 62" fill="none" stroke="#f6a04d" strokeWidth="6" strokeLinecap="round" />
        <path d="M78 58 L86 66 L92 56" fill="none" stroke="#f6a04d" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <strong>{t('Tourne ton téléphone')}</strong>
      <p>{t('Mega Digger se joue à l’horizontale.')}</p>
      {pleinEcranPossible() && (
        <button className="btn btn-jaune btn-large" onClick={() => void entrerPleinEcran()}>
          📲 {t('Jouer en plein écran')}
        </button>
      )}
    </div>
  )
}
