# 🏡 Le village vu du ciel

> Depuis le 20/10, le village n'est plus un chemin avec des stands à la file : c'est une **clairière vue du ciel** (vue isométrique à 45°, façon Clash of Clans ou Hay Day), où le joueur **pose ses bâtiments où il veut**. Ce fichier décrit la grille, la construction, les rails, les chemins, les décorations, le menu Modifier, les bulles de notification, les personnages et les chargements qui partent au marché.
> Les chiffres viennent du code (`src/jeu/donnees.ts`, section « Le village en vue du ciel »). Chaque bâtiment a sa fiche dans [../batiments/](../batiments/README.md).

## Sommaire

1. [La clairière et sa grille](#1-la-clairière-et-sa-grille)
2. [Les bâtiments : les poser, les payer](#2-les-bâtiments--les-poser-les-payer)
3. [Le menu Modifier : déplacer et retourner](#3-le-menu-modifier--déplacer-et-retourner)
4. [Les rails et le wagonnet (prestige 2)](#4-les-rails-et-le-wagonnet-prestige-2)
5. [Les chemins et les décorations](#5-les-chemins-et-les-décorations)
6. [Les chargements qui vont au marché (convois)](#6-les-chargements-qui-vont-au-marché-convois)
7. [Les personnages](#7-les-personnages)
8. [Les bulles de notification](#8-les-bulles-de-notification)
9. [Entrer dans la mine et en sortir](#9-entrer-dans-la-mine-et-en-sortir)
10. [Au prestige, et les anciennes parties](#10-au-prestige-et-les-anciennes-parties)
11. [Fichiers du code](#11-fichiers-du-code)

## 1. La clairière et sa grille

- La clairière est une grille de **40 × 40 cases** (`TAILLE_GRILLE`). Sur l'écran, c'est un losange : la case (0, 0) est en haut, les x vont vers le bas à droite, les y vers le bas à gauche.
- Le décor est une seule grande image (`public/images/village/fond.webp`, 1 536 × 1 024 pixels) : herbe, forêt tout autour, plage et mer en bas à gauche. Une case y fait 33 pixels de large sur 19 de haut (`iso.ts`).
- **Tailles** : chaque bâtiment fait **5 × 5 cases**, la **mine 10 × 10**. Les rails, les chemins et les petites décorations font **1 case**, les arbres, la fontaine et la statue **2 × 2**.
- Au début d'une partie, la **mine est déjà posée au milieu** de la clairière (cases 15 à 24, `POSITION_MINE`), à peine creusée, et le hamster du joueur se tient devant son entrée. Rien d'autre n'est construit.
- On ne peut pas poser deux choses sur la même case (`empriseLibre`). Les rails et les chemins sont « au sol » : ils ne gênent personne, et une décoration ou un bâtiment ne peut pas être posé dessus.
- On **marche à travers** les rails, les chemins, les fleurs et les buissons ; les bâtiments, les arbres, les rochers, les tonneaux, les caisses, les lanternes, les bancs, la fontaine et la statue **bloquent le passage** (`bloque` dans `DECORATIONS`). Les personnages contournent ce qui bloque (recherche de chemin A\*, 8 directions, sans couper les coins : `trouverChemin` dans `village.ts`).
- Chaque bâtiment a une **porte**, sur sa face avant gauche ou sa face avant droite (`porte` dans `BATIMENTS`, inversée si le bâtiment est retourné). On y entre par la case devant la porte, ou, si elle est bouchée, par la case libre la plus proche autour du bâtiment (`caseAcces`).

## 2. Les bâtiments : les poser, les payer

Le menu **🏗️ Bâtiments** (barre du bas, au village) montre tous les bâtiments du jeu :

- débloqué et pas encore posé : son prix et un bouton **« 🏗️ Poser »** (grisé tant qu'on ne peut pas payer) ;
- pas encore débloqué : un **cadenas** et « 🔒 Prestige N » ;
- déjà posé : « ✔ Construit ».

Une pastille **« Nouveau ! »** marque un bâtiment tout juste débloqué, jusqu'à ce qu'on ouvre le menu (`batimentsVus`). Le bouton du menu a un **badge** qui compte les bâtiments nouveaux ou constructibles tout de suite. La barre « 🎯 prochain objectif » propose aussi « Construire : X » et ouvre le menu d'un clic.

| Bâtiment | Prix pour le poser | Débloqué au | Porte (sans miroir) |
|---|---|---|---|
| ⛏️ Mine (10 × 10) | déjà posée | prestige 0 | face avant gauche |
| 💰 Marché | **gratuit** (on commence avec 0 $) | prestige 0 | face avant gauche |
| ⚒️ Forgeron | 20 $ + 10 pierre | prestige 0 | face avant droite |
| 🎒 Bazar | 60 $ + 15 pierre | prestige 0 | face avant droite |
| 🔮 Enchanteur | 300 $ + 20 pierre + 5 fer | prestige 0 | face avant droite |
| 🌸 Arbre de prestige | 800 $ + 30 pierre + 10 fer | prestige 0 | face avant droite |
| ⚙️ Foreuse | 1 500 $ + 50 pierre + 20 fer | prestige 1 | face avant gauche |
| 👷 Personnel | 3 000 $ + 80 pierre + 30 fer | prestige 2 | face avant droite |

- Les matériaux se prennent dans le **sac**. La **pierre peut se payer en roche dure** (la pierre d'abord, puis la roche dure) : plus bas dans la mine il n'y a plus de pierre, et on ne doit jamais être bloqué (`pierreDisponible`, `payerConstruction`).
- Chaque bâtiment ne se construit **qu'une fois** et reste pour toujours (même au prestige).
- **Poser** : après « Poser », un **fantôme** du bâtiment suit la souris (ou le doigt) sur la carte, avec son losange vert (place libre) ou rouge (place prise). Barre du bas : **✔ Construire ici** (on paie à ce moment-là), **↔ Retourner** (miroir), **✖ Annuler** (ou Échap). On peut aussi faire glisser le fantôme.
- **Ouvrir un bâtiment** : on le touche (ou on clique dessus) : le hamster y marche, puis le panneau du bâtiment s'ouvre. On peut aussi y aller avec les flèches : le panneau s'ouvre dès qu'on arrive devant la porte (à 1,4 case près). Il ne s'ouvre pas tout seul quand le hamster *apparaît* devant (au chargement de la partie, en sortant de la mine). La croix ✖ le ferme.
- Sans marché posé, on ne peut pas vendre : le chargement de l'ascenseur attend à la mine (voir § 6).

## 3. Le menu Modifier : déplacer et retourner

Le bouton **✏️ Modifier** affiche la grille. On touche l'élément à changer (bâtiment, mine comprise, décoration, case de rail ou de chemin) : il devient un fantôme qu'on déplace comme au § 2.

- **✔ Poser ici** : déplacer est **gratuit**.
- **↔ Retourner** : le **miroir** gauche-droite (la porte change de côté). Pas de rotation à 90° (décidé le 20/10 : « normal et miroir uniquement »).
- **🗑️ Enlever** : seulement pour les décorations, les rails et les chemins, **sans remboursement**. Un bâtiment ne s'enlève pas.
- **✔ Terminé** (ou Échap) : on sort du mode.

Si on pose un bâtiment sur le hamster, il est poussé sur la case libre la plus proche.

## 4. Les rails et le wagonnet (prestige 2)

- Les rails sont dans le menu Bâtiments, débloqués au **prestige 2** (`PRESTIGE_RAILS`), **10 fer la case** (`COUT_RAIL`).
- « 🛤️ Poser des rails » ouvre le **pinceau** : chaque case touchée (ou survolée en faisant glisser le doigt) reçoit un rail si elle est libre et qu'on a le fer. « ✔ Terminé » pour finir.
- Les rails **se raccordent tout seuls** à leurs voisins (en ligne droite ou en **virage**), et aussi à la mine et au marché quand ils les touchent (`raccordsRail`).
- Une ligne **continue** (cases voisines par un côté, pas en diagonale) qui part d'une case collée à la mine et arrive à une case collée au marché **relie la mine au marché** (`railsMineMarche`, succès « Cheminot »). Alors :
  - le chargement de l'ascenseur, et la récolte des mineurs, partent en **wagonnet**, **3 fois plus vite** qu'à pied (12 cases par seconde au lieu de 4) ;
  - les mineurs ne marchent plus jusqu'au marché : ils posent leur récolte dans le wagonnet et redescendent tout de suite ;
  - le panneau de la Mine a une section **Wagonnet** : on y choisit des objets de son sac (jauges, comme au marché) et « Charger » les envoie au marché sans y aller.
- **Seuls les minerais** (les objets du sac) voyagent en wagonnet : les personnages marchent toujours.

## 5. Les chemins et les décorations

Le menu **🌸 Décos** ne sert qu'à faire joli (aucun effet sur le jeu), payé en argent :

- **🪨 Chemin de pavés** : **5 $ la case**, posé au pinceau comme les rails (on fait glisser le doigt pour en poser plusieurs à la suite).
- **Décorations** (un fantôme à poser, comme un bâtiment) :

| Décoration | Taille | Prix | On passe à travers ? | Débloquée au |
|---|---|---|---|---|
| Fleurs rouges | 1 × 1 | 15 $ | oui | prestige 0 |
| Fleurs jaunes | 1 × 1 | 15 $ | oui | prestige 0 |
| Fleurs violettes | 1 × 1 | 20 $ | oui | prestige 0 |
| Buisson | 1 × 1 | 30 $ | oui | prestige 0 |
| Rocher | 1 × 1 | 25 $ | non | prestige 0 |
| Tonneau | 1 × 1 | 40 $ | non | prestige 0 |
| Caisse de minerais | 1 × 1 | 120 $ | non | prestige 0 |
| Lanterne | 1 × 1 | 80 $ | non | prestige 0 |
| Banc | 1 × 1 | 60 $ | non | prestige 0 |
| Grand arbre | 2 × 2 | 150 $ | non | prestige 0 |
| Sapin | 2 × 2 | 150 $ | non | prestige 0 |
| Cerisier en fleurs | 2 × 2 | 600 $ | non | prestige 1 |
| Fontaine | 2 × 2 | 2 500 $ | non | prestige 2 |
| Statue du hamster d'or | 2 × 2 | 20 000 $ | non | prestige 4 |

On en pose autant qu'on veut (succès « Paysagiste » à 10 décorations). Elles se déplacent, se retournent et s'enlèvent avec ✏️ Modifier.

## 6. Les chargements qui vont au marché (convois)

Un **convoi** (`Convoi` dans `village.ts`, `convois.ts`) est un chargement en route de la mine vers le marché : il est **vendu en arrivant** (au prix du marché, bonus de prestige compris).

- **D'où ils viennent** : le chargement de l'**ascenseur** quand la cabine arrive en haut (il ne se vend plus en arrivant au village : il part au marché), le **wagonnet** chargé par le joueur, et la récolte des **mineurs** quand les rails relient la mine au marché.
- **Comment ils roulent** (`trajetChargement`) :
  - sur les rails : en **wagonnet**, `max(1, (cases de rails + 1) / 12)` secondes ;
  - sans rails : dans une **brouette**, à pied, `max(1, longueur du chemin / 4)` secondes, par le chemin le plus court entre la porte de la mine et celle du marché.
- On les voit rouler sur la carte. Pour les chargements du joueur, un message dit « 🛤️ Le wagonnet / 🛒 La brouette a vendu ton chargement au marché : +X $ ». L'argent des mineurs compte dans leurs gains et dans les statistiques des mineurs.
- **Sans marché** posé, le convoi attend à la mine ; il part dès que le marché est construit.
- Les convois continuent hors ligne (ils avancent avec le reste du temps qui passe, `temps.ts`).

## 7. Les personnages

Tous les personnages sont des **hamsters** dessinés en SVG (`Hamster.tsx`), de face ou de dos selon où ils vont, qui se retournent en douceur vers la gauche ou la droite, se dandinent en marchant et respirent à l'arrêt.

- **Le joueur** : un hamster **sans casque**, avec une pioche de la couleur de sa pioche équipée (rien à la main si elle est cassée). Sa tenue est basique au début ; au **Bazar**, on lui achète des **tenues** (chapeaux et hauts, voir [../batiments/bazar.md](../batiments/bazar.md)), gardées au prestige.
  - Il marche avec les **flèches du clavier** (dans les 4 directions de la grille, en glissant le long des obstacles), ou va tout seul là où on touche la carte (case ou bâtiment). Il marche à **5 cases par seconde** (`VITESSE_JOUEUR`), un peu plus vite que ses mineurs.
  - **Espace** : il saute (pour le plaisir, ça ne sert à rien pour l'instant).
  - La caméra le suit ; on peut aussi faire glisser la carte, zoomer à la molette ou en pinçant (elle revient sur lui quand il remarche).
- **Les mineurs employés** (prestige 2) : un hamster **casqué**, avec une lampe frontale, le casque de la **couleur de sa rareté** (la même que sa carte au Personnel : gris commun, bleu rare, violet épique, orange légendaire, rose mythique), sa pioche à l'épaule, son nom au-dessus de la tête. Ils creusent dans la **même mine** que le joueur, mais chacun dans son « univers parallèle » : dans la vue 2D, chacun a sa propre profondeur ; la mine commune a **une cabine d'ascenseur par mineur**. Leur cycle (`employes.ts`) :
  1. ils creusent au fond (étape `creuse`), puis remontent dans leur cabine quand leur sac est plein (`monte`) ;
  2. en haut : s'il y a des **rails** mine → marché, leur récolte part en wagonnet et ils redescendent ; sinon ils **marchent jusqu'au marché** (étape `marche`, 4 cases par seconde, avec leur sac sur le dos), y vendent **4 s** (`vend`), puis reviennent à la mine ;
  3. si on vient d'**améliorer leur pioche** et qu'un forgeron est posé, ils passent d'abord **3 s à la forge** (`forge`) la récupérer ;
  4. s'ils ne sont **plus payés**, ils vont **attendre devant le Personnel**, mécontents (😠 au-dessus de la tête, ils tapent du pied), ou sur place s'il n'y a pas de bâtiment Personnel ; ils repartent dès qu'on paie.
- **Le recruteur** (casquette verte, lunettes) et **le manager** (costume, cravate, porte-documents) restent **devant le bâtiment Personnel**, avec leur étiquette. Leurs portraits sont aussi en haut de leur carte, dans le panneau du Personnel.

## 8. Les bulles de notification

Au-dessus des bâtiments posés, des **bulles** sautillent pour dire qu'il y a quelque chose à faire (`notifications.ts`). On les touche pour aller au bâtiment. Une couleur par sorte, la plus urgente d'abord :

| Bulle | Bâtiment | Quand | Sorte (couleur) |
|---|---|---|---|
| 😠 | Personnel | des mineurs attendent leur salaire (ou la trésorerie du manager est vide) | alerte (rouge) |
| 🛒 | Foreuse | le chariot est plein | alerte |
| 🔥 | Foreuse | plus de charbon | alerte |
| 🔧 | Forgeron | la pioche est cassée | alerte |
| 🎒 | Marché | le sac est plein | alerte |
| ⭐ | Arbre de prestige | prêt pour le prestige | prêt (rose) |
| 🌟 | Arbre de prestige | des points de talent à dépenser | prêt |
| ✨ | le bâtiment concerné | une nouveauté (foreuse, Personnel, recruteur, manager…) pas encore vue | nouveau (bleu) |
| ⬆️ | le bâtiment concerné | de nouveaux niveaux après un prestige | niveaux (or) |
| 💰 | le bâtiment concerné | une amélioration est achetable | achat (vert) |

Les bulles ✨ et ⬆️ disparaissent quand on arrive devant le bâtiment.

## 9. Entrer dans la mine et en sortir

- On touche la mine : le panneau de la Mine s'ouvre avec le gros bouton **« ⛏️ Entrer dans la mine »** (et l'ascenseur, le wagonnet, la carte de l'ascenseur). Le bouton **⛏️ Mine** de la barre du bas fait pareil.
- Le hamster marche jusqu'à l'entrée, la caméra **plonge dans le trou** de la mine, l'écran s'assombrit, puis on retrouve la **vue 2D** de la mine d'avant (le puits, l'échelle, l'ascenseur, les galeries), en route vers le front de taille.
- Dans la mine, **🏠 Village** remonte (échelle ou ascenseur, comme avant). En arrivant en haut, l'écran se rallume sur le village, le hamster devant la mine.
- Le **dessin de la mine** au village se creuse avec la profondeur atteinte : de 1 à 6 paliers de plus en plus sombres, une lueur au fond quand on est bas ; une grue en bois au début, puis un chevalement avec poulie et cabine dès qu'on a l'ascenseur, et une petite poulie par mineur employé.

## 10. Au prestige, et les anciennes parties

- **Tout le village est gardé au prestige** : bâtiments (avec leur place et leur miroir), rails, chemins, décorations, et les tenues du joueur. Seuls les convois en route sont remis à zéro (comme l'argent).
- Le village est arrivé avec la **sauvegarde v18** : les parties des versions précédentes **repartent de zéro** (décidé le 20/10). L'écran d'accueil le dit sur la carte du monde. Voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## 11. Fichiers du code

| Fichier | Rôle |
|---|---|
| `src/jeu/donnees.ts` (section « Le village en vue du ciel ») | Grille, `BATIMENTS` (taille, porte, prestige, prix), rails, chemins, vitesses, `DECORATIONS`, `TENUES`. |
| `src/jeu/village.ts` | La géométrie : cases occupées, portes, cases d'accès, chemins à pied (A\*), rails mine → marché, raccords des rails, trajet d'un chargement, `envoyerAuMarche`. |
| `src/jeu/batiments.ts` | Les actions : construire, déplacer, retourner, poser et enlever rails et chemins, acheter et déplacer les décorations. |
| `src/jeu/convois.ts` | Les chargements en route vers le marché, le wagonnet. |
| `src/jeu/tenues.ts` | Acheter et porter les tenues. |
| `src/jeu/notifications.ts` | Les bulles au-dessus des bâtiments. |
| `src/jeu/employes.ts` | Le cycle des mineurs, au village compris. |
| `src/jeu/village.test.ts` | Les tests du village (construction, chemins, rails, convois, mineurs, notifications, tenues). |
| `src/composants/VueVillage.tsx` | La carte vue du ciel (caméra, toucher, glisser, pincer, fantôme, personnages, bulles). |
| `src/composants/iso.ts` | Case de la grille ↔ point de l'écran, calage des images des bâtiments, où se tiennent les personnages. |
| `src/composants/DessinsVillage.tsx` | Les dessins SVG : mine, rails, chemins, décorations, wagonnet. |
| `src/composants/ElementsVillage.tsx` | Un personnage posé sur la grille, l'image d'un bâtiment. |
| `src/composants/Hamster.tsx` | Les hamsters (joueur, mineur, manager, recruteur). |
| `src/composants/MenuConstruction.tsx` | Les menus Bâtiments et Décorations. |
| `src/composants/PanneauTenues.tsx` | Les tenues, au Bazar. |
| `src/composants/fantome.ts` | Ce qu'on est en train de poser ou de déplacer. |
| `src/useJoueurVillage.ts` | La marche du joueur (flèches, chemin jusqu'à une case, saut). |
| `src/App.tsx` | Les modes village / mine, les barres du bas, la construction, Modifier, l'entrée dans la mine. |
| `src/village.css` | Tout le style du village. |
| `public/images/village/`, `public/images/batiments/`, `public/images/personnages/` | Le décor, les images des bâtiments, les portraits. |
