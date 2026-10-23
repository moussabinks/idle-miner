import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { SALAIRES } from './donnees'
import { embaucher } from './employes'
import { partieDeTest } from './partieDeTest'
import { bilanParMinute } from './revenu'

describe('le bilan par minute (23/10)', () => {
  it('les salaires par minute, ce que produisent les mineurs, et le solde', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 10_000
    expect(bilanParMinute(etat).net).toBe(0)
    embaucher(etat, aleatoireAvecGraine(2))
    const bilan = bilanParMinute(etat)
    // Un mineur en bois : son salaire de 5 minutes, ramené à la minute.
    expect(bilan.totalDepenses).toBeCloseTo(SALAIRES[0] / 5)
    expect(bilan.gains.find((l) => l.id === 'mineurs')?.parMinute).toBeGreaterThan(0)
    expect(bilan.net).toBeCloseTo(bilan.totalGains - bilan.totalDepenses)
    // Un mineur en bois au niveau 1 de la mine est rentable.
    expect(bilan.net).toBeGreaterThan(0)
  })
})
