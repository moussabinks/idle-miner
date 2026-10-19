// Ce qui vient de se passer dans la partie, vu de l'interface : on compare l'état
// d'avant et l'état d'après une action pour savoir quels sons jouer et quelles
// animations montrer (bloc cassé, minerai rare, vente, arrivée de l'ascenseur...).
// Ce ne sont pas des règles du jeu : la logique (src/jeu) n'en sait rien.

import type { IdBloc } from './jeu/donnees'
import { estCassee, indexBlocActuel, type EtatJeu, type Inventaire } from './jeu/mineur'

// Les minerais qui méritent une petite fête quand on les trouve.
export const MINERAIS_RARES: IdBloc[] = ['lapis', 'or', 'emeraude', 'diamant', 'debris']

export type Evenement =
  | { type: 'casse'; bloc: IdBloc; colonne: number }
  | { type: 'minerai' }
  | { type: 'rare'; bloc: IdBloc; nombre: number; colonne: number }
  | { type: 'vente'; montant: number }
  | { type: 'achat' }
  | { type: 'ding' }
  | { type: 'pas' }
  | { type: 'piocheCassee' }
  | { type: 'talent' }

// Le sac et le quai de l'ascenseur ensemble : ce que le mineur a ramassé.
function ramasse(etat: EtatJeu): Inventaire {
  const total: Inventaire = { ...etat.inventaire }
  for (const [id, nombre] of Object.entries(etat.ascenseur.quai)) {
    const bloc = id as IdBloc
    total[bloc] = (total[bloc] ?? 0) + (nombre ?? 0)
  }
  return total
}

export function evenementsEntre(avant: EtatJeu, apres: EtatJeu): Evenement[] {
  const evenements: Evenement[] = []

  // Un bloc cassé : c'est celui sur lequel travaillait le mineur.
  const blocCasse = apres.stats.blocsCasses > avant.stats.blocsCasses
  if (blocCasse) {
    const colonne = indexBlocActuel(avant)
    const bloc = avant.coucheActuelle[colonne]
    if (bloc) evenements.push({ type: 'casse', bloc, colonne })

    // Ce qui est tombé dans le sac (ou sur le quai).
    const ramasseAvant = ramasse(avant)
    let mineraiTrouve = false
    for (const [id, nombre] of Object.entries(ramasse(apres))) {
      const gagne = (nombre ?? 0) - (ramasseAvant[id as IdBloc] ?? 0)
      if (gagne <= 0) continue
      if (MINERAIS_RARES.includes(id as IdBloc)) evenements.push({ type: 'rare', bloc: id as IdBloc, nombre: gagne, colonne })
      else if (id !== 'pierre' && id !== 'terre' && id !== 'gravier' && id !== 'deepslate') mineraiTrouve = true
    }
    if (mineraiTrouve) evenements.push({ type: 'minerai' })
  }

  if (!estCassee(avant) && estCassee(apres) && avant.niveauPioche === apres.niveauPioche) evenements.push({ type: 'piocheCassee' })

  // Un talent de l'arbre de prestige (son argent de départ ne compte pas comme une vente).
  const talent = apres.talents.length > avant.talents.length
  if (talent) evenements.push({ type: 'talent' })

  // L'argent : une vente (marché, chariot, ascenseur) ou un achat.
  // L'argent d'un coffre arrive avec un bloc cassé : ce n'est pas une vente.
  const difference = apres.argent - avant.argent
  if (difference > 0 && !blocCasse && !talent) evenements.push({ type: 'vente', montant: difference })
  if (difference < 0) evenements.push({ type: 'achat' })

  // L'ascenseur arrive à destination : « ding ».
  const cabine = { avant: avant.ascenseur, apres: apres.ascenseur }
  if (cabine.apres.niveau > 0 && cabine.avant.position !== cabine.avant.cible && cabine.apres.position === cabine.apres.cible) {
    evenements.push({ type: 'ding' })
  }

  // Un barreau d'échelle tous les 2 mètres.
  const surEchelle = avant.position !== avant.cible && !apres.ascenseur.passager
  if (surEchelle && Math.floor(avant.position / 2) !== Math.floor(apres.position / 2)) evenements.push({ type: 'pas' })

  return evenements
}
