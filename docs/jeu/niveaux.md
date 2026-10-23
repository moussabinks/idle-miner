# ⭐ Le niveau du joueur

> Depuis le 29/10, le joueur a un **niveau** (de 1 à 30) : en jouant, il gagne de l'**XP** (des points d'expérience), et chaque niveau **débloque** de nouveaux bâtiments, les rails et de nouveaux niveaux d'amélioration. Une fois débloqué, il faut **quand même payer**.
> Écrit d'après le code au 29/10 (déblocages revus le 30/10 : la foreuse avant le générateur, l'ascenseur dès le début) : la logique est dans `src/jeu/niveaux.ts`, les chiffres à la fin de `src/jeu/donnees.ts` (`XP_PAR`, `xpPourPasser`, `NIVEAU_JOUEUR_MAX`, `NIVEAU_JOUEUR_POUR`). Le niveau du joueur n'a rien à voir avec le **niveau de la mine** (1 à 5, qu'on achète au panneau de la mine) : voir [mine-et-minage.md](mine-et-minage.md).

Pourquoi ? Le jeu allait trop vite, et le joueur voyait tout d'un coup (29/10). Avec les niveaux, les choses arrivent une à une, et chaque niveau gagné est une petite fête. Les prix ont aussi été augmentés le même jour (voir [equilibrage.md](equilibrage.md)).

---

## 1. Gagner de l'XP

Presque tout ce qu'on fait rapporte de l'XP (`XP_PAR`) :

| Ce qu'on fait | XP |
|---|---:|
| ⛏️ Casser un bloc **en cliquant** (pas la mine toute seule, ni les mineurs, ni la foreuse) | 1 |
| 🏗️ Poser un bâtiment | 40 |
| 🛤️ Poser une case de rails | 3 |
| 🚃 Créer un trajet de wagonnet | 30 |
| 👷 Embaucher un employé (mineur ou pousseur) | 25 |
| ⬆️ Acheter un niveau d'amélioration (coffre, pioche, sac, ascenseur, taille des wagonnets, forage, chariot, générateur, recruteur, manager, pioche d'un mineur) | 30 |
| ⬇️ Descendre la mine d'un niveau | 150 |
| 🔁 Un aller-retour de wagonnet (un peu d'XP pendant qu'on ne clique pas) | 3 |

### Une chose ne rapporte qu'une fois

