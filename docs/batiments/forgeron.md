# ⚒️ Forgeron

> Le bâtiment où l'on débloque, rachète, répare et change de pioche. Depuis le 22/10, la pioche ne décide plus de la vitesse ni de la profondeur : chaque clic casse un bloc, et une meilleure pioche donne plus de chances de **doubler les minerais**.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **20 $ + 10 pierre** (30/10 ; 30 $ + 15 pierre le 29/10, 20 $ + 15 pierre avant ; la pierre se prend dans le sac, puis dans le coffre de la mine). Tant qu'il n'est pas posé, on ne peut ni acheter ni réparer de pioche (les missions proposent « Construis : Forgeron »). **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : dès le début (niveau 1 du joueur), jamais de cadenas. C'est la dernière étape du **tutoriel** (29/10) : après la première vente, Pépite fait construire le forgeron (s'il manque de l'argent ou de la pierre, elle renvoie creuser et vendre ; depuis le 30/10, elle dit ce qui manque : « Récupère 10 pierre : *n* / 10 » ou « Gagne 20 $ : *n* / 20 », et dès qu'on peut le payer, le panneau de la mine se ferme pour que la flèche montre le menu Bâtiments). Les pioches suivantes, elles, demandent un **niveau du joueur** (voir les chiffres).
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné).
- **L'ouvrir** : toucher (ou cliquer) le forgeron : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case du bâtiment, de n'importe quel côté.
- **Dessin au village** : une image en vue isométrique (`public/images/batiments/forgeron.webp`) : une forge en pierre et en bois avec son toit, sa cheminée qui fume, son enclume et des pioches exposées. Depuis le 29/10, l'image ne change plus (elle devenait floue) : au survol, un losange blanc doré s'allume au sol sous le bâtiment, et quand son panneau est ouvert, un losange doré en tirets.
- **Description** (en haut du panneau) : « Pioches et réparations. »
- **Bulles au-dessus** (`notifications.ts`) :
  - **🔧 « Ta pioche est cassée : fais-la réparer ! »** (bulle rouge d'alerte) quand la pioche équipée est cassée ;
  - **💰 « Une amélioration est achetable ! »** quand on a de quoi **débloquer la pioche suivante** (argent **et** minerais, du sac ou du coffre) et qu'on a le niveau du joueur qu'elle demande (29/10) ; depuis le 30/10, **seulement pendant le tutoriel**. Pas pour une réparation.
- **Les mineurs employés y passent** : quand tu améliores la pioche d'un mineur au Personnel, il vient la chercher ici (voir plus bas).

## Ce qu'on peut y faire

Depuis le 27/10, le panneau est plus court : il montre seulement **la pioche en main** et **la prochaine à débloquer**. Les autres pioches qu'on possède sont rangées dans un menu repliable **« Autres pioches (*n*) »**. S'il en reste plus loin, une ligne dit « 🔒 Encore *n* pioche(s) à débloquer ensuite. » Depuis le 29/10, si la prochaine pioche demande un niveau du joueur qu'on n'a pas encore, elle est remplacée par une ligne en pointillés « 🔒 Pioche en *X* · au niveau *N* » (sans bouton). Pour chaque pioche montrée : son nom, le badge **« Équipée »** si c'est celle qu'on tient, la ligne « *N* % de chance de doubler un minerai · durabilité *D* clics », et, si on la possède, une **barre de durabilité** (verte, « restant / total », ou rouge « Cassée : 2 clics par bloc »).

| Bouton | Quand il apparaît | Ce qu'il fait |
|---|---|---|
| **🔓 Débloquer** | la pioche juste après la meilleure qu'on a | Paie le prix (argent + minerais), donne la pioche neuve et l'équipe. « ⛏️ Nouvelle pioche en X : *N* % de chance de doubler les minerais ! » |
| **🛒 Racheter neuve** | chaque pioche déjà débloquée, sauf celle en pierre | Paie le prix entier, remet la pioche à neuf (usure 0) et l'équipe. « ⛏️ Pioche en X neuve. » |
| **🔧 Réparer** (orange) | une pioche qu'on possède et qui est usée | Paie la réparation (selon l'usure) et remet la pioche à neuf. « 🔧 Pioche en X réparée. » Elle n'est pas équipée pour autant. |
| **Équiper** (gris) | une pioche qu'on possède mais qu'on ne tient pas | La prend en main (gratuit). « Tu as pris la pioche en X. » |

