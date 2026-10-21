# 👷 Personnel

> Le bureau d'embauche, débloqué au prestige 2 : on y embauche des mineurs qui creusent, remontent et vont vendre au marché tout seuls pour toi, on leur paie un salaire toutes les 10 minutes, et plus tard on y trouve le recruteur (prestige 4) et le manager (prestige 5), qui restent à leur poste devant le bâtiment.

## Où et quand

- **Où** : là où tu le poses dans la clairière (20/10) : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **3 000 $ + 80 pierre + 30 fer** (la roche dure compte aussi comme de la pierre). Son identifiant dans le code reste `employes` (pour les sauvegardes), son nom affiché est **Personnel**. Il reste posé à chaque prestige ; **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : au **prestige 2** (`PRESTIGE_EMPLOYES = 2`). Avant, sa carte du menu Bâtiments a un **cadenas** « 🔒 Prestige 2 » ; au prestige 2 elle prend la pastille **« Nouveau ! »**. Ensuite : le **recruteur** au **prestige 4**, le **manager** au **prestige 5**, dans son panneau.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). Le manager et le recruteur se tiennent de chaque côté de la porte, et les mineurs qui attendent leur salaire font la queue un peu plus loin devant.
- **L'ouvrir** : toucher (ou cliquer) le Personnel : le hamster marche jusqu'à sa porte, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre quand on arrive devant (à moins de 1,4 case de la porte).
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/employes.webp`) : un bureau en bois et en pierre sous un auvent bleu, avec l'enseigne « HIRING », des portraits de mineurs et des bannières.
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **😠** (alerte rouge) quand quelqu'un n'est pas payé : « 1 mineur attend son salaire ! », « N mineurs attendent leur salaire ! » ou, avec le manager, « 💼 Trésorerie vide : personne n'est payé ! » (`alerteSalaires`) ;
  - **✨ « Nouveau : Personnel ! »**, puis « Nouveau : Recruteur ! » au prestige 4 et « Nouveau : Manager ! » au prestige 5, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - **⬆️ « Nouveaux niveaux débloqués ! »** après un prestige qui ouvre une meilleure pioche pour les mineurs (si on en a) ou un niveau de recruteur (s'il est embauché) ;
  - **💰 « Une amélioration est achetable ! »** quand une embauche ou une amélioration est payable tout de suite.
- **Les personnages au village** (20/10) : les mineurs sont des **hamsters casqués**, et **la couleur du casque est celle de leur rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique : les mêmes couleurs que leurs cartes), avec leur pioche à la main (couleur de leur pioche) et leur prénom au-dessus de la tête. Le **manager** (hamster en costume, porte-documents) et le **recruteur** (hamster à casquette verte et lunettes) **restent devant le bâtiment**, avec leur étiquette « Manager » / « Recruteur ». Dans le panneau, leurs cartes ont leur **portrait**.
- **Dans la mine** (vue en coupe) : les mineurs ont leur galerie de 2 cases à droite du puits de la foreuse (à gauche leur ascenseur, une cabine chacun ; à droite le trou où ils creusent), avec le casque de la couleur de leur rareté. Chacun a une étiquette (couleur de sa rareté) avec l'icône de ce qu'il fait (⛏️ creuse, ⏫ remonte, 🚶 marche au village, 💰 vend, 🔨 à la forge, ⏬ redescend, 😠 pas payé), son prénom et sa profondeur ou le temps restant.

## Ce qu'on peut y faire

Toutes les actions demandent d'être au village, devant le Personnel (son panneau ouvert).

### 1. Embaucher un mineur (« 👷 Embaucher », ou « 🎲 Recruter » avec le recruteur)

- **Taille de l'équipe** : **2 mineurs au prestige 2, puis 1 de plus par prestige, jusqu'à 6** (`MAX_EMPLOYES`) ; **+1** avec le talent « Grande équipe ». Le badge affiche « N / max ».
- **Le prix dépend seulement du nombre de mineurs qu'on a en ce moment** (ni du prestige, ni de ceux qu'on a licenciés). Il est arrondi à la centaine.

| Embauche | 1re | 2e | 3e | 4e | 5e | 6e | 7e |
|---|---|---|---|---|---|---|---|
| Prix | 5 000 $ | 12 000 $ | 25 000 $ | 50 000 $ | 90 000 $ | 150 000 $ | 250 000 $ |
| Avec « Recrutement à prix cassé » (−30 %) | 3 500 $ | 8 400 $ | 17 500 $ | 35 000 $ | 63 000 $ | 105 000 $ | 175 000 $ |

  (Au-delà de la liste, chaque embauche coûterait 60 % de plus que la précédente, `HAUSSE_APRES_LISTE = 1.6`.)
- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois**, **ses 10 premières minutes de salaire comprises**, et descend tout de suite creuser (à partir de -2 m), depuis la mine.
- Avec le recruteur, sa **rareté est tirée au hasard** (on ne refuse personne) et une animation la dévoile (voir plus bas).

### 2. Améliorer la pioche d'un mineur (sur sa carte)

Chaque amélioration donne une meilleure pioche **et** un plus grand sac. Payé **en argent seulement**.

| Niveau | Pioche | Vitesse (blocs/s) | Profondeur max (mine de référence 150 m) | Sac | Coût | Prestige requis |
|---|---|---|---|---|---|---|
| 1 | Bois | 0,8 | 35 m | 32 | (de base) | 2 |
| 2 | Pierre | 1,2 | 70 m | 48 | 3 500 $ | 2 |
| 3 | Fer | 1,8 | 112 m | 64 | 8 000 $ | 3 |
| 4 | Diamant | 2,5 | 136 m | 96 | 17 000 $ | 3 |
| 5 | Netherite | 3,2 | 149 m | 128 | 33 000 $ | 4 |

- La profondeur max est mise à l'échelle de la mine du prestige (× bedrock / 150), sans jamais toucher la bedrock. Exemple au prestige 2 (bedrock à -200 m) : bois -47 m, pierre -93 m, fer -149 m, diamant -181 m, netherite -199 m.
- Vitesse et sac sont multipliés par le **rendement de la rareté** (×1 à ×5) ; la vitesse +25 % avec « Contremaître », le sac ×2 avec « Sacs d'équipe ».
- Sa carte montre aussi ce qu'il rapporterait en 10 minutes au fond de sa galerie, son salaire, une jauge « ⏳ temps payé » et une jauge « 🎒 sac » ; l'infobulle donne son activité, sa vitesse et ce qu'il t'a rapporté.
- **Il va chercher sa pioche à la forge** (20/10) : si un forgeron est posé, l'amélioration est payée tout de suite et compte tout de suite, mais le mineur passe à la forge à son prochain passage au village (« ⛏️ X va chercher sa pioche en … à la forge. ») : il y marche, y reste **3 secondes** (`SECONDES_FORGE_EMPLOYE`), puis retourne à la mine. Sans forgeron, il l'a directement.

### 3. Payer les salaires (« 💵 Payer 10 min », sans manager)

- Chaque mineur doit être payé **toutes les 10 minutes** (`SECONDES_PAR_PAIE = 600`).
- **Salaire de 10 minutes** = salaire de base de sa pioche × multiplicateur de sa rareté × **(1 + 0,15 × prestige)** × 0,75 avec « Salaires négociés ».

| Pioche | Bois | Pierre | Fer | Diamant | Netherite |
|---|---|---|---|---|---|
| Salaire de base (prestige 0) | 200 $ | 600 $ | 1 300 $ | 2 300 $ | 3 000 $ |
| Au prestige 2 (×1,3) | 260 $ | 780 $ | 1 690 $ | 2 990 $ | 3 900 $ |
| Au prestige 4 (×1,6) | 320 $ | 960 $ | 2 080 $ | 3 680 $ | 4 800 $ |

- Sans manager, **on ne paie que 10 minutes à la fois** : le bouton complète chaque mineur jusqu'à 10 minutes payées, et ne fait payer que le temps manquant (au prorata, arrondi au dollar supérieur). La carte « 💵 Salaires » indique le total pour 10 minutes et le temps qu'il reste au moins payé.
- Cette carte disparaît quand on a embauché le manager.

### 4. Licencier un mineur (lien « Licencier » sur sa carte)

- Une fenêtre de confirmation (`Confirmation.tsx`) demande « Licencier X ? », rappelle sa rareté et le prix des **indemnités**. Le bouton est grisé si on n'a pas assez d'argent.
- **Indemnités = 40 % du prix de base de la dernière embauche de l'équipe** (`PART_INDEMNITES = 0.4`), arrondi à la centaine (100 $ au moins), **÷ 2 avec « Indemnités réduites »**. La réduction « prix cassé » ne s'y applique pas.

| Mineurs dans l'équipe | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Indemnités | 2 000 $ | 4 800 $ | 10 000 $ | 20 000 $ | 36 000 $ | 60 000 $ | 100 000 $ |

- Le mineur part **avec son équipement** (sa pioche est perdue, ainsi que ce qu'il a dans son sac). Réembaucher coûte ensuite le prix normal de la taille d'équipe : c'est le moyen de « retenter sa chance » avec le recruteur.

### 5. Le recruteur (prestige 4)

- Avant le prestige 4 : carte verrouillée « 🔒 Recruteur débloquable au prestige 4 », qui montre déjà les chances qu'il donnera.
- On l'embauche (niveau 1) puis on l'améliore, **en argent seulement**. Les chances de la prochaine embauche s'affichent en pastilles de couleur :

| Niveau | Coût | Commun | Rare | Épique | Légendaire | Mythique | Prestige requis |
|---|---|---|---|---|---|---|---|
| 1 (embauche) | 40 000 $ | 65 % | 20 % | 10 % | 4 % | 1 % | 4 |
| 2 | 80 000 $ | 60 % | 22 % | 11 % | 5,5 % | 1,5 % | 5 |
| 3 | 150 000 $ | 55 % | 23,5 % | 12,5 % | 7 % | 2 % | 6 |
| 4 | 250 000 $ | 50 % | 25 % | 14 % | 8,5 % | 2,5 % | 7 |

- Talents : « Œil du recruteur » multiplie par 1,25 les chances de rare, épique, légendaire et mythique ; « Main de Midas » double en plus celles de mythique. Le commun prend ce qui reste.
- **Les raretés** :

| Rareté | Rendement (vitesse et taille du sac) | Salaire | Couleur |
|---|---|---|---|
| Commun | ×1 | ×1 | gris `#b9b4ab` |
| Rare | ×1,5 | ×1,25 | bleu `#4f9df0` |
| Épique | ×2 | ×1,5 | violet `#b06cf0` |
| Légendaire | ×3 | ×2 | orange `#f5a524` |
| Mythique | ×5 | ×3 | rose `#ff4d8d` |

