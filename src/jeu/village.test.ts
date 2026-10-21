import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  acheterDecoration,
  batimentsConstructibles,
  construireBatiment,
  deplacerBatiment,
  marquerBatimentsVus,
  nouveautesBatiments,
  peutConstruire,
  poserSol,
  retirerDecoration,
} from './batiments'
import { avancerConvois, chargerWagonnet } from './convois'
import { VITESSE_MARCHE } from './donnees'
import { ameliorerEmploye, avancerEmployes, embaucher } from './employes'
import { creerPartie, prestige, type EtatJeu } from './mineur'
import { notificationsBatiments } from './notifications'
import { acheterTenue, porterTenue } from './tenues'
import {
  POSITION_MINE,
  batimentPose,
  caseAcces,
  distanceEntre,
  envoyerAuMarche,
  porte,
  railsMineMarche,
  trajetChargement,
  trouverChemin,
} from './village'

function partie(niveauPrestige = 0): EtatJeu {
  return creerPartie(aleatoireAvecGraine(1), niveauPrestige)
}

// Une ligne droite de rails de (x, y1) à (x, y2).
function ligneDeRails(etat: EtatJeu, x: number, y1: number, y2: number): void {
  for (let y = y1; y <= y2; y++) poserSol(etat, 'rail', x, y)
}

describe('le village vu du ciel', () => {
  it('commence avec la mine (10 × 10) au milieu de la clairière, et rien d’autre', () => {
    const etat = partie()
    expect(etat.village.batiments).toEqual([{ id: 'puits', x: POSITION_MINE.x, y: POSITION_MINE.y, miroir: false }])
    expect(POSITION_MINE).toEqual({ x: 15, y: 15 })
  })

  it('le marché est gratuit ; les autres coûtent de l’argent, de la pierre et du fer', () => {
    const etat = partie()
    expect(batimentsConstructibles(etat)).toEqual(['marche'])
    expect(construireBatiment(etat, 'marche', 18, 26)).toEqual(['🏗️ Marché construit !'])
    expect(peutConstruire(etat, 'marche')).toBe(false) // un seul marché
    expect(peutConstruire(etat, 'forgeron')).toBe(false)
    etat.argent = 20
    etat.inventaire = { pierre: 10 }
    construireBatiment(etat, 'forgeron', 26, 18)
    expect(batimentPose(etat.village, 'forgeron')).not.toBeNull()
    expect(etat.argent).toBe(0)
    expect(etat.inventaire).toEqual({})
  })

  it('la pierre se paie aussi avec de la roche dure (plus bas, il n’y a plus de pierre)', () => {
    const etat = partie()
    etat.argent = 60
    etat.inventaire = { pierre: 5, deepslate: 30 }
    construireBatiment(etat, 'bazar', 12, 26)
    expect(batimentPose(etat.village, 'bazar')).not.toBeNull()
    expect(etat.inventaire).toEqual({ deepslate: 20 }) // 5 pierres + 10 roches dures
  })

  it('on ne pose rien sur un autre bâtiment ni hors de la clairière', () => {
    const etat = partie()
    expect(construireBatiment(etat, 'marche', 20, 20)).toEqual([]) // sur la mine
    expect(construireBatiment(etat, 'marche', 37, 0)).toEqual([]) // dépasse le bord
    expect(construireBatiment(etat, 'marche', 0, 0)).not.toEqual([])
  })

  it('la foreuse et le Personnel se débloquent avec le prestige, avec une pastille « Nouveau »', () => {
    const p0 = partie(0)
    expect(nouveautesBatiments(p0)).toEqual(['marche', 'forgeron', 'bazar', 'enchanteur', 'prestige'])
    marquerBatimentsVus(p0)
    expect(nouveautesBatiments(p0)).toEqual([])
    p0.argent = 100_000
    p0.inventaire = { pierre: 200, fer: 100 }
    expect(peutConstruire(p0, 'foreuse')).toBe(false)
    p0.victoire = true
    const p2 = prestige(prestige(p0, aleatoireAvecGraine(2)), aleatoireAvecGraine(3))
    expect(nouveautesBatiments(p2)).toEqual(['foreuse', 'employes'])
  })

  it('les bâtiments restent au prestige', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 3, 3)
    etat.victoire = true
    expect(batimentPose(prestige(etat, aleatoireAvecGraine(2)).village, 'marche')).toEqual({ id: 'marche', x: 3, y: 3, miroir: false })
  })

  it('se déplace et se retourne gratuitement : l’entrée change de côté', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 3, 3)
    const marche = batimentPose(etat.village, 'marche')
    if (!marche) throw new Error('pas de marché')
    expect(porte(marche)).toEqual({ x: 5.5, y: 8.5 }) // devant la face avant gauche
    deplacerBatiment(etat, 'marche', 4, 3, true)
    expect(porte(marche)).toEqual({ x: 9.5, y: 5.5 }) // retourné : devant la face avant droite
    expect(deplacerBatiment(etat, 'marche', 16, 16, false)).toEqual([]) // pas sur la mine
    expect(marche.x).toBe(4)
  })
})

