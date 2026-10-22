# 👷 Personnel

> Le bureau d'embauche, ouvert **dès le début** (22/10) : on y embauche des mineurs qui creusent tout seuls et remontent leur sac dans le **coffre de la mine**, on embauche aussi des **pousseurs** (26/10), chacun pour **un trajet de wagonnet**, et on paie tout ce monde toutes les 10 minutes. Plus tard, on y trouve le **recruteur** (niveau 3 de la mine) et le **manager** (niveau 4), qui restent à leur poste devant le bâtiment.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **100 $ + 30 pierre** (la pierre se prend dans le sac, puis dans le coffre de la mine). Son identifiant dans le code reste `employes`, son nom affiché est **Personnel**. **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : dès le début (niveau 1 de la mine). Ensuite, dans son panneau : le **recruteur** au **niveau 3** de la mine, le **manager** au **niveau 4**.
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). Le manager et le recruteur se tiennent devant le bâtiment, et les mineurs qui attendent leur salaire font la queue un peu plus loin devant.
- **L'ouvrir** : toucher (ou cliquer) le Personnel : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case du bâtiment, de n'importe quel côté.
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/employes.webp`) : un bureau en bois et en pierre sous un auvent bleu, avec l'enseigne « HIRING », des portraits de mineurs et des bannières. Retourné (miroir), il utilise une autre image, `employes-miroir.webp` (27/10), où l'enseigne est déjà retournée : une fois toute l'image retournée, « HIRING » se lit à l'endroit (voir [visuel-et-sons.md](../jeu/visuel-et-sons.md)).
- **Description** (en haut du panneau) : « Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **😠** (alerte rouge) quand quelqu'un n'est pas payé : « 😠 1 mineur attend son salaire ! », « 😠 *N* mineurs attendent leur salaire ! » ou, avec le manager, « 💼 Trésorerie vide : personne n'est payé ! » (`alerteSalaires`) ;
  - **🛤️ « Sans trajet »** (alerte rouge, 26/10) quand des pousseurs n'ont plus de trajet en service (on a arrêté leur trajet avec ✖ Arrêter) : « *N* pousseur(s) sans trajet : choisis-leur un trajet au Personnel » ;
  - **✨ « Nouveau : Recruteur ! »** au niveau 3 de la mine et **« Nouveau : Manager ! »** au niveau 4, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - **💰 « Une amélioration est achetable ! »** quand une embauche, une pioche de mineur, le recruteur ou le manager est payable tout de suite.
- **Les personnages au village** : les mineurs sont des **hamsters casqués**, et **la couleur du casque est celle de leur rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique : les mêmes couleurs que leurs cartes), avec leur prénom au-dessus de la tête. On les voit **seulement quand ils sont dehors** : quand ils marchent (vers la forge, vers le Personnel, vers la mine), quand ils récupèrent leur pioche devant la forge, quand ils attendent leur wagonnet au quai (les pousseurs : au bord de la voie, à côté du début des rails de leur trajet, devant le bâtiment de départ), quand ils le poussent (juste derrière lui), et quand ils attendent leur salaire devant le Personnel (bulle 😠, ils tapent du pied). Quand ils sont dans la mine, on voit seulement la **cabine de l'ascenseur** monter et descendre : depuis le 27/10, **les mineurs y sont dessinés dedans** pendant qu'ils descendent ou remontent (ils sont coupés sous le bord avant de la cabine et au bord du puits), et la **jauge du coffre** au-dessus de la mine montre « 👷 *n* » : combien travaillent au fond. Le **manager** et le **recruteur** restent devant le bâtiment, avec leur étiquette « Manager » / « Recruteur ». Dans le panneau, leurs cartes ont leur **portrait**.

## Ce qu'on peut y faire

Depuis le 27/10, le panneau est rangé en **trois onglets** (`OngletsPanneau`) et n'a plus de long paragraphe d'introduction :

- **👷 Équipe (*n*)** : les salaires sur une ligne (sans manager : le total, le temps payé, « Payer · *prix* »), puis **toute l'équipe, une ligne par employé** (27/10, pour que rien ne défile) : le bord de la couleur de sa rareté, ce qu'il fait, son nom, son rendement (ou l'arrivée de son trajet pour un pousseur), une petite barre de salaire payé, et le bouton de sa prochaine pioche (« ⬆ *prix* »). Les mineurs d'abord, puis les pousseurs. **Toucher une ligne ouvre sa fiche** (la carte complète : rareté, rendement, salaire, sac, pioche, Licencier, trajet d'un pousseur), avec **← Équipe** pour revenir. Pastille « ! » si quelqu'un n'est pas payé. Sans personne : « Personne pour l'instant » et un bouton **➕ Recruter un mineur** qui ouvre l'onglet Recruter ;
- **➕ Recruter** : **👷 Embaucher un mineur** (ou **🎲 Recruter**) et **🛤️ Embaucher un pousseur**. Pastille « + » quand on peut payer une embauche ;
- **💼 Chefs** : le **manager** (et la trésorerie) et le **recruteur**. Pastille « ! » si le manager n'a plus de trésorerie.

Le panneau s'ouvre sur l'onglet **Recruter** tant qu'on n'a personne, sinon sur **Équipe**.

**Deux métiers** (26/10) : les **mineurs** ne font que creuser et remonter leur sac dans le coffre de la mine. Les **pousseurs** ne creusent jamais : ils poussent le wagonnet d'un seul trajet. On ne passe plus de l'un à l'autre (l'ancien bouton « 🛤️ Pousser le wagonnet / ⛏️ Creuser » est retiré).

### 1. Embaucher un mineur (« 👷 Embaucher », ou « 🎲 Recruter » avec le recruteur)

- **Taille de l'équipe** (mineurs et pousseurs ensemble) : **4 employés au niveau 1 de la mine, puis 2 de plus par niveau** (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`) : 4, 6, 8, 10, puis **12** au niveau 5. Le badge affiche « *n* / max ». Équipe complète : « Ton équipe est complète. Chaque niveau de la mine te permet d'en employer 2 de plus. »
- **Le prix dépend seulement du nombre d'employés qu'on a en ce moment** (mineurs et pousseurs, `PRIX_EMBAUCHE`). Au-delà de la liste, chaque embauche coûte 60 % de plus que la précédente (`HAUSSE_APRES_LISTE`). Les prix sont arrondis à la dizaine sous 1 000 $, à la centaine au-dessus.

