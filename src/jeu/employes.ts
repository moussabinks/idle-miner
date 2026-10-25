// Les mineurs employés (dès le début, au bâtiment Personnel, 22/10).
// Un mineur creuse au fond de la mine et pose ce qu'il casse dans son sac (le tas à côté de
// lui). Il ne remonte pas (23/10) : c'est la caisse de l'ascenseur qui fait des allers-retours
// sans cesse, prend les sacs au fond et les vide dans le coffre. Il ne remonte au village, dans
// la caisse, que s'il n'est plus payé.
// Les pousseurs (26/10) sont un autre métier : on les embauche pour UN trajet (par exemple Mine →
// Marché). Ils attendent leur wagonnet au quai, devant le bâtiment de départ de ce trajet, et le
// poussent dès qu'il a quelque chose à porter (voir wagonnet.ts). Électrique, plus besoin. Les
// mineurs, eux, ne font que creuser et remonter leur sac dans le coffre de la mine.
// On leur paie un salaire toutes les 5 minutes (sans manager, 5 minutes à la fois) : sans
// salaire, un mineur va attendre, mécontent, devant le Personnel.
// Au niveau 3 de la mine, le manager paie les salaires avec l'argent du joueur, tant qu'il est
// éveillé (23/10 : la fatigue) ; au niveau 4, le
// recruteur trouve des mineurs plus ou moins rares (un mineur mythique creuse 5 fois plus).
// Quand on améliore sa pioche, un mineur va d'abord la chercher à la forge.

import { choisir, type Aleatoire } from './aleatoire'
import {
  EMPLOYES_NIVEAU_1,
  EMPLOYES_PAR_NIVEAU,
  HAUSSE_APRES_LISTE,
  LISTE_RARETES,
  NIVEAUX_EMPLOYE,
  NIVEAUX_MANAGER,
  NIVEAUX_CHARIOT_POUSSEUR,
  NIVEAUX_POUSSEUR,
  NIVEAUX_RECRUTEUR,
  NIVEAU_MINE_MANAGER,
  NIVEAU_MINE_RECRUTEUR,
  LIAISONS,
  LISTE_LIAISONS,
  NOMS_EMPLOYES,
  PART_INDEMNITES,
  PART_REMPLACEMENT,
  PRIX_REMPLACEMENT_PAR_NIVEAU,
  PRIX_EMBAUCHE,
  PRIX_EMBAUCHE_POUSSEUR,
  PRIX_MANAGER,
  RARETES,
  SALAIRE_MANAGER,
  SALAIRES,
  SALAIRE_POUSSEUR_BASE,
  SALAIRE_POUSSEUR_PAR_CHARIOT,
  SALAIRE_POUSSEUR_PAR_VITESSE,
  SECONDES_AVANT_PAIE_MANAGER,
  SECONDES_FORGE_EMPLOYE,
  SECONDES_PAR_PAIE,
  VITESSE_MARCHE,
  type Cout,
  type IdBatiment,
  type IdBloc,
  type IdLiaison,
  type IdRarete,
  type Rarete,
} from './donnees'
import { debloque, niveauJoueur, verrou } from './niveaux'
import { multiplicateurProduction } from './gemmes'
import { nombre, t } from './langue'
import { tirerBloc } from './mine'
import {
  ajouterA,
  capaciteAscenseur,
  debitAscenseur,
  payer,
  retirerDe,
  peutPayer,
  placeCoffre,
  rangerDansCoffre,
  secondesChargementAscenseur,
  secondesTrajetMineur,
  secondesVidageAscenseur,
  totalObjets,
  type EtatJeu,
  type Employe,
  type Navette,
  type RoleEmploye,
} from './mineur'
import { batimentPose, caseAcces, caseBloquee, cheminEntre, longueurChemin, trouverChemin, type Case } from './village'
import { creerTrajet, ligneDe, trajetDe } from './wagonnet'

// Le travail avance par morceaux de 30 secondes au plus : après une longue absence, le manager
// a ainsi le temps de payer les salaires entre deux morceaux.
const PAS_EMPLOYES = 30

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

// Les mineurs payés en même temps repartent du Personnel l'un après l'autre, à cet écart (en s).
const ECART_DEPART = 0.7

// Combien de mineurs on peut employer (23/10) : 1 par niveau de la mine. Les pousseurs ne
// comptent pas.
export function maxEmployes(etat: EtatJeu): number {
  return EMPLOYES_NIVEAU_1 + EMPLOYES_PAR_NIVEAU * (etat.niveauMine - 1)
}

// Au plus un pousseur par trajet de wagonnet.
export function maxPousseurs(): number {
  return LISTE_LIAISONS.length
}

export function nbDuRole(etat: EtatJeu, role: RoleEmploye): number {
  return etat.employes.filter((e) => e.role === role).length
}

// Le prix de base de la n-ième embauche (n = 0 pour la première).
// (23/10) Chaque métier a sa liste : les mineurs (1 de plus par niveau de mine, donc plus chers),
// et les pousseurs (au plus un par trajet).
function prixDeBase(n: number, role: RoleEmploye = 'mineur'): number {
  const liste = role === 'pousseur' ? PRIX_EMBAUCHE_POUSSEUR : PRIX_EMBAUCHE
  const dernier = liste.length - 1
  if (n <= dernier) return liste[n]
  return liste[dernier] * HAUSSE_APRES_LISTE ** (n - dernier)
}

// Des prix faciles à lire : à la dizaine sous 1 000 $, à la centaine au-dessus.
function arrondiPrix(prix: number): number {
  if (prix < 1000) return Math.max(10, Math.round(prix / 10) * 10)
  return Math.round(prix / 100) * 100
}

// Le prix de la prochaine embauche (null s'il y a déjà assez de mineurs, ou de pousseurs).
// (23/10) Les mineurs et les pousseurs ont chacun leurs prix : le 1er mineur coûte 500 $, et le
// 1er pousseur aussi, même si on a déjà des mineurs.
export function prixEmbauche(etat: EtatJeu, role: RoleEmploye = 'mineur'): number | null {
  const nombre = nbDuRole(etat, role)
  if (nombre >= (role === 'mineur' ? maxEmployes(etat) : maxPousseurs())) return null
  return arrondiPrix(prixDeBase(nombre, role))
}

// Les indemnités d'un licenciement : 40 % du prix de la dernière place de son métier.
export function indemnites(etat: EtatJeu, role: RoleEmploye = 'mineur'): number {
  return arrondiPrix(prixDeBase(Math.max(0, etat.employes.filter((e) => e.role === role).length - 1), role) * PART_INDEMNITES)
}

export function rareteDe(employe: Employe): Rarete {
  return RARETES[employe.rarete] ?? RARETES.commun
}

