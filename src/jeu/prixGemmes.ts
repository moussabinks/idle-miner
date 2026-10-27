// Les bornes du prix en gemmes (26/10, demandé par le propriétaire) : parmi toutes les
// améliorations que le joueur peut faire en ce moment (débloquées à son palier, pas encore au
// maximum), le prix en dollars de la moins chère et de la plus chère. La moins chère coûte
// 1 gemme, la plus chère 3, les autres entre les deux (prixEnGemmes, dans gemmes.ts).
// Les constructions de bâtiments ne comptent pas : ce ne sont pas des améliorations.

import { prixEnGemmes, valeurEnDollars, type BornesGemmes } from './gemmes'
import type { Cout } from './donnees'
import type { EtatJeu } from './mineur'
import { achatsPossibles } from './objectifs'

// La partie change à chaque tic (une nouvelle copie) : on calcule une seule fois par copie.
const dejaCalculees = new WeakMap<EtatJeu, BornesGemmes | null>()

export function bornesGemmes(etat: EtatJeu): BornesGemmes | null {
  const deja = dejaCalculees.get(etat)
  if (deja !== undefined) return deja
  const valeurs = achatsPossibles(etat)
    .filter((achat) => !achat.construction)
    .map((achat) => valeurEnDollars(achat.cout))
    .filter((valeur) => valeur > 0)
  const bornes = valeurs.length > 0 ? { min: Math.min(...valeurs), max: Math.max(...valeurs) } : null
  dejaCalculees.set(etat, bornes)
  return bornes
}

// Le prix en gemmes de cet achat, pour ce joueur, en ce moment.
export function prixEnGemmesPour(etat: EtatJeu, cout: Cout): number {
  return prixEnGemmes(cout, bornesGemmes(etat))
}
