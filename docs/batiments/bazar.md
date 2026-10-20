# 🎒 Bazar

> La boutique d'équipement du village : on y agrandit son sac à dos (7 tailles, de 32 à 2 048 places) et on y achète des seaux d'eau pour éteindre la lave.

## Où et quand

- **Position** : `x = 13.5` tuiles sur le chemin du village (qui fait 27 tuiles), entre le Forgeron (10.5) et l'Enchanteur (16.5). On est « devant » le stand à 1,4 tuile près (`PORTEE_STAND`), et c'est là que son panneau s'ouvre à droite.
- **Déblocage** : ouvert dès le début (prestige 0), sans cadenas.
- **Au village** :
  - une échoppe dessinée en CSS : auvent rayé **vert** (`--auvent: #2f8f4a`) et blanc, à festons, au-dessus d'un comptoir en bois avec l'icône 🎒 ; le panneau en bois « Bazar » sous l'échoppe ;
  - le panneau passe en couleur d'accent (jaune, lueur) quand le mineur est devant (`stand-actif`), et l'échoppe s'éclaircit au survol ;
  - pastille verte **« 💰 Achetable ! »** quand le prochain sac est à la fois permis par le prestige et payable (le seau ne compte pas) ;
  - badge jaune sautillant **« ⬆ Niveaux ! »** (et la flèche « ⬆ Nouveaux niveaux : Bazar ! » si aucun autre stand n'est à montrer avant) après un prestige qui a débloqué un sac de plus : aux prestiges 2, 3, 4 et 5. Il disparaît dès qu'on passe devant le stand. Pas de badge au prestige 1 (le plafond reste à 128 places).
- Le bandeau du haut (`Hud.tsx`) montre en permanence le remplissage du sac (`n / taille`, la case clignote en rouge quand il est plein) et le nombre de seaux (`🪣 n`).

## Ce qu'on peut y faire

Tous les achats se font **à la surface, à l'arrêt** (`aLaSurface`) et se paient **seulement en argent**.

### 🎒 Sac à dos (bouton bleu « ⬆ N places »)

Une ligne d'amélioration : la taille actuelle, des petits carrés de niveaux (pleins = achetés, vides = permis, avec cadenas = bloqués par le prestige), puis le prix et le bouton du sac suivant. Chaque achat remplace le sac par le suivant (on ne saute pas de taille).

| Niveau (code) | Niveau affiché | Places | Prix | Permis à partir du prestige |
|---|---|---|---|---|
| 0 | 1 | 32 | gratuit (sac de départ) | 0 |
| 1 | 2 | 64 | 80 $ | 0 |
| 2 | 3 | 128 | 400 $ | 0 |
| 3 | 4 | 256 | 1 500 $ | 2 |
| 4 | 5 | 512 | 5 000 $ | 3 |
| 5 | 6 | 1 024 | 15 000 $ | 4 |
| 6 | 7 | 2 048 | 40 000 $ | 5 |

Coût total de 32 à 2 048 places : 61 980 $. Message à l'achat : « 🎒 Nouveau sac : N places ! ».

### 🪣 Seau d'eau (bouton bleu « 🪣 Acheter »)

- **Prix : 25 $** le seau (`PRIX_SEAU`), un par clic, **sans limite** de nombre.
- Le panneau rappelle : « Transforme une lave en obsidienne (60 $) au lieu de brûler ton sac. Tu en as N. »
- Message à l'achat : « 🪣 Seau d'eau acheté. »

## Règles et comportement

### Le sac

- La taille du sac est le nombre total d'objets qu'il peut contenir, toutes sortes confondues (`tailleSac`, `placeLibre`).
- Quand le sac est plein, ce qu'on casse va sur le **quai de l'ascenseur** s'il y a de la place ; sinon l'objet est perdu, avec le message « 🎒 Sac plein ! Remonte vendre au marché… ».
- **Plafond par prestige** (`PLAFONDS.sac` : déblocage au prestige 1, niveau 2 au déblocage, +1 par prestige, max 6) :

| Prestige | Niveau max (code) | Plus grand sac permis |
|---|---|---|
| 0 | 2 | 128 places |
| 1 | 2 | 128 places |
| 2 | 3 | 256 places |
| 3 | 4 | 512 places |
| 4 | 5 | 1 024 places |
| 5 et plus | 6 | 2 048 places |

  Au-delà, la ligne affiche « 🔒 ⬆ N places · au prestige P » (`sacBloqueAuPrestige`, `prestigePourNiveau`). Au dernier sac : « ✔ Niveau max ».
- **Au prestige** : le sac à dos est **gardé** (même taille), mais il repart **vide** (le contenu ne suit pas).

### Les seaux et la lave

- La lave apparaît sous la profondeur de référence 47 m (`mine.ts`, poids 1,5), mise à l'échelle de la mine du prestige : vers -32 m au prestige 0 (47 × 100/150), -47 m au prestige 1, -63 m au prestige 2…
- En cassant une lave **avec au moins un seau** : un seau est consommé, on gagne **1 obsidienne** (vendue 60 $ de base au marché), rangée dans le sac (ou sur le quai s'il est plein), et le compteur « laves éteintes » augmente. Message : « 🪣 Lave éteinte avec ton seau : +1 obsidienne ! »
- **Sans seau** : la lave brûle **un tiers (arrondi en dessous) de chaque pile** du sac (le quai de l'ascenseur n'est pas touché). Message : « 🔥 Aïe, de la lave ! N objets brûlés. Achète un seau d'eau. »
- Un seau rapporte donc 35 $ de plus qu'il ne coûte (60 − 25), sans compter le sac sauvé.
- **Au prestige** : les seaux sont **remis à 0**.
- La foreuse ne tire jamais de lave (`tirerBloc` « normal ») : les seaux ne servent qu'au joueur.

## Lien avec le reste du jeu

- **Conditions de prestige** (`conditionsPrestige.ts`) : « 🎒 Sac de N places » où N est le plus grand sac permis au prestige actuel (128 places aux prestiges 0 et 1, 256 au prestige 2…). Les seaux ne comptent pas.
- **Objectifs** (`objectifs.ts`) : le prochain sac fait partie des `achatsPossibles` (« Sac de N places »), ce qui allume la pastille « Achetable ! » et peut devenir le prochain objectif (« achetable au bazar ! »). Le bazar est aussi dans la liste des stands qui peuvent avoir de « Nouveaux niveaux » (plafond `sac`).
- **Succès** (`succes.ts`) : « 🪣 Pompier : éteindre de la lave avec un seau ».
- **Statistiques** : nombre de laves éteintes.
- **Autres bâtiments** : on vend le contenu du sac au **Marché** ; l'**ascenseur** (entrée de la mine) remonte le sac et recueille le trop-plein sur son quai ; les minerais du sac servent à payer le **Forgeron**, l'**Enchanteur** et la **Foreuse**. Les mineurs employés ont leur propre sac, lié à leur pioche (stand Personnel), pas au Bazar.
- **Bot de simulation** (`bot.ts`) : il garde 2 seaux d'avance et achète le sac suivant quand il a deux fois son prix.

## Fichiers du code

- `src/composants/stands.ts` : position (`x: 13.5`), nom et description du stand.
- `src/jeu/donnees.ts` : `SACS` (tailles et prix), `PRIX_SEAU`, `PLAFONDS.sac`, `niveauMaxAuPrestige`, `prestigePourNiveau`.
- `src/jeu/mineur.ts` : `acheterSac`, `prixProchainSac`, `sacBloqueAuPrestige`, `acheterSeau`, `tailleSac`, `placeLibre`, effet de la lave dans `recolter`, garde du sac au `prestige`.
- `src/jeu/mine.ts` : profondeur d'apparition de la lave.
- `src/jeu/conditionsPrestige.ts` : la condition « Sac de N places ».
- `src/jeu/objectifs.ts` : achat « Sac de N places », pastille « Achetable ! », badge « Nouveaux niveaux ».
- `src/jeu/succes.ts` : le succès « Pompier ».
- `src/composants/Panneaux.tsx` : `PanneauBazar`, le panneau du stand.
- `src/composants/Amelioration.tsx` : la ligne d'amélioration (carrés de niveaux, cadenas, bouton).
- `src/composants/VueVillage.tsx` : dessin de l'échoppe, badges, pastille et flèches.
- `src/composants/Hud.tsx` : jauge du sac et nombre de seaux dans le bandeau.
- `src/index.css`, `src/personnel.css` : couleur de l'auvent, échoppe, badges et pastille.
