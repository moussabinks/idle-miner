import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol } from './batiments'
import type { IdBatiment } from './donnees'
import { creerPartie, type EtatJeu } from './mineur'
import { embaucher } from './employes'
import { missions } from './missions'
import { standsAchetables } from './objectifs'

// Les bâtiments posés « à la main » (sans les payer), à des places libres autour de la mine.
const PLACES: Record<Exclude<IdBatiment, 'puits'>, [number, number]> = {
  marche: [28, 40],
  forgeron: [36, 24],
  bazar: [19, 25],
  employes: [19, 31],
  foreuse: [36, 31],
  generateur: [35, 37],
}

function poser(etat: EtatJeu, ids: (keyof typeof PLACES)[]): void {
  for (const id of ids) etat.village.batiments.push({ id, x: PLACES[id][0], y: PLACES[id][1], miroir: false })
}

describe('les missions (en haut à droite)', () => {
  const ids = (etat: EtatJeu) => missions(etat).map((m) => m.id)

  it('tout au début : poser le marché, casser des blocs, les vendre', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    expect(missions(etat)[0]).toMatchObject({ id: 'marche', construction: true, pret: true })
    poser(etat, ['marche'])
    expect(missions(etat)[0]).toMatchObject({ id: 'casser', stand: 'puits', progression: { valeur: 0, max: 10 } })
    etat.stats.blocsCasses = 10
    etat.coffre.contenu = { pierre: 10 }
    expect(ids(etat)[0]).toBe('remplir-sac')
    etat.inventaire = { pierre: 10 }
    expect(missions(etat)[0]).toMatchObject({ id: 'vendre', stand: 'marche' })
  })

  it('il y a toujours une à trois missions', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche'])
    etat.stats.argentGagne = 5
    const liste = missions(etat)
    expect(liste.length).toBeGreaterThanOrEqual(1)
    expect(liste.length).toBeLessThanOrEqual(3)
  })

  it('un bâtiment : ce qui manque, avec sa progression (« 12 / 25 pierre »)', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron'])
    etat.stats.argentGagne = 100
    etat.argent = 1000
    etat.coffre.contenu = { pierre: 12 }
    const bazar = missions(etat).find((m) => m.id === 'construire-bazar')
    expect(bazar).toMatchObject({ stand: 'puits', progression: { valeur: 12, max: 25 } })
    etat.coffre.contenu = { pierre: 30 }
    expect(missions(etat).find((m) => m.id === 'construire-bazar')).toMatchObject({ construction: true, pret: true })
  })

  it('l’automatisation : du fer pour les rails, les rails, puis le wagonnet', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'bazar', 'employes'])
    etat.stats.argentGagne = 100
    expect(ids(etat)).toContain('fer-rails')
    etat.inventaire = { fer: 300 }
    expect(ids(etat)).toContain('rails')
    for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
    expect(ids(etat)).toContain('trajet')
  })

  it('les urgences passent devant : salaires, coffre plein', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'employes'])
    etat.argent = 10_000
    embaucher(etat, aleatoireAvecGraine(2))
    etat.employes[0].tempsPaye = 0
    etat.employes[0].etape = 'attend'
    expect(ids(etat)[0]).toBe('salaires')
  })
})

describe('stands achetables', () => {
  it('montre les bâtiments où un achat est payable tout de suite', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'bazar', 'employes'])
    etat.argent = 200
    etat.coffre.contenu = { fer: 25 }
    expect(standsAchetables(etat)).toEqual(expect.arrayContaining(['forgeron', 'employes']))
  })
})
