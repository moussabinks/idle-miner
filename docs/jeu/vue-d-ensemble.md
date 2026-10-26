# Mega Digger : vue d'ensemble du jeu

> Le point d'entrée de la documentation : le concept, la boucle de jeu, la progression niveau de mine par niveau de mine, le vocabulaire et les choix de design.
> Tout est écrit d'après le code au **25/10, après « la grande mise à jour »** (`src/jeu/`, version de sauvegarde `VERSION_ETAT = 29`) : plus de sac à dos ni de bazar (on vend le coffre directement depuis la mine), un début de partie bien plus rapide, des **paliers** (tout a 5 niveaux, et le niveau N de chaque chose demande la mine au niveau N), le niveau du joueur plafonné à 15, une clairière de 40 × 40 cases, les **gemmes** (publicités, cadeau du jour, boutique), le classement à l'argent gagné, les personnages en **taupes** et la traduction anglaise. **Mis à jour le 26/10 (la grosse mise à jour des gemmes, `VERSION_ETAT = 30`)** : la mine a **7 niveaux** (saphir au 5, rubis au 6, le diamant tout au fond au 7), toutes les améliorations aussi, et deux **ateliers** arrivent : la **fonderie** (lingots) et la **joaillerie** (bijoux, taillés par un nouveau métier, le **joaillier**), avec 6 trajets de wagonnets de plus. Les chiffres détaillés et les formules sont dans [equilibrage.md](equilibrage.md), et chaque bâtiment a sa fiche dans [../batiments/](../batiments/README.md).

## Sommaire de la documentation

### Le jeu (`docs/jeu/`)

| Fichier | Contenu |
|---|---|
| [vue-d-ensemble.md](vue-d-ensemble.md) | Ce fichier : concept, boucle, progression par niveau de mine, glossaire, choix de design. |
| [niveaux.md](niveaux.md) | Le niveau du joueur (1 à 15) : gagner de l'XP, la courbe d'XP, ce que débloque chaque niveau (rails, niveaux de la mine), les gemmes de chaque niveau, et les **paliers** de la mine (7 depuis le 26/10). |
| [gemmes-et-recompenses.md](gemmes-et-recompenses.md) | **Nouveau (25/10)** : les gemmes 💎 : publicités, prix en gemmes des améliorations, boutique (bonus et trésor), cadeau du jour (série de 7 jours), absence doublée. |
| [village.md](village.md) | Le village vu du ciel : la grille de 40 × 40, poser et payer les bâtiments, Modifier, rails (sans boucle) et trajets de wagonnets, chemins, personnages, bulles de notification. |
| [mine-et-minage.md](mine-et-minage.md) | La mine à 7 niveaux (26/10) : les blocs (et les lingots et bijoux des ateliers), le bloc à cliquer, le coffre et sa vente, les pioches, la mine toute seule, le temps qui passe (et hors ligne), événements, découvertes, succès, statistiques. |
| [equilibrage.md](equilibrage.md) | Toutes les tables de données et les formules (blocs, niveaux, coffre, pioches, ascenseur, wagonnets, générateur, foreuse, fonderie et joaillerie, mineurs, raretés, bâtiments, revenus, niveau du joueur, gemmes), le bot de simulation et les durées de jeu. |
| [interface.md](interface.md) | L'écran : accueil, bandeau, tutoriel, carte du village, boutons, menus, panneaux, notifications, missions, téléphone. (Refait le 25/10 : style plat, taupes, dessins SVG.) |
| [visuel-et-sons.md](visuel-et-sons.md) | Le style graphique, les animations, les bruitages et la musique (Web Audio), l'application installable. (Refait le 25/10 : style plat, taupes, dessins SVG.) |
| [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md) | Les 5 mondes dans le stockage du navigateur, les conversions des vieilles parties, le hors-ligne, les comptes Supabase et le classement. |
| [architecture.md](architecture.md) | L'organisation du code (`src/jeu/` pur, composants React, `src/styles/`), les deux langues, la version CrazyGames, les tests et le déploiement. |

### Les bâtiments du village (`docs/batiments/`)

