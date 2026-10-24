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
| Visuel | Le village vu du ciel : le décor et les bâtiments sont des images webp fournies par l'équipe (`public/images/`), posées sur la grille par une transformation CSS (`iso.ts`) ; les personnages sont des images découpées dans les planches de l'équipe (`sprites.ts`) ; les rails sont un talus à plat et une voie en vraie 3D, rendus par des scripts Python (`outils/rails/`) ; les wagonnets sont un petit modèle 3D projeté en SVG à chaque image (`Wagonnet3D.tsx`, 26/10) ; le rayon du générateur, la cabine de la mine, les chemins, les rochers et les dessins de décor (plage, accueil) sont dessinés en SVG dans le même style ; le bloc à cliquer et ses effets sont en CSS |
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
| `donnees.ts` | Toutes les données et constantes : blocs, niveaux de la mine (`NIVEAUX_MINE`), coffre, pioches, bonus de combo (`BONUS_COMBO`, 30/10), sacs, ascenseur, mineurs (équipement, salaires, raretés, recruteur, manager), rails, trajets des wagonnets (`LIAISONS`, `BATIMENTS_DES_RAILS`, réserves de la foreuse et du générateur), générateur, foreuse, bâtiments (`LISTE_BATIMENTS` : l'ordre du menu, celui des déblocages depuis le 29/10), le niveau du joueur (29/10 : `XP_PAR`, `xpPourPasser`, `NIVEAU_JOUEUR_MAX`, `NIVEAU_JOUEUR_POUR`), et les dessins du décor (`DECORATIONS` : seulement nom et taille, pour la plage et l'accueil) |
| `mine.ts` | Les 5 niveaux de la mine : tirer un bloc selon le niveau (`tirerBloc`), les chances, la valeur moyenne d'un bloc |
| `mineur.ts` | Le type `EtatJeu` (et `Coffre`, `Foreuse`, `Generateur`, `Trajet`, `Employe`, `Manager`, `Statistiques`...), `VERSION_ETAT` (25 depuis le 30/10 : ascenseur dès le début, champ `bonus` ; 24 le 29/10 : `xp` et `recordsXp`), `creerPartie`, et les actions du joueur : sac et coffre, payer avec le sac puis le coffre (`disponible`, `payer`), le clic sur le bloc (`cliquerMine`), les bonus de combo (`activerBonusCombo`, `bonusActif`, `secondesBonus`, 30/10), la mine toute seule (`avancerMine`), niveaux, coffre, ascenseur, prendre dans le coffre, vente, pioches et réparation, sac |
| `employes.ts` | Les employés : embauche des mineurs, et (26/10) des pousseurs pour un trajet (`embaucherPousseur`, `peutEmbaucherPousseur`, `changerTrajet`, leur quai `maisonDe`), équipement, travail (creuser, monter, vider dans le coffre, descendre, marcher au village jusqu'à la forge, au Personnel ou au quai de son trajet ; partir l'un après l'autre à 0,7 s d'écart, `ECART_DEPART`, 27/10), salaires, licenciement, manager (niveau 3, il paie avec l’argent du joueur), recruteur et rareté (niveau 4) |
| `wagonnet.ts` | **Refait le 24/10** : les trajets des wagonnets (Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché), un wagonnet par trajet : créer et arrêter un trajet, ce qu'il emporte, qui le pousse (joueur, le pousseur de ce trajet, électricité : `trajetElectrique`, `railsAlimentes`), vitesse, livraison, retour, ligne coupée, taille des wagonnets |
| `generateur.ts` | **Nouveau (22/10)** : le générateur : rayon (`casesDansLeRayon`), foreuse alimentée, redstone et sa réserve (`reserveMaxGenerateur`, `livrerRedstone`), améliorations |
| `foreuse.ts` | La foreuse (niveau 2) : charbon, forage, chariot, améliorations, bonus électrique (23/10 : plus de recharge auto) |
| `village.ts` | Le village vu du ciel, géométrie seulement : types `Village`, `BatimentPose` ; grille de 60 × 60 cases, mine posée d'office au milieu, emprises et cases occupées, cases bloquées (seulement les bâtiments), portes, chemin à pied (A étoile, avec cache), distance et temps à pied, ligne de rails entre deux bâtiments (`railsEntre`, `railsMineMarche`), raccords des rails (`raccordsRail`), pas de boucle (`feraitUneBoucle`), forme d'une case de rails (`formeDuRail`), bords de la voie interdits aux bâtiments (`bordsDeVoie`, `voieDegagee`), virages doux sur trois cases (`viragesDoux`, jamais avec un bout de ligne pour bras) |
| `batiments.ts` | Les actions du village : construire un bâtiment (débloqué par le niveau de mine et, depuis le 29/10, le niveau du joueur ; les rails aussi, `railsDebloques`), le déplacer ou le retourner, nouveautés du menu Bâtiments, poser / déplacer / enlever des rails (jamais en boucle) et des chemins ; depuis le 30/10, enlever un rail ou un chemin le rembourse (`retirerSol`) et `raisonSolImpossible` dit pourquoi on ne peut pas poser (plus de fer, boucle, bords) |
| `notifications.ts` | Les bulles au-dessus des bâtiments posés (salaires, rails coupés, pousseurs sans trajet, chariot plein, plus de charbon, plus de redstone, pioche cassée, sac plein, coffre plein ou à vider, nouveauté, achetable : seulement pendant le tutoriel depuis le 30/10), triées par urgence |
| `succes.ts` | Les 20 succès et `verifierSucces` |
| `decouvertes.ts` | Le recruteur et le manager tout juste débloqués, montrés par une bulle ✨ au-dessus du Personnel jusqu'à ce qu'on passe devant |
| `objectifs.ts` | Les achats possibles et les bâtiments où une amélioration est achetable (le « prochain objectif » est retiré le 27/10, remplacé par les missions) |
| `niveaux.ts` | **Nouveau (29/10)** : le niveau du joueur. L'XP comptée sur les « records » des compteurs de la partie (`mettreAJourXp`, appelée par `avancerTemps` : retirer puis reposer ne redonne rien), le niveau à partir de l'XP (`niveauDeXp`, `progressionNiveau`), ce qui est débloqué (`debloque`, `niveauRequis`, `verrou` pour le texte « au niveau N », `railsDebloques`), ce qu'apporte un niveau (`deblocagesDuNiveau`, `prochainDeblocage`), et l'XP donnée aux vieilles parties (`donnerXpAVieillePartie`). Voir [niveaux.md](niveaux.md) |
| `partieDeTest.ts` | **Nouveau (29/10)**, pour les tests : une nouvelle partie où le joueur est déjà au niveau maximum (`partieDeTest`), pour tester une règle sans les cadenas |
| `missions.ts` | **Nouveau (27/10)** : `missions(etat, avant)` : une à trois missions (urgences, premiers pas, prochain bâtiment, automatisation, améliorations les plus proches, et depuis le 29/10 le prochain niveau du joueur « ⭐ Niveau N : … ») avec icône, texte, progression, bâtiment où aller ; depuis le 30/10, `avant` (les missions affichées juste avant) garde chaque mission à sa place jusqu'à ce qu'elle soit faite, seules les urgences (`ID_URGENCES`) passent devant ; testé dans `objectifs.test.ts` et `nouveautes30.test.ts` |
| `revenu.ts` | Estimation de ce que la mine produit par seconde (indicateur « $/s ») |
| `absence.ts` | **Nouveau (30/10)** : ce qui s'est passé pendant que le jeu était fermé : `photoPartie` (la partie avant de rattraper le temps) et `resumerAbsence` (le résumé `ResumeAbsence` : blocs des mineurs, de la mine et de la foreuse, coffre, argent, voyages, mineurs sans salaire), affiché par `FenetreAbsence.tsx` |
| `production.ts` | **Nouveau (27/10)** : `production(etat)`, pour le tableau du panneau de la mine : blocs par seconde de la mine (0 si le coffre est plein) et de chaque mineur (`blocsParSecondeEmploye`, 0 s'il attend son salaire), total, dollars par minute (`valeurMoyenneBloc`) |
| `statistiques.ts` | Calculs pour l'écran 📊 (argent par source, blocs les plus cassés) |
| `temps.ts` | `avancerTemps` : la mine, le générateur, la foreuse, les mineurs et les wagonnets, par morceaux d'une minute au plus ; puis l'XP du joueur (`mettreAJourXp`, 29/10), avec un message « 🎉 Niveau N ! » à chaque niveau gagné |
| `aleatoire.ts` | Le type `Aleatoire`, `aleatoireNavigateur` (Math.random), `aleatoireAvecGraine` (mulberry32) et les aides `entierEntre`, `choisir`, `choisirPondere` |
| `sauvegarde.ts` | Sauvegarde `localStorage`, les 5 mondes, la vérification de version (une partie v21 est convertie en v22 par `convertirVersion21`, puis en v23 par `convertirVersion22`, puis en v24 par `convertirVersion23` (29/10 : elle reçoit l'XP du niveau qu'il faut pour ce qu'elle possède), puis en v25 par `convertirVersion24` (30/10 : elle reçoit l'ascenseur de niveau 1) ; le 27/10, `charger` enlève les tenues, les décorations et le succès « Paysagiste » des anciennes parties ; les parties d'avant la v21 repartent de zéro, `partieAncienne`), export/import de tous les mondes |
| `compte.ts` | Règles du pseudo et du mot de passe, email fabriqué, choix de synchronisation à la connexion |
| `classement.ts` | Calcul du meilleur score (niveau de la mine, rangé dans `prestige`, et argent gagné) parmi les mondes |
| `bot.ts` | Bot de simulation qui joue une partie jusqu'au niveau 5 (`jouerPartie`, 12 h de jeu au plus depuis le 30/10), utilisé par les tests d'équilibrage ; depuis le 29/10, il gagne de l'XP comme un joueur, attend ses niveaux pour débloquer, et note quand il arrive à chaque niveau du joueur (`tempsNiveauxJoueur`) |
| `*.test.ts` | Les tests (section 6) |

Supprimé le 27/10 : `tenues.ts` (les tenues du Bazar). Retirés le 22/10 : `talents.ts`, `conditionsPrestige.ts` (vers `archives/prestige/`) et `enchantements.ts` (vers `archives/enchanteur/`) ; `convois.ts` (les chargements en brouette ou wagonnet de l'ancienne version) est **supprimé**, remplacé par `wagonnet.ts`.

### 3.3 `src/` : le pont avec React et les services du navigateur

| Fichier | Rôle |
|---|---|
| `main.tsx` | Point d'entrée : importe les CSS, monte `<App />` en `StrictMode`, enregistre le service worker |
| `App.tsx` | `App` (écran d'accueil ou jeu, compte toujours actif) et `Jeu` : assemble les composants, relie boutons et clavier aux actions, gère la construction (fantôme à poser, pinceau des rails et chemins, mode Modifier), choisit le panneau du bâtiment devant lequel se tient le joueur, bloque le joueur pendant qu'il pousse un wagonnet, et garde le trajet regardé à l'embauche d'un pousseur (`apercuTrajet`, passé à la carte). Depuis le 30/10 : le rail touché (`railTouche`) ouvre `FenetreTrajet` ou `FenetreRail` ; quand des rails relient deux bâtiments, la pose s'arrête et la fenêtre du trajet s'ouvre (`trajetsAProposer`) ; quand on ne peut pas poser, une notification dit pourquoi (`raisonSolImpossible`) ; au tutoriel, le panneau de la mine se ferme dès qu'on peut payer le forgeron ; panneaux plus larges pour la mine, le Personnel, la foreuse et le générateur (`PANNEAUX_LARGES`, classe `panneau-large`) ; la fenêtre du retour (`FenetreAbsence`) |
| `usePartie.ts` | Hook central : garde l'`EtatJeu`, applique les actions, fait tourner l'horloge, gère le clic sur le bloc (`cliquer`), déclenche sons, animations (éclats, trouvailles, ventes des wagonnets au marché : `ventesMarche`) et notifications, rattrape l'absence (et, depuis le 30/10, garde son résumé pour la fenêtre du retour : `resumeAbsence`, `recupererAbsence`), sauvegarde automatiquement |
| `useCompte.ts` | Hook du compte en ligne : session, synchronisation des mondes, envoi du score |
| `enLigne.ts` | Le seul fichier qui parle à Supabase (comptes, sauvegardes, classement) |
| `useJoueurVillage.ts` | Le hamster du joueur dans le village : position sur la grille, flèches du clavier (combinables), marche jusqu'à une case ou un bâtiment, saut ; affichage seulement (pas dans `EtatJeu`) |
| `useCompteur.ts` | Un nombre qui défile jusqu'à sa nouvelle valeur (compteur d'argent) |
| `evenements.ts` | Compare l'état avant/après une action pour en tirer des `Evenement` (casse, vente, achat, amélioration, pioche cassée, wagonnet) |
| `nombres.ts` | **Nouveau (27/10)** : `nombreAbrege` (« 950 », « 1,2 k », « 12 k », « 3,2 M »), pour les petits badges et la jauge du coffre au-dessus de la mine |
| `choix.ts` | Les quantités choisies avec les jauges (marché, coffre de la mine) et le lot qui en résulte |
| `sons.ts` | Bruitages Web Audio (dont `combo` et `venteMarche` le 27/10), réglage 🔊 gardé dans le `localStorage` |
| `ambiance.ts` | Musique et ambiances Web Audio (oiseaux et vent au village), réglage 🎵 |
| `installation.ts` | Enregistrement du service worker (production seulement) et hook `useInstallation` |
| `version.d.ts` | Déclare la constante globale `__VERSION_JEU__` |
| `index.css` | Mise en page générale, thème, bandeau, et « Les couleurs des boutons » |
| `blocs.css` | Les blocs dessinés en CSS (classes `.bloc-<id>`, `.roche-pierre`) |
| `effets.css` | Animations : éclats, minerais trouvés, ventes et pièces, compteur d'argent |
| `accueil.css` | L'écran d'accueil |
| `personnel.css` | Le stand Personnel : couleurs des raretés, salaires, manager, recruteur, animation d'embauche |
| `village.css` | Le village vu du ciel : carte, calques, bâtiments, personnages, wagonnet, rayon du générateur, bulles, jauge du coffre, ventes au marché, menus, et le bloc à cliquer (combo) et le tableau de production du panneau de la mine |
| `plein-ecran.css` | Le jeu en plein écran : la scène sur toute la fenêtre, l'interface posée par-dessus, version téléphone |
| `evenements.test.ts` | Tests (section 6) |

Supprimé le 22/10 : `travail.ts` (et son test), qui découpait le minage du joueur en tics : un clic casse maintenant un bloc d'un coup.

### 3.4 `src/composants/` : les composants React (aucune règle du jeu)

| Fichier | Rôle |
|---|---|
| `Accueil.tsx` | Écran d'accueil en plein écran (23/10) : le village vivant en fond, à gauche Jouer et les mondes (une ligne chacun), au milieu les 4 étapes, à droite le compte et le classement ; sur téléphone, des onglets |
| `SceneAccueil.tsx` | Le décor de l'accueil : un village tout fait (avec ses propres décorations, `DECORATIONS_SCENE`) avec des hamsters qui vont et viennent et un wagonnet (le même en 3D que dans le jeu) |
| `CarteCompte.tsx` | Carte du compte |
| `CarteClassement.tsx` | Classement à l'argent gagné (23/10) : podium, 50 premiers, ta place et qui dépasser |
| `CarteInstallation.tsx` | Carte « Installer l'application » |
| `Hud.tsx` | Bandeau en haut à gauche (27/10), au-dessus des petits boutons : le niveau du joueur (29/10 : ⭐ et son badge violet, jauge d'XP, bulle d'aide avec ce que débloque le prochain niveau), argent et $/s, niveau de la mine et coffre, pioche (30/10 : jauge du vert au rouge, bandeau en alerte sous 15 %), sac, mineurs, ⚡, boutons 🔊 et 🎵 |
| `Missions.tsx` | **Nouveau (27/10)** : les missions en haut à droite (la première en grand, barre de progression, bordure verte quand c'est faisable, ✔ barré et son de succès quand c'est accompli) ; remplace `ProchainObjectif.tsx` |
| `OngletsPanneau.tsx` | **Nouveau (27/10)** : la barre d'onglets des panneaux (Personnel : Employés / Recruter / Chefs ; Mine : Creuser / Améliorer / Wagons / Prod. depuis le 30/10), avec de petites pastilles |
| `VueVillage.tsx` | Le village vu du ciel : décor, bâtiments, rails, chemins, fantôme, joueur, mineurs dehors, manager et recruteur, wagonnets et leurs pousseurs, pousseurs au quai de leur trajet, trajet en surbrillance (`trajetEnSurbrillance`, 26/10), rayon du générateur, grille de construction, cabine de la mine qui suit les mineurs (avec les mineurs dedans, 27/10), mineurs qui attendent leur tour devant le Personnel, bulles, jauge du coffre au-dessus de la mine (avec « 👷 *n* » : les mineurs au fond) et « +X $ » des ventes au marché (27/10) ; caméra (glisser, pincer, molette ; zoom plus fort le 27/10, puis plus doux le 29/10 : environ 15 % par cran, cran plafonné à `CRAN_MAX`), suit le joueur ou le wagonnet qu'il pousse ; elle ne se décale plus quand un panneau s'ouvre, 27/10 ; zoom fluide le 30/10 : pendant un geste, la caméra visée est gardée hors de React, `gesteCameraRef` et `viser`, puis recopiée dans l'état à la fin ; pincement du pavé tactile, Ctrl + molette, 5 fois plus fort) et touchers (29/10 : `batimentVise` cherche ce qui est vraiment sous le doigt avec `elementsFromPoint`, car la carte capture le pointeur ; un clic sur le toit ou juste à côté d'un bâtiment l'ouvre, et le bâtiment survolé à la souris est entouré au sol, `.emprise-survol`) ; met en pause les animations de la plage quand elle n'est pas à l'écran (`plage-cachee`). Depuis le 30/10 : l'aperçu du rail ou du chemin qui suit la souris pendant la pose (vert si on peut le poser, rouge sinon : `typePinceau`, `peutPeindre`), l'animation d'embauche (gerbe d'étincelles au Personnel, halo doré et bulle « ✨ Nouveau ! » sur le nouveau mineur), et la caisse pleine qui reste dans la cabine pendant qu'un mineur la vide |
| `iso.ts` | La projection isométrique, l'ordre d'affichage, le calage des images des bâtiments (`CALAGES`, `transformationSprite`), l'image d'un bâtiment retourné qui a des écritures (`IMAGES_BATIMENTS_MIROIR`, `imageBatiment`, 27/10), `pointSurSprite`, la taille du monde, où se tient un personnage devant un bâtiment |
| `DessinsVillage.tsx` | Les dessins SVG : le terrain, ce qui évolue sur la mine (`DessinEvolutionMine` : cabine, câbles, panneau du niveau, mineurs dans la cabine avec `passagers`), la grille de construction (`GrilleConstruction`), les rails (`RailsDuVillage` : talus puis voie 3D ; `codeDeVoie` choisit l'image de chaque case, butoirs compris), les chemins, les dessins des décorations (`DessinDecoration`, pour la plage et l'accueil). (Le vieux `DessinWagonnet` est retiré le 26/10.) |
| `ImageFigee.tsx` | Fige un dessin SVG qui ne change jamais (le terrain, le sable de la plage) en `<img>` : le navigateur ne redessine plus ses flous à chaque image (26/10, le jeu ramait). |
| `ForetVillage.tsx`, `arbres.ts` | La forêt autour de la clairière |
| `PlageVillage.tsx`, `plage.ts` | La plage et la mer (sable, galets, algues, crabes...) ; `BOITES_PLAGE` (27/10) : les rectangles où la plage bouge, pour savoir si elle est à l'écran |
| `Rochers.tsx` | **Nouveau (24/10)** : les rochers en relief (`Rocher`, `TasDeRochers`), pour le dessin du rocher, la mer, le feu de camp et la plage |
| `ElementsVillage.tsx` | Un personnage posé sur la grille (`Perso`) et l'image d'un bâtiment (`ImageBatiment`), partagés par la carte et l'accueil |
| `fantome.ts` | Le type de ce qu'on est en train de poser ou de déplacer |
| `sprites.ts` | Les images des personnages : laquelle prendre (`spritePerso`, `choisirVue`), le point entre leurs pieds, leur taille |
| `MenuConstruction.tsx` | Le menu « 🏗️ Bâtiments » (prix, cadenas de niveau du joueur « 🔒 Niveau N » ou de niveau de mine, rails sous cadenas jusqu'au niveau 3, pastille Nouveau, bord doré si on peut le poser tout de suite, rails, chemin de pavés) |
| `PanneauMine.tsx` | **Nouveau (22/10)** : le panneau de la mine : quatre onglets depuis le 30/10 (⛏️ Creuser, ⬆️ Améliorer, 🚃 Wagons, 📊 Prod.), le titre du niveau, le bloc à cliquer (éclats, trouvailles, combo depuis le 27/10, bonus de combo au-dessus du bloc depuis le 30/10), le raccourci « ⬆️ Agrandir le coffre, l'ascenseur, descendre la mine », le tableau de production (`TableauProduction`, 27/10), le coffre, les trajets qui partent de la mine, le niveau de la mine, la taille du coffre, l'ascenseur |
| `Panneaux.tsx` | Panneaux du Marché (sac vide : un message et la liste des prix, 30/10), du Forgeron (pioche en main, prochaine, « Autres pioches »), du Bazar, de la Foreuse et du Générateur, et panneau des succès |
| `PanneauEmployes.tsx` | Le stand Personnel, en trois onglets (Employés, Recruter, Chefs ; 23/10 : chaque employé a sa carte complète dans l'onglet Employés, plus de fiche à ouvrir) : embauche d'un mineur, embauche d'un pousseur (`EmbauchePousseur` : départ, arrivée, aperçu du trajet sur la carte), listes Mineurs et Pousseurs (équipement, trajet d'un pousseur), salaires, licenciement, recruteur, manager |
| `RevelationRecrue.tsx` | Animation de révélation de la rareté d'un nouveau mineur |
| `Jauges.tsx` | Jauges de quantité par objet (marché, coffre) |
| `Ascenseur.tsx` | La ligne de construction/amélioration de l'ascenseur des mineurs |
| `Amelioration.tsx` | Ligne d'amélioration commune (carrés de niveaux, cadenas, prix, bouton) |
| `PrixCout.tsx` | Affichage d'un prix (vert si on a, rouge s'il manque) |
| `Barre.tsx` | Barre de progression |
| `Gains.tsx` | Les « +X $ » (grosse vente, petit gain du wagonnet) |
| `Statistiques.tsx` | Fenêtre des statistiques |
| `Toasts.tsx` | Notifications |
| `Confirmation.tsx` | Fenêtre de confirmation dans le style du jeu (`classe="voile-devant"` : passe devant le tutoriel, 29/10) |
| `FenetreTrajet.tsx` | **Nouveau (27/10)** : la fenêtre d'un trajet (bulle « 🛤️ Automatiser » ou rails touchés) : activer l'automatisation, objets à envoyer, ✔ Valider (`reglerTrajet`) ; depuis le 30/10, quand on a touché un rail, ses boutons « ✏️ Déplacer ce rail » et « 🗑️ Retirer » en bas (`actionsRail`) |
| `FenetreRail.tsx` | **Nouveau (30/10)** : la fenêtre d'un rail qui ne relie encore rien : « ✏️ Déplacer ce rail » et « 🗑️ Retirer (+3 🔩 fer) » (`BoutonsRail`, aussi utilisés en bas de `FenetreTrajet`) |
| `FenetreAbsence.tsx` | **Nouveau (30/10)** : la fenêtre du retour « Bon retour, mineur ! » : ce que les mineurs, la mine, la foreuse et les wagonnets ont fait pendant l'absence, l'argent gagné, les mineurs sans salaire, et le bouton « 💰 Tout récupérer ! » (le résumé vient de `src/jeu/absence.ts`) |
| `StockMinerais.tsx` | Le contenu du coffre de la mine ou du chariot de la foreuse, une ligne par minerai : combien, ce que fait le wagonnet (🚃 Vendre / Garder), et 🎒 pour le mettre dans son sac ; depuis le 30/10, un curseur par minerai choisit combien en prendre (tout, par défaut) |
| `PanneauTrajets.tsx` | **Nouveau (24/10)** : dans le panneau de la mine et de la foreuse, les trajets qui en partent (créés sur la carte, bulle « 🛤️ Automatiser »), pousser, arrêter, taille des wagonnets |
| `WagonnetVillage.tsx` | Un wagonnet sur les rails (un par trajet) : sa place entre ses deux essieux (`ESSIEUX`, il tourne en douceur dans les virages), son remplissage (objets portés ÷ capacité) et son pousseur, avec sa propre animation à chaque image ; les bruits du wagonnet |
| `Wagonnet3D.tsx` | **Nouveau (26/10)** : le dessin du wagonnet en 3D (`DessinWagonnet3D`), recalculé à chaque image : caisse en planches, cadre d'acier boulonné, quatre roues sur les rails, attelage, éclairage, ombre portée, minerais à facettes de ce qu'il porte. Il remplace l'ancienne benne (`DessinBenne`) |
| `AmbianceVillage.tsx` | Papillons, oiseaux et ombres des nuages |

Supprimés le 22/10 : `VueMonde.tsx` (la mine en coupe 2D) et `Inventaire.tsx` (le sac au fond de la mine, l'envoi par l'ascenseur) ; le 23/10 : `Personnage.tsx` et `Icone.tsx` (restes de la vue en coupe), l'ambiance de grotte de `ambiance.ts` et le CSS de l'ancienne mine, du prestige et de l'enchanteur (environ 1 500 lignes) ; le 27/10 : `Hamster.tsx` et `PanneauTenues.tsx` (les tenues du Bazar et leur aperçu). Les scripts des rails sont dans `outils/rails/` (`talus.py` pour le talus, `modele3d.py` pour la voie en 3D et ses butoirs, voir `outils/rails/LISEZMOI.md`), celui des textures du sol `outils/sol/textures.py`, et (27/10) `outils/batiments/textes_miroir.py`, qui fabrique `employes-miroir.webp` (chaque panneau à texte retourné sur place, pente inversée). Archivés : `ArbrePrestige.tsx`, `CartePrestige.tsx`, `FetePrestige.tsx`, `Victoire.tsx` (`archives/prestige/`) et `PanneauEnchanter.tsx` (`archives/enchanteur/`).

### 3.5 `public/` : fichiers servis tels quels

| Fichier | Rôle |
|---|---|
| `manifest.webmanifest` | Manifeste PWA : nom « Mega Digger », `standalone`, portrait, couleurs `#15151a`, icônes |
| `sw.js` | Service worker : cache `idle-miner-v21` (30/10) (les images du village sont rangées dès l'installation) ; page réseau d'abord, `/assets/` cache d'abord, autres fichiers cache puis mise à jour ; ne touche jamais aux requêtes vers Supabase |
| `favicon.svg`, `icones/*.png` | Icônes de l'onglet et de l'application |
| `images/village/arbres/arbre01.webp` … `arbre12.webp` | Les 12 arbres de la forêt |
| `images/batiments/*.webp` | Les images des bâtiments (bazar, employes et `employes-miroir` pour le Personnel retourné, foreuse, forgeron, generateur, marche, mine avec `mine-devant`, et les 5 caisses de l'ascenseur `caisse-ascenseur-0` à `-4`), des rails (carte du menu), et de l'enchanteur et de l'arbre de prestige (plus utilisées, gardées pour plus tard) |
| `images/rails/*.webp`, `images/sol/*.webp` | Les tuiles du talus (`talus_*`) et les images de la voie en 3D (`voie_*` : une par forme de case, dont les butoirs `voie_fin_n`, `_e`, `_s`, `_o` et `voie_seul_ns` du 26/10), les textures d'herbe et de sable |
| `images/personnages/*.webp`, `images/personnages/sprites/*.webp` | Les portraits (accueil, Personnel) et les images des personnages |

### 3.6 `supabase/` : la base de données

| Fichier | Rôle |
|---|---|
| `schema.sql` | Table `sauvegardes` (tous les mondes d'un joueur), droits, règles RLS, trigger de date |
| `classement.sql` | Table `classement`, index, droits, règles RLS (pseudo du compte obligatoire), trigger qui garde le meilleur score. À lancer après `schema.sql` |
| `classement-portefeuille.sql` | **Nouveau (23/10)** : le trigger ne garde plus le maximum de l'argent (le classement se fait à l'argent en poche, qui peut baisser) |
| `classement-niveau-mine.sql` | **Nouveau (23/10)**, facultatif : le trigger ne garde le maximum que pour l'argent, et les anciens prestiges (plus de 5) repassent à 0 |
| `classement-remise-a-zero.sql` | **Nouveau (26/10)** : `delete from public.classement;`, à lancer **une fois** pour effacer les anciens scores de prestige (le trigger garde le meilleur score : ils ne redescendraient jamais). Chaque joueur retrouve sa ligne à sa prochaine sauvegarde en ligne. Aucune table créée, RLS inchangées |

Ces scripts se collent à la main dans le SQL Editor de Supabase. Les tables n'ont pas changé le 22/10 (le niveau de la mine passe dans la colonne `prestige`).

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
| `jeu/niveaux.md` | Le niveau du joueur (29/10) : XP, courbe, ce que débloque chaque niveau |
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

Une action du jeu (dans `src/jeu/`) **modifie l'état qu'on lui donne** et **renvoie la liste des messages** à afficher au joueur (vide si rien à dire). Exemples : `cliquerMine(etat, aleatoire)`, `vendre(etat)`, `creerTrajet(etat, 'mine-marche')`, `remplirGenerateur(etat, 10)`. Les fonctions qui ne font que lire l'état (`capaciteCoffre`, `railsAlimentes`, `revenuParSeconde`...) ne le modifient pas.

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

- L'horloge (`useEffect` de `usePartie.ts`) tourne **tout le temps** : toutes les 50 ms, ou à chaque image (`requestAnimationFrame`) quand le joueur pousse un wagonnet. (24/10) **Onglet caché ou fenêtre réduite, le jeu continue** : le navigateur ralentit alors l'horloge (un tic par seconde, voire par minute) et arrête les images de l'écran, donc chaque tic compte **tout le temps passé** depuis le précédent (8 h au plus, comme jeu fermé ; `avancerTemps` le découpe en pas d'une minute), et on rattrape tout de suite au retour sur l'onglet (`visibilitychange`). Avant, un tic comptait au plus 1 s : caché, le jeu semblait en pause.
- À chaque tic : `jouer((e) => avancerTemps(e, secondes, aleatoireNavigateur))`, qui enchaîne `avancerMine`, `avancerGenerateur`, `avancerForeuse`, `avancerEmployes` et `avancerWagonnets` (par morceaux de 60 s au plus), puis compte l'XP gagnée (`mettreAJourXp`, 29/10). Un niveau gagné s'affiche en notification dorée (comme un succès) avec une petite fanfare (`sons.succes`).
- Le clic sur le bloc (`cliquer`) joue le son du coup puis `jouer((e) => cliquerMine(e, aleatoireNavigateur))`.
- À l'ouverture d'un monde, le temps d'absence (au plus 8 h) est rattrapé en un appel à `avancerTemps` (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#18-retour-au-jeu-après-une-absence)).

### 4.5 Les écrans

- `App` affiche l'accueil tant qu'aucun monde n'est choisi, puis `<Jeu key={monde.id}>`. Le hook `useCompte` vit dans `App`, il continue donc de synchroniser pendant la partie ; quitter un monde déclenche un envoi immédiat.
- `Jeu` n'a plus qu'**un mode** : le village vu du ciel (bandeau en haut à gauche, missions en haut à droite au-dessus du panneau, `VueVillage`, panneau du bâtiment où l'on est, barre du bas, menus, fenêtres succès et statistiques). Plus de vue en coupe ni de transition d'entrée dans la mine.
- Pendant que le joueur pousse un wagonnet (`joueurPousse`), il ne peut ni marcher ni ouvrir de panneau, et le bouton Mine est grisé.

## 5. L'aléatoire injectable

- Tout tirage au hasard passe par une fonction de type `Aleatoire = () => number` (entre 0 inclus et 1 exclu), donnée en paramètre (`creerPartie(aleatoire)`, `cliquerMine(etat, aleatoire)`, `avancerTemps(etat, s, aleatoire)`, `embaucher(etat, aleatoire)`...).
- En jeu : `aleatoireNavigateur` (`Math.random`).
- Dans les tests (et dans le bot) : `aleatoireAvecGraine(graine)` (générateur mulberry32) donne toujours la même suite de nombres.
- La logique de `src/jeu/` n'appelle jamais `Math.random` directement.

## 6. Les tests

Lancés par `npm test` (Vitest), sans navigateur. Le `localStorage` est remplacé par un faux stockage en mémoire. Au 30/10 : **22 fichiers, 172 tests**.

| Fichier | Ce qu'il vérifie |
|---|---|
| `src/jeu/bot.test.ts` | **Bot d'équilibrage** : 10 parties à graines fixes (1 à 10). Toujours le niveau 5 ; niveau 2 en 15 à 40 min (médiane, depuis le 29/10) et niveau 5 en 6 h à 9 h (médiane, depuis le 30/10) ; niveau 5 du joueur après 8 min au moins et niveau 10 après 1 h au moins (médianes) ; chaque niveau plus long que le précédent ; rails en moins de 10 min et électriques en moins de 1 h 30 ; au moins 4 mineurs, plus de 100 voyages de wagonnet, plus de blocs des mineurs que des clics ; plus de 3 allers-retours à pied au début |
| `src/jeu/mineur.test.ts` | Début de partie ; clic (coffre, usure, doublement jamais pour la pierre, bloc suivant du bon niveau, pioche cassée, coffre plein) ; la mine toute seule ; prendre dans le coffre ; vente ; payer avec le sac puis le coffre ; sac ; niveau 2 ; coffre ; ascenseur ; réparation ; pioches |
| `src/jeu/niveaux.test.ts` | **Nouveau (29/10)** : l'XP qu'il faut monte à chaque niveau ; 1 XP par bloc cliqué ; construire rapporte de l'XP et un niveau gagné donne un message ; un rail retiré puis reposé ne rapporte qu'une fois ; bâtiments, rails et niveaux de mine sous cadenas ; chaque niveau jusqu'au 15 débloque quelque chose |
| `src/jeu/mine.test.ts` | Les blocs de chaque niveau, chances à 100 %, valeur moyenne, débit |
| `src/jeu/employes.test.ts` | Nombre par niveau, prix, travail (creuser, remonter, vider), ascenseur, coffre plein, équipement, pousseur embauché pour un trajet (pas sans rails, trajet créé à l'embauche, marche du Personnel au quai de la mine), changer le trajet d'un pousseur (il va au quai de la foreuse), licenciement, salaires, recruteur et rareté, manager |
| `src/jeu/wagonnet.test.ts` | Aucun trajet au début, trajets proposés, ligne complète, joueur qui pousse, objets gardés, le pousseur de ce trajet, électrique, ligne coupée, arrêter un trajet, Mine → Foreuse, Foreuse → Marché, plusieurs wagonnets sur les mêmes rails, pas de boucle |
| `src/jeu/voie.test.ts` | La voie large de deux cases : bords d'une ligne droite, pas de bâtiment ni de chemin sur les bords, pas de rail dont la voie passerait sur un objet ; virages doux (oui entre deux lignes droites, non dans un zigzag, non si un bras est un bout de ligne : il garde son butoir) ; bulle « Rails coupés » sur les deux bâtiments d'un trajet |
| `src/jeu/generateur.test.ts` | Rayon, rails électriques, éteint, ligne hors du rayon, foreuse, amélioration et réserve |
| `src/jeu/foreuse.test.ts` | Charbon (sac puis coffre), chariot, vente, électricité, améliorations |
| `src/jeu/village.test.ts` | Mine au milieu, prix et déblocage des bâtiments, chevauchement, déplacer et retourner, chemins à pied, ouverture d'un bâtiment de n'importe quel côté, rails (3 fer), mineurs au village (forge, Personnel), bulles, un clic juste à côté d'un bâtiment le vise (`batimentProcheDe`, 29/10) |
| `src/jeu/objectifs.test.ts` | Les missions (premiers pas, une à trois missions, bâtiment avec sa progression, automatisation, urgences) et les stands achetables |
| `src/jeu/nouveautes30.test.ts` | **Nouveau (30/10)** : un palier de combo donne un bonus de quelques secondes (fortune, plusieurs blocs par clic) ; un rail retiré est remboursé et on dit quand il n'y a plus de fer ; une mission affichée garde sa place ; le résumé de l'absence compte ce que les mineurs ont creusé |
| `src/jeu/production.test.ts` | **Nouveau (27/10)** : la production compte la mine puis chaque mineur ; un mineur qui attend son salaire ne compte pas, et tout s'arrête quand le coffre est plein |
| `src/jeu/revenu.test.ts` | La mine toute seule, un mineur rentable, un pousseur ne creuse pas |
| `src/jeu/sauvegarde.test.ts` | Relecture exacte, `null` si absente ou abîmée, partie d'avant la v21 qui repart de zéro, partie v21 convertie (son wagonnet devient le trajet Mine → Marché), partie v22 convertie (les anciens pousseurs prennent le trajet Mine → Marché, les mineurs n'en ont pas), partie avec des tenues et des décorations (27/10) qui se charge sans elles, partie v23 qui reçoit l'XP de ce qu'elle a (29/10), version 25 attendue (30/10), temps depuis la sauvegarde, mondes, export/import |
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
- Changer le format de `EtatJeu` → augmenter `VERSION_ETAT` et décider : écrire une conversion dans `sauvegarde.ts` (comme `convertirVersion21` le 24/10, `convertirVersion22` le 26/10 et `convertirVersion23` le 29/10), ou laisser les anciennes parties repartir de zéro comme le 22/10.
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
- À ne pas confondre avec `VERSION_ETAT` (format de la sauvegarde, actuellement 24).
