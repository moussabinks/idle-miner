import { describe, expect, it } from 'vitest'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { deplacerSol, peutPoserSol, poserSol, retirerSol } from './batiments'
import { agrandirChariot, ameliorerEmploye, coutChariotPousseur, embaucher, embaucherPousseur, peutEmbaucherPousseur } from './employes'
import { NIVEAUX_CHARIOT_POUSSEUR, NIVEAUX_FORAGE, NIVEAUX_POUSSEUR, SECONDES_PAR_CHARBON } from './donnees'
import { type EtatJeu } from './mineur'
import { avancerTemps } from './temps'
import { feraitUneBoucle } from './village'
import {
  aCharger,
  avancerWagonnets,
  forcePousseur,
  capaciteTrajet,
  choixWagonnet,
  reglerWagonnet,
  secondesArret,
  creerTrajet,
  joueurPousse,
  ligneDe,
  liaisonsDepuis,
  apercuTrajet,
  envoyerObjet,
  exclusAffiches,
  liaisonsSurLaCase,
  objetEnvoye,
  milieuDeLigne,
  objetsAuChoix,
  reglerTrajet,
  repartir,
  trajetsAProposer,
  peutCreerTrajet,
  peutPousser,
  pousserTrajet,
  secondesAllerRetour,
  supprimerTrajet,
  trajetDe,
  trajetElectrique,
  vitesseTrajet,
} from './wagonnet'

// Une partie avec le marché en (18, 30) et une ligne de 5 rails de la mine au marché.
// (25/10 : la clairière fait 40 × 40 cases, la mine est en 15, 15)
function partie(): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.village.batiments.push({ id: 'marche', x: 18, y: 30, miroir: false })
  etat.coffre.contenu = { fer: 15 }
  for (let y = 25; y <= 29; y++) poserSol(etat, 'rail', 20, y)
  return etat
}

// La même, avec le trajet Mine → Marché déjà créé.
function partieAvecTrajet(): EtatJeu {
  const etat = partie()
  creerTrajet(etat, 'mine-marche')
  return etat
}

// Un pousseur payé qui attend au quai de ce trajet (27/10 : sans lui, rien ne part, même électrique).
function ajouterPousseur(etat: EtatJeu, liaison: Parameters<typeof trajetDe>[1], nom = `Pousseur ${liaison}`): void {
  etat.employes.push({ nom, rarete: 'commun', niveau: 0, role: 'pousseur', trajet: liaison, etape: 'quai', progression: 0, sac: {}, blocsCasses: 0, tempsPaye: 600, lieu: 'puits', depuis: 'puits', forgeEnAttente: false })
}

// Fait rouler les wagonnets jusqu'à ce que ce trajet soit revenu au quai.
function allerRetour(etat: EtatJeu, liaison: Parameters<typeof trajetDe>[1]): string[] {
  const messages: string[] = []
  for (let i = 0; i < 200 && trajetDe(etat, liaison)?.etape !== 'quai'; i++) messages.push(...avancerWagonnets(etat, 0.25))
  return messages
}

