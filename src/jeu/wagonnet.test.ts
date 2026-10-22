import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { deplacerSol, peutPoserSol, poserSol, retirerSol } from './batiments'
import { embaucher, embaucherPousseur } from './employes'
import { RESERVE_FOREUSE_WAGONNET, SECONDES_PAR_CHARBON } from './donnees'
import { creerPartie, type EtatJeu } from './mineur'
import { avancerTemps } from './temps'
import { feraitUneBoucle } from './village'
import {
  avancerWagonnets,
  capaciteWagonnet,
  creerTrajet,
  joueurPousse,
  ligneDe,
  liaisonsDepuis,
  peutCreerTrajet,
  peutPousser,
  pousserTrajet,
  secondesAllerRetour,
  supprimerTrajet,
  trajetDe,
  trajetElectrique,
  vitesseTrajet,
} from './wagonnet'

// Une partie avec le marché en (28, 40) et une ligne de 5 rails de la mine au marché.
function partie(): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1))
  etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false })
  etat.inventaire = { fer: 15 }
  for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
  return etat
}

// La même, avec le trajet Mine → Marché déjà créé.
function partieAvecTrajet(): EtatJeu {
  const etat = partie()
  creerTrajet(etat, 'mine-marche')
  return etat
}

// Fait rouler les wagonnets jusqu'à ce que ce trajet soit revenu au quai.
function allerRetour(etat: EtatJeu, liaison: Parameters<typeof trajetDe>[1]): string[] {
  const messages: string[] = []
  for (let i = 0; i < 200 && trajetDe(etat, liaison)?.etape !== 'quai'; i++) messages.push(...avancerWagonnets(etat, 0.25))
  return messages
}

