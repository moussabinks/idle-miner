import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine, type Aleatoire } from './aleatoire'
import { LARGEUR_MINE, PIOCHES } from './donnees'
import {
  acheterAscenseur,
  acheterPioche,
  acheterSac,
  apercuVente,
  ascenseurDisponible,
  avancerTemps,
  basculerVente,
  casserBloc,
  creerPartie,
  deplacerMineur,
  descendreDansLaMine,
  devisReparation,
  enchanter,
  envoyerAscenseur,
  equiper,
  estCassee,
  fabriquerTorches,
  indexBlocActuel,
  monterALaSurface,
  nbDansSac,
  prestige,
  profondeurDuJoueur,
  reparer,
  vendre,
  vision,
  vitesse,
  type EtatJeu,
} from './mineur'
import { verifierSucces } from './succes'

// Un « aléatoire » qui renvoie toujours la même valeur : pratique pour tester une règle précise.
const toujours = (valeur: number): Aleatoire => () => valeur

// Une partie neuve, avec le joueur déjà au fond de la mine.
function nouvellePartie(): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(42))
  etat.lieu = 'mine'
  return etat
}

// Le même joueur, mais à la surface (pour vendre et acheter).
function partieALaSurface(): EtatJeu {
  const etat = nouvellePartie()
  etat.lieu = 'surface'
  return etat
}

// Remplit la couche en cours avec un seul type de bloc.
function coucheDe(etat: EtatJeu, bloc: EtatJeu['coucheActuelle'][number]) {
  etat.coucheActuelle = Array(LARGEUR_MINE).fill(bloc)
}

describe('début de partie', () => {
  it('commence à la surface avec une pioche en bois, 0 $ et 6 torches', () => {
    const etat = creerPartie(aleatoireAvecGraine(42))
    expect(etat.lieu).toBe('surface')
    expect(etat.pioches).toEqual({ 0: 0 })
    expect(etat.argent).toBe(0)
    expect(etat.torches).toBe(6)
    expect(etat.profondeur).toBe(1)
    expect(etat.coucheActuelle).toHaveLength(LARGEUR_MINE)
  })
})

describe('minage', () => {
  it('met le bloc dans le sac et use la pioche', () => {
    const etat = nouvellePartie()
    coucheDe(etat, 'pierre')
    casserBloc(etat, toujours(0))
    expect(etat.inventaire.pierre).toBe(1)
    expect(etat.pioches[0]).toBe(1)
    expect(etat.coucheActuelle[0]).toBeNull()
  })

  it('descend d’un mètre une fois la couche finie', () => {
    const etat = nouvellePartie()
    const dessous = etat.couchesDessous[0]
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.profondeur).toBe(2)
    expect(etat.coucheActuelle).toEqual(dessous)
  })

  it('creuse une galerie à la profondeur max de la pioche', () => {
    const etat = nouvellePartie()
    etat.profondeur = PIOCHES[0].profMax
    coucheDe(etat, 'pierre')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.profondeur).toBe(15)
    expect(etat.enGalerie).toBe(true)
    expect(etat.coucheActuelle.every((b) => b !== null)).toBe(true)
  })

  it('mine à mains nues avec une pioche cassée, et garde les blocs', () => {
    const etat = nouvellePartie()
    etat.pioches[0] = PIOCHES[0].durabilite
    expect(estCassee(etat)).toBe(true)
    expect(vitesse(etat)).toBe(1)
    coucheDe(etat, 'terre')
    casserBloc(etat, toujours(0))
    expect(etat.inventaire.terre).toBe(1)
  })

  it('ne remplit pas le sac au-delà de sa taille', () => {
    const etat = nouvellePartie()
    etat.inventaire = { pierre: 32 }
    coucheDe(etat, 'pierre')
    const messages = casserBloc(etat, toujours(0))
    expect(nbDansSac(etat)).toBe(32)
    expect(messages.join()).toContain('Sac plein')
  })

  it('atteint la bedrock avec la pioche en netherite', () => {
    const etat = nouvellePartie()
    etat.pioches[4] = 0
    etat.niveauPioche = 4
    etat.profondeur = 63
    coucheDe(etat, 'deepslate')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, toujours(0.5))
    expect(etat.victoire).toBe(true)
    expect(etat.profondeur).toBe(64)
  })

  it('pose une torche tous les 5 m', () => {
    const etat = nouvellePartie()
    etat.profondeur = 4
    coucheDe(etat, 'pierre')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.profondeur).toBe(5)
    expect(etat.torches).toBe(5)
    expect(etat.torchesPosees).toEqual([5])
  })
})

