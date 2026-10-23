# Équilibrage : toutes les données et les formules

> Toutes les tables chiffrées du jeu et les formules, réunies au même endroit, d'après le code au 22/10 (la mine automatique ; trajets des wagonnets le 24/10 ; **le 29/10, tous les prix relevés (environ ×2 à ×3) et le niveau du joueur**, voir [niveaux.md](niveaux.md) ; **le 30/10, salaires, embauches, sacs, pioches des mineurs et améliorations bien plus chers, début un peu moins cher, bonus de combo** : `src/jeu/donnees.ts`, `mine.ts`, `mineur.ts`, `employes.ts`, `wagonnet.ts`, `generateur.ts`, `foreuse.ts`, `village.ts`, `batiments.ts`, `revenu.ts`, `absence.ts`, `bot.ts`, `bot.test.ts`).
> Pour le fonctionnement de chaque bâtiment (boutons, messages, cas limites), voir les fiches de [../batiments/](../batiments/README.md). Pour le village vu du ciel (grille, placement, menus), voir [village.md](village.md). Pour le concept et la progression en un coup d'œil, voir [vue-d-ensemble.md](vue-d-ensemble.md).

Conventions : « bloc/s » = blocs par seconde ; les distances au village sont en **cases** de la grille. Les niveaux affichés commencent à 1 ; dans le code, la plupart sont des index qui commencent à 0 (coffre, sac, wagonnet, générateur, forage, chariot, pioches des mineurs). Plus de prestige, de bonus de vente, de talents ni d'enchantements depuis le 22/10 (archivés dans `archives/`). Depuis le 29/10, presque chaque achat demande aussi un **niveau du joueur** (colonne « Niv. joueur » ci-dessous, `NIVEAU_JOUEUR_POUR`) : une fois débloqué, il faut toujours le payer.

## Sommaire

