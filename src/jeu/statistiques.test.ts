import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { cliquerMine, creerPartie, nouvellesStatistiques } from './mineur'
import { ajouterTempsOuvert, argentParSource, blocsLesPlusCasses } from './statistiques'

describe('statistiques', () => {
  it('compte les blocs cassés en cliquant, par sorte, du plus fréquent au plus rare', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    const hasard = aleatoireAvecGraine(2)
    for (let i = 0; i < 50; i++) cliquerMine(etat, hasard)
    const blocs = blocsLesPlusCasses(etat.stats)
    expect(blocs.reduce((t, [, n]) => t + n, 0)).toBe(50)
    expect(blocs[0][0]).toBe('pierre')
  })

  it('sépare l’argent du marché, du wagonnet et de la foreuse', () => {
    const stats = { ...nouvellesStatistiques(), argentGagne: 1000, argentWagonnet: 600, argentForeuse: 100 }
    expect(argentParSource(stats)).toEqual({ joueur: 300, wagonnet: 600, foreuse: 100, ateliers: 0 })
    // (26/10) les ateliers à part
    expect(argentParSource({ ...stats, argentAteliers: 200 })).toEqual({ joueur: 100, wagonnet: 600, foreuse: 100, ateliers: 200 })
  })
})

describe('le temps de jeu de l’écran 📊 (27/10)', () => {
  it('compte le temps jeu ouvert, et un saut d’horloge au plus 5 s', () => {
    const stats = nouvellesStatistiques()
    ajouterTempsOuvert(stats, 0.05)
    ajouterTempsOuvert(stats, 0.05)
    ajouterTempsOuvert(stats, 3600)
    expect(stats.tempsOuvert).toBeCloseTo(5.1)
    expect(stats.tempsDeJeu).toBe(0)
  })
})
