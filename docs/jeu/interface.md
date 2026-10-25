# L'interface de Mega Digger

> Ce que voit le joueur, écran par écran et composant par composant, et ce que fait chaque bouton.
> Réécrit d'après le code après la grande mise à jour du style du 25/10 (`src/App.tsx`, `src/composants/*.tsx`, `src/styles/*.css`, `src/village.css`). Les règles et chiffres de chaque bâtiment sont dans les fiches [docs/batiments/](../batiments/README.md) ; les règles du village (grille, construction, rails, chemins) dans [village.md](village.md) ; les dessins, animations et sons dans [visuel-et-sons.md](visuel-et-sons.md).

Tout le texte du jeu tutoie le joueur, en français ou en anglais (voir § 15). Les montants passent par `nombre()` et `nombreAbrege()` (`src/nombres.ts`, `src/jeu/langue.ts`) : `1 250 $` en français, `1,250 $` en anglais.

**Ce qui a changé le 25/10.** Avant, chaque panneau avait ses propres boutons, couleurs et façons de s'ouvrir. Tout a été **homogénéisé** : une seule fenêtre (`Fenetre.tsx`) partout, avec le même ✖, Échap et clic à côté ; **une couleur par sorte d'action** (§ 14) ; la même ligne d'amélioration (`Amelioration.tsx`) dans tous les bâtiments ; les mêmes onglets, jauges, étiquettes et pastilles (`src/styles/theme.css`). Le style : cartoon coloré, contours bleu nuit épais (`#2a2140`), ombres dures, fenêtres crème, aplats pastel, ni dégradés ni flous.

## Sommaire

