# Le château : la quête finale (27/10)

> Demandé par le propriétaire le 27/10 : un objectif final pour **finir le jeu**.
> Fichiers : `src/jeu/chateau.ts` (les règles), `src/composants/chateau.ts` (où il est sur la carte),
> `src/composants/ChateauVillage.tsx` (le chemin, le château et l'animation), `FenetreChateau.tsx`,
> `QueteChateau.tsx`, `FeuxArtifice.tsx` ; les dessins : `outils/art/chateau.mjs`.

## Ce que voit le joueur

- **Dès le début de la partie**, au fond de la carte, entre la chaîne de montagnes de gauche et celle de
  droite, un **château en ruine** est posé sur une colline (une butte d'herbe, un plateau aux flancs de
  roche et une rampe de terre). Un **chemin de terre** part du coin du haut de la clairière (les 3 arbres
  de ce coin ont été enlevés) et monte jusqu'au pied de la rampe.
- La caméra monte bien plus haut qu'avant (`LIMITES_CAMERA.y0` : -560 au lieu de -140) : le décor a été
  agrandi, avec bien plus de montagnes autour du château (`paysage.ts` plante tout ce que la caméra peut
  voir ; rien n'est planté devant le château ni sur son chemin).
- **On touche le château** (n'importe quand) : sa fenêtre s'ouvre (violette, 🏰). En ruine : son histoire,
  une jauge `argent / 20 M`, et le gros bouton jaune **« 🏰 Restaurer le château · 20 M $ »** (grisé s'il
  manque de l'argent, avec « Il te manque X $ »).
- **La quête finale** apparaît en haut à droite (au-dessus des tâches ; sur téléphone, sous le bandeau)
  quand la fin du jeu approche : **la mine au niveau 7 et tous les bâtiments posés** (pas besoin d'avoir
  tout amélioré, ni les chariots des pousseurs). Elle montre la jauge de l'argent ; son bouton « Voir »
  (« Go ! » en jaune quand on a les 20 M) emmène la caméra au château et ouvre sa fenêtre. Elle disparaît
  une fois le château restauré.

## La restauration

- Elle coûte **20 000 000 $** (`PRIX_CHATEAU`, dans `donnees.ts`), en argent seulement (pas de gemmes,
  pas de minerais). Une seule fois : `etat.chateau = { restaure: true, tempsDeJeu }` (un champ facultatif :
  aucune conversion de sauvegarde).
- Après le paiement : la fenêtre se ferme, la caméra glisse jusqu'au château, puis
  1. la ruine **tremble** dans des nuages de poussière, des étincelles dorées montent (un grondement) ;
  2. un **éclair blanc**, et le château neuf **jaillit en rebondissant** au milieu de **rayons dorés** qui
     tournent et d'étoiles (cymbale et fanfare) ;
  3. **7 secondes de feux d'artifice** sur tout l'écran (fusées, gerbes en anneau, en boule et
     scintillantes, aux couleurs du jeu, avec le contour d'encre ; un sifflement et un « boum » par fusée) ;
  4. la fenêtre de la victoire : **« Bravo, châtelain ! Le château est restauré : tu as fini Mega
     Digger ! »**, le temps de jeu qu'il a fallu, « ✨ Feu d'artifice » (pour le revoir) et « Continuer à
     jouer ». Le succès **« Châtelain »** 🏰.
- La partie continue ensuite comme avant (la mine tourne, le classement aussi). Le château neuf reste
  sur la carte ; on le voit aussi en visitant le village d'un joueur qui l'a restauré.

## Combien de temps

À la mine 7, le bot gagne environ 650 $/s (sans améliorer davantage) : 20 M demandent encore environ
8 h 30 de jeu, moins en améliorant les paliers 7. C'est voulu : c'est le dernier objectif du jeu.

## Les dessins

`outils/art/chateau.mjs` dessine les deux images (`public/images/village/chateau/chateau-ruine.svg` et
`chateau-neuf.svg`), de la même taille et calées pareil (on passe de l'une à l'autre sans que rien ne
bouge) : une toile de 16 × 16 cases, le château au milieu (10 × 10 cases), avec quatre tours rondes, un
donjon, des murs crénelés et une porte. Neuf : pierres crème, toits pointus bleu roi, drapeaux, bannière
rouge à la couronne d'or, porte en bois aux clous dorés. En ruine : pierres gris lilas, murs au dessus
déchiqueté (`murEnRuine`), tours cassées, donjon éventré, poutre tombée, mousse, éboulis.
`fabriquer.mjs` affiche son calage (`CALAGE_CHATEAU` dans `src/composants/chateau.ts`) : la case (0, 0)
de la toile est posée sur la case (-22, -22) de la grille.
