import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { meilleurArgent, meilleurScore, niveauMineAffiche } from './classement'
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
  it('prend le meilleur niveau de mine et le plus d’argent en poche parmi les mondes (23/10)', () => {
    const stockage = fauxStockage()
    const avance = creerPartie(aleatoireAvecGraine(1))
    avance.niveauMine = 3
    avance.argent = 500
    avance.stats.argentGagne = 1_000_000 // l'argent gagné en tout ne compte plus
    const riche = creerPartie(aleatoireAvecGraine(2))
    riche.argent = 90_000.7
    creerMonde(stockage, 'Avancé', avance)
    creerMonde(stockage, 'Riche', riche)

    expect(meilleurScore(exporterTout(stockage))).toEqual({ prestige: 3, argent: 90_000 })
  })

  it('donne 0 sans aucun monde', () => {
    expect(meilleurScore({})).toEqual({ prestige: 0, argent: 0 })
  })
})

describe('classement à l’argent (23/10)', () => {
  it('le niveau de mine affiché : rien pour un ancien prestige', () => {
    expect(niveauMineAffiche({ prestige: 3, argent: 0 })).toBe(3)
    expect(niveauMineAffiche({ prestige: 12, argent: 0 })).toBeNull()
    expect(niveauMineAffiche({ prestige: 0, argent: 0 })).toBeNull()
  })

  it('le plus d’argent en poche des mondes (les mondes illisibles comptent pour 0)', () => {
    expect(meilleurArgent([{ argent: 120.7 }, null, { argent: 80 }])).toBe(120)
    expect(meilleurArgent([])).toBe(0)
  })
})
