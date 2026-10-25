# Les dessins du village (style cartoon)

Depuis le 25/10, tous les dessins du village sont des **SVG** fabriqués par un script Node (sans
aucune bibliothèque à installer) : les bâtiments, la mine et ses calques, les caisses de
l'ascenseur, l'icône des rails et les arbres. Le style : des aplats de couleur (une seule teinte
plus sombre par face, jamais de dégradé, de texture ni de flou), un **contour bleu nuit épais**
(`#2a2140`) partout, des formes rondes et simples, la palette de l'interface.

## Fabriquer les dessins

Depuis la racine du projet :

```sh
node outils/art/fabriquer.mjs
```

Le script réécrit les fichiers de `public/images/batiments/` et `public/images/village/arbres/`,
puis affiche les **calages** (la taille de chaque dessin et les coins de son emprise au sol). S'ils
ont changé, les recopier dans le jeu :

- `CALAGES` dans `src/composants/iso.ts` (les bâtiments et la mine) ;
- `POINTS_MINE` dans `src/composants/iso.ts` (où sont la caisse, le treuil, le bord du puits, le
  panneau...) et `CABINE_EN_HAUT` / `CABINE_EN_BAS` dans `src/composants/DessinsVillage.tsx` ;
- `arbre()` dans `src/composants/arbres.ts` (tous les arbres ont le même cadre).

## Les fichiers

| Fichier | Ce qu'il dessine |
|---|---|
| `formes.mjs` | La palette, les teintes, et la « toile » isométrique : boîtes, prismes, toits, pyramides, cylindres, dessins à plat sur une façade (`surFace`), rochers ; et les **minerais** (`minerai()`, 25/10) : les mêmes formes que les icônes du jeu (`outils/icones/dessins.py`) |
| `batiments.mjs` | La dalle de pavés, le marché, le forgeron (25/10 : le four et son feu, la cheminée en briques, l'enclume vue de côté, `enclume()`), le Personnel, la foreuse (25/10 : la mèche en forme de carotte, `meche()`, son petit coffre à charbon, `coffreForeuse()`, et les bandes de chantier, `bandesChantier()`), le générateur et l'icône des rails |
| `mine.mjs` | La mine (10 × 10) : le puits et ses parois pleines de minerais, le chevalement, la petite butte de rochers de la galerie (`butte()`, une courbe qui passe par les points de son contour) et son wagonnet, les filons (`filon()`) et les tas de minerais (`tasDeMinerais()`), le coffre au trésor ; son calque de devant (`mine-devant.svg`), les 5 caisses de l'ascenseur et les points utiles pour le jeu |
| `arbres.mjs` | Les 7 arbres : rond, nuage, sapin, buisson, cerisier, automne (jaune) et palmier |
| `fabriquer.mjs` | Lance tout, écrit les fichiers et affiche les calages |

## Comment c'est dessiné

- Les dessins sont faits **exactement à l'angle des cases du jeu**, deux fois plus grands que le
  monde : une case y fait 66 pixels de large sur 38,28 de haut (`DX`, `DY` dans `formes.mjs`). On
  place les volumes en **cases** (x, y de 0 à 5, ou 10 pour la mine) et en hauteur (z, en pixels).
  Le pied de la dalle de chaque bâtiment tombe donc pile sur son emprise de 5 × 5 cases.
- La lumière vient d'**en haut à gauche** : le dessus est le plus clair, la façade de gauche a la
  couleur elle-même, celle de droite est plus sombre (`teintes()`). Un volume ne dessine que les
  faces tournées vers nous (`Toile.volume`).
- On dessine **du fond vers l'avant** : ce qui est dessiné après passe devant.
- Le contour fait 6 pixels du dessin (3 pixels à l'écran au zoom 1), 4 pour les petits détails.
- Aucune écriture sur les bâtiments : un bâtiment retourné (miroir) utilise la même image.
- La porte de chaque bâtiment est du côté donné dans `src/jeu/donnees.ts` (`porte`) : « gauche »
  = la façade en bas à gauche, « droite » = celle en bas à droite.

## La mine et son ascenseur

Le jeu dessine par-dessus `mine.svg` (voir `DessinEvolutionMine` dans
`src/composants/DessinsVillage.tsx`) : les deux câbles qui tombent du treuil, la caisse
(`caisse-ascenseur-0.svg` vide, `1` à `4` de plus en plus riche) qui monte et descend dans le
puits, coupée sous le bord de devant du puits, puis `mine-devant.svg` (les poutres de devant du
puits, dans le même cadre que la mine) qui passe devant la caisse. Les caisses sont dessinées dans
le cadre de la mine puis recadrées : leur position dans la mine est `POINTS_MINE.caisse`.

**La mine reste basse** (25/10 : plus de grosse montagne au fond, elle cachait le décor derrière la
mine) : seule la roue du chevalement dépasse, et `HAUT` (la place au-dessus de l'emprise, dans
`mine.mjs`) est de 110. Si on change `HAUT`, tous les points de `POINTS_MINE` bougent d'autant (pas
`CABINE_EN_HAUT` / `CABINE_EN_BAS`, qui sont des décalages ; `CABINE_EN_HAUT` change si on monte
ou descend le treuil, `Z_TREUIL`). La foreuse (son portique et sa fumée) et le forgeron (sa
cheminée) sont plus hauts que les autres bâtiments : leur calage est différent.

Les minerais (dans la caisse, le wagonnet, les parois du puits, les filons, les caisses) sont
dessinés par `minerai(sorte, x, y, taille, angle)` de `formes.mjs`, avec les formes des icônes du
jeu : `pierre`, `charbon`, `fer`, `or`, `redstone`, `emeraude`, `diamant`. Jamais de petits cubes :
on doit reconnaître chaque minerai.

## Les arbres

Chaque arbre a, à ses pieds, une petite **ombre plate d'un vert à peine plus sombre que l'herbe**
et une touffe d'herbe qui cache le bas du tronc : il se fond dans le sol (pas de tache sombre).
Le palmier, lui, pousse sur le sable (ombre couleur de sable, pas de touffe). Les arbres sont
dessinés dans des « canvas » par `src/composants/ForetVillage.tsx` : les SVG ont donc une largeur
et une hauteur écrites dans leur balise.

Le sol (l'herbe, le damier, la plage, la mer), les rochers et les décorations sont dessinés
directement par le jeu, dans le même style (`DessinsVillage.tsx`, `PlageVillage.tsx`,
`Rochers.tsx`).
