// Le compte du joueur et la sauvegarde en ligne de ses mondes.
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
  type SauvegardeEnLigne,
} from './jeu/compte'
import { exporterTout, importerTout, mondesDeLaCopie } from './jeu/sauvegarde'
import { creerCompte, envoyerMondes, joueurConnecte, seConnecter, seDeconnecter, telechargerMondes, type Joueur } from './enLigne'

// Toutes les 20 s, on envoie les mondes s'ils ont changé.
const INTERVALLE_ENVOI = 20_000 // ms

export type StatutCompte =
  | 'chargement' // on regarde si une session est ouverte
  | 'deconnecte'
  | 'synchro' // échange en cours avec le serveur (on ne peut pas lancer de partie)
  | 'a-jour'
  | 'hors-ligne' // le serveur ne répond pas : on réessaie tout seul

// La question posée quand le compte et le navigateur ont chacun des mondes différents.
function questionRemplacer(enLigne: SauvegardeEnLigne): string {
  const nb = mondesDeLaCopie(enLigne.parties).length
  const date = new Date(enLigne.envoyeeLe).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  return (
    `Ton compte a déjà ${nb} monde${nb > 1 ? 's' : ''} en ligne (sauvegardé${nb > 1 ? 's' : ''} le ${date}), ` +
    `et ce navigateur a d'autres mondes.\n\n` +
    `OK : jouer avec les mondes de ton compte (ceux de ce navigateur seront remplacés).\n` +
    `Annuler : garder les mondes de ce navigateur (ils remplaceront ceux de ton compte).`
  )
}

export function useCompte() {
  const [joueur, setJoueur] = useState<Joueur | null>(null)
  const [statut, setStatut] = useState<StatutCompte>('chargement')
  const [envoyeeLe, setEnvoyeeLe] = useState<number | null>(null)
  // Change quand les mondes du navigateur ont été remplacés par ceux du compte (l'accueil se redessine).
  const [versionMondes, setVersionMondes] = useState(0)

  // Le texte des mondes au dernier échange : on n'envoie rien tant qu'il n'a pas changé.
  const dernierEnvoi = useRef('')
  // Vrai une fois le premier échange fait : avant, on n'envoie rien (on risquerait
  // d'écraser les mondes du compte avant d'avoir regardé ce qu'il contient).
  const pret = useRef(false)
  const occupe = useRef(false)

  const envoyer = useCallback(async (j: Joueur) => {
    const parties = exporterTout(window.localStorage)
    const texte = JSON.stringify(parties)
    if (texte === dernierEnvoi.current) return
    try {
      const date = await envoyerMondes(j, parties)
      dernierEnvoi.current = texte
      ecrireDerniereSynchro(window.localStorage, { joueur: j.id, envoyeeLe: date })
      setEnvoyeeLe(date)
      setStatut('a-jour')
    } catch {
      setStatut('hors-ligne')
    }
  }, [])

  // Le premier échange après la connexion : envoyer, récupérer, ou demander au joueur.
  const synchroniser = useCallback(
    async (j: Joueur) => {
      if (occupe.current) return
      occupe.current = true
      setStatut('synchro')
      try {
        const enLigne = await telechargerMondes(j)
        const local = exporterTout(window.localStorage)
        let choix = choisirSynchro(local, enLigne, j.id, lireDerniereSynchro(window.localStorage))
        if (choix === 'demander' && enLigne) choix = window.confirm(questionRemplacer(enLigne)) ? 'recuperer' : 'envoyer'
        pret.current = true

        if (choix === 'recuperer' && enLigne) {
          importerTout(window.localStorage, enLigne.parties)
          dernierEnvoi.current = JSON.stringify(exporterTout(window.localStorage))
          ecrireDerniereSynchro(window.localStorage, { joueur: j.id, envoyeeLe: enLigne.envoyeeLe })
          setEnvoyeeLe(enLigne.envoyeeLe)
          setVersionMondes((v) => v + 1)
          setStatut('a-jour')
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
    [envoyer],
  )

  // Au lancement : une session est peut-être encore ouverte (Supabase la garde dans le navigateur).
  const demarre = useRef(false)
  useEffect(() => {
    if (demarre.current) return // en mode développement, React lance cet effet deux fois
    demarre.current = true
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
