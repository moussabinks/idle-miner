// Les gemmes (25/10) : les gagner (publicité, niveaux, récompenses quotidiennes) et les dépenser
// (une amélioration sans argent ni minerais, ou un bonus de la boutique).
import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment } from './batiments'
import { NIVEAUX_ASCENSEUR, NIVEAUX_CHARIOT, NIVEAUX_COFFRE, NIVEAUX_EMPLOYE, NIVEAUX_FORAGE, NIVEAUX_GENERATEUR, NIVEAUX_MINE } from './donnees'
import {
  multiplicateurEmployes,
  BOOSTS,
  GEMMES_PAR_NIVEAU,
  GEMMES_PAR_PUB,
  RECOMPENSES_QUOTIDIENNES,
  acheterBoost,
  boostActif,
  etatQuotidien,
  multiplicateurVentes,
  prixEnGemmes,
  recompenserPub,
  recupererQuotidien,
  secondesBoost,
  veille,
} from './gemmes'
import { acheterAvecGemmes, agrandirCoffre, avancerMine, capaciteCoffre, creerPartie, debitMine, peutPayer, peutPayerEnGemmes, vendreCoffre, type EtatJeu } from './mineur'
import { mettreAJourXp, xpTotalePourNiveau } from './niveaux'
import { partieDeTest } from './partieDeTest'

function partie(): EtatJeu {
  return partieDeTest(aleatoireAvecGraine(1))
}

describe('le prix en gemmes', () => {
  it('(25/10) de 3 gemmes pour une petite amélioration à 10 pour la plus grosse', () => {
    expect(prixEnGemmes({ materiaux: {} })).toBe(3)
    expect(prixEnGemmes({ argent: 50, materiaux: {} })).toBe(3)
    expect(prixEnGemmes({ argent: 1000, materiaux: {} })).toBe(5)
    expect(prixEnGemmes({ argent: 80_000, materiaux: {} })).toBe(9)
    expect(prixEnGemmes({ argent: 10_000_000, materiaux: {} })).toBe(10)
    // Les minerais comptent à leur prix au marché : 200 $ + 40 pierres = 240 $ → 4 gemmes.
    expect(prixEnGemmes({ argent: 200, materiaux: { pierre: 40 } })).toBe(4)
  })

  it('aucune amélioration du jeu ne coûte plus de 10 gemmes', () => {
    const tables = [NIVEAUX_MINE, NIVEAUX_COFFRE, NIVEAUX_ASCENSEUR, NIVEAUX_EMPLOYE, NIVEAUX_GENERATEUR, NIVEAUX_FORAGE, NIVEAUX_CHARIOT]
    for (const table of tables) {
      for (const { cout } of table) expect(prixEnGemmes(cout)).toBeLessThanOrEqual(10)
    }
    // La plus grosse (descendre au niveau 5) coûte les 10 gemmes.
    expect(prixEnGemmes(NIVEAUX_MINE[4].cout)).toBe(10)
  })
})

describe('payer une amélioration en gemmes', () => {
  it('agrandir le coffre (palier 2) avec des gemmes, sans argent ni minerais', () => {
    const etat = partie()
    etat.niveauMine = 2
    etat.gemmes = 10
    const prix = prixEnGemmes(NIVEAUX_COFFRE[1].cout)
    expect(peutPayer(etat, NIVEAUX_COFFRE[1].cout)).toBe(false) // ni argent, ni pierre
    expect(peutPayerEnGemmes(etat, NIVEAUX_COFFRE[1].cout)).toBe(true)
    expect(acheterAvecGemmes(() => agrandirCoffre(etat))[0]).toContain('Coffre agrandi')
    expect(capaciteCoffre(etat)).toBe(NIVEAUX_COFFRE[1].capacite)
    expect(etat.gemmes).toBe(10 - prix)
    expect(etat.argent).toBe(0)
    expect(etat.coffre.contenu).toEqual({})
    // Après l'achat, on repaie en argent : sans argent, plus rien.
    expect(agrandirCoffre(etat)).toEqual([])
  })

  it('les conditions restent les mêmes : pas avant le palier, ni sans assez de gemmes', () => {
    const etat = partie()
    etat.gemmes = 100
    expect(acheterAvecGemmes(() => agrandirCoffre(etat))).toEqual([]) // palier 1 : le coffre reste au niveau 1
    expect(etat.gemmes).toBe(100)
    etat.niveauMine = 2
    etat.gemmes = prixEnGemmes(NIVEAUX_COFFRE[1].cout) - 1
    expect(acheterAvecGemmes(() => agrandirCoffre(etat))).toEqual([])
    expect(etat.coffre.niveau).toBe(0)
  })

  it('l’argent et les minerais ne paient pas à la place des gemmes', () => {
    const etat = partie()
    etat.niveauMine = 2
    etat.argent = 1_000_000
    etat.coffre.contenu = { pierre: 100 }
    etat.gemmes = 0
    expect(acheterAvecGemmes(() => agrandirCoffre(etat))).toEqual([])
    expect(etat.argent).toBe(1_000_000)
    expect(etat.coffre.contenu).toEqual({ pierre: 100 })
  })
})

