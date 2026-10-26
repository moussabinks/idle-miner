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
// (26/10, la grande mise à jour des gemmes) Deux gemmes de plus : le saphir (niveau 5 de la mine)
// et le rubis (niveau 6) ; le diamant reste le plus rare (niveau 7). Et ce que fabriquent les
// nouveaux bâtiments : les lingots (la fonderie fond le fer et l'or) et les bijoux (la joaillerie
// taille les gemmes). Ce ne sont pas des blocs de la mine, mais ils se rangent, se transportent et
// se vendent comme eux : c'est pourquoi ils sont dans la même liste.
export type IdBloc =
  | 'pierre'
  | 'charbon'
  | 'fer'
  | 'redstone'
  | 'or'
  | 'emeraude'
  | 'saphir'
  | 'rubis'
  | 'diamant'
  | 'lingot_fer'
  | 'lingot_or'
  | 'bijou_emeraude'
  | 'bijou_saphir'
  | 'bijou_rubis'
  | 'bijou_diamant'

// « bloc » : ce qui sort de la mine ; « lingot » : de la fonderie ; « bijou » : de la joaillerie.
export type SorteObjet = 'bloc' | 'lingot' | 'bijou'

export type TypeBloc = {
  id: IdBloc
  nom: string
  emoji: string
  prix: number // prix de vente au marché, en $
  minerai: boolean // true = une bonne pioche peut le doubler
  dur: boolean // un bloc dur fait un bruit plus lourd quand il casse
  sorte: SorteObjet
}

// (26/10) Un lingot vaut 2 fois son minerai, un bijou 2,5 fois sa gemme (voir la fonderie et la
// joaillerie plus bas) : de quoi rapporter bien plus, sans casser l'économie (il faut du charbon,
// des joailliers payés, et du temps).
export const BLOCS: Record<IdBloc, TypeBloc> = {
  pierre: { id: 'pierre', nom: 'Pierre', emoji: '🪨', prix: 1, minerai: false, dur: false, sorte: 'bloc' },
  charbon: { id: 'charbon', nom: 'Charbon', emoji: '⚫', prix: 5, minerai: true, dur: true, sorte: 'bloc' },
  fer: { id: 'fer', nom: 'Fer', emoji: '🔩', prix: 12, minerai: true, dur: true, sorte: 'bloc' },
  redstone: { id: 'redstone', nom: 'Redstone', emoji: '🔴', prix: 15, minerai: true, dur: true, sorte: 'bloc' },
  or: { id: 'or', nom: 'Or', emoji: '🟡', prix: 35, minerai: true, dur: true, sorte: 'bloc' },
  emeraude: { id: 'emeraude', nom: 'Émeraude', emoji: '💚', prix: 80, minerai: true, dur: true, sorte: 'bloc' },
  saphir: { id: 'saphir', nom: 'Saphir', emoji: '🔷', prix: 120, minerai: true, dur: true, sorte: 'bloc' },
  rubis: { id: 'rubis', nom: 'Rubis', emoji: '🔺', prix: 170, minerai: true, dur: true, sorte: 'bloc' },
  diamant: { id: 'diamant', nom: 'Diamant', emoji: '💎', prix: 240, minerai: true, dur: true, sorte: 'bloc' },
  lingot_fer: { id: 'lingot_fer', nom: 'Lingot de fer', emoji: '⬜', prix: 24, minerai: false, dur: true, sorte: 'lingot' },
  lingot_or: { id: 'lingot_or', nom: 'Lingot d’or', emoji: '🟨', prix: 70, minerai: false, dur: true, sorte: 'lingot' },
  bijou_emeraude: { id: 'bijou_emeraude', nom: 'Collier d’émeraude', emoji: '📿', prix: 200, minerai: false, dur: true, sorte: 'bijou' },
  bijou_saphir: { id: 'bijou_saphir', nom: 'Pendentif de saphir', emoji: '🧿', prix: 300, minerai: false, dur: true, sorte: 'bijou' },
  bijou_rubis: { id: 'bijou_rubis', nom: 'Couronne de rubis', emoji: '🫅', prix: 425, minerai: false, dur: true, sorte: 'bijou' },
  bijou_diamant: { id: 'bijou_diamant', nom: 'Bague de diamant', emoji: '💍', prix: 600, minerai: false, dur: true, sorte: 'bijou' },
}

export const LISTE_BLOCS = Object.keys(BLOCS) as IdBloc[]

// Les minerais « rares » (un son brillant et une petite fête quand on en trouve).
export const MINERAIS_RARES: IdBloc[] = ['or', 'emeraude', 'saphir', 'rubis', 'diamant']

// (26/10) Ce que fond la fonderie, et ce que taille la joaillerie : le minerai (ou la gemme) → ce
// qu'il devient. Les autres objets ne sont pas acceptés.
export const LINGOT_DE: Partial<Record<IdBloc, IdBloc>> = { fer: 'lingot_fer', or: 'lingot_or' }
export const BIJOU_DE: Partial<Record<IdBloc, IdBloc>> = { emeraude: 'bijou_emeraude', saphir: 'bijou_saphir', rubis: 'bijou_rubis', diamant: 'bijou_diamant' }

// Le prix d'un achat : de l'argent, et des minerais (pris dans le coffre de la mine).
export type Cout = { argent?: number; materiaux: Partial<Record<IdBloc, number>> }

// ---------------------------------------------------------------------------
// La mine : 7 niveaux (26/10 ; 5 avant)
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

