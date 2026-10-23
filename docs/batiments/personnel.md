# 👷 Personnel

> Le bureau d'embauche, ouvert dès le début le 22/10, et depuis le 29/10 au **niveau 2 du joueur** : on y embauche des mineurs qui creusent tout seuls et remontent leur sac dans le **coffre de la mine**, on embauche aussi des **pousseurs** (26/10), chacun pour **un trajet de wagonnet**, et on paie tout ce monde toutes les **5 minutes** (28/10). Plus tard, on y trouve le **manager** (niveau 3 de la mine et niveau 9 du joueur) et le **recruteur** (niveau 4 de la mine et niveau 11 du joueur ; inversés le 23/10), qui restent à leur poste devant le bâtiment.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **150 $ + 30 pierre** (30/10 ; 250 $ + 50 pierre le 29/10, 100 $ + 30 pierre avant ; la pierre se prend dans le sac, puis dans le coffre de la mine). Son identifiant dans le code reste `employes`, son nom affiché est **Personnel**. **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : au **niveau 2 du joueur** (29/10 ; niveau 1 de la mine ; avant, dès le début). Ensuite, dans son panneau : le **manager** au **niveau 3** de la mine **et** au niveau 9 du joueur, le **recruteur** au **niveau 4** de la mine **et** au niveau 11 du joueur. Les pioches des mineurs demandent aussi un niveau du joueur (voir plus bas, et [../jeu/niveaux.md](../jeu/niveaux.md)).
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). Le manager et le recruteur se tiennent devant le bâtiment, et les mineurs qui attendent leur salaire font la queue un peu plus loin devant.
- **L'ouvrir** : toucher (ou cliquer) le Personnel : le hamster marche jusqu'à son côté le plus proche, puis le panneau s'ouvre. Aux flèches du clavier, il s'ouvre dès qu'on passe à moins de 1 case du bâtiment, de n'importe quel côté.
- **Le dessin au village** : une image en vue isométrique (`public/images/batiments/employes.webp`) : un bureau en bois et en pierre sous un auvent bleu, avec l'enseigne « HIRING », des portraits de mineurs et des bannières. Retourné (miroir), il utilise une autre image, `employes-miroir.webp` (27/10), où l'enseigne est déjà retournée : une fois toute l'image retournée, « HIRING » se lit à l'endroit (voir [visuel-et-sons.md](../jeu/visuel-et-sons.md)).
- **Description** (en haut du panneau) : « Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **😠** (alerte rouge) quand quelqu'un n'est pas payé : « 😠 1 mineur attend son salaire ! », « 😠 *N* mineurs attendent leur salaire ! » ou, avec le manager, « 💼 Plus assez d'argent : personne n'est payé ! » (`alerteSalaires`) ;
  - **🛤️ « Sans trajet »** (alerte rouge, 26/10) quand des pousseurs n'ont plus de trajet en service (on a arrêté leur trajet avec ✖ Arrêter) : « *N* pousseur(s) sans trajet : choisis-leur un trajet au Personnel » ;
  - **✨ « Nouveau : Manager ! »** au niveau 3 de la mine et **« Nouveau : Recruteur ! »** au niveau 4, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - **💰 « Une amélioration est achetable ! »** quand une embauche, une pioche de mineur, le recruteur ou le manager est payable tout de suite ; depuis le 30/10, **seulement pendant le tutoriel** (sinon la bulle serait presque toujours là : on peut presque toujours embaucher).
- **Les personnages au village** : les mineurs sont des **hamsters casqués**, et **la couleur du casque est celle de leur rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique : les mêmes couleurs que leurs cartes), avec leur prénom au-dessus de la tête. On les voit **seulement quand ils sont dehors** : quand ils marchent (vers la forge, vers le Personnel, vers la mine), quand ils récupèrent leur pioche devant la forge, quand ils attendent leur wagonnet au quai (les pousseurs : au bord de la voie, à côté du début des rails de leur trajet, devant le bâtiment de départ), quand ils le poussent (juste derrière lui), et quand ils attendent leur salaire devant le Personnel (bulle 😠, ils tapent du pied). Quand ils sont dans la mine, on voit seulement la **cabine de l'ascenseur** monter et descendre : depuis le 27/10, **les mineurs y sont dessinés dedans** pendant qu'ils descendent ou remontent (ils sont coupés sous le bord avant de la cabine et au bord du puits), et la **jauge du coffre** au-dessus de la mine montre « 👷 *n* » : combien travaillent au fond. Le **manager** et le **recruteur** restent devant le bâtiment, avec leur étiquette « Manager » / « Recruteur ». Dans le panneau, leurs cartes ont leur **portrait**.

## Ce qu'on peut y faire

Depuis le 27/10, le panneau est rangé en **trois onglets** (`OngletsPanneau`) et n'a plus de long paragraphe d'introduction :

