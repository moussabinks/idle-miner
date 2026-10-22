// Les mineurs employés (dès le début, au bâtiment Personnel, 22/10).
// Un mineur creuse lentement au fond de la mine, remonte quand son sac est plein, le vide dans
// le coffre de la mine, puis redescend. L'ascenseur raccourcit ses trajets.
// Les pousseurs (26/10) sont un autre métier : on les embauche pour UN trajet (par exemple Mine →
// Marché). Ils attendent leur wagonnet au quai, devant le bâtiment de départ de ce trajet, et le
// poussent dès qu'il a quelque chose à porter (voir wagonnet.ts). Électrique, plus besoin. Les
// mineurs, eux, ne font que creuser et remonter leur sac dans le coffre de la mine.
// On leur paie un salaire toutes les 10 minutes (sans manager, 10 minutes à la fois) : sans
// salaire, un mineur va attendre, mécontent, devant le Personnel.
// Au niveau 3 de la mine, le recruteur trouve des mineurs plus ou moins rares (un mineur
// mythique creuse 5 fois plus) ; au niveau 4, le manager paie les salaires avec la trésorerie.
// Quand on améliore sa pioche, un mineur va d'abord la chercher à la forge.

import { choisir, type Aleatoire } from './aleatoire'
import {
  EMPLOYES_NIVEAU_1,
  EMPLOYES_PAR_NIVEAU,
  HAUSSE_APRES_LISTE,
  LISTE_RARETES,
  NIVEAUX_EMPLOYE,
  NIVEAUX_RECRUTEUR,
  NIVEAU_MINE_MANAGER,
  NIVEAU_MINE_RECRUTEUR,
  LIAISONS,
  NOMS_EMPLOYES,
  PART_INDEMNITES,
  PRIX_EMBAUCHE,
  PRIX_MANAGER,
  RARETES,
  SALAIRE_MANAGER,
  SALAIRES,
  SECONDES_AVANT_PAIE_MANAGER,
  SECONDES_FORGE_EMPLOYE,
  SECONDES_PAR_PAIE,
  SECONDES_VIDAGE_EMPLOYE,
  type Cout,
  type IdBatiment,
  type IdBloc,
  type IdLiaison,
  type IdRarete,
  type Rarete,
} from './donnees'
import { tirerBloc } from './mine'
import { ajouterA, payer, retirerDe, peutPayer, placeCoffre, rangerDansCoffre, secondesTrajetMineur, totalObjets, type EtatJeu, type Employe } from './mineur'
import { batimentPose, secondesAPied } from './village'
import { creerTrajet, ligneDe, trajetDe } from './wagonnet'

// Le travail avance par morceaux de 30 secondes au plus : après une longue absence, le manager
// a ainsi le temps de payer les salaires entre deux morceaux.
const PAS_EMPLOYES = 30

// ---------------------------------------------------------------------------
// Informations
// ---------------------------------------------------------------------------

// 4 mineurs au niveau 1 de la mine, puis 2 de plus par niveau.
// Les mineurs payés en même temps repartent du Personnel l'un après l'autre, à cet écart (en s).
const ECART_DEPART = 0.7

export function maxEmployes(etat: EtatJeu): number {
  return EMPLOYES_NIVEAU_1 + EMPLOYES_PAR_NIVEAU * (etat.niveauMine - 1)
}

// Le prix de base de la n-ième embauche (n = 0 pour la première).
function prixDeBase(n: number): number {
  const dernier = PRIX_EMBAUCHE.length - 1
  if (n <= dernier) return PRIX_EMBAUCHE[n]
  return PRIX_EMBAUCHE[dernier] * HAUSSE_APRES_LISTE ** (n - dernier)
}

// Des prix faciles à lire : à la dizaine sous 1 000 $, à la centaine au-dessus.
function arrondiPrix(prix: number): number {
  if (prix < 1000) return Math.max(10, Math.round(prix / 10) * 10)
  return Math.round(prix / 100) * 100
}

// Le prix de la prochaine embauche (null si l'équipe est complète).
export function prixEmbauche(etat: EtatJeu): number | null {
  if (etat.employes.length >= maxEmployes(etat)) return null
  return arrondiPrix(prixDeBase(etat.employes.length))
}

