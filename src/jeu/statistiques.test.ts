import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { cliquerMine, creerPartie, nouvellesStatistiques } from './mineur'
import { argentParSource, blocsLesPlusCasses } from './statistiques'

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
    expect(argentParSource(stats)).toEqual({ joueur: 300, wagonnet: 600, foreuse: 100 })
  })
})