describe('les trajets des wagonnets', () => {
  it('au début, aucun trajet : c’est le joueur qui en crée un sur ses rails', () => {
    const etat = partie()
    expect(etat.trajets).toEqual([])
    expect(ligneDe(etat, 'mine-marche')).toHaveLength(5)
    expect(peutCreerTrajet(etat, 'mine-marche')).toBe(true)
    // Pas de rails vers la foreuse (et pas de foreuse) : pas de trajet possible.
    expect(peutCreerTrajet(etat, 'mine-foreuse')).toBe(false)
    creerTrajet(etat, 'mine-marche')
    expect(trajetDe(etat, 'mine-marche')?.etape).toBe('quai')
    // Un seul wagonnet par trajet.
    expect(peutCreerTrajet(etat, 'mine-marche')).toBe(false)
  })

  it('les trajets proposés au départ : seulement vers les bâtiments construits', () => {
    const etat = partie()
    expect(liaisonsDepuis(etat, 'puits')).toEqual(['mine-marche'])
    etat.village.batiments.push({ id: 'foreuse', x: 30, y: 18, miroir: false })
    expect(liaisonsDepuis(etat, 'puits')).toEqual(['mine-marche', 'mine-foreuse'])
    expect(liaisonsDepuis(etat, 'foreuse')).toEqual(['foreuse-marche'])
  })

  it('ne roule que sur une ligne complète', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    expect(peutPousser(etat, 'mine-marche')).toBe(true)
    retirerSol(etat, 'rail', 20, 27)
    expect(peutPousser(etat, 'mine-marche')).toBe(false)
  })

  it('le joueur le pousse : il emporte le coffre, le vend au marché et revient', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10, pierre: 50 }
    pousserTrajet(etat, 'mine-marche')
    expect(joueurPousse(etat)).toBe(true)
    expect(capaciteTrajet(etat, 'mine-marche')).toBe(20) // (23/10) sans pousseur : le premier chariot
    // (23/10) 20 places pour 60 objets : un peu de chaque (4 fer, 16 pierres), pas tout le fer d'abord.
    expect(etat.coffre.contenu).toEqual({ fer: 6, pierre: 34 })
    const messages = allerRetour(etat, 'mine-marche')
    expect(etat.argent).toBe(64) // 4 fer à 12 $ + 16 pierres à 1 $
    expect(etat.stats.argentWagonnet).toBe(64)
    expect(etat.stats.voyagesWagonnet).toBe(1)
    expect(messages.some((m) => m.includes('+64 $'))).toBe(true)
    expect(joueurPousse(etat)).toBe(false)
  })

  it('il ne vend qu’une fois le déchargement fini, au marché', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    pousserTrajet(etat, 'mine-marche')
    const trajet = trajetDe(etat, 'mine-marche')!
    for (let i = 0; i < 200 && trajet.etape === 'aller'; i++) avancerWagonnets(etat, 0.1)
    // Arrivé : il décharge, sans encore rien vendre.
    expect(trajet.etape).toBe('retour')
    expect(trajet.distance).toBeLessThan(0)
    expect(etat.argent).toBe(0)
    expect(trajet.chargement).toEqual({ fer: 10 })
    for (let i = 0; i < 200 && trajet.distance < 0; i++) avancerWagonnets(etat, 0.1)
    expect(etat.argent).toBe(120)
    expect(trajet.chargement).toEqual({})
  })

  it('il laisse dans le coffre les objets « tout garder »', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    reglerWagonnet(etat, 'fer', 'tout-garder')
    expect(peutPousser(etat, 'mine-marche')).toBe(false)
  })

  it('le pousseur de ce trajet le pousse tout seul dès que le coffre n’est pas vide', () => {
    const etat = partieAvecTrajet()
    etat.argent = 1000
    embaucher(etat, aleatoireAvecGraine(2))
    embaucherPousseur(etat, aleatoireAvecGraine(3), 'mine-marche')
    const argentDepart = etat.argent
    for (let i = 0; i < 400 && etat.stats.voyagesWagonnet === 0; i++) avancerTemps(etat, 0.5, aleatoireAvecGraine(i))
    expect(etat.stats.voyagesWagonnet).toBeGreaterThan(0)
    expect(etat.argent).toBeGreaterThan(argentDepart)
  })

  it('un pousseur rare pousse plus vite (la moitié du bonus d’un mineur)', () => {
    expect(forcePousseur('commun')).toBe(1)
    expect(forcePousseur('mythique')).toBe(3)
  })

  it('un pousseur a deux améliorations : sa vitesse et son chariot ; ses arrêts durent 1 s (23/10)', () => {
    const etat = partieAvecTrajet()
    ajouterPousseur(etat, 'mine-marche')
    expect(capaciteTrajet(etat, 'mine-marche')).toBe(NIVEAUX_CHARIOT_POUSSEUR[0].places)
    expect(secondesArret(etat, 'mine-marche')).toBe(1)
    etat.argent = 100_000
    etat.niveauMine = 2 // (25/10) le niveau 2 du pousseur attend le palier 2 de la mine
    etat.coffre.contenu = { fer: 10_000 }
    const trajet = trajetDe(etat, 'mine-marche')!
    const vitesseAvant = vitesseTrajet(etat, trajet, etat.employes[0].nom)
    expect(ameliorerEmploye(etat, 0)[0]).toContain('costaud')
    expect(vitesseTrajet(etat, trajet, etat.employes[0].nom)).toBeCloseTo(vitesseAvant * NIVEAUX_POUSSEUR[1].vitesse)
    expect(capaciteTrajet(etat, 'mine-marche')).toBe(NIVEAUX_CHARIOT_POUSSEUR[0].places) // la vitesse ne change pas le chariot
    // (25/10) le prix du chariot ne dépend plus du niveau du joueur
    const cout = coutChariotPousseur(etat, etat.employes[0])!
    expect(cout).toEqual(NIVEAUX_CHARIOT_POUSSEUR[1].cout)
    expect(agrandirChariot(etat, 0)[0]).toContain(String(NIVEAUX_CHARIOT_POUSSEUR[1].places))
    expect(capaciteTrajet(etat, 'mine-marche')).toBe(NIVEAUX_CHARIOT_POUSSEUR[1].places)
    expect(etat.coffre.contenu.fer ?? 0).toBe(10_000 - (cout.materiaux.fer ?? 0))
    // Le niveau 3 du chariot attend le palier 3.
    expect(agrandirChariot(etat, 0)).toEqual([])
    expect(secondesArret(etat, 'mine-marche')).toBe(1)
  })

  it('un seul pousseur par trajet (23/10)', () => {
    const etat = partieAvecTrajet()
    etat.argent = 100_000
    expect(ligneDe(etat, 'mine-marche')).not.toBeNull()
    expect(peutEmbaucherPousseur(etat, 'mine-marche')).toBe(true)
    embaucherPousseur(etat, aleatoireAvecGraine(1), 'mine-marche')
    expect(peutEmbaucherPousseur(etat, 'mine-marche')).toBe(false)
    expect(embaucherPousseur(etat, aleatoireAvecGraine(2), 'mine-marche')).toEqual([])
  })

  it('électrique : son pousseur le pousse toujours, un peu plus vite (23/10)', () => {
    const etat = partieAvecTrajet()
    const trajet = trajetDe(etat, 'mine-marche')!
    const aLaMain = secondesAllerRetour(etat, 'mine-marche', 3)
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'generateur', x: 25, y: 27, miroir: false })
    etat.generateur.carburant = 1000
    etat.coffre.contenu = { fer: 5 }
    expect(trajetElectrique(etat, 'mine-marche')).toBe(true)
    // Sans pousseur, même électrique, il ne part pas (27/10).
    avancerWagonnets(etat, 0.1)
    expect(trajet.etape).toBe('quai')
    ajouterPousseur(etat, 'mine-marche')
    avancerWagonnets(etat, 0.1)
    expect(trajet.pousseur).toBe('Pousseur mine-marche')
    expect(etat.employes[0].etape).toBe('pousse')
    // + 30 % au niveau 1 du générateur : 2,5 × 1,3 cases/s (avant, 8 cases/s tout seul)
    expect(vitesseTrajet(etat, trajet)).toBeCloseTo(2.5 * 1.3)
    expect(secondesAllerRetour(etat, 'mine-marche', vitesseTrajet(etat, trajet))).toBeLessThan(aLaMain)
  })

  it('la ligne coupée en route : le chargement retourne dans le coffre', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    pousserTrajet(etat, 'mine-marche')
    retirerSol(etat, 'rail', 20, 27)
    avancerWagonnets(etat, 1)
    expect(trajetDe(etat, 'mine-marche')?.etape).toBe('quai')
    expect(etat.coffre.contenu).toEqual({ fer: 10 }) // (26/10) le rail retiré va dans le stock
  })

  it('arrêter un trajet : le wagonnet disparaît, son chargement revient', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    pousserTrajet(etat, 'mine-marche')
    supprimerTrajet(etat, 'mine-marche')
    expect(etat.trajets).toEqual([])
    expect(etat.coffre.contenu).toEqual({ fer: 10 })
  })

  it('Mine → Foreuse : il remplit le réservoir, et le surplus va dans le chariot (28/10)', () => {
    const etat = partie()
    etat.niveauMine = 2
    // La foreuse à droite de la mine, reliée par 3 rails.
    etat.village.batiments.push({ id: 'foreuse', x: 28, y: 18, miroir: false })
    etat.coffre.contenu = { fer: 9 }
    for (let x = 25; x <= 27; x++) poserSol(etat, 'rail', x, 20)
    expect(ligneDe(etat, 'mine-foreuse')).toHaveLength(3)
    creerTrajet(etat, 'mine-foreuse')
    creerTrajet(etat, 'mine-marche')
    // Le réservoir (15 charbons au début, 23/10) a encore de la place pour 10 : il emporte tout ce qu'il peut.
    etat.foreuse.carburant = 5 * SECONDES_PAR_CHARBON
    etat.coffre.contenu = { charbon: 200, fer: 5 }
    pousserTrajet(etat, 'mine-foreuse')
    expect(trajetDe(etat, 'mine-foreuse')?.chargement).toEqual({ charbon: 20 }) // (23/10) 20 places
    allerRetour(etat, 'mine-foreuse')
    expect(etat.foreuse.carburant).toBe(NIVEAUX_FORAGE[0].reservoir * SECONDES_PAR_CHARBON)
    expect(etat.foreuse.chariot).toEqual({ charbon: 10 })
    // Réservoir plein : il ne repart pas, et le wagonnet du marché peut vendre le charbon.
    expect(aCharger(etat, 'mine-foreuse')).toBe(0)
    etat.coffre.contenu = { charbon: 15 }
    pousserTrajet(etat, 'mine-marche')
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ charbon: 15 })
  })

  // (26/10, bug du propriétaire) Le charbon gardé 📌 (pour une amélioration de la fonderie) ne part
  // plus à la foreuse : avant, ce wagonnet emportait tout le charbon du coffre.
  it('Mine → Foreuse : il laisse dans le coffre le charbon gardé', () => {
    const etat = partie()
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'foreuse', x: 28, y: 18, miroir: false })
    etat.coffre.contenu = { fer: 9 }
    for (let x = 25; x <= 27; x++) poserSol(etat, 'rail', x, 20)
    creerTrajet(etat, 'mine-foreuse')
    etat.foreuse.carburant = 0
    etat.coffre.contenu = { charbon: 30 }
    etat.coffre.garder = { charbon: 25 }
    expect(aCharger(etat, 'mine-foreuse')).toBe(5)
    etat.coffre.garder = { charbon: 100 }
    expect(aCharger(etat, 'mine-foreuse')).toBe(0)
  })

  it('Foreuse → Marché : il vend le chariot de la foreuse', () => {
    const etat = partie()
    etat.niveauMine = 2
    // La foreuse collée au marché, avec un rail entre les deux.
    etat.village.batiments.push({ id: 'foreuse', x: 24, y: 30, miroir: false })
    etat.coffre.contenu = { fer: 3 }
    poserSol(etat, 'rail', 23, 32)
    creerTrajet(etat, 'foreuse-marche')
    etat.foreuse.chariot = { fer: 10 }
    pousserTrajet(etat, 'foreuse-marche')
    expect(etat.foreuse.chariot).toEqual({})
    allerRetour(etat, 'foreuse-marche')
    expect(etat.argent).toBe(120)
  })

  it('plusieurs wagonnets roulent en même temps sur les mêmes rails', () => {
    const etat = partie()
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'generateur', x: 25, y: 27, miroir: false })
    // Un rail de plus, collé au générateur, branché sur la ligne du marché.
    etat.coffre.contenu = { fer: 12 }
    poserSol(etat, 'rail', 21, 28)
    poserSol(etat, 'rail', 22, 28)
    poserSol(etat, 'rail', 23, 28)
    poserSol(etat, 'rail', 24, 28)
    expect(ligneDe(etat, 'mine-generateur')).not.toBeNull()
    creerTrajet(etat, 'mine-marche')
    creerTrajet(etat, 'mine-generateur')
    ajouterPousseur(etat, 'mine-marche')
    ajouterPousseur(etat, 'mine-generateur')
    etat.generateur.carburant = 100
    etat.coffre.contenu = { redstone: 6, pierre: 10 } // (23/10) 6 redstones remplissent la réserve de 5 min
    avancerWagonnets(etat, 0.1)
    expect(trajetDe(etat, 'mine-marche')?.etape).toBe('aller')
    expect(trajetDe(etat, 'mine-generateur')?.etape).toBe('aller')
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ pierre: 10 }) // la redstone va au générateur
  })

  it('sans pousseur vers le générateur, la redstone part au marché (23/10)', () => {
    const etat = partie()
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'generateur', x: 25, y: 27, miroir: false })
    etat.coffre.contenu = { fer: 12 }
    for (let x = 21; x <= 24; x++) poserSol(etat, 'rail', x, 28)
    creerTrajet(etat, 'mine-marche')
    creerTrajet(etat, 'mine-generateur') // le trajet existe, mais personne ne le pousse
    ajouterPousseur(etat, 'mine-marche')
    etat.generateur.carburant = 100
    etat.coffre.contenu = { redstone: 10, pierre: 10 }
    avancerWagonnets(etat, 0.1)
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ redstone: 10, pierre: 10 })
  })
})

