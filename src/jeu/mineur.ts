// État du mineur et règles du jeu.
//
// Tout l'état d'une partie tient dans un objet `EtatJeu` composé uniquement de
// nombres, de textes et de listes. On peut donc le sauvegarder tel quel en JSON.
//
// Les fonctions « actions » (casserBloc, vendre, reparer, ...) modifient l'état
// qu'on leur donne et renvoient la liste des messages à afficher au joueur.

import { choisir, entierEntre, type Aleatoire } from './aleatoire'
import {
  BLOCS,
  BONUS_PRESTIGE,
  BONUS_VITESSE_PRESTIGE,
  COUCHES_VISIBLES_DESSOUS,
  ENCHANTEMENTS,
  LISTE_ENCHANTEMENTS,
  MINERAIS_COFFRE,
  NIVEAUX_ASCENSEUR,
  PIOCHES,
  LARGEUR_MINE,
  PRIX_SEAU,
  profondeurBedrock,
  profondeurMaxPioche,
  MINERAIS_REPARATION,
  NIVEAUX_RESERVOIR,
  PART_PRIX_REPARATION,
  SACS,
  SECONDES_PAR_CASE,
  SECONDES_PAR_METRE_ECHELLE,
  VITESSE_MAINS_NUES,
  dureeCasse,
  estRocheDure,
  SECONDES_PAR_PAIE,
  type Cout,
  type IdBloc,
  type IdRarete,
  niveauMaxAuPrestige,
  prestigePourNiveau,
  type IdBatiment,
  type IdEnchantement,
  type IdTenue,
  type NiveauAscenseur,
  type Pioche,
} from './donnees'
import { genererCouche, poidsDesBlocs } from './mine'
import { additionnerStatistiques } from './statistiques'
import { envoyerAuMarche, nouveauVillage, railsMineMarche, type Convoi, type Village } from './village'
import {
  bonusVenteTalents,
  chanceDoublementTalents,
  multiplicateurCoffre,
  multiplicateurAscenseur,
  multiplicateurPioche,
  multiplicateurRocheDure,
  multiplicateurUsure,
  type IdTalent,
} from './talents'

// Nombre de couches gardées en mémoire (et affichées) sous la couche en cours.
export const COUCHES_EN_AVANCE = COUCHES_VISIBLES_DESSOUS

export type Inventaire = Partial<Record<IdBloc, number>>

export type Statistiques = {
  blocsCasses: number
  argentGagne: number // tout l'argent gagné (toi, la foreuse et les mineurs)
  tempsMinage: number // en secondes de jeu
  coffresOuverts: number
  geodesCassees: number
  lavesEteintes: number
  diamantsTrouves: number
  // Ajouté le 19/10, pour l'écran des statistiques :
  argentForeuse: number // l'argent des chariots vendus
  argentMineurs: number // l'argent rapporté par les ventes des mineurs employés
  blocsParType: Inventaire // les blocs que tu as cassés, par sorte
  blocsForeuse: number
  blocsMineurs: number
  profondeurMax: number // le plus bas que tu sois descendu
  // Ajouté le 20/10 :
  salairesPayes: number // les salaires payés aux mineurs et au manager
}

// Des statistiques toutes neuves (une nouvelle partie).
export function nouvellesStatistiques(): Statistiques {
  return {
    blocsCasses: 0,
    argentGagne: 0,
    tempsMinage: 0,
    coffresOuverts: 0,
    geodesCassees: 0,
    lavesEteintes: 0,
    diamantsTrouves: 0,
    argentForeuse: 0,
    argentMineurs: 0,
    blocsParType: {},
    blocsForeuse: 0,
    blocsMineurs: 0,
    profondeurMax: 0,
    salairesPayes: 0,
  }
}

// L'ascenseur : une cabine qui monte et descend le long du puits.
// Il peut remonter les minerais tout seul, ou emmener le mineur.
export type Ascenseur = {
  niveau: number // 0 = pas encore construit
  position: number // où est la cabine, en mètres (0 = au village), comme le joueur
  cible: number // où va la cabine
  chargement: Inventaire // ce qu'elle transporte (en haut, il va dans le réservoir, ou au marché par les rails)
  passager: boolean // true = le mineur est dans la cabine
  retourAuFront: boolean // true = après avoir vendu, elle redescend toute seule au front de taille
  quai: Inventaire // les blocs qui attendent au pied de l'ascenseur quand le sac est plein
  garder: IdBloc[] // les objets que l'ascenseur ne prend pas (décochés dans le sac)
  envoiDemande: boolean // true = on a demandé un envoi : la cabine vient, puis repart chargée
  lotDemande: Inventaire | null // ce qu'on a choisi d'envoyer (null = tous les objets cochés)
  envoiAuto: boolean // true = quand le sac est plein, l'ascenseur part tout seul au marché
}

// Le réservoir en haut de la mine (22/10) : ce que l'ascenseur remonte y attend que le joueur
// vienne le chercher (voir prendreDuReservoir). Son niveau est gardé au prestige, pas son contenu.
export type Reservoir = {
  niveau: number // index dans NIVEAUX_RESERVOIR
  contenu: Inventaire
}

// La foreuse (prestige 1) : une seule depuis le 20/10, avec 8 niveaux de forage.
export type Foreuse = {
  active: boolean // activée une fois pour toutes (avec du fer et de la redstone)
  carburant: number // secondes de forage restantes (le charbon brûlé)
  niveauVitesse: number // index dans NIVEAUX_FORAGE
  profondeur: number // profondeur atteinte
  progression: number // fraction du prochain bloc foré (0 à 1)
  blocsFores: number
  niveauChariot: number // index dans NIVEAUX_CHARIOT
  chariot: Inventaire // ce que la foreuse a remonté
  nonCoches: IdBloc[] // les objets du chariot décochés (ni vendus, ni mis dans le sac)
  rechargeAuto: boolean // elle brûle le charbon qu'elle remonte (débloqué au niveau 3 de forage)
}

// Ce que fait un mineur employé : il creuse, remonte (ascenseur), marche dans le village (jusqu'au
// marché, à la forge, au Personnel ou à la mine), vend, récupère sa pioche à la forge,
// redescend... ou attend son salaire devant le bâtiment Personnel (« attend »).
export type EtapeEmploye = 'creuse' | 'monte' | 'marche' | 'vend' | 'forge' | 'descend' | 'attend'

// Un mineur employé (prestige 2) : il creuse tout seul dans sa galerie de la mine (un « univers
// parallèle » de la mine commune, avec sa propre profondeur), remonte dans sa cabine quand son
// sac est plein, marche jusqu'au marché pour vendre (ou charge le wagonnet si des rails relient
// la mine au marché), puis retourne à la mine. Les règles sont dans employes.ts.
export type Employe = {
  nom: string
  rarete: IdRarete // commun, rare, épique... (le recruteur en trouve de plus rares, prestige 4)
  niveau: number // sa pioche (index dans NIVEAUX_EMPLOYE)
  profondeur: number // la profondeur de sa galerie
  etape: EtapeEmploye
  position: number // où il est pendant ses trajets (0 = au village)
  sac: Inventaire
  progression: number // fraction du prochain bloc (en creusant), ou secondes passées au marché (en vendant)
  blocsCasses: number
  gagne: number // ce que ses ventes t'ont rapporté
  tempsPaye: number // les secondes de travail déjà payées (son salaire)
  // Au village (20/10) : le bâtiment où il est (ou vers lequel il marche), celui d'où il part,
  // et s'il doit passer à la forge chercher sa nouvelle pioche.
  lieu: IdBatiment
  depuis: IdBatiment
  forgeEnAttente: boolean
}

// Le manager (prestige 5) : il paie les salaires tout seul, avec l'argent de la trésorerie.
export type Manager = {
  embauche: boolean
  tempsPaye: number // lui aussi est payé (les secondes de travail déjà payées)
}

// Pour quitter le front de taille, le mineur marche d'abord jusqu'au puits (à gauche),
// puis prend l'ascenseur s'il est là, sinon l'échelle.
export type Depart = {
  destination: number // où il va ensuite (0 = village)
  parEchelle: boolean // true = il prend l'échelle même si l'ascenseur est là
  temps: number // secondes passées sur la case en cours
  lot?: Inventaire // ce que l'ascenseur emporte en montant (sinon : tout ce qui n'est pas gardé)
}

