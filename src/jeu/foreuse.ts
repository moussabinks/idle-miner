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
  profondeurBedrock,
  SECONDES_PAR_CHARBON,
  niveauMaxAuPrestige,
  prestigePourNiveau,
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
  uneNouvelleForeuse,
  valeurDe,
  type EtatJeu,
  type Inventaire,
  type UneForeuse,
} from './mineur'

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

export function foreuseDebloquee(etat: EtatJeu): boolean {
  return etat.prestige >= PRESTIGE_FOREUSE
}

// Le nombre de foreuses.
export function nbForeuses(etat: EtatJeu): number {
  return etat.foreuse.foreuses.length
}

// La vitesse d'une foreuse (blocs par seconde), selon son niveau de forage.
export function vitesseUneForeuse(etat: EtatJeu, une: UneForeuse): number {
  return NIVEAUX_FORAGE[une.niveauVitesse].vitesse * multiplicateurForage(etat)
}

// La vitesse de toutes les foreuses ensemble (blocs par seconde).
export function vitesseForage(etat: EtatJeu): number {
  return etat.foreuse.foreuses.reduce((total, une) => total + vitesseUneForeuse(etat, une), 0)
}

// La profondeur de la foreuse la plus profonde (pour l'affichage).
export function profondeurForeuse(etat: EtatJeu): number {
  return Math.max(...etat.foreuse.foreuses.map((une) => une.profondeur))
}

export function capaciteChariot(etat: EtatJeu): number {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot].capacite * multiplicateurChariot(etat)
}

// Combien de secondes les foreuses tournent encore avec le charbon chargé
// (chaque foreuse brûle son charbon : à 3 foreuses, il part 3 fois plus vite).
export function secondesDeCharbon(etat: EtatJeu): number {
  return etat.foreuse.carburant / nbForeuses(etat)
}

// --- Plusieurs foreuses (prestige 3) ---

// Le nombre de foreuses qu'on peut avoir : 2 au prestige 3, 3 au prestige 4... (5 au plus).
export function maxForeuses(etat: EtatJeu): number {
  if (etat.prestige < PRESTIGE_FOREUSES_MULTIPLES) return 1
  return Math.min(1 + PRIX_FOREUSES_EN_PLUS.length, etat.prestige - 1)
}

export function prixProchaineForeuse(etat: EtatJeu): number | null {
  if (nbForeuses(etat) >= maxForeuses(etat)) return null
  return PRIX_FOREUSES_EN_PLUS[nbForeuses(etat) - 1] ?? null
}

