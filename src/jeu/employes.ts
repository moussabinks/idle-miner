// Les mineurs employés (débloqués au prestige 2), le stand Personnel.
// Chaque mineur creuse tout seul dans sa propre galerie. Quand son sac est plein, il
// remonte au village dans sa propre cabine d'ascenseur, vend sa récolte au marché (tout
// l'argent est pour toi), puis redescend. Les trajets et la vente prennent du temps :
// pendant ce temps-là, il ne creuse pas.
//
// Depuis le 20/10, on leur paie un salaire toutes les 10 minutes (on peut payer d'avance,
// jusqu'à 1 h). Sans salaire, un mineur remonte et attend, mécontent, au stand Personnel.
// Au prestige 4, le recruteur trouve des mineurs plus ou moins rares (un mineur mythique
// rapporte 5 fois plus) ; au prestige 5, le manager paie les salaires tout seul, avec
// l'argent mis dans la trésorerie.
// Les mineurs continuent pendant que le jeu est fermé (tant qu'ils sont payés), et restent
// après un prestige.

import { choisir, type Aleatoire } from './aleatoire'
import {
  BLOCS_PAR_METRE_EMPLOYE,
  BONUS_PRESTIGE,
  DUREE_MIN_TRAJET_EMPLOYE,
  HAUSSE_EMBAUCHE_PAR_PRESTIGE,
  LISTE_RARETES,
  MAX_EMPLOYES,
  NIVEAUX_ASCENSEUR,
  NIVEAUX_EMPLOYE,
  NIVEAUX_RECRUTEUR,
  NOMS_EMPLOYES,
  PART_INDEMNITES,
  PRESTIGE_EMPLOYES,
  PRESTIGE_MANAGER,
  PRESTIGE_RECRUTEUR,
  PRIX_EMBAUCHE,
  PRIX_MANAGER,
  RARETES,
  SALAIRE_MANAGER,
  SALAIRES,
  SECONDES_AVANT_PAIE_MANAGER,
  SECONDES_PAR_PAIE,
  SECONDES_PAYEES_MAX,
  SECONDES_VENTE_EMPLOYE,
  depuisReference,
  niveauMaxAuPrestige,
  prestigePourNiveau,
  profondeurBedrock,
  type Cout,
  type IdRarete,
  type Rarete,
} from './donnees'
import { tirerBlocNormal } from './mine'
import { aLaSurface, payer, peutPayer, secondesParMetreAscenseur, valeurDe, type EtatJeu, type Employe } from './mineur'
import {
  mineursEnPlus,
  multiplicateurAscenseur,
  multiplicateurChancesRares,
  multiplicateurIndemnites,
  multiplicateurMineurs,
  multiplicateurMythique,
  multiplicateurPrixEmbauche,
  multiplicateurSacMineurs,
  multiplicateurSalaires,
} from './talents'

// Le travail des mineurs avance par morceaux de 30 secondes au plus : après une longue
// absence, le manager a ainsi le temps de payer les salaires entre deux morceaux.
const PAS_EMPLOYES = 30

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

export function employesDebloques(etat: EtatJeu): boolean {
  return etat.prestige >= PRESTIGE_EMPLOYES
}

// 2 au prestige 2, 3 au prestige 3... (6 au plus, +1 avec le talent « Grande équipe »).
export function maxEmployes(etat: EtatJeu): number {
  if (!employesDebloques(etat)) return 0
  return Math.min(MAX_EMPLOYES, etat.prestige) + mineursEnPlus(etat)
}

// Les prix du personnel montent de 20 % à chaque prestige après le 2e (comme ce que rapporte la mine).
function haussePrestige(etat: EtatJeu): number {
  return HAUSSE_EMBAUCHE_PAR_PRESTIGE ** Math.max(0, etat.prestige - PRESTIGE_EMPLOYES)
}

// Arrondi à la centaine (des prix faciles à lire).
function arrondiPrix(prix: number): number {
  return Math.max(100, Math.round(prix / 100) * 100)
}

