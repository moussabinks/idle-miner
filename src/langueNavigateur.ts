// Choisir la langue au démarrage (25/10) : celle que le joueur a choisie la dernière fois (sur
// l'accueil ou dans les réglages), sinon l'anglais (la langue du jeu par défaut, demandé par le
// propriétaire : on choisit le français avec son drapeau).

import { changerLangue, type Langue } from './jeu/langue'
import { ecrireReglage, lireReglage } from './stockage'

const CLE_LANGUE = 'idle-miner-langue'

export function langueDeDepart(): Langue {
  const choisie = lireReglage(CLE_LANGUE)
  if (choisie === 'fr' || choisie === 'en') return choisie
  return 'en'
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
