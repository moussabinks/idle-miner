// La production de la mine (27/10), pour le tableau de bord du panneau de la mine : combien de
// blocs sortent par seconde, d'où ils viennent (la mine toute seule, chaque mineur), et ce que
// ça rapporte à peu près ; et les goulots (l'ascenseur, le wagonnet du marché suivent-ils ?).
// Ce sont des moyennes : les vrais blocs sont tirés au hasard.

import { SECONDES_VIDAGE_EMPLOYE } from './donnees'
import { blocsParSecondeEmploye, tailleSacEmploye, vitesseEmploye } from './employes'
import { valeurMoyenneBloc } from './mine'
import { coffrePlein, debitMine, prochainNiveauAscenseur, secondesTrajetMineur, type EtatJeu, type Employe } from './mineur'
import { capaciteWagonnet, ligneDe, secondesAllerRetour, trajetDe, trajetElectrique, vitesseTrajet } from './wagonnet'

export type ProductionMineur = {
  index: number // sa place dans etat.employes
  employe: Employe
  blocsParSeconde: number // 0 s'il ne travaille pas (il attend son salaire)
  auTravail: boolean
}

export type Production = {
  mine: number // blocs par seconde sortis par la mine toute seule
  mineurs: ProductionMineur[] // chaque mineur (pas les pousseurs)
  totalMineurs: number // blocs par seconde, tous les mineurs au travail
  total: number // blocs par seconde, mine + mineurs
  dollarsParMinute: number // ce que vaut cette production au marché, environ
  arretee: boolean // le coffre est plein : plus rien ne rentre
}

export function production(etat: EtatJeu): Production {
  const arretee = coffrePlein(etat)
  const mineurs = etat.employes
    .map((employe, index) => ({ employe, index }))
    .filter(({ employe }) => employe.role === 'mineur')
    .map(({ employe, index }) => {
      // Un mineur qui attend son salaire ne creuse pas ; avec le coffre plein, il attend aussi.
      const auTravail = employe.etape !== 'attend' && !arretee
      return { index, employe, auTravail, blocsParSeconde: auTravail ? blocsParSecondeEmploye(etat, employe) : 0 }
    })
  const mine = arretee ? 0 : debitMine(etat)
  const totalMineurs = mineurs.reduce((total, m) => total + m.blocsParSeconde, 0)
  const total = mine + totalMineurs
  return { mine, mineurs, totalMineurs, total, dollarsParMinute: total * valeurMoyenneBloc(etat.niveauMine) * 60, arretee }
}

// ---------------------------------------------------------------------------
// Les goulots (27/10) : l'ascenseur et le wagonnet suivent-ils la production ?
// ---------------------------------------------------------------------------

// L'ascenseur : chaque mineur fait des allers-retours (creuser, remonter, vider, redescendre).
// Le temps passé dans le puits est du temps où il ne creuse pas. On calcule la part de leur
// temps perdue dans le puits, et ce que rapporterait le niveau suivant de l'ascenseur.
export type AnalyseAscenseur = {
  partDansLePuits: number // 0 à 1 : la part du temps des mineurs passée à monter et descendre
  gainProchainNiveau: number | null // blocs/s de plus avec le niveau suivant (null : niveau max)
  tropLent: boolean // les mineurs perdent beaucoup de temps : l'améliorer vaut le coup
}

// Au-delà de cette part du temps dans le puits, on prévient que l'ascenseur est trop lent.
export const PART_PUITS_TROP_LENTE = 0.2

export function analyseAscenseur(etat: EtatJeu): AnalyseAscenseur {
  const mineurs = etat.employes.filter((e) => e.role === 'mineur')
  if (mineurs.length === 0) return { partDansLePuits: 0, gainProchainNiveau: null, tropLent: false }
  const trajet = secondesTrajetMineur(etat)
  const part =
    mineurs.reduce((total, m) => {
      const sac = tailleSacEmploye(m)
      const cycle = sac / vitesseEmploye(m) + 2 * trajet + SECONDES_VIDAGE_EMPLOYE
      return total + (2 * trajet) / cycle
    }, 0) / mineurs.length
  const prochain = prochainNiveauAscenseur(etat)
  let gain: number | null = null
  if (prochain) {
    const avecProchain = { ...etat, ascenseur: { ...etat.ascenseur, niveau: prochain.niveau } }
    gain = mineurs.reduce((total, m) => total + blocsParSecondeEmploye(avecProchain, m) - blocsParSecondeEmploye(etat, m), 0)
  }
  return { partDansLePuits: part, gainProchainNiveau: gain, tropLent: prochain !== null && part > PART_PUITS_TROP_LENTE }
}

// Le wagonnet Mine → Marché : combien de blocs par seconde il peut emporter au plus (sa
// capacité, divisée par la durée d'un aller-retour avec ses deux arrêts de chargement et de
// vente), comparé à ce que la mine et les mineurs sortent dans le coffre.
export type AnalyseWagonnet = {
  moteur: 'electricite' | 'pousseur' | 'personne' // qui le fait rouler tout seul
  secondesAllerRetour: number
  debitMax: number // blocs par seconde qu'il peut emporter au plus
  apport: number // blocs par seconde qui arrivent dans le coffre
  surplus: number // blocs par seconde de trop (0 s'il suit)
}

export function analyseWagonnet(etat: EtatJeu): AnalyseWagonnet | null {
  const trajet = trajetDe(etat, 'mine-marche')
  if (!trajet || !ligneDe(etat, 'mine-marche')) return null
  const pousseur = etat.employes.find((e) => e.role === 'pousseur' && e.trajet === 'mine-marche' && e.tempsPaye > 0)
  // (27/10 : sans pousseur, rien ne part, même sur des rails électriques)
  const moteur = !pousseur ? 'personne' : trajetElectrique(etat, 'mine-marche') ? 'electricite' : 'pousseur'
  const vitesse = moteur === 'electricite' ? vitesseTrajet(etat, trajet, 'electricite') : pousseur ? vitesseTrajet(etat, trajet, pousseur.nom) : 0
  const duree = vitesse > 0 ? secondesAllerRetour(etat, 'mine-marche', vitesse) : 0
  const debitMax = duree > 0 ? capaciteWagonnet(etat) / duree : 0
  // (le coffre plein arrête la production : on compte ce que la mine sortirait sans s'arrêter)
  const apport = debitMine(etat) + etat.employes.filter((e) => e.role === 'mineur' && e.etape !== 'attend').reduce((t, m) => t + blocsParSecondeEmploye(etat, m), 0)
  return { moteur, secondesAllerRetour: duree, debitMax, apport, surplus: Math.max(0, apport - debitMax) }
}
