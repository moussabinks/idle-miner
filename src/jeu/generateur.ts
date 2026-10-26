// Le générateur (22/10, niveau 2 de la mine) : il brûle de la redstone et accélère tout ce qui
// est dans son rayon (un cercle autour de lui, en cases), de + 30 % à + 75 % selon son niveau
// (23/10) :
//   - l'ascenseur de la mine, si la mine est dans le rayon (voir secondesTrajetMineur) ;
//   - les rails : si toutes les cases d'un trajet sont dans le rayon, son pousseur pousse le
//     wagonnet plus vite (voir wagonnet.ts) ;
//   - la foreuse : elle fore plus vite ;
//   - (26/10) la fonderie et la joaillerie : elles fondent et taillent plus vite.
// On le remplit de redstone (de son sac ou du coffre de la mine), à la main ou par les rails, jusqu'à
// sa réserve (23/10 : 5 minutes au niveau 1, un peu plus à chaque niveau).

import { BATIMENTS, NIVEAUX_GENERATEUR, SECONDES_PAR_REDSTONE, type IdBatiment } from './donnees'
import { disponible, garderDansLeCoffre, payer, payerMateriaux, peutPayer, type EtatJeu } from './mineur'
import { batimentPose, type BatimentPose, type Case } from './village'
import { debloque } from './niveaux'
import { t } from './langue'

export function generateurPose(etat: EtatJeu): BatimentPose | null {
  return batimentPose(etat.village, 'generateur')
}

export function infoGenerateur(etat: EtatJeu) {
  return NIVEAUX_GENERATEUR[Math.min(etat.generateur.niveau, NIVEAUX_GENERATEUR.length - 1)]
}

export function rayonGenerateur(etat: EtatJeu): number {
  return infoGenerateur(etat).rayon
}

// Combien de fois plus vite va ce qui est dans le rayon (1,3 au niveau 1 : + 30 %).
export function multiplicateurGenerateur(etat: EtatJeu): number {
  return 1 + infoGenerateur(etat).bonus
}

// (23/10) La réserve : la redstone qu'il peut garder au plus, en secondes de marche.
export function reserveMaxGenerateur(etat: EtatJeu): number {
  return infoGenerateur(etat).reserveMinutes * 60
}

// Combien de redstones manquent pour remplir la réserve.
export function placeRedstoneGenerateur(etat: EtatJeu): number {
  return Math.max(0, Math.floor((reserveMaxGenerateur(etat) - etat.generateur.carburant) / SECONDES_PAR_REDSTONE))
}

// La redstone arrivée par les rails : elle remplit la réserve. Rend ce qui n'a pas trouvé de place.
export function livrerRedstone(etat: EtatJeu, nombre: number): number {
  const mis = Math.min(nombre, placeRedstoneGenerateur(etat))
  etat.generateur.carburant += mis * SECONDES_PAR_REDSTONE
  return nombre - mis
}

// « + 30 % »
export function texteBonusGenerateur(bonus: number): string {
  return `+ ${Math.round(bonus * 100)} %`
}

// Le générateur donne du courant : posé, allumé, et avec de la redstone.
export function generateurEnMarche(etat: EtatJeu): boolean {
  return generateurPose(etat) !== null && etat.generateur.allume && etat.generateur.carburant > 0
}

// Le centre du générateur, sur la grille.
export function centreGenerateur(etat: EtatJeu): { x: number; y: number } | null {
  const g = generateurPose(etat)
  if (!g) return null
  const t = BATIMENTS.generateur.taille
  return { x: g.x + t / 2, y: g.y + t / 2 }
}

// Une case est-elle dans le rayon du générateur (même éteint) ?
export function caseDansLeRayon(etat: EtatJeu, c: Case): boolean {
  const centre = centreGenerateur(etat)
  if (!centre) return false
  return Math.hypot(c.x + 0.5 - centre.x, c.y + 0.5 - centre.y) <= rayonGenerateur(etat)
}

