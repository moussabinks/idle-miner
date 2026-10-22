// Les actions du village vu du ciel : poser les bâtiments (le marché est gratuit, les autres
// coûtent de l'argent, de la pierre et du fer), les déplacer ou les retourner (menu
// « Modifier »), poser des rails (en fer) et des chemins, acheter des décorations.
// La géométrie (cases occupées, portes, chemins à pied) est dans village.ts.

import {
  BATIMENTS,
  COUT_CHEMIN,
  COUT_RAIL,
  DECORATIONS,
  LISTE_BATIMENTS,
  type Cout,
  type IdBatiment,
    type IdDecoration,
} from './donnees'
import { payer, peutPayer, type EtatJeu } from './mineur'
import { batimentPose, cleCase, empriseBatiment, empriseDecoration, empriseLibre, feraitUneBoucle, voieDegagee, type Occupant, type Village } from './village'

// ---------------------------------------------------------------------------
// Les bâtiments
// ---------------------------------------------------------------------------

export function batimentDebloque(etat: EtatJeu, id: IdBatiment): boolean {
  return etat.niveauMine >= BATIMENTS[id].niveauMine
}

export function estPose(etat: EtatJeu, id: IdBatiment): boolean {
  return batimentPose(etat.village, id) !== null
}

export function coutBatiment(id: IdBatiment): Cout {
  return BATIMENTS[id].cout
}

// Peut-on construire ce bâtiment (débloqué, pas encore posé, et payable) ?
export function peutConstruire(etat: EtatJeu, id: IdBatiment): boolean {
  return batimentDebloque(etat, id) && !estPose(etat, id) && peutPayer(etat, coutBatiment(id))
}

// Peut-on mettre ce bâtiment à cet endroit ?
export function placeLibrePour(etat: EtatJeu, id: IdBatiment, x: number, y: number): boolean {
  const ignorer: Occupant | null = estPose(etat, id) ? { type: 'batiment', id } : null
  return empriseLibre(etat.village, empriseBatiment({ id, x, y }), ignorer)
}

export function construireBatiment(etat: EtatJeu, id: IdBatiment, x: number, y: number, miroir = false): string[] {
  if (!peutConstruire(etat, id) || !placeLibrePour(etat, id, x, y)) return []
  payer(etat, coutBatiment(id))
  etat.village.batiments.push({ id, x, y, miroir })
  return [`🏗️ ${BATIMENTS[id].nom} construit !`]
}

// Déplacer (ou retourner) un bâtiment déjà posé : c'est gratuit.
export function deplacerBatiment(etat: EtatJeu, id: IdBatiment, x: number, y: number, miroir: boolean): string[] {
  const batiment = batimentPose(etat.village, id)
  if (!batiment || !placeLibrePour(etat, id, x, y)) return []
  batiment.x = x
  batiment.y = y
  batiment.miroir = miroir
  return []
}

// Les bâtiments débloqués qu'on n'a pas encore vus dans le menu « Bâtiments » (pastille « Nouveau »).
export function nouveautesBatiments(etat: EtatJeu): IdBatiment[] {
  return LISTE_BATIMENTS.filter((id) => batimentDebloque(etat, id) && !estPose(etat, id) && !etat.village.batimentsVus.includes(id))
}

// Les bâtiments qu'on peut construire tout de suite.
export function batimentsConstructibles(etat: EtatJeu): IdBatiment[] {
  return LISTE_BATIMENTS.filter((id) => peutConstruire(etat, id))
}

// Le joueur a ouvert le menu : les nouveautés sont vues.
export function marquerBatimentsVus(etat: EtatJeu): string[] {
  const nouveaux = nouveautesBatiments(etat)
  if (nouveaux.length === 0) return []
  etat.village.batimentsVus = [...etat.village.batimentsVus, ...nouveaux]
  return []
}

// ---------------------------------------------------------------------------
// Les rails et les chemins (une case chacun)
// ---------------------------------------------------------------------------

export type TypeSol = 'rail' | 'chemin'

export function coutSol(type: TypeSol): Cout {
  return type === 'rail' ? COUT_RAIL : COUT_CHEMIN
}

function listeSol(etat: EtatJeu, type: TypeSol): string[] {
  return type === 'rail' ? etat.village.rails : etat.village.chemins
}

export const MESSAGE_BOUCLE = '🔁 Pas de boucle : les rails vont d’un bâtiment à un autre.'
export const MESSAGE_BORDS = '🚧 Pas la place : la voie déborde d’une demi-case de chaque côté du rail.'

