// Le village vu du ciel (décidé le 20/10) : une grande grille de 60 × 60 cases où le joueur
// pose ses bâtiments, ses rails, ses chemins et ses décorations comme il veut.
//
// Ce fichier ne contient que la géométrie : qui occupe quelle case, où est la porte d'un
// bâtiment, le chemin à pied d'un bâtiment à l'autre (on contourne les bâtiments), et la ligne
// de rails entre deux bâtiments. Les actions (construire, poser des rails...) sont dans
// batiments.ts, les wagonnets et leurs trajets dans wagonnet.ts.
//
// Les coordonnées : x va vers le bas à droite de l'écran, y vers le bas à gauche (vue
// isométrique). La case (0, 0) est le coin du haut de la clairière.

import {
  BATIMENTS,
  BATIMENTS_DES_RAILS,
  DECORATIONS,
  TAILLE_GRILLE,
  VITESSE_MARCHE,
  type IdBatiment,
  type IdDecoration,
} from './donnees'

// ---------------------------------------------------------------------------
// Ce qui est posé au village (sauvegardé avec la partie)
// ---------------------------------------------------------------------------

export type Case = { x: number; y: number }

export type BatimentPose = {
  id: IdBatiment
  x: number // la case du coin du haut de son emprise
  y: number
  miroir: boolean // le dessin est retourné (l'entrée passe de l'autre côté)
}

export type DecorationPosee = {
  n: number // son numéro (pour la retrouver quand on la déplace)
  id: IdDecoration
  x: number
  y: number
  miroir: boolean
}

export type Village = {
  batiments: BatimentPose[]
  rails: string[] // les cases de rails, écrites « x,y »
  chemins: string[] // les cases de chemin de pavés
  decorations: DecorationPosee[]
  prochainNumero: number // pour numéroter les décorations
  batimentsVus: IdBatiment[] // les bâtiments débloqués déjà vus dans le menu (pour la pastille « Nouveau »)
}

// La mine est posée d'office au milieu de la clairière.
export const TAILLE_MINE = BATIMENTS.puits.taille
export const POSITION_MINE: Case = { x: (TAILLE_GRILLE - TAILLE_MINE) / 2, y: (TAILLE_GRILLE - TAILLE_MINE) / 2 }

export function nouveauVillage(): Village {
  return {
    batiments: [{ id: 'puits', x: POSITION_MINE.x, y: POSITION_MINE.y, miroir: false }],
    rails: [],
    chemins: [],
    decorations: [],
    prochainNumero: 1,
    batimentsVus: [],
  }
}

export const cleCase = (x: number, y: number) => `${x},${y}`

export function lireCle(cle: string): Case {
  const [x, y] = cle.split(',').map(Number)
  return { x, y }
}

// ---------------------------------------------------------------------------
// Les emprises (les cases couvertes)
// ---------------------------------------------------------------------------

export type Emprise = { x: number; y: number; taille: number }

export function batimentPose(village: Village, id: IdBatiment): BatimentPose | null {
  return village.batiments.find((b) => b.id === id) ?? null
}

export function empriseBatiment(b: { id: IdBatiment; x: number; y: number }): Emprise {
  return { x: b.x, y: b.y, taille: BATIMENTS[b.id].taille }
}

export function empriseDecoration(d: { id: IdDecoration; x: number; y: number }): Emprise {
  return { x: d.x, y: d.y, taille: DECORATIONS[d.id].taille }
}

export function casesDe(emprise: Emprise): Case[] {
  const cases: Case[] = []
  for (let dx = 0; dx < emprise.taille; dx++) for (let dy = 0; dy < emprise.taille; dy++) cases.push({ x: emprise.x + dx, y: emprise.y + dy })
  return cases
}

export function dansLaGrille(emprise: Emprise): boolean {
  return emprise.x >= 0 && emprise.y >= 0 && emprise.x + emprise.taille <= TAILLE_GRILLE && emprise.y + emprise.taille <= TAILLE_GRILLE
}

// Ce qui occupe une case.
export type Occupant =
  | { type: 'batiment'; id: IdBatiment }
  | { type: 'decoration'; n: number }
  | { type: 'rail' }
  | { type: 'chemin' }

