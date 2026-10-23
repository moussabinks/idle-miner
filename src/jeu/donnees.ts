// Données du jeu : blocs, niveaux de la mine, pioches, sacs, mineurs, foreuse, générateur,
// bâtiments et décorations.
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
  // (27/10 : au niveau 1, la mine ne sort rien toute seule : on creuse à la main, ou avec des mineurs)
  { niveau: 1, nom: 'Galerie de surface', poids: { pierre: 70, charbon: 18, fer: 12 }, debit: 0, cout: { materiaux: {} } },
  { niveau: 2, nom: 'Veine de redstone', poids: { pierre: 60, charbon: 16, fer: 14, redstone: 10 }, debit: 0.25, cout: { argent: 900, materiaux: { fer: 45 } } },
  { niveau: 3, nom: 'Filon d’or', poids: { pierre: 52, charbon: 14, fer: 14, redstone: 12, or: 8 }, debit: 0.3, cout: { argent: 7000, materiaux: { fer: 120, redstone: 60 } } },
  {
    niveau: 4,
    nom: 'Grotte aux émeraudes',
    poids: { pierre: 46, charbon: 12, fer: 13, redstone: 12, or: 11, emeraude: 6 },
    debit: 0.35,
    cout: { argent: 25000, materiaux: { redstone: 120, or: 60 } },
  },
  {
    niveau: 5,
    nom: 'Cœur de diamant',
    poids: { pierre: 40, charbon: 11, fer: 12, redstone: 12, or: 12, emeraude: 8, diamant: 5 },
    debit: 0.4,
    cout: { argent: 90000, materiaux: { or: 110, emeraude: 40 } },
  },
]

export const NIVEAU_MINE_MAX = NIVEAUX_MINE.length

// Le coffre de la mine : tout ce qui sort de la mine y est rangé (clics, mine toute seule,
// mineurs). Quand il est plein, la mine s'arrête. On l'agrandit au bâtiment Mine.
export const NIVEAUX_COFFRE: { capacite: number; cout: Cout }[] = [
  { capacite: 100, cout: { materiaux: {} } },
  { capacite: 250, cout: { argent: 250, materiaux: { pierre: 50 } } },
  { capacite: 600, cout: { argent: 2500, materiaux: { fer: 100 } } },
  { capacite: 1500, cout: { argent: 12000, materiaux: { fer: 200, redstone: 60 } } },
  { capacite: 4000, cout: { argent: 50000, materiaux: { or: 120 } } },
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
    cout: { argent: 400, materiaux: { fer: 20 } },
    reparation: { argent: 30, materiaux: { fer: 5 } },
    couleur: '#e6e6e6',
  },
  {
    niveau: 2,
    nom: 'Or',
    emoji: '🟡',
    doublement: 0.3,
    durabilite: 500,
    cout: { argent: 4000, materiaux: { or: 40 } },
    reparation: { argent: 150, materiaux: { or: 5 } },
    couleur: '#f4c518',
  },
  {
    niveau: 3,
    nom: 'Diamant',
    emoji: '💎',
    doublement: 0.45,
    durabilite: 1000,
    cout: { argent: 20000, materiaux: { diamant: 20 } },
    reparation: { argent: 600, materiaux: { diamant: 3 } },
    couleur: '#4ee8dc',
  },
]

// Pioche cassée : il faut 2 clics pour casser un bloc.
export const CLICS_MAINS_NUES = 2

