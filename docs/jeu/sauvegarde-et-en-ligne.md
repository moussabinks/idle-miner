# Sauvegarde, comptes en ligne et classement

> Comment Mega Digger garde la progression du joueur : dans le navigateur (`localStorage`, par `src/stockage.ts`), et en option en ligne sur Supabase (compte, synchronisation, classement).
> **Grande mise à jour du 25/10 (version 29)** : une ancienne partie est **convertie** (`convertirVersion28` : son sac est vendu, le bazar remboursé, son village recalé sur la clairière de 40 × 40, ses améliorations ramenées à 5 niveaux, 10 gemmes offertes : voir 1.5), le stockage passe par `src/stockage.ts` (il ne plante plus jamais), le classement compte l'**argent gagné en tout**, et la version **CrazyGames** n'a ni comptes ni classement.
> **La grosse mise à jour des gemmes du 26/10 (version 30)** : la mine a 7 niveaux et le diamant descend au niveau 7 ; une partie de la version 29 est **convertie** (`convertirVersion29` : ses diamants deviennent des saphirs, la fonderie et la joaillerie arrivent vides : voir 1.5).
> Rédigé d'après le code au 22/10 (la mine automatique, version 21), mis à jour le 24/10 (les trajets des wagonnets, version 22) et le 26/10 (les pousseurs embauchés pour un trajet, version 23 ; le classement remis à zéro), puis le 29/10 (le niveau du joueur, version 24) et le 30/10 (l'ascenseur dès le début, les bonus de combo, la fenêtre du retour, version 25). Fichiers concernés : `src/jeu/sauvegarde.ts`, `src/jeu/mineur.ts` (type `EtatJeu`), `src/jeu/village.ts` (type `Village`), `src/usePartie.ts`, `src/jeu/absence.ts`, `src/composants/FenetreAbsence.tsx`, `src/jeu/compte.ts`, `src/enLigne.ts`, `src/useCompte.ts`, `src/jeu/classement.ts`, `src/composants/CarteClassement.tsx`, `src/composants/CarteCompte.tsx`, `src/composants/Accueil.tsx`, `supabase/schema.sql`, `supabase/classement.sql`, `supabase/classement-remise-a-zero.sql`.

Principe général : **le stockage du navigateur est la sauvegarde principale.** Le jeu y écrit au plus une fois par seconde (et en quittant la page) et marche entièrement sans réseau. Règle du projet : on passe toujours par `stockage` (`src/stockage.ts`), jamais par `window.localStorage` directement. Le compte en ligne est facultatif : il recopie tous les mondes du navigateur sur Supabase pour les retrouver sur un autre appareil, et envoie le score au classement.

---

## 1. La sauvegarde locale (`src/jeu/sauvegarde.ts`)

### 1.1 Le stockage injectable, et le stockage sûr (25/10)

Toutes les fonctions de `sauvegarde.ts` reçoivent un `Stockage` en paramètre (le strict nécessaire de l'API `localStorage` : `getItem`, `setItem`, `removeItem`). Dans les tests, c'est un faux stockage en mémoire (une `Map`).

En jeu, c'est **`stockage`** de **`src/stockage.ts`** (25/10). Dans certains cas, le navigateur interdit le `localStorage` (navigation privée, jeu ouvert dans une page d'un autre site comme CrazyGames, réglages de confidentialité) : rien que **lire** `window.localStorage` levait alors une erreur, et le jeu ne démarrait pas (écran blanc). `stockage.ts` essaie **une fois** d'écrire et d'effacer une clé d'essai : si ça marche, il se sert du `localStorage` ; sinon, il garde tout **en mémoire** (la partie marche, mais elle sera perdue en fermant la page ; `stockagePersistant` vaut alors `false`). `lireReglage` et `ecrireReglage` lisent et écrivent un petit réglage sans jamais lever d'erreur. Plus tard, la version CrazyGames pourra le remplacer par le stockage de leur SDK.

### 1.2 Toutes les clés du `localStorage`

