// L'arbre de prestige : à chaque prestige, on gagne 1 point à dépenser dans un
// talent. Il y a cinq branches de 4 talents (mineur, marchand, ingénieur, patron et
// recrutement) ; il faut le talent du dessus pour prendre celui du dessous.
// La branche « Patron » s'ouvre avec les mineurs employés (prestige 2), la branche
// « Recrutement » une fois le recruteur embauché (prestige 4).
// Les talents sont gardés pour toujours (ils survivent aux prestiges suivants).
//
// Arbre refait le 20/10 : plus de cadeaux de début de partie (pioche offerte, pécule...),
// seulement des bonus qui durent. Tous les points ont été rendus à ce moment-là.
//
// Ce fichier n'importe que le *type* EtatJeu depuis mineur.ts : mineur.ts peut donc
// lui-même utiliser aLeTalent() sans créer de boucle entre les deux fichiers.

import { PRESTIGE_EMPLOYES } from './donnees'
import type { EtatJeu } from './mineur'

export type IdTalent =
  // Mineur
  | 'poigneDeFer'
  | 'oeilDeLynx'
  | 'piocheRobuste'
  | 'briseurDeRoche'
  // Marchand
  | 'negociant'
  | 'grossiste'
  | 'chasseurDeTresors'
  | 'grandNegociant'
  // Ingénieur
  | 'ascenseurExpress'
  | 'foreuseTurbo'
  | 'grandChariot'
  | 'moteurAutonome'
  // Patron
  | 'contremaitre'
  | 'sacsDEquipe'
  | 'salairesNegocies'
  | 'grandeEquipe'
  // Recrutement
  | 'oeilDuRecruteur'
  | 'prixCasse'
  | 'indemnitesReduites'
  | 'mainDeMidas'

export type IdBranche = 'mineur' | 'marchand' | 'ingenieur' | 'patron' | 'recrutement'

export type Talent = {
  id: IdTalent
  branche: IdBranche
  rang: number // 1 = en haut de la branche
  nom: string
  description: string
}

export const BRANCHES: { id: IdBranche; nom: string }[] = [
  { id: 'mineur', nom: 'Mineur' },
  { id: 'marchand', nom: 'Marchand' },
  { id: 'ingenieur', nom: 'Ingénieur' },
  { id: 'patron', nom: 'Patron' },
  { id: 'recrutement', nom: 'Recrutement' },
]

export const TALENTS: Talent[] = [
  { id: 'poigneDeFer', branche: 'mineur', rang: 1, nom: 'Poigne de fer', description: 'Tes pioches creusent 15 % plus vite.' },
  { id: 'oeilDeLynx', branche: 'mineur', rang: 2, nom: 'Œil de lynx', description: '+10 % de chance de doubler un minerai (en plus de Fortune).' },
  { id: 'piocheRobuste', branche: 'mineur', rang: 3, nom: 'Pioche robuste', description: 'Tes pioches s’usent 30 % moins vite.' },
  { id: 'briseurDeRoche', branche: 'mineur', rang: 4, nom: 'Briseur de roche', description: 'Tu creuses 25 % plus vite dans la roche dure.' },

  { id: 'negociant', branche: 'marchand', rang: 1, nom: 'Négociant', description: 'Tes ventes rapportent 10 % de plus.' },
  { id: 'grossiste', branche: 'marchand', rang: 2, nom: 'Grossiste', description: 'Le chariot de la foreuse se vend 20 % plus cher.' },
  { id: 'chasseurDeTresors', branche: 'marchand', rang: 3, nom: 'Chasseur de trésors', description: 'Les coffres rapportent 2 fois plus d’argent.' },
  { id: 'grandNegociant', branche: 'marchand', rang: 4, nom: 'Grand négociant', description: 'Toutes les ventes rapportent encore 15 % de plus.' },

  { id: 'ascenseurExpress', branche: 'ingenieur', rang: 1, nom: 'Ascenseur express', description: 'L’ascenseur va 30 % plus vite (pour toi et tes mineurs).' },
  { id: 'foreuseTurbo', branche: 'ingenieur', rang: 2, nom: 'Foreuse turbo', description: 'La foreuse creuse 50 % plus vite.' },
  { id: 'grandChariot', branche: 'ingenieur', rang: 3, nom: 'Grand chariot', description: 'Le chariot de la foreuse contient 2 fois plus.' },
  {
    id: 'moteurAutonome',
    branche: 'ingenieur',
    rang: 4,
    nom: 'Moteur autonome',
    description: 'La recharge automatique au charbon marche dès le premier niveau de forage.',
  },

  { id: 'contremaitre', branche: 'patron', rang: 1, nom: 'Contremaître', description: 'Tes mineurs creusent 25 % plus vite.' },
  { id: 'sacsDEquipe', branche: 'patron', rang: 2, nom: 'Sacs d’équipe', description: 'Les sacs de tes mineurs sont 2 fois plus grands.' },
  { id: 'salairesNegocies', branche: 'patron', rang: 3, nom: 'Salaires négociés', description: 'Les salaires de tes mineurs coûtent 25 % de moins.' },
  { id: 'grandeEquipe', branche: 'patron', rang: 4, nom: 'Grande équipe', description: 'Tu peux employer 1 mineur de plus.' },

  { id: 'oeilDuRecruteur', branche: 'recrutement', rang: 1, nom: 'Œil du recruteur', description: 'Les mineurs rares (et mieux) sortent 25 % plus souvent.' },
  { id: 'prixCasse', branche: 'recrutement', rang: 2, nom: 'Recrutement à prix cassé', description: 'Les embauches coûtent 30 % de moins.' },
  { id: 'indemnitesReduites', branche: 'recrutement', rang: 3, nom: 'Indemnités réduites', description: 'Licencier coûte 2 fois moins cher.' },
  { id: 'mainDeMidas', branche: 'recrutement', rang: 4, nom: 'Main de Midas', description: 'Les mineurs mythiques sortent 2 fois plus souvent.' },
]

