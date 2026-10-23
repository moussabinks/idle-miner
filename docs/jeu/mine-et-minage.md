# ⛏️ La mine et le minage

> Comment marche la mine depuis le 22/10 (la **mine automatique**) : ses 5 niveaux, le bloc à cliquer, le coffre, les pioches, la mine qui sort des blocs toute seule, et tout ce qui tourne autour : le temps qui passe (et hors ligne), les événements, les découvertes, les succès et les statistiques.
> Écrit d'après le code au 22/10, mis à jour le 24/10, le 27/10, le 29/10 (prix plus chers, niveau du joueur) et le 30/10 (bonus de combo, fenêtre du retour, nouveaux prix) (`src/jeu/mine.ts`, `src/jeu/mineur.ts`, `src/jeu/donnees.ts`, `src/jeu/temps.ts`…). Les fiches des bâtiments donnent le détail de chaque achat : [mine.md](../batiments/mine.md) (coffre, niveaux, ascenseur, wagonnets), [forgeron.md](../batiments/forgeron.md) (pioches), [bazar.md](../batiments/bazar.md) (sac), [marche.md](../batiments/marche.md), [foreuse.md](../batiments/foreuse.md), [personnel.md](../batiments/personnel.md), [generateur.md](../batiments/generateur.md).

Ce qui a disparu le 22/10 : la **vue de la mine en coupe** (2D), la profondeur en mètres, les couches de 10 blocs, l'échelle et l'ascenseur du joueur, le quai, le réservoir, les convois et brouettes, les galeries, les blocs spéciaux (lave, coffres, géodes) et les seaux, le lapis, la netherite, la terre, le gravier et la roche dure, la bedrock et la victoire, le prestige et l'enchanteur. Le code du prestige et de l'enchanteur est rangé dans `archives/` ; le reste est dans l'historique git.

---

## 1. La mine en bref

- La mine est un **bâtiment de 10 × 10 cases** au milieu du village. On ne descend plus dedans : on se tient **devant** et on ouvre son panneau.
- Elle a **5 niveaux** (`NIVEAUX_MINE`). Chaque niveau ajoute un minerai et rend les minerais rares plus fréquents. On passe au niveau suivant **en payant** (argent + minerais), au panneau de la mine.
- **Tout ce qui sort de la mine va dans son coffre** (100 places au début, 4 000 au plus) :
  1. **tes clics** sur le gros bloc du panneau (un bloc par clic) ;
  2. **la mine toute seule** (0,2 à 0,4 bloc par seconde) ;
  3. **les mineurs employés**, qui creusent au fond : la caisse de l'ascenseur fait des allers-retours sans cesse et vide leurs blocs dans le coffre (23/10).
- La **foreuse** a son propre chariot (elle ne remplit pas le coffre).
- **Coffre plein = tout s'arrête** (clics, mine, mineurs) : il faut le vider. Trois façons : le mettre dans son sac et aller le vendre au marché à pied, les **wagonnets** (un trajet Mine → Marché, et aussi Mine → Foreuse pour le charbon et Mine → Générateur pour la redstone, poussés ou électriques), et le générateur qui se sert en redstone.