| Embauche | 1re | 2e | 3e | 4e | 5e | 6e | 7e | 8e | 9e | 10e | 11e | 12e |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prix | 50 $ | 150 $ | 400 $ | 1 000 $ | 2 500 $ | 6 000 $ | 14 000 $ | 30 000 $ | 60 000 $ | 120 000 $ | 192 000 $ | 307 200 $ |

- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois**, **ses 10 premières minutes de salaire comprises**, et descend tout de suite creuser. « 👷 *X* est embauché(e) ! Il descend creuser. » (avec « (rare !) », « (épique !) »… s'il n'est pas commun).
- Avec le recruteur, sa **rareté est tirée au hasard** (on ne refuse personne) et une animation la dévoile (voir plus bas).

### 2. La carte d'un employé

Une carte compacte par employé (encore raccourcie le 27/10), pour voir toute l'équipe d'un coup :

- son **prénom**, sa **rareté** (avec « ×*N* » si elle n'est pas commune), l'icône de ce qu'il fait et le temps restant (⛏️ creuse, ⏫ remonte, 📦 vide son sac, ⏬ redescend, 🛤️ au quai ou pousse, 🔨 à la forge, 🚶 marche, 😠 pas payé), et le lien **Licencier** ;
- **un mineur** : « ⛏️ *x* bloc/s · salaire *y* / 10 min » (ce que ses blocs valent par 10 minutes est dans l'info-bulle), deux petites jauges (**⏳ temps payé**, vert ou rouge « 😠 Plus payé », et **🎒 sac**) et la ligne d'amélioration de sa **pioche**, **seulement s'il reste une amélioration** (au niveau max, rien n'est montré) ;
- **un pousseur** : « 🛤️ Pousse le wagonnet **Mine → Marché** · salaire *Y* $ », une liste pour **changer son trajet** (seulement les trajets qui ont leurs rails), et la jauge **⏳ temps payé**. Pas de sac ni de pioche : il ne creuse pas.

L'infobulle donne son activité en entier, sa vitesse en creusant et le nombre de blocs qu'il a cassés.

### 3. Améliorer la pioche d'un mineur (pas des pousseurs)

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

### 4. Les pousseurs

Depuis le 26/10, un pousseur est un **métier à part** : on l'embauche **pour un seul trajet** (par exemple Mine → Marché), et il ne pousse que le wagonnet de ce trajet.

**L'embaucher** (carte « 🛤️ Embaucher un pousseur », bordée d'or, `EmbauchePousseur`) :

