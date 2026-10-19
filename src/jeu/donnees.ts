// Données du jeu : pioches, blocs, sacs, enchantements, zones et constantes.
// Les valeurs viennent de docs/idle_miner_v1.md (version notebook Python),
// avec une mine deux fois plus profonde (bedrock à -128 m au lieu de -64 m).

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
  deepslate: { id: 'deepslate', nom: 'Deepslate', emoji: '⬛', prix: 2, durete: 3, minerai: false, special: false },
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
  // Matériau utilisé pour la réparer. 'planche' n'existe pas dans le sac : on l'achète.
  reparation: IdBloc | 'planche'
  couleur: string // couleur du fer de la pioche, pour dessiner le personnage
}

export const PIOCHES: Pioche[] = [
  { niveau: 0, nom: 'Bois', emoji: '🪵', vitesse: 2, profMax: 30, durabilite: 60, prix: 5, materiaux: {}, reparation: 'planche', couleur: '#b5834a' },
  { niveau: 1, nom: 'Pierre', emoji: '🪨', vitesse: 4, profMax: 60, durabilite: 160, prix: 40, materiaux: {}, reparation: 'pierre', couleur: '#8f8f8f' },
  { niveau: 2, nom: 'Fer', emoji: '⚙️', vitesse: 6, profMax: 96, durabilite: 250, prix: 300, materiaux: {}, reparation: 'fer', couleur: '#e6e6e6' },
  { niveau: 3, nom: 'Diamant', emoji: '💎', vitesse: 8, profMax: 116, durabilite: 500, prix: 2000, materiaux: { diamant: 3 }, reparation: 'diamant', couleur: '#4ee8dc' },
  {
    niveau: 4,
    nom: 'Netherite',
    emoji: '🔥',
    vitesse: 9,
    profMax: 128,
    durabilite: 800,
    prix: 3000,
    materiaux: { debris: 4, or: 4 },
    reparation: 'debris',
    couleur: '#6b5568',
  },
]

// Prix d'une planche (pour réparer la pioche en bois).
export const PRIX_PLANCHE = 2

// Chaque unité de matériau répare 25 % de la pioche (comme l'enclume).
export const REPARATION_PAR_UNITE = 0.25

// Un matériau qui manque est acheté à 2 fois son prix de vente.
export const MULTIPLICATEUR_ACHAT = 2

// Vitesse à mains nues (pioche cassée).
export const VITESSE_MAINS_NUES = 1

// ---------------------------------------------------------------------------
// Mine, sac et boutique
// ---------------------------------------------------------------------------

export const LARGEUR_MINE = 10 // blocs par couche
export const PROFONDEUR_BEDROCK = 128

// Sous cette profondeur, la roche devient de la deepslate et tout est plus long à casser.
export const PROFONDEUR_DEEPSLATE = 80

// Les sacs : la taille et le prix de chaque niveau (le premier est gratuit).
export const SACS = [
  { taille: 32, prix: 0 },
  { taille: 64, prix: 80 },
  { taille: 128, prix: 400 },
  { taille: 256, prix: 1500 },
]

export const PRIX_SEAU = 25

// On voit toujours les 4 couches sous la couche en cours (lumière naturelle, sans torches).
export const COUCHES_VISIBLES_DESSOUS = 4

// ---------------------------------------------------------------------------
// Surface, échelle et ascenseur
// ---------------------------------------------------------------------------

// Temps pour monter (ou descendre) un mètre à l'échelle, en secondes.
export const SECONDES_PAR_METRE_ECHELLE = 0.15

// L'ascenseur automatique : il se construit puis s'améliore avec du fer et de la redstone.
// Chaque niveau remonte plus d'objets par voyage, et plus vite.
export type NiveauAscenseur = {
  niveau: number
  fer: number
  redstone: number
  capacite: number // objets remontés par voyage
  secondesParMetre: number // temps pour parcourir un mètre
}

export const NIVEAUX_ASCENSEUR: NiveauAscenseur[] = [
  { niveau: 1, fer: 10, redstone: 5, capacite: 32, secondesParMetre: 0.1 },
  { niveau: 2, fer: 40, redstone: 15, capacite: 64, secondesParMetre: 0.07 },
  { niveau: 3, fer: 80, redstone: 30, capacite: 128, secondesParMetre: 0.05 },
  { niveau: 4, fer: 150, redstone: 60, capacite: 256, secondesParMetre: 0.03 },
]

// ---------------------------------------------------------------------------
// La foreuse (débloquée au prestige 1)
// ---------------------------------------------------------------------------

