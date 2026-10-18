// Le « pont » entre la logique du jeu (src/jeu) et les composants React.
// Il garde l'état de la partie, fait tourner le minage animé, affiche les
// notifications et sauvegarde automatiquement dans le navigateur.

import { useCallback, useEffect, useRef, useState } from 'react'
import { aleatoireNavigateur } from './jeu/aleatoire'
import { LARGEUR_MINE } from './jeu/donnees'
import { nbDansChariot } from './jeu/foreuse'
import {
  appelerAscenseur,
  ascenseurDisponible,
  ascenseurEnMouvement,
  auFond,
  casserBloc,
  casserBlocAssistant,
  creerPartie,
  dureeBlocActuel,
  dureeBlocAssistant,
  envoyerAscenseur,
  indexBlocActuel,
  indexBlocAssistant,
  nbSurQuai,
  peutStocker,
  prestige,
  sacPlein,
  type EtatJeu,
} from './jeu/mineur'
import { charger, effacer, sauvegarder, secondesDepuisSauvegarde } from './jeu/sauvegarde'
import { verifierSucces } from './jeu/succes'
import { avancerTemps, tempsQuiPasse } from './jeu/temps'

export type Toast = { id: number; texte: string; succes: boolean }
export type Gain = { id: number; montant: number }

// Une action du jeu : elle modifie l'état et renvoie des messages.
export type Action = (etat: EtatJeu) => string[]

const DUREE_TOAST = 3500 // ms
const DUREE_GAIN = 1200 // ms
const DUREE_MIN_BLOC = 0.08 // secondes, pour que l'animation reste visible
const INTERVALLE_HORLOGE = 50 // ms entre deux « tics » de l'horloge
const ABSENCE_MAX = 8 * 60 * 60 // la foreuse travaille au plus 8 h pendant que le jeu est fermé

// Le travail d'un mineur sur un bloc : quel bloc (cle), et depuis combien de secondes.
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

  const afficherGain = useCallback((montant: number) => {
    const gain = { id: prochainId++, montant }
    setGains((liste) => [...liste, gain])
    setTimeout(() => setGains((liste) => liste.filter((g) => g.id !== gain.id)), DUREE_GAIN)
  }, [])

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
      if (copie.argent > ancien.argent) afficherGain(copie.argent - ancien.argent)

      changerEtat(copie)
      return copie
    },
    [afficherToasts, afficherGain, changerEtat],
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
  const travailAssistant = useRef<Travail>({ cle: '', temps: 0 })

  // Après chaque bloc cassé : on compte, et on gère le sac plein.
  // Avec l'ascenseur, on ne s'arrête pas : les blocs en trop attendent sur son quai.
  const apresUnBloc = useCallback(
    (apres: EtatJeu) => {
      if (!auFond(apres)) {
        // Le mineur n'est plus au front (un monstre l'a assommé, par exemple).
        changerBlocsRestants(0)
      } else if (!peutStocker(apres)) {
        changerBlocsRestants(0)
        afficherToasts([
          {
            id: prochainId++,
            texte:
              apres.ascenseur.niveau > 0
                ? '🎒 Sac et quai pleins ! Attends le retour de l’ascenseur.'
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

      // Sac plein (ou quai pas vide) : la cabine emporte tout au marché si elle est là,
      // sinon on l'appelle. Pendant ce temps, on continue de creuser.
      const aRemonter = sacPlein(etatActuel) || nbSurQuai(etatActuel) > 0
      if (aRemonter && etatActuel.ascenseur.niveau > 0 && !ascenseurEnMouvement(etatActuel)) {
        etatActuel = ascenseurDisponible(etatActuel) ? jouer(envoyerAscenseur) : jouer(appelerAscenseur)
      }

      // Le joueur avance sur son bloc.
      const indexJoueur = indexBlocActuel(etatActuel)
      const cleJoueur = `${etatActuel.profondeur}-${indexJoueur}-${etatActuel.coucheActuelle[indexJoueur]}`
      if (travailler(travailJoueur.current, cleJoueur, dureeBlocActuel(etatActuel), secondes)) {
        apresUnBloc(jouer((e) => casserBloc(e, aleatoireNavigateur)))
      }

      // L'assistant (s'il est embauché) avance sur le sien, en même temps.
      const etatApres = etatRef.current
      if (etatApres.assistant.embauche && blocsRestantsRef.current > 0 && auFond(etatApres)) {
        const indexAssistant = indexBlocAssistant(etatApres)
        if (indexAssistant !== -1) {
          const cleAssistant = `${etatApres.profondeur}-${indexAssistant}-${etatApres.coucheActuelle[indexAssistant]}`
          if (travailler(travailAssistant.current, cleAssistant, dureeBlocAssistant(etatApres), secondes)) {
            apresUnBloc(jouer((e) => casserBlocAssistant(e, aleatoireNavigateur)))
          }
        }
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
  }, [changerEtat, changerBlocsRestants])

  return {
    etat,
    toasts,
    gains,
    enMinage: blocsRestants > 0,
    jouer,
    creuser,
    arreter,
    recommencer,
    passerPrestige,
  }
}
