import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { vitesseForage } from './foreuse'
import { bonusVente, creerPartie, prestige, secondesParMetreAscenseur, vitesse, type EtatJeu } from './mineur'
import { choisirTalent, PECULE_DEPART, peutChoisirTalent, pointsDisponibles, TALENTS } from './talents'

// Une partie au prestige donné, sans talent.
function partie(niveauPrestige: number): EtatJeu {
  return creerPartie(aleatoireAvecGraine(7), niveauPrestige)
}

describe('arbre de prestige', () => {
  it('a quatre branches de quatre talents', () => {
    expect(TALENTS).toHaveLength(16)
    for (const branche of ['mineur', 'marchand', 'ingenieur', 'patron']) {
      expect(TALENTS.filter((t) => t.branche === branche).map((t) => t.rang)).toEqual([1, 2, 3, 4])
    }
  })

  it('donne 1 point par prestige', () => {
    expect(pointsDisponibles(partie(0))).toBe(0)
    const etat = partie(2)
    expect(pointsDisponibles(etat)).toBe(2)
    choisirTalent(etat, 'poigne')
    expect(pointsDisponibles(etat)).toBe(1)
  })

  it('demande le talent du dessus dans la branche', () => {
    const etat = partie(3)
    expect(peutChoisirTalent(etat, 'piochePierre')).toBe(false)
    choisirTalent(etat, 'poigne')
    expect(peutChoisirTalent(etat, 'piochePierre')).toBe(true)
    expect(peutChoisirTalent(etat, 'poigne')).toBe(false) // déjà pris
  })

  it('ne fait rien sans point', () => {
    const etat = partie(0)
    expect(choisirTalent(etat, 'negoce')).toEqual([])
    expect(etat.talents).toEqual([])
  })

  it('les talents sont gardés et rejoués au prestige suivant', () => {
    const etat = partie(4)
    for (const id of ['negoce', 'pecule', 'grandSac', 'ascenseurRapide'] as const) choisirTalent(etat, id)
    expect(etat.argent).toBe(PECULE_DEPART)
    const suite = prestige(etat, aleatoireAvecGraine(1))
    expect(suite.talents).toEqual(etat.talents)
    expect(suite.argent).toBe(PECULE_DEPART)
    expect(suite.niveauSac).toBe(2)
    expect(pointsDisponibles(suite)).toBe(1) // le nouveau point du 5e prestige
  })

  it('le pécule ne se gagne qu’une fois par partie', () => {
    const etat = partie(3)
    choisirTalent(etat, 'negoce')
    choisirTalent(etat, 'pecule')
    choisirTalent(etat, 'grandSac') // rejoue les bonus de départ
    expect(etat.argent).toBe(PECULE_DEPART)
  })

  it('les pioches de départ', () => {
    const etat = partie(4)
    choisirTalent(etat, 'poigne')
    choisirTalent(etat, 'piochePierre')
    expect(etat.niveauPioche).toBe(1)
    choisirTalent(etat, 'fortune')
    expect(etat.enchantements.fortune).toBe(1)
    choisirTalent(etat, 'piocheFer')
    expect(etat.niveauPioche).toBe(2)
    expect(etat.meilleure).toBe(2)
  })

  it('les bonus permanents', () => {
    const etat = partie(4)
    const vitesseAvant = vitesse(etat)
    etat.ascenseur.niveau = 1
    const ascenseurAvant = secondesParMetreAscenseur(etat)
    const forageAvant = vitesseForage(etat)
    choisirTalent(etat, 'poigne')
    choisirTalent(etat, 'negoce')
    choisirTalent(etat, 'ascenseurRapide')
    choisirTalent(etat, 'foreuseTurbo')
    expect(vitesse(etat)).toBeCloseTo(vitesseAvant * 1.15)
    expect(bonusVente(etat)).toBeCloseTo(1 + 0.15 * 4 + 0.1)
    expect(secondesParMetreAscenseur(etat)).toBeCloseTo(ascenseurAvant / 1.3)
    expect(vitesseForage(etat)).toBeCloseTo(forageAvant * 1.5)
  })
})
