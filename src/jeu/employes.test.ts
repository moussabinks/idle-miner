import { describe, expect, it } from 'vitest'
import { niveauJoueur } from './niveaux'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { BLOCS, NIVEAUX_EMPLOYE, NIVEAUX_MANAGER, PRIX_EMBAUCHE, PRIX_EMBAUCHE_POUSSEUR, PRIX_MANAGER, RARETES, SALAIRES, SALAIRE_MANAGER, SECONDES_PAR_PAIE, type IdBloc } from './donnees'
import {
  activiteEmploye,
  caseQuai,
  cheminEmploye,
  alerteSalaires,
  coutSalaireEmploye,
  payerEmploye,
  peutPayerEmploye,
  ameliorerManager,
  fatigueManager,
  managerEndormi,
  reveillerManager,
  secondesEveilManager,
  ameliorerEmploye,
  peutAmeliorerEmploye,
  ameliorerRecruteur,
  avancerEmployes,
  blocsParSecondeEmploye,
  chancesRecrutement,
  changerTrajet,
  embaucherPousseur,
  coutSalaires,
  embaucher,
  basculerManager,
  embaucherManager,
  verrouMinePioche,
  peutRemplacer,
  prixRemplacement,
  remplacerMineur,
  managerActif,
  indemnites,
  licencier,
  maxEmployes,
  payerSalaires,
  peutPayerSalaires,
  prixEmbauche,
  salaireEmploye,
  tailleSacEmploye,
  tirerRarete,
  vitesseEmploye,
} from './employes'
import { GARDER_TOUT, nbDansCoffre, reglerGarder, type EtatJeu } from './mineur'
import { avancerTemps } from './temps'

function partie(argent = 1_000_000): EtatJeu {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.argent = argent
  return etat
}

const hasard = () => aleatoireAvecGraine(11)

