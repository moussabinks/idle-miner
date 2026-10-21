# Les bâtiments du village

Le sommaire de toute la doc est dans [../jeu/vue-d-ensemble.md](../jeu/vue-d-ensemble.md). Le village vu du ciel lui-même (la grille, la construction, les rails, les décorations, le menu Modifier, les bulles de notification, les personnages) a sa fiche : [../jeu/village.md](../jeu/village.md).

Une fiche par bâtiment : quand il se débloque, ce qu'il coûte à poser, ce qu'on y fait (avec les chiffres), ses règles et les fichiers du code concernés.
Ces fiches décrivent le code au 22/10 (la mine automatique) : **les mettre à jour quand on change un bâtiment.**

L'**arbre de prestige** et l'**enchanteur** sont retirés du jeu le 22/10 : leur code et leurs fiches sont rangés dans `archives/prestige/` (`fiche-prestige.md`) et `archives/enchanteur/` (`fiche-enchanteur.md`). Leurs dessins sont toujours dans `public/images/batiments/`.

## Où sont les bâtiments ? Là où tu les poses

Le village est une **clairière de 60 × 60 cases** vue du ciel (à 45°, comme Clash of Clans). Au début de la partie, il n'y a que la **mine**, posée au milieu (cases 25 à 34). Tous les autres bâtiments s'achètent dans le menu **🏗️ Bâtiments** (en bas à droite de l'écran) et **se posent où on veut**, sur des cases libres :

- chaque bâtiment fait **5 × 5 cases**, la mine **10 × 10** ;
- tant qu'il n'est pas débloqué, il a un **cadenas** et le niveau de mine qu'il faut (« 🔒 Mine niveau 2 ») ; une pastille **« Nouveau ! »** montre ceux qui viennent de se débloquer, et le bouton 🏗️ Bâtiments porte un badge avec leur nombre (les nouveautés pas encore vues + ce qu'on peut construire tout de suite) ;
- on le paie **une seule fois** ; les minerais se prennent dans le **sac**, puis dans le **coffre de la mine** ;
- **✏️ Modifier** permet ensuite de le **déplacer** ou de le **retourner** (miroir), gratuitement. On ne peut pas le détruire ;
- on l'**ouvre** en le touchant (ou en cliquant dessus) : le hamster du joueur marche jusqu'au côté du bâtiment le plus proche de lui, puis son panneau s'ouvre. Aux flèches du clavier, le panneau s'ouvre quand on arrive en marchant à moins de **1,3 case** du bâtiment, **de n'importe quel côté** ;
- de petites **bulles** sautent au-dessus d'un bâtiment quand il y a quelque chose à y faire (voir chaque fiche et [../jeu/village.md](../jeu/village.md)) ;
- tant qu'un bâtiment n'est pas posé, ses achats n'existent pas (pas d'objectif, pas de bulle) : la barre « 🎯 prochain objectif » propose alors « Construire : X ».

| Bâtiment | Taille | Porte (dessin non retourné) | Prix pour le poser | Déblocage | Fiche |
|---|---|---|---|---|---|
| ⛏️ Mine (bloc à cliquer, coffre, niveaux, ascenseur, wagonnet) | 10 × 10 | face avant gauche | — (posée au milieu dès le début) | dès le début | [mine.md](mine.md) |
| 💰 Marché | 5 × 5 | face avant gauche | **gratuit** | dès le début | [marche.md](marche.md) |
| ⚒️ Forgeron | 5 × 5 | face avant droite | 20 $ + 15 pierre | dès le début | [forgeron.md](forgeron.md) |
| 🎒 Bazar | 5 × 5 | face avant droite | 60 $ + 25 pierre | dès le début | [bazar.md](bazar.md) |
| 👷 Personnel | 5 × 5 | face avant droite | 100 $ + 30 pierre | dès le début (recruteur au niveau 3, manager au niveau 4) | [personnel.md](personnel.md) |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 800 $ + 60 pierre + 30 fer | niveau 2 de la mine | [foreuse.md](foreuse.md) |
| ⚡ Générateur | 5 × 5 | face avant droite | 1 200 $ + 50 fer + 20 redstone | niveau 2 de la mine | [generateur.md](generateur.md) |
| 🛤️ Rails (une case) | 1 × 1 | — | **3 fer** la case | dès le début | [../jeu/village.md](../jeu/village.md) |

Notes :

- La **porte** est l'une des deux faces tournées vers nous : « gauche » = la face qui regarde vers le bas à gauche de l'écran, « droite » = vers le bas à droite. Retourner un bâtiment (miroir) met la porte de l'autre côté. Les mineurs entrent par la case devant la porte (ou la case libre la plus proche si elle est bouchée).
- Les prix sont petits exprès : on pose le marché, le forgeron, le bazar et le Personnel dans les premières minutes (`BATIMENTS` dans `src/jeu/donnees.ts`).
- Une ligne de **rails** continue de la mine au marché permet au **wagonnet** d'emporter le coffre de la mine et de le vendre au marché. Il faut le pousser (toi, ou un mineur pousseur), ou le rendre électrique avec le **générateur** : voir [mine.md](mine.md#le-wagonnet) et [generateur.md](generateur.md).
- Les **décorations** et les **chemins de pavés** (menu 🌸 Décos) sont seulement jolis : voir [../jeu/village.md](../jeu/village.md).