// (25/10, la grande mise à jour) Chaque niveau de la mine est un PALIER : descendre au niveau N
// permet d'améliorer TOUT le reste (coffre, ascenseur, pioches, mineurs, foreuse, générateur,
// pousseurs...) jusqu'à son niveau N. Tout a 5 niveaux, comme la mine : on progresse par paliers.
// Au niveau 1, la mine sort déjà un peu de blocs toute seule (avant : rien), pour que le jeu
// tourne tout seul dès la première minute.
export const NIVEAUX_MINE: NiveauMine[] = [
  { niveau: 1, nom: 'Galerie de surface', poids: { pierre: 70, charbon: 18, fer: 12 }, debit: 0.2, cout: { materiaux: {} } },
  { niveau: 2, nom: 'Veine de redstone', poids: { pierre: 60, charbon: 16, fer: 14, redstone: 10 }, debit: 0.3, cout: { argent: 800, materiaux: { fer: 40 } } },
  { niveau: 3, nom: 'Filon d’or', poids: { pierre: 52, charbon: 14, fer: 14, redstone: 12, or: 8 }, debit: 0.4, cout: { argent: 6000, materiaux: { fer: 100, redstone: 40 } } },
  {
    niveau: 4,
    nom: 'Grotte aux émeraudes',
    poids: { pierre: 46, charbon: 12, fer: 13, redstone: 12, or: 11, emeraude: 6 },
    debit: 0.5,
    cout: { argent: 22000, materiaux: { redstone: 100, or: 50 } },
  },
  // (26/10) Le saphir au niveau 5, le rubis au 6 : le diamant reste le plus rare, tout au fond (7).
  // Une partie qui était au niveau 5 (« Cœur de diamant ») y reste : il devient la Caverne de
  // saphir, et ses diamants deviennent des saphirs (voir convertirVersion29).
  {
    niveau: 5,
    nom: 'Caverne de saphir',
    poids: { pierre: 40, charbon: 11, fer: 12, redstone: 12, or: 12, emeraude: 8, saphir: 5 },
    debit: 0.6,
    cout: { argent: 80000, materiaux: { or: 90, emeraude: 35 } },
  },
  {
    niveau: 6,
    nom: 'Veine de rubis',
    poids: { pierre: 36, charbon: 10, fer: 12, redstone: 11, or: 12, emeraude: 9, saphir: 7, rubis: 5 },
    debit: 0.7,
    cout: { argent: 260000, materiaux: { emeraude: 80, saphir: 40 } },
  },
  {
    niveau: 7,
    nom: 'Cœur de diamant',
    poids: { pierre: 32, charbon: 10, fer: 11, redstone: 11, or: 12, emeraude: 9, saphir: 8, rubis: 7, diamant: 5 },
    debit: 0.8,
    cout: { argent: 800000, materiaux: { saphir: 80, rubis: 50 } },
  },
]

// Le nombre de niveaux de TOUTES les améliorations (25/10) : le même que la mine (26/10 : 7).
export const NIVEAUX_PAR_AMELIORATION = 7

export const NIVEAU_MINE_MAX = NIVEAUX_MINE.length

