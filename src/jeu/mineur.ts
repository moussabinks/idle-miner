// L'état de la partie et les actions du joueur (22/10 : la mine automatique).
//
// Il n'y a plus de vue en coupe ni de profondeur : la mine a 5 niveaux (voir mine.ts). Tout ce
// qui en sort va dans le coffre de la mine :
//   - la mine sort toute seule quelques blocs par seconde (le vieux treuil) ;
//   - le joueur, devant la mine, clique sur le bloc : chaque clic casse un bloc ;
//   - les mineurs employés creusent, et la caisse de l'ascenseur remonte leurs blocs (voir employes.ts) ;
//   - la foreuse a son propre chariot (voir foreuse.ts).
// (25/10) Le joueur vend le coffre d'un clic, depuis la mine, au prix du marché (plus de sac à
// dos). Avec des rails de la mine au marché, le wagonnet le vend tout seul (voir wagonnet.ts) :
// poussé par le joueur ou un pousseur, plus vite avec l'électricité du générateur.
//
// Une action modifie l'état qu'on lui donne et renvoie les messages à afficher.

import type { Aleatoire } from './aleatoire'
import {
  BLOCS,
  BONUS_COMBO,
  CLICS_MAINS_NUES,
  NIVEAUX_ASCENSEUR,
  NIVEAUX_COFFRE,
  NIVEAUX_MINE,
  NIVEAU_MINE_MAX,
  PIOCHES,
  SECONDES_ECHELLE,
  SECONDES_CHARGEMENT_ASCENSEUR,
  SECONDES_VIDAGE_EMPLOYE,
  CAPACITE_ECHELLE,
  type BonusCombo,
  type Cout,
  type IdBloc,
  type IdRarete,
  type IdBatiment,
  type IdLiaison,
  type NiveauAscenseur,
  type Pioche,
} from './donnees'
import { infoNiveauMine, tirerBloc } from './mine'
import { debloque, recordsDeDepart } from './niveaux'
import { ascenseurAlimente, multiplicateurGenerateur } from './generateur'
import { nombre, t } from './langue'
import { boostActif, multiplicateurVentes, prixEnGemmes, type Boosts, type Quotidien } from './gemmes'
import { nouveauVillage, type Village } from './village'

export type Inventaire = Partial<Record<IdBloc, number>>

export type Statistiques = {
  blocsCasses: number // les blocs que tu as cassés en cliquant
  blocsMine: number // les blocs sortis tout seuls de la mine
  argentGagne: number // tout l'argent gagné (ventes au marché, wagonnet, chariot de la foreuse)
  argentForeuse: number // l'argent des chariots de la foreuse
  argentWagonnet: number // l'argent des voyages du wagonnet
  blocsParType: Inventaire // ce que tu as cassé en cliquant, par sorte
  blocsForeuse: number
  blocsMineurs: number
  diamantsTrouves: number
  salairesPayes: number // les salaires payés aux mineurs et au manager
  tempsDeJeu: number // en secondes
  voyagesWagonnet: number
  meilleurCombo?: number // (23/10) le plus long combo de clics (absent : 0)
  pubsVues?: number // (25/10) les publicités regardées (absent : 0)
}

export function nouvellesStatistiques(): Statistiques {
  return {
    blocsCasses: 0,
    blocsMine: 0,
    argentGagne: 0,
    argentForeuse: 0,
    argentWagonnet: 0,
    blocsParType: {},
    blocsForeuse: 0,
    blocsMineurs: 0,
    diamantsTrouves: 0,
    salairesPayes: 0,
    tempsDeJeu: 0,
    voyagesWagonnet: 0,
  }
}

// Le coffre de la mine : tout ce qui sort de la mine y attend.
export type Coffre = {
  niveau: number // index dans NIVEAUX_COFFRE
  contenu: Inventaire
  // (23/10) Ce que le wagonnet du marché laisse toujours dans le coffre, minerai par minerai
  // (« garder 40 fer ») : il n'emporte que le reste. Absent : il emporte tout.
  garder?: Inventaire
}

// La foreuse (niveau 2 de la mine) : un bâtiment qui creuse tout seul avec du charbon.
export type Foreuse = {
  carburant: number // secondes de forage restantes (le charbon brûlé)
  niveauVitesse: number // index dans NIVEAUX_FORAGE
  progression: number // fraction du prochain bloc foré (0 à 1)
  blocsFores: number
  niveauChariot: number // index dans NIVEAUX_CHARIOT
  chariot: Inventaire // ce que la foreuse a remonté
  nonCoches: IdBloc[] // les objets du chariot décochés (ni vendus, ni mis dans le sac)
  rechargeAuto: boolean // (plus utilisé depuis le 23/10 : la recharge automatique est retirée)
}