// Le prix de la prochaine embauche (null si l'équipe est complète).
export function prixEmbauche(etat: EtatJeu): number | null {
  if (etat.employes.length >= maxEmployes(etat)) return null
  const base = PRIX_EMBAUCHE[etat.employes.length]
  if (base === undefined) return null
  return arrondiPrix(base * haussePrestige(etat) * multiplicateurPrixEmbauche(etat))
}

// Les indemnités d'un licenciement : 40 % du prix de la dernière embauche de l'équipe
// (2 fois moins avec le talent « Indemnités réduites »).
export function indemnites(etat: EtatJeu): number {
  const base = PRIX_EMBAUCHE[Math.max(0, etat.employes.length - 1)] ?? PRIX_EMBAUCHE[0]
  return arrondiPrix(base * haussePrestige(etat) * PART_INDEMNITES * multiplicateurIndemnites(etat))
}

export function rareteDe(employe: Employe): Rarete {
  return RARETES[employe.rarete] ?? RARETES.commun
}

// La taille de son sac à dos : elle grandit avec son équipement, sa rareté (un mineur mythique
// porte 5 fois plus) et le talent « Sacs d'équipe ».
export function tailleSacEmploye(etat: EtatJeu, employe: Employe): number {
  return Math.round(NIVEAUX_EMPLOYE[employe.niveau].sac * multiplicateurSacMineurs(etat) * rareteDe(employe).rendement)
}

export function nbDansSacEmploye(employe: Employe): number {
  let total = 0
  for (const nombre of Object.values(employe.sac)) total += nombre ?? 0
  return total
}

// Blocs cassés par seconde (un mineur rare creuse plus vite).
export function vitesseEmploye(etat: EtatJeu, employe: Employe): number {
  return NIVEAUX_EMPLOYE[employe.niveau].vitesse * multiplicateurMineurs(etat) * rareteDe(employe).rendement
}

// Jusqu'où descend un mineur, selon sa pioche, dans la mine de ce prestige (sans toucher la bedrock).
export function profondeurMaxEmploye(etat: EtatJeu, employe: Employe): number {
  return Math.min(depuisReference(NIVEAUX_EMPLOYE[employe.niveau].profMax, etat.prestige), profondeurBedrock(etat.prestige) - 1)
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
  if (employe.etape === 'attend') return 0
  if (employe.etape === 'vend') return Math.max(0, SECONDES_VENTE_EMPLOYE - employe.progression)
  if (employe.etape === 'creuse') {
    const place = tailleSacEmploye(etat, employe) - nbDansSacEmploye(employe)
    return Math.max(0, (place - employe.progression) / vitesseEmploye(etat, employe))
  }
  const arrivee = employe.etape === 'monte' ? 0 : employe.profondeur - 1
  return Math.abs(arrivee - employe.position) * secondesParMetreEmploye(etat, employe)
}

// Le prix du prochain équipement (en argent seulement), null s'il a déjà le meilleur.
export function coutAmeliorationEmploye(employe: Employe): Cout | null {
  return NIVEAUX_EMPLOYE[employe.niveau + 1]?.cout ?? null
}

// Le prochain équipement est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function employeBloqueAuPrestige(etat: EtatJeu, employe: Employe): number | null {
  const prochain = employe.niveau + 1
  if (coutAmeliorationEmploye(employe) === null || prochain <= niveauMaxAuPrestige('mineur', etat.prestige)) return null
  return prestigePourNiveau('mineur', prochain)
}

export function peutAmeliorerEmploye(etat: EtatJeu, employe: Employe): boolean {
  const cout = coutAmeliorationEmploye(employe)
  return cout !== null && employeBloqueAuPrestige(etat, employe) === null && peutPayer(etat, cout)
}

// ---------------------------------------------------------------------------
// Les salaires
// ---------------------------------------------------------------------------

