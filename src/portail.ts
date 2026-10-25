// La version « portail » du jeu (25/10) : pour le publier sur CrazyGames.
//
// On fabrique cette version avec :   VITE_PORTAIL=crazygames npm run build
// Elle diffère de la version Vercel :
//   - pas d'application à installer (pas de service worker ni de carte « Installer ») ;
//   - pas de comptes ni de classement à nous (CrazyGames a les siens) ;
//   - les publicités récompensées passent par le SDK de CrazyGames (s'il est là), et on lui dit
//     quand le joueur joue ou est dans un menu (gameplayStart / gameplayStop), et les grands
//     moments (happytime).
// Sans SDK (en local, ou sur Vercel), tout reste comme avant : la fausse publicité de 30 s.
//
// ⚠️ Les noms des fonctions du SDK (window.CrazyGames.SDK...) sont ceux de la version 3 de leur
// documentation (docs.crazygames.com) : à revérifier au moment de publier.

export const PORTAIL: 'crazygames' | null = import.meta.env.VITE_PORTAIL === 'crazygames' ? 'crazygames' : null

// Les comptes et le classement en ligne (Supabase) : seulement hors portail.
export const AVEC_COMPTES = PORTAIL === null
// L'application à installer (PWA) : seulement hors portail.
export const AVEC_INSTALLATION = PORTAIL === null

// Le strict nécessaire du SDK de CrazyGames dont on se sert.
type SdkCrazyGames = {
  init: () => Promise<void>
  environment?: string
  ad: { requestAd: (type: 'rewarded' | 'midgame', rappels: { adStarted?: () => void; adFinished?: () => void; adError?: (erreur: unknown) => void }) => void }
  game: { gameplayStart: () => void; gameplayStop: () => void; happytime: () => void; loadingStart?: () => void; loadingStop?: () => void }
}

declare global {
  interface Window {
    CrazyGames?: { SDK: SdkCrazyGames }
  }
}

let sdk: SdkCrazyGames | null = null

// Charge le SDK (seulement dans la version portail). Le jeu démarre même si ça échoue.
export async function initialiserPortail(): Promise<void> {
  if (PORTAIL !== 'crazygames') return
  try {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('SDK CrazyGames introuvable'))
      document.head.appendChild(script)
    })
    if (window.CrazyGames) {
      await window.CrazyGames.SDK.init()
      sdk = window.CrazyGames.SDK
    }
  } catch {
    sdk = null
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

export function jeuEnCours(): void {
  sdk?.game.gameplayStart()
}

export function jeuEnPause(): void {
  sdk?.game.gameplayStop()
}

export function grandMoment(): void {
  sdk?.game.happytime()
}

// (25/10) Les packs de gemmes contre de l'argent réel. Pas de moyen de paiement à nous (décision
// du propriétaire) : sur CrazyGames, les achats passent par leur boutique (Xsolla, sur
// invitation, seulement pour les joueurs connectés). Tant qu'elle n'est pas ouverte au jeu, les
// packs ne se montrent que pendant le développement (npm run dev), avec un paiement SIMULÉ
// (aucun argent n'est pris), pour tester la boutique. En ligne, ils sont cachés.
export const PACKS_VISIBLES = import.meta.env.DEV
