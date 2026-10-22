# Les rails

Un rail se pose sur **une** case, mais la voie est large de **deux** cases : elle déborde d'une
demi-case à gauche et à droite. Deux scripts (Python, numpy et Pillow) fabriquent les images de
`public/images/rails/`, dans le style du fichier « propriété-rail-design » de l'équipe (Google
Drive) :

1. `talus.py` : le **talus de terre**, à plat sur le sol, avec quelques petits cailloux. Quatre
   tuiles vues de dessus (`talus_droit`, `talus_virage`, `talus_t`, `talus_croix`), de 2 × 2 cases
   centrées sur la case du rail ; le jeu les pose en losange et les tourne dans le bon sens.
2. `modele3d.py` : la **voie en vraie 3D**. Un petit moteur de rendu construit le modèle de la
   case (traverses en bois enfoncées dans le talus, selles et tire-fonds en acier, rails avec
   leur patin, leur âme et leur champignon), calcule l'ombre (vue depuis la lumière, en haut à
   gauche), puis le dessine en vue isométrique, comme le jeu voit le village, avec un reflet sur
   l'acier, le grain du bois et un contour foncé. Une image par forme de case : `voie_<côtés>`
   (`ns`, `eo`, `es`, `so`, `no`, `ne`, `nes`, `eso`, `nso`, `neo`, `neso`). Le T a la ligne
   continue d'un côté et deux rails en L de l'autre ; le croisement a quatre rails en L (les
   rails ne se croisent jamais) ; les deux ont un plancher en bois au centre.

**Les virages doux** (25/10) : quand un virage a deux lignes droites pour voisines, le jeu dessine
à la place un grand quart de cercle (rayon 1,5 case) sur les trois cases : `talus_doux` (une tuile
de 3 × 3 cases) et `voie_doux_<côtés du coin>` (`es`, `so`, `no`, `ne`), rendues dans un carré de
2 × 2 cases.

Le jeu (`RailsDuVillage`, dans `src/composants/DessinsVillage.tsx`) pose le talus de toutes les
cases, puis la voie de la plus loin à la plus proche.

    python3 outils/rails/talus.py public/images/rails
    python3 outils/rails/modele3d.py public/images/rails        # toutes les formes
    python3 outils/rails/modele3d.py public/images/rails ns es  # seulement quelques-unes