// Le générateur (niveau 2 de la mine) : il brûle de la redstone et électrifie son rayon.
export type Generateur = {
  niveau: number // index dans NIVEAUX_GENERATEUR
  carburant: number // secondes de courant restantes
  allume: boolean // on peut l'éteindre pour garder sa redstone
}

// Un trajet de wagonnet (24/10) : le joueur l'a créé entre deux bâtiments reliés par des rails
// (voir LIAISONS). Le wagonnet charge au départ, roule jusqu'à l'arrivée, y livre, puis revient.
export type EtapeWagonnet = 'quai' | 'aller' | 'retour'
export type Trajet = {
  liaison: IdLiaison // d'où à où (un seul wagonnet par liaison)
  etape: EtapeWagonnet // au quai (au départ), en route vers l'arrivée, ou sur le retour
  distance: number // les cases déjà parcourues sur cette étape
  chargement: Inventaire
  // Qui le fait avancer : le joueur, un mineur (son nom), ou l'électricité.
  pousseur: 'joueur' | 'electricite' | string | null
  // Les objets que le joueur ne veut pas envoyer sur ce trajet (réglé dans la fenêtre du trajet).
  // Absent dans les vieilles parties : rien d'exclu.
  exclus?: IdBloc[]
}

// Ce que fait un mineur employé :
//   - un mineur (23/10) : il descend dans la caisse de l'ascenseur (« descend »), creuse au fond
//     (« creuse »), et ne remonte dans la caisse (« monte ») que s'il n'est plus payé. (« vide » :
//     seulement dans les vieilles parties, quand il vidait lui-même son sac) ;
//   - un pousseur (embauché pour un trajet, 26/10) : il attend son wagonnet au quai, devant le
//     bâtiment de départ de son trajet (« quai »), et le pousse jusqu'à l'arrivée et
//     retour (« pousse ») ;
//   - les deux marchent dans le village (« marche » : à la forge, au Personnel, à la mine),
//     récupèrent leur pioche (« forge ») ou attendent leur salaire (« attend »).
export type EtapeEmploye = 'creuse' | 'monte' | 'vide' | 'descend' | 'quai' | 'pousse' | 'marche' | 'forge' | 'attend'
export type RoleEmploye = 'mineur' | 'pousseur'

export type Employe = {
  nom: string
  rarete: IdRarete
  niveau: number // sa pioche (index dans NIVEAUX_EMPLOYE) ; pour un pousseur, sa vitesse (NIVEAUX_POUSSEUR)
  chariot?: number // (23/10) pour un pousseur : la taille de son chariot (NIVEAUX_CHARIOT_POUSSEUR ; absent : 0)
  role: RoleEmploye
  trajet: IdLiaison | null // le trajet d'un pousseur (null pour un mineur)
  etape: EtapeEmploye
  progression: number // blocs (en creusant) ou secondes (trajet, vidage, marche...)
  sac: Inventaire
  blocsCasses: number
  tempsPaye: number // les secondes de travail déjà payées (son salaire)
  lieu: IdBatiment // où il est (ou vers où il marche)
  depuis: IdBatiment // d'où il part
  forgeEnAttente: boolean // il doit passer à la forge chercher sa nouvelle pioche
  // (23/10) Il est dans la caisse de l'ascenseur (on le voit dedans) : il arrive du village et
  // descend, ou il n'est plus payé et remonte. En « descend » ou « monte » sans être dans la
  // caisse, il l'attend (en haut pour descendre, au fond pour remonter).
  enCabine?: boolean
}

// La caisse de l'ascenseur (23/10) : elle fait des allers-retours sans cesse tant que des
// mineurs travaillent au fond, pleine ou pas. En haut, elle se vide dans le coffre ; au fond,
// elle prend ce que les mineurs ont creusé. Les mineurs, eux, restent au fond.
export type EtapeNavette = 'haut' | 'descend' | 'bas' | 'monte'
export type Navette = {
  etape: EtapeNavette
  progression: number // les secondes passées dans cette étape
  chargement: Inventaire // les blocs dans la caisse
}

// Le manager (niveau 3 de la mine) : il paie les salaires tout seul, avec l'argent du joueur
// (23/10 : plus de trésorerie à remplir).
export type Manager = {
  embauche: boolean
  tempsPaye: number
  niveau?: number // (23/10) index dans NIVEAUX_MANAGER : combien de temps il reste éveillé (absent : 0)
  fatigue?: number // (23/10) les secondes passées éveillé depuis son dernier réveil (absent : 0)
  actif?: boolean // (23/10) on peut l'arrêter : il ne paie plus personne (absent : il travaille)
}

