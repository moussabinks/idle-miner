// Génération de la mine : quels blocs trouve-t-on à chaque profondeur ?
// Les profondeurs de la spec v1 (mine de 64 m) ont été agrandies pour une mine de référence
// de 150 m ; depuis le 19/10, elles sont mises à l'échelle de la mine de chaque prestige
// (100 m au prestige 0, 150 m au prestige 1, 200 m au prestige 2...).

import { choisirPondere, type Aleatoire } from './aleatoire'
import { BLOCS, LARGEUR_MINE, POIDS_ROCHE, PROFONDEUR_DEEPSLATE, versReference, type IdBloc } from './donnees'

// Comment chaque minerai apparaît : à partir de « debut » mètres il pèse « poidsDebut »,
// puis son poids grandit régulièrement jusqu'à « poidsPlein » à « plein » mètres.
type Apparition = { bloc: IdBloc; debut: number; plein: number; poidsDebut: number; poidsPlein: number }

export const APPARITION_MINERAIS: Apparition[] = [
  { bloc: 'charbon', debut: 8, plein: 35, poidsDebut: 6, poidsPlein: 16 },
  { bloc: 'fer', debut: 8, plein: 41, poidsDebut: 3, poidsPlein: 12 },
  { bloc: 'redstone', debut: 21, plein: 59, poidsDebut: 0.5, poidsPlein: 6 },
  { bloc: 'or', debut: 29, plein: 76, poidsDebut: 0.4, poidsPlein: 5 },
  { bloc: 'lapis', debut: 35, plein: 76, poidsDebut: 0.5, poidsPlein: 6 },
  { bloc: 'emeraude', debut: 47, plein: 82, poidsDebut: 0.2, poidsPlein: 2 },
  { bloc: 'diamant', debut: 53, plein: 117, poidsDebut: 0.2, poidsPlein: 5 },
  // Les débris antiques restent très rares, tout au fond.
  { bloc: 'debris', debut: 112, plein: 135, poidsDebut: 0.2, poidsPlein: 1 },
]

// Le poids d'un minerai à une profondeur (0 s'il n'est pas encore apparu).
export function poidsProgressif(profondeur: number, apparition: Apparition): number {
  if (profondeur < apparition.debut) return 0
  if (profondeur >= apparition.plein) return apparition.poidsPlein
  const avancement = (profondeur - apparition.debut) / (apparition.plein - apparition.debut)
  return apparition.poidsDebut + (apparition.poidsPlein - apparition.poidsDebut) * avancement
}

// Liste des blocs possibles à une profondeur, avec leur poids.
// Plus le poids est grand, plus le bloc est fréquent.
// Toutes les profondeurs ci-dessous sont celles de la mine de référence (150 m) : on convertit
// d'abord la vraie profondeur, selon la taille de la mine du prestige (voir donnees.ts).
export function poidsDesBlocs(profondeur: number, prestige: number): { valeur: IdBloc; poids: number }[] {
  const p = versReference(profondeur, prestige)
  const choix: { valeur: IdBloc; poids: number }[] = []

  // La roche de base change avec la profondeur.
  if (p <= 7) choix.push({ valeur: 'terre', poids: POIDS_ROCHE })
  else if (p <= PROFONDEUR_DEEPSLATE) choix.push({ valeur: 'pierre', poids: POIDS_ROCHE })
  else choix.push({ valeur: 'deepslate', poids: POIDS_ROCHE })

  if (p <= 56) choix.push({ valeur: 'gravier', poids: p <= 7 ? 30 : 10 })

  // Les minerais apparaissent petit à petit (choix du 19/10) : chacun commence très rare
  // à sa profondeur de départ, puis devient de plus en plus fréquent jusqu'à sa profondeur
  // « pleine ». Le joueur découvre ainsi un peu de redstone, d'or, de lapis... bien avant
  // d'en trouver beaucoup : pas de changement brutal.
  for (const minerai of APPARITION_MINERAIS) {
    const poids = poidsProgressif(p, minerai)
    if (poids > 0) choix.push({ valeur: minerai.bloc, poids })
  }

  // Blocs spéciaux.
  if (p > 19) choix.push({ valeur: 'coffre', poids: 0.8 })
  if (p > 47) choix.push({ valeur: 'lave', poids: 1.5 })
  if (p > 59) choix.push({ valeur: 'geode', poids: 1 })

  return choix
}

// Tire un bloc au hasard à une profondeur donnée.
export function tirerBloc(profondeur: number, aleatoire: Aleatoire, prestige: number): IdBloc {
  return choisirPondere(aleatoire, poidsDesBlocs(profondeur, prestige))
}

// Tire un bloc « normal » (pas de lave, de coffre ni de géode) : pour la foreuse.
export function tirerBlocNormal(profondeur: number, aleatoire: Aleatoire, prestige: number): IdBloc {
  const choix = poidsDesBlocs(profondeur, prestige).filter((c) => !BLOCS[c.valeur].special)
  return choisirPondere(aleatoire, choix)
}

// Génère une couche complète (LARGEUR_MINE blocs) à une profondeur donnée.
export function genererCouche(profondeur: number, aleatoire: Aleatoire, prestige: number): IdBloc[] {
  const couche: IdBloc[] = []
  for (let i = 0; i < LARGEUR_MINE; i++) couche.push(tirerBloc(profondeur, aleatoire, prestige))
  return couche
}
