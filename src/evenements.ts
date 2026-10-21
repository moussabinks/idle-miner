// Ce qui vient de se passer dans la partie, vu de l'interface : on compare l'état
// d'avant et l'état d'après une action pour savoir quels sons jouer et quelles
// animations montrer (bloc cassé, minerai doublé, vente, wagonnet arrivé au marché...).
// Ce ne sont pas des règles du jeu : la logique (src/jeu) n'en sait rien.

import { MINERAIS_RARES, type IdBloc } from './jeu/donnees'
import { estCassee, type EtatJeu } from './jeu/mineur'

export { MINERAIS_RARES }

export type Evenement =
  | { type: 'casse'; bloc: IdBloc; nombre: number; rare: boolean } // un clic a cassé le bloc de la mine
  | { type: 'vente'; montant: number }
  | { type: 'achat' }
  | { type: 'piocheCassee' }
  | { type: 'wagonnet'; montant: number } // le wagonnet a vendu le coffre au marché
  | { type: 'amelioration' } // un niveau de plus : mine, coffre, ascenseur, foreuse, mineur, sac, pioche...

// Un seul nombre qui grandit à chaque amélioration achetée (pour la repérer facilement).
function totalNiveaux(etat: EtatJeu): number {
  let total =
    etat.niveauMine +
    etat.coffre.niveau +
    etat.ascenseur.niveau +
    etat.foreuse.niveauVitesse +
    etat.foreuse.niveauChariot +
    etat.generateur.niveau +
    etat.wagonnet.niveau +
    etat.niveauSac +
    etat.meilleure +
    etat.recruteur
  for (const mineur of etat.employes) total += mineur.niveau
  return total
}

export function evenementsEntre(avant: EtatJeu, apres: EtatJeu): Evenement[] {
  const evenements: Evenement[] = []

  // Un clic a cassé le bloc : c'était celui qui était affiché (et il est peut-être doublé).
  if (apres.stats.blocsCasses > avant.stats.blocsCasses) {
    const bloc = avant.prochainBloc
    const nombre = (apres.coffre.contenu[bloc] ?? 0) - (avant.coffre.contenu[bloc] ?? 0)
    evenements.push({ type: 'casse', bloc, nombre: Math.max(1, nombre), rare: MINERAIS_RARES.includes(bloc) })
  }

  // Une amélioration achetée (le son de l'achat est alors remplacé par une petite fanfare).
  if (totalNiveaux(apres) > totalNiveaux(avant)) evenements.push({ type: 'amelioration' })

  if (!estCassee(avant) && estCassee(apres) && avant.niveauPioche === apres.niveauPioche) evenements.push({ type: 'piocheCassee' })

  // L'argent du wagonnet : discret (il fait beaucoup de voyages).
  const gainWagonnet = apres.stats.argentWagonnet - avant.stats.argentWagonnet
  if (gainWagonnet > 0) evenements.push({ type: 'wagonnet', montant: gainWagonnet })

  // L'argent : une vente (marché, chariot de la foreuse) ou un achat.
  const difference = apres.argent - avant.argent - Math.max(0, gainWagonnet)
  if (difference > 0) evenements.push({ type: 'vente', montant: difference })
  if (difference < 0 && apres.argent < avant.argent) evenements.push({ type: 'achat' })

  return evenements
}
