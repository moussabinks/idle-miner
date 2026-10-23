import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment } from './batiments'
import { cliquerMine, creerPartie, prendreDuCoffre, vendreLot } from './mineur'
import { avancerTutoriel, etapeSuivante, etapeTutoriel, passerTutoriel } from './tutoriel'

describe('le tutoriel (27/10, forgeron le 29/10)', () => {
  it('un nouveau monde le suit étape par étape, en faisant les actions', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = creerPartie(hasard)
    expect(etapeTutoriel(etat)).toBe('bonjour')
    // (23/10) un peu d'argent de poche au départ : de quoi payer le forgeron à la fin
    expect(etat.argent).toBe(10)
    // Sans le bouton, on ne passe pas le bonjour.
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('bonjour')
    etapeSuivante(etat)
    expect(etapeTutoriel(etat)).toBe('creuser')
    for (let i = 0; i < 10; i++) cliquerMine(etat, hasard)
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('marche')
    construireBatiment(etat, 'marche', 28, 40)
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('sac')
    prendreDuCoffre(etat)
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('vendre')
    vendreLot(etat, { ...etat.inventaire })
    avancerTutoriel(etat)
    expect(etapeTutoriel(etat)).toBe('forgeron')
    // (le forgeron coûte de l'argent et de la pierre)
    etat.argent += 100
    etat.coffre.contenu.pierre = 20
    construireBatiment(etat, 'forgeron', 36, 24)
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
