# Idle Miner (web) : contexte du projet

> Où en est le projet, qui fait quoi, ce qui est décidé et ce qui reste à faire.
> Les règles de code sont dans [CLAUDE.md](CLAUDE.md), les règles du jeu dans [docs/idle_miner_v1.md](docs/idle_miner_v1.md).
> À mettre à jour à chaque étape importante.

## 1. Le projet en bref

- **Quoi** : un idle game de minage inspiré de Minecraft. On creuse, on vend les blocs, on achète de meilleures pioches et on descend jusqu'à la bedrock (-64 m).
- **D'où on part** : une v1 jouable en **Python** (notebook Jupyter + `ipywidgets`). Sa spec complète est dans `docs/idle_miner_v1.md`.
- **Objectif** : un portage web avec un front plus soigné, jouable dans le navigateur et hébergé sur Vercel.
- **Équipe** : 2 développeurs sur GitHub.
  - `moussabinks` : propriétaire du dépôt.
  - `N04H2004` : collaborateur.

## 2. Choix techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript | Vercel ne fait pas tourner de notebook Python. Le jeu tourne entièrement dans le navigateur, sans serveur. |
| Front | React 19 + Vite | Standard, rapide, très bien supporté par Vercel. |
| Tests | Vitest | Teste la logique du jeu sans navigateur, y compris le futur bot d'équilibrage. |
| Lint | oxlint | Fourni par le template Vite. |
| Sauvegarde | `localStorage` | Pas de backend, et la progression doit survivre à la fermeture de l'onglet. |
| Option écartée | Garder le Python avec Pyodide | Environ 10 Mo à charger au démarrage et difficile à brancher sur React. |

## 3. Infra

- **Dépôt** : https://github.com/moussabinks/idle-miner (**privé**). Branche principale : `main`.
- **Workflow** : une branche par fonctionnalité, puis une Pull Request. L'autre développeur relit avant le merge. On ne pousse jamais directement sur `main`.
- **Vercel** : ⚠️ **pas encore branché**, la décision est en attente :
  - **Option A** : le compte Vercel Pro du collègue. Il faut alors une organisation GitHub (on y transfère le dépôt) et que les deux développeurs soient membres de l'équipe Vercel, sinon les déploiements de l'autre sont bloqués.
  - **Option B** : passer le dépôt en public et utiliser le plan Hobby gratuit. Avec un dépôt privé, Hobby ne déploie que les commits du propriétaire.
  - Si le dépôt est transféré, mettre à jour le remote : `git remote set-url origin https://github.com/<org>/idle-miner.git`.
- **Poste de dev (Mac)** : Homebrew, Node 26, npm 11, git, et gh connecté au compte `moussabinks`.

## 4. État actuel du code

Le jeu est **jouable de bout en bout** : de -1 m à la bedrock, puis prestige.

Depuis la v4 de l'état (`VERSION_ETAT = 4`, anciennes sauvegardes migrées automatiquement) :

- **Mine à -128 m** (deux fois la v1) : profondeurs des zones, minerais et pioches multipliées par 2. Débris antiques plus rares (poids 1, sous -104 m). La redstone apparaît dès -40 m.
- **Une seule vue qui défile** : le village en haut, puis tout le puits creusé depuis le début. L'échelle et le rail de l'ascenseur longent le puits sur la gauche, et la caméra suit le joueur.
- **Position du joueur** : `position` en mètres (0 = village, `profondeur - 1` = front de taille). ↑ / ↓ : on avance tant que la touche est appuyée, et on s'arrête au barreau suivant en la relâchant (0,15 s par mètre).
- **Village** : Puits (à gauche, au-dessus de l'échelle), Marché, Forgeron, Bazar, Enchanteur, Foreuse. Icônes en pixel art (`IconePixel.tsx`) à la place des emojis.
- **Marché** : « Vendre tout » vend tout le sac sauf les objets décochés (`nonAVendre`).
- **Ascenseur** : construit puis amélioré **dans la mine** (module en bas à gauche) avec du fer et de la redstone, 4 niveaux (capacité 32 à 256 objets, plus rapide à chaque niveau). Il remonte le sac quand il est plein, le vend et redescend au niveau du joueur.
- **Foreuse** (prestige 1+) : derrière une barrière avec cadenas au prestige 0. On l'active une fois (30 fer + 10 redstone), elle reste active aux prestiges suivants. Elle consomme du charbon (1 charbon = 20 s), creuse seule (elle descend d'un mètre tous les 6 blocs) et remplit un chariot qu'on vend ou qu'on vide dans le sac. Améliorations : vitesse de forage et taille du chariot. Elle continue de creuser quand le jeu est fermé (8 h au plus).
- **Pas de torches** (retirées le 16/10) : lumière naturelle, on voit toujours les 4 couches sous la couche en cours, de plus en plus sombres.
- **Barre de boutons fixe** : toujours les mêmes 8 boutons à la même place (◀ ▲ ▼ ▶ / Creuser x10 Village Front) ; ceux qui ne servent pas sont grisés. Le bandeau du haut a aussi une hauteur fixe.
- **Assistant Emmanuel Macron** (caricature SVG, `PersonnageMacron.tsx`) : s'embauche au Puits pour 2 000 $. Pendant que le joueur creuse, il casse en même temps un autre bloc de la couche (le dernier bloc reste au joueur), avec la même pioche que le joueur (même couleur, même vitesse) sans l'user. Environ +50 % de vitesse de minage. Il repart au prestige.
- **Horloge unique** (`usePartie.ts`) : échelle, ascenseur, foreuse et minage avancent au même rythme (tic de 50 ms). Avant, le minage repartait de zéro à chaque changement d'état (il bloquait pendant que l'ascenseur voyageait).
- **Personnage** : une taupe mineuse en SVG (`Personnage.tsx`) dont la pioche prend la couleur de la pioche équipée.