describe('gagner des gemmes', () => {
  it('une publicité regardée rapporte une gemme', () => {
    const etat = partie()
    expect(recompenserPub(etat)[0]).toContain('💎')
    expect(etat.gemmes).toBe(GEMMES_PAR_PUB)
    expect(etat.stats.pubsVues).toBe(1)
    recompenserPub(etat)
    expect(etat.gemmes).toBe(2 * GEMMES_PAR_PUB)
    expect(etat.stats.pubsVues).toBe(2)
  })

  it('chaque niveau du joueur gagné rapporte des gemmes', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    mettreAJourXp(etat)
    etat.xp = xpTotalePourNiveau(2) - 1
    mettreAJourXp(etat)
    expect(etat.gemmes).toBe(0)
    construireBatiment(etat, 'marche', 18, 28) // de l'XP : le niveau 2
    expect(mettreAJourXp(etat)[0]).toContain('Niveau 2')
    expect(etat.gemmes).toBe(GEMMES_PAR_NIVEAU)
  })
})

describe('la boutique des gemmes', () => {
  it('un bonus s’achète en gemmes et dure le temps prévu (le temps de jeu)', () => {
    const etat = partie()
    etat.gemmes = BOOSTS.production.gemmes - 1
    expect(acheterBoost(etat, 'production')).toEqual([]) // pas assez de gemmes
    expect(boostActif(etat, 'production')).toBe(false)
    etat.gemmes = BOOSTS.production.gemmes
    const debit = debitMine(etat)
    expect(acheterBoost(etat, 'production')[0]).toContain('Production')
    expect(etat.gemmes).toBe(0)
    expect(boostActif(etat, 'production')).toBe(true)
    expect(secondesBoost(etat, 'production')).toBe(BOOSTS.production.minutes * 60)
    expect(debitMine(etat)).toBe(2 * debit)
    // Le temps de jeu avance : le bonus s'use, puis s'arrête.
    avancerMine(etat, BOOSTS.production.minutes * 60 - 1, aleatoireAvecGraine(2))
    expect(boostActif(etat, 'production')).toBe(true)
    etat.coffre.contenu = {}
    avancerMine(etat, 1, aleatoireAvecGraine(2))
    expect(boostActif(etat, 'production')).toBe(false)
    expect(debitMine(etat)).toBe(debit)
  })

  it('racheté pendant qu’il marche, le temps s’ajoute à ce qui reste', () => {
    const etat = partie()
    etat.gemmes = 2 * BOOSTS.clics.gemmes
    acheterBoost(etat, 'clics')
    etat.stats.tempsDeJeu += 60
    acheterBoost(etat, 'clics')
    expect(secondesBoost(etat, 'clics')).toBe(2 * BOOSTS.clics.minutes * 60 - 60)
  })

  it('« ventes × 2 » : le coffre se vend le double', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 10 }
    etat.gemmes = BOOSTS.ventes.gemmes
    expect(multiplicateurVentes(etat)).toBe(1)
    acheterBoost(etat, 'ventes')
    expect(multiplicateurVentes(etat)).toBe(2)
    vendreCoffre(etat)
    expect(etat.argent).toBe(2 * 10 * 12)
    expect(etat.stats.argentGagne).toBe(2 * 10 * 12)
    // Le bonus fini, le prix normal.
    etat.stats.tempsDeJeu += BOOSTS.ventes.minutes * 60
    etat.coffre.contenu = { fer: 10 }
    vendreCoffre(etat)
    expect(etat.argent).toBe(3 * 10 * 12)
  })

  it('(25/10) le bonus « Employés × 2 » : 3 gemmes, 15 minutes', () => {
    const etat = partie()
    etat.gemmes = 3
    acheterBoost(etat, 'employes')
    expect(etat.gemmes).toBe(0)
    expect(multiplicateurEmployes(etat)).toBe(2)
    expect(secondesBoost(etat, 'employes')).toBe(15 * 60)
  })
})

