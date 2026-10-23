// Les nouveautés du 30/10 : bonus de combo, rails remboursés, missions qui ne changent plus
// d'un coup, résumé de l'absence.
import { describe, expect, it } from 'vitest'
import { photoPartie, resumerAbsence } from './absence'
import { aleatoireAvecGraine } from './aleatoire'
import { construireBatiment, poserSol, raisonSolImpossible, retirerSol } from './batiments'
import { embaucher } from './employes'
import { activerBonusCombo, avancerMine, bonusActif, chanceDoublement, cliquerMine, nbDansCoffre } from './mineur'
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
    etat.inventaire = { fer: 3 }
    poserSol(etat, 'rail', 30, 37)
    expect(etat.inventaire.fer ?? 0).toBe(0)
    expect(raisonSolImpossible(etat, 'rail', 30, 38)).toContain('Plus de fer')
    retirerSol(etat, 'rail', 30, 37)
    expect(etat.inventaire.fer).toBe(3)
    expect(etat.village.rails).toEqual([])
  })
})

describe('les missions', () => {
  it('une mission affichée garde sa place tant qu’elle n’est pas faite', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    construireBatiment(etat, 'marche', 28, 38)
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
    construireBatiment(etat, 'employes', 19, 31)
    embaucher(etat, hasard)
    const avant = photoPartie(etat)
    avancerTemps(etat, 600, hasard)
    const resume = resumerAbsence(avant, etat, 600)
    expect(resume?.blocsMineurs).toBeGreaterThan(0)
    expect(resume?.secondes).toBe(600)
  })
})
