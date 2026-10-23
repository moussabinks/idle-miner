// Le temps qui passe (22/10) : la mine sort ses blocs toute seule, les mineurs travaillent, la
// foreuse fore, le générateur brûle sa redstone et les wagonnets roulent sur les rails. On compte
// aussi l'XP du joueur (niveaux.ts).
// L'interface appelle avancerTemps plusieurs fois par seconde.

import type { Aleatoire } from './aleatoire'
import { avancerEmployes, secondesManagerHorsLigne } from './employes'
import { avancerForeuse } from './foreuse'
import { avancerGenerateur } from './generateur'
import { avancerMine, type EtatJeu } from './mineur'
import { mettreAJourXp } from './niveaux'
import { avancerWagonnets } from './wagonnet'

// Après une longue absence, on avance par morceaux d'une minute au plus : le générateur se
// recharge dans le coffre, les wagonnets font plusieurs voyages...
const PAS_MAX = 60

// « horsLigne » : le temps passé jeu fermé (au retour du joueur). Le manager n'y paie les
// salaires que pendant un temps (30 min au départ, plus en l'améliorant : 23/10).
export function avancerTemps(etat: EtatJeu, secondes: number, aleatoire: Aleatoire, horsLigne = false): string[] {
  const messages: string[] = []
  const limiteManager = horsLigne ? secondesManagerHorsLigne(etat) : Infinity
  let reste = secondes
  while (reste > 1e-9) {
    const pas = Math.min(reste, PAS_MAX)
    messages.push(
      ...avancerMine(etat, pas, aleatoire),
      ...avancerGenerateur(etat, pas),
      ...avancerForeuse(etat, pas, aleatoire),
      ...avancerEmployes(etat, pas, aleatoire, secondes - reste < limiteManager),
      ...avancerWagonnets(etat, pas),
    )
    reste -= pas
  }
  // L'XP de tout ce qui a été fait depuis le dernier tic (clics, constructions, achats...).
  messages.push(...mettreAJourXp(etat))
  return [...new Set(messages)]
}
