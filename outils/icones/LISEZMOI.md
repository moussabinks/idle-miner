# Les icônes cartoon (27/10)

Le jeu écrit ses icônes avec des emojis (⛏️, 📦, 💰, ⚡...). Sur chaque téléphone ils étaient
dessinés différemment (Apple, Google, Windows). Maintenant, une **police d'icônes** les remplace
tous par nos propres dessins, dans le style plat du jeu (25/10) : un gros contour d'encre
(#2a2140), des couleurs franches à plat, et une seule ombre plate en bas à droite.

C'est une police **en couleur**, en deux formats dans le même fichier (25/10) : **COLR** (des calques de
couleur, pour Chrome, Edge et Firefox) et **SVG** (pour Safari, sur Mac et iPhone : avec COLR seul,
Safari montrait les emojis d'Apple, le fer devenait un boulon 🔩), avec des contours **TrueType**.
Il n'y a rien à
changer dans le code. Partout où un emoji est écrit (boutons, panneaux, messages, bulles du
village), le navigateur prend notre dessin. Elle est déclarée dans `src/icones.css` avec un
`unicode-range` : elle ne sert qu'à ces caractères, le reste du texte garde sa police. Elle est
en tête de `font-family` dans `src/styles/theme.css`.

## Les fichiers

- `formes.py` : les briques (cercle, rectangle arrondi, polygone, chemin SVG, trait épais, union,
  soustraction, relief...), avec skia-pathops ;
- `dessins.py` : le dessin de chaque icône (une fonction par icône, ses couches de couleur) ;
- `fabriquer.py` : fabrique `public/fonts/icones-mega.woff2` et `src/icones.css`.

## Ajouter ou changer une icône

1. Dessiner l'icône dans `dessins.py` (un carré de 100 × 100, y vers le bas ; le contour et
   l'ombre sont ajoutés tout seuls), avec `@icone('🎯')`.
2. Lancer :

   ```sh
   pip install fonttools skia-pathops brotli
   python3 outils/icones/fabriquer.py
   ```

3. Changer le numéro du cache dans `public/sw.js` (sinon l'ancienne police reste sur les
   téléphones qui ont installé le jeu).

Un emoji qui n'a pas de dessin reste l'emoji du système : penser à le dessiner quand on en
ajoute un dans le jeu. Les flèches et symboles de texte (→, ★, ✦, ▶) restent du texte.

## Les icônes en images (25/10)

`fabriquer.py` écrit aussi les minerais (la liste `ICONES_EN_IMAGE`) en fichiers SVG dans `public/images/icones/` (`u1F529.svg` pour 🔩...), avec les mêmes dessins que la police. Le composant `IconeImage.tsx` les affiche en `<img>` : c'est ce que font les bulles « +1 » qui s'envolent quand on casse un bloc à la mine, car dans ces bulles animées Safari ne prenait pas la police (il montrait les emojis d'Apple). Pour une nouvelle icône en image : l'ajouter à `ICONES_EN_IMAGE` et relancer le script.

## Les minerais bruts, les lingots, les nouvelles gemmes et les bijoux (26/10)

Avec la fonderie et la joaillerie (et les niveaux Saphir, Rubis, Diamant de la mine) :

| Emoji | Ce que c'est | Le dessin |
|---|---|---|
| 🔩 | fer (brut) | (26/10, redessiné) un caillou taillé à facettes (gris, cinq tons) où sortent de grosses pépites anguleuses rose-beige en filon, avec reflet et étincelle |
| 🟡 | or (brut) | (26/10, redessiné) le même caillou taillé, plein de grosses pépites d'or rondes et cabossées (une dépasse presque en haut), des paillettes et trois étincelles |
| ⬜ | lingot de fer | (26/10, redessiné) deux lingots d'acier poli gris bleuté, l'un sur l'autre, vus de trois quarts |
| 🟨 | lingot d'or | (26/10, redessiné) une pyramide de trois lingots d'or vus de trois quarts, avec des étincelles |
| 🔷 | saphir | une gemme taillée en ovale, plus large que haute, bleu roi, avec sa table en octogone et huit facettes (le diamant 💎 est bleu ciel, à cinq côtés) |
| 🔺 | rubis | une gemme taillée en cœur (des côtés droits), rouge cramoisi, avec sa table en petit cœur (la redstone 🔴 est rouge orangé, à six côtés) |
| 📿 | collier d'émeraude | (26/10, redessiné) une chaîne de perles d'or en U (grosses et petites), deux petites émeraudes serties dans la chaîne, et en pendentif la grosse émeraude de 💚 dans un cadre d'or à huit côtés, avec quatre griffes, sa bélière et une goutte d'or |
| 🧿 | pendentif de saphir | (26/10, redessiné) un médaillon d'or au bord festonné, le saphir ovale de 🔷 dans un cercle de perles d'or, quatre petits diamants ronds sur le bord, une bélière et une courte chaîne de maillons |
| 🫅 | couronne de rubis | (26/10, redessiné) une couronne royale : le bonnet de velours rouge derrière, cinq pointes d'or (des perles blanches au bout des grandes), un bandeau gravé avec trois rubis en cœur de 🔺 dans leur chaton et des perles entre eux (👑 reste la couronne du classement) |
| 💍 | bague de diamant | (26/10, redessiné) un solitaire : un anneau d'or vu de biais (plus épais devant), une corbeille à quatre griffes qui tient le diamant de 💎, et deux petits diamants ronds sur les épaules |
| 🏭 | fonderie | un four en briques à la bouche qui rougeoie, sa cheminée qui fume, un lingot d'or |
| 🏪 | joaillerie | une boutique à l'auvent violet, sa vitrine, une gemme en enseigne (💠 est déjà le diamant) |

Le minerai brut (26/10, redessiné) : `_roche_taillee()` fait le caillou (sa face du dessus claire,
les autres faces coloriées par `_facettes()`, de la plus claire en haut à gauche à la plus sombre),
`_pepite_taillee()` une pépite de métal comme une bille à plat (un creux sombre autour, sans lui on
ne la voit plus à 16 px ; un bord clair en haut à gauche, l'ombre en bas à droite, un gros reflet
presque blanc) et `_blob()` le contour cabossé des pépites d'or. Le métal couvre presque la moitié
du caillou : à 16 px on voit d'abord sa couleur (rose-beige `FER_TONS`, jaune `OR_TONS`), pas la
pierre grise 🪨. Les lingots : `_lingot()`, un tronc de pyramide placé en 3D (longueur u,
profondeur v, hauteur z) puis projeté ; on voit le dessus (avec son poinçon et une bande de lumière
en biais), le bout de gauche, le devant et le bout de droite, du plus clair au plus sombre
(`ACIER_TONS`, `LINGOT_OR_TONS`) ; un trait d'encre autour sépare les lingots empilés. Les facettes des gemmes taillées (saphir, rubis) sont coloriées par
`_facettes()` : une facette par côté de la table, plus claire si elle regarde la lumière (en haut à
gauche). Le saphir et le rubis ont aussi leur forme dans `outils/art/formes.mjs`
(`minerai('saphir')`, `minerai('rubis')`).

Les bijoux (26/10, redessinés : avant, on aurait dit des emojis d'Apple) sont de vrais bijoux de
luxe. Leur or a quatre tons à plat (`_or()` : bord clair en haut à gauche, couleur, ombre en bas à
droite, et un brun doré `OR_CREUX` pour les creux), avec des petits reflets presque blancs. Les
briques : `_boule_or()` (une perle d'or), `_perle()` (une perle nacrée), `_brillant()` (un petit
diamant rond serti, ses facettes faites par `_facettes()`), `_emeraude_petite()` et
`_diamant_taille()` (💚 et 💎 en plus petit) ; le saphir et le rubis sont `_saphir()` et `_rubis()`.
Chaque bijou garde une silhouette différente pour se lire à 16 px : un U et une gemme verte, un
médaillon rond et bleu, une couronne, un anneau.

## La poubelle 🗑️ (26/10, redessinée)

La poubelle des boutons roses « Enlever » et « Retirer » est une vraie poubelle de métal gris bleuté vue de
trois quarts (avant : un seau gris tout plat, comme l'emoji). Le seau est un tronc de cône :
`_seau_point(theta, t)` donne un point de sa surface (theta fait le tour par devant, t descend) et
`_seau_morceau()` un morceau de cette surface. Avec eux : cinq tons à plat (`POUBELLE_TONS`, clair à
gauche, sombre à droite, comme un cylindre), six cannelures verticales (un creux sombre et un fil de
lumière, plus serrées sur les côtés), un rebord en haut et un cerclage en bas, le dedans tout noir
(`POUBELLE_CREUX`). Le couvercle bombé, avec sa poignée en arceau, est soulevé à gauche (il tourne
autour de son bord droit), séparé du seau par un trait d'encre ; dessous dépasse une boule de papier
froissé crème, à facettes (`_facettes()`, comme les gemmes) avec ses plis. Le gris bleuté se détache
bien sur le rose du bouton (`btn-rose`), le crème, et le bleu nuit.
