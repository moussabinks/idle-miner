# Les tuiles des rails

Les tuiles de `public/images/rails/` sont fabriquées à partir de la planche de l'équipe
(« Tuiles de voies ferrées isométriques.png », sur le Google Drive), avec Python et Pillow :

1. `remettre_a_plat.py` : remet le morceau droit de la planche à plat, en vue de dessus ;
2. `faire_tuiles.py` : en tire un morceau droit d'une case, qui se raccorde sans couture ;
3. `calques.py` : sépare ce morceau en trois calques (ballast, traverses, rails), courbe chaque
   calque pour faire le virage, puis compose toutes les tuiles : `rail_droit`, `rail_virage`,
   `rail_t` (la ligne droite et deux virages) et `rail_croix` (les deux lignes droites).
   Les ballasts de tous les morceaux sont posés d'abord, puis les traverses, puis les rails :
   les voies se mêlent proprement.

Chaque script prend en argument le dossier de travail (où se trouve `planche.png`).
