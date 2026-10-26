# 🏭 Fonderie

> Un atelier débloqué au **niveau 5 de la mine** (26/10, la grosse mise à jour des gemmes) : il **fond le fer et l'or en lingots**, qui valent **2 fois** leur minerai, en brûlant du **charbon**. Le minerai arrive à la main (« 📦 Apporter », depuis le coffre de la mine) ou en wagonnet (de la mine ou de la foreuse) ; les lingots attendent dans sa **réserve**, qu'on vend d'un clic ou qu'un wagonnet emporte au marché. Dans le rayon du générateur, elle fond plus vite. Ses **lingots de fer** paient aussi les derniers chariots.
> Écrit d'après le code au 26/10 (`src/jeu/ateliers.ts`, `src/jeu/donnees.ts`, `src/composants/PanneauxAteliers.tsx`).

## Où et quand

- **Où** : là où tu la poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **40 000 $ + 300 pierre + 200 fer + 150 charbon** (les minerais se prennent dans le coffre de la mine ; on peut aussi payer en gemmes). **✏️ Modifier** la déplace ou la retourne (miroir) gratuitement.
- **Déblocage** : au **niveau 5 de la mine** (« Caverne de saphir », `BATIMENTS.fonderie.niveauMine = 5`). Avant, sa carte du menu Bâtiments a un cadenas « 🔒 Mine niveau 5 ». Ses niveaux suivent leurs propres **paliers** (`PALIER_FONDERIE`, voir plus bas).
- **La porte** : sur la face avant **gauche** du dessin (à droite si elle est retournée).
- **Le dessin au village** (26/10, SVG plat au contour d'encre, `public/images/batiments/fonderie.svg`, dessiné par `fonderie()` dans `outils/art/batiments.mjs`) : un **haut-fourneau en briques rouges** (le forgeron, lui, a un four en pierre grise et une enclume), sa bouche qui crache le feu, son haut qui se resserre en une grosse **cheminée qui fume** ; devant, le **moule à lingots** (une plaque de fonte à trois creux) et le **creuset** sur son support ; contre le four, une pile de lingots de fer et d'or ; au fond, le charbon ; devant à droite, une caisse de minerai brut. Sa fumée monte haut : son dessin (et son calage dans `iso.ts`) est plus haut que celui des autres bâtiments. **Quand elle fond**, le jeu montre un deuxième dessin, `fonderie-active.svg` (`fonderie({ enMarche: true })`) : le feu danse, le creuset penché verse un filet de métal fondu dans le moule, le judas clignote et la fumée monte (une animation SMIL dans le SVG, comme la mèche de la foreuse ; jamais d'animation CSS sur l'image).
- **L'ouvrir** : toucher (ou cliquer) la fonderie : la taupe du joueur y marche, puis le panneau s'ouvre (fenêtre orange).
- **Description** : « Elle fond le fer et l'or en lingots, qui valent 2 fois plus. Elle brûle du charbon. »
- **Bulles au-dessus** (`notifications.ts`) :
  - **⚫ « Charbon ? »** (alerte rouge) : « Plus de charbon dans le four de la fonderie ! », quand le four est vide alors qu'il y a du minerai à fondre (`besoinCharbonFonderie`) ;
  - sinon **🟨 « Plein ! »** (alerte rouge) : « La réserve de lingots est pleine : vends-la ! » ;
  - **🚧 « Rails coupés »** (alerte rouge) quand un trajet qui part d'ici ou y arrive n'a plus de rails complets ;
  - et au Personnel, **🚃 « Chariot ! »** quand le wagonnet Fonderie → Marché ne suit pas ce qu'elle fabrique.

## Ce qu'on peut y faire

Le panneau (`PanneauFonderie` dans `PanneauxAteliers.tsx`) a **trois onglets**. Il s'ouvre sur « Lingots » quand la réserve est pleine. En haut de chaque onglet, l'alerte du chariot (`AlerteChariot`) si le wagonnet Fonderie → Marché ne suit pas, avec un bouton vers le Personnel.

### 1. 🔥 Four

- **Une carte d'état** : « *N* lingots/s », et une étiquette : **En marche** (⚡ si elle est dans le rayon du générateur allumé), **Réserve pleine**, **Plus de charbon** ou **Rien à fondre** ; dessous, « *N* lingots fondus ». Pastille « ! » sur l'onglet quand il manque du charbon.
- **Le four** : une jauge « ⚫ *n* / *max* · *X* min » (le charbon qu'il reste, et le temps de four qu'il fait).
- **🔥 Remplir le four · *N* ⚫** : met du charbon **du coffre de la mine** jusqu'à remplir le four (`remplirFonderie`). Le bouton attire l'œil (`btn-attention`) quand le four est vide et qu'il y a du charbon à mettre. Messages : « 🔥 +*N* charbon dans le four. », « 🔥 Le four de la fonderie est plein. », « ⚫ Il te faut du charbon dans le coffre de la mine. » Sous le bouton : « 1 charbon = 12 secondes de four. Le four ne brûle que quand il fond. »
- Réserve pleine : un bouton **🟨 Réserve pleine : vendre les lingots** mène à l'onglet Lingots.
- **Ce qu'elle fond** : la jauge de l'**entrée** (« Entrée : *n* / *places* »), puis une ligne par minerai accepté : « 🔩 → ⬜ Fer → Lingot de fer · 12 $ → 24 $ · *n* à l'entrée » et « 🟡 → 🟨 Or → Lingot d'or · 35 $ → 70 $ », avec **📦 Apporter *N*** (`apporterAuAtelier`). Dessous, en gris, **✖ Refusé ici** et les icônes de ce que sort la mine et qu'elle ne prend pas (pierre, redstone, gemmes… ; le charbon n'y est pas, il va dans le four). « « Apporter » prend dans le coffre de la mine (sauf ce que tu gardes 📌). Avec des rails, un wagonnet l'apporte tout seul. » Messages : « 📦 +*N* fer apporté(s). », « 📦 L'entrée est pleine. »
- **Wagonnets** : les trajets qui partent d'ici ou y arrivent (`PanneauTrajets`), avec **⚙️ Régler**.

