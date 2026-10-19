import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { LARGEUR_MINE } from './donnees'
import { genererCouche, poidsDesBlocs, tirerBloc, tirerBlocNormal } from './mine'

function blocsPossibles(profondeur: number) {
  return poidsDesBlocs(profondeur).map((c) => c.valeur)
}

describe('génération de la mine', () => {
  it('a de la terre en surface, de la pierre puis de la deepslate', () => {
    expect(blocsPossibles(5)).toContain('terre')
    expect(blocsPossibles(20)).toContain('pierre')
    expect(blocsPossibles(90)).toContain('deepslate')
    expect(blocsPossibles(90)).not.toContain('pierre')
  })

  it("ne met les minerais qu'à partir de leur profondeur", () => {
    expect(blocsPossibles(6)).not.toContain('charbon')
    expect(blocsPossibles(7)).toContain('charbon') // un peu de charbon et de fer près de la surface
    expect(blocsPossibles(7)).toContain('fer')
    expect(blocsPossibles(17)).not.toContain('redstone')
    expect(blocsPossibles(18)).toContain('redstone')
    expect(blocsPossibles(24)).not.toContain('or')
    expect(blocsPossibles(25)).toContain('or')
    expect(blocsPossibles(44)).not.toContain('diamant')
    expect(blocsPossibles(45)).toContain('diamant')
    expect(blocsPossibles(95)).not.toContain('debris')
    expect(blocsPossibles(96)).toContain('debris')
  })

  it('les minerais apparaissent petit à petit (pas d’un coup)', () => {
    const poids = (profondeur: number, bloc: string) => poidsDesBlocs(profondeur).find((c) => c.valeur === bloc)?.poids ?? 0
    // L'or : très rare au début, puis de plus en plus fréquent, jusqu'à son maximum.
    expect(poids(25, 'or')).toBeLessThan(1)
    expect(poids(45, 'or')).toBeGreaterThan(poids(25, 'or'))
    expect(poids(65, 'or')).toBeGreaterThan(poids(45, 'or'))
    expect(poids(100, 'or')).toBe(poids(65, 'or'))
    // Jamais de saut brutal d'un mètre à l'autre.
    for (let p = 7; p < 127; p++) {
      for (const bloc of ['charbon', 'fer', 'redstone', 'or', 'lapis', 'emeraude', 'diamant']) {
        expect(Math.abs(poids(p + 1, bloc) - poids(p, bloc))).toBeLessThan(1)
      }
    }
  })

  it('place les blocs spéciaux à partir de leur profondeur', () => {
    expect(blocsPossibles(16)).not.toContain('coffre')
    expect(blocsPossibles(17)).toContain('coffre')
    expect(blocsPossibles(41)).toContain('lave')
    expect(blocsPossibles(51)).toContain('geode')
  })

  it('la foreuse ne tire jamais de bloc spécial', () => {
    const aleatoire = aleatoireAvecGraine(5)
    for (let i = 0; i < 2000; i++) expect(['lave', 'coffre', 'geode']).not.toContain(tirerBlocNormal(60, aleatoire))
  })

  it('génère des couches de 6 blocs, toujours les mêmes avec la même graine', () => {
    const a = genererCouche(70, aleatoireAvecGraine(7))
    const b = genererCouche(70, aleatoireAvecGraine(7))
    expect(a).toHaveLength(LARGEUR_MINE)
    expect(a).toEqual(b)
  })

  it('respecte les poids : la roche est bien plus fréquente que le diamant', () => {
    const aleatoire = aleatoireAvecGraine(3)
    let pierre = 0
    let diamant = 0
    for (let i = 0; i < 5000; i++) {
      const bloc = tirerBloc(70, aleatoire)
      if (bloc === 'pierre') pierre++
      if (bloc === 'diamant') diamant++
    }
    expect(pierre).toBeGreaterThan(diamant * 20)
    expect(diamant).toBeGreaterThan(0)
  })
})