Le jeu ne donne pas l'XP au moment de l'action : il regarde des **compteurs** de la partie (blocs cassés, bâtiments posés, cases de rails, trajets, employés, total des niveaux d'amélioration, niveau de la mine, voyages de wagonnet) et garde **le plus haut chiffre déjà vu** de chacun (`etat.recordsXp`). Quand un compteur dépasse son record, la différence rapporte de l'XP (`mettreAJourXp`, appelée par `avancerTemps` à chaque tic).

Ainsi :

- **retirer un rail puis le reposer**, ou **licencier puis réembaucher**, ne redonne rien (il faut dépasser son record) ;
- il n'y a rien à ajouter dans chaque action du jeu : une nouvelle façon de gagner de l'XP = un nouveau compteur dans `compteurs` (`niveaux.ts`) et une valeur dans `XP_PAR`.

Au début de la partie, les records sont ce qu'on a déjà (la mine posée, au niveau 1 : `recordsDeDepart`).

## 2. La courbe d'XP

Il faut de plus en plus d'XP pour passer un niveau : `xpPourPasser(n) = 60 × n^1,8`, arrondi à la dizaine. Le niveau se calcule à partir de l'XP totale (`niveauDeXp`). Le **niveau maximum** est **30** (`NIVEAU_JOUEUR_MAX`).

| Niveau | XP pour passer au suivant | XP totale pour y arriver |
|---:|---:|---:|
| 1 | 60 | 0 |
| 2 | 210 | 60 |
| 3 | 430 | 270 |
| 4 | 730 | 700 |
| 5 | 1 090 | 1 430 |
| 6 | 1 510 | 2 520 |
| 7 | 1 990 | 4 030 |
| 8 | 2 530 | 6 020 |
| 9 | 3 130 | 8 550 |
| 10 | 3 790 | 11 680 |
| 11 | 4 490 | 15 470 |
| 12 | 5 260 | 19 960 |
| 13 | 6 070 | 25 220 |
| 14 | 6 940 | 31 290 |
| 15 | 7 850 | 38 230 |
| 20 | 13 180 | 87 670 |
| 30 | — (maximum) | 279 500 |

Pour se faire une idée : le premier niveau, ce sont 60 blocs cliqués (ou le marché et 20 blocs). Le bot de simulation arrive au **niveau 5 après au moins 8 minutes** et au **niveau 10 après au moins 1 heure** (médianes, vérifié par `bot.test.ts`, voir [equilibrage.md](equilibrage.md#le-bot-de-simulation)).

## 3. Ce que débloque chaque niveau

`NIVEAU_JOUEUR_POUR` donne le niveau qu'il faut pour chaque chose. Pour les améliorations, c'est un tableau qui suit celui des données : la case *i* est le niveau qu'il faut pour acheter le niveau *i* (la case 0 est ce qu'on a au départ). Certaines choses demandent **aussi** un niveau de la mine : la foreuse et le générateur (mine niveau 2), le manager (mine niveau 3), le recruteur (mine niveau 4 ; inversés le 23/10). Comme descendre la mine demande lui-même un niveau du joueur, ces deux conditions vont ensemble.

| Niveau | Ce qui se débloque |
|---:|---|
| 1 | 💰 Marché, ⚒️ Forgeron ; tout ce qu'on a au départ (pioche en pierre, sac de 32, coffre de 100, 🛗 ascenseur niveau 1 dans la mine depuis le 30/10, wagonnets de 40…) |
| 2 | 👷 **Personnel** ; 📦 coffre de 250 places |
| 3 | 🎒 **Bazar** ; 🛤️ **les rails et les wagonnets** ; 🎒 sac de 64 places |
| 4 | ⛏️ **Mine niveau 2** (Veine de redstone) ; ⛏️ pioche en fer ; 👷 pioche en pierre pour les mineurs |
| 5 | ⚙️ **Foreuse** (30/10 : avant le générateur) ; 📦 coffre de 600 places ; 🎒 sac de 128 places ; 🛗 ascenseur niveau 2 |
| 6 | ⚡ **Générateur** ; 👷 pioche en fer pour les mineurs ; 🚃 wagonnets de 100 places ; ⚙️ forage 0,8 bloc/s ; 🛒 chariot de 400 places |
| 7 | ⛏️ **Mine niveau 3** (Filon d'or) ; ⛏️ pioche en or |
| 8 | 📦 coffre de 1 500 places ; 🎒 sac de 256 places ; 🛗 ascenseur niveau 3 ; ⚡ générateur rayon 20 |
| 9 | 💼 **le manager** ; 👷 pioche en or pour les mineurs ; 🚃 wagonnets de 250 places ; ⚙️ forage 1,2 ; 🛒 chariot de 800 |
| 10 | ⛏️ **Mine niveau 4** (Grotte aux émeraudes) ; 🛗 ascenseur niveau 4 ; ⚡ générateur rayon 26 |
| 11 | 🎩 **le recruteur** ; 🎒 sac de 512 places ; ⚙️ forage 1,8 ; 🛒 chariot de 1 600 ; 💼 manager 1 h hors ligne |
| 12 | 🎩 recruteur niveau 2 ; 💼 manager 2 h hors ligne ; 📦 coffre de 4 000 places ; ⛏️ pioche en diamant ; 👷 pioche en diamant pour les mineurs ; 🚃 wagonnets de 600 places |
| 13 | ⛏️ **Mine niveau 5** (Cœur de diamant) ; 🛗 ascenseur niveau 5 ; ⚡ générateur rayon 33 ; 🎩 recruteur niveau 3 ; 💼 manager 4 h hors ligne |
| 14 | 💼 manager 8 h hors ligne ; 🎒 sac de 1 024 places ; ⚙️ forage 2,6 ; 🛒 chariot de 3 000 |
| 15 | 🎒 sac de 2 048 places ; 🛗 ascenseur niveau 6 ; ⚡ générateur rayon 40 ; ⚙️ forage 3,6 ; 🛒 chariot de 6 000 ; 🎩 recruteur niveau 4 |
| 16 à 30 | rien de nouveau pour l'instant : tout est débloqué au niveau 15 |

Le même tableau, rangé par chose (`NIVEAU_JOUEUR_POUR` dans `donnees.ts`) :

| Chose | Niveau du joueur pour chaque niveau |
|---|---|
| Bâtiments | Marché 1, Forgeron 1, Personnel 2, Bazar 3, Foreuse 5, Générateur 6 (30/10 ; avant, Générateur 5 et Foreuse 6 ; la mine est posée d'office) |
| Rails (et donc les trajets) | 3 |
| Mine (niveaux 2 à 5) | 4, 7, 10, 13 |
| Coffre (250 → 4 000) | 2, 5, 8, 12 |
| Pioches (fer, or, diamant) | 4, 7, 12 |
| Sacs (64 → 2 048) | 3, 5, 8, 11, 14, 15 |
| Ascenseur (niveaux 2 à 6) | 5, 8, 10, 13, 15 (le niveau 1 est dans la mine dès le début, 30/10) |
| Pioche des mineurs (pierre, fer, or, diamant) | 4, 6, 9, 12 |
| Taille des wagonnets (100, 250, 600) | 6, 9, 12 |
| Générateur (rayon 20 → 40) | 8, 10, 13, 15 |
| Forage de la foreuse (0,8 → 3,6) | 6, 9, 11, 14, 15 |
| Chariot de la foreuse (400 → 6 000) | 6, 9, 11, 14, 15 |
| Recruteur (niveaux 1 à 4) | 11, 12, 13, 15 (23/10 ; avant : 9, 11, 13, 15) |
| Manager | 9 (23/10 ; avant : 11), puis son temps hors ligne : 11, 12, 13, 14 |

Les règles qui vérifient ces cadenas : `debloque(etat, chose, index)` et `niveauAtteint`, appelées par chaque achat (`prochainNiveauMine`, `prochainNiveauCoffre`, `peutAcheterPioche`…), par `batimentDebloque` (`batiments.ts`), par la pose des rails (`peutPoserSol`, `railsDebloques`) et par la liste des achats possibles (`objectifs.ts`) : une chose sous cadenas ne fait ni bulle ni mission d'amélioration.

## 4. Où on le voit

- **Le bandeau en haut à gauche** (`Hud.tsx`) : une **⭐** avec le niveau dans un badge violet (qui saute quand on gagne un niveau), et une petite **jauge violette** d'XP (« 120/430 », « Max » au niveau 30). La bulle d'aide dit combien d'XP il manque et ce que débloque le prochain niveau qui apporte quelque chose.
- **Les cadenas** : dans les panneaux, une amélioration pas encore débloquée affiche « 🔒 … · au niveau N » (`verrou`) au lieu de son bouton ; dans le menu 🏗️ Bâtiments, la carte d'un bâtiment affiche « 🔒 Niveau N » (ou « 🔒 Mine niveau 2 » si c'est la mine qui manque), et la carte des rails « 🔒 Niveau 3 ».
- **Le passage de niveau** (23/10, `FeteNiveau.tsx`) : une **grande fenêtre** surgit en rebondissant : « Niveau supérieur ! », une grosse **⭐** tombe avec l'ancien niveau, le **chiffre monte** jusqu'au nouveau (un « tic » par niveau gagné, `sons.ticNiveau`), puis des **rayons** tournent derrière et des **confettis** éclatent avec une fanfare (`sons.niveauGagne`). Ensuite, **tout ce qu'on débloque** arrive ligne par ligne, chacun avec son **icône** qui rebondit, un badge « Nouveau ! » et un petit « ding » qui monte (`sons.ligneDeblocage`) : bâtiments, niveaux de la mine, pioches, sacs, ascenseur, pousseurs… (`deblocagesDuNiveau`, tous les niveaux gagnés d'un coup). En bas : ce qui attend au prochain niveau, et **🎉 Génial !**. (Avant le 23/10 : une simple notification dorée.)
- **Toute l'attention sur la fête** (23/10) : passer un niveau **ferme tout ce qui est ouvert** (le panneau du bâtiment, le menu Bâtiments, l'aide, les réglages, les succès, les statistiques, le bilan, la fenêtre des trajets), et la fenêtre **ne se ferme pas pendant 1 seconde** : le bouton « 🎉 Génial ! » est grisé et se remplit d'une barre blanche, les clics à côté ne font rien. Avant, un joueur qui cliquait vite sur la mine la fermait sans la voir.
- **Les missions** (en haut à droite, `missions.ts`) : une mission « ⭐ Niveau N : … » montre le prochain niveau qui débloque quelque chose (deux choses au plus, puis « ... ») et la jauge d'XP vers le niveau suivant. Si ce niveau est plus loin que le suivant, elle le dit : « Niveau 9 (tu es 7) : … ».
- **Le tutoriel** se termine en expliquant les niveaux (« ⭐ Tout ce que tu fais rapporte de l'XP… », « 🔓 Chaque niveau débloque des bâtiments et des améliorations »).

Les nouvelles icônes ⭐ / 🌟 (le niveau) et 🎉 (le passage de niveau) sont dessinées dans `outils/icones/dessins.py`.

## 5. Sauvegarde et anciennes parties

- L'état garde deux champs (depuis la version de sauvegarde **24** ; la version actuelle est la **25**, voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md)) : `xp` (l'XP totale gagnée) et `recordsXp` (le plus haut chiffre de chaque compteur). Le niveau n'est pas rangé : il se recalcule à partir de l'XP.
- Une partie de la **version 23** (d'avant les niveaux) est convertie au chargement (`convertirVersion23` dans `sauvegarde.ts`) : elle reçoit **l'XP du niveau qu'il faut pour tout ce qu'elle possède déjà** (`niveauPourCeQuOnA`, `donnerXpAVieillePartie` : ses bâtiments, ses rails, son niveau de mine, ses améliorations, son recruteur, son manager…), et ses records partent de ce qu'elle a. Rien de ce qu'elle a n'est donc « trop en avance », et la suite se gagne en jouant.
- Pour les tests, `partieDeTest(aleatoire)` (`src/jeu/partieDeTest.ts`) crée une partie déjà au niveau 30, pour tester une règle sans les cadenas ; les cadenas eux-mêmes sont testés dans `niveaux.test.ts`.
