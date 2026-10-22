// La foreuse (niveau 2 de la mine) : un bâtiment qui creuse tout seul.
// On la remplit de charbon ; tant qu'elle en a, elle fore des blocs du niveau de la mine et les
// met dans son chariot, qu'on vient vider (vendre, ou mettre dans le sac). Dans le rayon du
// générateur allumé, elle fore plus vite (22/10).

import type { Aleatoire } from './aleatoire'
import {
  BONUS_ELECTRIQUE_FOREUSE,
  NIVEAUX_CHARIOT,
  NIVEAUX_FORAGE,
  NIVEAU_RECHARGE_AUTO,
  RESERVE_RECHARGE_AUTO,
  SECONDES_PAR_CHARBON,
  type IdBloc,
} from './donnees'
import { foreuseAlimentee, puissanceGenerateur } from './generateur'
import { tirerBloc } from './mine'
import { disponible, encaisser, payer, payerMateriaux, peutPayer, placeLibre, ramasser, valeurDe, type EtatJeu, type Inventaire } from './mineur'
import { batimentPose } from './village'

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

// La vitesse en ce moment : plus vite dans le rayon du générateur allumé.
export function vitesseForage(etat: EtatJeu): number {
  const bonus = foreuseAlimentee(etat) ? 1 + BONUS_ELECTRIQUE_FOREUSE * puissanceGenerateur(etat) : 1
  return vitesseForageDeBase(etat) * bonus
}

export function capaciteChariot(etat: EtatJeu): number {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot].capacite
}

export function secondesDeCharbon(etat: EtatJeu): number {
  return etat.foreuse.carburant
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

// Combien de temps elle met pour remplir son chariot vide (pour voir si chariot et forage vont ensemble).
export function secondesPourRemplir(etat: EtatJeu, niveauChariot = etat.foreuse.niveauChariot): number {
  return NIVEAUX_CHARIOT[niveauChariot].capacite / vitesseForage(etat)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

// Met du charbon (du sac, puis du coffre de la mine) dans la foreuse (nombre = Infinity : tout).
export function remplirForeuse(etat: EtatJeu, nombre: number): string[] {
  if (!foreusePosee(etat)) return []
  const mis = Math.min(nombre, disponible(etat, 'charbon'))
  if (mis <= 0) return []
  payerMateriaux(etat, { charbon: mis })
  etat.foreuse.carburant += mis * SECONDES_PAR_CHARBON
  return [`🔥 +${mis} charbon dans la foreuse.`]
}

export function prochainNiveauForage(etat: EtatJeu) {
  return NIVEAUX_FORAGE[etat.foreuse.niveauVitesse + 1] ?? null
}

export function prochainNiveauChariot(etat: EtatJeu) {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot + 1] ?? null
}

export function peutAmeliorerForage(etat: EtatJeu): boolean {
  const prochain = prochainNiveauForage(etat)
  return foreusePosee(etat) && prochain !== null && peutPayer(etat, prochain.cout)
}

export function peutAmeliorerChariot(etat: EtatJeu): boolean {
  const prochain = prochainNiveauChariot(etat)
  return foreusePosee(etat) && prochain !== null && peutPayer(etat, prochain.cout)
}

export function ameliorerForage(etat: EtatJeu): string[] {
  const prochain = prochainNiveauForage(etat)
  if (prochain === null || !peutAmeliorerForage(etat)) return []
  payer(etat, prochain.cout)
  etat.foreuse.niveauVitesse += 1
  return [`⚙️ Foreuse plus rapide : ${prochain.vitesse} blocs par seconde.`]
}

export function ameliorerChariot(etat: EtatJeu): string[] {
  const prochain = prochainNiveauChariot(etat)
  if (prochain === null || !peutAmeliorerChariot(etat)) return []
  payer(etat, prochain.cout)
  etat.foreuse.niveauChariot += 1
  return [`🛒 Chariot plus grand : ${prochain.capacite} places.`]
}

// Les objets cochés du chariot (ceux qu'on vend ou qu'on met dans le sac).
export function selectionChariot(etat: EtatJeu): Inventaire {
  const selection: Inventaire = {}
  for (const [id, nombre] of Object.entries(etat.foreuse.chariot)) {
    const bloc = id as IdBloc
    if (!etat.foreuse.nonCoches.includes(bloc) && (nombre ?? 0) > 0) selection[bloc] = nombre
  }
  return selection
}

export function basculerChariot(etat: EtatJeu, bloc: IdBloc): string[] {
  const nonCoches = etat.foreuse.nonCoches
  etat.foreuse.nonCoches = nonCoches.includes(bloc) ? nonCoches.filter((b) => b !== bloc) : [...nonCoches, bloc]
  return []
}

export function cocherToutChariot(etat: EtatJeu, coche: boolean): string[] {
  etat.foreuse.nonCoches = coche ? [] : (Object.keys(etat.foreuse.chariot) as IdBloc[])
  return []
}

export function rechargeAutoDisponible(etat: EtatJeu): boolean {
  return etat.foreuse.niveauVitesse >= NIVEAU_RECHARGE_AUTO
}

export function basculerRechargeAuto(etat: EtatJeu): string[] {
  if (!rechargeAutoDisponible(etat)) return []
  etat.foreuse.rechargeAuto = !etat.foreuse.rechargeAuto
  return []
}

// Vend les objets cochés du chariot (les autres restent dedans).
export function vendreChariot(etat: EtatJeu): string[] {
  const aVendre = selectionChariot(etat)
  const gain = valeurDe(aVendre)
  if (gain === 0) return []
  for (const [bloc, nombre] of Object.entries(aVendre)) retirerDuChariot(etat, bloc as IdBloc, nombre ?? 0)
  encaisser(etat, gain)
  etat.stats.argentForeuse += gain
  return [`💰 Chariot vendu : +${gain} $`]
}

// Met les objets cochés du chariot dans le sac (tant qu'il y a de la place).
export function viderChariotDansSac(etat: EtatJeu): string[] {
  let pris = 0
  for (const [id, nombre] of Object.entries(selectionChariot(etat))) {
    const bloc = id as IdBloc
    const aPrendre = Math.min(nombre ?? 0, placeLibre(etat))
    if (aPrendre <= 0) continue
    ramasser(etat, bloc, aPrendre)
    retirerDuChariot(etat, bloc, aPrendre)
    pris += aPrendre
  }
  return pris > 0 ? [`🎒 ${pris} objets du chariot mis dans ton sac.`] : ['🎒 Ton sac est plein.']
}

export function retirerDuChariot(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  const reste = (etat.foreuse.chariot[bloc] ?? 0) - nombre
  if (reste > 0) etat.foreuse.chariot[bloc] = reste
  else delete etat.foreuse.chariot[bloc]
}

export function valeurChariot(etat: EtatJeu): number {
  return valeurDe(etat.foreuse.chariot)
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
      if (bloc === 'charbon' && foreuse.rechargeAuto && rechargeAutoDisponible(etat) && secondesDeCharbon(etat) < RESERVE_RECHARGE_AUTO) {
        foreuse.carburant += SECONDES_PAR_CHARBON
      } else {
        foreuse.chariot[bloc] = (foreuse.chariot[bloc] ?? 0) + 1
      }
    }
  }
  if (chariotPlein(etat)) {
    foreuse.progression = 0
    return ['🛒 Le chariot de la foreuse est plein : viens le vider.']
  }
  if (foreuse.carburant <= 0) return ['🔥 La foreuse n’a plus de charbon.']
  return []
}
