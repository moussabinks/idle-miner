// (28/10, bug signalé par le propriétaire) Remplir le générateur, la foreuse ou le four à la main
// prend aussi ce que le joueur garde 📌 dans le coffre : avant, le bouton montrait la redstone mais
// rien ne rentrait, et le jeu parlait du niveau 2 de la mine.
import { describe, expect, it } from 'vitest'
import { remplirGenerateur } from './generateur'
import { remplirForeuse } from './foreuse'
import { remplirFonderie } from './ateliers'
import { aleatoireAvecGraine } from './aleatoire'
import { partieDeTest } from './partieDeTest'
import type { EtatJeu } from './mineur'
import { poserSol } from './batiments'
import { aCharger, creerTrajet } from './wagonnet'

// Une partie au niveau 5 de la mine, avec le générateur, la foreuse et la fonderie posés.
function partie(): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.niveauMine = 5
  etat.village.batiments.push({ id: 'generateur', x: 25, y: 27, miroir: false }, { id: 'foreuse', x: 26, y: 21, miroir: false }, { id: 'fonderie', x: 9, y: 15, miroir: false })
  return etat
}

describe('remplir à la main', () => {
  it('le générateur prend la redstone gardée 📌', () => {
    const etat = partie()
    etat.coffre.contenu.redstone = 12
    etat.coffre.garder = { redstone: 12 }
    const messages = remplirGenerateur(etat, Infinity)
    expect(etat.generateur.carburant).toBeGreaterThan(0)
    expect(etat.coffre.contenu.redstone ?? 0).toBeLessThan(12)
    expect(messages.join(' ')).not.toContain('niveau 2')
  })

  it('sans redstone après le niveau 2 : pas de message sur le niveau 2', () => {
    const etat = partie()
    etat.coffre.contenu.redstone = 0
    expect(remplirGenerateur(etat, Infinity).join(' ')).not.toContain('niveau 2')
  })

  it('la foreuse et le four prennent le charbon gardé 📌', () => {
    const etat = partie()
    etat.coffre.contenu.charbon = 20
    etat.coffre.garder = { charbon: 20 }
    remplirForeuse(etat, Infinity)
    expect(etat.foreuse.carburant).toBeGreaterThan(0)
    remplirFonderie(etat)
    expect(etat.fonderie.carburant).toBeGreaterThan(0)
  })
})

// (29/10, demandé par le propriétaire) Les wagonnets aussi : le charbon gardé 📌 part au four de
// la fonderie, et la redstone gardée au générateur (seulement ce qui leur manque).
describe('les wagonnets et le combustible gardé 📌', () => {
  // Le bâtiment en (18, 30), relié à la mine par 5 rails (comme dans wagonnet.test.ts).
  function partieRelieeA(id: 'fonderie' | 'generateur'): EtatJeu {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.niveauMine = 5
    etat.village.batiments.push({ id, x: 18, y: 30, miroir: false })
    etat.coffre.contenu = { fer: 15 }
    for (let y = 25; y <= 29; y++) poserSol(etat, 'rail', 20, y)
    return etat
  }

  it('Mine → Fonderie emporte le charbon qui manque au four, même gardé', () => {
    const etat = partieRelieeA('fonderie')
    creerTrajet(etat, 'mine-fonderie')
    etat.fonderie.carburant = 0
    etat.coffre.contenu = { charbon: 40 }
    etat.coffre.garder = { charbon: 40 }
    expect(aCharger(etat, 'mine-fonderie')).toBeGreaterThan(0)
  })

  it('Mine → Générateur emporte la redstone qui manque, même gardée', () => {
    const etat = partieRelieeA('generateur')
    creerTrajet(etat, 'mine-generateur')
    etat.generateur.carburant = 0
    etat.coffre.contenu = { redstone: 40 }
    etat.coffre.garder = { redstone: 40 }
    expect(aCharger(etat, 'mine-generateur')).toBeGreaterThan(0)
  })
})
