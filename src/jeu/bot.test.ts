import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { jouerPartie } from './bot'
import { profondeurBedrock } from './donnees'

// Le bot joue 20 parties (avec des graines fixes, donc toujours les mêmes).
const parties = Array.from({ length: 20 }, (_, i) => jouerPartie(aleatoireAvecGraine(i + 1)))
const blocsTries = parties.map((p) => p.blocs).sort((a, b) => a - b)
const mediane = blocsTries[Math.floor(blocsTries.length / 2)]
const minutesTriees = parties.map((p) => p.temps / 60).sort((a, b) => a - b)
const medianeMinutes = minutesTriees[Math.floor(minutesTriees.length / 2)]

describe('bot de simulation (équilibrage)', () => {
  it(`atteint toujours la bedrock (-${profondeurBedrock(0)} m) avec la pioche en netherite`, () => {
    for (const partie of parties) {
      expect(partie.etat.victoire).toBe(true)
      expect(partie.etat.profondeur).toBe(profondeurBedrock(0) - 1) // la dernière couche avant la bedrock
      expect(partie.etat.meilleure).toBe(4)
    }
  })

  // La première partie (prestige 0) a une mine de 100 m depuis le 19/10 : elle est plus courte.
  it('atteint la bedrock en 1 300 à 3 000 blocs (médiane, couches de 10 blocs)', () => {
    expect(mediane).toBeGreaterThanOrEqual(1300)
    expect(mediane).toBeLessThanOrEqual(3000)
  })

  it('joue une première partie de 10 à 25 minutes (médiane)', () => {
    expect(medianeMinutes).toBeGreaterThanOrEqual(10)
    expect(medianeMinutes).toBeLessThanOrEqual(25)
  })

  it("n'est jamais extrêmement long ou court", () => {
    expect(blocsTries[0]).toBeGreaterThan(800)
    expect(blocsTries[blocsTries.length - 1]).toBeLessThan(9000)
  })

  it("construit l'ascenseur assez tôt (entre -10 et -70 m) : il ne demande pas de redstone au début", () => {
    for (const partie of parties) {
      expect(partie.etat.ascenseur.niveau).toBeGreaterThanOrEqual(1)
      expect(partie.profondeurAscenseur).toBeGreaterThan(10)
      expect(partie.profondeurAscenseur).toBeLessThan(70)
    }
  })

  it('remonte plusieurs fois au village', () => {
    for (const partie of parties) expect(partie.allersRetours).toBeGreaterThan(3)
  })

  it('achète la pioche en fer entre -15 et -70 m', () => {
    for (const partie of parties) {
      expect(partie.profondeurPiocheFer).toBeGreaterThanOrEqual(15)
      expect(partie.profondeurPiocheFer).toBeLessThanOrEqual(70)
    }
  })
})
