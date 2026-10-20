# ⛏️ Mine (entrée du puits)

> L'entrée de la mine, à gauche du village : on y descend par l'échelle ou par l'ascenseur, et on y construit et améliore l'ascenseur qui remonte les minerais au marché.

## Où et quand

- **Position** : à **x = 4,5 tuiles** sur le chemin (identifiant `'puits'`, nom affiché « Mine », sans icône), entre l'arbre de prestige (x = 1,5) et le marché (x = 7,5). On est « devant » un stand à 1,4 tuile près. C'est aussi `X_PUITS` : le mineur y est replacé après un prestige ou en recommençant une partie.
- **Déblocage** : disponible **dès le début** (prestige 0), jamais de cadenas.
- **Dessin au village** (CSS, `src/index.css`) : une galerie creusée dans un rocher, étayée de poutres, avec des rails, un wagonnet de minerai et une **lanterne** qui vacille (animation de 1,8 s). Le dessin s'éclaircit un peu au survol.
- **Badges et flèches** :
  - pastille **« 💰 Achetable ! »** quand le prochain niveau de l'ascenseur est permis par le prestige et payable tout de suite (argent + minerais **dans le sac**) ;
  - après un prestige qui relève le plafond de l'ascenseur (prestiges 1 à 4), badge **« ⬆ Niveaux ! »** et flèche jaune **« ⬆ Nouveaux niveaux : Mine ! »** jusqu'à ce qu'on passe devant.
- **Dans la mine** (`VueMonde.tsx`) : le puits longe la mine à gauche ; l'**échelle** descend jusqu'au front de taille, à côté du **rail de l'ascenseur** (grisé tant qu'il n'est pas construit). Une fois construit : une poulie en haut (qui tourne pendant les trajets), un câble, et une cabine (toit avec lampe, grille, plancher rayé, petite caisse de minerai quand elle est chargée ou que le quai n'est pas vide). Le mineur est dessiné dans la cabine quand il voyage dedans. Le bandeau affiche `🛗 <niveau>` quand l'ascenseur existe.

## Ce qu'on peut y faire

### Au stand (au village)

- Le panneau rappelle la profondeur de la mine (« Ta mine descend à -X m ») et le temps de descente : « L'ascenseur t'attend : descente en N s » si la cabine est au village, sinon « À l'échelle, il faut N s ».
- **⏬ Descendre dans la mine en ascenseur / à l'échelle** : le mineur marche jusqu'au puits, puis prend l'ascenseur s'il est là (au village et à l'arrêt), sinon l'échelle, jusqu'au front de taille. (Même effet que le bouton **⛏️ Mine** de la barre du bas.)
- **🛗 Appeler l'ascenseur** (si construit et pas au village) : la cabine vient au village. Grisé pendant qu'elle roule.
- **🛗 Ascenseur** : construire (niveau 1) ou améliorer, sans descendre. Les niveaux au-delà du plafond affichent « 🔒 … · au prestige N ». Impossible pendant que la cabine roule.
- Au clavier, devant le puits : **↓** commence à descendre l'échelle (on avance tant que la touche est appuyée) ; ailleurs dans le village, ↓ fait marcher jusqu'au puits puis descendre.

### Les niveaux de l'ascenseur (`NIVEAUX_ASCENSEUR`)

| Niveau | Coût | Objets par voyage | Temps par mètre | Trajet complet à -100 m (≈ 98 m) |
|---|---|---|---|---|
| 1 | 250 $ + 8 fer | 32 | 0,1 s | ≈ 10 s |
| 2 | 1 200 $ + 15 fer + 5 redstone | 64 | 0,07 s | ≈ 7 s |
| 3 | 2 000 $ + 30 fer + 15 redstone | 128 | 0,05 s | ≈ 5 s |
| 4 | 4 500 $ + 50 fer + 30 redstone | 256 | 0,03 s | ≈ 3 s |
| 5 | 9 000 $ + 80 fer + 50 redstone | 512 | 0,02 s | ≈ 2 s |
| 6 | 18 000 $ + 120 fer + 80 redstone | 1 024 | 0,015 s | ≈ 1,5 s |

À comparer avec l'**échelle** : **0,15 s par mètre** (≈ 15 s pour remonter de -100 m). Le talent **Ascenseur express** rend la cabine 30 % plus rapide (temps ÷ 1,3).

### Au fond de la mine (panneau « 🎒 Sac »)

- **📦 Envoyer N objets** : la cabine emporte au marché ce qu'on a choisi avec les jauges du sac (une jauge à 0 = objet « gardé », mémorisé) ; ce chargement est **vendu en arrivant au village** (avec les bonus de vente), puis la cabine **redescend toute seule** au front. Si elle n'est pas là, on l'appelle et elle repartira chargée.
- **⏫ Remonter** (si la cabine est à ton niveau) : remonte seulement le mineur, **sac plein, rien n'est vendu**.
- **🛗 Appeler l'ascenseur** (sinon) : la cabine vient au niveau du mineur. Pendant un voyage, les boutons sont grisés et comptent les secondes (« Là dans N s », « De retour dans N s »).
- **Envoi automatique quand le sac est plein** (case à cocher) : pendant qu'on creuse, dès que le sac est plein (ou que le quai n'est pas vide), l'ascenseur part tout seul avec les objets cochés ; on continue de creuser.
- Le bloc **🛗 Ascenseur** pour construire / améliorer est aussi là.
- Onglet **🧰 Pioches** : changer de pioche équipée.

