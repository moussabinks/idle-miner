import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { jouerPartie } from './bot'
import { NIVEAU_MINE_MAX } from './donnees'

// Le bot joue 10 parties (avec des graines fixes, donc toujours les mêmes).
const parties = Array.from({ length: 10 }, (_, i) => jouerPartie(aleatoireAvecGraine(i + 1)))
const mediane = (valeurs: number[]) => [...valeurs].sort((a, b) => a - b)[Math.floor(valeurs.length / 2)]
const minutes = (secondes: number | null | undefined) => (secondes ?? Infinity) / 60

describe('bot de simulation (équilibrage)', () => {
  it(`descend toujours la mine au niveau ${NIVEAU_MINE_MAX}`, () => {
    for (const partie of parties) expect(partie.etat.niveauMine).toBe(NIVEAU_MINE_MAX)
  })

  it('arrive au niveau 2 de la mine en 5 à 20 minutes (médiane)', () => {
    const m = mediane(parties.map((p) => minutes(p.tempsNiveaux[2])))
    expect(m).toBeGreaterThanOrEqual(5)
    expect(m).toBeLessThanOrEqual(20)
  })

  it('arrive au niveau 5 en 1 h à 2 h 30 (médiane)', () => {
    const m = mediane(parties.map((p) => minutes(p.temps)))
    expect(m).toBeGreaterThanOrEqual(60)
    expect(m).toBeLessThanOrEqual(150)
  })

  it('chaque niveau prend plus de temps que le précédent (médiane)', () => {
    const durees = [2, 3, 4, 5].map((n) => mediane(parties.map((p) => (p.tempsNiveaux[n] ?? Infinity) - (p.tempsNiveaux[n - 1] ?? 0))))
    for (let i = 1; i < durees.length; i++) expect(durees[i]).toBeGreaterThan(durees[i - 1] * 0.8)
  })

  it('relie vite la mine au marché avec des rails (moins de 5 minutes)', () => {
    for (const partie of parties) expect(minutes(partie.tempsRails)).toBeLessThan(5)
  })

  it('électrifie les rails avec le générateur en moins de 40 minutes', () => {
    for (const partie of parties) expect(minutes(partie.tempsElectrique)).toBeLessThan(40)
  })

  it('a embauché des mineurs, et le wagonnet a fait beaucoup de voyages', () => {
    for (const partie of parties) {
      expect(partie.etat.employes.length).toBeGreaterThanOrEqual(4)
      expect(partie.etat.stats.voyagesWagonnet).toBeGreaterThan(100)
      // Les mineurs sortent plus de blocs que les clics du joueur.
      expect(partie.etat.stats.blocsMineurs).toBeGreaterThan(partie.etat.stats.blocsCasses)
    }
  })

  it('va vendre à pied au marché au début', () => {
    for (const partie of parties) expect(partie.allersRetours).toBeGreaterThan(3)
  })
})