describe('pas de boucle dans les rails', () => {
  it('on ne peut pas fermer un carré de 2 × 2', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.coffre.contenu = { fer: 30 }
    poserSol(etat, 'rail', 5, 5)
    poserSol(etat, 'rail', 6, 5)
    poserSol(etat, 'rail', 6, 6)
    expect(feraitUneBoucle(etat.village, 5, 6)).toBe(true)
    expect(peutPoserSol(etat, 'rail', 5, 6)).toBe(false)
    expect(poserSol(etat, 'rail', 5, 6)[0]).toContain('boucle')
    expect(etat.village.rails).toHaveLength(3)
  })

  it('ni une grande boucle, même en déplaçant un rail', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    etat.coffre.contenu = { fer: 60 }
    // Un U : (5,5) → (8,5) → (8,7) → (5,7), il manque (5,6).
    for (const [x, y] of [[5, 5], [6, 5], [7, 5], [8, 5], [8, 6], [8, 7], [7, 7], [6, 7], [5, 7]]) poserSol(etat, 'rail', x, y)
    poserSol(etat, 'rail', 12, 12)
    expect(peutPoserSol(etat, 'rail', 5, 6)).toBe(false)
    deplacerSol(etat, 'rail', { x: 12, y: 12 }, { x: 5, y: 6 })
    expect(etat.village.rails).toContain('12,12')
    // Un embranchement (un T) reste possible.
    expect(peutPoserSol(etat, 'rail', 9, 6)).toBe(true)
  })
})

