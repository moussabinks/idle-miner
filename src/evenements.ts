// Ce qui vient de se passer dans la partie, vu de l'interface : on compare l'état
// d'avant et l'état d'après une action pour savoir quels sons jouer et quelles
// animations montrer (bloc cassé, minerai rare, vente, arrivée de l'ascenseur...).
// Ce ne sont pas des règles du jeu : la logique (src/jeu) n'en sait rien.

import type { IdBloc } from './jeu/donnees'
import { estCassee, indexBlocActuel, type EtatJeu, type Inventaire } from './jeu/mineur'

// Les minerais rares ont droit à un son plus brillant (tous les minerais ont leur animation).
export const MINERAIS_RARES: IdBloc[] = ['lapis', 'or', 'emeraude', 'diamant', 'debris']

// La roche ordinaire : pas d'animation de trouvaille pour elle.
const ROCHES: IdBloc[] = ['pierre', 'terre', 'gravier', 'deepslate']

export type Evenement =
  | { type: 'casse'; bloc: IdBloc; colonne: number }
  | { type: 'trouvaille'; bloc: IdBloc; nombre: number; colonne: number; rare: boolean }
  | { type: 'vente'; montant: number }
  | { type: 'achat' }
  | { type: 'ding' }
  | { type: 'pas' }
  | { type: 'piocheCassee' }
  | { type: 'talent' }
  | { type: 'recolteMineurs'; montant: number } // un mineur employé a vendu sa récolte
  | { type: 'nouvelleCouche'; palier: boolean } // une couche finie (palier = tous les 10 m)
  | { type: 'amelioration' } // un niveau de plus : ascenseur, foreuse, mineur, sac, pioche, enchantement

// Le sac et le quai de l'ascenseur ensemble : ce que le mineur a ramassé.
function ramasse(etat: EtatJeu): Inventaire {
  const total: Inventaire = { ...etat.inventaire }
  for (const [id, nombre] of Object.entries(etat.ascenseur.quai)) {
    const bloc = id as IdBloc
    total[bloc] = (total[bloc] ?? 0) + (nombre ?? 0)
  }
  return total
}

// Un seul nombre qui grandit à chaque amélioration achetée (pour la repérer facilement).
function totalNiveaux(etat: EtatJeu): number {
  let total = etat.ascenseur.niveau + etat.foreuse.niveauVitesse + etat.foreuse.niveauChariot + etat.niveauSac + etat.meilleure
  for (const niveau of Object.values(etat.enchantements)) total += niveau
  for (const mineur of etat.employes) total += mineur.niveau
  return total
}

// Ce que les mineurs employés ont rapporté depuis le début.
function totalGagne(etat: EtatJeu): number {
  return etat.employes.reduce((total, mineur) => total + mineur.gagne, 0)
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
    for (const [id, nombre] of Object.entries(ramasse(apres))) {
      const objet = id as IdBloc
      const gagne = (nombre ?? 0) - (ramasseAvant[objet] ?? 0)
      if (gagne <= 0 || ROCHES.includes(objet)) continue
      evenements.push({ type: 'trouvaille', bloc: objet, nombre: gagne, colonne, rare: MINERAIS_RARES.includes(objet) })
    }
  }

  // Une couche finie : le mineur descend d'un mètre.
  if (apres.profondeur > avant.profondeur && apres.prestige === avant.prestige) {
    evenements.push({ type: 'nouvelleCouche', palier: apres.profondeur % 10 === 0 })
  }

  // Une amélioration achetée (le son de l'achat est alors remplacé par une petite fanfare).
  if (totalNiveaux(apres) > totalNiveaux(avant) && apres.prestige === avant.prestige) evenements.push({ type: 'amelioration' })

  if (!estCassee(avant) && estCassee(apres) && avant.niveauPioche === apres.niveauPioche) evenements.push({ type: 'piocheCassee' })

  // Un talent de l'arbre de prestige (son argent de départ ne compte pas comme une vente).
  const talent = apres.talents.length > avant.talents.length
  if (talent) evenements.push({ type: 'talent' })

  // L'argent rapporté par les mineurs employés : discret (ils vendent souvent).
  const gainMineurs = totalGagne(apres) - totalGagne(avant)
  if (gainMineurs > 0) evenements.push({ type: 'recolteMineurs', montant: gainMineurs })

  // L'argent : une vente (marché, chariot, ascenseur) ou un achat.
  // L'argent d'un coffre arrive avec un bloc cassé : ce n'est pas une vente.
  const difference = apres.argent - avant.argent - Math.max(0, gainMineurs)
  if (difference > 0 && !blocCasse && !talent) evenements.push({ type: 'vente', montant: difference })
  if (difference < 0 && apres.argent < avant.argent) evenements.push({ type: 'achat' })

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
