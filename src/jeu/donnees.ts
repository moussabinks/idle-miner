// Données du jeu : pioches, blocs, sacs, enchantements, zones et constantes.
// Les valeurs viennent de docs/idle_miner_v1.md (version notebook Python),
// avec une mine plus profonde (bedrock à -150 m depuis le 19/10, au lieu de -64 m dans la v1).

// ---------------------------------------------------------------------------
// Blocs
// ---------------------------------------------------------------------------

// Identifiants de tous les blocs du jeu (et des objets qu'on peut avoir dans le sac).
export type IdBloc =
  | 'terre'
  | 'gravier'
  | 'pierre'
  | 'deepslate'
  | 'charbon'
  | 'fer'
  | 'redstone'
  | 'lapis'
  | 'or'
  | 'emeraude'
  | 'diamant'
  | 'debris'
  | 'amethyste'
  | 'obsidienne'
  | 'lave'
  | 'coffre'
  | 'geode'

export type TypeBloc = {
  id: IdBloc
  nom: string
  emoji: string
  prix: number // prix de vente en $ (0 = ne se vend pas)
  durete: number // temps de base pour le casser
  minerai: boolean // true = profite de l'enchantement Fortune
  special: boolean // true = ne va pas dans le sac (lave, coffre, géode)
}

export const BLOCS: Record<IdBloc, TypeBloc> = {
  terre: { id: 'terre', nom: 'Terre', emoji: '🟫', prix: 1, durete: 0.5, minerai: false, special: false },
  gravier: { id: 'gravier', nom: 'Gravier', emoji: '🪨', prix: 1, durete: 0.6, minerai: false, special: false },
  pierre: { id: 'pierre', nom: 'Pierre', emoji: '🪨', prix: 1, durete: 1.5, minerai: false, special: false },
  // La « roche dure » des profondeurs (son identifiant reste « deepslate », pour les sauvegardes).
  deepslate: { id: 'deepslate', nom: 'Roche dure', emoji: '⬛', prix: 2, durete: 3, minerai: false, special: false },
  charbon: { id: 'charbon', nom: 'Charbon', emoji: '⚫', prix: 5, durete: 3, minerai: true, special: false },
  fer: { id: 'fer', nom: 'Fer', emoji: '🔩', prix: 12, durete: 3, minerai: true, special: false },
  redstone: { id: 'redstone', nom: 'Redstone', emoji: '🔴', prix: 15, durete: 3, minerai: true, special: false },
  lapis: { id: 'lapis', nom: 'Lapis-lazuli', emoji: '🔷', prix: 20, durete: 3, minerai: true, special: false },
  or: { id: 'or', nom: 'Or', emoji: '🟡', prix: 35, durete: 3, minerai: true, special: false },
  emeraude: { id: 'emeraude', nom: 'Émeraude', emoji: '💚', prix: 80, durete: 3, minerai: true, special: false },
  diamant: { id: 'diamant', nom: 'Diamant', emoji: '💎', prix: 100, durete: 3, minerai: true, special: false },
  // Les débris antiques ne profitent pas de Fortune (comme dans Minecraft).
  debris: { id: 'debris', nom: 'Débris antiques', emoji: '🟤', prix: 400, durete: 30, minerai: false, special: false },
  amethyste: { id: 'amethyste', nom: 'Améthyste', emoji: '🔮', prix: 50, durete: 1.5, minerai: false, special: false },
  obsidienne: { id: 'obsidienne', nom: 'Obsidienne', emoji: '🟪', prix: 60, durete: 3, minerai: false, special: false },
  // Blocs spéciaux : ils déclenchent un effet au lieu d'aller dans le sac.
  lave: { id: 'lave', nom: 'Lave', emoji: '🔥', prix: 0, durete: 1, minerai: false, special: true },
  coffre: { id: 'coffre', nom: 'Coffre', emoji: '🧰', prix: 0, durete: 2.5, minerai: false, special: true },
  geode: { id: 'geode', nom: 'Géode', emoji: '🔮', prix: 0, durete: 1.5, minerai: false, special: true },
}

