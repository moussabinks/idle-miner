// Le « pont » entre la logique du jeu (src/jeu) et les composants React.
// Il garde l'état de la partie, fait passer le temps (la mine, les mineurs, le wagonnet...),
// affiche les notifications et sauvegarde automatiquement dans le navigateur.

import { useCallback, useEffect, useRef, useState } from 'react'
import { aleatoireNavigateur } from './jeu/aleatoire'
import { BLOCS, type IdBloc } from './jeu/donnees'
import { nbSansSalaire } from './jeu/employes'
import { nbDansChariot } from './jeu/foreuse'
import { cliquerMine, creerPartie, nbDansCoffre, type EtatJeu } from './jeu/mineur'
import { charger, marquerJoue, sauvegarder, secondesDepuisSauvegarde } from './jeu/sauvegarde'
import { verifierSucces } from './jeu/succes'
import { avancerTemps } from './jeu/temps'
import { joueurPousse } from './jeu/wagonnet'
import { evenementsEntre, type Evenement } from './evenements'
import { sons } from './sons'

export type Toast = { id: number; texte: string; succes: boolean }
export type Gain = { id: number; montant: number; vente: boolean }
// Les éclats du bloc de la mine qui vient de casser, et le minerai qui en sort (animations).
export type Eclat = { id: number; bloc: IdBloc }
export type Trouvaille = { id: number; bloc: IdBloc; nombre: number }

// Une action du jeu : elle modifie l'état et renvoie des messages.
export type Action = (etat: EtatJeu) => string[]

const DUREE_TOAST = 3500 // ms
const DUREE_GAIN = 1200 // ms
const DUREE_VENTE = 1800 // ms, la grosse animation d'une vente
const DUREE_ECLATS = 600 // ms
const DUREE_TROUVAILLE = 1500 // ms
const INTERVALLE_HORLOGE = 50 // ms entre deux « tics » de l'horloge
const ABSENCE_MAX = 8 * 60 * 60 // la mine travaille au plus 8 h pendant que le jeu est fermé

let prochainId = 1
const ID_MESSAGE_ABSENCE = 0

// Joue le son qui va avec chaque événement.
function jouerSons(evenements: Evenement[]): void {
  const amelioration = evenements.some((e) => e.type === 'amelioration')
  for (const evenement of evenements) {
    switch (evenement.type) {
      case 'casse':
        sons.casse(BLOCS[evenement.bloc].dur)
        if (evenement.rare) sons.rare()
        else if (BLOCS[evenement.bloc].minerai) sons.minerai()
        if (evenement.nombre > 1) sons.pieces(2)
        break
      case 'vente':
        sons.vente(evenement.montant)
        break
      case 'achat':
        if (!amelioration) sons.achat()
        break
      case 'amelioration':
        sons.amelioration()
        break
      case 'piocheCassee':
        sons.piocheCassee()
        break
      case 'wagonnet':
        sons.pieces(3)
        break
      case 'electricite':
        sons.electricite()
        break
    }
  }
}

// Charge la partie du monde choisi. Si le monde n'a pas été ouvert depuis un moment, on
// rattrape le temps passé (la mine, les mineurs et le wagonnet ont continué) et on prépare un message.
function chargerOuCreer(idMonde: string): { etat: EtatJeu; messageAbsence: string | null } {
  marquerJoue(window.localStorage, idMonde)
  const etat = charger(window.localStorage, idMonde)
  if (etat === null) return { etat: creerPartie(aleatoireNavigateur), messageAbsence: null }

  const absence = Math.min(ABSENCE_MAX, secondesDepuisSauvegarde(window.localStorage, idMonde))
  if (absence < 30) return { etat, messageAbsence: null }
  const avant = { fores: nbDansChariot(etat), coffre: nbDansCoffre(etat), argent: etat.argent }
  avancerTemps(etat, absence, aleatoireNavigateur)
  const fores = nbDansChariot(etat) - avant.fores
  const coffre = nbDansCoffre(etat) - avant.coffre
  const gagne = etat.argent - avant.argent
  const morceaux: string[] = []
  if (coffre > 0) morceaux.push(`📦 ${coffre} blocs de plus dans le coffre de la mine`)
  if (gagne > 0) morceaux.push(`🛤️ le wagonnet a rapporté ${Math.round(gagne).toLocaleString('fr-FR')} $`)
  if (fores > 0) morceaux.push(`⚙️ la foreuse a remonté ${fores} blocs`)
  const sansSalaire = nbSansSalaire(etat)
  if (sansSalaire > 0) morceaux.push(sansSalaire === 1 ? '😠 un mineur attend son salaire' : `😠 ${sansSalaire} mineurs attendent leur salaire`)
  const messageAbsence = morceaux.length > 0 ? `Pendant ton absence : ${morceaux.join(', ')}.` : null
  return { etat, messageAbsence }
}

