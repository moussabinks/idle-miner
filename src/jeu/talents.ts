// L'arbre de prestige : à chaque prestige, on gagne 1 point à dépenser dans un
// talent. Il y a quatre branches (mineur, marchand, ingénieur, patron) de 4 talents ;
// il faut le talent du dessus pour prendre celui du dessous.
// Les talents sont gardés pour toujours (ils survivent aux prestiges suivants).
//
// Ce fichier n'importe que le *type* EtatJeu depuis mineur.ts : mineur.ts peut donc
// lui-même utiliser aLeTalent() sans créer de boucle entre les deux fichiers.

import type { EtatJeu } from './mineur'

export type IdTalent =
  | 'poigne'
  | 'piochePierre'
  | 'fortune'
  | 'piocheFer'
  | 'negoce'
  | 'pecule'
  | 'grandSac'
  | 'tresor'
  | 'ascenseurRapide'
  | 'foreuseTurbo'
  | 'moteurEconome'
  | 'grandChariot'
  | 'contremaitre'
  | 'grandsSacs'
  | 'salaireReduit'
  | 'recrue'

export type IdBranche = 'mineur' | 'marchand' | 'ingenieur' | 'patron'

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
]

// Les anciens talents retirés (19/10) : ceux qui les avaient récupèrent leur point.
export const TALENTS_RETIRES = ['ascenseurOffert', 'grimpeur']

export const TALENTS: Talent[] = [
  { id: 'poigne', branche: 'mineur', rang: 1, nom: 'Poigne de fer', description: 'Tes pioches creusent 15 % plus vite.' },
  { id: 'piochePierre', branche: 'mineur', rang: 2, nom: 'Bon départ', description: 'Chaque partie commence avec la pioche en pierre.' },
  { id: 'fortune', branche: 'mineur', rang: 3, nom: 'Main chanceuse', description: 'Fortune I offert au début de chaque partie.' },
  { id: 'piocheFer', branche: 'mineur', rang: 4, nom: 'Mineur aguerri', description: 'Chaque partie commence avec la pioche en fer.' },

  { id: 'negoce', branche: 'marchand', rang: 1, nom: 'Négociant', description: 'Tes ventes rapportent 10 % de plus.' },
  { id: 'pecule', branche: 'marchand', rang: 2, nom: 'Pécule', description: 'Chaque partie commence avec 300 $.' },
  { id: 'grandSac', branche: 'marchand', rang: 3, nom: 'Grand sac', description: 'Chaque partie commence avec le sac de 128 places.' },
  { id: 'tresor', branche: 'marchand', rang: 4, nom: 'Chasseur de trésors', description: 'Les coffres rapportent 2 fois plus d’argent.' },

  { id: 'ascenseurRapide', branche: 'ingenieur', rang: 1, nom: 'Ascenseur express', description: 'L’ascenseur va 30 % plus vite (pour toi et tes mineurs).' },
  { id: 'foreuseTurbo', branche: 'ingenieur', rang: 2, nom: 'Foreuse turbo', description: 'Les foreuses creusent 50 % plus vite.' },
  { id: 'moteurEconome', branche: 'ingenieur', rang: 3, nom: 'Moteur économe', description: 'Chaque charbon fait tourner les foreuses 2 fois plus longtemps.' },
  { id: 'grandChariot', branche: 'ingenieur', rang: 4, nom: 'Grand chariot', description: 'Le chariot des foreuses contient 2 fois plus.' },

  { id: 'contremaitre', branche: 'patron', rang: 1, nom: 'Contremaître', description: 'Tes mineurs creusent 25 % plus vite.' },
  { id: 'grandsSacs', branche: 'patron', rang: 2, nom: 'Sacs d’équipe', description: 'Les sacs de tes mineurs sont 2 fois plus grands.' },
  { id: 'salaireReduit', branche: 'patron', rang: 3, nom: 'Bon patron', description: 'Tes mineurs gardent 10 % de leurs ventes au lieu de 25 %.' },
  { id: 'recrue', branche: 'patron', rang: 4, nom: 'Recruteur', description: 'Tu peux employer 1 mineur de plus.' },
]

