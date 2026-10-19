import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine, type Aleatoire } from './aleatoire'
import { LARGEUR_MINE, PIOCHES } from './donnees'
import {
  acheterPioche,
  acheterSac,
  apercuVente,
  allerA,
  ameliorerAscenseur,
  appelerAscenseur,
  ascenseurDisponible,
  basculerVente,
  casserBloc,
  aLaSurface,
  auFond,
  creerPartie,
  deplacerMineur,
  devisReparation,
  enchanter,
  envoyerAscenseur,
  equiper,
  estCassee,
  indexBlocActuel,
  arreterSurEchelle,
  nbDansSac,
  prendreAscenseur,
  prestige,
  positionFront,
  reparer,
  vendre,
  vitesse,
  type EtatJeu,
} from './mineur'
import { verifierSucces } from './succes'
import { avancerTemps as avancerTempsAvecAleatoire } from './temps'

const avancerTemps = (etat: EtatJeu, secondes: number) => avancerTempsAvecAleatoire(etat, secondes, aleatoireAvecGraine(1))

// Un « aléatoire » qui renvoie toujours la même valeur : pratique pour tester une règle précise.
const toujours = (valeur: number): Aleatoire => () => valeur

// Place le front de taille à une profondeur donnée, avec le joueur dessus.
function placerAuFront(etat: EtatJeu, profondeur: number) {
  etat.profondeur = profondeur
  etat.position = positionFront(etat)
  etat.cible = etat.position
}

// Construit l'ascenseur (au niveau donné), avec sa cabine là où se trouve le joueur.
function construireAscenseur(etat: EtatJeu, niveau: number) {
  etat.ascenseur.niveau = niveau
  etat.ascenseur.position = etat.position
  etat.ascenseur.cible = etat.position
}

// Une partie neuve, avec le joueur déjà au front de taille.
function nouvellePartie(): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(42))
  placerAuFront(etat, etat.profondeur)
  return etat
}

// Le même joueur, mais au village (pour vendre et acheter).
function partieALaSurface(): EtatJeu {
  const etat = nouvellePartie()
  etat.position = 0
  etat.cible = 0
  return etat
}

// Remplit la couche en cours avec un seul type de bloc.
function coucheDe(etat: EtatJeu, bloc: EtatJeu['coucheActuelle'][number]) {
  etat.coucheActuelle = Array(LARGEUR_MINE).fill(bloc)
}

describe('début de partie', () => {
  it('commence à la surface avec une pioche en bois et 0 $', () => {
    const etat = creerPartie(aleatoireAvecGraine(42))
    expect(etat.position).toBe(0)
    expect(etat.profondeur).toBe(2) // le premier mètre est l'entrée du puits
    expect(etat.pioches).toEqual({ 0: 0 })
    expect(etat.argent).toBe(0)
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
    expect(etat.profondeur).toBe(3)
    expect(etat.coucheActuelle).toEqual(dessous)
  })

  it('creuse une galerie à la profondeur max de la pioche', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, PIOCHES[0].profMax)
    coucheDe(etat, 'pierre')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.profondeur).toBe(30)
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

  it('atteint la bedrock avec la pioche en netherite, et peut continuer de creuser au-dessus', () => {
    const etat = nouvellePartie()
    etat.pioches[4] = 0
    etat.niveauPioche = 4
    placerAuFront(etat, 127)
    coucheDe(etat, 'deepslate')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, toujours(0.5))
    expect(etat.victoire).toBe(true)
    expect(etat.profondeur).toBe(127) // la bedrock est juste en dessous
    expect(etat.enGalerie).toBe(true)
    // On continue de creuser des galeries sur la dernière couche.
    const avant = etat.stats.blocsCasses
    casserBloc(etat, toujours(0.5))
    expect(etat.stats.blocsCasses).toBe(avant + 1)
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
    placerAuFront(etat, 20)
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

  it('applique le bonus de prestige (+15 % par niveau)', () => {
    const etat = partieALaSurface()
    etat.prestige = 2
    etat.inventaire = { pierre: 100 }
    vendre(etat)
    expect(etat.argent).toBe(130)
  })

  it('le prestige rend aussi les pioches plus rapides (+10 % par niveau)', () => {
    const etat = nouvellePartie()
    const vitesseDeBase = vitesse(etat)
    etat.prestige = 3
    expect(vitesse(etat)).toBeCloseTo(vitesseDeBase * 1.3)
  })
})