1. « Il pousse le wagonnet d'un seul trajet. Choisis son départ, puis son arrivée : »
2. **Départ** : un bouton par bâtiment de départ possible (⛏️ Mine, 🔥 Foreuse), si son arrivée est aussi construite. S'il n'y en a qu'un, il est déjà choisi.
3. **Arrivée** : un bouton par arrivée possible depuis ce départ (💰 Marché, 🔥 Foreuse, ⚡ Générateur). Le bouton choisi devient doré.
4. **Le trajet brille sur la carte** : ses rails s'allument en vague dorée, et ses deux bâtiments sont entourés d'un pointillé doré qui tourne. « ✨ Le trajet Mine → Marché brille sur la carte. » (et « Son wagonnet sera créé avec l'embauche. » si le trajet n'existe pas encore). Sans rails entre les deux : « Pas de rails entre ces deux bâtiments : pose-les d'abord (menu Bâtiments). » La surbrillance s'éteint quand on ferme le panneau.
5. **🛤️ Embaucher pour ce trajet** (arc-en-ciel, comme 🎲 Recruter) : **même prix qu'un mineur** (le tableau ci-dessus), ses 10 premières minutes comprises. « 🛤️ *X* est embauché(e) : il va pousser le wagonnet de la mine au marché. » Équipe complète : « Ton équipe est complète. »

- Il faut **des rails entre les deux bâtiments** (`peutEmbaucherPousseur`). Si le trajet n'existe pas encore, il est **créé avec l'embauche** (comme « Envoyer un wagonnet vers… »).
- La carte n'apparaît que si au moins un trajet a ses deux bâtiments construits.
- Avec le recruteur, sa rareté est tirée au hasard comme pour un mineur, **avec la même animation de révélation** (la carte tremble, puis se retourne : 🛤️, sa rareté, « Pousse ×*N* plus vite » et son trajet) ; le bouton devient « 🎲 Recruter pour ce trajet ». Un pousseur rare **pousse plus vite** : la moitié du bonus d'un mineur (`forcePousseur` = 1 + (rendement − 1) ÷ 2 : rare ×1,25, épique ×1,5, légendaire ×2, mythique ×3). Son salaire est aussi × la rareté. La pastille de rareté de sa carte affiche ce ×.

**Son travail** :

