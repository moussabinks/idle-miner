// La quête finale, en haut à droite (27/10) : elle n'apparaît qu'à la fin du jeu (la mine au
// niveau 7 et tous les bâtiments posés, voir queteChateauVisible) et reste jusqu'à la restauration
// du château. Une carte violette et dorée, au-dessus des tâches : « Restaure le château », la jauge
// de l'argent, et un bouton qui emmène voir le château (sa fenêtre s'ouvre).

import { PRIX_CHATEAU } from '../jeu/donnees'
import { peutRestaurerChateau } from '../jeu/chateau'
import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { nombreAbrege } from '../nombres'

export function QueteChateau({ etat, onVoir }: { etat: EtatJeu; onVoir: () => void }) {
  const pret = peutRestaurerChateau(etat)
  const part = Math.min(1, etat.argent / PRIX_CHATEAU)
  return (
    <aside className={`quete-chateau ${pret ? 'quete-prete' : ''}`} aria-label={t('Quête finale')}>
      <span className="quete-icone" aria-hidden="true">
        🏰
      </span>
      <span className="quete-corps">
        <span className="quete-titre">{t('Quête finale')}</span>
        <span className="quete-texte">{t('Restaure le château')}</span>
        <span className="tache-element">
          <span className="jauge jauge-jaune" aria-hidden="true">
            <i style={{ width: `${part * 100}%` }} />
          </span>
          <span className="tache-compte">
            💵 {nombreAbrege(Math.floor(etat.argent))}/{nombreAbrege(PRIX_CHATEAU)}
          </span>
        </span>
      </span>
      <button className={`btn btn-petit ${pret ? 'btn-jaune btn-attention' : 'btn-bleu'}`} onClick={onVoir}>
        {pret ? t('Go !') : t('Voir')}
      </button>
    </aside>
  )
}
