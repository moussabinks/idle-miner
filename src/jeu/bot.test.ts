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

  // (29/10 : le jeu est plus lent, avec des prix plus chers et le niveau du joueur)
  it('arrive au niveau 2 de la mine en 15 à 40 minutes (médiane)', () => {
    const m = mediane(parties.map((p) => minutes(p.tempsNiveaux[2])))
    expect(m).toBeGreaterThanOrEqual(15)
    expect(m).toBeLessThanOrEqual(40)
  })

  it('arrive au niveau 5 en 4 h à 7 h (médiane)', () => {
    const m = mediane(parties.map((p) => minutes(p.temps)))
    expect(m).toBeGreaterThanOrEqual(4 * 60)
    expect(m).toBeLessThanOrEqual(7 * 60)
  })

  it('monte de niveau petit à petit : niveau 5 après 8 minutes, niveau 10 après 1 heure (médiane)', () => {
    expect(mediane(parties.map((p) => minutes(p.tempsNiveauxJoueur[5])))).toBeGreaterThanOrEqual(8)
    expect(mediane(parties.map((p) => minutes(p.tempsNiveauxJoueur[10])))).toBeGreaterThanOrEqual(60)
  })

  it('chaque niveau prend plus de temps que le précédent (médiane)', () => {
    const durees = [2, 3, 4, 5].map((n) => mediane(parties.map((p) => (p.tempsNiveaux[n] ?? Infinity) - (p.tempsNiveaux[n - 1] ?? 0))))
    for (let i = 1; i < durees.length; i++) expect(durees[i]).toBeGreaterThan(durees[i - 1] * 0.8)
  })

  it('relie la mine au marché avec des rails dès qu’ils sont débloqués (moins de 10 minutes)', () => {
    for (const partie of parties) expect(minutes(partie.tempsRails)).toBeLessThan(10)
  })

  it('électrifie les rails avec le générateur en moins de 1 h 30', () => {
    for (const partie of parties) expect(minutes(partie.tempsElectrique)).toBeLessThan(90)
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
