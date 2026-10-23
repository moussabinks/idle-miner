import { describe, expect, it } from 'vitest'
import { avancer, tourner, virageEntre } from './traceRail'

describe('poser des rails pas à pas (23/10)', () => {
  it('gauche et droite sont des virages opposés, deux fois à gauche fait demi-tour', () => {
    for (const sens of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]) {
      const g = tourner(sens, 'gauche')
      const d = tourner(sens, 'droite')
      expect(g).toEqual({ x: -d.x, y: -d.y })
      expect(Math.abs(g.x) + Math.abs(g.y)).toBe(1)
      expect(tourner(g, 'gauche')).toEqual({ x: -sens.x, y: -sens.y })
      expect(tourner(sens, 'droit')).toEqual(sens)
      expect(virageEntre(sens, g)).toBe('gauche')
      expect(virageEntre(sens, d)).toBe('droite')
    }
  })

  it('le rail proposé est juste après le dernier, dans le sens choisi', () => {
    expect(avancer({ x: 3, y: 4 }, { x: 0, y: -1 })).toEqual({ x: 3, y: 3 })
  })
})
