# Idle Miner — version web

Idle game de minage inspiré de Minecraft : on creuse, on vend, on achète de meilleures pioches pour descendre jusqu'à la bedrock (-128 m depuis le 16/10, contre -64 m dans la v1).
C'est le portage web du notebook Python décrit dans [docs/idle_miner_v1.md](docs/idle_miner_v1.md). **Cette spec est la référence pour les règles et l'équilibrage** (pioches, blocs, enchantements, prestige, succès).
L'état d'avancement, les décisions en attente et la feuille de route sont dans [CONTEXTE.md](CONTEXTE.md) : le lire en début de session et le mettre à jour à chaque étape importante.

## Stack

- **Vite + React + TypeScript**, 100 % côté navigateur, sans backend.
- **Vitest** pour les tests (`npm test`), **oxlint** pour le lint (`npm run lint`).
- Hébergement **Vercel** : chaque push sur `main` déploie la prod, et chaque Pull Request a son lien de preview.
- Code sur GitHub, à deux développeurs : on passe par des branches et des PR, jamais de push direct sur `main`.

## Commandes

- `npm run dev` : serveur local (http://localhost:5173)
- `npm test` : tests unitaires
- `npm run build` : vérification TypeScript et build de production (c'est ce que lance Vercel)

## Architecture

- `src/jeu/` : **logique du jeu en TypeScript pur, sans React ni DOM.** Données (`donnees.ts`), génération de la mine, état du mineur, règles. Tout doit être testable sans navigateur.
- `src/` (le reste) : composants React. Ils lisent l'état du jeu et appellent ses actions, et ne contiennent pas de règles du jeu.
- L'aléatoire passe par une fonction injectable, pour qu'on puisse avoir des tests déterministes.
- Garder un **bot de simulation** dans les tests (comme dans la v1) : il joue une partie complète et vérifie l'équilibrage. Repère (mine à -128 m, couches de 10 blocs) : la bedrock vers 2 000 à 3 500 blocs, soit 15 à 30 minutes de jeu.

## Conventions

- **Tout est en français** : UI, noms de variables et de fonctions, commentaires. Les mots-clés et API de TS/React restent en anglais.
- Code lisible et commenté pour un public débutant, avec des noms explicites, sans astuces obscures.
- Visuel : blocs, animations et effets en CSS (gradients, keyframes) tant qu'on n'a pas décidé d'utiliser des sprites.
- Sons : fabriqués avec Web Audio dans `src/sons.ts` (pas de fichier audio), coupables depuis le bandeau.
- Sauvegarde de la progression dans `localStorage` (nouveau par rapport à la v1, indispensable sur le web).

## Choix de design hérités de la v1 (à respecter)

- ❌ Pas de creepers, pas de prix du marché variables, pas de mineurs automatiques (PNJ), pas de quêtes du marchand.
  - Exception décidée le 16/10 : la **foreuse** (débloquée au prestige 1, alimentée au charbon) creuse toute seule.
- On ne doit jamais être bloqué : pioches rachetables, minage à mains nues si la pioche est cassée, galeries horizontales à la profondeur max.
