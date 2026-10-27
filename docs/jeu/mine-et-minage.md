# ⛏️ La mine et le minage

> Comment marche la mine : ses 7 niveaux (26/10 ; 5 avant) (qui sont aussi les **paliers** de toutes les améliorations), le bloc à cliquer, le coffre et sa vente, les pioches, la mine qui sort des blocs toute seule, et tout ce qui tourne autour : le temps qui passe (et hors ligne), les événements, les découvertes, les succès et les statistiques.
> Écrit d'après le code au 25/10 (la grande mise à jour : plus de sac à dos ni de bazar, vente directe du coffre, mine qui tourne dès le niveau 1, paliers, nouveaux prix), mis à jour le 26/10 (la grosse mise à jour des gemmes : 7 niveaux, le saphir et le rubis, le diamant tout au fond, les lingots et les bijoux) (`src/jeu/mine.ts`, `src/jeu/mineur.ts`, `src/jeu/donnees.ts`, `src/jeu/temps.ts`…). Les fiches des bâtiments donnent le détail de chaque achat : [mine.md](../batiments/mine.md) (coffre, niveaux, ascenseur, wagonnets), [forgeron.md](../batiments/forgeron.md) (pioches), [marche.md](../batiments/marche.md), [foreuse.md](../batiments/foreuse.md), [personnel.md](../batiments/personnel.md), [generateur.md](../batiments/generateur.md), [fonderie.md](../batiments/fonderie.md), [joaillerie.md](../batiments/joaillerie.md).

Ce qui a disparu le 22/10 : la **vue de la mine en coupe** (2D), la profondeur en mètres, les couches de 10 blocs, l'échelle et l'ascenseur du joueur, les blocs spéciaux (lave, coffres, géodes), le lapis, la netherite, la bedrock et la victoire, le prestige et l'enchanteur (rangés dans `archives/`). Le 25/10 : le **sac à dos**, le **bazar** et les **objets gardés** du marché (remplacés par la punaise 📌 du coffre).

---

## 1. La mine en bref

- La mine est un **bâtiment de 10 × 10 cases** au milieu du village. On ne descend pas dedans : on se tient **devant** et on ouvre son panneau.
- Elle a **7 niveaux** (`NIVEAUX_MINE`, 26/10 ; 5 avant). Chaque niveau ajoute un minerai et rend les minerais rares plus fréquents. On passe au niveau suivant **en payant** (argent + minerais, ou gemmes), au panneau de la mine, avec le niveau du joueur qu'il faut.
- Chaque niveau de la mine est aussi un **palier** (25/10) : à la mine niveau N, **toutes** les améliorations (coffre, ascenseur, pioches, mineurs, pousseurs, foreuse, générateur ; la fonderie et la joaillerie ont leurs propres paliers) peuvent monter jusqu'à leur niveau N. Voir [niveaux.md](niveaux.md#3-les-paliers-de-la-mine).
- **Tout ce qui sort de la mine va dans son coffre** (100 places au début, 20 000 au plus) :
  1. **tes clics** sur le gros bloc du panneau (un bloc par clic) ;
  2. **la mine toute seule** (0,2 à 0,8 bloc par seconde, **dès le niveau 1** depuis le 25/10) ;
  3. **les mineurs employés**, qui creusent au fond : la caisse de l'ascenseur fait des allers-retours sans cesse et vide leurs blocs dans le coffre.
- La **foreuse** a son propre chariot (elle ne remplit pas le coffre), et la **fonderie** et la **joaillerie** (26/10) ont leur **réserve** de lingots et de bijoux.
- **Coffre plein = tout s'arrête** (clics, mine, mineurs) : il faut le vider. Deux façons : le **vendre d'un clic** depuis le panneau de la mine (25/10 : plus de sac à dos ni de marche jusqu'au marché), ou les **wagonnets** (un trajet Mine → Marché, et aussi Mine → Foreuse pour le charbon et Mine → Générateur pour la redstone ; depuis le 26/10, Mine → Fonderie pour le fer et l'or, Mine → Joaillerie pour les gemmes).

```
clic / mine toute seule / mineurs ──► COFFRE de la mine ──► 💰 Tout vendre (au prix du marché) ──► $
                                            │
                                            └──► wagonnet (rails, avec son pousseur) ──► marché ──► $
```

---

## 2. Les blocs

### Caractéristiques (`BLOCS`, `src/jeu/donnees.ts`)

