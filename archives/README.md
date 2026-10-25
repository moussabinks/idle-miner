# Archives

Le code et les fiches mis de côté le 22/10, quand le jeu est passé à la mine automatique
(plus de vue en coupe, plus de profondeur ni de bedrock, plus de prestige) :

- `prestige/` : l'arbre de prestige (fenêtre, carte, fête, écran de victoire), les talents et
  les conditions du prestige, avec leurs tests et la fiche du bâtiment. Son ancien dessin
  (`prestige.webp`) a été supprimé le 25/10 avec le nouveau style : il faudra le redessiner.
- `enchanteur/` : le panneau de l'enchanteur et les règles des enchantements, avec la fiche du
  bâtiment. Son ancien dessin (`enchanteur.webp`) a été supprimé le 25/10 avec le nouveau style : il faudra le redessiner.

Ces fichiers ne sont plus compilés (ils sont hors de `src/`) : ils dépendaient de l'ancien
`src/jeu/mineur.ts`. Pour les remettre, il faudra les adapter au nouveau modèle du jeu.
L'ancienne version complète reste aussi dans l'historique git (avant le 22/10).