export type EtatJeu = {
  version: number
  // Position du joueur sur l'échelle, en mètres : 0 = au village, profondeur - 1 = au front de taille.
  // C'est un nombre à virgule pendant qu'il grimpe.
  position: number
  cible: number // là où le joueur se dirige sur l'échelle
  colonneMineur: number // où se tient le mineur au-dessus de la couche en cours (0 à 9)
  argent: number
  profondeur: number // profondeur de la couche en cours, en mètres (1 = juste sous l'herbe)
  coucheActuelle: (IdBloc | null)[] // null = bloc déjà cassé
  couchesDessous: IdBloc[][] // couches sous la couche en cours (profondeur + 1, + 2, ...)
  enGalerie: boolean // true = on creuse à l'horizontale
  pioches: Record<number, number> // pioches possédées : niveau -> usure
  niveauPioche: number // la pioche équipée
  meilleure: number // plus haut niveau de pioche débloqué
  inventaire: Inventaire // le contenu du sac
  nonAVendre: IdBloc[] // objets décochés au marché : « Vendre tout » les garde
  ascenseur: Ascenseur
  foreuse: Foreuse
  enchantements: Record<IdEnchantement, number>
  niveauSac: number
  seaux: number
  prestige: number
  succes: string[] // identifiants des succès débloqués (gardés au prestige)
  stats: Statistiques // cette partie
  statsTotales: Statistiques // toutes les parties d'avant (les prestiges précédents)
  argentGagneAvant: number // l'argent gagné pendant les prestiges précédents (pour le classement)
  victoire: boolean
  talents: IdTalent[] // l'arbre de prestige (gardé à chaque prestige)
  employes: Employe[] // les mineurs employés (gardés à chaque prestige)
  recruteur: number // le niveau du recruteur (0 = pas embauché ; gardé à chaque prestige)
  manager: Manager // gardé à chaque prestige
  tresorerie: number // l'argent mis de côté pour les salaires (vidé au prestige, comme l'argent)
  decouvertes: Decouverte[] // les stands débloqués que le joueur a déjà visités (voir decouvertes.ts)
  standsVus: string[] // les stands visités depuis le dernier prestige (badge « Nouveaux niveaux », voir objectifs.ts)
  depart: Depart | null // le mineur marche jusqu'au puits avant de monter (null = il ne part pas)
  // Le village vu du ciel (20/10) : les bâtiments posés, les rails, les chemins, les décorations
  // (tout est gardé au prestige), et les chargements en route vers le marché.
  village: Village
  convois: Convoi[]
  reservoir: Reservoir // en haut de la mine : ce que l'ascenseur a remonté (22/10)
  // La tenue du joueur (achetée au Bazar, gardée au prestige).
  tenue: { chapeau: IdTenue | null; haut: IdTenue | null }
  tenuesAchetees: IdTenue[]
}

// Ce qui se débloque avec les prestiges (une flèche guide le joueur jusqu'au bon stand) :
// la foreuse, les mineurs, puis le recruteur et le manager (au stand Personnel).
export type Decouverte = 'foreuse' | 'employes' | 'recruteur' | 'manager'

// Version 18 (20/10) : le village en vue du ciel. Les parties d'avant repartent de zéro.
// Version 20 (22/10) : le réservoir en haut de la mine.
export const VERSION_ETAT = 20

// ---------------------------------------------------------------------------
// Création d'une partie
// ---------------------------------------------------------------------------

// Le premier mètre est l'entrée du puits, déjà creusée : on commence à creuser à -2 m.
export const PROFONDEUR_DEPART = 2

// Une foreuse toute neuve : niveau de forage 0, elle part de la surface.
export function nouvelleForeuse(): Foreuse {
  return {
    active: false,
    carburant: 0,
    niveauVitesse: 0,
    profondeur: 1,
    progression: 0,
    blocsFores: 0,
    niveauChariot: 0,
    chariot: {},
    nonCoches: [],
    rechargeAuto: false,
  }
}

export function nouveauManager(): Manager {
  return { embauche: false, tempsPaye: 0 }
}

export function nouvelAscenseur(): Ascenseur {
  return {
    niveau: 0,
    position: 0,
    cible: 0,
    chargement: {},
    passager: false,
    retourAuFront: false,
    quai: {},
    garder: [],
    envoiDemande: false,
    lotDemande: null,
    envoiAuto: false,
  }
}

// Ce qu'une nouvelle partie reprend de la précédente, au prestige.
export type Heritage = {
  succes: string[]
  nonAVendre: IdBloc[]
  foreuse: Foreuse
  talents: IdTalent[]
  niveauAscenseur: number
  niveauReservoir: number
  employes: Employe[]
  recruteur: number
  manager: Manager
  argentGagneAvant: number
  enchantements: Record<IdEnchantement, number>
  niveauSac: number
  decouvertes: Decouverte[]
  pioches: Record<number, number> // les pioches débloquées (usure)
  meilleure: number
  niveauPioche: number
  statsTotales: Statistiques
  village: Village
  tenue: { chapeau: IdTenue | null; haut: IdTenue | null }
  tenuesAchetees: IdTenue[]
}

export function creerPartie(aleatoire: Aleatoire, prestige = 0, heritage: Partial<Heritage> = {}): EtatJeu {
  const {
    succes = [],
    nonAVendre = [],
    foreuse = nouvelleForeuse(),
    talents = [],
    niveauAscenseur = 0,
    niveauReservoir = 0,
    employes = [],
    recruteur = 0,
    manager = nouveauManager(),
    argentGagneAvant = 0,
    enchantements = { efficacite: 0, fortune: 0, solidite: 0 },
    niveauSac = 0,
    decouvertes = [],
    pioches = { 0: 0 }, // la pioche en bois est offerte
    meilleure = 0,
    niveauPioche = 0,
    statsTotales = nouvellesStatistiques(),
    village = nouveauVillage(),
    tenue = { chapeau: null, haut: null },
    tenuesAchetees = [],
  } = heritage
  const couchesDessous: IdBloc[][] = []
  for (let i = 1; i <= COUCHES_EN_AVANCE; i++) couchesDessous.push(genererCouche(PROFONDEUR_DEPART + i, aleatoire, prestige))

  const etat: EtatJeu = {
    version: VERSION_ETAT,
    position: 0, // on commence au village
    cible: 0,
    colonneMineur: 0,
    argent: 0,
    profondeur: PROFONDEUR_DEPART,
    coucheActuelle: genererCouche(PROFONDEUR_DEPART, aleatoire, prestige),
    couchesDessous,
    enGalerie: false,
    pioches: { ...pioches },
    niveauPioche,
    meilleure,
    inventaire: {},
    nonAVendre: [...nonAVendre],
    // L'ascenseur garde son niveau (la cabine attend au village).
    ascenseur: { ...nouvelAscenseur(), niveau: niveauAscenseur },
    foreuse: structuredClone(foreuse),
    // Les enchantements sont gardés au prestige (19/10) : ils s'appliquent à toutes les pioches.
    enchantements: { ...enchantements },
    niveauSac, // le sac à dos est gardé au prestige (19/10)
    seaux: 0,
    prestige,
    succes: [...succes],
    stats: nouvellesStatistiques(),
    statsTotales: structuredClone(statsTotales),
    argentGagneAvant,
    victoire: false,
    talents: [...talents],
    employes: structuredClone(employes),
    recruteur,
    manager: { ...manager },
    tresorerie: 0,
    decouvertes: [...decouvertes],
    standsVus: [], // remis à zéro à chaque prestige
    depart: null,
    village: structuredClone(village),
    convois: [],
    reservoir: { niveau: niveauReservoir, contenu: {} },
    tenue: { ...tenue },
    tenuesAchetees: [...tenuesAchetees],
  }
  return etat
}

