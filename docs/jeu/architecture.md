# Architecture du code

> Comment le projet Mega Digger (ex-Idle Miner) est organisé : stack, fichiers, flux des données, tests et façon de travailler.
> Rédigé d'après le code au 20/10. Les règles du jeu sont dans [../idle_miner_v1.md](../idle_miner_v1.md) et les fiches des bâtiments dans [../batiments/](../batiments/README.md). La sauvegarde et la partie en ligne sont détaillées dans [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

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
| Visuel | Tout en CSS (dégradés, keyframes) et quelques SVG en React. Pas de sprites, pas d'images à part les icônes de l'application |
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
| `mineur.ts` | Le type `EtatJeu` (et `Ascenseur`, `Foreuse`, `Employe`, `Manager`, `Statistiques`...), `VERSION_ETAT`, `creerPartie`, `prestige`, et les règles et actions du joueur : minage, sac, vente, échelle, ascenseur, pioches, réparation, bazar, enchantements |
| `foreuse.ts` | La foreuse (prestige 1) : activation, charbon, forage, chariot, améliorations, recharge auto |
| `employes.ts` | Les mineurs employés (prestige 2) : embauche, équipement, travail, salaires, licenciement, recruteur et rareté (prestige 4), manager et trésorerie (prestige 5) |
| `talents.ts` | L'arbre de prestige : 5 branches de 4 talents, points, prérequis et bonus |
| `conditionsPrestige.ts` | Ce qu'il faut avoir fait pour passer prestige (bedrock + tout amélioré au maximum permis) |
| `succes.ts` | Les 16 succès et `verifierSucces` |
| `decouvertes.ts` | Les stands nouvellement débloqués à montrer avec une flèche au village |
| `objectifs.ts` | Stands « Achetable ! », badge « Nouveaux niveaux », et le « prochain objectif » sous le bandeau |
| `revenu.ts` | Estimation de l'argent gagné par seconde (indicateur « $/s ») |
| `statistiques.ts` | Calculs pour l'écran 📊 (addition des statistiques au prestige, argent par source, blocs les plus cassés) |
| `temps.ts` | `avancerTemps` (le temps qui passe pour tout le monde) et `tempsQuiPasse` (y a-t-il quelque chose qui bouge ?) |
| `aleatoire.ts` | Le type `Aleatoire`, `aleatoireNavigateur` (Math.random), `aleatoireAvecGraine` (mulberry32) et les aides `entierEntre`, `choisir`, `choisirPondere` |
| `sauvegarde.ts` | Sauvegarde `localStorage`, les 5 mondes, les migrations de version, export/import de tous les mondes |
| `compte.ts` | Règles du pseudo et du mot de passe, email fabriqué, choix de synchronisation à la connexion |
| `classement.ts` | Calcul du meilleur score (prestige et argent gagné) parmi les mondes |
| `bot.ts` | Bot de simulation qui joue une partie complète (`jouerPartie`), utilisé par les tests d'équilibrage |
| `*.test.ts` | Les tests (section 6) |

### 3.3 `src/` : le pont avec React et les services du navigateur