describe('marcher dans le village', () => {
  it('contourne les bâtiments', () => {
    const etat = partie()
    const chemin = trouverChemin(etat.village, { x: 14, y: 20 }, { x: 25, y: 20 })
    expect(chemin).not.toBeNull()
    // La mine est entre les deux : le chemin ne la traverse jamais.
    for (const c of chemin ?? []) expect(c.x >= 15 && c.x < 25 && c.y >= 15 && c.y < 25).toBe(false)
  })

  it('compte la distance à pied entre deux bâtiments (de porte à porte)', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 18, 27)
    const pres = distanceEntre(etat.village, 'puits', 'marche')
    deplacerBatiment(etat, 'marche', 34, 34, false)
    expect(distanceEntre(etat.village, 'puits', 'marche')).toBeGreaterThan(pres)
  })

  it('les grosses décorations bloquent le passage, pas les fleurs', () => {
    const etat = partie()
    etat.argent = 1000
    acheterDecoration(etat, 'arbre', 4, 4)
    const mine = batimentPose(etat.village, 'puits')
    if (!mine) throw new Error('pas de mine')
    expect(trouverChemin(etat.village, { x: 3, y: 4 }, { x: 6, y: 4 })?.some((c) => c.x === 4 && c.y === 4)).toBe(false)
    acheterDecoration(etat, 'fleurs-rouges', 10, 10)
    expect(etat.village.decorations).toHaveLength(2)
    expect(etat.argent).toBe(1000 - 150 - 15)
    retirerDecoration(etat, etat.village.decorations[0].n)
    expect(etat.village.decorations).toHaveLength(1)
    // L'entrée de la mine reste accessible.
    expect(caseAcces(etat.village, mine)).toEqual({ x: 20, y: 25 })
  })
})

describe('les chargements vers le marché', () => {
  it('ce que remonte l’ascenseur part au marché dans une brouette, et se vend en arrivant', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 18, 27)
    envoyerAuMarche(etat, { fer: 10 }, null)
    const trajet = trajetChargement(etat.village)
    expect(trajet?.parRails).toBe(false)
    expect(trajet?.duree).toBeCloseTo(distanceEntre(etat.village, 'puits', 'marche') / VITESSE_MARCHE)
    avancerConvois(etat, (trajet?.duree ?? 0) - 0.1)
    expect(etat.argent).toBe(0)
    avancerConvois(etat, 0.2)
    expect(etat.argent).toBe(120)
    expect(etat.convois).toEqual([])
  })

  it('sans marché, le chargement attend à la mine', () => {
    const etat = partie()
    envoyerAuMarche(etat, { fer: 10 }, null)
    avancerConvois(etat, 100)
    expect(etat.argent).toBe(0)
    construireBatiment(etat, 'marche', 18, 27)
    avancerConvois(etat, 100)
    expect(etat.argent).toBe(120)
  })

  it('les rails (prestige 2, 10 fer la case) relient la mine au marché : 3 fois plus rapide', () => {
    const p0 = partie(0)
    p0.inventaire = { fer: 100 }
    expect(poserSol(p0, 'rail', 20, 25)).toEqual([])
    expect(p0.village.rails).toEqual([]) // pas avant le prestige 2

    const etat = partie(2)
    construireBatiment(etat, 'marche', 18, 30)
    etat.inventaire = { fer: 50 }
    ligneDeRails(etat, 20, 25, 29) // 5 cases, de la mine (y = 24) au marché (y = 30)
    expect(etat.inventaire).toEqual({})
    expect(railsMineMarche(etat.village)).toHaveLength(5)
    expect(trajetChargement(etat.village)).toEqual({ duree: 1, parRails: true })
  })

  it('avec des rails, on peut charger le wagonnet depuis la mine', () => {
    const etat = partie(2)
    construireBatiment(etat, 'marche', 18, 30)
    etat.inventaire = { fer: 50 }
    expect(chargerWagonnet(etat, { fer: 5 })).toEqual([]) // pas encore de rails
    ligneDeRails(etat, 20, 25, 29)
    etat.inventaire = { diamant: 2 }
    chargerWagonnet(etat, { diamant: 2 })
    expect(etat.inventaire).toEqual({})
    avancerConvois(etat, 2)
    expect(etat.argent).toBe(Math.round(200 * 1.3))
  })
})

