import { describe, expect, it } from 'vitest'
import { nouveauVillage } from '../jeu/village'
import { sensDeDepart } from './traceRail'

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