describe('blocs spéciaux', () => {
  it('la lave sans seau brûle un tiers de chaque pile', () => {
    const etat = nouvellePartie()
    etat.inventaire = { pierre: 9, fer: 3 }
    coucheDe(etat, 'lave')
    casserBloc(etat, toujours(0))
    expect(etat.inventaire).toEqual({ pierre: 6, fer: 2 })
  })

  it('la lave avec un seau donne de l’obsidienne', () => {
    const etat = nouvellePartie()
    etat.seaux = 1
    coucheDe(etat, 'lave')
    casserBloc(etat, toujours(0))
    expect(etat.seaux).toBe(0)
    expect(etat.inventaire.obsidienne).toBe(1)
  })

  it('le coffre donne de l’argent et un minerai', () => {
    const etat = nouvellePartie()
    etat.profondeur = 20
    coucheDe(etat, 'coffre')
    casserBloc(etat, toujours(0))
    // Avec l'aléatoire au minimum : 20 $ + 20 m × 3 $.
    expect(etat.argent).toBe(80)
    expect(nbDansSac(etat)).toBe(1)
  })

  it('la géode donne 3 à 6 améthystes', () => {
    const etat = nouvellePartie()
    coucheDe(etat, 'geode')
    casserBloc(etat, toujours(0.99))
    expect(etat.inventaire.amethyste).toBe(6)
  })
})

describe('vente', () => {
  it('« Vendre tout » vend tout le sac, diamants compris', () => {
    const etat = partieALaSurface()
    etat.inventaire = { pierre: 10, fer: 2, diamant: 1 }
    vendre(etat)
    expect(etat.argent).toBe(10 + 24 + 100)
    expect(etat.inventaire).toEqual({})
  })

  it('garde les objets décochés', () => {
    const etat = partieALaSurface()
    etat.inventaire = { pierre: 10, diamant: 3, lapis: 2 }
    basculerVente(etat, 'diamant')
    basculerVente(etat, 'lapis')
    expect(apercuVente(etat)).toBe(10)
    vendre(etat)
    expect(etat.inventaire).toEqual({ diamant: 3, lapis: 2 })
    basculerVente(etat, 'lapis') // on recoche le lapis
    expect(etat.nonAVendre).toEqual(['diamant'])
  })

  it('ne vend rien au fond de la mine', () => {
    const etat = nouvellePartie()
    etat.inventaire = { pierre: 10 }
    vendre(etat)
    expect(etat.argent).toBe(0)
    expect(etat.inventaire).toEqual({ pierre: 10 })
  })

  it('applique le bonus de prestige (+25 % par niveau)', () => {
    const etat = partieALaSurface()
    etat.prestige = 2
    etat.inventaire = { pierre: 10 }
    vendre(etat)
    expect(etat.argent).toBe(15)
  })
})

describe('échelle et déplacements', () => {
  it('monte à la surface en un temps qui dépend de la profondeur', () => {
    const etat = nouvellePartie()
    etat.profondeur = 20
    monterALaSurface(etat)
    expect(etat.trajet?.tempsTotal).toBeCloseTo(3) // 20 m × 0,15 s
    avancerTemps(etat, 1.5)
    expect(etat.lieu).toBe('mine')
    expect(profondeurDuJoueur(etat)).toBe(10) // à mi-chemin
    avancerTemps(etat, 1.5)
    expect(etat.lieu).toBe('surface')
    expect(etat.trajet).toBeNull()
  })

  it('ne creuse pas pendant qu’on grimpe ni à la surface', () => {
    const etat = nouvellePartie()
    monterALaSurface(etat)
    expect(casserBloc(etat, toujours(0))).toEqual([])
    avancerTemps(etat, 100)
    expect(casserBloc(etat, toujours(0))).toEqual([])
    expect(etat.stats.blocsCasses).toBe(0)
  })

  it('redescend au fond, à la même profondeur', () => {
    const etat = partieALaSurface()
    etat.profondeur = 12
    descendreDansLaMine(etat)
    avancerTemps(etat, 100)
    expect(etat.lieu).toBe('mine')
    expect(etat.profondeur).toBe(12)
  })

  it('se déplace à gauche et à droite et casse le bloc sous le mineur', () => {
    const etat = nouvellePartie()
    etat.coucheActuelle = ['pierre', 'pierre', 'pierre', 'pierre', 'fer', 'pierre']
    deplacerMineur(etat, +1)
    deplacerMineur(etat, -1)
    deplacerMineur(etat, -1) // bloqué au bord
    expect(etat.colonneMineur).toBe(0)
    for (let i = 0; i < 4; i++) deplacerMineur(etat, +1)
    casserBloc(etat, toujours(0))
    expect(etat.inventaire).toEqual({ fer: 1 })
    expect(etat.coucheActuelle[4]).toBeNull()
  })

  it('va au bloc le plus proche si la case sous le mineur est déjà creusée', () => {
    const etat = nouvellePartie()
    etat.coucheActuelle = ['pierre', null, null, 'fer', null, 'terre']
    etat.colonneMineur = 2
    expect(indexBlocActuel(etat)).toBe(3)
  })
})