| Fichier | Rôle |
|---|---|
| `main.tsx` | Point d'entrée : importe les CSS, monte `<App />` en `StrictMode`, enregistre le service worker |
| `App.tsx` | `App` (écran d'accueil ou jeu, compte toujours actif) et `Jeu` (assemble les composants, relie boutons et clavier aux actions, choisit le panneau du stand) |
| `usePartie.ts` | Hook central : garde l'`EtatJeu`, applique les actions, fait tourner l'horloge, déclenche sons, animations et notifications, sauvegarde automatiquement |
| `useCompte.ts` | Hook du compte en ligne : session, synchronisation des mondes, envoi du score |
| `enLigne.ts` | Le seul fichier qui parle à Supabase (comptes, sauvegardes, classement) |
| `useMarcheVillage.ts` | La marche du mineur dans le village (position en tuiles, flèches gardées, marche automatique vers un stand) : affichage seulement |
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
| `accueil.css` | L'écran d'accueil (héros, coupe de la mine, cartes des mondes, compte, classement) |
| `personnel.css` | Le stand Personnel : couleurs des raretés, salaires, manager, recruteur, animation d'embauche |
| `evenements.test.ts`, `travail.test.ts` | Tests (section 6) |

### 3.4 `src/composants/` : les composants React (aucune règle du jeu)

| Fichier | Rôle |
|---|---|
| `Accueil.tsx` | Écran d'accueil : présentation, illustration de la mine, cartes des 5 mondes (jouer, renommer, dupliquer, supprimer, créer), compte, installation, classement, version |
| `CarteCompte.tsx` | Carte du compte : formulaire pseudo + mot de passe, ou état de la synchronisation et déconnexion |
| `CarteClassement.tsx` | Classement (20 premiers), onglets Prestige / Argent |
| `CarteInstallation.tsx` | Carte « Installer l'application » (masquable avec « Plus tard ») |
| `Hud.tsx` | Bandeau du haut : argent, $/s, profondeur, pioche, sac, seaux, enchantements, boutons 🔊 et 🎵, étoile de l'arbre |
| `ProchainObjectif.tsx` | Barre « prochain objectif » sous le bandeau (un clic emmène au bon stand) |
| `VueMonde.tsx` | Vue du monde : village en haut, puits creusé, échelle, ascenseur, foreuse, galeries des mineurs ; la caméra suit le joueur |
| `VueVillage.tsx` | Le village : chemin, décor, stands, flèches et badges |
| `stands.ts` | Liste et positions des stands du village (`STANDS`, `X_PUITS`, `standProche`) |
| `Personnage.tsx` | Le personnage (une taupe mineuse) en SVG, avec la couleur de sa pioche |
| `Panneaux.tsx` | Panneaux des stands Marché, Forgeron (pioches), Bazar, Enchanteur, Foreuse, et panneau des succès |
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
| `sw.js` | Service worker : cache `idle-miner-v1` ; page réseau d'abord (repli sur le cache), `/assets/` cache d'abord, autres fichiers cache puis mise à jour ; nettoie les anciens `/assets/` ; ne touche jamais aux requêtes vers d'autres origines (Supabase) |
| `favicon.svg` | Icône de l'onglet |
| `icones/icone-192.png`, `icones/icone-512.png` | Icônes de l'application |
| `icones/icone-maskable-512.png` | Icône « maskable » (Android) |
| `icones/apple-touch-icon.png` | Icône pour l'écran d'accueil iOS |

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
| `jeu/architecture.md` | Ce document |
| `jeu/sauvegarde-et-en-ligne.md` | Sauvegarde locale, migrations, comptes, synchronisation, classement, tables Supabase |

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

- `tempsQuiPasse(etat)` (`src/jeu/temps.ts`) dit si quelque chose bouge tout seul : le joueur sur l'échelle ou vers le puits, l'ascenseur, la foreuse avec du charbon, des mineurs employés, ou un manager embauché.
- L'horloge (`useEffect` de `usePartie.ts`) ne tourne que si quelque chose bouge **ou** si le joueur a demandé de creuser. Elle bat à chaque image de l'écran (`requestAnimationFrame`) quand le joueur ou la cabine se déplace (mouvement fluide), sinon toutes les 50 ms. Chaque tic compte au plus 1 s (onglet en pause, par exemple).
- À chaque tic : si `tempsQuiPasse`, `jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))`, qui enchaîne `avancerMarche`, `avancerSurEchelle`, `avancerAscenseur`, `avancerForeuse`, `avancerEmployes`.
- Puis le minage du joueur, seulement s'il reste des blocs à casser et que le joueur est au front de taille : `travailler` (`src/travail.ts`) accumule le temps sur le bloc en cours (durée `dureeBlocActuel`, au moins 0,08 s) ; quand il est cassé, `jouer(casserBloc)`. Un « tac » de pioche toutes les 0,22 s.
- Les boutons : « Creuser » = finir la couche en cours (le nombre de blocs restants), « Auto » = sans fin (`Infinity`) jusqu'à « Arrêt », sac plein (sans place sur le quai de l'ascenseur), départ du front, ou pioche cassée en auto. Avec l'envoi automatique coché, l'ascenseur est appelé quand le sac est plein et on continue de creuser.
- À l'ouverture d'un monde, le temps d'absence (au plus 8 h) est rattrapé en un seul appel à `avancerTemps` (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#18-retour-au-jeu-après-une-absence)).

### 4.5 Les écrans

