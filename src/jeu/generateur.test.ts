import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol } from './batiments'
import { SECONDES_PAR_REDSTONE } from './donnees'
import {
  ameliorerGenerateur,
  avancerGenerateur,
  basculerGenerateur,
  caseDansLeRayon,
  foreuseAlimentee,
  generateurEnMarche,
  rayonGenerateur,
  remplirGenerateur,
  reserveMaxGenerateur,
} from './generateur'
import { nouveauTrajet, type EtatJeu } from './mineur'
import { railsAlimentes } from './wagonnet'

// Une partie avec le marché en (18, 30), une ligne de rails de 5 cases de la mine au marché (et son trajet), et
// le générateur posé juste à côté (son centre en 27,5 ; 29,5). (25/10 : la clairière fait 40 × 40 cases)
function partie(): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.niveauMine = 2
  etat.village.batiments.push({ id: 'marche', x: 18, y: 30, miroir: false }, { id: 'generateur', x: 25, y: 27, miroir: false })
  etat.coffre.contenu = { fer: 15 }
  for (let y = 25; y <= 29; y++) poserSol(etat, 'rail', 20, y)
  etat.trajets.push(nouveauTrajet('mine-marche'))
  return etat
}

describe('le générateur', () => {
  it('a un rayon de 12 cases (un cercle autour de lui)', () => {
    const etat = partie()
    expect(rayonGenerateur(etat)).toBe(12)
    expect(caseDansLeRayon(etat, { x: 27, y: 17 })).toBe(true) // 12 cases au-dessus
    expect(caseDansLeRayon(etat, { x: 27, y: 16 })).toBe(false)
    expect(caseDansLeRayon(etat, { x: 19, y: 21 })).toBe(true) // en diagonale : 11,3 cases
    expect(caseDansLeRayon(etat, { x: 18, y: 20 })).toBe(false) // en diagonale : 12,7 cases, trop loin
  })

  it('électrifie les rails quand il a de la redstone (du coffre de la mine)', () => {
    const etat = partie()
    expect(railsAlimentes(etat)).toBe(false)
    etat.coffre.contenu = { redstone: 2 }
    remplirGenerateur(etat, Infinity)
    expect(etat.generateur.carburant).toBe(2 * SECONDES_PAR_REDSTONE)
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
    generateur.x = 35
    generateur.y = 35
    expect(railsAlimentes(etat)).toBe(false)
  })

  it('électrifie aussi la foreuse dans son rayon', () => {
    const etat = partie()
    etat.generateur.carburant = 100
    etat.village.batiments.push({ id: 'foreuse', x: 31, y: 27, miroir: false })
    expect(foreuseAlimentee(etat)).toBe(true)
  })

  it('(23/10) sa réserve : 5 minutes au niveau 1, plus grande une fois amélioré, et il ne se sert plus dans le coffre', () => {
    const etat = partie()
    etat.coffre.contenu = { redstone: 100 }
    remplirGenerateur(etat, Infinity)
    expect(etat.generateur.carburant).toBe(5 * 60)
    expect(etat.coffre.contenu.redstone).toBe(90)
    expect(remplirGenerateur(etat, 1)[0]).toContain('pleine')
    // Il ne prend rien dans le coffre tout seul.
    etat.coffre.contenu = { redstone: 50 }
    avancerGenerateur(etat, 60)
    expect(etat.coffre.contenu.redstone).toBe(50)
    etat.argent = 5000
    etat.coffre.contenu = { fer: 80, redstone: 40 }
    ameliorerGenerateur(etat)
    expect(rayonGenerateur(etat)).toBe(16)
    expect(reserveMaxGenerateur(etat)).toBe(7 * 60)
  })
})
