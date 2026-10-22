# ⚡ Générateur

> La machine à éclairs du village (22/10) : elle brûle de la **redstone** et **électrifie** tout ce qui est dans son **rayon**. Si tous les rails d'un trajet de wagonnet sont dans ce rayon, ce wagonnet **roule tout seul** : c'est le revenu passif du jeu. Elle rend aussi la foreuse plus rapide.

## Où et quand

- **Où** : là où tu le poses dans la clairière. C'est un bâtiment de **5 × 5 cases**, comme les autres.
- **Déblocage** : au **niveau 2 de la mine** (« Veine de redstone »). Avant, sa carte du menu 🏗️ Bâtiments a un cadenas « 🔒 Mine niveau 2 ». C'est aussi le niveau où la redstone commence à sortir de la mine.
- **Prix pour le poser** : **1 200 $ + 50 fer + 20 redstone**, une seule fois. Les minerais se prennent dans le sac, puis dans le coffre de la mine.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). On peut l'ouvrir de n'importe quel côté (à moins de 1,3 case).
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/generateur.webp`) : une grosse bobine dorée et vitrée pleine d'éclairs jaunes, dans un bâti en bois et en métal, avec des tuyaux en cuivre, un cadran, deux petites bobines aux coins et des arcs électriques au-dessus, sur une dalle de 5 × 5 pavés.
- **Description** (en haut du panneau) : « Il brûle de la redstone et électrifie tout ce qui est dans son rayon : rails et foreuse. »
- **Le rayon sur la carte** : un **cercle en pointillés jaunes** autour du générateur (une ellipse à l'écran, car la grille est en losange) :
  - bien visible (plus épais, et les pointillés tournent) quand on est devant le générateur, ou pendant qu'on le pose (on voit alors le rayon autour du fantôme, pratique pour bien le placer) ;
  - en tout petit, discret, le reste du temps, tant qu'il donne du courant ;
  - gris quand il ne donne pas de courant (éteint ou sans redstone) ; caché s'il ne donne pas de courant et qu'on ne le regarde pas.
- **Bulles au-dessus** (`notifications.ts`) :
  - **🔴 « Plus de redstone ! »** (alerte rouge) quand il est **allumé** mais n'a plus de redstone ;
  - **🚧 « Rails coupés »** (alerte rouge, 26/10) quand un trajet de wagonnet qui part d'ici ou y arrive n'a plus de rails complets (un rail enlevé, un bâtiment déplacé) : « Rails coupés entre … : le wagonnet attend. Repose les rails ! ». La bulle est sur les deux bâtiments du trajet ;
  - **💰 « Une amélioration est achetable ! »** quand le niveau suivant est payable tout de suite.
- **Le bandeau** affiche un petit **⚡** quand au moins un trajet est électrique.

## Ce qu'on peut y faire

### ⚡ Courant

- Un badge : **Allumé** (vert), **Éteint**, ou **Plus de redstone**.
- « Rayon : *N* cases (le cercle jaune sur la carte) · puissance ×*P* ».
- Une barre rouge : la redstone qui reste, en minutes.
- « 1 redstone = 30 s · tu en as *N* (sac + coffre) », puis les boutons **+1**, **+10** et **Tout** (anthracite, comme le charbon de la foreuse). La redstone se prend d'abord dans le **sac**, puis dans le **coffre de la mine**. Sans redstone : « 🔴 Il te faut de la redstone (niveau 2 de la mine). »
- **⏸ Éteindre / ▶ Allumer** (gris) : éteint, le générateur **garde sa redstone** et ne la brûle pas (mais il ne donne plus de courant).
- **Le puisage** (à partir du **niveau 2** du générateur) : une case à cocher « Il se sert tout seul dans le coffre de la mine (en gardant 5 minutes d'avance) ». Avant : « 🔒 Au niveau 2, il se servira tout seul en redstone dans le coffre de la mine. »

### 🔌 Ce qu'il alimente

Une petite liste qui dit où on en est :

- **🛤️ Rails** : « pas encore de trajet de wagonnet », ou une ligne par trajet (« Mine → Marché : … ») : « ✔ électrique, le wagonnet roule tout seul ! », « dans le rayon, mais le générateur ne donne pas de courant », « ✖ une partie des rails est hors du rayon : rapproche le générateur (ou agrandis son rayon) », ou « rails coupés ».
- **⚙️ Foreuse** : « pas encore construite », « ✔ boostée ! », « dans le rayon, mais sans courant », ou « ✖ hors du rayon ».

### ⬆ Améliorer

Une ligne d'amélioration (carrés de niveaux, prix, bouton turquoise). Chaque niveau agrandit le **rayon** et augmente la **puissance** (`NIVEAUX_GENERATEUR`) :

| Niveau | Rayon | Puissance | Wagonnet électrique | Foreuse boostée | Coût |
|---|---:|---:|---:|---:|---|
| 1 | 15 cases | ×1 | 8 cases/s | ×1,5 | (le prix du bâtiment) |
| 2 | 20 cases | ×1,3 | 10,4 cases/s | ×1,65 | 3 000 $ + 80 fer + 40 redstone |
| 3 | 26 cases | ×1,7 | 13,6 cases/s | ×1,85 | 8 000 $ + 150 fer + 80 redstone |
| 4 | 33 cases | ×2,2 | 17,6 cases/s | ×2,1 | 20 000 $ + 250 fer + 150 redstone |
| 5 | 40 cases | ×3 | 24 cases/s | ×2,5 | 50 000 $ + 400 fer + 300 redstone |

Total des améliorations : 81 000 $ + 880 fer + 570 redstone. Message : « ⚡ Générateur niveau *N* : rayon de *R* cases, puissance ×*P*. »

## Règles et comportement

### La redstone

- **1 redstone = 30 secondes de courant** (`SECONDES_PAR_REDSTONE`), soit **2 redstone par minute** et **120 par heure**, quel que soit le niveau.
- Le générateur ne brûle sa redstone que s'il est **posé et allumé**. Il donne du courant tant qu'il en reste (`generateurEnMarche`).
- Quand il n'en a plus : « ⚡ Le générateur n'a plus de redstone : les rails ne sont plus électriques. »
- **Le puisage** (niveau 2 et plus, case cochée) : quand sa réserve passe **sous 5 minutes** (`RESERVE_GENERATEUR_AUTO` = 300 s), il prend dans le **coffre de la mine** juste ce qu'il faut pour remonter à 5 minutes (au plus 10 redstone d'un coup), jamais dans le sac. Il ne vide donc jamais le coffre d'un coup. Ça marche aussi jeu fermé.
- **Le wagonnet de la redstone** (24/10) : avec des rails de la mine au générateur, le panneau de la mine propose « Envoyer un wagonnet vers le générateur ». Ce trajet Mine → Générateur lui apporte la redstone du coffre jusqu'à une réserve de **30 minutes** (60 redstones, `RESERVE_GENERATEUR_WAGONNET` = 1 800 s). Le wagonnet du marché laisse alors cette redstone dans le coffre. Voir [mine.md](mine.md#les-wagonnets).
- Astuce : la redstone sort de la mine dès le niveau 2 (10 % des blocs), puis 12 % aux niveaux suivants. Avec le puisage, la mine nourrit toute seule son générateur.

### Le rayon

- Le rayon est un **cercle** autour du **centre** du générateur (le milieu de ses 5 × 5 cases), mesuré en cases (`caseDansLeRayon`) : une case est dans le rayon si son centre est à une distance d'au plus *R* cases.
- **Les rails** : un trajet est électrique si **toutes les cases de sa ligne** sont dans le rayon (`casesDansLeRayon`, `trajetElectrique` dans `wagonnet.ts`). Chaque trajet compte à part : Mine → Marché peut être électrique et Mine → Foreuse non. Un bout de rails qui ne sert à aucun trajet, hors du rayon, ne gêne pas.
- **Un bâtiment** (la foreuse) est dans le rayon si **son centre** l'est (`batimentDansLeRayon`).
- Le rayon compte même quand le générateur est éteint (pour le panneau), mais il ne donne du courant que s'il est allumé et a de la redstone.

### Ce que fait l'électricité

- **Les wagonnets** (trajets électriques, `trajetElectrique`) : un wagonnet part **tout seul** dès qu'il a quelque chose à porter, sans joueur ni pousseur. Il roule à **8 cases/s × la puissance** (contre 3 cases/s poussé par toi et 2,5 par un pousseur). S'il perd le courant en route, il finit son trajet tout doucement, sur sa lancée (1,25 case/s). Voir [mine.md](mine.md#les-wagonnets).
- **La foreuse** (dans le rayon, `foreuseAlimentee`) : elle fore **× (1 + 0,5 × puissance)** plus vite (`BONUS_ELECTRIQUE_FOREUSE`), sans brûler plus de charbon. Voir [foreuse.md](foreuse.md).
- Rien d'autre n'est électrique pour l'instant (ni la mine, ni les mineurs).
- Quand un trajet est électrique, plus besoin de son **pousseur** : le wagonnet part tout seul (le pousseur reste au quai, payé, à ne rien faire ; au Personnel, on peut le licencier ou lui donner un autre trajet).

### Bien le placer

- La mine fait 10 × 10 cases : avec un rayon de 15 cases (niveau 1), il faut que le générateur soit **près du milieu des rails** à électrifier. Des rails courts et ramassés tiennent plus facilement dans le cercle. Le bot de simulation le pose juste à côté du marché, contre la ligne.
- On peut le **déplacer gratuitement** (✏️ Modifier) : le cercle suit, et on voit tout de suite si les rails sont dedans.

## Lien avec le reste du jeu

- **Objectifs** (`objectifs.ts`) : « Construire : Générateur » dès le niveau 2 de la mine, puis « Générateur : rayon *N* cases » pour le niveau suivant. Quand rien n'est à acheter, l'objectif peut être « Allumer le générateur · mets-lui de la redstone » ou « Électrifier les rails · tout un trajet doit être dans le rayon du générateur ».
- **Succès** (`succes.ts`) : « ⚡ Électricien : électrifier les rails avec le générateur » (au moins un trajet électrique).
- **Le revenu « $/s »** du bandeau compte la foreuse boostée ; les wagonnets, eux, ne font que porter ce que la mine sort déjà.
- **Le bot** (`bot.ts`) : il pose le générateur dès qu'il peut, le remplit de 10 redstone quand il lui reste moins de 2 minutes, coche le puisage dès le niveau 2, et l'améliore quand il a deux fois le prix. Repère des tests : les rails sont électriques en **moins de 40 minutes** de jeu.
- **Événements et sons** : un niveau de plus joue la petite fanfare d'amélioration ; chaque vente d'un wagonnet au marché fait tinter 3 pièces discrètes.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.generateur`), `SECONDES_PAR_REDSTONE`, `NIVEAUX_GENERATEUR` (rayon, puissance, coût), `NIVEAU_GENERATEUR_AUTO`, `RESERVE_GENERATEUR_AUTO`, `VITESSE_RAILS`, `BONUS_ELECTRIQUE_FOREUSE`.
- `src/jeu/generateur.ts` : tout le générateur : rayon (`caseDansLeRayon`, `casesDansLeRayon`, `batimentDansLeRayon`), courant (`generateurEnMarche`, `foreuseAlimentee`), actions (`remplirGenerateur`, `basculerGenerateur`, `basculerPuisage`, `ameliorerGenerateur`) et le temps qui passe (`avancerGenerateur`).
- `src/jeu/generateur.test.ts` : les tests (rayon, rails électriques, redstone, puisage, foreuse boostée).
- `src/jeu/wagonnet.ts` : les trajets électriques (`trajetElectrique`, `railsAlimentes`), le wagonnet qui part tout seul et sa vitesse électrique ; le trajet Mine → Générateur qui lui apporte la redstone.
- `src/jeu/foreuse.ts` : la vitesse de forage boostée (`vitesseForage`).
- `src/jeu/mineur.ts` : le type `Generateur` (`niveau`, `carburant`, `allume`, `puiseDansLeCoffre`) dans `EtatJeu`.
- `src/jeu/notifications.ts`, `src/jeu/objectifs.ts`, `src/jeu/succes.ts` : les bulles 🔴 et 🚧, les objectifs, le succès Électricien.
- `src/composants/Panneaux.tsx` : `PanneauGenerateur`.
- `src/composants/VueVillage.tsx` : le cercle du rayon (`RayonGenerateur`), les wagonnets électriques ; `src/village.css` : `.rayon-generateur`, `.wagonnet-electrique`.
- `src/composants/iso.ts` : le calage de l'image ; `public/images/batiments/generateur.webp` : le dessin.