### 2. 🟨 Lingots : la réserve

- La **même interface que le coffre de la mine** (`StockMinerais.tsx`) : « 🟨 Lingots » et sa jauge (rouge « Plein : la fonderie s'arrête ! »), le gros bouton **💰 Tout vendre · +X $**, et une ligne par lingot (sa quantité, son prix, **Vendre**). Pastille « ! » sur l'onglet quand elle est pleine.
- La vente se fait **au prix du marché** (`vendreSortie`), × 2 pendant le bonus « 💰 Ventes × 2 ». Message : « 💰 Lingots vendus : +X $ ». L'argent compte dans l'argent gagné (succès, classement).

### 3. ⬆️ Améliorer (5 niveaux)

Une ligne d'amélioration (`Amelioration`) : « *a* lingots/s → *b* », « *p* places → *q* », « Four *r* → *s* ⚫ », avec le bouton vert (le prix) et le bouton violet **💎** (en gemmes). Sans le palier : « 🕳️ Mine *N* ». Message : « 🏭 Fonderie niveau *N* : *V* lingot(s) par seconde, *P* places. »

| Niveau | Lingots/s (sans électricité) | Entrée et réserve | Four | Prix | Palier (`PALIER_FONDERIE`) |
|---|---:|---:|---:|---|---:|
| 1 | 0,5 (30 / min) | 40 places chacune | 15 charbons (3 min) | (le bâtiment) | 5 |
| 2 | 0,8 (48 / min) | 70 | 22 (4 min 24) | 60 000 $ + 300 fer + 100 charbon | 5 |
| 3 | 1,2 (72 / min) | 110 | 30 (6 min) | 140 000 $ + 150 or + 20 saphir | 6 |
| 4 | 1,7 (102 / min) | 160 | 40 (8 min) | 260 000 $ + 250 or + 20 rubis | 6 |
| 5 | 2,4 (144 / min) | 240 | 50 (10 min) | 500 000 $ + 60 saphir + 40 rubis | 7 |

Tous les niveaux : 960 000 $ + 300 fer + 100 charbon + 400 or + 80 saphir + 60 rubis. Chaque niveau rapporte 30 XP (et 1 XP par 25 $ de son prix).

## Règles et comportement

- **Ce qu'elle accepte** (`LINGOT_DE`, `accepte`, `objetsAcceptes`) : seulement le **fer** (→ ⬜ lingot de fer, 24 $) et l'**or** (→ 🟨 lingot d'or, 70 $). Un lingot vaut **2 fois** son minerai : elle ajoute 12 $ par lingot de fer et 35 $ par lingot d'or. Le **charbon** n'est pas fondu : il va dans le four.
- **Quand elle fond** (`fonderieEnMarche`) : seulement si elle est **posée**, qu'il reste du **charbon** dans le four, qu'il y a du **minerai à l'entrée** et que **la réserve n'est pas pleine**. Elle prend toujours **le minerai le plus cher d'abord** (l'or avant le fer).
- **Le charbon** : **1 charbon = 12 secondes de four** (`SECONDES_PAR_CHARBON_FONDERIE`), quelle que soit la vitesse, et seulement pendant qu'elle fond (four plein : 3 min au niveau 1, 10 min au niveau 5). Un charbon fond 6 lingots au niveau 1, 28,8 au niveau 5 (sans électricité) : plus elle est rapide, plus chaque charbon rapporte.
- **Sa vitesse** (`vitesseFonderie`) = lingots/s du niveau × bonus du générateur × bonus de la boutique :
  - **l'électricité** : dans le rayon du générateur allumé (son centre dans le cercle, `atelierAlimente`), + 30 % à + 100 % (`multiplicateurGenerateur`) ;
  - **« ⚡ Production × 2 »** (boutique des gemmes, ou le cadeau du jour) : deux fois plus vite (`multiplicateurProduction`).
- **L'entrée et la réserve** ont le même nombre de places (`stock`). Entrée pleine : on ne peut plus rien apporter, et les wagonnets repartent avec ce qui n'a pas trouvé de place. Réserve pleine : elle s'arrête (sans brûler de charbon).
- **Ce qu'on garde 📌** : « Apporter » et le wagonnet de la mine ne prennent pas ce qu'on garde dans le coffre.
- **Il n'y a qu'une seule fonderie**.
- **Hors ligne** : quand on rouvre un monde, le jeu rattrape le temps passé (**8 heures au plus**) : elle fond tant qu'elle a du charbon, du minerai et de la place. Au retour, **sa réserve est vendue toute seule** avec le coffre de la mine (`vendreCoffreAuRetour`).md](mine.md#les-wagonnets) et [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets)). Pour qu'un trajet roule tout seul, il faut **un pousseur** embauché au Personnel pour lui (voir [personnel.md](personnel.md#3-les-pousseurs)) :

| Trajet | Ce que fait le wagonnet |
|---|---|
| 🏭 **Mine → Fonderie** | il apporte le fer et l'or **choisis** du coffre de la mine (sans dépasser la place de l'entrée, les plus chers d'abord, sauf ce qu'on garde 📌), **et** le charbon qui manque au four (`objetFixe`). |
| 🏭 **Foreuse → Fonderie** | la même chose, depuis le chariot de la foreuse. |
| 🟨 **Fonderie → Marché** | il emporte les lingots choisis de la réserve et les vend au marché. |

- **La fenêtre du trajet** vers la fonderie dit « Ce qu'il apporte » : les tuiles du fer et de l'or (vertes = il les emporte, grises = elles restent au départ), puis, **grisées avec ✖ « Refusé ici »**, celles des minerais qu'elle n'accepte pas (`objetsRefuses`) ; « Vert : il l'apporte à la fonderie. Gris : il reste au départ. La fonderie ne fond que le fer et l'or. » Une carte « ⚫ Il apporte aussi le charbon du four » montre la jauge du four.
- **À l'arrivée** (`livrerAtelier`), la fonderie prend ce qu'elle accepte tant qu'il y a de la place, et le charbon jusqu'à remplir le four ; le reste repart au départ.
- **Le partage avec le marché** (`reservePourLesAteliers`) : si Mine → Fonderie (ou Foreuse → Fonderie) a un pousseur, le wagonnet vers le marché laisse au départ le fer et l'or choisis pour la fonderie (autant qu'il reste de place à son entrée) et le charbon de son four. Quand elle est pleine, le reste part au marché : rien ne reste bloqué.

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Fonderie » dès le niveau 5 de la mine ; une fois posée, « Relie la fonderie à la mine (rails) : le fer, l'or et le charbon y iront tout seuls », « Touche la bulle 🛤️ sur les rails mine → fonderie », puis « Relie la fonderie au marché (rails) : ses lingots s'y vendront tout seuls » et « Touche la bulle 🛤️ sur les rails fonderie → marché ». Dans les achats possibles : « Fonderie niveau *N* ».
- (26/10) Les chariots se paient en **minerai de fer**, pas en lingots : les lingots servent seulement à être vendus.
- **Revenus** (`revenu.ts`) : le « $/s » du bandeau compte **ce qu'elle ajoute** (`plusValueParSeconde` : les lingots par seconde × la différence moyenne entre le lingot et son minerai, selon ce qui attend à l'entrée) ; le bilan a une ligne « 🏭 La fonderie » (« les lingots valent plus que le minerai », ou « à l'arrêt »).
- **Succès** : « 🟨 Fondeur » : fondre ton premier lingot (`fonderie.fabriques`).
- **Le marché** montre les prix des lingots (« Prix du marché ») une fois la fonderie construite.
- **Bot de simulation** (`bot.ts`) : il la pose en (9, 15) dès le niveau 5 de la mine, y apporte à la main tout son fer et son or (sauf ce qu'il garde pour ses achats), remplit le four quand il lui reste moins de 2 minutes, l'améliore quand il a 1,5 fois le prix et vend sa réserve (sauf les lingots qu'il garde). Mesuré le 26/10 : environ 8 000 lingots fondus par partie, fonderie au niveau 2 à la fin.
- **Anciennes parties** : une partie de la version 29 (d'avant le 26/10) reçoit une fonderie vide, pas encore posée (`convertirVersion29`, `nouvelAtelier`).

## Fichiers du code

- `src/jeu/ateliers.ts` : toutes les règles (ce qu'elle accepte `accepte` / `produitDe`, ses niveaux `infoFonderie`, `ameliorerAtelier`, l'entrée `placeEntree` / `livrerAtelier` / `apporterAuAtelier`, le four `remplirFonderie` / `placeCharbonFonderie`, la vente `vendreSortie`, le travail `avancerFonderie`, `fonderieEnMarche`, `vitesseFonderie`, la plus-value `plusValueParSeconde`, `besoinCharbonFonderie`).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.fonderie` : 40 000 $ + 300 pierre + 200 fer + 150 charbon, 5 × 5, porte à gauche, niveau 5 de la mine), les lingots dans `BLOCS` (`sorte: 'lingot'`), `LINGOT_DE`, `SECONDES_PAR_CHARBON_FONDERIE`, `NIVEAUX_FONDERIE`, `PALIER_FONDERIE`, les trajets dans `LIAISONS`.
- `src/jeu/mineur.ts` : le type `Atelier` (`niveau`, `entree`, `sortie`, `progression`, `carburant`, `fabriques`), `nouvelAtelier()`, et le paiement avec la réserve (`disponible`, `payerMateriaux`).
- `src/jeu/wagonnet.ts` : les trajets vers la fonderie et depuis la fonderie (`atelierDArrivee`, `stockDuDepart`, `objetsAuChoix`, `objetsRefuses`, `objetFixe`, `reservePourLesAteliers`).
- `src/jeu/generateur.ts` : `atelierAlimente` ; `src/jeu/gemmes.ts` : `multiplicateurProduction`.
- `src/jeu/temps.ts` : `avancerFonderie` à chaque tic ; `src/jeu/absence.ts` : la réserve vendue au retour.
- `src/jeu/production.ts` (`analyseWagonnet`), `src/jeu/revenu.ts`, `src/jeu/notifications.ts`, `src/jeu/missions.ts`, `src/jeu/objectifs.ts`, `src/jeu/succes.ts`, `src/jeu/niveaux.ts` (`palierRequis`) : chariot du wagonnet, revenus, bulles, missions, achats, succès, paliers.
- `src/jeu/sauvegarde.ts` : `convertirVersion29`.
- `src/jeu/ateliers.test.ts` : les tests.
- `src/composants/PanneauxAteliers.tsx` (`PanneauFonderie`, `CeQuIlAccepte`, `Reserve`) : le panneau ; `src/composants/StockMinerais.tsx` : la réserve à vendre ; `src/composants/PanneauTrajets.tsx` et `src/composants/FenetreTrajet.tsx` : ses trajets ; `src/styles/batiments.css` : les lignes « ce qu'elle accepte » et les tuiles refusées.
- `src/composants/iso.ts` (calage, `IMAGE_FONDERIE_ACTIVE`), `src/composants/ElementsVillage.tsx`, `src/composants/VueVillage.tsx` : le dessin au village, et celui qui fond.
- `public/images/batiments/fonderie.svg` et `fonderie-active.svg` : les dessins, fabriqués par `node outils/art/fabriquer.mjs` (`fonderie()` dans `outils/art/batiments.mjs`, voir son LISEZMOI) ; les icônes 🏭, ⬜ et 🟨 dans `outils/icones/dessins.py`.

## Priorité à l'atelier (26/10)

Quand un trajet automatique (avec son pousseur) emmène un minerai de la mine ou de la foreuse vers cet atelier, **l'atelier passe d'abord** : le wagonnet du marché (Mine → Marché, Foreuse → Marché) laisse au départ juste ce qui tient encore à l'entrée de l'atelier (moins ce que son wagonnet y apporte déjà), et **emporte le reste au marché**, même si ce minerai est décoché pour le marché. Rien ne s'entasse plus dans le coffre ou le chariot de la foreuse quand l'atelier ne suit pas (`atelierPrioritaire`, `reservePourLesAteliers` dans `src/jeu/wagonnet.ts`). La fenêtre du trajet du marché le dit sous les tuiles.