describe('les mineurs employés au village', () => {
  function avecPersonnel(): EtatJeu {
    const etat = partie(2)
    construireBatiment(etat, 'marche', 18, 30)
    etat.village.batiments.push({ id: 'employes', x: 30, y: 30, miroir: false }, { id: 'forgeron', x: 30, y: 18, miroir: false })
    etat.argent = 5000
    embaucher(etat, aleatoireAvecGraine(4))
    return etat
  }

  it('remonte, marche jusqu’au marché, vend, puis retourne à la mine', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    const etapes = new Set<string>()
    for (let i = 0; i < 600 && mineur.gagne === 0; i++) {
      avancerEmployes(etat, 0.5, aleatoireAvecGraine(i))
      etapes.add(`${mineur.etape}:${mineur.lieu}`)
    }
    expect(mineur.gagne).toBeGreaterThan(0)
    expect(etapes).toContain('marche:marche') // il marche vers le marché
    expect(etapes).toContain('vend:marche')
    for (let i = 0; i < 40 && mineur.etape !== 'descend'; i++) avancerEmployes(etat, 0.5, aleatoireAvecGraine(i))
    expect(mineur.lieu).toBe('puits')
  })

  it('avec des rails jusqu’au marché, il charge le wagonnet au lieu de marcher', () => {
    const etat = avecPersonnel()
    etat.inventaire = { fer: 50 }
    ligneDeRails(etat, 20, 25, 29)
    const mineur = etat.employes[0]
    let aMarche = false
    for (let i = 0; i < 600 && etat.stats.argentMineurs === 0; i++) {
      avancerEmployes(etat, 0.5, aleatoireAvecGraine(i))
      avancerConvois(etat, 0.5)
      if (mineur.etape === 'marche' || mineur.etape === 'vend') aMarche = true
    }
    expect(etat.stats.argentMineurs).toBeGreaterThan(0)
    expect(aMarche).toBe(false)
    expect(mineur.gagne).toBe(etat.stats.argentMineurs)
  })

  it('après une amélioration, il va chercher sa pioche à la forge', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    etat.argent = 10_000
    ameliorerEmploye(etat, 0)
    expect(mineur.forgeEnAttente).toBe(true)
    let aLaForge = false
    for (let i = 0; i < 800 && mineur.forgeEnAttente; i++) {
      avancerEmployes(etat, 0.5, aleatoireAvecGraine(i))
      if (mineur.etape === 'forge') aLaForge = true
    }
    expect(aLaForge).toBe(true)
    expect(mineur.forgeEnAttente).toBe(false)
  })

  it('pas payé : il marche jusqu’au Personnel et y attend', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    mineur.tempsPaye = 1
    const messages: string[] = []
    for (let i = 0; i < 400 && mineur.etape !== 'attend'; i++) messages.push(...avancerEmployes(etat, 0.5, aleatoireAvecGraine(i)))
    expect(mineur.etape).toBe('attend')
    expect(mineur.lieu).toBe('employes')
    expect(messages.some((m) => m.includes('devant le Personnel'))).toBe(true)
    expect(notificationsBatiments(etat).employes?.[0].icone).toBe('😠')
  })
})

describe('les notifications au-dessus des bâtiments', () => {
  it('chariot plein et plus de charbon à la foreuse, seulement si elle est posée', () => {
    const etat = partie(1)
    etat.foreuse.active = true
    expect(notificationsBatiments(etat).foreuse).toBeUndefined()
    etat.village.batiments.push({ id: 'foreuse', x: 2, y: 2, miroir: false })
    expect(notificationsBatiments(etat).foreuse?.[0]).toMatchObject({ icone: '🔥', sorte: 'alerte' })
    etat.foreuse.chariot = { pierre: 1000 }
    expect(notificationsBatiments(etat).foreuse?.[0]).toMatchObject({ icone: '🛒', sorte: 'alerte' })
  })
})

describe('les tenues', () => {
  it('s’achètent au Bazar, se portent tout de suite et restent au prestige', () => {
    const etat = partie()
    etat.argent = 1000
    acheterTenue(etat, 'bandana')
    expect(etat.tenue.chapeau).toBe('bandana')
    expect(etat.argent).toBe(850)
    porterTenue(etat, 'chapeau', null)
    expect(etat.tenue.chapeau).toBeNull()
    expect(porterTenue(etat, 'chapeau', 'casquette')).toEqual([]) // pas achetée
    expect(etat.tenue.chapeau).toBeNull()
    etat.victoire = true
    expect(prestige(etat, aleatoireAvecGraine(2)).tenuesAchetees).toEqual(['bandana'])
  })
})
