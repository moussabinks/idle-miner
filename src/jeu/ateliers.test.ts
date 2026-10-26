import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  accepte,
  ameliorerAtelier,
  apporterAuAtelier,
  avancerFonderie,
  avancerJoaillerie,
  besoinCharbonFonderie,
  fonderieEnMarche,
  maxJoailliers,
  objetsAcceptes,
  peutAmeliorerAtelier,
  remplirFonderie,
  vendreSortie,
  vitesseFonderie,
} from './ateliers'
import { poserSol } from './batiments'
import { BLOCS, NIVEAUX_FONDERIE, PALIER_FONDERIE, PALIER_JOAILLERIE, SECONDES_PAR_CHARBON_FONDERIE } from './donnees'
import { embaucherJoaillier, peutEmbaucherJoaillier, prixEmbauche } from './employes'
import { disponible, payerMateriaux, type EtatJeu } from './mineur'
import { partieDeTest } from './partieDeTest'
import { avancerTemps } from './temps'
import { creerTrajet, objetFixe, objetsAuChoix, objetsRefuses, trajetDe, avancerWagonnets } from './wagonnet'

const hasard = () => aleatoireAvecGraine(1)

// Une partie au niveau 6 de la mine, avec la fonderie et la joaillerie posées.
function partie(): EtatJeu {
  const etat = partieDeTest(hasard())
  etat.niveauMine = 6
  etat.village.batiments.push({ id: 'fonderie', x: 18, y: 30, miroir: false })
  etat.village.batiments.push({ id: 'joaillerie', x: 26, y: 18, miroir: false })
  return etat
}

describe('ce que les ateliers acceptent (26/10)', () => {
  it('la fonderie prend le fer et l’or, la joaillerie les quatre gemmes', () => {
    expect(objetsAcceptes('fonderie')).toEqual(['fer', 'or'])
    expect(objetsAcceptes('joaillerie')).toEqual(['emeraude', 'saphir', 'rubis', 'diamant'])
    expect(accepte('fonderie', 'pierre')).toBe(false)
    expect(accepte('joaillerie', 'or')).toBe(false)
  })

  it('un lingot vaut 2 fois son minerai, un bijou 2,5 fois sa gemme', () => {
    expect(BLOCS.lingot_fer.prix).toBe(BLOCS.fer.prix * 2)
    expect(BLOCS.lingot_or.prix).toBe(BLOCS.or.prix * 2)
    for (const gemme of ['emeraude', 'saphir', 'rubis', 'diamant'] as const) {
      expect(BLOCS[`bijou_${gemme}`].prix).toBe(BLOCS[gemme].prix * 2.5)
    }
  })

  it('leurs niveaux suivent les paliers de la mine (5 à 7)', () => {
    expect(PALIER_FONDERIE[0]).toBe(5)
    expect(PALIER_JOAILLERIE[0]).toBe(6)
    expect(PALIER_FONDERIE[PALIER_FONDERIE.length - 1]).toBe(7)
    expect(PALIER_JOAILLERIE[PALIER_JOAILLERIE.length - 1]).toBe(7)
  })
})

describe('la fonderie', () => {
  it('fond le fer et l’or en lingots en brûlant du charbon', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 10, or: 2, pierre: 5, charbon: 20 }
    expect(apporterAuAtelier(etat, 'fonderie', 'pierre')).toEqual([]) // refusé
    apporterAuAtelier(etat, 'fonderie', 'fer')
    apporterAuAtelier(etat, 'fonderie', 'or')
    expect(etat.coffre.contenu).toEqual({ pierre: 5, charbon: 20 })
    expect(etat.fonderie.entree).toEqual({ fer: 10, or: 2 })
    // Sans charbon, rien ne fond : une bulle le dit.
    expect(fonderieEnMarche(etat)).toBe(false)
    expect(besoinCharbonFonderie(etat)).toBe(true)
    remplirFonderie(etat)
    expect(etat.fonderie.carburant).toBe(15 * SECONDES_PAR_CHARBON_FONDERIE) // son réservoir : 15 charbons
    expect(etat.coffre.contenu.charbon).toBe(5)
    // 0,5 lingot par seconde : en 4 s, 2 lingots (l'or d'abord, il vaut plus).
    expect(vitesseFonderie(etat)).toBe(NIVEAUX_FONDERIE[0].vitesse)
    avancerFonderie(etat, 4)
    expect(etat.fonderie.sortie).toEqual({ lingot_or: 2 })
    avancerFonderie(etat, 4)
    expect(etat.fonderie.sortie).toEqual({ lingot_or: 2, lingot_fer: 2 })
    expect(etat.fonderie.carburant).toBeCloseTo(15 * SECONDES_PAR_CHARBON_FONDERIE - 8)
    expect(vendreSortie(etat, 'fonderie')[0]).toContain(`${2 * BLOCS.lingot_or.prix + 2 * BLOCS.lingot_fer.prix}`)
    expect(etat.fonderie.sortie).toEqual({})
  })

  it('ses lingots paient les améliorations, depuis sa réserve', () => {
    const etat = partie()
    etat.fonderie.sortie = { lingot_fer: 30 }
    etat.coffre.contenu = { lingot_fer: 5 }
    expect(disponible(etat, 'lingot_fer')).toBe(35)
    payerMateriaux(etat, { lingot_fer: 20 })
    expect(etat.coffre.contenu.lingot_fer ?? 0).toBe(0)
    expect(etat.fonderie.sortie.lingot_fer).toBe(15)
  })

  it('s’améliore : plus vite, plus de places', () => {
    const etat = partie()
    etat.argent = 1_000_000
    etat.coffre.contenu = { fer: 1000, charbon: 1000, or: 1000 }
    expect(peutAmeliorerAtelier(etat, 'fonderie')).toBe(true)
    ameliorerAtelier(etat, 'fonderie')
    expect(etat.fonderie.niveau).toBe(1)
    expect(vitesseFonderie(etat)).toBe(NIVEAUX_FONDERIE[1].vitesse)
  })
})

