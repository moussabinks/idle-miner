// Les gemmes (25/10) : la monnaie « bonus » du jeu.
//
// On en gagne :
//   - en regardant une publicité (une gemme par publicité, voir src/publicite.ts) ;
//   - à chaque niveau du joueur gagné ;
//   - avec les récompenses quotidiennes (une par jour, de plus en plus grosses si on revient
//     tous les jours : la série).
// On s'en sert :
//   - pour payer n'importe quelle amélioration sans argent ni minerais (le prix en gemmes dépend
//     de ce qu'elle vaut, voir prixEnGemmes) ;
//   - à la boutique des gemmes : des bonus pour un temps (production × 2, ventes × 2...).
//
// Ce fichier ne dépend que des données : la partie (EtatJeu) est décrite dans mineur.ts.

import { BLOCS, type Cout, type IdBloc } from './donnees'
import type { EtatJeu } from './mineur'

// ---------------------------------------------------------------------------
// Ce qui est sauvegardé avec la partie
// ---------------------------------------------------------------------------

// Les bonus de la boutique.
export type IdBoost = 'production' | 'ventes' | 'clics'

// Pour chaque bonus en cours : l'heure de jeu (stats.tempsDeJeu, en secondes) où il s'arrête.
// Le temps de jeu avance aussi jeu fermé (on rattrape l'absence) : un bonus s'use donc aussi
// pendant l'absence.
export type Boosts = Partial<Record<IdBoost, number>>

// La récompense quotidienne : le dernier jour où on l'a prise (« 2026-10-25 »), et le nombre de
// jours d'affilée (la série, de 1 à 7, puis on recommence à 1 après le 7e jour).
export type Quotidien = { dernierJour: string | null; serie: number }

// ---------------------------------------------------------------------------
// Gagner des gemmes
// ---------------------------------------------------------------------------

// Une publicité regardée jusqu'au bout rapporte une gemme.
export const GEMMES_PAR_PUB = 1
// La durée d'une publicité (pour l'instant, une fausse publicité : un écran noir et un compte à rebours).
export const SECONDES_PUB = 30
// Chaque niveau du joueur gagné rapporte des gemmes.
export const GEMMES_PAR_NIVEAU = 3

export function gagnerGemmes(etat: EtatJeu, nombre: number): void {
  etat.gemmes = (etat.gemmes ?? 0) + nombre
}

// Une publicité regardée jusqu'au bout : la récompense.
export function recompenserPub(etat: EtatJeu): string[] {
  gagnerGemmes(etat, GEMMES_PAR_PUB)
  etat.stats.pubsVues = (etat.stats.pubsVues ?? 0) + 1
  return [`💎 +${GEMMES_PAR_PUB} gemme !`]
}

// ---------------------------------------------------------------------------
// Payer en gemmes
// ---------------------------------------------------------------------------

// Ce que vaut un prix en dollars : l'argent, plus les minerais à leur prix au marché.
export function valeurEnDollars(cout: Cout): number {
  return (cout.argent ?? 0) + Object.entries(cout.materiaux).reduce((total, [bloc, n]) => total + (n ?? 0) * BLOCS[bloc as IdBloc].prix, 0)
}

// Le prix en gemmes d'un achat : il grandit moins vite que son prix en dollars (une amélioration
// de 1 000 $ coûte 6 gemmes, une de 80 000 $ coûte environ 57 gemmes), au moins 1 gemme.
export function prixEnGemmes(cout: Cout): number {
  return Math.max(1, Math.round(Math.sqrt(valeurEnDollars(cout)) / 5))
}

// ---------------------------------------------------------------------------
// La boutique des gemmes : des bonus pour un temps
// ---------------------------------------------------------------------------

export type InfoBoost = { id: IdBoost; nom: string; emoji: string; description: string; minutes: number; gemmes: number }

export const BOOSTS: Record<IdBoost, InfoBoost> = {
  production: { id: 'production', nom: 'Production × 2', emoji: '⚡', description: 'La mine, les mineurs et la foreuse creusent deux fois plus vite.', minutes: 15, gemmes: 8 },
  ventes: { id: 'ventes', nom: 'Ventes × 2', emoji: '💰', description: 'Tout ce que tu vends rapporte le double : coffre, wagonnets, foreuse.', minutes: 10, gemmes: 8 },
  clics: { id: 'clics', nom: 'Clics en or', emoji: '👆', description: 'Chaque clic sur le bloc de la mine en casse 3.', minutes: 5, gemmes: 4 },
}
export const LISTE_BOOSTS: IdBoost[] = ['production', 'ventes', 'clics']

// Le trésor : un tas de pièces tout de suite, selon le palier de la mine.
export const TRESOR = { gemmes: 10, argentParPalier: [600, 3500, 14000, 45000, 140000] }

export function boostActif(etat: EtatJeu, id: IdBoost): boolean {
  return (etat.boosts?.[id] ?? 0) > etat.stats.tempsDeJeu
}

// Les secondes qu'il reste à un bonus (0 s'il n'est pas actif).
export function secondesBoost(etat: EtatJeu, id: IdBoost): number {
  return Math.max(0, (etat.boosts?.[id] ?? 0) - etat.stats.tempsDeJeu)
}

