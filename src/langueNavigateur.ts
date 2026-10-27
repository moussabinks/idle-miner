// Choisir la langue au démarrage (25/10) : celle que le joueur a choisie la dernière fois (sur
// l'accueil ou dans les réglages), sinon l'anglais (la langue du jeu par défaut, demandé par le
// propriétaire : on choisit le français avec son drapeau). (27/10) Un navigateur en espagnol ou en
// portugais démarre dans sa langue.

import { changerLangue, estUneLangue, type Langue } from './jeu/langue'
import { ecrireReglage, lireReglage } from './stockage'

const CLE_LANGUE = 'idle-miner-langue'

export function langueDeDepart(): Langue {
  const choisie = lireReglage(CLE_LANGUE)
  if (estUneLangue(choisie)) return choisie
  // (27/10) Pas encore de choix : la langue du navigateur si le jeu la parle, sinon l'anglais.
  const navigateur = (typeof navigator !== 'undefined' ? navigator.language : '').slice(0, 2)
  if (navigateur === 'es' || navigateur === 'pt') return navigateur
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
