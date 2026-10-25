# 👷 Personnel

> Le bureau d'embauche, ouvert **dès le début** : on y embauche des **taupes mineuses** qui creusent toutes seules au fond de la mine (la caisse de l'ascenseur remonte leurs blocs dans le **coffre de la mine**), des **pousseurs**, chacun pour **un trajet de wagonnet**, et on paie tout ce monde toutes les **5 minutes**. Plus tard, on y trouve le **manager** (palier 3 de la mine) et le **recruteur** (palier 4).
> Écrit d'après le code au 25/10 (la grande mise à jour : premier mineur à 50 $, Personnel à 40 $, 5 niveaux pour les pioches et les pousseurs, 3 niveaux pour les chefs, nouveaux prix et salaires, personnages en taupes). Le tutoriel fait construire le Personnel et embaucher le premier mineur : c'est le moment fort du début, quand la mine se met à tourner toute seule.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **40 $** (25/10 ; avant 150 $ + 30 pierre). Son identifiant dans le code reste `employes`, son nom affiché est **Personnel**. **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : **dès le début** (25/10 ; avant, au niveau 2 du joueur). C'est la 4e étape du **tutoriel** (« Construis le Personnel »), juste avant « Embauche ton premier mineur ». Dans son panneau : le **manager** au **palier 3** de la mine, le **recruteur** au **palier 4**. Les améliorations des employés suivent les **paliers** de la mine (« 🕳️ Mine *N* »).
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). Le manager et le recruteur se tiennent devant le bâtiment, et les employés qui attendent leur salaire font la queue devant.
- **L'ouvrir** : toucher (ou cliquer) le Personnel : la taupe du joueur y marche, puis le panneau s'ouvre.
- **Description** : « Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **😠 « Salaires ! »** (alerte rouge) quand quelqu'un n'est pas payé (« 😠 1 mineur attend son salaire ! », ou, avec le manager, « 💼 Plus assez d'argent : personne n'est payé ! », `alerteSalaires`) ; une bulle « Payer ! » est aussi au-dessus de la mine ;
  - **🛤️ « Sans trajet »** (alerte rouge) quand des pousseurs n'ont plus de trajet en service ;
  - **✨ « Nouveau : Manager ! »** au niveau 3 de la mine et **« Nouveau : Recruteur ! »** au niveau 4, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - **⬆️ « Achetable »** quand une embauche ou une amélioration est payable tout de suite (seulement pendant le tutoriel).
- **Les personnages au village** : depuis le 25/10, les employés sont des **taupes** casquées, et **la couleur du casque est celle de leur rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique), avec leur prénom au-dessus de la tête. On les voit **quand ils sont dehors** : quand ils marchent (vers la mine, vers le Personnel, vers le quai de leur trajet), quand ils attendent leur wagonnet au quai (les pousseurs), quand ils le poussent, et quand ils attendent leur salaire devant le Personnel (😠). Au fond de la mine, on voit seulement la **caisse de l'ascenseur** monter et descendre. Le **manager** et le **recruteur** restent devant le bâtiment. Les taupes sont des SVG plats (`public/images/personnages/sprites/`, 4 vues par rareté, fabriquées par `node outils/art/personnages.mjs`), et les portraits du manager et du recruteur sont `public/images/personnages/manager.svg` et `recruteur.svg` (voir [../jeu/visuel-et-sons.md](../jeu/visuel-et-sons.md#5-les-personnages--des-taupes)).
- **Le dessin au village** (25/10, SVG plat au contour d'encre, `public/images/batiments/employes.svg`, dessiné par `employes()` dans `outils/art/batiments.mjs`) : sur une dalle de 5 × 5 pavés, un bureau au bas des murs en pierre et aux poutres d'angle en bois, un toit bleu, deux fenêtres avec une jardinière de fleurs roses, une porte bleue sur la façade droite, une enseigne ronde au casque de mineur, un tableau d'annonces (les offres d'embauche), un tonneau et une caisse. Sans aucune écriture : retourné, il utilise la même image.

## Ce qu'on peut y faire

Le panneau (`PanneauEmployes.tsx`, refait le 25/10) a **trois onglets** :

