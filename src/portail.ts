// La version « portail » du jeu (25/10) : pour le publier sur CrazyGames.
//
// On fabrique cette version avec :   VITE_PORTAIL=crazygames npm run build
// Elle diffère de la version Vercel :
//   - pas d'application à installer (pas de service worker ni de carte « Installer ») ;
//   - pas de comptes ni de classement à nous, donc pas de visites (CrazyGames a ses comptes) ;
//   - (27/10) pas de packs de gemmes payants : la boutique dit « Bientôt disponible » ;
//   - (27/10) la sauvegarde passe par le module « Data » du SDK (gardée sur le compte CrazyGames) ;
//   - les publicités récompensées passent par le SDK de CrazyGames (s'il est là), et on lui dit
//     quand le joueur joue (gameplayStart, dès qu'il entre dans la partie) ou non (gameplayStop :
//     pendant une publicité, ou revenu à l'accueil ; 27/10), et les grands
//     moments (happytime).
// Sans SDK (en local, ou sur Vercel), tout reste comme avant : la fausse publicité de 30 s.
// Fabriquer le fichier à envoyer à CrazyGames : npm run build:crazygames (voir docs/crazygames.md).
//
// ⚠️ Les noms des fonctions du SDK (window.CrazyGames.SDK...) sont ceux de la version 3 de leur
// documentation (docs.crazygames.com) : à revérifier au moment de publier.
//
// (17/11) Et la version Poki :   npm run build:poki   (VITE_PORTAIL=poki, voir docs/poki.md).
// Les mêmes retraits que pour CrazyGames (pas de comptes, de packs, d'application, d'accueil), et :
//   - le SDK de Poki (v2) : gameLoadingFinished une fois le jeu affiché, gameplayStart au premier
//     geste du joueur (pas au chargement), gameplayStop pendant une publicité ; rewardedBreak pour
//     les publicités récompensées ; pas de sauvegarde en ligne (le stockage du navigateur) ;
//   - sans SDK (bloqueur de pubs) : ni fausse publicité, ni récompense, ni message (Poki s'en charge) ;
//   - aucune interface d'achat de gemmes, et « Continuer » avant « Doubler » au retour d'absence.

import { CLE_MONDES, cleMonde, fusionnerSauvegardes, mondesDeLaCopie, sourcePlusAvancee } from './jeu/sauvegarde'
import { brancherStockage, clesDuJeu, stockageDouble, stockageDuNavigateur } from './stockage'

export const PORTAIL: 'crazygames' | 'poki' | null =
  import.meta.env.VITE_PORTAIL === 'crazygames' ? 'crazygames' : import.meta.env.VITE_PORTAIL === 'poki' ? 'poki' : null

// Les comptes et le classement en ligne (Supabase) : seulement hors portail.
export const AVEC_COMPTES = PORTAIL === null
// L'application à installer (PWA) : seulement hors portail.
export const AVEC_INSTALLATION = PORTAIL === null
// (27/10, demandé par le propriétaire) Plusieurs mondes (jusqu'à 5) : seulement hors portail. Sur
// CrazyGames, un seul monde, et l'accueil n'a qu'un très gros bouton « Jouer ».
export const AVEC_PLUSIEURS_MONDES = PORTAIL === null
// (01/11, CrazyGames) L'écran d'accueil : seulement hors portail. Sur CrazyGames, le joueur arrive
// directement dans sa partie (la moitié des joueurs partaient avant la 1re minute, et chaque
// écran avant le premier bloc en fait partir) : la langue et « Recommencer à zéro » sont dans
// les réglages ⚙️.
export const AVEC_ACCUEIL = PORTAIL === null
// (27/10) Les packs de gemmes contre de l'argent réel : seulement hors portail (sur CrazyGames,
// la boutique dit « Bientôt disponible » à leur place, en attendant leur système de paiement).
export const AVEC_PACKS = PORTAIL === null
// (30/10, demandé par le propriétaire) Compter les visiteurs avec Vercel Web Analytics : seulement
// hors portail (CrazyGames a ses propres chiffres). Voir src/statistiques.ts.
export const AVEC_STATISTIQUES = PORTAIL === null

