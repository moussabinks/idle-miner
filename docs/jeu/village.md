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

- La clairière est une grille de **60 × 60 cases** (`TAILLE_GRILLE`, agrandie le 21/10 : elle faisait 40 × 40). Sur l'écran, c'est un losange : la case (0, 0) est en haut, les x vont vers le bas à droite, les y vers le bas à gauche.
- **Le terrain est dessiné par le jeu** (21/10, `TerrainVillage` dans `DessinsVillage.tsx`), il n'y a plus d'image de décor qu'on agrandit (elle devenait floue) :
  - **le sol de la clairière est un damier** vert clair / vert foncé, une case sur deux, comme le sol de Clash of Clans. Le quadrillage n'est jamais tracé : on devine les cases grâce au damier, et elles ne servent qu'à poser les bâtiments ;
  - **entre le damier et la forêt, une transition douce** : le bord du damier s'efface sur une case dans une herbe un peu plus foncée, puis une large auréole d'herbe se fond dans le sous-bois sombre ;
  - **la forêt** : les **12 arbres dessinés par l'équipe** (feuillus, sapins, palmiers, bambous, saules…), upscalés par IA et détourés (`public/images/village/arbres/`), au même angle que les bâtiments (leur petite dalle d'herbe a le même rapport que les cases). Le jeu en plante environ 1 300 tout autour de la clairière, toujours aux mêmes places (hasard à graine fixe, `ForetVillage.tsx`) : le **premier rang** (la lisière) est planté **bien en ligne** (22/10) : tous les troncs à la même distance du bord (1,3 case, `DISTANCE_LISIERE`), au même écart (environ 2,2 cases, `ECART_LISIERE`, les coins tombent juste) ; derrière ce rang (au moins 1,5 case plus loin), les arbres sont plus libres et de plus en plus serrés, et au fond de plus gros arbres un peu plus sombres (effet de profondeur). Les arbres du bas de la carte passent devant les bâtiments et les personnages. Pour rester fluide, ils sont dessinés dans des tuiles de « toile » (canvas) de 384 pixels du monde, redessinées plus finement après un zoom pour celles qu'on voit ;
  - **des petits détails sur l'herbe** (22/10, `DetailsHerbe` dans `DessinsVillage.tsx`) : des touffes d'herbe foncée, des brins plus clairs, de temps en temps une petite fleur (blanche, jaune, rose ou mauve) ou un caillou, environ deux pour trois cases, toujours aux mêmes places (hasard à graine fixe). Ils sont au sol : bâtiments, chemins et personnages passent par-dessus ;
  - **la caméra est bornée** (`LIMITES_CAMERA` dans `iso.ts`) : on ne peut ni la faire glisser ni dézoomer au-delà de la clairière et d'une bande de forêt. On ne voit donc jamais de bord de décor.
- Une case fait 33 pixels du monde de large sur 19 de haut (`DEMI_LARGEUR` = 16,5 et `DEMI_HAUTEUR` = 9,57 dans `iso.ts`, des constantes qui ne dépendent plus de la taille de la grille). Le monde fait donc 2 262 × 1 407 pixels (`LARGEUR_MONDE`, `HAUTEUR_MONDE`).
- **Tailles** : chaque bâtiment fait **5 × 5 cases**, la **mine 10 × 10**. Les rails, les chemins et les petites décorations font **1 case**, les arbres, la fontaine et la statue **2 × 2**.
- Au début d'une partie, la **mine est déjà posée au milieu** de la clairière (cases 25 à 34, `POSITION_MINE` = 25, 25), à peine creusée, et le hamster du joueur se tient devant son entrée. Rien d'autre n'est construit.
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
| ⚡ Générateur | 1 000 $ + 40 pierre + 15 fer | prestige 0 | face avant droite |

Le **générateur** (ajouté le 22/10 avec son dessin) ne sert encore à rien : son rôle sera décidé plus tard. On peut déjà le poser, mais il n'est jamais proposé dans le « prochain objectif ».

