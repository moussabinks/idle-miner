# 👷 Personnel

> Le bureau d'embauche, ouvert **dès le début** : on y embauche des **taupes mineuses** qui creusent toutes seules au fond de la mine (la caisse de l'ascenseur remonte leurs blocs dans le **coffre de la mine**), des **pousseurs**, chacun pour **un trajet de wagonnet**, et on paie tout ce monde toutes les **5 minutes**. Plus tard, on y trouve le **manager** (palier 3 de la mine) et le **recruteur** (palier 4), et depuis le 26/10 les **joailliers** de la joaillerie (mine niveau 6).
> Écrit d'après le code au 25/10 (la grande mise à jour : premier mineur à 50 $, Personnel à 40 $, 5 niveaux pour les pioches et les pousseurs, 3 niveaux pour les chefs, nouveaux prix et salaires, personnages en taupes), mis à jour le 26/10 (la grosse mise à jour des gemmes : 7 niveaux pour les pioches et les pousseurs, les chefs jusqu'au palier 6, 10 trajets, et un troisième métier, le **joaillier**). Le tutoriel fait construire le Personnel et embaucher le premier mineur : c'est le moment fort du début, quand la mine se met à tourner toute seule.

## Où et quand

- **Où** : là où tu le poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **40 $** (25/10 ; avant 150 $ + 30 pierre). Son identifiant dans le code reste `employes`, son nom affiché est **Personnel**. **✏️ Modifier** le déplace ou le retourne (miroir) gratuitement.
- **Déblocage** : **dès le début** (25/10 ; avant, au niveau 2 du joueur). C'est la 4e étape du **tutoriel** (« Construis le Personnel »), juste avant « Embauche ton premier mineur ». Dans son panneau : le **manager** au **palier 3** de la mine, le **recruteur** au **palier 4**. Les améliorations des employés suivent les **paliers** de la mine (« 🕳️ Mine *N* »).
- **La porte** : sur la face avant **droite** du dessin (à gauche s'il est retourné). Le manager et le recruteur se tiennent devant le bâtiment, et les employés qui attendent leur salaire font la queue devant.
- **L'ouvrir** : toucher (ou cliquer) le Personnel : la taupe du joueur y marche, puis le panneau s'ouvre.
- **Description** : « Embauche des mineurs qui creusent pour toi et des pousseurs pour tes wagonnets, et paie leurs salaires. »
- **Bulles au-dessus** (`notifications.ts`), de la plus urgente à la moins urgente :
  - **😠 « Salaires ! »** (alerte rouge) quand quelqu'un n'est pas payé (« 😠 1 mineur attend son salaire ! », ou, avec le manager, « 💼 Plus assez d'argent : personne n'est payé ! », `alerteSalaires`) ; une bulle « Payer ! » est aussi au-dessus de la mine ;
  - **🛤️ « Sans trajet »** (alerte rouge) quand des pousseurs n'ont plus de trajet en service ;
  - **🚃 « Chariot ! »** (alerte rouge, 26/10) quand le wagonnet d'un trajet vers le marché (Mine, Foreuse, Fonderie ou Joaillerie → Marché) ne suit pas : il faut agrandir le chariot de son pousseur ;
  - **✨ « Nouveau : Manager ! »** au niveau 3 de la mine et **« Nouveau : Recruteur ! »** au niveau 4, jusqu'à ce qu'on passe devant (`decouvertes.ts`) ;
  - **⬆️ « Achetable »** quand une embauche ou une amélioration est payable tout de suite (seulement pendant le tutoriel).
- **Les personnages au village** : depuis le 25/10, les employés sont des **taupes** casquées, et **la couleur du casque est celle de leur rareté** (gris commun, bleu rare, violet épique, orange légendaire, rose mythique), avec leur prénom au-dessus de la tête. On les voit **quand ils sont dehors** : quand ils marchent (vers la mine, vers le Personnel, vers le quai de leur trajet), quand ils attendent leur wagonnet au quai (les pousseurs), quand ils le poussent, et quand ils attendent leur salaire devant le Personnel (😠). Au fond de la mine, on voit seulement la **caisse de l'ascenseur** monter et descendre. Le **manager** et le **recruteur** restent devant le bâtiment. Les taupes sont des SVG plats (`public/images/personnages/sprites/`, 4 vues par rareté, fabriquées par `node outils/art/personnages.mjs`), et les portraits du manager et du recruteur sont `public/images/personnages/manager.svg` et `recruteur.svg` (voir [../jeu/visuel-et-sons.md](../jeu/visuel-et-sons.md#5-les-personnages--des-taupes)).
- **Le dessin au village** (25/10, SVG plat au contour d'encre, `public/images/batiments/employes.svg`, dessiné par `employes()` dans `outils/art/batiments.mjs`) : sur une dalle de 5 × 5 pavés, un bureau au bas des murs en pierre et aux poutres d'angle en bois, un toit bleu, deux fenêtres avec une jardinière de fleurs roses, une porte bleue sur la façade droite, une enseigne ronde au casque de mineur, un tableau d'annonces (les offres d'embauche), un tonneau et une caisse. Sans aucune écriture : retourné, il utilise la même image.

## Ce qu'on peut y faire

Le panneau (`PanneauEmployes.tsx`, refait le 25/10) a **trois onglets** :

- **👷 Personnel** (25/10 : l'équipe et les embauches dans le même onglet) : les salaires, puis **une carte par employé** (ses chiffres, ses améliorations, « Payer » et « Licencier »), rangées par métier (mineurs, pousseurs, puis joailliers). Pastille « ! » si quelqu'un n'est pas payé, si la pioche d'un mineur peut s'améliorer, ou si un pousseur dont le chariot ne suit pas peut s'améliorer (27/10 : pas de « ! » pour un pousseur qui n'en a pas besoin) ;
- (26/10) Un pousseur dont le chariot ne suit pas la production : sa carte passe en rose, avec « ⚠️ Son chariot ne suit pas : il emporte *a* blocs/s, il en sort *b*. Agrandis-le ! » juste au-dessus de son chariot. « Il en sort » compte seulement ce que son wagonnet emporte (26/10) : le charbon vers la foreuse, la redstone que brûle le générateur, ce que fabrique ou consomme un atelier ; toute la production de la mine seulement vers le marché.
- (26/10) Dans chaque section, les employés sont rangés **du plus rare au plus commun** (Mythique en haut), puis dans l'ordre d'embauche.
- (26/10) Deux sections : **⛏️ Mineurs** et **🛤️ Pousseurs**, chacune avec sa ligne pour recruter **en haut** (29/10, avant : en bas, sous l'équipe) puis son équipe ; (29/10, demandé par le propriétaire : des joueurs cherchaient l'embauche d'un mineur et arrivaient aux pousseurs sans le voir) chaque section est un grand **encadré de sa couleur** (mineurs orange, pousseurs bleu, joailliers violet) avec son titre en bandeau ; et (26/10, la grosse mise à jour des gemmes) une troisième, **💍 Joailliers *n* / *max***, dès que la joaillerie est posée.
- **Recruter** (en haut de chaque section, avec les chiffres de la recrue : blocs/s ou cases/s, places du chariot, salaire) : un **mineur**, un **pousseur** pour un trajet de wagonnet, ou (26/10) un **joaillier**. Pastille « ! » sur l'onglet Personnel dès qu'une place de mineur (ou, 26/10, un établi de joaillier) est libre (26/10 : chaque niveau de la mine en ouvre une ; avant, « + » seulement quand on pouvait la payer) ;
- **🎲 Remplacer** (avec le recruteur) : un bouton turquoise uni avec un dé qui roule (`btn-hasard` ; 26/10 : avant, un arc-en-ciel qui défilait). La recrue n'apparaît dans la liste qu'une fois sa carte dévoilée : une nouvelle recrue prend la place du mineur (ou, 26/10, du joaillier : « prend son établi » ; ou du pousseur : « prend son wagonnet », avec son chariot), rareté au hasard.
- (26/10) Dans la carte du recruteur, un **tableau des raretés**, de Commun à Mythique : la chance d'en tomber sur une, ce que creuse une recrue de cette rareté (blocs/s, avec la pioche de départ, et ×1 à ×5) et son salaire toutes les 5 minutes.
- **💼 Chefs** : le **manager** et le **recruteur**. Pastille « ! » si le manager n'a plus assez d'argent ou s'il dort, et (26/10) dès qu'un chef est débloqué sans être embauché (le manager au niveau 3 de la mine, le recruteur au niveau 4) ; la tâche « 💼 Embauche le manager » passe alors devant.

**Trois métiers** : les **mineurs** ne font que creuser (la caisse de l'ascenseur remonte ce qu'ils cassent). Les **pousseurs** ne creusent jamais : ils poussent le wagonnet d'un seul trajet. Les **joailliers** (26/10) travaillent à la joaillerie : ils taillent les gemmes en bijoux (voir § 3 bis).

### 1. Embaucher un mineur

- **Nombre de mineurs** : **1 par niveau de la mine** (`maxEmployes`) : 1, 2, 3, 4, 5, 6, puis **7** au niveau 7 (26/10 ; 5 au plus avant). Les **pousseurs ne comptent pas** : au plus un par trajet de wagonnet (10 depuis le 26/10, 4 avant, `maxPousseurs`), ni les joailliers (un par établi de la joaillerie). Complet : chaque niveau de la mine permet d'en employer 1 de plus.
- **Le prix dépend du nombre de mineurs qu'on a en ce moment** (`PRIX_EMBAUCHE`, 25/10) : **le premier ne coûte presque rien**, pour que le jeu tourne tout seul en 2 minutes.

| Embauche | 1er | 2e | 3e | 4e | 5e | 6e | 7e |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mineur (25/10) | **50 $** | 800 $ | 3 000 $ | 8 000 $ | 20 000 $ | 45 000 $ | 100 000 $ |

(Les 6e et 7e places s'ouvrent aux niveaux 6 et 7 de la mine, depuis le 26/10. Avant le 25/10 : 500 $, 3 500 $, 15 000 $, 45 000 $ et 130 000 $ ; puis, avant l'économie revue du 25/10 : 50 $, 1 200 $, 7 000 $, 25 000 $ et 80 000 $.) La liste continue (220 000, 500 000 et 1 000 000 $), puis chaque embauche coûterait 2,2 fois la précédente (`HAUSSE_APRES_LISTE`). Les prix sont arrondis à la dizaine sous 1 000 $, à la centaine au-dessus. Une embauche peut aussi se payer en gemmes. Chaque embauche rapporte **40 XP** (une seule fois : licencier puis réembaucher ne redonne rien).

- Le nouveau mineur reçoit un **prénom au hasard** pas encore pris (Raphaël, Moussa, Tom, Noah, Samy, Valou, Marion, Enya, Kaïnae, Teo, Fredo, Satine, Nils, Arthur, Sasha, Florian, Khalil, Margot, Romain, Dodo, Guewen, Alexis, Leyhan, Maïane ; avec un numéro si tous sont pris).
- Il commence avec une **pioche en bois** et **ses 5 premières minutes de salaire comprises**. Il sort du Personnel, marche jusqu'à la mine et descend dans la caisse de l'ascenseur.
- Avec le recruteur, sa **rareté est tirée au hasard** et une animation la dévoile (`RevelationRecrue.tsx`).

### 2. La pioche d'un mineur (7 niveaux, 26/10)

Chaque pioche le fait creuser plus vite, avec un plus grand sac (le tas où il pose ses blocs au fond, en attendant la caisse). Payée **en argent seulement** (ou en gemmes) ; ces pioches ne s'usent pas. Chaque niveau demande la **mine au même niveau** (le palier).

| Niveau | Pioche | Creuse | Sac | Prix (26/10) | Palier | Salaire / 5 min |
|---|---|---:|---:|---:|---:|---:|
| 1 | Bois | 0,5 bloc/s | 10 | (de base) | — | 120 $ |
| 2 | Fer | 0,75 bloc/s | 18 | 400 $ | 2 | 300 $ |
| 3 | Or | 1 bloc/s | 28 | 2 500 $ | 3 | 700 $ |
| 4 | Émeraude | 1,3 bloc/s | 40 | 7 000 $ | 4 | 1 300 $ |
| 5 | Saphir (26/10) | 1,7 bloc/s | 55 | 36 000 $ | 5 | 2 600 $ |
| 6 | Rubis (26/10) | 2,2 bloc/s | 75 | 110 000 $ | 6 | 4 500 $ |
| 7 | Diamant | 2,8 bloc/s | 100 | 360 000 $ | 7 | 7 500 $ |

(25/10 : la pioche en pierre est retirée, il en reste 5 ; avant, 6 pioches de 500 $ à 60 000 $, et des salaires de 220 $ à 2 200 $. 26/10 : 7 pioches ; celle du niveau 5, qui était en diamant, est maintenant en **saphir**, avec les mêmes chiffres : un mineur qui avait la pioche en diamant a donc celle en saphir.) Le salaire fait environ 20 à 26 % de ce que le mineur fait sortir de la mine au palier de sa pioche : **une meilleure pioche rapporte toujours plus qu'elle ne coûte en salaire**. Ce qu'il sort vraiment dépend aussi de l'ascenseur (voir [mine.md](mine.md#lascenseur-niveaux_ascenseur)). Toutes ses pioches : 515 900 $ (26/10, hausse de la fin de partie comprise : × 2, × 2,5, × 3 aux paliers 5 à 7 ; jusqu'au palier 5 : 45 900 $ ; avant la hausse : 192 900 $ ; avant l'économie revue : 69 400 $).

- **Sa pioche lui descend par l'ascenseur** : si un forgeron est posé, il attend **3 secondes** au fond (`SECONDES_FORGE_EMPLOYE`) que le forgeron la fasse ; sinon, il l'a directement. Il ne remonte jamais pour ça.

### 3. Les pousseurs

Un pousseur est un **métier à part** : on l'embauche **pour un seul trajet** (par exemple Mine → Marché), et il ne pousse que le wagonnet de ce trajet. **Il en faut un par trajet qui roule tout seul**, même sur des rails électriques ; sinon, le joueur pousse lui-même.

**L'embaucher** (onglet Personnel, « Recruter ») : on coche son trajet dans la liste (un trajet dont les deux bâtiments sont construits ; « Libre », déjà pris par un pousseur, ou « Pas de rails »), le trajet **brille sur la carte**, puis **🛤️ Embaucher pour ce trajet**. Il faut des rails entre les deux bâtiments et un trajet sans pousseur ; si le trajet n'existe pas encore, il est **créé avec l'embauche**.

| Embauche | 1er | 2e | 3e | 4e | 5e | 6e | 7e | 8e | 9e | 10e |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Pousseur (`PRIX_EMBAUCHE_POUSSEUR`) | **300 $** | 1 000 $ | 2 500 $ | 5 000 $ | 9 000 $ | 15 000 $ | 25 000 $ | 40 000 $ | 60 000 $ | 90 000 $ |

(25/10 : 4 pousseurs au plus, pour 4 trajets ; 26/10 : 10, pour les 10 trajets, avec la fonderie et la joaillerie.)

**Son travail** : il marche du Personnel jusqu'au **quai** (le début des rails de son trajet, devant le bâtiment de départ), attend son wagonnet, le **pousse jusqu'à l'arrivée** dès qu'il a quelque chose à porter (2,5 cases/s × sa vitesse × sa rareté ; + 30 % à + 100 % sur un trajet électrique), puis le ramène. Ses arrêts (charger, vider ou vendre) durent toujours 1 s. On peut **changer son trajet** sur sa carte. Si son trajet est arrêté, la bulle **🛤️ Sans trajet** apparaît.

**L'améliorer** (deux améliorations sur sa carte, 7 niveaux chacune depuis le 26/10 ; 5 le 25/10) :

| Niveau | 🏃 Vitesse (`NIVEAUX_POUSSEUR`) | Prix | 🛒 Chariot (`NIVEAUX_CHARIOT_POUSSEUR`) | Prix | Palier |
|---|---|---:|---:|---|---:|
| 1 | Débutant × 1 | (de base) | 20 places | (de base) | — |
| 2 | Costaud × 1,2 | 600 $ | 40 | 800 $ + 40 fer | 2 |
| 3 | Robuste × 1,4 | 2 000 $ | 70 | 2 500 $ + 100 fer | 3 |
| 4 | Expert × 1,65 | 5 000 $ | 110 | 6 000 $ + 200 fer | 4 |
| 5 | Champion × 1,9 | 24 000 $ | 170 | 30 000 $ + 800 fer | 5 |
| 6 | Maître × 2,2 | 75 000 $ | 260 | 100 000 $ + 1 000 fer | 6 |
| 7 | Légende × 2,6 | 210 000 $ | 400 | 330 000 $ + 1 000 fer | 7 |

Le **chariot** est la seule façon d'agrandir un wagonnet (le joueur qui pousse lui-même a 20 places). (25/10 : plus de prix « × le niveau du joueur », et 5 niveaux au lieu de 5 et 7. 26/10 : 7 niveaux ; les deux derniers chariots se paient en **minerai de fer**, comme les autres ; un temps, en lingots de fer. Les paliers 5 à 7 comprennent la hausse de la fin de partie, et jamais plus de 1 000 fer.) Pour un pousseur : 316 600 $ de vitesse, et 469 300 $ + 3 140 fer de chariot. Si son chariot ne suit pas ce que sort le bâtiment de départ, une alerte le dit au panneau de la mine (ou de la foreuse, de la fonderie, de la joaillerie), avec un bouton vers le Personnel.

- **Son salaire** : **400 $** toutes les 5 minutes, **+ 250 $** par niveau de vitesse et **+ 200 $** par niveau de chariot (× sa rareté) : de 400 $ à 3 100 $ (26/10 ; 2 200 $ au plus avec 5 niveaux).
- **Sa rareté** (avec le recruteur) : il pousse × 1 + (rendement − 1) ÷ 2 (`forcePousseur` : rare × 1,25, épique × 1,5, légendaire × 2, mythique × 3).
- **(27/10) Vitesse adoucie, chariot agrandi** : au-dessus de 3,75 cases/s, sa vitesse sur la carte monte de moins en moins (au plus ~6,6 cases/s, avant jusqu'à 78 en fin de partie), et son chariot grandit d'autant, pour transporter toujours autant par seconde. Les places affichées au Personnel sont les vraies (chariot × la compensation). Voir [../jeu/village.md](../jeu/village.md) ; interrupteur `ADOUCIR_VITESSE_POUSSEURS` dans `donnees.ts`.

### 3 bis. Les joailliers (26/10)

Un **troisième métier**, pour la [joaillerie](joaillerie.md) (mine niveau 6) : un joaillier **taille les gemmes en bijoux**, une gemme à la fois, à son établi. La section **💍 Joailliers *n* / *max*** apparaît au Personnel dès que la joaillerie est posée.

- **Combien** : autant que d'**établis** à la joaillerie (`maxJoailliers` : 1 au niveau 1 de la joaillerie, jusqu'à 5 au niveau 5). Tous pris : « Tous les établis sont pris. Améliore la joaillerie pour en avoir plus. »
- **L'embaucher** (`embaucherJoaillier`, `PRIX_EMBAUCHE_JOAILLIER`) :

| Embauche | 1er | 2e | 3e | 4e | 5e |
|---|---:|---:|---:|---:|---:|
| Joaillier | 8 000 $ | 20 000 $ | 45 000 $ | 90 000 $ | 160 000 $ |

- La ligne d'embauche montre ce qu'il taillera (« 💍 6 bijoux/min » au niveau 1, ou « de *a* à *b* bijoux/min » avec le recruteur) et son salaire. Il part du Personnel à pied jusqu'à la joaillerie (« va à son établi de la joaillerie »), puis il taille (« 💍 taille une gemme à la joaillerie », ou « 💤 attend des gemmes à la joaillerie »).
- **Son salaire** : **1 500 $ toutes les 5 minutes** × sa rareté (`SALAIRE_JOAILLIER`), ses 5 premières minutes comprises. Non payé, il quitte son établi et va attendre devant le Personnel, comme un mineur ; sa gemme retourne à l'entrée de la joaillerie.
- **Sa rareté** (avec le recruteur) : il taille × son rendement (rare × 1,5… mythique × 5).
- **Pas d'amélioration** sur sa carte (ni pioche, ni chariot) : on améliore la **joaillerie** (ses outils). Sa carte montre ses bijoux par minute et où en est la gemme qu'il taille (« 🔷 40 % »).
- **Le remplacer** (avec le recruteur) : comme un mineur, au même prix ; le nouveau prend son établi.
- **Le licencier** : indemnités de 40 % de la dernière place (3 200 $ à 64 000 $) ; il laisse la gemme qu'il taillait à l'entrée de la joaillerie.

### 4. Payer les salaires (sans manager)

- Chaque employé doit être payé **toutes les 5 minutes** (`SECONDES_PAR_PAIE = 300`).
- **Salaire de 5 minutes** = salaire de sa pioche (mineur), de ses niveaux (pousseur) ou 1 500 $ (joaillier, 26/10) × multiplicateur de sa rareté, arrondi.
- Sans manager, **on ne paie que 5 minutes à la fois** : « Payer » complète chacun jusqu'à 5 minutes payées, et ne fait payer que le temps manquant (au prorata, arrondi au dollar supérieur). On peut payer tout le monde, ou **un seul employé** sur sa carte.
- Sans salaire, un mineur s'arrête : il remonte dans la caisse, **marche jusqu'au Personnel et attend devant**, mécontent (😠). Dès qu'on le paie, il repart. Plusieurs employés payés ensemble repartent l'un après l'autre (0,7 s d'écart).

### 5. Licencier un employé

- Une fenêtre de confirmation (`Confirmation.tsx`) rappelle le prix des **indemnités** : **40 %** du prix de la dernière place de son métier (`PART_INDEMNITES`).

| Mineurs dans l'équipe | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Indemnités | 20 $ | 320 $ | 1 200 $ | 3 200 $ | 8 000 $ | 18 000 $ | 40 000 $ |

Pour les pousseurs : 120 $, 400 $, 1 000 $ et 2 000 $ pour les 4 premiers, puis 3 600 $ à 36 000 $ (26/10). Pour les joailliers (26/10) : 3 200 $, 8 000 $, 18 000 $, 36 000 $ et 64 000 $. L'employé part avec son équipement.

### 6. Le recruteur (palier 4 de la mine)

- On l'embauche, puis on l'améliore, **en argent** (`NIVEAUX_RECRUTEUR`, 3 niveaux depuis le 25/10 ; avant 4). Il donne une **rareté** à chaque nouvel employé (mineur, pousseur ou, 26/10, joaillier), tirée au hasard, du plus rare au plus commun (`tirerRarete`) :

| Niveau | Prix (26/10) | Palier | Commun | Rare | Épique | Légendaire | Mythique |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 (embauche) | 10 000 $ | 4 | 65 % | 20 % | 10 % | 4 % | 1 % |
| 2 | 80 000 $ | 5 | 57 % | 23 % | 12 % | 6 % | 2 % |
| 3 | 350 000 $ | 6 | 50 % | 25 % | 14 % | 8 % | 3 % |

Total : 440 000 $ (26/10, hausse de la fin de partie comprise ; avant la hausse : 190 000 $ ; le 25/10 : 10 000, 25 000 et 50 000 $ aux paliers 4, 5 et 5, total 85 000 $ ; avant l'économie revue : 245 000 $).

- **Les raretés** (`RARETES`) :

| Rareté | Rendement (vitesse et taille du sac) | Salaire | Couleur |
|---|---|---|---|
| Commun | × 1 | × 1 | gris `#b9b4ab` |
| Rare | × 1,5 | × 1,4 | bleu `#4f9df0` |
| Épique | × 2 | × 1,8 | violet `#b06cf0` |
| Légendaire | × 3 | × 2,5 | orange `#f5a524` |
| Mythique | × 5 | × 4 | rose `#ff4d8d` |

- **🔄 Remplacer** un mineur, ou (26/10) un joaillier ou un pousseur (`remplacerMineur`, `prixRemplacement` ; un pousseur garde son trajet, sa vitesse et son chariot ; depuis le 26/10, à tout moment, même en route : la recrue reprend le wagonnet là où il en était, il ne s'arrête pas) : une nouvelle recrue (nom et rareté tirés au hasard) prend sa place, **avec sa pioche**, sans indemnités. Prix : le plus cher entre le quart de la dernière place possible (`PART_REMPLACEMENT`) et **200 $ × (niveau du joueur)²** (`PRIX_REMPLACEMENT_PAR_NIVEAU`).

### 7. Le manager (palier 3 de la mine)

- **Embauche : 5 000 $** (`PRIX_MANAGER`, 25/10 ; avant 10 000 $, puis 8 000 $ avant l'économie revue), ses 5 premières minutes comprises. **Son salaire : 400 $ toutes les 5 minutes** (`SALAIRE_MANAGER`), pris dans l'argent du joueur.
- **Il paie tout seul** : dès qu'il reste moins d'une minute payée, il paie 5 minutes de plus **avec l'argent du joueur**, d'abord lui-même, puis les employés du moins cher au plus cher (joailliers compris). S'il n'est pas payé, il ne paie plus personne.
- **(25/10) Il vend du coffre s'il le faut** : quand l'argent ne suffit pas pour un salaire, il vend juste ce qu'il faut du coffre de la mine, les minerais les moins chers d'abord, jamais ceux qu'on garde (📌) (`vendreDuCoffrePour`). Avant, pendant une absence, il vidait l'argent du joueur en salaires pendant que tout ce que les mineurs creusaient s'entassait dans le coffre : on revenait sans un sou.
- **La fatigue** : il ne reste éveillé qu'un temps, **jeu ouvert comme jeu fermé**, puis il s'endort et ne paie plus personne, jusqu'à ce qu'on le **☕ Réveille** au Personnel. On ne peut donc pas laisser le jeu tourner tout seul à l'infini. Ses 3 niveaux (`NIVEAUX_MANAGER`, `PALIER_CHEF.manager`, 25/10) :

| Niveau | Reste éveillé | Prix | Palier |
|---|---:|---:|---:|
| 1 (embauche) | 30 min | 5 000 $ | 3 |
| 2 | 1 h | 50 000 $ | 5 |
| 3 | 2 h | 230 000 $ | 6 |

(Avant le 25/10 : 5 niveaux, de 15 min à 1 h 30. Le 25/10 : 12 000 $ au palier 4 et 30 000 $ au palier 5, total 47 000 $.) Total : 285 000 $ (26/10, hausse de la fin de partie comprise ; avant la hausse : 120 000 $ ; avant l'économie revue : 128 000 $).

- **C'est une option** : un interrupteur l'arrête ou le remet au travail (`basculerManager`, `managerActif`). Arrêté, il ne paie personne et on ne lui doit rien : on paie ses employés soi-même.

## Règles et comportement

- **Le travail d'un mineur** (`travailler` dans `employes.ts`) : arrivé à la mine, il descend dans la caisse de l'ascenseur ; au fond, il **creuse sans s'arrêter** et pose ses blocs dans son sac. **La caisse fait des allers-retours sans cesse**, prend les sacs au fond et les vide dans le coffre de la mine. Sac plein (l'ascenseur ne suit pas) : il attend la caisse. Il ne remonte que s'il n'est plus payé.
- **Ce qu'il trouve** : des blocs tirés au hasard selon le **niveau de la mine**. Il ne double jamais ses minerais. Pendant le bonus « ⚡ Production × 2 » (boutique des gemmes), il creuse deux fois plus vite.
- **Coffre plein** : la caisse attend en haut, pleine ; le mineur remplit son sac puis attend, **sans user son salaire**.
- **Hors ligne** : les employés continuent de travailler pendant que le jeu est fermé (**8 heures au plus**), tant qu'ils sont payés ; le manager continue de payer tant qu'il est éveillé. Au retour, la fenêtre « Bon retour, mineur ! » dit ce que les mineurs ont creusé, ce que les wagonnets ont vendu, et qui attend son salaire.

## Lien avec le reste du jeu

- **Tutoriel** (`tutoriel.ts`) : après la première vente du coffre, « Construis le Personnel », puis « Embauche ton premier mineur » ; ensuite, le « bravo ».
- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis le Personnel », « Embauche ton premier mineur », « Embauche un pousseur pour le wagonnet », (26/10) « Embauche un joaillier au Personnel : il taillera les gemmes » ; **« Paie ton mineur au Personnel »** (ou « Paie tes *n* mineurs ») est une urgence, passée devant les autres. Les embauches et améliorations sont aussi des achats possibles.
- **Autres bâtiments** : les mineurs remplissent le **coffre de la mine** ; l'**ascenseur** remonte leurs blocs ; les **pousseurs** font rouler les wagonnets (vers le **Marché**, la **Foreuse**, le **Générateur**, et depuis le 26/10 la **Fonderie** et la **Joaillerie**) ; les **joailliers** travaillent à la **Joaillerie** ; le **Forgeron** fait les nouvelles pioches des mineurs.
- **Revenus et statistiques** : le « $/s » compte chaque mineur payé (blocs par seconde × valeur moyenne d'un bloc), moins les salaires de tous les employés (joailliers compris) et du manager (`revenu.ts`) ; les statistiques comptent `blocsMineurs` et `salairesPayes`.
- **Succès** : « 👷 Patron » (un premier employé), « 👥 Chef d'équipe » (6 mineurs).
- **Bot de simulation** (`bot.ts`) : il embauche dès qu'il a le prix plus une paie d'avance, améliore les pioches, paie les salaires dès qu'il reste moins d'une minute, embauche un pousseur pour Mine → Marché dès qu'il a ce trajet (et agrandit son chariot quand le coffre se remplit), le manager à partir de 15 000 $ (et le réveille à mi-fatigue), le recruteur dès qu'il peut, et (26/10) un joaillier dès qu'un établi est libre.

## Fichiers du code

- `src/jeu/employes.ts` : toutes les règles (embauche des mineurs, des pousseurs et des joailliers (`embaucherJoaillier`, `bijouxParMinute`, 26/10), prix `prixEmbauche`, licenciement, pioches, chariot et vitesse des pousseurs, trajet d'un pousseur `changerTrajet`, salaires, travail seconde après seconde, caisse de l'ascenseur `avancerNavette`, attente devant le Personnel, recruteur, remplacement, manager et sa fatigue).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.employes` : 40 $, 5 × 5, porte à droite) et les chiffres (`EMPLOYES_NIVEAU_1`, `EMPLOYES_PAR_NIVEAU`, `PRIX_EMBAUCHE`, `PRIX_EMBAUCHE_POUSSEUR`, `PRIX_EMBAUCHE_JOAILLIER`, `SALAIRE_JOAILLIER`, `HAUSSE_APRES_LISTE`, `PART_INDEMNITES`, `PART_REMPLACEMENT`, `SALAIRES`, `NIVEAUX_EMPLOYE`, `NIVEAUX_POUSSEUR`, `NIVEAUX_CHARIOT_POUSSEUR`, `SALAIRE_POUSSEUR_*`, `RARETES`, `NIVEAUX_RECRUTEUR`, `PRIX_MANAGER`, `SALAIRE_MANAGER`, `NIVEAUX_MANAGER`, `PALIER_CHEF`, `NOMS_EMPLOYES`).
- `src/jeu/mineur.ts` : les types `Employe` (rôle `'mineur' | 'pousseur' | 'joaillier'`, étape `taille` pour un joaillier à son établi), `Navette` et `Manager`.
- `src/jeu/ateliers.ts` : le travail des joailliers à la joaillerie (`avancerJoaillerie`, `vitesseJoaillier`, `maxJoailliers`).
- `src/jeu/wagonnet.ts` : le pousseur de chaque trajet.
- `src/jeu/notifications.ts`, `src/jeu/decouvertes.ts`, `src/jeu/missions.ts`, `src/jeu/objectifs.ts`, `src/jeu/tutoriel.ts` : bulles, découvertes, missions, achats, tutoriel.
- `src/jeu/employes.test.ts` : les tests.
- `src/composants/PanneauEmployes.tsx` : le panneau et ses trois onglets ; `src/composants/RevelationRecrue.tsx` : l'animation qui dévoile la rareté ; `src/composants/Confirmation.tsx` : la confirmation du licenciement.