1. [Constantes générales](#constantes-générales)
2. [Les blocs](#les-blocs)
3. [Les niveaux de la mine](#les-niveaux-de-la-mine)
4. [Le coffre](#le-coffre)
5. [Les pioches et le clic](#les-pioches-et-le-clic)
6. [Le sac à dos](#le-sac-à-dos)
7. [L'ascenseur des mineurs](#lascenseur-des-mineurs)
8. [Les rails et les wagonnets](#les-rails-et-les-wagonnets)
9. [Le générateur](#le-générateur)
10. [La foreuse](#la-foreuse)
11. [Les mineurs employés](#les-mineurs-employés)
12. [Le village : constructions, rails et chemins, trajets](#le-village)
13. [Revenus par seconde](#revenus-par-seconde)
14. [Ce que coûte chaque niveau de la mine](#ce-que-coûte-chaque-niveau-de-la-mine)
15. [Le niveau du joueur](#le-niveau-du-joueur)
16. [Le bot de simulation](#le-bot-de-simulation)
17. [Durées de jeu attendues](#durées-de-jeu-attendues)

---

## Constantes générales

| Constante | Valeur | Rôle |
|---|---|---|
| `NIVEAU_MINE_MAX` | 5 | niveaux de la mine |
| `CLICS_MAINS_NUES` | 2 | clics par bloc avec une pioche cassée |
| `SECONDES_ECHELLE` | 10 s | un trajet de mineur sans ascenseur (depuis le 30/10, la mine a son ascenseur dès le début : l'échelle ne sert plus) |
| `SECONDES_VIDAGE_EMPLOYE` | 2 s | la caisse de l'ascenseur se vide dans le coffre |
| `SECONDES_CHARGEMENT_ASCENSEUR` | 1 s | la caisse de l'ascenseur se charge au fond (23/10) |
| `SECONDES_PAR_PAIE` | 300 s | une paie de mineur (5 minutes, depuis le 28/10) |
| `SECONDES_PAR_CHARBON` | 20 s | un charbon dans la foreuse |
| `SECONDES_PAR_REDSTONE` | 30 s | une redstone dans le générateur |
| `SECONDES_CHARGEMENT_WAGONNET` | 2 s | charger un wagonnet au départ, puis le vider à l'arrivée (sans pousseur, ou pousseur débutant ; 23/10 : 1,6 / 1,2 / 0,8 / 0,5 s avec un pousseur amélioré, `NIVEAUX_POUSSEUR`, qui porte aussi × 1,25 à × 2,5) |
| `TAILLE_GRILLE` | 60 | la clairière fait 60 × 60 cases |
| Horloge (`usePartie.ts`) | tic de 50 ms | à chaque image de l'écran quand le joueur pousse un wagonnet |
| `PAS_MAX` (`temps.ts`) | 60 s | une longue durée avance par morceaux d'une minute |
| `PAS_EMPLOYES` (`employes.ts`) | 30 s | les mineurs avancent par morceaux de 30 s (le manager paie entre deux) |
| Absence max (`ABSENCE_MAX`) | 8 h | temps rattrapé au retour (résumé dans la fenêtre « Bon retour, mineur ! », `absence.ts`, 30/10) |
| `VERSION_ETAT` | 25 | version de la sauvegarde (21 : la mine automatique, 22/10, les parties d'avant repartent de zéro ; 24 : le niveau du joueur, 29/10 ; 25 : l'ascenseur dès le début et les bonus de combo, 30/10) |
| `NIVEAU_JOUEUR_MAX` | 30 | le niveau du joueur le plus haut (29/10) |

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

Les prix ne changent jamais (pas de prix variables, plus de bonus de vente). Une vente = la somme des prix, arrondie (`valeurDe`).

## Les niveaux de la mine

`NIVEAUX_MINE`. Les poids de chaque niveau font 100 : ce sont les chances en %. Un bloc est tiré avec `tirerBloc(niveau, aleatoire)` (`choisirPondere`), pour chaque clic, chaque bloc de la mine toute seule, chaque bloc d'un mineur et chaque bloc de la foreuse.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Diamant | Débit (bloc/s) | Valeur moyenne d'un bloc |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | 0 (27/10 : on creuse à la main) | 3,04 $ |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | 0,25 | 4,58 $ |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | 0,3 | 7,50 $ |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | 0,35 | 13,07 $ |
| 5 | Cœur de diamant | 40 | 11 | 12 | 12 | 12 | 8 | 5 | 0,4 | 19,79 $ |

- **Valeur moyenne** (`valeurMoyenneBloc(niveau, doublement = 0)`) = Σ chance × prix × (1 + doublement si c'est un minerai). Avec la pioche en diamant (45 %), un clic au niveau 5 vaut en moyenne 19,79 + 0,45 × (19,79 − 0,40) ≈ **28,5 $**.
- **Débit** : la mine sort toute seule `debit` blocs par seconde dans le coffre, tant qu'il a de la place (`avancerMine`). Jamais doublés.

| Pour aller au niveau | Prix (`cout`, 30/10) | Niv. joueur | Ce qui se débloque |
|---|---|---:|---|
| 2 | 900 $ + 45 fer | 4 | Foreuse, Générateur (`niveauMine: 2`) |
| 3 | 7 000 $ + 120 fer + 60 redstone | 7 | Recruteur (`NIVEAU_MINE_RECRUTEUR`) |
| 4 | 25 000 $ + 120 redstone + 60 or | 10 | Manager (`NIVEAU_MINE_MANAGER`) |
| 5 | 90 000 $ + 110 or + 40 émeraude | 13 | (le dernier niveau : le diamant) |

Total pour aller au niveau 5 : **122 900 $ + 165 fer + 180 redstone + 170 or + 40 émeraude** (29/10 : 143 200 $ + 180 fer + 180 redstone + 190 or + 55 émeraude ; avant le 29/10 : 41 900 $ + 90 fer + 90 redstone + 90 or + 25 émeraude). Chaque niveau donne aussi **2 mineurs de plus** au maximum.

## Le coffre

`NIVEAUX_COFFRE` (30/10) : 100 → **250** (250 $ + 50 pierre, niveau 2 du joueur) → **600** (2 500 $ + 100 fer, niveau 5) → **1 500** (12 000 $ + 200 fer + 60 redstone, niveau 8) → **4 000** places (50 000 $ + 120 or, niveau 12). Total : 64 750 $ + 50 pierre + 300 fer + 60 redstone + 120 or (29/10 : 35 400 $ + 80 pierre + 230 fer + 40 redstone + 60 or).

- Plein : plus de clic, plus de débit, et les mineurs attendent pour vider leur sac.
- **Payer** (`disponible`, `payerMateriaux`) : pour chaque minerai d'un prix, on prend d'abord dans le sac, puis le reste dans le coffre.

À débit seul, au niveau 1 la mine ne sort rien toute seule (27/10) ; un coffre de 4 000 places se remplit en 2 h 47 au niveau 5 (0,4 bloc/s), sans compter les clics et les mineurs.

## Les pioches et le clic

`PIOCHES`. Un clic casse **un bloc** (deux clics si la pioche est cassée) : pas de temps de casse, pas de vitesse.

| Pioche | Doublement | Durabilité | Prix (débloquer / racheter, 30/10) | Niv. joueur | Réparation (pioche cassée) |
|---|---:|---:|---|---:|---|
| Pierre | 10 % | 150 | 10 $ + 20 pierre (offerte, pas rachetable dans l'interface) | — | 5 $ + 10 pierre |
| Fer | 20 % | 300 | 400 $ + 20 fer (29/10 : 500 $ + 40 fer) | 4 | 30 $ + 5 fer |
| Or | 30 % | 500 | 4 000 $ + 40 or | 7 | 150 $ + 5 or |
| Diamant | 45 % | 1 000 | 20 000 $ + 20 diamant | 12 | 600 $ + 3 diamant |

- **Doublement** (`chanceDoublement`) : un minerai cassé en cliquant donne 2 au lieu d'1 si `aleatoire() < doublement`. 0 avec une pioche cassée. Seulement pour les clics. Un bonus de combo ajoute sa « fortune » (au plus 100 %), même avec une pioche cassée.
- **Usure** : +1 à chaque bloc cassé avec une pioche pas cassée. Cassée quand l'usure atteint la durabilité ; elle ne s'use plus ensuite.
- **Réparation** (`coutReparation`) : `part = min(1, usure / durabilité)` ; argent = `max(1, arrondi au-dessus(réparation.argent × part))`, chaque minerai = `max(1, arrondi au-dessus(n × part))`.
- **Coût de la pioche par clic** (réparer quand elle casse) : pierre 5 $ + 10 pierre / 150 clics ; fer 30 $ + 5 fer / 300 ; or 150 $ + 5 or / 500 ; diamant 600 $ + 3 diamants / 1 000. Une pioche en diamant coûte donc environ 0,9 $ par clic (avec les diamants à 100 $), pour un gain moyen de 28,5 $ par clic au niveau 5.

### Les bonus de combo (30/10)

`BONUS_COMBO`. Les clics rapprochés (moins de 0,9 s entre deux, `DELAI_COMBO` dans `PanneauMine.tsx`) font un combo. À chaque palier, le joueur gagne un bonus de quelques secondes (`activerBonusCombo`, il remplace celui en cours ; `bonusActif`, `secondesBonus` dans `mineur.ts`) :

| Palier (clics d'affilée) | Bonus | Durée | Fortune en plus | Blocs par clic |
|---:|---|---:|---:|---:|
| 10 | 🍀 Fortune | 3 s | +25 % | 1 |
| 25 | 🍀 Grande fortune | 4 s | +50 % | 1 |
| 50 | 💥 Double coup | 5 s | +25 % | 2 |
| 100 | 🔥 Frénésie | 8 s | +100 % | 2 |
| 200 | ✨ Ruée vers l'or | 10 s | +100 % | 3 |
| 500 | 🏆 Légende de la mine | 15 s | +100 % | 5 |

- **Fortune** : elle s'ajoute à la chance de doubler de la pioche (`chanceDoublement`, au plus 1).
- **Blocs par clic** : un clic range `(2 si doublé, sinon 1) × blocs` exemplaires du bloc dans le coffre (l'usure et les statistiques comptent toujours un seul bloc).
- La fin du bonus se compte en temps de jeu (`stats.tempsDeJeu`), gardée dans `etat.bonus`.

## Le sac à dos

`SACS` (au Bazar, en argent, sans plafond) :

| Niveau (code) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Places | 32 | 64 | 128 | 256 | 512 | 1 024 | 2 048 |
| Prix (30/10) | 0 | 150 $ | 1 200 $ | 6 000 $ | 25 000 $ | 90 000 $ | 300 000 $ |
| Niv. joueur | — | 3 | 5 | 8 | 11 | 14 | 15 |

Total : 422 350 $ (29/10 : 152 200 $ ; avant le 29/10 : 61 980 $). Le sac ne sert qu'à porter (coffre ou chariot → marché) et à payer.

## L'ascenseur des mineurs

`NIVEAUX_ASCENSEUR` (au panneau de la mine, onglet « Améliorer »). Un trajet = une montée ou une descente de la caisse (`secondesTrajetMineur`). Depuis le 23/10, la caisse fait des allers-retours sans cesse et remonte au plus `capacite` blocs par voyage (`capaciteAscenseur`, `debitAscenseur`). Depuis le 30/10, **la mine a son ascenseur de niveau 1 dès le début** (`creerPartie`) ; l'échelle (10 s) ne servait qu'aux vieilles parties, que la sauvegarde v25 convertit.

| Niveau | Trajet | Charge / vide (23/10) | Caisse (23/10) | Remonte au plus | Prix (30/10) | Niv. joueur |
|---|---:|---:|---:|---:|---|---:|
| 1 | 6 s | 1 s / 2 s | 15 blocs | 1 bloc/s | (dans la mine dès le début) | — |
| 2 | 4 s | 0,8 s / 1,6 s | 25 | 2,5 bloc/s | 1 500 $ + 50 fer + 10 redstone | 5 |
| 3 | 2,8 s | 0,6 s / 1,2 s | 40 | 5,4 bloc/s | 7 000 $ + 120 fer + 40 redstone | 8 |
| 4 | 2 s | 0,5 s / 0,9 s | 60 | 11,1 bloc/s | 25 000 $ + 200 fer + 100 redstone | 10 |
| 5 | 1,4 s | 0,4 s / 0,7 s | 90 | 23,4 bloc/s | 80 000 $ + 200 redstone + 60 or | 13 |
| 6 | 1 s | 0,3 s / 0,5 s | 130 | 46 bloc/s | 250 000 $ + 150 or + 30 émeraude | 15 |

Total : 363 500 $ + 370 fer + 350 redstone + 210 or + 30 émeraude (29/10, avec le niveau 1 à 400 $ + 20 fer : 161 900 $ + 330 fer + 300 redstone + 140 or + 20 émeraude).

## Les rails et les wagonnets

| Constante | Valeur |
|---|---|
| `COUT_RAIL` | 3 fer la case (à partir du niveau 3 du joueur, 29/10) |
| `VITESSE_POUSSE_JOUEUR` | 3 cases/s |
| `VITESSE_POUSSE_MINEUR` | 2,5 cases/s |
| `VITESSE_RAILS` | 8 cases/s × puissance du générateur |
| sur sa lancée (électrique sans courant) | 1,25 case/s (`VITESSE_POUSSE_MINEUR / 2`) |
| `RESERVE_GENERATEUR_WAGONNET` | 1 800 s de redstone (60 redstones) : le wagonnet Mine → Générateur remplit jusque-là |

`NIVEAUX_WAGONNET` (pour tous les wagonnets, `niveauWagonnets`, 29/10) : 40 → **100** (1 200 $ + 60 fer, niveau 6 du joueur) → **250** (6 000 $ + 150 fer + 40 redstone, niveau 9) → **600** places (25 000 $ + 80 or, niveau 12). Total : 32 200 $ + 210 fer + 40 redstone + 80 or.

- **Trajets** (`LIAISONS`) : Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché, un wagonnet chacun, créés gratuitement par le joueur.
- **Ligne** (`railsEntre`, `ligneDe`) : la suite de rails continue (voisins par un côté) d'une case collée au bâtiment de départ à une case collée à celui d'arrivée. Les rails ne font jamais de boucle (`feraitUneBoucle`) : il n'y a qu'une route. **Longueur d'un trajet** = cases de la ligne + 1 (`longueurTrajet`).
- **Aller-retour** (`secondesAllerRetour`) = `2 × longueur ÷ vitesse + 2 × 2 s`.
- **Chargement**, jusqu'à la capacité :
  - Mine → Marché : les objets du coffre les plus chers d'abord, sauf les objets gardés (`nonAVendre`), et sauf le charbon qui manque au réservoir de la foreuse et la redstone qui manque à la réserve du générateur (si ces trajets existent) ;
  - Mine → Foreuse (28/10) : dès que le réservoir de la foreuse n'est plus plein (`placeCharbonForeuse` > 0), **tout le charbon du coffre** ; à l'arrivée (`livrerCharbon`), il remplit le réservoir (`NIVEAUX_FORAGE[...].reservoir`), le surplus va dans le chariot (tant qu'il y a de la place), et le reste revient dans le coffre ;
  - Mine → Générateur : `arrondi au-dessus((1 800 − réserve du générateur) ÷ 30)` redstones, au plus ce qu'il y a dans le coffre ;
  - Foreuse → Marché : ce qui est coché dans le chariot, le plus cher d'abord (l'argent compte dans `argentWagonnet`).
- **Électrique** (`trajetElectrique`) : toutes les cases du trajet dans le rayon, générateur allumé avec de la redstone.
- Exemple : la ligne du bot (3 cases, longueur 4) : poussé par toi 6,7 s l'aller-retour, par un mineur 7,2 s, électrique au niveau 1 du générateur 5 s. Un wagonnet de 40 places électrique y emporte donc jusqu'à 8 objets par seconde, bien plus que ce que sort la mine : c'est la longueur de la ligne et la capacité qui comptent quand la mine grossit.

## Le générateur

| Niveau | Rayon (cases) | Puissance | Wagonnet électrique | Foreuse | Prix (29/10) | Niv. joueur |
|---|---:|---:|---:|---:|---|---:|
| 1 | 15 | ×1 | 8 cases/s | ×1,5 | le bâtiment : 4 000 $ + 100 fer + 40 redstone | 6 (30/10 ; avant 5) |
| 2 | 20 | ×1,3 | 10,4 cases/s | ×1,65 | 7 500 $ + 120 fer + 60 redstone | 8 |
| 3 | 26 | ×1,7 | 13,6 cases/s | ×1,85 | 20 000 $ + 220 fer + 120 redstone | 10 |
| 4 | 33 | ×2,2 | 17,6 cases/s | ×2,1 | 50 000 $ + 350 fer + 220 redstone | 13 |
| 5 | 40 | ×3 | 24 cases/s | ×2,5 | 120 000 $ + 550 fer + 420 redstone | 15 |

Améliorations (niveaux 2 à 5) : 197 500 $ + 1 240 fer + 820 redstone.

- **Consommation** : 1 redstone = 30 s, soit 2 par minute, **120 par heure**, quel que soit le niveau.
- **Rayon** : une case est dedans si `distance(centre de la case, centre du générateur) ≤ rayon`. Un trajet est électrique quand toutes ses cases sont dedans **et** que le générateur est allumé avec de la redstone (chaque trajet compte à part).
- **Foreuse** : vitesse × `(1 + BONUS_ELECTRIQUE_FOREUSE × puissance)`, avec `BONUS_ELECTRIQUE_FOREUSE` = 0,5.
- **Puisage** (`NIVEAU_GENERATEUR_AUTO` = index 1, donc le 2e niveau) : sous 300 s de réserve (`RESERVE_GENERATEUR_AUTO`), il prend dans le coffre `arrondi au-dessus((300 − réserve) ÷ 30)` redstone (au plus ce qu'il y a).
- La redstone que demande le générateur (2 / min) est petite à côté de ce que sort la mine : au niveau 2, la mine seule sort 0,25 × 10 % = 1,5 redstone par minute, et les clics et les mineurs bien plus.

## La foreuse

| Niveau | Forage (bloc/s) | Prix (29/10) | Chariot (places) | Prix (29/10) | Niv. joueur (les deux) |
|---|---:|---|---:|---|---:|
| 1 | 0,5 | (le bâtiment : 3 000 $ + 120 pierre + 60 fer) | 200 | (de base) | 5 (le bâtiment, 30/10 ; avant 6) |
| 2 | 0,8 | 3 500 $ + 50 fer + 20 redstone | 400 | 2 500 $ + 40 fer | 6 |
| 3 | 1,2 | 10 000 $ + 100 fer + 50 redstone | 800 | 7 500 $ + 80 fer + 25 redstone | 9 |
| 4 | 1,8 | 25 000 $ + 160 fer + 100 redstone | 1 600 | 20 000 $ + 150 fer + 70 redstone | 11 |
| 5 | 2,6 | 60 000 $ + 160 redstone + 50 or | 3 000 | 50 000 $ + 130 redstone + 40 or | 14 |
| 6 | 3,6 | 150 000 $ + 100 or + 25 émeraude | 6 000 | 120 000 $ + 90 or + 20 émeraude | 15 |

Total du forage : 248 500 $ + 310 fer + 330 redstone + 150 or + 25 émeraude. Total du chariot : 200 000 $ + 270 fer + 225 redstone + 130 or + 20 émeraude.

- **Charbon** : 1 charbon = 20 s de forage, quelle que soit la vitesse (3 charbons par minute).
- **Recharge automatique** (dès le forage niveau 3, `NIVEAU_RECHARGE_AUTO` = index 2) : un charbon foré est brûlé (+20 s) au lieu d'aller dans le chariot, tant que la réserve est sous 60 s (`RESERVE_RECHARGE_AUTO`).
- **Ce qu'elle rapporte** : vitesse × valeur moyenne d'un bloc au niveau de la mine. Au niveau 2 de la mine, au forage de base : 0,5 × 4,58 ≈ 2,3 $/s. Tout au maximum (niveau 5 de la mine, forage 3,6, générateur ×2,5) : 9 bloc/s × 19,79 ≈ **178 $/s**.
- **Temps pour remplir le chariot** (`secondesPourRemplir`) = capacité ÷ vitesse : 400 s au niveau 1/1, 500 s au 2/2, 667 s au 3/3, 889 s au 4/4, 1 154 s au 5/5, 1 667 s au 6/6 (sans électricité).

## Les mineurs employés

### Équipe, embauche, licenciement

- **Nombre max de mineurs** (`maxEmployes`, 23/10) = `EMPLOYES_NIVEAU_1 + EMPLOYES_PAR_NIVEAU × (niveau de la mine − 1)` = 2 + 2 × (N − 1) : **2, 4, 6, 8, 10**. Les pousseurs ne comptent pas (un par trajet au plus, `maxPousseurs`). (Avant : 4 à 12 employés, pousseurs compris.)
- **Prix de la n-ième embauche** (`PRIX_EMBAUCHE`, 30/10 : bien plus raides) : 80, 400, 1 500, 5 000, 15 000, 40 000, 100 000, 250 000, 600 000, 1 500 000 $, puis × 2,2 à chaque fois (`HAUSSE_APRES_LISTE`) : 3 300 000 $ (11e), 7 260 000 $ (12e). (29/10 : 100, 300, 800, 2 000... 240 000 $, puis × 1,6.) Arrondi à la dizaine sous 1 000 $, à la centaine au-dessus. Le prix ne dépend que de la taille actuelle de l'équipe.
- **Indemnités** (`indemnites`) = 40 % (`PART_INDEMNITES`) du prix de base de la dernière place : 30 $ pour 1 mineur, 2 000 $ pour 4, 100 000 $ pour 8, 2 904 000 $ pour 12.

### Travail

`NIVEAUX_EMPLOYE` (payés en argent, au Personnel) × la rareté (`RARETES`).

| Pioche | Creuse (23/10) | Sac | Prix | Niv. joueur | Salaire / 5 min (23/10, bis) |
|---|---:|---:|---:|---:|---:|
| Bois | 0,5 bloc/s | 10 | (de base) | — | 220 $ |
| Pierre | 0,6 | 15 | 500 $ | 4 | 450 $ |
| Fer | 0,75 | 20 | 3 000 $ | 6 | 850 $ |
| Or | 0,95 | 30 | 15 000 $ | 9 | 1 400 $ |
| Diamant | 1,2 | 45 | 60 000 $ | 12 | 2 200 $ |

(30/10 : 0,22 à 1 bloc/s, salaires de 90 à 2 400 $, et le mineur remontait lui-même son sac.)

- **Depuis le 23/10, les mineurs ne remontent plus** : ils creusent sans s'arrêter, et la **caisse de l'ascenseur** fait des allers-retours sans cesse (`avancerNavette`). Elle remonte au plus `capacité ÷ (2 × trajet + chargement + vidage)` blocs par seconde (`debitAscenseur`) : 15 blocs en 15 s au niveau 1 (1 bloc/s, donc 2 mineurs en bois), puis 25, 40, 60, 90 et 130 blocs (2,5 ; 5,4 ; 11,1 ; 23,4 ; 46 bloc/s ; le chargement et le vidage raccourcissent à chaque niveau depuis le 23/10).
- **Blocs par seconde d'un mineur** (`blocsParSecondeEmploye`) = ce qu'il creuse × `min(1, ce que remonte l'ascenseur ÷ ce que creusent tous les mineurs payés)` (`partRemontee`).
- La rareté multiplie **la vitesse et le sac** par le même rendement (un mythique creuse 5 fois plus).
- Salaire contre ce qu'il sort (mineur commun, ascenseur qui suit) : au niveau 1 de la mine, un mineur en bois sort environ 456 $ par 5 minutes pour 220 $ de salaire ; en diamant, environ 4 700 $ au niveau 4 de la mine pour 2 200 $. (23/10 bis : salaires relevés d'environ 40 %, avant 150 à 1 600 $.)

- **Salaire** (`salaireEmploye`) = `arrondi(SALAIRES[pioche] × rareté.salaire)`, pour 5 minutes. Depuis le 30/10 : `SALAIRES` = 90, 220, 500, 1 100, 2 400 $ toutes les 5 minutes (bois → diamant, environ 40 % de ce que le mineur fait sortir et plus au début ; le 28/10, 35 à 770 $, environ 35 % ; le 27/10, 50 à 1 100 $ toutes les 10 minutes, 25 %), et la rareté : ×1, ×1,4, ×1,8, ×2,5, ×4 (commun → mythique). Sans manager, on paie au plus 5 minutes d'avance (au prorata du temps manquant, arrondi au dollar supérieur).
- **Rentabilité** (30/10) : un mineur commun en bois au niveau 1 de la mine, avec l'ascenseur du départ, sort 0,168 × 3,04 ≈ 0,51 $/s de blocs pour un salaire de 0,30 $/s (environ 60 % : au début, il rapporte peu de plus que le joueur qui clique). Un mineur en diamant au niveau 5 avec l'ascenseur au max : 0,918 × 19,79 ≈ 18,2 $/s pour 8 $/s de salaire (44 %).

### Raretés (`RARETES`)

| Rareté | Rendement | Salaire |
|---|---:|---:|
| Commun | ×1 | ×1 |
| Rare | ×1,5 | ×1,25 |
| Épique | ×2 | ×1,5 |
| Légendaire | ×3 | ×2 |
| Mythique | ×5 | ×3 |

### Recruteur (`NIVEAUX_RECRUTEUR`, niveau 3 de la mine)

| Niveau | Prix (29/10) | Niv. joueur | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 10 000 $ | 9 | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 25 000 $ | 11 | 60 % | 22 % | 11 % | 5,5 % | 1,5 % |
| 3 | 50 000 $ | 13 | 55 % | 23,5 % | 12,5 % | 7 % | 2 % |
| 4 | 100 000 $ | 15 | 50 % | 25 % | 14 % | 8,5 % | 2,5 % |

Sans recruteur, 100 % de communs. Le tirage part du plus rare (`tirerRarete`).

### Manager (niveau 4 de la mine)

`PRIX_MANAGER` = 35 000 $ (29/10 ; avant 15 000 $, et il faut aussi le niveau 11 du joueur), `SALAIRE_MANAGER` = 400 $ / 5 min. Il paie 5 minutes de plus à chacun (lui d'abord, puis les mineurs du moins cher au plus cher) dès qu'il lui reste moins de 60 s payées (`SECONDES_AVANT_PAIE_MANAGER`), tant que la trésorerie suffit.

## Le village

Une grille de **60 × 60 cases** (`TAILLE_GRILLE`). Le fonctionnement (menus, placement, Modifier, notifications) est dans [village.md](village.md) ; ici, seulement les chiffres.

### Les bâtiments (`BATIMENTS`, `batiments.ts`)

Dans l'ordre du menu (`LISTE_BATIMENTS`, celui des déblocages depuis le 29/10) :

| Bâtiment | Taille | Entrée (sans miroir) | Niveau de mine | Niv. joueur | Prix pour le poser (29/10) |
|---|---|---|---:|---:|---|
| ⛏️ Mine | 10 × 10 | face avant gauche | 1 | — | déjà posée au milieu (case 25, 25) |
| 💰 Marché | 5 × 5 | face avant gauche | 1 | 1 | **gratuit** |
| ⚒️ Forgeron | 5 × 5 | face avant droite | 1 | 1 | 20 $ + 10 pierre (30/10) |
| 👷 Personnel | 5 × 5 | face avant droite | 1 | 2 | 150 $ + 30 pierre (30/10) |
| 🎒 Bazar | 5 × 5 | face avant droite | 1 | 3 | 200 $ + 40 pierre (30/10) |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 2 | 5 | 3 000 $ + 120 pierre + 60 fer |
| ⚡ Générateur | 5 × 5 | face avant droite | 2 | 6 | 4 000 $ + 100 fer + 40 redstone |

Depuis le 30/10, la foreuse se débloque **avant** le générateur (niveau 5 du joueur, puis 6 ; avant, générateur 5 et foreuse 6).

- Total au niveau 1 de la mine (marché, forgeron, Personnel, bazar) : **370 $ + 80 pierre** (29/10 : 580 $ + 125 pierre ; avant le 29/10 : 180 $ + 70 pierre). Tous les bâtiments : **7 370 $ + 200 pierre + 160 fer + 40 redstone** (29/10 : 7 580 $ + 245 pierre + 160 fer + 40 redstone).
- On paie une seule fois ; déplacer ou retourner est gratuit ; on ne peut pas enlever un bâtiment.

### Rails et chemins

| Élément | Prix | Remarques |
|---|---|---|
| 🛤️ Rail (1 case) | **3 fer** (`COUT_RAIL`) | à partir du niveau 3 du joueur (29/10) |
| 🪨 Chemin de pavés (1 case) | 5 $ (`COUT_CHEMIN`) | seulement joli |

Depuis le 30/10, **enlever un rail ou un chemin le rembourse** (`retirerSol`) : les 3 fer d'un rail reviennent dans le sac s'il y a de la place, sinon dans le coffre de la mine ; un chemin rend ses 5 $. Les déplacer est gratuit. Quand on ne peut pas poser, `raisonSolImpossible` dit pourquoi (« 🔩 Plus de fer... », pas assez d'argent, une boucle, trop près des bords).

Les **décorations** à acheter (fleurs, arbres, fontaine, statue…) et les **tenues** du joueur (Bazar) sont **retirées depuis le 27/10** : elles ne coûtaient que de l'argent et ne changeaient rien au jeu. Les dessins des décorations restent pour la plage et l'écran d'accueil.

### Vitesses et trajets

| Constante | Valeur | Qui |
|---|---|---|
| `VITESSE_JOUEUR` | 7,5 cases/s (27/10 ; avant 5) | le joueur |
| `VITESSE_MARCHE` | 2,5 cases/s (27/10 ; avant 4) | les mineurs employés (vers la forge, le Personnel, la mine) |
| `SECONDES_FORGE_EMPLOYE` | 3 s | un mineur récupère sa nouvelle pioche à la forge |
| `RAYON_BATIMENT` | 1 case | le panneau d'un bâtiment s'ouvre à cette distance de son bord |

- **Distance à pied** (`distanceEntre`) : de la case devant l'entrée d'un bâtiment à celle de l'autre, par le plus court chemin en 8 directions (une diagonale compte √2, on ne coupe pas le coin d'un bâtiment), en contournant les bâtiments, seuls obstacles depuis le 27/10 (`trouverChemin`, A étoile).
- **Le joueur ne marche pas** pendant qu'il pousse un wagonnet : il fait l'aller-retour avec lui (3 cases/s).

## Revenus par seconde

`revenuParSeconde(etat)` (`revenu.ts`) donne l'indicateur « 📈 *x* $/s » du bandeau. C'est la **valeur de ce qui sort de la mine** (il faut encore la vendre), une moyenne :

- **mine** = débit × valeur moyenne d'un bloc (0 si le coffre est plein) ;
- **mineurs** = pour chaque mineur **payé** : blocs par seconde × valeur moyenne (0 pour un pousseur), **moins** son salaire ÷ 300 (une paie dure 5 minutes) ; moins le salaire du manager ÷ 300 s'il est au travail. Coffre plein : seulement la partie négative (les salaires) ;
- **foreuse** = vitesse (électricité comprise) × valeur moyenne, si elle tourne ;
- **total** = mine + mineurs + foreuse. Les **clics ne comptent pas**, ni les wagonnets (ils ne font que porter).

Ce que fait la mine seule : **0,61 $/s** au niveau 1, 1,15 au niveau 2, 2,25 au niveau 3, 4,57 au niveau 4, **7,92 $/s** au niveau 5.

## Ce que coûte chaque niveau de la mine

Ce qu'il faut pour descendre, et les grandes améliorations qui arrivent à peu près en même temps :

| Étape | Prix |
|---|---|
| Bâtiments du niveau 1 + 3 cases de rails | 370 $ + 80 pierre + 9 fer |
| Niveau 2 | 900 $ + 45 fer |
| Foreuse + générateur | 7 000 $ + 120 pierre + 160 fer + 40 redstone |
| Niveau 3 | 7 000 $ + 120 fer + 60 redstone |
| Niveau 4 | 25 000 $ + 120 redstone + 60 or |
| Niveau 5 | 90 000 $ + 110 or + 40 émeraude |
| Tout au maximum (coffre, pioches, sacs, ascenseur, wagonnet, générateur, forage, chariot, recruteur, manager) | environ 1,8 million de dollars (30/10 ; 1,3 million le 29/10), plus les pioches des mineurs (78 500 $ par mineur) et les embauches |

En plus de l'argent, chaque étape demande un **niveau du joueur** : 4 pour le niveau 2 de la mine, 7 pour le 3, 10 pour le 4, 13 pour le 5 (voir [Le niveau du joueur](#le-niveau-du-joueur)).

## Le niveau du joueur

Tout est expliqué dans [niveaux.md](niveaux.md) (29/10). En bref :

- **XP** (`XP_PAR`) : 1 par bloc cassé en cliquant, 40 par bâtiment, 3 par case de rails, 30 par trajet de wagonnet, 25 par embauche, 30 par niveau d'amélioration, 150 par niveau de mine, 3 par aller-retour de wagonnet. Chaque chose ne compte qu'une fois (records des compteurs, `recordsXp`).
- **Courbe** : `xpPourPasser(n) = 60 × n^1,8`, arrondi à la dizaine : 60 XP pour passer au niveau 2, 210 pour le 3, 430 pour le 4, 730 pour le 5, 3 790 pour le 11, 13 180 pour le 21. Il faut 1 430 XP au total pour le niveau 5, 11 680 pour le 10, 38 230 pour le 15, 279 500 pour le 30 (le maximum).
- **Déblocages** (`NIVEAU_JOUEUR_POUR`) : bâtiments (Personnel 2, Bazar 3, Foreuse 5, Générateur 6 depuis le 30/10), rails 3, manager 11, et pour chaque amélioration le niveau donné dans les tableaux ci-dessus. Tout est débloqué au niveau 15.

## Le bot de simulation

`src/jeu/bot.ts` (`jouerPartie(aleatoire, maxSecondes = 12 h)` depuis le 30/10 ; 9 h le 29/10, 4 h avant) joue une partie de la mine automatique avec seulement des actions qu'un joueur peut faire, jusqu'au **niveau 5** de la mine. Depuis le 29/10, il gagne de l'XP comme un joueur et **attend ses niveaux** pour débloquer bâtiments et améliorations ; il note quand il arrive à chaque niveau du joueur (`tempsNiveauxJoueur`). `bot.test.ts` le fait jouer **10 parties** avec des graines fixes (1 à 10, générateur `mulberry32` : les résultats sont toujours les mêmes).

### Ce qu'il fait

- **Chaque seconde** : il règle ce qu'il garde, achète ce qu'il peut, va vendre à pied si besoin, puis **clique 2 fois** sur le bloc de la mine (`CLICS_PAR_SECONDE`) et laisse passer 1 s de jeu (`avancerTemps`).
- **Le village** : il pose ses bâtiments à des places fixes autour de la mine (`PLAN_DU_BOT`) : le **marché** en (28, 38), juste sous la mine, puis le **forgeron** (36, 24), le **Personnel** (19, 31), le **bazar** (19, 25), le **générateur** (35, 37, contre la ligne) et la **foreuse** (36, 31). Il pose **3 cases de rails** (30, 35 à 37) entre la mine et le marché dès qu'elles sont débloquées (niveau 3 du joueur) et qu'il a le fer (9 fer), puis y envoie aussitôt un wagonnet (trajet Mine → Marché).
- **Vendre à pied** : tant que le wagonnet ne roule pas (ni pousseur, ni électricité), il va vendre quand le coffre est à moitié plein : il met le coffre dans son sac (sauf sa réserve), marche jusqu'au marché, vend tout et revient (`2 × distance ÷ 5` secondes de jeu en plus).
- **Ce qu'il garde** (`reserve`, `reglerGarde`) : les minerais du prochain bâtiment, de la prochaine pioche, de la réparation, du prochain niveau de mine, du prochain coffre, des rails et de 20 redstone pour le générateur. Il les met dans `nonAVendre` (le wagonnet les laisse) tant qu'il n'en a pas 1,5 fois assez et que le coffre est à moins de 80 %.
- **Les achats** : réparer dès que la pioche casse ; pioche suivante ; niveau de mine dès qu'il peut ; payer les salaires dès que quelqu'un a moins d'une minute payée ; embaucher et améliorer les mineurs en gardant une paie d'avance ; recruteur dès qu'il peut ; manager à partir de 20 000 $ (et remplir la trésorerie) ; **un pousseur** embauché pour Mine → Marché dès qu'il a ce trajet et un mineur (licencié une fois les rails électriques). Un pousseur pousse à 2,5 cases/s × `forcePousseur` (1 + (rendement − 1) ÷ 2 selon sa rareté) ; générateur rempli de 10 redstone sous 2 minutes de réserve, puisage coché dès le niveau 2, amélioré à 2 fois son prix ; foreuse remplie de 10 charbons sous 1 minute, chariot vendu à moitié plein, améliorée au-dessus de 3 000 $ ; ascenseur (à partir de 2 mineurs), coffre, taille des wagonnets (à 2 fois son prix) et sac (à 3 fois son prix).
- Les achats se font **sans compter la marche** (on suppose qu'il passe devant en allant vendre).

### Ce que vérifie `bot.test.ts`

| Test | Attendu |
|---|---|
| Fin | les 10 parties arrivent au **niveau 5** |
| Niveau 2 (médiane) | **15 à 40 minutes** (5 à 20 avant le 29/10) |
| Niveau 5 (médiane) | **6 h à 9 h** (30/10 : salaires, embauches et améliorations bien plus chers ; 4 h à 7 h le 29/10, 1 h à 2 h 30 avant) |
| Niveau du joueur (médianes, 29/10) | le niveau 5 **après 8 minutes au moins**, le niveau 10 **après 1 heure au moins** |
| Progression | chaque niveau prend plus de temps que le précédent (médiane, à 20 % près) |
| Rails | le trajet Mine → Marché existe en **moins de 10 minutes** (toutes les parties ; 5 avant le 29/10) |
| Électricité | les rails sont électriques en **moins de 1 h 30** (toutes les parties ; 40 minutes avant le 29/10) |
| Automatisation | au moins 4 mineurs, plus de 100 voyages de wagonnet, et les mineurs sortent plus de blocs que les clics |
| Début à pied | plus de 3 allers-retours à pied au marché |

### Résultats mesurés (30/10, 10 parties)

| Mesure | Minimum | Médiane | Maximum |
|---|---:|---:|---:|
| Arrivée au niveau 2 de la mine | 18,2 min | **20,8 min** | 26,6 min |
| Arrivée au niveau 3 | 1 h 36 | **1 h 50** | 2 h 06 |
| Arrivée au niveau 4 | 3 h 46 | **4 h 18** | 4 h 33 |
| Arrivée au niveau 5 | 7 h 03 | **8 h 29** | 9 h 42 |
| Rails posés | 3,0 min | 3,3 min | 4,9 min |
| Rails électriques | 42 min | 55 min | 66 min |
| Allers-retours à pied | 86 | 134 | 332 |
| Niveau 3 du joueur (les rails) | 3,0 min | 3,3 min | 4,4 min |
| Niveau 5 du joueur | 13,1 min | **16,0 min** | 20,4 min |
| Niveau 10 du joueur | 1 h 19 | **1 h 23** | 1 h 35 |
| Niveau 15 du joueur | 4 h 12 | 4 h 16 | 4 h 28 |

(La médiane est celle de `bot.test.ts` : la 6e des 10 parties, rangées de la plus rapide à la plus lente.)

À la fin (médianes) : le joueur au **niveau 19**, 6 mineurs (les embauches coûtent bien plus cher), environ 4 800 voyages de wagonnet, 60 300 blocs cliqués, 73 500 blocs creusés par les mineurs, 9 300 blocs sortis seuls de la mine, 1,58 million de dollars gagnés. Le bot finit avec la pioche en or, l'ascenseur au niveau 3, le coffre de 4 000 places et le générateur au niveau 2 (8 parties sur 10).

Pour mémoire, le 29/10 (avant l'économie plus dure du 30/10) : niveau 2 en 26,1 min, niveau 5 en 5 h 45, rails électriques en 57 min, 8 mineurs (médianes). Le 22/10 (avant les prix relevés et le niveau du joueur) : niveau 2 en 11,6 min, niveau 5 en 1 h 38, rails électriques en 18,5 min.

## Durées de jeu attendues

| Repère | Valeur | Source |
|---|---|---|
| Niveau 2 de la mine | **15 à 40 min** (médiane) ; mesuré : 20 min | `bot.test.ts` |
| Niveau 5 de la mine | **6 h à 9 h** (médiane) ; mesuré : 7 h 23 (23/10, 5e ; 7 h 48 avant que l'ascenseur charge plus vite ; 7 h 03 avant la hausse des salaires et la limite de 2 mineurs ; 8 h 29 le 30/10) | `bot.test.ts` |
| Rails mine → marché | moins de 10 min | `bot.test.ts` |
| Rails électriques | moins de 1 h 30 | `bot.test.ts` |
| Niveau 5 / niveau 10 du joueur | après 8 min / après 1 h (médianes) ; 16 min / 1 h 23 | `bot.test.ts` |
| Remplir le coffre de départ (débit seul) | jamais : au niveau 1, la mine ne sort rien toute seule (27/10) | `NIVEAUX_COFFRE`, `NIVEAUX_MINE` |
| Une paie de mineur | 5 min | `SECONDES_PAR_PAIE` |
| Un charbon dans la foreuse / une redstone dans le générateur | 20 s / 30 s | `SECONDES_PAR_CHARBON`, `SECONDES_PAR_REDSTONE` |
| Remplir le chariot de la foreuse | 400 s (niveau 1) à 1 667 s (niveau 6), sans électricité | `NIVEAUX_CHARIOT`, `NIVEAUX_FORAGE` |
| Un trajet de mineur | 6 s (ascenseur niveau 1, dès le début) à 1 s (niveau 6) | `NIVEAUX_ASCENSEUR` |
| Rattrapage hors ligne | 8 h au plus (résumé « Bon retour, mineur ! ») | `ABSENCE_MAX`, `absence.ts` |
| Le joueur traverse la clairière (60 cases) | ≈ 8 s (7,5 cases/s) | `VITESSE_JOUEUR` |
