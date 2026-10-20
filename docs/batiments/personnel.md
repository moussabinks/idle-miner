# 👷 Personnel

> Le bureau d'embauche, débloqué au prestige 2 : on y embauche des mineurs qui creusent, remontent et vendent tout seuls pour toi, on leur paie un salaire toutes les 10 minutes, et plus tard on y trouve le recruteur (prestige 4) et le manager (prestige 5).

## Où et quand

- **Position** : au village, à **x = 22,8 tuiles**, le stand le plus à droite (juste après la Foreuse à 19,8). On est « devant » le stand à 1,4 tuile près. Son identifiant dans le code reste `employes` (pour les sauvegardes), son nom affiché est **Personnel**.
- **Déblocage** : au **prestige 2** (`PRESTIGE_EMPLOYES = 2`). Avant, l'échoppe est fermée par une barrière avec un cadenas (infobulle « Débloqué au prestige 2 ») et le panneau dit « Ce bureau d'embauche s'ouvre au prestige 2 ». Ensuite : le **recruteur** au **prestige 4**, le **manager** au **prestige 5**.
- **Le dessin au village** : une échoppe avec un auvent et un comptoir portant l'icône `employes`.
- **Les repères du village** :
  - flèche clignotante **« Nouveau : Personnel ! »** (puis « Nouveau : Recruteur ! » au prestige 4 et « Nouveau : Manager ! » au prestige 5) et badge **« Nouveau ! ⬇ »**, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - badge **« ⬆ Niveaux ! »** (et flèche jaune) après un prestige qui ouvre une meilleure pioche pour les mineurs (si on en a) ou un niveau de recruteur (s'il est embauché) ;
  - pastille **« 💰 Achetable ! »** quand une embauche ou une amélioration est payable tout de suite ;
  - quand quelqu'un n'est pas payé : badge **« 😠 Salaires ! ⬇ »** (il passe avant les autres badges) et **flèche rouge** sur le côté de l'écran, avec « 😠 1 mineur attend son salaire ! », « 😠 N mineurs attendent leur salaire ! » ou, avec le manager, « 💼 Trésorerie vide : personne n'est payé ! » ;
  - les mineurs **qui attendent leur salaire** sont dessinés devant le stand, au repos, avec une bulle 😠 (4 par rangée).
- **Dans la mine** : les mineurs ont leur galerie de 2 cases à droite du puits de la foreuse (à gauche leur ascenseur, une cabine chacun ; à droite le trou où ils creusent). Chacun a une étiquette (couleur de sa rareté) avec l'icône de ce qu'il fait (⛏️ creuse, ⏫ remonte, 💰 vend, ⏬ redescend, 😠 pas payé), son prénom et sa profondeur ou le temps restant.

## Ce qu'on peut y faire

Toutes les actions demandent d'être à la surface (au village).

### 1. Embaucher un mineur (« 👷 Embaucher », ou « 🎲 Recruter » avec le recruteur)

- **Taille de l'équipe** : **2 mineurs au prestige 2, puis 1 de plus par prestige, jusqu'à 6** (`MAX_EMPLOYES`) ; **+1** avec le talent « Grande équipe ». Le badge affiche « N / max ».
- **Le prix dépend seulement du nombre de mineurs qu'on a en ce moment** (ni du prestige, ni de ceux qu'on a licenciés). Il est arrondi à la centaine.

| Embauche | 1re | 2e | 3e | 4e | 5e | 6e | 7e |
|---|---|---|---|---|---|---|---|
| Prix | 5 000 $ | 12 000 $ | 25 000 $ | 50 000 $ | 90 000 $ | 150 000 $ | 250 000 $ |
| Avec « Recrutement à prix cassé » (−30 %) | 3 500 $ | 8 400 $ | 17 500 $ | 35 000 $ | 63 000 $ | 105 000 $ | 175 000 $ |

  (Au-delà de la liste, chaque embauche coûterait 60 % de plus que la précédente, `HAUSSE_APRES_LISTE = 1.6`.)
- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois**, **ses 10 premières minutes de salaire comprises**, et descend tout de suite creuser (à partir de -2 m).
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

