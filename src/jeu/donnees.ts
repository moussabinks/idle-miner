// Données du jeu : blocs, niveaux de la mine, pioches, sacs, mineurs, foreuse, générateur,
// bâtiments, décorations et tenues.
// Depuis le 22/10, la mine tourne toute seule (plus de vue en coupe, plus de profondeur ni de
// bedrock, plus de prestige) : on clique sur un bloc pour creuser plus vite, on embauche des
// mineurs, puis on relie la mine au marché avec des rails, d'abord poussés à la main, puis
// électriques grâce au générateur.

// ---------------------------------------------------------------------------
// Blocs
// ---------------------------------------------------------------------------

// Ce qu'on trouve dans la mine (le lapis, la netherite, la lave, les coffres et les géodes sont
// retirés depuis le 22/10).
export type IdBloc = 'pierre' | 'charbon' | 'fer' | 'redstone' | 'or' | 'emeraude' | 'diamant'

export type TypeBloc = {
  id: IdBloc
  nom: string
  emoji: string
  prix: number // prix de vente au marché, en $
  minerai: boolean // true = une bonne pioche peut le doubler
  dur: boolean // un bloc dur fait un bruit plus lourd quand il casse
}

export const BLOCS: Record<IdBloc, TypeBloc> = {
  pierre: { id: 'pierre', nom: 'Pierre', emoji: '🪨', prix: 1, minerai: false, dur: false },
  charbon: { id: 'charbon', nom: 'Charbon', emoji: '⚫', prix: 5, minerai: true, dur: true },
  fer: { id: 'fer', nom: 'Fer', emoji: '🔩', prix: 12, minerai: true, dur: true },
  redstone: { id: 'redstone', nom: 'Redstone', emoji: '🔴', prix: 15, minerai: true, dur: true },
  or: { id: 'or', nom: 'Or', emoji: '🟡', prix: 35, minerai: true, dur: true },
  emeraude: { id: 'emeraude', nom: 'Émeraude', emoji: '💚', prix: 80, minerai: true, dur: true },
  diamant: { id: 'diamant', nom: 'Diamant', emoji: '💎', prix: 100, minerai: true, dur: true },
}

export const LISTE_BLOCS = Object.keys(BLOCS) as IdBloc[]

// Les minerais « rares » (un son brillant et une petite fête quand on en trouve).
export const MINERAIS_RARES: IdBloc[] = ['or', 'emeraude', 'diamant']

// Le prix d'un achat : de l'argent, et des minerais (pris dans le sac, puis dans le coffre de la mine).
export type Cout = { argent?: number; materiaux: Partial<Record<IdBloc, number>> }

// ---------------------------------------------------------------------------
// La mine : 5 niveaux (décidé le 22/10)
// ---------------------------------------------------------------------------

// Chaque niveau ajoute un minerai, et rend les minerais rares plus fréquents. On achète le
// niveau suivant au bâtiment Mine. « debit » : les blocs que la mine sort toute seule chaque
// seconde (le vieux treuil), même sans joueur ni mineur.
export type NiveauMine = {
  niveau: number
  nom: string
  poids: Partial<Record<IdBloc, number>> // un poids 2 sort deux fois plus souvent qu'un poids 1
  debit: number
  cout: Cout // le prix pour y descendre (rien pour le premier)
}

