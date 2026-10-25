# ⭐ Le niveau du joueur et les paliers

> Le joueur a un **niveau** (de 1 à **15**) : en jouant, il gagne de l'**XP** (des points d'expérience). Depuis la grande mise à jour du 25/10, le niveau du joueur ne débloque plus que **les rails** et **les niveaux de la mine** ; tout le reste suit les **paliers** : descendre la mine au niveau N permet d'améliorer **toutes** les autres choses jusqu'à leur niveau N. Et **chaque niveau gagné rapporte 1 gemme** (25/10 : 3 avant).
> Écrit d'après le code au 25/10 : la logique est dans `src/jeu/niveaux.ts`, les chiffres à la fin de `src/jeu/donnees.ts` (`XP_PAR`, `VALEUR_PAR_XP`, `BLOCS_PAR_XP`, `xpPourPasser`, `NIVEAU_JOUEUR_MAX`, `NIVEAU_JOUEUR_POUR`, `NIVEAUX_PAR_AMELIORATION`, `PALIER_CHEF`) et `GEMMES_PAR_NIVEAU` dans `src/jeu/gemmes.ts`. Le niveau du joueur n'est pas le **niveau de la mine** (1 à 5, qu'on achète au panneau de la mine) : voir [mine-et-minage.md](mine-et-minage.md).

Pourquoi deux systèmes ? Le niveau du joueur récompense **tout ce qu'on fait** et rythme la descente de la mine. Les paliers (25/10) rangent les améliorations : avant, chacune avait son propre niveau du joueur (jusqu'à 10 niveaux pour l'ascenseur), et le joueur ne savait plus quoi acheter. Maintenant, la règle tient en une phrase : **on améliore un niveau de chaque chose, puis on descend la mine.**

---

## 1. Gagner de l'XP

Presque tout ce qu'on fait rapporte de l'XP (`XP_PAR`) :

| Ce qu'on fait | XP |
|---|---:|
| ⛏️ Casser des blocs **en cliquant** (pas la mine toute seule, ni les mineurs, ni la foreuse) | 1 pour 3 blocs (`BLOCS_PAR_XP`) |
| 🏗️ Poser un bâtiment | 70 |
| 🛤️ Poser une case de rails | 3 |
| 🚃 Créer un trajet de wagonnet | 30 |
| 👷 Embaucher un employé (mineur ou pousseur) | 40 |
| ⬆️ Acheter un niveau d'amélioration (coffre, pioche, ascenseur, forage, chariot de la foreuse, générateur, pioche d'un mineur, vitesse et chariot d'un pousseur, recruteur, manager) | 30 |
| ⬇️ Descendre la mine d'un niveau | 150 |
| 💰 **Tout ce qu'on achète, selon son prix** (`valeurInvestie`) : bâtiments, niveaux de la mine, améliorations, pioches des employés, chefs. Le prix compte l'argent et les minerais à leur prix au marché. En plus des lignes ci-dessus | 1 par 25 $ (`VALEUR_PAR_XP`) |

- **Rester AFK ne rapporte pas d'XP** : ni les voyages des wagonnets, ni l'argent gagné. Il faut acheter (ou cliquer) pour avancer.
- **Un achat payé en gemmes** rapporte la même XP que payé en argent (c'est ce qu'on possède qui compte).
- Mesuré avec le bot (qui clique 2 fois par seconde) : niveau 3 vers 30 s, niveau 5 vers 15 min, niveau 7 vers 42 min, niveau 9 vers 1 h 39, niveau 10 vers 1 h 47, niveau 12 vers 3 h 33 ; il finit au niveau 14 quand il descend la mine au niveau 5 (vers 4 h). Le niveau du joueur n'a **jamais bloqué** le bot : c'est l'argent qui décide du rythme.

### Une chose ne rapporte qu'une fois

Le jeu ne donne pas l'XP au moment de l'action : il regarde des **compteurs** de la partie (blocs cassés, bâtiments posés, cases de rails, trajets, employés, total des niveaux d'amélioration, niveau de la mine, valeur investie) et garde **le plus haut chiffre déjà vu** de chacun (`etat.recordsXp`). Quand un compteur dépasse son record, la différence rapporte de l'XP (`mettreAJourXp`, appelée par `avancerTemps` à chaque tic).

Ainsi :

- **retirer un rail puis le reposer**, ou **licencier puis réembaucher**, ne redonne rien (il faut dépasser son record) ;
- il n'y a rien à ajouter dans chaque action du jeu : une nouvelle façon de gagner de l'XP = un nouveau compteur dans `compteurs` (`niveaux.ts`) et une valeur dans `XP_PAR`.

Au début de la partie, les records sont ce qu'on a déjà (la mine posée, au niveau 1 : `recordsDeDepart`).

## 2. La courbe d'XP

Il faut de plus en plus d'XP pour passer un niveau : `xpPourPasser(n) = 60 × n^1,8`, arrondi à la dizaine. Le niveau se calcule à partir de l'XP totale (`niveauDeXp`). Le **niveau maximum** est **15** (`NIVEAU_JOUEUR_MAX`, 25/10 ; avant 30, mais plus rien ne se débloquait après le 15).

| Niveau | XP pour passer au suivant | XP totale pour y arriver | Ce qu'il débloque |
|---:|---:|---:|---|
| 1 | 60 | 0 | tout le départ (voir plus bas) |
| 2 | 210 | 60 | 🛤️ **les rails et les wagonnets** |
| 3 | 430 | 270 | ⛏️ **Mine niveau 2** (Veine de redstone) |
| 4 | 730 | 700 | — |
| 5 | 1 090 | 1 430 | ⛏️ **Mine niveau 3** (Filon d'or) |
| 6 | 1 510 | 2 520 | — |
| 7 | 1 990 | 4 030 | ⛏️ **Mine niveau 4** (Grotte aux émeraudes) |
| 8 | 2 530 | 6 020 | — |
| 9 | 3 130 | 8 550 | ⛏️ **Mine niveau 5** (Cœur de diamant) |
| 10 | 3 790 | 11 680 | — |
| 11 | 4 490 | 15 470 | — |
| 12 | 5 260 | 19 960 | — |
| 13 | 6 070 | 25 220 | — |
| 14 | 6 940 | 31 290 | — |
| 15 | — (maximum) | 38 230 | — |

**Chaque niveau gagné rapporte 1 gemme** 💎 (`GEMMES_PAR_NIVEAU`), même ceux qui ne débloquent rien : 14 gemmes du niveau 2 au niveau 15. (25/10, demandé par le propriétaire : 3 avant, le joueur avait trop de gemmes pour avoir envie de regarder des publicités.) Voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md).

`NIVEAU_JOUEUR_POUR` (`donnees.ts`) :

| Chose | Niveau du joueur |
|---|---|
| Bâtiments | tous au niveau 1 (la foreuse et le générateur demandent aussi la **mine niveau 2**) |
| Rails (et donc les trajets) | 2 |
| Mine (niveaux 1 à 5) | 1, 3, 5, 7, 9 |

Une fois débloqué, il faut quand même **payer** (en argent et minerais, ou en gemmes).

## 3. Les paliers de la mine

`NIVEAUX_PAR_AMELIORATION = 5` : **toutes les améliorations ont 5 niveaux**, comme la mine. Le niveau N d'une amélioration demande la **mine au niveau N** (`palierRequis(chose, index) = index + 1`, `debloque`). Le niveau 1 est celui du départ (ou l'embauche).

| Palier (mine) | Ce qui peut monter au même niveau |
|---:|---|
| 1 | le départ : coffre de 100, pioche en pierre, ascenseur 1, mineurs en pioche de bois, pousseurs débutants avec un chariot de 20 places |
| 2 | 📦 coffre de 300 · ⛏️ pioche en fer · 🛗 ascenseur 2 · 👷 pioche en fer des mineurs · 🛤️ pousseur « Costaud » et chariot de 40 · ⚙️ foreuse (forage 1 bloc/s, chariot de 50) · ⚡ générateur rayon 16 |
| 3 | 📦 coffre de 800 · pioche en or · ascenseur 3 · mineurs en or · pousseur « Robuste », chariot de 70 · forage 1,6, chariot de 90 · générateur rayon 20 · 💼 **embauche du manager** |
| 4 | 📦 coffre de 2 000 · pioche en émeraude · ascenseur 4 · mineurs en émeraude · pousseur « Expert », chariot de 110 · forage 2,4, chariot de 140 · générateur rayon 25 · 🎩 **embauche du recruteur** · 💼 manager niveau 2 |
| 5 | 📦 coffre de 5 000 · pioche en diamant · ascenseur 5 · mineurs en diamant · pousseur « Champion », chariot de 170 · forage 3,4, chariot de 200 · générateur rayon 30 · 🎩 recruteur niveaux 2 et 3 · 💼 manager niveau 3 |

**Les chefs** (manager et recruteur) ont **3 niveaux** chacun (`PALIER_CHEF`) : le manager s'embauche au palier 3, puis monte aux paliers 4 et 5 ; le recruteur s'embauche au palier 4, puis ses niveaux 2 et 3 demandent le palier 5.

Une amélioration sous cadenas affiche **« 🕳️ Mine *N* »** (le palier qu'il faut, `verrou`) à la place de son bouton ; le prochain niveau de la mine affiche **« ⭐ *N* »** (le niveau du joueur qu'il faut, `verrouNiveau`). Une chose sous cadenas ne fait ni bulle ni mission d'amélioration.

Les règles qui vérifient ces cadenas : `debloque(etat, chose, index)`, `palierRequis`, `niveauRequis` et `niveauAtteint`, appelées par chaque achat (`peutDescendre`, `agrandirCoffre`, `ameliorerAscenseur`, `peutAcheterPioche`, `peutAmeliorerEmploye`…), par `batimentDebloque` (`batiments.ts`), par la pose des rails (`peutPoserSol`, `railsDebloques`) et par la liste des achats possibles (`objectifs.ts`).

## 4. Où on le voit

- **Le bandeau en haut à gauche** (`Hud.tsx`) : une **⭐** avec le niveau, et une petite jauge d'XP (« 120/430 », « Max » au niveau 15).
- **Le passage de niveau** (`FeteNiveau.tsx`) : une grande fenêtre « Niveau supérieur ! » (le chiffre qui monte, des confettis, une fanfare), ce qu'on débloque ligne par ligne (`deblocagesDuNiveau` : les rails, un niveau de la mine), et le **+1 💎**. La fête **attend** qu'aucune fenêtre ne soit ouverte (elle ne ferme plus le panneau en cours). Le message du niveau commence toujours par « 🎉 » (« 🎉 Niveau 3 ! +1 💎 Débloqué : ⛏️ Mine niveau 2 : Veine de redstone. ») : l'interface le reconnaît ainsi, dans les deux langues.
- **Les missions** (en haut à droite, `missions.ts`) : une mission « ⭐ Niveau *N* : … » montre le prochain niveau qui débloque quelque chose (`prochainDeblocage`) et la jauge d'XP vers le niveau suivant. Si ce niveau est plus loin que le suivant : « Niveau 9 (tu es 7) : … ».

(L'écran a été refait le 25/10 : voir [interface.md](interface.md).)

## 5. Sauvegarde et anciennes parties

- L'état garde `xp` (l'XP totale gagnée) et `recordsXp` (le plus haut chiffre de chaque compteur). Le niveau n'est pas rangé : il se recalcule à partir de l'XP (au plus 15).
- Une partie de la **version 23** (d'avant les niveaux) reçoit **l'XP du niveau qu'il faut pour tout ce qu'elle possède déjà** (`niveauPourCeQuOnA`, `donnerXpAVieillePartie` : ses bâtiments, ses rails, son niveau de mine).
- Une partie de la **version 28** (d'avant le 25/10) garde son XP, mais ses **records repartent de ce qu'elle a** (`recordsDeDepart`) : les prix ont changé, seul ce qu'elle fera ensuite rapporte de l'XP. Ses améliorations sont ramenées à 5 niveaux (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md)). Un joueur qui était au-delà du niveau 15 est affiché au niveau 15.
- Pour les tests, `partieDeTest(aleatoire)` (`src/jeu/partieDeTest.ts`) crée une partie déjà au niveau maximum, pour tester une règle sans le cadenas du niveau du joueur ; les cadenas eux-mêmes sont testés dans `niveaux.test.ts`.
