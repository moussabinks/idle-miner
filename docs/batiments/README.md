# Les bâtiments du village

Le sommaire de toute la doc est dans [../jeu/vue-d-ensemble.md](../jeu/vue-d-ensemble.md). Le village vu du ciel lui-même (la grille, la construction, les rails, les chemins, le menu Modifier, les bulles de notification, les personnages) a sa fiche : [../jeu/village.md](../jeu/village.md).

Une fiche par bâtiment : quand il se débloque, ce qu'il coûte à poser, ce qu'on y fait (avec les chiffres), ses règles et les fichiers du code concernés.
Ces fiches décrivent le code au **25/10, après la grande mise à jour** : plus de sac à dos ni de **bazar** (le coffre se vend directement depuis la mine, le chariot de la foreuse sur place), le **marché** ne sert plus qu'à recevoir les wagonnets, et toutes les améliorations ont **5 niveaux** qui suivent les **paliers** de la mine (le niveau N demande la mine au niveau N ; les chefs : 3 niveaux). Mises à jour le **26/10 (la grosse mise à jour des gemmes)** : la mine et toutes les améliorations ont **7 niveaux**, et deux **ateliers** arrivent, la **fonderie** (mine niveau 5) et la **joaillerie** (mine niveau 6), avec leurs propres paliers (5 niveaux chacun). **Les mettre à jour quand on change un bâtiment.**

L'**arbre de prestige** et l'**enchanteur** sont retirés du jeu le 22/10 : leur code et leurs fiches sont rangés dans `archives/prestige/` (`fiche-prestige.md`) et `archives/enchanteur/` (`fiche-enchanteur.md`). Le **bazar** (les sacs à dos) est retiré le 25/10 : une vieille partie qui l'avait se voit rembourser ses 200 $ (voir [../jeu/sauvegarde-et-en-ligne.md](../jeu/sauvegarde-et-en-ligne.md)).

## Où sont les bâtiments ? Là où tu les poses

Le village est une **clairière de 40 × 40 cases** vue du ciel (comme Clash of Clans). Au début de la partie, il n'y a que la **mine**, posée au milieu (cases 15 à 24). Tous les autres bâtiments s'achètent dans le menu **🏗️ Bâtiments** et **se posent où on veut**, sur des cases libres :

- chaque bâtiment fait **5 × 5 cases**, la mine **10 × 10** ;
- tant qu'il n'est pas débloqué, il a un **cadenas** (« 🔒 Mine niveau 2 » : depuis le 25/10, seuls la foreuse et le générateur en ont un ; depuis le 26/10, aussi la fonderie, « 🔒 Mine niveau 5 », et la joaillerie, « 🔒 Mine niveau 6 ») ; une pastille **« Nouveau ! »** montre ceux qui viennent de se débloquer ;
- on le paie **une seule fois**, en argent et en minerais du **coffre de la mine** ;
- **✏️ Modifier** permet ensuite de le **déplacer** ou de le **retourner** (miroir), gratuitement. On ne peut pas le détruire ;
- on l'**ouvre** en le touchant : la taupe du joueur y marche, puis son panneau s'ouvre ;
- de petites **bulles** sautent au-dessus d'un bâtiment quand il y a quelque chose à y faire (un état : coffre plein, pioche cassée, plus de charbon, réserve pleine, pas de joaillier, salaires…) ;
- tant qu'un bâtiment n'est pas posé, ses achats n'existent pas : une mission propose alors « Construis : X ».

| Bâtiment | Taille | Porte (dessin non retourné) | Prix pour le poser (25/10) | Déblocage | Fiche |
|---|---|---|---|---|---|
| ⛏️ Mine (bloc à cliquer, coffre vendu d'un clic, niveaux et paliers, ascenseur, trajets des wagonnets) | 10 × 10 | face avant gauche | — (posée au milieu dès le début) | dès le début | [mine.md](mine.md) |
| 👷 Personnel (mineurs, pousseurs, joailliers, salaires, manager, recruteur) | 5 × 5 | face avant droite | 40 $ | dès le début (manager : mine niveau 3 ; recruteur : mine niveau 4 ; joailliers : avec la joaillerie) | [personnel.md](personnel.md) |
| 💰 Marché (l'arrivée des wagonnets) | 5 × 5 | face avant gauche | **gratuit** | dès le début ; sert avec les rails | [marche.md](marche.md) |
| ⚒️ Forgeron (pioches) | 5 × 5 | face avant droite | 30 $ + 15 pierre | dès le début | [forgeron.md](forgeron.md) |
| ⚙️ Foreuse | 5 × 5 | face avant gauche | 2 500 $ + 100 pierre + 50 fer | niveau 2 de la mine | [foreuse.md](foreuse.md) |
| ⚡ Générateur | 5 × 5 | face avant droite | 3 500 $ + 80 fer + 30 redstone | niveau 2 de la mine | [generateur.md](generateur.md) |
| 🏭 Fonderie (le fer et l'or en lingots, au charbon ; 26/10) | 5 × 5 | face avant gauche | 40 000 $ + 300 pierre + 200 fer + 150 charbon | niveau 5 de la mine | [fonderie.md](fonderie.md) |
| 🏪 Joaillerie (les gemmes en bijoux, par les joailliers ; 26/10) | 5 × 5 | face avant droite | 150 000 $ + 40 émeraude + 30 saphir | niveau 6 de la mine | [joaillerie.md](joaillerie.md) |
| 🛤️ Rails (une case) | 1 × 1 | — | **3 fer** la case (rendus quand on le retire) | niveau 2 du joueur | [../jeu/village.md](../jeu/village.md) |

Notes :

- La **porte** est l'une des deux faces tournées vers nous : « gauche » = la face qui regarde vers le bas à gauche de l'écran, « droite » = vers le bas à droite. Retourner un bâtiment (miroir) met la porte de l'autre côté.
- Les bâtiments sont rangés dans l'ordre du menu (`LISTE_BATIMENTS`) : Personnel d'abord (c'est l'étape du tutoriel), puis marché, forgeron, foreuse, générateur, et (26/10) fonderie et joaillerie. Poser un bâtiment rapporte 70 XP (plus 1 XP par 25 $ de son prix). Avant le 25/10 : Personnel 150 $ + 30 pierre au niveau 2 du joueur, forgeron 20 $ + 10 pierre, bazar 200 $ + 40 pierre, foreuse 3 000 $ + 120 pierre + 60 fer (niveau 5 du joueur), générateur 4 000 $ + 100 fer + 40 redstone (niveau 6).
- Les **rails** relient deux bâtiments (jamais en boucle) : 10 trajets possibles depuis le 26/10 (4 avant), un wagonnet chacun : Mine → Marché pour vendre le coffre, Mine → Foreuse pour le charbon, Mine → Générateur pour la redstone, Foreuse → Marché pour vendre le chariot ; et (26/10) Mine → Fonderie et Foreuse → Fonderie (le fer, l'or et le charbon du four), Mine → Joaillerie et Foreuse → Joaillerie (les gemmes), Fonderie → Marché et Joaillerie → Marché (les lingots, les bijoux). Il faut un **pousseur** embauché au Personnel pour chaque trajet qui roule tout seul (même électrique) ; le **générateur** les fait aller plus vite. Voir [mine.md](mine.md#les-wagonnets), [generateur.md](generateur.md) et [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets).
- Les **chemins de pavés** (5 $ la case) sont seulement jolis : voir [../jeu/village.md](../jeu/village.md).