export const NIVEAUX_MINE: NiveauMine[] = [
  { niveau: 1, nom: 'Galerie de surface', poids: { pierre: 70, charbon: 18, fer: 12 }, debit: 0.2, cout: { materiaux: {} } },
  { niveau: 2, nom: 'Veine de redstone', poids: { pierre: 60, charbon: 16, fer: 14, redstone: 10 }, debit: 0.25, cout: { argent: 400, materiaux: { fer: 30 } } },
  { niveau: 3, nom: 'Filon d’or', poids: { pierre: 52, charbon: 14, fer: 14, redstone: 12, or: 8 }, debit: 0.3, cout: { argent: 2500, materiaux: { fer: 60, redstone: 30 } } },
  {
    niveau: 4,
    nom: 'Grotte aux émeraudes',
    poids: { pierre: 46, charbon: 12, fer: 13, redstone: 12, or: 11, emeraude: 6 },
    debit: 0.35,
    cout: { argent: 9000, materiaux: { redstone: 60, or: 30 } },
  },
  {
    niveau: 5,
    nom: 'Cœur de diamant',
    poids: { pierre: 40, charbon: 11, fer: 12, redstone: 12, or: 12, emeraude: 8, diamant: 5 },
    debit: 0.4,
    cout: { argent: 30000, materiaux: { or: 60, emeraude: 25 } },
  },
]

export const NIVEAU_MINE_MAX = NIVEAUX_MINE.length

// Le coffre de la mine : tout ce qui sort de la mine y est rangé (clics, mine toute seule,
// mineurs). Quand il est plein, la mine s'arrête. On l'agrandit au bâtiment Mine.
export const NIVEAUX_COFFRE: { capacite: number; cout: Cout }[] = [
  { capacite: 100, cout: { materiaux: {} } },
  { capacite: 250, cout: { argent: 150, materiaux: { pierre: 40 } } },
  { capacite: 600, cout: { argent: 800, materiaux: { fer: 40 } } },
  { capacite: 1500, cout: { argent: 3000, materiaux: { fer: 80, redstone: 20 } } },
  { capacite: 4000, cout: { argent: 10000, materiaux: { or: 30 } } },
]

// ---------------------------------------------------------------------------
// Les pioches du joueur (au forgeron)
// ---------------------------------------------------------------------------

// Chaque clic sur le bloc de la mine casse un bloc et use la pioche d'un point. La pioche décide
// de la chance de doubler un minerai. Pioche cassée : un bloc tous les 2 clics, sans doublement.
// On commence avec la pioche en pierre (décidé le 22/10), réparée avec de la pierre et un peu d'argent.
export type Pioche = {
  niveau: number
  nom: string
  emoji: string
  doublement: number // chance de doubler un minerai (0,1 = 10 %)
  durabilite: number // nombre de clics avant qu'elle casse
  cout: Cout // le prix pour la débloquer (ou la racheter neuve)
  reparation: Cout // le prix pour la réparer quand elle est cassée (moins si elle est seulement usée)
  couleur: string // couleur du fer de la pioche, pour dessiner le personnage
}

export const PIOCHES: Pioche[] = [
  {
    niveau: 0,
    nom: 'Pierre',
    emoji: '🪨',
    doublement: 0.1,
    durabilite: 150,
    cout: { argent: 10, materiaux: { pierre: 20 } },
    reparation: { argent: 5, materiaux: { pierre: 10 } },
    couleur: '#8f8f8f',
  },
  {
    niveau: 1,
    nom: 'Fer',
    emoji: '⚙️',
    doublement: 0.2,
    durabilite: 300,
    cout: { argent: 200, materiaux: { fer: 25 } },
    reparation: { argent: 30, materiaux: { fer: 5 } },
    couleur: '#e6e6e6',
  },
  {
    niveau: 2,
    nom: 'Or',
    emoji: '🟡',
    doublement: 0.3,
    durabilite: 500,
    cout: { argent: 1500, materiaux: { or: 20 } },
    reparation: { argent: 150, materiaux: { or: 5 } },
    couleur: '#f4c518',
  },
  {
    niveau: 3,
    nom: 'Diamant',
    emoji: '💎',
    doublement: 0.45,
    durabilite: 1000,
    cout: { argent: 8000, materiaux: { diamant: 10 } },
    reparation: { argent: 600, materiaux: { diamant: 3 } },
    couleur: '#4ee8dc',
  },
]

// Pioche cassée : il faut 2 clics pour casser un bloc.
export const CLICS_MAINS_NUES = 2

