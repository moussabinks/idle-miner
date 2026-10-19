// Les stands qui se débloquent avec les prestiges : la foreuse (prestige 1) et les mineurs
// (prestige 2). Tant que le joueur n'est pas allé voir un stand tout juste débloqué, le
// village lui montre une flèche qui clignote dans sa direction. Elle disparaît (pour de
// bon) dès qu'il arrive devant. Les stands déjà vus sont gardés d'un prestige à l'autre.

import { employesDebloques } from './employes'
import { foreuseDebloquee } from './foreuse'
import type { Decouverte, EtatJeu } from './mineur'

// Les stands débloqués que le joueur n'est pas encore allé voir.
export function decouvertesAMontrer(etat: EtatJeu): Decouverte[] {
  const debloques: Decouverte[] = []
  if (foreuseDebloquee(etat)) debloques.push('foreuse')
  if (employesDebloques(etat)) debloques.push('employes')
  return debloques.filter((id) => !etat.decouvertes.includes(id))
}

// Le joueur est arrivé devant le stand : on ne montre plus la flèche.
export function marquerDecouvert(etat: EtatJeu, id: Decouverte): string[] {
  if (etat.decouvertes.includes(id)) return []
  etat.decouvertes = [...etat.decouvertes, id]
  return []
}