// Le salaire de 10 minutes d'un mineur : selon son équipement et sa rareté. Il monte de
// 15 % par prestige, comme le prix des ventes (25 % de moins avec « Salaires négociés »).
export function salaireEmploye(etat: EtatJeu, employe: Employe): number {
  const base = SALAIRES[employe.niveau] * rareteDe(employe).salaire
  return Math.round(base * (1 + BONUS_PRESTIGE * etat.prestige) * multiplicateurSalaires(etat))
}

// Combien de secondes on peut encore lui payer d'avance (jusqu'à 1 h en tout).
function secondesPayables(employe: Employe, secondes: number): number {
  return Math.max(0, Math.min(secondes, SECONDES_PAYEES_MAX - employe.tempsPaye))
}

// Le prix de quelques secondes de travail payées d'avance.
function prixDuTemps(etat: EtatJeu, employe: Employe, secondes: number): number {
  return Math.ceil((salaireEmploye(etat, employe) * secondes) / SECONDES_PAR_PAIE)
}

// Ce que coûte de payer `secondes` de plus à chaque mineur (sans dépasser 1 h d'avance).
// Avec secondes = SECONDES_PAYEES_MAX, c'est le prix pour que tout le monde soit payé 1 h.
export function coutSalaires(etat: EtatJeu, secondes: number): number {
  return etat.employes.reduce((total, e) => total + prixDuTemps(etat, e, secondesPayables(e, secondes)), 0)
}

// Les salaires de toute l'équipe pour 10 minutes (pour l'affichage).
export function salairesParPaie(etat: EtatJeu): number {
  return etat.employes.reduce((total, e) => total + salaireEmploye(etat, e), 0)
}

// Le moins de temps payé dans l'équipe (en secondes).
export function tempsPayeMin(etat: EtatJeu): number {
  return etat.employes.length === 0 ? 0 : Math.min(...etat.employes.map((e) => e.tempsPaye))
}

// Les mineurs qui ne sont plus payés (ils attendent, ou ils remontent pour attendre).
export function nbSansSalaire(etat: EtatJeu): number {
  return etat.employes.filter((e) => e.tempsPaye <= 0).length
}

// Les boutons « Payer » du stand Personnel (ils disparaissent quand on a le manager).
export function peutPayerSalaires(etat: EtatJeu, secondes: number): boolean {
  const cout = coutSalaires(etat, secondes)
  return !etat.manager.embauche && cout > 0 && etat.argent >= cout
}

// Paie `secondes` de travail de plus à chaque mineur (10 minutes, ou jusqu'à 1 h).
export function payerSalaires(etat: EtatJeu, secondes: number): string[] {
  if (!aLaSurface(etat) || !peutPayerSalaires(etat, secondes)) return []
  let paye = 0
  for (const employe of etat.employes) {
    const temps = secondesPayables(employe, secondes)
    paye += prixDuTemps(etat, employe, temps)
    employe.tempsPaye += temps
  }
  etat.argent -= paye
  etat.stats.salairesPayes += paye
  return [`💵 Salaires payés (${paye.toLocaleString('fr-FR')} $) : tes mineurs travaillent encore ${Math.floor(tempsPayeMin(etat) / 60)} min.`]
}

// Le message d'alerte du village quand quelqu'un n'est pas payé (null si tout va bien).
export function alerteSalaires(etat: EtatJeu): string | null {
  const sansSalaire = nbSansSalaire(etat)
  if (etat.manager.embauche && (etat.manager.tempsPaye <= 0 || sansSalaire > 0)) return '💼 Trésorerie vide : personne n’est payé !'
  if (sansSalaire > 0) return sansSalaire === 1 ? '😠 1 mineur attend son salaire !' : `😠 ${sansSalaire} mineurs attendent leur salaire !`
  return null
}

// ---------------------------------------------------------------------------
// Le manager (prestige 5) et la trésorerie
// ---------------------------------------------------------------------------