// Ce qui se débloque en descendant dans la mine (une bulle ✨ guide le joueur jusqu'au bâtiment).
export type Decouverte = 'recruteur' | 'manager'

export type EtatJeu = {
  version: number
  argent: number
  // (25/10) Les gemmes : on en gagne en regardant une publicité, en montant de niveau et avec les
  // récompenses quotidiennes. Elles paient une amélioration sans argent ni minerais, ou un bonus.
  gemmes: number
  boosts: Boosts // les bonus de la boutique en cours (voir gemmes.ts)
  quotidien: Quotidien // la récompense du jour et la série de jours (voir gemmes.ts)
  niveauMine: number // de 1 à 5
  coffre: Coffre
  prochainBloc: IdBloc // le bloc à cliquer devant la mine
  clics: number // les clics déjà donnés sur ce bloc (avec une pioche cassée, il en faut 2)
  progressionMine: number // fraction du prochain bloc que la mine sort toute seule
  pioches: Record<number, number> // pioches possédées : niveau -> usure (clics déjà donnés)
  niveauPioche: number // la pioche en main
  meilleure: number // la meilleure pioche débloquée
  ascenseur: { niveau: number; navette?: Navette } // 0 = pas d'ascenseur (une vieille partie : l'échelle)
  employes: Employe[]
  recruteur: number // 0 = pas embauché
  manager: Manager
  foreuse: Foreuse
  generateur: Generateur
  niveauWagonnets: number // (plus utilisé depuis le 23/10 : chaque pousseur a son chariot) l'ancienne taille de tous les wagonnets
  trajets: Trajet[]
  succes: string[]
  stats: Statistiques
  decouvertes: Decouverte[]
  village: Village
  // L'étape du tutoriel (27/10, voir tutoriel.ts). Absent dans les vieilles parties : pas de tutoriel.
  tutoriel?: number
  // Le niveau du joueur (29/10, voir niveaux.ts) : l'XP gagnée, et le plus haut chiffre déjà
  // compté de chaque chose qui rapporte de l'XP (blocs cassés, bâtiments, rails...).
  xp: number
  recordsXp: Record<string, number>
  // Le bonus de combo en cours (30/10) : son palier, et l'heure de jeu (stats.tempsDeJeu) où il
  // s'arrête. Absent : pas de bonus.
  bonus?: { palier: number; fin: number } | null
}

// Version 21 (22/10) : la mine automatique. Les parties d'avant repartent de zéro.
// Version 22 (24/10) : les trajets des wagonnets (une partie de la version 21 est convertie).
// Version 23 (26/10) : les pousseurs sont embauchés pour un trajet (une partie de la version 22
// est convertie : un ancien pousseur prend le trajet Mine → Marché).
// Version 24 (29/10) : le niveau du joueur (une partie de la version 23 reçoit l'XP de ce qu'elle a déjà).
// Version 25 (30/10) : l'ascenseur est dans la mine dès le début, les bonus de combo, le résumé
// de l'absence (une partie de la version 24 reçoit l'ascenseur de niveau 1).
// Version 29 (25/10, la grande mise à jour) : plus de sac ni de bazar, 5 niveaux pour tout,
// clairière de 40 × 40, gemmes et récompenses quotidiennes (voir convertirVersion28).
export const VERSION_ETAT = 29
export const VERSION_MINE_AUTOMATIQUE = 21

// ---------------------------------------------------------------------------
// Création d'une partie
// ---------------------------------------------------------------------------

export function nouvelleForeuse(): Foreuse {
  return { carburant: 0, niveauVitesse: 0, progression: 0, blocsFores: 0, niveauChariot: 0, chariot: {}, nonCoches: [], rechargeAuto: false }
}

export function nouveauGenerateur(): Generateur {
  return { niveau: 0, carburant: 0, allume: true }
}

export function nouveauTrajet(liaison: IdLiaison): Trajet {
  return { liaison, etape: 'quai', distance: 0, chargement: {}, pousseur: null }
}