// Recommence une partie après la bedrock, avec un niveau de prestige en plus.
// On garde les succès, les objets gardés au marché, les talents, et tout ce qui
// automatise le jeu : la foreuse, le niveau de l'ascenseur, les mineurs employés, le
// recruteur et le manager. L'argent (et la trésorerie) repartent de 0.
// L'argent gagné est ajouté au total de la partie (pour le classement).
// Le point de prestige gagné se dépense ensuite dans l'arbre (voir talents.ts).
// On ne passe prestige qu'une fois tout amélioré au maximum : voir conditionsPrestige.ts.
export function prestige(etat: EtatJeu, aleatoire: Aleatoire): EtatJeu {
  return creerPartie(aleatoire, etat.prestige + 1, {
    succes: etat.succes,
    nonAVendre: etat.nonAVendre,
    foreuse: foreuseApresPrestige(etat.foreuse),
    talents: etat.talents,
    niveauAscenseur: etat.ascenseur.niveau,
    niveauReservoir: etat.reservoir.niveau, // le réservoir garde sa taille, mais repart vide
    employes: etat.employes.map(employeApresPrestige),
    recruteur: etat.recruteur,
    // Le manager reste, avec au moins 10 minutes payées : il a le temps de voir venir.
    manager: etat.manager.embauche ? { embauche: true, tempsPaye: Math.max(etat.manager.tempsPaye, SECONDES_PAR_PAIE) } : nouveauManager(),
    argentGagneAvant: argentGagneTotal(etat),
    enchantements: etat.enchantements,
    niveauSac: etat.niveauSac,
    decouvertes: etat.decouvertes,
    // Les pioches sont gardées (19/10), toutes réparées : on repart avec sa meilleure pioche.
    pioches: Object.fromEntries(Object.keys(etat.pioches).map((niveau) => [niveau, 0])),
    meilleure: etat.meilleure,
    niveauPioche: etat.meilleure,
    // Les statistiques de cette partie s'ajoutent à celles des parties d'avant.
    statsTotales: additionnerStatistiques(etat.statsTotales, etat.stats),
    // Le village reste tel quel (bâtiments, rails, décorations), et la tenue aussi.
    village: etat.village,
    tenue: etat.tenue,
    tenuesAchetees: etat.tenuesAchetees,
  })
}

// Au prestige, la foreuse garde seulement ses améliorations (activation, vitesse de forage,
// chariot, options) : plus de charbon, chariot vide, et elle repart de la surface.
export function foreuseApresPrestige(foreuse: Foreuse): Foreuse {
  return {
    ...nouvelleForeuse(),
    active: foreuse.active,
    niveauVitesse: foreuse.niveauVitesse,
    niveauChariot: foreuse.niveauChariot,
    rechargeAuto: foreuse.rechargeAuto,
    nonCoches: [...foreuse.nonCoches],
  }
}

// Pareil pour les mineurs employés : ils gardent leur pioche et leur rareté, mais
// recommencent une galerie depuis la surface, le sac vide. Comme cadeau de prestige,
// chacun a au moins 10 minutes de salaire payées : l'équipe se met tout de suite au travail.
export function employeApresPrestige(employe: Employe): Employe {
  return {
    ...employe,
    profondeur: 2,
    etape: 'descend',
    position: 0,
    sac: {},
    progression: 0,
    tempsPaye: Math.max(employe.tempsPaye, SECONDES_PAR_PAIE),
    lieu: 'puits',
    depuis: 'puits',
    forgeEnAttente: false,
  }
}

// Tout l'argent gagné depuis le début, prestiges compris (c'est ce que classe le leaderboard).
export function argentGagneTotal(etat: EtatJeu): number {
  return etat.argentGagneAvant + etat.stats.argentGagne
}

// ---------------------------------------------------------------------------
// Informations calculées à partir de l'état
// ---------------------------------------------------------------------------

export function piocheEquipee(etat: EtatJeu): Pioche {
  return PIOCHES[etat.niveauPioche]
}

export function usure(etat: EtatJeu): number {
  return etat.pioches[etat.niveauPioche] ?? 0
}

export function durabiliteRestante(etat: EtatJeu): number {
  return Math.max(0, piocheEquipee(etat).durabilite - usure(etat))
}

export function estCassee(etat: EtatJeu): boolean {
  return durabiliteRestante(etat) === 0
}

// Bonus de vitesse des pioches gagné avec les prestiges (+10 % par prestige).
export function bonusVitessePrestige(etat: EtatJeu): number {
  return 1 + BONUS_VITESSE_PRESTIGE * etat.prestige
}

export function vitesse(etat: EtatJeu): number {
  if (estCassee(etat)) return VITESSE_MAINS_NUES
  const bonusEfficacite = 1 + 0.25 * etat.enchantements.efficacite
  return piocheEquipee(etat).vitesse * bonusEfficacite * bonusVitessePrestige(etat) * multiplicateurPioche(etat)
}

// La vitesse à une profondeur : le talent « Briseur de roche » aide dans la roche dure.
export function vitesseA(etat: EtatJeu, profondeur: number): number {
  return vitesse(etat) * (estRocheDure(profondeur, etat.prestige) ? multiplicateurRocheDure(etat) : 1)
}

export function tailleSac(etat: EtatJeu): number {
  return SACS[etat.niveauSac].taille
}

export function nbDansSac(etat: EtatJeu): number {
  let total = 0
  for (const quantite of Object.values(etat.inventaire)) total += quantite ?? 0
  return total
}

export function placeLibre(etat: EtatJeu): number {
  return Math.max(0, tailleSac(etat) - nbDansSac(etat))
}

export function sacPlein(etat: EtatJeu): boolean {
  return placeLibre(etat) === 0
}

export function bonusVente(etat: EtatJeu): number {
  return 1 + BONUS_PRESTIGE * etat.prestige + bonusVenteTalents(etat)
}

export function quantite(etat: EtatJeu, bloc: IdBloc): number {
  return etat.inventaire[bloc] ?? 0
}

// La position du front de taille : juste au-dessus de la couche qu'on creuse.
export function positionFront(etat: EtatJeu): number {
  return etat.profondeur - 1
}

export function enMouvement(etat: EtatJeu): boolean {
  return etat.position !== etat.cible
}

// Le joueur est au village (et ne bouge pas) : il peut vendre et acheter.
export function aLaSurface(etat: EtatJeu): boolean {
  return etat.position === 0 && !enMouvement(etat)
}

// Le joueur est au front de taille, prêt à creuser.
export function auFond(etat: EtatJeu): boolean {
  return etat.position === positionFront(etat) && !enMouvement(etat)
}

// Le prochain bloc à casser : celui sous le mineur, sinon le plus proche de lui.
// Renvoie -1 si la couche est finie.
export function indexBlocActuel(etat: EtatJeu): number {
  let meilleur = -1
  etat.coucheActuelle.forEach((bloc, colonne) => {
    if (bloc === null) return
    const distance = Math.abs(colonne - etat.colonneMineur)
    if (meilleur === -1 || distance < Math.abs(meilleur - etat.colonneMineur)) meilleur = colonne
  })
  return meilleur
}

// Le sens dans lequel le mineur avance en creusant la couche : -1 vers la gauche, 1 vers la droite.
// Il creuse en zigzag (une couche vers la droite, la suivante vers la gauche) : il regarde du côté
// où il reste le plus de blocs à casser.
export function sensDeMinage(etat: EtatJeu): -1 | 1 {
  const actuel = indexBlocActuel(etat)
  if (actuel === -1) return 1
  let aGauche = 0
  let aDroite = 0
  etat.coucheActuelle.forEach((bloc, colonne) => {
    if (bloc === null || colonne === actuel) return
    if (colonne < actuel) aGauche += 1
    else aDroite += 1
  })
  return aGauche > aDroite ? -1 : 1
}

export function blocActuel(etat: EtatJeu): IdBloc | null {
  const index = indexBlocActuel(etat)
  return index === -1 ? null : etat.coucheActuelle[index]
}

// Temps (en secondes) pour casser le prochain bloc.
export function dureeBlocActuel(etat: EtatJeu): number {
  const bloc = blocActuel(etat)
  if (bloc === null) return 0
  return dureeCasse(BLOCS[bloc].durete, etat.profondeur, vitesseA(etat, etat.profondeur), etat.prestige)
}

// ---------------------------------------------------------------------------
// Petits outils sur l'inventaire
// ---------------------------------------------------------------------------

export function ajouter(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  if (nombre <= 0) return
  etat.inventaire[bloc] = quantite(etat, bloc) + nombre
}

export function retirer(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  const reste = quantite(etat, bloc) - nombre
  if (reste > 0) etat.inventaire[bloc] = reste
  else delete etat.inventaire[bloc] // on nettoie les zéros
}

// Met des objets dans le sac s'il reste de la place. Renvoie le nombre qui n'a pas tenu.
export function ramasser(etat: EtatJeu, bloc: IdBloc, nombre: number): number {
  const rentre = Math.min(nombre, placeLibre(etat))
  ajouter(etat, bloc, rentre)
  return nombre - rentre
}