export function managerDebloque(etat: EtatJeu): boolean {
  return etat.prestige >= PRESTIGE_MANAGER
}

// Le manager travaille tant qu'il est payé.
export function managerAuTravail(etat: EtatJeu): boolean {
  return etat.manager.embauche && etat.manager.tempsPaye > 0
}

// Son salaire de 10 minutes, payé par la trésorerie.
export function salaireManager(): number {
  return SALAIRE_MANAGER
}

// Embaucher le manager : ses 10 premières minutes sont comprises dans le prix.
export function embaucherManager(etat: EtatJeu): string[] {
  if (!aLaSurface(etat) || !managerDebloque(etat) || etat.manager.embauche || etat.argent < PRIX_MANAGER) return []
  etat.argent -= PRIX_MANAGER
  etat.manager = { embauche: true, tempsPaye: SECONDES_PAR_PAIE }
  return ['💼 Manager embauché ! Mets de l’argent dans la trésorerie : il paiera les salaires tout seul.']
}

export function deposerTresorerie(etat: EtatJeu, montant: number): string[] {
  const mis = Math.floor(Math.min(montant, etat.argent))
  if (!aLaSurface(etat) || !etat.manager.embauche || mis <= 0) return []
  etat.argent -= mis
  etat.tresorerie += mis
  return [`💼 +${mis.toLocaleString('fr-FR')} $ dans la trésorerie.`]
}

export function retirerTresorerie(etat: EtatJeu, montant: number): string[] {
  const pris = Math.floor(Math.min(montant, etat.tresorerie))
  if (!aLaSurface(etat) || pris <= 0) return []
  etat.tresorerie -= pris
  etat.argent += pris
  return [`💼 ${pris.toLocaleString('fr-FR')} $ repris de la trésorerie.`]
}

// Ce que coûtent 10 minutes de toute l'équipe, manager compris (pour savoir combien de temps tient la trésorerie).
export function depensesParPaie(etat: EtatJeu): number {
  return salairesParPaie(etat) + (etat.manager.embauche ? salaireManager() : 0)
}

// Le manager paie les salaires qui arrivent à leur fin (moins d'une minute payée), avec la
// trésorerie. Il commence par lui-même (sans lui, plus personne n'est payé).
function payerParManager(etat: EtatJeu): void {
  const manager = etat.manager
  if (!manager.embauche) return
  if (manager.tempsPaye < SECONDES_AVANT_PAIE_MANAGER && etat.tresorerie >= salaireManager()) {
    etat.tresorerie -= salaireManager()
    etat.stats.salairesPayes += salaireManager()
    manager.tempsPaye += SECONDES_PAR_PAIE
  }
  if (!managerAuTravail(etat)) return
  for (const employe of etat.employes) {
    const salaire = salaireEmploye(etat, employe)
    if (employe.tempsPaye < SECONDES_AVANT_PAIE_MANAGER && etat.tresorerie >= salaire) {
      etat.tresorerie -= salaire
      etat.stats.salairesPayes += salaire
      employe.tempsPaye += SECONDES_PAR_PAIE
    }
  }
}

// ---------------------------------------------------------------------------
// Le recruteur (prestige 4) et la rareté
// ---------------------------------------------------------------------------

export function recruteurDebloque(etat: EtatJeu): boolean {
  return etat.prestige >= PRESTIGE_RECRUTEUR
}

// Le prochain niveau du recruteur (le niveau 1, c'est l'embaucher), null s'il est au maximum.
export function prochainNiveauRecruteur(etat: EtatJeu) {
  return NIVEAUX_RECRUTEUR[etat.recruteur] ?? null
}

// Le prochain niveau est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function recruteurBloqueAuPrestige(etat: EtatJeu): number | null {
  const prochain = etat.recruteur + 1
  if (prochainNiveauRecruteur(etat) === null || prochain <= niveauMaxAuPrestige('recruteur', etat.prestige)) return null
  return prestigePourNiveau('recruteur', prochain)
}

