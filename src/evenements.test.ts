import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine, type Aleatoire } from './jeu/aleatoire'
import { cliquerMine, creerPartie, vendreCoffre } from './jeu/mineur'
import { evenementsEntre } from './evenements'

const toujours = (valeur: number): Aleatoire => () => valeur

describe('événements pour les sons et les animations', () => {
  it('un bloc de pierre cassé', () => {
    const avant = creerPartie(aleatoireAvecGraine(3))
    avant.prochainBloc = 'pierre'
    const apres = structuredClone(avant)
    cliquerMine(apres, toujours(0.5))
    expect(evenementsEntre(avant, apres)).toEqual([{ type: 'casse', bloc: 'pierre', nombre: 1, rare: false }])
  })

  it('un diamant doublé', () => {
    const avant = creerPartie(aleatoireAvecGraine(3))
    avant.prochainBloc = 'diamant'
    const apres = structuredClone(avant)
    cliquerMine(apres, toujours(0))
    expect(evenementsEntre(avant, apres)).toContainEqual({ type: 'casse', bloc: 'diamant', nombre: 2, rare: true })
  })

  it('une vente (le coffre de la mine)', () => {
    const avant = creerPartie(aleatoireAvecGraine(3))
    avant.coffre.contenu = { fer: 2 }
    const apres = structuredClone(avant)
    vendreCoffre(apres)
    expect(evenementsEntre(avant, apres)).toEqual([{ type: 'vente', montant: 24 }])
  })

  it('la pioche qui casse', () => {
    const avant = creerPartie(aleatoireAvecGraine(3))
    avant.pioches[0] = 149
    const apres = structuredClone(avant)
    cliquerMine(apres, toujours(0.5))
    expect(evenementsEntre(avant, apres).map((e) => e.type)).toContain('piocheCassee')
  })
})