// Les minerais qu'un coffre peut contenir (un au hasard).
export const MINERAIS_COFFRE: IdBloc[] = ['charbon', 'fer', 'redstone', 'lapis', 'or', 'emeraude', 'diamant']

// Poids de la roche de base dans le tirage d'un bloc.
export const POIDS_ROCHE = 100

// ---------------------------------------------------------------------------
// Pioches
// ---------------------------------------------------------------------------

export type Pioche = {
  niveau: number
  nom: string
  emoji: string
  vitesse: number
  profMax: number // profondeur max en mètres (valeur positive)
  durabilite: number
  prix: number
  // Matériaux à fournir en plus de l'argent pour l'acheter.
  materiaux: Partial<Record<IdBloc, number>>
  // Le minerai qu'il faut pour la réparer (null : la pioche en bois, réparée avec de l'argent seulement).
  reparation: IdBloc | null
  couleur: string // couleur du fer de la pioche, pour dessiner le personnage
}

export const PIOCHES: Pioche[] = [
  { niveau: 0, nom: 'Bois', emoji: '🪵', vitesse: 2, profMax: 35, durabilite: 60, prix: 5, materiaux: {}, reparation: null, couleur: '#b5834a' },
  { niveau: 1, nom: 'Pierre', emoji: '🪨', vitesse: 4, profMax: 70, durabilite: 160, prix: 40, materiaux: {}, reparation: 'pierre', couleur: '#8f8f8f' },
  { niveau: 2, nom: 'Fer', emoji: '⚙️', vitesse: 6, profMax: 112, durabilite: 250, prix: 300, materiaux: {}, reparation: 'fer', couleur: '#e6e6e6' },
  { niveau: 3, nom: 'Diamant', emoji: '💎', vitesse: 8, profMax: 136, durabilite: 500, prix: 2000, materiaux: { diamant: 3 }, reparation: 'diamant', couleur: '#4ee8dc' },
  {
    niveau: 4,
    nom: 'Netherite',
    emoji: '🔥',
    vitesse: 9,
    profMax: 150,
    durabilite: 800,
    prix: 3000,
    materiaux: { debris: 4, or: 4 },
    reparation: 'debris',
    couleur: '#6b5568',
  },
]

// La réparation d'une pioche (règle du 19/10, la même pour toutes) : de l'argent + 3 minerais
// de la pioche (3 fer pour la pioche en fer, 3 diamants pour la pioche en diamant...).
// L'argent dépend de l'usure : une pioche cassée coûte la moitié de son prix neuve.
// La pioche en bois n'a pas de minerai (il n'y a pas de bois dans la mine) : argent seulement.
export const MINERAIS_REPARATION = 3
export const PART_PRIX_REPARATION = 0.5

// Vitesse à mains nues (pioche cassée).
export const VITESSE_MAINS_NUES = 1

// ---------------------------------------------------------------------------
// Mine, sac et boutique
// ---------------------------------------------------------------------------

export const LARGEUR_MINE = 10 // blocs par couche
// La mine est plus profonde à chaque prestige (décidé le 19/10) : la bedrock est à -100 m au
// prestige 0, puis 50 m plus bas à chaque prestige (-150 m, -200 m, -250 m...).
export const PROFONDEUR_BEDROCK_DEPART = 100
export const PROFONDEUR_EN_PLUS_PAR_PRESTIGE = 50

export function profondeurBedrock(prestige: number): number {
  return PROFONDEUR_BEDROCK_DEPART + PROFONDEUR_EN_PLUS_PAR_PRESTIGE * prestige
}