export function possede(etat: EtatJeu, materiaux: Inventaire): boolean {
  return Object.entries(materiaux).every(([bloc, nombre]) => quantite(etat, bloc as IdBloc) >= (nombre ?? 0))
}

// A-t-on de quoi payer ce coût (argent et matériaux du sac) ?
export function peutPayer(etat: EtatJeu, cout: Cout): boolean {
  return etat.argent >= (cout.argent ?? 0) && possede(etat, cout.materiaux)
}

export function payer(etat: EtatJeu, cout: Cout): void {
  etat.argent -= cout.argent ?? 0
  payerMateriaux(etat, cout.materiaux)
}

export function payerMateriaux(etat: EtatJeu, materiaux: Inventaire): void {
  for (const [bloc, nombre] of Object.entries(materiaux)) retirer(etat, bloc as IdBloc, nombre ?? 0)
}

// ---------------------------------------------------------------------------
// Minage
// ---------------------------------------------------------------------------

// La chance de doubler un minerai avec Fortune : 20 % par niveau (Fortune III : 60 %).
export const CHANCE_FORTUNE_PAR_NIVEAU = 0.2

// La chance de doubler un minerai : Fortune, plus le talent « Œil de lynx ».
export function chanceDoublement(etat: EtatJeu): number {
  return etat.enchantements.fortune * CHANCE_FORTUNE_PAR_NIVEAU + chanceDoublementTalents(etat)
}

// Nombre d'objets obtenus en cassant un bloc (Fortune et Œil de lynx sur les minerais) :
// 1, ou 2 si la chance de doublement tombe.
export function nbDrops(etat: EtatJeu, bloc: IdBloc, aleatoire: Aleatoire): number {
  const chance = chanceDoublement(etat)
  if (!BLOCS[bloc].minerai || chance === 0) return 1
  return aleatoire() < chance ? 2 : 1
}

// Casse le prochain bloc de la couche en cours.
export function casserBloc(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  const index = indexBlocActuel(etat)
  if (!auFond(etat) || index === -1 || etat.depart !== null) return messages
  // Sac (et quai de l'ascenseur) plein : on ne casse pas le bloc, sinon ce qu'il contient serait perdu.
  if (!peutStocker(etat)) return messages
  const bloc = etat.coucheActuelle[index] as IdBloc
  etat.colonneMineur = index // le mineur se place au-dessus du bloc

  etat.stats.tempsMinage += dureeBlocActuel(etat)

  // Usure de la pioche (Solidité : 1 chance sur n+1 de l'user ; 30 % de moins avec « Pioche robuste »).
  if (!estCassee(etat)) {
    const chanceUsure = multiplicateurUsure(etat) / (etat.enchantements.solidite + 1)
    if (aleatoire() < chanceUsure) {
      etat.pioches[etat.niveauPioche] = usure(etat) + 1
      if (estCassee(etat)) {
        messages.push(`💥 Ta pioche en ${piocheEquipee(etat).nom} est cassée ! Tu mines à mains nues.`)
      }
    }
  }

  messages.push(...finirBloc(etat, index, bloc, aleatoire))
  return messages
}

// Ce qui se passe une fois un bloc cassé :
// on récolte, puis on passe à la couche suivante si c'était le dernier bloc.
function finirBloc(etat: EtatJeu, index: number, bloc: IdBloc, aleatoire: Aleatoire): string[] {
  etat.stats.blocsCasses += 1
  etat.stats.blocsParType[bloc] = (etat.stats.blocsParType[bloc] ?? 0) + 1
  etat.stats.profondeurMax = Math.max(etat.stats.profondeurMax, etat.profondeur)
  const messages = recolter(etat, bloc, aleatoire)
  etat.coucheActuelle[index] = null
  if (indexBlocActuel(etat) === -1) messages.push(...passerCoucheSuivante(etat, aleatoire))
  return messages
}

// Range des objets : dans le sac, et s'il est plein, sur le quai de l'ascenseur
// (ils seront remontés au prochain voyage). Renvoie le nombre d'objets perdus.
function stocker(etat: EtatJeu, bloc: IdBloc, nombre: number): number {
  const reste = ramasser(etat, bloc, nombre)
  const surLeQuai = Math.min(reste, placeQuai(etat))
  if (surLeQuai > 0) etat.ascenseur.quai[bloc] = (etat.ascenseur.quai[bloc] ?? 0) + surLeQuai
  return reste - surLeQuai
}

// Peut-on encore ranger un bloc (dans le sac ou sur le quai de l'ascenseur) ?
export function peutStocker(etat: EtatJeu): boolean {
  return placeLibre(etat) > 0 || placeQuai(etat) > 0
}

// Les minerais qu'on peut trouver à cette profondeur (pour les coffres).
function mineraisDuCoin(etat: EtatJeu): IdBloc[] {
  const minerais = poidsDesBlocs(etat.profondeur, etat.prestige)
    .map((c) => c.valeur)
    .filter((id) => MINERAIS_COFFRE.includes(id))
  return minerais.length > 0 ? minerais : ['charbon']
}

// Ce qu'on obtient en cassant un bloc.
function recolter(etat: EtatJeu, bloc: IdBloc, aleatoire: Aleatoire): string[] {
  const messages: string[] = []

  if (bloc === 'lave') {
    if (etat.seaux > 0) {
      etat.seaux -= 1
      etat.stats.lavesEteintes += 1
      stocker(etat, 'obsidienne', 1)
      messages.push('🪣 Lave éteinte avec ton seau : +1 obsidienne !')
    } else {
      // Sans seau, la lave brûle un tiers de chaque pile du sac.
      let perdus = 0
      for (const [id, nombre] of Object.entries(etat.inventaire)) {
        const perte = Math.floor((nombre ?? 0) / 3)
        retirer(etat, id as IdBloc, perte)
        perdus += perte
      }
      messages.push(`🔥 Aïe, de la lave ! ${perdus} objets brûlés. Achète un seau d'eau.`)
    }
    return messages
  }

  if (bloc === 'coffre') {
    const argent = (entierEntre(aleatoire, 20, 60) + etat.profondeur * entierEntre(aleatoire, 3, 8)) * multiplicateurCoffre(etat)
    etat.argent += argent
    etat.stats.argentGagne += argent
    etat.stats.coffresOuverts += 1
    // Un minerai parmi ceux qu'on trouve à cette profondeur.
    const minerai = choisir(aleatoire, mineraisDuCoin(etat))
    stocker(etat, minerai, 1)
    messages.push(`🧰 Coffre au trésor : +${argent} $ et 1 ${BLOCS[minerai].nom} !`)
    return messages
  }

  if (bloc === 'geode') {
    const nombre = entierEntre(aleatoire, 3, 6)
    etat.stats.geodesCassees += 1
    const perdus = stocker(etat, 'amethyste', nombre)
    messages.push(`🔮 Géode : +${nombre - perdus} améthystes !`)
    return messages
  }

  // Bloc normal : il va dans le sac.
  const nombre = nbDrops(etat, bloc, aleatoire)
  if (bloc === 'diamant') etat.stats.diamantsTrouves += nombre
  const perdus = stocker(etat, bloc, nombre)
  if (perdus > 0) messages.push('🎒 Sac plein ! Remonte vendre au marché (bouton Village) ou envoie l’ascenseur.')
  return messages
}

// Appelé quand les blocs de la couche en cours sont tous cassés.
function passerCoucheSuivante(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  const suivante = etat.profondeur + 1

  // Juste au-dessus de la bedrock : on ne peut plus descendre, mais on continue
  // de creuser des galeries (pour tester ses enchantements avant le prestige).
  if (suivante >= profondeurBedrock(etat.prestige)) {
    if (!etat.victoire) {
      etat.victoire = true
      messages.push('🏆 Tu as atteint la bedrock ! Continue de creuser ici, ou passe prestige à l’arbre de prestige (village).')
    }
    etat.enGalerie = true
    etat.coucheActuelle = genererCouche(etat.profondeur, aleatoire, etat.prestige)
    return messages
  }

  // La couche du dessous est trop dure pour la pioche : galerie horizontale (on n'est jamais bloqué).
  if (suivante > profondeurMaxPioche(etat.niveauPioche, etat.prestige)) {
    if (!etat.enGalerie) messages.push(messageCoucheTropDure(etat))
    etat.enGalerie = true
    etat.coucheActuelle = genererCouche(etat.profondeur, aleatoire, etat.prestige)
    return messages
  }

  etat.enGalerie = false

  // On descend d'un mètre : la première couche du dessous devient la couche en cours,
  // et le mineur descend avec elle.
  const joueurAuFront = auFond(etat)
  const ancienFront = positionFront(etat)
  etat.profondeur = suivante
  if (joueurAuFront) {
    etat.position = positionFront(etat)
    etat.cible = etat.position
  }

  // L'ascenseur suit le front de taille (s'il y attendait, ou s'il y redescendait).
  const ascenseur = etat.ascenseur
  if (ascenseur.niveau > 0 && !ascenseur.passager && ascenseur.cible === ancienFront) {
    ascenseur.cible = positionFront(etat)
    if (ascenseur.position === ancienFront) ascenseur.position = ascenseur.cible
  }

  etat.coucheActuelle = etat.couchesDessous.shift() ?? genererCouche(suivante, aleatoire, etat.prestige)
  const profondeurAGenerer = suivante + COUCHES_EN_AVANCE
  etat.couchesDessous.push(profondeurAGenerer < profondeurBedrock(etat.prestige) ? genererCouche(profondeurAGenerer, aleatoire, etat.prestige) : [])

  return messages
}

