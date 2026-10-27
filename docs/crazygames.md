# Publier sur CrazyGames

27 oct. 2026

Le même code fabrique deux versions du jeu :

| | Le site megadigger.io (Vercel) | CrazyGames |
| --- | --- | --- |
| Commande | `npm run build` (Vercel la lance tout seul) | `npm run build:crazygames` |
| Dossier | `dist/` | `dist-crazygames/`, et le ZIP `mega-digger-crazygames.zip` à la racine du projet |
| Comptes, classement, visites (Supabase) | oui | non : le jeu ne parle jamais à Supabase (`AVEC_COMPTES`), et (27/10) la bibliothèque de Supabase n'est même pas dans le jeu : `vite.config.ts` met `src/enLigneAbsent.ts` (les mêmes fonctions, vides) à la place de `src/enLigne.ts` |
| Packs de gemmes payants | montrés, « Bientôt disponible » au paiement | retirés : une carte « Bientôt disponible » à leur place (`AVEC_PACKS`) |
| Application à installer (PWA) | oui | non : ni service worker, ni manifeste, ni icônes d'application |
| Publicités | la fausse publicité de 30 s | leur publicité récompensée (SDK v3) |
| Sauvegarde | le stockage du navigateur | le module « Data » de leur SDK (gardée sur le compte CrazyGames du joueur) |
| Mondes | jusqu'à 5 | **un seul** (`AVEC_PLUSIEURS_MONDES`) : pas de liste de mondes ; dans ⚙️, « Menu principal » au lieu de « Changer de monde » |
| Menu principal | classement à droite, numéro de version en bas | un **très gros bouton « Jouer »** (ou « Commencer ») qui respire sans dépasser de sa carte, en premier, avec dessous 3 cases « Creuse, Embauche, Automatise » (joueur qui revient), bandeau aligné dessus, pas de numéro de version ; (27/10) dans un cadre bas (moins de 760 px), les 4 étapes en petit pour que tout tienne |

Tout ce qui diffère passe par `src/portail.ts` (`PORTAIL`, `AVEC_COMPTES`, `AVEC_PACKS`, `AVEC_PLUSIEURS_MONDES`, `AVEC_INSTALLATION`). **Ne pas copier le jeu** dans un autre dépôt : une modification propre à CrazyGames s'écrit dans le même code, sous `if (PORTAIL === 'crazygames')`.

## Comment ça marche

- `npm run build:crazygames` lance `vite build --mode crazygames` : Vite lit `.env.crazygames` (`VITE_PORTAIL=crazygames`), écrit dans `dist-crazygames/` et retire les fichiers de l'application à installer (`vite.config.ts`, `sansApplication`). Puis `outils/crazygames/zipper.mjs` fait le ZIP, avec `index.html` à la racine.
- Au démarrage (`src/main.tsx`), le jeu attend le SDK (6 s au plus), qui prépare la sauvegarde du joueur. Si le module Data marche, `stockage` (`src/stockage.ts`) est branché dessus (`brancherStockage`), puis le jeu est chargé. Sans SDK (bloqueur de pubs, hors de CrazyGames), le jeu démarre quand même, avec le stockage du navigateur.

## Publier (à faire par le propriétaire)

1. Compte développeur sur developer.crazygames.com.
2. `npm run build:crazygames`, puis envoyer `mega-digger-crazygames.zip` (environ 0,8 Mo, 221 fichiers ; la limite de CrazyGames est de 50 Mo, 20 Mo pour la page d'accueil mobile, et 1 500 fichiers).
3. Dans le formulaire, **cocher « Le jeu sauvegarde la progression »** : sans ça, leur module Data est coupé (le jeu garde alors le stockage du navigateur).
4. Tester dans leur **QA Tool** (avec « SDK Debug » ; la console montre aussi les messages « [Mega Digger] » : SDK prêt, sauvegarde par le module Data, gameplayStart/Stop) : la publicité récompensée donne 1 💎, le son se coupe pendant la pub, la partie revient après un rechargement, le jeu se joue sur téléphone à l'horizontale.
5. La fiche : titre, description en anglais, commandes (souris, ou doigt sur téléphone), catégories (Idle, Clicker), la vignette et la vidéo.
6. Leur revue, puis un premier lancement à un petit public (« Basic Launch »), élargi selon le temps de jeu et le retour des joueurs.

## Plus tard : un classement et des visites sur CrazyGames

Supabase marche depuis CrazyGames : il faut seulement savoir qui est le joueur. L'idée : prendre le joueur connecté à CrazyGames (le module User du SDK, et son jeton signé), le faire vérifier par une petite fonction Supabase (Edge Function), et ranger les scores à part (une colonne `plateforme`, ou des tables séparées, avec leurs règles RLS). Voir les visites seulement demande pas d'être connecté.
