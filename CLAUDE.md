# Mega Digger — version web (ex-Idle Miner)

Idle game de minage inspiré de Minecraft. Devant la mine, on clique sur un bloc (chaque clic = un bloc cassé) et tout va dans le **coffre de la mine**, qu'on **vend d'un clic depuis la mine** (25/10 : plus de sac à dos ni de bazar) ; on embauche des **taupes mineuses** qui remplissent le coffre, puis on automatise : des **rails** de la mine au marché (le wagonnet y vend tout seul, poussé par le joueur ou un pousseur), et le **générateur** à redstone qui électrifie les rails dans son rayon. La mine a **5 niveaux**, qui sont aussi des **paliers** : descendre au niveau N débloque le niveau N de **toutes** les améliorations (tout a 5 niveaux). Plus de prestige, de profondeur ni de vue en coupe : ils sont archivés dans `archives/`.
Le village est une **clairière vue du ciel** de 40 × 40 cases (vue isométrique, façon Clash of Clans) où l'on pose ses bâtiments où l'on veut : voir [docs/jeu/village.md](docs/jeu/village.md).
C'est au départ le portage web du notebook Python décrit dans [docs/idle_miner_v1.md](docs/idle_miner_v1.md) : cette spec reste une source d'idées, mais **les règles et l'équilibrage actuels sont dans `src/jeu/donnees.ts` et la doc `docs/jeu/`**.
Toute la doc du jeu est dans [docs/jeu/vue-d-ensemble.md](docs/jeu/vue-d-ensemble.md) (sommaire) et chaque bâtiment a sa fiche dans [docs/batiments/](docs/batiments/README.md) : les mettre à jour quand on modifie le jeu.
L'état d'avancement, les décisions en attente et la feuille de route sont dans [CONTEXTE.md](CONTEXTE.md) : le lire en début de session et le mettre à jour à chaque étape importante. La revue avant CrazyGames est dans [docs/revue-crazygames.md](docs/revue-crazygames.md).

## Stack

- **Vite + React + TypeScript**, côté navigateur. Le seul « backend » est **Supabase** (décidé le 19/10), pour les comptes, la sauvegarde en ligne et le classement : pas de serveur à nous. Le jeu doit toujours marcher sans lui (tout reste dans le stockage du navigateur).
- **Vitest** pour les tests (`npm test`), **oxlint** pour le lint (`npm run lint`).
- Hébergement **Vercel** : chaque push sur `main` déploie la prod, et chaque Pull Request a son lien de preview.
- **CrazyGames** (25/10) : une version « portail » se fabrique avec `VITE_PORTAIL=crazygames npm run build` (`src/portail.ts` : sans comptes, sans application à installer, publicités par le SDK de CrazyGames). Les chemins sont relatifs (`base: './'` dans `vite.config.ts`) : écrire les chemins des fichiers de `public/` avec `import.meta.env.BASE_URL`, jamais `/images/...`.
- Code sur GitHub, à deux développeurs : on passe par des branches et des PR, jamais de push direct sur `main`.
- **À chaque modification demandée** : une fois les tests, le lint et le build au vert, on crée la Pull Request et on la fusionne dans `main` (demandé le 19/10), pour que Vercel mette la nouvelle version en ligne tout de suite.

## Commandes

