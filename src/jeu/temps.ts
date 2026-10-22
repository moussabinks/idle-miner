// Le temps qui passe (22/10) : la mine sort ses blocs toute seule, les mineurs travaillent, la
// foreuse fore, le générateur brûle sa redstone et les wagonnets roulent sur les rails.
// L'interface appelle avancerTemps plusieurs fois par seconde.

import type { Aleatoire } from './aleatoire'
import { avancerEmployes } from './employes'
import { avancerForeuse } from './foreuse'
import { avancerGenerateur } from './generateur'
import { avancerMine, type EtatJeu } from './mineur'
import { avancerWagonnets } from './wagonnet'

// Après une longue absence, on avance par morceaux d'une minute au plus : le générateur se
// recharge dans le coffre, les wagonnets font plusieurs voyages...
const PAS_MAX = 60

export function avancerTemps(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  let reste = secondes
  while (reste > 1e-9) {
    const pas = Math.min(reste, PAS_MAX)
    messages.push(
      ...avancerMine(etat, pas, aleatoire),
      ...avancerGenerateur(etat, pas),
      ...avancerForeuse(etat, pas, aleatoire),
      ...avancerEmployes(etat, pas, aleatoire),
      ...avancerWagonnets(etat, pas),
    )
    reste -= pas
  }
  return [...new Set(messages)]
}
