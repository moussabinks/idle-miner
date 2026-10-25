# Les dessins du jeu (outils/art)

Tous les dessins du village, en SVG, dans le style cartoon du jeu : aplats de couleur, contours
bleu nuit épais (`#2a2140`), formes rondes, ni dégradé ni flou. Des scripts Node tout simples,
sans paquet à installer.

## Les personnages : des taupes (`personnages.mjs`)

    node outils/art/personnages.mjs

Écrit les 26 images du village (`public/images/personnages/sprites/`) et les 3 portraits
(`public/images/personnages/`) :

- le joueur (casque jaune) et un mineur de chaque rareté (`mineur_<rareté>`, casque de la couleur
  de la rareté : les mêmes couleurs que `RARETES` dans `src/jeu/donnees.ts`), vus `_devant`,
  `_derriere`, `_gauche` et `_droite` (« gauche » = « droite » en miroir) ;
- le manager (lunettes, gilet, cravate, bloc-notes) et le recruteur (casquette de côté, badge,
  sacoche, porte-voix), vus seulement `_devant` ;
- les portraits ronds : `mineur.svg` (Pépite, qui salue), `manager.svg`, `recruteur.svg` : les
  mêmes dessins cadrés sur la tête et les épaules.

Une taupe : un corps tout rond (la tête et le corps d'un seul bloc), un ventre et un museau plus
clairs, de grands yeux ronds blancs à pupille noire, un nez rose, de grosses mains roses à trois
griffes, des pieds plus foncés, un casque avec sa lampe et une pioche.

**Le calage** : toutes les images ont le même cadre, `LARGEUR` × `HAUTEUR` (136 × 132), et les
pieds au même point, `PIED` (68, 127). Si on les change, les recopier dans `CALAGE_TAUPE`
(`src/composants/sprites.ts`). `ECHELLE_SPRITE` (46 / 110) règle la taille au village : une taupe
casquée fait environ 46 pixels du monde de haut.

## Les rails (`rails.mjs`)

    node outils/art/rails.mjs

Écrit les images de `public/images/rails/`, dessinées par `RailsDuVillage`
(`src/composants/DessinsVillage.tsx`). Un rail se pose sur une case, mais la voie est large de
presque deux cases. Deux couches :

1. **Le ballast**, une bande claire à plat sur le sol (avec quelques cailloux) : des tuiles vues
   de dessus (1 unité = 1 case), de 2 × 2 cases centrées sur la case du rail, que le jeu pose en
   losange et tourne d'un quart de tour si besoin : `talus_droit` (nord – sud), `talus_virage`
   (sud – est), `talus_t` (nord – sud et l'est), `talus_croix`, et `talus_doux` (3 × 3 cases, le
   virage doux). Chacune a **deux images** : `talus_<forme>_bord.svg` (la bande un peu plus large,
   en encre) et `talus_<forme>.svg` (la bande claire). Le jeu pose d'abord tous les bords, puis
   toutes les bandes : les bandes voisines se fondent, et le trait d'encre ne reste que tout
   autour de la voie (même dans les embranchements). Dans le sens de la voie, une tuile s'arrête au
   bord de sa case : les tuiles se raccordent sans couture.
2. **La voie** (traverses en bois et rails d'acier, cernés d'encre), en vue isométrique comme le
   village : une image par forme de case, `voie_<côtés>` (`ns`, `eo`, `es`, `so`, `no`, `ne`,
   `nes`, `eso`, `nso`, `neo`, `neso`), les bouts de ligne avec leur butoir (`voie_fin_n`, `_e`,
   `_s`, `_o` : le côté où la voie s'arrête ; `voie_seul_ns` : un rail tout seul) et les virages
   doux (`voie_doux_es`, `_so`, `_no`, `_ne`). Le cadre de chaque image est celui que le jeu
   attend : `CADRE` (-35, -15, 70 × 46, en pixels du monde autour du coin du haut de la case) et
   `CADRE_DOUX` (-42, -12, 84 × 58, autour du coin du haut du carré de 2 × 2 cases) : les mêmes
   que `CADRE_VOIE` et `CADRE_DOUX` dans `DessinsVillage.tsx`. Les traverses sont à 1/6, 1/2 et
   5/6 de la case, et les rails s'arrêtent pile au bord : les cases se raccordent sans couture.
   Le dessus des rails est à 0,17 case de haut (le wagonnet roule dessus : `RAIL` dans
   `src/composants/Wagonnet3D.tsx`).

Le wagonnet, lui, est dessiné par le jeu à chaque image (`src/composants/Wagonnet3D.tsx`), dans
le même style.
