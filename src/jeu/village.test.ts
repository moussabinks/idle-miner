import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  batimentsConstructibles,
  construireBatiment,
  deplacerBatiment,
  marquerBatimentsVus,
  nouveautesBatiments,
  peutConstruire,
  poserSol,
  retirerSol,
} from './batiments'
import { ameliorerEmploye, avancerEmployes, embaucher } from './employes'
import { creerPartie, nbDansCoffre, type EtatJeu } from './mineur'
import { notificationsBatiments } from './notifications'
import {
  POSITION_MINE,
  RAYON_BATIMENT,
  batimentPose,
  caseAccesProche,
  distanceAuBatiment,
  distanceEntre,
  longueurChemin,
  porte,
  railsMineMarche,
  trouverChemin,
} from './village'

function partie(): EtatJeu {
  return creerPartie(aleatoireAvecGraine(1))
}

// Une ligne droite de rails de (x, y1) à (x, y2).
function ligneDeRails(etat: EtatJeu, x: number, y1: number, y2: number): void {
  for (let y = y1; y <= y2; y++) poserSol(etat, 'rail', x, y)
}

describe('le village vu du ciel', () => {
  it('commence avec la mine (10 × 10) au milieu de la clairière, et rien d’autre', () => {
    const etat = partie()
    expect(etat.village.batiments).toEqual([{ id: 'puits', x: POSITION_MINE.x, y: POSITION_MINE.y, miroir: false }])
    expect(POSITION_MINE).toEqual({ x: 25, y: 25 })
  })

  it('le marché est gratuit ; les autres coûtent de l’argent et des minerais (du sac ou du coffre)', () => {
    const etat = partie()
    expect(batimentsConstructibles(etat)).toEqual(['marche'])
    expect(construireBatiment(etat, 'marche', 28, 36)).toEqual(['🏗️ Marché construit !'])
    expect(peutConstruire(etat, 'marche')).toBe(false) // un seul marché
    expect(peutConstruire(etat, 'forgeron')).toBe(false)
    etat.argent = 20
    etat.inventaire = { pierre: 10 }
    etat.coffre.contenu = { pierre: 8 }
    construireBatiment(etat, 'forgeron', 36, 28)
    expect(batimentPose(etat.village, 'forgeron')).not.toBeNull()
    expect(etat.argent).toBe(0)
    expect(etat.inventaire).toEqual({}) // le sac d'abord...
    expect(etat.coffre.contenu).toEqual({ pierre: 3 }) // ... puis le coffre de la mine
  })

  it('on ne pose rien sur un autre bâtiment ni hors de la clairière', () => {
    const etat = partie()
    expect(construireBatiment(etat, 'marche', 30, 30)).toEqual([]) // sur la mine
    expect(construireBatiment(etat, 'marche', 57, 0)).toEqual([]) // dépasse le bord
    expect(construireBatiment(etat, 'marche', 0, 0)).not.toEqual([])
  })

  it('la foreuse et le générateur se débloquent au niveau 2 de la mine, avec une pastille « Nouveau »', () => {
    const etat = partie()
    expect(nouveautesBatiments(etat)).toEqual(['marche', 'forgeron', 'bazar', 'employes'])
    marquerBatimentsVus(etat)
    expect(nouveautesBatiments(etat)).toEqual([])
    etat.argent = 100_000
    etat.inventaire = { pierre: 200, fer: 100, redstone: 50 }
    expect(peutConstruire(etat, 'foreuse')).toBe(false)
    etat.niveauMine = 2
    expect(nouveautesBatiments(etat)).toEqual(['foreuse', 'generateur'])
    expect(peutConstruire(etat, 'foreuse')).toBe(true)
  })

  it('se déplace et se retourne gratuitement : l’entrée change de côté', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 3, 3)
    const marche = batimentPose(etat.village, 'marche')
    if (!marche) throw new Error('pas de marché')
    expect(porte(marche)).toEqual({ x: 5.5, y: 8.5 }) // devant la face avant gauche
    deplacerBatiment(etat, 'marche', 4, 3, true)
    expect(porte(marche)).toEqual({ x: 9.5, y: 5.5 }) // retourné : devant la face avant droite
    expect(deplacerBatiment(etat, 'marche', 26, 26, false)).toEqual([]) // pas sur la mine
    expect(marche.x).toBe(4)
  })
})

