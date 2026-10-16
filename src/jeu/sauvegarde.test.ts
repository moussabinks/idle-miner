import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { casserBloc, creerPartie } from './mineur'
import { CLE_SAUVEGARDE, charger, effacer, sauvegarder, secondesDepuisSauvegarde, type Stockage } from './sauvegarde'

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

  it('met à jour une sauvegarde de la version 1 (jusqu’à la version 3)', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(1)), version: 1, profondeur: 10 }
    for (const champ of ['position', 'cible', 'colonneMineur', 'nonAVendre', 'ascenseur', 'foreuse']) delete ancienne[champ]
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.version).toBe(3)
    expect(etat?.position).toBe(9) // au front de taille, comme avant
    expect(etat?.ascenseur.niveau).toBe(0)
    expect(etat?.foreuse.active).toBe(false)
  })

  it('met à jour une sauvegarde de la version 2 avec un ascenseur', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = {
      ...creerPartie(aleatoireAvecGraine(1)),
      version: 2,
      lieu: 'surface',
      trajet: null,
      ascenseur: { possede: true, chargement: {}, tempsRestant: 0, tempsTotal: 0 },
    }
    for (const champ of ['position', 'cible', 'foreuse']) delete ancienne[champ]
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.position).toBe(0)
    expect(etat?.ascenseur.niveau).toBe(1)
  })

  it('compte le temps passé depuis la dernière sauvegarde', () => {
    const stockage = fauxStockage()
    sauvegarder(stockage, creerPartie(aleatoireAvecGraine(1)), 1_000_000)
    expect(secondesDepuisSauvegarde(stockage, 1_060_000)).toBe(60)
  })

  it('efface la sauvegarde', () => {
    const stockage = fauxStockage()
    sauvegarder(stockage, creerPartie(aleatoireAvecGraine(1)))
    effacer(stockage)
    expect(charger(stockage)).toBeNull()
  })
})
