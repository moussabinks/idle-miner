// Les mineurs employés (débloqués au prestige 2).
// Chaque mineur creuse tout seul dans sa propre galerie. Quand son sac est plein, il
// remonte au village dans sa propre cabine d'ascenseur, vend sa
// récolte au marché, garde son salaire et te donne le reste, puis redescend.
// Les trajets et la vente prennent du temps : pendant ce temps-là, il ne creuse pas.
// Ils continuent pendant que le jeu est fermé (comme la foreuse) et restent après un prestige.

import type { Aleatoire } from './aleatoire'
import {
  BLOCS_PAR_METRE_EMPLOYE,
  DUREE_MIN_TRAJET_EMPLOYE,
  MAX_EMPLOYES,
  NIVEAUX_EMPLOYE,
  NOMS_EMPLOYES,
  PRESTIGE_EMPLOYES,
  PRIX_EMBAUCHE,
  NIVEAUX_ASCENSEUR,
  PROFONDEUR_BEDROCK,
  SECONDES_VENTE_EMPLOYE,
  niveauMaxAuPrestige,
  prestigePourNiveau,
} from './donnees'
import { tirerBlocNormal } from './mine'
import { aLaSurface, secondesParMetreAscenseur, valeurDe, type EtatJeu, type Employe } from './mineur'
import { mineursEnPlus, multiplicateurAscenseur, multiplicateurMineurs, multiplicateurSacMineurs, partSalaire } from './talents'

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

// La taille de son sac à dos : elle grandit avec son équipement (et le talent « Grands sacs »).
export function tailleSacEmploye(etat: EtatJeu, employe: Employe): number {
  return NIVEAUX_EMPLOYE[employe.niveau].sac * multiplicateurSacMineurs(etat)
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

// Les mineurs ont leur propre ascenseur (une cabine chacun) : il va aussi vite que le tien,
// et au moins comme un ascenseur de niveau 1 si tu n'as pas encore construit le tien.
// Un trajet complet dure quand même au moins DUREE_MIN_TRAJET_EMPLOYE (il faut attendre la
// cabine, charger le sac...) : sinon, près de la surface, ce serait instantané.
export function secondesParMetreEmploye(etat: EtatJeu, employe: Employe): number {
  const parMetre = etat.ascenseur.niveau > 0 ? secondesParMetreAscenseur(etat) : NIVEAUX_ASCENSEUR[0].secondesParMetre * multiplicateurAscenseur(etat)
  const longueurTrajet = Math.max(1, employe.profondeur - 1) // du village jusqu'au fond de sa galerie
  return Math.max(parMetre, DUREE_MIN_TRAJET_EMPLOYE / longueurTrajet)
}

// Combien de secondes avant qu'il ait fini son étape en cours (trajet ou vente).
// Pendant qu'il creuse : le temps qu'il lui faut pour remplir son sac.
export function secondesRestantesEmploye(etat: EtatJeu, employe: Employe): number {
  if (employe.etape === 'vend') return Math.max(0, SECONDES_VENTE_EMPLOYE - employe.progression)
  if (employe.etape === 'creuse') {
    const place = tailleSacEmploye(etat, employe) - nbDansSacEmploye(employe)
    return Math.max(0, (place - employe.progression) / vitesseEmploye(etat, employe))
  }
  const arrivee = employe.etape === 'monte' ? 0 : employe.profondeur - 1
  return Math.abs(arrivee - employe.position) * secondesParMetreEmploye(etat, employe)
}

export function prixAmeliorationEmploye(employe: Employe): number | null {
  return NIVEAUX_EMPLOYE[employe.niveau + 1]?.prix ?? null
}

// Le prochain équipement est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function employeBloqueAuPrestige(etat: EtatJeu, employe: Employe): number | null {
  const prochain = employe.niveau + 1
  if (prixAmeliorationEmploye(employe) === null || prochain <= niveauMaxAuPrestige('mineur', etat.prestige)) return null
  return prestigePourNiveau('mineur', prochain)
}

export function peutAmeliorerEmploye(etat: EtatJeu, employe: Employe): boolean {
  const prix = prixAmeliorationEmploye(employe)
  return prix !== null && employeBloqueAuPrestige(etat, employe) === null && etat.argent >= prix
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
  if (prix === null || !peutAmeliorerEmploye(etat, employe)) return []
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
      const place = tailleSacEmploye(etat, employe) - nbDansSacEmploye(employe)
      const temps = Math.min(reste, Math.max(0, (place - employe.progression) / vitesse))
      employe.progression += temps * vitesse
      reste -= temps
      while (employe.progression >= 1 && nbDansSacEmploye(employe) < tailleSacEmploye(etat, employe)) {
        employe.progression -= 1
        const bloc = tirerBlocNormal(employe.profondeur, aleatoire)
        employe.sac[bloc] = (employe.sac[bloc] ?? 0) + 1
        employe.blocsCasses += 1
        // Il descend d'un mètre tous les 5 blocs (sa galerie est étroite), tant que sa pioche le permet.
        if (employe.blocsCasses % BLOCS_PAR_METRE_EMPLOYE === 0) {
          employe.profondeur = Math.min(profondeurMaxEmploye(employe), employe.profondeur + 1)
        }
      }
      if (nbDansSacEmploye(employe) >= tailleSacEmploye(etat, employe)) {
        // Sac plein : il remonte vendre.
        employe.etape = 'monte'
        employe.position = employe.profondeur - 1
        employe.progression = 0
      }
    } else if (employe.etape === 'vend') {
      // Au marché : il vend sa récolte (ça prend quelques secondes), puis il redescend.
      const temps = Math.min(reste, SECONDES_VENTE_EMPLOYE - employe.progression)
      employe.progression += temps
      reste -= temps
      if (employe.progression >= SECONDES_VENTE_EMPLOYE - 1e-9) {
        vendreRecolte(etat, employe)
        employe.etape = 'descend'
        employe.progression = 0
      }
    } else {
      // Un trajet : vers le village (monte) ou vers sa galerie (descend).
      const parMetre = secondesParMetreEmploye(etat, employe)
      const arrivee = employe.etape === 'monte' ? 0 : employe.profondeur - 1
      const metres = Math.abs(arrivee - employe.position)
      const temps = Math.min(reste, metres * parMetre)
      employe.position += Math.sign(arrivee - employe.position) * (temps / parMetre)
      reste -= temps
      if (temps >= metres * parMetre) {
        employe.position = arrivee
        if (employe.etape === 'monte') {
          employe.etape = 'vend'
          employe.progression = 0
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

// Ce que fait un mineur, en quelques mots (pour l'affichage), avec le temps qu'il lui reste.
export function activiteEmploye(etat: EtatJeu, employe: Employe): string {
  const secondes = Math.ceil(secondesRestantesEmploye(etat, employe))
  if (employe.etape === 'creuse') return `⛏️ creuse à -${employe.profondeur} m (sac plein dans ${secondes} s)`
  if (employe.etape === 'monte') return `⏫ sac plein : remonte au marché (${secondes} s)`
  if (employe.etape === 'vend') return `💰 vend sa récolte au marché (${secondes} s)`
  return `⏬ redescend dans sa galerie (${secondes} s)`
}

// L'icône de ce qu'il fait (pour la bulle au-dessus de sa tête, dans la mine).
export function iconeActiviteEmploye(employe: Employe): string {
  if (employe.etape === 'creuse') return '⛏️'
  if (employe.etape === 'monte') return '⏫'
  if (employe.etape === 'vend') return '💰'
  return '⏬'
}
