import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol, stockSol } from './batiments'
import { partieDeTest } from './partieDeTest'
import {
  annulerReorganisation,
  batimentsRanges,
  commencerReorganisation,
  peutTerminerReorganisation,
  rangerBatiment,
  reposerBatiment,
  terminerReorganisation,
} from './reorganiser'
import { avancerTemps } from './temps'

// Une partie avec la mine, le marché, 5 rails et 2 pavés.
function partie() {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.village.batiments.push({ id: 'marche', x: 18, y: 30, miroir: true })
  etat.coffre.contenu = { fer: 15 }
  etat.argent = 100
  for (let y = 25; y <= 29; y++) poserSol(etat, 'rail', 20, y)
  poserSol(etat, 'chemin', 5, 5)
  poserSol(etat, 'chemin', 6, 5)
  return etat
}

describe('réorganiser le village (26/10, façon Clash of Clans)', () => {
  it('« Tout ranger » : tout part dans la barre, les rails et les pavés en stock', () => {
    const etat = partie()
    commencerReorganisation(etat)
    expect(etat.village.batiments).toEqual([])
    expect(etat.village.rails).toEqual([])
    expect(batimentsRanges(etat).map((r) => r.id).sort()).toEqual(['marche', 'puits'])
    expect(stockSol(etat, 'rail')).toBe(5)
    expect(stockSol(etat, 'chemin')).toBe(2)
  })

  it('le jeu est en pause tant que ce n’est pas fini', () => {
    const etat = partie()
    commencerReorganisation(etat)
    const avant = JSON.stringify(etat)
    avancerTemps(etat, 600, aleatoireAvecGraine(2))
    expect(JSON.stringify(etat)).toBe(avant)
  })

  it('on ne finit qu’avec tous les bâtiments posés ; les rails restants vont en stock', () => {
    const etat = partie()
    commencerReorganisation(etat)
    reposerBatiment(etat, 'puits', 2, 2, false)
    expect(peutTerminerReorganisation(etat)).toBe(false)
    expect(terminerReorganisation(etat)).toEqual([])
    // Pas sur un autre bâtiment.
    expect(reposerBatiment(etat, 'marche', 3, 3, false)).toEqual([])
    reposerBatiment(etat, 'marche', 20, 20, true)
    // On peut remettre un bâtiment dans la barre, puis le reposer.
    rangerBatiment(etat, 'marche')
    expect(peutTerminerReorganisation(etat)).toBe(false)
    reposerBatiment(etat, 'marche', 25, 20, true)
    poserSol(etat, 'rail', 15, 12) // un rail du stock, gratuit
    expect(etat.coffre.contenu.fer ?? 0).toBe(0)
    expect(terminerReorganisation(etat)[0]).toContain('village')
    expect(etat.reorganisation).toBeNull()
    expect(etat.village.batiments).toContainEqual({ id: 'marche', x: 25, y: 20, miroir: true })
    expect(stockSol(etat, 'rail')).toBe(4)
  })

  it('« Annuler » remet le village comme avant', () => {
    const etat = partie()
    const avant = structuredClone(etat.village)
    commencerReorganisation(etat)
    reposerBatiment(etat, 'puits', 2, 2, false)
    annulerReorganisation(etat)
    expect(etat.village).toEqual(avant)
    expect(stockSol(etat, 'rail')).toBe(0)
    expect(etat.reorganisation).toBeNull()
  })
})