describe('les mineurs employés', () => {
  it('1 mineur par niveau de la mine ; les pousseurs à part (23/10)', () => {
    const etat = partie()
    expect(maxEmployes(etat)).toBe(1)
    embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBeNull()
    expect(embaucher(etat, hasard())).toEqual([])
    expect(etat.employes).toHaveLength(1)
    // un pousseur reste possible : il ne compte pas dans les mineurs
    expect(prixEmbauche(etat, 'pousseur')).toBe(PRIX_EMBAUCHE_POUSSEUR[0])
    etat.niveauMine = 3
    expect(maxEmployes(etat)).toBe(3)
  })

  it('le premier ne coûte presque rien (25/10 : 50 $), puis le prix monte', () => {
    expect(PRIX_EMBAUCHE[0]).toBe(50)
    const etat = partie()
    etat.niveauMine = 2
    expect(prixEmbauche(etat)).toBe(PRIX_EMBAUCHE[0])
    embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBe(PRIX_EMBAUCHE[1])
    embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBeNull() // 2 mineurs au niveau 2 de la mine
    expect(etat.argent).toBe(1_000_000 - PRIX_EMBAUCHE.slice(0, 2).reduce((t, p) => t + p, 0))
  })

  it('creuse au fond sans remonter : la caisse fait des allers-retours, même pas pleine (23/10)', () => {
    const etat = partie()
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    expect(vitesseEmploye(mineur)).toBe(0.5)
    expect(tailleSacEmploye(mineur)).toBe(NIVEAUX_EMPLOYE[0].sac)
    const etapes = new Set<string>()
    for (let i = 0; i < 120; i++) {
      avancerEmployes(etat, 0.5, hasard())
      etapes.add(mineur.etape)
    }
    // En 60 s à 0,5 bloc/s, il a creusé une trentaine de blocs : la caisse en a déjà remonté
    // plusieurs fois, sans attendre d'être pleine (30 places).
    expect(nbDansCoffre(etat)).toBeGreaterThan(10)
    expect(etat.stats.blocsMineurs).toBeLessThanOrEqual(30)
    expect(etapes.has('monte')).toBe(false)
    expect(etapes.has('vide')).toBe(false)
    expect(mineur.etape).toBe('creuse')
  })

  it('l’ascenseur lui fait remonter plus de blocs par seconde quand il ne suit pas', () => {
    const etat = partie()
    etat.ascenseur.niveau = 0 // (à l'échelle : la caisse remonte peu)
    etat.niveauMine = 3
    for (let i = 0; i < 3; i++) embaucher(etat, hasard())
    const avant = blocsParSecondeEmploye(etat, etat.employes[0])
    expect(avant).toBeLessThan(vitesseEmploye(etat.employes[0]))
    etat.ascenseur.niveau = 1
    expect(blocsParSecondeEmploye(etat, etat.employes[0])).toBeGreaterThan(avant)
  })

  it('coffre plein : il remplit son sac au fond et attend, la caisse reste en haut', () => {
    const etat = partie()
    embaucher(etat, hasard())
    etat.coffre.contenu = { pierre: 100 }
    avancerEmployes(etat, 200, hasard())
    const mineur = etat.employes[0]
    expect(mineur.etape).toBe('creuse')
    expect(activiteEmploye(etat, mineur)).toContain('plein')
    expect(Object.values(mineur.sac).reduce((t, n) => t + (n ?? 0), 0)).toBe(10)
    expect(etat.ascenseur.navette?.etape).toBe('haut')
  })

  it('pas payé : il attend la caisse au fond et remonte dedans, puis va au Personnel', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'employes', x: 9, y: 21, miroir: false })
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    avancerEmployes(etat, 40, hasard())
    expect(mineur.etape).toBe('creuse')
    mineur.tempsPaye = 0
    const vus = new Set<string>()
    for (let i = 0; i < 80; i++) {
      avancerEmployes(etat, 0.5, hasard())
      vus.add(`${mineur.etape}${mineur.enCabine ? '-caisse' : ''}`)
    }
    expect(vus.has('monte')).toBe(true)
    expect(vus.has('monte-caisse')).toBe(true)
    expect(mineur.lieu).toBe('employes')
  })

  it('une meilleure pioche : il creuse plus vite et porte plus', () => {
    const etat = partie()
    embaucher(etat, hasard())
    expect(ameliorerEmploye(etat, 0)).toEqual([]) // (25/10) la pioche en fer attend le palier 2
    etat.niveauMine = 2
    ameliorerEmploye(etat, 0)
    const mineur = etat.employes[0]
    expect(mineur.niveau).toBe(1)
    expect(vitesseEmploye(mineur)).toBe(NIVEAUX_EMPLOYE[1].vitesse)
    expect(salaireEmploye(mineur)).toBeGreaterThan(30)
  })

  it('un pousseur est embauché pour un trajet : il va attendre au quai du départ', () => {
    const etat = partie(1000)
    // Pas de rails : pas de pousseur possible.
    expect(embaucherPousseur(etat, hasard(), 'mine-marche')).toEqual([])
    etat.village.batiments.push({ id: 'marche', x: 18, y: 30, miroir: false }, { id: 'employes', x: 10, y: 20, miroir: false })
    for (let y = 25; y <= 29; y++) etat.village.rails.push(`20,${y}`)
    embaucherPousseur(etat, hasard(), 'mine-marche')
    const p = etat.employes[0]
    expect(p.role).toBe('pousseur')
    expect(p.trajet).toBe('mine-marche')
    // Le trajet a été créé avec l'embauche.
    expect(etat.trajets.map((t) => t.liaison)).toEqual(['mine-marche'])
    // Il marche du Personnel à la mine, puis attend au quai.
    expect(p.etape).toBe('marche')
    avancerEmployes(etat, 30, hasard())
    expect(p.etape).toBe('quai')
    expect(p.lieu).toBe('puits')
  })

  it('on peut changer le trajet d’un pousseur', () => {
    const etat = partie(1000)
    etat.niveauMine = 2
    etat.village.batiments.push({ id: 'marche', x: 18, y: 30, miroir: false }, { id: 'foreuse', x: 24, y: 30, miroir: false })
    for (let y = 25; y <= 29; y++) etat.village.rails.push(`20,${y}`)
    etat.village.rails.push('23,32')
    embaucherPousseur(etat, hasard(), 'mine-marche')
    avancerEmployes(etat, 5, hasard())
    expect(etat.employes[0].etape).toBe('quai')
    changerTrajet(etat, 0, 'foreuse-marche')
    expect(etat.employes[0].trajet).toBe('foreuse-marche')
    avancerEmployes(etat, 60, hasard())
    expect(etat.employes[0].lieu).toBe('foreuse')
    expect(etat.employes[0].etape).toBe('quai')
  })

  it('mineurs et pousseurs ont chacun leurs prix : le 1er pousseur coûte 300 $ (25/10)', () => {
    const etat = partie()
    etat.niveauMine = 2
    embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBe(PRIX_EMBAUCHE[1])
    expect(prixEmbauche(etat, 'pousseur')).toBe(300)
  })

  it('licencier coûte des indemnités', () => {
    const etat = partie(1000)
    embaucher(etat, hasard())
    const prix = indemnites(etat)
    expect(prix).toBe(20) // 40 % de 50 $
    licencier(etat, 0)
    expect(etat.employes).toEqual([])
    expect(etat.argent).toBe(1000 - 50 - 20)
  })
})

