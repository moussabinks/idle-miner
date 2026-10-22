import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { NIVEAUX_EMPLOYE, PRIX_EMBAUCHE, PRIX_MANAGER, RARETES, SALAIRES, SALAIRE_MANAGER, SECONDES_PAR_PAIE } from './donnees'
import {
  activiteEmploye,
  alerteSalaires,
  ameliorerEmploye,
  ameliorerRecruteur,
  avancerEmployes,
  blocsParSecondeEmploye,
  chancesRecrutement,
  changerTrajet,
  embaucherPousseur,
  coutSalaires,
  deposerTresorerie,
  embaucher,
  embaucherManager,
  indemnites,
  licencier,
  maxEmployes,
  payerSalaires,
  peutPayerSalaires,
  prixEmbauche,
  retirerTresorerie,
  salaireEmploye,
  tailleSacEmploye,
  tirerRarete,
  vitesseEmploye,
} from './employes'
import { ameliorerAscenseur, creerPartie, nbDansCoffre, type EtatJeu } from './mineur'

function partie(argent = 1_000_000): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1))
  etat.argent = argent
  return etat
}

const hasard = () => aleatoireAvecGraine(11)

describe('les mineurs employés', () => {
  it('4 au niveau 1 de la mine, puis 2 de plus par niveau', () => {
    const etat = partie()
    expect(maxEmployes(etat)).toBe(4)
    etat.niveauMine = 3
    expect(maxEmployes(etat)).toBe(8)
  })

  it('le premier coûte 50 $, puis le prix monte', () => {
    const etat = partie()
    expect(prixEmbauche(etat)).toBe(PRIX_EMBAUCHE[0])
    embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBe(PRIX_EMBAUCHE[1])
    for (let i = 0; i < 3; i++) embaucher(etat, hasard())
    expect(prixEmbauche(etat)).toBeNull() // équipe complète
    expect(etat.argent).toBe(1_000_000 - PRIX_EMBAUCHE.slice(0, 4).reduce((t, p) => t + p, 0))
  })

  it('creuse lentement, remonte son sac et le vide dans le coffre', () => {
    const etat = partie()
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    expect(vitesseEmploye(mineur)).toBe(NIVEAUX_EMPLOYE[0].vitesse)
    expect(tailleSacEmploye(mineur)).toBe(NIVEAUX_EMPLOYE[0].sac)
    // Descente (10 s), creusage (10 blocs à 0,15 par seconde), montée (10 s), vidage (2 s).
    avancerEmployes(etat, 10 + 10 / 0.15 + 10 + 2 + 0.5, hasard())
    expect(nbDansCoffre(etat)).toBe(10)
    expect(activiteEmploye(etat, mineur)).toContain('redescend')
  })

  it('l’ascenseur lui fait remonter plus de blocs par seconde', () => {
    const etat = partie()
    embaucher(etat, hasard())
    const avant = blocsParSecondeEmploye(etat, etat.employes[0])
    etat.inventaire = { fer: 10 }
    ameliorerAscenseur(etat)
    expect(blocsParSecondeEmploye(etat, etat.employes[0])).toBeGreaterThan(avant)
  })

  it('coffre plein : il attend devant, sans perdre son sac', () => {
    const etat = partie()
    embaucher(etat, hasard())
    etat.coffre.contenu = { pierre: 100 }
    avancerEmployes(etat, 200, hasard())
    const mineur = etat.employes[0]
    expect(mineur.etape).toBe('vide')
    expect(activiteEmploye(etat, mineur)).toContain('plein')
    expect(Object.values(mineur.sac).reduce((t, n) => t + (n ?? 0), 0)).toBe(10)
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
    avancerEmployes(etat, SECONDES_PAR_PAIE + 5, hasard())
    expect(alerteSalaires(etat)).toContain('attend son salaire')
    expect(coutSalaires(etat, SECONDES_PAR_PAIE)).toBe(SALAIRES[0])
    payerSalaires(etat, SECONDES_PAR_PAIE)
    expect(etat.employes[0].tempsPaye).toBe(SECONDES_PAR_PAIE)
    expect(etat.stats.salairesPayes).toBe(SALAIRES[0])
  })

  it('payés ensemble, ils repartent vers la mine l’un après l’autre (pas tous au même endroit)', () => {
    const etat = partie()
    etat.village.batiments.push({ id: 'employes', x: 19, y: 31, miroir: false })
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

describe('le recruteur (niveau 3 de la mine)', () => {
  it('donne une rareté aux nouveaux mineurs', () => {
    const etat = partie()
    expect(ameliorerRecruteur(etat)).toEqual([]) // pas avant le niveau 3
    expect(chancesRecrutement(etat).commun).toBe(100)
    etat.niveauMine = 3
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

describe('le manager (niveau 4 de la mine)', () => {
  it('paie les salaires tout seul avec la trésorerie', () => {
    const etat = partie()
    embaucher(etat, hasard())
    expect(embaucherManager(etat)).toEqual([])
    etat.niveauMine = 4
    embaucherManager(etat)
    expect(etat.argent).toBe(1_000_000 - 50 - PRIX_MANAGER)
    deposerTresorerie(etat, 10_000)
    avancerEmployes(etat, 3 * SECONDES_PAR_PAIE, hasard())
    expect(etat.employes[0].tempsPaye).toBeGreaterThan(0)
    expect(etat.tresorerie).toBeLessThan(10_000 - 2 * SALAIRE_MANAGER)
    retirerTresorerie(etat, etat.tresorerie)
    expect(etat.tresorerie).toBe(0)
  })
})
