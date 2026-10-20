// Le jeu comme une application (PWA) : on enregistre le service worker (public/sw.js),
// et on aide le joueur à installer le jeu sur l'écran d'accueil de son téléphone.
//
// - Android / Chrome / Edge : le navigateur nous donne une « invitation » (beforeinstallprompt)
//   qu'on garde pour l'ouvrir quand le joueur clique sur notre bouton « Installer ».
// - iPhone / iPad (Safari) : pas d'invitation possible, on explique comment faire à la main.

import { useEffect, useState } from 'react'

// L'invitation du navigateur (elle n'existe pas dans les types TypeScript de base).
type InvitationInstallation = Event & { prompt: () => Promise<void> }

let invitation: InvitationInstallation | null = null
const CHANGEMENT = 'idle-miner-installation'

// On écoute dès le chargement du fichier : le navigateur envoie l'invitation très tôt.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evenement) => {
    evenement.preventDefault() // pas de bandeau automatique : on attend notre bouton
    invitation = evenement as InvitationInstallation
    window.dispatchEvent(new Event(CHANGEMENT))
  })
  window.addEventListener('appinstalled', () => {
    invitation = null
    window.dispatchEvent(new Event(CHANGEMENT))
  })
}

// Seulement pour le site en ligne : en développement, le cache gênerait les modifications.
export function enregistrerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      // Pas de service worker (navigation privée...) : le jeu marche quand même, sans hors ligne.
    })
  })
}

// Le jeu est-il déjà ouvert comme une application installée ?
export function estInstalle(): boolean {
  const iosInstalle = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosInstalle || window.matchMedia('(display-mode: standalone)').matches
}

function estIOS(): boolean {
  // Les iPad récents se présentent comme un Mac, mais avec un écran tactile.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

// « installe » : rien à proposer ; « bouton » : on peut ouvrir l'invitation ;
// « ios » : on explique le bouton Partager ; « rien » : ce navigateur ne sait pas installer.
export type ModeInstallation = 'installe' | 'bouton' | 'ios' | 'rien'

function modeActuel(): ModeInstallation {
  if (estInstalle()) return 'installe'
  if (invitation) return 'bouton'
  if (estIOS()) return 'ios'
  return 'rien'
}

export function useInstallation() {
  const [mode, setMode] = useState<ModeInstallation>(modeActuel)

  useEffect(() => {
    const miseAJour = () => setMode(modeActuel())
    window.addEventListener(CHANGEMENT, miseAJour)
    return () => window.removeEventListener(CHANGEMENT, miseAJour)
  }, [])

  async function installer() {
    if (!invitation) return
    await invitation.prompt() // la fenêtre du navigateur « Installer Idle Miner ? »
    invitation = null // une invitation ne sert qu'une fois
    setMode(modeActuel())
  }

  return { mode, installer }
}
