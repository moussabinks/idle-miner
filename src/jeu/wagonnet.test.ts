import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol, retirerSol } from './batiments'
import { changerRole, embaucher } from './employes'
import { creerPartie, type EtatJeu } from './mineur'
import { avancerTemps } from './temps'
import { avancerWagonnet, capaciteWagonnet, joueurPousse, ligneDuWagonnet, peutPousserWagonnet, pousserWagonnet, secondesAllerRetour } from './wagonnet'

// Une partie avec le marché en (28, 40) et une ligne de 5 rails de la mine au marché.
function partie(): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1))
  etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false })
  etat.inventaire = { fer: 15 }
  for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
  return etat
}

describe('le wagonnet', () => {
  it('ne roule que sur une ligne complète de la mine au marché', () => {
    const etat = partie()
    expect(ligneDuWagonnet(etat)).toHaveLength(5)
    etat.coffre.contenu = { fer: 10 }
    expect(peutPousserWagonnet(etat)).toBe(true)
    retirerSol(etat, 'rail', 30, 37)
    expect(peutPousserWagonnet(etat)).toBe(false)
  })

  it('le joueur le pousse : il emporte le coffre, le vend au marché et revient', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 10, pierre: 50 }
    pousserWagonnet(etat)
    expect(joueurPousse(etat)).toBe(true)
    expect(capaciteWagonnet(etat)).toBe(40)
    expect(etat.coffre.contenu).toEqual({ pierre: 20 }) // les plus chers d'abord, 40 places
    const messages: string[] = []
    for (let i = 0; i < 100 && etat.wagonnet.etape !== 'quai'; i++) messages.push(...avancerWagonnet(etat, 0.25))
    expect(etat.argent).toBe(150) // 10 fer à 12 $ + 30 pierres à 1 $
    expect(etat.stats.argentWagonnet).toBe(150)
    expect(etat.stats.voyagesWagonnet).toBe(1)
    expect(messages.some((m) => m.includes('+150 $'))).toBe(true)
    expect(joueurPousse(etat)).toBe(false)
  })

  it('il laisse dans le coffre les objets gardés au marché', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 10 }
    etat.nonAVendre = ['fer']
    expect(peutPousserWagonnet(etat)).toBe(false)
  })

  it('un mineur pousseur le pousse tout seul dès que le coffre n’est pas vide', () => {
    const etat = partie()
    etat.argent = 1000
    embaucher(etat, aleatoireAvecGraine(2))
    embaucher(etat, aleatoireAvecGraine(3))
    changerRole(etat, 0, 'pousseur')
    const argentDepart = etat.argent
    for (let i = 0; i < 400 && etat.stats.voyagesWagonnet === 0; i++) avancerTemps(etat, 0.5, aleatoireAvecGraine(i))
    expect(etat.stats.voyagesWagonnet).toBeGreaterThan(0)
    expect(etat.argent).toBeGreaterThan(argentDepart)
  })

  it('électrique, il roule tout seul et bien plus vite', () => {
    const etat = partie()
    const aLaMain = secondesAllerRetour(etat, 3)
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'generateur', x: 35, y: 37, miroir: false })
    etat.generateur.carburant = 1000
    etat.coffre.contenu = { fer: 5 }
    avancerWagonnet(etat, 0.1)
    expect(etat.wagonnet.pousseur).toBe('electricite')
    expect(secondesAllerRetour(etat)).toBeLessThan(aLaMain)
  })

  it('la ligne coupée en route : le chargement retourne dans le coffre', () => {
    const etat = partie()
    etat.coffre.contenu = { fer: 10 }
    pousserWagonnet(etat)
    retirerSol(etat, 'rail', 30, 37)
    avancerWagonnet(etat, 1)
    expect(etat.wagonnet.etape).toBe('quai')
    expect(etat.coffre.contenu).toEqual({ fer: 10 })
  })
})