export function tailleSacEmploye(employe: Employe): number {
  return Math.round(NIVEAUX_EMPLOYE[employe.niveau].sac * rareteDe(employe).rendement)
}

export function nbDansSacEmploye(employe: Employe): number {
  return totalObjets(employe.sac)
}

// Blocs cassés par seconde (un mineur rare creuse plus vite).
export function vitesseEmploye(employe: Employe): number {
  return NIVEAUX_EMPLOYE[employe.niveau].vitesse * rareteDe(employe).rendement
}

// Ce que creusent par seconde tous les mineurs payés.
export function vitesseMineurs(etat: EtatJeu): number {
  return etat.employes.filter((e) => e.role === 'mineur' && e.tempsPaye > 0).reduce((total, e) => total + vitesseEmploye(e), 0)
}

// La part de ce que creusent les mineurs que l'ascenseur arrive à remonter (1 : tout).
export function partRemontee(etat: EtatJeu): number {
  const creuse = vitesseMineurs(etat)
  return creuse <= 0 ? 1 : Math.min(1, debitAscenseur(etat) / creuse)
}

// Ce qu'un mineur fait sortir de la mine en moyenne, par seconde : ce qu'il creuse, si
// l'ascenseur suit (sinon, sa part de ce que l'ascenseur remonte).
export function blocsParSecondeEmploye(etat: EtatJeu, employe: Employe): number {
  return vitesseEmploye(employe) * partRemontee(etat)
}

// La case où un pousseur attend son wagonnet (23/10) : à côté du premier rail de son trajet,
// sur le bord de la voie (une case libre). null si le trajet n'a pas de rails.
export function caseQuai(etat: EtatJeu, liaison: IdLiaison): Case | null {
  const ligne = ligneDe(etat, liaison)
  if (!ligne) return null
  const a = ligne[0]
  const b = ligne[1] ?? a
  const sens = { x: b.x - a.x, y: b.y - a.y }
  const cote = sens.x === 0 && sens.y === 0 ? { x: 1, y: 0 } : { x: -sens.y, y: sens.x }
  const voulue = { x: Math.floor(a.x + 0.5 + cote.x * 1.3), y: Math.floor(a.y + 0.5 + cote.y * 1.3) }
  if (!caseBloquee(etat.village, voulue.x, voulue.y)) return voulue
  for (let rayon = 1; rayon < 6; rayon++) {
    for (let dx = -rayon; dx <= rayon; dx++) {
      for (let dy = -rayon; dy <= rayon; dy++) {
        if (!caseBloquee(etat.village, voulue.x + dx, voulue.y + dy)) return { x: voulue.x + dx, y: voulue.y + dy }
      }
    }
  }
  return voulue
}

// Le chemin à pied d'un employé qui marche (23/10) : d'un bâtiment à l'autre, sauf un pousseur
// qui va à son wagonnet : il va tout droit à son quai, par le plus court chemin (avant, il
// allait jusqu'à la porte du bâtiment de départ, puis faisait demi-tour).
export function cheminEmploye(etat: EtatJeu, employe: Employe): Case[] | null {
  const village = etat.village
  if (employe.role === 'pousseur' && employe.trajet && employe.lieu === LIAISONS[employe.trajet].depart) {
    const quai = caseQuai(etat, employe.trajet)
    const de = batimentPose(village, employe.depuis)
    if (quai && de) {
      const depart = caseAcces(village, de)
      return trouverChemin(village, depart, quai) ?? [depart, quai]
    }
  }
  return cheminEntre(village, employe.depuis, employe.lieu)
}

// Le temps de marche de l'employé, sur son chemin.
function secondesMarcheDe(etat: EtatJeu, employe: Employe): number {
  const chemin = cheminEmploye(etat, employe)
  return chemin ? longueurChemin(chemin) / VITESSE_MARCHE : 0
}

// Combien de secondes avant qu'il ait fini son étape en cours.
export function secondesRestantesEmploye(etat: EtatJeu, employe: Employe): number {
  switch (employe.etape) {
    case 'creuse':
      return Math.max(0, (tailleSacEmploye(employe) - nbDansSacEmploye(employe) - employe.progression) / vitesseEmploye(employe))
    case 'monte':
    case 'descend':
      return employe.enCabine ? secondesRestantesNavette(etat) : 0
    case 'forge':
      return Math.max(0, SECONDES_FORGE_EMPLOYE - employe.progression)
    case 'marche':
      return Math.max(0, secondesMarcheDe(etat, employe) - employe.progression)
    default:
      return 0
  }
}

// Le prix de son prochain niveau : une pioche pour un mineur, un niveau de vitesse (23/10) pour
// un pousseur (il pousse son wagonnet plus vite ; son chariot, c'est coutChariotPousseur).
export function coutAmeliorationEmploye(_etat: EtatJeu, employe: Employe): Cout | null {
  if (employe.role === 'pousseur') return NIVEAUX_POUSSEUR[employe.niveau + 1]?.cout ?? null
  return NIVEAUX_EMPLOYE[employe.niveau + 1]?.cout ?? null
}

// (25/10) Le cadenas de son prochain niveau : « 🕳️ Mine 3 » (le palier de la mine qu'il faut),
// ou null si c'est débloqué.
export function verrouMinePioche(etat: EtatJeu, employe: Employe): string | null {
  return verrou(etat, employe.role === 'pousseur' ? 'pousseur' : 'equipement', employe.niveau + 1)
}

export function peutAmeliorerEmploye(etat: EtatJeu, employe: Employe): boolean {
  const cout = coutAmeliorationEmploye(etat, employe)
  return cout !== null && debloque(etat, employe.role === 'pousseur' ? 'pousseur' : 'equipement', employe.niveau + 1) && peutPayer(etat, cout)
}

// (23/10) Le chariot d'un pousseur : sa deuxième amélioration (argent et fer).
export function coutChariotPousseur(_etat: EtatJeu, employe: Employe): Cout | null {
  if (employe.role !== 'pousseur') return null
  return NIVEAUX_CHARIOT_POUSSEUR[(employe.chariot ?? 0) + 1]?.cout ?? null
}

export function peutAgrandirChariot(etat: EtatJeu, employe: Employe): boolean {
  const cout = coutChariotPousseur(etat, employe)
  return cout !== null && debloque(etat, 'chariotPousseur', (employe.chariot ?? 0) + 1) && peutPayer(etat, cout)
}

export function agrandirChariot(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  if (!employe) return []
  const cout = coutChariotPousseur(etat, employe)
  if (cout === null || !peutAgrandirChariot(etat, employe)) return []
  payer(etat, cout)
  employe.chariot = (employe.chariot ?? 0) + 1
  return [t('🛒 Le chariot de {nom} porte maintenant {places} places.', { nom: employe.nom, places: NIVEAUX_CHARIOT_POUSSEUR[employe.chariot].places })]
}

