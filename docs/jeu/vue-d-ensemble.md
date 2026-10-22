# Mega Digger : vue d'ensemble du jeu

> Le point d'entrée de la documentation : le concept, la boucle de jeu, la progression niveau de mine par niveau de mine, le vocabulaire et les choix de design.
> Tout est écrit d'après le code au 22/10, après la refonte de la **mine automatique** (`src/jeu/`, version de sauvegarde `VERSION_ETAT = 23` depuis les pousseurs du 26/10 ; le 27/10, les tenues et les décorations à acheter sont retirées, et le panneau de la mine a un combo et un tableau de production). Les chiffres détaillés et les formules sont dans [equilibrage.md](equilibrage.md), et chaque bâtiment a sa fiche dans [../batiments/](../batiments/README.md).

## Sommaire de la documentation

### Le jeu (`docs/jeu/`)

| Fichier | Contenu |
|---|---|
| [vue-d-ensemble.md](vue-d-ensemble.md) | Ce fichier : concept, boucle, progression par niveau de mine, glossaire, choix de design. |
| [village.md](village.md) | Le village vu du ciel : la grille, poser et payer les bâtiments, Modifier, rails (sans boucle) et trajets de wagonnets, chemins, personnages, bulles de notification. |
| [mine-et-minage.md](mine-et-minage.md) | La mine à 5 niveaux : les blocs, le bloc à cliquer, le coffre, les pioches, la mine toute seule, le temps qui passe (et hors ligne), événements, découvertes, succès, statistiques. |
| [equilibrage.md](equilibrage.md) | Toutes les tables de données et les formules (blocs, niveaux, coffre, pioches, sacs, ascenseur, wagonnets, générateur, foreuse, mineurs, raretés, bâtiments, revenus), le bot de simulation et les durées de jeu. |
| [interface.md](interface.md) | L'écran : accueil, bandeau, carte du village, boutons, menus, panneaux, notifications, objectifs, téléphone. |
| [visuel-et-sons.md](visuel-et-sons.md) | Le style graphique (images, SVG, CSS), les animations, les bruitages et la musique (Web Audio), l'application installable. |
| [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md) | Les 5 mondes dans `localStorage`, le hors-ligne, les comptes Supabase et le classement. |
| [architecture.md](architecture.md) | L'organisation du code (`src/jeu/` pur, composants React), les tests et le déploiement. |

### Les bâtiments du village (`docs/batiments/`)

| Fichier | Bâtiment | Déblocage |
|---|---|---|
| [README.md](../batiments/README.md) | Index des bâtiments (taille, porte, prix de construction) | — |
| [mine.md](../batiments/mine.md) | ⛏️ Mine : bloc à cliquer, coffre, 5 niveaux, ascenseur des mineurs, trajets des wagonnets qui en partent, taille des wagonnets | dès le début (posée au milieu) |
| [marche.md](../batiments/marche.md) | 💰 Marché : vente des blocs, arrivée des wagonnets de la mine et de la foreuse | dès le début (gratuit) |
| [forgeron.md](../batiments/forgeron.md) | ⚒️ Forgeron : pioches, doublement, réparation | dès le début |
| [bazar.md](../batiments/bazar.md) | 🎒 Bazar : sacs à dos | dès le début |
| [personnel.md](../batiments/personnel.md) | 👷 Personnel : mineurs employés, pousseurs, salaires, recruteur, manager | dès le début (recruteur au niveau 3, manager au niveau 4) |
| [foreuse.md](../batiments/foreuse.md) | ⚙️ Foreuse : machine au charbon qui fore seule | niveau 2 de la mine |
| [generateur.md](../batiments/generateur.md) | ⚡ Générateur : redstone, rayon électrique, trajets électriques | niveau 2 de la mine |

Autres documents du dépôt : la spec de la v1 Python ([../idle_miner_v1.md](../idle_miner_v1.md), référence historique des règles), l'état du projet et le journal ([../../CONTEXTE.md](../../CONTEXTE.md)), les règles de code ([../../CLAUDE.md](../../CLAUDE.md)). Ce qui a été retiré le 22/10 (prestige, talents, enchanteur) est rangé dans `archives/` (voir `archives/README.md`).