export function creerPartie(aleatoire: Aleatoire): EtatJeu {
  const etat: EtatJeu = {
    version: VERSION_ETAT,
    // (25/10) de quoi poser le Personnel et embaucher son premier mineur dès le tutoriel
    argent: 80,
    gemmes: 0,
    boosts: {},
    quotidien: { dernierJour: null, serie: 0 },
    niveauMine: 1,
    coffre: { niveau: 0, contenu: {} },
    prochainBloc: tirerBloc(1, aleatoire),
    clics: 0,
    progressionMine: 0,
    tutoriel: 0, // un nouveau monde commence par le tutoriel
    pioches: { 0: 0 }, // la pioche en pierre est offerte
    niveauPioche: 0,
    meilleure: 0,
    // (30/10) la mine a son ascenseur dès le début ; (23/10) sa caisse attend vide en haut
    ascenseur: { niveau: 1, navette: { etape: 'haut', progression: 0, chargement: {} } },
    employes: [],
    recruteur: 0,
    manager: { embauche: false, tempsPaye: 0 },
    foreuse: nouvelleForeuse(),
    generateur: nouveauGenerateur(),
    niveauWagonnets: 0,
    trajets: [],
    succes: [],
    stats: nouvellesStatistiques(),
    decouvertes: [],
    village: nouveauVillage(),
    xp: 0,
    recordsXp: {},
  }
  etat.recordsXp = recordsDeDepart(etat)
  return etat
}

// ---------------------------------------------------------------------------
// Inventaires (le coffre de la mine, le chariot de la foreuse...)
// ---------------------------------------------------------------------------

// Le nombre total d'objets d'un inventaire.
export function totalObjets(inventaire: Inventaire): number {
  return Object.values(inventaire).reduce((total, n) => total + (n ?? 0), 0)
}

export function ajouterA(inventaire: Inventaire, bloc: IdBloc, nombre: number): void {
  if (nombre <= 0) return
  inventaire[bloc] = (inventaire[bloc] ?? 0) + nombre
}

export function retirerDe(inventaire: Inventaire, bloc: IdBloc, nombre: number): void {
  const reste = (inventaire[bloc] ?? 0) - nombre
  if (reste > 0) inventaire[bloc] = reste
  else delete inventaire[bloc] // on nettoie les zéros
}

// Les objets les plus chers d'abord.
export function parPrix(inventaire: Inventaire): [IdBloc, number][] {
  return (Object.entries(inventaire) as [IdBloc, number][]).filter(([, n]) => n > 0).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
}

// --- Le coffre de la mine ---

export function capaciteCoffre(etat: EtatJeu): number {
  return NIVEAUX_COFFRE[Math.min(etat.coffre.niveau, NIVEAUX_COFFRE.length - 1)].capacite
}

export function nbDansCoffre(etat: EtatJeu): number {
  return totalObjets(etat.coffre.contenu)
}

export function placeCoffre(etat: EtatJeu): number {
  return Math.max(0, capaciteCoffre(etat) - nbDansCoffre(etat))
}

export function coffrePlein(etat: EtatJeu): boolean {
  return placeCoffre(etat) === 0
}

// Range des objets dans le coffre, tant qu'il y a de la place. Renvoie le nombre rangé.
export function rangerDansCoffre(etat: EtatJeu, bloc: IdBloc, nombre: number): number {
  const range = Math.min(nombre, placeCoffre(etat))
  ajouterA(etat.coffre.contenu, bloc, range)
  return range
}

// ---------------------------------------------------------------------------
// Payer : avec l'argent et les minerais du coffre de la mine (ou avec des gemmes)
// ---------------------------------------------------------------------------

// Combien on a de ce minerai (dans le coffre de la mine).
export function disponible(etat: EtatJeu, bloc: IdBloc): number {
  return etat.coffre.contenu[bloc] ?? 0
}

export function possede(etat: EtatJeu, materiaux: Inventaire): boolean {
  return Object.entries(materiaux).every(([bloc, nombre]) => disponible(etat, bloc as IdBloc) >= (nombre ?? 0))
}

// (25/10) Payer en gemmes : pendant acheterAvecGemmes, peutPayer et payer comptent des gemmes au
// lieu de l'argent et des minerais. Toutes les actions d'achat (améliorer le coffre, une pioche,
// un mineur...) marchent ainsi aussi en gemmes, sans rien changer dans chacune.
let paiementEnGemmes = false

export function peutPayer(etat: EtatJeu, cout: Cout): boolean {
  if (paiementEnGemmes) return (etat.gemmes ?? 0) >= prixEnGemmes(cout)
  return etat.argent >= (cout.argent ?? 0) && possede(etat, cout.materiaux)
}

export function payerMateriaux(etat: EtatJeu, materiaux: Inventaire): void {
  for (const [id, nombre] of Object.entries(materiaux)) retirerDe(etat.coffre.contenu, id as IdBloc, nombre ?? 0)
}

export function payer(etat: EtatJeu, cout: Cout): void {
  if (paiementEnGemmes) {
    etat.gemmes = (etat.gemmes ?? 0) - prixEnGemmes(cout)
    return
  }
  etat.argent -= cout.argent ?? 0
  payerMateriaux(etat, cout.materiaux)
}

