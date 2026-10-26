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
  PALIER_CHEF,
  PIOCHES,
  TAILLE_GRILLE,
} from './donnees'

describe('les données du jeu', () => {
  // (26/10) 9 minerais (le saphir et le rubis en plus), puis les lingots et les bijoux des ateliers.
  it('9 minerais, 2 lingots, 4 bijoux : plus de lapis ni de netherite', () => {
    expect(LISTE_BLOCS).toEqual([
      'pierre', 'charbon', 'fer', 'redstone', 'or', 'emeraude', 'saphir', 'rubis', 'diamant',
      'lingot_fer', 'lingot_or', 'bijou_emeraude', 'bijou_saphir', 'bijou_rubis', 'bijou_diamant',
    ])
    for (const id of LISTE_BLOCS) expect(BLOCS[id].prix).toBeGreaterThan(0)
  })

  it('les pioches doublent de plus en plus souvent, et durent de plus en plus longtemps', () => {
    expect(PIOCHES.map((p) => p.doublement)).toEqual([0.1, 0.2, 0.3, 0.38, 0.45, 0.52, 0.6])
    PIOCHES.forEach((p, i) => {
      expect(p.niveau).toBe(i)
      if (i > 0) expect(p.durabilite).toBeGreaterThan(PIOCHES[i - 1].durabilite)
    })
  })

  it('7 niveaux de mine : chacun ajoute un minerai, plus rare et plus cher', () => {
    expect(NIVEAU_MINE_MAX).toBe(7)
    const nouveaux = NIVEAUX_MINE.map((n, i) => Object.keys(n.poids).filter((b) => i === 0 || !(b in NIVEAUX_MINE[i - 1].poids)))
    expect(nouveaux).toEqual([['pierre', 'charbon', 'fer'], ['redstone'], ['or'], ['emeraude'], ['saphir'], ['rubis'], ['diamant']])
    // Les minerais rares sont plus abondants dans les niveaux du bas.
    expect(NIVEAUX_MINE[4].poids.or ?? 0).toBeGreaterThan(NIVEAUX_MINE[2].poids.or ?? 0)
    expect(NIVEAUX_MINE[4].poids.pierre ?? 0).toBeLessThan(NIVEAUX_MINE[0].poids.pierre ?? 0)
  })

  it('le générateur commence avec un rayon de 12 cases, et grandit sans dépasser la clairière (25/10)', () => {
    expect(NIVEAUX_GENERATEUR[0].rayon).toBe(12)
    NIVEAUX_GENERATEUR.forEach((n, i) => {
      if (i > 0) expect(n.rayon).toBeGreaterThan(NIVEAUX_GENERATEUR[i - 1].rayon)
    })
    // (26/10) Au niveau max, du milieu de la clairière à un coin, sans la dépasser de beaucoup.
    const milieuAuCoin = (TAILLE_GRILLE / 2) * Math.SQRT2
    expect(NIVEAUX_GENERATEUR[NIVEAUX_GENERATEUR.length - 1].rayon).toBeGreaterThanOrEqual(milieuAuCoin - 1)
    expect(NIVEAUX_GENERATEUR[NIVEAUX_GENERATEUR.length - 1].rayon).toBeLessThanOrEqual(milieuAuCoin + 1)
  })

  it('(25/10) toutes les améliorations ont autant de niveaux que la mine (7 depuis le 26/10) ; les chefs en ont 3', () => {
    expect(NIVEAUX_PAR_AMELIORATION).toBe(NIVEAU_MINE_MAX)
    for (const liste of [NIVEAUX_COFFRE, PIOCHES, NIVEAUX_ASCENSEUR, NIVEAUX_EMPLOYE, NIVEAUX_POUSSEUR, NIVEAUX_CHARIOT_POUSSEUR, NIVEAUX_GENERATEUR, NIVEAUX_FORAGE, NIVEAUX_CHARIOT]) {
      expect(liste).toHaveLength(NIVEAUX_PAR_AMELIORATION)
    }
    expect(NIVEAUX_MANAGER).toHaveLength(3)
    expect(NIVEAUX_RECRUTEUR).toHaveLength(3)
    // (26/10) Les chefs arrivent à leur dernier niveau au niveau 6 de la mine.
    expect(PALIER_CHEF.manager[PALIER_CHEF.manager.length - 1]).toBe(6)
    expect(PALIER_CHEF.recruteur[PALIER_CHEF.recruteur.length - 1]).toBe(6)
  })

  it('l’équipement des mineurs se paie seulement en argent', () => {
    for (const niveau of NIVEAUX_EMPLOYE.slice(1)) {
      expect(niveau.cout.materiaux).toEqual({})
      expect(niveau.cout.argent).toBeGreaterThan(0)
    }
  })

  // (23/10 bis) L'ascenseur doit suivre les mineurs. (25/10) 5 niveaux : son débit double à peu
  // près à chaque palier (1 ; 2,1 ; 4,3 ; 8,6 ; 17 blocs/s). (26/10) 7 niveaux : puis 31 et 51.
  it("l'ascenseur a 7 niveaux, de plus en plus chers, et son débit suit les mineurs", () => {
    const debit = (n: (typeof NIVEAUX_ASCENSEUR)[number]) => n.capacite / (2 * n.secondesTrajet + n.secondesChargement + n.secondesVidage)
    expect(NIVEAUX_ASCENSEUR).toHaveLength(7)
    NIVEAUX_ASCENSEUR.forEach((n, i) => {
      expect(n.niveau).toBe(i + 1)
      if (i === 0) return
      expect(debit(n)).toBeGreaterThan(debit(NIVEAUX_ASCENSEUR[i - 1]) * 1.6)
      expect(n.cout.argent ?? 0).toBeGreaterThan(NIVEAUX_ASCENSEUR[i - 1].cout.argent ?? 0)
    })
    // 8 mineurs communs (le maximum) avec une pioche en diamant : le niveau 3 ne suit plus du
    // tout, le 7 suit avec de la marge (pour les mineurs rares).
    const huitMineursDiamant = 8 * NIVEAUX_EMPLOYE[NIVEAUX_EMPLOYE.length - 1].vitesse
    expect(debit(NIVEAUX_ASCENSEUR[2])).toBeLessThan(huitMineursDiamant / 1.5)
    expect(debit(NIVEAUX_ASCENSEUR[6])).toBeGreaterThan(huitMineursDiamant * 2)
  })

  // (26/10, demandé par le propriétaire) Jamais plus de 1 000 d'un même matériau dans un prix.
  it('aucune amélioration ne coûte plus de 1 000 d’un matériau', () => {
    const tables = [NIVEAUX_MINE, NIVEAUX_COFFRE, PIOCHES, NIVEAUX_ASCENSEUR, NIVEAUX_EMPLOYE, NIVEAUX_POUSSEUR, NIVEAUX_CHARIOT_POUSSEUR, NIVEAUX_GENERATEUR, NIVEAUX_FORAGE, NIVEAUX_CHARIOT, NIVEAUX_MANAGER, NIVEAUX_RECRUTEUR] as { cout: { materiaux: Record<string, number | undefined> } }[][]
    for (const table of tables) {
      for (const { cout } of table) for (const n of Object.values(cout.materiaux)) expect(n ?? 0).toBeLessThanOrEqual(1000)
    }
  })
})