// Le coffre de la mine : tout ce qui sort de la mine y est rangé (clics, mine toute seule,
// mineurs). Quand il est plein, la mine s'arrête. On l'agrandit au bâtiment Mine.
export const NIVEAUX_COFFRE: { capacite: number; cout: Cout }[] = [
  { capacite: 100, cout: { materiaux: {} } },
  { capacite: 300, cout: { argent: 200, materiaux: { pierre: 40 } } },
  { capacite: 800, cout: { argent: 2000, materiaux: { fer: 80 } } },
  { capacite: 2000, cout: { argent: 6000, materiaux: { redstone: 60, or: 20 } } },
  { capacite: 5000, cout: { argent: 18000, materiaux: { or: 60, emeraude: 20 } } },
  { capacite: 10000, cout: { argent: 50000, materiaux: { emeraude: 40, saphir: 30 } } },
  { capacite: 20000, cout: { argent: 150000, materiaux: { saphir: 50, rubis: 30 } } },
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
    cout: { argent: 300, materiaux: { fer: 20 } },
    reparation: { argent: 30, materiaux: { fer: 5 } },
    couleur: '#e6e6e6',
  },
  {
    niveau: 2,
    nom: 'Or',
    emoji: '🟡',
    doublement: 0.3,
    durabilite: 500,
    cout: { argent: 2500, materiaux: { or: 30 } },
    reparation: { argent: 150, materiaux: { or: 5 } },
    couleur: '#f4c518',
  },
  // (23/10) La pioche en émeraude, avec la mine d'émeraude (niveau 4 de la mine, niveau 10 du
  // joueur) : entre l'or et le diamant. Chaque pioche double un minerai un peu plus souvent.
  {
    niveau: 3,
    nom: 'Émeraude',
    emoji: '💚',
    doublement: 0.38,
    durabilite: 750,
    cout: { argent: 6000, materiaux: { emeraude: 25 } },
    reparation: { argent: 300, materiaux: { emeraude: 4 } },
    couleur: '#2ee07a',
  },
  // (26/10) La pioche du niveau 4 est en saphir (avant : en diamant, qui n'arrive plus qu'au
  // niveau 7 de la mine). Une partie qui avait la pioche en diamant a donc maintenant celle en
  // saphir, au même niveau.
  {
    niveau: 4,
    nom: 'Saphir',
    emoji: '🔷',
    doublement: 0.45,
    durabilite: 1000,
    cout: { argent: 15000, materiaux: { saphir: 15 } },
    reparation: { argent: 600, materiaux: { saphir: 3 } },
    couleur: '#3a66e0',
  },
  {
    niveau: 5,
    nom: 'Rubis',
    emoji: '🔺',
    doublement: 0.52,
    durabilite: 1300,
    cout: { argent: 45000, materiaux: { rubis: 15 } },
    reparation: { argent: 1500, materiaux: { rubis: 3 } },
    couleur: '#e8304f',
  },
  {
    niveau: 6,
    nom: 'Diamant',
    emoji: '💎',
    doublement: 0.6,
    durabilite: 1700,
    cout: { argent: 130000, materiaux: { diamant: 15 } },
    reparation: { argent: 4000, materiaux: { diamant: 3 } },
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

// (25/10) Plus de sac à dos ni de bazar : on vend le coffre directement depuis la mine, au
// prix du marché. Le marché ne sert plus qu'à automatiser (le wagonnet y vend tout seul).

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

// (25/10) 5 niveaux, comme tout le reste (avant : 10). Son débit (capacité ÷ aller-retour) suit
// ce que creusent les mineurs d'un palier à l'autre : 1 ; 2,1 ; 4,3 ; 8,6 ; 17 blocs/s.
export const NIVEAUX_ASCENSEUR: NiveauAscenseur[] = [
  { niveau: 1, cout: { materiaux: {} }, secondesTrajet: 6, secondesChargement: 1, secondesVidage: 2, capacite: 15 }, // déjà dans la mine au départ
  { niveau: 2, cout: { argent: 700, materiaux: { fer: 30 } }, secondesTrajet: 4.5, secondesChargement: 0.9, secondesVidage: 1.8, capacite: 25 },
  { niveau: 3, cout: { argent: 3000, materiaux: { fer: 90, redstone: 30 } }, secondesTrajet: 3.5, secondesChargement: 0.8, secondesVidage: 1.5, capacite: 40 },
  { niveau: 4, cout: { argent: 8000, materiaux: { redstone: 100, or: 40 } }, secondesTrajet: 2.6, secondesChargement: 0.6, secondesVidage: 1.2, capacite: 60 },
  { niveau: 5, cout: { argent: 22000, materiaux: { or: 80, emeraude: 30 } }, secondesTrajet: 2, secondesChargement: 0.4, secondesVidage: 0.8, capacite: 90 },
  // (26/10) Deux niveaux de plus : 31 puis 51 blocs/s.
  { niveau: 6, cout: { argent: 60000, materiaux: { or: 120, saphir: 30 } }, secondesTrajet: 1.6, secondesChargement: 0.35, secondesVidage: 0.7, capacite: 130 },
  { niveau: 7, cout: { argent: 180000, materiaux: { saphir: 60, rubis: 30 } }, secondesTrajet: 1.3, secondesChargement: 0.3, secondesVidage: 0.6, capacite: 180 },
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
// (25/10) Le premier mineur ne coûte presque rien : le jeu doit tourner tout seul en 2 minutes.
export const PRIX_EMBAUCHE = [50, 800, 3000, 8000, 20000, 45000, 100000, 220000, 500000, 1000000]
// Les pousseurs : au plus un par trajet (26/10 : 10 trajets possibles avec la fonderie et la joaillerie).
export const PRIX_EMBAUCHE_POUSSEUR = [300, 1000, 2500, 5000, 9000, 15000, 25000, 40000, 60000, 90000]
export const HAUSSE_APRES_LISTE = 2.2
// Licencier un mineur coûte des indemnités : 40 % du prix de sa place dans l'équipe.
export const PART_INDEMNITES = 0.4
// (23/10) Remplacer un mineur avec le recruteur (une nouvelle recrue, même pioche, même place) :
// le quart du prix de la dernière place des mineurs, sans indemnités.
export const PART_REMPLACEMENT = 0.25
// (23/10) Et au moins 200 $ × (niveau du joueur)² : 24 200 $ au niveau 11 (le recruteur),
// 33 800 $ au niveau 13, 45 000 $ au niveau 15. Avant, ça ne coûtait presque rien.
export const PRIX_REMPLACEMENT_PAR_NIVEAU = 200
// Le temps passé à vider son sac dans le coffre (ou à vendre au marché).
export const SECONDES_VIDAGE_EMPLOYE = 2
// (23/10) Le temps de charger la caisse de l'ascenseur au fond de la mine.
export const SECONDES_CHARGEMENT_ASCENSEUR = 1
// La caisse d'une vieille partie sans ascenseur (à l'échelle).
export const CAPACITE_ECHELLE = 20
export const NOMS_EMPLOYES = [
  'Raphaël', 'Moussa', 'Tom', 'Noah', 'Samy', 'Valou', 'Marion', 'Enya', 'Kaïnae',
  'Teo', 'Fredo', 'Satine', 'Nils', 'Arthur', 'Sasha', 'Florian', 'Khalil', 'Margot', 'Romain', 'Dodo', 'Guewen',
]
// (25/10) En anglais, les mêmes employés portent des prénoms anglais parmi les plus donnés à la
// génération Z (au même rang que leur prénom français : Raphaël → Liam, Moussa → Olivia...). La
// partie garde toujours le prénom français ; seul l'affichage change (nomEmploye, langue.ts).
export const NOMS_EMPLOYES_EN = [
  'Liam', 'Olivia', 'Jacob', 'Emma', 'Ethan', 'Ava', 'Mason', 'Sophia', 'Chloe',
  'Logan', 'Jayden', 'Madison', 'Aiden', 'Tyler', 'Mia', 'Caleb', 'Josh', 'Abigail', 'Dylan', 'Harper', 'Brandon',
]

// Le salaire de 5 minutes d'un mineur, selon sa pioche (bois, pierre, fer, or, émeraude, diamant) :
// environ 35 % de ce qu'il fait sortir de la mine (28/10 : paie toutes les 5 minutes, et plus
// chère ; avant, 25 % toutes les 10 minutes, c'était trop peu).
export const SECONDES_PAR_PAIE = 5 * 60
// (30/10 : bien plus cher, environ 40 % de ce qu'il fait sortir. 23/10 : les mineurs ne remontent
// plus et creusent bien plus : le salaire suit à peu près sa pioche, pour qu'une meilleure pioche
// rapporte toujours plus qu'elle ne coûte en salaire.)
// (23/10) Le niveau de la mine qu'il faut pour chaque pioche des mineurs (bois, pierre, fer, or,
// émeraude, diamant) : pas de pioche en diamant avant la mine de diamant.
// (25/10) Le salaire suit sa pioche (bois, fer, or, émeraude, diamant) : environ 30 % de ce
// qu'il fait sortir de la mine.
// (26/10) 7 pioches : bois, fer, or, émeraude, saphir, rubis, diamant.
export const SALAIRES = [120, 300, 700, 1300, 2600, 4500, 7500]

// L'équipement d'un mineur : une meilleure pioche le fait creuser plus vite. Son sac est le tas
// qu'il remplit au fond de la mine en attendant que la caisse de l'ascenseur passe le prendre
// (23/10) : plein, il attend la caisse. Payé en argent seulement.
// (25/10) 5 niveaux comme tout le reste : bois, fer, or, émeraude, diamant.
export const NIVEAUX_EMPLOYE: { nom: string; vitesse: number; sac: number; cout: Cout }[] = [
  { nom: 'Bois', vitesse: 0.5, sac: 10, cout: { materiaux: {} } },
  { nom: 'Fer', vitesse: 0.75, sac: 18, cout: { argent: 400, materiaux: {} } },
  { nom: 'Or', vitesse: 1, sac: 28, cout: { argent: 2500, materiaux: {} } },
  { nom: 'Émeraude', vitesse: 1.3, sac: 40, cout: { argent: 7000, materiaux: {} } },
  // (26/10) La pioche du niveau 4 devient en saphir (un mineur qui avait celle en diamant a donc
  // maintenant celle en saphir) ; puis le rubis et le diamant.
  { nom: 'Saphir', vitesse: 1.7, sac: 55, cout: { argent: 18000, materiaux: {} } },
  { nom: 'Rubis', vitesse: 2.2, sac: 75, cout: { argent: 45000, materiaux: {} } },
  { nom: 'Diamant', vitesse: 2.8, sac: 100, cout: { argent: 120000, materiaux: {} } },
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

// --- Le recruteur (niveau 4 de la mine) ---
// (25/10) Les chefs (recruteur, manager) ont 3 niveaux : on les embauche à un palier de la mine,
// puis chaque palier suivant débloque leur niveau suivant (voir PALIER_CHEF).
export const NIVEAU_MINE_RECRUTEUR = 4
export const NIVEAUX_RECRUTEUR: { cout: Cout; chances: Record<IdRarete, number> }[] = [
  { cout: { argent: 10000, materiaux: {} }, chances: { commun: 65, rare: 20, epique: 10, legendaire: 4, mythique: 1 } },
  { cout: { argent: 40000, materiaux: {} }, chances: { commun: 57, rare: 23, epique: 12, legendaire: 6, mythique: 2 } },
  { cout: { argent: 140000, materiaux: {} }, chances: { commun: 50, rare: 25, epique: 14, legendaire: 8, mythique: 3 } },
]

// --- Le manager (niveau 3 de la mine, avant le 23/10 : niveau 4) : il paie les salaires avec l'argent du joueur (23/10 : plus de trésorerie) ---
export const NIVEAU_MINE_MANAGER = 3
export const PRIX_MANAGER = 5000
export const SALAIRE_MANAGER = 400 // toutes les 5 minutes
export const SECONDES_AVANT_PAIE_MANAGER = 60
// (23/10) La fatigue : le manager ne reste éveillé que « minutesEveil » (15 min au niveau 1),
// jeu ouvert comme jeu fermé ; puis il s'endort et ne paie plus personne, jusqu'à ce que le joueur
// le réveille au Personnel. On ne peut donc pas laisser le jeu tourner tout seul à l'infini.
// L'améliorer le garde éveillé plus longtemps.
// (25/10) 3 niveaux : 30 min, 1 h, puis 2 h éveillé.
export const NIVEAUX_MANAGER: { minutesEveil: number; cout: Cout }[] = [
  { minutesEveil: 30, cout: { materiaux: {} } },
  { minutesEveil: 60, cout: { argent: 25000, materiaux: {} } },
  { minutesEveil: 120, cout: { argent: 90000, materiaux: {} } },
]

// (25/10) Le palier de la mine qu'il faut pour chaque niveau d'un chef (case 0 : l'embauche).
// (26/10) Leur dernier niveau arrive au niveau 6 de la mine (la mine en a 7 maintenant).
export const PALIER_CHEF = { manager: [3, 5, 6], recruteur: [4, 5, 6] }

// ---------------------------------------------------------------------------
// Les rails et le wagonnet
// ---------------------------------------------------------------------------

// Les rails se paient en fer (dès le début). Il faut une ligne continue de la mine au marché :
// alors le wagonnet peut porter le coffre au marché. Sans électricité, on le pousse (toi au
// début, puis un pousseur embauché pour ce trajet) ; avec le générateur, le pousseur va plus vite.
export const COUT_RAIL: Cout = { materiaux: { fer: 3 } }
// Les vitesses, en cases par seconde.
export const VITESSE_POUSSE_JOUEUR = 3
export const VITESSE_POUSSE_MINEUR = 2.5
// Le temps pour charger le wagonnet au départ, et pour le vider (ou vendre) à l'arrivée : toujours
// 1 seconde (23/10).
export const SECONDES_CHARGEMENT_WAGONNET = 1

// (23/10) Chaque pousseur a deux améliorations, au Personnel :
//   - sa VITESSE (NIVEAUX_POUSSEUR, payée en argent) : il pousse son wagonnet plus vite ;
//   - son CHARIOT (NIVEAUX_CHARIOT_POUSSEUR, argent et fer, de plus en plus cher) : son wagonnet
//     porte plus. Il n'y a plus de « taille des wagonnets » pour tous les trajets.
export type NiveauPousseur = { nom: string; vitesse: number; cout: Cout }
// (23/10, bis) Bien plus cher, et × le niveau du joueur (voir PRIX_POUSSEUR_PAR_NIVEAU) : sinon on
// achetait tout tout de suite et les chariots n'étaient jamais pleins.
export const NIVEAUX_POUSSEUR: NiveauPousseur[] = [
  { nom: 'Débutant', vitesse: 1, cout: { materiaux: {} } },
  { nom: 'Costaud', vitesse: 1.2, cout: { argent: 600, materiaux: {} } },
  { nom: 'Robuste', vitesse: 1.4, cout: { argent: 2000, materiaux: {} } },
  { nom: 'Expert', vitesse: 1.65, cout: { argent: 5000, materiaux: {} } },
  { nom: 'Champion', vitesse: 1.9, cout: { argent: 12000, materiaux: {} } },
  { nom: 'Maître', vitesse: 2.2, cout: { argent: 30000, materiaux: {} } },
  { nom: 'Légende', vitesse: 2.6, cout: { argent: 70000, materiaux: {} } },
]
// Les places du chariot d'un pousseur (à peu près ce que la mine et ses mineurs sortent pendant un
// aller-retour d'environ 15 s : il suit tout juste, il faut l'agrandir quand on produit plus).
// Sans pousseur (le joueur pousse), c'est le premier : 20 places.
// (23/10, bis) Des marches plus petites et bien plus chères (× le niveau du joueur) : le chariot doit
// rester tout juste à la hauteur de ce que sortent la mine ou la foreuse.
export const NIVEAUX_CHARIOT_POUSSEUR: { places: number; cout: Cout }[] = [
  { places: 20, cout: { materiaux: {} } },
  { places: 40, cout: { argent: 800, materiaux: { fer: 40 } } },
  { places: 70, cout: { argent: 2500, materiaux: { fer: 100 } } },
  { places: 110, cout: { argent: 6000, materiaux: { fer: 200 } } },
  { places: 170, cout: { argent: 15000, materiaux: { fer: 400 } } },
  // (26/10, demandé par le propriétaire) Du minerai de fer, comme les autres (un temps, des lingots).
  { places: 260, cout: { argent: 40000, materiaux: { fer: 700 } } },
  { places: 400, cout: { argent: 110000, materiaux: { fer: 1100 } } },
]
// (23/10) Le salaire d'un pousseur toutes les 5 minutes : une base, plus un peu pour chaque niveau
// de vitesse et chaque niveau de chariot (× sa rareté) : 400 $ au départ, jusqu'à 2 600 $ au
// maximum. Avant : 220 à 850 $ selon son niveau seulement, presque rien.
export const SALAIRE_POUSSEUR_BASE = 400
export const SALAIRE_POUSSEUR_PAR_VITESSE = 250
export const SALAIRE_POUSSEUR_PAR_CHARIOT = 200

// Les trajets des wagonnets (24/10) : le joueur choisit lui-même où va chaque wagonnet, sur les
// rails qu'il a posés. Un trajet relie un bâtiment de départ à un bâtiment d'arrivée (un seul
// wagonnet par trajet) ; plusieurs trajets peuvent partager les mêmes rails (les wagonnets se
// croisent sans se gêner).
// (26/10) Avec la fonderie et la joaillerie : la mine et la foreuse leur apportent leur minerai
// (fer et or à la fonderie, avec du charbon pour son four ; les gemmes à la joaillerie), et elles
// envoient leurs lingots et leurs bijoux au marché.
export type IdLiaison =
  | 'mine-marche'
  | 'mine-foreuse'
  | 'mine-generateur'
  | 'foreuse-marche'
  | 'mine-fonderie'
  | 'mine-joaillerie'
  | 'foreuse-fonderie'
  | 'foreuse-joaillerie'
  | 'fonderie-marche'
  | 'joaillerie-marche'
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
  'mine-fonderie': { id: 'mine-fonderie', depart: 'puits', arrivee: 'fonderie', emoji: '🏭', description: 'apporte le fer, l’or et le charbon du coffre à la fonderie' },
  'mine-joaillerie': { id: 'mine-joaillerie', depart: 'puits', arrivee: 'joaillerie', emoji: '🏪', description: 'apporte les gemmes du coffre à la joaillerie' },
  'foreuse-fonderie': { id: 'foreuse-fonderie', depart: 'foreuse', arrivee: 'fonderie', emoji: '🏭', description: 'apporte le fer, l’or et le charbon du chariot de la foreuse à la fonderie' },
  'foreuse-joaillerie': { id: 'foreuse-joaillerie', depart: 'foreuse', arrivee: 'joaillerie', emoji: '🏪', description: 'apporte les gemmes du chariot de la foreuse à la joaillerie' },
  'fonderie-marche': { id: 'fonderie-marche', depart: 'fonderie', arrivee: 'marche', emoji: '🟨', description: 'vend les lingots de la fonderie au marché' },
  'joaillerie-marche': { id: 'joaillerie-marche', depart: 'joaillerie', arrivee: 'marche', emoji: '💍', description: 'vend les bijoux de la joaillerie au marché' },
}
export const LISTE_LIAISONS: IdLiaison[] = [
  'mine-marche',
  'mine-foreuse',
  'mine-generateur',
  'foreuse-marche',
  'mine-fonderie',
  'mine-joaillerie',
  'foreuse-fonderie',
  'foreuse-joaillerie',
  'fonderie-marche',
  'joaillerie-marche',
]
// Les bâtiments où les rails peuvent arriver (les départs et arrivées des trajets).
export const BATIMENTS_DES_RAILS: IdBatiment[] = ['puits', 'marche', 'foreuse', 'generateur', 'fonderie', 'joaillerie']


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
// (23/10) « reserveMinutes » : la redstone qu'il peut garder au plus, en minutes de marche (5 min
// au niveau 1, puis un peu plus à chaque niveau). Sans pousseur sur Mine → Générateur, il faut
// donc revenir le remplir souvent.
// (25/10) La clairière fait 40 × 40 cases. (26/10, demandé par le propriétaire) Le rayon va de 12
// à 28 cases : au niveau max, posé près du milieu, il couvre toute la clairière (du milieu à un
// coin : 20 × √2 ≈ 28 cases), sans la dépasser de beaucoup (avant : jusqu'à 36, bien plus grand).
export const NIVEAUX_GENERATEUR: { rayon: number; bonus: number; reserveMinutes: number; cout: Cout }[] = [
  { rayon: 12, bonus: 0.3, reserveMinutes: 5, cout: { materiaux: {} } },
  { rayon: 15, bonus: 0.4, reserveMinutes: 7, cout: { argent: 4000, materiaux: { fer: 80, redstone: 40 } } },
  { rayon: 18, bonus: 0.5, reserveMinutes: 10, cout: { argent: 8000, materiaux: { fer: 150, redstone: 90 } } },
  { rayon: 21, bonus: 0.6, reserveMinutes: 13, cout: { argent: 15000, materiaux: { fer: 250, redstone: 180 } } },
  { rayon: 24, bonus: 0.75, reserveMinutes: 16, cout: { argent: 35000, materiaux: { fer: 400, redstone: 350 } } },
  { rayon: 26, bonus: 0.85, reserveMinutes: 19, cout: { argent: 90000, materiaux: { fer: 600, redstone: 500 } } },
  { rayon: 28, bonus: 1, reserveMinutes: 22, cout: { argent: 220000, materiaux: { redstone: 800, saphir: 40 } } },
]
// (23/10) Il ne se sert plus tout seul dans le coffre de la mine : sa redstone arrive par les
// rails (un pousseur sur Mine → Générateur) ou à la main.

// ---------------------------------------------------------------------------
// La foreuse (niveau 2 de la mine) : au charbon, plus rapide sous électricité
// ---------------------------------------------------------------------------

export const SECONDES_PAR_CHARBON = 20

// Chaque niveau de forage la rend plus rapide et agrandit son réservoir : le charbon qu'elle peut
// garder au plus (28/10). Le wagonnet du charbon la remplit jusque-là, et met le reste dans son chariot.
// (23/10) Petit : 15 charbons = 5 min au niveau 1, puis 7, 9, 12, 15 et 18 min (avant : 13 à 83 min).
// Sans pousseur sur Mine → Foreuse, il faut donc revenir la remplir souvent.
export const NIVEAUX_FORAGE: { vitesse: number; reservoir: number; cout: Cout }[] = [
  { vitesse: 0.5, reservoir: 15, cout: { materiaux: {} } },
  { vitesse: 1, reservoir: 22, cout: { argent: 3000, materiaux: { fer: 50, redstone: 20 } } },
  { vitesse: 1.6, reservoir: 30, cout: { argent: 6000, materiaux: { fer: 100, redstone: 60 } } },
  { vitesse: 2.4, reservoir: 40, cout: { argent: 14000, materiaux: { redstone: 150, or: 40 } } },
  { vitesse: 3.4, reservoir: 50, cout: { argent: 30000, materiaux: { or: 80, emeraude: 20 } } },
  { vitesse: 4.6, reservoir: 60, cout: { argent: 80000, materiaux: { emeraude: 40, saphir: 20 } } },
  { vitesse: 6, reservoir: 70, cout: { argent: 200000, materiaux: { saphir: 40, rubis: 20 } } },
]

// (23/10, bis) Tout petit : environ 50 secondes de forage au même niveau de forage (sans
// électricité ; encore moins avec). Il se remplit donc vite : il faut le vider souvent (wagonnet
// Foreuse → Marché) et l'agrandir à chaque fois que la foreuse fore plus vite, sinon elle s'arrête.
// Plus cher aussi. Avant : 100 à 720 places (3 min 20), et encore avant 200 à 6 000, jamais plein.
export const NIVEAUX_CHARIOT: { capacite: number; cout: Cout }[] = [
  { capacite: 25, cout: { materiaux: {} } },
  { capacite: 50, cout: { argent: 4000, materiaux: { fer: 60 } } },
  { capacite: 90, cout: { argent: 7000, materiaux: { fer: 120, redstone: 40 } } },
  { capacite: 140, cout: { argent: 14000, materiaux: { redstone: 150, or: 50 } } },
  { capacite: 200, cout: { argent: 30000, materiaux: { or: 100, emeraude: 25 } } },
  // (26/10, demandé par le propriétaire) Du minerai de fer (un temps, des lingots de fer).
  { capacite: 280, cout: { argent: 70000, materiaux: { fer: 300, saphir: 20 } } },
  { capacite: 400, cout: { argent: 180000, materiaux: { fer: 600, rubis: 25 } } },
]

// ---------------------------------------------------------------------------
// La fonderie (26/10, niveau 5 de la mine) : elle fond le fer et l'or en lingots
// ---------------------------------------------------------------------------

// Elle brûle du charbon (1 charbon = 12 secondes de four) pendant qu'elle fond. Le minerai arrive
// par les rails (de la mine ou de la foreuse) ou à la main ; les lingots attendent dans sa réserve
// qu'on les vende (d'un clic, ou par un wagonnet Fonderie → Marché). Un lingot vaut 2 fois son
// minerai. Dans le rayon du générateur allumé, elle va plus vite.
export const SECONDES_PAR_CHARBON_FONDERIE = 12
// « vitesse » : les lingots par seconde ; « stock » : les places de l'entrée (le minerai qui
// attend) et de la réserve (les lingots) ; « reservoir » : le charbon qu'elle garde au plus.
export const NIVEAUX_FONDERIE: { vitesse: number; stock: number; reservoir: number; cout: Cout }[] = [
  { vitesse: 0.5, stock: 40, reservoir: 15, cout: { materiaux: {} } },
  { vitesse: 0.8, stock: 70, reservoir: 22, cout: { argent: 60000, materiaux: { fer: 300, charbon: 100 } } },
  { vitesse: 1.2, stock: 110, reservoir: 30, cout: { argent: 140000, materiaux: { or: 150, saphir: 20 } } },
  { vitesse: 1.7, stock: 160, reservoir: 40, cout: { argent: 260000, materiaux: { or: 250, rubis: 20 } } },
  { vitesse: 2.4, stock: 240, reservoir: 50, cout: { argent: 500000, materiaux: { saphir: 60, rubis: 40 } } },
]
// Le palier de la mine qu'il faut pour chaque niveau de la fonderie (case 0 : la construire).
export const PALIER_FONDERIE = [5, 5, 6, 6, 7]

// ---------------------------------------------------------------------------
// La joaillerie (26/10, niveau 6 de la mine) : ses joailliers taillent les gemmes en bijoux
// ---------------------------------------------------------------------------

// Les gemmes arrivent par les rails ou à la main ; chaque joaillier (embauché au Personnel, avec
// une rareté s'il y a le recruteur) en taille une à la fois. Un bijou vaut 2,5 fois sa gemme.
// « etablis » : combien de joailliers peuvent y travailler ; « vitesse » : ses outils (un bijou
// prend SECONDES_PAR_BIJOU ÷ vitesse ÷ la rareté du joaillier) ; « stock » : les places de
// l'entrée et de la réserve.
export const SECONDES_PAR_BIJOU = 10
export const NIVEAUX_JOAILLERIE: { etablis: number; vitesse: number; stock: number; cout: Cout }[] = [
  { etablis: 1, vitesse: 1, stock: 30, cout: { materiaux: {} } },
  { etablis: 2, vitesse: 1.15, stock: 50, cout: { argent: 120000, materiaux: { saphir: 30 } } },
  { etablis: 3, vitesse: 1.3, stock: 80, cout: { argent: 220000, materiaux: { rubis: 25 } } },
  { etablis: 4, vitesse: 1.5, stock: 120, cout: { argent: 400000, materiaux: { rubis: 40, diamant: 10 } } },
  { etablis: 5, vitesse: 1.75, stock: 180, cout: { argent: 700000, materiaux: { diamant: 25 } } },
]
export const PALIER_JOAILLERIE = [6, 6, 6, 7, 7]
// Le prix de la 1re, 2e... embauche d'un joaillier, et son salaire de 5 minutes (× sa rareté).
export const PRIX_EMBAUCHE_JOAILLIER = [8000, 20000, 45000, 90000, 160000]
export const SALAIRE_JOAILLIER = 1500

// ---------------------------------------------------------------------------
// Le village en vue du ciel : une grande grille où l'on pose les bâtiments
// ---------------------------------------------------------------------------

// La clairière fait 40 × 40 cases (25/10 : avant 60 × 60, le joueur n'utilisait jamais tout).
// Chaque bâtiment fait 5 × 5 cases, sauf la mine (10 × 10). Les rails et les chemins font 1 case.
export const TAILLE_GRILLE = 40

// Les bâtiments du village. (L'arbre de prestige et l'enchanteur sont retirés pour l'instant :
// leur code est dans archives/.)
// (25/10) Le bazar est retiré : il n'y avait que des sacs à dos, et il n'y a plus de sac.
export type IdBatiment = 'puits' | 'marche' | 'forgeron' | 'employes' | 'foreuse' | 'generateur' | 'fonderie' | 'joaillerie'

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
    description: 'Clique sur le bloc pour creuser. Tout ce qui sort de la mine va dans son coffre, que tu vends d’un clic.',
    taille: 10,
    porte: 'gauche',
    niveauMine: 1,
    cout: { materiaux: {} },
  },
  marche: {
    id: 'marche',
    nom: 'Marché',
    emoji: '💰',
    description: 'Relie-le à la mine avec des rails : le wagonnet y vend tout seul le coffre.',
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
    cout: { argent: 30, materiaux: { pierre: 15 } },
  },
  employes: {
    id: 'employes',
    nom: 'Personnel',
    emoji: '👷',
    description: 'Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires.',
    taille: 5,
    porte: 'droite',
    niveauMine: 1,
    cout: { argent: 40, materiaux: {} },
  },
  foreuse: {
    id: 'foreuse',
    nom: 'Foreuse',
    emoji: '⚙️',
    description: 'Elle creuse toute seule avec du charbon, et plus vite avec de l’électricité.',
    taille: 5,
    porte: 'gauche',
    niveauMine: 2,
    cout: { argent: 2500, materiaux: { pierre: 100, fer: 50 } },
  },
  generateur: {
    id: 'generateur',
    nom: 'Générateur',
    emoji: '⚡',
    description: 'Il brûle de la redstone et électrifie tout ce qui est dans son rayon : rails, foreuse, fonderie et joaillerie.',
    taille: 5,
    porte: 'droite',
    niveauMine: 2,
    cout: { argent: 3500, materiaux: { fer: 80, redstone: 30 } },
  },
  fonderie: {
    id: 'fonderie',
    nom: 'Fonderie',
    emoji: '🏭',
    description: 'Elle fond le fer et l’or en lingots, qui valent 2 fois plus. Elle brûle du charbon.',
    taille: 5,
    porte: 'gauche',
    niveauMine: 5,
    cout: { argent: 40000, materiaux: { pierre: 300, fer: 200, charbon: 150 } },
  },
  joaillerie: {
    id: 'joaillerie',
    nom: 'Joaillerie',
    emoji: '🏪',
    description: 'Ses joailliers taillent les gemmes en bijoux, qui valent 2,5 fois plus.',
    taille: 5,
    porte: 'droite',
    niveauMine: 6,
    cout: { argent: 150000, materiaux: { emeraude: 40, saphir: 30 } },
  },
}
// L'ordre du menu « Bâtiments », celui où ils se débloquent. La mine est déjà posée au début.
export const LISTE_BATIMENTS: IdBatiment[] = ['employes', 'marche', 'forgeron', 'foreuse', 'generateur', 'fonderie', 'joaillerie']

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
  statue: { id: 'statue', nom: 'Statue de la taupe d’or', taille: 2 },
}