- **L'animation d'embauche** (`RevelationRecrue.tsx`, seulement avec le recruteur) : la carte tremble pendant que les couleurs défilent (**1,6 s** de suspense, un clic dévoile tout de suite), puis elle se retourne avec des rayons, des étoiles (★ selon le rang), des confettis (24 + 18 par rang de rareté) et un flash pour légendaire et mythique. Bouton « Au travail ! », « Super ! » (rare, épique) ou « Incroyable ! » (légendaire, mythique). Des sons accompagnent le suspense et la révélation.

### 6. Le manager et la trésorerie (prestige 5)

- Avant le prestige 5 : carte verrouillée « 🔒 Manager · prestige 5 ».
- **Embauche : 50 000 $** (`PRIX_MANAGER`), ses 10 premières minutes comprises.
- **Son salaire : 3 000 $ toutes les 10 minutes** (`SALAIRE_MANAGER`, fixe, ne monte pas avec le prestige), payé par la trésorerie.
- **La trésorerie** est une cagnotte qu'on remplit. Boutons : « +manque » (juste ce qu'il faut pour une paie de toute l'équipe), **« Remplir pour 1 h »** (jusqu'à 6 paies de toute l'équipe), **+1 000 $**, **+10 000 $**, **+100 000 $**, **« Tout mettre »** et **« Tout reprendre »**.
- Une jauge montre la trésorerie face au prix d'une paie de toute l'équipe (manager compris), et le panneau dit combien de temps elle tient. Badge « Au travail » ou « 😠 Pas payé ».

