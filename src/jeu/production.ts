// La production de la mine (27/10), pour le tableau de bord du panneau de la mine : combien de
// blocs sortent par seconde, d'où ils viennent (la mine toute seule, chaque mineur), et ce que
// ça rapporte à peu près ; et les goulots (l'ascenseur, le wagonnet du marché suivent-ils ?).
// Ce sont des moyennes : les vrais blocs sont tirés au hasard.

import { blocsParSecondeEmploye, vitesseMineurs } from './employes'
import { valeurMoyenneBloc } from './mine'
import { coffrePlein, debitAscenseur, debitMine, prochainNiveauAscenseur, type EtatJeu, type Employe } from './mineur'
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

// L'ascenseur (23/10) : sa caisse fait des allers-retours sans cesse et remonte au plus
// « capacité / durée d'un aller-retour » blocs par seconde. Si les mineurs creusent plus que ça,
// leurs sacs se remplissent au fond et ils attendent la caisse au lieu de creuser.
export type AnalyseAscenseur = {
  debit: number // blocs par seconde que l'ascenseur peut remonter au plus
  creuse: number // blocs par seconde que creusent les mineurs payés
  remplissage: number // 0 à 1 (ou plus) : la part de la caisse que les mineurs remplissent
  gainProchainNiveau: number | null // blocs/s de plus avec le niveau suivant (null : niveau max)
  tropLent: boolean // les mineurs attendent la caisse : l'améliorer vaut le coup
}

// Le niveau suivant de l'ascenseur doit rapporter au moins cette part de ce que sortent les
// mineurs (10 %) pour qu'on le conseille.
const GAIN_ASCENSEUR_UTILE = 0.1

export function analyseAscenseur(etat: EtatJeu): AnalyseAscenseur {
  const creuse = vitesseMineurs(etat)
  const debit = debitAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  let gain: number | null = null
  if (prochain) {
    const avecProchain = { ...etat, ascenseur: { ...etat.ascenseur, niveau: prochain.niveau } }
    gain = Math.min(creuse, debitAscenseur(avecProchain)) - Math.min(creuse, debit)
  }
  // (30/10) Pas d'alerte pour un gain minuscule (« +0,01 bloc/s ») : il faut que ça vaille le coup.
  const gainUtile = gain !== null && gain >= GAIN_ASCENSEUR_UTILE * Math.min(creuse, debit)
  return { debit, creuse, remplissage: debit > 0 ? creuse / debit : 0, gainProchainNiveau: gain, tropLent: prochain !== null && creuse > debit && gainUtile }
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
