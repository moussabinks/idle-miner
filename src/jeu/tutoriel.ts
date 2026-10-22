// Le tutoriel (27/10) : quand on commence un nouveau monde, Pépite (un hamster mineur) montre
// les bases, étape par étape, avec une flèche sur ce qu'il faut toucher. On ne passe à l'étape
// suivante qu'en faisant l'action demandée (sauf le bonjour et le bravo, avec un bouton).
//   1. bonjour ;
//   2. casser 10 blocs à la mine (tout va dans le coffre) ;
//   3. construire le marché (gratuit) ;
//   4. mettre le coffre dans son sac ;
//   5. vendre au marché ;
//   6. construire le forgeron (29/10) ;
//   7. bravo, et la suite : la liste des tâches en haut à droite. Ensuite, le joueur avance seul :
//      la liste des tâches lui dit quoi faire, sans l'obliger à rien.
// Ici, seulement les règles (où on en est, quand une étape est faite) : les textes et les flèches
// sont dans src/composants/Tutoriel.tsx.

import { nbDansSac, type EtatJeu } from './mineur'
import { batimentPose } from './village'

export type IdEtapeTutoriel = 'bonjour' | 'creuser' | 'marche' | 'sac' | 'vendre' | 'forgeron' | 'bravo'

export const ETAPES_TUTORIEL: IdEtapeTutoriel[] = ['bonjour', 'creuser', 'marche', 'sac', 'vendre', 'forgeron', 'bravo']

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
    case 'marche':
      return batimentPose(etat.village, 'marche') !== null
    case 'sac':
      return nbDansSac(etat) > 0 || etat.stats.argentGagne > 0
    case 'vendre':
      return etat.stats.argentGagne > 0
    case 'forgeron':
      return batimentPose(etat.village, 'forgeron') !== null
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