// La pioche qu'il faut pour descendre sous la profondeur actuelle (null si aucune ne suffit).
export function piochePourDescendre(etat: EtatJeu): Pioche | null {
  return PIOCHES.find((p) => profondeurMaxPioche(p.niveau, etat.prestige) > etat.profondeur) ?? null
}

// Le message quand la couche suivante est trop dure : quelle pioche il faut, et où la trouver.
export function messageCoucheTropDure(etat: EtatJeu): string {
  const pioche = piochePourDescendre(etat)
  if (pioche === null) return `🧱 Couche trop dure : tu creuses une galerie.`
  if (pioche.niveau in etat.pioches) return `🧱 Couche trop dure ! Équipe ta pioche en ${pioche.nom} (onglet Pioches) pour descendre plus bas.`
  return `🧱 Couche trop dure ! Il te faut une pioche en ${pioche.nom} pour descendre plus bas : achète-la au forgeron (village).`
}

// ---------------------------------------------------------------------------
// Vente
// ---------------------------------------------------------------------------

// Valeur d'un lot d'objets au marché (avec le bonus de prestige).
export function valeurDe(etat: EtatJeu, objets: Inventaire): number {
  let total = 0
  for (const [id, nombre] of Object.entries(objets)) total += (nombre ?? 0) * BLOCS[id as IdBloc].prix
  return Math.round(total * bonusVente(etat))
}

// Ce que « Vendre tout » mettrait en vente : tout le sac, sauf les objets décochés.
export function objetsAVendre(etat: EtatJeu): Inventaire {
  const objets: Inventaire = {}
  for (const [id, nombre] of Object.entries(etat.inventaire)) {
    const bloc = id as IdBloc
    if (!etat.nonAVendre.includes(bloc) && (nombre ?? 0) > 0) objets[bloc] = nombre
  }
  return objets
}

export function apercuVente(etat: EtatJeu): number {
  return valeurDe(etat, objetsAVendre(etat))
}

// Coche ou décoche un objet au marché.
export function basculerVente(etat: EtatJeu, bloc: IdBloc): string[] {
  if (etat.nonAVendre.includes(bloc)) etat.nonAVendre = etat.nonAVendre.filter((b) => b !== bloc)
  else etat.nonAVendre.push(bloc)
  return []
}

// Garder (aVendre = false) ou non un objet quand on vend tout.
export function reglerVente(etat: EtatJeu, bloc: IdBloc, aVendre: boolean): string[] {
  const garder = etat.nonAVendre.filter((b) => b !== bloc)
  etat.nonAVendre = aVendre ? garder : [...garder, bloc]
  return []
}

// Vend une partie du sac : les quantités choisies avec les jauges du marché.
export function vendreLot(etat: EtatJeu, lot: Inventaire): string[] {
  if (!aLaSurface(etat)) return ['⬆️ Le marché est à la surface : remonte au village.']
  const vendus: Inventaire = {}
  for (const [id, nombre] of Object.entries(lot)) {
    const bloc = id as IdBloc
    const pris = Math.max(0, Math.min(Math.floor(nombre ?? 0), quantite(etat, bloc)))
    if (pris > 0) vendus[bloc] = pris
  }
  const gain = valeurDe(etat, vendus)
  if (gain === 0) return ['Rien à vendre pour le moment.']
  for (const [bloc, nombre] of Object.entries(vendus)) retirer(etat, bloc as IdBloc, nombre ?? 0)
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`💰 Vente : +${gain} $`]
}

// « Vendre tout » au marché de la surface.
export function vendre(etat: EtatJeu): string[] {
  if (!aLaSurface(etat)) return ['⬆️ Le marché est à la surface : remonte par l’échelle.']
  const objets = objetsAVendre(etat)
  const gain = valeurDe(etat, objets)
  if (gain === 0) return ['Rien à vendre pour le moment.']
  for (const [bloc, nombre] of Object.entries(objets)) retirer(etat, bloc as IdBloc, nombre ?? 0)
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`💰 Vente : +${gain} $`]
}

// ---------------------------------------------------------------------------
// Déplacements : à gauche et à droite au front, en haut et en bas sur l'échelle
// ---------------------------------------------------------------------------

// Déplace le mineur d'une case au front de taille (sens = -1 pour la gauche, +1 pour la droite).
export function deplacerMineur(etat: EtatJeu, sens: number): string[] {
  if (!auFond(etat)) return []
  etat.depart = null // on change d'avis : il ne part plus
  etat.colonneMineur = Math.min(LARGEUR_MINE - 1, Math.max(0, etat.colonneMineur + sens))
  return []
}

// Choisit où aller sur l'échelle (0 = village, positionFront = front de taille).
// Le joueur y va ensuite petit à petit (voir avancerTemps).
export function allerA(etat: EtatJeu, position: number): string[] {
  if (etat.ascenseur.passager) return [] // dans l'ascenseur, c'est la cabine qui nous porte
  etat.cible = Math.min(positionFront(etat), Math.max(0, Math.round(position)))
  return []
}

// Aller au village (0) ou au front de taille. Depuis le front, le mineur marche d'abord
// jusqu'au puits ; ensuite il prend l'ascenseur s'il est là (sauf parEchelle), sinon l'échelle.
export function voyager(etat: EtatJeu, destination: number, parEchelle = false, lot?: Inventaire): string[] {
  if (etat.ascenseur.passager) return []
  const arrivee = Math.min(positionFront(etat), Math.max(0, Math.round(destination)))
  if (auFond(etat) && etat.colonneMineur > 0 && arrivee < etat.position) {
    etat.depart = { destination: arrivee, parEchelle, temps: 0, lot }
    return []
  }
  etat.depart = null
  if (!parEchelle && ascenseurDisponible(etat)) {
    const messages = prendreAscenseur(etat, arrivee, lot)
    if (messages.length > 0) return messages
  }
  return allerA(etat, arrivee)
}

// Fait marcher le mineur vers le puits, case par case, puis le fait partir.
export function avancerMarche(etat: EtatJeu, secondes: number): string[] {
  const depart = etat.depart
  if (depart === null) return []
  if (!auFond(etat)) {
    etat.depart = null
    return []
  }
  depart.temps += secondes
  while (depart.temps >= SECONDES_PAR_CASE && etat.colonneMineur > 0) {
    depart.temps -= SECONDES_PAR_CASE
    etat.colonneMineur -= 1
  }
  if (etat.colonneMineur > 0) return []
  etat.depart = null
  return voyager(etat, depart.destination, depart.parEchelle, depart.lot)
}

// Arrête le joueur sur le prochain barreau (quand on relâche la flèche).
// S'il est pile sur un barreau, il avance quand même d'un barreau : un appui
// très court fait donc toujours bouger d'un mètre.
export function arreterSurEchelle(etat: EtatJeu): string[] {
  etat.depart = null // s'il marchait encore vers l'échelle, il s'arrête là
  const p = etat.position
  if (etat.cible < p) etat.cible = Math.max(etat.cible, Number.isInteger(p) ? p - 1 : Math.floor(p))
  if (etat.cible > p) etat.cible = Math.min(etat.cible, Number.isInteger(p) ? p + 1 : Math.ceil(p))
  return []
}

// Temps pour parcourir toute l'échelle depuis le front de taille.
export function dureeEchelle(etat: EtatJeu): number {
  return positionFront(etat) * secondesParMetre()
}

