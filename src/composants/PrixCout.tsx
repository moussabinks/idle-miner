// L'affichage d'un prix : « 1 500 $ · 3/10 🔩 », en rouge ce qui manque. Les minerais sont ceux
// du coffre de la mine.

import { BLOCS, type Cout, type IdBloc } from '../jeu/donnees'
import { nombre } from '../jeu/langue'
import { disponible, type EtatJeu } from '../jeu/mineur'
import { nombreAbrege } from '../nombres'

// « 3/4 💎 » en rouge s'il en manque.
export function Materiau({ etat, bloc, besoin }: { etat: EtatJeu; bloc: IdBloc; besoin: number }) {
  const possede = disponible(etat, bloc)
  return (
    <span className={possede >= besoin ? '' : 'manque'}>
      {possede >= besoin ? nombre(besoin) : `${nombre(Math.min(possede, besoin))}/${nombre(besoin)}`} {BLOCS[bloc].emoji}
    </span>
  )
}

export function PrixCout({ etat, cout }: { etat: EtatJeu; cout: Cout }) {
  return (
    <span className="prix">
      {cout.argent !== undefined && cout.argent > 0 && <span className={etat.argent >= cout.argent ? '' : 'manque'}>{nombreAbrege(cout.argent)} $</span>}
      {Object.entries(cout.materiaux).map(([bloc, n]) => (
        <Materiau key={bloc} etat={etat} bloc={bloc as IdBloc} besoin={n ?? 0} />
      ))}
    </span>
  )
}