// Toutes les profondeurs écrites dans les données (minerais, zones, roche dure, blocs
// spéciaux, profondeur max des pioches) sont données pour une mine de 150 m de référence.
// On les met à l'échelle de la mine du prestige en cours : × 100/150 au prestige 0, × 1 au
// prestige 1, × 200/150 au prestige 2... Ainsi, à chaque prestige, le charbon et le fer
// sont près de la surface, puis les autres minerais arrivent petit à petit jusqu'en bas.
export const PROFONDEUR_REFERENCE = 150

export function echelleMine(prestige: number): number {
  return profondeurBedrock(prestige) / PROFONDEUR_REFERENCE
}

// Une vraie profondeur (dans la mine du prestige) → la profondeur de référence (mine de 150 m).
export function versReference(profondeur: number, prestige: number): number {
  return profondeur / echelleMine(prestige)
}

// Une profondeur de référence → la vraie profondeur dans la mine du prestige (en mètres entiers).
export function depuisReference(metres: number, prestige: number): number {
  return Math.round(metres * echelleMine(prestige))
}

// Sous cette profondeur (de référence), la roche devient de la roche dure et tout est plus long à casser.
export const PROFONDEUR_DEEPSLATE = 94

export function estRocheDure(profondeur: number, prestige: number): boolean {
  return versReference(profondeur, prestige) > PROFONDEUR_DEEPSLATE
}

// Jusqu'où descend une pioche dans la mine de ce prestige (la netherite va jusqu'à la bedrock).
export function profondeurMaxPioche(niveau: number, prestige: number): number {
  return depuisReference(PIOCHES[niveau].profMax, prestige)
}

// Les sacs : la taille et le prix de chaque niveau (le premier est gratuit).
export const SACS = [
  { taille: 32, prix: 0 },
  { taille: 64, prix: 80 },
  { taille: 128, prix: 400 },
  { taille: 256, prix: 1500 },
  // Les grands sacs (19/10) : pour les longues sessions et après les prestiges.
  { taille: 512, prix: 5000 },
  { taille: 1024, prix: 15000 },
  { taille: 2048, prix: 40000 },
]

export const PRIX_SEAU = 25

// On voit toujours les 4 couches sous la couche en cours (lumière naturelle, sans torches).
export const COUCHES_VISIBLES_DESSOUS = 4

// ---------------------------------------------------------------------------
// Surface, échelle et ascenseur
// ---------------------------------------------------------------------------

// Temps pour monter (ou descendre) un mètre à l'échelle, en secondes.
export const SECONDES_PAR_METRE_ECHELLE = 0.15

// Temps pour marcher d'une case au front de taille (jusqu'à l'échelle, par exemple).
export const SECONDES_PAR_CASE = 0.12

// Le prix d'une amélioration : surtout de l'argent, et un peu de minerais.
// (Choix du 19/10 : l'économie repose sur l'argent, les minerais servent d'appoint.)
export type Cout = { argent?: number; materiaux: Partial<Record<IdBloc, number>> }

// L'ascenseur automatique : il se construit puis s'améliore directement dans la mine.
// Le premier niveau ne demande pas de redstone (on n'en trouve que sous -40 m) :
// on peut le construire tôt. Chaque niveau remonte plus d'objets par voyage, et plus vite.
export type NiveauAscenseur = {
  niveau: number
  cout: Cout
  capacite: number // objets remontés par voyage
  secondesParMetre: number // temps pour parcourir un mètre
}

// Choix du 19/10 : peu d'argent mais beaucoup de fer et de redstone (avant, les derniers
// niveaux coûtaient jusqu'à 80 000 $ : trop cher, même au prestige 3).
export const NIVEAUX_ASCENSEUR: NiveauAscenseur[] = [
  { niveau: 1, cout: { argent: 250, materiaux: { fer: 8 } }, capacite: 32, secondesParMetre: 0.1 },
  { niveau: 2, cout: { argent: 1200, materiaux: { fer: 15, redstone: 5 } }, capacite: 64, secondesParMetre: 0.07 },
  { niveau: 3, cout: { argent: 2000, materiaux: { fer: 30, redstone: 15 } }, capacite: 128, secondesParMetre: 0.05 },
  { niveau: 4, cout: { argent: 4500, materiaux: { fer: 50, redstone: 30 } }, capacite: 256, secondesParMetre: 0.03 },
  { niveau: 5, cout: { argent: 9000, materiaux: { fer: 80, redstone: 50 } }, capacite: 512, secondesParMetre: 0.02 },
  { niveau: 6, cout: { argent: 18000, materiaux: { fer: 120, redstone: 80 } }, capacite: 1024, secondesParMetre: 0.015 },
]

