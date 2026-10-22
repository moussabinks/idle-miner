import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { embaucher } from './employes'
import { capaciteCoffre, creerPartie, debitMine } from './mineur'
import { production } from './production'

describe('la production de la mine', () => {
  it('compte la mine toute seule, puis chaque mineur', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    const seule = production(etat)
    expect(seule.mine).toBeCloseTo(debitMine(etat))
    expect(seule.mineurs).toHaveLength(0)
    expect(seule.total).toBeCloseTo(seule.mine)
    expect(seule.dollarsParMinute).toBeGreaterThan(0)

    etat.argent = 1_000_000
    embaucher(etat, aleatoireAvecGraine(2))
    const avecMineur = production(etat)
    expect(avecMineur.mineurs).toHaveLength(1)
    expect(avecMineur.totalMineurs).toBeGreaterThan(0)
    expect(avecMineur.total).toBeGreaterThan(seule.total)
  })

  it("un mineur qui attend son salaire ne compte pas, et tout s'arrête quand le coffre est plein", () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.argent = 1_000_000
    embaucher(etat, aleatoireAvecGraine(2))
    etat.employes[0].etape = 'attend'
    expect(production(etat).totalMineurs).toBe(0)
    etat.employes[0].etape = 'creuse'
    etat.coffre.contenu = { pierre: capaciteCoffre(etat) }
    const pleine = production(etat)
    expect(pleine.arretee).toBe(true)
    expect(pleine.total).toBe(0)
  })
})
