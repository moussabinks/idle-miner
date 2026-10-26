// Sauvegarde des parties dans le navigateur (localStorage).
// Il peut y avoir jusqu'à 5 « mondes » : 5 parties séparées (une save avancée pour tester,
// une save de début de partie, celle d'un ami...). On les choisit sur l'écran d'accueil.
//
// On passe le « stockage » en paramètre : en jeu c'est window.localStorage,
// dans les tests c'est un faux stockage en mémoire.

import { BLOCS, LIAISONS, TAILLE_GRILLE, type IdBatiment, type IdBloc, type IdLiaison } from './donnees'
import { VERSION_ETAT, VERSION_MINE_AUTOMATIQUE, ajouterA, nouvelAtelier, nouveauTrajet, type EtatJeu, type Inventaire } from './mineur'
import { donnerXpAVieillePartie, recordsDeDepart } from './niveaux'
import { t } from './langue'
import { empriseBatiment, empriseLibre, lireCle, railsMineMarche, POSITION_MINE, type BatimentPose, type Village } from './village'

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
        liste.push({ id: '1', nom: t('Monde {n}', { n: 1 }), couleur: 0, creeLe: date, joueLe: date })
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
  return { id, nom: nom.trim() || t('Monde {n}', { n: id }), couleur, creeLe: maintenant, joueLe: maintenant }
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
  return creerMonde(stockage, t('{nom} (copie)', { nom: original.nom }), etat, maintenant)
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
    const convertie = convertirVersion29(convertirVersion28(convertirVersion27(convertirVersion26(convertirVersion25(convertirVersion24(convertirVersion23(convertirVersion22(convertirVersion21(donnees)))))))))
    if (!estUnEtatValide(convertie)) return null
    // Les tenues du Bazar et les décorations du village ont été retirées (27/10) : on oublie
    // celles des anciennes parties (et le succès « Paysagiste »).
    const { tenue: _tenue, tenuesAchetees: _tenuesAchetees, tresorerie, ...etat } = convertie as EtatJeu & { tenue?: unknown; tenuesAchetees?: unknown; tresorerie?: number }
    // (23/10) Plus de trésorerie : le manager paie avec l'argent du joueur. Ce qui y restait revient dans sa poche.
    if (typeof tresorerie === 'number' && tresorerie > 0) etat.argent += tresorerie
    const { decorations: _decorations, prochainNumero: _prochainNumero, ...village } = etat.village as typeof etat.village & { decorations?: unknown; prochainNumero?: unknown }
    return { ...etat, village, succes: etat.succes.filter((id) => id !== 'paysagiste') }
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
    version: 22,
    niveauWagonnets: typeof wagonnet?.niveau === 'number' ? wagonnet.niveau : 0,
    trajets: avecLigne ? [nouveauTrajet('mine-marche')] : [],
  }
}

// Une partie de la version 22 (avant les pousseurs embauchés pour un trajet, le 26/10) : chaque
// pousseur prend le trajet Mine → Marché (ou, s'il n'existe pas, le premier trajet qui part de
// la mine) ; les mineurs n'ont pas de trajet.
export function convertirVersion22(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as { version?: unknown; employes?: { role?: string; trajet?: unknown }[]; trajets?: { liaison: IdLiaison }[] }
  if (ancienne.version !== 22 || !Array.isArray(ancienne.employes)) return donnees
  const trajets = Array.isArray(ancienne.trajets) ? ancienne.trajets.map((trajet) => trajet.liaison) : []
  const choix = trajets.includes('mine-marche') ? 'mine-marche' : (trajets.find((liaison) => LIAISONS[liaison]?.depart === 'puits') ?? null)
  return {
    ...ancienne,
    version: 23,
    employes: ancienne.employes.map((e) => ({ ...e, trajet: e.role === 'pousseur' ? choix : null })),
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
    typeof etat.gemmes === 'number' &&
    typeof etat.stats === 'object' &&
    Array.isArray(etat.succes) &&
    typeof etat.ascenseur === 'object' &&
    typeof etat.foreuse === 'object' &&
    typeof etat.generateur === 'object' &&
    typeof etat.fonderie === 'object' &&
    typeof etat.joaillerie === 'object' &&
    typeof etat.niveauWagonnets === 'number' &&
    Array.isArray(etat.trajets) &&
    Array.isArray(etat.employes) &&
    typeof etat.recruteur === 'number' &&
    typeof etat.manager === 'object' &&
    Array.isArray(etat.decouvertes) &&
    typeof etat.village === 'object' &&
    Array.isArray(etat.village?.batiments) &&
    typeof etat.xp === 'number'
  )
}

