import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { NIVEAUX_MINE, SALAIRES } from './donnees'
import { valeurMoyenneBloc } from './mine'
import { embaucher } from './employes'
import { partieDeTest } from './partieDeTest'
import { bilanParMinute } from './revenu'

describe('le bilan par minute (23/10)', () => {
  it('les salaires par minute, ce que produisent les mineurs, et le solde', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 10_000
    // (25/10) Au niveau 1, la mine creuse déjà un peu toute seule : un petit gain, aucune dépense.
    const depart = bilanParMinute(etat)
    expect(depart.totalDepenses).toBe(0)
    expect(depart.net).toBeCloseTo(NIVEAUX_MINE[0].debit * valeurMoyenneBloc(1) * 60)
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
