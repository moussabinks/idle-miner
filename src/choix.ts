// Les quantités choisies avec les jauges (marché et ascenseur) : ce n'est pas une règle
// du jeu, juste ce que le joueur a sélectionné à l'écran avant de vendre ou d'envoyer.

import type { IdBloc } from './jeu/donnees'

// Pour chaque objet : un nombre, ou « max » (= toute la pile, même si elle grossit).
export type Choix = Partial<Record<IdBloc, number | 'max'>>

// La quantité choisie pour une pile (jamais plus que la pile).
export function quantiteVoulue(choix: Choix, gardes: IdBloc[], bloc: IdBloc, nombre: number): number {
  const valeur = choix[bloc] ?? (gardes.includes(bloc) ? 0 : 'max')
  return valeur === 'max' ? nombre : Math.min(valeur, nombre)
}

// Le lot choisi : { fer: 4, or: 2, ... }.
export function lotChoisi(choix: Choix, gardes: IdBloc[], piles: [IdBloc, number][]): Partial<Record<IdBloc, number>> {
  const lot: Partial<Record<IdBloc, number>> = {}
  for (const [bloc, nombre] of piles) {
    const quantite = quantiteVoulue(choix, gardes, bloc, nombre)
    if (quantite > 0) lot[bloc] = quantite
  }
  return lot
}