export const PECULE_DEPART = 300

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

// Le talent juste au-dessus dans la même branche (null pour le premier).
export function talentPrecedent(id: IdTalent): Talent | null {
  const t = talent(id)
  return TALENTS.find((autre) => autre.branche === t.branche && autre.rang === t.rang - 1) ?? null
}

export function peutChoisirTalent(etat: EtatJeu, id: IdTalent): boolean {
  if (aLeTalent(etat, id) || pointsDisponibles(etat) <= 0) return false
  const precedent = talentPrecedent(id)
  return precedent === null || aLeTalent(etat, precedent.id)
}

export function choisirTalent(etat: EtatJeu, id: IdTalent): string[] {
  if (!peutChoisirTalent(etat, id)) return []
  etat.talents.push(id)
  // Les bonus de départ servent tout de suite (on vient en général de passer prestige).
  appliquerTalentsDeDepart(etat)
  return [`🌟 Talent débloqué : ${talent(id).nom} !`]
}

// Les cadeaux de début de partie. On ne fait qu'« au moins » (Math.max) : appliquer
// deux fois ne donne rien de plus, et on ne perd jamais une meilleure pioche ou un plus grand sac.
export function appliquerTalentsDeDepart(etat: EtatJeu): void {
  const donnerPioche = (niveau: number) => {
    if (etat.meilleure >= niveau) return
    etat.pioches[niveau] = 0
    etat.niveauPioche = niveau
    etat.meilleure = niveau
  }
  if (aLeTalent(etat, 'piochePierre')) donnerPioche(1)
  if (aLeTalent(etat, 'piocheFer')) donnerPioche(2)
  if (aLeTalent(etat, 'fortune')) etat.enchantements.fortune = Math.max(1, etat.enchantements.fortune)
  if (aLeTalent(etat, 'grandSac')) etat.niveauSac = Math.max(2, etat.niveauSac)
  // Le pécule n'est donné qu'une fois par partie.
  if (aLeTalent(etat, 'pecule') && !etat.peculeRecu) {
    etat.argent += PECULE_DEPART
    etat.peculeRecu = true
  }
}

// --- Les bonus permanents, lus par les règles du jeu ---

export function multiplicateurPioche(etat: EtatJeu): number {
  return aLeTalent(etat, 'poigne') ? 1.15 : 1
}

export function bonusVenteTalents(etat: EtatJeu): number {
  return aLeTalent(etat, 'negoce') ? 0.1 : 0
}

export function multiplicateurCoffre(etat: EtatJeu): number {
  return aLeTalent(etat, 'tresor') ? 2 : 1
}

// Le temps d'un mètre en ascenseur : 30 % plus vite = 1 / 1,3 du temps.
export function multiplicateurAscenseur(etat: EtatJeu): number {
  return aLeTalent(etat, 'ascenseurRapide') ? 1 / 1.3 : 1
}

export function multiplicateurChariot(etat: EtatJeu): number {
  return aLeTalent(etat, 'grandChariot') ? 2 : 1
}

// --- Les mineurs employés ---

export function multiplicateurMineurs(etat: EtatJeu): number {
  return aLeTalent(etat, 'contremaitre') ? 1.25 : 1
}

export function multiplicateurSacMineurs(etat: EtatJeu): number {
  return aLeTalent(etat, 'grandsSacs') ? 2 : 1
}

// La part des ventes que les mineurs gardent pour eux (leur salaire).
export function partSalaire(etat: EtatJeu): number {
  return aLeTalent(etat, 'salaireReduit') ? 0.1 : 0.25
}

export function mineursEnPlus(etat: EtatJeu): number {
  return aLeTalent(etat, 'recrue') ? 1 : 0
}

export function multiplicateurForage(etat: EtatJeu): number {
  return aLeTalent(etat, 'foreuseTurbo') ? 1.5 : 1
}

export function multiplicateurCharbon(etat: EtatJeu): number {
  return aLeTalent(etat, 'moteurEconome') ? 2 : 1
}
