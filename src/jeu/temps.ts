// Le temps qui passe : le joueur marche jusqu'au puits, grimpe à l'échelle, les mineurs travaillent, l'ascenseur voyage et la
// foreuse creuse. L'interface appelle avancerTemps plusieurs fois par seconde.

import type { Aleatoire } from './aleatoire'
import { avancerEmployes } from './employes'
import { avancerForeuse } from './foreuse'
import { ascenseurEnMouvement, avancerAscenseur, avancerMarche, avancerSurEchelle, type EtatJeu } from './mineur'

export function avancerTemps(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  return [
    ...avancerMarche(etat, secondes),
    ...avancerSurEchelle(etat, secondes),
    ...avancerAscenseur(etat, secondes),
    ...avancerForeuse(etat, secondes, aleatoire),
    ...avancerEmployes(etat, secondes, aleatoire),
  ]
}

// Y a-t-il quelque chose qui bouge tout seul (et donc besoin de faire avancer le temps) ?
export function tempsQuiPasse(etat: EtatJeu): boolean {
  const foreuseTourne = etat.foreuse.active && etat.foreuse.carburant > 0
  return etat.position !== etat.cible || etat.depart !== null || ascenseurEnMouvement(etat) || foreuseTourne || etat.employes.length > 0
}