// ---------------------------------------------------------------------------
// Le sac à dos (au bazar) : ce que le joueur porte jusqu'au marché
// ---------------------------------------------------------------------------

export const SACS = [
  { taille: 32, prix: 0 },
  { taille: 64, prix: 80 },
  { taille: 128, prix: 400 },
  { taille: 256, prix: 1500 },
  { taille: 512, prix: 5000 },
  { taille: 1024, prix: 15000 },
  { taille: 2048, prix: 40000 },
]

// ---------------------------------------------------------------------------
// L'ascenseur de la mine : il raccourcit les allers-retours des mineurs
// ---------------------------------------------------------------------------

// Sans ascenseur, un mineur met SECONDES_ECHELLE pour remonter (ou redescendre) à l'échelle.
export const SECONDES_ECHELLE = 10

export type NiveauAscenseur = {
  niveau: number
  cout: Cout
  secondesTrajet: number // le temps d'un trajet (montée ou descente) d'un mineur
}

export const NIVEAUX_ASCENSEUR: NiveauAscenseur[] = [
  { niveau: 1, cout: { argent: 150, materiaux: { fer: 10 } }, secondesTrajet: 6 },
  { niveau: 2, cout: { argent: 600, materiaux: { fer: 30, redstone: 5 } }, secondesTrajet: 4 },
  { niveau: 3, cout: { argent: 2000, materiaux: { fer: 60, redstone: 20 } }, secondesTrajet: 2.8 },
  { niveau: 4, cout: { argent: 6000, materiaux: { fer: 100, redstone: 50 } }, secondesTrajet: 2 },
  { niveau: 5, cout: { argent: 15000, materiaux: { redstone: 100, or: 20 } }, secondesTrajet: 1.4 },
  { niveau: 6, cout: { argent: 40000, materiaux: { or: 60, emeraude: 10 } }, secondesTrajet: 1 },
]

// ---------------------------------------------------------------------------
// Les mineurs employés (dès le début, au bâtiment Personnel)
// ---------------------------------------------------------------------------

// Combien de mineurs on peut employer : 4 au niveau 1 de la mine, puis 2 de plus par niveau.
export const EMPLOYES_NIVEAU_1 = 4
export const EMPLOYES_PAR_NIVEAU = 2
// Le prix de la 1re, 2e, 3e... embauche (il dépend seulement du nombre de mineurs qu'on a).
// Au-delà de la liste, chaque embauche coûte 60 % de plus que la précédente.
export const PRIX_EMBAUCHE = [50, 150, 400, 1000, 2500, 6000, 14000, 30000, 60000, 120000]
export const HAUSSE_APRES_LISTE = 1.6
// Licencier un mineur coûte des indemnités : 40 % du prix de sa place dans l'équipe.
export const PART_INDEMNITES = 0.4
// Le temps passé à vider son sac dans le coffre (ou à vendre au marché).
export const SECONDES_VIDAGE_EMPLOYE = 2
export const NOMS_EMPLOYES = [
  'Raphaël', 'Moussa', 'Tom', 'Noah', 'Samy', 'Valou', 'Marion', 'Enya', 'Kaïnae',
  'Teo', 'Fredo', 'Satine', 'Nils', 'Arthur', 'Sasha', 'Florian', 'Khalil', 'Margot',
]

// Le salaire de 10 minutes d'un mineur, selon sa pioche (bois, pierre, fer, or, diamant) :
// environ 15 % de ce qu'il fait sortir de la mine.
export const SECONDES_PAR_PAIE = 10 * 60
export const SALAIRES = [30, 60, 140, 320, 700]