// Fait un achat en payant avec des gemmes (l'action est celle d'un achat normal : améliorer le
// coffre, embaucher...). Les conditions (palier de la mine, niveau du joueur) restent les mêmes.
export function acheterAvecGemmes(action: () => string[]): string[] {
  paiementEnGemmes = true
  try {
    return action()
  } finally {
    paiementEnGemmes = false
  }
}

// L'action réussirait-elle en payant en gemmes ? On l'essaie sur une copie de la partie.
export function possibleEnGemmes(etat: EtatJeu, action: (e: EtatJeu) => string[]): boolean {
  const copie = structuredClone(etat)
  acheterAvecGemmes(() => action(copie))
  return copie.gemmes < etat.gemmes
}

// Pourrait-on faire cet achat en gemmes ?
export function peutPayerEnGemmes(etat: EtatJeu, cout: Cout): boolean {
  return (etat.gemmes ?? 0) >= prixEnGemmes(cout)
}

// ---------------------------------------------------------------------------
// Cliquer sur le bloc de la mine
// ---------------------------------------------------------------------------

export function piocheEnMain(etat: EtatJeu): Pioche {
  return PIOCHES[etat.niveauPioche]
}

export function usure(etat: EtatJeu, niveau = etat.niveauPioche): number {
  return etat.pioches[niveau] ?? 0
}

export function durabiliteRestante(etat: EtatJeu): number {
  return Math.max(0, piocheEnMain(etat).durabilite - usure(etat))
}

export function estCassee(etat: EtatJeu): boolean {
  return durabiliteRestante(etat) === 0
}

// Le bonus de combo en cours (null s'il n'y en a pas, ou s'il est fini).
export function bonusActif(etat: EtatJeu): BonusCombo | null {
  if (!etat.bonus || etat.stats.tempsDeJeu >= etat.bonus.fin) return null
  return BONUS_COMBO.find((b) => b.palier === etat.bonus?.palier) ?? null
}

// Les secondes qu'il reste au bonus en cours.
export function secondesBonus(etat: EtatJeu): number {
  return bonusActif(etat) && etat.bonus ? Math.max(0, etat.bonus.fin - etat.stats.tempsDeJeu) : 0
}

// Le joueur atteint un palier de combo (10, 25, 50... clics d'affilée) : il gagne le bonus de ce
// palier (il remplace celui en cours).
export function activerBonusCombo(etat: EtatJeu, palier: number): string[] {
  const bonus = BONUS_COMBO.find((b) => b.palier === palier)
  if (!bonus) return []
  etat.bonus = { palier, fin: etat.stats.tempsDeJeu + bonus.secondes }
  // (23/10) Pas de message au milieu de l'écran : l'étiquette du bonus, au-dessus du bloc de la
  // mine, suffit (il y avait trop de messages).
  return []
}

// La chance de doubler un minerai en cliquant (0 avec une pioche cassée, sauf bonus de combo).
export function chanceDoublement(etat: EtatJeu): number {
  const base = estCassee(etat) ? 0 : piocheEnMain(etat).doublement
  return Math.min(1, base + (bonusActif(etat)?.fortune ?? 0))
}

// Un clic sur le bloc de la mine : il casse le bloc (avec une pioche cassée, un clic sur deux),
// et ce qui tombe va dans le coffre. Le bloc suivant est tiré au hasard.
export function cliquerMine(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  if (coffrePlein(etat)) return [t('📦 Le coffre de la mine est plein : vends-le !')]
  const messages: string[] = []
  const cassee = estCassee(etat)
  etat.clics += 1
  if (cassee && etat.clics < CLICS_MAINS_NUES) return []
  etat.clics = 0
  const bloc = etat.prochainBloc
  const double = BLOCS[bloc].minerai && aleatoire() < chanceDoublement(etat)
  // (un bonus de combo peut casser plusieurs blocs d'un coup : 30/10)
  // (25/10) Le bonus « clics en or » de la boutique : 3 blocs par clic.
  const nombre = (double ? 2 : 1) * (bonusActif(etat)?.blocs ?? 1) * (boostActif(etat, 'clics') ? 3 : 1)
  rangerDansCoffre(etat, bloc, nombre)
  ajouterA(etat.stats.blocsParType, bloc, 1)
  etat.stats.blocsCasses += 1
  if (bloc === 'diamant') etat.stats.diamantsTrouves += nombre
  if (!cassee) {
    etat.pioches[etat.niveauPioche] = usure(etat) + 1
    if (estCassee(etat)) messages.push(t('💥 Ta pioche en {pioche} est cassée ! Il faut 2 clics par bloc : fais-la réparer au forgeron.', { pioche: t(piocheEnMain(etat).nom) }))
  }
  etat.prochainBloc = tirerBloc(etat.niveauMine, aleatoire)
  return messages
}