// ---------------------------------------------------------------------------
// Les plafonds d'amélioration selon le prestige (décidé le 19/10)
// ---------------------------------------------------------------------------

// On ne peut pas tout améliorer en un seul prestige (sinon : prestige 1, on farme, et
// tout est au maximum). Règle commune : au déblocage, on peut monter jusqu'à un certain
// niveau, puis chaque prestige permet un niveau de plus.
//   - ascenseur : niveau 2 au prestige 0, 3 au prestige 1... jusqu'à 6 ;
//   - forage et chariot de la foreuse (débloquée au prestige 1) : 2e niveau au prestige 1,
//     3e au prestige 2... jusqu'au 8e au prestige 7 (les niveaux de la foreuse sont comptés à
//     partir de 0 dans le code) ;
//   - pioche des mineurs (débloqués au prestige 2) : Pierre au prestige 2, Fer au prestige 3...
//   - recruteur (prestige 4) : niveau 1 à l'embauche, puis un niveau de plus par prestige ;
//   - enchantements (gardés au prestige depuis le 19/10) : Efficacité I au prestige 0, puis un
//     niveau de plus par prestige (V au prestige 4) ; Fortune et Solidité, plus rares, un niveau
//     tous les 2 prestiges (I au prestige 0, II au prestige 2, III au prestige 4).
export type IdPlafond = 'ascenseur' | 'sac' | 'forage' | 'chariot' | 'mineur' | 'recruteur' | IdEnchantement

type Plafond = {
  prestigeDeblocage: number
  niveauAuDeblocage: number
  niveauMax: number
  prestigesParNiveau?: number // combien de prestiges pour un niveau de plus (1 par défaut)
}

export const PLAFONDS: Record<IdPlafond, Plafond> = {
  ascenseur: { prestigeDeblocage: 0, niveauAuDeblocage: 2, niveauMax: 6 },
  // Le sac à dos (20/10) : jusqu'à 256 places au prestige 0, puis un sac de plus par prestige
  // (2 048 places au prestige 3). Les niveaux sont comptés à partir de 0 (le sac de 32 places).
  sac: { prestigeDeblocage: 0, niveauAuDeblocage: 3, niveauMax: 6 },
  forage: { prestigeDeblocage: 1, niveauAuDeblocage: 1, niveauMax: 7 },
  chariot: { prestigeDeblocage: 1, niveauAuDeblocage: 1, niveauMax: 7 },
  mineur: { prestigeDeblocage: 2, niveauAuDeblocage: 1, niveauMax: 4 },
  recruteur: { prestigeDeblocage: 4, niveauAuDeblocage: 1, niveauMax: 4 },
  efficacite: { prestigeDeblocage: 0, niveauAuDeblocage: 1, niveauMax: 5 },
  fortune: { prestigeDeblocage: 0, niveauAuDeblocage: 1, niveauMax: 3, prestigesParNiveau: 2 },
  solidite: { prestigeDeblocage: 0, niveauAuDeblocage: 1, niveauMax: 3, prestigesParNiveau: 2 },
}

// Le plus haut niveau qu'on peut atteindre à ce prestige.
export function niveauMaxAuPrestige(id: IdPlafond, prestige: number): number {
  const plafond = PLAFONDS[id]
  const prestigesEnPlus = Math.max(0, prestige - plafond.prestigeDeblocage)
  const niveauxEnPlus = Math.floor(prestigesEnPlus / (plafond.prestigesParNiveau ?? 1))
  return Math.min(plafond.niveauMax, plafond.niveauAuDeblocage + niveauxEnPlus)
}

