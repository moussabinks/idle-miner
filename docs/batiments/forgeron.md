# ⚒️ Forgeron

> Le bâtiment où l'on débloque, rachète, répare et change de pioche. La pioche ne décide pas de la vitesse : chaque clic casse un bloc, et une meilleure pioche donne plus de chances de **doubler les minerais**.
> Mis à jour pour la grande mise à jour du 25/10 : nouveaux prix, chaque pioche suit le **palier** de la mine (fer au niveau 2 de la mine, or au 3, émeraude au 4, diamant au 5), plus de sac. Le panneau a été refait dans le nouveau style.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **30 $ + 15 pierre** (25/10 ; avant 20 $ + 10 pierre ; la pierre se prend dans le coffre de la mine). Tant qu'il n'est pas posé, on ne peut ni acheter ni réparer de pioche (les missions proposent « Construis : Forgeron »). **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : dès le début, jamais de cadenas. Depuis le 25/10, le tutoriel ne le fait plus construire (il va jusqu'au premier mineur) : la liste des tâches le propose ensuite (« Construis : Forgeron »). Les pioches suivantes, elles, demandent un **palier** de la mine (voir les chiffres).
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné).
- **L'ouvrir** : toucher (ou cliquer) le forgeron : la taupe du joueur marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case du bâtiment, de n'importe quel côté.
- **Le dessin au village** (25/10, SVG plat au contour d'encre, `public/images/batiments/forgeron.svg`, dessiné par `forgeron()` dans `outils/art/batiments.mjs`) : redessiné le 25/10 pour qu'on reconnaisse une forge au premier coup d'œil : sur une dalle de 5 × 5 pavés, au fond à droite, un **grand four en pierre sombre** dont la bouche (une arche de pierres claires) crache de grandes **flammes orange et jaunes** sur un lit de braises, une **haute cheminée en briques** qui fume, les outils accrochés au mur (pioche, pince, marteau) et un tonneau d'eau qui fume (pour tremper le fer) ; devant, une **lueur orange** sur les pavés, la **grosse enclume noire** sur sa souche avec une barre de fer rouge, le marteau appuyé contre elle et des **étincelles**, une meule à aiguiser, un tonneau plein d'épées et un tas de charbon (voir [../jeu/visuel-et-sons.md](../jeu/visuel-et-sons.md)).
- **Description** (en haut du panneau) : « Pioches et réparations. »
- **Bulles au-dessus** (`notifications.ts`) :
  - **🔧 « Ta pioche est cassée : fais-la réparer ! »** (bulle rouge d'alerte) quand la pioche équipée est cassée ;
  - **⬆️ « Achetable »** quand on a de quoi **débloquer la pioche suivante** (argent **et** minerais du coffre) et qu'on a le palier qu'elle demande ; **seulement pendant le tutoriel**. Pas pour une réparation.
- **Les pioches des mineurs** : quand tu améliores la pioche d'un mineur au Personnel, le forgeron la fait (3 s) et elle lui descend par l'ascenseur (voir plus bas).

## Ce qu'on peut y faire

Depuis le 27/10, le panneau est plus court : il montre seulement **la pioche en main** et **la prochaine à débloquer**. Les autres pioches qu'on possède sont rangées dans un menu repliable **« Autres pioches (*n*) »**. S'il en reste plus loin, une ligne dit « 🔒 Encore *n* pioche(s) à débloquer ensuite. » Si la prochaine pioche demande un palier de la mine qu'on n'a pas encore, elle a le cadenas « 🕳️ Mine *N* » (sans bouton). (Le panneau a été refait le 25/10 : la pioche en main, la suivante, et celles qu'on a déjà.) Pour chaque pioche montrée : son nom, le badge **« Équipée »** si c'est celle qu'on tient, la ligne « *N* % de chance de doubler un minerai · durabilité *D* clics », et, si on la possède, une **barre de durabilité** (verte, « restant / total », ou rouge « Cassée : 2 clics par bloc »).

| Bouton | Quand il apparaît | Ce qu'il fait |
|---|---|---|
| **🔓 Débloquer** | la pioche juste après la meilleure qu'on a | Paie le prix (argent + minerais), donne la pioche neuve et l'équipe. « ⛏️ Nouvelle pioche en X : *N* % de chance de doubler les minerais ! » |
| **🛒 Racheter neuve** | chaque pioche déjà débloquée, sauf celle en pierre | Paie le prix entier, remet la pioche à neuf (usure 0) et l'équipe. « ⛏️ Pioche en X neuve. » |
| **🔧 Réparer** (orange) | une pioche qu'on possède et qui est usée | Paie la réparation (selon l'usure) et remet la pioche à neuf. « 🔧 Pioche en X réparée. » Elle n'est pas équipée pour autant. |
| **Équiper** (gris) | une pioche qu'on possède mais qu'on ne tient pas | La prend en main (gratuit). « Tu as pris la pioche en X. » |

Chaque achat affiche son prix à gauche du bouton (en vert ce qu'on a, en rouge ce qui manque). Le bouton est grisé si on ne peut pas payer.

### Les pioches

Valeurs de `PIOCHES` (`src/jeu/donnees.ts`). La pioche en **pierre** est offerte au début de la partie (il n'y a plus de pioche en bois ni en netherite).

| Pioche | Chance de doubler un minerai | Durabilité | Prix pour la débloquer (25/10) | Palier (niveau de la mine) | Réparation (pioche cassée) |
|---|---:|---:|---|---:|---|
| 🪨 Pierre | 10 % | 150 clics | (offerte) | — | 5 $ + 10 pierre |
| ⚙️ Fer | 20 % | 300 clics | 300 $ + 20 fer | 2 | 30 $ + 5 fer |
| 🟡 Or | 30 % | 500 clics | 2 500 $ + 30 or | 3 | 150 $ + 5 or |
| 💚 Émeraude | 38 % | 750 clics | 6 000 $ + 25 émeraudes | 4 | 300 $ + 4 émeraudes |
| 💎 Diamant | 45 % | 1 000 clics | 15 000 $ + 15 diamants | 5 | 600 $ + 3 diamants |
| 💥 Cassée | 0 % | — | — | — | — |

Avant le 25/10 : 400 $ + 20 fer, 4 000 $ + 40 or, 9 000 $ + 25 émeraudes et 20 000 $ + 20 diamants, débloquées aux niveaux 4, 7, 10 et 12 du joueur. (25/10, économie revue : l'or, l'émeraude et le diamant coûtaient d'abord 3 500 $, 9 000 $ et 25 000 $.) Les réparations n'ont pas changé. Débloquer une pioche rapporte **30 XP** (plus 1 XP par 25 $ de son prix ; une seule fois : racheter une pioche neuve ne redonne rien). Chaque pioche peut aussi se payer en gemmes (bouton violet 💎).

Chaque pioche arrive avec le niveau de la mine où sort son minerai : l'or au niveau 3, l'émeraude au 4, le diamant au 5.

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
- **Un seul déblocage à la fois** : on ne peut débloquer que la pioche juste après la meilleure (`niveau ≤ meilleure + 1`), et seulement avec le palier qu'elle demande (`debloque(etat, 'pioches', niveau)` dans `peutAcheterPioche`). Une pioche déjà débloquée se rachète toujours.
- **Racheter neuve demande aussi les minerais** de la pioche (20 fer, 30 or, 25 émeraudes ou 15 diamants), comme pour la débloquer.
- **Réparer n'équipe pas** la pioche (racheter et débloquer, si).
- Les minerais se paient avec le **coffre de la mine** : pas besoin de les porter jusqu'à la forge. Une punaise 📌 sur le fer (ou l'or…) au panneau de la mine évite de le vendre par erreur.

## Lien avec le reste du jeu

- **Missions** (`src/jeu/missions.ts`, `src/jeu/objectifs.ts`) : tant que le forgeron n'est pas posé, une mission dit « Construis : Forgeron » (avec ce qu'il manque : « Gagne *X* $ » ou « Récupère *N* pierre »). Une fois posé, la pioche suivante est le **premier** achat d'amélioration de `achatsPossibles` (juste après les bâtiments à construire). Si on peut la payer, la bulle 💰 apparaît ; sinon, une mission d'amélioration peut la proposer (« 🪨 12/25 » ou « 💵 180/200 »).
- **Personnel** : les pioches des mineurs employés (`NIVEAUX_EMPLOYE` : bois, fer, or, émeraude, diamant) s'achètent là-bas, en argent seulement, avec le même palier. Elles ne s'usent pas. **Si un forgeron est posé**, le mineur attend **3 secondes** au fond de la mine (`SECONDES_FORGE_EMPLOYE`) que le forgeron fasse sa pioche, qui lui descend par l'ascenseur ; sans forgeron, il l'a directement.
- **Bandeau** (`src/composants/Hud.tsx`) : la pioche équipée et sa barre de durabilité.
- **Panneau de la mine** : le rappel « ⛏️ *N* % de chance de doubler un minerai » à côté du bloc.
- **Succès** : « ⚙️ Âge du fer », « 🥇 Pioche dorée » et « 💎 Diamants ! » se débloquent avec les pioches en fer, or et diamant.
- **Sons** : débloquer une pioche joue la petite fanfare d'amélioration ; un rachat ou une réparation joue le son d'achat ; une pioche qui casse a son propre son (« clang » triste).
- **Bot de simulation** (`src/jeu/bot.ts`) : il pose le forgeron en (26, 14), répare dès que sa pioche casse, débloque la suivante dès qu'il peut, et garde dans le coffre (sans les vendre) les minerais de la prochaine pioche et de la réparation.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.forgeron` : 30 $ + 15 pierre, 5 × 5, porte à droite), les pioches (`PIOCHES` : doublement, durabilité, prix, réparation, couleur), `CLICS_MAINS_NUES` et `SECONDES_FORGE_EMPLOYE`.
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
- `public/images/batiments/forgeron.svg` : le dessin de la forge, fabriqué par `node outils/art/fabriquer.mjs` (`outils/art/batiments.mjs`).
- `src/evenements.ts`, `src/sons.ts` : les sons d'achat, d'amélioration et de pioche cassée.
