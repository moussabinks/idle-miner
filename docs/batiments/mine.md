# ⛏️ Mine

> Le cœur du jeu, au milieu de la clairière. On ne descend pas dedans : devant la mine, on **clique sur un gros bloc** pour creuser, et tout ce qui sort va dans le **coffre de la mine**, qu'on **vend d'un clic, ici même** (25/10 : plus de sac à dos ni de marche jusqu'au marché). La mine sort aussi des blocs toute seule, **dès le niveau 1**. C'est ici qu'on **descend d'un niveau** (7 niveaux depuis le 26/10, 5 avant : chacun est un **palier** qui débloque le niveau suivant de toutes les améliorations), qu'on agrandit le coffre, qu'on améliore l'ascenseur des mineurs et qu'on règle les **wagonnets** vers le marché, la foreuse, le générateur, et depuis le 26/10 la fonderie et la joaillerie.
> Écrit d'après le code au 25/10 (la grande mise à jour), mis à jour le 26/10 (la grosse mise à jour des gemmes : saphir au niveau 5, rubis au 6, diamant au 7). Les règles détaillées du minage (le bloc, les pioches, les niveaux) sont aussi dans [../jeu/mine-et-minage.md](../jeu/mine-et-minage.md). Le panneau a été refait le 25/10 dans le nouveau style : son apparence sera détaillée dans [../jeu/interface.md](../jeu/interface.md).

## Où et quand

- **Où** : la mine est **déjà posée** au début de la partie, **au milieu de la clairière** (cases 15 à 24 de la grille de 40 × 40, `POSITION_MINE`). C'est le seul bâtiment de **10 × 10 cases** (identifiant `'puits'`, nom affiché « Mine »). Elle n'est pas dans le menu Bâtiments (rien à payer), mais **✏️ Modifier** permet de la déplacer ou de la retourner gratuitement.
- **Déblocage** : dès le début, jamais de cadenas. Ses niveaux demandent un **niveau du joueur** (3, 5, 7, 9, 11, 13) ; ses autres améliorations (coffre, ascenseur) suivent les **paliers** (« 🕳️ Mine *N* »).
- **La porte** : au milieu de sa face avant **gauche** (à droite si elle est retournée). Le joueur apparaît devant elle au chargement de la partie.
- **L'ouvrir** : toucher (ou cliquer) la mine, ou le gros bouton rond **⛏️ Mine** en bas de l'écran : la taupe du joueur y marche et le panneau s'ouvre.
- **Description** : « Clique sur le bloc pour creuser. Tout ce qui sort de la mine va dans son coffre, que tu vends d'un clic. »
- **Le dessin au village** : la fosse de la mine, son treuil et, par-dessus, ce qui **évolue** : la **caisse de l'ascenseur** qui monte pleine et redescend vide tant que des mineurs travaillent au fond (avec un mineur dedans quand il arrive ou remonte), et un **panneau en bois** avec le niveau de la mine (« Niv. 3 »). Depuis le 25/10, c'est un SVG plat au contour d'encre (`public/images/batiments/mine.svg`, dessiné par `outils/art/mine.mjs`) : un puits carré entouré de poutres, un chevalement en bois (deux gros poteaux sur des pieds en pierre, une poutre, deux lanternes, une grande roue rouge sur son support et le treuil), et des **parois du puits pleines de minerais** (or, diamants, émeraudes, redstone, charbon, fer, avec des étincelles : on a envie d'y descendre). Le dessin reste **bas** (25/10 : plus de grosse montagne au fond, qui cachait le décor derrière la mine) : seule la roue du chevalement dépasse. Au fond, deux rochers à filons ; à gauche, une petite butte de rochers avec l'entrée d'une **galerie** (deux yeux brillent dans le noir) d'où sort une voie avec un **wagonnet plein de minerais** ; devant, près de la porte, un **coffre au trésor** ouvert, plein de pièces d'or ; à droite, la cabane à outils (deux pioches croisées sur le pignon), un rocher à cristaux, des tonneaux et des caisses de charbon et de lingots d'or. Tous les minerais ont **la forme des icônes du jeu** (caillou, charbon, lingots, cristal de redstone, émeraude, diamant), plus des petits cubes. Par-dessus, le jeu pose les câbles, la caisse (`caisse-ascenseur-0.svg` vide, puis `-1.svg` à `-7.svg`, une par niveau de la mine, 26/10) et `mine-devant.svg` (les poutres de devant du puits, qui passent devant la caisse) : voir [../jeu/visuel-et-sons.md](../jeu/visuel-et-sons.md#la-mine-et-son-ascenseur).
- **Bulles au-dessus** (`notifications.ts`) :
  - **📦 « Le coffre de la mine est plein : vends-le ! »** (alerte rouge) ;
  - **😠 « Payer ! »** quand des employés attendent leur salaire (la même alerte est au Personnel) ;
  - **🚧 « Rails coupés »** (alerte rouge) quand un trajet qui part de la mine (ou qui y arrive) n'a plus de rails complets ;
  - **⬆️ « Achetable »** quand une amélioration de la mine est payable tout de suite, **seulement pendant le tutoriel**.
