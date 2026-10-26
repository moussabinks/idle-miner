// Les ateliers (26/10, la grande mise à jour des gemmes) : deux bâtiments qui transforment ce qui
// sort de la mine en objets qui valent bien plus.
//   - La FONDERIE (niveau 5 de la mine) fond le fer et l'or en lingots (2 fois le prix du
//     minerai). Elle brûle du charbon pendant qu'elle fond (1 charbon = 12 secondes de four).
//   - La JOAILLERIE (niveau 6) : ses joailliers (embauchés au Personnel) taillent les gemmes
//     (émeraude, saphir, rubis, diamant) en bijoux (2,5 fois le prix de la gemme). Chaque
//     joaillier taille une gemme à la fois ; un joaillier rare va plus vite.
// Chaque atelier a une ENTRÉE (le minerai qui attend) et une RÉSERVE (ce qu'il a fabriqué). Le
// minerai arrive par les rails (un wagonnet de la mine ou de la foreuse, voir wagonnet.ts) ou à la
// main (« Apporter », depuis le coffre de la mine). Les lingots et les bijoux se vendent d'un clic,
// ou partent au marché avec un wagonnet. Dans le rayon du générateur allumé, ils vont plus vite.
// Un atelier n'accepte que ce qu'il sait transformer : la fonderie le fer et l'or, la joaillerie
// les gemmes (LINGOT_DE et BIJOU_DE, dans donnees.ts).

import {
  BIJOU_DE,
  BLOCS,
  LINGOT_DE,
  NIVEAUX_FONDERIE,
  NIVEAUX_JOAILLERIE,
  SECONDES_PAR_BIJOU,
  SECONDES_PAR_CHARBON_FONDERIE,
  type IdBloc,
} from './donnees'
import { atelierAlimente, multiplicateurGenerateur } from './generateur'
import { multiplicateurEmployes, multiplicateurProduction } from './gemmes'
import { nombre, t } from './langue'
import { debloque } from './niveaux'
import {
  ajouterA,
  disponible,
  encaisser,
  garderDansLeCoffre,
  parPrix,
  payer,
  payerMateriaux,
  peutPayer,
  rangerDansCoffre,
  retirerDe,
  totalObjets,
  valeurDe,
  type Atelier,
  type EtatJeu,
  type Employe,
  type Inventaire,
} from './mineur'
import { batimentPose } from './village'

export type IdAtelier = 'fonderie' | 'joaillerie'

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

export function atelierDe(etat: EtatJeu, id: IdAtelier): Atelier {
  return id === 'fonderie' ? etat.fonderie : etat.joaillerie
}

export function atelierPose(etat: EtatJeu, id: IdAtelier): boolean {
  return batimentPose(etat.village, id) !== null
}

// Ce que l'atelier fait de cet objet (le lingot, le bijou), ou null s'il ne l'accepte pas.
export function produitDe(id: IdAtelier, bloc: IdBloc): IdBloc | null {
  return (id === 'fonderie' ? LINGOT_DE[bloc] : BIJOU_DE[bloc]) ?? null
}

export function accepte(id: IdAtelier, bloc: IdBloc): boolean {
  return produitDe(id, bloc) !== null
}

// Tout ce que l'atelier accepte (fer et or ; ou les quatre gemmes).
export function objetsAcceptes(id: IdAtelier): IdBloc[] {
  return Object.keys(id === 'fonderie' ? LINGOT_DE : BIJOU_DE) as IdBloc[]
}

// Le niveau de l'atelier (sa vitesse, ses places...).
export function infoFonderie(etat: EtatJeu) {
  return NIVEAUX_FONDERIE[Math.min(etat.fonderie.niveau, NIVEAUX_FONDERIE.length - 1)]
}

export function infoJoaillerie(etat: EtatJeu) {
  return NIVEAUX_JOAILLERIE[Math.min(etat.joaillerie.niveau, NIVEAUX_JOAILLERIE.length - 1)]
}

