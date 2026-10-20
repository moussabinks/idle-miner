import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine, type Aleatoire } from './aleatoire'
import { LARGEUR_MINE, PIOCHES, profondeurBedrock, profondeurMaxPioche } from './donnees'
import {
  argentGagneTotal,
  acheterPioche,
  acheterSac,
  sacBloqueAuPrestige,
  tailleSac,
  prixProchainSac,
  apercuVente,
  allerA,
  ameliorerAscenseur,
  ascenseurBloqueAuPrestige,
  niveauAscenseur,
  peutAmeliorerAscenseur,
  appelerAscenseur,
  ascenseurDisponible,
  basculerVente,
  vendreLot,
  secondesAvantArretAscenseur,
  voyager,
  basculerChargement,
  demanderEnvoi,
  nbAEnvoyer,
  avancerAscenseur,
  casserBloc,
  nbDrops,
  sensDeMinage,
  aLaSurface,
  auFond,
  creerPartie,
  deplacerMineur,
  coutReparation,
  enchanter,
  enchantementBloqueAuPrestige,
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
  it('creuse en zigzag : il regarde vers la droite, puis vers la gauche à la couche suivante', () => {
    const etat = nouvellePartie()
    coucheDe(etat, 'pierre')
    etat.colonneMineur = 0
    expect(sensDeMinage(etat)).toBe(1)
    // Arrivé au bout à droite, il ne reste qu'un bloc ; la couche suivante repart vers la gauche.
    coucheDe(etat, 'pierre')
    etat.colonneMineur = LARGEUR_MINE - 1
    expect(sensDeMinage(etat)).toBe(-1)
  })

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
    placerAuFront(etat, profondeurMaxPioche(0, etat.prestige))
    coucheDe(etat, 'pierre')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, aleatoireAvecGraine(i))
    expect(etat.profondeur).toBe(profondeurMaxPioche(0, etat.prestige))
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
    casserBloc(etat, toujours(0))
    expect(nbDansSac(etat)).toBe(32)
    // Le bloc n'est pas cassé : sinon ce qu'il contient serait perdu.
    expect(etat.coucheActuelle.every((bloc) => bloc !== null)).toBe(true)
    expect(etat.stats.blocsCasses).toBe(0)
  })

  it('atteint la bedrock avec la pioche en netherite, et peut continuer de creuser au-dessus', () => {
    const etat = nouvellePartie()
    etat.pioches[4] = 0
    etat.niveauPioche = 4
    placerAuFront(etat, profondeurBedrock(0) - 1)
    coucheDe(etat, 'deepslate')
    for (let i = 0; i < LARGEUR_MINE; i++) casserBloc(etat, toujours(0.5))
    expect(etat.victoire).toBe(true)
    expect(etat.profondeur).toBe(profondeurBedrock(0) - 1) // la bedrock est juste en dessous
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

describe('vendre ou envoyer une partie seulement', () => {
  it('vend seulement les quantités choisies au marché', () => {
    const etat = partieALaSurface()
    etat.inventaire = { fer: 10, or: 3 }
    vendreLot(etat, { fer: 4, or: 99 }) // on ne peut pas vendre plus qu'on n'a
    expect(etat.inventaire).toEqual({ fer: 6 })
    expect(etat.argent).toBe(4 * 12 + 3 * 35)
  })

  it('l’ascenseur emporte seulement le lot choisi', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    construireAscenseur(etat, 1)
    etat.inventaire = { fer: 10, charbon: 8 }
    expect(nbAEnvoyer(etat, { fer: 3 })).toBe(3)
    demanderEnvoi(etat, { fer: 3 })
    expect(etat.ascenseur.chargement).toEqual({ fer: 3 })
    expect(etat.inventaire).toEqual({ fer: 7, charbon: 8 })
  })

  it('le lot est gardé si la cabine doit d’abord venir', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    construireAscenseur(etat, 1)
    etat.ascenseur.position = 0
    etat.ascenseur.cible = 0
    etat.inventaire = { fer: 10 }
    demanderEnvoi(etat, { fer: 2 })
    avancerAscenseur(etat, 60)
    expect(etat.ascenseur.chargement).toEqual({ fer: 2 })
    expect(etat.ascenseur.lotDemande).toBeNull()
  })
})