// Version 23 → 24 (29/10) : le niveau du joueur. Une vieille partie reçoit l'XP du niveau qu'il
// faut pour tout ce qu'elle a déjà (voir niveaux.ts).
export function convertirVersion23(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatJeu
  if (ancienne.version !== 23 || typeof ancienne.village !== 'object' || ancienne.village === null) return donnees
  const etat = { ...ancienne, version: 24 }
  donnerXpAVieillePartie(etat)
  return etat
}

// Version 24 → 25 (30/10) : la mine a son ascenseur dès le début (niveau 1 au moins).
export function convertirVersion24(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatJeu
  if (ancienne.version !== 24 || typeof ancienne.ascenseur !== 'object' || ancienne.ascenseur === null) return donnees
  return { ...ancienne, version: 25, ascenseur: { ...ancienne.ascenseur, niveau: Math.max(1, ancienne.ascenseur.niveau) } }
}

// Version 25 → 26 (23/10) : la pioche en émeraude arrive entre l'or (2) et le diamant, qui passe
// du niveau 3 au niveau 4. Une pioche en diamant reste donc une pioche en diamant.
export function convertirVersion25(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatJeu
  if (ancienne.version !== 25 || typeof ancienne.pioches !== 'object' || ancienne.pioches === null) return donnees
  const decaler = (niveau: number) => (niveau >= 3 ? niveau + 1 : niveau)
  const pioches: Record<number, number> = {}
  for (const [niveau, usure] of Object.entries(ancienne.pioches)) pioches[decaler(Number(niveau))] = usure
  return { ...ancienne, version: 26, pioches, niveauPioche: decaler(ancienne.niveauPioche), meilleure: decaler(ancienne.meilleure) }
}

// Version 26 → 27 (23/10) : les mineurs ont aussi leur pioche en émeraude, entre l'or (3) et le
// diamant, qui passe du niveau 4 au niveau 5 (seulement pour les mineurs : le niveau d'un
// pousseur, c'est autre chose).
export function convertirVersion26(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatJeu
  if (ancienne.version !== 26 || !Array.isArray(ancienne.employes)) return donnees
  const employes = ancienne.employes.map((e) => (e.role === 'mineur' && e.niveau >= 4 ? { ...e, niveau: e.niveau + 1 } : e))
  return { ...ancienne, version: 27, employes }
}

// Version 27 → 28 (23/10) : plus de taille des wagonnets pour tous les trajets ; chaque pousseur a
// son chariot. Il reçoit le plus grand chariot qui ne dépasse pas ce que portait son wagonnet
// avant (l'ancienne taille × le bonus de son ancien niveau). Son niveau devient sa vitesse.
const ANCIENNES_TAILLES_WAGONNET = [20, 40, 70, 120]
const ANCIENS_BONUS_POUSSEUR = [1, 1.25, 1.5, 2, 2.5]
// Les places des chariots des pousseurs de la version 28 (7 niveaux, avant le 25/10).
const ANCIENNES_PLACES_CHARIOT = [20, 30, 42, 58, 80, 110, 150]
export function convertirVersion27(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatJeu
  if (ancienne.version !== 27 || !Array.isArray(ancienne.employes)) return donnees
  const taille = ANCIENNES_TAILLES_WAGONNET[Math.min(Math.max(0, ancienne.niveauWagonnets ?? 0), ANCIENNES_TAILLES_WAGONNET.length - 1)]
  const employes = ancienne.employes.map((e) => {
    if (e.role !== 'pousseur') return e
    const places = taille * ANCIENS_BONUS_POUSSEUR[Math.min(Math.max(0, e.niveau), ANCIENS_BONUS_POUSSEUR.length - 1)]
    let chariot = 0
    while (chariot + 1 < ANCIENNES_PLACES_CHARIOT.length && ANCIENNES_PLACES_CHARIOT[chariot + 1] <= places) chariot += 1
    return { ...e, chariot }
  })
  return { ...ancienne, version: 28, employes }
}