// Le temps pour grimper d'un mètre à l'échelle.
export function secondesParMetre(): number {
  return SECONDES_PAR_METRE_ECHELLE
}

// Le temps pour un mètre en ascenseur (plus court avec le talent « Ascenseur express »).
export function secondesParMetreAscenseur(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  return niveau === null ? 0 : niveau.secondesParMetre * multiplicateurAscenseur(etat)
}

// Fait grimper le joueur vers sa cible pendant quelques secondes.
export function avancerSurEchelle(etat: EtatJeu, secondes: number): string[] {
  if (!enMouvement(etat) || etat.ascenseur.passager) return []
  const pas = secondes / secondesParMetre()
  if (Math.abs(etat.cible - etat.position) <= pas) etat.position = etat.cible
  else etat.position += Math.sign(etat.cible - etat.position) * pas

  if (etat.position !== etat.cible) return []
  if (etat.position === 0) return ['☀️ Te voilà au village !']
  if (etat.position === positionFront(etat)) return [`⛏️ Au front de taille, à -${etat.profondeur} m.`]
  return []
}

// ---------------------------------------------------------------------------
// L'ascenseur automatique (construit et amélioré avec du fer et de la redstone)
// ---------------------------------------------------------------------------

// Les caractéristiques du niveau actuel (null s'il n'est pas construit).
export function niveauAscenseur(etat: EtatJeu): NiveauAscenseur | null {
  return NIVEAUX_ASCENSEUR[etat.ascenseur.niveau - 1] ?? null
}

// Le prochain niveau à construire (null s'il est au max).
export function prochainNiveauAscenseur(etat: EtatJeu): NiveauAscenseur | null {
  return NIVEAUX_ASCENSEUR[etat.ascenseur.niveau] ?? null
}

// Le prochain niveau est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function ascenseurBloqueAuPrestige(etat: EtatJeu): number | null {
  const prochain = prochainNiveauAscenseur(etat)
  if (prochain === null || prochain.niveau <= niveauMaxAuPrestige('ascenseur', etat.prestige)) return null
  return prestigePourNiveau('ascenseur', prochain.niveau)
}

export function peutAmeliorerAscenseur(etat: EtatJeu): boolean {
  const prochain = prochainNiveauAscenseur(etat)
  return prochain !== null && ascenseurBloqueAuPrestige(etat) === null && peutPayer(etat, prochain.cout)
}

// Construit l'ascenseur (niveau 1) ou l'améliore. Ça se fait directement dans la mine.
export function ameliorerAscenseur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauAscenseur(etat)
  if (prochain === null || !peutAmeliorerAscenseur(etat) || ascenseurEnMouvement(etat)) return []
  payer(etat, prochain.cout)
  // À la construction, la cabine est installée là où se trouve le joueur.
  if (etat.ascenseur.niveau === 0) {
    etat.ascenseur.position = Math.round(etat.position)
    etat.ascenseur.cible = etat.ascenseur.position
  }
  etat.ascenseur.niveau = prochain.niveau
  if (prochain.niveau === 1) return ['🛗 Ascenseur construit ! Il remonte tes minerais (et toi) jusqu’au village.']
  return [`🛗 Ascenseur amélioré au niveau ${prochain.niveau} : ${prochain.capacite} objets par voyage.`]
}

export function ascenseurEnMouvement(etat: EtatJeu): boolean {
  return etat.ascenseur.position !== etat.ascenseur.cible
}

// La cabine est arrêtée au même endroit que le joueur (lui aussi arrêté) : on peut l'utiliser.
export function ascenseurDisponible(etat: EtatJeu): boolean {
  return (
    etat.ascenseur.niveau > 0 && !ascenseurEnMouvement(etat) && !enMouvement(etat) && etat.ascenseur.position === etat.position
  )
}

// Nombre d'objets qui attendent sur le quai, et la place qu'il y reste.
export function nbSurQuai(etat: EtatJeu): number {
  let total = 0
  for (const nombre of Object.values(etat.ascenseur.quai)) total += nombre ?? 0
  return total
}

export function placeQuai(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  return niveau === null ? 0 : Math.max(0, niveau.capacite - nbSurQuai(etat))
}

// Coche ou décoche un objet du sac (décoché = l'ascenseur le laisse dans le sac).
export function basculerChargement(etat: EtatJeu, bloc: IdBloc): string[] {
  const garder = etat.ascenseur.garder
  etat.ascenseur.garder = garder.includes(bloc) ? garder.filter((b) => b !== bloc) : [...garder, bloc]
  return []
}

// Coche ou décoche l'envoi automatique quand le sac est plein.
export function basculerEnvoiAuto(etat: EtatJeu): string[] {
  etat.ascenseur.envoiAuto = !etat.ascenseur.envoiAuto
  return []
}

// Combien d'objets partiraient au prochain envoi : le quai, puis les objets cochés du sac,
// dans la limite de la place dans la cabine.
// Avec un « lot » (les quantités choisies avec les jauges du sac), on n'envoie que ça ;
// sans lot, tous les objets qui ne sont pas gardés.
export function nbAEnvoyer(etat: EtatJeu, lot?: Inventaire): number {
  const niveau = niveauAscenseur(etat)
  if (niveau === null) return 0
  let total = nbSurQuai(etat)
  for (const [id, nombre] of Object.entries(etat.inventaire)) {
    total += quantiteChoisie(etat, id as IdBloc, nombre ?? 0, lot)
  }
  return Math.min(niveau.capacite, total)
}

// Combien d'objets de cette pile partent : la quantité du lot (sans dépasser la pile),
// ou toute la pile si l'objet n'est pas gardé.
function quantiteChoisie(etat: EtatJeu, bloc: IdBloc, nombre: number, lot?: Inventaire): number {
  if (lot) return Math.max(0, Math.min(nombre, lot[bloc] ?? 0))
  return etat.ascenseur.garder.includes(bloc) ? 0 : nombre
}

// Garder (envoyer = false) ou non un objet dans le sac quand l'ascenseur part.
export function reglerChargement(etat: EtatJeu, bloc: IdBloc, envoyer: boolean): string[] {
  const garder = etat.ascenseur.garder.filter((b) => b !== bloc)
  etat.ascenseur.garder = envoyer ? garder : [...garder, bloc]
  return []
}

// Remplit la cabine : d'abord ce qui attend sur le quai, puis le sac (sauf les objets
// décochés), les plus précieux en premier, dans la limite de sa capacité. Ce qui est déjà dans
// la cabine y reste (quand le réservoir était plein, elle est redescendue avec).
function chargerCabine(etat: EtatJeu, lot?: Inventaire): Inventaire {
  const niveau = niveauAscenseur(etat)
  const chargement: Inventaire = { ...etat.ascenseur.chargement }
  if (niveau === null) return chargement
  let place = niveau.capacite - totalObjets(chargement)
  const parPrix = (a: [string, number | undefined], b: [string, number | undefined]) => BLOCS[b[0] as IdBloc].prix - BLOCS[a[0] as IdBloc].prix

  for (const [id, nombre] of Object.entries(etat.ascenseur.quai).sort(parPrix)) {
    const bloc = id as IdBloc
    const pris = Math.min(nombre ?? 0, place)
    if (pris <= 0) continue
    chargement[bloc] = (chargement[bloc] ?? 0) + pris
    const reste = (nombre ?? 0) - pris
    if (reste > 0) etat.ascenseur.quai[bloc] = reste
    else delete etat.ascenseur.quai[bloc]
    place -= pris
  }

  for (const [id, nombre] of Object.entries(etat.inventaire).sort(parPrix)) {
    const bloc = id as IdBloc
    const pris = Math.min(quantiteChoisie(etat, bloc, nombre ?? 0, lot), place)
    if (pris <= 0) continue
    chargement[bloc] = (chargement[bloc] ?? 0) + pris
    retirer(etat, bloc, pris)
    place -= pris
  }
  return chargement
}

// Envoie la cabine (sans le mineur) vendre au marché. Elle redescend ensuite au front de taille.
export function envoyerAscenseur(etat: EtatJeu, lot?: Inventaire): string[] {
  if (!ascenseurDisponible(etat) || etat.position === 0) return []
  const chargement = chargerCabine(etat, lot)
  if (Object.keys(chargement).length === 0) return []
  etat.ascenseur.chargement = chargement
  etat.ascenseur.cible = 0
  etat.ascenseur.retourAuFront = true
  return [railsVersLeMarche(etat) ? '🛗 L’ascenseur remonte ton chargement : le wagonnet l’emmènera au marché.' : '🛗 L’ascenseur remonte ton chargement au réservoir de la mine.']
}

