import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { NIVEAUX_FORAGE, SECONDES_PAR_CHARBON } from './donnees'
import {
  prendreDuChariot,
  ameliorerChariot,
  ameliorerForage,
  avancerForeuse,
  basculerRechargeAuto,
  capaciteChariot,
  chariotPlein,
  foreuseEnMarche,
  nbDansChariot,
  remplirForeuse,
  vitesseForage,
} from './foreuse'
import { type EtatJeu } from './mineur'

// Une partie au niveau 2 de la mine, avec la foreuse posée.
function partie(): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.niveauMine = 2
  etat.village.batiments.push({ id: 'foreuse', x: 40, y: 28, miroir: false })
  return etat
}

describe('la foreuse', () => {
  it('ne tourne pas sans charbon', () => {
    const etat = partie()
    expect(foreuseEnMarche(etat)).toBe(false)
    expect(remplirForeuse(etat, 10)).toEqual([])
  })

  it('prend le charbon du sac puis du coffre, et fore dans son chariot', () => {
    const etat = partie()
    etat.inventaire = { charbon: 2 }
    etat.coffre.contenu = { charbon: 3 }
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

  it('le chariot ne se vend pas sur place : on le met dans son sac (27/10)', () => {
    const etat = partie()
    etat.foreuse.chariot = { fer: 2, pierre: 40 }
    // Un seul minerai, ou tout (les plus chers d'abord, tant qu'il y a de la place).
    prendreDuChariot(etat, { fer: 2 })
    expect(etat.inventaire).toEqual({ fer: 2 })
    prendreDuChariot(etat)
    expect(etat.inventaire).toEqual({ fer: 2, pierre: 30 })
    expect(etat.foreuse.chariot).toEqual({ pierre: 10 })
    expect(etat.argent).toBe(0)
  })

  it('fore plus vite sous électricité', () => {
    const etat = partie()
    const sansCourant = vitesseForage(etat)
    etat.village.batiments.push({ id: 'generateur', x: 40, y: 34, miroir: false })
    etat.generateur.carburant = 100
    expect(vitesseForage(etat)).toBeCloseTo(sansCourant * 1.5)
  })

  it('s’améliore, et brûle son propre charbon au 3e niveau de forage', () => {
    const etat = partie()
    etat.argent = 20_000
    etat.inventaire = { fer: 200, redstone: 100 }
    expect(basculerRechargeAuto(etat)).toEqual([])
    ameliorerForage(etat)
    ameliorerForage(etat)
    ameliorerChariot(etat)
    expect(vitesseForage(etat)).toBe(1.2)
    expect(capaciteChariot(etat)).toBe(400)
    basculerRechargeAuto(etat)
    expect(etat.foreuse.rechargeAuto).toBe(true)
  })
})