// Le prestige qu'il faut pour atteindre ce niveau (pour afficher « 🔒 Prestige 3 »).
export function prestigePourNiveau(id: IdPlafond, niveau: number): number {
  const plafond = PLAFONDS[id]
  return plafond.prestigeDeblocage + Math.max(0, niveau - plafond.niveauAuDeblocage) * (plafond.prestigesParNiveau ?? 1)
}

// ---------------------------------------------------------------------------
// La foreuse (débloquée au prestige 1)
// ---------------------------------------------------------------------------

// On l'active une seule fois (elle reste active après les prestiges suivants).
export const COUT_ACTIVATION_FOREUSE: Cout = { argent: 5000, materiaux: { fer: 10, redstone: 5 } }
export const PRESTIGE_FOREUSE = 1

// Un charbon fait tourner la foreuse pendant 20 secondes.
export const SECONDES_PAR_CHARBON = 20

// À partir de ce niveau de forage (le 3e), la foreuse peut se recharger toute seule
// avec le charbon qu'elle remonte (option à cocher).
export const NIVEAU_RECHARGE_AUTO = 2
// Elle ne garde pour elle que de quoi tourner une minute : le reste du charbon va au chariot.
export const RESERVE_RECHARGE_AUTO = 60

// Vitesse de forage (blocs par seconde) et coût de chaque niveau.
// La foreuse est gardée d'un prestige à l'autre : c'est là qu'on investit son argent.
// Il n'y a qu'une seule foreuse (décidé le 20/10) : à la place des foreuses en plus, elle a
// 8 niveaux (un de plus à chaque prestige, comme la mine qui descend de 50 m à chaque fois).
export const NIVEAUX_FORAGE: { vitesse: number; cout: Cout }[] = [
  // Plus rapide dès le départ (19/10) : avant, elle rapportait trop peu, et agrandir le
  // chariot ne servait à rien parce qu'il ne se remplissait presque jamais.
  // Prix revus le 19/10 (comme l'ascenseur) : moins d'argent, plus de fer et de redstone, pour
  // ne pas avoir à rester au fond à farmer avant de passer prestige.
  { vitesse: 2, cout: { materiaux: {} } },
  { vitesse: 3, cout: { argent: 2500, materiaux: { fer: 20, redstone: 5 } } },
  { vitesse: 5, cout: { argent: 6000, materiaux: { fer: 40, redstone: 20 } } },
  { vitesse: 8, cout: { argent: 12000, materiaux: { fer: 60, redstone: 40 } } },
  { vitesse: 12, cout: { argent: 25000, materiaux: { fer: 90, redstone: 70 } } },
  { vitesse: 16, cout: { argent: 40000, materiaux: { fer: 130, redstone: 100 } } },
  { vitesse: 22, cout: { argent: 65000, materiaux: { fer: 180, redstone: 140 } } },
  { vitesse: 30, cout: { argent: 100000, materiaux: { fer: 250, redstone: 200 } } },
]

// Taille du chariot (en objets) et coût de chaque niveau.
// Revu le 20/10 : à niveaux égaux, la foreuse remplit toujours son chariot en environ 8 minutes
// (capacité ≈ vitesse de forage du même niveau × 480 s). Améliorer seulement la foreuse remplit
// le chariot plus vite (elle s'arrête plus tôt) ; améliorer seulement le chariot ne sert à rien
// si la foreuse ne suit pas : on améliore les deux ensemble.
export const NIVEAUX_CHARIOT: { capacite: number; cout: Cout }[] = [
  { capacite: 1000, cout: { materiaux: {} } },
  { capacite: 1500, cout: { argent: 1500, materiaux: { fer: 10 } } },
  { capacite: 2500, cout: { argent: 4000, materiaux: { fer: 25, redstone: 10 } } },
  { capacite: 4000, cout: { argent: 9000, materiaux: { fer: 45, redstone: 25 } } },
  { capacite: 6000, cout: { argent: 18000, materiaux: { fer: 70, redstone: 45 } } },
  { capacite: 8000, cout: { argent: 28000, materiaux: { fer: 100, redstone: 70 } } },
  { capacite: 10500, cout: { argent: 45000, materiaux: { fer: 140, redstone: 100 } } },
  { capacite: 15000, cout: { argent: 70000, materiaux: { fer: 200, redstone: 150 } } },
]

