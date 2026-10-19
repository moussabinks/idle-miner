# Idle Miner (web) : contexte du projet

> Où en est le projet, qui fait quoi, ce qui est décidé et ce qui reste à faire.
> Les règles de code sont dans [CLAUDE.md](CLAUDE.md), les règles du jeu dans [docs/idle_miner_v1.md](docs/idle_miner_v1.md).
> À mettre à jour à chaque étape importante.

## 1. Le projet en bref

- **Quoi** : un idle game de minage inspiré de Minecraft. On creuse, on vend les blocs, on achète de meilleures pioches et on descend jusqu’à la bedrock (-128 m).
- **D'où on part** : une v1 jouable en **Python** (notebook Jupyter + `ipywidgets`). Sa spec complète est dans `docs/idle_miner_v1.md`.
- **Objectif** : un portage web avec un front plus soigné, jouable dans le navigateur et hébergé sur Vercel.
- **Équipe** : 2 développeurs sur GitHub.
  - `moussabinks` : propriétaire du dépôt.
  - `N04H2004` : collaborateur.

## 2. Choix techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript | Vercel ne fait pas tourner de notebook Python. Le jeu tourne entièrement dans le navigateur, sans serveur. |
| Front | React 19 + Vite | Standard, rapide, très bien supporté par Vercel. |
| Tests | Vitest | Teste la logique du jeu sans navigateur, y compris le futur bot d'équilibrage. |
| Lint | oxlint | Fourni par le template Vite. |
| Sauvegarde | `localStorage` | La progression doit survivre à la fermeture de l'onglet. |
| Comptes et sauvegarde en ligne | Supabase (19/10) | Comptes avec mots de passe bien protégés et base de données, sans écrire de serveur. Servira aussi au leaderboard. |
| Option écartée | Garder le Python avec Pyodide | Environ 10 Mo à charger au démarrage et difficile à brancher sur React. |

## 3. Infra

- **Dépôt** : https://github.com/moussabinks/idle-miner (passage en **public** prévu le 19/10, pour Vercel Hobby). Branche principale : `main`.
- **Workflow** : une branche par fonctionnalité, puis une Pull Request. L'autre développeur relit avant le merge. On ne pousse jamais directement sur `main`.
- **Vercel** : le 19/10, `N04H2004` publie avec `npx vercel --prod` depuis son PC (compte Hobby, sans déploiement automatique). Pour les déploiements automatiques et les previews de PR, choix entre :
  - **Option A** : le compte Vercel Pro du collègue. Il faut alors une organisation GitHub (on y transfère le dépôt) et que les deux développeurs soient membres de l'équipe Vercel, sinon les déploiements de l'autre sont bloqués.
  - **Option B** : passer le dépôt en public et utiliser le plan Hobby gratuit. Avec un dépôt privé, Hobby ne déploie que les commits du propriétaire.
  - Si le dépôt est transféré, mettre à jour le remote : `git remote set-url origin https://github.com/<org>/idle-miner.git`.