- Il **marche du Personnel jusqu'au bâtiment de départ** de son trajet (`maisonDe`), puis **attend au quai**, au bord de la voie, à côté du début de ses rails. Sans Personnel posé, il est tout de suite au quai.
- Dès que **son** wagonnet a quelque chose à porter et que son trajet n'est pas électrique, il le **pousse jusqu'à l'arrivée** (2,5 cases/s × sa rareté), puis le ramène et retourne au quai. Le pousseur d'un autre trajet ne bouge pas : avec plusieurs trajets à pousser, il faut **un pousseur par trajet**.
- Il est **payé** comme les autres : **30 $ toutes les 10 minutes** (le salaire d'une pioche en bois) × sa rareté. On ne peut pas le licencier pendant qu'il pousse.
- **Changer son trajet** (la liste sur sa carte, `changerTrajet`) : « 🛤️ *X* va pousser le wagonnet de la mine à la foreuse. » S'il est en train de pousser, il finit d'abord son voyage, puis marche jusqu'au quai de son nouveau trajet (« va au quai de la foreuse »). Le nouveau trajet est créé s'il n'existe pas encore.
- **Trajet arrêté** (✖ Arrêter au panneau du départ) : il attend au quai pour rien (« 🛤️ attend : son trajet est arrêté »), et la bulle **🛤️ Sans trajet** apparaît sur le Personnel : choisis-lui un autre trajet, ou licencie-le.
- Un **trajet électrique** (générateur) part tout seul : son pousseur ne sert plus à rien, il vaut mieux le licencier (ou lui donner un trajet qui n'est pas encore électrique).

### 5. Payer les salaires (« 💵 Payer 10 min », sans manager)

- Chaque mineur doit être payé **toutes les 10 minutes** (`SECONDES_PAR_PAIE = 600`).
- **Salaire de 10 minutes** = salaire de sa pioche (tableau ci-dessus) × multiplicateur de sa rareté, arrondi.
- Sans manager, **on ne paie que 10 minutes à la fois** : le bouton complète chaque mineur jusqu'à 10 minutes payées, et ne fait payer que le temps manquant (au prorata, arrondi au dollar supérieur). La carte « 💵 Salaires » indique le total pour 10 minutes et le temps qu'il reste au moins payé (« Tout le monde est payé pour encore 8 min. On paie 10 minutes à la fois (le manager, au niveau 4 de la mine, s'en chargera pour toi). »). Elle passe en rouge quand quelqu'un attend son salaire.
- Cette carte disparaît quand on a embauché le manager.

### 6. Licencier un employé (lien « Licencier » sur sa carte)

- Une fenêtre de confirmation (`Confirmation.tsx`) demande « Licencier *X* ? », rappelle sa rareté et le prix des **indemnités**. Le bouton est grisé si on n'a pas assez d'argent.
- **Indemnités = 40 % du prix de base de la dernière place de l'équipe** (`PART_INDEMNITES = 0.4`), arrondi comme les prix d'embauche.

| Employés dans l'équipe | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
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
- **La trésorerie** est une cagnotte qu'on remplit. Boutons : « +*manque* » (juste ce qu'il faut pour une paie de toute l'équipe), **« Remplir pour 1 h »** (jusqu'à 6 paies de toute l'équipe), **+10 000 $**, **« Tout mettre »** et **« Tout reprendre »** (depuis le 27/10, il n'y a plus de +1 000 $ ni de +100 000 $). Tout cela est dans l'onglet **Chefs**.
- Une jauge montre la trésorerie face au prix d'une paie de toute l'équipe (manager compris), et le panneau dit combien de temps elle tient. Badge « Au travail » ou « 😠 Pas payé ».

## Règles et comportement

- **Le travail d'un mineur**, en boucle (`travailler` dans `employes.ts`) : il **descend** dans la mine, **creuse** jusqu'à ce que son sac soit plein, **remonte**, **vide son sac dans le coffre de la mine** (2 s, `SECONDES_VIDAGE_EMPLOYE`), puis redescend. Il ne creuse pas pendant les trajets.
- **Ses trajets** : à l'**échelle**, une montée ou une descente dure **10 s** (`SECONDES_ECHELLE`) ; avec l'**ascenseur** (au panneau de la mine), de 6 s (niveau 1) à 1 s (niveau 6).
- **Ce qu'il trouve** : des blocs tirés au hasard selon le **niveau de la mine** (les mêmes chances que la mine). Il ne double jamais ses minerais.
- **Coffre plein** : il attend devant, son sac plein, sans rien faire (« 📦 attend : le coffre de la mine est plein ! »), en continuant d'être payé. Il vide dès qu'il y a de la place.
- **Le temps payé s'écoule pendant tout son travail** (trajets, attente au quai et poussée compris). Quand il n'est plus payé : s'il creusait ou descendait, il remonte ; en haut, il vide quand même son sac, puis **marche jusqu'au Personnel et attend devant**, mécontent, avec une bulle 😠 (« 😠 *X* n'est plus payé(e) : il va attendre son salaire devant le Personnel. »). Un pousseur au quai fait pareil. Sans bâtiment Personnel posé, il attend là où il est. Dès qu'on le paie, il repart à pied (**2,5 cases par seconde** depuis le 27/10, avant 4 ; `VITESSE_MARCHE`) : un mineur vers la mine, un pousseur vers le quai de son trajet. **Plusieurs mineurs payés en même temps repartent l'un après l'autre**, à 0,7 s d'écart (`ECART_DEPART`) ; ceux qui attendent encore leur tour restent à leur place devant le Personnel.
- **Un mineur n'attend jamais au quai** : s'il y en a un (une vieille partie), il redescend aussitôt creuser.
- **Le manager paie tout seul** : dès qu'il reste **moins d'une minute** payée (`SECONDES_AVANT_PAIE_MANAGER = 60`), il paie 10 minutes de plus avec la trésorerie, **d'abord lui-même**, puis les mineurs **du moins cher au plus cher** (s'il n'y a pas assez, le plus de mineurs possible continuent). **S'il n'est pas payé, il ne paie plus personne** (« 💼 Ton manager n'est plus payé : la trésorerie est vide ! Remplis-la au Personnel. »). Le travail avance par morceaux de 30 secondes, pour que le manager ait le temps de payer entre deux morceaux après une longue absence.
- **Hors ligne** : les mineurs **continuent de travailler** pendant que le jeu est fermé (rattrapage de **8 heures au plus**), tant qu'ils sont payés ; le manager continue aussi de payer avec la trésorerie. Au retour, le message « Pendant ton absence » dit combien de blocs de plus sont dans le coffre et, s'il y a lieu, « 😠 *N* mineurs attendent leur salaire ».

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Personnel » ; une fois posé, « Embauche un pousseur pour le wagonnet » et « Embauche un mineur au Personnel » font partie de l'automatisation, et **« Paie ton mineur au Personnel »** (ou « Paie tes *n* mineurs ») est une urgence, passée devant les autres. « Embaucher un mineur », « Pioche en … pour *X* », le recruteur et le manager sont aussi des achats possibles (bulle 💰, missions d'amélioration).
- **Autres bâtiments** : ils remplissent le **coffre de la mine** ; l'**ascenseur** (au panneau de la mine) raccourcit leurs trajets ; les **pousseurs** (un par trajet) font rouler les wagonnets (vers le **Marché**, la **Foreuse** ou le **Générateur**) tant que leurs trajets ne sont pas électriques ; ils passent au **Forgeron** chercher leur nouvelle pioche. Leurs pioches ne coûtent que de l'argent : le fer, la redstone et l'or restent pour la mine, les rails, la foreuse et le générateur.
- **Revenus et statistiques** : l'indicateur « $/s » compte chaque mineur **payé** qui creuse (sac plein ÷ durée d'un tour, trajets compris, × valeur moyenne d'un bloc), moins les salaires de tous les mineurs payés (pousseurs compris) et celui du manager (`revenu.ts`) ; les statistiques comptent `blocsMineurs` et `salairesPayes`.
- **Succès** : « 👷 Patron » (un premier mineur), « 👥 Chef d'équipe » (6 mineurs).
- **Bot de simulation** (`bot.ts`) : il embauche dès qu'il a le prix plus une paie d'avance, améliore les pioches, paie les salaires dès qu'il reste moins d'une minute, **embauche un pousseur pour Mine → Marché** dès qu'il a ce trajet et au moins un mineur (tant que les rails ne sont pas électriques), puis **le licencie** une fois les rails électriques (quand il a deux fois les indemnités, et pas pendant qu'il pousse).

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche des mineurs et des pousseurs `embaucherPousseur` / `peutEmbaucherPousseur`, prix, licenciement, pioches, trajet d'un pousseur `changerTrajet` et son quai `maisonDe`, salaires, travail seconde après seconde, passage à la forge, attente devant le Personnel, recruteur, manager, trésorerie, textes d'activité).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.employes` : 100 $ + 30 pierre, 5 × 5, porte à droite) et les chiffres (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`, `PRIX_EMBAUCHE`, `HAUSSE_APRES_LISTE`, `PART_INDEMNITES`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `SALAIRE_MANAGER`, `SECONDES_VIDAGE_EMPLOYE`, `SECONDES_FORGE_EMPLOYE`, `VITESSE_MARCHE`, `VITESSE_POUSSE_MINEUR`…).
- `src/jeu/mineur.ts` : les types `Employe` (rôle `mineur` ou `pousseur` ; `trajet`, le trajet d'un pousseur, `null` pour un mineur ; étapes `creuse`, `monte`, `vide`, `descend`, `quai`, `pousse`, `marche`, `forge`, `attend` ; `lieu`, `depuis`, `forgeEnAttente`) et `Manager`, l'ascenseur (`secondesTrajetMineur`).
- `src/jeu/wagonnet.ts` : le pousseur de ce trajet (et lui seul, s'il attend au quai du départ) qui part avec le wagonnet et revient au quai ; la création du trajet à l'embauche (`creerTrajet`).
- `src/jeu/sauvegarde.ts` : `convertirVersion22` (26/10) : dans une partie de la version 22, les anciens pousseurs prennent le trajet Mine → Marché.
- `src/jeu/village.ts` : le chemin à pied entre deux bâtiments (`cheminEntre`, `secondesAPied`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/temps.ts` : fait avancer les mineurs avec le reste du jeu.
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) et le message « Pendant ton absence ».
- `src/jeu/notifications.ts` : les bulles 😠, 🛤️ (sans trajet), ✨ et 💰 au-dessus du Personnel.
- `src/jeu/missions.ts`, `src/jeu/objectifs.ts` : « Construis : Personnel », achats, missions.
- `src/jeu/decouvertes.ts` : les bulles « Nouveau : Recruteur / Manager ! ».
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'ils rapportent ($/s et statistiques).
- `src/jeu/employes.test.ts` : les tests (dont l'embauche d'un pousseur pour un trajet et le changement de trajet).
- `src/composants/PanneauEmployes.tsx` : le panneau du bâtiment (salaires, manager et recruteur avec leur portrait, embauche d'un mineur, embauche d'un pousseur avec le choix du départ et de l'arrivée `EmbauchePousseur`, listes Mineurs et Pousseurs, trajet d'un pousseur, licenciement).
- `src/App.tsx` : le trajet regardé pendant l'embauche (`apercuTrajet`), passé à la carte (`trajetEnSurbrillance` de `VueVillage`).
- `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté d'une recrue.
- `src/composants/Confirmation.tsx` : la fenêtre de confirmation du licenciement.
- `src/composants/MenuConstruction.tsx` : la carte du Personnel dans le menu Bâtiments.
- `src/composants/VueVillage.tsx` : le trajet en surbrillance (`.case-trajet`, `.emprise-trajet`), les mineurs qui marchent, passent à la forge, les pousseurs qui attendent au quai de leur trajet ou poussent un wagonnet ou attendent leur salaire (😠), le manager et le recruteur devant le bâtiment, la cabine de l'ascenseur qui suit les mineurs.
- `src/composants/sprites.ts` et `public/images/personnages/sprites/` : les images des personnages tirées des planches (mineur vu devant, derrière, gauche et droite, casque recoloré à la couleur de sa rareté ; manager et recruteur vus de face).
- `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : un personnage posé sur la grille, sa place devant un bâtiment (`devant`), sa marche le long d'un chemin (`surLeChemin`, `orienter`).
- `public/images/batiments/employes.webp` : le dessin du bâtiment ; `employes-miroir.webp` : le même avec l'enseigne retournée, pour le bâtiment en miroir (fabriqué par `outils/batiments/textes_miroir.py`, choisi par `imageBatiment` dans `src/composants/iso.ts`) ; `public/images/personnages/manager.webp`, `recruteur.webp` : les portraits du panneau.
- `src/personnel.css` : les cartes, l'animation d'embauche et les portraits (`.portrait-chef`) ; `src/interface.css` : la carte d'embauche d'un pousseur (`.carte-pousseur`, `.choix-batiments`, `.choix-trajet`, `.titre-equipe`) ; `src/village.css` : les personnages du village (`.perso-village`, `.perso-colere`, `.perso-poste`) et le trajet qui brille (`.case-trajet`, `.emprise-trajet`).
