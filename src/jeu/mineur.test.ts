import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { CLICS_MAINS_NUES, PIOCHES } from './donnees'
import {
  acheterPioche,
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
  aVendreDuCoffre,
  reglerGarder,
  reparer,
  secondesChargementAscenseur,
  secondesTrajetMineur,
  secondesVidageAscenseur,
  vendreCoffre,
  vendreMinerai,
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
  it('au niveau 1, sort déjà un peu de blocs toute seule (25/10 : 0,2 bloc par seconde)', () => {
    const etat = partie()
    avancerMine(etat, 50, aleatoireAvecGraine(2))
    expect(nbDansCoffre(etat)).toBe(10)
  })

  it('sort quelques blocs par seconde dans le coffre, et s’arrête quand il est plein', () => {
    const etat = partie()
    etat.niveauMine = 2
    avancerMine(etat, 40, aleatoireAvecGraine(2)) // 0,3 bloc par seconde au niveau 2
    expect(nbDansCoffre(etat)).toBe(12)
    expect(etat.stats.blocsMine).toBe(12)
    avancerMine(etat, 10_000, aleatoireAvecGraine(2))
    expect(nbDansCoffre(etat)).toBe(100)
    expect(etat.stats.tempsDeJeu).toBe(10_040)
  })
})

describe('vendre le coffre de la mine (25/10 : plus de sac ni de marché à pied)', () => {
  it('« Tout vendre » vend tout le coffre au prix du marché', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 2, charbon: 3, pierre: 10 }
    expect(vendreCoffre(etat)).toEqual(['💰 Vente : +49 $']) // 2 × 12 + 3 × 5 + 10 × 1
    expect(etat.coffre.contenu).toEqual({})
    expect(etat.argent).toBe(49)
    expect(etat.stats.argentGagne).toBe(49)
    // Un coffre vide : rien à vendre.
    expect(vendreCoffre(etat)).toEqual([])
  })

  it('on peut ne vendre qu’une partie du coffre', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 30, fer: 5 }
    vendreCoffre(etat, { fer: 2, pierre: 100 }) // on ne vend pas plus qu'il n'y en a
    expect(etat.coffre.contenu).toEqual({ fer: 3 })
    expect(etat.argent).toBe(2 * 12 + 30)
  })

  it('« Tout vendre » respecte les « 📌 Garder N »', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 8, pierre: 10 }
    reglerGarder(etat, 'fer', 20)
    reglerGarder(etat, 'pierre', 4)
    expect(aVendreDuCoffre(etat)).toEqual({ pierre: 6 }) // 8 fer < 20 : tout reste ; pierre : 10 − 4
    vendreCoffre(etat)
    expect(etat.coffre.contenu).toEqual({ fer: 8, pierre: 4 })
    expect(etat.argent).toBe(6)
    // Le bouton d'une ligne vend tout ce minerai, même ce qu'on garde.
    vendreMinerai(etat, 'fer')
    expect(etat.coffre.contenu).toEqual({ pierre: 4 })
    expect(etat.argent).toBe(6 + 8 * 12)
    // Garder 0 : on n'en garde plus.
    reglerGarder(etat, 'pierre', 0)
    expect(etat.coffre.garder).toEqual({ fer: 20 })
    expect(aVendreDuCoffre(etat)).toEqual({ pierre: 4 })
  })

  it('on paie avec les minerais du coffre de la mine', () => {
    const etat = partie()
    etat.argent = 10
    etat.coffre.contenu = { fer: 7 }
    expect(disponible(etat, 'fer')).toBe(7)
    expect(peutPayer(etat, { argent: 10, materiaux: { fer: 8 } })).toBe(false)
    payer(etat, { argent: 10, materiaux: { fer: 6 } })
    expect(etat.coffre.contenu).toEqual({ fer: 1 })
    expect(etat.argent).toBe(0)
  })
})

describe('les améliorations de la mine', () => {
  it('descendre au niveau 2 : 800 $ et 40 fer, et la redstone arrive', () => {
    const etat = partie()
    etat.argent = 800
    etat.coffre.contenu = { fer: 40 }
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(3))[0]).toContain('niveau 2')
    expect(etat.niveauMine).toBe(2)
    expect(etat.argent).toBe(0)
    expect(etat.coffre.contenu).toEqual({})
    expect(descendreNiveauMine(etat, aleatoireAvecGraine(3))).toEqual([]) // pas de quoi payer le niveau 3
  })

  it('le coffre s’agrandit, jusqu’au palier de la mine (25/10)', () => {
    const etat = partie()
    etat.argent = 400
    etat.coffre.contenu = { pierre: 80 }
    // Au palier 1, le coffre reste au niveau 1.
    expect(agrandirCoffre(etat)).toEqual([])
    etat.niveauMine = 2
    agrandirCoffre(etat)
    expect(capaciteCoffre(etat)).toBe(300)
    expect(etat.argent).toBe(200)
    expect(etat.coffre.contenu).toEqual({ pierre: 40 })
  })

  it('l’ascenseur raccourcit les trajets des mineurs', () => {
    const etat = partie()
    // (30/10) la mine a son ascenseur dès le début
    expect(etat.ascenseur.niveau).toBe(1)
    expect(secondesTrajetMineur(etat)).toBe(6)
    etat.argent = 700
    etat.coffre.contenu = { fer: 30 }
    expect(ameliorerAscenseur(etat)).toEqual([]) // (25/10) il faut le palier 2 de la mine
    etat.niveauMine = 2
    ameliorerAscenseur(etat)
    expect(etat.ascenseur.niveau).toBe(2)
    expect(secondesTrajetMineur(etat)).toBe(4.5)
    // (23/10) la caisse se charge et se vide plus vite à chaque niveau
    expect(secondesChargementAscenseur(etat)).toBeLessThan(1)
    expect(secondesVidageAscenseur(etat)).toBeLessThan(2)
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
    expect(acheterPioche(etat, 1)).toEqual([]) // (25/10) la pioche en fer attend le palier 2 de la mine
    etat.niveauMine = 3
    expect(acheterPioche(etat, 2)).toEqual([]) // pas avant la pioche en fer
    acheterPioche(etat, 1)
    expect(etat.niveauPioche).toBe(1)
    expect(etat.meilleure).toBe(1)
    equiper(etat, 0)
    expect(etat.niveauPioche).toBe(0)
  })
})
