import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment } from './batiments'
import { embaucher } from './employes'
import { cliquerMine, creerPartie, vendreCoffre } from './mineur'
import { ETAPES_TUTORIEL, avancerTutoriel, etapeSuivante, etapeTutoriel, passerTutoriel } from './tutoriel'

describe('le tutoriel (27/10, plus court le 25/10)', () => {
  it('les étapes : bonjour, creuser, vendre, le Personnel, le premier mineur, bravo', () => {
    expect(ETAPES_TUTORIEL).toEqual(['bonjour', 'creuser', 'vendre', 'personnel', 'embaucher', 'bravo'])
  })

  it('un nouveau monde le suit étape par étape, en faisant les actions', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = creerPartie(hasard)
    expect(etapeTutoriel(etat)).toBe('bonjour')
    // (25/10) de l'argent de poche au départ : de quoi poser le Personnel et embaucher
    expect(etat.argent).toBe(80)
    // Sans le bouton, on ne passe pas le bonjour.
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('bonjour')
    etapeSuivante(etat)
    expect(etapeTutoriel(etat)).toBe('creuser')
    for (let i = 0; i < 10; i++) cliquerMine(etat, hasard)
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('vendre')
    vendreCoffre(etat)
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('personnel')
    construireBatiment(etat, 'employes', 9, 21)
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('embaucher')
    // Le premier mineur ne coûte presque rien : la vente des 10 premiers blocs suffit.
    expect(embaucher(etat, hasard)[0]).toBeDefined()
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('bravo')
    etapeSuivante(etat)
    expect(etapeTutoriel(etat)).toBeNull()
  })

  it('on peut le passer, et les vieilles parties n’en ont pas', () => {
    const etat = creerPartie(aleatoireAvecGraine(2))
    passerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBeNull()
    delete etat.tutoriel
    expect(etapeTutoriel(etat)).toBeNull()
  })
})