describe('quitter le front de taille', () => {
  it('le mineur marche jusqu’à l’échelle avant de monter (pas de téléportation)', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    etat.colonneMineur = 5
    voyager(etat, 0)
    expect(etat.depart).not.toBeNull()
    expect(etat.cible).toBe(etat.position) // il ne grimpe pas encore
    avancerTemps(etat, 0.3) // 0,3 s = 2 cases
    expect(etat.colonneMineur).toBe(3)
    expect(etat.cible).toBe(etat.position)
    avancerTemps(etat, 0.4) // il arrive au puits et commence à monter
    expect(etat.colonneMineur).toBe(0)
    expect(etat.depart).toBeNull()
    expect(etat.cible).toBe(0)
  })

  it('il ne creuse pas pendant qu’il marche, et peut changer d’avis', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    coucheDe(etat, 'pierre')
    etat.colonneMineur = 4
    voyager(etat, 0)
    expect(casserBloc(etat, toujours(0))).toEqual([])
    deplacerMineur(etat, +1)
    expect(etat.depart).toBeNull()
  })

  it('au bout du chemin, il prend l’ascenseur s’il est là', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    construireAscenseur(etat, 1)
    etat.colonneMineur = 2
    voyager(etat, 0)
    avancerTemps(etat, 0.3)
    expect(etat.ascenseur.passager).toBe(true)
  })
})