- **Supabase** : projet `peumwxcvqncynobwejmk` (https://peumwxcvqncynobwejmk.supabase.co). L'adresse et la clé publique (« publishable ») sont dans `src/enLigne.ts`. À faire une fois dans le tableau de bord :
  - **SQL Editor** : coller et lancer `supabase/schema.sql` (table `sauvegardes` + règles de sécurité). ✅ fait le 19/10.
  - **SQL Editor** : coller et lancer `supabase/classement.sql` (table `classement` + règles de sécurité).
  - **Authentication → Sign In / Providers → Email** : décocher **Confirm email** (les adresses des comptes sont fabriquées à partir du pseudo, aucun email ne peut arriver).
- **Poste de dev (Mac)** : Homebrew, Node 26, npm 11, git, et gh connecté au compte `moussabinks`.

## 4. État actuel du code

Le jeu est **jouable de bout en bout** : de -1 m à la bedrock, puis prestige.

Depuis la v11 de l'état (`VERSION_ETAT = 11`, anciennes sauvegardes migrées automatiquement) :

- **Mine à -128 m, couches de 10 blocs.** Zones, minerais et pioches à l'échelle de 128 m. Les minerais **apparaissent petit à petit** (19/10, `APPARITION_MINERAIS` dans `mine.ts`) : chacun commence très rare à sa profondeur de départ puis devient plus fréquent jusqu'à sa profondeur « pleine » (charbon et fer dès -7 m, redstone dès -18 m, or dès -25 m, lapis dès -30 m, émeraude dès -40 m, diamant dès -45 m, débris dès -96 m).
- **Bedrock** : en finissant la couche -127 m avec la netherite, on gagne (succès + écran de victoire une seule fois), mais on **continue de creuser** des galeries à -127 m. Le prestige se fait quand on veut, au Puits.
- **Une seule vue qui défile** : le village en haut, puis tout le puits creusé. L'échelle et le rail de l'ascenseur à gauche, le puits de la foreuse à droite. La caméra suit le joueur (directement pendant qu'il bouge, en douceur pour les sauts).
- **Village** (`VueVillage.tsx`, `useMarcheVillage.ts`) : un monde de 22 tuiles avec chemin, hautes herbes, fleurs, arbres, barrières et collines (défilement plus lent). Les stands sont **serrés tous les 3 pas** (19/10) pour des allers-retours rapides : Puits, Marché, Forgeron, Bazar, Enchanteur, Foreuse. On marche avec ← → (garder la touche) ou en cliquant sur un stand.
- **Position du joueur** : `position` en mètres (0 = village, `profondeur - 1` = front de taille). Échelle : 0,15 s par mètre.
- **Ascenseur** : une vraie cabine qui monte et descend (`position`, `cible`), construite puis améliorée **surtout avec de l'argent** (6 niveaux, de 32 à 1 024 objets par voyage). Le niveau 1 (250 $ + 5 fer) ne demande pas de redstone : on peut le construire tôt.
  - **Envoi depuis le sac** (panneau Sac, à droite dans la mine) : chaque objet a une case à cocher (gardée d'une fois sur l'autre), et le bouton « Envoyer X objets à la surface » (X = place dans la cabine) les fait vendre au marché. Si la cabine n'est pas là, elle vient d'abord (`demanderEnvoi`, `envoiDemande`).
  - Pendant que la cabine voyage, le bouton d'envoi est **grisé avec un minuteur** (« de retour dans 12 s »), et le module en bas à gauche affiche aussi le temps restant (`secondesAvantArretAscenseur`).
  - On peut aussi **construire et améliorer l'ascenseur au village**, à l'entrée de la mine.
  - **Envoi automatique** quand le sac est plein : case à cocher, **désactivée par défaut** (19/10 : avant, l'ascenseur partait tout seul avec n'importe quels objets).
  - **Plus de pop-in** (19/10) : dans le sac, deux boutons côte à côte : « 📦 Envoyer X objets » (la cabine part seule) et « ⏫ Remonter avec l'ascenseur » (le mineur marche jusqu'au puits et monte avec les objets choisis). Si la cabine n'est pas là : « 🛗 Appeler l'ascenseur ». La construction et les améliorations sont dans une carte « Ascenseur » sous le sac (et au village).
  - **Le niveau de l'ascenseur est gardé au prestige** (19/10), comme la foreuse.
- **Plafonds d'amélioration par prestige** (19/10, `PLAFONDS` et `niveauMaxAuPrestige` dans `donnees.ts`) : on ne peut plus tout améliorer en un seul prestige (« prestige 1 puis je farme tout »). Règle commune : au déblocage, un certain niveau, puis **un niveau de plus par prestige**. Ascenseur : niveau 2 au prestige 0, 3 au prestige 1... 6 au prestige 4. Forage et chariot de la foreuse : 2e niveau au prestige 1... 5e au prestige 4. Équipement des mineurs : Pierre au prestige 2... Netherite au prestige 5. Les pioches, le sac et les enchantements ne sont pas plafonnés (il faut pouvoir atteindre la bedrock dès la première partie). Une sauvegarde déjà au-dessus du plafond garde ses niveaux.
- **Lignes d'achat et d'amélioration identiques partout** (19/10, `Amelioration.tsx`) : ce qu'on a, des petits carrés pour les niveaux (pleins = achetés, vides = à acheter, hachurés = bloqués par le prestige), le prix à gauche (vert si on l'a, rouge sinon) et le bouton à droite ; sinon « 🔒 … au prestige N » ou « ✔ Niveau max ». Les achats simples (pioches, seau, embauche, foreuses) utilisent `Achat`, avec le même prix à gauche.
- **Argent par seconde** (19/10, `src/jeu/revenu.ts`) : à côté de « Argent » dans le bandeau, « 📈 12 $/s » (en vert s'il y a un revenu). C'est une moyenne calculée : toi quand tu creuses (valeur moyenne d'un bloc à ta profondeur / temps moyen pour le casser, Fortune comprise), la foreuse quand elle tourne (vitesse × valeur moyenne à sa profondeur) et chaque mineur (un sac plein moins le salaire, divisé par un aller-retour complet : creuser, trajets selon l'ascenseur, vente). Le détail est dans l'info-bulle. Un test vérifie que l'estimation des mineurs colle à une vraie simulation d'une heure.
- **Le mineur regarde dans le sens où il creuse** (19/10, `sensDeMinage`) : il creuse en zigzag (une couche vers la droite, la suivante vers la gauche) et se retourne à chaque couche.
  - Trajets fluides : pendant un déplacement, l'horloge bat à chaque image (requestAnimationFrame) et la caméra suit la position exacte ; la cabine n'a plus de transition CSS (elle « tremblait »).
  - Quand le sac est plein, les blocs attendent sur le **quai** de l'ascenseur (ils partent en premier au prochain envoi).
- **Prestige** : +15 % sur les ventes et +10 % de vitesse des pioches, par niveau (cumulés). On garde : succès, talents, niveau de l'ascenseur, **les améliorations de la foreuse** (forage, chariot, nombre de foreuses, recharge auto) et les mineurs employés avec leur pioche. Depuis le 19/10, la foreuse repart **vide** (sans charbon, chariot vidé) **depuis la surface** (sinon c'était trop fort), et les mineurs aussi repartent de la surface, sac vide.
- **Mineurs employés** (prestige 2, `employes.ts`, `PanneauEmployes.tsx`, stand « Mineurs » avec cadenas avant) : 2 au prestige 2, puis 1 de plus par prestige (6 au plus, +1 avec un talent). Embauche 5 000 $, 12 000 $, 25 000 $... Chacun creuse dans sa propre galerie. Chaque amélioration (payée en argent) lui donne une meilleure pioche (vitesse et profondeur, de Bois à Netherite) **et un plus grand sac à dos** (32, 48, 64, 96, 128). Quand son sac est plein, il remonte dans **son propre ascenseur** (19/10 : aussi rapide que le tien, au moins comme un niveau 1 si tu n'as pas construit le tien ; plus d'échelle pour eux), **passe 4 s au marché** pour vendre, puis redescend ; un trajet dure **au moins 5 s** (attente de la cabine), même tout près de la surface. Pendant ce temps, il ne creuse pas (étapes `creuse`, `monte`, `vend`, `descend`). Il garde 25 % de salaire et te donne le reste. Ils travaillent aussi jeu fermé (8 h au plus). Un rappel « 👷 2 mineurs » est affiché en haut de la mine. **On les voit travailler** (19/10) : à droite du puits de la foreuse, un puits d'ascenseur (glissières, poulie) où **chaque mineur a sa cabine sur son câble** : on la voit descendre avec lui dedans, l'attendre juste au-dessus de lui pendant qu'il casse le bloc sous ses pieds (avec son nom, sa profondeur et la couleur de sa pioche), le remonter quand son sac est plein, puis attendre vide à la surface pendant qu'il vend. Au-dessus de sa tête, une étiquette dit ce qu'il fait (⛏️ creuse avec sa profondeur, ⏫ remonte, ⏬ redescend, avec le temps restant) et une petite jauge montre son sac ; au marché, il n'est plus dans la mine (le compteur en haut de la mine affiche combien sont à chaque étape). Un mineur plus profond que la vue est dessiné en bas avec une flèche ↓ (`GalerieMineurs` dans `VueMonde.tsx`, colonne `--col-mineurs` qui n'existe que si on a des mineurs).
- **Plusieurs foreuses** (prestige 3) : 2 au prestige 3, puis 1 de plus par prestige (5 au plus), 50 000 $, 100 000 $, 200 000 $, 400 000 $. Elles creusent ensemble (vitesses additionnées), partagent le chariot et brûlent chacune leur charbon. **Depuis le 19/10, chaque foreuse est séparée** (`foreuse.foreuses`, type `UneForeuse`) : une foreuse achetée arrive **toute neuve (niveau de forage 0) et creuse son propre trou depuis la surface** ; chacune s'améliore à part (« Foreuse 1 », « Foreuse 2 »... au stand) et on voit une tête par foreuse dans le puits. La recharge automatique est disponible dès qu'une foreuse a le niveau 3. Sauvegarde v12 : les foreuses déjà achetées gardent ce qu'elles avaient.
- **Creuser** : « Creuser » casse une couche ; « 🔁 Auto » creuse sans s'arrêter jusqu'à « ⏹ Arrêt », et s'arrête tout seul si la pioche casse (pas de minage à mains nues en AFK).
- **Arbre de prestige** (`talents.ts`, `ArbrePrestige.tsx`) : 1 point par prestige, 4 branches de 4 talents (Mineur, Marchand, Ingénieur, Patron). Ingénieur : ascenseur +30 %, foreuses +50 %, charbon ×2, chariot ×2. Patron : mineurs +25 %, sacs ×2, salaire 10 %, +1 mineur. « Ascenseur offert » et « Grimpeur agile » ont été retirés le 19/10 (leurs points sont rendus). Il faut le talent du dessus pour prendre celui du dessous. L'arbre s'ouvre tout seul après un prestige pour choisir sa récompense ; on le rouvre au Puits ou avec l'étoile du bandeau. Les talents sont gardés pour toujours. Bonus de départ (pioche en pierre/fer, Fortune I, sac de 128, 300 $) et bonus permanents.
- **Sons** (`src/sons.ts`) : fabriqués avec Web Audio, sans fichier. Coups de pioche, bloc qui casse, « plink » des minerais, étincelles des minerais rares, « ka-ching » des ventes (plus de pièces pour une grosse vente), « ding-dong » de l'ascenseur, barreaux d'échelle, achats, succès, talents, prestige, lave, coffres, géodes. Bouton 🔊/🔇 dans le bandeau (réglage gardé dans `localStorage`).
- **Musique et ambiances** (`src/ambiance.ts`) : musique calme générée (accords la mineur / fa / do / sol, basse et mélodie pentatonique au hasard), vent et oiseaux au village, grondement, écho, gouttes d'eau et résonances graves dans la mine (de plus en plus présents en descendant). Bouton 🎵 dans le bandeau.
- **Style cartoon, pas Minecraft** (19/10) : on garde un style de dessin animé, mais **rien de cubique**. Les blocs sont des cailloux arrondis et un peu irréguliers, avec du relief (`blocs.css`), et les minerais ont un petit éclat. Les échoppes ont un auvent bombé à festons, un comptoir arrondi et un panneau en forme de pilule ; les arbres sont tout ronds. Les icônes sont des émojis (`Icone.tsx`, plus de pixel art). La **foreuse** est une petite machine orange arrondie (hublot, pot d'échappement qui fume, mèche en spirale), et au village une tour de forage en acier sur une machine orange : plus de « plot de chantier » jaune et noir. La deepslate s'appelle **« Roche dure »** à l'écran (son identifiant interne reste `deepslate`, pour ne pas casser les sauvegardes).
- **Version affichée** (19/10) : en bas de l'accueil, « Version abc1234 · date » (commit Git et date du build, via `vite.config.ts`). Pratique pour vérifier que Vercel a bien mis en ligne la dernière version.
- **Effets satisfaisants** (19/10, sans changer les règles) : le compteur d'argent défile jusqu'à la nouvelle somme (`useCompteur.ts`) ; les minerais trouvés à la suite (moins de 4 s d'écart) font monter le « plink » d'une note à chaque fois ; une couche finie fait un « boum » (et une cloche tous les 10 m) et la profondeur du bandeau saute ; une amélioration joue une petite fanfare et son carré de niveau « pop » ; un minerai rare fait trembler la mine.
- **Boutons colorés par action** : creuser (or), arrêter (rouge), vendre (vert), acheter (bleu), améliorer (turquoise), réparer (orange), enchanter (violet), prestige (rose), ascenseur (cyan), se déplacer (bois), mettre dans le sac (kaki), charbon (anthracite).
- **Animations** (`src/effets.css`, `src/evenements.ts`) : éclats qui sautent quand un bloc casse, bulle brillante avec rayons et étincelles pour **tous les minerais** (charbon, fer, redstone… et les rares, qui ont en plus un son scintillant), gros « +X $ » avec une gerbe de pièces pour les ventes, compteur d'argent qui saute. `evenements.ts` compare l'état avant/après une action pour savoir quoi jouer.
- **Foreuse** (prestige 1+) : activée une fois (5 000 $ + 10 fer + 5 redstone), améliorée surtout avec de l'argent (forage jusqu'à 8 blocs/s pour 150 000 $, chariot jusqu'à 5 000 places), au charbon (1 charbon = 20 s), elle descend d'un mètre tous les 10 blocs. On la voit forer dans son puits (jaune et noir, animée), avec un indicateur toujours visible en haut de la mine. Le chariot a un **inventaire à cocher** (avec « Tout sélectionner / Tout désélectionner ») : « Vendre la sélection » et « Mettre dans le sac » ne prennent que les objets cochés. Au **niveau 3 de forage**, une option à cocher la fait **se recharger toute seule** avec le charbon qu'elle remonte (elle garde une minute de réserve, le reste va au chariot). Elle continue quand le jeu est fermé (8 h au plus). **C'est la seule chose qui avance hors ligne** (avec la fin d'un trajet d'échelle ou d'ascenseur) : le minage du joueur s'arrête quand l'onglet est fermé.
- **Marché** : une **jauge par objet** (curseur + bouton « Max » + compteur « 5 / 20 ») pour vendre une partie seulement (`vendreLot`). Une jauge à 0 « garde » l'objet (`nonAVendre`), et il recommence à 0 la fois suivante. Pareil dans le sac de la mine pour l'**ascenseur** (`demanderEnvoi(etat, lot)`, `ascenseur.garder` pour l'envoi automatique).
- **Bandeau** : la case Pioche n'affiche plus « x2, x3 » (on croyait que c'était un nombre de pioches).
- **Sacs** (Bazar) : 32 places au départ, puis 64 (80 $), 128 (400 $), 256 (1 500 $), 512 (5 000 $), 1 024 (15 000 $) et 2 048 places (40 000 $). Les trois derniers ont été ajoutés le 19/10.
- **Caméra** : une référence par endroit où le mineur est dessiné (village, cabine, échelle, front). Avec une seule référence partagée, la caméra restait au village pendant la descente en ascenseur (corrigé le 19/10).
- **Pas de torches** : lumière naturelle, les 4 couches sous la couche en cours sont visibles et de plus en plus sombres.
- **Comptes et sauvegarde en ligne** (19/10, `CarteCompte.tsx`, `useCompte.ts`, `enLigne.ts`, `compte.ts`) : sur l'accueil, une carte « Ton compte » (facultative) : pseudo (3 à 16 caractères, lettres sans accent, chiffres, `_`, `-`) + mot de passe (6 caractères au moins). Pas d'email : Supabase reçoit l'adresse fictive `pseudo@joueurs.idle-miner.app` (en minuscules, donc « Noah » = « noah »), et un mot de passe oublié est perdu. Connecté, tous les mondes du navigateur sont copiés en ligne (une ligne par joueur dans `sauvegardes`, un envoi toutes les 20 s s'ils ont changé, en quittant un monde et en quittant la page). À la connexion : compte vide → on envoie ; navigateur vide → on récupère ; sinon, si ce navigateur a fait le dernier échange avec ce compte → on envoie, et sinon on demande au joueur lesquels garder. Le `localStorage` reste la sauvegarde principale : sans réseau, le jeu marche comme avant.
- **Classement / leaderboard** (19/10, `classement.ts`, `CarteClassement.tsx`, table `classement`) : sous les mondes, sur l'accueil, deux onglets **⭐ Prestige** (l'argent départage) et **💰 Argent** (le prestige départage), top 20, médailles pour les 3 premiers, ligne du joueur encadrée. Tout le monde peut le lire ; pour y apparaître, il faut un compte. Le score est le meilleur des mondes du joueur et part avec chaque envoi des mondes. « Argent » = tout l'argent gagné depuis le début, **prestiges compris** (`argentGagneTotal` : `argentGagneAvant`, gardé au prestige, + `stats.argentGagne`) : l'argent en poche baisse quand on achète et repart à 0 au prestige. Les parties d'avant la v11 partent de 0 pour les prestiges passés. Côté serveur : le pseudo doit être celui du compte (impossible de se faire passer pour un autre), pseudos uniques sans tenir compte des majuscules, le serveur garde toujours le **meilleur** score (supprimer un monde ne fait pas descendre), et des scores impossibles sont refusés (prestige ≤ 500, argent ≤ 10^15). C'est un anti-triche minimal : un joueur qui modifie son `localStorage` peut encore tricher.
- **Écran d'accueil et mondes** (`Accueil.tsx`, `sauvegarde.ts`) : au lancement, un écran explique le but du jeu (4 étapes et une coupe de la mine jusqu'à la bedrock) et liste les **mondes** : jusqu'à 5 parties séparées (une save de dev avancée, une save de début, celle d'un ami...). On peut créer (avec un nom), jouer, renommer, dupliquer et supprimer un monde. Dans le jeu, le bouton « 🌍 nom du monde » en haut ramène à l'accueil. Chaque monde a sa sauvegarde et son temps hors ligne ; le son et la musique sont communs. L'ancienne sauvegarde unique devient « Monde 1 ». Les saves restent dans le navigateur (pas d'export pour l'instant).
- **Village** : entre deux stands, plus de menu de navigation (19/10) : on marche avec ← → ou on clique sur un stand.
- **Creuser** : seulement avec les boutons Creuser / x10 (19/10). Les flèches du clavier servent seulement à se déplacer.
- **Tout tient dans l'écran** (ordinateur, 19/10) : le jeu prend exactement la hauteur de la fenêtre (`index.css`, « Tout tient dans l'écran »). La mine s'étire pour remplir la place, et seul le panneau de droite défile à l'intérieur s'il est trop long. Les jauges tiennent sur une ligne par objet. « Recommencer à zéro » est un petit lien dans l'en-tête. Sur téléphone, la page défile comme avant.
- **Barre de boutons fixe** : 4 boutons toujours à la même place (Creuser/Arrêter, x10, Village, Mine). Plus de flèches à l'écran (19/10) : un petit rappel « ← → pour te déplacer » (caché sur écran tactile). Les flèches du clavier marchent toujours (↑ ↓ pour l'échelle).
- **Quitter le front de taille** : le mineur **marche jusqu'au puits** (case par case, 0,12 s par case) avant de prendre l'ascenseur ou l'échelle (`voyager`, `depart`, `avancerMarche`). Il ne se téléporte plus.
- **Noms** : le bouton « Front » s'appelle « Mine », le stand « Puits » s'appelle « Mine » et a un nouveau dessin (galerie dans un rocher, poutres, lanterne, rails, wagonnet).
- **Succès** : un petit bouton « 🏅 x/16 » en haut à droite ouvre une fenêtre (ils ne prennent plus de place à côté du jeu).
- **Notifications** : en bas de la colonne de droite (sous le panneau du stand ou du sac), en plus gros, sans cacher la mine ni les boutons ; en haut de l'écran sur téléphone.
- **Sac plein** : la case « Sac » du bandeau clignote en rouge, tremble un peu et dit « Sac plein ! Vends ou envoie tes minerais » (pour qu'un nouveau joueur comprenne pourquoi il ne creuse plus).
- **Horloge unique** (`usePartie.ts`) : échelle, ascenseur, foreuse et minage avancent au même rythme (tic de 50 ms).
- **Personnage** : une taupe mineuse en SVG (`Personnage.tsx`) dont la pioche prend la couleur de la pioche équipée.

- `src/jeu/` (logique pure, testée avec Vitest) :
  - `donnees.ts` : blocs, pioches, sacs, enchantements, zones et constantes de la spec v1.
  - `aleatoire.ts` : aléatoire injectable (`Math.random` en jeu, générateur à graine dans les tests).
  - `mine.ts` : génération des couches pondérée selon la profondeur.
  - `mineur.ts` : l'état de la partie (`EtatJeu`, un objet JSON) et toutes les actions (casser, vendre, réparer, acheter, enchanter, prestige).
  - `revenu.ts` : l'argent généré par seconde (estimation pour le bandeau).
  - `succes.ts` : les 16 succès. `sauvegarde.ts` : `localStorage`. `talents.ts` : l'arbre de prestige.
  - `foreuse.ts` : la foreuse. `temps.ts` : le temps qui passe (échelle, ascenseur, foreuse).
  - `bot.ts` + `bot.test.ts` : le bot joue 20 parties (il prend l'ascenseur). Médiane ≈ 2 400 blocs pour la bedrock (couches de 10), environ 19 min de jeu simulé.
- `src/usePartie.ts` : le hook React qui relie la logique à l'écran (minage animé, toasts, sauvegarde auto).
- `src/composants/` : `VueMonde` (village + puits + échelle + ascenseur), `ModuleAscenseur`, personnage, icônes pixel, HUD, sac, panneaux des stands (dont la foreuse), succès, toasts, écran de victoire.
- `src/blocs.css` : tous les blocs et animations en CSS. `src/index.css` : mise en page (desktop et mobile).

### Choix faits là où la spec v1 ne disait rien

- Sac plein : le bloc est cassé mais perdu, et le minage « x10 » s'arrête tout seul.
- Le seau d'eau est consommé quand il éteint une lave.
- « Vendre tout » vend vraiment tout : c'est au joueur de décocher ce qu'il veut garder (demande du 16/10).
- Fabriquer des torches et changer de pioche se fait partout ; vendre, acheter, réparer et enchanter seulement à la surface.
- Racheter une pioche neuve coûte le même prix (matériaux compris) que la débloquer.
- Pioche cassée : on mine à mains nues, mais la profondeur max reste celle de la pioche équipée.
- La liste des 16 succès a été réinventée (la v1 ne la détaillait pas).
- Valeurs choisies par nous, à ajuster après de vraies parties : prix de l'ascenseur, de la foreuse et des enchantements (voir l'économie ci-dessous), vitesse de l'échelle (0,15 s/m), coûts et niveaux de la foreuse.
- Une nouvelle partie commence à -2 m : le premier mètre est l'entrée du puits.
- **Économie (19/10)** : les améliorations coûtent surtout de l'argent, les minerais ne servent plus que d'appoint. Le joueur avait trop d'argent sans rien pour le dépenser (fin du prestige 2), et l'ascenseur était trop cher en fer et redstone au début.
  - Ascenseur : 250 $ + 5 fer, puis 1 500 $ + 10 fer + 5 redstone, 5 000 $ + 20 fer + 10 redstone, 15 000 $ + 20 redstone, 35 000 $ + 10 or, 80 000 $ + 5 diamants.
  - Foreuse : activation 5 000 $ + 10 fer + 5 redstone. Forage 6 000 $, 20 000 $, 60 000 $, 150 000 $ (+ quelques minerais). Chariot 3 000 $, 12 000 $, 40 000 $, 100 000 $.
  - Enchantements : argent + lapis + émeraudes, par niveau (efficacité 400 $ + 3 lapis + 1 émeraude, fortune 600 $ + 4 + 1, solidité 300 $ + 3 + 1).
  - **Fortune affaiblie (19/10)**, c'était trop fort : chaque niveau donne 20 % de chance de **doubler** un minerai (Fortune I 20 %, II 40 %, III 60 %), jamais plus de ×2. Avant (formule de la v1), Fortune III donnait jusqu'à ×4.
  - Bot : partie médiane inchangée (bedrock dans la cible), ascenseur construit vers -20/-50 m, et il reste moins d'argent en fin de partie.

## 5. Feuille de route

1. ✅ Données, mine, mineur, bot de simulation, UI, sauvegarde, fin de partie (victoire, prestige, succès).
2. **Brancher Vercel** (décision A/B ci-dessus).
2 bis. ✅ **Leaderboard** (19/10) : prestige et argent gagné au total. Idées : classement par temps jusqu'à la bedrock, voir son rang même hors du top 20, retirer un tricheur à la main dans Supabase (Table Editor → classement).
3. **Polish** : ✅ sons et animations (19/10). Reste : meilleure ambiance par zone, éventuellement des sprites.
4. Ajuster l'équilibrage après de vraies parties (le bot donne environ 19 min jusqu'à la bedrock).
5. Idées en attente : améliorations des pioches au forgeron, couches dures, étais de mine, de vrais mineurs automatiques pour un jeu qui avance hors ligne (proposé le 18/10, pas encore décidé).