// L'équipement d'un mineur : une meilleure pioche le fait creuser plus vite, et un plus grand
// sac lui fait faire moins d'allers-retours. Payé en argent seulement.
export const NIVEAUX_EMPLOYE: { nom: string; vitesse: number; sac: number; cout: Cout }[] = [
  { nom: 'Bois', vitesse: 0.15, sac: 10, cout: { materiaux: {} } },
  { nom: 'Pierre', vitesse: 0.25, sac: 15, cout: { argent: 150, materiaux: {} } },
  { nom: 'Fer', vitesse: 0.4, sac: 20, cout: { argent: 600, materiaux: {} } },
  { nom: 'Or', vitesse: 0.6, sac: 30, cout: { argent: 2500, materiaux: {} } },
  { nom: 'Diamant', vitesse: 0.9, sac: 45, cout: { argent: 9000, materiaux: {} } },
]

// --- La rareté des mineurs (avec le recruteur, dès le niveau 3 de la mine) ---
export type IdRarete = 'commun' | 'rare' | 'epique' | 'legendaire' | 'mythique'

export type Rarete = {
  id: IdRarete
  nom: string
  rendement: number // il creuse ce nombre de fois plus vite (et son sac est d'autant plus grand)
  salaire: number // son salaire est multiplié par ce nombre
  couleur: string // pour les étiquettes, l'animation d'embauche...
}

export const RARETES: Record<IdRarete, Rarete> = {
  commun: { id: 'commun', nom: 'Commun', rendement: 1, salaire: 1, couleur: '#b9b4ab' },
  rare: { id: 'rare', nom: 'Rare', rendement: 1.5, salaire: 1.25, couleur: '#4f9df0' },
  epique: { id: 'epique', nom: 'Épique', rendement: 2, salaire: 1.5, couleur: '#b06cf0' },
  legendaire: { id: 'legendaire', nom: 'Légendaire', rendement: 3, salaire: 2, couleur: '#f5a524' },
  mythique: { id: 'mythique', nom: 'Mythique', rendement: 5, salaire: 3, couleur: '#ff4d8d' },
}

export const LISTE_RARETES: IdRarete[] = ['commun', 'rare', 'epique', 'legendaire', 'mythique']

// --- Le recruteur (niveau 3 de la mine) ---
export const NIVEAU_MINE_RECRUTEUR = 3
export const NIVEAUX_RECRUTEUR: { cout: Cout; chances: Record<IdRarete, number> }[] = [
  { cout: { argent: 5000, materiaux: {} }, chances: { commun: 65, rare: 20, epique: 10, legendaire: 4, mythique: 1 } },
  { cout: { argent: 12000, materiaux: {} }, chances: { commun: 60, rare: 22, epique: 11, legendaire: 5.5, mythique: 1.5 } },
  { cout: { argent: 25000, materiaux: {} }, chances: { commun: 55, rare: 23.5, epique: 12.5, legendaire: 7, mythique: 2 } },
  { cout: { argent: 50000, materiaux: {} }, chances: { commun: 50, rare: 25, epique: 14, legendaire: 8.5, mythique: 2.5 } },
]

// --- Le manager (niveau 4 de la mine) : il paie les salaires avec la trésorerie ---
export const NIVEAU_MINE_MANAGER = 4
export const PRIX_MANAGER = 15000
export const SALAIRE_MANAGER = 600 // toutes les 10 minutes
export const SECONDES_AVANT_PAIE_MANAGER = 60

// ---------------------------------------------------------------------------
// Les rails et le wagonnet
// ---------------------------------------------------------------------------

// Les rails se paient en fer (dès le début). Il faut une ligne continue de la mine au marché :
// alors le wagonnet peut porter le coffre au marché. Sans électricité, on le pousse (toi au
// début, puis un pousseur embauché pour ce trajet) ; avec le générateur, il roule tout seul.
export const COUT_RAIL: Cout = { materiaux: { fer: 3 } }
// Les vitesses, en cases par seconde.
export const VITESSE_POUSSE_JOUEUR = 3
export const VITESSE_POUSSE_MINEUR = 2.5
export const VITESSE_RAILS = 8 // le wagonnet électrique, à la puissance 1
// Le temps pour charger le wagonnet au coffre, et pour le vider au marché.
export const SECONDES_CHARGEMENT_WAGONNET = 2