// Toutes les cases occupées, et par quoi.
export function occupation(village: Village): Map<string, Occupant> {
  const cases = new Map<string, Occupant>()
  for (const b of village.batiments) for (const c of casesDe(empriseBatiment(b))) cases.set(cleCase(c.x, c.y), { type: 'batiment', id: b.id })
  for (const d of village.decorations) for (const c of casesDe(empriseDecoration(d))) cases.set(cleCase(c.x, c.y), { type: 'decoration', n: d.n })
  for (const cle of village.rails) cases.set(cle, { type: 'rail' })
  for (const cle of village.chemins) cases.set(cle, { type: 'chemin' })
  return cases
}

function memeOccupant(a: Occupant, b: Occupant): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'batiment' && b.type === 'batiment') return a.id === b.id
  if (a.type === 'decoration' && b.type === 'decoration') return a.n === b.n
  return true
}

// Peut-on poser quelque chose sur cette emprise ? Elle doit tenir dans la clairière, sans
// chevaucher rien d'autre (sauf « ignorer » : l'élément qu'on est en train de déplacer).
//
// Les cases au bord d'une voie (sous la demi-voie qui déborde de chaque côté du rail, voir
// bordsDeVoie) sont interdites aux bâtiments, aux décorations et aux chemins : « pourUnRail »
// les autorise (un rail posé là se raccorde à la voie). Pour un rail, voir aussi voieDegagee.
export function empriseLibre(village: Village, emprise: Emprise, ignorer: (Occupant & { cle?: string }) | null = null, pourUnRail = false): boolean {
  if (!dansLaGrille(emprise)) return false
  const cases = occupation(village)
  const bords = pourUnRail ? null : bordsDeVoie(village)
  return casesDe(emprise).every((c) => {
    const cle = cleCase(c.x, c.y)
    if (bords?.has(cle)) return false
    const occupant = cases.get(cle)
    if (!occupant) return true
    if (ignorer === null || !memeOccupant(occupant, ignorer)) return false
    // Pour un rail ou un chemin, on n'ignore que la case qu'on déplace.
    return ignorer.cle === undefined || ignorer.cle === cle
  })
}

// ---------------------------------------------------------------------------
// Les portes et la marche
// ---------------------------------------------------------------------------

// L'entrée d'un bâtiment est-elle sur sa face avant gauche (sinon : avant droite) ?
export function porteAGauche(b: BatimentPose): boolean {
  return (BATIMENTS[b.id].porte === 'gauche') !== b.miroir
}

// Le point devant l'entrée du bâtiment (au milieu de sa face avant, juste dehors).
export function porte(b: BatimentPose): { x: number; y: number } {
  const t = BATIMENTS[b.id].taille
  return porteAGauche(b) ? { x: b.x + t / 2, y: b.y + t + 0.5 } : { x: b.x + t + 0.5, y: b.y + t / 2 }
}

// Les cases où l'on ne peut pas marcher : les bâtiments, et les grosses décorations.
export function casesBloquees(village: Village): Set<string> {
  const bloquees = new Set<string>()
  for (const b of village.batiments) for (const c of casesDe(empriseBatiment(b))) bloquees.add(cleCase(c.x, c.y))
  for (const d of village.decorations) {
    if (!DECORATIONS[d.id].bloque) continue
    for (const c of casesDe(empriseDecoration(d))) bloquees.add(cleCase(c.x, c.y))
  }
  return bloquees
}

export function caseBloquee(village: Village, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= TAILLE_GRILLE || y >= TAILLE_GRILLE) return true
  return casesBloquees(village).has(cleCase(x, y))
}

