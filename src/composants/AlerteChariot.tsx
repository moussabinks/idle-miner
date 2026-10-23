// (23/10) L'alerte « le chariot de son pousseur est trop petit » : dans le panneau du bâtiment de
// départ (la mine, la foreuse), quand ce qu'il sort tout seul (sans les clics du joueur) dépasse ce
// que le wagonnet peut emporter. On agrandit le chariot du pousseur au Personnel.
// Aucune règle du jeu ici : le calcul est dans src/jeu/production.ts (analyseWagonnet).

import { chariotTropPetit, type AnalyseWagonnet } from '../jeu/production'

// « 1,25 » : des blocs par seconde, lisibles.
const parSeconde = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

export function AlerteChariot({ analyse, batiment, onAllerAuPersonnel }: { analyse: AnalyseWagonnet | null; batiment: string; onAllerAuPersonnel?: () => void }) {
  if (!analyse || !chariotTropPetit(analyse)) return null
  return (
    <div className="goulot goulot-alerte" role="status">
      <span title={`Son chariot : ${analyse.places} places, un aller-retour de ${Math.round(analyse.secondesAllerRetour)} s. Le surplus (${parSeconde(analyse.surplus)} bloc/s) reste au départ.`}>
        🛒 <strong>Le chariot de {analyse.pousseur?.nom ?? 'son pousseur'} est trop petit</strong> : il emporte {parSeconde(analyse.debitMax)} bloc/s, {batiment} en sort{' '}
        {parSeconde(analyse.apport)} tout seul · agrandis son chariot au Personnel
      </span>
      {onAllerAuPersonnel && (
        <button className="bouton bouton-petit bouton-ameliorer" onClick={onAllerAuPersonnel}>
          🛒 Personnel
        </button>
      )}
    </div>
  )
}
