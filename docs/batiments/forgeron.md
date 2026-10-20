# ⚒️ Forgeron

> Le stand où l'on débloque, rachète, répare et change de pioche : c'est la pioche qui décide de la vitesse de minage et de la profondeur qu'on peut atteindre.

## Où et quand

- **Position** : x = **10,5 tuiles** sur le chemin du village (le village fait 27 tuiles, une tuile = 40 px), entre le marché (x = 7,5) et le bazar (x = 13,5). On est « devant » le stand à moins de **1,4 tuile** (`PORTEE_STAND`) : son panneau s'ouvre alors à droite.
- **Déblocage** : disponible **dès le prestige 0**, jamais verrouillé.
- **Dessin au village** : une échoppe en CSS (64 × 64 px) avec un **auvent rayé gris ardoise et crème** (`--auvent: #5b5b66`), un bord en festons, et un comptoir en bois qui porte l'icône **⚒️**. Le panneau en bois « Forgeron » s'allume en doré quand on est devant. Le stand s'éclaircit au survol.
- **Description** (bulle au survol) : « Pioches et réparations. »
- **Pastille verte « 💰 Achetable ! »** : elle apparaît au-dessus du stand quand on a de quoi **débloquer la pioche suivante** (argent **et** minerais). Elle ne s'affiche pas pour une réparation.
- **Pas de badge « ⬆ Niveaux ! »** après un prestige ni de flèche « Nouveau ! » : les pioches ne sont pas plafonnées par le prestige.
- **Le mineur porte sa pioche** : au village comme dans la mine, le personnage tient une pioche de la couleur de celle qui est équipée (bois `#b5834a`, pierre `#8f8f8f`, fer `#e6e6e6`, diamant `#4ee8dc`, netherite `#6b5568`), et rien quand elle est cassée.
- On ne peut cliquer sur le stand qu'au village. Un clic y fait marcher le mineur.

## Ce qu'on peut y faire

Le panneau liste les 5 pioches, de la moins bonne à la meilleure. Pour chacune : son nom, le badge **« Équipée »** si c'est celle qu'on tient, la ligne « Vitesse ×N · jusqu'à -X m · durabilité D », et, si on la possède, une **barre de durabilité** (verte, « restant / total », ou rouge « Cassée »).

Les pioches plus loin que la suivante sont grisées : « 🔒 Pioche en X — Débloque d'abord la pioche précédente. »

| Bouton | Quand il apparaît | Ce qu'il fait |
|---|---|---|
| **🔓 Débloquer** | la pioche juste après la meilleure qu'on a | Paie le prix (argent + minerais), donne la pioche neuve et l'équipe. « ⛏️ Nouvelle pioche en X débloquée ! » |
| **🛒 Racheter neuve** | chaque pioche déjà débloquée | Paie le prix, remet la pioche à neuf (usure 0) et l'équipe. « ⛏️ Pioche en X neuve achetée. » |
| **🔧 Réparer** | une pioche qu'on possède et qui est usée | Paie la réparation et remet la pioche à neuf. « 🔧 Pioche en X réparée (N $ et 3 Y). » Elle n'est pas équipée pour autant. |
| **Équiper** | une pioche qu'on possède mais qu'on ne tient pas | La prend en main (gratuit). « Tu as équipé la pioche en X. » |