// La foreuse descend d'un mètre tous les 10 blocs forés (une couche entière).
export const BLOCS_FORES_PAR_METRE = 10

// Un mineur employé creuse une galerie plus étroite : il descend d'un mètre tous les 5 blocs
// (et pas 10), pour atteindre plus vite les minerais riches (19/10).
export const BLOCS_PAR_METRE_EMPLOYE = 5

// ---------------------------------------------------------------------------
// Les mineurs employés (débloqués au prestige 2)
// ---------------------------------------------------------------------------

export const PRESTIGE_EMPLOYES = 2
// On peut en employer 2 au prestige 2, puis 1 de plus à chaque prestige, jusqu'à 6.
export const MAX_EMPLOYES = 6
// Le prix d'embauche du 1er, 2e, 3e... mineur (décidé le 20/10 : il dépend du nombre de
// mineurs, plus du prestige). Les mineurs licenciés pendant ce prestige comptent encore : on
// ne peut pas licencier et réembaucher au même prix pour n'avoir que des mythiques.
// Au-delà de la liste, chaque embauche coûte 60 % de plus que la précédente : voir prixEmbauche().
export const PRIX_EMBAUCHE = [5000, 12000, 25000, 50000, 90000, 150000, 250000]
export const HAUSSE_APRES_LISTE = 1.6
// Licencier un mineur coûte des indemnités : 40 % du prix d'une embauche (décidé le 20/10).
export const PART_INDEMNITES = 0.4
// Les temps morts d'un mineur entre deux séances de creusage (en secondes) :
// un trajet (attente de l'ascenseur comprise) dure au moins DUREE_MIN_TRAJET_EMPLOYE,
// et il passe SECONDES_VENTE_EMPLOYE au marché pour vendre sa récolte.
export const DUREE_MIN_TRAJET_EMPLOYE = 5
export const SECONDES_VENTE_EMPLOYE = 4
// Les prénoms des mineurs (choisis le 20/10), tirés au hasard à l'embauche.
export const NOMS_EMPLOYES = [
  'Raphaël', 'Moussa', 'Tom', 'Noah', 'Samy', 'Valou', 'Marion', 'Enya', 'Kaïnae',
  'Teo', 'Fredo', 'Satine', 'Nils', 'Arthur', 'Sasha', 'Florian', 'Khalil', 'Margot',
]

// --- Les salaires (décidé le 20/10) ---
// Les mineurs ne prennent plus de commission sur leurs ventes : on leur paie un salaire
// toutes les 10 minutes. Sans salaire, ils remontent attendre au stand Personnel.
// Sans manager, on ne paie que 10 minutes à la fois (décidé le 20/10 : sinon le manager ne
// servirait à rien) ; le manager, lui, paie au fur et à mesure.
export const SECONDES_PAR_PAIE = 10 * 60
// Le salaire de 10 minutes selon l'équipement (pioche en bois, pierre, fer, diamant, netherite),
// au prestige 0 : environ 18 % de ce que le mineur rapporte au fond de sa galerie. Il reste
// gagnant même juste après un prestige, quand il recommence à creuser depuis la surface
// (vérifié par simulation jusqu'au prestige 8). Le salaire monte ensuite de 15 % par prestige,
// comme le prix des ventes (voir salaireEmploye).
export const SALAIRES = [200, 600, 1300, 2300, 3000]

