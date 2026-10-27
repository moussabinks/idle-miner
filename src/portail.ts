// La version « portail » du jeu (25/10) : pour le publier sur CrazyGames.
//
// On fabrique cette version avec :   VITE_PORTAIL=crazygames npm run build
// Elle diffère de la version Vercel :
//   - pas d'application à installer (pas de service worker ni de carte « Installer ») ;
//   - pas de comptes ni de classement à nous, donc pas de visites (CrazyGames a ses comptes) ;
//   - (27/10) pas de packs de gemmes payants : la boutique dit « Bientôt disponible » ;
//   - (27/10) la sauvegarde passe par le module « Data » du SDK (gardée sur le compte CrazyGames) ;
//   - les publicités récompensées passent par le SDK de CrazyGames (s'il est là), et on lui dit
//     quand le joueur joue ou est dans un menu (gameplayStart / gameplayStop), et les grands
//     moments (happytime).
// Sans SDK (en local, ou sur Vercel), tout reste comme avant : la fausse publicité de 30 s.
// Fabriquer le fichier à envoyer à CrazyGames : npm run build:crazygames (voir docs/crazygames.md).
//
// ⚠️ Les noms des fonctions du SDK (window.CrazyGames.SDK...) sont ceux de la version 3 de leur
// documentation (docs.crazygames.com) : à revérifier au moment de publier.

import { brancherStockage } from './stockage'

export const PORTAIL: 'crazygames' | null = import.meta.env.VITE_PORTAIL === 'crazygames' ? 'crazygames' : null

// Les comptes et le classement en ligne (Supabase) : seulement hors portail.
export const AVEC_COMPTES = PORTAIL === null
// L'application à installer (PWA) : seulement hors portail.
export const AVEC_INSTALLATION = PORTAIL === null
// (27/10, demandé par le propriétaire) Plusieurs mondes (jusqu'à 5) : seulement hors portail. Sur
// CrazyGames, un seul monde, et l'accueil n'a qu'un très gros bouton « Jouer ».
export const AVEC_PLUSIEURS_MONDES = PORTAIL === null
// (27/10) Les packs de gemmes contre de l'argent réel : seulement hors portail (sur CrazyGames,
// la boutique dit « Bientôt disponible » à leur place, en attendant leur système de paiement).
export const AVEC_PACKS = PORTAIL === null

// Le strict nécessaire du SDK de CrazyGames dont on se sert.
type SdkCrazyGames = {
  init: () => Promise<void>
  environment?: string // 'crazygames' (sur leur site), 'local' (sur localhost) ou 'disabled' (ailleurs)
  // (27/10) La sauvegarde : comme le localStorage, mais gardée sur le compte CrazyGames du joueur.
  data?: { getItem: (cle: string) => string | null; setItem: (cle: string, valeur: string) => void; removeItem: (cle: string) => void }
  ad: { requestAd: (type: 'rewarded' | 'midgame', rappels: { adStarted?: () => void; adFinished?: () => void; adError?: (erreur: unknown) => void }) => void }
  game: { gameplayStart: () => void; gameplayStop: () => void; happytime: () => void; loadingStart?: () => void; loadingStop?: () => void }
}

declare global {
  interface Window {
    CrazyGames?: { SDK: SdkCrazyGames }
  }
}

let sdk: SdkCrazyGames | null = null

// Au plus tant de temps d'attente du SDK au démarrage (ms) : au-delà, le jeu démarre sans lui.
const ATTENTE_SDK_MAX = 6000

// Charge le SDK (seulement dans la version portail). Le jeu démarre même si ça échoue.
// main.tsx attend la fin avant de charger le jeu : le SDK prépare la sauvegarde du joueur
// pendant son init, et il faut brancher le stockage dessus avant de lire les mondes.
// (27/10) Après l'attente, le jeu se charge. Si le SDK arrive plus tard, on s'en sert quand même
// (publicités, « le joueur joue »), mais sans changer de stockage : les mondes sont déjà lus.
let attenteFinie = false

