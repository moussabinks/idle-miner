// La foreuse (niveau 2 de la mine) : un bâtiment qui creuse tout seul.
// On la remplit de charbon ; tant qu'elle en a, elle fore des blocs du niveau de la mine et les
// met dans son chariot, qu'on vend d'un clic (ou qu'un wagonnet emporte au marché). Dans le rayon du
// générateur allumé, elle fore plus vite (22/10).

import type { Aleatoire } from './aleatoire'
import {
  NIVEAUX_CHARIOT,
  NIVEAUX_FORAGE,
  SECONDES_PAR_CHARBON,
  type IdBloc,
} from './donnees'
import { foreuseAlimentee, multiplicateurGenerateur } from './generateur'
import { tirerBloc } from './mine'
import { disponible, encaisser, garderDansLeCoffre, payer, payerMateriaux, peutPayer, valeurDe, type EtatJeu, type Inventaire } from './mineur'
import { multiplicateurProduction } from './gemmes'
import { nombre, t } from './langue'
import { batimentPose } from './village'
import { debloque } from './niveaux'

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

export function foreusePosee(etat: EtatJeu): boolean {
  return batimentPose(etat.village, 'foreuse') !== null
}

// La vitesse de forage sans électricité (blocs par seconde).
export function vitesseForageDeBase(etat: EtatJeu): number {
  return NIVEAUX_FORAGE[etat.foreuse.niveauVitesse].vitesse
}

// La vitesse en ce moment : plus vite dans le rayon du générateur allumé (+ 30 % à + 75 %).
// (25/10) Et deux fois plus vite avec le bonus « production » de la boutique.
export function vitesseForage(etat: EtatJeu): number {
  const bonus = foreuseAlimentee(etat) ? multiplicateurGenerateur(etat) : 1
  return vitesseForageDeBase(etat) * bonus * multiplicateurProduction(etat)
}

export function capaciteChariot(etat: EtatJeu): number {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot].capacite
}

export function secondesDeCharbon(etat: EtatJeu): number {
  return etat.foreuse.carburant
}

// Le réservoir : le charbon qu'elle peut garder au plus (plus grand à chaque niveau de forage).
export function charbonMaxForeuse(etat: EtatJeu): number {
  return NIVEAUX_FORAGE[etat.foreuse.niveauVitesse].reservoir
}

// Combien de charbons manquent pour remplir le réservoir.
export function placeCharbonForeuse(etat: EtatJeu): number {
  return Math.max(0, Math.floor((charbonMaxForeuse(etat) * SECONDES_PAR_CHARBON - etat.foreuse.carburant) / SECONDES_PAR_CHARBON))
}

// Le charbon arrivé par les rails : il remplit le réservoir, et le surplus va dans le chariot
// (un wagonnet Foreuse → Marché pourra le vendre). Rend ce qui n'a pas trouvé de place.
export function livrerCharbon(etat: EtatJeu, nombre: number): number {
  const dansLeReservoir = Math.min(nombre, placeCharbonForeuse(etat))
  etat.foreuse.carburant += dansLeReservoir * SECONDES_PAR_CHARBON
  const dansLeChariot = Math.min(nombre - dansLeReservoir, Math.max(0, capaciteChariot(etat) - nbDansChariot(etat)))
  if (dansLeChariot > 0) etat.foreuse.chariot.charbon = (etat.foreuse.chariot.charbon ?? 0) + dansLeChariot
  return nombre - dansLeReservoir - dansLeChariot
}

export function nbDansChariot(etat: EtatJeu): number {
  let total = 0
  for (const nombre of Object.values(etat.foreuse.chariot)) total += nombre ?? 0
  return total
}

export function chariotPlein(etat: EtatJeu): boolean {
  return nbDansChariot(etat) >= capaciteChariot(etat)
}

export function foreuseEnMarche(etat: EtatJeu): boolean {
  return foreusePosee(etat) && etat.foreuse.carburant > 0 && !chariotPlein(etat)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

// Met du charbon (du coffre de la mine) dans la foreuse (nombre = Infinity : tout),
// sans dépasser son réservoir.
export function remplirForeuse(etat: EtatJeu, nombre: number): string[] {
  if (!foreusePosee(etat)) return []
  // (26/10) Ce que le joueur garde 📌 dans le coffre reste dans le coffre.
  const mis = Math.min(nombre, Math.max(0, disponible(etat, 'charbon') - garderDansLeCoffre(etat, 'charbon')), placeCharbonForeuse(etat))
  if (mis <= 0) return placeCharbonForeuse(etat) === 0 && disponible(etat, 'charbon') > 0 ? [t('🔥 Le réservoir de la foreuse est plein.')] : []
  payerMateriaux(etat, { charbon: mis })
  etat.foreuse.carburant += mis * SECONDES_PAR_CHARBON
  return [t('🔥 +{n} charbon dans la foreuse.', { n: mis })]
}

export function prochainNiveauForage(etat: EtatJeu) {
  return NIVEAUX_FORAGE[etat.foreuse.niveauVitesse + 1] ?? null
}

export function prochainNiveauChariot(etat: EtatJeu) {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot + 1] ?? null
}

