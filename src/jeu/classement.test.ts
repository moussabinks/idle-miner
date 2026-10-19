import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { meilleurScore } from './classement'
import { creerPartie } from './mineur'
import { creerMonde, exporterTout, type Stockage } from './sauvegarde'

function fauxStockage(): Stockage {
  const donnees = new Map<string, string>()
  return {
    getItem: (cle) => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => void donnees.set(cle, valeur),
    removeItem: (cle) => void donnees.delete(cle),
  }
}

describe('classement', () => {
  it('prend le meilleur prestige et le plus d’argent gagné parmi les mondes', () => {
    const stockage = fauxStockage()
    const avance = creerPartie(aleatoireAvecGraine(1), 3)
    avance.stats.argentGagne = 500
    avance.argentGagneAvant = 20_000
    const riche = creerPartie(aleatoireAvecGraine(2), 1)
    riche.stats.argentGagne = 90_000.7
    creerMonde(stockage, 'Avancé', avance)
    creerMonde(stockage, 'Riche', riche)

    expect(meilleurScore(exporterTout(stockage))).toEqual({ prestige: 3, argent: 90_000 })
  })

  it('donne 0 sans aucun monde', () => {
    expect(meilleurScore({})).toEqual({ prestige: 0, argent: 0 })
  })
})