// ---------------------------------------------------------------------------
// Le niveau du joueur (29/10) : l'expérience (XP) et ce qu'elle débloque
// ---------------------------------------------------------------------------

// Ce qui rapporte de l'XP : chaque bloc cassé en cliquant, chaque bâtiment posé, chaque case de
// rails, chaque trajet de wagonnet créé, chaque embauche, chaque amélioration... Une chose ne
// rapporte qu'une fois : retirer un rail et le reposer, ou licencier puis réembaucher, ne
// redonne rien (voir niveaux.ts).
export const XP_PAR = {
  // (23/10) 1 XP pour 3 blocs cassés à la main (avant, 1 par bloc : un joueur qui clique beaucoup
  // était trop en avance). Nouvelle clé, pour qu'une vieille partie reparte de ses blocs actuels.
  clics: 1,
  batiment: 70, // (23/10 : avant 40, pour bien démarrer sans tout devoir aux clics)
  rail: 3, // une case de rails
  trajet: 30, // un trajet de wagonnet automatisé
  embauche: 40, // un mineur ou un pousseur embauché (23/10 : avant 25)
  amelioration: 30, // un niveau de n'importe quelle amélioration (coffre, pioche, ascenseur...)
  niveauMine: 150, // descendre la mine d'un niveau
  // (23/10) Ce qu'on achète rapporte aussi selon son prix (1 XP par VALEUR_PAR_XP dollars : une
  // grosse amélioration en rapporte bien plus qu'une petite). Rien pour ce qui se fait tout seul
  // (les voyages des wagonnets, l'argent gagné) : rester AFK ne rapporte pas d'XP.
  investi: 1,
}
export const VALEUR_PAR_XP = 25
export const BLOCS_PAR_XP = 3

