// Le stockage du navigateur, sans risque (25/10).
//
// Le jeu garde ses parties dans le localStorage. Mais dans certains cas, le navigateur l'interdit
// (navigation privée, jeu ouvert dans une page d'un autre site comme CrazyGames, réglages de
// confidentialité) : rien que LIRE window.localStorage lève alors une erreur, et le jeu ne
// démarrait pas (écran blanc).
// Ici, on essaie une fois : si le localStorage marche, on s'en sert ; sinon, on garde tout en
// mémoire (la partie marche, mais elle sera perdue en fermant la page).
// Plus tard, la version CrazyGames pourra remplacer ce stockage par celui de leur SDK.

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

// Le stockage à utiliser partout dans l'interface (au lieu de window.localStorage).
export const stockage: Stockage = choix.stockage

// false : les parties ne seront pas gardées après la fermeture de la page (on peut le dire au joueur).
export const stockagePersistant = choix.persistant

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
