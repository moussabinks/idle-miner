# Les tuiles des rails

Les tuiles de `public/images/rails/` sont dessinées par `dessiner.py` (Python et Pillow), dans
le style du fichier « propriété-rail-design » de l'équipe (Google Drive).

Un rail se pose sur **une** case, mais la voie est large de **deux** cases : elle déborde d'une
demi-case à gauche et à droite. Chaque tuile (512 × 512) couvre donc 2 × 2 cases, centrée sur
la case du rail ; dans le sens de la voie, elle s'arrête au bord de la case.

Quatre formes :

- `rail_droit` : nord – sud ;
- `rail_virage` : sud – est, en quart de cercle ;
- `rail_t` : la ligne nord – sud continue d'un côté ; de l'autre, deux rails en L qui tournent
  vers l'est ; un plancher en bois au centre ;
- `rail_croix` : quatre rails en L (les rails ne se croisent jamais), un plancher au centre.

Chaque forme a quatre calques, pour le relief : `_cote` (le flanc du talus, posé un peu plus bas),
`_ballast` (le dessus du talus), `_ombre` (l'ombre des traverses et des rails, décalée) et
`_voie` (les traverses et les rails). Le jeu (`RailsDuVillage`, dans
`src/composants/DessinsVillage.tsx`) pose le premier calque de toutes les cases, puis le
deuxième, etc., et tourne les tuiles pour toutes les directions.

    python3 outils/rails/dessiner.py public/images/rails

(le script écrit aussi `apercu.png` à côté : on peut l'effacer.)
