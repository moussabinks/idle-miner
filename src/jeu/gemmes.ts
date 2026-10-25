// Les gemmes (25/10) : la monnaie « bonus » du jeu.
//
// On en gagne :
//   - en regardant une publicité (une gemme par publicité, voir src/publicite.ts) ;
//   - à chaque niveau du joueur gagné ;
//   - avec les récompenses quotidiennes (une par jour, de plus en plus grosses si on revient
//     tous les jours : la série).
// On s'en sert :
//   - pour payer n'importe quelle amélioration sans argent ni minerais (le prix en gemmes dépend
//     de ce qu'elle vaut, de 3 à 10 gemmes, voir prixEnGemmes) ;
//   - à la boutique des gemmes : des bonus pour un temps (production × 2, ventes × 2...).
//
// Ce fichier ne dépend que des données : la partie (EtatJeu) est décrite dans mineur.ts.

import { BLOCS, type Cout, type IdBloc } from './donnees'
import type { EtatJeu } from './mineur'
import { t } from './langue'

// ---------------------------------------------------------------------------
// Ce qui est sauvegardé avec la partie
// ---------------------------------------------------------------------------

// Les bonus de la boutique.
// (« clics » : la Fortune ; le nom d'avant est gardé, les parties l'ont déjà enregistré)
export type IdBoost = 'production' | 'ventes' | 'clics' | 'employes'

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
// Chaque niveau du joueur gagné rapporte une gemme. (25/10, demandé par le propriétaire : 3
// avant, le joueur avait trop de gemmes et n'avait plus envie de regarder de publicités.)
export const GEMMES_PAR_NIVEAU = 1

export function gagnerGemmes(etat: EtatJeu, nombre: number): void {
  etat.gemmes = (etat.gemmes ?? 0) + nombre
}

// Une publicité regardée jusqu'au bout : la récompense.
export function recompenserPub(etat: EtatJeu): string[] {
  gagnerGemmes(etat, GEMMES_PAR_PUB)
  etat.stats.pubsVues = (etat.stats.pubsVues ?? 0) + 1
  return [t('💎 +{n} gemme !', { n: GEMMES_PAR_PUB })]
}

// ---------------------------------------------------------------------------
// Payer en gemmes
// ---------------------------------------------------------------------------

// Ce que vaut un prix en dollars : l'argent, plus les minerais à leur prix au marché.
export function valeurEnDollars(cout: Cout): number {
  return (cout.argent ?? 0) + Object.entries(cout.materiaux).reduce((total, [bloc, n]) => total + (n ?? 0) * BLOCS[bloc as IdBloc].prix, 0)
}

// (25/10, demandé par le propriétaire) Le prix en gemmes d'un achat : de 3 gemmes (une petite
// amélioration) à 10 gemmes (la plus grosse), soit 3 à 10 publicités. Avant, il suivait la racine
// carrée du prix et montait à plus de 100 gemmes en fin de partie.
// Il compte les chiffres du prix en dollars : 2 gemmes de plus chaque fois que le prix est
// multiplié par 10 (100 $ → 3, 1 000 $ → 5, 10 000 $ → 7, 100 000 $ → 9, 300 000 $ → 10).
export const GEMMES_MIN = 3
export const GEMMES_MAX = 10
export function prixEnGemmes(cout: Cout): number {
  const valeur = Math.max(1, valeurEnDollars(cout))
  const prix = Math.round(GEMMES_MIN + 2 * (Math.log10(valeur) - 2))
  return Math.min(GEMMES_MAX, Math.max(GEMMES_MIN, prix))
}

// ---------------------------------------------------------------------------
// La boutique des gemmes : des bonus pour un temps
// ---------------------------------------------------------------------------

// (25/10) Le nom et la description restent en français ici : l'interface les traduit avec t()
// au moment de les afficher (comme les tables de donnees.ts).
// « court » : ce qu'il fait, en deux signes, pour les petites cases du cadeau du jour.
export type InfoBoost = { id: IdBoost; nom: string; court: string; emoji: string; description: string; minutes: number; gemmes: number }

// (25/10, prix revus par le propriétaire) Chaque bonus coûte 3 gemmes.
export const BOOSTS: Record<IdBoost, InfoBoost> = {
  production: { id: 'production', nom: 'Production × 2', court: '×2', emoji: '⚡', description: 'La mine et la foreuse creusent deux fois plus vite.', minutes: 15, gemmes: 3 },
  ventes: { id: 'ventes', nom: 'Ventes × 2', court: '×2', emoji: '💰', description: 'Tout ce que tu vends rapporte le double : coffre, wagonnets, foreuse.', minutes: 15, gemmes: 3 },
  clics: { id: 'clics', nom: 'Fortune', court: '×3', emoji: '⛏️', description: 'Chaque clic sur le bloc de la mine donne 3 blocs au lieu d’un.', minutes: 5, gemmes: 3 },
  employes: { id: 'employes', nom: 'Employés × 2', court: '×2', emoji: '👷', description: 'Tes mineurs creusent et tes pousseurs poussent deux fois plus vite.', minutes: 15, gemmes: 3 },
}
export const LISTE_BOOSTS: IdBoost[] = ['production', 'ventes', 'employes', 'clics']

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

// (25/10) Le bonus « Employés × 2 » : les mineurs creusent et les pousseurs poussent deux fois
// plus vite.
export function multiplicateurEmployes(etat: EtatJeu): number {
  return boostActif(etat, 'employes') ? 2 : 1
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
  return [t('{emoji} {nom} pendant {minutes} min !', { emoji: boost.emoji, nom: t(boost.nom), minutes: boost.minutes })]
}

// ---------------------------------------------------------------------------
// Les récompenses quotidiennes
// ---------------------------------------------------------------------------

// Une récompense : des gemmes, et des bonus pour un temps.
// (25/10) Plus d'argent : 3 000 $ au jour 3, ce n'était plus rien trois jours plus tard. Les
// bonus, eux, valent toujours le coup, quel que soit l'avancement du joueur.
export type BonusCadeau = { id: IdBoost; minutes: number }
export type Recompense = { gemmes: number; bonus: BonusCadeau[] }

// Les 7 jours de la série. Le 7e est le gros lot ; après, on recommence au jour 1.
export const RECOMPENSES_QUOTIDIENNES: Recompense[] = [
  { gemmes: 2, bonus: [{ id: 'employes', minutes: 10 }] },
  { gemmes: 3, bonus: [{ id: 'ventes', minutes: 15 }] },
  { gemmes: 3, bonus: [{ id: 'production', minutes: 15 }] },
  { gemmes: 4, bonus: [{ id: 'ventes', minutes: 30 }] },
  { gemmes: 5, bonus: [{ id: 'production', minutes: 30 }] },
  { gemmes: 6, bonus: [{ id: 'ventes', minutes: 30 }, { id: 'employes', minutes: 30 }] },
  { gemmes: 12, bonus: [{ id: 'production', minutes: 60 }, { id: 'ventes', minutes: 60 }] },
]

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

export function recupererQuotidien(etat: EtatJeu, aujourdhui: string): string[] {
  const { jour, disponible } = etatQuotidien(etat, aujourdhui)
  if (!disponible) return []
  const recompense = RECOMPENSES_QUOTIDIENNES[jour - 1]
  gagnerGemmes(etat, recompense.gemmes)
  for (const bonus of recompense.bonus) prolongerBoost(etat, bonus.id, bonus.minutes)
  etat.quotidien = { dernierJour: aujourdhui, serie: jour }
  return [t('🎁 Jour {jour} : +{gemmes} 💎 !', { jour, gemmes: recompense.gemmes })]
}
