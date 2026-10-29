// Le compte du joueur, la sauvegarde en ligne de ses mondes et son score au classement.
//
// Le localStorage reste la sauvegarde principale : le jeu y écrit à chaque instant.
// Quand le joueur est connecté, ce hook recopie régulièrement tous les mondes en ligne,
// et à la connexion il récupère ceux du compte (pour jouer sur un autre appareil).

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  choisirSynchro,
  ecrireDerniereSynchro,
  erreurMotDePasse,
  erreurPseudo,
  lireDerniereSynchro,
} from './jeu/compte'
import { meilleurScore } from './jeu/classement'
import { villageAPartager } from './jeu/visite'
import { exporterTout, importerTout, type SauvegardeComplete } from './jeu/sauvegarde'
import {
  creerCompte,
  envoyerMondes,
  envoyerScore,
  envoyerVillage,
  joueurConnecte,
  seConnecter,
  seDeconnecter,
  telechargerMondes,
  type Joueur,
} from './enLigne'
import { AVEC_COMPTES } from './portail'
import { stockage } from './stockage'

// Toutes les 20 s, on envoie les mondes s'ils ont changé.
const INTERVALLE_ENVOI = 20_000 // ms
// (23/10) Le score (l'argent en poche change tout le temps) ne part qu'une fois toutes les 5 minutes.
const INTERVALLE_SCORE = 5 * 60 * 1000 // ms

export type StatutCompte =
  | 'chargement' // on regarde si une session est ouverte
  | 'deconnecte'
  | 'synchro' // échange en cours avec le serveur (on ne peut pas lancer de partie)
  | 'a-jour'
  | 'hors-ligne' // le serveur ne répond pas : on réessaie tout seul