// La mine sort toute seule quelques blocs par seconde (tant que le coffre a de la place).
// (25/10) Doublé par le bonus « production » de la boutique.
export function debitMine(etat: EtatJeu): number {
  return infoNiveauMine(etat.niveauMine).debit * (boostActif(etat, 'production') ? 2 : 1)
}

export function avancerMine(etat: EtatJeu, secondes: number, aleatoire: Aleatoire): string[] {
  etat.stats.tempsDeJeu += secondes
  if (coffrePlein(etat)) {
    etat.progressionMine = 0
    return []
  }
  etat.progressionMine += secondes * debitMine(etat)
  while (etat.progressionMine >= 1 && !coffrePlein(etat)) {
    etat.progressionMine -= 1
    rangerDansCoffre(etat, tirerBloc(etat.niveauMine, aleatoire), 1)
    etat.stats.blocsMine += 1
  }
  return []
}

// ---------------------------------------------------------------------------
// Les améliorations de la mine : niveau, coffre, ascenseur
// ---------------------------------------------------------------------------

export function prochainNiveauMine(etat: EtatJeu) {
  return etat.niveauMine < NIVEAU_MINE_MAX ? NIVEAUX_MINE[etat.niveauMine] : null
}

export function peutDescendre(etat: EtatJeu): boolean {
  const prochain = prochainNiveauMine(etat)
  return prochain !== null && debloque(etat, 'mine', etat.niveauMine) && peutPayer(etat, prochain.cout)
}

export function descendreNiveauMine(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const prochain = prochainNiveauMine(etat)
  if (prochain === null || !peutDescendre(etat)) return []
  payer(etat, prochain.cout)
  etat.niveauMine = prochain.niveau
  etat.prochainBloc = tirerBloc(etat.niveauMine, aleatoire)
  return [t('⛏️ La mine descend au niveau {n} : {nom} !', { n: prochain.niveau, nom: t(prochain.nom) })]
}

export function prochainNiveauCoffre(etat: EtatJeu) {
  return NIVEAUX_COFFRE[etat.coffre.niveau + 1] ?? null
}

