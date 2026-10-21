# 🎒 Bazar

> La boutique d'équipement du village : on y agrandit son sac à dos (7 tailles, de 32 à 2 048 places), on y achète des seaux d'eau pour éteindre la lave, et (20/10) des tenues pour le hamster.

## Où et quand

- **Où** : là où tu le poses dans la clairière (20/10) : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **60 $ + 15 pierre** (la roche dure compte aussi comme de la pierre). Tant qu'il n'est pas posé, pas de sac plus grand, de seau ni de tenue (la barre d'objectif propose « Construire : Bazar »). Il reste posé à chaque prestige ; **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : ouvert dès le début (prestige 0), sans cadenas.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné).
- **L'ouvrir** : toucher (ou cliquer) le bazar : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1,3 case du bâtiment, de n'importe quel côté (21/10).
- **Dessin au village** : une image en vue isométrique (`public/images/batiments/bazar.webp`) : une échoppe en bois et en pierre, avec ses étals de sacs et d'équipement. Elle brille en doré au survol et quand son panneau est ouvert.
- **Description** (en haut du panneau) : « Sacs à dos, seaux d'eau et tenues. »
- **Bulles au-dessus** (`notifications.ts`) :
  - **💰 « Une amélioration est achetable ! »** quand le prochain sac est à la fois permis par le prestige et payable (le seau et les tenues ne comptent pas) ;
  - **⬆️ « Nouveaux niveaux débloqués ! »** après un prestige qui a débloqué un sac de plus : aux prestiges 2, 3, 4 et 5. Elle disparaît dès qu'on passe devant. Pas de bulle au prestige 1 (le plafond reste à 128 places).
- Le bandeau du haut (`Hud.tsx`) montre en permanence le remplissage du sac (`n / taille`, la case clignote en rouge quand il est plein) et le nombre de seaux (`🪣 n`).

## Ce qu'on peut y faire

Tous les achats se font **au village, devant le bazar, à l'arrêt** (`aLaSurface`) et se paient **seulement en argent**.

### 🎒 Sac à dos (bouton bleu « ⬆ N places »)

Une ligne d'amélioration : la taille actuelle, des petits carrés de niveaux (pleins = achetés, vides = permis, avec cadenas = bloqués par le prestige), puis le prix et le bouton du sac suivant. Chaque achat remplace le sac par le suivant (on ne saute pas de taille).

| Niveau (code) | Niveau affiché | Places | Prix | Permis à partir du prestige |
|---|---|---|---|---|
| 0 | 1 | 32 | gratuit (sac de départ) | 0 |
| 1 | 2 | 64 | 80 $ | 0 |
| 2 | 3 | 128 | 400 $ | 0 |
| 3 | 4 | 256 | 1 500 $ | 2 |
| 4 | 5 | 512 | 5 000 $ | 3 |
| 5 | 6 | 1 024 | 15 000 $ | 4 |
| 6 | 7 | 2 048 | 40 000 $ | 5 |

Coût total de 32 à 2 048 places : 61 980 $. Message à l'achat : « 🎒 Nouveau sac : N places ! ».

### 🪣 Seau d'eau (bouton bleu « 🪣 Acheter »)

- **Prix : 25 $** le seau (`PRIX_SEAU`), un par clic, **sans limite** de nombre.
- Le panneau rappelle : « Transforme une lave en obsidienne (60 $) au lieu de brûler ton sac. Tu en as N. »
- Message à l'achat : « 🪣 Seau d'eau acheté. »

### 👕 Tenues du hamster (20/10, `PanneauTenues.tsx`)

Juste pour le style : elles ne donnent aucun bonus. Au début, le hamster du joueur n'a **ni casque ni chapeau**, juste une chemise toute simple et sa pioche. Le panneau montre le hamster avec sa tenue du moment (depuis le 21/10, c'est le seul endroit où elle se voit : le personnage du jeu est l'image de la planche du mineur), et deux listes : **🎩 Chapeaux** et **🦺 Hauts**.

| Tenue | Partie | Prix | À partir du prestige |
|---|---|---:|---|
| Bandana rouge | chapeau | 150 $ | 0 |
| Casquette bleue | chapeau | 300 $ | 0 |
| Chapeau de paille | chapeau | 600 $ | 0 |
| Casque de chantier | chapeau | 1 200 $ | 0 |
| Haut-de-forme | chapeau | 5 000 $ | 1 |
| Couronne | chapeau | 30 000 $ | 3 |
| Gilet en cuir | haut | 400 $ | 0 |
| Salopette de mineur | haut | 900 $ | 0 |
| Gilet doré | haut | 12 000 $ | 2 |

- Une tenue pas encore permise affiche « 🔒 … au prestige N ».
- **Acheter** (bouton bleu avec le prix) : on la paie une fois et **on la porte tout de suite** (« 👕 … acheté(e) : tu le portes déjà ! »).
- **Porter** : changer pour une tenue déjà achetée est **gratuit** (bouton « Porter », « ✔ Portée » pour celle qu'on a). Les liens **« Enlever »** (chapeau) et **« Tenue de départ »** (haut) reviennent à la tenue de base.
- On voit la tenue partout : sur la carte du village, dans l'aperçu du Bazar, et dans la vue en coupe de la mine.
- **Au prestige** : les tenues achetées et la tenue portée sont **gardées** (comme tout le village).

## Règles et comportement

### Le sac

- La taille du sac est le nombre total d'objets qu'il peut contenir, toutes sortes confondues (`tailleSac`, `placeLibre`).
- Quand le sac est plein, ce qu'on casse va sur le **quai de l'ascenseur** s'il y a de la place ; sinon l'objet est perdu, avec le message « 🎒 Sac plein ! Remonte vendre au marché… ».
- **Plafond par prestige** (`PLAFONDS.sac` : déblocage au prestige 1, niveau 2 au déblocage, +1 par prestige, max 6) :

| Prestige | Niveau max (code) | Plus grand sac permis |
|---|---|---|
| 0 | 2 | 128 places |
| 1 | 2 | 128 places |
| 2 | 3 | 256 places |
| 3 | 4 | 512 places |
| 4 | 5 | 1 024 places |
| 5 et plus | 6 | 2 048 places |

  Au-delà, la ligne affiche « 🔒 ⬆ N places · au prestige P » (`sacBloqueAuPrestige`, `prestigePourNiveau`). Au dernier sac : « ✔ Niveau max ».
- **Au prestige** : le sac à dos est **gardé** (même taille), mais il repart **vide** (le contenu ne suit pas).

### Les seaux et la lave

- La lave apparaît sous la profondeur de référence 47 m (`mine.ts`, poids 1,5), mise à l'échelle de la mine du prestige : vers -32 m au prestige 0 (47 × 100/150), -47 m au prestige 1, -63 m au prestige 2…
- En cassant une lave **avec au moins un seau** : un seau est consommé, on gagne **1 obsidienne** (vendue 60 $ de base au marché), rangée dans le sac (ou sur le quai s'il est plein), et le compteur « laves éteintes » augmente. Message : « 🪣 Lave éteinte avec ton seau : +1 obsidienne ! »
- **Sans seau** : la lave brûle **un tiers (arrondi en dessous) de chaque pile** du sac (le quai de l'ascenseur n'est pas touché). Message : « 🔥 Aïe, de la lave ! N objets brûlés. Achète un seau d'eau. »
- Un seau rapporte donc 35 $ de plus qu'il ne coûte (60 − 25), sans compter le sac sauvé.
- **Au prestige** : les seaux sont **remis à 0**.
- La foreuse ne tire jamais de lave (`tirerBloc` « normal ») : les seaux ne servent qu'au joueur.

## Lien avec le reste du jeu

- **Conditions de prestige** (`conditionsPrestige.ts`) : « 🎒 Sac de N places » où N est le plus grand sac permis au prestige actuel (128 places aux prestiges 0 et 1, 256 au prestige 2…). Les seaux ne comptent pas.
- **Objectifs** (`objectifs.ts`) : tant que le bazar n'est pas posé, « Construire : Bazar ». Ensuite, le prochain sac fait partie des `achatsPossibles` (« Sac de N places »), ce qui fait apparaître la bulle 💰 et peut devenir le prochain objectif (« achetable au bazar ! »). Le bazar est aussi dans la liste des bâtiments qui peuvent avoir de « Nouveaux niveaux » (plafond `sac`). Les tenues ne sont jamais des objectifs.
- **Succès** (`succes.ts`) : « 🪣 Pompier : éteindre de la lave avec un seau ».
- **Statistiques** : nombre de laves éteintes.
- **Autres bâtiments** : on vend le contenu du sac au **Marché** ; l'**ascenseur** (entrée de la mine) remonte le sac et recueille le trop-plein sur son quai ; les minerais du sac servent à payer le **Forgeron**, l’**Enchanteur** et la **Foreuse**, et (20/10) la pierre et le fer des **bâtiments** à poser. Les mineurs employés ont leur propre sac, lié à leur pioche (au Personnel), pas au Bazar.
- **Bot de simulation** (`bot.ts`) : il garde 2 seaux d'avance et achète le sac suivant quand il a deux fois son prix.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.bazar` : 60 $ + 15 pierre, 5 × 5, porte à droite), `SACS` (tailles et prix), `PRIX_SEAU`, `PLAFONDS.sac`, `niveauMaxAuPrestige`, `prestigePourNiveau`, les tenues (`TENUES`, `LISTE_TENUES`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/mineur.ts` : `acheterSac`, `prixProchainSac`, `sacBloqueAuPrestige`, `acheterSeau`, `tailleSac`, `placeLibre`, effet de la lave dans `recolter`, garde du sac, des tenues (`tenue`, `tenuesAchetees`) au `prestige`.
- `src/jeu/tenues.ts` : `tenueDebloquee`, `peutAcheterTenue`, `acheterTenue`, `porterTenue`.
- `src/jeu/mine.ts` : profondeur d'apparition de la lave.
- `src/jeu/conditionsPrestige.ts` : la condition « Sac de N places ».
- `src/jeu/notifications.ts` : les bulles 💰 et ⬆️ au-dessus du bazar.
- `src/jeu/objectifs.ts` : « Construire : Bazar », achat « Sac de N places », badge « Nouveaux niveaux ».
- `src/jeu/succes.ts` : le succès « Pompier ».
- `src/composants/Panneaux.tsx` : `PanneauBazar` (sacs et seaux).
- `src/composants/PanneauTenues.tsx` : les tenues, avec l'aperçu du hamster.
- `src/composants/Hamster.tsx` : le hamster en SVG de l'aperçu des tenues, avec ses chapeaux et hauts. Depuis le 21/10, les personnages du jeu sont les images des planches (`sprites.ts`) : **les tenues ne se voient que dans cet aperçu**, en attendant une planche du joueur avec ses tenues.
- `src/composants/Amelioration.tsx` : la ligne d'amélioration (carrés de niveaux, cadenas, bouton).
- `src/composants/MenuConstruction.tsx` : la carte du bazar dans le menu Bâtiments.
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille et ses bulles.
- `public/images/batiments/bazar.webp` : le dessin du bazar.
- `src/composants/Hud.tsx` : jauge du sac et nombre de seaux dans le bandeau.
- `src/village.css` : les tenues (`.tenues`, `.ligne-tenue`) et les bulles.