// La case libre où l'on se tient pour entrer dans un bâtiment : celle devant sa porte, ou à
// défaut la case libre la plus proche autour de lui.
export function caseAcces(village: Village, b: BatimentPose): Case {
  const p = porte(b)
  const devant = { x: Math.floor(p.x), y: Math.floor(p.y) }
  const bloquees = casesBloquees(village)
  const libre = (c: Case) => c.x >= 0 && c.y >= 0 && c.x < TAILLE_GRILLE && c.y < TAILLE_GRILLE && !bloquees.has(cleCase(c.x, c.y))
  if (libre(devant)) return devant
  // On cherche en cercles de plus en plus grands autour de la porte.
  for (let rayon = 1; rayon < TAILLE_GRILLE; rayon++) {
    let meilleure: Case | null = null
    for (let dx = -rayon; dx <= rayon; dx++) {
      for (let dy = -rayon; dy <= rayon; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rayon) continue
        const c = { x: devant.x + dx, y: devant.y + dy }
        if (!libre(c)) continue
        if (meilleure === null || Math.hypot(dx, dy) < Math.hypot(meilleure.x - devant.x, meilleure.y - devant.y)) meilleure = c
      }
    }
    if (meilleure) return meilleure
  }
  return devant
}

// À quelle distance (en cases) un point est-il d'un bâtiment ? 0 s'il est dessus. On mesure
// jusqu'au bord le plus proche de son emprise : on peut donc l'approcher de n'importe quel côté.
export function distanceAuBatiment(b: BatimentPose, x: number, y: number): number {
  const t = BATIMENTS[b.id].taille
  const dx = Math.max(b.x - x, 0, x - (b.x + t))
  const dy = Math.max(b.y - y, 0, y - (b.y + t))
  return Math.hypot(dx, dy)
}

// Le joueur ouvre un bâtiment dès qu'il est à moins de ce nombre de cases de son bord.
export const RAYON_BATIMENT = 1.3

// La case libre collée au bâtiment (tout autour de lui) la plus proche d'un point : c'est là que
// le joueur va quand on touche un bâtiment, au lieu de faire le tour jusqu'à la porte.
// Si aucune case autour n'est libre, on prend celle de la porte (caseAcces).
export function caseAccesProche(village: Village, b: BatimentPose, depuis: { x: number; y: number }): Case {
  const t = BATIMENTS[b.id].taille
  const bloquees = casesBloquees(village)
  const candidates: { c: Case; distance: number }[] = []
  for (let x = b.x - 1; x <= b.x + t; x++) {
    for (let y = b.y - 1; y <= b.y + t; y++) {
      const dedans = x >= b.x && x < b.x + t && y >= b.y && y < b.y + t
      if (dedans || x < 0 || y < 0 || x >= TAILLE_GRILLE || y >= TAILLE_GRILLE || bloquees.has(cleCase(x, y))) continue
      candidates.push({ c: { x, y }, distance: Math.hypot(x + 0.5 - depuis.x, y + 0.5 - depuis.y) })
    }
  }
  // La plus proche d'abord, mais seulement si on peut y aller à pied (pas enfermée par des décorations).
  candidates.sort((a, c) => a.distance - c.distance)
  const ici = { x: Math.floor(depuis.x), y: Math.floor(depuis.y) }
  for (const { c } of candidates.slice(0, 12)) {
    if (trouverChemin(village, ici, c) !== null) return c
  }
  return candidates[0]?.c ?? caseAcces(village, b)
}

// Un petit cache : le village change rarement, mais les mineurs demandent leur chemin souvent.
const CACHE_MAX = 200
const cacheChemins = new Map<string, Case[] | null>()

function signatureObstacles(village: Village): string {
  const batiments = village.batiments.map((b) => `${b.id}${b.x},${b.y}`).join('|')
  const decos = village.decorations
    .filter((d) => DECORATIONS[d.id].bloque)
    .map((d) => `${d.id}${d.x},${d.y}`)
    .join('|')
  return `${batiments}#${decos}`
}

const VOISINS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
]

// Le chemin à pied d'une case à une autre (A étoile, en 8 directions sans couper les coins).
// Renvoie la liste des cases à traverser, départ et arrivée comprises (null s'il n'y en a pas).
export function trouverChemin(village: Village, depart: Case, arrivee: Case): Case[] | null {
  const cle = `${signatureObstacles(village)}>${cleCase(depart.x, depart.y)}>${cleCase(arrivee.x, arrivee.y)}`
  if (cacheChemins.has(cle)) return cacheChemins.get(cle) ?? null
  const resultat = aEtoile(casesBloquees(village), depart, arrivee)
  if (cacheChemins.size >= CACHE_MAX) cacheChemins.delete(cacheChemins.keys().next().value as string)
  cacheChemins.set(cle, resultat)
  return resultat
}

