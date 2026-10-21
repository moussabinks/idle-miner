# Le visuel et les sons de Mega Digger

> Le style graphique, les animations, le décor, les bruitages, la musique et l'application installable (PWA).
> Écrit d'après le code au 20/10, après le passage au **village vu du ciel** : `src/index.css`, `src/blocs.css`, `src/effets.css`, `src/personnel.css`, `src/accueil.css`, `src/village.css`, `src/composants/*.tsx` (dont `iso.ts`, `DessinsVillage.tsx`, `sprites.ts`, `SceneAccueil.tsx`), `src/sons.ts`, `src/ambiance.ts`, `src/installation.ts`, `public/` (dont `public/images/`). Les règles du village (grille, construction, rails, décorations) sont dans [village.md](village.md). Ce que fait chaque bouton est dans [interface.md](interface.md) ; les dessins propres à chaque bâtiment sont aussi détaillés dans les fiches [docs/batiments/](../batiments/README.md).

## Sommaire

1. [Le style général](#1-le-style-général)
2. [Les blocs de la mine (`blocs.css`)](#2-les-blocs-de-la-mine-blocscss)
3. [La mine et ses machines](#3-la-mine-et-ses-machines-indexcss)
4. [Les personnages : des hamsters](#4-les-personnages--des-hamsters)
5. [Les animations et effets](#5-les-animations-et-effets)
6. [L'écran d'accueil (`accueil.css`)](#6-lécran-daccueil-accueilcss)
7. [Le décor du village (vue du ciel)](#7-le-décor-du-village-vue-du-ciel)
8. [Les sons et la musique](#8-les-sons-et-la-musique)
9. [Les boutons 🔊 et 🎵](#9-les-boutons--et-)
10. [L'application installable (PWA)](#10-lapplication-installable-pwa)

---

## 1. Le style général

- **La mine en coupe est dessinée en CSS** (dégradés, ombres, `clip-path`, `@keyframes`) : les blocs, l'échelle, l'ascenseur, la foreuse, les effets. Les autres icônes sont des **émojis** (choix du 19/10 : style cartoon, « plus de pixel art, pour ne pas ressembler à Minecraft »).
- **Le village vu du ciel utilise de vraies images** (décidé le 20/10, avec le passage à la vue du ciel) :
  - **les arbres de la forêt** : `public/images/village/arbres/` (21/10), les 12 arbres dessinés par l'équipe, upscalés par IA (×4) et détourés (leur ombre transparente gardée). L'ancien décor `fond.webp` et la tuile de forêt floue ne sont plus utilisés : le sol est dessiné par le jeu et la forêt est faite d'arbres posés un par un (voir § 7) ;
  - les **bâtiments** : `public/images/batiments/*.webp` (marché, forgeron, bazar, enchanteur, arbre de prestige, foreuse, Personnel, générateur, et l'image des rails pour le menu), des dessins en vue isométrique au fond transparent : **les nouveaux dessins de l'équipe du 22/10** (Google Drive), chacun posé sur une dalle de 5 × 5 pavés, détourés du damier vert par un script (environ 1 000 à 1 100 px de large), et la **mine** (`mine.webp`, 2 109 × 1 346 px : depuis le 21/10, l'image upscalée gardée telle quelle, sans la redresser, détourée et rendue plus nette, calée sur 10 × 10 cases sans retrait). Chacun est **calé sur la grille** par une matrice CSS : l'image est agrandie **sans déformation** (21/10) pour que les coins gauche et droit de son pied (mesurés à la main dans `CALAGES`) couvrent exactement la largeur de son emprise de 5 × 5 cases (le pied de la dalle sur le bord de l'emprise, sans retrait), le milieu du pied au milieu de l'emprise (`transformationSprite`, `RETRAIT_BATIMENT` dans `iso.ts`) ; une ombre douce au sol (`ombre-batiment`) l'ancre sur l'herbe ;
  - les **portraits** du mineur, du manager et du recruteur : `public/images/personnages/*.webp` (sur l'accueil et dans le panneau du Personnel) ;
  - **les personnages** (21/10) : `public/images/personnages/sprites/*.webp`, découpés dans les planches de l'équipe (voir [§ 4](#4-les-personnages--des-hamsters)).
- Tout le reste du village est **dessiné en SVG dans le même style** (bois, pierre grise, coins et chapeaux dorés, lanternes) : la mine qui se creuse, les rails, les chemins de pavés, les décorations, le wagonnet et la brouette (`DessinsVillage.tsx`). Les autres SVG : l'icône du Personnel (`Icone.tsx`) et le favicon.
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
- **Le bois et l'or** du village (20/10) : les menus Bâtiments et Décorations, les panneaux des bâtiments et tout l'accueil reprennent les couleurs des images (bois `#8a5a2b`, `#4a2c12`, `#3a2210`, filets et clous dorés `#c8962e`, texte doré `#ffe19a`).
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

## 4. Les personnages : des hamsters

Tous les personnages sont des **hamsters**. Depuis le 21/10, ce sont des **images** (et plus des dessins SVG) : les planches de chaque personnage fournies par l'équipe (vues DEVANT, DERRIÈRE, GAUCHE, DROITE), découpées en une image par vue, détourées (rembg), les bottes nettoyées à la main (`public/images/personnages/sprites/`, 26 images). Ce n'est pas de la vraie 3D (impossible avec ces images) : on montre la vue qui va avec le sens de la marche, ce qui donne l'impression d'un personnage en volume, de trois quarts. Le calage (taille de chaque image, point entre ses deux pieds) est dans `src/composants/sprites.ts` : `spritePerso(qui, vue)` donne l'image, `ECHELLE_SPRITE` = 46 / 370 (un mineur fait environ 46 px du monde de haut, petit à côté des bâtiments).

| Qui | Images |
|---|---|
| **Le joueur** | il n'a **pas encore de planche à lui** : il prend celle du mineur, avec le **casque jaune** d'origine (`joueur_devant`, `_derriere`, `_gauche`, `_droite`) |
| **Un mineur employé** | la même planche, le **casque recoloré à la couleur de sa rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique) : `mineur_<rareté>_<vue>` |
| **Le manager** | seulement sa vue de face (`manager_devant`) : il reste à son poste |
| **Le recruteur** | seulement sa vue de face (`recruteur_devant`) |

**Les tenues du Bazar** (chapeaux, hauts) **ne se voient plus sur le personnage** depuis le 21/10 : seul l'aperçu du panneau des tenues (`PanneauTenues.tsx`) les montre, avec l'ancien hamster en SVG (`Hamster.tsx`, qui ne sert plus qu'à ça). Il faudra une planche du joueur (sans casque, avec ses tenues) de l'équipe. La couleur de la pioche ne se voit pas non plus sur les images.

Couleur du fer des pioches (dans l'interface ; plus dessinée sur les personnages depuis le 21/10) :

| Pioche | Couleur du fer |
|---|---|
| Bois | `#b5834a` |
| Pierre | `#8f8f8f` |
| Fer | `#e6e6e6` |
| Diamant | `#4ee8dc` |
| Netherite | `#6b5568` |

### 4.1 Au village : `Perso` (`ElementsVillage.tsx`)

- `Perso` reçoit `qui` (joueur, rareté du mineur, manager ou recruteur) et choisit l'image selon le sens de la marche (`choisirVue` dans `sprites.ts`) : il vient vers nous en allant vers la **droite** de l'écran → vue « droite » ; vers la **gauche** → vue « gauche » ; il **s'éloigne** → vue « derrière » (retournée en miroir s'il part vers la gauche) ; **à l'arrêt** → vue « devant ».
- L'image est posée **les pieds sur son point de la grille** (le point entre ses pieds, mesuré dans chaque image), avec une petite ombre ovale et un léger contour d'ombre.
- **En marchant**, il se **dandine** (il penche et sautille, `dandine`, 0,34 s) ; **au repos**, il respire doucement (`respire`, 2,4 s).
- **Saut** (barre d'espace) : il s'écrase, monte de 26 px en s'étirant, retombe et s'écrase encore (0,5 s).
- **Pas payé** : il tape du pied (0,4 s) sous une bulle 😠 qui saute.
- Une étiquette de 6,5 px porte le prénom des mineurs (bord de la couleur de leur rareté), ou « Manager » / « Recruteur » en doré.

### 4.2 Dans la mine en coupe : `Personnage.tsx`

Les mêmes images, pour la vue 2D (le mineur employé avec l'image de sa rareté, retrouvée par la couleur de son casque : `quiSelonCasque`) : **de profil** (gauche ou droite) quand il creuse ou marche, **de dos** quand il grimpe à l'échelle, **de face** au repos (dans une cabine d'ascenseur). Il n'y a plus de pioche dessinée à part : c'est tout le personnage qui bascule pour frapper.

| Action | Animation |
|---|---|
| `repos` | immobile |
| `creuse` | il frappe : il bascule de -7° à +9° vers le bloc (`frappe`, `frappe-gauche` s'il est tourné à gauche, 0,32 s en boucle) |
| `marche` | un petit saut (`pas`, 0,25 s) |
| `grimpe` | se balance de gauche à droite (de dos, 0,4 s en boucle) |

Il est retourné (`scaleX(-1)`) quand il va vers la gauche, et a une petite ombre portée pour se voir sur les fonds sombres.

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
| Bulles de notification du village | sautent de 6 px en grossissant un peu (0,9 s), couleur selon la sorte (voir [§ 7.4](#74-les-bulles-de-notification)) |
| Pastille du bouton 🏗️ Bâtiments, ruban « Nouveau ! » du menu | sautent (0,8 s) |
| Bâtiment actif | lueur dorée autour du dessin, losange de son emprise en tirets dorés qui défilent (1 s) |
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

Refait le 20/10 dans la même direction artistique que le village (bois, or, lanternes) :

- **Le fond de la page** : un dégradé brun très sombre avec une lueur verte en haut, fixe. L'accueil a son propre empilement (`isolation: isolate`) pour que ce fond passe devant celui de la page.
- **Le bandeau « héros »** : un cadre en bois sombre (`#4a2c12`, 5 px) avec un filet doré à l'intérieur, coins de 22 px. Dedans, **un petit village vivant** (`SceneAccueil.tsx`) dessiné exactement comme dans le jeu (mêmes images, mêmes dessins SVG, mêmes personnages) :
  - la mine (creusée à mi-hauteur, avec son ascenseur), les 7 bâtiments (le marché et le forgeron retournés), 26 décorations (fontaine, statue, cerisiers, sapins, arbres, lanternes, tonneau, caisse, banc, rocher, buissons, fleurs), un bout de rails avec un virage et des chemins de pavés ;
  - 4 mineurs (légendaire, épique, rare, mythique) qui font des **allers-retours** entre la mine et le marché, la forge ou le Personnel (2,2 cases/s, une pause de 1,2 s à chaque bout, un sac de minerais sur le dos vers le marché), un **wagonnet** qui fait la navette sur les rails, le joueur immobile devant la mine, le manager et le recruteur devant le Personnel ;
  - tout est posé dans la moitié droite de la clairière ; le cadrage remplit la boîte comme une photo recadrée : sur un écran large, le village entier tient dans la moitié droite ; sur une boîte étroite (téléphone), on voit le milieu de la mine, un peu plus gros, dans le haut ;
  - animé à chaque image (`requestAnimationFrame`) ; ce qui ne bouge pas n'est dessiné qu'une fois ; avec « mouvements réduits », la scène reste figée ;
  - un **voile** brun sombre à gauche (de 92 % à transparent) pour lire le texte, et une ombre en bas. Sur téléphone, le voile part du bas de la scène et devient le fond brun du texte.
- **Le logo** : « MEGA » et « DIGGER » en lettres dorées dégradées (crème → or → orange), contour brun épais, ombre portée, et un **reflet blanc** qui passe dessus (3,5 s), cloués sur un **panneau en bois** (planches horizontales `#8c5a2c`, bordure `#3a2210`, 4 **clous dorés** dans les coins, ombre, penché de -2°). À côté, le **hamster du joueur** (depuis le 21/10, son image vue de droite, `joueur_droite.webp`), qui donne de temps en temps un petit coup (il se penche et saute, 2,6 s).
- **L'accroche** en Luckiest Guy blanc, « Deviens riche. » en doré lumineux.
- **Le gros bouton Jouer** : doré, gros relief brun en dessous, halo, reflet qui passe (3 s) et **respire** (grossit de 3 %, 2 s) ; se soulève au survol et s'enfonce au clic. **« Mes mondes »** est un bouton en bois.
- **Les 4 cartes « Comment jouer »** : en bois sombre avec un filet doré, une lueur de leur couleur en haut, un **numéro dans une pièce dorée** en haut à gauche, une image (portrait rond à bord doré du mineur et du recruteur, ou le dessin détouré du forgeron et de l'arbre de prestige), le titre dans leur couleur ; elles se soulèvent au survol.
- **Toutes les cartes** (compte, mondes, classement, installer) : bois sombre (`#36220f → #22150a`), bordure `#4a2c12`, filet doré ; les champs de texte en bois foncé (`#1c1108`).
- **Les cartes des mondes** : un liseré épais et une lueur de la couleur du monde, se soulèvent au survol. La carte « Nouveau monde » est en pointillés. Une partie d'une ancienne version a un cadre doré en pointillés qui prévient qu'elle repart de zéro.
- **Le classement** : la ligne du joueur connecté est entourée d'or.

---

## 7. Le décor du village (vue du ciel)

Refait le 20/10 : le village est une carte **isométrique** (vue du ciel à 45°, comme Clash of Clans / Hay Day), à la place de l'ancienne bande de stands le long d'un chemin.

### 7.1 La projection (`iso.ts`)

- Le monde est mesuré en pixels : la clairière y est un **losange** dont le coin du haut (la case 0, 0) est en (1 131 ; 57), et la grille fait **60 × 60 cases** (40 × 40 avant le 21/10). Le monde fait **2 262 × 1 407 px** (`LARGEUR_MONDE`, `HAUTEUR_MONDE`). La caméra ne sort jamais de `LIMITES_CAMERA` (la clairière et une bande de forêt) ; le terrain dessiné va bien plus loin (`LIMITES_TERRAIN`).
- Une case fait **33 × 19 px** à l'écran (demi-largeur 16,5 px, demi-hauteur 9,57 px : les constantes `DEMI_LARGEUR` et `DEMI_HAUTEUR`, qui ne dépendent plus de la taille de la grille). Une position de la grille (x, y) donne le point `(1 131 + (x − y) × 16,5 ; 57,2 + (x + y) × 9,57)` (`versEcran`), et l'inverse (`versGrille`) sert à savoir quelle case on touche.
- **Ordre d'affichage** : plus un objet est bas sur l'écran (plus près de nous), plus il passe devant. Son `z-index` est `(x + y) × 100` au centre de son emprise (`profondeur`) ; un personnage +5, un wagonnet +4, ce qu'on pose 99 999.
- La caméra (`VueVillage.tsx`) déplace et agrandit tout le monde d'un coup (`translate` + `scale`), en douceur (0,18 s) quand elle suit le joueur.

### 7.2 Les calques, du fond vers l'avant

| Ordre | Calque | Contenu |
|---|---|---|
| 1 | **Terrain** (`terrain-village`, `TerrainVillage`, un SVG dessiné une seule fois) | sous tout, le sous-bois sombre ; une large auréole d'herbe floue autour de la clairière ; le **damier** (deux verts `#86c13f` / `#79b437`, un motif SVG de 2 × 2 cases posé en iso par une matrice) dont le bord s'efface dans l'herbe (masque flouté) |
| 1 bis | **Forêt derrière** (`foret-derriere`, tuiles de canvas) | les arbres du haut et des côtés |
| 2 | **Sol** (`sol-village`, un SVG de la taille du monde) | les chemins de pavés, les rails, le losange en tirets dorés du bâtiment actif, le losange vert ou rouge de ce qu'on pose (le quadrillage n'est plus jamais tracé : le damier suffit) |
| 3 | **Objets** (`objets-village`) | bâtiments, mine, décorations, personnages, wagonnets, triés par profondeur |
| 3 bis | **Forêt devant** (`foret-devant`, `z-index` 90 000) | les arbres du bas de la carte, devant tout le reste |
| 4 | **Bulles** (`bulles-village`, `z-index` 100 000) | les bulles de notification, toujours devant tout |
| 5 | **Fondu** | le noir de l'entrée et de la sortie de la mine |

### 7.3 Les dessins

- **Les bâtiments** : les images calées sur la grille (voir [§ 1](#1-le-style-général)), avec une ombre portée douce. **Retournés** (bouton ↔), l'image est d'abord mise en miroir puis calée de la même façon (l'entrée change de côté). Survolés ou actifs : une **lueur dorée**. La **foreuse vibre** quand elle tourne (0,16 s). Ce qu'on pose (le fantôme) est un peu transparent et pulse (1 s) ; il **rougit** (sépia + teinte) quand la place est prise.
- **La mine** (21/10) : l'image fournie (`mine.webp`), calée sur ses 10 × 10 cases comme les bâtiments, et par-dessus ce qui **évolue** (`DessinEvolutionMine`, en SVG, placé depuis le 21/10 à partir de points de l'image, `POINTS_MINE`, convertis par `pointSurSprite` dans `iso.ts`) : une **cage d'ascenseur** en acier (montants, entretoises, poulie qui **tourne** quand une cabine roule, câble, cabine rayée jaune et noir) pour ton ascenseur (toit doré) et une par mineur employé, posées en quinconce le long du mur du fond ; le **fond du trou** qui s'assombrit avec la profondeur (et une lueur bleutée de minerais quand on est bas) ; un **panneau en bois** avec la profondeur devant la galerie. Retournée en miroir, tout est inversé ensemble.
- **Les rails** (`CaseRail`) : du ballast gris, des traverses en bois, deux rails en acier (avec leur ombre). Chaque case **se raccorde toute seule** à ses voisines (et à la mine ou au marché collés à elle) : une ligne droite, ou un **virage** en quart de cercle autour d'un coin de la case.
- **Les chemins** (`CaseChemin`) : des pavés gris clair sur de la terre beige.
- **Les décorations** (`DessinDecoration`) : fleurs rouges, jaunes ou violettes, buisson, rocher, tonneau, caisse de minerais, lanterne (qui vacille), banc, grand arbre, sapin, cerisier en fleurs (2 × 2 cases), fontaine (son jet pulse, 1,2 s), statue du hamster d'or. Elles peuvent être retournées aussi.
- **Les chargements** (`DessinWagonnet`) : un **wagonnet** rempli de minerais sur les rails, une **brouette** à pied.
- **Les personnages** : voir [§ 4.1](#41-au-village--perso-elementsvillagetsx).

### 7.4 Les bulles de notification

Une pilule à bord blanc avec une petite pointe, au-dessus du bâtiment (1 ou 2 icônes), qui **saute** (0,9 s). Sa couleur dit la sorte : **rouge** (alerte : salaires, chariot plein, plus de charbon, pioche cassée, sac plein), **rose** (prestige prêt, points de talent), **bleu** (nouveauté), **or** (nouveaux niveaux), **vert** (amélioration achetable). La liste est dans [interface.md § 6.1](interface.md#61-le-village-vu-du-ciel-vuevillagetsx).

### 7.5 Entrer dans la mine et en ressortir

- **Entrée** : la caméra **plonge** vers le milieu du trou (zoom ×3,2, 0,75 s, en accélérant) pendant qu'un **noir** qui part des bords recouvre tout ; puis la **vue en coupe** apparaît en sortant du noir (`brightness` 0 → 1, 0,6 s).
- **Sortie** : l'inverse : on part tout près du trou, le noir s'éclaircit (0,8 s) et la caméra recule jusqu'au joueur, devant l'entrée de la mine.
- En haut de la vue en coupe, une bande de **surface** rappelle le village : ciel bleu, soleil carré qui brille, herbe, bord de terre et un panneau en bois « ☀️ Village ».

Pour les z-index de tout le jeu : les fenêtres (`.voile`) sont à 10, la barre de boutons collée en bas (téléphone) à 9, le panneau d'un bâtiment sur téléphone à 8, les toasts à 20, la fête du prestige et la révélation d'une recrue à 30. Dans la mine : cabines et tête de foreuse à 2, poulie et joueur sur l'échelle à 3, indicateurs, bandeaux et petits gains à 5, éclats à 6, trouvailles à 7, grosses ventes à 8.

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

**À la surface** (seulement au village vu du ciel ; s'éteint en ~0,4 s en entrant dans la mine, revient en ~1,2 s) :
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

- Cache **`idle-miner-v5`** (21/10 : images en haute définition, arbres (v4), puis images des personnages (v5) ; `idle-miner-v2` le 20/10). À l'installation, il range `/`, `/manifest.webmanifest`, `/favicon.svg`, `/icones/icone-192.png`, `/icones/icone-512.png`, et **les images du village** (`IMAGES_DU_VILLAGE` : les 12 arbres, les 9 images de `images/batiments/` (dont la mine), les 3 portraits de `images/personnages/`, les 26 images des personnages de `images/personnages/sprites/` ; sans elles, le village serait vide hors ligne), et prend la main tout de suite (`skipWaiting`, `clients.claim`). À l'activation, il efface les caches d'un autre nom (changer `CACHE` vide le cache de tous les joueurs).
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