// Les places de l'entrée, et celles de la réserve (le même nombre).
export function placesAtelier(etat: EtatJeu, id: IdAtelier): number {
  return id === 'fonderie' ? infoFonderie(etat).stock : infoJoaillerie(etat).stock
}

export function nbEntree(etat: EtatJeu, id: IdAtelier): number {
  return totalObjets(atelierDe(etat, id).entree)
}

export function nbSortie(etat: EtatJeu, id: IdAtelier): number {
  return totalObjets(atelierDe(etat, id).sortie)
}

// La place qui reste à l'entrée (ce qu'un wagonnet peut encore y livrer).
export function placeEntree(etat: EtatJeu, id: IdAtelier): number {
  if (!atelierPose(etat, id)) return 0
  return Math.max(0, placesAtelier(etat, id) - nbEntree(etat, id))
}

export function sortiePleine(etat: EtatJeu, id: IdAtelier): boolean {
  return nbSortie(etat, id) >= placesAtelier(etat, id)
}

// L'objet le plus cher de l'entrée (on le transforme en premier), ou null si elle est vide.
function plusCher(entree: Inventaire): IdBloc | null {
  return parPrix(entree)[0]?.[0] ?? null
}

// --- La fonderie ---

// Les lingots par seconde, en ce moment : plus vite dans le rayon du générateur allumé, et deux
// fois plus vite avec le bonus « production » de la boutique.
export function vitesseFonderie(etat: EtatJeu): number {
  const courant = atelierAlimente(etat, 'fonderie') ? multiplicateurGenerateur(etat) : 1
  return infoFonderie(etat).vitesse * courant * multiplicateurProduction(etat)
}

// Le charbon que le four garde au plus, et combien en manquent pour le remplir.
export function charbonMaxFonderie(etat: EtatJeu): number {
  return infoFonderie(etat).reservoir
}

export function placeCharbonFonderie(etat: EtatJeu): number {
  if (!atelierPose(etat, 'fonderie')) return 0
  return Math.max(0, Math.floor((charbonMaxFonderie(etat) * SECONDES_PAR_CHARBON_FONDERIE - etat.fonderie.carburant) / SECONDES_PAR_CHARBON_FONDERIE))
}

// Elle fond en ce moment : du charbon, du minerai, et de la place pour les lingots.
export function fonderieEnMarche(etat: EtatJeu): boolean {
  return atelierPose(etat, 'fonderie') && etat.fonderie.carburant > 0 && nbEntree(etat, 'fonderie') > 0 && !sortiePleine(etat, 'fonderie')
}

// --- La joaillerie et ses joailliers ---

export function joailliers(etat: EtatJeu): Employe[] {
  return etat.employes.filter((e) => e.role === 'joaillier')
}

// Combien de joailliers peuvent y travailler (ses établis) : 0 sans joaillerie.
export function maxJoailliers(etat: EtatJeu): number {
  return atelierPose(etat, 'joaillerie') ? infoJoaillerie(etat).etablis : 0
}

// Combien de bijoux par seconde taille ce joaillier : ses outils (le niveau de la joaillerie), sa
// rareté, le courant du générateur et le bonus « Employés × 2 » de la boutique.
// « rendement » : sa rareté (×1 pour un commun, ×5 pour un mythique).
export function vitesseJoaillier(etat: EtatJeu, rendement: number): number {
  const courant = atelierAlimente(etat, 'joaillerie') ? multiplicateurGenerateur(etat) : 1
  return (infoJoaillerie(etat).vitesse * rendement * courant * multiplicateurEmployes(etat)) / SECONDES_PAR_BIJOU
}

// Ce joaillier est-il à son établi, payé ?
export function joaillierAuTravail(employe: Employe): boolean {
  return employe.role === 'joaillier' && employe.etape === 'taille' && employe.tempsPaye > 0
}

