// Génération de la mine : quels blocs trouve-t-on à chaque profondeur ?

import { choisirPondere, type Aleatoire } from './aleatoire'
import { LARGEUR_MINE, POIDS_ROCHE, type IdBloc } from './donnees'

// Liste des blocs possibles à une profondeur, avec leur poids.
// Plus le poids est grand, plus le bloc est fréquent.
export function poidsDesBlocs(profondeur: number): { valeur: IdBloc; poids: number }[] {
  const p = profondeur
  const choix: { valeur: IdBloc; poids: number }[] = []

  // La roche de base change avec la profondeur.
  if (p <= 3) choix.push({ valeur: 'terre', poids: POIDS_ROCHE })
  else if (p <= 40) choix.push({ valeur: 'pierre', poids: POIDS_ROCHE })
  else choix.push({ valeur: 'deepslate', poids: POIDS_ROCHE })

  if (p <= 24) choix.push({ valeur: 'gravier', poids: p <= 3 ? 30 : 10 })

  // Minerais courants.
  if (p > 15) {
    choix.push({ valeur: 'charbon', poids: 16 })
    choix.push({ valeur: 'fer', poids: 12 })
  }

  // Minerais rares.
  if (p > 30) {
    choix.push({ valeur: 'redstone', poids: 6 })
    choix.push({ valeur: 'lapis', poids: 6 })
    choix.push({ valeur: 'or', poids: 5 })
    choix.push({ valeur: 'emeraude', poids: 2 })
    choix.push({ valeur: 'diamant', poids: p > 40 ? 5 : 2 })
  }
  if (p > 52) choix.push({ valeur: 'debris', poids: 2 })

  // Blocs spéciaux.
  if (p > 8) choix.push({ valeur: 'coffre', poids: 0.8 })
  if (p > 20) choix.push({ valeur: 'lave', poids: 1.5 })
  if (p > 25) choix.push({ valeur: 'geode', poids: 1 })

  return choix
}

// Tire un bloc au hasard à une profondeur donnée.
export function tirerBloc(profondeur: number, aleatoire: Aleatoire): IdBloc {
  return choisirPondere(aleatoire, poidsDesBlocs(profondeur))
}

// Génère une couche complète (LARGEUR_MINE blocs) à une profondeur donnée.
export function genererCouche(profondeur: number, aleatoire: Aleatoire): IdBloc[] {
  const couche: IdBloc[] = []
  for (let i = 0; i < LARGEUR_MINE; i++) couche.push(tirerBloc(profondeur, aleatoire))
  return couche
}