describe('les salaires', () => {
  it('ses 5 premières minutes sont payées, puis il faut payer (5 minutes à la fois)', () => {
    const etat = partie()
    embaucher(etat, hasard())
    expect(peutPayerSalaires(etat, SECONDES_PAR_PAIE)).toBe(false) // déjà payé pour 5 minutes
    // (on vide le coffre de la mine au fur et à mesure : plein, il attendrait sans user son salaire)
    for (let i = 0; i < 31; i++) {
      etat.coffre.contenu = {}
      avancerEmployes(etat, 10, hasard())
    }
    expect(alerteSalaires(etat)).toContain('attend son salaire')
    expect(coutSalaires(etat, SECONDES_PAR_PAIE)).toBe(SALAIRES[0])
    payerSalaires(etat, SECONDES_PAR_PAIE)
    expect(etat.employes[0].tempsPaye).toBe(SECONDES_PAR_PAIE)
    expect(etat.stats.salairesPayes).toBe(SALAIRES[0])
  })

  it('payés ensemble, ils repartent vers la mine l’un après l’autre (pas tous au même endroit)', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'employes', x: 9, y: 21, miroir: false })
    etat.niveauMine = 3 // (3 mineurs possibles)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    for (const e of etat.employes) {
      e.etape = 'attend'
      e.lieu = 'employes'
      e.tempsPaye = 0
    }
    payerSalaires(etat, SECONDES_PAR_PAIE)
    avancerEmployes(etat, 1, hasard())
    const progressions = etat.employes.map((e) => e.progression)
    expect(etat.employes.every((e) => e.etape === 'marche' && e.lieu === 'puits')).toBe(true)
    expect(new Set(progressions).size).toBe(3)
  })

  it('sans salaire, il ne creuse plus', () => {
    const etat = partie()
    embaucher(etat, hasard())
    avancerEmployes(etat, 3 * SECONDES_PAR_PAIE, hasard())
    const blocs = etat.stats.blocsMineurs
    avancerEmployes(etat, SECONDES_PAR_PAIE, hasard())
    expect(etat.stats.blocsMineurs).toBe(blocs)
  })
})

describe('le recruteur (niveau 4 de la mine)', () => {
  it('donne une rareté aux nouveaux mineurs', () => {
    const etat = partie()
    etat.niveauMine = 3
    expect(ameliorerRecruteur(etat)).toEqual([]) // pas avant le niveau 4
    expect(chancesRecrutement(etat).commun).toBe(100)
    etat.niveauMine = 4
    ameliorerRecruteur(etat)
    expect(etat.recruteur).toBe(1)
    const tirages = Array.from({ length: 500 }, (_, i) => tirerRarete(etat, aleatoireAvecGraine(i)))
    expect(new Set(tirages).size).toBeGreaterThan(3)
  })

  it('un mineur mythique creuse 5 fois plus vite, et coûte 4 fois plus', () => {
    const etat = partie()
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    mineur.rarete = 'mythique'
    expect(vitesseEmploye(mineur)).toBeCloseTo(NIVEAUX_EMPLOYE[0].vitesse * RARETES.mythique.rendement)
    expect(salaireEmploye(mineur)).toBe(SALAIRES[0] * 4)
  })
})

