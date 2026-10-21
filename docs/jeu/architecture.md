# Architecture du code

> Comment le projet Mega Digger (ex-Idle Miner) est organisé : stack, fichiers, flux des données, tests et façon de travailler.
> Rédigé d'après le code au 22/10, après la refonte de la **mine automatique**. Les règles du jeu sont dans [vue-d-ensemble.md](vue-d-ensemble.md) et [equilibrage.md](equilibrage.md), le village vu du ciel dans [village.md](village.md) et les fiches des bâtiments dans [../batiments/](../batiments/README.md). La sauvegarde et la partie en ligne sont détaillées dans [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## 1. Stack

| Sujet | Choix |
|---|---|
| Langage | TypeScript (~6.0), mode strict « bundler » (`tsconfig.app.json` : `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`...) |
| Interface | React 19 (`react`, `react-dom`), en `StrictMode` |
| Outil de build | Vite 8 avec `@vitejs/plugin-react` |
| Tests | Vitest 5 (`*.test.ts`, sans navigateur) |
| Lint | oxlint (plugins `react`, `typescript`, `oxc`), voir `.oxlintrc.json` |
| En ligne | Supabase (`@supabase/supabase-js`) : comptes, sauvegarde en ligne, classement. Seul « backend », pas de serveur à nous. Le jeu marche sans |
| Hébergement | Vercel (build = `npm run build`, dossier `dist/`) |
| Visuel | Le village vu du ciel : le décor et les bâtiments sont des images webp fournies par l'équipe (`public/images/`), posées sur la grille par une transformation CSS (`iso.ts`) ; les personnages sont des images découpées dans les planches de l'équipe (`sprites.ts`) ; les rails, le wagonnet, le rayon du générateur, la cabine de la mine, les chemins et les décorations sont dessinés en SVG dans le même style ; le bloc à cliquer et ses effets sont en CSS |
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
| `CLAUDE.md` | Règles du projet pour les assistants (stack, conventions, choix de design) |
| `CONTEXTE.md` | État d'avancement, équipe, infra (Vercel, Supabase), décisions et feuille de route ; à lire en début de session |
| `README.md` | Lancer le projet et travailler à deux (branches, PR) |
| `index.html` | Page unique : `<div id="root">`, liens PWA, `viewport-fit=cover` |
| `package.json` / `package-lock.json` | Dépendances et scripts npm |
| `vite.config.ts` | Plugin React et constante `__VERSION_JEU__` (commit + date du build, voir section 9) |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Options TypeScript |
| `.oxlintrc.json` | Configuration du lint |
| `archives/` | Le code mis de côté le 22/10 (voir 3.7) : **hors de `src/`, donc ni compilé ni testé** |

### 3.2 `src/jeu/` : la logique du jeu (TypeScript pur, sans React ni DOM)

