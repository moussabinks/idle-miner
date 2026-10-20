import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { vitesseForage } from './foreuse'
import {
  bonusVente,
  casserBloc,
  chanceDoublement,
  creerPartie,
  dureeBlocActuel,
  positionFront,
  prestige,
  secondesParMetreAscenseur,
  vitesse,
  type EtatJeu,
} from './mineur'
import { brancheOuverte, choisirTalent, peutChoisirTalent, pointsDisponibles, TALENTS } from './talents'

// Une partie au prestige donné, sans talent.
function partie(niveauPrestige: number): EtatJeu {
  return creerPartie(aleatoireAvecGraine(7), niveauPrestige)
}

describe('arbre de prestige', () => {
  it('a cinq branches de quatre talents', () => {
    expect(TALENTS).toHaveLength(20)
    for (const branche of ['mineur', 'marchand', 'ingenieur', 'patron', 'recrutement']) {
      expect(TALENTS.filter((t) => t.branche === branche).map((t) => t.rang)).toEqual([1, 2, 3, 4])
    }
  })

  it('donne 1 point par prestige', () => {
    expect(pointsDisponibles(partie(0))).toBe(0)
    const etat = partie(2)
    expect(pointsDisponibles(etat)).toBe(2)
    choisirTalent(etat, 'poigneDeFer')
    expect(pointsDisponibles(etat)).toBe(1)
  })

  it('demande le talent du dessus dans la branche', () => {
    const etat = partie(3)
    expect(peutChoisirTalent(etat, 'oeilDeLynx')).toBe(false)
    choisirTalent(etat, 'poigneDeFer')
    expect(peutChoisirTalent(etat, 'oeilDeLynx')).toBe(true)
    expect(peutChoisirTalent(etat, 'poigneDeFer')).toBe(false) // déjà pris
  })

  it('ne fait rien sans point', () => {
    const etat = partie(0)
    expect(choisirTalent(etat, 'negociant')).toEqual([])
    expect(etat.talents).toEqual([])
  })

  it('la branche Patron s’ouvre avec les mineurs (prestige 2)', () => {
    expect(brancheOuverte(partie(1), 'patron')).toBe(false)
    expect(peutChoisirTalent(partie(1), 'contremaitre')).toBe(false)
    expect(brancheOuverte(partie(2), 'patron')).toBe(true)
    expect(peutChoisirTalent(partie(2), 'contremaitre')).toBe(true)
  })

  it('la branche Recrutement s’ouvre avec le recruteur', () => {
    const etat = partie(4)
    expect(brancheOuverte(etat, 'recrutement')).toBe(false)
    expect(peutChoisirTalent(etat, 'oeilDuRecruteur')).toBe(false)
    etat.recruteur = 1
    expect(brancheOuverte(etat, 'recrutement')).toBe(true)
    expect(peutChoisirTalent(etat, 'oeilDuRecruteur')).toBe(true)
  })

  it('les talents sont gardés au prestige suivant (et ne donnent plus rien au départ)', () => {
    const etat = partie(4)
    for (const id of ['negociant', 'grossiste', 'chasseurDeTresors', 'ascenseurExpress'] as const) choisirTalent(etat, id)
    expect(etat.argent).toBe(0)
    const suite = prestige(etat, aleatoireAvecGraine(1))
    expect(suite.talents).toEqual(etat.talents)
    expect(suite.argent).toBe(0)
    expect(pointsDisponibles(suite)).toBe(1) // le nouveau point du 5e prestige
  })

  it('les bonus permanents', () => {
    const etat = partie(4)
    const vitesseAvant = vitesse(etat)
    etat.ascenseur.niveau = 1
    const ascenseurAvant = secondesParMetreAscenseur(etat)
    const forageAvant = vitesseForage(etat)
    choisirTalent(etat, 'poigneDeFer')
    choisirTalent(etat, 'negociant')
    choisirTalent(etat, 'ascenseurExpress')
    choisirTalent(etat, 'foreuseTurbo')
    expect(vitesse(etat)).toBeCloseTo(vitesseAvant * 1.15)
    expect(bonusVente(etat)).toBeCloseTo(1 + 0.15 * 4 + 0.1)
    expect(secondesParMetreAscenseur(etat)).toBeCloseTo(ascenseurAvant / 1.3)
    expect(vitesseForage(etat)).toBeCloseTo(forageAvant * 1.5)
  })

  it('Grand négociant ajoute encore 15 % aux ventes', () => {
    const etat = partie(4)
    for (const id of ['negociant', 'grossiste', 'chasseurDeTresors', 'grandNegociant'] as const) choisirTalent(etat, id)
    expect(bonusVente(etat)).toBeCloseTo(1 + 0.15 * 4 + 0.1 + 0.15)
  })

  it('Œil de lynx double des minerais même sans Fortune', () => {
    const etat = partie(2)
    expect(chanceDoublement(etat)).toBe(0)
    choisirTalent(etat, 'poigneDeFer')
    choisirTalent(etat, 'oeilDeLynx')
    expect(chanceDoublement(etat)).toBeCloseTo(0.1)
    etat.enchantements.fortune = 1
    expect(chanceDoublement(etat)).toBeCloseTo(0.3)
  })

  it('Pioche robuste use moins les pioches, Briseur de roche creuse plus vite dans la roche dure', () => {
    // Deux parties identiques, l'une avec les talents : on casse le même nombre de blocs.
    const sans = partie(4)
    const avec = partie(4)
    for (const id of ['poigneDeFer', 'oeilDeLynx', 'piocheRobuste', 'briseurDeRoche'] as const) choisirTalent(avec, id)
    for (const etat of [sans, avec]) {
      etat.position = positionFront(etat)
      etat.cible = etat.position
      for (let i = 0; i < 50; i++) casserBloc(etat, aleatoireAvecGraine(i))
    }
    expect(avec.pioches[0]).toBeLessThan(sans.pioches[0] * 0.85)
    // Dans la roche dure, le bloc se casse 1,15 × 1,25 fois plus vite.
    for (const etat of [sans, avec]) {
      etat.profondeur = 290
      etat.coucheActuelle = Array(10).fill('deepslate')
      etat.position = positionFront(etat)
      etat.cible = etat.position
      etat.pioches[0] = 0
    }
    expect(dureeBlocActuel(avec)).toBeCloseTo(dureeBlocActuel(sans) / (1.15 * 1.25))
  })
})
