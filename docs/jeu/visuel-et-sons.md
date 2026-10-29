# Le visuel et les sons de Mega Digger

> Le style graphique, les dessins du village, les animations, les bruitages, la musique et l'application installable (PWA).
> Écrit d'après le code du 25/10, après la grande mise à jour du style et le village redessiné en SVG plats. Les fichiers : `src/styles/*.css`, `src/village.css`, `src/icones.css`, `src/composants/*.tsx` (dont `iso.ts`, `sprites.ts`, `arbres.ts`, `DessinsVillage.tsx`, `VueVillage.tsx`), `outils/art/`, `outils/icones/`, `src/sons.ts`, `src/ambiance.ts`, `src/installation.ts`, `public/`. Les règles du village sont dans [village.md](village.md) ; ce que fait chaque bouton est dans [interface.md](interface.md).

## Sommaire

1. [Le style en bref](#1-le-style-en-bref)
2. [Les briques de l'interface](#2-les-briques-de-linterface)
3. [Les dessins du village (`outils/art/`)](#3-les-dessins-du-village-outilsart)
4. [Le village à l'écran](#4-le-village-à-lécran)
5. [Les personnages : des taupes](#5-les-personnages--des-taupes)
6. [Le bloc de la mine](#6-le-bloc-de-la-mine)
7. [Les animations et les grands moments](#7-les-animations-et-les-grands-moments)
8. [L'écran d'accueil](#8-lécran-daccueil)
9. [Les sons et la musique](#9-les-sons-et-la-musique)
10. [L'application installable (PWA)](#10-lapplication-installable-pwa)
11. [La fluidité : les règles à respecter](#11-la-fluidité--les-règles-à-respecter)

---

## 1. Le style en bref

Du **cartoon tout simple et coloré** (décidé le 25/10) : des **contours bleu nuit épais partout** (boutons, fenêtres, pastilles, icônes, bâtiments, personnages), des **ombres dures** (décalées, sans flou), du **crème** pour les fenêtres, des **aplats pastel**, **ni dégradés ni flous**. Le fond du jeu est le vert de l'herbe (`#8fd36f`, aussi la couleur de la barre du téléphone).

Les couleurs sont des variables de `src/styles/theme.css` (`:root`) :

| Variable | Couleur | Usage |
|---|---|---|
| `--encre` (et `--nuit`) | `#2a2140` | tous les contours, le texte, les ombres dures, les pastilles sombres |
| `--encre-douce` | `#5d5677` | le texte secondaire (`.discret`) |
| `--creme` / `--creme-fonce` | `#fdf6e3` / `#f3e8c9` | le fond des fenêtres / les zones en creux |
| `--vert` / `--vert-fonce` | `#8fe08f` / `#4fbf5f` | acheter, améliorer ; les jauges |
| `--jaune` / `--jaune-fonce` | `#f9d65a` / `#e9b931` | l'action principale, vendre |
| `--violet` / `--violet-fonce` | `#b9a0f5` / `#8f6be8` | les gemmes et les publicités |
| `--ciel` / `--ciel-fonce` | `#8cc8f5` / `#5ea9e6` | aller, voir, régler |
| `--rose` / `--rose-fonce` | `#f39aa8` / `#e2687c` | détruire, les alertes |
| `--orange`, `--gris`, `--gris-fonce` | `#f6a04d`, `#d8d6e0`, `#a9a6b8` | le combo, les boutons grisés |

- **Les traits** : `--trait` 3 px (le contour normal), `--trait-fin` 2 px ; arrondis de 16 et 10 px ; **l'ombre dure** `--ombre` = `0 4px 0 var(--encre)` (et `--ombre-petite`, 3 px).
- **Les polices**, servies par le jeu lui-même (`@fontsource`, importées dans `src/main.tsx` : plus de Google Fonts, le jeu marche hors ligne et dans la page d'un autre site) : **Lilita One** pour les titres (`--police-titre`), **Nunito** (700 et 900) pour le texte (`--police`).
- **Les icônes** : on écrit des emojis dans le code, mais ils s'affichent avec notre **police d'icônes cartoon** `Icones Mega` (`public/fonts/icones-mega.woff2`, une police en couleur : calques **COLR** pour Chrome, Edge et Firefox, et dessins **SVG** pour Safari sur Mac et iPhone, 25/10 ; avant, Safari montrait les emojis d'Apple) : 100 dessins dans le même style (26/10 ; 90 avant) (les minerais : pierre, charbon, fer, redstone, or, émeraude, saphir, rubis, diamant ; depuis le 26/10, le fer 🔩 et l'or 🟡 sont des **cailloux à pépites** (le minerai brut), et les lingots ont leurs propres icônes : ⬜ lingot de fer, 🟨 lingot d'or ; les gemmes 🔷 saphir (un losange bleu roi) et 🔺 rubis (une gemme taillée en triangle) ; les bijoux 📿 🧿 🫅 💍 ; les bâtiments 🏭 et 🏪) (contour d'encre, aplats, une ombre plate). Elle est déclarée dans `src/icones.css` avec un `unicode-range` (elle ne sert qu'à ces caractères) et placée **en tête** des deux polices ; `index.html` la précharge pour ne pas voir les emojis du système avant. Elle est fabriquée par `outils/icones/fabriquer.py` (voir son LISEZMOI) : **un nouvel emoji doit être dessiné dans `outils/icones/dessins.py`**, sinon c'est l'emoji du système qui s'affiche.
- **Les règles d'or** (en tête de `theme.css`) : une couleur par sorte de bouton ; jamais de texte sous 12 px ni de bouton sous 40 px de haut ; pas de dégradés ni de flous.
- **Moins de mouvement** : si le système demande `prefers-reduced-motion: reduce`, `theme.css` ramène toutes les animations et transitions à 0,01 ms ; le village coupe aussi ses animations en boucle, et le village de l'accueil s'arrête.

## 2. Les briques de l'interface

Les briques communes sont dans `src/styles/theme.css` ; les autres fichiers de `src/styles/` ne font que les placer. Ils sont importés dans cet ordre par `src/main.tsx` :

| Fichier | Contenu |
|---|---|
| `src/icones.css` | la police d'icônes (fabriquée, ne pas modifier à la main) |
| `src/village.css` | le dessin du village : la carte, les bâtiments, les personnages, les bulles, la plage, la vie du village |
| `styles/theme.css` | couleurs, polices, boutons, étiquettes, fenêtres, cartes, onglets, lignes d'amélioration, prix, jauges, messages, champs |
| `styles/jeu.css` | l'écran de jeu : le bandeau (`Hud.tsx`), les tâches, les gros boutons ronds du bas |
| `styles/mine.css` | la fenêtre de la mine : le bloc, le coffre, les stocks à vendre |
| `styles/gemmes.css` | la boutique, la publicité, le cadeau du jour, le retour d'absence, les réglages |
| `styles/batiments.css` | les panneaux des bâtiments, le Personnel, la révélation d'une recrue, les trajets, « Construire » |
| `styles/accueil.css` | l'écran d'accueil |
| `styles/fenetres.css` | le tutoriel, la fête du niveau, les statistiques, le bilan, les « +X $ » |

- **Les boutons** (`.btn`) : contour de 3 px, ombre dure de 4 px, texte en Nunito 900. Au survol ils montent d'un pixel ; appuyés, ils **s'enfoncent** (descendent de 3 px, l'ombre se réduit). Une couleur par sorte d'action : `.btn-vert` acheter/améliorer/construire/embaucher, `.btn-jaune` l'action principale (jouer, vendre, valider), `.btn-violet` gemmes et publicités, `.btn-bleu` aller/voir/régler, `.btn-blanc` neutre/annuler, `.btn-rose` détruire. Tailles : `.btn-petit` (40 px), `.btn-grand` (56 px, en Lilita One), `.btn-rond` (44 px). `.btn-attention` respire doucement (quelque chose attend).
- **Les fenêtres** (`Fenetre.tsx`, `.voile` + `.fenetre`) : la même partout. Un voile bleu nuit transparent (`.voile-clair` presque invisible pour les bâtiments), une carte crème au gros contour, un **bandeau de couleur** en haut avec le titre (vert par défaut, ou jaune, bleu, rose, violet, orange, crème), le bouton ✖ rond ; Échap et un clic à côté ferment. Elle arrive avec un petit rebond ; **sur téléphone (≤ 640 px), elle monte du bas de l'écran**.
- **Les étiquettes** (`.etiquette`, « niv. 3 », « Rare », « MAX »), la **pastille** rouge sur un bouton, les **jauges** (`.jauge` : un tube blanc au contour fin, rempli de vert, jaune, rose, violet ou bleu ; `.jauge-texte` avec le texte par-dessus), les **messages** (`Toasts.tsx` : au plus 3, en haut au milieu, crème, jaunes pour un succès).
- **Les confirmations** (`Confirmation.tsx`) : une fenêtre du jeu (titre, explication, Confirmer / Annuler, bouton rose si ça détruit) au lieu de la boîte grise du navigateur, qui ne marche pas toujours quand le jeu est dans la page d'un autre site. Le jeu n'utilise plus `window.confirm`.
- **L'écran de jeu** (`jeu.css`) : le village prend tout l'écran, l'interface est posée dessus. Le bandeau est fait de **pastilles bleu nuit au gros contour crème** ; une case rougit et tremble quand il faut agir (`hud-alerte` : coffre plein, salaires), l'argent saute à chaque vente (`hud-saute`). En bas, les gros boutons ronds ; celui de la **mine** est jaune, avec un **anneau orange qui se remplit comme le coffre** (`conic-gradient` à bord franc).

## 3. Les dessins du village (`outils/art/`)

Depuis le 25/10, **tous les dessins du village sont des SVG plats** fabriqués par des scripts Node, sans bibliothèque à installer (voir `outils/art/LISEZMOI.md`) : des aplats (une seule teinte plus sombre par face), un **contour bleu nuit épais** (6 px du dessin, 3 px à l'écran au zoom 1), des formes rondes, la palette de l'interface (`C` dans `outils/art/formes.mjs`). La lumière vient d'en haut à gauche : le dessus est le plus clair, la façade de gauche a la couleur elle-même, celle de droite est plus sombre. Aucune écriture : un bâtiment retourné (miroir) utilise la même image. Les anciennes images `.webp` (bâtiments, arbres, textures du sol, personnages, rails) ont été supprimées : `public/images/` est passé de 4,3 Mo à 440 Ko.

| Commande | Ce qu'elle écrit |
|---|---|
| `node outils/art/fabriquer.mjs` | `public/images/batiments/` (les 5 bâtiments, la mine, son calque de devant, les 8 caisses, `rails.svg`), `public/images/village/arbres/` et `public/images/village/paysage/` (les collines et les montagnes) ; affiche les **calages** à recopier |
| `node outils/art/personnages.mjs` | les taupes : `public/images/personnages/sprites/` (26 images) et les 3 portraits de `public/images/personnages/` |
| `node outils/art/rails.mjs` | les 30 tuiles des rails : `public/images/rails/` |

| Fichier de `outils/art/` | Ce qu'il dessine |
|---|---|
| `formes.mjs` | la palette, les teintes, la « toile » isométrique (boîtes, prismes, toits, cylindres, rochers) |
| `batiments.mjs` | la **dalle de 5 × 5 pavés** sous chaque bâtiment, et le **marché** (étal à l'auvent rayé rouge et blanc, caisses de minerais, grosse pièce d'or), le **forgeron** (25/10, redessiné pour qu'on le reconnaisse tout de suite : un grand four en pierre sombre dont la bouche crache des flammes orange, une haute cheminée en briques qui fume, la grosse enclume noire avec une barre de fer rouge, le marteau et des étincelles, un tonneau d'eau qui fume, une meule, un tonneau d'épées, du charbon, les outils accrochés au mur, une lueur orange sur les pavés), le **Personnel** (bureau au toit bleu, enseigne au casque de mineur, tableau d'annonces), la **foreuse** (25/10 : une mèche en acier **en forme de carotte**, longue et pointue, à rainures en spirale, dont la pointe entre dans un trou, tenue par un portique jaune à bandes de chantier, une grande roue dentée et un petit moteur rond en acier qui fume ; juste à côté de la mèche, un **petit coffre** en bois cerclé de fer plein de charbon ; 26/10 : `foreuse-active.svg`, la même où la mèche tourne, montrée quand elle fore), le **générateur** (socle en pierre, corps en métal à bande violette, bobines de cuivre, gros cristal de redstone), (26/10) la **fonderie** (un haut-fourneau en briques rouges qui crache le feu, sa grosse cheminée qui fume, le moule à lingots, le creuset, une pile de lingots ; plus haute que les autres, pour sa fumée ; `fonderie-active.svg`, montrée quand elle fond : le feu danse, le creuset verse le métal fondu dans le moule, la fumée monte, une animation SMIL dans le SVG fabriquée par `enBoucle(images, duree)`, qui sert aussi à la mèche de la foreuse) et la **joaillerie** (une boutique en pierre claire au toit violet bordé d'or, une grosse gemme bleu ciel en enseigne, la vitrine sous un auvent violet et lilas, l'établi et sa loupe, un petit coffre de gemmes), et l'icône des rails |
| `mine.mjs` | la **mine** (10 × 10) : un puits carré entouré de poutres, un **chevalement** en bois (deux poteaux, une poutre, deux lanternes, une grande roue, le treuil), des **parois du puits pleines de minerais** (25/10 : or, diamants, émeraudes, redstone, charbon, fer, avec des étincelles), une petite butte de rochers avec l'entrée d'une galerie et sa voie, un wagonnet plein de minerais, deux rochers à filons, un coffre au trésor, une cabane à outils. **Tout reste bas** (25/10 : plus de grosse montagne au fond, qui cachait le décor derrière la mine) : seule la roue du chevalement dépasse. Son calque `mine-devant.svg` et les 8 caisses de l'ascenseur (26/10 : une vide, puis une par niveau de la mine). Partout, les minerais ont **la forme des icônes du jeu** (`minerai()` dans `formes.mjs` : un caillou gris, un morceau de charbon à facettes, des lingots de fer et d'or, un cristal de redstone, une émeraude à huit côtés, un diamant taillé ; 26/10 : aussi `minerai('saphir')` et `minerai('rubis')`), plus des petits cubes |
| `arbres.mjs` | les **7 arbres** « sucette » : rond, nuage, sapin, buisson, cerisier, automne, palmier |
| `montagnes.mjs` | (25/10) le **paysage** autour de la clairière : 12 montagnes (10 toutes simples, en deux versions chacune, la **montagne à la cascade** et celle à la **galerie de mine**) et 9 collines, bosquets et rochers. Une montagne : une silhouette de pics, chaque pic coupé par une arête (la face de gauche éclairée en gris lilas `#b9b4d6`, celle de droite à l'ombre `#918ab8`), un bonnet de **neige** qui coule en gouttes, de l'herbe en bas, des **pépites de minerais** prises dans la roche (26/10 : de petits losanges de couleur au gros contour, dessinés comme sur le bloc de la mine, `BlocDessin.tsx` ; avant, des filons avec de grosses icônes de minerais), des grappes de **cristaux**, des fissures, un arbre au pied. (26/10) Les arbres des vignettes ont **exactement la taille des arbres de la lisière** (`TAILLE_ARBRE`), et il y en a moins (un par montagne, peu sur les collines). Une colline : une bosse verte, la teinte éclairée décalée vers la lumière comme le feuillage des arbres, un contour seulement sur le dessus (elles sortent du sol). |
| `personnages.mjs` | les taupes (voir le [§ 5](#5-les-personnages--des-taupes)) |
| `rails.mjs` | le ballast et la voie (voir le [§ 4](#les-rails-et-les-wagonnets)) |

Les dessins sont faits **exactement à l'angle des cases du jeu**, deux fois plus grands que le monde (une case y fait 66 px de large). Si un dessin change de taille, recopier les calages affichés : `CALAGES` et `POINTS_MINE` dans `src/composants/iso.ts`, `CABINE_EN_HAUT` / `CABINE_EN_BAS` dans `DessinsVillage.tsx`, `arbre()` dans `arbres.ts`, `VIGNETTES` et `EAU_CASCADE` dans `paysage.ts`, `CALAGE_TAUPE` dans `sprites.ts`. Les chemins des images passent par `cheminPublic()` (`src/chemins.ts`), jamais `/images/...` en dur. (`rails.svg` est fabriquée, mais aucun écran ne l'affiche pour l'instant.)

## 4. Le village à l'écran

### La projection (`iso.ts`)

- Une vue **isométrique** (vue du ciel, comme Clash of Clans). Une case fait **33 × 19 px** (`DEMI_LARGEUR` 16,5, `DEMI_HAUTEUR` 9,57). La clairière de 40 × 40 cases est un losange dont le coin du haut (la case 0, 0) est en (801 ; 57,2) ; le monde fait **1 602 × 1 024 px** (`LARGEUR_MONDE`, `HAUTEUR_MONDE`, les mêmes chiffres sont dans `.monde-village`). `versEcran` passe d'une case à un point, `versGrille` fait l'inverse.
- **L'ordre d'affichage** : plus un objet est bas sur l'écran, plus il passe devant : `z-index` = `profondeur` = (x + y) × 100 au centre de son emprise ; un personnage + 5, un wagonnet + 4.
- **Les bâtiments** sont calés sur leur emprise par une matrice CSS, sans déformation (`transformationSprite`) : le pied de leur dalle tombe pile sur les 5 × 5 cases (`RETRAIT_BATIMENT = 0`). Une **ombre plate** au sol (`.ombre-batiment`, `#74bf57`, le vert sombre de l'herbe) les ancre. Le bâtiment survolé ou ouvert est montré **au sol** par un losange doré (`.emprise-survol`, `.emprise-active`).
- **La caméra** (`VueVillage.tsx`) déplace et agrandit tout le monde d'un coup ; elle suit le joueur (ou le wagonnet qu'il pousse) en douceur, et ne sort jamais de `LIMITES_CAMERA`.

### Les calques, du fond vers l'avant (`VueVillage.tsx`)

| Calque | Contenu |
|---|---|
| `TerrainVillage` (`DessinsVillage.tsx`) | le sol, **tout à plat** : l'herbe de la forêt (`#86cc66`), une bande un peu plus claire autour de la clairière, le **damier de deux verts très proches** (`#8fd36f` / `#93d673`, on devine la grille sans la voir), des touffes (trois traits en « v », `#74bf57`), quelques fleurs et cailloux. Dessiné une fois puis **figé en image** (`ImageFigee.tsx`) |
| `SolPlage` (`PlageVillage.tsx`) | le sable (`#f3dca0`, une bande mouillée), un **trait de côte à l'encre** de 3 px, la mer à plat (`#8cc8f5`, une bande plus claire le long du rivage) |
| le sol (`sol-village`) | les ombres des bâtiments, les chemins de pavés (`CaseChemin` : quatre pavés gris cernés d'encre sur de la terre claire), les rails, les losanges du survol, le rayon du générateur, la **grille de construction** (seulement quand on pose quelque chose) |
| `ForetDerriere` (`ForetVillage.tsx`) | le décor du fond : la lisière du haut et des côtés, les collines et les montagnes, et l'eau de la cascade qui coule |
| `EauPlage` (`PlageVillage.tsx`) | les reflets de la mer qui scintillent (25/10 : après le décor du fond, voir le [§ 11](#11-la-fluidité--les-règles-à-respecter)) |
| les objets | bâtiments, mine, personnages, wagonnets, triés par profondeur |
| `ObjetsPlage` | ponton, barque, palmiers, parasol, feu de camp, crabes... |
| `ForetDevant` (`z-index` 90 000) | le décor du bas de la carte (la lisière, les collines, la montagne à la galerie), devant tout |
| `AmbianceVillage.tsx` (`z-index` 99 990) | vols d'oiseaux et leur ombre, **ombres des nuages** (la seule tache floue du village, un `radial-gradient`) |
| les bulles (`z-index` 100 000) | bulles de notification, mini-jauges, « +X $ » des ventes |

### La mine et son ascenseur

L'image `mine.svg` ne bouge pas ; `DessinEvolutionMine` (`DessinsVillage.tsx`) dessine par-dessus, à partir des points `POINTS_MINE` (miroir compris) : les deux **câbles** qui tombent du treuil, la **caisse de l'ascenseur** (`caisse-ascenseur-0.svg` vide quand elle redescend ; pleine quand elle remonte : depuis le 26/10, la caisse `N` au niveau N de la mine, chaque niveau ajoutant son nouveau minerai (or, émeraude, saphir taillé en ovale, rubis taillé en cœur, diamant) ; un tas de minerais dessinés comme leurs icônes, plus des cubes), coupée sous le bord du puits, puis `mine-devant.svg` (les poutres du bord de devant) qui passe devant elle, et un **panneau** planté devant avec le niveau de la mine. La caisse fait des allers-retours tant que des mineurs travaillent au fond (`hauteurNavette`), en glissant d'une image à l'autre (`MineAnimee` dans `VueVillage.tsx`) ; on voit un mineur dedans seulement quand il arrive ou remonte. Une mini-jauge « 📦 Déchargement » apparaît pendant qu'elle se vide. Il n'y a plus de jauge du coffre au-dessus de la mine (25/10) : le bandeau la montre déjà.

### Les rails et les wagonnets

- **Les rails** (`RailsDuVillage`, images de `outils/art/rails.mjs`) : un rail se pose sur une case, mais **la voie est large de presque deux cases**. Deux couches. **Le ballast**, une bande claire (`#d8cbb0`) à plat sur le sol : des tuiles de 2 × 2 cases (3 × 3 pour un virage doux) posées en losange et tournées dans le bon sens ; chaque forme a deux images, `talus_<forme>_bord.svg` (la bande élargie, à l'encre) et `talus_<forme>.svg` (la bande claire) : on pose d'abord tous les bords, puis toutes les bandes, et le trait d'encre ne reste que tout autour de la voie. **La voie**, en vue isométrique (`voie_*.svg`) : des traverses en bois (`#c98a55`) et deux rails d'acier, cernés d'encre ; une image par forme de case (tout droit, virage, T, croisement, bouts de ligne avec un **butoir** `voie_fin_*`, rail tout seul `voie_seul_ns`, virages doux `voie_doux_*`), posées de la plus loin à la plus proche dans le cadre `CADRE_VOIE` (`CADRE_DOUX` pour les virages doux). Chaque case choisit toute seule son dessin selon ses voisines (`morceauDeVoie`, `codeDeVoie`).
- **Le wagonnet** (`Wagonnet3D.tsx`, placé par `WagonnetVillage.tsx`) : un petit modèle 3D recalculé à chaque image (chaque face est un polygone projeté dans la vue du village), en aplats cernés d'encre : une caisse en planches évasée vers le haut, un rebord et des montants d'acier, quatre roues posées sur les rails, un attelage. Il se remplit de minerais de la couleur de ce qu'il porte (`minerais.ts` ; 26/10 : aussi le saphir et le rubis, les lingots et les bijoux, dans `Wagonnet3D.tsx`) : vide, à moitié plein ou plein avec un petit tas. Placé entre ses deux essieux, il **tourne en douceur** dans les virages ; entre deux nouvelles du jeu (20 par seconde), il avance tout seul à sa vitesse. Son pousseur marche derrière lui le long de la voie.
- **Le rayon du générateur** (`RayonGenerateur`) : une ellipse en pointillés jaunes, **seulement quand on regarde le générateur** ou qu'on le pose ; grise sans courant. Immobile (voir le [§ 11](#11-la-fluidité--les-règles-à-respecter)).

### La lisière, les montagnes, la plage, les rochers et les décorations

- **La lisière** (`ForetVillage.tsx`) : une rangée d'arbres bien en ligne tout autour de la clairière, à 1,3 case du bord, toujours aux mêmes places (hasard à graine fixe), tous de la **même taille** (26/10 : 2 cases de pied, avant entre 1,85 et 2,15), tirés parmi les 7 dessins de `arbres.ts` (surtout ronds, nuages et sapins, un peu de cerisiers et d'automne, les palmiers seulement sur la plage). Au pied de chaque arbre, une **ombre plate d'un vert à peine plus sombre que l'herbe** (`#74bf57`) et une touffe qui cache le bas du tronc : il se fond dans le sol.
- **Au-delà de la lisière, des collines et des montagnes** (25/10, à la place de la forêt de 240 arbres ; `paysage.ts`, dessins de `outils/art/montagnes.mjs`). Juste derrière les arbres, des **collines** vertes (quelques sapins, fleurs, rochers à pépites) ; puis, sur les deux côtés du fond (en haut de l'écran), des **montagnes enneigées** avec leurs pépites et leurs cristaux (26/10 : **deux fois moins** qu'avant, une tous les 8 cases au lieu de 5,6), les plus proches assez petites pour que leur sommet tienne sous le haut de la caméra, les plus loin serrées jusqu'au bord. Le côté de devant (en bas à droite) n'a que des collines, de plus en plus grandes en s'éloignant, jamais plus hautes que le pied des arbres de la lisière : elles ne cachent jamais la clairière. Deux montagnes sont posées à la main là où on les voit bien, et rien ne pousse devant elles : la **cascade** (au fond à gauche, près de la plage) qui tombe d'une fente de la roche dans un petit bassin entouré de rochers, avec un nénuphar ; et l'**entrée d'une galerie de mine** (loin devant, à droite) dans son cadre en bois, avec sa lanterne, ses rails, un wagonnet plein de minerais et une pioche. Rien ne pousse sur la plage. Les montagnes ne sont jamais en miroir (la lumière vient toujours de la gauche). (26/10) Derrière la clairière, les collines et les montagnes sont **toujours dessinées sous la lisière** (et leur pied ne déborde jamais dans la clairière) : près du coin du haut, une colline plantée sur un côté passait devant les arbres, et la rangée avait un trou.
- **Tout ce décor est dessiné en tuiles** : les arbres et les vignettes sont dessinés une fois dans une « toile » (canvas) hors de la page, découpée en carrés de 384 px recadrés au plus près des dessins, puis chaque tuile devient une **image** (WebP sans perte, `toBlob`) : une toile affichée dans la page coûtait du travail au navigateur à chaque image, même immobile. Après un zoom, les tuiles visibles sont refaites avec plus de pixels (deux par deux, celles qu'on voit d'abord ; en attendant, chacune garde son image d'avant). **Seule l'eau de la cascade bouge** : une petite boîte posée sur la bande d'eau (`.cascade-village`), où des traits blancs descendent en `transform` ; elle s'arrête quand la caméra ne la voit pas.
- **La plage** (`PlageVillage.tsx`, en bas à gauche, hors de la grille) : ponton, barque, palmiers, parasol, feu de camp, étoiles de mer, rochers dans l'eau, algues, bois flotté, traces de pas, deux crabes (immobiles, 29/10). Quand elle n'est pas à l'écran, ses animations sont en pause (`.plage-cachee`, rectangles `BOITES_PLAGE` de `plage.ts`).
- **Les rochers** (`Rochers.tsx`) : un galet cabossé tout plat, deux teintes (le corps à l'ombre, le dessus éclairé décalé vers la lumière) et un contour d'encre ; toujours le même pour une même graine.
- **Les décorations** (`DessinDecoration`) : fleurs, buisson, rocher, tonneau, caisse, lanterne, banc, arbres, fontaine, et la **statue de la taupe d'or** (pioche levée, sur son socle). On les achète à l'onglet 🍀 Décorations du menu Construire (27/10) ; elles ornent aussi la plage et le village de l'accueil.

### Les bulles et les jauges du village

- **Les bulles de notification** : une médaille ronde à plat au gros contour d'encre et à l'ombre d'encre, un petit reflet blanc, l'icône en grand qui se dandine, un ruban de couleur avec deux mots, une pointe qui montre le bâtiment, et « +2 » s'il y a d'autres choses à faire là-bas. Elle arrive en rebondissant et flotte. La couleur dit l'urgence : **rouge** alerte (elle tremble, avec une onde qui s'élargit), **rose** prêt, **bleu** nouveau, **vert** achetable (avec des étincelles), **jaune** trajet à créer (la bulle « 🛤️ » au milieu des rails).
- **Les mini-jauges** (`MiniJauge`, `.mini-jauge`) : une petite carte crème au contour d'encre au-dessus de ce qui travaille (la forge, la foreuse, le générateur, la caisse de l'ascenseur). (27/10) Plus de jauge « Vente » au-dessus d'un wagonnet au marché : le « +X $ » de la vente suffit.

## 5. Les personnages : des taupes

- Le joueur, les mineurs, le manager et le recruteur sont des **taupes** dessinées par `outils/art/personnages.mjs` : pelage gris-mauve, museau et mains roses, grands yeux, contour d'encre de 4,5 unités. Le joueur a un **casque jaune** ; un mineur, un casque de la **couleur de sa rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique, comme `RARETES` dans `donnees.ts`). Le manager a une chemise, une cravate rouge et des lunettes ; le recruteur une casquette verte et un porte-voix.
- **Au village** (`public/images/personnages/sprites/`) : le joueur et chaque rareté ont **4 vues** (devant, derrière, gauche, droite), le manager et le recruteur seulement leur vue de face. Toutes ont le même cadre (136 × 132, les pieds en 68 ; 127 : `CALAGE_TAUPE`). `choisirVue` (`sprites.ts`) prend l'image selon le sens de la marche : de face à l'arrêt, de dos quand il s'éloigne (en miroir vers la gauche). Une taupe fait environ 46 px de haut dans le monde (`ECHELLE_SPRITE`).
- **Les portraits** (`public/images/personnages/`) : **Pépite** (`mineur.svg`, la mascotte du tutoriel, qui salue pioche levée), `manager.svg` et `recruteur.svg` (le panneau du Personnel).
- **Les animations** (`Perso` dans `ElementsVillage.tsx`, `village.css`) : une ombre plate sous les pieds ; en marchant, un pas toutes les 0,34 s (il s'écrase en touchant le sol, s'étire en montant, se dandine) et penche vers où il va ; au repos, il respire ; un pousseur marche penché en avant, presque sans sautiller ; un mineur pas payé tape du pied sous une bulle 😠 ; le manager et le recruteur se balancent à leur poste. Le joueur a un **anneau doré** sous lui, de la poussière sous ses pieds, et un repère doré marque où il va.

## 6. Le bloc de la mine

Dans la fenêtre de la mine (`PanneauMine.tsx`, `mine.css`) :

- **Le bloc** (`BlocDessin.tsx`) : un cube vu de 3/4 en SVG plat (dessus clair, gauche moyen, droite plus foncé, contour d'encre), gris pour la pierre ; un minerai y met ses **pépites** de couleur ; jusqu'à deux **fêlures** quand il faut plusieurs coups (pioche cassée). Un minerai précieux (prix ≥ 35) brille doucement. Le même dessin sert aux statistiques.
- **Chaque clic** : le nouveau bloc arrive en s'écrasant, comme frappé (`bloc-pousse`), cinq **éclats** gris cernés d'encre partent en étoile (`eclat`), et le minerai trouvé s'envole (« +1 » et l'icône du minerai, `trouvaille`, un peu à gauche ou à droite pour ne pas s'empiler ; 25/10 : l'icône est une image, `IconeImage.tsx`, car Safari ne prenait pas la police d'icônes dans cette bulle animée).
- **Le combo** : les clics à moins de 0,9 s l'un de l'autre s'additionnent. Dès ×3, une pastille orange « 🔥 ×N » saute à chaque clic (rose et plus grosse dès ×25) ; dès ×10, le fond du bloc passe à l'orange (`.zone-en-feu`). Une jauge jaune montre le prochain palier et son bonus (`BONUS_COMBO`), qui s'affiche en étiquette jaune en haut ; trois compteurs : blocs cassés, record, clics par seconde.
- **La pioche** : sa jauge de durabilité, rose sous 15 % ou cassée (elle clignote alors).

## 7. Les animations et les grands moments

| Moment | Ce qu'on voit | Où |
|---|---|---|
| Une vente du joueur | une grosse étiquette jaune « +X $ » au contour sombre qui saute au milieu, avec une gerbe de 10 pièces ; en petit en haut pour les autres gains | `Gains.tsx`, `fenetres.css` |
| Un wagonnet vend au marché | un « +X $ » doré jaillit au-dessus de lui, compte de 0 au montant puis « claque », avec une onde, des étoiles, les minerais vendus qui sautent et une fontaine de pièces | `village.css` (`.vente-wagonnet`) |
| Une embauche | une gerbe de rayons et d'étincelles au Personnel, « 👷 *Nom* arrive ! », puis le mineur part vers la mine avec un halo doré, des étincelles et une bulle « ✨ Nouveau ! » | `VueVillage.tsx`, `village.css` |
| Une recrue du recruteur | la carte tremble pendant que les couleurs des raretés défilent (1,6 s), puis se retourne : sa rareté en grand, des rayons en parts franches qui tournent, des confettis | `RevelationRecrue.tsx`, `batiments.css` |
| Un niveau du joueur | l'étoile arrive, le chiffre monte (un « tic » par niveau), des confettis, puis les gemmes et chaque déblocage arrivent ligne par ligne | `FeteNiveau.tsx`, `fenetres.css` |
| Le cadeau du jour | le calendrier de 7 jours ; la **série** en cours en pastille orange (« 🔥 Série : N jours de suite ! ») ; à l'ouverture, des **rayons jaunes qui tournent**, le **paquet qui saute**, puis ce qu'il contenait sort, une chose après l'autre | `RecompensesQuotidiennes.tsx`, `gemmes.css` |
| La publicité | pour l'instant une **fausse publicité** : un écran noir, l'étiquette « Publicité », un gros compte à rebours de 30 s (`SECONDES_PUB`), « Quitter (sans récompense) », puis un bouton violet « 🎁 Récupérer ». Le son du jeu se tait pendant ce temps. Sur CrazyGames, leur publicité récompensée la remplace | `Publicite.tsx`, `gemmes.css` |
| Le tutoriel | l'écran s'assombrit autour de la cible, un anneau doré au gros contour pulse, une grosse flèche jaune rebondit (« Touche ici ! »), la carte de Pépite donne la consigne ; « Bravo ! » et des confettis carrés pastel au contour sombre à chaque étape | `Tutoriel.tsx`, `fenetres.css` |

## 8. L'écran d'accueil

`Accueil.tsx` et `accueil.css` : clair et coloré, comme une carte du monde.

- **Au fond**, un petit village vivant (`SceneAccueil.tsx`) dessiné avec les mêmes morceaux que le jeu (terrain, forêt, plage, mine et sa caisse, bâtiments, rails, chemins, décorations) : (27/10, demandé par le propriétaire) c'est le **village de rêve de la fin de partie**, copié sur celui du propriétaire : la mine au niveau 7, tous les bâtiments posés en symétrie autour de l'axe mine → générateur → marché, des rails en losange autour du générateur où se branchent la foreuse, la fonderie et la joaillerie, et deux boucles jusqu'au marché. La forge est en bas à gauche du marché ; trois fontaines (une de chaque côté du générateur, une dessous). La foreuse fore (sa mèche tourne) et l'ascenseur de la mine monte plein de minerais puis redescend vide, sans arrêt. Quatre wagonnets (mine, foreuse, fonderie, joaillerie → marché) font la navette, chacun poussé par sa taupe, et chaque vente au marché fait jaillir le « +X $ » doré du jeu ; d'autres taupes vont et viennent, le manager et le recruteur sont devant le Personnel. Rien n'y est joué ; il s'arrête si le système demande moins de mouvement.
- **En haut**, un bandeau crème au contour de 4 px qui tombe en rebondissant : le **logo** (une pioche ⛏️ dans un rond jaune, « Mega Digger » en Lilita One), la phrase du jeu, la langue et le compte.
- **À gauche**, le gros bouton jaune **Jouer** et les mondes (le dernier joué surligné en jaune pâle) ; **à droite**, le classement ; **en bas**, le jeu en 4 étapes (« ⛏️ Creuse › 👷 Embauche › 🛤️ Automatise › 💎 Descends »). Sur téléphone, tout s'empile et on fait défiler.

## 9. Les sons et la musique

Tout est fabriqué par le navigateur (**Web Audio**), sauf le « cha-ching » des wagonnets qui vendent au marché, un vrai enregistrement (`public/sons/cash.mp3`, chargé au premier clic ; en attendant, ou sans réseau, c'est la caisse fabriquée `sons.vente` qui sonne). Le navigateur n'autorise le son qu'après un clic : le contexte audio est créé à ce moment-là (`quandLeSonEstPermis`).

### Les bruitages (`src/sons.ts`)

Chaque son mélange des « notes » (un oscillateur dont le volume retombe) et du « bruit » (un souffle filtré), avec un petit écart au hasard.

| Son | Quand |
|---|---|
| `coup`, `casse` | un coup de pioche (« tchk », tintement, « toc ») ; le bloc qui casse (« crac », cailloux, « boum », plus lourd pour la roche dure) |
| `minerai`, `rare`, `fortune` | un minerai (« plink » qui monte d'un cran à chaque trouvaille rapprochée, gamme pentatonique) ; un minerai rare (étincelles ; or, émeraude, et depuis le 26/10 saphir, rubis, diamant : `MINERAIS_RARES`) ; un minerai doublé |
| `bonus` | un palier de combo : un élan qui monte puis un accord qui scintille |
| `vente`, `venteMarche` | vendre le coffre : la caisse enregistreuse fabriquée (touches, tiroir, « ding ! », des pièces d'autant plus nombreuses que la vente est grosse) ; un wagonnet qui vend au marché : le « cha-ching » enregistré (un seul quand plusieurs vendent en même temps) |
| `achat`, `amelioration`, `succes` | « pop » et deux notes ; trois notes qui montent ; une petite fanfare (succès, tâche, étape du tutoriel) |
| `ticNiveau`, `niveauGagne`, `ligneDeblocage` | la fête du niveau |
| `suspenseRecrue`, `revelationRecrue` | un roulement de tambour, puis une fanfare d'autant plus grande que le mineur est rare |
| `piocheCassee` | un « clang » triste |
| `pas`, `construction`, `rail` | un pas dans l'herbe ; trois coups de marteau et une fanfare ; un « clang » de métal |
| `wagonnet`, `cloche` | un « ta-tac » à chaque joint de rail (plus doux s'il est électrique) ; une petite cloche à l'arrivée |
| `electricite` | le générateur reçoit de la redstone |

### La musique et l'ambiance (`src/ambiance.ts`)

Construites une seule fois, au premier clic. Un volume général (0,7) qui monte en douceur. **La musique** (volume 0,13) : 62 battements par minute, quatre accords doux de deux mesures chacun (la mineur, fa, do, sol) joués en nappe, une basse sur le premier temps, quelques notes de mélodie au hasard dans la gamme pentatonique de la mineur (une mesure sur quatre reste calme), avec une réverbération. **Au village** : le vent (un souffle filtré qui forcit et faiblit) et des oiseaux toutes les 1,5 à 5 s. Onglet caché : tout se met en pause.

### Les réglages

Dans la fenêtre ⚙️ Réglages (`Reglages.tsx`) : **🔊 Son : oui / 🔇 non** coupe les bruitages, **🎵 Musique : oui / non** coupe la musique et l'ambiance (en douceur, 0,3 s). Les deux sont actifs par défaut, indépendants, et gardés par `stockage` (`src/stockage.ts`) sous `idle-miner-son` et `idle-miner-musique` (`actif` / `coupe`). Pendant une publicité, `couperPourPub` met tout le son en pause.

## 10. L'application installable (PWA)

Pas de service worker ni d'installation dans la version CrazyGames (`AVEC_INSTALLATION` dans `src/portail.ts`).

- **Le manifeste** (`public/manifest.webmanifest`) : « Mega Digger », la description « Creuse, embauche des taupes mineuses et automatise ta mine avec des rails électriques. », `lang` fr, `start_url` et `scope` relatifs (`./`), `display: standalone`, `orientation: portrait`, couleurs `#8fd36f`, catégorie games, icônes 192, 512 et 512 « maskable ». `index.html` ajoute `theme-color` `#8fd36f`, l'icône Apple, les balises « web app capable » et `viewport-fit=cover` (le jeu va sous l'encoche, avec des marges `env(safe-area-inset-*)`).
- **Les icônes** (`public/favicon.svg`, `public/icones/*.png`, refaites le 25/10) : Pépite, la taupe mineuse (`images/personnages/mineur.svg`), sur un fond bleu ciel au gros contour d'encre. Les PNG (192, 512, « masquable » 512 sans bord, et 180 pour l'iPhone) sont des captures du SVG.
- **Le service worker** (`public/sw.js`), enregistré seulement en production (`enregistrerServiceWorker`, `src/installation.ts`), avec `updateViaCache: 'none'`. Cache **`idle-miner-v68`** : changer ce nom vide le cache de tous les joueurs (à faire quand la police d'icônes change, par exemple). À l'installation, il ne range que le strict nécessaire (`FICHIERS_DE_BASE` : la page, le manifeste, la police d'icônes, le favicon, `cash.mp3`, les icônes 192 et 512) ; les images (bâtiments, personnages, arbres, rails) sont rangées la première fois qu'elles sont chargées : la liste ne casse plus quand une image change de nom. Les chemins sont relatifs au dossier du jeu. Seules les requêtes GET de notre site passent par lui (Supabase n'est jamais mis en cache) :

| Requête | Stratégie |
|---|---|
| la page | **réseau d'abord** (la dernière version), gardée en cache ; sans réseau, celle du cache. Les fichiers de `assets/` que la nouvelle page n'utilise plus sont retirés |
| `assets/*` (le nom change à chaque version) | **cache d'abord** |
| le reste (images, police, icônes...) | **cache, puis mise à jour** en arrière-plan |

- **Proposer l'installation** (`src/installation.ts`, `useInstallation`) : sur Android, Chrome et Edge, l'invitation `beforeinstallprompt` est gardée pour le bouton « Installer » ; sur iPhone et iPad, on explique le bouton Partager ; déjà installé, rien n'est proposé. La carte est décrite dans [interface.md](interface.md).

## 11. La fluidité : les règles à respecter

- **Aucun filtre, déplacement ni animation sur l'image d'un bâtiment** (29/10) : le navigateur la mettait à part, dessinée à une autre échelle que la carte zoomée, et **elle devenait floue**. Le survol, le bâtiment ouvert et le générateur allumé se voient au sol ou à côté, jamais sur l'image. Pas d'ombre en filtre non plus (26/10 : recalculée à chaque image, elle faisait ramer).
- **Les animations des personnages passent par des variables CSS enregistrées** (23/10) : `@property --p-x, --p-y, --p-r, --p-sx, --p-sy, --p-o` dans `village.css`, au lieu de `translate` / `rotate` / `scale` / `opacity`. Un personnage animé qui passait derrière un bâtiment poussait le navigateur à mettre l'image du bâtiment à part (le forgeron devenait flou au hasard). **Règle** : au village, une animation dans les objets (personnages, halos, petites bulles) passe par ces variables.
- **N'animer que de petites choses** : jamais `stroke-dashoffset`, `box-shadow`, `filter` ou la position d'un grand dessin. C'est pourquoi l'écume et les vagues du rivage, le rayon du générateur et les pointillés des bâtiments sont **immobiles** (23/10 : l'eau qui bougeait faisait redessiner une très grande image 60 fois par seconde, de loin ce qui ralentissait le plus) ; les reflets de la mer scintillent par petits pas.
- **Ce qui ne change jamais est figé en image** (`ImageFigee.tsx`, 26/10) : le terrain et le sol de la plage. **Le décor autour de la clairière** (la lisière, les collines, les montagnes) est en tuiles, elles aussi changées en images (25/10 : quand c'étaient des canvas affichés, chacun était une couche à part, recopiée à chaque image). Pendant qu'on fait glisser la carte, elle est gardée prête (`.couche-rapide`, `will-change`), puis redessinée nette après un zoom.
- **Rien d'animé sous le décor** (25/10) : un dessin qui bouge (et a sa propre couche, comme l'eau de la mer, `EauPlage`) oblige le navigateur à mettre à part tout ce qui est dessiné après lui et le chevauche. L'eau de la mer passe donc après le décor du fond (ils ne se touchent jamais).
- **Mesure du 25/10, le soir** (forêt remplacée par les montagnes, tuiles en images, l'eau après le décor) : avec Playwright et le processeur ralenti 4 fois, le village (partie de 8 h, au zoom de départ) passe d’environ **10-12 à 19-26 images par seconde** sur ordinateur, de 14-15 à 20-23 sur téléphone ; le navigateur passe de 188 à 153 couches. Ce qui coûte le plus maintenant : les animations de la plage (35 reflets, chacun sa couche) et l'ambiance (papillons, oiseaux, ombres des nuages).
- **Mesure du 25/10** (village redessiné en SVG plats) : avec Playwright et le processeur ralenti 4 fois, le village est passé d'environ **8 à 17 images par seconde** (le coût de peinture et de rastérisation divisé par deux) ; sans ralentir, environ 55 à 60.