// Les indemnités d'un licenciement : 40 % du prix de la dernière place de l'équipe.
export function indemnites(etat: EtatJeu): number {
  return arrondiPrix(prixDeBase(Math.max(0, etat.employes.length - 1)) * PART_INDEMNITES)
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

// Ce qu'un mineur fait sortir de la mine en moyenne, par seconde (creusage et trajets compris).
export function blocsParSecondeEmploye(etat: EtatJeu, employe: Employe): number {
  const sac = tailleSacEmploye(employe)
  const cycle = sac / vitesseEmploye(employe) + 2 * secondesTrajetMineur(etat) + SECONDES_VIDAGE_EMPLOYE
  return sac / cycle
}

export function secondesMarcheEmploye(etat: EtatJeu, de: IdBatiment, vers: IdBatiment): number {
  return secondesAPied(etat.village, de, vers)
}

// Combien de secondes avant qu'il ait fini son étape en cours.
export function secondesRestantesEmploye(etat: EtatJeu, employe: Employe): number {
  switch (employe.etape) {
    case 'creuse':
      return Math.max(0, (tailleSacEmploye(employe) - nbDansSacEmploye(employe) - employe.progression) / vitesseEmploye(employe))
    case 'monte':
    case 'descend':
      return Math.max(0, secondesTrajetMineur(etat) - employe.progression)
    case 'vide':
      return Math.max(0, SECONDES_VIDAGE_EMPLOYE - employe.progression)
    case 'forge':
      return Math.max(0, SECONDES_FORGE_EMPLOYE - employe.progression)
    case 'marche':
      return Math.max(0, secondesMarcheEmploye(etat, employe.depuis, employe.lieu) - employe.progression)
    default:
      return 0
  }
}

export function coutAmeliorationEmploye(employe: Employe): Cout | null {
  return NIVEAUX_EMPLOYE[employe.niveau + 1]?.cout ?? null
}

export function peutAmeliorerEmploye(etat: EtatJeu, employe: Employe): boolean {
  // (un pousseur ne creuse pas : une pioche ne lui servirait à rien, et monterait son salaire)
  if (employe.role === 'pousseur') return false
  const cout = coutAmeliorationEmploye(employe)
  return cout !== null && peutPayer(etat, cout)
}

// ---------------------------------------------------------------------------
// Les salaires
// ---------------------------------------------------------------------------

// Le salaire de 10 minutes d'un mineur, selon sa pioche et sa rareté.
export function salaireEmploye(employe: Employe): number {
  return Math.round(SALAIRES[employe.niveau] * rareteDe(employe).salaire)
}

// Sans manager, on paie au plus 10 minutes à la fois.
function secondesPayables(employe: Employe, secondes: number): number {
  return Math.max(0, Math.min(secondes, SECONDES_PAR_PAIE - employe.tempsPaye))
}

function prixDuTemps(employe: Employe, secondes: number): number {
  return Math.ceil((salaireEmploye(employe) * secondes) / SECONDES_PAR_PAIE)
}

// Ce que coûte de payer `secondes` de plus à chaque mineur (sans dépasser 10 minutes payées).
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
  return !etat.manager.embauche && cout > 0 && etat.argent >= cout
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
  return [`💵 Salaires payés (${paye.toLocaleString('fr-FR')} $) : tes mineurs travaillent encore ${Math.floor(tempsPayeMin(etat) / 60)} min.`]
}

export function alerteSalaires(etat: EtatJeu): string | null {
  const sansSalaire = nbSansSalaire(etat)
  if (etat.manager.embauche && (etat.manager.tempsPaye <= 0 || sansSalaire > 0)) return '💼 Trésorerie vide : personne n’est payé !'
  if (sansSalaire > 0) return sansSalaire === 1 ? '😠 1 mineur attend son salaire !' : `😠 ${sansSalaire} mineurs attendent leur salaire !`
  return null
}

// ---------------------------------------------------------------------------
// Le manager (niveau 4 de la mine) et la trésorerie
// ---------------------------------------------------------------------------

export function managerDebloque(etat: EtatJeu): boolean {
  return etat.niveauMine >= NIVEAU_MINE_MANAGER
}

export function managerAuTravail(etat: EtatJeu): boolean {
  return etat.manager.embauche && etat.manager.tempsPaye > 0
}

export function salaireManager(): number {
  return SALAIRE_MANAGER
}

export function embaucherManager(etat: EtatJeu): string[] {
  if (!managerDebloque(etat) || etat.manager.embauche || etat.argent < PRIX_MANAGER) return []
  etat.argent -= PRIX_MANAGER
  etat.manager = { embauche: true, tempsPaye: SECONDES_PAR_PAIE }
  return ['💼 Manager embauché ! Mets de l’argent dans la trésorerie : il paiera les salaires tout seul.']
}

