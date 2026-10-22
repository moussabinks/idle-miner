import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { CLICS_MAINS_NUES, PIOCHES } from './donnees'
import {
  acheterPioche,
  acheterSac,
  agrandirCoffre,
  ameliorerAscenseur,
  avancerMine,
  capaciteCoffre,
  cliquerMine,
  coutReparation,
  descendreNiveauMine,
  disponible,
  equiper,
  estCassee,
  nbDansCoffre,
  payer,
  peutPayer,
  prendreDuCoffre,
  reglerVente,
  reparer,
  secondesTrajetMineur,
  tailleSac,
  vendre,
  vendreLot,
  type EtatJeu,
} from './mineur'

// Un faux hasard qui renvoie toujours la même valeur (0 : « oui » à toutes les chances).
const toujours = (valeur: number) => () => valeur

function partie(): EtatJeu {
  return partieDeTest(aleatoireAvecGraine(1))
}

describe('une nouvelle partie', () => {
  it('commence au niveau 1 de la mine, avec une pioche en pierre et un coffre vide', () => {
    const etat = partie()
    expect(etat.niveauMine).toBe(1)
    expect(etat.argent).toBe(0)
    expect(etat.niveauPioche).toBe(0)
    expect(PIOCHES[0].nom).toBe('Pierre')
    expect(nbDansCoffre(etat)).toBe(0)
    expect(capaciteCoffre(etat)).toBe(100)
    expect(['pierre', 'charbon', 'fer']).toContain(etat.prochainBloc)
  })
})

describe('cliquer sur le bloc de la mine', () => {
  it('chaque clic casse un bloc, qui va dans le coffre, et use la pioche', () => {
    const etat = partie()
    etat.prochainBloc = 'fer'
    cliquerMine(etat, toujours(0.99)) // 0,99 : pas de doublement
    expect(etat.coffre.contenu).toEqual({ fer: 1 })
    expect(etat.stats.blocsCasses).toBe(1)
    expect(etat.pioches[0]).toBe(1)
  })

  it('une bonne pioche peut doubler un minerai (jamais la pierre)', () => {
    const etat = partie()
    etat.prochainBloc = 'fer'
    cliquerMine(etat, toujours(0)) // 0 < 10 % : doublé
    expect(etat.coffre.contenu).toEqual({ fer: 2 })
    etat.prochainBloc = 'pierre'
    cliquerMine(etat, toujours(0))
    expect(etat.coffre.contenu.pierre).toBe(1)
  })

  it('le bloc suivant est tiré parmi les blocs du niveau de la mine', () => {
    const etat = partie()
    const vus = new Set<string>()
    const hasard = aleatoireAvecGraine(7)
    for (let i = 0; i < 300; i++) {
      vus.add(etat.prochainBloc)
      cliquerMine(etat, hasard)
      etat.coffre.contenu = {}
    }
    expect([...vus].sort()).toEqual(['charbon', 'fer', 'pierre'])
  })

  it(`pioche cassée : il faut ${CLICS_MAINS_NUES} clics par bloc, sans doublement`, () => {
    const etat = partie()
    etat.pioches[0] = PIOCHES[0].durabilite - 1
    etat.prochainBloc = 'fer'
    const messages = cliquerMine(etat, toujours(0.99))
    expect(estCassee(etat)).toBe(true)
    expect(messages[0]).toContain('cassée')
    etat.prochainBloc = 'fer'
    cliquerMine(etat, toujours(0))
    expect(etat.coffre.contenu).toEqual({ fer: 1 }) // le 1er clic ne casse rien
    cliquerMine(etat, toujours(0))
    expect(etat.coffre.contenu).toEqual({ fer: 2 }) // le 2e casse le bloc, sans doublement
  })

  it('coffre plein : on ne peut plus casser', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 100 }
    expect(cliquerMine(etat, toujours(0.5))[0]).toContain('plein')
    expect(etat.stats.blocsCasses).toBe(0)
  })
})

describe('la mine toute seule', () => {
  it('au niveau 1, ne sort rien toute seule (27/10) : on creuse à la main', () => {
    const etat = partie()
    avancerMine(etat, 50, aleatoireAvecGraine(2))
    expect(nbDansCoffre(etat)).toBe(0)
  })

  it('sort quelques blocs par seconde dans le coffre, et s’arrête quand il est plein', () => {
    const etat = partie()
    etat.niveauMine = 2
    avancerMine(etat, 40, aleatoireAvecGraine(2)) // 0,25 bloc par seconde au niveau 2
    expect(nbDansCoffre(etat)).toBe(10)
    expect(etat.stats.blocsMine).toBe(10)
    avancerMine(etat, 10_000, aleatoireAvecGraine(2))
    expect(nbDansCoffre(etat)).toBe(100)
    expect(etat.stats.tempsDeJeu).toBe(10_040)
  })
})