// La gemme que ce joaillier est en train de tailler (null : il n'en a pas).
export function gemmeEnCours(employe: Employe): IdBloc | null {
  return (Object.keys(employe.sac)[0] as IdBloc | undefined) ?? null
}

// Au moins un joaillier taille une gemme.
export function joaillerieEnMarche(etat: EtatJeu): boolean {
  return joailliers(etat).some((e) => joaillierAuTravail(e) && gemmeEnCours(e) !== null)
}

// ---------------------------------------------------------------------------
// Les niveaux
// ---------------------------------------------------------------------------

export function prochainNiveauAtelier(etat: EtatJeu, id: IdAtelier) {
  const niveau = atelierDe(etat, id).niveau + 1
  return (id === 'fonderie' ? NIVEAUX_FONDERIE[niveau] : NIVEAUX_JOAILLERIE[niveau]) ?? null
}

export function peutAmeliorerAtelier(etat: EtatJeu, id: IdAtelier): boolean {
  const prochain = prochainNiveauAtelier(etat, id)
  return atelierPose(etat, id) && prochain !== null && debloque(etat, id, atelierDe(etat, id).niveau + 1) && peutPayer(etat, prochain.cout)
}

export function ameliorerAtelier(etat: EtatJeu, id: IdAtelier): string[] {
  const prochain = prochainNiveauAtelier(etat, id)
  if (prochain === null || !peutAmeliorerAtelier(etat, id)) return []
  payer(etat, prochain.cout)
  atelierDe(etat, id).niveau += 1
  if (id === 'fonderie') {
    const info = infoFonderie(etat)
    return [t('🏭 Fonderie niveau {n} : {vitesse} lingot(s) par seconde, {places} places.', { n: etat.fonderie.niveau + 1, vitesse: nombre(info.vitesse, 1), places: info.stock })]
  }
  const info = infoJoaillerie(etat)
  return [t('🏪 Joaillerie niveau {n} : {etablis} établi(s), outils ×{vitesse}, {places} places.', { n: etat.joaillerie.niveau + 1, etablis: info.etablis, vitesse: nombre(info.vitesse, 2), places: info.stock })]
}

// ---------------------------------------------------------------------------
// Remplir l'entrée et le four
// ---------------------------------------------------------------------------

// Un wagonnet arrive avec un chargement : l'atelier prend ce qu'il accepte, tant qu'il y a de la
// place (et la fonderie met le charbon dans son four). Rend ce qui n'a pas trouvé de place.
export function livrerAtelier(etat: EtatJeu, id: IdAtelier, chargement: Inventaire): Inventaire {
  const atelier = atelierDe(etat, id)
  const reste: Inventaire = {}
  for (const [bloc, n] of parPrix(chargement)) {
    let nombre = n
    if (id === 'fonderie' && bloc === 'charbon') {
      const mis = Math.min(nombre, placeCharbonFonderie(etat))
      atelier.carburant += mis * SECONDES_PAR_CHARBON_FONDERIE
      nombre -= mis
    } else if (accepte(id, bloc)) {
      const mis = Math.min(nombre, placeEntree(etat, id))
      ajouterA(atelier.entree, bloc, mis)
      nombre -= mis
    }
    if (nombre > 0) ajouterA(reste, bloc, nombre)
  }
  return reste
}

// « Apporter » (à la main, depuis le coffre de la mine) : ce minerai va dans l'entrée de l'atelier,
// tant qu'il y a de la place. Ce que le joueur garde dans le coffre (📌) reste dans le coffre.
export function apporterAuAtelier(etat: EtatJeu, id: IdAtelier, bloc: IdBloc): string[] {
  if (!atelierPose(etat, id) || !accepte(id, bloc)) return []
  const dispo = Math.max(0, disponible(etat, bloc) - garderDansLeCoffre(etat, bloc))
  const mis = Math.min(dispo, placeEntree(etat, id))
  if (mis <= 0) return placeEntree(etat, id) === 0 ? [t('📥 L’entrée est pleine.')] : []
  payerMateriaux(etat, { [bloc]: mis })
  ajouterA(atelierDe(etat, id).entree, bloc, mis)
  return [t('📥 +{n} {nom} apporté(s).', { n: mis, nom: t(BLOCS[bloc].nom).toLowerCase() })]
}

