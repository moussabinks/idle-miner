// Les décorations du village (27/10, demandé par le propriétaire : elles reviennent) : fleurs,
// buissons, bancs, arbres, fontaine... On les achète à l'onglet « Décorations » du menu
// Construire, on les pose où l'on veut (comme un bâtiment, avec son fantôme), on les déplace ou
// on les retourne dans « ✏️ Modifier », et on les range : elles vont dans le stock et se reposent
// gratuitement. Juste pour faire joli : elles ne rapportent rien.
// La géométrie (qui occupe quelle case) est dans village.ts.

import { DECORATIONS, type Cout, type IdDecoration } from './donnees'
import { t } from './langue'
import { payer, peutPayer, type EtatJeu } from './mineur'
import { empriseDecoration, empriseLibre, type DecorationPosee, type Occupant } from './village'

export function coutDecoration(id: IdDecoration): Cout {
  return { argent: DECORATIONS[id].prix, materiaux: {} }
}

export function decorationsPosees(etat: EtatJeu): DecorationPosee[] {
  return etat.village.decorations ?? []
}

export function decorationPosee(etat: EtatJeu, n: number): DecorationPosee | null {
  return decorationsPosees(etat).find((d) => d.n === n) ?? null
}

// Combien de cette décoration attendent dans le stock (rangées, à reposer gratuitement).
export function stockDecoration(etat: EtatJeu, id: IdDecoration): number {
  return etat.stockDecorations?.[id] ?? 0
}

function ajouterAuStock(etat: EtatJeu, id: IdDecoration, nombre: number): void {
  const stock = (etat.stockDecorations ??= {})
  stock[id] = Math.max(0, (stock[id] ?? 0) + nombre)
}

// Peut-on en avoir une de plus (dans le stock, ou en la payant) ?
export function peutAcheterDecoration(etat: EtatJeu, id: IdDecoration): boolean {
  return stockDecoration(etat, id) > 0 || peutPayer(etat, coutDecoration(id))
}

// La place est-elle libre pour cette décoration ? (« n » : celle qu'on déplace, s'il y en a une.)
export function placeLibrePourDecoration(etat: EtatJeu, id: IdDecoration, x: number, y: number, n: number | null = null): boolean {
  const ignorer: Occupant | null = n === null ? null : { type: 'decoration', n }
  return empriseLibre(etat.village, empriseDecoration({ id, x, y }), ignorer)
}

// Poser une nouvelle décoration : on prend d'abord dans le stock (gratuit), sinon on paie.
export function poserDecoration(etat: EtatJeu, id: IdDecoration, x: number, y: number, miroir = false): string[] {
  if (!peutAcheterDecoration(etat, id) || !placeLibrePourDecoration(etat, id, x, y)) return []
  if (stockDecoration(etat, id) > 0) ajouterAuStock(etat, id, -1)
  else payer(etat, coutDecoration(id))
  const village = etat.village
  // (un numéro jamais pris, même dans une vieille partie)
  const n = Math.max(village.prochainNumero ?? 1, 1 + Math.max(0, ...decorationsPosees(etat).map((d) => d.n)))
  village.prochainNumero = n + 1
  village.decorations = [...decorationsPosees(etat), { n, id, x, y, miroir }]
  return []
}

// Déplacer (ou retourner) une décoration posée : c'est gratuit.
export function deplacerDecoration(etat: EtatJeu, n: number, x: number, y: number, miroir: boolean): string[] {
  const d = decorationPosee(etat, n)
  if (!d || !placeLibrePourDecoration(etat, d.id, x, y, n)) return []
  d.x = x
  d.y = y
  d.miroir = miroir
  return []
}

// Enlever une décoration : elle va dans le stock, et se repose gratuitement.
export function rangerDecoration(etat: EtatJeu, n: number): string[] {
  const d = decorationPosee(etat, n)
  if (!d) return []
  etat.village.decorations = decorationsPosees(etat).filter((x) => x.n !== n)
  ajouterAuStock(etat, d.id, 1)
  if (etat.reorganisation) return []
  return [t('📦 {nom} rangé(e) : {n} en stock.', { nom: t(DECORATIONS[d.id].nom), n: stockDecoration(etat, d.id) })]
}

// (pour « Tout ranger » : toutes les décorations du village partent dans le stock)
export function toutRangerDecorations(etat: EtatJeu): void {
  for (const d of decorationsPosees(etat)) ajouterAuStock(etat, d.id, 1)
  etat.village.decorations = []
}