// ---------------------------------------------------------------------------
// Les salaires
// ---------------------------------------------------------------------------

// Le salaire de 5 minutes d'un mineur, selon sa pioche et sa rareté.
export function salaireEmploye(employe: Employe): number {
  // (23/10) Un pousseur : selon sa vitesse ET la taille de son chariot.
  const base =
    employe.role === 'pousseur'
      ? SALAIRE_POUSSEUR_BASE + SALAIRE_POUSSEUR_PAR_VITESSE * employe.niveau + SALAIRE_POUSSEUR_PAR_CHARIOT * (employe.chariot ?? 0)
      : SALAIRES[Math.min(employe.niveau, SALAIRES.length - 1)]
  return Math.round(base * rareteDe(employe).salaire)
}

// Sans manager, on paie au plus 5 minutes à la fois.
function secondesPayables(employe: Employe, secondes: number): number {
  return Math.max(0, Math.min(secondes, SECONDES_PAR_PAIE - employe.tempsPaye))
}

function prixDuTemps(employe: Employe, secondes: number): number {
  return Math.ceil((salaireEmploye(employe) * secondes) / SECONDES_PAR_PAIE)
}

// Ce que coûte de payer `secondes` de plus à chaque mineur (sans dépasser 5 minutes payées).
export function coutSalaires(etat: EtatJeu, secondes: number): number {
  return etat.employes.reduce((total, e) => total + prixDuTemps(e, secondesPayables(e, secondes)), 0)
}

export function salairesParPaie(etat: EtatJeu): number {
  return etat.employes.reduce((total, e) => total + salaireEmploye(e), 0)
}

export function tempsPayeMin(etat: EtatJeu): number {
  return etat.employes.length === 0 ? 0 : Math.min(...etat.employes.map((e) => e.tempsPaye))
}

export function nbSansSalaire(etat: EtatJeu): number {
  return etat.employes.filter((e) => e.tempsPaye <= 0).length
}

export function peutPayerSalaires(etat: EtatJeu, secondes: number): boolean {
  const cout = coutSalaires(etat, secondes)
  return !managerPaieLesSalaires(etat) && cout > 0 && etat.argent >= cout
}

export function payerSalaires(etat: EtatJeu, secondes: number): string[] {
  if (!peutPayerSalaires(etat, secondes)) return []
  let paye = 0
  for (const employe of etat.employes) {
    const temps = secondesPayables(employe, secondes)
    paye += prixDuTemps(employe, temps)
    employe.tempsPaye += temps
  }
  etat.argent -= paye
  etat.stats.salairesPayes += paye
  return [t('💵 Salaires payés ({paye} $) : tes mineurs travaillent encore {minutes} min.', { paye: nombre(paye), minutes: Math.ceil(tempsPayeMin(etat) / 60) })]
}

// (23/10) Payer un seul employé : il est complété jusqu'à 5 minutes payées, comme avec « Payer »
// pour tout le monde (sans manager).
export function coutSalaireEmploye(employe: Employe, secondes = SECONDES_PAR_PAIE): number {
  return prixDuTemps(employe, secondesPayables(employe, secondes))
}

export function peutPayerEmploye(etat: EtatJeu, index: number, secondes = SECONDES_PAR_PAIE): boolean {
  const employe = etat.employes[index]
  if (!employe || managerPaieLesSalaires(etat)) return false
  const cout = coutSalaireEmploye(employe, secondes)
  return cout > 0 && etat.argent >= cout
}

export function payerEmploye(etat: EtatJeu, index: number, secondes = SECONDES_PAR_PAIE): string[] {
  const employe = etat.employes[index]
  if (!employe || !peutPayerEmploye(etat, index, secondes)) return []
  const temps = secondesPayables(employe, secondes)
  const paye = prixDuTemps(employe, temps)
  employe.tempsPaye += temps
  etat.argent -= paye
  etat.stats.salairesPayes += paye
  return [t('💵 {nom} est payé(e) ({paye} $) : encore {minutes} min de travail.', { nom: employe.nom, paye: nombre(paye), minutes: Math.ceil(employe.tempsPaye / 60) })]
}

export function alerteSalaires(etat: EtatJeu): string | null {
  const sansSalaire = nbSansSalaire(etat)
  if (managerEndormi(etat)) return t('💤 Ton manager dort : réveille-le au Personnel !')
  if (managerActif(etat) && (etat.manager.tempsPaye <= 0 || sansSalaire > 0)) return t('💼 Plus assez d’argent : personne n’est payé !')
  if (sansSalaire > 0) return sansSalaire === 1 ? t('😠 1 mineur attend son salaire !') : t('😠 {n} mineurs attendent leur salaire !', { n: sansSalaire })
  return null
}

// ---------------------------------------------------------------------------
// Le manager (niveau 3 de la mine) : il paie les salaires avec l'argent du joueur (23/10)
// ---------------------------------------------------------------------------

export function managerDebloque(etat: EtatJeu): boolean {
  return etat.niveauMine >= NIVEAU_MINE_MANAGER
}

// (23/10) Le manager est une option : on peut l'arrêter et le remettre au travail. Arrêté, il ne
// paie plus personne (on paie soi-même, comme avant lui) et on ne lui doit rien.
export function managerActif(etat: EtatJeu): boolean {
  return etat.manager.embauche && etat.manager.actif !== false
}

export function basculerManager(etat: EtatJeu): string[] {
  if (!etat.manager.embauche) return []
  etat.manager.actif = !managerActif(etat)
  return [etat.manager.actif ? t('💼 Ton manager reprend le travail : il paie les salaires tout seul.') : t('💼 Manager arrêté : tu paies les salaires toi-même.')]
}

// (23/10) La fatigue : il reste éveillé secondesEveilManager (15 min au niveau 1), jeu ouvert
// comme jeu fermé, puis il s'endort : il ne paie plus personne (et on ne lui doit rien) tant que
// le joueur ne l'a pas réveillé au Personnel. Endormi, on paie ses employés soi-même.
export function secondesEveilManager(etat: EtatJeu): number {
  return NIVEAUX_MANAGER[Math.min(etat.manager.niveau ?? 0, NIVEAUX_MANAGER.length - 1)].minutesEveil * 60
}

// La fatigue, de 0 (tout juste réveillé) à 1 (endormi).
export function fatigueManager(etat: EtatJeu): number {
  return Math.min(1, (etat.manager.fatigue ?? 0) / secondesEveilManager(etat))
}

export function secondesAvantSommeil(etat: EtatJeu): number {
  return Math.max(0, secondesEveilManager(etat) - (etat.manager.fatigue ?? 0))
}

export function managerEndormi(etat: EtatJeu): boolean {
  return managerActif(etat) && fatigueManager(etat) >= 1
}

