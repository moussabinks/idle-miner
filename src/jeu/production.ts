// La production de la mine (27/10), pour le tableau de bord du panneau de la mine : combien de
// blocs sortent par seconde, d'où ils viennent (la mine toute seule, chaque mineur), et ce que
// ça rapporte à peu près. Ce sont des moyennes : les vrais blocs sont tirés au hasard.

import { blocsParSecondeEmploye } from './employes'
import { valeurMoyenneBloc } from './mine'
import { coffrePlein, debitMine, type EtatJeu, type Employe } from './mineur'

export type ProductionMineur = {
  index: number // sa place dans etat.employes
  employe: Employe
  blocsParSeconde: number // 0 s'il ne travaille pas (il attend son salaire)
  auTravail: boolean
}

export type Production = {
  mine: number // blocs par seconde sortis par la mine toute seule
  mineurs: ProductionMineur[] // chaque mineur (pas les pousseurs)
  totalMineurs: number // blocs par seconde, tous les mineurs au travail
  total: number // blocs par seconde, mine + mineurs
  dollarsParMinute: number // ce que vaut cette production au marché, environ
  arretee: boolean // le coffre est plein : plus rien ne rentre
}

export function production(etat: EtatJeu): Production {
  const arretee = coffrePlein(etat)
  const mineurs = etat.employes
    .map((employe, index) => ({ employe, index }))
    .filter(({ employe }) => employe.role === 'mineur')
    .map(({ employe, index }) => {
      // Un mineur qui attend son salaire ne creuse pas ; avec le coffre plein, il attend aussi.
      const auTravail = employe.etape !== 'attend' && !arretee
      return { index, employe, auTravail, blocsParSeconde: auTravail ? blocsParSecondeEmploye(etat, employe) : 0 }
    })
  const mine = arretee ? 0 : debitMine(etat)
  const totalMineurs = mineurs.reduce((total, m) => total + m.blocsParSeconde, 0)
  const total = mine + totalMineurs
  return { mine, mineurs, totalMineurs, total, dollarsParMinute: total * valeurMoyenneBloc(etat.niveauMine) * 60, arretee }
}
