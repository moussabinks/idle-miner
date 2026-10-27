// Réorganiser le village (26/10, demandé par le propriétaire, façon Clash of Clans).
// Dans « ✏️ Modifier », le bouton « Tout ranger » enlève du village tous les bâtiments (la mine
// aussi), les rails et les pavés (et, le 27/10, les décorations) : ils vont dans une barre en bas
// de l'écran (les décorations, dans leur stock). Le joueur les
// repose un par un où il veut, sur la clairière vide.
//   - Pendant ce temps, le jeu est en PAUSE (rien ne creuse, rien ne roule : voir temps.ts).
//   - On ne peut finir qu'une fois TOUS les bâtiments reposés. Les rails et les pavés qui restent
//     dans la barre vont dans le stock (on les repose plus tard, gratuitement, menu Bâtiments).
//   - « Annuler » remet le village exactement comme avant.
// La réorganisation est gardée dans la partie (etat.reorganisation) : si on recharge la page au
// milieu, on y revient, et aucun bâtiment n'est perdu.

import type { IdBatiment } from './donnees'
import { t } from './langue'
import type { EtatJeu } from './mineur'
import { batimentPose, empriseBatiment, empriseLibre } from './village'
import { toutRangerDecorations } from './decorations'

export function enReorganisation(etat: EtatJeu): boolean {
  return !!etat.reorganisation
}

// « Tout ranger » : tout le village part dans la barre.
export function commencerReorganisation(etat: EtatJeu): string[] {
  if (etat.reorganisation) return []
  const village = etat.village
  const stock = etat.stockSol ?? { rail: 0, chemin: 0 }
  etat.reorganisation = {
    avant: structuredClone(village),
    stockAvant: { ...stock },
    stockDecorationsAvant: { ...(etat.stockDecorations ?? {}) },
    ranges: village.batiments.map((b) => ({ id: b.id, miroir: b.miroir })),
  }
  etat.stockSol = { rail: stock.rail + village.rails.length, chemin: stock.chemin + village.chemins.length }
  village.batiments = []
  village.rails = []
  village.chemins = []
  toutRangerDecorations(etat)
  return []
}

// Les bâtiments encore dans la barre.
export function batimentsRanges(etat: EtatJeu): { id: IdBatiment; miroir: boolean }[] {
  return etat.reorganisation?.ranges ?? []
}

// Peut-on reposer ce bâtiment de la barre à cet endroit ?
export function peutReposer(etat: EtatJeu, id: IdBatiment, x: number, y: number): boolean {
  if (!batimentsRanges(etat).some((r) => r.id === id)) return false
  return empriseLibre(etat.village, empriseBatiment({ id, x, y }))
}

// Reposer un bâtiment de la barre sur la carte (gratuit).
export function reposerBatiment(etat: EtatJeu, id: IdBatiment, x: number, y: number, miroir: boolean): string[] {
  const reorganisation = etat.reorganisation
  if (!reorganisation || !peutReposer(etat, id, x, y)) return []
  reorganisation.ranges = reorganisation.ranges.filter((r) => r.id !== id)
  etat.village.batiments.push({ id, x, y, miroir })
  return []
}

// Remettre dans la barre un bâtiment déjà reposé (pour le reposer ailleurs).
export function rangerBatiment(etat: EtatJeu, id: IdBatiment): string[] {
  const reorganisation = etat.reorganisation
  const b = batimentPose(etat.village, id)
  if (!reorganisation || !b) return []
  etat.village.batiments = etat.village.batiments.filter((x) => x.id !== id)
  reorganisation.ranges.push({ id, miroir: b.miroir })
  return []
}

// On peut finir quand tous les bâtiments sont reposés (les rails et les pavés, non : le reste
// va dans le stock).
export function peutTerminerReorganisation(etat: EtatJeu): boolean {
  return !!etat.reorganisation && etat.reorganisation.ranges.length === 0
}

export function terminerReorganisation(etat: EtatJeu): string[] {
  if (!peutTerminerReorganisation(etat)) return []
  etat.reorganisation = null
  return [t('🏡 Nouveau village enregistré !')]
}

// « Annuler » : le village et le stock reviennent comme avant.
export function annulerReorganisation(etat: EtatJeu): string[] {
  const reorganisation = etat.reorganisation
  if (!reorganisation) return []
  etat.village = reorganisation.avant
  etat.stockSol = reorganisation.stockAvant
  etat.stockDecorations = reorganisation.stockDecorationsAvant ?? {}
  etat.reorganisation = null
  return []
}