// Le manager s'occupe des salaires : embauché, allumé et éveillé.
export function managerPaieLesSalaires(etat: EtatJeu): boolean {
  return managerActif(etat) && !managerEndormi(etat)
}

export function reveillerManager(etat: EtatJeu): string[] {
  if (!etat.manager.embauche) return []
  const dormait = managerEndormi(etat)
  etat.manager.fatigue = 0
  return [dormait ? t('☕ Ton manager est réveillé : il reprend les salaires !') : t('☕ Ton manager est en pleine forme.')]
}

export function managerAuTravail(etat: EtatJeu): boolean {
  return managerPaieLesSalaires(etat) && etat.manager.tempsPaye > 0
}

export function salaireManager(): number {
  return SALAIRE_MANAGER
}

export function prochainNiveauManager(etat: EtatJeu) {
  return NIVEAUX_MANAGER[(etat.manager.niveau ?? 0) + 1] ?? null
}

export function peutAmeliorerManager(etat: EtatJeu): boolean {
  const prochain = prochainNiveauManager(etat)
  return etat.manager.embauche && prochain !== null && debloque(etat, 'tempsManager', (etat.manager.niveau ?? 0) + 1) && peutPayer(etat, prochain.cout)
}

export function ameliorerManager(etat: EtatJeu): string[] {
  const prochain = prochainNiveauManager(etat)
  if (!prochain || !peutAmeliorerManager(etat)) return []
  payer(etat, prochain.cout)
  etat.manager.niveau = (etat.manager.niveau ?? 0) + 1
  const m = prochain.minutesEveil
  const duree = m < 60 ? t('{n} min', { n: m }) : t('{n} h', { n: nombre(m / 60, 3) })
  return [t('💼 Ton manager reste maintenant éveillé {duree} (jeu ouvert ou fermé).', { duree })]
}

export function embaucherManager(etat: EtatJeu): string[] {
  const cout = { argent: PRIX_MANAGER, materiaux: {} }
  if (!managerDebloque(etat) || etat.manager.embauche || !peutPayer(etat, cout)) return []
  payer(etat, cout)
  etat.manager = { embauche: true, tempsPaye: SECONDES_PAR_PAIE, niveau: 0, fatigue: 0 }
  return [t('💼 Manager embauché ! Il paiera les salaires tout seul, avec ton argent.')]
}

export function depensesParPaie(etat: EtatJeu): number {
  return salairesParPaie(etat) + (managerPaieLesSalaires(etat) ? salaireManager() : 0)
}

// Le manager paie (avec l'argent du joueur, 23/10) d'abord son propre salaire, puis les mineurs du moins cher au plus cher.
function payerParManager(etat: EtatJeu): void {
  const manager = etat.manager
  if (!managerPaieLesSalaires(etat)) return
  if (manager.tempsPaye < SECONDES_AVANT_PAIE_MANAGER && etat.argent >= salaireManager()) {
    etat.argent -= salaireManager()
    etat.stats.salairesPayes += salaireManager()
    manager.tempsPaye += SECONDES_PAR_PAIE
  }
  if (!managerAuTravail(etat)) return
  const parSalaire = [...etat.employes].sort((a, b) => salaireEmploye(a) - salaireEmploye(b))
  for (const employe of parSalaire) {
    const salaire = salaireEmploye(employe)
    if (employe.tempsPaye < SECONDES_AVANT_PAIE_MANAGER && etat.argent >= salaire) {
      etat.argent -= salaire
      etat.stats.salairesPayes += salaire
      employe.tempsPaye += SECONDES_PAR_PAIE
    }
  }
}

// ---------------------------------------------------------------------------
// Le recruteur (niveau 4 de la mine) et la rareté
// ---------------------------------------------------------------------------

export function recruteurDebloque(etat: EtatJeu): boolean {
  return etat.niveauMine >= NIVEAU_MINE_RECRUTEUR
}

export function prochainNiveauRecruteur(etat: EtatJeu) {
  return NIVEAUX_RECRUTEUR[etat.recruteur] ?? null
}

export function peutAmeliorerRecruteur(etat: EtatJeu): boolean {
  const prochain = prochainNiveauRecruteur(etat)
  return recruteurDebloque(etat) && prochain !== null && debloque(etat, 'recruteur', etat.recruteur) && peutPayer(etat, prochain.cout)
}

export function ameliorerRecruteur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauRecruteur(etat)
  if (prochain === null || !peutAmeliorerRecruteur(etat)) return []
  payer(etat, prochain.cout)
  etat.recruteur += 1
  if (etat.recruteur === 1) return [t('🎩 Recruteur embauché ! Tes prochaines embauches peuvent être rares, épiques... ou mythiques !')]
  return [t('🎩 Recruteur niveau {n} : plus de chances de trouver des mineurs rares !', { n: etat.recruteur })]
}

export function chancesRecrutement(etat: EtatJeu): Record<IdRarete, number> {
  if (etat.recruteur <= 0) return { commun: 100, rare: 0, epique: 0, legendaire: 0, mythique: 0 }
  return { ...NIVEAUX_RECRUTEUR[Math.min(etat.recruteur, NIVEAUX_RECRUTEUR.length) - 1].chances }
}

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

function prenomAuHasard(etat: EtatJeu, aleatoire: Aleatoire): string {
  const pris = new Set(etat.employes.map((e) => e.nom))
  const libres = NOMS_EMPLOYES.filter((nom) => !pris.has(nom))
  if (libres.length > 0) return choisir(aleatoire, libres)
  return `${choisir(aleatoire, NOMS_EMPLOYES)} ${etat.employes.length + 1}`
}

// ---------------------------------------------------------------------------
// Actions (au Personnel)
// ---------------------------------------------------------------------------

// Où travaille un employé : la mine pour un mineur, le départ de son trajet pour un pousseur.
export function maisonDe(etat: EtatJeu, employe: Employe): IdBatiment {
  if (employe.role !== 'pousseur' || employe.trajet === null) return 'puits'
  const depart = LIAISONS[employe.trajet].depart
  return batimentPose(etat.village, depart) ? depart : 'puits'
}