describe('les trajets des wagonnets', () => {
  it('au début, aucun trajet : c’est le joueur qui en crée un sur ses rails', () => {
    const etat = partie()
    expect(etat.trajets).toEqual([])
    expect(ligneDe(etat, 'mine-marche')).toHaveLength(5)
    expect(peutCreerTrajet(etat, 'mine-marche')).toBe(true)
    // Pas de rails vers la foreuse (et pas de foreuse) : pas de trajet possible.
    expect(peutCreerTrajet(etat, 'mine-foreuse')).toBe(false)
    creerTrajet(etat, 'mine-marche')
    expect(trajetDe(etat, 'mine-marche')?.etape).toBe('quai')
    // Un seul wagonnet par trajet.
    expect(peutCreerTrajet(etat, 'mine-marche')).toBe(false)
  })

  it('les trajets proposés au départ : seulement vers les bâtiments construits', () => {
    const etat = partie()
    expect(liaisonsDepuis(etat, 'puits')).toEqual(['mine-marche'])
    etat.village.batiments.push({ id: 'foreuse', x: 40, y: 28, miroir: false })
    expect(liaisonsDepuis(etat, 'puits')).toEqual(['mine-marche', 'mine-foreuse'])
    expect(liaisonsDepuis(etat, 'foreuse')).toEqual(['foreuse-marche'])
  })

  it('ne roule que sur une ligne complète', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    expect(peutPousser(etat, 'mine-marche')).toBe(true)
    retirerSol(etat, 'rail', 30, 37)
    expect(peutPousser(etat, 'mine-marche')).toBe(false)
  })

  it('le joueur le pousse : il emporte le coffre, le vend au marché et revient', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10, pierre: 50 }
    pousserTrajet(etat, 'mine-marche')
    expect(joueurPousse(etat)).toBe(true)
    expect(capaciteWagonnet(etat)).toBe(40)
    expect(etat.coffre.contenu).toEqual({ pierre: 20 }) // les plus chers d'abord, 40 places
    const messages = allerRetour(etat, 'mine-marche')
    expect(etat.argent).toBe(150) // 10 fer à 12 $ + 30 pierres à 1 $
    expect(etat.stats.argentWagonnet).toBe(150)
    expect(etat.stats.voyagesWagonnet).toBe(1)
    expect(messages.some((m) => m.includes('+150 $'))).toBe(true)
    expect(joueurPousse(etat)).toBe(false)
  })

  it('il laisse dans le coffre les objets gardés au marché', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    etat.nonAVendre = ['fer']
    expect(peutPousser(etat, 'mine-marche')).toBe(false)
  })

  it('le pousseur de ce trajet le pousse tout seul dès que le coffre n’est pas vide', () => {
    const etat = partieAvecTrajet()
    etat.argent = 1000
    embaucher(etat, aleatoireAvecGraine(2))
    embaucherPousseur(etat, aleatoireAvecGraine(3), 'mine-marche')
    const argentDepart = etat.argent
    for (let i = 0; i < 400 && etat.stats.voyagesWagonnet === 0; i++) avancerTemps(etat, 0.5, aleatoireAvecGraine(i))
    expect(etat.stats.voyagesWagonnet).toBeGreaterThan(0)
    expect(etat.argent).toBeGreaterThan(argentDepart)
  })

  it('électrique, il roule tout seul et bien plus vite', () => {
    const etat = partieAvecTrajet()
    const trajet = trajetDe(etat, 'mine-marche')!
    const aLaMain = secondesAllerRetour(etat, 'mine-marche', 3)
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'generateur', x: 35, y: 37, miroir: false })
    etat.generateur.carburant = 1000
    etat.coffre.contenu = { fer: 5 }
    expect(trajetElectrique(etat, 'mine-marche')).toBe(true)
    avancerWagonnets(etat, 0.1)
    expect(trajet.pousseur).toBe('electricite')
    expect(secondesAllerRetour(etat, 'mine-marche', vitesseTrajet(etat, trajet))).toBeLessThan(aLaMain)
  })

  it('la ligne coupée en route : le chargement retourne dans le coffre', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    pousserTrajet(etat, 'mine-marche')
    retirerSol(etat, 'rail', 30, 37)
    avancerWagonnets(etat, 1)
    expect(trajetDe(etat, 'mine-marche')?.etape).toBe('quai')
    expect(etat.coffre.contenu).toEqual({ fer: 10 })
  })

  it('arrêter un trajet : le wagonnet disparaît, son chargement revient', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    pousserTrajet(etat, 'mine-marche')
    supprimerTrajet(etat, 'mine-marche')
    expect(etat.trajets).toEqual([])
    expect(etat.coffre.contenu).toEqual({ fer: 10 })
  })

  it('Mine → Foreuse : il apporte le charbon du coffre (sans dépasser la réserve)', () => {
    const etat = partie()
    etat.niveauMine = 2
    // La foreuse à droite de la mine, reliée par 3 rails.
    etat.village.batiments.push({ id: 'foreuse', x: 38, y: 28, miroir: false })
    etat.inventaire = { fer: 9 }
    for (let x = 35; x <= 37; x++) poserSol(etat, 'rail', x, 30)
    expect(ligneDe(etat, 'mine-foreuse')).toHaveLength(3)
    creerTrajet(etat, 'mine-foreuse')
    creerTrajet(etat, 'mine-marche')
    etat.coffre.contenu = { charbon: 200, fer: 5 }
    pousserTrajet(etat, 'mine-foreuse')
    expect(trajetDe(etat, 'mine-foreuse')?.chargement).toEqual({ charbon: 40 })
    allerRetour(etat, 'mine-foreuse')
    expect(etat.foreuse.carburant).toBe(40 * SECONDES_PAR_CHARBON)
    // Le wagonnet du marché laisse le charbon dont la foreuse a encore besoin (20 ici).
    expect((RESERVE_FOREUSE_WAGONNET - etat.foreuse.carburant) / SECONDES_PAR_CHARBON).toBe(20)
    etat.coffre.contenu = { charbon: 30 }
    pousserTrajet(etat, 'mine-marche')
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ charbon: 10 })
  })

  it('Foreuse → Marché : il vend le chariot de la foreuse', () => {
    const etat = partie()
    etat.niveauMine = 2
    // La foreuse collée au marché, avec un rail entre les deux.
    etat.village.batiments.push({ id: 'foreuse', x: 34, y: 40, miroir: false })
    etat.inventaire = { fer: 3 }
    poserSol(etat, 'rail', 33, 42)
    creerTrajet(etat, 'foreuse-marche')
    etat.foreuse.chariot = { fer: 10 }
    pousserTrajet(etat, 'foreuse-marche')
    expect(etat.foreuse.chariot).toEqual({})
    allerRetour(etat, 'foreuse-marche')
    expect(etat.argent).toBe(120)
  })

  it('plusieurs wagonnets roulent en même temps sur les mêmes rails', () => {
    const etat = partie()
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'generateur', x: 35, y: 37, miroir: false })
    // Un rail de plus, collé au générateur, branché sur la ligne du marché.
    etat.inventaire = { fer: 12 }
    poserSol(etat, 'rail', 31, 38)
    poserSol(etat, 'rail', 32, 38)
    poserSol(etat, 'rail', 33, 38)
    poserSol(etat, 'rail', 34, 38)
    expect(ligneDe(etat, 'mine-generateur')).not.toBeNull()
    creerTrajet(etat, 'mine-marche')
    creerTrajet(etat, 'mine-generateur')
    etat.generateur.carburant = 100
    etat.coffre.contenu = { redstone: 10, pierre: 10 }
    avancerWagonnets(etat, 0.1)
    expect(trajetDe(etat, 'mine-marche')?.etape).toBe('aller')
    expect(trajetDe(etat, 'mine-generateur')?.etape).toBe('aller')
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ pierre: 10 }) // la redstone va au générateur
  })
})

describe('pas de boucle dans les rails', () => {
  it('on ne peut pas fermer un carré de 2 × 2', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.inventaire = { fer: 30 }
    poserSol(etat, 'rail', 5, 5)
    poserSol(etat, 'rail', 6, 5)
    poserSol(etat, 'rail', 6, 6)
    expect(feraitUneBoucle(etat.village, 5, 6)).toBe(true)
    expect(peutPoserSol(etat, 'rail', 5, 6)).toBe(false)
    expect(poserSol(etat, 'rail', 5, 6)[0]).toContain('boucle')
    expect(etat.village.rails).toHaveLength(3)
  })

  it('ni une grande boucle, même en déplaçant un rail', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.inventaire = { fer: 60 }
    // Un U : (5,5) → (8,5) → (8,7) → (5,7), il manque (5,6).
    for (const [x, y] of [[5, 5], [6, 5], [7, 5], [8, 5], [8, 6], [8, 7], [7, 7], [6, 7], [5, 7]]) poserSol(etat, 'rail', x, y)
    poserSol(etat, 'rail', 12, 12)
    expect(peutPoserSol(etat, 'rail', 5, 6)).toBe(false)
    deplacerSol(etat, 'rail', { x: 12, y: 12 }, { x: 5, y: 6 })
    expect(etat.village.rails).toContain('12,12')
    // Un embranchement (un T) reste possible.
    expect(peutPoserSol(etat, 'rail', 9, 6)).toBe(true)
  })
})