// Version 28 → 29 (25/10, la grande mise à jour) :
//   - plus de sac à dos : ce qu'il contenait est vendu (au prix du marché) ;
//   - plus de bazar : il est enlevé du village, et son prix (200 $) remboursé ;
//   - la clairière passe de 60 × 60 à 40 × 40 cases : tout le village recule de 10 cases (la mine
//     reste au milieu). Un bâtiment qui ne tient plus est reposé à la première place libre près de
//     la mine ; un rail qui sort de la clairière est enlevé (son fer revient dans le coffre) ;
//   - toutes les améliorations ont 5 niveaux (avant : jusqu'à 10) : chaque niveau d'avant devient
//     le niveau le plus proche ;
//   - les gemmes, les bonus et les récompenses quotidiennes arrivent (10 gemmes offertes) ;
//   - le tutoriel a changé : une partie déjà commencée ne le refait pas.
const ANCIEN_COTE = 60
const ANCIEN_COUT_BAZAR = 200
const ANCIENNE_ASCENSEUR = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5] // niveau 0 à 10 → 0 à 5
const ANCIENNE_PIOCHE_MINEUR = [0, 0, 1, 2, 3, 4] // bois, pierre, fer, or, émeraude, diamant
const ANCIEN_CHARIOT_POUSSEUR = [0, 1, 1, 2, 3, 3, 4]
const ANCIENNE_FOREUSE = [0, 1, 2, 2, 3, 4] // forage et chariot de la foreuse
const ANCIEN_MANAGER = [0, 1, 1, 2, 2]
const GEMMES_CADEAU = 10

type EtatVersion28 = EtatJeu & { inventaire?: Partial<Record<IdBloc, number>>; nonAVendre?: unknown; niveauSac?: unknown }

export function convertirVersion28(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatVersion28
  if (ancienne.version !== 28 || typeof ancienne.village !== 'object' || ancienne.village === null) return donnees
  const { inventaire, nonAVendre: _nonAVendre, niveauSac: _niveauSac, ...reste } = ancienne
  const etat = JSON.parse(JSON.stringify(reste)) as EtatJeu
  etat.version = 29

  // Le sac est vendu.
  let vente = 0
  for (const [bloc, nombre] of Object.entries(inventaire ?? {})) vente += (nombre ?? 0) * (BLOCS[bloc as IdBloc]?.prix ?? 0)
  etat.argent += Math.round(vente)
  etat.stats.argentGagne += Math.round(vente)

  // Le village : sans bazar, et 10 cases plus près du coin.
  const decalage = (ANCIEN_COTE - TAILLE_GRILLE) / 2
  const avaitBazar = etat.village.batiments.some((b) => (b.id as string) === 'bazar')
  if (avaitBazar) etat.argent += ANCIEN_COUT_BAZAR
  const batiments = etat.village.batiments.filter((b) => (b.id as string) !== 'bazar').map((b) => ({ ...b, x: b.x - decalage, y: b.y - decalage }))
  const dans = (x: number, y: number) => x >= 0 && y >= 0 && x < TAILLE_GRILLE && y < TAILLE_GRILLE
  const rails: string[] = []
  let ferRendu = 0
  for (const cle of etat.village.rails) {
    const c = lireCle(cle)
    if (dans(c.x - decalage, c.y - decalage)) rails.push(`${c.x - decalage},${c.y - decalage}`)
    else ferRendu += 3
  }
  if (ferRendu > 0) ajouterA(etat.coffre.contenu, 'fer', ferRendu)
  const chemins = etat.village.chemins
    .map(lireCle)
    .filter((c) => dans(c.x - decalage, c.y - decalage))
    .map((c) => `${c.x - decalage},${c.y - decalage}`)
  const village: Village = { ...etat.village, batiments: [], rails, chemins, batimentsVus: etat.village.batimentsVus.filter((id) => (id as string) !== 'bazar') }
  // On repose chaque bâtiment ; s'il ne tient plus là, à la première place libre près de la mine.
  for (const b of batiments) {
    if (empriseLibre(village, empriseBatiment(b))) village.batiments.push(b)
    else village.batiments.push(placeLibrePres(village, b))
  }
  etat.village = village

  // 5 niveaux pour tout.
  const borne = (table: number[], n: number) => table[Math.max(0, Math.min(table.length - 1, n))]
  etat.ascenseur = { ...etat.ascenseur, niveau: Math.max(1, borne(ANCIENNE_ASCENSEUR, etat.ascenseur.niveau)) }
  etat.foreuse = { ...etat.foreuse, niveauVitesse: borne(ANCIENNE_FOREUSE, etat.foreuse.niveauVitesse), niveauChariot: borne(ANCIENNE_FOREUSE, etat.foreuse.niveauChariot) }
  etat.manager = { ...etat.manager, niveau: borne(ANCIEN_MANAGER, etat.manager.niveau ?? 0) }
  etat.recruteur = Math.min(3, etat.recruteur)
  const surLaCarte = (id: IdBatiment) => (id as string) === 'bazar' ? 'puits' : id
  etat.employes = etat.employes.map((e) => ({
    ...e,
    niveau: e.role === 'mineur' ? borne(ANCIENNE_PIOCHE_MINEUR, e.niveau) : Math.min(4, e.niveau),
    chariot: e.role === 'pousseur' ? borne(ANCIEN_CHARIOT_POUSSEUR, e.chariot ?? 0) : e.chariot,
    lieu: surLaCarte(e.lieu),
    depuis: surLaCarte(e.depuis),
  }))

  // Les nouveautés.
  etat.gemmes = GEMMES_CADEAU
  etat.boosts = {}
  etat.quotidien = { dernierJour: null, serie: 0 }
  if (etat.tutoriel !== undefined) etat.tutoriel = 99
  // L'XP ne compte que ce qui sera fait à partir de maintenant (les prix ont changé).
  etat.recordsXp = recordsDeDepart(etat)
  return etat
}

