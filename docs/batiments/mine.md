# ⛏️ Mine

> Le cœur du jeu, au milieu de la clairière (22/10 : la mine automatique). On ne descend plus dedans : devant la mine, on **clique sur un gros bloc** pour creuser, et tout ce qui sort va dans le **coffre de la mine**. La mine sort aussi des blocs toute seule. C'est ici qu'on **descend d'un niveau** (5 niveaux, de nouveaux minerais à chaque fois), qu'on agrandit le coffre, qu’on construit l’ascenseur des mineurs et qu’on **envoie des wagonnets** vers le marché, la foreuse et le générateur.
> Les règles détaillées du minage (le bloc, les pioches, les niveaux) sont aussi dans [../jeu/mine-et-minage.md](../jeu/mine-et-minage.md).

## Où et quand

- **Où** : la mine est **déjà posée** au début de la partie, **au milieu de la clairière** (cases 25 à 34 de la grille de 60 × 60, `POSITION_MINE`). C'est le seul bâtiment de **10 × 10 cases** (identifiant `'puits'`, nom affiché « Mine »). Elle n'est pas dans le menu Bâtiments (rien à payer), mais **✏️ Modifier** permet de la déplacer ou de la retourner gratuitement.
- **Déblocage** : dès le début, jamais de cadenas.
- **La porte** : au milieu de sa face avant **gauche** (à droite si elle est retournée). Le hamster du joueur apparaît devant elle au chargement de la partie.
- **L'ouvrir** : toucher (ou cliquer) la mine, ou le gros bouton rond **⛏️ Mine** en bas à gauche de l'écran : le hamster marche jusqu'au côté de la mine le plus proche de lui, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1,3 case de la mine, de n'importe quel côté. Au chargement d'une partie, le panneau reste fermé (il ne s'ouvre qu'en arrivant en marchant).
- **Description** (en haut du panneau) : « Clique sur le bloc pour creuser. Tout ce qui sort de la mine va dans son coffre. »
- **Le dessin au village** : le dessin de la mine de l'équipe (une fosse en planches et en pierre, avec son treuil, ses minerais et ses lanternes, `public/images/batiments/mine.webp`), calé pile sur ses 10 × 10 cases (`CALAGES.puits`). Par-dessus (`DessinEvolutionMine` dans `DessinsVillage.tsx`) :
  - dès que l'**ascenseur** est construit, **sa cabine** (`mine-cabine.webp`) pend aux deux câbles du treuil et **suit le premier mineur qui monte ou descend** : elle descend avec lui, remonte avec lui, et attend en haut le reste du temps. Tout en bas, elle est à moitié cachée derrière la barrière de devant (`mine-devant.webp`). Sans ascenseur, les câbles pendent au fond ;
  - un **panneau en bois** planté sur le sol de devant affiche le niveau de la mine (« Niv. 3 »).
- **Bulles au-dessus** (`notifications.ts`) :
  - **📦 « Le coffre de la mine est plein : viens le vider ! »** (alerte rouge) ;
  - **📦 « *N* objets dans le coffre : porte-les au marché »** (bulle rose « prêt ») quand le coffre a au moins 20 objets et qu'il n'y a pas encore de trajet Mine → Marché ;
  - **💰 « Une amélioration est achetable ! »** quand le niveau suivant de la mine, du coffre, de l'ascenseur (si on a des mineurs) ou des wagonnets (s'il y a au moins un trajet) est payable tout de suite.