export function peutAmeliorerRecruteur(etat: EtatJeu): boolean {
  const prochain = prochainNiveauRecruteur(etat)
  return recruteurDebloque(etat) && prochain !== null && recruteurBloqueAuPrestige(etat) === null && peutPayer(etat, prochain.cout)
}

export function ameliorerRecruteur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauRecruteur(etat)
  if (!aLaSurface(etat) || prochain === null || !peutAmeliorerRecruteur(etat)) return []
  payer(etat, prochain.cout)
  etat.recruteur += 1
  if (etat.recruteur === 1) return ['🎩 Recruteur embauché ! Tes prochaines embauches peuvent être rares, épiques... ou mythiques !']
  return [`🎩 Recruteur niveau ${etat.recruteur} : plus de chances de trouver des mineurs rares !`]
}

// Les chances (en %) de chaque rareté à la prochaine embauche. Sans recruteur : tous communs.
export function chancesRecrutement(etat: EtatJeu): Record<IdRarete, number> {
  if (etat.recruteur <= 0) return { commun: 100, rare: 0, epique: 0, legendaire: 0, mythique: 0 }
  const base = NIVEAUX_RECRUTEUR[Math.min(etat.recruteur, NIVEAUX_RECRUTEUR.length) - 1].chances
  const bonus = multiplicateurChancesRares(etat)
  const chances = {
    commun: 0,
    rare: base.rare * bonus,
    epique: base.epique * bonus,
    legendaire: base.legendaire * bonus,
    mythique: base.mythique * bonus * multiplicateurMythique(etat),
  }
  chances.commun = 100 - chances.rare - chances.epique - chances.legendaire - chances.mythique
  return chances
}

// Tire la rareté du prochain mineur.
export function tirerRarete(etat: EtatJeu, aleatoire: Aleatoire): IdRarete {
  const chances = chancesRecrutement(etat)
  let tirage = aleatoire() * 100
  // On part du plus rare : les arrondis ne peuvent profiter qu'au commun.
  for (const id of [...LISTE_RARETES].reverse()) {
    if (id === 'commun') break
    if (tirage < chances[id]) return id
    tirage -= chances[id]
  }
  return 'commun'
}

// Un prénom pas encore pris dans l'équipe (avec un numéro si tous le sont).
function prenomAuHasard(etat: EtatJeu, aleatoire: Aleatoire): string {
  const pris = new Set(etat.employes.map((e) => e.nom))
  const libres = NOMS_EMPLOYES.filter((nom) => !pris.has(nom))
  if (libres.length > 0) return choisir(aleatoire, libres)
  return `${choisir(aleatoire, NOMS_EMPLOYES)} ${etat.employes.length + 1}`
}

// ---------------------------------------------------------------------------
// Actions (au village)
// ---------------------------------------------------------------------------

// Embauche un mineur : il est payé pour ses 10 premières minutes, puis il descend creuser.
// Avec le recruteur, sa rareté est tirée au hasard (on ne refuse personne : c'est le jeu !).
export function embaucher(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const prix = prixEmbauche(etat)
  if (!aLaSurface(etat) || prix === null || etat.argent < prix) return []
  etat.argent -= prix
  const nom = prenomAuHasard(etat, aleatoire)
  const rarete = tirerRarete(etat, aleatoire)
  etat.employes.push({
    nom,
    rarete,
    niveau: 0,
    profondeur: 2,
    etape: 'descend',
    position: 0,
    sac: {},
    progression: 0,
    blocsCasses: 0,
    gagne: 0,
    tempsPaye: SECONDES_PAR_PAIE,
  })
  const titre = rarete === 'commun' ? '' : ` (${RARETES[rarete].nom.toLowerCase()} !)`
  return [`👷 ${nom}${titre} est embauché(e) ! Il descend creuser.`]
}

