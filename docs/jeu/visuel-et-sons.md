# Le visuel et les sons de Mega Digger

> Le style graphique, les animations, le décor, les bruitages, la musique et l'application installable (PWA).
> Écrit d'après le code au 22/10, après la refonte de la **mine automatique** (plus de vue de la mine en coupe), mis à jour le 27/10 et le 30/10 (bonus de combo, jauge de la pioche, animation d'embauche, aperçu des rails, fenêtre du retour) : `src/index.css`, `src/blocs.css`, `src/effets.css`, `src/personnel.css`, `src/accueil.css`, `src/village.css`, `src/composants/*.tsx` (dont `iso.ts`, `DessinsVillage.tsx`, `VueVillage.tsx`, `PanneauMine.tsx`, `sprites.ts`, `SceneAccueil.tsx`), `src/sons.ts`, `src/ambiance.ts`, `src/installation.ts`, `public/` (dont `public/images/`). Les règles du village sont dans [village.md](village.md). Ce que fait chaque bouton est dans [interface.md](interface.md).

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
  - les **bâtiments** : `public/images/batiments/*.webp` (marché, forgeron, bazar, Personnel, foreuse, générateur, et l'image des rails pour le menu), des dessins en vue isométrique au fond transparent, chacun posé sur une dalle de 5 × 5 pavés, et la **mine** (`mine.webp`, avec son calque `mine-devant.webp` et les caisses de l'ascenseur `caisse-ascenseur-0` à `-4.webp`), calée sur 10 × 10 cases. Le Personnel a une seconde image, `employes-miroir.webp`, pour quand il est retourné (§ 7.3). Chacun est **calé sur la grille** par une matrice CSS, sans déformation (`CALAGES`, `transformationSprite` dans `iso.ts`) ; une ombre douce au sol (`ombre-batiment`) l'ancre sur l'herbe. Les dessins de l'enchanteur et de l'arbre de prestige restent dans le dossier, mais ne servent plus ;
  - les **portraits** du mineur, du manager et du recruteur : `public/images/personnages/*.webp` (sur l'accueil et dans le panneau du Personnel) ;
  - **les personnages** : `public/images/personnages/sprites/*.webp`, découpés dans les planches de l'équipe (voir [§ 4](#4-les-personnages--des-hamsters)).
- Tout le reste du village est **dessiné en SVG dans le même style** (bois, pierre grise, coins dorés, lanternes) : la cabine et le panneau de la mine, le **rayon du générateur**, les chemins de pavés, les dessins de décor (`DessinsVillage.tsx`, `VueVillage.tsx` ; depuis le 27/10 ils ne s'achètent plus et ornent seulement la plage et l'accueil), la plage. Les **rails** et les **wagonnets** sont, eux, en vraie 3D (voir le § 7.3).
- **En CSS** : les **blocs** (le gros bloc à cliquer, et les petits blocs des jauges, du chariot et des statistiques), les éclats, les minerais qui s'envolent, les ventes, les bulles. Les autres icônes sont des **émojis** (choix du 19/10 : style cartoon, « pas de pixel art, pour ne pas ressembler à Minecraft »), affichés avec notre police d'icônes cartoon (`public/fonts/icones-mega.woff2`, dessins dans `outils/icones/dessins.py` ; le 29/10 : ⭐ / 🌟 pour le niveau du joueur, une étoile dorée, et 🎉 pour le passage de niveau, un cornet violet d'où sortent des confettis ; le 30/10 : 🍀, un trèfle vert à quatre feuilles, pour le bonus de combo « Fortune »).
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
- **Le bois et l'or** : le menu Bâtiments, les panneaux des bâtiments et tout l'accueil reprennent les couleurs des images (bois `#8a5a2b`, `#4a2c12`, `#3a2210`, filets et clous dorés `#c8962e`, texte doré `#ffe19a`).
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

Le haut du panneau de la mine (`BlocACliquer` dans `PanneauMine.tsx`, refait le 27/10), sous le titre « Niveau *N* · *nom* » :

- **Le cadre** : une zone sombre comme une galerie (dégradé radial brun `#4a3522 → #1d140c`, ombre intérieure, bord doré très léger), avec le bloc **au milieu** et le texte **dessous**, en colonne (« 👆 ⚫ Charbon », la chance de doubler). Le bord doré et une lueur orange s'allument avec le **combo** (variable CSS `--ardeur`, de 0 à 1).
- **Le bloc** : un très gros galet de **150 px** (le dessin des blocs ci-dessus), posé sur un **halo doré** (`.halo-bloc-mine`) qui grandit avec le combo. Chaque nouveau bloc « **pousse** » à sa place (il grandit de 60 % à 100 %, 0,18 s, `bloc-pousse`). Au clic, il **s'enfonce** un peu (92 %).
- **Pioche cassée** : après le premier clic, le bloc est **fissuré** (deux traits noirs en travers, `.bloc-fissure`).
- **Coffre plein** : le bloc est **grisé** et assombri, et le curseur dit qu'on ne peut pas cliquer.
- **Les éclats** (`.eclats-bloc-mine`) : 5 petits cailloux de la couleur du bloc qui volent de tous les côtés en tournant puis retombent (0,55 s, `eclat-saute`). Au plus 5 séries à la fois.
- **Ce qui tombe** (`.trouvaille-bloc-mine`) : une pastille « +1 ⚫ » qui monte au-dessus du bloc et s'efface (1,5 s, `trouvaille`). Doublé : « +2 💎 ×2 ! », **en doré**, plus grande, bordée et éclairée d'or (`.trouvaille-double`). Au plus 4 à la fois.
- **Le combo** (27/10) : les clics à moins de 0,9 s d'écart s'additionnent ; dès 3, une pastille orange « 🔥 ×*N* » en bas à droite du bloc saute à chaque clic (`.combo-mine`, `combo-saute`), plus grosse et dorée dès 25 (`.combo-gros`) ; dès 10, le bloc a un liseré doré (`.zone-en-feu`). Un son à chaque palier (`sons.combo`, § 8.1). Depuis le 30/10, chaque palier donne aussi un **bonus de combo** (voir [mine-et-minage.md](mine-et-minage.md)) : une **étiquette dorée** au-dessus du bloc (`.bonus-combo`) arrive en rebondissant (`bonus-arrive`, 0,5 s), avec l'emoji et le nom du bonus et, en petit, son effet et les secondes qui restent ; le bloc brille pendant le bonus (`.zone-bonus`). Sans bonus, dès 3 clics : une ligne discrète « Prochain bonus à ×*N* » (`.bonus-prochain`).
- **La jauge de la pioche** (30/10, `.jauge-pioche`) : sa couleur va **du vert (neuve) à l'orange puis au rouge** (presque cassée), en continu (variable `--teinte` de 120 à 0, posée par `PanneauMine.tsx`, un dégradé `hsl`). Sous **15 %**, elle **clignote**, grossit un peu et s'entoure de rouge (`.pioche-usee`, `pioche-alerte`, 0,7 s ; figée si le système demande moins de mouvement). La jauge de la pioche du bandeau suit la même couleur (`hsl(teinte 78% 50%)`).
- **Le tableau de production** (27/10, `.tableau-production`) : juste dessous, une carte en bois sombre : le total en gros chiffres dorés (« 1,2 blocs/s ») et « ≈ *X* $/min », trois cases (⚙️ Mine, 👷 Mineurs, 👆 Toi, qui s'allume quand tu cliques), puis une ligne par mineur (`.rendement-mineur`) avec une barre de la couleur de sa rareté. Coffre plein : le total passe au gris (`.production-arretee`).
- **La barre du coffre**, plus bas, est plus grosse (`.barre-coffre-mine`).

---

## 4. Les personnages : des hamsters

Tous les personnages sont des **hamsters** : des **images** tirées des planches de chaque personnage fournies par l'équipe (vues DEVANT, DERRIÈRE, GAUCHE, DROITE), découpées en une image par vue, détourées (`public/images/personnages/sprites/`, 26 images). On montre la vue qui va avec le sens de la marche, ce qui donne l'impression d'un personnage en volume. Le calage (taille de chaque image, point entre ses deux pieds) est dans `src/composants/sprites.ts` : `spritePerso(qui, vue)` donne l'image, `ECHELLE_SPRITE` = 46 / 370.

| Qui | Images |
|---|---|
| **Le joueur** | il n'a **pas encore de planche à lui** : il prend celle du mineur, avec le **casque jaune** d'origine (`joueur_devant`, `_derriere`, `_gauche`, `_droite`) |
| **Un mineur employé** | la même planche, le **casque recoloré à la couleur de sa rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique) : `mineur_<rareté>_<vue>` |
| **Le manager** | seulement sa vue de face (`manager_devant`) : il reste à son poste |
| **Le recruteur** | seulement sa vue de face (`recruteur_devant`) |

Les **tenues du Bazar** (chapeaux, hauts), qui ne se voyaient que dans un aperçu avec l'ancien hamster en SVG, sont **retirées le 27/10** (avec `PanneauTenues.tsx` et `Hamster.tsx`). Il faudra une planche du joueur de l'équipe.

### 4.1 Au village : `Perso` (`ElementsVillage.tsx`)

- `Perso` reçoit `qui` (joueur, rareté du mineur, manager ou recruteur) et choisit l'image selon le sens de la marche (`choisirVue`) : vers la **droite** de l'écran → vue « droite » ; vers la **gauche** → « gauche » ; il **s'éloigne** → « derrière » (en miroir s'il part vers la gauche) ; **à l'arrêt** → « devant ».
- L'image est posée **les pieds sur son point de la grille**, avec une ombre ovale douce (dégradé), un fin contour sombre et une ombre portée : il se détache bien de l'herbe.
- **Le joueur** (23/10) a en plus un **liseré de lumière chaude** et un **anneau doré** en pointillés sous les pieds qui brille doucement (comme le héros de Clash of Clans). Quand on touche la carte, un **repère doré** (deux anneaux qui se resserrent) marque l'endroit où il va.
- **En marchant** : un pas toutes les 0,34 s ; à chaque pas il **s'écrase** en touchant le sol et **s'étire** en remontant (comme un dessin animé), en se dandinant ; il **penche** de 4° vers où il va, et de **petits nuages de poussière** partent en arrière de ses pieds. **Au repos**, il respire doucement (2,4 s).
- **Saut** (barre d'espace) : il s'écrase, monte de 26 px en s'étirant, retombe et s'écrase encore (0,5 s) ; son ombre rétrécit et pâlit pendant qu'il est en l'air.
- **Pas payé** : il tape du pied (0,4 s) sous une bulle 😠 qui saute.
- **Pousseur** : le joueur (ou le pousseur de ce trajet) est dessiné **juste derrière le wagonnet**, à 1,15 case le long de la voie (`RECUL_POUSSEUR`), tourné dans le sens où il roule, et marche avec lui. **Au quai** (26/10), un pousseur attend **au bord de la voie**, à côté du début des rails de son trajet (devant le bâtiment de départ) ; s'il y en a plusieurs, ils se rangent le long de la voie.
- Une étiquette porte le prénom des mineurs (bord de la couleur de leur rareté), ou « Manager » / « Recruteur » en doré.

**La marche du joueur** (`useJoueurVillage.ts`, 23/10) : il prend de l'**élan** au départ (30 cases/s²) et **freine** en arrivant, au lieu de démarrer et de s'arrêter d'un coup. Quand on touche la carte, son chemin (calculé case par case) est **lissé** : il va en ligne droite jusqu'au point le plus loin qu'il voit sans toucher un bâtiment, au lieu de faire des escaliers. Il ne change d'image (devant, derrière, gauche, droite) que si le mouvement va nettement d'un côté : plus de « clignotement » dans les virages.

---

## 5. Les animations et effets

### 5.1 L'argent (`effets.css`, `Gains.tsx`)

| Effet | Quand | Description |
|---|---|---|
| **Grosse vente** | chaque vente du joueur (marché, chariot de la foreuse) | « +*X* $ » en grosses lettres jaunes contournées de brun, au milieu en haut : apparaît en grossissant, se pose, monte et s'efface (1,8 s), avec une **gerbe de 12 pièces** dorées |
| **Petit gain** | argent qui n'est ni une vente du joueur ni une vente de wagonnet | « +*X* $ » doré qui monte et s'efface (1,2 s), en haut au milieu de l'écran (`.gains-village`) |
| **Vente au marché** (27/10) | un wagonnet vend au marché (événement `'wagonnet'`, `ventesMarche` dans `usePartie.ts`) | **au-dessus du bâtiment Marché**, sur la carte : un gros « +*X* $ » doré qui jaillit en grossissant, se pose avec un petit rebond, monte et s'efface (2,2 s, `.vente-marche`) ; derrière, un **éclair de lumière** qui s'élargit, et une **gerbe de 10 pièces** en éventail vers le haut (`.piece-marche`). Au plus 3 à la fois |
| **Compteur qui défile** | toute variation d'au moins 5 $ | l'argent du bandeau défile jusqu'à la nouvelle somme en 0,6 s |
| **Compteur qui saute** | chaque vente | grossit à 130 % en virant au jaune lumineux (0,5 s) |

### 5.2 Les alertes et repères

| Effet | Description |
|---|---|
| Coffre ou sac plein | la case Mine ou Sac du bandeau a une bordure rouge, tremble et s'entoure d'un halo rouge (en boucle) |
| Jauge du coffre au-dessus de la mine (27/10) | toujours là : « 📦 *n* / *capacité* » sur une barre **verte**, **orange** dès 75 % (`jauge-haute`), **rouge** et qui grossit puis rétrécit en boucle quand le coffre est plein (`jauge-pleine`) ; figée si le système demande moins de mouvement |
| Combo du bloc de la mine (27/10) | dès 3 clics rapides, une pastille orange « 🔥 ×*N* » saute à chaque clic (`combo-saute`), plus grosse et plus dorée à partir de 25 ; le cadre du bloc et un **halo doré** (un dégradé, sans flou) brillent de plus en plus jusqu'à un combo de 50 (`--ardeur`) ; à partir de 10, le bloc a un liseré doré (`zone-en-feu`) |
| Bonus de combo (30/10) | étiquette dorée qui rebondit au-dessus du bloc (`.bonus-combo`), bloc qui brille (`.zone-bonus`) |
| Pioche presque cassée (30/10) | jauge du vert au rouge ; sous 15 %, elle clignote et grossit (`.pioche-usee`), et la case ⛏️ du bandeau passe en alerte |
| Mission faisable tout de suite | bordure verte, halo vert qui pulse (1,6 s) ; mission accomplie : ✔, texte barré et son de succès |
| Bulles de notification du village | sautent de 6 px en grossissant un peu (0,9 s), couleur selon la sorte (voir [§ 7.4](#74-les-bulles-de-notification)) |
| Pastille du bouton 🏗️ Bâtiments, ruban « Nouveau ! » du menu | sautent (0,8 s) |
| Bâtiment actif | losange de son emprise, doré, en tirets dorés qui défilent (1 s) (`.emprise-active`). Depuis le 29/10, plus de lueur sur l'image : elle devenait floue |
| Bâtiment survolé à la souris (29/10) | un losange blanc doré au sol, sur son emprise (`.emprise-survol`) ; l'image du bâtiment ne bouge pas |
| Niveau du joueur gagné (29/10) | le badge violet du ⭐ dans le bandeau grossit à 160 % puis revient, avec un rebond (0,7 s, `niveau-gagne`) ; toast doré « 🎉 Niveau *N* ! » |
| Mineur pas payé | tape du pied, bulle 😠 qui saute |
| Carreaux de niveau | le dernier carré acheté fait un « pop » (0,45 s) |
| Toast | apparaît avec un rebond (0,35 s) ; depuis le 30/10, toujours au même endroit, panneau ouvert ou non |
| Aperçu du rail (30/10) | pendant la pose à la souris, le rail (ou le pavé) suit le pointeur, à demi transparent, sur un losange vert (on peut le poser) ou rouge (`.apercu-pinceau`) |
| Marché, sac vide (30/10) | le 🎒 se balance doucement (`sac-vide`, 1,6 s) au-dessus de la liste des prix |

### 5.3 Les grands moments (`personnel.css`)

- **Révélation d'une recrue** (`RevelationRecrue.tsx`) : pendant 1,6 s, le fond change de couleur toutes les 0,08 s (les 5 raretés) et la carte tremble en grossissant ; puis elle **se retourne en 3D** (0,55 s), rayons de la couleur de la rareté, confettis (24 + 18 × rang), **flash** plein écran pour légendaire et mythique, halo qui pulse, bouton arc-en-ciel avec un reflet qui passe.
- **Une embauche au village** (30/10, `village.css`, `VueVillage.tsx`) : au Personnel, une **gerbe d'étincelles** (des rayons dorés qui tournent, `.eclat-embauche-rayons`, et 10 étincelles qui partent en étoile) avec « 👷 *Nom* arrive ! » ; puis le nouveau mineur part vers la mine avec un **halo doré** qui pulse sous ses pieds, une traînée d'étincelles et une bulle « ✨ Nouveau ! » (`.perso-nouveau`, `.bulle-nouveau-mineur`), pendant 6 s.
- **La fenêtre du retour** (30/10, `FenetreAbsence.tsx`, `.fenetre-absence`) : elle arrive en grossissant avec un rebond (`absence-arrive`, 0,45 s), un soleil derrière le titre, les lignes glissent l'une après l'autre depuis la gauche (`absence-ligne`, 120 ms d'écart), et l'argent gagné grossit doucement en boucle (`absence-argent`) ; tout est figé si le système demande moins de mouvement. « 💰 Tout récupérer ! » joue la grosse animation et le son d'une vente.
- L'écran de victoire, la fête du prestige et l'arbre de prestige n'existent plus (archivés dans `archives/prestige/`) ; quelques-unes de leurs animations restent dans `effets.css` sans servir.

---

## 6. L'écran d'accueil (`accueil.css`)

Dans la même direction artistique que le village (bois, or, lanternes) :

- **Le fond de la page** : un dégradé brun très sombre avec une lueur verte en haut, fixe. L'accueil a son propre empilement (`isolation: isolate`) pour que ce fond passe devant celui de la page.
- **Le bandeau « héros »** : un cadre en bois sombre (`#4a2c12`, 5 px) avec un filet doré à l'intérieur, coins de 22 px. Dedans, **un petit village vivant** (`SceneAccueil.tsx`) dessiné exactement comme dans le jeu (mêmes images, mêmes dessins SVG, mêmes personnages) :
  - la mine, les bâtiments (générateur compris ; le marché et le forgeron retournés), 27 décorations (ses propres dessins de décor, `DECORATIONS_SCENE` : fontaine, statue, cerisiers, sapins, arbres, lanternes, tonneau, caisse, banc, rocher, buissons, fleurs), un bout de rails avec un virage et des chemins de pavés ;
  - 4 mineurs (légendaire, épique, rare, mythique) qui font des **allers-retours** entre la mine et le marché, la forge ou le Personnel (2,2 cases/s, une pause de 1,2 s à chaque bout, un sac de minerais sur le dos vers le marché), un **wagonnet** (en 3D, plein de minerais, 26/10) qui fait la navette sur les rails, le joueur immobile devant la mine, le manager et le recruteur devant le Personnel ;
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
| 1 | **Terrain** (`TerrainVillage`, un SVG dessiné une seule fois) | le sous-bois sombre, une auréole d'herbe floue, le **damier**, à peine visible depuis le 24/10 (`#83bf3e` / `#7eb83a`), dont le bord s'efface dans l'herbe ; par-dessus, une **texture d'herbe** qui se répète sans couture (`public/images/sol/herbe.webp`, 256 px), une soixantaine de grandes **taches** très floues (soleil, herbe haute, herbe sèche, `TachesHerbe`), et les petits détails de l'herbe : touffes, brins, fleurs, trèfles, petits cailloux ombrés et champignons rouges à pois blancs |
| 1 bis | **Forêt derrière** (tuiles de canvas) et **plage** | les arbres du haut et des côtés ; le sable (texture `sable.webp`) et la mer |
| 2 | **Sol** (`sol-village`, un SVG de la taille du monde) | les ombres des bâtiments, les chemins de pavés, les rails, le losange en tirets dorés du bâtiment actif, le **rayon du générateur**, le losange vert ou rouge de ce qu'on pose, et la **grille de construction** (`GrilleConstruction`, 24/10) : de fines lignes blanches sur les cases, seulement quand on pose ou déplace quelque chose, ou qu'on peint des rails ou des chemins |
| 3 | **Objets** | bâtiments, mine (et sa cabine), personnages, wagonnets, triés par profondeur |
| 3 bis | **Forêt devant** (`z-index` 90 000) | les arbres du bas de la carte, devant tout le reste |
| 3 ter | **La vie du village** (`AmbianceVillage.tsx`, `z-index` 99 990, 23/10) | des **papillons** de couleur qui font des boucles en battant des ailes, des **vols d'oiseaux** qui traversent le ciel avec leur ombre sur l'herbe, et l'**ombre des nuages** qui glisse lentement sur la carte. Tout en CSS, aux mêmes places à chaque fois (hasard à graine fixe) |
| 4 | **Bulles** (`z-index` 100 000) | les bulles de notification, la jauge du coffre au-dessus de la mine et les « +*X* $ » des ventes au marché (27/10), toujours devant tout |

### 7.3 Les dessins

- **Les bâtiments** : les images calées sur la grille, avec une ombre portée douce. **Retournés** (bouton ↔), l'image est d'abord mise en miroir puis calée de la même façon. **Les écritures restent lisibles** (27/10) : pour un bâtiment qui a du texte peint (pour l'instant seulement l'enseigne « HIRING » du Personnel), on utilise une image toute prête, `employes-miroir.webp`, où chaque panneau à texte est **déjà retourné sur place, avec sa pente inversée** ; une fois toute l'image retournée, le panneau revient à l'endroit, penché dans le bon sens. Elle est fabriquée par `outils/batiments/textes_miroir.py` (Pillow ; les panneaux de chaque bâtiment y sont décrits par leurs bords et leur pente) et choisie par `imageBatiment(id, miroir)` (`IMAGES_BATIMENTS_MIROIR` dans `iso.ts`). Depuis le 29/10, l'image d'un bâtiment n'a **plus aucun filtre, déplacement ni animation** (avant : lueur dorée au survol et quand il était ouvert, la foreuse qui vibrait, le générateur qui brillait) : le navigateur la mettait à part, dessinée à une autre échelle que la carte zoomée, et elle devenait **floue**. Le survol et le bâtiment ouvert sont montrés **au sol**, par un losange (`.emprise-survol`, `.emprise-active`) ; le générateur qui donne du courant a toujours ses **petits éclairs** au-dessus de lui. Ce qu'on pose (le fantôme) est un peu transparent et pulse ; il **rougit** quand la place est prise.
- **La mine** : l'image fournie (`mine.webp`), et par-dessus ce qui **évolue** (`DessinEvolutionMine`, en SVG, placé à partir de points de l'image, `POINTS_MINE`, miroir compris) :
  - **la caisse de l'ascenseur** (23/10, dessin de l'équipe « caisse-ascenseur-design » : `caisse-ascenseur-0.webp` vide, puis `-1` à `-4` pleines des minerais du niveau de la mine : pierre-charbon-fer, + redstone (niveaux 2 et 3), + or et émeraude (niveau 4), + diamant (niveau 5)), pendue aux deux câbles du treuil : quand un mineur remonte son sac, elle **monte pleine tout en haut**, sous le treuil, y reste pendant qu'il la vide, puis **redescend vide, doucement, jusqu'à disparaître** dans le puits (sans rien à porter, elle attend au fond, cachée), à **deux câbles** (gris en pointillés sur un trait sombre) qui partent du treuil. Elle **suit le premier mineur qui monte ou descend** (`hauteurCabine` : 0 = en haut, 1 = en bas, selon l'avancée de son trajet) et attend en haut le reste du temps. En bas, elle passe derrière la barrière et le sol de devant (`mine-devant.webp`, dessiné par-dessus). Depuis le 30/10, l'ascenseur est là dès le début, et **la caisse pleine reste en haut, dans la cabine**, pendant qu'un mineur la vide dans le coffre (avant, l'ascenseur semblait disparaître pendant le déchargement). Sans ascenseur (une vieille partie, avant sa conversion), les câbles pendent au fond du puits ;
  - **un panneau en bois** planté sur le sol de devant, à gauche, avec « Niv. *N* ».
- **Les rails** (`RailsDuVillage`, en vraie 3D depuis le 25/10), dans le style du fichier « propriété-rail-design » de l'équipe (Drive). **Un rail se pose sur une case, mais la voie est large de deux cases** : elle déborde d'une demi-case à gauche et à droite. Deux couches (voir `outils/rails/LISEZMOI.md`) :
  - **le talus de terre**, à plat sur le sol, avec quelques petits cailloux (`talus_*.webp`, `outils/rails/talus.py`) : quatre tuiles vues de dessus (tout droit, virage, T, croisement), de 2 × 2 cases centrées sur la case du rail, posées en losange et tournées dans le bon sens. Son bord se fond un peu dans l'herbe ;
  - **la voie, en vrai modèle 3D** (`voie_*.webp`, `outils/rails/modele3d.py`, un petit moteur de rendu en Python) : des traverses en bois en volume (enfoncées dans le talus, avec leur grain), sur chacune une selle d'acier et deux tire-fonds, et des rails qui ont un vrai profil (le patin, l'âme, le champignon au dessus poli). Le modèle est éclairé comme les bâtiments (lumière en haut à gauche), avec une **ombre portée** sur le talus calculée depuis la lumière, un reflet sur l'acier et un contour foncé. Une image par forme de case (16 : tout droit dans les deux sens, 4 virages, 4 T, le croisement, 4 bouts de ligne et le rail tout seul), rendue dans la vue du jeu ; on les pose de la plus loin à la plus proche. Le **T** : la ligne continue d'un côté, **deux rails en L** de l'autre, un **plancher en bois** au centre. Le **croisement** : **quatre rails en L** (les rails ne se croisent jamais) et un plancher.

  **Les butoirs** (26/10) : au **bout d'une ligne** (un rail qui n'a qu'une voisine et qui ne touche pas de bâtiment), la voie s'arrête sur un **butoir en 3D** : une traverse double, deux poteaux en bois tenus par des jambes de force, une grosse poutre peinte en **rouge et blanc**, et deux **tampons d'acier** tournés vers la voie ; les rails s'arrêtent juste devant (`voie_fin_n`, `_e`, `_s`, `_o` : le côté où la voie s'arrête). Un **rail tout seul** en a deux, un à chaque bout (`voie_seul_ns`). Un bout de ligne n'est jamais le bras d'un virage doux : il garde son butoir.

  **Les virages doux** (25/10) : un virage entre deux lignes droites est remplacé par un grand quart de cercle de rayon 1,5 case sur ses trois cases (`talus_doux`, une tuile de 3 × 3 cases ; `voie_doux_*`, rendue dans un carré de 2 × 2 cases, avec sept traverses), et le wagonnet le suit (`traceDeLaVoie`). Les cases au bord de la voie sont interdites aux bâtiments (voir [village.md](village.md)).

  On n'achète que des rails : chaque case **choisit toute seule** son dessin selon ses voisines (`raccordsRail`), en tournant la tuile d'un quart de tour si besoin : seule → tout droit avec **deux butoirs** ; une voisine → tout droit vers elle, avec un **butoir** de l'autre côté (`codeDeVoie` donne `fin_<côté libre>` ou `seul_ns`) ; deux voisines en face → tout droit ; deux voisines à angle droit → **virage** ; trois voisines → **T** ; quatre → **croisement**. Un bout de ligne collé à la mine, au marché, à la foreuse ou au générateur se raccorde à lui ; un rail qui passe le long d'un bâtiment, non. Le **wagonnet suit la voie** (ses roues posées sur les rails) : tout droit au milieu des cases, en quart de cercle dans les virages (`traceDeLaVoie` dans `iso.ts`). L'image du menu Bâtiments (`images/batiments/rails.webp`) est un morceau droit.
- **Les wagonnets** (`WagonnetVillage.tsx` pour la place sur la voie, `Wagonnet3D.tsx` pour le dessin ; un par trajet depuis le 24/10) : depuis le 26/10, un **wagonnet en 3D**, d'après le fichier « wagonnets-design » de l'équipe (Drive : vide, à moitié plein, plein) :
  - une **caisse en planches de bois**, évasée vers le haut, tenue par un **cadre en acier** : un rebord tout autour du haut, des **plaques boulonnées** sur les coins et des montants d'acier le long des arêtes ; dessous, **quatre grosses roues en fer** posées **sur les rails** (à ± 0,4 case du milieu) ; devant, un **attelage** en acier ;
  - c'est un **vrai petit modèle 3D recalculé à chaque image** : chaque face est un polygone en 3D, projeté dans la vue du village (la même que celle des rails en 3D), et **éclairé** selon la lumière (en haut à gauche), avec un reflet sur l'acier. Il a une **ombre portée** sur le talus et une petite ombre sous chaque roue ;
  - **son chargement** : des **minerais à facettes** de la couleur de ce qu'il porte vraiment (des cristaux pour la redstone, l'or, l'émeraude et le diamant ; des cailloux pour la pierre, le charbon et le fer), chaque sorte en proportion. **Le niveau suit le chargement** (remplissage = objets portés ÷ capacité du wagonnet) : vide, à moitié plein, ou plein avec un **petit tas** qui dépasse du bord. Il est vidé à l'arrivée : au retour et au quai, il est vide ;
  - il est placé **entre ses deux essieux** (`ESSIEUX` = 0,6 case le long de la voie) et regarde de l'un vers l'autre : dans un virage, il **tourne petit à petit**, en douceur, comme un vrai wagonnet ;
  - **électrique**, il a une **lueur jaune** (`.wagonnet-electrique`).

  Pour qu'il roule **bien fluide**, il a sa propre animation à chaque image : le jeu ne donne sa position que 20 fois par seconde, alors entre deux nouvelles, on le fait avancer tout seul à sa vitesse. Son pousseur (le joueur ou le pousseur du trajet) marche derrière lui **le long de la voie** (dans les virages aussi). Quand le joueur commence à pousser, la caméra le suit de nouveau, même si on avait déplacé la carte. (Bug corrigé le 26/10 : `.wagonnet-village` avait une taille fixe de 40 × 34 px qui rapetissait le dessin ; c'est maintenant la taille de son cadre SVG, 80 × 64.) L'écran d'accueil utilise le même wagonnet en 3D (chargé à 80 %).
- **Le rayon du générateur** (`RayonGenerateur`) : un cercle de *R* cases autour du centre du générateur, dessiné comme un polygone de 64 points projeté sur la grille (une ellipse à l'écran). **Pointillés jaunes** (`rgb(255 214 60)`) avec un fond jaune très léger. Quand on est devant le générateur ou qu'on le pose : plus épais, plus visible, et les **pointillés tournent** (`rayon-tourne`, 1,6 s). Sans courant : **gris**. Caché s'il ne donne pas de courant et qu'on ne le regarde pas.
- **Le trajet en surbrillance** (26/10, quand on embauche un pousseur au Personnel) : les cases de ses rails s'allument en **or** l'une après l'autre, comme une vague (`.case-trajet`, `trajet-brille`, 1,4 s), et ses deux bâtiments sont entourés d'un **pointillé doré qui tourne** (`.emprise-trajet`, `trajet-tourne`, 1,2 s). Sans animation si le système demande moins de mouvement (`prefers-reduced-motion`).
- **Les chemins** (`CaseChemin`) : des pavés gris clair sur de la terre beige.
- **Les rochers** (`Rochers.tsx`, 24/10 : `Rocher`, `TasDeRochers`) : un petit **volume à facettes** (low-poly), éclairé d'en haut à gauche comme les bâtiments, avec un contour foncé, des fissures, un reflet sur l'arête éclairée, parfois de la mousse ; dans l'eau, le pied est plus foncé et mouillé. Toujours le même à la même place (une « graine »). Ils servent pour le dessin du rocher, les rochers de la mer, les pierres du feu de camp et les galets de la plage.
- **La plage** (`PlageVillage.tsx`) : le sable a sa texture (`sable.webp`), des rides du vent et une bande mouillée qui brille près de l'eau ; des galets en relief, des algues, du bois flotté, des traces de pas qui partent du ponton et **deux crabes** qui se promènent de côté. **Quand la caméra ne la voit pas** (27/10), ses animations (l'eau `EauPlage`, les objets `ObjetsPlage`) sont mises en pause : le monde reçoit la classe `plage-cachee` (`animation-play-state: paused`) quand aucun des rectangles `BOITES_PLAGE` (`plage.ts`, 24 morceaux le long de la côte en diagonale) n'est à l'écran.
- **Les textures du sol** (`public/images/sol/herbe.webp` et `sable.webp`) sont fabriquées par `outils/sol/textures.py`.
- **Les dessins de décor** (`DessinDecoration`) : fleurs, buisson, rocher (en relief), tonneau, caisse de minerais, lanterne (qui vacille), banc, grand arbre, sapin, cerisier en fleurs, fontaine (son jet pulse), statue du hamster d'or. Depuis le 27/10, on ne les achète plus pour le village : ils servent à la **plage** (caisses, tonneaux, lanterne, rochers, buissons) et au village de l'**écran d'accueil**.
- **Les personnages** : voir [§ 4.1](#41-au-village--perso-elementsvillagetsx).

### 7.4 Les bulles de notification

Refaites le 23/10 : une **médaille ronde** à bord blanc (l'icône de la plus urgente), collée à un ruban avec **deux mots** (« Plein ! », « Achetable »…), une petite pointe dessous, et un badge « +*n* » s'il y a d'autres choses à faire. Elle apparaît avec un rebond (`bulle-arrive`), **sautille** (0,9 s), et un **reflet** passe sur la médaille toutes les 2,6 s. Sa couleur dit la sorte : **rouge** (alerte, avec un **anneau** qui s'élargit comme un radar), **rose** (prêt : du coffre à porter au marché), **bleu** (nouveauté), **vert** (amélioration achetable, avec des **étincelles** dorées). Au survol, elle grossit. La liste est dans [interface.md § 6](interface.md#6-la-carte-du-village-vuevillagetsx).

Pour les z-index de tout le jeu : les fenêtres (`.voile`) sont à 10, le panneau d'un bâtiment sur téléphone à 8, les toasts à 20, la révélation d'une recrue à 30 ; la fenêtre « Passer le tutoriel ? » à 70 (`.voile-devant`, 29/10), pour passer devant le tutoriel.

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
| `venteMarche(montant)` | un wagonnet a vendu au marché (27/10, remplace `pieces(3)`) | la **cloche du marché** (deux notes claires), puis le « ka-ching ! » et la cascade de pièces de `vente` (plus la vente est grosse, plus il y a de pièces) ; à partir de **1 000 $**, une petite **fanfare** de 4 notes qui monte |
| `achat` | un achat sans amélioration (construction, rachat, réparation, embauche…) | « pop » puis deux notes qui montent, et 2 pièces |
| `amelioration` | un niveau de plus (mine, coffre, ascenseur, forage, chariot, générateur, wagonnet, sac, meilleure pioche, recruteur, pioche d'un mineur) : remplace alors `achat` | trois notes qui montent « niveau supérieur ! » |
| `piocheCassee` | la pioche en main casse | « clang » triste |
| `succes` | un succès débloqué, ou (29/10) un niveau du joueur gagné | petite fanfare de 4 notes |
| `suspenseRecrue` | début de la révélation d'une recrue (`RevelationRecrue.tsx`) | roulement de tambour qui accélère et monte (~1,6 s) |
| `revelationRecrue(rang)` | la rareté dévoilée | fanfare **plus grande selon la rareté** : 2 notes (commun) à 6 notes (mythique), pièces, accords, étincelles |

| `pas` | toutes les 0,34 s pendant que le joueur marche (`App.tsx`) | un petit froissement d'herbe |
| `construction` | un nouveau bâtiment est posé (`App.tsx`) | trois coups de marteau sur du bois, puis trois notes |
| `rail` | une case de rails posée au pinceau (`App.tsx`) | un « clang » de métal et la traverse en bois |
| `wagonnet` | un wagonnet passe sur un joint de rail (une fois par case, `WagonnetVillage.tsx`) | « ta-tac », plus doux quand il est électrique |
| `cloche` | un wagonnet arrive au bout de son trajet (`WagonnetVillage.tsx`), **sauf au marché** depuis le 27/10 (là, c'est `venteMarche` qui sonne) | une petite cloche |
| `combo(palier)` | un palier de combo au bloc de la mine : 10, 25, 50, 100, 200, 500 clics rapides (`PanneauMine.tsx`, 27/10 ; depuis le 30/10, il donne aussi un bonus de combo) | un petit arpège qui monte, plus haut à chaque palier |
| `electricite` | on met de la redstone dans le générateur | un grésillement électrique qui monte |

Retirés le 22/10 (avec la mine en coupe, ses blocs spéciaux et le prestige) : `lave`, `coffre`, `geode`, `nouvelleCouche`, `ding` (l'ascenseur), l'ancien `pas` (l'échelle), `talent` et `prestige`.

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

L'ambiance de **grotte** de l'ancienne mine en coupe (gouttes d'eau, cailloux, grondement) a été retirée le 23/10. Quand l'onglet est caché, tout le son est mis en pause et reprend au retour.

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

- Cache **`idle-miner-v22`** (30/10) (changer ce nom vide le cache de tous les joueurs). À l'installation, il range `/`, `/manifest.webmanifest`, `/favicon.svg`, `/icones/icone-192.png`, `/icones/icone-512.png`, et **les images du village** (`IMAGES_DU_VILLAGE` : les 12 arbres, 11 images de `images/batiments/` (mine, les 5 caisses de l'ascenseur, mine-devant, bazar, employes, employes-miroir, foreuse, forgeron, generateur, marche, rails), les 25 tuiles de `images/rails/` (talus, voie, virages doux, butoirs), les 2 textures de `images/sol/` (herbe, sable), les 3 portraits de `images/personnages/`, les 26 images des personnages de `images/personnages/sprites/`). Il prend la main tout de suite (`skipWaiting`, `clients.claim`). À l'activation, il efface les caches d'un autre nom (changer `CACHE` vide le cache de tous les joueurs).
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

## Le relief des décorations et des chemins (24/10)

La lumière vient d'en haut à gauche. `Relief.tsx` donne deux outils : `Boule` (une boule en volume : côté à l'ombre, partie éclairée décalée vers la lumière, reflet) et `OmbreAuSol` (une ombre douce, un peu vers la droite). Les buissons, les feuillages des arbres et les fleurs sont faits de boules ; le tronc a un reflet à gauche et l'ombre du feuillage en haut ; le tonneau est rond (clair à gauche, sombre à droite, douelles, cercles brillants) ; la caisse a une face à l'ombre et ses planches ; le sapin a sa moitié droite à l'ombre ; la lanterne a une vitre brillante ; la fontaine a un bassin en épaisseur et un reflet sur l'eau ; la statue dorée a ses ombres. Les **pavés des chemins** dépassent du sol : un flanc sombre dessous et un bord éclairé.

## Fluidité (23/10)

Mesuré dans Chrome (taille de ce que le navigateur redessine à chaque seconde, sur une grosse partie) :

- **L'écume et les vagues du rivage** ne bougent plus. Elles suivent tout le rivage : à chaque image, le navigateur redessinait toute l'eau (une très grande image), environ **180 millions de pixels par seconde**. C'était de loin ce qui faisait le plus ramer. Après : environ 5 à 15 millions. Les petits reflets de la mer scintillent toujours, par petits pas (`steps`).
- Plus de pointillés qui défilent (le contour doré du bâtiment ouvert, le rayon du générateur, les bâtiments d'un trajet) : ils faisaient redessiner tout le sol.
- Plus de lueur en filtre sur le wagonnet électrique (recalculée à chaque image pendant qu'il roule).
- Les animations dorées du tutoriel bougent par `transform`, sans repasser par React (voir l'interface).
- Règle pour la suite : au village, n'animer que `transform` et `opacity`, sur de petits éléments ; jamais `stroke-dashoffset`, `box-shadow`, `filter` ou la position (`left`, `top`) d'un grand dessin.