function aEtoile(bloquees: Set<string>, depart: Case, arrivee: Case): Case[] | null {
  const dans = (c: Case) => c.x >= 0 && c.y >= 0 && c.x < TAILLE_GRILLE && c.y < TAILLE_GRILLE
  // Le départ et l'arrivée comptent comme libres (on peut partir de devant une porte).
  const libre = (c: Case) => dans(c) && (!bloquees.has(cleCase(c.x, c.y)) || (c.x === arrivee.x && c.y === arrivee.y) || (c.x === depart.x && c.y === depart.y))
  const estimation = (c: Case) => {
    const dx = Math.abs(c.x - arrivee.x)
    const dy = Math.abs(c.y - arrivee.y)
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
  }
  const cout = new Map<string, number>([[cleCase(depart.x, depart.y), 0]])
  const venuDe = new Map<string, string>()
  // Une liste ouverte toute simple (la grille est petite : 1 600 cases).
  const ouverts = new Map<string, Case>([[cleCase(depart.x, depart.y), depart]])
  while (ouverts.size > 0) {
    let meilleureCle = ''
    let meilleur = Infinity
    for (const [cle, c] of ouverts) {
      const f = (cout.get(cle) ?? Infinity) + estimation(c)
      if (f < meilleur) {
        meilleur = f
        meilleureCle = cle
      }
    }
    const courante = ouverts.get(meilleureCle) as Case
    ouverts.delete(meilleureCle)
    if (courante.x === arrivee.x && courante.y === arrivee.y) {
      const chemin: Case[] = [courante]
      let cle = meilleureCle
      while (venuDe.has(cle)) {
        cle = venuDe.get(cle) as string
        chemin.unshift(lireCle(cle))
      }
      return chemin
    }
    for (const v of VOISINS) {
      const suivante = { x: courante.x + v.x, y: courante.y + v.y }
      if (!libre(suivante)) continue
      // En diagonale, on ne coupe pas le coin d'un bâtiment.
      if (v.x !== 0 && v.y !== 0 && (!libre({ x: courante.x + v.x, y: courante.y }) || !libre({ x: courante.x, y: courante.y + v.y }))) continue
      const cleSuivante = cleCase(suivante.x, suivante.y)
      const nouveauCout = (cout.get(meilleureCle) ?? 0) + (v.x !== 0 && v.y !== 0 ? Math.SQRT2 : 1)
      if (nouveauCout < (cout.get(cleSuivante) ?? Infinity)) {
        cout.set(cleSuivante, nouveauCout)
        venuDe.set(cleSuivante, meilleureCle)
        ouverts.set(cleSuivante, suivante)
      }
    }
  }
  return null
}

// La longueur d'un chemin (en cases).
export function longueurChemin(chemin: Case[]): number {
  let total = 0
  for (let i = 1; i < chemin.length; i++) total += Math.hypot(chemin[i].x - chemin[i - 1].x, chemin[i].y - chemin[i - 1].y)
  return total
}

// Le chemin à pied d'un bâtiment à un autre (de porte à porte). null si l'un des deux n'est pas posé.
export function cheminEntre(village: Village, de: IdBatiment, vers: IdBatiment): Case[] | null {
  const a = batimentPose(village, de)
  const b = batimentPose(village, vers)
  if (!a || !b) return null
  const depart = caseAcces(village, a)
  const arrivee = caseAcces(village, b)
  return trouverChemin(village, depart, arrivee) ?? [depart, arrivee] // muré : il se faufile quand même
}

// La distance à pied d'un bâtiment à un autre, en cases (0 si l'un des deux n'est pas posé).
export function distanceEntre(village: Village, de: IdBatiment, vers: IdBatiment): number {
  const chemin = cheminEntre(village, de, vers)
  return chemin === null ? 0 : longueurChemin(chemin)
}