// Le strict nécessaire du SDK de CrazyGames dont on se sert.
type SdkCrazyGames = {
  init: () => Promise<void>
  environment?: string // 'crazygames' (sur leur site), 'local' (sur localhost) ou 'disabled' (ailleurs)
  // (27/10) La sauvegarde : comme le localStorage, mais gardée sur le compte CrazyGames du joueur.
  data?: { getItem: (cle: string) => string | null; setItem: (cle: string, valeur: string) => void; removeItem: (cle: string) => void }
  ad: { requestAd: (type: 'rewarded' | 'midgame', rappels: { adStarted?: () => void; adFinished?: () => void; adError?: (erreur: unknown) => void }) => void }
  game: { gameplayStart: () => void; gameplayStop: () => void; happytime: () => void; loadingStart?: () => void; loadingStop?: () => void }
}

// (17/11) Le strict nécessaire du SDK de Poki (v2, developers.poki.com, « PokiSDK: HTML5 »).
type SdkPoki = {
  init: () => Promise<void>
  gameLoadingFinished: () => void
  gameplayStart: () => void
  gameplayStop: () => void
  // La promesse dit si la publicité a été vue jusqu'au bout (sinon : pas de récompense).
  rewardedBreak: (quandElleCommence?: () => void) => Promise<boolean>
}

declare global {
  interface Window {
    CrazyGames?: { SDK: SdkCrazyGames }
    PokiSDK?: SdkPoki
  }
}

let sdk: SdkCrazyGames | null = null
let poki: SdkPoki | null = null

// Au plus tant de temps d'attente du SDK au démarrage (ms) : au-delà, le jeu démarre sans lui.
const ATTENTE_SDK_MAX = 6000

// Charge le SDK (seulement dans la version portail). Le jeu démarre même si ça échoue.
// main.tsx attend la fin avant de charger le jeu : le SDK prépare la sauvegarde du joueur
// pendant son init, et il faut brancher le stockage dessus avant de lire les mondes.
// (27/10) Après l'attente, le jeu se charge. Si le SDK arrive plus tard, on s'en sert quand même
// (publicités, « le joueur joue »), mais sans changer de stockage : les mondes sont déjà lus.
let attenteFinie = false

export async function initialiserPortail(): Promise<void> {
  if (PORTAIL === 'poki') {
    await initialiserPoki()
    return
  }
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
  if (sdk.data && sdk.environment !== 'disabled' && moduleDataMarche(sdk.data)) brancherModuleData(sdk.data)
  // (27/10) Le jeu a peut-être déjà dit « le joueur joue » avant que le SDK soit prêt : on le
  // redit maintenant (sinon CrazyGames ne voyait jamais le premier gameplayStart).
  if (etatVoulu === 'jeu') sdk.game.gameplayStart()
}

// (01/11) Brancher la sauvegarde sur le module Data, sans jamais perdre la partie du navigateur.
// Avant, si le SDK arrivait après l'attente, la partie du jour restait dans le navigateur ; le
// lendemain, le SDK (rapide cette fois) lisait le module Data, vide : le joueur repartait de zéro.
// Maintenant :
//   - on recopie dans le module Data les parties du navigateur plus avancées que les siennes ;
//   - puis on écrit dans les deux (le navigateur garde une copie à jour pour la prochaine fois).
// SDK en retard (la partie est déjà lancée depuis le navigateur) : on ne branche que si le module
// Data n'a rien de plus avancé (sinon, la partie en cours, moins avancée, l'écraserait : il la
// retrouvera à la prochaine visite).
function brancherModuleData(data: NonNullable<SdkCrazyGames['data']>): void {
  const navigateur = stockageDuNavigateur()
  if (navigateur === null) {
    if (!attenteFinie) brancherStockage(data)
    return
  }
  const cles = clesDuJeu()
  if (attenteFinie && sourcePlusAvancee(navigateur, data, [...cles, ...mondesDeLaCopie({ [CLE_MONDES]: data.getItem(CLE_MONDES) ?? '[]' }).map((m) => cleMonde(m.id))])) {
    console.info('[Mega Digger] SDK en retard : le module Data a une partie plus avancée, gardée pour la prochaine visite')
    return
  }
  const recopiees = fusionnerSauvegardes(data, navigateur, cles)
  brancherStockage(stockageDouble(data, navigateur))
  console.info('[Mega Digger] Sauvegarde : module Data de CrazyGames', recopiees > 0 ? `(${recopiees} clés recopiées du navigateur)` : '')
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

// --- (17/11) Poki ---

// Le joueur a-t-il déjà touché le jeu ? Poki veut le premier gameplayStart au premier geste, pas
// au chargement.
let premierGeste = false
// Ce qu'on a dit à Poki en dernier : il refuse deux « start » ou deux « stop » de suite.
let ditAPoki: 'jeu' | 'pause' = 'pause'

async function initialiserPoki(): Promise<void> {
  const premier = () => {
    premierGeste = true
    window.removeEventListener('pointerdown', premier, true)
    window.removeEventListener('keydown', premier, true)
    direAPoki()
  }
  window.addEventListener('pointerdown', premier, true)
  window.addEventListener('keydown', premier, true)
  empecherDefilementDeLaPage()
  const tropLong = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('SDK trop long')), ATTENTE_SDK_MAX))
  try {
    await Promise.race([chargerPoki(), tropLong])
  } catch (erreur) {
    // Sans SDK (bloqueur de pubs), le jeu marche quand même, sans publicités.
    console.warn('[Mega Digger] SDK Poki pas prêt au démarrage :', erreur)
  }
}