describe('le manager (niveau 3 de la mine)', () => {
  it('paie les salaires tout seul avec l’argent du joueur (23/10)', () => {
    const etat = partie()
    embaucher(etat, hasard())
    expect(embaucherManager(etat)).toEqual([])
    etat.niveauMine = 3
    embaucherManager(etat)
    expect(etat.argent).toBe(1_000_000 - PRIX_EMBAUCHE[0] - PRIX_MANAGER)
    const avant = etat.argent
    avancerEmployes(etat, 3 * SECONDES_PAR_PAIE, hasard())
    expect(etat.employes[0].tempsPaye).toBeGreaterThan(0)
    expect(etat.argent).toBeLessThan(avant - 2 * SALAIRE_MANAGER)
  })

  it('(23/10) on peut l’arrêter : il ne paie plus, on paie soi-même', () => {
    const etat = partie()
    etat.niveauMine = 3
    embaucher(etat, hasard())
    embaucherManager(etat)
    expect(peutPayerEmploye(etat, 0)).toBe(false)
    basculerManager(etat)
    expect(managerActif(etat)).toBe(false)
    const payes = etat.stats.salairesPayes
    const tempsManager = etat.manager.tempsPaye
    avancerEmployes(etat, 3 * SECONDES_PAR_PAIE, hasard())
    expect(etat.stats.salairesPayes).toBe(payes)
    expect(etat.manager.tempsPaye).toBe(tempsManager)
    expect(peutPayerEmploye(etat, 0)).toBe(true)
    etat.employes[0].tempsPaye = 0
    basculerManager(etat)
    avancerEmployes(etat, 30, hasard())
    expect(etat.stats.salairesPayes).toBeGreaterThan(payes)
  })

  it('(25/10) sans argent, il vend un peu du coffre pour payer les salaires (bug de l’absence)', () => {
    const etat = partie()
    etat.niveauMine = 3
    embaucher(etat, hasard())
    embaucherManager(etat)
    etat.argent = 0
    etat.coffre.contenu = { pierre: 500, diamant: 5 }
    reglerGarder(etat, 'diamant', GARDER_TOUT)
    const payes = etat.stats.salairesPayes
    avancerEmployes(etat, 3 * SECONDES_PAR_PAIE, hasard())
    // Les salaires sont payés, avec la pierre (les diamants gardés ne sont pas vendus).
    expect(etat.stats.salairesPayes).toBeGreaterThan(payes)
    expect(etat.coffre.contenu.pierre ?? 0).toBeLessThan(500)
    expect(etat.coffre.contenu.diamant).toBe(5)
    expect(etat.argent).toBeGreaterThanOrEqual(0)
  })

  it('sans argent ni rien à vendre, plus personne n’est payé', () => {
    const etat = partie()
    etat.niveauMine = 3
    embaucher(etat, hasard())
    embaucherManager(etat)
    etat.argent = 0
    // (tout ce qui arrive dans le coffre est gardé : il n'y a rien à vendre)
    for (const bloc of Object.keys(BLOCS) as IdBloc[]) reglerGarder(etat, bloc, GARDER_TOUT)
    const payes = etat.stats.salairesPayes
    avancerEmployes(etat, 3 * SECONDES_PAR_PAIE, hasard())
    expect(etat.manager.tempsPaye).toBe(0)
    expect(etat.stats.salairesPayes).toBe(payes)
    expect(etat.argent).toBe(0)
  })
})

describe('le pousseur va droit à son wagonnet (23/10)', () => {
  it('son chemin part du Personnel et finit sur sa case de quai, à côté du premier rail', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'marche', x: 18, y: 28, miroir: false }, { id: 'employes', x: 9, y: 21, miroir: false })
    for (let y = 25; y <= 27; y++) etat.village.rails.push(`20,${y}`)
    embaucherPousseur(etat, hasard(), 'mine-marche')
    const pousseur = etat.employes[0]
    const chemin = cheminEmploye(etat, pousseur)
    expect(chemin?.at(-1)).toEqual(caseQuai(etat, 'mine-marche'))
  })
})

describe('un mineur embauché (23/10)', () => {
  it('sort du Personnel, marche jusqu’à la mine et y descend lui-même dans la caisse', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'employes', x: 9, y: 21, miroir: false })
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    expect(mineur).toMatchObject({ etape: 'marche', depuis: 'employes', lieu: 'puits' })
    avancerEmployes(etat, 30, hasard())
    expect(['descend', 'creuse']).toContain(mineur.etape)
  })

  it('coffre plein : il attend sans user son salaire', () => {
    const etat = partie()
    embaucher(etat, hasard())
    etat.coffre.contenu = { pierre: 100 }
    avancerEmployes(etat, 200, hasard())
    const paye = etat.employes[0].tempsPaye
    avancerEmployes(etat, 60, hasard())
    expect(etat.employes[0].tempsPaye).toBe(paye)
  })
})

describe('le salaire d’un pousseur (23/10)', () => {
  it('monte avec sa vitesse et la taille de son chariot', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'employes', x: 9, y: 21, miroir: false })
    embaucher(etat, hasard())
    const pousseur = { ...etat.employes[0], role: 'pousseur' as const, rarete: 'commun' as const, niveau: 0, chariot: 0 }
    expect(salaireEmploye(pousseur)).toBe(400)
    expect(salaireEmploye({ ...pousseur, niveau: 2 })).toBe(900)
    expect(salaireEmploye({ ...pousseur, niveau: 2, chariot: 3 })).toBe(1500)
  })
})