| Fichier | Bâtiment | Déblocage |
|---|---|---|
| [README.md](../batiments/README.md) | Index des bâtiments (taille, porte, prix de construction) | — |
| [mine.md](../batiments/mine.md) | ⛏️ Mine : bloc à cliquer, coffre (vendu d'un clic), 7 niveaux (les paliers), ascenseur, trajets des wagonnets qui en partent | dès le début (posée au milieu) |
| [personnel.md](../batiments/personnel.md) | 👷 Personnel : mineurs (des taupes), pousseurs, joailliers (26/10), salaires, manager, recruteur | dès le début (manager : mine niveau 3 ; recruteur : mine niveau 4 ; joailliers : avec la joaillerie) |
| [marche.md](../batiments/marche.md) | 💰 Marché : l'arrivée des wagonnets de la mine, de la foreuse et des ateliers (l'automatisation) | dès le début (gratuit) ; sert avec les rails (niveau 2 du joueur) |
| [forgeron.md](../batiments/forgeron.md) | ⚒️ Forgeron : pioches, doublement, réparation | dès le début |
| [foreuse.md](../batiments/foreuse.md) | ⚙️ Foreuse : machine au charbon qui fore seule ; son chariot se vend sur place | mine niveau 2 |
| [generateur.md](../batiments/generateur.md) | ⚡ Générateur : redstone, rayon électrique, trajets électriques | mine niveau 2 |
| [fonderie.md](../batiments/fonderie.md) | 🏭 Fonderie (26/10) : fond le fer et l'or en lingots (× 2), au charbon ; sa réserve se vend sur place  | mine niveau 5 |
| [joaillerie.md](../batiments/joaillerie.md) | 🏪 Joaillerie (26/10) : ses joailliers taillent les gemmes en bijoux (× 2,5) ; sa réserve se vend sur place | mine niveau 6 |

Autres documents du dépôt : la spec de la v1 Python ([../idle_miner_v1.md](../idle_miner_v1.md), référence historique des règles), la revue avant CrazyGames ([../revue-crazygames.md](../revue-crazygames.md)), l'état du projet et le journal ([../../CONTEXTE.md](../../CONTEXTE.md)), les règles de code ([../../CLAUDE.md](../../CLAUDE.md)). Ce qui a été retiré le 22/10 (prestige, talents, enchanteur) est rangé dans `archives/` (voir `archives/README.md`). Le **bazar** (les sacs à dos) est retiré le 25/10.

## Le concept

**Mega Digger** (ex-Idle Miner) est un *idle game* de minage inspiré de Minecraft, jouable dans le navigateur (et installable comme application, hors ligne), en français, et bientôt en anglais (25/10 : tous les textes passent par `t()`, la traduction anglaise `src/jeu/traductions/en.ts` reste à remplir). On incarne une **taupe** qui fait grandir sa mine et son village. Le jeu doit **tourner tout seul dès les premières minutes**.

Tout se passe **au village, vu du ciel** (vue isométrique, façon Clash of Clans) : une clairière de **40 × 40 cases**, avec la mine au milieu. On y **pose ses bâtiments où on veut**, des rails et des chemins, et on s'y promène. La mine est un bâtiment comme les autres, qu'on ouvre en le touchant. Voir [village.md](village.md).

La boucle en quatre mots, la même partout (accueil, tutoriel, aide, `etapesDuJeu.ts`) : **Creuse, Embauche, Automatise, Descends.**

