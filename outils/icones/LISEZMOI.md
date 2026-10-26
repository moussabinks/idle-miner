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
| 🔩 | fer (brut) | un caillou gris avec des pépites beige rosé (le minerai de fer de Minecraft) |
| 🟡 | or (brut) | le même caillou, avec des pépites dorées qui brillent |
| ⬜ | lingot de fer | les deux lingots gris (avant, le dessin de 🔩) |
| 🟨 | lingot d'or | la pyramide de trois lingots dorés (avant, le dessin de 🟡) |
| 🔷 | saphir | une gemme en losange, bleu roi (le diamant 💎 est bleu ciel, à cinq côtés) |
| 🔺 | rubis | une gemme taillée en triangle, rouge cramoisi (la redstone 🔴 est rouge orangé, à six côtés) |
| 📿 | collier d'émeraude | une chaîne de perles dorées et une émeraude en pendentif |
| 🧿 | pendentif de saphir | un médaillon en or au cordon de cuir, un saphir au milieu |
| 🫅 | couronne de rubis | une couronne en or, des perles rouges et trois rubis (👑 reste la couronne du classement) |
| 💍 | bague de diamant | un anneau en or et un diamant bleu ciel |
| 🏭 | fonderie | un four en briques à la bouche qui rougeoie, sa cheminée qui fume, un lingot d'or |
| 🏪 | joaillerie | une boutique à l'auvent violet, sa vitrine, une gemme en enseigne (💠 est déjà le diamant) |

Les pépites (`_pepite()`, `_minerai_brut()`) sont entourées d'un petit creux sombre : sans lui, on
ne les voyait plus à 16 px. Le saphir et le rubis ont aussi leur forme dans `outils/art/formes.mjs`
(`minerai('saphir')`, `minerai('rubis')`).
