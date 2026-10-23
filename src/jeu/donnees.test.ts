import { describe, expect, it } from 'vitest'
import { BLOCS, LISTE_BLOCS, NIVEAUX_ASCENSEUR, NIVEAUX_EMPLOYE, NIVEAUX_GENERATEUR, NIVEAUX_MINE, NIVEAU_MINE_MAX, PIOCHES } from './donnees'

describe('les données du jeu', () => {
  it('7 blocs : plus de lapis ni de netherite', () => {
    expect(LISTE_BLOCS).toEqual(['pierre', 'charbon', 'fer', 'redstone', 'or', 'emeraude', 'diamant'])
    for (const id of LISTE_BLOCS) expect(BLOCS[id].prix).toBeGreaterThan(0)
  })

  it('les pioches doublent de plus en plus souvent, et durent de plus en plus longtemps', () => {
    expect(PIOCHES.map((p) => p.doublement)).toEqual([0.1, 0.2, 0.3, 0.38, 0.45])
    PIOCHES.forEach((p, i) => {
      expect(p.niveau).toBe(i)
      if (i > 0) expect(p.durabilite).toBeGreaterThan(PIOCHES[i - 1].durabilite)
    })
  })

  it('5 niveaux de mine : chacun ajoute un minerai, plus rare et plus cher', () => {
    expect(NIVEAU_MINE_MAX).toBe(5)
    const nouveaux = NIVEAUX_MINE.map((n, i) => Object.keys(n.poids).filter((b) => i === 0 || !(b in NIVEAUX_MINE[i - 1].poids)))
    expect(nouveaux).toEqual([['pierre', 'charbon', 'fer'], ['redstone'], ['or'], ['emeraude'], ['diamant']])
    // Les minerais rares sont plus abondants dans les niveaux du bas.
    expect(NIVEAUX_MINE[4].poids.or ?? 0).toBeGreaterThan(NIVEAUX_MINE[2].poids.or ?? 0)
    expect(NIVEAUX_MINE[4].poids.pierre ?? 0).toBeLessThan(NIVEAUX_MINE[0].poids.pierre ?? 0)
  })

  it('le générateur commence avec un rayon de 15 cases, et grandit', () => {
    expect(NIVEAUX_GENERATEUR[0].rayon).toBe(15)
    NIVEAUX_GENERATEUR.forEach((n, i) => {
      if (i > 0) expect(n.rayon).toBeGreaterThan(NIVEAUX_GENERATEUR[i - 1].rayon)
    })
  })

  it('l’équipement des mineurs se paie seulement en argent', () => {
    for (const niveau of NIVEAUX_EMPLOYE.slice(1)) {
      expect(niveau.cout.materiaux).toEqual({})
      expect(niveau.cout.argent).toBeGreaterThan(0)
    }
  })

  // (23/10 bis) L'ascenseur doit suivre les mineurs : avant, son niveau 4 sur 6 suffisait même à
  // la fin du jeu.
  it("l'ascenseur a 10 niveaux, de plus en plus chers, et son débit suit les mineurs", () => {
    const debit = (n: (typeof NIVEAUX_ASCENSEUR)[number]) => n.capacite / (2 * n.secondesTrajet + n.secondesChargement + n.secondesVidage)
    expect(NIVEAUX_ASCENSEUR).toHaveLength(10)
    NIVEAUX_ASCENSEUR.forEach((n, i) => {
      expect(n.niveau).toBe(i + 1)
      if (i === 0) return
      expect(debit(n)).toBeGreaterThan(debit(NIVEAUX_ASCENSEUR[i - 1]) * 1.3)
      expect(n.cout.argent ?? 0).toBeGreaterThan(NIVEAUX_ASCENSEUR[i - 1].cout.argent ?? 0)
    })
    // 5 mineurs communs avec une pioche en diamant : le niveau 4 ne suit plus du tout.
    const cinqMineursDiamant = 5 * NIVEAUX_EMPLOYE[NIVEAUX_EMPLOYE.length - 1].vitesse
    expect(debit(NIVEAUX_ASCENSEUR[3])).toBeLessThan(cinqMineursDiamant / 1.5)
    expect(debit(NIVEAUX_ASCENSEUR[9])).toBeGreaterThan(cinqMineursDiamant * 3)
  })
})
