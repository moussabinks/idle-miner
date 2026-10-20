# 💰 Marché

> Le stand où l'on vend le contenu de son sac à dos contre de l'argent, au prix fixe de chaque bloc, augmenté par le prestige et les talents de la branche « Marchand ».

## Où et quand

- **Position** : x = **7,5 tuiles** sur le chemin du village (le village fait 27 tuiles, une tuile = 40 px), entre l'entrée de la mine (x = 4,5) et le forgeron (x = 10,5). On est « devant » le stand à moins de **1,4 tuile** (`PORTEE_STAND`) : c'est là que son panneau s'ouvre à droite.
- **Déblocage** : disponible **dès le prestige 0**, jamais verrouillé.
- **Dessin au village** : une échoppe en CSS (64 × 64 px) : un **auvent rayé rouge et crème** (`--auvent: #d43b3b`) bombé avec un bord en festons, au-dessus d'un comptoir en bois qui porte l'icône **💰**. Le panneau en bois « Marché » s'allume en doré quand on est devant (`.stand-actif`). Le stand s'éclaircit au survol.
- **Description** (bulle au survol) : « Vends tes blocs et minerais. »
- **Badges, flèches, pastilles** : le marché n'en a **aucun**. Il n'a pas d'amélioration à acheter, donc jamais la pastille « 💰 Achetable ! », ni le badge « ⬆ Niveaux ! » après un prestige, ni la flèche « Nouveau ! ».
- **Animations et sons d'une vente** : un « +X $ » au milieu de la vue avec une gerbe de pièces (`src/effets.css`), le compteur d'argent du bandeau qui saute et défile jusqu'à la nouvelle somme, et un « ka-ching ! » de caisse (`sons.vente`) : plus la vente est grosse, plus il y a de pièces (de 3 à 12).
- On ne peut cliquer sur le stand qu'au village. Un clic y fait marcher le mineur.

## Ce qu'on peut y faire

