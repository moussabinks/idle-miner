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

  // (25/10 : un début bien plus rapide, le jeu doit tourner tout seul en quelques minutes)
  it('arrive au niveau 2 de la mine en 2 à 10 minutes (médiane)', () => {
    const m = mediane(parties.map((p) => minutes(p.tempsNiveaux[2])))
    expect(m).toBeGreaterThanOrEqual(2)
    expect(m).toBeLessThanOrEqual(10)
  })

  // (25/10 : les paliers ; le bot joue mieux qu'un joueur, qui mettra plutôt 5 à 8 h)
  // (25/10, économie revue : les paliers 3 à 5 coûtent bien moins cher) Avant : 3 h à 6 h.
  it('arrive au niveau 5 en 1 h à 3 h (médiane)', () => {
    const m = mediane(parties.map((p) => minutes(p.tempsNiveaux[5])))
    expect(m).toBeGreaterThanOrEqual(60)
    expect(m).toBeLessThanOrEqual(3 * 60)
  })

  // (26/10 : la grosse mise à jour, saphir au niveau 5, rubis au 6, diamant au 7) La fin de partie
  // prend quelques heures de plus.
  // (26/10, la hausse de la fin de partie : × 2 à × 3 aux paliers 5 à 7) Le bot ne tente pas sa
  // chance au recruteur : un joueur avec des mineurs rares ira plus vite. Avant : 3 h à 7 h.
  // (26/10, bis) Le bot améliore aussi l'ascenseur quand il bloque (comme la tâche le propose) : ~6 h.
  it(`arrive au niveau ${NIVEAU_MINE_MAX} en 4 h à 9 h (médiane)`, () => {
    const m = mediane(parties.map((p) => minutes(p.temps)))
    expect(m).toBeGreaterThanOrEqual(4 * 60)
    expect(m).toBeLessThanOrEqual(9 * 60)
  })

  it('fait tourner la fonderie et la joaillerie', () => {
    for (const partie of parties) {
      expect(partie.etat.fonderie.fabriques).toBeGreaterThan(100)
      expect(partie.etat.joaillerie.fabriques).toBeGreaterThan(20)
    }
  })

  it('monte de niveau petit à petit : niveau 5 après 8 minutes, niveau 10 après 1 heure (médiane)', () => {
    expect(mediane(parties.map((p) => minutes(p.tempsNiveauxJoueur[5])))).toBeGreaterThanOrEqual(8)
    expect(mediane(parties.map((p) => minutes(p.tempsNiveauxJoueur[10])))).toBeGreaterThanOrEqual(60)
  })

  it('chaque niveau prend plus de temps que le précédent (médiane)', () => {
    const durees = Array.from({ length: NIVEAU_MINE_MAX - 1 }, (_, i) => i + 2).map((n) => mediane(parties.map((p) => (p.tempsNiveaux[n] ?? Infinity) - (p.tempsNiveaux[n - 1] ?? 0))))
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

  it('vend le coffre à la main au début (avant le wagonnet)', () => {
    for (const partie of parties) expect(partie.allersRetours).toBeGreaterThan(3)
  })
})