## Le concept

**Mega Digger** (ex-Idle Miner) est un *idle game* de minage inspiré de Minecraft, jouable dans le navigateur (et installable comme application, hors ligne). On incarne un **hamster mineur** qui fait grandir sa mine et son village.

Depuis le 22/10, tout se passe **au village, vu du ciel** (vue isométrique à 45°, façon Clash of Clans) : une clairière de 60 × 60 cases, avec la mine au milieu. On y **pose ses bâtiments où on veut**, des rails et des chemins, et on s'y promène. Il n'y a plus de vue de la mine en coupe : la mine est un bâtiment comme les autres, qu'on ouvre en marchant jusqu'à elle. Voir [village.md](village.md).

- **Creuser** : devant la mine, un gros **bloc à cliquer**. Chaque clic casse un bloc (les clics rapides font un **combo**, juste pour le plaisir). Ce qui tombe va dans le **coffre de la mine**. La mine sort aussi **quelques blocs par seconde toute seule**. Le panneau de la mine montre combien de blocs sortent par seconde et d'où ils viennent.
- **Vendre** : on met le coffre dans son **sac**, et on **marche jusqu'au marché** pour le vendre, à prix fixe.
- **Améliorer** : avec l'argent (et des minerais, pris dans le sac puis dans le coffre), on agrandit le coffre, on achète de meilleures pioches (plus de chances de **doubler** un minerai), de plus grands sacs…
- **Descendre** : la mine a **5 niveaux** (pierre, charbon et fer ; puis redstone ; or ; émeraudes ; diamants). On paie pour descendre au niveau suivant : de nouveaux minerais, plus rares et plus chers, et de nouveaux bâtiments.
- **Automatiser** : on **embauche des mineurs** qui remplissent le coffre, on relie les bâtiments avec des **rails** et on choisit les **trajets des wagonnets** (le coffre vers le marché, le charbon vers la foreuse, la redstone vers le générateur, le chariot de la foreuse vers le marché), poussés par toi ou par un mineur, puis on **électrifie** les rails avec le **générateur** : les wagonnets roulent tout seuls, l'argent tombe même jeu fermé.

Il n'y a plus de fin de partie (plus de bedrock ni de prestige) : au niveau 5, on continue d'agrandir, d'embaucher et d'automatiser.

