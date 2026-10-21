// Ce qui se débloque avec les prestiges : la foreuse (prestige 1), les mineurs (prestige 2),
// le recruteur (prestige 4) et le manager (prestige 5), ces deux-là au stand Personnel.
// Tant que le joueur n'est pas allé voir un bâtiment qui vient de s'ouvrir (ou de changer), une
// bulle ✨ saute au-dessus de lui (voir notifications.ts). Elle disparaît (pour de bon) dès
// qu'il arrive devant. Ce qui a déjà été vu est gardé d'un prestige à l'autre.

import { employesDebloques, managerDebloque, recruteurDebloque } from './employes'
import { foreuseDebloquee } from './foreuse'
import type { Decouverte, EtatJeu } from './mineur'

// Le bâtiment où se trouve chaque découverte, et son nom dans la bulle.
export const DECOUVERTES: Record<Decouverte, { stand: 'foreuse' | 'employes'; nom: string }> = {
  foreuse: { stand: 'foreuse', nom: 'Foreuse' },
  employes: { stand: 'employes', nom: 'Personnel' },
  recruteur: { stand: 'employes', nom: 'Recruteur' },
  manager: { stand: 'employes', nom: 'Manager' },
}

// Ce qui est débloqué et que le joueur n'est pas encore allé voir.
export function decouvertesAMontrer(etat: EtatJeu): Decouverte[] {
  const debloques: Decouverte[] = []
  if (foreuseDebloquee(etat)) debloques.push('foreuse')
  if (employesDebloques(etat)) debloques.push('employes')
  if (recruteurDebloque(etat)) debloques.push('recruteur')
  if (managerDebloque(etat)) debloques.push('manager')
  return debloques.filter((id) => !etat.decouvertes.includes(id))
}

// Le joueur est arrivé devant le stand : on ne montre plus la flèche.
export function marquerDecouvert(etat: EtatJeu, ids: Decouverte[]): string[] {
  const nouvelles = ids.filter((id) => !etat.decouvertes.includes(id))
  if (nouvelles.length === 0) return []
  etat.decouvertes = [...etat.decouvertes, ...nouvelles]
  return []
}