// Le bouton « Envoyer à la surface » du sac : si la cabine est là, elle part tout de suite ;
// sinon on l'appelle (ou on attend qu'elle ait fini son voyage) et elle repartira chargée.
export function demanderEnvoi(etat: EtatJeu, lot?: Inventaire): string[] {
  if (etat.ascenseur.niveau === 0 || etat.position === 0 || nbAEnvoyer(etat, lot) === 0) return []
  if (ascenseurDisponible(etat)) return envoyerAscenseur(etat, lot)
  etat.ascenseur.envoiDemande = true
  etat.ascenseur.lotDemande = lot ?? null
  if (!ascenseurEnMouvement(etat)) appelerAscenseur(etat)
  return ['🛗 L’ascenseur arrive pour prendre ton chargement.']
}

// Fait venir la cabine là où se trouve le joueur.
export function appelerAscenseur(etat: EtatJeu): string[] {
  if (etat.ascenseur.niveau === 0 || ascenseurEnMouvement(etat) || enMouvement(etat)) return []
  if (etat.ascenseur.position === etat.position) return []
  etat.ascenseur.cible = etat.position
  etat.ascenseur.retourAuFront = false
  return ['🛗 L’ascenseur arrive.']
}

// Le mineur monte dans la cabine, vers le village (0) ou vers le front de taille.
// En montant, la cabine emporte le « lot » choisi (ou tout ce qui n'est pas gardé) : en haut, il
// va dans le réservoir (ou au marché par le wagonnet, s'il y a des rails). Avec un lot vide ({}), elle ne monte que le mineur : son sac reste plein
// et rien n'est vendu (c'est le bouton « Remonter » du sac).
export function prendreAscenseur(etat: EtatJeu, destination: number, lot?: Inventaire): string[] {
  if (!ascenseurDisponible(etat)) return []
  const arrivee = Math.min(positionFront(etat), Math.max(0, destination))
  if (arrivee === etat.position) return []
  const ascenseur = etat.ascenseur
  const justeLeMineur = lot !== undefined && Object.keys(lot).length === 0
  if (arrivee < etat.position && !justeLeMineur) ascenseur.chargement = chargerCabine(etat, lot)
  ascenseur.passager = true
  ascenseur.retourAuFront = false
  ascenseur.cible = arrivee
  return [arrivee === 0 ? '🛗 En route vers le village !' : '🛗 En route vers le front de taille !']
}

// Temps pour que la cabine parcoure tout le puits (du front de taille au village).
export function dureeAscenseur(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  return niveau === null ? 0 : positionFront(etat) * secondesParMetreAscenseur(etat)
}

// Dans combien de secondes la cabine aura fini son voyage (retour au front compris,
// quand elle revient toute seule après avoir vendu). 0 si elle est arrêtée.
export function secondesAvantArretAscenseur(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  const ascenseur = etat.ascenseur
  if (niveau === null || !ascenseurEnMouvement(etat)) return 0
  const metres = ascenseur.retourAuFront
    ? ascenseur.position + positionFront(etat) // elle monte au village, puis redescend au front
    : Math.abs(ascenseur.cible - ascenseur.position)
  return metres * secondesParMetreAscenseur(etat)
}

// Fait avancer la cabine (et le mineur s'il est dedans).
export function avancerAscenseur(etat: EtatJeu, secondes: number): string[] {
  const ascenseur = etat.ascenseur
  const niveau = niveauAscenseur(etat)
  if (niveau === null || !ascenseurEnMouvement(etat)) return []

  const pas = secondes / secondesParMetreAscenseur(etat)
  if (Math.abs(ascenseur.cible - ascenseur.position) <= pas) ascenseur.position = ascenseur.cible
  else ascenseur.position += Math.sign(ascenseur.cible - ascenseur.position) * pas

  // Le passager bouge avec la cabine.
  if (ascenseur.passager) {
    etat.position = ascenseur.position
    etat.cible = ascenseur.position
  }
  if (ascenseurEnMouvement(etat)) return []

  // La cabine est arrivée. En haut, son chargement va dans le réservoir de la mine (le joueur
  // viendra le chercher pour le vendre), ou part au marché en wagonnet s'il y a des rails.
  const messages: string[] = []
  if (ascenseur.position === 0) messages.push(...viderCabine(etat))
  if (ascenseur.passager) {
    ascenseur.passager = false
    messages.push(etat.position === 0 ? '☀️ Te voilà au village !' : `⛏️ Au front de taille, à -${etat.profondeur} m.`)
  }
  if (ascenseur.retourAuFront && ascenseur.position === 0) {
    ascenseur.retourAuFront = false
    ascenseur.cible = positionFront(etat)
    return messages
  }

  // Un envoi a été demandé : la cabine repart chargée si le mineur est là,
  // sinon elle va le chercher (et on oublie la demande s'il est remonté au village).
  if (ascenseur.envoiDemande) {
    if (etat.position === 0) {
      ascenseur.envoiDemande = false
      ascenseur.lotDemande = null
    } else if (ascenseurDisponible(etat)) {
      const lot = ascenseur.lotDemande ?? undefined
      ascenseur.envoiDemande = false
      ascenseur.lotDemande = null
      messages.push(...envoyerAscenseur(etat, lot))
    } else if (!enMouvement(etat)) {
      ascenseur.cible = etat.position
    }
  }
  return messages
}

// ---------------------------------------------------------------------------
// Réparation
// ---------------------------------------------------------------------------

// Le prix d'une réparation, au même format que les autres achats : de l'argent (selon
// l'usure) + 3 minerais de la pioche. null si la pioche n'est pas usée.
export function coutReparation(etat: EtatJeu, niveau = etat.niveauPioche): Cout | null {
  const pioche = PIOCHES[niveau]
  const usure = etat.pioches[niveau] ?? 0
  if (!pioche || usure <= 0) return null
  const argent = Math.max(1, Math.ceil(pioche.prix * PART_PRIX_REPARATION * Math.min(1, usure / pioche.durabilite)))
  const materiaux: Partial<Record<IdBloc, number>> = pioche.reparation ? { [pioche.reparation]: MINERAIS_REPARATION } : {}
  return { argent, materiaux }
}

export function peutReparer(etat: EtatJeu, niveau = etat.niveauPioche): boolean {
  if (!(niveau in etat.pioches)) return false
  const cout = coutReparation(etat, niveau)
  return cout !== null && peutPayer(etat, cout)
}

export function reparer(etat: EtatJeu, niveau = etat.niveauPioche): string[] {
  const cout = coutReparation(etat, niveau)
  if (!aLaSurface(etat) || cout === null || !peutReparer(etat, niveau)) return []
  payer(etat, cout)
  etat.pioches[niveau] = 0
  const pioche = PIOCHES[niveau]
  const minerai = pioche.reparation ? ` et ${MINERAIS_REPARATION} ${BLOCS[pioche.reparation].nom}` : ''
  return [`🔧 Pioche en ${pioche.nom} réparée (${cout.argent} $${minerai}).`]
}

// ---------------------------------------------------------------------------
// Pioches
// ---------------------------------------------------------------------------

// On peut acheter (ou racheter neuve) toute pioche déjà débloquée, et débloquer la suivante.
// Le prix d'une pioche, pour la débloquer comme pour la racheter neuve : de l'argent et ses minerais.
export function coutPioche(niveau: number): Cout {
  const pioche = PIOCHES[niveau]
  return { argent: pioche.prix, materiaux: pioche.materiaux }
}

export function peutAcheterPioche(etat: EtatJeu, niveau: number): boolean {
  const pioche = PIOCHES[niveau]
  if (!pioche || niveau > etat.meilleure + 1) return false
  return peutPayer(etat, coutPioche(niveau))
}

export function acheterPioche(etat: EtatJeu, niveau: number): string[] {
  if (!aLaSurface(etat) || !peutAcheterPioche(etat, niveau)) return []
  const pioche = PIOCHES[niveau]
  const nouvelle = niveau > etat.meilleure
  payer(etat, coutPioche(niveau))
  etat.pioches[niveau] = 0
  etat.niveauPioche = niveau
  etat.meilleure = Math.max(etat.meilleure, niveau)
  return [nouvelle ? `⛏️ Nouvelle pioche en ${pioche.nom} débloquée !` : `⛏️ Pioche en ${pioche.nom} neuve achetée.`]
}