- **Creuser** : devant la mine, un gros **bloc à cliquer**. Chaque clic casse un bloc (les clics rapides font un **combo**, et chaque palier du combo, 10, 25, 50… clics, donne un **bonus** de quelques secondes). Ce qui tombe va dans le **coffre de la mine**. La mine sort aussi **quelques blocs par seconde toute seule, dès le niveau 1**.
- **Vendre** : au panneau de la mine, **💰 Tout vendre** vend le coffre d'un clic, au prix du marché (ou un seul minerai). Une **punaise 📌** garde un minerai dans le coffre (pour payer ses améliorations). Plus de sac à dos, plus de marche jusqu'au marché.
- **Embaucher** : au **Personnel**, des **taupes mineuses** creusent au fond de la mine et remplissent le coffre toutes seules (le premier mineur ne coûte que 50 $) ; on paie leur salaire toutes les 5 minutes.
- **Automatiser** : on relie la mine au **marché** avec des **rails** : un wagonnet, poussé par toi ou par un **pousseur**, y vend le coffre tout seul, même jeu fermé. Puis le **générateur** électrifie les rails (le wagonnet va plus vite) et la **foreuse**. D'autres trajets emportent le charbon à la foreuse, la redstone au générateur, et le chariot de la foreuse au marché ; depuis le 26/10, le minerai aux ateliers et leurs produits au marché.
- **Descendre** : la mine a **7 niveaux** (26/10 ; 5 avant) : pierre, charbon et fer ; puis redstone ; or ; émeraudes ; saphirs ; rubis ; diamants. Chaque niveau est un **palier** : descendre au niveau N permet d'améliorer **tout le reste** (coffre, ascenseur, pioches, mineurs, pousseurs, foreuse, générateur) jusqu'à son niveau N. On améliore un niveau de chaque chose, puis on descend.
- **Transformer** (26/10) : au niveau 5, la **fonderie** fond le fer et l'or en lingots (2 fois le prix du minerai) ; au niveau 6, la **joaillerie** et ses **joailliers** taillent les gemmes en bijoux (2,5 fois le prix de la gemme). On leur apporte le minerai à la main ou en wagonnet, et on vend leur réserve d'un clic ou en wagonnet.
- **Monter de niveau** : tout ce qu'on fait rapporte de l'**XP**. Le **niveau du joueur** (⭐, de 1 à 15) débloque les rails (niveau 2) et les niveaux de la mine (3, 5, 7, 9, 11, 13), et **chaque niveau rapporte 1 gemme**. Voir [niveaux.md](niveaux.md).
- **Les gemmes** 💎 : une publicité regardée = 1 gemme ; elles paient n'importe quelle amélioration, ou un bonus à la boutique (production × 2, ventes × 2, clics en or, trésor). Le **cadeau du jour** récompense ceux qui reviennent chaque jour. Voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md).

Il n'y a pas encore de fin de partie : au niveau 7 (26/10 ; avant, le 5), on continue d'agrandir, d'embaucher et d'automatiser. Une **« nouvelle mine »** avec un bonus permanent est prévue pour la fin de partie (à partir du prestige rangé dans `archives/`).