describe('la pioche des mineurs suit la mine (23/10)', () => {
  it('pas de pioche en diamant avant la mine de diamant (25/10 : le palier 5)', () => {
    const etat = partie()
    etat.niveauMine = 4
    embaucher(etat, hasard())
    etat.employes[0].niveau = 3 // émeraude : la prochaine est le diamant
    expect(NIVEAUX_EMPLOYE[4].nom).toBe('Diamant')
    expect(verrouMinePioche(etat, etat.employes[0])).toBe('🕳️ Mine 5')
    expect(peutAmeliorerEmploye(etat, etat.employes[0])).toBe(false)
    expect(ameliorerEmploye(etat, 0)).toEqual([])
    etat.niveauMine = 5
    expect(verrouMinePioche(etat, etat.employes[0])).toBeNull()
    expect(peutAmeliorerEmploye(etat, etat.employes[0])).toBe(true)
  })
})

describe('remplacer un mineur avec le recruteur (23/10)', () => {
  it('une nouvelle recrue prend sa place, avec sa pioche, selon le niveau du joueur', () => {
    const etat = partie()
    etat.niveauMine = 4
    etat.xp = 1_000_000
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    expect(peutRemplacer(etat, 0)).toBe(false) // pas encore de recruteur
    ameliorerRecruteur(etat)
    etat.employes[0].niveau = 2
    const ancien = etat.employes[0].nom
    const prix = prixRemplacement(etat)
    // (23/10) au moins 200 $ × niveau du joueur², ou le quart de la dernière place possible
    expect(prix).toBe(Math.round(Math.max(200 * niveauJoueur(etat) ** 2, PRIX_EMBAUCHE[maxEmployes(etat) - 1] * 0.25) / 100) * 100)
    embaucher(etat, hasard())
    expect(prixRemplacement(etat)).toBe(prix) // le même, qu'on ait 2 ou 3 mineurs
    expect(prix).toBeGreaterThan(PRIX_EMBAUCHE[1] * 0.25)
    const argentAvant = etat.argent
    remplacerMineur(etat, 0, hasard())
    expect(etat.employes).toHaveLength(3)
    expect(etat.employes[0].nom).not.toBe(ancien)
    expect(etat.employes[0].niveau).toBe(2)
    expect(etat.argent).toBe(argentAvant - prix)
  })
})

describe('la fatigue du manager (23/10)', () => {
  it('il paie 30 minutes puis s’endort (jeu ouvert ou fermé) ; réveillé, il reprend ; amélioré, il tient 1 h (25/10)', () => {
    const etat = partie()
    etat.niveauMine = 4
    embaucher(etat, hasard())
    embaucherManager(etat)
    expect(secondesEveilManager(etat)).toBe(NIVEAUX_MANAGER[0].minutesEveil * 60)
    expect(NIVEAUX_MANAGER[0].minutesEveil).toBe(30)
    // 2 h d'un coup (jeu fermé) : il paie au début, puis s'endort.
    const ferme = structuredClone(etat)
    const messages = avancerTemps(ferme, 2 * 3600, hasard())
    expect(managerEndormi(ferme)).toBe(true)
    expect(messages.some((m) => m.includes('endormi'))).toBe(true)
    expect(peutPayerEmploye(ferme, 0)).toBe(true) // endormi : on paie soi-même
    const payes = ferme.stats.salairesPayes
    avancerTemps(ferme, 600, hasard())
    expect(ferme.stats.salairesPayes).toBe(payes) // il dort : plus rien
    reveillerManager(ferme)
    expect(fatigueManager(ferme)).toBe(0)
    ferme.employes[0].tempsPaye = 0
    avancerTemps(ferme, 30, hasard())
    expect(ferme.stats.salairesPayes).toBeGreaterThan(payes)
    expect(ameliorerManager(etat)[0]).toContain('1 h')
    expect(secondesEveilManager(etat)).toBe(60 * 60)
    // (25/10) Son niveau 3 attend le palier 5 de la mine.
    expect(ameliorerManager(etat)).toEqual([])
    etat.niveauMine = 5
    expect(ameliorerManager(etat)[0]).toContain('2 h')
  })
})

describe('payer un seul employé (23/10)', () => {
  it('il est complété jusqu’à 5 minutes, les autres non', () => {
    const etat = partie()
    etat.niveauMine = 2
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    for (const e of etat.employes) e.tempsPaye = 0
    const argentAvant = etat.argent
    expect(coutSalaireEmploye(etat.employes[0])).toBe(SALAIRES[0])
    payerEmploye(etat, 0)
    expect(etat.employes[0].tempsPaye).toBe(SECONDES_PAR_PAIE)
    expect(etat.employes[1].tempsPaye).toBe(0)
    expect(etat.argent).toBe(argentAvant - SALAIRES[0])
    // Déjà payé pour 5 minutes : rien à payer.
    expect(peutPayerEmploye(etat, 0)).toBe(false)
  })
})