- **👷 Employés (*n*)** (renommé le 23/10, avant « Équipe ») : les salaires sur une ligne (sans manager : le total, le temps payé, « Payer · *prix* »), puis **la carte complète de chaque employé** (23/10 : plus de fiche à ouvrir, tout est visible directement) : **rangées par métier** (23/10) : sous le titre **⛏️ Mineurs (*n* / max)** « ils creusent au fond de la mine », puis **🛤️ Pousseurs (*n*)** « ils poussent les wagonnets, un par trajet » ; chaque carte a l'icône de son métier devant le prénom. Pastille « ! » si quelqu'un n'est pas payé. Sans personne : « Personne pour l'instant » et un bouton **➕ Recruter un mineur** qui ouvre l'onglet Recruter ;
- **➕ Recruter** : **👷 Embaucher un mineur** (ou **🎲 Recruter**) et **🛤️ Embaucher un pousseur**. Pastille « + » quand on peut payer une embauche ;
- **💼 Chefs** : sous deux titres (23/10), **💼 Manager** (ce que coûte une paie, et combien de temps il paie jeu fermé) et **🎩 Recruteur**. Pastille « ! » si le manager n'a plus assez d'argent.

Le panneau s'ouvre sur l'onglet **Recruter** tant qu'on n'a personne, sinon sur **Employés**.

**Deux métiers** (26/10) : les **mineurs** ne font que creuser et remonter leur sac dans le coffre de la mine. Les **pousseurs** ne creusent jamais : ils poussent le wagonnet d'un seul trajet. On ne passe plus de l'un à l'autre (l'ancien bouton « 🛤️ Pousser le wagonnet / ⛏️ Creuser » est retiré).

### 1. Embaucher un mineur (« 👷 Embaucher », ou « 🎲 Recruter » avec le recruteur)

