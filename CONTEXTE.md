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

Depuis la v5 de l'état (`VERSION_ETAT = 5`, anciennes sauvegardes migrées automatiquement) :

- **Mine à -128 m, couches de 10 blocs.** Zones, minerais et pioches à l'échelle de 128 m. Un peu de charbon et de fer dès -7 m. Débris antiques rares (poids 1, sous -104 m). Redstone dès -40 m.
- **Bedrock** : en finissant la couche -127 m avec la netherite, on gagne (succès + écran de victoire une seule fois), mais on **continue de creuser** des galeries à -127 m. Le prestige se fait quand on veut, au Puits.
- **Une seule vue qui défile** : le village en haut, puis tout le puits creusé. L'échelle et le rail de l'ascenseur à gauche, le puits de la foreuse à droite. La caméra suit le joueur (directement pendant qu'il bouge, en douceur pour les sauts).
- **Village** (`VueVillage.tsx`, `useMarcheVillage.ts`) : un monde de 44 tuiles plus large que l'écran, avec chemin, hautes herbes, fleurs, arbres, barrières et collines (défilement plus lent). On marche avec ← → (garder la touche) ou en cliquant sur un stand. Stands le long du chemin : Puits, Marché, Forgeron, Bazar, Enchanteur, Foreuse.
- **Position du joueur** : `position` en mètres (0 = village, `profondeur - 1` = front de taille). Échelle : 0,15 s par mètre.
- **Ascenseur** (module en bas à gauche de la mine, repliable) : une vraie cabine qui monte et descend (`position`, `cible`). Construit puis amélioré avec du fer et de la redstone (4 niveaux). On peut **monter dedans** (vers le village ou le front, avec les minerais cochés, vendus à l'arrivée), l'**appeler**, ou l'**envoyer seul** vendre. Les boutons Village / Front le prennent s'il est là. Quand le sac est plein, les blocs attendent sur son **quai** : le minage ne s'arrête plus.
- **Donjons** (rares, sous -12 m) avec un zombie. Avec l'**épée** (Forgeron, 150 $) : butin. Sans : sac perdu et réveil au village. L'assistant laisse les donjons au joueur.
- **Prestige** : +15 % sur les ventes et +10 % de vitesse des pioches, par niveau (cumulés).
- **Foreuse** (prestige 1+) : activée une fois (30 fer + 10 redstone), au charbon (1 charbon = 20 s), elle descend d'un mètre tous les 10 blocs. On la voit forer dans son puits (jaune et noir, animée), avec un indicateur toujours visible en haut de la mine. Elle continue quand le jeu est fermé (8 h au plus).
- **Marché** : « Vendre tout » vend tout le sac sauf les objets décochés (`nonAVendre`).
- **Pas de torches** : lumière naturelle, les 4 couches sous la couche en cours sont visibles et de plus en plus sombres.
- **Barre de boutons fixe** : toujours les mêmes 8 boutons à la même place (◀ ▲ ▼ ▶ / Creuser x10 Village Front).
- **Assistant Emmanuel Macron** (caricature SVG, `PersonnageMacron.tsx`) : 1 000 $ au Puits. Il casse un autre bloc de la couche pendant que le joueur creuse, avec la même pioche (sans l'user). Il repart au prestige.
- **Horloge unique** (`usePartie.ts`) : échelle, ascenseur, foreuse et minage avancent au même rythme (tic de 50 ms).
- **Personnage** : une taupe mineuse en SVG (`Personnage.tsx`) dont la pioche prend la couleur de la pioche équipée.

- `src/jeu/` (logique pure, testée avec Vitest) :
  - `donnees.ts` : blocs, pioches, sacs, enchantements, zones et constantes de la spec v1.
  - `aleatoire.ts` : aléatoire injectable (`Math.random` en jeu, générateur à graine dans les tests).
  - `mine.ts` : génération des couches pondérée selon la profondeur.
  - `mineur.ts` : l'état de la partie (`EtatJeu`, un objet JSON) et toutes les actions (casser, vendre, réparer, acheter, enchanter, prestige).
  - `succes.ts` : les 16 succès. `sauvegarde.ts` : `localStorage`.
  - `foreuse.ts` : la foreuse. `temps.ts` : le temps qui passe (échelle, ascenseur, foreuse).
  - `bot.ts` + `bot.test.ts` : le bot joue 20 parties (il prend l'ascenseur, achète l'épée). Médiane ≈ 2 400 blocs pour la bedrock (couches de 10), environ 19 min de jeu simulé.
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
- **2026-10-18** : on continue de creuser à la bedrock, plus de charbon/fer près de la surface, ascenseur qui emmène le mineur (avec choix des minerais et quai), prestige +15 % ventes / +10 % vitesse, village large où l'on se promène, couches de 10 blocs, donjons avec zombie et épée, foreuse visible en action. Sauvegarde v5.
