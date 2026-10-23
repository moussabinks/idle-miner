import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment, peutConstruire, peutPoserSol, poserSol, retirerSol } from './batiments'
import { NIVEAU_JOUEUR_POUR, xpPourPasser } from './donnees'
import { cliquerMine, creerPartie, descendreNiveauMine } from './mineur'
import { deblocagesDuNiveau, mettreAJourXp, niveauDeXp, niveauJoueur, progressionNiveau, verrou, xpTotalePourNiveau } from './niveaux'

// Donne juste assez d'XP pour être à ce niveau.
function auNiveau(etat: ReturnType<typeof creerPartie>, niveau: number): void {
  etat.xp = xpTotalePourNiveau(niveau)
}

describe('le niveau du joueur (29/10)', () => {
  it('il faut de plus en plus d’XP pour passer un niveau', () => {
    expect(xpPourPasser(1)).toBe(60)
    for (let n = 2; n < 20; n++) expect(xpPourPasser(n)).toBeGreaterThan(xpPourPasser(n - 1))
    expect(niveauDeXp(0)).toBe(1)
    expect(niveauDeXp(59)).toBe(1)
    expect(niveauDeXp(60)).toBe(2)
    expect(niveauDeXp(xpTotalePourNiveau(10))).toBe(10)
  })

  it('(23/10) 3 blocs cassés à la main rapportent 1 XP', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = creerPartie(hasard)
    for (let i = 0; i < 12; i++) cliquerMine(etat, hasard)
    mettreAJourXp(etat)
    expect(etat.xp).toBe(4)
    expect(progressionNiveau(etat)).toEqual({ niveau: 1, xp: 4, pourSuivant: 60 })
  })

  it('construire rapporte de l’XP, et on gagne un niveau avec un message', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    construireBatiment(etat, 'marche', 28, 38) // + 70 XP (23/10)
    const messages = mettreAJourXp(etat)
    expect(niveauJoueur(etat)).toBe(2)
    expect(messages[0]).toContain('Niveau 2')
    expect(messages[0]).toContain('Personnel')
  })

  it('un rail retiré puis reposé ne rapporte qu’une fois', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    auNiveau(etat, NIVEAU_JOUEUR_POUR.rails)
    mettreAJourXp(etat)
    const depart = etat.xp
    etat.inventaire = { fer: 30 }
    poserSol(etat, 'rail', 30, 36)
    mettreAJourXp(etat)
    expect(etat.xp).toBe(depart + 3)
    retirerSol(etat, 'rail', 30, 36)
    mettreAJourXp(etat)
    poserSol(etat, 'rail', 30, 36)
    mettreAJourXp(etat)
    expect(etat.xp).toBe(depart + 3)
  })

  it('les bâtiments, les rails et les niveaux de la mine se débloquent avec le niveau', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.argent = 1_000_000
    etat.inventaire = { pierre: 500, fer: 500, redstone: 500 }
    expect(peutConstruire(etat, 'employes')).toBe(false)
    expect(peutPoserSol(etat, 'rail', 30, 36)).toBe(false)
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(2))).toEqual([])
    expect(verrou(etat, 'mine', 1)).toBe(`⭐ ${NIVEAU_JOUEUR_POUR.mine[1]}`)

    auNiveau(etat, NIVEAU_JOUEUR_POUR.batiments.employes)
    expect(peutConstruire(etat, 'employes')).toBe(true)
    auNiveau(etat, NIVEAU_JOUEUR_POUR.rails)
    expect(peutPoserSol(etat, 'rail', 30, 36)).toBe(true)
    auNiveau(etat, NIVEAU_JOUEUR_POUR.mine[1])
    expect(verrou(etat, 'mine', 1)).toBeNull()
    // Une fois débloqué, il faut quand même payer.
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(2))[0]).toContain('niveau 2')
  })

  it('chaque niveau jusqu’au 15 débloque quelque chose', () => {
    for (let n = 2; n <= 15; n++) expect(deblocagesDuNiveau(n).length, `niveau ${n}`).toBeGreaterThan(0)
  })
})

describe('l’XP selon le prix (23/10)', () => {
  it('une amélioration chère rapporte plus qu’une petite', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    mettreAJourXp(etat)
    const depart = etat.xp
    etat.coffre.niveau = 1
    mettreAJourXp(etat)
    const petit = etat.xp - depart
    etat.coffre.niveau = 4
    mettreAJourXp(etat)
    const gros = etat.xp - depart - petit
    expect(petit).toBeGreaterThan(30)
    expect(gros).toBeGreaterThan(petit * 5)
  })

  it('(23/10) rester AFK ne rapporte pas d’XP : ni l’argent gagné, ni les voyages des wagonnets', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    mettreAJourXp(etat)
    const depart = etat.xp
    etat.stats.argentGagne += 1_000_000
    etat.stats.voyagesWagonnet += 500
    mettreAJourXp(etat)
    expect(etat.xp).toBe(depart)
  })

  it('une vieille partie reçoit l’XP de ce qu’elle avait déjà acheté', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    mettreAJourXp(etat)
    etat.coffre.niveau = 3
    etat.niveauSac = 3
    const records = { ...etat.recordsXp }
    delete records.investi
    etat.recordsXp = records
    const avant = etat.xp
    mettreAJourXp(etat)
    expect(etat.xp - avant).toBeGreaterThan(200)
  })
})
