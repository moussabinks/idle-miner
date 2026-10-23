// Le classement des joueurs (leaderboard) : à l'argent seulement (23/10 ; le niveau de la mine est
// affiché à côté, mais ne compte pas). Le score d'un joueur est le meilleur de ses mondes.
// (23/10, bis) L'argent classé est l'argent EN POCHE (il baisse quand on achète), envoyé toutes les
// 5 minutes au plus (useCompte.ts).
// Le serveur garde le niveau de la mine dans sa colonne « prestige » (l'ancien classement) :
// pas besoin de changer la table.
//
// Rien ici ne parle au réseau : c'est `src/enLigne.ts` qui lit et envoie les scores.

import { NIVEAU_MINE_MAX } from './donnees'
import { charger, mondesDeLaCopie, type SauvegardeComplete, type Stockage } from './sauvegarde'

export type Score = { prestige: number; argent: number }

// Une ligne du classement, telle que le serveur la renvoie.
export type LigneClassement = Score & { pseudo: string }

// (23/10) Le niveau de mine à afficher, ou null pour une vieille ligne (un ancien prestige, plus
// grand que le dernier niveau de la mine).
export function niveauMineAffiche(ligne: Score): number | null {
  return ligne.prestige >= 1 && ligne.prestige <= NIVEAU_MINE_MAX ? ligne.prestige : null
}

// (23/10) Le plus d'argent en poche parmi des parties (pour « tu serais 7e »).
export function meilleurArgent(etats: ({ argent: number } | null)[]): number {
  return Math.max(0, ...etats.map((etat) => (etat ? Math.floor(etat.argent) : 0)))
}

// Un faux stockage en lecture seule, pour relire les parties d'une copie avec `charger`.
function stockageDeLaCopie(copie: SauvegardeComplete): Stockage {
  return {
    getItem: (cle) => copie[cle] ?? null,
    setItem: () => {},
    removeItem: () => {},
  }
}

// Le meilleur niveau de mine et le plus d'argent EN POCHE (23/10 : l'argent actuel du portefeuille,
// plus l'argent gagné en tout), parmi tous les mondes de la copie.
export function meilleurScore(copie: SauvegardeComplete): Score {
  const stockage = stockageDeLaCopie(copie)
  const score: Score = { prestige: 0, argent: 0 }
  for (const monde of mondesDeLaCopie(copie)) {
    const etat = charger(stockage, monde.id)
    if (etat === null) continue
    score.prestige = Math.max(score.prestige, etat.niveauMine)
    score.argent = Math.max(score.argent, Math.floor(etat.argent))
  }
  return score
}
