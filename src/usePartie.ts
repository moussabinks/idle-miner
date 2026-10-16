// Le « pont » entre la logique du jeu (src/jeu) et les composants React.
// Il garde l'état de la partie, fait tourner le minage animé, affiche les
// notifications et sauvegarde automatiquement dans le navigateur.

import { useCallback, useEffect, useRef, useState } from 'react'
import { aleatoireNavigateur } from './jeu/aleatoire'
import { LARGEUR_MINE } from './jeu/donnees'
import { casserBloc, creerPartie, dureeBlocActuel, prestige, sacPlein, type EtatJeu } from './jeu/mineur'
import { charger, effacer, sauvegarder } from './jeu/sauvegarde'
import { verifierSucces } from './jeu/succes'

export type Toast = { id: number; texte: string; succes: boolean }
export type Gain = { id: number; montant: number }

// Une action du jeu : elle modifie l'état et renvoie des messages.
export type Action = (etat: EtatJeu) => string[]

const DUREE_TOAST = 3500 // ms
const DUREE_GAIN = 1200 // ms
const DUREE_MIN_BLOC = 80 // ms, pour que l'animation reste visible

let prochainId = 1

function chargerOuCreer(): EtatJeu {
  return charger(window.localStorage) ?? creerPartie(aleatoireNavigateur)
}

export function usePartie() {
  const [etat, setEtat] = useState<EtatJeu>(chargerOuCreer)
  const [toasts, setToasts] = useState<Toast[]>([])
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

  // Minage animé : on casse un bloc, on attend sa durée, puis le suivant.
  useEffect(() => {
    if (blocsRestants <= 0 || etat.victoire) return
    const duree = Math.max(DUREE_MIN_BLOC, dureeBlocActuel(etat) * 1000)
    const minuteur = setTimeout(() => {
      const apres = jouer((e) => casserBloc(e, aleatoireNavigateur))
      // On s'arrête tout seul si le sac est plein ou si on a gagné.
      if (sacPlein(apres) || apres.victoire) setBlocsRestants(0)
      else setBlocsRestants((n) => n - 1)
    }, duree)
    return () => clearTimeout(minuteur)
  }, [blocsRestants, etat, jouer])

  // Sauvegarde automatique à chaque changement.
  useEffect(() => {
    sauvegarder(window.localStorage, etat)
  }, [etat])

  // Creuse des couches entières : on finit la couche en cours, puis les suivantes.
  const creuser = useCallback((nbCouches: number) => {
    const restantsCouche = etatRef.current.coucheActuelle.filter((b) => b !== null).length
    setBlocsRestants(restantsCouche + (nbCouches - 1) * LARGEUR_MINE)
  }, [])

  const arreter = useCallback(() => setBlocsRestants(0), [])

  const recommencer = useCallback(() => {
    setBlocsRestants(0)
    effacer(window.localStorage)
    changerEtat(creerPartie(aleatoireNavigateur))
    setToasts([])
  }, [changerEtat])

  const passerPrestige = useCallback(() => {
    setBlocsRestants(0)
    changerEtat(prestige(etatRef.current, aleatoireNavigateur))
  }, [changerEtat])

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
