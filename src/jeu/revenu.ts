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
import { t } from './langue'
import { blocsParSecondeEmploye, managerAuTravail, managerPaieLesSalaires, salaireEmploye, salaireManager } from './employes'
import { foreuseEnMarche, vitesseForage } from './foreuse'
import { valeurMoyenneBloc } from './mine'
import { coffrePlein, debitMine, type EtatJeu, type Employe } from './mineur'
import { analyseWagonnet, chariotTropPetit } from './production'

export type Revenu = {
  mine: number
  mineurs: number
  foreuse: number
  total: number
  // (26/10) Le wagonnet du coffre ne suit pas : il vend moins que ce qui sort de la mine. Le
  // « total » compte alors ce qu'il vend vraiment (le reste s'entasse dans le coffre).
  limiteParWagonnet: boolean
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

// Les salaires payés en ce moment, par seconde (employés au travail et manager).
function salairesParSeconde(etat: EtatJeu): number {
  let total = 0
  for (const employe of etat.employes) if (employe.tempsPaye > 0) total += salaireEmploye(employe) / SECONDES_PAR_PAIE
  if (managerAuTravail(etat)) total += salaireManager() / SECONDES_PAR_PAIE
  return total
}

export function revenuParSeconde(etat: EtatJeu): Revenu {
  // Coffre plein : la mine et les mineurs s'arrêtent.
  const plein = coffrePlein(etat)
  const mine = plein ? 0 : debitMine(etat) * valeurMoyenneBloc(etat.niveauMine)
  const mineurs = plein ? Math.min(0, revenuMineurs(etat)) : revenuMineurs(etat)
  const foreuse = foreuseEnMarche(etat) ? vitesseForage(etat) * valeurMoyenneBloc(etat.niveauMine) : 0
  // (26/10) Avant, le « +X/s » comptait tout ce qui sort de la mine, même quand le wagonnet ne
  // suivait pas : le joueur se croyait riche, mais l'argent restait dans le coffre (et au retour
  // d'une absence, il ne pouvait pas payer les salaires). Avec un wagonnet automatique, on ne
  // compte que ce qu'il vend vraiment.
  const wagonnet = analyseWagonnet(etat, 'mine-marche')
  const salaires = salairesParSeconde(etat)
  const brutMineurs = plein ? 0 : etat.employes.filter((e) => e.tempsPaye > 0).reduce((total, e) => total + revenuBrutEmploye(etat, e), 0)
  const sortDeLaMine = mine + brutMineurs
  const limiteParWagonnet = chariotTropPetit(wagonnet)
  const vendu = limiteParWagonnet && wagonnet ? Math.min(sortDeLaMine, wagonnet.debitMax * valeurMoyenneBloc(etat.niveauMine)) : sortDeLaMine
  return { mine, mineurs, foreuse, total: vendu - salaires + foreuse, limiteParWagonnet }
}

// ---------------------------------------------------------------------------
// Le bilan par minute (23/10) : ce que la partie gagne, ce qu'elle paie, et si elle est rentable
// ---------------------------------------------------------------------------

export type LigneBilan = { id: string; icone: string; nom: string; detail: string; parMinute: number }

export type Bilan = {
  gains: LigneBilan[] // ce qui sort de la mine (à vendre), par source
  depenses: LigneBilan[] // les salaires, par métier
  totalGains: number
  totalDepenses: number
  net: number // gains − dépenses, par minute
}

// Le bilan en ce moment, en $ par minute (des moyennes : les minerais sont tirés au hasard).
// Les salaires comptent tous les employés, payés ou pas : c'est ce qu'il faut leur payer.
export function bilanParMinute(etat: EtatJeu): Bilan {
  const plein = coffrePlein(etat)
  const valeur = valeurMoyenneBloc(etat.niveauMine)
  const mineurs = etat.employes.filter((e) => e.role === 'mineur')
  const pousseurs = etat.employes.filter((e) => e.role === 'pousseur')
  const auTravail = mineurs.filter((m) => m.tempsPaye > 0)
  const brutMineurs = plein ? 0 : auTravail.reduce((total, m) => total + revenuBrutEmploye(etat, m), 0)
  const mine = plein ? 0 : debitMine(etat) * valeur
  const foreuse = foreuseEnMarche(etat) ? vitesseForage(etat) * valeur : 0
  const gains: LigneBilan[] = [
    { id: 'mine', icone: '⛏️', nom: t('La mine'), detail: plein ? t('coffre plein : elle s’arrête !') : t('elle creuse toute seule'), parMinute: mine * 60 },
    { id: 'mineurs', icone: '👷', nom: t('Les mineurs'), detail: t('{n} au travail sur {total}', { n: auTravail.length, total: mineurs.length }), parMinute: brutMineurs * 60 },
    { id: 'foreuse', icone: '⚙️', nom: t('La foreuse'), detail: foreuseEnMarche(etat) ? t('elle fore') : t('à l’arrêt'), parMinute: foreuse * 60 },
  ]
  const paie = (liste: Employe[]) => liste.reduce((total, e) => total + salaireEmploye(e), 0) / (SECONDES_PAR_PAIE / 60)
  const depenses: LigneBilan[] = [
    { id: 'salaires-mineurs', icone: '⛏️', nom: t('Salaires des mineurs'), detail: mineurs.length > 1 ? t('{n} mineurs', { n: mineurs.length }) : t('{n} mineur', { n: mineurs.length }), parMinute: paie(mineurs) },
    { id: 'salaires-pousseurs', icone: '🛤️', nom: t('Salaires des pousseurs'), detail: pousseurs.length > 1 ? t('{n} pousseurs', { n: pousseurs.length }) : t('{n} pousseur', { n: pousseurs.length }), parMinute: paie(pousseurs) },
  ]
  if (managerPaieLesSalaires(etat)) depenses.push({ id: 'manager', icone: '💼', nom: t('Salaire du manager'), detail: t('il paie tout le monde'), parMinute: salaireManager() / (SECONDES_PAR_PAIE / 60) })
  const totalGains = gains.reduce((total, l) => total + l.parMinute, 0)
  const totalDepenses = depenses.reduce((total, l) => total + l.parMinute, 0)
  return { gains, depenses, totalGains, totalDepenses, net: totalGains - totalDepenses }
}
