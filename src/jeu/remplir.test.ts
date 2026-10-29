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
