// Les actions du village vu du ciel : poser les bâtiments (le marché est gratuit, les autres
// coûtent de l'argent, de la pierre et du fer), les déplacer ou les retourner (menu
// « Modifier »), poser des rails (en fer) et des chemins.
// La géométrie (cases occupées, portes, chemins à pied) est dans village.ts.

import {
  BATIMENTS,
  COUT_CHEMIN,
  COUT_RAIL,
  LISTE_BATIMENTS,
  type Cout,
  type IdBatiment,
} from './donnees'
import { payer, peutPayer, type EtatJeu } from './mineur'
import { niveauAtteint, niveauPourBatiment, railsDebloques } from './niveaux'
import { t } from './langue'
import { batimentPose, cleCase, empriseBatiment, empriseLibre, formeraitUnCarre, voieDegagee, type Occupant, type Village } from './village'

// ---------------------------------------------------------------------------
// Les bâtiments
// ---------------------------------------------------------------------------

export function batimentDebloque(etat: EtatJeu, id: IdBatiment): boolean {
  return etat.niveauMine >= BATIMENTS[id].niveauMine && niveauAtteint(etat, niveauPourBatiment(id))
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
  return [t('🏗️ {nom} construit !', { nom: t(BATIMENTS[id].nom) })]
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

// (25/10) Des fonctions et pas des constantes : le texte est traduit au moment où on le dit
// (une constante serait traduite une seule fois, au chargement du jeu, avant le choix de la langue).
// (29/10) Les boucles sont permises : seul un carré de 2 × 2 rails est refusé.
export function messageBoucle(): string {
  return t('🔁 Pas de petit carré : 4 rails ne peuvent pas former un carré de 2 × 2.')
}
export function messageBords(): string {
  return t('🚧 Pas la place : la voie déborde d’une demi-case de chaque côté du rail.')
}

// Peut-on mettre un rail sur cette case (« de » : la case d'où on le déplace, s'il y en a une) ?
//   - 'occupee' : la case est prise (ou un chemin, un bâtiment... est déjà là) ;
//   - 'boucle' : les rails fermeraient un petit carré de 2 × 2 (29/10 : les autres boucles sont permises) ;
//   - 'bords' : sa voie (ou celle de ses voisins, qui change de forme) passerait sur un bâtiment,
//     une décoration ou un chemin ;
//   - 'ok' : on peut.
export function placePourUnRail(village: Village, x: number, y: number, de: { x: number; y: number } | null = null): 'ok' | 'occupee' | 'boucle' | 'bords' {
  const cleDe = de ? cleCase(de.x, de.y) : null
  const ignorer = cleDe ? ({ type: 'rail', cle: cleDe } as Occupant & { cle: string }) : null
  if (!empriseLibre(village, { x, y, taille: 1 }, ignorer, true)) return 'occupee'
  if (formeraitUnCarre(village, x, y, cleDe)) return 'boucle'
  const rails = [...village.rails.filter((c) => c !== cleDe), cleCase(x, y)]
  if (!voieDegagee({ ...village, rails })) return 'bords'
  return 'ok'
}

// (26/10) Les rails et les pavés en stock (retirés, ou rangés en réorganisant le village).
export function stockSol(etat: EtatJeu, type: TypeSol): number {
  return etat.stockSol?.[type] ?? 0
}

function ajouterAuStock(etat: EtatJeu, type: TypeSol, nombre: number): void {
  const stock = (etat.stockSol ??= { rail: 0, chemin: 0 })
  stock[type] = Math.max(0, (stock[type] ?? 0) + nombre)
}

// Poser une case : on prend d'abord dans le stock (gratuit), sinon on paie.
function peutPayerSol(etat: EtatJeu, type: TypeSol): boolean {
  return stockSol(etat, type) > 0 || peutPayer(etat, coutSol(type))
}

export function peutPoserSol(etat: EtatJeu, type: TypeSol, x: number, y: number): boolean {
  if (!peutPayerSol(etat, type)) return false
  if (type === 'rail' && !railsDebloques(etat)) return false
  if (type === 'rail') return placePourUnRail(etat.village, x, y) === 'ok'
  return empriseLibre(etat.village, { x, y, taille: 1 })
}

export function poserSol(etat: EtatJeu, type: TypeSol, x: number, y: number): string[] {
  if (type === 'rail') {
    const place = placePourUnRail(etat.village, x, y)
    if (place === 'boucle') return [messageBoucle()]
    if (place === 'bords') return [messageBords()]
  }
  if (!peutPoserSol(etat, type, x, y)) return []
  if (stockSol(etat, type) > 0) ajouterAuStock(etat, type, -1)
  else payer(etat, coutSol(type))
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
    if (place === 'boucle') return [messageBoucle()]
    if (place === 'bords') return [messageBords()]
    if (place !== 'ok') return []
  } else {
    const ignorer = { type, cle: cleCase(de.x, de.y) } as Occupant & { cle: string }
    if (!empriseLibre(etat.village, { x: vers.x, y: vers.y, taille: 1 }, ignorer)) return []
  }
  liste[index] = cleCase(vers.x, vers.y)
  return []
}

// Enlever une case : (26/10, demandé par le propriétaire) elle va dans le stock, et se repose
// gratuitement (menu Bâtiments). Avant (30/10), elle était remboursée en fer ou en argent.
export function retirerSol(etat: EtatJeu, type: TypeSol, x: number, y: number): string[] {
  const liste = listeSol(etat, type)
  const index = liste.indexOf(cleCase(x, y))
  if (index === -1) return []
  liste.splice(index, 1)
  ajouterAuStock(etat, type, 1)
  // (pendant une réorganisation, pas de message à chaque case)
  if (etat.reorganisation) return []
  return [type === 'rail' ? t('🛤️ Rail rangé : {n} en stock.', { n: stockSol(etat, type) }) : t('🪨 Pavé rangé : {n} en stock.', { n: stockSol(etat, type) })]
}

// Pourquoi on ne peut pas poser un rail ou un chemin ici (null : on peut). Pour le dire au
// joueur (30/10 : avant, rien ne se passait quand il n'avait plus de fer).
export function raisonSolImpossible(etat: EtatJeu, type: TypeSol, x: number, y: number): string | null {
  if (type === 'rail' && !railsDebloques(etat)) return null
  if (!peutPayerSol(etat, type)) {
    return type === 'rail'
      ? t('🔩 Plus de fer : un rail coûte {fer} fer (dans le coffre de la mine). Va creuser !', { fer: COUT_RAIL.materiaux.fer ?? 0 })
      : t("💵 Pas assez d'argent : un chemin coûte {argent} $.", { argent: COUT_CHEMIN.argent ?? 0 })
  }
  if (type === 'rail') {
    const place = placePourUnRail(etat.village, x, y)
    if (place === 'boucle') return messageBoucle()
    if (place === 'bords') return messageBords()
  }
  return null
}