export function agrandirCoffre(etat: EtatJeu): string[] {
  const prochain = prochainNiveauCoffre(etat)
  if (prochain === null || !debloque(etat, 'coffre', etat.coffre.niveau + 1) || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.coffre.niveau += 1
  return [t('📦 Coffre agrandi : {places} places.', { places: nombre(prochain.capacite) })]
}

export function niveauAscenseur(etat: EtatJeu): NiveauAscenseur | null {
  return NIVEAUX_ASCENSEUR[etat.ascenseur.niveau - 1] ?? null
}

export function prochainNiveauAscenseur(etat: EtatJeu): NiveauAscenseur | null {
  return NIVEAUX_ASCENSEUR[etat.ascenseur.niveau] ?? null
}

// Le temps d'un trajet (montée ou descente) de la caisse : à l'échelle, ou en ascenseur. (23/10)
// Dans le rayon du générateur allumé, l'ascenseur va plus vite (+ 30 % à + 75 %).
export function secondesTrajetMineur(etat: EtatJeu): number {
  const base = niveauAscenseur(etat)?.secondesTrajet ?? SECONDES_ECHELLE
  return ascenseurAlimente(etat) ? base / multiplicateurGenerateur(etat) : base
}

// (23/10) Combien de blocs la caisse de l'ascenseur remonte à chaque voyage.
export function capaciteAscenseur(etat: EtatJeu): number {
  return niveauAscenseur(etat)?.capacite ?? CAPACITE_ECHELLE
}

// (23/10) Le temps de charger la caisse au fond, et de la vider dans le coffre : plus rapides
// quand on améliore l'ascenseur.
export function secondesChargementAscenseur(etat: EtatJeu): number {
  return niveauAscenseur(etat)?.secondesChargement ?? SECONDES_CHARGEMENT_ASCENSEUR
}

export function secondesVidageAscenseur(etat: EtatJeu): number {
  return niveauAscenseur(etat)?.secondesVidage ?? SECONDES_VIDAGE_EMPLOYE
}

// La durée d'un aller-retour de la caisse (descendre, charger, remonter, vider).
export function secondesAllerRetourAscenseur(etat: EtatJeu): number {
  return 2 * secondesTrajetMineur(etat) + secondesChargementAscenseur(etat) + secondesVidageAscenseur(etat)
}

// Combien de blocs par seconde l'ascenseur peut remonter au plus.
export function debitAscenseur(etat: EtatJeu): number {
  return capaciteAscenseur(etat) / secondesAllerRetourAscenseur(etat)
}

export function ameliorerAscenseur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauAscenseur(etat)
  if (prochain === null || !debloque(etat, 'ascenseur', etat.ascenseur.niveau) || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.ascenseur.niveau = prochain.niveau
  return [
    prochain.niveau === 1
      ? t('🛗 Ascenseur construit ! Tes mineurs remontent bien plus vite.')
      : t('🛗 Ascenseur niveau {n} : un trajet en {secondes} s.', { n: prochain.niveau, secondes: prochain.secondesTrajet }),
  ]
}

// ---------------------------------------------------------------------------
// Les combos de clics
// ---------------------------------------------------------------------------

// (23/10) Un combo de clics vient de finir : il devient le record s'il est plus long.
export function noterCombo(etat: EtatJeu, combo: number): string[] {
  if (combo <= (etat.stats.meilleurCombo ?? 0)) return []
  const ancien = etat.stats.meilleurCombo ?? 0
  etat.stats.meilleurCombo = combo
  return ancien >= 10 ? [t('🏆 Nouveau record de combo : ×{combo} !', { combo })] : []
}

// ---------------------------------------------------------------------------
// Vendre (25/10 : directement depuis la mine, au prix du marché)
// ---------------------------------------------------------------------------

// Valeur d'un lot d'objets au marché (avec le bonus « ventes » de la boutique, si on donne la partie).
export function valeurDe(objets: Inventaire, etat?: EtatJeu): number {
  let total = 0
  for (const [id, nombre] of Object.entries(objets)) total += (nombre ?? 0) * BLOCS[id as IdBloc].prix
  return Math.round(total * (etat ? multiplicateurVentes(etat) : 1))
}

// Encaisse une vente (coffre, wagonnet, chariot de la foreuse).
export function encaisser(etat: EtatJeu, gain: number): void {
  etat.argent += gain
  etat.stats.argentGagne += gain
}

// Combien de ce minerai la vente laisse dans le coffre : le « 📌 Garder N » (pour payer les
// améliorations, ou pour les wagonnets de la foreuse et du générateur). 0 sinon.
export function garderDansLeCoffre(etat: EtatJeu, bloc: IdBloc): number {
  return etat.coffre.garder?.[bloc] ?? 0
}

// Ce que « Tout vendre » vendrait : tout le coffre, sauf ce qu'on garde.
export function aVendreDuCoffre(etat: EtatJeu): Inventaire {
  const lot: Inventaire = {}
  for (const [id, nombre] of Object.entries(etat.coffre.contenu)) {
    const bloc = id as IdBloc
    const n = (nombre ?? 0) - garderDansLeCoffre(etat, bloc)
    if (n > 0) lot[bloc] = n
  }
  return lot
}

// Vend un lot du coffre (sans lot : « Tout vendre », sauf ce qu'on garde).
export function vendreCoffre(etat: EtatJeu, lot?: Inventaire): string[] {
  const choisi = lot ?? aVendreDuCoffre(etat)
  const vendus: Inventaire = {}
  for (const [id, nombre] of Object.entries(choisi)) {
    const bloc = id as IdBloc
    const n = Math.max(0, Math.min(Math.floor(nombre ?? 0), etat.coffre.contenu[bloc] ?? 0))
    if (n > 0) vendus[bloc] = n
  }
  const gain = valeurDe(vendus, etat)
  if (gain <= 0) return []
  for (const [bloc, nombre] of Object.entries(vendus)) retirerDe(etat.coffre.contenu, bloc as IdBloc, nombre ?? 0)
  encaisser(etat, gain)
  return [t('💰 Vente : +{gain} $', { gain: nombre(gain) })]
}

// Vend tout un minerai du coffre (même ce qu'on garde).
// (25/10, bug de l'absence) Vend juste assez du coffre pour avoir « montant » $ de plus : les
// minerais les moins chers d'abord, jamais ce qu'on garde. Le manager s'en sert pour payer les
// salaires quand l'argent manque : sans ça, pendant l'absence, il vidait l'argent du joueur en
// salaires pendant que tout ce que les mineurs creusaient s'entassait dans le coffre.
// Renvoie ce que la vente a rapporté.
export function vendreDuCoffrePour(etat: EtatJeu, montant: number): number {
  let gagne = 0
  const lot = aVendreDuCoffre(etat)
  const moinsChersDAbord = parPrix(lot).reverse()
  for (const [bloc, disponibles] of moinsChersDAbord) {
    if (gagne >= montant) break
    const prixPiece = valeurDe({ [bloc]: 1 }, etat)
    if (prixPiece <= 0) continue
    const n = Math.min(disponibles, Math.ceil((montant - gagne) / prixPiece))
    const avant = etat.argent
    vendreCoffre(etat, { [bloc]: n })
    gagne += etat.argent - avant
  }
  return gagne
}

export function vendreMinerai(etat: EtatJeu, bloc: IdBloc): string[] {
  return vendreCoffre(etat, { [bloc]: etat.coffre.contenu[bloc] ?? 0 })
}

// (25/10) La punaise 📌 du panneau de la mine : « garder tout » ce minerai (il n'est plus vendu,
// ni emporté par le wagonnet), ou le vendre de nouveau.
export const GARDER_TOUT = 1_000_000_000

export function estGardeTout(etat: EtatJeu, bloc: IdBloc): boolean {
  return garderDansLeCoffre(etat, bloc) >= GARDER_TOUT
}

export function basculerGarderTout(etat: EtatJeu, bloc: IdBloc): string[] {
  return reglerGarder(etat, bloc, estGardeTout(etat, bloc) ? 0 : GARDER_TOUT)
}

// Règle le « 📌 Garder N » d'un minerai (0 : on peut tout vendre).
export function reglerGarder(etat: EtatJeu, bloc: IdBloc, nombre: number): string[] {
  const garder = { ...(etat.coffre.garder ?? {}) }
  if (nombre > 0) garder[bloc] = Math.floor(nombre)
  else delete garder[bloc]
  etat.coffre.garder = garder
  return []
}

// ---------------------------------------------------------------------------
// Les pioches (au forgeron)
// ---------------------------------------------------------------------------

// Le prix d'une réparation : une partie du prix de réparation, selon l'usure (au moins 1 $ et
// 1 minerai). null si la pioche n'est pas usée.
export function coutReparation(etat: EtatJeu, niveau = etat.niveauPioche): Cout | null {
  const pioche = PIOCHES[niveau]
  const u = usure(etat, niveau)
  if (!pioche || !(niveau in etat.pioches) || u <= 0) return null
  const part = Math.min(1, u / pioche.durabilite)
  const materiaux: Inventaire = {}
  for (const [bloc, nombre] of Object.entries(pioche.reparation.materiaux)) materiaux[bloc as IdBloc] = Math.max(1, Math.ceil((nombre ?? 0) * part))
  return { argent: Math.max(1, Math.ceil((pioche.reparation.argent ?? 0) * part)), materiaux }
}

export function peutReparer(etat: EtatJeu, niveau = etat.niveauPioche): boolean {
  const cout = coutReparation(etat, niveau)
  return cout !== null && peutPayer(etat, cout)
}

export function reparer(etat: EtatJeu, niveau = etat.niveauPioche): string[] {
  const cout = coutReparation(etat, niveau)
  if (cout === null || !peutPayer(etat, cout)) return []
  payer(etat, cout)
  etat.pioches[niveau] = 0
  return [t('🔧 Pioche en {pioche} réparée.', { pioche: t(PIOCHES[niveau].nom) })]
}

export function coutPioche(niveau: number): Cout {
  return PIOCHES[niveau].cout
}

// On peut racheter neuve toute pioche déjà débloquée, et débloquer la suivante.
export function peutAcheterPioche(etat: EtatJeu, niveau: number): boolean {
  if (!PIOCHES[niveau] || niveau > etat.meilleure + 1) return false
  if (niveau > etat.meilleure && !debloque(etat, 'pioches', niveau)) return false
  return peutPayer(etat, coutPioche(niveau))
}

export function acheterPioche(etat: EtatJeu, niveau: number): string[] {
  if (!peutAcheterPioche(etat, niveau)) return []
  const nouvelle = niveau > etat.meilleure
  payer(etat, coutPioche(niveau))
  etat.pioches[niveau] = 0
  etat.niveauPioche = niveau
  etat.meilleure = Math.max(etat.meilleure, niveau)
  etat.clics = 0
  const pioche = PIOCHES[niveau]
  return [
    nouvelle
      ? t('⛏️ Nouvelle pioche en {pioche} : {chance} % de chance de doubler les minerais !', { pioche: t(pioche.nom), chance: Math.round(pioche.doublement * 100) })
      : t('⛏️ Pioche en {pioche} neuve.', { pioche: t(pioche.nom) }),
  ]
}

export function equiper(etat: EtatJeu, niveau: number): string[] {
  if (!(niveau in etat.pioches) || niveau === etat.niveauPioche) return []
  etat.niveauPioche = niveau
  etat.clics = 0
  return [t('Tu as pris la pioche en {pioche}.', { pioche: t(PIOCHES[niveau].nom) })]
}
