// La mine (22/10) : 5 niveaux. Chaque bloc qui sort de la mine est tiré au hasard selon les
// poids du niveau atteint (voir NIVEAUX_MINE dans donnees.ts) : plus le niveau est profond, plus
// il y a de minerais rares.

import { choisirPondere, type Aleatoire } from './aleatoire'
import {
  BATIMENTS,
  BLOCS,
  EMPLOYES_PAR_NIVEAU,
  LISTE_BATIMENTS,
  LISTE_BLOCS,
  NIVEAUX_MINE,
  NIVEAU_MINE_MANAGER,
  NIVEAU_MINE_MAX,
  NIVEAU_MINE_RECRUTEUR,
  type IdBatiment,
  type IdBloc,
  type NiveauMine,
} from './donnees'

export function infoNiveauMine(niveau: number): NiveauMine {
  return NIVEAUX_MINE[Math.max(1, Math.min(NIVEAU_MINE_MAX, niveau)) - 1]
}

// Les blocs possibles à ce niveau, avec leur poids.
export function poidsDesBlocs(niveau: number): { valeur: IdBloc; poids: number }[] {
  return Object.entries(infoNiveauMine(niveau).poids).map(([bloc, poids]) => ({ valeur: bloc as IdBloc, poids: poids ?? 0 }))
}

// Tire un bloc au hasard à ce niveau de la mine.
export function tirerBloc(niveau: number, aleatoire: Aleatoire): IdBloc {
  return choisirPondere(aleatoire, poidsDesBlocs(niveau))
}

// La chance (de 0 à 1) de tomber sur chaque bloc à ce niveau.
export function chancesDesBlocs(niveau: number): Partial<Record<IdBloc, number>> {
  const poids = poidsDesBlocs(niveau)
  const total = poids.reduce((t, p) => t + p.poids, 0)
  return Object.fromEntries(poids.map((p) => [p.valeur, p.poids / total]))
}

// Ce que vaut en moyenne un bloc à ce niveau, au marché (« doublement » : la chance de doubler
// les minerais, avec une bonne pioche).
export function valeurMoyenneBloc(niveau: number, doublement = 0): number {
  let total = 0
  for (const [id, chance] of Object.entries(chancesDesBlocs(niveau))) {
    const bloc = BLOCS[id as IdBloc]
    total += (chance ?? 0) * bloc.prix * (bloc.minerai ? 1 + doublement : 1)
  }
  return total
}

// Les blocs qui sortent de la mine à ce niveau, du moins cher au plus cher (pierre, charbon...).
export function blocsDuNiveau(niveau: number): IdBloc[] {
  const poids = infoNiveauMine(niveau).poids
  return LISTE_BLOCS.filter((bloc) => (poids[bloc] ?? 0) > 0)
}

// Ce qu'on gagne en descendant au niveau suivant (pour le mettre en avant au panneau de la mine).
export type GainsNiveau = {
  niveau: NiveauMine
  nouveaux: IdBloc[] // les nouveaux minerais
  debitAvant: number // les blocs que la mine sort toute seule chaque seconde
  debitApres: number
  valeurAvant: number // ce que vaut en moyenne un bloc au marché
  valeurApres: number
  mineursEnPlus: number // les places de mineurs en plus
  batiments: IdBatiment[] // les bâtiments débloqués
  recruteur: boolean
  manager: boolean
}

export function gainsNiveauSuivant(niveauActuel: number): GainsNiveau | null {
  if (niveauActuel >= NIVEAU_MINE_MAX) return null
  const suivant = niveauActuel + 1
  const avant = blocsDuNiveau(niveauActuel)
  return {
    niveau: infoNiveauMine(suivant),
    nouveaux: blocsDuNiveau(suivant).filter((bloc) => !avant.includes(bloc)),
    debitAvant: infoNiveauMine(niveauActuel).debit,
    debitApres: infoNiveauMine(suivant).debit,
    valeurAvant: valeurMoyenneBloc(niveauActuel),
    valeurApres: valeurMoyenneBloc(suivant),
    mineursEnPlus: EMPLOYES_PAR_NIVEAU,
    batiments: LISTE_BATIMENTS.filter((id) => BATIMENTS[id].niveauMine === suivant),
    recruteur: suivant === NIVEAU_MINE_RECRUTEUR,
    manager: suivant === NIVEAU_MINE_MANAGER,
  }
}