export function talent(id: IdTalent): Talent {
  return TALENTS.find((t) => t.id === id) as Talent
}

export function aLeTalent(etat: EtatJeu, id: IdTalent): boolean {
  return etat.talents.includes(id)
}

// 1 point par prestige, moins ceux déjà dépensés.
export function pointsDisponibles(etat: EtatJeu): number {
  return Math.max(0, etat.prestige - etat.talents.length)
}

// La branche « Patron » attend les mineurs employés (prestige 2), et la branche
// « Recrutement » attend que le recruteur soit embauché.
export function brancheOuverte(etat: EtatJeu, branche: IdBranche): boolean {
  if (branche === 'patron') return etat.prestige >= PRESTIGE_EMPLOYES
  if (branche === 'recrutement') return etat.recruteur > 0
  return true
}

// Le talent juste au-dessus dans la même branche (null pour le premier).
export function talentPrecedent(id: IdTalent): Talent | null {
  const t = talent(id)
  return TALENTS.find((autre) => autre.branche === t.branche && autre.rang === t.rang - 1) ?? null
}

export function peutChoisirTalent(etat: EtatJeu, id: IdTalent): boolean {
  if (aLeTalent(etat, id) || pointsDisponibles(etat) <= 0 || !brancheOuverte(etat, talent(id).branche)) return false
  const precedent = talentPrecedent(id)
  return precedent === null || aLeTalent(etat, precedent.id)
}

export function choisirTalent(etat: EtatJeu, id: IdTalent): string[] {
  if (!peutChoisirTalent(etat, id)) return []
  etat.talents.push(id)
  return [`🌟 Talent débloqué : ${talent(id).nom} !`]
}

// --- Les bonus permanents, lus par les règles du jeu ---

// Mineur
export function multiplicateurPioche(etat: EtatJeu): number {
  return aLeTalent(etat, 'poigneDeFer') ? 1.15 : 1
}

export function chanceDoublementTalents(etat: EtatJeu): number {
  return aLeTalent(etat, 'oeilDeLynx') ? 0.1 : 0
}

// La part de l'usure qui compte encore (Pioche robuste : 30 % de moins).
export function multiplicateurUsure(etat: EtatJeu): number {
  return aLeTalent(etat, 'piocheRobuste') ? 0.7 : 1
}

export function multiplicateurRocheDure(etat: EtatJeu): number {
  return aLeTalent(etat, 'briseurDeRoche') ? 1.25 : 1
}

// Marchand
export function bonusVenteTalents(etat: EtatJeu): number {
  return (aLeTalent(etat, 'negociant') ? 0.1 : 0) + (aLeTalent(etat, 'grandNegociant') ? 0.15 : 0)
}

export function multiplicateurVenteChariot(etat: EtatJeu): number {
  return aLeTalent(etat, 'grossiste') ? 1.2 : 1
}

export function multiplicateurCoffre(etat: EtatJeu): number {
  return aLeTalent(etat, 'chasseurDeTresors') ? 2 : 1
}

// Ingénieur
// Le temps d'un mètre en ascenseur : 30 % plus vite = 1 / 1,3 du temps.
export function multiplicateurAscenseur(etat: EtatJeu): number {
  return aLeTalent(etat, 'ascenseurExpress') ? 1 / 1.3 : 1
}

export function multiplicateurForage(etat: EtatJeu): number {
  return aLeTalent(etat, 'foreuseTurbo') ? 1.5 : 1
}

export function multiplicateurChariot(etat: EtatJeu): number {
  return aLeTalent(etat, 'grandChariot') ? 2 : 1
}

export function rechargeAutoDesLeDebut(etat: EtatJeu): boolean {
  return aLeTalent(etat, 'moteurAutonome')
}

// Patron
export function multiplicateurMineurs(etat: EtatJeu): number {
  return aLeTalent(etat, 'contremaitre') ? 1.25 : 1
}

export function multiplicateurSacMineurs(etat: EtatJeu): number {
  return aLeTalent(etat, 'sacsDEquipe') ? 2 : 1
}

export function multiplicateurSalaires(etat: EtatJeu): number {
  return aLeTalent(etat, 'salairesNegocies') ? 0.75 : 1
}

export function mineursEnPlus(etat: EtatJeu): number {
  return aLeTalent(etat, 'grandeEquipe') ? 1 : 0
}

// Recrutement
// Les chances d'avoir un mineur rare, épique, légendaire ou mythique sont multipliées par ce nombre.
export function multiplicateurChancesRares(etat: EtatJeu): number {
  return aLeTalent(etat, 'oeilDuRecruteur') ? 1.25 : 1
}

export function multiplicateurPrixEmbauche(etat: EtatJeu): number {
  return aLeTalent(etat, 'prixCasse') ? 0.7 : 1
}

export function multiplicateurIndemnites(etat: EtatJeu): number {
  return aLeTalent(etat, 'indemnitesReduites') ? 0.5 : 1
}

export function multiplicateurMythique(etat: EtatJeu): number {
  return aLeTalent(etat, 'mainDeMidas') ? 2 : 1
}
