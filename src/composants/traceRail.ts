// Poser des rails pas à pas (23/10) : on touche la case du premier rail, on le pose avec un
// bouton, puis un rail doré est proposé juste après, dans le même sens. Les flèches le font
// aller tout droit, à gauche ou à droite (vu à l'écran), et « Poser » le pose. Plus rien ne se
// pose en glissant sur la carte : glisser déplace la caméra.

import { BATIMENTS } from '../jeu/donnees'
import type { Case, Village } from '../jeu/village'
import { versEcran } from './iso'

export type Sens = { x: number; y: number } // un pas sur la grille : (1, 0), (0, 1), (-1, 0) ou (0, -1)
export type Virage = 'gauche' | 'droit' | 'droite'

export type TraceRail = {
  propose: Case // la case du rail proposé (doré)
  sensVoie: Sens // le sens de la voie déjà posée (celui du dernier rail)
  sens: Sens // le sens du rail proposé (tout droit, ou après un virage)
  poses: Case[] // les rails posés pendant ce tracé, dans l'ordre (pour « ↩ Retirer le dernier »)
}

// Le sens de départ : on s'éloigne du bâtiment le plus proche (on part de la mine vers le marché,
// par exemple).
// (26/10, demandé par le propriétaire) Juste à côté d'un rail déjà posé, on continue sa ligne : la
// flèche part dans le sens du rail voisin vers cette case (le bout d'une ligne d'abord).
export function sensDeDepart(village: Village, c: Case): Sens {
  const rails = new Set(village.rails)
  const directions: Sens[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
  const voisins = directions.filter((d) => rails.has(`${c.x - d.x},${c.y - d.y}`))
  if (voisins.length > 0) {
    // Un rail qui n'a qu'un voisin est un bout de ligne : c'est lui qu'on prolonge.
    const nbVoisins = (x: number, y: number) => directions.filter((d) => rails.has(`${x + d.x},${y + d.y}`)).length
    const bout = voisins.find((d) => nbVoisins(c.x - d.x, c.y - d.y) <= 1) ?? voisins[0]
    return bout
  }
  let meilleur: { dx: number; dy: number; d: number } | null = null
  for (const b of village.batiments) {
    const t = BATIMENTS[b.id].taille
    const dx = c.x + 0.5 - (b.x + t / 2)
    const dy = c.y + 0.5 - (b.y + t / 2)
    const d = Math.hypot(dx, dy)
    if (!meilleur || d < meilleur.d) meilleur = { dx, dy, d }
  }
  if (!meilleur) return { x: 0, y: 1 }
  return Math.abs(meilleur.dx) >= Math.abs(meilleur.dy) ? { x: Math.sign(meilleur.dx) || 1, y: 0 } : { x: 0, y: Math.sign(meilleur.dy) || 1 }
}

// Le sens après un virage, vu à l'écran : « gauche » tourne vers la gauche de la voie telle qu'on
// la voit (la carte est en losange, on calcule donc sur l'écran).
export function tourner(sens: Sens, virage: Virage): Sens {
  if (virage === 'droit') return sens
  const origine = versEcran(0, 0)
  const ecran = (s: Sens) => {
    const p = versEcran(s.x, s.y)
    return { x: p.x - origine.x, y: p.y - origine.y }
  }
  const h = ecran(sens)
  const [a, b] = [{ x: -sens.y, y: sens.x }, { x: sens.y, y: -sens.x }]
  const pa = ecran(a)
  // (l'axe y de l'écran va vers le bas : à gauche, le produit vectoriel est négatif)
  const aEstAGauche = h.x * pa.y - h.y * pa.x < 0
  return virage === 'gauche' ? (aEstAGauche ? a : b) : aEstAGauche ? b : a
}

export function avancer(c: Case, sens: Sens): Case {
  return { x: c.x + sens.x, y: c.y + sens.y }
}

// Le virage qui mène de l'ancien sens au nouveau (pour allumer la bonne flèche).
export function virageEntre(avant: Sens, apres: Sens): Virage | null {
  for (const v of ['droit', 'gauche', 'droite'] as Virage[]) {
    const s = tourner(avant, v)
    if (s.x === apres.x && s.y === apres.y) return v
  }
  return null
}
