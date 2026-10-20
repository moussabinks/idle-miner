# L'interface de Mega Digger

> Ce que voit le joueur, écran par écran et composant par composant, et ce que fait chaque bouton.
> Écrit d'après le code au 20/10 (`src/App.tsx`, `src/composants/*.tsx`, `src/index.css`…). Les règles et chiffres de chaque bâtiment sont dans les fiches [docs/batiments/](../batiments/README.md) ; le style visuel, les animations et les sons sont dans [visuel-et-sons.md](visuel-et-sons.md).

Tout le texte du jeu est en français et tutoie le joueur. Les montants s'affichent au format français (`1 250 $`).

## Sommaire

1. [Vue d'ensemble : les deux écrans](#1-vue-densemble--les-deux-écrans)
2. [L'écran d'accueil](#2-lécran-daccueil-accueiltsx)
3. [L'écran de jeu : la mise en page](#3-lécran-de-jeu--la-mise-en-page)
4. [L'en-tête et le bandeau (HUD)](#4-len-tête-et-le-bandeau-hud)
5. [La barre « prochain objectif »](#5-la-barre--prochain-objectif--prochainobjectiftsx)
6. [La vue du monde : village et mine](#6-la-vue-du-monde--village-et-mine-vuemondetsx)
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

De haut en bas :

### 2.1 Le grand bandeau (« héros »)

Un décor de grotte sombre (lueurs, éclats de minerai qui montent, rochers, voir [visuel-et-sons.md](visuel-et-sons.md#6-lécran-daccueil-accueilcss)), avec :

- le **logo** « ⛏️ MEGA / DIGGER » (police Luckiest Guy, lettres dorées) ;
- l'accroche « Creuse. Vends. **Deviens riche.** » et un paragraphe d'explication (bedrock, mineurs rares/épiques/mythiques, foreuse, prestige) ;
- le **gros bouton doré** :
  - s'il existe au moins un monde : « ▶ Jouer » + détail « *nom* · ⭐ *prestige* · -*profondeur* m » → reprend le **dernier monde joué** ;
  - sinon : « ⛏️ Commencer à creuser / Ta première mine t'attend » → crée un monde nommé « Monde 1 » et lance la partie ;
  - grisé pendant que le compte se charge ou se synchronise ;
- un lien-bouton « 🌍 Mes mondes » qui fait défiler jusqu'à la section des mondes (`#mondes`) ;
- trois gros chiffres : « -100 m jusqu'à la bedrock », « +50 m à chaque prestige », « 5 raretés de mineurs » (calculés depuis `profondeurBedrock(0)` et `PROFONDEUR_EN_PLUS_PAR_PRESTIGE`) ;
- à droite, une **illustration** : une coupe de la mine (ciel, soleil, une petite échoppe, herbe, puis 6 rangées étiquetées -2 m, -24 m, -70 m, -117 m, -140 m, -150 m avec terre, charbon, fer, redstone, or, lapis, émeraude, diamant, débris, lave, bedrock), le mineur qui creuse au fond de son puits, et une pastille « 🏆 Bedrock ». C'est un dessin fixe, pas la partie du joueur.

### 2.2 « Comment jouer » : 4 cartes numérotées

| N° | Titre | Texte |
|---|---|---|
| 1 | ⛏️ Creuse | Couche par couche : charbon, fer, or, diamants… |
| 2 | 💰 Vends | Au marché du village, et regarde ton argent grimper. |
| 3 | 👷 Automatise | Ascenseur, foreuse, mineurs et manager bossent pour toi. |
| 4 | 🏆 Prestige | Atteins la bedrock et recommence encore plus fort. |

Chaque carte a sa couleur (or, vert, bleu, rose) et se soulève au survol.

### 2.3 La section des mondes (`#mondes`)

Dans l'ordre :

1. **Carte « Installer »** (`CarteInstallation.tsx`), voir [§ 2.5](#25-la-carte--installer--carteinstallationtsx).
2. **Carte du compte** (`CarteCompte.tsx`), voir [§ 2.4](#24-la-carte-du-compte-cartecomptetsx).
3. Le titre « 🌍 Tes mondes (*n*/5) ».
4. La **grille des mondes** : une carte par monde (jusqu'à **5**), puis la carte « ✨ Nouveau monde ».

**Une carte de monde** (`CarteMonde`) :

- un liseré en haut et une lueur de la couleur du monde (5 couleurs : or `#f2b33d`, bleu `#4a8af0`, turquoise `#22b5a3`, rose `#e85aa8`, violet `#9b6cf0`) ;
- le titre « 🌍 *nom* », et le badge « Dernière partie » sur le premier de la liste (le dernier joué) ;
- 4 infos : 📏 profondeur (ou « Bedrock atteinte »), 💵 argent, ⭐ Prestige *n*, ⛏️ blocs cassés. Si la sauvegarde est illisible : « Partie illisible : elle recommencera à zéro. » ;
- « Joué il y a … » (« à l'instant », « il y a 5 min », « il y a 3 h », « il y a 2 jours ») ;
- les boutons :

| Bouton | Couleur | Effet |
|---|---|---|
| ▶ Jouer | or (creuser) | lance ce monde (grisé pendant une synchro du compte) |
| ✏️ Renommer | gris | remplace le titre par un champ (24 caractères max) + bouton « OK » (Entrée valide) ; recliquer annule |
| 📄 Dupliquer | bleu (acheter) | copie le monde ; grisé s'il y a déjà 5 mondes (bulle « 5 mondes au maximum ») |
| 🗑️ | rouge | confirmation du navigateur « Supprimer le monde « … » ? Sa partie sera perdue pour toujours. » puis suppression |

**La carte « ✨ Nouveau monde »** (bordure en pointillés) : un champ nom (24 caractères, « Monde *n+1* » par défaut) et « ⛏️ Créer et jouer » (Entrée marche aussi). Avec 5 mondes, elle est remplacée par « 5 mondes au maximum : supprime-en un pour en créer un nouveau. »

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

```
┌──────────────────────────────────────────────────────────────┐
│ ⛏️ MEGA DIGGER        Recommencer à zéro  🌍 Monde  📊  🏅  │  en-tête
│ [Argent][Profondeur][Pioche][Sac][🪣 🛗 ⭐ 🔊 🎵]            │  bandeau (HUD)
│ 🎯 prochain objectif ································ (jauge)  │
├──────────────────────────────┬───────────────────────────────┤
│  VUE DU MONDE                │  PANNEAU DE DROITE            │
│  (village en haut,           │  (le stand où l'on est,       │
│   puits de la mine dessous,  │   ou le sac dans la mine)     │
│   défile verticalement)      │                               │
│                              │                               │
│ [Creuser][Auto][Village][Mine]│  notifications (toasts)      │
│  ← → pour marcher…           │                               │
└──────────────────────────────┴───────────────────────────────┘
```

- `main.plateau` : deux colonnes sur ordinateur (`colonne-mine` à gauche, `colonne-panneaux` à droite), une seule sur téléphone (voir [§ 14](#14-téléphone-ou-ordinateur--la-mise-en-page)).
- La page a la classe `avec-mineurs` dès qu'on a au moins un mineur employé : la mine s'élargit de 2 cases pour leur galerie.

---

## 4. L'en-tête et le bandeau (HUD)

### 4.1 L'en-tête (`App.tsx`)

| Élément | Effet |
|---|---|
| **⛏️ MEGA DIGGER** | le titre (pas cliquable) |
| lien **Recommencer à zéro** | confirmation du navigateur « Effacer la partie du monde « … » et tout recommencer (succès et foreuse compris) ? » ; si OK : nouvelle partie dans ce monde, le mineur replacé devant la mine |
| **🌍 *nom du monde*** | retour à l'accueil (bulle : « Changer de monde (ta partie est sauvegardée automatiquement) ») |
| **📊 Stats** | ouvre la [fenêtre des statistiques](#102-les-statistiques-statistiquestsx) |
| **🏅 *n*/*total*** | ouvre la [fenêtre des succès](#101-les-succès) (nombre obtenus / nombre total) |

Ces trois derniers sont des pastilles grises arrondies qui passent en or au survol.

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

1. si une amélioration est payable tout de suite (la pioche en premier) : « ✨ **nom** · achetable au forgeron ! », bordure verte qui pulse, jauge verte pleine ;
2. sinon l'achat dont on a la plus grande part de l'argent : détail « *argent* / *prix* $ » ou « il manque *n* *minerai* » ;
3. quand tout est acheté : « Atteindre la bedrock · -*P* / -*bedrock* m » (pas cliquable, bulle « Continue de creuser ! ») ;
4. bedrock atteinte et tout prêt : « Prestige *n+1* · tout est prêt, à l'arbre de prestige ! ».

**Clic** : au village, le mineur marche jusqu'au bon stand ; dans la mine, il remonte au village.

Les achats regardés : pioche suivante (forgeron), ascenseur (entrée de la mine), sac (bazar), enchantements (enchanteur), activation / forage / chariot (foreuse), embauche, pioches des mineurs, recruteur, manager (Personnel).

---

## 6. La vue du monde : village et mine (`VueMonde.tsx`)

Un seul grand cadre noir à bords arrondis, qui défile **verticalement** : le village en haut, puis tout le puits creusé depuis l'entrée jusqu'à 4 couches sous le front de taille. La **caméra** (le défilement) garde le joueur au milieu : elle suit directement pendant un trajet (échelle, ascenseur) et glisse en douceur pour les grands sauts (arrivée au village…). Le joueur n'est dessiné qu'à un seul endroit à la fois (village, échelle, cabine ou front).

### 6.1 Le village (`VueVillage.tsx`)

Une bande de 250 px de haut, **plus large que l'écran** (27 tuiles de 40 px, décor jusqu'à 40 tuiles) qui défile **horizontalement** : la caméra centre le mineur, sans dépasser les bords. Les 8 stands, de gauche à droite (positions dans `src/composants/stands.ts`) :

| Stand | x (tuiles) | Dessin | Fiche |
|---|---|---|---|
| ⭐ Prestige | 1,5 | grand arbre magique rose et violet, étoile au sommet | [prestige.md](../batiments/prestige.md) |
| Mine (puits) | 4,5 | entrée de galerie dans un rocher, poutres, lanterne, rails, wagonnet | [mine.md](../batiments/mine.md) |
| 💰 Marché | 7,5 | échoppe, auvent rouge | [marche.md](../batiments/marche.md) |
| ⚒️ Forgeron | 10,5 | échoppe, auvent gris ardoise | [forgeron.md](../batiments/forgeron.md) |
| 🎒 Bazar | 13,5 | échoppe, auvent vert | [bazar.md](../batiments/bazar.md) |
| 🔮 Enchanteur | 16,5 | échoppe, auvent violet | [enchanteur.md](../batiments/enchanteur.md) |
| ⚙️ Foreuse | 19,8 | grande tour de forage (derrick) orange | [foreuse.md](../batiments/foreuse.md) |
| 👷 Personnel | 22,8 | échoppe, auvent orange, dessin de deux mineurs casqués | [personnel.md](../batiments/personnel.md) |

- Chaque stand est un **bouton** avec un petit panneau en bois portant son nom ; ce panneau devient **doré** quand le mineur est devant (à moins de 1,4 tuile). Survol : le dessin s'éclaircit. Bulle : la description du stand (ou « Débloqué au prestige 1/2 » s'il est verrouillé).
- **Cliquer un stand** : le mineur y marche tout seul. Les stands sont désactivés quand on n'est pas au village.
- **Foreuse** (avant le prestige 1) et **Personnel** (avant le prestige 2) : grisés, derrière une **barrière en bois avec un cadenas** 🔒.
- Le mineur (une taupe avec casque, gilet et sac, voir [visuel-et-sons.md](visuel-et-sons.md#4-le-personnage-personnagetsx)) marche sur le chemin, tourné dans son sens de marche, en tenant sa pioche (rien en main si elle est cassée). Les hautes herbes du premier plan passent devant lui. Il disparaît quand il monte dans l'ascenseur.

**Les repères au-dessus des stands** (un seul badge à la fois, par ordre de priorité) :

| Repère | Où | Quand |
|---|---|---|
| « ⭐ Prêt ! » (rose) | arbre de prestige | on peut passer prestige |
| « 🌟 *n* point(s) ! » (rose) | arbre de prestige | il reste des points de talent |
| « 😠 Salaires ! ⬇ » (rouge foncé) | Personnel | des mineurs ne sont pas payés |
| « Nouveau ! ⬇ » (rouge, qui saute) | Foreuse / Personnel | une nouveauté débloquée (foreuse, Personnel, recruteur, manager) pas encore vue |
| « ⬆ Niveaux ! » (jaune, qui saute) | entrée de la mine, bazar, enchanteur, foreuse, Personnel | le dernier prestige a débloqué de nouveaux niveaux, et on n'est pas encore passé devant |
| « 💰 Achetable ! » (pastille verte, en plus) | tout stand non verrouillé | une amélioration y est payable tout de suite |

**Les flèches sur le bord du village** (pilules qui clignotent, la pointe ⬅/➡ pousse vers le stand ; cliquables : le mineur y va) :
- jaune « Nouveau : **Foreuse** ! » (ou Personnel, Recruteur, Manager) ;
- jaune « ⬆ Nouveaux niveaux : **Bazar** ! » (seulement s'il n'y a pas de nouveauté à montrer), un peu plus haut ;
- rouge « *alerte* **Personnel** » quand des salaires manquent, un peu plus bas.

Elles disparaissent quand on est devant le stand concerné. Arriver devant marque la nouveauté (ou les nouveaux niveaux) comme vue, pour de bon.

**Les mineurs non payés** attendent devant le stand Personnel (petits personnages de 32 px, rangés par 4, une bulle 😠 qui saute au-dessus, ils tapent du pied ; bulle « *nom* attend son salaire »).

### 6.2 Le puits de la mine

Sous le village, une rangée par mètre. Chaque rangée (`Rangee`) contient, de gauche à droite :

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
- **Sur l'échelle** : le mineur grimpe (il se balance). **Dans la cabine** : il est dessiné dedans, derrière la grille, avec un halo doré. Une petite **caisse de minerai** apparaît dans la cabine quand elle transporte un chargement (ou qu'il y a des objets sur le quai). En route, la lampe de la cabine clignote en orange et la poulie tourne.
- **La foreuse** : son puits descend jusqu'à elle ; sa tête (machine orange et mèche) affiche « -*n* m » (ou « ↓ -*n* m » si elle est plus bas que ce qu'on voit). En marche : halo, gyrophare, mèche qui tourne, vibration, fumée, débris. Éteinte : grisée.
- **Les mineurs employés** : chacun a sa cabine (qu'on voit descendre avec lui, l'attendre à côté de lui, le remonter), et quand il creuse il est dessiné dans le trou à droite, au-dessus d'un bloc qui tremble. Son **étiquette** : icône d'activité (⛏️ creuse, ⏫ remonte, 💰 vend, ⏬ redescend, 😠 attend son salaire), son prénom (caché sur petit téléphone), « -*n* m » quand il creuse sinon le temps restant « *n* s », « ↓ » s'il est plus bas que la vue, et une mini-jauge de son sac. L'étiquette prend la couleur de sa rareté ; légendaires et mythiques ont une aura qui pulse ; elle passe au vert quand il remonte avec un sac plein.

### 6.3 Ce qui flotte par-dessus la vue

| Élément | Où | Quand / effet |
|---|---|---|
| **Indicateur foreuse** | collé en haut à droite | dès que la foreuse est active : mini-foreuse animée + « Foreuse -*n* m · en marche/arrêtée ». **Clic** : la vue défile jusqu'à la foreuse |
| **Indicateur mineurs** | dessous | « 👷 *n* mineurs · ⛏️ 2 · ⏫ 1 · 💰 1… » et « 😠 *n* sans salaire ! » (passe au rouge et clignote). Pas cliquable |
| **Bandeau « 🏆 Bedrock atteinte : creuse encore ici, ou passe prestige à l'arbre de prestige (village). »** | collé en haut | dans la mine, une fois la victoire obtenue |
| **Bandeau « 🧱 Couche trop dure pour ta pioche en *X* ! »** | collé en bas, rouge-brun | dans la mine, quand la couche suivante demande une meilleure pioche (`enGalerie`) : « Équipe ta pioche en **Y** (onglet Pioches). » si on l'a, sinon « Il te faut une pioche en **Y** : achète-la au forgeron (village). » |
| **« +X $ »** de vente | haut-milieu | grosse animation avec gerbe de 12 pièces (1,8 s), pour chaque vente du joueur |
| **« +X $ »** petit | bas-droite | pour l'argent qui n'est pas une vente (coffre, récolte des mineurs…), 1,2 s |
| **Éclats** et **trouvailles** | sur le front | éclats du bloc cassé ; pastille « +*n* *Minerai* » qui s'envole (voir [visuel-et-sons.md](visuel-et-sons.md#5-les-animations-et-effets)) |

---

## 7. La barre de boutons d'action

Toujours **les 4 mêmes boutons, à la même place** (sous la vue sur ordinateur, collés en bas de l'écran sur téléphone) ; ceux qui ne servent pas à l'endroit où l'on est sont grisés.

| Bouton | Couleur | Actif quand | Effet |
|---|---|---|---|
| **⛏️ Creuser** | or | au front de taille, sans minage en cours | casse la **couche en cours** jusqu'au bout (tous ses blocs restants), puis s'arrête. Pendant ce temps il devient **⏹️ Arrêter** (rouge) |
| **♾️ Auto** | or foncé | au front, sans minage, pioche pas cassée | creuse **sans s'arrêter**, couche après couche. Devient **⏹️ Arrêt** (rouge). S'arrête tout seul si la pioche casse (toast « 💥 Pioche cassée : creusage automatique arrêté. ») ou si le sac est plein. Bulle si la pioche est cassée : « Ta pioche est cassée : répare-la (ou creuse à la main avec « Creuser ») » |
| **🏠 Village** | bois | pas au village, pas dans la cabine | arrête le minage ; le mineur marche jusqu'au puits puis remonte en ascenseur s'il est là, sinon à l'échelle |
| **⛏️ Mine** | bois | pas au front, pas dans la cabine | descend au front : depuis le village, marche d'abord jusqu'à l'entrée de la mine, puis ascenseur (s'il attend au village) ou échelle |

Le minage s'arrête aussi tout seul quand il n'y a plus de place : sac plein sans ascenseur (toast « 🎒 Sac plein ! Remonte vendre au marché (bouton Village). »), ou, avec l'ascenseur, sac **et** quai pleins (« 🎒 Sac plein ! Envoie tes objets à la surface avec l'ascenseur (panneau Sac). »). Avec l'ascenseur, les blocs en trop attendent d'abord sur son quai ; si l'**envoi automatique** est coché, la cabine vient chercher les objets quand le sac est plein et on continue de creuser. Le minage s'arrête aussi si le mineur quitte le front.

Sous la barre, un rappel : « ← → pour marcher dans le village » (ou « pour te déplacer dans la mine »), caché sur écran tactile.

---

## 8. Le panneau de droite

Il change selon l'endroit :

| Où | Contenu |
|---|---|
| Village, entre deux stands | « Le village · Promène-toi le long du chemin avec ← →, ou clique sur un stand pour y aller. » |
| Village, devant un stand | titre (icône + nom), description, puis le panneau du stand |
| Échelle, cabine ou front | deux onglets **🎒 Sac** et **🧰 Pioches** |

### 8.1 Les panneaux des stands

Le contenu détaillé (chiffres, règles) est dans chaque fiche ; voici ce qu'on voit.

| Stand | Panneau | Contenu à l'écran |
|---|---|---|
| ⭐ Prestige | `CartePrestige` + carte « Arbre de prestige » | la [carte du prestige](#91-la-carte-du-prestige-carteprestigetsx) avec **⭐ Passer prestige *n*** ; à partir du prestige 1, « ⭐ Arbre de prestige » avec « Tu as *n* point(s) à dépenser ! » ou « *n* talent(s) débloqué(s)… » et **Ouvrir l'arbre** (rose). Fiche : [prestige.md](../batiments/prestige.md) |
| Mine (puits) | dans `App.tsx` | « Ta mine descend à **-*P* m**. » + « L'ascenseur t'attend : descente en *n* s. » ou « À l'échelle, il faut *n* s pour y descendre. » ; **⏬ Descendre dans la mine en ascenseur / à l'échelle** (bois) ; **🛗 Appeler l'ascenseur** (cyan, si construit mais pas au village ; grisé s'il roule) ; la ligne « 🛗 Ascenseur » pour le construire/l'améliorer. Fiche : [mine.md](../batiments/mine.md) |
| 💰 Marché | `PanneauMarche` | les [jauges](#93-les-jauges-jaugestsx) de tout le sac (le plus cher en haut), puis **💰 Vendre la sélection · +*X* $** (vert). « Ton sac est vide. Va creuser ! » si vide. Une jauge à 0 = objet « gardé » (le jeu s'en souvient). Fiche : [marche.md](../batiments/marche.md) |
| ⚒️ Forgeron | `PanneauPioches` | une ligne par pioche : verrouillée « 🔒 … Débloque d'abord la pioche précédente », ou nom, badge « Équipée », « Vitesse x*n* · jusqu'à -*n* m · durabilité *n* », barre d'usure, **Équiper** (gris), **🔧 Réparer** (orange, prix à gauche), **🔓 Débloquer** / **🛒 Racheter neuve** (bleu). Fiche : [forgeron.md](../batiments/forgeron.md) |
| 🎒 Bazar | `PanneauBazar` | « 🎒 Sac à dos » (ligne d'amélioration, bouton « ⬆ *n* places », bleu) ; « 🪣 Seau d'eau » + **🪣 Acheter** (bleu). Fiche : [bazar.md](../batiments/bazar.md) |
| 🔮 Enchanteur | `PanneauEnchanter` | rappel des lapis/émeraudes possédés, puis une ligne par enchantement : « ✨ *nom* », description, niveau, **✨ Enchanter *II*** (violet). Fiche : [enchanteur.md](../batiments/enchanteur.md) |
| ⚙️ Foreuse | `PanneauForeuse` | avant le prestige 1 : « 🔒 Fermé par une barrière » ; puis « Activer la foreuse » + **⚙️ Activer** (turquoise) ; une fois active : État (badge En marche / Chariot plein / Plus de charbon), barre de charbon, boutons **+1 / +10 / Tout** (anthracite), case « Recharge automatique » ; Chariot (barre violette, liste à cocher, **☑️ Tout sélectionner / ☐ Tout désélectionner**, **💰 Vendre la sélection** vert, **🎒 Mettre dans le sac (*n*)** kaki) ; lignes « ⚙️ Vitesse de forage » et « 🛒 Taille du chariot ». Fiche : [foreuse.md](../batiments/foreuse.md) |
| 👷 Personnel | `PanneauEmployes` | salaires (boutons citron vert), manager et trésorerie, recruteur, **👷 Embaucher** (bleu) ou **🎲 Recruter** (arc-en-ciel), une carte compacte par mineur (jauges temps payé et sac, lien licencier). Fiche : [personnel.md](../batiments/personnel.md) |

Les achats qui se font « à la surface » sont grisés tant qu'on n'est pas au village (le panneau des stands ne s'affiche de toute façon qu'au village).

### 8.2 Dans la mine : l'onglet 🎒 Sac (`Inventaire.tsx`)

**Sans ascenseur** : la liste du sac (mini-bloc, nom, ×*n*, valeur en $), « Ton sac est vide. Creuse ! » si vide. On ne peut rien vendre d'ici.

**Avec ascenseur**, en haut (pour ne pas viser une cible qui bouge quand le sac se remplit) :
- « 📦 *n* objet(s) attendent sur le quai de l'ascenseur : ils partent en premier. » s'il y en a ;
- deux boutons côte à côte :
  - **📦 Envoyer *n* objets** (cyan) : la cabine emporte la sélection au marché, **vendue à l'arrivée** ; « 📦 Rien à envoyer » si rien n'est choisi ; pendant le voyage : « 🛗 Là dans *n* s » / « 🛗 De retour dans *n* s » ;
  - **⏫ Remonter** (bois) si la cabine est à ton niveau : remonte au village **avec le sac plein**, rien n'est vendu ; sinon **🛗 Appeler l'ascenseur** (bois), avec le même minuteur pendant un voyage ;
  - les deux sont grisés pendant un voyage, une demande en cours, ou si le mineur bouge déjà ;
- la case **Envoi automatique quand le sac est plein**.

Puis « Choisis combien l'ascenseur emporte de chaque objet au marché. » et les [jauges](#93-les-jauges-jaugestsx) (dans l'**ordre d'arrivée** : un nouvel objet arrive en bas). Une jauge à 0 = objet gardé (aussi pour l'envoi automatique).

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

Passer prestige : nouvelle partie, mineur replacé devant la mine, puis la [fête du prestige](#106-la-fête-du-prestige-feteprestigetsx), puis l'arbre.

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

S'affiche une fois au moment où l'on atteint la bedrock : 🏆 qui scintille, « Bedrock atteinte ! », « Tu as creusé jusqu'à -*n* m… Au prochain prestige, la mine descendra jusqu'à -*n+50* m. », 4 stats (blocs cassés, $ gagnés, temps de minage, coffres ouverts), le rappel de ce qu'on garde au prestige (succès, talents, pioches, sac, enchantements, ascenseur, foreuse, personnel ; au prestige 0 : « la barrière de la foreuse s'ouvrira ! »), puis la carte du prestige en version compacte. Bouton : **Continuer à creuser** (si tout est prêt) ou **Je m'en occupe !**.

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

- Sur ordinateur : **sous le panneau de droite**, collés en bas de la colonne. Sur téléphone : **en haut au centre de l'écran** (en bas, ils cacheraient les boutons).
- Au plus **5** à la fois, chacun **3,5 s** ; un message identique à un toast déjà affiché n'est pas répété. Ils apparaissent avec un petit rebond.
- Les messages viennent des actions du jeu (`src/jeu`), plus :
  - **succès** : « *emoji* Succès : *titre* » (bordure et texte dorés, petite fanfare) ;
  - **sac plein** et **pioche cassée en mode Auto** (voir [§ 7](#7-la-barre-de-boutons-daction)) ;
  - **retour après une absence** (affiché 7 s) : « Pendant ton absence : ⚙️ la foreuse a remonté *n* blocs, 👷 tes mineurs t'ont rapporté *n* $, 😠 *n* mineurs attendent leur salaire. ». Le temps d'absence rattrapé est limité à **8 h**.

### 11.2 Les autres signaux

| Signal | Où |
|---|---|
| compteur d'argent qui défile et saute | bandeau |
| profondeur qui fait un petit bond à chaque couche | bandeau |
| case Sac qui clignote en rouge et tremble | bandeau, sac plein |
| ⭐ du bandeau qui scintille | points de talent à dépenser |
| barre « prochain objectif » qui pulse en vert | un achat est possible |
| badges, pastilles, flèches | village ([§ 6.1](#61-le-village-vuevillagetsx)) |
| indicateur mineurs rouge clignotant | mine, salaires impayés |
| la mine entière tremble | minerai rare trouvé |

---

## 12. Les contrôles : clavier, souris, tactile

### 12.1 Le clavier (`App.tsx`)

Seules les **4 flèches** sont utilisées (ignorées quand on écrit dans un champ). Pour marcher et grimper, seul le premier appui compte (la répétition automatique est ignorée) : on avance **tant que la touche est appuyée**, on s'arrête en la relâchant.

| Où | Touche | Effet |
|---|---|---|
| Village | ← / → (maintenue) | marcher le long du chemin (6 tuiles/s) |
| Village | ↓ | devant l'entrée de la mine (à moins d'1 tuile) : descendre **à l'échelle** tant qu'on tient ↓ ; ailleurs : comme le bouton **Mine** (marche jusqu'au puits puis descend) |
| Échelle | ↑ / ↓ (maintenue) | monter / descendre ; on s'arrête sur l'échelle en relâchant |
| Front de taille | ← / → | se déplacer d'une case (la répétition marche : on peut garder appuyé) |
| Front de taille | ↑ (maintenue) | marcher jusqu'à l'échelle puis remonter |
| Cabine | — | rien (c'est la cabine qui porte le mineur) |
| Fenêtre de confirmation | Échap | annuler |

On ne **creuse jamais au clavier** : seulement avec les boutons Creuser et Auto.

### 12.2 La souris

- Cliquer un **stand** ou une **flèche** du village : le mineur y marche tout seul (`useMarcheVillage.allerVers`). Appuyer une flèche du clavier pendant ce trajet l'annule.
- Cliquer la **barre « prochain objectif »** : aller au bon stand.
- Cliquer l'**indicateur de la foreuse** : faire défiler la vue jusqu'à elle.
- La molette fait défiler la vue de la mine (elle a sa barre de défilement) ; la caméra se recentre sur le joueur quand il bouge.
- Bulles (`title`) au survol sur de nombreux éléments (revenu par seconde, stands, ⭐, mineurs…).

### 12.3 Le tactile

Pas de geste particulier : tout se fait en touchant les boutons, les stands, les flèches et les jauges (curseurs). Sur écran tactile : pas de rappel des flèches, pas de zoom au double appui, pas de reflet bleu, pas de « tirer pour recharger », et les champs ont un texte de 16 px (pour que l'iPhone ne zoome pas). La barre de boutons a `touch-action: none` (pas de défilement ni de zoom en la maintenant).

### 12.4 La marche au village (`useMarcheVillage.ts`)

Ce n'est que de l'affichage (pas une règle du jeu) :
- position `x` en tuiles, bornée entre 0,5 et 26 ; départ et retour de la mine à l'entrée (x = 4,5) ;
- vitesse **6 tuiles/s**, animée à chaque image (au plus 0,1 s d'un coup) ;
- `commencer(sens)` / `arreter()` pour les flèches tenues ; `allerVers(x, quandArrive)` pour marcher tout seul jusqu'à un endroit et faire quelque chose en arrivant (descendre dans la mine) ; `placer(x)` pour téléporter (après un prestige, « Recommencer à zéro ») ;
- le personnage regarde dans le sens de la marche et fait de petits sauts en marchant.

### 12.5 Les quantités choisies (`choix.ts`)

Ce que le joueur a sélectionné avec les jauges, gardé dans le composant (pas dans la sauvegarde) : pour chaque objet un nombre ou `'max'` (toute la pile, même si elle grossit). Sans choix, un objet vaut `'max'`, sauf s'il est « gardé » (alors 0). `lotChoisi` fabrique le lot à vendre ou envoyer.

---

## 13. Navigation village ↔ mine

```
           VILLAGE (x = 0,5 … 26)
   marche ← →, clic sur un stand
                 │
     entrée de la mine (x = 4,5)
        │                    │
   échelle (↑ ↓)      ascenseur (cabine)
        │                    │
        └──── FRONT DE TAILLE ────┘
             (← → d'une case)
```

- **Descendre** : bouton **Mine**, bouton « ⏬ Descendre dans la mine » du stand Mine, ou ↓. Depuis le village, le mineur marche d'abord jusqu'à l'entrée. Il prend l'ascenseur s'il attend au village, sinon l'échelle (↓ devant l'entrée force l'échelle).
- **Remonter** : bouton **Village**, ↑, la barre d'objectif, ou **⏫ Remonter** dans le sac. Depuis le front, le mineur **marche case par case jusqu'au puits** (vers la gauche), puis prend la cabine si elle est à son niveau, sinon l'échelle.
- **Pendant un trajet en cabine**, les boutons Village et Mine sont grisés.
- **Appeler l'ascenseur** : depuis le stand Mine (au village) ou depuis le sac (dans la mine).
- L'ambiance sonore suit (oiseaux et vent au village, grotte dans la mine, de plus en plus forte en descendant).

Durées et règles : [mine.md](../batiments/mine.md).

---

## 14. Téléphone ou ordinateur : la mise en page

La largeur d'une case de mine s'adapte : `min(46px, (largeur de l'écran − 97 px − colonnes fixes) / 10)` (divisé par 12 quand il y a la galerie des mineurs), pour que la mine tienne toujours sans déborder en largeur.

| Largeur | Ce qui change |
|---|---|
| **> 860 px et hauteur ≥ 560 px** (ordinateur) | le jeu prend **exactement la hauteur de la fenêtre** (largeur max 1 180 px) : la vue de la mine s'étire pour remplir, seul le panneau de droite défile s'il est trop long, plus besoin de faire défiler la page. Deux colonnes |
| **≤ 860 px** (tablette, téléphone) | une seule colonne (vue + boutons, puis panneau) ; en-tête sur deux lignes (titre et « Recommencer à zéro », puis 🌍 / 📊 / 🏅 à parts égales) ; bandeau sur 2 colonnes (Argent, Lieu / Pioche, Sac / les petits boutons sur toute la largeur) ; vue de la mine `min(58dvh, 560px)` ; **barre de boutons collée en bas de l'écran** (fond flouté, boutons de 48 px de haut, marges pour l'encoche) ; toasts en haut au centre ; place réservée sous le dernier panneau |
| **≤ 640 px** | statistiques : tuiles sur 2 colonnes, une seule colonne pour les blocs |
| **≤ 480 px** (petit téléphone) | colonnes autour de la mine rétrécies (étiquette 26 px, échelle 12 px, ascenseur 22 px, foreuse 16 px) pour agrandir les blocs ; les **emojis des 4 boutons d'action sont cachés** ; le prénom des mineurs est caché dans la mine |
| sans survol (`hover: none`) | rappel des flèches caché, champs à 16 px |

Arbre de prestige : 5 colonnes, 3 sous 1 100 px, 2 sous 860 px, 1 sous 600 px.

Accueil : sous 860 px le bandeau passe sur une colonne et « Comment jouer » sur 2 ; sous 760 px, un joueur qui a déjà des mondes les voit **juste sous le bandeau** (avant « Comment jouer », et avant les cartes Installer et Compte) ; sous 560 px, les champs du compte prennent toute la largeur ; sous 480 px le logo rétrécit, le bouton Jouer prend toute la largeur et l'illustration de la mine est cachée.

Partout, des marges `env(safe-area-inset-*)` gardent le jeu hors de l'encoche et de la barre d'état (application installée).

---

## 15. Les couleurs des boutons

Une couleur par **sorte d'action** (« Les couleurs des boutons » dans `src/index.css`, plus `bouton-payer` et `bouton-recruter` dans `src/personnel.css`). Tous les boutons ont une bordure noire de 2 px, un relief (reflet en haut, ombre en bas), s'éclaircissent au survol, s'enfoncent de 2 px au clic, et passent à 45 % d'opacité quand ils sont grisés.

| Classe | Action | Couleur (dégradé) | Exemples |
|---|---|---|---|
| `bouton-creuser` (= `bouton-principal`) | creuser, jouer | **or** `#f2b33d → #c8861a`, texte foncé | ⛏️ Creuser, ▶ Jouer, Créer et jouer, Se connecter |
| `bouton-creuser-x10` | creuser en continu | **or foncé** `#c98f2a → #8e5f12` | ♾️ Auto |
| `bouton-stop` | arrêter, annuler, supprimer | **rouge** `#e5534b → #a3302a` | ⏹️ Arrêter, ✖ Annuler, 🗑️ |
| `bouton-vendre` | vendre, confirmer | **vert** `#4fb35a → #2f7d38` | 💰 Vendre la sélection, ✔ Confirmer |
| `bouton-acheter` | acheter | **bleu** `#4a8af0 → #2457b8` | Débloquer / Racheter une pioche, seau, sac, embaucher, Dupliquer, Créer un compte, Installer |
| `bouton-ameliorer` | améliorer (défaut des lignes d'amélioration) | **turquoise** `#22b5a3 → #127a6d` | ascenseur, forage, chariot, ⚙️ Activer, OK (renommer) |
| `bouton-reparer` | réparer | **orange** `#f28a3a → #b95713` | 🔧 Réparer |
| `bouton-enchanter` | enchanter | **violet** `#9b6cf0 → #6236b8` | ✨ Enchanter |
| `bouton-prestige` | prestige | **rose** `#e85aa8 → #a32b70`, avec un halo rose | ⭐ Passer prestige, Ouvrir l'arbre, 🌟 Choisir mon talent |
| `bouton-ascenseur` | ascenseur | **cyan** `#2cc3e0 → #137f99`, texte foncé | 📦 Envoyer, 🛗 Appeler l'ascenseur (au stand Mine) |
| `bouton-voyage` | se déplacer | **bois** `#a8784a → #6f4826` | 🏠 Village, ⛏️ Mine, ⏬ Descendre, ⏫ Remonter, 🛗 Appeler (dans le sac) |
| `bouton-sac` | mettre dans le sac | **kaki** `#b3ab52 → #77702a`, texte foncé | 🎒 Mettre dans le sac |
| `bouton-charbon` | charbon | **anthracite** `#3f3f44 → #222226`, texte orange | +1, +10, Tout |
| `bouton-payer` | payer les salaires, trésorerie | **citron vert** `#a6d936 → #66941a`, texte foncé | stand Personnel |
| `bouton-recruter` | recruter | **arc-en-ciel** (orange → rose → violet) avec un reflet qui passe | 🎲 Recruter, bouton de la révélation |
| `bouton-neutre` | le reste | **gris** `#4a4a58 → #383843` | Équiper, Max, Tout sélectionner, Fermer, Renommer |

Autres styles de boutons :
- **`bouton-petit`** : version compacte (padding 6 × 10 px, texte 0,82 rem), utilisée dans les panneaux ;
- **`bouton-mega`** : le gros bouton doré de l'accueil (qui brille et respire) ;
- **`bouton-succes`** : les pastilles grises de l'en-tête (🌍, 📊, 🏅) ;
- **`hud-bouton`** : les petits boutons du bandeau (⭐, 🔊, 🎵) ;
- **`lien`** : texte gris souligné, sans fond (Recommencer à zéro, Plus tard, Se déconnecter, Actualiser, licencier) ;
- **`onglet`** : onglets avec un trait doré sous l'onglet actif (Sac / Pioches, statistiques, classement).

Le focus clavier est entouré d'un trait doré.
