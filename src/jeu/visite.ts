// La visite du village d'un autre joueur (26/10, demandé par le propriétaire) : depuis le
// classement, le bouton « Visiter » montre le village d'un des 10 premiers. On ne peut rien y
// toucher, on n'y voit ni bulle ni message : seulement son village qui vit.
//
// Ses employés travaillent toujours pendant la visite, même si son manager dort ou si leur
// salaire n'est plus payé : c'est juste pour l'animation. Ils travaillent « dans le vide » :
// rien de ce qu'ils font n'est gardé (la visite ne touche jamais à la vraie partie du joueur).
//
// Le joueur envoie le village de son meilleur monde avec son score (useCompte.ts) : c'est
// `villageAPartager` qui le choisit.

import type { Aleatoire } from './aleatoire'
import { SECONDES_PAR_PAIE } from './donnees'
import { capaciteChariot, nbDansChariot } from './foreuse'
import { coffrePlein, type EtatJeu } from './mineur'
import { charger, lirePartie, mondesDeLaCopie, type SauvegardeComplete } from './sauvegarde'
import { avancerTemps } from './temps'

// Les réserves (charbon de la foreuse et de la fonderie, redstone du générateur) restent
// toujours pleines d'au moins une minute pendant la visite.
const RESERVE_VISITE = 60 // secondes

// La partie du meilleur monde de la copie (celui qui a gagné le plus d'argent), prête à être
// envoyée en ligne pour les visites ; null s'il n'y a aucun monde.
export function villageAPartager(copie: SauvegardeComplete): EtatJeu | null {
  const stockage = { getItem: (cle: string) => copie[cle] ?? null, setItem: () => {}, removeItem: () => {} }
  let meilleur: EtatJeu | null = null
  for (const monde of mondesDeLaCopie(copie)) {
    const etat = charger(stockage, monde.id)
    if (etat && (meilleur === null || etat.stats.argentGagne > meilleur.stats.argentGagne)) meilleur = etat
  }
  return meilleur
}

// La partie reçue du serveur, prête pour la visite (null si elle est abîmée).
export function preparerVisite(donnees: unknown): EtatJeu | null {
  const etat = lirePartie(donnees)
  if (etat === null) return null
  // Une réorganisation en cours met le jeu en pause : pendant la visite, le village tourne.
  if (etat.reorganisation) {
    etat.village = etat.reorganisation.avant
    etat.reorganisation = null
  }
  etat.tutoriel = undefined
  entretenir(etat)
  return etat
}

// Tout ce qui pourrait arrêter les employés est remis en ordre : ils sont toujours payés, le
// manager ne dort jamais, le coffre et le chariot de la foreuse se vident quand ils sont pleins,
// et les réserves ne s'épuisent pas.
function entretenir(etat: EtatJeu): void {
  for (const employe of etat.employes) employe.tempsPaye = SECONDES_PAR_PAIE
  etat.manager.tempsPaye = SECONDES_PAR_PAIE
  etat.manager.fatigue = 0
  if (coffrePlein(etat)) etat.coffre.contenu = {}
  if (nbDansChariot(etat) >= capaciteChariot(etat)) etat.foreuse.chariot = {}
  etat.foreuse.carburant = Math.max(etat.foreuse.carburant, RESERVE_VISITE)
  etat.generateur.carburant = Math.max(etat.generateur.carburant, RESERVE_VISITE)
  etat.fonderie.carburant = Math.max(etat.fonderie.carburant, RESERVE_VISITE)
}

// Le temps passe dans le village visité (les messages du jeu sont oubliés : aucune notification).
export function avancerVisite(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): void {
  entretenir(etat)
  avancerTemps(etat, secondes, aleatoire)
  entretenir(etat)
}
