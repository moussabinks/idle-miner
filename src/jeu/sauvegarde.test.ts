import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { VERSION_ETAT, casserBloc, creerPartie } from './mineur'
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
  peutCreerMonde,
  renommerMonde,
  sauvegarder,
  secondesDepuisSauvegarde,
  supprimerMonde,
  type Stockage,
} from './sauvegarde'

// Les anciennes parties des tests de migration sont rangées dans le monde « 1 ».
const CLE_SAUVEGARDE = cleMonde('1')

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
    stockage.setItem(CLE_SAUVEGARDE, '{pas du json')
    expect(charger(stockage, '1')).toBeNull()
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify({ version: 999 }))
    expect(charger(stockage, '1')).toBeNull()
  })

  it('met à jour une sauvegarde de la version 1 (jusqu’à la dernière version)', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(1)), version: 1, profondeur: 10 }
    for (const champ of ['position', 'cible', 'colonneMineur', 'nonAVendre', 'ascenseur', 'foreuse', 'talents', 'peculeRecu']) delete ancienne[champ]
    ancienne.coucheActuelle = ['terre', 'terre', 'terre', 'terre', 'terre', 'terre']
    ancienne.couchesDessous = [['pierre', 'fer', 'pierre', 'pierre', 'pierre', 'pierre']]
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
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
    const etat = charger(stockage, '1')
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
    const etat = charger(stockage, '1')
    // Au prestige 0, la bedrock est maintenant à -100 m (version 14) : la partie remonte juste au-dessus.
    expect(etat?.profondeur).toBe(99)
    expect(etat?.position).toBe(99)
    expect(etat?.victoire).toBe(true)
    expect(etat?.coucheActuelle).toHaveLength(10)
    expect(etat?.ascenseur).toMatchObject({ niveau: 2, position: 99, cible: 99 })
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
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
    expect(etat?.coucheActuelle[3]).toBe('pierre')
    expect(etat?.succes).toEqual(['premier'])
    expect(etat?.talents).toEqual([]) // ses 2 prestiges lui donnent 2 points à dépenser
    expect(etat && 'assistant' in etat).toBe(false)
    expect(etat && 'epee' in etat).toBe(false)
  })

  it('met à jour une partie de la version 9 (sans mineurs)', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(1), 3), version: 9, talents: ['negoce', 'ascenseurOffert', 'grimpeur'] }
    delete ancienne.employes
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage, '1')
    expect(etat?.talents).toEqual([]) // l'arbre a été refait le 20/10 : tous les points sont rendus
    expect(etat?.employes).toEqual([])
    expect(etat?.foreuse.niveauVitesse).toBe(0)
  })

  it('les stands déjà débloqués d’une ancienne partie (version 12) sont déjà découverts', () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(1), 1), version: 12 }
    delete ancienne.decouvertes
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    expect(charger(stockage, '1')?.decouvertes).toEqual(['foreuse'])
  })

  it('une ancienne partie à 2 foreuses (version 11) garde la meilleure, l’autre est remboursée', () => {
    const stockage = fauxStockage()
    const partie = creerPartie(aleatoireAvecGraine(1), 3)
    const ancienne = {
      ...partie,
      version: 11,
      foreuse: { ...partie.foreuse, active: true, niveauVitesse: 2, profondeur: 50, progression: 0.5, blocsFores: 490, nombre: 2 },
    }
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
    expect(etat?.foreuse).toMatchObject({ niveauVitesse: 2, profondeur: 50, progression: 0.5, blocsFores: 490 })
    expect('nombre' in (etat?.foreuse ?? {})).toBe(false)
    expect('foreuses' in (etat?.foreuse ?? {})).toBe(false)
    // La 2e foreuse (50 000 $) et ses 2 niveaux de forage (2 815 $ et 6 780 $, minerais compris) sont remboursés.
    expect(etat?.argent).toBe(50000 + 2815 + 6780)
  })

  it('met à jour une partie de la version 14 : une foreuse, mineurs communs payés, arbre remis à zéro', () => {
    const stockage = fauxStockage()
    const partie = creerPartie(aleatoireAvecGraine(1), 4)
    const { niveauVitesse: _n, profondeur: _p, progression: _g, blocsFores: _b, ...partage } = partie.foreuse
    const { salairesPayes: _s, ...anciennesStats } = partie.stats
    const mineur = { nom: 'Léo', niveau: 2, profondeur: 40, etape: 'creuse', position: 39, sac: {}, progression: 0, blocsCasses: 200, gagne: 900 }
    const ancienne: Record<string, unknown> = {
      ...partie,
      version: 14,
      argent: 100,
      foreuse: {
        ...partage,
        active: true,
        carburant: 300,
        foreuses: [
          { niveauVitesse: 1, profondeur: 80, progression: 0, blocsFores: 790 },
          { niveauVitesse: 3, profondeur: 30, progression: 0.2, blocsFores: 290 },
          { niveauVitesse: 0, profondeur: 10, progression: 0, blocsFores: 90 },
        ],
      },
      employes: [mineur],
      talents: ['negoce', 'pecule', 'contremaitre'],
      peculeRecu: true,
      stats: anciennesStats,
      statsTotales: anciennesStats,
    }
    delete ancienne.recruteur
    delete ancienne.manager
    delete ancienne.tresorerie
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
    // On garde la foreuse au plus haut niveau de forage, avec tout le charbon.
    expect(etat?.foreuse).toMatchObject({ active: true, carburant: 300, niveauVitesse: 3, profondeur: 30, blocsFores: 290 })
    // Les deux autres : 50 000 $ + 100 000 $, et le niveau 1 de forage (2 815 $).
    expect(etat?.argent).toBe(100 + 50000 + 100000 + 2815)
    expect(etat?.employes).toEqual([{ ...mineur, rarete: 'commun', tempsPaye: 600 }])
    expect(etat?.talents).toEqual([])
    expect(etat?.recruteur).toBe(0)
    expect(etat?.manager).toEqual({ embauche: false, tempsPaye: 0 })
    expect(etat?.tresorerie).toBe(0)
    expect(etat?.stats.salairesPayes).toBe(0)
    expect(etat && 'peculeRecu' in etat).toBe(false)
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

describe('migration vers la version 11', () => {
  it("ajoute l'argent gagné aux prestiges précédents (à 0)", () => {
    const stockage = fauxStockage()
    const ancienne: Record<string, unknown> = { ...creerPartie(aleatoireAvecGraine(3)), version: 10 }
    delete ancienne.argentGagneAvant
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne))
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
    expect(etat?.argentGagneAvant).toBe(0)
  })
})
