import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { SECONDES_PAR_PAIE } from './donnees'
import { embaucher, salaireEmploye } from './employes'
import { valeurMoyenneBloc } from './mine'
import { creerPartie } from './mineur'
import { revenuBrutEmploye, revenuParSeconde } from './revenu'

describe('revenu par seconde', () => {
  it('la mine toute seule : son débit × la valeur moyenne d’un bloc', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    // (25/10) Au niveau 1, la mine sort déjà 0,2 bloc par seconde toute seule.
    expect(revenuParSeconde(etat).mine).toBeCloseTo(0.2 * valeurMoyenneBloc(1))
    etat.niveauMine = 2
    expect(revenuParSeconde(etat).mine).toBeCloseTo(0.3 * valeurMoyenneBloc(2))
    etat.coffre.contenu = { pierre: 100 } // coffre plein : la mine s'arrête
    expect(revenuParSeconde(etat).total).toBe(0)
  })

  it('un mineur rapporte plus que son salaire', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.argent = 500
    embaucher(etat, aleatoireAvecGraine(2))
    const mineur = etat.employes[0]
    expect(revenuBrutEmploye(etat, mineur) * SECONDES_PAR_PAIE).toBeGreaterThan(salaireEmploye(mineur))
    expect(revenuParSeconde(etat).mineurs).toBeGreaterThan(0)
  })

  it('un pousseur ne creuse pas', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.argent = 500
    embaucher(etat, aleatoireAvecGraine(2))
    etat.employes[0].role = 'pousseur'
    expect(revenuBrutEmploye(etat, etat.employes[0])).toBe(0)
  })
})
