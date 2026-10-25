// Choisir la langue au démarrage (25/10) : celle que le joueur a choisie la dernière fois (dans
// les réglages), sinon celle de son navigateur (le français pour un navigateur en français,
// l'anglais pour tous les autres).

import { changerLangue, type Langue } from './jeu/langue'
import { ecrireReglage, lireReglage } from './stockage'

const CLE_LANGUE = 'idle-miner-langue'

export function langueDeDepart(): Langue {
  const choisie = lireReglage(CLE_LANGUE)
  if (choisie === 'fr' || choisie === 'en') return choisie
  const navigateur = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'fr'
  return navigateur.startsWith('fr') ? 'fr' : 'en'
}

// Change la langue du jeu et la retient pour la prochaine fois.
export function choisirLangue(nouvelle: Langue): void {
  changerLangue(nouvelle)
  ecrireReglage(CLE_LANGUE, nouvelle)
  document.documentElement.lang = nouvelle
}

// Au chargement de la page.
export function initialiserLangue(): void {
  const langue = langueDeDepart()
  changerLangue(langue)
  document.documentElement.lang = langue
}
