// Génération de la mine : quels blocs trouve-t-on à chaque profondeur ?
// La mine descend jusqu'à -128 m (deux fois la v1) : les profondeurs de la
// spec v1 sont donc multipliées par 2.

import { choisirPondere, type Aleatoire } from './aleatoire'
import { BLOCS, LARGEUR_MINE, POIDS_ROCHE, PROFONDEUR_DEEPSLATE, type IdBloc } from './donnees'

// Liste des blocs possibles à une profondeur, avec leur poids.
// Plus le poids est grand, plus le bloc est fréquent.
export function poidsDesBlocs(profondeur: number): { valeur: IdBloc; poids: number }[] {
  const p = profondeur
  const choix: { valeur: IdBloc; poids: number }[] = []

  // La roche de base change avec la profondeur.
  if (p <= 6) choix.push({ valeur: 'terre', poids: POIDS_ROCHE })
  else if (p <= PROFONDEUR_DEEPSLATE) choix.push({ valeur: 'pierre', poids: POIDS_ROCHE })
  else choix.push({ valeur: 'deepslate', poids: POIDS_ROCHE })

  if (p <= 48) choix.push({ valeur: 'gravier', poids: p <= 6 ? 30 : 10 })

  // Minerais courants : un peu dès qu'on sort de la terre, puis plus souvent en profondeur.
  if (p > 6 && p <= 30) {
    choix.push({ valeur: 'charbon', poids: 10 })
    choix.push({ valeur: 'fer', poids: 6 })
  }
  if (p > 30) {
    choix.push({ valeur: 'charbon', poids: 16 })
    choix.push({ valeur: 'fer', poids: 12 })
  }

  // La redstone arrive un peu avant les autres minerais rares : elle sert à l'ascenseur.
  if (p > 40) choix.push({ valeur: 'redstone', poids: 6 })

  // Minerais rares.
  if (p > 60) {
    choix.push({ valeur: 'lapis', poids: 6 })
    choix.push({ valeur: 'or', poids: 5 })
    choix.push({ valeur: 'emeraude', poids: 2 })
    choix.push({ valeur: 'diamant', poids: p > PROFONDEUR_DEEPSLATE ? 5 : 2 })
  }
  // Les débris antiques sont très rares, tout au fond.
  if (p > 104) choix.push({ valeur: 'debris', poids: 1 })

  // Blocs spéciaux.
  if (p > 16) choix.push({ valeur: 'coffre', poids: 0.8 })
  if (p > 40) choix.push({ valeur: 'lave', poids: 1.5 })
  if (p > 50) choix.push({ valeur: 'geode', poids: 1 })

  return choix
}

// Tire un bloc au hasard à une profondeur donnée.
export function tirerBloc(profondeur: number, aleatoire: Aleatoire): IdBloc {
  return choisirPondere(aleatoire, poidsDesBlocs(profondeur))
}

// Tire un bloc « normal » (pas de lave, de coffre ni de géode) : pour la foreuse.
export function tirerBlocNormal(profondeur: number, aleatoire: Aleatoire): IdBloc {
  const choix = poidsDesBlocs(profondeur).filter((c) => !BLOCS[c.valeur].special)
  return choisirPondere(aleatoire, choix)
}

// Génère une couche complète (LARGEUR_MINE blocs) à une profondeur donnée.
export function genererCouche(profondeur: number, aleatoire: Aleatoire): IdBloc[] {
  const couche: IdBloc[] = []
  for (let i = 0; i < LARGEUR_MINE; i++) couche.push(tirerBloc(profondeur, aleatoire))
  return couche
}
