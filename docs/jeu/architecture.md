# Architecture du code

> Comment le projet Mega Digger (ex-Idle Miner) est organisé : stack, fichiers, flux des données, tests et façon de travailler.
> Rédigé d'après le code au 20/10. Les règles du jeu sont dans [../idle_miner_v1.md](../idle_miner_v1.md), le village vu du ciel dans [village.md](village.md) et les fiches des bâtiments dans [../batiments/](../batiments/README.md). La sauvegarde et la partie en ligne sont détaillées dans [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## 1. Stack

| Sujet | Choix |
|---|---|
| Langage | TypeScript (~6.0), mode strict « bundler » (`tsconfig.app.json` : `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`...) |
| Interface | React 19 (`react`, `react-dom`), en `StrictMode` |
| Outil de build | Vite 8 avec `@vitejs/plugin-react` |
| Tests | Vitest 5 (`*.test.ts`, sans navigateur) |
| Lint | oxlint (plugins `react`, `typescript`, `oxc` ; `react/rules-of-hooks` en erreur, `react/only-export-components` en avertissement), voir `.oxlintrc.json` |
| En ligne | Supabase (`@supabase/supabase-js`) : comptes, sauvegarde en ligne, classement. Seul « backend », pas de serveur à nous. Le jeu marche sans |
| Hébergement | Vercel (build = `npm run build`, dossier `dist/`) |
| Visuel | La mine en coupe : tout en CSS (dégradés, keyframes) et quelques SVG en React. Le village vu du ciel (20/10) : le décor et les bâtiments sont des images webp fournies par l'équipe (`public/images/`), posées sur la grille par une transformation CSS (`iso.ts`) ; la mine, les rails, les chemins, les décorations et les hamsters sont dessinés en SVG dans le même style |
| Sons | Web Audio, fabriqués par le code (aucun fichier audio) |
| PWA | Manifeste + service worker (production uniquement) : installable et jouable hors ligne |

Dépendances de production : seulement `react`, `react-dom` et `@supabase/supabase-js`.

