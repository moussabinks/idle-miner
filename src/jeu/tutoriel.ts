// Le tutoriel (27/10) : quand on commence un nouveau monde, Pépite (une taupe mineuse) montre
// les bases, étape par étape, avec une flèche sur ce qu'il faut toucher. On ne passe à l'étape
// suivante qu'en faisant l'action demandée (sauf le bonjour et le bravo, avec un bouton).
// (25/10) Plus court, et jusqu'au moment fort : le premier mineur qui creuse tout seul.
//   1. bonjour ;
//   2. casser 10 blocs à la mine (tout va dans le coffre) ;
//   3. vendre le coffre (depuis la mine, d'un clic) ;
//   4. construire le Personnel ;
//   5. embaucher son premier mineur ;
//   6. bravo, et la suite : la liste des tâches. Ensuite, le joueur avance seul.
// Ici, seulement les règles (où on en est, quand une étape est faite) : les textes et les flèches
// sont dans src/composants/Tutoriel.tsx.

import type { EtatJeu } from './mineur'
import { batimentPose } from './village'

export type IdEtapeTutoriel = 'bonjour' | 'creuser' | 'vendre' | 'personnel' | 'embaucher' | 'bravo'

export const ETAPES_TUTORIEL: IdEtapeTutoriel[] = ['bonjour', 'creuser', 'vendre', 'personnel', 'embaucher', 'bravo']

// Les blocs à casser à la main avant d'aller plus loin.
export const BLOCS_TUTORIEL = 10

// Les étapes qui se passent avec un bouton (pas d'action à faire dans le jeu).
const AVEC_BOUTON: IdEtapeTutoriel[] = ['bonjour', 'bravo']

// L'étape en cours (null : pas de tutoriel, ou il est fini). Une vieille partie n'a pas le
// champ : pas de tutoriel pour elle.
export function etapeTutoriel(etat: EtatJeu): IdEtapeTutoriel | null {
  if (etat.tutoriel === undefined) return null
  return ETAPES_TUTORIEL[etat.tutoriel] ?? null
}

export function avecBouton(etape: IdEtapeTutoriel): boolean {
  return AVEC_BOUTON.includes(etape)
}

// L'action de cette étape est-elle faite ?
export function etapeFaite(etat: EtatJeu, etape: IdEtapeTutoriel): boolean {
  switch (etape) {
    case 'creuser':
      return etat.stats.blocsCasses >= BLOCS_TUTORIEL
    case 'vendre':
      return etat.stats.argentGagne > 0
    case 'personnel':
      return batimentPose(etat.village, 'employes') !== null
    case 'embaucher':
      return etat.employes.some((e) => e.role === 'mineur')
    default:
      return false
  }
}

// On passe les étapes déjà faites (si le joueur a pris de l'avance).
export function avancerTutoriel(etat: EtatJeu): string[] {
  let etape = etapeTutoriel(etat)
  while (etape !== null && !avecBouton(etape) && etapeFaite(etat, etape)) {
    etat.tutoriel = (etat.tutoriel ?? 0) + 1
    etape = etapeTutoriel(etat)
  }
  return []
}

// Le bouton d'une étape (« C'est parti ! », « Terminer »).
export function etapeSuivante(etat: EtatJeu): string[] {
  const etape = etapeTutoriel(etat)
  if (etape === null || !avecBouton(etape)) return []
  etat.tutoriel = (etat.tutoriel ?? 0) + 1
  return avancerTutoriel(etat)
}

export function passerTutoriel(etat: EtatJeu): string[] {
  etat.tutoriel = ETAPES_TUTORIEL.length
  return []
}
