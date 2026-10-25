// (23/10) L'alerte « le chariot de son pousseur est trop petit » : dans le panneau du bâtiment de
// départ (la mine, la foreuse), quand ce qu'il sort tout seul (sans les clics du joueur) dépasse ce
// que le wagonnet peut emporter. On agrandit le chariot du pousseur au Personnel.
// Aucune règle du jeu ici : le calcul est dans src/jeu/production.ts (analyseWagonnet).

import { nombre, t } from '../jeu/langue'
import { chariotTropPetit, type AnalyseWagonnet } from '../jeu/production'

export function AlerteChariot({ analyse, batiment, onAllerAuPersonnel }: { analyse: AnalyseWagonnet | null; batiment: string; onAllerAuPersonnel?: () => void }) {
  if (!analyse || !chariotTropPetit(analyse)) return null
  return (
    <div className="alerte-batiment" role="status">
      <span className="alerte-batiment-icone" aria-hidden="true">
        🛒
      </span>
      <span className="alerte-batiment-texte">
        <strong>{t('Le chariot de {nom} est trop petit', { nom: analyse.pousseur?.nom ?? t('son pousseur') })}</strong>
        <span>
          {t('Il emporte {a} blocs/s, {batiment} en sort {b}.', { a: nombre(analyse.debitMax, 2), batiment, b: nombre(analyse.apport, 2) })}
        </span>
      </span>
      {onAllerAuPersonnel && (
        <button className="btn btn-bleu btn-petit" onClick={onAllerAuPersonnel}>
          👷 {t('Agrandir')}
        </button>
      )}
    </div>
  )
}
