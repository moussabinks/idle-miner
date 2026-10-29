# ⚡ Générateur

> La machine à éclairs du village (22/10) : elle brûle de la **redstone** et **accélère** tout ce qui est dans son **rayon** (23/10, de + 30 % à + 75 % selon son niveau ; 26/10 : jusqu'à + 100 % avec 7 niveaux) : **l'ascenseur de la mine** (si la mine est dans le rayon), **les wagonnets** (si tous les rails d'un trajet sont dans le rayon, son pousseur le pousse plus vite), **la foreuse**, et depuis le 26/10 **la fonderie** et **la joaillerie**. Un bon plus, pas un turbo.
> Mis à jour pour la grande mise à jour du 25/10 : rayon de 12 à 30 cases (la clairière fait 40 × 40 ; 26/10 : de 12 à 28, au niveau max il couvre toute la clairière depuis son milieu, sans la dépasser), nouveaux prix, ses niveaux suivent les **paliers** de la mine, plus de niveau du joueur pour le poser. Le panneau a été refait dans le nouveau style. Mis à jour le 26/10 (la grosse mise à jour des gemmes) : 7 niveaux (rayon jusqu'à 36 cases, + 100 %), et il accélère aussi la fonderie et la joaillerie.

## Où et quand

- **Où** : là où tu le poses dans la clairière. C'est un bâtiment de **5 × 5 cases**, comme les autres.
- **Déblocage** : au **niveau 2 de la mine** (« Veine de redstone »), là où la redstone commence à sortir de la mine. Depuis le 25/10, plus de niveau du joueur à part pour les bâtiments (avant : niveau 6). Avant, sa carte du menu 🏗️ Bâtiments a un cadenas « 🔒 Mine niveau 2 ».
- **Prix pour le poser** : **3 500 $ + 80 fer + 30 redstone** (25/10 ; avant 4 000 $ + 100 fer + 40 redstone), une seule fois. Les minerais se prennent dans le coffre de la mine.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). On peut l'ouvrir de n'importe quel côté (à moins de 1 case).
- **Le dessin au village** (25/10, SVG plat au contour d'encre, `public/images/batiments/generateur.svg`, dessiné par `generateur()` dans `outils/art/batiments.mjs`) : sur une dalle de 5 × 5 pavés, un socle en pierre et une grosse machine en métal à bande violette et couvercle sombre, une jauge sur la façade gauche, un panneau à l'éclair sur la façade droite (la porte), deux bobines de cuivre aux coins avec une boule rouge, et, au-dessus, un gros **cristal de redstone** pointu entouré d'étincelles. L'image ne bouge jamais (voir [../jeu/visuel-et-sons.md](../jeu/visuel-et-sons.md#11-la-fluidité--les-règles-à-respecter)).
- **Afficher le rayon sur la carte** (26/10, demandé par le propriétaire) : un interrupteur dans l'onglet Courant. Allumé, le cercle jaune du rayon reste sur la carte même le panneau fermé (sinon, on ne le voit que panneau ouvert, ou en posant le générateur). C'est un réglage de l'écran, gardé dans le navigateur (`src/rayonGenerateur.ts`), pas dans la partie. (26/10) Le cercle est plus visible : l'intérieur teinté de jaune, un trait d'encre sous les pointillés jaunes (gris quand le générateur est éteint). Aux derniers niveaux, le rayon couvre presque toute la clairière : on en voit surtout le bord et la teinte.
- **Description** (en haut du panneau) : « Il brûle de la redstone et électrifie tout ce qui est dans son rayon : rails, foreuse, fonderie et joaillerie. »
- **Le rayon sur la carte** : un **cercle en pointillés jaunes** autour du générateur (une ellipse à l'écran, car la grille est en losange) :
  - bien visible (plus épais, et les pointillés tournent) quand on est devant le générateur, ou pendant qu'on le pose (on voit alors le rayon autour du fantôme, pratique pour bien le placer) ;
  - gris quand il ne donne pas de courant (éteint ou sans redstone) ;
  - **caché le reste du temps** (23/10 : avant, il restait affiché en petit tant qu'il donnait du courant).
- **Le boost** (23/10) : dans l'onglet **🔌 Rayon et amélioration**, en grand et en or : « ⚡ Boost : + *B* % de vitesse », et ce qu'il accélère dans son rayon (ascenseur, wagonnets et pousseurs, foreuse, et depuis le 26/10 fonderie et joailliers). Chaque ligne de « Ce qu'il alimente » dit aussi « ✔ + *B* % de vitesse ! ». La fenêtre des rails, elle, ne parle plus d'électricité : c'est automatique dès que les rails sont dans le rayon.
- **Bulles au-dessus** (`notifications.ts`) :
  - **🔴 « Plus de redstone ! »** (alerte rouge) quand il est **allumé** mais n'a plus de redstone ;
  - **🚧 « Rails coupés »** (alerte rouge, 26/10) quand un trajet de wagonnet qui part d'ici ou y arrive n'a plus de rails complets (un rail enlevé, un bâtiment déplacé) : « Rails coupés entre … : le wagonnet attend. Repose les rails ! ». La bulle est sur les deux bâtiments du trajet ;
  - **⬆️ « Achetable »** quand le niveau suivant est payable tout de suite (seulement pendant le tutoriel).
- **Le bandeau** affiche un petit **⚡** quand au moins un trajet est électrique.

## Ce qu'on peut y faire

### ⚡ Courant

- Un badge : **Allumé** (vert), **Éteint**, ou **Plus de redstone**.
- « Rayon : *N* cases (le cercle jaune sur la carte). Tout ce qui est dedans va **+ *B* %** plus vite : l’ascenseur de la mine, les wagonnets (leurs rails entiers dans le cercle) et la foreuse. » (23/10)
- Une barre rouge : la redstone qui reste, en minutes, face à sa **réserve** (23/10 : « Redstone : 3 min / 5 min »).
- « 1 redstone = 30 s · tu en as *N* (coffre de la mine) », puis les boutons **+1**, **+10** et **Tout** (anthracite, comme le charbon de la foreuse). La redstone se prend dans le **coffre de la mine**, **même celle qu'on garde 📌** (28/10 : la punaise empêche seulement de la vendre ; avant, avec la redstone gardée, « Remplir » ne mettait rien et disait « Il te faut de la redstone (niveau 2 de la mine) » à un joueur qui avait passé le niveau 2). Sans redstone : « 🔴 Il te faut de la redstone (niveau 2 de la mine). » avant le niveau 2, « 🔴 Plus de redstone dans le coffre de la mine. » après. (29/10) Le wagonnet Mine → Générateur prend aussi la redstone gardée 📌, seulement ce qui manque à la réserve.
- **⏸ Éteindre / ▶ Allumer** (gris) : éteint, le générateur **garde sa redstone** et ne la brûle pas (mais il ne donne plus de courant).
- « 🛤️ Pour qu'il ne s'arrête jamais, embauche un pousseur sur le trajet Mine → Générateur : il apporte la redstone du coffre. La réserve grandit à chaque niveau. » (23/10 : le **puisage** dans le coffre est retiré, il contournait les pousseurs.)

### 🔌 Ce qu'il alimente

Une petite liste qui dit où on en est :

- **🛤️ Rails** : « pas encore de trajet de wagonnet », ou une ligne par trajet (« Mine → Marché : … ») : « ✔ électrique : son pousseur va plus vite ! » (23/10), « dans le rayon, mais le générateur ne donne pas de courant », « ✖ une partie des rails est hors du rayon : rapproche le générateur (ou agrandis son rayon) », ou « rails coupés ».
- **⚙️ Foreuse** : « pas encore construite », « ✔ boostée ! », « dans le rayon, mais sans courant », ou « ✖ hors du rayon ».
- (26/10) **🏭 Fonderie** et **🏪 Joaillerie**, une fois posées : « dans le rayon » ou « hors du rayon ». Dans le rayon (générateur allumé), la fonderie fond plus vite et les joailliers taillent plus vite.

### ⬆ Améliorer

Une ligne d'amélioration (carrés de niveaux, prix, bouton turquoise). Chaque niveau agrandit le **rayon**, le **bonus de vitesse** (`NIVEAUX_GENERATEUR`, champ `bonus`) et la **réserve** de redstone (23/10, champ `reserveMinutes`) :

| Niveau | Rayon | Bonus de vitesse | Réserve | Pousseur électrique (débutant, commun) | Coût (26/10) | Palier |
|---|---:|---:|---:|---:|---|---:|
| 1 | 12 cases | + 30 % | 5 min (10 redstones) | 3,25 cases/s | (le prix du bâtiment) | 2 |
| 2 | 15 cases | + 40 % | 7 min | 3,5 cases/s | 4 000 $ + 80 fer + 40 redstone | 2 |
| 3 | 18 cases | + 50 % | 10 min | 3,75 cases/s | 8 000 $ + 150 fer + 90 redstone | 3 |
| 4 | 21 cases | + 60 % | 13 min | 4 cases/s | 15 000 $ + 250 fer + 180 redstone | 4 |
| 5 | 24 cases | + 75 % | 16 min | 4,4 cases/s | 70 000 $ + 800 fer + 700 redstone | 5 |
| 6 | 26 cases | + 85 % | 19 min | 4,6 cases/s | 230 000 $ + 1 000 fer + 1 000 redstone | 6 |
| 7 | 28 cases | + 100 % | 22 min | 5 cases/s | 660 000 $ + 1 000 redstone + 120 saphir | 7 |

(Avant le 25/10 : rayon de 15 à 40 cases pour une clairière de 60 × 60, débloqué aux niveaux 6 à 15 du joueur. Avant le 23/10 : une « puissance » de × 1 à × 3, et le wagonnet électrique roulait tout seul.)

Total des améliorations : 987 000 $ + 2 280 fer + 3 010 redstone + 120 saphir (26/10, hausse de la fin de partie et plafond de 1 000 minerais compris ; jusqu'au niveau 5 : 97 000 $ + 1 280 fer + 1 010 redstone ; avant la hausse : 372 000 $ ; avant l'économie revue du 25/10 : 160 000 $). Sans le palier, la ligne affiche « 🕳️ Mine *N* » ; elle a aussi son bouton violet 💎 pour payer en gemmes. Message : « ⚡ Générateur niveau *N* : rayon de *R* cases, + *B* % de vitesse dans son rayon, *M* min de réserve. »

## Règles et comportement

### La redstone

- **1 redstone = 30 secondes de courant** (`SECONDES_PAR_REDSTONE`), soit **2 redstone par minute** et **120 par heure**, quel que soit le niveau.
- Le générateur ne brûle sa redstone que s'il est **posé et allumé**. Il donne du courant tant qu'il en reste (`generateurEnMarche`).
- Quand il n'en a plus : « ⚡ Le générateur n'a plus de redstone : les rails ne sont plus électriques. »
- **La réserve** (23/10, `reserveMaxGenerateur`) : il garde au plus **5 minutes** de redstone au niveau 1 (10 redstones), puis 7, 10, 13, 16, 19 et 22 minutes. À la main (« ⚡ La réserve du générateur est pleine. ») comme par les rails, on ne peut pas mettre plus. Avant, on pouvait le remplir sans limite (et le wagonnet jusqu'à 30 min) : sans pousseur, c'était trop fort.
- **Plus de puisage** (23/10) : il ne se sert plus tout seul dans le coffre de la mine. Sa redstone arrive par les rails (un pousseur sur Mine → Générateur) ou à la main.
- **Le wagonnet de la redstone** (24/10) : avec des rails de la mine au générateur, la bulle « 🛤️ Automatiser » sur les rails crée le trajet. Ce trajet Mine → Générateur lui apporte la redstone du coffre jusqu'à **sa réserve** (23/10 : 5 à 16 min selon son niveau ; 26/10 : jusqu'à 22 min, `placeRedstoneGenerateur`, `livrerRedstone` ; ce qui ne rentre pas reste dans le wagonnet). Le wagonnet du marché laisse alors cette redstone dans le coffre, **mais seulement si ce trajet a un pousseur embauché** (23/10, `trajetAutomatique`) : sans pousseur, rien ne l'emporterait, alors elle part au marché avec le reste. Voir [mine.md](mine.md#les-wagonnets).
- Astuce : la redstone sort de la mine dès le niveau 2 (10 % des blocs), puis 12 % aux niveaux suivants. Avec un pousseur sur Mine → Générateur, la mine nourrit toute seule son générateur.

### Le rayon

- Le rayon est un **cercle** autour du **centre** du générateur (le milieu de ses 5 × 5 cases), mesuré en cases (`caseDansLeRayon`) : une case est dans le rayon si son centre est à une distance d'au plus *R* cases.
- **Les rails** : un trajet est électrique si **toutes les cases de sa ligne** sont dans le rayon (`casesDansLeRayon`, `trajetElectrique` dans `wagonnet.ts`). Chaque trajet compte à part : Mine → Marché peut être électrique et Mine → Foreuse non. Un bout de rails qui ne sert à aucun trajet, hors du rayon, ne gêne pas.
- **Un bâtiment** (la foreuse, et depuis le 26/10 la fonderie et la joaillerie) est dans le rayon si **son centre** l'est (`batimentDansLeRayon`).
- Le rayon compte même quand le générateur est éteint (pour le panneau), mais il ne donne du courant que s'il est allumé et a de la redstone.

### Ce que fait l'électricité

Depuis le 23/10, tout va **+ 30 % à + 75 %** plus vite (26/10 : jusqu'à + 100 % au niveau 7) (`multiplicateurGenerateur` = 1 + bonus) :

- **Les wagonnets** (trajets électriques, `trajetElectrique`) : **son pousseur le pousse toujours** (il ne reste plus au quai), mais plus vite : 2,5 cases/s × sa vitesse × sa rareté × le multiplicateur. Sans pousseur payé, rien ne part. (Avant le 23/10 : le wagonnet roulait tout seul à 8 à 24 cases/s, bien trop vite, et le pousseur restait immobile au quai.)
- **L'ascenseur de la mine** (la mine dans le rayon, `ascenseurAlimente`) : ses trajets sont plus courts (`secondesTrajetMineur` ÷ le multiplicateur), donc il remonte plus de blocs.
- **La foreuse** (dans le rayon, `foreuseAlimentee`) : elle fore × le multiplicateur, sans brûler plus de charbon. Voir [foreuse.md](foreuse.md).
- (26/10) **La fonderie** (dans le rayon, `atelierAlimente`) : elle fond × le multiplicateur (son four brûle toujours 1 charbon toutes les 12 s de travail). Voir [fonderie.md](fonderie.md).
- (26/10) **La joaillerie** (dans le rayon, `atelierAlimente`) : chaque joaillier taille × le multiplicateur. Voir [joaillerie.md](joaillerie.md).

### Bien le placer

- La mine fait 10 × 10 cases : avec un rayon de 12 cases (niveau 1), il faut que le générateur soit **près du milieu des rails** à électrifier. Des rails courts et ramassés tiennent plus facilement dans le cercle. Le bot de simulation le pose juste à côté du marché, contre la ligne.
- On peut le **déplacer gratuitement** (✏️ Modifier) : le cercle suit, et on voit tout de suite si les rails sont dedans.

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Générateur » dès le niveau 2 de la mine, puis « Générateur : vitesse + *N* % » (amélioration, 26/10 : avant, son rayon) pour le niveau suivant. Une fois posé, les missions de l'automatisation sont « Mets de la redstone dans le générateur » et « Mets tous les rails dans le rayon du générateur ».
- **Succès** (`succes.ts`) : « ⚡ Électricien : électrifier les rails avec le générateur » (au moins un trajet électrique).
- **Le revenu « $/s »** du bandeau compte la foreuse boostée (et, 26/10, la fonderie et les joailliers boostés) ; les wagonnets, eux, ne font que porter ce que la mine sort déjà.
- **Le bot** (`bot.ts`) : il pose le générateur dès qu'il peut, le remplit de 10 redstone quand il lui reste moins de 2 minutes, et l'améliore quand il a deux fois le prix. Il le pose en (25, 27), contre la ligne de rails. Repère des tests : les rails sont électriques en **moins de 1 h 30** de jeu (mesuré le 25/10 : 15 minutes en médiane ; 55 minutes le 30/10).
- **Événements et sons** : un niveau de plus joue la petite fanfare d'amélioration ; chaque vente d'un wagonnet au marché fait tinter 3 pièces discrètes.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.generateur` : 3 500 $ + 80 fer + 30 redstone), `SECONDES_PAR_REDSTONE`, `NIVEAUX_GENERATEUR` (rayon, bonus, réserve, coût).
- `src/jeu/generateur.ts` : tout le générateur : rayon (`caseDansLeRayon`, `casesDansLeRayon`, `batimentDansLeRayon`), courant (`generateurEnMarche`, `foreuseAlimentee`, `atelierAlimente` (26/10)), actions (`remplirGenerateur`, `basculerGenerateur`, `ameliorerGenerateur`) et le temps qui passe (`avancerGenerateur`).
- `src/jeu/generateur.test.ts` : les tests (rayon, rails électriques, redstone, réserve, foreuse boostée).
- `src/jeu/wagonnet.ts` : les trajets électriques (`trajetElectrique`, `railsAlimentes`), le wagonnet qui part tout seul et sa vitesse électrique ; le trajet Mine → Générateur qui lui apporte la redstone.
- `src/jeu/foreuse.ts` : la vitesse de forage boostée (`vitesseForage`).
- `src/jeu/mineur.ts` : le type `Generateur` (`niveau`, `carburant`, `allume`) dans `EtatJeu`.
- `src/jeu/notifications.ts`, `src/jeu/objectifs.ts`, `src/jeu/succes.ts` : les bulles 🔴 et 🚧, les missions, le succès Électricien.
- `src/composants/Panneaux.tsx` : `PanneauGenerateur`.
- `src/composants/VueVillage.tsx` : le cercle du rayon (`RayonGenerateur`), les wagonnets électriques ; `src/village.css` : `.rayon-generateur`, `.wagonnet-electrique`.
- `src/composants/iso.ts` : le calage de l'image ; `public/images/batiments/generateur.svg` : le dessin, fabriqué par `node outils/art/fabriquer.mjs` (`outils/art/batiments.mjs`).
