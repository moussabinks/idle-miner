// La fluidité sur téléphone (28/10, demandé par le propriétaire : le jeu ramait sur mobile, surtout
// carte dézoomée, en la faisant glisser).
//
// Un téléphone dessine bien moins vite qu'un ordinateur, sur un écran trois fois plus fin. Au doigt
// seulement (pointer: coarse), on allège donc deux choses ; l'ordinateur ne change pas :
//   - l'horloge du jeu redessine l'écran 10 fois par seconde au lieu de 20 (les personnages
//     glissent d'un point à l'autre en douceur, voir village.css) ;
//   - pendant qu'on fait glisser la carte, qu'on pince ou qu'on zoome à la molette, l'horloge ne
//     redessine plus rien (au plus 2 fois par seconde) et les animations du décor sont en pause
//     (VueVillage, surGeste) : le navigateur ne fait que déplacer l'image. (29/10 : sur tous les
//     appareils, ordinateur compris.)
// Le jeu, lui, ne s'arrête jamais : à chaque tic, il avance de tout le temps passé depuis le
// précédent (usePartie.ts).

export const SUR_TELEPHONE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

// ms entre deux tics de l'horloge du jeu
export const INTERVALLE_HORLOGE = SUR_TELEPHONE ? 100 : 50

// Pendant un geste, au plus un tic toutes les 500 ms.
const INTERVALLE_PENDANT_GESTE = 500
// Le geste est fini quand plus rien n'a bougé depuis 200 ms.
const FIN_DE_GESTE = 200

let dernierMouvement = -Infinity

// La carte vient de bouger sous le doigt ou la souris (VueVillage l'appelle à chaque mouvement,
// et à chaque cran de molette). (29/10) Sur tous les appareils : pendant un geste, l'horloge ne
// redessine qu'au plus 2 fois par seconde.
export function noterGeste(): void {
  dernierMouvement = performance.now()
}

export function gesteEnCours(maintenant = performance.now()): boolean {
  return maintenant - dernierMouvement < FIN_DE_GESTE
}

// L'horloge doit-elle attendre avant de redessiner ? (oui pendant un geste, sauf si le dernier
// tic est déjà vieux)
export function ticEnAttente(depuisDernierTic: number, maintenant = performance.now()): boolean {
  return gesteEnCours(maintenant) && depuisDernierTic < INTERVALLE_PENDANT_GESTE
}
