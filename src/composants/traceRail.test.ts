import { describe, expect, it } from 'vitest'
import { nouveauVillage } from '../jeu/village'
import { avancer, sensDeDepart, tourner, virageEntre } from './traceRail'

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

describe('le sens du rail proposé (26/10)', () => {
  it('à côté du bout d’une ligne de rails, la flèche continue la ligne', () => {
    const village = nouveauVillage()
    village.rails = ['20,25', '20,26', '20,27']
    // Juste après le bout du bas : on continue vers le bas.
    expect(sensDeDepart(village, { x: 20, y: 28 })).toEqual({ x: 0, y: 1 })
    // À droite du bout : on part vers la droite.
    expect(sensDeDepart(village, { x: 21, y: 27 })).toEqual({ x: 1, y: 0 })
  })
})
