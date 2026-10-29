# Architecture du code

> Comment le projet Mega Digger (ex-Idle Miner) est organisé : stack, fichiers, flux des données, langues, version CrazyGames, tests et façon de travailler.
> Mis à jour pour la **grande mise à jour du 25/10** : nouvelles règles (`gemmes.ts`, plus de sac ni de bazar), deux langues (`langue.ts`, `traductions/`), stockage sûr (`stockage.ts`), version CrazyGames (`portail.ts`), contexte React (`contexteJeu.ts`), fenêtre commune (`Fenetre.tsx`) et nouveau style (`src/styles/`). Complété le 26/10 (la grosse mise à jour des gemmes : `ateliers.ts`, `PanneauxAteliers.tsx`, version de sauvegarde 30). Les règles du jeu sont dans [vue-d-ensemble.md](vue-d-ensemble.md) et [equilibrage.md](equilibrage.md), le village dans [village.md](village.md), les fiches des bâtiments dans [../batiments/](../batiments/README.md), la sauvegarde et la partie en ligne dans [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## 1. Stack

| Sujet | Choix |
|---|---|
| Langage | TypeScript (~6.0), mode strict « bundler » (`tsconfig.app.json` : `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`...) |
| Interface | React 19 (`react`, `react-dom`), en `StrictMode` |
| Outil de build | Vite 8 avec `@vitejs/plugin-react`, **chemins relatifs** (`base: './'`, 25/10) |
| Tests | Vitest 5 (`*.test.ts`, sans navigateur) |
| Lint | oxlint (plugins `react`, `typescript`, `oxc`), voir `.oxlintrc.json` |
| En ligne | Supabase (`@supabase/supabase-js`) : comptes, sauvegarde en ligne, classement. Seul « backend », pas de serveur à nous. Le jeu marche sans. Pas dans la version CrazyGames |
| Hébergement | Vercel (build = `npm run build`, dossier `dist/`) ; et une version « portail » pour **CrazyGames** (`VITE_PORTAIL=crazygames`, 25/10) |
| Langues | Français (la langue du code) et anglais : `t()` dans `src/jeu/langue.ts`, traduction dans `src/jeu/traductions/en.ts` (25/10) |
| Style | (25/10) Cartoon simple et coloré : contours bleu nuit épais (`#2a2140`), ombres dures, fenêtres crème, aplats pastel, ni dégradés ni flous. Les briques sont dans `src/styles/theme.css`. Polices Lilita One (titres) et Nunito, **servies par le jeu** (`@fontsource`), plus notre police d'icônes (`public/fonts/icones-mega.woff2`). Voir [../../CLAUDE.md](../../CLAUDE.md), section « Le style » |
| Sons | Web Audio, fabriqués par le code (sauf le « cha-ching » des ventes, `public/sons/cash.mp3`) |
| PWA | Manifeste + service worker (production uniquement, pas dans la version CrazyGames) : installable et jouable hors ligne |

Dépendances de production : `react`, `react-dom`, `@supabase/supabase-js`, `@fontsource/lilita-one` et `@fontsource/nunito`.

## 2. Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur local sur http://localhost:5173 (sans service worker) |
| `npm test` | `vitest run` : tous les tests unitaires une fois |
| `npm run lint` | `oxlint` |
| `npm run build` | `tsc -b && vite build` : vérification TypeScript puis build de production dans `dist/` (c'est ce que lance Vercel) |
| `VITE_PORTAIL=crazygames npm run build` | (25/10) La version CrazyGames : sans comptes, sans application à installer, publicités par leur SDK (voir section 8) |
| `npm run traductions` | (25/10) `outils/traductions/extraire.mjs` : la liste des textes du jeu qui n'ont pas encore leur traduction anglaise |
| `npm run preview` | Sert le build de `dist/` en local |

## 3. Arborescence des fichiers

### 3.1 Racine

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Règles du projet pour les assistants (stack, conventions, style, choix de design) |
| `CONTEXTE.md` | État d'avancement, équipe, infra (Vercel, Supabase), décisions, feuille de route et journal ; à lire en début de session |
| `README.md` | Lancer le projet et travailler à deux (branches, PR) |
| `index.html` | Page unique : `<div id="root">`, liens PWA, `viewport-fit=cover` |
| `package.json` / `package-lock.json` | Dépendances et scripts npm |
| `vite.config.ts` | Plugin React, `base: './'` (25/10 : chemins relatifs, le jeu marche dans un sous-dossier) et constante `__VERSION_JEU__` (section 10) |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Options TypeScript |
| `.oxlintrc.json` | Configuration du lint |
| `archives/` | Le code mis de côté le 22/10 (prestige, enchanteur) : **hors de `src/`, donc ni compilé ni testé** |
| `outils/` | Les scripts : `icones/` (la police d'icônes), `traductions/` (les textes à traduire), `rails/`, `art/` (les dessins du village en SVG : bâtiments, mine, arbres) |

### 3.2 `src/jeu/` : la logique du jeu (TypeScript pur, sans React ni DOM)

| Fichier | Rôle |
|---|---|
| `donnees.ts` | Toutes les données et constantes : blocs, niveaux de la mine (`NIVEAUX_MINE` : ce sont aussi les paliers), `NIVEAUX_PAR_AMELIORATION` (7 depuis le 26/10), coffre, pioches, bonus de combo, ascenseur, mineurs (pioches, salaires, raretés, recruteur, manager, `PALIER_CHEF`), pousseurs (vitesse, chariot), rails et trajets (`LIAISONS`), générateur, foreuse, (26/10) fonderie et joaillerie (`NIVEAUX_FONDERIE`, `NIVEAUX_JOAILLERIE`, `PALIER_FONDERIE`, `PALIER_JOAILLERIE`, `LINGOT_DE`, `BIJOU_DE`, `PRIX_EMBAUCHE_JOAILLIER`), bâtiments (`LISTE_BATIMENTS`), grille de 40 × 40 (`TAILLE_GRILLE`), niveau du joueur (`XP_PAR`, `xpPourPasser`, `NIVEAU_JOUEUR_MAX` = 15, `NIVEAU_JOUEUR_POUR`) |
| `mine.ts` | Les 7 niveaux de la mine (26/10) : tirer un bloc (`tirerBloc`), les chances, la valeur moyenne d'un bloc, ce que rapporte le niveau suivant (`gainsNiveauSuivant`) |
| `mineur.ts` | Le type `EtatJeu` (et `Coffre`, `Foreuse`, `Generateur`, `Atelier` (26/10), `Trajet`, `Employe`, `Navette`, `Manager`, `Statistiques`...), `VERSION_ETAT` (30), `creerPartie` (80 $ au départ), et les actions du joueur : le coffre, payer (`disponible`, `payer`, `acheterAvecGemmes`, `peutPayerEnGemmes` ; 26/10 : les lingots et les bijoux aussi depuis la réserve de leur atelier), le clic (`cliquerMine`), les bonus de combo, la mine toute seule (`avancerMine`, `debitMine`), les niveaux, l'ascenseur, **la vente directe** (`vendreCoffre`, `vendreMinerai`, la punaise `basculerGarderTout`, 25/10), les pioches et leur réparation |
| `gemmes.ts` | **Nouveau (25/10)** : les gemmes : en gagner (`recompenserPub`, `GEMMES_PAR_NIVEAU`), le prix en gemmes (`prixEnGemmes`), la boutique (`BOOSTS`, `acheterBoost`, `TRESOR`), les multiplicateurs des bonus (`multiplicateurProduction`, `multiplicateurVentes`, `boostActif`), le cadeau du jour (`RECOMPENSES_QUOTIDIENNES`, `etatQuotidien`, `recupererQuotidien`). Voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md) |
| `langue.ts` | **Nouveau (25/10)** : les deux langues. `t('Texte en français', { trou: valeur })` rend le texte dans la langue du joueur (la phrase française sert de clé dans `traductions/en.ts` ; sans traduction, le texte reste en français), `nombre(n)` écrit un nombre à la façon de la langue, `pluriel`, `changerLangue`. Ni React ni navigateur : la logique s'en sert pour ses messages |
| `traductions/en.ts` | **Nouveau (25/10)** : la traduction anglaise (`TRADUCTIONS_EN` : texte français → texte anglais, avec les mêmes `{trous}`). Encore à remplir : `npm run traductions` liste ce qui manque |
| `employes.ts` | Les employés : embauche des mineurs, des pousseurs et (26/10) des joailliers (`prixEmbauche`, `embaucher`, `embaucherPousseur`, `embaucherJoaillier`), pioches des mineurs, vitesse et chariot des pousseurs, travail (creuser, la caisse de l'ascenseur `avancerNavette`, marcher au village), salaires, licenciement, manager (palier 3, sa fatigue) et recruteur (palier 4, `remplacerMineur`) |
| `wagonnet.ts` | Les trajets des wagonnets (Mine → Marché, Mine → Foreuse, Mine → Générateur, Foreuse → Marché, et depuis le 26/10 les six trajets des ateliers), un wagonnet par trajet : créer, régler (`reglerTrajet`) et arrêter un trajet, ce qu'il emporte (sans les minerais épinglés), qui le pousse, électricité (`trajetElectrique`, `railsAlimentes`), vitesse, livraison, retour, ligne coupée |
| `generateur.ts` | Le générateur : rayon (`casesDansLeRayon`), foreuse et ateliers alimentés (`atelierAlimente`, 26/10), redstone et sa réserve, améliorations |
| `foreuse.ts` | La foreuse (niveau 2) : charbon, forage, chariot, **vente sur place** (`vendreChariot`, 25/10), améliorations, bonus électrique |
| `ateliers.ts` | **Nouveau (26/10)** : la **fonderie** (niveau 5 de la mine : le fer et l'or en lingots, au charbon) et la **joaillerie** (niveau 6 : les joailliers taillent les gemmes en bijoux) : ce qu'ils acceptent, l'entrée et la réserve, « Apporter », le four, la vente de la réserve, le travail seconde après seconde (`avancerFonderie`, `avancerJoaillerie`), leurs niveaux et leur plus-value. Voir [../batiments/fonderie.md](../batiments/fonderie.md) et [../batiments/joaillerie.md](../batiments/joaillerie.md) |
| `village.ts` | La géométrie du village : types `Village`, `BatimentPose` ; grille de 40 × 40, mine posée d'office en 15, 15 (`POSITION_MINE`), emprises, portes, chemin à pied (A étoile), rails entre deux bâtiments, raccords, pas de carré de 2 × 2 (29/10 : boucles permises), bords de la voie, virages doux |
| `batiments.ts` | Les actions du village : construire (`batimentDebloque`, `construireBatiment`), déplacer, retourner, poser / déplacer / enlever des rails et des chemins (26/10 : ils vont dans le stock, `stockSol`), `raisonSolImpossible` |
| `reorganiser.ts` | (26/10) Réorganiser le village façon Clash of Clans : tout ranger dans une barre, reposer, ranger, terminer, annuler ; le jeu est en pause pendant ce temps |
| `niveaux.ts` | Le niveau du joueur (XP sur les « records » des compteurs, `mettreAJourXp`, 1 gemme par niveau gagné) et **les paliers** (25/10 : `palierRequis`, `debloque`, `verrou` « 🕳️ Mine N », `verrouNiveau` « ⭐ N »), ce qu'apporte un niveau (`deblocagesDuNiveau`, `prochainDeblocage`). Voir [niveaux.md](niveaux.md) |
| `tutoriel.ts` | Les étapes du tutoriel (25/10 : bonjour, casser 10 blocs, vendre le coffre, construire le Personnel, embaucher le premier mineur, bravo) : `etapeTutoriel`, `etapeFaite`, `avancerTutoriel` |
| `missions.ts` | `missions(etat, avant)` : une à trois missions (urgences, premiers pas, prochain bâtiment, automatisation, améliorations les plus proches ; 25/10 : plus de « Niveau X ») ; une mission affichée garde sa place |
| `objectifs.ts` | Les achats possibles (`achatsPossibles`) et les bâtiments où une amélioration est achetable |
| `notifications.ts` | Les bulles au-dessus des bâtiments (salaires, rails coupés, pousseurs sans trajet, chariot d'un wagonnet trop petit, chariot plein, plus de charbon, plus de redstone, pioche cassée, coffre plein, réserve d'un atelier pleine, pas de joaillier, nouveauté, achetable pendant le tutoriel) |
| `decouvertes.ts` | Le manager et le recruteur tout juste débloqués (bulle ✨ au-dessus du Personnel) |
| `succes.ts` | Les 28 succès (26/10 ; 21 avant) (titres traduits avec `t()`) et `verifierSucces` |
| `revenu.ts` | Estimation de ce que la mine produit par seconde (« $/s »), et le bilan par minute ; depuis le 26/10, avec la plus-value des ateliers et le salaire des joailliers |
| `production.ts` | Le tableau de production et les goulots (`production`, `analyseAscenseur`, `analyseWagonnet`, `chariotTropPetit`) |
| `absence.ts` | Le résumé de l'absence (`photoPartie`, `resumerAbsence`, `ResumeAbsence.gains`), la vente au retour (`vendreCoffreAuRetour` : le coffre, et depuis le 26/10 la réserve des ateliers) et l'absence doublée (`doublerAbsence`, 25/10) |
| `statistiques.ts` | Calculs pour l'écran 📊 (argent par source, blocs les plus cassés) |
| `temps.ts` | `avancerTemps` : la mine, le générateur, la foreuse, les employés, la fonderie et la joaillerie (26/10) et les wagonnets, par morceaux d'une minute au plus ; puis l'XP du joueur |
| `aleatoire.ts` | Le type `Aleatoire`, `aleatoireNavigateur` (Math.random), `aleatoireAvecGraine` (mulberry32), `entierEntre`, `choisir`, `choisirPondere` |
| `sauvegarde.ts` | Les 5 mondes, la vérification de version et les **conversions** des vieilles parties (`convertirVersion21` … `convertirVersion29` ; 25/10 : sac vendu, bazar remboursé, village recalé sur 40 × 40, 5 niveaux pour tout, 10 gemmes ; 26/10 : les diamants deviennent des saphirs, la fonderie et la joaillerie arrivent vides), export/import de tous les mondes |
| `compte.ts` | Règles du pseudo et du mot de passe, email fabriqué, choix de synchronisation à la connexion |
| `classement.ts` | Le meilleur score parmi les mondes : **l'argent gagné en tout** (25/10) et le niveau de la mine (rangé dans `prestige`) |
| `partieDeTest.ts` | Pour les tests : une partie déjà au niveau maximum du joueur |
| `bot.ts` | Bot de simulation qui joue une partie jusqu'au niveau 7 de la mine (`jouerPartie` ; 26/10 : il fait aussi tourner la fonderie et la joaillerie), utilisé par les tests d'équilibrage |
| `*.test.ts` | Les tests (section 7) |

Retirés : le 25/10, tout ce qui touchait au **sac** (`SACS`, `prendreDuCoffre`, `vendreLot`, `nonAVendre`…) et au **bazar** ; le 27/10, `tenues.ts` ; le 22/10, `talents.ts`, `conditionsPrestige.ts`, `enchantements.ts` (vers `archives/`) et `convois.ts`.

### 3.3 `src/` : le pont avec React et les services du navigateur

| Fichier | Rôle |
|---|---|
| `main.tsx` | Point d'entrée : importe les polices (`@fontsource`) et les feuilles de style, choisit la langue (`initialiserLangue`), charge le SDK du portail (`initialiserPortail`), monte `<App />`, enregistre le service worker |
| `App.tsx` | `App` (écran d'accueil ou jeu) et `Jeu` : assemble les composants, fournit le **contexte du jeu** (`ContexteJeuReact` : la partie, `jouer`, `regarderPub`, `ouvrirBoutique`), relie boutons et clavier aux actions, gère la construction (fantôme, pinceau des rails et chemins, Modifier), le panneau du bâtiment ouvert, les fenêtres du haut (statistiques, succès, bilan, boutique, cadeau du jour, réglages, aide), la publicité en cours, le cadeau du jour qui s'ouvre une fois par jour, et dit au portail quand le joueur joue ou est dans un menu |
| `usePartie.ts` | Hook central : garde l'`EtatJeu`, applique les actions (`jouer`), fait tourner l'horloge, gère le clic sur le bloc, déclenche sons, animations et messages (au plus 3 à la fois), rattrape l'absence et garde son résumé, sauvegarde automatiquement (par `stockage`) |
| `stockage.ts` | **Nouveau (25/10)** : le **stockage sûr**. Essaie une fois le `localStorage` ; s'il est interdit (navigation privée, page d'un autre site), garde tout en mémoire au lieu de planter. `stockage`, `stockagePersistant`, `lireReglage`, `ecrireReglage`. **Toujours lui, jamais `window.localStorage`** |
| `portail.ts` | **Nouveau (25/10)** : la version « portail » (CrazyGames). `PORTAIL`, `AVEC_COMPTES`, `AVEC_INSTALLATION`, le chargement de leur SDK (`initialiserPortail`), la publicité récompensée (`pubRecompensee`, `sdkDisponible`), `jeuEnCours` / `jeuEnPause` / `grandMoment` (`gameplayStart`, `gameplayStop`, `happytime`). Voir section 8 |
| `langueNavigateur.ts` | **Nouveau (25/10)** : la langue au démarrage (celle choisie dans les réglages, clé `idle-miner-langue`, sinon celle du navigateur) |
| `useCompte.ts` | Hook du compte en ligne : session, synchronisation des mondes, envoi du score |
| `enLigne.ts` | Le seul fichier qui parle à Supabase (comptes, sauvegardes, classement) |
| `enLigneAbsent.ts` | (27/10) Les mêmes fonctions, vides : il remplace `enLigne.ts` dans la version CrazyGames (alias dans `vite.config.ts`), sans la bibliothèque de Supabase |
| `polices.css` | (27/10) Les polices du jeu (Lilita One, Nunito), en woff2 seulement |
| `useJoueurVillage.ts` | La taupe du joueur dans le village : position, flèches du clavier, marche jusqu'à une case ou un bâtiment, saut (affichage seulement) |
| `useCompteur.ts` | Un nombre qui défile jusqu'à sa nouvelle valeur (compteur d'argent) |
| `evenements.ts` | Compare l'état avant/après une action pour en tirer des `Evenement` (casse, vente, achat, amélioration, pioche cassée, wagonnet) |
| `nombres.ts` | `nombre(n)` et `nombreAbrege(n)` (« 1,2 k », « 3,2 M ») dans la langue du joueur, `minutesSecondes` ; jamais `toLocaleString('fr-FR')` |
| `sons.ts`, `ambiance.ts` | Bruitages et musique Web Audio (ils se taisent pendant une publicité), réglages 🔊 et 🎵 |
| `installation.ts` | Enregistrement du service worker (production seulement, hors portail) et hook `useInstallation` |
| `version.d.ts` | Déclare la constante globale `__VERSION_JEU__` |
| `icones.css` | La police des icônes cartoon (`icones-mega.woff2`) |
| `village.css` | Le dessin du village (carte, calques, bâtiments, personnages, wagonnets, rayon du générateur, bulles) |

### 3.4 `src/styles/` : le style (25/10)

Un seul style partout (cartoon, contours épais, ombres dures, crème et pastels : voir [../../CLAUDE.md](../../CLAUDE.md)). Les anciennes feuilles (`index.css`, `blocs.css`, `effets.css`, `accueil.css`, `personnel.css`, `plein-ecran.css`, `interface.css`) sont remplacées par :

| Fichier | Rôle |
|---|---|
| `theme.css` | Les briques : couleurs, **boutons** (une couleur par sorte d'action : vert acheter/améliorer/construire/embaucher, jaune action principale/vendre/valider, violet gemmes/publicités, bleu aller/voir/régler, blanc neutre/annuler, rose détruire), **fenêtres** (qui montent du bas sur téléphone), lignes d'amélioration, pastilles, jauges |
| `jeu.css` | L'écran de jeu : le bandeau, les tâches, les gros boutons ronds du bas |
| `mine.css` | La fenêtre de la mine (bloc à cliquer, coffre, production) |
| `gemmes.css` | Les gemmes, la boutique, la publicité, le cadeau du jour, les réglages |
| `batiments.css` | Les panneaux des bâtiments, le Personnel, le menu Construire, les trajets |
| `accueil.css` | L'écran d'accueil : les mondes, le classement, le compte |
| `fenetres.css` | Le tutoriel, la fête du niveau, les statistiques, le bilan, les gains |

### 3.5 `src/composants/` : les composants React (aucune règle du jeu)

Ils lisent la partie avec **`useJeu()`** (`contexteJeu.ts`, 25/10) au lieu de la recevoir en paramètre, et tous les textes passent par `t()`.

| Fichier | Rôle |
|---|---|
| `contexteJeu.ts` | **Nouveau (25/10)** : `useJeu()` donne la partie (`etat`), `jouer(action)`, `regarderPub(quandFinie)` et `ouvrirBoutique()` |
| `Fenetre.tsx` | **Nouveau (25/10)** : **la** fenêtre du jeu, la même partout (bâtiments, succès, statistiques, boutique…) : un voile, un bandeau de couleur avec l'icône et le titre, le bouton ✖ rond, Échap ou un clic à côté pour fermer (sauf si `fermable` est faux), des boutons en bas (`pied`) ; elle monte du bas de l'écran sur téléphone |
| `Amelioration.tsx` | Les lignes d'achat et d'amélioration, les mêmes partout : titre, niveau en carrés, effet, bouton vert avec le prix et **bouton violet 💎** pour payer en gemmes |
| `Boutique.tsx` | **Nouveau (25/10)** : la boutique des gemmes (publicité, bonus) |
| `RecompensesQuotidiennes.tsx` | **Nouveau (25/10)** : le cadeau du jour (calendrier de 7 jours) |
| `Publicite.tsx` | **Nouveau (25/10)** : la fausse publicité de 30 s (remplacée par celle du SDK sur CrazyGames) |
| `Reglages.tsx` | **Nouveau (25/10)** : les réglages ⚙️ (monde en cours, son, musique, langue, aide, changer de monde, recommencer à zéro avec confirmation) |
| `Aide.tsx` | **Nouveau (25/10)** : « Comment jouer » (la boucle en 4 étapes de `etapesDuJeu.ts`, les gestes de la carte) |
| `etapesDuJeu.ts` | **Nouveau (25/10)** : la boucle en 4 étapes (Creuse, Embauche, Automatise, Descends), la même sur l'accueil, au tutoriel et dans l'aide |
| `BlocDessin.tsx` | **Nouveau (25/10)** : le bloc de la mine, un cube vu de 3/4 dessiné à plat avec un gros contour, qui se fissure |
| `Interrupteur.tsx` | **Nouveau (25/10)** : un interrupteur (trajet activé, manager au travail) |
| `Accueil.tsx`, `SceneAccueil.tsx` | L'écran d'accueil (refait le 25/10) et son petit village vivant en fond |
| `CarteCompte.tsx`, `CarteClassement.tsx`, `CarteInstallation.tsx` | Le compte, le classement (argent gagné) et « Installer l'application » (hors portail) |
| `Hud.tsx` | Le bandeau du haut : seulement l'essentiel, et chaque case apparaît quand elle sert (argent, coffre, puis niveau, gemmes 💎 qui ouvrent la boutique…) |
| `Missions.tsx` | Les tâches en haut à droite |
| `Tutoriel.tsx` | Le tutoriel (Pépite, une taupe mineuse) : la fenêtre de bienvenue, puis une carte et une flèche par étape |
| `FeteNiveau.tsx` | La fête du passage de niveau (avec les gemmes gagnées) ; elle attend qu'aucune fenêtre ne soit ouverte |
| `FenetreAbsence.tsx` | « Bon retour, mineur ! » : ce que l'absence a rapporté, **📺 Doubler** (25/10) et Continuer |
| `FenetreBilan.tsx` | Le bilan (on touche l'argent du bandeau) : ce que la partie gagne et paie, minute par minute |
| `Statistiques.tsx` | La fenêtre 📊 |
| `Toasts.tsx`, `Gains.tsx` | Les messages (au plus 3 à la fois) et les « +X $ » qui s'envolent |
| `Confirmation.tsx` | Une confirmation dans le style du jeu (licencier, supprimer un monde…) |
| `PanneauMine.tsx` | La mine : bloc à cliquer, coffre à vendre, palier suivant, coffre, ascenseur, wagonnets, production |
| `StockMinerais.tsx` | Un stock à vendre (le coffre de la mine, le chariot de la foreuse, ou la réserve d'un atelier, 26/10) : « Tout vendre », une ligne par minerai avec « Vendre », et la punaise 📌 pour le coffre |
| `PanneauEmployes.tsx` | Le Personnel : Équipe, Embaucher (mineur, pousseur ou, 26/10, joaillier), Chefs |
| `Panneaux.tsx` | Les panneaux du Marché, du Forgeron, de la Foreuse et du Générateur, et celui des succès |
| `PanneauxAteliers.tsx` | **Nouveau (26/10)** : les panneaux de la Fonderie (🔥 Four · 🟨 Lingots · ⬆️ Améliorer) et de la Joaillerie (🔨 Établis · 💍 Bijoux · ⬆️ Améliorer) |
| `PanneauTrajets.tsx`, `FenetreTrajet.tsx`, `FenetreRail.tsx`, `nomTrajet.ts`, `traceRail.ts` | Les trajets d'un bâtiment, la fenêtre d'un trajet (l'activer, ses objets), un rail touché, le nom d'un trajet traduit, la pose des rails pas à pas |
| `AlerteChariot.tsx`, `Ascenseur.tsx`, `Barre.tsx`, `PrixCout.tsx`, `OngletsPanneau.tsx`, `RevelationRecrue.tsx`, `confettis.ts` | Petits morceaux d'interface : chariot trop petit, ligne de l'ascenseur, jauge, prix, onglets, révélation d'une recrue, confettis |
| `MenuConstruction.tsx` | Le menu « Construire » : en grand les bâtiments à construire, puis les rails, le chemin, et en petit ce qui est déjà construit |
| `VueVillage.tsx`, `iso.ts`, `sprites.ts`, `DessinsVillage.tsx`, `ElementsVillage.tsx`, `ForetVillage.tsx`, `arbres.ts`, `PlageVillage.tsx`, `plage.ts`, `Rochers.tsx`, `Relief.tsx`, `couleurs.ts`, `ImageFigee.tsx`, `AmbianceVillage.tsx`, `fantome.ts` | Le village vu du ciel : la carte et la caméra, la projection isométrique, les personnages (taupes), les dessins, la forêt, la plage, le relief, ce qu'on pose (voir [village.md](village.md)) |
| `WagonnetVillage.tsx`, `Wagonnet3D.tsx`, `minerais.ts` | Les wagonnets sur les rails, leur dessin, les minerais qu'ils portent |

(Les détails de l'écran et du dessin sont dans [interface.md](interface.md) et [visuel-et-sons.md](visuel-et-sons.md).)

### 3.6 `public/` : fichiers servis tels quels

| Fichier | Rôle |
|---|---|
| `manifest.webmanifest` | Manifeste PWA : nom « Mega Digger », `standalone`, icônes |
| `sw.js` | Service worker (pas dans la version CrazyGames) : cache `idle-miner-v67` au 25/10 ; page réseau d'abord, fichiers du build cache d'abord ; ne touche jamais aux requêtes vers Supabase |
| `favicon.svg`, `icones/*.png` | Icônes de l'onglet et de l'application |
| `fonts/icones-mega.woff2` | La police des icônes cartoon (fabriquée par `outils/icones/fabriquer.py`) |
| `sons/cash.mp3` | Le « cha-ching » des ventes |
| `images/` | Les images du village (bâtiments, personnages, rails, sol, arbres). Depuis le 25/10, leurs chemins s'écrivent avec `import.meta.env.BASE_URL` (jamais `/images/...`) |

### 3.7 `supabase/` : la base de données

| Fichier | Rôle |
|---|---|
| `schema.sql` | Table `sauvegardes` (tous les mondes d'un joueur), droits, règles RLS, trigger de date |
| `classement.sql` | Table `classement`, index, droits, règles RLS (pseudo du compte obligatoire), trigger qui garde le meilleur score. À lancer après `schema.sql` |
| `classement-portefeuille.sql` | (23/10) Le trigger prend la valeur envoyée au lieu du maximum (pour l'argent en poche). Depuis le 25/10, le classement compte l'argent **gagné**, qui ne fait que monter : ce script n'est plus nécessaire, mais ne gêne pas |
| `classement-niveau-mine.sql` | (23/10, facultatif) Le niveau de mine prend la valeur envoyée ; les anciens prestiges (plus de 5) repassent à 0 |
| `classement-remise-a-zero.sql` | (26/10) `delete from public.classement;`, à lancer **une fois** pour effacer les anciens scores |

Ces scripts se collent à la main dans le SQL Editor de Supabase. Toute nouvelle table doit avoir ses règles RLS.

### 3.8 `archives/` : le code mis de côté (22/10)

| Dossier | Contenu |
|---|---|
| `archives/prestige/` | L'arbre de prestige (composants, `talents.ts`, `conditionsPrestige.ts`, tests, fiche). Point de départ prévu pour la « nouvelle mine » de fin de partie |
| `archives/enchanteur/` | `PanneauEnchanter.tsx`, `enchantements.ts` et la fiche du bâtiment |

### 3.9 `docs/`

| Fichier | Rôle |
|---|---|
| `idle_miner_v1.md` | Spec de la v1 (notebook Python) : une source d'idées historique |
| `revue-crazygames.md` | La revue avant CrazyGames (24/10) et son plan d'action |
| `batiments/README.md` | Index des fiches des bâtiments |
| `batiments/mine.md`, `personnel.md`, `marche.md`, `forgeron.md`, `foreuse.md`, `generateur.md`, `fonderie.md`, `joaillerie.md` (26/10) | Une fiche par bâtiment (à mettre à jour quand on le modifie ; le bazar est retiré le 25/10) |
| `jeu/vue-d-ensemble.md` | Le point d'entrée de la doc : concept, boucle, progression, glossaire, sommaire |
| `jeu/niveaux.md` | Le niveau du joueur et les paliers |
| `jeu/gemmes-et-recompenses.md` | Les gemmes, la boutique, le cadeau du jour, l'absence doublée (25/10) |
| `jeu/village.md` | Le village vu du ciel |
| `jeu/equilibrage.md`, `jeu/mine-et-minage.md`, `jeu/interface.md`, `jeu/visuel-et-sons.md` | Chiffres et formules, la mine, l'écran, le visuel et les sons |
| `jeu/architecture.md` | Ce document |
| `jeu/sauvegarde-et-en-ligne.md` | Sauvegarde locale, conversions, comptes, synchronisation, classement, tables Supabase |

## 4. Le flux des données

```
             ┌──────────────── src/jeu (TypeScript pur) ────────────────┐
             │  EtatJeu (objet JSON)   actions : (etat) => string[]      │
             │  avancerTemps(etat, secondes, aleatoire)    t('…')        │
             └───────────────▲──────────────────────────┬───────────────┘
                             │ jouer(action)            │ nouvel état
             ┌───────────────┴──────── usePartie.ts ────▼───────────────┐
             │ copie → action → succès → événements → sons/animations   │
             │ horloge (tics) · sauvegarde automatique (stockage.ts)    │
             └───────────────▲──────────────────────────┬───────────────┘
                             │ clics, clavier           │ etat
             ┌───────────────┴── App.tsx + ContexteJeu ─▼───────────────┐
             │ composants : useJeu() → etat, jouer, regarderPub ;        │
             │ aucune règle du jeu                                       │
             └──────────────────────────────────────────────────────────┘
```

### 4.1 L'état

Toute la partie tient dans un seul objet `EtatJeu` (défini dans `src/jeu/mineur.ts`) fait de nombres, textes, listes et objets simples. Il se sauvegarde donc tel quel en JSON. Le détail de chaque champ est dans [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#16-ce-qui-est-stocké--etatjeu-champ-par-champ).

### 4.2 Les actions : `(etat) => string[]`

Une action du jeu (dans `src/jeu/`) **modifie l'état qu'on lui donne** et **renvoie la liste des messages** à afficher (déjà traduits avec `t()`, vide si rien à dire). Exemples : `cliquerMine(etat, aleatoire)`, `vendreCoffre(etat)`, `creerTrajet(etat, 'mine-marche')`, `acheterBoost(etat, 'production')`. Les fonctions qui ne font que lire l'état (`capaciteCoffre`, `railsAlimentes`, `revenuParSeconde`...) ne le modifient pas.

Côté React, le type est `Action = (etat: EtatJeu) => string[]` (`usePartie.ts`), et les composants appellent `jouer(action)` (donné par `useJeu()`), par exemple `jouer(vendreCoffre)`. Payer en gemmes : `jouer((e) => acheterAvecGemmes(() => agrandirCoffre(e)))` (le principe ; voir `Amelioration.tsx`).

### 4.3 `jouer` dans `usePartie.ts`

1. Copie profonde de l'état actuel (`structuredClone`) : React reçoit toujours un nouvel objet.
2. L'action s'applique à la copie et renvoie ses messages.
3. `verifierSucces(copie)` débloque les nouveaux succès.
4. Les messages et succès deviennent des messages à l'écran (au plus 3 à la fois). Un message qui commence par « 🎉 » est un passage de niveau (la fête).
5. `evenementsEntre(ancien, copie)` (`src/evenements.ts`) déduit ce qui s'est passé, pour jouer les sons et les animations.
6. Le nouvel état est rangé (`setEtat` et une référence `etatRef` toujours à jour pour les minuteurs).

La sauvegarde se fait au plus une fois par seconde, et en quittant la page (`pagehide`).

### 4.4 La boucle de temps

- L'horloge (`usePartie.ts`) tourne **tout le temps** : toutes les 50 ms, ou à chaque image quand le joueur pousse un wagonnet. Onglet caché, chaque tic compte tout le temps passé depuis le précédent (8 h au plus).
- À chaque tic : `avancerTemps`, qui enchaîne `avancerMine`, `avancerGenerateur`, `avancerForeuse`, `avancerEmployes` et `avancerWagonnets` (par morceaux de 60 s au plus), puis compte l'XP gagnée (`mettreAJourXp`).
- À l'ouverture d'un monde, le temps d'absence (au plus 8 h) est rattrapé en un appel à `avancerTemps` (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#18-retour-au-jeu-après-une-absence)).

### 4.5 Les écrans

- `App` affiche l'accueil tant qu'aucun monde n'est choisi, puis `<Jeu key={monde.id}>`. Le hook `useCompte` vit dans `App` (hors portail).
- `Jeu` : le village vu du ciel, le bandeau, les tâches, les gros boutons ronds du bas, le panneau du bâtiment ouvert (une `Fenetre`), et les fenêtres du haut. Quand une fenêtre est ouverte, la fête du niveau attend, et le portail est prévenu (`jeuEnPause`).

## 5. L'aléatoire injectable

- Tout tirage au hasard passe par une fonction de type `Aleatoire = () => number` (entre 0 inclus et 1 exclu), donnée en paramètre (`creerPartie(aleatoire)`, `cliquerMine(etat, aleatoire)`, `avancerTemps(etat, s, aleatoire)`, `embaucher(etat, aleatoire)`...).
- En jeu : `aleatoireNavigateur` (`Math.random`). Dans les tests et le bot : `aleatoireAvecGraine(graine)` (mulberry32).
- La logique de `src/jeu/` n'appelle jamais `Math.random` directement.

## 6. Les deux langues (25/10)

- **Tout texte affiché passe par `t()`** (`src/jeu/langue.ts`) : `t('Vends le coffre de la mine')`, `t('Vente : +{gain} $', { gain: nombre(42) })`. Le texte est écrit en français dans le code ; en français, `t()` le rend tel quel (avec ses `{trous}` remplis) ; en anglais, il cherche la traduction dans `src/jeu/traductions/en.ts`, où **la phrase française sert de clé**. Sans traduction, le texte reste en français : rien ne casse.
- **Les tables de `donnees.ts`** (noms des blocs, des bâtiments, des niveaux…) restent en français : l'interface les traduit au moment de les afficher (`t(BLOCS[bloc].nom)`). Les succès ont des titres en « get » qui passent par `t()` à chaque lecture.
- **Les nombres** : `nombre(n)` et `nombreAbrege(n)` (« 1 250 » en français, « 1,250 » en anglais), jamais `toLocaleString('fr-FR')`.
- **La langue** se choisit au démarrage (`langueNavigateur.ts` : celle des réglages, sinon celle du navigateur : français pour un navigateur en français, anglais pour tous les autres) et se change dans les réglages ⚙️.
- **Après avoir ajouté des textes** : `npm run traductions` (`outils/traductions/extraire.mjs`) liste les textes sans traduction ; on complète `en.ts`. Au 25/10, `en.ts` est encore vide : le mécanisme est en place, la traduction reste à écrire.

## 7. Les tests

Lancés par `npm test` (Vitest), sans navigateur. Au 25/10 : **26 fichiers, 238 tests**.

| Fichier | Ce qu'il vérifie |
|---|---|
| `src/jeu/bot.test.ts` | **Bot d'équilibrage** : 10 parties à graines fixes. Toujours le niveau 7 (26/10 ; avant, le 5) ; niveau 2 en **2 à 10 min**, niveau 5 en **1 h à 3 h** (médianes, 25/10, économie revue ; avant 3 h à 6 h) et niveau 7 en **4 h à 9 h** (26/10, avec la hausse de la fin de partie ; avant 3 h à 7 h) ; la fonderie fond plus de 100 lingots et la joaillerie taille plus de 20 bijoux dans chaque partie ; niveau 5 du joueur après 8 min au moins et niveau 10 après 1 h au moins ; chaque niveau plus long que le précédent ; rails en moins de 10 min et électriques en moins de 1 h 30 ; au moins 4 employés, plus de 100 voyages de wagonnet, plus de blocs des mineurs que des clics ; plus de 3 ventes à la main au début |
| `src/jeu/gemmes.test.ts` | **Nouveau (25/10)** : le prix en gemmes, payer une amélioration en gemmes (mêmes conditions), gagner des gemmes (publicité, niveau), les bonus et le trésor, le cadeau du jour et sa série |
| `src/jeu/langue.test.ts` | **Nouveau (25/10)** : `t()` en français et en anglais, les `{trous}`, un texte sans traduction, `nombre`, `pluriel` |
| `src/jeu/tutoriel.test.ts` | Les étapes du tutoriel (jusqu'au premier mineur) |
| `src/jeu/mineur.test.ts` | Début de partie ; clic (coffre, usure, doublement, pioche cassée, coffre plein) ; la mine toute seule ; la vente du coffre et la punaise ; payer ; niveaux ; coffre ; ascenseur ; pioches |
| `src/jeu/niveaux.test.ts` | L'XP, les niveaux (au plus 15), les gemmes de chaque niveau, les cadenas du niveau du joueur et des paliers |
| `src/jeu/mine.test.ts`, `src/jeu/donnees.test.ts` | Les blocs, les chances, la valeur moyenne, le débit ; les tables (7 niveaux pour tout depuis le 26/10, prix qui montent) |
| `src/jeu/employes.test.ts` | Embauche, prix, travail, ascenseur, pousseurs, licenciement, salaires, recruteur, manager |
| `src/jeu/wagonnet.test.ts`, `src/jeu/voie.test.ts`, `src/composants/traceRail.test.ts` | Les trajets des wagonnets, la voie (bords, virages, bulles), la pose des rails pas à pas |
| `src/jeu/generateur.test.ts`, `src/jeu/foreuse.test.ts` | Le générateur ; la foreuse (charbon, chariot, vente sur place, électricité, améliorations) |
| `src/jeu/ateliers.test.ts` | **Nouveau (26/10)** : ce que les ateliers acceptent, les prix des lingots et des bijoux, leurs paliers ; la fonderie (fondre au charbon, payer avec sa réserve, s'améliorer) ; les joailliers (autant que d'établis, la gemme la plus chère d'abord, sans salaire la gemme retourne à l'entrée) ; les wagonnets vers les ateliers (minerais choisis, refusés, charbon du four) |
| `src/jeu/village.test.ts` | La mine au milieu, les bâtiments, déplacer, chemins à pied, rails, mineurs au village, bulles |
| `src/jeu/objectifs.test.ts`, `src/jeu/nouveautes30.test.ts` | Les missions et les achats ; bonus de combo, rails rangés en stock, missions qui gardent leur place, résumé de l'absence |
| `src/jeu/production.test.ts`, `src/jeu/revenu.test.ts`, `src/jeu/bilan.test.ts`, `src/jeu/statistiques.test.ts` | La production, le revenu, le bilan, les statistiques |
| `src/jeu/sauvegarde.test.ts` | Relecture, mondes, export/import, et **chaque conversion** (dont la 28 → 29 : sac vendu, bazar remboursé, village recalé, rails hors de la clairière remboursés, 5 niveaux, 10 gemmes, tutoriel passé ; et la 29 → 30 : diamants changés en saphirs, ateliers vides) |
| `src/jeu/compte.test.ts`, `src/jeu/classement.test.ts`, `src/jeu/decouvertes.test.ts` | Compte, classement (argent gagné), découvertes |
| `src/evenements.test.ts` | Bloc cassé, diamant doublé, vente, pioche qui casse |

Il n'y a pas de tests des composants React ni de `enLigne.ts` / `useCompte.ts` (réseau).

## 8. La version CrazyGames (25/10)

- **La fabriquer** : `VITE_PORTAIL=crazygames npm run build`. `PORTAIL` (`src/portail.ts`) vaut alors `'crazygames'`.
- **Ce qui change** : pas de comptes ni de classement à nous (`AVEC_COMPTES` faux : CrazyGames a les siens), pas d'application à installer (`AVEC_INSTALLATION` faux : ni service worker, ni carte « Installer »), et les **publicités récompensées passent par leur SDK** (v3, chargé par `initialiserPortail`). Le jeu prévient le SDK quand le joueur joue ou est dans un menu (`gameplayStart` / `gameplayStop`) et aux grands moments (`happytime` : un passage de niveau).
- **Sans SDK** (en local, ou sur Vercel) : tout reste comme avant, avec la fausse publicité de 30 s.
- **Ce qui le rend possible** : le stockage sûr (`stockage.ts` : le `localStorage` est souvent interdit dans la page d'un autre site), les chemins relatifs (`base: './'`, `import.meta.env.BASE_URL`), les polices servies par le jeu (`@fontsource`, plus de Google Fonts).
- ⚠️ Les noms des fonctions du SDK sont ceux de leur documentation v3 : **pas encore testé avec le vrai SDK**, à revérifier au moment de publier. Voir [../revue-crazygames.md](../revue-crazygames.md).

## 9. Conventions de code

- **Tout en français dans le code** : noms de variables, de fonctions et de fichiers, commentaires. Seuls les mots-clés et API de TypeScript/React restent en anglais. **Tout texte affiché passe par `t()`** (section 6).
- Code lisible et commenté pour des débutants, noms explicites, pas d'astuces obscures.
- **Séparation stricte** : les règles du jeu sont dans `src/jeu/` (aucun import de React ni du DOM). Les composants lisent l'état (`useJeu()`) et appellent les actions, sans règle du jeu.
- Aléatoire injectable (section 5), stockage injectable (`Stockage`) et **toujours `stockage` de `src/stockage.ts`, jamais `window.localStorage`**.
- **Les fenêtres** passent par `Fenetre.tsx` ; les **boutons** suivent les couleurs de `src/styles/theme.css` ; les **alertes** : un état = une bulle sur le bâtiment, un conseil = la liste des tâches, un événement = un message.
- **Téléphone** : jouable au pouce (gros boutons ronds en bas, fenêtres qui montent du bas, rien qui déborde, cibles d'au moins 40 px, texte d'au moins 12 px, aucune info seulement dans un `title=`).
- **Chemins** des fichiers de `public/` : avec `import.meta.env.BASE_URL`, jamais `/images/...`.
- Changer le format de `EtatJeu` → augmenter `VERSION_ETAT` et écrire une conversion dans `sauvegarde.ts` (ne jamais faire perdre sa partie à un joueur).
- Modifier un bâtiment → mettre à jour sa fiche dans `docs/batiments/`. Étape importante → mettre à jour `CONTEXTE.md`.
- Toute nouvelle table Supabase a ses règles RLS ; jamais de clé `service_role` / secrète dans le code.
- Garder le bot de simulation et ses repères d'équilibrage (section 7).

## 10. Workflow Git, PR et Vercel

- Code sur GitHub, à deux développeurs. Branche principale : `main`. **Jamais de push direct sur `main`** : une branche par modification, puis une Pull Request.
- Avant la PR : `npm test`, `npm run lint` et `npm run build` au vert.
- Règle décidée le 19/10 : à chaque modification demandée, une fois tout au vert, on crée la PR **et on la fusionne** dans `main`, pour que la nouvelle version soit en ligne tout de suite.
- Vercel : chaque push sur `main` déploie la production, et chaque PR a son lien de preview.
- Les scripts SQL de `supabase/` ne sont pas déployés automatiquement.
- **La version affichée** : `vite.config.ts` définit au build `__VERSION_JEU__` = `"<commit> · <date du build>"`, affichée en petit sur l'écran d'accueil. À ne pas confondre avec `VERSION_ETAT` (format de la sauvegarde, actuellement 29).
