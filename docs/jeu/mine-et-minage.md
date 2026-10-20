# ⛏️ La mine et le minage

> Comment la mine est générée, ce que fait le mineur pas à pas, et tout ce qui tourne autour : événements, découvertes, succès, temps qui passe (et hors ligne), statistiques et écran de victoire.
> Écrit d'après le code au 20/10. Les règles de l'ascenseur, des pioches, du sac, des enchantements, de la foreuse et des mineurs employés ont leur fiche : [mine.md](../batiments/mine.md) (échelle, ascenseur, quai), [forgeron.md](../batiments/forgeron.md) (pioches, usure, réparation), [bazar.md](../batiments/bazar.md) (sac, seaux), [enchanteur.md](../batiments/enchanteur.md), [marche.md](../batiments/marche.md), [foreuse.md](../batiments/foreuse.md), [personnel.md](../batiments/personnel.md), [prestige.md](../batiments/prestige.md).

---

## 1. La forme de la mine

- La mine est une **grille de 10 colonnes** (`LARGEUR_MINE = 10`). Une **couche** = une rangée de 10 blocs à une profondeur donnée (en mètres, nombres entiers positifs : « profondeur 12 » = -12 m).
- **Bedrock** : à **-100 m au prestige 0**, puis **+50 m par prestige** (`profondeurBedrock(p) = 100 + 50 × p`) : -150, -200, -250 m… La bedrock n'est pas un bloc qu'on casse : c'est une limite. La **dernière couche creusable est à bedrock − 1** (-99 m au prestige 0, -149 m au prestige 1). Elle est dessinée comme une rangée de blocs « bedrock » sous la dernière couche.
- **Départ** : le premier mètre est l'entrée du puits, déjà creusée. Une nouvelle partie commence avec la **couche en cours à -2 m** (`PROFONDEUR_DEPART = 2`), le joueur **au village** (position 0).
- **Couches en mémoire** : la couche en cours + les **4 couches du dessous** (`COUCHES_VISIBLES_DESSOUS = 4`), déjà tirées au sort et visibles à l'écran, de plus en plus sombres (« lumière naturelle, sans torches »). Quand on descend, la première couche du dessous devient la couche en cours et on tire une nouvelle couche 4 m plus bas (sauf si elle serait à la bedrock ou plus bas : couche vide, jamais utilisée).
- Les blocs d'une couche sont tirés **indépendamment** les uns des autres (pas de filons ni de grottes).

### La mise à l'échelle selon le prestige

Toutes les profondeurs écrites dans les données (minerais, roche, blocs spéciaux, zones, profondeur max des pioches) sont pour une **mine de référence de 150 m**. On les convertit pour la mine du prestige :

- `échelle = bedrock / 150` → **× 2/3 au prestige 0**, × 1 au prestige 1, × 4/3 au prestige 2, × 5/3 au prestige 3…
- Pour tirer un bloc, on convertit la vraie profondeur en profondeur de référence : `référence = profondeur / échelle`.
- Pour la profondeur max d'une pioche : `arrondi(profMax × échelle)`.

Ainsi chaque mine a le charbon près de la surface et les débris antiques tout au fond, quelle que soit sa taille.

### L'aléatoire (`src/jeu/aleatoire.ts`)