- **👷 Équipe** : les salaires, puis **une carte par employé** (ses chiffres, ses améliorations, « Payer » et « Licencier »), rangées par métier (mineurs, puis pousseurs). Pastille « ! » si quelqu'un n'est pas payé ;
- **➕ Embaucher** : un **mineur**, ou un **pousseur** pour un trajet de wagonnet. Pastille « + » quand on peut payer une embauche ;
- **🎲 Remplacer** (avec le recruteur) : un bouton aux couleurs de toutes les raretés qui défilent, avec un dé qui roule (`btn-hasard`, 25/10) : une nouvelle recrue prend la place du mineur, rareté au hasard.
- **💼 Chefs** : le **manager** et le **recruteur**. Pastille « ! » si le manager n'a plus assez d'argent ou s'il dort.

**Deux métiers** : les **mineurs** ne font que creuser (la caisse de l'ascenseur remonte ce qu'ils cassent). Les **pousseurs** ne creusent jamais : ils poussent le wagonnet d'un seul trajet.

### 1. Embaucher un mineur

- **Nombre de mineurs** : **1 par niveau de la mine** (`maxEmployes`) : 1, 2, 3, 4, puis **5** au niveau 5. Les **pousseurs ne comptent pas** : au plus un par trajet de wagonnet (4, `maxPousseurs`). Complet : chaque niveau de la mine permet d'en employer 1 de plus.
- **Le prix dépend du nombre de mineurs qu'on a en ce moment** (`PRIX_EMBAUCHE`, 25/10) : **le premier ne coûte presque rien**, pour que le jeu tourne tout seul en 2 minutes.

| Embauche | 1er | 2e | 3e | 4e | 5e |
|---|---:|---:|---:|---:|---:|
| Mineur (25/10) | **50 $** | 1 200 $ | 7 000 $ | 25 000 $ | 80 000 $ |

(Avant le 25/10 : 500 $, 3 500 $, 15 000 $, 45 000 $ et 130 000 $.) Au-delà de la liste, chaque embauche coûterait 2,2 fois la précédente (`HAUSSE_APRES_LISTE`). Les prix sont arrondis à la dizaine sous 1 000 $, à la centaine au-dessus. Une embauche peut aussi se payer en gemmes. Chaque embauche rapporte **40 XP** (une seule fois : licencier puis réembaucher ne redonne rien).

- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot, Romain, Dodo, Guewen ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois** et **ses 5 premières minutes de salaire comprises**. Il sort du Personnel, marche jusqu'à la mine et descend dans la caisse de l'ascenseur.
- Avec le recruteur, sa **rareté est tirée au hasard** et une animation la dévoile (`RevelationRecrue.tsx`).

### 2. La pioche d'un mineur (5 niveaux, 25/10)

Chaque pioche le fait creuser plus vite, avec un plus grand sac (le tas où il pose ses blocs au fond, en attendant la caisse). Payée **en argent seulement** (ou en gemmes) ; ces pioches ne s'usent pas. Chaque niveau demande la **mine au même niveau** (le palier).

| Niveau | Pioche | Creuse | Sac | Prix (25/10) | Palier | Salaire / 5 min |
|---|---|---:|---:|---:|---:|---:|
| 1 | Bois | 0,5 bloc/s | 10 | (de base) | — | 120 $ |
| 2 | Fer | 0,75 bloc/s | 18 | 400 $ | 2 | 300 $ |
| 3 | Or | 1 bloc/s | 28 | 4 000 $ | 3 | 700 $ |
| 4 | Émeraude | 1,3 bloc/s | 40 | 15 000 $ | 4 | 1 300 $ |
| 5 | Diamant | 1,7 bloc/s | 55 | 50 000 $ | 5 | 2 600 $ |

(25/10 : la pioche en pierre est retirée, il en reste 5 ; avant, 6 pioches de 500 $ à 60 000 $, et des salaires de 220 $ à 2 200 $.) Le salaire fait environ 26 % de ce que le mineur fait sortir de la mine au palier de sa pioche : **une meilleure pioche rapporte toujours plus qu'elle ne coûte en salaire**. Ce qu'il sort vraiment dépend aussi de l'ascenseur (voir [mine.md](mine.md#lascenseur-niveaux_ascenseur)). Toutes ses pioches : 69 400 $.

- **Sa pioche lui descend par l'ascenseur** : si un forgeron est posé, il attend **3 secondes** au fond (`SECONDES_FORGE_EMPLOYE`) que le forgeron la fasse ; sinon, il l'a directement. Il ne remonte jamais pour ça.

