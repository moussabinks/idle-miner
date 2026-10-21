# 🎒 Bazar

> La boutique d'équipement du village : on y agrandit son sac à dos (7 tailles, de 32 à 2 048 places) pour porter plus de choses du coffre de la mine jusqu'au marché, et on y achète des tenues pour le hamster.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **60 $ + 25 pierre** (la pierre se prend dans le sac, puis dans le coffre de la mine). Tant qu'il n'est pas posé, pas de sac plus grand ni de tenue (la barre d'objectif propose « Construire : Bazar »). **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : dès le début, sans cadenas.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné).
- **L'ouvrir** : toucher (ou cliquer) le bazar : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1,3 case du bâtiment, de n'importe quel côté.
- **Dessin au village** : une image en vue isométrique (`public/images/batiments/bazar.webp`) : une échoppe en bois et en pierre, avec ses étals de sacs et d'équipement. Elle brille en doré au survol et quand son panneau est ouvert.
- **Description** (en haut du panneau) : « Sacs à dos et tenues. »
- **Bulle au-dessus** (`notifications.ts`) : **💰 « Une amélioration est achetable ! »** quand le prochain sac est payable (les tenues ne comptent pas).
- Le bandeau du haut (`Hud.tsx`) montre en permanence le remplissage du sac (`n / taille`) ; la case clignote en rouge quand il est plein (« 🎒 Sac plein ! Va vendre au marché »).

## Ce qu'on peut y faire

Tous les achats se paient **seulement en argent**.

### 🎒 Sac à dos (bouton bleu « ⬆ *N* places »)

« Pour porter plus d'objets du coffre de la mine jusqu'au marché. » Une ligne d'amélioration : la taille actuelle, des petits carrés de niveaux (pleins = achetés, vides = à acheter), puis le prix et le bouton du sac suivant. Chaque achat remplace le sac par le suivant (on ne saute pas de taille). Il n'y a plus de plafond : tous les sacs sont achetables dès le début.

| Niveau | Places | Prix |
|---|---:|---:|
| 1 | 32 | (sac de départ) |
| 2 | 64 | 80 $ |
| 3 | 128 | 400 $ |
| 4 | 256 | 1 500 $ |
| 5 | 512 | 5 000 $ |
| 6 | 1 024 | 15 000 $ |
| 7 | 2 048 | 40 000 $ |

Coût total de 32 à 2 048 places : 61 980 $. Message à l'achat : « 🎒 Nouveau sac : *N* places ! ». Au dernier sac : « ✔ Niveau max ».

### 👕 Tenues du hamster (`PanneauTenues.tsx`)

Juste pour le style : elles ne donnent aucun bonus. Au début, le hamster du joueur n'a **ni chapeau** ni haut spécial, juste une chemise toute simple. Le panneau montre le hamster avec sa tenue du moment (c'est le seul endroit où elle se voit : le personnage du jeu est l'image de la planche du mineur), et deux listes : **🎩 Chapeaux** et **🦺 Hauts**.

| Tenue | Partie | Prix | À partir du niveau de mine |
|---|---|---:|---|
| Bandana rouge | chapeau | 150 $ | 1 |
| Casquette bleue | chapeau | 300 $ | 1 |
| Chapeau de paille | chapeau | 600 $ | 1 |
| Casque de chantier | chapeau | 1 200 $ | 1 |
| Haut-de-forme | chapeau | 5 000 $ | 2 |
| Couronne | chapeau | 30 000 $ | 4 |
| Gilet en cuir | haut | 400 $ | 1 |
| Salopette de mineur | haut | 900 $ | 1 |
| Gilet doré | haut | 12 000 $ | 3 |

- Une tenue pas encore permise affiche « 🔒 *nom* · au niveau *N* de la mine ».
- **Acheter** (bouton bleu avec le prix) : on la paie une fois et **on la porte tout de suite** (« 👕 … acheté(e) : tu le portes déjà ! »).
- **Porter** : changer pour une tenue déjà achetée est **gratuit** (bouton « Porter », « ✔ Portée » pour celle qu'on a). Les liens **« Enlever »** (chapeau) et **« Tenue de départ »** (haut) reviennent à la tenue de base.

## Règles et comportement

- La taille du sac est le nombre total d'objets qu'il peut contenir, toutes sortes confondues (`tailleSac`, `placeLibre`).
- **Le sac ne se remplit plus en creusant** (22/10) : ce qu'on casse va dans le **coffre de la mine**. Le sac sert à **porter** : au panneau de la mine, « 🎒 Mettre dans le sac » y met une partie du coffre (tant qu'il y a de la place), puis on marche jusqu'au marché. On peut aussi y mettre le chariot de la foreuse.
- Un grand sac sert surtout **au début**, avant les rails : moins d'allers-retours à pied. Une fois le wagonnet en route (poussé ou électrique), le sac sert beaucoup moins.
- **Payer avec le sac** : les minerais d'un achat se prennent d'abord dans le sac, puis dans le coffre.

## Lien avec le reste du jeu

- **Objectifs** (`objectifs.ts`) : tant que le bazar n'est pas posé, « Construire : Bazar ». Ensuite, le prochain sac fait partie des `achatsPossibles` (« Sac de *N* places »), ce qui fait apparaître la bulle 💰 et peut devenir le prochain objectif (« achetable au bazar ! »). Les tenues ne sont jamais des objectifs.
- **Autres bâtiments** : on remplit le sac au **coffre de la mine** et on le vide au **Marché**. Les mineurs employés ont leur propre sac, lié à leur pioche (au Personnel), pas au Bazar.
- **Bot de simulation** (`bot.ts`) : il achète le sac suivant quand il a trois fois son prix.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.bazar` : 60 $ + 25 pierre, 5 × 5, porte à droite), `SACS` (tailles et prix), les tenues (`TENUES`, `LISTE_TENUES`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/mineur.ts` : `acheterSac`, `prixProchainSac`, `tailleSac`, `placeLibre`, `prendreDuCoffre`.
- `src/jeu/tenues.ts` : `tenueDebloquee`, `peutAcheterTenue`, `acheterTenue`, `porterTenue`.
- `src/jeu/notifications.ts` : la bulle 💰 au-dessus du bazar.
- `src/jeu/objectifs.ts` : « Construire : Bazar », achat « Sac de *N* places ».
- `src/composants/Panneaux.tsx` : `PanneauBazar` (le sac).
- `src/composants/PanneauTenues.tsx` : les tenues, avec l'aperçu du hamster.
- `src/composants/Hamster.tsx` : le hamster en SVG de l'aperçu des tenues, avec ses chapeaux et hauts. Les personnages du jeu sont les images des planches (`sprites.ts`) : **les tenues ne se voient que dans cet aperçu**, en attendant une planche du joueur avec ses tenues.
- `src/composants/Amelioration.tsx` : la ligne d'amélioration (carrés de niveaux, bouton).
- `src/composants/MenuConstruction.tsx` : la carte du bazar dans le menu Bâtiments.
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille et sa bulle.
- `public/images/batiments/bazar.webp` : le dessin du bazar.
- `src/composants/Hud.tsx` : jauge du sac dans le bandeau.
- `src/village.css` : les tenues (`.tenues`, `.ligne-tenue`) et les bulles.
