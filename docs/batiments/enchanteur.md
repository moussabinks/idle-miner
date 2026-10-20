# 🔮 Enchanteur

> On y enchante ses pioches (Efficacité, Fortune, Solidité) avec de l'argent, du lapis-lazuli et des émeraudes ; les enchantements valent pour toutes les pioches et sont gardés au prestige.

## Où et quand

- **Position** : `x = 16.5` tuiles sur le chemin du village (27 tuiles de long), entre le Bazar (13.5) et la Foreuse (19.8). On est « devant » à 1,4 tuile près (`PORTEE_STAND`).
- **Déblocage** : ouvert dès le prestige 0 (niveau I des trois enchantements), sans cadenas.
- **Au village** :
  - une échoppe dessinée en CSS : auvent rayé **violet** (`--auvent: #7a4cc2`) et blanc, à festons, comptoir en bois avec l'icône 🔮, panneau en bois « Enchanteur » ;
  - le panneau passe en couleur d'accent quand le mineur est devant (`stand-actif`), l'échoppe s'éclaircit au survol ;
  - pastille verte **« 💰 Achetable ! »** quand au moins un enchantement est permis par le prestige et payable tout de suite ;
  - badge jaune sautillant **« ⬆ Niveaux ! »** (et flèche « ⬆ Nouveaux niveaux : Enchanteur ! » si rien d'autre n'est à montrer avant) après un prestige qui relève le plafond : prestiges 2, 4, 6 et 8. Il disparaît quand on passe devant.
- Le bandeau du haut (`Hud.tsx`) affiche les enchantements actuels sous la jauge de la pioche (« Efficacité II · Fortune I… » ou « Aucun enchantement »).

## Ce qu'on peut y faire

En haut du panneau : un rappel (« s'appliquent à toutes tes pioches et sont gardés au prestige ») et le nombre de 🔷 lapis et 💚 émeraudes **dans le sac**. Puis une ligne par enchantement, avec les carrés de niveaux et un bouton violet « ✨ Enchanter N ». Achat seulement à la surface, à l'arrêt. Message : « ✨ Efficacité II ! ».

**Formule de coût** du niveau n (`coutEnchantement`) : argent = `argentParNiveau × n²`, lapis = `lapisParNiveau × n`, émeraudes = `emeraudesParNiveau × n`.

### ✨ Efficacité : « +25 % de vitesse par niveau » (max V)

| Niveau | Argent | Lapis | Émeraudes | Vitesse de la pioche |
|---|---|---|---|---|
| I | 400 $ | 3 | 1 | × 1,25 |
| II | 1 600 $ | 6 | 2 | × 1,50 |
| III | 3 600 $ | 9 | 3 | × 1,75 |
| IV | 6 400 $ | 12 | 4 | × 2,00 |
| V | 10 000 $ | 15 | 5 | × 2,25 |

Total : 22 000 $, 45 lapis, 15 émeraudes.

### ✨ Fortune : « 20 % de chance par niveau de doubler un minerai » (max III)

| Niveau | Argent | Lapis | Émeraudes | Chance de doubler |
|---|---|---|---|---|
| I | 600 $ | 4 | 1 | 20 % |
| II | 2 400 $ | 8 | 2 | 40 % |
| III | 5 400 $ | 12 | 3 | 60 % |

Total : 8 400 $, 24 lapis, 6 émeraudes.

### ✨ Solidité : « La pioche s'use moins vite » (max III)

| Niveau | Argent | Lapis | Émeraudes | Chance d'user la pioche par bloc |
|---|---|---|---|---|
| (aucun) | — | — | — | 100 % |
| I | 300 $ | 3 | 1 | 50 % (1/2) |
| II | 1 200 $ | 6 | 2 | 33 % (1/3) |
| III | 2 700 $ | 9 | 3 | 25 % (1/4) |

Total : 4 200 $, 18 lapis, 6 émeraudes.

## Règles et comportement

- **Effets exacts** (`mineur.ts`) :
  - Efficacité : `vitesse = vitesse de la pioche × (1 + 0,25 × niveau) × bonus de prestige (+10 %/prestige) × talent Poigne de fer`. Sans effet quand la pioche est cassée (on mine à mains nues, vitesse 1).
  - Fortune : à chaque bloc cassé, chance `0,2 × niveau` (+0,1 avec le talent « Œil de lynx ») d'obtenir **2 objets au lieu d'1**. Seulement pour les blocs marqués `minerai` : charbon, fer, redstone, lapis, or, émeraude, diamant. Pas les débris antiques, l'améthyste, l'obsidienne ni la roche.
  - Solidité : à chaque bloc, la pioche perd 1 point de durabilité avec une chance de `1 / (niveau + 1)` (× 0,7 avec le talent « Pioche robuste »).
- Ils s'appliquent à **toutes les pioches du joueur** (pas besoin de réenchanter après un changement de pioche), mais **pas** à la foreuse ni aux mineurs employés.
- **Paiement** : l'argent, plus le lapis et les émeraudes **du sac** (pas ceux du quai de l'ascenseur ni du chariot de la foreuse). Il faut donc garder ces minerais au lieu de les vendre (on peut les décocher au Marché).
- Le lapis apparaît dès la profondeur de référence 35 m et les émeraudes dès 47 m (`mine.ts`), mises à l'échelle de la mine : vers -23 m et -31 m au prestige 0, -35 m et -47 m au prestige 1.
- **Plafond par prestige** (`PLAFONDS` : déblocage au prestige 0, niveau I au départ, un niveau de plus **tous les 2 prestiges**, les trois ensemble) :

