// Les mineurs employés (débloqués au prestige 2).
// Chaque mineur creuse tout seul dans sa propre galerie. Quand son sac est plein, il
// remonte au village (en ascenseur s'il est construit, sinon à l'échelle), vend sa
// récolte au marché, garde son salaire et te donne le reste, puis redescend.
// Ils continuent pendant que le jeu est fermé (comme la foreuse) et restent après un prestige.

import type { Aleatoire } from './aleatoire'
import {
  BLOCS_FORES_PAR_METRE,
  MAX_EMPLOYES,
  NIVEAUX_EMPLOYE,
  NOMS_EMPLOYES,
  PRESTIGE_EMPLOYES,
  PRIX_EMBAUCHE,
  PROFONDEUR_BEDROCK,
  SAC_EMPLOYE,
  SECONDES_PAR_METRE_ECHELLE,
} from './donnees'
import { tirerBlocNormal } from './mine'
import { aLaSurface, secondesParMetreAscenseur, valeurDe, type EtatJeu, type Employe } from './mineur'
import { mineursEnPlus, multiplicateurMineurs, multiplicateurSacMineurs, partSalaire } from './talents'

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

export function employesDebloques(etat: EtatJeu): boolean {
  return etat.prestige >= PRESTIGE_EMPLOYES
}

// 2 au prestige 2, 3 au prestige 3... (6 au plus, +1 avec le talent « Recruteur »).
export function maxEmployes(etat: EtatJeu): number {
  if (!employesDebloques(etat)) return 0
  return Math.min(MAX_EMPLOYES, etat.prestige) + mineursEnPlus(etat)
}

export function prixEmbauche(etat: EtatJeu): number | null {
  if (etat.employes.length >= maxEmployes(etat)) return null
  return PRIX_EMBAUCHE[etat.employes.length] ?? null
}

export function tailleSacEmploye(etat: EtatJeu): number {
  return SAC_EMPLOYE * multiplicateurSacMineurs(etat)
}

export function nbDansSacEmploye(employe: Employe): number {
  let total = 0
  for (const nombre of Object.values(employe.sac)) total += nombre ?? 0
  return total
}

// Blocs cassés par seconde.
export function vitesseEmploye(etat: EtatJeu, employe: Employe): number {
  return NIVEAUX_EMPLOYE[employe.niveau].vitesse * multiplicateurMineurs(etat)
}

export function profondeurMaxEmploye(employe: Employe): number {
  return Math.min(NIVEAUX_EMPLOYE[employe.niveau].profMax, PROFONDEUR_BEDROCK - 1)
}

// Le temps pour monter ou descendre d'un mètre : l'ascenseur s'il est construit (plus rapide),
// sinon l'échelle.
export function secondesParMetreEmploye(etat: EtatJeu): number {
  return etat.ascenseur.niveau > 0 ? secondesParMetreAscenseur(etat) : SECONDES_PAR_METRE_ECHELLE
}

export function prixAmeliorationEmploye(employe: Employe): number | null {
  return NIVEAUX_EMPLOYE[employe.niveau + 1]?.prix ?? null
}

// ---------------------------------------------------------------------------
// Actions (au village)
// ---------------------------------------------------------------------------

export function embaucher(etat: EtatJeu): string[] {
  const prix = prixEmbauche(etat)
  if (!aLaSurface(etat) || prix === null || etat.argent < prix) return []
  etat.argent -= prix
  const nom = NOMS_EMPLOYES[etat.employes.length % NOMS_EMPLOYES.length]
  etat.employes.push({
    nom,
    niveau: 0,
    profondeur: 2,
    etape: 'descend',
    position: 0,
    sac: {},
    progression: 0,
    blocsCasses: 0,
    gagne: 0,
  })
  return [`👷 ${nom} est embauché(e) ! Il descend creuser.`]
}

// Une meilleure pioche pour un mineur : il creuse plus vite et plus profond.
export function ameliorerEmploye(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  if (!aLaSurface(etat) || !employe) return []
  const prix = prixAmeliorationEmploye(employe)
  if (prix === null || etat.argent < prix) return []
  etat.argent -= prix
  employe.niveau += 1
  return [`⛏️ ${employe.nom} a maintenant une pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom}.`]
}

// ---------------------------------------------------------------------------
// Le travail, seconde après seconde
// ---------------------------------------------------------------------------

// Vend la récolte d'un mineur : il garde son salaire, le reste est pour toi.
function vendreRecolte(etat: EtatJeu, employe: Employe): void {
  const gain = valeurDe(etat, employe.sac)
  const pourToi = Math.round(gain * (1 - partSalaire(etat)))
  etat.argent += pourToi
  etat.stats.argentGagne += pourToi
  employe.gagne += pourToi
  employe.sac = {}
}

function travailler(etat: EtatJeu, employe: Employe, secondes: number, aleatoire: Aleatoire): void {
  let reste = secondes
  // On avance étape par étape (utile après une longue absence : plusieurs allers-retours).
  while (reste > 1e-9) {
    if (employe.etape === 'creuse') {
      const vitesse = vitesseEmploye(etat, employe)
      const place = tailleSacEmploye(etat) - nbDansSacEmploye(employe)
      const temps = Math.min(reste, Math.max(0, (place - employe.progression) / vitesse))
      employe.progression += temps * vitesse
      reste -= temps
      while (employe.progression >= 1 && nbDansSacEmploye(employe) < tailleSacEmploye(etat)) {
        employe.progression -= 1
        const bloc = tirerBlocNormal(employe.profondeur, aleatoire)
        employe.sac[bloc] = (employe.sac[bloc] ?? 0) + 1
        employe.blocsCasses += 1
        // Il descend d'un mètre tous les 10 blocs, tant que sa pioche le permet.
        if (employe.blocsCasses % BLOCS_FORES_PAR_METRE === 0) {
          employe.profondeur = Math.min(profondeurMaxEmploye(employe), employe.profondeur + 1)
        }
      }
      if (nbDansSacEmploye(employe) >= tailleSacEmploye(etat)) {
        // Sac plein : il remonte vendre.
        employe.etape = 'monte'
        employe.position = employe.profondeur - 1
        employe.progression = 0
      }
    } else {
      // Un trajet : vers le village (monte) ou vers sa galerie (descend).
      const parMetre = secondesParMetreEmploye(etat)
      const arrivee = employe.etape === 'monte' ? 0 : employe.profondeur - 1
      const metres = Math.abs(arrivee - employe.position)
      const temps = Math.min(reste, metres * parMetre)
      employe.position += Math.sign(arrivee - employe.position) * (temps / parMetre)
      reste -= temps
      if (temps >= metres * parMetre) {
        employe.position = arrivee
        if (employe.etape === 'monte') {
          vendreRecolte(etat, employe)
          employe.etape = 'descend'
        } else {
          employe.etape = 'creuse'
        }
      }
    }
  }
}

export function avancerEmployes(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  for (const employe of etat.employes) travailler(etat, employe, secondes, aleatoire)
  return []
}

// Ce que fait un mineur, en quelques mots (pour l'affichage).
export function activiteEmploye(employe: Employe): string {
  if (employe.etape === 'creuse') return `⛏️ creuse à -${employe.profondeur} m`
  if (employe.etape === 'monte') return '⏫ remonte vendre sa récolte'
  return '⏬ redescend dans sa galerie'
}