// L'XP qu'il faut pour passer du niveau n au niveau n + 1 : de plus en plus.
// 60 pour passer au niveau 2, 210 pour le 3, 430 pour le 4... environ 13 000 pour le 21.
export function xpPourPasser(niveau: number): number {
  return Math.round((60 * niveau ** 1.8) / 10) * 10
}

// (25/10) Plafonné à 15 (avant 30 : après le 15, plus rien ne se débloquait). Chaque niveau
// gagné rapporte des gemmes (GEMMES_PAR_NIVEAU, dans gemmes.ts).
export const NIVEAU_JOUEUR_MAX = 15

// Le niveau du joueur qu'il faut pour chaque chose. (25/10) Seuls les bâtiments, les rails et les
// niveaux de la mine demandent un niveau du joueur : tout le reste suit les paliers de la mine
// (voir NIVEAUX_MINE). Une fois débloqué, il faut quand même payer.
export const NIVEAU_JOUEUR_POUR = {
  batiments: { puits: 1, marche: 1, forgeron: 1, employes: 1, foreuse: 1, generateur: 1, fonderie: 1, joaillerie: 1 } as Record<IdBatiment, number>,
  rails: 2, // poser des rails (et donc créer des trajets de wagonnets)
  mine: [1, 3, 5, 7, 9, 11, 13], // NIVEAUX_MINE : les 7 paliers (26/10)
}

