# 🎒 Bazar

> La boutique d'équipement du village : on y agrandit son sac à dos (7 tailles, de 32 à 2 048 places) pour porter plus de choses du coffre de la mine jusqu'au marché. (Les tenues du hamster, qu'on y achetait aussi, sont retirées depuis le 27/10.)

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **200 $ + 40 pierre** (30/10 ; 300 $ + 60 pierre le 29/10, 60 $ + 25 pierre avant ; la pierre se prend dans le sac, puis dans le coffre de la mine). Tant qu'il n'est pas posé, pas de sac plus grand (les missions proposent « Construis : Bazar »). **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : au **niveau 3 du joueur** (29/10 ; avant, dès le début). Avant, sa carte du menu Bâtiments a un cadenas « 🔒 Niveau 3 ». Voir [../jeu/niveaux.md](../jeu/niveaux.md).
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné).
- **L'ouvrir** : toucher (ou cliquer) le bazar : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case du bâtiment, de n'importe quel côté.
- **Dessin au village** : une image en vue isométrique (`public/images/batiments/bazar.webp`) : une échoppe en bois et en pierre, avec ses étals de sacs et d'équipement. Depuis le 29/10, l'image ne change plus (elle devenait floue) : au survol, un losange blanc doré s'allume au sol sous le bâtiment, et quand son panneau est ouvert, un losange doré en tirets.
- **Description** (en haut du panneau) : « Sacs à dos. »
- **Bulle au-dessus** (`notifications.ts`) : **💰 « Une amélioration est achetable ! »** quand le prochain sac est payable (depuis le 30/10, seulement pendant le tutoriel).
- Le bandeau du haut (`Hud.tsx`) montre en permanence le remplissage du sac (`n / taille`) ; la case clignote en rouge quand il est plein (« 🎒 Sac plein ! Va vendre au marché »).

## Ce qu'on peut y faire

Tous les achats se paient **seulement en argent**.

### 🎒 Sac à dos (bouton bleu « ⬆ *N* places »)

« Pour porter plus d'objets du coffre de la mine jusqu'au marché. » Une ligne d'amélioration : la taille actuelle, des petits carrés de niveaux (pleins = achetés, vides = à acheter), puis le prix et le bouton du sac suivant. Chaque achat remplace le sac par le suivant (on ne saute pas de taille). Il n'y a plus de plafond de niveau de mine, mais depuis le 29/10 chaque sac demande un **niveau du joueur** : avant, sa ligne affiche « 🔒 … · au niveau *N* ».

| Niveau | Places | Prix (30/10) | Niveau du joueur |
|---|---:|---:|---:|
| 1 | 32 | (sac de départ) | — |
| 2 | 64 | 150 $ | 3 |
| 3 | 128 | 1 200 $ | 5 |
| 4 | 256 | 6 000 $ | 8 |
| 5 | 512 | 25 000 $ | 11 |
| 6 | 1 024 | 90 000 $ | 14 |
| 7 | 2 048 | 300 000 $ | 15 |

Coût total de 32 à 2 048 places : 422 350 $ (30/10 : le premier sac est moins cher, les suivants bien plus ; 29/10 : 152 200 $, avec 200, 1 000, 4 000, 12 000, 35 000 et 100 000 $ ; avant le 29/10 : 61 980 $). Chaque sac acheté rapporte **30 XP**. Message à l'achat : « 🎒 Nouveau sac : *N* places ! ». Au dernier sac : « ✔ Niveau max ».

### 👕 Les tenues (retirées le 27/10)

Le Bazar vendait aussi des **tenues** pour le hamster (chapeaux et hauts, seulement pour le style). Elles ne se voyaient que dans un petit aperçu du panneau, jamais sur le personnage du village : elles sont **retirées depuis le 27/10**. Une ancienne partie se charge sans souci : les tenues achetées sont simplement oubliées (voir [sauvegarde-et-en-ligne.md](../jeu/sauvegarde-et-en-ligne.md)).

## Règles et comportement

- La taille du sac est le nombre total d'objets qu'il peut contenir, toutes sortes confondues (`tailleSac`, `placeLibre`).
- **Le sac ne se remplit plus en creusant** (22/10) : ce qu'on casse va dans le **coffre de la mine**. Le sac sert à **porter** : au panneau de la mine, « 🎒 Mettre dans le sac » y met une partie du coffre (tant qu'il y a de la place ; depuis le 30/10, un curseur par minerai choisit combien en prendre), puis on marche jusqu'au marché. On peut aussi y mettre le chariot de la foreuse.
- Un grand sac sert surtout **au début**, avant les rails : moins d'allers-retours à pied. Une fois le trajet Mine → Marché en route (poussé ou électrique), le sac sert beaucoup moins.
- **Payer avec le sac** : les minerais d'un achat se prennent d'abord dans le sac, puis dans le coffre.

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : tant que le bazar n'est pas posé, « Construis : Bazar ». Ensuite, le prochain sac fait partie des `achatsPossibles` (« Sac de *N* places »), ce qui fait apparaître la bulle 💰 et peut devenir une mission d'amélioration.
- **Autres bâtiments** : on remplit le sac au **coffre de la mine** et on le vide au **Marché**. Les mineurs employés ont leur propre sac, lié à leur pioche (au Personnel), pas au Bazar.
- **Bot de simulation** (`bot.ts`) : il achète le sac suivant quand il a trois fois son prix.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.bazar` : 200 $ + 40 pierre, 5 × 5, porte à droite), `SACS` (tailles et prix).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/mineur.ts` : `acheterSac`, `prixProchainSac`, `tailleSac`, `placeLibre`, `prendreDuCoffre`.
- `src/jeu/notifications.ts` : la bulle 💰 au-dessus du bazar.
- `src/jeu/missions.ts`, `src/jeu/objectifs.ts` : « Construis : Bazar », achat « Sac de *N* places ».
- `src/composants/Panneaux.tsx` : `PanneauBazar` (le sac).
- `src/composants/Amelioration.tsx` : la ligne d'amélioration (carrés de niveaux, bouton).
- `src/composants/MenuConstruction.tsx` : la carte du bazar dans le menu Bâtiments.
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille et sa bulle.
- `public/images/batiments/bazar.webp` : le dessin du bazar.
- `src/composants/Hud.tsx` : jauge du sac dans le bandeau.
- `src/village.css` : les bulles.