## 2. Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur local sur http://localhost:5173 (sans service worker) |
| `npm test` | `vitest run` : tous les tests unitaires une fois |
| `npm run lint` | `oxlint` |
| `npm run build` | `tsc -b && vite build` : vérification TypeScript puis build de production dans `dist/` (c'est ce que lance Vercel) |
| `npm run preview` | Sert le build de `dist/` en local |

## 3. Arborescence des fichiers

### 3.1 Racine

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Règles du projet pour les assistants (stack, conventions, choix de design hérités de la v1) |
| `CONTEXTE.md` | État d'avancement, équipe, infra (Vercel, Supabase), décisions et feuille de route ; à lire en début de session |
| `README.md` | Lancer le projet et travailler à deux (branches, PR) |
| `index.html` | Page unique : `<div id="root">`, liens PWA (manifeste, `theme-color`, icône Apple, mode plein écran iOS), `viewport-fit=cover` |
| `package.json` / `package-lock.json` | Dépendances et scripts npm |
| `vite.config.ts` | Plugin React et constante `__VERSION_JEU__` (commit + date du build, voir section 9) |
| `tsconfig.json` | Renvoie vers `tsconfig.app.json` et `tsconfig.node.json` |
| `tsconfig.app.json` | Options TypeScript du code du jeu (`src/`) |
| `tsconfig.node.json` | Options TypeScript de `vite.config.ts` |
| `.oxlintrc.json` | Configuration du lint |
| `.gitignore` | `node_modules`, `dist`, fichiers `*.local` (dont `.env.local`), fichiers d'éditeur, captures `/*.png` à la racine |

### 3.2 `src/jeu/` : la logique du jeu (TypeScript pur, sans React ni DOM)

| Fichier | Rôle |
|---|---|
| `donnees.ts` | Toutes les données et constantes : blocs, pioches, sacs, enchantements, niveaux d'ascenseur, de forage, de chariot et d'équipement des mineurs, raretés, salaires, profondeur de la bedrock par prestige (`profondeurBedrock`), plafonds par prestige |
| `mine.ts` | Génération des couches de la mine (quels blocs à quelle profondeur, mis à l'échelle de la mine du prestige) |
| `mineur.ts` | Le type `EtatJeu` (et `Ascenseur`, `Foreuse`, `Employe`, `Manager`, `Statistiques`...), `VERSION_ETAT` (18), `creerPartie`, `prestige`, et les règles et actions du joueur : minage, sac, vente, échelle, ascenseur (son chargement part au marché), pioches, réparation, bazar, enchantements |
| `foreuse.ts` | La foreuse (prestige 1) : activation, charbon, forage, chariot, améliorations, recharge auto |
| `employes.ts` | Les mineurs employés (prestige 2) : embauche, équipement, travail (creuser, monter, marcher au village jusqu'au marché, à la forge ou au Personnel, vendre, redescendre), salaires, licenciement, recruteur et rareté (prestige 4), manager et trésorerie (prestige 5) |
| `village.ts` | Le village vu du ciel (20/10), géométrie seulement : types `Village`, `BatimentPose`, `DecorationPosee`, `Convoi` ; grille de 40 × 40 cases, mine posée d'office, emprises et cases occupées, entrée des bâtiments (avec le miroir), chemin à pied (A étoile, avec cache), distance et temps à pied, ligne de rails mine → marché, raccords des rails, durée d'un chargement (`trajetChargement`, `envoyerAuMarche`) |
| `batiments.ts` | Les actions du village : construire un bâtiment (prix en argent, pierre ou roche dure, fer), le déplacer ou le retourner, nouveautés du menu Bâtiments, poser / déplacer / enlever des rails (prestige 2) et des chemins, acheter / déplacer / enlever des décorations |
| `convois.ts` | Les chargements qui vont de la mine au marché (brouette ou wagonnet) et se vendent en arrivant ; charger le wagonnet soi-même |
| `tenues.ts` | Les tenues du joueur (Bazar) : acheter, porter, enlever |
| `notifications.ts` | Les bulles au-dessus des bâtiments posés (salaires, chariot plein, plus de charbon, pioche cassée, sac plein, prestige prêt, points de talent, nouveauté, nouveaux niveaux, achetable), triées par urgence |
| `talents.ts` | L'arbre de prestige : 5 branches de 4 talents, points, prérequis et bonus |
| `conditionsPrestige.ts` | Ce qu'il faut avoir fait pour passer prestige (bedrock + tout amélioré au maximum permis) |
| `succes.ts` | Les 19 succès (dont Architecte, Paysagiste et Cheminot pour le village) et `verifierSucces` |
| `decouvertes.ts` | Ce qui vient de se débloquer (foreuse, Personnel, recruteur, manager), montré par une bulle ✨ au-dessus du bâtiment jusqu'à ce qu'on passe devant |
| `objectifs.ts` | Bâtiments où une amélioration est achetable, bâtiments avec de nouveaux niveaux, et le « prochain objectif » sous le bandeau (dont « Construire : X » pour un bâtiment débloqué pas encore posé) |
| `revenu.ts` | Estimation de l'argent gagné par seconde (indicateur « $/s ») |
| `statistiques.ts` | Calculs pour l'écran 📊 (addition des statistiques au prestige, argent par source, blocs les plus cassés) |
| `temps.ts` | `avancerTemps` (le temps qui passe pour tout le monde, chargements vers le marché compris) et `tempsQuiPasse` (y a-t-il quelque chose qui bouge ?) |
| `aleatoire.ts` | Le type `Aleatoire`, `aleatoireNavigateur` (Math.random), `aleatoireAvecGraine` (mulberry32) et les aides `entierEntre`, `choisir`, `choisirPondere` |
| `sauvegarde.ts` | Sauvegarde `localStorage`, les 5 mondes, la vérification de version (plus de migrations depuis la v18 : les anciennes parties repartent de zéro, `partieAncienne`), export/import de tous les mondes |
| `compte.ts` | Règles du pseudo et du mot de passe, email fabriqué, choix de synchronisation à la connexion |
| `classement.ts` | Calcul du meilleur score (prestige et argent gagné) parmi les mondes |
| `bot.ts` | Bot de simulation qui joue une partie complète (`jouerPartie`), utilisé par les tests d'équilibrage ; il pose ses bâtiments à des places fixes et compte sa marche jusqu'au marché |
| `*.test.ts` | Les tests (section 6) |

### 3.3 `src/` : le pont avec React et les services du navigateur

| Fichier | Rôle |
|---|---|
| `main.tsx` | Point d'entrée : importe les CSS, monte `<App />` en `StrictMode`, enregistre le service worker |
| `App.tsx` | `App` (écran d'accueil ou jeu, compte toujours actif) et `Jeu` : assemble les composants, relie boutons et clavier aux actions, passe du village vu du ciel à la mine en coupe (et retour, avec les transitions), gère la construction (fantôme à poser, pinceau des rails et chemins, mode Modifier) et choisit le panneau du bâtiment devant lequel se tient le joueur |
| `usePartie.ts` | Hook central : garde l'`EtatJeu`, applique les actions, fait tourner l'horloge, déclenche sons, animations et notifications, sauvegarde automatiquement |
| `useCompte.ts` | Hook du compte en ligne : session, synchronisation des mondes, envoi du score |
| `enLigne.ts` | Le seul fichier qui parle à Supabase (comptes, sauvegardes, classement) |
| `useJoueurVillage.ts` | Le hamster du joueur dans le village vu du ciel (20/10) : position sur la grille, flèches du clavier (combinables), marche jusqu'à une case ou un bâtiment (chemin à pied), saut avec Espace, demi-tour fluide ; affichage seulement (pas dans `EtatJeu`) |
| `useCompteur.ts` | Un nombre qui défile jusqu'à sa nouvelle valeur (compteur d'argent) |
| `evenements.ts` | Compare l'état avant/après une action pour en tirer des `Evenement` (casse, trouvaille, vente, achat, amélioration, nouvelle couche, ding, pas, pioche cassée, talent, récolte des mineurs) |
| `travail.ts` | Découpe le minage du joueur en tics (`travailler`) sans perdre le temps en trop entre deux blocs |
| `choix.ts` | Les quantités choisies avec les jauges (marché, ascenseur) et le lot qui en résulte |
| `sons.ts` | Bruitages Web Audio, réglage 🔊 gardé dans le `localStorage` |
| `ambiance.ts` | Musique et ambiances Web Audio (oiseaux et vent à la surface, grotte dans la mine), réglage 🎵 |
| `installation.ts` | Enregistrement du service worker (production seulement) et hook `useInstallation` (bouton d'installation Android/Chrome/Edge, explication pour iOS) |
| `version.d.ts` | Déclare la constante globale `__VERSION_JEU__` |
| `index.css` | Mise en page générale, thème, bandeau, barre de boutons, et « Les couleurs des boutons » (une couleur par sorte d'action) |
| `blocs.css` | Les blocs de la mine dessinés en CSS (classes `.bloc-<id>`, `.roche-pierre`, `.roche-deepslate`) |
| `effets.css` | Animations : éclats, minerais rares, ventes et pièces, compteur d'argent, arbre de prestige |
| `accueil.css` | L'écran d'accueil (bandeau avec le petit village vivant, logo en panneau de bois, cartes « comment jouer », mondes, compte, classement) |
| `personnel.css` | Le stand Personnel : couleurs des raretés, salaires, manager, recruteur (avec leurs portraits), animation d'embauche |
| `village.css` | Le village vu du ciel (20/10) : carte, calques, bâtiments, personnages, wagonnets, bulles de notification, menus Bâtiments / Décorations / Modifier, entrée dans la mine, version téléphone |
| `evenements.test.ts`, `travail.test.ts` | Tests (section 6) |

### 3.4 `src/composants/` : les composants React (aucune règle du jeu)

| Fichier | Rôle |
|---|---|
| `Accueil.tsx` | Écran d'accueil : logo, petit village vivant, 4 cartes « comment jouer », cartes des 5 mondes (jouer, renommer, dupliquer, supprimer, créer ; prévient quand une partie d'avant le village repart de zéro), compte, installation, classement, version |
| `SceneAccueil.tsx` | Le décor de l'accueil : un village tout fait (mine, bâtiments, décorations, rails) avec des hamsters qui vont et viennent et un wagonnet, recadré pour remplir le bandeau |
| `CarteCompte.tsx` | Carte du compte : formulaire pseudo + mot de passe, ou état de la synchronisation et déconnexion |
| `CarteClassement.tsx` | Classement (20 premiers), onglets Prestige / Argent |
| `CarteInstallation.tsx` | Carte « Installer l'application » (masquable avec « Plus tard ») |
| `Hud.tsx` | Bandeau du haut : argent, $/s, profondeur, pioche, sac, seaux, enchantements, boutons 🔊 et 🎵, étoile de l'arbre |
| `ProchainObjectif.tsx` | Barre « prochain objectif » sous le bandeau (un clic emmène au bon bâtiment, ou ouvre le menu Bâtiments pour une construction) |
| `VueMonde.tsx` | La mine en coupe (2D) : bande de ciel en haut, puits creusé, échelle, ascenseur, foreuse, galeries des mineurs ; la caméra suit le joueur |
| `VueVillage.tsx` | Le village vu du ciel (refait le 20/10) : décor, bâtiments, rails, chemins, décorations, fantôme de ce qu'on pose, joueur, mineurs qui marchent, manager et recruteur, wagonnets, bulles de notification ; caméra (glisser, pincer, molette, suit le joueur, plongée dans la mine) et touchers (aller quelque part, choisir, peindre) |
| `iso.ts` | La projection isométrique (case de la grille ↔ point de l'image du décor), l'ordre d'affichage, le calage de chaque image de bâtiment sur son emprise (`CALAGES`, `transformationSprite`), et où se tient un personnage devant un bâtiment |
| `DessinsVillage.tsx` | Les dessins SVG du village : la mine (de plus en plus creusée), les rails (droits et virages), les chemins de pavés, les décorations, le wagonnet et la brouette |
| `ElementsVillage.tsx` | Un personnage posé sur la grille (`Perso`) et l'image d'un bâtiment (`ImageBatiment`), partagés par la carte et l'accueil |
| `fantome.ts` | Le type de ce qu'on est en train de poser ou de déplacer (bâtiment, décoration, case de rail ou de chemin) |
| `Hamster.tsx` | Les hamsters vus de face ou de dos (joueur avec sa tenue, mineur avec son casque couleur de rareté, manager, recruteur), avec pioche et sac |
| `Personnage.tsx` | Le hamster de profil dans la mine en coupe, avec la couleur de sa pioche (casque de rareté pour les mineurs, tenue pour le joueur) |
| `MenuConstruction.tsx` | Les menus « 🏗️ Bâtiments » (prix, cadenas de prestige, pastille Nouveau, rails) et « 🌸 Décorations » (chemins et décorations) |
| `PanneauTenues.tsx` | Les tenues du joueur au Bazar (aperçu, acheter, porter, enlever) |
| `Panneaux.tsx` | Panneaux des bâtiments Marché, Forgeron (pioches), Bazar, Enchanteur, Foreuse, et panneau des succès (le panneau de la Mine, avec « Entrer dans la mine » et le wagonnet, est dans `App.tsx`) |
| `PanneauEmployes.tsx` | Le stand Personnel : embauche, équipement, salaires, licenciement, recruteur, manager et trésorerie |
| `RevelationRecrue.tsx` | Animation de révélation de la rareté d'un nouveau mineur |
| `Inventaire.tsx` | Le sac au fond de la mine, envoi par l'ascenseur |
| `Jauges.tsx` | Jauges de quantité par objet (vente, envoi) |
| `Ascenseur.tsx` | État de la cabine et ligne de construction/amélioration de l'ascenseur |
| `Amelioration.tsx` | Ligne d'amélioration commune (carrés de niveaux, cadenas de prestige, prix, bouton) |
| `PrixCout.tsx` | Affichage d'un prix (vert si on a, rouge s'il manque) |
| `Barre.tsx` | Barre de progression |
| `ArbrePrestige.tsx` | Fenêtre de l'arbre de prestige |
| `CartePrestige.tsx` | Liste de ce qu'il reste à faire pour passer prestige, avec jauge |
| `FetePrestige.tsx` | Animation de félicitations au prestige |
| `Victoire.tsx` | Écran de victoire à la bedrock |
| `Statistiques.tsx` | Fenêtre des statistiques (cette partie ou depuis le début) |
| `Toasts.tsx` | Notifications |
| `Confirmation.tsx` | Fenêtre de confirmation dans le style du jeu |
| `Icone.tsx` | Icônes (émojis, et dessin du stand Personnel) |

### 3.5 `public/` : fichiers servis tels quels

| Fichier | Rôle |
|---|---|
| `manifest.webmanifest` | Manifeste PWA : nom « Mega Digger », `standalone`, portrait, couleurs `#15151a`, icônes |
| `sw.js` | Service worker : cache `idle-miner-v2` (les images du village sont rangées dès l'installation) ; page réseau d'abord (repli sur le cache), `/assets/` cache d'abord, autres fichiers cache puis mise à jour ; nettoie les anciens `/assets/` ; ne touche jamais aux requêtes vers d'autres origines (Supabase) |
| `favicon.svg` | Icône de l'onglet |
| `icones/icone-192.png`, `icones/icone-512.png` | Icônes de l'application |
| `icones/icone-maskable-512.png` | Icône « maskable » (Android) |
| `icones/apple-touch-icon.png` | Icône pour l'écran d'accueil iOS |
| `images/village/fond.webp` | Le décor de la clairière vue du ciel (1 536 × 1 024 pixels) |
| `images/batiments/*.webp` | Les images des bâtiments (bazar, employes, enchanteur, foreuse, forgeron, marche, prestige) et des rails (carte du menu) |
| `images/personnages/*.webp` | Les portraits du manager, du mineur et du recruteur (accueil, stand Personnel) |

### 3.6 `supabase/` : la base de données

| Fichier | Rôle |
|---|---|
| `schema.sql` | Table `sauvegardes` (tous les mondes d'un joueur), droits, règles RLS, trigger de date |
| `classement.sql` | Table `classement`, index, droits, règles RLS (pseudo du compte obligatoire), trigger qui garde le meilleur score. À lancer après `schema.sql` |

Ces scripts se collent à la main dans le SQL Editor de Supabase : rien ne les exécute automatiquement.

### 3.7 `docs/`

| Fichier | Rôle |
|---|---|
| `idle_miner_v1.md` | Spec de la v1 (notebook Python) : la référence pour les règles et l'équilibrage |
| `batiments/README.md` | Index des fiches des bâtiments du village |
| `batiments/mine.md`, `marche.md`, `forgeron.md`, `bazar.md`, `enchanteur.md`, `foreuse.md`, `personnel.md`, `prestige.md` | Une fiche par bâtiment (à mettre à jour quand on le modifie) |
| `jeu/vue-d-ensemble.md` | Le point d'entrée de la doc : concept, boucle, progression, glossaire, sommaire |
| `jeu/village.md` | Le village vu du ciel : grille, placement, menus, rails, décorations, notifications, personnages |
| `jeu/equilibrage.md`, `jeu/mine-et-minage.md`, `jeu/interface.md`, `jeu/visuel-et-sons.md` | Chiffres et formules, la mine, l'écran, le visuel et les sons |
| `jeu/architecture.md` | Ce document |
| `jeu/sauvegarde-et-en-ligne.md` | Sauvegarde locale, version de l'état, comptes, synchronisation, classement, tables Supabase |

## 4. Le flux des données

```
             ┌──────────────── src/jeu (TypeScript pur) ────────────────┐
             │  EtatJeu (objet JSON)   actions : (etat) => string[]      │
             │  avancerTemps(etat, secondes, aleatoire)                  │
             └───────────────▲──────────────────────────┬───────────────┘
                             │ jouer(action)            │ nouvel état
             ┌───────────────┴──────── usePartie.ts ────▼───────────────┐
             │ copie → action → succès → événements → sons/animations   │
             │ horloge (tics) · sauvegarde automatique                  │
             └───────────────▲──────────────────────────┬───────────────┘
                             │ clics, clavier           │ etat, toasts, gains...
             ┌───────────────┴─── App.tsx + composants ─▼───────────────┐
             │ lisent l'état, appellent jouer(...) ; aucune règle        │
             └──────────────────────────────────────────────────────────┘
```

### 4.1 L'état

Toute la partie tient dans un seul objet `EtatJeu` (défini dans `src/jeu/mineur.ts`) fait de nombres, textes, listes et objets simples. Il se sauvegarde donc tel quel en JSON. Le détail de chaque champ est dans [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#16-ce-qui-est-stocké--etatjeu-champ-par-champ).

### 4.2 Les actions : `(etat) => string[]`

Une action du jeu (dans `src/jeu/`) **modifie l'état qu'on lui donne** et **renvoie la liste des messages** à afficher au joueur (vide si rien à dire). Exemples : `casserBloc(etat, aleatoire)`, `vendre(etat)`, `ameliorerAscenseur(etat)`, `marquerDecouvert(etat, ids)`. Les fonctions qui ne font que lire l'état (`vitesse`, `tailleSac`, `peutPasserPrestige`...) ne le modifient pas.

Côté React, le type est `Action = (etat: EtatJeu) => string[]` (`usePartie.ts`), et les composants appellent `jouer(action)`, par exemple `jouer(vendre)` ou `jouer((e) => voyager(e, 0))`.

### 4.3 `jouer` dans `usePartie.ts`

1. Copie profonde de l'état actuel (`structuredClone`) : React reçoit toujours un nouvel objet, l'ancien reste intact.
2. L'action s'applique à la copie et renvoie ses messages.
3. `verifierSucces(copie)` débloque les nouveaux succès.
4. Les messages et succès deviennent des notifications (toasts) : 5 au plus, sans doublon, 3,5 s chacune.
5. `evenementsEntre(ancien, copie)` (`src/evenements.ts`) déduit ce qui s'est passé, pour jouer les sons (`sons.ts`) et les animations (éclats, minerais trouvés, gain « +X $ », grosse animation de vente).
6. Le nouvel état est rangé (`setEtat` et une référence `etatRef` toujours à jour pour les minuteurs).

Un `useEffect` sauvegarde dans le `localStorage` à chaque changement d'`etat`.

### 4.4 La boucle de temps

- `tempsQuiPasse(etat)` (`src/jeu/temps.ts`) dit si quelque chose bouge tout seul : le joueur sur l'échelle ou vers le puits, l'ascenseur, la foreuse avec du charbon, des mineurs employés, des chargements en route vers le marché, ou un manager embauché. (La marche du hamster dans le village vu du ciel a sa propre boucle d'affichage, dans `useJoueurVillage.ts`.)
- L'horloge (`useEffect` de `usePartie.ts`) ne tourne que si quelque chose bouge **ou** si le joueur a demandé de creuser. Elle bat à chaque image de l'écran (`requestAnimationFrame`) quand le joueur ou la cabine se déplace (mouvement fluide), sinon toutes les 50 ms. Chaque tic compte au plus 1 s (onglet en pause, par exemple).
- À chaque tic : si `tempsQuiPasse`, `jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))`, qui enchaîne `avancerMarche`, `avancerSurEchelle`, `avancerAscenseur`, `avancerForeuse`, `avancerEmployes`, `avancerConvois`.
- Puis le minage du joueur, seulement s'il reste des blocs à casser et que le joueur est au front de taille : `travailler` (`src/travail.ts`) accumule le temps sur le bloc en cours (durée `dureeBlocActuel`, au moins 0,08 s) ; quand il est cassé, `jouer(casserBloc)`. Un « tac » de pioche toutes les 0,22 s.
- Les boutons : « Creuser » = finir la couche en cours (le nombre de blocs restants), « Auto » = sans fin (`Infinity`) jusqu'à « Arrêt », sac plein (sans place sur le quai de l'ascenseur), départ du front, ou pioche cassée en auto. Avec l'envoi automatique coché, l'ascenseur est appelé quand le sac est plein et on continue de creuser.
- À l'ouverture d'un monde, le temps d'absence (au plus 8 h) est rattrapé en un seul appel à `avancerTemps` (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#18-retour-au-jeu-après-une-absence)).

### 4.5 Les écrans

- `App` affiche l'accueil tant qu'aucun monde n'est choisi, puis `<Jeu key={monde.id}>` (changer de monde repart d'un composant neuf). Le hook `useCompte` vit dans `App`, il continue donc de synchroniser pendant la partie ; quitter un monde déclenche un envoi immédiat.
- `Jeu` a deux modes (classe `mode-village` ou `mode-mine`), choisis par `aLaSurface(etat)` :
  - **village vu du ciel** (le joueur à la position 0) : bandeau (`Hud`), prochain objectif, `VueVillage`, et à droite (en bas sur téléphone) le panneau du bâtiment devant lequel se tient le joueur (il s'ouvre quand il y arrive en marchant). Barre du bas : 🏗️ Bâtiments (avec le nombre de nouveautés), 🌸 Décos, ✏️ Modifier, ⛏️ Mine ; pendant qu'on pose ou qu'on modifie, elle devient ✔ / ↔ Retourner / 🗑️ Enlever / ✖ Annuler (ou ✔ Terminé pour le pinceau des rails et des chemins). Fenêtre : le menu de construction (`MenuConstruction`).
  - **mine en coupe** : bandeau, prochain objectif, `VueMonde`, barre de 4 boutons (Creuser/Arrêter, Auto/Arrêt, 🏠 Village, ⛏️ Front), et à droite le sac et les pioches.
  - **Passer de l'un à l'autre** : « Entrer dans la mine » fait marcher le hamster jusqu'à la mine, puis une transition `entree` (la caméra plonge dans la mine, fondu au noir) avant d'envoyer le mineur au front ; quand le joueur revient à la position 0, une transition `sortie` le replace devant la mine au village.
  - Dans les deux modes : les notifications, et les fenêtres succès, statistiques, fête du prestige, arbre de prestige, victoire.
- Clavier : au village, les flèches pour marcher (combinables, en diagonale), Espace pour sauter, Échap pour annuler ce qu'on pose ; sur l'échelle ↑ ↓ ; au front ← → pour se déplacer, ↑ pour remonter. On ne creuse qu'avec les boutons. Souris et doigt au village : toucher un bâtiment pour y aller (son panneau s'ouvre à l'arrivée), toucher le sol pour y marcher, glisser pour déplacer la carte, pincer ou molette pour zoomer.

## 5. L'aléatoire injectable

- Tout tirage au hasard passe par une fonction de type `Aleatoire = () => number` (entre 0 inclus et 1 exclu), donnée en paramètre (`creerPartie(aleatoire)`, `casserBloc(etat, aleatoire)`, `avancerTemps(etat, s, aleatoire)`, `genererCouche(..., aleatoire, ...)`...).
- En jeu : `aleatoireNavigateur` (`Math.random`).
- Dans les tests (et dans le bot) : `aleatoireAvecGraine(graine)` (générateur mulberry32) donne toujours la même suite de nombres, donc des parties identiques à chaque fois.
- La logique de `src/jeu/` n'appelle jamais `Math.random` directement.

## 6. Les tests

Lancés par `npm test` (Vitest), sans navigateur. Le `localStorage` est remplacé par un faux stockage en mémoire. Au 20/10 : **18 fichiers, 207 tests**.

| Fichier | Ce qu'il vérifie |
|---|---|
| `src/jeu/bot.test.ts` | **Bot d'équilibrage** : 20 parties à graines fixes (1 à 20). Toujours la bedrock (prestige 0, -100 m) avec la pioche en netherite ; prêt à passer prestige en y arrivant ; médiane de **1 300 à 3 000 blocs** et de **10 à 25 minutes** ; jamais extrêmement long ou court ; ascenseur construit entre -10 et -70 m ; plusieurs remontées au village ; pioche en fer achetée entre -15 et -70 m |
| `src/jeu/mineur.test.ts` | Début de partie (au village, avec la mine posée) ; minage en zigzag, sac, usure, couche suivante, galerie à la profondeur max de la pioche, mains nues, sac plein, bedrock ; blocs spéciaux (lave, seau et obsidienne, coffre, géode) ; vente (tout, objets décochés, pas au fond, bonus de prestige +15 %, vitesse +10 %) ; échelle et déplacements ; vente ou envoi d'une partie seulement ; marche jusqu'au puits ; ascenseur (6 niveaux, capacité, envoi dont le chargement part au marché et s'y vend, quai, passager, appel) ; pioches et réparation ; sac, enchantements (prix, déblocage par prestige, gardés au prestige, Fortune 20/40/60 %) ; prestige, argent total gardé, succès uniques |
| `src/jeu/sauvegarde.test.ts` | Relecture exacte d'une partie ; `null` si absente ou abîmée ; une partie d'avant le village vu du ciel (version 17 ou moins) repart de zéro (`partieAncienne`) ; temps depuis la dernière sauvegarde ; mondes (création, couleurs, 5 au plus, renommer, dupliquer, supprimer, dernier joué, reprise de l'ancienne partie unique) ; export/import de tous les mondes (mêmes mondes sur un autre appareil, seulement des clés de mondes, copie vide) |
| `src/jeu/compte.test.ts` | Pseudo (simple, trop court/long, caractères interdits), mot de passe de 6 caractères, même email quelle que soit la casse ; choix de synchronisation (rien, envoyer, récupérer, envoyer sans demander, demander) ; dernier échange gardé dans le stockage |
| `src/jeu/classement.test.ts` | Meilleur prestige et plus d'argent gagné parmi les mondes ; 0 sans monde |
| `src/jeu/conditionsPrestige.test.ts` | Ce qu'il faut pour passer prestige aux prestiges 0, 1, 2 et 4 (bedrock, ascenseur, sac, enchantements, foreuse et chariot, équipement des mineurs, recruteur) ; la bedrock seule ne suffit pas |
| `src/jeu/decouvertes.test.ts` | Nouveautés à découvrir (foreuse au prestige 1, mineurs au 2, recruteur au 4, manager au 5) ; au prestige, pioches gardées réparées avec la meilleure équipée, sac gardé |
| `src/jeu/donnees.test.ts` | Pioches triées et de plus en plus rapides ; coûts de la foreuse et de l'équipement des mineurs ; bedrock 50 m plus bas par prestige ; malus ×1,5 dans la roche dure ; durée de casse de la pierre avec la pioche en bois (0,3375 s) |
| `src/jeu/mine.test.ts` | Terre, pierre puis roche dure ; minerais à partir de leur profondeur, apparition progressive ; blocs spéciaux ; la foreuse ne tire jamais de bloc spécial ; mêmes couches avec la même graine ; mise à l'échelle par prestige ; poids des blocs |
| `src/jeu/foreuse.test.ts` | Bloquée au prestige 0 ; activation ; charbon ; un mètre tous les 10 blocs ; chariot plein ; vidage (marché ou sac, objets cochés) ; recharge auto au niveau 3 ; améliorations plafonnées par le prestige ; ce qu'elle garde au prestige ; chariot rempli en environ 8 minutes ; talents de l'ingénieur et du marchand |
| `src/jeu/employes.test.ts` | Mineurs : nombre par prestige, prix selon la taille de l'équipe, travail complet (creuser, remonter, marcher jusqu'au marché, vendre, redescendre), leur ascenseur, équipement par prestige, sac, profondeur limitée par la pioche, prestige, talents du patron ; salaires (rentables, attente sans salaire, 10 minutes à la fois, mineur rare) ; licenciement ; recruteur et chances de rareté (65/20/10/4/1 au premier niveau) ; manager et trésorerie |
| `src/jeu/talents.test.ts` | Cinq branches de quatre talents, 1 point par prestige, prérequis, branches Patron et Recrutement, talents gardés, bonus (ventes, Œil de lynx, Pioche robuste, Briseur de roche) |
| `src/jeu/objectifs.test.ts` | Prochain objectif (tout au début : poser le marché ; achetable, minerai manquant, bedrock puis prestige) ; bâtiments « Achetable ! » et « Nouveaux niveaux ! » (seulement ceux qui sont posés) |
| `src/jeu/village.test.ts` | **Le village vu du ciel** (20 tests) : la mine au milieu au départ ; prix des bâtiments (marché gratuit), pierre payable en roche dure, pas de chevauchement ni de sortie de la clairière, déblocage par prestige avec pastille « Nouveau », bâtiments gardés au prestige, déplacer et retourner (l'entrée change de côté) ; chemin à pied qui contourne les bâtiments, distance de porte à porte, décorations qui bloquent ou non ; chargements vers le marché (brouette, attente sans marché, rails 3 fois plus rapides, wagonnet chargé depuis la mine) ; mineurs au village (marche jusqu'au marché, wagonnet avec des rails, passage à la forge, attente devant le Personnel sans salaire) ; bulles de la foreuse ; tenues |
| `src/jeu/revenu.test.ts` | Argent par seconde : 0 au début, minage, profondeur et Fortune, foreuse, mineurs (ascenseur, salaires, mineurs en attente), cohérent avec ce que les mineurs rapportent vraiment |
| `src/jeu/statistiques.test.ts` | Blocs par sorte et profondeur max ; argent de la foreuse et des mineurs séparé ; addition au prestige |
| `src/evenements.test.ts` | Événements pour les sons et animations : bloc cassé, diamant trouvé, vente, arrivée de l'ascenseur |
| `src/travail.test.ts` | Le minage va à la même vitesse avec 20 ou 60 tics par seconde (bug corrigé le 19/10) ; jamais plus d'un bloc d'avance |

Il n'y a pas de tests des composants React ni de `enLigne.ts` / `useCompte.ts` (réseau) : leur logique testable est dans `src/jeu/compte.ts` et `src/jeu/classement.ts`.

## 7. Conventions de code

- **Tout en français** : interface, noms de variables, de fonctions et de fichiers, commentaires. Seuls les mots-clés et API de TypeScript/React restent en anglais.
- Code lisible et commenté pour des débutants, noms explicites, pas d'astuces obscures.
- **Séparation stricte** : les règles du jeu sont dans `src/jeu/` (aucun import de React ni du DOM, tout testable sans navigateur). Les composants lisent l'état et appellent les actions, sans règle du jeu. Ce qui n'est que de l'affichage (marche du hamster du joueur dans le village, caméra, projection isométrique, jauges, événements sonores) reste côté `src/`. Au village, la logique ne connaît que les cases de la grille (`village.ts`) ; le passage aux pixels de l'image est dans `src/composants/iso.ts`.
- Aléatoire injectable (section 5), stockage injectable (`Stockage` dans `sauvegarde.ts`).
- Chaque accès au `localStorage` est protégé par `try/catch`.
- Visuel : la mine en CSS (dégradés, keyframes) ; au village (décidé le 20/10), les images webp de l'équipe pour le décor et les bâtiments, et du SVG dans le même style pour le reste. Sons en Web Audio.
- **Couleurs des boutons** (dans `index.css`) : Creuser = or, Arrêter = rouge, Vendre = vert, Acheter = bleu, Améliorer = turquoise, Réparer = orange, Enchanter = violet, Prestige = rose, Ascenseur = cyan, Se déplacer = bois, Mettre dans le sac = kaki, Charbon = anthracite, Salaires et trésorerie = citron vert, Recruter = arc-en-ciel, le reste = gris.
- **Téléphone** : jouable au pouce, barre de boutons collée en bas sur petit écran, rien qui déborde en largeur.
- Changer le format de `EtatJeu` → augmenter `VERSION_ETAT` et décider : écrire une migration, ou laisser les anciennes parties repartir de zéro comme le 20/10 (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#15-la-version-de-létat-et-la-fin-des-migrations)).
- Modifier un bâtiment → mettre à jour sa fiche dans `docs/batiments/`. Étape importante → mettre à jour `CONTEXTE.md`.
- Toute nouvelle table Supabase a ses règles RLS ; jamais de clé `service_role` / secrète dans le code.
- Garder le bot de simulation et ses repères d'équilibrage (section 6).

## 8. Workflow Git, PR et Vercel

- Code sur GitHub, à deux développeurs. Branche principale : `main`. **Jamais de push direct sur `main`** : une branche par modification, puis une Pull Request.
- Avant la PR : `npm test`, `npm run lint` et `npm run build` au vert.
- Règle décidée le 19/10 : à chaque modification demandée, une fois tout au vert, on crée la PR **et on la fusionne** dans `main`, pour que la nouvelle version soit en ligne tout de suite.
- Vercel : chaque push sur `main` déploie la production, et chaque PR a son lien de preview. Vercel lance `npm run build`. Il n'y a pas de `vercel.json` dans le dépôt.
- Les scripts SQL de `supabase/` ne sont pas déployés automatiquement : il faut les lancer à la main dans Supabase après une modification.

## 9. La version affichée

- `vite.config.ts` définit au moment du build la constante globale `__VERSION_JEU__` = `"<commit> · <date du build>"` :
  - le commit : les 7 premiers caractères de `VERCEL_GIT_COMMIT_SHA` sur Vercel, sinon `git rev-parse --short HEAD`, sinon `local` ;
  - la date : heure de Paris, format court français (`JJ/MM/AAAA HH:MM`).
- `src/version.d.ts` déclare cette constante pour TypeScript.
- Elle est affichée en petit tout en bas de l'écran d'accueil (« Version ... ») : ça permet de vérifier que Vercel a bien mis en ligne la dernière version.
- Le champ `version` de `package.json` (`0.0.0`) n'est pas utilisé. À ne pas confondre avec `VERSION_ETAT` (format de la sauvegarde, actuellement 18).
