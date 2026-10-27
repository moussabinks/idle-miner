# Équilibrage : toutes les données et les formules

> Toutes les tables chiffrées du jeu et les formules, réunies au même endroit, d'après le code au **25/10 (la grande mise à jour)**, mis à jour le **26/10 (la grosse mise à jour des gemmes)** : `src/jeu/donnees.ts`, `mine.ts`, `mineur.ts`, `employes.ts`, `wagonnet.ts`, `generateur.ts`, `foreuse.ts`, `ateliers.ts`, `gemmes.ts`, `niveaux.ts`, `village.ts`, `batiments.ts`, `revenu.ts`, `absence.ts`, `bot.ts`, `bot.test.ts`.
> Ce qui a changé le 25/10 : plus de sac ni de bazar (le coffre se vend depuis la mine), la mine sort des blocs dès le niveau 1, un début bien moins cher (80 $ au départ, premier mineur à 50 $), **tout a 5 niveaux** et le niveau N de chaque chose demande la mine au niveau N (les **paliers**), le niveau du joueur plafonné à 15, une clairière de 40 × 40, et les **gemmes**. Tous les prix ont été revus.
> (25/10, demandé par le propriétaire) Économie revue : les paliers 3 à 5 coûtent 2 à 4 fois moins cher, les embauches aussi, pour moins attendre et moins cliquer.
> (26/10, la grosse mise à jour des gemmes) La mine a **7 niveaux** : 1 à 4 sans changement, **5 = Caverne de saphir**, **6 = Veine de rubis**, **7 = Cœur de diamant** (le diamant descend du niveau 5 au niveau 7). **Toutes les améliorations ont 7 niveaux** ; les chefs gardent 3 niveaux, mais le dernier arrive au palier 6. Deux nouveaux bâtiments, la **fonderie** (lingots) et la **joaillerie** (bijoux), un nouveau métier (le **joaillier**) et 6 trajets de wagonnets de plus.
> Pour le fonctionnement de chaque bâtiment, voir les fiches de [../batiments/](../batiments/README.md). Pour le concept et la progression en un coup d'œil, voir [vue-d-ensemble.md](vue-d-ensemble.md).

Conventions : « bloc/s » = blocs par seconde ; les distances au village sont en **cases** de la grille. Les niveaux affichés commencent à 1 ; dans le code, la plupart sont des index qui commencent à 0 (coffre, générateur, forage, chariot, pioches). La colonne **« Palier »** donne le niveau de la mine qu'il faut (`palierRequis` : le niveau N demande la mine au niveau N). Tout achat peut aussi se payer en **gemmes** (voir [Les gemmes](#les-gemmes)).


> **(26/10) La hausse de la fin de partie** (demandée par le propriétaire, `HAUSSE_PAR_PALIER` à la fin de `donnees.ts`) : tout ce qui demande le **palier 5, 6 ou 7** de la mine (descendre la mine, coffre, ascenseur, pioches, pioches des mineurs, pousseurs et leurs chariots, générateur, foreuse, fonderie, joaillerie, manager, recruteur) coûte **× 2 au palier 5, × 2,5 au palier 6, × 3 au palier 7**, en argent et en minerais (arrondi à 2 chiffres). À ce moment-là, le joueur a eu le temps de tenter sa chance au recruteur : ses mineurs rares le feraient finir trop vite. (26/10) Et **jamais plus de 1 000 d'un même matériau** dans un prix (`MATERIAUX_MAX`), après la hausse : par exemple le générateur 6 demande 1 000 fer + 1 000 redstone, le 7e 1 000 redstone + 120 saphir. **(26/10) Les tableaux de cette page donnent les vrais prix du jeu, hausse et plafond de 1 000 minerais compris** (sortis de `donnees.ts` ; les bâtiments à poser, les embauches et les salaires ne sont pas touchés). Bot (qui ne tente pas sa chance au recruteur, et qui améliore maintenant l'ascenseur quand il bloque ses mineurs) : mine 5 en ~1 h 50, 6 en ~3 h 25, 7 en ~5 h 55 (avant la hausse : 1 h 40, 2 h 57, 5 h 08) ; repère du test : niveau 7 en 4 h à 9 h.
## Sommaire

