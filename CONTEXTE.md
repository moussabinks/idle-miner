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

- ✅ Squelette Vite + React + TS. Les tests, le build et le lint passent.
- ✅ `src/jeu/donnees.ts` : les 5 pioches (Bois → Netherite) et `dureeCasse()`, testés dans `donnees.test.ts`.
- ✅ `src/App.tsx` : page d'accueil provisoire qui liste les pioches.
- ❌ Le jeu lui-même n'est pas encore codé.

## 5. Feuille de route (proposition)

1. **Données** : blocs, sacs, enchantements, zones et succès, repris de la spec v1.
2. **Mine** : génération des couches pondérée selon la profondeur, avec un aléatoire injectable.
3. **Mineur** : inventaire, pioches et usure, vente, réparation, achats.
4. **Bot de simulation** : un test qui joue une partie complète et vérifie la bedrock en 900 à 1 250 blocs.
5. **UI** : vue de la mine, minage animé, boutons, panneaux (Pioches, Boutique, Enchanter, Succès), toasts.
6. **Sauvegarde** dans `localStorage`.
7. **Fin de partie** : victoire à la bedrock, prestige et succès.
8. **Polish** : ambiance par zone, animations, sons, version mobile.

## 6. Décisions de design (héritées de la v1)

- ❌ Pas de creepers, pas de prix du marché variables, pas de mineurs automatiques, pas de quêtes du marchand.
- ✅ Le joueur n'est jamais bloqué : pioches rachetables, minage à mains nues, galeries horizontales.
- 🆕 Nouveau par rapport à la v1 : la sauvegarde. Elle avait été refusée dans le notebook, mais elle devient indispensable sur le web.

## 7. Journal

- **2026-10-15** : choix de la stack, installation des outils sur le Mac, création du squelette et du dépôt GitHub privé. Ajout du collaborateur `N04H2004`.
- **2026-10-16** : ajout de ce fichier `CONTEXTE.md` au dépôt.
