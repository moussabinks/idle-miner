# ⚙️ Foreuse

> Une machine débloquée au **niveau 2 de la mine** : on pose son bâtiment, on la nourrit au charbon, et elle fore toute seule en remplissant son propre **chariot**, qu'on **vend sur place d'un clic** (25/10) ou qu'un wagonnet emporte au marché. Dans le rayon du générateur, elle fore plus vite.
> Écrit d'après le code au 25/10 (la grande mise à jour : vente du chariot sur place, 5 niveaux de forage et de chariot qui suivent les paliers de la mine, nouveaux prix). Le panneau a été refait le 25/10 dans le nouveau style.

## Où et quand

- **Où** : là où tu la poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **2 500 $ + 100 pierre + 50 fer** (25/10 ; avant 3 000 $ + 120 pierre + 60 fer ; les minerais se prennent dans le coffre de la mine). **✏️ Modifier** la déplace ou la retourne (miroir) gratuitement.
- **Déblocage** : au **niveau 2 de la mine** (`BATIMENTS.foreuse.niveauMine = 2`). Depuis le 25/10, plus de niveau du joueur à part pour les bâtiments (avant : niveau 5). Avant, sa carte du menu Bâtiments a un cadenas « 🔒 Mine niveau 2 ». Ses améliorations suivent les **paliers** de la mine (« 🕳️ Mine *N* »).
- **La porte** : sur la face avant **gauche** du dessin (à droite si elle est retournée).
- **Le dessin au village** (25/10, SVG plat au contour d'encre, `public/images/batiments/foreuse.svg`, dessiné par `foreuse()` dans `outils/art/batiments.mjs`) : redessiné le 25/10 pour qu'on la reconnaisse tout de suite : sur une dalle de 5 × 5 pavés et une plateforme en acier à bandes de chantier, une **mèche en acier en forme de carotte** (longue, de plus en plus fine jusqu'à sa pointe, des rainures en spirale, un reflet clair ; la pointe entre dans un trou entouré de terre retournée) tenue par un **portique jaune** (deux pieds à bandes jaunes et noires, des croisillons, une poutre) ; dessus, posés sur la poutre, une **grande roue dentée** en acier qui fait tourner l'axe de la mèche et un **petit moteur rond** en acier (cerclé, boulonné, un voyant rouge) avec son pot d'échappement qui fume (25/10 : plus de caisse orange ni de trémie sur le toit). Juste à côté de la mèche, un **petit coffre** en bois cerclé de fer, ouvert et plein de charbon. Des cailloux volent autour de la pointe ; quelques morceaux de charbon devant, un bidon au fond.
- **L'ouvrir** : toucher (ou cliquer) la foreuse : la taupe du joueur y marche, puis le panneau s'ouvre.
- **Description** : « Elle creuse toute seule avec du charbon, et plus vite avec de l'électricité. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **🛒 « Le chariot est plein : viens le vider ! »** (alerte rouge) ;
  - sinon **🔥 « Plus de charbon ! »** (alerte rouge) ;
  - **🚧 « Rails coupés »** (alerte rouge) quand un trajet qui part d'ici ou y arrive n'a plus de rails complets ;
  - **⬆️ « Achetable »** quand un niveau de forage ou de chariot est payable tout de suite (seulement pendant le tutoriel).

## Ce qu'on peut y faire

En haut du panneau, une carte d'état : sa vitesse (« 1 blocs/s »), **En marche** (⚡ si elle est boostée par le générateur), **Chariot plein** ou **Plus de charbon**, et le nombre de blocs forés. Puis **quatre onglets** :

### 1. 🔥 Charbon

- **Le réservoir** : la foreuse garde au plus un certain nombre de charbons, plus grand à chaque niveau de forage (`NIVEAUX_FORAGE[...].reservoir` : **15, 22, 30, 40, 50**, soit **5 min, 7 min 20, 10 min, 13 min 20 et 16 min 40**). Une jauge le montre.
- **🔥 Remplir · *N* ⚫** : met du charbon **du coffre de la mine** jusqu'à remplir le réservoir (`remplirForeuse`). « Réservoir plein. », « Plus de charbon dans le coffre de la mine. » ou « Le charbon est pris dans le coffre de la mine. ». Message : « 🔥 +*N* charbon dans la foreuse. »
- Quand le chariot est plein, un bouton **🛒 Chariot plein : le vendre** mène à l'onglet Chariot.
- Pour qu'elle ne s'arrête jamais : relier la foreuse à la mine par des rails, et y mettre un pousseur (le wagonnet Mine → Foreuse lui apporte le charbon).

### 2. 🛒 Chariot : le vendre sur place (25/10)

- **Le chariot se vend sur place, d'un clic, au prix du marché** (`vendreChariot`) : plus besoin de le mettre dans un sac et de marcher jusqu'au marché (le sac n'existe plus). Pendant le bonus « 💰 Ventes × 2 », la vente rapporte le double.
- La **même interface que le coffre de la mine** (`StockMinerais.tsx`) : « 🛒 Chariot » et sa jauge, le gros bouton **💰 Tout vendre · +X $**, et une ligne par minerai (sa quantité, son prix, **Vendre**). Pas de punaise : rien ne se garde dans le chariot.
- Message : « 💰 Chariot de la foreuse vendu : +X $ ». Cet argent compte dans `argentForeuse` (la part « ⚙️ Foreuse » de l'écran 📊) et dans l'argent gagné.
- Le wagonnet **Foreuse → Marché** le vend aussi tout seul (onglet Wagonnets) : cet argent-là compte dans `argentWagonnet`.

### 3. ⬆️ Améliorer : le forage et le chariot (5 niveaux chacun, 25/10)

| Niveau | Forage (bloc/s, sans électricité) | Réservoir | Prix du forage | Chariot | Prix du chariot | Plein en | Palier |
|---|---:|---:|---|---:|---|---:|---:|
| 1 | 0,5 | 15 charbons (5 min) | (de base) | 25 | (de base) | 50 s | 2 |
| 2 | 1 | 22 (7 min 20) | 3 000 $ + 50 fer + 20 redstone | 50 | 4 000 $ + 60 fer | 50 s | 2 |
| 3 | 1,6 | 30 (10 min) | 6 000 $ + 100 fer + 60 redstone | 90 | 7 000 $ + 120 fer + 40 redstone | 56 s | 3 |
| 4 | 2,4 | 40 (13 min 20) | 14 000 $ + 150 redstone + 40 or | 140 | 14 000 $ + 150 redstone + 50 or | 58 s | 4 |
| 5 | 3,4 | 50 (16 min 40) | 30 000 $ + 80 or + 20 émeraude | 200 | 30 000 $ + 100 or + 25 émeraude | 59 s | 5 |

(« Plein en » : le chariot du même niveau que le forage, sans électricité, `secondesPourRemplir`.) Tout le forage : 53 000 $ + 150 fer + 230 redstone + 120 or + 20 émeraude. Tout le chariot : 55 000 $ + 180 fer + 190 redstone + 150 or + 25 émeraude. (Avant le 25/10 : 6 niveaux de chacun, débloqués par le niveau du joueur.)

Le chariot est **petit exprès** : il est plein en moins d'une minute. Il faut donc le vider souvent (sur place, ou avec le wagonnet Foreuse → Marché) et l'agrandir quand on améliore le forage, sinon il bloque la foreuse. Chaque ligne a aussi son bouton violet **💎** pour payer en gemmes. Messages : « ⚙️ Foreuse plus rapide : *N* blocs par seconde, *R* charbons de réservoir. », « 🛒 Chariot de la foreuse plus grand : *N* places. »

### 4. 🚃 Wagonnets

Deux trajets de wagonnets touchent la foreuse (voir [mine.md](mine.md#les-wagonnets) et [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets)) :

- **Mine → Foreuse** (il part de la mine) : dès que le réservoir n'est plus plein, le wagonnet emporte **tout le charbon du coffre de la mine**. À l'arrivée, il remplit le réservoir, et **le surplus va dans le chariot** (tant qu'il y a de la place ; le reste revient au coffre). Le wagonnet du marché laisse dans le coffre le charbon qui manque au réservoir (si ce trajet a un pousseur).
- **Foreuse → Marché** (il part d'ici) : le wagonnet emporte le chariot et le vend au marché.

Dans cet onglet : les trajets qui partent de la foreuse (`PanneauTrajets`), et l'alerte quand le chariot de son pousseur est trop petit (`AlerteChariot`). Pour qu'un trajet roule tout seul, il faut **un pousseur** embauché au Personnel pour ce trajet, même sur des rails électriques (voir [personnel.md](personnel.md#3-les-pousseurs)).

## Règles et comportement

- **Quand elle tourne** : seulement si elle est **posée**, qu'il lui reste **du charbon**, et que **le chariot n'est pas plein** (`foreuseEnMarche`). Chariot plein, elle s'arrête sans brûler de charbon (« 🛒 Le chariot de la foreuse est plein : viens le vider. ») ; plus de charbon : « 🔥 La foreuse n'a plus de charbon. »
- **Le charbon** : **1 charbon = 20 secondes** (`SECONDES_PAR_CHARBON`), quelle que soit la vitesse : **3 charbons par minute**, 180 par heure. Plus elle fore vite, plus chaque charbon rapporte.
- **Ce qu'elle remonte** : un bloc tiré au hasard selon le **niveau de la mine** (`tirerBloc`). Elle ne double jamais. Ses blocs vont dans **son chariot**, pas dans le coffre.
- **Sa vitesse** = forage × bonus du générateur × bonus de la boutique :
  - **l'électricité** : dans le rayon du générateur allumé (son centre dans le cercle, `foreuseAlimentee`), elle fore **+ 30 % à + 75 %** plus vite (`multiplicateurGenerateur`) ;
  - **« ⚡ Production × 2 »** (boutique des gemmes, ou le 7e jour du cadeau du jour) : deux fois plus vite (`multiplicateurProduction`).
- **Il n'y a qu'une seule foreuse**.
- **Hors ligne** : quand on rouvre un monde, le jeu rattrape le temps passé (**8 heures au plus**) : elle continue de forer tant qu'elle a du charbon et de la place. La fenêtre du retour dit combien de blocs elle a forés, et compte la valeur de son chariot dans les gains (que la publicité peut doubler).

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Foreuse » dès le niveau 2 de la mine ; une fois posée, « Forage *X* blocs/s » et « Chariot de la foreuse : *X* places » dans les achats possibles. Côté automatisation : « Relie la foreuse à la mine (rails) », « Touche la bulle 🛤️ sur les rails de la foreuse », puis « Relie la foreuse au marché (rails) : elle vendra toute seule ».
- **Autres bâtiments** : elle se paie surtout en **fer et redstone**, puis en or et émeraudes ; le **charbon** vient du coffre de la mine (18 % des blocs au niveau 1). Le **générateur** la booste.
- **Revenus et statistiques** : le « $/s » compte la foreuse quand elle tourne (vitesse × valeur moyenne d'un bloc, `revenu.ts`) ; les statistiques comptent `argentForeuse` et `blocsForeuse`.
- **Bot de simulation** (`bot.ts`) : il la pose dès qu'il peut, remet 10 charbons quand il lui reste moins d'une minute, vend son chariot en même temps que le coffre, et améliore le forage et le chariot quand il a plus de 3 000 $ (sans toucher aux minerais du prochain niveau de la mine).

## Fichiers du code

- `src/jeu/foreuse.ts` : toutes les règles (charbon `remplirForeuse`, forage seconde après seconde `avancerForeuse`, chariot, vente sur place `vendreChariot`, améliorations `ameliorerForage` / `ameliorerChariot`, vitesse `vitesseForage`, `secondesPourRemplir`).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.foreuse` : 2 500 $ + 100 pierre + 50 fer, 5 × 5, porte à gauche, niveau 2 de la mine) et les chiffres (`SECONDES_PAR_CHARBON`, `NIVEAUX_FORAGE`, `NIVEAUX_CHARIOT`).
- `src/jeu/generateur.ts` : `foreuseAlimentee`, `multiplicateurGenerateur` ; `src/jeu/gemmes.ts` : `multiplicateurProduction`, `multiplicateurVentes`.
- `src/jeu/wagonnet.ts` : les trajets Mine → Foreuse (le charbon) et Foreuse → Marché (le chariot).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/mineur.ts` : le type `Foreuse` et `nouvelleForeuse()`.
- `src/jeu/notifications.ts`, `src/jeu/missions.ts`, `src/jeu/objectifs.ts` : bulles, missions, achats.
- `src/jeu/foreuse.test.ts` : les tests.
- `src/composants/Panneaux.tsx` (`PanneauForeuse`) : le panneau et ses quatre onglets ; `src/composants/StockMinerais.tsx` : le chariot à vendre ; `src/composants/PanneauTrajets.tsx` : ses trajets.
