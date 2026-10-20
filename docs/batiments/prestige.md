# ⭐ Arbre de prestige

> Le grand arbre magique tout à gauche du village : on y voit ce qu'il reste à faire avant le prestige, on passe prestige, et on dépense ses points de talent.

## Où et quand

- **Position** : tout à gauche du chemin, à **x = 1,5 tuiles** (identifiant `'prestige'`, nom affiché « Prestige », icône étoile). On est « devant » un stand à 1,4 tuile près. Le puits (entrée de la mine) est juste à côté, à x = 4,5.
- **Déblocage** : disponible **dès le prestige 0** (jamais de cadenas). La partie « Arbre de prestige » (bouton « Ouvrir l'arbre ») n'apparaît dans le panneau qu'à partir du **prestige 1**.
- **Dessin au village** (CSS seulement, `src/personnel.css`) : un grand arbre rose et doré (tronc, trois touffes de feuillage qui bougent doucement, 5 fruits qui scintillent, une ⭐ qui pulse au sommet) entouré d'une **aura** qui pulse en 2,6 s. Quand on **peut passer prestige** (classe `arbre-pret`), l'aura pulse beaucoup plus vite (0,9 s). Les animations sont coupées si le système demande « moins de mouvement » (`prefers-reduced-motion`).
- **Badges** au-dessus du bâtiment :
  - `⭐ Prêt !` quand toutes les conditions du prestige sont remplies ;
  - sinon `🌟 N point(s) !` s'il reste des points de talent à dépenser.
  - Ce bâtiment n'a jamais la pastille « 💰 Achetable ! » ni le badge « ⬆ Niveaux ! » (il n'a pas d'amélioration à acheter).
- **Ailleurs à l'écran** :
  - dans le bandeau (`Hud.tsx`), à partir du prestige 1, un bouton `⭐ <prestige>` (avec `· N points !` s'il en reste) ouvre l'arbre depuis n'importe où ; son infobulle rappelle les bonus (ventes +15 % × prestige, pioches +10 % × prestige) ;
  - dans la mine, une fois la bedrock atteinte, le bandeau « 🏆 Bedrock atteinte : creuse encore ici, ou passe prestige à l'arbre de prestige (village). » ;
  - la barre « prochain objectif » envoie ici (« Prestige N+1 — tout est prêt, à l'arbre de prestige ! ») quand tout est fait.

## Ce qu'on peut y faire

Devant le bâtiment, le panneau de droite affiche :

### 1. La carte du prestige (`CartePrestige.tsx`)

- Titre `⭐ Prestige N+1` et un badge `faites/total` (ou `Prêt !` en vert).
- Une **jauge** « Prêt pour le prestige : faites/total ».
- La **liste des conditions** (✔ faite / ✗ à faire), avec où on en est (« 2/3 », « -57 m »…). Voir « Règles » plus bas.
- Un texte d'aide : tant que ce n'est pas prêt, « atteins la bedrock, et améliore au maximum tout ce que ce prestige permet (les niveaux 🔒 attendront le prochain) » ; une fois prêt, ce que le prochain prestige apporte (profondeur de la nouvelle mine, bonus de vente et de vitesse, +1 point).
- Le bouton **`⭐ Passer prestige N+1`** (couleur « prestige »), grisé tant qu'une condition manque. Il ne coûte rien.

### 2. L'arbre des talents (à partir du prestige 1)

Une ligne « Arbre de prestige » : « Tu as N point(s) à dépenser ! » ou « X talent(s) débloqué(s). Le prochain prestige te donnera 1 point de plus. », et le bouton **Ouvrir l'arbre**. La fenêtre (`ArbrePrestige.tsx`) montre les 5 branches ; chaque talent est un bouton « Choisir (1 point) », « ✔ Débloqué » ou « 🔒 ». Le dernier talent choisi brille un instant (et un son « talent » est joué). Bouton du bas : « Plus tard » (s'il reste des points) ou « Fermer ».

| Branche | Rang 1 | Rang 2 | Rang 3 | Rang 4 |
|---|---|---|---|---|
| **Mineur** | Poigne de fer : pioches **+15 %** de vitesse | Œil de lynx : **+10 %** de chance de doubler un minerai (en plus de Fortune) | Pioche robuste : usure **-30 %** | Briseur de roche : **+25 %** de vitesse dans la roche dure |
| **Marchand** | Négociant : ventes **+10 %** | Grossiste : chariot de la foreuse vendu **+20 %** | Chasseur de trésors : coffres **×2** d'argent | Grand négociant : ventes encore **+15 %** |
| **Ingénieur** | Ascenseur express : ascenseur **30 % plus rapide** (toi et tes mineurs) | Foreuse turbo : forage **+50 %** | Grand chariot : chariot **×2** | Moteur autonome : recharge auto au charbon dès le 1er niveau de forage |
| **Patron** | Contremaître : mineurs **+25 %** de vitesse | Sacs d'équipe : sacs des mineurs **×2** | Salaires négociés : salaires **-25 %** | Grande équipe : **+1 mineur** employable |
| **Recrutement** | Œil du recruteur : rares et mieux **+25 %** plus souvent | Recrutement à prix cassé : embauches **-30 %** | Indemnités réduites : licencier **2× moins cher** | Main de Midas : mythiques **2× plus souvent** |

## Règles et comportement

### Les conditions du prestige (`conditionsPrestige.ts`)

On ne passe prestige qu'une fois **la bedrock atteinte ET tout amélioré au maximum de ce que le prestige actuel permet**. La liste est construite ainsi :

1. **Atteindre la bedrock** (-100 m au prestige 0, puis +50 m par prestige) : c'est `etat.victoire`.
2. **🛗 Ascenseur** au niveau plafond.
3. **🎒 Sac** à la taille plafond.
4. **✨ Efficacité, Fortune, Solidité** chacun au niveau plafond.
5. Si la foreuse est débloquée (prestige ≥ 1) : **⚙️ Foreuse activée** ; puis, quand le plafond dépasse le niveau de base, **Forage** et **🛒 Chariot** au niveau plafond.
6. Pour **chaque mineur embauché** (on n'oblige pas à embaucher toute l'équipe) : sa pioche au niveau plafond.
7. Si le recruteur est débloqué (prestige ≥ 4) : **🎩 Recruteur** au niveau plafond.

Les pioches du joueur ne comptent pas (il faut de toute façon la netherite pour atteindre la bedrock).

### Les plafonds par prestige (`PLAFONDS` dans `donnees.ts`)

Ce que le prestige actuel permet (donc ce qu'il faut atteindre pour passer au suivant) :

| Prestige actuel | Ascenseur | Sac | Enchantements (les 3) | Forage / Chariot | Pioche des mineurs | Recruteur |
|---|---|---|---|---|---|---|
| 0 | niv. 2 | 128 places | I | — | — | — |
| 1 | niv. 3 | 128 places | I | activée (niv. 1) | — | — |
| 2 | niv. 4 | 256 places | II | niv. 2 | Pierre | — |
| 3 | niv. 5 | 512 places | II | niv. 3 | Diamant | — |
| 4 | niv. 6 (max) | 1 024 places | III | niv. 4 | Netherite (max) | niv. 1 |
| 5 | 6 | 2 048 places (max) | III (Fortune et Solidité au max) | niv. 5 | Netherite | niv. 2 |
| 6 | 6 | 2 048 | Efficacité IV | niv. 6 | Netherite | niv. 3 |
| 7 | 6 | 2 048 | Efficacité IV | niv. 7 | Netherite | niv. 4 (max) |
| 8 et + | 6 | 2 048 | Efficacité V (max) | niv. 8 (max) | Netherite | niv. 4 |

(Au prestige 0, la carte affiche donc 6 conditions : bedrock, ascenseur 2, sac 128, Efficacité I, Fortune I, Solidité I.)

### Les points de talent (`talents.ts`)

- **1 point par prestige** : points disponibles = prestige − nombre de talents pris (jamais négatif).
- Dans une branche, il faut **le talent du dessus** pour prendre celui du dessous (rang 1 → 4).
- La branche **Patron** est fermée avant le **prestige 2** (« 🔒 S'ouvre avec les mineurs employés ») ; la branche **Recrutement** reste fermée tant que le **recruteur n'est pas embauché** (stand Personnel, prestige 4).
- Les talents sont **gardés pour toujours**. L'arbre a été refait le 20/10 (seulement des bonus qui durent) et tous les points ont été rendus à ce moment-là.

### Ce qui se passe quand on clique sur « Passer prestige »

1. Le jeu revérifie les conditions (`peutPasserPrestige`), arrête le minage en cours, crée la nouvelle partie (`prestige()` dans `mineur.ts`) et joue la fanfare.
2. Le mineur est replacé devant le puits, l'écran de victoire se ferme.
3. **La fête** (`FetePrestige.tsx`) : flash, rayons, grande étoile qui tourne, 90 confettis, et le résumé : « 💰 Ventes +15 % × P », « ⛏️ Pioches 10 % × P plus rapides », « 🕳️ Mine jusqu'à -… m », « 🌟 +1 point dans l'arbre de prestige ».
4. Le bouton **« 🌟 Choisir mon talent »** ouvre directement l'arbre.

### Ce qui est gardé et ce qui repart à zéro

| Gardé | Remis à zéro |
|---|---|
| Succès, talents, objets décochés au marché | Argent (0 $) et trésorerie du manager |
| Pioches débloquées (**toutes réparées**, la meilleure est équipée) | Contenu du sac, seaux d'eau |
| Taille du sac, enchantements | La mine : on repart de -2 m, dans une mine plus profonde ; `victoire` repasse à faux |
| Niveau de l'ascenseur (la cabine attend au village, quai et réglages d'envoi vidés) | Statistiques de la partie (ajoutées aux statistiques totales) |
| Foreuse : activation, niveaux de forage et de chariot, options (mais **plus de charbon, chariot vide, elle repart de la surface**) | Les stands « vus » (pour le badge « ⬆ Niveaux ! ») |
| Mineurs : pioche et rareté (mais galerie depuis la surface, sac vide), avec **au moins 10 minutes de salaire payées** | |
| Recruteur ; manager (avec au moins 10 minutes payées) | |
| Argent gagné au total (pour le classement), stands découverts | |

### Bonus de prestige (permanents, ils s'additionnent)

- Ventes : **+15 % par prestige** (`BONUS_PRESTIGE`), ajoutés aux bonus des talents Négociant / Grand négociant.
- Vitesse des pioches : **+10 % par prestige** (`BONUS_VITESSE_PRESTIGE`).
- La mine est **50 m plus profonde** à chaque prestige.

### Cas limites

- On peut rester au fond après la bedrock et continuer de creuser des galeries : le prestige n'est jamais forcé.
- Si on ferme l'arbre sans dépenser son point (« Plus tard »), le point reste ; le badge du bâtiment et le bouton ⭐ du bandeau le rappellent.
- Hors ligne, rien ne se passe ici : le prestige ne se fait que sur un clic.

## Lien avec le reste du jeu

- **Écran de victoire** (`Victoire.tsx`) : quand on atteint la bedrock, il affiche une version compacte de la carte (seulement les conditions qui manquent) et le même bouton de prestige, en rappelant que l'arbre est « le bâtiment tout à gauche du village ».
- **Objectifs** (`objectifs.ts`) : `prochainObjectif` propose d'abord les achats possibles (forgeron, puits, bazar, enchanteur, foreuse, Personnel) ; quand il n'en reste plus, « Atteindre la bedrock », puis « Prestige N+1 » vers le stand `prestige`. Après un prestige, `standsAvecNouveauxNiveaux` signale (badge « ⬆ Niveaux ! » et flèche jaune) les stands dont le plafond vient de monter : puits, bazar, enchanteur, foreuse, Personnel.
- **Autres bâtiments** : chaque condition renvoie à un stand : l'ascenseur à la **Mine** (ou dans le sac au fond), le sac au **Bazar**, les enchantements à l'**Enchanteur**, la foreuse à la **Foreuse**, les mineurs et le recruteur au **Personnel**. Le prestige 1 débloque la foreuse, le 2 les mineurs, le 4 le recruteur, le 5 le manager.
- **Succès** : « Bedrock ! » se débloque avec la même condition que la première ligne de la carte.

## Fichiers du code

- `src/composants/stands.ts` : position (x = 1,5), nom et description du bâtiment.
- `src/composants/VueVillage.tsx` : dessin de l'arbre magique et badges « ⭐ Prêt ! » / « 🌟 N points ! ».
- `src/App.tsx` : panneau du stand (carte + bouton « Ouvrir l'arbre »), enchaînement prestige → fête → arbre.
- `src/composants/CartePrestige.tsx` : la liste des conditions, la jauge et le bouton « Passer prestige ».
- `src/composants/ArbrePrestige.tsx` : la fenêtre de l'arbre des talents.
- `src/composants/FetePrestige.tsx` : l'animation de félicitations.
- `src/composants/Victoire.tsx` : écran de la bedrock, avec la carte compacte.
- `src/composants/Hud.tsx` : bouton ⭐ du bandeau qui ouvre l'arbre.
- `src/jeu/conditionsPrestige.ts` : les conditions du prestige.
- `src/jeu/talents.ts` : les 20 talents, les points, les bonus.
- `src/jeu/donnees.ts` : `PLAFONDS`, `profondeurBedrock`, `BONUS_PRESTIGE`, `BONUS_VITESSE_PRESTIGE`.
- `src/jeu/mineur.ts` : `prestige()`, `creerPartie()` et ce qui est gardé (`Heritage`).
- `src/jeu/objectifs.ts` : prochain objectif et badges « Nouveaux niveaux ».
- `src/usePartie.ts` : `passerPrestige` (vérification, nouvelle partie, son).
- `src/personnel.css` : styles et animations de l'arbre et de la carte du prestige.