describe('la fenêtre des trajets (27/10)', () => {
  it('des rails qui relient deux bâtiments proposent un trajet, au milieu de la ligne', () => {
    const etat = partie()
    expect(trajetsAProposer(etat)).toEqual(['mine-marche'])
    expect(milieuDeLigne(ligneDe(etat, 'mine-marche')!)).toEqual({ x: 20, y: 27 })
    // Toucher un rail de la ligne ouvre son trajet ; une case sans rail, rien.
    expect(liaisonsSurLaCase(etat, 20, 26)).toEqual(['mine-marche'])
    expect(liaisonsSurLaCase(etat, 10, 10)).toEqual([])
    reglerTrajet(etat, 'mine-marche', { actif: true, exclus: [] })
    expect(trajetsAProposer(etat)).toEqual([])
  })

  it('les objets décochés ne partent pas au marché (ils restent dans le coffre)', () => {
    const etat = partie()
    expect(objetsAuChoix(etat, 'mine-marche')).toEqual(['pierre', 'charbon', 'fer'])
    expect(objetsAuChoix(etat, 'mine-foreuse')).toEqual([])
    reglerTrajet(etat, 'mine-marche', { actif: true, exclus: ['pierre'] })
    etat.coffre.contenu = { pierre: 20, fer: 3 }
    pousserTrajet(etat, 'mine-marche')
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ fer: 3 })
    expect(etat.coffre.contenu.pierre).toBe(20)
  })

  it('arrêter l’automatisation supprime le trajet', () => {
    const etat = partieAvecTrajet()
    reglerTrajet(etat, 'mine-marche', { actif: false, exclus: [] })
    expect(etat.trajets).toEqual([])
  })
})