export function deposerTresorerie(etat: EtatJeu, montant: number): string[] {
  const mis = Math.floor(Math.min(montant, etat.argent))
  if (!etat.manager.embauche || mis <= 0) return []
  etat.argent -= mis
  etat.tresorerie += mis
  return [`💼 +${mis.toLocaleString('fr-FR')} $ dans la trésorerie.`]
}

export function retirerTresorerie(etat: EtatJeu, montant: number): string[] {
  const pris = Math.floor(Math.min(montant, etat.tresorerie))
  if (pris <= 0) return []
  etat.tresorerie -= pris
  etat.argent += pris
  return [`💼 ${pris.toLocaleString('fr-FR')} $ repris de la trésorerie.`]
}

export function depensesParPaie(etat: EtatJeu): number {
  return salairesParPaie(etat) + (etat.manager.embauche ? salaireManager() : 0)
}

export function manquePourUnePaie(etat: EtatJeu): number {
  return Math.max(0, depensesParPaie(etat) - etat.tresorerie)
}

// Le manager paie d'abord son propre salaire, puis les mineurs du moins cher au plus cher.
function payerParManager(etat: EtatJeu): void {
  const manager = etat.manager
  if (!manager.embauche) return
  if (manager.tempsPaye < SECONDES_AVANT_PAIE_MANAGER && etat.tresorerie >= salaireManager()) {
    etat.tresorerie -= salaireManager()
    etat.stats.salairesPayes += salaireManager()
    manager.tempsPaye += SECONDES_PAR_PAIE
  }
  if (!managerAuTravail(etat)) return
  const parSalaire = [...etat.employes].sort((a, b) => salaireEmploye(a) - salaireEmploye(b))
  for (const employe of parSalaire) {
    const salaire = salaireEmploye(employe)
    if (employe.tempsPaye < SECONDES_AVANT_PAIE_MANAGER && etat.tresorerie >= salaire) {
      etat.tresorerie -= salaire
      etat.stats.salairesPayes += salaire
      employe.tempsPaye += SECONDES_PAR_PAIE
    }
  }
}

// ---------------------------------------------------------------------------
// Le recruteur (niveau 3 de la mine) et la rareté
// ---------------------------------------------------------------------------

export function recruteurDebloque(etat: EtatJeu): boolean {
  return etat.niveauMine >= NIVEAU_MINE_RECRUTEUR
}

export function prochainNiveauRecruteur(etat: EtatJeu) {
  return NIVEAUX_RECRUTEUR[etat.recruteur] ?? null
}

export function peutAmeliorerRecruteur(etat: EtatJeu): boolean {
  const prochain = prochainNiveauRecruteur(etat)
  return recruteurDebloque(etat) && prochain !== null && peutPayer(etat, prochain.cout)
}

export function ameliorerRecruteur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauRecruteur(etat)
  if (prochain === null || !peutAmeliorerRecruteur(etat)) return []
  payer(etat, prochain.cout)
  etat.recruteur += 1
  if (etat.recruteur === 1) return ['🎩 Recruteur embauché ! Tes prochaines embauches peuvent être rares, épiques... ou mythiques !']
  return [`🎩 Recruteur niveau ${etat.recruteur} : plus de chances de trouver des mineurs rares !`]
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
  if (prix === null || etat.argent < prix) return []
  etat.argent -= prix
  const nom = prenomAuHasard(etat, aleatoire)
  const rarete = tirerRarete(etat, aleatoire)
  etat.employes.push({
    nom,
    rarete,
    niveau: 0,
    role: 'mineur',
    trajet: null,
    etape: 'descend',
    progression: 0,
    sac: {},
    blocsCasses: 0,
    tempsPaye: SECONDES_PAR_PAIE,
    lieu: 'puits',
    depuis: 'puits',
    forgeEnAttente: false,
  })
  const titre = rarete === 'commun' ? '' : ` (${RARETES[rarete].nom.toLowerCase()} !)`
  return [`👷 ${nom}${titre} est embauché(e) ! Il descend creuser.`]
}

// Peut-on embaucher un pousseur pour ce trajet ? Il faut des rails entre ses deux bâtiments.
export function peutEmbaucherPousseur(etat: EtatJeu, liaison: IdLiaison): boolean {
  const prix = prixEmbauche(etat)
  return prix !== null && etat.argent >= prix && ligneDe(etat, liaison) !== null
}