- `App` affiche l'accueil tant qu'aucun monde n'est choisi, puis `<Jeu key={monde.id}>` (changer de monde repart d'un composant neuf). Le hook `useCompte` vit dans `App`, il continue donc de synchroniser pendant la partie ; quitter un monde déclenche un envoi immédiat.
- `Jeu` : bandeau (`Hud`), prochain objectif, `VueMonde`, barre de 4 boutons fixes (Creuser/Arrêter, Auto/Arrêt, Village, Mine ; grisés quand ils ne servent pas), et à droite le panneau du stand devant lequel on est au village, ou le sac et les pioches dans la mine, avec les notifications dessous. Fenêtres : succès, statistiques, fête du prestige, arbre de prestige, victoire.
- Clavier : au village ← → pour marcher, ↓ pour descendre ; sur l'échelle ↑ ↓ ; au front ← → pour se déplacer, ↑ pour remonter. On ne creuse qu'avec les boutons.

## 5. L'aléatoire injectable

- Tout tirage au hasard passe par une fonction de type `Aleatoire = () => number` (entre 0 inclus et 1 exclu), donnée en paramètre (`creerPartie(aleatoire)`, `casserBloc(etat, aleatoire)`, `avancerTemps(etat, s, aleatoire)`, `genererCouche(..., aleatoire, ...)`...).
- En jeu : `aleatoireNavigateur` (`Math.random`).
- Dans les tests (et pour le décor du village) : `aleatoireAvecGraine(graine)` (générateur mulberry32) donne toujours la même suite de nombres, donc des parties identiques à chaque fois.
- La logique de `src/jeu/` n'appelle jamais `Math.random` directement.

## 6. Les tests

Lancés par `npm test` (Vitest), sans navigateur. Le `localStorage` est remplacé par un faux stockage en mémoire.

| Fichier | Ce qu'il vérifie |
|---|---|
| `src/jeu/bot.test.ts` | **Bot d'équilibrage** : 20 parties à graines fixes (1 à 20). Toujours la bedrock (prestige 0, -100 m) avec la pioche en netherite ; prêt à passer prestige en y arrivant ; médiane de **1 300 à 3 000 blocs** et de **10 à 25 minutes** ; jamais extrêmement long ou court ; ascenseur construit entre -10 et -70 m ; plusieurs remontées au village ; pioche en fer achetée entre -15 et -70 m |
| `src/jeu/mineur.test.ts` | Début de partie ; minage en zigzag, sac, usure, couche suivante, galerie à la profondeur max de la pioche, mains nues, sac plein, bedrock ; blocs spéciaux (lave, seau et obsidienne, coffre, géode) ; vente (tout, objets décochés, pas au fond, bonus de prestige +15 %, vitesse +10 %) ; échelle et déplacements ; vente ou envoi d'une partie seulement ; marche jusqu'au puits ; ascenseur (6 niveaux, capacité, envoi, quai, passager, appel) ; pioches et réparation ; sac, enchantements (prix, déblocage par prestige, gardés au prestige, Fortune 20/40/60 %) ; prestige, argent total gardé, succès uniques |
| `src/jeu/sauvegarde.test.ts` | Relecture exacte d'une partie ; `null` si absente ou abîmée ; migrations depuis les versions 1, 2, 4 (bedrock), 5, 9, 11, 12, 14 et vers 11 ; temps depuis la dernière sauvegarde ; mondes (création, couleurs, 5 au plus, renommer, dupliquer, supprimer, dernier joué, reprise de l'ancienne partie unique) ; export/import de tous les mondes (mêmes mondes sur un autre appareil, seulement des clés de mondes, copie vide) |
| `src/jeu/compte.test.ts` | Pseudo (simple, trop court/long, caractères interdits), mot de passe de 6 caractères, même email quelle que soit la casse ; choix de synchronisation (rien, envoyer, récupérer, envoyer sans demander, demander) ; dernier échange gardé dans le stockage |
| `src/jeu/classement.test.ts` | Meilleur prestige et plus d'argent gagné parmi les mondes ; 0 sans monde |
| `src/jeu/conditionsPrestige.test.ts` | Ce qu'il faut pour passer prestige aux prestiges 0, 1, 2 et 4 (bedrock, ascenseur, sac, enchantements, foreuse et chariot, équipement des mineurs, recruteur) ; la bedrock seule ne suffit pas |
| `src/jeu/decouvertes.test.ts` | Flèches des stands à découvrir (foreuse au prestige 1, mineurs au 2, recruteur au 4, manager au 5) ; au prestige, pioches gardées réparées avec la meilleure équipée, sac gardé |
| `src/jeu/donnees.test.ts` | Pioches triées et de plus en plus rapides ; coûts de la foreuse et de l'équipement des mineurs ; bedrock 50 m plus bas par prestige ; malus ×1,5 dans la roche dure ; durée de casse de la pierre avec la pioche en bois (0,3375 s) |
| `src/jeu/mine.test.ts` | Terre, pierre puis roche dure ; minerais à partir de leur profondeur, apparition progressive ; blocs spéciaux ; la foreuse ne tire jamais de bloc spécial ; mêmes couches avec la même graine ; mise à l'échelle par prestige ; poids des blocs |
| `src/jeu/foreuse.test.ts` | Bloquée au prestige 0 ; activation ; charbon ; un mètre tous les 10 blocs ; chariot plein ; vidage (marché ou sac, objets cochés) ; recharge auto au niveau 3 ; améliorations plafonnées par le prestige ; ce qu'elle garde au prestige ; chariot rempli en environ 8 minutes ; talents de l'ingénieur et du marchand |
| `src/jeu/employes.test.ts` | Mineurs : nombre par prestige, prix selon la taille de l'équipe, travail complet (creuser, remonter, vendre, redescendre), leur ascenseur, équipement par prestige, sac, profondeur limitée par la pioche, prestige, talents du patron ; salaires (rentables, attente sans salaire, 10 minutes à la fois, mineur rare) ; licenciement ; recruteur et chances de rareté (65/20/10/4/1 au premier niveau) ; manager et trésorerie |
| `src/jeu/talents.test.ts` | Cinq branches de quatre talents, 1 point par prestige, prérequis, branches Patron et Recrutement, talents gardés, bonus (ventes, Œil de lynx, Pioche robuste, Briseur de roche) |
| `src/jeu/objectifs.test.ts` | Prochain objectif (début, achetable, minerai manquant, bedrock puis prestige) ; stands « Achetable ! » et « Nouveaux niveaux ! » |
| `src/jeu/revenu.test.ts` | Argent par seconde : 0 au début, minage, profondeur et Fortune, foreuse, mineurs (ascenseur, salaires, mineurs en attente), cohérent avec ce que les mineurs rapportent vraiment |
| `src/jeu/statistiques.test.ts` | Blocs par sorte et profondeur max ; argent de la foreuse et des mineurs séparé ; addition au prestige |
| `src/evenements.test.ts` | Événements pour les sons et animations : bloc cassé, diamant trouvé, vente, arrivée de l'ascenseur |
| `src/travail.test.ts` | Le minage va à la même vitesse avec 20 ou 60 tics par seconde (bug corrigé le 19/10) ; jamais plus d'un bloc d'avance |

