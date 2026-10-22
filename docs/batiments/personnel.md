# 👷 Personnel

> Le bureau d'embauche, ouvert **dès le début** (22/10) : on y embauche des mineurs qui creusent tout seuls et remontent leur sac dans le **coffre de la mine**, on leur paie un salaire toutes les 10 minutes, et on peut en mettre à **pousser les wagonnets**. Plus tard, on y trouve le **recruteur** (niveau 3 de la mine) et le **manager** (niveau 4), qui restent à leur poste devant le bâtiment.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **100 $ + 30 pierre** (la pierre se prend dans le sac, puis dans le coffre de la mine). Son identifiant dans le code reste `employes`, son nom affiché est **Personnel**. **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : dès le début (niveau 1 de la mine). Ensuite, dans son panneau : le **recruteur** au **niveau 3** de la mine, le **manager** au **niveau 4**.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). Le manager et le recruteur se tiennent devant le bâtiment, et les mineurs qui attendent leur salaire font la queue un peu plus loin devant.
- **L'ouvrir** : toucher (ou cliquer) le Personnel : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1,3 case du bâtiment, de n'importe quel côté.
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/employes.webp`) : un bureau en bois et en pierre sous un auvent bleu, avec l'enseigne « HIRING », des portraits de mineurs et des bannières.
- **Description** (en haut du panneau) : « Embauche des mineurs qui creusent pour toi (et poussent le wagonnet), et paie leurs salaires. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **😠** (alerte rouge) quand quelqu'un n'est pas payé : « 😠 1 mineur attend son salaire ! », « 😠 *N* mineurs attendent leur salaire ! » ou, avec le manager, « 💼 Trésorerie vide : personne n'est payé ! » (`alerteSalaires`) ;
  - **✨ « Nouveau : Recruteur ! »** au niveau 3 de la mine et **« Nouveau : Manager ! »** au niveau 4, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - **💰 « Une amélioration est achetable ! »** quand une embauche, une pioche de mineur, le recruteur ou le manager est payable tout de suite.
- **Les personnages au village** : les mineurs sont des **hamsters casqués**, et **la couleur du casque est celle de leur rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique : les mêmes couleurs que leurs cartes), avec leur prénom au-dessus de la tête. On les voit **seulement quand ils sont dehors** : quand ils marchent (vers la forge, vers le Personnel, vers la mine), quand ils récupèrent leur pioche devant la forge, quand ils attendent le wagonnet au début des rails (pousseurs), quand ils le poussent (juste derrière lui), et quand ils attendent leur salaire devant le Personnel (bulle 😠, ils tapent du pied). Quand ils sont dans la mine, on voit seulement la **cabine de l'ascenseur** monter et descendre avec eux. Le **manager** et le **recruteur** restent devant le bâtiment, avec leur étiquette « Manager » / « Recruteur ». Dans le panneau, leurs cartes ont leur **portrait**.

## Ce qu'on peut y faire

Le panneau commence par « Tes mineurs creusent pour toi et remontent leur sac dans le coffre de la mine, même jeu fermé. En échange : un salaire toutes les 10 minutes, sinon ils attendent ici, mécontents. »

### 1. Embaucher un mineur (« 👷 Embaucher », ou « 🎲 Recruter » avec le recruteur)

- **Taille de l'équipe** : **4 mineurs au niveau 1 de la mine, puis 2 de plus par niveau** (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`) : 4, 6, 8, 10, puis **12** au niveau 5. Le badge affiche « *n* / max ». Équipe complète : « Ton équipe est complète. Chaque niveau de la mine te permet d'en employer 2 de plus. »
- **Le prix dépend seulement du nombre de mineurs qu'on a en ce moment** (`PRIX_EMBAUCHE`). Au-delà de la liste, chaque embauche coûte 60 % de plus que la précédente (`HAUSSE_APRES_LISTE`). Les prix sont arrondis à la dizaine sous 1 000 $, à la centaine au-dessus.

| Embauche | 1re | 2e | 3e | 4e | 5e | 6e | 7e | 8e | 9e | 10e | 11e | 12e |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prix | 50 $ | 150 $ | 400 $ | 1 000 $ | 2 500 $ | 6 000 $ | 14 000 $ | 30 000 $ | 60 000 $ | 120 000 $ | 192 000 $ | 307 200 $ |

- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois**, **ses 10 premières minutes de salaire comprises**, et descend tout de suite creuser. « 👷 *X* est embauché(e) ! Il descend creuser. » (avec « (rare !) », « (épique !) »… s'il n'est pas commun).
- Avec le recruteur, sa **rareté est tirée au hasard** (on ne refuse personne) et une animation la dévoile (voir plus bas).

### 2. La carte d'un mineur

Une carte compacte par mineur, pour voir toute l'équipe d'un coup :

- son **prénom**, sa **rareté** (avec « ×*N* » si elle n'est pas commune), l'icône de ce qu'il fait et le temps restant (⛏️ creuse, ⏫ remonte, 📦 vide son sac, ⏬ redescend, 🛤️ au quai ou pousse, 🔨 à la forge, 🚶 marche, 😠 pas payé), et le lien **Licencier** ;
- ce qu'il rapporte : « ⛏️ ~*X* $ de blocs / 10 min (*N* / min) · salaire *Y* $ », ou « 🛤️ Pousse le wagonnet · salaire *Y* $ » ;
- le bouton de **rôle** : **🛤️ Pousser le wagonnet** ou **⛏️ Creuser** (gris) ;
- deux petites jauges : **⏳ temps payé** (vert, ou rouge « 😠 Plus payé ») et **🎒 sac** ;
- la ligne d'amélioration de sa **pioche**.

L'infobulle donne son activité en entier, sa vitesse en creusant et le nombre de blocs qu'il a cassés.

### 3. Améliorer la pioche d'un mineur

Chaque amélioration donne une meilleure pioche (il creuse plus vite) **et** un plus grand sac (moins d'allers-retours). Payé **en argent seulement** (`NIVEAUX_EMPLOYE`). Ces pioches ne s'usent pas.

| Niveau | Pioche | Vitesse en creusant | Sac | Coût | Salaire / 10 min | Blocs par minute (échelle) | Blocs par minute (ascenseur niveau 6) |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Bois | 0,15 bloc/s | 10 | (de base) | 30 $ | ~6,8 | ~8,5 |
| 2 | Pierre | 0,25 bloc/s | 15 | 150 $ | 60 $ | ~11 | ~14 |
| 3 | Fer | 0,4 bloc/s | 20 | 600 $ | 140 $ | ~16,7 | ~22 |
| 4 | Or | 0,6 bloc/s | 30 | 2 500 $ | 320 $ | ~25 | ~33 |
| 5 | Diamant | 0,9 bloc/s | 45 | 9 000 $ | 700 $ | ~37,5 | ~50 |

(Pour un mineur commun, trajets compris. Les salaires valent environ 15 % de ce qu'il fait sortir de la mine.)

- **Il va chercher sa pioche à la forge** : si un forgeron est posé, l'amélioration est payée tout de suite et compte tout de suite, mais le mineur passe à la forge à la fin de son tour (« ⛏️ *X* va chercher sa pioche en … à la forge. ») : il y marche, y reste **3 secondes** (`SECONDES_FORGE_EMPLOYE`), puis retourne à la mine. Sans forgeron, il l'a directement.

### 4. Le rôle « pousseur »

- Le bouton **🛤️ Pousser le wagonnet** fait d'un mineur un **pousseur** : il finit ce qu'il fait (s'il est au fond, il remonte d'abord vider son sac), puis va **attendre au quai**, à côté du début des rails qui partent de la mine. « 🛤️ *X* va pousser les wagonnets. »
- Dès qu'un **trajet de wagonnet** (créé par le joueur, voir [mine.md](mine.md#les-wagonnets)) a quelque chose à porter et n'est pas électrique, un pousseur libre et payé le **pousse jusqu'à l'arrivée** (2,5 cases/s), puis le ramène et retourne au quai. Un pousseur sert tous les trajets (un à la fois) : avec plusieurs trajets, il en faut parfois plusieurs.
- Pendant ce temps, il ne creuse pas, mais il est **payé** comme les autres (son salaire dépend de sa pioche). On ne peut pas le licencier pendant qu'il pousse.
- **⛏️ Creuser** le remet à creuser (« ⛏️ *X* retourne creuser. »).
- Un **trajet électrique** (générateur) part tout seul : quand tous les trajets le sont, le pousseur ne sert plus à rien, il vaut mieux le remettre à creuser.

### 5. Payer les salaires (« 💵 Payer 10 min », sans manager)

- Chaque mineur doit être payé **toutes les 10 minutes** (`SECONDES_PAR_PAIE = 600`).
- **Salaire de 10 minutes** = salaire de sa pioche (tableau ci-dessus) × multiplicateur de sa rareté, arrondi.
- Sans manager, **on ne paie que 10 minutes à la fois** : le bouton complète chaque mineur jusqu'à 10 minutes payées, et ne fait payer que le temps manquant (au prorata, arrondi au dollar supérieur). La carte « 💵 Salaires » indique le total pour 10 minutes et le temps qu'il reste au moins payé (« Tout le monde est payé pour encore 8 min. On paie 10 minutes à la fois (le manager, au niveau 4 de la mine, s'en chargera pour toi). »). Elle passe en rouge quand quelqu'un attend son salaire.
- Cette carte disparaît quand on a embauché le manager.

### 6. Licencier un mineur (lien « Licencier » sur sa carte)

- Une fenêtre de confirmation (`Confirmation.tsx`) demande « Licencier *X* ? », rappelle sa rareté et le prix des **indemnités**. Le bouton est grisé si on n'a pas assez d'argent.
- **Indemnités = 40 % du prix de base de la dernière place de l'équipe** (`PART_INDEMNITES = 0.4`), arrondi comme les prix d'embauche.

| Mineurs dans l'équipe | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Indemnités | 20 $ | 60 $ | 160 $ | 400 $ | 1 000 $ | 2 400 $ | 5 600 $ | 12 000 $ | 24 000 $ | 48 000 $ | 76 800 $ | 122 900 $ |

- Le mineur part **avec son équipement** (sa pioche et ce qu'il a dans son sac sont perdus). « 👋 *X* est parti(e). Indemnités : … » Réembaucher coûte ensuite le prix normal de la taille d'équipe : c'est le moyen de « retenter sa chance » avec le recruteur.

### 7. Le recruteur (niveau 3 de la mine)

- Avant : carte verrouillée « 🔒 Recruteur · niveau 3 de la mine », qui montre déjà les chances qu'il donnera.
- On l'embauche (niveau 1) puis on l'améliore, **en argent seulement** (`NIVEAUX_RECRUTEUR`). Les chances de la prochaine embauche s'affichent en pastilles de couleur :

| Niveau | Coût | Commun | Rare | Épique | Légendaire | Mythique |
|---|---|---|---|---|---|---|
| 1 (embauche) | 5 000 $ | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 12 000 $ | 60 % | 22 % | 11 % | 5,5 % | 1,5 % |
| 3 | 25 000 $ | 55 % | 23,5 % | 12,5 % | 7 % | 2 % |
| 4 | 50 000 $ | 50 % | 25 % | 14 % | 8,5 % | 2,5 % |

- **Les raretés** (`RARETES`) :

| Rareté | Rendement (vitesse et taille du sac) | Salaire | Couleur |
|---|---|---|---|
| Commun | ×1 | ×1 | gris `#b9b4ab` |
| Rare | ×1,5 | ×1,25 | bleu `#4f9df0` |
| Épique | ×2 | ×1,5 | violet `#b06cf0` |
| Légendaire | ×3 | ×2 | orange `#f5a524` |
| Mythique | ×5 | ×3 | rose `#ff4d8d` |

  Un mineur rare creuse plus vite **et** a un plus grand sac : le temps passé à creuser un sac reste le même, mais chaque aller-retour rapporte plus. Un mineur mythique en diamant sort ainsi environ 187 blocs par minute avec l'échelle.
- **L'animation d'embauche** (`RevelationRecrue.tsx`, seulement avec le recruteur) : la carte tremble pendant que les couleurs défilent (**1,6 s** de suspense, un clic dévoile tout de suite), puis elle se retourne avec des rayons, des étoiles (★ selon le rang), des confettis (24 + 18 par rang de rareté) et un flash pour légendaire et mythique. Bouton « Au travail ! », « Super ! » (rare, épique) ou « Incroyable ! » (légendaire, mythique). Des sons accompagnent le suspense et la révélation.

### 8. Le manager et la trésorerie (niveau 4 de la mine)

- Avant : carte verrouillée « 🔒 Manager · niveau 4 de la mine ».
- **Embauche : 15 000 $** (`PRIX_MANAGER`), ses 10 premières minutes comprises.
- **Son salaire : 600 $ toutes les 10 minutes** (`SALAIRE_MANAGER`), payé par la trésorerie.
- **La trésorerie** est une cagnotte qu'on remplit. Boutons : « +*manque* » (juste ce qu'il faut pour une paie de toute l'équipe), **« Remplir pour 1 h »** (jusqu'à 6 paies de toute l'équipe), **+1 000 $**, **+10 000 $**, **+100 000 $**, **« Tout mettre »** et **« Tout reprendre »**.
- Une jauge montre la trésorerie face au prix d'une paie de toute l'équipe (manager compris), et le panneau dit combien de temps elle tient. Badge « Au travail » ou « 😠 Pas payé ».

## Règles et comportement

- **Le travail d'un mineur**, en boucle (`travailler` dans `employes.ts`) : il **descend** dans la mine, **creuse** jusqu'à ce que son sac soit plein, **remonte**, **vide son sac dans le coffre de la mine** (2 s, `SECONDES_VIDAGE_EMPLOYE`), puis redescend. Il ne creuse pas pendant les trajets.
- **Ses trajets** : à l'**échelle**, une montée ou une descente dure **10 s** (`SECONDES_ECHELLE`) ; avec l'**ascenseur** (au panneau de la mine), de 6 s (niveau 1) à 1 s (niveau 6).
- **Ce qu'il trouve** : des blocs tirés au hasard selon le **niveau de la mine** (les mêmes chances que la mine). Il ne double jamais ses minerais.
- **Coffre plein** : il attend devant, son sac plein, sans rien faire (« 📦 attend : le coffre de la mine est plein ! »), en continuant d'être payé. Il vide dès qu'il y a de la place.
- **Le temps payé s'écoule pendant tout son travail** (trajets, attente au quai et poussée compris). Quand il n'est plus payé : s'il creusait ou descendait, il remonte ; en haut, il vide quand même son sac, puis **marche jusqu'au Personnel et attend devant**, mécontent, avec une bulle 😠 (« 😠 *X* n'est plus payé(e) : il va attendre son salaire devant le Personnel. »). Un pousseur au quai fait pareil. Sans bâtiment Personnel posé, il attend là où il est. Il repart vers la mine dès qu'on le paie (à pied, 4 cases par seconde, `VITESSE_MARCHE`).
- **Le manager paie tout seul** : dès qu'il reste **moins d'une minute** payée (`SECONDES_AVANT_PAIE_MANAGER = 60`), il paie 10 minutes de plus avec la trésorerie, **d'abord lui-même**, puis les mineurs **du moins cher au plus cher** (s'il n'y a pas assez, le plus de mineurs possible continuent). **S'il n'est pas payé, il ne paie plus personne** (« 💼 Ton manager n'est plus payé : la trésorerie est vide ! Remplis-la au Personnel. »). Le travail avance par morceaux de 30 secondes, pour que le manager ait le temps de payer entre deux morceaux après une longue absence.
- **Hors ligne** : les mineurs **continuent de travailler** pendant que le jeu est fermé (rattrapage de **8 heures au plus**), tant qu'ils sont payés ; le manager continue aussi de payer avec la trésorerie. Au retour, le message « Pendant ton absence » dit combien de blocs de plus sont dans le coffre et, s'il y a lieu, « 😠 *N* mineurs attendent leur salaire ».

## Lien avec le reste du jeu

- **Objectifs** (`objectifs.ts`) : d'abord « Construire : Personnel » ; une fois posé, « Embaucher un mineur », « Pioche en … pour *X* », « Embaucher le recruteur » / « Recruteur niveau *N* » et « Embaucher le manager » font partie des achats possibles (bulle 💰, prochain objectif « …au Personnel ! »).
- **Autres bâtiments** : ils remplissent le **coffre de la mine** ; l'**ascenseur** (au panneau de la mine) raccourcit leurs trajets ; un **pousseur** fait rouler les wagonnets (vers le **Marché**, la **Foreuse** ou le **Générateur**) tant que leurs trajets ne sont pas électriques ; ils passent au **Forgeron** chercher leur nouvelle pioche. Leurs pioches ne coûtent que de l'argent : le fer, la redstone et l'or restent pour la mine, les rails, la foreuse et le générateur.
- **Revenus et statistiques** : l'indicateur « $/s » compte chaque mineur **payé** qui creuse (sac plein ÷ durée d'un tour, trajets compris, × valeur moyenne d'un bloc), moins les salaires de tous les mineurs payés (pousseurs compris) et celui du manager (`revenu.ts`) ; les statistiques comptent `blocsMineurs` et `salairesPayes`.
- **Succès** : « 👷 Patron » (un premier mineur), « 👥 Chef d'équipe » (6 mineurs).
- **Bot de simulation** (`bot.ts`) : il embauche dès qu'il a le prix plus une paie d'avance, améliore les pioches, paie les salaires dès qu'il reste moins d'une minute, met un mineur à pousser dès qu'il a le trajet Mine → Marché et 2 mineurs, puis le remet à creuser quand les rails sont électriques.

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche, prix, licenciement, pioches, rôle pousseur, salaires, travail seconde après seconde, passage à la forge, attente devant le Personnel, recruteur, manager, trésorerie, textes d'activité).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.employes` : 100 $ + 30 pierre, 5 × 5, porte à droite) et les chiffres (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`, `PRIX_EMBAUCHE`, `HAUSSE_APRES_LISTE`, `PART_INDEMNITES`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `SALAIRE_MANAGER`, `SECONDES_VIDAGE_EMPLOYE`, `SECONDES_FORGE_EMPLOYE`, `VITESSE_MARCHE`, `VITESSE_POUSSE_MINEUR`…).
- `src/jeu/mineur.ts` : les types `Employe` (rôle `mineur` ou `pousseur` ; étapes `creuse`, `monte`, `vide`, `descend`, `quai`, `pousse`, `marche`, `forge`, `attend` ; `lieu`, `depuis`, `forgeEnAttente`) et `Manager`, l'ascenseur (`secondesTrajetMineur`).
- `src/jeu/wagonnet.ts` : le pousseur qui part avec un wagonnet et revient au quai.
- `src/jeu/village.ts` : le chemin à pied entre deux bâtiments (`cheminEntre`, `secondesAPied`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/temps.ts` : fait avancer les mineurs avec le reste du jeu.
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) et le message « Pendant ton absence ».
- `src/jeu/notifications.ts` : les bulles 😠, ✨ et 💰 au-dessus du Personnel.
- `src/jeu/objectifs.ts` : « Construire : Personnel », achats, prochain objectif.
- `src/jeu/decouvertes.ts` : les bulles « Nouveau : Recruteur / Manager ! ».
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'ils rapportent ($/s et statistiques).
- `src/jeu/employes.test.ts` : les tests.
- `src/composants/PanneauEmployes.tsx` : le panneau du bâtiment (salaires, manager et recruteur avec leur portrait, embauche, cartes des mineurs, rôle, licenciement).
- `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté d'une recrue.
- `src/composants/Confirmation.tsx` : la fenêtre de confirmation du licenciement.
- `src/composants/MenuConstruction.tsx` : la carte du Personnel dans le menu Bâtiments.
- `src/composants/VueVillage.tsx` : les mineurs qui marchent, passent à la forge, attendent au quai, poussent un wagonnet ou attendent leur salaire (😠), le manager et le recruteur devant le bâtiment, la cabine de l'ascenseur qui suit les mineurs.
- `src/composants/sprites.ts` et `public/images/personnages/sprites/` : les images des personnages tirées des planches (mineur vu devant, derrière, gauche et droite, casque recoloré à la couleur de sa rareté ; manager et recruteur vus de face).
- `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : un personnage posé sur la grille, sa place devant un bâtiment (`devant`), sa marche le long d'un chemin (`surLeChemin`, `orienter`).
- `public/images/batiments/employes.webp` : le dessin du bâtiment ; `public/images/personnages/manager.webp`, `recruteur.webp` : les portraits du panneau.
- `src/personnel.css` : les cartes, l'animation d'embauche et les portraits (`.portrait-chef`) ; `src/village.css` : les personnages du village (`.perso-village`, `.perso-colere`, `.perso-poste`).
