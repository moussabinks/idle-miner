# ⚙️ Foreuse

> Une machine débloquée au prestige 1 : on pose son bâtiment, on l'active une fois, on la nourrit au charbon, et elle creuse toute seule en remplissant un grand chariot qu'on vient vider devant elle, au village.

## Où et quand

- **Où** : là où tu la poses dans la clairière (20/10) : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **1 500 $ + 50 pierre + 20 fer** (la roche dure compte aussi comme de la pierre). Poser le bâtiment ne suffit pas : il faut encore **activer** la machine dans son panneau (voir plus bas). Elle reste posée à chaque prestige ; **✏️ Modifier** la déplace ou la retourne (miroir) gratuitement.
- **Déblocage** : au **prestige 1** (`PRESTIGE_FOREUSE = 1`, et `BATIMENTS.foreuse.prestige = 1`). Avant, sa carte du menu Bâtiments a un **cadenas** « 🔒 Prestige 1 ». Au prestige 1, la carte prend la pastille **« Nouveau ! »** (jusqu'à ce qu'on ouvre le menu) et le bouton 🏗️ Bâtiments la compte dans son badge (tant qu'elle est nouvelle ou qu'on peut la payer).
- **La porte** : sur la face avant **gauche** du dessin (à droite si elle est retournée).
- **L'ouvrir** : toucher (ou cliquer) la foreuse : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1,3 case du bâtiment, de n'importe quel côté (21/10).
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/foreuse.webp`) : une grande foreuse jaune et noire en spirale sur un bâti en bois, avec des wagonnets d'or. Quand elle tourne (`foreuseEnMarche`), le bâtiment **vibre** un peu (classe `sprite-vibre`).
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **🛒 « Le chariot est plein : viens le vider ! »** (alerte rouge) quand elle est active et que le chariot est plein ;
  - sinon **🔥 « Plus de charbon ! »** (alerte rouge) quand elle est active sans charbon ;
  - **✨ « Nouveau : Foreuse ! »** tant qu'on n'est pas allé devant après le déblocage (`decouvertes.ts`) ;
  - **⬆️ « Nouveaux niveaux débloqués ! »** après un prestige qui a débloqué un niveau de forage ou de chariot, jusqu'à ce qu'on passe devant (`objectifs.ts`) ;
  - **💰 « Une amélioration est achetable ! »** quand l'activation ou une amélioration est payable tout de suite.
- **Dans la mine** (vue en coupe) : la foreuse creuse son propre puits sur la droite de la mine (une tête jaune et noire avec une lumière, une mèche, des débris quand elle tourne, et une étiquette « -X m », ou « ↓ -X m » si elle est plus bas que ce qu'on voit).

## Ce qu'on peut y faire

Toutes les actions demandent d'être au village, devant la foreuse (son panneau ouvert).

### 1. Activer la foreuse (une seule fois)

| Coût | Effet |
|---|---|
| **5 000 $ + 10 fer + 5 redstone** | La foreuse devient active **pour toujours** (même après les prestiges suivants). |

### 2. La remplir de charbon

- Boutons **+1**, **+10** et **Tout** : on met du charbon **de son sac** dans la foreuse.
- **1 charbon = 20 secondes de forage** (`SECONDES_PAR_CHARBON`).
- Une jauge montre les secondes de charbon restantes (elle est pleine à 200 s, ou plus si on en a mis plus).
- Un badge donne l'état : **En marche**, **Chariot plein** ou **Plus de charbon**. On voit aussi sa profondeur, sa vitesse et le nombre de blocs forés.

### 3. La recharge automatique (case à cocher)

- Disponible à partir du **niveau 3 de forage** (`NIVEAU_RECHARGE_AUTO = 2`, compté à partir de 0), ou **dès le niveau 1** avec le talent « Moteur autonome ». Avant, le panneau affiche « 🔒 Recharge automatique au charbon : débloquée au niveau 3 de forage ».
- Cochée, la foreuse **brûle le charbon qu'elle remonte** tant que sa réserve est sous **60 secondes** (`RESERVE_RECHARGE_AUTO`) ; au-delà, le charbon va dans le chariot comme les autres blocs.

### 4. Vider le chariot

- La liste du chariot est triée du bloc le plus cher au moins cher, avec la quantité et la valeur de chaque bloc.
- On **coche / décoche** chaque objet, ou tout d'un coup (« ☑️ Tout sélectionner » / « ☐ Tout désélectionner »). Les objets décochés restent dans le chariot.
- **💰 Vendre la sélection** : vend les objets cochés, au prix du marché (avec le bonus de prestige de +15 % par prestige et les talents de vente), **+20 % avec le talent « Grossiste »**.
- **🎒 Mettre dans le sac** : met les objets cochés dans son sac, tant qu'il reste de la place (pratique pour récupérer du fer, de la redstone, des diamants…).

### 5. Améliorer la vitesse de forage (8 niveaux)

| Niveau | Vitesse (blocs/s) | Coût | Prestige requis |
|---|---|---|---|
| 1 | 2 | (de base) | 1 |
| 2 | 3 | 2 500 $ + 20 fer + 5 redstone | 2 |
| 3 | 5 | 6 000 $ + 40 fer + 20 redstone | 3 |
| 4 | 8 | 12 000 $ + 60 fer + 40 redstone | 4 |
| 5 | 12 | 25 000 $ + 90 fer + 70 redstone | 5 |
| 6 | 16 | 40 000 $ + 130 fer + 100 redstone | 6 |
| 7 | 22 | 65 000 $ + 180 fer + 140 redstone | 7 |
| 8 | 30 | 100 000 $ + 250 fer + 200 redstone | 8 |

Avec le talent **« Foreuse turbo »**, la vitesse est multipliée par **1,5**.

### 6. Agrandir le chariot (8 niveaux)

| Niveau | Capacité (objets) | Coût | Prestige requis | Plein en (forage du même niveau) |
|---|---|---|---|---|
| 1 | 1 000 | (de base) | 1 | ~8 min (500 s) |
| 2 | 1 500 | 1 500 $ + 10 fer | 2 | ~8 min |
| 3 | 2 500 | 4 000 $ + 25 fer + 10 redstone | 3 | ~8 min |
| 4 | 4 000 | 9 000 $ + 45 fer + 25 redstone | 4 | ~8 min |
| 5 | 6 000 | 18 000 $ + 70 fer + 45 redstone | 5 | ~8 min |
| 6 | 8 000 | 28 000 $ + 100 fer + 70 redstone | 6 | ~8 min |
| 7 | 10 500 | 45 000 $ + 140 fer + 100 redstone | 7 | ~8 min (477 s) |
| 8 | 15 000 | 70 000 $ + 200 fer + 150 redstone | 8 | ~8 min |

Avec le talent **« Grand chariot »**, la capacité est **doublée**. Le panneau affiche le temps pour remplir le chariot ; s'il se remplit en moins de 6 minutes, il conseille : « ⚠️ Ta foreuse remplit le chariot vite : agrandis-le… ».

Pour tout monter au niveau 8 : forage = 250 500 $ + 770 fer + 575 redstone ; chariot = 175 500 $ + 590 fer + 400 redstone.

## Règles et comportement

- **Quand elle tourne** : seulement si elle est **active**, qu'il lui reste **du charbon**, et que **le chariot n'est pas plein** (`foreuseEnMarche`). Elle ne brûle pas de charbon pour rien : quand le chariot est plein, elle s'arrête (message « 🛒 Le chariot de la foreuse est plein : viens le vider au village. », et la bulle 🛒 saute au-dessus du bâtiment) ; quand le charbon est fini : « 🔥 La foreuse n'a plus de charbon. » (bulle 🔥).
- **Ce qu'elle remonte** : un bloc tiré au hasard selon sa profondeur (comme dans la mine du prestige en cours), mais **jamais de lave, de coffre ni de géode**. L'enchantement Fortune ne s'applique pas à elle.
- **Elle descend** d'**1 mètre tous les 10 blocs forés** (`BLOCS_FORES_PAR_METRE`), en partant de -1 m, jusqu'à **1 m au-dessus de la bedrock** du prestige (par exemple -149 m au prestige 1, -199 m au prestige 2). Plus elle est profonde, plus elle trouve de minerais rares.
- **Les plafonds par prestige** (`PLAFONDS.forage` et `PLAFONDS.chariot` dans `donnees.ts`) : débloqués au prestige 1 au niveau de base, puis **un niveau de plus par prestige**, jusqu'au 8e.

  | Prestige | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 et + |
  |---|---|---|---|---|---|---|---|---|
  | Niveau max de forage et de chariot | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |

  Un niveau au-dessus du plafond s'affiche avec un cadenas « 🔒 Prestige X ». Les améliorations demandent aussi que la foreuse soit activée.
- **Il n'y a qu'une seule foreuse** (décidé le 20/10). Les anciennes sauvegardes à plusieurs foreuses gardent la meilleure et sont remboursées des autres.
- **Hors ligne** : quand on rouvre un monde, le jeu rattrape le temps passé, **au plus 8 heures** (`ABSENCE_MAX` dans `usePartie.ts`). La foreuse continue donc de forer (tant qu'elle a du charbon et de la place), et la recharge automatique continue aussi. Un message dit « Pendant ton absence : ⚙️ la foreuse a remonté N blocs ».
- **Au prestige** (`foreuseApresPrestige` dans `mineur.ts`) :
  - **gardé** : l'activation, le niveau de forage, le niveau du chariot, la case « recharge automatique », les objets décochés ;
  - **remis à zéro** : le charbon chargé, **le contenu du chariot (perdu s'il n'a pas été vidé !)**, la profondeur (elle repart de -1 m), le compteur de blocs forés.

## Lien avec le reste du jeu

- **Conditions de prestige** (`conditionsPrestige.ts`), dès que la foreuse est débloquée :
  - « ⚙️ Foreuse activée » ;
  - « ⚙️ Forage au niveau N » et « 🛒 Chariot au niveau N », où N est le plafond du prestige en cours (pas demandé au prestige 1, où l'activer suffit).
- **Objectifs** (`objectifs.ts`) : d'abord « Construire : Foreuse » (menu Bâtiments) ; une fois posée, « Activer la foreuse », « Forage X blocs/s » et « Chariot de X places » apparaissent dans les achats possibles (bulle 💰, prochain objectif « …à la foreuse ! ») ; bulle ⬆️ après un prestige qui ouvre un niveau.
- **Talents** (`talents.ts`) : branche Ingénieur — « Foreuse turbo » (+50 % de vitesse), « Grand chariot » (×2 places), « Moteur autonome » (recharge automatique dès le niveau 1) ; branche Marchand — « Grossiste » (chariot vendu 20 % plus cher).
- **Autres bâtiments** : la foreuse se paie surtout en **fer et redstone**, comme l'ascenseur (Mine) ; le **charbon** vient de la mine (ou du chariot lui-même, mis dans le sac) ; on peut revendre ce qu'elle remonte directement depuis son panneau, sans passer par le Marché.
- **Revenus et statistiques** : l'indicateur « $/s » compte la foreuse quand elle tourne (vitesse × valeur moyenne d'un bloc à sa profondeur, `revenu.ts`) ; les statistiques comptent `argentForeuse` (chariots vendus) et `blocsForeuse`.

## Fichiers du code

- `src/jeu/foreuse.ts` : toutes les règles (activation, charbon, forage seconde après seconde, chariot, améliorations, recharge automatique).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.foreuse` : 1 500 $ + 50 pierre + 20 fer, 5 × 5, porte à gauche, prestige 1) et les chiffres (`COUT_ACTIVATION_FOREUSE`, `SECONDES_PAR_CHARBON`, `NIVEAUX_FORAGE`, `NIVEAUX_CHARIOT`, `PLAFONDS`…).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment (`batimentDebloque`, `construireBatiment`, `deplacerBatiment`).
- `src/jeu/mineur.ts` : le type `Foreuse`, `nouvelleForeuse()` et ce qui est gardé au prestige (`foreuseApresPrestige`).
- `src/jeu/temps.ts` : fait avancer la foreuse avec le reste du jeu (`avancerTemps`).
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) et le message « Pendant ton absence ».
- `src/jeu/conditionsPrestige.ts` : les conditions « Foreuse activée », « Forage » et « Chariot » du prestige.
- `src/jeu/notifications.ts` : les bulles 🛒, 🔥, ✨, ⬆️ et 💰 au-dessus de la foreuse.
- `src/jeu/objectifs.ts` : « Construire : Foreuse », achats, badge « Nouveaux niveaux », prochain objectif.
- `src/jeu/decouvertes.ts` : la bulle « Nouveau : Foreuse ! » au déblocage.
- `src/jeu/talents.ts` : les talents qui améliorent la foreuse.
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'elle rapporte ($/s et statistiques).
- `src/composants/Panneaux.tsx` : le panneau du bâtiment (`PanneauForeuse`).
- `src/composants/MenuConstruction.tsx` : la carte de la foreuse dans le menu Bâtiments (cadenas, « Nouveau ! »).
- `src/composants/VueVillage.tsx`, `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : l'image du bâtiment calée sur la grille, la vibration et les bulles.
- `public/images/batiments/foreuse.webp` : le dessin de la foreuse.
- `src/composants/VueMonde.tsx` : le puits de la foreuse dans la mine (`PuitsForeuse`).
- `src/index.css` : le dessin et les animations de la tête de forage dans la mine, la couleur du bouton charbon ; `src/village.css` : la vibration du bâtiment (`.sprite-vibre`).