// Embauche un mineur : ses 10 premières minutes sont payées, puis il descend creuser.
export function embaucher(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const prix = prixEmbauche(etat)
  // (25/10) payer() : en argent, ou en gemmes (acheterAvecGemmes)
  if (prix === null || !peutPayer(etat, { argent: prix, materiaux: {} })) return []
  payer(etat, { argent: prix, materiaux: {} })
  const nom = prenomAuHasard(etat, aleatoire)
  const rarete = tirerRarete(etat, aleatoire)
  // (23/10) Il sort du Personnel et marche jusqu'à la mine, puis il y descend dans la caisse
  // de l'ascenseur (avant, il apparaissait directement au fond de la mine). Il attend la caisse
  // en haut (enCabine : false), et monte dedans quand elle est là.
  const personnel = batimentPose(etat.village, 'employes') !== null
  etat.employes.push({
    nom,
    rarete,
    niveau: 0,
    role: 'mineur',
    trajet: null,
    etape: personnel ? 'marche' : 'descend',
    progression: 0,
    sac: {},
    blocsCasses: 0,
    tempsPaye: SECONDES_PAR_PAIE,
    lieu: 'puits',
    depuis: personnel ? 'employes' : 'puits',
    forgeEnAttente: false,
    enCabine: false,
  })
  if (rarete === 'commun') return [t('👷 {nom} est embauché(e) ! Il part à la mine.', { nom })]
  return [t('👷 {nom} ({rarete} !) est embauché(e) ! Il part à la mine.', { nom, rarete: t(RARETES[rarete].nom).toLowerCase() })]
}

// Peut-on embaucher un pousseur pour ce trajet ? Il faut des rails entre ses deux bâtiments.
export function peutEmbaucherPousseur(etat: EtatJeu, liaison: IdLiaison): boolean {
  const prix = prixEmbauche(etat, 'pousseur')
  // (23/10) Un seul pousseur par trajet : on n'en embauche pas un deuxième.
  return prix !== null && peutPayer(etat, { argent: prix, materiaux: {} }) && ligneDe(etat, liaison) !== null && !trajetPris(etat, liaison)
}

// Ce trajet a-t-il déjà son pousseur ?
export function trajetPris(etat: EtatJeu, liaison: IdLiaison): boolean {
  return etat.employes.some((e) => e.role === 'pousseur' && e.trajet === liaison)
}

// Embauche un pousseur pour un trajet (26/10). Le trajet est créé s'il n'existe pas encore. Il
// part du Personnel vers le départ du trajet, et y attend son wagonnet.
export function embaucherPousseur(etat: EtatJeu, aleatoire: Aleatoire, liaison: IdLiaison): string[] {
  const prix = prixEmbauche(etat, 'pousseur')
  if (prix === null || !peutEmbaucherPousseur(etat, liaison)) return []
  payer(etat, { argent: prix, materiaux: {} })
  if (!trajetDe(etat, liaison)) creerTrajet(etat, liaison)
  const nom = prenomAuHasard(etat, aleatoire)
  const rarete = tirerRarete(etat, aleatoire)
  const depart = LIAISONS[liaison].depart
  const personnel = batimentPose(etat.village, 'employes') !== null
  etat.employes.push({
    nom,
    rarete,
    niveau: 0,
    role: 'pousseur',
    trajet: liaison,
    etape: personnel ? 'marche' : 'quai',
    progression: 0,
    sac: {},
    blocsCasses: 0,
    tempsPaye: SECONDES_PAR_PAIE,
    lieu: depart,
    depuis: personnel ? 'employes' : depart,
    forgeEnAttente: false,
  })
  return [t('🛤️ {nom} est embauché(e) : il va pousser le wagonnet {trajet}.', { nom, trajet: nomTrajet(liaison) })]
}

// « de la mine au marché »... (une fonction, pour que le texte soit dans la langue du moment)
function nomTrajet(liaison: IdLiaison): string {
  switch (liaison) {
    case 'mine-marche':
      return t('de la mine au marché')
    case 'mine-foreuse':
      return t('de la mine à la foreuse')
    case 'mine-generateur':
      return t('de la mine au générateur')
    case 'foreuse-marche':
      return t('de la foreuse au marché')
  }
}

// (23/10) Remplacer un mineur (avec le recruteur) : une nouvelle recrue tirée au hasard (nom et
// rareté) prend sa place, avec sa pioche, là où il était. Bien moins cher que licencier puis
// réembaucher (le prix de la dernière place, plus les indemnités) : on peut tenter sa chance pour
// un mineur rare.
// (23/10) Le prix monte avec le niveau du joueur (au moins 200 $ × niveau²), et il ne dépend pas
// du nombre de mineurs qu'on a : il se cale sur la dernière place qu'on PEUT avoir (maxEmployes).
export function prixRemplacement(etat: EtatJeu): number {
  const parPlace = prixDeBase(Math.max(0, maxEmployes(etat) - 1)) * PART_REMPLACEMENT
  const parNiveau = PRIX_REMPLACEMENT_PAR_NIVEAU * niveauJoueur(etat) ** 2
  return arrondiPrix(Math.max(parPlace, parNiveau))
}

export function peutRemplacer(etat: EtatJeu, index: number): boolean {
  const employe = etat.employes[index]
  return !!employe && employe.role === 'mineur' && etat.recruteur > 0 && etat.argent >= prixRemplacement(etat)
}

export function remplacerMineur(etat: EtatJeu, index: number, aleatoire: Aleatoire): string[] {
  const ancien = etat.employes[index]
  if (!ancien || !peutRemplacer(etat, index)) return []
  etat.argent -= prixRemplacement(etat)
  const nom = prenomAuHasard(etat, aleatoire)
  const rarete = tirerRarete(etat, aleatoire)
  etat.employes[index] = { ...ancien, nom, rarete, blocsCasses: 0 }
  if (rarete === 'commun') return [t('🔄 {ancien} est parti(e) : {nom} prend sa place, avec sa pioche.', { ancien: ancien.nom, nom })]
  return [t('🔄 {ancien} est parti(e) : {nom} ({rarete} !) prend sa place, avec sa pioche.', { ancien: ancien.nom, nom, rarete: t(RARETES[rarete].nom).toLowerCase() })]
}

export function licencier(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  const prix = employe ? indemnites(etat, employe.role) : 0
  if (!employe || etat.argent < prix || employe.etape === 'pousse') return []
  etat.argent -= prix
  etat.employes.splice(index, 1)
  return [t('👋 {nom} est parti(e). Indemnités : {prix} $.', { nom: employe.nom, prix: nombre(prix) })]
}

export function ameliorerEmploye(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  if (!employe) return []
  const cout = coutAmeliorationEmploye(etat, employe)
  if (cout === null || !peutAmeliorerEmploye(etat, employe)) return []
  payer(etat, cout)
  employe.niveau += 1
  if (employe.role === 'pousseur') {
    const niveau = NIVEAUX_POUSSEUR[employe.niveau]
    return [t('🛤️ {nom} est maintenant pousseur {niveau} : il pousse ×{vitesse} plus vite.', { nom: employe.nom, niveau: t(niveau.nom).toLowerCase(), vitesse: nombre(niveau.vitesse, 3) })]
  }
  if (batimentPose(etat.village, 'forgeron')) {
    employe.forgeEnAttente = true
    return [t("⛏️ Le forgeron fait une pioche en {pioche} pour {nom} : elle lui descendra par l'ascenseur.", { pioche: t(NIVEAUX_EMPLOYE[employe.niveau].nom), nom: employe.nom })]
  }
  return [t('⛏️ {nom} a maintenant une pioche en {pioche}.', { nom: employe.nom, pioche: t(NIVEAUX_EMPLOYE[employe.niveau].nom) })]
}

