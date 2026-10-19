import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { embaucher } from './employes'
import { activerForeuse, vendreChariot } from './foreuse'
import { LARGEUR_MINE } from './donnees'
import { casserBloc, creerPartie, positionFront, prestige, type EtatJeu } from './mineur'
import { argentParSource, blocsLesPlusCasses, statistiquesDepuisLeDebut } from './statistiques'
import { avancerTemps } from './temps'

function auFront(etat: EtatJeu): EtatJeu {
  etat.position = positionFront(etat)
  etat.cible = etat.position
  return etat
}

describe('statistiques', () => {
  it('compte les blocs cassés par sorte, et le plus bas atteint', () => {
    const etat = auFront(creerPartie(aleatoireAvecGraine(1)))
    etat.coucheActuelle = Array(LARGEUR_MINE).fill('terre')
    etat.coucheActuelle[3] = 'charbon'
    for (let i = 0; i < 4; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.stats.blocsParType).toEqual({ terre: 3, charbon: 1 })
    expect(blocsLesPlusCasses(etat.stats)).toEqual([
      ['terre', 3],
      ['charbon', 1],
    ])
    expect(etat.stats.profondeurMax).toBe(etat.profondeur)
  })

  it('sépare l’argent de la foreuse et des mineurs de ton argent à toi', () => {
    const etat = creerPartie(aleatoireAvecGraine(1), 2)
    etat.argent = 100_000
    etat.inventaire = { fer: 10, redstone: 5 }
    activerForeuse(etat)
    etat.foreuse.chariot = { fer: 10 }
    vendreChariot(etat)
    embaucher(etat)
    avancerTemps(etat, 600, aleatoireAvecGraine(2))
    const sources = argentParSource(etat.stats)
    expect(sources.foreuse).toBeGreaterThan(0)
    expect(sources.mineurs).toBeGreaterThan(0)
    expect(sources.joueur).toBe(0) // tu n'as rien vendu toi-même
    expect(etat.stats.blocsMineurs).toBeGreaterThan(0)
  })

  it('additionne les parties au prestige (depuis le début)', () => {
    const etat = auFront(creerPartie(aleatoireAvecGraine(1)))
    etat.coucheActuelle = Array(LARGEUR_MINE).fill('terre')
    casserBloc(etat, aleatoireAvecGraine(1))
    etat.stats.argentGagne = 500
    const suite = auFront(prestige(etat, aleatoireAvecGraine(2)))
    expect(suite.stats.blocsCasses).toBe(0) // une nouvelle partie...
    suite.coucheActuelle = Array(LARGEUR_MINE).fill('terre')
    casserBloc(suite, aleatoireAvecGraine(3))
    const total = statistiquesDepuisLeDebut(suite)
    expect(total.blocsCasses).toBe(2) // ... mais le total compte les deux
    expect(total.blocsParType.terre).toBe(2)
    expect(total.argentGagne).toBe(500)
  })
})
