# Équilibrage : toutes les données et les formules

> Toutes les tables chiffrées du jeu et les formules, réunies au même endroit, d'après le code au 22/10 (la mine automatique ; trajets des wagonnets le 24/10 : `src/jeu/donnees.ts`, `mine.ts`, `mineur.ts`, `employes.ts`, `wagonnet.ts`, `generateur.ts`, `foreuse.ts`, `village.ts`, `batiments.ts`, `revenu.ts`, `bot.ts`, `bot.test.ts`).
> Pour le fonctionnement de chaque bâtiment (boutons, messages, cas limites), voir les fiches de [../batiments/](../batiments/README.md). Pour le village vu du ciel (grille, placement, menus), voir [village.md](village.md). Pour le concept et la progression en un coup d'œil, voir [vue-d-ensemble.md](vue-d-ensemble.md).

Conventions : « bloc/s » = blocs par seconde ; les distances au village sont en **cases** de la grille. Les niveaux affichés commencent à 1 ; dans le code, la plupart sont des index qui commencent à 0 (coffre, sac, wagonnet, générateur, forage, chariot, pioches des mineurs). Plus de prestige, de bonus de vente, de talents ni d'enchantements depuis le 22/10 (archivés dans `archives/`).

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
15. [Le bot de simulation](#le-bot-de-simulation)
16. [Durées de jeu attendues](#durées-de-jeu-attendues)

---

## Constantes générales

| Constante | Valeur | Rôle |
|---|---|---|
| `NIVEAU_MINE_MAX` | 5 | niveaux de la mine |
| `CLICS_MAINS_NUES` | 2 | clics par bloc avec une pioche cassée |
| `SECONDES_ECHELLE` | 10 s | un trajet de mineur sans ascenseur |
| `SECONDES_VIDAGE_EMPLOYE` | 2 s | un mineur vide son sac dans le coffre |
| `SECONDES_PAR_PAIE` | 600 s | une paie de mineur (10 minutes) |
| `SECONDES_PAR_CHARBON` | 20 s | un charbon dans la foreuse |
| `SECONDES_PAR_REDSTONE` | 30 s | une redstone dans le générateur |
| `SECONDES_CHARGEMENT_WAGONNET` | 2 s | charger un wagonnet au départ, puis le vider à l'arrivée |
| `TAILLE_GRILLE` | 60 | la clairière fait 60 × 60 cases |
| Horloge (`usePartie.ts`) | tic de 50 ms | à chaque image de l'écran quand le joueur pousse un wagonnet |
| `PAS_MAX` (`temps.ts`) | 60 s | une longue durée avance par morceaux d'une minute |
| `PAS_EMPLOYES` (`employes.ts`) | 30 s | les mineurs avancent par morceaux de 30 s (le manager paie entre deux) |
| Absence max (`ABSENCE_MAX`) | 8 h | temps rattrapé au retour |
| `VERSION_ETAT` | 21 | version de la sauvegarde (la mine automatique, 22/10 : les parties d'avant repartent de zéro) |

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
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | 0,2 | 3,04 $ |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | 0,25 | 4,58 $ |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | 0,3 | 7,50 $ |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | 0,35 | 13,07 $ |
| 5 | Cœur de diamant | 40 | 11 | 12 | 12 | 12 | 8 | 5 | 0,4 | 19,79 $ |

- **Valeur moyenne** (`valeurMoyenneBloc(niveau, doublement = 0)`) = Σ chance × prix × (1 + doublement si c'est un minerai). Avec la pioche en diamant (45 %), un clic au niveau 5 vaut en moyenne 19,79 + 0,45 × (19,79 − 0,40) ≈ **28,5 $**.
- **Débit** : la mine sort toute seule `debit` blocs par seconde dans le coffre, tant qu'il a de la place (`avancerMine`). Jamais doublés.

| Pour aller au niveau | Prix (`cout`) | Ce qui se débloque |
|---|---|---|
| 2 | 400 $ + 30 fer | Foreuse, Générateur (`niveauMine: 2`) |
| 3 | 2 500 $ + 60 fer + 30 redstone | Recruteur (`NIVEAU_MINE_RECRUTEUR`) |
| 4 | 9 000 $ + 60 redstone + 30 or | Manager (`NIVEAU_MINE_MANAGER`) |
| 5 | 30 000 $ + 60 or + 25 émeraude | (le dernier niveau : le diamant) |

Total pour aller au niveau 5 : **41 900 $ + 90 fer + 90 redstone + 90 or + 25 émeraude**. Chaque niveau donne aussi **2 mineurs de plus** au maximum.

## Le coffre

`NIVEAUX_COFFRE` : 100 → **250** (150 $ + 40 pierre) → **600** (800 $ + 40 fer) → **1 500** (3 000 $ + 80 fer + 20 redstone) → **4 000** places (10 000 $ + 30 or). Total : 13 950 $ + 40 pierre + 120 fer + 20 redstone + 30 or.

- Plein : plus de clic, plus de débit, et les mineurs attendent pour vider leur sac.
- **Payer** (`disponible`, `payerMateriaux`) : pour chaque minerai d'un prix, on prend d'abord dans le sac, puis le reste dans le coffre.

À débit seul, un coffre de 100 places se remplit en 8 min 20 au niveau 1 (0,2 bloc/s), un coffre de 4 000 places en 2 h 47 au niveau 5 (0,4 bloc/s), sans compter les clics et les mineurs.

## Les pioches et le clic

`PIOCHES`. Un clic casse **un bloc** (deux clics si la pioche est cassée) : pas de temps de casse, pas de vitesse.

| Pioche | Doublement | Durabilité | Prix (débloquer / racheter) | Réparation (pioche cassée) |
|---|---:|---:|---|---|
| Pierre | 10 % | 150 | 10 $ + 20 pierre (offerte, pas rachetable dans l'interface) | 5 $ + 10 pierre |
| Fer | 20 % | 300 | 200 $ + 25 fer | 30 $ + 5 fer |
| Or | 30 % | 500 | 1 500 $ + 20 or | 150 $ + 5 or |
| Diamant | 45 % | 1 000 | 8 000 $ + 10 diamant | 600 $ + 3 diamant |

- **Doublement** (`chanceDoublement`) : un minerai cassé en cliquant donne 2 au lieu d'1 si `aleatoire() < doublement`. 0 avec une pioche cassée. Seulement pour les clics.
- **Usure** : +1 à chaque bloc cassé avec une pioche pas cassée. Cassée quand l'usure atteint la durabilité ; elle ne s'use plus ensuite.
- **Réparation** (`coutReparation`) : `part = min(1, usure / durabilité)` ; argent = `max(1, arrondi au-dessus(réparation.argent × part))`, chaque minerai = `max(1, arrondi au-dessus(n × part))`.
- **Coût de la pioche par clic** (réparer quand elle casse) : pierre 5 $ + 10 pierre / 150 clics ; fer 30 $ + 5 fer / 300 ; or 150 $ + 5 or / 500 ; diamant 600 $ + 3 diamants / 1 000. Une pioche en diamant coûte donc environ 0,9 $ par clic (avec les diamants à 100 $), pour un gain moyen de 28,5 $ par clic au niveau 5.

## Le sac à dos

`SACS` (au Bazar, en argent, sans plafond) :

| Niveau (code) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Places | 32 | 64 | 128 | 256 | 512 | 1 024 | 2 048 |
| Prix | 0 | 80 $ | 400 $ | 1 500 $ | 5 000 $ | 15 000 $ | 40 000 $ |

Total : 61 980 $. Le sac ne sert qu'à porter (coffre ou chariot → marché) et à payer.

## L'ascenseur des mineurs

`NIVEAUX_ASCENSEUR` (au panneau de la mine). Un trajet = une montée ou une descente d'un mineur (`secondesTrajetMineur`).

| Niveau | Trajet | Prix |
|---|---:|---|
| 0 (échelle) | 10 s | — |
| 1 | 6 s | 150 $ + 10 fer |
| 2 | 4 s | 600 $ + 30 fer + 5 redstone |
| 3 | 2,8 s | 2 000 $ + 60 fer + 20 redstone |
| 4 | 2 s | 6 000 $ + 100 fer + 50 redstone |
| 5 | 1,4 s | 15 000 $ + 100 redstone + 20 or |
| 6 | 1 s | 40 000 $ + 60 or + 10 émeraude |

Total : 63 750 $ + 200 fer + 175 redstone + 80 or + 10 émeraude.

## Les rails et les wagonnets

| Constante | Valeur |
|---|---|
| `COUT_RAIL` | 3 fer la case (dès le début) |
| `VITESSE_POUSSE_JOUEUR` | 3 cases/s |
| `VITESSE_POUSSE_MINEUR` | 2,5 cases/s |
| `VITESSE_RAILS` | 8 cases/s × puissance du générateur |
| sur sa lancée (électrique sans courant) | 1,25 case/s (`VITESSE_POUSSE_MINEUR / 2`) |
| `RESERVE_FOREUSE_WAGONNET` | 1 200 s de charbon (60 charbons) : le wagonnet Mine → Foreuse remplit jusque-là |
| `RESERVE_GENERATEUR_WAGONNET` | 1 800 s de redstone (60 redstones) : le wagonnet Mine → Générateur remplit jusque-là |

`NIVEAUX_WAGONNET` (pour tous les wagonnets, `niveauWagonnets`) : 40 → **100** (500 $ + 40 fer) → **250** (2 500 $ + 80 fer + 20 redstone) → **600** places (10 000 $ + 40 or).

- **Trajets** (`LIAISONS`) : Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché, un wagonnet chacun, créés gratuitement par le joueur.
- **Ligne** (`railsEntre`, `ligneDe`) : la suite de rails continue (voisins par un côté) d'une case collée au bâtiment de départ à une case collée à celui d'arrivée. Les rails ne font jamais de boucle (`feraitUneBoucle`) : il n'y a qu'une route. **Longueur d'un trajet** = cases de la ligne + 1 (`longueurTrajet`).
- **Aller-retour** (`secondesAllerRetour`) = `2 × longueur ÷ vitesse + 2 × 2 s`.
- **Chargement**, jusqu'à la capacité :
  - Mine → Marché : les objets du coffre les plus chers d'abord, sauf les objets gardés (`nonAVendre`), et sauf le charbon et la redstone qui manquent aux réserves ci-dessus (si ces trajets existent) ;
  - Mine → Foreuse : `arrondi au-dessus((1 200 − réserve de la foreuse) ÷ 20)` charbons, au plus ce qu'il y a dans le coffre ;
  - Mine → Générateur : `arrondi au-dessus((1 800 − réserve du générateur) ÷ 30)` redstones, au plus ce qu'il y a dans le coffre ;
  - Foreuse → Marché : ce qui est coché dans le chariot, le plus cher d'abord (l'argent compte dans `argentWagonnet`).
- **Électrique** (`trajetElectrique`) : toutes les cases du trajet dans le rayon, générateur allumé avec de la redstone.
- Exemple : la ligne du bot (3 cases, longueur 4) : poussé par toi 6,7 s l'aller-retour, par un mineur 7,2 s, électrique au niveau 1 du générateur 5 s. Un wagonnet de 40 places électrique y emporte donc jusqu'à 8 objets par seconde, bien plus que ce que sort la mine : c'est la longueur de la ligne et la capacité qui comptent quand la mine grossit.

## Le générateur

| Niveau | Rayon (cases) | Puissance | Wagonnet électrique | Foreuse | Prix |
|---|---:|---:|---:|---:|---|
| 1 | 15 | ×1 | 8 cases/s | ×1,5 | le bâtiment : 1 200 $ + 50 fer + 20 redstone |
| 2 | 20 | ×1,3 | 10,4 cases/s | ×1,65 | 3 000 $ + 80 fer + 40 redstone |
| 3 | 26 | ×1,7 | 13,6 cases/s | ×1,85 | 8 000 $ + 150 fer + 80 redstone |
| 4 | 33 | ×2,2 | 17,6 cases/s | ×2,1 | 20 000 $ + 250 fer + 150 redstone |
| 5 | 40 | ×3 | 24 cases/s | ×2,5 | 50 000 $ + 400 fer + 300 redstone |

- **Consommation** : 1 redstone = 30 s, soit 2 par minute, **120 par heure**, quel que soit le niveau.
- **Rayon** : une case est dedans si `distance(centre de la case, centre du générateur) ≤ rayon`. Un trajet est électrique quand toutes ses cases sont dedans **et** que le générateur est allumé avec de la redstone (chaque trajet compte à part).
- **Foreuse** : vitesse × `(1 + BONUS_ELECTRIQUE_FOREUSE × puissance)`, avec `BONUS_ELECTRIQUE_FOREUSE` = 0,5.
- **Puisage** (`NIVEAU_GENERATEUR_AUTO` = index 1, donc le 2e niveau) : sous 300 s de réserve (`RESERVE_GENERATEUR_AUTO`), il prend dans le coffre `arrondi au-dessus((300 − réserve) ÷ 30)` redstone (au plus ce qu'il y a).
- La redstone que demande le générateur (2 / min) est petite à côté de ce que sort la mine : au niveau 2, la mine seule sort 0,25 × 10 % = 1,5 redstone par minute, et les clics et les mineurs bien plus.

## La foreuse

| Niveau | Forage (bloc/s) | Prix | Chariot (places) | Prix |
|---|---:|---|---:|---|
| 1 | 0,5 | (le bâtiment : 800 $ + 60 pierre + 30 fer) | 200 | (de base) |
| 2 | 0,8 | 1 500 $ + 30 fer + 10 redstone | 400 | 1 000 $ + 20 fer |
| 3 | 1,2 | 4 000 $ + 60 fer + 30 redstone | 800 | 3 000 $ + 50 fer + 15 redstone |
| 4 | 1,8 | 10 000 $ + 100 fer + 60 redstone | 1 600 | 8 000 $ + 90 fer + 40 redstone |
| 5 | 2,6 | 25 000 $ + 100 redstone + 30 or | 3 000 | 20 000 $ + 80 redstone + 20 or |
| 6 | 3,6 | 60 000 $ + 60 or + 15 émeraude | 6 000 | 50 000 $ + 50 or + 10 émeraude |

- **Charbon** : 1 charbon = 20 s de forage, quelle que soit la vitesse (3 charbons par minute).
- **Recharge automatique** (dès le forage niveau 3, `NIVEAU_RECHARGE_AUTO` = index 2) : un charbon foré est brûlé (+20 s) au lieu d'aller dans le chariot, tant que la réserve est sous 60 s (`RESERVE_RECHARGE_AUTO`).
- **Ce qu'elle rapporte** : vitesse × valeur moyenne d'un bloc au niveau de la mine. Au niveau 2 de la mine, au forage de base : 0,5 × 4,58 ≈ 2,3 $/s. Tout au maximum (niveau 5 de la mine, forage 3,6, générateur ×2,5) : 9 bloc/s × 19,79 ≈ **178 $/s**.
- **Temps pour remplir le chariot** (`secondesPourRemplir`) = capacité ÷ vitesse : 400 s au niveau 1/1, 500 s au 2/2, 667 s au 3/3, 889 s au 4/4, 1 154 s au 5/5, 1 667 s au 6/6 (sans électricité).

## Les mineurs employés

### Équipe, embauche, licenciement

- **Nombre max** (`maxEmployes`) = `EMPLOYES_NIVEAU_1 + EMPLOYES_PAR_NIVEAU × (niveau de la mine − 1)` = 4 + 2 × (N − 1) : **4, 6, 8, 10, 12**.
- **Prix de la n-ième embauche** (`PRIX_EMBAUCHE`) : 50, 150, 400, 1 000, 2 500, 6 000, 14 000, 30 000, 60 000, 120 000 $, puis × 1,6 à chaque fois (`HAUSSE_APRES_LISTE`) : 192 000 $ (11e), 307 200 $ (12e). Arrondi à la dizaine sous 1 000 $, à la centaine au-dessus. Le prix ne dépend que de la taille actuelle de l'équipe.
- **Indemnités** (`indemnites`) = 40 % (`PART_INDEMNITES`) du prix de base de la dernière place : 20 $ pour 1 mineur, 400 $ pour 4, 12 000 $ pour 8, 122 900 $ pour 12.

### Travail

`NIVEAUX_EMPLOYE` (payés en argent, au Personnel) × la rareté (`RARETES`).

| Pioche | Vitesse en creusant | Sac | Prix | Salaire / 10 min |
|---|---:|---:|---:|---:|
| Bois | 0,15 bloc/s | 10 | (de base) | 30 $ |
| Pierre | 0,25 | 15 | 150 $ | 60 $ |
| Fer | 0,4 | 20 | 600 $ | 140 $ |
| Or | 0,6 | 30 | 2 500 $ | 320 $ |
| Diamant | 0,9 | 45 | 9 000 $ | 700 $ |

- **Un tour** : creuser un sac (`sac ÷ vitesse`), monter, vider (2 s), redescendre. **Blocs par seconde** (`blocsParSecondeEmploye`) = `sac ÷ (sac ÷ vitesse + 2 × trajet + 2)`.
- La rareté multiplie **la vitesse et le sac** par le même rendement : le temps de creusage d'un sac ne change pas, mais chaque tour rapporte plus (un mythique sort 5 fois plus de blocs par tour).

| Pioche (commun) | Échelle (10 s) | Ascenseur niveau 3 (2,8 s) | Ascenseur niveau 6 (1 s) |
|---|---:|---:|---:|
| Bois | 0,113 bloc/s | 0,135 | 0,142 |
| Pierre | 0,183 | 0,222 | 0,234 |
| Fer | 0,278 | 0,347 | 0,370 |
| Or | 0,417 | 0,521 | 0,556 |
| Diamant | 0,625 | 0,781 | 0,833 |

- **Salaire** (`salaireEmploye`) = `arrondi(SALAIRES[pioche] × rareté.salaire)`, pour 10 minutes. Sans manager, on paie au plus 10 minutes d'avance (au prorata du temps manquant, arrondi au dollar supérieur).
- **Rentabilité** : un mineur commun en bois au niveau 1, à l'échelle, sort 0,113 × 3,04 ≈ 0,34 $/s de blocs pour un salaire de 0,05 $/s (environ 15 %). Un mineur en diamant au niveau 5 avec l'ascenseur au max : 0,833 × 19,79 ≈ 16,5 $/s pour 1,17 $/s de salaire.

### Raretés (`RARETES`)

| Rareté | Rendement | Salaire |
|---|---:|---:|
| Commun | ×1 | ×1 |
| Rare | ×1,5 | ×1,25 |
| Épique | ×2 | ×1,5 |
| Légendaire | ×3 | ×2 |
| Mythique | ×5 | ×3 |

### Recruteur (`NIVEAUX_RECRUTEUR`, niveau 3 de la mine)

| Niveau | Prix | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5 000 $ | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 12 000 $ | 60 % | 22 % | 11 % | 5,5 % | 1,5 % |
| 3 | 25 000 $ | 55 % | 23,5 % | 12,5 % | 7 % | 2 % |
| 4 | 50 000 $ | 50 % | 25 % | 14 % | 8,5 % | 2,5 % |

Sans recruteur, 100 % de communs. Le tirage part du plus rare (`tirerRarete`).

### Manager (niveau 4 de la mine)

`PRIX_MANAGER` = 15 000 $, `SALAIRE_MANAGER` = 600 $ / 10 min. Il paie 10 minutes de plus à chacun (lui d'abord, puis les mineurs du moins cher au plus cher) dès qu'il lui reste moins de 60 s payées (`SECONDES_AVANT_PAIE_MANAGER`), tant que la trésorerie suffit.

## Le village

Une grille de **60 × 60 cases** (`TAILLE_GRILLE`). Le fonctionnement (menus, placement, Modifier, notifications) est dans [village.md](village.md) ; ici, seulement les chiffres.

### Les bâtiments (`BATIMENTS`, `batiments.ts`)

| Bâtiment | Taille | Entrée (sans miroir) | Niveau de mine | Prix pour le poser |
|---|---|---|---:|---|
| ⛏️ Mine | 10 × 10 | face avant gauche | 1 | déjà posée au milieu (case 25, 25) |
| 💰 Marché | 5 × 5 | face avant gauche | 1 | **gratuit** |
| ⚒️ Forgeron | 5 × 5 | face avant droite | 1 | 20 $ + 15 pierre |
| 🎒 Bazar | 5 × 5 | face avant droite | 1 | 60 $ + 25 pierre |
| 👷 Personnel | 5 × 5 | face avant droite | 1 | 100 $ + 30 pierre |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 2 | 800 $ + 60 pierre + 30 fer |
| ⚡ Générateur | 5 × 5 | face avant droite | 2 | 1 200 $ + 50 fer + 20 redstone |

- Total au niveau 1 (marché, forgeron, bazar, Personnel) : **180 $ + 70 pierre**. Tous les bâtiments : **2 180 $ + 130 pierre + 80 fer + 20 redstone**.
- On paie une seule fois ; déplacer ou retourner est gratuit ; on ne peut pas enlever un bâtiment.

### Rails et chemins

| Élément | Prix | Remarques |
|---|---|---|
| 🛤️ Rail (1 case) | **3 fer** (`COUT_RAIL`) | dès le début |
| 🪨 Chemin de pavés (1 case) | 5 $ (`COUT_CHEMIN`) | seulement joli |

Enlever un rail ou un chemin ne rembourse rien ; les déplacer est gratuit.

Les **décorations** à acheter (fleurs, arbres, fontaine, statue…) et les **tenues** du joueur (Bazar) sont **retirées depuis le 27/10** : elles ne coûtaient que de l'argent et ne changeaient rien au jeu. Les dessins des décorations restent pour la plage et l'écran d'accueil.

### Vitesses et trajets

| Constante | Valeur | Qui |
|---|---|---|
| `VITESSE_JOUEUR` | 5 cases/s | le joueur |
| `VITESSE_MARCHE` | 2,5 cases/s (27/10 ; avant 4) | les mineurs employés (vers la forge, le Personnel, la mine) |
| `SECONDES_FORGE_EMPLOYE` | 3 s | un mineur récupère sa nouvelle pioche à la forge |
| `RAYON_BATIMENT` | 1,3 case | le panneau d'un bâtiment s'ouvre à cette distance de son bord |

- **Distance à pied** (`distanceEntre`) : de la case devant l'entrée d'un bâtiment à celle de l'autre, par le plus court chemin en 8 directions (une diagonale compte √2, on ne coupe pas le coin d'un bâtiment), en contournant les bâtiments, seuls obstacles depuis le 27/10 (`trouverChemin`, A étoile).
- **Le joueur ne marche pas** pendant qu'il pousse un wagonnet : il fait l'aller-retour avec lui (3 cases/s).

## Revenus par seconde

`revenuParSeconde(etat)` (`revenu.ts`) donne l'indicateur « 📈 *x* $/s » du bandeau. C'est la **valeur de ce qui sort de la mine** (il faut encore la vendre), une moyenne :

- **mine** = débit × valeur moyenne d'un bloc (0 si le coffre est plein) ;
- **mineurs** = pour chaque mineur **payé** : blocs par seconde × valeur moyenne (0 pour un pousseur), **moins** son salaire ÷ 600 ; moins le salaire du manager ÷ 600 s'il est au travail. Coffre plein : seulement la partie négative (les salaires) ;
- **foreuse** = vitesse (électricité comprise) × valeur moyenne, si elle tourne ;
- **total** = mine + mineurs + foreuse. Les **clics ne comptent pas**, ni les wagonnets (ils ne font que porter).

Ce que fait la mine seule : **0,61 $/s** au niveau 1, 1,15 au niveau 2, 2,25 au niveau 3, 4,57 au niveau 4, **7,92 $/s** au niveau 5.

## Ce que coûte chaque niveau de la mine

Ce qu'il faut pour descendre, et les grandes améliorations qui arrivent à peu près en même temps :

| Étape | Prix |
|---|---|
| Bâtiments du niveau 1 + 3 cases de rails | 180 $ + 70 pierre + 9 fer |
| Niveau 2 | 400 $ + 30 fer |
| Foreuse + générateur | 2 000 $ + 60 pierre + 80 fer + 20 redstone |
| Niveau 3 | 2 500 $ + 60 fer + 30 redstone |
| Niveau 4 | 9 000 $ + 60 redstone + 30 or |
| Niveau 5 | 30 000 $ + 60 or + 25 émeraude |
| Tout au maximum (coffre, pioches, sacs, ascenseur, wagonnet, générateur, forage, chariot, recruteur, manager) | plusieurs centaines de milliers de dollars |

## Le bot de simulation

`src/jeu/bot.ts` (`jouerPartie(aleatoire, maxSecondes = 4 h)`) joue une partie de la mine automatique avec seulement des actions qu'un joueur peut faire, jusqu'au **niveau 5** de la mine. `bot.test.ts` le fait jouer **10 parties** avec des graines fixes (1 à 10, générateur `mulberry32` : les résultats sont toujours les mêmes).

### Ce qu'il fait

- **Chaque seconde** : il règle ce qu'il garde, achète ce qu'il peut, va vendre à pied si besoin, puis **clique 2 fois** sur le bloc de la mine (`CLICS_PAR_SECONDE`) et laisse passer 1 s de jeu (`avancerTemps`).
- **Le village** : il pose ses bâtiments à des places fixes autour de la mine (`PLAN_DU_BOT`) : le **marché** en (28, 38), juste sous la mine, puis le **forgeron** (36, 24), le **Personnel** (19, 31), le **bazar** (19, 25), le **générateur** (35, 37, contre la ligne) et la **foreuse** (36, 31). Il pose **3 cases de rails** (30, 35 à 37) entre la mine et le marché dès qu'il a le fer (9 fer), puis y envoie aussitôt un wagonnet (trajet Mine → Marché).
- **Vendre à pied** : tant que le wagonnet ne roule pas (ni pousseur, ni électricité), il va vendre quand le coffre est à moitié plein : il met le coffre dans son sac (sauf sa réserve), marche jusqu'au marché, vend tout et revient (`2 × distance ÷ 5` secondes de jeu en plus).
- **Ce qu'il garde** (`reserve`, `reglerGarde`) : les minerais du prochain bâtiment, de la prochaine pioche, de la réparation, du prochain niveau de mine, du prochain coffre, des rails et de 20 redstone pour le générateur. Il les met dans `nonAVendre` (le wagonnet les laisse) tant qu'il n'en a pas 1,5 fois assez et que le coffre est à moins de 80 %.
- **Les achats** : réparer dès que la pioche casse ; pioche suivante ; niveau de mine dès qu'il peut ; payer les salaires dès que quelqu'un a moins d'une minute payée ; embaucher et améliorer les mineurs en gardant une paie d'avance ; recruteur dès qu'il peut ; manager à partir de 20 000 $ (et remplir la trésorerie) ; **un pousseur** embauché pour Mine → Marché dès qu'il a ce trajet et un mineur (licencié une fois les rails électriques). Un pousseur pousse à 2,5 cases/s × `forcePousseur` (1 + (rendement − 1) ÷ 2 selon sa rareté) ; générateur rempli de 10 redstone sous 2 minutes de réserve, puisage coché dès le niveau 2, amélioré à 2 fois son prix ; foreuse remplie de 10 charbons sous 1 minute, chariot vendu à moitié plein, améliorée au-dessus de 3 000 $ ; ascenseur (à partir de 2 mineurs), coffre, taille des wagonnets (à 2 fois son prix) et sac (à 3 fois son prix).
- Les achats se font **sans compter la marche** (on suppose qu'il passe devant en allant vendre).

### Ce que vérifie `bot.test.ts`

| Test | Attendu |
|---|---|
| Fin | les 10 parties arrivent au **niveau 5** |
| Niveau 2 (médiane) | **5 à 20 minutes** |
| Niveau 5 (médiane) | **1 h à 2 h 30** |
| Progression | chaque niveau prend plus de temps que le précédent (médiane, à 20 % près) |
| Rails | le trajet Mine → Marché existe en **moins de 5 minutes** (toutes les parties) |
| Électricité | les rails sont électriques en **moins de 40 minutes** (toutes les parties) |
| Automatisation | au moins 4 mineurs, plus de 100 voyages de wagonnet, et les mineurs sortent plus de blocs que les clics |
| Début à pied | plus de 3 allers-retours à pied au marché |

### Résultats mesurés (22/10, 10 parties)

| Mesure | Minimum | Médiane | Maximum |
|---|---:|---:|---:|
| Arrivée au niveau 2 | 9,6 min | **11,6 min** | 14,5 min |
| Arrivée au niveau 3 | 29,2 min | **36,7 min** | 44,7 min |
| Arrivée au niveau 4 | 56,2 min | **61,6 min** | 80,6 min |
| Arrivée au niveau 5 | 89,7 min | **97,8 min** | 107,4 min |
| Rails posés | — | 0,6 min | 1,3 min |
| Rails électriques | — | 18,5 min | 23,3 min |
| Allers-retours à pied | 32 | — | 71 |

À la fin (médianes) : 7 à 8 mineurs, environ 890 voyages de wagonnet, 11 300 blocs cliqués, 15 000 blocs creusés par les mineurs, 1 700 blocs sortis seuls de la mine, 336 000 $ gagnés. Le bot finit avec la pioche en or, l'ascenseur au niveau 3, le coffre de 4 000 places et le générateur jamais amélioré.

## Durées de jeu attendues

| Repère | Valeur | Source |
|---|---|---|
| Niveau 2 de la mine | **5 à 20 min** (médiane) ; mesuré : 11,6 min | `bot.test.ts` |
| Niveau 5 de la mine | **1 h à 2 h 30** (médiane) ; mesuré : 1 h 38 | `bot.test.ts` |
| Rails mine → marché | moins de 5 min | `bot.test.ts` |
| Rails électriques | moins de 40 min | `bot.test.ts` |
| Remplir le coffre de départ (débit seul) | 8 min 20 | `NIVEAUX_COFFRE`, `NIVEAUX_MINE` |
| Une paie de mineur | 10 min | `SECONDES_PAR_PAIE` |
| Un charbon dans la foreuse / une redstone dans le générateur | 20 s / 30 s | `SECONDES_PAR_CHARBON`, `SECONDES_PAR_REDSTONE` |
| Remplir le chariot de la foreuse | 400 s (niveau 1) à 1 667 s (niveau 6), sans électricité | `NIVEAUX_CHARIOT`, `NIVEAUX_FORAGE` |
| Un trajet de mineur | 10 s (échelle) à 1 s (ascenseur niveau 6) | `NIVEAUX_ASCENSEUR` |
| Rattrapage hors ligne | 8 h au plus | `ABSENCE_MAX` |
| Le joueur traverse la clairière (60 cases) | ≈ 12 s (5 cases/s) | `VITESSE_JOUEUR` |