// ---------------------------------------------------------------------------
// (26/10, demandé par le propriétaire) La hausse de la fin de partie
// ---------------------------------------------------------------------------
// À partir du palier 5 de la mine, le joueur a eu le temps de « tenter sa chance » au recruteur :
// ses mineurs sont rares, il gagne bien plus. Sans hausse, il finissait le jeu trop vite. Tout ce
// qui demande le palier 5, 6 ou 7 (descendre la mine, améliorer le coffre, l'ascenseur, les
// pioches, les employés, les chariots, le générateur, la foreuse, la fonderie, la joaillerie, les
// chefs) coûte donc plus cher : × 2 au palier 5, × 2,5 au palier 6, × 3 au palier 7, argent et
// minerais. Les prix écrits dans les tables plus haut sont ceux d'AVANT cette hausse.
export const HAUSSE_PAR_PALIER: Record<number, number> = { 5: 2, 6: 2.5, 7: 3 }

// Un joli nombre rond : 2 chiffres qui comptent (37 500 → 38 000 ; 175 → 180).
function arrondiJoli(n: number): number {
  if (n < 100) return Math.round(n)
  const puissance = Math.pow(10, Math.floor(Math.log10(n)) - 1)
  return Math.round(n / puissance) * puissance
}

function rencherir(cout: Cout, palier: number): void {
  const facteur = HAUSSE_PAR_PALIER[palier] ?? 1
  if (facteur === 1) return
  if (cout.argent) cout.argent = arrondiJoli(cout.argent * facteur)
  for (const [bloc, n] of Object.entries(cout.materiaux)) cout.materiaux[bloc as IdBloc] = arrondiJoli((n ?? 0) * facteur)
}

