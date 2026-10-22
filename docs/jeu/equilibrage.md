# Équilibrage : toutes les données et les formules

> Toutes les tables chiffrées du jeu et les formules, réunies au même endroit, d'après le code au 22/10 (la mine automatique ; trajets des wagonnets le 24/10 ; **le 29/10, tous les prix relevés (environ ×2 à ×3) et le niveau du joueur**, voir [niveaux.md](niveaux.md) : `src/jeu/donnees.ts`, `mine.ts`, `mineur.ts`, `employes.ts`, `wagonnet.ts`, `generateur.ts`, `foreuse.ts`, `village.ts`, `batiments.ts`, `revenu.ts`, `bot.ts`, `bot.test.ts`).
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
| `SECONDES_ECHELLE` | 10 s | un trajet de mineur sans ascenseur |
| `SECONDES_VIDAGE_EMPLOYE` | 2 s | un mineur vide son sac dans le coffre |
| `SECONDES_PAR_PAIE` | 300 s | une paie de mineur (5 minutes, depuis le 28/10) |
| `SECONDES_PAR_CHARBON` | 20 s | un charbon dans la foreuse |
| `SECONDES_PAR_REDSTONE` | 30 s | une redstone dans le générateur |
| `SECONDES_CHARGEMENT_WAGONNET` | 2 s | charger un wagonnet au départ, puis le vider à l'arrivée |
| `TAILLE_GRILLE` | 60 | la clairière fait 60 × 60 cases |
| Horloge (`usePartie.ts`) | tic de 50 ms | à chaque image de l'écran quand le joueur pousse un wagonnet |
| `PAS_MAX` (`temps.ts`) | 60 s | une longue durée avance par morceaux d'une minute |
| `PAS_EMPLOYES` (`employes.ts`) | 30 s | les mineurs avancent par morceaux de 30 s (le manager paie entre deux) |
| Absence max (`ABSENCE_MAX`) | 8 h | temps rattrapé au retour |
| `VERSION_ETAT` | 24 | version de la sauvegarde (21 : la mine automatique, 22/10, les parties d'avant repartent de zéro ; 24 : le niveau du joueur, 29/10) |
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

| Pour aller au niveau | Prix (`cout`, 29/10) | Niv. joueur | Ce qui se débloque |
|---|---|---:|---|
| 2 | 1 200 $ + 60 fer | 4 | Foreuse, Générateur (`niveauMine: 2`) |
| 3 | 7 000 $ + 120 fer + 60 redstone | 7 | Recruteur (`NIVEAU_MINE_RECRUTEUR`) |
| 4 | 25 000 $ + 120 redstone + 60 or | 10 | Manager (`NIVEAU_MINE_MANAGER`) |
| 5 | 110 000 $ + 130 or + 55 émeraude | 13 | (le dernier niveau : le diamant) |

Total pour aller au niveau 5 : **143 200 $ + 180 fer + 180 redstone + 190 or + 55 émeraude** (avant le 29/10 : 41 900 $ + 90 fer + 90 redstone + 90 or + 25 émeraude). Chaque niveau donne aussi **2 mineurs de plus** au maximum.

## Le coffre

`NIVEAUX_COFFRE` (29/10) : 100 → **250** (400 $ + 80 pierre, niveau 2 du joueur) → **600** (2 000 $ + 80 fer, niveau 5) → **1 500** (8 000 $ + 150 fer + 40 redstone, niveau 8) → **4 000** places (25 000 $ + 60 or, niveau 12). Total : 35 400 $ + 80 pierre + 230 fer + 40 redstone + 60 or.

- Plein : plus de clic, plus de débit, et les mineurs attendent pour vider leur sac.
- **Payer** (`disponible`, `payerMateriaux`) : pour chaque minerai d'un prix, on prend d'abord dans le sac, puis le reste dans le coffre.

À débit seul, au niveau 1 la mine ne sort rien toute seule (27/10) ; un coffre de 4 000 places se remplit en 2 h 47 au niveau 5 (0,4 bloc/s), sans compter les clics et les mineurs.

## Les pioches et le clic

`PIOCHES`. Un clic casse **un bloc** (deux clics si la pioche est cassée) : pas de temps de casse, pas de vitesse.

| Pioche | Doublement | Durabilité | Prix (débloquer / racheter, 29/10) | Niv. joueur | Réparation (pioche cassée) |
|---|---:|---:|---|---:|---|
| Pierre | 10 % | 150 | 10 $ + 20 pierre (offerte, pas rachetable dans l'interface) | — | 5 $ + 10 pierre |
| Fer | 20 % | 300 | 500 $ + 40 fer | 4 | 30 $ + 5 fer |
| Or | 30 % | 500 | 4 000 $ + 40 or | 7 | 150 $ + 5 or |
| Diamant | 45 % | 1 000 | 20 000 $ + 20 diamant | 12 | 600 $ + 3 diamant |

- **Doublement** (`chanceDoublement`) : un minerai cassé en cliquant donne 2 au lieu d'1 si `aleatoire() < doublement`. 0 avec une pioche cassée. Seulement pour les clics.
- **Usure** : +1 à chaque bloc cassé avec une pioche pas cassée. Cassée quand l'usure atteint la durabilité ; elle ne s'use plus ensuite.
- **Réparation** (`coutReparation`) : `part = min(1, usure / durabilité)` ; argent = `max(1, arrondi au-dessus(réparation.argent × part))`, chaque minerai = `max(1, arrondi au-dessus(n × part))`.
- **Coût de la pioche par clic** (réparer quand elle casse) : pierre 5 $ + 10 pierre / 150 clics ; fer 30 $ + 5 fer / 300 ; or 150 $ + 5 or / 500 ; diamant 600 $ + 3 diamants / 1 000. Une pioche en diamant coûte donc environ 0,9 $ par clic (avec les diamants à 100 $), pour un gain moyen de 28,5 $ par clic au niveau 5.

## Le sac à dos

`SACS` (au Bazar, en argent, sans plafond) :

| Niveau (code) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Places | 32 | 64 | 128 | 256 | 512 | 1 024 | 2 048 |
| Prix (29/10) | 0 | 200 $ | 1 000 $ | 4 000 $ | 12 000 $ | 35 000 $ | 100 000 $ |
| Niv. joueur | — | 3 | 5 | 8 | 11 | 14 | 15 |

Total : 152 200 $ (avant le 29/10 : 61 980 $). Le sac ne sert qu'à porter (coffre ou chariot → marché) et à payer.

## L'ascenseur des mineurs

`NIVEAUX_ASCENSEUR` (au panneau de la mine). Un trajet = une montée ou une descente d'un mineur (`secondesTrajetMineur`).

| Niveau | Trajet | Prix (29/10) | Niv. joueur |
|---|---:|---|---:|
| 0 (échelle) | 10 s | — | — |
| 1 | 6 s | 400 $ + 20 fer | 4 |
| 2 | 4 s | 1 500 $ + 50 fer + 10 redstone | 6 |
| 3 | 2,8 s | 5 000 $ + 100 fer + 40 redstone | 8 |
| 4 | 2 s | 15 000 $ + 160 fer + 90 redstone | 10 |
| 5 | 1,4 s | 40 000 $ + 160 redstone + 40 or | 13 |
| 6 | 1 s | 100 000 $ + 100 or + 20 émeraude | 15 |

Total : 161 900 $ + 330 fer + 300 redstone + 140 or + 20 émeraude.

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
| 1 | 15 | ×1 | 8 cases/s | ×1,5 | le bâtiment : 4 000 $ + 100 fer + 40 redstone | 5 |
| 2 | 20 | ×1,3 | 10,4 cases/s | ×1,65 | 7 500 $ + 120 fer + 60 redstone | 7 |
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
| 1 | 0,5 | (le bâtiment : 3 000 $ + 120 pierre + 60 fer) | 200 | (de base) | 6 (le bâtiment) |
| 2 | 0,8 | 3 500 $ + 50 fer + 20 redstone | 400 | 2 500 $ + 40 fer | 7 |
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

- **Nombre max** (`maxEmployes`) = `EMPLOYES_NIVEAU_1 + EMPLOYES_PAR_NIVEAU × (niveau de la mine − 1)` = 4 + 2 × (N − 1) : **4, 6, 8, 10, 12**.
- **Prix de la n-ième embauche** (`PRIX_EMBAUCHE`, doublés le 29/10) : 100, 300, 800, 2 000, 5 000, 12 000, 28 000, 60 000, 120 000, 240 000 $, puis × 1,6 à chaque fois (`HAUSSE_APRES_LISTE`) : 384 000 $ (11e), 614 400 $ (12e). Arrondi à la dizaine sous 1 000 $, à la centaine au-dessus. Le prix ne dépend que de la taille actuelle de l'équipe.
- **Indemnités** (`indemnites`) = 40 % (`PART_INDEMNITES`) du prix de base de la dernière place : 40 $ pour 1 mineur, 800 $ pour 4, 24 000 $ pour 8, 245 800 $ pour 12.

### Travail

`NIVEAUX_EMPLOYE` (payés en argent, au Personnel) × la rareté (`RARETES`).

| Pioche | Vitesse en creusant | Sac | Prix (29/10) | Niv. joueur | Salaire / 5 min |
|---|---:|---:|---:|---:|---:|
| Bois | 0,15 bloc/s | 10 | (de base) | — | 35 $ |
| Pierre | 0,25 | 15 | 400 $ | 4 | 70 $ |
| Fer | 0,4 | 20 | 1 500 $ | 6 | 155 $ |
| Or | 0,6 | 30 | 6 000 $ | 9 | 350 $ |
| Diamant | 0,9 | 45 | 22 000 $ | 12 | 770 $ |

- **Un tour** : creuser un sac (`sac ÷ vitesse`), monter, vider (2 s), redescendre. **Blocs par seconde** (`blocsParSecondeEmploye`) = `sac ÷ (sac ÷ vitesse + 2 × trajet + 2)`.
- La rareté multiplie **la vitesse et le sac** par le même rendement : le temps de creusage d'un sac ne change pas, mais chaque tour rapporte plus (un mythique sort 5 fois plus de blocs par tour).

| Pioche (commun) | Échelle (10 s) | Ascenseur niveau 3 (2,8 s) | Ascenseur niveau 6 (1 s) |
|---|---:|---:|---:|
| Bois | 0,113 bloc/s | 0,135 | 0,142 |
| Pierre | 0,183 | 0,222 | 0,234 |
| Fer | 0,278 | 0,347 | 0,370 |
| Or | 0,417 | 0,521 | 0,556 |
| Diamant | 0,625 | 0,781 | 0,833 |

- **Salaire** (`salaireEmploye`) = `arrondi(SALAIRES[pioche] × rareté.salaire)`, pour 5 minutes. Depuis le 28/10 : `SALAIRES` = 35, 70, 155, 350, 770 $ toutes les 5 minutes (bois → diamant, environ 35 % de ce que le mineur fait sortir ; le 27/10, 50 à 1 100 $ toutes les 10 minutes, 25 %), et la rareté : ×1, ×1,4, ×1,8, ×2,5, ×4 (commun → mythique). Sans manager, on paie au plus 5 minutes d'avance (au prorata du temps manquant, arrondi au dollar supérieur).
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
| ⚒️ Forgeron | 5 × 5 | face avant droite | 1 | 1 | 30 $ + 15 pierre |
| 👷 Personnel | 5 × 5 | face avant droite | 1 | 2 | 250 $ + 50 pierre |
| 🎒 Bazar | 5 × 5 | face avant droite | 1 | 3 | 300 $ + 60 pierre |
| ⚡ Générateur | 5 × 5 | face avant droite | 2 | 5 | 4 000 $ + 100 fer + 40 redstone |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 2 | 6 | 3 000 $ + 120 pierre + 60 fer |

- Total au niveau 1 de la mine (marché, forgeron, Personnel, bazar) : **580 $ + 125 pierre** (avant le 29/10 : 180 $ + 70 pierre). Tous les bâtiments : **7 580 $ + 245 pierre + 160 fer + 40 redstone** (avant : 2 180 $ + 130 pierre + 80 fer + 20 redstone).
- On paie une seule fois ; déplacer ou retourner est gratuit ; on ne peut pas enlever un bâtiment.

### Rails et chemins

| Élément | Prix | Remarques |
|---|---|---|
| 🛤️ Rail (1 case) | **3 fer** (`COUT_RAIL`) | à partir du niveau 3 du joueur (29/10) |
| 🪨 Chemin de pavés (1 case) | 5 $ (`COUT_CHEMIN`) | seulement joli |

Enlever un rail ou un chemin ne rembourse rien ; les déplacer est gratuit.

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
- **mineurs** = pour chaque mineur **payé** : blocs par seconde × valeur moyenne (0 pour un pousseur), **moins** son salaire ÷ 600 ; moins le salaire du manager ÷ 600 s'il est au travail. Coffre plein : seulement la partie négative (les salaires) ;
- **foreuse** = vitesse (électricité comprise) × valeur moyenne, si elle tourne ;
- **total** = mine + mineurs + foreuse. Les **clics ne comptent pas**, ni les wagonnets (ils ne font que porter).

Ce que fait la mine seule : **0,61 $/s** au niveau 1, 1,15 au niveau 2, 2,25 au niveau 3, 4,57 au niveau 4, **7,92 $/s** au niveau 5.

## Ce que coûte chaque niveau de la mine

Ce qu'il faut pour descendre, et les grandes améliorations qui arrivent à peu près en même temps :

| Étape | Prix |
|---|---|
| Bâtiments du niveau 1 + 3 cases de rails | 580 $ + 125 pierre + 9 fer |
| Niveau 2 | 1 200 $ + 60 fer |
| Foreuse + générateur | 7 000 $ + 120 pierre + 160 fer + 40 redstone |
| Niveau 3 | 7 000 $ + 120 fer + 60 redstone |
| Niveau 4 | 25 000 $ + 120 redstone + 60 or |
| Niveau 5 | 110 000 $ + 130 or + 55 émeraude |
| Tout au maximum (coffre, pioches, sacs, ascenseur, wagonnet, générateur, forage, chariot, recruteur, manager) | environ 1,3 million de dollars (plus les pioches des mineurs : 29 900 $ par mineur) |

En plus de l'argent, chaque étape demande un **niveau du joueur** : 4 pour le niveau 2 de la mine, 7 pour le 3, 10 pour le 4, 13 pour le 5 (voir [Le niveau du joueur](#le-niveau-du-joueur)).

## Le niveau du joueur

Tout est expliqué dans [niveaux.md](niveaux.md) (29/10). En bref :

- **XP** (`XP_PAR`) : 1 par bloc cassé en cliquant, 40 par bâtiment, 3 par case de rails, 30 par trajet de wagonnet, 25 par embauche, 30 par niveau d'amélioration, 150 par niveau de mine, 3 par aller-retour de wagonnet. Chaque chose ne compte qu'une fois (records des compteurs, `recordsXp`).
- **Courbe** : `xpPourPasser(n) = 60 × n^1,8`, arrondi à la dizaine : 60 XP pour passer au niveau 2, 210 pour le 3, 430 pour le 4, 730 pour le 5, 3 790 pour le 11, 13 180 pour le 21. Il faut 1 430 XP au total pour le niveau 5, 11 680 pour le 10, 38 230 pour le 15, 279 500 pour le 30 (le maximum).
- **Déblocages** (`NIVEAU_JOUEUR_POUR`) : bâtiments (Personnel 2, Bazar 3, Générateur 5, Foreuse 6), rails 3, manager 11, et pour chaque amélioration le niveau donné dans les tableaux ci-dessus. Tout est débloqué au niveau 15.

## Le bot de simulation

`src/jeu/bot.ts` (`jouerPartie(aleatoire, maxSecondes = 9 h)`, 4 h avant le 29/10) joue une partie de la mine automatique avec seulement des actions qu'un joueur peut faire, jusqu'au **niveau 5** de la mine. Depuis le 29/10, il gagne de l'XP comme un joueur et **attend ses niveaux** pour débloquer bâtiments et améliorations ; il note quand il arrive à chaque niveau du joueur (`tempsNiveauxJoueur`). `bot.test.ts` le fait jouer **10 parties** avec des graines fixes (1 à 10, générateur `mulberry32` : les résultats sont toujours les mêmes).

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
| Niveau 5 (médiane) | **4 h à 7 h** (1 h à 2 h 30 avant le 29/10) |
| Niveau du joueur (médianes, 29/10) | le niveau 5 **après 8 minutes au moins**, le niveau 10 **après 1 heure au moins** |
| Progression | chaque niveau prend plus de temps que le précédent (médiane, à 20 % près) |
| Rails | le trajet Mine → Marché existe en **moins de 10 minutes** (toutes les parties ; 5 avant le 29/10) |
| Électricité | les rails sont électriques en **moins de 1 h 30** (toutes les parties ; 40 minutes avant le 29/10) |
| Automatisation | au moins 4 mineurs, plus de 100 voyages de wagonnet, et les mineurs sortent plus de blocs que les clics |
| Début à pied | plus de 3 allers-retours à pied au marché |

### Résultats mesurés (29/10, 10 parties)

| Mesure | Minimum | Médiane | Maximum |
|---|---:|---:|---:|
| Arrivée au niveau 2 de la mine | 21,0 min | **26,1 min** | 36,3 min |
| Arrivée au niveau 3 | 1 h 43 | **2 h 07** | 2 h 23 |
| Arrivée au niveau 4 | 3 h 13 | **3 h 58** | 4 h 12 |
| Arrivée au niveau 5 | 5 h 12 | **5 h 45** | 6 h 04 |
| Rails posés | 2,6 min | 3,5 min | 6,4 min |
| Rails électriques | 48 min | 57 min | 69 min |
| Allers-retours à pied | 46 | 109 | 321 |
| Niveau 3 du joueur (les rails) | 2,4 min | 2,6 min | 4,0 min |
| Niveau 5 du joueur | 10,5 min | **14,5 min** | 26,8 min |
| Niveau 10 du joueur | 1 h 16 | **1 h 20** | 1 h 32 |
| Niveau 15 du joueur | 4 h 06 | 4 h 12 | 4 h 23 |

À la fin (médianes) : le joueur au **niveau 16**, 8 mineurs, environ 3 200 voyages de wagonnet, 40 600 blocs cliqués, 64 700 blocs creusés par les mineurs, 5 800 blocs sortis seuls de la mine, 1,07 million de dollars gagnés. Le bot finit avec la pioche en or, l'ascenseur au niveau 3, le coffre de 4 000 places et le générateur jamais amélioré.

Pour mémoire, le 22/10 (avant les prix relevés et le niveau du joueur) : niveau 2 en 11,6 min, niveau 5 en 1 h 38, rails électriques en 18,5 min (médianes).

## Durées de jeu attendues

| Repère | Valeur | Source |
|---|---|---|
| Niveau 2 de la mine | **15 à 40 min** (médiane) ; mesuré : 26 min | `bot.test.ts` |
| Niveau 5 de la mine | **4 h à 7 h** (médiane) ; mesuré : 5 h 45 | `bot.test.ts` |
| Rails mine → marché | moins de 10 min | `bot.test.ts` |
| Rails électriques | moins de 1 h 30 | `bot.test.ts` |
| Niveau 5 / niveau 10 du joueur | après 8 min / après 1 h (médianes) ; 14,5 min / 1 h 20 | `bot.test.ts` |
| Remplir le coffre de départ (débit seul) | 8 min 20 | `NIVEAUX_COFFRE`, `NIVEAUX_MINE` |
| Une paie de mineur | 5 min | `SECONDES_PAR_PAIE` |
| Un charbon dans la foreuse / une redstone dans le générateur | 20 s / 30 s | `SECONDES_PAR_CHARBON`, `SECONDES_PAR_REDSTONE` |
| Remplir le chariot de la foreuse | 400 s (niveau 1) à 1 667 s (niveau 6), sans électricité | `NIVEAUX_CHARIOT`, `NIVEAUX_FORAGE` |
| Un trajet de mineur | 10 s (échelle) à 1 s (ascenseur niveau 6) | `NIVEAUX_ASCENSEUR` |
| Rattrapage hors ligne | 8 h au plus | `ABSENCE_MAX` |
| Le joueur traverse la clairière (60 cases) | ≈ 8 s (7,5 cases/s) | `VITESSE_JOUEUR` |