// Remplit le four de la fonderie avec le charbon du coffre de la mine.
export function remplirFonderie(etat: EtatJeu): string[] {
  if (!atelierPose(etat, 'fonderie')) return []
  const mis = Math.min(disponible(etat, 'charbon'), placeCharbonFonderie(etat))
  if (mis <= 0) return placeCharbonFonderie(etat) === 0 ? [t('🔥 Le four de la fonderie est plein.')] : [t('⚫ Il te faut du charbon dans le coffre de la mine.')]
  payerMateriaux(etat, { charbon: mis })
  etat.fonderie.carburant += mis * SECONDES_PAR_CHARBON_FONDERIE
  return [t('🔥 +{n} charbon dans le four.', { n: mis })]
}

// ---------------------------------------------------------------------------
// Vendre ce qui est fabriqué
// ---------------------------------------------------------------------------

export function retirerDeLaSortie(etat: EtatJeu, id: IdAtelier, bloc: IdBloc, nombre: number): void {
  retirerDe(atelierDe(etat, id).sortie, bloc, nombre)
}

// Vend la réserve de l'atelier (« lot » : combien de chaque objet ; sans lot, tout), au prix du marché.
export function vendreSortie(etat: EtatJeu, id: IdAtelier, lot?: Inventaire): string[] {
  const atelier = atelierDe(etat, id)
  const vendus: Inventaire = {}
  for (const [bloc, n] of parPrix(atelier.sortie)) {
    const pris = Math.min(n, lot ? Math.floor(lot[bloc] ?? 0) : Infinity)
    if (pris > 0) vendus[bloc] = pris
  }
  const gain = valeurDe(vendus, etat)
  if (gain <= 0) return []
  for (const [bloc, n] of Object.entries(vendus)) retirerDe(atelier.sortie, bloc as IdBloc, n ?? 0)
  encaisser(etat, gain)
  return [id === 'fonderie' ? t('💰 Lingots vendus : +{gain} $', { gain: nombre(gain) }) : t('💰 Bijoux vendus : +{gain} $', { gain: nombre(gain) })]
}

// ---------------------------------------------------------------------------
// Le travail, seconde après seconde
// ---------------------------------------------------------------------------

export function avancerFonderie(etat: EtatJeu, secondes: number): string[] {
  const f = etat.fonderie
  if (!atelierPose(etat, 'fonderie')) return []
  let reste = secondes
  let etapes = 0
  while (reste > 1e-9 && fonderieEnMarche(etat) && etapes++ < 10000) {
    const vitesse = vitesseFonderie(etat)
    const temps = Math.min(reste, f.carburant, Math.max(0, (1 - f.progression) / vitesse))
    reste -= temps
    f.carburant = Math.max(0, f.carburant - temps)
    f.progression += temps * vitesse
    if (f.progression >= 1 - 1e-9) {
      f.progression = 0
      const minerai = plusCher(f.entree)
      const lingot = minerai ? produitDe('fonderie', minerai) : null
      if (minerai && lingot) {
        retirerDe(f.entree, minerai, 1)
        ajouterA(f.sortie, lingot, 1)
        f.fabriques += 1
      }
    }
    if (temps <= 1e-12 && f.progression < 1) break
  }
  return []
}

