import { describe, expect, it } from 'vitest'
import { PIOCHES, dureeCasse } from './donnees'

describe('pioches', () => {
  it('sont triées par niveau et de plus en plus rapides', () => {
    PIOCHES.forEach((p, i) => {
      expect(p.niveau).toBe(i)
      if (i > 0) expect(p.vitesse).toBeGreaterThan(PIOCHES[i - 1].vitesse)
    })
  })
})

describe('dureeCasse', () => {
  it('applique le malus x1.5 dans la roche dure (sous -94 m)', () => {
    expect(dureeCasse(3, 95, 6)).toBeCloseTo(dureeCasse(3, 94, 6) * 1.5)
  })

  it('casse la pierre en 0.3375 s avec une pioche en bois', () => {
    expect(dureeCasse(1.5, 10, 2)).toBeCloseTo(0.3375)
  })
})
