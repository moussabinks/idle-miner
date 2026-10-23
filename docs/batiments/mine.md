# ⛏️ Mine

> Le cœur du jeu, au milieu de la clairière (22/10 : la mine automatique). On ne descend plus dedans : devant la mine, on **clique sur un gros bloc** pour creuser, et tout ce qui sort va dans le **coffre de la mine**. La mine sort aussi des blocs toute seule. C'est ici qu'on **descend d'un niveau** (5 niveaux, de nouveaux minerais à chaque fois), qu'on agrandit le coffre, qu’on améliore l’ascenseur des mineurs (là dès le début depuis le 30/10) et qu’on **envoie des wagonnets** vers le marché, la foreuse et le générateur.
> Les règles détaillées du minage (le bloc, les pioches, les niveaux) sont aussi dans [../jeu/mine-et-minage.md](../jeu/mine-et-minage.md).

## Où et quand

- **Où** : la mine est **déjà posée** au début de la partie, **au milieu de la clairière** (cases 25 à 34 de la grille de 60 × 60, `POSITION_MINE`). C'est le seul bâtiment de **10 × 10 cases** (identifiant `'puits'`, nom affiché « Mine »). Elle n'est pas dans le menu Bâtiments (rien à payer), mais **✏️ Modifier** permet de la déplacer ou de la retourner gratuitement.
- **Déblocage** : dès le début, jamais de cadenas. Mais ses améliorations (niveaux de la mine, coffre, ascenseur, taille des wagonnets) demandent depuis le 29/10 un **niveau du joueur** (« 🔒 … · au niveau N », voir le tableau des chiffres et [../jeu/niveaux.md](../jeu/niveaux.md)).
- **La porte** : au milieu de sa face avant **gauche** (à droite si elle est retournée). Le hamster du joueur apparaît devant elle au chargement de la partie.
- **L'ouvrir** : toucher (ou cliquer) la mine, ou le gros bouton rond **⛏️ Mine** en bas à gauche de l'écran : le hamster marche jusqu'au côté de la mine le plus proche de lui, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case de la mine, de n'importe quel côté. Au chargement d'une partie, le panneau reste fermé (il ne s'ouvre qu'en arrivant en marchant).
- **Description** (en haut du panneau) : « Clique sur le bloc pour creuser. Tout ce qui sort de la mine va dans son coffre. »
- **Le dessin au village** : le dessin de la mine de l'équipe (une fosse en planches et en pierre, avec son treuil, ses minerais et ses lanternes, `public/images/batiments/mine.webp`), calé pile sur ses 10 × 10 cases (`CALAGES.puits`). Par-dessus (`DessinEvolutionMine` dans `DessinsVillage.tsx`) :
  - l'**ascenseur** (dès le début depuis le 30/10 ; avant, il fallait le construire) : sa **caisse** (23/10, `caisse-ascenseur-0` à `-4.webp`, dessins de l'équipe) pend aux deux câbles du treuil : elle **monte pleine tout en haut** (avec les minerais du niveau de la mine), puis **redescend vide, doucement, jusqu'à disparaître** dans le puits ; sans sac à remonter, elle attend au fond. Tout en bas, elle est à moitié cachée derrière la barrière de devant (`mine-devant.webp`). Depuis le 30/10, pendant qu'un mineur vide sa caisse dans le coffre, **la caisse pleine reste en haut, dans la cabine** (avant, l'ascenseur semblait disparaître pendant le déchargement). Sans ascenseur (une vieille partie, avant sa conversion), les câbles pendent au fond. Depuis le 27/10, **les mineurs sont dessinés dans la cabine** quand ils descendent (de dos) ou remontent (de face), **trois au plus** à la fois : on ne voit que le haut de leur corps, coupés sous le bord avant de la cabine (`PassagerAscenseur`, `passagers` de `DessinEvolutionMine`). Sans ascenseur, ils descendent l'échelle et disparaissent sous le bord du puits ;
  - un **panneau en bois** planté sur le sol de devant affiche le niveau de la mine (« Niv. 3 »).
- **Bulles au-dessus** (`notifications.ts`) :
  - **📦 « Le coffre de la mine est plein : viens le vider ! »** (alerte rouge) ;
  - **🚧 « Rails coupés »** (alerte rouge, 26/10) quand un trajet qui part de la mine (ou qui y arrive) n'a plus de rails complets : « Rails coupés entre mine et marché : le wagonnet attend. Repose les rails ! ». La même bulle est sur l'autre bâtiment du trajet ;
  - **📦 « *N* objets dans le coffre : porte-les au marché »** (bulle rose « prêt ») quand le coffre a au moins 20 objets et qu'il n'y a pas encore de trajet Mine → Marché ;
  - **💰 « Une amélioration est achetable ! »** quand le niveau suivant de la mine, du coffre, de l'ascenseur (si on a des mineurs) ou des wagonnets (s'il y a au moins un trajet) est payable tout de suite (et débloqué par le niveau du joueur, 29/10). Depuis le 30/10, **seulement pendant le tutoriel** (ensuite, la liste des tâches propose les achats).
