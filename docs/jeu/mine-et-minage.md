# ⛏️ La mine et le minage

> Comment marche la mine depuis le 22/10 (la **mine automatique**) : ses 5 niveaux, le bloc à cliquer, le coffre, les pioches, la mine qui sort des blocs toute seule, et tout ce qui tourne autour : le temps qui passe (et hors ligne), les événements, les découvertes, les succès et les statistiques.
> Écrit d'après le code au 22/10, mis à jour le 24/10 et le 27/10 (`src/jeu/mine.ts`, `src/jeu/mineur.ts`, `src/jeu/donnees.ts`, `src/jeu/temps.ts`…). Les fiches des bâtiments donnent le détail de chaque achat : [mine.md](../batiments/mine.md) (coffre, niveaux, ascenseur, wagonnets), [forgeron.md](../batiments/forgeron.md) (pioches), [bazar.md](../batiments/bazar.md) (sac), [marche.md](../batiments/marche.md), [foreuse.md](../batiments/foreuse.md), [personnel.md](../batiments/personnel.md), [generateur.md](../batiments/generateur.md).

Ce qui a disparu le 22/10 : la **vue de la mine en coupe** (2D), la profondeur en mètres, les couches de 10 blocs, l'échelle et l'ascenseur du joueur, le quai, le réservoir, les convois et brouettes, les galeries, les blocs spéciaux (lave, coffres, géodes) et les seaux, le lapis, la netherite, la terre, le gravier et la roche dure, la bedrock et la victoire, le prestige et l'enchanteur. Le code du prestige et de l'enchanteur est rangé dans `archives/` ; le reste est dans l'historique git.

---

## 1. La mine en bref

- La mine est un **bâtiment de 10 × 10 cases** au milieu du village. On ne descend plus dedans : on se tient **devant** et on ouvre son panneau.
- Elle a **5 niveaux** (`NIVEAUX_MINE`). Chaque niveau ajoute un minerai et rend les minerais rares plus fréquents. On passe au niveau suivant **en payant** (argent + minerais), au panneau de la mine.
- **Tout ce qui sort de la mine va dans son coffre** (100 places au début, 4 000 au plus) :
  1. **tes clics** sur le gros bloc du panneau (un bloc par clic) ;
  2. **la mine toute seule** (0,2 à 0,4 bloc par seconde) ;
  3. **les mineurs employés**, qui remontent leur sac et le vident dans le coffre.
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
3. Le bloc casse et va **dans le coffre** : 1 bloc, ou **2** si c'est un minerai et que le tirage tombe sous la **chance de doubler** de la pioche (10 à 45 %, `chanceDoublement`). Pioche cassée : pas de doublement.
4. Les statistiques comptent le bloc (`blocsCasses`, `blocsParType`, `diamantsTrouves` pour les diamants, doublés compris).
5. Si la pioche n'est pas cassée, elle s'**use d'un point**. Si elle vient de casser : « 💥 Ta pioche en X est cassée ! Il faut 2 clics par bloc : fais-la réparer au forgeron. »
6. Un **nouveau bloc** est tiré au niveau actuel de la mine.

Il n'y a **pas de temps de casse** : un clic, un bloc. La vitesse dépend de la vitesse à laquelle on clique (le bot de simulation clique 2 fois par seconde). Les clics ne marchent pas jeu fermé.

Côté interface (`usePartie.ts`, `PanneauMine.tsx`) : chaque clic joue le « tac » de la pioche, puis le « crac » du bloc, des éclats volent, et ce qui tombe s'envole au-dessus (« +1 ⚫ », « +2 💎 ×2 ! »).