describe('ascenseur', () => {
  it('dit dans combien de temps il revient au front après avoir vendu', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 21) // front à 20 m
    construireAscenseur(etat, 1) // 0,1 s par mètre
    etat.inventaire = { fer: 2 }
    expect(secondesAvantArretAscenseur(etat)).toBe(0)
    demanderEnvoi(etat)
    expect(secondesAvantArretAscenseur(etat)).toBeCloseTo((20 + 20) * 0.1)
  })

  it('« Envoyer à la surface » : seulement les objets cochés, dans la limite de la cabine', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    construireAscenseur(etat, 1) // 32 places
    etat.inventaire = { fer: 30, pierre: 10, diamant: 1 }
    basculerChargement(etat, 'pierre') // la pierre reste dans le sac
    expect(nbAEnvoyer(etat)).toBe(31)
    demanderEnvoi(etat)
    expect(etat.ascenseur.chargement).toEqual({ diamant: 1, fer: 30 })
    expect(etat.inventaire).toEqual({ pierre: 10 })
  })

  it('« Envoyer à la surface » appelle la cabine si elle n’est pas là, puis elle repart chargée', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 20)
    construireAscenseur(etat, 1)
    etat.ascenseur.position = 0 // la cabine attend au village
    etat.ascenseur.cible = 0
    etat.inventaire = { fer: 5 }
    demanderEnvoi(etat)
    expect(etat.ascenseur.cible).toBe(etat.position)
    avancerAscenseur(etat, 60) // elle arrive...
    expect(etat.ascenseur.chargement).toEqual({ fer: 5 }) // ... et repart aussitôt
    expect(etat.ascenseur.cible).toBe(0)
    expect(etat.inventaire).toEqual({})
  })

  it('se construit puis s’améliore avec un peu d’argent et beaucoup de fer et de redstone, dans la mine', () => {
    const etat = nouvellePartie()
    etat.prestige = 1 // pour avoir le droit au niveau 3
    etat.argent = 5000
    etat.inventaire = { fer: 30, redstone: 5 }
    ameliorerAscenseur(etat) // niveau 1 : 250 $ + 8 fer (pas besoin de redstone)
    expect(etat.ascenseur.niveau).toBe(1)
    ameliorerAscenseur(etat) // niveau 2 : 1 200 $ + 15 fer + 5 redstone
    expect(etat.ascenseur.niveau).toBe(2)
    expect(etat.argent).toBe(3550)
    expect(etat.inventaire).toEqual({ fer: 7 })
    ameliorerAscenseur(etat) // niveau 3 : l'argent suffit, mais pas le fer et la redstone
    expect(etat.ascenseur.niveau).toBe(2)
  })

  it('a 6 niveaux, jusqu’à 1 024 objets par voyage, débloqués petit à petit par les prestiges', () => {
    const etat = nouvellePartie()
    etat.argent = 1_000_000
    etat.inventaire = { fer: 500, redstone: 500 }
    // Au prestige 0 : niveau 2 au plus, même avec plein d'argent.
    while (peutAmeliorerAscenseur(etat)) ameliorerAscenseur(etat)
    expect(etat.ascenseur.niveau).toBe(2)
    expect(ascenseurBloqueAuPrestige(etat)).toBe(1)
    // Puis un niveau de plus par prestige : le niveau 6 au prestige 4.
    etat.prestige = 3
    while (peutAmeliorerAscenseur(etat)) ameliorerAscenseur(etat)
    expect(etat.ascenseur.niveau).toBe(5)
    etat.prestige = 4
    while (peutAmeliorerAscenseur(etat)) ameliorerAscenseur(etat)
    expect(etat.ascenseur.niveau).toBe(6)
    expect(ascenseurBloqueAuPrestige(etat)).toBeNull()
    expect(niveauAscenseur(etat)?.capacite).toBe(1024)
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

  it('« Remonter » ne monte que le mineur : son sac reste plein, rien n’est vendu', () => {
    const etat = nouvellePartie()
    placerAuFront(etat, 26)
    construireAscenseur(etat, 1)
    etat.colonneMineur = 0 // déjà au puits, à côté de la cabine
    etat.inventaire = { fer: 10, diamant: 2 }
    voyager(etat, 0, false, {})
    expect(etat.ascenseur.chargement).toEqual({})
    avancerTemps(etat, 5)
    expect(etat.position).toBe(0)
    expect(etat.inventaire).toEqual({ fer: 10, diamant: 2 })
    expect(etat.argent).toBe(0)
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

  it('répare avec de l’argent (selon l’usure) + 3 minerais de la pioche', () => {
    const etat = partieALaSurface()
    // Pioche en fer cassée : la moitié de son prix (300 $) + 3 fer.
    etat.pioches = { 2: 250 }
    etat.niveauPioche = 2
    expect(coutReparation(etat)).toEqual({ argent: 150, materiaux: { fer: 3 } })
    // À moitié usée : moitié moins d'argent, toujours 3 fer.
    etat.pioches = { 2: 125 }
    expect(coutReparation(etat)).toEqual({ argent: 75, materiaux: { fer: 3 } })
    // Sans les 3 fer, pas de réparation (même avec de l'argent).
    etat.argent = 1000
    etat.inventaire = { fer: 2 }
    expect(reparer(etat)).toEqual([])
    etat.inventaire = { fer: 5 }
    reparer(etat)
    expect(etat.pioches[2]).toBe(0)
    expect(etat.argent).toBe(925)
    expect(etat.inventaire).toEqual({ fer: 2 })
  })

  it('même règle pour la netherite (débris antiques), argent seul pour la pioche en bois', () => {
    const etat = partieALaSurface()
    etat.pioches = { 0: 60, 4: 800 }
    expect(coutReparation(etat, 4)).toEqual({ argent: 1500, materiaux: { debris: 3 } })
    expect(coutReparation(etat, 0)).toEqual({ argent: 3, materiaux: {} })
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

  it('agrandit le sac selon le prestige : 128 places aux prestiges 0 et 1, puis un sac de plus par prestige', () => {
    const etat = partieALaSurface()
    etat.argent = 1_000_000
    while (acheterSac(etat).length > 0);
    expect(tailleSac(etat)).toBe(128)
    expect(sacBloqueAuPrestige(etat)).toBe(2)
    etat.prestige = 2
    while (acheterSac(etat).length > 0);
    expect(tailleSac(etat)).toBe(256)
    etat.prestige = 5
    while (acheterSac(etat).length > 0);
    expect(tailleSac(etat)).toBe(2048)
    expect(prixProchainSac(etat)).toBeNull()
  })

  it('enchante avec de l’argent (× niveau²), des lapis et des émeraudes (× niveau)', () => {
    const etat = partieALaSurface()
    etat.prestige = 2 // Efficacité II n'est permise qu'à partir du prestige 2
    etat.argent = 2000
    etat.inventaire = { lapis: 9, emeraude: 3 }
    enchanter(etat, 'efficacite') // niveau I : 400 $ + 3 lapis + 1 émeraude
    enchanter(etat, 'efficacite') // niveau II : 400 × 4 = 1 600 $ + 6 lapis + 2 émeraudes
    expect(etat.enchantements.efficacite).toBe(2)
    expect(etat.argent).toBe(0)
    expect(etat.inventaire).toEqual({})
  })

  it('les niveaux d’enchantement se débloquent petit à petit avec les prestiges', () => {
    const etat = partieALaSurface()
    etat.argent = 10_000_000
    etat.inventaire = { lapis: 1000, emeraude: 1000 }
    const toutEnchanter = () => {
      for (const id of ['efficacite', 'fortune', 'solidite'] as const) while (enchanter(etat, id).length > 0);
    }
    // Prestige 0 : seulement le niveau I de chacun.
    toutEnchanter()
    expect(etat.enchantements).toEqual({ efficacite: 1, fortune: 1, solidite: 1 })
    expect(enchantementBloqueAuPrestige(etat, 'efficacite')).toBe(2)
    expect(enchantementBloqueAuPrestige(etat, 'fortune')).toBe(2)
    // Les trois au même niveau, un de plus tous les 2 prestiges.
    etat.prestige = 1
    toutEnchanter()
    expect(etat.enchantements).toEqual({ efficacite: 1, fortune: 1, solidite: 1 })
    etat.prestige = 2
    toutEnchanter()
    expect(etat.enchantements).toEqual({ efficacite: 2, fortune: 2, solidite: 2 })
    etat.prestige = 4
    toutEnchanter()
    expect(etat.enchantements).toEqual({ efficacite: 3, fortune: 3, solidite: 3 })
    // Fortune et Solidité s'arrêtent à III ; Efficacité continue (V au prestige 8).
    etat.prestige = 8
    toutEnchanter()
    expect(etat.enchantements).toEqual({ efficacite: 5, fortune: 3, solidite: 3 })
  })

  it('les enchantements sont gardés au prestige', () => {
    const etat = partieALaSurface()
    etat.enchantements = { efficacite: 2, fortune: 1, solidite: 1 }
    const suite = prestige(etat, aleatoireAvecGraine(3))
    expect(suite.enchantements).toEqual({ efficacite: 2, fortune: 1, solidite: 1 })
  })

  it('fortune donne une chance de doubler le minerai : 20 %, 40 %, 60 %', () => {
    const etat = nouvellePartie()
    // Le tirage est comparé à la chance : en dessous, le minerai est doublé.
    for (const [niveau, chance] of [[1, 0.2], [2, 0.4], [3, 0.6]]) {
      etat.enchantements.fortune = niveau
      expect(nbDrops(etat, 'fer', toujours(chance - 0.01))).toBe(2)
      expect(nbDrops(etat, 'fer', toujours(chance + 0.01))).toBe(1)
    }
    // Jamais plus de 2, et rien sur la roche.
    expect(nbDrops(etat, 'fer', toujours(0))).toBe(2)
    expect(nbDrops(etat, 'pierre', toujours(0))).toBe(1)
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

  it("le prestige garde le total de l'argent gagné (pour le classement)", () => {
    const etat = nouvellePartie()
    etat.stats.argentGagne = 1000
    const suite = prestige(etat, aleatoireAvecGraine(1))
    suite.stats.argentGagne = 250
    const encore = prestige(suite, aleatoireAvecGraine(2))
    expect(encore.stats.argentGagne).toBe(0)
    expect(argentGagneTotal(encore)).toBe(1250)
  })

  it('ne débloque un succès qu’une seule fois', () => {
    const etat = nouvellePartie()
    etat.stats.blocsCasses = 1
    expect(verifierSucces(etat).map((s) => s.id)).toEqual(['premier_bloc'])
    expect(verifierSucces(etat)).toEqual([])
  })
})
