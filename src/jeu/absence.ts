// Ce qui s'est passé pendant que le jeu était fermé (30/10). Le jeu continue de tourner (au plus
// 8 h) : la mine sort ses blocs, les mineurs payés creusent, les wagonnets vendent, la foreuse
// fore. Au retour, une fenêtre résume tout. (23/10) Le chiffre en grand : ce que les pousseurs
// ont vendu au marché avec leurs wagonnets.

import type { EtatJeu } from './mineur'
import { encaisser, nbDansCoffre, valeurDe } from './mineur'
import { nbDansChariot } from './foreuse'
import { managerActif, nbSansSalaire, prochainNiveauManager, secondesEveilManager } from './employes'

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
  // (25/10) Tout ce que l'absence a rapporté, en dollars : l'argent gagné, plus ce qui attend dans
  // le coffre et le chariot de la foreuse (à leur prix). C'est ce qu'une publicité double.
  gains: number
}

// Ce qu'on retient de la partie avant de rattraper le temps.
export type PhotoPartie = { blocsMineurs: number; blocsMine: number; blocsForeuse: number; coffre: number; chariot: number; argent: number; voyages: number; ventesWagonnets: number; valeurStock: number; gagne: number }

// La valeur de ce qui attend d'être vendu (le coffre et le chariot de la foreuse).
function valeurStock(etat: EtatJeu): number {
  return valeurDe(etat.coffre.contenu) + valeurDe(etat.foreuse.chariot)
}

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
    valeurStock: valeurStock(etat),
    gagne: etat.stats.argentGagne,
  }
}

// Le résumé, en comparant la partie avant et après (null si rien ne s'est passé).
export function resumerAbsence(avant: PhotoPartie, etat: EtatJeu, secondes: number): ResumeAbsence | null {
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
    gains: Math.max(0, Math.round(etat.stats.argentGagne - avant.gagne + valeurStock(etat) - avant.valeurStock)),
  }
  const rien = resume.blocsMineurs + resume.blocsMine + resume.blocsForeuse + resume.argent + resume.voyages <= 0
  return rien && resume.sansSalaire === 0 ? null : resume
}

// (25/10) Doubler l'absence en regardant une publicité : on reçoit encore une fois tout ce que
// l'absence a rapporté (en argent).
export function doublerAbsence(etat: EtatJeu, resume: ResumeAbsence): string[] {
  if (resume.gains <= 0) return []
  encaisser(etat, resume.gains)
  return [`💰 Gains doublés : +${resume.gains.toLocaleString('fr-FR')} $ !`]
}