// --- La rareté des mineurs (avec le recruteur, prestige 4) ---
export type IdRarete = 'commun' | 'rare' | 'epique' | 'legendaire' | 'mythique'

export type Rarete = {
  id: IdRarete
  nom: string
  rendement: number // il creuse ce nombre de fois plus vite (et son sac est d'autant plus grand)
  salaire: number // son salaire est multiplié par ce nombre
  couleur: string // pour les étiquettes, l'animation d'embauche...
}

// Un mineur rare rapporte beaucoup plus qu'il ne coûte en plus : c'est tout l'intérêt de la rareté.
export const RARETES: Record<IdRarete, Rarete> = {
  commun: { id: 'commun', nom: 'Commun', rendement: 1, salaire: 1, couleur: '#b9b4ab' },
  rare: { id: 'rare', nom: 'Rare', rendement: 1.5, salaire: 1.25, couleur: '#4f9df0' },
  epique: { id: 'epique', nom: 'Épique', rendement: 2, salaire: 1.5, couleur: '#b06cf0' },
  legendaire: { id: 'legendaire', nom: 'Légendaire', rendement: 3, salaire: 2, couleur: '#f5a524' },
  mythique: { id: 'mythique', nom: 'Mythique', rendement: 5, salaire: 3, couleur: '#ff4d8d' },
}

export const LISTE_RARETES: IdRarete[] = ['commun', 'rare', 'epique', 'legendaire', 'mythique']

// --- Le recruteur (prestige 4) ---
// Il trouve des mineurs plus ou moins rares. Plus il a de niveaux, plus il en trouve de rares.
// Il se paie seulement en argent (le fer et la redstone servent aux machines).
export const PRESTIGE_RECRUTEUR = 4
export const NIVEAUX_RECRUTEUR: { cout: Cout; chances: Record<IdRarete, number> }[] = [
  { cout: { argent: 40000, materiaux: {} }, chances: { commun: 65, rare: 20, epique: 10, legendaire: 4, mythique: 1 } },
  { cout: { argent: 80000, materiaux: {} }, chances: { commun: 60, rare: 22, epique: 11, legendaire: 5.5, mythique: 1.5 } },
  { cout: { argent: 150000, materiaux: {} }, chances: { commun: 55, rare: 23.5, epique: 12.5, legendaire: 7, mythique: 2 } },
  { cout: { argent: 250000, materiaux: {} }, chances: { commun: 50, rare: 25, epique: 14, legendaire: 8.5, mythique: 2.5 } },
]

// --- Le manager (prestige 5) ---
// Il paie les salaires tout seul avec l'argent de la trésorerie (une cagnotte qu'on remplit),
// et il se paie lui-même au passage.
export const PRESTIGE_MANAGER = 5
export const PRIX_MANAGER = 50000
export const SALAIRE_MANAGER = 3000 // toutes les 10 minutes
// Il paie un salaire dès qu'il reste moins d'une minute de payée.
export const SECONDES_AVANT_PAIE_MANAGER = 60

// L'équipement d'un mineur : il s'en occupe tout seul, on paie seulement pour un meilleur.
// Chaque amélioration lui donne une meilleure pioche ET un plus grand sac à dos.
// vitesse = blocs cassés par seconde ; profMax = profondeur qu'il peut atteindre ;
// sac = places dans son sac à dos.
// Payé seulement en argent (décidé le 20/10) : le fer et la redstone servent aux machines
// (ascenseur et foreuse). Les prix d'avant + la valeur au marché des minerais qu'ils demandaient.
export const NIVEAUX_EMPLOYE: { nom: string; vitesse: number; profMax: number; sac: number; cout: Cout }[] = [
  { nom: 'Bois', vitesse: 0.8, profMax: 35, sac: 32, cout: { materiaux: {} } },
  { nom: 'Pierre', vitesse: 1.2, profMax: 70, sac: 48, cout: { argent: 3500, materiaux: {} } },
  { nom: 'Fer', vitesse: 1.8, profMax: 112, sac: 64, cout: { argent: 8000, materiaux: {} } },
  { nom: 'Diamant', vitesse: 2.5, profMax: 136, sac: 96, cout: { argent: 17000, materiaux: {} } },
  { nom: 'Netherite', vitesse: 3.2, profMax: 149, sac: 128, cout: { argent: 33000, materiaux: {} } },
]

