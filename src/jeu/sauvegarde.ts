// Sauvegarde de la partie dans le navigateur (localStorage).
// On passe le « stockage » en paramètre : en jeu c'est window.localStorage,
// dans les tests c'est un faux stockage en mémoire.

import { VERSION_ETAT, type EtatJeu } from './mineur'

export const CLE_SAUVEGARDE = 'idle-miner-sauvegarde'
// L'heure de la dernière sauvegarde, pour faire travailler la foreuse pendant l'absence du joueur.
export const CLE_HORODATAGE = 'idle-miner-horodatage'

// Le strict nécessaire de l'API localStorage.
export type Stockage = {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

export function sauvegarder(stockage: Stockage, etat: EtatJeu, maintenant = Date.now()): void {
  try {
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat))
    stockage.setItem(CLE_HORODATAGE, String(maintenant))
  } catch {
    // Stockage plein ou interdit (navigation privée) : tant pis, on continue sans sauvegarde.
  }
}

// Renvoie la partie sauvegardée, ou null s'il n'y en a pas (ou si elle est abîmée).
export function charger(stockage: Stockage): EtatJeu | null {
  try {
    const texte = stockage.getItem(CLE_SAUVEGARDE)
    if (texte === null) return null
    const donnees = migrer(JSON.parse(texte))
    return estUnEtatValide(donnees) ? donnees : null
  } catch {
    return null
  }
}

// Nombre de secondes écoulées depuis la dernière sauvegarde (0 si on ne sait pas).
export function secondesDepuisSauvegarde(stockage: Stockage, maintenant = Date.now()): number {
  try {
    const horodatage = Number(stockage.getItem(CLE_HORODATAGE))
    if (!Number.isFinite(horodatage) || horodatage <= 0) return 0
    return Math.max(0, (maintenant - horodatage) / 1000)
  } catch {
    return 0
  }
}

export function effacer(stockage: Stockage): void {
  try {
    stockage.removeItem(CLE_SAUVEGARDE)
  } catch {
    // Rien à faire.
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
    typeof etat.foreuse === 'object'
  )
}