// idMonde : le monde (la sauvegarde) choisi sur l'écran d'accueil.
export function usePartie(idMonde: string) {
  const [depart] = useState(() => chargerOuCreer(idMonde))
  const [etat, setEtat] = useState<EtatJeu>(depart.etat)
  // Au démarrage, on affiche ce qui s'est passé pendant l'absence du joueur.
  const [toasts, setToasts] = useState<Toast[]>(() =>
    depart.messageAbsence ? [{ id: ID_MESSAGE_ABSENCE, texte: depart.messageAbsence, succes: false }] : [],
  )
  const [gains, setGains] = useState<Gain[]>([])
  const [eclats, setEclats] = useState<Eclat[]>([])
  const [trouvailles, setTrouvailles] = useState<Trouvaille[]>([])
  // Augmente à chaque vente : le compteur d'argent du bandeau « saute ».
  const [nbVentes, setNbVentes] = useState(0)

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
  const animer = useCallback((evenements: Evenement[]) => {
    for (const evenement of evenements) {
      if (evenement.type === 'casse') {
        const eclat = { id: prochainId++, bloc: evenement.bloc }
        setEclats((liste) => [...liste.slice(-4), eclat])
        setTimeout(() => setEclats((liste) => liste.filter((e) => e.id !== eclat.id)), DUREE_ECLATS)
        const trouvaille = { id: prochainId++, bloc: evenement.bloc, nombre: evenement.nombre }
        setTrouvailles((liste) => [...liste.slice(-3), trouvaille])
        setTimeout(() => setTrouvailles((liste) => liste.filter((t) => t.id !== trouvaille.id)), DUREE_TROUVAILLE)
      }
      if (evenement.type === 'vente') setNbVentes((n) => n + 1)
    }
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
      const evenements = evenementsEntre(ancien, copie)
      // La grande animation seulement pour tes ventes ; un petit « +X $ » pour le reste (wagonnet...).
      const vente = evenements.find((e) => e.type === 'vente')
      if (vente) afficherGain(vente.montant, true)
      else if (copie.argent > ancien.argent) afficherGain(copie.argent - ancien.argent, false)
      jouerSons(evenements)
      if (succes.length > 0) sons.succes()
      animer(evenements)

      changerEtat(copie)
      return copie
    },
    [afficherToasts, afficherGain, animer, changerEtat],
  )

  // ... et on retire le message d'absence au bout de quelques secondes.
  useEffect(() => {
    const minuteur = setTimeout(() => setToasts((liste) => liste.filter((t) => t.id !== ID_MESSAGE_ABSENCE)), 2 * DUREE_TOAST)
    return () => clearTimeout(minuteur)
  }, [])

  // L'horloge tourne tout le temps : la mine sort ses blocs toute seule. Quand le joueur pousse
  // le wagonnet, elle bat à chaque image de l'écran pour que le mouvement soit fluide.
  const mouvementFluide = joueurPousse(etat)
  useEffect(() => {
    let derniereFois = performance.now()
    const avancer = () => {
      const maintenant = performance.now()
      // Au plus 1 s d'un coup (si l'onglet était en pause, par exemple).
      const secondes = Math.min(1, (maintenant - derniereFois) / 1000)
      derniereFois = maintenant
      jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))
    }
    if (mouvementFluide) {
      let image = requestAnimationFrame(function boucle() {
        avancer()
        image = requestAnimationFrame(boucle)
      })
      return () => cancelAnimationFrame(image)
    }
    const horloge = setInterval(avancer, INTERVALLE_HORLOGE)
    return () => clearInterval(horloge)
  }, [mouvementFluide, jouer])

  // Sauvegarde automatique (au plus une fois par seconde : l'horloge change l'état sans arrêt).
  const derniereSauvegarde = useRef(0)
  useEffect(() => {
    const maintenant = Date.now()
    if (maintenant - derniereSauvegarde.current < 1000) return
    derniereSauvegarde.current = maintenant
    sauvegarder(window.localStorage, idMonde, etat)
  }, [etat, idMonde])
  // Et en quittant la page.
  useEffect(() => {
    const auRevoir = () => sauvegarder(window.localStorage, idMonde, etatRef.current)
    window.addEventListener('pagehide', auRevoir)
    return () => {
      window.removeEventListener('pagehide', auRevoir)
      auRevoir()
    }
  }, [idMonde])

  // Un clic sur le bloc de la mine.
  const cliquer = useCallback(() => {
    sons.coup()
    jouer((e) => cliquerMine(e, aleatoireNavigateur))
  }, [jouer])

  const recommencer = useCallback(() => {
    changerEtat(creerPartie(aleatoireNavigateur)) // la sauvegarde automatique remplace l'ancienne partie
    setToasts([])
  }, [changerEtat])

  return { etat, toasts, gains, eclats, trouvailles, nbVentes, jouer, cliquer, recommencer }
}