Il n'y a pas de tests des composants React ni de `enLigne.ts` / `useCompte.ts` (réseau) : leur logique testable est dans `src/jeu/compte.ts` et `src/jeu/classement.ts`.

## 7. Conventions de code

- **Tout en français** : interface, noms de variables, de fonctions et de fichiers, commentaires. Seuls les mots-clés et API de TypeScript/React restent en anglais.
- Code lisible et commenté pour des débutants, noms explicites, pas d'astuces obscures.
- **Séparation stricte** : les règles du jeu sont dans `src/jeu/` (aucun import de React ni du DOM, tout testable sans navigateur). Les composants lisent l'état et appellent les actions, sans règle du jeu. Ce qui n'est que de l'affichage (marche dans le village, jauges, événements sonores) reste côté `src/`.
- Aléatoire injectable (section 5), stockage injectable (`Stockage` dans `sauvegarde.ts`).
- Chaque accès au `localStorage` est protégé par `try/catch`.
- Visuel en CSS (dégradés, keyframes), pas de sprites tant que ce n'est pas décidé. Sons en Web Audio.
- **Couleurs des boutons** (dans `index.css`) : Creuser = or, Arrêter = rouge, Vendre = vert, Acheter = bleu, Améliorer = turquoise, Réparer = orange, Enchanter = violet, Prestige = rose, Ascenseur = cyan, Se déplacer = bois, Mettre dans le sac = kaki, Charbon = anthracite, Salaires et trésorerie = citron vert, Recruter = arc-en-ciel, le reste = gris.
- **Téléphone** : jouable au pouce, barre de boutons collée en bas sur petit écran, rien qui déborde en largeur.
- Changer le format de `EtatJeu` → augmenter `VERSION_ETAT` et écrire la migration (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#15-la-version-de-létat-et-les-migrations)).
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
- Le champ `version` de `package.json` (`0.0.0`) n'est pas utilisé. À ne pas confondre avec `VERSION_ETAT` (format de la sauvegarde, actuellement 17).
