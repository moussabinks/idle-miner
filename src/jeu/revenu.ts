// Combien d'argent la partie génère par seconde, en ce moment : une estimation à partir
// du rendement de chaque source (pour l'indicateur « $/s » en haut de l'écran).
//   - toi, quand tu creuses : la valeur moyenne d'un bloc à ta profondeur, divisée par le
//     temps moyen pour le casser (Fortune comprise) ;
//   - la foreuse, quand elle tourne : sa vitesse × la valeur moyenne d'un bloc à sa profondeur ;
//   - chaque mineur employé (payé) : ce que rapporte un sac plein, divisé par la durée d'un
//     aller-retour complet (creuser, remonter, marcher jusqu'au marché, vendre, revenir à la mine,
//     redescendre), moins son salaire. La vitesse de l'ascenseur compte donc, et la place du
//     marché aussi : avec des rails jusqu'au marché, il charge le wagonnet et ne marche plus.
//     Le salaire du manager est retiré aussi.
// Ce n'est qu'une moyenne : le hasard des minerais fait varier le vrai gain.

import { BLOCS, SECONDES_PAR_PAIE, SECONDES_VENTE_EMPLOYE, dureeCasse, type IdBloc } from './donnees'
import { managerAuTravail, salaireEmploye, salaireManager, secondesMarcheEmploye, secondesParMetreEmploye, tailleSacEmploye, vitesseEmploye } from './employes'
import { foreuseEnMarche, vitesseForage } from './foreuse'
import { poidsDesBlocs } from './mine'
import { auFond, bonusVente, chanceDoublement, vitesseA, type EtatJeu, type Employe } from './mineur'
import { multiplicateurVenteChariot } from './talents'
import { railsMineMarche } from './village'

export type Revenu = {
  joueur: number
  foreuse: number
  mineurs: number
  total: number
}

// Les blocs « normaux » à une profondeur (sans lave, coffre ni géode), avec leur probabilité.
function probabilites(profondeur: number, prestige: number): { bloc: IdBloc; chance: number }[] {
  const choix = poidsDesBlocs(profondeur, prestige).filter((c) => !BLOCS[c.valeur].special)
  const total = choix.reduce((somme, c) => somme + c.poids, 0)
  return choix.map((c) => ({ bloc: c.valeur, chance: c.poids / total }))
}

// La valeur moyenne d'un bloc à une profondeur (sans les bonus de vente).
// Avec Fortune, un minerai vaut en moyenne un peu plus : il est doublé une fois sur
// « chanceDoublement » (0,2 pour Fortune I...).
export function valeurMoyenneBloc(profondeur: number, prestige: number, chanceDoublement = 0): number {
  let moyenne = 0
  for (const { bloc, chance } of probabilites(profondeur, prestige)) {
    const doublement = BLOCS[bloc].minerai ? 1 + chanceDoublement : 1
    moyenne += chance * BLOCS[bloc].prix * doublement
  }
  return moyenne
}

// Ce que tu gagnes par seconde en creusant (0 si tu ne creuses pas).
function revenuJoueur(etat: EtatJeu): number {
  if (!auFond(etat)) return 0
  let dureeMoyenne = 0
  for (const { bloc, chance } of probabilites(etat.profondeur, etat.prestige)) {
    dureeMoyenne += chance * dureeCasse(BLOCS[bloc].durete, etat.profondeur, vitesseA(etat, etat.profondeur), etat.prestige)
  }
  if (dureeMoyenne <= 0) return 0
  return (valeurMoyenneBloc(etat.profondeur, etat.prestige, chanceDoublement(etat)) * bonusVente(etat)) / dureeMoyenne
}

function revenuForeuse(etat: EtatJeu): number {
  if (!foreuseEnMarche(etat)) return 0
  const foreuse = etat.foreuse
  return vitesseForage(etat) * valeurMoyenneBloc(foreuse.profondeur, etat.prestige) * bonusVente(etat) * multiplicateurVenteChariot(etat)
}

// Ce que rapporte un mineur par seconde, avant son salaire.
export function revenuBrutEmploye(etat: EtatJeu, mineur: Employe): number {
  const sac = tailleSacEmploye(etat, mineur)
  const gainParSac = sac * valeurMoyenneBloc(mineur.profondeur, etat.prestige) * bonusVente(etat)
  const tempsCreuse = sac / vitesseEmploye(etat, mineur)
  const tempsTrajets = 2 * Math.max(1, mineur.profondeur - 1) * secondesParMetreEmploye(etat, mineur)
  // Au village : l'aller-retour à pied jusqu'au marché et la vente, sauf s'il charge le wagonnet.
  const tempsVillage = railsMineMarche(etat.village) !== null ? 0 : 2 * secondesMarcheEmploye(etat, 'puits', 'marche') + SECONDES_VENTE_EMPLOYE
  return gainParSac / (tempsCreuse + tempsTrajets + tempsVillage)
}

// Ce que rapportent les mineurs payés, moins leurs salaires (et celui du manager).
function revenuMineurs(etat: EtatJeu): number {
  let total = 0
  for (const mineur of etat.employes) {
    if (mineur.tempsPaye <= 0) continue // il ne travaille pas (et n'est pas payé)
    total += revenuBrutEmploye(etat, mineur) - salaireEmploye(etat, mineur) / SECONDES_PAR_PAIE
  }
  if (managerAuTravail(etat)) total -= salaireManager() / SECONDES_PAR_PAIE
  return total
}

// L'argent généré par seconde. « joueurCreuse » : est-ce que tu es en train de creuser ?
export function revenuParSeconde(etat: EtatJeu, joueurCreuse: boolean): Revenu {
  const joueur = joueurCreuse ? revenuJoueur(etat) : 0
  const foreuse = revenuForeuse(etat)
  const mineurs = revenuMineurs(etat)
  return { joueur, foreuse, mineurs, total: joueur + foreuse + mineurs }
}
