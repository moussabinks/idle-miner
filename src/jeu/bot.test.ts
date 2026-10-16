import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { jouerPartie } from './bot'

// Le bot joue 20 parties (avec des graines fixes, donc toujours les mêmes).
const parties = Array.from({ length: 20 }, (_, i) => jouerPartie(aleatoireAvecGraine(i + 1)))
const blocsTries = parties.map((p) => p.blocs).sort((a, b) => a - b)
const mediane = blocsTries[Math.floor(blocsTries.length / 2)]

describe('bot de simulation (équilibrage)', () => {
  it('atteint toujours la bedrock', () => {
    for (const partie of parties) {
      expect(partie.etat.victoire).toBe(true)
      expect(partie.etat.meilleure).toBe(4)
    }
  })

  it('atteint la bedrock en 900 à 1 250 blocs (médiane)', () => {
    expect(mediane).toBeGreaterThanOrEqual(900)
    expect(mediane).toBeLessThanOrEqual(1250)
  })

  it("n'est jamais extrêmement long ou court", () => {
    expect(blocsTries[0]).toBeGreaterThan(600)
    expect(blocsTries[blocsTries.length - 1]).toBeLessThan(1800)
  })

  it('remonte à la surface et achète l’ascenseur', () => {
    for (const partie of parties) {
      expect(partie.allersRetours).toBeGreaterThan(3)
      expect(partie.etat.ascenseur.possede).toBe(true)
    }
  })

  it('achète la pioche en fer entre -15 et -30 m (souvent vers -26/-30 m)', () => {
    for (const partie of parties) {
      expect(partie.profondeurPiocheFer).toBeGreaterThanOrEqual(15)
      expect(partie.profondeurPiocheFer).toBeLessThanOrEqual(30)
    }
  })
})