describe('ascenseur', () => {
  it('s’achète à la surface avec de la redstone', () => {
    const etat = partieALaSurface()
    etat.argent = 300
    etat.inventaire = { redstone: 12 }
    acheterAscenseur(etat)
    expect(etat.ascenseur.possede).toBe(true)
    expect(etat.argent).toBe(50)
    expect(etat.inventaire).toEqual({ redstone: 2 })
  })

  it('remonte le sac, le vend en haut et redescend au niveau du joueur', () => {
    const etat = nouvellePartie()
    etat.ascenseur.possede = true
    etat.profondeur = 25
    etat.inventaire = { fer: 10, diamant: 2 }
    etat.nonAVendre = ['diamant']
    envoyerAscenseur(etat)
    expect(etat.inventaire).toEqual({ diamant: 2 })
    expect(etat.ascenseur.tempsTotal).toBeCloseTo(4) // 2 × 25 m × 0,08 s
    expect(ascenseurDisponible(etat)).toBe(false)

    avancerTemps(etat, 2) // arrivé en haut : il vend
    expect(etat.argent).toBe(120)
    avancerTemps(etat, 2) // redescendu
    expect(ascenseurDisponible(etat)).toBe(true)
  })
})

describe('pioches et réparation', () => {
  it('débloque la pioche suivante et l’équipe', () => {
    const etat = partieALaSurface()
    etat.argent = 50
    acheterPioche(etat, 1)
    expect(etat.argent).toBe(10)
    expect(etat.niveauPioche).toBe(1)
    expect(etat.meilleure).toBe(1)
  })

  it('ne saute pas de niveau et demande les matériaux', () => {
    const etat = partieALaSurface()
    etat.argent = 10000
    expect(acheterPioche(etat, 2)).toEqual([])
    etat.meilleure = 2
    expect(acheterPioche(etat, 3)).toEqual([]) // il manque les 3 diamants
    etat.inventaire = { diamant: 3 }
    acheterPioche(etat, 3)
    expect(etat.meilleure).toBe(3)
    expect(etat.inventaire).toEqual({})
  })

  it('peut racheter et rééquiper une ancienne pioche', () => {
    const etat = partieALaSurface()
    etat.argent = 50
    acheterPioche(etat, 1)
    equiper(etat, 0)
    expect(etat.niveauPioche).toBe(0)
    etat.pioches[0] = 60
    acheterPioche(etat, 0)
    expect(etat.pioches[0]).toBe(0)
  })

  it('répare 25 % par unité et achète le matériau manquant au double du prix', () => {
    const etat = partieALaSurface()
    etat.pioches = { 2: 250 }
    etat.niveauPioche = 2
    etat.inventaire = { fer: 1 }
    const devis = devisReparation(etat)
    expect(devis).toMatchObject({ unites: 4, dansLeSac: 1, aAcheter: 3, cout: 3 * 24 })
    etat.argent = 100
    reparer(etat)
    expect(etat.pioches[2]).toBe(0)
    expect(etat.argent).toBe(28)
    expect(etat.inventaire).toEqual({})
  })
})

describe('boutique et enchantements', () => {
  it('achète un sac plus grand', () => {
    const etat = partieALaSurface()
    etat.argent = 80
    acheterSac(etat)
    expect(etat.niveauSac).toBe(1)
    expect(etat.argent).toBe(0)
  })

  it('fabrique 4 torches avec 1 charbon', () => {
    const etat = nouvellePartie()
    etat.inventaire = { charbon: 1 }
    fabriquerTorches(etat)
    expect(etat.torches).toBe(10)
  })

  it('enchante avec des lapis et des émeraudes (coût × niveau)', () => {
    const etat = partieALaSurface()
    etat.inventaire = { lapis: 12, emeraude: 3 }
    enchanter(etat, 'efficacite') // niveau I : 4 lapis + 1 émeraude
    enchanter(etat, 'efficacite') // niveau II : 8 lapis + 2 émeraudes
    expect(etat.enchantements.efficacite).toBe(2)
    expect(etat.inventaire).toEqual({})
    expect(vitesse(etat)).toBe(2 * 1.5)
  })

  it('fortune donne plusieurs minerais', () => {
    const etat = nouvellePartie()
    etat.enchantements.fortune = 3
    coucheDe(etat, 'fer')
    casserBloc(etat, toujours(0.99))
    expect(etat.inventaire.fer).toBe(4)
  })
})

describe('vision, prestige et succès', () => {
  it('voit 5 couches près d’une torche, 2 dans le noir', () => {
    const etat = nouvellePartie()
    etat.profondeur = 12
    etat.torchesPosees = [10]
    expect(vision(etat)).toBe(5)
    etat.profondeur = 17
    expect(vision(etat)).toBe(2)
  })

  it('le prestige recommence en gardant les succès', () => {
    const etat = nouvellePartie()
    etat.stats.blocsCasses = 1
    verifierSucces(etat)
    const suite = prestige(etat, aleatoireAvecGraine(1))
    expect(suite.prestige).toBe(1)
    expect(suite.succes).toContain('premier_bloc')
    expect(suite.stats.blocsCasses).toBe(0)
  })

  it('ne débloque un succès qu’une seule fois', () => {
    const etat = nouvellePartie()
    etat.stats.blocsCasses = 1
    expect(verifierSucces(etat).map((s) => s.id)).toEqual(['premier_bloc'])
    expect(verifierSucces(etat)).toEqual([])
  })
})
