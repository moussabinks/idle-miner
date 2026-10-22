// Sauvegarde des parties dans le navigateur (localStorage).
// Il peut y avoir jusqu'à 5 « mondes » : 5 parties séparées (une save avancée pour tester,
// une save de début de partie, celle d'un ami...). On les choisit sur l'écran d'accueil.
//
// On passe le « stockage » en paramètre : en jeu c'est window.localStorage,
// dans les tests c'est un faux stockage en mémoire.

import { VERSION_ETAT, VERSION_MINE_AUTOMATIQUE, nouveauTrajet, type EtatJeu } from './mineur'
import { railsMineMarche, type Village } from './village'

export const NB_MONDES_MAX = 5

// La liste des mondes (leurs noms et dates), et une clé par monde pour sa partie.
export const CLE_MONDES = 'idle-miner-mondes'
export const cleMonde = (id: string) => `idle-miner-monde-${id}`
// L'heure de la dernière sauvegarde, pour faire travailler la foreuse pendant l'absence du joueur.
const cleHorodatage = (id: string) => `idle-miner-monde-${id}-horodatage`

// Les anciennes clés, quand il n'y avait qu'une seule partie (avant le 19/10).
export const ANCIENNE_CLE_SAUVEGARDE = 'idle-miner-sauvegarde'
const ANCIENNE_CLE_HORODATAGE = 'idle-miner-horodatage'