| Prestige | Efficacité | Fortune | Solidité |
|---|---|---|---|
| 0 – 1 | I | I | I |
| 2 – 3 | II | II | II |
| 4 – 5 | III | III (max) | III (max) |
| 6 – 7 | IV | III | III |
| 8 et plus | V (max) | III | III |

  Au-delà du plafond : « 🔒 ✨ Enchanter N · au prestige P ». Au maximum : « ✔ Niveau max ».
- **Au prestige** : les niveaux d'enchantement sont **gardés**. En revanche le sac repart vide : le lapis et les émeraudes qu'on n'a pas dépensés sont perdus.

## Lien avec le reste du jeu

- **Conditions de prestige** (`conditionsPrestige.ts`) : une condition par enchantement, « ✨ Efficacité I », « ✨ Fortune I », « ✨ Solidité I »… au niveau maximum permis par le prestige actuel. Au prestige 0, il faut donc les trois au niveau I : 1 300 $, 10 lapis et 3 émeraudes en tout.
- **Objectifs** (`objectifs.ts`) : chaque prochain niveau permis est un `achatsPossibles` (« Fortune II »…) : pastille « Achetable ! », prochain objectif « achetable à l'enchanteur ! » ou « il manque N Lapis-lazuli ». L'enchanteur est dans la liste des stands à « Nouveaux niveaux ».
- **Succès** (`succes.ts`) : « ✨ Enchanteur : mettre tous les enchantements au max », obtenu quand plus aucun enchantement n'est achetable au prestige actuel (`peutEncoreEnchanter`).
- **Talents** (`talents.ts`) : « Œil de lynx » s'ajoute à Fortune, « Pioche robuste » à Solidité, « Poigne de fer » multiplie la vitesse comme Efficacité.
- **Autres bâtiments** : le **Forgeron** vend et répare les pioches (Solidité espace les réparations) ; le **Marché** vend les minerais (Fortune en donne plus ; `revenu.ts` en tient compte dans ses estimations) ; les minerais se gardent dans le sac vendu au **Bazar**.
- **Bot de simulation** (`bot.ts`) : il prend chaque enchantement dès qu'il le peut.

## Fichiers du code

- `src/composants/stands.ts` : position (`x: 16.5`), nom et description du stand.
- `src/jeu/donnees.ts` : `ENCHANTEMENTS` (coûts, niveaux max, descriptions), `LISTE_ENCHANTEMENTS`, `PLAFONDS` (efficacite, fortune, solidite), `niveauMaxAuPrestige`.
- `src/jeu/mineur.ts` : `coutEnchantement`, `enchanter`, `peutEnchanter`, `enchantementBloqueAuPrestige`, `peutEncoreEnchanter`, `chiffreRomain`, effets dans `vitesse`, `chanceDoublement`/`nbDrops`, `casserBloc` (usure) ; garde au `prestige`.
- `src/jeu/talents.ts` : les talents qui s'ajoutent aux enchantements.
- `src/jeu/mine.ts` : profondeurs d'apparition du lapis et des émeraudes.
- `src/jeu/conditionsPrestige.ts` : les conditions « ✨ Enchantement N ».
- `src/jeu/objectifs.ts` : achats, pastille « Achetable ! », badge « Nouveaux niveaux ».
- `src/jeu/succes.ts` : le succès « Enchanteur ».
- `src/jeu/revenu.ts` : prise en compte de Fortune dans le revenu estimé.
- `src/composants/Panneaux.tsx` : `PanneauEnchanter`, le panneau du stand.
- `src/composants/Amelioration.tsx` : la ligne d'amélioration (carrés, cadenas, bouton).
- `src/composants/VueVillage.tsx` : dessin de l'échoppe, badges, pastille et flèches.
- `src/composants/Hud.tsx` : la liste des enchantements dans le bandeau.
- `src/index.css`, `src/personnel.css` : couleur de l'auvent, bouton violet `bouton-enchanter`, badges et pastille.
