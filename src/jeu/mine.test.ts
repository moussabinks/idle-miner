import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { chancesDesBlocs, infoNiveauMine, tirerBloc, valeurMoyenneBloc } from './mine'

describe('la mine à 5 niveaux', () => {
  it('ne sort que les blocs de son niveau', () => {
    const hasard = aleatoireAvecGraine(5)
    const vus = new Set(Array.from({ length: 2000 }, () => tirerBloc(1, hasard)))
    expect([...vus].sort()).toEqual(['charbon', 'fer', 'pierre'])
    const vus5 = new Set(Array.from({ length: 4000 }, () => tirerBloc(5, hasard)))
    expect(vus5.size).toBe(7)
  })

  it('les chances font 100 %', () => {
    for (let n = 1; n <= 5; n++) {
      const total = Object.values(chancesDesBlocs(n)).reduce((t, c) => t + (c ?? 0), 0)
      expect(total).toBeCloseTo(1)
    }
  })

  it('un bloc vaut en moyenne plus cher plus bas (et avec une bonne pioche)', () => {
    for (let n = 2; n <= 5; n++) expect(valeurMoyenneBloc(n)).toBeGreaterThan(valeurMoyenneBloc(n - 1))
    expect(valeurMoyenneBloc(1, 0.2)).toBeGreaterThan(valeurMoyenneBloc(1))
  })

  it('la mine sort plus de blocs toute seule plus bas', () => {
    for (let n = 2; n <= 5; n++) expect(infoNiveauMine(n).debit).toBeGreaterThan(infoNiveauMine(n - 1).debit)
    expect(infoNiveauMine(9).niveau).toBe(5) // on ne sort pas de la liste
  })
})