- **La jauge du coffre** (27/10) : au-dessus de la mine, une petite barre est **toujours visible** : « 📦 *n* / *capacité* » (en court : « 1,2 k », « 12 k »…). Elle est verte, passe à l'**orange** à 75 % et au **rouge** quand le coffre est plein (elle grossit alors et rétrécit, comme un cœur qui bat). On voit d'un coup d'œil s'il faut vider le coffre. À côté, « 👷 *n* » (depuis le 27/10) dit combien de mineurs **travaillent au fond de la mine** (ils descendent, creusent, remontent ou vident leur sac). Les bulles de la mine sont un peu plus haut, au-dessus de cette jauge.
- **Le bandeau** (en haut de l'écran) montre toujours le niveau de la mine, son nom et le remplissage du coffre (la case clignote en rouge quand il est plein).

## Ce qu'on peut y faire

Le panneau (`PanneauMine.tsx`, refait le 27/10) est rangé en **quatre onglets** depuis le 30/10 (`OngletsPanneau` ; cinq le 27/10), pour que **rien ne défile**, même au niveau 5 avec un coffre plein de minerais (sur ordinateur comme sur téléphone). Sur un grand écran (1 100 px et plus), le panneau de la mine est plus large depuis le 30/10 (**480 px** au lieu de 400) :

- **⛏️ Creuser** : le bloc à cliquer (à gauche) avec ses infos à droite, puis le coffre, le raccourci vers l'onglet Améliorer, puis le rappel du niveau suivant (caché sur téléphone). Pastille « ! » quand le coffre est plein ;
- **⬆️ Améliorer** (30/10) : la grande carte du niveau suivant, la taille du coffre et l'ascenseur, réunis (avant, deux onglets « ⬇️ Niv. *N* » et « ⬆️ Plus », où le coffre et l'ascenseur passaient inaperçus). Pastille « + » quand l'une de ces trois choses est débloquée et payable tout de suite ;
- **🚃 Wagons** : les trajets qui partent de la mine (avec leur nombre dans le titre) ;
- **📊 Prod.** : le tableau de production et les goulots (pastille « ! » quand l'ascenseur ou le wagonnet ne suit pas).

Depuis le 28/10, les onglets **respirent** (classe `panneau-mine-aere`) : plus d'espace entre les cartes et entre les lignes (coffre, production, goulots), un peu moins sur téléphone, et tout tient encore sans défiler.

L'onglet **Creuser** s'ouvre en premier. Le titre du panneau n'a plus de phrase de description (elle est dans la bulle d'aide du titre).

- À droite du bloc : « Niveau *N* · **nom du niveau** », le bloc à casser, la jauge de la pioche, la chance de doubler, et une ligne dorée « ⚙️ *X* blocs/s · ≈ *Y* $/min ».

### Le bloc à cliquer

- Un **très gros bloc** (150 px, le prochain bloc de la mine, dessiné en CSS : pierre, charbon, fer…) dans un cadre sombre, et dessous « 👆 ⚫ Charbon » et « ⛏️ *N* % de chance de doubler un minerai ».
- **Chaque clic casse le bloc** : des éclats volent, ce qui tombe s'envole au-dessus (« +1 ⚫ », ou « +2 💎 ×2 ! » en doré quand il est doublé), et un nouveau bloc « pousse » à sa place. Le bloc tombé va dans le **coffre**.
- **La jauge de la pioche** (27/10), juste sous le bloc : l'icône de la pioche en main, « Pioche en *X* · *reste* / *durabilité* » dans une barre dont la couleur passe **peu à peu du vert au rouge** à mesure qu'elle s'use (30/10 ; avant : verte, puis orange sous 20 %) ; sous **15 %**, elle **clignote** et s'entoure de rouge ; à zéro, « Cassée : répare-la au forgeron » (`JaugePioche`).
- **Pioche cassée** : « 💥 Pioche cassée : 2 clics par bloc. Fais-la réparer au forgeron. » Après le premier clic, le bloc est fissuré ; le second le casse.
- **Coffre plein** : le bloc est grisé (« 📦 Coffre plein ! ») : il faut vider le coffre.
- **Le combo** (27/10) : les clics rapprochés (moins de **0,9 s** entre deux) s'additionnent. Dès **3 clics**, un compteur orange « 🔥 ×*N* » saute à côté du bloc à chaque clic (plus gros et plus doré à partir de 25). Plus le combo est long, plus le cadre et le halo doré sous le bloc brillent (au maximum à 50) ; à partir de 10, le bloc a un liseré doré. Un petit arpège (`sons.combo`) marque les paliers **10, 25, 50, 100, 200 et 500**. Sans clic pendant 0,9 s, le combo retombe à zéro. Jusqu'au 29/10, le combo ne changeait rien au jeu.
- **Les bonus de combo** (30/10, `BONUS_COMBO`) : chaque palier donne un bonus de quelques secondes (toast « 🍀 Combo ×10 : Fortune ! +25 % de fortune pendant 3 s ») : **10** 🍀 Fortune (+25 % de chance de doubler, 3 s), **25** 🍀 Grande fortune (+50 %, 4 s), **50** 💥 Double coup (+25 %, 2 blocs par clic, 5 s), **100** 🔥 Frénésie (+100 %, 2 blocs par clic, 8 s), **200** ✨ Ruée vers l'or (+100 %, 3 blocs par clic, 10 s), **500** 🏆 Légende de la mine (+100 %, 5 blocs par clic, 15 s). Le nouveau bonus remplace celui en cours. Au-dessus du bloc, une étiquette dorée montre le bonus en cours et les secondes qui restent ; sans bonus, dès 3 clics : « Prochain bonus à ×*N* : … ». Détail dans [../jeu/mine-et-minage.md](../jeu/mine-et-minage.md).

