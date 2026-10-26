# Les dessins du village (style cartoon)

Depuis le 25/10, tous les dessins du village sont des **SVG** fabriqués par un script Node (sans
aucune bibliothèque à installer) : les bâtiments, la mine et ses calques, les caisses de
l'ascenseur, l'icône des rails, les arbres, et le paysage (les collines et les montagnes autour de
la clairière). Le style : des aplats de couleur (une seule teinte
plus sombre par face, jamais de dégradé, de texture ni de flou), un **contour bleu nuit épais**
(`#2a2140`) partout, des formes rondes et simples, la palette de l'interface.

## Fabriquer les dessins

Depuis la racine du projet :

```sh
node outils/art/fabriquer.mjs
```

Le script réécrit les fichiers de `public/images/batiments/`, `public/images/village/arbres/` et
`public/images/village/paysage/`,
puis affiche les **calages** (la taille de chaque dessin et les coins de son emprise au sol). S'ils
ont changé, les recopier dans le jeu :

- `CALAGES` dans `src/composants/iso.ts` (les bâtiments et la mine) ;
- `POINTS_MINE` dans `src/composants/iso.ts` (où sont la caisse, le treuil, le bord du puits, le
  panneau...) et `CABINE_EN_HAUT` / `CABINE_EN_BAS` dans `src/composants/DessinsVillage.tsx` ;
- `arbre()` dans `src/composants/arbres.ts` (tous les arbres ont le même cadre) ;
- `VIGNETTES` et `EAU_CASCADE` dans `src/composants/paysage.ts` (le paysage).

## Les fichiers

| Fichier | Ce qu'il dessine |
|---|---|
| `formes.mjs` | La palette, les teintes, et la « toile » isométrique : boîtes, prismes, toits, pyramides, cylindres, dessins à plat sur une façade (`surFace`), rochers ; et les **minerais** (`minerai()`, 25/10) : les mêmes formes que les icônes du jeu (`outils/icones/dessins.py`) |
| `batiments.mjs` | La dalle de pavés, le marché, le forgeron (25/10 : le four et son feu, la cheminée en briques, l'enclume vue de côté, `enclume()`), le Personnel, la foreuse (25/10 : la mèche en forme de carotte, `meche()`, son petit coffre à charbon, `coffreForeuse()`, et les bandes de chantier, `bandesChantier()`), le générateur, (26/10) la fonderie et la joaillerie, et l'icône des rails |
| `mine.mjs` | La mine (10 × 10) : le puits et ses parois pleines de minerais, le chevalement, la petite butte de rochers de la galerie (`butte()`, une courbe qui passe par les points de son contour) et son wagonnet, les filons (`filon()`) et les tas de minerais (`tasDeMinerais()`), le coffre au trésor ; son calque de devant (`mine-devant.svg`), les 5 caisses de l'ascenseur et les points utiles pour le jeu |
| `arbres.mjs` | Les 7 arbres : rond, nuage, sapin, buisson, cerisier, automne (jaune) et palmier |
| `montagnes.mjs` | Le paysage (25/10) : les montagnes enneigées (`montagne()`, la table `MONTAGNES_SIMPLES`, la montagne à la cascade et celle à la galerie de mine), leurs filons (`filon()`), cristaux et fissures, et les collines (`colline()`, `garnirColline()`), un bosquet de sapins et des rochers |
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

## Le paysage (les collines et les montagnes)

Au-delà de la rangée d'arbres qui entoure la clairière, le jeu plante des « vignettes » (`paysage.ts`
choisit où, `ForetVillage.tsx` les dessine en tuiles avec les arbres). Chaque vignette est dessinée
autour du **milieu de son pied** (0, 0), deux fois plus grande que le monde (le jeu l'affiche à
l'échelle 0,5) ; son cadre est donné à `svg()`.

- **Une montagne** (`montagne()`) : une silhouette de pics (chaque pic : sa place en part de la
  largeur et sa hauteur), chaque pic coupé par une arête qui descend un peu vers la droite : à
  gauche la face éclairée (`ROCHE`), à droite celle à l'ombre (`ROCHE_OMBRE`). Un bonnet de neige
  qui coule en gouttes sous chaque sommet, de l'herbe en bas (en langues), puis les détails :
  **gisements** (26/10 : `gisement()`, quelques pépites en losange au gros contour, comme sur le
  bloc de la mine `BlocDessin.tsx`, à la place des filons aux grosses icônes), grappes de
  cristaux, fissures, un arbre et des rochers au pied. Le contour d'encre ne suit que la silhouette :
  le pied n'en a pas, la montagne sort du sol.
- **Une colline** (`colline()`) : une bosse verte, à l'ombre en bas à droite, la teinte éclairée
  décalée vers la lumière (comme le feuillage des arbres), un contour seulement sur le dessus.
- **Les arbres** des vignettes passent par `v.arbre()` : ils ont tous la taille des arbres de la
  lisière (`TAILLE_ARBRE` = 0,66, 26/10), et le cadre de la vignette s'agrandit tout seul pour les
  contenir. Le jeu affiche toutes les vignettes à la même échelle (0,5) pour que ça reste vrai.
- Les vignettes ne sont **jamais retournées** (la lumière vient toujours de la gauche) : pour varier,
  chaque montagne simple a deux versions (`-b`).
- **La cascade** : la bande d'eau de `montagne-cascade` est aussi animée par le jeu (une petite
  boîte posée dessus, où des traits blancs descendent) ; si on la déplace, recopier `EAU_CASCADE`
  (affichée par `fabriquer.mjs`) dans `paysage.ts`.


## La fonderie et la joaillerie (26/10)

- **La fonderie** (`fonderie()`, porte à gauche) : un haut-fourneau en briques rouges (le forgeron,
  lui, a un four en pierre grise et une enclume), sa bouche qui crache le feu, son haut qui se
  resserre en une grosse cheminée qui fume ; devant, le moule à lingots (une plaque de fonte à trois
  creux) et le creuset sur son support ; contre le four, une pile de lingots de fer et d'or ; au
  fond, le charbon ; devant à droite, une caisse de minerai brut.
- **`fonderie-active.svg`** (`fonderie({ enMarche: true })`) : la fonderie qui travaille. Le feu
  danse, le creuset penché verse un filet de métal fondu dans le moule, le judas clignote et la
  fumée monte. Comme la mèche de la foreuse, c'est une animation **dans le SVG** (SMIL : des images
  montrées l'une après l'autre avec `<animate attributeName="visibility" calcMode="discrete">`),
  jamais une animation CSS. Le petit outil `enBoucle(images, duree)` de `batiments.mjs` la fabrique
  (la mèche s'en sert aussi).
- **La joaillerie** (`joaillerie()`, porte à droite) : une boutique en pierre claire au toit violet
  bordé d'or, une grosse gemme bleu ciel en enseigne sur le toit, la vitrine aux bijoux sous un auvent
  violet et lilas, la porte violette et deux buis en pot ; devant, l'établi et sa loupe, et un petit
  coffre ouvert plein de gemmes (`coffreGemmes()`).
- Outils ajoutés : `tronc()` (un tronc de pyramide), `polygoneRegulier()`, `lingot3d()`,
  `brillant()` (une étincelle), et dans `formes.mjs` les minerais `saphir` et `rubis`.
- La fumée de la fonderie monte haut : son dessin est plus haut que les autres (son calage aussi).
