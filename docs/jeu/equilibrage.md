# Équilibrage : toutes les données et les formules

> Toutes les tables chiffrées du jeu et les formules, réunies au même endroit, d'après le code au **25/10 (la grande mise à jour)** : `src/jeu/donnees.ts`, `mine.ts`, `mineur.ts`, `employes.ts`, `wagonnet.ts`, `generateur.ts`, `foreuse.ts`, `gemmes.ts`, `niveaux.ts`, `village.ts`, `batiments.ts`, `revenu.ts`, `absence.ts`, `bot.ts`, `bot.test.ts`.
> Ce qui a changé le 25/10 : plus de sac ni de bazar (le coffre se vend depuis la mine), la mine sort des blocs dès le niveau 1, un début bien moins cher (80 $ au départ, premier mineur à 50 $), **tout a 5 niveaux** et le niveau N de chaque chose demande la mine au niveau N (les **paliers**), le niveau du joueur plafonné à 15, une clairière de 40 × 40, et les **gemmes**. Tous les prix ont été revus.
> (25/10, demandé par le propriétaire) Économie revue : les paliers 3 à 5 coûtent 2 à 4 fois moins cher, les embauches aussi, pour moins attendre et moins cliquer.
> Pour le fonctionnement de chaque bâtiment, voir les fiches de [../batiments/](../batiments/README.md). Pour le concept et la progression en un coup d'œil, voir [vue-d-ensemble.md](vue-d-ensemble.md).

