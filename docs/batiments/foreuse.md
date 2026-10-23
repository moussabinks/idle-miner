# ⚙️ Foreuse

> Une machine débloquée au **niveau 2 de la mine** et, depuis le 30/10, au **niveau 5 du joueur** (niveau 6 le 29/10) : on pose son bâtiment, on la nourrit au charbon, et elle fore toute seule en remplissant son propre chariot, qu'on vient vider devant elle (ou qu'un wagonnet emporte au marché). Dans le rayon du générateur, elle fore plus vite.

## Où et quand

- **Où** : là où tu la poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **3 000 $ + 120 pierre + 60 fer** (29/10 ; avant 800 $ + 60 pierre + 30 fer ; les minerais se prennent dans le sac, puis dans le coffre de la mine). Une fois posée, elle est prête : il n'y a plus d'activation à payer. **✏️ Modifier** la déplace ou la retourne (miroir) gratuitement.
- **Déblocage** : au **niveau 2 de la mine** (`BATIMENTS.foreuse.niveauMine = 2`) **et** au **niveau 5 du joueur** (30/10, `NIVEAU_JOUEUR_POUR.batiments.foreuse` ; le 29/10, niveau 6 et dernier bâtiment du menu : depuis le 30/10, elle vient **avant le générateur**). Avant, sa carte du menu Bâtiments a un **cadenas** « 🔒 Niveau 5 » (ou « 🔒 Mine niveau 2 » si c'est la mine qui manque). Ses améliorations demandent aussi un niveau du joueur (tableaux ci-dessous, et [../jeu/niveaux.md](../jeu/niveaux.md)). Au déblocage, la carte prend la pastille **« Nouveau ! »** (jusqu'à ce qu'on ouvre le menu) et le bouton 🏗️ Bâtiments la compte dans son badge.
- **La porte** : sur la face avant **gauche** du dessin (à droite si elle est retournée).
- **L'ouvrir** : toucher (ou cliquer) la foreuse : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case du bâtiment, de n'importe quel côté.
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/foreuse.webp`) : une grande foreuse jaune et noire en spirale sur un bâti en bois, avec des wagonnets d'or. Depuis le 29/10, l'image ne vibre plus quand elle tourne (l'ancienne classe `sprite-vibre` rendait l'image floue) : elle reste toujours la même.
- **Description** (en haut du panneau) : « Elle creuse toute seule avec du charbon, et plus vite avec de l'électricité. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **🛒 « Le chariot est plein : viens le vider ! »** (alerte rouge) ;
  - sinon **🔥 « Plus de charbon ! »** (alerte rouge) ;
  - **🚧 « Rails coupés »** (alerte rouge, 26/10) quand un trajet de wagonnet qui part d'ici ou y arrive n'a plus de rails complets (un rail enlevé, un bâtiment déplacé) : « Rails coupés entre … : le wagonnet attend. Repose les rails ! ». La bulle est sur les deux bâtiments du trajet ;
  - **💰 « Une amélioration est achetable ! »** quand un niveau de forage ou de chariot est payable tout de suite (depuis le 30/10, seulement pendant le tutoriel).

## Ce qu'on peut y faire

### 1. La remplir de charbon (État)

- Un badge donne l'état : **En marche**, **Chariot plein** ou **Plus de charbon**. On voit aussi sa vitesse (« 0,8 bloc(s) par seconde », avec « (⚡ boostée par le générateur) » si elle l'est) et le nombre de blocs forés.
- **Le réservoir** (28/10) : la foreuse garde au plus un certain nombre de charbons, plus grand à chaque niveau de forage (`NIVEAUX_FORAGE[...].reservoir` : 15, 21, 27, 36, 45, 54, soit **5, 7, 9, 12, 15 et 18 minutes** ; 23/10, avant : 40 à 250, de 13 min à 1 h 23 : sans pousseur, c'était trop fort). Une jauge dorée le montre : « Charbon : 12 / 15 (240 s) ». La ligne d'amélioration affiche aussi la durée (« réservoir 15 charbons (5 min) »).
- « 1 charbon = 20 s · tu en as *N* (sac + coffre) » (« · réservoir plein » s'il l'est) et les boutons **+1**, **+10** et **Tout** (anthracite) : on met du charbon **du sac, puis du coffre de la mine**, sans dépasser le réservoir (les boutons se grisent quand il n'y a plus de place). « 🔥 +*N* charbon dans la foreuse. » ou « 🔥 Le réservoir de la foreuse est plein. »
- Si elle n'est pas boostée : « ⚡ Dans le rayon du générateur allumé, elle fore plus vite. »

### 2. Plus de recharge automatique (23/10)

- L'amélioration qui faisait brûler à la foreuse le charbon qu'elle fore est **retirée** : son charbon arrive **par les rails** (le wagonnet Mine → Foreuse), ou à la main avec les boutons. Le panneau le rappelle : « 🛤️ Pour qu'elle ne s'arrête jamais : relie-la à la mine par des rails et envoie-lui le charbon en wagonnet. »

### 3. Vider le chariot

- **On ne vend plus le chariot sur place** (27/10) : on le met dans son sac et on va le vendre au marché, ou un wagonnet **Foreuse → Marché** l'emporte (rails, puis bulle 🛤️ Automatiser, et un pousseur au Personnel).
- La **même interface que le coffre de la mine** (`StockMinerais.tsx`) : « 🛒 Chariot » et sa barre sur une ligne, puis une ligne par minerai que sort la mine à son niveau (même à 0), avec sa quantité, **🚃 Vendre / Garder** pour le wagonnet du marché (s'il y a ce trajet) et **🎒** pour le mettre dans son sac ; puis **🎒 Tout mettre dans le sac** (`prendreDuChariot`, les plus chers d'abord, tant qu'il y a de la place).

### 4. Améliorer la vitesse de forage (6 niveaux, `NIVEAUX_FORAGE`)

| Niveau | Vitesse (blocs/s, sans électricité) | Réservoir (charbons, 23/10) | Coût (29/10) | Niveau du joueur (30/10) |
|---|---:|---:|---|---:|
| 1 | 0,5 | 15 (5 min) | (de base) | — |
| 2 | 0,8 | 21 (7 min) | 3 500 $ + 50 fer + 20 redstone | 6 (avant 7) |
| 3 | 1,2 | 27 (9 min) | 10 000 $ + 100 fer + 50 redstone | 9 |
| 4 | 1,8 | 36 (12 min) | 25 000 $ + 160 fer + 100 redstone | 11 |
| 5 | 2,6 | 45 (15 min) | 60 000 $ + 160 redstone + 50 or | 14 |
| 6 | 3,6 | 54 (18 min) | 150 000 $ + 100 or + 25 émeraude | 15 |

Tout le forage : 248 500 $ + 310 fer + 330 redstone + 150 or + 25 émeraude (avant le 29/10 : 100 500 $ + 190 fer + 200 redstone + 90 or + 15 émeraude). Sans le niveau du joueur, la ligne affiche « 🔒 … · au niveau *N* ». Le panneau affiche « 0,5 bloc/s sans électricité · réservoir 40 charbons » et « ⬆ 0,8 bloc/s · 60 charbons ». Message : « ⚙️ Foreuse plus rapide : *N* blocs par seconde, *R* charbons de réservoir. »

### 5. Agrandir le chariot (6 niveaux, `NIVEAUX_CHARIOT`)

| Niveau | Capacité | Coût (29/10) | Niveau du joueur (30/10) | Plein en (forage du même niveau, sans électricité) |
|---|---:|---|---:|---|
| 1 | 100 | (de base) | — | ~3 min 20 (200 s) |
| 2 | 160 | 2 500 $ + 40 fer | 6 (avant 7) | ~3 min 20 |
| 3 | 240 | 7 500 $ + 80 fer + 25 redstone | 9 | ~3 min 20 |
| 4 | 360 | 20 000 $ + 150 fer + 70 redstone | 11 | ~3 min 20 |
| 5 | 520 | 50 000 $ + 130 redstone + 40 or | 14 | ~3 min 20 |
| 6 | 720 | 120 000 $ + 90 or + 20 émeraude | 15 | ~3 min 20 |

(23/10) Le chariot est **petit** : à forage et chariot du même niveau, il est plein en 3 min 20 (avant : 200 à 6 000 places, de 7 à 28 min, il n'était jamais plein). Il faut donc le vider souvent (wagonnet Foreuse → Marché) et l'agrandir quand on améliore le forage, sinon il bloque la foreuse.

Tout le chariot : 200 000 $ + 270 fer + 225 redstone + 130 or + 20 émeraude (avant le 29/10 : 82 000 $ + 160 fer + 135 redstone + 70 or + 10 émeraude). Le panneau affiche le temps pour remplir le chariot, au niveau actuel et au suivant (« 100 places · plein en 3 min »). Message : « 🛒 Chariot de la foreuse plus grand : *N* places. »

### 6. Les wagonnets (24/10)

Deux trajets de wagonnets touchent la foreuse (voir [mine.md](mine.md#les-wagonnets) et [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets)) :

- **Mine → Foreuse** (créé au panneau de la mine) : dès que le réservoir n'est plus plein, le wagonnet emporte **tout le charbon du coffre de la mine** (28/10). À l'arrivée, il remplit le réservoir, et **le surplus va dans le chariot** de la foreuse (tant qu'il y a de la place ; le reste revient au coffre). Avec un trajet **Foreuse → Marché**, ce surplus part donc tout seul au marché. Le wagonnet du marché laisse dans le coffre le charbon qui manque au réservoir. (23/10 : le wagonnet du marché ne lui garde ce charbon que si ce trajet a un pousseur embauché ; sans pousseur, le charbon part au marché.)
- **Foreuse → Marché** (créé ici, en bas du panneau, bloc « 🛤️ Wagonnets ») : le wagonnet emporte **ce qui est coché dans le chariot** et le vend au marché. Cet argent compte dans `argentWagonnet` (la part « 🛤️ Wagonnet » des statistiques), pas dans `argentForeuse`.

Sans rails, le bloc explique quoi relier ; rails posés, touche la bulle **« 🛤️ Automatiser »** sur les rails (fenêtre du trajet) ; ensuite **🛤️ Pousser** et **✖ Arrêter**. Pour ne plus le pousser soi-même : un **pousseur** embauché au Personnel pour le trajet Foreuse → Marché attend au quai, devant la foreuse (voir [personnel.md](personnel.md#4-les-pousseurs)), ou l'électricité du générateur.

## Règles et comportement

- **Quand elle tourne** : seulement si elle est **posée**, qu'il lui reste **du charbon**, et que **le chariot n'est pas plein** (`foreuseEnMarche`). Elle ne brûle pas de charbon pour rien : chariot plein, elle s'arrête (« 🛒 Le chariot de la foreuse est plein : viens le vider. ») ; plus de charbon : « 🔥 La foreuse n'a plus de charbon. »
- **Le charbon** : **1 charbon = 20 secondes** (`SECONDES_PAR_CHARBON`), quelle que soit la vitesse : **3 charbons par minute**, 180 par heure. Plus elle fore vite, plus chaque charbon rapporte.
- **Ce qu'elle remonte** : un bloc tiré au hasard selon le **niveau de la mine**, avec les mêmes chances que la mine (`tirerBloc`). Elle ne double jamais (la chance de doubler n'est que pour les clics du joueur). Ses blocs vont dans **son chariot**, pas dans le coffre de la mine.
- **L'électricité** : dans le rayon du générateur allumé (le centre de la foreuse dans le cercle, `foreuseAlimentee`), elle fore **+ 30 % à + 75 %** plus vite selon le niveau du générateur (23/10, `multiplicateurGenerateur` ; avant, × 1,5 à × 2,5).
- **Il n'y a qu'une seule foreuse**.
- **Hors ligne** : quand on rouvre un monde, le jeu rattrape le temps passé, **au plus 8 heures**. La foreuse continue donc de forer (tant qu'elle a du charbon et de la place), et la recharge automatique continue aussi. Un message dit « ⚙️ la foreuse a remonté *N* blocs ».

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : d'abord « Construis : Foreuse » (menu Bâtiments) dès le niveau 2 de la mine et le niveau 5 du joueur (30/10) ; une fois posée, « Forage *X* blocs/s » et « Chariot de la foreuse : *X* places » (23/10 : on précise de quel chariot il s'agit) apparaissent dans les achats possibles (bulle 💰, missions d'amélioration). Côté automatisation : « Relie la foreuse à la mine (rails) », puis « Envoie du charbon à la foreuse (à la mine) ».
- **Autres bâtiments** : elle se paie surtout en **fer et redstone**, puis en or et émeraudes ; le **charbon** vient du coffre de la mine (18 % des blocs au niveau 1), à la main ou par le wagonnet Mine → Foreuse ; on revend ce qu'elle remonte directement depuis son panneau, sans passer par le Marché, ou avec le wagonnet Foreuse → Marché. Le **générateur** la booste.
- **Revenus et statistiques** : l'indicateur « $/s » compte la foreuse quand elle tourne (vitesse × valeur moyenne d'un bloc au niveau de la mine, `revenu.ts`) ; les statistiques comptent `argentForeuse` (chariots vendus, la part « ⚙️ Foreuse » de l'écran 📊) et `blocsForeuse`.
- **Bot de simulation** (`bot.ts`) : il la pose dès qu'il peut, remet 10 charbons quand il lui reste moins d'une minute, vend le chariot quand il est à moitié plein, et améliore le forage et le chariot quand il a plus de 3 000 $.

## Fichiers du code

- `src/jeu/foreuse.ts` : toutes les règles (charbon, forage seconde après seconde, chariot, améliorations, vitesse électrique).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.foreuse` : 3 000 $ + 120 pierre + 60 fer, 5 × 5, porte à gauche, niveau 2 de la mine) et les chiffres (`SECONDES_PAR_CHARBON`, `NIVEAU_RECHARGE_AUTO`, `RESERVE_RECHARGE_AUTO`, `BONUS_ELECTRIQUE_FOREUSE`, `NIVEAUX_FORAGE`, `NIVEAUX_CHARIOT`).
- `src/jeu/generateur.ts` : `foreuseAlimentee`, `multiplicateurGenerateur`.
- `src/jeu/wagonnet.ts` : les trajets Mine → Foreuse (le charbon) et Foreuse → Marché (le chariot).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment (`batimentDebloque`, `construireBatiment`, `deplacerBatiment`).
- `src/jeu/mineur.ts` : le type `Foreuse` et `nouvelleForeuse()`.
- `src/jeu/temps.ts` : fait avancer la foreuse avec le reste du jeu (`avancerTemps`).
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) et le message « Pendant ton absence ».
- `src/jeu/notifications.ts` : les bulles 🛒, 🔥, 🚧 et 💰 au-dessus de la foreuse.
- `src/jeu/missions.ts`, `src/jeu/objectifs.ts` : « Construis : Foreuse », achats, missions.
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'elle rapporte ($/s et statistiques).
- `src/jeu/foreuse.test.ts` : les tests.
- `src/composants/Panneaux.tsx` : le panneau du bâtiment (`PanneauForeuse`) ; `src/composants/PanneauTrajets.tsx` : son bloc « 🛤️ Wagonnets ».
- `src/composants/MenuConstruction.tsx` : la carte de la foreuse dans le menu Bâtiments (cadenas, « Nouveau ! »).
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille, la vibration et les bulles.
- `public/images/batiments/foreuse.webp` : le dessin de la foreuse.
- `src/index.css` : la couleur du bouton charbon (la vibration du bâtiment, `.sprite-vibre` dans `src/village.css`, est retirée le 29/10).
