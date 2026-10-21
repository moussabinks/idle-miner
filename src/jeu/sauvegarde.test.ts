import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { casserBloc, creerPartie } from './mineur'
import {
  ANCIENNE_CLE_SAUVEGARDE,
  NB_MONDES_MAX,
  charger,
  cleMonde,
  creerMonde,
  dupliquerMonde,
  exporterTout,
  importerTout,
  listerMondes,
  mondesDeLaCopie,
  marquerJoue,
  partieAncienne,
  peutCreerMonde,
  renommerMonde,
  sauvegarder,
  secondesDepuisSauvegarde,
  supprimerMonde,
  type Stockage,
} from './sauvegarde'

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
    sauvegarder(stockage, '1', etat)
    expect(charger(stockage, '1')).toEqual(etat)
  })

  it("renvoie null s'il n'y a rien ou si la sauvegarde est abîmée", () => {
    const stockage = fauxStockage()
    expect(charger(stockage, '1')).toBeNull()
    stockage.setItem(cleMonde('1'), '{pas du json')
    expect(charger(stockage, '1')).toBeNull()
    stockage.setItem(cleMonde('1'), JSON.stringify({ version: 999 }))
    expect(charger(stockage, '1')).toBeNull()
  })

  it('une partie d’avant le village en vue du ciel (version 17 ou moins) repart de zéro', () => {
    const stockage = fauxStockage()
    stockage.setItem(cleMonde('1'), JSON.stringify({ version: 17, argent: 500, profondeur: 30 }))
    expect(charger(stockage, '1')).toBeNull()
    expect(partieAncienne(stockage, '1')).toBe(true)
    sauvegarder(stockage, '1', creerPartie(aleatoireAvecGraine(1)))
    expect(partieAncienne(stockage, '1')).toBe(false)
  })

  it('une partie de la version 18 (clairière de 40 cases) glisse de 10 cases dans la clairière de 60', () => {
    const stockage = fauxStockage()
    const etat = creerPartie(aleatoireAvecGraine(1))
    const ancien = JSON.parse(JSON.stringify(etat))
    ancien.version = 18
    ancien.village.batiments = [{ id: 'puits', x: 15, y: 15, miroir: false }, { id: 'marche', x: 17, y: 27, miroir: true }]
    ancien.village.rails = ['20,25', '21,25']
    ancien.village.chemins = ['3,4']
    ancien.village.decorations = [{ n: 1, id: 'fontaine', x: 2, y: 30, miroir: false }]
    stockage.setItem(cleMonde('1'), JSON.stringify(ancien))
    const charge = charger(stockage, '1')
    expect(charge?.version).toBe(19)
    expect(charge?.village.batiments).toEqual([{ id: 'puits', x: 25, y: 25, miroir: false }, { id: 'marche', x: 27, y: 37, miroir: true }])
    expect(charge?.village.rails).toEqual(['30,35', '31,35'])
    expect(charge?.village.chemins).toEqual(['13,14'])
    expect(charge?.village.decorations[0]).toMatchObject({ x: 12, y: 40 })
    expect(partieAncienne(stockage, '1')).toBe(false)
  })

  it('compte le temps passé depuis la dernière sauvegarde', () => {
    const stockage = fauxStockage()
    sauvegarder(stockage, '1', creerPartie(aleatoireAvecGraine(1)), 1_000_000)
    expect(secondesDepuisSauvegarde(stockage, '1', 1_060_000)).toBe(60)
  })
})