- `npm run dev` : serveur local (http://localhost:5173)
- `npm test` : tests unitaires
- `npm run build` : vérification TypeScript et build de production (c'est ce que lance Vercel)
- `npm run traductions` : les textes du jeu qui n'ont pas encore leur traduction anglaise

## Architecture

- `src/jeu/` : **logique du jeu en TypeScript pur, sans React ni DOM.** Données (`donnees.ts`), mine, état de la partie (`mineur.ts`), employés, wagonnets, gemmes (`gemmes.ts`), langues (`langue.ts`). Tout doit être testable sans navigateur.
- `src/composants/` : composants React. Ils lisent l'état du jeu et appellent ses actions, et ne contiennent pas de règles du jeu. `useJeu()` (`contexteJeu.ts`) donne la partie, `jouer`, et `regarderPub`.
- `src/styles/` : le style (voir « Le style » plus bas). `src/village.css` : le dessin du village.
- L'aléatoire passe par une fonction injectable, pour qu'on puisse avoir des tests déterministes.
- Garder un **bot de simulation** dans les tests (`src/jeu/bot.ts`) : il joue une partie complète et vérifie l'équilibrage. Repères (25/10, début rapide et paliers) : niveau 2 de la mine en 2 à 10 minutes, rails posés en moins de 10 minutes et électrifiés en moins de 1 h 30, niveau 5 en 3 h à 6 h (médianes ; un vrai joueur met plutôt 5 à 8 h).

## Conventions

- **Tout est en français** : noms de variables et de fonctions, commentaires. Les mots-clés et API de TS/React restent en anglais.
- **Deux langues** (25/10) : l'**anglais par défaut**, le français au choix (drapeaux dessinés, `Drapeau.tsx`) ; en anglais, les employés ont des prénoms anglais (`nomEmploye`, la partie garde le prénom français). Tout texte affiché passe par `t('Texte en français', { trou: valeur })` (`src/jeu/langue.ts`) ; la traduction anglaise est dans `src/jeu/traductions/en.ts` (la phrase française sert de clé). Les nombres : `nombre(n)` et `nombreAbrege(n)` (`src/nombres.ts`), jamais `toLocaleString('fr-FR')`. Après avoir ajouté des textes, lancer `npm run traductions` et compléter `en.ts`.
- Code lisible et commenté pour un public débutant, avec des noms explicites, sans astuces obscures.
- **Téléphone et PWA** : le jeu doit rester jouable au pouce (gros boutons ronds en bas, fenêtres qui montent du bas de l'écran, rien qui déborde en largeur, cibles d'au moins 40 px, texte d'au moins 12 px, aucune info seulement dans un `title=`). Il s'installe comme une application et marche hors ligne (hors version CrazyGames) : `public/manifest.webmanifest`, `public/sw.js`, `src/installation.ts`.
- **Le stockage** : toujours `stockage` de `src/stockage.ts`, jamais `window.localStorage` (bloqué dans certaines pages d'autres sites : le jeu ne démarrait pas).
- **Le style** (25/10) : cartoon tout simple et coloré, des **contours bleu nuit épais partout** (`#2a2140`), des ombres dures, du crème pour les fenêtres, des aplats pastel, ni dégradés ni flous. Les briques sont dans `src/styles/theme.css` : les boutons (une couleur par sorte d'action : vert acheter/améliorer/construire/embaucher, jaune action principale/vendre/valider, violet gemmes/pubs, bleu aller/voir/régler, blanc neutre/annuler, rose détruire), les fenêtres (`Fenetre.tsx` : la même partout, ✖, Échap, clic à côté), les lignes d'amélioration (`Amelioration.tsx` : bouton vert avec le prix + bouton violet en gemmes), les pastilles, les jauges. Polices : Lilita One (titres) et Nunito, servies par le jeu (`@fontsource`).
- Visuel du village : les bâtiments, les taupes (personnages), les arbres, les rails et le décor sont des dessins SVG dans ce style (`public/images/`, fabriqués par `outils/art/`, voir son LISEZMOI), calés sur la grille par `src/composants/iso.ts` et `src/composants/sprites.ts`.
- **Icônes** (27/10) : on écrit des emojis dans le code, mais ils s'affichent avec notre **police d'icônes cartoon** (`public/fonts/icones-mega.woff2`, fabriquée par `outils/icones/fabriquer.py`, voir son LISEZMOI). Un nouvel emoji doit être dessiné dans `outils/icones/dessins.py`, sinon c'est l'emoji du système qui s'affiche.
- Sons : fabriqués avec Web Audio (pas de fichier audio, sauf le « cha-ching » des ventes, `public/sons/cash.mp3`) : bruitages dans `src/sons.ts`, musique et ambiances dans `src/ambiance.ts`. Les deux se coupent dans les réglages ⚙️, et se taisent pendant une publicité.
- Sauvegarde de la progression dans le stockage du navigateur, avec jusqu'à **5 mondes** (5 parties séparées) choisis sur l'écran d'accueil (`src/composants/Accueil.tsx`, logique dans `src/jeu/sauvegarde.ts`). Une ancienne version de partie est convertie (`convertirVersionNN`) : ne jamais faire perdre sa partie à un joueur.
- **Comptes (facultatifs, hors CrazyGames)** : pseudo + mot de passe, sans email. Connecté, tous les mondes sont recopiés en ligne sur Supabase (`src/enLigne.ts` parle au serveur, `src/useCompte.ts` synchronise, règles pures dans `src/jeu/compte.ts`). **Classement** à l'argent gagné en tout (25/10 : avant, l'argent en poche, qui punissait les achats), le meilleur des mondes du joueur ; le niveau de la mine, rangé dans la colonne `prestige` du serveur, est seulement affiché : `src/jeu/classement.ts` + `src/composants/CarteClassement.tsx`. Les tables et leurs règles de sécurité sont dans `supabase/schema.sql` et `supabase/classement.sql` : toute nouvelle table doit avoir ses règles (RLS). Ne jamais mettre la clé `service_role` / secret dans le code.

## Choix de design hérités de la v1 (à respecter)

- ❌ Pas de creepers, pas de prix du marché variables, pas de quêtes du marchand.
- ✅ Le jeu est fait pour l'**automatisation**, et doit tourner tout seul dès les premières minutes :
  - la **mine** sort toute seule quelques blocs par seconde dans son coffre, dès le niveau 1 (plein : elle s'arrête) ; le joueur clique sur le bloc pour aller plus vite, et vend le coffre d'un clic (au prix du marché ; une punaise 📌 garde un minerai pour ses améliorations) ;
  - les **mineurs employés** (des taupes, dès le début, bâtiment « Personnel », `src/jeu/employes.ts` ; le premier ne coûte presque rien) creusent et envoient leur sac dans le coffre par l'ascenseur ; les **pousseurs** sont un autre métier, embauché pour un trajet de wagonnet ; on paie leur embauche, leurs pioches, et un **salaire toutes les 5 minutes**. Au niveau 3 de la mine, le **manager** paie les salaires avec l'argent du joueur ; au niveau 4, le **recruteur** leur donne une rareté ;
  - les **rails** (3 fer la case, jamais en boucle : une seule route entre deux bâtiments) relient deux bâtiments, puis le joueur choisit ses **trajets de wagonnets** (`src/jeu/wagonnet.ts`) : Mine → Marché (le coffre), Mine → Foreuse (charbon), Mine → Générateur (redstone), Foreuse → Marché (le chariot). Il faut **un pousseur embauché par trajet automatique**, même électrique ; sinon le joueur le pousse lui-même. Le **marché** ne sert plus qu'à ça : y recevoir les wagonnets ;
  - le **générateur** (niveau 2 de la mine, redstone, `src/jeu/generateur.ts`) électrifie ce qui est dans son rayon : les rails (le wagonnet va plus vite) et la **foreuse** (au charbon ; son chariot se vend sur place d'un clic). Une seule foreuse et un seul générateur.
- **Paliers** (25/10) : toutes les améliorations (coffre, ascenseur, pioches, mineurs, pousseurs, foreuse, générateur) ont **5 niveaux**, et le niveau N demande la mine au niveau N ; les chefs (manager, recruteur) ont 3 niveaux. On améliore un niveau de chaque chose, puis on descend la mine : personne n'est en avance ni en retard.
- **Niveau du joueur** (29/10, `src/jeu/niveaux.ts`, au plus 15) : tout ce qu'on fait rapporte de l'XP ; il débloque les rails (niveau 2) et les niveaux de la mine (`NIVEAU_JOUEUR_POUR` dans `donnees.ts`), et **chaque niveau rapporte des gemmes**. Le tutoriel va jusqu'au premier mineur embauché, puis la liste des tâches guide sans obliger.
- **Gemmes et publicités** (25/10, `src/jeu/gemmes.ts`) : une publicité regardée = 1 gemme (pour l'instant une fausse publicité de 30 s, `Publicite.tsx` ; sur CrazyGames, leur publicité récompensée). Les gemmes paient n'importe quelle amélioration (sans argent ni minerais), ou des bonus à la boutique (production × 2, ventes × 2, clics en or, trésor). **Cadeau du jour** : une série de 7 jours, le 7e est le gros lot. Au retour d'absence, une publicité **double** ce que l'absence a rapporté. Les publicités restent toujours au choix : jamais pour débloquer la progression.
- Les alertes : un état (coffre plein, pioche cassée, plus de charbon) = une bulle sur le bâtiment ; un conseil = la liste des tâches ; un événement = un message (au plus 3 à la fois). Ne pas signaler la même chose à plusieurs endroits.
- On ne doit jamais être bloqué : la mine tourne toute seule, les pioches sont rachetables, et avec une pioche cassée on casse quand même un bloc tous les 2 clics.
- Le **prestige** et l'**enchanteur** sont retirés (22/10) mais gardés dans `archives/` (code et fiches), au cas où : une « nouvelle mine » avec un bonus permanent est prévue pour la fin de partie.