- **Nombre de mineurs** (23/10) : **1 par niveau de la mine** (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`, `maxEmployes`) : 1, 2, 3, 4, puis **5** au niveau 5 (d'abord 2 puis 2 de plus par niveau). Les **pousseurs ne comptent pas** : au plus un par trajet de wagonnet (4, `maxPousseurs`). Le badge affiche « *mineurs* / max ». Complet : « Tu as tous tes mineurs. Chaque niveau de la mine te permet d'en employer 1 de plus. » (avant le 23/10 : 4 employés au niveau 1, pousseurs compris.)
- **Le prix dépend seulement du nombre d'employés de ce métier qu'on a en ce moment** : mineurs **500, 3 500, 15 000, 45 000, 130 000 $** (`PRIX_EMBAUCHE`, 23/10 : 1 mineur par niveau de la mine, chaque place vaut plus), pousseurs 500, 2 000, 6 000, 15 000 $ (`PRIX_EMBAUCHE_POUSSEUR`). Au-delà de la liste, chaque embauche coûte **2,2 fois** la précédente (`HAUSSE_APRES_LISTE`, 30/10 ; avant, 60 % de plus). Les prix sont arrondis à la dizaine sous 1 000 $, à la centaine au-dessus.

| Embauche | 1re | 2e | 3e | 4e | 5e | 6e | 7e | 8e | 9e | 10e | 11e | 12e |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prix (30/10) | 80 $ | 400 $ | 1 500 $ | 5 000 $ | 15 000 $ | 40 000 $ | 100 000 $ | 250 000 $ | 600 000 $ | 1 500 000 $ | 3 300 000 $ | 7 260 000 $ |

Le 30/10, le premier mineur est un peu moins cher, mais les prix **montent bien plus vite** d'une embauche à l'autre, pour qu'il faille farmer (29/10 : 100 $, 300 $, 800 $, 2 000 $, 5 000 $… 240 000 $, puis × 1,6 ; avant le 29/10 : 50 $, 150 $, 400 $, 1 000 $…). Chaque embauche rapporte **25 XP**, mais seulement quand l'équipe dépasse sa plus grande taille déjà atteinte : licencier puis réembaucher ne redonne rien.

- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois**, **ses 5 premières minutes de salaire comprises**, et descend tout de suite creuser. « 👷 *X* est embauché(e) ! Il descend creuser. » (avec « (rare !) », « (épique !) »… s'il n'est pas commun).
- Avec le recruteur, sa **rareté est tirée au hasard** (on ne refuse personne) et une animation la dévoile (voir plus bas).
- **Au village** (30/10), l'embauche se voit : une **gerbe d'étincelles** jaillit du Personnel avec « 👷 *X* arrive ! », puis le nouveau mineur part vers la mine avec un **halo doré** sous les pieds, des étincelles et une bulle **« ✨ Nouveau ! »** (pendant 6 s).

### 2. La carte d'un employé

Une carte par employé, directement dans l'onglet Employés (23/10 : avant, une ligne qu'il fallait toucher pour ouvrir sa fiche) :

- son **prénom**, sa **rareté** (avec « ×*N* » si elle n'est pas commune), l'icône de ce qu'il fait (⛏️ creuse, ⏬ descend, ⏫ remonte, 🛤️ au quai ou pousse, 🔨 attend sa pioche, 🚶 marche, 😠 pas payé), et le lien **Licencier** ;
- **un mineur** : « ⛏️ **0,5 bloc/s** · salaire *y* / 5 min · rapporte ≈ *z* / 5 min », ce qu'il fait en ce moment (« creuse au fond de la mine · *n* blocs cassés », « 🎒 sac plein : attend la caisse de l'ascenseur »…), deux petites jauges (**⏳ temps payé**, vert ou rouge « 😠 Plus payé », et **🎒 sac**) et **sa prochaine pioche**, seulement s'il en reste une : en grand, **« 0,5 ➜ 0,6 bloc/s »** (ce qu'il creuse avant et après, sans pourcentage), puis « ⛏️ Pioche en Bois » et le bouton « ⬆ Pioche en Pierre » avec son prix ;
- **un pousseur** : « 🛤️ Pousse le wagonnet **Mine → Marché** · salaire *Y* $ », une liste pour **changer son trajet** (seulement les trajets qui ont leurs rails), ce qu'il fait, et la jauge **⏳ temps payé**. Pas de sac ni de pioche : il ne creuse pas.

### 3. Améliorer la pioche d'un mineur (pas des pousseurs)

Chaque amélioration donne une meilleure pioche : il creuse plus vite, et son sac (le tas où il pose ses blocs au fond, en attendant la caisse de l'ascenseur) est plus grand. Payé **en argent seulement** (`NIVEAUX_EMPLOYE`). Ces pioches ne s'usent pas.

| Niveau | Pioche | Creuse (23/10) | Sac | Coût | Niveau du joueur | Salaire / 5 min (23/10, bis) |
|---|---|---:|---:|---:|---:|---:|
| 1 | Bois | 0,5 bloc/s | 10 | (de base) | — | 220 $ |
| 2 | Pierre | 0,6 bloc/s | 15 | 500 $ | 4 | 450 $ |
| 3 | Fer | 0,75 bloc/s | 20 | 3 000 $ | 6 | 850 $ |
| 4 | Or | 0,95 bloc/s | 30 | 15 000 $ | 9 | 1 400 $ |
| 5 | Diamant | 1,2 bloc/s | 45 | 60 000 $ | 12 | 2 200 $ |

Le 23/10, le premier mineur creuse **0,5 bloc/s** (avant 0,22) et ne remonte plus : il creuse sans s'arrêter, c'est l'ascenseur qui fait les allers-retours. Pour garder le même rythme de partie (niveau 5 de la mine en 7 h 48 pour le bot, médiane), les pioches suivantes montent moins (0,6 à 1,2 au lieu de 0,32 à 1) et les salaires suivent à peu près la pioche (220 à 2 200 $ depuis le 23/10 bis, un peu plus chers ; d'abord 150 à 1 600 $ ; le 30/10, 90 à 2 400 $) : une meilleure pioche rapporte toujours plus qu'elle ne coûte en salaire. Ce qu'il sort vraiment dépend aussi de l'ascenseur (voir [mine.md](mine.md#lascenseur-et-léchelle)). Sans le niveau du joueur, la carte affiche « 🔒 … ⭐ *N* requis » à la place du bouton. Chaque pioche achetée rapporte 30 XP.

- **Sa pioche lui descend par l'ascenseur** (27/10) : si un forgeron est posé, l'amélioration est payée tout de suite et compte tout de suite ; le mineur attend **3 secondes** au fond (`SECONDES_FORGE_EMPLOYE`) que le forgeron la fasse (« ⛏️ Le forgeron fait une pioche en … pour *X* : elle lui descendra par l'ascenseur. »). Il ne remonte plus au village pour ça : **un mineur ne remonte que s'il n'est plus payé** (il va alors attendre devant le Personnel). Sans forgeron, il l'a directement. Une pioche ne s'achète pas pour un pousseur (il ne creuse pas).

### 4. Les pousseurs

Depuis le 26/10, un pousseur est un **métier à part** : on l'embauche **pour un seul trajet** (par exemple Mine → Marché), et il ne pousse que le wagonnet de ce trajet.

**L'embaucher** (carte « 🛤️ Embaucher un pousseur », bordée d'or, `EmbauchePousseur`) :

1. « Il pousse le wagonnet d'un seul trajet. Coche son trajet : »
2. **La liste des trajets** (28/10, à la place des boutons Départ puis Arrivée) : une ligne à cocher (bouton rond) par trajet dont les deux bâtiments sont construits, par exemple « ⛏️ Mine → 💰 Marché », avec son état à droite : **Libre** (vert), **✔ *Nom*** (23/10 : il a déjà son pousseur, la ligne est pâlie et ne se coche pas : **un seul pousseur par trajet**), ou **Pas de rails** (rouge, la ligne est pâlie). La ligne cochée devient dorée. Si un seul trajet libre a des rails, il est déjà coché.
3. **Le trajet brille sur la carte** : ses rails s'allument en vague dorée, et ses deux bâtiments sont entourés d'un pointillé doré qui tourne. « ✨ Le trajet Mine → Marché brille sur la carte. » (et « Son wagonnet sera créé avec l'embauche. » si le trajet n'existe pas encore). Sans rails entre les deux : « Pas de rails entre ces deux bâtiments : pose-les d'abord (menu Bâtiments). » La surbrillance s'éteint quand on ferme le panneau.
4. **🛤️ Embaucher pour ce trajet** (arc-en-ciel, comme 🎲 Recruter) : **même prix qu'un mineur** (le tableau ci-dessus), ses 5 premières minutes comprises. « 🛤️ *X* est embauché(e) : il va pousser le wagonnet de la mine au marché. » Tous les trajets ont leur pousseur : « Chaque trajet a déjà son pousseur (un seul par trajet). Améliore-les dans l’onglet Employés : leur wagonnet portera plus, et ils iront plus vite. »

- Il faut **des rails entre les deux bâtiments** et **un trajet sans pousseur** (`peutEmbaucherPousseur`, `trajetPris`). Si le trajet n'existe pas encore, il est **créé avec l'embauche** (comme « Envoyer un wagonnet vers… »).
- La carte n'apparaît que si au moins un trajet a ses deux bâtiments construits.
- Avec le recruteur, sa rareté est tirée au hasard comme pour un mineur, **avec la même animation de révélation** (la carte tremble, puis se retourne : 🛤️, sa rareté, « Pousse ×*N* plus vite » et son trajet) ; le bouton devient « 🎲 Recruter pour ce trajet ». Un pousseur rare **pousse plus vite** : la moitié du bonus d'un mineur (`forcePousseur` = 1 + (rendement − 1) ÷ 2 : rare ×1,25, épique ×1,5, légendaire ×2, mythique ×3). Son salaire est aussi × la rareté. La pastille de rareté de sa carte affiche ce ×.

**Son travail** :

- Il **marche du Personnel jusqu'au bâtiment de départ** de son trajet (`maisonDe`), puis **attend au quai**, au bord de la voie, à côté du début de ses rails. Sans Personnel posé, il est tout de suite au quai.
- Dès que **son** wagonnet a quelque chose à porter et que son trajet n'est pas électrique, il le **pousse jusqu'à l'arrivée** (2,5 cases/s × sa rareté), puis le ramène et retourne au quai. Le pousseur d'un autre trajet ne bouge pas : avec plusieurs trajets à pousser, il faut **un pousseur par trajet**.
- Il est **payé** toutes les 5 minutes selon son niveau (`SALAIRES_POUSSEUR`, 23/10) : 220, 300, 420, 600, 850 $ × sa rareté. On ne peut pas le licencier pendant qu'il pousse.
- **Changer son trajet** (la liste sur sa carte, `changerTrajet` ; un trajet qui a déjà son pousseur est grisé, « (déjà un pousseur) ») : « 🛤️ *X* va pousser le wagonnet de la mine à la foreuse. » S'il est en train de pousser, il finit d'abord son voyage, puis marche jusqu'au quai de son nouveau trajet (« va au quai de la foreuse »). Le nouveau trajet est créé s'il n'existe pas encore.
- **Trajet arrêté** (✖ Arrêter au panneau du départ) : il attend au quai pour rien (« 🛤️ attend : son trajet est arrêté »), et la bulle **🛤️ Sans trajet** apparaît sur le Personnel : choisis-lui un autre trajet, ou licencie-le.
- **Un pousseur par trajet automatique** (27/10) : sans pousseur payé, un wagonnet ne part pas tout seul, même sur des rails électriques (le joueur peut toujours le pousser lui-même). Sur un trajet électrique, le pousseur reste au quai et lance le wagonnet, qui roule seul et bien plus vite. Une bulle « Pousseur ? » sur le Personnel signale un trajet sans pousseur.

**L'améliorer** (23/10, sur sa carte dans l'onglet Employés, `NIVEAUX_POUSSEUR`) : son wagonnet **porte plus** (× la taille des wagonnets) et ses **arrêts** (charger au départ, décharger ou vendre à l'arrivée, `secondesArret`) sont plus courts. En grand : « 40 ➜ 50 places · ⏱ 2 s ➜ 1,6 s », puis « 🛤️ Pousseur débutant » et le bouton.

| Niveau | Nom | Places du wagonnet | Arrêts | Prix | Niveau du joueur | Salaire / 5 min |
|---|---|---:|---:|---:|---:|---:|
| 1 | Débutant | × 1 | 2 s | (de base) | — | 220 $ |
| 2 | Costaud | × 1,25 | 1,6 s | 1 000 $ | 5 | 300 $ |
| 3 | Robuste | × 1,5 | 1,2 s | 5 000 $ | 8 | 420 $ |
| 4 | Expert | × 2 | 0,8 s | 20 000 $ | 11 | 600 $ |
| 5 | Champion | × 2,5 | 0,5 s | 60 000 $ | 14 | 850 $ |

Le bonus compte pour le wagonnet de **son trajet** (`capaciteTrajet`), même électrique ou quand tu le pousses toi-même. Chaque niveau rapporte de l'XP (comme une pioche).

### 5. Payer les salaires (« 💵 Payer », sans manager)

- Chaque mineur doit être payé **toutes les 5 minutes** (`SECONDES_PAR_PAIE = 300`, depuis le 28/10 ; avant, 10 minutes).
- **Salaire de 5 minutes** = salaire de sa pioche (tableau ci-dessus) × multiplicateur de sa rareté, arrondi.
- (23/10) Le temps payé s'affiche **arrondi à la minute au-dessus** : juste après la paie, « payés 5 min » (avant, « 4 min » dès la première seconde passée).
- Sans manager, **on ne paie que 5 minutes à la fois** : le bouton complète chaque mineur jusqu'à 5 minutes payées, et ne fait payer que le temps manquant (au prorata, arrondi au dollar supérieur). La carte « 💵 Salaires » indique le total pour 5 minutes et le temps qu'il reste au moins payé (« Tout le monde est payé pour encore 4 min. On paie 5 minutes à la fois (le manager, au niveau 3 de la mine, s'en chargera pour toi). »). Elle passe en rouge quand quelqu'un attend son salaire.
- (23/10) **Payer un seul employé** : sur sa carte, un bouton **💵 Payer *Nom* · *prix*** (vert, qui respire en rouge s'il n'est plus payé) le complète jusqu'à 5 minutes, lui seul (`payerEmploye`, `coutSalaireEmploye`). Le bouton du haut devient « Payer tout le monde · *prix* », avec « 💡 Ou paie chacun sur sa carte, juste en dessous. » Le bouton n'est là que s'il y a quelque chose à payer.
- Cette carte disparaît quand on a embauché le manager.

### 6. Licencier un employé (lien « Licencier » sur sa carte)

- Une fenêtre de confirmation (`Confirmation.tsx`) demande « Licencier *X* ? », rappelle sa rareté et le prix des **indemnités**. Le bouton est grisé si on n'a pas assez d'argent.
- **Indemnités = 40 % du prix de base de la dernière place de l'équipe** (`PART_INDEMNITES = 0.4`), arrondi comme les prix d'embauche.

| Employés dans l'équipe | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Indemnités (30/10) | 30 $ | 160 $ | 600 $ | 2 000 $ | 6 000 $ | 16 000 $ | 40 000 $ | 100 000 $ | 240 000 $ | 600 000 $ | 1 320 000 $ | 2 904 000 $ |

- Le mineur part **avec son équipement** (sa pioche et ce qu'il a dans son sac sont perdus). « 👋 *X* est parti(e). Indemnités : … » Réembaucher coûte ensuite le prix normal de la taille d'équipe : c'est le moyen de « retenter sa chance » avec le recruteur.

### 7. Le recruteur (niveau 4 de la mine)

- Avant : carte verrouillée « 🔒 Recruteur · niveau 4 de la mine », qui montre déjà les chances qu'il donnera. Depuis le 29/10, il faut aussi le **niveau 11 du joueur** pour l'embaucher (puis 12, 13 et 15 pour ses niveaux suivants ; avant le 23/10 : 9, 11, 13, 15) : sa ligne affiche alors « 🔒 … · au niveau *N* ».
- On l'embauche (niveau 1) puis on l'améliore, **en argent seulement** (`NIVEAUX_RECRUTEUR`). Les chances de la prochaine embauche s'affichent en pastilles de couleur :

| Niveau | Coût (29/10) | Niveau du joueur | Commun | Rare | Épique | Légendaire | Mythique |
|---|---|---|---|---|---|---|---|
| 1 (embauche) | 10 000 $ | 9 | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 25 000 $ | 11 | 60 % | 22 % | 11 % | 5,5 % | 1,5 % |
| 3 | 50 000 $ | 13 | 55 % | 23,5 % | 12,5 % | 7 % | 2 % |
| 4 | 100 000 $ | 15 | 50 % | 25 % | 14 % | 8,5 % | 2,5 % |

Total : 185 000 $ (avant le 29/10 : 5 000, 12 000, 25 000 et 50 000 $, soit 92 000 $).

- **Les raretés** (`RARETES`) :

| Rareté | Rendement (vitesse et taille du sac) | Salaire | Couleur |
|---|---|---|---|
| Commun | ×1 | ×1 | gris `#b9b4ab` |
| Rare | ×1,5 | ×1,25 | bleu `#4f9df0` |
| Épique | ×2 | ×1,5 | violet `#b06cf0` |
| Légendaire | ×3 | ×2 | orange `#f5a524` |
| Mythique | ×5 | ×3 | rose `#ff4d8d` |

  Un mineur rare creuse plus vite **et** a un plus grand sac : le temps passé à creuser un sac reste le même, mais chaque aller-retour rapporte plus. Un mineur mythique en diamant sort ainsi environ 229 blocs par minute avec l'ascenseur du départ.
- **L'animation d'embauche** (`RevelationRecrue.tsx`, seulement avec le recruteur) : la carte tremble pendant que les couleurs défilent (**1,6 s** de suspense, un clic dévoile tout de suite), puis elle se retourne avec des rayons, des étoiles (★ selon le rang), des confettis (24 + 18 par rang de rareté) et un flash pour légendaire et mythique. Bouton « Au travail ! », « Super ! » (rare, épique) ou « Incroyable ! » (légendaire, mythique). Des sons accompagnent le suspense et la révélation.

### 8. Le manager (niveau 3 de la mine)

- Avant : carte verrouillée « 🔒 Manager · niveau 3 de la mine », puis « 🔒 Manager · au niveau 9 » tant que le joueur n'a pas le niveau 9 (23/10 ; avant : mine niveau 4 et joueur niveau 11).
- **Embauche : 10 000 $** (`PRIX_MANAGER`, 23/10 ; avant 35 000 $), ses 5 premières minutes comprises.
- **Son salaire : 400 $ toutes les 5 minutes** (`SALAIRE_MANAGER`), pris dans l'argent du joueur.
- **Plus de trésorerie** (23/10) : avant, on remplissait une cagnotte pour lui ; maintenant il se sert directement dans l'argent du joueur. Une vieille partie récupère ce qu'il restait dans la trésorerie.
- Sa carte (onglet **Chefs**) montre le prix d'une paie de toute l'équipe (manager compris) et prévient si l'argent ne suffit pas pour la prochaine. Badge « Au travail » ou « 😠 Pas payé ».

## Règles et comportement

- **Le travail d'un mineur** (`travailler` dans `employes.ts`, refait le 23/10) : arrivé à la mine, il **attend la caisse de l'ascenseur en haut** et descend dedans ; au fond, il **creuse sans s'arrêter** et pose ses blocs dans son sac. **La caisse de l'ascenseur fait des allers-retours sans cesse** (`avancerNavette`), même pas pleine : au fond, elle prend les sacs (jusqu'à sa capacité), remonte et se vide dans le coffre de la mine. Sac plein (l'ascenseur ne suit pas) : il attend la caisse. **Il ne remonte jamais avec ses blocs** : on ne voit un mineur dans la caisse que quand il descend (il arrive) ou quand il remonte parce qu'il n'est plus payé.
- **L'ascenseur** : de 6 s le trajet et 15 blocs par voyage (niveau 1, là dès le début) à 1 s et 130 blocs (niveau 6). Voir [mine.md](mine.md#lascenseur-et-léchelle). L'**échelle** (**10 s**, 20 blocs) ne sert que sans ascenseur, dans les vieilles parties.
- **Ce qu'il trouve** : des blocs tirés au hasard selon le **niveau de la mine** (les mêmes chances que la mine). Il ne double jamais ses minerais.
- **Coffre plein** : la caisse attend en haut, pleine, et le mineur remplit son sac puis attend (« 📦 attend : le coffre de la mine est plein ! »), **sans user son salaire**. Tout repart dès qu'il y a de la place.
- **Le temps payé s'écoule pendant tout son travail** (trajets, attente au quai et poussée compris). Quand il n'est plus payé : il arrête de creuser et **attend la caisse au fond** (la caisse emporte quand même son sac), **remonte dedans**, puis **marche jusqu'au Personnel et attend devant**, mécontent, avec une bulle 😠 (« 😠 *X* n'est plus payé(e) : il va attendre son salaire devant le Personnel. »). Un pousseur au quai fait pareil. Sans bâtiment Personnel posé, il attend là où il est. Dès qu'on le paie, il repart à pied (**2,5 cases par seconde** depuis le 27/10, avant 4 ; `VITESSE_MARCHE`) : un mineur vers la mine, un pousseur vers le quai de son trajet. **Plusieurs mineurs payés en même temps repartent l'un après l'autre**, à 0,7 s d'écart (`ECART_DEPART`) ; ceux qui attendent encore leur tour restent à leur place devant le Personnel.
- **Un mineur n'attend jamais au quai** : s'il y en a un (une vieille partie), il redescend aussitôt creuser.
- **Le manager paie tout seul** : dès qu'il reste **moins d'une minute** payée (`SECONDES_AVANT_PAIE_MANAGER = 60`), il paie 5 minutes de plus **avec l'argent du joueur** (23/10 : plus de trésorerie), **d'abord lui-même**, puis les mineurs **du moins cher au plus cher** (s'il n'y a pas assez, le plus de mineurs possible continuent). **S'il n'est pas payé, il ne paie plus personne** (« 💼 Ton manager n'est plus payé : tu n'as plus assez d'argent pour les salaires ! »). Le travail avance par morceaux de 30 secondes, pour que le manager ait le temps de payer entre deux morceaux après une longue absence.
- **Hors ligne** : les mineurs **continuent de travailler** pendant que le jeu est fermé (rattrapage de **8 heures au plus**), tant qu'ils sont payés ; le manager continue aussi de payer avec l'argent du joueur (rentable ou pas : tant pis, ou tant mieux), mais **seulement pendant un temps** (23/10, `NIVEAUX_MANAGER`, `secondesManagerHorsLigne`) : **30 min** au départ, puis 1 h, 2 h, 4 h et 8 h en l'améliorant (6 000, 15 000, 35 000 et 85 000 $ depuis le 23/10 ; avant 20 000, 50 000, 120 000 et 300 000 $ ; niveaux 11 à 14 du joueur ; carte du manager : « 🌙 Quand le jeu est fermé, il paie les salaires pendant 30 min »). Jeu ouvert, il paie toujours. Au retour, la fenêtre « Bon retour, mineur ! » (30/10, `FenetreAbsence.tsx`) dit combien de blocs **tes mineurs ont creusé** et combien de blocs de plus sont dans le coffre et, s'il y a lieu, « 😠 *N* mineurs attendent leur salaire ».

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Personnel » ; une fois posé, « Embauche un pousseur pour le wagonnet » et « Embauche un mineur au Personnel » font partie de l'automatisation, et **« Paie ton mineur au Personnel »** (ou « Paie tes *n* mineurs ») est une urgence, passée devant les autres. « Embaucher un mineur », « Pioche en … pour *X* », le recruteur et le manager sont aussi des achats possibles (bulle 💰, missions d'amélioration).
- **Autres bâtiments** : ils remplissent le **coffre de la mine** ; l'**ascenseur** (au panneau de la mine) raccourcit leurs trajets ; les **pousseurs** (un par trajet) font rouler les wagonnets (vers le **Marché**, la **Foreuse** ou le **Générateur**) tant que leurs trajets ne sont pas électriques ; ils passent au **Forgeron** chercher leur nouvelle pioche. Leurs pioches ne coûtent que de l'argent : le fer, la redstone et l'or restent pour la mine, les rails, la foreuse et le générateur.
- **Revenus et statistiques** : l'indicateur « $/s » compte chaque mineur **payé** qui creuse (sac plein ÷ durée d'un tour, trajets compris, × valeur moyenne d'un bloc), moins les salaires de tous les mineurs payés (pousseurs compris) et celui du manager (`revenu.ts`) ; les statistiques comptent `blocsMineurs` et `salairesPayes`.
- **Succès** : « 👷 Patron » (un premier mineur), « 👥 Chef d'équipe » (6 mineurs).
- **Bot de simulation** (`bot.ts`) : il embauche dès qu'il a le prix plus une paie d'avance, améliore les pioches, paie les salaires dès qu'il reste moins d'une minute, **embauche un pousseur pour Mine → Marché** dès qu'il a ce trajet et au moins un mineur (tant que les rails ne sont pas électriques), puis **le licencie** une fois les rails électriques (quand il a deux fois les indemnités, et pas pendant qu'il pousse).

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche des mineurs et des pousseurs `embaucherPousseur` / `peutEmbaucherPousseur`, prix, licenciement, pioches, trajet d'un pousseur `changerTrajet` et son quai `maisonDe`, salaires, travail seconde après seconde, passage à la forge, attente devant le Personnel, recruteur, manager, textes d'activité).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.employes` : 150 $ + 30 pierre, 5 × 5, porte à droite) et les chiffres (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`, `PRIX_EMBAUCHE`, `HAUSSE_APRES_LISTE`, `PART_INDEMNITES`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `SALAIRE_MANAGER`, `SECONDES_VIDAGE_EMPLOYE`, `SECONDES_FORGE_EMPLOYE`, `VITESSE_MARCHE`, `VITESSE_POUSSE_MINEUR`…).
- `src/jeu/mineur.ts` : les types `Employe` (rôle `mineur` ou `pousseur` ; `trajet`, le trajet d'un pousseur, `null` pour un mineur ; étapes `creuse`, `monte`, `vide`, `descend`, `quai`, `pousse`, `marche`, `forge`, `attend` ; `lieu`, `depuis`, `forgeEnAttente`) et `Manager`, l'ascenseur (`secondesTrajetMineur`).
- `src/jeu/wagonnet.ts` : le pousseur de ce trajet (et lui seul, s'il attend au quai du départ) qui part avec le wagonnet et revient au quai ; la création du trajet à l'embauche (`creerTrajet`).
- `src/jeu/sauvegarde.ts` : `convertirVersion22` (26/10) : dans une partie de la version 22, les anciens pousseurs prennent le trajet Mine → Marché.
- `src/jeu/village.ts` : le chemin à pied entre deux bâtiments (`cheminEntre`, `secondesAPied`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/temps.ts` : fait avancer les mineurs avec le reste du jeu.
- `src/usePartie.ts` : le rattrapage hors ligne (8 h au plus) ; `src/jeu/absence.ts` et `src/composants/FenetreAbsence.tsx` (30/10) : le résumé « Bon retour, mineur ! ».
- `src/jeu/notifications.ts` : les bulles 😠, 🛤️ (sans trajet), ✨ et 💰 au-dessus du Personnel.
- `src/jeu/missions.ts`, `src/jeu/objectifs.ts` : « Construis : Personnel », achats, missions.
- `src/jeu/decouvertes.ts` : les bulles « Nouveau : Recruteur / Manager ! ».
- `src/jeu/revenu.ts` et `src/jeu/statistiques.ts` : ce qu'ils rapportent ($/s et statistiques).
- `src/jeu/employes.test.ts` : les tests (dont l'embauche d'un pousseur pour un trajet et le changement de trajet).
- `src/composants/PanneauEmployes.tsx` : le panneau du bâtiment (salaires, manager et recruteur avec leur portrait, embauche d'un mineur, embauche d'un pousseur avec le choix du départ et de l'arrivée `EmbauchePousseur`, listes Mineurs et Pousseurs, trajet d'un pousseur, licenciement).
- `src/App.tsx` : le trajet regardé pendant l'embauche (`apercuTrajet`), passé à la carte (`trajetEnSurbrillance` de `VueVillage`).
- `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté d'une recrue.
- `src/composants/Confirmation.tsx` : la fenêtre de confirmation du licenciement.
- `src/composants/MenuConstruction.tsx` : la carte du Personnel dans le menu Bâtiments.
- `src/composants/VueVillage.tsx` : le trajet en surbrillance (`.case-trajet`, `.emprise-trajet`), les mineurs qui marchent, passent à la forge, les pousseurs qui attendent au quai de leur trajet ou poussent un wagonnet ou attendent leur salaire (😠), le manager et le recruteur devant le bâtiment, la cabine de l'ascenseur qui suit les mineurs.
- `src/composants/sprites.ts` et `public/images/personnages/sprites/` : les images des personnages tirées des planches (mineur vu devant, derrière, gauche et droite, casque recoloré à la couleur de sa rareté ; manager et recruteur vus de face).
- `src/composants/ElementsVillage.tsx`, `src/composants/iso.ts` : un personnage posé sur la grille, sa place devant un bâtiment (`devant`), sa marche le long d'un chemin (`surLeChemin`, `orienter`).
- `public/images/batiments/employes.webp` : le dessin du bâtiment ; `employes-miroir.webp` : le même avec l'enseigne retournée, pour le bâtiment en miroir (fabriqué par `outils/batiments/textes_miroir.py`, choisi par `imageBatiment` dans `src/composants/iso.ts`) ; `public/images/personnages/manager.webp`, `recruteur.webp` : les portraits du panneau.
- `src/personnel.css` : les cartes, l'animation d'embauche et les portraits (`.portrait-chef`) ; `src/interface.css` : la carte d'embauche d'un pousseur (`.carte-pousseur`, `.choix-batiments`, `.choix-trajet`, `.titre-equipe`) ; `src/village.css` : les personnages du village (`.perso-village`, `.perso-colere`, `.perso-poste`), le trajet qui brille (`.case-trajet`, `.emprise-trajet`) et l'arrivée d'un nouveau mineur (30/10 : `.eclat-embauche`, `.perso-nouveau`, `.bulle-nouveau-mineur`).

## Prix des embauches (23/10)

Mineurs et pousseurs ont **chacun leur liste** (`PRIX_EMBAUCHE`) : 500 $, 2 000 $, 6 000 $, 15 000 $, 35 000 $, 80 000 $, 180 000 $, 400 000 $, 900 000 $, 2 000 000 $, puis ×2,2 à chaque fois. Le 1er pousseur coûte donc 500 $, même si on a déjà des mineurs. Les indemnités (40 %) suivent la liste du métier de celui qu'on licencie.

## Ce qui a changé le 23/10 (suite)

- **Embauche** : le mineur sort du Personnel, marche jusqu'à la mine et descend lui-même dans la caisse de l'ascenseur (on le voit debout dedans). Ensuite, il reste au fond : seule sa caisse remonte.
- **Pioche** : le bouton de la ligne dit ce qu'on gagne (« ⛏️ +0,07/s · 500 $ ») ; la fiche explique « il creuse plus vite et porte plus », avec les blocs par seconde avant → après et la taille du sac (`gainAmeliorationEmploye`).
- **Salaires** : quand des mineurs attendent leur salaire, une bulle « Payer ! » apparaît aussi au-dessus de la mine, et un bandeau dans son panneau mène au Personnel.
- **Coffre plein** : le mineur attend pour vider son sac, **sans user** le temps qu'on lui a payé.

