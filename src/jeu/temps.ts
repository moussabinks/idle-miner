// Le temps qui passe : le joueur grimpe à l'échelle, l'ascenseur voyage et la
// foreuse creuse. L'interface appelle avancerTemps plusieurs fois par seconde.

import type { Aleatoire } from './aleatoire'
import { avancerForeuse } from './foreuse'
import { avancerAscenseur, avancerSurEchelle, type EtatJeu } from './mineur'

export function avancerTemps(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  return [...avancerSurEchelle(etat, secondes), ...avancerAscenseur(etat, secondes), ...avancerForeuse(etat, secondes, aleatoire)]
}

// Y a-t-il quelque chose qui bouge tout seul (et donc besoin de faire avancer le temps) ?
export function tempsQuiPasse(etat: EtatJeu): boolean {
  const foreuseTourne = etat.foreuse.active && etat.foreuse.carburant > 0
  return etat.position !== etat.cible || etat.ascenseur.tempsRestant > 0 || foreuseTourne
}
