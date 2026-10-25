// Les langues du jeu (25/10) : le français (la langue dans laquelle le jeu est écrit) et l'anglais.
//
// Comment ça marche : partout, le texte est écrit en français dans le code, passé dans t() :
//     t('Vends le coffre de la mine')
//     t('Vente : +{gain} $', { gain: nombre(42) })
// En français, t() rend le texte tel quel (en remplaçant les {trous} par leur valeur). En anglais,
// il cherche la traduction de ce texte dans src/jeu/traductions/en.ts (la phrase française sert
// de clé). Si elle n'y est pas, le texte reste en français : rien ne casse, il manque juste une
// traduction (le test langue.test.ts liste celles qui manquent).
//
// Ce fichier ne dépend ni de React ni du navigateur : la logique du jeu (src/jeu) s'en sert aussi
// pour ses messages. L'interface choisit la langue au démarrage (src/langueNavigateur.ts).

import { TRADUCTIONS_EN } from './traductions/en'

export type Langue = 'fr' | 'en'
export const LANGUES: Langue[] = ['fr', 'en']
export const NOMS_LANGUES: Record<Langue, string> = { fr: 'Français', en: 'English' }

let langueActuelle: Langue = 'fr'

export function langue(): Langue {
  return langueActuelle
}

export function changerLangue(nouvelle: Langue): void {
  langueActuelle = nouvelle
}

// Remplace les {trous} d'un texte par leurs valeurs.
function remplir(texte: string, valeurs?: Record<string, string | number>): string {
  if (!valeurs) return texte
  return texte.replace(/\{(\w+)\}/g, (tout, nom: string) => (nom in valeurs ? String(valeurs[nom]) : tout))
}

// Le texte dans la langue du joueur.
export function t(texte: string, valeurs?: Record<string, string | number>): string {
  if (langueActuelle === 'fr') return remplir(texte, valeurs)
  return remplir(TRADUCTIONS_EN[texte] ?? texte, valeurs)
}

// Un nombre écrit à la façon de la langue : « 1 250 » en français, « 1,250 » en anglais.
export function nombre(n: number, chiffresApresVirgule = 0): string {
  return n.toLocaleString(langueActuelle === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: chiffresApresVirgule })
}

// Un nom au pluriel s'il y en a plusieurs : pluriel(3, 'mineur', 'mineurs').
export function pluriel(n: number, un: string, plusieurs: string): string {
  return Math.abs(n) > 1 ? plusieurs : un
}