Tout tirage passe par une fonction `Aleatoire` (un nombre entre 0 inclus et 1 exclu) : `Math.random` en jeu, et un générateur à graine (`mulberry32`) dans les tests, pour des parties toujours identiques. Outils : `entierEntre(min, max)` (bornes incluses), `choisir(liste)` (au hasard, chances égales), `choisirPondere(choix)` (un poids 2 sort deux fois plus souvent qu'un poids 1).

---

## 2. Les blocs

### Caractéristiques (`BLOCS`, `src/jeu/donnees.ts`)

| Bloc | Prix de vente | Dureté | Fortune ? | Remarque |
|---|---|---|---|---|
| 🟫 Terre | 1 $ | 0,5 | non | roche de base en surface |
| 🪨 Gravier | 1 $ | 0,6 | non | |
| 🪨 Pierre | 1 $ | 1,5 | non | roche de base |
| ⬛ Roche dure (id `deepslate`) | 2 $ | 3 | non | roche de base du fond |
| ⚫ Charbon | 5 $ | 3 | oui | carburant de la foreuse |
| 🔩 Fer | 12 $ | 3 | oui | améliorations (ascenseur, foreuse) |
| 🔴 Redstone | 15 $ | 3 | oui | améliorations |
| 🔷 Lapis-lazuli | 20 $ | 3 | oui | enchantements |
| 🟡 Or | 35 $ | 3 | oui | pioche en netherite |
| 💚 Émeraude | 80 $ | 3 | oui | enchantements |
| 💎 Diamant | 100 $ | 3 | oui | pioche en diamant |
| 🟤 Débris antiques | 400 $ | **30** | **non** | pioche en netherite |
| 🔮 Améthyste | 50 $ | 1,5 | non | ne se trouve pas dans la mine : sort des géodes |
| 🟪 Obsidienne | 60 $ | 3 | non | ne se trouve pas dans la mine : lave éteinte |
| 🔥 Lave | — | 1 | — | **spécial** (ne va pas dans le sac) |
| 🧰 Coffre | — | 2,5 | — | **spécial** |
| 🔮 Géode | — | 1,5 | — | **spécial** |

« Fortune ? » = le bloc est un minerai qui peut être doublé par l'enchantement Fortune et le talent Œil de lynx.
Les prix sont ceux de base ; au marché ils sont multipliés par le bonus de vente (voir [marche.md](../batiments/marche.md)).

### Comment un bloc est tiré (`src/jeu/mine.ts`)

À chaque case, on fait un **tirage pondéré** parmi les blocs possibles à cette profondeur (de référence `p`) :

| Bloc | Condition (profondeur de référence `p`) | Poids |
|---|---|---|
| Terre | p ≤ 7 | 100 |
| Pierre | 7 < p ≤ 94 | 100 |
| Roche dure | p > 94 | 100 |
| Gravier | p ≤ 56 | 30 si p ≤ 7, sinon 10 |
| Coffre | p > 19 | 0,8 |
| Lave | p > 47 | 1,5 |
| Géode | p > 59 | 1 |
| Minerais | voir ci-dessous | progressif |

**Minerais (`APPARITION_MINERAIS`)** : chaque minerai apparaît à sa profondeur « début » avec un petit poids, qui grandit **en ligne droite** jusqu'au poids « plein » à sa profondeur « pleine », puis reste constant jusqu'en bas. Avant « début » : poids 0 (absent).

| Minerai | Début (réf.) | Poids au début | Plein (réf.) | Poids plein |
|---|---|---|---|---|
| Charbon | 8 | 6 | 35 | 16 |
| Fer | 8 | 3 | 41 | 12 |
| Redstone | 21 | 0,5 | 59 | 6 |
| Or | 29 | 0,4 | 76 | 5 |
| Lapis | 35 | 0,5 | 76 | 6 |
| Émeraude | 47 | 0,2 | 82 | 2 |
| Diamant | 53 | 0,2 | 117 | 5 |
| Débris antiques | 112 | 0,2 | 135 | 1 |

### Les vraies profondeurs, prestige par prestige

Premier mètre où le bloc peut sortir → mètre où il atteint sa fréquence pleine (calculé avec les formules ci-dessus).

| | Prestige 0 (bedrock -100) | Prestige 1 (-150) | Prestige 2 (-200) | Prestige 3 (-250) |
|---|---|---|---|---|
| Terre (sinon pierre) | jusqu'à -4 | jusqu'à -7 | jusqu'à -9 | jusqu'à -11 |
| Gravier | jusqu'à -37 | jusqu'à -56 | jusqu'à -74 | jusqu'à -93 |
| Roche dure (au lieu de la pierre) | dès -63 | dès -95 | dès -126 | dès -157 |
| Charbon | -6 → -24 | -8 → -35 | -11 → -47 | -14 → -59 |
| Fer | -6 → -28 | -8 → -41 | -11 → -55 | -14 → -69 |
| Redstone | -14 → -40 | -21 → -59 | -28 → -79 | -35 → -99 |
| Or | -20 → -51 | -29 → -76 | -39 → -102 | -49 → -127 |
| Lapis | -24 → -51 | -35 → -76 | -47 → -102 | -59 → -127 |
| Émeraude | -32 → -55 | -47 → -82 | -63 → -110 | -79 → -137 |
| Diamant | -36 → -78 | -53 → -117 | -71 → -156 | -89 → -195 |
| Débris antiques | -75 → -90 | -112 → -135 | -150 → -180 | -187 → -225 |
| Coffre | dès -13 | dès -20 | dès -26 | dès -32 |
| Lave | dès -32 | dès -48 | dès -63 | dès -79 |
| Géode | dès -40 | dès -60 | dès -79 | dès -99 |

### Les chances réelles (en % de chaque case)

**Prestige 0 (mine de 100 m)** :

| Profondeur | Terre | Pierre | Roche dure | Gravier | Charbon | Fer | Redstone | Or | Lapis | Émeraude | Diamant | Débris | Coffre | Lave | Géode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| -2 | 76,9 | – | – | 23,1 | – | – | – | – | – | – | – | – | – | – | – |
| -5 | – | 90,9 | – | 9,1 | – | – | – | – | – | – | – | – | – | – | – |
| -10 | – | 81,0 | – | 8,1 | 7,0 | 4,0 | – | – | – | – | – | – | – | – | – |
| -20 | – | 73,4 | – | 7,3 | 10,4 | 6,6 | 1,3 | 0,4 | – | – | – | – | 0,6 | – | – |
| -30 | – | 68,2 | – | 6,8 | 10,9 | 8,2 | 2,7 | 1,3 | 1,3 | – | – | – | 0,5 | – | – |
| -40 | – | 68,4 | – | – | 10,9 | 8,2 | 4,1 | 2,3 | 2,6 | 0,6 | 0,5 | – | 0,5 | 1,0 | 0,7 |
| -50 | – | 66,0 | – | – | 10,6 | 7,9 | 4,0 | 3,2 | 3,9 | 1,1 | 1,2 | – | 0,5 | 1,0 | 0,7 |
| -60 | – | 65,2 | – | – | 10,4 | 7,8 | 3,9 | 3,3 | 3,9 | 1,3 | 1,9 | – | 0,5 | 1,0 | 0,7 |
| -70 | – | – | 64,8 | – | 10,4 | 7,8 | 3,9 | 3,2 | 3,9 | 1,3 | 2,7 | – | 0,5 | 1,0 | 0,6 |
| -80 | – | – | 64,2 | – | 10,3 | 7,7 | 3,9 | 3,2 | 3,9 | 1,3 | 3,2 | 0,3 | 0,5 | 1,0 | 0,6 |
| -90 à -99 | – | – | 64,0 | – | 10,2 | 7,7 | 3,8 | 3,2 | 3,8 | 1,3 | 3,2 | 0,6 | 0,5 | 1,0 | 0,6 |

**Prestige 1 (mine de 150 m)** : les mêmes pourcentages se retrouvent 1,5 fois plus bas. Exemples : -10 m : pierre 83,1, gravier 8,3, charbon 5,6, fer 2,9 ; -60 m : identique au -40 m du prestige 0 ; -100 m : roche dure 64,9, diamant 2,4 ; -140 à -149 m : identique au fond du prestige 0. Au fond de n'importe quelle mine, une couche de 10 blocs contient donc en moyenne ≈ 1 charbon, 0,8 fer, 0,3 diamant, 0,06 débris.

### Les blocs spéciaux

Ils ne vont jamais dans le sac ; ils déclenchent un effet quand on les casse :

- **🧰 Coffre** : donne `(entier au hasard de 20 à 60 + profondeur × entier au hasard de 3 à 8)` $, **× 2 avec le talent Chasseur de trésors** (pas multiplié par le bonus de vente). Exemple à -50 m : entre 170 et 460 $. Plus **1 minerai** choisi au hasard (chances égales) parmi les minerais qu'on peut trouver à cette profondeur (charbon, fer, redstone, lapis, or, émeraude, diamant ; jamais de débris), rangé comme un bloc normal. Cet argent compte dans l'argent gagné. Message : « 🧰 Coffre au trésor : +X $ et 1 <minerai> ! ».
- **🔥 Lave** : avec un **seau d'eau** (acheté au bazar, 25 $), on use 1 seau et on gagne **1 obsidienne** (« 🪣 Lave éteinte avec ton seau : +1 obsidienne ! ») ; sans seau, la lave **brûle un tiers (arrondi en dessous) de chaque pile du sac** (pas le quai de l'ascenseur) : « 🔥 Aïe, de la lave ! N objets brûlés. Achète un seau d'eau. »
- **🔮 Géode** : **3 à 6 améthystes** (pas de Fortune). « 🔮 Géode : +N améthystes ! » (N = ce qui a vraiment tenu dans le sac et sur le quai).

