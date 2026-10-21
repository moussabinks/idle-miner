// Les statistiques de la partie, pour l'écran 📊 : ce qu'on a cassé, ce que chaque source a
// rapporté (toi au marché, le wagonnet, la foreuse).

import type { IdBloc } from './donnees'
import type { Statistiques } from './mineur'

// D'où vient l'argent : toi (ventes au marché), le wagonnet, la foreuse.
export function argentParSource(stats: Statistiques): { joueur: number; wagonnet: number; foreuse: number } {
  const foreuse = stats.argentForeuse
  const wagonnet = stats.argentWagonnet
  return { joueur: Math.max(0, stats.argentGagne - foreuse - wagonnet), wagonnet, foreuse }
}

// Les blocs que tu as cassés en cliquant, du plus fréquent au plus rare.
export function blocsLesPlusCasses(stats: Statistiques): [IdBloc, number][] {
  return (Object.entries(stats.blocsParType) as [IdBloc, number][]).filter(([, n]) => n > 0).sort(([, a], [, b]) => b - a)
}
