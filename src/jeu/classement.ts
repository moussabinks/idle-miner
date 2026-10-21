// Le classement des joueurs (leaderboard) : deux classements, au niveau de la mine et à
// l'argent. Le score d'un joueur est le meilleur de ses mondes. L'argent classé est tout
// l'argent gagné dans la partie (l'argent en poche baisse quand on achète).
// Le serveur garde le niveau de la mine dans sa colonne « prestige » (l'ancien classement) :
// pas besoin de changer la table.
//
// Rien ici ne parle au réseau : c'est `src/enLigne.ts` qui lit et envoie les scores.

import { charger, mondesDeLaCopie, type SauvegardeComplete, type Stockage } from './sauvegarde'

export type Score = { prestige: number; argent: number }

// Une ligne du classement, telle que le serveur la renvoie.
export type LigneClassement = Score & { pseudo: string }

export type TriClassement = 'prestige' | 'argent'

// Un faux stockage en lecture seule, pour relire les parties d'une copie avec `charger`.
function stockageDeLaCopie(copie: SauvegardeComplete): Stockage {
  return {
    getItem: (cle) => copie[cle] ?? null,
    setItem: () => {},
    removeItem: () => {},
  }
}

// Le meilleur niveau de mine et le plus d'argent gagné, parmi tous les mondes de la copie.
export function meilleurScore(copie: SauvegardeComplete): Score {
  const stockage = stockageDeLaCopie(copie)
  const score: Score = { prestige: 0, argent: 0 }
  for (const monde of mondesDeLaCopie(copie)) {
    const etat = charger(stockage, monde.id)
    if (etat === null) continue
    score.prestige = Math.max(score.prestige, etat.niveauMine)
    score.argent = Math.max(score.argent, Math.floor(etat.stats.argentGagne))
  }
  return score
}
