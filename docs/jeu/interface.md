# L'interface de Mega Digger

> Ce que voit le joueur, écran par écran et composant par composant, et ce que fait chaque bouton.
> Écrit d'après le code au 22/10 (trajets des wagonnets ajoutés le 24/10 ; menu Bâtiments seul, panneau de la mine refait, jauge du coffre et ventes au marché le 27/10 ; missions, bandeau à gauche, onglets et zoom le 27/10) (`src/App.tsx`, `src/composants/*.tsx`, `src/index.css`, `src/village.css`, `src/plein-ecran.css`…), après la refonte de la **mine automatique** : il n'y a plus qu'un seul mode, le village vu du ciel (plus de vue de la mine en coupe). Les règles et chiffres de chaque bâtiment sont dans les fiches [docs/batiments/](../batiments/README.md) ; les règles du village (grille, construction, rails, chemins) dans [village.md](village.md) ; le style visuel, les animations et les sons dans [visuel-et-sons.md](visuel-et-sons.md).

Tout le texte du jeu est en français et tutoie le joueur. Les montants s'affichent au format français (`1 250 $`).

## Sommaire

1. [Vue d'ensemble : les deux écrans](#1-vue-densemble--les-deux-écrans)
2. [L'écran d'accueil](#2-lécran-daccueil-accueiltsx)
3. [L'écran de jeu : la mise en page](#3-lécran-de-jeu--la-mise-en-page)
4. [Les boutons du coin et le bandeau (HUD)](#4-les-boutons-du-coin-et-le-bandeau-hud)
5. [Les missions](#5-les-missions-missionstsx)
6. [La carte du village](#6-la-carte-du-village-vuevillagetsx)
7. [Les boutons du bas](#7-les-boutons-du-bas)
8. [Le panneau d'un bâtiment](#8-le-panneau-dun-bâtiment)
9. [Les composants partagés des panneaux](#9-les-composants-partagés-des-panneaux)
10. [Les fenêtres (popups)](#10-les-fenêtres-popups)
11. [Les notifications et retours visuels](#11-les-notifications-et-retours-visuels)
12. [Les contrôles : clavier, souris, tactile](#12-les-contrôles--clavier-souris-tactile)
13. [Téléphone ou ordinateur : la mise en page](#13-téléphone-ou-ordinateur--la-mise-en-page)
14. [Les couleurs des boutons](#14-les-couleurs-des-boutons)

---

## 1. Vue d'ensemble : les deux écrans

`App.tsx` n'a que deux états :

| Écran | Quand | Composant |
|---|---|---|
| **Accueil** | au lancement, et après « 🌍 *nom du monde* » dans les boutons du coin | `Accueil` |
| **Jeu** | après avoir choisi (ou créé) un monde | `Jeu` (dans `App.tsx`) |

- Le compte en ligne (`useCompte`) reste ouvert pendant la partie : il recopie les mondes toutes les **20 s** s'ils ont changé, et une dernière fois quand la page passe en arrière-plan.
- En quittant le jeu pour l'accueil, la partie part **tout de suite** en ligne (`envoyerMaintenant`).
- Changer de monde recrée entièrement le jeu (`key={monde.id}`) : rien de l'ancien monde ne reste à l'écran.
- La partie est sauvegardée dans `localStorage` **au plus une fois par seconde** (l'horloge change l'état sans arrêt) et en quittant la page (`usePartie`).

---

## 2. L'écran d'accueil (`Accueil.tsx`)

Dans le style des images du village (bois, or, lanternes). Derrière toute la page, un dégradé brun très sombre. Toutes les cartes de l'accueil (compte, mondes, classement, installer) sont en **bois sombre avec un filet doré**. De haut en bas :

### 2.1 Le grand bandeau (« héros »)

Un cadre en bois sombre avec un filet doré. Le fond est un **petit village vivant** (`SceneAccueil.tsx`, voir [visuel-et-sons.md](visuel-et-sons.md#6-lécran-daccueil-accueilcss)) : la même vue du ciel que dans le jeu, avec la mine, les bâtiments (générateur compris), des décorations, des rails, des hamsters mineurs qui vont et viennent, un wagonnet qui fait la navette, le joueur devant la mine, le manager et le recruteur à leur poste. Ce n'est qu'un décor. Par-dessus :

- le **logo** « MEGA / DIGGER » (police Luckiest Guy, lettres dorées) cloué sur un **panneau en bois**, avec le **hamster du joueur** à côté ;
- l'accroche « Creuse. Construis. **Deviens riche.** » et le paragraphe « Creuse ta mine jusqu'au **cœur de diamant**, bâtis ton village où tu veux dans la clairière, embauche des mineurs (rares, épiques… mythiques !) et relie tout avec des rails électriques. » ;
- le **gros bouton doré** :
  - s'il existe au moins un monde : « ▶ Jouer » + détail « *nom* · 🕳️ niveau *N* · *argent* $ » (« *nom* · nouveau village » si sa partie ne se lit plus, par exemple une partie d'avant le 22/10) → reprend le **dernier monde joué** ;
  - sinon : « ⛏️ Commencer / Ta clairière et ta mine t'attendent » → crée un monde nommé « Monde 1 » et lance la partie ;
  - grisé pendant que le compte se charge ou se synchronise ;
- un bouton en bois « 🌍 Mes mondes » qui fait défiler jusqu'à la section des mondes (`#mondes`) ;
- trois gros chiffres : « 5 niveaux de mine » (`NIVEAU_MINE_MAX`), « ⚡ des rails électriques », « 6 bâtiments à poser » (`LISTE_BATIMENTS`).

### 2.2 « Comment jouer » : 4 cartes numérotées

| N° | Image | Titre | Texte |
|---|---|---|---|
| 1 | portrait du mineur casqué | Creuse | Clique sur le bloc de la mine : charbon, fer, redstone, or, émeraudes, diamants… |
| 2 | le dessin du forgeron | Construis | Pose le marché, la forge, le bazar… où tu veux dans la clairière, et relie-les par des rails. |
| 3 | portrait du recruteur | Embauche | Des mineurs rares, épiques… mythiques creusent pour toi et remplissent le coffre de la mine. |
| 4 | le dessin du générateur | Automatise | Relie la mine au marché avec des rails, et électrifie-les avec le générateur : l'argent tombe tout seul ! |

Chaque carte est en bois sombre, avec une pièce dorée pour le numéro, une lueur et un titre de sa couleur (or, vert, bleu, rose), et se soulève au survol.

### 2.3 La section des mondes (`#mondes`)

Dans l'ordre :

1. **Carte « Installer »** (`CarteInstallation.tsx`), voir [§ 2.5](#25-la-carte--installer--carteinstallationtsx).
2. **Carte du compte** (`CarteCompte.tsx`), voir [§ 2.4](#24-la-carte-du-compte-cartecomptetsx).
3. Le titre « 🌍 Tes mondes (*n*/5) ».
4. La **grille des mondes** : une carte par monde (jusqu'à **5**), puis la carte « ✨ Nouveau monde ».

**Une carte de monde** (`CarteMonde`) :

- un liseré épais en haut et une lueur de la couleur du monde (5 couleurs : or `#f2b33d`, bleu `#4a8af0`, turquoise `#22b5a3`, rose `#e85aa8`, violet `#9b6cf0`) ;
- le titre « 🌍 *nom* », et le badge « Dernière partie » sur le premier de la liste (le dernier joué) ;
- 4 infos : 🕳️ Mine niveau *N*, 💵 argent, 👷 nombre de mineurs, ⛏️ blocs cassés. Pour une partie d'une ancienne version (`partieAncienne`, avant la version 21), un cadre doré en pointillés : « 🏡 Partie de l'ancienne version : elle repart de zéro avec la nouvelle mine automatique. » ; si la sauvegarde est illisible : « Partie illisible : elle recommencera à zéro. » ;
- « Joué il y a … » (« à l'instant », « il y a 5 min », « il y a 3 h », « il y a 2 jours ») ;
- les boutons :

| Bouton | Couleur | Effet |
|---|---|---|
| ▶ Jouer | or | lance ce monde (grisé pendant une synchro du compte) |
| ✏️ Renommer | gris | remplace le titre par un champ (24 caractères max) + bouton « OK » ; recliquer annule |
| 📄 Dupliquer | bleu | copie le monde ; grisé s'il y a déjà 5 mondes |
| 🗑️ | rouge | confirmation du navigateur « Supprimer le monde « … » ? Sa partie sera perdue pour toujours. » puis suppression |

**La carte « ✨ Nouveau monde »** (bordure en pointillés) : un champ nom (24 caractères, « Monde *n+1* » par défaut) et « ⛏️ Créer et jouer » (Entrée marche aussi). Avec 5 mondes, elle est remplacée par « 5 mondes au maximum : supprime-en un pour en créer un nouveau. »

### 2.4 La carte du compte (`CarteCompte.tsx`)

Le compte est facultatif (pseudo + mot de passe, sans email).

| État | Affichage |
|---|---|
| Chargement | « ☁️ Recherche de ton compte… » |
| Pas connecté | « 👤 Ton compte · Facultatif : pour retrouver tes mondes sur un autre appareil. », champs **Pseudo** et **Mot de passe**, boutons **Se connecter** (or, aussi avec Entrée) et **Créer un compte** (bleu). Dessous : le message d'erreur en rouge s'il y en a un, et « ⚠️ Il n'y a pas d'email : un mot de passe oublié ne peut pas être récupéré. » |
| Connecté | « 👤 *pseudo* », l'état de la sauvegarde, et le lien **Se déconnecter** |

États de la sauvegarde en ligne (connecté) : « ☁️ Synchronisation de tes mondes… », « ☁️ Mondes sauvegardés en ligne (dernier envoi : 14:05) », « ☁️ Tes mondes sont sauvegardés en ligne. », et en rouge « ⚠️ Serveur injoignable : tes mondes restent dans ce navigateur, on réessaie tout seul. »

À la connexion, si le compte et le navigateur ont des mondes différents, une boîte de confirmation du navigateur demande lesquels garder (OK = ceux du compte, Annuler = ceux du navigateur).

### 2.5 La carte « Installer » (`CarteInstallation.tsx`)

Avec l'icône du jeu et « 📲 Installe Mega Digger » :
- **Android / Chrome / Edge** : « Une icône sur ton écran d'accueil, le jeu en plein écran, même sans réseau. » + bouton **Installer** (bleu) ;
- **iPhone / iPad** : « Dans Safari, touche **Partager** (le carré avec une flèche ↑), puis **Sur l'écran d'accueil**. » ;
- le lien **Plus tard** la cache pour toujours (`localStorage`, clé `idle-miner-installation-masquee`).

Elle n'apparaît pas si le jeu est déjà installé, ou si le navigateur ne sait pas installer. Détails : [visuel-et-sons.md § 10](visuel-et-sons.md#10-lapplication-installable-pwa).

### 2.6 Le classement (`CarteClassement.tsx`)

Sous les mondes, visible par tout le monde (même sans compte) :

- titre « 🏆 Classement », deux onglets **🕳️ Niveau de mine** / **💰 Argent**, lien **Actualiser** ;
- l'explication : « Le plus bas niveau de mine atteint » ou « Tout l'argent gagné dans la partie ». Le niveau de la mine est gardé par le serveur dans sa colonne `prestige` (voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md#3-le-classement)) ;
- « (le meilleur de tes mondes) », et « Connecte-toi pour apparaître dans le classement. » si on n'est pas connecté ;
- les **20 premiers** : 🥇 🥈 🥉 puis « 4. », « 5. »…, le pseudo, 🕳️ niveau et 💰 argent (la valeur triée en or, l'autre en gris ; sur téléphone seule la valeur triée reste) ;
- la ligne du joueur connecté est entourée d'or ;
- messages : « Chargement du classement… », « Personne n'est encore classé : à toi d'être le premier ! », « Impossible de charger le classement. Vérifie ta connexion. » (rouge) ;
- il se relit quand on change d'onglet, sur « Actualiser », et après chaque envoi de la sauvegarde.

### 2.7 Tout en bas

« Version *commit* · *date du build* » (petite ligne grise), pour vérifier que Vercel est à jour.

---

## 3. L'écran de jeu : la mise en page

Un seul mode (classe `jeu plein-ecran mode-village`) : le **village vu du ciel** (`VueVillage.tsx`), une carte isométrique où l'on se promène, où l'on pose ses bâtiments et où l'on ouvre leurs panneaux (la mine comprise : c'est là qu'on creuse).

**Plein écran** (`src/plein-ecran.css`, comme Clash of Clans) : la scène (`main.scene`) prend **tout l'écran**, et l'interface (`.interface`) est posée **par-dessus**. Le calque de l'interface laisse passer les clics vers la carte, sauf sur les boutons et les panneaux.

```
┌──────────────────────────────────────────────────────────────┐
│[Argent $/s][Mine · coffre][Pioche][Sac][👷 ⚡]   ┌ MISSIONS ───┐ │  bandeau (HUD)
│[📊]                                              └─────────────┘ │
│[🏅]                                        ┌───────────────┐     │
│[❔]        LA CARTE (village vu du ciel)   │ PANNEAU       │     │
│[⚙️]        sur tout l'écran                │ du bâtiment   │     │
│                                            │ (la mine : le │     │
│                 messages (toasts)          │ bloc à cliquer)│    │
│ (⛏️)          ← ↑ → ↓ pour marcher           (✏️) (🏗️)     │  boutons ronds
└──────────────────────────────────────────────────────────────┘
```

- **En haut à gauche** : le bandeau (§ 4.2), et **dessous** la colonne de petits boutons carrés en bois (`boutons-coin`, § 4.1). Depuis le 27/10, le bandeau est à gauche, au-dessus des boutons (avant, il était en haut à droite).
- **En haut à droite** (`colonne-droite`, 27/10) : les **missions** (§ 5), et dessous le panneau du bâtiment ouvert.
- **Le panneau** (`panneau-flottant`) : sur ordinateur, une carte de 400 px (350 px sur un écran moyen) à droite ; depuis le 27/10, la caméra **ne bouge plus** quand il s'ouvre (avant, elle se décalait de 210 px vers la gauche) : le joueur garde sa vue. Il se place **sous les missions**, dans la colonne de droite. Sur téléphone, il monte du bas, au-dessus des boutons (55 % de la hauteur au plus).
- **En bas** : de **gros boutons ronds** : ⛏️ Mine en bas à gauche, ✏️ Modifier et 🏗️ Bâtiments en bas à droite (§ 7).
- La page a la classe `avec-mineurs` dès qu'on a au moins un mineur employé, et `avec-panneau` quand un panneau est ouvert.

---

## 4. Les boutons du coin et le bandeau (HUD)

### 4.1 Les boutons du coin (`App.tsx`)

Une colonne de petits boutons carrés en bois, en haut à gauche, **sans texte** (42 px, 38 px sur téléphone ; le nom est dans l'info-bulle). Depuis le 23/10, il y en a 4 :

| Bouton | Effet |
|---|---|
| **📊** | ouvre la [fenêtre des statistiques](#102-les-statistiques-statistiquestsx) |
| **🏅** (avec un badge doré : le nombre de succès) | ouvre la [fenêtre des succès](#101-les-succès) |
| **❔** | ouvre ou ferme le panneau « 🏡 Ton village » (comment se déplacer, creuser, vendre, poser des rails, construire) |
| **⚙️** | ouvre un petit menu : le nom du monde, **🌍 Changer de monde**, **🔊 Son : oui / non**, **🎵 Musique : oui / non** et **🔄 Recommencer à zéro** (confirmation « Effacer la partie du monde « … » et tout recommencer (village et succès compris) ? ») |

### 4.2 Le bandeau (`Hud.tsx`, styles dans `src/interface.css`)

Depuis le 27/10, il est **en haut à gauche**, au-dessus des petits boutons du coin (`.interface-haut` en colonne).

Depuis le 23/10, une rangée de **petites cases arrondies** (40 px de haut, 34 px sur téléphone, sur deux lignes si besoin). Chaque case a une icône dans un rond, une valeur et une mini-jauge ; le détail est dans l'info-bulle. Une case **rougit et palpite** quand il faut agir.

| Case | Contenu | Alerte |
|---|---|---|
| **💵 Argent** | le montant en or (en court au-delà de 10 000 : « 12,5 k », « 3,2 M » ; il **défile** jusqu'à la nouvelle valeur et **saute** à chaque vente), dessous « +*x*/s » : ce que la mine produit par seconde (`revenuParSeconde`), en vert s'il est positif. Info-bulle : le détail mine / mineurs / foreuse | — |
| **📦 Coffre** (badge doré : le niveau de la mine) | « *n*/*capacité* » et une jauge dorée | coffre plein |
| **⛏️ Pioche** | « *reste*/*max* » et une jauge verte (« 💥 Cassée ») | pioche cassée |
| **🎒 Sac** | « *n*/*taille* » et une jauge bleue | sac plein |
| **👷 / ⚡** (si on a des mineurs ou des rails électriques) | « 👷 *n* » (« 😠 » si quelqu'un n'est pas payé), « ⚡ » qui brille si au moins un trajet est électrique | mineurs sans salaire |

Le son et la musique se coupent dans le menu ⚙️. Voir [visuel-et-sons.md § 9](visuel-et-sons.md#9-les-boutons--et-).

---

## Le tutoriel (`Tutoriel.tsx`, 27/10)

Un **nouveau monde** commence par un tutoriel (règles dans `src/jeu/tutoriel.ts`, testées ; `etat.tutoriel` = l'étape ; une vieille partie n'a pas le champ et n'a pas de tutoriel). **Pépite**, un hamster mineur, parle dans une carte crème en haut de l'écran (points d'étapes, titre en Luckiest Guy, explication). Une **grosse flèche orange** rebondit sur ce qu'il faut toucher, dans un **cercle doré** qui pulse, et le reste de l'écran est un peu assombri (tout reste cliquable). La cible est trouvée par son attribut (`data-tuto="bloc"`, `data-cible="batiment:puits"`...) et suivie à chaque image ; un bouton dans un panneau défile jusqu'à lui. Sur téléphone, la flèche montre les gros boutons ronds (⛏️ Mine, 💰 Vendre) plutôt que les bâtiments, souvent cachés par le panneau.

On ne passe à l'étape suivante **qu'en faisant l'action** (une petite fanfare à chaque fois) :

1. **Salut, mineur !** (bouton « C'est parti ! ») ;
2. **Va à la mine** (flèche sur la mine), puis **Casse 10 blocs** (flèche sur le bloc, compteur) ;
3. **Construis le marché** : ouvrir le menu Bâtiments, « Poser » le marché (gratuit), « Construire ici » ;
4. **Remplis ton sac** : retourner à la mine, « Tout mettre dans le sac » ;
5. **Va au marché**, puis **Vends tout !** ;
6. **Bravo, tu as compris !** (flèche sur la liste des tâches, bouton « Terminer »).

« Passer le tutoriel » (avec confirmation) l'arrête. Une étape déjà faite est sautée.

## 5. Les missions (`Missions.tsx`)

Depuis le 27/10, la barre « prochain objectif » est **remplacée par les missions** (en haut à droite) : **une à trois** choses à faire, pour guider le joueur du marché jusqu'à l'automatisation. Depuis le 27/10 c'est une **liste de tâches à cocher** : un panneau de bois titré « ☑️ Tâches », et pour chaque tâche une ligne claire (papier) avec une **case ronde**, l'**icône**, la **consigne** en gras (un verbe d'action) et, quand il y a quelque chose à compter, une **barre de progression** avec son chiffre (« 🪨 12/25 »), puis un **bouton d'action** à droite : « Aller » ou « Construire » (bleu), « **Go !** » (vert, qui pulse) quand on peut la faire tout de suite. La **première est plus grande**. Une tâche faite se **coche** (case verte qui rebondit, texte barré, « Fait ! ») puis s'en va. **Pendant le tutoriel**, la liste est cachée (elle arrive au « Bravo »). Règles dans `src/jeu/missions.ts` (testées dans `objectifs.test.ts`), dans cet ordre :

1. **les urgences** : « Paie ton mineur au Personnel » (ou « Paie tes *n* mineurs ») et « Le coffre est plein : vide-le ! » ;
2. **les premiers pas** : « Construis le marché (gratuit) », « Casse 10 blocs à la mine » (« ⛏️ 3/10 »), « Mets les blocs du coffre dans ton sac », « Vends ton sac au marché » ;
3. **le prochain bâtiment** à construire (dans l'ordre du menu) : « Gagne *X* $ : construis : *bâtiment* », « Récupère *N* pierre : construis : *bâtiment* », puis « Construis : *bâtiment* » quand tout est là ;
4. **l'automatisation**, étape par étape : « Récupère *N* fer pour les rails », « Pose des rails de la mine au marché », « Envoie un wagonnet vers le marché », « Embauche un pousseur pour le wagonnet » (sans électricité), « Embauche un mineur au Personnel », puis les étapes du générateur (« Mets de la redstone dans le générateur », « Mets tous les rails dans le rayon du générateur ») et de la foreuse (« Relie la foreuse à la mine (rails) », « Envoie du charbon à la foreuse ») ;
5. **les améliorations les plus proches** : celles dont on a déjà la plus grande part de l'argent (pioche, niveau de la mine, coffre, sac...).

On ne garde jamais deux fois la même mission, et au plus **trois** à la fois.

**Clic** : pour une construction (ou les rails), ouvre le **menu Bâtiments** ; sinon le hamster marche jusqu'au bon bâtiment (le panneau s'ouvre en arrivant).

**Mission accomplie** : elle reste un instant avec un **✔ et le texte barré**, avec le son de succès, avant de laisser la place à la suivante. (Une urgence qui s'en va, comme « Paie ton mineur », ne compte pas comme accomplie.)

**Quand un panneau de bâtiment est ouvert** : sur ordinateur, **seule la première mission** reste affichée, au-dessus du panneau ; sur téléphone, les missions sont **cachées** (le panneau prend la moitié de l'écran). Sans panneau, un téléphone montre **2 missions au plus**.

---

## 6. La carte du village (`VueVillage.tsx`)

Une carte **isométrique** : un sol en damier entouré de forêt et d'une plage, une **grille de 60 × 60 cases** (tracée seulement quand on construit), la **mine** au milieu, et tout ce que le joueur a posé. Les règles (où poser, prix, rails) sont dans [village.md](village.md) ; le dessin dans [visuel-et-sons.md § 7](visuel-et-sons.md#7-le-décor-du-village-vue-du-ciel).

**La caméra** :
- elle **suit le joueur** en douceur, ou le **wagonnet** que pousse le joueur : à chaque image de l'écran, elle rattrape une partie de l'écart (environ 90 % en 0,25 s), sans transition CSS (23/10 : plus de saccades) ; le zoom de départ dépend de la largeur de la vue ;
- **faire glisser** la carte (souris ou doigt) la déplace : la caméra reste là où on l'a mise, jusqu'à ce que le joueur se remette à marcher ;
- **zoomer** : molette (autour du point sous la souris ; depuis le 27/10, **un cran zoome presque du double** (`FORCE_MOLETTE` = 0,0085), et le mode « lignes » de Firefox est géré) ou **pincer** à deux doigts (plus fort depuis le 27/10 : `FORCE_PINCEMENT` = 2,4, un petit geste suffit), entre le zoom minimum (la carte remplit toujours la vue) et ×2,6.

**Ce qu'on voit** :
- les **bâtiments** (de vraies images, calées sur leur emprise) ; survolés, ils **se soulèvent** un peu, s'éclairent et prennent un **liseré blanc et un halo doré** (et le curseur devient une main) pour dire qu'on peut cliquer ; actifs, ils brillent d'une lueur dorée ; et le losange de l'emprise du bâtiment actif est entouré de tirets dorés qui défilent. La foreuse **vibre** quand elle tourne. Sur la mine : la **cabine de l'ascenseur** qui suit les mineurs et le **panneau du niveau** ; un bâtiment retourné garde ses écritures à l'endroit (27/10 : l'enseigne « HIRING » du Personnel) ;
- au **Personnel**, quand on embauche un pousseur pour un trajet : une **ligne jaune épaisse** en surbrillance (halo qui pulse) relie les deux bâtiments en suivant les rails, et leurs emprises sont entourées d'or ;
- le **joueur** : l'image du hamster mineur (casque jaune), vue selon où il marche ; quand il pousse un wagonnet, il est derrière lui sur les rails ;
- les **employés** quand ils sont dehors : en marche (vers la forge, le Personnel, la mine ou le quai de leur trajet), devant la forge, au quai (les pousseurs, au bord de la voie, au début des rails de leur trajet), derrière le wagonnet qu'ils poussent, ou devant le Personnel quand ils attendent leur salaire (bulle 😠, ils tapent du pied). Chacun a une étiquette à son prénom, bordée de la couleur de sa rareté ;
- le **manager** et le **recruteur** (s'ils sont embauchés), devant le Personnel, avec une étiquette dorée ;
- les **wagonnets** sur les rails, un par trajet, **en 3D** (26/10) : remplis de minerais à facettes selon ce qu'ils portent vraiment (vides, à moitié pleins ou pleins), vides au retour, avec une lueur jaune quand ils sont électriques ; ils tournent en douceur dans les virages. Au bout d'une ligne, un **butoir** rouge et blanc ;
- le **trajet en surbrillance**, quand on embauche un pousseur au Personnel : ses rails brillent en or, ses deux bâtiments sont entourés d'un pointillé doré qui tourne ;
- le **rayon du générateur** : un cercle en pointillés jaunes (bien visible quand on est devant le générateur ou qu'on le pose, discret quand il donne du courant) ;
- les **bulles de notification** au-dessus des bâtiments ;
- **la jauge du coffre** (27/10), toujours au-dessus de la mine : « 📦 *n* / *capacité* » (en court : « 1,2 k », « 12 k »), une barre verte, **orange** dès 75 %, **rouge** et qui pulse quand le coffre est plein. Les bulles de la mine sont un peu plus haut pour passer au-dessus ;
- **les ventes des wagonnets au marché** (27/10) : un « +X $ » doré jaillit **juste au-dessus du wagonnet**, par-dessus le marché, **quand il a fini de décharger** (la jauge « 💰 Vente » finie : c'est là que l'argent arrive). Il compte de 0 jusqu'au montant, puis claque (rebond, éclair blanc), avec une onde dorée, des étoiles, les 3 minerais vendus les plus chers qui sautent, et une fontaine de 12 pièces qui monte puis retombe (2 s). Plus grand avec un halo à partir de 500 $. Le compteur d'argent du bandeau saute aussi (`VenteWagonnet` dans `WagonnetVillage.tsx`).

**La plage hors de l'écran** (27/10) : quand la caméra ne voit pas la plage, ses animations (l'eau, les objets) sont mises en pause (`plage-cachee`), pour ne pas faire travailler le navigateur pour rien.

**Toucher la carte** (un appui court, sans glisser) : un **bâtiment** → le hamster y marche (en contournant ce qui gêne), puis son panneau s'ouvre ; une **case** → il y marche. Pendant qu'il pousse un wagonnet, les touchers ne font rien.

**Les bulles de notification** (`src/jeu/notifications.ts`, refaites le 23/10 puis le 27/10) : au-dessus du bâtiment, comme dans les jeux mobiles, une **grosse médaille ronde et brillante** (bord blanc épais, reflet en demi-lune, un éclat qui passe, l'icône cartoon en grand), un **ruban** de couleur aux bouts fourchus en travers du bas avec **deux mots** (« Plein ! », « Salaires ! », « Achetable »…), une **pointe** blanche vers le bâtiment, et une pastille rouge « +*n* » s'il y a d'autres choses à faire là-bas. Elle arrive en rebondissant (écrasée puis étirée), flotte doucement, et son icône se dandine toutes les 3 secondes. Les **alertes** (rouge) tremblent et lancent une onde rouge ; les **achats** (vert) ont une lueur qui respire et des étincelles dorées ; rose = prêt, bleu = nouveau, jaune = trajet à créer (« 🛤️ Automatiser » sur les rails). Survol : elle grossit ; clic : on y va.

| Sorte (couleur) | Icône · mots | Bâtiment | Quand |
|---|---|---|---|
| alerte (rouge) | 😠 · Salaires ! | Personnel | des mineurs ne sont pas payés |
| alerte (rouge) | 🚧 · Rails coupés | les deux bâtiments du trajet | les rails d'un trajet sont coupés : son wagonnet attend |
| alerte (rouge) | 🛤️ · Sans trajet | Personnel | des pousseurs n'ont plus de trajet en service |
| alerte (rouge) | 🛒 · Plein ! / 🔥 · Charbon ? | Foreuse | chariot plein / plus de charbon |
| alerte (rouge) | 🔴 · Redstone ? | Générateur | allumé, plus de redstone |
| alerte (rouge) | 🔧 · Réparer | Forgeron | ta pioche est cassée |
| alerte (rouge) | 🎒 · Vendre ! | Marché | ton sac est plein |
| alerte (rouge) | 📦 · Plein ! | Mine | le coffre est plein |
| prêt (rose) | 📦 · *nombre* | Mine | au moins 20 objets dans le coffre, sans trajet Mine → Marché |
| nouveau (bleu) | ✨ · Nouveau | Personnel | le recruteur ou le manager vient de se débloquer, pas encore vu |
| achat (vert) | ⬆️ · Achetable | tous | une amélioration y est payable tout de suite |

**En construction** (placement, pinceau, Modifier) : la grille s'affiche, et ce qu'on pose est un **fantôme** un peu transparent qui pulse, sur un losange **vert** (libre) ou **rouge** (occupé). Voir [§ 7](#7-les-boutons-du-bas).

**Les petits gains** : pour l'argent qui n'est ni une vente ni une vente de wagonnet, un petit « +*X* $ » doré monte en haut au milieu de l'écran (`Gains.tsx`). Depuis le 27/10, les ventes des wagonnets ne l'affichent plus : elles ont leur « +*X* $ » au-dessus du wagonnet (voir plus haut). Une vente au marché ou du chariot fait la grosse animation (§ 11).

---

## 7. Les boutons du bas

**Au village** (`actions-village`, de gros boutons ronds et brillants comme dans Clash of Clans, avec un reflet en haut ; ils se soulèvent au survol et s'enfoncent au clic) :

| Bouton | Couleur | Effet |
|---|---|---|
| **⛏️ Mine** (en bas à gauche) | doré, avec un **anneau qui se remplit comme le coffre** | le hamster marche jusqu'à la mine et son panneau s'ouvre (le bloc à cliquer). Coffre plein : badge « ! » et le bouton respire. Pendant qu'il pousse un wagonnet : grisé, « Wagonnet… » |
| **💰 Vendre** (à côté de la Mine) | vert, avec un badge : ce que vaut le sac | n'apparaît que si le marché est posé et que le sac n'est pas vide : le hamster va au marché. Sac plein : le bouton respire |
| **✏️ Modifier** (plus petit) | gris | passe en mode Modifier (déplacer, retourner, enlever ce qui est posé) |
| **🏗️ Bâtiments** | brique | ouvre le menu Bâtiments (et marque les nouveautés comme vues). Une **pastille rouge** compte les bâtiments **nouveaux** ou **constructibles tout de suite**, et le bouton respire |

**Pendant qu'on pose quelque chose** (`actions-edition`) :

| Bouton | Couleur | Effet |
|---|---|---|
| **✔ Construire ici** / **✔ Poser ici** | vert | pose le fantôme : « Construire ici » pour un nouveau bâtiment (on le paie), « Poser ici » pour un élément qu'on déplace (gratuit) ; grisé si la place n'est pas libre |
| **↔ Retourner** | gris | le met en **miroir** ; pas pour les rails et les pavés |
| **🗑️ Enlever** | rouge | seulement pour un rail ou un pavé déjà posé, **sans remboursement** |
| **✖ Annuler** | rouge | laisse tout comme avant |

Pour placer le fantôme (en deux temps) : il apparaît sur une place libre près du joueur et **suit la souris** (consigne « 👆 Clique (ou touche) la carte pour placer, puis valide. ») ; **un clic sur la carte le fixe**, sans le construire. Un autre clic le déplace, on peut aussi le faire glisser.

**En mode pinceau** (rails ou chemin de pavés) : la consigne « 🛤️ Touche ou glisse sur les cases pour poser des rails (3 🔩 fer la case). » (ou « 🪨 … un chemin (5 $ la case). ») et **✔ Terminé** (vert). Un rail qui fermerait une boucle n'est pas posé : toast « 🔁 Pas de boucle : les rails vont d’un bâtiment à un autre. ».

**En mode Modifier** : « ✏️ Touche un bâtiment, un rail ou un chemin pour le déplacer. » et **✔ Terminé** (vert).

Un rappel dans une petite pastille : « ← ↑ → ↓ pour marcher · Espace pour sauter » (caché sur écran tactile et sur téléphone).

### 7.1 Le menu Bâtiments (`MenuConstruction.tsx`)

Une grande fenêtre en bois qui monte du bas de l'écran, avec le titre **🏗️ Bâtiments** et un bouton ✖ (clic à côté ou Échap pour fermer). Depuis le 27/10, plus d'onglet Décorations : c'est la seule fenêtre de construction. En haut, le rappel de ce qu'on a (argent, pierre, fer…, en comptant le sac et le coffre de la mine).

Les cartes sont plus claires depuis le 27/10 (bois plus clair, herbe plus vive derrière l'image) : la règle CSS qui rendait la grille de construction de la carte transparente (`.grille-construction`, opacité 0,28) touchait aussi la grille des cartes du menu, qui a le même nom ; elle ne vise plus que le dessin du sol (`g.grille-construction`).

- une carte par bâtiment (Marché, Forgeron, Bazar, Personnel, Foreuse, Générateur) : son image, son nom, sa description, sa taille, puis :
  - **✔ Construit** (carte bordée de vert) s'il est déjà posé ;
  - **🔒 Mine niveau *n*** (image grisée avec un gros cadenas) s'il n'est pas encore débloqué ;
  - sinon son **prix** (« Gratuit ! » pour le marché ; en vert ce qu'on a, en rouge ce qui manque) et **🏗️ Poser** (bleu, grisé si on ne peut pas payer) : le menu se ferme et le fantôme apparaît sur la carte ; si on peut le payer tout de suite, la carte a un **bord doré** (`construction-abordable`) ;
  - un ruban rouge « Nouveau ! » qui saute sur les bâtiments tout juste débloqués ;
- la carte **🛤️ Rails** : le nombre de cases posées, le prix (3 🔩 fer la case) et **🛤️ Poser des rails** (mode pinceau) ;
- la carte **🪨 Chemin de pavés** : « Pour relier tes bâtiments. Juste joli ! », 5 $ la case, **🖌️ Poser** (mode pinceau).

Les **décorations** à acheter (fleurs, arbres, fontaine…) sont retirées depuis le 27/10.

---

## 8. Le panneau d'un bâtiment

| Où est le joueur | Panneau |
|---|---|
| devant aucun bâtiment | rien (la carte est dégagée) ; le bouton **❔ Aide** ouvre « 🏡 Ton village » |
| devant un bâtiment | le **panneau du bâtiment** : son icône et son nom, un bouton rond **✖** pour le fermer, sa description, puis son contenu |
| en train de pousser un wagonnet | rien |

**Quand le panneau s'ouvre** : quand le joueur **arrive en marchant** à moins de **1,3 case** du bâtiment, **de n'importe quel côté**, au clavier ou après l'avoir touché (si deux bâtiments sont aussi près, c'est celui qu'on a touché qui s'ouvre). Il ne s'ouvre **pas** quand le joueur y apparaît d'un coup (au chargement de la partie). ✖ le ferme jusqu'à ce qu'on reparte ; toucher le bâtiment le rouvre. Il est fermé pendant qu'on construit ou qu'on modifie.

### 8.1 Le contenu, bâtiment par bâtiment

Le détail (chiffres, règles) est dans chaque fiche ; voici ce qu'on voit.

| Bâtiment | Panneau | Contenu à l'écran |
|---|---|---|
| ⛏️ Mine | `PanneauMine` | en titre « Niveau *N* · *nom* » ; le **très gros bloc à cliquer** (150 px depuis le 27/10, « 👆 ⚫ Charbon », chance de doubler ou « 💥 Pioche cassée : 2 clics par bloc »), avec son **combo** « 🔥 ×*N* » (dès 3 clics à moins de 0,9 s d'écart, le cadre et le halo brillent de plus en plus, un son aux paliers 10, 25, 50, 100, 200, 500 ; seulement visuel) ; le **tableau de production** (27/10 : total en blocs/s, ≈ $/min, trois cases ⚙️ Mine / 👷 Mineurs / 👆 Toi, puis une ligne par mineur : icône de ce qu'il fait, nom, rareté, barre comparée au meilleur, blocs/s ou « 😠 salaire ») ; **📦 Coffre** (27/10 : un tableau, une ligne par minerai du niveau même à 0 : nombre, **🚃 Vendre / Garder** pour le wagonnet du marché, **🎒** ; puis **🎒 Tout mettre dans le sac** kaki), le **rappel du niveau suivant** (nouveau minerai, valeur +X %, « 💰 Achetable ! » vert) ; **🛤️ Wagonnets** (`PanneauTrajets` : un bloc par trajet qui part de la mine ; sans rails, comment les poser ; rails posés, « touche la bulle 🛤️ Automatiser » ; trajet créé, où en est son wagonnet, badge ⚡ Électrique, barre du trajet, **🛤️ Pousser** bois et **✖ Arrêter** rouge ; puis **🛒 Taille des wagonnets**) ; onglet Améliorer : la **grande carte ⬇ Descendre au niveau *N*** (tout ce qu'on y gagne, chances repliées) ; **📦 Taille du coffre** ; **🛗 Ascenseur**. Fiche : [mine.md](../batiments/mine.md) |
| 💰 Marché | `PanneauMarche` | les jauges de tout le sac (le plus cher en haut), puis **💰 Vendre la sélection · +*X* $** (vert). « Ton sac est vide. Va le remplir au coffre de la mine ! » si vide. Une jauge à 0 = objet « gardé ». Fiche : [marche.md](../batiments/marche.md) |
| ⚒️ Forgeron | `PanneauPioches` | une ligne par pioche : verrouillée, ou nom, badge « Équipée », « *N* % de chance de doubler un minerai · durabilité *D* clics », barre d'usure, **Équiper** (gris), **🔧 Réparer** (orange), **🔓 Débloquer** / **🛒 Racheter neuve** (bleu). Fiche : [forgeron.md](../batiments/forgeron.md) |
| 🎒 Bazar | `PanneauBazar` | « 🎒 Sac à dos » (« ⬆ *n* places », bleu). Les tenues sont retirées depuis le 27/10. Fiche : [bazar.md](../batiments/bazar.md) |
| 👷 Personnel | `PanneauEmployes` | salaires (boutons citron vert), manager et trésorerie, recruteur (avec leur **portrait**), **👷 Embaucher** (bleu) ou **🎲 Recruter** (arc-en-ciel), **🛤️ Embaucher un pousseur** (26/10 : boutons **Départ** puis **Arrivée**, le bouton choisi devient doré, le trajet brille sur la carte, puis **🛤️ Embaucher pour ce trajet** arc-en-ciel) ; l'équipe en deux listes, **⛏️ Mineurs** (une carte compacte chacun : jauges temps payé et sac, pioche, lien Licencier) et **🛤️ Pousseurs** (son trajet, une liste pour le changer, jauge temps payé, lien Licencier). Fiche : [personnel.md](../batiments/personnel.md) |
| ⚙️ Foreuse | `PanneauForeuse` | État (badge, vitesse, ⚡ si boostée), barre de charbon, **+1 / +10 / Tout** (anthracite), case « Recharge automatique » ; Chariot (barre violette, liste à cocher, **💰 Vendre la sélection**, **🎒 Mettre dans le sac**) ; « ⚙️ Vitesse de forage » et « 🛒 Taille du chariot » ; **🛤️ Wagonnets** (le trajet Foreuse → Marché, comme à la mine). Fiche : [foreuse.md](../batiments/foreuse.md) |
| ⚡ Générateur | `PanneauGenerateur` | « ⚡ Courant » (badge Allumé / Éteint / Plus de redstone, rayon et puissance, barre de redstone, **+1 / +10 / Tout**, **⏸ Éteindre / ▶ Allumer**, case du puisage) ; « 🔌 Ce qu'il alimente » (chaque trajet : électrique, hors du rayon ou rails coupés ; et la foreuse) ; « ⬆ Améliorer ». Fiche : [generateur.md](../batiments/generateur.md) |

Un bâtiment n'a de panneau qu'une fois **posé**.

### 8.2 Le panneau d'aide « 🏡 Ton village »

« Touche un bâtiment pour y aller (ou marche avec les flèches du clavier, Espace pour sauter). Fais glisser la carte pour la déplacer, pince ou utilise la molette pour zoomer. » ; « Devant la **mine**, clique sur le bloc pour creuser : tout va dans le coffre de la mine. Mets-le dans ton sac et va le vendre au **marché**. Puis relie la mine au marché avec des **rails** et, au panneau de la mine, envoie un **wagonnet** : il fera les voyages pour toi. » ; et le rôle des boutons Bâtiments, Modifier et Mine.

---

## 9. Les composants partagés des panneaux

### 9.1 Lignes d'achat et d'amélioration (`Amelioration.tsx`)

Présentées partout de la même façon (mine, coffre, ascenseur, wagonnet, forage, chariot, générateur, sac, mineurs, recruteur) :

- **`Amelioration`** : en haut, ce qu'on a maintenant (« 250 places », « 0,5 bloc/s sans électricité ») et des **petits carrés de niveaux** : pleins turquoise = achetés (le dernier fait un « pop »), vides = à acheter. En dessous, l'un des trois : « ✔ Niveau max » (vert), « 🔒 *texte* · *ce qu'il faut* » (cadre en pointillés), ou une ligne `Achat`.
- **`Achat`** : le **prix à gauche**, le **bouton à droite**. Bouton grisé si on ne peut pas payer.
- **`PrixCout`** : « 1 500 $ » puis « 3/10 🔩 Fer » pour chaque minerai, **en vert ce qu'on a, en rouge ce qui manque** (le sac et le coffre comptent).

### 9.2 La barre de progression (`Barre.tsx`)

Une barre avec le texte centré dessus, en plusieurs couleurs : vert (durabilité, temps payé), rouge (cassée, coffre ou sac plein, redstone), or (coffre, sac, charbon, trajet du wagonnet), violet (chariot).

### 9.3 Les jauges (`Jauges.tsx`)

Au marché et au coffre de la mine :
- **☑️ Tout sélectionner** (gris, au-dessus) : toutes les jauges au maximum ;
- une ligne par objet : mini-bloc, nom, **curseur** (0 → pile entière), compteur « *choisis*/*total* », valeur en $, bouton **Max** ;
- au marché, une ligne à 0 est en pointillés (objet **gardé**, retenu par le jeu) ;
- par défaut, tout est sélectionné sauf les objets gardés ; « Max » suit la pile même si elle grossit ;
- après une vente ou un « Mettre dans le sac », les jauges reviennent à « tout ».

Les quantités choisies (`src/choix.ts`) restent dans le composant (pas dans la sauvegarde) : pour chaque objet un nombre ou `'max'` ; `lotChoisi` fabrique le lot.

---

## 10. Les fenêtres (popups)

Toutes sur un **voile noir** qui couvre l'écran.

| Fenêtre | Ouverture | Fermeture |
|---|---|---|
| Succès | 🏅 | **Fermer**, ou clic à côté |
| Statistiques | 📊 Stats | **Fermer**, ou clic à côté |
| Menu Bâtiments | 🏗️ | ✖, Échap, ou clic à côté |
| Révélation d'une recrue | embauche avec le recruteur (Personnel) | clic n'importe où une fois dévoilée, ou le bouton |
| Confirmation | licenciement (Personnel) | ✔/✖, **Échap**, ou clic à côté (= annuler) |
| Boîtes du navigateur (`window.confirm`) | Recommencer à zéro, supprimer un monde, choix des mondes à la connexion | OK / Annuler |

L'écran de victoire, la fête du prestige et l'arbre de prestige n'existent plus (archivés dans `archives/prestige/`).

### 10.1 Les succès

« 🏅 Succès », « *n* / 20 succès débloqués. », une grille de cartes : l'emoji (ou 🔒), le titre, la description. Les succès obtenus sont bordés d'or. La liste est dans [mine-et-minage.md § 8](mine-et-minage.md#8-les-succès-srcjeusuccests).

### 10.2 Les statistiques (`Statistiques.tsx`)

- 4 tuiles : 💵 Argent gagné, ⛏️ Blocs cassés, 🕳️ Mine (niveau *N*), ⏱️ Temps de jeu (« 45 s », « 12 min », « 1 h 05 min ») ;
- « 💰 D'où vient ton argent » : une barre en 3 segments (💰 Toi (marché) `#c4841a`, 🛤️ Wagonnet `#8a5fd4`, ⚙️ Foreuse `#16958a`) et la légende avec montants et pourcentages ;
- « 🧱 Tes blocs cassés en cliquant (*n* sortes différentes) » : une barre par sorte ;
- une liste : blocs sortis tout seuls de la mine, blocs creusés par les mineurs, blocs forés par la foreuse, voyages de wagonnet, salaires payés, diamants trouvés.

Il n'y a plus d'onglets (« Cette partie » / « Depuis le début » servaient au prestige).

### 10.3 La confirmation (`Confirmation.tsx`)

Une fenêtre dans le style du jeu : titre, explication, **✔ *Confirmer*** (vert, focus automatique, grisable) et **✖ Annuler** (rouge). Utilisée pour licencier un mineur (« Licencier *nom* ? », équipement, indemnités, « il te manque … » en rouge).

### 10.4 La révélation d'une recrue (`RevelationRecrue.tsx`)

Avec le recruteur (niveau 3 de la mine), chaque embauche est une surprise :
1. **suspense (1,6 s)** : une carte « 🎩 ? Le recruteur cherche... » qui tremble et grossit, le fond passe par les 5 couleurs de rareté, roulement de tambour. Un clic dévoile tout de suite ;
2. **révélation** : la carte se retourne (3D) : étoiles (1 à 5), « *Rareté* ! », le prénom, « ⚡ Rendement ×*n* » (ou un petit mot pour un commun), le salaire par 10 min ; rayons, confettis, flash pour légendaire et mythique ;
3. bouton (arc-en-ciel) : **Au travail !** (commun), **Super !** (rare, épique), **Incroyable !** (légendaire, mythique).

---

## 11. Les notifications et retours visuels

### 11.1 Les toasts (`Toasts.tsx`)

- Sur ordinateur : sous la barre du haut. Sur téléphone : **en haut au centre de l'écran**, plus petits, et seulement les **2 derniers**.
- Au plus **5** à la fois, chacun **3,5 s** ; un message identique à un toast déjà affiché n'est pas répété.
- Les messages viennent des actions du jeu (`src/jeu`), plus :
  - **succès** : « *emoji* Succès : *titre* » (bordure et texte dorés, petite fanfare) ;
  - **retour après une absence** (affiché 7 s) : « Pendant ton absence : 📦 *n* blocs de plus dans le coffre de la mine, 🛤️ le wagonnet a rapporté *n* $, ⚙️ la foreuse a remonté *n* blocs, 😠 *n* mineurs attendent leur salaire. » (8 h rattrapées au plus).

### 11.2 Les autres signaux

| Signal | Où |
|---|---|
| éclats du bloc, minerai qui s'envole (« +1 ⚫ », « +2 💎 ×2 ! ») | panneau de la mine, à chaque clic |
| grosse animation « +*X* $ » avec gerbe de pièces | une vente au marché ou du chariot |
| petit « +*X* $ » en haut | un wagonnet a vendu au marché |
| compteur d'argent qui défile et saute | bandeau |
| case Mine (coffre) ou Sac qui clignote en rouge et tremble | bandeau, coffre ou sac plein |
| mission avec une bordure verte qui pulse | on peut la faire tout de suite |
| bulles de notification au-dessus des bâtiments | carte ([§ 6](#6-la-carte-du-village-vuevillagetsx)) |
| pastille rouge sur 🏗️ Bâtiments, ruban « Nouveau ! » dans le menu | bâtiments débloqués ou constructibles |
| lueur dorée et losange en tirets autour du bâtiment actif | carte |
| mineurs qui tapent du pied devant le Personnel (😠) | carte, salaires impayés |
| ⚡ dans le bandeau, lueur jaune d'un wagonnet | au moins un trajet électrique |

---

## 12. Les contrôles : clavier, souris, tactile

### 12.1 Le clavier (`App.tsx`)

Les touches sont ignorées quand on écrit dans un champ.

| Touche | Effet |
|---|---|
| ← ↑ → ↓ (maintenues) | marcher (5 cases/s) tant que la touche est appuyée. ↑ va vers le haut de l'écran, → vers la droite, etc. ; deux flèches ensemble = en diagonale. On glisse le long des bâtiments. Sans effet quand le menu Bâtiments est ouvert ou pendant qu'on pousse un wagonnet |
| Espace | **sauter** (pour le plaisir) |
| Échap | annuler ce qu'on pose (fantôme, pinceau), quitter le mode Modifier, fermer le menu Bâtiments ; dans une confirmation, annuler |

Seul le premier appui compte (la répétition automatique est ignorée). Quand la fenêtre perd le focus, le hamster s'arrête. On **creuse en cliquant** sur le bloc du panneau de la mine (pas au clavier).

Pendant la partie, le navigateur ne zoome pas la page (Ctrl + molette, Ctrl + / Ctrl −, pincement du pavé tactile ou de Safari sont bloqués) : seule la carte zoome.

### 12.2 La souris

- Cliquer un **bâtiment** → le hamster y marche, puis le panneau s'ouvre ; cliquer une **case** → il y marche ; cliquer une **bulle** → il va au bâtiment. **Glisser** déplace la carte, la **molette** zoome autour de la souris. En construction, le fantôme suit la souris.
- Cliquer une **mission** : aller au bon bâtiment, ou ouvrir le menu Bâtiments.
- Cliquer le **bloc de la mine** : casser un bloc.
- Bulles (`title`) au survol sur de nombreux éléments ($/s, bulles de notification, cartes des mineurs…).

### 12.3 Le tactile

**Toucher** (appui court sans bouger) = un clic ; **glisser un doigt** = déplacer la carte (ou le fantôme, si on part de lui ; ou peindre en mode pinceau) ; **pincer à deux doigts** = zoomer. Le bloc de la mine se touche aussi vite qu'on veut (`touch-action: manipulation`, pas de reflet bleu). Les champs ont un texte de 16 px (pour que l'iPhone ne zoome pas).

### 12.4 Le hamster au village (`useJoueurVillage.ts`)

Ce n'est que de l'affichage (la logique du jeu ne sait pas où il est) :
- position `x`, `y` en cases (à virgule) ; il apparaît **devant l'entrée de la mine** (au chargement, ou après « Recommencer à zéro ») ;
- vitesse **5 cases/s** (`VITESSE_JOUEUR`) ;
- `fleche(direction, appuyée)` pour le clavier ; `allerVers(case, quandArrive)` pour marcher tout seul en contournant les obstacles ; `sauter()` ;
- il regarde à droite ou à gauche selon son mouvement, de face quand il vient vers nous et de dos quand il s'éloigne ;
- si on pose un bâtiment sur lui, il ressort par la case libre la plus proche.

---

## 13. Téléphone ou ordinateur : la mise en page

| Largeur | Ce qui change |
|---|---|
| partout | plein écran ; marges `env(safe-area-inset-*)` hors de l'encoche ; seule la carte zoome |
| **> 860 px** (ordinateur) | le bandeau en haut à gauche et les boutons du coin dessous, les missions en haut à droite avec le panneau dessous (400 px, 350 px entre 861 et 1 180 px), les gros boutons ronds en bas, les toasts sous la barre du haut |
| **≤ 860 px** (tablette, téléphone) | boutons du coin de 44 px sans texte ; bandeau en petites cases ; les missions restent en haut à droite (2 au plus, cachées quand un panneau est ouvert) ; boutons ronds plus petits ; le **panneau d'un bâtiment** monte du bas au-dessus des boutons (55 % de la hauteur au plus) ; le menu Bâtiments prend presque toute la hauteur ; toasts en haut (2 au plus) ; rappel du clavier caché |
| **≤ 640 px** | statistiques : tuiles sur 2 colonnes |
| sans survol (`hover: none`) | rappel des flèches caché, champs à 16 px |

Accueil : sous 860 px « Comment jouer » passe sur 2 colonnes ; sous 760 px, le village du bandeau passe **en haut** et le texte dessous ; un joueur qui a déjà des mondes les voit juste sous le bandeau ; sous 480 px le logo rétrécit et le bouton Jouer prend toute la largeur.

---

## 14. Les couleurs des boutons

Une couleur par **sorte d'action** (« Les couleurs des boutons » dans `src/index.css`, plus `bouton-payer` et `bouton-recruter` dans `src/personnel.css`, et `bouton-construire` dans `src/village.css`). Tous les boutons ont une bordure noire, un relief, s'éclaircissent au survol, s'enfoncent au clic, et passent à moitié transparents quand ils sont grisés.

| Classe | Action | Couleur | Exemples |
|---|---|---|---|
| `bouton-creuser` (= `bouton-principal`) | jouer, valider l'essentiel | **or** | ▶ Jouer, Créer et jouer, Se connecter |
| `bouton-stop` | annuler, supprimer | **rouge** | ✖ Annuler, 🗑️, 🗑️ Enlever, ✖ Arrêter (un trajet) |
| `bouton-vendre` | vendre, confirmer | **vert** | 💰 Vendre la sélection, ✔ Confirmer, ✔ Construire ici / Poser, ✔ Terminé |
| `bouton-acheter` | acheter | **bleu** | Débloquer / Racheter une pioche, sac, embaucher, 🏗️ Poser, 🖌️ Poser (chemin), 🛤️ Poser des rails, Dupliquer, Créer un compte, Installer |
| `bouton-ameliorer` | améliorer (défaut des lignes d'amélioration) | **turquoise** | niveau de la mine, coffre, ascenseur, taille des wagonnets, forage, chariot, générateur, pioche d'un mineur, OK (renommer) |
| `bouton-reparer` | réparer | **orange** | 🔧 Réparer |
| `bouton-voyage` | se déplacer, emmener | **bois** | ⛏️ Mine, 🛤️ Pousser (un wagonnet) |
| `bouton-construire` | construire | **brique** | 🏗️ Bâtiments |
| `bouton-sac` | mettre dans le sac | **kaki** | 🎒 Mettre dans le sac (coffre, chariot) |
| `bouton-charbon` | carburant | **anthracite** | +1, +10, Tout (foreuse et générateur) |
| `bouton-payer` | payer les salaires, trésorerie | **citron vert** | panneau du Personnel |
| `bouton-recruter` | recruter | **arc-en-ciel** | 🎲 Recruter, 🛤️ Embaucher pour ce trajet (un pousseur), bouton de la révélation |
| `bouton-neutre` | le reste | **gris** | Équiper, Max, Tout sélectionner, Fermer, Renommer, ✏️ Modifier, ↔ Retourner, ⏸ Éteindre, départ et arrivée d'un pousseur (dorés une fois choisis) |

Les anciennes classes `bouton-creuser-x10`, `bouton-enchanter`, `bouton-prestige` et `bouton-ascenseur` restent dans `index.css` mais ne servent plus.

Autres styles : `bouton-petit` (version compacte des panneaux), `bouton-rond` (les gros boutons ronds du bas), `bouton-mega` (le gros bouton doré de l'accueil), `bouton-mondes`, `bouton-fermer` (le ✖ rond des panneaux), `bouton-coin` (les boutons du coin), `hud-bouton` (🔊, 🎵), `lien` (texte souligné : Licencier, Plus tard, Se déconnecter, Actualiser), `onglet` (classement), et le **bloc de la mine** (`bloc-mine`), un bouton sans fond dessiné comme un bloc. Le focus clavier est entouré d'un trait doré.