- (25/10 : plus de jauge du coffre au-dessus de la mine : le bandeau du haut montre déjà 📦 *n* / *capacité*, et la bulle « Plein ! » prévient quand il faut vendre.)

## Ce qu'on peut y faire

Le panneau (`PanneauMine.tsx`, refait le 25/10) a **quatre onglets** (`OngletsPanneau`) :

- **⛏️ Creuser** (il s'ouvre en premier) : le **bloc à cliquer** et, à côté, le **coffre** à vendre, puis le rappel du niveau suivant de la mine (« ⬇️ Mine niveau *N* · *nom* », avec « Prêt ! » quand on peut descendre, ou le cadenas « 🔒 ⭐ *N* »). Pastille « ! » quand le coffre est plein ;
- **⬆️ Améliorer** : la grande carte du **palier suivant** (descendre la mine), la taille du **coffre** et l'**ascenseur**. Pastille « ! » quand on peut descendre ;
- **🚃 Wagonnets** : les trajets qui partent de la mine (et l'alerte quand le chariot du pousseur du marché est trop petit) ;
- **📊 Production** : le tableau de production. Pastille « ! » quand l'ascenseur ou le wagonnet ne suit pas.

Quand des employés attendent leur salaire, un bandeau « 😠 Un employé attend son salaire : il ne travaille plus. » avec un bouton **💵 Payer** est en haut du panneau.

### Le bloc à cliquer

- Un **très gros bloc** (le prochain bloc de la mine : pierre, charbon, fer…) avec, au-dessus, « ⛏️ Niveau *N* · *nom du niveau* ».
- **Chaque clic casse le bloc** : des éclats volent, ce qui tombe s'envole au-dessus, et un nouveau bloc pousse à sa place. Le bloc tombé va dans le **coffre**.
- **Trois compteurs** à côté : 🔨 les blocs cassés à la main, 🏆 le record de combo, 👆 les clics par seconde.
- **La pioche** : sa jauge (« Pioche en *X* · *reste* »), et « Pioche cassée : répare-la au forgeron ! » quand elle est cassée (2 clics par bloc, sans doublement).
- **Coffre plein** : le bloc est grisé (« 📦 Coffre plein : vends-le ! »).
- **Le combo** : les clics à moins de 0,9 s l'un de l'autre s'additionnent ; chaque palier (10, 25, 50, 100, 200, 500) donne un **bonus de quelques secondes** (fortune, puis 2, 3 ou 5 blocs par clic, `BONUS_COMBO`). L'écran dit « Clique vite ! ×10 = 🍀 Fortune », puis « 🔥 ×*N* → ×*palier* : … ». Détail dans [../jeu/mine-et-minage.md](../jeu/mine-et-minage.md).
- **Le bonus « 👆 Clics en or »** (boutique des gemmes, 5 min) : chaque clic fait tomber 3 fois plus de blocs.

### 📦 Le coffre : vendre d'un clic (25/10)

C'est la nouveauté de la grande mise à jour : **plus besoin de porter le coffre au marché**. Le coffre se vend ici, **au prix du marché** (`vendreCoffre`, `valeurDe`) :

- en haut, « 📦 Coffre » et sa jauge (« 120 / 300 », rouge « Plein : la mine s'arrête ! ») ;
- le gros bouton jaune **💰 Tout vendre · +X $** : tout le coffre, **sauf les minerais épinglés** (`aVendreDuCoffre`). Grisé s'il n'y a rien à vendre ; il attire l'œil quand le coffre est plein ;
- **une ligne par minerai** que sort la mine à son niveau (même à 0, les plus chers en haut) : son icône, son nom, « *prix* $ pièce », combien il y en a, **Vendre** (ce minerai seul, même épinglé, `vendreMinerai`) et la **punaise 📌** ;
- **« 📌 Garder »** (25/10) : le bouton (un mot et une petite punaise) ouvre une **petite fenêtre au milieu de l'écran** (la fenêtre de la mine ne grandit plus) : **−100, −10, +10, +100** (`changerGarder`) et **Tout** (`basculerGarderTout`). Ce qu'on garde (« 📌 110 » sous le nombre, ligne bleue) **reste dans le coffre** : ni « Tout vendre », ni « Vendre » de la ligne, ni le wagonnet, ni le manager ne le vendent. Le prix pièce des minerais est au **marché** (« Prix du marché »).

Message : « 💰 Vente : +X $ » (le « cha-ching » et la pluie de pièces). L'argent compte dans l'argent gagné (succès, classement). Pendant le bonus **« 💰 Ventes × 2 »**, la vente rapporte le double.

Les minerais des prix (bâtiments, améliorations, rails…) se prennent **dans le coffre** : une punaise sur ce qu'on veut garder suffit.

### ⬇ Descendre au palier suivant (onglet Améliorer)

- Une **grande carte** « ⬇️ Descendre au niveau *N* · *nom* », avec **ce qu'on y gagne** (`gainsNiveauSuivant`, `GainsNiveau`) :
  - **⬆️ Palier *N* : coffre, ascenseur, pioches, mineurs, foreuse… tout peut monter au niveau *N* !** (25/10) ;
  - ✨ le nouveau minerai et son prix ;
  - ⚙️ les blocs par minute que la mine sort toute seule (avant → après) ;
  - 👷 +1 mineur à embaucher au Personnel ;
  - 🏗️ les bâtiments débloqués (foreuse et générateur au niveau 2, fonderie au niveau 5, joaillerie au niveau 6), 💼 le manager (niveau 3), 🎲 le recruteur (niveau 4).
- Dessous, la ligne d'amélioration de la mine (`Amelioration`) : le bouton vert **Descendre** avec le prix, et le bouton violet **💎** pour payer en gemmes. Sans le niveau du joueur : « 🔒 ⭐ *N* ». Au niveau 7 (26/10 ; avant, au niveau 5) : « 🏆 Ta mine est au plus profond : le cœur de diamant ! ».

### 📦 Taille du coffre et 🛗 Ascenseur (onglet Améliorer)

- **Coffre** : « 300 places → **800 places** », avec son prix et le cadenas du palier (« 🕳️ Mine 3 »).
- **Ascenseur** : sa caisse remonte les blocs des mineurs ; chaque niveau la rend plus rapide et plus grande. Si les mineurs creusent plus qu'elle ne remonte : « ⚠️ Ascenseur trop petit : tes mineurs creusent *a* blocs/s, la caisse en remonte *b*. »

### Le tableau de production

Onglet **📊 Production** (`TableauProduction`) : en gros, le **total en blocs par seconde** (la mine toute seule + les mineurs + tes clics des 3 dernières secondes), puis trois étiquettes (⚙️ Mine, 👷 Mineurs, 👆 Toi), puis **une ligne par mineur** (son nom, sa rareté, ses blocs par seconde, ou « 😠 salaire » s'il attend sa paie). Coffre plein : « 📦 Coffre plein : la mine et les mineurs sont à l'arrêt ! ». Calculs purs dans `src/jeu/production.ts` (`production`, `analyseAscenseur`, `analyseWagonnet`, `chariotTropPetit`).

### Les trajets de wagonnets (onglet Wagonnets)

Un bloc **🛤️ Wagonnets** (`PanneauTrajets`) montre les trajets qui partent de la mine, vers le **marché** (💰, il vend le coffre), la **foreuse** (🔥, il lui apporte le charbon), le **générateur** (🔴, il lui apporte la redstone), et depuis le 26/10 la **fonderie** (🏭, le fer, l'or et le charbon du four) et la **joaillerie** (🏪, les gemmes) :

- **Sans rails** : ce qu'il faut relier (menu Bâtiments, 3 🔩 fer la case, à partir du niveau 2 du joueur).
- **Rails posés, pas de trajet** : « Touche la bulle 🛤️ Automatiser sur les rails » (la fenêtre du trajet s'ouvre aussi toute seule dès que les rails relient les deux bâtiments).
- **Trajet créé** : où en est son wagonnet et qui le pousse, et **⚙️ Régler** (26/10 : plus de « 🛒 Pousser ») (la fenêtre du trajet : l'activer ou l'arrêter, choisir les objets).
- Si le **chariot du pousseur** du marché ne suit pas ce que sort la mine : « 🛒 Le chariot de *Nom* est trop petit… », avec un bouton vers le Personnel (`AlerteChariot.tsx`).

## Les chiffres

### Les 7 niveaux de la mine (`NIVEAUX_MINE`)

Les poids de chaque niveau font 100 : ce sont donc directement les chances, en %.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Saphir | Rubis | Diamant | La mine sort seule | Prix pour y descendre | Niveau du joueur |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | — | — | 0,2 bloc/s (12 / min) | (départ) | — |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | — | — | 0,3 bloc/s (18 / min) | 800 $ + 40 fer | 3 |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | — | — | 0,4 bloc/s (24 / min) | 6 000 $ + 100 fer + 40 redstone | 5 |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | — | — | 0,5 bloc/s (30 / min) | 22 000 $ + 100 redstone + 50 or | 7 |
| 5 | Caverne de saphir (26/10) | 40 | 11 | 12 | 12 | 12 | 8 | 5 | — | — | 0,6 bloc/s (36 / min) | 80 000 $ + 90 or + 35 émeraude | 9 |
| 6 | Veine de rubis (26/10) | 36 | 10 | 12 | 11 | 12 | 9 | 7 | 5 | — | 0,7 bloc/s (42 / min) | 260 000 $ + 80 émeraude + 40 saphir | 11 |
| 7 | Cœur de diamant (26/10) | 32 | 10 | 11 | 11 | 12 | 9 | 8 | 7 | 5 | 0,8 bloc/s (48 / min) | 800 000 $ + 80 saphir + 50 rubis | 13 |

(Avant le 26/10, il n'y avait que 5 niveaux, et le 5e était le « Cœur de diamant » : les mêmes chances qu'aujourd'hui au niveau 5, avec le diamant à la place du saphir. Une partie qui y était reste au niveau 5, devenu la Caverne de saphir : voir [../jeu/sauvegarde-et-en-ligne.md](../jeu/sauvegarde-et-en-ligne.md).)

Total pour aller au niveau 7 : **1 168 800 $ + 140 fer + 140 redstone + 140 or + 115 émeraude + 120 saphir + 50 rubis** (26/10). Jusqu'au niveau 5 : 108 800 $ + 140 fer + 140 redstone + 140 or + 35 émeraude (25/10, économie revue : avant 402 800 $). Descendre d'un niveau rapporte **150 XP** (plus 1 XP par 25 $ de son prix).

Ce que vaut **en moyenne un bloc** au marché (sans doublement, `valeurMoyenneBloc`) : **3,04 $** au niveau 1, **4,58 $** au niveau 2, **7,50 $** au niveau 3, **13,07 $** au niveau 4, **20,79 $** au niveau 5, **31,62 $** au niveau 6, **46,37 $** au niveau 7 (avant le 26/10 : 19,79 $ au niveau 5).

Ce que **débloque** chaque niveau (en plus du palier) :

| Niveau | Ce qui se débloque |
|---|---|
| 1 | Mine, Personnel, Marché, Forgeron, rails (au niveau 2 du joueur) ; 1 mineur |
| 2 | **Foreuse** et **Générateur** (menu Bâtiments) ; la redstone ; 2 mineurs |
| 3 | **Manager** (au Personnel) ; l'or ; 3 mineurs |
| 4 | **Recruteur** (au Personnel) ; manager niveau 2 ; les émeraudes ; 4 mineurs |
| 5 | Les saphirs ; la **Fonderie** (menu Bâtiments) ; recruteur niveau 2, manager niveau 2 ; 5 mineurs |
| 6 | Les rubis ; la **Joaillerie** (menu Bâtiments) et ses joailliers ; recruteur niveau 3, manager niveau 3 ; 6 mineurs |
| 7 | Les diamants (le plus rare, tout au fond) ; 7 mineurs |

(Avant le 26/10 : le niveau 5 donnait les diamants, le recruteur niveaux 2 et 3 et le manager niveau 3 ; le manager niveau 2 arrivait au niveau 4.)

### Les paliers (25/10)

Chaque niveau de la mine est un **palier** : à la mine niveau N, toutes les améliorations du jeu peuvent monter **jusqu'à leur niveau N** (elles ont toutes 7 niveaux depuis le 26/10, `NIVEAUX_PAR_AMELIORATION` ; la fonderie et la joaillerie ont leurs propres paliers). La règle : **on améliore un niveau de chaque chose, puis on descend la mine.** Le tableau complet est dans [../jeu/niveaux.md](../jeu/niveaux.md#3-les-paliers-de-la-mine).

### Le coffre (`NIVEAUX_COFFRE`)

| Niveau | Places | Prix (25/10) | Palier |
|---|---:|---|---:|
| 1 | 100 | (départ) | — |
| 2 | 300 | 200 $ + 40 pierre | 2 |
| 3 | 800 | 2 000 $ + 80 fer | 3 |
| 4 | 2 000 | 6 000 $ + 60 redstone + 20 or | 4 |
| 5 | 5 000 | 18 000 $ + 60 or + 20 émeraude | 5 |
| 6 | 10 000 | 50 000 $ + 40 émeraude + 30 saphir | 6 |
| 7 | 20 000 | 150 000 $ + 50 saphir + 30 rubis | 7 |

Total : 226 200 $ + 40 pierre + 80 fer + 60 redstone + 80 or + 60 émeraude + 80 saphir + 30 rubis (26/10 ; jusqu'au niveau 5 : 26 200 $).

### L'ascenseur (`NIVEAUX_ASCENSEUR`)

Il ne transporte que les blocs des **mineurs employés** (le joueur ne descend pas). La mine l'a au **niveau 1 dès le début**. Sa caisse fait des allers-retours sans cesse tant qu'un mineur travaille au fond : elle descend, se charge, remonte, se vide dans le coffre, et repart. **Ce qu'il remonte au plus** (`debitAscenseur`) = capacité de la caisse ÷ (2 × trajet + chargement + vidage). (25/10 : 5 niveaux au lieu de 10 ; 26/10 : 7.)

| Niveau | Un trajet | Charge / vide | Caisse | Remonte au plus | Prix (25/10) | Palier |
|---|---:|---:|---:|---:|---|---:|
| 1 (au départ) | 6 s | 1 s / 2 s | 15 blocs | 1 bloc/s | — | — |
| 2 | 4,5 s | 0,9 s / 1,8 s | 25 | 2,1 bloc/s | 700 $ + 30 fer | 2 |
| 3 | 3,5 s | 0,8 s / 1,5 s | 40 | 4,3 bloc/s | 3 000 $ + 90 fer + 30 redstone | 3 |
| 4 | 2,6 s | 0,6 s / 1,2 s | 60 | 8,6 bloc/s | 8 000 $ + 100 redstone + 40 or | 4 |
| 5 | 2 s | 0,4 s / 0,8 s | 90 | 17,3 bloc/s | 22 000 $ + 80 or + 30 émeraude | 5 |
| 6 | 1,6 s | 0,35 s / 0,7 s | 130 | 30,6 bloc/s | 60 000 $ + 120 or + 30 saphir | 6 |
| 7 | 1,3 s | 0,3 s / 0,6 s | 180 | 51,4 bloc/s | 180 000 $ + 60 saphir + 30 rubis | 7 |

Total : 273 700 $ + 120 fer + 130 redstone + 240 or + 30 émeraude + 90 saphir + 30 rubis (26/10 ; jusqu'au niveau 5 : 33 700 $). Sous l'électricité du générateur (mine dans le rayon), les trajets sont plus courts. Si les mineurs creusent plus que ça, leurs sacs se remplissent au fond et ils attendent la caisse.

## Règles et comportement

### Le coffre

- **Tout ce qui sort de la mine y va** : tes clics, les blocs que la mine sort toute seule, et les blocs des mineurs (remontés par la caisse). La foreuse a son propre chariot.
- **Coffre plein = tout s'arrête** : le bloc ne se clique plus, la mine ne sort plus rien, et la caisse de l'ascenseur attend pleine en haut (les mineurs gardent leurs blocs dans leur sac, sans user leur salaire). Le « $/s » du bandeau tombe à 0 (ou en dessous, à cause des salaires).
- **On paie avec le coffre** : partout dans le jeu, les minerais d'un achat se prennent dans le coffre (`disponible`, `payer`) ; les lingots et les bijoux (26/10) aussi dans la réserve de leur atelier ; ou on paie en gemmes.
- Il se vide de trois façons : **la vente** (Tout vendre, ou un minerai), **les wagonnets** (vers le marché, la foreuse, le générateur, la fonderie, la joaillerie) et, depuis le 26/10, **« 📦 Apporter »** au panneau de la fonderie ou de la joaillerie (le minerai qu'elles acceptent, sauf ce qu'on garde 📌).

### La mine toute seule

- Elle sort **0,2 à 0,8 bloc par seconde** selon le niveau (`debit`), tant que le coffre a de la place, même jeu fermé (8 h au plus). Ces blocs ne sont **jamais doublés** et n'usent pas la pioche. Le bonus « ⚡ Production × 2 » double ce débit.
- Le bloc à cliquer, lui, n'est pas cassé par la mine : il attend ton clic.

### Les wagonnets

- Au début, **il n'y a aucun trajet**. Il faut une **ligne de rails continue** entre une case collée au bâtiment de départ et une case collée à celui d'arrivée (`ligneDe`, `railsEntre`), puis créer le trajet (la fenêtre du trajet s'ouvre toute seule quand les rails relient les deux bâtiments ; sinon, la bulle « 🛤️ Automatiser »). Les rails : **3 fer la case**, à partir du **niveau 2 du joueur**, jamais en boucle. Voir [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets).
- **10 trajets** depuis le 26/10 (4 avant), un wagonnet chacun (`LIAISONS`) : Mine → Marché, Mine → Foreuse, Mine → Générateur, Mine → Fonderie, Mine → Joaillerie (ils partent d'ici) ; Foreuse → Marché, Foreuse → Fonderie, Foreuse → Joaillerie (voir [foreuse.md](foreuse.md)) ; Fonderie → Marché et Joaillerie → Marché (voir [fonderie.md](fonderie.md) et [joaillerie.md](joaillerie.md)).
- **Ce qu'il emporte au départ**, jusqu'aux places du chariot de son pousseur (un peu de chaque objet s'il n'a pas la place pour tout, `repartir`) :
  - **vers le marché** : le coffre, **sauf les minerais épinglés 📌** et les objets décochés dans la fenêtre du trajet, et sauf le charbon et la redstone qui manquent à la foreuse et au générateur (si leurs trajets ont un pousseur), et (26/10) sauf le minerai qu'un trajet automatique doit apporter à la fonderie ou à la joaillerie, tant qu'elles ont de la place (`reservePourLesAteliers`). Au marché, il vend tout ;
  - **vers la foreuse** : dès que son réservoir n'est plus plein, tout le charbon du coffre ; le surplus va dans son chariot ;
  - **vers le générateur** : la redstone qui manque à sa réserve ;
  - (26/10) **vers la fonderie** : le fer et l'or choisis (les autres objets sont « Refusé ici »), sans dépasser la place de son entrée, et le charbon qui manque à son four ;
  - (26/10) **vers la joaillerie** : les gemmes choisies (émeraude, saphir, rubis, diamant), sans dépasser la place de son entrée.
- **Qui le fait avancer** : **son pousseur** (26/10 : le joueur ne le pousse plus lui-même), embauché au Personnel pour ce trajet. Il faut un pousseur payé pour qu'un trajet roule tout seul, **même électrique** ; sur un trajet électrique (toutes ses cases dans le rayon du générateur allumé), il va + 30 % à + 100 % plus vite. Voir [personnel.md](personnel.md#3-les-pousseurs) et [generateur.md](generateur.md).
- **Ligne coupée** (un rail enlevé, un bâtiment déplacé) : le wagonnet revient au quai, son chargement retourne d'où il vient, et une bulle **🚧 Rails coupés** est sur ses deux bâtiments.
- Les wagonnets roulent aussi jeu fermé (avec leur pousseur payé). Ce qu'ils vendent est en grand dans la fenêtre du retour.

### Descendre d'un niveau

- On paie le prix (argent + minerais du coffre, ou gemmes) et la mine passe au niveau suivant tout de suite : le bloc à cliquer est tiré au nouveau niveau, et les mineurs, la mine et la foreuse sortent les nouveaux minerais. Le coffre garde ce qu'il contenait. Le palier suivant est ouvert.
- Il n'y a **pas encore de fin** après le niveau 7 (26/10 ; avant, le niveau 5) : une « nouvelle mine » avec un bonus permanent est prévue.

## Lien avec le reste du jeu

- **Marché** : le wagonnet Mine → Marché y vend le coffre tout seul. **Forgeron** : la pioche décide de la chance de doubler en cliquant. **Personnel** : les mineurs remplissent le coffre, et les pousseurs (un par trajet) poussent les wagonnets. **Foreuse** et **Générateur** : débloqués au niveau 2 ; la mine peut leur envoyer leur charbon et leur redstone par wagonnet. **Fonderie** (niveau 5) et **Joaillerie** (niveau 6) : la mine leur envoie son fer, son or, son charbon et ses gemmes par wagonnet, ou à la main (« 📦 Apporter », dans leur panneau).
- **Tutoriel** (`tutoriel.ts`) : « casse 10 blocs à la mine », puis « vends le coffre » (la flèche montre « Tout vendre »).
- **Missions** (`missions.ts`, `objectifs.ts`) : « Casse 10 blocs à la mine », « Vends le coffre de la mine », l'urgence « Le coffre est plein : vends-le ! », les achats du stand `puits` (« Mine niveau *N* : *nom* », « Coffre de *N* places », « Ascenseur niveau *N* ») et les étapes de l'automatisation (« Construis le marché (gratuit) : le wagonnet y vendra tout seul », « Pose des rails de la mine au marché (3 fer la case) », « Touche la bulle 🛤️ sur les rails », « Embauche un pousseur pour le wagonnet »). Quand il manque de l'argent ou des minerais pour un achat, la mission envoie à la mine (on y vend, on y creuse).
- **Succès** : Premier coup de pioche, Terrassier (100 blocs), Tunnelier (1 000 blocs), Veine de redstone, Chercheur d'or, Grotte aux émeraudes, Caverne de saphir, Veine de rubis, Cœur de diamant (niveaux 2 à 7, 26/10), Ça brille ! (un diamant), Cheminot (un trajet), Réseau complet (4 trajets), Ligne régulière (100 voyages).
- **Classement** : l'argent gagné en tout (ventes du coffre comprises) ; le niveau de la mine (le meilleur de tes mondes) est seulement affiché. Voir [../jeu/sauvegarde-et-en-ligne.md](../jeu/sauvegarde-et-en-ligne.md).
- **Statistiques** : blocs cassés en cliquant (par sorte), blocs sortis tout seuls de la mine, voyages et argent des wagonnets, argent gagné « par toi » (le coffre vendu à la main).

## Fichiers du code

- `src/jeu/donnees.ts` : `BATIMENTS.puits`, `BLOCS`, `NIVEAUX_MINE`, `NIVEAUX_PAR_AMELIORATION`, `NIVEAUX_COFFRE`, `NIVEAUX_ASCENSEUR`, `BONUS_COMBO`, `COUT_RAIL`, les trajets (`LIAISONS`), les vitesses des wagonnets et `SECONDES_CHARGEMENT_WAGONNET`, `NIVEAU_JOUEUR_POUR.mine`.
- `src/jeu/mine.ts` : tirer un bloc selon le niveau (`tirerBloc`), les chances (`chancesDesBlocs`), la valeur moyenne d'un bloc (`valeurMoyenneBloc`), ce que rapporte le niveau suivant (`gainsNiveauSuivant`).
- `src/jeu/mineur.ts` : le coffre (`capaciteCoffre`, `rangerDansCoffre`, `agrandirCoffre`), la vente (`vendreCoffre`, `vendreMinerai`, `aVendreDuCoffre`, `encaisser`), la punaise (`basculerGarderTout`, `estGardeTout`, `reglerGarder`, `garderDansLeCoffre`), payer (`disponible`, `payer`, `acheterAvecGemmes`), le clic (`cliquerMine`), les bonus de combo, la mine toute seule (`avancerMine`, `debitMine`), les niveaux (`descendreNiveauMine`, `peutDescendre`) et l'ascenseur (`ameliorerAscenseur`, `debitAscenseur`).
- `src/jeu/niveaux.ts` : les cadenas (`debloque`, `verrou`, `palierRequis`).
- `src/jeu/wagonnet.ts` : les trajets (`ligneDe`, `creerTrajet`, `reglerTrajet`, `supprimerTrajet`), le chargement, la vitesse (`trajetElectrique`), le temps qui passe (`avancerWagonnets`).
- `src/jeu/village.ts` : la mine posée au milieu (`POSITION_MINE`, `nouveauVillage`), sa porte, les rails entre deux bâtiments (`railsEntre`), sans boucle (`feraitUneBoucle`).
- `src/jeu/notifications.ts`, `src/jeu/objectifs.ts`, `src/jeu/missions.ts`, `src/jeu/tutoriel.ts` : les bulles, les achats du stand `puits`, les missions, le tutoriel.
- `src/jeu/production.ts` : la production (`production`) et les goulots (`analyseAscenseur`, `analyseWagonnet`), testés dans `production.test.ts`.
- `src/composants/PanneauMine.tsx` : le panneau (bloc à cliquer, coffre, onglet Améliorer, wagonnets, production) ; `src/composants/StockMinerais.tsx` : le coffre à vendre (Tout vendre, Vendre, punaise 📌) ; `src/composants/PanneauTrajets.tsx` : le bloc des trajets ; `src/composants/Ascenseur.tsx` : la ligne de l'ascenseur ; `src/composants/Amelioration.tsx` : les lignes d'amélioration (argent ou 💎) ; `src/composants/AlerteChariot.tsx` : le chariot trop petit.
- `src/usePartie.ts` : le clic (`cliquer` : le son du coup, puis `cliquerMine`), les éclats et les minerais qui s'envolent.
- `src/composants/DessinsVillage.tsx`, `src/composants/VueVillage.tsx` : la caisse de l'ascenseur, le panneau du niveau.
- `public/images/batiments/mine.svg`, `mine-devant.svg`, `caisse-ascenseur-0.svg` à `-7.svg` (26/10 : une caisse par niveau de la mine, chacune avec le nouveau minerai) : les dessins, fabriqués par `node outils/art/fabriquer.mjs` (`outils/art/mine.mjs`) ; leurs points utiles (`POINTS_MINE`) sont dans `src/composants/iso.ts`.
- `src/styles/mine.css` : le style du panneau de la mine (25/10).