// Le temps pour aller à pied d'un bâtiment à un autre (en secondes).
export function secondesAPied(village: Village, de: IdBatiment, vers: IdBatiment): number {
  return distanceEntre(village, de, vers) / VITESSE_MARCHE
}

// ---------------------------------------------------------------------------
// Les rails : les lignes entre les bâtiments
// ---------------------------------------------------------------------------

const DIRECTIONS_RAILS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

// Une case touche-t-elle (par un côté) l'emprise d'un bâtiment ?
function toucheEmprise(c: Case, emprise: Emprise): boolean {
  return DIRECTIONS_RAILS.some((d) => {
    const x = c.x + d.x
    const y = c.y + d.y
    return x >= emprise.x && y >= emprise.y && x < emprise.x + emprise.taille && y < emprise.y + emprise.taille
  })
}

const cacheRails = new Map<string, Case[] | null>()

// La ligne de rails continue qui relie deux bâtiments (la plus courte), ou null s'il n'y en a pas.
// Une case de rails « touche » un bâtiment quand elle est collée à un de ses côtés.
export function railsEntre(village: Village, de: IdBatiment, vers: IdBatiment): Case[] | null {
  const a = batimentPose(village, de)
  const b = batimentPose(village, vers)
  if (!a || !b || village.rails.length === 0) return null
  const cle = `${village.rails.join('|')}#${a.x},${a.y}#${b.x},${b.y}#${de}${vers}`
  if (cacheRails.has(cle)) return cacheRails.get(cle) ?? null
  const rails = new Set(village.rails)
  const empriseA = empriseBatiment(a)
  const empriseB = empriseBatiment(b)
  // Un parcours en largeur, en partant de toutes les cases de rails collées au premier bâtiment.
  const venuDe = new Map<string, string | null>()
  const file: string[] = []
  for (const cle of village.rails) {
    if (toucheEmprise(lireCle(cle), empriseA)) {
      venuDe.set(cle, null)
      file.push(cle)
    }
  }
  let trouve: string | null = null
  while (file.length > 0) {
    const cleCourante = file.shift() as string
    const courante = lireCle(cleCourante)
    if (toucheEmprise(courante, empriseB)) {
      trouve = cleCourante
      break
    }
    for (const d of DIRECTIONS_RAILS) {
      const voisine = cleCase(courante.x + d.x, courante.y + d.y)
      if (rails.has(voisine) && !venuDe.has(voisine)) {
        venuDe.set(voisine, cleCourante)
        file.push(voisine)
      }
    }
  }
  let resultat: Case[] | null = null
  if (trouve !== null) {
    resultat = []
    let cle: string | null = trouve
    while (cle !== null) {
      resultat.unshift(lireCle(cle))
      cle = venuDe.get(cle) ?? null
    }
  }
  if (cacheRails.size >= CACHE_MAX) cacheRails.delete(cacheRails.keys().next().value as string)
  cacheRails.set(cle, resultat)
  return resultat
}

export function railsMineMarche(village: Village): Case[] | null {
  return railsEntre(village, 'puits', 'marche')
}

// Les voisins d'une case de rails (pour dessiner les virages) : nord (y-1), est (x+1), sud (y+1), ouest (x-1).
// Un bout de ligne (un rail qui n'a qu'un voisin, ou aucun) collé à un bâtiment des trajets se
// raccorde aussi à lui ; un rail qui passe le long d'un bâtiment ne s'y raccorde pas.
export function raccordsRail(village: Village, x: number, y: number): { n: boolean; e: boolean; s: boolean; o: boolean } {
  const rails = new Set(village.rails)
  const rail = (cx: number, cy: number) => rails.has(cleCase(cx, cy))
  const r = { n: rail(x, y - 1), e: rail(x + 1, y), s: rail(x, y + 1), o: rail(x - 1, y) }
  const nombre = [r.n, r.e, r.s, r.o].filter(Boolean).length
  if (nombre >= 2) return r
  const batiments = village.batiments.filter((b) => BATIMENTS_DES_RAILS.includes(b.id) && toucheEmprise({ x, y }, empriseBatiment(b)))
  const versBatiment = (cx: number, cy: number) => batiments.some((b) => occupe(empriseBatiment(b), cx, cy))
  // Un seul raccord vers un bâtiment (le côté opposé au rail voisin s'il y en a un).
  const cotes: ('n' | 'e' | 's' | 'o')[] = r.n ? ['s', 'e', 'o'] : r.e ? ['o', 'n', 's'] : r.s ? ['n', 'e', 'o'] : r.o ? ['e', 'n', 's'] : ['n', 'e', 's', 'o']
  const position = { n: [x, y - 1], e: [x + 1, y], s: [x, y + 1], o: [x - 1, y] } as const
  const cote = cotes.find((c) => versBatiment(position[c][0], position[c][1]))
  if (cote) r[cote] = true
  return r
}