// Les tables où la case « i » demande le palier i + 1 de la mine.
for (const table of [NIVEAUX_MINE, NIVEAUX_COFFRE, PIOCHES, NIVEAUX_ASCENSEUR, NIVEAUX_EMPLOYE, NIVEAUX_POUSSEUR, NIVEAUX_CHARIOT_POUSSEUR, NIVEAUX_GENERATEUR, NIVEAUX_FORAGE, NIVEAUX_CHARIOT] as { cout: Cout }[][]) {
  table.forEach((niveau, i) => rencherir(niveau.cout, i + 1))
}
// (26/10) La réparation des pioches de la fin de partie suit la même hausse.
PIOCHES.forEach((pioche, i) => rencherir(pioche.reparation, i + 1))
// Les ateliers et les chefs ont leurs propres paliers.
NIVEAUX_FONDERIE.forEach((niveau, i) => rencherir(niveau.cout, PALIER_FONDERIE[i]))
NIVEAUX_JOAILLERIE.forEach((niveau, i) => rencherir(niveau.cout, PALIER_JOAILLERIE[i]))
NIVEAUX_RECRUTEUR.forEach((niveau, i) => rencherir(niveau.cout, PALIER_CHEF.recruteur[i]))
NIVEAUX_MANAGER.forEach((niveau, i) => rencherir(niveau.cout, PALIER_CHEF.manager[i]))