describe('les minerais du wagonnet, au panneau de la mine (27/10)', () => {
  it('on coche ou décoche un minerai, même absent du coffre', () => {
    const etat = partieAvecTrajet()
    expect(objetEnvoye(etat, 'mine-marche', 'fer')).toBe(true)
    envoyerObjet(etat, 'mine-marche', 'fer', false)
    expect(objetEnvoye(etat, 'mine-marche', 'fer')).toBe(false)
    etat.coffre.contenu = { fer: 5, pierre: 2 }
    pousserTrajet(etat, 'mine-marche')
    expect(trajetDe(etat, 'mine-marche')?.chargement).toEqual({ pierre: 2 })
  })

  it('le recocher le renvoie au marché', () => {
    const etat = partieAvecTrajet()
    envoyerObjet(etat, 'mine-marche', 'fer', false)
    expect(exclusAffiches(etat, 'mine-marche')).toEqual(['fer'])
    envoyerObjet(etat, 'mine-marche', 'fer', true)
    expect(objetEnvoye(etat, 'mine-marche', 'fer')).toBe(true)
    expect(exclusAffiches(etat, 'mine-marche')).toEqual([])
  })
})

describe('l’aperçu d’un trajet, dans la fenêtre des rails (27/10)', () => {
  it('ce qu’emporterait le wagonnet, selon les objets décochés', () => {
    const etat = partie()
    etat.coffre.contenu = { pierre: 30, fer: 5, charbon: 10 }
    const tout = apercuTrajet(etat, 'mine-marche', [])
    // (23/10) 20 places pour 45 objets : un peu de chaque, la place qui reste au plus cher.
    expect(tout.objets).toEqual([['fer', 3], ['charbon', 4], ['pierre', 13]])
    expect(tout.valeur).toBe(3 * 12 + 4 * 5 + 13)
    expect(tout.moteur).toBe('toi') // pas de pousseur : c'est toi qui pousses
    expect(tout.parMinute).toBeGreaterThan(0)
    const sansPierre = apercuTrajet(etat, 'mine-marche', ['pierre'])
    expect(sansPierre.objets).toEqual([['fer', 5], ['charbon', 10]])
  })

  it('(25/10) avec le bonus « ventes × 2 », l’aperçu et la vente au marché valent le double', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 10 }
    etat.boosts = { ventes: etat.stats.tempsDeJeu + 600 }
    expect(apercuTrajet(etat, 'mine-marche', []).valeur).toBe(2 * 10 * 12)
    pousserTrajet(etat, 'mine-marche')
    allerRetour(etat, 'mine-marche')
    expect(etat.stats.argentWagonnet).toBe(2 * 10 * 12)
  })
})