Chaque achat affiche son prix à gauche du bouton (en vert ce qu'on a, en rouge ce qui manque). Le bouton est grisé si on ne peut pas payer.

### Les pioches

Valeurs de `PIOCHES` (`src/jeu/donnees.ts`). La pioche en **pierre** est offerte au début de la partie (il n'y a plus de pioche en bois ni en netherite).

| Pioche | Chance de doubler un minerai | Durabilité | Prix pour la débloquer (30/10) | Niveau du joueur | Réparation (pioche cassée) |
|---|---:|---:|---|---:|---|
| 🪨 Pierre | 10 % | 150 clics | (offerte) | — | 5 $ + 10 pierre |
| ⚙️ Fer | 20 % | 300 clics | 400 $ + 20 fer | 4 | 30 $ + 5 fer |
| 🟡 Or | 30 % | 500 clics | 4 000 $ + 40 or | 7 | 150 $ + 5 or |
| 💎 Diamant | 45 % | 1 000 clics | 20 000 $ + 20 diamants | 12 | 600 $ + 3 diamants |
| 💥 Cassée | 0 % | — | — | — | — |

La pioche en fer est moins chère depuis le 30/10 (29/10 : 500 $ + 40 fer). Avant le 29/10 : 200 $ + 25 fer, 1 500 $ + 20 or et 8 000 $ + 10 diamants. Les réparations n'ont pas changé. Débloquer une pioche rapporte **30 XP** (une seule fois : racheter une pioche neuve ne redonne rien).

L'or sort de la mine au niveau 3 et le diamant au niveau 5 : la pioche en or attend donc le niveau 3, et celle en diamant le niveau 5.

### Le prix d'une réparation

La réparation coûte **une part du prix de réparation, selon l'usure** (`coutReparation`) : part = clics déjà donnés ÷ durabilité. L'argent et chaque minerai sont arrondis au-dessus, avec **au moins 1 $ et 1 minerai**. Une pioche cassée coûte le prix plein du tableau ci-dessus.

| Pioche | Cassée | À moitié usée |
|---|---|---|
| Pierre | 5 $ + 10 pierre | 3 $ + 5 pierre |
| Fer | 30 $ + 5 fer | 15 $ + 3 fer |
| Or | 150 $ + 5 or | 75 $ + 3 or |
| Diamant | 600 $ + 3 diamants | 300 $ + 2 diamants |

## Règles et comportement

### Le doublement

- Chaque clic sur le bloc de la mine casse **un bloc** (la pioche ne change pas la vitesse). Si ce bloc est un **minerai** (tout sauf la pierre), il y a la chance de la pioche (10 à 45 %) d'en avoir **2** au lieu d'1 (`chanceDoublement`). Jamais plus de 2 (sauf avec un bonus de combo, voir plus bas).
- Le doublement ne vaut **que pour les clics du joueur** : la mine toute seule, les mineurs employés et la foreuse ne doublent jamais.
- Depuis le 30/10, un **bonus de combo** (en cliquant vite : 10, 25, 50… clics d'affilée) ajoute pendant quelques secondes sa « fortune » à cette chance (+25 % à +100 %, au plus 100 % en tout, même avec une pioche cassée), et les plus gros font tomber 2, 3 ou 5 blocs par clic. Voir [mine.md](mine.md) et [../jeu/mine-et-minage.md](../jeu/mine-et-minage.md).

### L'usure

- Chaque clic qui casse un bloc avec une pioche qui n'est pas cassée lui retire **1 point** de durabilité (toujours, plus de hasard). La pioche en pierre tient donc 150 clics, celle en diamant 1 000.
- Quand la durabilité tombe à 0 : « 💥 Ta pioche en X est cassée ! Il faut 2 clics par bloc : fais-la réparer au forgeron. », avec un son de casse. Le bandeau affiche « 💥 Pioche cassée (2 clics par bloc) » et une barre rouge « Cassée ! ».
- **Pioche cassée** : il faut **2 clics par bloc** (`CLICS_MAINS_NUES`), sans doublement, et elle ne s'use plus.
- Chaque pioche garde sa propre usure : changer de pioche ne répare rien.

### Cas limites

- **On n'est jamais bloqué** : une pioche cassée casse encore un bloc tous les 2 clics. Même sans argent, on peut donc toujours remplir le coffre et aller vendre.
- **La pioche en pierre ne se rachète pas** (pas de bouton) : elle se répare seulement, pour pas cher (5 $ + 10 pierre au plus).
- **Un seul déblocage à la fois** : on ne peut débloquer que la pioche juste après la meilleure (`niveau ≤ meilleure + 1`), et seulement avec le niveau du joueur qu'elle demande (`debloque(etat, 'pioches', niveau)` dans `peutAcheterPioche`, 29/10). Une pioche déjà débloquée se rachète toujours.
- **Racheter neuve demande aussi les minerais** de la pioche (20 fer, 40 or ou 20 diamants), comme pour la débloquer.
- **Réparer n'équipe pas** la pioche (racheter et débloquer, si).
- Les minerais se paient avec le **sac, puis le coffre de la mine** : pas besoin de les porter jusqu'à la forge.

## Lien avec le reste du jeu

- **Missions** (`src/jeu/missions.ts`, `src/jeu/objectifs.ts`) : tant que le forgeron n'est pas posé, une mission dit « Construis : Forgeron » (avec ce qu'il manque : « Gagne *X* $ » ou « Récupère *N* pierre »). Une fois posé, la pioche suivante est le **premier** achat d'amélioration de `achatsPossibles` (juste après les bâtiments à construire). Si on peut la payer, la bulle 💰 apparaît ; sinon, une mission d'amélioration peut la proposer (« 🪨 12/25 » ou « 💵 180/200 »).
- **Stand Personnel** : les pioches des mineurs employés (`NIVEAUX_EMPLOYE` : bois, pierre, fer, or, diamant) s'achètent là-bas, en argent seulement. Elles ne s'usent pas. **Si un forgeron est posé**, le mineur amélioré vient **chercher sa pioche à la forge** : « ⛏️ X va chercher sa pioche en … à la forge. » À la fin de son tour (après avoir vidé son sac dans le coffre), il marche jusqu'au forgeron, y reste **3 secondes** (`SECONDES_FORGE_EMPLOYE`, « 🔨 récupère sa nouvelle pioche »), puis retourne à la mine. Sa nouvelle pioche compte tout de suite. Sans forgeron, il l'a directement (« ⛏️ X a maintenant une pioche en … »).
- **Bandeau** (`src/composants/Hud.tsx`) : la pioche équipée et sa barre de durabilité.
- **Panneau de la mine** : le rappel « ⛏️ *N* % de chance de doubler un minerai » à côté du bloc.
- **Succès** : « ⚙️ Âge du fer », « 🥇 Pioche dorée » et « 💎 Diamants ! » se débloquent avec les pioches en fer, or et diamant.
- **Sons** : débloquer une pioche joue la petite fanfare d'amélioration ; un rachat ou une réparation joue le son d'achat ; une pioche qui casse a son propre son (« clang » triste).
- **Bot de simulation** (`src/jeu/bot.ts`) : il répare dès que sa pioche casse, débloque la suivante dès qu'il peut, et garde (sans les vendre) les minerais de la prochaine pioche et de la réparation.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.forgeron` : 20 $ + 10 pierre, 5 × 5, porte à droite), les pioches (`PIOCHES` : doublement, durabilité, prix, réparation, couleur), `CLICS_MAINS_NUES` et `SECONDES_FORGE_EMPLOYE`.
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/mineur.ts` : les règles des pioches (`acheterPioche`, `peutAcheterPioche`, `coutPioche`, `equiper`, `coutReparation`, `reparer`, `usure`, `estCassee`, `chanceDoublement`), le clic et l'usure (`cliquerMine`).
- `src/jeu/employes.ts` : le passage des mineurs à la forge (`ameliorerEmploye`, `forgeEnAttente`, étape `forge`).
- `src/jeu/notifications.ts` : les bulles 🔧 « pioche cassée » et 💰 « achetable ».
- `src/jeu/missions.ts`, `src/jeu/objectifs.ts` : « Construis : Forgeron », puis la pioche suivante.
- `src/jeu/succes.ts` : les trois succès des pioches.
- `src/composants/Panneaux.tsx` : le panneau du forgeron (`PanneauPioches`).
- `src/composants/Amelioration.tsx` : le composant `Achat` (prix à gauche, bouton à droite).
- `src/composants/Hud.tsx` : la pioche équipée et sa durabilité dans le bandeau.
- `src/composants/MenuConstruction.tsx` : la carte du forgeron dans le menu Bâtiments.
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille, la bulle, les mineurs qui récupèrent leur pioche devant la forge.
- `public/images/batiments/forgeron.webp` : le dessin de la forge.
- `src/evenements.ts`, `src/sons.ts` : les sons d'achat, d'amélioration et de pioche cassée.
