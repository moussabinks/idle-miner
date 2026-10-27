// Les statistiques de la partie, pour l'écran 📊 : ce qu'on a cassé, ce que chaque source a
// rapporté (toi au marché, le wagonnet, la foreuse).

import type { IdBloc } from './donnees'
import type { Statistiques } from './mineur'

// D'où vient l'argent : toi (ventes au marché), le wagonnet, la foreuse, et (26/10) les ateliers
// (les lingots et les bijoux vendus d'un clic).
export function argentParSource(stats: Statistiques): { joueur: number; wagonnet: number; foreuse: number; ateliers: number } {
  const foreuse = stats.argentForeuse
  const wagonnet = stats.argentWagonnet
  const ateliers = stats.argentAteliers ?? 0
  return { joueur: Math.max(0, stats.argentGagne - foreuse - wagonnet - ateliers), wagonnet, foreuse, ateliers }
}

// Les blocs que tu as cassés en cliquant, du plus fréquent au plus rare.
export function blocsLesPlusCasses(stats: Statistiques): [IdBloc, number][] {
  return (Object.entries(stats.blocsParType) as [IdBloc, number][]).filter(([, n]) => n > 0).sort(([, a], [, b]) => b - a)
}

// (27/10, demandé par le propriétaire) Le temps de jeu de l'écran 📊 : seulement le temps passé
// le jeu ouvert et à l'écran (pas les absences, quand le manager fait tourner la partie). Une
// horloge qui saute d'un coup (ordinateur en veille...) compte au plus TIC_MAX secondes.
const TIC_MAX = 5

export function ajouterTempsOuvert(stats: Statistiques, secondes: number): void {
  stats.tempsOuvert = (stats.tempsOuvert ?? 0) + Math.max(0, Math.min(TIC_MAX, secondes))
}
