// Les statistiques de la partie, pour l'écran 📊 : ce qu'on a cassé, ce que chaque source a
// rapporté (toi, la foreuse, les mineurs)... Pour cette partie, et depuis le tout début
// (les parties d'avant, gardées à chaque prestige dans etat.statsTotales).

import type { IdBloc } from './donnees'
import type { EtatJeu, Inventaire, Statistiques } from './mineur'

// Additionne deux séries de statistiques (le plus bas atteint : on garde le plus profond).
export function additionnerStatistiques(a: Statistiques, b: Statistiques): Statistiques {
  const blocsParType: Inventaire = { ...a.blocsParType }
  for (const [id, nombre] of Object.entries(b.blocsParType)) {
    const bloc = id as IdBloc
    blocsParType[bloc] = (blocsParType[bloc] ?? 0) + (nombre ?? 0)
  }
  return {
    blocsCasses: a.blocsCasses + b.blocsCasses,
    argentGagne: a.argentGagne + b.argentGagne,
    tempsMinage: a.tempsMinage + b.tempsMinage,
    coffresOuverts: a.coffresOuverts + b.coffresOuverts,
    geodesCassees: a.geodesCassees + b.geodesCassees,
    lavesEteintes: a.lavesEteintes + b.lavesEteintes,
    diamantsTrouves: a.diamantsTrouves + b.diamantsTrouves,
    argentForeuse: a.argentForeuse + b.argentForeuse,
    argentMineurs: a.argentMineurs + b.argentMineurs,
    blocsParType,
    blocsForeuse: a.blocsForeuse + b.blocsForeuse,
    blocsMineurs: a.blocsMineurs + b.blocsMineurs,
    profondeurMax: Math.max(a.profondeurMax, b.profondeurMax),
    salairesPayes: a.salairesPayes + b.salairesPayes,
  }
}

// Toutes les parties ensemble : celles d'avant, plus celle-ci.
export function statistiquesDepuisLeDebut(etat: EtatJeu): Statistiques {
  return additionnerStatistiques(etat.statsTotales, etat.stats)
}

// D'où vient l'argent : toi (marché, ascenseur, coffres), la foreuse, les mineurs.
export function argentParSource(stats: Statistiques): { joueur: number; foreuse: number; mineurs: number } {
  const foreuse = stats.argentForeuse
  const mineurs = stats.argentMineurs
  return { joueur: Math.max(0, stats.argentGagne - foreuse - mineurs), foreuse, mineurs }
}

// Les blocs que tu as cassés, du plus fréquent au plus rare.
export function blocsLesPlusCasses(stats: Statistiques): [IdBloc, number][] {
  return (Object.entries(stats.blocsParType) as [IdBloc, number][]).filter(([, n]) => n > 0).sort(([, a], [, b]) => b - a)
}
