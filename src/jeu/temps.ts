// Le temps qui passe (22/10) : la mine sort ses blocs toute seule, les mineurs travaillent, la
// foreuse fore, le générateur brûle sa redstone et les wagonnets roulent sur les rails. On compte
// aussi l'XP du joueur (niveaux.ts).
// L'interface appelle avancerTemps plusieurs fois par seconde.

import type { Aleatoire } from './aleatoire'
import { avancerFonderie, avancerJoaillerie } from './ateliers'
import { avancerEmployes, rareteDe } from './employes'
import { avancerForeuse } from './foreuse'
import { avancerGenerateur } from './generateur'
import { avancerMine, type EtatJeu } from './mineur'
import { mettreAJourXp } from './niveaux'
import { avancerWagonnets } from './wagonnet'

// Après une longue absence, on avance par morceaux d'une minute au plus : le générateur se
// recharge dans le coffre, les wagonnets font plusieurs voyages...
const PAS_MAX = 60

// (23/10) Jeu fermé comme jeu ouvert, le manager ne paie les salaires que tant qu'il est éveillé
// (sa fatigue, voir employes.ts).
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
      // (26/10) la fonderie fond, les joailliers taillent
      ...avancerFonderie(etat, pas),
      ...avancerJoaillerie(etat, pas, (e) => rareteDe(e).rendement),
      ...avancerWagonnets(etat, pas),
    )
    reste -= pas
  }
  // L'XP de tout ce qui a été fait depuis le dernier tic (clics, constructions, achats...).
  messages.push(...mettreAJourXp(etat))
  return [...new Set(messages)]
}