| Fichier | Rôle |
|---|---|
| `donnees.ts` | Toutes les données et constantes : blocs, niveaux de la mine (`NIVEAUX_MINE`), coffre, pioches, sacs, ascenseur, mineurs (équipement, salaires, raretés, recruteur, manager), rails et wagonnet, générateur, foreuse, bâtiments, décorations, tenues |
| `mine.ts` | Les 5 niveaux de la mine : tirer un bloc selon le niveau (`tirerBloc`), les chances, la valeur moyenne d'un bloc |
| `mineur.ts` | Le type `EtatJeu` (et `Coffre`, `Foreuse`, `Generateur`, `Wagonnet`, `Employe`, `Manager`, `Statistiques`...), `VERSION_ETAT` (21), `creerPartie`, et les actions du joueur : sac et coffre, payer avec le sac puis le coffre (`disponible`, `payer`), le clic sur le bloc (`cliquerMine`), la mine toute seule (`avancerMine`), niveaux, coffre, ascenseur, prendre dans le coffre, vente, pioches et réparation, sac |
| `employes.ts` | Les mineurs employés : embauche, équipement, rôle (mineur ou pousseur), travail (creuser, monter, vider dans le coffre, descendre, marcher au village jusqu'à la forge ou au Personnel), salaires, licenciement, recruteur et rareté (niveau 3), manager et trésorerie (niveau 4) |
| `wagonnet.ts` | **Nouveau (22/10)** : le wagonnet sur la ligne de rails mine → marché : chargement, qui le pousse (joueur, mineur, électricité), vitesse, vente au marché, retour, ligne coupée |
| `generateur.ts` | **Nouveau (22/10)** : le générateur : rayon, rails et foreuse alimentés, redstone, puisage dans le coffre, améliorations |
| `foreuse.ts` | La foreuse (niveau 2) : charbon, forage, chariot, améliorations, recharge auto, bonus électrique |
| `village.ts` | Le village vu du ciel, géométrie seulement : types `Village`, `BatimentPose`, `DecorationPosee` ; grille de 60 × 60 cases, mine posée d'office au milieu, emprises et cases occupées, portes, chemin à pied (A étoile, avec cache), distance et temps à pied, ligne de rails mine → marché (`railsMineMarche`), raccords des rails |
| `batiments.ts` | Les actions du village : construire un bâtiment (débloqué par le niveau de mine), le déplacer ou le retourner, nouveautés du menu Bâtiments, poser / déplacer / enlever des rails et des chemins, acheter / déplacer / enlever des décorations |
| `tenues.ts` | Les tenues du joueur (Bazar) : acheter, porter, enlever |
| `notifications.ts` | Les bulles au-dessus des bâtiments posés (salaires, chariot plein, plus de charbon, plus de redstone, pioche cassée, sac plein, coffre plein ou à vider, nouveauté, achetable), triées par urgence |
| `succes.ts` | Les 20 succès et `verifierSucces` |
| `decouvertes.ts` | Le recruteur et le manager tout juste débloqués, montrés par une bulle ✨ au-dessus du Personnel jusqu'à ce qu'on passe devant |
| `objectifs.ts` | Les achats possibles, bâtiments où une amélioration est achetable, et le « prochain objectif » (dont « Construire : X », « Relier la mine au marché » et les étapes du générateur) |
| `revenu.ts` | Estimation de ce que la mine produit par seconde (indicateur « $/s ») |
| `statistiques.ts` | Calculs pour l'écran 📊 (argent par source, blocs les plus cassés) |
| `temps.ts` | `avancerTemps` : la mine, le générateur, la foreuse, les mineurs et le wagonnet, par morceaux d'une minute au plus |
| `aleatoire.ts` | Le type `Aleatoire`, `aleatoireNavigateur` (Math.random), `aleatoireAvecGraine` (mulberry32) et les aides `entierEntre`, `choisir`, `choisirPondere` |
| `sauvegarde.ts` | Sauvegarde `localStorage`, les 5 mondes, la vérification de version (les parties d'avant la v21 repartent de zéro, `partieAncienne`), export/import de tous les mondes |
| `compte.ts` | Règles du pseudo et du mot de passe, email fabriqué, choix de synchronisation à la connexion |
| `classement.ts` | Calcul du meilleur score (niveau de la mine, rangé dans `prestige`, et argent gagné) parmi les mondes |
| `bot.ts` | Bot de simulation qui joue une partie jusqu'au niveau 5 (`jouerPartie`), utilisé par les tests d'équilibrage |
| `*.test.ts` | Les tests (section 6) |

Retirés le 22/10 : `talents.ts`, `conditionsPrestige.ts` (vers `archives/prestige/`) et `enchantements.ts` (vers `archives/enchanteur/`) ; `convois.ts` (les chargements en brouette ou wagonnet de l'ancienne version) est **supprimé**, remplacé par `wagonnet.ts`.

### 3.3 `src/` : le pont avec React et les services du navigateur

| Fichier | Rôle |
|---|---|
| `main.tsx` | Point d'entrée : importe les CSS, monte `<App />` en `StrictMode`, enregistre le service worker |
| `App.tsx` | `App` (écran d'accueil ou jeu, compte toujours actif) et `Jeu` : assemble les composants, relie boutons et clavier aux actions, gère la construction (fantôme à poser, pinceau des rails et chemins, mode Modifier), choisit le panneau du bâtiment devant lequel se tient le joueur, et bloque le joueur pendant qu'il pousse le wagonnet |
| `usePartie.ts` | Hook central : garde l'`EtatJeu`, applique les actions, fait tourner l'horloge, gère le clic sur le bloc (`cliquer`), déclenche sons, animations (éclats, trouvailles) et notifications, rattrape l'absence, sauvegarde automatiquement |
| `useCompte.ts` | Hook du compte en ligne : session, synchronisation des mondes, envoi du score |
| `enLigne.ts` | Le seul fichier qui parle à Supabase (comptes, sauvegardes, classement) |
| `useJoueurVillage.ts` | Le hamster du joueur dans le village : position sur la grille, flèches du clavier (combinables), marche jusqu'à une case ou un bâtiment, saut ; affichage seulement (pas dans `EtatJeu`) |
| `useCompteur.ts` | Un nombre qui défile jusqu'à sa nouvelle valeur (compteur d'argent) |
| `evenements.ts` | Compare l'état avant/après une action pour en tirer des `Evenement` (casse, vente, achat, amélioration, pioche cassée, wagonnet) |
| `choix.ts` | Les quantités choisies avec les jauges (marché, coffre de la mine) et le lot qui en résulte |
| `sons.ts` | Bruitages Web Audio, réglage 🔊 gardé dans le `localStorage` |
| `ambiance.ts` | Musique et ambiances Web Audio (oiseaux et vent au village), réglage 🎵 |
| `installation.ts` | Enregistrement du service worker (production seulement) et hook `useInstallation` |
| `version.d.ts` | Déclare la constante globale `__VERSION_JEU__` |
| `index.css` | Mise en page générale, thème, bandeau, et « Les couleurs des boutons » |
| `blocs.css` | Les blocs dessinés en CSS (classes `.bloc-<id>`, `.roche-pierre`) |
| `effets.css` | Animations : éclats, minerais trouvés, ventes et pièces, compteur d'argent |
| `accueil.css` | L'écran d'accueil |
| `personnel.css` | Le stand Personnel : couleurs des raretés, salaires, manager, recruteur, animation d'embauche |
| `village.css` | Le village vu du ciel : carte, calques, bâtiments, personnages, wagonnet, rayon du générateur, bulles, menus, et le bloc à cliquer du panneau de la mine |
| `plein-ecran.css` | Le jeu en plein écran : la scène sur toute la fenêtre, l'interface posée par-dessus, version téléphone |
| `evenements.test.ts` | Tests (section 6) |

Supprimé le 22/10 : `travail.ts` (et son test), qui découpait le minage du joueur en tics : un clic casse maintenant un bloc d'un coup.

### 3.4 `src/composants/` : les composants React (aucune règle du jeu)

| Fichier | Rôle |
|---|---|
| `Accueil.tsx` | Écran d'accueil : logo, petit village vivant, 4 cartes « comment jouer », cartes des 5 mondes (niveau de mine, argent, mineurs, blocs ; prévient quand une partie d'avant la v21 repart de zéro), compte, installation, classement, version |
| `SceneAccueil.tsx` | Le décor de l'accueil : un village tout fait avec des hamsters qui vont et viennent et un wagonnet |
| `CarteCompte.tsx` | Carte du compte |
| `CarteClassement.tsx` | Classement (20 premiers), onglets « Prestige » (le niveau de la mine) / Argent |
| `CarteInstallation.tsx` | Carte « Installer l'application » |
| `Hud.tsx` | Bandeau du haut : argent et $/s, niveau de la mine et coffre, pioche, sac, mineurs, ⚡, boutons 🔊 et 🎵 |
| `ProchainObjectif.tsx` | Barre « prochain objectif » sous le bandeau |
| `VueVillage.tsx` | Le village vu du ciel : décor, bâtiments, rails, chemins, décorations, fantôme, joueur, mineurs dehors, manager et recruteur, wagonnet et son pousseur, rayon du générateur, cabine de la mine qui suit les mineurs, bulles ; caméra (glisser, pincer, molette, suit le joueur ou le wagonnet) et touchers |
| `iso.ts` | La projection isométrique, l'ordre d'affichage, le calage des images des bâtiments (`CALAGES`, `transformationSprite`), `pointSurSprite`, la taille du monde, où se tient un personnage devant un bâtiment |
| `DessinsVillage.tsx` | Les dessins SVG : le terrain, ce qui évolue sur la mine (`DessinEvolutionMine` : cabine, câbles, panneau du niveau), les rails, les chemins, les décorations, le wagonnet |
| `ForetVillage.tsx`, `arbres.ts` | La forêt autour de la clairière |
| `PlageVillage.tsx`, `plage.ts` | La plage et la mer |
| `ElementsVillage.tsx` | Un personnage posé sur la grille (`Perso`) et l'image d'un bâtiment (`ImageBatiment`), partagés par la carte et l'accueil |
| `fantome.ts` | Le type de ce qu'on est en train de poser ou de déplacer |
| `sprites.ts` | Les images des personnages : laquelle prendre (`spritePerso`, `choisirVue`), le point entre leurs pieds, leur taille |
| `Hamster.tsx` | L'ancien hamster en SVG, qui ne sert plus qu'à l'aperçu des tenues du Bazar |
| `MenuConstruction.tsx` | Les menus « 🏗️ Bâtiments » (prix, cadenas de niveau de mine, pastille Nouveau, rails) et « 🌸 Décorations » |
| `PanneauMine.tsx` | **Nouveau (22/10)** : le panneau de la mine : le bloc à cliquer (éclats, trouvailles), le coffre, le wagonnet, le niveau de la mine, la taille du coffre, l'ascenseur |
| `Panneaux.tsx` | Panneaux du Marché, du Forgeron (pioches), du Bazar, de la Foreuse et du Générateur, et panneau des succès |
| `PanneauEmployes.tsx` | Le stand Personnel : embauche, cartes des mineurs (rôle, équipement), salaires, licenciement, recruteur, manager et trésorerie |
| `PanneauTenues.tsx` | Les tenues du joueur au Bazar |
| `RevelationRecrue.tsx` | Animation de révélation de la rareté d'un nouveau mineur |
| `Jauges.tsx` | Jauges de quantité par objet (marché, coffre) |
| `Ascenseur.tsx` | La ligne de construction/amélioration de l'ascenseur des mineurs |
| `Amelioration.tsx` | Ligne d'amélioration commune (carrés de niveaux, cadenas, prix, bouton) |
| `PrixCout.tsx` | Affichage d'un prix (vert si on a, rouge s'il manque) |
| `Barre.tsx` | Barre de progression |
| `Gains.tsx` | Les « +X $ » (grosse vente, petit gain du wagonnet) |
| `Statistiques.tsx` | Fenêtre des statistiques |
| `Toasts.tsx` | Notifications |
| `Confirmation.tsx` | Fenêtre de confirmation dans le style du jeu |
| `Personnage.tsx`, `Icone.tsx` | Restes de l'ancienne version (le personnage de la vue en coupe, l'icône du stand Personnel) : plus importés nulle part |

