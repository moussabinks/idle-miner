# Mega Digger — version web (ex-Idle Miner)

Idle game de minage inspiré de Minecraft : on creuse, on vend, on achète de meilleures pioches pour descendre jusqu'à la bedrock. Depuis le 19/10, la mine est plus profonde à chaque prestige : -100 m au prestige 0, puis 50 m de plus par prestige (-150, -200, -250...), contre -64 m dans la v1.
C'est le portage web du notebook Python décrit dans [docs/idle_miner_v1.md](docs/idle_miner_v1.md). **Cette spec est la référence pour les règles et l'équilibrage** (pioches, blocs, enchantements, prestige, succès).
L'état d'avancement, les décisions en attente et la feuille de route sont dans [CONTEXTE.md](CONTEXTE.md) : le lire en début de session et le mettre à jour à chaque étape importante.

## Stack

- **Vite + React + TypeScript**, côté navigateur. Le seul « backend » est **Supabase** (décidé le 19/10), pour les comptes et la sauvegarde en ligne (et bientôt le leaderboard) : pas de serveur à nous. Le jeu doit toujours marcher sans lui (tout reste dans `localStorage`).
- **Vitest** pour les tests (`npm test`), **oxlint** pour le lint (`npm run lint`).
- Hébergement **Vercel** : chaque push sur `main` déploie la prod, et chaque Pull Request a son lien de preview.
- Code sur GitHub, à deux développeurs : on passe par des branches et des PR, jamais de push direct sur `main`.
- **À chaque modification demandée** : une fois les tests, le lint et le build au vert, on crée la Pull Request et on la fusionne dans `main` (demandé le 19/10), pour que Vercel mette la nouvelle version en ligne tout de suite.

## Commandes

- `npm run dev` : serveur local (http://localhost:5173)
- `npm test` : tests unitaires
- `npm run build` : vérification TypeScript et build de production (c'est ce que lance Vercel)

## Architecture

- `src/jeu/` : **logique du jeu en TypeScript pur, sans React ni DOM.** Données (`donnees.ts`), génération de la mine, état du mineur, règles. Tout doit être testable sans navigateur.
- `src/` (le reste) : composants React. Ils lisent l'état du jeu et appellent ses actions, et ne contiennent pas de règles du jeu.
- L'aléatoire passe par une fonction injectable, pour qu'on puisse avoir des tests déterministes.
- Garder un **bot de simulation** dans les tests (comme dans la v1) : il joue une partie complète et vérifie l'équilibrage. Repère pour la première partie (prestige 0, mine à -100 m, couches de 10 blocs) : la bedrock vers 1 300 à 3 000 blocs, soit 10 à 25 minutes de jeu.

## Conventions

- **Tout est en français** : UI, noms de variables et de fonctions, commentaires. Les mots-clés et API de TS/React restent en anglais.
- Code lisible et commenté pour un public débutant, avec des noms explicites, sans astuces obscures.
- **Téléphone et PWA** : le jeu doit rester jouable au pouce (barre de boutons collée en bas sur petit écran, rien qui déborde en largeur). Il s'installe comme une application et marche hors ligne : `public/manifest.webmanifest`, `public/sw.js` (service worker, seulement en production), `src/installation.ts`.
- Visuel : blocs, animations et effets en CSS (gradients, keyframes) tant qu'on n'a pas décidé d'utiliser des sprites.
- Sons : fabriqués avec Web Audio (pas de fichier audio, donc rien à créditer) : bruitages dans `src/sons.ts`, musique et ambiances (oiseaux et vent à la surface, grotte dans la mine) dans `src/ambiance.ts`. Les deux se coupent depuis le bandeau (🔊 et 🎵).
- Boutons : une couleur par sorte d'action (creuser, vendre, acheter, améliorer, réparer, enchanter, prestige, ascenseur, se déplacer...), voir « Les couleurs des boutons » dans `src/index.css`.
- Sauvegarde de la progression dans `localStorage` (nouveau par rapport à la v1, indispensable sur le web), avec jusqu'à **5 mondes** (5 parties séparées) choisis sur l'écran d'accueil (`src/composants/Accueil.tsx`, logique dans `src/jeu/sauvegarde.ts`).
- **Comptes (facultatifs)** : pseudo + mot de passe, sans email. Connecté, tous les mondes sont recopiés en ligne sur Supabase (`src/enLigne.ts` parle au serveur, `src/useCompte.ts` synchronise, règles pures dans `src/jeu/compte.ts`). **Classement** (prestige et argent gagné au total, le meilleur des mondes du joueur) : `src/jeu/classement.ts` + `src/composants/CarteClassement.tsx`, envoyé avec la sauvegarde. Les tables et leurs règles de sécurité sont dans `supabase/schema.sql` et `supabase/classement.sql` : toute nouvelle table doit avoir ses règles (RLS). Ne jamais mettre la clé `service_role` / secret dans le code.

## Choix de design hérités de la v1 (à respecter)

- ❌ Pas de creepers, pas de prix du marché variables, pas de mineurs automatiques (PNJ), pas de quêtes du marchand.
  - Exception décidée le 16/10 : la **foreuse** (débloquée au prestige 1, alimentée au charbon) creuse toute seule. Une seule foreuse (décidé le 20/10), avec 8 niveaux de forage et de chariot.
  - Exception décidée le 19/10 : les **mineurs employés** (débloqués au prestige 2, stand « Personnel », `src/jeu/employes.ts`) creusent, remontent et vendent tout seuls ; on paie leur embauche, leurs pioches, et un **salaire toutes les 10 minutes** (décidé le 20/10 : sinon ils attendent au stand Personnel). Au prestige 4, le **recruteur** leur donne une rareté (commun à mythique) ; au prestige 5, le **manager** paie les salaires tout seul avec la trésorerie.
- On ne doit jamais être bloqué : pioches rachetables, minage à mains nues si la pioche est cassée, galeries horizontales à la profondeur max.
- On ne passe prestige qu'une fois la bedrock atteinte **et** tout amélioré au maximum de ce que le prestige permet (décidé le 20/10, `src/jeu/conditionsPrestige.ts`).
