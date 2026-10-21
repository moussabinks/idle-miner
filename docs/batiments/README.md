# Les bâtiments du village

Le sommaire de toute la doc est dans [../jeu/vue-d-ensemble.md](../jeu/vue-d-ensemble.md). Le village vu du ciel lui-même (la grille, la construction, les rails, les décorations, le menu Modifier, les bulles de notification, les personnages) a sa fiche : [../jeu/village.md](../jeu/village.md).

Une fiche par bâtiment : quand il se débloque, ce qu'il coûte à poser, ce qu'on y fait (avec les chiffres), ses règles et les fichiers du code concernés.
Ces fiches décrivent le code au 20/10 : **les mettre à jour quand on change un bâtiment.**

## Où sont les bâtiments ? Là où tu les poses (20/10)

Depuis le 20/10, le village n'est plus un chemin avec des stands à des places fixes : c'est une **clairière de 40 × 40 cases** vue du ciel (à 45°, comme Clash of Clans). Au début de la partie, il n'y a que la **mine**, posée au milieu (cases 15 à 24). Tous les autres bâtiments s'achètent dans le menu **🏗️ Bâtiments** (en bas de l'écran) et **se posent où on veut**, sur des cases libres :

- chaque bâtiment fait **5 × 5 cases**, la mine **10 × 10** ;
- tant qu'il n'est pas débloqué, il a un **cadenas** et le prestige qu'il faut ; une pastille **« Nouveau ! »** montre ceux qui viennent de se débloquer, et le bouton 🏗️ Bâtiments porte un badge avec leur nombre (les nouveautés pas encore vues + ce qu'on peut construire tout de suite) ;
- on le paie **une seule fois** : il reste posé à chaque prestige ;
- **✏️ Modifier** permet ensuite de le **déplacer** ou de le **retourner** (miroir), gratuitement. On ne peut pas le détruire ;
- on l'**ouvre** en le touchant (ou en cliquant dessus) : le hamster du joueur marche jusqu'à sa porte, puis son panneau s'ouvre. On peut aussi y aller avec les flèches du clavier : le panneau s'ouvre quand on arrive en marchant à moins de **1,4 case** de la porte ;
- de petites **bulles** sautent au-dessus d'un bâtiment quand il y a quelque chose à y faire (voir chaque fiche et [../jeu/village.md](../jeu/village.md)) ;
- tant qu'un bâtiment n'est pas posé, ses achats n'existent pas (pas d'objectif, pas de bulle) : la barre « 🎯 prochain objectif » propose alors « Construire : X ».

| Bâtiment | Taille | Porte (dessin non retourné) | Prix pour le poser | Déblocage | Fiche |
|---|---|---|---|---|---|
| ⛏️ Mine (échelle, ascenseur) | 10 × 10 | face avant gauche | — (posée au milieu dès le début) | prestige 0 | [mine.md](mine.md) |
| 💰 Marché | 5 × 5 | face avant gauche | **gratuit** | prestige 0 | [marche.md](marche.md) |
| ⚒️ Forgeron | 5 × 5 | face avant droite | 20 $ + 10 pierre | prestige 0 | [forgeron.md](forgeron.md) |
| 🎒 Bazar | 5 × 5 | face avant droite | 60 $ + 15 pierre | prestige 0 | [bazar.md](bazar.md) |
| 🔮 Enchanteur | 5 × 5 | face avant droite | 300 $ + 20 pierre + 5 fer | prestige 0 | [enchanteur.md](enchanteur.md) |
| 🌸 Arbre de prestige | 5 × 5 | face avant droite | 800 $ + 30 pierre + 10 fer | prestige 0 | [prestige.md](prestige.md) |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 1 500 $ + 50 pierre + 20 fer | prestige 1 | [foreuse.md](foreuse.md) |
| 👷 Personnel | 5 × 5 | face avant droite | 3 000 $ + 80 pierre + 30 fer | prestige 2 | [personnel.md](personnel.md) |
| 🛤️ Rails (une case) | 1 × 1 | — | **10 fer** la case | prestige 2 | [../jeu/village.md](../jeu/village.md) |

Notes :

- La **pierre** d'une construction se paie aussi avec de la **roche dure** (deepslate) : d'abord la pierre du sac, puis la roche dure pour le reste. Plus bas dans la mine, il n'y a plus de pierre, et on ne doit jamais être bloqué. Le menu affiche « Pierre (ou roche dure) ». Tout se paie avec le contenu du **sac**.
- La **porte** est l'une des deux faces tournées vers nous : « gauche » = la face qui regarde vers le bas à gauche de l'écran, « droite » = vers le bas à droite. Retourner un bâtiment (miroir) met la porte de l'autre côté. Les personnages entrent par la case devant la porte (ou la case libre la plus proche si elle est bouchée).
- Les prix sont petits exprès : on pose le forgeron dès les premiers mètres, l'enchanteur et l'arbre de prestige au fil de la première partie (`BATIMENTS` dans `src/jeu/donnees.ts`).
- Une ligne de **rails** continue de la mine au marché fait voyager les minerais en **wagonnet** (12 cases/s, 3 fois plus vite qu'à pied) : ceux de l'ascenseur, ceux des mineurs employés, et ceux qu'on charge soi-même depuis le panneau de la mine.
- Les **décorations** et les **chemins de pavés** (menu 🌸 Décos) sont seulement jolis : voir [../jeu/village.md](../jeu/village.md).
