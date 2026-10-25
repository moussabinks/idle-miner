// Le « pont » entre la logique du jeu (src/jeu) et les composants React.
// Il garde l'état de la partie, fait passer le temps (la mine, les mineurs, le wagonnet...),
// affiche les notifications et sauvegarde automatiquement dans le navigateur.

import { useCallback, useEffect, useRef, useState } from 'react'
import { aleatoireNavigateur } from './jeu/aleatoire'
import { BLOCS, type IdBloc } from './jeu/donnees'
import { cliquerMine, creerPartie, type EtatJeu } from './jeu/mineur'
import { niveauJoueur } from './jeu/niveaux'
import { photoPartie, resumerAbsence, vendreCoffreAuRetour, type ResumeAbsence } from './jeu/absence'
import { charger, marquerJoue, sauvegarder, secondesDepuisSauvegarde } from './jeu/sauvegarde'
import { verifierSucces } from './jeu/succes'
import { avancerTemps } from './jeu/temps'
import { joueurPousse } from './jeu/wagonnet'
import { evenementsEntre, type Evenement } from './evenements'
import { sons } from './sons'
import { stockage } from './stockage'

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
const ABSENCE_MAX = 8 * 60 * 60 // la mine travaille au plus 8 h pendant que le jeu est fermé (ou caché)

let prochainId = 1

// Joue le son qui va avec chaque événement.
function jouerSons(evenements: Evenement[]): void {
  const amelioration = evenements.some((e) => e.type === 'amelioration')
  for (const evenement of evenements) {
    switch (evenement.type) {
      case 'casse':
        sons.casse(BLOCS[evenement.bloc].dur)
        if (evenement.rare) sons.rare()
        else if (BLOCS[evenement.bloc].minerai) sons.minerai()
        if (evenement.nombre > 1) sons.fortune()
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
        sons.venteMarche(evenement.montant)
        break
      case 'electricite':
        sons.electricite()
        break
    }
  }
}

// Charge la partie du monde choisi. Si le monde n'a pas été ouvert depuis un moment, on
// rattrape le temps passé (la mine, les mineurs et le wagonnet ont continué) et on prépare un message.
// (30/10) Le résumé s'affiche dans une grande fenêtre, avec un bouton « Tout récupérer ».
function chargerOuCreer(idMonde: string): { etat: EtatJeu; resumeAbsence: ResumeAbsence | null } {
  marquerJoue(stockage, idMonde)
  const etat = charger(stockage, idMonde)
  if (etat === null) return { etat: creerPartie(aleatoireNavigateur), resumeAbsence: null }

  const absence = Math.min(ABSENCE_MAX, secondesDepuisSauvegarde(stockage, idMonde))
  if (absence < 30) return { etat, resumeAbsence: null }
  const avant = photoPartie(etat)
  avancerTemps(etat, absence, aleatoireNavigateur)
  // (25/10) Le coffre, souvent plein au retour, est vendu tout seul.
  const venteCoffre = vendreCoffreAuRetour(etat)
  return { etat, resumeAbsence: resumerAbsence(avant, etat, absence, venteCoffre) }
}

