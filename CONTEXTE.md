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

- `src/jeu/` (logique pure, testée avec Vitest) :
  - `donnees.ts` : blocs, pioches, sacs, enchantements, zones et constantes de la spec v1.
  - `aleatoire.ts` : aléatoire injectable (`Math.random` en jeu, générateur à graine dans les tests).
  - `mine.ts` : génération des couches pondérée selon la profondeur.
  - `mineur.ts` : l'état de la partie (`EtatJeu`, un objet JSON) et toutes les actions (casser, vendre, réparer, acheter, enchanter, prestige).
  - `succes.ts` : les 16 succès. `sauvegarde.ts` : `localStorage`.
  - `bot.ts` + `bot.test.ts` : le bot joue 20 parties. Médiane ≈ 1 000 blocs pour la bedrock, pioche en fer vers -30 m.
- `src/usePartie.ts` : le hook React qui relie la logique à l'écran (minage animé, toasts, sauvegarde auto).
- `src/composants/` : vue de la mine, HUD, inventaire, panneaux (Pioches, Boutique, Enchanter, Succès), toasts, écran de victoire.
- `src/blocs.css` : tous les blocs et animations en CSS. `src/index.css` : mise en page (desktop et mobile).

### Choix faits là où la spec v1 ne disait rien

- Sac plein : le bloc est cassé mais perdu, et le minage « x10 » s'arrête tout seul.
- Le seau d'eau est consommé quand il éteint une lave.
- La vente garde les lapis et émeraudes **seulement à hauteur de ce qu'il reste à payer** en enchantements.
- Racheter une pioche neuve coûte le même prix (matériaux compris) que la débloquer.
- Pioche cassée : on mine à mains nues, mais la profondeur max reste celle de la pioche équipée.
- La liste des 16 succès a été réinventée (la v1 ne la détaillait pas).

## 5. Feuille de route

1. ✅ Données, mine, mineur, bot de simulation, UI, sauvegarde, fin de partie (victoire, prestige, succès).
2. **Brancher Vercel** (décision A/B ci-dessus).
3. **Polish** : sons, meilleure ambiance par zone, éventuellement des sprites.
4. Ajuster l'équilibrage après de vraies parties (le bot donne une partie de 3 à 5 min de minage pur).

## 6. Décisions de design (héritées de la v1)

- ❌ Pas de creepers, pas de prix du marché variables, pas de mineurs automatiques, pas de quêtes du marchand.
- ✅ Le joueur n'est jamais bloqué : pioches rachetables, minage à mains nues, galeries horizontales.
- 🆕 Nouveau par rapport à la v1 : la sauvegarde. Elle avait été refusée dans le notebook, mais elle devient indispensable sur le web.

## 7. Journal

- **2026-10-15** : choix de la stack, installation des outils sur le Mac, création du squelette et du dépôt GitHub privé. Ajout du collaborateur `N04H2004`.
- **2026-10-16** : ajout de ce fichier `CONTEXTE.md` au dépôt.
- **2026-10-16** : première version complète du jeu (logique, bot d'équilibrage, interface React, sauvegarde).