// Embauche un pousseur pour un trajet (26/10). Le trajet est créé s'il n'existe pas encore. Il
// part du Personnel vers le départ du trajet, et y attend son wagonnet.
export function embaucherPousseur(etat: EtatJeu, aleatoire: Aleatoire, liaison: IdLiaison): string[] {
  const prix = prixEmbauche(etat)
  if (prix === null || !peutEmbaucherPousseur(etat, liaison)) return []
  etat.argent -= prix
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
  return [`🛤️ ${nom} est embauché(e) : il va pousser le wagonnet ${NOMS_TRAJETS[liaison]}.`]
}

// « de la mine au marché »...
const NOMS_TRAJETS: Record<IdLiaison, string> = {
  'mine-marche': 'de la mine au marché',
  'mine-foreuse': 'de la mine à la foreuse',
  'mine-generateur': 'de la mine au générateur',
  'foreuse-marche': 'de la foreuse au marché',
}

export function licencier(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  const prix = indemnites(etat)
  if (!employe || etat.argent < prix || employe.etape === 'pousse') return []
  etat.argent -= prix
  etat.employes.splice(index, 1)
  return [`👋 ${employe.nom} est parti(e). Indemnités : ${prix.toLocaleString('fr-FR')} $.`]
}

export function ameliorerEmploye(etat: EtatJeu, index: number): string[] {
  const employe = etat.employes[index]
  if (!employe) return []
  const cout = coutAmeliorationEmploye(employe)
  if (cout === null || !peutAmeliorerEmploye(etat, employe)) return []
  payer(etat, cout)
  employe.niveau += 1
  if (batimentPose(etat.village, 'forgeron')) {
    employe.forgeEnAttente = true
    return [`⛏️ Le forgeron fait une pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom} pour ${employe.nom} : elle lui descendra par l'ascenseur.`]
  }
  return [`⛏️ ${employe.nom} a maintenant une pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom}.`]
}

// Changer le trajet d'un pousseur. S'il est en train de pousser, il finit d'abord son voyage ;
// puis il va au quai de son nouveau trajet.
export function changerTrajet(etat: EtatJeu, index: number, liaison: IdLiaison): string[] {
  const employe = etat.employes[index]
  if (!employe || employe.role !== 'pousseur' || employe.trajet === liaison || ligneDe(etat, liaison) === null) return []
  if (!trajetDe(etat, liaison)) creerTrajet(etat, liaison)
  employe.trajet = liaison
  return [`🛤️ ${employe.nom} va pousser le wagonnet ${NOMS_TRAJETS[liaison]}.`]
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
    return [`😠 ${employe.nom} n’est plus payé(e) : il va attendre son salaire devant le Personnel.`]
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
  return []
}

