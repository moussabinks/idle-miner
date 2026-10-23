import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { decouvertesAMontrer, marquerDecouvert } from './decouvertes'

describe('ce qui se débloque en descendant (la bulle ✨ du Personnel)', () => {
  it('le manager au niveau 3 de la mine, le recruteur au niveau 4 (23/10)', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    expect(decouvertesAMontrer(etat)).toEqual([])
    etat.niveauMine = 3
    expect(decouvertesAMontrer(etat)).toEqual(['manager'])
    marquerDecouvert(etat, ['manager'])
    expect(decouvertesAMontrer(etat)).toEqual([])
    etat.niveauMine = 4
    expect(decouvertesAMontrer(etat)).toEqual(['recruteur'])
  })
})