describe('le coffre, le sac et le marché', () => {
  it('on prend dans le coffre les objets les plus chers d’abord, tant que le sac a de la place', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 30, fer: 5 }
    prendreDuCoffre(etat)
    expect(etat.inventaire).toEqual({ fer: 5, pierre: 27 }) // le sac fait 32 places
    expect(etat.coffre.contenu).toEqual({ pierre: 3 })
    expect(prendreDuCoffre(etat)[0]).toContain('plein')
  })

  it('on peut ne prendre qu’une partie du coffre', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 30, fer: 5 }
    prendreDuCoffre(etat, { fer: 2 })
    expect(etat.inventaire).toEqual({ fer: 2 })
    expect(etat.coffre.contenu).toEqual({ pierre: 30, fer: 3 })
  })

  it('le marché vend tout le sac, sauf les objets gardés', () => {
    const etat = partie()
    etat.inventaire = { fer: 2, charbon: 3 }
    reglerVente(etat, 'charbon', false)
    expect(vendre(etat)).toEqual(['💰 Vente : +24 $'])
    expect(etat.inventaire).toEqual({ charbon: 3 })
    vendreLot(etat, { charbon: 1 })
    expect(etat.argent).toBe(29)
    expect(etat.stats.argentGagne).toBe(29)
  })

  it('on paie avec les minerais du sac, puis ceux du coffre', () => {
    const etat = partie()
    etat.argent = 10
    etat.inventaire = { fer: 2 }
    etat.coffre.contenu = { fer: 5 }
    expect(disponible(etat, 'fer')).toBe(7)
    expect(peutPayer(etat, { argent: 10, materiaux: { fer: 8 } })).toBe(false)
    payer(etat, { argent: 10, materiaux: { fer: 6 } })
    expect(etat.inventaire).toEqual({})
    expect(etat.coffre.contenu).toEqual({ fer: 1 })
    expect(etat.argent).toBe(0)
  })

  it('un plus grand sac au bazar', () => {
    const etat = partie()
    etat.argent = 150
    acheterSac(etat)
    expect(tailleSac(etat)).toBe(64)
    expect(etat.argent).toBe(0)
  })
})

describe('les améliorations de la mine', () => {
  it('descendre au niveau 2 : 900 $ et 45 fer, et la redstone arrive', () => {
    const etat = partie()
    etat.argent = 900
    etat.coffre.contenu = { fer: 45 }
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(3))[0]).toContain('niveau 2')
    expect(etat.niveauMine).toBe(2)
    expect(etat.argent).toBe(0)
    expect(etat.coffre.contenu).toEqual({})
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(3))).toEqual([]) // pas de quoi payer le niveau 3
  })

  it('le coffre s’agrandit', () => {
    const etat = partie()
    etat.argent = 400
    etat.inventaire = { pierre: 80 }
    agrandirCoffre(etat)
    expect(capaciteCoffre(etat)).toBe(250)
  })

  it('l’ascenseur raccourcit les trajets des mineurs', () => {
    const etat = partie()
    // (30/10) la mine a son ascenseur dès le début
    expect(etat.ascenseur.niveau).toBe(1)
    expect(secondesTrajetMineur(etat)).toBe(6)
    etat.argent = 1500
    etat.inventaire = { fer: 50, redstone: 10 }
    ameliorerAscenseur(etat)
    expect(etat.ascenseur.niveau).toBe(2)
    expect(secondesTrajetMineur(etat)).toBe(4)
  })
})

describe('les pioches au forgeron', () => {
  it('la réparation coûte une part du prix, selon l’usure', () => {
    const etat = partie()
    expect(coutReparation(etat)).toBeNull() // neuve
    etat.pioches[0] = 75 // à moitié usée
    expect(coutReparation(etat)).toEqual({ argent: 3, materiaux: { pierre: 5 } })
    etat.pioches[0] = PIOCHES[0].durabilite // cassée
    expect(coutReparation(etat)).toEqual({ argent: 5, materiaux: { pierre: 10 } })
    etat.argent = 5
    etat.coffre.contenu = { pierre: 10 }
    reparer(etat)
    expect(estCassee(etat)).toBe(false)
    expect(etat.argent).toBe(0)
  })

  it('on débloque la pioche suivante, et on peut reprendre l’ancienne', () => {
    const etat = partie()
    etat.argent = 500
    etat.coffre.contenu = { fer: 40 }
    expect(acheterPioche(etat, 2)).toEqual([]) // pas avant la pioche en fer
    acheterPioche(etat, 1)
    expect(etat.niveauPioche).toBe(1)
    expect(etat.meilleure).toBe(1)
    equiper(etat, 0)
    expect(etat.niveauPioche).toBe(0)
  })
})
