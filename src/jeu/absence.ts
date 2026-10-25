// Ce qui s'est passé pendant que le jeu était fermé (30/10). Le jeu continue de tourner (au plus
// 8 h) : la mine sort ses blocs, les mineurs payés creusent, les wagonnets vendent, la foreuse
// fore. Au retour, une fenêtre résume tout.
// (25/10, demandé par le propriétaire) Au retour, le coffre de la mine est vendu tout seul (il
// était souvent plein, et ne se vidait pas tant que les employés n'étaient pas payés). Le chiffre
// en grand est le BÉNÉFICE NET : ce que le joueur a en plus dans sa poche, salaires déduits.

import type { EtatJeu } from './mineur'
import { encaisser, nbDansCoffre, vendreCoffre } from './mineur'
import { nbDansChariot } from './foreuse'
import { managerActif, nbSansSalaire, prochainNiveauManager, secondesEveilManager } from './employes'
import { nombre, t } from './langue'

export type ResumeAbsence = {
  secondes: number // le temps passé
  blocsMineurs: number // ce que les mineurs ont creusé
  blocsMine: number // ce que la mine a sorti toute seule
  blocsForeuse: number // ce que la foreuse a foré
  coffre: number // les blocs en plus dans le coffre de la mine
  argent: number // l'argent gagné (wagonnets)
  ventesWagonnets: number // (23/10) ce que les wagonnets ont vendu au marché
  voyages: number // les voyages des wagonnets
  sansSalaire: number // les mineurs qui attendent leur salaire au retour
  // (23/10) Le temps d'absence que couvre le manager (il paie les salaires jeu fermé), en
  // secondes ; null sans manager (ou s'il est arrêté). « managerAuMax » : plus d'amélioration.
  absenceMax: number | null
  managerAuMax: boolean
  // (25/10) L'argent : ce que le coffre a rapporté en étant vendu au retour, les salaires payés
  // pendant l'absence, et le bénéfice net (l'argent en plus dans la poche, salaires déduits :
  // il peut être négatif).
  venteCoffre: number
  salaires: number
  // Le reste, pour que le compte tombe juste : surtout ce que le manager a vendu du coffre pour
  // payer les salaires (positif), ou d'autres dépenses (négatif).
  autres: number
  net: number
  // Ce qu'une publicité double : le bénéfice net (0 s'il est négatif).
  gains: number
}

// Ce qu'on retient de la partie avant de rattraper le temps.
export type PhotoPartie = { blocsMineurs: number; blocsMine: number; blocsForeuse: number; coffre: number; chariot: number; argent: number; voyages: number; ventesWagonnets: number; salaires: number }

export function photoPartie(etat: EtatJeu): PhotoPartie {
  return {
    blocsMineurs: etat.stats.blocsMineurs,
    blocsMine: etat.stats.blocsMine,
    blocsForeuse: etat.stats.blocsForeuse,
    coffre: nbDansCoffre(etat),
    chariot: nbDansChariot(etat),
    argent: etat.argent,
    voyages: etat.stats.voyagesWagonnet,
    ventesWagonnets: etat.stats.argentWagonnet,
    salaires: etat.stats.salairesPayes,
  }
}

// (25/10) Au retour : on vend le coffre de la mine au marché (sauf ce que le joueur garde 📌).
// Renvoie ce que la vente a rapporté.
export function vendreCoffreAuRetour(etat: EtatJeu): number {
  const avant = etat.argent
  vendreCoffre(etat)
  return Math.round(etat.argent - avant)
}

// Le résumé, en comparant la partie avant et après (null si rien ne s'est passé).
// « venteCoffre » : ce qu'a rapporté le coffre vendu au retour (vendreCoffreAuRetour).
export function resumerAbsence(avant: PhotoPartie, etat: EtatJeu, secondes: number, venteCoffre = 0): ResumeAbsence | null {
  const net = Math.round(etat.argent - avant.argent)
  const resume: ResumeAbsence = {
    secondes,
    blocsMineurs: etat.stats.blocsMineurs - avant.blocsMineurs,
    blocsMine: etat.stats.blocsMine - avant.blocsMine,
    blocsForeuse: etat.stats.blocsForeuse - avant.blocsForeuse,
    coffre: nbDansCoffre(etat) - avant.coffre,
    argent: Math.max(0, Math.round(etat.argent - avant.argent)),
    voyages: etat.stats.voyagesWagonnet - avant.voyages,
    ventesWagonnets: Math.max(0, Math.round(etat.stats.argentWagonnet - avant.ventesWagonnets)),
    sansSalaire: nbSansSalaire(etat),
    absenceMax: managerActif(etat) ? secondesEveilManager(etat) : null,
    managerAuMax: prochainNiveauManager(etat) === null,
    venteCoffre,
    salaires: Math.round(etat.stats.salairesPayes - avant.salaires),
    autres: 0,
    net,
    gains: Math.max(0, net),
  }
  // ventes des wagonnets + coffre vendu au retour + autres − salaires = bénéfice net
  resume.autres = resume.net - resume.ventesWagonnets - resume.venteCoffre + resume.salaires
  const rien = resume.blocsMineurs + resume.blocsMine + resume.blocsForeuse + resume.argent + resume.voyages <= 0
  return rien && resume.sansSalaire === 0 ? null : resume
}

// (25/10) Doubler l'absence en regardant une publicité : on reçoit encore une fois le bénéfice
// net de l'absence (en argent).
export function doublerAbsence(etat: EtatJeu, resume: ResumeAbsence): string[] {
  if (resume.gains <= 0) return []
  encaisser(etat, resume.gains)
  return [t('💰 Gains doublés : +{gains} $ !', { gains: nombre(resume.gains) })]
}