// Les bonus de combo (30/10) : en cliquant vite sans s'arrêter, on atteint des paliers (10, 25,
// 50... clics d'affilée). Chaque palier donne un petit bonus de quelques secondes : plus de
// chance de doubler les minerais (« fortune »), puis plusieurs blocs par clic.
export type BonusCombo = {
  palier: number // le nombre de clics d'affilée
  nom: string
  emoji: string
  secondes: number // sa durée
  fortune: number // chance de doubler en plus (0,25 = +25 %)
  blocs: number // blocs cassés par clic (1 = normal)
}
export const BONUS_COMBO: BonusCombo[] = [
  { palier: 10, nom: 'Fortune', emoji: '🍀', secondes: 3, fortune: 0.25, blocs: 1 },
  { palier: 25, nom: 'Grande fortune', emoji: '🍀', secondes: 4, fortune: 0.5, blocs: 1 },
  { palier: 50, nom: 'Double coup', emoji: '💥', secondes: 5, fortune: 0.25, blocs: 2 },
  { palier: 100, nom: 'Frénésie', emoji: '🔥', secondes: 8, fortune: 1, blocs: 2 },
  { palier: 200, nom: 'Ruée vers l’or', emoji: '✨', secondes: 10, fortune: 1, blocs: 3 },
  { palier: 500, nom: 'Légende de la mine', emoji: '🏆', secondes: 15, fortune: 1, blocs: 5 },
]

// ---------------------------------------------------------------------------
// Le sac à dos (au bazar) : ce que le joueur porte jusqu'au marché
// ---------------------------------------------------------------------------

export const SACS = [
  { taille: 32, prix: 0 },
  { taille: 64, prix: 150 },
  { taille: 128, prix: 1200 },
  { taille: 256, prix: 6000 },
  { taille: 512, prix: 25000 },
  { taille: 1024, prix: 90000 },
  { taille: 2048, prix: 300000 },
]

// ---------------------------------------------------------------------------
// L'ascenseur de la mine : il raccourcit les allers-retours des mineurs
// ---------------------------------------------------------------------------

// Sans ascenseur, un mineur met SECONDES_ECHELLE pour remonter (ou redescendre) à l'échelle.
// (30/10 : la mine a son ascenseur dès le début, au niveau 1 ; l'échelle ne sert plus qu'aux
// vieilles parties.)
export const SECONDES_ECHELLE = 10

export type NiveauAscenseur = {
  niveau: number
  cout: Cout
  secondesTrajet: number // le temps d'un trajet (montée ou descente) de la caisse
  // (23/10) le temps de charger la caisse au fond, et de la vider dans le coffre : plus rapides
  // à chaque niveau
  secondesChargement: number
  secondesVidage: number
  capacite: number // (23/10) combien de blocs la caisse remonte à chaque voyage (petite au début :
  // avec plus de 2 mineurs, il faut améliorer l'ascenseur)
}

export const NIVEAUX_ASCENSEUR: NiveauAscenseur[] = [
  { niveau: 1, cout: { materiaux: {} }, secondesTrajet: 6, secondesChargement: 1, secondesVidage: 2, capacite: 15 }, // déjà dans la mine au départ
  { niveau: 2, cout: { argent: 1500, materiaux: { fer: 50, redstone: 10 } }, secondesTrajet: 4, secondesChargement: 0.8, secondesVidage: 1.6, capacite: 25 },
  { niveau: 3, cout: { argent: 7000, materiaux: { fer: 120, redstone: 40 } }, secondesTrajet: 2.8, secondesChargement: 0.6, secondesVidage: 1.2, capacite: 40 },
  { niveau: 4, cout: { argent: 25000, materiaux: { fer: 200, redstone: 100 } }, secondesTrajet: 2, secondesChargement: 0.5, secondesVidage: 0.9, capacite: 60 },
  { niveau: 5, cout: { argent: 80000, materiaux: { redstone: 200, or: 60 } }, secondesTrajet: 1.4, secondesChargement: 0.4, secondesVidage: 0.7, capacite: 90 },
  { niveau: 6, cout: { argent: 250000, materiaux: { or: 150, emeraude: 30 } }, secondesTrajet: 1, secondesChargement: 0.3, secondesVidage: 0.5, capacite: 130 },
]

// ---------------------------------------------------------------------------
// Les mineurs employés (dès le début, au bâtiment Personnel)
// ---------------------------------------------------------------------------

