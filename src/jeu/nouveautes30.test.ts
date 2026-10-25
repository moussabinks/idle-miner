// Les nouveautés du 30/10 : bonus de combo, rails remboursés, missions qui ne changent plus
// d'un coup, résumé de l'absence.
import { describe, expect, it } from 'vitest'
import { doublerAbsence, photoPartie, resumerAbsence, vendreCoffreAuRetour } from './absence'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment, poserSol, raisonSolImpossible, retirerSol } from './batiments'
import { embaucher } from './employes'
import { activerBonusCombo, avancerMine, bonusActif, chanceDoublement, cliquerMine, nbDansCoffre, valeurDe } from './mineur'
import { missions } from './missions'
import { partieDeTest } from './partieDeTest'
import { avancerTemps } from './temps'

describe('les bonus de combo', () => {
  it('un palier donne un bonus de quelques secondes (fortune, plusieurs blocs par clic)', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = partieDeTest(hasard)
    const base = chanceDoublement(etat)
    expect(activerBonusCombo(etat, 10)).toEqual([]) // (pas de message : l'étiquette est dans le panneau)
    expect(bonusActif(etat)?.nom).toBe('Fortune')
    expect(chanceDoublement(etat)).toBeCloseTo(base + 0.25)
    avancerMine(etat, 4, hasard)
    expect(bonusActif(etat)).toBeNull()
    activerBonusCombo(etat, 50)
    const avant = nbDansCoffre(etat)
    cliquerMine(etat, hasard)
    expect(nbDansCoffre(etat) - avant).toBeGreaterThanOrEqual(2)
  })
})

describe('les rails', () => {
  it('un rail retiré est remboursé, et on dit quand il n’y a plus de fer', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.coffre.contenu = { fer: 3 }
    poserSol(etat, 'rail', 20, 27)
    expect(etat.coffre.contenu.fer ?? 0).toBe(0)
    expect(raisonSolImpossible(etat, 'rail', 20, 28)).toContain('Plus de fer')
    retirerSol(etat, 'rail', 20, 27)
    expect(etat.coffre.contenu.fer).toBe(3) // (25/10) le fer revient dans le coffre de la mine
    expect(etat.village.rails).toEqual([])
  })
})

describe('les missions', () => {
  it('une mission affichée garde sa place tant qu’elle n’est pas faite', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    construireBatiment(etat, 'marche', 18, 28)
    etat.stats.argentGagne = 100
    const avant = missions(etat).map((m) => m.id)
    // Une nouvelle mission arrive (de quoi construire le forgeron) : elle n'en chasse aucune.
    etat.argent = 5000
    etat.coffre.contenu = { pierre: 200, fer: 200 }
    const apres = missions(etat, avant).map((m) => m.id)
    for (const id of avant.filter((id) => apres.includes(id) || missions(etat).some((m) => m.id === id))) expect(apres).toContain(id)
  })
})

describe('l’absence', () => {
  it('résume ce que les mineurs ont creusé pendant l’absence', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = partieDeTest(hasard)
    etat.argent = 10_000
    construireBatiment(etat, 'employes', 9, 21)
    embaucher(etat, hasard)
    const avant = photoPartie(etat)
    avancerTemps(etat, 600, hasard)
    const resume = resumerAbsence(avant, etat, 600)
    expect(resume?.blocsMineurs).toBeGreaterThan(0)
    expect(resume?.secondes).toBe(600)
    expect(resume?.absenceMax).toBeNull() // (23/10) pas de manager
    // (25/10) Les gains : le bénéfice net (l'argent en plus en poche, salaires déduits).
    expect(resume?.gains).toBe(Math.max(0, resume!.net))
  })

  it('(25/10) au retour, le coffre est vendu, et le grand chiffre est le bénéfice net (salaires déduits)', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = partieDeTest(hasard)
    etat.argent = 10_000
    construireBatiment(etat, 'employes', 9, 21)
    embaucher(etat, hasard)
    const avant = photoPartie(etat)
    avancerTemps(etat, 1200, hasard)
    const dansLeCoffre = valeurDe(etat.coffre.contenu)
    const venteCoffre = vendreCoffreAuRetour(etat)
    expect(venteCoffre).toBe(Math.round(dansLeCoffre))
    expect(etat.coffre.contenu).toEqual({})
    const resume = resumerAbsence(avant, etat, 1200, venteCoffre)!
    expect(resume.venteCoffre).toBe(venteCoffre)
    // Le bénéfice net = exactement l'argent en plus dans la poche.
    expect(resume.net).toBe(Math.round(etat.argent - avant.argent))
    // Un salaire payé pendant l'absence est déduit du bénéfice.
    etat.argent -= 50
    etat.stats.salairesPayes += 50
    const avecSalaire = resumerAbsence(avant, etat, 1200, venteCoffre)!
    expect(avecSalaire.salaires).toBe(resume.salaires + 50)
    expect(avecSalaire.net).toBe(resume.net - 50)
    // Les lignes de la fenêtre tombent juste : ventes + coffre + autres − salaires = bénéfice net.
    expect(avecSalaire.ventesWagonnets + avecSalaire.venteCoffre + avecSalaire.autres - avecSalaire.salaires).toBe(avecSalaire.net)
  })

  it('(25/10) doubler l’absence redonne ses gains en argent', () => {
    const hasard = aleatoireAvecGraine(1)
    const etat = partieDeTest(hasard)
    const avant = photoPartie(etat)
    avancerTemps(etat, 300, hasard)
    const resume = resumerAbsence(avant, etat, 300, vendreCoffreAuRetour(etat))!
    expect(resume.gains).toBeGreaterThan(0)
    const argent = etat.argent
    expect(doublerAbsence(etat, resume)[0]).toContain('doublés')
    expect(etat.argent).toBe(argent + resume.gains)
    // (la vente du coffre au retour, puis le doublement : deux fois le bénéfice)
    expect(etat.stats.argentGagne).toBe(2 * resume.gains)
    // Rien à doubler : rien ne se passe.
    expect(doublerAbsence(etat, { ...resume, gains: 0 })).toEqual([])
  })
})