Chaque achat affiche son prix à gauche du bouton (en vert ce qu'on a, en rouge ce qui manque). Le bouton est grisé si on ne peut pas payer.

### Les pioches

Valeurs de `PIOCHES` (`src/jeu/donnees.ts`). La pioche en bois est offerte au début de la partie.

| Pioche | Prix | Minerais demandés | Vitesse | Durabilité | Profondeur max (mine de référence) | Réparée avec |
|---|---:|---|---:|---:|---:|---|
| 🪵 Bois | 5 $ | — | 2 | 60 | -35 m | argent seulement |
| 🪨 Pierre | 40 $ | — | 4 | 160 | -70 m | 3 pierres |
| ⚙️ Fer | 300 $ | — | 6 | 250 | -112 m | 3 fer |
| 💎 Diamant | 2 000 $ | 3 diamants | 8 | 500 | -136 m | 3 diamants |
| 🔥 Netherite | 3 000 $ | 4 débris antiques + 4 or | 9 | 800 | -150 m (la bedrock) | 3 débris antiques |
| ✋ Mains nues (pioche cassée) | — | — | 1 | — | — | — |

### La profondeur max selon le prestige

Les profondeurs des pioches sont données pour une mine de 150 m et mises à l'échelle de la mine du prestige (`profondeurMaxPioche` = profondeur × bedrock / 150, arrondi). La bedrock est à -100 m au prestige 0, puis 50 m plus bas par prestige.

| Pioche | Prestige 0 (-100 m) | Prestige 1 (-150 m) | Prestige 2 (-200 m) | Prestige 3 (-250 m) | Prestige 4 (-300 m) |
|---|---:|---:|---:|---:|---:|
| Bois | -23 m | -35 m | -47 m | -58 m | -70 m |
| Pierre | -47 m | -70 m | -93 m | -117 m | -140 m |
| Fer | -75 m | -112 m | -149 m | -187 m | -224 m |
| Diamant | -91 m | -136 m | -181 m | -227 m | -272 m |
| Netherite | -100 m | -150 m | -200 m | -250 m | -300 m |

Seule la netherite atteint la bedrock : elle est donc obligatoire pour finir chaque partie.

### Le prix d'une réparation

**argent = arrondi au-dessus de (prix de la pioche × 0,5 × usure / durabilité)**, au moins 1 $, **+ 3 minerais** de la pioche (`coutReparation`, `PART_PRIX_REPARATION` = 0,5, `MINERAIS_REPARATION` = 3). Une pioche cassée coûte donc la moitié de son prix neuve. Les 3 minerais sont demandés quelle que soit l'usure, même pour un seul point.

| Pioche | Réparation d'une pioche cassée | À moitié usée |
|---|---|---|
| Bois | 3 $ | 2 $ (30/60) |
| Pierre | 20 $ + 3 pierres | 10 $ + 3 pierres |
| Fer | 150 $ + 3 fer | 75 $ + 3 fer |
| Diamant | 1 000 $ + 3 diamants | 500 $ + 3 diamants |
| Netherite | 1 500 $ + 3 débris antiques | 750 $ + 3 débris antiques |

## Règles et comportement

### La vitesse de minage

Vitesse = **vitesse de la pioche × (1 + 0,25 × Efficacité) × (1 + 0,10 × prestige) × 1,15 avec le talent Poigne de fer**, puis × 1,25 dans la roche dure avec le talent Briseur de roche (`vitesse`, `vitesseA`, `src/jeu/mineur.ts`).

Temps pour casser un bloc = dureté × (1,5 dans la roche dure) ÷ vitesse × 0,45 (`dureeCasse`, `VITESSE_JEU` = 0,45). La roche dure commence sous -94 m dans la mine de référence (environ -63 m au prestige 0).

Exemples au prestige 0, sans enchantement ni talent :

| Pioche | Pierre (dureté 1,5) | Minerai (dureté 3) | Roche dure (dureté 3 × 1,5) | Débris antiques (30 × 1,5) |
|---|---:|---:|---:|---:|
| Mains nues | 0,68 s | 1,35 s | 2,03 s | 20,3 s |
| Bois | 0,34 s | 0,68 s | 1,01 s | 10,1 s |
| Pierre | 0,17 s | 0,34 s | 0,51 s | 5,06 s |
| Fer | 0,11 s | 0,23 s | 0,34 s | 3,38 s |
| Diamant | 0,08 s | 0,17 s | 0,25 s | 2,53 s |
| Netherite | 0,08 s | 0,15 s | 0,23 s | 2,25 s |

**Mains nues** : quand la pioche est cassée, la vitesse vaut 1, **sans aucun bonus** (ni Efficacité, ni prestige, ni talent).

### L'usure

- À chaque bloc cassé avec une pioche qui n'est pas cassée, il y a une chance de lui retirer **1 point** de durabilité : **chance = (0,7 avec le talent Pioche robuste, sinon 1) ÷ (Solidité + 1)**.
- Sans Solidité, une pioche tient donc en moyenne autant de blocs que sa durabilité. Solidité I double cette durée, II la triple, III la quadruple ; Pioche robuste la multiplie encore par environ 1,43.

| Pioche | Sans Solidité | Solidité I | Solidité II | Solidité III |
|---|---:|---:|---:|---:|
| Bois | ~60 blocs | ~120 | ~180 | ~240 |
| Pierre | ~160 | ~320 | ~480 | ~640 |
| Fer | ~250 | ~500 | ~750 | ~1 000 |
| Diamant | ~500 | ~1 000 | ~1 500 | ~2 000 |
| Netherite | ~800 | ~1 600 | ~2 400 | ~3 200 |

- Quand la durabilité tombe à 0 : « 💥 Ta pioche en X est cassée ! Tu mines à mains nues. », avec un son de casse. Le bandeau affiche « ✋ Mains nues » et une barre rouge « Cassée ! ».
- Chaque pioche garde sa propre usure : changer de pioche ne répare rien.

### Cas limites

- **Au village seulement** : débloquer, racheter et réparer demandent d'être au village et immobile (`aLaSurface`). Dans la mine, le même panneau s'ouvre dans l'onglet **🧰 Pioches**, avec le message « ⬆️ Pour acheter ou réparer une pioche, remonte voir le forgeron à la surface. » : on peut seulement y **équiper** une autre pioche qu'on possède.
- **On n'est jamais bloqué** : une pioche cassée mine encore, à mains nues. Et la profondeur max dépend de la pioche **équipée**, même cassée : on continue de descendre aussi bas qu'elle le permet. Quand la couche suivante est trop profonde pour la pioche, on creuse une **galerie horizontale** à la place, avec le message « 🧱 Couche trop dure ! Il te faut une pioche en X pour descendre plus bas : achète-la au forgeron (village). » (ou « Équipe ta pioche en X (onglet Pioches) » si on l'a déjà).
- **Un seul déblocage à la fois** : on ne peut acheter que les pioches déjà débloquées et la suivante (`niveau ≤ meilleure + 1`).
- **Racheter neuve demande aussi les minerais** : la logique (`peutAcheterPioche`, `acheterPioche`) exige et consomme les minerais de la pioche à chaque achat, même pour un rachat (3 diamants pour la pioche en diamant, 4 débris + 4 or pour la netherite). Mais le prix affiché à côté de « 🛒 Racheter neuve » ne montre **que l'argent**. Le bouton reste grisé tant qu'il manque ces minerais, sans que l'écran dise lesquels.
- **Racheter ou réparer** : réparer coûte au plus la moitié du prix (+ 3 minerais), racheter coûte toujours le prix entier. Le bouton « Racheter neuve » reste affiché même pour une pioche intacte.
- **Réparer n'équipe pas** la pioche (racheter, si).
- **Pas de plafond par prestige** : les pioches n'ont pas d'entrée dans `PLAFONDS`.

### Ce qui se passe au prestige

| | |
|---|---|
| Pioches possédées | **gardées** (depuis le 19/10) |
| Usure | **toutes réparées** (usure remise à 0) |
| Pioche équipée | la **meilleure** débloquée (la netherite, puisqu'il la faut pour atteindre la bedrock) |
| Bonus de vitesse | **+10 %** de plus (`BONUS_VITESSE_PRESTIGE`, par niveau de prestige) |
| Argent et minerais du sac | remis à 0 : une réparation de la netherite (1 500 $ + 3 débris) devra attendre d'avoir creusé assez profond |

## Lien avec le reste du jeu

- **Conditions de prestige** (`src/jeu/conditionsPrestige.ts`) : les pioches **ne comptent pas** dans la liste, mais il faut la pioche en netherite pour atteindre la bedrock, qui est la première condition.
- **Objectifs** (`src/jeu/objectifs.ts`) : la pioche suivante est le **premier** achat de `achatsPossibles` (« le cœur de la progression »). Si on peut la payer, le prochain objectif devient « Pioche en X — achetable au forgeron ! » et la pastille « 💰 Achetable ! » s'allume sur le stand. Sinon, la barre d'objectif montre « 180 / 300 $ » ou « il manque N Diamant ». Le forgeron n'est jamais dans `standsAvecNouveauxNiveaux` (pas de plafond).
- **Marché** : il faut garder des minerais au lieu de les vendre : diamants (pioche en diamant), or et débris antiques (netherite), et 3 minerais pour chaque réparation. Le bot de simulation (`src/jeu/bot.ts`) garde exprès 3 minerais de sa meilleure pioche pour la réparer, et remonte au village quand il peut acheter la pioche suivante ou quand la sienne est cassée.
- **Enchanteur** : les enchantements s'appliquent à **toutes** les pioches et sont gardés au prestige. **Efficacité** : +25 % de vitesse par niveau. **Solidité** : la pioche s'use moins vite. **Fortune** : plus de minerais (pas d'effet sur la pioche elle-même).
- **Arbre de prestige** : la branche **Mineur** (icône du forgeron ⚒️) contient Poigne de fer (+15 % de vitesse), Œil de lynx (+10 % de chance de doubler un minerai), Pioche robuste (-30 % d'usure) et Briseur de roche (+25 % dans la roche dure).
- **Stand Personnel** : les pioches des mineurs employés (`NIVEAUX_EMPLOYE`) s'achètent là-bas, pas au forgeron. Elles ne s'usent pas.
- **Bandeau** (`src/composants/Hud.tsx`) : la pioche équipée, sa barre de durabilité et les enchantements actifs.
- **Succès** : « 🪨 L'âge de pierre », « ⚙️ Âge du fer », « 💎 Diamants ! » et « 🔥 Increvable » se débloquent avec les pioches en pierre, fer, diamant et netherite.
- **Sons** : débloquer une pioche joue la petite fanfare d'amélioration (la meilleure pioche compte dans `totalNiveaux`) ; un rachat ou une réparation joue le son d'achat ; une pioche qui casse a son propre son.

## Fichiers du code

- `src/composants/stands.ts` : position (x = 10,5), nom, icône et description du stand.
- `src/jeu/donnees.ts` : les pioches (`PIOCHES`), la réparation (`MINERAIS_REPARATION`, `PART_PRIX_REPARATION`), la vitesse à mains nues, `profondeurMaxPioche`, `dureeCasse` et les bonus de prestige.
- `src/jeu/mineur.ts` : les règles des pioches (`acheterPioche`, `peutAcheterPioche`, `equiper`, `coutReparation`, `reparer`, `vitesse`, `usure`, `estCassee`), l'usure dans `casserBloc`, les galeries, et les pioches gardées au prestige.
- `src/jeu/talents.ts` : Poigne de fer, Pioche robuste et Briseur de roche.
- `src/jeu/objectifs.ts` : la pioche suivante en premier objectif, la pastille « Achetable ! ».
- `src/jeu/succes.ts` : les quatre succès des pioches.
- `src/jeu/bot.ts` : comment le bot de simulation achète, répare et équipe ses pioches.
- `src/composants/Panneaux.tsx` : le panneau du forgeron (`PanneauPioches`), aussi utilisé dans l'onglet 🧰 Pioches de la mine.
- `src/composants/Amelioration.tsx` : le composant `Achat` (prix à gauche, bouton à droite).
- `src/composants/Hud.tsx` : la pioche équipée et sa durabilité dans le bandeau.
- `src/composants/Personnage.tsx` : le mineur et la couleur de sa pioche.
- `src/composants/VueVillage.tsx` : le dessin du stand et la pastille au village.
- `src/composants/Icone.tsx` : l'icône ⚒️.
- `src/index.css` : l'échoppe, l'auvent gris (`.stand-forgeron`) et la couleur du bouton « Réparer ».
- `src/App.tsx` : l'ouverture du panneau au village et l'onglet 🧰 Pioches dans la mine.
- `src/evenements.ts`, `src/sons.ts` : les sons d'achat, d'amélioration et de pioche cassée.
