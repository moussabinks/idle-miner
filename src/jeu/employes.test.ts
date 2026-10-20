import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  DUREE_MIN_TRAJET_EMPLOYE,
  NIVEAUX_EMPLOYE,
  NIVEAUX_RECRUTEUR,
  PRIX_EMBAUCHE,
  PRIX_MANAGER,
  RARETES,
  SALAIRE_MANAGER,
  SECONDES_PAR_PAIE,
  SECONDES_PAYEES_MAX,
  SECONDES_VENTE_EMPLOYE,
  profondeurBedrock,
} from './donnees'
import {
  activiteEmploye,
  alerteSalaires,
  ameliorerEmploye,
  ameliorerRecruteur,
  avancerEmployes,
  chancesRecrutement,
  coutSalaires,
  deposerTresorerie,
  embaucher,
  embaucherManager,
  employeBloqueAuPrestige,
  indemnites,
  licencier,
  manquePourUnePaie,
  maxEmployes,
  nbDansSacEmploye,
  payerSalaires,
  peutPayerSalaires,
  prixEmbauche,
  profondeurMaxEmploye,
  recruteurBloqueAuPrestige,
  retirerTresorerie,
  salaireEmploye,
  tailleSacEmploye,
  tirerRarete,
  vitesseEmploye,
} from './employes'
import { creerPartie, prestige, type EtatJeu } from './mineur'
import { revenuBrutEmploye } from './revenu'
import { choisirTalent } from './talents'
import { avancerTemps } from './temps'

// Un joueur au village, au prestige donné, avec de l'argent (et du fer et de la redstone
// pour l'équipement des mineurs).
function partie(niveauPrestige: number, argent = 1_000_000): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1), niveauPrestige)
  etat.argent = argent
  etat.inventaire = { fer: 1000, redstone: 1000 }
  return etat
}

const hasard = () => aleatoireAvecGraine(11)

