import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { jouerPartie } from './bot'

// Le bot joue 20 parties (avec des graines fixes, donc toujours les mêmes).
const parties = Array.from({ length: 20 }, (_, i) => jouerPartie(aleatoireAvecGraine(i + 1)))
const blocsTries = parties.map((p) => p.blocs).sort((a, b) => a - b)
const mediane = blocsTries[Math.floor(blocsTries.length / 2)]
const minutesTriees = parties.map((p) => p.temps / 60).sort((a, b) => a - b)
const medianeMinutes = minutesTriees[Math.floor(minutesTriees.length / 2)]

describe('bot de simulation (équilibrage)', () => {
  it('atteint toujours la bedrock (-128 m) avec la pioche en netherite', () => {
    for (const partie of parties) {
      expect(partie.etat.victoire).toBe(true)
      expect(partie.etat.profondeur).toBe(128)
      expect(partie.etat.meilleure).toBe(4)
    }
  })

  it('atteint la bedrock en 1 500 à 2 500 blocs (médiane)', () => {
    expect(mediane).toBeGreaterThanOrEqual(1500)
    expect(mediane).toBeLessThanOrEqual(2500)
  })

  it('joue une partie de 15 à 30 minutes (médiane)', () => {
    expect(medianeMinutes).toBeGreaterThanOrEqual(15)
    expect(medianeMinutes).toBeLessThanOrEqual(30)
  })

  it("n'est jamais extrêmement long ou court", () => {
    expect(blocsTries[0]).toBeGreaterThan(800)
    expect(blocsTries[blocsTries.length - 1]).toBeLessThan(6000)
  })

  it("construit l'ascenseur vers le milieu de la mine (entre -40 et -100 m)", () => {
    for (const partie of parties) {
      expect(partie.etat.ascenseur.niveau).toBeGreaterThanOrEqual(1)
      expect(partie.profondeurAscenseur).toBeGreaterThan(40)
      expect(partie.profondeurAscenseur).toBeLessThan(100)
    }
  })

  it('remonte plusieurs fois au village', () => {
    for (const partie of parties) expect(partie.allersRetours).toBeGreaterThan(3)
  })

  it('achète la pioche en fer entre -30 et -60 m', () => {
    for (const partie of parties) {
      expect(partie.profondeurPiocheFer).toBeGreaterThanOrEqual(30)
      expect(partie.profondeurPiocheFer).toBeLessThanOrEqual(60)
    }
  })
})