export function peutAmeliorerForage(etat: EtatJeu): boolean {
  const prochain = prochainNiveauForage(etat)
  return foreusePosee(etat) && prochain !== null && debloque(etat, 'forage', etat.foreuse.niveauVitesse + 1) && peutPayer(etat, prochain.cout)
}

export function peutAmeliorerChariot(etat: EtatJeu): boolean {
  const prochain = prochainNiveauChariot(etat)
  return foreusePosee(etat) && prochain !== null && debloque(etat, 'chariot', etat.foreuse.niveauChariot + 1) && peutPayer(etat, prochain.cout)
}

export function ameliorerForage(etat: EtatJeu): string[] {
  const prochain = prochainNiveauForage(etat)
  if (prochain === null || !peutAmeliorerForage(etat)) return []
  payer(etat, prochain.cout)
  etat.foreuse.niveauVitesse += 1
  return [t('⚙️ Foreuse plus rapide : {vitesse} blocs par seconde, {reservoir} charbons de réservoir.', { vitesse: prochain.vitesse, reservoir: prochain.reservoir })]
}

export function ameliorerChariot(etat: EtatJeu): string[] {
  const prochain = prochainNiveauChariot(etat)
  if (prochain === null || !peutAmeliorerChariot(etat)) return []
  payer(etat, prochain.cout)
  etat.foreuse.niveauChariot += 1
  return [t('🛒 Chariot de la foreuse plus grand : {places} places.', { places: prochain.capacite })]
}

// (25/10) Le chariot se vend sur place, d'un clic, au prix du marché (« lot » : combien de
// chaque objet ; sans lot, tout). Un wagonnet Foreuse → Marché le vend aussi tout seul.
export function vendreChariot(etat: EtatJeu, lot?: Inventaire): string[] {
  const vendus: Inventaire = {}
  for (const [id, nombre] of Object.entries(etat.foreuse.chariot)) {
    const bloc = id as IdBloc
    const n = Math.min(nombre ?? 0, lot ? Math.floor(lot[bloc] ?? 0) : Infinity)
    if (n > 0) vendus[bloc] = n
  }
  const gain = valeurDe(vendus, etat)
  if (gain <= 0) return []
  for (const [bloc, n] of Object.entries(vendus)) retirerDuChariot(etat, bloc as IdBloc, n ?? 0)
  encaisser(etat, gain)
  etat.stats.argentForeuse += gain
  return [t('💰 Chariot de la foreuse vendu : +{gain} $', { gain: nombre(gain) })]
}

export function retirerDuChariot(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  const reste = (etat.foreuse.chariot[bloc] ?? 0) - nombre
  if (reste > 0) etat.foreuse.chariot[bloc] = reste
  else delete etat.foreuse.chariot[bloc]
}

// ---------------------------------------------------------------------------
// Le forage, seconde après seconde
// ---------------------------------------------------------------------------

export function avancerForeuse(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  const foreuse = etat.foreuse
  if (!foreuseEnMarche(etat)) return []
  let reste = secondes
  while (reste > 0 && foreuseEnMarche(etat)) {
    const vitesse = vitesseForage(etat)
    const place = capaciteChariot(etat) - nbDansChariot(etat)
    const temps = Math.min(reste, secondesDeCharbon(etat), Math.max(0, (place - foreuse.progression) / vitesse))
    if (temps <= 0) break
    reste -= temps
    foreuse.carburant -= temps
    if (foreuse.carburant < 1e-9) foreuse.carburant = 0
    foreuse.progression += temps * vitesse
    while (foreuse.progression >= 1 && !chariotPlein(etat)) {
      foreuse.progression -= 1
      const bloc = tirerBloc(etat.niveauMine, aleatoire)
      foreuse.blocsFores += 1
      etat.stats.blocsForeuse += 1
      // (23/10 : plus de recharge automatique avec le charbon qu'elle fore : son charbon arrive
      // par les rails, avec le wagonnet Mine → Foreuse, ou à la main)
      foreuse.chariot[bloc] = (foreuse.chariot[bloc] ?? 0) + 1
    }
  }
  if (chariotPlein(etat)) {
    foreuse.progression = 0
    return [t('🛒 Le chariot de la foreuse est plein : viens le vider.')]
  }
  if (foreuse.carburant <= 0) return [t('🔥 La foreuse n’a plus de charbon.')]
  return []
}
