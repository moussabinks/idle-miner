// La foreuse : un espace du village débloqué au prestige 1.
// On l'active une seule fois avec du fer et de la redstone, puis on la remplit
// de charbon. Tant qu'elle a du charbon, elle creuse toute seule et remonte ce
// qu'elle trouve dans un grand chariot, qu'on vide au village.

import type { Aleatoire } from './aleatoire'
import {
  BLOCS_FORES_PAR_METRE,
  COUT_ACTIVATION_FOREUSE,
  NIVEAUX_CHARIOT,
  NIVEAUX_FORAGE,
  NIVEAU_RECHARGE_AUTO,
  PRESTIGE_FOREUSE,
  PRESTIGE_FOREUSES_MULTIPLES,
  PRIX_FOREUSES_EN_PLUS,
  RESERVE_RECHARGE_AUTO,
  PROFONDEUR_BEDROCK,
  SECONDES_PAR_CHARBON,
  type IdBloc,
} from './donnees'
import { tirerBlocNormal } from './mine'
import { multiplicateurCharbon, multiplicateurChariot, multiplicateurForage } from './talents'
import {
  aLaSurface,
  payer,
  peutPayer,
  placeLibre,
  quantite,
  ramasser,
  retirer,
  valeurDe,
  type EtatJeu,
  type Inventaire,
} from './mineur'

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

export function foreuseDebloquee(etat: EtatJeu): boolean {
  return etat.prestige >= PRESTIGE_FOREUSE
}

// La vitesse de toutes les foreuses ensemble (blocs par seconde).
export function vitesseForage(etat: EtatJeu): number {
  return NIVEAUX_FORAGE[etat.foreuse.niveauVitesse].vitesse * multiplicateurForage(etat) * etat.foreuse.nombre
}

export function capaciteChariot(etat: EtatJeu): number {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot].capacite * multiplicateurChariot(etat)
}

// Combien de secondes les foreuses tournent encore avec le charbon chargé
// (chaque foreuse brûle son charbon : à 3 foreuses, il part 3 fois plus vite).
export function secondesDeCharbon(etat: EtatJeu): number {
  return etat.foreuse.carburant / etat.foreuse.nombre
}

// --- Plusieurs foreuses (prestige 3) ---

// Le nombre de foreuses qu'on peut avoir : 2 au prestige 3, 3 au prestige 4... (5 au plus).
export function maxForeuses(etat: EtatJeu): number {
  if (etat.prestige < PRESTIGE_FOREUSES_MULTIPLES) return 1
  return Math.min(1 + PRIX_FOREUSES_EN_PLUS.length, etat.prestige - 1)
}

export function prixProchaineForeuse(etat: EtatJeu): number | null {
  if (etat.foreuse.nombre >= maxForeuses(etat)) return null
  return PRIX_FOREUSES_EN_PLUS[etat.foreuse.nombre - 1] ?? null
}

export function acheterForeuse(etat: EtatJeu): string[] {
  const prix = prixProchaineForeuse(etat)
  if (!aLaSurface(etat) || !etat.foreuse.active || prix === null || etat.argent < prix) return []
  etat.argent -= prix
  etat.foreuse.nombre += 1
  return [`⚙️ Nouvelle foreuse ! Tu en as ${etat.foreuse.nombre} qui creusent ensemble.`]
}

export function nbDansChariot(etat: EtatJeu): number {
  let total = 0
  for (const nombre of Object.values(etat.foreuse.chariot)) total += nombre ?? 0
  return total
}

export function chariotPlein(etat: EtatJeu): boolean {
  return nbDansChariot(etat) >= capaciteChariot(etat)
}

// La foreuse tourne-t-elle en ce moment ?
export function foreuseEnMarche(etat: EtatJeu): boolean {
  return etat.foreuse.active && etat.foreuse.carburant > 0 && !chariotPlein(etat)
}

// ---------------------------------------------------------------------------
// Actions (au village)
// ---------------------------------------------------------------------------

export function peutActiverForeuse(etat: EtatJeu): boolean {
  return foreuseDebloquee(etat) && !etat.foreuse.active && peutPayer(etat, COUT_ACTIVATION_FOREUSE)
}

export function activerForeuse(etat: EtatJeu): string[] {
  if (!aLaSurface(etat) || !peutActiverForeuse(etat)) return []
  payer(etat, COUT_ACTIVATION_FOREUSE)
  etat.foreuse.active = true
  return ['⚙️ Foreuse activée ! Donne-lui du charbon pour qu’elle creuse.']
}