Le panneau affiche « Choisis combien vendre de chaque objet (garde-en pour une pioche, un enchantement, l'ascenseur…). » Si le sac est vide : « Ton sac est vide. Va creuser ! »

| Élément | Ce qu'il fait |
|---|---|
| **Une jauge par objet du sac** | Les objets sont classés **du plus cher au moins cher**. Chaque ligne montre le bloc, son nom, un curseur de 0 à la taille de la pile, le compteur « choisis / total », la valeur de la sélection en $ (bonus compris) et un bouton **Max**. Par défaut, la jauge est au maximum (toute la pile). |
| **Max** | Remet la jauge de cet objet au maximum (« toute la pile, même si elle grossit »). |
| **☑️ Tout sélectionner** | Met toutes les jauges au maximum et retire tous les objets de la liste des objets gardés. Grisé si tout est déjà sélectionné. |
| **💰 Vendre la sélection · +X $** | Vend les quantités choisies et affiche le gain. Grisé si la sélection ne vaut rien. Après la vente, les jauges reviennent à « tout » (sauf les objets gardés). |

Mettre une jauge à **0** « garde » l'objet : le jeu s'en souvient (liste `nonAVendre`), et à la visite suivante la jauge de cet objet repart à 0. Remonter la jauge au-dessus de 0 le retire de la liste.

Le marché ne coûte rien et n'a pas de niveau.

### Les prix de vente de base

Prix tirés de `BLOCS` (`src/jeu/donnees.ts`). Les profondeurs sont celles de la mine de référence de 150 m (`APPARITION_MINERAIS` et `poidsDesBlocs`, `src/jeu/mine.ts`) : c'est la vraie mine au prestige 1. Au prestige 0 (mine de 100 m), il faut les multiplier par 2/3 ; au prestige 2 (200 m), par 4/3.

| Objet | Prix | Fortune ? | Où on le trouve (mine de référence) |
|---|---:|:---:|---|
| 🟫 Terre | 1 $ | non | roche de base jusqu'à -7 m |
| 🪨 Gravier | 1 $ | non | jusqu'à -56 m |
| 🪨 Pierre | 1 $ | non | roche de base de -8 à -94 m |
| ⬛ Roche dure | 2 $ | non | roche de base sous -94 m |
| ⚫ Charbon | 5 $ | oui | dès -8 m (fréquent à -35 m) |
| 🔩 Fer | 12 $ | oui | dès -8 m (fréquent à -41 m) |
| 🔴 Redstone | 15 $ | oui | dès -21 m (fréquente à -59 m) |
| 🔷 Lapis-lazuli | 20 $ | oui | dès -35 m (fréquent à -76 m) |
| 🟡 Or | 35 $ | oui | dès -29 m (fréquent à -76 m) |
| 🔮 Améthyste | 50 $ | non | 3 à 6 par géode (géodes sous -59 m) |
| 🟪 Obsidienne | 60 $ | non | 1 par lave éteinte avec un seau (lave sous -47 m) |
| 💚 Émeraude | 80 $ | oui | dès -47 m (fréquente à -82 m) |
| 💎 Diamant | 100 $ | oui | dès -53 m (fréquent à -117 m) |
| 🟤 Débris antiques | 400 $ | non | dès -112 m (toujours rares) |

La lave, les coffres et les géodes ne vont jamais dans le sac (prix 0, `special: true`) : ils ne se vendent pas. L'argent d'un coffre arrive tout seul quand on le casse et ne passe pas par le marché.

### Le multiplicateur de vente

Le prix réel d'une vente = (somme des prix de base) × **bonus de vente**, arrondi à l'entier (`valeurDe`, `bonusVente` dans `src/jeu/mineur.ts`) :

**bonus de vente = 1 + 0,15 × prestige + talents**

| Source | Bonus | Quand |
|---|---:|---|
| Chaque niveau de prestige (`BONUS_PRESTIGE`) | +15 % (ils s'additionnent) | à chaque prestige |
| Talent **Négociant** (branche Marchand, rang 1) | +10 % | dès 1 point de talent (prestige 1) |
| Talent **Grand négociant** (branche Marchand, rang 4) | +15 % | après Négociant, Grossiste et Chasseur de trésors (4 points, donc prestige 4 au plus tôt) |

Quelques exemples :

| Situation | Bonus | 1 diamant rapporte |
|---|---:|---:|
| Prestige 0 | × 1,00 | 100 $ |
| Prestige 1 | × 1,15 | 115 $ |
| Prestige 1 + Négociant | × 1,25 | 125 $ |
| Prestige 2 + Négociant | × 1,40 | 140 $ |
| Prestige 4 + Négociant + Grand négociant | × 1,85 | 185 $ |

Le talent **Grossiste** (+20 %) ne compte **que** pour le chariot de la foreuse (vendu au stand Foreuse), pas pour le marché.

## Règles et comportement

- **Il faut être au village et immobile** (`aLaSurface` : position 0 sur l'échelle, sans bouger). Sinon la vente renvoie « ⬆️ Le marché est à la surface : remonte au village. » Dans la mine, l'onglet 🎒 Sac montre bien les prix (bonus compris), mais on ne peut pas y vendre : on envoie les objets par l'ascenseur (voir plus bas).
- **On vend ce qu'on a** : chaque quantité demandée est arrondie vers le bas et ramenée entre 0 et ce qu'il y a dans le sac. Si le total vaut 0 : « Rien à vendre pour le moment. » Sinon : « 💰 Vente : +X $ ».
- **L'arrondi** se fait une fois sur le total du lot. La valeur affichée à côté de chaque jauge est arrondie ligne par ligne, donc la somme des lignes peut différer de 1 ou 2 $ du total du bouton.
- **Statistiques** : chaque vente ajoute son gain à `stats.argentGagne` (l'argent gagné dans la partie, qui compte pour le succès et le classement).
- **Les prix ne changent jamais** au cours d'une partie (pas de prix du marché variables : choix de design hérité de la v1). Seuls le prestige et les talents les font monter.
- **Fortune** n'agit pas sur le prix : elle double parfois le **nombre** de minerais récoltés (20 % de chance par niveau, +10 % avec le talent Œil de lynx), seulement sur les blocs marqués « Fortune : oui ».
- **La lave sans seau** brûle un tiers (arrondi vers le bas) de chaque pile du sac : autant de moins à vendre.
- **Pas de plafond par prestige** : le marché n'a pas d'entrée dans `PLAFONDS`.
- **Il existe aussi** une action « Vendre tout » (`vendre`, qui vend tout sauf les objets gardés) dans la logique du jeu, mais l'interface utilise seulement « Vendre la sélection » (`vendreLot`).

### Ce qui se passe au prestige

| | |
|---|---|
| Argent | remis à **0** |
| Contenu du sac | **vidé** (nouvelle partie) |
| Liste des objets gardés (`nonAVendre`) | **gardée** |
| Bonus de vente | **+15 %** de plus (le prestige monte de 1) |
| Talents Marchand | **gardés pour toujours** |
| Argent gagné | ajouté au total de toutes les parties (`argentGagneAvant`), pour le classement |

## Lien avec le reste du jeu

- **Toutes les ventes utilisent le même calcul** (`valeurDe`, donc le même bonus de vente) :
  - le **marché** (toi) ;
  - l'**ascenseur** : les objets envoyés depuis le fond sont vendus automatiquement en arrivant au village (« 🛗 L'ascenseur a vendu son chargement : +X $ »), sans passer par le stand ;
  - les **mineurs employés** (prestige 2) : quand leur sac est plein, ils remontent et passent **4 secondes** au marché (`SECONDES_VENTE_EMPLOYE`) pour vendre leur récolte ; tout l'argent est pour toi ;
  - le **chariot de la foreuse** (prestige 1) : vendu au stand Foreuse, avec en plus +20 % si on a le talent Grossiste.
- **Garder des objets** sert aux achats des autres stands : diamants (pioche en diamant), débris antiques et or (pioche en netherite), 3 minerais pour chaque réparation au **forgeron**, lapis et émeraudes à l'**enchanteur**, fer et redstone pour l'**ascenseur** et la **foreuse**.
- **Le revenu « $/s »** du bandeau (`src/jeu/revenu.ts`) estime ce que rapporte chaque source en appliquant le même bonus de vente.
- **Objectifs** (`src/jeu/objectifs.ts`) : le marché ne propose aucun achat, donc il n'apparaît jamais dans `achatsPossibles`, `standsAchetables` ni `standsAvecNouveauxNiveaux`. Mais c'est lui qui fournit l'argent de presque tous les objectifs (« 180 / 300 $ »). Son nom dans les objectifs est « au marché ».
- **Conditions de prestige** (`src/jeu/conditionsPrestige.ts`) : aucune ne concerne le marché.
- **Succès** : « 💰 Riche » demande de gagner 5 000 $ dans une partie (`stats.argentGagne`, ventes et coffres compris).
- **Classement** : l'argent gagné au total (`argentGagneTotal`) vient surtout des ventes.
- **Arbre de prestige** : la branche **Marchand** a l'icône du marché (💰).
- Quand le sac est plein au fond : « 🎒 Sac plein ! Remonte vendre au marché (bouton Village) ou envoie l'ascenseur. »

## Fichiers du code

- `src/composants/stands.ts` : position (x = 7,5), nom, icône et description du stand.
- `src/jeu/donnees.ts` : les prix de vente (`BLOCS`) et le bonus de prestige (`BONUS_PRESTIGE` = 0,15).
- `src/jeu/mineur.ts` : les règles de vente (`valeurDe`, `bonusVente`, `vendreLot`, `vendre`, `objetsAVendre`, `reglerVente`, `nonAVendre`) et la vente à l'arrivée de l'ascenseur.
- `src/jeu/talents.ts` : les talents Négociant, Grand négociant (`bonusVenteTalents`) et Grossiste (`multiplicateurVenteChariot`).
- `src/jeu/mine.ts` : à quelle profondeur apparaît chaque bloc.
- `src/jeu/employes.ts` : la vente de la récolte des mineurs employés (`vendreRecolte`).
- `src/jeu/foreuse.ts` : la vente du chariot de la foreuse (`vendreChariot`, `valeurAuChariot`).
- `src/jeu/revenu.ts` : l'estimation du revenu par seconde.
- `src/jeu/objectifs.ts` : le nom du stand dans les objectifs (« au marché »).
- `src/composants/Panneaux.tsx` : le panneau du marché (`PanneauMarche`).
- `src/composants/Jauges.tsx` : les jauges pour choisir les quantités (aussi utilisées pour l'ascenseur).
- `src/choix.ts` : le calcul du lot choisi avec les jauges (`lotChoisi`, `quantiteVoulue`).
- `src/composants/VueVillage.tsx` : le dessin du stand au village.
- `src/composants/Icone.tsx` : l'icône 💰.
- `src/index.css` : l'échoppe, l'auvent rouge (`.stand-marche`) et le comptoir.
- `src/evenements.ts`, `src/sons.ts`, `src/effets.css` : l'événement « vente », le « ka-ching ! » et la pluie de pièces.