// Combien de mineurs on peut employer : 1 par niveau de la mine (23/10 : 1 au niveau 1, 5 au
// niveau 5 ; d'abord 2 puis 2 de plus par niveau, et avant, 4 au niveau 1, pousseurs compris).
// Les pousseurs ne comptent pas : on en embauche au plus un par trajet de wagonnet.
export const EMPLOYES_NIVEAU_1 = 1
export const EMPLOYES_PAR_NIVEAU = 1
// Le prix de la 1re, 2e, 3e... embauche (il dépend seulement du nombre de mineurs qu'on a).
// Au-delà de la liste, chaque embauche coûte 2,2 fois la précédente. (30/10 : les prix montent
// bien plus vite d'une embauche à l'autre, pour qu'il faille farmer. 23/10 : le 1er à 500 $, le
// 2e à 2 000 $... et ce sont deux listes à part : mineurs, et pousseurs. 23/10 bis : avec 1 mineur
// par niveau de la mine, chaque place vaut plus : 500, 3 500, 15 000, 45 000, 130 000 $.)
export const PRIX_EMBAUCHE = [500, 3500, 15000, 45000, 130000, 300000, 700000, 1500000, 3000000, 6000000]
// Les pousseurs : au plus un par trajet (4), leurs prix d'avant.
export const PRIX_EMBAUCHE_POUSSEUR = [500, 2000, 6000, 15000]
export const HAUSSE_APRES_LISTE = 2.2
// Licencier un mineur coûte des indemnités : 40 % du prix de sa place dans l'équipe.
export const PART_INDEMNITES = 0.4
// Le temps passé à vider son sac dans le coffre (ou à vendre au marché).
export const SECONDES_VIDAGE_EMPLOYE = 2
// (23/10) Le temps de charger la caisse de l'ascenseur au fond de la mine.
export const SECONDES_CHARGEMENT_ASCENSEUR = 1
// La caisse d'une vieille partie sans ascenseur (à l'échelle).
export const CAPACITE_ECHELLE = 20
export const NOMS_EMPLOYES = [
  'Raphaël', 'Moussa', 'Tom', 'Noah', 'Samy', 'Valou', 'Marion', 'Enya', 'Kaïnae',
  'Teo', 'Fredo', 'Satine', 'Nils', 'Arthur', 'Sasha', 'Florian', 'Khalil', 'Margot',
]

// Le salaire de 5 minutes d'un mineur, selon sa pioche (bois, pierre, fer, or, diamant) :
// environ 35 % de ce qu'il fait sortir de la mine (28/10 : paie toutes les 5 minutes, et plus
// chère ; avant, 25 % toutes les 10 minutes, c'était trop peu).
export const SECONDES_PAR_PAIE = 5 * 60
// (30/10 : bien plus cher, environ 40 % de ce qu'il fait sortir. 23/10 : les mineurs ne remontent
// plus et creusent bien plus : le salaire suit à peu près sa pioche, pour qu'une meilleure pioche
// rapporte toujours plus qu'elle ne coûte en salaire.)
export const SALAIRES = [220, 450, 850, 1400, 2200]

// L'équipement d'un mineur : une meilleure pioche le fait creuser plus vite. Son sac est le tas
// qu'il remplit au fond de la mine en attendant que la caisse de l'ascenseur passe le prendre
// (23/10) : plein, il attend la caisse. Payé en argent seulement.
export const NIVEAUX_EMPLOYE: { nom: string; vitesse: number; sac: number; cout: Cout }[] = [
  // (23/10 : le mineur en bois creuse 0,5 bloc/s, et il ne remonte plus : c'est l'ascenseur qui
  // fait les allers-retours)
  { nom: 'Bois', vitesse: 0.5, sac: 10, cout: { materiaux: {} } },
  { nom: 'Pierre', vitesse: 0.6, sac: 15, cout: { argent: 500, materiaux: {} } },
  { nom: 'Fer', vitesse: 0.75, sac: 20, cout: { argent: 3000, materiaux: {} } },
  { nom: 'Or', vitesse: 0.95, sac: 30, cout: { argent: 15000, materiaux: {} } },
  { nom: 'Diamant', vitesse: 1.2, sac: 45, cout: { argent: 60000, materiaux: {} } },
]

