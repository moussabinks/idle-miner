import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol } from './batiments'
import type { IdBatiment } from './donnees'
import { type EtatJeu } from './mineur'
import { embaucher } from './employes'
import { missions } from './missions'
import { achatsPossibles, standsAchetables } from './objectifs'

// Les bâtiments posés « à la main » (sans les payer), à des places libres autour de la mine
// (25/10 : la clairière fait 40 × 40 cases, la mine est en 15, 15).
const PLACES: Record<Exclude<IdBatiment, 'puits'>, [number, number]> = {
  marche: [18, 30],
  forgeron: [26, 14],
  employes: [9, 21],
  foreuse: [26, 21],
  generateur: [25, 27],
}

function poser(etat: EtatJeu, ids: (keyof typeof PLACES)[]): void {
  for (const id of ids) etat.village.batiments.push({ id, x: PLACES[id][0], y: PLACES[id][1], miroir: false })
}

describe('les missions (en haut à droite)', () => {
  const ids = (etat: EtatJeu) => missions(etat).map((m) => m.id)

  it('tout au début (25/10) : casser des blocs, vendre le coffre, construire le Personnel, embaucher', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    expect(missions(etat)[0]).toMatchObject({ id: 'casser', stand: 'puits', progression: { valeur: 0, max: 10 } })
    etat.stats.blocsCasses = 10
    etat.coffre.contenu = { pierre: 10 }
    expect(missions(etat)[0]).toMatchObject({ id: 'vendre', stand: 'puits', pret: true })
    etat.coffre.contenu = {}
    etat.stats.argentGagne = 10
    expect(missions(etat)[0]).toMatchObject({ id: 'personnel', construction: true, pret: false })
    etat.argent = 40
    expect(missions(etat)[0]).toMatchObject({ id: 'personnel', pret: true })
    poser(etat, ['employes'])
    expect(missions(etat)[0]).toMatchObject({ id: 'mineur', stand: 'employes' })
  })

  it('(25/10) le marché arrive avec les rails, une fois le premier mineur embauché', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    poser(etat, ['employes'])
    etat.stats.argentGagne = 100
    etat.argent = 1000
    expect(ids(etat)).not.toContain('marche')
    embaucher(etat, aleatoireAvecGraine(2))
    expect(missions(etat).find((m) => m.id === 'marche')).toMatchObject({ construction: true, pret: true })
  })

  it('il y a toujours une à trois missions', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    poser(etat, ['employes'])
    etat.stats.argentGagne = 5
    const liste = missions(etat)
    expect(liste.length).toBeGreaterThanOrEqual(1)
    expect(liste.length).toBeLessThanOrEqual(3)
  })

  it('un bâtiment : ce qui manque, avec sa progression (« 12 / 15 pierre »)', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'employes'])
    etat.stats.argentGagne = 100
    etat.argent = 1000
    etat.coffre.contenu = { pierre: 12 }
    // (le forgeron vient après le Personnel et le marché dans le menu : 30 $ et 15 pierre)
    const forgeron = missions(etat).find((m) => m.id === 'construire-forgeron')
    // (23/10) tout ce qu'il faut, dès le début : l'argent et la pierre, chacun avec sa jauge
    // (25/10) « Voir » ouvre le menu Bâtiments (avant : la mine), pour montrer le forgeron
    expect(forgeron).toMatchObject({ construction: true, texte: 'Construis : Forgeron' })
    expect(forgeron?.elements).toEqual([
      { icone: '💵', nom: '$', valeur: 30, max: 30 },
      { icone: expect.any(String), nom: 'pierre', valeur: 12, max: 15 },
    ])
    etat.coffre.contenu = { pierre: 60 }
    expect(missions(etat).find((m) => m.id === 'construire-forgeron')).toMatchObject({ construction: true, pret: true })
  })

  it('l’automatisation : les rails (sans dire combien de fer), puis le wagonnet', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'employes'])
    etat.stats.argentGagne = 100
    etat.argent = 100
    embaucher(etat, aleatoireAvecGraine(2)) // (25/10) l'automatisation vient après le premier mineur
    expect(missions(etat).find((m) => m.id === 'rails')).toMatchObject({ pret: false, progression: null })
    etat.coffre.contenu = { fer: 300 }
    expect(missions(etat).find((m) => m.id === 'rails')).toMatchObject({ pret: true })
    for (let y = 25; y <= 29; y++) poserSol(etat, 'rail', 20, y)
    expect(ids(etat)).toContain('trajet')
  })

  it('(25/10) les améliorations d’un seul employé passent après les grosses (mine, coffre, pioches...)', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'employes'])
    etat.stats.argentGagne = 100
    etat.niveauMine = 2
    etat.argent = 100
    embaucher(etat, aleatoireAvecGraine(2))
    etat.argent = 1_000
    const nom = etat.employes[0].nom
    // Il y a bien une amélioration pour ce mineur...
    expect(achatsPossibles(etat).some((a) => a.employe === nom)).toBe(true)
    // ... mais les tâches montrent d'abord les grosses.
    expect(missions(etat).some((m) => m.texte.includes(nom))).toBe(false)
  })

  it('les urgences passent devant : salaires, coffre plein', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
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
    const etat = partieDeTest(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'employes'])
    etat.niveauMine = 2 // (25/10) la pioche en fer attend le palier 2 de la mine
    etat.argent = 500
    etat.coffre.contenu = { fer: 40 }
    expect(standsAchetables(etat)).toEqual(expect.arrayContaining(['forgeron', 'employes']))
  })
})