export type Cout = { argent?: number; materiaux: Partial<Record<IdBloc, number>> }

// On l'active une seule fois (elle reste active après les prestiges suivants).
export const COUT_ACTIVATION_FOREUSE: Cout = { materiaux: { fer: 30, redstone: 10 } }
export const PRESTIGE_FOREUSE = 1

// Un charbon fait tourner la foreuse pendant 20 secondes.
export const SECONDES_PAR_CHARBON = 20

// À partir de ce niveau de forage (le 3e), la foreuse peut se recharger toute seule
// avec le charbon qu'elle remonte (option à cocher).
export const NIVEAU_RECHARGE_AUTO = 2
// Elle ne garde pour elle que de quoi tourner une minute : le reste du charbon va au chariot.
export const RESERVE_RECHARGE_AUTO = 60

// Vitesse de forage (blocs par seconde) et coût de chaque niveau.
export const NIVEAUX_FORAGE: { vitesse: number; cout: Cout }[] = [
  { vitesse: 0.5, cout: { materiaux: {} } },
  { vitesse: 1, cout: { argent: 1000, materiaux: { fer: 30 } } },
  { vitesse: 2, cout: { argent: 4000, materiaux: { redstone: 30, or: 10 } } },
  { vitesse: 4, cout: { argent: 12000, materiaux: { diamant: 10 } } },
]

// Taille du chariot (en objets) et coût de chaque niveau.
export const NIVEAUX_CHARIOT: { capacite: number; cout: Cout }[] = [
  { capacite: 200, cout: { materiaux: {} } },
  { capacite: 500, cout: { argent: 800, materiaux: {} } },
  { capacite: 1000, cout: { argent: 3000, materiaux: { fer: 50 } } },
  { capacite: 2500, cout: { argent: 9000, materiaux: { or: 20 } } },
]

// La foreuse descend d'un mètre tous les 10 blocs forés (une couche entière).
export const BLOCS_FORES_PAR_METRE = 10

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
  // Coût du niveau n : (lapis × n) + (émeraudes × n).
  lapisParNiveau: number
  emeraudesParNiveau: number
}

export const ENCHANTEMENTS: Record<IdEnchantement, Enchantement> = {
  efficacite: {
    id: 'efficacite',
    nom: 'Efficacité',
    description: '+25 % de vitesse par niveau',
    niveauMax: 5,
    lapisParNiveau: 4,
    emeraudesParNiveau: 1,
  },
  fortune: {
    id: 'fortune',
    nom: 'Fortune',
    description: 'Plus de minerais par bloc cassé',
    niveauMax: 3,
    lapisParNiveau: 6,
    emeraudesParNiveau: 2,
  },
  solidite: {
    id: 'solidite',
    nom: 'Solidité',
    description: "La pioche s'use moins vite",
    niveauMax: 3,
    lapisParNiveau: 4,
    emeraudesParNiveau: 1,
  },
}

export const LISTE_ENCHANTEMENTS: IdEnchantement[] = ['efficacite', 'fortune', 'solidite']

// ---------------------------------------------------------------------------
// Zones (ambiance selon la profondeur)
// ---------------------------------------------------------------------------

export type Zone = { nom: string; profMax: number; classe: string }

export const ZONES: Zone[] = [
  { nom: 'Surface', profMax: 6, classe: 'zone-surface' },
  { nom: 'Cavernes', profMax: 30, classe: 'zone-cavernes' },
  { nom: 'Mines', profMax: 60, classe: 'zone-mines' },
  { nom: 'Profondeurs', profMax: 80, classe: 'zone-profondeurs' },
  { nom: 'Deepslate', profMax: 104, classe: 'zone-deepslate' },
  { nom: 'Abîmes', profMax: 128, classe: 'zone-abimes' },
]

export function zoneDe(profondeur: number): Zone {
  return ZONES.find((z) => profondeur <= z.profMax) ?? ZONES[ZONES.length - 1]
}

// ---------------------------------------------------------------------------
// Formule de minage
// ---------------------------------------------------------------------------

export const VITESSE_JEU = 0.45

// Durée (en secondes) pour casser un bloc (x1,5 dans la deepslate).
export function dureeCasse(durete: number, profondeur: number, vitesse: number): number {
  const malusProfondeur = profondeur > PROFONDEUR_DEEPSLATE ? 1.5 : 1
  return ((durete * malusProfondeur) / vitesse) * VITESSE_JEU
}