// Les trajets des wagonnets (24/10) : le joueur choisit lui-même où va chaque wagonnet, sur les
// rails qu'il a posés. Un trajet relie un bâtiment de départ à un bâtiment d'arrivée (un seul
// wagonnet par trajet) ; plusieurs trajets peuvent partager les mêmes rails (les wagonnets se
// croisent sans se gêner).
export type IdLiaison = 'mine-marche' | 'mine-foreuse' | 'mine-generateur' | 'foreuse-marche'
export type InfoLiaison = {
  id: IdLiaison
  depart: IdBatiment
  arrivee: IdBatiment
  emoji: string
  description: string // ce que fait le wagonnet sur ce trajet
}
export const LIAISONS: Record<IdLiaison, InfoLiaison> = {
  'mine-marche': { id: 'mine-marche', depart: 'puits', arrivee: 'marche', emoji: '💰', description: 'emporte le coffre de la mine et le vend au marché' },
  'mine-foreuse': { id: 'mine-foreuse', depart: 'puits', arrivee: 'foreuse', emoji: '🔥', description: 'apporte le charbon du coffre à la foreuse' },
  'mine-generateur': { id: 'mine-generateur', depart: 'puits', arrivee: 'generateur', emoji: '🔴', description: 'apporte la redstone du coffre au générateur' },
  'foreuse-marche': { id: 'foreuse-marche', depart: 'foreuse', arrivee: 'marche', emoji: '🛒', description: 'vend le chariot de la foreuse au marché' },
}
export const LISTE_LIAISONS: IdLiaison[] = ['mine-marche', 'mine-foreuse', 'mine-generateur', 'foreuse-marche']
// Les bâtiments où les rails peuvent arriver (les départs et arrivées des trajets).
export const BATIMENTS_DES_RAILS: IdBatiment[] = ['puits', 'marche', 'foreuse', 'generateur']
// Les wagonnets du charbon et de la redstone remplissent la foreuse et le générateur jusqu'à
// cette réserve (en secondes de marche) : 60 charbons, 60 redstones.
export const RESERVE_FOREUSE_WAGONNET = 1200
export const RESERVE_GENERATEUR_WAGONNET = 1800

// La taille des wagonnets (au bâtiment Mine) : elle vaut pour tous les trajets.
export const NIVEAUX_WAGONNET: { capacite: number; cout: Cout }[] = [
  { capacite: 40, cout: { materiaux: {} } },
  { capacite: 100, cout: { argent: 500, materiaux: { fer: 40 } } },
  { capacite: 250, cout: { argent: 2500, materiaux: { fer: 80, redstone: 20 } } },
  { capacite: 600, cout: { argent: 10000, materiaux: { or: 40 } } },
]

// ---------------------------------------------------------------------------
// Le générateur (niveau 2 de la mine) : de l'électricité dans un rayon
// ---------------------------------------------------------------------------

// Il brûle de la redstone : 1 redstone = 30 secondes de courant. Tout ce qui est dans son rayon
// (un cercle autour de lui, en cases) est électrique : les rails (le wagonnet roule tout seul,
// plus vite avec plus de puissance) et la foreuse (elle fore plus vite).
export const SECONDES_PAR_REDSTONE = 30
export const NIVEAUX_GENERATEUR: { rayon: number; puissance: number; cout: Cout }[] = [
  { rayon: 15, puissance: 1, cout: { materiaux: {} } },
  { rayon: 20, puissance: 1.3, cout: { argent: 3000, materiaux: { fer: 80, redstone: 40 } } },
  { rayon: 26, puissance: 1.7, cout: { argent: 8000, materiaux: { fer: 150, redstone: 80 } } },
  { rayon: 33, puissance: 2.2, cout: { argent: 20000, materiaux: { fer: 250, redstone: 150 } } },
  { rayon: 40, puissance: 3, cout: { argent: 50000, materiaux: { fer: 400, redstone: 300 } } },
]
// À partir de ce niveau (le 2e), le générateur peut puiser la redstone dans le coffre de la mine.
export const NIVEAU_GENERATEUR_AUTO = 1
// Il garde au plus 5 minutes de redstone d'avance quand il se sert dans le coffre.
export const RESERVE_GENERATEUR_AUTO = 300

