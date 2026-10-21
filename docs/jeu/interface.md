# L'interface de Mega Digger

> Ce que voit le joueur, écran par écran et composant par composant, et ce que fait chaque bouton.
> Écrit d'après le code au 20/10 (`src/App.tsx`, `src/composants/*.tsx`, `src/index.css`, `src/village.css`…), après le passage au **village vu du ciel** (20/10). Les règles et chiffres de chaque bâtiment sont dans les fiches [docs/batiments/](../batiments/README.md) ; les règles du village (grille, construction, rails, décorations, convois) dans [village.md](village.md) ; le style visuel, les animations et les sons dans [visuel-et-sons.md](visuel-et-sons.md).

Tout le texte du jeu est en français et tutoie le joueur. Les montants s'affichent au format français (`1 250 $`).

## Sommaire

1. [Vue d'ensemble : les deux écrans](#1-vue-densemble--les-deux-écrans)
2. [L'écran d'accueil](#2-lécran-daccueil-accueiltsx)
3. [L'écran de jeu : la mise en page](#3-lécran-de-jeu--la-mise-en-page)
4. [L'en-tête et le bandeau (HUD)](#4-len-tête-et-le-bandeau-hud)
5. [La barre « prochain objectif »](#5-la-barre--prochain-objectif--prochainobjectiftsx)
6. [La vue du monde : le village vu du ciel et la mine](#6-la-vue-du-monde--le-village-vu-du-ciel-et-la-mine)
7. [La barre de boutons d'action](#7-la-barre-de-boutons-daction)
8. [Le panneau de droite](#8-le-panneau-de-droite)
9. [Les composants partagés des panneaux](#9-les-composants-partagés-des-panneaux)
10. [Les fenêtres (popups)](#10-les-fenêtres-popups)
11. [Les notifications et retours visuels](#11-les-notifications-et-retours-visuels)
12. [Les contrôles : clavier, souris, tactile](#12-les-contrôles--clavier-souris-tactile)
13. [Navigation village ↔ mine](#13-navigation-village--mine)
14. [Téléphone ou ordinateur : la mise en page](#14-téléphone-ou-ordinateur--la-mise-en-page)
15. [Les couleurs des boutons](#15-les-couleurs-des-boutons)

---

## 1. Vue d'ensemble : les deux écrans

`App.tsx` n'a que deux états :

| Écran | Quand | Composant |
|---|---|---|
| **Accueil** | au lancement, et après « 🌍 *nom du monde* » dans l'en-tête du jeu | `Accueil` |
| **Jeu** | après avoir choisi (ou créé) un monde | `Jeu` (dans `App.tsx`) |

- Le compte en ligne (`useCompte`) reste ouvert pendant la partie : il recopie les mondes toutes les **20 s** s'ils ont changé, et une dernière fois quand la page passe en arrière-plan.
- En quittant le jeu pour l'accueil, la partie part **tout de suite** en ligne (`envoyerMaintenant`).
- Changer de monde recrée entièrement le jeu (`key={monde.id}`) : rien de l'ancien monde ne reste à l'écran.
- La partie est sauvegardée dans `localStorage` **à chaque changement** d'état (`usePartie`).

---

## 2. L'écran d'accueil (`Accueil.tsx`)

Refait le 20/10 dans le style des images du village (bois, or, lanternes). Derrière toute la page, un dégradé brun très sombre. Toutes les cartes de l'accueil (compte, mondes, classement, installer) sont en **bois sombre avec un filet doré**, et les champs de texte en bois foncé. De haut en bas :

### 2.1 Le grand bandeau (« héros »)

Un cadre en bois sombre avec un filet doré. Le fond est un **petit village vivant** (`SceneAccueil.tsx`, voir [visuel-et-sons.md](visuel-et-sons.md#6-lécran-daccueil-accueilcss)) : la même vue du ciel que dans le jeu, avec la mine, les 7 bâtiments, des décorations, des rails, des hamsters mineurs qui vont et viennent entre la mine, le marché, la forge et le Personnel, un wagonnet qui fait la navette, le joueur devant la mine, le manager et le recruteur à leur poste. Ce n'est qu'un décor (pas la partie du joueur). Sur ordinateur, le village est dans la moitié droite et un voile sombre à gauche laisse lire le texte ; sur téléphone, il est en haut (centré sur la mine) et le texte passe dessous. Par-dessus :

- le **logo** « MEGA / DIGGER » (police Luckiest Guy, lettres dorées) cloué sur un **panneau en bois** (planches, 4 clous dorés, un peu penché), avec le **hamster du joueur** à côté, sa pioche en diamant à la main ;
- l'accroche « Creuse. Construis. **Deviens riche.** » et un paragraphe d'explication (bedrock, village à bâtir où l'on veut dans la clairière, mineurs rares/épiques/mythiques, prestige) ;
- le **gros bouton doré** :
  - s'il existe au moins un monde : « ▶ Jouer » + détail « *nom* · ⭐ *prestige* · -*profondeur* m » (« *nom* · nouveau village » si c'est une partie d'avant le 20/10, qui va repartir de zéro) → reprend le **dernier monde joué** ;
  - sinon : « ⛏️ Commencer / Ta clairière et ta mine t'attendent » → crée un monde nommé « Monde 1 » et lance la partie ;
  - grisé pendant que le compte se charge ou se synchronise ;
- un bouton en bois « 🌍 Mes mondes » qui fait défiler jusqu'à la section des mondes (`#mondes`) ;
- trois gros chiffres : « -100 m jusqu'à la bedrock », « +50 m à chaque prestige », « 7 bâtiments à poser » (calculés depuis `profondeurBedrock(0)`, `PROFONDEUR_EN_PLUS_PAR_PRESTIGE` et `LISTE_BATIMENTS`).

### 2.2 « Comment jouer » : 4 cartes numérotées

| N° | Image | Titre | Texte |
|---|---|---|---|
| 1 | portrait du mineur casqué | Creuse | Couche par couche : charbon, fer, or, diamants… jusqu'à la bedrock. |
| 2 | le dessin du forgeron | Construis | Pose le marché, la forge, le bazar… où tu veux dans la clairière, et décore ton village. |
| 3 | portrait du recruteur | Embauche | Des mineurs rares, épiques… mythiques creusent et vont vendre à pied ou en wagonnet. |
| 4 | le dessin de l'arbre de prestige | Prestige | Atteins la bedrock et repars plus fort, dans une mine encore plus profonde. |

Chaque carte est en bois sombre, avec une pièce dorée pour le numéro, une lueur et un titre de sa couleur (or, vert, bleu, rose), et se soulève au survol. Les portraits sont dans un médaillon rond à bord doré.

### 2.3 La section des mondes (`#mondes`)

Dans l'ordre :

1. **Carte « Installer »** (`CarteInstallation.tsx`), voir [§ 2.5](#25-la-carte--installer--carteinstallationtsx).
2. **Carte du compte** (`CarteCompte.tsx`), voir [§ 2.4](#24-la-carte-du-compte-cartecomptetsx).
3. Le titre « 🌍 Tes mondes (*n*/5) ».
4. La **grille des mondes** : une carte par monde (jusqu'à **5**), puis la carte « ✨ Nouveau monde ».

**Une carte de monde** (`CarteMonde`) :

- un liseré épais en haut et une lueur de la couleur du monde sur le bois (5 couleurs : or `#f2b33d`, bleu `#4a8af0`, turquoise `#22b5a3`, rose `#e85aa8`, violet `#9b6cf0`) ;
- le titre « 🌍 *nom* », et le badge « Dernière partie » sur le premier de la liste (le dernier joué) ;
- 4 infos : 📏 profondeur (ou « Bedrock atteinte »), 💵 argent, ⭐ Prestige *n*, ⛏️ blocs cassés. Pour une partie d'une ancienne version (`partieAncienne`, avant le village vu du ciel), un cadre doré en pointillés : « 🏡 Partie de l'ancienne version : elle repart de zéro dans le nouveau village vu du ciel. » ; si la sauvegarde est illisible : « Partie illisible : elle recommencera à zéro. » ;
- « Joué il y a … » (« à l'instant », « il y a 5 min », « il y a 3 h », « il y a 2 jours ») ;
- les boutons :

| Bouton | Couleur | Effet |
|---|---|---|
| ▶ Jouer | or (creuser) | lance ce monde (grisé pendant une synchro du compte) |
| ✏️ Renommer | gris | remplace le titre par un champ (24 caractères max) + bouton « OK » (Entrée valide) ; recliquer annule |
| 📄 Dupliquer | bleu (acheter) | copie le monde ; grisé s'il y a déjà 5 mondes (bulle « 5 mondes au maximum ») |
| 🗑️ | rouge | confirmation du navigateur « Supprimer le monde « … » ? Sa partie sera perdue pour toujours. » puis suppression |

**La carte « ✨ Nouveau monde »** (bordure en pointillés brun clair) : un champ nom (24 caractères, « Monde *n+1* » par défaut) et « ⛏️ Créer et jouer » (Entrée marche aussi). Avec 5 mondes, elle est remplacée par « 5 mondes au maximum : supprime-en un pour en créer un nouveau. »

### 2.4 La carte du compte (`CarteCompte.tsx`)

Le compte est facultatif (pseudo + mot de passe, sans email).

| État | Affichage |
|---|---|
| Chargement | « ☁️ Recherche de ton compte… » |
| Pas connecté | « 👤 Ton compte · Facultatif : pour retrouver tes mondes sur un autre appareil. », champs **Pseudo** et **Mot de passe**, boutons **Se connecter** (or, aussi avec Entrée) et **Créer un compte** (bleu). Dessous : le message d'erreur en rouge s'il y en a un, et « ⚠️ Il n'y a pas d'email : un mot de passe oublié ne peut pas être récupéré. » |
| Connecté | « 👤 *pseudo* », l'état de la sauvegarde, et le lien **Se déconnecter** |

États de la sauvegarde en ligne (connecté) :
- « ☁️ Synchronisation de tes mondes… »
- « ☁️ Mondes sauvegardés en ligne (dernier envoi : 14:05) » (ou « 18/10 à 14:05 » un autre jour)
- « ☁️ Tes mondes sont sauvegardés en ligne. »
- en rouge : « ⚠️ Serveur injoignable : tes mondes restent dans ce navigateur, on réessaie tout seul. »

À la connexion, si le compte et le navigateur ont des mondes différents, une boîte de confirmation du navigateur demande lesquels garder (OK = ceux du compte, Annuler = ceux du navigateur).

### 2.5 La carte « Installer » (`CarteInstallation.tsx`)

Avec l'icône du jeu (48 px) et « 📲 Installe Mega Digger » :
- **Android / Chrome / Edge** : « Une icône sur ton écran d'accueil, le jeu en plein écran, même sans réseau. » + bouton **Installer** (bleu) qui ouvre la fenêtre d'installation du navigateur ;
- **iPhone / iPad** : « Dans Safari, touche **Partager** (le carré avec une flèche ↑), puis **Sur l'écran d'accueil**. » (pas de bouton) ;
- le lien **Plus tard** la cache pour toujours (`localStorage`, clé `idle-miner-installation-masquee`).

Elle n'apparaît pas si le jeu est déjà installé, ou si le navigateur ne sait pas installer. Détails : [visuel-et-sons.md § PWA](visuel-et-sons.md#10-lapplication-installable-pwa).

### 2.6 Le classement (`CarteClassement.tsx`)

Sous les mondes, visible par tout le monde (même sans compte) :

- titre « 🏆 Classement », deux onglets **⭐ Prestige** / **💰 Argent**, lien **Actualiser** ;
- l'explication : « Le plus haut prestige atteint » ou « Tout l'argent gagné depuis le début, prestiges compris », « (le meilleur de tes mondes) », et « Connecte-toi pour apparaître dans le classement. » si on n'est pas connecté ;
- les **20 premiers** : 🥇 🥈 🥉 puis « 4. », « 5. »…, le pseudo, ⭐ prestige et 💰 argent (la valeur triée en or, l'autre en gris ; sur téléphone seule la valeur triée reste) ;
- la ligne du joueur connecté est entourée d'or ;
- messages : « Chargement du classement… », « Personne n'est encore classé : à toi d'être le premier ! », « Impossible de charger le classement. Vérifie ta connexion. » (rouge) ;
- il se relit quand on change d'onglet, sur « Actualiser », et après chaque envoi de la sauvegarde.

### 2.7 Tout en bas

« Version *commit* · *date du build* » (petite ligne grise), pour vérifier que Vercel est à jour.

---

## 3. L'écran de jeu : la mise en page

Depuis le 20/10, l'écran de jeu a **deux modes**, selon l'endroit où est le joueur (classe `jeu mode-village` ou `jeu mode-mine`, choisie par `aLaSurface(etat)`) :

- **au village** : le **village vu du ciel** (`VueVillage.tsx`), une carte isométrique où l'on se promène et où l'on pose ses bâtiments ;
- **dans la mine** (échelle, cabine, front de taille) : la **vue en coupe 2D** d'avant (`VueMonde.tsx`), où l'on creuse.

On passe de l'un à l'autre par l'entrée de la mine, avec une animation (voir [§ 13](#13-navigation-village--mine)).

**Plein écran** (21/10, `src/plein-ecran.css`, comme Clash of Clans) : la scène (`main.scene`) prend **tout l'écran**, et l'interface (`.interface`) est posée **par-dessus**. Le calque de l'interface laisse passer les clics vers la carte, sauf sur les boutons et les panneaux eux-mêmes.

```
┌──────────────────────────────────────────────────────────────┐
│[🌍]        [Argent][Lieu][Pioche][Sac][🪣 🛗 ⭐ 🔊 🎵]        │  bandeau (HUD)
│[📊]                       🎯 prochain objectif ············  │
│[🏅]                                        ┌───────────────┐ │
│[❔]        LA CARTE (village vu du ciel)   │ PANNEAU       │ │
│[⚙️]        sur tout l'écran                │ (bâtiment, ou │ │
│                                            │  sac en mine) │ │
│                 messages (toasts)          └───────────────┘ │
│ (⛏️)          ← ↑ → ↓ pour marcher       (✏️) (🌸) (🏗️)     │  boutons ronds
└──────────────────────────────────────────────────────────────┘
```

- **En haut à gauche** (`boutons-coin`) : une colonne de petits boutons carrés en bois (voir § 4.1).
- **En haut à droite** : le bandeau (§ 4.2), en petites cases sombres, et dessous le prochain objectif (§ 5).
- **Le panneau** (`panneau-flottant`) : sur ordinateur, une carte de 400 px (350 px sur un écran moyen) à droite, entre le bandeau et les boutons ; quand il est ouvert au village, la caméra se décale vers la gauche pour que le joueur reste visible. Sur téléphone, il monte du bas, au-dessus des boutons (55 % de la hauteur au plus).
- **En bas** : les boutons d'action (§ 7). Au village, de **gros boutons ronds** : ⛏️ Mine en bas à gauche, ✏️ Modifier, 🌸 Décos et 🏗️ Bâtiments en bas à droite. Dans la mine, la barre de 4 boutons au milieu (5 sur téléphone, avec 🎒 Sac).
- **Dans la mine**, la coupe 2D est au milieu, entre le bandeau et les boutons (et à gauche du panneau du sac sur ordinateur).
- La page a la classe `avec-mineurs` dès qu'on a au moins un mineur employé (la mine 2D s'élargit pour leur galerie) et `avec-panneau` quand un panneau est ouvert.

---

## 4. L'en-tête et le bandeau (HUD)

### 4.1 Les boutons du coin (`App.tsx`)

Plus d'en-tête ni de titre pendant la partie (21/10) : une colonne de boutons carrés en bois, en haut à gauche (54 px, 44 px sur téléphone, sans texte).

| Bouton | Effet |
|---|---|
| **🌍 *nom du monde*** | retour à l'accueil (bulle : « Changer de monde (ta partie est sauvegardée automatiquement) ») |
| **📊 Stats** | ouvre la [fenêtre des statistiques](#102-les-statistiques-statistiquestsx) |
| **🏅 *n*/*total*** | ouvre la [fenêtre des succès](#101-les-succès) |
| **❔ Aide** (au village) | ouvre ou ferme le panneau « 🏡 Ton village » (comment se déplacer et construire) |
| **⚙️ Réglages** | ouvre un petit menu : **🌍 Changer de monde** et **🔄 Recommencer à zéro** (confirmation « Effacer la partie du monde « … » et tout recommencer (village, succès et foreuse compris) ? ») |

### 4.2 Le bandeau (`Hud.tsx`)

5 cases de hauteur fixe (78 px, 62 px sur ordinateur plein écran) pour que rien ne bouge en dessous :

| Case | Titre (petit, gris) | Contenu |
|---|---|---|
| **Argent** | « Argent 📈 *x* $/s » (le revenu passe au vert s'il est positif ; il peut être négatif si les salaires coûtent plus que ce qui rentre). Bulle : le détail toi / foreuse / mineurs | « 💵 *montant* $ » en or. Le nombre **défile** jusqu'à la nouvelle valeur (0,6 s) et **saute** à chaque vente |
| **Lieu** | village : « Mine : -*P* m » ; au front : nom de la zone (Surface, Cavernes, Mines, Profondeurs, Roche dure, Abîmes) ; sinon « Dans l'ascenseur » / « Sur l'échelle » | « ☀️ Village », « 📏 -*P* m » (petit bond à chaque couche), ou « 🛗 / 🪜 -*position* m » |
| **Pioche** | « *emoji* Pioche en *nom* » ou « ✋ Mains nues » | barre de durabilité verte « *reste* / *max* » (rouge « Cassée ! »), puis la ligne violette des enchantements (« Efficacité II · Fortune I ») ou « Aucun enchantement » |
| **Sac** | « 🎒 Sac », ou « 🎒 Sac plein ! Vends ou envoie tes minerais » | barre dorée « *n* / *taille* » ; **sac plein** : barre rouge, la case clignote en rouge et tremble |
| **Petits** | — | « 🪣 *seaux* », « 🛗 *niveau* » (si l'ascenseur existe), bouton **⭐ *prestige*** (à partir du prestige 1), bouton **🔊/🔇**, bouton **🎵** |

- **⭐ *prestige*** : ouvre l'[arbre de prestige](#105-larbre-de-prestige-arbreprestigetsx). S'il reste des points : « ⭐ 2 · 1 point ! », bordure dorée qui scintille. Bulle : « Prestige *n* : ventes +*15n* %, pioches +*10n* % plus rapides… ».
- **🔊 / 🔇** : coupe ou remet les bruitages. **🎵** : coupe ou remet musique et ambiances (barré et à moitié transparent quand c'est coupé). Voir [visuel-et-sons.md § 9](visuel-et-sons.md#9-les-boutons--et-).

---

## 5. La barre « prochain objectif » (`ProchainObjectif.tsx`)

Une ligne fine en forme de pilule juste sous le bandeau : « 🎯 **Pioche en Fer** · 180 / 300 $ » avec une jauge dorée de 3 px dessous. Règles dans `src/jeu/objectifs.ts` :

1. si un achat est payable tout de suite : d'abord les **bâtiments à poser** (« ✨ **Construire : Marché** · gratuit : pose-le (menu Bâtiments) ! », ou « · à poser (menu Bâtiments) ! »), puis les améliorations des bâtiments déjà posés (la pioche en premier : « ✨ **nom** · achetable au forgeron ! ») ; bordure verte qui pulse, jauge verte pleine ;
2. sinon l'achat dont on a la plus grande part de l'argent : détail « *argent* / *prix* $ » ou « il manque *n* *minerai* » ;
3. quand tout est acheté : « Atteindre la bedrock · -*P* / -*bedrock* m » (pas cliquable, bulle « Continue de creuser ! ») ;
4. bedrock atteinte et tout prêt : « Prestige *n+1* · tout est prêt, à l'arbre de prestige ! ».

**Clic** : pour une construction, ouvre le **menu Bâtiments** (dans la mine : remonte d'abord au village) ; sinon, au village, le hamster marche jusqu'au bon bâtiment (le panneau s'ouvre en arrivant) ; dans la mine, il remonte au village.

Les achats regardés : les bâtiments débloqués pas encore posés, puis, seulement dans les bâtiments posés : pioche suivante (forgeron), ascenseur (mine), sac (bazar), enchantements (enchanteur), activation / forage / chariot (foreuse), embauche, pioches des mineurs, recruteur, manager (Personnel).

---

## 6. La vue du monde : le village vu du ciel et la mine

### 6.1 Le village vu du ciel (`VueVillage.tsx`)

Une carte **isométrique** (vue du ciel à 45°, comme Clash of Clans) dans un cadre noir à bords arrondis : un sol en damier entouré de forêt (le monde fait 2 262 × 1 407 px), une **grille de 60 × 60 cases** (40 × 40 avant le 21/10, jamais tracée), la **mine** au milieu au début de la partie, et tout ce que le joueur a posé : bâtiments (5 × 5 cases), rails, chemins de pavés, décorations. Les règles (où poser, prix, rails, convois) sont dans [village.md](village.md) ; le dessin dans [visuel-et-sons.md § 7](visuel-et-sons.md#7-le-décor-du-village-vue-du-ciel).

**La caméra** :
- elle **suit le joueur** (en douceur) ; le zoom de départ dépend de la largeur de la vue (`largeur / 760`, entre le zoom minimum et ×2,6) ;
- **faire glisser** la carte (souris ou doigt) la déplace : la caméra reste là où on l'a mise, jusqu'à ce que le joueur se remette à marcher ;
- **zoomer** : molette (autour du point sous la souris) ou **pincer** à deux doigts ; du zoom minimum (la carte remplit toujours la vue, jamais de vide sur les bords) à ×2,6.

**Ce qu'on voit** :
- les **bâtiments** (de vraies images, calées sur leur emprise) ; survolés ou actifs, ils brillent d'une lueur dorée, et le losange de l'emprise du bâtiment actif est entouré de tirets dorés qui défilent. La foreuse **vibre** quand elle tourne. La mine (l'image fournie, posée sans déformation depuis le 21/10) **s'assombrit** au fil de la profondeur atteinte, avec une cage d'ascenseur par ascenseur (le tien, puis une par mineur) et un panneau de profondeur ;
- le **joueur** (21/10) : l'image du hamster mineur tirée des planches (casque jaune, en attendant une planche du joueur), vue de 3/4 vers la droite ou la gauche, de dos ou de face selon où il marche ; les tenues du Bazar ne se voient plus que dans l'aperçu du Bazar ;
- tous les personnages sont ces images (`sprites.ts`) : les mineurs avec un casque de la couleur de leur rareté ;
- les **mineurs employés** quand ils sont au village : en marche vers le marché (un sac de minerais sur le dos), vers la forge ou vers la mine ; arrêtés devant le marché (ils vendent) ou devant la forge (ils récupèrent leur pioche) ; et devant le Personnel quand ils attendent leur salaire (bulle 😠, ils tapent du pied). Chacun a une petite étiquette à son prénom, bordée de la couleur de sa rareté (comme son casque) ;
- le **manager** et le **recruteur** (s'ils sont embauchés), à leur poste devant le Personnel, avec une étiquette dorée ;
- les **chargements** qui partent au marché : un **wagonnet** sur les rails, ou une **brouette** à pied ;
- les **bulles de notification** au-dessus des bâtiments (ci-dessous).

**Toucher la carte** (un appui court, sans glisser) : un **bâtiment** → le hamster y marche (en contournant ce qui gêne), puis son panneau s'ouvre ; une **case** → il y marche. Le reste du temps, on marche avec les flèches du clavier (voir [§ 12](#12-les-contrôles--clavier-souris-tactile)).

**Les bulles de notification** (`src/jeu/notifications.ts`, 20/10) remplacent les anciens badges, pastilles et flèches du village : une pilule qui saute au-dessus du bâtiment, avec 1 ou 2 icônes (la plus urgente d'abord). Survol : toutes les explications ; clic : on y va.

| Sorte (couleur) | Icônes | Bâtiment | Quand |
|---|---|---|---|
| alerte (rouge) | 😠 | Personnel | des mineurs ne sont pas payés |
| alerte (rouge) | 🛒 / 🔥 | Foreuse | chariot plein / plus de charbon |
| alerte (rouge) | 🔧 | Forgeron | ta pioche est cassée |
| alerte (rouge) | 🎒 | Marché | ton sac est plein |
| prêt (rose) | ⭐ / 🌟 | Arbre de prestige | prêt pour le prestige / points de talent à dépenser |
| nouveau (bleu) | ✨ | Foreuse / Personnel | une nouveauté débloquée (foreuse, Personnel, recruteur, manager) pas encore vue |
| niveaux (or) | ⬆️ | tous | le dernier prestige a débloqué de nouveaux niveaux, et on n'y est pas encore passé |
| achat (vert) | 💰 | tous | une amélioration y est payable tout de suite |

Arriver devant le bâtiment marque la nouveauté (ou les nouveaux niveaux) comme vue, pour de bon. Les bulles ne concernent que les bâtiments posés.

**En construction** (placement, pinceau, Modifier) : la **grille** s'affiche (traits blancs), et ce qu'on pose est un **fantôme** un peu transparent qui pulse, sur un losange **vert** (la place est libre) ou **rouge** (occupée ; le dessin rougit aussi). Voir [§ 7](#7-la-barre-de-boutons-daction).

### 6.2 La mine en coupe (`VueMonde.tsx`)

La vue d'avant, en 2D, quand on est dans la mine : un cadre noir qui défile **verticalement**, avec la caméra qui garde le joueur au milieu (directement pendant un trajet, en douceur pour les grands sauts). Tout en haut, une petite bande de **surface** (ciel, soleil, herbe et un panneau « ☀️ Village ») ; le village lui-même n'est plus dans cette vue. Les mineurs employés y creusent dans leur « univers parallèle » de la mine (chacun sa profondeur), avec une cabine chacun dans le puits commun.

Sous la surface, une rangée par mètre. Chaque rangée (`Rangee`) contient, de gauche à droite :

| Colonne | Contenu |
|---|---|
| étiquette | « -*n* m » tous les 5 m, et sur la rangée du front (en or) |
| échelle | l'échelle en bois, de l'entrée jusqu'au front |
| ascenseur | le puits de l'ascenseur : pointillés tant qu'il n'est pas construit, puis glissières en acier, poulie en haut, câble et **cabine** |
| 10 cases | la couche de la mine (`LARGEUR_MINE = 10`) |
| foreuse | le puits de la foreuse (dès le prestige 1) avec sa tête |
| mineurs | la galerie des mineurs employés (2 cases, seulement si on en a) |

- **Les rangées déjà creusées** : 10 trous vides, couleur de fond selon la zone (Surface, Cavernes, Mines, Profondeurs, Roche dure, Abîmes).
- **Le front de taille** : la dernière rangée creusée, où se tient le mineur, dans la colonne choisie (ou au-dessus du bloc qu'il casse pendant le minage). Il marche vers la gauche quand il part vers le puits.
- **La couche en cours** (juste sous le front) : le bloc que le mineur va casser est **entouré de blanc** ; pendant le minage il tremble et se fissure pendant la durée du bloc. Le mineur creuse en zigzag (son orientation suit le sens de minage).
- **3 couches de plus** dessous, de plus en plus sombres ; puis la **bedrock** quand on y arrive.
- **Le joueur** est le hamster de profil (`Personnage.tsx`), avec sa tenue ; les mineurs employés ont un casque de la couleur de leur rareté.
- **Sur l'échelle** : le mineur grimpe (il se balance). **Dans la cabine** : il est dessiné dedans, derrière la grille, avec un halo doré. Une petite **caisse de minerai** apparaît dans la cabine quand elle transporte un chargement (ou qu'il y a des objets sur le quai). En route, la lampe de la cabine clignote en orange et la poulie tourne.
- **La foreuse** : son puits descend jusqu'à elle ; sa tête (machine orange et mèche) affiche « -*n* m » (ou « ↓ -*n* m » si elle est plus bas que ce qu'on voit). En marche : halo, gyrophare, mèche qui tourne, vibration, fumée, débris. Éteinte : grisée.
- **Les mineurs employés** : chacun a sa cabine (qu'on voit descendre avec lui, l'attendre à côté de lui, le remonter), et quand il creuse il est dessiné dans le trou à droite, au-dessus d'un bloc qui tremble. Son **étiquette** : icône d'activité (⛏️ creuse, ⏫ remonte, 🚶 marche au village, 💰 vend, 🔨 à la forge, ⏬ redescend, 😠 attend son salaire), son prénom (caché sur petit téléphone), « -*n* m » quand il creuse sinon le temps restant « *n* s », « ↓ » s'il est plus bas que la vue, et une mini-jauge de son sac. L'étiquette prend la couleur de sa rareté ; légendaires et mythiques ont une aura qui pulse ; elle passe au vert quand il remonte avec un sac plein.

### 6.3 Ce qui flotte par-dessus la vue

| Élément | Où | Quand / effet |
|---|---|---|
| **Indicateur foreuse** | collé en haut à droite | dès que la foreuse est active : mini-foreuse animée + « Foreuse -*n* m · en marche/arrêtée ». **Clic** : la vue défile jusqu'à la foreuse |
| **Indicateur mineurs** | dessous | « 👷 *n* mineurs · ⛏️ 2 · ⏫ 1 · 💰 1… » et « 😠 *n* sans salaire ! » (passe au rouge et clignote). Pas cliquable |
| **Bandeau « 🏆 Bedrock atteinte : creuse encore ici, ou passe prestige à l'arbre de prestige (village). »** | collé en haut | une fois la victoire obtenue |
| **Bandeau « 🧱 Couche trop dure pour ta pioche en *X* ! »** | collé en bas, rouge-brun | dans la mine, quand la couche suivante demande une meilleure pioche (`enGalerie`) : « Équipe ta pioche en **Y** (onglet Pioches). » si on l'a, sinon « Il te faut une pioche en **Y** : achète-la au forgeron (village). » |
| **« +X $ »** de vente | haut-milieu | grosse animation avec gerbe de 12 pièces (1,8 s), pour chaque vente du joueur |
| **« +X $ »** petit | bas-droite | pour l'argent qui n'est pas une vente (coffre, récolte des mineurs…), 1,2 s |
| **Éclats** et **trouvailles** | sur le front | éclats du bloc cassé ; pastille « +*n* *Minerai* » qui s'envole (voir [visuel-et-sons.md](visuel-et-sons.md#5-les-animations-et-effets)) |

---

## 7. La barre de boutons d'action

Ils sont posés sur la scène, en bas de l'écran, et changent avec le mode.

**Au village** (`actions-village`, de gros boutons ronds comme dans Clash of Clans : ⛏️ Mine en bas à gauche, les trois autres en bas à droite) :

| Bouton | Couleur | Effet |
|---|---|---|
| **🏗️ Bâtiments** | brique | ouvre le menu Bâtiments (et marque les nouveautés comme vues). Une **pastille rouge** qui saute compte les bâtiments **nouveaux** (pas encore vus dans le menu) **ou constructibles tout de suite** |
| **🌸 Décos** | rose fleur | ouvre le menu Décorations |
| **✏️ Modifier** | gris | passe en mode Modifier (déplacer, retourner, enlever ce qui est posé) |
| **⛏️ Mine** | bois | le hamster marche jusqu'à la mine, puis on y entre (comme « Entrer dans la mine ») ; grisé pendant l'animation |

**Pendant qu'on pose quelque chose** (un bâtiment, une décoration, ou un rail / un pavé qu'on déplace) (`actions-edition`) :

| Bouton | Couleur | Effet |
|---|---|---|
| **✔ Construire ici** / **✔ Poser (*prix* $)** / **✔ Poser ici** | vert | pose le fantôme : « Construire ici » pour un nouveau bâtiment (on le paie), « Poser (*prix* $) » pour une nouvelle décoration, « Poser ici » pour un élément qu'on déplace (gratuit) ; grisé si la place n'est pas libre |
| **↔ Retourner** | gris | le met en **miroir** (gauche ↔ droite ; l'entrée change de côté) ; pas pour les rails et les pavés |
| **🗑️ Enlever** | rouge | seulement pour une décoration, un rail ou un pavé déjà posé : l'enlève, **sans remboursement** (un bâtiment ne s'enlève pas) |
| **✖ Annuler** | rouge | laisse tout comme avant |

Pour placer le fantôme (21/10, en deux temps) : il apparaît sur une place libre près du joueur et **suit la souris** (consigne « 👆 Clique (ou touche) la carte pour placer, puis valide. ») ; **un clic sur la carte le fixe** là où on a cliqué, sans le construire : il ne suit plus la souris et on peut aller cliquer sur « Construire ici ». Un autre clic le déplace, on peut aussi le faire glisser. Sur téléphone, on touche la case où le mettre (il s'y centre).

**En mode pinceau** (rails ou chemin de pavés) : une consigne « 🛤️ Touche ou glisse sur les cases pour poser des rails (10 🔩 fer la case). » (ou « 🪨 … un chemin (5 $ la case). ») et **✔ Terminé** (vert). Chaque case touchée (ou survolée en glissant) reçoit un rail ou un pavé si elle est libre et qu'on peut payer.

**En mode Modifier** : « ✏️ Touche un bâtiment, une décoration, un rail ou un chemin pour le déplacer. » et **✔ Terminé** (vert). L'élément touché devient un fantôme, avec la barre de placement ci-dessus.

**Dans la mine** :

| Bouton | Couleur | Actif quand | Effet |
|---|---|---|---|
| **⛏️ Creuser** | or | au front de taille, sans minage en cours | casse la **couche en cours** jusqu'au bout (tous ses blocs restants), puis s'arrête. Pendant ce temps il devient **⏹️ Arrêter** (rouge) |
| **♾️ Auto** | or foncé | au front, sans minage, pioche pas cassée | creuse **sans s'arrêter**, couche après couche. Devient **⏹️ Arrêt** (rouge). S'arrête tout seul si la pioche casse (toast « 💥 Pioche cassée : creusage automatique arrêté. ») ou si le sac est plein. Bulle si la pioche est cassée : « Ta pioche est cassée : répare-la (ou creuse à la main avec « Creuser ») » |
| **🏠 Village** | bois | pas dans la cabine | arrête le minage ; le mineur marche jusqu'au puits puis remonte en ascenseur s'il est là, sinon à l'échelle. En arrivant en haut, on ressort dans le village |
| **⛏️ Front** | bois | pas au front, pas dans la cabine | redescend au front (ascenseur ou échelle) |
| **🎒 Sac** (téléphone seulement) | kaki | toujours | ouvre ou ferme le panneau du sac par-dessus la mine (sur ordinateur, il est toujours à droite) |

Le minage s'arrête aussi tout seul quand il n'y a plus de place : sac plein sans ascenseur (toast « 🎒 Sac plein ! Remonte vendre au marché (bouton Village). »), ou, avec l'ascenseur, sac **et** quai pleins (« 🎒 Sac plein ! Envoie tes objets à la surface avec l'ascenseur (panneau Sac). »). Avec l'ascenseur, les blocs en trop attendent d'abord sur son quai ; si l'**envoi automatique** est coché, la cabine vient chercher les objets quand le sac est plein et on continue de creuser. Le minage s'arrête aussi si le mineur quitte le front.

Un rappel dans une petite pastille : « ← ↑ → ↓ pour marcher · Espace pour sauter » au village (en bas au milieu), « ← → pour te déplacer · ↑ ↓ sur l'échelle » dans la mine (sous la barre) ; caché sur écran tactile et sur téléphone.

### 7.1 Les menus Bâtiments et Décorations (`MenuConstruction.tsx`)

Une grande fenêtre en bois qui monte du bas de l'écran, avec deux onglets **🏗️ Bâtiments** / **🌸 Décorations** et un bouton ✖ (clic à côté ou Échap pour fermer). En haut, le rappel de ce qu'on a : « 💵 *argent* $ · 🪨 *n* pierre · 🔩 *n* fer (dans ton sac) » (la pierre compte aussi la roche dure).

- **Bâtiments** : une carte par bâtiment (Marché, Forgeron, Bazar, Enchanteur, Arbre de prestige, Foreuse, Personnel) : son image, son nom, sa description, sa taille (5 × 5 cases), puis :
  - **✔ Construit** (carte bordée de vert) s'il est déjà posé ;
  - **🔒 Prestige *n*** (image grisée avec un gros cadenas) s'il n'est pas encore débloqué ;
  - sinon son **prix** (« Gratuit ! » pour le marché ; l'argent, puis « *n*/*m* 🪨 Pierre (ou roche dure) », « *n*/*m* 🔩 Fer », en vert ce qu'on a, en rouge ce qui manque) et **🏗️ Poser** (bleu, grisé si on ne peut pas payer) : le menu se ferme et le fantôme du bâtiment apparaît sur la carte.
  - un ruban rouge « Nouveau ! » qui saute sur les bâtiments tout juste débloqués.
  - la dernière carte : **🛤️ Rails** (prestige 2) : « Une ligne continue de la mine au marché… 3 fois plus vite qu'à pied », le nombre de cases posées, le prix (10 🔩 fer la case) et **🛤️ Poser des rails** (mode pinceau).
- **Décorations** : d'abord **🪨 Chemin de pavés** (« Pour relier tes bâtiments. Juste joli ! », 5 $ la case, **🖌️ Poser** en mode pinceau), puis une carte par décoration avec son dessin, sa taille, « on ne passe pas à travers » si elle bloque le passage, son prix et **🌸 Poser** (ou « 🔒 Prestige *n* »).

La liste, les prix et les règles : [village.md](village.md).

---

## 8. Le panneau

Il change selon l'endroit :

| Où | Contenu |
|---|---|
| Village, devant aucun bâtiment | rien (la carte est dégagée) ; le bouton **❔ Aide** ouvre « 🏡 Ton village » : comment se déplacer, zoomer et construire |
| Village, devant un bâtiment | le **panneau du bâtiment** : son icône et son nom, un bouton rond **✖** pour le fermer, sa description, puis son contenu |
| Échelle, cabine ou front | deux onglets **🎒 Sac** et **🧰 Pioches** |

**Quand le panneau d'un bâtiment s'ouvre** : quand le joueur **arrive en marchant** à moins de **1,3 case** du bâtiment, **de n'importe quel côté** (21/10 : plus besoin de trouver la porte), au clavier ou après l'avoir touché (il marche alors jusqu'au côté le plus proche ; si deux bâtiments sont aussi près, c'est celui qu'on a touché qui s'ouvre). Il ne s'ouvre **pas** quand le joueur y apparaît d'un coup (au chargement de la partie, en sortant de la mine), pour ne pas cacher la carte sur téléphone. ✖ le ferme jusqu'à ce qu'on reparte ; toucher le bâtiment le rouvre. Il est fermé pendant qu'on construit ou qu'on modifie.

### 8.1 Les panneaux des bâtiments

Le contenu détaillé (chiffres, règles) est dans chaque fiche ; voici ce qu'on voit.

| Bâtiment | Panneau | Contenu à l'écran |
|---|---|---|
| ⭐ Arbre de prestige | `CartePrestige` + carte « Arbre de prestige » | la [carte du prestige](#91-la-carte-du-prestige-carteprestigetsx) avec **⭐ Passer prestige *n*** ; à partir du prestige 1, « ⭐ Arbre de prestige » avec « Tu as *n* point(s) à dépenser ! » ou « *n* talent(s) débloqué(s)… » et **Ouvrir l'arbre** (rose). Fiche : [prestige.md](../batiments/prestige.md) |
| ⛏️ Mine | `PanneauMine` (dans `App.tsx`) | « Ta mine descend à **-*P* m** (la bedrock est à -*B* m). » + « L'ascenseur t'attend : descente en *n* s. » ou « À l'échelle, il faut *n* s pour y descendre. » ; le gros bouton doré **⛏️ Entrer dans la mine** ; **🛗 Appeler l'ascenseur** (cyan, si construit mais pas en haut ; grisé s'il roule) ; avec des rails jusqu'au marché et un sac pas vide, la carte **🛤️ Wagonnet** (les [jauges](#93-les-jauges-jaugestsx) du sac et **🛤️ Charger *n* objets**, cyan : ils partent vendre au marché) ; « 🛒 *n* objet(s) en route vers le marché. » ; la ligne « 🛗 Ascenseur » pour le construire/l'améliorer. Fiche : [mine.md](../batiments/mine.md) |
| 💰 Marché | `PanneauMarche` | les [jauges](#93-les-jauges-jaugestsx) de tout le sac (le plus cher en haut), puis **💰 Vendre la sélection · +*X* $** (vert). « Ton sac est vide. Va creuser ! » si vide. Une jauge à 0 = objet « gardé » (le jeu s'en souvient). Fiche : [marche.md](../batiments/marche.md) |
| ⚒️ Forgeron | `PanneauPioches` | une ligne par pioche : verrouillée « 🔒 … Débloque d'abord la pioche précédente », ou nom, badge « Équipée », « Vitesse x*n* · jusqu'à -*n* m · durabilité *n* », barre d'usure, **Équiper** (gris), **🔧 Réparer** (orange, prix à gauche), **🔓 Débloquer** / **🛒 Racheter neuve** (bleu). Fiche : [forgeron.md](../batiments/forgeron.md) |
| 🎒 Bazar | `PanneauBazar` + `PanneauTenues` | « 🎒 Sac à dos » (ligne d'amélioration, bouton « ⬆ *n* places », bleu) ; « 🪣 Seau d'eau » + **🪣 Acheter** (bleu) ; puis les **tenues** du joueur : un aperçu du hamster habillé, et deux listes **🎩 Chapeaux** et **🦺 Hauts** (acheter, porter, enlever / tenue de départ ; la tenue portée est entourée d'or). Fiches : [bazar.md](../batiments/bazar.md), [village.md](village.md) |
| 🔮 Enchanteur | `PanneauEnchanter` | rappel des lapis/émeraudes possédés, puis une ligne par enchantement : « ✨ *nom* », description, niveau, **✨ Enchanter *II*** (violet). Fiche : [enchanteur.md](../batiments/enchanteur.md) |
| ⚙️ Foreuse | `PanneauForeuse` | « Activer la foreuse » + **⚙️ Activer** (turquoise) ; une fois active : État (badge En marche / Chariot plein / Plus de charbon), barre de charbon, boutons **+1 / +10 / Tout** (anthracite), case « Recharge automatique » ; Chariot (barre violette, liste à cocher, **☑️ Tout sélectionner / ☐ Tout désélectionner**, **💰 Vendre la sélection** vert, **🎒 Mettre dans le sac (*n*)** kaki) ; lignes « ⚙️ Vitesse de forage » et « 🛒 Taille du chariot ». Fiche : [foreuse.md](../batiments/foreuse.md) |
| 👷 Personnel | `PanneauEmployes` | salaires (boutons citron vert), manager et trésorerie, recruteur (le manager et le recruteur ont leur **portrait** rond à bord doré en haut de leur carte), **👷 Embaucher** (bleu) ou **🎲 Recruter** (arc-en-ciel), une carte compacte par mineur (jauges temps payé et sac, lien licencier). Fiche : [personnel.md](../batiments/personnel.md) |

Un bâtiment n'a de panneau qu'une fois **posé** : la Foreuse et le Personnel se posent quand le prestige les débloque (menu Bâtiments). Les achats qui se font « à la surface » sont grisés tant qu'on n'est pas au village (les panneaux des bâtiments ne s'affichent de toute façon qu'au village).

### 8.2 Dans la mine : l'onglet 🎒 Sac (`Inventaire.tsx`)

**Sans ascenseur** : la liste du sac (mini-bloc, nom, ×*n*, valeur en $), « Ton sac est vide. Creuse ! » si vide. On ne peut rien vendre d'ici.

**Avec ascenseur**, en haut (pour ne pas viser une cible qui bouge quand le sac se remplit) :
- « 📦 *n* objet(s) attendent sur le quai de l'ascenseur : ils partent en premier. » s'il y en a ;
- deux boutons côte à côte :
  - **📦 Envoyer *n* objets** (cyan) : la cabine remonte la sélection ; en haut, elle part au marché (en wagonnet sur les rails, sinon en brouette) où elle est **vendue à l'arrivée** ; « 📦 Rien à envoyer » si rien n'est choisi ; pendant le voyage : « 🛗 Là dans *n* s » / « 🛗 De retour dans *n* s » ;
  - **⏫ Remonter** (bois) si la cabine est à ton niveau : remonte au village **avec le sac plein**, rien n'est vendu ; sinon **🛗 Appeler l'ascenseur** (bois), avec le même minuteur pendant un voyage ;
  - les deux sont grisés pendant un voyage, une demande en cours, ou si le mineur bouge déjà ;
- la case **Envoi automatique quand le sac est plein**.

Puis « Choisis combien l'ascenseur remonte de chaque objet : en haut, il les range dans le réservoir de la mine (n / 200), d'où tu les portes au marché. » et les [jauges](#93-les-jauges-jaugestsx) (dans l'**ordre d'arrivée** : un nouvel objet arrive en bas). Une jauge à 0 = objet gardé (aussi pour l'envoi automatique).

Tout en bas : la ligne « 🛗 Ascenseur » pour le construire (« Il remonte tes minerais (et toi) jusqu'au marché, sans échelle. ») ou l'améliorer, directement depuis la mine.

### 8.3 Dans la mine : l'onglet 🧰 Pioches

Le même panneau que le forgeron, avec en tête « ⬆️ Pour acheter ou réparer une pioche, remonte voir le forgeron à la surface. » : on peut seulement **Équiper** une pioche qu'on possède.

---

## 9. Les composants partagés des panneaux

### 9.1 La carte du prestige (`CartePrestige.tsx`)

Liseré rose à gauche (halo rose quand elle est prête) :
- « ⭐ Prestige *n+1* » et un badge « *faites*/*total* » ou « Prêt ! » (vert) ;
- une jauge rose « Prêt pour le prestige : *faites*/*total* » ;
- la liste des conditions (✔ faite / ✗ à faire, texte, avancement) ; en version compacte (écran de victoire), seulement celles qui manquent ;
- le texte : si tout est prêt, ce qu'on gagne (profondeur, % de ventes, % de vitesse, 1 point) ; sinon « Pour passer prestige : atteins la bedrock, et améliore au maximum tout ce que ce prestige permet (les niveaux 🔒 attendront le prochain). » ;
- **⭐ Passer prestige *n+1*** (rose), grisé tant que tout n'est pas fait.

Passer prestige : nouvelle partie (le village et ses bâtiments sont gardés), hamster replacé devant la mine, puis la [fête du prestige](#106-la-fête-du-prestige-feteprestigetsx), puis l'arbre.

### 9.2 Lignes d'achat et d'amélioration (`Amelioration.tsx`)

Présentées partout de la même façon (ascenseur, forage, chariot, sac, enchantements, mineurs, recruteur) :

- **`Amelioration`** : en haut, ce qu'on a maintenant (« 200 places », « 0,5 bloc/s ») et des **petits carrés de niveaux** : pleins turquoise = achetés (le dernier fait un « pop »), vides = à acheter, hachurés = bloqués par le prestige. En dessous, l'un des trois :
  - « ✔ Niveau max » (vert) ;
  - « 🔒 *texte* · au prestige *n* » (cadre en pointillés) ;
  - une ligne `Achat`.
- **`Achat`** : le **prix à gauche**, le **bouton à droite**. Bouton grisé si on ne peut pas payer.
- **`PrixCout`** : « 1 500 $ » puis « 3/10 🔩 Fer » pour chaque minerai, **en vert ce qu'on a, en rouge ce qui manque** (le nombre possédé est plafonné au nombre demandé).

### 9.3 Les jauges (`Jauges.tsx`)

Au marché et dans le sac (avec ascenseur) :
- **☑️ Tout sélectionner** (gris, au-dessus) : toutes les jauges au maximum, plus aucun objet gardé ; grisé si tout est déjà au max ;
- une ligne par objet : mini-bloc, nom, **curseur** (0 → pile entière), compteur « *choisis*/*total* », valeur en $ (bonus de vente compris), bouton **Max** ;
- une ligne à 0 est en pointillés et à moitié transparente (objet **gardé**, retenu par le jeu : il repart de 0 la fois suivante) ;
- par défaut, tout est sélectionné sauf les objets gardés ; « Max » suit la pile même si elle grossit ;
- après une vente ou un envoi, les jauges reviennent à « tout ».

### 9.4 La barre de progression (`Barre.tsx`)

Une barre de 18 px avec le texte centré dessus, en 4 couleurs : vert (durabilité), rouge (cassée, sac plein), or (sac, charbon), violet (chariot).

---

## 10. Les fenêtres (popups)

Toutes sur un **voile noir à 70 %** qui couvre l'écran.

| Fenêtre | Ouverture | Fermeture |
|---|---|---|
| Succès | 🏅 de l'en-tête | **Fermer**, ou clic à côté |
| Statistiques | 📊 Stats | **Fermer**, ou clic à côté |
| Victoire | une seule fois, en atteignant la bedrock | son bouton seulement |
| Fête du prestige | juste après un prestige | **🌟 Choisir mon talent** (ouvre l'arbre) |
| Arbre de prestige | après la fête, ⭐ du bandeau, « Ouvrir l'arbre » | **Plus tard** / **Fermer** seulement |
| Révélation d'une recrue | embauche avec le recruteur (Personnel) | clic n'importe où une fois dévoilée, ou le bouton |
| Confirmation | licenciement (Personnel) | ✔/✖, **Échap**, ou clic à côté (= annuler) |
| Boîtes du navigateur (`window.confirm`) | Recommencer à zéro, supprimer un monde, choix des mondes à la connexion | OK / Annuler |

### 10.1 Les succès

« 🏅 Succès », « *n* / *total* succès débloqués (ils restent après un prestige). », une grille de cartes : l'emoji (ou 🔒), le titre, la description. Les succès obtenus sont bordés d'or, les autres à moitié transparents.

### 10.2 Les statistiques (`Statistiques.tsx`)

- deux onglets : **Cette partie** (« (prestige *n*) ») et **Depuis le début** (prestiges compris) ;
- 4 tuiles : 💵 Argent gagné, ⛏️ Blocs cassés, 📏 Le plus bas, ⏱️ Temps à creuser (« 45 s », « 12 min », « 1 h 05 min ») ;
- « 💰 D'où vient ton argent » : une barre partagée en 3 segments (⛏️ Toi `#c4841a`, ⚙️ Foreuse `#16958a`, 👷 Mineurs `#8a5fd4`) et la légende avec montants et pourcentages ;
- « 🧱 Tes blocs cassés (*n* sortes différentes) » : les 12 sortes les plus cassées, une barre bleue par sorte ;
- une liste : blocs forés par la foreuse, blocs creusés par les mineurs, salaires payés, diamants trouvés, coffres ouverts, géodes cassées, laves éteintes.

### 10.3 La victoire (`Victoire.tsx`)

S'affiche une fois au moment où l'on atteint la bedrock : 🏆 qui scintille, « Bedrock atteinte ! », « Tu as creusé jusqu'à -*n* m… Au prochain prestige, la mine descendra jusqu'à -*n+50* m. », 4 stats (blocs cassés, $ gagnés, temps de minage, coffres ouverts), le rappel de ce qu'on garde au prestige (village, succès, talents, pioches, sac, enchantements, ascenseur, foreuse, personnel ; au prestige 0 : « Et tu pourras construire la foreuse au village (menu Bâtiments) ! »), puis la carte du prestige en version compacte. Bouton : **Continuer à creuser** (si tout est prêt) ou **Je m'en occupe !**.

### 10.4 La confirmation (`Confirmation.tsx`)

Une fenêtre dans le style du jeu : titre, explication, **✔ *Confirmer*** (vert, focus automatique, grisable) et **✖ Annuler** (rouge). Utilisée pour licencier un mineur (« Licencier *nom* ? », équipement, indemnités, « il te manque … » en rouge).

### 10.5 L'arbre de prestige (`ArbrePrestige.tsx`)

« ⭐ Arbre de prestige », « Choisis ta récompense : *n* point(s) à dépenser » (doré) ou « Aucun point à dépenser », le rappel des règles, puis **5 branches en colonnes** (Mineur, Marchand, Ingénieur, Patron, Recrutement), chacune avec sa couleur. Chaque talent est un bouton : **✔ Débloqué** (rempli de la couleur de la branche), **Choisir (1 point)** (pointillés qui pulsent, se soulève au survol), ou 🔒. Un trait relie chaque talent au suivant. Les branches Patron et Recrutement sont grisées avec un message tant qu'on n'a pas les mineurs (prestige 2) / le recruteur. Le talent qu'on vient de prendre grossit un instant. Détails : [prestige.md](../batiments/prestige.md).

### 10.6 La fête du prestige (`FetePrestige.tsx`)

Plein écran sur fond rose : un flash, des rayons dorés qui tournent, une grande ⭐ qui arrive en tournant, « FÉLICITATIONS ! », « Prestige *n* », 4 gains qui apparaissent un par un (💰 Ventes +*x* %, ⛏️ Pioches *x* % plus rapides, 🕳️ Mine jusqu'à -*n* m, 🌟 +1 point), **90 confettis**, une fanfare, puis le bouton **🌟 Choisir mon talent**.

### 10.7 La révélation d'une recrue (`RevelationRecrue.tsx`)

Avec le recruteur (prestige 4), chaque embauche est une surprise :
1. **suspense (1,6 s)** : une carte « 🎩 ? Le recruteur cherche... » qui tremble et grossit, le fond passe par les 5 couleurs de rareté, roulement de tambour. Un clic dévoile tout de suite ;
2. **révélation** : la carte se retourne (3D) : étoiles ★☆ (1 à 5), « *Rareté* ! », 👷, le prénom, « ⚡ Rendement ×*n* » (ou « Un mineur solide et fiable. Le prochain sera peut-être rare... » pour un commun), le salaire par 10 min ; rayons, confettis (24 + 18 par rang de rareté), flash blanc pour légendaire et mythique, halo qui pulse ;
3. bouton (arc-en-ciel) : **Au travail !** (commun), **Super !** (rare, épique), **Incroyable !** (légendaire, mythique).

Couleurs des raretés : commun `#b9b4ab`, rare `#4f9df0`, épique `#b06cf0`, légendaire `#f5a524`, mythique `#ff4d8d`.

---

## 11. Les notifications et retours visuels

### 11.1 Les toasts (`Toasts.tsx`)

- Sur ordinateur : **sous le panneau de droite**, collés en bas de la colonne. Sur téléphone : **en haut au centre de l'écran** (en bas, ils cacheraient les boutons), **plus petits**, et seulement les **2 derniers** (20/10 : avant, ils cachaient tout le haut de l'écran).
- Au plus **5** à la fois (2 visibles sur téléphone), chacun **3,5 s** ; un message identique à un toast déjà affiché n'est pas répété. Ils apparaissent avec un petit rebond.
- Les messages viennent des actions du jeu (`src/jeu`), plus :
  - **succès** : « *emoji* Succès : *titre* » (bordure et texte dorés, petite fanfare) ;
  - **sac plein** et **pioche cassée en mode Auto** (voir [§ 7](#7-la-barre-de-boutons-daction)) ;
  - **les chargements vendus** : « 🛤️ Le wagonnet (ou 🛒 La brouette) a vendu ton chargement au marché : +*X* $ » ;
  - **les constructions** : « 🏗️ *Bâtiment* construit ! » ;
  - **retour après une absence** (affiché 7 s) : « Pendant ton absence : ⚙️ la foreuse a remonté *n* blocs, 👷 tes mineurs t'ont rapporté *n* $, 😠 *n* mineurs attendent leur salaire. ». Le temps d'absence rattrapé est limité à **8 h**.

### 11.2 Les autres signaux

| Signal | Où |
|---|---|
| compteur d'argent qui défile et saute | bandeau |
| profondeur qui fait un petit bond à chaque couche | bandeau |
| case Sac qui clignote en rouge et tremble | bandeau, sac plein |
| ⭐ du bandeau qui scintille | points de talent à dépenser |
| barre « prochain objectif » qui pulse en vert | un achat est possible |
| bulles de notification au-dessus des bâtiments | village ([§ 6.1](#61-le-village-vu-du-ciel-vuevillagetsx)) |
| pastille rouge sur 🏗️ Bâtiments, ruban « Nouveau ! » dans le menu | village, bâtiments débloqués ou constructibles |
| lueur dorée et losange en tirets autour du bâtiment actif | village |
| indicateur mineurs rouge clignotant | mine, salaires impayés |
| mineurs qui tapent du pied devant le Personnel (😠) | village, salaires impayés |
| la mine entière tremble | minerai rare trouvé |

---

## 12. Les contrôles : clavier, souris, tactile

### 12.1 Le clavier (`App.tsx`)

Les touches sont ignorées quand on écrit dans un champ.

| Où | Touche | Effet |
|---|---|---|
| Village | ← ↑ → ↓ (maintenues) | marcher (5 cases/s) tant que la touche est appuyée. La vue est tournée de 45° : ↑ va vers le haut de l'écran, → vers la droite, etc. ; deux flèches ensemble = en diagonale. On ne traverse pas les bâtiments (on glisse le long). Appuyer une flèche reprend la main sur une marche automatique. Sans effet quand le menu Bâtiments / Décos est ouvert |
| Village | Espace | **sauter** (ça ne sert à rien, c'est pour le plaisir) |
| Village | Échap | annuler ce qu'on pose (fantôme, pinceau), quitter le mode Modifier, fermer le menu Bâtiments / Décos |
| Échelle | ↑ / ↓ (maintenue) | monter / descendre ; on s'arrête sur l'échelle en relâchant |
| Front de taille | ← / → | se déplacer d'une case (la répétition marche : on peut garder appuyé) |
| Front de taille | ↑ | marcher jusqu'à l'échelle puis remonter |
| Cabine | — | rien (c'est la cabine qui porte le mineur) |
| Fenêtre de confirmation | Échap | annuler |

Pour marcher et grimper, seul le premier appui compte (la répétition automatique est ignorée). Quand la fenêtre perd le focus, le hamster s'arrête. On ne **creuse jamais au clavier** : seulement avec les boutons Creuser et Auto.

### 12.2 La souris

- **Village** : cliquer un **bâtiment** → le hamster y marche, puis le panneau s'ouvre ; cliquer une **case** → il y marche ; cliquer une **bulle de notification** → il va au bâtiment. **Glisser** déplace la carte, la **molette** zoome autour de la souris. En construction, le fantôme suit la souris.
- Cliquer la **barre « prochain objectif »** : aller au bon bâtiment, ou ouvrir le menu Bâtiments.
- Cliquer l'**indicateur de la foreuse** (mine) : faire défiler la vue jusqu'à elle.
- Dans la mine, la molette fait défiler la vue (elle a sa barre de défilement) ; la caméra se recentre sur le joueur quand il bouge.
- Bulles (`title`) au survol sur de nombreux éléments (revenu par seconde, bulles de notification, ⭐, mineurs…).

### 12.3 Le tactile

Au village : **toucher** (appui de moins de 0,6 s sans bouger de plus de 7 px) = comme un clic ; **glisser un doigt** = déplacer la carte (ou le fantôme, si on part de lui ; ou peindre en mode pinceau) ; **pincer à deux doigts** = zoomer. La carte a `touch-action: none` (la page ne défile pas quand on la fait glisser).

Ailleurs, tout se fait en touchant les boutons et les jauges (curseurs). Sur écran tactile : pas de rappel des flèches, pas de zoom au double appui, pas de reflet bleu, pas de « tirer pour recharger », et les champs ont un texte de 16 px (pour que l'iPhone ne zoome pas). La barre de boutons a `touch-action: none` (pas de défilement ni de zoom en la maintenant).

### 12.4 Le hamster au village (`useJoueurVillage.ts`)

Ce n'est que de l'affichage (la logique du jeu ne sait pas où il est dans le village) :
- position `x`, `y` en cases (à virgule) ; il apparaît **devant l'entrée de la mine** (au chargement, en sortant de la mine, après un prestige ou « Recommencer à zéro ») ;
- vitesse **5 cases/s** (`VITESSE_JOUEUR`), animée à chaque image (au plus 0,1 s d'un coup) ;
- `fleche(direction, appuyée)` pour le clavier (les flèches appuyées s'additionnent) ; `allerVers(case, quandArrive)` pour marcher tout seul en contournant les obstacles (chemin le plus court, en 8 directions sans couper les coins) et faire quelque chose en arrivant (entrer dans la mine) ; `sauter()` ; `placerALaMine()` ;
- il regarde à **droite ou à gauche** selon son mouvement à l'écran, **de face** quand il vient vers nous et **de dos** quand il s'éloigne ;
- si on pose un bâtiment sur lui, il ressort par la case libre la plus proche.

### 12.5 Les quantités choisies (`choix.ts`)

Ce que le joueur a sélectionné avec les jauges, gardé dans le composant (pas dans la sauvegarde) : pour chaque objet un nombre ou `'max'` (toute la pile, même si elle grossit). Sans choix, un objet vaut `'max'`, sauf s'il est « gardé » (alors 0). `lotChoisi` fabrique le lot à vendre ou envoyer.

---

## 13. Navigation village ↔ mine

```
        VILLAGE (vue du ciel)
   flèches, toucher une case ou un bâtiment
                 │
   bâtiment Mine : « ⛏️ Entrer dans la mine » (ou bouton ⛏️ Mine)
                 │   animation : plongée dans le trou + fondu au noir
                 ▼
        MINE EN COUPE (2D)
        │                    │
   échelle (↑ ↓)      ascenseur (cabine)
        │                    │
        └──── FRONT DE TAILLE ────┘
             (← → d'une case)
```

- **Entrer dans la mine** : le gros bouton doré du panneau de la Mine, ou le bouton **⛏️ Mine** de la barre. Le hamster **marche jusqu'à l'entrée de la mine** (s'il n'y est pas déjà), puis la caméra **plonge** vers le trou (zoom ×3,2 sur le milieu de la mine, 0,75 s) pendant que l'écran devient noir ; on arrive alors dans la **vue en coupe**, qui sort du noir (0,6 s), et le mineur part vers le front de taille (ascenseur s'il attend en haut, sinon échelle).
- **Remonter** : bouton **🏠 Village**, ↑, la barre d'objectif, ou **⏫ Remonter** dans le sac. Depuis le front, le mineur **marche case par case jusqu'au puits** (vers la gauche), puis prend la cabine si elle est à son niveau, sinon l'échelle. Arrivé en haut, on **ressort dans le village** : l'animation inverse (on part de la plongée, le noir s'éclaircit en 0,8 s et la caméra recule), et le hamster réapparaît **devant l'entrée de la mine** (sans ouvrir son panneau).
- **Pendant un trajet en cabine**, les boutons Village et Front sont grisés.
- **Appeler l'ascenseur** : depuis le panneau de la Mine (au village) ou depuis le sac (dans la mine).
- L'ambiance sonore suit (oiseaux et vent au village, grotte dans la mine, de plus en plus forte en descendant).

Durées et règles : [mine.md](../batiments/mine.md).

---

## 14. Téléphone ou ordinateur : la mise en page

La largeur d'une case de mine s'adapte : `min(46px, (largeur de l'écran − 97 px − colonnes fixes) / 10)` (divisé par 12 quand il y a la galerie des mineurs), pour que la mine tienne toujours sans déborder en largeur.

| Largeur | Ce qui change |
|---|---|
| partout | le navigateur ne zoome plus la page pendant la partie (21/10 : avant, un pincement ou Ctrl + molette grossissait aussi les boutons, qui sortaient de l'écran) : seule la carte zoome. Bloqués : Ctrl + molette et le pincement du pavé tactile, Ctrl + / Ctrl −, le pincement de Safari (`gesturestart`), `user-scalable=no` et `touch-action: none` sur le jeu (les panneaux défilent toujours) |
| **> 860 px** (ordinateur) | plein écran (21/10) : la scène remplit la fenêtre, le bandeau en haut à droite, les boutons du coin en haut à gauche, le panneau à droite (400 px, 350 px sous 1 180 px de large), les gros boutons ronds en bas (70 et 86 px), les toasts au milieu sous l'objectif |
| **≤ 860 px** (tablette, téléphone) | toujours en plein écran ; boutons du coin de 44 px sans texte ; bandeau en petites cases (Pioche et Sac à moitié de largeur, enchantements cachés) ; l'objectif passe en bas, au-dessus des boutons (caché dans la mine) ; boutons ronds de 60 et 72 px ; le **panneau d'un bâtiment** monte du bas au-dessus des boutons (55 % de la hauteur au plus) ; **dans la mine**, la coupe prend toute la largeur et le sac s'ouvre avec le bouton 🎒 ; le menu Bâtiments / Décos prend 82 % de la hauteur ; toasts en bas, au-dessus de l'objectif (2 au plus) ; rappel du clavier caché |
| **≤ 640 px** | statistiques : tuiles sur 2 colonnes, une seule colonne pour les blocs |
| **≤ 480 px** (petit téléphone) | colonnes autour de la mine rétrécies (étiquette 26 px, échelle 12 px, ascenseur 22 px, foreuse 16 px) pour agrandir les blocs ; les **emojis des 4 boutons d'action sont cachés** ; le prénom des mineurs est caché dans la mine |
| sans survol (`hover: none`) | rappel des flèches caché, champs à 16 px |

Arbre de prestige : 5 colonnes, 3 sous 1 100 px, 2 sous 860 px, 1 sous 600 px.

Accueil : sous 860 px « Comment jouer » passe sur 2 colonnes ; sous 760 px, le village du bandeau passe **en haut** (290 px de haut, centré sur la mine), le logo vient à cheval sur son bas et le texte dessous, les 3 chiffres restent sur une ligne ; un joueur qui a déjà des mondes les voit **juste sous le bandeau** (avant « Comment jouer », et avant les cartes Installer et Compte) ; sous 560 px, les champs du compte prennent toute la largeur ; sous 480 px le logo et le hamster rétrécissent, le bouton Jouer prend toute la largeur et les images des cartes « Comment jouer » sont plus petites.

Partout, des marges `env(safe-area-inset-*)` gardent le jeu hors de l'encoche et de la barre d'état (application installée).

---

## 15. Les couleurs des boutons

Une couleur par **sorte d'action** (« Les couleurs des boutons » dans `src/index.css`, plus `bouton-payer` et `bouton-recruter` dans `src/personnel.css`, et `bouton-construire` et `bouton-decorer` dans `src/village.css`). Tous les boutons ont une bordure noire de 2 px, un relief (reflet en haut, ombre en bas), s'éclaircissent au survol, s'enfoncent de 2 px au clic, et passent à 45 % d'opacité quand ils sont grisés.

| Classe | Action | Couleur (dégradé) | Exemples |
|---|---|---|---|
| `bouton-creuser` (= `bouton-principal`) | creuser, jouer | **or** `#f2b33d → #c8861a`, texte foncé | ⛏️ Creuser, ⛏️ Entrer dans la mine (avec un halo doré), ▶ Jouer, Créer et jouer, Se connecter |
| `bouton-creuser-x10` | creuser en continu | **or foncé** `#c98f2a → #8e5f12` | ♾️ Auto |
| `bouton-stop` | arrêter, annuler, supprimer | **rouge** `#e5534b → #a3302a` | ⏹️ Arrêter, ✖ Annuler, 🗑️ (dont 🗑️ Enlever au village) |
| `bouton-vendre` | vendre, confirmer | **vert** `#4fb35a → #2f7d38` | 💰 Vendre la sélection, ✔ Confirmer, ✔ Construire ici / Poser, ✔ Terminé |
| `bouton-acheter` | acheter | **bleu** `#4a8af0 → #2457b8` | Débloquer / Racheter une pioche, seau, sac, tenues, embaucher, 🏗️ / 🌸 Poser et 🛤️ Poser des rails (menus Bâtiments et Décos), Dupliquer, Créer un compte, Installer |
| `bouton-ameliorer` | améliorer (défaut des lignes d'amélioration) | **turquoise** `#22b5a3 → #127a6d` | ascenseur, forage, chariot, ⚙️ Activer, OK (renommer) |
| `bouton-reparer` | réparer | **orange** `#f28a3a → #b95713` | 🔧 Réparer |
| `bouton-enchanter` | enchanter | **violet** `#9b6cf0 → #6236b8` | ✨ Enchanter |
| `bouton-prestige` | prestige | **rose** `#e85aa8 → #a32b70`, avec un halo rose | ⭐ Passer prestige, Ouvrir l'arbre, 🌟 Choisir mon talent |
| `bouton-ascenseur` | ascenseur, wagonnet | **cyan** `#2cc3e0 → #137f99`, texte foncé | 📦 Envoyer, 🛗 Appeler l'ascenseur (au bâtiment Mine), 🛤️ Charger le wagonnet |
| `bouton-voyage` | se déplacer | **bois** `#a8784a → #6f4826` | 🏠 Village, ⛏️ Mine, ⛏️ Front, ⏫ Remonter, 🛗 Appeler (dans le sac) |
| `bouton-construire` | construire | **brique** `#e0784a → #a8451f`, texte crème | 🏗️ Bâtiments (avec sa pastille rouge) |
| `bouton-decorer` | décorer | **rose fleur** `#f28ab8 → #c2427e` | 🌸 Décos |
| `bouton-sac` | mettre dans le sac | **kaki** `#b3ab52 → #77702a`, texte foncé | 🎒 Mettre dans le sac |
| `bouton-charbon` | charbon | **anthracite** `#3f3f44 → #222226`, texte orange | +1, +10, Tout |
| `bouton-payer` | payer les salaires, trésorerie | **citron vert** `#a6d936 → #66941a`, texte foncé | panneau du Personnel |
| `bouton-recruter` | recruter | **arc-en-ciel** (orange → rose → violet) avec un reflet qui passe | 🎲 Recruter, bouton de la révélation |
| `bouton-neutre` | le reste | **gris** `#4a4a58 → #383843` | Équiper, Max, Tout sélectionner, Fermer, Renommer, ✏️ Modifier, ↔ Retourner |

Autres styles de boutons :
- **`bouton-petit`** : version compacte (padding 6 × 10 px, texte 0,82 rem), utilisée dans les panneaux ;
- **`bouton-mega`** : le gros bouton doré de l'accueil (qui brille et respire) ; **`bouton-mondes`** : le bouton en bois « 🌍 Mes mondes » ;
- **`bouton-fermer`** : le bouton rond ✖ des panneaux et des menus du village (rouge au survol) ;
- **`bouton-succes`** : les pastilles grises de l'en-tête (🌍, 📊, 🏅) ;
- **`hud-bouton`** : les petits boutons du bandeau (⭐, 🔊, 🎵) ;
- **`lien`** : texte gris souligné, sans fond (Recommencer à zéro, Plus tard, Se déconnecter, Actualiser, licencier) ;
- **`onglet`** : onglets avec un trait doré sous l'onglet actif (Sac / Pioches, Bâtiments / Décorations, statistiques, classement).

Le focus clavier est entouré d'un trait doré.
