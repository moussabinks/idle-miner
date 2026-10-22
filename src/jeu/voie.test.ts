import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { placePourUnRail, placeLibrePour, poserSol, retirerSol } from './batiments'
import { notificationsBatiments } from './notifications'
import { creerTrajet } from './wagonnet'
import { type EtatJeu } from './mineur'
import { bordsDeVoie, formeDuRail, viragesDoux } from './village'

function partie(): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.inventaire = { fer: 300 }
  etat.argent = 100000
  return etat
}

describe('la voie large de deux cases', () => {
  it('une ligne droite a ses deux côtés pour bords', () => {
    const etat = partie()
    for (let y = 5; y <= 7; y++) poserSol(etat, 'rail', 5, y)
    expect(formeDuRail(etat.village, 5, 6)).toEqual(['n', 's'])
    const bords = bordsDeVoie(etat.village)
    expect([...bords].sort()).toEqual(['4,5', '4,6', '4,7', '6,5', '6,6', '6,7'])
    // Pas devant ni derrière la ligne : un bâtiment peut s'y raccorder.
    expect(bords.has('5,4')).toBe(false)
    expect(bords.has('5,8')).toBe(false)
  })

  it('on ne pose ni bâtiment ni chemin sur les bords', () => {
    const etat = partie()
    for (let y = 5; y <= 12; y++) poserSol(etat, 'rail', 10, y)
    // Le forgeron (5 × 5) collé à la ligne, à droite : il toucherait la colonne 11.
    expect(placeLibrePour(etat, 'forgeron', 11, 6)).toBe(false)
    expect(placeLibrePour(etat, 'forgeron', 12, 6)).toBe(true)
    poserSol(etat, 'chemin', 9, 8)
    expect(etat.village.chemins).toHaveLength(0)
  })

  it('ni un rail dont la voie passerait sur un bâtiment', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'bazar', x: 21, y: 6, miroir: false })
    poserSol(etat, 'rail', 20, 5)
    // Un rail en (20, 6) ferait une ligne nord – sud : son bord est (21, 6), où est le bazar.
    expect(placePourUnRail(etat.village, 20, 6)).toBe('bords')
    expect(poserSol(etat, 'rail', 20, 6)[0]).toContain('Pas la place')
    // De l'autre côté, c'est libre.
    expect(placePourUnRail(etat.village, 19, 5)).toBe('ok')
  })
})

describe('les virages doux', () => {
  it('un virage entre deux lignes droites devient un grand virage sur trois cases', () => {
    const etat = partie()
    // Une ligne vers le sud, puis vers l'est : le coin est (5, 8).
    for (let y = 5; y <= 8; y++) poserSol(etat, 'rail', 5, y)
    for (let x = 6; x <= 8; x++) poserSol(etat, 'rail', x, 8)
    expect(viragesDoux(etat.village)).toEqual([{ coin: { x: 5, y: 8 }, bras: ['n', 'e'] }])
  })

  it('pas de virage doux si un bras est un bout de ligne (il garde son butoir)', () => {
    const etat = partie()
    poserSol(etat, 'rail', 5, 7)
    poserSol(etat, 'rail', 5, 8)
    poserSol(etat, 'rail', 6, 8)
    poserSol(etat, 'rail', 7, 8)
    expect(viragesDoux(etat.village)).toEqual([])
  })

  it('pas de virage doux si un bras n’est pas une ligne droite', () => {
    const etat = partie()
    // Un zigzag : (5,5) → (5,6) → (6,6) → (6,7) : chaque coin a un bras qui tourne aussi.
    for (const [x, y] of [
      [5, 5],
      [5, 6],
      [6, 6],
      [6, 7],
    ])
      poserSol(etat, 'rail', x, y)
    expect(viragesDoux(etat.village)).toEqual([])
  })
})

describe('les bulles des rails', () => {
  it('rails coupés : une bulle sur les deux bâtiments du trajet', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false })
    for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
    creerTrajet(etat, 'mine-marche')
    expect(notificationsBatiments(etat).marche?.some((n) => n.court === 'Rails coupés')).toBeFalsy()
    retirerSol(etat, 'rail', 30, 37)
    expect(notificationsBatiments(etat).puits?.some((n) => n.court === 'Rails coupés')).toBe(true)
    expect(notificationsBatiments(etat).marche?.some((n) => n.court === 'Rails coupés')).toBe(true)
  })
})
