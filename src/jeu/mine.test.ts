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

  it("ne met les minerais qu'à la bonne profondeur", () => {
    expect(blocsPossibles(30)).not.toContain('charbon')
    expect(blocsPossibles(31)).toContain('fer')
    expect(blocsPossibles(40)).not.toContain('redstone')
    expect(blocsPossibles(41)).toContain('redstone')
    expect(blocsPossibles(60)).not.toContain('diamant')
    expect(blocsPossibles(61)).toContain('diamant')
    expect(blocsPossibles(104)).not.toContain('debris')
    expect(blocsPossibles(105)).toContain('debris')
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