export function equiper(etat: EtatJeu, niveau: number): string[] {
  if (!(niveau in etat.pioches) || niveau === etat.niveauPioche) return []
  etat.niveauPioche = niveau
  return [`Tu as équipé la pioche en ${PIOCHES[niveau].nom}.`]
}

// ---------------------------------------------------------------------------
// Boutique
// ---------------------------------------------------------------------------

export function prixProchainSac(etat: EtatJeu): number | null {
  const prochain = SACS[etat.niveauSac + 1]
  return prochain ? prochain.prix : null
}

// Le prochain sac est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function sacBloqueAuPrestige(etat: EtatJeu): number | null {
  const prochain = etat.niveauSac + 1
  if (prixProchainSac(etat) === null || prochain <= niveauMaxAuPrestige('sac', etat.prestige)) return null
  return prestigePourNiveau('sac', prochain)
}

export function acheterSac(etat: EtatJeu): string[] {
  const prix = prixProchainSac(etat)
  if (!aLaSurface(etat) || prix === null || sacBloqueAuPrestige(etat) !== null || etat.argent < prix) return []
  etat.argent -= prix
  etat.niveauSac += 1
  return [`🎒 Nouveau sac : ${tailleSac(etat)} places !`]
}

export function acheterSeau(etat: EtatJeu): string[] {
  if (!aLaSurface(etat) || etat.argent < PRIX_SEAU) return []
  etat.argent -= PRIX_SEAU
  etat.seaux += 1
  return ["🪣 Seau d'eau acheté."]
}

// ---------------------------------------------------------------------------
// Enchantements
// ---------------------------------------------------------------------------

// Coût du prochain niveau d'un enchantement (null s'il est déjà au max).
export function coutEnchantement(etat: EtatJeu, id: IdEnchantement): Cout | null {
  const e = ENCHANTEMENTS[id]
  const prochain = etat.enchantements[id] + 1
  if (prochain > e.niveauMax) return null
  return {
    argent: e.argentParNiveau * prochain * prochain,
    materiaux: { lapis: e.lapisParNiveau * prochain, emeraude: e.emeraudesParNiveau * prochain },
  }
}

// Le prochain niveau est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function enchantementBloqueAuPrestige(etat: EtatJeu, id: IdEnchantement): number | null {
  const prochain = etat.enchantements[id] + 1
  if (coutEnchantement(etat, id) === null || prochain <= niveauMaxAuPrestige(id, etat.prestige)) return null
  return prestigePourNiveau(id, prochain)
}

export function peutEnchanter(etat: EtatJeu, id: IdEnchantement): boolean {
  const cout = coutEnchantement(etat, id)
  return cout !== null && enchantementBloqueAuPrestige(etat, id) === null && peutPayer(etat, cout)
}

// Reste-t-il un enchantement à prendre à ce prestige ?
export function peutEncoreEnchanter(etat: EtatJeu): boolean {
  return LISTE_ENCHANTEMENTS.some((id) => coutEnchantement(etat, id) !== null && enchantementBloqueAuPrestige(etat, id) === null)
}

export function enchanter(etat: EtatJeu, id: IdEnchantement): string[] {
  const cout = coutEnchantement(etat, id)
  if (!aLaSurface(etat) || cout === null || !peutEnchanter(etat, id)) return []
  payer(etat, cout)
  etat.enchantements[id] += 1
  return [`✨ ${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])} !`]
}

export function chiffreRomain(n: number): string {
  return ['0', 'I', 'II', 'III', 'IV', 'V'][n] ?? String(n)
}

// ---------------------------------------------------------------------------
// Le réservoir en haut de la mine (22/10)
// ---------------------------------------------------------------------------

// Le nombre total d'objets d'un inventaire.
export function totalObjets(inventaire: Inventaire): number {
  return Object.values(inventaire).reduce((total, n) => total + (n ?? 0), 0)
}

export function capaciteReservoir(etat: EtatJeu): number {
  return NIVEAUX_RESERVOIR[Math.min(etat.reservoir.niveau, NIVEAUX_RESERVOIR.length - 1)].capacite
}

export function nbDansReservoir(etat: EtatJeu): number {
  return totalObjets(etat.reservoir.contenu)
}

export function reservoirPlein(etat: EtatJeu): boolean {
  return nbDansReservoir(etat) >= capaciteReservoir(etat)
}

// La cabine arrêtée en haut vide son chargement : par les rails jusqu'au marché s'il y en a,
// sinon dans le réservoir, tant qu'il reste de la place (les objets les plus chers d'abord).
// Ce qui ne rentre pas reste dans la cabine : il remontera au prochain voyage.
export function viderCabine(etat: EtatJeu): string[] {
  const ascenseur = etat.ascenseur
  if (ascenseur.position !== 0 || ascenseurEnMouvement(etat) || totalObjets(ascenseur.chargement) === 0) return []
  if (railsVersLeMarche(etat)) {
    envoyerAuMarche(etat, ascenseur.chargement, null)
    ascenseur.chargement = {}
    return ['🛤️ Chargement remonté : le wagonnet l’emmène au marché.']
  }
  let place = capaciteReservoir(etat) - nbDansReservoir(etat)
  let range = 0
  const parPrix = Object.entries(ascenseur.chargement).sort(([a], [b]) => BLOCS[b as IdBloc].prix - BLOCS[a as IdBloc].prix)
  for (const [id, nombre] of parPrix) {
    const bloc = id as IdBloc
    const pris = Math.min(nombre ?? 0, place)
    if (pris <= 0) continue
    etat.reservoir.contenu[bloc] = (etat.reservoir.contenu[bloc] ?? 0) + pris
    const reste = (nombre ?? 0) - pris
    if (reste > 0) ascenseur.chargement[bloc] = reste
    else delete ascenseur.chargement[bloc]
    place -= pris
    range += pris
  }
  if (totalObjets(ascenseur.chargement) > 0) return ['📦 Le réservoir de la mine est plein ! Viens le vider et va vendre au marché.']
  return range > 0 ? [`📦 ${range} objet${range > 1 ? 's' : ''} rangé${range > 1 ? 's' : ''} dans le réservoir de la mine.`] : []
}

// Prendre ce qui est dans le réservoir pour le mettre dans son sac (à la mine, au village) :
// le lot choisi, ou tout, les objets les plus chers d'abord, tant qu'il y a de la place.
export function prendreDuReservoir(etat: EtatJeu, lot?: Inventaire): string[] {
  if (!aLaSurface(etat)) return []
  let place = placeLibre(etat)
  if (place <= 0) return ['🎒 Ton sac est plein : va d’abord vendre au marché.']
  let pris = 0
  const parPrix = Object.entries(etat.reservoir.contenu).sort(([a], [b]) => BLOCS[b as IdBloc].prix - BLOCS[a as IdBloc].prix)
  for (const [id, nombre] of parPrix) {
    const bloc = id as IdBloc
    const voulu = lot ? Math.min(nombre ?? 0, Math.floor(lot[bloc] ?? 0)) : (nombre ?? 0)
    const n = Math.min(voulu, place)
    if (n <= 0) continue
    etat.inventaire[bloc] = (etat.inventaire[bloc] ?? 0) + n
    const reste = (nombre ?? 0) - n
    if (reste > 0) etat.reservoir.contenu[bloc] = reste
    else delete etat.reservoir.contenu[bloc]
    place -= n
    pris += n
  }
  if (pris === 0) return []
  // De la place s'est libérée : la cabine qui attend en haut, encore chargée, se vide.
  const messages = [`🎒 ${pris} objet${pris > 1 ? 's' : ''} pris dans le réservoir : va les vendre au marché !`]
  messages.push(...viderCabine(etat))
  return messages
}

// Avec des rails jusqu'au marché, tout le réservoir part en wagonnet.
export function envoyerReservoir(etat: EtatJeu): string[] {
  if (!aLaSurface(etat) || !railsVersLeMarche(etat) || nbDansReservoir(etat) === 0) return []
  envoyerAuMarche(etat, etat.reservoir.contenu, null)
  etat.reservoir.contenu = {}
  return ['🛤️ Le wagonnet part au marché avec tout le réservoir.']
}

// Des rails relient-ils la mine au marché ? (Alors le wagonnet emporte ce qui remonte.)
function railsVersLeMarche(etat: EtatJeu): boolean {
  return railsMineMarche(etat.village) !== null
}
