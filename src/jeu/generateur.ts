// Le générateur (22/10, niveau 2 de la mine) : il brûle de la redstone et accélère tout ce qui
// est dans son rayon (un cercle autour de lui, en cases), de + 30 % à + 75 % selon son niveau
// (23/10) :
//   - l'ascenseur de la mine, si la mine est dans le rayon (voir secondesTrajetMineur) ;
//   - les rails : si toutes les cases d'un trajet sont dans le rayon, son pousseur pousse le
//     wagonnet plus vite (voir wagonnet.ts) ;
//   - la foreuse : elle fore plus vite.
// On le remplit de redstone (de son sac ou du coffre de la mine). À partir du niveau 2, il peut
// se servir tout seul dans le coffre de la mine.

import { BATIMENTS, NIVEAUX_GENERATEUR, NIVEAU_GENERATEUR_AUTO, RESERVE_GENERATEUR_AUTO, SECONDES_PAR_REDSTONE, type IdBatiment } from './donnees'
import { disponible, payer, payerMateriaux, peutPayer, retirerDe, type EtatJeu } from './mineur'
import { batimentPose, type BatimentPose, type Case } from './village'
import { debloque } from './niveaux'

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

// L'ascenseur de la mine est accéléré : la mine est dans le rayon du générateur allumé.
export function ascenseurAlimente(etat: EtatJeu): boolean {
  return generateurEnMarche(etat) && batimentDansLeRayon(etat, 'puits')
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

// Met de la redstone (du sac, puis du coffre) dans le générateur. nombre = Infinity : tout.
export function remplirGenerateur(etat: EtatJeu, nombre: number): string[] {
  if (!generateurPose(etat)) return []
  const mis = Math.min(nombre, disponible(etat, 'redstone'))
  if (mis <= 0) return ['🔴 Il te faut de la redstone (niveau 2 de la mine).']
  payerMateriaux(etat, { redstone: mis })
  etat.generateur.carburant += mis * SECONDES_PAR_REDSTONE
  return [`⚡ +${mis} redstone dans le générateur.`]
}

export function basculerGenerateur(etat: EtatJeu): string[] {
  if (!generateurPose(etat)) return []
  etat.generateur.allume = !etat.generateur.allume
  return [etat.generateur.allume ? '⚡ Générateur allumé.' : '⚡ Générateur éteint : il garde sa redstone.']
}

export function puisageDisponible(etat: EtatJeu): boolean {
  return etat.generateur.niveau >= NIVEAU_GENERATEUR_AUTO
}

export function basculerPuisage(etat: EtatJeu): string[] {
  if (!puisageDisponible(etat)) return []
  etat.generateur.puiseDansLeCoffre = !etat.generateur.puiseDansLeCoffre
  return []
}

export function prochainNiveauGenerateur(etat: EtatJeu) {
  return NIVEAUX_GENERATEUR[etat.generateur.niveau + 1] ?? null
}

export function ameliorerGenerateur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauGenerateur(etat)
  if (!generateurPose(etat) || prochain === null || !debloque(etat, 'generateur', etat.generateur.niveau + 1) || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.generateur.niveau += 1
  return [`⚡ Générateur niveau ${etat.generateur.niveau + 1} : rayon de ${prochain.rayon} cases, ${texteBonusGenerateur(prochain.bonus)} de vitesse dans son rayon.`]
}

// ---------------------------------------------------------------------------
// Le temps qui passe
// ---------------------------------------------------------------------------

export function avancerGenerateur(etat: EtatJeu, secondes: number): string[] {
  const g = etat.generateur
  if (!generateurPose(etat) || !g.allume) return []
  // Il se sert dans le coffre quand sa réserve baisse (sans tout prendre d'un coup).
  if (g.puiseDansLeCoffre && puisageDisponible(etat) && g.carburant < RESERVE_GENERATEUR_AUTO) {
    const voulu = Math.ceil((RESERVE_GENERATEUR_AUTO - g.carburant) / SECONDES_PAR_REDSTONE)
    const pris = Math.min(voulu, etat.coffre.contenu.redstone ?? 0)
    if (pris > 0) {
      retirerDe(etat.coffre.contenu, 'redstone', pris)
      g.carburant += pris * SECONDES_PAR_REDSTONE
    }
  }
  if (g.carburant <= 0) return []
  g.carburant = Math.max(0, g.carburant - secondes)
  if (g.carburant === 0) return ['⚡ Le générateur n’a plus de redstone : les rails ne sont plus électriques.']
  return []
}
