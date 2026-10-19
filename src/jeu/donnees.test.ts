import { describe, expect, it } from 'vitest'
import { NIVEAUX_CHARIOT, NIVEAUX_EMPLOYE, NIVEAUX_FORAGE, PIOCHES, dureeCasse, profondeurBedrock, profondeurMaxPioche } from './donnees'

describe('pioches', () => {
  it('sont triées par niveau et de plus en plus rapides', () => {
    PIOCHES.forEach((p, i) => {
      expect(p.niveau).toBe(i)
      if (i > 0) expect(p.vitesse).toBeGreaterThan(PIOCHES[i - 1].vitesse)
    })
  })
})

describe('dureeCasse', () => {
  it('les améliorations de la foreuse et des mineurs coûtent du fer et de la redstone (et moins d’argent)', () => {
    for (const niveau of [...NIVEAUX_FORAGE.slice(1), ...NIVEAUX_CHARIOT.slice(2), ...NIVEAUX_EMPLOYE.slice(1)]) {
      expect(niveau.cout.materiaux.fer).toBeGreaterThan(0)
      expect(niveau.cout.materiaux.redstone).toBeGreaterThan(0)
      expect(niveau.cout.argent).toBeLessThanOrEqual(30000)
    }
  })

  it('la bedrock descend de 50 m à chaque prestige', () => {
    expect([0, 1, 2, 3, 4].map(profondeurBedrock)).toEqual([100, 150, 200, 250, 300])
    expect(profondeurMaxPioche(4, 0)).toBe(100) // la netherite va jusqu'à la bedrock
    expect(profondeurMaxPioche(4, 3)).toBe(250)
  })

  it('applique le malus x1.5 dans la roche dure (sous -94 m)', () => {
    expect(dureeCasse(3, 95, 6, 1)).toBeCloseTo(dureeCasse(3, 94, 6, 1) * 1.5) // mine de 150 m (prestige 1)
  })

  it('casse la pierre en 0.3375 s avec une pioche en bois', () => {
    expect(dureeCasse(1.5, 10, 2, 0)).toBeCloseTo(0.3375)
  })
})