// Poser un rail sur cette case ferait-il une boucle ? Les rails ne doivent jamais tourner en rond
// (24/10) : un wagonnet va d'un bâtiment à un autre, par une seule route. Il y a boucle si deux
// des rails voisins de la case sont déjà reliés entre eux par d'autres rails.
// « sans » : une case de rails à ne pas compter (celle qu'on est en train de déplacer).
export function feraitUneBoucle(village: Village, x: number, y: number, sans: string | null = null): boolean {
  const rails = new Set(village.rails)
  if (sans !== null) rails.delete(sans)
  rails.delete(cleCase(x, y))
  const voisins = DIRECTIONS_RAILS.map((d) => cleCase(x + d.x, y + d.y)).filter((cle) => rails.has(cle))
  if (voisins.length < 2) return false
  // On colore les rails par groupes reliés : deux voisins du même groupe ferment une boucle.
  const groupe = new Map<string, number>()
  voisins.forEach((depart, numero) => {
    if (groupe.has(depart)) return
    const file = [depart]
    groupe.set(depart, numero)
    while (file.length > 0) {
      const c = lireCle(file.pop() as string)
      for (const d of DIRECTIONS_RAILS) {
        const v = cleCase(c.x + d.x, c.y + d.y)
        if (rails.has(v) && !groupe.has(v)) {
          groupe.set(v, numero)
          file.push(v)
        }
      }
    }
  })
  const groupes = voisins.map((cle) => groupe.get(cle))
  return new Set(groupes).size < groupes.length
}

function occupe(emprise: Emprise, x: number, y: number): boolean {
  return x >= emprise.x && y >= emprise.y && x < emprise.x + emprise.taille && y < emprise.y + emprise.taille
}

// ---------------------------------------------------------------------------
// La voie est large de deux cases (25/10)
// ---------------------------------------------------------------------------
// Un rail se pose sur une case, mais sa voie (le talus, les traverses) déborde d'une demi-case de
// chaque côté. Les cases où déborde une demi-voie sont ses « bords » : on n'y pose ni bâtiment,
// ni décoration, ni chemin.

export type Cote = 'n' | 'e' | 's' | 'o'
export const COTES: Cote[] = ['n', 'e', 's', 'o']
export const DIRECTION: Record<Cote, Case> = { n: { x: 0, y: -1 }, e: { x: 1, y: 0 }, s: { x: 0, y: 1 }, o: { x: -1, y: 0 } }
export const OPPOSE: Record<Cote, Cote> = { n: 's', e: 'o', s: 'n', o: 'e' }

// La forme d'une case de rails, telle qu'on la dessine : les côtés qu'elle relie (dans l'ordre
// n, e, s, o). Seule, ou avec une seule voisine, elle va tout droit.
export function formeDuRail(village: Village, x: number, y: number): Cote[] {
  const r = raccordsRail(village, x, y)
  const liste = COTES.filter((c) => r[c])
  if (liste.length >= 2) return liste
  const axe = liste[0] ?? 'n'
  return axe === 'n' || axe === 's' ? ['n', 's'] : ['e', 'o']
}

// Les bords de toutes les voies : pour chaque rail, les cases voisines du côté où la voie ne va
// pas (les deux côtés d'une ligne droite, l'extérieur d'un virage, le dos d'un T).
const cacheBords = new Map<string, Set<string>>()

