import { describe, expect, it } from 'vitest'
import { travailler, type Travail } from './travail'

// Casse des blocs de « duree » secondes pendant 10 s, avec un tic toutes les « pas » secondes.
function blocsCasses(duree: number, pas: number): number {
  const travail: Travail = { cle: '', temps: 0, reste: 0 }
  let numero = 0
  let casses = 0
  for (let t = 0; t < 10 - 1e-9; t += pas) {
    if (travailler(travail, `bloc-${numero}`, duree, pas)) {
      casses += 1
      numero += 1
    }
  }
  return casses
}

describe('le minage, tic après tic', () => {
  it('va à la même vitesse que l’horloge batte 20 ou 60 fois par seconde (bug de l’ascenseur)', () => {
    // Des blocs de 0,13 s : 10 / 0,13 ≈ 76 blocs en 10 s.
    const lent = blocsCasses(0.13, 0.05) // 20 tics par seconde (horloge normale)
    const rapide = blocsCasses(0.13, 1 / 60) // à chaque image (pendant un trajet d'ascenseur)
    expect(Math.abs(lent - rapide)).toBeLessThanOrEqual(1)
    expect(lent).toBeGreaterThanOrEqual(75)
  })

  it('ne prend jamais plus d’un bloc d’avance', () => {
    const travail: Travail = { cle: '', temps: 0, reste: 0 }
    expect(travailler(travail, 'a', 0.1, 5)).toBe(true) // 5 s d'un coup (onglet en pause)
    expect(travail.reste).toBeLessThanOrEqual(0.1)
  })
})