**Le combo** (27/10, seulement dans l'interface) : les clics à moins de **0,9 s** l'un de l'autre s'additionnent. Dès 3, un compteur « 🔥 ×*N* » saute près du bloc ; plus il monte, plus le cadre et le halo du bloc brillent, et un petit arpège (`sons.combo`) marque les paliers 10, 25, 50, 100, 200 et 500. **Il ne change rien aux règles** : pas de bonus, un clic reste un bloc.

**Le tableau de production** (27/10) : sous le bloc, le panneau de la mine montre combien de blocs sortent par seconde (la mine toute seule, chaque mineur, et tes clics des 3 dernières secondes) et ≈ combien de $ par minute ça vaut. Le calcul est la fonction pure `production(etat)` de `src/jeu/production.ts` (débit de la mine, `blocsParSecondeEmploye` de chaque mineur au travail, 0 si le coffre est plein ou si le mineur attend son salaire, et `valeurMoyenneBloc` pour les dollars). Voir [mine.md](../batiments/mine.md#le-tableau-de-production-2710).

### Les pioches (`PIOCHES`)

| Pioche | Chance de doubler un minerai | Durabilité | Prix | Réparation (cassée) |
|---|---:|---:|---|---|
| 🪨 Pierre | 10 % | 150 clics | offerte au départ | 5 $ + 10 pierre |
| ⚙️ Fer | 20 % | 300 | 200 $ + 25 fer | 30 $ + 5 fer |
| 🟡 Or | 30 % | 500 | 1 500 $ + 20 or | 150 $ + 5 or |
| 💎 Diamant | 45 % | 1 000 | 8 000 $ + 10 diamants | 600 $ + 3 diamants |

- La réparation coûte une part de ce prix, **selon l'usure** (au moins 1 $ et 1 minerai) : voir [forgeron.md](../batiments/forgeron.md).
- **On n'est jamais bloqué** : une pioche cassée casse encore un bloc tous les 2 clics ; la pioche en pierre se répare pour presque rien ; toutes les autres pioches débloquées se rachètent neuves.

---

## 4. Le coffre et la mine toute seule

### Le coffre (`NIVEAUX_COFFRE`)

| Niveau | Places | Prix |
|---|---:|---|
| 1 | 100 | (départ) |
| 2 | 250 | 150 $ + 40 pierre |
| 3 | 600 | 800 $ + 40 fer |
| 4 | 1 500 | 3 000 $ + 80 fer + 20 redstone |
| 5 | 4 000 | 10 000 $ + 30 or |

- `rangerDansCoffre` ne range que ce qui tient : le reste est perdu pour un clic (le clic est refusé avant, coffre plein), et **attend dans le sac du mineur** pour un mineur.
- **🎒 Mettre dans le sac** (`prendreDuCoffre`) : on choisit un lot avec les jauges (ou tout), il passe dans le sac, **les objets les plus chers d'abord**, tant qu'il y a de la place. « 🎒 *N* objets pris dans le coffre : va les vendre au marché ! »

### Payer avec le sac et le coffre (`disponible`, `payer`)

Partout dans le jeu (bâtiments, rails, pioches, réparations, niveaux de mine, coffre, ascenseur, wagonnets, foreuse, générateur, charbon et redstone), les minerais d'un prix se comptent et se prennent **dans le sac, puis dans le coffre de la mine**. Le menu Bâtiments, les prix (`PrixCout`) et les objectifs comptent les deux.

### La mine toute seule (`avancerMine`, `debitMine`)

- Chaque niveau a un **débit** : **0,2 / 0,25 / 0,3 / 0,35 / 0,4 bloc par seconde** (12 à 24 blocs par minute). C'est « le vieux treuil » : il tourne toujours, même sans joueur ni mineur, et même jeu fermé.
- Ces blocs vont dans le coffre, tant qu'il a de la place. Ils ne sont jamais doublés.
- Le panneau le dit : « la mine sort toute seule *N* blocs par minute ».

### Descendre d'un niveau (`descendreNiveauMine`)

| Pour aller au niveau | Prix |
|---|---|
| 2 · Veine de redstone | 400 $ + 30 fer |
| 3 · Filon d'or | 2 500 $ + 60 fer + 30 redstone |
| 4 · Grotte aux émeraudes | 9 000 $ + 60 redstone + 30 or |
| 5 · Cœur de diamant | 30 000 $ + 60 or + 25 émeraude |

Le niveau change tout de suite (le bloc à cliquer est retiré au nouveau niveau). Il débloque aussi : foreuse et générateur (niveau 2), recruteur (3), manager (4), et 2 mineurs de plus à chaque niveau. Le niveau 5 est le dernier : il n'y a plus de fin de partie.

---

## 5. Le temps qui passe

### L'horloge (`src/usePartie.ts`)

- L'horloge tourne **tout le temps** (la mine sort ses blocs toute seule) : toutes les **50 ms** (`INTERVALLE_HORLOGE`), et à chaque image de l'écran (`requestAnimationFrame`) pendant que le joueur pousse un wagonnet (pour que le mouvement soit fluide). Un tic compte au plus 1 s (onglet en pause, par exemple).
- À chaque tic, `avancerTemps(etat, secondes, aleatoire)` (`src/jeu/temps.ts`) fait avancer, dans l'ordre : **la mine** (`avancerMine`, qui compte aussi le temps de jeu), **le générateur** (`avancerGenerateur`), **la foreuse** (`avancerForeuse`), **les mineurs** (`avancerEmployes`) et **les wagonnets** (`avancerWagonnets`, chaque trajet à son tour).
- Pour une longue durée, il avance par **morceaux d'une minute au plus** (`PAS_MAX`) : le générateur a le temps de se resservir dans le coffre, les wagonnets de faire plusieurs voyages… Les mineurs, eux, avancent par morceaux de 30 s (pour que le manager paie entre deux).
- La sauvegarde se fait **au plus une fois par seconde** (l'état change sans arrêt), et en quittant la page.

### Hors ligne (au chargement d'un monde)

À l'ouverture d'un monde (`chargerOuCreer`) :

1. Le temps écoulé depuis la dernière sauvegarde est mesuré, plafonné à **8 heures** (`ABSENCE_MAX`). Moins de 30 s : rien à rattraper.
2. `avancerTemps` est appelé avec toute la durée : la mine, le générateur, la foreuse, les mineurs (et le manager), et les wagonnets (s'ils ont un pousseur ou l'électricité) tournent comme si le jeu était ouvert. **Les clics, eux, ne tournent pas.**
3. Un message s'affiche : « Pendant ton absence : 📦 *N* blocs de plus dans le coffre de la mine, 🛤️ le wagonnet a rapporté *X* $, ⚙️ la foreuse a remonté *N* blocs, 😠 *N* mineurs attendent leur salaire. » (seulement les morceaux non nuls ; « le wagonnet a rapporté » compte tout l'argent gagné pendant l'absence).

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

Deux choses se débloquent au Personnel en descendant dans la mine : le **recruteur** (niveau 3) et le **manager** (niveau 4). Tant que le joueur n'est pas passé devant le Personnel, une bulle **✨ « Nouveau : Recruteur ! »** (ou Manager) saute au-dessus du bâtiment. Elle disparaît pour de bon dès qu'il arrive devant (`marquerDecouvert`, liste `decouvertes` de la sauvegarde).

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

- `src/jeu/donnees.ts` : `BLOCS`, `MINERAIS_RARES`, `NIVEAUX_MINE`, `NIVEAUX_COFFRE`, `PIOCHES`, `CLICS_MAINS_NUES`.
- `src/jeu/mine.ts` : `infoNiveauMine`, `poidsDesBlocs`, `tirerBloc`, `chancesDesBlocs`, `valeurMoyenneBloc`.
- `src/jeu/mineur.ts` : le type `EtatJeu`, `creerPartie`, le sac, le coffre, payer (`disponible`, `payer`), le clic (`cliquerMine`), la mine toute seule (`avancerMine`), les niveaux, le coffre, l'ascenseur, la vente, les pioches, le sac.
- `src/jeu/temps.ts` : `avancerTemps`.
- `src/jeu/aleatoire.ts` : l'aléatoire injectable.
- `src/jeu/decouvertes.ts`, `src/jeu/succes.ts`, `src/jeu/statistiques.ts` : découvertes, succès, statistiques.
- `src/evenements.ts` : les événements pour les sons et animations.
- `src/usePartie.ts` : l'horloge, le clic, le rattrapage hors ligne, la sauvegarde.
- `src/jeu/production.ts` : `production` (blocs par seconde de la mine et de chaque mineur, $ par minute), pour le tableau du panneau de la mine ; testé dans `production.test.ts`.
- `src/composants/PanneauMine.tsx` : le bloc à cliquer (et son combo), le tableau de production et tout le panneau de la mine ; `src/composants/Statistiques.tsx` : la fenêtre 📊.
- `src/jeu/mine.test.ts`, `src/jeu/mineur.test.ts` : les tests de la mine et du joueur.
