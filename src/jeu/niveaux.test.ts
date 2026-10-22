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

  it('chaque bloc cassé à la main rapporte 1 XP', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = creerPartie(hasard)
    for (let i = 0; i < 12; i++) cliquerMine(etat, hasard)
    mettreAJourXp(etat)
    expect(etat.xp).toBe(12)
    expect(progressionNiveau(etat)).toEqual({ niveau: 1, xp: 12, pourSuivant: 60 })
  })

  it('construire rapporte de l’XP, et on gagne un niveau avec un message', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.stats.blocsCasses = 20 // 20 XP
    construireBatiment(etat, 'marche', 28, 38) // + 40 XP
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
    expect(verrou(etat, 'mine', 1)).toBe(`au niveau ${NIVEAU_JOUEUR_POUR.mine[1]}`)

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