## 6. Décisions de design (héritées de la v1)

- ❌ Pas de creepers, pas de prix du marché variables, pas de mineurs automatiques, pas de quêtes du marchand.
  - Exception (16/10) : la foreuse du prestige 1, qui creuse seule tant qu'on lui donne du charbon.
  - L'assistant Emmanuel Macron (ajouté le 18/10) a été retiré le 19/10.
- ✅ Le joueur n'est jamais bloqué : pioches rachetables, minage à mains nues, galeries horizontales.
- 🆕 Nouveau par rapport à la v1 : la sauvegarde. Elle avait été refusée dans le notebook, mais elle devient indispensable sur le web.

## 7. Journal

- **2026-10-15** : choix de la stack, installation des outils sur le Mac, création du squelette et du dépôt GitHub privé. Ajout du collaborateur `N04H2004`.
- **2026-10-16** : ajout de ce fichier `CONTEXTE.md` au dépôt.
- **2026-10-16** : première version complète du jeu (logique, bot d'équilibrage, interface React, sauvegarde).
- **2026-10-16** : surface avec stands, échelle, déplacements au clavier, « Vendre tout » avec objets à décocher, ascenseur à redstone, personnage taupe en SVG.
- **2026-10-16** : mine à -128 m, vue unique qui défile avec l'échelle sur toute la hauteur, ascenseur à niveaux (fer + redstone) utilisable dans la mine, icônes pixel art au village, foreuse au prestige 1.
- **2026-10-16** : barre de boutons à positions fixes, suppression des torches (lumière naturelle).
- **2026-10-18** : assistant Emmanuel Macron (2 000 $), horloge unique pour le minage (corrige le minage bloqué pendant les voyages de l'ascenseur). Sauvegarde v4.
- **2026-10-18** : on continue de creuser à la bedrock, plus de charbon/fer près de la surface, ascenseur qui emmène le mineur (avec choix des minerais et quai), prestige +15 % ventes / +10 % vitesse, village large où l'on se promène, couches de 10 blocs, donjons avec zombie et épée, foreuse visible en action. Sauvegarde v5.
- **2026-10-19** : retrait des donjons, de l'épée et de l'assistant Emmanuel Macron. Village resserré (stands tous les 3 pas). Arbre de prestige (12 talents). Sons Web Audio et animations (éclats, minerais rares, ventes). Sauvegarde v6.
- **2026-10-19** : envoi par l'ascenseur depuis le sac (objets à cocher, envoi auto en option), module d'ascenseur simplifié et replié, inventaire à cocher et recharge automatique de la foreuse, couleurs de boutons par action, animation de trouvaille pour tous les minerais, musique et ambiances (surface / grotte). Sauvegarde v7.
- **2026-10-19** : sacs de 512, 1 024 et 2 048 places au Bazar. La caméra suit enfin le mineur dans l'ascenseur (descente depuis le village).
- **2026-10-19** : économie basée sur l'argent (ascenseur, foreuse et enchantements coûtent surtout de l'argent, peu de minerais), ascenseur à 6 niveaux, foreuse avec un niveau de plus en forage et en chariot.
- **2026-10-19** : barre d'actions à 4 boutons (plus de flèches), le mineur marche jusqu'au puits avant de monter, « Front » et « Puits » renommés « Mine » (nouvelle entrée de mine), succès dans une fenêtre, minuteur de l'ascenseur, ascenseur constructible au village, notifications en bas à droite. Sauvegarde v8.
- **2026-10-19** : alerte visuelle sur la case Sac quand le sac est plein, notifications plus visibles (colonne de droite).
- **2026-10-19** : écran d'accueil (but du jeu + coupe de la mine) et jusqu'à 5 mondes (créer, jouer, renommer, dupliquer, supprimer). Plus de menu de navigation au village, plus de minage au clavier.
- **2026-10-19** : jauges pour vendre ou envoyer une partie seulement (marché et ascenseur), « x2 » retiré de la case Pioche, minerais qui apparaissent petit à petit. Sauvegarde v9.
- **2026-10-19** : ascenseur gardé au prestige, mineurs employés (prestige 2), plusieurs foreuses (prestige 3), arbre à 4 branches (Patron), boutons Envoyer / Remonter avec l'ascenseur (plus de pop-in), creusage Auto qui s'arrête si la pioche casse, trajets fluides. Sauvegarde v10.
- **2026-10-19** : l'interface tient dans la hauteur de l'écran sur ordinateur (mine extensible, panneau qui défile seul, jauges compactes).
- **2026-10-19** : nouveau dessin de l'ascenseur : cage en métal (toit, grille, plancher rayé jaune et noir, lampe qui clignote en route), caisse de minerai quand elle est chargée, puits plus large avec glissières et traverses, poulie qui tourne et câble.
- **2026-10-19** : comptes facultatifs (pseudo + mot de passe, sans email) et sauvegarde en ligne de tous les mondes sur Supabase. Prépare le leaderboard.
- **2026-10-19** : classement (leaderboard) au prestige et à l'argent gagné au total, sur l'accueil. Argent gagné gardé au prestige (`argentGagneAvant`). Sauvegarde v11.
- **2026-10-19** : au prestige, la foreuse ne garde que ses améliorations (charbon, chariot et profondeur remis à zéro) et les mineurs repartent de la surface. Les mineurs employés sont visibles dans leur galerie.
- **2026-10-19** : Fortune affaiblie (20 % / 40 % / 60 % de doubler un minerai). Bouton « Tout sélectionner » au marché, à l'ascenseur et au chariot de la foreuse. Mineurs employés : trajets d'au moins 5 s et 4 s de vente au marché, indicateur de ce qu'ils font (dans la mine et au bureau), sac plus grand à chaque amélioration.
- **2026-10-19** : plafonds d'amélioration par prestige (ascenseur, foreuse, mineurs), lignes d'achat homogènes avec carrés de niveaux, indicateur $/s, mineur qui se retourne selon le sens de minage, effets (compteur qui défile, série de minerais, fanfare d'amélioration, secousse des minerais rares).
- **2026-10-19** : foreuses séparées (une foreuse achetée part de zéro, depuis la surface, et s'améliore à part), ascenseur des mineurs employés (une cabine chacun, qu'on voit monter et descendre). Sauvegarde v12.
- **2026-10-19** : style cartoon moins cubique (cailloux arrondis, échoppes à festons, arbres ronds, icônes émojis), nouvelle foreuse (machine orange + mèche en spirale, tour de forage au village), « Roche dure » au lieu de « Deepslate », version du build sur l'accueil.
