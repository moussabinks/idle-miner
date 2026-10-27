// (27/10) La partie « en ligne » de la version CrazyGames : vide. Cette version n'a ni comptes, ni
// classement, ni visites (src/portail.ts) ; vite.config.ts met ce fichier à la place de
// enLigne.ts quand on fabrique la version CrazyGames, pour que la bibliothèque de Supabase ne soit
// pas copiée dans le jeu (elle ne servirait jamais). Les mêmes fonctions que enLigne.ts, qui ne
// parlent à aucun serveur.

import type { LigneClassement, Score } from './jeu/classement'
import { t } from './jeu/langue'
import type { SauvegardeEnLigne } from './jeu/compte'
import type { EtatJeu } from './jeu/mineur'
import type { SauvegardeComplete } from './jeu/sauvegarde'

export type Joueur = { id: string; pseudo: string }

const SANS_COMPTES = t('Pas de comptes dans cette version du jeu.')

export async function joueurConnecte(): Promise<Joueur | null> {
  return null
}

export async function creerCompte(_pseudo: string, _motDePasse: string): Promise<Joueur | string> {
  return SANS_COMPTES
}

export async function seConnecter(_pseudo: string, _motDePasse: string): Promise<Joueur | string> {
  return SANS_COMPTES
}

export async function seDeconnecter(): Promise<void> {}

export async function telechargerMondes(_joueur: Joueur): Promise<SauvegardeEnLigne | null> {
  return null
}

export async function envoyerMondes(_joueur: Joueur, _parties: SauvegardeComplete): Promise<number> {
  throw new Error(SANS_COMPTES)
}

export async function envoyerScore(_joueur: Joueur, _score: Score): Promise<void> {}

export async function lireClassement(_nombre: number): Promise<LigneClassement[]> {
  return []
}

export async function placeDuScore(_argent: number, _pseudo: string | null): Promise<{ devant: number; suivant: LigneClassement | null }> {
  return { devant: 0, suivant: null }
}

export async function envoyerVillage(_joueur: Joueur, _partie: EtatJeu): Promise<void> {}

export async function lireVillage(_pseudo: string): Promise<unknown> {
  return null
}