// Bonus par niveau de prestige (ils s'additionnent à chaque prestige) :
// +15 % sur les ventes et +10 % de vitesse pour toutes les pioches.
export const BONUS_PRESTIGE = 0.15
export const BONUS_VITESSE_PRESTIGE = 0.1

// ---------------------------------------------------------------------------
// Enchantements (formules de Minecraft)
// ---------------------------------------------------------------------------

export type IdEnchantement = 'efficacite' | 'fortune' | 'solidite'

export type Enchantement = {
  id: IdEnchantement
  nom: string
  description: string
  niveauMax: number
  // Coût du niveau n : (argent × n × n) + (lapis × n) + (émeraudes × n).
  // L'argent grandit vite (n²) : les derniers niveaux, gardés de prestige en prestige, se méritent.
  argentParNiveau: number
  lapisParNiveau: number
  emeraudesParNiveau: number
}

export const ENCHANTEMENTS: Record<IdEnchantement, Enchantement> = {
  efficacite: {
    id: 'efficacite',
    nom: 'Efficacité',
    description: '+25 % de vitesse par niveau',
    niveauMax: 5,
    argentParNiveau: 400,
    lapisParNiveau: 3,
    emeraudesParNiveau: 1,
  },
  fortune: {
    id: 'fortune',
    nom: 'Fortune',
    description: '20 % de chance par niveau de doubler un minerai',
    niveauMax: 3,
    argentParNiveau: 600,
    lapisParNiveau: 4,
    emeraudesParNiveau: 1,
  },
  solidite: {
    id: 'solidite',
    nom: 'Solidité',
    description: "La pioche s'use moins vite",
    niveauMax: 3,
    argentParNiveau: 300,
    lapisParNiveau: 3,
    emeraudesParNiveau: 1,
  },
}

export const LISTE_ENCHANTEMENTS: IdEnchantement[] = ['efficacite', 'fortune', 'solidite']

// ---------------------------------------------------------------------------
// Zones (ambiance selon la profondeur)
// ---------------------------------------------------------------------------

export type Zone = { nom: string; profMax: number; classe: string }

export const ZONES: Zone[] = [
  { nom: 'Surface', profMax: 7, classe: 'zone-surface' },
  { nom: 'Cavernes', profMax: 35, classe: 'zone-cavernes' },
  { nom: 'Mines', profMax: 70, classe: 'zone-mines' },
  { nom: 'Profondeurs', profMax: 94, classe: 'zone-profondeurs' },
  { nom: 'Roche dure', profMax: 122, classe: 'zone-deepslate' },
  { nom: 'Abîmes', profMax: 150, classe: 'zone-abimes' },
]

// La zone (profondeurs de référence, mises à l'échelle de la mine du prestige).
export function zoneDe(profondeur: number, prestige: number): Zone {
  const reference = versReference(profondeur, prestige)
  return ZONES.find((z) => reference <= z.profMax) ?? ZONES[ZONES.length - 1]
}

// ---------------------------------------------------------------------------
// Formule de minage
// ---------------------------------------------------------------------------

export const VITESSE_JEU = 0.45

// Durée (en secondes) pour casser un bloc (x1,5 dans la roche dure).
export function dureeCasse(durete: number, profondeur: number, vitesse: number, prestige: number): number {
  const malusProfondeur = estRocheDure(profondeur, prestige) ? 1.5 : 1
  return ((durete * malusProfondeur) / vitesse) * VITESSE_JEU
}