describe('échelle et déplacements', () => {
  it('descend avec le front de taille quand une couche est finie', () => {
    const etat = nouvellePartie()
    const avant = etat.position
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.position).toBe(avant + 1)
  })

  it('remonte au village en un temps qui dépend de la profondeur', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 21) // le front est à 20 m sous le village
    allerA(etat, 0)
    avancerTemps(etat, 1.5)
    expect(etat.position).toBeCloseTo(10) // 1,5 s à 0,15 s par mètre
    avancerTemps(etat, 1.5)
    expect(etat.position).toBe(0)
    expect(aLaSurface(etat)).toBe(true)
  })

  it('avance tant qu’on garde la flèche appuyée, et s’arrête sur le barreau suivant', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 21) // front à 20 m
    allerA(etat, 0) // on appuie sur ↑
    avancerTemps(etat, 0.5) // 3,33 m parcourus
    arreterSurEchelle(etat) // on relâche
    expect(etat.cible).toBe(16)
    avancerTemps(etat, 10)
    expect(etat.position).toBe(16)
  })

  it('bouge d’un barreau avec un appui très court', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 21)
    allerA(etat, 0)
    arreterSurEchelle(etat)
    expect(etat.cible).toBe(19)
    allerA(etat, 100) // on ne descend jamais sous le front de taille
    expect(etat.cible).toBe(20)
  })

  it('ne creuse que depuis le front de taille', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 10)
    allerA(etat, 5)
    expect(casserBloc(etat, toujours(0))).toEqual([]) // il est sur l'échelle
    avancerTemps(etat, 100)
    expect(casserBloc(etat, toujours(0))).toEqual([])
    expect(etat.stats.blocsCasses).toBe(0)
  })

  it('redescend au front, à la même profondeur', () => {
    const etat = partieALaSurface()
    placerAuFront(etat, 12)
    etat.position = 0
    etat.cible = 0
    allerA(etat, positionFront(etat))
    avancerTemps(etat, 100)
    expect(auFond(etat)).toBe(true)
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
  it('se construit puis s’améliore avec du fer et de la redstone, directement dans la mine', () => {
    const etat = nouvellePartie()
    etat.inventaire = { fer: 60, redstone: 25 }
    ameliorerAscenseur(etat) // niveau 1 : 10 fer + 5 redstone
    expect(etat.ascenseur.niveau).toBe(1)
    ameliorerAscenseur(etat) // niveau 2 : 40 fer + 15 redstone
    expect(etat.ascenseur.niveau).toBe(2)
    expect(etat.inventaire).toEqual({ fer: 10, redstone: 5 })
    ameliorerAscenseur(etat) // niveau 3 : pas assez de fer
    expect(etat.ascenseur.niveau).toBe(2)
  })

  it('remonte le sac, le vend en haut et redescend au front de taille', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 26) // le front est à 25 m sous le village
    construireAscenseur(etat, 1)
    etat.inventaire = { fer: 10, diamant: 2 }
    etat.ascenseur.garder = ['diamant'] // décoché : il reste dans le sac
    envoyerAscenseur(etat)
    expect(etat.inventaire).toEqual({ diamant: 2 })
    expect(ascenseurDisponible(etat)).toBe(false)

    avancerTemps(etat, 2.5) // 25 m à 0,1 s par mètre : arrivé en haut, il vend
    expect(etat.argent).toBe(120)
    avancerTemps(etat, 2.5) // redescendu jusqu'au joueur
    expect(ascenseurDisponible(etat)).toBe(true)
  })

  it('ne prend pas plus que sa capacité, les objets les plus précieux d’abord', () => {
    const etat = nouvellePartie()
    construireAscenseur(etat, 1) // 32 objets par voyage
    etat.inventaire = { pierre: 30, diamant: 5 }
    envoyerAscenseur(etat)
    expect(etat.ascenseur.chargement).toEqual({ diamant: 5, pierre: 27 })
    expect(etat.inventaire).toEqual({ pierre: 3 })
  })

  it('emmène le mineur au village, avec les minerais cochés', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 51) // front à 50 m
    construireAscenseur(etat, 1)
    etat.inventaire = { fer: 10, lapis: 4 }
    etat.ascenseur.garder = ['lapis']
    prendreAscenseur(etat, 0)
    avancerTemps(etat, 2.5)
    expect(etat.position).toBeCloseTo(25) // à mi-chemin, avec la cabine
    avancerTemps(etat, 2.5)
    expect(aLaSurface(etat)).toBe(true)
    expect(etat.argent).toBe(120) // le fer a été vendu en arrivant
    expect(etat.inventaire).toEqual({ lapis: 4 })
    // L'échelle aurait pris 50 × 0,15 = 7,5 s : l'ascenseur est plus rapide.
  })

  it('se laisse appeler, puis redescend le mineur au front', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 31)
    construireAscenseur(etat, 1)
    etat.position = 0
    etat.cible = 0
    appelerAscenseur(etat)
    avancerTemps(etat, 10)
    expect(ascenseurDisponible(etat)).toBe(true)
    prendreAscenseur(etat, positionFront(etat))
    avancerTemps(etat, 10)
    expect(auFond(etat)).toBe(true)
  })

  it('suit le front de taille quand on descend', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 10)
    construireAscenseur(etat, 1)
    coucheDe(etat, 'pierre')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.ascenseur.position).toBe(10)
    expect(ascenseurDisponible(etat)).toBe(true)
  })

  it('garde les blocs sur son quai quand le sac est plein : on ne perd rien', () => {
    const etat = nouvellePartie()
    construireAscenseur(etat, 1)
    etat.inventaire = { pierre: 32 }
    coucheDe(etat, 'fer')
    casserBloc(etat, toujours(0))
    expect(etat.ascenseur.quai).toEqual({ fer: 1 })
    envoyerAscenseur(etat)
    expect(etat.ascenseur.chargement.fer).toBe(1) // le quai part en premier
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

describe('prestige et succès', () => {
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