| Bloc | Prix de vente | Minerai (doublable) ? | Bruit « dur » | Rare (son brillant) |
|---|---:|:---:|:---:|:---:|
| 🪨 Pierre | 1 $ | non | non | non |
| ⚫ Charbon | 5 $ | oui | oui | non |
| 🔩 Fer | 12 $ | oui | oui | non |
| 🔴 Redstone | 15 $ | oui | oui | non |
| 🟡 Or | 35 $ | oui | oui | oui |
| 💚 Émeraude | 80 $ | oui | oui | oui |
| 🔷 Saphir (26/10) | 120 $ | oui | oui | oui |
| 🔺 Rubis (26/10) | 170 $ | oui | oui | oui |
| 💎 Diamant | 240 $ (26/10 ; 100 $ avant) | oui | oui | oui |

Les minerais rares (`MINERAIS_RARES`) sont l'or, l'émeraude, le saphir, le rubis et le diamant. Le diamant reste le plus rare et le plus cher : depuis le 26/10, il n'arrive qu'au **niveau 7**, tout au fond (avant, au niveau 5).

### Les lingots et les bijoux (26/10)

Ce ne sont pas des blocs de la mine : ce sont les **produits** des deux ateliers. Ils sont dans la même liste `BLOCS` (avec `sorte: 'lingot'` ou `'bijou'`, les blocs ont `sorte: 'bloc'`) parce qu'ils se rangent, se transportent en wagonnet et se vendent de la même façon. On ne les double jamais (`minerai: false`).

| Produit | Fait avec | Prix | Où |
|---|---|---:|---|
| ⬜ Lingot de fer | 🔩 fer (12 $) | 24 $ | fonderie (`LINGOT_DE`) |
| 🟨 Lingot d'or | 🟡 or (35 $) | 70 $ | fonderie |
| 📿 Collier d'émeraude | 💚 émeraude (80 $) | 200 $ | joaillerie (`BIJOU_DE`) |
| 🧿 Pendentif de saphir | 🔷 saphir (120 $) | 300 $ | joaillerie |
| 🫅 Couronne de rubis | 🔺 rubis (170 $) | 425 $ | joaillerie |
| 💍 Bague de diamant | 💎 diamant (240 $) | 600 $ | joaillerie |

Un lingot vaut **2 fois** son minerai, un bijou **2,5 fois** sa gemme. (26/10) Les chariots se paient en **minerai de fer**, pas en lingots (demandé par le propriétaire). Un achat qui demanderait des lingots les prendrait dans le coffre, puis dans la **réserve de la fonderie** (`disponible`, `payerMateriaux`). Voir [fonderie.md](../batiments/fonderie.md) et [joaillerie.md](../batiments/joaillerie.md).

### Comment un bloc est tiré (`src/jeu/mine.ts`)

Chaque bloc qui sort de la mine (clic, mine toute seule, mineur, foreuse) est tiré **au hasard, indépendamment des autres**, selon les **poids** du niveau de la mine (`tirerBloc`, `choisirPondere`). Les poids de chaque niveau font 100 : ce sont donc directement les chances en %.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Saphir | Rubis | Diamant | Valeur moyenne d'un bloc |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | — | — | 3,04 $ |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | — | — | 4,58 $ |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | — | — | 7,50 $ |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | — | — | 13,07 $ |
| 5 | Caverne de saphir (26/10) | 40 | 11 | 12 | 12 | 12 | 8 | 5 | — | — | 20,79 $ |
| 6 | Veine de rubis (26/10) | 36 | 10 | 12 | 11 | 12 | 9 | 7 | 5 | — | 31,62 $ |
| 7 | Cœur de diamant (26/10) | 32 | 10 | 11 | 11 | 12 | 9 | 8 | 7 | 5 | 46,37 $ |

