import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { VERSION_ETAT, cliquerMine, creerPartie } from './mineur'
import { niveauJoueur } from './niveaux'
import { embaucher } from './employes'
import { partieDeTest } from './partieDeTest'
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
    for (let i = 0; i < 20; i++) cliquerMine(etat, aleatoire)
    const stockage = fauxStockage()
    sauvegarder(stockage, '1', etat)
    expect(charger(stockage, '1')).toEqual(etat)
  })

  it('(23/10) une pioche en diamant d’une partie version 25 reste en diamant (l’émeraude s’intercale)', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    const stockage = fauxStockage()
    sauvegarder(stockage, '1', { ...etat, version: 25, pioches: { 0: 5, 2: 10, 3: 40 }, niveauPioche: 3, meilleure: 3 })
    const relue = charger(stockage, '1')
    expect(relue?.pioches).toEqual({ 0: 5, 2: 10, 4: 40 })
    expect(relue?.niveauPioche).toBe(4)
    expect(relue?.meilleure).toBe(4)
  })

  it('(23/10) un mineur avec la pioche en diamant (version 26) la garde : l’émeraude s’intercale', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 10_000
    embaucher(etat, aleatoireAvecGraine(2))
    const stockage = fauxStockage()
    const mineur = etat.employes[0]
    expect(mineur.role).toBe('mineur')
    sauvegarder(stockage, '1', {
      ...etat,
      version: 26,
      employes: [
        { ...mineur, niveau: 4 },
        { ...mineur, niveau: 3 },
        { ...mineur, role: 'pousseur' as const, niveau: 4 },
      ],
    })
    expect(charger(stockage, '1')?.employes.map((e) => e.niveau)).toEqual([5, 3, 4])
  })

  it('(23/10) version 27 : chaque pousseur reçoit un chariot comme son ancien wagonnet', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 100_000
    embaucher(etat, aleatoireAvecGraine(2))
    const mineur = etat.employes[0]
    const pousseur = { ...mineur, role: 'pousseur' as const, trajet: 'mine-marche' as const }
    const stockage = fauxStockage()
    // ancienne taille 70 places (niveau 2), pousseur « Expert » (×2) : 140 places → chariot de 115
    sauvegarder(stockage, '1', { ...etat, version: 27, niveauWagonnets: 2, employes: [mineur, { ...pousseur, niveau: 3 }, { ...pousseur, nom: 'Zoé', niveau: 0 }] })
    const relue = charger(stockage, '1')!
    expect(relue.employes.map((e) => e.chariot)).toEqual([undefined, 4, 2])
    expect(relue.employes[1].niveau).toBe(3) // son niveau devient sa vitesse
  })

  it('(23/10) l’argent d’une ancienne trésorerie revient au joueur', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    const stockage = fauxStockage()
    sauvegarder(stockage, '1', { ...etat, tresorerie: 1234 } as typeof etat)
    expect(charger(stockage, '1')?.argent).toBe(etat.argent + 1234)
    expect(charger(stockage, '1')).not.toHaveProperty('tresorerie')
  })

  it("renvoie null s'il n'y a rien ou si la sauvegarde est abîmée", () => {
    const stockage = fauxStockage()
    expect(charger(stockage, '1')).toBeNull()
    stockage.setItem(cleMonde('1'), '{pas du json')
    expect(charger(stockage, '1')).toBeNull()
    stockage.setItem(cleMonde('1'), JSON.stringify({ version: 999 }))
    expect(charger(stockage, '1')).toBeNull()
  })

  it('une partie d’avant la mine automatique (version 20 ou moins) repart de zéro', () => {
    const stockage = fauxStockage()
    stockage.setItem(cleMonde('1'), JSON.stringify({ version: 20, argent: 500, profondeur: 30 }))
    expect(charger(stockage, '1')).toBeNull()
    expect(partieAncienne(stockage, '1')).toBe(true)
    sauvegarder(stockage, '1', creerPartie(aleatoireAvecGraine(1)))
    expect(partieAncienne(stockage, '1')).toBe(false)
  })

  it('une partie de la version 21 garde tout : son wagonnet devient le trajet Mine → Marché', () => {
    const stockage = fauxStockage()
    const { niveauWagonnets: _niveau, trajets: _trajets, ...partie21 } = creerPartie(aleatoireAvecGraine(1))
    partie21.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false })
    for (let y = 35; y <= 39; y++) partie21.village.rails.push(`30,${y}`)
    stockage.setItem(cleMonde('1'), JSON.stringify({ ...partie21, version: 21, argent: 777, wagonnet: { niveau: 2, etape: 'aller', distance: 3, chargement: {}, pousseur: 'joueur' } }))
    expect(partieAncienne(stockage, '1')).toBe(false)
    const etat = charger(stockage, '1')
    expect(etat?.argent).toBe(777)
    expect(etat?.niveauWagonnets).toBe(2)
    expect(etat?.trajets.map((t) => t.liaison)).toEqual(['mine-marche'])
    expect(etat?.trajets[0].etape).toBe('quai')
  })

  it('une partie de la version 22 : les anciens pousseurs prennent le trajet Mine → Marché', () => {
    const stockage = fauxStockage()
    const partie22 = creerPartie(aleatoireAvecGraine(1)) as unknown as Record<string, unknown>
    partie22.version = 22
    partie22.trajets = [{ liaison: 'mine-marche', etape: 'quai', distance: 0, chargement: {}, pousseur: null }]
    partie22.employes = [
      { nom: 'Lou', rarete: 'commun', niveau: 0, role: 'pousseur', etape: 'quai', progression: 0, sac: {}, blocsCasses: 0, tempsPaye: 100, lieu: 'puits', depuis: 'puits', forgeEnAttente: false },
      { nom: 'Max', rarete: 'commun', niveau: 0, role: 'mineur', etape: 'creuse', progression: 0, sac: {}, blocsCasses: 0, tempsPaye: 100, lieu: 'puits', depuis: 'puits', forgeEnAttente: false },
    ]
    stockage.setItem(cleMonde('1'), JSON.stringify(partie22))
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
    expect(etat?.employes.map((e) => e.trajet)).toEqual(['mine-marche', null])
  })

  it('une partie de la version 23 reçoit l’XP du niveau qu’il faut pour ce qu’elle a déjà', () => {
    const stockage = fauxStockage()
    const partie23 = creerPartie(aleatoireAvecGraine(1)) as unknown as Record<string, unknown>
    delete partie23.xp
    delete partie23.recordsXp
    partie23.version = 23
    partie23.niveauMine = 3
    stockage.setItem(cleMonde('1'), JSON.stringify(partie23))
    const etat = charger(stockage, '1')
    expect(etat?.version).toBe(VERSION_ETAT)
    // (le niveau 3 de la mine demande le niveau 7 du joueur)
    expect(etat && niveauJoueur(etat)).toBe(7)
  })

  it('une partie avec des tenues et des décorations (retirées le 27/10) se charge sans elles', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    const ancienne = {
      ...etat,
      tenue: { chapeau: 'bandana', haut: null },
      tenuesAchetees: ['bandana'],
      succes: [...etat.succes, 'paysagiste'],
      village: { ...etat.village, decorations: [{ n: 1, id: 'buisson', x: 3, y: 3, miroir: false }], prochainNumero: 2 },
    }
    const stockage = fauxStockage()
    stockage.setItem(cleMonde('1'), JSON.stringify(ancienne))
    expect(charger(stockage, '1')).toEqual(etat)
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
    for (let i = 0; i < 30; i++) cliquerMine(etat, aleatoire)
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