### La barre du bas

**⛏️ Creuser** (finit la couche en cours), **♾️ Auto** (creuse sans s'arrêter, s'arrête si la pioche casse), **🏠 Village** (remonter), **⛏️ Mine** (descendre). Au clavier, au front : ← → pour se déplacer, ↑ pour monter l'échelle ; sur l'échelle : ↑ / ↓.

## Règles et comportement

### Échelle et déplacements

- La position du mineur est en mètres : 0 = village, `profondeur − 1` = front de taille. La partie commence à **-2 m** (le premier mètre est l'entrée du puits, déjà creusée).
- Pour quitter le front, le mineur **marche d'abord jusqu'au puits** (colonne 0, à gauche), à **0,12 s par case**, puis prend l'ascenseur s'il est là, sinon l'échelle.
- Quand on relâche la flèche sur l'échelle, le mineur s'arrête **au prochain barreau** (un appui très court fait toujours bouger d'un mètre).
- Dans la cabine, on ne peut pas utiliser l'échelle : c'est la cabine qui porte le mineur.

### Ascenseur

- **Plafond par prestige** (`PLAFONDS.ascenseur`) : niveau **2 au prestige 0**, puis un de plus par prestige : 3 au prestige 1, 4 au 2, 5 au 3, **6 (max) au prestige 4**.
- Le niveau 1 ne demande pas de redstone, pour pouvoir le construire tôt. Les minerais se paient avec **le contenu du sac**.
- À la construction, la cabine est posée **là où se trouve le joueur** (au village si on la construit au stand).
- **Quai** : quand le sac est plein, les blocs en trop attendent sur le quai de l'ascenseur, jusqu'à la **capacité** de la cabine. Quand le sac (et le quai) sont pleins, le minage s'arrête avec « 🎒 Sac plein ! » ; sans ascenseur, il n'y a pas de quai, donc il s'arrête dès que le sac est plein.
- **Chargement** : d'abord le quai, puis le sac, **les objets les plus chers en premier**, dans la limite de la capacité.
- Remonter avec le bouton **🏠 Village** en prenant la cabine emporte aussi le sac (les objets non gardés), vendu à l'arrivée ; seul **⏫ Remonter** du sac garde tout.
- La cabine **suit le front de taille** quand on descend d'une couche, si elle y attendait.
- Les **mineurs employés** ont leurs propres cabines, aussi rapides que ton ascenseur (au moins comme un niveau 1 si tu n'en as pas).

### La mine elle-même

- **Profondeur de la bedrock** : **-100 m au prestige 0, puis 50 m de plus par prestige** (-150, -200, -250…). La dernière couche qu'on creuse est juste au-dessus. En y arrivant : victoire (« 🏆 Tu as atteint la bedrock ! »), écran de victoire, et on continue en **galerie horizontale**.
- **Couches** : chaque couche fait **10 blocs** de large. On la casse bloc par bloc (le mineur va au plus proche, en zigzag) ; quand elle est vide, on descend d'un mètre. On voit toujours **4 couches** sous la couche en cours, de plus en plus sombres.
- **Mise à l'échelle** : toutes les profondeurs des données sont écrites pour une mine de référence de 150 m, puis multipliées par `bedrock / 150` (× 2/3 au prestige 0, × 1 au prestige 1, × 4/3 au prestige 2…). Ainsi chaque mine a le charbon près de la surface et les débris tout au fond.
- **Roche de base** (profondeurs au prestige 0 / prestige 1) : terre jusqu'à ≈ -4,7 / -7 m, puis pierre, puis **roche dure** sous ≈ -63 / -94 m (casse **1,5 × plus lentement**). Gravier jusqu'à ≈ -37 / -56 m.
- **Minerais** : chacun apparaît rare à sa profondeur de début, puis devient de plus en plus fréquent jusqu'à sa profondeur « pleine » :

| Minerai (prix) | Prestige 0 (mine de 100 m) | Prestige 1 (mine de 150 m) |
|---|---|---|
| Charbon (5 $) | -5 → -23 m | -8 → -35 m |
| Fer (12 $) | -5 → -27 m | -8 → -41 m |
| Redstone (15 $) | -14 → -39 m | -21 → -59 m |
| Or (35 $) | -19 → -51 m | -29 → -76 m |
| Lapis (20 $) | -23 → -51 m | -35 → -76 m |
| Émeraude (80 $) | -31 → -55 m | -47 → -82 m |
| Diamant (100 $) | -35 → -78 m | -53 → -117 m |
| Débris antiques (400 $, très durs) | -75 → -90 m | -112 → -135 m |

- **Blocs spéciaux** (ne vont pas dans le sac) : **coffre** (sous ≈ -13 m au prestige 0) : (20 à 60 + profondeur × 3 à 8) $, ×2 avec Chasseur de trésors, + 1 minerai du coin ; **lave** (sous ≈ -31 m) : avec un seau, +1 obsidienne, sinon elle brûle **un tiers de chaque pile du sac** ; **géode** (sous ≈ -39 m) : 3 à 6 améthystes.
- **Profondeur max des pioches** (prestige 0 / 1) : Bois -23 / -35 m, Pierre -47 / -70 m, Fer -75 / -112 m, Diamant -91 / -136 m, Netherite jusqu'à la bedrock. Si la couche suivante est trop dure, on creuse une **galerie horizontale** à la même profondeur (on n'est jamais bloqué), avec un message qui dit quelle pioche il faut.
- **À mains nues** : une pioche cassée creuse à la vitesse **1**. « Creuser » marche toujours ; « Auto » s'arrête quand la pioche casse.
- **Durée d'un bloc** : dureté × (1,5 en roche dure) ÷ vitesse × 0,45. Vitesse = pioche × (1 + 25 % par niveau d'Efficacité) × (1 + 10 % par prestige) × talents.
- **Usure** : à chaque bloc, 1 chance sur (Solidité + 1) d'user la pioche d'un point (× 0,7 avec Pioche robuste).

### Hors ligne

Quand on rouvre un monde, le temps écoulé (au plus **8 heures**) est rattrapé : les trajets en cours (échelle, cabine) se terminent, et un chargement de cabine arrivé au village est vendu. Le mineur, lui, **ne creuse pas** pendant l'absence.

### Au prestige

- **Gardé** : le **niveau de l'ascenseur** ; les pioches débloquées (toutes réparées, la meilleure équipée).
- **Remis à zéro** : la mine (nouvelle mine plus profonde, on repart à -2 m), le mineur au village, la cabine attend au village, le **quai et le chargement vidés**, les objets « gardés » et l'envoi automatique remis à leur état de départ.

## Lien avec le reste du jeu

- **Conditions de prestige** : « Atteindre la bedrock (-X m) » et « 🛗 Ascenseur au niveau N » (plafond du prestige) en font partie.
- **Objectifs** (`objectifs.ts`) : « Construire l'ascenseur » / « Ascenseur niveau N » est un achat du stand `puits` (« achetable à l'entrée de la mine ! ») ; quand il n'y a plus rien à acheter, l'objectif devient « Atteindre la bedrock » (avec la jauge de profondeur).
- **Marché** : la cabine vend son chargement à l'arrivée, aux mêmes prix et bonus que le marché. **Forgeron** : pioches pour descendre plus bas. **Bazar** : sacs et seaux d'eau contre la lave. **Enchanteur** : Efficacité, Fortune et Solidité utilisées au fond. **Foreuse** et **Personnel** : ils creusent leurs propres puits à droite de la mine, dans la même mine du prestige.
- **Succès** liés : Spéléologue (-60 m), Dans les abîmes (-105 m), Bedrock !, Chasseur de trésors, Géologue, Pompier, Ça brille !.

