import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  activerForeuse,
  ameliorerChariot,
  ameliorerForage,
  chariotBloqueAuPrestige,
  forageBloqueAuPrestige,
  acheterForeuse,
  maxForeuses,
  vitesseForage,
  basculerChariot,
  cocherToutChariot,
  selectionChariot,
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

  it('se coche ou se décoche entièrement d’un coup', () => {
    const etat = partiePrestige1()
    etat.foreuse.chariot = { pierre: 40, fer: 3, diamant: 2 }
    cocherToutChariot(etat, false)
    expect(selectionChariot(etat)).toEqual({})
    cocherToutChariot(etat, true)
    expect(selectionChariot(etat)).toEqual({ pierre: 40, fer: 3, diamant: 2 })
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

  it('ne s’améliore pas au-delà de ce que permet le prestige', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.argent = 10_000_000
    etat.inventaire = { fer: 100, redstone: 100, diamant: 100, or: 100 }
    // Au prestige 1 (son déblocage) : un seul niveau de plus.
    for (let i = 0; i < 5; i++) {
      ameliorerForage(etat)
      ameliorerChariot(etat)
    }
    expect(etat.foreuse.niveauVitesse).toBe(1)
    expect(etat.foreuse.niveauChariot).toBe(1)
    expect(forageBloqueAuPrestige(etat)).toBe(2)
    expect(chariotBloqueAuPrestige(etat)).toBe(2)
    // Au prestige 4, tout est débloqué.
    etat.prestige = 4
    for (let i = 0; i < 5; i++) {
      ameliorerForage(etat)
      ameliorerChariot(etat)
    }
    expect(etat.foreuse.niveauVitesse).toBe(4)
    expect(etat.foreuse.niveauChariot).toBe(4)
    expect(forageBloqueAuPrestige(etat)).toBeNull()
  })

  it('au prestige, elle garde seulement ses améliorations (et l’ascenseur son niveau)', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.foreuse.chariot = { fer: 3 }
    etat.foreuse.niveauVitesse = 2
    etat.foreuse.niveauChariot = 1
    etat.ascenseur.niveau = 3
    etat.foreuse.carburant = 500
    etat.foreuse.profondeur = 90
    etat.foreuse.blocsFores = 880
    const suite = prestige(etat, aleatoireAvecGraine(3))
    expect(suite.foreuse.active).toBe(true)
    // Plus de charbon, chariot vide, et elle repart de la surface...
    expect(suite.foreuse.chariot).toEqual({})
    expect(suite.foreuse.carburant).toBe(0)
    expect(suite.foreuse.profondeur).toBe(1)
    expect(suite.foreuse.blocsFores).toBe(0)
    // ... mais ses améliorations restent.
    expect(suite.foreuse.niveauVitesse).toBe(2)
    expect(suite.foreuse.niveauChariot).toBe(1)
    expect(suite.ascenseur.niveau).toBe(3)
    expect(suite.ascenseur.position).toBe(0) // la cabine attend au village
  })

  it('à partir du prestige 3, on peut acheter d’autres foreuses (elles creusent ensemble)', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.argent = 1_000_000
    expect(acheterForeuse(etat)).toEqual([]) // pas avant le prestige 3
    etat.prestige = 3
    expect(maxForeuses(etat)).toBe(2)
    const vitesseUne = vitesseForage(etat)
    acheterForeuse(etat)
    expect(etat.foreuse.nombre).toBe(2)
    expect(vitesseForage(etat)).toBe(2 * vitesseUne)
    expect(acheterForeuse(etat)).toEqual([]) // 2 au prestige 3
    // Deux foreuses brûlent le charbon deux fois plus vite.
    remplirForeuse(etat, 1) // 20 s de charbon pour une foreuse
    avancerTemps(etat, 15, aleatoireAvecGraine(2))
    expect(etat.foreuse.carburant).toBe(0)
    expect(nbDansChariot(etat)).toBe(10) // 10 s × (0,5 bloc par seconde × 2 foreuses)
  })
})