### 3. Les pousseurs

Un pousseur est un **métier à part** : on l'embauche **pour un seul trajet** (par exemple Mine → Marché), et il ne pousse que le wagonnet de ce trajet. **Il en faut un par trajet qui roule tout seul**, même sur des rails électriques ; sinon, le joueur pousse lui-même.

**L'embaucher** (onglet Embaucher) : on coche son trajet dans la liste (un trajet dont les deux bâtiments sont construits ; « Libre », déjà pris par un pousseur, ou « Pas de rails »), le trajet **brille sur la carte**, puis **🛤️ Embaucher pour ce trajet**. Il faut des rails entre les deux bâtiments et un trajet sans pousseur ; si le trajet n'existe pas encore, il est **créé avec l'embauche**.

| Embauche | 1er | 2e | 3e | 4e |
|---|---:|---:|---:|---:|
| Pousseur (25/10, `PRIX_EMBAUCHE_POUSSEUR`) | **300 $** | 1 500 $ | 5 000 $ | 12 000 $ |

**Son travail** : il marche du Personnel jusqu'au **quai** (le début des rails de son trajet, devant le bâtiment de départ), attend son wagonnet, le **pousse jusqu'à l'arrivée** dès qu'il a quelque chose à porter (2,5 cases/s × sa vitesse × sa rareté ; + 30 % à + 75 % sur un trajet électrique), puis le ramène. Ses arrêts (charger, vider ou vendre) durent toujours 1 s. On peut **changer son trajet** sur sa carte. Si son trajet est arrêté, la bulle **🛤️ Sans trajet** apparaît.

**L'améliorer** (deux améliorations sur sa carte, 5 niveaux chacune, 25/10) :

| Niveau | 🏃 Vitesse (`NIVEAUX_POUSSEUR`) | Prix | 🛒 Chariot (`NIVEAUX_CHARIOT_POUSSEUR`) | Prix | Palier |
|---|---|---:|---:|---|---:|
| 1 | Débutant × 1 | (de base) | 20 places | (de base) | — |
| 2 | Costaud × 1,2 | 1 000 $ | 40 | 800 $ + 40 fer | 2 |
| 3 | Robuste × 1,4 | 5 000 $ | 70 | 4 000 $ + 100 fer | 3 |
| 4 | Expert × 1,65 | 15 000 $ | 110 | 14 000 $ + 200 fer | 4 |
| 5 | Champion × 1,9 | 45 000 $ | 170 | 45 000 $ + 400 fer | 5 |

Le **chariot** est la seule façon d'agrandir un wagonnet (le joueur qui pousse lui-même a 20 places). (25/10 : plus de prix « × le niveau du joueur », et 5 niveaux au lieu de 5 et 7.) Si son chariot ne suit pas ce que sort le bâtiment de départ, une alerte le dit au panneau de la mine (ou de la foreuse), avec un bouton vers le Personnel.

- **Son salaire** : **400 $** toutes les 5 minutes, **+ 250 $** par niveau de vitesse et **+ 200 $** par niveau de chariot (× sa rareté) : de 400 $ à 2 200 $.
- **Sa rareté** (avec le recruteur) : il pousse × 1 + (rendement − 1) ÷ 2 (`forcePousseur` : rare × 1,25, épique × 1,5, légendaire × 2, mythique × 3).

### 4. Payer les salaires (sans manager)

- Chaque employé doit être payé **toutes les 5 minutes** (`SECONDES_PAR_PAIE = 300`).
- **Salaire de 5 minutes** = salaire de sa pioche (mineur) ou de ses niveaux (pousseur) × multiplicateur de sa rareté, arrondi.
- Sans manager, **on ne paie que 5 minutes à la fois** : « Payer » complète chacun jusqu'à 5 minutes payées, et ne fait payer que le temps manquant (au prorata, arrondi au dollar supérieur). On peut payer tout le monde, ou **un seul employé** sur sa carte.
- Sans salaire, un mineur s'arrête : il remonte dans la caisse, **marche jusqu'au Personnel et attend devant**, mécontent (😠). Dès qu'on le paie, il repart. Plusieurs employés payés ensemble repartent l'un après l'autre (0,7 s d'écart).

### 5. Licencier un employé

