// La fluidité sur téléphone (28/10, demandé par le propriétaire : le jeu ramait sur mobile, surtout
// carte dézoomée, en la faisant glisser).
//
// Un téléphone dessine bien moins vite qu'un ordinateur, sur un écran trois fois plus fin. Au doigt
// seulement (pointer: coarse), on allège donc l'horloge ; l'ordinateur ne change pas :
//   - l'horloge du jeu redessine l'écran 10 fois par seconde au lieu de 20 (les personnages
//     glissent d'un point à l'autre en douceur, voir village.css) ;
//   - (29/10, demandé par le propriétaire) plus rien ne s'arrête pendant qu'on fait glisser la
//     carte ou qu'on zoome : l'horloge et le décor continuent (avant, ils se mettaient en pause
//     pendant le geste, et ça se voyait : l'ascenseur s'arrêtait, les oiseaux sautaient).
// Le jeu, lui, ne s'arrête jamais : à chaque tic, il avance de tout le temps passé depuis le
// précédent (usePartie.ts).

export const SUR_TELEPHONE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

// ms entre deux tics de l'horloge du jeu
export const INTERVALLE_HORLOGE = SUR_TELEPHONE ? 100 : 50
