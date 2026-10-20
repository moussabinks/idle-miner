import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  activerForeuse,
  ameliorerChariot,
  ameliorerForage,
  chariotBloqueAuPrestige,
  forageBloqueAuPrestige,
  rechargeAutoDisponible,
  valeurChariot,
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
import { NIVEAUX_CHARIOT, NIVEAUX_FORAGE } from './donnees'
import { creerPartie, prestige, type EtatJeu } from './mineur'
import { choisirTalent } from './talents'
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
    remplirForeuse(etat, 1) // 1 charbon = 20 s à 2 blocs par seconde = 40 blocs
    expect(etat.inventaire.charbon).toBe(4)
    avancerTemps(etat, 60, aleatoireAvecGraine(2))
    expect(nbDansChariot(etat)).toBe(40)
    expect(etat.foreuse.carburant).toBe(0)
    expect(foreuseEnMarche(etat)).toBe(false)
  })

  it('descend d’un mètre tous les 10 blocs (une couche)', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    remplirForeuse(etat, 3) // 60 s à 2 blocs par seconde = 120 blocs, soit 12 couches
    avancerTemps(etat, 100, aleatoireAvecGraine(2))
    expect(etat.foreuse.profondeur).toBe(13)
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
    etat.argent = 5000
    etat.inventaire = { fer: 30, redstone: 5 }
    ameliorerForage(etat) // 2 500 $ + 20 fer + 5 redstone
    ameliorerChariot(etat) // 1 500 $ + 10 fer
    expect(etat.foreuse.niveauVitesse).toBe(1)
    expect(capaciteChariot(etat)).toBe(500)
    expect(etat.argent).toBe(1000)
    expect(etat.inventaire).toEqual({})
  })

  it('ne s’améliore pas au-delà de ce que permet le prestige', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.argent = 10_000_000
    etat.inventaire = { fer: 5000, redstone: 5000 }
    // Au prestige 1 (son déblocage) : un seul niveau de plus.
    for (let i = 0; i < 5; i++) {
      ameliorerForage(etat)
      ameliorerChariot(etat)
    }
    expect(etat.foreuse.niveauVitesse).toBe(1)
    expect(etat.foreuse.niveauChariot).toBe(1)
    expect(forageBloqueAuPrestige(etat)).toBe(2)
    expect(chariotBloqueAuPrestige(etat)).toBe(2)
    // Un niveau de plus à chaque prestige : au prestige 4, le 5e niveau...
    etat.prestige = 4
    for (let i = 0; i < 10; i++) {
      ameliorerForage(etat)
      ameliorerChariot(etat)
    }
    expect(etat.foreuse.niveauVitesse).toBe(4)
    expect(etat.foreuse.niveauChariot).toBe(4)
    expect(forageBloqueAuPrestige(etat)).toBe(5)
    // ... et au prestige 7, les 8 niveaux.
    etat.prestige = 7
    for (let i = 0; i < 10; i++) {
      ameliorerForage(etat)
      ameliorerChariot(etat)
    }
    expect(etat.foreuse.niveauVitesse).toBe(NIVEAUX_FORAGE.length - 1)
    expect(etat.foreuse.niveauChariot).toBe(NIVEAUX_CHARIOT.length - 1)
    expect(NIVEAUX_FORAGE.map((n) => n.vitesse)).toEqual([2, 3, 5, 8, 12, 16, 22, 30])
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

  it('les talents de l’ingénieur et du marchand', () => {
    const etat = partiePrestige1()
    activerForeuse(etat)
    etat.prestige = 4
    expect(rechargeAutoDisponible(etat)).toBe(false) // niveau 1 de forage
    etat.foreuse.chariot = { fer: 10 }
    const valeurAvant = valeurChariot(etat)
    const capaciteAvant = capaciteChariot(etat)
    for (const id of ['ascenseurExpress', 'foreuseTurbo', 'grandChariot', 'moteurAutonome'] as const) choisirTalent(etat, id)
    expect(rechargeAutoDisponible(etat)).toBe(true) // Moteur autonome : dès le premier niveau
    expect(capaciteChariot(etat)).toBe(2 * capaciteAvant)
    const suite = creerPartie(aleatoireAvecGraine(1), 4)
    suite.talents = ['negociant', 'grossiste']
    suite.foreuse.chariot = { fer: 10 }
    expect(valeurChariot(suite)).toBe(Math.round(Math.round(valeurAvant * (1 + 0.6 + 0.1) / (1 + 0.6)) * 1.2))
  })
})
