import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { partieDeTest } from './partieDeTest'
import { DECORATIONS } from './donnees'
import { decorationsPosees, deplacerDecoration, placeLibrePourDecoration, poserDecoration, rangerDecoration, stockDecoration } from './decorations'
import { annulerReorganisation, commencerReorganisation } from './reorganiser'
import { construireBatiment } from './batiments'
import { empriseLibre } from './village'

function partie() {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.argent = 100_000
  return etat
}

describe('les décorations du village (revenues le 27/10)', () => {
  it('on en achète, on les pose, elles occupent leur place', () => {
    const etat = partie()
    poserDecoration(etat, 'fontaine', 2, 2)
    expect(etat.argent).toBe(100_000 - DECORATIONS.fontaine.prix)
    expect(decorationsPosees(etat)).toHaveLength(1)
    // une fontaine fait 2 × 2 cases : on ne pose rien dessus
    expect(empriseLibre(etat.village, { x: 3, y: 3, taille: 1 })).toBe(false)
    expect(placeLibrePourDecoration(etat, 'buisson', 3, 2)).toBe(false)
    poserDecoration(etat, 'buisson', 3, 2)
    expect(decorationsPosees(etat)).toHaveLength(1)
    // et un bâtiment non plus
    expect(construireBatiment(etat, 'marche', 0, 0)).toEqual([])
  })

  it('pas assez d’argent : rien ne se pose', () => {
    const etat = partie()
    etat.argent = 10
    expect(poserDecoration(etat, 'banc', 2, 2)).toEqual([])
    expect(decorationsPosees(etat)).toHaveLength(0)
  })

  it('on la déplace et on la retourne gratuitement, on la range dans le stock, puis on la repose gratuitement', () => {
    const etat = partie()
    poserDecoration(etat, 'banc', 2, 2)
    const n = decorationsPosees(etat)[0].n
    const argent = etat.argent
    deplacerDecoration(etat, n, 4, 2, true)
    expect(decorationsPosees(etat)[0]).toMatchObject({ x: 4, y: 2, miroir: true })
    rangerDecoration(etat, n)
    expect(decorationsPosees(etat)).toHaveLength(0)
    expect(stockDecoration(etat, 'banc')).toBe(1)
    poserDecoration(etat, 'banc', 2, 2)
    expect(etat.argent).toBe(argent)
    expect(stockDecoration(etat, 'banc')).toBe(0)
    // deux décorations n'ont jamais le même numéro
    poserDecoration(etat, 'banc', 3, 3)
    const numeros = decorationsPosees(etat).map((d) => d.n)
    expect(new Set(numeros).size).toBe(numeros.length)
  })

  it('« Tout ranger » les met dans le stock, « Annuler » les remet', () => {
    const etat = partie()
    poserDecoration(etat, 'sapin', 2, 2)
    commencerReorganisation(etat)
    expect(decorationsPosees(etat)).toHaveLength(0)
    expect(stockDecoration(etat, 'sapin')).toBe(1)
    annulerReorganisation(etat)
    expect(decorationsPosees(etat)).toHaveLength(1)
    expect(stockDecoration(etat, 'sapin')).toBe(0)
  })
})
