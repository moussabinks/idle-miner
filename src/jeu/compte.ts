// Les comptes des joueurs (sauvegarde en ligne) : les règles du pseudo et du mot de passe,
// et le choix à faire quand on se connecte (envoyer ses mondes, ou récupérer ceux du compte).
//
// Rien ici ne parle au réseau : c'est `src/enLigne.ts` qui discute avec Supabase.
// Ces fonctions sont donc testables sans navigateur.

import type { SauvegardeComplete, Stockage } from './sauvegarde'
import { mondesDeLaCopie } from './sauvegarde'

export const PSEUDO_MIN = 3
export const PSEUDO_MAX = 16
export const MOT_DE_PASSE_MIN = 6

// Supabase range les comptes par adresse email. Le joueur ne choisit qu'un pseudo :
// on lui fabrique une adresse qui n'existe pas (aucun email n'est jamais envoyé).
export const DOMAINE_COMPTES = 'joueurs.idle-miner.app'

// Renvoie le problème du pseudo, ou null s'il est bon.
// Lettres sans accent, chiffres, « _ » et « - » seulement : il doit tenir dans une adresse email.
export function erreurPseudo(pseudo: string): string | null {
  const propre = pseudo.trim()
  if (propre.length < PSEUDO_MIN) return `Ton pseudo doit faire au moins ${PSEUDO_MIN} caractères.`
  if (propre.length > PSEUDO_MAX) return `Ton pseudo doit faire au plus ${PSEUDO_MAX} caractères.`
  if (!/^[A-Za-z0-9_-]+$/.test(propre)) return 'Ton pseudo ne peut contenir que des lettres sans accent, des chiffres, « _ » et « - ».'
  return null
}

export function erreurMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < MOT_DE_PASSE_MIN) return `Ton mot de passe doit faire au moins ${MOT_DE_PASSE_MIN} caractères.`
  return null
}

// « Noah » et « noah » sont le même compte : l'adresse est toujours en minuscules.
export function emailDuPseudo(pseudo: string): string {
  return `${pseudo.trim().toLowerCase()}@${DOMAINE_COMPTES}`
}

// ---------------------------------------------------------------------------
// La synchronisation
// ---------------------------------------------------------------------------

// Ce qui est rangé en ligne pour un joueur : tous ses mondes, et l'heure de l'envoi.
export type SauvegardeEnLigne = { parties: SauvegardeComplete; envoyeeLe: number }

// Le dernier échange entre ce navigateur et un compte (gardé dans le localStorage).
export type DerniereSynchro = { joueur: string; envoyeeLe: number }

const CLE_DERNIERE_SYNCHRO = 'idle-miner-derniere-synchro'

export function lireDerniereSynchro(stockage: Stockage): DerniereSynchro | null {
  try {
    const texte = stockage.getItem(CLE_DERNIERE_SYNCHRO)
    return texte === null ? null : (JSON.parse(texte) as DerniereSynchro)
  } catch {
    return null
  }
}

export function ecrireDerniereSynchro(stockage: Stockage, synchro: DerniereSynchro): void {
  try {
    stockage.setItem(CLE_DERNIERE_SYNCHRO, JSON.stringify(synchro))
  } catch {
    // Stockage plein ou interdit : on redemandera à la prochaine connexion.
  }
}

// Ce qu'il faut faire en se connectant :
//   « envoyer »   : les mondes de ce navigateur partent en ligne (ils sont les plus récents) ;
//   « recuperer » : les mondes du compte remplacent ceux du navigateur (qui n'en a pas) ;
//   « demander »  : les deux ont des mondes différents, c'est au joueur de choisir ;
//   « rien »      : il n'y a rien à faire.
export type ChoixSynchro = 'envoyer' | 'recuperer' | 'demander' | 'rien'

export function choisirSynchro(
  local: SauvegardeComplete,
  enLigne: SauvegardeEnLigne | null,
  joueur: string,
  derniere: DerniereSynchro | null,
): ChoixSynchro {
  const mondesLocaux = mondesDeLaCopie(local).length
  const mondesEnLigne = enLigne === null ? 0 : mondesDeLaCopie(enLigne.parties).length

  if (mondesEnLigne === 0) return mondesLocaux > 0 ? 'envoyer' : 'rien'
  if (mondesLocaux === 0) return 'recuperer'

  // Ce navigateur a fait le dernier échange avec ce compte, et personne n'a rien envoyé
  // depuis : ses mondes sont la suite de ceux en ligne, on peut les envoyer sans risque.
  if (enLigne !== null && derniere?.joueur === joueur && derniere.envoyeeLe === enLigne.envoyeeLe) return 'envoyer'

  return 'demander'
}
