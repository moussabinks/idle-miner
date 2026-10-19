// Le « pont » entre la logique du jeu (src/jeu) et les composants React.
// Il garde l'état de la partie, fait tourner le minage animé, affiche les
// notifications et sauvegarde automatiquement dans le navigateur.

import { useCallback, useEffect, useRef, useState } from 'react'
import { aleatoireNavigateur } from './jeu/aleatoire'
import { BLOCS, LARGEUR_MINE, type IdBloc } from './jeu/donnees'
import { nbDansChariot } from './jeu/foreuse'
import {
  ascenseurEnMouvement,
  auFond,
  casserBloc,
  creerPartie,
  dureeBlocActuel,
  demanderEnvoi,
  indexBlocActuel,
  nbSurQuai,
  peutStocker,
  prestige,
  sacPlein,
  type EtatJeu,
} from './jeu/mineur'
import { charger, effacer, sauvegarder, secondesDepuisSauvegarde } from './jeu/sauvegarde'
import { verifierSucces } from './jeu/succes'
import { avancerTemps, tempsQuiPasse } from './jeu/temps'
import { evenementsEntre, type Evenement } from './evenements'
import { sons } from './sons'

export type Toast = { id: number; texte: string; succes: boolean }
export type Gain = { id: number; montant: number; vente: boolean }
// Les éclats d'un bloc qui vient de casser, et les minerais trouvés (animations).
export type Eclat = { id: number; colonne: number; bloc: IdBloc }
export type Trouvaille = { id: number; colonne: number; bloc: IdBloc; nombre: number }

// Une action du jeu : elle modifie l'état et renvoie des messages.
export type Action = (etat: EtatJeu) => string[]

const DUREE_TOAST = 3500 // ms
const DUREE_GAIN = 1200 // ms
const DUREE_VENTE = 1800 // ms, la grosse animation d'une vente
const DUREE_ECLATS = 600 // ms
const DUREE_TROUVAILLE = 1800 // ms
const INTERVALLE_COUPS = 0.22 // secondes entre deux coups de pioche (pour le son)
const DUREE_MIN_BLOC = 0.08 // secondes, pour que l'animation reste visible
const INTERVALLE_HORLOGE = 50 // ms entre deux « tics » de l'horloge
const ABSENCE_MAX = 8 * 60 * 60 // la foreuse travaille au plus 8 h pendant que le jeu est fermé

// Le travail du mineur sur un bloc : quel bloc (cle), et depuis combien de secondes.
type Travail = { cle: string; temps: number }

// Fait avancer un mineur sur son bloc. Renvoie true quand le bloc est cassé.
// Si le mineur a changé de bloc, on repart de zéro.
function travailler(travail: Travail, cle: string, duree: number, secondes: number): boolean {
  if (travail.cle !== cle) {
    travail.cle = cle
    travail.temps = 0
  }
  travail.temps += secondes
  if (travail.temps < Math.max(DUREE_MIN_BLOC, duree)) return false
  travail.cle = ''
  return true
}

let prochainId = 1
const ID_MESSAGE_ABSENCE = 0

// Joue le son qui va avec chaque événement.
function jouerSons(evenements: Evenement[]): void {
  for (const evenement of evenements) {
    switch (evenement.type) {
      case 'casse':
        if (evenement.bloc === 'lave') sons.lave()
        else if (evenement.bloc === 'coffre') sons.coffre()
        else if (evenement.bloc === 'geode') sons.geode()
        sons.casse(BLOCS[evenement.bloc].durete >= 3)
        break
      case 'trouvaille':
        if (evenement.rare) sons.rare()
        else sons.minerai()
        break
      case 'vente':
        sons.vente(evenement.montant)
        break
      case 'achat':
        sons.achat()
        break
      case 'ding':
        sons.ding()
        break
      case 'pas':
        sons.pas()
        break
      case 'piocheCassee':
        sons.piocheCassee()
        break
      case 'talent':
        sons.talent()
        break
    }
  }
}

// Charge la partie. Si le jeu était fermé, on rattrape le temps passé (la foreuse
// a continué de creuser) et on prépare un message pour le dire au joueur.
function chargerOuCreer(): { etat: EtatJeu; messageAbsence: string | null } {
  const etat = charger(window.localStorage)
  if (etat === null) return { etat: creerPartie(aleatoireNavigateur), messageAbsence: null }

  const absence = Math.min(ABSENCE_MAX, secondesDepuisSauvegarde(window.localStorage))
  const avant = nbDansChariot(etat)
  avancerTemps(etat, absence, aleatoireNavigateur)
  const fores = nbDansChariot(etat) - avant
  const messageAbsence = fores > 0 ? `⚙️ Pendant ton absence, la foreuse a remonté ${fores} blocs.` : null
  return { etat, messageAbsence }
}

