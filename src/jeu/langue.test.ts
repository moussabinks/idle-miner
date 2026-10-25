import { afterEach, describe, expect, it } from 'vitest'
import { changerLangue, langue, nomEmploye, nombre, pluriel, t } from './langue'
import { TRADUCTIONS_EN } from './traductions/en'

// Une traduction ajoutée juste pour ces tests (en.ts peut encore être presque vide).
const CLE_DE_TEST = '💰 Vente de test : +{gain} $ pour {nom}'

afterEach(() => {
  changerLangue('fr')
  delete TRADUCTIONS_EN[CLE_DE_TEST]
})

describe('les langues', () => {
  it('le jeu est en français au départ', () => {
    expect(langue()).toBe('fr')
  })

  it('en français, t() rend le texte tel quel, avec ses {trous} remplis', () => {
    expect(t('Vends le coffre de la mine')).toBe('Vends le coffre de la mine')
    expect(t('💰 Vente : +{gain} $', { gain: 42 })).toBe('💰 Vente : +42 $')
    // un {trou} sans valeur reste tel quel
    expect(t('Niveau {n} : {choses}', { n: 3 })).toBe('Niveau 3 : {choses}')
  })

  it('en anglais, t() rend la traduction, avec ses {trous} remplis', () => {
    TRADUCTIONS_EN[CLE_DE_TEST] = '💰 {nom} sold for +{gain} $'
    changerLangue('en')
    expect(langue()).toBe('en')
    expect(t(CLE_DE_TEST, { gain: nombre(1250), nom: 'Noisette' })).toBe('💰 Noisette sold for +1,250 $')
  })

  it('en anglais, un texte sans traduction reste en français (rien ne casse)', () => {
    changerLangue('en')
    expect(t('Un texte qui n’a pas de traduction {n}', { n: 7 })).toBe('Un texte qui n’a pas de traduction 7')
  })

  it('les messages du jeu passent par t() : ils restent lisibles dans les deux langues', () => {
    changerLangue('en')
    const texte = t('💰 Vente : +{gain} $', { gain: nombre(1500) })
    // Traduit ou pas encore, le nombre est écrit à l'anglaise.
    expect(texte).toContain('1,500')
  })

  it('nombre() écrit les nombres à la façon de la langue', () => {
    expect(nombre(1250).replace(/\s/g, ' ')).toBe('1 250')
    expect(nombre(1.5, 1)).toBe('1,5')
    expect(nombre(1.5)).toBe('2')
    changerLangue('en')
    expect(nombre(1250)).toBe('1,250')
    expect(nombre(1.25, 2)).toBe('1.25')
  })

  it('pluriel() choisit le singulier ou le pluriel', () => {
    expect(pluriel(1, 'mineur', 'mineurs')).toBe('mineur')
    expect(pluriel(0, 'mineur', 'mineurs')).toBe('mineur')
    expect(pluriel(3, 'mineur', 'mineurs')).toBe('mineurs')
  })

  it('chaque traduction anglaise garde les mêmes {trous} que le texte français', () => {
    const trous = (texte: string) => [...texte.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const [francais, anglais] of Object.entries(TRADUCTIONS_EN)) {
      expect(trous(anglais), `traduction de « ${francais} »`).toEqual(trous(francais))
    }
  })
})

describe('(25/10) les prénoms des employés en anglais', () => {
  it('en anglais, un prénom français devient un prénom anglais de la génération Z (au même rang)', () => {
    changerLangue('en')
    expect(nomEmploye('Raphaël')).toBe('Liam')
    expect(nomEmploye('Noah 22')).toBe('Emma 22')
    expect(nomEmploye('la mine')).toBe('la mine')
    expect(t('Licencier {nom} ?', { nom: 'Moussa' })).toContain('Olivia')
  })

  it('en français, il ne change pas', () => {
    expect(nomEmploye('Raphaël')).toBe('Raphaël')
  })
})