export function multiplicateurVentes(etat: EtatJeu): number {
  return boostActif(etat, 'ventes') ? 2 : 1
}

export function multiplicateurProduction(etat: EtatJeu): number {
  return boostActif(etat, 'production') ? 2 : 1
}

// Ajoute du temps à un bonus (s'il est déjà actif, le temps s'ajoute à ce qui reste).
export function prolongerBoost(etat: EtatJeu, id: IdBoost, minutes: number): void {
  const depart = Math.max(etat.stats.tempsDeJeu, etat.boosts?.[id] ?? 0)
  etat.boosts = { ...(etat.boosts ?? {}), [id]: depart + minutes * 60 }
}

export function peutAcheterBoost(etat: EtatJeu, id: IdBoost): boolean {
  return (etat.gemmes ?? 0) >= BOOSTS[id].gemmes
}

export function acheterBoost(etat: EtatJeu, id: IdBoost): string[] {
  const boost = BOOSTS[id]
  if (!peutAcheterBoost(etat, id)) return []
  etat.gemmes -= boost.gemmes
  prolongerBoost(etat, id, boost.minutes)
  return [`${boost.emoji} ${boost.nom} pendant ${boost.minutes} min !`]
}

export function argentTresor(etat: EtatJeu): number {
  return TRESOR.argentParPalier[Math.max(0, Math.min(etat.niveauMine, TRESOR.argentParPalier.length) - 1)]
}

export function acheterTresor(etat: EtatJeu): string[] {
  if ((etat.gemmes ?? 0) < TRESOR.gemmes) return []
  etat.gemmes -= TRESOR.gemmes
  const argent = argentTresor(etat)
  etat.argent += argent
  return [`💰 Trésor : +${argent.toLocaleString('fr-FR')} $ !`]
}

// ---------------------------------------------------------------------------
// Les récompenses quotidiennes
// ---------------------------------------------------------------------------

// Une récompense : des gemmes, de l'argent (en « parts » : une part vaut ARGENT_QUOTIDIEN selon
// le palier de la mine), et parfois un bonus.
export type Recompense = { gemmes: number; argent: number; boost?: { id: IdBoost; minutes: number } }

// Les 7 jours de la série. Le 7e est le gros lot ; après, on recommence au jour 1.
export const RECOMPENSES_QUOTIDIENNES: Recompense[] = [
  { gemmes: 1, argent: 1 },
  { gemmes: 2, argent: 0 },
  { gemmes: 1, argent: 3 },
  { gemmes: 3, argent: 0 },
  { gemmes: 2, argent: 0, boost: { id: 'ventes', minutes: 10 } },
  { gemmes: 4, argent: 4 },
  { gemmes: 10, argent: 0, boost: { id: 'production', minutes: 30 } },
]

export const ARGENT_QUOTIDIEN = [200, 1000, 4000, 12000, 30000]

// Une date → « 2026-10-25 » (le jour du joueur, à son heure locale).
export function jourDe(date: Date): string {
  const deux = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`
}

// Le jour d'avant (« 2026-10-25 » → « 2026-10-24 »).
export function veille(jour: string): string {
  const [a, m, j] = jour.split('-').map(Number)
  return jourDe(new Date(a, m - 1, j - 1))
}

// Où en est la série aujourd'hui : le jour de la série (1 à 7) de la récompense à prendre (ou
// déjà prise aujourd'hui), et si on peut la prendre.
export function etatQuotidien(etat: EtatJeu, aujourdhui: string): { jour: number; disponible: boolean } {
  const q = etat.quotidien ?? { dernierJour: null, serie: 0 }
  if (q.dernierJour === aujourdhui) return { jour: Math.max(1, q.serie), disponible: false }
  // Revenu le lendemain : la série continue. Sinon (premier jour, ou un jour manqué), elle repart à 1.
  const continue_ = q.dernierJour !== null && q.dernierJour === veille(aujourdhui)
  return { jour: continue_ ? (q.serie % RECOMPENSES_QUOTIDIENNES.length) + 1 : 1, disponible: true }
}

export function argentRecompense(etat: EtatJeu, recompense: Recompense): number {
  return recompense.argent * ARGENT_QUOTIDIEN[Math.max(0, Math.min(etat.niveauMine, ARGENT_QUOTIDIEN.length) - 1)]
}

export function recupererQuotidien(etat: EtatJeu, aujourdhui: string): string[] {
  const { jour, disponible } = etatQuotidien(etat, aujourdhui)
  if (!disponible) return []
  const recompense = RECOMPENSES_QUOTIDIENNES[jour - 1]
  gagnerGemmes(etat, recompense.gemmes)
  const argent = argentRecompense(etat, recompense)
  etat.argent += argent
  if (recompense.boost) prolongerBoost(etat, recompense.boost.id, recompense.boost.minutes)
  etat.quotidien = { dernierJour: aujourdhui, serie: jour }
  return [`🎁 Jour ${jour} : +${recompense.gemmes} 💎${argent > 0 ? ` et +${argent.toLocaleString('fr-FR')} $` : ''} !`]
}