// Licencier un mineur : on paie ses indemnités, et il part avec son équipement.
export function licencier(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  const prix = indemnites(etat)
  if (!aLaSurface(etat) || !employe || etat.argent < prix) return []
  etat.argent -= prix
  etat.employes.splice(index, 1)
  return [`👋 ${employe.nom} est parti(e). Indemnités : ${prix.toLocaleString('fr-FR')} $.`]
}

// Une meilleure pioche pour un mineur : il creuse plus vite et plus profond.
export function ameliorerEmploye(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  if (!aLaSurface(etat) || !employe) return []
  const cout = coutAmeliorationEmploye(employe)
  if (cout === null || !peutAmeliorerEmploye(etat, employe)) return []
  payer(etat, cout)
  employe.niveau += 1
  return [`⛏️ ${employe.nom} a maintenant une pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom}.`]
}

// ---------------------------------------------------------------------------
// Le travail, seconde après seconde
// ---------------------------------------------------------------------------

// Vend la récolte d'un mineur : tout est pour toi (son salaire est payé à part).
function vendreRecolte(etat: EtatJeu, employe: Employe): void {
  const gain = valeurDe(etat, employe.sac)
  etat.argent += gain
  etat.stats.argentGagne += gain
  etat.stats.argentMineurs += gain
  employe.gagne += gain
  employe.sac = {}
}

// Plus de salaire : il arrive au village et attend au stand Personnel.
function attendreSalaire(employe: Employe): string {
  employe.etape = 'attend'
  employe.position = 0
  employe.progression = 0
  return `😠 ${employe.nom} n’est plus payé(e) : il attend son salaire au stand Personnel.`
}

function travailler(etat: EtatJeu, employe: Employe, secondes: number, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  let reste = secondes
  // On avance étape par étape (utile après une longue absence : plusieurs allers-retours).
  while (reste > 1e-9) {
    // Plus de salaire : il arrête de creuser (ou fait demi-tour) et remonte.
    if (employe.tempsPaye <= 0 && (employe.etape === 'creuse' || employe.etape === 'descend')) {
      if (employe.etape === 'creuse') employe.position = employe.profondeur - 1
      employe.etape = 'monte'
      employe.progression = 0
    }
    // Il attend au stand Personnel : il repart dès qu'il est payé.
    if (employe.etape === 'attend') {
      if (employe.tempsPaye <= 0) break
      employe.etape = 'descend'
      employe.position = 0
      employe.progression = 0
    }

    let temps: number
    if (employe.etape === 'creuse') {
      // Il ne creuse que le temps qui est payé.
      const vitesse = vitesseEmploye(etat, employe)
      const place = tailleSacEmploye(etat, employe) - nbDansSacEmploye(employe)
      temps = Math.min(reste, employe.tempsPaye, Math.max(0, (place - employe.progression) / vitesse))
      employe.progression += temps * vitesse
      while (employe.progression >= 1 && nbDansSacEmploye(employe) < tailleSacEmploye(etat, employe)) {
        employe.progression -= 1
        const bloc = tirerBlocNormal(employe.profondeur, aleatoire, etat.prestige)
        employe.sac[bloc] = (employe.sac[bloc] ?? 0) + 1
        employe.blocsCasses += 1
        etat.stats.blocsMineurs += 1
        // Il descend d'un mètre tous les 5 blocs (sa galerie est étroite), tant que sa pioche le permet.
        if (employe.blocsCasses % BLOCS_PAR_METRE_EMPLOYE === 0) {
          employe.profondeur = Math.min(profondeurMaxEmploye(etat, employe), employe.profondeur + 1)
        }
      }
      if (nbDansSacEmploye(employe) >= tailleSacEmploye(etat, employe)) {
        // Sac plein : il remonte vendre.
        employe.etape = 'monte'
        employe.position = employe.profondeur - 1
        employe.progression = 0
      }
    } else if (employe.etape === 'vend') {
      // Au marché : il vend sa récolte (ça prend quelques secondes), puis il redescend
      // (ou il va attendre son salaire, s'il n'est plus payé).
      temps = Math.min(reste, SECONDES_VENTE_EMPLOYE - employe.progression)
      employe.progression += temps
      if (employe.progression >= SECONDES_VENTE_EMPLOYE - 1e-9) {
        vendreRecolte(etat, employe)
        if (employe.tempsPaye - temps <= 0) {
          messages.push(attendreSalaire(employe))
        } else {
          employe.etape = 'descend'
          employe.progression = 0
        }
      }
    } else {
      // Un trajet : vers le village (monte) ou vers sa galerie (descend).
      const parMetre = secondesParMetreEmploye(etat, employe)
      const arrivee = employe.etape === 'monte' ? 0 : employe.profondeur - 1
      const metres = Math.abs(arrivee - employe.position)
      temps = Math.min(reste, metres * parMetre)
      employe.position += Math.sign(arrivee - employe.position) * (temps / parMetre)
      if (temps >= metres * parMetre) {
        employe.position = arrivee
        if (employe.etape === 'descend') {
          employe.etape = 'creuse'
        } else if (nbDansSacEmploye(employe) === 0 && employe.tempsPaye - temps <= 0) {
          messages.push(attendreSalaire(employe)) // rien à vendre : il va directement attendre
        } else {
          employe.etape = 'vend'
          employe.progression = 0
        }
      }
    }
    reste -= temps
    // Le temps payé s'écoule pendant qu'il travaille (trajets et vente compris).
    employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
  }
  return messages
}