| Clé | Contenu | Écrit par |
|---|---|---|
| `idle-miner-mondes` | La liste des mondes (tableau JSON d'`InfoMonde`, voir 1.3) | `sauvegarde.ts` |
| `idle-miner-monde-<id>` | La partie du monde `<id>` : l'objet `EtatJeu` en JSON | `sauvegarde.ts` (`sauvegarder`) |
| `idle-miner-monde-<id>-horodatage` | L'heure de la dernière sauvegarde de ce monde (`Date.now()` en millisecondes, en texte) | `sauvegarde.ts` (`sauvegarder`) |
| `idle-miner-derniere-synchro` | Le dernier échange avec un compte en ligne : `{ joueur, envoyeeLe }` en JSON (voir 2.4) | `src/jeu/compte.ts` |
| `idle-miner-son` | Bruitages : `'actif'` ou `'coupe'` (actif par défaut) | `src/sons.ts` |
| `idle-miner-musique` | Musique et ambiances : `'actif'` ou `'coupe'` | `src/ambiance.ts` |
| `idle-miner-langue` | (25/10) La langue choisie : `'fr'` ou `'en'` (sans elle, celle du navigateur) | `src/langueNavigateur.ts` |
| `idle-miner-installation-masquee` | `'oui'` si le joueur a masqué la carte « Installer l'application » (« Plus tard ») | `src/composants/CarteInstallation.tsx` |
| `idle-miner-sauvegarde` | **Ancienne clé** (avant le 19/10, une seule partie). Reprise puis effacée, voir 1.4 | — |
| `idle-miner-horodatage` | **Ancienne clé** de l'heure de sauvegarde. Reprise puis effacée | — |

La session Supabase (compte connecté) est aussi gardée dans le navigateur, mais par la bibliothèque `@supabase/supabase-js` elle-même, pas par notre code.

### 1.3 Les 5 mondes

Un « monde » est une partie séparée (jusqu'à `NB_MONDES_MAX = 5`). On les gère sur l'écran d'accueil (`src/composants/Accueil.tsx`).

Type `InfoMonde` (une entrée de `idle-miner-mondes`) :

| Champ | Type | Sens |
|---|---|---|
| `id` | texte | `"1"`, `"2"`... Un nouveau monde prend le plus grand id existant + 1 (les ids ne sont pas réutilisés tant qu'un id plus grand existe) |
| `nom` | texte | Nom choisi (24 caractères max dans le champ de saisie). Laissé vide à la création, l'accueil propose `Monde <nombre de mondes + 1>` (et `creerMonde` met `Monde <id>` si le nom reçu est vide) |
| `couleur` | nombre 0 à 4 | Couleur de la carte du monde : la première couleur libre. Les 5 couleurs sont dans `COULEURS_MONDES` de `Accueil.tsx` |
| `creeLe` | nombre (ms) | Date de création |
| `joueLe` | nombre (ms) | Dernière fois que le monde a été ouvert |

Fonctions :

| Fonction | Ce qu'elle fait |
|---|---|
| `listerMondes(stockage)` | Renvoie les mondes triés du plus récemment joué au plus ancien. Si `idle-miner-mondes` n'existe pas encore, fait la reprise de l'ancienne partie unique (1.4) et écrit la liste |
| `peutCreerMonde(stockage)` | Vrai s'il y a moins de 5 mondes |
| `creerMonde(stockage, nom, etat)` | Ajoute un monde avec cette partie (et la sauvegarde). Renvoie `null` s'il y en a déjà 5 |
| `renommerMonde(stockage, id, nom)` | Renomme (ignoré si le nom est vide après `trim`) |
| `dupliquerMonde(stockage, id)` | Crée une copie nommée `<nom> (copie)` avec la même partie (soumis à la limite de 5) |
| `supprimerMonde(stockage, id)` | Retire le monde de la liste et efface ses clés `idle-miner-monde-<id>` et `-horodatage` |
| `marquerJoue(stockage, id)` | Met `joueLe` à maintenant (le monde remonte en tête de liste) |
| `sauvegarder(stockage, id, etat)` | Écrit l'`EtatJeu` en JSON et l'horodatage |
| `charger(stockage, id)` | Lit la partie et convertit une partie des versions 21 à 29 (`convertirVersion21` … `convertirVersion29`), puis vérifie qu'elle est **à la version actuelle (30)** et valide (1.5), et enlève les tenues, les décorations et la trésorerie des vieilles parties. Renvoie `null` si absente, illisible, invalide ou **d'avant la version 21** (les parties d'avant la mine automatique repartent de zéro) |
| `partieAncienne(stockage, id)` | Vrai si le monde contient une partie lisible d'une version plus ancienne que la 21 (avant la mine automatique) : l'accueil prévient qu'elle repart de zéro |
| `secondesDepuisSauvegarde(stockage, id)` | Secondes écoulées depuis l'horodatage (0 si inconnu) |

Sur l'écran d'accueil, chaque carte de monde affiche (via `charger`) le niveau de la mine, l'argent, le nombre de mineurs, le nombre de blocs cassés et « Joué il y a ... ». Si `charger` renvoie `null`, la carte affiche « 🏡 Partie de l'ancienne version : elle repart de zéro avec la nouvelle mine automatique. » quand `partieAncienne` est vrai, sinon « Partie illisible : elle recommencera à zéro. » Boutons : Jouer, Renommer, Dupliquer (grisé à 5 mondes), Supprimer (avec confirmation). Le gros bouton « ▶ Jouer » du haut reprend le monde joué le plus récemment (avec « · nouveau village » si sa partie ne se lit plus) ; s'il n'y a aucun monde, il devient « ⛏️ Commencer » et crée un premier monde.

Dans le jeu, le lien « Recommencer à zéro » (avec confirmation) remplace la partie du monde en cours par une partie neuve (village et succès compris) ; le bouton « 🌍 <nom du monde> » revient à l'accueil.

### 1.4 Reprise de l'ancienne partie unique (avant le 19/10)

Au premier `listerMondes` (quand `idle-miner-mondes` n'existe pas), si l'ancienne clé `idle-miner-sauvegarde` existe : son contenu est copié dans `idle-miner-monde-1` (et `idle-miner-horodatage` dans `idle-miner-monde-1-horodatage`), les anciennes clés sont effacées, et la liste reçoit `{ id: '1', nom: 'Monde 1', couleur: 0 }` datée de l'ancien horodatage.

### 1.5 La version de l'état (la remise à zéro du 22/10, puis les conversions)

`VERSION_ETAT = 30` (dans `src/jeu/mineur.ts`, depuis le 26/10 : **la grosse mise à jour des gemmes**). L'histoire : 29 le 25/10 (**la grande mise à jour**) ; 28 le 23/10 (le chariot de chaque pousseur) ; 27 le 23/10 (la pioche en émeraude des mineurs) ; 26 le 23/10 (la pioche en émeraude du joueur) ; 25 le 30/10 (l'ascenseur dès le début, les bonus de combo, le résumé de l'absence) ; 24 le 29/10 (le niveau du joueur) ; 23 le 26/10 (les pousseurs embauchés pour un trajet) ; 22 le 24/10 (les trajets des wagonnets) ; 21 le 22/10 (**la mine automatique**, `VERSION_MINE_AUTOMATIQUE`). Chaque partie sauvegardée porte son champ `version`. À la lecture, `charger` la passe dans les conversions, l'une après l'autre : `convertirVersion29(convertirVersion28(… convertirVersion21(donnees)))` (une partie v21 devient v22, puis v23… jusqu'à v30), puis vérifie avec `estUnEtatValide()` qu'elle est **exactement à la version actuelle (30)** avec tous les champs attendus ; sinon il renvoie `null`. **Règle du projet : ne jamais faire perdre sa partie à un joueur** : un changement de format = une conversion.

**La conversion 29 → 30** (26/10, `convertirVersion29` dans `sauvegarde.ts`, la grosse mise à jour des gemmes) : la mine passe de 5 à 7 niveaux. Le saphir arrive au niveau 5, le rubis au 6, et le diamant descend tout au fond, au niveau 7.

- **Le niveau de la mine ne change pas** : une partie au niveau 5 (avant « Cœur de diamant ») y reste ; c'est maintenant la **Caverne de saphir**. Ses améliorations aussi gardent leur niveau.
- **Ses diamants deviennent des saphirs, partout** (même nombre) : le coffre de la mine, le chariot de la foreuse, le chargement des wagonnets, les sacs des mineurs et la caisse de l'ascenseur. Ce qu'elle gardait (📌, `coffre.garder`) et ce qu'un trajet laissait (`exclus`) passent aussi du diamant au saphir, et le bloc à cliquer, s'il était un diamant, devient un saphir.
- **La pioche en diamant devient la pioche en saphir** (la sienne et celles des mineurs) : c'est le même niveau (index 4 dans `PIOCHES` et `NIVEAUX_EMPLOYE`), avec les mêmes chiffres : il n'y a rien à changer.
- **La fonderie et la joaillerie arrivent, vides** (`fonderie` et `joaillerie` = `nouvelAtelier()`), pas encore posées au village.
- Elle garde son XP et ses records ; ses succès aussi (« Diamants ! » et « Cœur de diamant », gagnés avec l'ancien niveau 5, restent).

Les tests de `sauvegarde.test.ts` le vérifient.

**La conversion 28 → 29** (25/10, `convertirVersion28` dans `sauvegarde.ts`, la grande mise à jour) :

- **Plus de sac à dos** : ce qu'il contenait (`inventaire`) est **vendu** au prix du marché (l'argent compte aussi dans l'argent gagné). Les champs `inventaire`, `nonAVendre` (les objets gardés du marché) et `niveauSac` sont retirés.
- **Plus de bazar** : il est enlevé du village (et des bâtiments déjà vus), et son prix (**200 $**) est **remboursé**. Un employé qui était au bazar est replacé à la mine.
- **La clairière passe de 60 × 60 à 40 × 40 cases** : tout le village **recule de 10 cases** (la mine reste au milieu, en 15, 15). Un bâtiment qui ne tient plus là où il était est **reposé à la place libre la plus proche de la mine** (`placeLibrePres`) ; un rail qui sort de la clairière est enlevé et **ses 3 fer reviennent dans le coffre** ; un chemin qui sort est enlevé.
- **Toutes les améliorations ont 5 niveaux** (avant : jusqu'à 10) : chaque ancien niveau devient le niveau le plus proche (tables `ANCIENNE_ASCENSEUR`, `ANCIENNE_PIOCHE_MINEUR`, `ANCIEN_CHARIOT_POUSSEUR`, `ANCIENNE_FOREUSE`, `ANCIEN_MANAGER`) ; le recruteur est ramené à 3 niveaux au plus, la vitesse d'un pousseur à 5.
- **Les nouveautés** : **10 gemmes offertes** (`GEMMES_CADEAU`), aucun bonus en cours, la série du cadeau du jour à zéro.
- **Le tutoriel a changé** : une partie déjà commencée **ne le refait pas**.
- **L'XP** : la partie garde son XP (son niveau est plafonné à 15), mais ses records repartent de ce qu'elle a (`recordsDeDepart`) : les prix ont changé, seul ce qu'elle fera ensuite rapporte de l'XP.

Les tests de `sauvegarde.test.ts` vérifient chaque point.

**La conversion 21 → 22** (24/10, `convertirVersion21` dans `sauvegarde.ts`) : l'ancien wagonnet unique (`wagonnet`) est retiré. Sa taille devient `niveauWagonnets` (gardée pour tous les wagonnets). Si les rails reliaient la mine au marché, la partie reçoit le trajet Mine → Marché (`trajets`), sinon aucun trajet. Les mineurs qui poussaient le wagonnet retournent au quai. La partie passe en version 22 (puis la conversion suivante la passe en 23). Un test de `sauvegarde.test.ts` le vérifie.

**La conversion 22 → 23** (26/10, `convertirVersion22` dans `sauvegarde.ts`) : chaque employé reçoit le champ `trajet`. Un ancien **pousseur** prend le trajet **Mine → Marché** s'il existe, sinon le premier trajet qui part de la mine (ou `null` s'il n'y en a aucun) ; un **mineur** reçoit `null`. Un mineur resté au quai (étape `quai`) redescend creuser tout seul au jeu suivant (`travailler` dans `employes.ts`). Un test de `sauvegarde.test.ts` le vérifie (un pousseur et un mineur : `['mine-marche', null]`).

**La conversion 23 → 24** (29/10, `convertirVersion23` dans `sauvegarde.ts`) : la partie reçoit les champs `xp` et `recordsXp` du **niveau du joueur** (voir [niveaux.md](niveaux.md)). Pour que rien de ce qu'elle possède ne soit « trop en avance », elle reçoit **l'XP du niveau qu'il faut pour tout ce qu'elle a déjà** (ses bâtiments, ses rails, son niveau de mine, son coffre, ses pioches, son sac, son ascenseur, la pioche de ses mineurs, ses wagonnets, son générateur, sa foreuse, son recruteur, son manager : `niveauPourCeQuOnA` et `donnerXpAVieillePartie` dans `niveaux.ts`). Ses records d'XP partent de ce qu'elle a : seul ce qu'elle fera ensuite rapporte de l'XP. La conversion 22 → 23 met maintenant `version: 23` (et plus `VERSION_ETAT`), pour que les conversions s'enchaînent. Un test de `sauvegarde.test.ts` le vérifie.

**La conversion 24 → 25** (30/10, `convertirVersion24` dans `sauvegarde.ts`) : depuis le 30/10, une partie neuve a **l'ascenseur de niveau 1 dès le début** (`creerPartie`). Une ancienne partie dont l'ascenseur n'était pas construit (niveau 0, l'échelle) le reçoit donc (`niveau = max(1, niveau)`) ; rien d'autre ne change. Le nouveau champ `bonus` (le bonus de combo en cours) est facultatif : une partie qui ne l'a pas n'a pas de bonus. La conversion 23 → 24 met maintenant `version: 24` (et plus `VERSION_ETAT`), pour que les conversions s'enchaînent. La conversion 24 → 25 met maintenant `version: 25`, pour que les conversions s'enchaînent.

**La conversion 25 → 26** (23/10, `convertirVersion25`) : la **pioche en émeraude** arrive au niveau 3, entre l'or et le diamant, qui passe du niveau 3 au niveau 4. Les clés de `pioches`, `niveauPioche` et `meilleure` à 3 ou plus avancent de 1 : une pioche en diamant reste en diamant (avec son usure). La conversion 25 → 26 met maintenant `version: 26`.

**La conversion 26 → 27** (23/10, `convertirVersion26`) : les **mineurs** ont aussi une pioche en émeraude, au niveau 4 de `NIVEAUX_EMPLOYE`, entre l'or et le diamant (qui passe de 4 à 5). Un mineur à 4 ou plus avance de 1 ; un pousseur ne bouge pas (son `niveau` est celui de `NIVEAUX_POUSSEUR`). La conversion 26 → 27 met maintenant `version: 27`.

**La conversion 27 → 28** (23/10, `convertirVersion27`) : plus de taille des wagonnets pour tous les trajets (`niveauWagonnets` reste dans la partie mais ne sert plus) ; chaque pousseur reçoit le plus grand chariot (`chariot`, `NIVEAUX_CHARIOT_POUSSEUR`) qui ne dépasse pas ce que portait son wagonnet (l'ancienne taille 20/40/70/120 × l'ancien bonus de son niveau ×1 à ×2,5). Son `niveau` devient sa vitesse. Les tests de `sauvegarde.test.ts` attendent `VERSION_ETAT`.

**Avant la version 21, pas de migration** : avec la mine automatique (plus de prestige, de profondeur, de vue en coupe, de réservoir ni de convois), **toutes les parties d'avant repartent de zéro**, village compris (décidé le 22/10 ; l'ancienne migration 18 → 19 a été retirée). Une partie d'une version plus ancienne n'est plus lue : à l'ouverture du monde, `usePartie.ts` crée une partie neuve (`creerPartie`) qui remplace l'ancienne à la première sauvegarde. Le monde lui-même (nom, couleur, place dans la liste) est gardé, et l'accueil le signale avant (`partieAncienne`, voir 1.3). Un test de `sauvegarde.test.ts` vérifie qu'une partie de la version 20 ou moins repart de zéro.

**Le nettoyage du 27/10** (sans changer de version, alors la 23) : les **tenues** du Bazar et les **décorations** du village sont retirées du jeu. Après les conversions et la vérification, `charger` **enlève** d'une ancienne partie les champs `tenue` et `tenuesAchetees`, `village.decorations` et `village.prochainNumero`, et le succès `'paysagiste'` de la liste `succes`. La partie se charge donc sans souci (rien n'est remboursé). Un test de `sauvegarde.test.ts` le vérifie.

**Ajouter une version** : augmenter `VERSION_ETAT` dans `mineur.ts` et compléter `estUnEtatValide()` si un nouveau champ est obligatoire, puis écrire une fonction de conversion (de la version N − 1 à N, avec son test dans `sauvegarde.test.ts`) appelée par `charger`, comme `convertirVersion21` … `convertirVersion28`. Les parties ne repartent plus jamais de zéro (seulement celles d'avant la v21, le 22/10).

Pour mémoire : les versions 1 à 17 (avant le 20/10) avaient une chaîne de migrations (surface et échelle, foreuses, assistant, donjons, prestige, mineurs, recruteur et manager…), retirée du code le 20/10 ; elle reste dans l'historique git.

### 1.6 Ce qui est stocké : `EtatJeu` champ par champ

L'état d'une partie est un objet composé uniquement de nombres, textes, listes et objets simples (aucune classe, aucune fonction) : il est sauvegardé tel quel avec `JSON.stringify`. Défini dans `src/jeu/mineur.ts`.

| Champ | Type | Sens |
|---|---|---|
| `version` | nombre | Version du format (30) |
| `argent` | nombre | Argent en poche |
| `gemmes` | nombre | (25/10) Les gemmes 💎 (voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md)) |
| `boosts` | `{ production?, ventes?, clics? }` | (25/10) Les bonus de la boutique en cours : pour chacun, l'heure de jeu (`stats.tempsDeJeu`) où il s'arrête |
| `quotidien` | `{ dernierJour, serie }` | (25/10) Le cadeau du jour : le dernier jour pris (« 2026-10-25 ») et la série (1 à 7) |
| `niveauMine` | 1 à 7 | Niveau de la mine (26/10 ; 1 à 5 avant) |
| `coffre` | `{ niveau, contenu, garder? }` | Le coffre de la mine : sa taille (index dans `NIVEAUX_COFFRE`), ce qu'il contient, et ce qu'on garde (`garder` : la punaise 📌 = un très grand nombre, `GARDER_TOUT`) |
| `prochainBloc` | `IdBloc` | Le bloc à cliquer, déjà tiré |
| `clics` | nombre | Les clics déjà donnés sur ce bloc (pioche cassée : il en faut 2) |
| `progressionMine` | nombre (0 à 1) | Fraction du prochain bloc que la mine sort toute seule |
| `pioches` | `{ niveau: usure }` | Pioches possédées et leur usure (clics déjà donnés) |
| `niveauPioche` | nombre | Pioche en main |
| `meilleure` | nombre | Plus haut niveau de pioche débloqué |
| `ascenseur` | `{ niveau, navette? }` | L'ascenseur des mineurs (1 à 7 ; 0 = pas construit, seulement dans de très vieilles parties) et sa caisse (`Navette`) |
| `employes` | liste d'`Employe` | Les employés : mineurs, pousseurs et (26/10) joailliers |
| `recruteur` | nombre | Niveau du recruteur (0 = pas embauché) |
| `manager` | `{ embauche, tempsPaye, niveau?, fatigue?, actif? }` | Le manager, qui paie les salaires (son niveau : 0 à 2) |
| `foreuse` | objet `Foreuse` | La foreuse |
| `generateur` | objet `Generateur` | Le générateur |
| `fonderie` | objet `Atelier` | (26/10) La fonderie (même vide, pas encore posée) |
| `joaillerie` | objet `Atelier` | (26/10) La joaillerie (même vide, pas encore posée) |
| `niveauWagonnets` | nombre | (plus utilisé depuis le 23/10) L'ancienne taille des wagonnets, pour tous les trajets |
| `trajets` | liste de `Trajet` | Les trajets de wagonnets créés par le joueur (vide au début) |
| `succes` | liste de textes | Identifiants des succès débloqués |
| `stats` | `Statistiques` | Statistiques de la partie |
| `decouvertes` | liste (`'recruteur'`, `'manager'`) | Nouveautés déjà vues devant le Personnel |
| `village` | objet `Village` | Le village vu du ciel : bâtiments posés, rails, chemins |
| `xp` | nombre | (29/10) L'XP totale gagnée : le niveau du joueur se recalcule à partir d'elle (`niveauDeXp`), il n'est pas rangé |
| `recordsXp` | `{ compteur: nombre }` | (29/10) Le plus haut chiffre déjà compté de chaque chose qui rapporte de l'XP (`clics`, `batiment`, `rail`, `trajet`, `embauche`, `amelioration`, `niveauMine`, `investi`) : on ne regagne pas d'XP en retirant puis en reposant |
| `tutoriel` | nombre (facultatif) | L'étape du tutoriel (0 à 6 ; absent ou au-delà : pas de tutoriel) |
| `bonus` | `{ palier, fin }` ou `null` (facultatif) | (30/10) Le bonus de combo en cours : son palier (10, 25, 50…, voir `BONUS_COMBO`) et l'heure de jeu (`stats.tempsDeJeu`) où il s'arrête. Absent ou `null` : pas de bonus |

(Retirés : `tenue` et `tenuesAchetees` le 27/10, `tresorerie` le 23/10, `inventaire`, `nonAVendre` et `niveauSac` le 25/10.)

**`Foreuse`** : `carburant` (secondes de forage restantes), `niveauVitesse` (index dans `NIVEAUX_FORAGE`), `progression` (0 à 1 du prochain bloc), `blocsFores`, `niveauChariot` (index dans `NIVEAUX_CHARIOT`), `chariot` (inventaire foré), `nonCoches` (objets décochés), `rechargeAuto`.

**`Generateur`** : `niveau` (index dans `NIVEAUX_GENERATEUR`), `carburant` (secondes de courant restantes), `allume` (23/10 : plus de `puiseDansLeCoffre`, ignoré dans les vieilles parties).

**`Atelier`** (26/10, la fonderie et la joaillerie) : `niveau` (index dans `NIVEAUX_FONDERIE` ou `NIVEAUX_JOAILLERIE`), `entree` (le minerai qui attend), `sortie` (la réserve : les lingots ou les bijoux), `progression` (la fonderie : la part du prochain lingot, 0 à 1), `carburant` (la fonderie : secondes de four restantes ; 0 pour la joaillerie), `fabriques` (lingots ou bijoux fabriqués en tout).

**`Trajet`** : `liaison` (`mine-marche`, `mine-foreuse`, `mine-generateur`, `foreuse-marche`, et depuis le 26/10 `mine-fonderie`, `mine-joaillerie`, `foreuse-fonderie`, `foreuse-joaillerie`, `fonderie-marche`, `joaillerie-marche` ; un seul trajet par liaison), `etape` (`quai`, `aller`, `retour`), `distance` (cases déjà parcourues sur cette étape), `chargement` (inventaire), `pousseur` (`'joueur'`, `'electricite'`, le prénom de son pousseur, ou `null`).

**`Employe`** : `nom`, `rarete` (`commun`, `rare`, `epique`, `legendaire`, `mythique`), `niveau` (sa pioche, index dans `NIVEAUX_EMPLOYE`, 0 à 6 ; pour un pousseur, sa vitesse dans `NIVEAUX_POUSSEUR` ; 0 pour un joaillier), `chariot` (un pousseur : index dans `NIVEAUX_CHARIOT_POUSSEUR`), `role` (`mineur`, `pousseur` ou, 26/10, `joaillier`), `trajet` (26/10 : le trajet d'un pousseur, une des 10 liaisons ; `null` pour un mineur ou un joaillier), `etape` (`creuse`, `monte`, `vide`, `descend`, `quai`, `pousse`, `marche`, `forge`, `attend`, et `taille` pour un joaillier à son établi), `progression` (blocs en creusant, secondes, ou la part du bijou en cours pour un joaillier), `sac` (pour un joaillier : la gemme qu'il taille), `blocsCasses`, `tempsPaye` (secondes de travail déjà payées), `lieu` (le bâtiment où il est, ou vers lequel il marche), `depuis` (celui d'où il part), `forgeEnAttente`.

**`Village`** (`src/jeu/village.ts`) : `batiments` (liste de `{ id, x, y, miroir }` : le coin du haut de l'emprise sur la grille de 40 × 40 cases ; la mine est posée d'office en 15, 15), `rails` et `chemins` (listes de cases écrites `"x,y"`), `batimentsVus` (bâtiments débloqués déjà vus dans le menu : pastille « Nouveau »).

**`Statistiques`** : `blocsCasses`, `blocsMine`, `argentGagne`, `argentForeuse`, `argentWagonnet`, `blocsParType`, `blocsForeuse`, `blocsMineurs`, `diamantsTrouves`, `salairesPayes`, `tempsDeJeu`, `voyagesWagonnet`, `pubsVues` (25/10, facultatif) (voir [mine-et-minage.md](mine-et-minage.md#9-les-statistiques-srcjeustatistiquests-fenêtre-)).

`estUnEtatValide()` vérifie : `version === 30` (`VERSION_ETAT`), et la présence/le type de `argent`, `niveauMine`, `coffre`, `pioches`, `gemmes` (25/10), `stats`, `succes`, `ascenseur`, `foreuse`, `generateur`, `fonderie` et `joaillerie` (26/10), `niveauWagonnets` (nombre), `trajets` (liste), `employes`, `recruteur`, `manager`, `decouvertes`, `village` (avec sa liste `batiments`) et `xp`.

### 1.7 Quand le jeu sauvegarde (`src/usePartie.ts`)

- **Au plus une fois par seconde** : un `useEffect` appelle `sauvegarder(stockage, idMonde, etat)` quand `etat` change, s'il s'est passé au moins 1 s depuis la dernière fois (l'horloge change l'état toutes les 50 ms : la mine tourne toujours). Il n'y a pas de bouton « Sauvegarder ».
- **En quittant la page** (`pagehide`) et en quittant le monde : une dernière sauvegarde.
- Une partie neuve (« Recommencer à zéro », ou monde sans partie lisible) remplace l'ancienne par cette même sauvegarde automatique.

### 1.8 Retour au jeu après une absence

À l'ouverture d'un monde (`chargerOuCreer` dans `usePartie.ts`) :

1. `marquerJoue` (le monde remonte en tête de liste).
2. `charger` ; si `null` (pas de partie, partie abîmée, ou partie d'une ancienne version), une partie neuve est créée (`creerPartie`) : le joueur est au village, devant la mine, avec 80 $, et le tutoriel commence.
3. Sinon, l'absence = `secondesDepuisSauvegarde`, plafonnée à **8 heures** (`ABSENCE_MAX`). Moins de 30 s : rien à rattraper.
4. Avant de rattraper le temps, on prend une « photo » de la partie (`photoPartie` dans `src/jeu/absence.ts`, 30/10 : blocs des mineurs, de la mine et de la foreuse, coffre, chariot, argent, voyages de wagonnet).
5. `avancerTemps(etat, absence)` est appelé avec toute la durée (il avance par morceaux d'une minute) : la mine toute seule, le générateur, la foreuse, les mineurs employés (et le manager), la fonderie et les joailliers (26/10) et les wagonnets (poussés par un mineur ou électriques) avancent (voir `src/jeu/temps.ts`).
6. `resumerAbsence(avant, etat, absence)` compare la partie avant et après (`ResumeAbsence`) : le temps passé, les blocs creusés par les mineurs, sortis par la mine toute seule et forés par la foreuse, les blocs en plus dans le coffre, l'argent gagné (les wagonnets), les voyages, et les mineurs qui attendent leur salaire. S'il ne s'est rien passé, `null`.
7. Le résumé s'affiche dans une grande fenêtre (`FenetreAbsence.tsx`, devant tout le reste) : **« Bon retour, mineur ! »**, « Pendant ton absence (2 h 13), ta mine a continué de tourner : », une ligne par chose non nulle (👷 Tes mineurs ont creusé…, ⛏️ La mine a sorti toute seule…, ⚙️ La foreuse a foré…, 🚃 Tes wagonnets ont vendu…), puis en grand le **bénéfice net** (25/10, demandé par le propriétaire : l'argent en plus dans la poche, salaires déduits ; avant, c'était le chiffre d'affaires). Au retour, le **coffre de la mine est vendu tout seul** (`vendreCoffreAuRetour`, sauf ce qu'on garde 📌), et depuis le 26/10 la **réserve de la fonderie et de la joaillerie** aussi (« 📦 coffre vendu au retour » compte les deux). Les lignes de l'argent tombent juste : 🚃 ventes des wagonnets + 📦 coffre vendu au retour + 💰 autres ventes (surtout le manager qui vend du coffre pour payer les salaires) − 💵 salaires payés = bénéfice net (`resume.net`), les employés sans salaire, et le temps que le manager couvre. Deux boutons : **📺 Doubler · +X $** (une publicité, puis `doublerAbsence` encaisse une deuxième fois ces gains ; voir [gemmes-et-recompenses.md](gemmes-et-recompenses.md)) et **Continuer**. Le cadeau du jour, s'il est disponible, s'ouvre après.

Les clics du joueur, eux, ne continuent pas.

### 1.9 Hors ligne

- Sans réseau, tout marche : la partie est dans le stockage du navigateur.
- Le jeu s'installe comme une application (PWA) : `public/manifest.webmanifest`, et un service worker `public/sw.js` enregistré **seulement en production, et pas dans la version CrazyGames** (`src/installation.ts`, `AVEC_INSTALLATION` dans `src/portail.ts`). Depuis le 25/10, les chemins des fichiers sont relatifs (`base: './'`) : le jeu marche aussi servi dans un sous-dossier. Il met en cache la page (réseau d'abord, cache si pas de réseau), les fichiers `/assets/` (cache d'abord) et les icônes, le manifeste et les **images du village** (`public/images/`, rangées dès l'installation ; cache `idle-miner-v67` au 25/10 ; cache puis mise à jour). Les requêtes vers Supabase ne sont jamais mises en cache.
- Connecté mais sans réseau : le compte passe en statut « hors-ligne » et réessaie tout seul (voir 2.5).

---

## 2. Les comptes en ligne

> **Pas dans la version CrazyGames** (25/10) : avec `VITE_PORTAIL=crazygames`, `AVEC_COMPTES` (`src/portail.ts`) est faux : ni carte du compte, ni classement à l'accueil (CrazyGames a les siens). Tout ce qui suit concerne la version Vercel.

### 2.1 Configuration de Supabase

- Supabase est le seul « backend » : une base Postgres et un service de comptes hébergés. Pas de serveur à nous.
- L'adresse du projet et la clé **publishable** (publique par conception, visible dans le navigateur) sont configurées dans `src/enLigne.ts` : valeurs par défaut écrites dans le code, remplaçables par les variables d'environnement Vite `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (fichier `.env`). L'identifiant du projet est aussi noté dans `CONTEXTE.md` (section Infra).
- La sécurité repose sur les **règles RLS** de la base (section 4), pas sur le secret de la clé. La clé `service_role` / secrète ne doit jamais apparaître dans le code.
- Réglage à faire dans le tableau de bord Supabase : **Authentication → Email → décocher « Confirm email »** (les adresses sont fabriquées, aucun email ne peut arriver). Sinon la création de compte renvoie un message demandant de le désactiver.
- Les scripts SQL `supabase/schema.sql` puis `supabase/classement.sql` sont à coller une fois dans le SQL Editor de Supabase. Depuis le 26/10, aussi une fois : `supabase/classement-remise-a-zero.sql`, qui efface les anciens scores du classement (voir 3.4).

### 2.2 Pseudo et mot de passe (`src/jeu/compte.ts`)

| Règle | Valeur |
|---|---|
| Pseudo | 3 à 16 caractères (`PSEUDO_MIN`, `PSEUDO_MAX`) après `trim`, uniquement `A-Z a-z 0-9 _ -` (lettres sans accent) |
| Mot de passe | au moins 6 caractères (`MOT_DE_PASSE_MIN`) |
| Email fabriqué | `emailDuPseudo(pseudo)` = `<pseudo en minuscules>@joueurs.idle-miner.app` (`DOMAINE_COMPTES`). « Noah » et « noah » sont donc le même compte |
| Pseudo affiché | gardé avec sa casse dans les métadonnées du compte Supabase (`user_metadata.pseudo`) |

Pas d'email réel : **un mot de passe oublié ne peut pas être récupéré** (c'est écrit sur la carte du compte).

Les messages d'erreur de Supabase sont traduits dans `enLigne.ts` (`traduireErreur`) : identifiants incorrects, pseudo déjà pris, confirmation email demandée, trop d'essais, serveur injoignable, sinon « Erreur du serveur : ... ».

### 2.3 Les fonctions réseau (`src/enLigne.ts`)

C'est le seul fichier qui parle à Supabase.

| Fonction | Ce qu'elle fait |
|---|---|
| `joueurConnecte()` | Le joueur dont la session est encore ouverte dans ce navigateur (`{ id, pseudo }`) ou `null` |
| `creerCompte(pseudo, mdp)` | `auth.signUp` avec l'email fabriqué et `pseudo` en métadonnée. Renvoie le joueur, ou un message d'erreur |
| `seConnecter(pseudo, mdp)` | `auth.signInWithPassword` |
| `seDeconnecter()` | `auth.signOut` |
| `telechargerMondes(joueur)` | Lit la ligne du joueur dans `sauvegardes` → `{ parties, envoyeeLe }` ou `null`. Lance une erreur si le serveur ne répond pas |
| `envoyerMondes(joueur, parties)` | `upsert` de `{ joueur, parties, envoyee_le: Date.now() }`. Renvoie l'heure d'envoi |
| `envoyerScore(joueur, score)` | `upsert` de `{ joueur, pseudo, prestige, argent }` dans `classement` |
| `lireClassement(nombre)` | (23/10) Les `nombre` premiers, triés par argent décroissant puis niveau de mine. `placeDuScore(argent, pseudo)` : combien de joueurs devant, et celui juste devant. Seulement les lignes avec un vrai niveau de mine (`prestige` ≤ 5, `NIVEAU_MINE_MAX`) et mises à jour depuis le 22/10 (`modifie_le` ≥ `DEBUT_MINE_AUTOMATIQUE` = 2026-10-22) : voir 3.4. Lisible sans compte |

### 2.4 Ce qui est envoyé : la copie de tous les mondes

`exporterTout(stockage)` (dans `sauvegarde.ts`) fabrique une `SauvegardeComplete` = un objet « clé du localStorage → texte brut » contenant `idle-miner-mondes` et, pour chaque monde de la liste, `idle-miner-monde-<id>` et `idle-miner-monde-<id>-horodatage`. Copie vide s'il n'y a pas de liste. Les réglages (son, musique...) ne sont pas inclus. Les parties sont envoyées telles quelles (avec leur numéro de version) : c'est `charger` qui les lit sur l'appareil qui les reçoit. Une partie d'une version plus ancienne récupérée en ligne n'est pas lue non plus : elle repart de zéro à l'ouverture du monde, comme dans le navigateur (puis la partie neuve est renvoyée en ligne au prochain envoi).

`importerTout(stockage, copie)` **supprime tous les mondes du navigateur**, puis écrit les clés de la copie qui commencent par `idle-miner-monde` (par prudence, aucune autre clé).

`mondesDeLaCopie(copie)` lit la liste des mondes d'une copie (vide si abîmée).

Côté serveur, une ligne par joueur : `parties` (cette copie, en `jsonb`) et `envoyee_le` (l'heure d'envoi du client, en ms).

### 2.5 La synchronisation (`src/useCompte.ts`)

Le hook `useCompte()` est créé une fois dans `App` et reste vivant pendant la partie. Il expose `joueur`, `statut`, `envoyeeLe`, `versionMondes`, `connecter`, `deconnecter`, `envoyerMaintenant`.

Statuts (`StatutCompte`) :

| Statut | Sens | Affichage (`CarteCompte.tsx`) |
|---|---|---|
| `chargement` | On regarde si une session est ouverte | « ☁️ Recherche de ton compte… » |
| `deconnecte` | Pas de compte | Formulaire pseudo + mot de passe, boutons « Se connecter » et « Créer un compte » |
| `synchro` | Échange en cours | « ☁️ Synchronisation de tes mondes… » |
| `a-jour` | Tout est envoyé | « ☁️ Mondes sauvegardés en ligne (dernier envoi : HH:MM) » |
| `hors-ligne` | Le serveur ne répond pas | « ⚠️ Serveur injoignable : tes mondes restent dans ce navigateur, on réessaie tout seul. » |

Pendant `chargement` et `synchro`, les boutons pour lancer une partie sur l'accueil sont **désactivés** (les mondes pourraient être remplacés).

**Quand ça se passe :**

- **Au lancement** : si une session est ouverte (`joueurConnecte`), premier échange (`synchroniser`). Sinon `deconnecte`.
- **À la connexion / création de compte** (`connecter`) : vérification locale du pseudo et du mot de passe, appel Supabase, puis premier échange.
- (30/10) **Nouveau serveur** : jusqu'au 31/12/2026, l'accueil dit aux joueurs sans compte de recréer leur compte (`annoncerNouveauServeur`) : les comptes de l'ancien projet Supabase sont perdus, pas les mondes.
- **Toutes les 10 minutes** (`INTERVALLE_ENVOI` ; 30/10 : avant 20 s, trop d'écritures pour la base gratuite) tant qu'on est connecté : envoi des mondes **seulement s'ils ont changé** (comparaison avec le texte du dernier envoi). Si le premier échange n'a pas encore réussi, il est retenté à la place.
- **Quand la page passe en arrière-plan** (`visibilitychange` → `hidden`) : un envoi.
- **En quittant un monde** (bouton du monde, retour à l'accueil) : `envoyerMaintenant()`.
- **À la déconnexion** : un dernier envoi, puis `signOut` et remise à zéro de l'état du hook.

Aucun envoi n'a lieu avant la fin du premier échange (`pret`), pour ne pas écraser les mondes du compte avant de les avoir regardés. Un seul échange à la fois (`occupe`).

**Le premier échange et les conflits** — `choisirSynchro(local, enLigne, joueur, derniere)` dans `compte.ts` décide :

| Situation | Choix |
|---|---|
| Aucun monde en ligne, des mondes dans le navigateur | `envoyer` |
| Aucun monde nulle part | `rien` |
| Des mondes en ligne, aucun dans le navigateur | `recuperer` |
| Les deux ont des mondes, et `idle-miner-derniere-synchro` dit que **ce navigateur** a fait le dernier échange avec **ce compte** et que l'heure `envoyeeLe` en ligne est la même (personne n'a envoyé depuis) | `envoyer` (les mondes du navigateur sont la suite de ceux en ligne) |
| Les deux ont des mondes, sinon (un nouveau navigateur, un autre appareil a joué depuis, ou un autre compte) | `recuperer` |

(29/10, demandé par le propriétaire) **Plus de question** : connecté, c'est toujours la sauvegarde du compte qui gagne, sur tous les appareils, et les mondes de ce navigateur sont remplacés sans rien demander. Avant, ce cas donnait `demander` et la fenêtre « ☁️ Quels mondes garder ? » (`FenetreQuelsMondes.tsx`, retirée).

- `recuperer` : `importerTout` (les mondes du navigateur sont remplacés), on note la dernière synchro, `versionMondes` augmente (l'accueil redessine les cartes), puis on envoie le score.
- `envoyer` : envoi forcé de tous les mondes du navigateur (ceux du compte sont écrasés).

Il n'y a **pas de fusion monde par monde** : c'est toujours l'ensemble des mondes d'un côté qui remplace l'autre. Après chaque envoi ou récupération réussi, `idle-miner-derniere-synchro` = `{ joueur: <id du compte>, envoyeeLe }`.

---

## 3. Le classement

### 3.1 Le score (`src/jeu/classement.ts`)

- `Score = { prestige, argent }`. Depuis le 22/10, le champ `prestige` contient **le niveau de la mine** (1 à 5, puis 1 à 7 depuis le 26/10) : le serveur garde ce nombre dans sa colonne `prestige` (celle de l'ancien classement), sans changer la table. (27/10) Il n'est plus affiché dans le classement : toute la place va au pseudo, et le bouton « Visiter » est plus petit.
- `meilleurScore(copie)` : pour chaque monde de la copie de tous les mondes, relit la partie avec `charger` et garde **le meilleur niveau de mine** et **le plus d'argent gagné**, chacun séparément (ils peuvent venir de deux mondes différents). Une partie d'une ancienne version (`charger` renvoie `null`) ne compte pas. Comme le serveur garde toujours le **meilleur** score envoyé (4.2), les anciens scores ne baissent pas avec la remise à zéro du 22/10 : un joueur qui avait atteint le prestige 8 garde « 8 » dans la colonne `prestige`, plus que le niveau de mine maximum (5 à l'époque, 7 depuis le 26/10), tant que la table n'est pas vidée. Depuis le 26/10, le jeu les cache et un script les efface : voir 3.4.
- **L'argent classé est l'argent gagné en tout** (25/10 : `stats.argentGagne`, arrondi vers le bas : le coffre vendu, les wagonnets, le chariot, l'absence doublée), le meilleur des mondes du joueur (`meilleurScore`, `meilleurArgent`), envoyé **toutes les 5 minutes au plus** (`INTERVALLE_SCORE` dans `useCompte.ts`). Du 23/10 au 25/10, c'était l'argent **en poche** (`etat.argent`) : acheter faisait baisser son rang, le classement punissait les achats. L'argent gagné ne fait que monter : que le serveur garde le maximum (`classement.sql`) ou la valeur envoyée (`classement-portefeuille.sql`), le résultat est le même.

### 3.2 L'envoi du score (`useCompte.ts`)

- Le score part **après chaque envoi réussi des mondes** (et après une récupération).
- Pas d'envoi si le score n'a pas changé depuis le dernier envoi réussi, ni s'il vaut 0 / 0.
- Si le serveur refuse le score (par exemple pseudo qui ne correspond pas à l'email du compte), l'erreur est ignorée et on réessaie au prochain envoi : la sauvegarde des mondes passe avant le classement.
- Il faut un compte pour apparaître au classement.

### 3.3 L'affichage (`src/composants/CarteClassement.tsx`)

- Sur l'écran d'accueil, à droite. Visible par tout le monde, même sans compte. Détails de l'écran : [interface.md](interface.md#26-le-classement-carteclassementtsx).
- **Seulement à l'argent gagné** (25/10 ; `lireClassement(nombre)` : tri par `argent`, puis `prestige` pour départager). Le niveau de mine est affiché à côté (`niveauMineAffiche` : rien pour une ligne avec un ancien prestige, plus grand que `NIVEAU_MINE_MAX`, 7 depuis le 26/10), mais ne compte pas. Plus d'onglet « Niveau de mine ».
- Le **top 10** (`NB_LIGNES`, 23/10 ter) : le podium pour les 3 premiers, puis les 7 suivants en liste. Relu tout seul toutes les 5 minutes (`INTERVALLE_ACTUALISATION`), le rythme d'envoi des scores. La ligne du joueur connecté est mise en valeur (pseudo comparé sans la casse).
- **La place du joueur** (`placeDuScore(argent, pseudo)`, deux requêtes) : le nombre de joueurs qui ont gagné plus (`count` exact, sans le joueur lui-même), et celui qui est juste devant (le plus petit argent au-dessus). Le score utilisé est le meilleur argent gagné des mondes de ce navigateur (`meilleurArgent`), même sans compte (« tu serais 7e ! »).
- **Plus de filtre sur la colonne `prestige`** (23/10) : avant, le jeu cachait les lignes avec `prestige` > 5 ; comme le serveur gardait le plus grand prestige, un joueur qui avait un ancien prestige restait caché pour toujours, et le classement pouvait ne montrer que soi-même. Il garde le filtre sur la date (`modifie_le` après le 22/10 : seulement les joueurs qui ont rejoué depuis la mine automatique).
- Le script facultatif **`supabase/classement-niveau-mine.sql`** (23/10) : le trigger ne garde plus le maximum que pour l'argent (le niveau de mine prend la valeur envoyée), et les anciens prestiges sont remis à 0 sans toucher à la date des lignes. Il remet à 0 toutes les lignes où `prestige > 7` (26/10 : avant `> 5`, ce qui aurait effacé le niveau des joueurs aux niveaux 6 et 7 de la mine).

### 3.4 Les anciens scores de prestige (26/10)

Avant le 22/10, la colonne `prestige` contenait le prestige (jusqu'à 500). Depuis, elle contient le niveau de la mine (1 à 5 ; 1 à 7 depuis le 26/10). Mais le trigger `garder_meilleur_score` garde toujours le **maximum** : un ancien prestige ne redescendrait donc jamais. Deux choses règlent ça :

1. **Dans le jeu** (`lireClassement`, `src/enLigne.ts`) : le classement ne montre que les lignes mises à jour depuis le 22/10 (`modifie_le` ≥ 2026-10-22). (Le filtre `prestige` ≤ 5 a été retiré le 23/10, voir 3.3 : seul l'affichage du niveau ignore un ancien prestige.) Les anciens scores disparaissent tout de suite de l'affichage.
2. **Sur le serveur, une fois** : `supabase/classement-remise-a-zero.sql` (`delete from public.classement;`) efface toutes les lignes pour de bon. À coller dans Supabase : **SQL Editor > New query > Run**. Chaque joueur retrouve sa ligne, avec ses vrais scores, à sa **prochaine sauvegarde en ligne** (le jeu l'envoie tout seul). Aucune table n'est créée ni modifiée : les règles RLS de `classement.sql` restent les mêmes (le SQL Editor a le droit de supprimer ; un joueur, lui, ne peut jamais le faire). **À lancer à la main** : ce n'est pas fait automatiquement.

### 3.5 Visiter le village d'un joueur (26/10)

- Chaque ligne du classement (sauf la sienne) a un bouton bleu **« 🏡 Visiter »** (l'icône seule sur un petit écran). Il charge le village du joueur (`lireVillage(pseudo)`, `src/enLigne.ts`) et l'ouvre en plein écran (`src/composants/Visite.tsx`, rendu par `App.tsx` à la place de l'accueil). « 🚶 Rentrer » (ou Échap) ramène à l'accueil.
- Le village envoyé est la partie du **meilleur monde** du joueur (le plus d'argent gagné : `villageAPartager`, `src/jeu/visite.ts`). Il part avec le score (`envoyerLeScore`, `useCompte.ts`), donc toutes les 5 minutes au plus ; un refus (table pas encore créée) est ignoré. Un joueur qui n'a rien envoyé : « X n'a pas encore ouvert son village aux visites. »
- Pendant la visite : on se promène (toucher le sol, flèches, Espace), mais **rien ne s'ouvre**, et on ne voit **ni bulle, ni jauge, ni message, ni « +X $ »** (prop `visite` de `VueVillage`, `sansVente` de `WagonnetVillage`). Le temps passe sur une copie (`avancerVisite`) : ses employés **travaillent toujours**, même si son manager dort ou si leur salaire n'est plus payé (c'est seulement pour l'animation) ; le coffre et le chariot de la foreuse se vident quand ils sont pleins, les réserves de charbon et de redstone ne s'épuisent pas. Rien n'est sauvegardé : la vraie partie du joueur ne bouge pas.
- Table **`public.villages`** (`supabase/villages.sql`, à coller une fois dans le SQL Editor) : `joueur`, `pseudo`, `partie` (jsonb, moins de 500 Ko), `modifie_le`. Lisible par tout le monde (même sans compte), chacun n'écrit que sa ligne avec son pseudo (les mêmes règles que `classement`). Les sauvegardes complètes (`sauvegardes`) restent privées.

---

## 4. Les tables Supabase et leurs règles (RLS)

Les comptes eux-mêmes sont dans la table interne `auth.users` de Supabase (mots de passe gérés par Supabase). Nos deux tables sont dans le schéma `public`, avec la **Row Level Security activée**.

### 4.1 `public.sauvegardes` (`supabase/schema.sql`)

| Colonne | Type | Sens |
|---|---|---|
| `joueur` | `uuid`, clé primaire, référence `auth.users(id)`, `on delete cascade` | Le compte |
| `parties` | `jsonb not null` | La copie de tous les mondes (2.4) |
| `envoyee_le` | `bigint not null` | Heure de l'envoi en ms (`Date.now()` du client) |
| `modifiee_le` | `timestamptz`, défaut `now()` | Mise à jour automatiquement par le trigger `dater_sauvegarde` (avant chaque `update`) |

Droits : `select, insert, update` pour le rôle `authenticated` seulement (rien pour `anon`, pas de `delete`).

Règles RLS :

| Règle | Opération | Condition |
|---|---|---|
| « Lire sa sauvegarde » | `select` | `auth.uid() = joueur` |
| « Créer sa sauvegarde » | `insert` | `auth.uid() = joueur` |
| « Modifier sa sauvegarde » | `update` | `auth.uid() = joueur` (avant et après) |

Chaque joueur connecté ne voit et ne modifie que sa propre ligne.

### 4.2 `public.classement` (`supabase/classement.sql`, à lancer après `schema.sql`)

| Colonne | Type | Sens |
|---|---|---|
| `joueur` | `uuid`, clé primaire, référence `auth.users(id)`, `on delete cascade` | Le compte |
| `pseudo` | `text not null` | Pseudo affiché |
| `prestige` | `integer`, défaut 0, `check (0 à 500)` | Meilleur niveau de mine depuis le 22/10 (avant : meilleur prestige) |
| `argent` | `bigint`, défaut 0, `check (0 à 10^15)` | Plus d'argent gagné |
| `modifie_le` | `timestamptz`, défaut `now()` | Mis à jour par le trigger |

Index : pseudo **unique sans tenir compte de la casse** (`lower(pseudo)`), et deux index de tri (`prestige desc, argent desc` et `argent desc, prestige desc`).

Droits : `select` pour `anon` et `authenticated` ; `insert, update` pour `authenticated` (pas de `delete`).

Règles RLS :

| Règle | Opération | Condition |
|---|---|---|
| « Tout le monde lit le classement » | `select` (anon et connectés) | toujours vrai |
| « Créer sa ligne » | `insert` | `auth.uid() = joueur` **et** `lower(pseudo)` = la partie avant le `@` de l'email du compte (donc le pseudo doit être celui du compte) |
| « Modifier sa ligne » | `update` | même chose |

Trigger `garder_meilleur_score` (avant chaque `update`) : le serveur garde toujours le **maximum** entre l'ancien et le nouveau prestige, et entre l'ancien et le nouvel argent, et met `modifie_le` à jour. Supprimer son meilleur monde ne fait donc pas descendre au classement. (C'est pour ça que les anciens prestiges doivent être effacés par `classement-remise-a-zero.sql` : voir 3.4.)

Anti-triche : seulement les bornes des `check` et la règle sur le pseudo. Le score est calculé par le client, rien ne vérifie côté serveur qu'il est atteignable.

### 4.3 Règle du projet

Toute nouvelle table doit avoir ses règles RLS, et la clé `service_role` / secrète ne doit jamais être dans le code (voir `CLAUDE.md`).