1. [Constantes générales](#constantes-générales)
2. [Les blocs](#les-blocs)
3. [Les niveaux de la mine](#les-niveaux-de-la-mine)
4. [Le coffre et la vente](#le-coffre-et-la-vente)
5. [Les pioches et le clic](#les-pioches-et-le-clic)
6. [L'ascenseur des mineurs](#lascenseur-des-mineurs)
7. [Les rails et les wagonnets](#les-rails-et-les-wagonnets)
8. [Le générateur](#le-générateur)
9. [La foreuse](#la-foreuse)
10. [La fonderie et la joaillerie](#la-fonderie-et-la-joaillerie)
11. [Les employés](#les-employés)
12. [Le village : constructions, rails et chemins](#le-village)
13. [Les gemmes](#les-gemmes)
14. [Revenus par seconde](#revenus-par-seconde)
15. [Ce que coûte chaque niveau de la mine](#ce-que-coûte-chaque-niveau-de-la-mine)
16. [Le niveau du joueur](#le-niveau-du-joueur)
17. [Le bot de simulation](#le-bot-de-simulation)
18. [Durées de jeu attendues](#durées-de-jeu-attendues)

---

## Constantes générales

| Constante | Valeur | Rôle |
|---|---|---|
| Argent au départ (`creerPartie`) | 80 $ | de quoi poser le Personnel (40 $) et, avec une première vente, embaucher le premier mineur (50 $) |
| `NIVEAU_MINE_MAX` | 7 | niveaux de la mine (26/10 ; 5 avant) |
| `NIVEAUX_PAR_AMELIORATION` | 7 | niveaux de **toutes** les améliorations (26/10 ; 5 avant ; les chefs : 3, `PALIER_CHEF` ; la fonderie et la joaillerie : 5, `PALIER_FONDERIE`, `PALIER_JOAILLERIE`) |
| `CLICS_MAINS_NUES` | 2 | clics par bloc avec une pioche cassée |
| `SECONDES_ECHELLE` | 10 s | un trajet de mineur sans ascenseur (très vieilles parties seulement) |
| `SECONDES_VIDAGE_EMPLOYE` / `SECONDES_CHARGEMENT_ASCENSEUR` | 2 s / 1 s | (les temps de la caisse de l'ascenseur sont maintenant dans `NIVEAUX_ASCENSEUR`) |
| `SECONDES_PAR_PAIE` | 300 s | une paie d'employé (5 minutes) |
| `SECONDES_PAR_CHARBON` | 20 s | un charbon dans la foreuse |
| `SECONDES_PAR_REDSTONE` | 30 s | une redstone dans le générateur |
| `SECONDES_PAR_CHARBON_FONDERIE` | 12 s | un charbon dans le four de la fonderie (26/10) |
| `SECONDES_PAR_BIJOU` | 10 s | un bijou taillé par un joaillier commun, outils de base (26/10) |
| `SECONDES_CHARGEMENT_WAGONNET` | 1 s | charger un wagonnet au départ, puis le vider à l'arrivée |
| `TAILLE_GRILLE` | 40 | la clairière fait 40 × 40 cases (25/10 ; avant 60 × 60) |
| `PAS_MAX` (`temps.ts`) | 60 s | une longue durée avance par morceaux d'une minute |
| Absence max (`ABSENCE_MAX`, `usePartie.ts`) | 8 h | temps rattrapé au retour |
| `VERSION_ETAT` | 30 | version de la sauvegarde (26/10 ; 29 le 25/10 ; voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md)) |
| `NIVEAU_JOUEUR_MAX` | 15 | le niveau du joueur le plus haut (25/10 ; avant 30) |
| `GEMMES_PAR_NIVEAU` / `GEMMES_PAR_PUB` | 3 / 1 | gemmes par niveau du joueur gagné / par publicité regardée |
| `SECONDES_PUB` | 30 s | la (fausse) publicité |

## Les blocs

`BLOCS` dans `donnees.ts`. « Minerai » = une pioche peut le doubler. (26/10) Chaque objet a une **sorte** (`SorteObjet`) : `bloc` (ce qui sort de la mine), `lingot` (la fonderie) ou `bijou` (la joaillerie).

| Bloc | Prix | Minerai | Rare (`MINERAIS_RARES`) |
|---|---:|:---:|:---:|
| Pierre | 1 $ | non | non |
| Charbon | 5 $ | oui | non |
| Fer | 12 $ | oui | non |
| Redstone | 15 $ | oui | non |
| Or | 35 $ | oui | oui |
| Émeraude | 80 $ | oui | oui |
| Saphir (26/10) | 120 $ | oui | oui |
| Rubis (26/10) | 170 $ | oui | oui |
| Diamant | 240 $ (26/10 ; 100 $ avant) | oui | oui |

Les produits des ateliers (26/10), jamais doublés : un lingot vaut **2 fois** son minerai (`LINGOT_DE`), un bijou **2,5 fois** sa gemme (`BIJOU_DE`).

| Produit | Sorte | Fait avec | Prix |
|---|---|---|---:|
| ⬜ Lingot de fer | lingot | fer | 24 $ |
| 🟨 Lingot d'or | lingot | or | 70 $ |
| 📿 Collier d'émeraude | bijou | émeraude | 200 $ |
| 🧿 Pendentif de saphir | bijou | saphir | 300 $ |
| 🫅 Couronne de rubis | bijou | rubis | 425 $ |
| 💍 Bague de diamant | bijou | diamant | 600 $ |

Les prix ne changent jamais (pas de prix variables). Une vente = la somme des prix, arrondie, × 2 pendant le bonus « Ventes × 2 » (`valeurDe`).

## Les niveaux de la mine

`NIVEAUX_MINE`. Les poids de chaque niveau font 100 : ce sont les chances en %. Un bloc est tiré avec `tirerBloc(niveau, aleatoire)` (`choisirPondere`), pour chaque clic, chaque bloc de la mine toute seule, chaque bloc d'un mineur et chaque bloc de la foreuse.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Saphir | Rubis | Diamant | Débit (bloc/s) | Valeur moyenne d'un bloc |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | — | — | 0,2 | 3,04 $ |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | — | — | 0,3 | 4,58 $ |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | — | — | 0,4 | 7,50 $ |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | — | — | 0,5 | 13,07 $ |
| 5 | Caverne de saphir (26/10) | 40 | 11 | 12 | 12 | 12 | 8 | 5 | — | — | 0,6 | 20,79 $ |
| 6 | Veine de rubis (26/10) | 36 | 10 | 12 | 11 | 12 | 9 | 7 | 5 | — | 0,7 | 31,62 $ |
| 7 | Cœur de diamant (26/10) | 32 | 10 | 11 | 11 | 12 | 9 | 8 | 7 | 5 | 0,8 | 46,37 $ |

(Avant le 26/10, le niveau 5 était le « Cœur de diamant », avec 5 % de diamants à 100 $ : 19,79 $ le bloc.)

- **Valeur moyenne** (`valeurMoyenneBloc(niveau, doublement = 0)`) = Σ chance × prix × (1 + doublement si c'est un minerai). Avec la pioche en diamant (60 %), un clic au niveau 7 vaut en moyenne 46,37 + 0,60 × (46,37 − 0,32) ≈ **74 $**.
- **Débit** : la mine sort toute seule `debit` blocs par seconde dans le coffre, tant qu'il a de la place (`avancerMine`, `debitMine`), **dès le niveau 1** (25/10 ; avant, 0 au niveau 1 puis 0,25 à 0,4). Jamais doublés. × 2 pendant le bonus « Production × 2 ».

| Pour aller au niveau | Prix (`cout`, 26/10, hausse comprise) | Niveau du joueur | Ce qui se débloque |
|---|---|---:|---|
| 2 | 800 $ + 40 fer | 3 | Foreuse, Générateur ; palier 2 ; 2 mineurs |
| 3 | 6 000 $ + 100 fer + 40 redstone | 5 | Manager ; palier 3 ; 3 mineurs |
| 4 | 22 000 $ + 100 redstone + 50 or | 7 | Recruteur ; palier 4 ; 4 mineurs |
| 5 | 160 000 $ + 180 or + 70 émeraude | 9 | le saphir ; **Fonderie** ; palier 5 ; 5 mineurs |
| 6 | 650 000 $ + 200 émeraude + 100 saphir | 11 | le rubis ; **Joaillerie** (et les joailliers) ; palier 6 ; 6 mineurs |
| 7 | 2 400 000 $ + 240 saphir + 150 rubis | 13 | (le dernier niveau : le diamant) ; palier 7 ; 7 mineurs |

Total pour aller au niveau 7 : **3 238 800 $ + 140 fer + 140 redstone + 230 or + 270 émeraude + 340 saphir + 150 rubis** (26/10, hausse comprise ; avant la hausse : 1 168 800 $). Jusqu'au niveau 5 : 188 800 $ + 140 fer + 140 redstone + 230 or + 70 émeraude (avant la hausse : 108 800 $ ; 25/10, économie revue : avant 402 800 $ ; avant le 25/10 : 122 900 $ + 165 fer + 180 redstone + 170 or + 40 émeraude, mais chaque amélioration avait ses propres niveaux du joueur). Chaque niveau donne aussi **1 mineur de plus** au maximum.

## Le coffre et la vente

`NIVEAUX_COFFRE` (25/10 ; prix du 26/10, hausse comprise) :

| Niveau | Places | Prix | Palier |
|---|---:|---|---:|
| 1 | 100 | (départ) | — |
| 2 | 300 | 200 $ + 40 pierre | 2 |
| 3 | 800 | 2 000 $ + 80 fer | 3 |
| 4 | 2 000 | 6 000 $ + 60 redstone + 20 or | 4 |
| 5 | 5 000 | 36 000 $ + 120 or + 40 émeraude | 5 |
| 6 | 10 000 | 130 000 $ + 100 émeraude + 75 saphir | 6 |
| 7 | 20 000 | 450 000 $ + 150 saphir + 90 rubis | 7 |

Total : 624 200 $ + 40 pierre + 80 fer + 60 redstone + 140 or + 140 émeraude + 225 saphir + 90 rubis (26/10 ; jusqu'au niveau 5 : 44 200 $).

- **Plein** : plus de clic, plus de débit, et la caisse de l'ascenseur attend pour se vider.
- **Payer** (`disponible`, `payerMateriaux`) : les minerais d'un prix se prennent **dans le coffre** (25/10 : il n'y a plus de sac). (26/10) Les lingots et les bijoux se prennent d'abord dans le coffre, puis dans la **réserve de leur atelier** (`reserveDAtelier`) : (26/10 : plus aucun prix en lingots, les chariots se paient en minerai de fer.)
- **Vendre** (25/10, `vendreCoffre`, `vendreMinerai`) : depuis le panneau de la mine, **au prix du marché** (`valeurDe`), sans marcher. « Tout vendre » vend tout le coffre **sauf ce qu'on garde** (`aVendreDuCoffre`). La **punaise 📌** d'un minerai (`basculerGarderTout`) le garde en entier (`GARDER_TOUT` = 1 milliard dans `coffre.garder`) : ni « Tout vendre », ni le wagonnet ne l'emportent. « Vendre » sur la ligne d'un minerai le vend même s'il est épinglé. L'argent compte dans `stats.argentGagne`.
- À débit seul, le coffre de départ (100 places) est plein en **8 min 20** au niveau 1 ; un coffre de 5 000 places en **2 h 19** au niveau 5 (0,6 bloc/s), un coffre de 20 000 places en **6 h 57** au niveau 7 (0,8 bloc/s), sans compter les clics et les mineurs.

## Les pioches et le clic

`PIOCHES`. Un clic casse **un bloc** (deux clics si la pioche est cassée) : pas de temps de casse, pas de vitesse.

| Pioche | Doublement | Durabilité | Prix (débloquer / racheter, 26/10) | Palier | Réparation (pioche cassée) |
|---|---:|---:|---|---:|---|
| Pierre | 10 % | 150 | 10 $ + 20 pierre (offerte, pas rachetable dans l'interface) | — | 5 $ + 10 pierre |
| Fer | 20 % | 300 | 300 $ + 20 fer | 2 | 30 $ + 5 fer |
| Or | 30 % | 500 | 2 500 $ + 30 or | 3 | 150 $ + 5 or |
| Émeraude | 38 % | 750 | 6 000 $ + 25 émeraude | 4 | 300 $ + 4 émeraude |
| Saphir (26/10) | 45 % | 1 000 | 30 000 $ + 30 saphir | 5 | 1 200 $ + 6 saphir |
| Rubis (26/10) | 52 % | 1 300 | 110 000 $ + 38 rubis | 6 | 3 800 $ + 8 rubis |
| Diamant | 60 % | 1 700 | 390 000 $ + 45 diamant | 7 | 12 000 $ + 9 diamant |

(26/10) La pioche d'index 4 (palier 5) est en saphir, avec les chiffres de l'ancienne pioche en diamant (avant la hausse) ; une partie qui avait celle en diamant a maintenant celle en saphir. Les prix et les réparations des paliers 5 à 7 suivent la hausse de la fin de partie. Toutes les pioches (de fer à diamant) : 538 800 $ + 20 fer + 30 or + 25 émeraude + 30 saphir + 38 rubis + 45 diamant.

- **Doublement** (`chanceDoublement`) : un minerai cassé en cliquant donne 2 au lieu d'1 si `aleatoire() < doublement`. 0 avec une pioche cassée. Seulement pour les clics. Un bonus de combo ajoute sa « fortune » (au plus 100 %), même avec une pioche cassée.
- **Blocs par clic** : `(2 si doublé, sinon 1) × (blocs du bonus de combo) × (3 pendant le bonus « Fortune »)` (`cliquerMine`). L'usure, les statistiques et l'XP comptent toujours un seul bloc.
- **Usure** : +1 à chaque bloc cassé avec une pioche pas cassée. Cassée quand l'usure atteint la durabilité.
- **Réparation** (`coutReparation`) : `part = min(1, usure / durabilité)` ; argent = `max(1, arrondi au-dessus(réparation.argent × part))`, chaque minerai = `max(1, arrondi au-dessus(n × part))`.

### Les bonus de combo

`BONUS_COMBO`. Les clics rapprochés (moins de 0,9 s entre deux) font un combo. À chaque palier, un bonus de quelques secondes (`activerBonusCombo`, il remplace celui en cours) :

| Palier (clics d'affilée) | Bonus | Durée | Fortune en plus | Blocs par clic |
|---:|---|---:|---:|---:|
| 10 | 🍀 Fortune | 3 s | +25 % | 1 |
| 25 | 🍀 Grande fortune | 4 s | +50 % | 1 |
| 50 | 💥 Double coup | 5 s | +25 % | 2 |
| 100 | 🔥 Frénésie | 8 s | +100 % | 2 |
| 200 | ✨ Ruée vers l'or | 10 s | +100 % | 3 |
| 500 | 🏆 Légende de la mine | 15 s | +100 % | 5 |

La fin du bonus se compte en temps de jeu (`stats.tempsDeJeu`), gardée dans `etat.bonus`.

## L'ascenseur des mineurs

`NIVEAUX_ASCENSEUR` (au panneau de la mine, onglet « Améliorer »). La caisse fait des allers-retours sans cesse tant que des mineurs travaillent au fond, et remonte au plus `capacite` blocs par voyage. **Débit** (`debitAscenseur`) = capacité ÷ (2 × trajet + chargement + vidage). La mine a son ascenseur de niveau 1 dès le début. (25/10 : 5 niveaux au lieu de 10, et des marches qui suivent ce que creusent les mineurs d'un palier à l'autre.)

| Niveau | Trajet | Charge / vide | Caisse | Remonte au plus | Prix (26/10) | Palier |
|---|---:|---:|---:|---:|---|---:|
| 1 | 6 s | 1 s / 2 s | 15 blocs | 1 bloc/s | (dès le début) | — |
| 2 | 4,5 s | 0,9 s / 1,8 s | 25 | 2,1 bloc/s | 700 $ + 30 fer | 2 |
| 3 | 3,5 s | 0,8 s / 1,5 s | 40 | 4,3 bloc/s | 3 000 $ + 90 fer + 30 redstone | 3 |
| 4 | 2,6 s | 0,6 s / 1,2 s | 60 | 8,6 bloc/s | 8 000 $ + 100 redstone + 40 or | 4 |
| 5 | 2 s | 0,4 s / 0,8 s | 90 | 17,3 bloc/s | 44 000 $ + 160 or + 60 émeraude | 5 |
| 6 | 1,6 s | 0,35 s / 0,7 s | 130 | 30,6 bloc/s | 150 000 $ + 300 or + 75 saphir | 6 |
| 7 | 1,3 s | 0,3 s / 0,6 s | 180 | 51,4 bloc/s | 540 000 $ + 180 saphir + 90 rubis | 7 |

Total : 745 700 $ + 120 fer + 130 redstone + 500 or + 60 émeraude + 255 saphir + 90 rubis (26/10 ; jusqu'au niveau 5 : 55 700 $). Sous l'électricité du générateur (mine dans le rayon), les trajets sont plus courts. Ce que creusent les mineurs d'un palier (communs, pioche du palier, `maxEmployes` mineurs) : 0,5 ; 1,5 ; 3 ; 5,2 ; 8,5 ; 13,2 ; 19,6 bloc/s : l'ascenseur du même palier suit, avec de la marge pour les mineurs rares.

## Les rails et les wagonnets

| Constante | Valeur |
|---|---|
| `COUT_RAIL` | 3 fer la case (à partir du niveau 2 du joueur), rendus quand on retire le rail |
| `VITESSE_POUSSE_JOUEUR` | 3 cases/s |
| `VITESSE_POUSSE_MINEUR` | 2,5 cases/s × la vitesse du pousseur (`NIVEAUX_POUSSEUR`) × sa rareté (`forcePousseur`) |
| `VITESSE_DOUCE_POUSSEUR` (27/10) | 3,75 cases/s : au-dessus, la vitesse vue sur la carte est **adoucie** (`vitesseAdoucie` : × (1 + 0,25 × ln(v / 3,75)), au plus ~6,6 cases/s au lieu de 78), et le **chariot grandit d'autant** (`compensationChariot` : le rapport des durées d'aller-retour) : le pousseur transporte toujours autant par seconde. Interrupteur : `ADOUCIR_VITESSE_POUSSEURS` (false = comme avant). |
| électrique | la vitesse du pousseur × (1 + bonus du générateur) : × 1,3 à × 2 (26/10 ; × 1,75 avec 5 niveaux) |
| sur sa lancée (électrique sans courant) | 1,25 case/s |

**Le chariot de chaque pousseur** (`NIVEAUX_CHARIOT_POUSSEUR`, au Personnel, argent et fer) et **sa vitesse** (`NIVEAUX_POUSSEUR`, argent) :

| Niveau | Places | Prix du chariot | Vitesse | Prix de la vitesse | Palier |
|---|---:|---|---|---:|---:|
| 1 | 20 | (de base) | Débutant × 1 | (de base) | — |
| 2 | 40 | 800 $ + 40 fer | Costaud × 1,2 | 600 $ | 2 |
| 3 | 70 | 2 500 $ + 100 fer | Robuste × 1,4 | 2 000 $ | 3 |
| 4 | 110 | 6 000 $ + 200 fer | Expert × 1,65 | 5 000 $ | 4 |
| 5 | 170 | 30 000 $ + 800 fer | Champion × 1,9 | 24 000 $ | 5 |
| 6 | 260 | 100 000 $ + 1 000 fer | Maître × 2,2 | 75 000 $ | 6 |
| 7 | 400 | 330 000 $ + 1 000 fer | Légende × 2,6 | 210 000 $ | 7 |

(25/10 : 5 niveaux, et plus de prix « × le niveau du joueur ». 26/10 : 7 niveaux ; les deux derniers chariots se paient en **minerai de fer** (un temps, en lingots de fer). Le joueur qui pousse lui-même a le premier chariot, 20 places.) Pour un pousseur : 316 600 $ de vitesse, et 469 300 $ + 3 140 fer de chariot (26/10, hausse et plafond de 1 000 fer compris).

- **Trajets** (`LIAISONS`, 10 depuis le 26/10 ; 4 avant) : Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché, et (26/10) Mine → Fonderie, Mine → Joaillerie, Foreuse → Fonderie, Foreuse → Joaillerie, Fonderie → Marché, Joaillerie → Marché. Un wagonnet chacun, créés gratuitement par le joueur. Il faut **un pousseur payé** pour qu'un trajet roule tout seul, même électrique.
- **Ligne** (`railsEntre`, `ligneDe`) : la suite de rails continue d'une case collée au bâtiment de départ à une case collée à celui d'arrivée, jamais en boucle (`feraitUneBoucle`). **Longueur d'un trajet** = cases de la ligne + 1 (`longueurTrajet`).
- **Aller-retour** (`secondesAllerRetour`) = `2 × longueur ÷ vitesse + 2 × 1 s`.
- **Chargement**, jusqu'à la capacité (un peu de chaque objet s'il n'a pas la place pour tout, `repartir`) :
  - Mine → Marché : le coffre, **sauf les minerais épinglés 📌**, les objets décochés dans la fenêtre du trajet, et le charbon et la redstone qui manquent à la foreuse et au générateur (si leurs trajets ont un pousseur) ;
  - Mine → Foreuse : dès que le réservoir n'est plus plein, tout le charbon du coffre ; le surplus va dans le chariot de la foreuse ;
  - Mine → Générateur : la redstone qui manque à sa réserve ;
  - Foreuse → Marché : le chariot de la foreuse (26/10 : sauf ce qui attend d'aller à un atelier, voir plus bas) ;
  - (26/10) Mine → Fonderie et Foreuse → Fonderie : le fer et l'or choisis, sans dépasser la place de l'entrée de la fonderie (les plus chers d'abord), **et** le charbon qui manque à son four (`objetFixe`) ; au départ de la mine, ce qu'on garde 📌 reste ;
  - (26/10) Mine → Joaillerie et Foreuse → Joaillerie : les gemmes choisies (émeraude, saphir, rubis, diamant), sans dépasser la place de l'entrée ;
  - (26/10) Fonderie → Marché et Joaillerie → Marché : la réserve de l'atelier (les lingots, les bijoux).
- **Ce qu'un atelier refuse** (26/10, `objetsRefuses`) : la fenêtre du trajet le montre grisé (« Refusé ici ») ; on ne peut pas le choisir. À l'arrivée, l'atelier ne prend que ce qu'il accepte, tant qu'il a de la place (`livrerAtelier`) ; le reste repart au départ.
- **La part des ateliers** (26/10, `reservePourLesAteliers`) : un wagonnet vers le marché laisse au départ (mine ou foreuse) le minerai choisi pour un trajet **automatique** vers un atelier, autant qu'il reste de place à son entrée (et le charbon du four de la fonderie). Si l'atelier est plein, le reste part au marché : rien ne reste bloqué.
- **Électrique** (`trajetElectrique`) : toutes les cases du trajet dans le rayon, générateur allumé avec de la redstone.

## Le générateur

`NIVEAUX_GENERATEUR` (25/10 : rayon pour la clairière de 40 × 40 ; 26/10 : de 12 à 28 cases, 12, 15, 18, 21, 24, 26, 28 : au niveau max, du milieu de la clairière à un coin, avant jusqu'à 36) :

| Niveau | Rayon (cases) | Bonus | Réserve | Prix | Palier |
|---|---:|---:|---:|---|---:|
| 1 | 12 | + 30 % | 5 min | le bâtiment : 3 500 $ + 80 fer + 30 redstone | 2 |
| 2 | 15 | + 40 % | 7 min | 4 000 $ + 80 fer + 40 redstone | 2 |
| 3 | 18 | + 50 % | 10 min | 8 000 $ + 150 fer + 90 redstone | 3 |
| 4 | 21 | + 60 % | 13 min | 15 000 $ + 250 fer + 180 redstone | 4 |
| 5 | 24 | + 75 % | 16 min | 70 000 $ + 800 fer + 700 redstone | 5 |
| 6 | 26 | + 85 % | 19 min | 230 000 $ + 1 000 fer + 1 000 redstone | 6 |
| 7 | 28 | + 100 % | 22 min | 660 000 $ + 1 000 redstone + 120 saphir | 7 |

Améliorations (niveaux 2 à 7) : 987 000 $ + 2 280 fer + 3 010 redstone + 120 saphir (26/10, hausse et plafond de 1 000 compris ; niveaux 2 à 5 : 97 000 $ + 1 280 fer + 1 010 redstone).

- **Consommation** : 1 redstone = 30 s, soit 2 par minute, **120 par heure**, quel que soit le niveau.
- **Rayon** : une case est dedans si `distance(centre de la case, centre du générateur) ≤ rayon`.
- Le bonus accélère d'autant l'ascenseur de la mine (si elle est dans le rayon), le pousseur d'un trajet électrique, la foreuse, et depuis le 26/10 la fonderie et les joailliers (`multiplicateurGenerateur`, 1,3 à 2 ; `atelierAlimente`).
- Au niveau 2 de la mine, la mine seule sort 0,3 × 10 % = 1,8 redstone par minute : presque ce que brûle le générateur. Les clics et les mineurs font le reste.

## La foreuse

`NIVEAUX_FORAGE` et `NIVEAUX_CHARIOT` (25/10 : 5 niveaux chacun ; 26/10 : 7) :

| Niveau | Forage (bloc/s) | Réservoir | Prix du forage | Chariot | Prix du chariot | Palier |
|---|---:|---:|---|---:|---|---:|
| 1 | 0,5 | 15 charbons (5 min) | (le bâtiment : 2 500 $ + 100 pierre + 50 fer) | 25 | (de base) | 2 |
| 2 | 1 | 22 (7 min 20) | 3 000 $ + 50 fer + 20 redstone | 50 | 4 000 $ + 60 fer | 2 |
| 3 | 1,6 | 30 (10 min) | 6 000 $ + 100 fer + 60 redstone | 90 | 7 000 $ + 120 fer + 40 redstone | 3 |
| 4 | 2,4 | 40 (13 min 20) | 14 000 $ + 150 redstone + 40 or | 140 | 14 000 $ + 150 redstone + 50 or | 4 |
| 5 | 3,4 | 50 (16 min 40) | 60 000 $ + 160 or + 40 émeraude | 200 | 60 000 $ + 200 or + 50 émeraude | 5 |
| 6 | 4,6 | 60 (20 min) | 200 000 $ + 100 émeraude + 50 saphir | 280 | 180 000 $ + 750 fer + 50 saphir | 6 |
| 7 | 6 | 70 (23 min 20) | 600 000 $ + 120 saphir + 60 rubis | 400 | 540 000 $ + 1 000 fer + 75 rubis | 7 |

Total du forage : 883 000 $ + 150 fer + 230 redstone + 200 or + 140 émeraude + 170 saphir + 60 rubis. Total du chariot : 805 000 $ + 1 930 fer + 190 redstone + 250 or + 50 émeraude + 50 saphir + 75 rubis (26/10 : les deux derniers en minerai de fer, 750 puis 1 000 fer avec la hausse et le plafond, plus en lingots) (26/10 ; jusqu'au niveau 5 : 83 000 $ et 85 000 $).

- **Charbon** : 1 charbon = 20 s de forage, quelle que soit la vitesse (3 charbons par minute).
- **Vitesse** = forage × bonus du générateur (dans le rayon) × 2 pendant le bonus « Production × 2 ».
- **Le chariot se vend sur place** (25/10, `vendreChariot`), au prix du marché, ou le wagonnet Foreuse → Marché l'emporte. L'argent compte dans `argentForeuse` (vendu sur place) ou `argentWagonnet` (par le wagonnet).
- **Ce qu'elle rapporte** : vitesse × valeur moyenne d'un bloc. Au niveau 2 de la mine, forage de base : 0,5 × 4,58 ≈ 2,3 $/s. Tout au maximum (mine niveau 7, forage 6, générateur + 100 %) : 12 bloc/s × 46,37 ≈ **556 $/s** (26/10 ; au palier 5 : 5,95 bloc/s × 20,79 ≈ 124 $/s).
- **Temps pour remplir le chariot** (`secondesPourRemplir`) = capacité ÷ vitesse : **50 à 67 s** quand forage et chariot ont le même niveau (sans électricité).

## La fonderie et la joaillerie

(26/10) Deux **ateliers** (`ateliers.ts`) qui transforment ce qui sort de la mine. Chacun a une **entrée** (le minerai qui attend) et une **réserve** (ce qu'il a fabriqué), du même nombre de places (`stock`). Le détail est dans [../batiments/fonderie.md](../batiments/fonderie.md) et [../batiments/joaillerie.md](../batiments/joaillerie.md).

### La fonderie (`NIVEAUX_FONDERIE`, `PALIER_FONDERIE = [5, 5, 6, 6, 7]`)

Le bâtiment : 40 000 $ + 300 pierre + 200 fer + 150 charbon (mine niveau 5). Elle fond le fer et l'or (le plus cher d'abord) et brûle **1 charbon toutes les 12 s** de four (`SECONDES_PAR_CHARBON_FONDERIE`), seulement quand elle fond.

| Niveau | Lingots/s | Entrée et réserve | Four (charbons) | Prix | Palier |
|---|---:|---:|---:|---|---:|
| 1 | 0,5 | 40 | 15 (3 min) | (le bâtiment) | 5 |
| 2 | 0,8 | 70 | 22 (4 min 24) | 120 000 $ + 600 fer + 200 charbon | 5 |
| 3 | 1,2 | 110 | 30 (6 min) | 350 000 $ + 380 or + 50 saphir | 6 |
| 4 | 1,7 | 160 | 40 (8 min) | 650 000 $ + 630 or + 50 rubis | 6 |
| 5 | 2,4 | 240 | 50 (10 min) | 1 500 000 $ + 180 saphir + 120 rubis | 7 |

Améliorations : 2 620 000 $ + 600 fer + 200 charbon + 1 010 or + 230 saphir + 170 rubis (26/10, hausse comprise ; le bâtiment n'est pas touché).

- **Vitesse** (`vitesseFonderie`) = lingots/s du niveau × bonus du générateur (si elle est dans son rayon) × 2 pendant « Production × 2 ». Un charbon fond 6 lingots au niveau 1, 28,8 au niveau 5 (sans électricité).
- **Ce qu'elle ajoute** : 12 $ par lingot de fer (24 − 12), 35 $ par lingot d'or (70 − 35). Au niveau 1, à parts égales de fer et d'or : 0,5 × 23,5 ≈ 11,8 $/s.

### La joaillerie (`NIVEAUX_JOAILLERIE`, `PALIER_JOAILLERIE = [6, 6, 6, 7, 7]`)

Le bâtiment : 150 000 $ + 40 émeraude + 30 saphir (mine niveau 6). Ses **joailliers** (embauchés au Personnel) taillent une gemme à la fois (la plus chère d'abord) : un bijou prend `SECONDES_PAR_BIJOU` (10 s) ÷ outils ÷ rareté du joaillier.

| Niveau | Établis (joailliers au plus) | Outils | Un bijou (joaillier commun) | Entrée et réserve | Prix | Palier |
|---|---:|---:|---:|---:|---|---:|
| 1 | 1 | × 1 | 10 s (6 par minute) | 30 | (le bâtiment) | 6 |
| 2 | 2 | × 1,15 | 8,7 s | 50 | 300 000 $ + 75 saphir | 6 |
| 3 | 3 | × 1,3 | 7,7 s | 80 | 550 000 $ + 63 rubis | 6 |
| 4 | 4 | × 1,5 | 6,7 s | 120 | 1 200 000 $ + 120 rubis + 30 diamant | 7 |
| 5 | 5 | × 1,75 | 5,7 s (10,5 par minute) | 180 | 2 100 000 $ + 75 diamant | 7 |

Améliorations : 4 150 000 $ + 75 saphir + 183 rubis + 105 diamant (26/10, hausse comprise ; le bâtiment n'est pas touché).

- **Vitesse d'un joaillier** (`vitesseJoaillier`) = outils × rareté (× 1 à × 5) × bonus du générateur (dans le rayon) × 2 pendant « Employés × 2 » ÷ 10 s.
- **Ce qu'il ajoute** : 120 $ par collier d'émeraude, 180 $ par pendentif de saphir, 255 $ par couronne de rubis, 360 $ par bague de diamant (bijou − gemme). Un joaillier commun au niveau 1 qui taille des saphirs : 0,1 × 180 = 18 $/s, pour 5 $/s de salaire.
- **Les joailliers** : prix de la 1re à la 5e embauche (`PRIX_EMBAUCHE_JOAILLIER`) **8 000, 20 000, 45 000, 90 000, 160 000 $** (× 2,2 au-delà), salaire **1 500 $ / 5 min** × leur rareté (`SALAIRE_JOAILLIER`). Pas d'amélioration (on améliore la joaillerie).

## Les employés

### Équipe, embauche, licenciement

- **Nombre max de mineurs** (`maxEmployes`) = 1 + (niveau de la mine − 1) : **1, 2, 3, 4, 5, 6, 7**. Les pousseurs ne comptent pas (un par trajet au plus, 10 depuis le 26/10, `maxPousseurs`), ni les joailliers (autant que d'établis à la joaillerie, `maxJoailliers`).
- **Prix de la n-ième embauche** (25/10, selon le nombre qu'on a de ce métier ; arrondi à la dizaine sous 1 000 $, à la centaine au-dessus) :
  - mineurs (`PRIX_EMBAUCHE`) : **50, 800, 3 000, 8 000, 20 000 $** (puis 45 000, 100 000, 220 000, 500 000 et 1 000 000 $, et × 2,2 au-delà de la liste ; 25/10, économie revue : avant 50, 1 200, 7 000, 25 000, 80 000 $) ;
  - pousseurs (`PRIX_EMBAUCHE_POUSSEUR`) : **300, 1 000, 2 500, 5 000 $**, puis (26/10, pour les 10 trajets) 9 000, 15 000, 25 000, 40 000, 60 000 et 90 000 $ (avant l'économie revue : 300, 1 500, 5 000, 12 000 $) ;
  - joailliers (`PRIX_EMBAUCHE_JOAILLIER`, 26/10) : **8 000, 20 000, 45 000, 90 000, 160 000 $**.
- **Indemnités** (`indemnites`) = 40 % (`PART_INDEMNITES`) du prix de la dernière place de son métier : mineurs 20 $, 320 $, 1 200 $, 3 200 $, 8 000 $, 18 000 $, 40 000 $ (pour 1 à 7 mineurs) ; pousseurs 120 $, 400 $, 1 000 $, 2 000 $ (pour 1 à 4), puis 3 600 $ à 36 000 $ ; joailliers 3 200 $, 8 000 $, 18 000 $, 36 000 $, 64 000 $. Un joaillier licencié laisse la gemme qu'il taillait à l'entrée de la joaillerie.
- **Remplacer un mineur** (ou, 26/10, un joaillier ; avec le recruteur, `prixRemplacement`) = le plus cher entre le quart de la dernière place possible de mineur (`maxEmployes`) et 200 $ × (niveau du joueur)² ; sans indemnités. Par exemple 9 800 $ au niveau 7 du joueur et 45 000 $ au niveau 15.

### Le travail des mineurs

`NIVEAUX_EMPLOYE` (en argent, au Personnel) × la rareté (`RARETES`). Salaire : `SALAIRES`, toutes les 5 minutes.

| Pioche | Creuse | Sac | Prix (26/10) | Palier | Salaire / 5 min |
|---|---:|---:|---:|---:|---:|
| Bois | 0,5 bloc/s | 10 | (de base) | — | 120 $ |
| Fer | 0,75 | 18 | 400 $ | 2 | 300 $ |
| Or | 1 | 28 | 2 500 $ | 3 | 700 $ |
| Émeraude | 1,3 | 40 | 7 000 $ | 4 | 1 300 $ |
| Saphir (26/10) | 1,7 | 55 | 36 000 $ | 5 | 2 600 $ |
| Rubis (26/10) | 2,2 | 75 | 110 000 $ | 6 | 4 500 $ |
| Diamant | 2,8 | 100 | 360 000 $ | 7 | 7 500 $ |

(25/10 : 5 pioches au lieu de 6, la pierre est retirée. 26/10 : 7 pioches ; celle du palier 5, qui était en diamant, est maintenant en saphir, avec les mêmes chiffres.) Les pioches de tous les niveaux pour un mineur : 515 900 $ (jusqu'au palier 5 : 45 900 $).

- **Blocs par seconde d'un mineur** (`blocsParSecondeEmploye`) = ce qu'il creuse × `min(1, ce que remonte l'ascenseur ÷ ce que creusent tous les mineurs payés)` (`partRemontee`), × 2 pendant « Production × 2 ».
- **Salaire** (`salaireEmploye`) = `arrondi(SALAIRES[pioche] × rareté.salaire)`. Sans manager, on paie au plus 5 minutes d'avance (au prorata du temps manquant).
- **Rentabilité** : un mineur commun en bois au niveau 1 de la mine sort 0,5 × 3,04 ≈ 1,5 $/s pour 0,4 $/s de salaire (environ 26 %) ; en saphir au niveau 5 : 1,7 × 20,79 ≈ 35,3 $/s pour 8,7 $/s (25 %) ; en diamant au niveau 7 : 2,8 × 46,37 ≈ 130 $/s pour 25 $/s (19 %). Une meilleure pioche rapporte toujours plus qu'elle ne coûte en salaire.

### Les pousseurs

- **Salaire** : 400 $ toutes les 5 minutes, + 250 $ par niveau de vitesse et + 200 $ par niveau de chariot (× sa rareté) : de 400 $ à 3 100 $ (26/10 : 7 niveaux ; avant, 2 200 $ au plus) (`SALAIRE_POUSSEUR_BASE`, `SALAIRE_POUSSEUR_PAR_VITESSE`, `SALAIRE_POUSSEUR_PAR_CHARIOT`).
- **Rareté** : un pousseur pousse × `forcePousseur` = 1 + (rendement − 1) ÷ 2 (rare × 1,25, épique × 1,5, légendaire × 2, mythique × 3).

### Les joailliers (26/10)

- **Salaire** : 1 500 $ toutes les 5 minutes × sa rareté (`SALAIRE_JOAILLIER`), quel que soit le niveau de la joaillerie.
- **Rareté** : un joaillier taille × son rendement (rare × 1,5… mythique × 5), comme un mineur creuse.
- Le manager paie aussi leur salaire. Voir [La fonderie et la joaillerie](#la-fonderie-et-la-joaillerie).

### Raretés (`RARETES`)

| Rareté | Rendement | Salaire |
|---|---:|---:|
| Commun | × 1 | × 1 |
| Rare | × 1,5 | × 1,4 |
| Épique | × 2 | × 1,8 |
| Légendaire | × 3 | × 2,5 |
| Mythique | × 5 | × 4 |

### Recruteur (`NIVEAUX_RECRUTEUR`, 3 niveaux)

| Niveau | Prix (26/10) | Palier (`PALIER_CHEF.recruteur`) | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 (embauche) | 10 000 $ | 4 | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 80 000 $ | 5 | 57 % | 23 % | 12 % | 6 % | 2 % |
| 3 | 350 000 $ | 6 | 50 % | 25 % | 14 % | 8 % | 3 % |

Total : 440 000 $ (26/10 : niveaux 2 et 3 plus chers, le dernier au palier 6, hausse comprise ; le 25/10 : 10 000, 25 000 et 50 000 $ aux paliers 4, 5, 5, total 85 000 $ ; avant l'économie revue : 245 000 $). Sans recruteur, 100 % de communs. Le recruteur tire aussi la rareté des **joailliers** (26/10). Le tirage part du plus rare (`tirerRarete`).

### Manager (`NIVEAUX_MANAGER`, 3 niveaux)

`PRIX_MANAGER` = **5 000 $** (palier 3 ; 25/10, économie revue : avant 8 000 $), `SALAIRE_MANAGER` = 400 $ / 5 min. Il reste éveillé **30 min**, puis **1 h** (50 000 $, palier 5) et **2 h** (230 000 $, palier 6), jeu ouvert ou fermé, puis il s'endort jusqu'à ce qu'on le réveille. Total : 285 000 $ (26/10, hausse comprise ; le 25/10 : 12 000 $ au palier 4 et 30 000 $ au palier 5, total 47 000 $). Il paie 5 minutes de plus à chacun (lui d'abord, puis les employés du moins cher au plus cher) dès qu'il lui reste moins de 60 s payées (`SECONDES_AVANT_PAIE_MANAGER`), avec l'argent du joueur.

## Le village

Une grille de **40 × 40 cases** (`TAILLE_GRILLE`, 25/10). Le fonctionnement est dans [village.md](village.md) ; ici, seulement les chiffres.

### Les bâtiments (`BATIMENTS`, `batiments.ts`)

Dans l'ordre du menu (`LISTE_BATIMENTS`) :

| Bâtiment | Taille | Entrée (sans miroir) | Niveau de mine | Prix pour le poser (25/10) |
|---|---|---|---:|---|
| ⛏️ Mine | 10 × 10 | face avant gauche | 1 | déjà posée au milieu (case 15, 15) |
| 👷 Personnel | 5 × 5 | face avant droite | 1 | 40 $ |
| 💰 Marché | 5 × 5 | face avant gauche | 1 | **gratuit** |
| ⚒️ Forgeron | 5 × 5 | face avant droite | 1 | 30 $ + 15 pierre |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 2 | 2 500 $ + 100 pierre + 50 fer |
| ⚡ Générateur | 5 × 5 | face avant droite | 2 | 3 500 $ + 80 fer + 30 redstone |
| 🏭 Fonderie (26/10) | 5 × 5 | face avant gauche | 5 | 40 000 $ + 300 pierre + 200 fer + 150 charbon |
| 🏪 Joaillerie (26/10) | 5 × 5 | face avant droite | 6 | 150 000 $ + 40 émeraude + 30 saphir |

Plus de niveau du joueur pour les bâtiments (25/10 : tous au niveau 1 ; seul le niveau de la mine compte pour la foreuse et le générateur, et depuis le 26/10 la fonderie et la joaillerie). Le **bazar** est retiré. Tous les bâtiments : **196 070 $ + 415 pierre + 330 fer + 30 redstone + 150 charbon + 40 émeraude + 30 saphir** (avant le 26/10 : 6 070 $ + 115 pierre + 130 fer + 30 redstone). On paie une seule fois ; déplacer ou retourner est gratuit ; on ne peut pas enlever un bâtiment.

### Rails et chemins

| Élément | Prix | Remarques |
|---|---|---|
| 🛤️ Rail (1 case) | **3 fer** (`COUT_RAIL`) | à partir du niveau 2 du joueur ; quand on le retire, il va dans le stock (26/10) et se repose gratuitement |
| 🪨 Chemin de pavés (1 case) | 5 $ (`COUT_CHEMIN`) | seulement joli ; remboursé quand on le retire |

### Vitesses

| Constante | Valeur | Qui |
|---|---|---|
| `VITESSE_JOUEUR` | 7,5 cases/s | le joueur |
| `VITESSE_MARCHE` | 2,5 cases/s | les employés (vers la forge, le Personnel, la mine, le quai) |
| `SECONDES_FORGE_EMPLOYE` | 3 s | un mineur attend sa nouvelle pioche |

Le joueur traverse la clairière (40 cases) en un peu plus de 5 s.

## Les gemmes

Tout le détail est dans [gemmes-et-recompenses.md](gemmes-et-recompenses.md). En bref (`gemmes.ts`) :

- **Gagner** : 1 par publicité (`GEMMES_PAR_PUB`), 3 par niveau du joueur (`GEMMES_PAR_NIVEAU`), le cadeau du jour (`RECOMPENSES_QUOTIDIENNES` : 1, 2, 1, 3, 2, 4 et 10 gemmes, 23 par semaine).
- **Prix en gemmes** d'un achat (27/10) : de **1 à 3**, en proportion entre la moins chère (1) et la plus chère (3) des améliorations possibles du moment ; après un achat en gemmes, une publicité offre l'amélioration suivante (voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md)). Du 26/10 au 27/10 : de **2 à 10**, en proportion entre la moins chère (2) et la plus chère (10) des améliorations possibles du moment (`bornesGemmes`, `src/jeu/prixGemmes.ts`). Avant (25/10, gardé quand il n'y a pas de bornes, au moins 2) : `arrondi(3 + 2,4 × (log10(valeur en $) − 2))`, entre **3 et 10** (3 à 10 publicités), la valeur comptant l'argent et les minerais à leur prix (`valeurEnDollars`) : 100 $ → 3 💎, 1 000 $ → 5 💎, 10 000 $ → 8 💎, à partir d'environ 51 000 $ (comme la mine niveau 5, 171 900 $) → 10 💎.
- **Boutique** (`BOOSTS`, 25/10) : Production × 2, Ventes × 2 et Employés × 2 (15 min chacun) et Fortune (× 3 blocs par clic, 5 min), **3 💎** chacun ; plus de trésor.
- **Cadeau du jour** (25/10) : plus d’argent ; chaque jour des gemmes (2 à 12, 35 par semaine) et un bonus de la boutique (Employés × 2, Ventes × 2, Production × 2, de 10 à 60 min) : voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md#4-le-cadeau-du-jour-recompensesquotidiennestsx).
- **Absence × 2** (`doublerAbsence`) : une publicité redonne tout ce que l'absence a rapporté (l'argent gagné, plus la valeur de ce qui attend en plus dans le coffre et le chariot).

## Revenus par seconde

`revenuParSeconde(etat)` (`revenu.ts`) donne l'indicateur « $/s » du bandeau. C'est la **valeur de ce qui sort de la mine** (il faut encore la vendre), une moyenne :

- **mine** = débit × valeur moyenne d'un bloc (0 si le coffre est plein) ;
- **mineurs** = pour chaque mineur **payé** : blocs par seconde × valeur moyenne, **moins** son salaire ÷ 300 ; moins le salaire des pousseurs et du manager ÷ 300. Coffre plein : seulement les salaires ;
- **foreuse** = vitesse × valeur moyenne, si elle tourne ;
- **ateliers** (26/10, `plusValueParSeconde`) = ce que la fonderie et les joailliers fabriquent par seconde × ce qu'ils ajoutent en moyenne au prix (le lingot ou le bijou moins son minerai, selon ce qui attend à l'entrée) ; le salaire des joailliers est compté avec les autres ;
- **total** = mine + mineurs + foreuse + ateliers. Les **clics ne comptent pas**, ni les wagonnets (ils ne font que porter).

Ce que fait la mine seule : **0,61 $/s** au niveau 1, 1,37 au niveau 2, 3,00 au niveau 3, 6,54 au niveau 4, 12,47 au niveau 5, 22,13 au niveau 6, **37,10 $/s** au niveau 7 (26/10 ; avant, 11,87 $/s au niveau 5).

Le **bilan par minute** (`bilanParMinute`, fenêtre du « $/s ») a aussi, depuis le 26/10, une ligne 🏭 La fonderie et 💍 La joaillerie dans les gains (une fois construites), et 💍 Salaires des joailliers dans les dépenses.

## Ce que coûte chaque niveau de la mine

Ce qu'il faut pour descendre, et ce que coûte tout le palier (un niveau de chaque amélioration, sans les embauches ni les chefs) :

| Palier | Pour y descendre | Tout le palier (coffre, pioche, ascenseur, 1 pioche de mineur, vitesse et chariot d'un pousseur, forage, chariot de la foreuse, générateur) |
|---:|---|---|
| 1 | — | bâtiments du départ (Personnel, Forgeron) : 70 $ + 15 pierre ; rails : 3 fer la case |
| 2 | 800 $ + 40 fer | 14 000 $ (20 000 $ avec la foreuse et le générateur à poser) + des minerais |
| 3 | 6 000 $ + 100 fer + 40 redstone | 35 500 $ + des minerais |
| 4 | 22 000 $ + 100 redstone + 50 or | 81 000 $ + des minerais |
| 5 | 160 000 $ + 180 or + 70 émeraude | 390 000 $ + des minerais ; et la fonderie (40 000 $ + des minerais, puis 120 000 $ pour son niveau 2) |
| 6 | 650 000 $ + 200 émeraude + 100 saphir | 1 285 000 $ + des minerais ; la fonderie niveaux 3 et 4 (1 000 000 $) ; la joaillerie (150 000 $, puis 850 000 $ pour ses niveaux 2 et 3) |
| 7 | 2 400 000 $ + 240 saphir + 150 rubis | 4 080 000 $ + des minerais ; la fonderie niveau 5 (1 500 000 $) ; la joaillerie niveaux 4 et 5 (3 300 000 $) |

Tout au maximum (coffre, pioches, ascenseur, générateur, forage, chariot de la foreuse, recruteur, manager) : environ **5,3 millions $** (26/10, hausse comprise ; 2 millions avant la hausse, 390 000 $ avec 5 niveaux, et 1 million avant l'économie revue du 25/10), plus 515 900 $ par mineur (ses pioches), 785 900 $ par pousseur (vitesse et chariot) et les embauches ; et 6,8 millions $ pour les niveaux de la fonderie et de la joaillerie. Plus les niveaux de la mine (3 238 800 $).

## Le niveau du joueur

Tout est expliqué dans [niveaux.md](niveaux.md). En bref :

- **XP** (`XP_PAR`) : 1 pour 3 blocs cassés en cliquant, 70 par bâtiment, 3 par case de rails, 30 par trajet, 40 par embauche, 30 par niveau d'amélioration, 150 par niveau de mine, et 1 par 25 $ de ce qu'on a acheté (`VALEUR_PAR_XP`). Chaque chose ne compte qu'une fois (`recordsXp`). Rien pour ce qui se fait tout seul.
- **Courbe** : `xpPourPasser(n) = 60 × n^1,8`, arrondi à la dizaine : 60 XP pour passer au niveau 2, 210 pour le 3… Il faut 1 430 XP au total pour le niveau 5, 11 680 pour le 10, **38 230 pour le 15** (le maximum).
- **Déblocages** (`NIVEAU_JOUEUR_POUR`) : rails au niveau 2 ; mine niveaux 2 à 7 aux niveaux 3, 5, 7, 9, 11, 13 (26/10). Chaque niveau rapporte 1 gemme (25/10 : 3 avant).

## Le bot de simulation

`src/jeu/bot.ts` (`jouerPartie(aleatoire, maxSecondes = 16 h)`) joue une partie avec seulement des actions qu'un joueur peut faire, jusqu'au **niveau 7** de la mine (`NIVEAU_MINE_MAX` ; jusqu'au 25/10 : le niveau 5). Il gagne de l'XP comme un joueur et attend ses niveaux et ses paliers. `bot.test.ts` le fait jouer **10 parties** avec des graines fixes (1 à 10, générateur `mulberry32` : les résultats sont toujours les mêmes). Il ne se sert pas des gemmes.

### Ce qu'il fait

- **Chaque seconde** : il règle ce qu'il garde, achète ce qu'il peut, vend si besoin, puis **clique 2 fois** sur le bloc de la mine et laisse passer 1 s de jeu (`avancerTemps`).
- **Le village** (`PLAN_DU_BOT`, autour de la mine posée en 15, 15) : le **Personnel** en (9, 21), le **marché** en (18, 28), juste sous la mine, le **forgeron** (26, 14), le **générateur** (25, 27), la **foreuse** (26, 21), et (26/10) la **fonderie** (9, 15) et la **joaillerie** (26, 8). Il pose **3 cases de rails** (20, 25 à 27) entre la mine et le marché dès qu'elles sont débloquées, puis y crée le trajet Mine → Marché et y embauche un pousseur.
- **Vendre** (25/10 : depuis la mine, plus de marche) : tant que le wagonnet ne roule pas, il vend le coffre (et le chariot de la foreuse) quand le coffre est à moitié plein ; avec le wagonnet, au-delà de 85 %.
- **Ce qu'il garde** (`reglerGarde`, dans `coffre.garder`) : les minerais du prochain coffre, du prochain niveau de mine, des rails, de la réparation, du prochain bâtiment, de 20 redstone pour le générateur et de la prochaine pioche, tant que ça tient dans 70 % du coffre.
- **Les achats** : réparer, pioche suivante, niveau de mine dès qu'il peut, salaires dès que quelqu'un a moins d'une minute payée (et réveiller le manager à mi-fatigue), embaucher et améliorer les mineurs en gardant une paie d'avance, recruteur, manager à partir de 15 000 $, un pousseur pour Mine → Marché (et son chariot quand le coffre se remplit), générateur rempli de redstone et amélioré à 2 fois son prix, foreuse remplie de charbon et améliorée au-dessus de 3 000 $, ascenseur (à partir de 2 mineurs, et (26/10) dès qu'il remonte moins que ce que creusent ses mineurs) et coffre ; (26/10) un **joaillier** dès qu'un établi est libre (en gardant une paie d'avance).
- **Les ateliers** (26/10, `faireTournerLesAteliers`) : il y apporte à la main tout ce qu'ils acceptent (sauf ce qu'il garde), remplit le four de la fonderie quand il lui reste moins de 2 minutes, les améliore quand il a 1,5 fois le prix (sans toucher aux minerais du prochain niveau de la mine), et vend leur réserve (sauf les lingots qu'il garde pour ses achats). Il garde aussi les minerais du prochain niveau des ateliers. Il ne pose pas de rails vers eux.

### Ce que vérifie `bot.test.ts`

| Test | Attendu |
|---|---|
| Fin | les 10 parties arrivent au **niveau 7** (26/10 ; avant, au niveau 5) |
| Niveau 2 (médiane) | **2 à 10 minutes** (25/10 ; avant 15 à 40) |
| Niveau 5 (médiane) | **1 h à 3 h** (25/10, économie revue ; avant 3 h à 6 h, et 6 h à 9 h avant le 25/10) |
| Niveau 7 (médiane) | **4 h à 9 h** (26/10, avec la hausse de la fin de partie ; avant 3 h à 7 h) |
| Ateliers | dans chaque partie, la fonderie a fondu plus de 100 lingots et la joaillerie taillé plus de 20 bijoux (26/10) |
| Niveau du joueur (médianes) | le niveau 5 **après 8 minutes au moins**, le niveau 10 **après 1 heure au moins** |
| Progression | chaque niveau prend plus de temps que le précédent (médiane, à 20 % près), du niveau 2 au niveau 7 |
| Rails | le trajet Mine → Marché existe en **moins de 10 minutes** (toutes les parties) |
| Électricité | les rails sont électriques en **moins de 1 h 30** (toutes les parties) |
| Automatisation | au moins 4 employés, plus de 100 voyages de wagonnet, et les mineurs sortent plus de blocs que les clics |
| Début | plus de 3 ventes à la main avant le wagonnet |

### Résultats mesurés (26/10, la grosse mise à jour des gemmes, 10 parties)

> (26/10) **Après la hausse de la fin de partie**, le bot (qui améliore maintenant l'ascenseur quand il bloque ses mineurs) arrive, en médiane, au niveau 5 de la mine en **~1 h 50**, au niveau 6 en **~3 h 25** et au niveau 7 en **~5 h 55**. Le tableau ci-dessous est la mesure d'avant la hausse.

| Mesure | Minimum | Médiane | Maximum |
|---|---:|---:|---:|
| Arrivée au niveau 2 de la mine | 3,6 min | **3,9 min** | 4,1 min |
| Arrivée au niveau 3 | 23 min | **24 min** | 25 min |
| Arrivée au niveau 4 | 53 min | **54 min** | 55 min |
| Arrivée au niveau 5 | 1 h 39 | **1 h 40** | 1 h 43 |
| Arrivée au niveau 6 | 2 h 50 | **2 h 57** | 2 h 58 |
| Arrivée au niveau 7 | 4 h 50 | **5 h 08** | 5 h 34 |
| Trajet Mine → Marché | 0,3 min | 0,5 min | 1,1 min |
| Rails électriques | 14 min | 15 min | 15 min |
| Ventes à la main | 5 | 8 | 29 |
| Niveau 3 du joueur | 0,5 min | 0,5 min | 0,6 min |
| Niveau 5 du joueur | 14 min | **15 min** | 15 min |
| Niveau 10 du joueur | 1 h 39 | **1 h 40** | 1 h 43 |
| Niveau 13 du joueur | 2 h 14 | 2 h 19 | 2 h 20 |
| Niveau 15 du joueur | 2 h 50 | **2 h 57** | 2 h 58 |

(La médiane est celle de `bot.test.ts` : la 6e des 10 parties, rangées de la plus rapide à la plus lente. Les niveaux 2 à 5 n'ont pas bougé : ce qui a changé le 26/10 arrive après.)

À la fin (médianes) : le joueur au **niveau 15** (14 gemmes gagnées, qu'il ne dépense pas), 6 mineurs, 1 pousseur et 1 joaillier, environ 3 000 voyages de wagonnet, 3,4 millions $ gagnés, environ 8 000 lingots fondus et 400 bijoux taillés (de 370 à 1 600 selon les parties). Il finit avec la pioche en rubis, l'ascenseur au niveau 3, le coffre de 10 000 places, la fonderie au niveau 2, la joaillerie au niveau 1, le forage au niveau 2 et le générateur jamais amélioré. (Le 25/10, la partie s'arrêtait au niveau 5, vers 1 h 40 : niveau 10 du joueur, 4 mineurs, environ 980 voyages, 270 000 $ gagnés.)

Pour mémoire, avant l'économie revue (25/10) : niveau 3 en 32 min, niveau 4 en 1 h 39, niveau 5 en 4 h. Le 30/10 (avant la grande mise à jour) : niveau 2 en 20,8 min, niveau 5 en 8 h 29, rails électriques en 55 min (médianes).

## Durées de jeu attendues

| Repère | Valeur | Source |
|---|---|---|
| Niveau 2 de la mine | **2 à 10 min** (médiane) ; mesuré : 3,9 min | `bot.test.ts` |
| Niveau 5 de la mine | **1 h à 3 h** (médiane) ; mesuré : ~1 h 50 (26/10, avec la hausse ; avant 1 h 40) ; un vrai joueur plutôt 2 h 30 à 4 h (25/10, économie revue ; avant 3 h à 6 h, mesuré 4 h) | `bot.test.ts` |
| Niveau 6 de la mine | mesuré : ~3 h 25 (26/10, avec la hausse ; avant : 2 h 57) | `bot.ts` |
| Niveau 7 de la mine (le dernier) | **4 h à 9 h** (médiane) ; mesuré : ~5 h 55 (26/10, avec la hausse ; avant : 5 h 08) | `bot.test.ts` |
| Rails mine → marché | moins de 10 min | `bot.test.ts` |
| Rails électriques | moins de 1 h 30 ; mesuré : 15 min | `bot.test.ts` |
| Niveau 5 / niveau 10 du joueur | après 8 min / après 1 h (médianes) ; mesuré : 15 min / 1 h 40 | `bot.test.ts` |
| Remplir le coffre de départ (débit seul) | 8 min 20 | `NIVEAUX_COFFRE`, `NIVEAUX_MINE` |
| Une paie d'employé | 5 min | `SECONDES_PAR_PAIE` |
| Un charbon dans la foreuse / une redstone dans le générateur / un charbon dans le four de la fonderie | 20 s / 30 s / 12 s | `SECONDES_PAR_CHARBON`, `SECONDES_PAR_REDSTONE`, `SECONDES_PAR_CHARBON_FONDERIE` |
| Un bijou (joaillier commun) | 10 s au niveau 1 de la joaillerie, 5,7 s au niveau 5 | `SECONDES_PAR_BIJOU`, `NIVEAUX_JOAILLERIE` |
| Remplir le chariot de la foreuse | 50 à 67 s (même niveau de forage et de chariot), sans électricité | `NIVEAUX_CHARIOT`, `NIVEAUX_FORAGE` |
| Un trajet de la caisse de l'ascenseur | 6 s (niveau 1) à 1,3 s (niveau 7) | `NIVEAUX_ASCENSEUR` |
| Rattrapage hors ligne | 8 h au plus | `ABSENCE_MAX`, `absence.ts` |
| Le manager éveillé | 30 min, 1 h ou 2 h | `NIVEAUX_MANAGER` |
