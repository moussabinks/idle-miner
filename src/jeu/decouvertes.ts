// Ce qui se débloque en descendant dans la mine : le manager (niveau 3) et le recruteur
// (niveau 4, inversés le 23/10), au stand Personnel. Tant que le joueur n'est pas allé voir, une bulle ✨ saute
// au-dessus du bâtiment (voir notifications.ts). Elle disparaît (pour de bon) dès qu'il arrive devant.

import { managerDebloque, recruteurDebloque } from './employes'
import type { Decouverte, EtatJeu } from './mineur'

// Le bâtiment où se trouve chaque découverte, et son nom dans la bulle.
export const DECOUVERTES: Record<Decouverte, { stand: 'employes'; nom: string }> = {
  recruteur: { stand: 'employes', nom: 'Recruteur' },
  manager: { stand: 'employes', nom: 'Manager' },
}

// Ce qui est débloqué et que le joueur n'est pas encore allé voir.
export function decouvertesAMontrer(etat: EtatJeu): Decouverte[] {
  const debloques: Decouverte[] = []
  if (recruteurDebloque(etat)) debloques.push('recruteur')
  if (managerDebloque(etat)) debloques.push('manager')
  return debloques.filter((id) => !etat.decouvertes.includes(id))
}

// Le joueur est arrivé devant le stand : on ne montre plus la bulle.
export function marquerDecouvert(etat: EtatJeu, ids: Decouverte[]): string[] {
  const nouvelles = ids.filter((id) => !etat.decouvertes.includes(id))
  if (nouvelles.length === 0) return []
  etat.decouvertes = [...etat.decouvertes, ...nouvelles]
  return []
}