Supprimés le 22/10 : `VueMonde.tsx` (la mine en coupe 2D) et `Inventaire.tsx` (le sac au fond de la mine, l'envoi par l'ascenseur). Archivés : `ArbrePrestige.tsx`, `CartePrestige.tsx`, `FetePrestige.tsx`, `Victoire.tsx` (`archives/prestige/`) et `PanneauEnchanter.tsx` (`archives/enchanteur/`).

### 3.5 `public/` : fichiers servis tels quels

| Fichier | Rôle |
|---|---|
| `manifest.webmanifest` | Manifeste PWA : nom « Mega Digger », `standalone`, portrait, couleurs `#15151a`, icônes |
| `sw.js` | Service worker : cache `idle-miner-v8` (les images du village sont rangées dès l'installation) ; page réseau d'abord, `/assets/` cache d'abord, autres fichiers cache puis mise à jour ; ne touche jamais aux requêtes vers Supabase |
| `favicon.svg`, `icones/*.png` | Icônes de l'onglet et de l'application |
| `images/village/arbres/arbre01.webp` … `arbre12.webp` | Les 12 arbres de la forêt |
| `images/batiments/*.webp` | Les images des bâtiments (bazar, employes, foreuse, forgeron, generateur, marche, mine avec `mine-cabine` et `mine-devant`), des rails (carte du menu), et de l'enchanteur et de l'arbre de prestige (plus utilisées, gardées pour plus tard) |
| `images/personnages/*.webp`, `images/personnages/sprites/*.webp` | Les portraits (accueil, Personnel) et les images des personnages |

### 3.6 `supabase/` : la base de données

| Fichier | Rôle |
|---|---|
| `schema.sql` | Table `sauvegardes` (tous les mondes d'un joueur), droits, règles RLS, trigger de date |
| `classement.sql` | Table `classement`, index, droits, règles RLS (pseudo du compte obligatoire), trigger qui garde le meilleur score. À lancer après `schema.sql` |

Ces scripts se collent à la main dans le SQL Editor de Supabase. Ils n'ont pas changé le 22/10 (le niveau de la mine passe dans la colonne `prestige`).

### 3.7 `archives/` : le code mis de côté (22/10)

| Dossier | Contenu |
|---|---|
| `archives/prestige/` | L'arbre de prestige : `ArbrePrestige.tsx`, `CartePrestige.tsx`, `FetePrestige.tsx`, `Victoire.tsx`, `talents.ts`, `conditionsPrestige.ts`, leurs tests, et la fiche du bâtiment (`fiche-prestige.md`) |
| `archives/enchanteur/` | `PanneauEnchanter.tsx`, `enchantements.ts` et la fiche du bâtiment (`fiche-enchanteur.md`) |

Voir `archives/README.md`. Ces fichiers dépendaient de l'ancien `mineur.ts` : pour les remettre, il faudra les adapter. L'ancienne version complète reste dans l'historique git (avant le 22/10).

### 3.8 `docs/`

| Fichier | Rôle |
|---|---|
| `idle_miner_v1.md` | Spec de la v1 (notebook Python) : une source d'idées historique |
| `batiments/README.md` | Index des fiches des bâtiments du village |
| `batiments/mine.md`, `marche.md`, `forgeron.md`, `bazar.md`, `personnel.md`, `foreuse.md`, `generateur.md` | Une fiche par bâtiment (à mettre à jour quand on le modifie) |
| `jeu/vue-d-ensemble.md` | Le point d'entrée de la doc : concept, boucle, progression, glossaire, sommaire |
| `jeu/village.md` | Le village vu du ciel |
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

Une action du jeu (dans `src/jeu/`) **modifie l'état qu'on lui donne** et **renvoie la liste des messages** à afficher au joueur (vide si rien à dire). Exemples : `cliquerMine(etat, aleatoire)`, `vendre(etat)`, `pousserWagonnet(etat)`, `remplirGenerateur(etat, 10)`. Les fonctions qui ne font que lire l'état (`capaciteCoffre`, `railsAlimentes`, `revenuParSeconde`...) ne le modifient pas.

Côté React, le type est `Action = (etat: EtatJeu) => string[]` (`usePartie.ts`), et les composants appellent `jouer(action)`, par exemple `jouer(vendre)` ou `jouer((e) => remplirForeuse(e, 10))`.

### 4.3 `jouer` dans `usePartie.ts`

1. Copie profonde de l'état actuel (`structuredClone`) : React reçoit toujours un nouvel objet.
2. L'action s'applique à la copie et renvoie ses messages.
3. `verifierSucces(copie)` débloque les nouveaux succès.
4. Les messages et succès deviennent des notifications (toasts) : 5 au plus, sans doublon, 3,5 s chacune.
5. `evenementsEntre(ancien, copie)` (`src/evenements.ts`) déduit ce qui s'est passé, pour jouer les sons (`sons.ts`) et les animations (éclats et trouvailles du bloc, gain « +X $ », grosse animation de vente).
6. Le nouvel état est rangé (`setEtat` et une référence `etatRef` toujours à jour pour les minuteurs).

La sauvegarde dans le `localStorage` se fait au plus une fois par seconde, et en quittant la page (`pagehide`).

### 4.4 La boucle de temps

- L'horloge (`useEffect` de `usePartie.ts`) tourne **tout le temps** : toutes les 50 ms, ou à chaque image (`requestAnimationFrame`) quand le joueur pousse le wagonnet. Chaque tic compte au plus 1 s.
- À chaque tic : `jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))`, qui enchaîne `avancerMine`, `avancerGenerateur`, `avancerForeuse`, `avancerEmployes` et `avancerWagonnet` (par morceaux de 60 s au plus).
- Le clic sur le bloc (`cliquer`) joue le son du coup puis `jouer((e) => cliquerMine(e, aleatoireNavigateur))`.
- À l'ouverture d'un monde, le temps d'absence (au plus 8 h) est rattrapé en un appel à `avancerTemps` (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#18-retour-au-jeu-après-une-absence)).

### 4.5 Les écrans

- `App` affiche l'accueil tant qu'aucun monde n'est choisi, puis `<Jeu key={monde.id}>`. Le hook `useCompte` vit dans `App`, il continue donc de synchroniser pendant la partie ; quitter un monde déclenche un envoi immédiat.
- `Jeu` n'a plus qu'**un mode** : le village vu du ciel (bandeau, prochain objectif, `VueVillage`, panneau du bâtiment où l'on est, barre du bas, menus, fenêtres succès et statistiques). Plus de vue en coupe ni de transition d'entrée dans la mine.
- Pendant que le joueur pousse le wagonnet (`joueurPousse`), il ne peut ni marcher ni ouvrir de panneau, et le bouton Mine est grisé.

## 5. L'aléatoire injectable

- Tout tirage au hasard passe par une fonction de type `Aleatoire = () => number` (entre 0 inclus et 1 exclu), donnée en paramètre (`creerPartie(aleatoire)`, `cliquerMine(etat, aleatoire)`, `avancerTemps(etat, s, aleatoire)`, `embaucher(etat, aleatoire)`...).
- En jeu : `aleatoireNavigateur` (`Math.random`).
- Dans les tests (et dans le bot) : `aleatoireAvecGraine(graine)` (générateur mulberry32) donne toujours la même suite de nombres.
- La logique de `src/jeu/` n'appelle jamais `Math.random` directement.

## 6. Les tests

Lancés par `npm test` (Vitest), sans navigateur. Le `localStorage` est remplacé par un faux stockage en mémoire. Au 22/10 : **17 fichiers, 120 tests**.

| Fichier | Ce qu'il vérifie |
|---|---|
| `src/jeu/bot.test.ts` | **Bot d'équilibrage** : 10 parties à graines fixes (1 à 10). Toujours le niveau 5 ; niveau 2 en 5 à 20 min et niveau 5 en 1 h à 2 h 30 (médianes) ; chaque niveau plus long que le précédent ; rails en moins de 5 min et électriques en moins de 40 min ; au moins 4 mineurs, plus de 100 voyages de wagonnet, plus de blocs des mineurs que des clics ; plus de 3 allers-retours à pied au début |
| `src/jeu/mineur.test.ts` | Début de partie ; clic (coffre, usure, doublement jamais pour la pierre, bloc suivant du bon niveau, pioche cassée, coffre plein) ; la mine toute seule ; prendre dans le coffre ; vente ; payer avec le sac puis le coffre ; sac ; niveau 2 ; coffre ; ascenseur ; réparation ; pioches |
| `src/jeu/mine.test.ts` | Les blocs de chaque niveau, chances à 100 %, valeur moyenne, débit |
| `src/jeu/employes.test.ts` | Nombre par niveau, prix, travail (creuser, remonter, vider), ascenseur, coffre plein, équipement, pousseur, licenciement, salaires, recruteur et rareté, manager |
| `src/jeu/wagonnet.test.ts` | Ligne complète, joueur qui pousse, objets gardés, pousseur, électrique, ligne coupée |
| `src/jeu/generateur.test.ts` | Rayon, rails électriques, éteint, ligne hors du rayon, foreuse, amélioration et puisage |
| `src/jeu/foreuse.test.ts` | Charbon (sac puis coffre), chariot, vente, électricité, améliorations et recharge auto |
| `src/jeu/village.test.ts` | Mine au milieu, prix et déblocage des bâtiments, chevauchement, déplacer et retourner, chemins à pied, ouverture d'un bâtiment de n'importe quel côté, décorations, rails (3 fer), mineurs au village (forge, Personnel), bulles, tenues |
| `src/jeu/objectifs.test.ts` | Prochain objectif (marché, forgeron, rails, achetable, générateur vide) |
| `src/jeu/revenu.test.ts` | La mine toute seule, un mineur rentable, un pousseur ne creuse pas |
| `src/jeu/sauvegarde.test.ts` | Relecture exacte, `null` si absente ou abîmée, partie d'avant la v21 qui repart de zéro, temps depuis la sauvegarde, mondes, export/import |
| `src/jeu/compte.test.ts` | Pseudo, mot de passe, email, choix de synchronisation |
| `src/jeu/classement.test.ts` | Meilleur niveau de mine et plus d'argent gagné parmi les mondes |
| `src/jeu/decouvertes.test.ts` | Recruteur et manager à découvrir |
| `src/jeu/donnees.test.ts` | 7 blocs, pioches de plus en plus fortes, 5 niveaux de mine, générateur, équipement des mineurs en argent |
| `src/jeu/statistiques.test.ts` | Argent par source, blocs les plus cassés |
| `src/evenements.test.ts` | Bloc cassé, diamant doublé, vente, pioche qui casse |

Il n'y a pas de tests des composants React ni de `enLigne.ts` / `useCompte.ts` (réseau) : leur logique testable est dans `src/jeu/compte.ts` et `src/jeu/classement.ts`. Les tests archivés (`talents.test.ts`, `conditionsPrestige.test.ts`) ne tournent plus.

## 7. Conventions de code

- **Tout en français** : interface, noms de variables, de fonctions et de fichiers, commentaires. Seuls les mots-clés et API de TypeScript/React restent en anglais.
- Code lisible et commenté pour des débutants, noms explicites, pas d'astuces obscures.
- **Séparation stricte** : les règles du jeu sont dans `src/jeu/` (aucun import de React ni du DOM). Les composants lisent l'état et appellent les actions, sans règle du jeu. Ce qui n'est que de l'affichage (marche du hamster, caméra, projection isométrique, jauges, événements sonores, hauteur de la cabine) reste côté `src/`.
- Aléatoire injectable (section 5), stockage injectable (`Stockage` dans `sauvegarde.ts`).
- Chaque accès au `localStorage` est protégé par `try/catch`.
- **Couleurs des boutons** (dans `index.css`) : voir [interface.md § 14](interface.md#14-les-couleurs-des-boutons).
- **Téléphone** : jouable au pouce, boutons en bas, rien qui déborde en largeur.
- Changer le format de `EtatJeu` → augmenter `VERSION_ETAT` et décider : écrire une migration dans `sauvegarde.ts`, ou laisser les anciennes parties repartir de zéro comme le 22/10.
- Modifier un bâtiment → mettre à jour sa fiche dans `docs/batiments/`. Étape importante → mettre à jour `CONTEXTE.md`.
- Toute nouvelle table Supabase a ses règles RLS ; jamais de clé `service_role` / secrète dans le code.
- Garder le bot de simulation et ses repères d'équilibrage (section 6).

## 8. Workflow Git, PR et Vercel

- Code sur GitHub, à deux développeurs. Branche principale : `main`. **Jamais de push direct sur `main`** : une branche par modification, puis une Pull Request.
- Avant la PR : `npm test`, `npm run lint` et `npm run build` au vert.
- Règle décidée le 19/10 : à chaque modification demandée, une fois tout au vert, on crée la PR **et on la fusionne** dans `main`, pour que la nouvelle version soit en ligne tout de suite.
- Vercel : chaque push sur `main` déploie la production, et chaque PR a son lien de preview. Vercel lance `npm run build`.
- Les scripts SQL de `supabase/` ne sont pas déployés automatiquement.

## 9. La version affichée

- `vite.config.ts` définit au moment du build la constante globale `__VERSION_JEU__` = `"<commit> · <date du build>"` (le commit : `VERCEL_GIT_COMMIT_SHA` sur Vercel, sinon `git rev-parse --short HEAD`, sinon `local` ; la date à l'heure de Paris).
- Elle est affichée en petit tout en bas de l'écran d'accueil : ça permet de vérifier que Vercel a bien mis en ligne la dernière version.
- À ne pas confondre avec `VERSION_ETAT` (format de la sauvegarde, actuellement 21).
