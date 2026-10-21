import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol } from './batiments'
import { SECONDES_PAR_REDSTONE } from './donnees'
import {
  ameliorerGenerateur,
  avancerGenerateur,
  basculerGenerateur,
  basculerPuisage,
  caseDansLeRayon,
  foreuseAlimentee,
  generateurEnMarche,
  railsAlimentes,
  rayonGenerateur,
  remplirGenerateur,
} from './generateur'
import { creerPartie, type EtatJeu } from './mineur'

// Une partie avec le marché en (28, 40), une ligne de rails de 5 cases de la mine au marché, et
// le générateur posé juste à côté (son centre en 37,5 ; 39,5).
function partie(): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1))
  etat.niveauMine = 2
  etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false }, { id: 'generateur', x: 35, y: 37, miroir: false })
  etat.inventaire = { fer: 15 }
  for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
  return etat
}

describe('le générateur', () => {
  it('a un rayon de 15 cases (un cercle autour de lui)', () => {
    const etat = partie()
    expect(rayonGenerateur(etat)).toBe(15)
    expect(caseDansLeRayon(etat, { x: 37, y: 24 })).toBe(true) // 15 cases au-dessus
    expect(caseDansLeRayon(etat, { x: 37, y: 23 })).toBe(false)
    expect(caseDansLeRayon(etat, { x: 26, y: 28 })).toBe(false) // en diagonale : 15,6 cases, trop loin
  })

  it('électrifie les rails quand il a de la redstone (du sac ou du coffre)', () => {
    const etat = partie()
    expect(railsAlimentes(etat)).toBe(false)
    etat.inventaire = { redstone: 1 }
    etat.coffre.contenu = { redstone: 1 }
    remplirGenerateur(etat, Infinity)
    expect(etat.generateur.carburant).toBe(2 * SECONDES_PAR_REDSTONE)
    expect(etat.inventaire).toEqual({})
    expect(etat.coffre.contenu).toEqual({})
    expect(railsAlimentes(etat)).toBe(true)
    // Il brûle sa redstone, puis s'arrête.
    expect(avancerGenerateur(etat, 2 * SECONDES_PAR_REDSTONE)[0]).toContain('plus de redstone')
    expect(generateurEnMarche(etat)).toBe(false)
  })

  it('éteint, il garde sa redstone', () => {
    const etat = partie()
    etat.generateur.carburant = 100
    basculerGenerateur(etat)
    avancerGenerateur(etat, 50)
    expect(etat.generateur.carburant).toBe(100)
    expect(railsAlimentes(etat)).toBe(false)
  })

  it('une partie de la ligne hors du rayon : les rails ne sont pas électriques', () => {
    const etat = partie()
    etat.generateur.carburant = 100
    const generateur = etat.village.batiments.find((b) => b.id === 'generateur')!
    generateur.x = 55
    generateur.y = 55
    expect(railsAlimentes(etat)).toBe(false)
  })

  it('électrifie aussi la foreuse dans son rayon', () => {
    const etat = partie()
    etat.generateur.carburant = 100
    etat.village.batiments.push({ id: 'foreuse', x: 41, y: 37, miroir: false })
    expect(foreuseAlimentee(etat)).toBe(true)
  })

  it('amélioré, il a un plus grand rayon et peut se servir dans le coffre', () => {
    const etat = partie()
    etat.argent = 3000
    etat.inventaire = { fer: 80, redstone: 40 }
    expect(basculerPuisage(etat)).toEqual([]) // pas au niveau 1
    ameliorerGenerateur(etat)
    expect(rayonGenerateur(etat)).toBe(20)
    basculerPuisage(etat)
    etat.coffre.contenu = { redstone: 50 }
    avancerGenerateur(etat, 1)
    expect(etat.coffre.contenu.redstone).toBe(40) // 10 redstone = 5 minutes d'avance
    expect(etat.generateur.carburant).toBe(10 * SECONDES_PAR_REDSTONE - 1)
  })
})