### Le tableau de production (27/10)

Juste sous le bloc, un tableau de bord (`TableauProduction`) dit **ce que la mine produit et d'où ça vient** :

- en gros, le **total en blocs par seconde** (la mine toute seule + les mineurs + tes clics), et à côté **≈ *X* $/min**, ce que vaut à peu près cette production au marché (mine + mineurs, d'après la valeur moyenne d'un bloc du niveau) ;
- trois cases : **⚙️ Mine** (la mine toute seule), **👷 Mineurs** (tous les mineurs au travail, trajets compris) et **👆 Toi** (tes clics des **3 dernières secondes**, la case s'allume quand tu cliques) ;
- puis **une ligne par mineur** (pas les pousseurs) : l'icône de ce qu'il fait, son nom, sa rareté (en couleur), une barre comparée au meilleur mineur, et ses blocs par seconde, ou « 😠 salaire » s'il attend sa paie ;
- coffre plein : « 📦 Coffre plein : la mine et les mineurs sont à l'arrêt ! », et tout tombe à 0.

Ce sont des **moyennes** (les vrais blocs sont tirés au hasard), calculées par la fonction pure `production(etat)` (`src/jeu/production.ts`) : le débit de la mine (`debitMine`, 0 si le coffre est plein), celui de chaque mineur (`blocsParSecondeEmploye`, 0 s'il attend son salaire ou si le coffre est plein) et les dollars par minute (`valeurMoyenneBloc`).

### Les goulots : l'ascenseur et le wagonnet suivent-ils ? (27/10)

Sous le tableau de production (`Goulots`, calculs dans `src/jeu/production.ts`, testés) :

- **L'ascenseur** (`analyseAscenseur`) : chaque mineur fait des allers-retours (creuser, remonter, vider son sac, redescendre). Le temps passé dans le puits (2 trajets d'ascenseur ou d'échelle par cycle) est du temps où il ne creuse pas. On calcule la **part de leur temps perdue dans le puits** (moyenne des mineurs : 2 × trajet ÷ (sac ÷ vitesse + 2 × trajet + vidage)) et ce que rapporterait **le niveau suivant** (blocs/s en plus, en refaisant le calcul avec ce niveau). Au-delà de **20 %** (`PART_PUITS_TROP_LENTE`), s'il reste un niveau et (30/10) si ce niveau rapporterait au moins **10 %** de blocs en plus (sinon, pas d'alerte pour « +0,01 bloc/s ») : alerte orange « ⚠️ **Ascenseur trop lent** : tes mineurs passent *X* % de leur temps dans le puits. Niveau suivant : +*Y* bloc/s. » avec un bouton **⬆️ Voir** (onglet Améliorer, où la carte de l'ascenseur redit la même chose). Sinon une ligne verte « ✔ Ascenseur : *X* % du temps des mineurs dans le puits ».
- **Le wagonnet Mine → Marché** (`analyseWagonnet`) : ce qu'il peut emporter au plus, en blocs par seconde = sa **capacité** ÷ la durée d'un **aller-retour** (aller + retour à sa vitesse, plus les 2 s de chargement et les 2 s de vente : `secondesAllerRetour`), comparé à ce qui arrive dans le coffre (la mine toute seule + les mineurs payés). Trois cas : « ⚠️ **Personne ne pousse le wagonnet du marché** » (ni pousseur payé, ni rails électriques) ; « ⚠️ **Wagonnet saturé** : il emporte au plus *X* bloc/s (aller-retour de *N* s), la mine en sort *Y*. Le coffre se remplit de *Z* bloc/s : agrandis les wagonnets (ou électrifie les rails) » avec **⬆️ Voir** (onglet Wagonnets) ; sinon « ✔ Wagonnet : jusqu'à *X* bloc/s, la mine en sort *Y* ».

### 📦 Le coffre · *n* / *capacité*

- Une barre (plus grosse depuis le 27/10) : le remplissage (rouge et « Plein : la mine s'arrête ! » quand il est plein).
- **Un tableau, une ligne par minerai** (27/10, `CoffreMine`) : **tous les minerais que sort la mine à son niveau**, même à 0 (plus ceux d'un ancien niveau qui resteraient), les plus chers en haut. Pour chacun : son nom et son prix, **combien il y en a** (grisé à 0), et :
  - avec le trajet Mine → Marché, **🚃 Wagonnet : Vendre / Garder** (deux boutons collés, vert = le wagonnet l'emporte et le vend, brun = il le laisse dans le coffre ; `envoyerObjet`, la même liste que les objets de la fenêtre du trajet). « Vendre » enlève aussi le minerai des objets gardés du marché. On le règle à l'avance, avant même d'en avoir. Avec un trajet vers la foreuse (ou le générateur), le charbon (la redstone) porte la mention « 🔥 foreuse d'abord » (« ⚡ générateur d'abord ») ;
  - **📌 Garder · 🎒 Prendre** (23/10) : un **curseur** règle **combien en garder** dans le coffre (0 par défaut), avec « 📌*N* » à côté (doré quand on garde quelque chose). Le réglage reste (`etat.coffre.garder`, `reglerGarde`) : le **wagonnet du marché** et le bouton **🎒** (kaki, avec le nombre qu'il prendra) ne prennent **que ce qu'il y a en plus**, à chaque fois. Exemple : 60 fer, on garde 40 : le wagonnet en emporte 20, et dès qu'il y en a de nouveau plus de 40, il prend le reste. « Tout mettre dans le sac » laisse aussi ce qu'on garde. Même chose pour le chariot de la foreuse (`etat.foreuse.garder`). (30/10 : le curseur disait combien prendre, et revenait à « tout ».)
- Dessous, **🎒 Tout mettre dans le sac (*n*)** (les plus chers d'abord). Il faut ensuite **marcher jusqu'au marché** pour les vendre. Sac plein : « 🎒 Ton sac est plein : va d'abord vendre au marché. » Sans trajet vers le marché : « 🛤️ Relie la mine au marché avec des rails : un wagonnet vendra le coffre tout seul. »
- Sous le coffre (30/10), un **raccourci bien visible** : « ⬆️ Agrandir le coffre, l’ascenseur, descendre la mine › », qui devient « · 💰 Achetable ! » quand on peut payer l'une de ces améliorations ; il ouvre l'onglet Améliorer.
- Dessous, **le rappel du niveau suivant** (`ProchainNiveau`) : « ⬇ Niveau *N* : *nom* », le nouveau minerai, la valeur d'un bloc en plus (« +51 % ») et les bâtiments débloqués ; « 💰 Achetable ! » et une lueur verte quand on peut le payer. Un clic ouvre l'onglet Améliorer.

### Les trajets de wagonnets (24/10)

Un bloc **🛤️ Wagonnets** (`PanneauTrajets`) montre les trajets qui partent de la mine, vers chaque bâtiment construit parmi le **marché** (💰, il vend le coffre), la **foreuse** (🔥, il lui apporte le charbon) et le **générateur** (🔴, il lui apporte la redstone). Pour chacun :

- **Sans rails** : « Relie la mine au marché avec des rails (menu Bâtiments, 3 🔩 fer la case) : un wagonnet emporte le coffre de la mine et le vend au marché. » (de même pour la foreuse et le générateur).
- **Rails posés, pas de trajet** : « Les rails sont posés ! Touche la bulle 🛤️ Automatiser sur les rails pour lancer le wagonnet » (27/10 : le bouton « Envoyer un wagonnet vers… » est retiré, le trajet se crée sur la carte).
- **Trajet créé** : où en est son wagonnet (« Au quai : rien à porter pour l’instant. », « Il part tout seul. », « Son pousseur va le pousser. », « Au quai. Pousse-le, ou embauche un pousseur pour ce trajet au Personnel. », « En route vers le marché, poussé par toi / *prénom* / l'électricité ⚡ », « Revient à la mine »), avec une barre pendant le trajet et un badge **⚡ Électrique** si tout le trajet l'est.
  - **🛤️ Pousser (*n* objets)** (bouton bois) : le hamster du joueur **fait l'aller-retour avec le wagonnet** : il le pousse jusqu'à l'arrivée, puis le ramène au quai. Pendant ce temps, on ne peut pas marcher ailleurs (le bouton ⛏️ Mine devient « Wagonnet… », les flèches et les touchers sur la carte ne font rien) et aucun panneau n'est ouvert. On ne pousse qu'un wagonnet à la fois. Grisé si le wagonnet est déjà en route ou s'il n'y a rien à porter.
  - **✖ Arrêter** (rouge) : supprime le trajet (son chargement retourne dans le coffre, les rails restent).
- Dès qu'il y a un trajet : la ligne d'amélioration **🛒 Taille des wagonnets**, qui vaut pour **tous** les wagonnets (même ceux qui partent de la foreuse). Un wagonnet déjà chargé garde son chargement : la nouvelle taille compte à son prochain départ.

### ⬇ Descendre au niveau suivant (en haut de l'onglet Améliorer)

- Une **grande carte** (bord doré, verte et lumineuse quand on peut la payer) : « ⬇ Descendre au niveau *N* », le nom du niveau en grand, puis **ce qu'on y gagne** (`gainsNiveauSuivant` dans `mine.ts`, `GainsNiveau`) : ✨ le nouveau minerai et son prix, 💰 la valeur moyenne d'un bloc (avant → après, « +51 % »), ⚙️ les blocs par minute que la mine sort toute seule, 👷 +2 mineurs, 🏗️ les bâtiments débloqués (foreuse et générateur au niveau 2), 🎲 le recruteur (niveau 3), 💼 le manager (niveau 4).
- Les chances de chaque bloc (maintenant et au niveau suivant) sont rangées dans « Les chances de chaque minerai ».
- La ligne d'amélioration et le bouton **⬇ Descendre au niveau *N*** avec son prix. Message : « ⛏️ La mine descend au niveau 3 : Filon d'or ! » Au niveau 5 : « 🏆 Mine au plus profond ».

### 📦 Taille du coffre et 🛗 Ascenseur

- **Taille du coffre** : une ligne d'amélioration (« 250 places » → « ⬆ 600 places »).
- **Ascenseur** : « La caisse de minerais de tes mineurs remonte (et redescend) plus vite. » (27/10 : les mineurs restent au fond, c'est leur sac qui remonte dans une **caisse** ; dans le puits, on voit la caisse pleine de minerais dans la cabine. Le 28/10, la caisse est refaite : planches, cerclages en fer et **coins dorés**, et un tas débordant des **mêmes minerais à facettes que dans les wagonnets** (les couleurs de ce que le mineur a vraiment creusé) ; avec de l'or, des émeraudes ou des diamants, une lueur dorée respire derrière le tas et des étincelles en sautent. La cabine, au repos, remonte aussi plus haut sur ses câbles (`CABINE_EN_HAUT` = −150 pixels de l'image, avant −100). Seul un mineur pas payé remonte au village.) La ligne « trop lent » ne s'affiche que si l'ascenseur ralentit vraiment les mineurs. Depuis le 30/10, l'ascenseur de niveau 1 est **là dès le début** : « Un trajet de mineur en *N* s » et **⬆ Trajet en *N* s**. (« Pas encore construit : à l'échelle, un trajet prend 10 s » et **🔨 Construire** ne se voyaient que dans une vieille partie, que la sauvegarde v25 convertit.)

## Les chiffres

### Les 5 niveaux de la mine (`NIVEAUX_MINE`)

Les poids de chaque niveau font 100 : ce sont donc directement les chances, en %.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Diamant | La mine sort seule | Prix pour y descendre (30/10) | Niveau du joueur |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | 0 (on creuse à la main, 27/10) | (départ) | — |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | 0,25 bloc/s (15 / min) | 900 $ + 45 fer | 4 |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | 0,3 bloc/s (18 / min) | 7 000 $ + 120 fer + 60 redstone | 7 |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | 0,35 bloc/s (21 / min) | 25 000 $ + 120 redstone + 60 or | 10 |
| 5 | Cœur de diamant | 40 | 11 | 12 | 12 | 12 | 8 | 5 | 0,4 bloc/s (24 / min) | 90 000 $ + 110 or + 40 émeraude | 13 |

Total pour aller au niveau 5 : **122 900 $ + 165 fer + 180 redstone + 170 or + 40 émeraude** (29/10 : 143 200 $ + 180 fer + 180 redstone + 190 or + 55 émeraude). Descendre d'un niveau rapporte **150 XP**.

Ce que vaut **en moyenne un bloc** au marché (sans doublement, `valeurMoyenneBloc`) : **3,04 $** au niveau 1, **4,58 $** au niveau 2, **7,50 $** au niveau 3, **13,07 $** au niveau 4, **19,79 $** au niveau 5.

Ce que **débloque** chaque niveau :

| Niveau | Ce qui se débloque |
|---|---|
| 1 | Mine, Marché, Forgeron, Bazar, Personnel, rails (avec le niveau du joueur qu'il faut) ; 4 mineurs au plus |
| 2 | **Foreuse** et **Générateur** (menu Bâtiments, aux niveaux 5 et 6 du joueur depuis le 30/10) ; la redstone ; 6 mineurs |
| 3 | **Recruteur** (au Personnel, au niveau 9 du joueur) ; l'or ; 8 mineurs |
| 4 | **Manager** et trésorerie (au Personnel, au niveau 11 du joueur) ; les émeraudes ; 10 mineurs |
| 5 | Les diamants ; 12 mineurs |

(Les tenues et les décorations qui se débloquaient aussi sont retirées depuis le 27/10.)

### Le coffre (`NIVEAUX_COFFRE`)

| Niveau | Places | Prix (30/10) | Niveau du joueur |
|---|---:|---|---:|
| 1 | 100 | (départ) | — |
| 2 | 250 | 250 $ + 50 pierre | 2 |
| 3 | 600 | 2 500 $ + 100 fer | 5 |
| 4 | 1 500 | 12 000 $ + 200 fer + 60 redstone | 8 |
| 5 | 4 000 | 50 000 $ + 120 or | 12 |

Total : 64 750 $ + 50 pierre + 300 fer + 60 redstone + 120 or (29/10 : 35 400 $ + 80 pierre + 230 fer + 40 redstone + 60 or).

### L'ascenseur (`NIVEAUX_ASCENSEUR`)

Il ne transporte que les **mineurs employés** (le joueur ne descend plus) : en fait, la caisse de leur sac. Un trajet = une montée ou une descente. Depuis le 30/10, **la mine a son ascenseur de niveau 1 dès le début** (`creerPartie` ; une vieille partie le reçoit à la conversion v25). L'**échelle** (**10 s** par trajet, `SECONDES_ECHELLE`) ne servait qu'avant.

| Niveau | Un trajet | Prix (30/10) | Niveau du joueur |
|---|---:|---|---:|
| 1 | 6 s | (dès le début ; avant : 400 $ + 20 fer, niveau 4) | — |
| 2 | 4 s | 1 500 $ + 50 fer + 10 redstone | 5 |
| 3 | 2,8 s | 7 000 $ + 120 fer + 40 redstone | 8 |
| 4 | 2 s | 25 000 $ + 200 fer + 100 redstone | 10 |
| 5 | 1,4 s | 80 000 $ + 200 redstone + 60 or | 13 |
| 6 | 1 s | 250 000 $ + 150 or + 30 émeraude | 15 |

Total : 363 500 $ + 370 fer + 350 redstone + 210 or + 30 émeraude (29/10, niveau 1 compris : 161 900 $ + 330 fer + 300 redstone + 140 or + 20 émeraude).

### La taille des wagonnets (`NIVEAUX_WAGONNET`)

| Niveau | Places | Prix (29/10) | Niveau du joueur |
|---|---:|---|---:|
| 1 | 40 | (départ) | — |
| 2 | 100 | 1 200 $ + 60 fer | 6 |
| 3 | 250 | 6 000 $ + 150 fer + 40 redstone | 9 |
| 4 | 600 | 25 000 $ + 80 or | 12 |

Total : 32 200 $ + 210 fer + 40 redstone + 80 or.

Vitesses (`VITESSE_POUSSE_JOUEUR`, `VITESSE_POUSSE_MINEUR`, `VITESSE_RAILS`) : **3 cases/s** poussé par toi, **2,5 cases/s** par un pousseur, **8 cases/s × la puissance du générateur** avec l'électricité (8 à 24 cases/s). Charger au départ et vider à l'arrivée prennent **2 s** chacun (`SECONDES_CHARGEMENT_WAGONNET`).

## Règles et comportement

### Le coffre

- **Tout ce qui sort de la mine y va** : tes clics, les blocs que la mine sort toute seule, et les sacs des mineurs employés (la foreuse a son propre chariot). Il ne contient que des blocs.
- **Coffre plein = tout s'arrête** : le bloc ne se clique plus, la mine ne sort plus rien, et les mineurs qui remontent **attendent** devant le coffre, leur sac plein (« 📦 attend : le coffre de la mine est plein ! »), en continuant d'être payés. Le « $/s » du bandeau tombe à 0 (ou en dessous, à cause des salaires).
- **On paie aussi avec le coffre** : partout dans le jeu, les minerais d'un achat se prennent **d'abord dans le sac**, **puis dans le coffre** (`disponible`, `payer`). Pas besoin de porter le fer jusqu'au forgeron.
- Il ne se vide que de trois façons : 🎒 Mettre dans le sac, les wagonnets (vers le marché, la foreuse, le générateur), et le générateur qui se sert en redstone (à partir de son niveau 2).

### La mine toute seule

- Elle sort **0,2 à 0,4 bloc par seconde** selon le niveau (le « vieux treuil », `debit`), tant que le coffre a de la place, même jeu fermé (8 h au plus). Ces blocs ne sont **jamais doublés** et n'usent pas la pioche.
- Le bloc à cliquer, lui, n'est pas cassé par la mine : il attend ton clic.

### Les wagonnets

- Au début, **il n'y a aucun trajet**. Il faut une **ligne de rails continue** (cases voisines par un côté) entre une case collée au bâtiment de départ et une case collée à celui d'arrivée (`ligneDe`, `railsEntre`), puis créer le trajet : depuis le 30/10, la fenêtre du trajet (activer, objets à envoyer) **s'ouvre toute seule** dès que les rails relient les deux bâtiments ; sinon, la bulle « 🛤️ Automatiser » au milieu des rails la rouvre. Les rails : **3 fer la case**, à partir du **niveau 3 du joueur** (29/10, menu 🏗️ Bâtiments), et **jamais en boucle** : entre deux bâtiments, une seule route. Voir [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets).
- **4 trajets**, un wagonnet chacun (`LIAISONS`) : Mine → Marché, Mine → Foreuse, Mine → Générateur (ils partent d'ici), et Foreuse → Marché (il part de la foreuse, voir [foreuse.md](foreuse.md)). Plusieurs wagonnets peuvent partager les mêmes rails : ils se croisent sans se gêner.
- **La longueur d'un trajet** = le nombre de cases de sa ligne **+ 1**. Un aller-retour dure `2 × longueur ÷ vitesse + 4 s` (chargement et vidage).
- **Ce qu'il emporte au départ**, jusqu'à sa capacité :
  - **vers le marché** : le coffre, **les objets les plus chers d'abord**, **sauf les objets gardés** (`nonAVendre`) et sauf le charbon et la redstone qui manquent à la foreuse et au générateur (si leurs trajets existent). Au marché, il vend tout (« 🛤️ Le wagonnet a tout vendu au marché : +*X* $ » quand c'est toi qui pousses) ;
  - **vers la foreuse** : dès que son réservoir n'est plus plein, tout le charbon du coffre ; le réservoir se remplit (40 à 250 charbons selon son niveau de forage) et le surplus va dans son chariot (28/10) ;
  - **vers le générateur** : la redstone du coffre, jusqu'à lui faire **60 redstones** de réserve (`RESERVE_GENERATEUR_WAGONNET` = 1 800 s).
  - Puis il revient au quai. S'il n'a rien à porter, il reste au quai.
- **Qui le fait avancer** (il ne part jamais tout seul sans eux) :
  - **toi**, avec « Pousser » (un wagonnet à la fois) ;
  - **son pousseur** (26/10) : un employé embauché au Personnel **pour ce trajet-là**. Il attend au quai, à côté du début des rails, devant le bâtiment de départ, et pousse le wagonnet dès qu'il a quelque chose à porter. Le pousseur d'un autre trajet ne le pousse jamais. Voir [personnel.md](personnel.md#4-les-pousseurs) ;
  - **l'électricité** : si **toutes les cases de ce trajet** sont dans le rayon du générateur allumé (`trajetElectrique`), son pousseur le lance du quai dès qu'il a quelque chose à porter, et il roule tout seul, bien plus vite (27/10 : sans pousseur payé, rien ne part). Voir [generateur.md](generateur.md). S'il perd le courant en route, il finit son trajet doucement (1,25 case/s).
- **Toucher un rail** (30/10) : en bas de la fenêtre de ses trajets, « ✏️ Déplacer ce rail » et « 🗑️ Retirer (+3 🔩 fer) » (le fer revient dans le sac, ou dans le coffre de la mine). Voir [../jeu/village.md](../jeu/village.md).
- **Ligne coupée** (un rail enlevé, un bâtiment déplacé) : le wagonnet revient aussitôt au quai, son chargement retourne d'où il vient, et le pousseur retourne au quai. Le trajet reste : il repartira quand les rails seront refaits. En attendant, une bulle **🚧 Rails coupés** est sur ses deux bâtiments.
- **Au village**, chaque wagonnet (en 3D depuis le 26/10 : caisse en planches, cadre d'acier, quatre roues en fer) roule sur sa ligne. On voit **ce qu'il porte vraiment** : des minerais à facettes de la couleur de chaque bloc, plus ou moins haut selon son chargement (vide, à moitié plein, plein avec un petit tas qui dépasse). Voir [../jeu/visuel-et-sons.md](../jeu/visuel-et-sons.md).
- Ils roulent aussi jeu fermé (avec un pousseur ou l'électricité).

### L'ascenseur et l'échelle

- Il ne sert qu'aux **mineurs employés**. Depuis le 23/10, **sa caisse fait des allers-retours sans cesse** tant qu'un mineur travaille au fond, pleine ou pas : elle descend, se charge **1 s** au fond (`SECONDES_CHARGEMENT_ASCENSEUR`) en prenant les sacs des mineurs, remonte, se vide dans le coffre en **2 s**, et repart. Les mineurs restent au fond (ils ne remontent que s'ils ne sont plus payés). Coffre plein : elle attend en haut, pleine.
- **Ce qu'il remonte au plus** (`debitAscenseur`) = capacité de la caisse ÷ (2 × trajet + 1 + 2) :

| Niveau | Trajet | Caisse | Remonte au plus | Prix |
|---|---:|---:|---:|---|
| 1 (au départ) | 6 s | 15 blocs | 1 bloc/s | — |
| 2 | 4 s | 25 | 2,3 bloc/s | 1 500 $ + 50 fer + 10 redstone |
| 3 | 2,8 s | 40 | 4,7 bloc/s | 7 000 $ + 120 fer + 40 redstone |
| 4 | 2 s | 60 | 8,6 bloc/s | 25 000 $ + 200 fer + 100 redstone |
| 5 | 1,4 s | 90 | 15,5 bloc/s | 80 000 $ + 200 redstone + 60 or |
| 6 | 1 s | 130 | 26 bloc/s | 250 000 $ + 150 or + 30 émeraude |

- Si les mineurs creusent plus que ça, leurs sacs se remplissent au fond et ils attendent la caisse : le panneau de la mine affiche « ⚠️ Ascenseur trop petit : tes mineurs creusent *x* bloc/s, la caisse en remonte *y* » (seulement si le niveau suivant rapporte au moins 10 %). Voir [personnel.md](personnel.md).
- L'ascenseur n'est proposé dans les missions qu'une fois qu'on a au moins un mineur. Son niveau 2 demande le niveau 5 du joueur (30/10 ; avant, sa ligne affiche « 🔒 … · au niveau 5 »).

### Descendre d'un niveau

- On paie le prix (argent + minerais du sac puis du coffre) et la mine passe au niveau suivant tout de suite : le bloc à cliquer est tiré au nouveau niveau, et les mineurs, la mine et la foreuse sortent les nouveaux minerais. Le coffre garde ce qu'il contenait.
- Il n'y a **pas de fin** ni de prestige après le niveau 5 (l'ancien prestige est archivé dans `archives/prestige/`) : au niveau 5, on continue d'agrandir, d'embaucher et d'automatiser.

## Lien avec le reste du jeu

- **Marché** : on y porte le coffre (à pied, dans le sac) ou le wagonnet Mine → Marché y va sur les rails. **Forgeron** : la pioche décide de la chance de doubler en cliquant. **Bazar** : un plus grand sac pour porter plus du coffre au marché. **Personnel** : les mineurs remplissent le coffre, et les pousseurs (un par trajet) poussent les wagonnets. **Foreuse** et **Générateur** : débloqués au niveau 2 ; la mine peut leur envoyer leur charbon et leur redstone par wagonnet.
- **Missions** (`missions.ts`, `objectifs.ts`) : « Casse 10 blocs à la mine » au début, l'urgence « Le coffre est plein : vide-le ! », les améliorations du stand `puits` (« Mine niveau *N* : *nom* », « Coffre de *N* places », « Construire l'ascenseur » / « Ascenseur niveau *N* », « Wagonnets de *N* places ») ; et les étapes de l'automatisation (à partir du niveau 3 du joueur) : « Pose des rails de la mine au marché (3 fer la case) » (29/10 : plus de « Récupère *N* fer pour les rails », le nombre dépendait du chemin choisi), « Envoie un wagonnet vers le marché (à la mine) », et plus tard « Envoie du charbon à la foreuse (à la mine) ».
- **Succès** : Premier coup de pioche, Terrassier (100 blocs), Tunnelier (1 000 blocs), Veine de redstone, Chercheur d'or, Grotte aux émeraudes, Cœur de diamant (niveaux 2 à 5), Ça brille ! (un diamant), Cheminot (un trajet de wagonnet), Réseau complet (les 4 trajets), Ligne régulière (100 voyages de wagonnet).
- **Classement** : le niveau de la mine (le meilleur de tes mondes) est envoyé dans la colonne « prestige » du serveur. Voir [../jeu/sauvegarde-et-en-ligne.md](../jeu/sauvegarde-et-en-ligne.md).
- **Statistiques** : blocs cassés en cliquant (par sorte), blocs sortis tout seuls de la mine, voyages et argent des wagonnets.

## Fichiers du code

- `src/jeu/donnees.ts` : `BATIMENTS.puits`, `BLOCS`, `NIVEAUX_MINE`, `NIVEAUX_COFFRE`, `NIVEAUX_ASCENSEUR`, `SECONDES_ECHELLE`, `BONUS_COMBO` (30/10), `NIVEAUX_WAGONNET`, `COUT_RAIL`, les trajets (`LIAISONS`, `RESERVE_FOREUSE_WAGONNET`, `RESERVE_GENERATEUR_WAGONNET`), les vitesses des wagonnets et `SECONDES_CHARGEMENT_WAGONNET`.
- `src/jeu/mine.ts` : tirer un bloc selon le niveau (`tirerBloc`), les chances (`chancesDesBlocs`), la valeur moyenne d'un bloc (`valeurMoyenneBloc`).
- `src/jeu/mineur.ts` : le coffre (`capaciteCoffre`, `rangerDansCoffre`, `prendreDuCoffre`, `agrandirCoffre`), payer avec le sac puis le coffre (`disponible`, `payer`), le clic (`cliquerMine`), les bonus de combo (`activerBonusCombo`, `bonusActif`, `secondesBonus`, 30/10), la mine toute seule (`avancerMine`, `debitMine`), les niveaux (`descendreNiveauMine`) et l'ascenseur (`ameliorerAscenseur`, `secondesTrajetMineur`).
- `src/jeu/wagonnet.ts` : les trajets (`ligneDe`, `creerTrajet`, `supprimerTrajet`), le chargement, la vitesse (`trajetElectrique`), pousser (`pousserTrajet`), agrandir (`ameliorerWagonnet`), le temps qui passe (`avancerWagonnets`).
- `src/jeu/village.ts` : la mine posée au milieu (`POSITION_MINE`, `nouveauVillage`), sa porte, les rails entre deux bâtiments (`railsEntre`), sans boucle (`feraitUneBoucle`).
- `src/jeu/batiments.ts` : déplacer ou retourner la mine, poser les rails.
- `src/jeu/notifications.ts`, `src/jeu/objectifs.ts`, `src/jeu/missions.ts` : les bulles 📦, 🚧 et 💰, les achats du stand `puits`, les missions.
- `src/jeu/production.ts` : la production pour le tableau de bord (`production` : mine, chaque mineur, total, dollars par minute), testée dans `production.test.ts`.
- `src/composants/PanneauMine.tsx` : le panneau (titre du niveau, bloc à cliquer, combo et bonus de combo, tableau de production, coffre, raccourci, trajets, onglet Améliorer : niveau, coffre, ascenseur) ; `src/composants/StockMinerais.tsx` : les lignes du coffre (curseur « Garder », 23/10) ; `src/composants/PanneauTrajets.tsx` : le bloc des trajets ; `src/composants/Ascenseur.tsx` : la ligne de l'ascenseur.
- `src/usePartie.ts` : le clic (`cliquer` : le son du coup, puis `cliquerMine`), les éclats et les minerais qui s'envolent.
- `src/composants/DessinsVillage.tsx` : la cabine qui monte et descend et le panneau du niveau (`DessinEvolutionMine`) ; `src/composants/VueVillage.tsx` : la hauteur de la cabine (`hauteurCabine`), la jauge du coffre au-dessus de la mine (`nombreAbrege` de `src/nombres.ts`), les wagonnets et leurs pousseurs sur les rails (`WagonnetVillage.tsx`, dessin en 3D dans `Wagonnet3D.tsx`).
- `src/village.css` : le bloc à cliquer (`.bloc-mine`, `.eclats-bloc-mine`, `.trouvaille-bloc-mine`), le combo (`.combo-mine`, `.halo-bloc-mine`) et ses bonus (`.bonus-combo`, `.zone-bonus`, 30/10), la jauge de la pioche (`.jauge-pioche`, `.pioche-usee`), le tableau de production (`.tableau-production`, `.rendement-mineur`), la jauge du coffre (`.jauge-coffre-mine`) ; `src/sons.ts` : `combo` ; `src/blocs.css` : le dessin des blocs.
- `public/images/batiments/mine.webp`, `mine-devant.webp`, `caisse-ascenseur-0.webp` à `-4.webp` : le dessin de la mine, son devant et la caisse de l’ascenseur (vide, puis pleine selon le niveau de la mine).

(23/10) La caisse de l'ascenseur **attend vide en haut** quand elle n'a rien à porter ; un mineur qui arrive du village y descend debout (on voit le haut de son corps). Bulle « Payer ! » au-dessus de la mine et bandeau dans son panneau quand des mineurs attendent leur salaire.

