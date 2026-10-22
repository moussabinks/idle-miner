// Ce qui s'est passé pendant que le jeu était fermé (30/10). Le jeu continue de tourner (au plus
// 8 h) : la mine sort ses blocs, les mineurs payés creusent, les wagonnets vendent, la foreuse
// fore. Au retour, une fenêtre résume tout, avec un bouton « Tout récupérer ».

import type { EtatJeu } from './mineur'
import { nbDansCoffre } from './mineur'
import { nbDansChariot } from './foreuse'
import { nbSansSalaire } from './employes'

export type ResumeAbsence = {
  secondes: number // le temps passé
  blocsMineurs: number // ce que les mineurs ont creusé
  blocsMine: number // ce que la mine a sorti toute seule
  blocsForeuse: number // ce que la foreuse a foré
  coffre: number // les blocs en plus dans le coffre de la mine
  argent: number // l'argent gagné (wagonnets)
  voyages: number // les voyages des wagonnets
  sansSalaire: number // les mineurs qui attendent leur salaire au retour
}

// Ce qu'on retient de la partie avant de rattraper le temps.
export type PhotoPartie = { blocsMineurs: number; blocsMine: number; blocsForeuse: number; coffre: number; chariot: number; argent: number; voyages: number }

export function photoPartie(etat: EtatJeu): PhotoPartie {
  return {
    blocsMineurs: etat.stats.blocsMineurs,
    blocsMine: etat.stats.blocsMine,
    blocsForeuse: etat.stats.blocsForeuse,
    coffre: nbDansCoffre(etat),
    chariot: nbDansChariot(etat),
    argent: etat.argent,
    voyages: etat.stats.voyagesWagonnet,
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
    sansSalaire: nbSansSalaire(etat),
  }
  const rien = resume.blocsMineurs + resume.blocsMine + resume.blocsForeuse + resume.argent + resume.voyages <= 0
  return rien && resume.sansSalaire === 0 ? null : resume
}