// idMonde : le monde (la sauvegarde) choisi sur l'écran d'accueil.
export function usePartie(idMonde: string) {
  const [depart] = useState(() => chargerOuCreer(idMonde))
  const [etat, setEtat] = useState<EtatJeu>(depart.etat)
  // Au démarrage, on affiche ce qui s'est passé pendant l'absence du joueur.
  const [toasts, setToasts] = useState<Toast[]>([])
  // Ce qui s'est passé pendant l'absence (la fenêtre du retour), jusqu'à « Tout récupérer ».
  const [resumeAbsence, setResumeAbsence] = useState<ResumeAbsence | null>(depart.resumeAbsence)
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
      // (une vente du wagonnet aussi : le compteur d'argent saute)
      if (evenement.type === 'vente' || evenement.type === 'wagonnet') setNbVentes((n) => n + 1)
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
        // (23/10 : un niveau gagné a sa grande fenêtre, FeteNiveau : pas de message en plus)
        ...messages.filter((texte) => !texte.startsWith('🎉')).map((texte) => ({ id: prochainId++, texte, succes: false })),
        ...succes.map((s) => ({ id: prochainId++, texte: `${s.emoji} Succès : ${s.titre}`, succes: true })),
      ])
      const evenements = evenementsEntre(ancien, copie)
      // La grande animation seulement pour tes ventes ; un petit « +X $ » pour le reste (wagonnet...).
      // Un wagonnet qui vend au marché : son « +X $ » jaillit au-dessus du wagonnet (WagonnetVillage).
      const vente = evenements.find((e) => e.type === 'vente')
      const venteWagonnet = evenements.find((e) => e.type === 'wagonnet')
      if (vente) afficherGain(vente.montant, true)
      else if (!venteWagonnet && copie.argent > ancien.argent) afficherGain(copie.argent - ancien.argent, false)
      jouerSons(evenements)
      // (29/10) Un niveau gagné : une petite fanfare (son message arrive avec les autres).
      if (succes.length > 0 || niveauJoueur(copie) > niveauJoueur(ancien)) sons.succes()
      animer(evenements)

      changerEtat(copie)
      return copie
    },
    [afficherToasts, afficherGain, animer, changerEtat],
  )

  // « Continuer » : la fenêtre du retour se ferme avec une belle animation des ventes.
  const recupererAbsence = useCallback(() => {
    if (resumeAbsence && resumeAbsence.net > 0) {
      afficherGain(resumeAbsence.net, true)
      sons.venteMarche(resumeAbsence.net)
      setNbVentes((n) => n + 1)
    } else sons.succes()
    setResumeAbsence(null)
  }, [resumeAbsence, afficherGain])

  // L'horloge tourne tout le temps : la mine sort ses blocs toute seule. Quand le joueur pousse
  // le wagonnet, elle bat aussi à chaque image de l'écran pour que le mouvement soit fluide.
  // (24/10) Onglet caché ou fenêtre réduite, le jeu continue comme s'il était ouvert : le
  // navigateur ralentit alors l'horloge (un tic par seconde, voire par minute) et arrête les
  // images de l'écran ; à chaque tic, on avance donc de TOUT le temps passé depuis le précédent
  // (avant : au plus 1 s, le jeu semblait en pause). Ordinateur en veille : 8 h au plus, comme
  // jeu fermé.
  const mouvementFluide = joueurPousse(etat)
  useEffect(() => {
    let derniereFois = performance.now()
    const avancer = () => {
      const maintenant = performance.now()
      const secondes = Math.min(ABSENCE_MAX, (maintenant - derniereFois) / 1000)
      derniereFois = maintenant
      if (secondes > 0) jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))
    }
    // L'horloge bat toujours (même quand les images de l'écran s'arrêtent, onglet caché).
    const horloge = setInterval(avancer, INTERVALLE_HORLOGE)
    // Au retour sur l'onglet, on rattrape tout de suite le temps passé.
    const auRetour = () => {
      if (document.visibilityState === 'visible') avancer()
    }
    document.addEventListener('visibilitychange', auRetour)
    let image = 0
    if (mouvementFluide) {
      image = requestAnimationFrame(function boucle() {
        avancer()
        image = requestAnimationFrame(boucle)
      })
    }
    return () => {
      clearInterval(horloge)
      cancelAnimationFrame(image)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [mouvementFluide, jouer])

  // Sauvegarde automatique (au plus une fois par seconde : l'horloge change l'état sans arrêt).
  const derniereSauvegarde = useRef(0)
  useEffect(() => {
    const maintenant = Date.now()
    if (maintenant - derniereSauvegarde.current < 1000) return
    derniereSauvegarde.current = maintenant
    sauvegarder(stockage, idMonde, etat)
  }, [etat, idMonde])
  // Et en quittant la page.
  useEffect(() => {
    const auRevoir = () => sauvegarder(stockage, idMonde, etatRef.current)
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

  return { etat, toasts, gains, eclats, trouvailles, nbVentes, jouer, cliquer, recommencer, resumeAbsence, recupererAbsence }
}