Tout tient dans le navigateur (jusqu'à 5 mondes). Un compte facultatif (pseudo + mot de passe, Supabase, pas dans la version CrazyGames) recopie les mondes en ligne et place le joueur dans un **classement à l'argent gagné en tout**. Voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## La boucle de jeu

```
cliquer sur le bloc ─┐
la mine sort seule ──┼─► COFFRE de la mine ─► 💰 Tout vendre (d'un clic) ─► $ ─► améliorer, embaucher
les mineurs creusent ┘          │
                                ├─► rails + wagonnet (poussé, puis électrique) ─► marché ─► $ (même jeu fermé)
                                └─► (26/10) fonderie / joaillerie ─► lingots, bijoux ─► vendus sur place ou au marché ─► $
```

1. **Départ** : au village, devant la mine, avec **80 $**, une **pioche en pierre** offerte, un coffre de 100 places, l'ascenseur de niveau 1, et une mine qui sort déjà **0,2 bloc par seconde**. Rien d'autre n'est construit. Le **tutoriel** (Pépite, une taupe mineuse) fait faire les premiers pas jusqu'au moment fort : **casser 10 blocs**, **vendre le coffre** (depuis la mine), **construire le Personnel** (40 $) et **embaucher son premier mineur** (50 $). Après le « bravo », la liste des tâches guide sans obliger.
2. **Creuser** : on touche la mine (ou le bouton ⛏️ Mine) : le panneau s'ouvre, avec le bloc à cliquer. Au niveau 1 : 70 % de pierre, 18 % de charbon, 12 % de fer. La pioche s'use d'un point par clic ; cassée, il faut 2 clics par bloc.
3. **Vendre** : **💰 Tout vendre** (ou « Vendre » sur la ligne d'un minerai). On épingle 📌 le fer ou la pierre qu'on veut garder pour ses achats.
4. **Construire et améliorer** : forgeron (30 $ + 15 pierre : la pioche en fer arrive avec la mine niveau 2), Personnel (mineurs : 50 $, puis 800 $, 3 000 $… et un salaire de 120 $ toutes les 5 minutes), mine (coffre, niveau suivant, ascenseur). Chaque chose faite rapporte de l'XP.
5. **Les rails** (3 fer la case, au **niveau 2 du joueur**) : une ligne continue de la mine au **marché** (gratuit, jamais en boucle). Dès que les rails relient deux bâtiments, la fenêtre du trajet s'ouvre (ou la bulle **« 🛤️ Automatiser »**) : le wagonnet emporte le coffre au marché, l'y vend et revient. Il faut le **pousser** : toi, ou un **pousseur** (300 $) embauché au Personnel pour ce trajet.
6. **Niveau 2 de la mine** (800 $ + 40 fer, au niveau 3 du joueur) : la redstone arrive, avec la **foreuse** et le **générateur**, et le **palier 2** : coffre de 300 places, pioche en fer, ascenseur 2, mineurs en pioche de fer, etc. Le générateur brûle la redstone (1 redstone = 30 s) et électrifie un cercle de 12 cases autour de lui : si **tous les rails d'un trajet** sont dedans, son pousseur va plus vite.
7. **Niveaux 3 et 4** : or (et le **manager**, qui paie les salaires tout seul), émeraudes (et le **recruteur**, pour des mineurs rares). Chaque niveau permet **1 mineur de plus** (1 au niveau 1, 7 au niveau 7) et débloque le palier suivant.
8. **Niveaux 5, 6 et 7** (26/10) : saphirs (et la **fonderie**), rubis (et la **joaillerie**, avec ses **joailliers**), puis enfin les diamants, tout au fond (le **Cœur de diamant**).

Pendant ce temps, la **mine toute seule**, les **mineurs** (tant qu'on paie leur salaire), la **foreuse** (tant qu'elle a du charbon), la **fonderie** et les **joailliers** (26/10) et les **wagonnets** (avec leur pousseur) continuent quand le jeu est fermé (rattrapage de **8 h au plus**). Les clics, eux, non. Au retour, la fenêtre **« Bon retour, mineur ! »** vend tout seul le coffre de la mine (et, 26/10, la réserve des ateliers) et montre le **bénéfice net** de l'absence (salaires déduits), avec **📺 Doubler** (une publicité). Les bonus de la boutique s'usent aussi pendant l'absence.

## La progression, niveau de mine par niveau de mine

| Niveau | Nom | Nouveau minerai | Prix pour y descendre | Niveau du joueur | La mine sort seule | Mineurs au plus | Ce qui se débloque | Le bot y arrive vers |
|---|---|---|---|---|---|---|---|---|
| **1** | Galerie de surface | pierre, charbon, fer | (départ) | — | 0,2 bloc/s (12 / min) | 1 | Personnel, Marché, Forgeron ; rails au niveau 2 du joueur ; palier 1 | 0 min |
| **2** | Veine de redstone | redstone | 800 $ + 40 fer | 3 | 0,3 bloc/s (18 / min) | 2 | **Foreuse**, **Générateur** ; palier 2 | ~4 min |
| **3** | Filon d'or | or | 6 000 $ + 100 fer + 40 redstone | 5 | 0,4 bloc/s (24 / min) | 3 | **Manager** (paie les salaires) ; palier 3 | ~24 min |
| **4** | Grotte aux émeraudes | émeraude | 22 000 $ + 100 redstone + 50 or | 7 | 0,5 bloc/s (30 / min) | 4 | **Recruteur** (rareté des mineurs) ; palier 4 | ~54 min |
| **5** | Caverne de saphir (26/10) | saphir | 80 000 $ + 90 or + 35 émeraudes | 9 | 0,6 bloc/s (36 / min) | 5 | **Fonderie** ; recruteur et manager niveau 2 ; palier 5 | ~1 h 40 |
| **6** | Veine de rubis (26/10) | rubis | 260 000 $ + 80 émeraudes + 40 saphirs | 11 | 0,7 bloc/s (42 / min) | 6 | **Joaillerie** et joailliers ; recruteur et manager niveau 3 ; palier 6 | ~2 h 57 |
| **7** | Cœur de diamant (26/10) | diamant | 800 000 $ + 80 saphirs + 50 rubis | 13 | 0,8 bloc/s (48 / min) | 7 | palier 7 (le dernier) | ~5 h 08 |

Les temps du bot (médiane de 10 parties, voir [equilibrage.md](equilibrage.md#le-bot-de-simulation)) donnent l'ordre de grandeur pour un joueur qui clique 2 fois par seconde : niveau 2 en 2 à 10 minutes, niveau 5 en 1 h à 3 h (un vrai joueur met plutôt 2 h 30 à 4 h), et (26/10) niveau 7 en 3 h à 7 h. Avant le 26/10, la mine s'arrêtait au niveau 5 (le diamant), et le manager niveau 2 arrivait au niveau 4. Le 25/10, l'économie a été revue (paliers 3 à 5 et embauches moins chers) : avant, il fallait 3 h à 6 h pour le niveau 5. Avant le 25/10, il fallait 15 à 40 minutes pour le niveau 2 et 6 à 9 h pour le niveau 5. Le détail des niveaux du joueur est dans [niveaux.md](niveaux.md).

## Glossaire

| Terme | Sens dans le jeu |
|---|---|
| **Archives** | Le dossier `archives/` du dépôt : le code et les fiches mis de côté le 22/10 (prestige, talents, enchanteur). Ils ne sont plus compilés. |
| **Ascenseur** | Au panneau de la mine (7 niveaux) : sa caisse remonte les blocs des **mineurs** du fond de la mine jusqu'au coffre (de 1 à 51 blocs/s). La mine l'a au niveau 1 dès le début. Le joueur ne le prend pas. |
| **Atelier** | (26/10) La fonderie ou la joaillerie : un bâtiment qui transforme ce qui sort de la mine. Il a une **entrée** (le minerai qui attend) et une **réserve** (ce qu'il a fabriqué, à vendre). Voir [../batiments/fonderie.md](../batiments/fonderie.md) et [../batiments/joaillerie.md](../batiments/joaillerie.md). |
| **Bâtiment** | Ce qu'on pose dans la clairière (5 × 5 cases, la mine 10 × 10) : Mine, Personnel, Marché, Forgeron, Foreuse, Générateur, et depuis le 26/10 Fonderie et Joaillerie. Chacun se construit une fois, depuis le menu 🏗️ Bâtiments. On l'ouvre en le touchant. |
| **Bloc à cliquer** | Le gros bloc du panneau de la mine : chaque clic le casse (2 clics avec une pioche cassée) et en tire un nouveau. |
| **Bonus (de la boutique)** | (25/10) Production × 2 (15 min), Ventes × 2 (10 min), Clics en or (3 blocs par clic, 5 min), achetés en gemmes ou offerts par le cadeau du jour. Voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md). |
| **Bonus de combo** | Chaque palier de combo (10, 25, 50, 100, 200, 500 clics d'affilée) donne quelques secondes de « fortune » (plus de chance de doubler), puis 2, 3 ou 5 blocs par clic (`BONUS_COMBO`). |
| **Bijou** | (26/10) Ce que taillent les joailliers à la joaillerie : collier d'émeraude, pendentif de saphir, couronne de rubis, bague de diamant (200 à 600 $, 2,5 fois la gemme). |
| **Bonus du générateur** | + 30 % à + 100 % de vitesse (26/10 ; + 75 % au plus avec 5 niveaux) pour l'ascenseur, les pousseurs d'un trajet électrique, la foreuse, la fonderie et les joailliers dans son rayon. |
| **Boutique** | (25/10) La fenêtre des gemmes (case 💎 du bandeau) : une publicité pour gagner une gemme, les bonus et le trésor. |
| **Cadeau du jour** | (25/10) Une récompense par jour (gemmes, argent, parfois un bonus) ; revenir tous les jours fait monter la série jusqu'au gros lot du 7e jour. |
| **Carburant** | Le charbon de la foreuse (1 charbon = 20 s), du four de la fonderie (1 charbon = 12 s, 26/10) ou la redstone du générateur (1 redstone = 30 s), comptés en secondes. |
| **Chariot (de la foreuse)** | Là où la foreuse range ce qu'elle fore (25 à 400 places). On le **vend sur place** d'un clic, ou le wagonnet Foreuse → Marché l'emporte. |
| **Chariot (d'un pousseur)** | Les places du wagonnet de son trajet (20 à 400), qu'on agrandit au Personnel. |
| **Chef** | Le manager et le recruteur : 3 niveaux chacun (`PALIER_CHEF` : le dernier au palier 6 depuis le 26/10). |
| **Chemin (de pavés)** | Des pavés au sol (5 $ la case), seulement pour faire joli. |
| **Clairière** | Le village vu du ciel : une grille de **40 × 40 cases** (60 × 60 avant le 25/10), entourée de forêt et d'une plage, avec la mine au milieu. |
| **Coffre (de la mine)** | Là où va tout ce qui sort de la mine (clics, mine toute seule, mineurs) : 100 à 20 000 places. Plein, tout s'arrête. On le vend d'un clic ; ses minerais servent aussi à payer. |
| **Combo** | Les clics rapides sur le bloc de la mine (moins de 0,9 s entre deux) : « 🔥 ×*N* ». |
| **Débit (de la mine)** | Les blocs que la mine sort toute seule : 0,2 à 0,8 par seconde selon le niveau. |
| **Découverte** | Le manager (niveau 3) et le recruteur (niveau 4) : une bulle ✨ saute au-dessus du Personnel jusqu'à ce qu'on y passe. |
| **Doublement** | La chance qu'un clic donne 2 minerais au lieu d'1 : 10 % (pioche en pierre) à 60 % (diamant, 26/10). Jamais pour la pierre, ni pour la mine toute seule, les mineurs ou la foreuse. |
| **Durabilité / usure** | Chaque pioche tient un nombre de clics (150 à 1 700) ; chaque bloc cassé lui retire 1 point. À 0, elle est cassée. |
| **Électricité** | Ce que donne le générateur dans son rayon : rails électriques (le pousseur va plus vite), foreuse, fonderie et joailliers plus rapides. |
| **Employé** | Une taupe embauchée au Personnel, tant qu'on paie son salaire. Trois métiers : le **mineur** creuse au fond de la mine (la caisse de l'ascenseur remonte ses blocs) ; le **pousseur** pousse le wagonnet d'un seul trajet ; le **joaillier** (26/10) taille les gemmes à la joaillerie. |
| **Fonderie** | (26/10) Atelier du niveau 5 : elle fond le fer et l'or en lingots, en brûlant du charbon. 5 niveaux. Voir [../batiments/fonderie.md](../batiments/fonderie.md). |
| **Foreuse** | Machine du niveau 2 : au charbon, elle fore seule dans son chariot, plus vite dans le rayon du générateur. Une seule foreuse, 7 niveaux de forage et de chariot. |
| **Gemme** 💎 | (25/10) La monnaie bonus (à ne pas confondre avec les gemmes de la mine, émeraude, saphir, rubis et diamant, que taille la joaillerie) : 1 par publicité, 3 par niveau du joueur, et le cadeau du jour. Elle paie n'importe quelle amélioration (sans argent ni minerais) ou un bonus. Voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md). |
| **Générateur** | Bâtiment du niveau 2 : il brûle de la redstone et accélère ce qui est dans un cercle autour de lui (12 à 28 cases). 7 niveaux. |
| **Hors ligne** | Quand on rouvre un monde, le temps écoulé (8 h au plus) est rattrapé : mine, générateur, foreuse, mineurs, manager, fonderie et joailliers, wagonnets. Les clics non. La fenêtre « Bon retour, mineur ! » le résume, et une publicité peut le doubler. |
| **Indemnités** | Ce que coûte un licenciement : 40 % du prix de la dernière place de son métier. |
| **Joaillerie** | (26/10) Atelier du niveau 6 : ses joailliers (embauchés au Personnel) taillent les gemmes en bijoux. 5 niveaux (1 à 5 établis). Voir [../batiments/joaillerie.md](../batiments/joaillerie.md). |
| **Joaillier** | (26/10) Le troisième métier du Personnel : il taille une gemme à la fois à son établi de la joaillerie (1 500 $ / 5 min × sa rareté). |
| **Ligne (de rails)** | Une suite de rails continue entre deux bâtiments. Les rails ne font jamais de boucle : entre deux bâtiments, une seule route. Sans ligne, pas de trajet. |
| **Manager** | Débloqué au niveau 3 de la mine (5 000 $, puis 400 $ / 5 min) : il paie tous les salaires seul, avec l'argent du joueur, tant qu'il est éveillé (30 min, 1 h ou 2 h selon son niveau). Un interrupteur l'arrête. |
| **Lingot** | (26/10) Ce que fond la fonderie : lingot de fer (24 $) et lingot d'or (70 $), 2 fois le minerai. |
| **Marché** | Le bâtiment où arrivent les wagonnets : ils y vendent tout seuls. Il ne sert plus qu'à l'automatisation (25/10). |
| **Minerai** | Un bloc qu'une pioche peut doubler : charbon, fer, redstone, or, émeraude, saphir, rubis, diamant (tout sauf la pierre ; ni les lingots, ni les bijoux). |
| **Mission / tâche** | Une à trois choses à faire, en haut à droite : une urgence (salaires, coffre plein), un premier pas, un bâtiment, une étape de l'automatisation, ou l’amélioration la plus proche : seulement des choses faisables (25/10). |
| **Modifier (✏️)** | Le mode pour déplacer (gratuit), retourner ou enlever ce qui est posé au village. |
| **Monde** | Une partie séparée (jusqu'à 5), choisie sur l'écran d'accueil. |
| **Niveau du joueur** | De 1 à **15**, gagné avec l'**XP** : il débloque les rails (2) et les niveaux de la mine (3, 5, 7, 9, 11, 13) ; chaque niveau rapporte 1 gemme. Ne pas confondre avec le niveau de la mine. |
| **Niveau de la mine** | De 1 à 7 (26/10 ; 5 avant) : il décide des blocs qui sortent, du débit, du nombre de mineurs, des bâtiments, et c'est le **palier** de toutes les améliorations. |
| **Paie / salaire** | Ce que coûtent 5 minutes de travail d'un employé (selon sa pioche ou son niveau, ou fixe pour un joaillier, et sa rareté). Sans manager, on paie au plus 5 minutes d'avance. |
| **Palier** | (25/10) Le niveau de la mine vu comme une marche : à la mine niveau N, toutes les améliorations peuvent monter jusqu'à leur niveau N (les chefs : `PALIER_CHEF` ; la fonderie et la joaillerie : `PALIER_FONDERIE`, `PALIER_JOAILLERIE`). Un cadenas « 🕳️ Mine N » le rappelle. |
| **Pousseur** | Un employé embauché pour **un** trajet de wagonnet : il attend au quai et pousse le wagonnet (2,5 cases/s × sa vitesse). Il en faut un par trajet automatique, même électrique. |
| **Publicité** | (25/10) Toujours au choix : 1 gemme, ou l'absence doublée. Pour l'instant une fausse publicité de 30 s ; sur CrazyGames, leur publicité récompensée. |
| **Punaise 📌** | (25/10) Sur la ligne d'un minerai du coffre : le **garder** (ni « Tout vendre », ni le wagonnet ne l'emportent), pour payer ses améliorations. |
| **Quai** | Le départ d'un trajet (devant la mine, la foreuse ou un atelier) : le wagonnet et son pousseur y attendent. |
| **Rails** | 3 fer la case, à partir du niveau 2 du joueur : une ligne entre deux bâtiments permet d'y créer un trajet de wagonnet. Remboursés quand on les retire. |
| **Rareté** | Commun, rare, épique, légendaire, mythique : tirée à l'embauche quand on a le recruteur. Multiplie la vitesse et le sac du mineur, ou la vitesse du joaillier (× 1 à × 5), et son salaire (× 1 à × 4). |
| **Rayon** | Le cercle (en cases) autour du générateur où tout est électrique. |
| **Recruteur** | Débloqué au niveau 4 de la mine (3 niveaux : 10 000, 40 000 et 140 000 $, 26/10) : donne une rareté aux employés embauchés, et permet de **remplacer** un mineur ou un joaillier. |
| **Réserve (d'un atelier)** | (26/10) Ce que la fonderie ou la joaillerie a fabriqué (ses lingots, ses bijoux) : on la vend d'un clic, ou un wagonnet l'emporte au marché. Pleine, l'atelier s'arrête. |
| **Revenu ($/s)** | L'estimation de ce que la mine produit par seconde (mine toute seule, mineurs moins salaires, foreuse, et ce qu'ajoutent les ateliers), dans le bandeau. Les clics ne comptent pas. |
| **Succès** | 28 accomplissements (`succes.ts` ; 21 avant le 26/10). |
| **Taupe** | (25/10) Tous les personnages : le joueur, les mineurs, les pousseurs et les joailliers (casque de la couleur de leur rareté), le manager, le recruteur, et Pépite du tutoriel. Avant, des hamsters. |
| **Trajet** | Un wagonnet entre deux bâtiments, créé par le joueur sur ses rails : Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché, et (26/10) Mine → Fonderie, Mine → Joaillerie, Foreuse → Fonderie, Foreuse → Joaillerie, Fonderie → Marché, Joaillerie → Marché. Un wagonnet par trajet. |
| **Village** | La clairière vue du ciel, où tout se passe. Voir [village.md](village.md). |
| **Wagonnet** | Le chariot qui roule sur les rails, un par trajet : il charge au départ, livre à l'arrivée (vend au marché, apporte charbon ou redstone, ou le minerai d'un atelier) et revient. Poussé par toi (3 cases/s) ou par son pousseur (2,5 cases/s × sa vitesse, plus vite sous électricité). |
| **XP** | Les points d'expérience du joueur : 1 pour 3 blocs cassés en cliquant, 70 par bâtiment, 3 par case de rails, 30 par trajet, 40 par embauche, 30 par niveau d'amélioration, 150 par niveau de mine, et 1 par 25 $ dépensés. Une chose ne rapporte qu'une fois. |

Plus utilisés depuis le 25/10 : le **sac à dos** et le **bazar** (on vend le coffre directement), les **objets gardés** du marché (remplacés par la punaise 📌), les **niveaux 16 à 30** du joueur (plafond à 15), l'**échelle** (seulement dans de très vieilles parties).

## Les choix de design (à respecter)

Hérités de la v1 Python ([../idle_miner_v1.md](../idle_miner_v1.md)) et des décisions de l'équipe (voir [../../CLAUDE.md](../../CLAUDE.md) et [../../CONTEXTE.md](../../CONTEXTE.md)) :

### Interdit

- ❌ **Pas de creepers** (retirés à la demande de l'auteur de la v1).
- ❌ **Pas de prix du marché variables** : chaque bloc a un prix fixe (les bonus « Ventes × 2 » ne changent pas les prix, ils doublent la vente).
- ❌ **Pas de quêtes du marchand.**
- ❌ **Pas de publicité obligatoire** : elles restent toujours au choix, jamais pour débloquer la progression.

### Les principes

- ✅ **Le jeu tourne tout seul dès les premières minutes** (25/10) : la mine sort des blocs dès le niveau 1, le premier mineur ne coûte presque rien, puis les wagonnets vendent même jeu fermé.
- ✅ **Les paliers** (25/10) : tout a autant de niveaux que la mine (7 depuis le 26/10, 5 avant), et le niveau N de chaque amélioration demande la mine au niveau N (les chefs et les ateliers ont leurs propres paliers). Personne n'est en avance ni en retard.
- ✅ **L'automatisation**, avec ses exceptions décidées : la foreuse (une seule), la fonderie et la joaillerie (une de chaque, 26/10), les employés (payés toutes les 5 minutes), la mine qui sort des blocs toute seule et les wagonnets. Il faut **un pousseur par trajet automatique**, même électrique.
- ✅ **On n'est jamais bloqué** : la mine tourne toute seule, une pioche cassée casse encore un bloc tous les 2 clics, la pioche en pierre se répare pour presque rien, les autres pioches se rachètent neuves.
- ✅ **Une alerte, un seul endroit** : un état (coffre plein, pioche cassée, plus de charbon, réserve d'un atelier pleine) = une bulle sur le bâtiment ; un conseil = la liste des tâches ; un événement = un message (au plus 3 à la fois).
- ✅ **Sauvegarde** dans le navigateur (par `src/stockage.ts`, qui ne plante jamais), jusqu'à 5 mondes ; le jeu marche toujours sans réseau. Une vieille partie est **convertie**, jamais perdue.
- ✅ **Tout en français dans le code**, et le jeu prêt pour **deux langues** (français et anglais : chaque texte affiché passe par `t()`).
- ✅ **Un seul style** (25/10) : cartoon simple et coloré, contours bleu nuit épais, ombres dures, fenêtres crème (voir [../../CLAUDE.md](../../CLAUDE.md), section « Le style ») ; sons fabriqués avec Web Audio.
- ✅ **Le village se construit librement** : on pose chaque bâtiment où l'on veut, on peut tout déplacer et retourner gratuitement.
- ✅ **Jouable au téléphone** (gros boutons ronds en bas, fenêtres qui montent du bas) et installable (PWA, hors ligne ; pas dans la version CrazyGames).
- Le **prestige** (avec ses talents) et l'**enchanteur** sont **retirés pour l'instant** (22/10) : leur code est dans `archives/`. Une « nouvelle mine » avec un bonus permanent est prévue pour la fin de partie.