// (26/10, demandé par le propriétaire) Jamais plus de 1 000 d'un même matériau dans un prix (après
// la hausse de la fin de partie) : au-delà, il fallait attendre trop longtemps devant le coffre
// (le dernier générateur demandait 2 400 redstone).
export const MATERIAUX_MAX = 1000

function plafonner(cout: Cout): void {
  for (const [bloc, n] of Object.entries(cout.materiaux)) cout.materiaux[bloc as IdBloc] = Math.min(MATERIAUX_MAX, n ?? 0)
}

for (const table of [
  NIVEAUX_MINE,
  NIVEAUX_COFFRE,
  PIOCHES,
  NIVEAUX_ASCENSEUR,
  NIVEAUX_EMPLOYE,
  NIVEAUX_POUSSEUR,
  NIVEAUX_CHARIOT_POUSSEUR,
  NIVEAUX_GENERATEUR,
  NIVEAUX_FORAGE,
  NIVEAUX_CHARIOT,
  NIVEAUX_FONDERIE,
  NIVEAUX_JOAILLERIE,
  NIVEAUX_RECRUTEUR,
  NIVEAUX_MANAGER,
] as { cout: Cout }[][]) {
  for (const niveau of table) plafonner(niveau.cout)
}
for (const pioche of PIOCHES) plafonner(pioche.reparation)
for (const id of LISTE_BATIMENTS) plafonner(BATIMENTS[id].cout)
