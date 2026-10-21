# Sauvegarde, comptes en ligne et classement

> Comment Mega Digger garde la progression du joueur : dans le navigateur (`localStorage`), et en option en ligne sur Supabase (compte, synchronisation, classement).
> Rédigé d'après le code au 20/10. Fichiers concernés : `src/jeu/sauvegarde.ts`, `src/jeu/mineur.ts` (type `EtatJeu`), `src/jeu/village.ts` (types `Village`, `Convoi`), `src/usePartie.ts`, `src/jeu/compte.ts`, `src/enLigne.ts`, `src/useCompte.ts`, `src/jeu/classement.ts`, `src/composants/CarteClassement.tsx`, `src/composants/CarteCompte.tsx`, `src/composants/Accueil.tsx`, `supabase/schema.sql`, `supabase/classement.sql`.

Principe général : **le `localStorage` est la sauvegarde principale.** Le jeu y écrit à chaque changement d'état et marche entièrement sans réseau. Le compte en ligne est facultatif : il recopie tous les mondes du navigateur sur Supabase pour les retrouver sur un autre appareil, et envoie le score au classement.

---

## 1. La sauvegarde locale (`src/jeu/sauvegarde.ts`)

### 1.1 Le stockage injectable

Toutes les fonctions reçoivent un `Stockage` en paramètre (le strict nécessaire de l'API `localStorage` : `getItem`, `setItem`, `removeItem`). En jeu c'est `window.localStorage` ; dans les tests c'est un faux stockage en mémoire (une `Map`). Chaque lecture/écriture est dans un `try/catch` : si le stockage est plein ou interdit (navigation privée), le jeu continue sans sauvegarde, sans planter.

### 1.2 Toutes les clés du `localStorage`

| Clé | Contenu | Écrit par |
|---|---|---|
| `idle-miner-mondes` | La liste des mondes (tableau JSON d'`InfoMonde`, voir 1.3) | `sauvegarde.ts` |
| `idle-miner-monde-<id>` | La partie du monde `<id>` : l'objet `EtatJeu` en JSON | `sauvegarde.ts` (`sauvegarder`) |
| `idle-miner-monde-<id>-horodatage` | L'heure de la dernière sauvegarde de ce monde (`Date.now()` en millisecondes, en texte) | `sauvegarde.ts` (`sauvegarder`) |
| `idle-miner-derniere-synchro` | Le dernier échange avec un compte en ligne : `{ joueur, envoyeeLe }` en JSON (voir 2.4) | `src/jeu/compte.ts` |
| `idle-miner-son` | Bruitages : `'actif'` ou `'coupe'` (actif par défaut) | `src/sons.ts` |
| `idle-miner-musique` | Musique et ambiances : `'actif'` ou `'coupe'` | `src/ambiance.ts` |
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
| `charger(stockage, id)` | Lit la partie, la met à jour si elle est en version 18 (`migrer`, 21/10), et vérifie qu'elle est **à la version actuelle (19)** et valide (1.5). Renvoie `null` si absente, illisible, invalide ou **d'une version d'avant la 18** (pas de migration avant le village vu du ciel) |
| `partieAncienne(stockage, id)` | Vrai si le monde contient une partie lisible d'une version plus ancienne que la 18 (`PREMIERE_VERSION_VILLAGE`, avant le village vu du ciel) : l'accueil prévient qu'elle repart de zéro |
| `secondesDepuisSauvegarde(stockage, id)` | Secondes écoulées depuis l'horodatage (0 si inconnu) |

Sur l'écran d'accueil, chaque carte de monde affiche (via `charger`) la profondeur (ou « Bedrock atteinte »), l'argent, le prestige, le nombre de blocs cassés et « Joué il y a ... ». Si `charger` renvoie `null`, la carte affiche « 🏡 Partie de l'ancienne version : elle repart de zéro dans le nouveau village vu du ciel. » quand `partieAncienne` est vrai, sinon « Partie illisible : elle recommencera à zéro. » Boutons : Jouer, Renommer, Dupliquer (grisé à 5 mondes), Supprimer (avec confirmation). Le gros bouton « ▶ Jouer » du haut reprend le monde joué le plus récemment (avec « · nouveau village » si sa partie ne se lit plus) ; s'il n'y a aucun monde, il devient « ⛏️ Commencer » et crée un premier monde.

Dans le jeu, le lien « Recommencer à zéro » (avec confirmation) remplace la partie du monde en cours par une partie neuve (succès et foreuse compris) ; le bouton « 🌍 <nom du monde> » revient à l'accueil.

### 1.4 Reprise de l'ancienne partie unique (avant le 19/10)

Au premier `listerMondes` (quand `idle-miner-mondes` n'existe pas), si l'ancienne clé `idle-miner-sauvegarde` existe : son contenu est copié dans `idle-miner-monde-1` (et `idle-miner-horodatage` dans `idle-miner-monde-1-horodatage`), les anciennes clés sont effacées, et la liste reçoit `{ id: '1', nom: 'Monde 1', couleur: 0 }` datée de l'ancien horodatage.

### 1.5 La version de l'état (et la fin des migrations)

`VERSION_ETAT = 19` (dans `src/jeu/mineur.ts`, depuis le 21/10 : la clairière de 60 × 60 cases ; 18 le 20/10 : le village vu du ciel). Chaque partie sauvegardée porte son champ `version`. À la lecture, `charger` passe d'abord la partie à `migrer()`, puis vérifie avec `estUnEtatValide()` qu'elle est **exactement à la version 19** avec tous les champs attendus ; sinon il renvoie `null`.

**La migration 18 → 19** (21/10, `migrer` dans `sauvegarde.ts`) : la clairière passe de 40 × 40 à 60 × 60 cases, en s'agrandissant de 10 cases de chaque côté. Dans une partie v18, tous les bâtiments, les décorations, les rails et les chemins **glissent de 10 cases** (x + 10, y + 10), pour rester à la même place par rapport à la mine, qui reste au milieu ; puis la partie passe en version 19. Testé dans `sauvegarde.test.ts`.

**Pas de migration avant la version 18** (les anciennes migrations ont été retirées le 20/10). Décidé avec l'équipe : avec le village vu du ciel (bâtiments à poser, chargements, mineurs qui marchent), **toutes les parties d'avant repartent de zéro**. Une partie d'une version plus ancienne n'est plus lue : à l'ouverture du monde, `usePartie.ts` crée une partie neuve (`creerPartie`) qui remplace l'ancienne à la première sauvegarde. Le monde lui-même (nom, couleur, place dans la liste) est gardé, et l'accueil le signale avant (`partieAncienne`, voir 1.3). Un test de `sauvegarde.test.ts` vérifie qu'une partie de la version 17 ou moins repart de zéro.

**Ajouter une version** : augmenter `VERSION_ETAT` dans `mineur.ts` et compléter `estUnEtatValide()` si un nouveau champ est obligatoire. Pour garder les parties des joueurs, ajouter une étape dans `migrer` (de la version N − 1 à N, avec son test dans `sauvegarde.test.ts`), comme pour 18 → 19 le 21/10 ; sinon elles repartent de zéro, comme le 20/10.

Pour mémoire, l'historique des migrations qui existaient jusqu'à la version 17 (retirées du code le 20/10) :

| 1 → 2 | | Arrivée de la surface, de l'échelle, du marché et de l'ascenseur. Le joueur reprend au fond de la mine (`lieu: 'mine'`), ajout de `trajet: null`, `colonneMineur: 0`, `nonAVendre: []`, et d'un ascenseur non possédé |
| 2 → 3 | | La mine descend à -128 m, déplacement sur l'échelle, ascenseur à niveaux, arrivée de la foreuse. Si `profondeur < 2`, la partie est **abandonnée** (`null` : le premier mètre est devenu l'entrée du puits). `position` = 0 si le joueur était en surface, sinon `profondeur - 1` ; `cible` = `position`. L'ascenseur devient `{ niveau: 1 si possédé sinon 0, ... }`. Ajout d'une foreuse inactive. Suppression de `lieu` et `trajet` |
| 3 → 4 | | Ajout de l'assistant (« Emmanuel Macron »), non embauché |
| 4 → 5 | | Couches de **10 blocs** au lieu de 6 : la couche en cours est complétée par des cases vides, les couches du dessous en répétant leurs blocs. Une partie arrêtée sur la bedrock (`profondeur >= 128`) remonte à -127 m, en galerie, avec une couche de deepslate, pour pouvoir continuer. L'ascenseur reçoit `position`/`cible` (au front), `chargement`, `passager`, `retourAuFront`, `quai`, `garder`. Ajout de `epee: false` et `stats.monstresVaincus: 0`. `colonneMineur` est ramené dans 0..9 |
| 5 → 6 | 19/10 | Suppression des donjons, de l'épée et de l'assistant. Un bloc `donjon` devient `deepslate` sous -80 m, sinon `pierre`. Retrait du succès `monstre` et de `stats.monstresVaincus`. Arrivée de l'arbre de prestige : `talents: []`, `peculeRecu: true` |
| 6 → 7 | | Ascenseur : `envoiDemande: false`, `envoiAuto: false`. Foreuse : `nonCoches: []`, `rechargeAuto: false` (envoi depuis le sac, inventaire à cocher, recharge automatique) |
| 7 → 8 | | `depart: null` (le mineur marche jusqu'au puits avant de monter) |
| 8 → 9 | | Ascenseur : `lotDemande: null` (choix des quantités à envoyer) |
| 9 → 10 | | `employes: []` (mineurs employés), `foreuse.nombre: 1`, et retrait des talents `ascenseurOffert` et `grimpeur` (leurs points sont rendus) |
| 10 → 11 | | `argentGagneAvant: 0` (argent gagné aux prestiges précédents, pour le classement ; inconnu pour les anciennes parties) |
| 11 → 12 | | Chaque foreuse a son niveau et sa profondeur : `foreuse.foreuses` devient une liste de `nombre` foreuses identiques (`niveauVitesse`, `profondeur`, `progression`, `blocsFores`), le reste est partagé. Si `foreuses` existait déjà, seul le numéro de version change |
| 12 → 13 | | `decouvertes` : `'foreuse'` si prestige ≥ 1, `'employes'` si prestige ≥ 2 (pas de flèche pour des stands déjà connus) |
| 13 → 14 | 19/10 | Profondeur de mine par prestige (`profondeurBedrock(prestige)` = 100 m + 50 m par prestige). Une partie plus bas que sa nouvelle bedrock remonte juste au-dessus (`profondeurBedrock - 1`), ainsi que `position`, `cible` et la cabine ; `victoire: true` et `enGalerie: true`. Ajout des nouvelles statistiques (complétées à 0) et de `statsTotales` (à 0) |
| 14 → 15 | 20/10 | **Une seule foreuse** : on garde celle de plus haut niveau de forage (puis la plus profonde), elle garde tout le charbon. Les autres sont **remboursées en argent** : leur prix d'achat (50 000, 100 000, 200 000, 400 000 $ pour les 2e à 5e) et toutes leurs améliorations de forage (minerais comptés au prix du marché). Les mineurs déjà embauchés deviennent `rarete: 'commun'` (sauf s'ils en avaient une) avec `tempsPaye: 600` (10 minutes payées). Ajout de `recruteur: 0`, `manager` (non embauché), `tresorerie: 0`. Nouvel arbre de prestige : `talents: []` (tous les points rendus). Statistiques complétées. Suppression de `peculeRecu` |
| 15 → 16 | 20/10 | Rien (le compteur `licenciements` ajouté puis retiré le même jour). Le champ `licenciements` est supprimé **à chaque chargement**, quelle que soit la version |
| 16 → 17 | 20/10 | `standsVus: []` (badge « Nouveaux niveaux » depuis le dernier prestige) |
| toujours | 16/10 | Suppression des anciens champs `torches` et `torchesPosees` (torches retirées du jeu) |

| 17 → 18 | 20/10 | **Pas de migration** : le village vu du ciel ; toutes les parties d'avant repartent de zéro |

### 1.6 Ce qui est stocké : `EtatJeu` champ par champ

L'état d'une partie est un objet composé uniquement de nombres, textes, listes et objets simples (aucune classe, aucune fonction) : il est sauvegardé tel quel avec `JSON.stringify`. Défini dans `src/jeu/mineur.ts`.

| Champ | Type | Sens | Au prestige |
|---|---|---|---|
| `version` | nombre | Version du format (18) | — |
| `position` | nombre (à virgule en mouvement) | Position du joueur sur l'échelle en mètres : 0 = village, `profondeur - 1` = front de taille (sa place dans le village vu du ciel n'est pas sauvegardée : il réapparaît devant la mine) | remis à 0 |
| `cible` | nombre | Où le joueur se dirige sur l'échelle | remis à 0 |
| `colonneMineur` | 0 à 9 | Colonne du mineur au-dessus de la couche en cours | remis à 0 |
| `argent` | nombre | Argent en poche | remis à 0 |
| `profondeur` | nombre | Profondeur de la couche en cours (1 = juste sous l'herbe ; une partie neuve commence à 2) | remis à 2 |
| `coucheActuelle` | liste de 10 `IdBloc` ou `null` | La couche en cours ; `null` = bloc déjà cassé | régénérée |
| `couchesDessous` | liste de couches | Les couches suivantes déjà générées (profondeur + 1, + 2...) | régénérées |
| `enGalerie` | booléen | Vrai = on creuse à l'horizontale (profondeur max de la pioche, ou bedrock) | faux |
| `pioches` | `{ niveau: usure }` | Pioches possédées et leur usure | gardées, toutes réparées (usure 0) |
| `niveauPioche` | nombre | Pioche équipée | la meilleure |
| `meilleure` | nombre | Plus haut niveau de pioche débloqué | gardé |
| `inventaire` | `{ bloc: nombre }` | Contenu du sac | vidé |
| `nonAVendre` | liste d'`IdBloc` | Objets décochés au marché (« Vendre tout » les garde) | gardé |
| `ascenseur` | objet `Ascenseur` (ci-dessous) | La cabine | seul le `niveau` est gardé |
| `foreuse` | objet `Foreuse` (ci-dessous) | La foreuse (prestige 1) | gardée sans charbon, chariot vide, repart de la surface (voir `foreuseApresPrestige`) |
| `enchantements` | `{ efficacite, fortune, solidite }` | Niveaux d'enchantement | gardés |
| `niveauSac` | nombre | Taille du sac à dos | gardé |
| `seaux` | nombre | Seaux d'eau (contre la lave) | remis à 0 |
| `prestige` | nombre | Niveau de prestige | + 1 |
| `succes` | liste de textes | Identifiants des succès débloqués | gardés |
| `stats` | `Statistiques` | Statistiques de cette partie | remises à 0 (ajoutées à `statsTotales`) |
| `statsTotales` | `Statistiques` | Somme des parties d'avant (prestiges précédents) | + `stats` |
| `argentGagneAvant` | nombre | Argent gagné pendant les prestiges précédents (classement) | devient `argentGagneAvant + stats.argentGagne` |
| `victoire` | booléen | Bedrock atteinte dans cette partie | faux |
| `talents` | liste d'`IdTalent` | Talents de l'arbre de prestige | gardés |
| `employes` | liste d'`Employe` | Mineurs employés (prestige 2) | gardés (pioche et rareté), repartent de la mine (étape `descend`), sac vide, au moins 10 min payées |
| `recruteur` | nombre | Niveau du recruteur (0 = pas embauché, prestige 4) | gardé |
| `manager` | `{ embauche, tempsPaye }` | Le manager (prestige 5), qui paie les salaires | gardé, au moins 10 min payées |
| `tresorerie` | nombre | Argent mis de côté pour les salaires | remis à 0 |
| `decouvertes` | liste (`'foreuse'`, `'employes'`, `'recruteur'`, `'manager'`) | Nouveautés déjà vues devant leur bâtiment (la bulle ✨ « Nouveau » disparaît) | gardé |
| `standsVus` | liste de textes | Bâtiments visités depuis le dernier prestige (bulle ⬆️ « Nouveaux niveaux ») | vidé |
| `depart` | objet `Depart` ou `null` | Le mineur marche vers le puits avant de monter : `{ destination, parEchelle, temps, lot? }` | `null` |
| `village` | objet `Village` (ci-dessous) | Le village vu du ciel (20/10) : bâtiments posés, rails, chemins, décorations | **gardé tel quel** |
| `convois` | liste de `Convoi` (ci-dessous) | Les chargements en route vers le marché (brouette ou wagonnet) | vidé (ceux en route sont perdus) |
| `tenue` | `{ chapeau, haut }` (`IdTenue` ou `null`) | La tenue que porte le joueur (achetée au Bazar) | gardée |
| `tenuesAchetees` | liste d'`IdTenue` | Les tenues achetées | gardées |

**`Ascenseur`** : `niveau` (0 = pas construit), `position` et `cible` (en mètres, 0 = village), `chargement` (inventaire transporté ; en haut, il va dans le `reservoir`, ou devient un `Convoi` vers le marché s'il y a des rails ; ce qui ne rentre pas reste dans la cabine), `passager` (le mineur est dans la cabine), `retourAuFront` (redescend seule après avoir vidé son chargement), `quai` (blocs qui attendent au pied de l'ascenseur quand le sac est plein), `garder` (objets décochés dans le sac, que la cabine ne prend pas), `envoiDemande`, `lotDemande` (inventaire choisi, ou `null` = tous les objets cochés), `envoiAuto` (part seul quand le sac est plein).

**`Reservoir`** (22/10, version 20) : `niveau` (index dans `NIVEAUX_RESERVOIR`, gardé au prestige) et `contenu` (ce que l'ascenseur a remonté, vidé au prestige).

**`Foreuse`** : `active`, `carburant` (secondes de forage restantes), `niveauVitesse` (index dans `NIVEAUX_FORAGE`), `profondeur`, `progression` (0 à 1 du prochain bloc), `blocsFores`, `niveauChariot` (index dans `NIVEAUX_CHARIOT`), `chariot` (inventaire remonté), `nonCoches`, `rechargeAuto`.

**`Employe`** : `nom`, `rarete` (`commun`, `rare`, `epique`, `legendaire`, `mythique`), `niveau` (sa pioche, index dans `NIVEAUX_EMPLOYE`), `profondeur` (de sa galerie), `etape` (`creuse`, `monte`, `marche`, `vend`, `forge`, `descend`, `attend` ; `marche` et `forge` depuis le 20/10), `position`, `sac`, `progression` (fraction du bloc en creusant, secondes passées en marchant, au marché ou à la forge), `blocsCasses`, `gagne`, `tempsPaye` (secondes de travail déjà payées), et depuis le 20/10 : `lieu` (le bâtiment où il est, ou vers lequel il marche), `depuis` (celui d'où il part), `forgeEnAttente` (il doit passer à la forge chercher sa nouvelle pioche).

**`Village`** (20/10, `src/jeu/village.ts`) : `batiments` (liste de `{ id, x, y, miroir }` : le coin du haut de l'emprise sur la grille de 60 × 60 cases (40 × 40 avant le 21/10), et le dessin retourné ou non ; la mine est posée d'office en 25, 25), `rails` et `chemins` (listes de cases écrites `"x,y"`), `decorations` (liste de `{ n, id, x, y, miroir }`, `n` = numéro unique), `prochainNumero` (pour numéroter les décorations), `batimentsVus` (bâtiments débloqués déjà vus dans le menu Bâtiments : pastille « Nouveau »).

**`Convoi`** : `chargement` (inventaire), `temps` (secondes déjà roulées), `duree` (secondes pour arriver au marché ; −1 = il attend qu'un marché soit posé), `parRails` (wagonnet ou brouette), `mineur` (le nom du mineur employé à qui il appartient, ou `null` = au joueur).

**`Statistiques`** : `blocsCasses`, `argentGagne` (toutes sources), `tempsMinage`, `coffresOuverts`, `geodesCassees`, `lavesEteintes`, `diamantsTrouves`, et depuis le 19/10 `argentForeuse`, `argentMineurs`, `blocsParType`, `blocsForeuse`, `blocsMineurs`, `profondeurMax`, puis le 20/10 `salairesPayes`.

`estUnEtatValide()` vérifie : `version === 18`, et la présence/le type de `argent`, `profondeur`, `coucheActuelle`, `couchesDessous`, `pioches`, `inventaire`, `enchantements`, `stats`, `succes`, `position`, `cible`, `nonAVendre`, `ascenseur`, `foreuse`, `talents`, `employes`, `recruteur`, `manager`, `tresorerie`, `decouvertes`, `standsVus`, `statsTotales`, `argentGagneAvant`, et depuis le 20/10 `village` (avec sa liste `batiments`), `convois`, `tenue` et `tenuesAchetees`.

### 1.7 Quand le jeu sauvegarde (`src/usePartie.ts`)

- **À chaque changement d'état** : un `useEffect` appelle `sauvegarder(localStorage, idMonde, etat)` dès que `etat` change (chaque action, chaque tic d'horloge qui modifie quelque chose). Il n'y a pas de bouton « Sauvegarder ».
- Il s'exécute aussi au tout premier rendu : la partie chargée (rattrapée, voir ci-dessous) est réécrite immédiatement. Une ancienne partie (version 17 ou moins) est donc remplacée par la partie neuve dès l'ouverture du monde.
- Une partie neuve (« Recommencer à zéro », ou monde sans partie lisible) remplace l'ancienne par cette même sauvegarde automatique.

### 1.8 Retour au jeu après une absence

À l'ouverture d'un monde (`chargerOuCreer` dans `usePartie.ts`) :

1. `marquerJoue` (le monde remonte en tête de liste).
2. `charger` ; si `null` (pas de partie, partie abîmée, ou partie d'une ancienne version), une partie neuve est créée (`creerPartie`) : le joueur est au village, devant la mine, avec 0 $ et le marché à poser.
3. Sinon, l'absence = `secondesDepuisSauvegarde`, plafonnée à **8 heures** (`ABSENCE_MAX`).
4. `avancerTemps(etat, absence)` est appelé **en une fois** avec toute la durée : marche, échelle, ascenseur, foreuse, mineurs employés (avec leurs marches au village) et chargements vers le marché avancent (voir `src/jeu/temps.ts`).
5. Un message s'affiche au démarrage (environ 7 s) : « Pendant ton absence : ⚙️ la foreuse a remonté N blocs, 👷 tes mineurs t'ont rapporté X $, 😠 N mineurs attendent leur salaire. » (seulement les morceaux non nuls ; X = tout l'argent gagné pendant l'absence, chargements de l'ascenseur arrivés au marché compris).

Seuls la foreuse et les mineurs employés (et le manager qui les paie) produisent pendant l'absence. Le minage du joueur ne continue pas.

### 1.9 Hors ligne

- Sans réseau, tout marche : la partie est dans le `localStorage`.
- Le jeu s'installe comme une application (PWA) : `public/manifest.webmanifest`, et un service worker `public/sw.js` enregistré **seulement en production** (`src/installation.ts`). Il met en cache la page (réseau d'abord, cache si pas de réseau), les fichiers `/assets/` (cache d'abord) et les icônes, le manifeste et les **images du village** (`public/images/`, rangées dès l'installation depuis le 20/10, cache `idle-miner-v2` ; cache puis mise à jour). Les requêtes vers Supabase ne sont jamais mises en cache.
- Connecté mais sans réseau : le compte passe en statut « hors-ligne » et réessaie tout seul (voir 2.5).

---

## 2. Les comptes en ligne

### 2.1 Configuration de Supabase

- Supabase est le seul « backend » : une base Postgres et un service de comptes hébergés. Pas de serveur à nous.
- L'adresse du projet et la clé **publishable** (publique par conception, visible dans le navigateur) sont configurées dans `src/enLigne.ts` : valeurs par défaut écrites dans le code, remplaçables par les variables d'environnement Vite `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (fichier `.env`). L'identifiant du projet est aussi noté dans `CONTEXTE.md` (section Infra).
- La sécurité repose sur les **règles RLS** de la base (section 4), pas sur le secret de la clé. La clé `service_role` / secrète ne doit jamais apparaître dans le code.
- Réglage à faire dans le tableau de bord Supabase : **Authentication → Email → décocher « Confirm email »** (les adresses sont fabriquées, aucun email ne peut arriver). Sinon la création de compte renvoie un message demandant de le désactiver.
- Les scripts SQL `supabase/schema.sql` puis `supabase/classement.sql` sont à coller une fois dans le SQL Editor de Supabase.

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
| `lireClassement(tri, nombre)` | Les `nombre` premiers, triés par `tri` décroissant puis l'autre critère décroissant. Lisible sans compte |

### 2.4 Ce qui est envoyé : la copie de tous les mondes

`exporterTout(stockage)` (dans `sauvegarde.ts`) fabrique une `SauvegardeComplete` = un objet « clé du localStorage → texte brut » contenant `idle-miner-mondes` et, pour chaque monde de la liste, `idle-miner-monde-<id>` et `idle-miner-monde-<id>-horodatage`. Copie vide s'il n'y a pas de liste. Les réglages (son, musique...) ne sont pas inclus. Les parties sont envoyées telles quelles (avec leur numéro de version) : c'est `charger` qui les lit sur l'appareil qui les reçoit. Depuis le 20/10, une partie d'une version plus ancienne récupérée en ligne n'est pas lue non plus : elle repart de zéro à l'ouverture du monde, comme dans le navigateur (puis la partie neuve est renvoyée en ligne au prochain envoi).

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
- **Toutes les 20 s** (`INTERVALLE_ENVOI`) tant qu'on est connecté : envoi des mondes **seulement s'ils ont changé** (comparaison avec le texte du dernier envoi). Si le premier échange n'a pas encore réussi, il est retenté à la place.
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
| Les deux ont des mondes, sinon | `demander` |

`demander` ouvre une boîte `window.confirm` : « Ton compte a déjà N mondes en ligne (sauvegardés le JJ/MM/AA HH:MM), et ce navigateur a d'autres mondes. OK : jouer avec les mondes de ton compte (ceux de ce navigateur seront remplacés). Annuler : garder les mondes de ce navigateur (ils remplaceront ceux de ton compte). »

- `recuperer` : `importerTout` (les mondes du navigateur sont remplacés), on note la dernière synchro, `versionMondes` augmente (l'accueil redessine les cartes), puis on envoie le score.
- `envoyer` : envoi forcé de tous les mondes du navigateur (ceux du compte sont écrasés).

Il n'y a **pas de fusion monde par monde** : c'est toujours l'ensemble des mondes d'un côté qui remplace l'autre. Après chaque envoi ou récupération réussi, `idle-miner-derniere-synchro` = `{ joueur: <id du compte>, envoyeeLe }`.

---

## 3. Le classement

### 3.1 Le score (`src/jeu/classement.ts`)

- `Score = { prestige, argent }`.
- `meilleurScore(copie)` : pour chaque monde de la copie de tous les mondes, relit la partie avec `charger` et garde **le meilleur prestige** et **le plus d'argent gagné**, chacun séparément (ils peuvent venir de deux mondes différents). Une partie d'une ancienne version (`charger` renvoie `null`) ne compte pas ; comme le serveur garde toujours le **meilleur** score envoyé (4.2), le classement d'un joueur ne baisse pas avec la remise à zéro du 20/10.
- L'argent classé est `argentGagneTotal(etat)` = `argentGagneAvant + stats.argentGagne` arrondi vers le bas : tout l'argent gagné depuis le début, prestiges compris (pas l'argent en poche). Pour les parties antérieures à la v11, l'argent des prestiges d'avant est inconnu (compté 0).

### 3.2 L'envoi du score (`useCompte.ts`)

- Le score part **après chaque envoi réussi des mondes** (et après une récupération).
- Pas d'envoi si le score n'a pas changé depuis le dernier envoi réussi, ni s'il vaut 0 / 0.
- Si le serveur refuse le score (par exemple pseudo qui ne correspond pas à l'email du compte), l'erreur est ignorée et on réessaie au prochain envoi : la sauvegarde des mondes passe avant le classement.
- Il faut un compte pour apparaître au classement.

### 3.3 L'affichage (`src/composants/CarteClassement.tsx`)

- Sur l'écran d'accueil, sous les mondes. Visible par tout le monde, même sans compte.
- Deux onglets : **⭐ Prestige** (tri par prestige, l'argent départage) et **💰 Argent** (tri par argent, le prestige départage).
- Les **20** premiers (`NB_LIGNES`). Médailles 🥇🥈🥉 pour les 3 premiers, puis « 4. », « 5. »...
- La ligne du joueur connecté est mise en valeur (comparaison du pseudo sans tenir compte de la casse).
- Rechargé au changement d'onglet, au clic sur « Actualiser », et quand l'heure du dernier envoi du compte change.
- Messages : chargement, « Impossible de charger le classement. Vérifie ta connexion. », « Personne n'est encore classé : à toi d'être le premier ! », et « Connecte-toi pour apparaître dans le classement. » si pas de compte.

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
| `prestige` | `integer`, défaut 0, `check (0 à 500)` | Meilleur prestige |
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

Trigger `garder_meilleur_score` (avant chaque `update`) : le serveur garde toujours le **maximum** entre l'ancien et le nouveau prestige, et entre l'ancien et le nouvel argent, et met `modifie_le` à jour. Supprimer son meilleur monde ne fait donc pas descendre au classement.

Anti-triche : seulement les bornes des `check` et la règle sur le pseudo. Le score est calculé par le client, rien ne vérifie côté serveur qu'il est atteignable.

### 4.3 Règle du projet

Toute nouvelle table doit avoir ses règles RLS, et la clé `service_role` / secrète ne doit jamais être dans le code (voir `CLAUDE.md`).