// Changer le trajet d'un pousseur. S'il est en train de pousser, il finit d'abord son voyage ;
// puis il va au quai de son nouveau trajet.
export function changerTrajet(etat: EtatJeu, index: number, liaison: IdLiaison): string[] {
  const employe = etat.employes[index]
  if (!employe || employe.role !== 'pousseur' || employe.trajet === liaison || ligneDe(etat, liaison) === null || trajetPris(etat, liaison)) return []
  if (!trajetDe(etat, liaison)) creerTrajet(etat, liaison)
  employe.trajet = liaison
  return [t('🛤️ {nom} va pousser le wagonnet {trajet}.', { nom: employe.nom, trajet: nomTrajet(liaison) })]
}

// ---------------------------------------------------------------------------
// Le travail, seconde après seconde
// ---------------------------------------------------------------------------

function partir(employe: Employe, de: IdBatiment, vers: IdBatiment): void {
  employe.etape = 'marche'
  employe.depuis = de
  employe.lieu = vers
  employe.progression = 0
}

// Ce qu'il fait ensuite quand il est au village, devant « ici » : attendre son salaire au
// Personnel s'il n'est plus payé, passer à la forge si une pioche l'y attend, sinon reprendre
// son travail (redescendre dans la mine, ou attendre son wagonnet au quai de son trajet).
function suite(etat: EtatJeu, employe: Employe, ici: IdBatiment): string[] {
  employe.lieu = ici
  employe.progression = 0
  if (employe.tempsPaye <= 0) {
    if (ici === 'employes' || !batimentPose(etat.village, 'employes')) {
      employe.etape = 'attend'
      return []
    }
    partir(employe, ici, 'employes')
    return [t('😠 {nom} n’est plus payé(e) : il va attendre son salaire devant le Personnel.', { nom: employe.nom })]
  }
  // Sa nouvelle pioche (27/10) : il ne va plus la chercher, il reste où il est (au fond de la
  // mine) le temps que le forgeron la fasse ; elle lui descend par l'ascenseur. Un mineur ne
  // remonte au village que s'il n'est plus payé.
  if (employe.forgeEnAttente) {
    if (!batimentPose(etat.village, 'forgeron')) employe.forgeEnAttente = false
    else {
      employe.etape = 'forge'
      return []
    }
  }
  const maison = maisonDe(etat, employe)
  if (ici !== maison) {
    partir(employe, ici, maison)
    return []
  }
  employe.etape = employe.role === 'pousseur' ? 'quai' : 'descend'
  // (il arrive à pied : il attend la caisse en haut, puis descend dedans)
  if (employe.etape === 'descend') employe.enCabine = false
  return []
}

// Un mineur est-il au fond de la mine (en train de creuser, d'attendre sa pioche, ou d'attendre
// la caisse pour remonter) ?
function auFond(employe: Employe): boolean {
  if (employe.role !== 'mineur') return false
  return employe.etape === 'creuse' || employe.etape === 'forge' || (employe.etape === 'monte' && !employe.enCabine)
}

function travailler(etat: EtatJeu, employe: Employe, secondes: number, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  let reste = secondes
  let etapes = 0
  while (reste > 1e-9 && etapes++ < 1000) {
    // (une vieille partie : le mineur vidait lui-même son sac en haut) Il est au fond.
    if (employe.etape === 'vide') {
      employe.etape = 'creuse'
      employe.progression = 0
    }
    // Plus de salaire : il arrête de creuser et attend la caisse pour remonter au village.
    if (employe.tempsPaye <= 0 && (employe.etape === 'creuse' || employe.etape === 'forge')) {
      employe.etape = 'monte'
      employe.enCabine = false
      employe.progression = 0
    }
    // Payé de nouveau pendant qu'il attendait la caisse au fond : il se remet à creuser.
    if (employe.etape === 'monte' && !employe.enCabine && employe.tempsPaye > 0) {
      employe.etape = 'creuse'
      employe.progression = 0
    }
    // Plus payé pendant qu'il attendait la caisse en haut : il ne descend pas.
    if (employe.etape === 'descend' && !employe.enCabine && employe.tempsPaye <= 0) {
      messages.push(...suite(etat, employe, 'puits'))
      continue
    }
    // Dans la caisse, ou en train de l'attendre : c'est l'ascenseur qui décide (avancerNavette).
    // (le temps de la descente compte dans son travail payé)
    if (employe.etape === 'monte' || employe.etape === 'descend') {
      if (employe.etape === 'descend' && employe.enCabine) employe.tempsPaye = Math.max(0, employe.tempsPaye - reste)
      break
    }
    // Un mineur n'attend jamais au quai (une vieille partie) : il redescend creuser.
    if (employe.etape === 'quai' && employe.role !== 'pousseur') {
      employe.etape = 'descend'
      employe.enCabine = false
      employe.progression = 0
      continue
    }
    // Au quai, mais pas de payé, ou pas au bon quai (son trajet a changé) : il s'en va.
    if (employe.etape === 'quai' && (employe.tempsPaye <= 0 || employe.lieu !== maisonDe(etat, employe))) {
      messages.push(...suite(etat, employe, employe.lieu))
      if (employe.etape === 'quai') break
      continue
    }
    if (employe.etape === 'attend') {
      if (employe.tempsPaye <= 0) break
      // Payé : il repart. Quand ils partent à plusieurs, ils s'en vont l'un après l'autre (27/10)
      // et pas tous ensemble au même endroit : chacun attend son tour (progression négative).
      // Chacun attend son tour derrière ceux qui marchent déjà depuis le Personnel.
      const devant = etat.employes.filter((e) => e !== employe && e.etape === 'marche' && e.depuis === 'employes').length
      messages.push(...suite(etat, employe, 'employes'))
      // (« as string » : TypeScript croit encore qu'il attend, mais suite() vient de le changer)
      if ((employe.etape as string) === 'marche') employe.progression = -ECART_DEPART * devant
      continue
    }
    // Au quai ou en train de pousser : c'est le wagonnet qui décide (voir wagonnet.ts).
    if (employe.etape === 'quai' || employe.etape === 'pousse') {
      employe.tempsPaye = Math.max(0, employe.tempsPaye - reste)
      break
    }

    let temps: number
    if (employe.etape === 'creuse') {
      // Sa nouvelle pioche (27/10) : il attend au fond que le forgeron la fasse ; elle lui
      // descend par l'ascenseur.
      if (employe.forgeEnAttente) {
        if (batimentPose(etat.village, 'forgeron')) {
          employe.etape = 'forge'
          employe.progression = 0
          continue
        }
        employe.forgeEnAttente = false
      }
      // (25/10) le bonus « production » de la boutique : il creuse deux fois plus vite
      const vitesse = vitesseEmploye(employe) * multiplicateurProduction(etat)
      const place = tailleSacEmploye(employe) - nbDansSacEmploye(employe)
      // Son sac est plein : il attend que la caisse passe le prendre. (23/10) Si c'est parce que
      // le coffre de la mine est plein, ce temps d'attente n'use pas son salaire.
      if (place <= 0) {
        if (placeCoffre(etat) > 0) employe.tempsPaye = Math.max(0, employe.tempsPaye - reste)
        break
      }
      temps = Math.min(reste, employe.tempsPaye, Math.max(0, (place - employe.progression) / vitesse))
      employe.progression += temps * vitesse
      while (employe.progression >= 1 && nbDansSacEmploye(employe) < tailleSacEmploye(employe)) {
        employe.progression -= 1
        ajouterA(employe.sac, tirerBloc(etat.niveauMine, aleatoire), 1)
        employe.blocsCasses += 1
        etat.stats.blocsMineurs += 1
      }
      if (temps <= 1e-9) break
    } else if (employe.etape === 'forge') {
      temps = Math.min(reste, Math.max(0, SECONDES_FORGE_EMPLOYE - employe.progression))
      employe.progression += temps
      if (employe.progression >= SECONDES_FORGE_EMPLOYE - 1e-9) {
        employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
        reste -= temps
        employe.forgeEnAttente = false
        // (une vieille partie : il était allé à la forge du village)
        if (employe.lieu === 'forgeron') messages.push(...suite(etat, employe, 'forgeron'))
        else {
          employe.etape = 'creuse'
          employe.progression = 0
        }
        continue
      }
    } else {
      // Une marche dans le village, d'un bâtiment à un autre.
      const duree = secondesMarcheDe(etat, employe)
      temps = Math.min(reste, Math.max(0, duree - employe.progression))
      employe.progression += temps
      if (employe.progression >= duree - 1e-9) {
        employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
        reste -= temps
        messages.push(...suite(etat, employe, employe.lieu))
        continue
      }
    }
    reste -= temps
    employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
  }
  return messages
}

