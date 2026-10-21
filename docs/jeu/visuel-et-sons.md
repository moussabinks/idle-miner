# Le visuel et les sons de Mega Digger

> Le style graphique, les animations, le décor, les bruitages, la musique et l'application installable (PWA).
> Écrit d'après le code au 22/10, après la refonte de la **mine automatique** (plus de vue de la mine en coupe) : `src/index.css`, `src/blocs.css`, `src/effets.css`, `src/personnel.css`, `src/accueil.css`, `src/village.css`, `src/composants/*.tsx` (dont `iso.ts`, `DessinsVillage.tsx`, `VueVillage.tsx`, `PanneauMine.tsx`, `sprites.ts`, `SceneAccueil.tsx`), `src/sons.ts`, `src/ambiance.ts`, `src/installation.ts`, `public/` (dont `public/images/`). Les règles du village sont dans [village.md](village.md). Ce que fait chaque bouton est dans [interface.md](interface.md).

## Sommaire

1. [Le style général](#1-le-style-général)
2. [Les blocs (`blocs.css`)](#2-les-blocs-blocscss)
3. [Le bloc à cliquer de la mine](#3-le-bloc-à-cliquer-de-la-mine-villagecss)
4. [Les personnages : des hamsters](#4-les-personnages--des-hamsters)
5. [Les animations et effets](#5-les-animations-et-effets)
6. [L'écran d'accueil (`accueil.css`)](#6-lécran-daccueil-accueilcss)
7. [Le décor du village (vue du ciel)](#7-le-décor-du-village-vue-du-ciel)
8. [Les sons et la musique](#8-les-sons-et-la-musique)
9. [Les boutons 🔊 et 🎵](#9-les-boutons--et-)
10. [L'application installable (PWA)](#10-lapplication-installable-pwa)

---

## 1. Le style général

- **Tout se passe au village vu du ciel**, qui utilise de vraies images (décidé le 20/10) :
  - **les arbres de la forêt** : `public/images/village/arbres/`, les 12 arbres dessinés par l'équipe, upscalés par IA et détourés ;
  - les **bâtiments** : `public/images/batiments/*.webp` (marché, forgeron, bazar, Personnel, foreuse, générateur, et l'image des rails pour le menu), des dessins en vue isométrique au fond transparent, chacun posé sur une dalle de 5 × 5 pavés, et la **mine** (`mine.webp`, avec ses calques `mine-cabine.webp` et `mine-devant.webp`), calée sur 10 × 10 cases. Chacun est **calé sur la grille** par une matrice CSS, sans déformation (`CALAGES`, `transformationSprite` dans `iso.ts`) ; une ombre douce au sol (`ombre-batiment`) l'ancre sur l'herbe. Les dessins de l'enchanteur et de l'arbre de prestige restent dans le dossier, mais ne servent plus ;
  - les **portraits** du mineur, du manager et du recruteur : `public/images/personnages/*.webp` (sur l'accueil et dans le panneau du Personnel) ;
  - **les personnages** : `public/images/personnages/sprites/*.webp`, découpés dans les planches de l'équipe (voir [§ 4](#4-les-personnages--des-hamsters)).
- Tout le reste du village est **dessiné en SVG dans le même style** (bois, pierre grise, coins dorés, lanternes) : la cabine et le panneau de la mine, les rails, le **wagonnet**, le **rayon du générateur**, les chemins de pavés, les décorations (`DessinsVillage.tsx`, `VueVillage.tsx`), la plage.
- **En CSS** : les **blocs** (le gros bloc à cliquer, et les petits blocs des jauges, du chariot et des statistiques), les éclats, les minerais qui s'envolent, les ventes, les bulles. Les autres icônes sont des **émojis** (choix du 19/10 : style cartoon, « pas de pixel art, pour ne pas ressembler à Minecraft »).
- **Style cartoon** : formes rondes, cailloux irréguliers, panneaux en bois arrondis, contours sombres.
- **Thème sombre** (`color-scheme: dark`). Les couleurs de base (`:root` de `index.css`) :

| Variable | Couleur | Usage |
|---|---|---|
| `--fond` | `#15151a` | fond de la page |
| `--texte` | `#ece9e4` | texte |
| `--texte-doux` | `#a9a5a0` | texte secondaire (`.discret`) |
| `--accent` | `#f2b33d` | or : titres, argent, sélection, focus |
| `--carte` / `--carte-claire` | `#23232b` / `#2e2e38` | cartes et lignes |
| `--bordure` | `#3a3a46` | bordures |
| `--vert` / `--rouge` / `--violet` | `#5cc95c` / `#e5534b` / `#a77be8` | ce qu'on a (`.ok`) / ce qui manque (`.manque`) / divers |

- **Polices** : `system-ui` pour le jeu ; **Luckiest Guy** (Google Fonts, toujours en MAJUSCULES) pour le logo, les titres de l'accueil et le gros bouton Jouer. Hors ligne : Arial Black.
- **Le bois et l'or** : les menus Bâtiments et Décorations, les panneaux des bâtiments et tout l'accueil reprennent les couleurs des images (bois `#8a5a2b`, `#4a2c12`, `#3a2210`, filets et clous dorés `#c8962e`, texte doré `#ffe19a`).
- Les chiffres qui changent (argent, compteurs, étiquettes) utilisent `tabular-nums` pour ne pas trembler.
- **Mouvements réduits** : quand le système demande `prefers-reduced-motion: reduce`, presque toutes les animations sont coupées ; le compteur d'argent saute directement à sa valeur.
- Les couleurs des boutons par sorte d'action : voir [interface.md § 14](interface.md#14-les-couleurs-des-boutons).

---

## 2. Les blocs (`blocs.css`)

Chaque bloc est un **galet arrondi** (`border-radius` irrégulier), avec du relief : reflet blanc en haut, ombre en bas. Les minerais sont une **roche** de pierre grise (`.roche-pierre`) avec des **taches de couleur** (`--minerai`) et deux petits éclats blancs qui brillent.

| Bloc | Dessin |
|---|---|
| Pierre | gris `#858585 → #6f6f6f`, taches plus claires et plus foncées |
| Charbon | taches noires |
| Fer | taches beige rosé |
| Redstone | taches rouges |
| Or | taches jaunes |
| Émeraude | taches vertes `#17b84a`, **scintille** (2,4 s) |
| Diamant | taches turquoise `#3fe0d0`, **scintille** |

- **`.mini-bloc`** : un petit galet de 18 à 22 px utilisé dans les jauges, le chariot de la foreuse et les statistiques.
- `blocs.css` garde encore les dessins des blocs retirés le 22/10 (terre, gravier, deepslate, lapis, débris, améthyste, obsidienne, lave, coffre, géode, bedrock) et les animations de l'ancien minage (`tremble`, `fissure`) : ils ne servent plus.

---

## 3. Le bloc à cliquer de la mine (`village.css`)

Le haut du panneau de la mine (`BlocACliquer` dans `PanneauMine.tsx`) :

- **Le cadre** : une zone sombre comme une galerie (dégradé radial brun `#3d2c1c → #1d140c`, ombre intérieure), avec le bloc à gauche et le texte à droite (« 👆 Clique : ⚫ Charbon », la chance de doubler).
- **Le bloc** : un gros galet de **108 px** (le dessin des blocs ci-dessus). Chaque nouveau bloc « **pousse** » à sa place (il grandit de 60 % à 100 %, 0,18 s, `bloc-pousse`). Au clic, il **s'enfonce** un peu (92 %).
- **Pioche cassée** : après le premier clic, le bloc est **fissuré** (deux traits noirs en travers, `.bloc-fissure`).
- **Coffre plein** : le bloc est **grisé** et assombri, et le curseur dit qu'on ne peut pas cliquer.
- **Les éclats** (`.eclats-bloc-mine`) : 5 petits cailloux de la couleur du bloc qui volent de tous les côtés en tournant puis retombent (0,55 s, `eclat-saute`). Au plus 5 séries à la fois.
- **Ce qui tombe** (`.trouvaille-bloc-mine`) : une pastille « +1 ⚫ » qui monte au-dessus du bloc et s'efface (1,5 s, `trouvaille`). Doublé : « +2 💎 ×2 ! », **en doré**, plus grande, bordée et éclairée d'or (`.trouvaille-double`). Au plus 4 à la fois.

---

## 4. Les personnages : des hamsters

Tous les personnages sont des **hamsters** : des **images** tirées des planches de chaque personnage fournies par l'équipe (vues DEVANT, DERRIÈRE, GAUCHE, DROITE), découpées en une image par vue, détourées (`public/images/personnages/sprites/`, 26 images). On montre la vue qui va avec le sens de la marche, ce qui donne l'impression d'un personnage en volume. Le calage (taille de chaque image, point entre ses deux pieds) est dans `src/composants/sprites.ts` : `spritePerso(qui, vue)` donne l'image, `ECHELLE_SPRITE` = 46 / 370.

| Qui | Images |
|---|---|
| **Le joueur** | il n'a **pas encore de planche à lui** : il prend celle du mineur, avec le **casque jaune** d'origine (`joueur_devant`, `_derriere`, `_gauche`, `_droite`) |
| **Un mineur employé** | la même planche, le **casque recoloré à la couleur de sa rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique) : `mineur_<rareté>_<vue>` |
| **Le manager** | seulement sa vue de face (`manager_devant`) : il reste à son poste |
| **Le recruteur** | seulement sa vue de face (`recruteur_devant`) |

**Les tenues du Bazar** (chapeaux, hauts) **ne se voient pas sur le personnage** : seul l'aperçu du panneau des tenues (`PanneauTenues.tsx`) les montre, avec l'ancien hamster en SVG (`Hamster.tsx`). Il faudra une planche du joueur de l'équipe.

### 4.1 Au village : `Perso` (`ElementsVillage.tsx`)

- `Perso` reçoit `qui` (joueur, rareté du mineur, manager ou recruteur) et choisit l'image selon le sens de la marche (`choisirVue`) : vers la **droite** de l'écran → vue « droite » ; vers la **gauche** → « gauche » ; il **s'éloigne** → « derrière » (en miroir s'il part vers la gauche) ; **à l'arrêt** → « devant ».
- L'image est posée **les pieds sur son point de la grille**, avec une ombre ovale douce (dégradé), un fin contour sombre et une ombre portée : il se détache bien de l'herbe.
- **Le joueur** (23/10) a en plus un **liseré de lumière chaude** et un **anneau doré** en pointillés sous les pieds qui brille doucement (comme le héros de Clash of Clans). Quand on touche la carte, un **repère doré** (deux anneaux qui se resserrent) marque l'endroit où il va.
- **En marchant** : un pas toutes les 0,34 s ; à chaque pas il **s'écrase** en touchant le sol et **s'étire** en remontant (comme un dessin animé), en se dandinant ; il **penche** de 4° vers où il va, et de **petits nuages de poussière** partent en arrière de ses pieds. **Au repos**, il respire doucement (2,4 s).
- **Saut** (barre d'espace) : il s'écrase, monte de 26 px en s'étirant, retombe et s'écrase encore (0,5 s) ; son ombre rétrécit et pâlit pendant qu'il est en l'air.
- **Pas payé** : il tape du pied (0,4 s) sous une bulle 😠 qui saute.
- **Pousseur** : le joueur (ou un mineur pousseur) est dessiné **juste derrière le wagonnet**, à 0,9 case, tourné dans le sens où il roule, et marche avec lui.
- Une étiquette porte le prénom des mineurs (bord de la couleur de leur rareté), ou « Manager » / « Recruteur » en doré.

Le composant `Personnage.tsx` (le personnage de l'ancienne vue en coupe) est toujours dans le dossier mais ne sert plus.

**La marche du joueur** (`useJoueurVillage.ts`, 23/10) : il prend de l'**élan** au départ (30 cases/s²) et **freine** en arrivant, au lieu de démarrer et de s'arrêter d'un coup. Quand on touche la carte, son chemin (calculé case par case) est **lissé** : il va en ligne droite jusqu'au point le plus loin qu'il voit sans toucher un bâtiment, au lieu de faire des escaliers. Il ne change d'image (devant, derrière, gauche, droite) que si le mouvement va nettement d'un côté : plus de « clignotement » dans les virages.

---

## 5. Les animations et effets

### 5.1 L'argent (`effets.css`, `Gains.tsx`)

| Effet | Quand | Description |
|---|---|---|
| **Grosse vente** | chaque vente du joueur (marché, chariot de la foreuse) | « +*X* $ » en grosses lettres jaunes contournées de brun, au milieu en haut : apparaît en grossissant, se pose, monte et s'efface (1,8 s), avec une **gerbe de 12 pièces** dorées |
| **Petit gain** | argent qui n'est pas une vente du joueur (le wagonnet qui vend au marché) | « +*X* $ » doré qui monte et s'efface (1,2 s), en haut au milieu de l'écran (`.gains-village`) |
| **Compteur qui défile** | toute variation d'au moins 5 $ | l'argent du bandeau défile jusqu'à la nouvelle somme en 0,6 s |
| **Compteur qui saute** | chaque vente | grossit à 130 % en virant au jaune lumineux (0,5 s) |

### 5.2 Les alertes et repères

| Effet | Description |
|---|---|
| Coffre ou sac plein | la case Mine ou Sac du bandeau a une bordure rouge, tremble et s'entoure d'un halo rouge (en boucle) |
| Prochain objectif prêt | bordure verte, halo vert qui pulse (1,6 s) |
| Bulles de notification du village | sautent de 6 px en grossissant un peu (0,9 s), couleur selon la sorte (voir [§ 7.4](#74-les-bulles-de-notification)) |
| Pastille du bouton 🏗️ Bâtiments, ruban « Nouveau ! » du menu | sautent (0,8 s) |
| Bâtiment actif | lueur dorée autour du dessin, losange de son emprise en tirets dorés qui défilent (1 s) |
| La foreuse qui tourne | le bâtiment vibre (0,16 s) |
| Mineur pas payé | tape du pied, bulle 😠 qui saute |
| Carreaux de niveau | le dernier carré acheté fait un « pop » (0,45 s) |
| Toast | apparaît avec un rebond (0,35 s) |

### 5.3 Les grands moments (`personnel.css`)

- **Révélation d'une recrue** (`RevelationRecrue.tsx`) : pendant 1,6 s, le fond change de couleur toutes les 0,08 s (les 5 raretés) et la carte tremble en grossissant ; puis elle **se retourne en 3D** (0,55 s), rayons de la couleur de la rareté, confettis (24 + 18 × rang), **flash** plein écran pour légendaire et mythique, halo qui pulse, bouton arc-en-ciel avec un reflet qui passe.
- L'écran de victoire, la fête du prestige et l'arbre de prestige n'existent plus (archivés dans `archives/prestige/`) ; quelques-unes de leurs animations restent dans `effets.css` sans servir.

---

## 6. L'écran d'accueil (`accueil.css`)

Dans la même direction artistique que le village (bois, or, lanternes) :

- **Le fond de la page** : un dégradé brun très sombre avec une lueur verte en haut, fixe. L'accueil a son propre empilement (`isolation: isolate`) pour que ce fond passe devant celui de la page.
- **Le bandeau « héros »** : un cadre en bois sombre (`#4a2c12`, 5 px) avec un filet doré à l'intérieur, coins de 22 px. Dedans, **un petit village vivant** (`SceneAccueil.tsx`) dessiné exactement comme dans le jeu (mêmes images, mêmes dessins SVG, mêmes personnages) :
  - la mine, les bâtiments (générateur compris ; le marché et le forgeron retournés), 26 décorations (fontaine, statue, cerisiers, sapins, arbres, lanternes, tonneau, caisse, banc, rocher, buissons, fleurs), un bout de rails avec un virage et des chemins de pavés ;
  - 4 mineurs (légendaire, épique, rare, mythique) qui font des **allers-retours** entre la mine et le marché, la forge ou le Personnel (2,2 cases/s, une pause de 1,2 s à chaque bout, un sac de minerais sur le dos vers le marché), un **wagonnet** qui fait la navette sur les rails, le joueur immobile devant la mine, le manager et le recruteur devant le Personnel ;
  - tout est posé dans la moitié droite de la clairière ; le cadrage remplit la boîte comme une photo recadrée : sur un écran large, le village entier tient dans la moitié droite ; sur une boîte étroite (téléphone), on voit le milieu de la mine, un peu plus gros, dans le haut ;
  - animé à chaque image (`requestAnimationFrame`) ; ce qui ne bouge pas n'est dessiné qu'une fois ; avec « mouvements réduits », la scène reste figée ;
  - un **voile** brun sombre à gauche (de 92 % à transparent) pour lire le texte, et une ombre en bas. Sur téléphone, le voile part du bas de la scène et devient le fond brun du texte.
- **Le logo** : « MEGA » et « DIGGER » en lettres dorées dégradées (crème → or → orange), contour brun épais, ombre portée, et un **reflet blanc** qui passe dessus (3,5 s), cloués sur un **panneau en bois** (planches horizontales `#8c5a2c`, bordure `#3a2210`, 4 **clous dorés** dans les coins, ombre, penché de -2°). À côté, le **hamster du joueur** (depuis le 21/10, son image vue de droite, `joueur_droite.webp`), qui donne de temps en temps un petit coup (il se penche et saute, 2,6 s).
- **L'accroche** en Luckiest Guy blanc, « Deviens riche. » en doré lumineux.
- **Le gros bouton Jouer** : doré, gros relief brun en dessous, halo, reflet qui passe (3 s) et **respire** (grossit de 3 %, 2 s) ; se soulève au survol et s'enfonce au clic. **« Mes mondes »** est un bouton en bois.
- **Les 4 cartes « Comment jouer »** : en bois sombre avec un filet doré, une lueur de leur couleur en haut, un **numéro dans une pièce dorée** en haut à gauche, une image (portrait rond à bord doré du mineur et du recruteur, ou le dessin détouré du forgeron et du générateur), le titre dans leur couleur ; elles se soulèvent au survol.
- **Toutes les cartes** (compte, mondes, classement, installer) : bois sombre (`#36220f → #22150a`), bordure `#4a2c12`, filet doré ; les champs de texte en bois foncé (`#1c1108`).
- **Les cartes des mondes** : un liseré épais et une lueur de la couleur du monde, se soulèvent au survol. La carte « Nouveau monde » est en pointillés. Une partie d'une ancienne version a un cadre doré en pointillés qui prévient qu'elle repart de zéro.
- **Le classement** : la ligne du joueur connecté est entourée d'or.

---

## 7. Le décor du village (vue du ciel)

Le village est une carte **isométrique** (vue du ciel à 45°, comme Clash of Clans / Hay Day).

### 7.1 La projection (`iso.ts`)

- Le monde est mesuré en pixels : la clairière y est un **losange** dont le coin du haut (la case 0, 0) est en (1 131 ; 57), et la grille fait **60 × 60 cases**. Le monde fait **2 262 × 1 407 px** (`LARGEUR_MONDE`, `HAUTEUR_MONDE`). La caméra ne sort jamais de `LIMITES_CAMERA` ; le terrain dessiné va plus loin (`LIMITES_TERRAIN`).
- Une case fait **33 × 19 px** à l'écran (`DEMI_LARGEUR` 16,5, `DEMI_HAUTEUR` 9,57). Une position (x, y) donne le point `(1 131 + (x − y) × 16,5 ; 57,2 + (x + y) × 9,57)` (`versEcran`), et l'inverse (`versGrille`) sert à savoir quelle case on touche.
- **Ordre d'affichage** : plus un objet est bas sur l'écran, plus il passe devant. Son `z-index` est `(x + y) × 100` au centre de son emprise (`profondeur`) ; un personnage +5, le wagonnet +4, ce qu'on pose 99 999.
- La caméra (`VueVillage.tsx`) déplace et agrandit tout le monde d'un coup (`translate` + `scale`), en douceur quand elle suit le joueur (ou le wagonnet qu'il pousse).

### 7.2 Les calques, du fond vers l'avant

| Ordre | Calque | Contenu |
|---|---|---|
| 1 | **Terrain** (`TerrainVillage`, un SVG dessiné une seule fois) | le sous-bois sombre, une auréole d'herbe floue, le **damier** (`#86c13f` / `#79b437`) dont le bord s'efface dans l'herbe, de grandes **taches** d'herbe plus claire ou plus sombre, très floues (23/10, `TachesHerbe`), et les petits détails de l'herbe : touffes, brins, fleurs, trèfles, cailloux et champignons rouges à pois blancs |
| 1 bis | **Forêt derrière** (tuiles de canvas) et **plage** | les arbres du haut et des côtés ; le sable et la mer |
| 2 | **Sol** (`sol-village`, un SVG de la taille du monde) | les ombres des bâtiments, les chemins de pavés, les rails, le losange en tirets dorés du bâtiment actif, le **rayon du générateur**, le losange vert ou rouge de ce qu'on pose |
| 3 | **Objets** | bâtiments, mine (et sa cabine), décorations, personnages, wagonnet, triés par profondeur |
| 3 bis | **Forêt devant** (`z-index` 90 000) | les arbres du bas de la carte, devant tout le reste |
| 3 ter | **La vie du village** (`AmbianceVillage.tsx`, `z-index` 99 990, 23/10) | des **papillons** de couleur qui font des boucles en battant des ailes, des **vols d'oiseaux** qui traversent le ciel avec leur ombre sur l'herbe, et l'**ombre des nuages** qui glisse lentement sur la carte. Tout en CSS, aux mêmes places à chaque fois (hasard à graine fixe) |
| 4 | **Bulles** (`z-index` 100 000) | les bulles de notification, toujours devant tout |

### 7.3 Les dessins

- **Les bâtiments** : les images calées sur la grille, avec une ombre portée douce. **Retournés** (bouton ↔), l'image est d'abord mise en miroir puis calée de la même façon. Survolés ou actifs : une **lueur dorée**. La **foreuse vibre** quand elle tourne, le **générateur brille** quand il donne du courant (`.sprite-electrique`). Ce qu'on pose (le fantôme) est un peu transparent et pulse ; il **rougit** quand la place est prise.
- **La mine** : l'image fournie (`mine.webp`), et par-dessus ce qui **évolue** (`DessinEvolutionMine`, en SVG, placé à partir de points de l'image, `POINTS_MINE`, miroir compris) :
  - **la cabine de l'ascenseur** (`mine-cabine.webp`, tirée du dessin « mine avec ascenseur »), dès qu'il est construit, pendue à **deux câbles** (gris en pointillés sur un trait sombre) qui partent du treuil. Elle **suit le premier mineur qui monte ou descend** (`hauteurCabine` : 0 = en haut, 1 = en bas, selon l'avancée de son trajet) et attend en haut le reste du temps. En bas, elle passe derrière la barrière et le sol de devant (`mine-devant.webp`, dessiné par-dessus). Sans ascenseur, les câbles pendent au fond du puits ;
  - **un panneau en bois** planté sur le sol de devant, à gauche, avec « Niv. *N* ».
- **Les rails** (`CaseRail`) : du ballast gris, des traverses en bois, deux rails en acier. Chaque case **se raccorde toute seule** à ses voisines (et à la mine ou au marché collés à elle) : une ligne droite, ou un **virage** en quart de cercle.
- **Le wagonnet** (`DessinWagonnet`) : une petite benne grise au bord doré sur deux roues, avec son ombre. **À l'aller**, il est **plein** (trois minerais qui dépassent : turquoise, jaune, rouge) ; au retour et au quai, vide. Il glisse le long de la ligne selon sa distance (`distanceDepuisLaMine`), à chaque image quand c'est le joueur qui pousse. **Électrique**, il a une **lueur jaune** (`.wagonnet-electrique`). Son pousseur (le joueur ou un mineur) marche derrière lui.
- **Le rayon du générateur** (`RayonGenerateur`) : un cercle de *R* cases autour du centre du générateur, dessiné comme un polygone de 64 points projeté sur la grille (une ellipse à l'écran). **Pointillés jaunes** (`rgb(255 214 60)`) avec un fond jaune très léger. Quand on est devant le générateur ou qu'on le pose : plus épais, plus visible, et les **pointillés tournent** (`rayon-tourne`, 1,6 s). Sans courant : **gris**. Caché s'il ne donne pas de courant et qu'on ne le regarde pas.
- **Les chemins** (`CaseChemin`) : des pavés gris clair sur de la terre beige.
- **Les décorations** (`DessinDecoration`) : fleurs, buisson, rocher, tonneau, caisse de minerais, lanterne (qui vacille), banc, grand arbre, sapin, cerisier en fleurs, fontaine (son jet pulse), statue du hamster d'or.
- **Les personnages** : voir [§ 4.1](#41-au-village--perso-elementsvillagetsx).

### 7.4 Les bulles de notification

Refaites le 23/10 : une **médaille ronde** à bord blanc (l'icône de la plus urgente), collée à un ruban avec **deux mots** (« Plein ! », « Achetable »…), une petite pointe dessous, et un badge « +*n* » s'il y a d'autres choses à faire. Elle apparaît avec un rebond (`bulle-arrive`), **sautille** (0,9 s), et un **reflet** passe sur la médaille toutes les 2,6 s. Sa couleur dit la sorte : **rouge** (alerte, avec un **anneau** qui s'élargit comme un radar), **rose** (prêt : du coffre à porter au marché), **bleu** (nouveauté), **vert** (amélioration achetable, avec des **étincelles** dorées). Au survol, elle grossit. La liste est dans [interface.md § 6](interface.md#6-la-carte-du-village-vuevillagetsx).

Pour les z-index de tout le jeu : les fenêtres (`.voile`) sont à 10, le panneau d'un bâtiment sur téléphone à 8, les toasts à 20, la révélation d'une recrue à 30.

---

## 8. Les sons et la musique

Tout est **fabriqué par le navigateur avec Web Audio** : aucun fichier audio, donc rien à charger ni à créditer. Le navigateur n'autorise le son qu'après une action du joueur : le contexte audio est créé (ou réveillé) au premier clic/toucher ou à la première touche, et la musique démarre à ce moment-là.

### 8.1 Les bruitages (`src/sons.ts`)

Chaque son est un petit mélange de **notes** (un oscillateur dont le volume retombe vite) et de **bruit** (un souffle filtré). Certains varient un peu au hasard pour ne pas sonner toujours pareil. Volume général des bruitages : 0,5.

Les sons sont déclenchés en comparant l'état avant/après chaque action (`src/evenements.ts`, `jouerSons` dans `src/usePartie.ts`), sauf indication contraire :

| Son | Quand il joue | Ce qu'on entend |
|---|---|---|
| `coup` | à **chaque clic** sur le bloc de la mine (`cliquer` dans `usePartie`) | « tac » : un souffle aigu court et une note grave qui descend |
| `casse` | le bloc casse | « crac » de cailloux ; plus grave pour un bloc dur (tout sauf la pierre) |
| `minerai` | un minerai ordinaire (charbon, fer, redstone) cassé | « plink » ; si les minerais s'enchaînent (moins de 4 s entre deux), la note **monte d'un cran** sur une gamme pentatonique |
| `rare` | or, émeraude ou diamant cassé | une pluie d'étincelles qui monte |
| `pieces(2)` | un minerai **doublé** | 2 pièces |
| `vente` | une vente (marché, chariot de la foreuse) | « ka-ching ! » de caisse, puis des pièces : **plus la vente est grosse, plus il y a de pièces** (3 à 12) |
| `pieces(3)` | le wagonnet a vendu au marché | 3 pièces discrètes |
| `achat` | un achat sans amélioration (construction, rachat, réparation, embauche…) | « pop » puis deux notes qui montent, et 2 pièces |
| `amelioration` | un niveau de plus (mine, coffre, ascenseur, forage, chariot, générateur, wagonnet, sac, meilleure pioche, recruteur, pioche d'un mineur) : remplace alors `achat` | trois notes qui montent « niveau supérieur ! » |
| `piocheCassee` | la pioche en main casse | « clang » triste |
| `succes` | un succès débloqué | petite fanfare de 4 notes |
| `suspenseRecrue` | début de la révélation d'une recrue (`RevelationRecrue.tsx`) | roulement de tambour qui accélère et monte (~1,6 s) |
| `revelationRecrue(rang)` | la rareté dévoilée | fanfare **plus grande selon la rareté** : 2 notes (commun) à 6 notes (mythique), pièces, accords, étincelles |

Retirés le 22/10 (avec la mine en coupe, ses blocs spéciaux et le prestige) : `lave`, `coffre`, `geode`, `nouvelleCouche`, `ding` (l'ascenseur), `pas` (l'échelle), `talent` et `prestige`.

### 8.2 L'ambiance (`src/ambiance.ts`)

Construite une seule fois, au premier clic, et qui tourne en continu. Tout passe par un volume général (0,7) qui monte en douceur au démarrage.

**La musique** (volume 0,13) :
- tempo **62 battements/min**, mesures de 4 temps ;
- 4 accords doux, deux mesures chacun : **la mineur, fa majeur, do majeur, sol majeur** ;
- une **nappe** (les notes de l'accord en triangle, attaque lente), une **basse** sur le premier temps ;
- 1 à 3 notes de **mélodie** au hasard sur la gamme pentatonique de la mineur ; une mesure sur quatre reste calme ;
- une réverbération donne un halo.

**Au village** (tout le temps, depuis le 22/10) :
- le **vent** : un souffle filtré qui forcit et faiblit lentement ;
- des **oiseaux** toutes les 1,5 à 5 s : 2 à 5 petits gazouillis aigus qui glissent, placés au hasard à gauche ou à droite.

L'interface appelle `reglerLieu(true, 0)` une fois (`App.tsx`) : on est toujours « à la surface ». L'ambiance de **grotte** (gouttes d'eau avec écho, cailloux qui roulent, grondement) est toujours dans `ambiance.ts`, mais on ne l'entend plus (on ne descend plus dans la mine). Quand l'onglet est caché, tout le son est mis en pause et reprend au retour.

---

## 9. Les boutons 🔊 et 🎵

Dans le menu ⚙️ des boutons du coin (`App.tsx`, depuis le 23/10 : « 🔊 Son : oui / non » et « 🎵 Musique : oui / non ») :

| Bouton | Coupe | Affichage | Réglage gardé |
|---|---|---|---|
| **🔊 / 🔇 Son** | les **bruitages** (`sons.ts`) | « 🔊 Son : oui », « 🔇 Son : non » | `localStorage` `idle-miner-son` = `actif` / `coupe` |
| **🎵 Musique** | la **musique et les ambiances** (`ambiance.ts`) | « 🎵 Musique : oui / non » | `localStorage` `idle-miner-musique` = `actif` / `coupe` |

Les deux sont actifs par défaut et indépendants. Couper la musique la fait baisser en douceur (0,3 s) ; la remettre la relance (et la construit si elle n'existait pas encore).

---

## 10. L'application installable (PWA)

### 10.1 Le manifeste (`public/manifest.webmanifest`)

| Champ | Valeur |
|---|---|
| `name` / `short_name` | Mega Digger |
| `description` | « Creuse, vends tes minerais et descends jusqu'à la bedrock. » (pas encore mis à jour pour la mine automatique) |
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

- Cache **`idle-miner-v8`** (changer ce nom vide le cache de tous les joueurs). À l'installation, il range `/`, `/manifest.webmanifest`, `/favicon.svg`, `/icones/icone-192.png`, `/icones/icone-512.png`, et **les images du village** (`IMAGES_DU_VILLAGE` : les 12 arbres, 9 images de `images/batiments/` (mine, bazar, employes, enchanteur, foreuse, forgeron, marche, prestige, rails), les 3 portraits de `images/personnages/`, les 26 images des personnages de `images/personnages/sprites/`). Attention : `generateur.webp`, `mine-cabine.webp` et `mine-devant.webp` ne sont **pas** dans cette liste : ils ne sont mis en cache qu'après avoir été vus une fois en ligne, et prend la main tout de suite (`skipWaiting`, `clients.claim`). À l'activation, il efface les caches d'un autre nom (changer `CACHE` vide le cache de tous les joueurs).
- Seules les requêtes **GET de notre propre site** passent par lui (Supabase n'est jamais mis en cache).

| Requête | Stratégie |
|---|---|
| La page (navigation) | **réseau d'abord** (pour avoir la dernière version) ; la réponse est gardée comme `/` ; sans réseau, la page du cache. À chaque nouvelle page, les fichiers de `/assets/` qu'elle n'utilise plus sont retirés du cache |
| `/assets/*` (noms qui changent à chaque version) | **cache d'abord**, sinon réseau puis mise en cache |
| Le reste (icônes, manifeste, images du village…) | **cache d'abord, puis mise à jour** en arrière-plan |

Résultat : **le jeu marche hors ligne** (sans compte en ligne ni classement).

### 10.4 Proposer l'installation (`src/installation.ts`)

- **Android / Chrome / Edge** : le navigateur envoie l'invitation `beforeinstallprompt` ; le jeu la garde (sans bandeau automatique) pour l'ouvrir quand le joueur clique sur **Installer** ; une invitation ne sert qu'une fois. L'événement `appinstalled` la retire.
- **iPhone / iPad** (y compris les iPad qui se présentent comme un Mac tactile) : pas d'invitation possible, la carte explique le bouton Partager.
- **Déjà installé** (`display-mode: standalone`, ou `navigator.standalone` sur iPhone) : rien n'est proposé.
- Le hook `useInstallation()` renvoie le mode (`installe`, `bouton`, `ios`, `rien`) et `installer()` ; la carte de l'accueil est décrite dans [interface.md § 2.5](interface.md#25-la-carte--installer--carteinstallationtsx).
