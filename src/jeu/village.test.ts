import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
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
import { TAILLE_GRILLE } from './donnees'
import { nbDansCoffre, type EtatJeu } from './mineur'
import { notificationsBatiments } from './notifications'
import {
  POSITION_MINE,
  RAYON_BATIMENT,
  batimentPose,
  batimentProcheDe,
  caseAccesProche,
  distanceAuBatiment,
  distanceEntre,
  longueurChemin,
  porte,
  railsMineMarche,
  trouverChemin,
} from './village'

function partie(): EtatJeu {
  return partieDeTest(aleatoireAvecGraine(1))
}

// Une ligne droite de rails de (x, y1) à (x, y2).
function ligneDeRails(etat: EtatJeu, x: number, y1: number, y2: number): void {
  for (let y = y1; y <= y2; y++) poserSol(etat, 'rail', x, y)
}

describe('le village vu du ciel', () => {
  it('commence avec la mine (10 × 10) au milieu de la clairière (40 × 40, 25/10), et rien d’autre', () => {
    const etat = partie()
    expect(etat.village.batiments).toEqual([{ id: 'puits', x: POSITION_MINE.x, y: POSITION_MINE.y, miroir: false }])
    expect(TAILLE_GRILLE).toBe(40)
    expect(POSITION_MINE).toEqual({ x: 15, y: 15 })
  })

  it('le marché est gratuit ; les autres coûtent de l’argent et des minerais (du coffre de la mine)', () => {
    const etat = partie()
    expect(batimentsConstructibles(etat)).toEqual(['marche'])
    expect(construireBatiment(etat, 'marche', 18, 26)).toEqual(['🏗️ Marché construit !'])
    expect(peutConstruire(etat, 'marche')).toBe(false) // un seul marché
    expect(peutConstruire(etat, 'forgeron')).toBe(false)
    etat.argent = 30
    etat.coffre.contenu = { pierre: 18 }
    construireBatiment(etat, 'forgeron', 26, 18)
    expect(batimentPose(etat.village, 'forgeron')).not.toBeNull()
    expect(etat.argent).toBe(0)
    expect(etat.coffre.contenu).toEqual({ pierre: 3 })
  })

  it('on ne pose rien sur un autre bâtiment ni hors de la clairière', () => {
    const etat = partie()
    expect(construireBatiment(etat, 'marche', 20, 20)).toEqual([]) // sur la mine
    expect(construireBatiment(etat, 'marche', 37, 0)).toEqual([]) // dépasse le bord
    expect(construireBatiment(etat, 'marche', 0, 0)).not.toEqual([])
  })

  it('la foreuse et le générateur se débloquent au niveau 2 de la mine, avec une pastille « Nouveau »', () => {
    const etat = partie()
    expect(nouveautesBatiments(etat)).toEqual(['employes', 'marche', 'forgeron'])
    marquerBatimentsVus(etat)
    expect(nouveautesBatiments(etat)).toEqual([])
    etat.argent = 100_000
    etat.coffre.contenu = { pierre: 200, fer: 200, redstone: 50 }
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

  it('on ouvre un bâtiment en s’approchant de n’importe quel côté', () => {
    const etat = partie()
    const mine = batimentPose(etat.village, 'puits')!
    // Juste au-dessus, à gauche, en dessous ou à droite de la mine (10 × 10, cases 15 à 24).
    for (const [x, y] of [[20, 14.5], [14.5, 20], [20, 25.5], [25.5, 20]]) expect(distanceAuBatiment(mine, x, y)).toBeLessThan(RAYON_BATIMENT)
    expect(distanceAuBatiment(mine, 20, 20)).toBe(0)
    expect(distanceAuBatiment(mine, 20, 12)).toBeGreaterThan(RAYON_BATIMENT)
  })

  it('toucher un bâtiment mène toujours devant lui, jamais derrière (23/10)', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'marche', x: 30, y: 18, miroir: false })
    const marche = batimentPose(etat.village, 'marche')!
    // Le joueur est derrière le marché (en haut de l'écran) : il en fait le tour pour s'arrêter
    // devant (côté x = 35 ou y = 23), où on le voit.
    const c = caseAccesProche(etat.village, marche, { x: 32.5, y: 14.5 })
    expect(c.x === 35 || c.y === 23).toBe(true)
    expect(distanceAuBatiment(marche, c.x + 0.5, c.y + 0.5)).toBeLessThan(RAYON_BATIMENT)
  })

  it('sauf la mine : on s’arrête du côté le plus proche, même derrière (23/10)', () => {
    const etat = partie()
    const mine = batimentPose(etat.village, 'puits')!
    // Le joueur est en haut de la mine : il n'a pas à en faire le tour.
    expect(caseAccesProche(etat.village, mine, { x: 20.5, y: 10.5 })).toEqual({ x: 20, y: 14 })
  })

  it('va à la place de devant la plus proche à pied, en contournant les autres (27/10, 23/10)', () => {
    const etat = partie()
    // Le marché à droite de la mine, le joueur à gauche : la mine est entre les deux.
    etat.village.batiments.push({ id: 'marche', x: 30, y: 18, miroir: false })
    const marche = batimentPose(etat.village, 'marche')!
    const depart = { x: 10, y: 20 }
    const c = caseAccesProche(etat.village, marche, { x: 10.5, y: 20.5 })
    expect(distanceAuBatiment(marche, c.x + 0.5, c.y + 0.5)).toBeLessThan(RAYON_BATIMENT)
    // C'est une case de devant (x = 35 ou y = 23), et aucune autre case de devant n'est plus près à pied.
    expect(c.x === 35 || c.y === 23).toBe(true)
    const longueur = (x: number, y: number) => longueurChemin(trouverChemin(etat.village, depart, { x, y }) ?? [])
    const choisie = longueur(c.x, c.y)
    for (let x = 30; x <= 35; x++) expect(choisie).toBeLessThanOrEqual(longueur(x, 23) + 1e-9)
    for (let y = 18; y <= 23; y++) expect(choisie).toBeLessThanOrEqual(longueur(35, y) + 1e-9)
  })

  it('pas de bulle rose sur la mine quand le coffre se remplit (la jauge le montre, 27/10)', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 40 }
    expect(notificationsBatiments(etat).puits).toBeUndefined()
  })

  it('compte la distance à pied entre deux bâtiments (de porte à porte)', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 18, 27)
    const pres = distanceEntre(etat.village, 'puits', 'marche')
    deplacerBatiment(etat, 'marche', 34, 34, false)
    expect(distanceEntre(etat.village, 'puits', 'marche')).toBeGreaterThan(pres)
  })

})

