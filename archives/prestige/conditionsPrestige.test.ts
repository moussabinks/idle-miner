import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { conditionsPrestige, peutPasserPrestige } from './conditionsPrestige'
import { embaucher } from './employes'
import { creerPartie, type EtatJeu } from './mineur'

function partie(niveauPrestige: number): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1), niveauPrestige)
  etat.argent = 1_000_000
  return etat
}

// Tout ce qu'on peut faire au prestige 0 : la bedrock, l'ascenseur niveau 2 et les enchantements I.
function toutFaireAuPrestige0(etat: EtatJeu): void {
  etat.victoire = true
  etat.ascenseur.niveau = 2
  etat.enchantements = { efficacite: 1, fortune: 1, solidite: 1 }
  etat.niveauSac = 2 // 128 places
}

describe('conditions pour passer prestige', () => {
  it('au prestige 0 : la bedrock, l’ascenseur au niveau 2, le sac de 256 places et les enchantements au niveau I', () => {
    const etat = partie(0)
    expect(conditionsPrestige(etat).map((c) => c.id)).toEqual(['bedrock', 'ascenseur', 'sac', 'enchantement-efficacite', 'enchantement-fortune', 'enchantement-solidite'])
    expect(peutPasserPrestige(etat)).toBe(false)
    toutFaireAuPrestige0(etat)
    expect(peutPasserPrestige(etat)).toBe(true)
    etat.enchantements.fortune = 0
    expect(peutPasserPrestige(etat)).toBe(false)
    expect(conditionsPrestige(etat).find((c) => c.id === 'enchantement-fortune')).toMatchObject({ faite: false, avance: '0/1' })
  })

  it('la bedrock ne suffit pas : il faut aussi tout améliorer', () => {
    const etat = partie(0)
    etat.victoire = true
    expect(peutPasserPrestige(etat)).toBe(false)
  })

  it('au prestige 1 : l’ascenseur niveau 3, et activer la foreuse suffit (sac et enchantements comme au prestige 0)', () => {
    const etat = partie(1)
    toutFaireAuPrestige0(etat)
    etat.ascenseur.niveau = 3
    expect(peutPasserPrestige(etat)).toBe(false)
    etat.foreuse.active = true
    expect(peutPasserPrestige(etat)).toBe(true)
  })

  it('au prestige 2 : sac de 256, les trois enchantements II, forage et chariot niveau 2', () => {
    const etat = partie(2)
    toutFaireAuPrestige0(etat)
    etat.ascenseur.niveau = 4
    etat.foreuse.active = true
    const manque = () => conditionsPrestige(etat).filter((c) => !c.faite).map((c) => c.id)
    expect(manque()).toEqual(['sac', 'enchantement-efficacite', 'enchantement-fortune', 'enchantement-solidite', 'forage', 'chariot'])
    etat.niveauSac = 3
    etat.enchantements = { efficacite: 2, fortune: 2, solidite: 2 }
    etat.foreuse.niveauVitesse = 1
    etat.foreuse.niveauChariot = 1
    expect(peutPasserPrestige(etat)).toBe(true)
  })

  it('au prestige 2, l’équipement de chaque mineur embauché ; au prestige 4, le recruteur', () => {
    const etat = partie(4)
    toutFaireAuPrestige0(etat)
    etat.ascenseur.niveau = 6
    etat.niveauSac = 6
    etat.enchantements = { efficacite: 5, fortune: 3, solidite: 3 }
    etat.foreuse = { ...etat.foreuse, active: true, niveauVitesse: 4, niveauChariot: 4 }
    expect(peutPasserPrestige(etat)).toBe(false) // pas de recruteur
    etat.recruteur = 1
    expect(peutPasserPrestige(etat)).toBe(true) // aucun mineur : rien à équiper
    embaucher(etat, aleatoireAvecGraine(2))
    expect(peutPasserPrestige(etat)).toBe(false)
    etat.employes[0].niveau = 4 // pioche en netherite au prestige 4
    expect(peutPasserPrestige(etat)).toBe(true)
  })
})
