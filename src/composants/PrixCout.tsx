// L'affichage d'un prix : « 1 500 $ · 3/10 🔩 Fer », en vert ce qu'on a, en rouge ce qui manque.

import { BLOCS, type Cout, type IdBloc } from '../jeu/donnees'
import { quantite, type EtatJeu } from '../jeu/mineur'

// « 3/4 💎 Diamant » en rouge s'il en manque.
export function Materiau({ etat, bloc, nombre }: { etat: EtatJeu; bloc: IdBloc; nombre: number }) {
  const possede = quantite(etat, bloc)
  return (
    <span className={possede >= nombre ? 'ok' : 'manque'}>
      {Math.min(possede, nombre)}/{nombre} {BLOCS[bloc].emoji} {BLOCS[bloc].nom}
    </span>
  )
}

export function PrixCout({ etat, cout }: { etat: EtatJeu; cout: Cout }) {
  return (
    <span className="materiaux">
      {cout.argent !== undefined && <span className={etat.argent >= cout.argent ? 'ok' : 'manque'}>{cout.argent.toLocaleString('fr-FR')} $</span>}
      {Object.entries(cout.materiaux).map(([bloc, nombre]) => (
        <Materiau key={bloc} etat={etat} bloc={bloc as IdBloc} nombre={nombre ?? 0} />
      ))}
    </span>
  )
}
