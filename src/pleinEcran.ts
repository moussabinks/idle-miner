// Le plein écran sur téléphone (28/10, demandé par le propriétaire).
//
// Sur un téléphone, la barre d'adresse du navigateur et la barre du système mangent une bonne part
// de l'écran couché (souvent 50 à 80 px sur 390). Comme les jeux mobiles, on passe le jeu en plein
// écran dès le premier toucher, puis on verrouille l'écran à l'horizontale (le jeu se joue couché).
//
// - Au doigt seulement (pointer: coarse) : sur un ordinateur, rien ne change.
// - Le navigateur n'accepte le plein écran qu'en réponse à un geste du joueur : on attend donc son
//   premier toucher (n'importe où). Si le joueur en sort (geste du système, bouton retour), on ne le
//   force pas : le bouton des réglages (⛶) le remet.
// - Pas sur CrazyGames : leur page gère elle-même le plein écran du cadre.
// - Sur iPhone, Safari ne sait pas mettre une page en plein écran : on n'affiche pas le bouton
//   (l'appli installée sur l'écran d'accueil, elle, est déjà en plein écran).
// Toutes les erreurs sont avalées : au pire, le jeu reste comme avant.

import { PORTAIL } from './portail'

type ElementPleinEcran = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type DocumentPleinEcran = Document & {
  webkitFullscreenElement?: Element | null
  webkitFullscreenEnabled?: boolean
  webkitExitFullscreen?: () => Promise<void> | void
}
type OrientationVerrouillable = ScreenOrientation & { lock?: (orientation: string) => Promise<void> }

const doc = () => document as DocumentPleinEcran

// Le navigateur sait-il mettre la page en plein écran ? (Jamais sur CrazyGames : leur page a
// son propre bouton, on n'en montre pas un deuxième.)
export function pleinEcranPossible(): boolean {
  if (PORTAIL !== null || typeof document === 'undefined') return false
  return doc().fullscreenEnabled === true || doc().webkitFullscreenEnabled === true
}

export function estEnPleinEcran(): boolean {
  return (doc().fullscreenElement ?? doc().webkitFullscreenElement ?? null) !== null
}

// Un écran tactile (téléphone, tablette).
function auDoigt(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

// Verrouiller l'écran à l'horizontale (Android, seulement en plein écran).
function verrouillerPaysage(): void {
  try {
    const orientation = screen.orientation as OrientationVerrouillable | undefined
    orientation?.lock?.('landscape')?.catch(() => {})
  } catch {
    // pas de verrou : le message « Tourne ton téléphone » reste là
  }
}

// Passer en plein écran (à appeler pendant un geste du joueur).
export async function entrerPleinEcran(): Promise<void> {
  if (!pleinEcranPossible() || estEnPleinEcran()) return
  try {
    const racine = document.documentElement as ElementPleinEcran
    if (racine.requestFullscreen) await racine.requestFullscreen({ navigationUI: 'hide' })
    else await racine.webkitRequestFullscreen?.()
    if (auDoigt()) verrouillerPaysage()
  } catch {
    // refusé (cadre d'un autre site, réglage du navigateur) : tant pis
  }
}

export async function sortirPleinEcran(): Promise<void> {
  if (!estEnPleinEcran()) return
  try {
    if (document.exitFullscreen) await document.exitFullscreen()
    else await doc().webkitExitFullscreen?.()
  } catch {
    // rien à faire
  }
}

export function basculerPleinEcran(): void {
  void (estEnPleinEcran() ? sortirPleinEcran() : entrerPleinEcran())
}

// Prévenir quand on entre ou sort du plein écran (pour le bouton des réglages).
export function surChangementPleinEcran(rappel: () => void): () => void {
  document.addEventListener('fullscreenchange', rappel)
  document.addEventListener('webkitfullscreenchange', rappel)
  return () => {
    document.removeEventListener('fullscreenchange', rappel)
    document.removeEventListener('webkitfullscreenchange', rappel)
  }
}

// Au démarrage : sur téléphone, le premier toucher met le jeu en plein écran (une seule fois).
export function initialiserPleinEcran(): void {
  if (!pleinEcranPossible()) return
  const auPremierToucher = () => {
    if (!auDoigt()) return
    window.removeEventListener('pointerup', auPremierToucher, true)
    void entrerPleinEcran()
  }
  // « pointerup » : le navigateur compte le relâcher du doigt comme un geste du joueur.
  window.addEventListener('pointerup', auPremierToucher, true)
}
