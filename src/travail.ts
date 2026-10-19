// Le minage du joueur, tic après tic : combien de temps il a passé sur son bloc.
// (Ce n'est pas une règle du jeu, juste la façon dont l'horloge de l'interface découpe le temps.)

export const DUREE_MIN_BLOC = 0.08 // secondes, pour que l'animation reste visible

// Le travail du mineur sur un bloc : quel bloc (cle), depuis combien de secondes, et le
// temps « en trop » du bloc d'avant (reste), qui compte pour le bloc suivant.
export type Travail = { cle: string; temps: number; reste: number }

// Fait avancer un mineur sur son bloc. Renvoie true quand le bloc est cassé.
// Si le mineur a changé de bloc, il repart de zéro... plus le temps en trop du bloc d'avant.
// Sans ce « reste », le temps entre la fin du bloc et le tic suivant serait perdu : on
// creuserait plus vite quand l'horloge bat souvent (pendant un trajet d'ascenseur, à chaque
// image de l'écran) que quand elle bat 20 fois par seconde. C'était un bug (19/10).
export function travailler(travail: Travail, cle: string, duree: number, secondes: number): boolean {
  if (travail.cle !== cle) {
    travail.cle = cle
    travail.temps = travail.reste
    travail.reste = 0
  }
  travail.temps += secondes
  const besoin = Math.max(DUREE_MIN_BLOC, duree)
  if (travail.temps < besoin) return false
  // Pas plus d'un bloc d'avance (après une pause de l'onglet, par exemple).
  travail.reste = Math.min(travail.temps - besoin, besoin)
  travail.cle = ''
  return true
}
