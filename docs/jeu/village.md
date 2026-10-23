# 🏡 Le village vu du ciel

> Depuis le 20/10, le village est une **clairière vue du ciel** (vue isométrique à 45°, façon Clash of Clans ou Hay Day), où le joueur **pose ses bâtiments où il veut**. Depuis le 22/10 (la mine automatique), **tout le jeu se passe ici** : on ne descend plus dans la mine, on clique sur son bloc depuis son panneau. Ce fichier décrit la grille, la construction, les rails et les trajets de wagonnets, les chemins, le menu Modifier, les personnages et les bulles de notification.
> Les chiffres viennent du code (`src/jeu/donnees.ts`, section « Le village en vue du ciel »). Chaque bâtiment a sa fiche dans [../batiments/](../batiments/README.md).

## Sommaire

1. [La clairière et sa grille](#1-la-clairière-et-sa-grille)
2. [Les bâtiments : les poser, les payer](#2-les-bâtiments--les-poser-les-payer)
3. [Le menu Modifier : déplacer et retourner](#3-le-menu-modifier--déplacer-et-retourner)
4. [Les rails et les trajets de wagonnets](#4-les-rails-et-les-trajets-de-wagonnets)
5. [Le rayon du générateur](#5-le-rayon-du-générateur)
6. [Les chemins (et les décorations retirées)](#6-les-chemins-et-les-décorations-retirées)
7. [Les personnages](#7-les-personnages)
8. [Les bulles de notification](#8-les-bulles-de-notification)
9. [La mine sur la carte](#9-la-mine-sur-la-carte)
10. [Les anciennes parties](#10-les-anciennes-parties)
11. [Fichiers du code](#11-fichiers-du-code)

## 1. La clairière et sa grille

- La clairière est une grille de **60 × 60 cases** (`TAILLE_GRILLE`). Sur l'écran, c'est un losange : la case (0, 0) est en haut, les x vont vers le bas à droite, les y vers le bas à gauche.
- **Le terrain est dessiné par le jeu** (`TerrainVillage` dans `DessinsVillage.tsx`) :
  - **le sol de la clairière est un pré** : un damier vert clair / vert foncé à peine visible (`VERT_CLAIR` #83bf3e, `VERT_FONCE` #7eb83a, depuis le 24/10), une **texture d'herbe** qui se répète sans couture (`public/images/sol/herbe.webp`) et une soixantaine de grandes taches floues (soleil, herbe haute, herbe sèche) ;
  - **le sol est figé en image** (26/10, `ImageFigee.tsx`) : le terrain et le sable de la plage sont dessinés en SVG une fois, puis transformés en `<img>`. Sans ça, leurs flous étaient recalculés dès que quelque chose bougeait, et le jeu tombait à 5 images par seconde. Ce qui bouge sur l'eau (reflets, écume, vagues) est dans un dessin à part (`EauPlage`). **Règle** : pas de `filter` (flou, `drop-shadow`) sur ce qui bouge ou sur les grands dessins ; préférer des dégradés ou des formes transparentes. Et (23/10) les animations des personnages et des jauges passent par les variables `--p-…` (`@property` dans `village.css`), jamais par `translate` / `rotate` / `scale` / `opacity` : sinon le navigateur met à part les bâtiments devant eux, qui deviennent flous ;
  - **une vraie grille** de fines lignes blanches (`GrilleConstruction`) n'apparaît que **quand on pose ou déplace quelque chose**, ou qu'on peint des rails ou des chemins ;
  - **entre le damier et la forêt, une transition douce** : le bord du damier s'efface dans une herbe un peu plus foncée, puis une large auréole d'herbe se fond dans le sous-bois sombre ;
  - **la forêt** : les **12 arbres dessinés par l'équipe** (`public/images/village/arbres/`), environ 1 300 plantés tout autour de la clairière, toujours aux mêmes places (hasard à graine fixe, `ForetVillage.tsx`). Le **premier rang** (la lisière) est planté bien en ligne, à 1,3 case du bord ; derrière, les arbres sont plus libres et de plus en plus serrés. Les arbres du bas de la carte passent devant les bâtiments et les personnages. Pour rester fluide, ils sont dessinés dans des tuiles de « toile » (canvas) ;
  - **la plage** (`PlageVillage.tsx`, forme dans `plage.ts`) : en bas à gauche, une bande de **sable** (texture `sable.webp`, rides du vent, bande mouillée qui brille) puis la **mer** (récifs, reflets, écume qui va et vient), avec un ponton, des barques, des palmiers, un parasol, un feu de camp, des caisses, des tonneaux, des rochers en relief, des galets, des algues, du bois flotté, des traces de pas depuis le ponton, deux crabes qui se promènent, des étoiles de mer et des coquillages. On ne peut **ni construire ni marcher** sur la plage (elle est hors de la grille). Une partie de ses caisses, tonneaux, rochers, buissons et sa lanterne sont les dessins des anciennes décorations (`DessinDecoration`). **Quand la caméra ne voit pas la plage** (aucun des rectangles `BOITES_PLAGE` de `plage.ts` à l'écran), ses animations (l'eau, les objets) **se mettent en pause** (27/10, classe `plage-cachee`) : elles faisaient travailler le navigateur pour rien ;
  - **des petits détails sur l'herbe** (`DetailsHerbe`) : touffes, brins clairs, petites fleurs ou cailloux, toujours aux mêmes places ;
  - **la caméra est bornée** (`LIMITES_CAMERA` dans `iso.ts`) : on ne voit jamais de bord de décor.
- Une case fait 33 pixels du monde de large sur 19 de haut (`DEMI_LARGEUR` = 16,5 et `DEMI_HAUTEUR` = 9,57 dans `iso.ts`). Le monde fait 2 262 × 1 407 pixels.
- **Tailles** : chaque bâtiment fait **5 × 5 cases**, la **mine 10 × 10**. Les rails et les chemins font **1 case**.
- Au début d'une partie, la **mine est déjà posée au milieu** de la clairière (cases 25 à 34, `POSITION_MINE` = 25, 25), et le hamster du joueur se tient devant son entrée. Rien d'autre n'est construit.
- On ne peut pas poser deux choses sur la même case (`empriseLibre`). Les rails et les chemins sont « au sol » : on marche dessus, mais on ne pose rien dessus.
- On **marche à travers** les rails et les chemins ; **seuls les bâtiments bloquent le passage** (`casesBloquees`, depuis le 27/10 : il n'y a plus de décorations). Les personnages contournent ce qui bloque (recherche de chemin A\*, 8 directions, sans couper les coins : `trouverChemin` dans `village.ts`).
- Chaque bâtiment a une **porte**, sur sa face avant gauche ou sa face avant droite (`porte` dans `BATIMENTS`, inversée si le bâtiment est retourné). Les mineurs y entrent par la case devant la porte, ou, si elle est bouchée, par la case libre la plus proche (`caseAcces`).
- **Toucher hors de la clairière** (la forêt, la plage, la mer) : le hamster marche vers l'endroit touché mais **s'arrête au bord de la clairière**, comme contre une barrière invisible (`auBordDeLaClairiere`, `caseLibreProche` dans `useJoueurVillage.ts`).

## 2. Les bâtiments : les poser, les payer

Le menu **🏗️ Bâtiments** (gros bouton rond en bas à droite) montre tous les bâtiments du jeu, dans l'ordre où ils se débloquent (`LISTE_BATIMENTS` ; depuis le 30/10 : marché, forgeron, Personnel, bazar, foreuse, générateur ; le 29/10, le générateur venait avant la foreuse) :

- débloqué et pas encore posé : son prix et un bouton **« 🏗️ Poser »** (grisé tant qu'on ne peut pas payer) ; s'il est payable tout de suite, sa carte a un **bord doré** (27/10) ;
- pas encore débloqué : un **cadenas** et « 🔒 Niveau *N* » (le niveau du joueur qu'il faut, 29/10, voir [niveaux.md](niveaux.md)) ou « 🔒 Mine niveau *N* » si c'est le niveau de la mine qui manque ;
- déjà posé : « ✔ Construit ».

À la fin du menu, deux cartes de plus : **🛤️ Rails** (§ 4) et **🪨 Chemin de pavés** (§ 6). Depuis le 27/10, c'est la seule fenêtre de construction (plus d'onglet ni de bouton 🌸 Décos).

Une pastille **« Nouveau ! »** marque un bâtiment tout juste débloqué, jusqu'à ce qu'on ouvre le menu (`batimentsVus`). Le bouton du menu a un **badge** qui compte les bâtiments nouveaux ou constructibles tout de suite. Les **missions** (en haut à droite) proposent aussi « Construis : X » (avec ce qui manque : « Gagne *X* $ », « Récupère *N* pierre ») et ouvrent le menu d'un clic.

| Bâtiment | Prix pour le poser (29/10) | Débloqué au | Porte (sans miroir) |
|---|---|---|---|
| ⛏️ Mine (10 × 10) | déjà posée | début | face avant gauche |
| 💰 Marché | **gratuit** (on commence avec 0 $) | début (niveau 1) | face avant gauche |
| ⚒️ Forgeron | 20 $ + 10 pierre (30/10) | début (niveau 1) | face avant droite |
| 👷 Personnel | 150 $ + 30 pierre (30/10) | niveau 2 du joueur | face avant droite |
| 🎒 Bazar | 200 $ + 40 pierre (30/10) | niveau 3 du joueur | face avant droite |
| ⚙️ Foreuse | 3 000 $ + 120 pierre + 60 fer | niveau 5 du joueur (30/10 ; avant 6) et niveau 2 de la mine | face avant gauche |
| ⚡ Générateur | 4 000 $ + 100 fer + 40 redstone | niveau 6 du joueur (30/10 ; avant 5) et niveau 2 de la mine | face avant droite |

Une fois débloqué, il faut quand même le payer. Le niveau 2 de la mine demande lui-même le niveau 4 du joueur. Construire un bâtiment rapporte **40 XP**.

- Les minerais se prennent **dans le sac, puis dans le coffre de la mine** (`payer`) : pas besoin de porter la pierre ou le fer.
- Chaque bâtiment ne se construit **qu'une fois** et reste pour toujours.
- **Poser, en deux temps** : après « Poser », un **fantôme** du bâtiment suit la souris sur la carte, avec son losange vert (place libre) ou rouge (place prise). **Un clic sur la carte le fixe à cet endroit** (sans rien construire) : il ne suit plus la souris, et on peut aller jusqu'au bouton. Un autre clic le déplace, et on peut aussi le faire glisser. **Le bâtiment en main, on peut toujours faire glisser la carte** (27/10) : à la souris, tant que le fantôme n'est pas fixé, glisser déplace la carte (un simple clic le fixe) ; une fois fixé, glisser sur lui le déplace, et glisser ailleurs déplace la carte. Barre du bas : **✔ Construire ici** (on paie à ce moment-là), **↔ Retourner** (miroir), **✖ Annuler** (ou Échap). En posant le générateur, on voit son **rayon** autour du fantôme.
- **Ouvrir un bâtiment** : on le touche (ou on clique dessus : son image, son toit qui dépasse de ses cases, ou depuis le 29/10 **juste à côté**, à moins de 1,6 case de son bord, `MARGE_CLIC_BATIMENT` et `batimentProcheDe` dans `village.ts` ; avant, un clic sur le toit ou à côté faisait seulement marcher le joueur) : le hamster marche jusqu'au **point du tour du bâtiment le plus proche à pied** (27/10, `caseAccesProche` : une case collée à son emprise, coins compris, atteinte par le plus court chemin en contournant les autres bâtiments), et le panneau s'ouvre **dès qu'il arrive à un bloc** du bâtiment. On peut aussi y aller avec les flèches : le panneau s'ouvre dès qu'on est à moins de **1 case** du bord du bâtiment, **de n'importe quel côté** (`RAYON_BATIMENT`, `distanceAuBatiment`). Si deux bâtiments sont aussi près, c'est celui qu'on a touché qui s'ouvre. Il ne s'ouvre pas tout seul quand le hamster *apparaît* devant (au chargement de la partie). La croix ✖ le ferme.
- Sans marché posé, on ne peut pas vendre, et aucun wagonnet ne va au marché.

## 3. Le menu Modifier : déplacer et retourner

Le bouton **✏️ Modifier** permet de toucher l'élément à changer (bâtiment, mine comprise, case de rail ou de chemin) : il devient un fantôme qu'on déplace comme au § 2.

- **✔ Poser ici** : déplacer est **gratuit**.
- **↔ Retourner** : le **miroir** gauche-droite (la porte change de côté). Pas de rotation à 90° (décidé le 20/10). Un bâtiment avec des écritures garde un texte lisible (27/10) : le Personnel retourné prend l'image `employes-miroir.webp`, où l'enseigne « HIRING » est déjà retournée (`imageBatiment` dans `iso.ts`, voir [visuel-et-sons.md](visuel-et-sons.md)).
- **🗑️ Enlever** : seulement pour les rails et les chemins, **remboursés** depuis le 30/10 (`retirerSol` : les 3 fer d'un rail reviennent dans le sac s'il y a de la place, sinon dans le coffre de la mine ; un chemin rend ses 5 $ ; avant, sans remboursement). Un bâtiment ne s'enlève pas.
- **✔ Terminé** (ou Échap) : on sort du mode.

Si on pose un bâtiment sur le hamster, il est poussé sur la case libre la plus proche.

**Les bâtiments font pile 5 × 5 cases** : chaque dessin de l'équipe est posé sur une **dalle de 5 × 5 pavés**, et le pied de cette dalle tombe **exactement sur le bord de l'emprise** (`RETRAIT_BATIMENT` = 0, coins mesurés dans `CALAGES` dans `iso.ts`). L'image n'est jamais déformée : on l'agrandit d'un seul coup pour que sa largeur tienne dans l'emprise. Une ombre douce au sol, sous chaque bâtiment, le pose sur l'herbe.

## 4. Les rails et les trajets de wagonnets

Depuis le 24/10, **c'est le joueur qui choisit où vont les wagonnets** : au début, il n'y a aucun trajet.

**Les rails**

- Les rails sont dans le menu Bâtiments, **à partir du niveau 3 du joueur** (29/10 ; avant, dès le début : `NIVEAU_JOUEUR_POUR.rails`, `railsDebloques`), **3 fer la case** (`COUT_RAIL`). Avant, leur carte a un cadenas « 🔒 Niveau 3 ». Chaque case posée rapporte 3 XP et chaque trajet créé 30 XP, une seule fois : retirer un rail puis le reposer ne redonne rien.
- Un rail **occupe une seule case**, mais sa voie est **dessinée sur deux cases de large** (une demi-case de plus à gauche et à droite, talus compris) : voir « Les rails » dans [visuel-et-sons.md](visuel-et-sons.md).
- **Les bords de la voie** (25/10) : les cases où déborde la demi-voie (les deux côtés d'une ligne droite, l'extérieur d'un virage, le dos d'un T : `bordsDeVoie` dans `village.ts`) sont **interdites aux bâtiments et aux chemins**. Pendant qu'on pose l'un d'eux, ces cases sont montrées en rouge. Devant et derrière une ligne (dans son sens), c'est libre : un bâtiment peut s'y raccorder. À l'inverse, on ne peut pas poser (ni déplacer) un rail si sa voie, ou celle de ses voisins qui change de forme, passerait sur un bâtiment ou un chemin (`placePourUnRail` dans `batiments.ts`, message « 🚧 Pas la place »). Les parties d'avant ne sont pas touchées : ce qui y était déjà posé reste là.
- **Les virages doux** (25/10) : un virage dont les deux voisines sont des lignes droites est dessiné en **grand quart de cercle sur trois cases** (rayon 1,5 case, `viragesDoux` dans `village.ts`), et le wagonnet le suit. Sinon (un zigzag, un virage collé à un autre, ou un bras qui est un bout de ligne), il reste serré, dans sa case. Ce n'est que du dessin : les règles et les longueurs des trajets ne changent pas.
- **Les butoirs** (26/10) : au **bout d'une ligne** (un rail avec une seule voisine, qui ne touche pas de bâtiment), la voie finit sur un **butoir** rouge et blanc en 3D ; un rail tout seul en a deux. Un bout de ligne garde toujours son butoir (il n'est jamais le bras d'un virage doux). Ce n'est que du dessin : voir [visuel-et-sons.md § 7.3](visuel-et-sons.md#73-les-dessins).
- « 🛤️ Poser des rails » : depuis le 23/10, **pas à pas** (`traceRail.ts`, voir [interface.md](interface.md)) : on touche la case de départ, « ✔ Poser ce rail », puis le rail suivant est proposé (doré) dans le même sens, et les flèches **↰ Gauche · ⬆ Tout droit · ↱ Droite** le font tourner. Glisser déplace la carte (avant, glisser posait des rails partout). Le rail coûte toujours 3 fer (sac puis coffre). « ✔ Terminé » pour finir. Depuis le 30/10 :
  - (23/10) pendant la pose, **les bâtiments deviennent presque invisibles** (12 %, `.batiments-transparents`) pour bien voir le sol et les rails dessous ; leur **contour au sol** reste : doré qui brille pour ceux qu'on peut relier (mine, marché, foreuse, générateur), blanc en pointillés pour les autres (`.contour-batiment-rails`) ;
  - à la souris, avant de choisir la première case, un **aperçu du rail** suit le pointeur, sur un losange vert (on peut le poser) ou rouge (`typePinceau`, `peutPeindre` dans `VueVillage.tsx`) ; ensuite, c'est le **rail proposé** doré (`railPropose`) ;
  - quand on ne peut pas poser, le jeu **dit pourquoi** (`raisonSolImpossible` dans `batiments.ts`) : « 🔩 Plus de fer : un rail coûte 3 fer (sac + coffre de la mine). Va creuser ! », une boucle, ou trop près du bord (avant, rien ne se passait) ;
  - **dès que les rails relient deux bâtiments** (un nouveau trajet possible), la pose s'arrête (plus de rail « dans la main » : un clic de plus n'en pose pas un par erreur) et la **fenêtre du trajet** s'ouvre tout de suite, pour l'automatiser.
- On n'achète qu'une sorte de rail. Les rails **se raccordent tout seuls** : en ligne droite, en virage, en T ou en croix (`raccordsRail`). Le dessin vient des tuiles de l'équipe (voir [visuel-et-sons.md § 7.3](visuel-et-sons.md#73-les-dessins)).
- Un rail collé à un bâtiment des trajets (mine, marché, foreuse, générateur : `BATIMENTS_DES_RAILS`) ne se raccorde à lui que **s'il est un bout de ligne**. Un rail qui passe le long d'un bâtiment ne s'y raccorde pas.
- **Pas de boucle** : les rails ne peuvent jamais tourner en rond (`feraitUneBoucle` dans `village.ts`, vérifié en posant et en déplaçant un rail). Un rail qui fermerait une boucle n'est pas posé, et le jeu dit « 🔁 Pas de boucle : les rails vont d’un bâtiment à un autre. ». Entre deux bâtiments, il n'y a donc **qu'une seule route**.

**Les trajets**

- Une ligne **continue** (cases voisines par un côté, pas en diagonale) entre deux bâtiments les relie (`railsEntre`, `ligneDe`). Il y a **4 trajets possibles** (`LIAISONS` dans `donnees.ts`), **un wagonnet chacun** :

| Trajet | Ce que fait le wagonnet |
|---|---|
| 💰 Mine → Marché | emporte le coffre de la mine (un peu de chaque objet s'il n'a pas la place pour tout, 23/10) et le vend. Il laisse les objets « gardés », et le charbon et la redstone dont les deux trajets suivants ont besoin. |
| 🔥 Mine → Foreuse | dès que le réservoir de la foreuse n'est plus plein, emporte tout le charbon du coffre : il remplit le réservoir (15 à 54 charbons selon le niveau de forage, 5 à 18 min, 23/10), le surplus va dans le chariot (28/10). |
| 🔴 Mine → Générateur | apporte la redstone du coffre, jusqu'à sa réserve (5 à 16 min selon son niveau, 23/10). |
| 🛒 Foreuse → Marché | vend ce qui est coché dans le chariot de la foreuse. |

- **Les zones jaunes** (27/10) : dès qu'on choisit « 🛤️ Poser des rails » (menu 🏗️ Bâtiments), ou qu'on déplace un rail, les bâtiments qu'on peut relier (mine, marché, foreuse, générateur, `BATIMENTS_DES_RAILS`) sont entourés d'une **ligne jaune qui brille**, tout pile sur le bord de leur emprise (5 × 5 ou 10 × 10). Les rails partent de là : une case de rails collée à cette ligne touche le bâtiment.
- **La bulle « 🛤️ Automatiser »** (27/10) : dès qu'une ligne de rails relie deux zones jaunes et que le trajet n'existe pas encore (`trajetsAProposer`), une bulle jaune apparaît **au milieu de la ligne** (`milieuDeLigne`). On la touche : la **fenêtre du trajet** s'ouvre (`FenetreTrajet.tsx`).
- **La fenêtre du trajet** (`FenetreTrajet.tsx`, refaite le 27/10 : le « poste d'aiguillage ») : un papier crème avec, s'il y a plusieurs trajets sur ces rails, **un onglet par trajet** avec son voyant (vert = activé) ; **le dessin du trajet** (l'image du départ, des rails où roule un wagonnet quand il est activé, l'image de l'arrivée) ; l'interrupteur **Automatisation activée / arrêtée** ; vers le marché, **les objets en grosses tuiles à toucher** (un minerai du niveau de la mine chacune, avec son prix et combien il y en a au départ ; verte avec ✔ = le wagonnet l'emporte, grise avec ✖ = il la laisse ; elle rebondit quand on la touche), et **Tout** / **Rien** ; vers la foreuse ou le générateur, la tuile fixe du charbon ou de la redstone avec la jauge de la réserve ; **l'aperçu du prochain voyage**, qui change à chaque toucher (`apercuTrajet` : ce qu'il emporterait, « +*X* $ », le temps d'un aller-retour et « ≈ *Y* $/min ») ; et qui le fait rouler (⚡ électrique, 👷 son pousseur, ou « pas de pousseur »). Rien ne change avant **✔ Valider** (`reglerTrajet`) : le trajet est créé et le circuit commence. Un objet envoyé depuis la mine n'est plus « gardé » au marché non plus. On rouvre la fenêtre en touchant les rails, ou avec **⚙️ Régler** sur la carte du trajet (onglet Wagons de la mine ou de la foreuse).
- **Changer un trajet** : on **touche ses rails** (hors construction) : la même fenêtre s'ouvre avec les réglages du trajet (`liaisonsSurLaCase` ; s'il y a plusieurs trajets sur ces rails, un bloc chacun). Arrêter l'automatisation supprime le trajet (son chargement retourne d'où il vient, les rails restent).
- **Toucher un rail** (30/10) : en bas de cette fenêtre, « Ce rail : **✏️ Déplacer ce rail** / **🗑️ Retirer (+3 🔩 fer)** ». Un rail qui ne relie encore rien ouvre sa propre petite fenêtre « 🛤️ Rail » (`FenetreRail.tsx`) : « Ce rail ne relie encore rien. Continue la voie jusqu’à un autre bâtiment… », avec les deux mêmes boutons. Déplacer en fait un fantôme à reposer (comme avec ✏️ Modifier) ; retirer le rembourse.
- Le **panneau du bâtiment de départ** (la mine ou la foreuse) garde **« 🛤️ Pousser »** et **« ✖ Arrêter »** (le bouton « Envoyer un wagonnet vers… » est retiré le 27/10 : le trajet se crée sur la carte). Au panneau de la mine, le coffre règle aussi, minerai par minerai, ce que le wagonnet du marché vend ou garde.
- **Une vente au marché se voit** (27/10) : quand un wagonnet vend au marché, une fois le déchargement fini, un « +X $ » doré jaillit juste au-dessus du wagonnet (par-dessus le marché) avec une fontaine de pièces, et la caisse sonne (`sons.venteMarche`). Voir [../batiments/marche.md](../batiments/marche.md).
- Plusieurs wagonnets peuvent **partager les mêmes rails** : ils se croisent sans se gêner.
- Un wagonnet ne part que s'il a quelque chose à porter. Il ne roule pas tout seul :
  - **toi** : bouton « 🛤️ Pousser » dans le panneau du départ. Ton hamster fait l'aller-retour avec lui (3 cases/s). Un seul wagonnet à la fois ;
  - **son pousseur** (2,5 cases/s, 26/10) : un employé embauché au Personnel **pour ce trajet** (« 🛤️ Embaucher un pousseur » : on coche son trajet dans la liste, et le trajet brille sur la carte avant qu'on confirme). Il attend au quai, au bord de la voie, devant le bâtiment de départ, et ne pousse que le wagonnet de son trajet. Voir [../batiments/personnel.md](../batiments/personnel.md#4-les-pousseurs) ;
  - l'**électricité** : si **toutes les cases de ce trajet** sont dans le rayon du générateur allumé (`trajetElectrique`), son pousseur le pousse **+ 30 % à + 75 %** plus vite (23/10 : il le pousse toujours ; avant, le wagonnet roulait tout seul, bien trop vite).
- La **taille d'un wagonnet**, c'est le chariot de son pousseur (23/10), qu'on agrandit au Personnel. Le détail (capacités, vitesses, temps) est dans [../batiments/mine.md](../batiments/mine.md#les-wagonnets).
- **Si une ligne est coupée** (un rail enlevé ou déplacé, un bâtiment déplacé), son wagonnet revient aussitôt au quai et son chargement retourne d'où il vient. Le trajet reste : il repartira quand les rails seront refaits. En attendant, une bulle **🚧 Rails coupés** est sur ses deux bâtiments.
- **Où poser les rails** : courts (moins de fer, voyages plus rapides) et ramassés (plus faciles à mettre entiers dans le rayon du générateur). Le bot de simulation pose le marché juste sous la mine, avec 3 cases de rails.

## 5. Le rayon du générateur

- Le générateur (niveau 2 de la mine) électrifie un **cercle** autour de son centre : 15 cases de rayon au niveau 1, jusqu'à 40 au niveau 5. Voir [../batiments/generateur.md](../batiments/generateur.md).
- Sur la carte, le cercle est dessiné **en pointillés jaunes** (une ellipse, car la grille est en losange, `RayonGenerateur` dans `VueVillage.tsx`) : bien visible, avec des pointillés qui tournent, quand on est devant le générateur ou qu'on le pose ; gris quand il ne donne pas de courant ; caché le reste du temps (23/10).
- Pour qu'un trajet soit électrique, **toutes ses cases de rails** doivent être dans le cercle (chaque trajet compte à part). Pour la foreuse, c'est son centre.

## 6. Les chemins (et les décorations retirées)

- **🪨 Chemin de pavés** : **5 $ la case**, posé au pinceau comme les rails (carte « 🪨 Chemin de pavés » du menu 🏗️ Bâtiments, bouton **🖌️ Poser**). Il ne sert qu'à faire joli (aucun effet sur le jeu). Il se déplace et s'enlève avec ✏️ Modifier.
- **Les décorations** (fleurs, buissons, rochers, tonneaux, lanternes, arbres, fontaine, statue…) **ne s'achètent plus depuis le 27/10** : plus de bouton 🌸 Décos, plus d'onglet Décorations, plus de succès « Paysagiste ». Leurs **dessins sont gardés** (`DessinDecoration` dans `DessinsVillage.tsx` ; `DECORATIONS` dans `donnees.ts` ne garde que leur nom et leur taille) : ils ornent la **plage** et le petit village de l'**écran d'accueil** (sa propre liste `DECORATIONS_SCENE` dans `SceneAccueil.tsx`).

## 7. Les personnages

Tous les personnages sont des **hamsters** : les **images des planches de l'équipe** (4 vues : devant, derrière, gauche, droite, `public/images/personnages/sprites/`, calées par `src/composants/sprites.ts`). On choisit la vue selon le sens de la marche (`choisirVue`) : il vient vers nous en allant vers la droite de l'écran → « droite », vers la gauche → « gauche », il s'éloigne → « derrière », à l'arrêt → « devant ». Il a les pieds sur le point de la grille, se dandine en marchant, respire à l'arrêt et saute avec Espace.

- **Le joueur** : il n'a **pas encore de planche à lui** : il utilise celle du mineur, avec le **casque jaune** d'origine.
  - Il marche avec les **flèches du clavier** (dans les 4 directions de la grille, combinables, en glissant le long des obstacles), ou va tout seul là où on touche la carte (case ou bâtiment). Il marche à **7,5 cases par seconde** (`VITESSE_JOUEUR`, 27/10 ; avant 5). Le panneau d'un bâtiment ne s'ouvre que si on **touche** ce bâtiment (27/10) : passer à côté n'ouvre rien.
  - **Pendant qu'il pousse un wagonnet**, il est dessiné juste derrière le wagonnet, sur les rails, et fait l'aller-retour avec lui : il ne peut pas aller ailleurs (les flèches et les touchers ne font rien, le bouton ⛏️ Mine affiche « Wagonnet… »), et la caméra suit le wagonnet.
  - **Espace** : il saute (pour le plaisir).
  - La caméra le suit ; on peut aussi faire glisser la carte, zoomer à la molette (un cran ≈ 15 % depuis le 29/10 ; presque le double le 27/10, c'était trop) ou en pinçant (plus fort depuis le 27/10 ; le pincement du pavé tactile, 5 fois plus fort depuis le 30/10) (elle revient sur lui quand il remarche). Depuis le 30/10, le **zoom est fluide** : pendant le geste, la caméra visée est gardée hors de React et n'est recopiée dans l'état qu'à la fin (avant, chaque cran redessinait tout le village et ça saccadait). Depuis le 27/10, elle **ne bouge plus quand un panneau s'ouvre** à droite (avant, elle se décalait de 210 px) : le joueur garde sa vue.
- **Les employés** (mineurs et pousseurs) : la planche du mineur, avec le casque **recoloré à la couleur de sa rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique), son nom au-dessus de la tête. Les mineurs travaillent surtout **dans la mine** (on ne les voit pas au fond : seulement la **cabine de l'ascenseur** qui monte et descend sur le dessin de la mine, avec **les mineurs dedans** depuis le 27/10 ; la jauge du coffre dit « 👷 *n* »). On les voit au village quand :
  1. ils **marchent** (`marche`, **2,5 cases/s** depuis le 27/10, avant 4) : vers la forge, vers le Personnel quand ils ne sont plus payés, de retour vers la mine, ou (les pousseurs) vers le quai de leur trajet ;
  2. ils **récupèrent leur pioche** devant la forge (3 s, `forge`) ;
  3. ils **attendent leur wagonnet au quai** (les pousseurs : au bord de la voie, à côté du début des rails de leur trajet, devant le bâtiment de départ) ;
  4. ils **poussent un wagonnet** (juste derrière lui) ; pendant le chargement au départ et le déchargement à l'arrivée, ils **attendent à l'arrêt** sans marcher (28/10 ; le joueur aussi quand c'est lui qui pousse) ;
  5. ils **attendent leur salaire** devant le Personnel, mécontents (😠 au-dessus de la tête, ils tapent du pied). Une fois payés ensemble, ils **repartent l'un après l'autre**, à 0,7 s d'écart (`ECART_DEPART`) : ceux qui attendent leur tour restent à leur place devant le Personnel.
- **Une embauche se voit** (30/10) : une **gerbe d'étincelles** jaillit du Personnel avec « 👷 *Nom* arrive ! », puis le nouveau mineur part vers la mine entouré d'un **halo doré**, avec des étincelles et une bulle « ✨ Nouveau ! » au-dessus de la tête (pendant 6 s).
- **Le recruteur** et **le manager** restent **devant le bâtiment Personnel**, avec leur étiquette (ils ne bougent pas : on n'utilise que leur image de face).

## 8. Les bulles de notification

Au-dessus des bâtiments posés, des **bulles** sautillent pour dire qu'il y a quelque chose à faire (`notifications.ts`). On les touche pour aller au bâtiment. Une couleur par sorte, la plus urgente d'abord (1 ou 2 icônes par bulle) :

| Bulle | Bâtiment | Quand | Sorte (couleur) |
|---|---|---|---|
| 😠 | Personnel | des mineurs attendent leur salaire (ou, avec le manager, il n'y a plus assez d'argent) | alerte (rouge) |
| 🚧 | les deux bâtiments d'un trajet | les rails de ce trajet sont coupés : son wagonnet attend (« Rails coupés ») | alerte |
| 🛤️ | Personnel | des pousseurs n'ont plus de trajet en service (« Sans trajet ») | alerte |
| 🛒 | Foreuse | le chariot est plein | alerte |
| 🔥 | Foreuse | plus de charbon | alerte |
| 🔴 | Générateur | allumé, mais plus de redstone | alerte |
| 🔧 | Forgeron | la pioche est cassée | alerte |
| 🎒 | Marché | le sac est plein | alerte |
| 📦 | Mine | le coffre est plein | alerte |
| ✨ | Personnel | le manager (niveau 3) ou le recruteur (niveau 4) vient de se débloquer, pas encore vu | nouveau (bleu) |
| 💰 | le bâtiment concerné | une amélioration est achetable (**seulement pendant le tutoriel** depuis le 30/10 : sinon il y aurait presque toujours une bulle, et la liste des tâches propose déjà les achats) | achat (vert) |

La bulle ✨ disparaît quand on arrive devant le Personnel. Au-dessus de la mine, les bulles sont un peu plus haut (128 px), pour passer au-dessus de la jauge du coffre (§ 9).

## 9. La mine sur la carte

- On touche la mine (ou le gros bouton rond **⛏️ Mine**, en bas à gauche de l'écran) : le hamster y marche, et le **panneau de la mine** s'ouvre : le bloc à cliquer, le coffre, les trajets de wagonnets qui partent de la mine, et (onglet « ⬆️ Améliorer » depuis le 30/10) le niveau de la mine, la taille du coffre et l'ascenseur. Voir [../batiments/mine.md](../batiments/mine.md). On n'entre plus dans la mine (plus de plongée de la caméra ni de vue en coupe).
- **Le dessin de la mine** est l'image fournie par l'équipe (`public/images/batiments/mine.webp`), posée comme les autres bâtiments sur ses 10 × 10 cases (`CALAGES.puits`). Par-dessus, le jeu dessine ce qui **évolue** (`DessinEvolutionMine`, placé à partir de points de l'image, `POINTS_MINE`, miroir compris) :
  - **la caisse de l'ascenseur** (23/10, dessin de l'équipe « caisse-ascenseur-design » : `caisse-ascenseur-0.webp` vide, puis `-1` à `-4` pleines des minerais du niveau de la mine : pierre-charbon-fer, + redstone (niveaux 2 et 3), + or et émeraude (niveau 4), + diamant (niveau 5)), pendue aux deux câbles du treuil. Depuis le 23/10 (bis), **elle fait des allers-retours sans cesse** tant que des mineurs travaillent au fond (`avancerNavette` dans `employes.ts`) : elle descend vide, se charge 1 s au fond, **remonte pleine tout en haut**, sous le treuil, s'y vide dans le coffre (2 s), puis repart, pleine ou pas. `MineAnimee` la dessine là où elle est (`hauteurNavette`), en glissant doucement. Les mineurs restent au fond : on ne voit un mineur dans la caisse que quand il **arrive** (il attend la caisse en haut, au bout de son chemin, puis descend dedans) ou quand il **remonte parce qu'il n'est plus payé**. Sans mineur, elle attend vide en haut. Elle descend dans le puits et disparaît sous son bord de devant (`bordDuPuits`), la barrière `mine-devant.webp` passe devant ; les torons des câbles défilent quand elle bouge. Une mini-jauge (23/10 : seulement pendant le déchargement) dit « 📦 Déchargement · *n* » (« 📦 Coffre plein ! » si elle ne peut pas se vider). Sans ascenseur (une vieille partie, avant sa conversion), les câbles pendent au fond ;
  - **un panneau en bois** devant la galerie affiche le niveau de la mine (« Niv. 3 »).
- **La jauge du coffre** (27/10) : au-dessus de la mine, toujours visible, une petite barre « 📦 *n* / *capacité* » (nombres en court : « 1,2 k », « 12 k », `nombreAbrege` dans `src/nombres.ts`). Verte, puis **orange** dès 75 %, **rouge** quand le coffre est plein (elle pulse alors). On voit tout de suite s'il faut le vider.

## 10. Les anciennes parties

- Le village est arrivé avec la sauvegarde v18 (20/10). Le 22/10, la mine automatique passe à la **version 21** : **toutes les parties d'avant repartent de zéro**, village compris. L'écran d'accueil le dit sur la carte du monde.
- Le 24/10, les trajets passent à la **version 22** : une partie de la version 21 est **convertie** (son wagonnet devient le trajet Mine → Marché si la ligne existe, et sa taille est gardée). Voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).
- Le 26/10, les pousseurs embauchés pour un trajet passent à la **version 23** : une partie de la version 22 est **convertie** (un ancien pousseur prend le trajet Mine → Marché).
- Le 27/10, les décorations sont retirées (la version reste 23) : celles d'une ancienne partie sont simplement oubliées au chargement (`charger` dans `sauvegarde.ts`), sans remboursement.

## 11. Fichiers du code

| Fichier | Rôle |
|---|---|
| `src/jeu/donnees.ts` (section « Le village en vue du ciel ») | Grille, `BATIMENTS` (taille, porte, niveau de mine, prix), `COUT_RAIL`, `COUT_CHEMIN`, vitesses, `DECORATIONS` (seulement nom et taille : les dessins de la plage et de l'écran d'accueil). |
| `src/jeu/village.ts` | La géométrie : cases occupées, portes, cases d'accès, chemins à pied (A\*), rails entre deux bâtiments (`railsEntre`, `railsMineMarche`), raccords des rails, pas de boucle (`feraitUneBoucle`). |
| `src/jeu/batiments.ts` | Les actions : construire, déplacer, retourner, poser et enlever rails (sans boucle) et chemins (remboursés depuis le 30/10, `retirerSol` ; `raisonSolImpossible` dit pourquoi on ne peut pas poser). |
| `src/jeu/wagonnet.ts` | Les trajets des wagonnets : créer, arrêter, chargement, pousseur, électricité, vitesse, livraison, retour. |
| `src/jeu/generateur.ts` | Le rayon du générateur (`casesDansLeRayon`). |
| `src/jeu/notifications.ts` | Les bulles au-dessus des bâtiments. |
| `src/jeu/employes.ts` | Le cycle des mineurs et des pousseurs, au village compris (le quai d'un pousseur : `maisonDe`). |
| `src/jeu/village.test.ts`, `src/jeu/voie.test.ts`, `src/jeu/wagonnet.test.ts`, `src/jeu/generateur.test.ts` | Les tests du village, de la voie (bords, virages doux, bulles des rails), du wagonnet et du générateur. |
| `src/composants/VueVillage.tsx` | La carte vue du ciel (caméra, toucher, glisser, pincer, bâtiment visé par un clic `batimentVise` (29/10 : sous le doigt avec `elementsFromPoint`, ou juste à côté), losange au sol du bâtiment survolé `.emprise-survol`, fantôme, personnages, wagonnets et leurs pousseurs, pousseurs au quai, trajet en surbrillance `trajetEnSurbrillance`, rayon du générateur, grille de construction, cabine de la mine, bulles, jauge du coffre au-dessus de la mine, « +X $ » des ventes au marché `ventesMarche`, pause des animations de la plage). |
| `src/composants/iso.ts` | Case de la grille ↔ point de l'écran, calage des images des bâtiments, l'image d'un bâtiment retourné (`IMAGES_BATIMENTS_MIROIR`, `imageBatiment`), point d'une image à l'écran (`pointSurSprite`), où se tiennent les personnages. |
| `src/composants/DessinsVillage.tsx` | Les dessins SVG : le terrain, la grille de construction, ce qui évolue sur la mine (cabine, panneau du niveau), rails (l'image de chaque case, butoirs compris : `codeDeVoie`), chemins, et les dessins des décorations (`DessinDecoration`, pour la plage et l'écran d'accueil). |
| `src/composants/WagonnetVillage.tsx` | Un wagonnet sur ses rails (un par trajet) : sa place entre ses deux essieux, son remplissage, et celui qui le pousse. |
| `src/composants/Wagonnet3D.tsx` | Le dessin du wagonnet en 3D (`DessinWagonnet3D`) : caisse, cadre d'acier, roues, ombres, minerais du chargement. |
| `src/composants/PanneauTrajets.tsx` | Les trajets qui partent d'un bâtiment, dans son panneau (mine, foreuse) : envoyer, pousser, arrêter, taille des wagonnets. |
| `src/composants/Rochers.tsx` | Les rochers en relief (`Rocher`, `TasDeRochers`). |
| `src/composants/ForetVillage.tsx`, `src/composants/arbres.ts` | La forêt. |
| `src/composants/PlageVillage.tsx`, `src/composants/plage.ts` | La plage et la mer ; `BOITES_PLAGE` : là où la plage bouge, pour mettre ses animations en pause quand on ne la voit pas. |
| `src/composants/ElementsVillage.tsx` | Un personnage posé sur la grille (`Perso`), l'image d'un bâtiment. |
| `src/composants/sprites.ts` | Les images des personnages : laquelle prendre (`spritePerso`, `choisirVue`), leur pied, leur taille. |
| `src/composants/MenuConstruction.tsx` | Le menu Bâtiments (bâtiments, rails, chemin de pavés). |
| `src/composants/FenetreRail.tsx` | (30/10) La fenêtre d'un rail touché qui ne relie encore rien : « ✏️ Déplacer ce rail », « 🗑️ Retirer (+3 🔩 fer) » (`BoutonsRail`, aussi en bas de `FenetreTrajet`). |
| `src/composants/fantome.ts` | Ce qu'on est en train de poser ou de déplacer. |
| `src/useJoueurVillage.ts` | La marche du joueur (flèches, chemin jusqu'à une case, saut). |
| `src/App.tsx` | Les barres du bas, la construction, Modifier, le panneau du bâtiment où l'on est, le joueur bloqué pendant qu'il pousse un wagonnet, le trajet regardé au Personnel (`apercuTrajet`). |
| `src/village.css` | Tout le style du village (dont le bloc à cliquer, les losanges du bâtiment survolé et du bâtiment ouvert, `.emprise-survol` et `.emprise-active` : depuis le 29/10 l'image d'un bâtiment n'a plus aucun filtre ni animation, elle devenait floue ; le rayon du générateur, le wagonnet électrique, le trajet en surbrillance). |
| `src/plein-ecran.css` | Le jeu en plein écran : la carte sur toute la fenêtre, les boutons posés dessus. |
| `outils/batiments/textes_miroir.py` | Fabrique `employes-miroir.webp` : chaque panneau à texte retourné sur place, pente inversée. |
| `public/images/village/`, `public/images/batiments/`, `public/images/personnages/`, `public/images/sol/` | La forêt, les images des bâtiments et de la mine, les personnages et portraits, les textures d'herbe et de sable. |

### Toucher un bâtiment (23/10)

Le joueur va toujours **devant** le bâtiment touché (ses deux côtés du bas de l'écran), par le plus court chemin depuis là où il est, puis son panneau s'ouvre. Même si on touche derrière le bâtiment (son toit, ou l'herbe juste derrière, dans la « zone de clic » de 1,6 case), il ne va jamais derrière, où le bâtiment le cacherait (`caseAccesProche` dans `village.ts`). S'il n'y a aucune place devant, il prend la plus proche autour.

Exception (23/10) : **la mine**, très grande, on s'y arrête du côté le plus proche, même derrière. Un **pousseur** embauché marche tout droit, par le plus court chemin, jusqu'à sa case de quai, à côté du premier rail de son trajet (`caseQuai`, `cheminEmploye` dans `employes.ts`).

