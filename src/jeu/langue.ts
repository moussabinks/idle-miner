// Les langues du jeu (25/10) : le français (la langue dans laquelle le jeu est écrit), l'anglais,
// et (27/10) l'espagnol et le portugais du Brésil (le public de CrazyGames).
//
// Comment ça marche : partout, le texte est écrit en français dans le code, passé dans t() :
//     t('Vends le coffre de la mine')
//     t('Vente : +{gain} $', { gain: nombre(42) })
// En français, t() rend le texte tel quel (en remplaçant les {trous} par leur valeur). Dans une
// autre langue, il cherche la traduction de ce texte dans src/jeu/traductions/ (en.ts, es.ts,
// pt.ts : la phrase française sert de clé). Si elle n'y est pas, on prend l'anglais, sinon le
// français : rien ne casse, il manque juste une traduction (npm run traductions les liste).
//
// Ce fichier ne dépend ni de React ni du navigateur : la logique du jeu (src/jeu) s'en sert aussi
// pour ses messages. L'interface choisit la langue au démarrage (src/langueNavigateur.ts).

import { NOMS_EMPLOYES, NOMS_EMPLOYES_EN } from './donnees'
import { TRADUCTIONS_EN } from './traductions/en'
import { TRADUCTIONS_ES } from './traductions/es'
import { TRADUCTIONS_PT } from './traductions/pt'

export type Langue = 'fr' | 'en' | 'es' | 'pt'
// (25/10) L'anglais d'abord : c'est la langue du jeu par défaut (voir langueNavigateur.ts).
export const LANGUES: Langue[] = ['en', 'fr', 'es', 'pt']
export const NOMS_LANGUES: Record<Langue, string> = { fr: 'Français', en: 'English', es: 'Español', pt: 'Português' }
// Les traductions de chaque langue (le français n'en a pas : c'est la langue du code).
const TRADUCTIONS: Record<Exclude<Langue, 'fr'>, Record<string, string>> = { en: TRADUCTIONS_EN, es: TRADUCTIONS_ES, pt: TRADUCTIONS_PT }
// La façon d'écrire les nombres de chaque langue.
const FORMATS: Record<Langue, string> = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-BR' }

// La langue est-elle une de celles du jeu ? (pour relire un réglage enregistré)
export function estUneLangue(texte: string | null): texte is Langue {
  return texte !== null && (LANGUES as string[]).includes(texte)
}

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

// Le texte dans la langue du joueur. (Hors du français, un prénom d'employé passé dans les {trous}
// devient son prénom anglais : voir nomEmploye. Sauf le {pseudo} d'un joueur (26/10) : un
// joueur qui s'appelle « Noah » ne devient pas « Emma ».)
export function t(texte: string, valeurs?: Record<string, string | number>): string {
  if (langueActuelle === 'fr') return remplir(texte, valeurs)
  const traduites = valeurs && Object.fromEntries(Object.entries(valeurs).map(([cle, v]) => [cle, typeof v === 'string' && cle !== 'pseudo' ? nomEmploye(v) : v]))
  return remplir(TRADUCTIONS[langueActuelle][texte] ?? TRADUCTIONS_EN[texte] ?? texte, traduites)
}

// (25/10) Le prénom d'un employé dans la langue du joueur : la partie garde le prénom français
// (« Noah », ou « Noah 22 » quand tous les prénoms sont pris) ; dans les autres langues, il devient
// le prénom anglais du même rang (NOMS_EMPLOYES_EN, des prénoms connus partout). Un autre texte
// reste tel quel.
export function nomEmploye(nom: string): string {
  if (langueActuelle === 'fr') return nom
  const [prenom, ...reste] = nom.split(' ')
  const rang = NOMS_EMPLOYES.indexOf(prenom)
  if (rang < 0 || (reste.length > 0 && !/^\d+$/.test(reste.join(' ')))) return nom
  return [NOMS_EMPLOYES_EN[rang] ?? prenom, ...reste].join(' ')
}

// Un nombre écrit à la façon de la langue : « 1 250 » en français, « 1,250 » en anglais,
// « 1.250 » en espagnol et en portugais.
export function nombre(n: number, chiffresApresVirgule = 0): string {
  return n.toLocaleString(FORMATS[langueActuelle], { maximumFractionDigits: chiffresApresVirgule })
}

// (25/10) Un prix en euros, à la façon de la langue : « 1,99 € » en français, « €1.99 » en anglais.
export function prixEuros(centimes: number): string {
  return (centimes / 100).toLocaleString(FORMATS[langueActuelle], { style: 'currency', currency: 'EUR' })
}

// (27/10) La façon d'écrire les dates et les nombres de la langue (pour toLocaleString).
export function formatLangue(): string {
  return FORMATS[langueActuelle]
}

// Un nom au pluriel s'il y en a plusieurs : pluriel(3, 'mineur', 'mineurs').
export function pluriel(n: number, un: string, plusieurs: string): string {
  return Math.abs(n) > 1 ? plusieurs : un
}
