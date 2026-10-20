// Sauvegarde des parties dans le navigateur (localStorage).
// Il peut y avoir jusqu'à 5 « mondes » : 5 parties séparées (une save avancée pour tester,
// une save de début de partie, celle d'un ami...). On les choisit sur l'écran d'accueil.
//
// On passe le « stockage » en paramètre : en jeu c'est window.localStorage,
// dans les tests c'est un faux stockage en mémoire.

import { BLOCS, NIVEAUX_FORAGE, PRESTIGE_EMPLOYES, PRESTIGE_FOREUSE, profondeurBedrock, type Cout, type IdBloc } from './donnees'
import { VERSION_ETAT, nouveauManager, nouvellesStatistiques, type EtatJeu } from './mineur'

// Deux anciens talents retirés le 19/10 (« Ascenseur offert » et « Grimpeur agile ») : leurs points sont rendus.
const TALENTS_RETIRES = ['ascenseurOffert', 'grimpeur']

// Le prix des 2e, 3e, 4e et 5e foreuses, quand on pouvait en avoir plusieurs (avant le 20/10).
const ANCIENS_PRIX_FOREUSES = [50000, 100000, 200000, 400000]

// Ce que vaut un coût en argent (les minerais au prix du marché) : pour rembourser.
function valeurEnArgent(cout: Cout): number {
  let total = cout.argent ?? 0
  for (const [bloc, nombre] of Object.entries(cout.materiaux)) total += (nombre ?? 0) * BLOCS[bloc as IdBloc].prix
  return total
}

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
    // Un ancien donjon redevient un bloc de roche ordinaire (roche dure sous -80 m).
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

  // Version 10 -> 11 : l'argent gagné aux prestiges précédents (pour le classement).
  // On ne le connaît pas pour les anciennes parties : on part de 0.
  if (etat.version === 10) etat = { ...etat, version: 11, argentGagneAvant: 0 }

  // Version 11 -> 12 : chaque foreuse a son niveau et sa profondeur (au lieu d'un « nombre »
  // de foreuses identiques). Les foreuses déjà achetées gardent ce qu'elles avaient.
  if (etat.version === 11) {
    const ancienne = etat.foreuse as Record<string, unknown>
    if (Array.isArray(ancienne.foreuses)) {
      etat = { ...etat, version: 12 } // déjà au nouveau format
    } else {
      const { niveauVitesse, profondeur, progression, blocsFores, nombre, ...partage } = ancienne
      const une = { niveauVitesse: niveauVitesse ?? 0, profondeur: profondeur ?? 1, progression: progression ?? 0, blocsFores: blocsFores ?? 0 }
      const combien = typeof nombre === 'number' ? nombre : 1
      etat = { ...etat, version: 12, foreuse: { ...partage, foreuses: Array.from({ length: combien }, () => ({ ...une })) } }
    }
  }

  // Version 12 -> 13 : les stands découverts (pour la flèche qui guide vers un nouveau stand).
  // Une ancienne partie connaît déjà les stands qu'elle a débloqués : pas de flèche pour rien.
  if (etat.version === 12) {
    const prestige = typeof etat.prestige === 'number' ? etat.prestige : 0
    const decouvertes = [...(prestige >= PRESTIGE_FOREUSE ? ['foreuse'] : []), ...(prestige >= PRESTIGE_EMPLOYES ? ['employes'] : [])]
    etat = { ...etat, version: 13, decouvertes }
  }

  // Version 13 -> 14 : la mine n'a plus la même profondeur à chaque prestige (-100 m au
  // prestige 0, puis 50 m de plus par prestige). Une partie déjà plus bas que sa nouvelle
  // bedrock remonte juste au-dessus, et la bedrock compte comme atteinte.
  if (etat.version === 13) {
    const prestige = typeof etat.prestige === 'number' ? etat.prestige : 0
    const plusBas = profondeurBedrock(prestige) - 1
    const ramener = (metres: unknown) => (typeof metres === 'number' ? Math.min(metres, plusBas) : metres)
    if (typeof etat.profondeur === 'number' && etat.profondeur > plusBas) {
      const ascenseur = etat.ascenseur as Record<string, unknown>
      etat = {
        ...etat,
        profondeur: plusBas,
        position: ramener(etat.position),
        cible: ramener(etat.cible),
        victoire: true,
        enGalerie: true,
        ascenseur: { ...ascenseur, position: ramener(ascenseur.position), cible: ramener(ascenseur.cible) },
      }
    }
    // Et les nouvelles statistiques (écran 📊) : elles partent de 0 pour les anciennes parties.
    etat = {
      ...etat,
      version: 14,
      stats: { ...nouvellesStatistiques(), ...(etat.stats as object) },
      statsTotales: nouvellesStatistiques(),
    }
  }

  // Version 14 -> 15 (20/10) : une seule foreuse, les salaires et la rareté des mineurs,
  // le recruteur, le manager et sa trésorerie, et le nouvel arbre de prestige.
  if (etat.version === 14) {
    // On garde la meilleure foreuse (le plus haut niveau de forage, puis la plus profonde).
    // Les autres sont remboursées : leur prix d'achat et leurs améliorations (minerais au prix du marché).
    type AncienneForeuse = { niveauVitesse: number; profondeur: number; progression: number; blocsFores: number }
    const { foreuses, ...partage } = etat.foreuse as Record<string, unknown>
    const liste = (Array.isArray(foreuses) ? foreuses : []) as AncienneForeuse[]
    const triees = [...liste].sort((a, b) => b.niveauVitesse - a.niveauVitesse || b.profondeur - a.profondeur)
    const gardee = triees[0] ?? { niveauVitesse: 0, profondeur: 1, progression: 0, blocsFores: 0 }
    let remboursement = 0
    triees.slice(1).forEach((une, i) => {
      remboursement += ANCIENS_PRIX_FOREUSES[i] ?? 0
      for (let niveau = 1; niveau <= une.niveauVitesse; niveau++) remboursement += valeurEnArgent(NIVEAUX_FORAGE[niveau].cout)
    })
    const employes = (etat.employes as Record<string, unknown>[]).map((e) => ({ rarete: 'commun', ...e, tempsPaye: 10 * 60 }))
    etat = {
      ...etat,
      version: 15,
      argent: (etat.argent as number) + remboursement,
      // La foreuse qui reste garde tout le charbon chargé (elle seule le brûle maintenant).
      foreuse: { ...partage, ...gardee },
      // Les mineurs déjà embauchés deviennent communs, avec leurs 10 premières minutes payées.
      employes,
      recruteur: 0,
      manager: nouveauManager(),
      tresorerie: 0,
      // Le nouvel arbre de prestige : tous les points sont rendus.
      talents: [],
      stats: { ...nouvellesStatistiques(), ...(etat.stats as object) },
      statsTotales: { ...nouvellesStatistiques(), ...(etat.statsTotales as object) },
    }
    delete etat.peculeRecu
  }

  // Version 15 -> 16 (20/10) : les mineurs licenciés comptent dans le prix d'une embauche.
  // Les anciennes parties partent de 0 licenciement.
  if (etat.version === 15) etat = { ...etat, version: 16, licenciements: 0 }

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
    Array.isArray(etat.employes) &&
    typeof etat.recruteur === 'number' &&
    typeof etat.licenciements === 'number' &&
    typeof etat.manager === 'object' &&
    typeof etat.tresorerie === 'number' &&
    Array.isArray(etat.decouvertes) &&
    typeof etat.statsTotales === 'object' &&
    typeof etat.argentGagneAvant === 'number'
  )
}
