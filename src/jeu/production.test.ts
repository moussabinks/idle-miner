import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol } from './batiments'
import { NIVEAUX_ASCENSEUR } from './donnees'
import { embaucher, embaucherPousseur } from './employes'
import { capaciteCoffre, debitMine } from './mineur'
import { analyseAscenseur, analyseWagonnet, production } from './production'
import { creerTrajet } from './wagonnet'

describe('la production de la mine', () => {
  it('compte la mine toute seule, puis chaque mineur', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.niveauMine = 2 // (au niveau 1, la mine ne sort rien toute seule)
    const seule = production(etat)
    expect(seule.mine).toBeCloseTo(debitMine(etat))
    expect(seule.mineurs).toHaveLength(0)
    expect(seule.total).toBeCloseTo(seule.mine)
    expect(seule.dollarsParMinute).toBeGreaterThan(0)

    etat.argent = 1_000_000
    embaucher(etat, aleatoireAvecGraine(2))
    const avecMineur = production(etat)
    expect(avecMineur.mineurs).toHaveLength(1)
    expect(avecMineur.totalMineurs).toBeGreaterThan(0)
    expect(avecMineur.total).toBeGreaterThan(seule.total)
  })

  it("un mineur qui attend son salaire ne compte pas, et tout s'arrête quand le coffre est plein", () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 1_000_000
    embaucher(etat, aleatoireAvecGraine(2))
    etat.employes[0].etape = 'attend'
    expect(production(etat).totalMineurs).toBe(0)
    etat.employes[0].etape = 'creuse'
    etat.coffre.contenu = { pierre: capaciteCoffre(etat) }
    const pleine = production(etat)
    expect(pleine.arretee).toBe(true)
    expect(pleine.total).toBe(0)
  })
})

describe('les goulots : ascenseur et wagonnet', () => {
  it("sans ascenseur, les mineurs perdent beaucoup de temps à l'échelle : l'améliorer rapporte", () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 1_000_000
    etat.ascenseur.niveau = 0 // (une vieille partie, à l'échelle)
    embaucher(etat, aleatoireAvecGraine(2))
    embaucher(etat, aleatoireAvecGraine(3))
    const lent = analyseAscenseur(etat)
    expect(lent.tropLent).toBe(true)
    expect(lent.gainProchainNiveau).toBeGreaterThan(0)
    etat.ascenseur.niveau = NIVEAUX_ASCENSEUR.length // niveau max
    const rapide = analyseAscenseur(etat)
    expect(rapide.partDansLePuits).toBeLessThan(lent.partDansLePuits)
    expect(rapide.gainProchainNiveau).toBeNull()
    expect(rapide.tropLent).toBe(false)
  })

  it('le wagonnet : personne pour le pousser, puis un débit qui dépend de sa taille', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    expect(analyseWagonnet(etat)).toBeNull() // pas de trajet
    etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false })
    etat.inventaire = { fer: 300 }
    for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
    creerTrajet(etat, 'mine-marche')
    const seul = analyseWagonnet(etat)
    expect(seul).toMatchObject({ moteur: 'personne', debitMax: 0 })
    expect(seul?.surplus).toBeCloseTo(seul?.apport ?? -1)
    etat.argent = 1_000_000
    etat.village.batiments.push({ id: 'employes', x: 19, y: 31, miroir: false })
    embaucherPousseur(etat, aleatoireAvecGraine(3), 'mine-marche')
    const pousse = analyseWagonnet(etat)
    expect(pousse?.moteur).toBe('pousseur')
    expect(pousse?.debitMax).toBeGreaterThan(0)
    etat.niveauWagonnets += 1
    expect(analyseWagonnet(etat)?.debitMax).toBeGreaterThan(pousse?.debitMax ?? Infinity)
  })
})