export function usePartie() {
  const [depart] = useState(chargerOuCreer)
  const [etat, setEtat] = useState<EtatJeu>(depart.etat)
  // Au démarrage, on affiche le message de la foreuse si le joueur était absent.
  const [toasts, setToasts] = useState<Toast[]>(() =>
    depart.messageAbsence ? [{ id: ID_MESSAGE_ABSENCE, texte: depart.messageAbsence, succes: false }] : [],
  )
  const [gains, setGains] = useState<Gain[]>([])
  const [eclats, setEclats] = useState<Eclat[]>([])
  const [trouvailles, setTrouvailles] = useState<Trouvaille[]>([])
  // Augmente à chaque vente : le compteur d'argent du bandeau « saute ».
  const [nbVentes, setNbVentes] = useState(0)
  const [blocsRestants, setBlocsRestants] = useState(0)

  // Copie de l'état toujours à jour, pour les minuteurs.
  const etatRef = useRef(etat)

  const afficherToasts = useCallback((nouveaux: Toast[]) => {
    if (nouveaux.length === 0) return
    setToasts((anciens) => {
      // On évite d'empiler deux fois le même message.
      const textes = new Set(anciens.map((t) => t.texte))
      return [...anciens, ...nouveaux.filter((t) => !textes.has(t.texte))].slice(-5)
    })
    for (const t of nouveaux) {
      setTimeout(() => setToasts((liste) => liste.filter((x) => x.id !== t.id)), DUREE_TOAST)
    }
  }, [])

  const afficherGain = useCallback((montant: number, vente: boolean) => {
    const gain = { id: prochainId++, montant, vente }
    setGains((liste) => [...liste, gain])
    setTimeout(() => setGains((liste) => liste.filter((g) => g.id !== gain.id)), vente ? DUREE_VENTE : DUREE_GAIN)
  }, [])

  // Les animations qui vont avec les événements (éclats, minerais trouvés, ventes).
  const animer = useCallback(
    (evenements: Evenement[]) => {
      for (const evenement of evenements) {
        if (evenement.type === 'casse') {
          const eclat = { id: prochainId++, colonne: evenement.colonne, bloc: evenement.bloc }
          setEclats((liste) => [...liste.slice(-4), eclat])
          setTimeout(() => setEclats((liste) => liste.filter((e) => e.id !== eclat.id)), DUREE_ECLATS)
        }
        if (evenement.type === 'trouvaille') {
          const trouvaille = { id: prochainId++, colonne: evenement.colonne, bloc: evenement.bloc, nombre: evenement.nombre }
          setTrouvailles((liste) => [...liste.slice(-2), trouvaille])
          setTimeout(() => setTrouvailles((liste) => liste.filter((t) => t.id !== trouvaille.id)), DUREE_TROUVAILLE)
        }
        if (evenement.type === 'vente') setNbVentes((n) => n + 1)
      }
    },
    [],
  )

  // Remplace l'état de la partie (et le garde dans la référence).
  const changerEtat = useCallback((nouvel: EtatJeu) => {
    etatRef.current = nouvel
    setEtat(nouvel)
  }, [])

  // Joue une action sur une copie de l'état, puis vérifie les succès.
  const jouer = useCallback(
    (action: Action): EtatJeu => {
      const ancien = etatRef.current
      const copie = structuredClone(ancien)
      const messages = action(copie)
      const succes = verifierSucces(copie)

      afficherToasts([
        ...messages.map((texte) => ({ id: prochainId++, texte, succes: false })),
        ...succes.map((s) => ({ id: prochainId++, texte: `${s.emoji} Succès : ${s.titre}`, succes: true })),
      ])
      const evenements = evenementsEntre(ancien, copie)
      const vente = evenements.some((e) => e.type === 'vente')
      if (copie.argent > ancien.argent) afficherGain(copie.argent - ancien.argent, vente)
      jouerSons(evenements)
      if (succes.length > 0) sons.succes()
      animer(evenements)

      changerEtat(copie)
      return copie
    },
    [afficherToasts, afficherGain, animer, changerEtat],
  )

  // ... et on le retire au bout de quelques secondes.
  useEffect(() => {
    const minuteur = setTimeout(() => setToasts((liste) => liste.filter((t) => t.id !== ID_MESSAGE_ABSENCE)), 2 * DUREE_TOAST)
    return () => clearTimeout(minuteur)
  }, [])

  // Le nombre de blocs qu'il reste à casser (« Creuser » ou « x10 »), aussi gardé dans
  // une référence pour que l'horloge lise toujours la bonne valeur.
  const blocsRestantsRef = useRef(0)
  const changerBlocsRestants = useCallback((nombre: number) => {
    blocsRestantsRef.current = nombre
    setBlocsRestants(nombre)
  }, [])

  // Le bloc sur lequel travaille chaque mineur, et depuis combien de temps.
  const travailJoueur = useRef<Travail>({ cle: '', temps: 0 })

  // Après chaque bloc cassé : on compte, et on gère le sac plein.
  // Avec l'ascenseur, on ne s'arrête pas : les blocs en trop attendent sur son quai.
  const apresUnBloc = useCallback(
    (apres: EtatJeu) => {
      if (!auFond(apres)) {
        // Le mineur n'est plus au front.
        changerBlocsRestants(0)
      } else if (!peutStocker(apres)) {
        changerBlocsRestants(0)
        afficherToasts([
          {
            id: prochainId++,
            texte:
              apres.ascenseur.niveau > 0
                ? '🎒 Sac plein ! Envoie tes objets à la surface avec l’ascenseur (panneau Sac).'
                : '🎒 Sac plein ! Remonte vendre au marché (↑).',
            succes: false,
          },
        ])
      } else changerBlocsRestants(blocsRestantsRef.current - 1)
    },
    [changerBlocsRestants, afficherToasts],
  )

  // Un « tic » de l'horloge : le temps passe pour tout le monde.
  const tic = useCallback(
    (secondes: number) => {
      // L'échelle, l'ascenseur et la foreuse.
      if (tempsQuiPasse(etatRef.current)) jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))

      // Le minage (seulement si on a demandé de creuser, et au front de taille).
      if (blocsRestantsRef.current <= 0) return
      let etatActuel = etatRef.current
      if (!auFond(etatActuel)) {
        changerBlocsRestants(0)
        return
      }

      // Avec l'envoi automatique (case à cocher dans le sac) : quand le sac est plein, l'ascenseur
      // vient chercher les objets cochés. Pendant ce temps, on continue de creuser.
      const aRemonter = sacPlein(etatActuel) || nbSurQuai(etatActuel) > 0
      const ascenseur = etatActuel.ascenseur
      if (aRemonter && ascenseur.envoiAuto && !ascenseur.envoiDemande && !ascenseurEnMouvement(etatActuel)) {
        etatActuel = jouer(demanderEnvoi)
      }

      // Le joueur avance sur son bloc.
      const indexJoueur = indexBlocActuel(etatActuel)
      const cleJoueur = `${etatActuel.profondeur}-${indexJoueur}-${etatActuel.coucheActuelle[indexJoueur]}`
      // Un « tac » de pioche à intervalles réguliers pendant qu'on casse le bloc.
      const tempsAvant = travailJoueur.current.cle === cleJoueur ? travailJoueur.current.temps : 0
      if (Math.floor((tempsAvant + secondes) / INTERVALLE_COUPS) > Math.floor(tempsAvant / INTERVALLE_COUPS)) sons.coup()
      if (travailler(travailJoueur.current, cleJoueur, dureeBlocActuel(etatActuel), secondes)) {
        apresUnBloc(jouer((e) => casserBloc(e, aleatoireNavigateur)))
      }
    },
    [jouer, apresUnBloc, changerBlocsRestants],
  )

  // L'horloge tourne quand quelque chose bouge : échelle, ascenseur, foreuse ou minage.
  const horlogeActive = tempsQuiPasse(etat) || blocsRestants > 0
  useEffect(() => {
    if (!horlogeActive) return
    let derniereFois = performance.now()
    const horloge = setInterval(() => {
      const maintenant = performance.now()
      const secondes = (maintenant - derniereFois) / 1000
      derniereFois = maintenant
      tic(secondes)
    }, INTERVALLE_HORLOGE)
    return () => clearInterval(horloge)
  }, [horlogeActive, tic])

  // Sauvegarde automatique à chaque changement.
  useEffect(() => {
    sauvegarder(window.localStorage, etat)
  }, [etat])

  // Creuse des couches entières : on finit la couche en cours, puis les suivantes.
  const creuser = useCallback(
    (nbCouches: number) => {
      const restantsCouche = etatRef.current.coucheActuelle.filter((b) => b !== null).length
      changerBlocsRestants(restantsCouche + (nbCouches - 1) * LARGEUR_MINE)
    },
    [changerBlocsRestants],
  )

  const arreter = useCallback(() => changerBlocsRestants(0), [changerBlocsRestants])

  const recommencer = useCallback(() => {
    changerBlocsRestants(0)
    effacer(window.localStorage)
    changerEtat(creerPartie(aleatoireNavigateur))
    setToasts([])
  }, [changerEtat, changerBlocsRestants])

  const passerPrestige = useCallback(() => {
    changerBlocsRestants(0)
    changerEtat(prestige(etatRef.current, aleatoireNavigateur))
    sons.prestige()
  }, [changerEtat, changerBlocsRestants])

  return {
    etat,
    toasts,
    gains,
    eclats,
    trouvailles,
    nbVentes,
    enMinage: blocsRestants > 0,
    jouer,
    creuser,
    arreter,
    recommencer,
    passerPrestige,
  }
}