```
clic / mine toute seule / mineurs ──► COFFRE de la mine ──► sac ──(à pied)──► marché ──► $
                                            │
                                            └──► wagonnet (rails : poussé, ou électrique) ──► marché ──► $
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
| 💎 Diamant | 100 $ | oui | oui | oui |

Les minerais rares (`MINERAIS_RARES`) sont l'or, l'émeraude et le diamant.

### Comment un bloc est tiré (`src/jeu/mine.ts`)

Chaque bloc qui sort de la mine (clic, mine toute seule, mineur, foreuse) est tiré **au hasard, indépendamment des autres**, selon les **poids** du niveau de la mine (`tirerBloc`, `choisirPondere`). Les poids de chaque niveau font 100 : ce sont donc directement les chances en %.

| Niveau | Nom | Pierre | Charbon | Fer | Redstone | Or | Émeraude | Diamant | Valeur moyenne d'un bloc |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Galerie de surface | 70 | 18 | 12 | — | — | — | — | 3,04 $ |
| 2 | Veine de redstone | 60 | 16 | 14 | 10 | — | — | — | 4,58 $ |
| 3 | Filon d'or | 52 | 14 | 14 | 12 | 8 | — | — | 7,50 $ |
| 4 | Grotte aux émeraudes | 46 | 12 | 13 | 12 | 11 | 6 | — | 13,07 $ |
| 5 | Cœur de diamant | 40 | 11 | 12 | 12 | 12 | 8 | 5 | 19,79 $ |

La **valeur moyenne** (`valeurMoyenneBloc`) est ce que vaut un bloc au marché en moyenne, sans doublement. Elle sert à l'indicateur « $/s ». Avec une pioche qui double, seuls les minerais comptent plus.

Le panneau de la mine affiche les chances du niveau actuel et du suivant (« 🪨 70 % ⚫ 18 % 🔩 12 % », `chancesDesBlocs`).

### L'aléatoire (`src/jeu/aleatoire.ts`)

Tout tirage passe par une fonction `Aleatoire` (un nombre entre 0 inclus et 1 exclu) : `Math.random` en jeu, et un générateur à graine (`mulberry32`) dans les tests, pour des parties toujours identiques. Outils : `entierEntre(min, max)` (bornes incluses), `choisir(liste)` (au hasard, chances égales), `choisirPondere(choix)` (un poids 2 sort deux fois plus souvent qu'un poids 1).

---

## 3. Le bloc à cliquer (`cliquerMine`)

Le **prochain bloc** est toujours tiré d'avance (`prochainBloc`) : c'est le gros bloc dessiné dans le panneau de la mine. Un clic dessus :

1. **Coffre plein** : rien ne se passe (« 📦 Le coffre de la mine est plein : vide-le et va vendre au marché ! »). Le bloc est grisé.
2. **Pioche cassée** : il faut **2 clics par bloc** (`CLICS_MAINS_NUES`). Le premier clic fissure le bloc (`clics` = 1) ; le second le casse.
3. Le bloc casse et va **dans le coffre** : 1 bloc, ou **2** si c'est un minerai et que le tirage tombe sous la **chance de doubler** de la pioche (10 à 45 %, `chanceDoublement`). Pioche cassée : pas de doublement (sauf bonus de combo). Depuis le 30/10, un **bonus de combo** en cours ajoute sa fortune à cette chance, et peut multiplier le nombre de blocs (×2, ×3 ou ×5 : voir plus bas).
4. Les statistiques comptent le bloc (`blocsCasses`, `blocsParType`, `diamantsTrouves` pour les diamants, doublés compris).
5. Si la pioche n'est pas cassée, elle s'**use d'un point**. Si elle vient de casser : « 💥 Ta pioche en X est cassée ! Il faut 2 clics par bloc : fais-la réparer au forgeron. »
6. Un **nouveau bloc** est tiré au niveau actuel de la mine.

Il n'y a **pas de temps de casse** : un clic, un bloc. La vitesse dépend de la vitesse à laquelle on clique (le bot de simulation clique 2 fois par seconde). Les clics ne marchent pas jeu fermé. Depuis le 29/10, chaque bloc cassé en cliquant rapporte **1 XP** au joueur (pas ceux de la mine toute seule, des mineurs ni de la foreuse) : voir [niveaux.md](niveaux.md).

Côté interface (`usePartie.ts`, `PanneauMine.tsx`) : chaque clic joue le « tac » de la pioche, puis le « crac » du bloc, des éclats volent, et ce qui tombe s'envole au-dessus (« +1 ⚫ », « +2 💎 ×2 ! »).

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
- **Plusieurs blocs par clic** : le bloc tombe en 2, 3 ou 5 exemplaires (deux fois plus s'il est doublé). La pioche ne s'use que d'un point et les statistiques comptent un seul bloc cassé (et donc 1 XP).
- Le bonus est rangé dans la partie (`etat.bonus` : son palier et l'heure de jeu où il s'arrête) ; sa durée se compte en temps de jeu.
- **À l'écran** : au-dessus du bloc, une étiquette dorée qui arrive en rebondissant (« 🍀 Fortune +25 % fortune · 3 s »), avec le temps qui reste, et le bloc qui brille. Sans bonus, dès 3 clics de combo : « Prochain bonus à ×*N* : *emoji* *nom* ». L'icône 🍀 est dessinée dans `outils/icones/dessins.py`.

**Le tableau de production** (27/10) : sous le bloc, le panneau de la mine montre combien de blocs sortent par seconde (la mine toute seule, chaque mineur, et tes clics des 3 dernières secondes) et ≈ combien de $ par minute ça vaut. Le calcul est la fonction pure `production(etat)` de `src/jeu/production.ts` (débit de la mine, `blocsParSecondeEmploye` de chaque mineur au travail, 0 si le coffre est plein ou si le mineur attend son salaire, et `valeurMoyenneBloc` pour les dollars). Voir [mine.md](../batiments/mine.md#le-tableau-de-production-2710).

### Les pioches (`PIOCHES`)

| Pioche | Chance de doubler un minerai | Durabilité | Prix (30/10) | Niveau du joueur | Réparation (cassée) |
|---|---:|---:|---|---:|---|
| 🪨 Pierre | 10 % | 150 clics | offerte au départ | — | 5 $ + 10 pierre |
| ⚙️ Fer | 20 % | 300 | 400 $ + 20 fer (29/10 : 500 $ + 40 fer) | 4 | 30 $ + 5 fer |
| 🟡 Or | 30 % | 500 | 4 000 $ + 40 or | 7 | 150 $ + 5 or |
| 💎 Diamant | 45 % | 1 000 | 20 000 $ + 20 diamants | 12 | 600 $ + 3 diamants |

- La réparation coûte une part de ce prix, **selon l'usure** (au moins 1 $ et 1 minerai) : voir [forgeron.md](../batiments/forgeron.md).
- **On n'est jamais bloqué** : une pioche cassée casse encore un bloc tous les 2 clics ; la pioche en pierre se répare pour presque rien ; toutes les autres pioches débloquées se rachètent neuves.

---

## 4. Le coffre et la mine toute seule

### Le coffre (`NIVEAUX_COFFRE`)

| Niveau | Places | Prix (30/10) | Niveau du joueur |
|---|---:|---|---:|
| 1 | 100 | (départ) | — |
| 2 | 250 | 250 $ + 50 pierre | 2 |
| 3 | 600 | 2 500 $ + 100 fer | 5 |
| 4 | 1 500 | 12 000 $ + 200 fer + 60 redstone | 8 |
| 5 | 4 000 | 50 000 $ + 120 or | 12 |

Le 30/10, le premier coffre est moins cher (avant : 400 $ + 80 pierre), les suivants bien plus (2 000 $ + 80 fer, 8 000 $ + 150 fer + 40 redstone, 25 000 $ + 60 or).

- `rangerDansCoffre` ne range que ce qui tient : le reste est perdu pour un clic (le clic est refusé avant, coffre plein), et **attend dans le sac du mineur** pour un mineur.
- **🎒 Mettre dans le sac** (`prendreDuCoffre`) : un minerai (bouton 🎒 de sa ligne ; depuis le 30/10, un **curseur** sur la ligne choisit combien en prendre, tout par défaut, `StockMinerais.tsx`) ou tout le coffre, il passe dans le sac, **les objets les plus chers d'abord**, tant qu'il y a de la place. « 🎒 *N* objets pris dans le coffre : va les vendre au marché ! »

### Payer avec le sac et le coffre (`disponible`, `payer`)

Partout dans le jeu (bâtiments, rails, pioches, réparations, niveaux de mine, coffre, ascenseur, wagonnets, foreuse, générateur, charbon et redstone), les minerais d'un prix se comptent et se prennent **dans le sac, puis dans le coffre de la mine**. Le menu Bâtiments, les prix (`PrixCout`) et les missions comptent les deux.

### La mine toute seule (`avancerMine`, `debitMine`)

- Chaque niveau a un **débit** : **0 / 0,25 / 0,3 / 0,35 / 0,4 bloc par seconde** (0 puis 15 à 24 blocs par minute ; 27/10 : au niveau 1, la mine ne sort rien toute seule, on creuse à la main). C'est « le vieux treuil » : il tourne toujours, même sans joueur ni mineur, et même jeu fermé.
- Ces blocs vont dans le coffre, tant qu'il a de la place. Ils ne sont jamais doublés.
- Le panneau le dit : « la mine sort toute seule *N* blocs par minute ».

### Descendre d'un niveau (`descendreNiveauMine`)

| Pour aller au niveau | Prix (30/10) | Niveau du joueur |
|---|---|---:|
| 2 · Veine de redstone | 900 $ + 45 fer | 4 |
| 3 · Filon d'or | 7 000 $ + 120 fer + 60 redstone | 7 |
| 4 · Grotte aux émeraudes | 25 000 $ + 120 redstone + 60 or | 10 |
| 5 · Cœur de diamant | 90 000 $ + 110 or + 40 émeraude | 13 |

Le 30/10, le niveau 2 (avant 1 200 $ + 60 fer) et le niveau 5 (avant 110 000 $ + 130 or + 55 émeraude) sont un peu moins chers. Depuis le 29/10, les prix sont environ **3 fois plus chers** qu'au début (avant le 29/10 : 400 $ + 30 fer, 2 500 $ + 60 fer + 30 redstone, 9 000 $ + 60 redstone + 30 or, 30 000 $ + 60 or + 25 émeraude), et chaque niveau demande aussi un **niveau du joueur** (voir [niveaux.md](niveaux.md)). Descendre d'un niveau rapporte **150 XP**.

Le niveau change tout de suite (le bloc à cliquer est retiré au nouveau niveau). Il débloque aussi : foreuse et générateur (niveau 2), recruteur (3), manager (4), et 2 mineurs de plus à chaque niveau. Le niveau 5 est le dernier : il n'y a plus de fin de partie.

---

## 5. Le temps qui passe

### L'horloge (`src/usePartie.ts`)

- L'horloge tourne **tout le temps** (la mine sort ses blocs toute seule) : toutes les **50 ms** (`INTERVALLE_HORLOGE`), et à chaque image de l'écran (`requestAnimationFrame`) pendant que le joueur pousse un wagonnet (pour que le mouvement soit fluide). Un tic compte au plus 1 s (onglet en pause, par exemple).
- À chaque tic, `avancerTemps(etat, secondes, aleatoire)` (`src/jeu/temps.ts`) fait avancer, dans l'ordre : **la mine** (`avancerMine`, qui compte aussi le temps de jeu), **le générateur** (`avancerGenerateur`), **la foreuse** (`avancerForeuse`), **les mineurs** (`avancerEmployes`) et **les wagonnets** (`avancerWagonnets`, chaque trajet à son tour) ; puis il compte **l'XP du joueur** (`mettreAJourXp`, 29/10 : tout ce qui a été fait depuis le dernier tic, avec un message « 🎉 Niveau *N* ! » à chaque niveau gagné).
- Pour une longue durée, il avance par **morceaux d'une minute au plus** (`PAS_MAX`) : le générateur a le temps de se resservir dans le coffre, les wagonnets de faire plusieurs voyages… Les mineurs, eux, avancent par morceaux de 30 s (pour que le manager paie entre deux).
- La sauvegarde se fait **au plus une fois par seconde** (l'état change sans arrêt), et en quittant la page.

### Hors ligne (au chargement d'un monde)

À l'ouverture d'un monde (`chargerOuCreer`) :

1. Le temps écoulé depuis la dernière sauvegarde est mesuré, plafonné à **8 heures** (`ABSENCE_MAX`). Moins de 30 s : rien à rattraper.
2. `avancerTemps` est appelé avec toute la durée : la mine, le générateur, la foreuse, les mineurs (et le manager), et les wagonnets (s'ils ont un pousseur ou l'électricité) tournent comme si le jeu était ouvert. **Les clics, eux, ne tournent pas.**
3. Depuis le 30/10, une **grande fenêtre** résume l'absence (`src/jeu/absence.ts` : `photoPartie` avant, `resumerAbsence` après ; `FenetreAbsence.tsx`) : **« Bon retour, mineur ! »**, la durée (« 2 h 13 »), ce que **les mineurs ont creusé**, ce que **la mine a sorti toute seule**, ce que **la foreuse a foré**, les **voyages** des wagonnets, les blocs **en plus dans le coffre**, l'**argent gagné** en gros (« 💰 +X $ »), et s'il le faut « 😠 *N* mineurs attendent leur salaire : ils se sont arrêtés. Paie-les au Personnel ! ». Le gros bouton **« 💰 Tout récupérer ! »** la ferme avec l'animation et le son d'une vente (l'argent est déjà gagné : le bouton le fête). S'il ne s'est rien passé, pas de fenêtre. (Avant le 30/10 : un simple message « Pendant ton absence : … » de quelques secondes.)

---

## 6. Les événements (`src/evenements.ts`)

L'interface compare l'état **avant** et **après** chaque action (`evenementsEntre`) pour savoir quels sons jouer et quelles animations montrer. Ce ne sont pas des règles du jeu.

| Événement | Quand | Ce que ça déclenche |
|---|---|---|
| `casse` | un clic a cassé le bloc (`blocsCasses` a augmenté) ; avec le nombre tombé (1 ou 2) et s'il est rare | le « crac » (plus lourd pour un bloc dur), « plink » pour un minerai ou pluie d'étincelles pour un rare, 2 pièces si doublé ; les éclats et le minerai qui s'envole |
| `vente` | l'argent a monté sans compter les wagonnets (marché, chariot de la foreuse vendu par le joueur) | le « ka-ching ! » (plus de pièces pour une grosse vente), la grosse animation « +X $ », le compteur qui saute |
| `achat` | l'argent a baissé | « pop » et 2 pièces (sauf si c'est une amélioration) |
| `amelioration` | un niveau de plus quelque part : mine, coffre, ascenseur, forage, chariot, générateur, taille des wagonnets, sac, meilleure pioche, recruteur, pioche d'un mineur | la petite fanfare (à la place du son d'achat) |
| `piocheCassee` | la pioche en main vient de casser | « clang » triste |
| `wagonnet` | un wagonnet a vendu au marché (`argentWagonnet` a monté) | 3 pièces discrètes, et un petit « +X $ » en haut de l'écran |

---

## 7. Les découvertes (`src/jeu/decouvertes.ts`)

Deux choses se débloquent au Personnel en descendant dans la mine : le **manager** (niveau 3) et le **recruteur** (niveau 4 ; inversés le 23/10). Tant que le joueur n'est pas passé devant le Personnel, une bulle **✨ « Nouveau : Manager ! »** (ou Recruteur) saute au-dessus du bâtiment. Elle disparaît pour de bon dès qu'il arrive devant (`marquerDecouvert`, liste `decouvertes` de la sauvegarde).

Les bâtiments tout juste débloqués (foreuse, générateur au niveau 2) ont, eux, la pastille « Nouveau ! » du menu Bâtiments (`batimentsVus`).

---

## 8. Les succès (`src/jeu/succes.ts`)

**20 succès** (« 🌸 Paysagiste », poser 10 décorations, est retiré le 27/10 avec les décorations), vérifiés après chaque action et chaque tic d'horloge (`verifierSucces`). Un succès obtenu affiche « *emoji* Succès : *titre* » (toast doré, petite fanfare). On les voit avec le bouton 🏅.

| Succès | Condition |
|---|---|
| ⛏️ Premier coup de pioche | casser ton premier bloc |
| 🧱 Terrassier | casser 100 blocs en cliquant |
| 🏗️ Tunnelier | casser 1 000 blocs en cliquant |
| ⚙️ Âge du fer | débloquer la pioche en fer |
| 🥇 Pioche dorée | débloquer la pioche en or |
| 💎 Diamants ! | débloquer la pioche en diamant |
| 🔴 Veine de redstone | descendre la mine au niveau 2 |
| 🟡 Chercheur d'or | niveau 3 |
| 🟢 Grotte aux émeraudes | niveau 4 |
| 🏆 Cœur de diamant | niveau 5, tout au fond |
| 💠 Ça brille ! | trouver un diamant (en cliquant) |
| 👷 Patron | embaucher ton premier mineur |
| 👥 Chef d'équipe | avoir 6 mineurs |
| 🛤️ Cheminot | créer un trajet de wagonnet |
| ⚡ Électricien | électrifier les rails avec le générateur (au moins un trajet électrique) |
| 🗺️ Réseau complet | faire rouler un wagonnet sur les 4 trajets |
| 🚃 Ligne régulière | faire 100 voyages de wagonnet |
| 💰 Riche | gagner 5 000 $ |
| 🤑 Magnat | gagner 100 000 $ |
| 🏗️ Architecte | poser 5 bâtiments au village (la mine ne compte pas) |

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
| `diamantsTrouves` | les diamants trouvés en cliquant (doublés compris) |
| `argentGagne` | tout l'argent gagné (marché, wagonnets, chariot) |
| `argentWagonnet` | l'argent vendu par les wagonnets (Mine → Marché et Foreuse → Marché) |
| `argentForeuse` | l'argent des chariots de la foreuse |
| `voyagesWagonnet` | les voyages des wagonnets (toutes les livraisons, sur tous les trajets) |
| `salairesPayes` | les salaires payés aux mineurs et au manager |
| `tempsDeJeu` | le temps de jeu, en secondes (hors ligne compris) |

La fenêtre montre 4 tuiles (💵 Argent gagné, ⛏️ Blocs cassés, 🕳️ Mine niveau *N*, ⏱️ Temps de jeu), « 💰 D'où vient ton argent » (une barre en 3 : 💰 Toi (marché), 🛤️ Wagonnet, ⚙️ Foreuse ; `argentParSource`), « 🧱 Tes blocs cassés en cliquant » (les 12 sortes les plus cassées, `blocsLesPlusCasses`) et une liste (blocs sortis de la mine, des mineurs, de la foreuse, voyages, salaires, diamants). Il n'y a plus d'onglet « Depuis le début » (il servait aux prestiges).

---

## Fichiers du code

- `src/jeu/donnees.ts` : `BLOCS`, `MINERAIS_RARES`, `NIVEAUX_MINE`, `NIVEAUX_COFFRE`, `PIOCHES`, `CLICS_MAINS_NUES`, `BONUS_COMBO` (30/10).
- `src/jeu/mine.ts` : `infoNiveauMine`, `poidsDesBlocs`, `tirerBloc`, `chancesDesBlocs`, `valeurMoyenneBloc`.
- `src/jeu/mineur.ts` : le type `EtatJeu`, `creerPartie`, le sac, le coffre, payer (`disponible`, `payer`), le clic (`cliquerMine`), les bonus de combo (`activerBonusCombo`, `bonusActif`, `secondesBonus`, 30/10), la mine toute seule (`avancerMine`), les niveaux, le coffre, l'ascenseur, la vente, les pioches, le sac.
- `src/jeu/temps.ts` : `avancerTemps`.
- `src/jeu/niveaux.ts` : le niveau du joueur, l'XP et les cadenas (29/10, voir [niveaux.md](niveaux.md)).
- `src/jeu/aleatoire.ts` : l'aléatoire injectable.
- `src/jeu/decouvertes.ts`, `src/jeu/succes.ts`, `src/jeu/statistiques.ts` : découvertes, succès, statistiques.
- `src/evenements.ts` : les événements pour les sons et animations.
- `src/usePartie.ts` : l'horloge, le clic, le rattrapage hors ligne, la sauvegarde.
- `src/jeu/absence.ts` et `src/composants/FenetreAbsence.tsx` (30/10) : le résumé de l'absence et la fenêtre « Bon retour, mineur ! ».
- `src/jeu/production.ts` : `production` (blocs par seconde de la mine et de chaque mineur, $ par minute), pour le tableau du panneau de la mine ; testé dans `production.test.ts`.
- `src/composants/PanneauMine.tsx` : le bloc à cliquer (et son combo), le tableau de production et tout le panneau de la mine ; `src/composants/Statistiques.tsx` : la fenêtre 📊.
- `src/jeu/mine.test.ts`, `src/jeu/mineur.test.ts` : les tests de la mine et du joueur ; `src/jeu/nouveautes30.test.ts` (30/10) : bonus de combo, rails remboursés, missions qui gardent leur place, résumé de l'absence.