export async function initialiserPortail(): Promise<void> {
  if (PORTAIL !== 'crazygames') return
  const tropLong = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('SDK trop long')), ATTENTE_SDK_MAX))
  try {
    await Promise.race([chargerSdk(), tropLong])
  } catch (erreur) {
    // (le SDK peut encore arriver : chargerSdk continue de son côté)
    console.warn('[Mega Digger] SDK CrazyGames pas prêt au démarrage :', erreur)
  }
  attenteFinie = true
}

async function chargerSdk(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('SDK CrazyGames introuvable'))
    document.head.appendChild(script)
  })
  if (!window.CrazyGames) return
  await window.CrazyGames.SDK.init()
  sdk = window.CrazyGames.SDK
  console.info('[Mega Digger] SDK CrazyGames prêt, environnement :', sdk.environment)
  // Hors de CrazyGames (le fichier ouvert sur un autre site), le SDK est « disabled » : on garde
  // le stockage du navigateur. Et on essaie d'abord le module Data : il ne marche que si la case
  // « Le jeu sauvegarde la progression » est cochée sur leur portail (voir docs/crazygames.md).
  if (!attenteFinie && sdk.data && sdk.environment !== 'disabled' && moduleDataMarche(sdk.data)) {
    brancherStockage(sdk.data)
    console.info('[Mega Digger] Sauvegarde : module Data de CrazyGames')
  }
  // (27/10) Le jeu a peut-être déjà dit « le joueur joue » avant que le SDK soit prêt : on le
  // redit maintenant (sinon CrazyGames ne voyait jamais le premier gameplayStart).
  if (etatVoulu === 'jeu') sdk.game.gameplayStart()
}

function moduleDataMarche(data: NonNullable<SdkCrazyGames['data']>): boolean {
  try {
    const essai = '__essai_mega_digger__'
    data.setItem(essai, '1')
    const ok = data.getItem(essai) === '1'
    data.removeItem(essai)
    return ok
  } catch {
    return false
  }
}

// Le SDK est-il là ? (sinon, on montre la fausse publicité)
export function sdkDisponible(): boolean {
  return sdk !== null
}

// Une publicité récompensée par le SDK. « quandFinie » seulement si elle a été vue jusqu'au bout.
export function pubRecompensee(quandFinie: () => void, quandRatee: () => void): void {
  if (!sdk) {
    quandRatee()
    return
  }
  sdk.ad.requestAd('rewarded', { adFinished: quandFinie, adError: quandRatee })
}

// Ce que le jeu a dit en dernier (« le joueur joue » ou « il est dans un menu ») : retenu, pour le
// redire au SDK s'il arrive après.
let etatVoulu: 'jeu' | 'pause' | null = null

export function jeuEnCours(): void {
  if (etatVoulu === 'jeu') return
  etatVoulu = 'jeu'
  if (PORTAIL) console.info('[Mega Digger] gameplayStart', sdk ? '' : '(SDK pas encore prêt : envoyé dès qu’il arrive)')
  sdk?.game.gameplayStart()
}

export function jeuEnPause(): void {
  if (etatVoulu === 'pause' || etatVoulu === null) {
    etatVoulu = 'pause'
    return // (rien à arrêter : le jeu n'avait pas encore commencé, ou c'est déjà dit)
  }
  etatVoulu = 'pause'
  if (PORTAIL) console.info('[Mega Digger] gameplayStop')
  sdk?.game.gameplayStop()
}

export function grandMoment(): void {
  sdk?.game.happytime()
}

// (25/10) Les packs de gemmes contre de l'argent réel. Pas de moyen de paiement à nous (décision
// du propriétaire) : sur CrazyGames, les achats passent par leur boutique (Xsolla, sur
// invitation, seulement pour les joueurs connectés). Tant qu'elle n'est pas ouverte au jeu :
//   - sur le site, les packs se montrent (27/10, demandé par le propriétaire : la boutique doit
//     avoir l'air prête), mais le bouton « Payer » dit « Bientôt disponible » et ne fait rien ;
//   - sur CrazyGames (27/10), pas de packs du tout : « Bientôt disponible » à leur place (AVEC_PACKS) ;
//   - pendant le développement (npm run dev), le paiement est SIMULÉ (aucun argent n'est pris) et
//     donne les gemmes, pour tester la boutique.
export const PAIEMENT_SIMULE = import.meta.env.DEV
