import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { embaucher } from './employes'
import { capaciteCoffre, nbDansCoffre } from './mineur'
import { partieDeTest } from './partieDeTest'
import { creerMonde, exporterTout, type Stockage } from './sauvegarde'
import { avancerVisite, preparerVisite, villageAPartager } from './visite'

function fauxStockage(): Stockage {
  const donnees = new Map<string, string>()
  return {
    getItem: (cle) => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => void donnees.set(cle, valeur),
    removeItem: (cle) => void donnees.delete(cle),
  }
}

describe('visite d’un village (26/10)', () => {
  it('partage le monde qui a gagné le plus d’argent', () => {
    const stockage = fauxStockage()
    const petit = partieDeTest(aleatoireAvecGraine(1))
    petit.stats.argentGagne = 100
    const grand = partieDeTest(aleatoireAvecGraine(2))
    grand.stats.argentGagne = 5000
    creerMonde(stockage, 'Petit', petit)
    creerMonde(stockage, 'Grand', grand)
    expect(villageAPartager(exporterTout(stockage))?.stats.argentGagne).toBe(5000)
    expect(villageAPartager({})).toBeNull()
  })

  it('refuse une partie abîmée', () => {
    expect(preparerVisite({ n: 'importe quoi' })).toBeNull()
  })

  it('les employés travaillent toujours, même sans salaire ni manager, et le coffre ne bloque jamais', () => {
    const aleatoire = aleatoireAvecGraine(3)
    const partie = partieDeTest(aleatoire)
    partie.argent = 1_000_000
    embaucher(partie, aleatoire)
    // Plus payé du tout, coffre plein : dans sa vraie partie, il s'arrêterait.
    partie.employes[0].tempsPaye = 0
    partie.coffre.contenu = { pierre: capaciteCoffre(partie) }
    const visite = preparerVisite(JSON.parse(JSON.stringify(partie)))
    expect(visite).not.toBeNull()
    if (!visite) return
    for (let i = 0; i < 20 * 60; i++) avancerVisite(visite, 1, aleatoire)
    expect(visite.employes[0].blocsCasses).toBeGreaterThan(0)
    expect(visite.employes[0].etape).not.toBe('attend')
    expect(nbDansCoffre(visite)).toBeLessThan(capaciteCoffre(visite))
    // La vraie partie n'a pas bougé.
    expect(partie.employes[0].blocsCasses).toBe(0)
  })
})
