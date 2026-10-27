// Le stockage du navigateur, sans risque (25/10).
//
// Le jeu garde ses parties dans le localStorage. Mais dans certains cas, le navigateur l'interdit
// (navigation privée, jeu ouvert dans une page d'un autre site comme CrazyGames, réglages de
// confidentialité) : rien que LIRE window.localStorage lève alors une erreur, et le jeu ne
// démarrait pas (écran blanc).
// Ici, on essaie une fois : si le localStorage marche, on s'en sert ; sinon, on garde tout en
// mémoire (la partie marche, mais elle sera perdue en fermant la page).
// (27/10) Dans la version CrazyGames, le stockage est ensuite branché sur leur SDK (le module
// « Data », voir src/portail.ts) : la partie est gardée sur le compte CrazyGames du joueur.

import type { Stockage } from './jeu/sauvegarde'

function stockageEnMemoire(): Stockage {
  const donnees = new Map<string, string>()
  return {
    getItem: (cle) => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => {
      donnees.set(cle, valeur)
    },
    removeItem: (cle) => {
      donnees.delete(cle)
    },
  }
}

function choisirStockage(): { stockage: Stockage; persistant: boolean } {
  try {
    const local = window.localStorage
    const essai = '__essai_mega_digger__'
    local.setItem(essai, '1')
    local.removeItem(essai)
    return { stockage: local, persistant: true }
  } catch {
    return { stockage: stockageEnMemoire(), persistant: false }
  }
}

const choix = choisirStockage()

// Là où le jeu range vraiment ses données (le localStorage, la mémoire, ou le SDK de CrazyGames).
let fond: Stockage = choix.stockage

// Le stockage à utiliser partout dans l'interface (au lieu de window.localStorage).
// Il passe tout à « fond », pour qu'on puisse le brancher ailleurs au démarrage.
export const stockage: Stockage = {
  getItem: (cle) => fond.getItem(cle),
  setItem: (cle, valeur) => fond.setItem(cle, valeur),
  removeItem: (cle) => fond.removeItem(cle),
}

// false : les parties ne seront pas gardées après la fermeture de la page (on peut le dire au joueur).
export let stockagePersistant = choix.persistant

// (27/10) Brancher le stockage ailleurs (le module Data du SDK de CrazyGames). À faire avant de
// lire quoi que ce soit : main.tsx attend le SDK avant de charger le jeu.
export function brancherStockage(nouveau: Stockage): void {
  fond = nouveau
  stockagePersistant = true
}

// Lire et écrire une petite valeur (un réglage), sans jamais lever d'erreur.
export function lireReglage(cle: string): string | null {
  try {
    return stockage.getItem(cle)
  } catch {
    return null
  }
}

export function ecrireReglage(cle: string, valeur: string): void {
  try {
    stockage.setItem(cle, valeur)
  } catch {
    // stockage plein : tant pis pour ce réglage
  }
}