// ---------------------------------------------------------------------------
// La foreuse (niveau 2 de la mine) : au charbon, plus rapide sous électricité
// ---------------------------------------------------------------------------

export const SECONDES_PAR_CHARBON = 20
// À partir de ce niveau de forage (le 3e), elle peut brûler le charbon qu'elle fore.
export const NIVEAU_RECHARGE_AUTO = 2
export const RESERVE_RECHARGE_AUTO = 60
// Sous électricité, elle fore (1 + puissance) fois plus vite... à moitié : × (1 + puissance / 2).
export const BONUS_ELECTRIQUE_FOREUSE = 0.5

export const NIVEAUX_FORAGE: { vitesse: number; cout: Cout }[] = [
  { vitesse: 0.5, cout: { materiaux: {} } },
  { vitesse: 0.8, cout: { argent: 1500, materiaux: { fer: 30, redstone: 10 } } },
  { vitesse: 1.2, cout: { argent: 4000, materiaux: { fer: 60, redstone: 30 } } },
  { vitesse: 1.8, cout: { argent: 10000, materiaux: { fer: 100, redstone: 60 } } },
  { vitesse: 2.6, cout: { argent: 25000, materiaux: { redstone: 100, or: 30 } } },
  { vitesse: 3.6, cout: { argent: 60000, materiaux: { or: 60, emeraude: 15 } } },
]

export const NIVEAUX_CHARIOT: { capacite: number; cout: Cout }[] = [
  { capacite: 200, cout: { materiaux: {} } },
  { capacite: 400, cout: { argent: 1000, materiaux: { fer: 20 } } },
  { capacite: 800, cout: { argent: 3000, materiaux: { fer: 50, redstone: 15 } } },
  { capacite: 1600, cout: { argent: 8000, materiaux: { fer: 90, redstone: 40 } } },
  { capacite: 3000, cout: { argent: 20000, materiaux: { redstone: 80, or: 20 } } },
  { capacite: 6000, cout: { argent: 50000, materiaux: { or: 50, emeraude: 10 } } },
]

// ---------------------------------------------------------------------------
// Le village en vue du ciel : une grande grille où l'on pose les bâtiments
// ---------------------------------------------------------------------------

// La clairière fait 60 × 60 cases. Chaque bâtiment fait 5 × 5 cases, sauf la mine (10 × 10).
// Les rails, les chemins et les petites décorations font 1 case.
export const TAILLE_GRILLE = 60

// Les bâtiments du village. (L'arbre de prestige et l'enchanteur sont retirés pour l'instant :
// leur code est dans archives/.)
export type IdBatiment = 'puits' | 'marche' | 'forgeron' | 'bazar' | 'employes' | 'foreuse' | 'generateur'

export type InfoBatiment = {
  id: IdBatiment
  nom: string
  emoji: string
  description: string
  taille: number // en cases (carré)
  // Le côté de l'entrée sur le dessin (sans miroir) : la face avant gauche ou la face avant droite.
  porte: 'gauche' | 'droite'
  niveauMine: number // à partir de quel niveau de mine on peut le poser
  cout: Cout // le prix pour le poser (une seule fois)
}

