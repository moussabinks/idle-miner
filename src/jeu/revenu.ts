// Combien d'argent la partie génère par seconde, en ce moment : une estimation à partir
// du rendement de chaque source (pour l'indicateur « $/s » en haut de l'écran).
//   - toi, quand tu creuses : la valeur moyenne d'un bloc à ta profondeur, divisée par le
//     temps moyen pour le casser (Fortune comprise) ;
//   - la foreuse, quand elle tourne : sa vitesse × la valeur moyenne d'un bloc à sa profondeur ;
//   - chaque mineur employé : ce que rapporte un sac plein (moins son salaire), divisé par la
//     durée d'un aller-retour complet (creuser, remonter, vendre, redescendre). La vitesse de
//     l'ascenseur compte donc : plus il est rapide, plus les trajets sont courts.
// Ce n'est qu'une moyenne : le hasard des minerais fait varier le vrai gain.

import { BLOCS, SECONDES_VENTE_EMPLOYE, dureeCasse, type IdBloc } from './donnees'
import { secondesParMetreEmploye, tailleSacEmploye, vitesseEmploye } from './employes'
import { foreuseEnMarche, vitesseForage } from './foreuse'
import { poidsDesBlocs } from './mine'
import { CHANCE_FORTUNE_PAR_NIVEAU, auFond, bonusVente, vitesse, type EtatJeu } from './mineur'
import { partSalaire } from './talents'

export type Revenu = {
  joueur: number
  foreuse: number
  mineurs: number
  total: number
}

// Les blocs « normaux » à une profondeur (sans lave, coffre ni géode), avec leur probabilité.
function probabilites(profondeur: number): { bloc: IdBloc; chance: number }[] {
  const choix = poidsDesBlocs(profondeur).filter((c) => !BLOCS[c.valeur].special)
  const total = choix.reduce((somme, c) => somme + c.poids, 0)
  return choix.map((c) => ({ bloc: c.valeur, chance: c.poids / total }))
}

// La valeur moyenne d'un bloc à une profondeur (sans les bonus de vente).
// Avec Fortune, un minerai vaut en moyenne un peu plus (il est parfois doublé).
export function valeurMoyenneBloc(profondeur: number, fortune = 0): number {
  let moyenne = 0
  for (const { bloc, chance } of probabilites(profondeur)) {
    const doublement = BLOCS[bloc].minerai ? 1 + fortune * CHANCE_FORTUNE_PAR_NIVEAU : 1
    moyenne += chance * BLOCS[bloc].prix * doublement
  }
  return moyenne
}

// Ce que tu gagnes par seconde en creusant (0 si tu ne creuses pas).
function revenuJoueur(etat: EtatJeu): number {
  if (!auFond(etat)) return 0
  let dureeMoyenne = 0
  for (const { bloc, chance } of probabilites(etat.profondeur)) {
    dureeMoyenne += chance * dureeCasse(BLOCS[bloc].durete, etat.profondeur, vitesse(etat))
  }
  if (dureeMoyenne <= 0) return 0
  return (valeurMoyenneBloc(etat.profondeur, etat.enchantements.fortune) * bonusVente(etat)) / dureeMoyenne
}

function revenuForeuse(etat: EtatJeu): number {
  if (!foreuseEnMarche(etat)) return 0
  return vitesseForage(etat) * valeurMoyenneBloc(etat.foreuse.profondeur) * bonusVente(etat)
}

function revenuMineurs(etat: EtatJeu): number {
  let total = 0
  for (const mineur of etat.employes) {
    const sac = tailleSacEmploye(etat, mineur)
    const gainParSac = sac * valeurMoyenneBloc(mineur.profondeur) * bonusVente(etat) * (1 - partSalaire(etat))
    const tempsCreuse = sac / vitesseEmploye(etat, mineur)
    const tempsTrajets = 2 * Math.max(1, mineur.profondeur - 1) * secondesParMetreEmploye(etat, mineur)
    total += gainParSac / (tempsCreuse + tempsTrajets + SECONDES_VENTE_EMPLOYE)
  }
  return total
}

// L'argent généré par seconde. « joueurCreuse » : est-ce que tu es en train de creuser ?
export function revenuParSeconde(etat: EtatJeu, joueurCreuse: boolean): Revenu {
  const joueur = joueurCreuse ? revenuJoueur(etat) : 0
  const foreuse = revenuForeuse(etat)
  const mineurs = revenuMineurs(etat)
  return { joueur, foreuse, mineurs, total: joueur + foreuse + mineurs }
}
