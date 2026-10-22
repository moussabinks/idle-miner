import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { decouvertesAMontrer, marquerDecouvert } from './decouvertes'

describe('ce qui se débloque en descendant (la bulle ✨ du Personnel)', () => {
  it('le recruteur au niveau 3 de la mine, le manager au niveau 4', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    expect(decouvertesAMontrer(etat)).toEqual([])
    etat.niveauMine = 3
    expect(decouvertesAMontrer(etat)).toEqual(['recruteur'])
    marquerDecouvert(etat, ['recruteur'])
    expect(decouvertesAMontrer(etat)).toEqual([])
    etat.niveauMine = 4
    expect(decouvertesAMontrer(etat)).toEqual(['manager'])
  })
})