describe('la joaillerie et ses joailliers', () => {
  it('on embauche autant de joailliers que d’établis', () => {
    const etat = partie()
    etat.argent = 1_000_000
    expect(maxJoailliers(etat)).toBe(1)
    expect(peutEmbaucherJoaillier(etat)).toBe(true)
    embaucherJoaillier(etat, hasard())
    expect(etat.employes[0]).toMatchObject({ role: 'joaillier', lieu: 'joaillerie' })
    expect(prixEmbauche(etat, 'joaillier')).toBeNull() // plus d'établi libre
  })

  it('un joaillier payé taille les gemmes en bijoux, la plus chère d’abord', () => {
    const etat = partie()
    etat.argent = 1_000_000
    embaucherJoaillier(etat, hasard())
    etat.coffre.contenu = { emeraude: 2, rubis: 1 }
    apporterAuAtelier(etat, 'joaillerie', 'emeraude')
    apporterAuAtelier(etat, 'joaillerie', 'rubis')
    // Il marche jusqu'à son établi, puis taille (10 s par bijou pour un commun).
    avancerTemps(etat, 120, hasard())
    expect(etat.joaillerie.sortie.bijou_rubis).toBe(1)
    expect(etat.joaillerie.sortie.bijou_emeraude).toBe(2)
    expect(etat.joaillerie.fabriques).toBe(3)
  })

  it('sans salaire, il quitte son établi et sa gemme retourne à l’entrée', () => {
    const etat = partie()
    etat.argent = 1_000_000
    embaucherJoaillier(etat, hasard())
    const joaillier = etat.employes[0]
    joaillier.etape = 'taille'
    joaillier.sac = { saphir: 1 }
    joaillier.tempsPaye = 0
    avancerJoaillerie(etat, 1, () => 1)
    expect(joaillier.sac).toEqual({})
    expect(etat.joaillerie.entree).toEqual({ saphir: 1 })
  })
})

describe('les wagonnets vers les ateliers (26/10)', () => {
  // Les rails de la mine à la fonderie, posée en (18, 30).
  function partieAvecRails(): EtatJeu {
    const etat = partie()
    etat.coffre.contenu = { fer: 15 }
    for (let y = 25; y <= 29; y++) poserSol(etat, 'rail', 20, y)
    return etat
  }

  it('on choisit le minerai qu’on envoie ; le reste est montré comme refusé', () => {
    const etat = partieAvecRails()
    expect(objetsAuChoix(etat, 'mine-fonderie')).toEqual(['fer', 'or'])
    expect(objetFixe('mine-fonderie')).toBe('charbon')
    expect(objetsRefuses(etat, 'mine-fonderie')).toEqual(['pierre', 'redstone', 'emeraude', 'saphir', 'rubis'])
    expect(objetsAuChoix(etat, 'mine-joaillerie')).toEqual(['emeraude', 'saphir', 'rubis'])
    expect(objetsAuChoix(etat, 'fonderie-marche')).toEqual(['lingot_fer', 'lingot_or'])
  })

  it('le wagonnet de la mine apporte le fer et le charbon à la fonderie', () => {
    const etat = partieAvecRails()
    etat.coffre.contenu = { fer: 8, charbon: 4, pierre: 10 }
    creerTrajet(etat, 'mine-fonderie')
    etat.employes.push({ nom: 'Pousseur', rarete: 'commun', niveau: 0, role: 'pousseur', trajet: 'mine-fonderie', etape: 'quai', progression: 0, sac: {}, blocsCasses: 0, tempsPaye: 600, lieu: 'puits', depuis: 'puits', forgeEnAttente: false })
    for (let i = 0; i < 400 && etat.fonderie.carburant === 0; i++) avancerWagonnets(etat, 0.25)
    expect(etat.fonderie.entree).toEqual({ fer: 8 })
    expect(etat.fonderie.carburant).toBe(4 * SECONDES_PAR_CHARBON_FONDERIE)
    expect(etat.coffre.contenu).toEqual({ pierre: 10 }) // la pierre est refusée : elle reste
    expect(trajetDe(etat, 'mine-fonderie')).not.toBeNull()
  })
})