function travailler(etat: EtatJeu, employe: Employe, secondes: number, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  let reste = secondes
  let etapes = 0
  while (reste > 1e-9 && etapes++ < 1000) {
    // Plus de salaire : il arrête de creuser et remonte (il vide quand même son sac).
    if (employe.tempsPaye <= 0 && (employe.etape === 'creuse' || employe.etape === 'descend')) {
      employe.etape = 'monte'
      employe.progression = 0
    }
    // Un mineur n'attend jamais au quai (une vieille partie) : il redescend creuser.
    if (employe.etape === 'quai' && employe.role !== 'pousseur') {
      employe.etape = 'descend'
      employe.progression = 0
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
      const vitesse = vitesseEmploye(employe)
      const place = tailleSacEmploye(employe) - nbDansSacEmploye(employe)
      temps = Math.min(reste, employe.tempsPaye, Math.max(0, (place - employe.progression) / vitesse))
      employe.progression += temps * vitesse
      while (employe.progression >= 1 && nbDansSacEmploye(employe) < tailleSacEmploye(employe)) {
        employe.progression -= 1
        ajouterA(employe.sac, tirerBloc(etat.niveauMine, aleatoire), 1)
        employe.blocsCasses += 1
        etat.stats.blocsMineurs += 1
      }
      if (nbDansSacEmploye(employe) >= tailleSacEmploye(employe)) {
        employe.etape = 'monte'
        employe.progression = 0
      }
    } else if (employe.etape === 'monte' || employe.etape === 'descend') {
      const duree = secondesTrajetMineur(etat)
      temps = Math.min(reste, Math.max(0, duree - employe.progression))
      employe.progression += temps
      if (employe.progression >= duree - 1e-9) {
        employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
        reste -= temps
        employe.progression = 0
        if (employe.etape === 'descend') employe.etape = 'creuse'
        else employe.etape = 'vide'
        continue
      }
    } else if (employe.etape === 'vide') {
      // Il vide son sac dans le coffre (s'il est plein, il attend qu'il y ait de la place).
      temps = Math.min(reste, Math.max(0, SECONDES_VIDAGE_EMPLOYE - employe.progression))
      employe.progression += temps
      if (employe.progression >= SECONDES_VIDAGE_EMPLOYE - 1e-9) {
        for (const [id, nombre] of Object.entries(employe.sac)) {
          const bloc = id as IdBloc
          const range = rangerDansCoffre(etat, bloc, nombre ?? 0)
          retirerDe(employe.sac, bloc, range)
        }
        if (nbDansSacEmploye(employe) > 0) {
          // Le coffre est plein : il attend, sans rien faire, qu'on le vide.
          employe.tempsPaye = Math.max(0, employe.tempsPaye - reste)
          if (placeCoffre(etat) === 0) break
          continue
        }
        employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
        reste -= temps
        messages.push(...suite(etat, employe, 'puits'))
        continue
      }
    } else if (employe.etape === 'forge') {
      temps = Math.min(reste, Math.max(0, SECONDES_FORGE_EMPLOYE - employe.progression))
      employe.progression += temps
      if (employe.progression >= SECONDES_FORGE_EMPLOYE - 1e-9) {
        employe.tempsPaye = Math.max(0, employe.tempsPaye - temps)
        reste -= temps
        employe.forgeEnAttente = false
        messages.push(...suite(etat, employe, employe.lieu))
        continue
      }
    } else {
      // Une marche dans le village, d'un bâtiment à un autre.
      const duree = secondesMarcheEmploye(etat, employe.depuis, employe.lieu)
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

function travaillerManager(etat: EtatJeu, secondes: number): string[] {
  const manager = etat.manager
  if (!manager.embauche || manager.tempsPaye <= 0) return []
  manager.tempsPaye = Math.max(0, manager.tempsPaye - secondes)
  if (manager.tempsPaye > 0) return []
  return ['💼 Ton manager n’est plus payé : la trésorerie est vide ! Remplis-la au Personnel.']
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
  return [...new Set(messages)]
}

// ---------------------------------------------------------------------------
// Pour l'affichage
// ---------------------------------------------------------------------------

const DESTINATIONS: Partial<Record<IdBatiment, string>> = {
  puits: 'retourne à la mine',
  foreuse: 'va au quai de la foreuse',
  forgeron: 'va chercher sa pioche à la forge',
  employes: 'va attendre son salaire au Personnel',
}

export function activiteEmploye(etat: EtatJeu, employe: Employe): string {
  const secondes = Math.ceil(secondesRestantesEmploye(etat, employe))
  switch (employe.etape) {
    case 'attend':
      return '😠 attend son salaire devant le Personnel'
    case 'creuse':
      return `⛏️ creuse au fond (sac plein dans ${secondes} s)`
    case 'monte':
      return employe.tempsPaye <= 0 ? `😠 plus payé : remonte au village (${secondes} s)` : `⏫ son sac remonte dans la caisse (${secondes} s)`
    case 'vide':
      return placeCoffre(etat) === 0 ? '📦 attend : le coffre de la mine est plein !' : `📦 la caisse se vide dans le coffre (${secondes} s)`
    case 'descend':
      return `⏬ la caisse lui redescend (${secondes} s)`
    case 'quai':
      return employe.trajet && !trajetDe(etat, employe.trajet) ? '🛤️ attend : son trajet est arrêté' : '🛤️ attend son wagonnet au quai'
    case 'pousse':
      return '🛤️ pousse le wagonnet'
    case 'forge':
      return `🔨 attend sa nouvelle pioche du forgeron (${secondes} s)`
    default:
      return `🚶 ${DESTINATIONS[employe.lieu] ?? 'se promène'} (${secondes} s)`
  }
}

export function iconeActiviteEmploye(employe: Employe): string {
  if (employe.etape === 'attend' || ((employe.etape === 'monte' || employe.etape === 'marche') && employe.tempsPaye <= 0)) return '😠'
  const icones: Record<string, string> = { creuse: '⛏️', monte: '⏫', vide: '📦', descend: '⏬', quai: '🛤️', pousse: '🛤️', forge: '🔨', marche: '🚶' }
  return icones[employe.etape] ?? '⛏️'
}