describe('mineurs employés', () => {
  it('sont bloqués avant le prestige 2, puis 2 au prestige 2 et 1 de plus par prestige', () => {
    expect(maxEmployes(partie(1))).toBe(0)
    expect(embaucher(partie(1), hasard())).toEqual([])
    expect(maxEmployes(partie(2))).toBe(2)
    expect(maxEmployes(partie(4))).toBe(4)
    expect(maxEmployes(partie(20))).toBe(6)
  })

  it('s’embauchent au village, de plus en plus cher', () => {
    const etat = partie(2)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    expect(etat.employes).toHaveLength(2)
    expect(etat.argent).toBe(1_000_000 - PRIX_EMBAUCHE[0] - PRIX_EMBAUCHE[1])
    expect(prixEmbauche(etat)).toBeNull() // déjà 2 au prestige 2
    expect(embaucher(etat, hasard())).toEqual([])
    // Deux prénoms différents.
    expect(etat.employes[0].nom).not.toBe(etat.employes[1].nom)
  })

  it('coûtent plus cher à chaque prestige (comme ce que rapporte la mine)', () => {
    expect(prixEmbauche(partie(2))).toBe(PRIX_EMBAUCHE[0])
    expect(prixEmbauche(partie(3))).toBe(PRIX_EMBAUCHE[0] * 1.2)
    expect(prixEmbauche(partie(6))).toBeGreaterThan(2 * PRIX_EMBAUCHE[0])
  })

  it('creusent, remontent vendre et te donnent tout l’argent de leurs ventes', () => {
    const etat = partie(2, PRIX_EMBAUCHE[0])
    embaucher(etat, hasard())
    expect(etat.argent).toBe(0)
    expect(etat.employes[0].tempsPaye).toBe(SECONDES_PAR_PAIE) // 10 minutes payées à l'embauche
    avancerTemps(etat, 590, aleatoireAvecGraine(2)) // presque 10 minutes
    const mineur = etat.employes[0]
    expect(mineur.blocsCasses).toBeGreaterThan(100)
    expect(mineur.profondeur).toBeGreaterThan(2)
    expect(etat.argent).toBeGreaterThan(0)
    expect(etat.argent).toBe(mineur.gagne)
    expect(etat.stats.argentMineurs).toBe(mineur.gagne)
    expect(nbDansSacEmploye(mineur)).toBeLessThanOrEqual(tailleSacEmploye(etat, mineur))
  })

  it('ont leur propre ascenseur, plus rapide quand tu améliores le tien', () => {
    const sansTonAscenseur = partie(2)
    embaucher(sansTonAscenseur, hasard())
    // Assez profond pour que le trajet dure plus que le minimum, même en ascenseur.
    sansTonAscenseur.employes[0].niveau = 2
    sansTonAscenseur.employes[0].profondeur = 80
    sansTonAscenseur.employes[0].tempsPaye = SECONDES_PAYEES_MAX
    const avecTonAscenseur = structuredClone(sansTonAscenseur)
    avecTonAscenseur.ascenseur.niveau = 4
    avancerTemps(sansTonAscenseur, 1800, aleatoireAvecGraine(3))
    avancerTemps(avecTonAscenseur, 1800, aleatoireAvecGraine(3))
    expect(avecTonAscenseur.employes[0].blocsCasses).toBeGreaterThan(sansTonAscenseur.employes[0].blocsCasses)
  })

  it('prennent le temps de remonter, de vendre puis de redescendre', () => {
    const etat = partie(2, PRIX_EMBAUCHE[0])
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    // Sac plein, au fond de sa galerie à -3 m (tout près de la surface).
    mineur.profondeur = 3
    mineur.etape = 'creuse'
    mineur.sac = { pierre: tailleSacEmploye(etat, mineur) }
    avancerEmployes(etat, 0.01, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('monte')
    // Même tout près, le trajet dure au moins quelques secondes...
    avancerEmployes(etat, DUREE_MIN_TRAJET_EMPLOYE - 0.5, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('monte')
    expect(etat.argent).toBe(0)
    // ... puis il vend au marché, ce qui prend aussi du temps.
    avancerEmployes(etat, 1, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('vend')
    expect(activiteEmploye(etat, mineur)).toContain('vend')
    expect(etat.argent).toBe(0)
    avancerEmployes(etat, SECONDES_VENTE_EMPLOYE, aleatoireAvecGraine(1))
    expect(mineur.etape).toBe('descend')
    expect(etat.argent).toBeGreaterThan(0)
    expect(mineur.sac).toEqual({})
  })

  it('ont un meilleur équipement petit à petit : un niveau de plus par prestige', () => {
    const etat = partie(2)
    embaucher(etat, hasard())
    ameliorerEmploye(etat, 0)
    ameliorerEmploye(etat, 0)
    expect(etat.employes[0].niveau).toBe(1) // Pierre au prestige 2, pas plus
    expect(employeBloqueAuPrestige(etat, etat.employes[0])).toBe(3)
    etat.prestige = 3
    ameliorerEmploye(etat, 0)
    expect(etat.employes[0].niveau).toBe(2)
  })

  it('ont un plus grand sac à chaque amélioration', () => {
    const etat = partie(5)
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    const tailles = [tailleSacEmploye(etat, mineur)]
    while (ameliorerEmploye(etat, 0).length > 0) tailles.push(tailleSacEmploye(etat, mineur))
    expect(tailles).toEqual(NIVEAUX_EMPLOYE.map((n) => n.sac))
    expect(tailles[tailles.length - 1]).toBeGreaterThan(tailles[0])
  })

  it('ne descendent pas plus bas que leur pioche, et s’améliorent', () => {
    const etat = partie(2)
    embaucher(etat, hasard())
    etat.employes[0].tempsPaye = SECONDES_PAYEES_MAX
    avancerTemps(etat, 3500, aleatoireAvecGraine(4))
    expect(etat.employes[0].profondeur).toBe(profondeurMaxEmploye(etat, etat.employes[0]))
    expect(etat.employes[0].profondeur).toBeLessThan(profondeurBedrock(etat.prestige))
    ameliorerEmploye(etat, 0)
    expect(etat.employes[0].niveau).toBe(1)
  })

  it('restent après un prestige avec leur pioche et leur rareté, mais repartent de la surface', () => {
    const etat = partie(2)
    embaucher(etat, hasard())
    ameliorerEmploye(etat, 0)
    etat.employes[0].rarete = 'epique'
    avancerTemps(etat, 1200, aleatoireAvecGraine(6))
    expect(etat.employes[0].profondeur).toBeGreaterThan(2)
    const suite = prestige(etat, aleatoireAvecGraine(5))
    expect(suite.employes).toHaveLength(1)
    expect(suite.employes[0]).toMatchObject({ niveau: 1, rarete: 'epique', profondeur: 2, sac: {}, etape: 'descend' })
    // Un cadeau de prestige : au moins 10 minutes de salaire payées.
    expect(suite.employes[0].tempsPaye).toBe(SECONDES_PAR_PAIE)
  })

  it('les talents du patron', () => {
    const etat = partie(4)
    choisirTalent(etat, 'contremaitre')
    choisirTalent(etat, 'sacsDEquipe')
    choisirTalent(etat, 'salairesNegocies')
    choisirTalent(etat, 'grandeEquipe')
    expect(maxEmployes(etat)).toBe(5)
    embaucher(etat, hasard())
    expect(tailleSacEmploye(etat, etat.employes[0])).toBe(2 * NIVEAUX_EMPLOYE[0].sac)
    expect(vitesseEmploye(etat, etat.employes[0])).toBeCloseTo(NIVEAUX_EMPLOYE[0].vitesse * 1.25)
    const sansTalent = partie(4)
    embaucher(sansTalent, hasard())
    expect(salaireEmploye(etat, etat.employes[0])).toBe(Math.round(salaireEmploye(sansTalent, sansTalent.employes[0]) * 0.75))
  })
})

describe('salaires', () => {
  it('rapportent bien plus qu’ils ne coûtent, à chaque niveau d’équipement', () => {
    for (const niveauPrestige of [2, 5, 9]) {
      const etat = partie(niveauPrestige)
      etat.ascenseur.niveau = 4
      embaucher(etat, hasard())
      const mineur = etat.employes[0]
      for (let niveau = 0; niveau < NIVEAUX_EMPLOYE.length; niveau++) {
        mineur.niveau = niveau
        mineur.profondeur = profondeurMaxEmploye(etat, mineur)
        const rapporte = revenuBrutEmploye(etat, mineur) * SECONDES_PAR_PAIE
        // Le salaire : entre 10 % et 35 % de ce qu'il rapporte au fond de sa galerie.
        expect(salaireEmploye(etat, mineur)).toBeGreaterThan(rapporte * 0.1)
        expect(salaireEmploye(etat, mineur)).toBeLessThan(rapporte * 0.35)
      }
    }
  })

  it('sans salaire, il remonte et attend au stand Personnel, puis repart quand on le paie', () => {
    const etat = partie(2)
    embaucher(etat, hasard())
    const mineur = etat.employes[0]
    const messages = avancerTemps(etat, SECONDES_PAR_PAIE + 120, aleatoireAvecGraine(2))
    expect(mineur.tempsPaye).toBe(0)
    expect(mineur.etape).toBe('attend')
    expect(messages.some((m) => m.includes('attend son salaire'))).toBe(true)
    expect(alerteSalaires(etat)).toContain('attend')
    // Il ne fait plus rien tant qu'il n'est pas payé.
    const blocs = mineur.blocsCasses
    avancerTemps(etat, 600, aleatoireAvecGraine(2))
    expect(mineur.blocsCasses).toBe(blocs)
    // On le paie : il redescend creuser.
    payerSalaires(etat, SECONDES_PAR_PAIE)
    expect(mineur.tempsPaye).toBe(SECONDES_PAR_PAIE)
    expect(alerteSalaires(etat)).toBeNull()
    avancerTemps(etat, 60, aleatoireAvecGraine(2))
    expect(mineur.blocsCasses).toBeGreaterThan(blocs)
  })

  it('se paient d’avance jusqu’à 1 h, au prix du temps ajouté', () => {
    const etat = partie(3)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    const salaires = etat.employes.reduce((total, e) => total + salaireEmploye(etat, e), 0)
    expect(coutSalaires(etat, SECONDES_PAR_PAIE)).toBe(salaires)
    // Ils ont déjà 10 minutes : il en reste 50 à payer pour arriver à 1 h.
    expect(coutSalaires(etat, SECONDES_PAYEES_MAX)).toBe(5 * salaires)
    const avant = etat.argent
    payerSalaires(etat, SECONDES_PAYEES_MAX)
    expect(etat.argent).toBe(avant - 5 * salaires)
    expect(etat.stats.salairesPayes).toBe(5 * salaires)
    expect(etat.employes.every((e) => e.tempsPaye === SECONDES_PAYEES_MAX)).toBe(true)
    // Déjà payés 1 h : rien de plus à payer.
    expect(peutPayerSalaires(etat, SECONDES_PAR_PAIE)).toBe(false)
  })

  it('un mineur rare a un plus gros salaire, mais rapporte encore plus', () => {
    const etat = partie(4)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    const [commun, mythique] = etat.employes
    commun.rarete = 'commun'
    mythique.rarete = 'mythique'
    for (const mineur of [commun, mythique]) {
      mineur.niveau = 3
      mineur.profondeur = profondeurMaxEmploye(etat, mineur)
    }
    expect(vitesseEmploye(etat, mythique)).toBeCloseTo(5 * vitesseEmploye(etat, commun))
    expect(salaireEmploye(etat, mythique)).toBe(Math.round(salaireEmploye(etat, commun) * RARETES.mythique.salaire))
    const gainNet = (mineur: typeof commun) => revenuBrutEmploye(etat, mineur) * SECONDES_PAR_PAIE - salaireEmploye(etat, mineur)
    expect(gainNet(mythique)).toBeGreaterThan(4 * gainNet(commun))
  })
})

describe('licenciement', () => {
  it('coûte des indemnités, et le mineur part avec son équipement', () => {
    const etat = partie(4)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    const parti = etat.employes[0].nom
    const prix = indemnites(etat)
    expect(prix).toBe(Math.round((PRIX_EMBAUCHE[1] * 1.2 ** 2 * 0.4) / 100) * 100)
    const avant = etat.argent
    licencier(etat, 0)
    expect(etat.argent).toBe(avant - prix)
    expect(etat.employes.map((e) => e.nom)).not.toContain(parti)
  })

  it('les talents de recrutement baissent les prix', () => {
    const etat = partie(6)
    etat.recruteur = 1
    const embauche = prixEmbauche(etat) as number
    const licenciement = indemnites(etat)
    choisirTalent(etat, 'oeilDuRecruteur')
    choisirTalent(etat, 'prixCasse')
    choisirTalent(etat, 'indemnitesReduites')
    expect(prixEmbauche(etat)).toBe(Math.round((embauche * 0.7) / 100) * 100)
    expect(indemnites(etat)).toBe(Math.round(licenciement / 2 / 100) * 100)
  })
})

describe('recruteur et rareté', () => {
  it('sans recruteur, tous les mineurs sont communs', () => {
    const etat = partie(6)
    for (let i = 0; i < 6; i++) embaucher(etat, aleatoireAvecGraine(i))
    expect(etat.employes.every((e) => e.rarete === 'commun')).toBe(true)
  })

  it('s’embauche au prestige 4 (argent seulement) et gagne un niveau par prestige', () => {
    const etat = partie(3)
    expect(ameliorerRecruteur(etat)).toEqual([])
    etat.prestige = 4
    ameliorerRecruteur(etat)
    expect(etat.recruteur).toBe(1)
    expect(etat.argent).toBe(1_000_000 - (NIVEAUX_RECRUTEUR[0].cout.argent ?? 0))
    expect(etat.inventaire).toEqual({ fer: 1000, redstone: 1000 }) // ni fer ni redstone
    expect(ameliorerRecruteur(etat)).toEqual([])
    expect(recruteurBloqueAuPrestige(etat)).toBe(5)
    etat.prestige = 7
    while (ameliorerRecruteur(etat).length > 0);
    expect(etat.recruteur).toBe(NIVEAUX_RECRUTEUR.length)
  })

  it('donne les bonnes chances (65 / 20 / 10 / 4 / 1 au premier niveau), améliorées par les niveaux et les talents', () => {
    const etat = partie(7)
    etat.recruteur = 1
    expect(chancesRecrutement(etat)).toEqual({ commun: 65, rare: 20, epique: 10, legendaire: 4, mythique: 1 })
    etat.recruteur = 4
    expect(chancesRecrutement(etat).commun).toBeLessThan(65)
    etat.recruteur = 1
    choisirTalent(etat, 'oeilDuRecruteur')
    expect(chancesRecrutement(etat).rare).toBeCloseTo(25)
    choisirTalent(etat, 'prixCasse')
    choisirTalent(etat, 'indemnitesReduites')
    choisirTalent(etat, 'mainDeMidas')
    expect(chancesRecrutement(etat).mythique).toBeCloseTo(2.5)
    const total = Object.values(chancesRecrutement(etat)).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(100)
  })

  it('tire les raretés à peu près selon les chances', () => {
    const etat = partie(4)
    etat.recruteur = 1
    const aleatoire = aleatoireAvecGraine(42)
    const compte = { commun: 0, rare: 0, epique: 0, legendaire: 0, mythique: 0 }
    for (let i = 0; i < 20000; i++) compte[tirerRarete(etat, aleatoire)] += 1
    expect(compte.commun / 20000).toBeCloseTo(0.65, 1)
    expect(compte.rare / 20000).toBeCloseTo(0.2, 1)
    expect(compte.mythique).toBeGreaterThan(100)
    expect(compte.mythique).toBeLessThan(320)
  })

  it('la branche Recrutement de l’arbre attend le recruteur', () => {
    const etat = partie(4)
    expect(choisirTalent(etat, 'oeilDuRecruteur')).toEqual([])
    etat.recruteur = 1
    expect(choisirTalent(etat, 'oeilDuRecruteur')).not.toEqual([])
  })
})

describe('manager et trésorerie', () => {
  it('s’embauche au prestige 5 et paie les salaires tout seul avec la trésorerie', () => {
    const etat = partie(5)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    expect(embaucherManager(partie(4))).toEqual([])
    const avant = etat.argent
    embaucherManager(etat)
    expect(etat.manager.embauche).toBe(true)
    expect(etat.argent).toBe(avant - PRIX_MANAGER)
    // Avec le manager, plus de boutons « Payer » : c'est lui qui paie.
    expect(peutPayerSalaires(etat, SECONDES_PAR_PAIE)).toBe(false)
    deposerTresorerie(etat, 200_000)
    expect(etat.tresorerie).toBe(200_000)
    avancerTemps(etat, 3 * 3600, aleatoireAvecGraine(3))
    // 3 h plus tard, tout le monde travaille encore : le manager a payé (et s'est payé).
    expect(etat.employes.every((e) => e.tempsPaye > 0 && e.etape !== 'attend')).toBe(true)
    expect(etat.manager.tempsPaye).toBeGreaterThan(0)
    expect(etat.tresorerie).toBeLessThan(200_000 - 18 * SALAIRE_MANAGER)
    expect(etat.stats.salairesPayes).toBe(200_000 - etat.tresorerie)
  })

  it('trésorerie vide : plus personne n’est payé, et on est prévenu', () => {
    const etat = partie(5)
    embaucher(etat, hasard())
    embaucherManager(etat)
    const messages = avancerTemps(etat, 3600, aleatoireAvecGraine(3))
    expect(etat.manager.tempsPaye).toBe(0)
    expect(etat.employes[0].etape).toBe('attend')
    expect(messages.some((m) => m.includes('trésorerie est vide'))).toBe(true)
    expect(alerteSalaires(etat)).toContain('Trésorerie vide')
    // On remet de l'argent : le manager se paie, puis paie le mineur, qui repart.
    deposerTresorerie(etat, 50_000)
    avancerTemps(etat, 5, aleatoireAvecGraine(3))
    expect(etat.manager.tempsPaye).toBeGreaterThan(0)
    expect(etat.employes[0].etape).not.toBe('attend')
  })

  it('sans assez pour tout le monde, le manager paie le plus de mineurs possible', () => {
    const etat = partie(5)
    embaucher(etat, hasard())
    embaucher(etat, hasard())
    const [cher, pasCher] = etat.employes
    cher.niveau = 4
    cher.rarete = 'mythique'
    embaucherManager(etat)
    for (const e of etat.employes) e.tempsPaye = 0
    // Assez pour le manager et le moins cher, pas pour le mythique.
    expect(manquePourUnePaie(etat)).toBe(SALAIRE_MANAGER + salaireEmploye(etat, cher) + salaireEmploye(etat, pasCher))
    etat.manager.tempsPaye = 0
    deposerTresorerie(etat, SALAIRE_MANAGER + salaireEmploye(etat, pasCher))
    avancerTemps(etat, 1, aleatoireAvecGraine(3))
    expect(pasCher.tempsPaye).toBeGreaterThan(0)
    expect(cher.tempsPaye).toBe(0)
    expect(manquePourUnePaie(etat)).toBeGreaterThan(0)
  })

  it('on peut reprendre l’argent de la trésorerie', () => {
    const etat = partie(5)
    embaucherManager(etat)
    deposerTresorerie(etat, 10_000)
    retirerTresorerie(etat, Infinity)
    expect(etat.tresorerie).toBe(0)
    expect(etat.argent).toBe(1_000_000 - PRIX_MANAGER)
  })

  it('au prestige, le manager et le recruteur restent, la trésorerie repart de 0', () => {
    const etat = partie(5)
    embaucherManager(etat)
    etat.recruteur = 2
    deposerTresorerie(etat, 10_000)
    const suite = prestige(etat, aleatoireAvecGraine(4))
    expect(suite.manager.embauche).toBe(true)
    expect(suite.manager.tempsPaye).toBeGreaterThanOrEqual(SECONDES_PAR_PAIE)
    expect(suite.recruteur).toBe(2)
    expect(suite.tresorerie).toBe(0)
  })
})