describe('les récompenses quotidiennes', () => {
  it('le premier jour : la récompense du jour 1', () => {
    const etat = partie()
    expect(etatQuotidien(etat, '2026-10-25')).toEqual({ jour: 1, disponible: true })
    expect(recupererQuotidien(etat, '2026-10-25')[0]).toContain('Jour 1')
    expect(etat.gemmes).toBe(RECOMPENSES_QUOTIDIENNES[0].gemmes)
    // (25/10) plus d'argent : des gemmes et un bonus
    expect(boostActif(etat, 'employes')).toBe(true)
    expect(etat.quotidien).toEqual({ dernierJour: '2026-10-25', serie: 1 })
  })

  it('pas deux fois le même jour', () => {
    const etat = partie()
    recupererQuotidien(etat, '2026-10-25')
    const gemmes = etat.gemmes
    expect(etatQuotidien(etat, '2026-10-25')).toEqual({ jour: 1, disponible: false })
    expect(recupererQuotidien(etat, '2026-10-25')).toEqual([])
    expect(etat.gemmes).toBe(gemmes)
  })

  it('le lendemain, la série continue ; un jour manqué, elle repart à 1', () => {
    const etat = partie()
    recupererQuotidien(etat, '2026-10-25')
    expect(etatQuotidien(etat, '2026-10-26')).toEqual({ jour: 2, disponible: true })
    recupererQuotidien(etat, '2026-10-26')
    expect(etat.gemmes).toBe(RECOMPENSES_QUOTIDIENNES[0].gemmes + RECOMPENSES_QUOTIDIENNES[1].gemmes)
    // Le 27 est manqué : le 28, on recommence au jour 1.
    expect(etatQuotidien(etat, '2026-10-28')).toEqual({ jour: 1, disponible: true })
    recupererQuotidien(etat, '2026-10-28')
    expect(etat.quotidien).toEqual({ dernierJour: '2026-10-28', serie: 1 })
  })

  it('la série passe d’un mois à l’autre', () => {
    expect(veille('2026-11-01')).toBe('2026-10-31')
    expect(veille('2027-01-01')).toBe('2026-12-31')
    const etat = partie()
    recupererQuotidien(etat, '2026-10-31')
    expect(etatQuotidien(etat, '2026-11-01')).toEqual({ jour: 2, disponible: true })
  })

  it('le 7e jour est le gros lot (avec un bonus), puis on recommence au jour 1', () => {
    const etat = partie()
    for (let jour = 1; jour <= 7; jour++) {
      const date = `2026-10-0${jour}`
      expect(etatQuotidien(etat, date).jour).toBe(jour)
      recupererQuotidien(etat, date)
    }
    expect(etat.gemmes).toBe(RECOMPENSES_QUOTIDIENNES.reduce((total, r) => total + r.gemmes, 0))
    expect(etat.quotidien.serie).toBe(7)
    // Le 7e jour donne aussi les bonus « production » et « ventes ».
    expect(RECOMPENSES_QUOTIDIENNES[6].bonus.map((b) => b.id)).toEqual(['production', 'ventes'])
    expect(boostActif(etat, 'production')).toBe(true)
    expect(boostActif(etat, 'ventes')).toBe(true)
    expect(etatQuotidien(etat, '2026-10-08')).toEqual({ jour: 1, disponible: true })
  })

  it('(25/10) aucun jour ne donne d’argent, chaque jour donne des gemmes et un bonus', () => {
    for (const r of RECOMPENSES_QUOTIDIENNES) {
      expect(r.gemmes).toBeGreaterThan(0)
      expect(r.bonus.length).toBeGreaterThan(0)
    }
    const etat = partie()
    const argent = etat.argent
    recupererQuotidien(etat, '2026-10-25')
    expect(etat.argent).toBe(argent)
  })
})
