# Idle Miner 2.0 — Contexte projet

> Fichier de contexte pour Claude Code. À placer à la racine du projet, à côté de `idle_miner_v2.ipynb`.
> Astuce : renomme-le `CLAUDE.md` pour qu'il soit lu automatiquement, ou cite-le dans un prompt avec `@context.md`.

## 1. Le projet en bref

- **Quoi** : un idle game de minage inspiré de Minecraft. On creuse, on stocke, on vend, on achète de meilleures pioches pour descendre plus profond, jusqu'à la bedrock (-64 m).
- **Auteur** : Moussa, étudiant en MSc Data & AI for Business (Albert School). Projet perso d'entraînement au cours *Intermediary Python & Algorithmics* (POO, dataclasses, properties, lambdas).
- **Support** : un **notebook Jupyter (`.ipynb`) lancé dans VS Code**. L'auteur évite le terminal et les fichiers `.py`.
- **Interface** : boutons `ipywidgets`, plus un affichage HTML/CSS rendu dans un `widgets.HTML`. Aucune image externe : blocs, cartes et animations sont faits en CSS (gradients, keyframes).
- **Langue** : tout est en **français** (UI, messages, noms de variables, commentaires).

## 2. Lancer le jeu

1. Exécuter **une seule fois** la cellule `%pip install ipywidgets`, puis faire **Restart** du kernel.
2. Faire **Run All**. La dernière cellule appelle `Jeu().lancer()`.

## 3. Structure du notebook (14 cellules : markdown + code)

| # | Section | Contenu |
|---|---|---|
| 1 | Données | `TypeBloc` et `Pioche` (`@dataclass(frozen=True)`), dicts `BLOCS`, `PIOCHES`, `SACS`, `ENCHANTEMENTS`, `ZONES`, constantes |
| 2 | Mine et Mineur | `class Mine` (génération des couches), `class Mineur` (état du joueur et `@property`) |
| 3 | Succès | dict `SUCCES = {cle: (titre, description, lambda m: condition)}` |
| 4 | Affichage | `CSS`, `fond_bloc`, `html_bloc`, `html_mine`, `html_inventaire`, `html_ecran`, `html_toast`, `barre` |
| 5 | Jeu | `class Jeu` : boutons, callbacks, minage animé, panneaux (Pioches, Boutique, Enchanter, Succès), victoire, prestige |
| 6 | Lancement | `Jeu().lancer()` |

### Classes principales

- **`Mine`** : `LARGEUR = 6` blocs par couche. `tirer_bloc(p)` tire un bloc au hasard, pondéré selon la profondeur. `couche(p)` génère une couche paresseusement et la met en cache dans `self.couches`. `generer(p)` crée une couche neuve (pour les galeries).
- **`Mineur`** : contient tout l'état du joueur.
  - `pioches: dict {niveau: usure}` : pioches possédées, chacune avec son usure.
  - `niveau_pioche` : la pioche équipée. `meilleure` : le plus haut niveau débloqué.
  - `usure` est une `@property` avec un setter qui lit et écrit `pioches[niveau_pioche]`.
  - Autres propriétés : `pioche`, `durabilite_restante`, `cassee`, `vitesse`, `taille_sac`, `nb_dans_sac`, `sac_plein`, `en_galerie`, `bonus_vente`, `vision`.
  - `inventaire` et `enchantements` sont des `Counter`. On nettoie les zéros avec `self.inventaire = +self.inventaire`.
  - Méthodes : `user_pioche()`, `nb_drops(bloc)`, `vendre()`, `cout_reparation()`, `reparer()`, `peut_encore_enchanter()`.
- **`Jeu`** : l'interface et la boucle de jeu.
  - Attributs : `self.m` (Mineur), `self.mine` (Mine), `self.succes` (set conservé au prestige), `self.toasts` (file de notifications), `self.panneau` (`"pioches" | "boutique" | "enchant" | "succes" | None`).
  - `action(cle)` : point d'entrée de tous les boutons. Les boutons sont désactivés pendant l'action.
  - `creuser_couche()` casse les 6 blocs un par un : il redessine l'écran, fait un `time.sleep(duree)`, puis appelle `recolter(bloc)`.
  - Les panneaux sont reconstruits par `dessiner_panneau()`. Les boutons d'achat passent par `bouton(texte, fonction, actif)`, puis `achat(fonction)`.