describe('marcher dans le village', () => {
  it('contourne les bâtiments', () => {
    const etat = partie()
    const chemin = trouverChemin(etat.village, { x: 24, y: 30 }, { x: 35, y: 30 })
    expect(chemin).not.toBeNull()
    // La mine est entre les deux : le chemin ne la traverse jamais.
    for (const c of chemin ?? []) expect(c.x >= 25 && c.x < 35 && c.y >= 25 && c.y < 35).toBe(false)
  })

  it('on ouvre un bâtiment en s’approchant de n’importe quel côté', () => {
    const etat = partie()
    const mine = batimentPose(etat.village, 'puits')!
    // Juste au-dessus, à gauche, en dessous ou à droite de la mine (10 × 10, cases 25 à 34).
    for (const [x, y] of [[30, 24.5], [24.5, 30], [30, 35.5], [35.5, 30]]) expect(distanceAuBatiment(mine, x, y)).toBeLessThan(RAYON_BATIMENT)
    expect(distanceAuBatiment(mine, 30, 30)).toBe(0)
    expect(distanceAuBatiment(mine, 30, 22)).toBeGreaterThan(RAYON_BATIMENT)
  })

  it('toucher un bâtiment mène à son côté le plus proche, pas à sa porte', () => {
    const etat = partie()
    const mine = batimentPose(etat.village, 'puits')!
    // Le joueur est en haut de la mine : il n'a pas à faire le tour jusqu'à l'entrée (en bas).
    const c = caseAccesProche(etat.village, mine, { x: 30.5, y: 20.5 })
    expect(c).toEqual({ x: 30, y: 24 })
    expect(distanceAuBatiment(mine, c.x + 0.5, c.y + 0.5)).toBeLessThan(RAYON_BATIMENT)
  })

  it('va au point du tour du bâtiment le plus proche à pied, en contournant les autres (27/10)', () => {
    const etat = partie()
    // Le marché à droite de la mine, le joueur à gauche : la mine est entre les deux.
    etat.village.batiments.push({ id: 'marche', x: 40, y: 28, miroir: false })
    const marche = batimentPose(etat.village, 'marche')!
    const depart = { x: 20, y: 30 }
    const c = caseAccesProche(etat.village, marche, { x: 20.5, y: 30.5 })
    expect(distanceAuBatiment(marche, c.x + 0.5, c.y + 0.5)).toBeLessThan(RAYON_BATIMENT)
    // Aucune autre case du tour du marché n'est plus près à pied.
    const longueur = (x: number, y: number) => longueurChemin(trouverChemin(etat.village, depart, { x, y }) ?? [])
    const choisie = longueur(c.x, c.y)
    for (let x = 39; x <= 45; x++) {
      for (let y = 27; y <= 33; y++) {
        if (x >= 40 && x < 45 && y >= 28 && y < 33) continue
        expect(choisie).toBeLessThanOrEqual(longueur(x, y) + 1e-9)
      }
    }
    // Ce n'est pas la case en face du joueur (derrière la mine, il faudrait la contourner davantage).
    expect(c).not.toEqual({ x: 39, y: 30 })
  })

  it('pas de bulle rose sur la mine quand le coffre se remplit (la jauge le montre, 27/10)', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 40 }
    expect(notificationsBatiments(etat).puits).toBeUndefined()
  })

  it('compte la distance à pied entre deux bâtiments (de porte à porte)', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 28, 37)
    const pres = distanceEntre(etat.village, 'puits', 'marche')
    deplacerBatiment(etat, 'marche', 54, 54, false)
    expect(distanceEntre(etat.village, 'puits', 'marche')).toBeGreaterThan(pres)
  })

})

describe('les rails de la mine au marché', () => {
  it('coûtent 3 fer la case (du sac ou du coffre), et forment une ligne continue', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 28, 40)
    etat.inventaire = { fer: 9 }
    etat.coffre.contenu = { fer: 6 }
    ligneDeRails(etat, 30, 35, 38) // 4 cases : il manque la dernière
    expect(railsMineMarche(etat.village)).toBeNull()
    ligneDeRails(etat, 30, 39, 39)
    expect(etat.inventaire).toEqual({})
    expect(etat.coffre.contenu).toEqual({})
    expect(railsMineMarche(etat.village)).toHaveLength(5)
    // Une case enlevée : la ligne est coupée.
    retirerSol(etat, 'rail', 30, 37)
    expect(railsMineMarche(etat.village)).toBeNull()
  })

  it('sans fer, on ne pose pas de rail', () => {
    const etat = partie()
    expect(poserSol(etat, 'rail', 30, 35)).toEqual([])
    expect(etat.village.rails).toEqual([])
  })
})

describe('les mineurs employés au village', () => {
  function avecPersonnel(): EtatJeu {
    const etat = partie()
    construireBatiment(etat, 'marche', 28, 40)
    etat.village.batiments.push({ id: 'employes', x: 40, y: 40, miroir: false }, { id: 'forgeron', x: 40, y: 28, miroir: false })
    etat.argent = 5000
    embaucher(etat, aleatoireAvecGraine(4))
    return etat
  }

  it('creuse, remonte et vide son sac dans le coffre de la mine', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    const etapes = new Set<string>()
    for (let i = 0; i < 600 && nbDansCoffre(etat) === 0; i++) {
      avancerEmployes(etat, 0.5, aleatoireAvecGraine(i))
      etapes.add(mineur.etape)
    }
    expect(nbDansCoffre(etat)).toBeGreaterThan(0)
    expect([...etapes]).toEqual(expect.arrayContaining(['descend', 'creuse', 'monte', 'vide']))
    expect(etat.stats.blocsMineurs).toBeGreaterThan(0)
  })

  it('après une amélioration, il va chercher sa pioche à la forge', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    etat.argent = 10_000
    etat.inventaire = { pierre: 100 }
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
    const etat = partie()
    expect(notificationsBatiments(etat).foreuse).toBeUndefined()
    etat.village.batiments.push({ id: 'foreuse', x: 2, y: 2, miroir: false })
    expect(notificationsBatiments(etat).foreuse?.[0]).toMatchObject({ icone: '🔥', sorte: 'alerte' })
    etat.foreuse.chariot = { pierre: 1000 }
    expect(notificationsBatiments(etat).foreuse?.[0]).toMatchObject({ icone: '🛒', sorte: 'alerte' })
  })

  it('le coffre de la mine plein, et le générateur sans redstone', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 100 }
    expect(notificationsBatiments(etat).puits?.[0]).toMatchObject({ icone: '📦', sorte: 'alerte' })
    etat.village.batiments.push({ id: 'generateur', x: 2, y: 2, miroir: false })
    expect(notificationsBatiments(etat).generateur?.[0]).toMatchObject({ icone: '🔴', sorte: 'alerte' })
  })
})