// Peut-on mettre un rail sur cette case (« de » : la case d'où on le déplace, s'il y en a une) ?
//   - 'occupee' : la case est prise (ou un chemin, un bâtiment... est déjà là) ;
//   - 'boucle' : les rails tourneraient en rond ;
//   - 'bords' : sa voie (ou celle de ses voisins, qui change de forme) passerait sur un bâtiment,
//     une décoration ou un chemin ;
//   - 'ok' : on peut.
export function placePourUnRail(village: Village, x: number, y: number, de: { x: number; y: number } | null = null): 'ok' | 'occupee' | 'boucle' | 'bords' {
  const cleDe = de ? cleCase(de.x, de.y) : null
  const ignorer = cleDe ? ({ type: 'rail', cle: cleDe } as Occupant & { cle: string }) : null
  if (!empriseLibre(village, { x, y, taille: 1 }, ignorer, true)) return 'occupee'
  if (feraitUneBoucle(village, x, y, cleDe)) return 'boucle'
  const rails = [...village.rails.filter((c) => c !== cleDe), cleCase(x, y)]
  if (!voieDegagee({ ...village, rails })) return 'bords'
  return 'ok'
}

export function peutPoserSol(etat: EtatJeu, type: TypeSol, x: number, y: number): boolean {
  if (!peutPayer(etat, coutSol(type))) return false
  if (type === 'rail') return placePourUnRail(etat.village, x, y) === 'ok'
  return empriseLibre(etat.village, { x, y, taille: 1 })
}

export function poserSol(etat: EtatJeu, type: TypeSol, x: number, y: number): string[] {
  if (type === 'rail') {
    const place = placePourUnRail(etat.village, x, y)
    if (place === 'boucle') return [MESSAGE_BOUCLE]
    if (place === 'bords') return [MESSAGE_BORDS]
  }
  if (!peutPoserSol(etat, type, x, y)) return []
  payer(etat, coutSol(type))
  listeSol(etat, type).push(cleCase(x, y))
  return []
}

// Déplacer une case de rails ou de chemin (gratuit).
export function deplacerSol(etat: EtatJeu, type: TypeSol, de: { x: number; y: number }, vers: { x: number; y: number }): string[] {
  const liste = listeSol(etat, type)
  const index = liste.indexOf(cleCase(de.x, de.y))
  if (index === -1) return []
  if (type === 'rail') {
    const place = placePourUnRail(etat.village, vers.x, vers.y, de)
    if (place === 'boucle') return [MESSAGE_BOUCLE]
    if (place === 'bords') return [MESSAGE_BORDS]
    if (place !== 'ok') return []
  } else {
    const ignorer = { type, cle: cleCase(de.x, de.y) } as Occupant & { cle: string }
    if (!empriseLibre(etat.village, { x: vers.x, y: vers.y, taille: 1 }, ignorer)) return []
  }
  liste[index] = cleCase(vers.x, vers.y)
  return []
}

// Enlever une case (sans remboursement).
export function retirerSol(etat: EtatJeu, type: TypeSol, x: number, y: number): string[] {
  const liste = listeSol(etat, type)
  const index = liste.indexOf(cleCase(x, y))
  if (index !== -1) liste.splice(index, 1)
  return []
}

// ---------------------------------------------------------------------------
// Les décorations (seulement pour faire joli, payées en argent)
// ---------------------------------------------------------------------------

export function decorationDebloquee(etat: EtatJeu, id: IdDecoration): boolean {
  return etat.niveauMine >= DECORATIONS[id].niveauMine
}

export function peutAcheterDecoration(etat: EtatJeu, id: IdDecoration): boolean {
  return decorationDebloquee(etat, id) && etat.argent >= DECORATIONS[id].prix
}

export function acheterDecoration(etat: EtatJeu, id: IdDecoration, x: number, y: number, miroir = false): string[] {
  if (!peutAcheterDecoration(etat, id) || !empriseLibre(etat.village, empriseDecoration({ id, x, y }))) return []
  etat.argent -= DECORATIONS[id].prix
  etat.village.decorations.push({ n: etat.village.prochainNumero, id, x, y, miroir })
  etat.village.prochainNumero += 1
  return []
}

export function deplacerDecoration(etat: EtatJeu, n: number, x: number, y: number, miroir: boolean): string[] {
  const deco = etat.village.decorations.find((d) => d.n === n)
  if (!deco || !empriseLibre(etat.village, empriseDecoration({ id: deco.id, x, y }), { type: 'decoration', n })) return []
  deco.x = x
  deco.y = y
  deco.miroir = miroir
  return []
}

// Enlever une décoration (sans remboursement).
export function retirerDecoration(etat: EtatJeu, n: number): string[] {
  etat.village.decorations = etat.village.decorations.filter((d) => d.n !== n)
  return []
}
