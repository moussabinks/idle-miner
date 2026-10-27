# Le château : la quête finale (27/10)

> Demandé par le propriétaire le 27/10 : un objectif final pour **finir le jeu**.
> Fichiers : `src/jeu/chateau.ts` (les règles), `src/composants/chateau.ts` (où il est sur la carte),
> `src/composants/ChateauVillage.tsx` (le chemin, le château et l'animation), `FenetreChateau.tsx`,
> `QueteChateau.tsx`, `FeuxArtifice.tsx` ; les dessins : `outils/art/chateau.mjs`.

## Ce que voit le joueur

- **Dès le début de la partie**, au fond de la carte, entre la chaîne de montagnes de gauche et celle de
  droite, un **château en ruine** est posé sur une **colline toute ronde, en herbe** (27/10 : plus de
  falaise de roche ni de rampe). Il est **tourné de 45°** : sa grande porte est face à nous, au milieu du
  mur de devant. Un **chemin de terre** part du coin du haut de la clairière (les 3 arbres de ce coin ont
  été enlevés) et monte presque tout droit jusqu'à la porte, d'un seul trait (le même chemin dans l'herbe
  et sur la colline).
- La caméra monte bien plus haut qu'avant (`LIMITES_CAMERA.y0` : -560 au lieu de -140) : le décor a été
  agrandi, avec bien plus de montagnes autour du château (`paysage.ts` plante tout ce que la caméra peut
  voir ; rien n'est planté devant le château ni sur son chemin).
- **On touche le château** (n'importe quand) : sa fenêtre s'ouvre (violette, 🏰). En ruine : son histoire,
  une jauge `argent / 10 M`, et le gros bouton jaune **« 🏰 Restaurer le château · 10 M $ »** (grisé s'il
  manque de l'argent, avec « Il te manque X $ »).
- **La quête finale** apparaît en haut à droite (au-dessus des tâches ; sur téléphone, sous le bandeau)
  quand la fin du jeu approche : **la mine au niveau 7 et tous les bâtiments posés** (pas besoin d'avoir
  tout amélioré, ni les chariots des pousseurs). Elle montre la jauge de l'argent ; son bouton « Voir »
  (« Go ! » en jaune quand on a les 10 M) emmène la caméra au château et ouvre sa fenêtre. Elle disparaît
  une fois le château restauré.

## La restauration

- Elle coûte **10 000 000 $** (27/10 ; avant 20 000 000 $) (`PRIX_CHATEAU`, dans `donnees.ts`), en argent seulement (pas de gemmes,
  pas de minerais). Une seule fois : `etat.chateau = { restaure: true, tempsDeJeu }` (un champ facultatif :
  aucune conversion de sauvegarde).
- Après le paiement : la fenêtre se ferme, la caméra glisse jusqu'au château, puis
  1. la ruine **tremble** dans des nuages de poussière, des étincelles dorées montent (un grondement) ;
  2. un **éclair blanc**, et le château neuf **jaillit en rebondissant** au milieu de **rayons dorés** qui
     tournent et d'étoiles (cymbale et fanfare) ;
  3. **7 secondes de feux d'artifice** sur tout l'écran, réalistes (27/10) : le ciel s'assombrit, les
     fusées montent avec une traînée d'étincelles, les gerbes brillent (la lumière s'additionne), laissent
     des traînées, ralentissent dans l'air et retombent en scintillant ; six sortes de gerbes (pivoine,
     chrysanthème, saule doré, anneau, palmier, crépitement) et un bouquet final ; un sifflement au
     départ, un « boum » profond à l'éclatement, des pétillements ;
  4. la fenêtre de la victoire : **« Bravo, châtelain ! Le château est restauré : tu as fini Mega
     Digger ! »**, le temps de jeu qu'il a fallu, « ✨ Feu d'artifice » (pour le revoir) et « Continuer à
     jouer ». Le succès **« Châtelain »** 🏰.
- La partie continue ensuite comme avant (la mine tourne, le classement aussi). Le château neuf reste
  sur la carte ; on le voit aussi en visitant le village d'un joueur qui l'a restauré.

## Combien de temps

À la mine 7, le bot gagne environ 650 $/s (sans améliorer davantage) : 10 M demandent encore environ
4 h 15 de jeu, moins en améliorant les paliers 7. C'est voulu : c'est le dernier objectif du jeu.

## Les dessins

`outils/art/chateau.mjs` dessine les deux images (`public/images/village/chateau/chateau-ruine.svg` et
`chateau-neuf.svg`), de la même taille et calées pareil (on passe de l'une à l'autre sans que rien ne
bouge) : une toile de 18 × 18 cases, la colline au milieu, et le château mesuré sur deux axes tournés
de 45° (u vers nous, v vers la droite de l'écran) : le mur de devant se voit de face, avec la tour
de la porte, ses deux tours d'angle, deux tours plus hautes derrière, le donjon au milieu. Neuf : pierres crème, toits pointus bleu roi, drapeaux, bannière
rouge à la couronne d'or, porte en bois aux clous dorés. En ruine (27/10, redessiné deux fois) : pierre grise chaude, murs au haut cassé en marches
(`murEnRuine`, `profilCasse`) avec des pierres dessinées, tours pleines cassées en biais au bord
ébréché, un créneau qui tient encore et de l'herbe dessus (`tourEnRuine`), donjon au toit brûlé (ses
poutres noires dépassent) avec un petit arbre qui a poussé dessus (`donjonEnRuine`), porte en bois qui
pend de travers (`porteEnRuine`), murs des côtés bas, un peu de lierre, éboulis ; et ses détails
(`detailsRuine`) : bannière déchirée, meurtrières, blocs de créneaux tombés, tonneau, roue de charrette
cassée, épée plantée, toile d'araignée, corbeaux. Sur la colline (les deux dessins, `detailsColline`) :
des fleurs, des champignons rouges à pois, des touffes d'herbe, des cailloux, des buissons à baies.
Le chemin n'est pas dans le dessin : le jeu le trace d'un seul trait, de la clairière jusqu'au pied
de la porte (`cheminChateau()` dans `src/composants/chateau.ts`, le point `porte` du calage).
`fabriquer.mjs` affiche son calage (`CALAGE_CHATEAU` dans `src/composants/chateau.ts`) : la case (0, 0)
de la toile est posée sur la case (-23, -23) de la grille.