describe('les mondes (5 sauvegardes au plus)', () => {
  const partie = () => creerPartie(aleatoireAvecGraine(1))

  it('crée des mondes, chacun avec sa partie et sa couleur', () => {
    const stockage = fauxStockage()
    expect(listerMondes(stockage)).toEqual([])
    const a = creerMonde(stockage, 'Dev avancé', partie(), 1000)
    const b = creerMonde(stockage, '  ', partie(), 2000) // nom vide : un nom par défaut
    expect(a).toMatchObject({ id: '1', nom: 'Dev avancé', couleur: 0 })
    expect(b).toMatchObject({ id: '2', nom: 'Monde 2', couleur: 1 })
    expect(charger(stockage, '1')).not.toBeNull()
    expect(listerMondes(stockage).map((m) => m.id)).toEqual(['2', '1']) // le plus récent en premier
  })

  it('pas plus de 5 mondes', () => {
    const stockage = fauxStockage()
    for (let i = 0; i < NB_MONDES_MAX; i++) creerMonde(stockage, `M${i}`, partie(), i)
    expect(peutCreerMonde(stockage)).toBe(false)
    expect(creerMonde(stockage, 'de trop', partie())).toBeNull()
    expect(listerMondes(stockage)).toHaveLength(5)
  })

  it('renomme, duplique, supprime, et remonte le dernier monde joué', () => {
    const stockage = fauxStockage()
    creerMonde(stockage, 'Début', partie(), 1000)
    creerMonde(stockage, 'Léo', partie(), 2000)
    renommerMonde(stockage, '1', 'Début de partie')
    expect(listerMondes(stockage).find((m) => m.id === '1')?.nom).toBe('Début de partie')
    const copie = dupliquerMonde(stockage, '2', 3000)
    expect(copie?.nom).toBe('Léo (copie)')
    expect(charger(stockage, copie!.id)).toEqual(charger(stockage, '2'))
    marquerJoue(stockage, '1', 4000)
    expect(listerMondes(stockage)[0].id).toBe('1')
    supprimerMonde(stockage, '2')
    expect(listerMondes(stockage).map((m) => m.id)).toEqual(['1', '3'])
    expect(charger(stockage, '2')).toBeNull()
    // Une place libérée : la couleur du monde supprimé est réutilisée.
    expect(creerMonde(stockage, 'Nouveau', partie(), 5000)?.couleur).toBe(1)
  })

  it('l’ancienne partie unique devient « Monde 1 »', () => {
    const stockage = fauxStockage()
    const ancienne = partie()
    stockage.setItem(ANCIENNE_CLE_SAUVEGARDE, JSON.stringify(ancienne))
    stockage.setItem('idle-miner-horodatage', '123456')
    expect(listerMondes(stockage)).toEqual([{ id: '1', nom: 'Monde 1', couleur: 0, creeLe: 123456, joueLe: 123456 }])
    expect(charger(stockage, '1')).toEqual(ancienne)
    expect(stockage.getItem(ANCIENNE_CLE_SAUVEGARDE)).toBeNull()
    expect(secondesDepuisSauvegarde(stockage, '1', 123456 + 5000)).toBe(5)
  })
})

describe('copie de tous les mondes (sauvegarde en ligne)', () => {
  it("remet les mêmes mondes et parties sur un autre appareil", () => {
    const aleatoire = aleatoireAvecGraine(7)
    const ordinateur = fauxStockage()
    const etat = creerPartie(aleatoire)
    for (let i = 0; i < 30; i++) casserBloc(etat, aleatoire)
    const premier = creerMonde(ordinateur, 'Ma save', etat, 1000)!
    creerMonde(ordinateur, 'Test', creerPartie(aleatoire), 2000)

    const copie = exporterTout(ordinateur)
    expect(mondesDeLaCopie(copie).map((m) => m.nom).sort()).toEqual(['Ma save', 'Test'])

    // Le téléphone avait un autre monde : il est remplacé.
    const telephone = fauxStockage()
    creerMonde(telephone, 'Vieux monde', creerPartie(aleatoire), 500)
    importerTout(telephone, JSON.parse(JSON.stringify(copie)))

    expect(listerMondes(telephone).map((m) => m.nom).sort()).toEqual(['Ma save', 'Test'])
    expect(charger(telephone, premier.id)).toEqual(etat)
    expect(exporterTout(telephone)).toEqual(copie)
  })

  it("n'écrit que des clés de mondes", () => {
    const stockage = fauxStockage()
    importerTout(stockage, { 'idle-miner-son': 'coupe', 'autre-site': 'x' })
    expect(stockage.getItem('idle-miner-son')).toBeNull()
    expect(stockage.getItem('autre-site')).toBeNull()
  })

  it('renvoie une copie vide sans aucun monde', () => {
    expect(exporterTout(fauxStockage())).toEqual({})
    expect(mondesDeLaCopie({})).toEqual([])
  })
})
