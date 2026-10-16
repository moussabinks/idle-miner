import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { casserBloc, creerPartie } from './mineur'
import { CLE_SAUVEGARDE, charger, effacer, sauvegarder, type Stockage } from './sauvegarde'

// Un faux localStorage, en mémoire.
function fauxStockage(): Stockage & { donnees: Map<string, string> } {
  const donnees = new Map<string, string>()
  return {
    donnees,
    getItem: (cle) => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => void donnees.set(cle, valeur),
    removeItem: (cle) => void donnees.delete(cle),
  }
}

describe('sauvegarde', () => {
  it('retrouve exactement la partie sauvegardée', () => {
    const aleatoire = aleatoireAvecGraine(1)
    const etat = creerPartie(aleatoire)
    for (let i = 0; i < 20; i++) casserBloc(etat, aleatoire)
    const stockage = fauxStockage()
    sauvegarder(stockage, etat)
    expect(charger(stockage)).toEqual(etat)
  })

  it("renvoie null s'il n'y a rien ou si la sauvegarde est abîmée", () => {
    const stockage = fauxStockage()
    expect(charger(stockage)).toBeNull()
    stockage.setItem(CLE_SAUVEGARDE, '{pas du json')
    expect(charger(stockage)).toBeNull()
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify({ version: 999 }))
    expect(charger(stockage)).toBeNull()
  })

  it('met à jour une sauvegarde de la version 1', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(1)), version: 1 }
    for (const champ of ['lieu', 'trajet', 'colonneMineur', 'nonAVendre', 'ascenseur']) delete ancienne[champ]
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.version).toBe(2)
    expect(etat?.lieu).toBe('mine')
    expect(etat?.ascenseur.possede).toBe(false)
  })

  it('efface la sauvegarde', () => {
    const stockage = fauxStockage()
    sauvegarder(stockage, creerPartie(aleatoireAvecGraine(1)))
    effacer(stockage)
    expect(charger(stockage)).toBeNull()
  })
})