// --- La rareté des mineurs (avec le recruteur, dès le niveau 4 de la mine) ---
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
  rare: { id: 'rare', nom: 'Rare', rendement: 1.5, salaire: 1.4, couleur: '#4f9df0' },
  epique: { id: 'epique', nom: 'Épique', rendement: 2, salaire: 1.8, couleur: '#b06cf0' },
  legendaire: { id: 'legendaire', nom: 'Légendaire', rendement: 3, salaire: 2.5, couleur: '#f5a524' },
  mythique: { id: 'mythique', nom: 'Mythique', rendement: 5, salaire: 4, couleur: '#ff4d8d' },
}

export const LISTE_RARETES: IdRarete[] = ['commun', 'rare', 'epique', 'legendaire', 'mythique']

// --- Le recruteur (niveau 4 de la mine, avant le 23/10 : niveau 3) ---
export const NIVEAU_MINE_RECRUTEUR = 4
export const NIVEAUX_RECRUTEUR: { cout: Cout; chances: Record<IdRarete, number> }[] = [
  { cout: { argent: 10000, materiaux: {} }, chances: { commun: 65, rare: 20, epique: 10, legendaire: 4, mythique: 1 } },
  { cout: { argent: 25000, materiaux: {} }, chances: { commun: 60, rare: 22, epique: 11, legendaire: 5.5, mythique: 1.5 } },
  { cout: { argent: 50000, materiaux: {} }, chances: { commun: 55, rare: 23.5, epique: 12.5, legendaire: 7, mythique: 2 } },
  { cout: { argent: 100000, materiaux: {} }, chances: { commun: 50, rare: 25, epique: 14, legendaire: 8.5, mythique: 2.5 } },
]

// --- Le manager (niveau 3 de la mine, avant le 23/10 : niveau 4) : il paie les salaires avec la trésorerie ---
export const NIVEAU_MINE_MANAGER = 3
export const PRIX_MANAGER = 10000 // (23/10 ; avant 35 000 $)
export const SALAIRE_MANAGER = 400 // toutes les 5 minutes
export const SECONDES_AVANT_PAIE_MANAGER = 60
// (23/10) Jeu fermé, le manager ne paie les salaires que pendant un temps (30 minutes au départ) :
// l'améliorer l'allonge petit à petit. Jeu ouvert, il paie toujours.
export const NIVEAUX_MANAGER: { minutesHorsLigne: number; cout: Cout }[] = [
  { minutesHorsLigne: 30, cout: { materiaux: {} } },
  { minutesHorsLigne: 60, cout: { argent: 6000, materiaux: {} } },
  { minutesHorsLigne: 120, cout: { argent: 15000, materiaux: {} } },
  { minutesHorsLigne: 240, cout: { argent: 35000, materiaux: {} } },
  { minutesHorsLigne: 480, cout: { argent: 85000, materiaux: {} } },
]

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
// Le temps pour charger le wagonnet au coffre, et pour le vider au marché (avec un pousseur
// débutant, ou sans pousseur).
export const SECONDES_CHARGEMENT_WAGONNET = 2

// Les niveaux d'un pousseur (23/10), améliorés au Personnel : son wagonnet porte plus (× la
// taille des wagonnets) et il charge, décharge et vend plus vite. Payé en argent.
export type NiveauPousseur = { nom: string; places: number; secondesArret: number; cout: Cout }
export const NIVEAUX_POUSSEUR: NiveauPousseur[] = [
  { nom: 'Débutant', places: 1, secondesArret: 2, cout: { materiaux: {} } },
  { nom: 'Costaud', places: 1.25, secondesArret: 1.6, cout: { argent: 1000, materiaux: {} } },
  { nom: 'Robuste', places: 1.5, secondesArret: 1.2, cout: { argent: 5000, materiaux: {} } },
  { nom: 'Expert', places: 2, secondesArret: 0.8, cout: { argent: 20000, materiaux: {} } },
  { nom: 'Champion', places: 2.5, secondesArret: 0.5, cout: { argent: 60000, materiaux: {} } },
]
// Le salaire d'un pousseur toutes les 5 minutes, selon son niveau (il ne creuse pas : moins cher
// qu'un mineur avec la même pioche).
export const SALAIRES_POUSSEUR = [220, 300, 420, 600, 850]

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
// Le wagonnet de la redstone remplit le générateur jusqu'à cette réserve (en secondes de marche) :
// 60 redstones. Celui du charbon remplit le réservoir de la foreuse (voir NIVEAUX_FORAGE).
export const RESERVE_GENERATEUR_WAGONNET = 1800