## 4. Règles et équilibrage (valeurs actuelles)

### Pioches (vitesses de Minecraft)

| Niveau | Nom | Vitesse | Prof. max | Durabilité | Prix | Réparée avec |
|---|---|---|---|---|---|---|
| 0 | Bois | x2 | -15 m | 60 | 5 $ (offerte au départ) | planches (2 $/u) |
| 1 | Pierre | x4 | -30 m | 160 | 40 $ | pierre |
| 2 | Fer | x6 | -48 m | 250 | 300 $ | fer |
| 3 | Diamant | x8 | -60 m | 500 | 2000 $ + 3 diamants | diamant |
| 4 | Netherite | x9 | -64 m | 800 | 3000 $ + 4 débris + 4 or | débris antiques |

- **Toutes les pioches déjà débloquées peuvent être rachetées neuves**, et on peut changer de pioche équipée à tout moment (panneau 🧰 Pioches). C'est une demande explicite de l'auteur, pour ne jamais rester bloqué.
- **Pioche cassée** : on mine **à mains nues** (vitesse x1) et on **garde les blocs** récoltés.
- **Réparation** : chaque unité de matériau répare 25 % de la pioche (comme l'enclume). Le matériau manquant est acheté automatiquement à 2 fois son prix de vente.
- **Galerie** : quand la profondeur atteint le `prof_max` de la pioche équipée, on creuse à l'horizontale (une couche neuve à la même profondeur). On n'est donc jamais bloqué.

### Blocs (dureté inspirée de Minecraft)

| Bloc | Prix | Dureté | Apparaît |
|---|---|---|---|
| Terre / Gravier | 1 $ | 0.5 / 0.6 | -1 à -3 m (gravier jusqu'à -24 m) |
| Pierre | 1 $ | 1.5 | dès -4 m |
| Deepslate | 2 $ | 3 | remplace la pierre sous -40 m |
| Charbon / Fer | 5 / 12 $ | 3 | sous -15 m (poids 16 / 12) |
| Redstone / Lapis / Or | 15 / 20 / 35 $ | 3 | sous -30 m (poids 6 / 6 / 5) |
| Émeraude / Diamant | 80 / 100 $ | 3 | sous -30 m (poids 2 / 2 ; diamant 5 sous -40 m) |
| Débris antiques | 400 $ | 30 | sous -52 m (poids 2) |
| Améthyste | 50 $ | — | obtenue en cassant une géode (3 à 6) |
| Obsidienne | 60 $ | — | lave éteinte avec un seau |

- Le poids de base de la roche est de 100.
- **Durée pour casser un bloc** : `durete × (1.5 si profondeur > 40) / vitesse × VITESSE_JEU` (`VITESSE_JEU = 0.45`).

### Blocs spéciaux

- **Lave** (sous -20 m, poids 1.5) : avec un seau, elle devient de l'obsidienne. Sans seau, tu perds 1/3 de chaque pile du sac.
- **Coffre** (sous -8 m, poids 0.8) : 20 à 60 $ + profondeur × (3 à 8) $, plus 1 minerai aléatoire.
- **Géode** (sous -25 m, poids 1) : 3 à 6 améthystes.
- ❌ **Pas de creepers** : ils ont été retirés à la demande de l'auteur. Ne pas les remettre.

### Sac, boutique, enchantements, prestige

- **Sacs** : 32 places au départ, puis 64 (80 $), 128 (400 $) et 256 (1500 $).
- **Seau d'eau** : 25 $. **Torches** : 1 charbon donne 4 torches. On en a 6 au départ, et une torche est posée automatiquement tous les 5 m.
- **Vision** : 5 couches visibles si une torche est posée à 6 m ou moins au-dessus (ou si on est à -3 m ou moins), sinon 2. Les couches non visibles sont noires.
- **Enchantements** (formules exactes de Minecraft) :
  - Efficacité I à V : +25 % de vitesse par niveau. Coût par niveau n : 4n lapis + 1n émeraude.
  - Fortune I à III : `1 + max(0, randint(0, n+1) - 1)` drops, sur les minerais uniquement (hors débris et améthyste). Coût : 6n lapis + 2n émeraudes.
    - **Version web (19/10)** : jugé trop fort, remplacé par 20 % × n de chance de doubler le minerai (×2 au plus).
  - Solidité I à III : chance de 1/(n+1) d'user la pioche. Coût : 4n lapis + 1n émeraude.
- **Vente** : garde automatiquement les minerais requis pour la prochaine pioche à débloquer, ainsi que les lapis et émeraudes tant que les enchantements ne sont pas tous au max.
- **Prestige** : après la bedrock, on recommence avec +25 % sur toutes les ventes par niveau de prestige. Les succès sont conservés.
- **16 succès** dans `SUCCES`, vérifiés après chaque bloc et chaque action, avec une notification animée.

### Ambiance

- **6 zones** avec un fond de plus en plus sombre : Surface (≤3), Cavernes (≤15), Mines (≤30), Profondeurs (≤40), Deepslate (≤52), Abîmes (≤64).
- **Animations CSS** : tremblement et fissures sur le bloc en cours, `envol` pour le « +X $ », `eclat` pour les notifications, lave qui pulse, torches qui vacillent.

## 5. Conventions de code (à respecter)

- **Public débutant** : du code lisible, commenté en français, avec des noms explicites. Pas d'astuces obscures.
- Rester dans le style **POO du cours** : `@dataclass`, `@property` / setter, `Counter`, lambdas dans des dicts.
- Tout l'affichage passe par `html_ecran(...)`, dont le résultat est mis dans `self.ecran.value`. Pas de `print` pour l'UI.
- Toute nouvelle action doit passer par `Jeu.action()`, ou par un bouton de panneau via `self.bouton(...)`, puis `achat`.
- Après un changement d'état, appeler `verifier_succes()` puis `montrer_toasts()`.
- Livrer les modifications **dans le `.ipynb`** : l'auteur ne veut pas utiliser le terminal.

## 6. Tester sans Jupyter

- Le notebook peut être converti en `.py` en supprimant la ligne `%pip` et l'appel final `Jeu().lancer()`.
- Il suffit de créer des **stubs** pour `ipywidgets` (classe générique `W` avec `children`, `value`, `disabled`, `on_click`, `click`) et pour `IPython.display.display`.
- Il faut aussi remplacer `time.sleep` par une fonction qui ne fait rien.
- Un **bot** joue alors une partie complète : il débloque les pioches, achète des sacs et des seaux, enchante, répare, vend quand le sac est plein, et sinon fait « creuser x10 ».
- Repères actuels : environ 900 à 1 250 blocs et 5 à 8 minutes de jeu simulé pour atteindre la bedrock. La pioche en fer arrive vers -26/-30 m.
- Pour vérifier le visuel : écrire le HTML de `html_ecran` dans un fichier, puis en faire une capture d'écran avec Playwright.

## 7. Historique des choix de l'auteur

- ✅ Validé : enchantements, usure et réparation avec le matériau de la pioche, dangers et bonus, nouveaux blocs et Netherite, prestige, succès, boutons ipywidgets, animations de gain, ambiance selon la profondeur, réécriture en classes.
- ❌ Refusé : prix du marché variables, mineurs automatiques (PNJ), quêtes du marchand, sauvegarde JSON, **creepers**.
- 🔧 Derniers ajustements : rachat de n'importe quelle pioche débloquée et changement de pioche équipée, minage à mains nues explicite, pioche en fer moins chère (300 $), pioche en pierre à 40 $ avec 160 de durabilité, un peu plus de charbon et de fer entre -16 et -30 m.