export function avancerJoaillerie(etat: EtatJeu, secondes: number, rendementDe: (e: Employe) => number): string[] {
  const j = etat.joaillerie
  const pose = atelierPose(etat, 'joaillerie')
  for (const employe of joailliers(etat)) {
    // Parti de son établi (plus payé, la joaillerie retirée...) : sa gemme retourne à l'entrée.
    if (!pose || !joaillierAuTravail(employe)) {
      const gemme = gemmeEnCours(employe)
      if (gemme) {
        if (pose) ajouterA(j.entree, gemme, 1)
        else rangerDansCoffre(etat, gemme, 1)
        employe.sac = {}
        employe.progression = 0
      }
      continue
    }
    let reste = secondes
    let etapes = 0
    while (reste > 1e-9 && etapes++ < 10000) {
      if (gemmeEnCours(employe) === null) {
        const gemme = plusCher(j.entree)
        if (!gemme) break // plus rien à tailler : il attend
        retirerDe(j.entree, gemme, 1)
        employe.sac = { [gemme]: 1 }
        employe.progression = 0
      }
      const vitesse = vitesseJoaillier(etat, rendementDe(employe))
      const temps = Math.min(reste, Math.max(0, (1 - employe.progression) / vitesse))
      reste -= temps
      employe.progression = Math.min(1, employe.progression + temps * vitesse)
      if (employe.progression < 1 - 1e-9) break
      // Le bijou est fini : il le pose dans la réserve (si elle est pleine, il attend).
      if (sortiePleine(etat, 'joaillerie')) break
      const gemme = gemmeEnCours(employe)
      const bijou = gemme ? produitDe('joaillerie', gemme) : null
      if (bijou) ajouterA(j.sortie, bijou, 1)
      employe.sac = {}
      employe.progression = 0
      j.fabriques += 1
    }
  }
  return []
}

// ---------------------------------------------------------------------------
// Ce que rapportent les ateliers (pour le « +X/s » et le bilan)
// ---------------------------------------------------------------------------

// Ce qu'un atelier fabrique par seconde en ce moment (les lingots ; les bijoux des joailliers qui
// taillent). « rendementDe » : la rareté d'un joaillier (×1 commun... ×5 mythique).
export function fabriqueParSeconde(etat: EtatJeu, id: IdAtelier, rendementDe: (e: Employe) => number): number {
  if (id === 'fonderie') return fonderieEnMarche(etat) ? vitesseFonderie(etat) : 0
  return joailliers(etat)
    .filter((e) => joaillierAuTravail(e) && gemmeEnCours(e) !== null)
    .reduce((total, e) => total + vitesseJoaillier(etat, rendementDe(e)), 0)
}

// Ce que l'atelier ajoute en moyenne à chaque objet transformé : le prix du lingot (ou du bijou)
// moins celui du minerai, pondéré par ce qui attend à l'entrée (ou, entrée vide, à parts égales).
export function plusValueMoyenne(etat: EtatJeu, id: IdAtelier): number {
  const entree = atelierDe(etat, id).entree
  const liste = Object.keys(entree).length > 0 ? (Object.entries(entree) as [IdBloc, number][]) : objetsAcceptes(id).map((b): [IdBloc, number] => [b, 1])
  let total = 0
  let nombreTotal = 0
  for (const [bloc, n] of liste) {
    const produit = produitDe(id, bloc)
    if (!produit || n <= 0) continue
    total += (BLOCS[produit].prix - BLOCS[bloc].prix) * n
    nombreTotal += n
  }
  return nombreTotal > 0 ? total / nombreTotal : 0
}

// Ce que l'atelier ajoute par seconde (sa plus-value), en ce moment.
export function plusValueParSeconde(etat: EtatJeu, id: IdAtelier, rendementDe: (e: Employe) => number): number {
  return fabriqueParSeconde(etat, id, rendementDe) * plusValueMoyenne(etat, id)
}

// Ce que l'atelier a de quoi faire, pour les bulles et les tâches : « ⚫ plus de charbon »,
// « plein », « personne au travail »...
export function besoinCharbonFonderie(etat: EtatJeu): boolean {
  return atelierPose(etat, 'fonderie') && etat.fonderie.carburant <= 0 && nbEntree(etat, 'fonderie') > 0
}
