import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment, peutConstruire, peutPoserSol, poserSol, retirerSol } from './batiments'
import { NIVEAU_JOUEUR_MAX, NIVEAU_JOUEUR_POUR, PALIER_CHEF, xpPourPasser } from './donnees'
import { GEMMES_PAR_NIVEAU } from './gemmes'
import { cliquerMine, creerPartie, descendreNiveauMine } from './mineur'
import { debloque, deblocagesDuNiveau, mettreAJourXp, niveauDeXp, niveauJoueur, palierRequis, progressionNiveau, verrou, xpTotalePourNiveau } from './niveaux'

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
    construireBatiment(etat, 'marche', 18, 28) // + 70 XP (23/10)
    const messages = mettreAJourXp(etat)
    expect(niveauJoueur(etat)).toBe(2)
    expect(messages[0]).toContain('Niveau 2')
    expect(messages[0]).toContain('rails') // (25/10) le niveau 2 débloque les rails
  })

  it('un rail retiré puis reposé ne rapporte qu’une fois', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    auNiveau(etat, NIVEAU_JOUEUR_POUR.rails)
    mettreAJourXp(etat)
    const depart = etat.xp
    etat.coffre.contenu = { fer: 30 }
    poserSol(etat, 'rail', 20, 26)
    mettreAJourXp(etat)
    expect(etat.xp).toBe(depart + 3)
    retirerSol(etat, 'rail', 20, 26)
    mettreAJourXp(etat)
    poserSol(etat, 'rail', 20, 26)
    mettreAJourXp(etat)
    expect(etat.xp).toBe(depart + 3)
  })

  it('les rails et les niveaux de la mine se débloquent avec le niveau (25/10 : les bâtiments dès le niveau 1)', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.argent = 1_000_000
    etat.coffre.contenu = { pierre: 500, fer: 500, redstone: 500 }
    expect(peutConstruire(etat, 'employes')).toBe(true)
    expect(peutConstruire(etat, 'forgeron')).toBe(true)
    expect(peutConstruire(etat, 'foreuse')).toBe(false) // la foreuse attend le niveau 2 de la mine
    expect(peutPoserSol(etat, 'rail', 20, 26)).toBe(false)
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(2))).toEqual([])
    expect(verrou(etat, 'mine', 1)).toBe(`⭐ ${NIVEAU_JOUEUR_POUR.mine[1]}`)

    auNiveau(etat, NIVEAU_JOUEUR_POUR.rails)
    expect(peutPoserSol(etat, 'rail', 20, 26)).toBe(true)
    auNiveau(etat, NIVEAU_JOUEUR_POUR.mine[1])
    expect(verrou(etat, 'mine', 1)).toBeNull()
    // Une fois débloqué, il faut quand même payer.
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(2))[0]).toContain('niveau 2')
  })

  it('(25/10) le niveau du joueur débloque les rails et les paliers de la mine', () => {
    const niveaux = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((n) => deblocagesDuNiveau(n).length > 0)
    expect(niveaux).toEqual([NIVEAU_JOUEUR_POUR.rails, ...NIVEAU_JOUEUR_POUR.mine.slice(1)])
    expect(deblocagesDuNiveau(NIVEAU_JOUEUR_POUR.mine[4])[0]).toContain('Mine niveau 5')
  })

  it('(25/10) le reste suit le palier de la mine : le niveau N de tout au palier N', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    auNiveau(etat, NIVEAU_JOUEUR_MAX)
    expect(debloque(etat, 'coffre', 1)).toBe(false)
    expect(verrou(etat, 'coffre', 1)).toBe('🕳️ Mine 2')
    expect(palierRequis('ascenseur', 2)).toBe(3)
    expect(palierRequis('mine', 2)).toBeNull()
    etat.niveauMine = 2
    expect(debloque(etat, 'coffre', 1)).toBe(true)
    expect(debloque(etat, 'equipement', 2)).toBe(false)
    expect(verrou(etat, 'equipement', 2)).toBe('🕳️ Mine 3')
    // Les chefs : à leur palier (le manager s'embauche au palier 3, le recruteur au 4).
    expect(palierRequis('tempsManager', 0)).toBe(PALIER_CHEF.manager[0])
    expect(palierRequis('recruteur', 1)).toBe(PALIER_CHEF.recruteur[1])
    etat.niveauMine = 4
    expect(debloque(etat, 'recruteur', 0)).toBe(true)
    expect(debloque(etat, 'recruteur', 1)).toBe(false)
  })

  it('(25/10) chaque niveau gagné rapporte des gemmes', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    mettreAJourXp(etat)
    expect(etat.gemmes).toBe(0)
    // Juste avant le niveau 4 : le marché construit (+ 70 XP) le fait passer.
    etat.xp = xpTotalePourNiveau(4) - 1
    mettreAJourXp(etat)
    expect(etat.gemmes).toBe(0)
    construireBatiment(etat, 'marche', 18, 28)
    const messages = mettreAJourXp(etat)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain(`Niveau 4 ! +${GEMMES_PAR_NIVEAU} 💎`)
    expect(etat.gemmes).toBe(GEMMES_PAR_NIVEAU)
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
    const records = { ...etat.recordsXp }
    delete records.investi
    etat.recordsXp = records
    const avant = etat.xp
    mettreAJourXp(etat)
    expect(etat.xp - avant).toBeGreaterThan(200)
  })
})
