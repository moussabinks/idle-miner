# Mega Digger — version web (ex-Idle Miner)

Idle game de minage inspiré de Minecraft. Depuis le 22/10 (**la mine automatique**) : devant la mine, on clique sur un bloc (chaque clic = un bloc cassé) et tout va dans le **coffre de la mine** ; on le vend au marché, on embauche des mineurs qui remplissent le coffre, puis on automatise : des **rails** de la mine au marché (le wagonnet, poussé par le joueur ou un mineur), et le **générateur** à redstone qui électrifie les rails dans son rayon (le wagonnet roule tout seul). La mine a **5 niveaux** (pierre/charbon/fer, + redstone, + or, + émeraude, + diamant). Plus de prestige, de profondeur ni de vue en coupe : ils sont archivés dans `archives/`.
Le village est une **clairière vue du ciel** (vue isométrique à 45°, façon Clash of Clans) où l'on pose ses bâtiments où l'on veut : voir [docs/jeu/village.md](docs/jeu/village.md).
C'est au départ le portage web du notebook Python décrit dans [docs/idle_miner_v1.md](docs/idle_miner_v1.md) : cette spec reste une source d'idées, mais **les règles et l'équilibrage actuels sont dans `src/jeu/donnees.ts` et la doc `docs/jeu/`**.
Toute la doc du jeu est dans [docs/jeu/vue-d-ensemble.md](docs/jeu/vue-d-ensemble.md) (sommaire) et chaque bâtiment a sa fiche dans [docs/batiments/](docs/batiments/README.md) : les mettre à jour quand on modifie le jeu.
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
- Garder un **bot de simulation** dans les tests (`src/jeu/bot.ts`) : il joue une partie complète et vérifie l'équilibrage. Repères (22/10) : niveau 2 de la mine en 5 à 20 minutes, rails posés en moins de 5 minutes et électrifiés en moins de 40, niveau 5 en 1 h à 2 h 30 (médianes).

## Conventions

- **Tout est en français** : UI, noms de variables et de fonctions, commentaires. Les mots-clés et API de TS/React restent en anglais.
- Code lisible et commenté pour un public débutant, avec des noms explicites, sans astuces obscures.
- **Téléphone et PWA** : le jeu doit rester jouable au pouce (barre de boutons collée en bas sur petit écran, rien qui déborde en largeur). Il s'installe comme une application et marche hors ligne : `public/manifest.webmanifest`, `public/sw.js` (service worker, seulement en production), `src/installation.ts`.
- Visuel : le bloc à cliquer, les animations et effets en CSS (gradients, keyframes). Au village (décidé le 20/10), le décor et les bâtiments sont les images fournies par l'équipe (`public/images/`, en webp), calées sur la grille par `src/composants/iso.ts` ; les personnages (hamsters) sont les images tirées des planches de l'équipe (`public/images/personnages/sprites/`, vues devant / derrière / gauche / droite, `src/composants/sprites.ts`) ; le reste (rails, wagonnet, rayon du générateur, chemins, décorations, cabine de la mine) est dessiné en SVG dans le même style (bois, pierre, coins dorés, lanternes).
- Sons : fabriqués avec Web Audio (pas de fichier audio, donc rien à créditer) : bruitages dans `src/sons.ts`, musique et ambiances (oiseaux et vent au village) dans `src/ambiance.ts`. Les deux se coupent dans le menu ⚙️ (en haut à gauche).
- Boutons : une couleur par sorte d'action (creuser, vendre, acheter, améliorer, réparer, se déplacer...), voir « Les couleurs des boutons » dans `src/index.css`.
- Sauvegarde de la progression dans `localStorage` (nouveau par rapport à la v1, indispensable sur le web), avec jusqu'à **5 mondes** (5 parties séparées) choisis sur l'écran d'accueil (`src/composants/Accueil.tsx`, logique dans `src/jeu/sauvegarde.ts`).
- **Comptes (facultatifs)** : pseudo + mot de passe, sans email. Connecté, tous les mondes sont recopiés en ligne sur Supabase (`src/enLigne.ts` parle au serveur, `src/useCompte.ts` synchronise, règles pures dans `src/jeu/compte.ts`). **Classement** (niveau de la mine, rangé dans la colonne `prestige` du serveur, et argent gagné, le meilleur des mondes du joueur) : `src/jeu/classement.ts` + `src/composants/CarteClassement.tsx`, envoyé avec la sauvegarde. Les tables et leurs règles de sécurité sont dans `supabase/schema.sql` et `supabase/classement.sql` : toute nouvelle table doit avoir ses règles (RLS). Ne jamais mettre la clé `service_role` / secret dans le code.

## Choix de design hérités de la v1 (à respecter)

- ❌ Pas de creepers, pas de prix du marché variables, pas de quêtes du marchand.
- ✅ Depuis le 22/10, le jeu est fait pour l'**automatisation** (on n'entre plus dans la mine) :
  - la **mine** sort toute seule quelques blocs par seconde dans son coffre (plein : elle s'arrête) ; le joueur clique sur le bloc pour aller plus vite ;
  - les **mineurs employés** (dès le début, stand « Personnel », `src/jeu/employes.ts`) creusent lentement et remontent leur sac dans le coffre, ou poussent le wagonnet (rôle « pousseur ») ; on paie leur embauche, leurs pioches, et un **salaire toutes les 10 minutes** (sinon ils attendent au stand Personnel). Au niveau 3 de la mine, le **recruteur** leur donne une rareté ; au niveau 4, le **manager** paie les salaires avec la trésorerie ;
  - les **rails** (3 fer la case, jamais en boucle : une seule route entre deux bâtiments) relient deux bâtiments, puis le joueur choisit lui-même ses **trajets de wagonnets** au panneau du départ (24/10, `src/jeu/wagonnet.ts`) : Mine → Marché (le coffre), Mine → Foreuse (charbon), Mine → Générateur (redstone), Foreuse → Marché (le chariot), un wagonnet chacun. Sans électricité, il faut les pousser (le joueur, puis un mineur) ;
  - le **générateur** (niveau 2 de la mine, redstone, rayon de 15 cases au départ, `src/jeu/generateur.ts`) électrifie ce qui est dans son rayon : les rails (le wagonnet roule tout seul) et la **foreuse** (au charbon, plus rapide sous électricité). Une seule foreuse et un seul générateur.
- On ne doit jamais être bloqué : la mine tourne toute seule, les pioches sont rachetables, et avec une pioche cassée on casse quand même un bloc tous les 2 clics.
- Le **prestige** et l'**enchanteur** sont retirés (22/10) mais gardés dans `archives/` (code et fiches), au cas où. Plus tard, les mineurs pourront recevoir Fortune, Efficacité, etc.