// Une nouvelle foreuse arrive toute neuve : niveau de forage 0, et elle creuse son propre
// trou depuis la surface (on l'améliore ensuite comme les autres).
export function acheterForeuse(etat: EtatJeu): string[] {
  const prix = prixProchaineForeuse(etat)
  if (!aLaSurface(etat) || !etat.foreuse.active || prix === null || etat.argent < prix) return []
  etat.argent -= prix
  etat.foreuse.foreuses.push(uneNouvelleForeuse())
  return [`⚙️ Nouvelle foreuse ! Elle part de la surface, au premier niveau de forage. Tu en as ${nbForeuses(etat)}.`]
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

// Le prochain niveau de forage de la foreuse n° index (null si elle est au maximum).
export function prochainNiveauForage(etat: EtatJeu, index: number) {
  const une = etat.foreuse.foreuses[index]
  return une ? (NIVEAUX_FORAGE[une.niveauVitesse + 1] ?? null) : null
}

export function prochainNiveauChariot(etat: EtatJeu) {
  return NIVEAUX_CHARIOT[etat.foreuse.niveauChariot + 1] ?? null
}

// Le prochain niveau de forage (ou de chariot) est-il bloqué par le prestige ?
// Renvoie le prestige qu'il faut (null = pas bloqué).
export function forageBloqueAuPrestige(etat: EtatJeu, index: number): number | null {
  const une = etat.foreuse.foreuses[index]
  if (!une || prochainNiveauForage(etat, index) === null) return null
  const prochain = une.niveauVitesse + 1
  if (prochain <= niveauMaxAuPrestige('forage', etat.prestige)) return null
  return prestigePourNiveau('forage', prochain)
}

export function chariotBloqueAuPrestige(etat: EtatJeu): number | null {
  const prochain = etat.foreuse.niveauChariot + 1
  if (prochainNiveauChariot(etat) === null || prochain <= niveauMaxAuPrestige('chariot', etat.prestige)) return null
  return prestigePourNiveau('chariot', prochain)
}

export function peutAmeliorerForage(etat: EtatJeu, index: number): boolean {
  const prochain = prochainNiveauForage(etat, index)
  return etat.foreuse.active && prochain !== null && forageBloqueAuPrestige(etat, index) === null && peutPayer(etat, prochain.cout)
}

export function peutAmeliorerChariot(etat: EtatJeu): boolean {
  const prochain = prochainNiveauChariot(etat)
  return etat.foreuse.active && prochain !== null && chariotBloqueAuPrestige(etat) === null && peutPayer(etat, prochain.cout)
}

// Améliore la vitesse de la foreuse n° index (chaque foreuse s'améliore séparément).
export function ameliorerForage(etat: EtatJeu, index: number): string[] {
  const prochain = prochainNiveauForage(etat, index)
  if (!aLaSurface(etat) || prochain === null || !peutAmeliorerForage(etat, index)) return []
  payer(etat, prochain.cout)
  etat.foreuse.foreuses[index].niveauVitesse += 1
  return [`⚙️ Foreuse ${index + 1} plus rapide : ${prochain.vitesse} blocs par seconde.`]
}

export function ameliorerChariot(etat: EtatJeu): string[] {
  const prochain = prochainNiveauChariot(etat)
  if (!aLaSurface(etat) || prochain === null || !peutAmeliorerChariot(etat)) return []
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

// Coche (ou décoche) d'un coup tous les objets du chariot.
export function cocherToutChariot(etat: EtatJeu, coche: boolean): string[] {
  etat.foreuse.nonCoches = coche ? [] : (Object.keys(etat.foreuse.chariot) as IdBloc[])
  return []
}

// Active ou coupe la recharge automatique au charbon (dès qu'une foreuse a le niveau 3 de forage).
export function rechargeAutoDisponible(etat: EtatJeu): boolean {
  return etat.foreuse.foreuses.some((une) => une.niveauVitesse >= NIVEAU_RECHARGE_AUTO)
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
  etat.stats.argentForeuse += gain
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
    const enCours = foreuse.foreuses.reduce((total, une) => total + une.progression, 0)
    const tempsPourRemplir = Math.max(0, (placeDansChariot - enCours) / vitesseForage(etat))
    const tempsDeForage = Math.min(reste, secondesDeCharbon(etat), tempsPourRemplir)
    if (tempsDeForage <= 0) break
    reste -= tempsDeForage
    foreuse.carburant -= tempsDeForage * nbForeuses(etat)
    if (foreuse.carburant < 1e-9) foreuse.carburant = 0 // pas de miette de charbon à cause des arrondis

    // Chaque foreuse avance à sa vitesse, dans son propre trou.
    for (const une of foreuse.foreuses) {
      une.progression += tempsDeForage * vitesseUneForeuse(etat, une)
      while (une.progression >= 1 && !chariotPlein(etat)) {
        une.progression -= 1
        const bloc = tirerBlocNormal(une.profondeur, aleatoire, etat.prestige)
        une.blocsFores += 1
        etat.stats.blocsForeuse += 1
        // Avec la recharge automatique, le charbon va dans le moteur tant que sa réserve est basse.
        if (bloc === 'charbon' && foreuse.rechargeAuto && rechargeAutoDisponible(etat) && secondesDeCharbon(etat) < RESERVE_RECHARGE_AUTO) {
          foreuse.carburant += SECONDES_PAR_CHARBON * multiplicateurCharbon(etat)
        } else {
          foreuse.chariot[bloc] = (foreuse.chariot[bloc] ?? 0) + 1
        }
        // Elle descend d'un mètre tous les 10 blocs, jusqu'à la bedrock.
        if (une.blocsFores % BLOCS_FORES_PAR_METRE === 0) {
          une.profondeur = Math.min(profondeurBedrock(etat.prestige) - 1, une.profondeur + 1)
        }
      }
    }
  }

  if (chariotPlein(etat)) {
    for (const une of foreuse.foreuses) une.progression = 0
    return ['🛒 Le chariot de la foreuse est plein : viens le vider au village.']
  }
  if (foreuse.carburant <= 0) return ['🔥 La foreuse n’a plus de charbon.']
  return []
}

// Valeur du chariot, pour l'affichage.
export function valeurChariot(etat: EtatJeu): number {
  return valeurDe(etat, etat.foreuse.chariot)
}