// La taille des wagonnets (au bâtiment Mine) : elle vaut pour tous les trajets.
export const NIVEAUX_WAGONNET: { capacite: number; cout: Cout }[] = [
  { capacite: 40, cout: { materiaux: {} } },
  { capacite: 100, cout: { argent: 1200, materiaux: { fer: 60 } } },
  { capacite: 250, cout: { argent: 6000, materiaux: { fer: 150, redstone: 40 } } },
  { capacite: 600, cout: { argent: 25000, materiaux: { or: 80 } } },
]

// ---------------------------------------------------------------------------
// Le générateur (niveau 2 de la mine) : de l'électricité dans un rayon
// ---------------------------------------------------------------------------

// Il brûle de la redstone : 1 redstone = 30 secondes de courant. Il ACCÉLÈRE ce qui est dans son
// rayon (un cercle autour de lui, en cases), d'un bonus raisonnable (23/10 : avant, jusqu'à × 3,
// c'était trop fort) :
//   - l'ascenseur de la mine (si la mine est dans le rayon) : ses trajets sont plus courts ;
//   - les rails (un trajet dont toutes les cases sont dans le rayon) : son pousseur pousse le
//     wagonnet plus vite (il le pousse toujours : il ne roule plus tout seul) ;
//   - la foreuse : elle fore plus vite.
export const SECONDES_PAR_REDSTONE = 30
export const NIVEAUX_GENERATEUR: { rayon: number; bonus: number; cout: Cout }[] = [
  { rayon: 15, bonus: 0.3, cout: { materiaux: {} } },
  { rayon: 20, bonus: 0.4, cout: { argent: 7500, materiaux: { fer: 120, redstone: 60 } } },
  { rayon: 26, bonus: 0.5, cout: { argent: 20000, materiaux: { fer: 220, redstone: 120 } } },
  { rayon: 33, bonus: 0.6, cout: { argent: 50000, materiaux: { fer: 350, redstone: 220 } } },
  { rayon: 40, bonus: 0.75, cout: { argent: 120000, materiaux: { fer: 550, redstone: 420 } } },
]
// À partir de ce niveau (le 2e), le générateur peut puiser la redstone dans le coffre de la mine.
export const NIVEAU_GENERATEUR_AUTO = 1
// Il garde au plus 5 minutes de redstone d'avance quand il se sert dans le coffre.
export const RESERVE_GENERATEUR_AUTO = 300

// ---------------------------------------------------------------------------
// La foreuse (niveau 2 de la mine) : au charbon, plus rapide sous électricité
// ---------------------------------------------------------------------------

export const SECONDES_PAR_CHARBON = 20

// Chaque niveau de forage la rend plus rapide et agrandit son réservoir : le charbon qu'elle peut
// garder au plus (28/10). Le wagonnet du charbon la remplit jusque-là, et met le reste dans son chariot.
export const NIVEAUX_FORAGE: { vitesse: number; reservoir: number; cout: Cout }[] = [
  { vitesse: 0.5, reservoir: 40, cout: { materiaux: {} } },
  { vitesse: 0.8, reservoir: 60, cout: { argent: 3500, materiaux: { fer: 50, redstone: 20 } } },
  { vitesse: 1.2, reservoir: 90, cout: { argent: 10000, materiaux: { fer: 100, redstone: 50 } } },
  { vitesse: 1.8, reservoir: 130, cout: { argent: 25000, materiaux: { fer: 160, redstone: 100 } } },
  { vitesse: 2.6, reservoir: 180, cout: { argent: 60000, materiaux: { redstone: 160, or: 50 } } },
  { vitesse: 3.6, reservoir: 250, cout: { argent: 150000, materiaux: { or: 100, emeraude: 25 } } },
]

