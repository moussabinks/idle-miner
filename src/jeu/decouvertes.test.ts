import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { decouvertesAMontrer, marquerDecouvert } from './decouvertes'
import { creerPartie, prestige } from './mineur'

describe('stands à découvrir (la flèche du village)', () => {
  it('rien au prestige 0, la foreuse au prestige 1, les mineurs au prestige 2', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    expect(decouvertesAMontrer(etat)).toEqual([])
    etat.victoire = true
    const p1 = prestige(etat, aleatoireAvecGraine(2))
    expect(decouvertesAMontrer(p1)).toEqual(['foreuse'])
    // Il va voir la foreuse : la flèche disparaît, et ne revient pas au prestige suivant.
    marquerDecouvert(p1, 'foreuse')
    expect(decouvertesAMontrer(p1)).toEqual([])
    const p2 = prestige(p1, aleatoireAvecGraine(3))
    expect(decouvertesAMontrer(p2)).toEqual(['employes'])
  })

  it('montre les deux s’il n’a encore vu aucun des deux', () => {
    const etat = creerPartie(aleatoireAvecGraine(1), 2)
    expect(decouvertesAMontrer(etat)).toEqual(['foreuse', 'employes'])
  })
})

describe('prestige', () => {
  it('garde les pioches débloquées, réparées, et équipe la meilleure', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.pioches = { 0: 10, 1: 0, 2: 100, 3: 500, 4: 800 }
    etat.meilleure = 4
    etat.niveauPioche = 2
    const suite = prestige(etat, aleatoireAvecGraine(2))
    expect(suite.pioches).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })
    expect(suite.meilleure).toBe(4)
    expect(suite.niveauPioche).toBe(4)
  })

  it('garde la taille du sac à dos', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.niveauSac = 4
    expect(prestige(etat, aleatoireAvecGraine(2)).niveauSac).toBe(4)
  })
})