// Un bâtiment est dans le rayon si son centre l'est.
export function batimentDansLeRayon(etat: EtatJeu, id: IdBatiment): boolean {
  const b = batimentPose(etat.village, id)
  if (!b) return false
  const t = BATIMENTS[id].taille
  return caseDansLeRayon(etat, { x: Math.floor(b.x + t / 2), y: Math.floor(b.y + t / 2) })
}

// Toutes ces cases (une ligne de rails, par exemple) sont-elles dans le rayon ?
export function casesDansLeRayon(etat: EtatJeu, cases: Case[]): boolean {
  return cases.length > 0 && cases.every((c) => caseDansLeRayon(etat, c))
}

export function foreuseAlimentee(etat: EtatJeu): boolean {
  return generateurEnMarche(etat) && batimentDansLeRayon(etat, 'foreuse')
}

// (26/10) La fonderie ou la joaillerie, dans le rayon du générateur allumé : elle va plus vite.
export function atelierAlimente(etat: EtatJeu, id: 'fonderie' | 'joaillerie'): boolean {
  return generateurEnMarche(etat) && batimentDansLeRayon(etat, id)
}

// L'ascenseur de la mine est accéléré : la mine est dans le rayon du générateur allumé.
export function ascenseurAlimente(etat: EtatJeu): boolean {
  return generateurEnMarche(etat) && batimentDansLeRayon(etat, 'puits')
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

// Met de la redstone (du coffre de la mine) dans le générateur. nombre = Infinity : tout.
export function remplirGenerateur(etat: EtatJeu, nombre: number): string[] {
  if (!generateurPose(etat)) return []
  // (26/10) Ce que le joueur garde 📌 dans le coffre reste dans le coffre.
  const mis = Math.min(nombre, Math.max(0, disponible(etat, 'redstone') - garderDansLeCoffre(etat, 'redstone')), placeRedstoneGenerateur(etat))
  if (mis <= 0) return placeRedstoneGenerateur(etat) === 0 && disponible(etat, 'redstone') > 0 ? [t('⚡ La réserve du générateur est pleine.')] : [t('🔴 Il te faut de la redstone (niveau 2 de la mine).')]
  payerMateriaux(etat, { redstone: mis })
  etat.generateur.carburant += mis * SECONDES_PAR_REDSTONE
  return [t('⚡ +{n} redstone dans le générateur.', { n: mis })]
}

export function basculerGenerateur(etat: EtatJeu): string[] {
  if (!generateurPose(etat)) return []
  etat.generateur.allume = !etat.generateur.allume
  return [etat.generateur.allume ? t('⚡ Générateur allumé.') : t('⚡ Générateur éteint : il garde sa redstone.')]
}

export function prochainNiveauGenerateur(etat: EtatJeu) {
  return NIVEAUX_GENERATEUR[etat.generateur.niveau + 1] ?? null
}

export function ameliorerGenerateur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauGenerateur(etat)
  if (!generateurPose(etat) || prochain === null || !debloque(etat, 'generateur', etat.generateur.niveau + 1) || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.generateur.niveau += 1
  return [
    t('⚡ Générateur niveau {n} : rayon de {rayon} cases, {bonus} de vitesse dans son rayon, {minutes} min de réserve.', {
      n: etat.generateur.niveau + 1,
      rayon: prochain.rayon,
      bonus: texteBonusGenerateur(prochain.bonus),
      minutes: prochain.reserveMinutes,
    }),
  ]
}

// ---------------------------------------------------------------------------
// Le temps qui passe
// ---------------------------------------------------------------------------

export function avancerGenerateur(etat: EtatJeu, secondes: number): string[] {
  const g = etat.generateur
  if (!generateurPose(etat) || !g.allume) return []
  if (g.carburant <= 0) return []
  g.carburant = Math.max(0, g.carburant - secondes)
  if (g.carburant === 0) return [t('⚡ Le générateur n’a plus de redstone : les rails ne sont plus électriques.')]
  return []
}