- Les matériaux se prennent dans le **sac**. La **pierre peut se payer en roche dure** (la pierre d'abord, puis la roche dure) : plus bas dans la mine il n'y a plus de pierre, et on ne doit jamais être bloqué (`pierreDisponible`, `payerConstruction`).
- Chaque bâtiment ne se construit **qu'une fois** et reste pour toujours (même au prestige).
- **Poser, en deux temps** (21/10) : après « Poser », un **fantôme** du bâtiment suit la souris sur la carte, avec son losange vert (place libre) ou rouge (place prise). **Un clic sur la carte le fixe à cet endroit** (sans rien construire) : il ne suit plus la souris, et on peut aller jusqu'au bouton. Un autre clic le déplace (il reste fixé), et on peut aussi le faire glisser. Barre du bas : **✔ Construire ici** (on paie à ce moment-là), **↔ Retourner** (miroir), **✖ Annuler** (ou Échap). Sur téléphone, il suffit de toucher la carte à l'endroit voulu.
- **Ouvrir un bâtiment** (21/10) : on le touche (ou on clique dessus) : le hamster marche jusqu'au **côté du bâtiment le plus proche de lui** (plus besoin de faire le tour jusqu'à la porte, `caseAccesProche`), puis le panneau s'ouvre. On peut aussi y aller avec les flèches : le panneau s'ouvre dès qu'on est à moins de **1,3 case** du bord du bâtiment, **de n'importe quel côté** (`RAYON_BATIMENT`, `distanceAuBatiment`). Si deux bâtiments sont aussi près l'un que l'autre, c'est celui qu'on a touché qui s'ouvre. Il ne s'ouvre pas tout seul quand le hamster *apparaît* devant (au chargement de la partie, en sortant de la mine). La croix ✖ le ferme.
- Sans marché posé, on ne peut pas vendre : le chargement de l'ascenseur attend à la mine (voir § 6).

## 3. Le menu Modifier : déplacer et retourner

Le bouton **✏️ Modifier** permet de toucher l'élément à changer (bâtiment, mine comprise, décoration, case de rail ou de chemin) : il devient un fantôme qu'on déplace comme au § 2.

- **✔ Poser ici** : déplacer est **gratuit**.
- **↔ Retourner** : le **miroir** gauche-droite (la porte change de côté). Pas de rotation à 90° (décidé le 20/10 : « normal et miroir uniquement »).
- **🗑️ Enlever** : seulement pour les décorations, les rails et les chemins, **sans remboursement**. Un bâtiment ne s'enlève pas.
- **✔ Terminé** (ou Échap) : on sort du mode.

Si on pose un bâtiment sur le hamster, il est poussé sur la case libre la plus proche.

**Les bâtiments font pile 5 × 5 cases** : depuis le 22/10, chaque dessin de l'équipe est posé sur une **dalle de 5 × 5 pavés**, et le pied de cette dalle (là où elle touche l'herbe) tombe **exactement sur le bord de l'emprise** : pas de retrait, rien qui déborde sur les cases voisines (`RETRAIT_BATIMENT` = 0). Les coins du pied de la dalle sont mesurés par un script sur les images détourées (`CALAGES` dans `iso.ts`). Depuis le 21/10, elle n'est **plus jamais déformée** : on l'agrandit d'un seul coup pour que sa largeur tienne dans l'emprise (avant, on forçait les trois coins du pied du dessin sur ceux de l'emprise, ce qui penchait et tassait les bâtiments). Une ombre douce au sol, sous chaque bâtiment, le pose sur l'herbe.

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

