import { describe, expect, it } from 'vitest'
import { niveauJoueur } from './niveaux'
import { partieDeTest } from './partieDeTest'
import { aleatoireAvecGraine } from './aleatoire'
import { NIVEAUX_EMPLOYE, PRIX_EMBAUCHE, PRIX_MANAGER, RARETES, SALAIRES, SALAIRE_MANAGER, SECONDES_PAR_PAIE } from './donnees'
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
import { nbDansCoffre, type EtatJeu } from './mineur'
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
    expect(prixEmbauche(etat, 'pousseur')).toBe(500)
    etat.niveauMine = 3
    expect(maxEmployes(etat)).toBe(3)
  })

  it('le premier coûte 500 $, puis le prix monte', () => {
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
    etat.village.batiments.push({ id: 'employes', x: 19, y: 31, miroir: false })
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
    etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false }, { id: 'employes', x: 20, y: 30, miroir: false })
    for (let y = 35; y <= 39; y++) etat.village.rails.push(`30,${y}`)
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
    etat.village.batiments.push({ id: 'marche', x: 28, y: 40, miroir: false }, { id: 'foreuse', x: 34, y: 40, miroir: false })
    for (let y = 35; y <= 39; y++) etat.village.rails.push(`30,${y}`)
    etat.village.rails.push('33,42')
    embaucherPousseur(etat, hasard(), 'mine-marche')
    avancerEmployes(etat, 5, hasard())
    expect(etat.employes[0].etape).toBe('quai')
    changerTrajet(etat, 0, 'foreuse-marche')
    expect(etat.employes[0].trajet).toBe('foreuse-marche')
    avancerEmployes(etat, 60, hasard())
    expect(etat.employes[0].lieu).toBe('foreuse')
    expect(etat.employes[0].etape).toBe('quai')
  })

  it('mineurs et pousseurs ont chacun leurs prix : le 1er pousseur coûte 500 $ (23/10)', () => {
    const etat = partie()
    etat.niveauMine = 2
    embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBe(PRIX_EMBAUCHE[1])
    expect(prixEmbauche(etat, 'pousseur')).toBe(500)
  })

  it('licencier coûte des indemnités', () => {
    const etat = partie(1000)
    embaucher(etat, hasard())
    const prix = indemnites(etat)
    expect(prix).toBe(200) // 40 % de 500 $
    licencier(etat, 0)
    expect(etat.employes).toEqual([])
    expect(etat.argent).toBe(1000 - 500 - 200)
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
    etat.village.batiments.push({ id: 'employes', x: 19, y: 31, miroir: false })
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
    expect(etat.argent).toBe(1_000_000 - 500 - PRIX_MANAGER)
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

  it('sans argent, plus personne n’est payé', () => {
    const etat = partie()
    etat.niveauMine = 3
    embaucher(etat, hasard())
    embaucherManager(etat)
    etat.argent = 0
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
    etat.village.batiments.push({ id: 'marche', x: 28, y: 38, miroir: false }, { id: 'employes', x: 19, y: 31, miroir: false })
    for (let y = 35; y <= 37; y++) etat.village.rails.push(`30,${y}`)
    embaucherPousseur(etat, hasard(), 'mine-marche')
    const pousseur = etat.employes[0]
    const chemin = cheminEmploye(etat, pousseur)
    expect(chemin?.at(-1)).toEqual(caseQuai(etat, 'mine-marche'))
  })
})

describe('un mineur embauché (23/10)', () => {
  it('sort du Personnel, marche jusqu’à la mine et y descend lui-même dans la caisse', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'employes', x: 19, y: 31, miroir: false })
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
    const argentAvant = etat.argent
    const prix = prixRemplacement(etat)
    // (23/10) au moins 400 $ × niveau du joueur² (ici bien plus que le quart d'une place)
    expect(prix).toBe(Math.round((400 * niveauJoueur(etat) ** 2) / 100) * 100)
    expect(prix).toBeGreaterThan(PRIX_EMBAUCHE[1] * 0.25)
    remplacerMineur(etat, 0, hasard())
    expect(etat.employes).toHaveLength(2)
    expect(etat.employes[0].nom).not.toBe(ancien)
    expect(etat.employes[0].niveau).toBe(2)
    expect(etat.argent).toBe(argentAvant - prix)
  })
})

describe('la fatigue du manager (23/10)', () => {
  it('il paie 15 minutes puis s’endort (jeu ouvert ou fermé) ; réveillé, il reprend ; amélioré, il tient 30 min', () => {
    const etat = partie()
    etat.niveauMine = 4
    etat.xp = 1_000_000
    embaucher(etat, hasard())
    embaucherManager(etat)
    expect(secondesEveilManager(etat)).toBe(15 * 60)
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
    expect(ameliorerManager(etat)[0]).toContain('30 min')
    expect(secondesEveilManager(etat)).toBe(30 * 60)
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
