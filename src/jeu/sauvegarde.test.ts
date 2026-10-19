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

  it('met à jour une sauvegarde de la version 1 (jusqu’à la version 6)', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(1)), version: 1, profondeur: 10 }
    for (const champ of ['position', 'cible', 'colonneMineur', 'nonAVendre', 'ascenseur', 'foreuse', 'talents', 'peculeRecu']) delete ancienne[champ]
    ancienne.coucheActuelle = ['terre', 'terre', 'terre', 'terre', 'terre', 'terre']
    ancienne.couchesDessous = [['pierre', 'fer', 'pierre', 'pierre', 'pierre', 'pierre']]
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.version).toBe(6)
    expect(etat?.position).toBe(9) // au front de taille, comme avant
    expect(etat?.ascenseur.niveau).toBe(0)
    expect(etat?.foreuse.active).toBe(false)
    expect(etat?.coucheActuelle).toHaveLength(10) // les couches passent de 6 à 10 blocs
    expect(etat?.couchesDessous[0]).toEqual(['pierre', 'fer', 'pierre', 'pierre', 'pierre', 'pierre', 'pierre', 'fer', 'pierre', 'pierre'])
    expect(etat?.talents).toEqual([])
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
    for (const champ of ['position', 'cible', 'foreuse', 'talents', 'peculeRecu']) delete ancienne[champ]
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.position).toBe(0)
    expect(etat?.ascenseur.niveau).toBe(1)
  })

  it('débloque une ancienne partie arrêtée sur la bedrock', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = {
      ...creerPartie(aleatoireAvecGraine(1)),
      version: 4,
      profondeur: 128,
      position: 127,
      cible: 127,
      victoire: true,
      coucheActuelle: [],
      couchesDessous: [],
      ascenseur: { niveau: 2, chargement: {}, tempsRestant: 0, tempsTotal: 0 },
    }
    delete ancienne.talents
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.profondeur).toBe(127)
    expect(etat?.position).toBe(126)
    expect(etat?.coucheActuelle).toHaveLength(10)
    expect(etat?.ascenseur).toMatchObject({ niveau: 2, position: 126, cible: 126 })
  })

  it('retire les donjons, l’épée et l’assistant d’une sauvegarde de la version 5', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = {
      ...creerPartie(aleatoireAvecGraine(1), 2),
      version: 5,
      assistant: { embauche: true, colonne: 9 },
      epee: true,
      succes: ['premier', 'monstre'],
    }
    delete ancienne.talents
    ;(ancienne.coucheActuelle as string[])[3] = 'donjon'
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage)
    expect(etat?.version).toBe(6)
    expect(etat?.coucheActuelle[3]).toBe('pierre')
    expect(etat?.succes).toEqual(['premier'])
    expect(etat?.talents).toEqual([]) // ses 2 prestiges lui donnent 2 points à dépenser
    expect(etat && 'assistant' in etat).toBe(false)
    expect(etat && 'epee' in etat).toBe(false)
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
