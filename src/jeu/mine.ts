// La mine (22/10) : 5 niveaux. Chaque bloc qui sort de la mine est tiré au hasard selon les
// poids du niveau atteint (voir NIVEAUX_MINE dans donnees.ts) : plus le niveau est profond, plus
// il y a de minerais rares.

import { choisirPondere, type Aleatoire } from './aleatoire'
import { BLOCS, NIVEAUX_MINE, NIVEAU_MINE_MAX, type IdBloc, type NiveauMine } from './donnees'

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
