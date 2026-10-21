// Combien d'argent la partie produit par seconde, en ce moment : une estimation à partir du
// rendement de chaque source (pour l'indicateur « $/s » en haut de l'écran).
//   - la mine toute seule : son débit × la valeur moyenne d'un bloc à ce niveau ;
//   - chaque mineur employé (payé) : ce qu'il remonte par seconde (creusage et trajets compris),
//     moins son salaire (et celui du manager) ;
//   - la foreuse, quand elle tourne : sa vitesse × la valeur moyenne d'un bloc.
// Les clics du joueur ne sont pas comptés. C'est la valeur de ce qui sort de la mine : il faut
// encore la vendre (à la main, ou avec le wagonnet). Ce n'est qu'une moyenne : le hasard des
// minerais fait varier le vrai gain.

import { SECONDES_PAR_PAIE } from './donnees'
import { blocsParSecondeEmploye, managerAuTravail, salaireEmploye, salaireManager } from './employes'
import { foreuseEnMarche, vitesseForage } from './foreuse'
import { valeurMoyenneBloc } from './mine'
import { coffrePlein, debitMine, type EtatJeu, type Employe } from './mineur'

export type Revenu = {
  mine: number
  mineurs: number
  foreuse: number
  total: number
}

// Ce que rapporte un mineur par seconde, avant son salaire.
export function revenuBrutEmploye(etat: EtatJeu, mineur: Employe): number {
  if (mineur.role !== 'mineur') return 0
  return blocsParSecondeEmploye(etat, mineur) * valeurMoyenneBloc(etat.niveauMine)
}

// Ce que rapportent les mineurs payés, moins leurs salaires (et celui du manager).
function revenuMineurs(etat: EtatJeu): number {
  let total = 0
  for (const mineur of etat.employes) {
    if (mineur.tempsPaye <= 0) continue // il ne travaille pas (et n'est pas payé)
    total += revenuBrutEmploye(etat, mineur) - salaireEmploye(mineur) / SECONDES_PAR_PAIE
  }
  if (managerAuTravail(etat)) total -= salaireManager() / SECONDES_PAR_PAIE
  return total
}

export function revenuParSeconde(etat: EtatJeu): Revenu {
  // Coffre plein : la mine et les mineurs s'arrêtent.
  const plein = coffrePlein(etat)
  const mine = plein ? 0 : debitMine(etat) * valeurMoyenneBloc(etat.niveauMine)
  const mineurs = plein ? Math.min(0, revenuMineurs(etat)) : revenuMineurs(etat)
  const foreuse = foreuseEnMarche(etat) ? vitesseForage(etat) * valeurMoyenneBloc(etat.niveauMine) : 0
  return { mine, mineurs, foreuse, total: mine + mineurs + foreuse }
}