- `src/jeu/` (logique pure, testée avec Vitest) :
  - `donnees.ts` : blocs, pioches, sacs, enchantements, zones et constantes de la spec v1.
  - `aleatoire.ts` : aléatoire injectable (`Math.random` en jeu, générateur à graine dans les tests).
  - `mine.ts` : génération des couches pondérée selon la profondeur.
  - `mineur.ts` : l'état de la partie (`EtatJeu`, un objet JSON) et toutes les actions (casser, vendre, réparer, acheter, enchanter, prestige).
  - `succes.ts` : les 16 succès. `sauvegarde.ts` : `localStorage`.
  - `foreuse.ts` : la foreuse. `temps.ts` : le temps qui passe (échelle, ascenseur, foreuse).
  - `bot.ts` + `bot.test.ts` : le bot joue 20 parties en remontant vendre et acheter, et construit l'ascenseur vers -60 m. Médiane ≈ 1 800 blocs pour la bedrock (-128 m), environ 19 min de jeu simulé (contre 8 min avant).
- `src/usePartie.ts` : le hook React qui relie la logique à l'écran (minage animé, toasts, sauvegarde auto).
- `src/composants/` : `VueMonde` (village + puits + échelle + ascenseur), `ModuleAscenseur`, personnage, icônes pixel, HUD, sac, panneaux des stands (dont la foreuse), succès, toasts, écran de victoire.
- `src/blocs.css` : tous les blocs et animations en CSS. `src/index.css` : mise en page (desktop et mobile).

### Choix faits là où la spec v1 ne disait rien

- Sac plein : le bloc est cassé mais perdu, et le minage « x10 » s'arrête tout seul.
- Le seau d'eau est consommé quand il éteint une lave.
- « Vendre tout » vend vraiment tout : c'est au joueur de décocher ce qu'il veut garder (demande du 16/10).
- Fabriquer des torches et changer de pioche se fait partout ; vendre, acheter, réparer et enchanter seulement à la surface.
- Racheter une pioche neuve coûte le même prix (matériaux compris) que la débloquer.
- Pioche cassée : on mine à mains nues, mais la profondeur max reste celle de la pioche équipée.
- La liste des 16 succès a été réinventée (la v1 ne la détaillait pas).
- Valeurs choisies par nous, à ajuster après de vraies parties : niveaux de l'ascenseur (10 fer + 5 redstone pour le construire, puis 40/15, 80/30, 150/60), vitesse de l'échelle (0,15 s/m), coûts et niveaux de la foreuse.
- Une nouvelle partie commence à -2 m : le premier mètre est l'entrée du puits.

## 5. Feuille de route

1. ✅ Données, mine, mineur, bot de simulation, UI, sauvegarde, fin de partie (victoire, prestige, succès).
2. **Brancher Vercel** (décision A/B ci-dessus).
3. **Polish** : sons, meilleure ambiance par zone, éventuellement des sprites.
4. Ajuster l'équilibrage après de vraies parties (le bot donne environ 19 min jusqu'à la bedrock).
5. Idées en attente (proposées le 16/10) : améliorations des pioches au forgeron, points de prestige, couches dures, étais de mine.

## 6. Décisions de design (héritées de la v1)

- ❌ Pas de creepers, pas de prix du marché variables, pas de mineurs automatiques, pas de quêtes du marchand.
  - Exception (16/10) : la foreuse du prestige 1, qui creuse seule tant qu'on lui donne du charbon.
  - Exception (18/10) : l'assistant Emmanuel Macron, qui creuse avec le joueur pendant qu'il creuse.
- ✅ Le joueur n'est jamais bloqué : pioches rachetables, minage à mains nues, galeries horizontales.
- 🆕 Nouveau par rapport à la v1 : la sauvegarde. Elle avait été refusée dans le notebook, mais elle devient indispensable sur le web.

## 7. Journal

- **2026-10-15** : choix de la stack, installation des outils sur le Mac, création du squelette et du dépôt GitHub privé. Ajout du collaborateur `N04H2004`.
- **2026-10-16** : ajout de ce fichier `CONTEXTE.md` au dépôt.
- **2026-10-16** : première version complète du jeu (logique, bot d'équilibrage, interface React, sauvegarde).
- **2026-10-16** : surface avec stands, échelle, déplacements au clavier, « Vendre tout » avec objets à décocher, ascenseur à redstone, personnage taupe en SVG.
- **2026-10-16** : mine à -128 m, vue unique qui défile avec l'échelle sur toute la hauteur, ascenseur à niveaux (fer + redstone) utilisable dans la mine, icônes pixel art au village, foreuse au prestige 1.
- **2026-10-16** : barre de boutons à positions fixes, suppression des torches (lumière naturelle).
- **2026-10-18** : assistant Emmanuel Macron (2 000 $), horloge unique pour le minage (corrige le minage bloqué pendant les voyages de l'ascenseur). Sauvegarde v4.
