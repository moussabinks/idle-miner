# Équilibrage : toutes les données et les formules

> Toutes les tables chiffrées du jeu et les formules globales, réunies au même endroit, d'après le code au 20/10 (`src/jeu/donnees.ts`, `mine.ts`, `mineur.ts`, `talents.ts`, `foreuse.ts`, `employes.ts`, `revenu.ts`, `conditionsPrestige.ts`, `bot.ts`, `bot.test.ts`).
> Pour le fonctionnement de chaque bâtiment (boutons, messages, cas limites), voir les fiches de [../batiments/](../batiments/README.md). Pour le concept et la progression en un coup d'œil, voir [vue-d-ensemble.md](vue-d-ensemble.md).

Conventions : les profondeurs sont en mètres positifs (« 35 » = -35 m). « Mine de référence » = la mine de 150 m pour laquelle les profondeurs des données sont écrites (c'est la vraie mine au prestige 1). Les niveaux « code » commencent à 0 quand c'est le cas dans le code (sac, foreuse, pioches des mineurs).

## Sommaire

1. [Constantes générales](#constantes-générales)
2. [La mine et sa mise à l'échelle](#la-mine-et-sa-mise-à-léchelle)
3. [Les blocs](#les-blocs)
4. [La génération des blocs](#la-génération-des-blocs)
5. [Les pioches](#les-pioches)
6. [Vitesse de minage, usure, Fortune](#vitesse-de-minage-usure-fortune)
7. [Ventes, coffres, géodes, lave](#ventes-coffres-géodes-lave)
8. [Sacs et seaux](#sacs-et-seaux)
9. [Ascenseur](#ascenseur)
10. [Enchantements](#enchantements)
11. [Les plafonds par prestige](#les-plafonds-par-prestige)
12. [Bonus de prestige](#bonus-de-prestige)
13. [Foreuse](#foreuse)
14. [Mineurs employés, salaires, raretés, recruteur, manager](#mineurs-employés)
15. [Les talents](#les-talents)
16. [Revenus par seconde (`revenu.ts`)](#revenus-par-seconde)
17. [Ce que coûte chaque prestige](#ce-que-coûte-chaque-prestige)
18. [Le bot de simulation](#le-bot-de-simulation)
19. [Durées de jeu attendues](#durées-de-jeu-attendues)

---

## Constantes générales

| Constante | Valeur | Rôle |
|---|---|---|
| `LARGEUR_MINE` | 10 | blocs par couche |
| `PROFONDEUR_DEPART` | 2 | une partie commence à -2 m (le 1er mètre est l'entrée du puits) |
| `PROFONDEUR_BEDROCK_DEPART` | 100 | bedrock au prestige 0 |
| `PROFONDEUR_EN_PLUS_PAR_PRESTIGE` | 50 | la bedrock descend de 50 m par prestige |
| `PROFONDEUR_REFERENCE` | 150 | profondeur de la mine de référence |
| `PROFONDEUR_DEEPSLATE` | 94 (référence) | sous cette profondeur : roche dure |
| `COUCHES_VISIBLES_DESSOUS` | 4 | couches visibles (et générées à l'avance) sous la couche en cours |
| `VITESSE_JEU` | 0,45 | facteur de la formule de durée de casse |
| `VITESSE_MAINS_NUES` | 1 | vitesse avec une pioche cassée |
| `SECONDES_PAR_METRE_ECHELLE` | 0,15 s | un mètre à l'échelle |
| `SECONDES_PAR_CASE` | 0,12 s | une case de marche au front de taille (jusqu'au puits) |
| `POIDS_ROCHE` | 100 | poids de la roche de base dans le tirage |
| Horloge (`usePartie.ts`) | tic de 50 ms | tout avance au même rythme (plus souvent pendant les trajets, sans changer la vitesse) |
| Absence max (`ABSENCE_MAX`) | 8 h | temps rattrapé au retour (foreuse, mineurs, manager, trajets) |
| `VERSION_ETAT` | 17 | version de la sauvegarde |

## La mine et sa mise à l'échelle

- **Bedrock** : `profondeurBedrock(P) = 100 + 50 × P`. La dernière couche creusable est à `bedrock − 1` (-99 m au prestige 0). En la finissant, `victoire = true` et on continue en galerie.
- **Échelle de la mine** : `echelleMine(P) = bedrock / 150`. Une profondeur de référence `r` devient la vraie profondeur `round(r × échelle)` (`depuisReference`) ; une vraie profondeur `p` correspond à `p / échelle` en référence (`versReference`). Tout est mis à l'échelle : minerais, roche dure, zones, blocs spéciaux, profondeur max des pioches et des mineurs.

| Prestige | Bedrock | Échelle | Roche dure sous | Terre jusqu'à | Gravier jusqu'à | Coffres sous | Lave sous | Géodes sous |
|---|---|---|---|---|---|---|---|---|
| 0 | 100 | 0,667 | 62,7 | 4,7 | 37,3 | 12,7 | 31,3 | 39,3 |
| 1 | 150 | 1 | 94 | 7 | 56 | 19 | 47 | 59 |
| 2 | 200 | 1,333 | 125,3 | 9,3 | 74,7 | 25,3 | 62,7 | 78,7 |
| 3 | 250 | 1,667 | 156,7 | 11,7 | 93,3 | 31,7 | 78,3 | 98,3 |
| 4 | 300 | 2 | 188 | 14 | 112 | 38 | 94 | 118 |
| 5 | 350 | 2,333 | 219,3 | 16,3 | 130,7 | 44,3 | 109,7 | 137,7 |
| 6 | 400 | 2,667 | 250,7 | 18,7 | 149,3 | 50,7 | 125,3 | 157,3 |
| 7 | 450 | 3 | 282 | 21 | 168 | 57 | 141 | 177 |
| 8 | 500 | 3,333 | 313,3 | 23,3 | 186,7 | 63,3 | 156,7 | 196,7 |

(Ces seuils sont comparés à la vraie profondeur de la couche : « sous 12,7 » = à partir de -13 m.)

**Zones** (ambiance, profondeur de référence maximum, `ZONES`) : Surface ≤ 7, Cavernes ≤ 35, Mines ≤ 70, Profondeurs ≤ 94, Roche dure ≤ 122, Abîmes ≤ 150.

## Les blocs

Table `BLOCS` (`donnees.ts`). « Fortune » = `minerai: true` ; « spécial » = ne va pas dans le sac.

| Bloc (id) | Nom affiché | Prix | Dureté | Fortune | Spécial |
|---|---|---:|---:|:---:|:---:|
| `terre` | Terre | 1 $ | 0,5 | non | non |
| `gravier` | Gravier | 1 $ | 0,6 | non | non |
| `pierre` | Pierre | 1 $ | 1,5 | non | non |
| `deepslate` | Roche dure | 2 $ | 3 | non | non |
| `charbon` | Charbon | 5 $ | 3 | oui | non |
| `fer` | Fer | 12 $ | 3 | oui | non |
| `redstone` | Redstone | 15 $ | 3 | oui | non |
| `lapis` | Lapis-lazuli | 20 $ | 3 | oui | non |
| `or` | Or | 35 $ | 3 | oui | non |
| `emeraude` | Émeraude | 80 $ | 3 | oui | non |
| `diamant` | Diamant | 100 $ | 3 | oui | non |
| `debris` | Débris antiques | 400 $ | 30 | non | non |
| `amethyste` | Améthyste | 50 $ | 1,5 | non | non (vient des géodes) |
| `obsidienne` | Obsidienne | 60 $ | 3 | non | non (vient de la lave éteinte) |
| `lave` | Lave | 0 | 1 | non | oui |
| `coffre` | Coffre | 0 | 2,5 | non | oui |
| `geode` | Géode | 0 | 1,5 | non | oui |

Minerais possibles dans un coffre (`MINERAIS_COFFRE`) : charbon, fer, redstone, lapis, or, émeraude, diamant (un au hasard parmi ceux qui existent à cette profondeur, sinon charbon).

## La génération des blocs

Chaque bloc d'une couche est tiré au hasard, **pondéré** (`choisirPondere` : un poids 2 sort deux fois plus qu'un poids 1). La liste des poids à une profondeur (`poidsDesBlocs`), avec `r` = profondeur de référence :

| Bloc | Condition (référence) | Poids |
|---|---|---|
| Terre | r ≤ 7 | 100 |
| Pierre | 7 < r ≤ 94 | 100 |
| Roche dure | r > 94 | 100 |
| Gravier | r ≤ 56 | 30 si r ≤ 7, sinon 10 |
| Minerais | voir ci-dessous | progressif |
| Coffre | r > 19 | 0,8 |
| Lave | r > 47 | 1,5 |
| Géode | r > 59 | 1 |

**Apparition progressive des minerais** (`APPARITION_MINERAIS`) : poids 0 avant `début`, `poidsDébut` à `début`, puis montée linéaire jusqu'à `poidsPlein` à `plein`, et constant ensuite :
`poids = poidsDébut + (poidsPlein − poidsDébut) × (r − début) / (plein − début)`.

| Minerai | Début (réf.) | Plein (réf.) | Poids début | Poids plein |
|---|---:|---:|---:|---:|
| Charbon | 8 | 35 | 6 | 16 |
| Fer | 8 | 41 | 3 | 12 |
| Redstone | 21 | 59 | 0,5 | 6 |
| Or | 29 | 76 | 0,4 | 5 |
| Lapis | 35 | 76 | 0,5 | 6 |
| Émeraude | 47 | 82 | 0,2 | 2 |
| Diamant | 53 | 117 | 0,2 | 5 |
| Débris antiques | 112 | 135 | 0,2 | 1 |

Les mêmes profondeurs dans la vraie mine (début → plein, en mètres) :

| Minerai | P0 (100 m) | P1 (150 m) | P2 (200 m) | P3 (250 m) | P4 (300 m) | P8 (500 m) |
|---|---|---|---|---|---|---|
| Charbon | 5 → 23 | 8 → 35 | 11 → 47 | 13 → 58 | 16 → 70 | 27 → 117 |
| Fer | 5 → 27 | 8 → 41 | 11 → 55 | 13 → 68 | 16 → 82 | 27 → 137 |
| Redstone | 14 → 39 | 21 → 59 | 28 → 79 | 35 → 98 | 42 → 118 | 70 → 197 |
| Or | 19 → 51 | 29 → 76 | 39 → 101 | 48 → 127 | 58 → 152 | 97 → 253 |
| Lapis | 23 → 51 | 35 → 76 | 47 → 101 | 58 → 127 | 70 → 152 | 117 → 253 |
| Émeraude | 31 → 55 | 47 → 82 | 63 → 109 | 78 → 137 | 94 → 164 | 157 → 273 |
| Diamant | 35 → 78 | 53 → 117 | 71 → 156 | 88 → 195 | 106 → 234 | 177 → 390 |
| Débris | 75 → 90 | 112 → 135 | 149 → 180 | 187 → 225 | 224 → 270 | 373 → 450 |

- **Foreuse et mineurs employés** tirent avec `tirerBlocNormal` : la même liste **sans** lave, coffre ni géode.
- **Valeur moyenne d'un bloc** (prix de base, blocs normaux seulement, `valeurMoyenneBloc`), selon la profondeur de référence (identique à chaque prestige, puisque tout est à l'échelle) :

| Profondeur de référence | 5 | 10 | 20 | 35 | 50 | 70 | 94 | 110 | 130 | 149 |
|---|---|---|---|---|---|---|---|---|---|---|
| Sans Fortune | 1,00 $ | 1,55 $ | 1,87 $ | 2,83 $ | 3,84 $ | 6,35 $ | 7,96 $ | 9,35 $ | 11,77 $ | 12,22 $ |
| Avec 60 % de doublement (Fortune III) | 1,00 $ | 1,93 $ | 2,48 $ | 4,05 $ | 5,70 $ | 9,75 $ | 12,34 $ | 14,17 $ | 16,76 $ | 17,19 $ |

## Les pioches

Table `PIOCHES`. Le prix se paie en argent **et** minerais, à chaque achat (déblocage ou rachat neuf). La pioche en bois est offerte au début de la partie.

| Niveau | Pioche | Vitesse | Prof. max (réf.) | Durabilité | Prix | Minerais à l'achat | Réparée avec |
|---|---|---:|---:|---:|---:|---|---|
| 0 | 🪵 Bois | 2 | 35 | 60 | 5 $ | — | argent seulement |
| 1 | 🪨 Pierre | 4 | 70 | 160 | 40 $ | — | 3 pierres |
| 2 | ⚙️ Fer | 6 | 112 | 250 | 300 $ | — | 3 fer |
| 3 | 💎 Diamant | 8 | 136 | 500 | 2 000 $ | 3 diamants | 3 diamants |
| 4 | 🔥 Netherite | 9 | 150 | 800 | 3 000 $ | 4 débris + 4 or | 3 débris |
| — | ✋ Mains nues | 1 | (celle de la pioche équipée) | — | — | — | — |

On ne peut débloquer que la pioche juste après la meilleure (`niveau ≤ meilleure + 1`).

**Profondeur max réelle** (`profondeurMaxPioche = round(profMax × échelle)`) :

| Pioche | P0 | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 |
|---|---|---|---|---|---|---|---|---|---|
| Bois | 23 | 35 | 47 | 58 | 70 | 82 | 93 | 105 | 117 |
| Pierre | 47 | 70 | 93 | 117 | 140 | 163 | 187 | 210 | 233 |
| Fer | 75 | 112 | 149 | 187 | 224 | 261 | 299 | 336 | 373 |
| Diamant | 91 | 136 | 181 | 227 | 272 | 317 | 363 | 408 | 453 |
| Netherite | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 |

On descend tant que la couche suivante est ≤ la profondeur max ; sinon, galerie horizontale. Seule la netherite atteint la bedrock.

**Réparation** (`coutReparation`) : `argent = max(1, ceil(prix × 0,5 × min(1, usure / durabilité)))` + **3 minerais** de réparation (`MINERAIS_REPARATION = 3`, `PART_PRIX_REPARATION = 0,5`), quelle que soit l'usure. Une pioche cassée coûte donc la moitié de son prix (bois 3 $, pierre 20 $ + 3 pierres, fer 150 $ + 3 fer, diamant 1 000 $ + 3 diamants, netherite 1 500 $ + 3 débris). Détail : [../batiments/forgeron.md](../batiments/forgeron.md).

## Vitesse de minage, usure, Fortune

### Vitesse du joueur (`vitesse`, `vitesseA`)

```
si pioche cassée : vitesse = 1 (aucun bonus)
sinon : vitesse = vitesse de la pioche
                × (1 + 0,25 × Efficacité)
                × (1 + 0,10 × prestige)
                × 1,15 si talent Poigne de fer
        × 1,25 en plus dans la roche dure si talent Briseur de roche
```

### Durée pour casser un bloc (`dureeCasse`)

```
durée (s) = dureté × (1,5 si roche dure) ÷ vitesse × 0,45
```

« Roche dure » ici = la **profondeur** est sous 94 m de référence (le malus s'applique à tous les blocs de la couche, minerais compris). Exemples au prestige 0, sans bonus : pierre avec la pioche en fer 0,11 s, minerai en roche dure avec la netherite 0,23 s, débris antiques en roche dure avec la netherite 2,25 s (tableau complet dans [../batiments/forgeron.md](../batiments/forgeron.md#la-vitesse-de-minage)).

### Usure (`casserBloc`)

À chaque bloc cassé avec une pioche non cassée :

```
chance d'user d'1 point = (0,7 si talent Pioche robuste, sinon 1) ÷ (Solidité + 1)
```

Une pioche dure donc en moyenne `durabilité × (Solidité + 1)` blocs (÷ 0,7 avec Pioche robuste).

### Fortune (`chanceDoublement`, `nbDrops`)

```
chance de doubler = 0,2 × Fortune + 0,1 si talent Œil de lynx
```

Seulement sur les minerais (`minerai: true`) : 1 objet, ou 2 si le tirage tombe sous la chance. Jamais plus de ×2. Maximum : 0,6 (Fortune III), 0,7 avec Œil de lynx. Fortune ne s'applique ni à la foreuse ni aux mineurs employés.

## Ventes, coffres, géodes, lave

- **Bonus de vente** (`bonusVente`) : `1 + 0,15 × prestige + 0,10 (Négociant) + 0,15 (Grand négociant)`.
- **Prix d'un lot** (`valeurDe`) : `round(Σ quantité × prix de base × bonus de vente)` (arrondi une fois, sur le total). Même calcul pour le marché, la cabine d'ascenseur qui arrive au village, et les ventes des mineurs employés.
- **Chariot de la foreuse** (`valeurAuChariot`) : `round(valeurDe(lot) × 1,2 si talent Grossiste)`.
- **Coffre** : `argent = ((entier 20 à 60) + profondeur réelle × (entier 3 à 8)) × 2 si Chasseur de trésors`, + 1 minerai de `MINERAIS_COFFRE` présent à cette profondeur (dans le sac, ou sur le quai). L'argent compte dans l'argent gagné.
- **Géode** : 3 à 6 améthystes (entier au hasard).
- **Lave** : avec un seau (consommé) → +1 obsidienne ; sans seau → chaque pile du sac perd `floor(pile / 3)` (le quai n'est pas touché).
- **Sac plein** : l'objet va sur le quai de l'ascenseur s'il y a de la place, sinon il est perdu.

## Sacs et seaux

| Niveau (code) | Places | Prix | Permis dès le prestige |
|---|---:|---:|---|
| 0 | 32 | gratuit | 0 |
| 1 | 64 | 80 $ | 0 |
| 2 | 128 | 400 $ | 0 |
| 3 | 256 | 1 500 $ | 2 |
| 4 | 512 | 5 000 $ | 3 |
| 5 | 1 024 | 15 000 $ | 4 |
| 6 | 2 048 | 40 000 $ | 5 |

Total de 32 à 2 048 places : 61 980 $. **Seau d'eau** : `PRIX_SEAU = 25 $`, sans limite. Détail : [../batiments/bazar.md](../batiments/bazar.md).

## Ascenseur

Table `NIVEAUX_ASCENSEUR` (niveau 0 = pas construit). Les minerais se paient avec le sac.

| Niveau | Coût | Capacité (objets / voyage, et taille du quai) | Temps par mètre | Permis dès le prestige |
|---|---|---:|---:|---|
| 1 | 250 $ + 8 fer | 32 | 0,1 s | 0 |
| 2 | 1 200 $ + 15 fer + 5 redstone | 64 | 0,07 s | 0 |
| 3 | 2 000 $ + 30 fer + 15 redstone | 128 | 0,05 s | 1 |
| 4 | 4 500 $ + 50 fer + 30 redstone | 256 | 0,03 s | 2 |
| 5 | 9 000 $ + 80 fer + 50 redstone | 512 | 0,02 s | 3 |
| 6 | 18 000 $ + 120 fer + 80 redstone | 1 024 | 0,015 s | 4 |

Total : 34 950 $ + 303 fer + 180 redstone. Temps par mètre ÷ 1,3 avec le talent Ascenseur express. Échelle, pour comparer : 0,15 s/m. La cabine charge d'abord le quai, puis le sac, les objets les plus chers d'abord, dans la limite de la capacité. Détail : [../batiments/mine.md](../batiments/mine.md).

## Enchantements

Table `ENCHANTEMENTS`. Coût du niveau `n` (`coutEnchantement`) :

```
argent = argentParNiveau × n²     lapis = lapisParNiveau × n     émeraudes = emeraudesParNiveau × n
```

| Enchantement | Effet | Max | Argent / niveau | Lapis / niveau | Émeraudes / niveau |
|---|---|---:|---:|---:|---:|
| Efficacité | +25 % de vitesse par niveau | V | 400 | 3 | 1 |
| Fortune | +20 % de chance de doubler un minerai par niveau | III | 600 | 4 | 1 |
| Solidité | usure ÷ (niveau + 1) | III | 300 | 3 | 1 |

| Niveau | Efficacité | Fortune | Solidité |
|---|---|---|---|
| I | 400 $ + 3 lapis + 1 ém. | 600 $ + 4 lapis + 1 ém. | 300 $ + 3 lapis + 1 ém. |
| II | 1 600 $ + 6 + 2 | 2 400 $ + 8 + 2 | 1 200 $ + 6 + 2 |
| III | 3 600 $ + 9 + 3 | 5 400 $ + 12 + 3 | 2 700 $ + 9 + 3 |
| IV | 6 400 $ + 12 + 4 | — | — |
| V | 10 000 $ + 15 + 5 | — | — |
| **Total** | 22 000 $ + 45 lapis + 15 ém. | 8 400 $ + 24 lapis + 6 ém. | 4 200 $ + 18 lapis + 6 ém. |

Ils valent pour toutes les pioches du joueur (pas la foreuse ni les mineurs) et sont gardés au prestige. Détail : [../batiments/enchanteur.md](../batiments/enchanteur.md).

## Les plafonds par prestige

`PLAFONDS` (`donnees.ts`), lu par `niveauMaxAuPrestige(id, P)` :

```
si paliers : niveau max = paliers[min(P − déblocage, longueur − 1)]   (avec P − déblocage ≥ 0)
sinon       : niveau max = min(niveauMax, niveauAuDéblocage + floor(max(0, P − déblocage) / prestigesParNiveau))
```

| Amélioration | Déblocage | Niveau au déblocage | Niveau max | Rythme |
|---|---:|---:|---:|---|
| `ascenseur` (niveaux 1 à 6) | 0 | 2 | 6 | +1 par prestige |
| `sac` (code 0 à 6) | 1 | 2 (128 places) | 6 (2 048) | +1 par prestige (le niveau 2 vaut aussi au prestige 0) |
| `forage` (code 0 à 7) | 1 | 0 | 7 | +1 par prestige |
| `chariot` (code 0 à 7) | 1 | 0 | 7 | +1 par prestige |
| `mineur` (code 0 bois … 4 netherite) | 2 | 1 | 4 | paliers `[1, 3, 4]` |
| `recruteur` (niveaux 1 à 4) | 4 | 1 | 4 | +1 par prestige |
| `efficacite` | 0 | 1 | 5 | +1 tous les 2 prestiges |
| `fortune` | 0 | 1 | 3 | +1 tous les 2 prestiges |
| `solidite` | 0 | 1 | 3 | +1 tous les 2 prestiges |

Ce que ça donne (niveaux affichés au joueur ; « — » = pas encore débloqué) :

| Prestige | Ascenseur | Sac | Efficacité | Fortune | Solidité | Forage | Chariot | Pioche des mineurs | Mineurs max | Recruteur |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 2 | 128 | I | I | I | — | — | — | — | — |
| 1 | 3 | 128 | I | I | I | 1 | 1 | — | — | — |
| 2 | 4 | 256 | II | II | II | 2 | 2 | Pierre | 2 | — |
| 3 | 5 | 512 | II | II | II | 3 | 3 | Diamant | 3 | — |
| 4 | 6 | 1 024 | III | III | III | 4 | 4 | Netherite | 4 | 1 |
| 5 | 6 | 2 048 | III | III | III | 5 | 5 | Netherite | 5 | 2 |
| 6 | 6 | 2 048 | IV | III | III | 6 | 6 | Netherite | 6 | 3 |
| 7 | 6 | 2 048 | IV | III | III | 7 | 7 | Netherite | 6 | 4 |
| 8 et + | 6 | 2 048 | V | III | III | 8 | 8 | Netherite | 6 | 4 |

(« Mineurs max » vient de `maxEmployes = min(6, prestige)` dès le prestige 2, +1 avec Grande équipe ; ce n'est pas un plafond de `PLAFONDS`.) Les pioches du joueur et le manager ne sont pas plafonnés.

**Conditions de prestige** (`conditionsPrestige`) : bedrock atteinte ; ascenseur, sac et chacun des 3 enchantements au plafond ; si prestige ≥ 1 : foreuse activée, et forage et chariot au plafond quand celui-ci dépasse le niveau de base (donc à partir du prestige 2) ; la pioche de **chaque mineur embauché** au plafond ; si prestige ≥ 4 : recruteur au plafond. Une sauvegarde déjà au-dessus d'un plafond garde ses niveaux.

## Bonus de prestige

| Constante | Valeur | Effet |
|---|---|---|
| `BONUS_PRESTIGE` | 0,15 | +15 % sur toutes les ventes par prestige (et +15 % sur les salaires des mineurs) |
| `BONUS_VITESSE_PRESTIGE` | 0,10 | +10 % de vitesse des pioches du joueur par prestige (pas les mineurs, pas la foreuse) |
| Profondeur | +50 m | la bedrock descend de 50 m par prestige |
| Points de talent | 1 | `points disponibles = prestige − talents pris` |

## Foreuse

| Constante | Valeur |
|---|---|
| `PRESTIGE_FOREUSE` | 1 |
| `COUT_ACTIVATION_FOREUSE` | 5 000 $ + 10 fer + 5 redstone (une seule fois, pour toujours) |
| `SECONDES_PAR_CHARBON` | 20 s de forage par charbon |
| `NIVEAU_RECHARGE_AUTO` | 2 (le 3e niveau de forage ; dès le 1er avec Moteur autonome) |
| `RESERVE_RECHARGE_AUTO` | 60 s : en recharge auto, un charbon foré va au moteur si la réserve est sous 60 s, sinon au chariot |
| `BLOCS_FORES_PAR_METRE` | 10 : elle descend d'1 m tous les 10 blocs, de -1 m jusqu'à `bedrock − 1` |

| Niveau | Forage (blocs/s) | Coût du forage | Chariot (places) | Coût du chariot | Temps pour remplir (même niveau) | Valeur moyenne forée au fond, prix de base |
|---|---:|---|---:|---|---:|---:|
| 1 | 2 | de base | 1 000 | de base | 500 s | 24,4 $/s |
| 2 | 3 | 2 500 $ + 20 fer + 5 redstone | 1 500 | 1 500 $ + 10 fer | 500 s | 36,6 $/s |
| 3 | 5 | 6 000 $ + 40 fer + 20 redstone | 2 500 | 4 000 $ + 25 fer + 10 redstone | 500 s | 61,1 $/s |
| 4 | 8 | 12 000 $ + 60 fer + 40 redstone | 4 000 | 9 000 $ + 45 fer + 25 redstone | 500 s | 97,7 $/s |
| 5 | 12 | 25 000 $ + 90 fer + 70 redstone | 6 000 | 18 000 $ + 70 fer + 45 redstone | 500 s | 146,6 $/s |
| 6 | 16 | 40 000 $ + 130 fer + 100 redstone | 8 000 | 28 000 $ + 100 fer + 70 redstone | 500 s | 195,5 $/s |
| 7 | 22 | 65 000 $ + 180 fer + 140 redstone | 10 500 | 45 000 $ + 140 fer + 100 redstone | 477 s | 268,7 $/s |
| 8 | 30 | 100 000 $ + 250 fer + 200 redstone | 15 000 | 70 000 $ + 200 fer + 150 redstone | 500 s | 366,5 $/s |

- `vitesseForage = vitesse du niveau × 1,5 (Foreuse turbo)` ; `capaciteChariot = capacité × 2 (Grand chariot)`.
- Règle de dessin (20/10) : capacité du chariot ≈ vitesse de forage du même niveau × 480 s, donc un chariot se remplit en ~8 min ; 25 charbons environ par chariot rempli (24 au niveau 7).
- Elle tourne seulement si : active, carburant > 0, chariot pas plein. Elle ne tire jamais de lave, coffre ni géode ; pas de Fortune.
- La dernière colonne est `vitesse × valeurMoyenneBloc(149 m de référence)`, avant bonus de vente : ce que rapporte le forage tout au fond de la mine.
- Pour tout monter au niveau 8 : forage 250 500 $ + 770 fer + 575 redstone ; chariot 175 500 $ + 590 fer + 400 redstone.

Détail : [../batiments/foreuse.md](../batiments/foreuse.md).

## Mineurs employés

### Embauche, licenciement, travail

| Constante | Valeur |
|---|---|
| `PRESTIGE_EMPLOYES` | 2 |
| `MAX_EMPLOYES` | 6 ; `maxEmployes = min(6, prestige) + 1 (Grande équipe)` |
| `PRIX_EMBAUCHE` | 5 000, 12 000, 25 000, 50 000, 90 000, 150 000, 250 000 $ (selon le nombre de mineurs **actuels**), puis × `HAUSSE_APRES_LISTE = 1,6` à chaque fois ; × 0,7 avec Recrutement à prix cassé ; arrondi à la centaine (100 $ au moins) |
| `PART_INDEMNITES` | 0,4 : `indemnités = arrondi(prix de base de la n-ième embauche × 0,4 × 0,5 si Indemnités réduites)`, n = taille actuelle de l'équipe (donc 40 % du prix payé pour le dernier mineur arrivé, sans la réduction « prix cassé ») ; arrondi à la centaine, 100 $ au moins |
| `DUREE_MIN_TRAJET_EMPLOYE` | 5 s : un trajet complet dure au moins 5 s |
| `SECONDES_VENTE_EMPLOYE` | 4 s au marché pour vendre |
| `BLOCS_PAR_METRE_EMPLOYE` | 5 : il descend d'1 m tous les 5 blocs (jusqu'à sa profondeur max) |
| `PAS_EMPLOYES` | le travail avance par morceaux de 30 s (pour que le manager paie entre deux morceaux) |
| `NOMS_EMPLOYES` | Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot |

Équipement (`NIVEAUX_EMPLOYE`, argent seulement) : chaque niveau donne une meilleure pioche **et** un plus grand sac.

| Code | Pioche | Vitesse (blocs/s) | Prof. max (réf.) | Sac | Coût | Salaire de base / 10 min (`SALAIRES`) |
|---|---|---:|---:|---:|---:|---:|
| 0 | Bois | 0,8 | 35 | 32 | de base | 200 $ |
| 1 | Pierre | 1,2 | 70 | 48 | 3 500 $ | 600 $ |
| 2 | Fer | 1,8 | 112 | 64 | 8 000 $ | 1 300 $ |
| 3 | Diamant | 2,5 | 136 | 96 | 17 000 $ | 2 300 $ |
| 4 | Netherite | 3,2 | 149 | 128 | 33 000 $ | 3 000 $ |

Formules (`employes.ts`) :

```
vitesse        = vitesse de la pioche × 1,25 (Contremaître) × rendement de la rareté
taille du sac  = round(sac de la pioche × 2 (Sacs d'équipe) × rendement de la rareté)
profondeur max = min(round(profMax × échelle), bedrock − 1)
temps par mètre (trajet) = max(temps/m de ton ascenseur (ou 0,1 × talent si pas construit), 5 s / max(1, profondeur − 1))
salaire (10 min) = round(SALAIRES[pioche] × salaire de la rareté × (1 + 0,15 × prestige) × 0,75 (Salaires négociés))
```

Boucle : descend → creuse (jusqu'au sac plein) → monte → vend (4 s, tout l'argent pour le joueur, au bonus de vente) → redescend. Le temps payé s'écoule pendant tout le travail ; sans temps payé, il remonte, vend, puis attend au stand Personnel.

### Salaires

| Constante | Valeur |
|---|---|
| `SECONDES_PAR_PAIE` | 600 s (10 min) |
| Paie sans manager | on complète chaque mineur jusqu'à 10 min payées, au prorata : `ceil(salaire × secondes / 600)` |
| À l'embauche | les 10 premières minutes sont comprises |
| Au prestige | chaque mineur (et le manager) a au moins 10 min payées |

**Rentabilité** (calculée avec `revenuBrutEmploye`, mineur commun sans talent, au fond de sa galerie, ascenseur au plafond du prestige) : le salaire vaut environ **17 à 20 %** de ce que le mineur rapporte.

| Prestige | Bois | Pierre | Fer | Diamant | Netherite |
|---|---|---|---|---|---|
| 2 (asc. 4) | 1 315 $ / 260 $ | 4 386 $ / 780 $ | 9 499 $ / 1 690 $ | 17 194 $ / 2 990 $ | 21 826 $ / 3 900 $ |
| 5 (asc. 6) | 1 765 $ / 350 $ | 5 915 $ / 1 050 $ | 12 794 $ / 2 275 $ | 23 499 $ / 4 025 $ | 30 174 $ / 5 250 $ |
| 8 (asc. 6) | 2 217 $ / 440 $ | 7 442 $ / 1 320 $ | 15 719 $ / 2 860 $ | 27 662 $ / 5 060 $ | 35 054 $ / 6 600 $ |

(« rapporte en 10 min / salaire de 10 min ».) Le test `employes.test.ts` vérifie, aux prestiges 2, 5 et 9 et pour chaque pioche, que le salaire reste entre 10 % et 35 % de ce que rapporte le mineur au fond.

### Raretés (`RARETES`)

| Rareté | Rendement (vitesse et sac) | Salaire | Couleur |
|---|---:|---:|---|
| Commun | ×1 | ×1 | `#b9b4ab` |
| Rare | ×1,5 | ×1,25 | `#4f9df0` |
| Épique | ×2 | ×1,5 | `#b06cf0` |
| Légendaire | ×3 | ×2 | `#f5a524` |
| Mythique | ×5 | ×3 | `#ff4d8d` |

### Recruteur (`NIVEAUX_RECRUTEUR`, prestige 4)

| Niveau | Coût | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 40 000 $ | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 80 000 $ | 60 % | 22 % | 11 % | 5,5 % | 1,5 % |
| 3 | 150 000 $ | 55 % | 23,5 % | 12,5 % | 7 % | 2 % |
| 4 | 250 000 $ | 50 % | 25 % | 14 % | 8,5 % | 2,5 % |

Sans recruteur : 100 % commun. Talents : rare, épique, légendaire et mythique × 1,25 (Œil du recruteur), mythique × 2 en plus (Main de Midas) ; le commun prend le reste (`commun = 100 − les autres`). Le tirage part du plus rare.

### Manager (prestige 5)

| Constante | Valeur |
|---|---|
| `PRESTIGE_MANAGER` | 5 |
| `PRIX_MANAGER` | 50 000 $ (10 premières minutes comprises) |
| `SALAIRE_MANAGER` | 3 000 $ / 10 min (fixe, ne monte pas avec le prestige) |
| `SECONDES_AVANT_PAIE_MANAGER` | 60 s : il paie 10 min de plus à quiconque a moins d'1 min payée |

Ordre de paie : lui-même d'abord (s'il n'est pas payé, il ne paie personne), puis les mineurs du moins cher au plus cher. La trésorerie repart de 0 au prestige. Détail : [../batiments/personnel.md](../batiments/personnel.md).

## Les talents

1 point par prestige ; 5 branches de 4 talents (rang 1 en haut) ; il faut le rang précédent. Branche Patron ouverte dès le prestige 2, Recrutement une fois le recruteur embauché.

| Branche | Talent | Effet exact (`talents.ts`) |
|---|---|---|
| Mineur | Poigne de fer | vitesse des pioches × 1,15 |
| Mineur | Œil de lynx | +0,1 à la chance de doubler un minerai |
| Mineur | Pioche robuste | chance d'usure × 0,7 |
| Mineur | Briseur de roche | vitesse × 1,25 dans la roche dure |
| Marchand | Négociant | bonus de vente +0,10 |
| Marchand | Grossiste | chariot de la foreuse vendu × 1,2 |
| Marchand | Chasseur de trésors | argent des coffres × 2 |
| Marchand | Grand négociant | bonus de vente +0,15 |
| Ingénieur | Ascenseur express | temps par mètre de l'ascenseur ÷ 1,3 (joueur et mineurs) |
| Ingénieur | Foreuse turbo | vitesse de forage × 1,5 |
| Ingénieur | Grand chariot | capacité du chariot × 2 |
| Ingénieur | Moteur autonome | recharge automatique dès le 1er niveau de forage |
| Patron | Contremaître | vitesse des mineurs × 1,25 |
| Patron | Sacs d'équipe | sac des mineurs × 2 |
| Patron | Salaires négociés | salaires × 0,75 |
| Patron | Grande équipe | +1 mineur employable |
| Recrutement | Œil du recruteur | chances de rare et mieux × 1,25 |
| Recrutement | Recrutement à prix cassé | embauches × 0,7 |
| Recrutement | Indemnités réduites | indemnités × 0,5 |
| Recrutement | Main de Midas | chance de mythique × 2 (en plus) |

## Revenus par seconde

`revenuParSeconde(etat, joueurCreuse)` (`revenu.ts`) estime l'argent gagné par seconde, affiché « 📈 X $/s » dans le bandeau. C'est une moyenne (le hasard des minerais fait varier le vrai gain). Les probabilités utilisées sont celles des blocs **normaux** (sans lave, coffre ni géode).

```
valeur moyenne d'un bloc (p) = Σ chance(bloc) × prix(bloc) × (1 + chance de doubler si minerai)

joueur (seulement s'il creuse et est au front)
   = valeur moyenne (sa profondeur, sa chance de doubler) × bonus de vente
     ÷ Σ chance(bloc) × durée de casse(bloc)

foreuse (seulement si elle tourne)
   = vitesse de forage × valeur moyenne (sa profondeur, sans Fortune) × bonus de vente × (1,2 si Grossiste)

chaque mineur payé
   = [sac × valeur moyenne (sa profondeur) × bonus de vente]
     ÷ [sac ÷ vitesse + 2 × max(1, profondeur − 1) × temps par mètre + 4 s]
     − salaire ÷ 600
manager au travail : − 3 000 ÷ 600 = − 5 $/s

total = joueur + foreuse + mineurs   (peut être négatif)
```

Un test (`revenu.test.ts`) vérifie que l'estimation d'un mineur reste à ±25 % d'une vraie simulation d'une heure.

**Exemples pour le joueur** (pioche en netherite, enchantements au plafond du prestige, Solidité sans effet sur le revenu, sans talent) :

| Prestige (Efficacité / Fortune) | 30 m de réf. | 75 m de réf. | 120 m de réf. (roche dure) | 149 m de réf. (fond) |
|---|---:|---:|---:|---:|
| P0 (I / I) | 40,7 $/s (-20 m) | 102,0 $/s (-50 m) | 67,8 $/s (-80 m) | 72,8 $/s (-99 m) |
| P1 (I / I) | 51,4 $/s | 129,1 $/s | 85,8 $/s | 92,1 $/s |
| P4 (III / III) | 157,6 $/s | 417,7 $/s | 269,1 $/s | 282,9 $/s |
| P8 (V / III) | 358,3 $/s | 949,4 $/s | 611,7 $/s | 643,0 $/s |

La roche dure (×1,5 sur la durée) fait baisser le revenu du joueur malgré des minerais plus chers.

## Ce que coûte chaque prestige

Ce qu'il faut acheter **pendant** le prestige P pour remplir ses conditions (les niveaux nouvellement permis par P), sans compter les pioches du joueur (5 340 $ + 3 diamants + 4 débris + 4 or pour débloquer la pierre, le fer, le diamant et la netherite au prestige 0 ; la pioche en bois est offerte), les réparations, les seaux, les embauches et les salaires :

| Prestige | Ascenseur + sac + enchantements + foreuse | Recruteur | Pioche de chaque mineur embauché |
|---|---|---:|---:|
| 0 | 3 230 $ + 23 fer + 5 redstone + 10 lapis + 3 émeraudes | — | — |
| 1 | 7 000 $ + 40 fer + 20 redstone (dont l'activation de la foreuse) | — | — |
| 2 | 15 200 $ + 80 fer + 35 redstone + 20 lapis + 6 émeraudes | — | 3 500 $ |
| 3 | 24 000 $ + 145 fer + 80 redstone | — | 25 000 $ |
| 4 | 65 700 $ + 225 fer + 145 redstone + 30 lapis + 9 émeraudes | 40 000 $ | 33 000 $ |
| 5 | 83 000 $ + 160 fer + 115 redstone | 80 000 $ | — |
| 6 | 74 400 $ + 230 fer + 170 redstone + 12 lapis + 4 émeraudes | 150 000 $ | — |
| 7 | 110 000 $ + 320 fer + 240 redstone | 250 000 $ | — |
| 8 | 180 000 $ + 450 fer + 350 redstone + 15 lapis + 5 émeraudes | — | — |

À partir du prestige 9, plus aucun niveau nouveau : la bedrock suffit.

## Le bot de simulation

`src/jeu/bot.ts` (`jouerPartie(aleatoire, maxBlocs = 40 000)`) joue une **première partie complète** (prestige 0) avec seulement des actions qu'un joueur peut faire, et `bot.test.ts` le fait jouer **20 parties** avec des graines fixes (1 à 20, générateur `mulberry32` de `aleatoire.ts` : les résultats sont toujours les mêmes).

### Ce qu'il fait

- Il creuse par **séries de 10 couches** (100 blocs), comme « Creuser » répété, en s'arrêtant si plus rien ne peut se ranger (sac et quai pleins), mais toujours au moins un bloc.
- Il **construit et améliore l'ascenseur dès qu'il peut**, directement dans la mine (jusqu'au plafond : niveau 2).
- Sac plein avec un ascenseur : il attend ou appelle la cabine et **l'envoie au marché** avec tout ce qui n'est pas gardé.
- Il **remonte au village** si : le sac est plein sans ascenseur ; il peut payer la pioche suivante ; ou sa pioche est cassée (ou n'est pas la meilleure) et remonter permettrait d'y remédier.
- Au village : il **garde** diamants (avant la pioche en diamant), débris et or (avant la netherite), lapis et émeraudes (tant qu'il reste un enchantement à prendre), les minerais du prochain niveau d'ascenseur, et **3 minerais de réparation** de sa meilleure pioche ; il vend le reste ; il achète la pioche suivante, **tous les enchantements possibles**, le sac suivant s'il a **2 fois son prix**, et (à partir de -36 m) jusqu'à **2 seaux** s'il a 2 fois leur prix ; puis il répare, rachète ou équipe la meilleure pioche possible.
- Le temps compté = temps de minage + trajets (échelle à 0,15 s/m, cabine) + attentes de l'ascenseur.

### Ce que vérifie `bot.test.ts`

| Test | Attendu |
|---|---|
| Bedrock | les 20 parties atteignent la bedrock (profondeur finale 99), avec la netherite (`meilleure = 4`) |
| Prestige | à la bedrock, le bot est **prêt à passer prestige** (`peutPasserPrestige`) |
| Blocs (médiane) | **1 300 à 3 000 blocs** pour la bedrock (couches de 10) |
| Durée (médiane) | **10 à 25 minutes** de jeu simulé |
| Extrêmes | la plus courte > 800 blocs, la plus longue < 9 000 blocs |
| Ascenseur | construit (niveau ≥ 1) entre -10 et -70 m |
| Allers-retours | plus de 3 remontées au village |
| Pioche en fer | achetée entre -15 et -70 m |

### Résultats mesurés (20/10, code actuel)

| Mesure (20 parties) | Minimum | Médiane | Maximum |
|---|---:|---:|---:|
| Blocs pour la bedrock | 1 700 | **2 870** | 7 330 |
| Temps de jeu simulé | 12,7 min | **20,5 min** | 56,9 min |
| Profondeur à l'achat de la pioche en fer | -25 m | — | -44 m |
| Profondeur à la construction de l'ascenseur | -18 m | — | -50 m |
| Allers-retours au village | 12 | — | 30 |
| Argent restant à la bedrock | 4 650 $ | — | 75 494 $ |

(La médiane de `bot.test.ts` est l'élément d'indice 10 de la liste triée.) La médiane des blocs est proche du haut de la cible (3 000) : un changement qui rallonge la partie peut faire échouer le test.

Le bot ne joue que le **prestige 0** : il n'y a pas de bot pour les prestiges suivants, la foreuse ni les mineurs (ceux-ci ont leurs propres tests d'équilibrage dans `employes.test.ts` et `revenu.test.ts`).

## Durées de jeu attendues

| Repère | Valeur | Source |
|---|---|---|
| Première partie (prestige 0, mine de 100 m) | **10 à 25 min** et **1 300 à 3 000 blocs** (médianes) ; mesuré : 20,5 min, 2 870 blocs | `CLAUDE.md`, `bot.test.ts` |
| Remplir un chariot de foreuse | ≈ 8 min (500 s) à niveaux de forage et de chariot égaux | `NIVEAUX_CHARIOT` |
| Une paie de mineur | 10 min | `SECONDES_PAR_PAIE` |
| Un charbon dans la foreuse | 20 s | `SECONDES_PAR_CHARBON` |
| Rattrapage hors ligne | 8 h au plus | `ABSENCE_MAX` |
| Remonter de -100 m à l'échelle | ≈ 15 s (0,15 s/m) | `SECONDES_PAR_METRE_ECHELLE` |
| Remonter de -100 m en ascenseur | ≈ 10 s (niveau 1) à ≈ 1,5 s (niveau 6) | `NIVEAUX_ASCENSEUR` |

Le code ne donne **pas** de durée cible pour les prestiges 1 et suivants (aucun test ne la mesure).