Conventions : « bloc/s » = blocs par seconde ; les distances au village sont en **cases** de la grille. Les niveaux affichés commencent à 1 ; dans le code, la plupart sont des index qui commencent à 0 (coffre, générateur, forage, chariot, pioches). La colonne **« Palier »** donne le niveau de la mine qu'il faut (`palierRequis` : le niveau N demande la mine au niveau N). Tout achat peut aussi se payer en **gemmes** (voir [Les gemmes](#les-gemmes)).

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
10. [Les employés](#les-employés)
11. [Le village : constructions, rails et chemins](#le-village)
12. [Les gemmes](#les-gemmes)
13. [Revenus par seconde](#revenus-par-seconde)
14. [Ce que coûte chaque niveau de la mine](#ce-que-coûte-chaque-niveau-de-la-mine)
15. [Le niveau du joueur](#le-niveau-du-joueur)
16. [Le bot de simulation](#le-bot-de-simulation)
17. [Durées de jeu attendues](#durées-de-jeu-attendues)

---

## Constantes générales

| Constante | Valeur | Rôle |
|---|---|---|
| Argent au départ (`creerPartie`) | 80 $ | de quoi poser le Personnel (40 $) et, avec une première vente, embaucher le premier mineur (50 $) |
| `NIVEAU_MINE_MAX` | 5 | niveaux de la mine |
| `NIVEAUX_PAR_AMELIORATION` | 5 | niveaux de **toutes** les améliorations (25/10 ; les chefs : 3, `PALIER_CHEF`) |
| `CLICS_MAINS_NUES` | 2 | clics par bloc avec une pioche cassée |
| `SECONDES_ECHELLE` | 10 s | un trajet de mineur sans ascenseur (très vieilles parties seulement) |
| `SECONDES_VIDAGE_EMPLOYE` / `SECONDES_CHARGEMENT_ASCENSEUR` | 2 s / 1 s | (les temps de la caisse de l'ascenseur sont maintenant dans `NIVEAUX_ASCENSEUR`) |
| `SECONDES_PAR_PAIE` | 300 s | une paie d'employé (5 minutes) |
| `SECONDES_PAR_CHARBON` | 20 s | un charbon dans la foreuse |
| `SECONDES_PAR_REDSTONE` | 30 s | une redstone dans le générateur |
| `SECONDES_CHARGEMENT_WAGONNET` | 1 s | charger un wagonnet au départ, puis le vider à l'arrivée |
| `TAILLE_GRILLE` | 40 | la clairière fait 40 × 40 cases (25/10 ; avant 60 × 60) |
| `PAS_MAX` (`temps.ts`) | 60 s | une longue durée avance par morceaux d'une minute |
| Absence max (`ABSENCE_MAX`, `usePartie.ts`) | 8 h | temps rattrapé au retour |
| `VERSION_ETAT` | 29 | version de la sauvegarde (25/10 ; voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md)) |
| `NIVEAU_JOUEUR_MAX` | 15 | le niveau du joueur le plus haut (25/10 ; avant 30) |
| `GEMMES_PAR_NIVEAU` / `GEMMES_PAR_PUB` | 3 / 1 | gemmes par niveau du joueur gagné / par publicité regardée |
| `SECONDES_PUB` | 30 s | la (fausse) publicité |

## Les blocs

`BLOCS` dans `donnees.ts`. « Minerai » = une pioche peut le doubler.

| Bloc | Prix | Minerai | Rare (`MINERAIS_RARES`) |
|---|---:|:---:|:---:|
| Pierre | 1 $ | non | non |
| Charbon | 5 $ | oui | non |
| Fer | 12 $ | oui | non |
| Redstone | 15 $ | oui | non |
| Or | 35 $ | oui | oui |
| Émeraude | 80 $ | oui | oui |
| Diamant | 100 $ | oui | oui |

Les prix ne changent jamais (pas de prix variables). Une vente = la somme des prix, arrondie, × 2 pendant le bonus « Ventes × 2 » (`valeurDe`).

## Les niveaux de la mine

`NIVEAUX_MINE`. Les poids de chaque niveau font 100 : ce sont les chances en %. Un bloc est tiré avec `tirerBloc(niveau, aleatoire)` (`choisirPondere`), pour chaque clic, chaque bloc de la mine toute seule, chaque bloc d'un mineur et chaque bloc de la foreuse.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Diamant | Débit (bloc/s, 25/10) | Valeur moyenne d'un bloc |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | 0,2 | 3,04 $ |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | 0,3 | 4,58 $ |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | 0,4 | 7,50 $ |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | 0,5 | 13,07 $ |
| 5 | Cœur de diamant | 40 | 11 | 12 | 12 | 12 | 8 | 5 | 0,6 | 19,79 $ |

- **Valeur moyenne** (`valeurMoyenneBloc(niveau, doublement = 0)`) = Σ chance × prix × (1 + doublement si c'est un minerai). Avec la pioche en diamant (45 %), un clic au niveau 5 vaut en moyenne 19,79 + 0,45 × (19,79 − 0,40) ≈ **28,5 $**.
- **Débit** : la mine sort toute seule `debit` blocs par seconde dans le coffre, tant qu'il a de la place (`avancerMine`, `debitMine`), **dès le niveau 1** (25/10 ; avant, 0 au niveau 1 puis 0,25 à 0,4). Jamais doublés. × 2 pendant le bonus « Production × 2 ».

| Pour aller au niveau | Prix (`cout`, 25/10) | Niveau du joueur | Ce qui se débloque |
|---|---|---:|---|
| 2 | 800 $ + 40 fer | 3 | Foreuse, Générateur ; palier 2 ; 2 mineurs |
| 3 | 6 000 $ + 100 fer + 40 redstone | 5 | Manager ; palier 3 ; 3 mineurs |
| 4 | 22 000 $ + 100 redstone + 50 or | 7 | Recruteur ; palier 4 ; 4 mineurs |
| 5 | 80 000 $ + 90 or + 35 émeraude | 9 | (le dernier niveau : le diamant) ; palier 5 ; 5 mineurs |

Total pour aller au niveau 5 : **108 800 $ + 140 fer + 140 redstone + 140 or + 35 émeraude** (25/10, économie revue : avant 402 800 $ ; avant le 25/10 : 122 900 $ + 165 fer + 180 redstone + 170 or + 40 émeraude, mais chaque amélioration avait ses propres niveaux du joueur). Chaque niveau donne aussi **1 mineur de plus** au maximum.

## Le coffre et la vente

`NIVEAUX_COFFRE` (25/10) :

| Niveau | Places | Prix | Palier |
|---|---:|---|---:|
| 1 | 100 | (départ) | — |
| 2 | 300 | 200 $ + 40 pierre | 2 |
| 3 | 800 | 2 000 $ + 80 fer | 3 |
| 4 | 2 000 | 6 000 $ + 60 redstone + 20 or | 4 |
| 5 | 5 000 | 18 000 $ + 60 or + 20 émeraude | 5 |

Total : 26 200 $ + 40 pierre + 80 fer + 60 redstone + 80 or + 20 émeraude.

- **Plein** : plus de clic, plus de débit, et la caisse de l'ascenseur attend pour se vider.
- **Payer** (`disponible`, `payerMateriaux`) : les minerais d'un prix se prennent **dans le coffre** (25/10 : il n'y a plus de sac).
- **Vendre** (25/10, `vendreCoffre`, `vendreMinerai`) : depuis le panneau de la mine, **au prix du marché** (`valeurDe`), sans marcher. « Tout vendre » vend tout le coffre **sauf ce qu'on garde** (`aVendreDuCoffre`). La **punaise 📌** d'un minerai (`basculerGarderTout`) le garde en entier (`GARDER_TOUT` = 1 milliard dans `coffre.garder`) : ni « Tout vendre », ni le wagonnet ne l'emportent. « Vendre » sur la ligne d'un minerai le vend même s'il est épinglé. L'argent compte dans `stats.argentGagne`.
- À débit seul, le coffre de départ (100 places) est plein en **8 min 20** au niveau 1 ; un coffre de 5 000 places en **2 h 19** au niveau 5 (0,6 bloc/s), sans compter les clics et les mineurs.

## Les pioches et le clic

`PIOCHES`. Un clic casse **un bloc** (deux clics si la pioche est cassée) : pas de temps de casse, pas de vitesse.

| Pioche | Doublement | Durabilité | Prix (débloquer / racheter, 25/10) | Palier | Réparation (pioche cassée) |
|---|---:|---:|---|---:|---|
| Pierre | 10 % | 150 | 10 $ + 20 pierre (offerte, pas rachetable dans l'interface) | — | 5 $ + 10 pierre |
| Fer | 20 % | 300 | 300 $ + 20 fer | 2 | 30 $ + 5 fer |
| Or | 30 % | 500 | 2 500 $ + 30 or | 3 | 150 $ + 5 or |
| Émeraude | 38 % | 750 | 6 000 $ + 25 émeraude | 4 | 300 $ + 4 émeraude |
| Diamant | 45 % | 1 000 | 15 000 $ + 15 diamant | 5 | 600 $ + 3 diamant |

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

| Niveau | Trajet | Charge / vide | Caisse | Remonte au plus | Prix (25/10) | Palier |
|---|---:|---:|---:|---:|---|---:|
| 1 | 6 s | 1 s / 2 s | 15 blocs | 1 bloc/s | (dès le début) | — |
| 2 | 4,5 s | 0,9 s / 1,8 s | 25 | 2,1 bloc/s | 700 $ + 30 fer | 2 |
| 3 | 3,5 s | 0,8 s / 1,5 s | 40 | 4,3 bloc/s | 3 000 $ + 90 fer + 30 redstone | 3 |
| 4 | 2,6 s | 0,6 s / 1,2 s | 60 | 8,6 bloc/s | 8 000 $ + 100 redstone + 40 or | 4 |
| 5 | 2 s | 0,4 s / 0,8 s | 90 | 17,3 bloc/s | 22 000 $ + 80 or + 30 émeraude | 5 |

Total : 33 700 $ + 120 fer + 130 redstone + 120 or + 30 émeraude. Sous l'électricité du générateur (mine dans le rayon), les trajets sont plus courts. Ce que creusent les mineurs d'un palier (communs, pioche du palier, `maxEmployes` mineurs) : 0,5 ; 1,5 ; 3 ; 5,2 ; 8,5 bloc/s : l'ascenseur du même palier suit, avec de la marge pour les mineurs rares.

## Les rails et les wagonnets

| Constante | Valeur |
|---|---|
| `COUT_RAIL` | 3 fer la case (à partir du niveau 2 du joueur), rendus quand on retire le rail |
| `VITESSE_POUSSE_JOUEUR` | 3 cases/s |
| `VITESSE_POUSSE_MINEUR` | 2,5 cases/s × la vitesse du pousseur (`NIVEAUX_POUSSEUR`) × sa rareté (`forcePousseur`) |
| électrique | la vitesse du pousseur × (1 + bonus du générateur) : × 1,3 à × 1,75 |
| sur sa lancée (électrique sans courant) | 1,25 case/s |

**Le chariot de chaque pousseur** (`NIVEAUX_CHARIOT_POUSSEUR`, au Personnel, argent et fer) et **sa vitesse** (`NIVEAUX_POUSSEUR`, argent) :

| Niveau | Places | Prix du chariot | Vitesse | Prix de la vitesse | Palier |
|---|---:|---|---|---:|---:|
| 1 | 20 | (de base) | Débutant × 1 | (de base) | — |
| 2 | 40 | 800 $ + 40 fer | Costaud × 1,2 | 600 $ | 2 |
| 3 | 70 | 2 500 $ + 100 fer | Robuste × 1,4 | 2 000 $ | 3 |
| 4 | 110 | 6 000 $ + 200 fer | Expert × 1,65 | 5 000 $ | 4 |
| 5 | 170 | 15 000 $ + 400 fer | Champion × 1,9 | 12 000 $ | 5 |

(25/10 : 5 niveaux, et plus de prix « × le niveau du joueur ». Le joueur qui pousse lui-même a le premier chariot, 20 places.)

- **Trajets** (`LIAISONS`) : Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché, un wagonnet chacun, créés gratuitement par le joueur. Il faut **un pousseur payé** pour qu'un trajet roule tout seul, même électrique.
- **Ligne** (`railsEntre`, `ligneDe`) : la suite de rails continue d'une case collée au bâtiment de départ à une case collée à celui d'arrivée, jamais en boucle (`feraitUneBoucle`). **Longueur d'un trajet** = cases de la ligne + 1 (`longueurTrajet`).
- **Aller-retour** (`secondesAllerRetour`) = `2 × longueur ÷ vitesse + 2 × 1 s`.
- **Chargement**, jusqu'à la capacité (un peu de chaque objet s'il n'a pas la place pour tout, `repartir`) :
  - Mine → Marché : le coffre, **sauf les minerais épinglés 📌**, les objets décochés dans la fenêtre du trajet, et le charbon et la redstone qui manquent à la foreuse et au générateur (si leurs trajets ont un pousseur) ;
  - Mine → Foreuse : dès que le réservoir n'est plus plein, tout le charbon du coffre ; le surplus va dans le chariot de la foreuse ;
  - Mine → Générateur : la redstone qui manque à sa réserve ;
  - Foreuse → Marché : le chariot de la foreuse.
- **Électrique** (`trajetElectrique`) : toutes les cases du trajet dans le rayon, générateur allumé avec de la redstone.

## Le générateur

`NIVEAUX_GENERATEUR` (25/10 : rayon de 12 à 30 cases, pour la clairière de 40 × 40) :

| Niveau | Rayon (cases) | Bonus | Réserve | Prix | Palier |
|---|---:|---:|---:|---|---:|
| 1 | 12 | + 30 % | 5 min | le bâtiment : 3 500 $ + 80 fer + 30 redstone | 2 |
| 2 | 16 | + 40 % | 7 min | 4 000 $ + 80 fer + 40 redstone | 2 |
| 3 | 20 | + 50 % | 10 min | 8 000 $ + 150 fer + 90 redstone | 3 |
| 4 | 25 | + 60 % | 13 min | 15 000 $ + 250 fer + 180 redstone | 4 |
| 5 | 30 | + 75 % | 16 min | 35 000 $ + 400 fer + 350 redstone | 5 |

Améliorations (niveaux 2 à 5) : 62 000 $ + 880 fer + 660 redstone.

- **Consommation** : 1 redstone = 30 s, soit 2 par minute, **120 par heure**, quel que soit le niveau.
- **Rayon** : une case est dedans si `distance(centre de la case, centre du générateur) ≤ rayon`.
- Le bonus accélère d'autant l'ascenseur de la mine (si elle est dans le rayon), le pousseur d'un trajet électrique et la foreuse (`multiplicateurGenerateur`, 1,3 à 1,75).
- Au niveau 2 de la mine, la mine seule sort 0,3 × 10 % = 1,8 redstone par minute : presque ce que brûle le générateur. Les clics et les mineurs font le reste.

## La foreuse

`NIVEAUX_FORAGE` et `NIVEAUX_CHARIOT` (25/10 : 5 niveaux chacun) :

| Niveau | Forage (bloc/s) | Réservoir | Prix du forage | Chariot | Prix du chariot | Palier |
|---|---:|---:|---|---:|---|---:|
| 1 | 0,5 | 15 charbons (5 min) | (le bâtiment : 2 500 $ + 100 pierre + 50 fer) | 25 | (de base) | 2 |
| 2 | 1 | 22 (7 min 20) | 3 000 $ + 50 fer + 20 redstone | 50 | 4 000 $ + 60 fer | 2 |
| 3 | 1,6 | 30 (10 min) | 6 000 $ + 100 fer + 60 redstone | 90 | 7 000 $ + 120 fer + 40 redstone | 3 |
| 4 | 2,4 | 40 (13 min 20) | 14 000 $ + 150 redstone + 40 or | 140 | 14 000 $ + 150 redstone + 50 or | 4 |
| 5 | 3,4 | 50 (16 min 40) | 30 000 $ + 80 or + 20 émeraude | 200 | 30 000 $ + 100 or + 25 émeraude | 5 |

Total du forage : 53 000 $ + 150 fer + 230 redstone + 120 or + 20 émeraude. Total du chariot : 55 000 $ + 180 fer + 190 redstone + 150 or + 25 émeraude.

- **Charbon** : 1 charbon = 20 s de forage, quelle que soit la vitesse (3 charbons par minute).
- **Vitesse** = forage × bonus du générateur (dans le rayon) × 2 pendant le bonus « Production × 2 ».
- **Le chariot se vend sur place** (25/10, `vendreChariot`), au prix du marché, ou le wagonnet Foreuse → Marché l'emporte. L'argent compte dans `argentForeuse` (vendu sur place) ou `argentWagonnet` (par le wagonnet).
- **Ce qu'elle rapporte** : vitesse × valeur moyenne d'un bloc. Au niveau 2 de la mine, forage de base : 0,5 × 4,58 ≈ 2,3 $/s. Tout au maximum (mine niveau 5, forage 3,4, générateur + 75 %) : 5,95 bloc/s × 19,79 ≈ **118 $/s**.
- **Temps pour remplir le chariot** (`secondesPourRemplir`) = capacité ÷ vitesse : **50 à 60 s** quand forage et chariot ont le même niveau (sans électricité).

## Les employés

### Équipe, embauche, licenciement

- **Nombre max de mineurs** (`maxEmployes`) = 1 + (niveau de la mine − 1) : **1, 2, 3, 4, 5**. Les pousseurs ne comptent pas (un par trajet au plus, 4, `maxPousseurs`).
- **Prix de la n-ième embauche** (25/10, selon le nombre qu'on a de ce métier ; arrondi à la dizaine sous 1 000 $, à la centaine au-dessus) :
  - mineurs (`PRIX_EMBAUCHE`) : **50, 800, 3 000, 8 000, 20 000 $** (puis 45 000, 100 000, 220 000, 500 000 et 1 000 000 $, et × 2,2 au-delà de la liste ; 25/10, économie revue : avant 50, 1 200, 7 000, 25 000, 80 000 $) ;
  - pousseurs (`PRIX_EMBAUCHE_POUSSEUR`) : **300, 1 000, 2 500, 5 000 $** (avant l'économie revue : 300, 1 500, 5 000, 12 000 $).
- **Indemnités** (`indemnites`) = 40 % (`PART_INDEMNITES`) du prix de la dernière place de son métier : mineurs 20 $, 320 $, 1 200 $, 3 200 $, 8 000 $ (pour 1 à 5 mineurs) ; pousseurs 120 $, 400 $, 1 000 $, 2 000 $.
- **Remplacer un mineur** (avec le recruteur, `prixRemplacement`) = le plus cher entre le quart de la dernière place possible (`maxEmployes`) et 200 $ × (niveau du joueur)² ; sans indemnités. Par exemple 9 800 $ au niveau 7 du joueur et 45 000 $ au niveau 15.

### Le travail des mineurs

`NIVEAUX_EMPLOYE` (en argent, au Personnel) × la rareté (`RARETES`). Salaire : `SALAIRES`, toutes les 5 minutes.

| Pioche | Creuse | Sac | Prix (25/10) | Palier | Salaire / 5 min |
|---|---:|---:|---:|---:|---:|
| Bois | 0,5 bloc/s | 10 | (de base) | — | 120 $ |
| Fer | 0,75 | 18 | 400 $ | 2 | 300 $ |
| Or | 1 | 28 | 2 500 $ | 3 | 700 $ |
| Émeraude | 1,3 | 40 | 7 000 $ | 4 | 1 300 $ |
| Diamant | 1,7 | 55 | 18 000 $ | 5 | 2 600 $ |

(25/10 : 5 pioches au lieu de 6, la pierre est retirée.) Les pioches de tous les niveaux pour un mineur : 27 900 $.

- **Blocs par seconde d'un mineur** (`blocsParSecondeEmploye`) = ce qu'il creuse × `min(1, ce que remonte l'ascenseur ÷ ce que creusent tous les mineurs payés)` (`partRemontee`), × 2 pendant « Production × 2 ».
- **Salaire** (`salaireEmploye`) = `arrondi(SALAIRES[pioche] × rareté.salaire)`. Sans manager, on paie au plus 5 minutes d'avance (au prorata du temps manquant).
- **Rentabilité** : un mineur commun en bois au niveau 1 de la mine sort 0,5 × 3,04 ≈ 1,5 $/s pour 0,4 $/s de salaire (environ 26 %) ; en diamant au niveau 5 : 1,7 × 19,79 ≈ 33,6 $/s pour 8,7 $/s (26 %). Une meilleure pioche rapporte toujours plus qu'elle ne coûte en salaire.

### Les pousseurs

- **Salaire** : 400 $ toutes les 5 minutes, + 250 $ par niveau de vitesse et + 200 $ par niveau de chariot (× sa rareté) : de 400 $ à 2 200 $ (`SALAIRE_POUSSEUR_BASE`, `SALAIRE_POUSSEUR_PAR_VITESSE`, `SALAIRE_POUSSEUR_PAR_CHARIOT`).
- **Rareté** : un pousseur pousse × `forcePousseur` = 1 + (rendement − 1) ÷ 2 (rare × 1,25, épique × 1,5, légendaire × 2, mythique × 3).

### Raretés (`RARETES`)

| Rareté | Rendement | Salaire |
|---|---:|---:|
| Commun | × 1 | × 1 |
| Rare | × 1,5 | × 1,4 |
| Épique | × 2 | × 1,8 |
| Légendaire | × 3 | × 2,5 |
| Mythique | × 5 | × 4 |

### Recruteur (`NIVEAUX_RECRUTEUR`, 3 niveaux)

| Niveau | Prix (25/10) | Palier (`PALIER_CHEF.recruteur`) | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 (embauche) | 10 000 $ | 4 | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 25 000 $ | 5 | 57 % | 23 % | 12 % | 6 % | 2 % |
| 3 | 50 000 $ | 5 | 50 % | 25 % | 14 % | 8 % | 3 % |

Total : 85 000 $ (25/10, économie revue : avant 245 000 $). Sans recruteur, 100 % de communs. Le tirage part du plus rare (`tirerRarete`).

### Manager (`NIVEAUX_MANAGER`, 3 niveaux)

`PRIX_MANAGER` = **5 000 $** (palier 3 ; 25/10, économie revue : avant 8 000 $), `SALAIRE_MANAGER` = 400 $ / 5 min. Il reste éveillé **30 min**, puis **1 h** (12 000 $, palier 4) et **2 h** (30 000 $, palier 5), jeu ouvert ou fermé, puis il s'endort jusqu'à ce qu'on le réveille. Total : 47 000 $. Il paie 5 minutes de plus à chacun (lui d'abord, puis les employés du moins cher au plus cher) dès qu'il lui reste moins de 60 s payées (`SECONDES_AVANT_PAIE_MANAGER`), avec l'argent du joueur.

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

Plus de niveau du joueur pour les bâtiments (25/10 : tous au niveau 1 ; seule la mine niveau 2 compte pour la foreuse et le générateur). Le **bazar** est retiré. Tous les bâtiments : **6 070 $ + 115 pierre + 130 fer + 30 redstone**. On paie une seule fois ; déplacer ou retourner est gratuit ; on ne peut pas enlever un bâtiment.

### Rails et chemins

| Élément | Prix | Remarques |
|---|---|---|
| 🛤️ Rail (1 case) | **3 fer** (`COUT_RAIL`) | à partir du niveau 2 du joueur ; remboursé (dans le coffre) quand on le retire |
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
- **Prix en gemmes** d'un achat (`prixEnGemmes`) (25/10) = `arrondi(3 + 2,4 × (log10(valeur en $) − 2))`, entre **3 et 10** (3 à 10 publicités), la valeur comptant l'argent et les minerais à leur prix (`valeurEnDollars`) : 100 $ → 3 💎, 1 000 $ → 5 💎, 10 000 $ → 8 💎, à partir d'environ 51 000 $ (comme la mine niveau 5, 85 950 $) → 10 💎.
- **Boutique** (`BOOSTS`, 25/10) : Production × 2, Ventes × 2 et Employés × 2 (15 min chacun) et Fortune (× 3 blocs par clic, 5 min), **3 💎** chacun ; plus de trésor.
- **Cadeau du jour** (25/10) : plus d’argent ; chaque jour des gemmes (2 à 12, 35 par semaine) et un bonus de la boutique (Employés × 2, Ventes × 2, Production × 2, de 10 à 60 min) : voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md#4-le-cadeau-du-jour-recompensesquotidiennestsx).
- **Absence × 2** (`doublerAbsence`) : une publicité redonne tout ce que l'absence a rapporté (l'argent gagné, plus la valeur de ce qui attend en plus dans le coffre et le chariot).

## Revenus par seconde

`revenuParSeconde(etat)` (`revenu.ts`) donne l'indicateur « $/s » du bandeau. C'est la **valeur de ce qui sort de la mine** (il faut encore la vendre), une moyenne :

- **mine** = débit × valeur moyenne d'un bloc (0 si le coffre est plein) ;
- **mineurs** = pour chaque mineur **payé** : blocs par seconde × valeur moyenne, **moins** son salaire ÷ 300 ; moins le salaire des pousseurs et du manager ÷ 300. Coffre plein : seulement les salaires ;
- **foreuse** = vitesse × valeur moyenne, si elle tourne ;
- **total** = mine + mineurs + foreuse. Les **clics ne comptent pas**, ni les wagonnets (ils ne font que porter).

Ce que fait la mine seule : **0,61 $/s** au niveau 1, 1,37 au niveau 2, 3,00 au niveau 3, 6,54 au niveau 4, **11,87 $/s** au niveau 5.

## Ce que coûte chaque niveau de la mine

Ce qu'il faut pour descendre, et ce que coûte tout le palier (un niveau de chaque amélioration, sans les embauches ni les chefs) :

| Palier | Pour y descendre | Tout le palier (coffre, pioche, ascenseur, 1 pioche de mineur, vitesse et chariot d'un pousseur, forage, chariot de la foreuse, générateur) |
|---:|---|---|
| 1 | — | bâtiments du départ (Personnel, Forgeron) : 70 $ + 15 pierre ; rails : 3 fer la case |
| 2 | 800 $ + 40 fer | 14 000 $ (20 000 $ avec la foreuse et le générateur à poser) + des minerais |
| 3 | 6 000 $ + 100 fer + 40 redstone | 35 500 $ + des minerais |
| 4 | 22 000 $ + 100 redstone + 50 or | 81 000 $ + des minerais |
| 5 | 80 000 $ + 90 or + 35 émeraude | 195 000 $ + des minerais |

Tout au maximum (coffre, pioches, ascenseur, générateur, forage, chariot de la foreuse, recruteur, manager) : environ **390 000 $** (avant l'économie revue du 25/10 : 1 million), plus 27 900 $ par mineur (ses pioches), 43 900 $ par pousseur (vitesse et chariot) et les embauches. Plus les niveaux de la mine (108 800 $).

## Le niveau du joueur

Tout est expliqué dans [niveaux.md](niveaux.md). En bref :

- **XP** (`XP_PAR`) : 1 pour 3 blocs cassés en cliquant, 70 par bâtiment, 3 par case de rails, 30 par trajet, 40 par embauche, 30 par niveau d'amélioration, 150 par niveau de mine, et 1 par 25 $ de ce qu'on a acheté (`VALEUR_PAR_XP`). Chaque chose ne compte qu'une fois (`recordsXp`). Rien pour ce qui se fait tout seul.
- **Courbe** : `xpPourPasser(n) = 60 × n^1,8`, arrondi à la dizaine : 60 XP pour passer au niveau 2, 210 pour le 3… Il faut 1 430 XP au total pour le niveau 5, 11 680 pour le 10, **38 230 pour le 15** (le maximum).
- **Déblocages** (`NIVEAU_JOUEUR_POUR`) : rails au niveau 2 ; mine niveaux 2 à 5 aux niveaux 3, 5, 7, 9. Chaque niveau rapporte 1 gemme (25/10 : 3 avant).

## Le bot de simulation

`src/jeu/bot.ts` (`jouerPartie(aleatoire, maxSecondes = 12 h)`) joue une partie avec seulement des actions qu'un joueur peut faire, jusqu'au **niveau 5** de la mine. Il gagne de l'XP comme un joueur et attend ses niveaux et ses paliers. `bot.test.ts` le fait jouer **10 parties** avec des graines fixes (1 à 10, générateur `mulberry32` : les résultats sont toujours les mêmes). Il ne se sert pas des gemmes.

### Ce qu'il fait

- **Chaque seconde** : il règle ce qu'il garde, achète ce qu'il peut, vend si besoin, puis **clique 2 fois** sur le bloc de la mine et laisse passer 1 s de jeu (`avancerTemps`).
- **Le village** (`PLAN_DU_BOT`, autour de la mine posée en 15, 15) : le **Personnel** en (9, 21), le **marché** en (18, 28), juste sous la mine, le **forgeron** (26, 14), le **générateur** (25, 27) et la **foreuse** (26, 21). Il pose **3 cases de rails** (20, 25 à 27) entre la mine et le marché dès qu'elles sont débloquées, puis y crée le trajet Mine → Marché et y embauche un pousseur.
- **Vendre** (25/10 : depuis la mine, plus de marche) : tant que le wagonnet ne roule pas, il vend le coffre (et le chariot de la foreuse) quand le coffre est à moitié plein ; avec le wagonnet, au-delà de 85 %.
- **Ce qu'il garde** (`reglerGarde`, dans `coffre.garder`) : les minerais du prochain coffre, du prochain niveau de mine, des rails, de la réparation, du prochain bâtiment, de 20 redstone pour le générateur et de la prochaine pioche, tant que ça tient dans 70 % du coffre.
- **Les achats** : réparer, pioche suivante, niveau de mine dès qu'il peut, salaires dès que quelqu'un a moins d'une minute payée (et réveiller le manager à mi-fatigue), embaucher et améliorer les mineurs en gardant une paie d'avance, recruteur, manager à partir de 15 000 $, un pousseur pour Mine → Marché (et son chariot quand le coffre se remplit), générateur rempli de redstone et amélioré à 2 fois son prix, foreuse remplie de charbon et améliorée au-dessus de 3 000 $, ascenseur (à partir de 2 mineurs) et coffre.

### Ce que vérifie `bot.test.ts`

| Test | Attendu |
|---|---|
| Fin | les 10 parties arrivent au **niveau 5** |
| Niveau 2 (médiane) | **2 à 10 minutes** (25/10 ; avant 15 à 40) |
| Niveau 5 (médiane) | **1 h à 3 h** (25/10, économie revue ; avant 3 h à 6 h, et 6 h à 9 h avant le 25/10) |
| Niveau du joueur (médianes) | le niveau 5 **après 8 minutes au moins**, le niveau 10 **après 1 heure au moins** |
| Progression | chaque niveau prend plus de temps que le précédent (médiane, à 20 % près) |
| Rails | le trajet Mine → Marché existe en **moins de 10 minutes** (toutes les parties) |
| Électricité | les rails sont électriques en **moins de 1 h 30** (toutes les parties) |
| Automatisation | au moins 4 employés, plus de 100 voyages de wagonnet, et les mineurs sortent plus de blocs que les clics |
| Début | plus de 3 ventes à la main avant le wagonnet |

### Résultats mesurés (25/10, économie revue, 10 parties)

| Mesure | Minimum | Médiane | Maximum |
|---|---:|---:|---:|
| Arrivée au niveau 2 de la mine | 3,6 min | **3,9 min** | 4,1 min |
| Arrivée au niveau 3 | 23 min | **24 min** | 25 min |
| Arrivée au niveau 4 | 53 min | **54 min** | 55 min |
| Arrivée au niveau 5 | 1 h 39 | **1 h 40** | 1 h 43 |
| Trajet Mine → Marché | 0,3 min | 0,5 min | 1,1 min |
| Rails électriques | 14 min | 15 min | 15 min |
| Ventes à la main | 5 | 8 | 29 |
| Niveau 3 du joueur | 0,5 min | 0,5 min | 0,6 min |
| Niveau 5 du joueur | 14 min | **15 min** | 15 min |
| Niveau 10 du joueur | 1 h 39 | **1 h 40** | 1 h 43 |

(La médiane est celle de `bot.test.ts` : la 6e des 10 parties, rangées de la plus rapide à la plus lente.)

À la fin (médianes) : le joueur au **niveau 10** (9 gemmes gagnées, qu'il ne dépense pas), 4 mineurs et 1 pousseur, environ 980 voyages de wagonnet, 12 000 blocs cliqués, 12 300 blocs creusés par les mineurs, 2 500 blocs sortis seuls de la mine, 270 000 $ gagnés (avant l'économie revue : niveau 14, 2 400 voyages, 790 000 $ gagnés en 4 h). Il finit avec la pioche en émeraude, l'ascenseur au niveau 2, le coffre de 2 000 places, le générateur et la foreuse jamais améliorés.

Pour mémoire, avant l'économie revue (25/10) : niveau 3 en 32 min, niveau 4 en 1 h 39, niveau 5 en 4 h. Le 30/10 (avant la grande mise à jour) : niveau 2 en 20,8 min, niveau 5 en 8 h 29, rails électriques en 55 min (médianes).

## Durées de jeu attendues

| Repère | Valeur | Source |
|---|---|---|
| Niveau 2 de la mine | **2 à 10 min** (médiane) ; mesuré : 3,9 min | `bot.test.ts` |
| Niveau 5 de la mine | **1 h à 3 h** (médiane) ; mesuré : 1 h 40 ; un vrai joueur plutôt 2 h 30 à 4 h (25/10, économie revue ; avant 3 h à 6 h, mesuré 4 h) | `bot.test.ts` |
| Rails mine → marché | moins de 10 min | `bot.test.ts` |
| Rails électriques | moins de 1 h 30 ; mesuré : 15 min | `bot.test.ts` |
| Niveau 5 / niveau 10 du joueur | après 8 min / après 1 h (médianes) ; mesuré : 15 min / 1 h 40 | `bot.test.ts` |
| Remplir le coffre de départ (débit seul) | 8 min 20 | `NIVEAUX_COFFRE`, `NIVEAUX_MINE` |
| Une paie d'employé | 5 min | `SECONDES_PAR_PAIE` |
| Un charbon dans la foreuse / une redstone dans le générateur | 20 s / 30 s | `SECONDES_PAR_CHARBON`, `SECONDES_PAR_REDSTONE` |
| Remplir le chariot de la foreuse | 50 à 60 s (même niveau de forage et de chariot), sans électricité | `NIVEAUX_CHARIOT`, `NIVEAUX_FORAGE` |
| Un trajet de la caisse de l'ascenseur | 6 s (niveau 1) à 2 s (niveau 5) | `NIVEAUX_ASCENSEUR` |
| Rattrapage hors ligne | 8 h au plus | `ABSENCE_MAX`, `absence.ts` |
| Le manager éveillé | 30 min, 1 h ou 2 h | `NIVEAUX_MANAGER` |