// Met du charbon du sac dans la foreuse (nombre = Infinity pour tout mettre).
export function remplirForeuse(etat: EtatJeu, nombre: number): string[] {
  if (!aLaSurface(etat) || !etat.foreuse.active) return []
  const mis = Math.min(nombre, quantite(etat, 'charbon'))
  if (mis <= 0) return []
  retirer(etat, 'charbon', mis)
  etat.foreuse.carburant += mis * SECONDES_PAR_CHARBON * multiplicateurCharbon(etat)
  return [`🔥 +${mis} charbon dans la foreuse.`]
}

export function prochainNiveauForage(etat: EtatJeu) {
  return NIVEAUX_FORAGE[etat.foreuse.niveauVitesse + 1] ?? null
}

export function prochainNiveauChariot(etat: EtatJeu) {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot + 1] ?? null
}

export function ameliorerForage(etat: EtatJeu): string[] {
  const prochain = prochainNiveauForage(etat)
  if (!aLaSurface(etat) || !etat.foreuse.active || prochain === null || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.foreuse.niveauVitesse += 1
  return [`⚙️ Forage plus rapide : ${prochain.vitesse} blocs par seconde.`]
}

export function ameliorerChariot(etat: EtatJeu): string[] {
  const prochain = prochainNiveauChariot(etat)
  if (!aLaSurface(etat) || !etat.foreuse.active || prochain === null || !peutPayer(etat, prochain.cout)) return []
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

// Coche ou décoche un objet du chariot.
export function basculerChariot(etat: EtatJeu, bloc: IdBloc): string[] {
  const nonCoches = etat.foreuse.nonCoches
  etat.foreuse.nonCoches = nonCoches.includes(bloc) ? nonCoches.filter((b) => b !== bloc) : [...nonCoches, bloc]
  return []
}

// Active ou coupe la recharge automatique au charbon (à partir du niveau 3 de forage).
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
  if (!aLaSurface(etat)) return []
  const aVendre = selectionChariot(etat)
  const gain = valeurDe(etat, aVendre)
  if (gain === 0) return []
  for (const [bloc, nombre] of Object.entries(aVendre)) retirerDuChariot(etat, bloc as IdBloc, nombre ?? 0)
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`💰 Chariot vendu : +${gain} $`]
}

// Met les objets cochés du chariot dans le sac (tant qu'il y a de la place).
export function viderChariotDansSac(etat: EtatJeu): string[] {
  if (!aLaSurface(etat)) return []
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

function retirerDuChariot(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
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

  // On avance par étapes : avec la recharge automatique, le charbon remonté pendant une
  // étape fait tourner la foreuse à l'étape suivante (utile après une longue absence).
  let reste = secondes
  while (reste > 0 && foreuseEnMarche(etat)) {
    // Elle ne fore que tant qu'il reste du charbon, et jusqu'à ce que le chariot soit plein
    // (le charbon n'est pas brûlé pour rien).
    const placeDansChariot = capaciteChariot(etat) - nbDansChariot(etat)
    const tempsPourRemplir = Math.max(0, (placeDansChariot - foreuse.progression) / vitesseForage(etat))
    const tempsDeForage = Math.min(reste, secondesDeCharbon(etat), tempsPourRemplir)
    if (tempsDeForage <= 0) break
    reste -= tempsDeForage
    foreuse.carburant -= tempsDeForage * foreuse.nombre
    if (foreuse.carburant < 1e-9) foreuse.carburant = 0 // pas de miette de charbon à cause des arrondis
    foreuse.progression += tempsDeForage * vitesseForage(etat)

    while (foreuse.progression >= 1 && !chariotPlein(etat)) {
      foreuse.progression -= 1
      const bloc = tirerBlocNormal(foreuse.profondeur, aleatoire)
      foreuse.blocsFores += 1
      // Avec la recharge automatique, le charbon va dans le moteur tant que sa réserve est basse.
      if (bloc === 'charbon' && foreuse.rechargeAuto && rechargeAutoDisponible(etat) && secondesDeCharbon(etat) < RESERVE_RECHARGE_AUTO) {
        foreuse.carburant += SECONDES_PAR_CHARBON * multiplicateurCharbon(etat)
      } else {
        foreuse.chariot[bloc] = (foreuse.chariot[bloc] ?? 0) + 1
      }
      // Elle descend d'un mètre tous les 10 blocs, jusqu'à la bedrock.
      if (foreuse.blocsFores % BLOCS_FORES_PAR_METRE === 0) {
        foreuse.profondeur = Math.min(PROFONDEUR_BEDROCK - 1, foreuse.profondeur + 1)
      }
    }
  }

  if (chariotPlein(etat)) {
    foreuse.progression = 0
    return ['🛒 Le chariot de la foreuse est plein : viens le vider au village.']
  }
  if (foreuse.carburant <= 0) return ['🔥 La foreuse n’a plus de charbon.']
  return []
}

// Valeur du chariot, pour l'affichage.
export function valeurChariot(etat: EtatJeu): number {
  return valeurDe(etat, etat.foreuse.chariot)
}
