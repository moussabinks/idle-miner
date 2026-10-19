import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  activerForeuse,
  ameliorerChariot,
  ameliorerForage,
  basculerChariot,
  basculerRechargeAuto,
  capaciteChariot,
  foreuseEnMarche,
  nbDansChariot,
  remplirForeuse,
  vendreChariot,
  viderChariotDansSac,
} from './foreuse'
import { creerPartie, prestige, type EtatJeu } from './mineur'
import { avancerTemps } from './temps'

// Un joueur au village, au prestige 1 (la foreuse est débloquée).
function partiePrestige1(): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1), 1)
  etat.argent = 5000 // l'activation : 5 000 $ + 10 fer + 5 redstone
  etat.inventaire = { fer: 10, redstone: 5, charbon: 5 }
  return etat
}

describe('foreuse', () => {
  it('est bloquée au prestige 0', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.argent = 5000
    etat.inventaire = { fer: 10, redstone: 5 }
    expect(activerForeuse(etat)).toEqual([])
    expect(etat.foreuse.active).toBe(false)
  })

  it('s’active une fois, surtout avec de l’argent (et un peu de fer et de redstone)', () => {
    const etat = partiePrestige1()
    etat.argent = 4999
    expect(activerForeuse(etat)).toEqual([])
    etat.argent = 5000
    activerForeuse(etat)
    expect(etat.foreuse.active).toBe(true)
    expect(etat.argent).toBe(0)
    expect(etat.inventaire).toEqual({ charbon: 5 })
  })

  it('creuse tant qu’elle a du charbon, et s’arrête sans', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    remplirForeuse(etat, 1) // 1 charbon = 20 s à 0,5 bloc par seconde = 10 blocs
    expect(etat.inventaire.charbon).toBe(4)
    avancerTemps(etat, 60, aleatoireAvecGraine(2))
    expect(nbDansChariot(etat)).toBe(10)
    expect(etat.foreuse.carburant).toBe(0)
    expect(foreuseEnMarche(etat)).toBe(false)
  })

  it('descend d’un mètre tous les 10 blocs (une couche)', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    remplirForeuse(etat, 3) // 30 blocs
    avancerTemps(etat, 100, aleatoireAvecGraine(2))
    expect(etat.foreuse.profondeur).toBe(4)
  })

  it('s’arrête quand le chariot est plein', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.foreuse.carburant = 10_000
    avancerTemps(etat, 10_000, aleatoireAvecGraine(2))
    expect(nbDansChariot(etat)).toBe(capaciteChariot(etat))
    expect(etat.foreuse.carburant).toBeGreaterThan(0) // le charbon restant n'est pas brûlé
  })

  it('se vide au marché ou dans le sac, seulement les objets cochés', () => {
    const etat = partiePrestige1()
    etat.argent = 0
    etat.inventaire = {}
    etat.foreuse.chariot = { pierre: 40, diamant: 2 }
    basculerChariot(etat, 'diamant') // décoché : ni vendu, ni mis dans le sac
    vendreChariot(etat)
    expect(etat.argent).toBe(Math.round(40 * 1.15)) // bonus du prestige 1 (+15 %)
    expect(etat.foreuse.chariot).toEqual({ diamant: 2 })
    viderChariotDansSac(etat)
    expect(etat.inventaire).toEqual({})
    basculerChariot(etat, 'diamant') // recoché
    viderChariotDansSac(etat)
    expect(etat.inventaire).toEqual({ diamant: 2 })
    expect(etat.foreuse.chariot).toEqual({})
  })

  it('se recharge toute seule avec son charbon (à partir du niveau 3 de forage)', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    expect(basculerRechargeAuto(etat)).toEqual([]) // pas encore disponible
    expect(etat.foreuse.rechargeAuto).toBe(false)
    etat.foreuse.niveauVitesse = 2
    etat.foreuse.profondeur = 40
    basculerRechargeAuto(etat)
    expect(etat.foreuse.rechargeAuto).toBe(true)
    remplirForeuse(etat, 1)
    // Une heure plus tard, elle tourne encore grâce au charbon qu'elle a remonté.
    avancerTemps(etat, 3600, aleatoireAvecGraine(4))
    expect(etat.foreuse.blocsFores).toBeGreaterThan(20 * 2 * 3)
  })

  it('s’améliore (vitesse et chariot)', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.argent = 10000
    etat.inventaire = { fer: 10 }
    ameliorerForage(etat) // 6 000 $ + 10 fer
    ameliorerChariot(etat) // 3 000 $
    expect(etat.foreuse.niveauVitesse).toBe(1)
    expect(capaciteChariot(etat)).toBe(500)
    expect(etat.argent).toBe(1000)
    expect(etat.inventaire).toEqual({})
  })

  it('est gardée au prestige suivant', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.foreuse.chariot = { fer: 3 }
    const suite = prestige(etat, aleatoireAvecGraine(3))
    expect(suite.foreuse.active).toBe(true)
    expect(suite.foreuse.chariot).toEqual({ fer: 3 })
  })
})