export function useCompte() {
  const [joueur, setJoueur] = useState<Joueur | null>(null)
  // (27/10) Sans comptes (version CrazyGames), on est déconnecté dès le départ.
  const [statut, setStatut] = useState<StatutCompte>(AVEC_COMPTES ? 'chargement' : 'deconnecte')
  const [envoyeeLe, setEnvoyeeLe] = useState<number | null>(null)
  // Change quand les mondes du navigateur ont été remplacés par ceux du compte (l'accueil se redessine).
  const [versionMondes, setVersionMondes] = useState(0)

  // Le texte des mondes au dernier échange : on n'envoie rien tant qu'il n'a pas changé.
  const dernierEnvoi = useRef('')
  // Vrai une fois le premier échange fait : avant, on n'envoie rien (on risquerait
  // d'écraser les mondes du compte avant d'avoir regardé ce qu'il contient).
  const pret = useRef(false)
  const occupe = useRef(false)
  // Le dernier score envoyé au classement (on ne le renvoie que s'il a changé).
  const dernierScore = useRef('')
  const dateDernierScore = useRef(0)

  // Le score part avec les mondes. S'il est refusé (pseudo d'un ancien compte, par exemple),
  // tant pis : la sauvegarde des mondes compte plus que le classement.
  const envoyerLeScore = useCallback(async (j: Joueur, parties: SauvegardeComplete) => {
    const score = meilleurScore(parties)
    const texte = JSON.stringify(score)
    if (texte === dernierScore.current || (score.prestige === 0 && score.argent === 0)) return
    if (Date.now() - dateDernierScore.current < INTERVALLE_SCORE) return
    try {
      await envoyerScore(j, score)
      dernierScore.current = texte
      dateDernierScore.current = Date.now()
    } catch {
      // On réessaiera au prochain envoi.
      return
    }
    // (26/10) Le village du meilleur monde part avec le score, pour qu'on puisse le visiter depuis
    // le classement. S'il est refusé (table pas encore créée...), tant pis.
    const village = villageAPartager(parties)
    if (village) await envoyerVillage(j, village).catch(() => {})
  }, [])

  const envoyer = useCallback(async (j: Joueur) => {
    const parties = exporterTout(stockage)
    const texte = JSON.stringify(parties)
    if (texte === dernierEnvoi.current) return
    let date: number
    try {
      date = await envoyerMondes(j, parties)
      dernierEnvoi.current = texte
      ecrireDerniereSynchro(stockage, { joueur: j.id, envoyeeLe: date })
    } catch {
      setStatut('hors-ligne')
      return
    }
    // Le score d'abord : le classement de l'accueil se relit quand l'heure d'envoi change.
    await envoyerLeScore(j, parties)
    setEnvoyeeLe(date)
    setStatut('a-jour')
  }, [envoyerLeScore])

  // Le premier échange après la connexion : envoyer ses mondes, ou récupérer ceux du compte
  // (29/10 : sans jamais rien demander, le compte gagne ; voir choisirSynchro).
  const synchroniser = useCallback(
    async (j: Joueur) => {
      if (occupe.current) return
      occupe.current = true
      setStatut('synchro')
      try {
        const enLigne = await telechargerMondes(j)
        const local = exporterTout(stockage)
        const choix = choisirSynchro(local, enLigne, j.id, lireDerniereSynchro(stockage))
        pret.current = true

        if (choix === 'recuperer' && enLigne) {
          importerTout(stockage, enLigne.parties)
          dernierEnvoi.current = JSON.stringify(exporterTout(stockage))
          ecrireDerniereSynchro(stockage, { joueur: j.id, envoyeeLe: enLigne.envoyeeLe })
          setEnvoyeeLe(enLigne.envoyeeLe)
          setVersionMondes((v) => v + 1)
          setStatut('a-jour')
          void envoyerLeScore(j, enLigne.parties)
        } else if (choix === 'envoyer') {
          dernierEnvoi.current = '' // on force l'envoi
          await envoyer(j)
        } else {
          setEnvoyeeLe(enLigne?.envoyeeLe ?? null)
          setStatut('a-jour')
        }
      } catch {
        setStatut('hors-ligne')
      } finally {
        occupe.current = false
      }
    },
    [envoyer, envoyerLeScore],
  )

  // Au lancement : une session est peut-être encore ouverte (Supabase la garde dans le navigateur).
  const demarre = useRef(false)
  useEffect(() => {
    if (demarre.current) return // en mode développement, React lance cet effet deux fois
    demarre.current = true
    // (27/10) La version CrazyGames n'a pas de comptes : on ne parle jamais au serveur.
    if (!AVEC_COMPTES) return
    joueurConnecte()
      .then((j) => {
        if (j === null) {
          setStatut('deconnecte')
          return
        }
        setJoueur(j)
        void synchroniser(j)
      })
      .catch(() => setStatut('deconnecte'))
  }, [synchroniser])

  // Pendant qu'on est connecté : envoi régulier, et un dernier envoi quand on quitte la page.
  useEffect(() => {
    if (joueur === null) return
    const regulierement = setInterval(() => {
      if (occupe.current) return
      // Si le premier échange a raté (serveur injoignable), on le retente.
      if (pret.current) void envoyer(joueur)
      else void synchroniser(joueur)
    }, INTERVALLE_ENVOI)
    const enPartant = () => {
      if (pret.current && document.visibilityState === 'hidden') void envoyer(joueur)
    }
    document.addEventListener('visibilitychange', enPartant)
    return () => {
      clearInterval(regulierement)
      document.removeEventListener('visibilitychange', enPartant)
    }
  }, [joueur, envoyer, synchroniser])

  // Se connecter (ou créer un compte). Renvoie un message d'erreur, ou null si tout va bien.
  const connecter = useCallback(
    async (pseudo: string, motDePasse: string, nouveauCompte: boolean): Promise<string | null> => {
      const probleme = erreurPseudo(pseudo) ?? erreurMotDePasse(motDePasse)
      if (probleme) return probleme
      const resultat = nouveauCompte ? await creerCompte(pseudo, motDePasse) : await seConnecter(pseudo, motDePasse)
      if (typeof resultat === 'string') return resultat
      pret.current = false
      setJoueur(resultat)
      await synchroniser(resultat)
      return null
    },
    [synchroniser],
  )

  const deconnecter = useCallback(async () => {
    if (joueur && pret.current) await envoyer(joueur) // on range les dernières parties avant de partir
    await seDeconnecter()
    pret.current = false
    dernierEnvoi.current = ''
    dernierScore.current = ''
    setJoueur(null)
    setEnvoyeeLe(null)
    setStatut('deconnecte')
  }, [joueur, envoyer])

  // Envoie tout de suite (par exemple en quittant un monde).
  const envoyerMaintenant = useCallback(() => {
    if (joueur && pret.current && !occupe.current) void envoyer(joueur)
  }, [joueur, envoyer])

  return { joueur, statut, envoyeeLe, versionMondes, connecter, deconnecter, envoyerMaintenant }
}

export type Compte = ReturnType<typeof useCompte>