## Règles et comportement

- **Le travail d'un mineur**, en boucle (20/10, `travailler` dans `employes.ts`) : il **descend** dans sa galerie, **creuse** jusqu'à ce que son sac soit plein, **remonte** en haut de la mine, puis :
  - **sans rails** : il **marche jusqu'au marché** (de la porte de la mine à celle du marché, par le chemin à pied, à **4 cases par seconde**, `VITESSE_MARCHE`), y **vend** sa récolte (**4 secondes**, `SECONDES_VENTE_EMPLOYE`), puis **retourne à pied à la mine** et redescend ;
  - **avec une ligne de rails continue de la mine au marché** : il **charge le wagonnet** (sa récolte roule seule vers le marché à 12 cases par seconde et y est vendue en arrivant) et **redescend tout de suite** : plus de marche ni de vente.
  - **Tout l'argent de la vente est pour toi** (au prix du marché, bonus de prestige et talents de vente compris). Il ne creuse pas pendant les trajets et la vente. Sur la carte du village, on le voit marcher (avec un sac sur le dos quand il va au marché), et attendre devant le marché ou la forge.
- **Où poser le marché** : plus il est près de la mine, plus les allers-retours sont courts (le « $/s » d'un mineur compte deux marches mine ↔ marché + 4 s de vente, ou rien avec les rails, `revenu.ts`). Si le marché n'est pas posé, la marche dure 0 s.
- **Sa galerie, « un univers parallèle »** : tous les mineurs creusent la **même mine** que toi (même prestige, mêmes minerais), mais chacun dans **sa propre galerie, avec sa propre profondeur** (dans la vue en coupe, à droite du puits de la foreuse), sans toucher à la tienne. Il descend d'**1 mètre tous les 5 blocs** cassés (`BLOCS_PAR_METRE_EMPLOYE`, galerie étroite), jusqu'à la profondeur max de sa pioche. Il garde sa profondeur d'un aller-retour à l'autre. Il tire des blocs comme la foreuse (pas de lave, de coffre ni de géode).
- **Ses trajets dans la mine** : chacun a **sa cabine d'ascenseur** dans le puits de la mine commune (une petite poulie par mineur sur le dessin de la mine au village), aussi rapide que **ton ascenseur** (ou comme un ascenseur de niveau 1, 0,1 s/m, si tu n'as pas encore construit le tien ; +30 % avec « Ascenseur express »). Un trajet complet dure **au moins 5 secondes** (`DUREE_MIN_TRAJET_EMPLOYE`). (Quand il y aura trop de cabines, une deuxième mine est une idée pour plus tard.)
- **Le temps payé s'écoule pendant tout son travail** (trajets, marche et vente compris). Quand il n'est plus payé : s'il creusait ou descendait, il fait demi-tour et remonte ; en haut, il porte d'abord sa récolte au marché (ou au wagonnet), puis **marche jusqu'au Personnel et attend devant**, mécontent, avec une bulle 😠 (message « 😠 X n'est plus payé(e) : il va attendre son salaire devant le Personnel. »). Sans bâtiment Personnel posé, il attend là où il est (« … il attend son salaire. »). Il repart vers la mine dès qu'on le paie.
- **Le manager paie tout seul** : dès qu'il reste **moins d'une minute** payée (`SECONDES_AVANT_PAIE_MANAGER = 60`), il paie 10 minutes de plus avec la trésorerie, **d'abord lui-même**, puis les mineurs **du moins cher au plus cher** (s'il n'y a pas assez, le plus de mineurs possible continuent). **S'il n'est pas payé, il ne paie plus personne** (message « 💼 Ton manager n'est plus payé : la trésorerie est vide ! »). Le travail avance par morceaux de 30 secondes, pour que le manager ait le temps de payer entre deux morceaux après une longue absence.
- **Les plafonds par prestige** (`PLAFONDS` dans `donnees.ts`) :

  | Prestige | 2 | 3 | 4 | 5 | 6 | 7 et + |
  |---|---|---|---|---|---|---|
  | Mineurs au plus (sans talent) | 2 | 3 | 4 | 5 | 6 | 6 |
  | Meilleure pioche des mineurs (`mineur`, paliers [1, 3, 4]) | Pierre | Diamant | Netherite | Netherite | Netherite | Netherite |
  | Niveau max du recruteur (`recruteur`) | – | – | 1 | 2 | 3 | 4 |

  Un niveau au-dessus du plafond s'affiche avec un cadenas « 🔒 Prestige X ».
