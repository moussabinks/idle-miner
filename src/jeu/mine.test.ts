import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { LARGEUR_MINE } from './donnees'
import { genererCouche, poidsDesBlocs, tirerBloc } from './mine'

function blocsPossibles(profondeur: number) {
  return poidsDesBlocs(profondeur).map((c) => c.valeur)
}

describe('génération de la mine', () => {
  it('a de la terre en surface, de la pierre puis de la deepslate', () => {
    expect(blocsPossibles(2)).toContain('terre')
    expect(blocsPossibles(10)).toContain('pierre')
    expect(blocsPossibles(45)).toContain('deepslate')
    expect(blocsPossibles(45)).not.toContain('pierre')
  })

  it("ne met les minerais qu'à la bonne profondeur", () => {
    expect(blocsPossibles(15)).not.toContain('charbon')
    expect(blocsPossibles(16)).toContain('fer')
    expect(blocsPossibles(30)).not.toContain('diamant')
    expect(blocsPossibles(31)).toContain('diamant')
    expect(blocsPossibles(52)).not.toContain('debris')
    expect(blocsPossibles(53)).toContain('debris')
  })

  it('place les blocs spéciaux à partir de leur profondeur', () => {
    expect(blocsPossibles(8)).not.toContain('coffre')
    expect(blocsPossibles(9)).toContain('coffre')
    expect(blocsPossibles(21)).toContain('lave')
    expect(blocsPossibles(26)).toContain('geode')
  })

  it('génère des couches de 6 blocs, toujours les mêmes avec la même graine', () => {
    const a = genererCouche(35, aleatoireAvecGraine(7))
    const b = genererCouche(35, aleatoireAvecGraine(7))
    expect(a).toHaveLength(LARGEUR_MINE)
    expect(a).toEqual(b)
  })

  it('respecte les poids : la roche est bien plus fréquente que le diamant', () => {
    const aleatoire = aleatoireAvecGraine(3)
    let pierre = 0
    let diamant = 0
    for (let i = 0; i < 5000; i++) {
      const bloc = tirerBloc(35, aleatoire)
      if (bloc === 'pierre') pierre++
      if (bloc === 'diamant') diamant++
    }
    expect(pierre).toBeGreaterThan(diamant * 20)
    expect(diamant).toBeGreaterThan(0)
  })
})