describe('un wagonnet trop petit prend un peu de chaque objet (23/10)', () => {
  it('répartit les places selon les quantités, le reste aux plus chers', () => {
    expect(repartir([['fer', 10], ['pierre', 50]], 20)).toEqual([['fer', 4], ['pierre', 16]])
    expect(repartir([['fer', 3], ['pierre', 5]], 20)).toEqual([['fer', 3], ['pierre', 5]])
    expect(repartir([['diamant', 1], ['pierre', 99]], 10)).toEqual([['diamant', 1], ['pierre', 9]])
  })
})

describe('garder un nombre fixe dans le coffre (23/10)', () => {
  it('le wagonnet du marché prend seulement ce qu’il y a en plus', () => {
    const etat = partieAvecTrajet()
    etat.coffre.contenu = { fer: 60, pierre: 10 }
    reglerWagonnet(etat, 'fer', 'garder', 40)
    expect(choixWagonnet(etat, 'fer')).toEqual({ choix: 'garder', nombre: 40 })
    expect(aCharger(etat, 'mine-marche')).toBe(30) // 20 fer + 10 pierre
    reglerWagonnet(etat, 'fer', 'tout-garder')
    expect(choixWagonnet(etat, 'fer').choix).toBe('tout-garder')
    expect(aCharger(etat, 'mine-marche')).toBe(10)
    reglerWagonnet(etat, 'fer', 'vendre')
    expect(choixWagonnet(etat, 'fer')).toEqual({ choix: 'vendre', nombre: 0 })
    expect(aCharger(etat, 'mine-marche')).toBe(70)
  })
})