// La signature des rails et des bâtiments (les raccords des rails n'en dépendent que).
function signatureRails(village: Village): string {
  return `${village.rails.join('|')}#${village.batiments.map((b) => `${b.id}${b.x},${b.y}`).join('|')}`
}

export function bordsDeVoie(village: Village): Set<string> {
  const cle = signatureRails(village)
  const deja = cacheBords.get(cle)
  if (deja) return deja
  const bords = new Set<string>()
  const rails = new Set(village.rails)
  for (const cle of village.rails) {
    const c = lireCle(cle)
    const forme = formeDuRail(village, c.x, c.y)
    for (const cote of COTES) {
      if (forme.includes(cote)) continue
      const voisine = cleCase(c.x + DIRECTION[cote].x, c.y + DIRECTION[cote].y)
      if (!rails.has(voisine)) bords.add(voisine)
    }
  }
  if (cacheBords.size >= CACHE_MAX) cacheBords.delete(cacheBords.keys().next().value as string)
  cacheBords.set(cle, bords)
  return bords
}

// Les rails de ce village ont-ils la place pour leur voie ? (Aucun bâtiment, aucune décoration,
// aucun chemin sur leurs bords.) On s'en sert avant de poser ou de déplacer un rail : le nouveau
// rail change aussi la forme de ses voisins.
export function voieDegagee(village: Village): boolean {
  const cases = occupation(village)
  for (const cle of bordsDeVoie(village)) {
    const occupant = cases.get(cle)
    if (occupant && occupant.type !== 'rail') return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Les virages doux (25/10)
// ---------------------------------------------------------------------------
// Un virage serré tient dans une seule case ; mais quand ses deux voisines sont des lignes
// droites, on dessine à la place un grand virage doux sur les trois cases (la voisine, le coin,
// l'autre voisine) : un quart de cercle de rayon 1,5 case. Le wagonnet le suit aussi. Ce n'est
// que du dessin : les rails, les trajets et les longueurs ne changent pas.

export type VirageDoux = {
  coin: Case // la case du virage
  bras: [Cote, Cote] // ses deux côtés (dans l'ordre n, e, s, o)
}

const cacheVirages = new Map<string, VirageDoux[]>()

export function viragesDoux(village: Village): VirageDoux[] {
  const cle = signatureRails(village)
  const deja = cacheVirages.get(cle)
  if (deja) return deja
  const rails = new Set(village.rails)
  const pris = new Set<string>() // les cases déjà dans un virage doux
  const virages: VirageDoux[] = []
  // Toujours dans le même ordre, pour que deux virages qui se disputent une case gardent le même gagnant.
  const tries = [...village.rails].sort((a, b) => {
    const ca = lireCle(a)
    const cb = lireCle(b)
    return ca.y - cb.y || ca.x - cb.x
  })
  for (const cleCoin of tries) {
    const coin = lireCle(cleCoin)
    const forme = formeDuRail(village, coin.x, coin.y)
    if (forme.length !== 2 || OPPOSE[forme[0]] === forme[1]) continue
    const bras = forme as [Cote, Cote]
    // Chaque bras doit être une ligne droite dans le bon sens, et libre.
    const cases = bras.map((cote) => ({ cote, c: { x: coin.x + DIRECTION[cote].x, y: coin.y + DIRECTION[cote].y } }))
    const bons = cases.every(({ cote, c }) => {
      const cleBras = cleCase(c.x, c.y)
      if (!rails.has(cleBras) || pris.has(cleBras)) return false
      // (Vraiment reliée des deux côtés : un bout de ligne garde son butoir.)
      const r = raccordsRail(village, c.x, c.y)
      return r[cote] && r[OPPOSE[cote]] && COTES.filter((k) => r[k]).length === 2
    })
    if (!bons || pris.has(cleCoin)) continue
    pris.add(cleCoin)
    for (const { c } of cases) pris.add(cleCase(c.x, c.y))
    virages.push({ coin, bras })
  }
  if (cacheVirages.size >= CACHE_MAX) cacheVirages.delete(cacheVirages.keys().next().value as string)
  cacheVirages.set(cle, virages)
  return virages
}