export const BATIMENTS: Record<IdBatiment, InfoBatiment> = {
  puits: {
    id: 'puits',
    nom: 'Mine',
    emoji: '⛏️',
    description: 'Clique sur le bloc pour creuser. Tout ce qui sort de la mine va dans son coffre.',
    taille: 10,
    porte: 'gauche',
    niveauMine: 1,
    cout: { materiaux: {} },
  },
  marche: {
    id: 'marche',
    nom: 'Marché',
    emoji: '💰',
    description: 'Vends tes blocs et minerais.',
    taille: 5,
    porte: 'gauche',
    niveauMine: 1,
    cout: { materiaux: {} },
  },
  forgeron: {
    id: 'forgeron',
    nom: 'Forgeron',
    emoji: '⚒️',
    description: 'Pioches et réparations.',
    taille: 5,
    porte: 'droite',
    niveauMine: 1,
    cout: { argent: 20, materiaux: { pierre: 15 } },
  },
  bazar: {
    id: 'bazar',
    nom: 'Bazar',
    emoji: '🎒',
    description: 'Sacs à dos et tenues.',
    taille: 5,
    porte: 'droite',
    niveauMine: 1,
    cout: { argent: 60, materiaux: { pierre: 25 } },
  },
  employes: {
    id: 'employes',
    nom: 'Personnel',
    emoji: '👷',
    description: 'Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires.',
    taille: 5,
    porte: 'droite',
    niveauMine: 1,
    cout: { argent: 100, materiaux: { pierre: 30 } },
  },
  foreuse: {
    id: 'foreuse',
    nom: 'Foreuse',
    emoji: '⚙️',
    description: 'Elle creuse toute seule avec du charbon, et plus vite avec de l’électricité.',
    taille: 5,
    porte: 'gauche',
    niveauMine: 2,
    cout: { argent: 800, materiaux: { pierre: 60, fer: 30 } },
  },
  generateur: {
    id: 'generateur',
    nom: 'Générateur',
    emoji: '⚡',
    description: 'Il brûle de la redstone et électrifie tout ce qui est dans son rayon : rails et foreuse.',
    taille: 5,
    porte: 'droite',
    niveauMine: 2,
    cout: { argent: 1200, materiaux: { fer: 50, redstone: 20 } },
  },
}

// L'ordre du menu « Bâtiments » (la mine est déjà posée au début de la partie).
export const LISTE_BATIMENTS: IdBatiment[] = ['marche', 'forgeron', 'bazar', 'employes', 'foreuse', 'generateur']

// Les chemins de pavés : seulement pour faire joli (5 $ la case).
export const COUT_CHEMIN: Cout = { argent: 5, materiaux: {} }

// Les vitesses au village, en cases par seconde (à pied).
export const VITESSE_MARCHE = 4
// Le joueur marche un peu plus vite que ses mineurs (c'est lui le patron).
export const VITESSE_JOUEUR = 5
// Un mineur dont on a amélioré la pioche passe 3 s à la forge pour la récupérer.
export const SECONDES_FORGE_EMPLOYE = 3

// Les décorations : seulement pour faire joli. Les fleurs, buissons et chemins se traversent ;
// les arbres, rochers, lanternes, fontaines... bloquent le passage.
export type IdDecoration =
  | 'fleurs-rouges'
  | 'fleurs-jaunes'
  | 'fleurs-violettes'
  | 'buisson'
  | 'rocher'
  | 'tonneau'
  | 'caisse'
  | 'lanterne'
  | 'banc'
  | 'arbre'
  | 'sapin'
  | 'cerisier'
  | 'fontaine'
  | 'statue'

export type InfoDecoration = {
  id: IdDecoration
  nom: string
  taille: 1 | 2
  prix: number
  bloque: boolean // true = on ne peut pas marcher à travers
  niveauMine: number // à partir de quel niveau de mine on peut l'acheter
}