La **foreuse** ne tire jamais de bloc spécial (`tirerBlocNormal`), voir [foreuse.md](../batiments/foreuse.md).

### Les zones (ambiance et couleur de fond)

| Zone | Jusqu'à (réf.) | Prestige 0 | Prestige 1 |
|---|---|---|---|
| Surface | 7 | -4 | -7 |
| Cavernes | 35 | -23 | -35 |
| Mines | 70 | -46 | -70 |
| Profondeurs | 94 | -62 | -94 |
| Roche dure | 122 | -81 | -122 |
| Abîmes | 150 | -100 | -150 |

Les zones ne changent que le décor (classe CSS de la rangée), pas les règles.

---

## 3. Le mineur et ses actions (`src/jeu/mineur.ts`)

Tout l'état d'une partie tient dans un objet `EtatJeu` (sauvegardé tel quel en JSON). Les actions modifient l'état et renvoient les messages à afficher (« toasts »).

### Où est le mineur

- **Position verticale** (`position`, en mètres) : **0 = au village**, **profondeur − 1 = front de taille** (juste au-dessus de la couche en cours). C'est un nombre à virgule pendant un trajet. `cible` = là où il va.
- **Colonne** (`colonneMineur`, de 0 à 9) : où il se tient au-dessus de la couche en cours. La colonne 0 (à gauche) est celle du puits.
- **Au fond** (`auFond`) : à la position du front, à l'arrêt. **À la surface** (`aLaSurface`) : à 0, à l'arrêt (seul endroit où l'on vend et achète).

### Se déplacer

- **Au front, ← / →** : une case à gauche ou à droite (bornée de 0 à 9). Annule un départ en cours vers le puits.
- **Partir vers le haut depuis le front** (`voyager`) : si le mineur n'est pas en colonne 0, il **marche d'abord jusqu'au puits**, à **0,12 s par case** ; puis il prend l'**ascenseur** s'il est là (cabine arrêtée à sa hauteur), sinon l'**échelle** (**0,15 s par mètre** ; ≈ 14,7 s pour remonter de -99 m au prestige 0). Détails de l'échelle et de l'ascenseur : [mine.md](../batiments/mine.md).
- **Descendre** : du village vers le front, même logique (ascenseur au village s'il y attend, sinon échelle).
- **Relâcher la flèche sur l'échelle** : il s'arrête au prochain barreau (un appui très court fait toujours bouger d'un mètre).
- Messages d'arrivée : « ☀️ Te voilà au village ! » ou « ⛏️ Au front de taille, à -X m. ».

### Creuser : quel bloc, combien de temps

1. **Quel bloc** (`indexBlocActuel`) : le bloc non cassé **le plus proche de la colonne du mineur** (à égalité, celui de gauche). Le mineur se place au-dessus de ce bloc au moment de le casser. Il avance donc de proche en proche, en zigzag d'une couche à l'autre.
2. **Durée** (`dureeCasse`) :
   `durée (s) = dureté × (1,5 en roche dure) ÷ vitesse × 0,45`
   avec un **minimum de 0,08 s** par bloc à l'écran (`DUREE_MIN_BLOC`, pour que l'animation reste visible). La « roche dure » ici = toute case sous la profondeur de référence 94 (dès -63 m au prestige 0, -95 m au prestige 1), **quel que soit le bloc** (un diamant y est aussi 1,5 fois plus long).
3. **Vitesse** (`vitesse`, `vitesseA`) :
   `vitesse = vitesse de la pioche × (1 + 0,25 × niveau d'Efficacité) × (1 + 0,10 × prestige) × 1,15 (talent Poigne de fer)`
   puis **× 1,25 en roche dure** avec le talent Briseur de roche. Vitesses des pioches : Bois 2, Pierre 4, Fer 6, Diamant 8, Netherite 9 (voir [forgeron.md](../batiments/forgeron.md)).
   **Pioche cassée = mains nues : vitesse 1** (sans Efficacité, prestige ni Poigne de fer ; Briseur de roche s'applique quand même en roche dure).

Exemples (prestige 0, sans enchantement ni talent) :

| Bloc | Bois (2) | Pierre (4) | Fer (6) | Diamant (8) | Netherite (9) | Mains nues (1) |
|---|---|---|---|---|---|---|
| Terre (0,5) | 0,11 s | 0,08 s* | 0,08 s* | 0,08 s* | 0,08 s* | 0,23 s |
| Pierre (1,5) | 0,34 s | 0,17 s | 0,11 s | 0,08 s | 0,08 s* | 0,68 s |
| Minerai (3) | 0,68 s | 0,34 s | 0,23 s | 0,17 s | 0,15 s | 1,35 s |
| Roche dure (3 × 1,5) | — | — | 0,34 s | 0,25 s | 0,23 s | 2,03 s |
| Débris (30 × 1,5) | — | — | 3,38 s | 2,53 s | 2,25 s | 20,25 s |

\* minimum de 0,08 s. (« — » : la pioche ne descend pas jusque-là.)

### Ce qui se passe quand un bloc casse (`casserBloc`)

Conditions : le mineur est au fond, ne marche pas vers le puits, et il reste un bloc dans la couche. Puis, dans l'ordre :

1. Le mineur se place au-dessus du bloc ; le temps de minage (la durée calculée ci-dessus) est ajouté aux statistiques.
2. **Usure** (si la pioche n'est pas déjà cassée) : chance d'user la pioche d'**1 point** = `(0,7 avec le talent Pioche robuste, sinon 1) ÷ (niveau de Solidité + 1)`. Sans Solidité, chaque bloc use donc 1 point. Si la durabilité tombe à 0 : « 💥 Ta pioche en X est cassée ! Tu mines à mains nues. » Le bloc en cours est quand même cassé. Durabilités, réparation, rachat : [forgeron.md](../batiments/forgeron.md).
3. Statistiques : +1 bloc cassé, +1 dans le compte de cette sorte de bloc, plus bas atteint mis à jour.
4. **Récolte** :
   - bloc spécial → son effet (coffre, lave, géode, voir plus haut) ;
   - bloc normal → **1 objet**, ou **2** si c'est un minerai « Fortune » et que la chance de doublement tombe (`20 % × niveau de Fortune + 10 % avec Œil de lynx` ; Fortune III + Œil de lynx = 70 %). Les diamants obtenus (1 ou 2) comptent dans « diamants trouvés ».
   - **Rangement** (`stocker`) : d'abord dans le **sac** tant qu'il y a de la place, puis le reste sur le **quai de l'ascenseur** (s'il est construit, jusqu'à la capacité de la cabine), et ce qui ne tient nulle part est **perdu** (« 🎒 Sac plein ! Remonte vendre au marché (bouton Village) ou envoie l'ascenseur. »). Tailles de sac : [bazar.md](../batiments/bazar.md).
5. La case devient vide. Si c'était le dernier bloc de la couche → **couche suivante** (ci-dessous).

### Finir une couche (`passerCoucheSuivante`)

Soit `suivante = profondeur + 1` :

1. **Si `suivante` ≥ bedrock** (on vient de finir la couche à bedrock − 1) : **victoire**. La première fois : `victoire = true` et message « 🏆 Tu as atteint la bedrock ! Continue de creuser ici, ou passe prestige à l'arbre de prestige (village). ». Le mineur passe **en galerie** : une nouvelle couche est tirée **à la même profondeur**, à l'infini.
2. **Sinon, si `suivante` dépasse la profondeur max de la pioche équipée** : **galerie horizontale**. La couche en cours est remplacée par une nouvelle couche tirée à la même profondeur (les 4 couches du dessous ne changent pas). En entrant en galerie, un message dit quoi faire : « 🧱 Couche trop dure ! Équipe ta pioche en X (onglet Pioches)… » si on a déjà la bonne pioche, sinon « …Il te faut une pioche en X… achète-la au forgeron (village). ». Un bandeau rouge le rappelle dans la mine tant qu'on est en galerie. On n'est **jamais bloqué**. Le test n'a lieu qu'à la fin d'une couche : après avoir équipé une meilleure pioche, on descend à la fin de la couche de galerie en cours.
3. **Sinon, on descend d'un mètre** : la profondeur augmente de 1, le mineur (s'il était au front) descend avec, l'ascenseur suit le front s'il y attendait (ou y redescendait), la première couche du dessous devient la couche en cours et une nouvelle couche est tirée 4 m plus bas.

Profondeur max des pioches (la couche la plus basse qu'on peut creuser ; netherite = jusqu'à la bedrock) :

| Pioche | Référence | Prestige 0 | Prestige 1 | Prestige 2 | Prestige 3 |
|---|---|---|---|---|---|
| Bois | 35 | -23 | -35 | -47 | -58 |
| Pierre | 70 | -47 | -70 | -93 | -117 |
| Fer | 112 | -75 | -112 | -149 | -187 |
| Diamant | 136 | -91 | -136 | -181 | -227 |
| Netherite | 150 | -100 | -150 | -200 | -250 |

À mains nues, c'est la profondeur max de la pioche **équipée** (cassée) qui compte.

### Les boutons de minage (`src/usePartie.ts`, `src/App.tsx`)

La barre du bas a toujours 4 boutons : **⛏️ Creuser**, **♾️ Auto**, **🏠 Village**, **⛏️ Mine**.

- **⛏️ Creuser** (seulement au front) : casse tous les blocs **restants de la couche en cours** (un compteur de blocs à casser). Il devient **⏹️ Arrêter** pendant ce temps. Marche aussi à mains nues.
- **♾️ Auto** : creuse sans fin (couche après couche) jusqu'à **⏹️ Arrêt**. Grisé si la pioche est cassée, et **s'arrête tout seul quand la pioche casse** (« 💥 Pioche cassée : creusage automatique arrêté. »).
- Le minage s'arrête aussi dès que le mineur n'est plus au front, ou quand **plus rien ne peut être rangé** (sac plein et quai plein ou pas d'ascenseur) : « 🎒 Sac plein ! Envoie tes objets à la surface avec l'ascenseur (panneau Sac). » (avec ascenseur) ou « 🎒 Sac plein ! Remonte vendre au marché (bouton Village). » (sans). Relancer « Creuser » ou « Auto » quand plus rien ne peut être rangé ne casse aucun bloc : le message « Sac plein » s'affiche et rien ne se passe (`casserBloc` ne casse pas de bloc sans place, corrigé le 20/10 : avant, un bloc était cassé et son contenu perdu).
- **Envoi automatique** (case du sac) : pendant le minage, si le sac est plein ou que le quai n'est pas vide, que l'ascenseur ne roule pas et qu'aucun envoi n'est déjà demandé, on demande un envoi ; on continue de creuser. Voir [mine.md](../batiments/mine.md).
- Sons : un « tac » de pioche toutes les 0,22 s pendant qu'on casse un bloc.

### Pas à pas : une partie typique au prestige 0

1. Au village, avec la pioche en bois offerte (vitesse 2, durabilité 60) et un sac de 32 places, 0 $. On descend à l'échelle jusqu'au front (position 1 m, juste au-dessus de la couche -2 m).
2. « Creuser » : terre et gravier (≈ 0,1 s chacun), puis pierre à 1 $ dès -5 m ; charbon et fer à partir de -6 m.
3. Sac plein (32 objets) → on remonte vendre au marché, on achète une pioche en pierre (40 $), on répare, un plus grand sac…
4. À -23 m, la pioche en bois ne descend plus : galerie horizontale jusqu'à la pioche en pierre (-47 m), puis fer (300 $, -75 m), diamant (2 000 $ + 3 diamants, -91 m), netherite (3 000 $ + 4 débris + 4 or, jusqu'à la bedrock).
5. Coffres dès -13 m, lave dès -32 m (prévoir des seaux), géodes dès -40 m, roche dure 1,5 × plus lente dès -63 m, débris dès -75 m.
6. Après la couche -99 m : victoire, écran de victoire, galeries infinies ; prestige quand tout est au plafond ([prestige.md](../batiments/prestige.md)).

---

## 4. Le temps qui passe

### L'horloge (`src/usePartie.ts`)

- L'horloge ne tourne que s'il se passe quelque chose : le joueur bouge (ou marche vers le puits), l'ascenseur roule, la foreuse tourne (active avec du carburant), il y a au moins un mineur employé, le manager est embauché, ou on est en train de creuser.
- Elle bat **20 fois par seconde** (toutes les 50 ms), ou **à chaque image** (≈ 60/s) quand le joueur ou la cabine se déplace, pour un mouvement fluide.
- Chaque tic compte **au plus 1 seconde** (si l'onglet était en pause, le temps au-delà n'est pas rattrapé pendant la partie).
- À chaque tic, dans l'ordre : `avancerTemps` (`src/jeu/temps.ts`) fait avancer **la marche vers le puits, l'échelle, l'ascenseur, la foreuse, puis les mineurs employés** ; ensuite l'envoi automatique ; ensuite le minage du joueur.

### Le travail sur un bloc (`src/travail.ts`)

`travailler(travail, clé, durée, secondes)` additionne le temps passé sur un bloc (identifié par « profondeur-colonne-bloc ») et dit quand il casse. Le **temps en trop** d'un bloc fini compte pour le suivant (au plus la durée d'un bloc d'avance), pour que la vitesse ne dépende pas de la fréquence de l'horloge (bug corrigé le 19/10). Quand on arrête de creuser, ce reste est remis à 0. Durée minimum d'un bloc : 0,08 s.

### Hors ligne (au chargement d'un monde)

- La sauvegarde (`localStorage`) est écrite **à chaque changement** d'état, avec l'heure.
- En rouvrant un monde, le temps écoulé depuis la dernière sauvegarde, **plafonné à 8 heures**, est joué d'un seul coup avec `avancerTemps` :
  - les trajets en cours (marche, échelle, cabine) se terminent ; un chargement de cabine arrivé au village est vendu (une cabine qui devait redescendre repart ensuite en temps réel) ;
  - la **foreuse** et les **mineurs employés** travaillent selon leurs propres règles ([foreuse.md](../batiments/foreuse.md), [personnel.md](../batiments/personnel.md)) ;
  - **le joueur ne creuse pas** pendant l'absence (le minage reprend à l'arrêt).
- Un message s'affiche (7 s environ) s'il y a quelque chose à dire : « Pendant ton absence : ⚙️ la foreuse a remonté N blocs, 👷 tes mineurs t'ont rapporté X $, 😠 N mineurs attendent leur salaire. ».

---

## 5. Les événements (`src/evenements.ts`)

Ce ne sont **pas des règles** : après chaque action ou tic, l'interface compare l'état d'avant et d'après pour choisir **sons et animations**.

| Événement | Quand | Effet à l'écran / son |
|---|---|---|
| `casse` | un bloc du joueur casse | éclats (0,6 s) ; son de casse (plus lourd si dureté ≥ 3), + son propre pour lave, coffre, géode |
| `trouvaille` | un objet autre que terre/pierre/gravier/roche dure arrive dans le sac ou sur le quai | animation du minerai trouvé (1,8 s) ; son « brillant » pour les rares (lapis, or, émeraude, diamant, débris) |
| `nouvelleCouche` | on descend d'un mètre | son ; `palier` = son spécial tous les 10 m |
| `amelioration` | un niveau de plus (ascenseur, foreuse, chariot, sac, pioche débloquée, enchantement, recruteur, pioche d'un mineur) | petite fanfare (remplace le son d'achat) |
| `achat` | l'argent baisse | son d'achat |
| `vente` | l'argent monte sans bloc cassé ni talent (marché, chariot, ascenseur) | grosse animation « +X $ » (1,8 s), le compteur d'argent saute |
| `recolteMineurs` | un mineur employé a vendu | petit son de pièces |
| `piocheCassee` | la pioche équipée vient de casser | son |
| `talent` | un talent pris dans l'arbre de prestige | son |
| `ding` | la cabine arrive à destination | « ding » |
| `pas` | sur l'échelle, tous les 2 m | bruit de barreau |

Autres gains d'argent (coffre…) : petit « +X $ » (1,2 s). Les messages (toasts) restent 3,5 s, au plus 5 à la fois, sans doublon.

---

## 6. Les découvertes (`src/jeu/decouvertes.ts`)

Quand un stand se débloque avec le prestige, une **flèche clignotante** au village montre sa direction (et un « Nouveau ! » au-dessus du stand), jusqu'à ce que le joueur arrive devant ; elle disparaît alors pour de bon (gardé d'un prestige à l'autre).

| Découverte | Débloquée au | Stand | Nom sur la flèche |
|---|---|---|---|
| `foreuse` | prestige 1 | Foreuse | Foreuse |
| `employes` | prestige 2 | Personnel | Personnel |
| `recruteur` | prestige 4 | Personnel | Recruteur |
| `manager` | prestige 5 | Personnel | Manager |

S'il n'y a pas de nouveauté à montrer, la même flèche jaune peut indiquer un stand qui a de **nouveaux niveaux** après un prestige (voir [mine.md](../batiments/mine.md) et `objectifs.ts`).

---

## 7. Les succès (`src/jeu/succes.ts`)

**16 succès**, vérifiés après **chaque action et chaque tic** (donc aussi pendant les trajets ou le travail de la foreuse). Ils sont **gardés au prestige**. **Aucune récompense** en jeu : un toast « <emoji> Succès : <titre> », un son, et la case allumée dans la fenêtre 🏅 Succès (« N / 16 succès débloqués »).

| | Titre | Description affichée | Condition exacte dans le code |
|---|---|---|---|
| ⛏️ | Premier coup de pioche | Casser ton premier bloc | ≥ 1 bloc cassé par le joueur dans la partie en cours |
| 🧱 | Terrassier | Casser 100 blocs | ≥ 100 blocs dans la partie en cours |
| 🏗️ | Tunnelier | Casser 1 000 blocs | ≥ 1 000 blocs dans la partie en cours |
| 🪨 | L'âge de pierre | Débloquer la pioche en pierre | meilleure pioche débloquée ≥ Pierre |
| ⚙️ | Âge du fer | Débloquer la pioche en fer | ≥ Fer |
| 💎 | Diamants ! | Débloquer la pioche en diamant | ≥ Diamant |
| 🔥 | Increvable | Débloquer la pioche en netherite | ≥ Netherite |
| 🕳️ | Spéléologue | Descendre à -60 m | couche en cours à -60 m ou plus bas |
| 🌑 | Dans les abîmes | Descendre à -105 m (possible dès le prestige 1) | couche en cours à -105 m ou plus bas (impossible au prestige 0, dont la dernière couche est -99 m : la description le dit) |
| 💠 | Ça brille ! | Trouver un diamant | ≥ 1 diamant récolté par le joueur (pas foreuse ni mineurs) |
| 🧰 | Chasseur de trésors | Ouvrir un coffre | ≥ 1 coffre ouvert |
| 🔮 | Géologue | Casser une géode | ≥ 1 géode cassée |
| 🪣 | Pompier | Éteindre de la lave avec un seau | ≥ 1 lave éteinte |
| 💰 | Riche | Gagner 5 000 $ dans une partie | argent gagné ≥ 5 000 $ dans la partie en cours (toutes sources : ventes, coffres, ascenseur, foreuse, mineurs) |
| ✨ | Enchanteur | Mettre tous les enchantements au max permis par ton prestige | plus aucun enchantement achetable **à ce prestige** (chacun au maximum ou au plafond du prestige : au prestige 0, Efficacité I + Fortune I + Solidité I suffisent) |
| 🏆 | Bedrock ! | Atteindre la bedrock, tout au fond de la mine | `victoire` vraie (couche bedrock − 1 finie) |

Les compteurs « dans la partie en cours » repartent de 0 à chaque prestige, mais un succès obtenu reste obtenu.

---

## 8. Les statistiques (`src/jeu/statistiques.ts`, fenêtre 📊)

Ce qui est compté (`Statistiques`), pour **cette partie** (`stats`, remis à 0 au prestige) et **depuis le début** (`statsTotales` : les parties d'avant, auxquelles on ajoute celle-ci ; « le plus bas atteint » garde le maximum au lieu d'additionner) :

| Statistique | Ce qui la fait monter |
|---|---|
| `blocsCasses` | chaque bloc cassé **par le joueur** (spéciaux compris) |
| `blocsParType` | le même, sorte par sorte |
| `argentGagne` | **tout** l'argent gagné : ventes au marché, chargements de l'ascenseur, coffres, chariots de la foreuse, ventes des mineurs |
| `argentForeuse` | l'argent des chariots de la foreuse vendus |
| `argentMineurs` | l'argent rapporté par les ventes des mineurs employés |
| `tempsMinage` | la somme des durées calculées des blocs du joueur (temps « théorique », sans le minimum de 0,08 s ni les trajets) |
| `coffresOuverts`, `geodesCassees`, `lavesEteintes` | chaque coffre, géode, lave éteinte au seau |
| `diamantsTrouves` | les diamants récoltés par le joueur (2 si Fortune double) |
| `blocsForeuse` | les blocs forés par la foreuse |
| `blocsMineurs` | les blocs creusés par les mineurs employés |
| `profondeurMax` | la couche la plus basse où **le joueur** a cassé un bloc |
| `salairesPayes` | les salaires payés aux mineurs et au manager |

La fenêtre 📊 a deux onglets (« Cette partie (prestige N) » / « Depuis le début ») et montre : 4 tuiles (💵 argent gagné, ⛏️ blocs cassés, 📏 le plus bas, ⏱️ temps à creuser) ; « 💰 D'où vient ton argent » (barre en 3 couleurs : **Toi** = argent gagné − foreuse − mineurs, **Foreuse**, **Mineurs**, avec montants et %) ; « 🧱 Tes blocs cassés » (les 12 sortes les plus cassées, avec le nombre de sortes différentes) ; et une liste : blocs forés, blocs des mineurs, salaires payés, diamants, coffres, géodes, laves éteintes.

L'argent gagné sert aussi au **classement** en ligne : `argentGagneAvant` (prestiges précédents) + argent gagné de la partie.

---

## 9. L'écran de victoire (`src/composants/Victoire.tsx`)

- Il s'ouvre **une seule fois**, au moment où `victoire` passe à vrai (pas à la réouverture du monde). Ensuite, un bandeau dans la mine rappelle « 🏆 Bedrock atteinte : creuse encore ici, ou passe prestige à l'arbre de prestige (village). ».
- Contenu :
  - 🏆 **« Bedrock atteinte ! »**, « Tu as creusé jusqu'à -X m. Bravo, mineur ! Au prochain prestige, la mine descendra jusqu'à -Y m. » (X = bedrock du prestige, Y = celle du suivant) ;
  - 4 chiffres de la partie : **blocs cassés**, **$ gagnés**, **temps de minage** (« N min SS s »), **coffres ouverts** ;
  - ce que garde le prestige : « tes succès, tes talents, tes pioches, ton sac, tes enchantements, l'ascenseur, la foreuse et ton personnel » ; au prestige 0, en plus : « Et au village, la barrière de la foreuse s'ouvrira ! » ;
  - si tout est prêt : on peut aussi continuer à creuser et passer prestige plus tard à l'arbre de prestige ; sinon : « Avant, améliore au maximum ce que ce prestige permet… » ;
  - la **carte de prestige** en version compacte : badge « N/M » ou « Prêt ! », jauge « Prêt pour le prestige : N/M », la liste des conditions **pas encore remplies** (bedrock, ascenseur, sac, enchantements, puis foreuse, mineurs, recruteur selon le prestige ; détail dans [prestige.md](../batiments/prestige.md)) et le bouton **⭐ Passer prestige N** (grisé tant que tout n'est pas fait) ;
  - un bouton pour fermer : **« Continuer à creuser »** (si prêt) ou **« Je m'en occupe ! »**.
- Passer prestige depuis cet écran : nouvelle partie au prestige suivant, mineur replacé devant la mine au village, fête (confettis), puis l'arbre de prestige pour choisir un talent.

---

## Fichiers du code

- `src/jeu/mine.ts` : tirage des blocs, apparition des minerais, couches.
- `src/jeu/aleatoire.ts` : aléatoire injectable, générateur à graine.
- `src/jeu/donnees.ts` : `BLOCS`, `PIOCHES`, `LARGEUR_MINE`, `profondeurBedrock`, mise à l'échelle, roche dure, zones, `dureeCasse`.
- `src/jeu/mineur.ts` : état de la partie, déplacements, minage, récolte, couches, galeries, victoire.
- `src/jeu/temps.ts` : ce qui avance tout seul ; `src/travail.ts` : le temps passé sur un bloc.
- `src/usePartie.ts` : horloge, boutons Creuser / Auto, sac plein, envoi automatique, hors ligne (8 h), sauvegarde, sons et animations.
- `src/evenements.ts` : événements pour les sons et animations.
- `src/jeu/decouvertes.ts`, `src/jeu/succes.ts`, `src/jeu/statistiques.ts` (+ `src/composants/Statistiques.tsx`).
- `src/composants/Victoire.tsx`, `src/composants/CartePrestige.tsx`, `src/jeu/conditionsPrestige.ts`.
- `src/composants/VueMonde.tsx` : dessin de la mine (couches, bedrock, bandeaux de galerie et de victoire).