(Avant le 26/10, le niveau 5 s'appelait « Cœur de diamant », avec 5 % de diamants à 100 $ : 19,79 $ le bloc. Le saphir a pris sa place, avec les mêmes chances.)

La **valeur moyenne** (`valeurMoyenneBloc`) est ce que vaut un bloc au marché en moyenne, sans doublement. Elle sert à l'indicateur « $/s ». Avec une pioche qui double, seuls les minerais comptent plus.

Le panneau de la mine affiche les chances du niveau actuel et du suivant (« 🪨 70 % ⚫ 18 % 🔩 12 % », `chancesDesBlocs`).

### L'aléatoire (`src/jeu/aleatoire.ts`)

Tout tirage passe par une fonction `Aleatoire` (un nombre entre 0 inclus et 1 exclu) : `Math.random` en jeu, et un générateur à graine (`mulberry32`) dans les tests, pour des parties toujours identiques. Outils : `entierEntre(min, max)` (bornes incluses), `choisir(liste)` (au hasard, chances égales), `choisirPondere(choix)` (un poids 2 sort deux fois plus souvent qu'un poids 1).

---

## 3. Le bloc à cliquer (`cliquerMine`)

Le **prochain bloc** est toujours tiré d'avance (`prochainBloc`) : c'est le gros bloc dessiné dans le panneau de la mine. Un clic dessus :

1. **Coffre plein** : rien ne se passe (« 📦 Le coffre de la mine est plein : vends-le ! »). Le bloc est grisé.
2. **Pioche cassée** : il faut **2 clics par bloc** (`CLICS_MAINS_NUES`). Le premier clic fissure le bloc (`clics` = 1) ; le second le casse.
3. Le bloc casse et va **dans le coffre** : 1 bloc, ou **2** si c'est un minerai et que le tirage tombe sous la **chance de doubler** de la pioche (10 à 60 %, `chanceDoublement`). Pioche cassée : pas de doublement (sauf bonus de combo). Depuis le 30/10, un **bonus de combo** en cours ajoute sa fortune à cette chance, et peut multiplier le nombre de blocs (×2, ×3 ou ×5 : voir plus bas).
4. Les statistiques comptent le bloc (`blocsCasses`, `blocsParType`, `diamantsTrouves` pour les diamants, doublés compris).
5. Si la pioche n'est pas cassée, elle s'**use d'un point**. Si elle vient de casser : « 💥 Ta pioche en X est cassée ! Il faut 2 clics par bloc : fais-la réparer au forgeron. »
6. Un **nouveau bloc** est tiré au niveau actuel de la mine.

Il n'y a **pas de temps de casse** : un clic, un bloc. La vitesse dépend de la vitesse à laquelle on clique (le bot de simulation clique 2 fois par seconde). Les clics ne marchent pas jeu fermé. Les blocs cassés en cliquant rapportent de l'XP (1 pour 3 blocs ; pas ceux de la mine toute seule, des mineurs ni de la foreuse) : voir [niveaux.md](niveaux.md).

Depuis le 25/10, le bonus **« 👆 Clics en or »** de la boutique des gemmes (5 min) fait tomber **3 fois plus** de blocs à chaque clic (voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md)). Côté interface (`usePartie.ts`, `PanneauMine.tsx`) : chaque clic joue le « tac » de la pioche, puis le « crac » du bloc, des éclats volent, et ce qui tombe s'envole au-dessus.

**Le combo** (27/10, seulement dans l'interface) : les clics à moins de **0,9 s** l'un de l'autre s'additionnent. Dès 3, un compteur « 🔥 ×*N* » saute près du bloc ; plus il monte, plus le cadre et le halo du bloc brillent, et un petit arpège (`sons.combo`) marque les paliers 10, 25, 50, 100, 200 et 500. Jusqu'au 29/10, il ne changeait rien aux règles.

**Les bonus de combo** (30/10, `BONUS_COMBO` dans `donnees.ts`, `activerBonusCombo` et `bonusActif` dans `mineur.ts`) : chaque palier atteint donne maintenant un **bonus de quelques secondes** (il remplace celui en cours), avec un toast « 🍀 Combo ×10 : Fortune ! +25 % de fortune pendant 3 s » :

| Palier | Bonus | Pendant | Effet |
|---:|---|---:|---|
| 10 | 🍀 Fortune | 3 s | +25 % de chance de doubler |
| 25 | 🍀 Grande fortune | 4 s | +50 % |
| 50 | 💥 Double coup | 5 s | +25 %, 2 blocs par clic |
| 100 | 🔥 Frénésie | 8 s | +100 %, 2 blocs par clic |
| 200 | ✨ Ruée vers l'or | 10 s | +100 %, 3 blocs par clic |
| 500 | 🏆 Légende de la mine | 15 s | +100 %, 5 blocs par clic |

- La **fortune** s'ajoute à la chance de doubler de la pioche (au plus 100 %), même avec une pioche cassée.
- **Plusieurs blocs par clic** : le bloc tombe en 2, 3 ou 5 exemplaires (deux fois plus s'il est doublé). La pioche ne s'use que d'un point et les statistiques comptent un seul bloc cassé.
- Le bonus est rangé dans la partie (`etat.bonus` : son palier et l'heure de jeu où il s'arrête) ; sa durée se compte en temps de jeu.
- **À l'écran** : le bonus en cours et le temps qui reste au-dessus du bloc ; sans bonus, « Clique vite ! ×10 = 🍀 Fortune », puis « 🔥 ×*N* → ×*palier* : … ». À côté du bloc, trois compteurs : 🔨 blocs cassés, 🏆 record de combo, 👆 clics par seconde. (L'écran a été refait le 25/10 : voir [interface.md](interface.md).)

**Le tableau de production** (onglet 📊 Production du panneau de la mine) : combien de blocs sortent par seconde (la mine toute seule, chaque mineur, et tes clics des 3 dernières secondes). Le calcul est la fonction pure `production(etat)` de `src/jeu/production.ts` (débit de la mine, `blocsParSecondeEmploye` de chaque mineur au travail, 0 si le coffre est plein ou si le mineur attend son salaire, et `valeurMoyenneBloc` pour les dollars). Voir [mine.md](../batiments/mine.md#le-tableau-de-production).

### Les pioches (`PIOCHES`)

| Pioche | Chance de doubler un minerai | Durabilité | Prix (26/10) | Palier (niveau de la mine) | Réparation (cassée) |
|---|---:|---:|---|---:|---|
| 🪨 Pierre | 10 % | 150 clics | offerte au départ | — | 5 $ + 10 pierre |
| ⚙️ Fer | 20 % | 300 | 300 $ + 20 fer | 2 | 30 $ + 5 fer |
| 🟡 Or | 30 % | 500 | 2 500 $ + 30 or | 3 | 150 $ + 5 or |
| 💚 Émeraude | 38 % | 750 | 6 000 $ + 25 émeraudes | 4 | 300 $ + 4 émeraudes |
| 🔷 Saphir (26/10) | 45 % | 1 000 | 30 000 $ + 30 saphirs | 5 | 1 200 $ + 6 saphirs |
| 🔺 Rubis (26/10) | 52 % | 1 300 | 110 000 $ + 38 rubis | 6 | 3 800 $ + 8 rubis |
| 💎 Diamant | 60 % | 1 700 | 390 000 $ + 45 diamants | 7 | 12 000 $ + 9 diamants |

(26/10) La pioche du niveau 5 de la mine est en **saphir** : elle a les chiffres de l'ancienne pioche en diamant (qui était au palier 5). Une partie qui avait la pioche en diamant a maintenant celle en saphir (c'est le même index, 4). La vraie pioche en diamant arrive avec le diamant, au palier 7. (26/10) Les prix et les réparations des paliers 5 à 7 comprennent la **hausse de la fin de partie** (× 2, × 2,5, × 3 : voir [equilibrage.md](equilibrage.md)).

- La réparation coûte une part de ce prix, **selon l'usure** (au moins 1 $ et 1 minerai) : voir [forgeron.md](../batiments/forgeron.md).
- **On n'est jamais bloqué** : une pioche cassée casse encore un bloc tous les 2 clics ; la pioche en pierre se répare pour presque rien ; toutes les autres pioches débloquées se rachètent neuves.

---

## 4. Le coffre, la vente et la mine toute seule

### Le coffre (`NIVEAUX_COFFRE`)

| Niveau | Places | Prix (26/10) | Palier |
|---|---:|---|---:|
| 1 | 100 | (départ) | — |
| 2 | 300 | 200 $ + 40 pierre | 2 |
| 3 | 800 | 2 000 $ + 80 fer | 3 |
| 4 | 2 000 | 6 000 $ + 60 redstone + 20 or | 4 |
| 5 | 5 000 | 36 000 $ + 120 or + 40 émeraudes | 5 |
| 6 | 10 000 | 130 000 $ + 100 émeraudes + 75 saphirs | 6 |
| 7 | 20 000 | 450 000 $ + 150 saphirs + 90 rubis | 7 |

`rangerDansCoffre` ne range que ce qui tient : le clic est refusé avant (coffre plein), et un mineur garde ses blocs dans son sac au fond de la mine en attendant la place.

### Vendre le coffre (25/10 : `vendreCoffre`, `vendreMinerai`)

Plus de sac à dos ni de marche jusqu'au marché : le coffre **se vend directement depuis le panneau de la mine**, **au prix du marché** (`valeurDe` : la somme des prix, arrondie, × 2 pendant le bonus « Ventes × 2 »).

- **💰 Tout vendre · +X $** (gros bouton jaune) : vend tout le coffre, **sauf les minerais épinglés** (`aVendreDuCoffre`). Le bouton montre ce que ça rapporte et attire l'œil quand le coffre est plein.
- **Une ligne par minerai** que sort la mine à son niveau (même à 0), les plus chers en haut : combien il y en a, son prix pièce, **Vendre** (ce minerai seul, même épinglé) et la **punaise 📌**.
- **« 📌 Garder »** (25/10) : le bouton (un mot et une petite punaise) ouvre une **petite fenêtre au milieu de l'écran** (la fenêtre de la mine ne grandit plus) : **−100, −10, +10, +100** (`changerGarder`) et **Tout** (`basculerGarderTout`). Ce qu'on garde (« 📌 110 » sous le nombre, ligne bleue) **reste dans le coffre** : ni « Tout vendre », ni « Vendre » de la ligne, ni le wagonnet, ni le manager ne le vendent. Le prix pièce des minerais est au **marché** (« Prix du marché »).
- Message : « 💰 Vente : +X $ ». L'argent compte dans `stats.argentGagne` (succès, classement).

C'est la même interface pour le **chariot de la foreuse** (`StockMinerais.tsx`), qui se vend lui aussi sur place (sans punaise), et (26/10) pour la **réserve de la fonderie et de la joaillerie** (ses lingots, ses bijoux).

### Payer avec le coffre (`disponible`, `payer`)

Partout dans le jeu (bâtiments, rails, pioches, réparations, niveaux de mine, coffre, ascenseur, chariots des pousseurs, foreuse, générateur, charbon et redstone), les minerais d'un prix se prennent **dans le coffre de la mine** (26/10 : les lingots et les bijoux aussi dans la réserve de leur atelier, après le coffre). On peut aussi payer **en gemmes** (bouton violet 💎 de chaque amélioration) : ni argent, ni minerais.

### La mine toute seule (`avancerMine`, `debitMine`)

- Chaque niveau a un **débit** : **0,2 / 0,3 / 0,4 / 0,5 / 0,6 / 0,7 / 0,8 bloc par seconde** (12 à 48 blocs par minute). Depuis le 25/10, **la mine tourne dès le niveau 1** (avant : rien au niveau 1, puis 0,25 à 0,4) : le jeu tourne tout seul dès la première minute. Elle tourne toujours, même sans joueur ni mineur, et même jeu fermé. × 2 pendant le bonus « Production × 2 ».
- Ces blocs vont dans le coffre, tant qu'il a de la place. Ils ne sont jamais doublés.

### Descendre d'un niveau (`descendreNiveauMine`)

| Pour aller au niveau | Prix (26/10) | Niveau du joueur |
|---|---|---:|
| 2 · Veine de redstone | 800 $ + 40 fer | 3 |
| 3 · Filon d'or | 6 000 $ + 100 fer + 40 redstone | 5 |
| 4 · Grotte aux émeraudes | 22 000 $ + 100 redstone + 50 or | 7 |
| 5 · Caverne de saphir | 160 000 $ + 180 or + 70 émeraudes | 9 |
| 6 · Veine de rubis (26/10) | 650 000 $ + 200 émeraudes + 100 saphirs | 11 |
| 7 · Cœur de diamant (26/10) | 2 400 000 $ + 240 saphirs + 150 rubis | 13 |

Le niveau 2 est bien moins cher qu'avant (900 $ + 45 fer). Les suivants coûtent un peu moins qu'avant le 25/10 (7 000 $, 25 000 $ et 90 000 $), alors que chaque niveau ouvre maintenant **tout un palier**. (25/10, économie revue : ils coûtaient d'abord 12 000 $, 70 000 $ et 320 000 $.) (26/10) Les niveaux 5 à 7 comprennent la hausse de la fin de partie (avant : 80 000 $, 260 000 $ et 800 000 $). Descendre d'un niveau rapporte **150 XP** (et l'XP de son prix).

Le niveau change tout de suite (le bloc à cliquer est tiré au nouveau niveau). Il débloque aussi : foreuse et générateur (niveau 2), manager (3), recruteur (4), fonderie (5), joaillerie (6), **1 mineur de plus** à chaque niveau, et le palier suivant de toutes les améliorations. Depuis le 26/10, le niveau **7** (Cœur de diamant) est le dernier (avant : le niveau 5) : il n'y a pas encore de fin de partie (une « nouvelle mine » est prévue).

---

## 5. Le temps qui passe

### L'horloge (`src/usePartie.ts`)

- L'horloge tourne **tout le temps** (la mine sort ses blocs toute seule) : toutes les **50 ms** (`INTERVALLE_HORLOGE`), et à chaque image de l'écran (`requestAnimationFrame`) pendant que le joueur pousse un wagonnet (pour que le mouvement soit fluide). (24/10) **Onglet caché ou fenêtre réduite, le jeu continue** : le navigateur ralentit alors l'horloge (un tic par seconde, voire par minute) et arrête les images de l'écran, donc chaque tic compte **tout le temps passé** depuis le précédent (8 h au plus, comme jeu fermé ; `avancerTemps` le découpe en pas d'une minute), et on rattrape tout de suite au retour sur l'onglet (`visibilitychange`). Avant, un tic comptait au plus 1 s : caché, le jeu semblait en pause.
- À chaque tic, `avancerTemps(etat, secondes, aleatoire)` (`src/jeu/temps.ts`) fait avancer, dans l'ordre : **la mine** (`avancerMine`, qui compte aussi le temps de jeu), **le générateur** (`avancerGenerateur`), **la foreuse** (`avancerForeuse`), **les mineurs** (`avancerEmployes`), (26/10) **la fonderie** (`avancerFonderie`) et **les joailliers** (`avancerJoaillerie`, `ateliers.ts`), et **les wagonnets** (`avancerWagonnets`, chaque trajet à son tour) ; puis il compte **l'XP du joueur** (`mettreAJourXp`, 29/10 : tout ce qui a été fait depuis le dernier tic, avec un message « 🎉 Niveau *N* ! +1 💎 » à chaque niveau gagné).
- Pour une longue durée, il avance par **morceaux d'une minute au plus** (`PAS_MAX`) : les wagonnets ont le temps de faire plusieurs voyages, les bonus de la boutique s'usent… Les mineurs, eux, avancent par morceaux de 30 s (pour que le manager paie entre deux).
- La sauvegarde se fait **au plus une fois par seconde** (l'état change sans arrêt), et en quittant la page.

### Hors ligne (au chargement d'un monde)

À l'ouverture d'un monde (`chargerOuCreer`) :

1. Le temps écoulé depuis la dernière sauvegarde est mesuré, plafonné à **8 heures** (`ABSENCE_MAX`). Moins de 30 s : rien à rattraper.
2. `avancerTemps` est appelé avec toute la durée : la mine, le générateur, la foreuse, les mineurs (et le manager), la fonderie et les joailliers (26/10), et les wagonnets (s'ils ont un pousseur ou l'électricité) tournent comme si le jeu était ouvert. **Les clics, eux, ne tournent pas.**
3. Une **grande fenêtre** résume l'absence (`src/jeu/absence.ts` : `photoPartie` avant, `resumerAbsence` après ; `FenetreAbsence.tsx`) : **« Bon retour, mineur ! »**, la durée (« 2 h 13 »), ce que **les mineurs ont creusé**, ce que **la mine a sorti toute seule**, ce que **la foreuse a foré**, les **voyages** des wagonnets, les blocs **en plus dans le coffre**, ce que **les wagonnets ont vendu**, et en grand le **bénéfice net** (25/10, demandé par le propriétaire : l'argent en plus dans la poche, salaires déduits ; avant, c'était le chiffre d'affaires). Au retour, le **coffre de la mine est vendu tout seul** (`vendreCoffreAuRetour`, sauf ce qu'on garde 📌), et depuis le 26/10 la **réserve de la fonderie** (ses lingots) et de la **joaillerie** (ses bijoux) aussi. Les lignes de l'argent tombent juste : 🚃 ventes des wagonnets + 📦 coffre vendu au retour + 💰 autres ventes (surtout le manager qui vend du coffre pour payer les salaires) − 💵 salaires payés = bénéfice net. S'il le faut : « 😠 Un employé attend son salaire : paie-le au Personnel ! », et combien de temps le manager paie avant de s'endormir. Deux boutons : **📺 Doubler · +X $** (une publicité, puis `doublerAbsence` redonne une fois ces gains, voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md)) et **Continuer**. S'il ne s'est rien passé, pas de fenêtre.

---

## 6. Les événements (`src/evenements.ts`)

L'interface compare l'état **avant** et **après** chaque action (`evenementsEntre`) pour savoir quels sons jouer et quelles animations montrer. Ce ne sont pas des règles du jeu.

| Événement | Quand | Ce que ça déclenche |
|---|---|---|
| `casse` | un clic a cassé le bloc (`blocsCasses` a augmenté) ; avec le nombre tombé (1 ou 2) et s'il est rare | le « crac » (plus lourd pour un bloc dur), « plink » pour un minerai ou pluie d'étincelles pour un rare, 2 pièces si doublé ; les éclats et le minerai qui s'envole |
| `vente` | l'argent a monté sans compter les wagonnets (coffre, chariot de la foreuse ou, 26/10, réserve d'un atelier vendu par le joueur) | le « ka-ching ! » (plus de pièces pour une grosse vente), la grosse animation « +X $ », le compteur qui saute |
| `achat` | l'argent a baissé | « pop » et 2 pièces (sauf si c'est une amélioration) |
| `amelioration` | un niveau de plus quelque part : mine, coffre, ascenseur, forage, chariot, générateur, meilleure pioche, recruteur, pioche d'un mineur, vitesse ou chariot d'un pousseur (`totalNiveaux`, avec depuis le 26/10 les niveaux du manager, de la fonderie et de la joaillerie) | la petite fanfare (à la place du son d'achat) |
| `piocheCassee` | la pioche en main vient de casser | « clang » triste |
| `wagonnet` | un wagonnet a vendu au marché (`argentWagonnet` a monté) | 3 pièces discrètes, et un petit « +X $ » en haut de l'écran |

---

## 7. Les découvertes (`src/jeu/decouvertes.ts`)

Deux choses se débloquent au Personnel en descendant dans la mine : le **manager** (niveau 3) et le **recruteur** (niveau 4 ; inversés le 23/10). Tant que le joueur n'est pas passé devant le Personnel, une bulle **✨ « Nouveau : Manager ! »** (ou Recruteur) saute au-dessus du bâtiment. Elle disparaît pour de bon dès qu'il arrive devant (`marquerDecouvert`, liste `decouvertes` de la sauvegarde).

Les bâtiments tout juste débloqués (foreuse, générateur au niveau 2 ; fonderie au niveau 5 et joaillerie au niveau 6, 26/10) ont, eux, la pastille « Nouveau ! » du menu Bâtiments (`batimentsVus`).

---

## 8. Les succès (`src/jeu/succes.ts`)

**28 succès** (26/10 : 21 avant ; « 🌸 Paysagiste », poser 10 décorations, est retiré le 27/10 avec les décorations), vérifiés après chaque action et chaque tic d'horloge (`verifierSucces`). Un succès obtenu affiche « *emoji* Succès : *titre* » (toast doré, petite fanfare). On les voit avec le bouton 🏅.

| Succès | Condition |
|---|---|
| ⛏️ Premier coup de pioche | casser ton premier bloc |
| 🧱 Terrassier | casser 100 blocs en cliquant |
| 🏗️ Tunnelier | casser 1 000 blocs en cliquant |
| ⚙️ Âge du fer | débloquer la pioche en fer |
| 🥇 Pioche dorée | débloquer la pioche en or |
| 💚 Vert brillant | débloquer la pioche en émeraude (23/10) |
| 🔷 Bleu profond | débloquer la pioche en saphir (26/10) |
| 🔺 Rouge passion | débloquer la pioche en rubis (26/10) |
| 💎 Diamants ! | débloquer la pioche en diamant (26/10 : la 7e pioche ; avant, la 5e) |
| 🔴 Veine de redstone | descendre la mine au niveau 2 |
| 🟡 Chercheur d'or | niveau 3 |
| 🟢 Grotte aux émeraudes | niveau 4 |
| 🔷 Caverne de saphir | niveau 5 (26/10 ; avant, « 🏆 Cœur de diamant », le dernier niveau) |
| 🔺 Veine de rubis | niveau 6 (26/10) |
| 🏆 Cœur de diamant | niveau 7, tout au fond (26/10) |
| 🟨 Fondeur | fondre ton premier lingot à la fonderie (26/10) |
| 💍 Joaillier | tailler ton premier bijou à la joaillerie (26/10) |
| 💠 Ça brille ! | trouver un diamant (en cliquant) |
| 👷 Patron | embaucher ton premier mineur |
| 👥 Chef d'équipe | avoir 6 mineurs (26/10 : les pousseurs et les joailliers ne comptent plus) |
| 🛤️ Cheminot | créer un trajet de wagonnet |
| ⚡ Électricien | électrifier les rails avec le générateur (au moins un trajet électrique) |
| 🗺️ Réseau complet | avoir 4 trajets de wagonnet (sur les 10 possibles depuis le 26/10) |
| 🚃 Ligne régulière | faire 100 voyages de wagonnet |
| 💰 Riche | gagner 5 000 $ |
| 🤑 Magnat | gagner 100 000 $ |
| 👑 Millionnaire | gagner 1 000 000 $ (26/10) |
| 🏗️ Architecte | poser 5 bâtiments au village (la mine ne compte pas) ; il y en a 7 depuis le 26/10 |

Une partie d'avant le 26/10 qui avait les succès « Diamants ! » (sa pioche en diamant, devenue celle en saphir) et « Cœur de diamant » (la mine niveau 5) les garde : les succès obtenus ne se perdent jamais. Les nouveaux « Bleu profond » et « Caverne de saphir » lui sont donnés tout de suite.

---

## 9. Les statistiques (`src/jeu/statistiques.ts`, fenêtre 📊)

Les compteurs de la partie (`Statistiques` dans `mineur.ts`) :

| Champ | Ce qu'il compte |
|---|---|
| `blocsCasses` | les blocs cassés **en cliquant** |
| `blocsParType` | les mêmes, sorte par sorte |
| `blocsMine` | les blocs sortis tout seuls de la mine |
| `blocsMineurs` | les blocs creusés par les mineurs employés |
| `blocsForeuse` | les blocs forés par la foreuse |
| `diamantsTrouves` | les diamants trouvés en cliquant (doublés compris ; depuis le 26/10, il n'y en a qu'au niveau 7 de la mine) |
| `argentGagne` | tout l'argent gagné (coffre vendu, wagonnets, chariot, réserve des ateliers, absence doublée) : c'est lui que compte le classement |
| `argentWagonnet` | l'argent vendu par les wagonnets (Mine → Marché, Foreuse → Marché, et depuis le 26/10 Fonderie → Marché et Joaillerie → Marché) |
| `argentForeuse` | l'argent des chariots de la foreuse vendus sur place |
| `voyagesWagonnet` | les voyages des wagonnets (toutes les livraisons, sur tous les trajets) |
| `salairesPayes` | les salaires payés aux mineurs et au manager |
| `tempsDeJeu` | le temps de jeu, en secondes (hors ligne compris) : il sert aussi d'horloge aux bonus |
| `pubsVues` | (25/10) les publicités regardées jusqu'au bout |

La fenêtre montre 4 tuiles (💵 Argent gagné, ⛏️ Blocs cassés, 🕳️ Mine niveau *N*, ⏱️ Temps de jeu : depuis le 27/10, seulement le temps passé le jeu ouvert et à l’écran, `stats.tempsOuvert`), « 💰 D'où vient ton argent » (une barre en 3 : 💰 Toi (le coffre vendu à la main ; la réserve des ateliers vendue d'un clic compte aussi ici), 🛤️ Wagonnet, ⚙️ Foreuse ; `argentParSource`), « 🧱 Tes blocs cassés en cliquant » (les 12 sortes les plus cassées, `blocsLesPlusCasses`) et une liste (blocs sortis de la mine, des mineurs, de la foreuse, voyages, salaires, diamants). Il n'y a plus d'onglet « Depuis le début » (il servait aux prestiges).

---

## Fichiers du code

- `src/jeu/donnees.ts` : `BLOCS` (et `SorteObjet`, `LINGOT_DE`, `BIJOU_DE`, 26/10), `MINERAIS_RARES`, `NIVEAUX_MINE`, `NIVEAUX_PAR_AMELIORATION`, `NIVEAUX_COFFRE`, `PIOCHES`, `CLICS_MAINS_NUES`, `BONUS_COMBO`.
- `src/jeu/mine.ts` : `infoNiveauMine`, `poidsDesBlocs`, `tirerBloc`, `chancesDesBlocs`, `valeurMoyenneBloc`.
- `src/jeu/mineur.ts` : le type `EtatJeu`, `creerPartie`, le coffre, payer (`disponible`, `payer`, `acheterAvecGemmes`), le clic (`cliquerMine`), les bonus de combo (`activerBonusCombo`, `bonusActif`, `secondesBonus`), la mine toute seule (`avancerMine`, `debitMine`), les niveaux, l'ascenseur, la vente (`vendreCoffre`, `vendreMinerai`, `aVendreDuCoffre`, la punaise `basculerGarderTout`, `reglerGarder`), les pioches.
- `src/jeu/gemmes.ts` : les bonus de la boutique (production, ventes, clics en or).
- `src/jeu/temps.ts` : `avancerTemps`.
- `src/jeu/ateliers.ts` (26/10) : la fonderie et la joaillerie (voir leurs fiches).
- `src/jeu/niveaux.ts` : le niveau du joueur, l'XP et les cadenas (29/10, voir [niveaux.md](niveaux.md)).
- `src/jeu/aleatoire.ts` : l'aléatoire injectable.
- `src/jeu/decouvertes.ts`, `src/jeu/succes.ts`, `src/jeu/statistiques.ts` : découvertes, succès, statistiques.
- `src/evenements.ts` : les événements pour les sons et animations.
- `src/usePartie.ts` : l'horloge, le clic, le rattrapage hors ligne, la sauvegarde.
- `src/jeu/absence.ts` et `src/composants/FenetreAbsence.tsx` : le résumé de l'absence, la fenêtre « Bon retour, mineur ! » et l'absence doublée (`doublerAbsence`, 25/10).
- `src/jeu/production.ts` : `production` (blocs par seconde de la mine et de chaque mineur, $ par minute), pour le tableau du panneau de la mine ; testé dans `production.test.ts`.
- `src/composants/PanneauMine.tsx` : le bloc à cliquer (et son combo), le coffre, le tableau de production et tout le panneau de la mine ; `src/composants/StockMinerais.tsx` : le coffre (ou le chariot de la foreuse) à vendre ; `src/composants/Statistiques.tsx` : la fenêtre 📊.
- `src/jeu/mine.test.ts`, `src/jeu/mineur.test.ts` : les tests de la mine et du joueur ; `src/jeu/nouveautes30.test.ts` (30/10) : bonus de combo, rails remboursés, missions qui gardent leur place, résumé de l'absence.