export const DECORATIONS: Record<IdDecoration, InfoDecoration> = {
  'fleurs-rouges': { id: 'fleurs-rouges', nom: 'Fleurs rouges', taille: 1, prix: 15, bloque: false, niveauMine: 1 },
  'fleurs-jaunes': { id: 'fleurs-jaunes', nom: 'Fleurs jaunes', taille: 1, prix: 15, bloque: false, niveauMine: 1 },
  'fleurs-violettes': { id: 'fleurs-violettes', nom: 'Fleurs violettes', taille: 1, prix: 20, bloque: false, niveauMine: 1 },
  buisson: { id: 'buisson', nom: 'Buisson', taille: 1, prix: 30, bloque: false, niveauMine: 1 },
  rocher: { id: 'rocher', nom: 'Rocher', taille: 1, prix: 25, bloque: true, niveauMine: 1 },
  tonneau: { id: 'tonneau', nom: 'Tonneau', taille: 1, prix: 40, bloque: true, niveauMine: 1 },
  caisse: { id: 'caisse', nom: 'Caisse de minerais', taille: 1, prix: 120, bloque: true, niveauMine: 1 },
  lanterne: { id: 'lanterne', nom: 'Lanterne', taille: 1, prix: 80, bloque: true, niveauMine: 1 },
  banc: { id: 'banc', nom: 'Banc', taille: 1, prix: 60, bloque: true, niveauMine: 1 },
  arbre: { id: 'arbre', nom: 'Grand arbre', taille: 2, prix: 150, bloque: true, niveauMine: 1 },
  sapin: { id: 'sapin', nom: 'Sapin', taille: 2, prix: 150, bloque: true, niveauMine: 1 },
  cerisier: { id: 'cerisier', nom: 'Cerisier en fleurs', taille: 2, prix: 600, bloque: true, niveauMine: 2 },
  fontaine: { id: 'fontaine', nom: 'Fontaine', taille: 2, prix: 2500, bloque: true, niveauMine: 3 },
  statue: { id: 'statue', nom: 'Statue du hamster d’or', taille: 2, prix: 20000, bloque: true, niveauMine: 5 },
}

export const LISTE_DECORATIONS = Object.keys(DECORATIONS) as IdDecoration[]

// ---------------------------------------------------------------------------
// Les tenues du joueur (au Bazar) : seulement pour le style
// ---------------------------------------------------------------------------

export type PartieTenue = 'chapeau' | 'haut'
export type IdTenue =
  | 'bandana'
  | 'casquette'
  | 'paille'
  | 'chantier'
  | 'haut-de-forme'
  | 'couronne'
  | 'gilet-cuir'
  | 'salopette'
  | 'gilet-or'

export type InfoTenue = { id: IdTenue; nom: string; partie: PartieTenue; prix: number; niveauMine: number }

export const TENUES: Record<IdTenue, InfoTenue> = {
  bandana: { id: 'bandana', nom: 'Bandana rouge', partie: 'chapeau', prix: 150, niveauMine: 1 },
  casquette: { id: 'casquette', nom: 'Casquette bleue', partie: 'chapeau', prix: 300, niveauMine: 1 },
  paille: { id: 'paille', nom: 'Chapeau de paille', partie: 'chapeau', prix: 600, niveauMine: 1 },
  chantier: { id: 'chantier', nom: 'Casque de chantier', partie: 'chapeau', prix: 1200, niveauMine: 1 },
  'haut-de-forme': { id: 'haut-de-forme', nom: 'Haut-de-forme', partie: 'chapeau', prix: 5000, niveauMine: 2 },
  couronne: { id: 'couronne', nom: 'Couronne', partie: 'chapeau', prix: 30000, niveauMine: 4 },
  'gilet-cuir': { id: 'gilet-cuir', nom: 'Gilet en cuir', partie: 'haut', prix: 400, niveauMine: 1 },
  salopette: { id: 'salopette', nom: 'Salopette de mineur', partie: 'haut', prix: 900, niveauMine: 1 },
  'gilet-or': { id: 'gilet-or', nom: 'Gilet doré', partie: 'haut', prix: 12000, niveauMine: 3 },
}

export const LISTE_TENUES = Object.keys(TENUES) as IdTenue[]
