// Sauvegarde des parties dans le navigateur (localStorage).
// Il peut y avoir jusqu'à 5 « mondes » : 5 parties séparées (une save avancée pour tester,
// une save de début de partie, celle d'un ami...). On les choisit sur l'écran d'accueil.
//
// On passe le « stockage » en paramètre : en jeu c'est window.localStorage,
// dans les tests c'est un faux stockage en mémoire.

import { VERSION_ETAT, type EtatJeu } from './mineur'
import { TALENTS_RETIRES } from './talents'

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
    const donnees = migrer(JSON.parse(texte))
    return estUnEtatValide(donnees) ? donnees : null
  } catch {
    return null
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

// Met à jour une sauvegarde d'une ancienne version du jeu, version par version.
function migrer(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  let etat = donnees as Record<string, unknown>

  // Version 1 -> 2 : la surface, l'échelle, le marché et l'ascenseur.
  // L'ancien joueur reprend au fond de la mine, là où il était.
  if (etat.version === 1) {
    etat = {
      ...etat,
      version: 2,
      lieu: 'mine',
      trajet: null,
      colonneMineur: 0,
      nonAVendre: [],
      ascenseur: { possede: false, chargement: {}, tempsRestant: 0, tempsTotal: 0 },
    }
  }

  // Version 2 -> 3 : la mine descend à -128 m, on se déplace sur l'échelle,
  // l'ascenseur a des niveaux et la foreuse arrive.
  if (etat.version === 2) {
    const profondeur = etat.profondeur as number
    // Le premier mètre est maintenant l'entrée du puits : on ne peut pas reprendre à -1 m.
    if (profondeur < 2) return null
    const ascenseur = etat.ascenseur as { possede: boolean }
    const position = etat.lieu === 'surface' ? 0 : profondeur - 1
    etat = {
      ...etat,
      version: 3,
      position,
      cible: position,
      ascenseur: { niveau: ascenseur.possede ? 1 : 0, chargement: {}, tempsRestant: 0, tempsTotal: 0 },
      foreuse: { active: false, carburant: 0, niveauVitesse: 0, niveauChariot: 0, chariot: {}, profondeur: 1, progression: 0, blocsFores: 0 },
    }
    delete etat.lieu
    delete etat.trajet
  }

  // Version 3 -> 4 : l'assistant (Emmanuel Macron), pas encore embauché.
  if (etat.version === 3) {
    etat = { ...etat, version: 4, assistant: { embauche: false, colonne: 5 } }
  }

  // Version 4 -> 5 : couches de 10 blocs, ascenseur qui emmène le mineur, épée et donjons,
  // et on peut continuer de creuser à la bedrock.
  if (etat.version === 4) {
    const largeur = 10
    let profondeur = etat.profondeur as number
    let coucheActuelle = etat.coucheActuelle as (string | null)[]
    let couchesDessous = etat.couchesDessous as string[][]
    let position = etat.position as number
    let cible = etat.cible as number
    let enGalerie = etat.enGalerie as boolean

    // Les couches passent de 6 à 10 blocs : on complète en répétant leurs blocs.
    const elargir = <T,>(couche: T[], remplissage: (i: number) => T): T[] =>
      couche.length === 0 ? couche : Array.from({ length: largeur }, (_, i) => (i < couche.length ? couche[i] : remplissage(i)))
    coucheActuelle = elargir(coucheActuelle, () => null)
    couchesDessous = couchesDessous.map((couche) => elargir(couche, (i) => couche[i % couche.length]))

    // Avant, la partie s'arrêtait sur la bedrock (-128 m) : on remonte d'un mètre pour continuer.
    if (profondeur >= 128) {
      profondeur = 127
      coucheActuelle = Array(largeur).fill('deepslate')
      couchesDessous = [[], [], [], []]
      enGalerie = true
      position = Math.min(position, profondeur - 1)
      cible = Math.min(cible, profondeur - 1)
    }

    const ancienAscenseur = etat.ascenseur as { niveau: number }
    const stats = etat.stats as Record<string, unknown>
    etat = {
      ...etat,
      version: 5,
      profondeur,
      coucheActuelle,
      couchesDessous,
      position,
      cible,
      enGalerie,
      colonneMineur: Math.min(etat.colonneMineur as number, largeur - 1),
      assistant: { ...(etat.assistant as object), colonne: largeur - 1 },
      ascenseur: {
        niveau: ancienAscenseur.niveau,
        position: profondeur - 1, // la cabine attend au front de taille
        cible: profondeur - 1,
        chargement: {},
        passager: false,
        retourAuFront: false,
        quai: {},
        garder: [],
      },
      epee: false,
      stats: { ...stats, monstresVaincus: 0 },
    }
  }

  // Version 5 -> 6 : plus de donjons, d'épée ni d'assistant (retirés le 19/10),
  // et l'arbre de prestige arrive (les prestiges déjà passés donnent leurs points).
  if (etat.version === 5) {
    // Un ancien donjon redevient un bloc de roche ordinaire (deepslate sous -80 m).
    const profondeur = etat.profondeur as number
    const sansDonjon = (bloc: string | null, prof: number) => (bloc === 'donjon' ? (prof > 80 ? 'deepslate' : 'pierre') : bloc)
    const stats = { ...(etat.stats as Record<string, unknown>) }
    delete stats.monstresVaincus
    etat = {
      ...etat,
      version: 6,
      coucheActuelle: (etat.coucheActuelle as (string | null)[]).map((bloc) => sansDonjon(bloc, profondeur)),
      couchesDessous: (etat.couchesDessous as string[][]).map((couche, i) => couche.map((bloc) => sansDonjon(bloc, profondeur + 1 + i))),
      succes: (etat.succes as string[]).filter((id) => id !== 'monstre'),
      stats,
      talents: [],
      peculeRecu: true,
    }
    delete etat.assistant
    delete etat.epee
  }

  // Version 6 -> 7 : envoi par l'ascenseur depuis le sac, inventaire à cocher et
  // recharge automatique de la foreuse.
  if (etat.version === 6) {
    etat = {
      ...etat,
      version: 7,
      ascenseur: { ...(etat.ascenseur as object), envoiDemande: false, envoiAuto: false },
      foreuse: { ...(etat.foreuse as object), nonCoches: [], rechargeAuto: false },
    }
  }

  // Version 7 -> 8 : le mineur marche jusqu'au puits avant de monter.
  if (etat.version === 7) etat = { ...etat, version: 8, depart: null }

  // Version 8 -> 9 : on choisit les quantités à envoyer par l'ascenseur.
  if (etat.version === 8) {
    etat = { ...etat, version: 9, ascenseur: { ...(etat.ascenseur as object), lotDemande: null } }
  }

  // Version 9 -> 10 : mineurs employés, plusieurs foreuses, et deux talents retirés
  // (« Ascenseur offert » et « Grimpeur agile ») : leurs points sont rendus.
  if (etat.version === 9) {
    etat = {
      ...etat,
      version: 10,
      employes: [],
      foreuse: { ...(etat.foreuse as object), nombre: 1 },
      talents: (etat.talents as string[]).filter((id) => !TALENTS_RETIRES.includes(id)),
    }
  }

  // Les torches ont été retirées du jeu (16/10) : on oublie les anciens champs.
  delete etat.torches
  delete etat.torchesPosees

  return etat
}

// Vérifie rapidement que les données ressemblent bien à une partie de cette version.
function estUnEtatValide(donnees: unknown): donnees is EtatJeu {
  if (typeof donnees !== 'object' || donnees === null) return false
  const etat = donnees as Partial<EtatJeu>
  return (
    etat.version === VERSION_ETAT &&
    typeof etat.argent === 'number' &&
    typeof etat.profondeur === 'number' &&
    Array.isArray(etat.coucheActuelle) &&
    Array.isArray(etat.couchesDessous) &&
    typeof etat.pioches === 'object' &&
    typeof etat.inventaire === 'object' &&
    typeof etat.enchantements === 'object' &&
    typeof etat.stats === 'object' &&
    Array.isArray(etat.succes) &&
    typeof etat.position === 'number' &&
    typeof etat.cible === 'number' &&
    Array.isArray(etat.nonAVendre) &&
    typeof etat.ascenseur === 'object' &&
    typeof etat.foreuse === 'object' &&
    Array.isArray(etat.talents) &&
    Array.isArray(etat.employes)
  )
}