1. [Les écrans](#1-les-écrans)
2. [L'accueil](#2-laccueil-accueiltsx)
3. [L'écran de jeu : la mise en page](#3-lécran-de-jeu--la-mise-en-page)
4. [Le bandeau du haut (HUD) et les boutons du coin](#4-le-bandeau-du-haut-hud-et-les-boutons-du-coin)
5. [Les tâches](#5-les-tâches-missionstsx)
6. [La carte du village](#6-la-carte-du-village-vuevillagetsx)
7. [Les boutons du bas](#7-les-boutons-du-bas)
8. [La fenêtre d'un bâtiment](#8-la-fenêtre-dun-bâtiment)
9. [Les composants partagés](#9-les-composants-partagés)
10. [Les autres fenêtres](#10-les-autres-fenêtres)
11. [Les notifications](#11-les-notifications)
12. [Les contrôles : clavier, souris, tactile](#12-les-contrôles--clavier-souris-tactile)
13. [Téléphone ou ordinateur](#13-téléphone-ou-ordinateur)
14. [Les couleurs des boutons](#14-les-couleurs-des-boutons)
15. [Les deux langues](#15-les-deux-langues)

---

## 1. Les écrans

`App` (`src/App.tsx`) n'a que deux écrans :

| Écran | Quand | Composant |
|---|---|---|
| **Accueil** | au lancement, et après « 🌍 Changer de monde » dans les réglages | `Accueil` |
| **Jeu** | après avoir choisi (ou créé) un monde | `Jeu` (dans `App.tsx`) |

- Le compte (`useCompte`) reste ouvert pendant la partie. En quittant le jeu, la partie part tout de suite en ligne (`envoyerMaintenant`).
- Changer de monde recrée le jeu (`key={monde.id}`) : rien de l'ancien monde ne reste.
- Changer de langue redessine tout (`onLangue`).
- La fenêtre « Quels mondes garder ? » (§ 10) peut s'ouvrir par-dessus les deux écrans.

---

## 2. L'accueil (`Accueil.tsx`)

### 2.1 La mise en page

- **Au fond** : le petit village vivant (`SceneAccueil.tsx`), la même vue du ciel que dans le jeu, avec des taupes et un wagonnet. Ce n'est qu'une image qui bouge ; elle se cale au milieu de la place laissée par les panneaux (420 px à gauche, 400 px à droite).
- **En haut, un bandeau crème** : ⛏️ le logo « Mega Digger », la phrase « Creuse jusqu'au cœur de diamant. Embauche. Automatise. », puis à droite le choix de la langue (§ 2.3) et le bouton blanc **👤 Mon compte** (ou le pseudo, si connecté).
- **À gauche** : le gros bouton jaune et ses mondes (§ 2.2), puis la carte « Installer » (§ 2.5).
- **À droite** : le classement (§ 2.6).
- **En bas au milieu** (si on a déjà un monde) : le jeu en 4 étapes (`etapesDuJeu.ts`, les mêmes que dans l'aide et le tutoriel) : ⛏️ Creuse, 👷 Embauche, 🛤️ Automatise, 💎 Descends. Cachées sous 1 240 px de large.
- **Tout en bas à droite** : « Version … » (pour vérifier que Vercel est à jour) et, si le navigateur ne garde rien (navigation privée), « ⚠️ Ce navigateur ne garde pas les parties : elles seront perdues en fermant la page. »

### 2.2 Le gros bouton et les mondes (jusqu'à 5)

- **▶ Jouer** (jaune, grand) : reprend le dernier monde joué, avec son nom, 🕳️ niveau et argent.
- Un **nouveau joueur** voit à la place le jeu en 4 étapes, puis **⛏️ Commencer** (« Pépite la taupe te guide pas à pas »), qui crée le premier monde et lance la partie.
- **Tes mondes** *n* / 5 : une ligne par monde (`LigneMonde`), avec un liseré de sa couleur pastel : 🌍, le nom, 🕳️ niveau, 💵 argent, 👷 employés, « il y a 5 min ». À droite, **⋯** (blanc, déplie les réglages du monde) et **▶** (jaune, jouer).
  - Les réglages : **✏️ Renommer** (blanc : un champ et **OK**), **📄 Dupliquer** (vert, grisé avec 5 mondes), **🗑️ Supprimer** (rose, avec une confirmation : « Le monde « … » sera perdu pour toujours. »).
  - Une partie trop ancienne : « Ancienne version : repart de zéro » ; illisible : « Partie illisible : repart de zéro ».
- **✨ Nouveau monde** (vert) : un champ pour son nom (« Monde 3 » par défaut) et **Créer** ; on joue tout de suite. Avec 5 mondes : « 5 mondes au maximum : supprime-en un pour en créer un nouveau. »
- Pendant un échange avec le compte (au plus 8 s si le serveur ne répond pas), les boutons Jouer sont grisés.

### 2.3 La langue

Deux pilules dans le bandeau : **Français** et **English** (des onglets, `.onglets`). Voir § 15.

### 2.4 Le compte (`CarteCompte.tsx`, hors CrazyGames)

Dans une fenêtre bleue « 👤 Ton compte », ouverte par le bouton du bandeau ou **Entrer** dans le classement.

| État | Affichage |
|---|---|
| Chargement | « ☁️ Recherche de ton compte… » |
| Pas connecté | « Facultatif : pour retrouver tes mondes sur un autre appareil, et entrer au classement. », les champs **Pseudo** et **Mot de passe**, **Se connecter** (jaune, aussi avec Entrée) et **Créer un compte** (vert). L'erreur en rouge, et « ⚠️ Il n'y a pas d'email : un mot de passe oublié ne peut pas être récupéré. » |
| Connecté | 👤 le pseudo, l'état de la sauvegarde, et **Se déconnecter** (blanc) |

L'état de la sauvegarde : « Synchronisation de tes mondes… », « Mondes sauvegardés en ligne (dernier envoi : 14:05). », « Tes mondes sont sauvegardés en ligne. », ou en rouge « ⚠️ Serveur injoignable : tes mondes restent dans ce navigateur, on réessaie tout seul. »

### 2.5 La carte « Installer » (`CarteInstallation.tsx`)

L'icône du jeu et « 📲 Installe Mega Digger » :
- Android, Chrome, Edge : « Une icône sur ton écran d'accueil, même sans réseau. » + **Installer** (vert) ;
- iPhone, iPad : « Dans Safari : Partager (le carré avec une flèche ↑), puis « Sur l'écran d'accueil ». » ;
- **Plus tard** (blanc) la cache pour toujours (réglage `idle-miner-installation-masquee`).

Absente si le jeu est déjà installé, si le navigateur ne sait pas installer, et dans la version CrazyGames.

### 2.6 Le classement (`CarteClassement.tsx`)

Visible par tout le monde (hors CrazyGames). Classé à l'**argent gagné en tout** (le meilleur monde de chaque joueur).

- En haut : « 🏆 Classement », l'étiquette verte « 💵 Argent gagné », et 🔄 (blanc, rond) pour le relire. Il se relit aussi tout seul toutes les 5 minutes.
- **Le top 10** : une ligne par joueur, 🥇 🥈 🥉 pour les trois premiers, puis #4… ; le pseudo, 🕳️ le niveau de sa mine (affiché, mais il ne compte pas) et l'argent. Ta ligne est mise en avant.
- **En bas, ta place** : « #7 » et « Toi · 12 k $ », puis « 🔥 Encore 3 k $ pour dépasser Jade », ou « 👑 Tu es le numéro 1 ! ». Sans compte : « Avec 12 k $, tu serais 7e ! » (ou « Joue pour entrer dans le classement ! ») et le bouton vert **Entrer**.
- Messages : « Chargement du classement… », « ☁️ Classement hors ligne » (pas de réponse en 6 s), « Personne n'est encore classé : à toi d'être le premier ! ».

### 2.7 Sur téléphone (moins de 760 px)

Tout s'empile et on fait défiler : le village en haut, le bandeau, puis les cartes l'une sous l'autre (`src/styles/accueil.css`).

---

## 3. L'écran de jeu : la mise en page

Le village prend **tout l'écran** ; l'interface est posée par-dessus et laisse passer les clics vers la carte, sauf sur ses boutons (`src/styles/jeu.css`).

```
┌──────────────────────────────────────────────────────────┐
│ [⭐3 ▬] [💵 1,2 k $ +4/s] [💎 5 +] [📦2 120/300] [👷 3 ⏳4:12] │
│ [🍀 Fortune · 2:40]                       🎁 📊 🏅 ⚙️   │
│                                       ┌─ ☑️ Tâches ▴ ─┐│
│                                       │ 🪨 … [Voir]   ││
│              (le village vu du ciel)  └───────────────┘│
│                   messages (au milieu en haut)          │
│                                                          │
│ (⛏️ Mine)      ← ↑ → ↓ pour marcher       (✏️) (🏗️ Bâtiments)│
└──────────────────────────────────────────────────────────┘
```

- **En haut à gauche** : le bandeau (§ 4). **En haut à droite** : les boutons ronds du coin, et dessous les tâches (§ 5).
- **En bas** : les gros boutons ronds (§ 7), ou la barre de construction quand on pose quelque chose.
- **Les messages** (§ 11) : en haut au milieu.
- **Les fenêtres** (§ 8 et § 10) : au milieu de l'écran (en bas sur téléphone).

---

## 4. Le bandeau du haut (HUD) et les boutons du coin

### 4.1 Le bandeau (`Hud.tsx`)

Des cases bleu nuit au gros contour. Chacune n'apparaît que quand elle sert : un nouveau joueur ne voit que le niveau, l'argent et le coffre.

| Case | Ce qu'elle montre | La toucher |
|---|---|---|
| ⭐ **Niveau** | une médaille violette avec le niveau du joueur, et sa jauge d'XP | — |
| 💵 **Argent** | l'argent (il saute à chaque vente) et ce que tout produit par seconde (« +4/s », en vert s'il est positif) | ouvre **Mon bilan** (§ 10) |
| 💎 **Gemmes** | le nombre de gemmes et un « + » ; seulement après le tutoriel (ou dès qu'on en a) | ouvre la **Boutique des gemmes** |
| 📦 **Coffre** | le niveau de la mine en badge, « 120/300 » et une jauge (jaune, rose quand il est plein : la case rougit) | — |
| 👷 **Personnel** | le nombre d'employés, puis ⏳ le prochain salaire ; 💼 et le temps avant que le manager s'endorme ; 💤 s'il dort ; 😠 « Payer ! » si quelqu'un attend son salaire (la case rougit) | — |

Dessous, une ligne d'étiquettes violettes pour les **bonus de la boutique** en cours, avec leur temps (« 🍀 … · 2:40 »).

### 4.2 Les boutons du coin (`App.tsx`)

Quatre boutons ronds, en haut à droite :

| Bouton | Couleur | Ouvre |
|---|---|---|
| 🎁 | jaune ; il respire, avec une pastille « 1 », quand le cadeau du jour attend. Caché pendant le tutoriel | **Cadeau du jour** |
| 📊 | blanc | **Statistiques** |
| 🏅 | blanc | **Succès** |
| ⚙️ | blanc | **Réglages** |

Le cadeau du jour s'ouvre aussi tout seul une fois par partie, au retour, s'il est disponible (après le tutoriel et la fenêtre du retour).

---

## 5. Les tâches (`Missions.tsx`)

Sous les boutons du coin : « ☑️ Tâches », une à trois choses à faire (les règles sont dans `src/jeu/missions.ts`). Elles n'apparaissent qu'à la fin du tutoriel.

- Chaque tâche : son icône, son texte, et sa progression en petites jauges (« 🪨 12/25 », une jauge par chose à réunir : l'argent, puis chaque minerai ; ✔ quand c'est bon).
- Le bouton : **Voir** (bleu) ouvre le bon bâtiment ou le menu Bâtiments ; **Go !** (jaune) quand on peut le faire tout de suite.
- Les **urgences** (salaires, coffre plein) passent devant, avec un fond à part.
- Une tâche accomplie se coche (✔) avec un petit son, puis laisse la place.
- Le titre replie ou déplie la liste (▴ / ▾). Sur téléphone, on ne voit que la première tâche.

---

## 6. La carte du village (`VueVillage.tsx`)

La clairière de 40 × 40 cases vue du ciel (isométrique) : le décor, la mine au milieu, et tout ce que le joueur a posé. On y voit le personnage du joueur, les mineurs, le manager et le recruteur devant le Personnel, les wagonnets sur leurs rails (avec celui qui les pousse).

**Toucher la carte** (`toucherCarte` dans `App.tsx`) :

| On touche… | Il se passe… |
|---|---|
| un bâtiment (son image, ses cases, ou juste à côté) | sa fenêtre s'ouvre **tout de suite** ; le personnage y marche quand même |
| un chemin juste à côté d'un bâtiment | la fenêtre du bâtiment s'ouvre |
| un rail qui fait partie d'un trajet | la fenêtre **Trajet** (§ 10), avec en bas ✏️ Déplacer / 🗑️ Retirer ce rail |
| un rail qui ne relie rien | la petite fenêtre **Rail** (§ 10) |
| le sol | le personnage y marche (sauf pendant qu'il pousse un wagonnet) |

**Par-dessus la carte** :
- **Les bulles de notification** au-dessus des bâtiments (§ 11) ; les toucher ouvre le bâtiment.
- **La bulle « 🛤️ Automatiser »** (orange, avec des étincelles), au milieu de rails qui relient deux bâtiments sans trajet : la toucher ouvre la fenêtre **Automatiser**.
- (25/10 : plus de jauge du coffre au-dessus de la mine : le bandeau du haut montre déjà 📦 *n* / *capacité*, et la bulle « Plein ! » prévient quand il faut vendre.)
- **Des mini-jauges** quand un bâtiment travaille : la forge (« 🔨 Pioche de … »), la foreuse (« ⚙️ Forage »), le générateur (« ⚡ Courant »), et la caisse de l'ascenseur qui se décharge.
- **Le rayon du générateur** : un cercle jaune, seulement quand sa fenêtre est ouverte ou qu'on le place.
- Un nouveau mineur arrive avec une bulle « ✨ Nouveau ! » ; un mineur pas payé a un 😠 au-dessus de la tête.
- Le bâtiment sous la souris est entouré au sol.

---

## 7. Les boutons du bas

### 7.1 Au village (`.barre-village`)

| Bouton | Où | Ce qu'il fait |
|---|---|---|
| **⛏️ Mine** (gros rond jaune, 88 px) | en bas à gauche | ouvre la fenêtre de la mine. Son anneau orange se remplit comme le coffre ; il respire quand le coffre est plein |
| **✏️ Modifier** (rond blanc, plus petit) | en bas à droite | passe en mode Modifier (§ 7.2) |
| **🏗️ Bâtiments** (gros rond vert) | en bas à droite | ouvre le menu **Construire** (§ 10). Une pastille dit combien de bâtiments sont nouveaux ou constructibles ; il respire alors |

Au milieu, tant qu'on ne s'en est pas servi : « ← ↑ → ↓ pour marcher » (caché sur écran tactile).

### 7.2 Pendant qu'on pose ou déplace quelque chose (`.barre-edition`)

Une barre crème remplace les gros boutons, avec une consigne et des boutons :

| Mode | Consigne | Boutons |
|---|---|---|
| **Placer un bâtiment** (ou déplacer un bâtiment, un rail, un chemin) | « 👆 Touche la carte pour placer, puis valide. Glisse pour déplacer la carte. » (jusqu'au premier toucher) | **✖ Annuler** (blanc), **↔ Retourner** (blanc, bâtiments seulement), **🗑️ Enlever** (rose, un rail ou chemin déjà posé), **✔ Construire ici** / **✔ Poser ici** (vert, grisé si la place est prise) |
| **Poser des rails** | « Touche le sol là où commence ta voie… », puis « Le rail doré montre où il sera posé… », puis « Choisis où va le prochain rail avec les flèches, puis pose-le. » (3 🔩 fer le rail ; en rouge, pourquoi on ne peut pas) | **↰ Gauche**, **⬆ Tout droit**, **↱ Droite** (le sens choisi est jaune), **↩ Retirer le dernier** (rose), **✔ Poser ce rail** (vert), **Terminé** (jaune) |
| **Poser des chemins** | « 🪨 Touche le sol pour poser un chemin (… $ la case). » | **Terminé** (jaune) |
| **Modifier** | « ✏️ Touche un bâtiment, un rail ou un chemin pour le déplacer. » | **Terminé** (jaune) |

Quand un rail posé relie deux bâtiments, la pose s'arrête et la fenêtre **Automatiser** s'ouvre tout de suite.

---

## 8. La fenêtre d'un bâtiment

Une `Fenetre` (§ 9) avec un **voile presque transparent** (on voit le village derrière), l'emoji et le nom du bâtiment dans un bandeau de couleur, puis sa description en petit. La mine et le Personnel ont une grande fenêtre, les autres une moyenne.

| Bâtiment | Bandeau | Onglets | Contenu |
|---|---|---|---|
| **Mine** (`PanneauMine.tsx`) | jaune | ⛏️ Creuser · ⬆️ Améliorer · 🚃 Wagonnets · 📊 Production | voir § 8.1 |
| **Marché** (`PanneauMarche`) | vert | — | « 💰 Vendu par les wagonnets » ; sans rails, « 🛤️ Relie la mine au marché avec des rails » et **🛤️ Poser des rails** (vert, ou 🔒 ⭐ 2) ; avec des rails, les trajets qui y arrivent |
| **Forgeron** (`PanneauPioches`) | rose | — | **Ta pioche** (jauge de durabilité, Fortune, **🔧 Réparer** ou « ✔ Neuve ») ; **Nouvelle pioche** (Acheter) ; **Tes autres pioches** (**Prendre**, bleu) |
| **Personnel** (`PanneauEmployes.tsx`) | bleu | 👷 Équipe · ➕ Embaucher · 💼 Chefs | voir § 8.2 |
| **Foreuse** (`PanneauForeuse`) | orange | 🔥 Charbon · 🛒 Chariot · ⬆️ Améliorer | état, jauge de charbon, **🔥 Remplir** (jaune), ses trajets ; le chariot à vendre (`StockMinerais`) ; Forage et Chariot à améliorer |
| **Générateur** (`PanneauGenerateur`) | violet | ⚡ Courant · ⬆️ Améliorer | état, jauge de redstone, **Remplir** (jaune), **⏸ Éteindre / ▶ Allumer** (blanc), « Ce qu'il accélère » (✔ / ✖ dans le rayon) ; l'amélioration (rayon, vitesse, réserve) |

Les onglets portent une **pastille** quand il y a quelque chose à faire : « ! » (coffre plein, la mine peut descendre, un goulot, plus de charbon, salaires…) ou « + » (une amélioration achetable, une embauche possible).

### 8.1 La mine

- **⛏️ Creuser** : à gauche, l'étiquette « ⛏️ Niveau 2 · … », le bonus de combo en cours, puis **le gros bloc à cliquer** (chaque clic casse un bloc ; éclats, « +1 🪨 » qui s'envolent, « 🔥 ×12 » pour le combo). Dessous, la jauge du combo (« Clique vite ! ×10 = … »), trois compteurs (🔨 cassés, 🏆 record, 👆 clics/s) et la jauge de la pioche (« Pioche cassée : répare-la au forgeron ! »). Coffre plein : le bloc est grisé, « 📦 Coffre plein : vends-le ! ». À droite, **le coffre** (`StockMinerais`, § 9) et une carte « ⬇️ Mine niveau 3 · … » (Prêt ! / Voir / 🔒) qui mène à l'onglet Améliorer.
- **⬆️ Améliorer** : une carte crème « ⬇️ Descendre au niveau *N* » avec tout ce que ça débloque (le palier, le nouveau minerai, la mine plus rapide, un mineur de plus, les bâtiments, le manager ou le recruteur), et la ligne **Mine** (bouton **Descendre**) ; puis les lignes **Coffre** et **Ascenseur** (`Ascenseur.tsx`), avec « ⚠️ Ascenseur trop petit… » s'il freine les mineurs.
- **🚃 Wagonnets** : l'alerte « Le chariot de … est trop petit » (`AlerteChariot.tsx`, bouton bleu **👷 Agrandir**) et les trajets qui partent de la mine (`PanneauTrajets`, § 9).
- **📊 Production** : le total en blocs/s et ≈ $/min, la part de la mine, des mineurs et de tes clics, puis une ligne par mineur (rareté, jauge, blocs/s ou « 😠 salaire »).
- Au-dessus des onglets, si des employés attendent leur salaire : « 😠 … ils ne travaillent plus. » et **💵 Payer** (bleu, va au Personnel).

### 8.2 Le Personnel

- **👷 Équipe** : la carte **Salaires** (« 💵 Salaires · … $ / 5 min », **💵 Payer tout le monde**, jaune ; absente si le manager paie), puis une carte par employé, rangés en ⛏️ Mineurs et 🛤️ Pousseurs : nom, rareté, ⏳ temps payé (ou « 😠 Pas payé »), ses chiffres, son trajet (une liste déroulante pour un pousseur), ses améliorations (pioche ; ou vitesse et chariot), et **💵 Payer** (jaune), **🎲 Remplacer** (vert, avec le recruteur), **Licencier** (rose, avec une confirmation qui montre les indemnités). Sans personne : **➕ Embaucher un mineur**.
- **➕ Embaucher** : la ligne **Mineur** (*n* / max) ; puis **Pousseur** : on choisit un trajet (« Libre », « Pas de rails », ou « ✔ son pousseur ») ; le trajet choisi **brille sur la carte** ; puis **Embaucher**.
- **💼 Chefs** : le **Manager** (🔒 Mine 3, puis Embaucher ; ensuite un interrupteur « Il paie les salaires / Arrêté », la jauge de fatigue avec **☕ Réveiller**, et son Endurance) et le **Recruteur** (🔒 Mine 4, puis ses niveaux et les chances de chaque rareté), chacun avec son portrait.
- Une embauche avec le recruteur lance **la révélation** (`RevelationRecrue.tsx`) : la carte tremble pendant 1,6 s (« Le recruteur cherche… »), puis se retourne sur sa rareté (étoiles, confettis) ; un clic accélère ; **Au travail ! / Super ! / Incroyable !** la ferme.

---

## 9. Les composants partagés

| Composant | Où | Ce que c'est |
|---|---|---|
| `Fenetre.tsx` | partout | la fenêtre : voile (sombre, ou `clair` pour les bâtiments), bandeau de couleur (vert, jaune, bleu, rose, violet, orange, crème) avec icône et titre, ✖ rond blanc, corps qui défile, « pied » pour les boutons du bas. Trois tailles : petite (420 px), moyenne (560 px), grande (760 px). Échap ferme celle du dessus seulement ; un clic à côté ferme. `devant` : au-dessus de tout ; `fermable={false}` : ni ✖, ni Échap, ni clic à côté |
| `Confirmation.tsx` | supprimer un monde, licencier, recommencer, passer le tutoriel | une petite fenêtre « ❓ » (jaune) ou « ⚠️ » (rose si `danger`) : **Annuler** (blanc) et **Confirmer** (jaune ou rose, grisé si impossible). Remplace la boîte grise du navigateur |
| `OngletsPanneau.tsx` | mine, Personnel, foreuse, générateur, trajets | une rangée d'onglets en pilule ; l'actif est mis en avant ; une pastille par onglet. À 4 onglets et plus sur un petit téléphone, les onglets non choisis ne montrent que leur icône |
| `Amelioration.tsx` | toutes les améliorations | la **ligne d'amélioration** : icône, nom, niveaux en petits carrés (pleins = achetés), effet « avant → **après** » ; à droite le bouton **vert** avec le prix et le bouton **violet 💎** (payer en gemmes). Ou « 🔒 Mine 3 », ou « MAX ». `Achat` : la même, sans niveaux (embaucher) |
| `PrixCout.tsx` | dans les boutons | « 1 500 $ · 3/10 🔩 » ; ce qui manque est en rouge (les minerais viennent du coffre de la mine) |
| `Barre.tsx` | coffre, durabilité, charbon, fatigue… | une jauge avec son texte par-dessus (« 120 / 300 », « Plein ! ») ; vert, rose, jaune, violet ou bleu |
| `StockMinerais.tsx` | coffre de la mine, chariot de la foreuse | le titre et sa jauge, le gros **💰 Tout vendre** (jaune, avec « +… $ »), puis une ligne par minerai : nombre, prix pièce, **📌** (garder ce minerai : bleu quand il est gardé, coffre seulement) et **+… $** (jaune, vendre ce minerai) |
| `PanneauTrajets.tsx` | mine, marché, foreuse | une ligne par trajet : « Pas de rails », « Rails posés », « En route » (avec une jauge), « Pas de pousseur », « Au quai » ; boutons **🛒 Pousser** (jaune, si personne ne le pousse) et **🛤️ Automatiser** (vert) ou **⚙️ Régler** (bleu) |
| `Interrupteur.tsx` | trajets, manager | un interrupteur gris / vert avec son texte |
| `AlerteChariot.tsx` | mine, foreuse | le chariot du pousseur est trop petit, avec **👷 Agrandir** |

Les briques CSS (`src/styles/theme.css`) : `.btn` (§ 14), `.fenetre`, `.carte` (blanche) et `.carte-creme`, `.onglets`, `.ligne-amelioration`, `.jauge` (et `.jauge-texte`), `.etiquette` (petite pilule : nuit, jaune, vert, rose, bleu, violet), `.pastille` (le petit rond rouge sur un bouton : « 2 », « ! »), `.verrou` (le cadenas), `.titre-section`, `.champ`.

---

## 10. Les autres fenêtres

| Fenêtre | Ouverte par | Contenu et boutons |
|---|---|---|
| **🏗️ Construire** (`MenuConstruction.tsx`, orange, grande) | 🏗️ Bâtiments, ou une tâche | ce qu'on a pour payer (💵, pierre, fer, redstone) ; une carte par bâtiment à construire (image, « Nouveau ! », description, **🏗️ Construire** + prix, ou 🔒 Mine *N* / ⭐ *N*) ; **Rails** et **Chemin de pavés** (**Poser** + prix par case ; rails 🔒 ⭐ 2) ; « Déjà construits » |
| **🛤️ Automatiser / Trajet** (`FenetreTrajet.tsx`, bleue) | un rail, la bulle 🛤️, Automatiser / Régler | un onglet par trajet (s'il y en a plusieurs) ; le dessin départ → wagonnet → arrivée ; l'interrupteur « Automatisation activée / arrêtée » ; « Ce qu'il vend » : une tuile par minerai (vert = emporté, gris = laissé), **Tout** / **Rien** ; ou la réserve qu'il remplit (charbon, redstone) ; le **prochain voyage** (minerais, +… $, durée, $/min) ; qui le pousse. **Annuler** (blanc) et **✔ Valider** (jaune) : rien ne change avant de valider |
| **🛤️ Rail** (`FenetreRail.tsx`, bleue, petite) | un rail qui ne relie rien | « Ce rail ne relie encore rien… » ; **✏️ Déplacer** (bleu), **🗑️ Retirer · +3 🔩** (rose) |
| **💎 Boutique des gemmes** (`Boutique.tsx`, violette) | la case 💎, ou `ouvrirBoutique` | le solde ; « 📺 Regarde une publicité » **▶ +1 💎** ; les bonus (production × 2, ventes × 2, clics en or), leur durée et le temps qui reste ; le **Trésor** ; tous les boutons violets |
| **Publicité** (`Publicite.tsx`) | une pub demandée | fausse pub plein écran : un compte à rebours de 30 s, **✖ Quitter (sans récompense)**, puis **🎁 Récupérer** (violet). Sur CrazyGames, leur vraie pub récompensée (`portail.ts`). La musique et les sons se taisent pendant la pub |
| **🎁 Cadeau du jour** (`RecompensesQuotidiennes.tsx`, jaune) | 🎁 | les 7 jours (✔ pris, 🎁, 🏆 le 7e : le gros lot) avec 💎, 💵 et bonus ; **🎁 Ouvrir le cadeau du jour *n*** (jaune), ou « ✔ Cadeau pris ! Reviens demain… » |
| **📊 Statistiques** (`Statistiques.tsx`, bleue, grande) | 📊 | 4 tuiles (argent gagné, blocs cassés, mine, temps de jeu) ; « D'où vient ton argent » (tes ventes, wagonnet, foreuse) ; tes blocs cassés à la main ; six petits chiffres |
| **🏅 Succès** (`PanneauSucces`, jaune) | 🏅 | la jauge *n* / max, puis une tuile par succès (🔒 tant qu'il n'est pas obtenu) |
| **💰 Mon bilan** (`FenetreBilan.tsx`, verte) | la case 💵 | le solde par minute avec une mascotte (🤑 Rentable !, ⭐, ⚠️, 💤), la part des gains qui part en salaires, deux colonnes (ce que tu gagnes, ce que tu paies) et un conseil |
| **⚙️ Réglages** (`Reglages.tsx`, bleue, petite) | ⚙️ | 🌍 le monde ; **🔊 Son : oui/non**, **🎵 Musique : oui/non** (blancs) ; **Français / English** (la langue choisie en jaune) ; **❔ Comment jouer** et **🌍 Changer de monde** (bleus) ; **🔄 Recommencer à zéro** (rose, avec confirmation « Tout effacer ») |
| **❔ Comment jouer** (`Aide.tsx`, bleue) | Réglages | les 4 étapes du jeu, et les gestes de la carte et du clavier |
| **☀️ Bon retour, mineur !** (`FenetreAbsence.tsx`, jaune) | le retour sur un monde | ce que l'absence a rapporté (mineurs, mine, foreuse, wagonnets), le total, les salaires en retard, la durée couverte (manager) ; **📺 Doubler · +… $** (violet, une pub) et **Continuer** (jaune) |
| **⭐ Niveau supérieur !** (`FeteNiveau.tsx`, jaune, petite) | un niveau du joueur gagné | elle attend que les autres fenêtres soient fermées ; l'étoile et le chiffre qui monte, des confettis, « 💎 Gemmes gagnées », chaque chose débloquée (« Nouveau ! »), ce qui attend au niveau suivant ; **🎉 Génial !** (ne se ferme pas pendant la première seconde) |
| **☁️ Quels mondes garder ?** (`FenetreQuelsMondes.tsx`, bleue) | la connexion, quand compte et navigateur ont des mondes différents | **📲 Garder ceux d'ici** (blanc) ou **☁️ Prendre ceux du compte** (jaune) ; impossible à fermer sans choisir |

**Le tutoriel** (`Tutoriel.tsx`) : Pépite la taupe guide le joueur jusqu'au premier mineur embauché.
- Au début, la fenêtre « Bienvenue, mineur ! » : les 4 étapes, **C'est parti !** (jaune) et **Passer le tutoriel** (blanc, avec confirmation).
- Puis, à chaque étape, une petite carte (Pépite, des points de progression, la consigne, ✖ pour passer) en haut de l'écran, ou en bas si la cible est en haut. Le reste s'assombrit ; la cible est entourée d'un anneau doré, avec une flèche qui rebondit (« Touche ici ! », « Clique vite ! », « Vends ! »…). Étapes : ouvrir la mine, casser des blocs, tout vendre, construire le Personnel (Bâtiments → Personnel → toucher la carte → Construire ici), l'ouvrir, embaucher un mineur. Chaque étape réussie fait jaillir « ✔ Bravo ! ».
- À la fin, « Bravo, ta mine tourne ! » et **À moi de jouer !** ; la liste des tâches prend le relais.

---

## 11. Les notifications

Une règle (`src/jeu/notifications.ts` et CLAUDE.md) : **un état** = une bulle sur le bâtiment ; **un conseil** = la liste des tâches ; **un événement** = un message. On ne signale pas la même chose à plusieurs endroits (les salaires, par exemple, ne sont plus qu'au-dessus du Personnel).

**Les bulles** au-dessus des bâtiments : une médaille avec l'icône de la plus urgente, deux mots, et « +*n* » s'il y en a d'autres. Leur couleur dit la sorte (`src/village.css`) :

| Sorte | Couleur | Exemples |
|---|---|---|
| alerte | rouge | 😠 « Salaires ! » et 🛤️ « Pousseur ? » / « Sans trajet » (Personnel), 🚧 « Rails coupés » (les deux bâtiments), 🛒 « Plein ! » et 🔥 « Charbon ? » (foreuse), 🔴 « Redstone ? » (générateur), 🔧 « Réparer » (forgeron), 📦 « Plein ! » (mine) |
| prêt | rose | (prévue dans le code, aucune bulle de cette sorte pour l'instant) |
| nouveau | bleue | ✨ « Nouveau » (manager, recruteur débloqués ; part quand on ouvre le bâtiment) |
| achat | verte | ⬆️ « Achetable », seulement pendant le tutoriel |

**Les messages** (`Toasts.tsx`) : en haut au milieu, **au plus 3 à la fois**, 3,5 s chacun ; jaunes pour un succès, crème sinon. Le même message n'est pas empilé deux fois (`usePartie.ts`).

**Les gains** (`Gains.tsx`) : « +… $ » en grand au milieu avec une gerbe de pièces pour tes ventes, en petit pour le reste (le wagonnet qui vend).

**Les autres signes** : une pastille sur un onglet ou un bouton, un bouton qui respire (`.btn-attention`), une case du bandeau qui rougit.

---

## 12. Les contrôles : clavier, souris, tactile

| Geste | Effet |
|---|---|
| **Flèches** | marcher (on peut les combiner) ; pas dans le menu Construire ni en poussant un wagonnet |
| **Espace** | sauter (pas quand une fenêtre est ouverte) |
| **Échap** | ferme la fenêtre du dessus ; sinon, annule la pose en cours et quitte le mode Modifier |
| **Entrée** | valide un champ (compte, nom d'un monde) |
| **Clic / toucher** | ouvrir un bâtiment, choisir un rail, marcher (§ 6) ; placer le fantôme |
| **Glisser** | déplacer la carte ; sur un fantôme déjà placé, le déplacer |
| **Molette / pincer** | zoomer (environ 15 % par cran, autour du point visé) |
| **Survol à la souris** | le fantôme suit la souris jusqu'au premier clic ; le bâtiment visé est entouré |

Pendant la partie, le zoom du navigateur (Ctrl + molette, Ctrl +/−, gestes Safari) est bloqué : seul le zoom de la carte marche (`App.tsx`). Les champs de texte ne déclenchent pas les raccourcis.

---

## 13. Téléphone ou ordinateur

Le jeu se joue au pouce (`@media (max-width: 640px)` dans `theme.css` et `jeu.css`) :

- **Les fenêtres montent du bas de l'écran** (comme une feuille), sur toute la largeur et au plus 88 % de la hauteur.
- **Le bandeau** prend la largeur ; **les boutons du coin** passent en colonne à droite (40 px).
- **Les tâches** passent en bas, au-dessus des gros boutons, en largeur, et ne montrent que la première.
- **Les gros boutons** : 76 px (56 px pour Modifier).
- **Les lignes d'amélioration** passent sur deux lignes, les boutons en pleine largeur.
- **La mine** : le bloc au-dessus du coffre.
- **Les onglets** : sous 480 px, à 4 onglets et plus, seulement l'icône des onglets non choisis.
- Le rappel des flèches est caché sur écran tactile (`hover: none`).
- Les marges tiennent compte de l'encoche et de la barre de l'iPhone (`safe-area-inset`).
- Les règles de `theme.css` : boutons d'au moins 40 px (44 px en temps normal), texte d'au moins 12 px, aucune info seulement dans un `title=`.

---

## 14. Les couleurs des boutons

Une couleur par sorte d'action (`src/styles/theme.css`, « Les boutons ») :

| Classe | Couleur | Pour… | Exemples |
|---|---|---|---|
| `.btn-vert` | vert `#8fe08f` | acheter, améliorer, construire, embaucher | Améliorer, Acheter, 🏗️ Construire, Embaucher, ✔ Construire ici, ✔ Poser ce rail, Dupliquer, ✨ Nouveau monde, Créer un compte, Entrer |
| `.btn-jaune` | jaune `#f9d65a` | l'action principale d'un écran : jouer, continuer, vendre, valider | ▶ Jouer, 💰 Tout vendre, Payer, 🛒 Pousser, 🔥 Remplir, ✔ Valider, Terminé, Continuer, Go !, Se connecter |
| `.btn-violet` / `.btn-gemmes` | violet `#b9a0f5` | les gemmes et les publicités | 💎 *n* à côté d'un prix, ▶ +1 💎, 📺 Doubler, 🎁 Récupérer |
| `.btn-bleu` | ciel `#8cc8f5` | aller quelque part, voir, régler | Voir, ⚙️ Régler, 💵 Payer (va au Personnel), 👷 Agrandir, Prendre, ✏️ Déplacer, Comment jouer, Changer de monde |
| `.btn-blanc` | blanc | neutre : annuler, fermer, retourner, options | ✖, Annuler, ↔ Retourner, ⋯, 📊 🏅 ⚙️, Son, Musique, Plus tard, Se déconnecter |
| `.btn-rose` | rose `#f39aa8` | ce qui détruit ou coûte cher à défaire | Licencier, 🗑️ Supprimer, 🗑️ Enlever / Retirer, ↩ Retirer le dernier, Recommencer à zéro |

Les tailles : `.btn-petit` (40 px), normal (44 px), `.btn-grand` (56 px, police des titres), `.btn-large` (pleine largeur), `.btn-rond` (44 × 44). Un bouton grisé (`:disabled`) devient gris. Les gros boutons ronds du village (`.gros-rond`, `jeu.css`) suivent la même idée : jaune pour la mine, vert pour construire, blanc pour Modifier.

Les bandeaux des fenêtres ont aussi leur couleur : un par bâtiment (§ 8), bleu pour les réglages, l'aide, les statistiques et les trajets, violet pour la boutique, jaune pour les fêtes et le cadeau, rose pour une confirmation dangereuse.

---

## 15. Les deux langues

- **Français et anglais** (`src/jeu/langue.ts`). Tout texte affiché passe par `t('Texte en français', { trou: valeur })` ; la traduction anglaise est dans `src/jeu/traductions/en.ts`, avec la phrase française pour clé. Une traduction qui manque laisse le texte en français : rien ne casse (`npm run traductions` liste celles qui manquent).
- **Au premier lancement**, la langue est celle du navigateur (français pour un navigateur en français, anglais pour tous les autres) ; ensuite, celle choisie la dernière fois (`src/langueNavigateur.ts`, réglage `idle-miner-langue`).
- **On la change** sur l'accueil (les pilules du bandeau) ou dans les réglages (⚙️) : tout le jeu se redessine.
- Les nombres suivent la langue (`nombre()` : « 1 250 » ou « 1,250 »).

**La version CrazyGames** (`src/portail.ts`, `VITE_PORTAIL=crazygames npm run build`) : pas de bouton 👤 ni de classement sur l'accueil, pas de carte « Installer » ; les publicités sont celles de CrazyGames ; le jeu leur dit quand une fenêtre est ouverte (pause) et quand arrive un grand moment (un bâtiment construit, un niveau gagné).
