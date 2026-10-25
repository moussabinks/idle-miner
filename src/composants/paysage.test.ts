import { describe, expect, it } from 'vitest'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { versEcran } from './iso'
import { CASCADE, cadreDe, deDevant, dehors, eauDeLaCascade, planterPaysage } from './paysage'
import { surLaPlage } from './plage'

const N = TAILLE_GRILLE

describe('le paysage autour de la clairière', () => {
  const plantes = planterPaysage()

  it('est toujours le même (hasard à graine fixe)', () => {
    expect(planterPaysage()).toEqual(plantes)
  })

  it('a des montagnes au fond et des collines devant', () => {
    expect(plantes.filter((p) => p.sorte.startsWith('montagne') && !deDevant(p.x, p.y)).length).toBeGreaterThan(10)
    expect(plantes.filter((p) => !p.sorte.startsWith('montagne') && deDevant(p.x, p.y)).length).toBeGreaterThan(10)
  })

  it('pousse derrière la rangée d’arbres de la lisière, jamais sur la plage', () => {
    for (const p of plantes) {
      expect(dehors(p.x, p.y)).toBeGreaterThan(2.5)
      expect(surLaPlage(p.x, p.y)).toBe(false)
    }
  })

  it('ne cache jamais la clairière, devant', () => {
    // Le haut d'une vignette de devant reste sous la ligne des pieds des arbres de la lisière.
    for (const p of plantes.filter((p) => deDevant(p.x, p.y) && p.y <= N)) {
      const cadre = cadreDe(p)
      const milieu = (cadre.x0 + cadre.x1) / 2
      const y = N + 1.9 - (milieu - versEcran(0, 0).x) / 16.5
      if (y < -3 || y > N + 3) continue
      expect(cadre.y0).toBeGreaterThan(versEcran(N + 1.9, y).y - 20)
    }
  })

  it('laisse voir la cascade (rien ne pousse devant son eau)', () => {
    const eau = eauDeLaCascade()
    const devant = plantes.filter((p) => p.x + p.y > CASCADE.x + CASCADE.y)
    for (const p of devant) {
      const c = cadreDe(p)
      const croise = c.x0 < eau.x1 && c.x1 > eau.x0 && c.y0 < eau.y1 && c.y1 > eau.y0
      expect(croise).toBe(false)
    }
  })
})