// ---------------------------------------------------------------------------
// La caisse de l'ascenseur (23/10)
// ---------------------------------------------------------------------------

// La caisse : elle est créée au premier besoin (une vieille partie n'en a pas). Les mineurs d'une
// vieille partie qui montaient ou descendaient avec leur sac sont remis au fond de la mine.
export function navette(etat: EtatJeu): Navette {
  if (!etat.ascenseur.navette) {
    etat.ascenseur.navette = { etape: 'haut', progression: 0, chargement: {} }
    for (const e of etat.employes) {
      if (e.role !== 'mineur') continue
      if (e.etape === 'monte' || e.etape === 'descend' || e.etape === 'vide') {
        e.etape = e.tempsPaye > 0 ? 'creuse' : 'monte'
        e.enCabine = false
        e.progression = 0
      }
    }
  }
  return etat.ascenseur.navette
}

// Pour l'affichage : la caisse, sans rien changer à la partie (en haut et vide si elle n'existe
// pas encore).
export function lireNavette(etat: EtatJeu): Navette {
  return etat.ascenseur.navette ?? { etape: 'haut', progression: 0, chargement: {} }
}

// La caisse a-t-elle du travail ? Tant qu'un mineur est au fond (ou attend en haut pour
// descendre), elle fait ses allers-retours, pleine ou pas. Sinon, elle attend vide en haut.
function navetteOccupee(etat: EtatJeu, caisse: Navette): boolean {
  if (totalObjets(caisse.chargement) > 0) return true
  return etat.employes.some((e) => e.role === 'mineur' && (auFond(e) || e.etape === 'descend' || (e.etape === 'monte' && e.enCabine)))
}

// La durée de l'étape en cours de la caisse.
function dureeEtapeNavette(etat: EtatJeu, caisse: Navette): number {
  switch (caisse.etape) {
    case 'descend':
    case 'monte':
      return secondesTrajetMineur(etat)
    case 'bas':
      return secondesChargementAscenseur(etat)
    default:
      return totalObjets(caisse.chargement) > 0 ? secondesVidageAscenseur(etat) : 0
  }
}

// Le temps avant la fin de son étape (Infinity si elle attend en haut, sans travail).
function secondesAvantEvenementNavette(etat: EtatJeu): number {
  const caisse = navette(etat)
  const duree = dureeEtapeNavette(etat, caisse)
  // En haut, arrêtée : elle attend du travail (ou de la place dans le coffre). Elle repart dès
  // qu'elle est vide et qu'un mineur est au fond.
  if (caisse.etape === 'haut' && caisse.progression >= duree - 1e-9) {
    return navetteOccupee(etat, caisse) && totalObjets(caisse.chargement) === 0 ? 0.05 : Infinity
  }
  return Math.max(0.05, duree - caisse.progression)
}

// Pour l'affichage : les secondes avant qu'elle arrive au bout de son trajet.
export function secondesRestantesNavette(etat: EtatJeu): number {
  const caisse = lireNavette(etat)
  return Math.max(0, dureeEtapeNavette(etat, caisse) - caisse.progression)
}

// La hauteur de la caisse dans le puits : 0 en haut, 1 au fond.
export function hauteurNavette(etat: EtatJeu): number {
  const caisse = lireNavette(etat)
  const f = Math.max(0, Math.min(1, caisse.progression / secondesTrajetMineur(etat)))
  if (caisse.etape === 'descend') return f
  if (caisse.etape === 'monte') return 1 - f
  return caisse.etape === 'bas' ? 1 : 0
}

// Les mineurs dans la caisse en ce moment.
export function passagersNavette(etat: EtatJeu): Employe[] {
  return etat.employes.filter((e) => e.role === 'mineur' && (e.etape === 'monte' || e.etape === 'descend') && e.enCabine)
}

// Au fond : la caisse prend les sacs des mineurs (jusqu'à être pleine), et ceux qui ne sont plus
// payés montent dedans.
function chargerNavette(etat: EtatJeu, caisse: Navette): void {
  let place = capaciteAscenseur(etat) - totalObjets(caisse.chargement)
  for (const e of etat.employes) {
    if (!auFond(e)) continue
    for (const [id, nombre] of Object.entries(e.sac)) {
      const pris = Math.min(place, nombre ?? 0)
      if (pris <= 0) continue
      ajouterA(caisse.chargement, id as IdBloc, pris)
      retirerDe(e.sac, id as IdBloc, pris)
      place -= pris
    }
    if (e.etape === 'monte' && e.tempsPaye <= 0) {
      e.enCabine = true
      e.progression = 0
    }
  }
}