- **Hors ligne** : les mineurs **continuent de travailler** pendant que le jeu est fermé (rattrapage de **8 heures au plus**, `ABSENCE_MAX` dans `usePartie.ts`), tant qu'ils sont payés ; le manager continue aussi de payer avec la trésorerie. Au retour, un message dit « Pendant ton absence : 👷 tes mineurs t'ont rapporté X $ » et, s'il y a lieu, « 😠 N mineurs attendent leur salaire ».
- **Au prestige** (`prestige` et `employeApresPrestige` dans `mineur.ts`) :
  - **gardés** : les mineurs (prénom, rareté, pioche, ce qu'ils ont rapporté), le niveau du recruteur, le manager ;
  - **remis à zéro** : chaque mineur repart de -2 m **le sac vide** (son contenu est perdu), depuis la mine (s'il marchait au village ou attendait une pioche à la forge, c'est oublié) ; sa récolte encore en route vers le marché est perdue ; la **trésorerie repart de 0** (comme ton argent : le panneau prévient « ⚠️ Au prestige, la trésorerie repart de 0 ») ;
  - le bâtiment Personnel reste à sa place, et le manager et le recruteur toujours devant ;
  - **cadeau** : chaque mineur et le manager ont **au moins 10 minutes payées** en début de prestige.

## Lien avec le reste du jeu

- **Conditions de prestige** (`conditionsPrestige.ts`) :
  - pour **chaque mineur embauché**, « 👷 X : pioche en … » au plafond du prestige (on n'oblige pas à embaucher toute l'équipe) ;
  - à partir du prestige 4, « 🎩 Recruteur au niveau N » au plafond du prestige.
  - Le manager n'est pas une condition.
- **Objectifs** (`objectifs.ts`) : d'abord « Construire : Personnel » (menu Bâtiments, au prestige 2) ; une fois posé, « Embaucher un mineur », « Pioche en … pour X », « Embaucher le recruteur » / « Recruteur niveau N » et « Embaucher le manager » font partie des achats possibles (bulle 💰, prochain objectif « …au stand Personnel ! ») ; bulle ⬆️ pour les plafonds `mineur` et `recruteur`.
- **Talents** (`talents.ts`) : la branche **Patron** s'ouvre au prestige 2 — « Contremaître » (+25 % de vitesse), « Sacs d'équipe » (sacs ×2), « Salaires négociés » (−25 %), « Grande équipe » (+1 mineur) ; la branche **Recrutement** s'ouvre une fois le recruteur embauché — « Œil du recruteur » (rares ×1,25), « Recrutement à prix cassé » (embauches −30 %), « Indemnités réduites » (÷2), « Main de Midas » (mythiques ×2).
- **Autres bâtiments** : la vitesse de **l'ascenseur** (Mine) raccourcit leurs trajets dans la mine ; ils **marchent jusqu'au Marché** pour vendre (au prix du marché), ou chargent le wagonnet si des **rails** (prestige 2, 10 fer la case) relient la mine au marché ; ils passent au **Forgeron** chercher leur nouvelle pioche. Leurs pioches ne coûtent que de l'argent : le fer et la redstone restent pour l'ascenseur, la Foreuse et les rails.
- **Revenus et statistiques** : l'indicateur « $/s » compte chaque mineur payé (sac plein ÷ durée d'un aller-retour, marche au village comprise, moins son salaire) et retire le salaire du manager (`revenu.ts`) ; les statistiques comptent `argentMineurs`, `blocsMineurs` et `salairesPayes`.

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche, prix, licenciement, pioches, salaires, travail seconde après seconde avec la marche au village (`partir`, `suite`, `arriverEnHaut`), passage à la forge, attente devant le Personnel, recruteur, manager, trésorerie).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.employes` : 3 000 $ + 80 pierre + 30 fer, 5 × 5, porte à droite, prestige 2) et les chiffres (`PRIX_EMBAUCHE`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `PLAFONDS`, `VITESSE_MARCHE`, `SECONDES_VENTE_EMPLOYE`, `SECONDES_FORGE_EMPLOYE`…).
- `src/jeu/mineur.ts` : les types `Employe` (étapes `creuse`, `monte`, `marche`, `vend`, `forge`, `descend`, `attend` ; `lieu`, `depuis`, `forgeEnAttente`) et `Manager`, et ce qui est gardé au prestige (`employeApresPrestige`).
- `src/jeu/village.ts` : le chemin à pied entre deux bâtiments (`cheminEntre`, `secondesAPied`), les rails mine → marché et le départ d'une récolte en wagonnet (`railsMineMarche`, `envoyerAuMarche`).
- `src/jeu/convois.ts` : la récolte d'un mineur vendue à l'arrivée du wagonnet (comptée pour lui et dans `argentMineurs`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/temps.ts` : fait avancer les mineurs avec le reste du jeu.
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) et le message « Pendant ton absence ».
- `src/jeu/conditionsPrestige.ts` : les conditions « pioche des mineurs » et « recruteur » du prestige.
- `src/jeu/notifications.ts` : les bulles 😠, ✨, ⬆️ et 💰 au-dessus du Personnel.
- `src/jeu/objectifs.ts` : « Construire : Personnel », achats, badge « Nouveaux niveaux », prochain objectif.
- `src/jeu/decouvertes.ts` : les bulles « Nouveau : Personnel / Recruteur / Manager ! ».
- `src/jeu/talents.ts` : les branches Patron et Recrutement.
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'ils rapportent ($/s, marche au village comprise, et statistiques).
- `src/composants/PanneauEmployes.tsx` : le panneau du bâtiment (salaires, manager et recruteur avec leur portrait, embauche, cartes des mineurs, licenciement).
- `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté d'une recrue.
- `src/composants/Confirmation.tsx` : la fenêtre de confirmation du licenciement.
- `src/composants/MenuConstruction.tsx` : la carte du Personnel dans le menu Bâtiments (cadenas, « Nouveau ! »).
- `src/composants/VueVillage.tsx` : les mineurs qui marchent, vendent, passent à la forge ou attendent (😠), le manager et le recruteur devant le bâtiment, les wagonnets, la bulle.
- `src/composants/sprites.ts` et `public/images/personnages/sprites/` (21/10) : les images des personnages tirées des planches (mineur vu devant, derrière, gauche et droite, casque recoloré à la couleur de sa rareté ; manager et recruteur vus de face) ; `src/composants/Personnage.tsx` : les mêmes images dans la vue en coupe.
- `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : un personnage posé sur la grille, sa place devant un bâtiment (`devant`), sa marche le long d'un chemin (`surLeChemin`, `orienter`).
- `src/composants/VueMonde.tsx` : la galerie des mineurs dans la mine (`GalerieMineurs`).
- `public/images/batiments/employes.webp` : le dessin du bâtiment ; `public/images/personnages/manager.webp`, `recruteur.webp` : les portraits du panneau.
- `src/personnel.css` : les cartes, l'animation d'embauche et les portraits (`.portrait-chef`) ; `src/village.css` : les personnages du village (`.perso-village`, `.perso-colere`, `.perso-poste`).
