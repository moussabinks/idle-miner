import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { DUREE_MIN_TRAJET_EMPLOYE, NIVEAUX_EMPLOYE, PRIX_EMBAUCHE, SECONDES_VENTE_EMPLOYE } from './donnees'
import { activiteEmploye, ameliorerEmploye, avancerEmployes, embaucher, maxEmployes, nbDansSacEmploye, prixEmbauche, tailleSacEmploye } from './employes'
import { creerPartie, prestige, type EtatJeu } from './mineur'
import { choisirTalent } from './talents'
import { avancerTemps } from './temps'

// Un joueur au village, au prestige donné, avec de l'argent.
function partie(niveauPrestige: number, argent = 1_000_000): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1), niveauPrestige)
  etat.argent = argent
  return etat
}

describe('mineurs employés', () => {
  it('sont bloqués avant le prestige 2, puis 2 au prestige 2 et 1 de plus par prestige', () => {
    expect(maxEmployes(partie(1))).toBe(0)
    expect(embaucher(partie(1))).toEqual([])
    expect(maxEmployes(partie(2))).toBe(2)
    expect(maxEmployes(partie(4))).toBe(4)
    expect(maxEmployes(partie(20))).toBe(6)
  })

  it('s’embauchent au village, de plus en plus cher', () => {
    const etat = partie(2)
    embaucher(etat)
    embaucher(etat)
    expect(etat.employes).toHaveLength(2)
    expect(etat.argent).toBe(1_000_000 - PRIX_EMBAUCHE[0] - PRIX_EMBAUCHE[1])
    expect(prixEmbauche(etat)).toBeNull() // déjà 2 au prestige 2
    expect(embaucher(etat)).toEqual([])
  })

  it('creusent, remontent vendre et rapportent de l’argent (moins leur salaire)', () => {
    const etat = partie(2, PRIX_EMBAUCHE[0])
    embaucher(etat)
    expect(etat.argent).toBe(0)
    avancerTemps(etat, 600, aleatoireAvecGraine(2)) // 10 minutes
    const mineur = etat.employes[0]
    expect(mineur.blocsCasses).toBeGreaterThan(100)
    expect(mineur.profondeur).toBeGreaterThan(2)
    expect(etat.argent).toBeGreaterThan(0)
    expect(etat.argent).toBe(mineur.gagne)
    expect(nbDansSacEmploye(mineur)).toBeLessThanOrEqual(tailleSacEmploye(etat, mineur))
  })

  it('vont plus vite avec l’ascenseur qu’à l’échelle', () => {
    const aLechelle = partie(2)
    embaucher(aLechelle)
    // Assez profond pour que le trajet dure plus que le minimum, même en ascenseur.
    aLechelle.employes[0].niveau = 2
    aLechelle.employes[0].profondeur = 80
    const enAscenseur = structuredClone(aLechelle)
    enAscenseur.ascenseur.niveau = 4
    avancerTemps(aLechelle, 1800, aleatoireAvecGraine(3))
    avancerTemps(enAscenseur, 1800, aleatoireAvecGraine(3))
    expect(enAscenseur.employes[0].blocsCasses).toBeGreaterThan(aLechelle.employes[0].blocsCasses)
  })

  it('prennent le temps de remonter, de vendre puis de redescendre', () => {
    const etat = partie(2, PRIX_EMBAUCHE[0])
    embaucher(etat)
    const mineur = etat.employes[0]
    // Sac plein, au fond de sa galerie à -3 m (tout près de la surface).
    mineur.profondeur = 3
    mineur.etape = 'creuse'
    mineur.sac = { pierre: tailleSacEmploye(etat, mineur) }
    avancerEmployes(etat, 0.01, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('monte')
    // Même tout près, le trajet dure au moins quelques secondes...
    avancerEmployes(etat, DUREE_MIN_TRAJET_EMPLOYE - 0.5, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('monte')
    expect(etat.argent).toBe(0)
    // ... puis il vend au marché, ce qui prend aussi du temps.
    avancerEmployes(etat, 1, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('vend')
    expect(activiteEmploye(etat, mineur)).toContain('vend')
    expect(etat.argent).toBe(0)
    avancerEmployes(etat, SECONDES_VENTE_EMPLOYE, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('descend')
    expect(etat.argent).toBeGreaterThan(0)
    expect(mineur.sac).toEqual({})
  })

  it('ont un plus grand sac à chaque amélioration', () => {
    const etat = partie(2)
    embaucher(etat)
    const mineur = etat.employes[0]
    const tailles = [tailleSacEmploye(etat, mineur)]
    while (ameliorerEmploye(etat, 0).length > 0) tailles.push(tailleSacEmploye(etat, mineur))
    expect(tailles).toEqual(NIVEAUX_EMPLOYE.map((n) => n.sac))
    expect(tailles[tailles.length - 1]).toBeGreaterThan(tailles[0])
  })

  it('ne descendent pas plus bas que leur pioche, et s’améliorent', () => {
    const etat = partie(2)
    embaucher(etat)
    avancerTemps(etat, 4 * 3600, aleatoireAvecGraine(4))
    expect(etat.employes[0].profondeur).toBe(NIVEAUX_EMPLOYE[0].profMax)
    ameliorerEmploye(etat, 0)
    expect(etat.employes[0].niveau).toBe(1)
  })

  it('restent après un prestige avec leur pioche, mais repartent de la surface', () => {
    const etat = partie(2)
    embaucher(etat)
    ameliorerEmploye(etat, 0)
    avancerTemps(etat, 1200, aleatoireAvecGraine(6))
    expect(etat.employes[0].profondeur).toBeGreaterThan(2)
    const suite = prestige(etat, aleatoireAvecGraine(5))
    expect(suite.employes).toHaveLength(1)
    expect(suite.employes[0]).toMatchObject({ niveau: 1, profondeur: 2, sac: {}, etape: 'descend' })
  })

  it('les talents du patron', () => {
    const etat = partie(4)
    choisirTalent(etat, 'contremaitre')
    choisirTalent(etat, 'grandsSacs')
    choisirTalent(etat, 'salaireReduit')
    choisirTalent(etat, 'recrue')
    expect(maxEmployes(etat)).toBe(5)
    embaucher(etat)
    expect(tailleSacEmploye(etat, etat.employes[0])).toBe(2 * NIVEAUX_EMPLOYE[0].sac)
  })
})
