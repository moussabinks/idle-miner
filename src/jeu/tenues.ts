// Les tenues du joueur (20/10), vendues au Bazar : un chapeau et un haut, seulement pour le
// style. Au début, le hamster n'a qu'une chemise toute simple ; les tenues achetées sont
// et on change de tenue gratuitement.

import { TENUES, type IdTenue, type PartieTenue } from './donnees'
import { aLaSurface, type EtatJeu } from './mineur'

export function tenueDebloquee(etat: EtatJeu, id: IdTenue): boolean {
  return etat.niveauMine >= TENUES[id].niveauMine
}

export function peutAcheterTenue(etat: EtatJeu, id: IdTenue): boolean {
  return tenueDebloquee(etat, id) && !etat.tenuesAchetees.includes(id) && etat.argent >= TENUES[id].prix
}

// Acheter une tenue : on la porte tout de suite.
export function acheterTenue(etat: EtatJeu, id: IdTenue): string[] {
  if (!aLaSurface(etat) || !peutAcheterTenue(etat, id)) return []
  etat.argent -= TENUES[id].prix
  etat.tenuesAchetees = [...etat.tenuesAchetees, id]
  etat.tenue = { ...etat.tenue, [TENUES[id].partie]: id }
  return [`👕 ${TENUES[id].nom} acheté(e) : tu le portes déjà !`]
}

// Porter une tenue achetée (null : enlever le chapeau, ou revenir à la chemise de départ).
export function porterTenue(etat: EtatJeu, partie: PartieTenue, id: IdTenue | null): string[] {
  if (id !== null && (!etat.tenuesAchetees.includes(id) || TENUES[id].partie !== partie)) return []
  etat.tenue = { ...etat.tenue, [partie]: id }
  return []
}