- Une fenêtre de confirmation (`Confirmation.tsx`) rappelle le prix des **indemnités** : **40 %** du prix de la dernière place de son métier (`PART_INDEMNITES`).

| Mineurs dans l'équipe | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|
| Indemnités (25/10) | 20 $ | 480 $ | 2 800 $ | 10 000 $ | 32 000 $ |

Pour les pousseurs : 120 $, 600 $, 2 000 $ et 4 800 $. L'employé part avec son équipement.

### 6. Le recruteur (palier 4 de la mine)

- On l'embauche, puis on l'améliore, **en argent** (`NIVEAUX_RECRUTEUR`, 3 niveaux depuis le 25/10 ; avant 4). Il donne une **rareté** à chaque nouvel employé (mineur ou pousseur), tirée au hasard, du plus rare au plus commun (`tirerRarete`) :

| Niveau | Prix (25/10) | Palier | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 (embauche) | 25 000 $ | 4 | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 70 000 $ | 5 | 57 % | 23 % | 12 % | 6 % | 2 % |
| 3 | 150 000 $ | 5 | 50 % | 25 % | 14 % | 8 % | 3 % |

Total : 245 000 $.

- **Les raretés** (`RARETES`) :

| Rareté | Rendement (vitesse et taille du sac) | Salaire | Couleur |
|---|---|---|---|
| Commun | × 1 | × 1 | gris `#b9b4ab` |
| Rare | × 1,5 | × 1,4 | bleu `#4f9df0` |
| Épique | × 2 | × 1,8 | violet `#b06cf0` |
| Légendaire | × 3 | × 2,5 | orange `#f5a524` |
| Mythique | × 5 | × 4 | rose `#ff4d8d` |

- **🔄 Remplacer** un mineur (`remplacerMineur`, `prixRemplacement`) : une nouvelle recrue (nom et rareté tirés au hasard) prend sa place, **avec sa pioche**, sans indemnités. Prix : le plus cher entre le quart de la dernière place possible (`PART_REMPLACEMENT`) et **200 $ × (niveau du joueur)²** (`PRIX_REMPLACEMENT_PAR_NIVEAU`).

### 7. Le manager (palier 3 de la mine)

- **Embauche : 8 000 $** (`PRIX_MANAGER`, 25/10 ; avant 10 000 $), ses 5 premières minutes comprises. **Son salaire : 400 $ toutes les 5 minutes** (`SALAIRE_MANAGER`), pris dans l'argent du joueur.
- **Il paie tout seul** : dès qu'il reste moins d'une minute payée, il paie 5 minutes de plus **avec l'argent du joueur**, d'abord lui-même, puis les employés du moins cher au plus cher. S'il n'est pas payé, il ne paie plus personne.
- **(25/10) Il vend du coffre s'il le faut** : quand l'argent ne suffit pas pour un salaire, il vend juste ce qu'il faut du coffre de la mine, les minerais les moins chers d'abord, jamais ceux qu'on garde (📌) (`vendreDuCoffrePour`). Avant, pendant une absence, il vidait l'argent du joueur en salaires pendant que tout ce que les mineurs creusaient s'entassait dans le coffre : on revenait sans un sou.
- **La fatigue** : il ne reste éveillé qu'un temps, **jeu ouvert comme jeu fermé**, puis il s'endort et ne paie plus personne, jusqu'à ce qu'on le **☕ Réveille** au Personnel. On ne peut donc pas laisser le jeu tourner tout seul à l'infini. Ses 3 niveaux (`NIVEAUX_MANAGER`, `PALIER_CHEF.manager`, 25/10) :

| Niveau | Reste éveillé | Prix | Palier |
|---|---:|---:|---:|
| 1 (embauche) | 30 min | 8 000 $ | 3 |
| 2 | 1 h | 30 000 $ | 4 |
| 3 | 2 h | 90 000 $ | 5 |

(Avant le 25/10 : 5 niveaux, de 15 min à 1 h 30.) Total : 128 000 $.

- **C'est une option** : un interrupteur l'arrête ou le remet au travail (`basculerManager`, `managerActif`). Arrêté, il ne paie personne et on ne lui doit rien : on paie ses employés soi-même.

## Règles et comportement

