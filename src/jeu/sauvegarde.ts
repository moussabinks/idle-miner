// Sauvegarde de la partie dans le navigateur (localStorage).
// On passe le « stockage » en paramètre : en jeu c'est window.localStorage,
// dans les tests c'est un faux stockage en mémoire.

import { VERSION_ETAT, type EtatJeu } from './mineur'

export const CLE_SAUVEGARDE = 'idle-miner-sauvegarde'

// Le strict nécessaire de l'API localStorage.
export type Stockage = {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

export function sauvegarder(stockage: Stockage, etat: EtatJeu): void {
  try {
    stockage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat))
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

export function effacer(stockage: Stockage): void {
  try {
    stockage.removeItem(CLE_SAUVEGARDE)
  } catch {
    // Rien à faire.
  }
}

// Met à jour une sauvegarde d'une ancienne version du jeu.
function migrer(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancien = donnees as Record<string, unknown>

  // Version 1 -> 2 : la surface, l'échelle, le marché et l'ascenseur.
  // L'ancien joueur reprend au fond de la mine, là où il était.
  if (ancien.version === 1) {
    return {
      ...ancien,
      version: 2,
      lieu: 'mine',
      trajet: null,
      colonneMineur: 0,
      nonAVendre: [],
      ascenseur: { possede: false, chargement: {}, tempsRestant: 0, tempsTotal: 0 },
    }
  }
  return donnees
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
    (etat.lieu === 'surface' || etat.lieu === 'mine') &&
    Array.isArray(etat.nonAVendre) &&
    typeof etat.ascenseur === 'object'
  )
}
