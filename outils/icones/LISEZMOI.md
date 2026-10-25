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
