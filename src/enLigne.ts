// La partie « en ligne » : les comptes, la sauvegarde des mondes et le classement sur Supabase.
// Supabase est un service hébergé qui nous donne une base de données et des comptes
// (avec les mots de passe bien protégés), sans qu'on ait à écrire de serveur.
//
// Les tables et leurs règles de sécurité sont dans `supabase/schema.sql` et `supabase/classement.sql`.
// Si Supabase ne répond pas, le jeu marche quand même : tout reste dans le navigateur.

import { createClient } from '@supabase/supabase-js'
import type { LigneClassement, Score, TriClassement } from './jeu/classement'
import { emailDuPseudo, type SauvegardeEnLigne } from './jeu/compte'
import type { SauvegardeComplete } from './jeu/sauvegarde'

// L'adresse du projet et sa clé « publishable ». Cette clé est faite pour être publique
// (elle est de toute façon visible dans le navigateur) : ce sont les règles de la base qui
// empêchent un joueur de lire ou modifier les mondes d'un autre.
// On peut les remplacer avec un fichier .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).
const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL ?? 'https://peumwxcvqncynobwejmk.supabase.co'
const CLE_PUBLIQUE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_wi7fi0nWBo63KeldySUs3g_SV5iP3dF'

const supabase = createClient(URL_SUPABASE, CLE_PUBLIQUE)

export type Joueur = { id: string; pseudo: string }

// Le joueur dont la session est encore ouverte dans ce navigateur (ou null).
export async function joueurConnecte(): Promise<Joueur | null> {
  const { data } = await supabase.auth.getSession()
  const utilisateur = data.session?.user
  if (!utilisateur) return null
  return { id: utilisateur.id, pseudo: String(utilisateur.user_metadata.pseudo ?? 'Joueur') }
}

// Les messages d'erreur de Supabase (en anglais) traduits pour le joueur.
function traduireErreur(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Pseudo ou mot de passe incorrect.'
  if (message.includes('already registered')) return 'Ce pseudo est déjà pris.'
  if (message.includes('Email not confirmed')) return 'Ce compte attend une confirmation par email : désactive « Confirm email » dans Supabase.'
  if (message.includes('rate limit')) return 'Trop d’essais : réessaie dans quelques minutes.'
  if (message.includes('Failed to fetch')) return 'Impossible de joindre le serveur. Vérifie ta connexion.'
  return `Erreur du serveur : ${message}`
}

// Renvoie le joueur, ou un message d'erreur.
export async function creerCompte(pseudo: string, motDePasse: string): Promise<Joueur | string> {
  const { data, error } = await supabase.auth.signUp({
    email: emailDuPseudo(pseudo),
    password: motDePasse,
    options: { data: { pseudo: pseudo.trim() } },
  })
  if (error) return traduireErreur(error.message)
  // Sans session, Supabase attend une confirmation par email (qu'il ne pourra jamais envoyer).
  if (!data.user || !data.session) return 'Compte créé, mais Supabase demande une confirmation par email : désactive « Confirm email » dans Supabase.'
  return { id: data.user.id, pseudo: pseudo.trim() }
}

export async function seConnecter(pseudo: string, motDePasse: string): Promise<Joueur | string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: emailDuPseudo(pseudo), password: motDePasse })
  if (error) return traduireErreur(error.message)
  return { id: data.user.id, pseudo: String(data.user.user_metadata.pseudo ?? pseudo.trim()) }
}

export async function seDeconnecter(): Promise<void> {
  await supabase.auth.signOut()
}

// La sauvegarde en ligne du joueur (null s'il n'en a pas encore). Lance une erreur si le serveur ne répond pas.
export async function telechargerMondes(joueur: Joueur): Promise<SauvegardeEnLigne | null> {
  const { data, error } = await supabase.from('sauvegardes').select('parties, envoyee_le').eq('joueur', joueur.id).maybeSingle()
  if (error) throw new Error(error.message)
  if (data === null) return null
  return { parties: data.parties as SauvegardeComplete, envoyeeLe: Number(data.envoyee_le) }
}

// Range les mondes en ligne (en remplaçant l'ancienne sauvegarde). Renvoie l'heure de l'envoi.
export async function envoyerMondes(joueur: Joueur, parties: SauvegardeComplete): Promise<number> {
  const envoyeeLe = Date.now()
  const { error } = await supabase.from('sauvegardes').upsert({ joueur: joueur.id, parties, envoyee_le: envoyeeLe })
  if (error) throw new Error(error.message)
  return envoyeeLe
}

// ---------------------------------------------------------------------------
// Le classement
// ---------------------------------------------------------------------------

// Met à jour la ligne du joueur (le serveur garde toujours son meilleur score).
export async function envoyerScore(joueur: Joueur, score: Score): Promise<void> {
  const { error } = await supabase
    .from('classement')
    .upsert({ joueur: joueur.id, pseudo: joueur.pseudo, prestige: score.prestige, argent: score.argent })
  if (error) throw new Error(error.message)
}

// Les meilleurs joueurs, au prestige (l'argent départage) ou à l'argent (le prestige départage).
// Lisible même sans compte.
export async function lireClassement(tri: TriClassement, nombre: number): Promise<LigneClassement[]> {
  const autre: TriClassement = tri === 'prestige' ? 'argent' : 'prestige'
  const { data, error } = await supabase
    .from('classement')
    .select('pseudo, prestige, argent')
    .order(tri, { ascending: false })
    .order(autre, { ascending: false })
    .limit(nombre)
  if (error) throw new Error(error.message)
  return data.map((ligne) => ({ pseudo: String(ligne.pseudo), prestige: Number(ligne.prestige), argent: Number(ligne.argent) }))
}