- **Le bandeau** (en haut de l'écran) montre toujours le niveau de la mine, son nom et le remplissage du coffre (la case clignote en rouge quand il est plein).

## Ce qu'on peut y faire

Le panneau (`PanneauMine.tsx`), de haut en bas :

### Le bloc à cliquer

- Un **gros bloc** (le prochain bloc de la mine, dessiné en CSS : pierre, charbon, fer…) et à côté « 👆 Clique : ⚫ Charbon » et « ⛏️ *N* % de chance de doubler un minerai ».
- **Chaque clic casse le bloc** : des éclats volent, ce qui tombe s'envole au-dessus (« +1 ⚫ », ou « +2 💎 ×2 ! » en doré quand il est doublé), et un nouveau bloc « pousse » à sa place. Le bloc tombé va dans le **coffre**.
- **Pioche cassée** : « 💥 Pioche cassée : 2 clics par bloc. Fais-la réparer au forgeron. » Après le premier clic, le bloc est fissuré ; le second le casse.
- **Coffre plein** : le bloc est grisé (« 📦 Coffre plein ! ») : il faut vider le coffre.
- Dessous : « Niveau *N* · **nom du niveau** · la mine sort toute seule *X* blocs par minute. »

### 📦 Le coffre · *n* / *capacité*

- Une barre : le remplissage (rouge et « Plein : la mine s'arrête ! » quand il est plein).
- Vide : « Vide. Clique sur le bloc pour le remplir ! »
- Sinon, les **jauges** de son contenu (les objets les plus chers en haut) et **🎒 Mettre dans le sac (*n*)** (kaki) : on choisit combien prendre de chaque objet, et ils passent dans le sac à dos (tant qu'il y a de la place). Il faut ensuite **marcher jusqu'au marché** pour les vendre. Sac plein : « 🎒 Ton sac est plein : va d'abord vendre au marché. »
- Avec le trajet Mine → Marché : « Le wagonnet du marché laisse dans le coffre : » et une case à cocher par objet. Un objet coché est **gardé** : le wagonnet du marché ne l'emporte pas (c'est la même liste que les objets gardés du marché).

### Les trajets de wagonnets (24/10)

Un bloc **🛤️ Wagonnets** (`PanneauTrajets`) montre les trajets qui partent de la mine, vers chaque bâtiment construit parmi le **marché** (💰, il vend le coffre), la **foreuse** (🔥, il lui apporte le charbon) et le **générateur** (🔴, il lui apporte la redstone). Pour chacun :

- **Sans rails** : « Relie la mine au marché avec des rails (menu Bâtiments, 3 🔩 fer la case) : un wagonnet emporte le coffre de la mine et le vend au marché. » (de même pour la foreuse et le générateur).
- **Rails posés, pas de trajet** : « Les rails sont posés ! » et **🛤️ Envoyer un wagonnet vers le marché** (bleu, gratuit) : c'est le joueur qui choisit ses trajets.
- **Trajet créé** : où en est son wagonnet (« Au quai : rien à porter pour l’instant. », « Il part tout seul. », « Un mineur pousseur va le pousser. », « En route vers le marché, poussé par toi / *prénom* / l'électricité ⚡ », « Revient à la mine »), avec une barre pendant le trajet et un badge **⚡ Électrique** si tout le trajet l'est.
  - **🛤️ Pousser (*n* objets)** (bouton bois) : le hamster du joueur **fait l'aller-retour avec le wagonnet** : il le pousse jusqu'à l'arrivée, puis le ramène au quai. Pendant ce temps, on ne peut pas marcher ailleurs (le bouton ⛏️ Mine devient « Wagonnet… », les flèches et les touchers sur la carte ne font rien) et aucun panneau n'est ouvert. On ne pousse qu'un wagonnet à la fois. Grisé si le wagonnet est déjà en route ou s'il n'y a rien à porter.
  - **✖ Arrêter** (rouge) : supprime le trajet (son chargement retourne dans le coffre, les rails restent).
- Dès qu'il y a un trajet : la ligne d'amélioration **🛒 Taille des wagonnets**, qui vaut pour **tous** les wagonnets (même ceux qui partent de la foreuse). Un wagonnet déjà chargé garde son chargement : la nouvelle taille compte à son prochain départ.

### ⬇ Niveau de la mine

- Les chances de chaque bloc au niveau actuel (« 🪨 70 % ⚫ 18 % 🔩 12 % »), puis celles du niveau suivant.
- La ligne d'amélioration « Niveau *N* / 5 » et le bouton **⬇ *nom du niveau suivant*** avec son prix. Message : « ⛏️ La mine descend au niveau 3 : Filon d'or ! »

### 📦 Taille du coffre et 🛗 Ascenseur

- **Taille du coffre** : une ligne d'amélioration (« 250 places » → « ⬆ 600 places »).
- **Ascenseur** : « Tes mineurs remontent leur sac (et redescendent) plus vite. » Pas construit : « Pas encore construit : à l'échelle, un trajet prend 10 s » et **🔨 Construire** ; ensuite « Un trajet de mineur en *N* s » et **⬆ Trajet en *N* s**.

## Les chiffres

### Les 5 niveaux de la mine (`NIVEAUX_MINE`)

Les poids de chaque niveau font 100 : ce sont donc directement les chances, en %.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Diamant | La mine sort seule | Prix pour y descendre |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | 0,2 bloc/s (12 / min) | (départ) |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | 0,25 bloc/s (15 / min) | 400 $ + 30 fer |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | 0,3 bloc/s (18 / min) | 2 500 $ + 60 fer + 30 redstone |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | 0,35 bloc/s (21 / min) | 9 000 $ + 60 redstone + 30 or |
| 5 | Cœur de diamant | 40 | 11 | 12 | 12 | 12 | 8 | 5 | 0,4 bloc/s (24 / min) | 30 000 $ + 60 or + 25 émeraude |

Ce que vaut **en moyenne un bloc** au marché (sans doublement, `valeurMoyenneBloc`) : **3,04 $** au niveau 1, **4,58 $** au niveau 2, **7,50 $** au niveau 3, **13,07 $** au niveau 4, **19,79 $** au niveau 5.

Ce que **débloque** chaque niveau :

| Niveau | Ce qui se débloque |
|---|---|
| 1 | Mine, Marché, Forgeron, Bazar, Personnel, rails ; 4 mineurs au plus |
| 2 | **Foreuse** et **Générateur** (menu Bâtiments) ; la redstone ; cerisier en fleurs, haut-de-forme ; 6 mineurs |
| 3 | **Recruteur** (au Personnel) ; l'or ; fontaine, gilet doré ; 8 mineurs |
| 4 | **Manager** et trésorerie (au Personnel) ; les émeraudes ; couronne ; 10 mineurs |
| 5 | Les diamants ; statue du hamster d'or ; 12 mineurs |

### Le coffre (`NIVEAUX_COFFRE`)

| Niveau | Places | Prix |
|---|---:|---|
| 1 | 100 | (départ) |
| 2 | 250 | 150 $ + 40 pierre |
| 3 | 600 | 800 $ + 40 fer |
| 4 | 1 500 | 3 000 $ + 80 fer + 20 redstone |
| 5 | 4 000 | 10 000 $ + 30 or |

### L'ascenseur (`NIVEAUX_ASCENSEUR`)

Il ne transporte que les **mineurs employés** (le joueur ne descend plus). Sans ascenseur, ils prennent l'**échelle** : **10 s** par trajet (`SECONDES_ECHELLE`). Un trajet = une montée ou une descente.

| Niveau | Un trajet | Prix |
|---|---:|---|
| (échelle) | 10 s | — |
| 1 | 6 s | 150 $ + 10 fer |
| 2 | 4 s | 600 $ + 30 fer + 5 redstone |
| 3 | 2,8 s | 2 000 $ + 60 fer + 20 redstone |
| 4 | 2 s | 6 000 $ + 100 fer + 50 redstone |
| 5 | 1,4 s | 15 000 $ + 100 redstone + 20 or |
| 6 | 1 s | 40 000 $ + 60 or + 10 émeraude |

### La taille des wagonnets (`NIVEAUX_WAGONNET`)

| Niveau | Places | Prix |
|---|---:|---|
| 1 | 40 | (départ) |
| 2 | 100 | 500 $ + 40 fer |
| 3 | 250 | 2 500 $ + 80 fer + 20 redstone |
| 4 | 600 | 10 000 $ + 40 or |

Vitesses (`VITESSE_POUSSE_JOUEUR`, `VITESSE_POUSSE_MINEUR`, `VITESSE_RAILS`) : **3 cases/s** poussé par toi, **2,5 cases/s** par un mineur pousseur, **8 cases/s × la puissance du générateur** avec l'électricité (8 à 24 cases/s). Charger au départ et vider à l'arrivée prennent **2 s** chacun (`SECONDES_CHARGEMENT_WAGONNET`).

## Règles et comportement

### Le coffre

- **Tout ce qui sort de la mine y va** : tes clics, les blocs que la mine sort toute seule, et les sacs des mineurs employés (la foreuse a son propre chariot). Il ne contient que des blocs.
- **Coffre plein = tout s'arrête** : le bloc ne se clique plus, la mine ne sort plus rien, et les mineurs qui remontent **attendent** devant le coffre, leur sac plein (« 📦 attend : le coffre de la mine est plein ! »), en continuant d'être payés. Le « $/s » du bandeau tombe à 0 (ou en dessous, à cause des salaires).
- **On paie aussi avec le coffre** : partout dans le jeu, les minerais d'un achat se prennent **d'abord dans le sac**, **puis dans le coffre** (`disponible`, `payer`). Pas besoin de porter le fer jusqu'au forgeron.
- Il ne se vide que de trois façons : 🎒 Mettre dans le sac, les wagonnets (vers le marché, la foreuse, le générateur), et le générateur qui se sert en redstone (à partir de son niveau 2).

### La mine toute seule

- Elle sort **0,2 à 0,4 bloc par seconde** selon le niveau (le « vieux treuil », `debit`), tant que le coffre a de la place, même jeu fermé (8 h au plus). Ces blocs ne sont **jamais doublés** et n'usent pas la pioche.
- Le bloc à cliquer, lui, n'est pas cassé par la mine : il attend ton clic.

### Les wagonnets

- Au début, **il n'y a aucun trajet**. Il faut une **ligne de rails continue** (cases voisines par un côté) entre une case collée au bâtiment de départ et une case collée à celui d'arrivée (`ligneDe`, `railsEntre`), puis créer le trajet (« Envoyer un wagonnet vers… »). Les rails : **3 fer la case**, dès le début (menu 🏗️ Bâtiments), et **jamais en boucle** : entre deux bâtiments, une seule route. Voir [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets).
- **4 trajets**, un wagonnet chacun (`LIAISONS`) : Mine → Marché, Mine → Foreuse, Mine → Générateur (ils partent d'ici), et Foreuse → Marché (il part de la foreuse, voir [foreuse.md](foreuse.md)). Plusieurs wagonnets peuvent partager les mêmes rails : ils se croisent sans se gêner.
- **La longueur d'un trajet** = le nombre de cases de sa ligne **+ 1**. Un aller-retour dure `2 × longueur ÷ vitesse + 4 s` (chargement et vidage).
- **Ce qu'il emporte au départ**, jusqu'à sa capacité :
  - **vers le marché** : le coffre, **les objets les plus chers d'abord**, **sauf les objets gardés** (`nonAVendre`) et sauf le charbon et la redstone qui manquent à la foreuse et au générateur (si leurs trajets existent). Au marché, il vend tout (« 🛤️ Le wagonnet a tout vendu au marché : +*X* $ » quand c'est toi qui pousses) ;
  - **vers la foreuse** : le charbon du coffre, jusqu'à lui faire **60 charbons** de réserve (`RESERVE_FOREUSE_WAGONNET` = 1 200 s) ;
  - **vers le générateur** : la redstone du coffre, jusqu'à lui faire **60 redstones** de réserve (`RESERVE_GENERATEUR_WAGONNET` = 1 800 s).
  - Puis il revient au quai. S'il n'a rien à porter, il reste au quai.
- **Qui le fait avancer** (il ne part jamais tout seul sans eux) :
  - **toi**, avec « Pousser » (un wagonnet à la fois) ;
  - **un mineur pousseur** (rôle choisi au Personnel) qui attend au quai : il pousse un wagonnet qui a quelque chose à porter. Voir [personnel.md](personnel.md) ;
  - **l'électricité** : si **toutes les cases de ce trajet** sont dans le rayon du générateur allumé (`trajetElectrique`), il part tout seul dès qu'il a quelque chose à porter, et roule plus vite. Voir [generateur.md](generateur.md). S'il perd le courant en route, il finit son trajet doucement (1,25 case/s).
- **Ligne coupée** (un rail enlevé, un bâtiment déplacé) : le wagonnet revient aussitôt au quai, son chargement retourne d'où il vient, et le pousseur retourne au quai. Le trajet reste : il repartira quand les rails seront refaits.
- **Au village**, chaque wagonnet roule sur sa ligne, plein à l'aller, avec un chargement de la couleur de son trajet : des minerais de toutes les couleurs (vers le marché), du charbon noir (vers la foreuse), de la redstone rouge (vers le générateur).
- Ils roulent aussi jeu fermé (avec un pousseur ou l'électricité).

### L'ascenseur et l'échelle

- Ils ne servent qu'aux **mineurs employés** : chaque mineur remonte son sac plein (une montée), le vide dans le coffre en **2 s**, puis redescend (une descente). Voir [personnel.md](personnel.md).
- L'ascenseur n'est proposé dans les objectifs qu'une fois qu'on a au moins un mineur.

### Descendre d'un niveau

- On paie le prix (argent + minerais du sac puis du coffre) et la mine passe au niveau suivant tout de suite : le bloc à cliquer est tiré au nouveau niveau, et les mineurs, la mine et la foreuse sortent les nouveaux minerais. Le coffre garde ce qu'il contenait.
- Il n'y a **pas de fin** ni de prestige après le niveau 5 (l'ancien prestige est archivé dans `archives/prestige/`) : au niveau 5, on continue d'agrandir, d'embaucher et d'automatiser.

## Lien avec le reste du jeu

- **Marché** : on y porte le coffre (à pied, dans le sac) ou le wagonnet Mine → Marché y va sur les rails. **Forgeron** : la pioche décide de la chance de doubler en cliquant. **Bazar** : un plus grand sac pour porter plus du coffre au marché. **Personnel** : les mineurs remplissent le coffre et poussent les wagonnets. **Foreuse** et **Générateur** : débloqués au niveau 2 ; la mine peut leur envoyer leur charbon et leur redstone par wagonnet.
- **Objectifs** (`objectifs.ts`) : « Mine niveau *N* : *nom* », « Coffre de *N* places », « Construire l'ascenseur » / « Ascenseur niveau *N* », « Wagonnets de *N* places » (achats du stand `puits`, « achetable à la mine ! ») ; et les étapes « Relier la mine au marché · pose des rails (menu Bâtiments, 3 fer la case) » quand on a du fer et pas encore de ligne, puis « Créer un trajet de wagonnet · à la mine : « envoyer un wagonnet vers le marché » », et plus tard « Envoyer du charbon à la foreuse ».
- **Succès** : Premier coup de pioche, Terrassier (100 blocs), Tunnelier (1 000 blocs), Veine de redstone, Chercheur d'or, Grotte aux émeraudes, Cœur de diamant (niveaux 2 à 5), Ça brille ! (un diamant), Cheminot (un trajet de wagonnet), Réseau complet (les 4 trajets), Ligne régulière (100 voyages de wagonnet).
- **Classement** : le niveau de la mine (le meilleur de tes mondes) est envoyé dans la colonne « prestige » du serveur. Voir [../jeu/sauvegarde-et-en-ligne.md](../jeu/sauvegarde-et-en-ligne.md).
- **Statistiques** : blocs cassés en cliquant (par sorte), blocs sortis tout seuls de la mine, voyages et argent des wagonnets.

## Fichiers du code

- `src/jeu/donnees.ts` : `BATIMENTS.puits`, `BLOCS`, `NIVEAUX_MINE`, `NIVEAUX_COFFRE`, `NIVEAUX_ASCENSEUR`, `SECONDES_ECHELLE`, `NIVEAUX_WAGONNET`, `COUT_RAIL`, les trajets (`LIAISONS`, `RESERVE_FOREUSE_WAGONNET`, `RESERVE_GENERATEUR_WAGONNET`), les vitesses des wagonnets et `SECONDES_CHARGEMENT_WAGONNET`.
- `src/jeu/mine.ts` : tirer un bloc selon le niveau (`tirerBloc`), les chances (`chancesDesBlocs`), la valeur moyenne d'un bloc (`valeurMoyenneBloc`).
- `src/jeu/mineur.ts` : le coffre (`capaciteCoffre`, `rangerDansCoffre`, `prendreDuCoffre`, `agrandirCoffre`), payer avec le sac puis le coffre (`disponible`, `payer`), le clic (`cliquerMine`), la mine toute seule (`avancerMine`, `debitMine`), les niveaux (`descendreNiveauMine`) et l'ascenseur (`ameliorerAscenseur`, `secondesTrajetMineur`).
- `src/jeu/wagonnet.ts` : les trajets (`ligneDe`, `creerTrajet`, `supprimerTrajet`), le chargement, la vitesse (`trajetElectrique`), pousser (`pousserTrajet`), agrandir (`ameliorerWagonnet`), le temps qui passe (`avancerWagonnets`).
- `src/jeu/village.ts` : la mine posée au milieu (`POSITION_MINE`, `nouveauVillage`), sa porte, les rails entre deux bâtiments (`railsEntre`), sans boucle (`feraitUneBoucle`).
- `src/jeu/batiments.ts` : déplacer ou retourner la mine, poser les rails.
- `src/jeu/notifications.ts`, `src/jeu/objectifs.ts` : les bulles 📦 et 💰, les achats du stand `puits`.
- `src/composants/PanneauMine.tsx` : le panneau (bloc à cliquer, coffre, trajets, niveau, coffre, ascenseur) ; `src/composants/PanneauTrajets.tsx` : le bloc des trajets ; `src/composants/Ascenseur.tsx` : la ligne de l'ascenseur.
- `src/usePartie.ts` : le clic (`cliquer` : le son du coup, puis `cliquerMine`), les éclats et les minerais qui s'envolent.
- `src/composants/DessinsVillage.tsx` : la cabine qui monte et descend et le panneau du niveau (`DessinEvolutionMine`) ; `src/composants/VueVillage.tsx` : la hauteur de la cabine (`hauteurCabine`), les wagonnets et leurs pousseurs sur les rails (`WagonnetVillage.tsx`).
- `src/village.css` : le bloc à cliquer (`.bloc-mine`, `.eclats-bloc-mine`, `.trouvaille-bloc-mine`) ; `src/blocs.css` : le dessin des blocs.
- `public/images/batiments/mine.webp`, `mine-cabine.webp`, `mine-devant.webp` : le dessin de la mine, sa cabine et son devant.
