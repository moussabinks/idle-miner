# 💰 Marché

> Le stand où l'on vend le contenu de son sac à dos contre de l'argent, au prix fixe de chaque bloc. C'est aussi le bout de la ligne de rails : le wagonnet y vend le coffre de la mine.

## Où et quand

- **Où** : là où tu le poses dans la clairière. C'est un bâtiment de **5 × 5 cases**, **gratuit** : c'est le premier qu'on pose, puisqu'on commence la partie avec 0 $. Au tout début, la barre « 🎯 prochain objectif » dit « Construire : Marché · gratuit : pose-le (menu Bâtiments) ! ».
- **Le poser** : menu **🏗️ Bâtiments** → carte « 💰 Marché » → **🏗️ Poser**. Un fantôme du bâtiment suit le doigt ou la souris (vert si la place est libre, rouge sinon) ; un clic sur la carte le fixe, **↔ Retourner** le met en miroir, **✔ Construire ici** le pose. Plus tard, **✏️ Modifier** permet de le déplacer ou de le retourner gratuitement.
- **Déblocage** : dès le début, jamais de cadenas.
- **La porte** : sur la face avant **gauche** du dessin (à droite s'il est retourné).
- **L'ouvrir** : toucher (ou cliquer) le marché : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre (à droite sur ordinateur, en bas de l'écran sur téléphone). Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1,3 case du bâtiment, de n'importe quel côté. Le bouton ✖ le ferme.
- **Dessin au village** : une image en vue isométrique (`public/images/batiments/marche.webp`) : un étal en bois sous un auvent rayé rouge et crème, avec des caisses de minerais, des sacs et une balance. Il brille en doré au survol et quand son panneau est ouvert.
- **Description** (en haut du panneau) : « Vends tes blocs et minerais. »
- **Bulle au-dessus** (`notifications.ts`) : **🎒 « Ton sac est plein : viens vendre ! »** (bulle rouge d'alerte) quand le sac est plein. Le marché n'a pas d'amélioration : jamais de bulle 💰 « achetable ».
- **Animations et sons d'une vente** : un « +X $ » au milieu de l'écran avec une gerbe de pièces (`src/effets.css`), le compteur d'argent du bandeau qui saute et défile jusqu'à la nouvelle somme, et un « ka-ching ! » de caisse (`sons.vente`) : plus la vente est grosse, plus il y a de pièces (de 3 à 12).
- **Pas de marché, pas de vente** : tant qu'il n'est pas posé, on ne peut rien vendre, et le wagonnet ne peut pas rouler (il n'a pas de bout de ligne).

## Ce qu'on peut y faire

Le panneau affiche « Choisis combien vendre de chaque objet (garde-en pour une pioche, des rails, le générateur…). » Si le sac est vide : « Ton sac est vide. Va le remplir au coffre de la mine ! »

| Élément | Ce qu'il fait |
|---|---|
| **Une jauge par objet du sac** | Les objets sont classés **du plus cher au moins cher**. Chaque ligne montre le bloc, son nom, un curseur de 0 à la taille de la pile, le compteur « choisis / total », la valeur de la sélection en $ et un bouton **Max**. Par défaut, la jauge est au maximum (toute la pile). |
| **Max** | Remet la jauge de cet objet au maximum (« toute la pile, même si elle grossit »). |
| **☑️ Tout sélectionner** | Met toutes les jauges au maximum et retire tous les objets de la liste des objets gardés. Grisé si tout est déjà sélectionné. |
| **💰 Vendre la sélection · +X $** | Vend les quantités choisies et affiche le gain. Grisé si la sélection ne vaut rien. Après la vente, les jauges reviennent à « tout » (sauf les objets gardés). |

Mettre une jauge à **0** « garde » l'objet : le jeu s'en souvient (liste `nonAVendre`), et à la visite suivante la jauge de cet objet repart à 0. Remonter la jauge au-dessus de 0 le retire de la liste.

Le marché ne coûte rien et n'a pas de niveau.

### Les prix de vente

Prix tirés de `BLOCS` (`src/jeu/donnees.ts`). Ils ne changent jamais (pas de prix du marché variables, ni de bonus de vente : le prestige et ses talents sont archivés).

| Objet | Prix | Doublé par la pioche ? | Sort de la mine à partir du |
|---|---:|:---:|---|
| 🪨 Pierre | 1 $ | non | niveau 1 |
| ⚫ Charbon | 5 $ | oui | niveau 1 |
| 🔩 Fer | 12 $ | oui | niveau 1 |
| 🔴 Redstone | 15 $ | oui | niveau 2 |
| 🟡 Or | 35 $ | oui | niveau 3 |
| 💚 Émeraude | 80 $ | oui | niveau 4 |
| 💎 Diamant | 100 $ | oui | niveau 5 |

Les chances de chaque bloc, niveau par niveau, sont dans [mine.md](mine.md#les-5-niveaux-de-la-mine-niveaux_mine).

## Règles et comportement

- **On vend ce qu'on a dans le sac** : chaque quantité demandée est arrondie vers le bas et ramenée entre 0 et ce qu'il y a dans le sac. Si le total vaut 0 : « Rien à vendre pour le moment. » Sinon : « 💰 Vente : +X $ ».
- **Le coffre de la mine ne se vend pas d'ici** : il faut d'abord le mettre dans son sac au panneau de la mine, puis marcher jusqu'au marché. C'est la boucle du début de partie. Avec des rails, le wagonnet fait ce voyage à ta place.
- **Statistiques** : chaque vente ajoute son gain à `stats.argentGagne` (l'argent gagné dans la partie, qui compte pour les succès et le classement). L'écran 📊 la range dans « Toi (marché) ».
- **Les objets gardés** (`nonAVendre`) servent deux fois : ils ne sont pas vendus au marché, **et le wagonnet les laisse dans le coffre de la mine** (on peut aussi les cocher depuis le panneau de la mine). Pratique pour garder du fer pour les rails, ou de la redstone pour le générateur.
- **Il existe aussi** une action « Vendre tout » (`vendre`, qui vend tout sauf les objets gardés) dans la logique du jeu (le bot s'en sert), mais l'interface utilise seulement « Vendre la sélection » (`vendreLot`).

## Lien avec le reste du jeu

- **Toutes les ventes utilisent le même calcul** (`valeurDe` : la somme des prix, arrondie) :
  - le **marché** (toi, avec ton sac) ;
  - le **wagonnet** : au bout de la ligne de rails, il vend tout son chargement en arrivant, puis repart vers la mine. L'argent va dans les statistiques du wagonnet. Voir [mine.md](mine.md#le-wagonnet) ;
  - le **chariot de la foreuse** : vendu directement au stand Foreuse (pas besoin de venir au marché).
- **Les mineurs employés ne vont plus au marché** (22/10) : ils vident leur sac dans le coffre de la mine.
- **Où le poser** : près de la mine ! Plus le marché est près, plus les allers-retours à pied sont courts au début, moins il faut de rails (3 fer la case), plus le wagonnet fait de voyages, et plus il est facile de mettre toute la ligne dans le rayon du générateur.
- **Objectifs** (`objectifs.ts`) : tant qu'il n'est pas posé, « Construire : Marché » est le premier objectif (gratuit). Ensuite, le marché ne propose aucun achat. Son nom dans les objectifs est « au marché ».
- **Succès** : « 💰 Riche » (gagner 5 000 $), « 🤑 Magnat » (100 000 $), « 🛤️ Cheminot » (relier la mine au marché avec des rails).
- **Classement** : l'argent gagné au total vient des ventes, du wagonnet et du chariot.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.marche` : gratuit, 5 × 5, porte à gauche) et les prix de vente (`BLOCS`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment (`construireBatiment`, `deplacerBatiment`).
- `src/jeu/village.ts` : la porte, le chemin à pied, les rails mine → marché (`railsMineMarche`).
- `src/jeu/mineur.ts` : les règles de vente (`valeurDe`, `vendreLot`, `vendre`, `objetsAVendre`, `reglerVente`, `encaisser`, `nonAVendre`).
- `src/jeu/wagonnet.ts` : le wagonnet qui vend le coffre au marché (`avancerWagonnet`).
- `src/jeu/foreuse.ts` : la vente du chariot de la foreuse (`vendreChariot`).
- `src/jeu/notifications.ts` : la bulle 🎒 « sac plein ».
- `src/jeu/objectifs.ts` : « Construire : Marché ».
- `src/composants/Panneaux.tsx` : le panneau du marché (`PanneauMarche`).
- `src/composants/Jauges.tsx` : les jauges pour choisir les quantités (aussi utilisées pour le coffre de la mine).
- `src/choix.ts` : le calcul du lot choisi avec les jauges (`lotChoisi`).
- `src/composants/MenuConstruction.tsx` : la carte du marché dans le menu Bâtiments.
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille, la bulle.
- `public/images/batiments/marche.webp` : le dessin du marché.
- `src/evenements.ts`, `src/sons.ts`, `src/effets.css` : l'événement « vente », le « ka-ching ! » et la pluie de pièces.
