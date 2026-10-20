# Le visuel et les sons de Mega Digger

> Le style graphique, les animations, le décor, les bruitages, la musique et l'application installable (PWA).
> Écrit d'après le code au 20/10 : `src/index.css`, `src/blocs.css`, `src/effets.css`, `src/personnel.css`, `src/accueil.css`, `src/composants/*.tsx`, `src/sons.ts`, `src/ambiance.ts`, `src/installation.ts`, `public/`. Ce que fait chaque bouton est dans [interface.md](interface.md) ; les dessins propres à chaque bâtiment sont aussi détaillés dans les fiches [docs/batiments/](../batiments/README.md).

## Sommaire

1. [Le style général](#1-le-style-général)
2. [Les blocs de la mine (`blocs.css`)](#2-les-blocs-de-la-mine-blocscss)
3. [La mine et ses machines](#3-la-mine-et-ses-machines-indexcss)
4. [Le personnage (`Personnage.tsx`)](#4-le-personnage-personnagetsx)
5. [Les animations et effets](#5-les-animations-et-effets)
6. [L'écran d'accueil (`accueil.css`)](#6-lécran-daccueil-accueilcss)
7. [Le décor du village](#7-le-décor-du-village)
8. [Les sons et la musique](#8-les-sons-et-la-musique)
9. [Les boutons 🔊 et 🎵](#9-les-boutons--et-)
10. [L'application installable (PWA)](#10-lapplication-installable-pwa)

---

## 1. Le style général

- **Tout est dessiné en CSS** (dégradés, ombres, `clip-path`, `@keyframes`) : aucune image de sprite. Les seuls dessins SVG sont le personnage (`Personnage.tsx`), l'icône du stand Personnel (`Icone.tsx`) et le favicon. Les autres icônes sont des **émojis** (choix du 19/10 : style cartoon, « plus de pixel art, pour ne pas ressembler à Minecraft »).
- **Style cartoon** : formes rondes, cailloux irréguliers, auvents bombés, panneaux en bois arrondis, contours sombres.
- **Thème sombre** (`color-scheme: dark`). Les couleurs de base (`:root` de `index.css`) :

| Variable | Couleur | Usage |
|---|---|---|
| `--fond` | `#15151a` | fond de la page (avec un halo `#2a2a36` en haut) |
| `--texte` | `#ece9e4` | texte |
| `--texte-doux` | `#a9a5a0` | texte secondaire (`.discret`) |
| `--accent` | `#f2b33d` | or : titres, argent, sélection, focus |
| `--carte` / `--carte-claire` | `#23232b` / `#2e2e38` | cartes et lignes |
| `--bordure` | `#3a3a46` | bordures |
| `--vert` / `--rouge` / `--violet` | `#5cc95c` / `#e5534b` / `#a77be8` | ce qu'on a (`.ok`) / ce qui manque (`.manque`) / enchantements |

- **Polices** : `system-ui` pour le jeu ; **Luckiest Guy** (Google Fonts, chargée dans `index.html`, toujours en MAJUSCULES) pour le logo, le titre du jeu, les titres de l'accueil, le gros bouton Jouer. Hors ligne : Arial Black.
- Les chiffres qui changent (argent, compteurs, étiquettes) utilisent `tabular-nums` pour ne pas trembler.
- **Mouvements réduits** : quand le système demande `prefers-reduced-motion: reduce`, presque toutes les animations sont coupées (et les particules, pièces, confettis, étincelles cachés) ; le compteur d'argent saute directement à sa valeur.
- Les couleurs des boutons par sorte d'action : voir [interface.md § 15](interface.md#15-les-couleurs-des-boutons).

---

## 2. Les blocs de la mine (`blocs.css`)

Chaque case est un **galet arrondi** (`border-radius` irrégulier, qui varie d'une case sur trois), avec du relief : reflet blanc en haut, ombre en bas, petite ombre portée. Les minerais sont une **roche** (pierre grise ou deepslate sombre rayée, selon la profondeur) avec des **taches de couleur** et deux petits éclats blancs qui brillent.

| Bloc | Dessin |
|---|---|
| Pierre | gris `#858585 → #6f6f6f`, taches plus claires et plus foncées |
| Deepslate | gris-bleu foncé `#48484f → #343439`, fines rayures horizontales |
| Terre | brun `#8b5a2b → #6e4520`, taches |
| Gravier | gris-beige, grosses taches rondes |
| Charbon | taches noires `#1c1c1c` |
| Fer | taches beige rosé `#d8a07a` |
| Redstone | taches rouges `#d01414` |
| Lapis | taches bleues `#1f4fbf` |
| Or | taches jaunes `#f4c518` |
| Émeraude | taches vertes `#17b84a`, **scintille** (2,4 s) |
| Diamant | taches turquoise `#3fe0d0`, **scintille** |
| Débris (netherite) | cercles concentriques bruns, lueur cuivrée |
| Améthyste | dégradé conique violet |
| Obsidienne | violet très sombre avec taches |
| Lave | orange-jaune, **lueur orange qui pulse** (1,6 s) |
| Coffre | bois rayé, bande sombre et serrure dorée, coins moins arrondis |
| Géode | roche avec un cœur violet en anneaux |
| Bedrock | gris très foncé avec taches noires et grises |
| Case creusée | trou sombre (`rgb(0 0 0 / 0.35)`, ombre intérieure) |

- **`.mini-bloc`** : un petit galet de 22 px (18 à 20 px selon l'endroit) utilisé dans le sac, les jauges, les statistiques, les trouvailles.
- **Le bloc en cours** (`.en-cours`) : un contour blanc. Pendant le minage (`.casse`), il **tremble** (0,12 s en boucle) et des **fissures** noires apparaissent en grossissant pendant exactement la durée du bloc (`--duree`).
- **Lumière naturelle** : les 4 couches sous le front s'assombrissent (luminosité 85 %, 68 %, 52 %, 38 %).
- **Couleur de fond des trous par zone** : Surface `#4a3423`, Cavernes `#34343b`, Mines `#2b2724`, Profondeurs `#1f1f27`, Roche dure `#17171d`, Abîmes `#1a0b10`.

---

## 3. La mine et ses machines (`index.css`)

- **La vue** : un cadre noir `#0b0a0c`, bordure noire de 3 px, coins arrondis, ombre intérieure, fine barre de défilement.
- **L'échelle** : deux montants en bois `#7a4f22` et un barreau `#b07a3f` tous les 10 px.
- **Le puits de l'ascenseur** : en pointillés tant qu'il n'est pas construit ; construit, un puits sombre entre deux glissières en acier avec des boulons et une traverse par mètre. En haut, une **poulie** (cercle à rayons) qui **tourne** (0,6 s) quand la cabine bouge, et un **câble** gris rayé jusqu'au toit de la cabine.
- **La cabine** : une cage en métal (dégradé `#3a3a44 → #24242b`), un toit doré avec une petite **lampe jaune** (qui **clignote en orange** pendant les trajets), une grille de barreaux devant, un plancher rayé jaune et noir. Avec un passager, la grille s'efface à moitié et un halo doré entoure la cabine. Chargée, une **caisse en bois remplie de minerai** (pépites jaune, turquoise, rouge). Pas de transition CSS : la cabine est redessinée à chaque image pendant le trajet.
- **La foreuse dans la mine** (dès le prestige 1) : un puits sombre à droite des 10 cases, et la **tête** : une machine orange toute ronde avec un hublot, un collier en acier, un pot d'échappement, un gyrophare jaune, et une longue **mèche** en spirale. En marche : halo orange, gyrophare qui clignote, mèche qui tourne (la spirale défile), machine qui vibre, petit nuage de fumée, 3 cailloux projetés. Éteinte : grisée et assombrie. Étiquette jaune « -*n* m ». La tête descend en douceur (0,3 s).
- **La galerie des mineurs employés** (2 cases à droite de la foreuse) : à gauche, un puits d'ascenseur comme celui du joueur (poulie, câbles, une cabine par mineur, qui glisse en 0,1 s) ; à droite, un trou de terre étayé (une poutre par mètre). Le mineur qui creuse se tient au-dessus d'un bloc qui tremble. Étiquette orange (`#ffb35c`) ou couleur de rareté, aura qui pulse pour légendaire et mythique, verte quand il remonte sac plein.
- **Les bandeaux** : « 🏆 Bedrock atteinte… » collé en haut (fond presque noir, texte or) ; « 🧱 Couche trop dure… » collé en bas (fond rouge-brun, bord orange, texte crème).

---

## 4. Le personnage (`Personnage.tsx`)

Une **taupe mineuse** en SVG (64 × 64) : corps rond gris-violet `#4a4150` au ventre clair, museau et nez rose, moustaches, un œil brillant, **casque de chantier jaune** avec une **lampe frontale** qui luit, **gilet jaune** à bandes réfléchissantes, **sac à dos jaune**, pieds roses. Elle tient une **pioche** de la couleur de celle qui est équipée :

| Pioche | Couleur du fer |
|---|---|
| Bois | `#b5834a` |
| Pierre | `#8f8f8f` |
| Fer | `#e6e6e6` |
| Diamant | `#4ee8dc` |
| Netherite | `#6b5568` |

Sans pioche (cassée) : rien dans la main. Les mineurs employés utilisent le même dessin, avec la couleur de leur pioche.

| Action | Animation |
|---|---|
| `repos` | immobile |
| `creuse` | la pioche frappe (rotation de -35° à +40°, 0,32 s en boucle) |
| `marche` | un petit saut (0,25 s) |
| `grimpe` | se balance de gauche à droite (0,4 s en boucle) |

Elle est retournée (`scaleX(-1)`) quand elle va vers la gauche, et a une petite ombre portée pour se voir sur les fonds sombres.

---

## 5. Les animations et effets

### 5.1 En creusant (`effets.css`, `VueMonde.tsx`, `usePartie.ts`)

| Effet | Quand | Description |
|---|---|---|
| **Éclats** | chaque bloc cassé | 7 petits morceaux de 8 px **avec la texture du bloc** qui sautent dans des directions fixes, tournent et retombent (0,55 s) |
| **Trouvaille** | chaque minerai ou objet ramassé (pas la pierre, la terre, le gravier, la deepslate) | une pilule « [mini-bloc] +*n* *Nom* » qui monte au-dessus du mineur (1,8 s), bordée et éclairée de la couleur du minerai, le mini-bloc se balance, des **rayons** de lumière tournent derrière, 5 **étincelles** en étoile jaillissent |
| **Secousse** | minerai **rare** (lapis, or, émeraude, diamant, débris) | toute la mine tremble 0,35 s |
| **Bond de la profondeur** | chaque couche finie | « 📏 -*n* m » du bandeau fait un petit bond, bleuté |

Au plus 5 éclats et 3 trouvailles à la fois.

Couleurs des trouvailles : charbon `#c9c9c9`, fer `#ecc7a8`, redstone `#ff4d4d`, améthyste `#c9a2ff`, obsidienne `#a26ad8`, lapis `#4a7eea`, or `#ffd84a`, émeraude `#4cf08a`, diamant `#7ff5ec`, débris `#e0965f`.

### 5.2 L'argent

| Effet | Quand | Description |
|---|---|---|
| **Grosse vente** | chaque vente (marché, chariot, ascenseur) | « +*X* $ » en grosses lettres jaunes contournées de brun, au milieu en haut de la vue : apparaît en grossissant, se pose, monte et s'efface (1,8 s), avec une **gerbe de 12 pièces** dorées qui jaillissent en cercle en tournant sur elles-mêmes puis retombent |
| **Petit gain** | argent qui n'est pas une vente (coffre, récolte des mineurs…) | « +*X* $ » doré qui monte et grossit en s'effaçant (1,2 s), en bas à droite de la vue |
| **Compteur qui défile** | toute variation d'au moins 5 $ | l'argent du bandeau défile jusqu'à la nouvelle somme en 0,6 s (rapide puis ralentit) |
| **Compteur qui saute** | chaque vente | grossit à 130 % en virant au jaune lumineux (0,5 s) |

### 5.3 Les alertes et repères

| Effet | Description |
|---|---|
| Sac plein | la case Sac du bandeau a une bordure rouge, tremble et s'entoure d'un halo rouge (1,4 s en boucle) |
| ⭐ avec des points | bordure dorée, halo, scintille |
| Prochain objectif prêt | bordure verte, halo vert qui pulse (1,6 s) |
| Badges « Nouveau ! », « ⬆ Niveaux ! » | sautent de 6 px (0,7 s) |
| Flèches du village | clignotent (1 s) et leur pointe pousse vers le stand (0,6 s) |
| Mineur pas payé | tape du pied, bulle 😠 qui saute |
| Indicateur mineurs en alerte | bordure rouge, clignote |
| Carreaux de niveau | le dernier carré acheté fait un « pop » (0,45 s) |
| Toast | apparaît avec un rebond (0,35 s) |

### 5.4 Les grands moments (`personnel.css`, `effets.css`)

- **Victoire** : la fenêtre apparaît avec un rebond, le trophée 🏆 scintille.
- **Fête du prestige** (`FetePrestige.tsx`) : fond radial rose, **flash** blanc, grands **rayons** dorés qui tournent (720 px), une carte rose et dorée qui « pop » avec un halo qui pulse, une **étoile** ⭐ qui arrive en tournant (-540° → 0°), le titre puis les 4 gains qui apparaissent l'un après l'autre (0,6 s, 0,75 s, 0,9 s, 1,05 s), le bouton à 1,2 s, et **90 confettis** (rose, or, blanc, bleu, vert, violet ; un sur trois rond) qui jaillissent tout autour puis retombent (1,8 s).
- **Révélation d'une recrue** (`RevelationRecrue.tsx`) : pendant 1,6 s, le fond change de couleur toutes les 0,08 s (les 5 raretés) et la carte tremble en grossissant ; puis elle **se retourne en 3D** (0,55 s), rayons de la couleur de la rareté, confettis (24 + 18 × rang), **flash** plein écran pour légendaire et mythique, halo qui pulse autour de la carte, bouton arc-en-ciel avec un reflet qui passe.
- **Arbre de prestige** : la fenêtre apparaît avec un rebond ; les talents disponibles ont une bordure en pointillés et un halo qui pulse ; le talent choisi grossit un instant avec un halo de la couleur de la branche (Mineur `#6fb8ff`, Marchand `#f2b33d`, Ingénieur `#5cc95c`, Patron `#e07b2a`, Recrutement `#ff4d8d`).

---

## 6. L'écran d'accueil (`accueil.css`)

- **Le bandeau « héros »** : une grotte (dégradé violet sombre → brun, bordure brune, coins de 22 px), deux grandes **lueurs** floues (or en haut à gauche, violet en bas à droite) qui **respirent** (6 s), **26 éclats de minerai** (losanges brillants or, turquoise, vert, rouge, bleu, violet) qui **montent** en apparaissant puis s'effacent (6 à 12 s, décalés), et deux plans de **rochers ronds** en bas.
- **Le logo** : ⛏️ qui **pioche** en boucle (1,6 s) ; « MEGA » et « DIGGER » en lettres dorées dégradées (crème → or → orange), contour brun épais, ombre portée, et un **reflet blanc** qui passe dessus (3,5 s).
- **L'accroche** en Luckiest Guy blanc, « Deviens riche. » en vert fluo.
- **Le gros bouton Jouer** : doré, gros relief brun en dessous, halo, reflet qui passe (3 s) et **respire** (grossit de 3 %, 2 s) ; se soulève au survol et s'enfonce au clic.
- **L'illustration de la mine** : penchée de 3°, halo doré, **flotte** de haut en bas (5 s) ; elle réutilise les classes des vrais blocs (`blocs.css`) et le vrai personnage avec une pioche en diamant qui creuse. La pastille « 🏆 Bedrock » scintille.
- **Les 4 cartes « Comment jouer »** : chacune a sa couleur (bordure, lueur, titre, gros numéro transparent) et se soulève au survol.
- **Les cartes des mondes** : liseré et lueur de la couleur du monde, se soulèvent au survol. La carte « Nouveau monde » est en pointillés.
- **Le classement** : la ligne du joueur connecté est entourée d'or.

---

## 7. Le décor du village

### 7.1 Les calques, du fond vers l'avant

La bande du village fait **250 px de haut** (`.village`, `overflow: clip` pour qu'elle ne défile jamais toute seule).

| Ordre | Élément | Défilement | z-index | Description |
|---|---|---|---|---|
| 1 | **Ciel** | fixe | — | dégradé `#4f97e0 → #a8d4f5 → #cfe9f8` (fond de `.village`) |
| 2 | **Soleil** | fixe | — | carré jaune `#ffe35c` aux coins arrondis, en haut à droite, avec un halo |
| 3 | **Nuages** | animés tout seuls | 0 | 2 nuages blancs (trois blocs arrondis) qui traversent en 50 s et 65 s ; ils passent **derrière** les collines, les stands et les panneaux des noms (corrigé le 20/10 : avant, ils passaient devant) |
| 4 | **Collines** | **40 % de la vitesse** (parallaxe) | — | 9 collines vertes arrondies (deux verts en alternance), hauteurs 46 à 88 px |
| 5 | **Sol** | avec le monde | — | 76 px : herbe `#5aa83c`, chemin de terre beige `#d8b47a` bordé, terre brune `#7a5230`, petits cailloux |
| 6 | **Arbres** | avec le monde | 0 | tronc et feuillage en trois boules vertes |
| 6 | **Décor du fond** (herbes, fleurs, barrières) | avec le monde | 1 | derrière le chemin |
| 7 | **Stands** | avec le monde | 2 | posés sur l'herbe |
| 7 | **Mineurs qui attendent leur salaire** | avec le monde | 2 | devant le stand Personnel |
| 8 | **Le joueur** | avec le monde | 3 | sur le chemin (44 px) |
| 9 | **Décor de devant** (herbes, fleurs, rochers) | avec le monde | 4 | passe **devant** le mineur |
| 10 | **Flèches** de découverte / niveaux / salaires | fixes, collées au bord | 6 | |

Le monde du village (`.village-monde`) glisse avec une petite transition de 0,05 s. Sa largeur est au moins celle de l'écran.

### 7.2 Le décor tiré au hasard

Toujours le même à chaque visite (graine `2026`), sur **40 tuiles** (le village en fait 27, le décor continue pour les écrans larges) :
- des **arbres** tous les 1,5 à 3,5 tuiles, jamais à moins de 1,3 tuile d'un stand ;
- des **hautes herbes** (trois brins qui se balancent, 3 s) et des **fleurs** (1 sur 4 ; rouge, jaune, blanche ou violette) toutes les 0,35 à 0,95 tuile, une moitié devant, une moitié derrière le chemin ;
- **3 rochers** gris au premier plan ;
- **2 bouts de barrière** en bois (x = 24,8 et 26,2).

### 7.3 Les stands

- **Échoppes** (Marché, Forgeron, Bazar, Enchanteur, Personnel) : 64 × 64 px, un **auvent rayé** bombé avec un bord en festons, de la couleur du stand (Marché `#d43b3b` rouge, Forgeron `#5b5b66` gris ardoise, Bazar `#2f8f4a` vert, Enchanteur `#7a4cc2` violet, Personnel `#e07b2a` orange, rayures crème `#f5efe0`), et un **comptoir en bois** qui porte l'icône (émoji, ou le dessin SVG de deux mineurs casqués pour Personnel).
- **Entrée de la mine** : un rocher gris en petite colline, un tunnel noir étayé de poutres, une **lanterne** qui vacille (1,8 s), des rails et un wagonnet chargé de minerai.
- **Foreuse (derrick)** : la plus grande machine du village (100 × 128 px) : tour en treillis d'acier, gyrophare rouge, grosse machine orange avec hublot, roue dentée et cheminée, mèche en spirale, halo doré derrière. En marche : la roue tourne, le gyrophare clignote, le halo pulse, la machine vibre, de la fumée sort, la mèche tourne. Verrouillée : grisée, sans halo, derrière une barrière avec un cadenas.
- **Arbre de prestige** : 104 × 118 px, tronc tordu avec racines, trois boules de feuillage rose et violet qui se balancent, 5 fruits dorés qui scintillent, une étoile ⭐ qui oscille au sommet, une aura rose qui pulse (2,6 s) ; **dorée et plus rapide (0,9 s) quand on peut passer prestige**.
- Le **panneau en bois** au nom du stand devient doré avec un halo quand on est devant ; les dessins s'éclaircissent au survol.
- **Barrière** des stands verrouillés : deux planches horizontales et des piquets, avec 🔒 au milieu.

Pour les z-index de tout le jeu : les fenêtres (`.voile`) sont à 10, la barre de boutons collée en bas (téléphone) à 9, les toasts à 20, la fête du prestige et la révélation d'une recrue à 30. Dans la mine : cabines et tête de foreuse à 2, poulie et joueur sur l'échelle à 3, indicateurs, bandeaux et petits gains à 5, éclats à 6, trouvailles à 7, grosses ventes à 8.

---

## 8. Les sons et la musique

Tout est **fabriqué par le navigateur avec Web Audio** : aucun fichier audio, donc rien à charger ni à créditer. Le navigateur n'autorise le son qu'après une action du joueur : le contexte audio est créé (ou réveillé) au premier clic/toucher ou à la première touche, et la musique démarre à ce moment-là.

### 8.1 Les bruitages (`src/sons.ts`)

Chaque son est un petit mélange de **notes** (un oscillateur dont le volume retombe vite) et de **bruit** (un souffle filtré). Certains varient un peu au hasard (± 8 à 15 %) pour ne pas sonner toujours pareil. Volume général des bruitages : 0,5.

Les sons sont déclenchés en comparant l'état avant/après chaque action (`src/evenements.ts`, `jouerSons` dans `src/usePartie.ts`), sauf indication contraire :

| Son | Quand il joue | Ce qu'on entend |
|---|---|---|
| `coup` | toutes les **0,22 s** pendant qu'on casse un bloc (horloge de `usePartie`) | « tac » : un souffle aigu court et une note grave qui descend |
| `casse` | chaque bloc cassé | « crac » de cailloux ; plus grave pour un bloc dur (dureté ≥ 3) |
| `lave` | en cassant de la lave (en plus de `casse`) | sifflement aigu et une note qui descend |
| `coffre` | en cassant un coffre (en plus de `casse`) | le couvercle, puis 4 pièces |
| `geode` | en cassant une géode (en plus de `casse`) | cristal qui tinte (4 notes) |
| `minerai` | un minerai ordinaire ramassé | « plink » ; si les minerais s'enchaînent (moins de 4 s entre deux), la note **monte d'un cran** sur une gamme pentatonique de 8 notes, avec un écho brillant en haut de la gamme |
| `rare` | lapis, or, émeraude, diamant ou débris ramassé | une pluie d'étincelles qui monte (5 notes et leurs octaves) |
| `nouvelleCouche` | une couche finie | « boum » sourd ; **tous les 10 m**, une petite cloche de 3 notes en plus |
| `vente` | une vente (marché, chariot, ascenseur) | « ka-ching ! » de caisse, puis des pièces : **plus la vente est grosse, plus il y a de pièces** (3 à 12) |
| `achat` | un achat sans amélioration (seau, pioche rachetée…) | « pop » puis deux notes qui montent, et 2 pièces |
| `amelioration` | un niveau de plus (ascenseur, forage, chariot, sac, meilleure pioche, enchantement, pioche d'un mineur, recruteur) — remplace alors `achat` | trois notes qui montent « niveau supérieur ! », une note claire, 2 pièces |
| `ding` | l'ascenseur arrive à destination | « ding-dong » |
| `pas` | un barreau d'échelle tous les 2 m (pas dans la cabine) | petit « toc » de bois |
| `piocheCassee` | la pioche équipée casse | « clang » triste |
| `pieces(3)` | un mineur employé a vendu sa récolte | 3 pièces discrètes |
| `succes` | un succès débloqué | petite fanfare de 4 notes |
| `talent` | un talent choisi dans l'arbre | 5 notes qui montent et une note aiguë qui reste |
| `prestige` | au moment de passer prestige (`usePartie.passerPrestige`) | grande fanfare de 4 accords |
| `suspenseRecrue` | début de la révélation d'une recrue (`RevelationRecrue.tsx`) | roulement de tambour qui accélère et monte (18 coups, ~1,6 s) |
| `revelationRecrue(rang)` | la rareté dévoilée | fanfare **plus grande selon la rareté** : 2 notes (commun) à 6 notes (mythique) ; dès rare : des pièces ; dès épique : un accord tenu ; légendaire et mythique : un accord éclatant et une pluie d'étincelles ; mythique : en plus un souffle brillant et une nappe grave |

### 8.2 L'ambiance (`src/ambiance.ts`)

Construite une seule fois, au premier clic, et qui tourne en continu. Tout passe par un volume général (0,7) qui monte en douceur au démarrage.

**La musique** (volume 0,13, un peu plus bas dans la mine) :
- tempo **62 battements/min**, mesures de 4 temps (~3,9 s) ;
- 4 accords doux, deux mesures chacun : **la mineur, fa majeur, do majeur, sol majeur** ;
- une **nappe** (les notes de l'accord en triangle, attaque lente de 1,2 s), une **basse** sur le premier temps ;
- 1 à 3 notes de **mélodie** au hasard sur la gamme pentatonique de la mineur (la, do, ré, mi, sol, la), sur un temps ou un demi-temps ; une mesure sur quatre reste calme ;
- une réverbération (écho de salle de 3,5 s) donne un halo.

**À la surface** (seulement au village ; s'éteint en ~0,4 s en entrant dans la mine, revient en ~1,2 s) :
- le **vent** : un souffle filtré qui forcit et faiblit lentement ;
- des **oiseaux** toutes les 1,5 à 5 s : 2 à 5 petits gazouillis aigus (2 600 à 4 400 Hz) qui glissent, placés au hasard à gauche ou à droite.

**Dans la mine** (une grotte qui résonne, **plus forte en descendant** : volume de 0,55 à 1 et écho de 0,5 à 1 selon la position entre la surface et la bedrock) :
- un **grondement** très grave et deux notes à 55 et 55,7 Hz qui bourdonnent ensemble ;
- des **gouttes d'eau** toutes les 0,6 à 2,4 s : « plic » (la note monte très vite), parfois (35 %) un « plic-ploc » ; un **écho qui se répète** (retard de 0,38 s, qui revient de plus en plus faible et étouffé) ;
- des **petits cailloux qui roulent** au loin toutes les 14 à 35 s (4 à 8 rebonds de plus en plus faibles et rapprochés) ;
- une **longue résonance** grave toutes les 12 à 30 s (5 s, comme la montagne qui travaille).

L'interface appelle `reglerLieu(auVillage, profondeur)` à chaque changement d'endroit (`App.tsx`, profondeur arrondie au 1/50). Quand l'onglet est caché, tout le son est mis en pause (batterie) et reprend au retour.

---

## 9. Les boutons 🔊 et 🎵

Dans la case de droite du bandeau (`Hud.tsx`) :

| Bouton | Coupe | Affichage | Réglage gardé |
|---|---|---|---|
| **🔊 / 🔇** | les **bruitages** (`sons.ts`) | 🔊 actif, 🔇 coupé | `localStorage` `idle-miner-son` = `actif` / `coupe` |
| **🎵** | la **musique et les ambiances** (`ambiance.ts`) | barré et à moitié transparent quand c'est coupé | `localStorage` `idle-miner-musique` = `actif` / `coupe` |

Les deux sont actifs par défaut et indépendants. Couper la musique la fait baisser en douceur (0,3 s) ; la remettre la relance (et la construit si elle n'existait pas encore). Les bulles : « Couper le son » / « Remettre le son », « Couper la musique et les ambiances » / « Remettre la musique et les ambiances ».

---

## 10. L'application installable (PWA)

### 10.1 Le manifeste (`public/manifest.webmanifest`)

| Champ | Valeur |
|---|---|
| `name` / `short_name` | Mega Digger |
| `description` | « Creuse, vends tes minerais et descends jusqu'à la bedrock. » |
| `lang` | fr |
| `start_url` / `scope` | `/` |
| `display` | `standalone` (plein écran, sans barre du navigateur) |
| `orientation` | `portrait` |
| `background_color` / `theme_color` | `#15151a` |
| `categories` | games |
| `icons` | `icone-192.png` (192 px), `icone-512.png` (512 px), `icone-maskable-512.png` (512 px, « maskable » pour Android) |

`index.html` ajoute : `theme-color` `#15151a`, `apple-touch-icon` (`/icones/apple-touch-icon.png`), les balises « web app capable » pour iPhone et Android, la barre d'état iPhone `black-translucent`, le titre « Mega Digger », et `viewport-fit=cover` (le jeu va sous l'encoche, avec des marges `env(safe-area-inset-*)`).

### 10.2 Les icônes (`public/icones/`, `public/favicon.svg`)

Toutes ont le même dessin : sur un fond carré arrondi gris-bleu très sombre (`#2e2e3c → #15151a`), un **bloc de terre avec de l'herbe en haut** (pixels verts et bruns) et des **pixels de diamant turquoise**, et une **pioche au fer doré** posée en travers. `favicon.svg` est la version vectorielle (512 × 512) ; `apple-touch-icon.png`, `icone-192.png`, `icone-512.png` et `icone-maskable-512.png` sont les versions PNG.

### 10.3 Le service worker (`public/sw.js`)

Enregistré **seulement en production** (`enregistrerServiceWorker` dans `src/installation.ts`, appelé par `main.tsx` ; en développement le cache gênerait), au chargement de la page, avec `updateViaCache: 'none'`. S'il échoue (navigation privée…), le jeu marche quand même, sans hors ligne.

- Cache **`idle-miner-v1`**. À l'installation, il range `/`, `/manifest.webmanifest`, `/favicon.svg`, `/icones/icone-192.png`, `/icones/icone-512.png`, et prend la main tout de suite (`skipWaiting`, `clients.claim`). À l'activation, il efface les caches d'un autre nom (changer `CACHE` vide le cache de tous les joueurs).
- Seules les requêtes **GET de notre propre site** passent par lui (Supabase n'est jamais mis en cache).

| Requête | Stratégie |
|---|---|
| La page (navigation) | **réseau d'abord** (pour avoir la dernière version) ; la réponse est gardée comme `/` ; sans réseau, la page du cache. À chaque nouvelle page, les fichiers de `/assets/` qu'elle n'utilise plus sont retirés du cache |
| `/assets/*` (noms qui changent à chaque version) | **cache d'abord**, sinon réseau puis mise en cache |
| Le reste (icônes, manifeste…) | **cache d'abord, puis mise à jour** en arrière-plan |

Résultat : **le jeu marche hors ligne** (sans compte en ligne ni classement).

### 10.4 Proposer l'installation (`src/installation.ts`)

- **Android / Chrome / Edge** : le navigateur envoie l'invitation `beforeinstallprompt` ; le jeu la garde (sans bandeau automatique) pour l'ouvrir quand le joueur clique sur **Installer** ; une invitation ne sert qu'une fois. L'événement `appinstalled` la retire.
- **iPhone / iPad** (y compris les iPad qui se présentent comme un Mac tactile) : pas d'invitation possible, la carte explique le bouton Partager.
- **Déjà installé** (`display-mode: standalone`, ou `navigator.standalone` sur iPhone) : rien n'est proposé.
- Le hook `useInstallation()` renvoie le mode (`installe`, `bouton`, `ios`, `rien`) et `installer()` ; la carte de l'accueil est décrite dans [interface.md § 2.5](interface.md#25-la-carte--installer--carteinstallationtsx).
