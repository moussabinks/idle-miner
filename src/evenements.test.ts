import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine, type Aleatoire } from './jeu/aleatoire'
import { LARGEUR_MINE } from './jeu/donnees'
import { casserBloc, creerPartie, positionFront, vendre, type EtatJeu } from './jeu/mineur'
import { evenementsEntre } from './evenements'

const toujours = (valeur: number): Aleatoire => () => valeur

// Une partie avec le mineur au front de taille, devant une couche de `bloc`.
function auFront(bloc: 'pierre' | 'diamant'): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(3))
  etat.coucheActuelle = Array(LARGEUR_MINE).fill(bloc)
  etat.position = positionFront(etat)
  etat.cible = etat.position
  return etat
}

describe('événements pour les sons et les animations', () => {
  it('un bloc de pierre cassé', () => {
    const avant = auFront('pierre')
    const apres = structuredClone(avant)
    casserBloc(apres, toujours(0.5))
    expect(evenementsEntre(avant, apres)).toEqual([{ type: 'casse', bloc: 'pierre', colonne: 0 }])
  })

  it('un diamant trouvé', () => {
    const avant = auFront('diamant')
    const apres = structuredClone(avant)
    casserBloc(apres, toujours(0.5))
    expect(evenementsEntre(avant, apres)).toContainEqual({ type: 'rare', bloc: 'diamant', nombre: 1, colonne: 0 })
  })

  it('une vente au marché', () => {
    const avant = creerPartie(aleatoireAvecGraine(3))
    avant.inventaire = { fer: 2 }
    const apres = structuredClone(avant)
    vendre(apres)
    expect(evenementsEntre(avant, apres)).toEqual([{ type: 'vente', montant: 24 }])
  })

  it('l’ascenseur qui arrive', () => {
    const avant = creerPartie(aleatoireAvecGraine(3))
    avant.ascenseur.niveau = 1
    avant.ascenseur.position = 0.5
    avant.ascenseur.cible = 0
    const apres = structuredClone(avant)
    apres.ascenseur.position = 0
    expect(evenementsEntre(avant, apres)).toEqual([{ type: 'ding' }])
  })
})