Tous les personnages sont des **hamsters**. Depuis le 21/10, ce sont les **images des planches de l'équipe** (4 vues : devant, derrière, gauche, droite, détourées : `public/images/personnages/sprites/`, calées par `src/composants/sprites.ts`) : on choisit la vue selon le sens de la marche (`choisirVue`) : il vient vers nous en allant vers la droite de l'écran → « droite », vers la gauche → « gauche », il s'éloigne → « derrière » (retourné en miroir s'il part vers la gauche), à l'arrêt → « devant ». Ce n'est pas de la vraie 3D, mais les 4 vues donnent l'impression d'un personnage en volume qui se retourne. Il a les pieds sur le point de la grille, se dandine en marchant, respire à l'arrêt et saute avec Espace. (Avant le 21/10, c'étaient des hamsters dessinés en SVG, `Hamster.tsx`, qui ne sert plus qu'à l'aperçu des tenues du Bazar.)

- **Le joueur** : il n'a **pas encore de planche à lui** : il utilise celle du mineur, avec le **casque jaune** d'origine. Au **Bazar**, on lui achète des **tenues** (chapeaux et hauts, voir [../batiments/bazar.md](../batiments/bazar.md)), gardées au prestige, mais depuis le 21/10 elles **ne se voient plus sur le personnage** (seulement dans l'aperçu du Bazar) : il faudra une planche du joueur (sans casque, avec ses tenues) de l'équipe.
  - Il marche avec les **flèches du clavier** (dans les 4 directions de la grille, en glissant le long des obstacles), ou va tout seul là où on touche la carte (case ou bâtiment). Il marche à **5 cases par seconde** (`VITESSE_JOUEUR`), un peu plus vite que ses mineurs.
  - **Espace** : il saute (pour le plaisir, ça ne sert à rien pour l'instant).
  - La caméra le suit ; on peut aussi faire glisser la carte, zoomer à la molette ou en pinçant (elle revient sur lui quand il remarche).
- **Les mineurs employés** (prestige 2) : la planche du mineur, avec le casque **recoloré à la couleur de sa rareté** (la même que sa carte au Personnel : gris commun, bleu rare, violet épique, orange légendaire, rose mythique), son nom au-dessus de la tête. Ils creusent dans la **même mine** que le joueur, mais chacun dans son « univers parallèle » : dans la vue 2D, chacun a sa propre profondeur ; la mine commune a **une cabine d'ascenseur par mineur**. Leur cycle (`employes.ts`) :
  1. ils creusent au fond (étape `creuse`), puis remontent dans leur cabine quand leur sac est plein (`monte`) ;
  2. en haut : s'il y a des **rails** mine → marché, leur récolte part en wagonnet et ils redescendent ; sinon ils **marchent jusqu'au marché** (étape `marche`, 4 cases par seconde, avec leur sac sur le dos), y vendent **4 s** (`vend`), puis reviennent à la mine ;
  3. si on vient d'**améliorer leur pioche** et qu'un forgeron est posé, ils passent d'abord **3 s à la forge** (`forge`) la récupérer ;
  4. s'ils ne sont **plus payés**, ils vont **attendre devant le Personnel**, mécontents (😠 au-dessus de la tête, ils tapent du pied), ou sur place s'il n'y a pas de bâtiment Personnel ; ils repartent dès qu'on paie.
- **Le recruteur** et **le manager** restent **devant le bâtiment Personnel**, avec leur étiquette (ils ne bougent pas : on n'utilise que leur image de face). Leurs portraits sont aussi en haut de leur carte, dans le panneau du Personnel.

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

- On touche la mine : le panneau de la Mine s'ouvre avec le gros bouton **« ⛏️ Entrer dans la mine »** (et l'ascenseur, le wagonnet, la carte de l'ascenseur). Le gros bouton rond **⛏️ Mine**, en bas à gauche de l'écran, fait pareil.
- Le hamster marche jusqu'à l'entrée, la caméra **plonge dans le trou** de la mine, l'écran s'assombrit, puis on retrouve la **vue 2D** de la mine d'avant (le puits, l'échelle, l'ascenseur, les galeries), en route vers le front de taille.
- Dans la mine, **🏠 Village** remonte (échelle ou ascenseur, comme avant). En arrivant en haut, l'écran se rallume sur le village, le hamster devant la mine.
- **Le dessin de la mine** (21/10) est l'image fournie par l'équipe (carrière, galerie à rails, murs de pierre, minerais, lanternes), upscalée par IA (réduite de moitié puis agrandie ×4 : la source était très compressée). Depuis le 21/10, elle n'est **plus redressée en perspective** : elle est gardée telle quelle (2 109 × 1 346 px), détourée (l'emprise et ce qui dépasse au-dessus, sans l'herbe autour) et rendue plus nette (plus de contraste et de couleurs) (`public/images/batiments/mine.webp`). Elle est posée comme les autres bâtiments (agrandie sans déformation, les coins gauche et droit de son pied sur l'emprise de 10 × 10 cases, sans retrait : `CALAGES.puits` dans `iso.ts`). Par-dessus, le jeu dessine ce qui **évolue** (`DessinEvolutionMine`), placé à partir de points de l'image (`POINTS_MINE`, convertis par `pointSurSprite`, miroir compris) :
  - **une cage d'ascenseur par ascenseur** : la tienne (toit doré) dès que l'ascenseur est construit, puis une par mineur employé (7 places le long du mur du fond). Les poulies tournent quand une cabine roule ;
  - **le fond du trou s'assombrit** avec la profondeur atteinte, et une lueur de minerais apparaît quand on est bas ;
  - **un panneau** devant la galerie affiche la profondeur (« -120 m »).

## 10. Au prestige, et les anciennes parties

- **Tout le village est gardé au prestige** : bâtiments (avec leur place et leur miroir), rails, chemins, décorations, et les tenues du joueur. Seuls les convois en route sont remis à zéro (comme l'argent).
- Le village est arrivé avec la **sauvegarde v18** : les parties des versions précédentes **repartent de zéro** (décidé le 20/10). Le 21/10 (v19, clairière de 60 × 60), une partie v18 est **mise à jour** : tout ce qui est posé (bâtiments, décorations, rails, chemins) glisse de 10 cases pour rester à la même place autour de la mine, au milieu. L'écran d'accueil le dit sur la carte du monde. Voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

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
| `src/composants/iso.ts` | Case de la grille ↔ point de l'écran, calage des images des bâtiments, point d'une image à l'écran (`pointSurSprite`), où se tiennent les personnages. |
| `src/composants/DessinsVillage.tsx` | Les dessins SVG : le terrain (damier, herbe autour), ce qui évolue sur la mine (cages, profondeur), rails, chemins, décorations, wagonnet. |
| `src/composants/ForetVillage.tsx`, `src/composants/arbres.ts` | La forêt : où sont plantés les arbres, leurs tuiles de toile ; la taille et le pied de chaque image d'arbre. |
| `src/composants/ElementsVillage.tsx` | Un personnage posé sur la grille (`Perso`, avec l'image qui va avec son sens de marche), l'image d'un bâtiment. |
| `src/composants/sprites.ts` | Les images des personnages (21/10) : laquelle prendre (`spritePerso`, `choisirVue`), leur pied, leur taille (`ECHELLE_SPRITE`). |
| `src/composants/Hamster.tsx` | Le hamster en SVG, qui ne sert plus (21/10) qu'à l'aperçu des tenues du Bazar. |
| `src/composants/MenuConstruction.tsx` | Les menus Bâtiments et Décorations. |
| `src/composants/PanneauTenues.tsx` | Les tenues, au Bazar. |
| `src/composants/fantome.ts` | Ce qu'on est en train de poser ou de déplacer. |
| `src/useJoueurVillage.ts` | La marche du joueur (flèches, chemin jusqu'à une case, saut). |
| `src/App.tsx` | Les modes village / mine, les barres du bas, la construction, Modifier, l'entrée dans la mine. |
| `src/village.css` | Tout le style du village. |
| `src/plein-ecran.css` | Le jeu en plein écran : la carte sur toute la fenêtre, les boutons posés dessus (21/10). |
| `public/images/village/`, `public/images/batiments/`, `public/images/personnages/` | La forêt, les images des bâtiments et de la mine (upscalées par IA), les portraits. |