// Le strict nécessaire de l'API localStorage.
export type Stockage = {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

export type InfoMonde = {
  id: string
  nom: string
  couleur: number // numéro de la couleur de sa carte (0 à 4), pour le reconnaître d'un coup d'œil
  creeLe: number // dates en millisecondes (Date.now())
  joueLe: number
}

// ---------------------------------------------------------------------------
// La liste des mondes
// ---------------------------------------------------------------------------

function lireListe(stockage: Stockage): InfoMonde[] | null {
  try {
    const texte = stockage.getItem(CLE_MONDES)
    if (texte === null) return null
    const liste = JSON.parse(texte)
    return Array.isArray(liste) ? (liste as InfoMonde[]) : null
  } catch {
    return null
  }
}

function ecrireListe(stockage: Stockage, liste: InfoMonde[]): void {
  try {
    stockage.setItem(CLE_MONDES, JSON.stringify(liste))
  } catch {
    // Stockage plein ou interdit : tant pis.
  }
}

// Les mondes, du plus récemment joué au plus ancien. La première fois, l'ancienne
// partie unique (s'il y en a une) devient « Monde 1 ».
export function listerMondes(stockage: Stockage, maintenant = Date.now()): InfoMonde[] {
  let liste = lireListe(stockage)
  if (liste === null) {
    liste = []
    try {
      const ancienne = stockage.getItem(ANCIENNE_CLE_SAUVEGARDE)
      if (ancienne !== null) {
        stockage.setItem(cleMonde('1'), ancienne)
        const horodatage = stockage.getItem(ANCIENNE_CLE_HORODATAGE)
        if (horodatage !== null) stockage.setItem(cleHorodatage('1'), horodatage)
        stockage.removeItem(ANCIENNE_CLE_SAUVEGARDE)
        stockage.removeItem(ANCIENNE_CLE_HORODATAGE)
        const date = Number(horodatage) || maintenant
        liste.push({ id: '1', nom: 'Monde 1', couleur: 0, creeLe: date, joueLe: date })
      }
    } catch {
      // Rien à reprendre.
    }
    ecrireListe(stockage, liste)
  }
  return [...liste].sort((a, b) => b.joueLe - a.joueLe)
}

export function peutCreerMonde(stockage: Stockage): boolean {
  return listerMondes(stockage).length < NB_MONDES_MAX
}

// Un nouvel identifiant (« 1 », « 2 »...) et la première couleur libre.
function nouvelleInfo(liste: InfoMonde[], nom: string, maintenant: number): InfoMonde {
  const id = String(Math.max(0, ...liste.map((m) => Number(m.id) || 0)) + 1)
  const couleursPrises = liste.map((m) => m.couleur)
  const couleur = [0, 1, 2, 3, 4].find((c) => !couleursPrises.includes(c)) ?? 0
  return { id, nom: nom.trim() || `Monde ${id}`, couleur, creeLe: maintenant, joueLe: maintenant }
}

// Crée un monde avec cette partie. Renvoie null s'il y en a déjà 5.
export function creerMonde(stockage: Stockage, nom: string, etat: EtatJeu, maintenant = Date.now()): InfoMonde | null {
  const liste = listerMondes(stockage, maintenant)
  if (liste.length >= NB_MONDES_MAX) return null
  const info = nouvelleInfo(liste, nom, maintenant)
  ecrireListe(stockage, [...liste, info])
  sauvegarder(stockage, info.id, etat, maintenant)
  return info
}

export function renommerMonde(stockage: Stockage, id: string, nom: string): void {
  const nomPropre = nom.trim()
  if (nomPropre === '') return
  const liste = listerMondes(stockage).map((m) => (m.id === id ? { ...m, nom: nomPropre } : m))
  ecrireListe(stockage, liste)
}

// Copie un monde (pratique pour garder une save avancée intacte avant un test).
export function dupliquerMonde(stockage: Stockage, id: string, maintenant = Date.now()): InfoMonde | null {
  const original = listerMondes(stockage).find((m) => m.id === id)
  const etat = charger(stockage, id)
  if (!original || etat === null) return null
  return creerMonde(stockage, `${original.nom} (copie)`, etat, maintenant)
}

export function supprimerMonde(stockage: Stockage, id: string): void {
  ecrireListe(stockage, listerMondes(stockage).filter((m) => m.id !== id))
  try {
    stockage.removeItem(cleMonde(id))
    stockage.removeItem(cleHorodatage(id))
  } catch {
    // Rien à faire.
  }
}

// ---------------------------------------------------------------------------
// Tous les mondes d'un coup (pour la sauvegarde en ligne)
// ---------------------------------------------------------------------------

// Une copie brute de tous les mondes du navigateur : clé du localStorage -> texte.
// On l'envoie telle quelle en ligne, et on la remet telle quelle sur un autre appareil.
export type SauvegardeComplete = Record<string, string>

export function exporterTout(stockage: Stockage): SauvegardeComplete {
  const copie: SauvegardeComplete = {}
  try {
    const liste = stockage.getItem(CLE_MONDES)
    if (liste === null) return copie
    copie[CLE_MONDES] = liste
    for (const monde of listerMondes(stockage)) {
      for (const cle of [cleMonde(monde.id), cleHorodatage(monde.id)]) {
        const texte = stockage.getItem(cle)
        if (texte !== null) copie[cle] = texte
      }
    }
  } catch {
    // Stockage interdit : on renvoie ce qu'on a pu lire.
  }
  return copie
}

// Remplace tous les mondes du navigateur par ceux de la copie.
export function importerTout(stockage: Stockage, copie: SauvegardeComplete): void {
  for (const monde of listerMondes(stockage)) supprimerMonde(stockage, monde.id)
  try {
    // Par prudence, on n'écrit que des clés de mondes (pas les réglages du son, par exemple).
    for (const [cle, texte] of Object.entries(copie)) {
      if (cle.startsWith('idle-miner-monde')) stockage.setItem(cle, texte)
    }
  } catch {
    // Stockage plein ou interdit : tant pis.
  }
}

// Les mondes rangés dans une copie (liste vide si elle n'en a pas ou si elle est abîmée).
export function mondesDeLaCopie(copie: SauvegardeComplete): InfoMonde[] {
  try {
    const liste = JSON.parse(copie[CLE_MONDES] ?? '[]')
    return Array.isArray(liste) ? (liste as InfoMonde[]) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// La partie d'un monde
// ---------------------------------------------------------------------------

export function sauvegarder(stockage: Stockage, id: string, etat: EtatJeu, maintenant = Date.now()): void {
  try {
    stockage.setItem(cleMonde(id), JSON.stringify(etat))
    stockage.setItem(cleHorodatage(id), String(maintenant))
  } catch {
    // Stockage plein ou interdit (navigation privée) : tant pis, on continue sans sauvegarde.
  }
}

// Note que le monde vient d'être joué (il remonte en tête de liste).
export function marquerJoue(stockage: Stockage, id: string, maintenant = Date.now()): void {
  const liste = lireListe(stockage)
  if (liste === null) return
  ecrireListe(stockage, liste.map((m) => (m.id === id ? { ...m, joueLe: maintenant } : m)))
}

// Renvoie la partie d'un monde, ou null s'il n'y en a pas (ou si elle est abîmée).
export function charger(stockage: Stockage, id: string): EtatJeu | null {
  try {
    const texte = stockage.getItem(cleMonde(id))
    if (texte === null) return null
    // Avec la mine automatique (version 21, le 22/10), toutes les parties d'avant repartent de
    // zéro (plus de prestige ni de profondeur) : une partie plus ancienne renvoie null.
    const donnees: unknown = JSON.parse(texte)
    const convertie = convertirVersion21(donnees)
    return estUnEtatValide(convertie) ? convertie : null
  } catch {
    return null
  }
}

// Ce monde a-t-il une partie d'une ancienne version (avant la mine automatique) ?
// L'accueil prévient alors qu'elle repart de zéro.
export function partieAncienne(stockage: Stockage, id: string): boolean {
  try {
    const texte = stockage.getItem(cleMonde(id))
    if (texte === null) return false
    const donnees = JSON.parse(texte) as { version?: unknown }
    return typeof donnees.version === 'number' && donnees.version < VERSION_MINE_AUTOMATIQUE
  } catch {
    return false
  }
}

// Nombre de secondes écoulées depuis la dernière sauvegarde de ce monde (0 si on ne sait pas).
export function secondesDepuisSauvegarde(stockage: Stockage, id: string, maintenant = Date.now()): number {
  try {
    const horodatage = Number(stockage.getItem(cleHorodatage(id)))
    if (!Number.isFinite(horodatage) || horodatage <= 0) return 0
    return Math.max(0, (maintenant - horodatage) / 1000)
  } catch {
    return 0
  }
}

// Une partie de la version 21 (avant les trajets, le 24/10) : son wagonnet unique devient le
// trajet Mine → Marché (s'il avait sa ligne de rails), et sa taille vaut pour tous les wagonnets.
export function convertirVersion21(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as { version?: unknown; wagonnet?: { niveau?: number }; village?: Village; employes?: { etape: string }[] }
  if (ancienne.version !== VERSION_MINE_AUTOMATIQUE || typeof ancienne.village !== 'object') return donnees
  const { wagonnet, ...reste } = ancienne
  const avecLigne = Array.isArray(ancienne.village.rails) && Array.isArray(ancienne.village.batiments) && railsMineMarche(ancienne.village) !== null
  // Les pousseurs qui étaient en route retournent au quai (le wagonnet repart du quai).
  for (const employe of ancienne.employes ?? []) if (employe.etape === 'pousse') employe.etape = 'quai'
  return {
    ...reste,
    version: VERSION_ETAT,
    niveauWagonnets: typeof wagonnet?.niveau === 'number' ? wagonnet.niveau : 0,
    trajets: avecLigne ? [nouveauTrajet('mine-marche')] : [],
  }
}

// Vérifie rapidement que les données ressemblent bien à une partie de cette version.
function estUnEtatValide(donnees: unknown): donnees is EtatJeu {
  if (typeof donnees !== 'object' || donnees === null) return false
  const etat = donnees as Partial<EtatJeu>
  return (
    etat.version === VERSION_ETAT &&
    typeof etat.argent === 'number' &&
    typeof etat.niveauMine === 'number' &&
    typeof etat.coffre === 'object' &&
    typeof etat.pioches === 'object' &&
    typeof etat.inventaire === 'object' &&
    typeof etat.stats === 'object' &&
    Array.isArray(etat.succes) &&
    Array.isArray(etat.nonAVendre) &&
    typeof etat.ascenseur === 'object' &&
    typeof etat.foreuse === 'object' &&
    typeof etat.generateur === 'object' &&
    typeof etat.niveauWagonnets === 'number' &&
    Array.isArray(etat.trajets) &&
    Array.isArray(etat.employes) &&
    typeof etat.recruteur === 'number' &&
    typeof etat.manager === 'object' &&
    typeof etat.tresorerie === 'number' &&
    Array.isArray(etat.decouvertes) &&
    typeof etat.village === 'object' &&
    Array.isArray(etat.village?.batiments) &&
    typeof etat.tenue === 'object' &&
    Array.isArray(etat.tenuesAchetees)
  )
}
