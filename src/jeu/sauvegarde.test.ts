import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { NIVEAU_JOUEUR_POUR, TAILLE_GRILLE } from './donnees'
import { VERSION_ETAT, cliquerMine, creerPartie, type EtatJeu } from './mineur'
import { niveauJoueur } from './niveaux'
import { embaucher } from './employes'
import { partieDeTest } from './partieDeTest'
import { POSITION_MINE, railsMineMarche } from './village'
import {
  ANCIENNE_CLE_SAUVEGARDE,
  NB_MONDES_MAX,
  charger,
  cleMonde,
  convertirVersion28,
  convertirVersion29,
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
    // Version 26 → 27 : l'émeraude s'intercale (4 → 5) ; puis 28 → 29 (25/10) : 5 pioches
    // (bois, fer, or, émeraude, diamant), le diamant reste le diamant (5 → 4) et l'or l'or (3 → 2).
    expect(charger(stockage, '1')?.employes.map((e) => e.niveau)).toEqual([4, 2, 4])
  })

  it('(23/10) version 27 : chaque pousseur reçoit un chariot comme son ancien wagonnet', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.argent = 100_000
    embaucher(etat, aleatoireAvecGraine(2))
    const mineur = etat.employes[0]
    const pousseur = { ...mineur, role: 'pousseur' as const, trajet: 'mine-marche' as const }
    const stockage = fauxStockage()
    // ancienne taille 70 places (niveau 2), pousseur « Expert » (×2) : 140 places → chariot de 110
    // (niveau 5 sur 7) ; ×1 : 70 → 58 (niveau 3 sur 7). Puis (25/10) 5 niveaux : 5 → 3, 3 → 2.
    sauvegarder(stockage, '1', { ...etat, version: 27, niveauWagonnets: 2, employes: [mineur, { ...pousseur, niveau: 3 }, { ...pousseur, nom: 'Zoé', niveau: 0 }] })
    const relue = charger(stockage, '1')!
    expect(relue.employes.map((e) => e.chariot)).toEqual([undefined, 3, 2])
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
    // (le village d'avant le 25/10 : 60 × 60 cases, la mine en 25, 25)
    partie21.village.batiments = [{ id: 'puits', x: 25, y: 25, miroir: false }, { id: 'marche', x: 28, y: 40, miroir: false }]
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
    // (le niveau 3 de la mine demande le niveau 5 du joueur, 25/10)
    expect(etat && niveauJoueur(etat)).toBe(NIVEAU_JOUEUR_POUR.mine[2])
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

// (25/10) La grande mise à jour : une partie de la version 28 (sac à dos, bazar, clairière de
// 60 × 60, améliorations jusqu'à 10 niveaux) est convertie.
describe('une partie de la version 28 (avant la grande mise à jour)', () => {
  // Une partie de la version 28 : la mine en (25, 25) sur une clairière de 60 × 60.
  function partie28(): Record<string, unknown> {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.niveauMine = 5
    etat.argent = 100
    embaucher(etat, aleatoireAvecGraine(2))
    etat.argent = 1000
    const mineur = { ...etat.employes[0], niveau: 5, lieu: 'bazar' as EtatJeu['employes'][number]['lieu'] } // pioche en diamant (6 niveaux)
    const pousseur = { ...etat.employes[0], nom: 'Zoé', role: 'pousseur' as const, trajet: 'mine-marche' as const, niveau: 4, chariot: 6 }
    const { gemmes: _gemmes, boosts: _boosts, quotidien: _quotidien, ...reste } = etat
    return {
      ...reste,
      version: 28,
      inventaire: { fer: 10, pierre: 5 }, // le sac : 10 × 12 + 5 × 1 = 125 $
      nonAVendre: ['fer'],
      niveauSac: 2,
      tutoriel: 3,
      ascenseur: { ...etat.ascenseur, niveau: 10 },
      foreuse: { ...etat.foreuse, niveauVitesse: 5, niveauChariot: 4 },
      manager: { embauche: true, tempsPaye: 300, niveau: 4, fatigue: 0 },
      employes: [mineur, pousseur],
      coffre: { niveau: 2, contenu: { pierre: 7 } },
      village: {
        ...etat.village,
        batiments: [
          { id: 'puits', x: 25, y: 25, miroir: false },
          { id: 'marche', x: 28, y: 40, miroir: false },
          { id: 'bazar', x: 40, y: 25, miroir: false },
          { id: 'forgeron', x: 55, y: 55, miroir: false }, // dans le coin : il ne tient plus
        ],
        // 5 rails de la mine au marché, et un rail tout au bord (hors de la nouvelle clairière)
        rails: ['30,35', '30,36', '30,37', '30,38', '30,39', '58,10'],
        chemins: ['12,12', '2,2'],
        batimentsVus: ['marche', 'bazar', 'forgeron'],
      },
      trajets: [],
    }
  }

  function charger28(): EtatJeu {
    const stockage = fauxStockage()
    stockage.setItem(cleMonde('1'), JSON.stringify(partie28()))
    const etat = charger(stockage, '1')
    if (!etat) throw new Error('la partie de la version 28 ne se charge pas')
    return etat
  }

  it('se charge à la version actuelle, avec 10 gemmes offertes et sans tutoriel', () => {
    const etat = charger28()
    expect(etat.version).toBe(VERSION_ETAT)
    expect(etat.gemmes).toBe(10)
    expect(etat.boosts).toEqual({})
    expect(etat.quotidien).toEqual({ dernierJour: null, serie: 0 })
    expect(etat.tutoriel).toBe(99)
  })

  it('le sac est vendu, et le bazar enlevé et remboursé (200 $)', () => {
    const etat = charger28()
    expect(etat).not.toHaveProperty('inventaire')
    expect(etat).not.toHaveProperty('nonAVendre')
    expect(etat).not.toHaveProperty('niveauSac')
    expect(etat.argent).toBe(1000 + 125 + 200)
    expect(etat.stats.argentGagne).toBe(125)
    expect(etat.village.batiments.map((b) => b.id)).not.toContain('bazar')
    expect(etat.village.batimentsVus).toEqual(['marche', 'forgeron'])
    // Un employé qui était au bazar revient à la mine.
    expect(etat.employes[0].lieu).toBe('puits')
  })

  it('le village recule de 10 cases ; un bâtiment qui ne tient plus est reposé près de la mine', () => {
    const etat = charger28()
    const pose = (id: string) => etat.village.batiments.find((b) => b.id === id)
    expect(pose('puits')).toMatchObject({ x: POSITION_MINE.x, y: POSITION_MINE.y })
    expect(pose('marche')).toMatchObject({ x: 18, y: 30 })
    const forgeron = pose('forgeron')!
    expect(forgeron.x).toBeGreaterThanOrEqual(0)
    expect(forgeron.y).toBeGreaterThanOrEqual(0)
    expect(forgeron.x + 5).toBeLessThanOrEqual(TAILLE_GRILLE)
    expect(forgeron.y + 5).toBeLessThanOrEqual(TAILLE_GRILLE)
    expect(Math.hypot(forgeron.x - POSITION_MINE.x, forgeron.y - POSITION_MINE.y)).toBeLessThan(15)
    // Les rails de la mine au marché suivent : la ligne est toujours entière.
    expect(railsMineMarche(etat.village)).toHaveLength(5)
    // Le chemin hors de la clairière est oublié.
    expect(etat.village.chemins).toEqual(['2,2'])
  })

  it('un rail hors de la nouvelle clairière est enlevé, et son fer rendu dans le coffre', () => {
    const etat = charger28()
    expect(etat.village.rails).toEqual(['20,25', '20,26', '20,27', '20,28', '20,29'])
    expect(etat.coffre.contenu).toEqual({ pierre: 7, fer: 3 })
  })

  it('les améliorations passent à 5 niveaux (le plus proche d’avant)', () => {
    const etat = charger28()
    expect(etat.ascenseur.niveau).toBe(5) // 10 → 5
    expect(etat.foreuse.niveauVitesse).toBe(4) // 5 → 4
    expect(etat.foreuse.niveauChariot).toBe(3) // 4 → 3
    expect(etat.manager.niveau).toBe(2) // 4 → 2
    expect(etat.employes[0].niveau).toBe(4) // la pioche en diamant reste le diamant
    expect(etat.employes[1]).toMatchObject({ niveau: 4, chariot: 4 }) // chariot 6 → 4
  })

  it('ne touche pas aux autres versions', () => {
    const actuelle = creerPartie(aleatoireAvecGraine(1))
    expect(convertirVersion28(actuelle)).toBe(actuelle)
    expect(convertirVersion28(null)).toBeNull()
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

// (26/10) La grosse mise à jour des gemmes : la mine a 7 niveaux, le saphir au 5, le rubis au 6
// et le diamant au 7. Un joueur qui était au niveau 5 (le diamant) garde son niveau 5, qui est
// maintenant le saphir : ses diamants deviennent des saphirs, et ses pioches en diamant aussi
// (le même niveau de pioche, qui s'appelle maintenant « Saphir »).
describe('une partie de la version 29 (avant le saphir et le rubis)', () => {
  function partie29(): EtatJeu {
    const etat = partieDeTest(aleatoireAvecGraine(1)) as Omit<EtatJeu, 'fonderie' | 'joaillerie'> & Partial<EtatJeu>
    etat.version = 29
    etat.niveauMine = 5
    etat.meilleure = 4
    etat.coffre.contenu = { pierre: 10, diamant: 7 }
    etat.coffre.garder = { diamant: 3 }
    etat.foreuse.chariot = { diamant: 2 }
    delete etat.fonderie
    delete etat.joaillerie
    return etat as EtatJeu
  }

  function charger29(etat: EtatJeu): EtatJeu {
    const stockage = fauxStockage()
    stockage.setItem(cleMonde('1'), JSON.stringify(etat))
    const chargee = charger(stockage, '1')
    if (!chargee) throw new Error('la partie de la version 29 ne se charge pas')
    return chargee
  }

  it('se charge à la version actuelle, avec une fonderie et une joaillerie vides', () => {
    const etat = charger29(partie29())
    expect(etat.version).toBe(VERSION_ETAT)
    expect(etat.niveauMine).toBe(5)
    expect(etat.fonderie).toMatchObject({ niveau: 0, entree: {}, sortie: {} })
    expect(etat.joaillerie).toMatchObject({ niveau: 0, entree: {}, sortie: {} })
  })

  it('les diamants deviennent des saphirs, partout', () => {
    const avant = partie29()
    avant.village.batiments.push({ id: 'employes', x: 9, y: 21, miroir: false })
    avant.argent = 1000
    embaucher(avant, aleatoireAvecGraine(2))
    avant.employes[0].sac = { diamant: 4 }
    avant.employes[0].niveau = 4
    const etat = charger29(avant)
    expect(etat.coffre.contenu).toEqual({ pierre: 10, saphir: 7 })
    expect(etat.coffre.garder).toEqual({ saphir: 3 })
    expect(etat.foreuse.chariot).toEqual({ saphir: 2 })
    expect(etat.employes[0].sac).toEqual({ saphir: 4 })
    expect(etat.employes[0].niveau).toBe(4) // sa pioche est maintenant en saphir
    expect(etat.meilleure).toBe(4)
  })

  it('ne touche pas aux autres versions', () => {
    const actuelle = creerPartie(aleatoireAvecGraine(1))
    expect(convertirVersion29(actuelle)).toBe(actuelle)
    expect(convertirVersion29(null)).toBeNull()
  })
})