describe('les rails de la mine au marché', () => {
  it('coûtent 3 fer la case (du coffre de la mine), et forment une ligne continue', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 18, 30)
    etat.coffre.contenu = { fer: 15 }
    ligneDeRails(etat, 20, 25, 28) // 4 cases : il manque la dernière
    expect(railsMineMarche(etat.village)).toBeNull()
    ligneDeRails(etat, 20, 29, 29)
    expect(etat.coffre.contenu).toEqual({})
    expect(railsMineMarche(etat.village)).toHaveLength(5)
    // Une case enlevée : la ligne est coupée.
    retirerSol(etat, 'rail', 20, 27)
    expect(railsMineMarche(etat.village)).toBeNull()
  })

  it('sans fer, on ne pose pas de rail', () => {
    const etat = partie()
    expect(poserSol(etat, 'rail', 20, 25)).toEqual([])
    expect(etat.village.rails).toEqual([])
  })
})

describe('les mineurs employés au village', () => {
  function avecPersonnel(): EtatJeu {
    const etat = partie()
    construireBatiment(etat, 'marche', 18, 30)
    etat.village.batiments.push({ id: 'employes', x: 30, y: 30, miroir: false }, { id: 'forgeron', x: 30, y: 18, miroir: false })
    etat.argent = 5000
    embaucher(etat, aleatoireAvecGraine(4))
    return etat
  }

  it('descend, creuse, et la caisse de l’ascenseur remonte ses blocs dans le coffre', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    const etapes = new Set<string>()
    for (let i = 0; i < 600 && nbDansCoffre(etat) === 0; i++) {
      avancerEmployes(etat, 0.5, aleatoireAvecGraine(i))
      etapes.add(mineur.etape)
    }
    expect(nbDansCoffre(etat)).toBeGreaterThan(0)
    expect([...etapes]).toEqual(expect.arrayContaining(['descend', 'creuse']))
    expect(etapes.has('monte')).toBe(false)
    expect(etat.stats.blocsMineurs).toBeGreaterThan(0)
  })

  it('après une amélioration, il va chercher sa pioche à la forge', () => {
    const etat = avecPersonnel()
    const mineur = etat.employes[0]
    etat.argent = 10_000
    etat.niveauMine = 2 // (25/10) la pioche en fer des mineurs attend le palier 2 de la mine
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

describe('un clic juste à côté d’un bâtiment (29/10)', () => {
  it('vise le bâtiment le plus proche, s’il est assez près', () => {
    const etat = partie()
    construireBatiment(etat, 'marche', 18, 28)
    // (le marché occupe les cases 18 à 22 en x, 28 à 32 en y)
    expect(batimentProcheDe(etat.village, 20.5, 27.5, 1.6)).toBe('marche')
    expect(batimentProcheDe(etat.village, 23.5, 30.5, 1.6)).toBe('marche')
    expect(batimentProcheDe(etat.village, 20.5, 36.5, 1.6)).toBeNull()
  })
})