// Version 29 → 30 (26/10, la grande mise à jour des gemmes) : la mine a 7 niveaux. Le saphir
// arrive au niveau 5, le rubis au 6, et le diamant descend tout au fond, au niveau 7. Une partie
// au niveau 5 (avant « Cœur de diamant ») y reste : c'est maintenant la Caverne de saphir.
//   - ses diamants deviennent des saphirs, partout (coffre, chariot de la foreuse, wagonnets,
//     sacs des mineurs, caisse de l'ascenseur), et ce qu'elle gardait ou excluait aussi ;
//   - la pioche en diamant (la sienne et celles des mineurs) devient celle en saphir : c'est le
//     même niveau (4), il n'y a rien à changer ;
//   - la fonderie et la joaillerie arrivent, vides.
export function convertirVersion29(donnees: unknown): unknown {
  if (typeof donnees !== 'object' || donnees === null) return donnees
  const ancienne = donnees as EtatJeu
  if (ancienne.version !== 29 || typeof ancienne.coffre !== 'object' || ancienne.coffre === null) return donnees
  const etat = JSON.parse(JSON.stringify(ancienne)) as EtatJeu
  etat.version = 30
  // Les diamants d'un inventaire deviennent des saphirs.
  const enSaphirs = (inventaire: Inventaire | undefined) => {
    const n = inventaire?.diamant ?? 0
    if (!inventaire || n <= 0) return
    delete inventaire.diamant
    ajouterA(inventaire, 'saphir', n)
  }
  enSaphirs(etat.coffre.contenu)
  if (etat.coffre.garder?.diamant) {
    etat.coffre.garder.saphir = Math.max(etat.coffre.garder.saphir ?? 0, etat.coffre.garder.diamant)
    delete etat.coffre.garder.diamant
  }
  enSaphirs(etat.foreuse?.chariot)
  for (const trajet of etat.trajets ?? []) {
    enSaphirs(trajet.chargement)
    if (trajet.exclus) trajet.exclus = [...new Set(trajet.exclus.map((bloc) => ((bloc as string) === 'diamant' ? 'saphir' : bloc)))]
  }
  for (const employe of etat.employes ?? []) enSaphirs(employe.sac)
  enSaphirs(etat.ascenseur?.navette?.chargement)
  if (etat.prochainBloc === 'diamant') etat.prochainBloc = 'saphir'
  etat.fonderie = nouvelAtelier()
  etat.joaillerie = nouvelAtelier()
  return etat
}

// La place libre la plus proche de la mine pour un bâtiment qui ne tient plus là où il était.
function placeLibrePres(village: Village, b: BatimentPose): BatimentPose {
  const taille = empriseBatiment(b).taille
  let meilleure: BatimentPose | null = null
  let distanceMin = Infinity
  for (let x = 0; x + taille <= TAILLE_GRILLE; x++) {
    for (let y = 0; y + taille <= TAILLE_GRILLE; y++) {
      if (!empriseLibre(village, { x, y, taille })) continue
      const d = Math.hypot(x - POSITION_MINE.x, y - POSITION_MINE.y)
      if (d < distanceMin) {
        distanceMin = d
        meilleure = { ...b, x, y }
      }
    }
  }
  return meilleure ?? { ...b, x: 0, y: 0 }
}