export const NIVEAUX_CHARIOT: { capacite: number; cout: Cout }[] = [
  { capacite: 200, cout: { materiaux: {} } },
  { capacite: 400, cout: { argent: 2500, materiaux: { fer: 40 } } },
  { capacite: 800, cout: { argent: 7500, materiaux: { fer: 80, redstone: 25 } } },
  { capacite: 1600, cout: { argent: 20000, materiaux: { fer: 150, redstone: 70 } } },
  { capacite: 3000, cout: { argent: 50000, materiaux: { redstone: 130, or: 40 } } },
  { capacite: 6000, cout: { argent: 120000, materiaux: { or: 90, emeraude: 20 } } },
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
    cout: { argent: 20, materiaux: { pierre: 10 } },
  },
  bazar: {
    id: 'bazar',
    nom: 'Bazar',
    emoji: '🎒',
    description: 'Sacs à dos.',
    taille: 5,
    porte: 'droite',
    niveauMine: 1,
    cout: { argent: 200, materiaux: { pierre: 40 } },
  },
  employes: {
    id: 'employes',
    nom: 'Personnel',
    emoji: '👷',
    description: 'Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires.',
    taille: 5,
    porte: 'droite',
    niveauMine: 1,
    cout: { argent: 150, materiaux: { pierre: 30 } },
  },
  foreuse: {
    id: 'foreuse',
    nom: 'Foreuse',
    emoji: '⚙️',
    description: 'Elle creuse toute seule avec du charbon, et plus vite avec de l’électricité.',
    taille: 5,
    porte: 'gauche',
    niveauMine: 2,
    cout: { argent: 3000, materiaux: { pierre: 120, fer: 60 } },
  },
  generateur: {
    id: 'generateur',
    nom: 'Générateur',
    emoji: '⚡',
    description: 'Il brûle de la redstone et électrifie tout ce qui est dans son rayon : rails et foreuse.',
    taille: 5,
    porte: 'droite',
    niveauMine: 2,
    cout: { argent: 4000, materiaux: { fer: 100, redstone: 40 } },
  },
}
// L'ordre du menu « Bâtiments », celui où ils se débloquent (29/10). La mine est déjà posée au début.
// L'ordre du menu « Bâtiments » (la mine est déjà posée au début de la partie). (dans l'ordre où ils se débloquent, 29/10)
export const LISTE_BATIMENTS: IdBatiment[] = ['marche', 'forgeron', 'employes', 'bazar', 'foreuse', 'generateur']

// Les chemins de pavés : seulement pour faire joli (5 $ la case).
export const COUT_CHEMIN: Cout = { argent: 5, materiaux: {} }

// Les vitesses au village, en cases par seconde (à pied).
// (les mineurs : 2,5 depuis le 27/10, pour qu'on les voie bien marcher ; avant 4)
export const VITESSE_MARCHE = 2.5
// Le joueur marche un peu plus vite que ses mineurs (c'est lui le patron).
export const VITESSE_JOUEUR = 7.5 // (27/10 : 1,5 fois plus vite qu'avant)
// Un mineur dont on a amélioré la pioche passe 3 s à la forge pour la récupérer.
export const SECONDES_FORGE_EMPLOYE = 3

// Les dessins du décor (fleurs, rochers, tonneaux, arbres...) : on ne les achète plus (27/10),
// mais ils ornent la plage et le village de l'écran d'accueil.
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
  taille: 1 | 2 // en cases
}

export const DECORATIONS: Record<IdDecoration, InfoDecoration> = {
  'fleurs-rouges': { id: 'fleurs-rouges', nom: 'Fleurs rouges', taille: 1 },
  'fleurs-jaunes': { id: 'fleurs-jaunes', nom: 'Fleurs jaunes', taille: 1 },
  'fleurs-violettes': { id: 'fleurs-violettes', nom: 'Fleurs violettes', taille: 1 },
  buisson: { id: 'buisson', nom: 'Buisson', taille: 1 },
  rocher: { id: 'rocher', nom: 'Rocher', taille: 1 },
  tonneau: { id: 'tonneau', nom: 'Tonneau', taille: 1 },
  caisse: { id: 'caisse', nom: 'Caisse de minerais', taille: 1 },
  lanterne: { id: 'lanterne', nom: 'Lanterne', taille: 1 },
  banc: { id: 'banc', nom: 'Banc', taille: 1 },
  arbre: { id: 'arbre', nom: 'Grand arbre', taille: 2 },
  sapin: { id: 'sapin', nom: 'Sapin', taille: 2 },
  cerisier: { id: 'cerisier', nom: 'Cerisier en fleurs', taille: 2 },
  fontaine: { id: 'fontaine', nom: 'Fontaine', taille: 2 },
  statue: { id: 'statue', nom: 'Statue du hamster d’or', taille: 2 },
}

