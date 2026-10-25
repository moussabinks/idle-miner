import { describe, expect, it } from 'vitest'
import {
  BLOCS,
  LISTE_BLOCS,
  NIVEAUX_ASCENSEUR,
  NIVEAUX_CHARIOT,
  NIVEAUX_CHARIOT_POUSSEUR,
  NIVEAUX_COFFRE,
  NIVEAUX_EMPLOYE,
  NIVEAUX_FORAGE,
  NIVEAUX_GENERATEUR,
  NIVEAUX_MANAGER,
  NIVEAUX_MINE,
  NIVEAUX_PAR_AMELIORATION,
  NIVEAUX_POUSSEUR,
  NIVEAUX_RECRUTEUR,
  NIVEAU_MINE_MAX,
  PIOCHES,
  TAILLE_GRILLE,
} from './donnees'

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

  it('le générateur commence avec un rayon de 12 cases, et grandit sans dépasser la clairière (25/10)', () => {
    expect(NIVEAUX_GENERATEUR[0].rayon).toBe(12)
    NIVEAUX_GENERATEUR.forEach((n, i) => {
      if (i > 0) expect(n.rayon).toBeGreaterThan(NIVEAUX_GENERATEUR[i - 1].rayon)
    })
    expect(NIVEAUX_GENERATEUR[NIVEAUX_GENERATEUR.length - 1].rayon).toBeLessThanOrEqual(TAILLE_GRILLE)
  })

  it('(25/10) toutes les améliorations ont 5 niveaux, comme la mine ; les chefs en ont 3', () => {
    expect(NIVEAUX_PAR_AMELIORATION).toBe(NIVEAU_MINE_MAX)
    for (const liste of [NIVEAUX_COFFRE, PIOCHES, NIVEAUX_ASCENSEUR, NIVEAUX_EMPLOYE, NIVEAUX_POUSSEUR, NIVEAUX_CHARIOT_POUSSEUR, NIVEAUX_GENERATEUR, NIVEAUX_FORAGE, NIVEAUX_CHARIOT]) {
      expect(liste).toHaveLength(NIVEAUX_PAR_AMELIORATION)
    }
    expect(NIVEAUX_MANAGER).toHaveLength(3)
    expect(NIVEAUX_RECRUTEUR).toHaveLength(3)
  })

  it('l’équipement des mineurs se paie seulement en argent', () => {
    for (const niveau of NIVEAUX_EMPLOYE.slice(1)) {
      expect(niveau.cout.materiaux).toEqual({})
      expect(niveau.cout.argent).toBeGreaterThan(0)
    }
  })

  // (23/10 bis) L'ascenseur doit suivre les mineurs. (25/10) 5 niveaux : son débit double à peu
  // près à chaque palier (1 ; 2,1 ; 4,3 ; 8,6 ; 17 blocs/s).
  it("l'ascenseur a 5 niveaux, de plus en plus chers, et son débit suit les mineurs", () => {
    const debit = (n: (typeof NIVEAUX_ASCENSEUR)[number]) => n.capacite / (2 * n.secondesTrajet + n.secondesChargement + n.secondesVidage)
    expect(NIVEAUX_ASCENSEUR).toHaveLength(5)
    NIVEAUX_ASCENSEUR.forEach((n, i) => {
      expect(n.niveau).toBe(i + 1)
      if (i === 0) return
      expect(debit(n)).toBeGreaterThan(debit(NIVEAUX_ASCENSEUR[i - 1]) * 1.8)
      expect(n.cout.argent ?? 0).toBeGreaterThan(NIVEAUX_ASCENSEUR[i - 1].cout.argent ?? 0)
    })
    // 5 mineurs communs avec une pioche en diamant : le niveau 3 ne suit plus du tout, le 5 suit
    // avec de la marge (pour les mineurs rares).
    const cinqMineursDiamant = 5 * NIVEAUX_EMPLOYE[NIVEAUX_EMPLOYE.length - 1].vitesse
    expect(debit(NIVEAUX_ASCENSEUR[2])).toBeLessThan(cinqMineursDiamant / 1.5)
    expect(debit(NIVEAUX_ASCENSEUR[4])).toBeGreaterThan(cinqMineursDiamant * 2)
  })
})