function avancerNavette(etat: EtatJeu, secondes: number): string[] {
  const messages: string[] = []
  const caisse = navette(etat)
  let reste = secondes
  let etapes = 0
  while (reste > 1e-9 && etapes++ < 1000) {
    if (caisse.etape === 'haut') {
      const duree = dureeEtapeNavette(etat, caisse)
      const temps = Math.min(reste, Math.max(0, duree - caisse.progression))
      caisse.progression += temps
      reste -= temps
      if (caisse.progression < duree - 1e-9) break
      // Elle se vide dans le coffre (s'il est plein, elle attend qu'il y ait de la place).
      for (const [id, nombre] of Object.entries(caisse.chargement)) {
        const range = rangerDansCoffre(etat, id as IdBloc, nombre ?? 0)
        retirerDe(caisse.chargement, id as IdBloc, range)
      }
      if (totalObjets(caisse.chargement) > 0) break
      if (!navetteOccupee(etat, caisse)) {
        caisse.progression = duree
        break
      }
      // Elle repart vers le fond, avec ceux qui attendaient pour descendre.
      for (const e of etat.employes) {
        if (e.role === 'mineur' && e.etape === 'descend' && !e.enCabine) {
          e.enCabine = true
          e.progression = 0
        }
      }
      caisse.etape = 'descend'
      caisse.progression = 0
      continue
    }
    const duree = dureeEtapeNavette(etat, caisse)
    const temps = Math.min(reste, Math.max(0, duree - caisse.progression))
    caisse.progression += temps
    reste -= temps
    if (caisse.progression < duree - 1e-9) break
    caisse.progression = 0
    if (caisse.etape === 'descend') {
      // Au fond : ceux qui sont descendus se mettent à creuser.
      for (const e of passagersNavette(etat)) {
        if (e.etape !== 'descend') continue
        e.etape = 'creuse'
        e.enCabine = false
        e.progression = 0
      }
      caisse.etape = 'bas'
    } else if (caisse.etape === 'bas') {
      chargerNavette(etat, caisse)
      caisse.etape = 'monte'
    } else {
      // En haut : ceux qui ne sont plus payés sortent et vont au Personnel.
      for (const e of passagersNavette(etat)) {
        if (e.etape !== 'monte') continue
        e.enCabine = false
        messages.push(...suite(etat, e, 'puits'))
      }
      caisse.etape = 'haut'
    }
  }
  return messages
}

function travaillerManager(etat: EtatJeu, secondes: number): string[] {
  const manager = etat.manager
  // (23/10) Endormi (ou arrêté), il ne fait rien : ni fatigue, ni salaire qui passe.
  if (!managerPaieLesSalaires(etat)) return []
  manager.fatigue = (manager.fatigue ?? 0) + secondes
  if (managerEndormi(etat)) return [t('💤 Ton manager s’est endormi : il ne paie plus les salaires. Réveille-le au Personnel !')]
  if (manager.tempsPaye <= 0) return []
  manager.tempsPaye = Math.max(0, manager.tempsPaye - secondes)
  if (manager.tempsPaye > 0) return []
  return [t('💼 Ton manager n’est plus payé : tu n’as plus assez d’argent pour les salaires !')]
}

// (23/10) Jeu ouvert ou fermé, le manager paie tant qu'il est éveillé (voir la fatigue).
export function avancerEmployes(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  if (etat.employes.length === 0 && !etat.manager.embauche && totalObjets(navette(etat).chargement) === 0) return []
  const messages: string[] = []
  let reste = secondes
  while (reste > 1e-9) {
    // (23/10) On avance par petits morceaux, jusqu'au prochain arrêt de la caisse de
    // l'ascenseur : les mineurs creusent pendant qu'elle fait ses allers-retours.
    const pas = Math.min(reste, PAS_EMPLOYES, secondesAvantEvenementNavette(etat))
    payerParManager(etat)
    for (const employe of etat.employes) messages.push(...travailler(etat, employe, pas, aleatoire))
    messages.push(...avancerNavette(etat, pas))
    messages.push(...travaillerManager(etat, pas))
    reste -= pas
  }
  return [...new Set(messages)]
}

// ---------------------------------------------------------------------------
// Pour l'affichage
// ---------------------------------------------------------------------------

// Où va un employé qui marche (une fonction, pour que le texte soit dans la langue du moment).
function destination(lieu: IdBatiment): string {
  switch (lieu) {
    case 'puits':
      return t('retourne à la mine')
    case 'foreuse':
      return t('va au quai de la foreuse')
    case 'forgeron':
      return t('va chercher sa pioche à la forge')
    case 'employes':
      return t('va attendre son salaire au Personnel')
    default:
      return t('se promène')
  }
}

export function activiteEmploye(etat: EtatJeu, employe: Employe): string {
  const secondes = Math.ceil(secondesRestantesEmploye(etat, employe))
  switch (employe.etape) {
    case 'attend':
      return t('😠 attend son salaire devant le Personnel')
    case 'creuse':
      if (nbDansSacEmploye(employe) >= tailleSacEmploye(employe)) {
        return placeCoffre(etat) === 0 ? t('📦 attend : le coffre de la mine est plein !') : t('🎒 sac plein : attend la caisse de l’ascenseur')
      }
      return t('⛏️ creuse au fond de la mine')
    case 'monte':
      return employe.enCabine ? t('😠 plus payé : remonte au village dans la caisse ({secondes} s)', { secondes }) : t('😠 plus payé : attend la caisse pour remonter')
    case 'vide':
      return t('⛏️ creuse au fond de la mine')
    case 'descend':
      return employe.enCabine ? t('⏬ descend dans la mine ({secondes} s)', { secondes }) : t('⏳ attend la caisse en haut de la mine')
    case 'quai':
      return employe.trajet && !trajetDe(etat, employe.trajet) ? t('🛤️ attend : son trajet est arrêté') : t('🛤️ attend son wagonnet au quai')
    case 'pousse':
      return t('🛤️ pousse le wagonnet')
    case 'forge':
      return t('🔨 attend sa nouvelle pioche du forgeron ({secondes} s)', { secondes })
    default:
      return t('🚶 {destination} ({secondes} s)', { destination: destination(employe.lieu), secondes })
  }
}

export function iconeActiviteEmploye(employe: Employe): string {
  if (employe.etape === 'attend' || ((employe.etape === 'monte' || employe.etape === 'marche') && employe.tempsPaye <= 0)) return '😠'
  const icones: Record<string, string> = { creuse: '⛏️', monte: '⏫', vide: '⛏️', descend: '⏬', quai: '🛤️', pousse: '🛤️', forge: '🔨', marche: '🚶' }
  return icones[employe.etape] ?? '⛏️'
}