// ---------------------------------------------------------------------------
// Le niveau du joueur (29/10) : l'expérience (XP) et ce qu'elle débloque
// ---------------------------------------------------------------------------

// Ce qui rapporte de l'XP : chaque bloc cassé en cliquant, chaque bâtiment posé, chaque case de
// rails, chaque trajet de wagonnet créé, chaque embauche, chaque amélioration... Une chose ne
// rapporte qu'une fois : retirer un rail et le reposer, ou licencier puis réembaucher, ne
// redonne rien (voir niveaux.ts).
export const XP_PAR = {
  bloc: 1, // un bloc cassé à la main
  batiment: 40,
  rail: 3, // une case de rails
  trajet: 30, // un trajet de wagonnet automatisé
  embauche: 25, // un mineur ou un pousseur embauché
  amelioration: 30, // un niveau de n'importe quelle amélioration (coffre, pioche, sac, ascenseur...)
  niveauMine: 150, // descendre la mine d'un niveau
  voyage: 3, // un aller-retour de wagonnet (un peu d'XP pendant qu'on ne clique pas)
}

// L'XP qu'il faut pour passer du niveau n au niveau n + 1 : de plus en plus.
// 60 pour passer au niveau 2, 210 pour le 3, 430 pour le 4... environ 13 000 pour le 21.
export function xpPourPasser(niveau: number): number {
  return Math.round((60 * niveau ** 1.8) / 10) * 10
}

export const NIVEAU_JOUEUR_MAX = 30

// Le niveau du joueur qu'il faut pour chaque chose. Les tableaux suivent ceux des données :
// la case i est le niveau qu'il faut pour acheter NIVEAUX_COFFRE[i], PIOCHES[i], etc. (la case 0
// est ce qu'on a au départ). Une fois débloqué, il faut quand même payer.
export const NIVEAU_JOUEUR_POUR = {
  batiments: { puits: 1, marche: 1, forgeron: 1, employes: 2, bazar: 3, foreuse: 5, generateur: 6 } as Record<IdBatiment, number>, // (30/10 : la foreuse avant le générateur)
  rails: 3, // poser des rails (et donc créer des trajets de wagonnets)
  mine: [1, 4, 7, 10, 13], // NIVEAUX_MINE
  coffre: [1, 2, 5, 8, 12], // NIVEAUX_COFFRE
  pioches: [1, 4, 7, 12], // PIOCHES
  sacs: [1, 3, 5, 8, 11, 14, 15], // SACS
  ascenseur: [1, 5, 8, 10, 13, 15], // NIVEAUX_ASCENSEUR (le 1er est dans la mine dès le début)
  equipement: [1, 4, 6, 9, 12], // NIVEAUX_EMPLOYE (la pioche des mineurs)
  pousseur: [1, 5, 8, 11, 14], // NIVEAUX_POUSSEUR (23/10)
  wagonnet: [1, 6, 9, 12], // NIVEAUX_WAGONNET
  generateur: [1, 8, 10, 13, 15], // NIVEAUX_GENERATEUR
  forage: [1, 6, 9, 11, 14, 15], // NIVEAUX_FORAGE
  chariot: [1, 6, 9, 11, 14, 15], // NIVEAUX_CHARIOT
  recruteur: [11, 12, 13, 15], // NIVEAUX_RECRUTEUR (23/10 : après le manager, avec la mine niveau 4)
  manager: 9, // (23/10 : avant le recruteur, avec la mine niveau 3)
  tempsManager: [9, 11, 12, 13, 14], // NIVEAUX_MANAGER (23/10)
}
