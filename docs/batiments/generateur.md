# ⚡ Générateur

> La machine à éclairs du village (22/10) : elle brûle de la **redstone** et **accélère** tout ce qui est dans son **rayon** (23/10, de + 30 % à + 75 % selon son niveau) : **l'ascenseur de la mine** (si la mine est dans le rayon), **les wagonnets** (si tous les rails d'un trajet sont dans le rayon, son pousseur le pousse plus vite) et **la foreuse**. Un bon plus, pas un turbo.

## Où et quand

- **Où** : là où tu le poses dans la clairière. C'est un bâtiment de **5 × 5 cases**, comme les autres.
- **Déblocage** : au **niveau 2 de la mine** (« Veine de redstone ») **et** au **niveau 6 du joueur** (30/10, `NIVEAU_JOUEUR_POUR.batiments.generateur` ; le 29/10, niveau 5 et avant la foreuse : depuis le 30/10, il vient **après la foreuse**, le dernier du menu). Avant, sa carte du menu 🏗️ Bâtiments a un cadenas « 🔒 Niveau 6 » (ou « 🔒 Mine niveau 2 »). C'est aussi le niveau où la redstone commence à sortir de la mine.
- **Prix pour le poser** : **4 000 $ + 100 fer + 40 redstone** (29/10 ; avant 1 200 $ + 50 fer + 20 redstone), une seule fois. Les minerais se prennent dans le sac, puis dans le coffre de la mine.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). On peut l'ouvrir de n'importe quel côté (à moins de 1 case).
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/generateur.webp`) : une grosse bobine dorée et vitrée pleine d'éclairs jaunes, dans un bâti en bois et en métal, avec des tuyaux en cuivre, un cadran, deux petites bobines aux coins et des arcs électriques au-dessus, sur une dalle de 5 × 5 pavés.
- **Description** (en haut du panneau) : « Il brûle de la redstone et électrifie tout ce qui est dans son rayon : rails et foreuse. »
- **Le rayon sur la carte** : un **cercle en pointillés jaunes** autour du générateur (une ellipse à l'écran, car la grille est en losange) :
  - bien visible (plus épais, et les pointillés tournent) quand on est devant le générateur, ou pendant qu'on le pose (on voit alors le rayon autour du fantôme, pratique pour bien le placer) ;
  - en tout petit, discret, le reste du temps, tant qu'il donne du courant ;
  - gris quand il ne donne pas de courant (éteint ou sans redstone) ; caché s'il ne donne pas de courant et qu'on ne le regarde pas.
- **Bulles au-dessus** (`notifications.ts`) :
  - **🔴 « Plus de redstone ! »** (alerte rouge) quand il est **allumé** mais n'a plus de redstone ;
  - **🚧 « Rails coupés »** (alerte rouge, 26/10) quand un trajet de wagonnet qui part d'ici ou y arrive n'a plus de rails complets (un rail enlevé, un bâtiment déplacé) : « Rails coupés entre … : le wagonnet attend. Repose les rails ! ». La bulle est sur les deux bâtiments du trajet ;
  - **💰 « Une amélioration est achetable ! »** quand le niveau suivant est payable tout de suite (depuis le 30/10, seulement pendant le tutoriel).
- **Le bandeau** affiche un petit **⚡** quand au moins un trajet est électrique.

## Ce qu'on peut y faire

### ⚡ Courant

- Un badge : **Allumé** (vert), **Éteint**, ou **Plus de redstone**.
- « Rayon : *N* cases (le cercle jaune sur la carte). Tout ce qui est dedans va **+ *B* %** plus vite : l’ascenseur de la mine, les wagonnets (leurs rails entiers dans le cercle) et la foreuse. » (23/10)
- Une barre rouge : la redstone qui reste, en minutes, face à sa **réserve** (23/10 : « Redstone : 3 min / 5 min »).
- « 1 redstone = 30 s · tu en as *N* (sac + coffre) », puis les boutons **+1**, **+10** et **Tout** (anthracite, comme le charbon de la foreuse). La redstone se prend d'abord dans le **sac**, puis dans le **coffre de la mine**. Sans redstone : « 🔴 Il te faut de la redstone (niveau 2 de la mine). »
- **⏸ Éteindre / ▶ Allumer** (gris) : éteint, le générateur **garde sa redstone** et ne la brûle pas (mais il ne donne plus de courant).
- « 🛤️ Pour qu'il ne s'arrête jamais, embauche un pousseur sur le trajet Mine → Générateur : il apporte la redstone du coffre. La réserve grandit à chaque niveau. » (23/10 : le **puisage** dans le coffre est retiré, il contournait les pousseurs.)

### 🔌 Ce qu'il alimente

Une petite liste qui dit où on en est :

- **🛤️ Rails** : « pas encore de trajet de wagonnet », ou une ligne par trajet (« Mine → Marché : … ») : « ✔ électrique : son pousseur va plus vite ! » (23/10), « dans le rayon, mais le générateur ne donne pas de courant », « ✖ une partie des rails est hors du rayon : rapproche le générateur (ou agrandis son rayon) », ou « rails coupés ».
- **⚙️ Foreuse** : « pas encore construite », « ✔ boostée ! », « dans le rayon, mais sans courant », ou « ✖ hors du rayon ».

### ⬆ Améliorer

Une ligne d'amélioration (carrés de niveaux, prix, bouton turquoise). Chaque niveau agrandit le **rayon**, le **bonus de vitesse** (`NIVEAUX_GENERATEUR`, champ `bonus`) et la **réserve** de redstone (23/10, champ `reserveMinutes`) :

| Niveau | Rayon | Bonus de vitesse (23/10) | Réserve (23/10) | Pousseur électrique | Coût (29/10) | Niveau du joueur (30/10) |
|---|---:|---:|---:|---:|---|---:|
| 1 | 15 cases | + 30 % | 5 min (10 redstones) | 3,25 cases/s | (le prix du bâtiment) | 6 |
| 2 | 20 cases | + 40 % | 7 min | 3,5 cases/s | 7 500 $ + 120 fer + 60 redstone | 8 |
| 3 | 26 cases | + 50 % | 10 min | 3,75 cases/s | 20 000 $ + 220 fer + 120 redstone | 10 |
| 4 | 33 cases | + 60 % | 13 min | 4 cases/s | 50 000 $ + 350 fer + 220 redstone | 13 |
| 5 | 40 cases | + 75 % | 16 min | 4,4 cases/s | 120 000 $ + 550 fer + 420 redstone | 15 |

(Avant le 23/10 : une « puissance » de × 1 à × 3, le wagonnet électrique roulait tout seul à 8 à 24 cases/s et la foreuse allait × 1,5 à × 2,5 : c'était trop fort.)

Total des améliorations : 197 500 $ + 1 240 fer + 820 redstone (avant le 29/10 : 81 000 $ + 880 fer + 570 redstone). Sans le niveau du joueur, la ligne affiche « 🔒 … · au niveau *N* ». Message : « ⚡ Générateur niveau *N* : rayon de *R* cases, + *B* % de vitesse dans son rayon, *M* min de réserve. »

## Règles et comportement

### La redstone

- **1 redstone = 30 secondes de courant** (`SECONDES_PAR_REDSTONE`), soit **2 redstone par minute** et **120 par heure**, quel que soit le niveau.
- Le générateur ne brûle sa redstone que s'il est **posé et allumé**. Il donne du courant tant qu'il en reste (`generateurEnMarche`).
- Quand il n'en a plus : « ⚡ Le générateur n'a plus de redstone : les rails ne sont plus électriques. »
- **La réserve** (23/10, `reserveMaxGenerateur`) : il garde au plus **5 minutes** de redstone au niveau 1 (10 redstones), puis 7, 10, 13 et 16 minutes. À la main (« ⚡ La réserve du générateur est pleine. ») comme par les rails, on ne peut pas mettre plus. Avant, on pouvait le remplir sans limite (et le wagonnet jusqu'à 30 min) : sans pousseur, c'était trop fort.
- **Plus de puisage** (23/10) : il ne se sert plus tout seul dans le coffre de la mine. Sa redstone arrive par les rails (un pousseur sur Mine → Générateur) ou à la main.
- **Le wagonnet de la redstone** (24/10) : avec des rails de la mine au générateur, la bulle « 🛤️ Automatiser » sur les rails crée le trajet. Ce trajet Mine → Générateur lui apporte la redstone du coffre jusqu'à **sa réserve** (23/10 : 5 à 16 min selon son niveau, `placeRedstoneGenerateur`, `livrerRedstone` ; ce qui ne rentre pas reste dans le wagonnet). Le wagonnet du marché laisse alors cette redstone dans le coffre, **mais seulement si ce trajet a un pousseur embauché** (23/10, `trajetAutomatique`) : sans pousseur, rien ne l'emporterait, alors elle part au marché avec le reste. Voir [mine.md](mine.md#les-wagonnets).
- Astuce : la redstone sort de la mine dès le niveau 2 (10 % des blocs), puis 12 % aux niveaux suivants. Avec un pousseur sur Mine → Générateur, la mine nourrit toute seule son générateur.

### Le rayon

- Le rayon est un **cercle** autour du **centre** du générateur (le milieu de ses 5 × 5 cases), mesuré en cases (`caseDansLeRayon`) : une case est dans le rayon si son centre est à une distance d'au plus *R* cases.
- **Les rails** : un trajet est électrique si **toutes les cases de sa ligne** sont dans le rayon (`casesDansLeRayon`, `trajetElectrique` dans `wagonnet.ts`). Chaque trajet compte à part : Mine → Marché peut être électrique et Mine → Foreuse non. Un bout de rails qui ne sert à aucun trajet, hors du rayon, ne gêne pas.
- **Un bâtiment** (la foreuse) est dans le rayon si **son centre** l'est (`batimentDansLeRayon`).
- Le rayon compte même quand le générateur est éteint (pour le panneau), mais il ne donne du courant que s'il est allumé et a de la redstone.

### Ce que fait l'électricité

Depuis le 23/10, tout va **+ 30 % à + 75 %** plus vite (`multiplicateurGenerateur` = 1 + bonus) :

- **Les wagonnets** (trajets électriques, `trajetElectrique`) : **son pousseur le pousse toujours** (il ne reste plus au quai), mais plus vite : 2,5 cases/s × sa rareté × le multiplicateur. Sans pousseur payé, rien ne part. (Avant le 23/10 : le wagonnet roulait tout seul à 8 à 24 cases/s, bien trop vite, et le pousseur restait immobile au quai.)
- **L'ascenseur de la mine** (la mine dans le rayon, `ascenseurAlimente`) : ses trajets sont plus courts (`secondesTrajetMineur` ÷ le multiplicateur), donc il remonte plus de blocs.
- **La foreuse** (dans le rayon, `foreuseAlimentee`) : elle fore × le multiplicateur, sans brûler plus de charbon. Voir [foreuse.md](foreuse.md).

### Bien le placer

- La mine fait 10 × 10 cases : avec un rayon de 15 cases (niveau 1), il faut que le générateur soit **près du milieu des rails** à électrifier. Des rails courts et ramassés tiennent plus facilement dans le cercle. Le bot de simulation le pose juste à côté du marché, contre la ligne.
- On peut le **déplacer gratuitement** (✏️ Modifier) : le cercle suit, et on voit tout de suite si les rails sont dedans.

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Générateur » dès le niveau 2 de la mine et le niveau 6 du joueur (30/10), puis « Générateur : rayon *N* cases » (amélioration) pour le niveau suivant. Une fois posé, les missions de l'automatisation sont « Mets de la redstone dans le générateur » et « Mets tous les rails dans le rayon du générateur ».
- **Succès** (`succes.ts`) : « ⚡ Électricien : électrifier les rails avec le générateur » (au moins un trajet électrique).
- **Le revenu « $/s »** du bandeau compte la foreuse boostée ; les wagonnets, eux, ne font que porter ce que la mine sort déjà.
- **Le bot** (`bot.ts`) : il pose le générateur dès qu'il peut, le remplit de 10 redstone quand il lui reste moins de 2 minutes, et l'améliore quand il a deux fois le prix. Repère des tests : les rails sont électriques en **moins de 1 h 30** de jeu (29/10 ; 40 minutes avant les prix relevés ; mesuré le 30/10 : 55 minutes en médiane).
- **Événements et sons** : un niveau de plus joue la petite fanfare d'amélioration ; chaque vente d'un wagonnet au marché fait tinter 3 pièces discrètes.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.generateur`), `SECONDES_PAR_REDSTONE`, `NIVEAUX_GENERATEUR` (rayon, bonus, réserve, coût), `VITESSE_RAILS`, `BONUS_ELECTRIQUE_FOREUSE`.
- `src/jeu/generateur.ts` : tout le générateur : rayon (`caseDansLeRayon`, `casesDansLeRayon`, `batimentDansLeRayon`), courant (`generateurEnMarche`, `foreuseAlimentee`), actions (`remplirGenerateur`, `basculerGenerateur`, `ameliorerGenerateur`) et le temps qui passe (`avancerGenerateur`).
- `src/jeu/generateur.test.ts` : les tests (rayon, rails électriques, redstone, réserve, foreuse boostée).
- `src/jeu/wagonnet.ts` : les trajets électriques (`trajetElectrique`, `railsAlimentes`), le wagonnet qui part tout seul et sa vitesse électrique ; le trajet Mine → Générateur qui lui apporte la redstone.
- `src/jeu/foreuse.ts` : la vitesse de forage boostée (`vitesseForage`).
- `src/jeu/mineur.ts` : le type `Generateur` (`niveau`, `carburant`, `allume`) dans `EtatJeu`.
- `src/jeu/notifications.ts`, `src/jeu/objectifs.ts`, `src/jeu/succes.ts` : les bulles 🔴 et 🚧, les missions, le succès Électricien.
- `src/composants/Panneaux.tsx` : `PanneauGenerateur`.
- `src/composants/VueVillage.tsx` : le cercle du rayon (`RayonGenerateur`), les wagonnets électriques ; `src/village.css` : `.rayon-generateur`, `.wagonnet-electrique`.
- `src/composants/iso.ts` : le calage de l'image ; `public/images/batiments/generateur.webp` : le dessin.