## Fichiers du code

- `src/composants/stands.ts` : position du puits (x = 4,5, `X_PUITS`).
- `src/composants/VueVillage.tsx` : dessin de l'entrée de la mine, pastilles et badges.
- `src/App.tsx` : panneau du stand (descendre, appeler l'ascenseur), barre de boutons et clavier.
- `src/composants/Ascenseur.tsx` : bloc « construire / améliorer » et état de la cabine.
- `src/composants/Inventaire.tsx` : sac au fond, envoi, remontée, envoi automatique.
- `src/composants/VueMonde.tsx` : dessin du puits, de l'échelle, de la cabine et des couches.
- `src/composants/Amelioration.tsx` : affichage commun d'un niveau (cadenas « au prestige N »).
- `src/jeu/mineur.ts` : déplacements, échelle, ascenseur, quai, minage, galeries, mains nues.
- `src/jeu/mine.ts` : génération des couches et apparition des minerais.
- `src/jeu/donnees.ts` : `NIVEAUX_ASCENSEUR`, `PLAFONDS`, `profondeurBedrock`, `BLOCS`, `PIOCHES`, vitesses.
- `src/jeu/temps.ts` : le temps qui passe (marche, échelle, cabine).
- `src/usePartie.ts` : boucle de minage, envoi automatique, rattrapage hors ligne (8 h max).
- `src/jeu/objectifs.ts` : achat « Ascenseur » du stand `puits` et badge « Nouveaux niveaux ».
- `src/index.css` : styles de l'entrée de la mine (rocher, poutres, lanterne, wagonnet).
