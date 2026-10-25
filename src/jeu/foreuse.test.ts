import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { BLOCS, NIVEAUX_CHARIOT, NIVEAUX_FORAGE, SECONDES_PAR_CHARBON } from './donnees'
import {
  ameliorerChariot,
  ameliorerForage,
  avancerForeuse,
  capaciteChariot,
  chariotPlein,
  foreuseEnMarche,
  nbDansChariot,
  remplirForeuse,
  vendreChariot,
  vitesseForage,
} from './foreuse'
import { type EtatJeu } from './mineur'

// Une partie au niveau 2 de la mine, avec la foreuse posée.
function partie(): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.niveauMine = 2
  etat.village.batiments.push({ id: 'foreuse', x: 30, y: 18, miroir: false })
  return etat
}

describe('la foreuse', () => {
  it('ne tourne pas sans charbon', () => {
    const etat = partie()
    expect(foreuseEnMarche(etat)).toBe(false)
    expect(remplirForeuse(etat, 10)).toEqual([])
  })

  it('prend le charbon du coffre de la mine, et fore dans son chariot', () => {
    const etat = partie()
    etat.coffre.contenu = { charbon: 5 }
    remplirForeuse(etat, Infinity)
    expect(etat.foreuse.carburant).toBe(5 * SECONDES_PAR_CHARBON)
    avancerForeuse(etat, 20, aleatoireAvecGraine(2))
    expect(nbDansChariot(etat)).toBe(Math.floor(20 * NIVEAUX_FORAGE[0].vitesse))
    expect(etat.stats.blocsForeuse).toBe(10)
  })

  it('s’arrête quand le chariot est plein', () => {
    const etat = partie()
    etat.foreuse.carburant = 100_000
    const messages = avancerForeuse(etat, 10_000, aleatoireAvecGraine(2))
    expect(chariotPlein(etat)).toBe(true)
    expect(nbDansChariot(etat)).toBe(capaciteChariot(etat))
    expect(messages[0]).toContain('plein')
  })

  it('le chariot se vend sur place, au prix du marché (25/10)', () => {
    const etat = partie()
    etat.foreuse.chariot = { fer: 2, pierre: 40 }
    // Un lot (seulement le fer), puis tout ce qui reste.
    const prixFer = 2 * BLOCS.fer.prix
    expect(vendreChariot(etat, { fer: 2 })[0]).toContain('vendu')
    expect(etat.argent).toBe(prixFer)
    expect(etat.foreuse.chariot).toEqual({ pierre: 40 })
    vendreChariot(etat)
    const total = prixFer + 40 * BLOCS.pierre.prix
    expect(etat.argent).toBe(total)
    expect(nbDansChariot(etat)).toBe(0)
    expect(etat.stats.argentGagne).toBe(total)
    expect(etat.stats.argentForeuse).toBe(total)
    // Un chariot vide : rien à vendre.
    expect(vendreChariot(etat)).toEqual([])
  })

  it('fore plus vite sous électricité', () => {
    const etat = partie()
    const sansCourant = vitesseForage(etat)
    etat.village.batiments.push({ id: 'generateur', x: 30, y: 24, miroir: false })
    etat.generateur.carburant = 100
    expect(vitesseForage(etat)).toBeCloseTo(sansCourant * 1.3) // (23/10 : + 30 % au niveau 1)
  })

  it('s’améliore, palier par palier (25/10)', () => {
    const etat = partie()
    etat.argent = 20_000
    etat.coffre.contenu = { fer: 300, redstone: 100 }
    ameliorerForage(etat)
    // Au palier 2 de la mine, le forage ne monte pas plus haut que le niveau 2.
    expect(ameliorerForage(etat)).toEqual([])
    etat.niveauMine = 3
    ameliorerForage(etat)
    ameliorerChariot(etat)
    expect(vitesseForage(etat)).toBe(NIVEAUX_FORAGE[2].vitesse)
    expect(capaciteChariot(etat)).toBe(NIVEAUX_CHARIOT[1].capacite)
    expect(etat.argent).toBe(20_000 - 3000 - 12000 - 4000)
  })
})