- **Le travail d'un mineur** (`travailler` dans `employes.ts`) : arrivé à la mine, il descend dans la caisse de l'ascenseur ; au fond, il **creuse sans s'arrêter** et pose ses blocs dans son sac. **La caisse fait des allers-retours sans cesse**, prend les sacs au fond et les vide dans le coffre de la mine. Sac plein (l'ascenseur ne suit pas) : il attend la caisse. Il ne remonte que s'il n'est plus payé.
- **Ce qu'il trouve** : des blocs tirés au hasard selon le **niveau de la mine**. Il ne double jamais ses minerais. Pendant le bonus « ⚡ Production × 2 » (boutique des gemmes), il creuse deux fois plus vite.
- **Coffre plein** : la caisse attend en haut, pleine ; le mineur remplit son sac puis attend, **sans user son salaire**.
- **Hors ligne** : les employés continuent de travailler pendant que le jeu est fermé (**8 heures au plus**), tant qu'ils sont payés ; le manager continue de payer tant qu'il est éveillé. Au retour, la fenêtre « Bon retour, mineur ! » dit ce que les mineurs ont creusé, ce que les wagonnets ont vendu, et qui attend son salaire.

## Lien avec le reste du jeu

- **Tutoriel** (`tutoriel.ts`) : après la première vente du coffre, « Construis le Personnel », puis « Embauche ton premier mineur » ; ensuite, le « bravo ».
- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis le Personnel », « Embauche ton premier mineur », « Embauche un pousseur pour le wagonnet » ; **« Paie ton mineur au Personnel »** (ou « Paie tes *n* mineurs ») est une urgence, passée devant les autres. Les embauches et améliorations sont aussi des achats possibles.
- **Autres bâtiments** : les mineurs remplissent le **coffre de la mine** ; l'**ascenseur** remonte leurs blocs ; les **pousseurs** font rouler les wagonnets (vers le **Marché**, la **Foreuse** ou le **Générateur**) ; le **Forgeron** fait leurs nouvelles pioches.
- **Revenus et statistiques** : le « $/s » compte chaque mineur payé (blocs par seconde × valeur moyenne d'un bloc), moins les salaires de tous les employés et du manager (`revenu.ts`) ; les statistiques comptent `blocsMineurs` et `salairesPayes`.
- **Succès** : « 👷 Patron » (un premier employé), « 👥 Chef d'équipe » (6 employés).
- **Bot de simulation** (`bot.ts`) : il embauche dès qu'il a le prix plus une paie d'avance, améliore les pioches, paie les salaires dès qu'il reste moins d'une minute, embauche un pousseur pour Mine → Marché dès qu'il a ce trajet (et agrandit son chariot quand le coffre se remplit), le manager à partir de 15 000 $ (et le réveille à mi-fatigue) et le recruteur dès qu'il peut.

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche des mineurs et des pousseurs, prix `prixEmbauche`, licenciement, pioches, chariot et vitesse des pousseurs, trajet d'un pousseur `changerTrajet`, salaires, travail seconde après seconde, caisse de l'ascenseur `avancerNavette`, attente devant le Personnel, recruteur, remplacement, manager et sa fatigue).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.employes` : 40 $, 5 × 5, porte à droite) et les chiffres (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`, `PRIX_EMBAUCHE`, `PRIX_EMBAUCHE_POUSSEUR`, `HAUSSE_APRES_LISTE`, `PART_INDEMNITES`, `PART_REMPLACEMENT`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `NIVEAUX_POUSSEUR`, `NIVEAUX_CHARIOT_POUSSEUR`, `SALAIRE_POUSSEUR_*`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `SALAIRE_MANAGER`, `NIVEAUX_MANAGER`, `PALIER_CHEF`, `NOMS_EMPLOYES`).
- `src/jeu/mineur.ts` : les types `Employe`, `Navette` et `Manager`.
- `src/jeu/wagonnet.ts` : le pousseur de chaque trajet.
- `src/jeu/notifications.ts`, `src/jeu/decouvertes.ts`, `src/jeu/missions.ts`, `src/jeu/objectifs.ts`, `src/jeu/tutoriel.ts` : bulles, découvertes, missions, achats, tutoriel.
- `src/jeu/employes.test.ts` : les tests.
- `src/composants/PanneauEmployes.tsx` : le panneau et ses trois onglets ; `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté ; `src/composants/Confirmation.tsx` : la confirmation du licenciement.