- **Le travail d'un mineur**, en boucle : il **descend** dans sa galerie, **creuse** jusqu'à ce que son sac soit plein, **remonte** au village, **vend** sa récolte au marché (**4 secondes**, `SECONDES_VENTE_EMPLOYE`), puis **redescend**. **Tout l'argent de la vente est pour toi** (au prix du marché, bonus de prestige et talents de vente compris). Il ne creuse pas pendant les trajets et la vente.
- **Sa galerie** : il descend d'**1 mètre tous les 5 blocs** cassés (`BLOCS_PAR_METRE_EMPLOYE`, galerie étroite), jusqu'à la profondeur max de sa pioche. Il garde sa profondeur d'un aller-retour à l'autre. Il tire des blocs comme la foreuse (pas de lave, de coffre ni de géode).
- **Ses trajets** : chacun a sa cabine d'ascenseur, aussi rapide que **ton ascenseur** (ou comme un ascenseur de niveau 1, 0,1 s/m, si tu n'as pas encore construit le tien ; +30 % avec « Ascenseur express »). Un trajet complet dure **au moins 5 secondes** (`DUREE_MIN_TRAJET_EMPLOYE`).
- **Le temps payé s'écoule pendant tout son travail** (trajets et vente compris). Quand il n'est plus payé : s'il creusait ou descendait, il fait demi-tour et remonte ; arrivé au village, il vend ce qu'il porte s'il a quelque chose, puis va **attendre au stand Personnel** (message « 😠 X n'est plus payé(e) : il attend son salaire au stand Personnel. »). Il repart dès qu'on le paie.
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
  - **remis à zéro** : chaque mineur repart de -2 m **le sac vide** (son contenu est perdu) ; la **trésorerie repart de 0** (comme ton argent : le panneau prévient « ⚠️ Au prestige, la trésorerie repart de 0 ») ;
  - **cadeau** : chaque mineur et le manager ont **au moins 10 minutes payées** en début de prestige.

## Lien avec le reste du jeu

- **Conditions de prestige** (`conditionsPrestige.ts`) :
  - pour **chaque mineur embauché**, « 👷 X : pioche en … » au plafond du prestige (on n'oblige pas à embaucher toute l'équipe) ;
  - à partir du prestige 4, « 🎩 Recruteur au niveau N » au plafond du prestige.
  - Le manager n'est pas une condition.
- **Objectifs** (`objectifs.ts`) : « Embaucher un mineur », « Pioche en … pour X », « Embaucher le recruteur » / « Recruteur niveau N » et « Embaucher le manager » font partie des achats possibles (pastille « Achetable ! », prochain objectif « …au stand Personnel ! ») ; badge « ⬆ Niveaux ! » pour les plafonds `mineur` et `recruteur`.
- **Talents** (`talents.ts`) : la branche **Patron** s'ouvre au prestige 2 — « Contremaître » (+25 % de vitesse), « Sacs d'équipe » (sacs ×2), « Salaires négociés » (−25 %), « Grande équipe » (+1 mineur) ; la branche **Recrutement** s'ouvre une fois le recruteur embauché — « Œil du recruteur » (rares ×1,25), « Recrutement à prix cassé » (embauches −30 %), « Indemnités réduites » (÷2), « Main de Midas » (mythiques ×2).
- **Autres bâtiments** : la vitesse de **l'ascenseur** (stand Mine) raccourcit leurs trajets ; leurs ventes passent par le **Marché** (au prix du marché). Leurs pioches ne coûtent que de l'argent : le fer et la redstone restent pour l'ascenseur et la Foreuse.
- **Revenus et statistiques** : l'indicateur « $/s » compte chaque mineur payé (sac plein ÷ durée d'un aller-retour, moins son salaire) et retire le salaire du manager (`revenu.ts`) ; les statistiques comptent `argentMineurs`, `blocsMineurs` et `salairesPayes`.

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche, prix, licenciement, pioches, salaires, travail seconde après seconde, recruteur, manager, trésorerie).
- `src/jeu/donnees.ts` : les chiffres (`PRIX_EMBAUCHE`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `PLAFONDS`…).
- `src/jeu/mineur.ts` : les types `Employe` et `Manager`, et ce qui est gardé au prestige (`employeApresPrestige`).
- `src/jeu/temps.ts` : fait avancer les mineurs avec le reste du jeu.
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) et le message « Pendant ton absence ».
- `src/jeu/conditionsPrestige.ts` : les conditions « pioche des mineurs » et « recruteur » du prestige.
- `src/jeu/objectifs.ts` : pastille « Achetable ! », badge « Nouveaux niveaux », prochain objectif.
- `src/jeu/decouvertes.ts` : les flèches « Nouveau : Personnel / Recruteur / Manager ! ».
- `src/jeu/talents.ts` : les branches Patron et Recrutement.
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'ils rapportent ($/s et statistiques).
- `src/composants/PanneauEmployes.tsx` : le panneau du stand (salaires, manager, recruteur, embauche, cartes des mineurs, licenciement).
- `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté d'une recrue.
- `src/composants/Confirmation.tsx` : la fenêtre de confirmation du licenciement.
- `src/composants/VueVillage.tsx` : le stand au village, ses badges, la flèche rouge des salaires et les mineurs qui attendent.
- `src/composants/VueMonde.tsx` : la galerie des mineurs dans la mine (`GalerieMineurs`).
- `src/composants/stands.ts` : la position du stand (x = 22,8).