async function chargerPoki(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('SDK Poki introuvable'))
    document.head.appendChild(script)
  })
  if (!window.PokiSDK) return
  // (Poki : continuer le jeu même si init échoue ; on n'utilise alors pas le SDK)
  await window.PokiSDK.init()
  poki = window.PokiSDK
  console.info('[Mega Digger] SDK Poki prêt')
  if (chargementTermine) poki.gameLoadingFinished()
  direAPoki()
}

// (17/11) Règle de Poki : les flèches, Espace et la molette ne doivent jamais faire défiler la page
// qui contient le jeu. On les bloque, sauf là où elles servent : Espace sur un bouton ou dans un
// champ, la molette dans une fenêtre qui défile (la carte, elle, gère sa molette elle-même).
function empecherDefilementDeLaPage(): void {
  const FLECHES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  window.addEventListener('keydown', (e) => {
    const cible = e.target instanceof Element ? e.target : null
    if (cible?.closest('input, textarea, select')) return
    if (FLECHES.includes(e.key) || (e.key === ' ' && !cible?.closest('button'))) e.preventDefault()
  })
  window.addEventListener(
    'wheel',
    (e) => {
      let element = e.target instanceof Element ? e.target : null
      while (element && element !== document.body) {
        const style = getComputedStyle(element)
        if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) return
        element = element.parentElement
      }
      e.preventDefault()
    },
    { passive: false },
  )
  document.documentElement.style.overscrollBehavior = 'none'
}

// Dire à Poki ce que fait le joueur, seulement si ça a changé (et pas avant son premier geste).
function direAPoki(): void {
  if (!poki) return
  const voulu = etatVoulu === 'jeu' && premierGeste ? 'jeu' : 'pause'
  if (voulu === ditAPoki) return
  ditAPoki = voulu
  console.info('[Mega Digger] Poki :', voulu === 'jeu' ? 'gameplayStart' : 'gameplayStop')
  if (voulu === 'jeu') poki.gameplayStart()
  else poki.gameplayStop()
}

// (17/11) Le jeu est affiché : la fin du chargement (Poki s'en sert pour mesurer combien de
// visiteurs se mettent à jouer).
let chargementTermine = false
export function chargementFini(): void {
  if (chargementTermine) return
  chargementTermine = true
  poki?.gameLoadingFinished()
}

// Le SDK est-il là ? (sinon, on montre la fausse publicité)
export function sdkDisponible(): boolean {
  return sdk !== null || poki !== null
}

// (17/11) Sur Poki sans SDK (bloqueur de pubs) : pas de fausse publicité, pas de récompense, et
// pas de message (Poki affiche le sien).
export const SANS_FAUSSE_PUB = PORTAIL === 'poki'

// Une publicité récompensée par le SDK. « quandFinie » seulement si elle a été vue jusqu'au bout.
export function pubRecompensee(quandFinie: () => void, quandRatee: () => void): void {
  if (poki) {
    poki.rewardedBreak().then(
      (vue) => (vue ? quandFinie() : quandRatee()),
      () => quandRatee(),
    )
    return
  }
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
  if (PORTAIL === 'poki') {
    direAPoki()
    return
  }
  if (PORTAIL) console.info('[Mega Digger] gameplayStart', sdk ? '' : '(SDK pas encore prêt : envoyé dès qu’il arrive)')
  sdk?.game.gameplayStart()
}

export function jeuEnPause(): void {
  if (etatVoulu === 'pause' || etatVoulu === null) {
    etatVoulu = 'pause'
    return // (rien à arrêter : le jeu n'avait pas encore commencé, ou c'est déjà dit)
  }
  etatVoulu = 'pause'
  if (PORTAIL === 'poki') {
    direAPoki()
    return
  }
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