Tout tient dans le navigateur (`localStorage`, jusqu'à 5 mondes). Un compte facultatif (pseudo + mot de passe, Supabase) recopie les mondes en ligne et place le joueur dans un classement (niveau de mine et argent gagné). Voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## La boucle de jeu

```
cliquer sur le bloc ─► COFFRE de la mine ─► sac ─► marcher au marché ─► vendre ─► améliorer
        ▲                    │
   la mine sort seule        └─► rails + wagonnets (poussés, puis électriques) ─► marché ─► $
   les mineurs remontent
```

1. **Départ** : au village, devant la mine, avec **0 $**, une **pioche en pierre** offerte, un sac de 32 places et un coffre de 100 places. Rien n'est construit : le menu **🏗️ Bâtiments** propose de poser le **marché**, gratuit, où l'on veut. Les autres bâtiments sont à quelques dizaines de dollars et un peu de pierre (forgeron 20 $ + 15 pierre, bazar 60 $ + 25 pierre, Personnel 100 $ + 30 pierre).
2. **Creuser** : on touche la mine (ou le bouton ⛏️ Mine) : le hamster y marche et le panneau s'ouvre, avec le bloc à cliquer. Au niveau 1 : 70 % de pierre, 18 % de charbon, 12 % de fer. La pioche s'use d'un point par clic ; cassée, il faut 2 clics par bloc.
3. **Vendre** : quand le coffre se remplit, **🎒 Mettre dans le sac**, puis on marche jusqu'au marché et **💰 Vendre la sélection**. On garde un peu de pierre et de fer pour les constructions (une jauge à 0 au marché = objet gardé).
4. **Construire et améliorer** : forgeron (pioche en fer, 200 $ + 25 fer), bazar (sac), mine (coffre, niveau suivant), Personnel (le premier mineur coûte 50 $).
5. **Les rails** (3 fer la case, dès le début) : une ligne continue de la mine au marché (jamais en boucle). Au panneau de la mine, **« Envoyer un wagonnet vers le marché »** crée le trajet (gratuit) : le wagonnet (40 places au début) emporte le coffre au marché et revient. Il faut le **pousser** : toi (bouton au panneau de la mine, le hamster fait l'aller-retour avec lui) ou un **pousseur**, embauché au Personnel pour ce trajet (on choisit son départ et son arrivée, le trajet brille sur la carte).
6. **Niveau 2 de la mine** (400 $ + 30 fer) : la redstone arrive, avec la **foreuse** et le **générateur**. Le générateur brûle la redstone (1 redstone = 30 s) et électrifie un cercle de 15 cases autour de lui : si **tous les rails d'un trajet** sont dedans, son wagonnet roule tout seul et plus vite. C'est le revenu passif. Avec d'autres rails, la mine peut aussi envoyer son charbon à la foreuse et sa redstone au générateur, et la foreuse son chariot au marché (4 trajets en tout).
7. **Niveaux 3, 4 et 5** : or (et le recruteur, pour des mineurs rares), émeraudes (et le manager, qui paie les salaires tout seul), diamants. Chaque niveau permet 2 mineurs de plus (4 au niveau 1, 12 au niveau 5).

Pendant ce temps, la **mine toute seule**, les **mineurs employés** (tant qu'on paie leur salaire), la **foreuse** (tant qu'elle a du charbon) et les **wagonnets** (poussés par un mineur, ou électriques) continuent quand le jeu est fermé (rattrapage de **8 h au plus**). Les clics du joueur, eux, non.

## La progression, niveau de mine par niveau de mine

| Niveau | Nom | Nouveau minerai | Prix pour y descendre | La mine sort seule | Mineurs au plus | Ce qui se débloque | Le bot y arrive vers |
|---|---|---|---|---|---|---|---|
| **1** | Galerie de surface | pierre, charbon, fer | (départ) | 12 blocs/min | 4 | Marché (gratuit), Forgeron, Bazar, Personnel, rails | 0 min |
| **2** | Veine de redstone | redstone | 400 $ + 30 fer | 15 blocs/min | 6 | **Foreuse**, **Générateur** | ~12 min |
| **3** | Filon d'or | or | 2 500 $ + 60 fer + 30 redstone | 18 blocs/min | 8 | **Recruteur** (rareté des mineurs) | ~37 min |
| **4** | Grotte aux émeraudes | émeraude | 9 000 $ + 60 redstone + 30 or | 21 blocs/min | 10 | **Manager** et trésorerie | ~1 h |
| **5** | Cœur de diamant | diamant | 30 000 $ + 60 or + 25 émeraude | 24 blocs/min | 12 | le diamant (dernier niveau) | ~1 h 40 |

Les temps du bot (médiane de 10 parties, voir [equilibrage.md](equilibrage.md#le-bot-de-simulation)) donnent l'ordre de grandeur pour un joueur qui clique 2 fois par seconde : niveau 2 en 5 à 20 minutes, niveau 5 en 1 h à 2 h 30.

## Glossaire

| Terme | Sens dans le jeu |
|---|---|
| **Archives** | Le dossier `archives/` du dépôt : le code et les fiches mis de côté le 22/10 (prestige, talents, enchanteur). Ils ne sont plus compilés. |
| **Ascenseur** | Au panneau de la mine (6 niveaux) : il raccourcit les trajets des **mineurs employés** (de 10 s à l'échelle à 1 s). Sur le dessin de la mine, sa cabine suit les mineurs qui montent et descendent. Le joueur ne le prend pas. |
| **Bâtiment** | Ce qu'on pose dans la clairière (5 × 5 cases, la mine 10 × 10) : Mine, Marché, Forgeron, Bazar, Personnel, Foreuse, Générateur. Chacun se construit une fois, depuis le menu 🏗️ Bâtiments. On l'ouvre en le touchant (le hamster y marche). |
| **Bloc à cliquer** | Le gros bloc du panneau de la mine : chaque clic le casse (2 clics avec une pioche cassée) et en tire un nouveau. |
| **Carburant** | Le charbon de la foreuse (1 charbon = 20 s) ou la redstone du générateur (1 redstone = 30 s), comptés en secondes. |
| **Chariot** | Le réservoir de la foreuse : elle y met ce qu'elle fore ; on le vide au stand Foreuse (vendre ou mettre dans le sac). 6 tailles. |
| **Chemin (de pavés)** | Des pavés au sol (5 $ la case, carte du menu 🏗️ Bâtiments), seulement pour relier joliment les bâtiments. |
| **Clairière** | Le village vu du ciel : une grille de 60 × 60 cases, entourée de forêt et d'une plage, avec la mine au milieu. |
| **Coffre (de la mine)** | Là où va tout ce qui sort de la mine (clics, mine toute seule, mineurs) : 100 à 4 000 places. Plein, tout s'arrête. Ses minerais servent aussi à payer. |
| **Combo** | Les clics rapides sur le bloc de la mine (moins de 0,9 s entre deux) : « 🔥 ×*N* », un bloc qui brille et un son aux paliers. Seulement pour le plaisir, sans effet sur le jeu (27/10). |
| **Débit (de la mine)** | Les blocs que la mine sort toute seule : 0,2 à 0,4 par seconde selon le niveau. |
| **Décoration** | Fleurs, buissons, rochers, lanternes, arbres… Elles ne s'achètent plus depuis le 27/10 ; leurs dessins ornent seulement la plage et l'écran d'accueil. |
| **Découverte** | Le recruteur (niveau 3) et le manager (niveau 4) : une bulle ✨ saute au-dessus du Personnel jusqu'à ce qu'on y passe. |
| **Doublement** | La chance qu'un clic donne 2 minerais au lieu d'1 : 10 % (pioche en pierre) à 45 % (diamant). Jamais pour la pierre, ni pour la mine toute seule, les mineurs ou la foreuse. |
| **Durabilité / usure** | Chaque pioche tient un nombre de clics (150 à 1 000) ; chaque bloc cassé lui retire 1 point. À 0, elle est cassée. |
| **Échelle** | Le chemin des mineurs sans ascenseur : 10 s par montée ou descente. |
| **Électricité** | Ce que donne le générateur dans son rayon : rails électriques (les wagonnets roulent tout seuls) et foreuse boostée. |
| **Emprise** | Les cases qu'occupe un bâtiment. |
| **Employé** | Un hamster embauché au Personnel, tant qu'on paie son salaire. Deux métiers : le **mineur** creuse, remonte, vide son sac dans le coffre de la mine et redescend ; le **pousseur** (26/10) pousse le wagonnet d'un seul trajet, choisi à l'embauche. |
| **Foreuse** | Machine du niveau 2 : au charbon, elle fore seule dans son chariot, plus vite dans le rayon du générateur. Une seule foreuse, 6 niveaux de forage et de chariot. |
| **Générateur** | Bâtiment du niveau 2 : il brûle de la redstone et électrifie un cercle autour de lui (15 à 40 cases). 5 niveaux (rayon et puissance). |
| **Hamster** | Tous les personnages : le joueur, les mineurs (casque de la couleur de leur rareté), le manager, le recruteur. Ce sont des images découpées dans les planches de l'équipe (vues de devant, derrière, gauche, droite). |
| **Hors ligne** | Quand on rouvre un monde, le temps écoulé (8 h au plus) est rattrapé : mine, générateur, foreuse, mineurs, manager, wagonnets. Les clics non. |
| **Indemnités** | Ce que coûte un licenciement : 40 % du prix de la dernière place de l'équipe. |
| **Ligne (de rails)** | Une suite de rails continue (cases voisines par un côté) entre deux bâtiments (une case collée à chacun). Les rails ne font jamais de boucle : entre deux bâtiments, une seule route. Sans ligne, pas de trajet. |
| **Manager** | Débloqué au niveau 4 de la mine (15 000 $, puis 600 $ / 10 min) : il paie tous les salaires seul avec la trésorerie. |
| **Minerai** | Un bloc qu'une pioche peut doubler : charbon, fer, redstone, or, émeraude, diamant (tout sauf la pierre). |
| **Miroir** | Un bâtiment retourné gauche-droite (menu Modifier) : la porte change de côté. Ses écritures restent lisibles (le Personnel a une image à part pour ça). |
| **Modifier (✏️)** | Le mode pour déplacer (gratuit), retourner ou enlever ce qui est posé au village. |
| **Monde** | Une partie séparée (jusqu'à 5), choisie sur l'écran d'accueil. |
| **Niveau de la mine** | De 1 à 5 : il décide des blocs qui sortent, du débit, du nombre de mineurs, et débloque des bâtiments. On l'achète au panneau de la mine. Il compte pour le classement. |
| **Objets gardés** | Les objets mis à 0 au marché (ou cochés au panneau de la mine) : ils ne sont pas vendus, et le wagonnet du marché les laisse dans le coffre. Le jeu s'en souvient (`nonAVendre`). |
| **Objectif** | La barre « 🎯 prochain objectif » sous le bandeau : un bâtiment à poser, l'achat le plus proche, ou une étape de l'automatisation (rails, trajets, générateur, foreuse). |
| **Paie / salaire** | Ce que coûtent 10 minutes de travail d'un mineur (selon sa pioche et sa rareté). Sans manager, on paie au plus 10 minutes d'avance. |
| **Porte** | L'entrée d'un bâtiment, sur sa face avant gauche ou droite. Le joueur peut ouvrir un bâtiment de n'importe quel côté. |
| **Pousseur** | Un mineur employé qui attend au quai et pousse un wagonnet qui a quelque chose à porter (2,5 cases/s). |
| **Puissance** | Ce qui fait rouler les wagonnets électriques plus vite (× 1 à × 3) et booste la foreuse : elle monte avec le niveau du générateur. |
| **Puisage** | Option du générateur (dès son niveau 2) : il prend tout seul la redstone dans le coffre de la mine, en gardant 5 minutes d'avance. |
| **Quai** | Le départ d'un trajet (la mine ou la foreuse) : le wagonnet y attend. Chaque pousseur attend au début des rails de son trajet, devant le bâtiment de départ. |
| **Rails** | 3 fer la case, dès le début (menu Bâtiments) : une ligne entre deux bâtiments permet d'y créer un trajet de wagonnet. Jamais de boucle. |
| **Rareté** | Commun, rare, épique, légendaire, mythique : tirée à l'embauche quand on a le recruteur. Multiplie la vitesse et le sac du mineur (×1 à ×5) et son salaire (×1 à ×3). |
| **Rayon** | Le cercle (en cases) autour du générateur où tout est électrique. Dessiné en pointillés jaunes sur la carte. |
| **Recharge automatique** | Option de la foreuse (dès le 3e niveau de forage) : elle brûle le charbon qu'elle fore tant que sa réserve est sous 60 s. |
| **Recruteur** | Débloqué au niveau 3 de la mine (4 niveaux) : donne une rareté aux mineurs embauchés. |
| **Rendement** | Le multiplicateur de rareté d'un mineur (vitesse de creusage et taille du sac). |
| **Revenu ($/s)** | L'estimation de ce que la mine produit par seconde (mine toute seule, mineurs moins salaires, foreuse), affichée dans le bandeau (`revenu.ts`). Les clics ne comptent pas, et il faut encore vendre. |
| **Sac (à dos)** | Ce que le joueur porte du coffre (ou du chariot) jusqu'au marché : 32 à 2 048 places (7 tailles au Bazar). |
| **Stand** | L'ancien nom des bâtiments (le code l'emploie encore, par exemple `IdStand` dans `objectifs.ts`). |
| **Succès** | 21 accomplissements (`succes.ts`). |
| **Trajet** | Un wagonnet entre deux bâtiments, créé par le joueur (« Envoyer un wagonnet vers… ») : Mine → Marché, Mine → Foreuse, Mine → Générateur ou Foreuse → Marché. Un wagonnet par trajet. |
| **Trésorerie** | La cagnotte du manager, qu'on remplit au Personnel. |
| **Village** | La clairière vue du ciel, où tout se passe. Voir [village.md](village.md). |
| **Wagonnet** | Le chariot qui roule sur les rails, un par trajet : il charge au départ (40 à 600 places, la même taille pour tous), livre à l'arrivée (vend, ou apporte charbon ou redstone) et revient. Poussé par toi (3 cases/s) ou par un mineur (2,5 cases/s), ou électrique (8 à 24 cases/s). |

## Les choix de design (à respecter)

Hérités de la v1 Python ([../idle_miner_v1.md](../idle_miner_v1.md)) et des décisions de l'équipe (voir [../../CLAUDE.md](../../CLAUDE.md) et [../../CONTEXTE.md](../../CONTEXTE.md)) :

### Interdit

- ❌ **Pas de creepers** (retirés à la demande de l'auteur de la v1).
- ❌ **Pas de prix du marché variables** : chaque bloc a un prix fixe.
- ❌ **Pas de mineurs automatiques (PNJ)**, sauf les exceptions ci-dessous.
- ❌ **Pas de quêtes du marchand.**

### Les exceptions décidées

- ✅ **La foreuse** (16/10, au niveau 2 de la mine depuis le 22/10) : elle fore seule tant qu'on lui donne du charbon. **Une seule** foreuse.
- ✅ **Les mineurs employés** (19/10, dès le début depuis le 22/10, bâtiment Personnel) : ils creusent et remplissent le coffre de la mine ; on paie leur embauche, leurs pioches et un **salaire toutes les 10 minutes** (sinon ils attendent au Personnel). Un mineur peut **pousser les wagonnets**. Au niveau 3 de la mine, le **recruteur** leur donne une rareté ; au niveau 4, le **manager** paie les salaires seul avec la trésorerie.
- ✅ **La mine qui sort des blocs toute seule** et le **wagonnet électrique** (22/10 ; plusieurs trajets choisis par le joueur depuis le 24/10) : c'est le cœur de la mine automatique.

### Les principes

- ✅ **On n'est jamais bloqué** : une pioche cassée casse encore un bloc tous les 2 clics, la pioche en pierre se répare pour presque rien, les autres pioches se rachètent neuves, et les minerais se paient avec le sac **ou** le coffre.
- ✅ **De l'action à l'automatisation** : au début on clique et on marche jusqu'au marché ; puis on pousse le wagonnet ; puis des mineurs le poussent ; enfin le générateur fait rouler les wagonnets tout seuls.
- ✅ **Sauvegarde** dans `localStorage` (nouveau par rapport à la v1, indispensable sur le web), jusqu'à 5 mondes ; le jeu marche toujours sans réseau.
- ✅ **Tout en français** (interface, code, commentaires), code lisible pour débutants.
- ✅ **Visuel et sons maison** : au village, les images des bâtiments, du décor et des personnages fournies par l'équipe (webp), le reste dessiné en SVG dans le même style ; le bloc à cliquer et ses effets en CSS ; sons fabriqués avec Web Audio (aucun fichier à créditer).
- ✅ **Le village se construit librement** : on pose chaque bâtiment où l'on veut, on peut tout déplacer et retourner gratuitement.
- ✅ **Jouable au téléphone** (boutons ronds en bas, panneau qui monte du bas) et installable (PWA, hors ligne).
- Le **prestige** (avec ses talents) et l'**enchanteur** sont **retirés pour l'instant** (22/10) : leur code est dans `archives/`. Plus tard, les mineurs pourront avoir des bonus comme Fortune ou Efficacité.