// Le temps passe pour le manager : quand il n'est plus payé, il prévient.
function travaillerManager(etat: EtatJeu, secondes: number): string[] {
  const manager = etat.manager
  if (!manager.embauche || manager.tempsPaye <= 0) return []
  manager.tempsPaye = Math.max(0, manager.tempsPaye - secondes)
  if (manager.tempsPaye > 0) return []
  return ['💼 Ton manager n’est plus payé : la trésorerie est vide ! Remplis-la au stand Personnel.']
}

export function avancerEmployes(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  if (etat.employes.length === 0 && !etat.manager.embauche) return []
  const messages: string[] = []
  let reste = secondes
  while (reste > 1e-9) {
    const pas = Math.min(reste, PAS_EMPLOYES)
    payerParManager(etat)
    for (const employe of etat.employes) messages.push(...travailler(etat, employe, pas, aleatoire))
    messages.push(...travaillerManager(etat, pas))
    reste -= pas
  }
  // Chaque message une seule fois (après une longue absence, le même pourrait revenir).
  return [...new Set(messages)]
}

// Ce que fait un mineur, en quelques mots (pour l'affichage), avec le temps qu'il lui reste.
export function activiteEmploye(etat: EtatJeu, employe: Employe): string {
  const secondes = Math.ceil(secondesRestantesEmploye(etat, employe))
  if (employe.etape === 'attend') return '😠 attend son salaire au stand Personnel'
  if (employe.etape === 'creuse') return `⛏️ creuse à -${employe.profondeur} m (sac plein dans ${secondes} s)`
  if (employe.etape === 'monte') return employe.tempsPaye <= 0 ? `😠 plus payé : remonte (${secondes} s)` : `⏫ sac plein : remonte au marché (${secondes} s)`
  if (employe.etape === 'vend') return `💰 vend sa récolte au marché (${secondes} s)`
  return `⏬ redescend dans sa galerie (${secondes} s)`
}

// L'icône de ce qu'il fait (pour la bulle au-dessus de sa tête, dans la mine).
export function iconeActiviteEmploye(employe: Employe): string {
  if (employe.etape === 'attend' || (employe.etape === 'monte' && employe.tempsPaye <= 0)) return '😠'
  if (employe.etape === 'creuse') return '⛏️'
  if (employe.etape === 'monte') return '⏫'
  if (employe.etape === 'vend') return '💰'
  return '⏬'
}
