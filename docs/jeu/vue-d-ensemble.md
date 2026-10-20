# Mega Digger : vue d'ensemble du jeu

> Le point d'entrée de la documentation : le concept, la boucle de jeu, la progression prestige par prestige, le vocabulaire et les choix de design.
> Tout est écrit d'après le code au 20/10 (`src/jeu/`, version de sauvegarde `VERSION_ETAT = 17`). Les chiffres détaillés et les formules sont dans [equilibrage.md](equilibrage.md), et chaque bâtiment a sa fiche dans [../batiments/](../batiments/README.md).

## Sommaire de la documentation

### Le jeu (`docs/jeu/`)

| Fichier | Contenu |
|---|---|
| [vue-d-ensemble.md](vue-d-ensemble.md) | Ce fichier : concept, boucle, progression P0 → P8+, glossaire, choix de design. |
| [equilibrage.md](equilibrage.md) | Toutes les tables de données et les formules (blocs, pioches, sacs, ascenseur, enchantements, foreuse, employés, raretés, plafonds, bonus, revenus), le bot de simulation et les durées de jeu. |
| [mine-et-minage.md](mine-et-minage.md) | La mine : couches, génération des blocs, galeries, déplacements, échelle, ascenseur. |
| [interface.md](interface.md) | L'écran : bandeau, barre de boutons, panneaux, notifications, objectifs, téléphone. |
| [visuel-et-sons.md](visuel-et-sons.md) | Le style graphique (CSS), les animations, les bruitages et la musique (Web Audio). |
| [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md) | Les 5 mondes dans `localStorage`, le hors-ligne, les comptes Supabase et le classement. |
| [architecture.md](architecture.md) | L'organisation du code (`src/jeu/` pur, composants React), les tests et le déploiement. |

### Les bâtiments du village (`docs/batiments/`)

| Fichier | Bâtiment | Déblocage |
|---|---|---|
| [README.md](../batiments/README.md) | Index des bâtiments (position dans le village) | — |
| [prestige.md](../batiments/prestige.md) | ⭐ Arbre de prestige : conditions, passage de prestige, talents | prestige 0 (arbre des talents dès le prestige 1) |
| [mine.md](../batiments/mine.md) | ⛏️ Mine : échelle, ascenseur, la mine elle-même | prestige 0 |
| [marche.md](../batiments/marche.md) | 💰 Marché : vente des blocs | prestige 0 |
| [forgeron.md](../batiments/forgeron.md) | ⚒️ Forgeron : pioches, réparation, vitesse et usure | prestige 0 |
| [bazar.md](../batiments/bazar.md) | 🎒 Bazar : sacs à dos et seaux d'eau | prestige 0 |
| [enchanteur.md](../batiments/enchanteur.md) | 🔮 Enchanteur : Efficacité, Fortune, Solidité | prestige 0 |
| [foreuse.md](../batiments/foreuse.md) | ⚙️ Foreuse : machine au charbon qui creuse seule | prestige 1 |
| [personnel.md](../batiments/personnel.md) | 👷 Personnel : mineurs employés, salaires, recruteur, manager | prestige 2 (recruteur 4, manager 5) |

Autres documents du dépôt : la spec de la v1 Python ([../idle_miner_v1.md](../idle_miner_v1.md), référence historique des règles), l'état du projet et le journal ([../../CONTEXTE.md](../../CONTEXTE.md)), les règles de code ([../../CLAUDE.md](../../CLAUDE.md)).

## Le concept

**Mega Digger** (ex-Idle Miner) est un *idle game* de minage inspiré de Minecraft, jouable dans le navigateur (et installable comme application, hors ligne). On incarne une taupe mineuse qui creuse un puits vertical, couche par couche, depuis un petit village jusqu'à la **bedrock**, le fond infranchissable de la mine.

- La mine fait **10 blocs de large**. Chaque couche est cassée bloc par bloc ; quand elle est vide, on descend d'un mètre.
- Les blocs cassés vont dans le **sac à dos**. On les vend au **marché** du village contre de l'argent, à prix fixe.
- Avec l'argent (et quelques minerais gardés), on achète de **meilleures pioches** (plus rapides, et qui descendent plus bas), de plus grands sacs, un **ascenseur**, des **enchantements**.
- Plus on descend, plus les minerais sont précieux (charbon et fer près de la surface, diamants et débris antiques tout au fond).
- Une fois la bedrock atteinte **et** tout amélioré au maximum permis, on passe **prestige** : on recommence dans une mine **50 m plus profonde**, avec des bonus permanents, un point de talent, et de nouvelles machines (foreuse, mineurs employés…).
- Le jeu n'a pas de fin : la mine grandit à chaque prestige (-100 m, -150 m, -200 m…). Après le prestige 8, il n'y a plus de nouveau niveau d'amélioration à débloquer, mais la mine continue de descendre et les bonus de continuer de monter.

Tout tient dans le navigateur (`localStorage`, jusqu'à 5 mondes). Un compte facultatif (pseudo + mot de passe, Supabase) recopie les mondes en ligne et place le joueur dans un classement. Voir [sauvegarde-et-en-ligne.md](sauvegarde-et-en-ligne.md).

## La boucle de jeu

```
creuser → (sac plein) → remonter / envoyer l'ascenseur → vendre → améliorer → creuser plus bas
   … → bedrock → tout au plafond du prestige → PRESTIGE → nouvelle mine plus profonde
```

1. **Départ** : au village (position 0), avec 0 $, une **pioche en bois** offerte, un sac de 32 places. La mine commence à **-2 m** (le premier mètre est l'entrée du puits).
2. **Descendre** : à l'échelle (0,15 s par mètre), plus tard en ascenseur. Au fond, le mineur est au **front de taille** (juste au-dessus de la couche en cours).
3. **Creuser** : le bouton « Creuser » finit la couche en cours ; « Auto » creuse sans s'arrêter (et s'arrête si la pioche casse). Chaque bloc prend `dureté × (1,5 en roche dure) ÷ vitesse × 0,45` secondes. La pioche s'use ; cassée, on mine **à mains nues** (vitesse 1).
4. **Le sac se remplit** : quand il est plein, le minage s'arrête (avec un ascenseur, le trop-plein attend sur le **quai**, jusqu'à la capacité de la cabine).
5. **Remonter et vendre** : on remonte au village (le mineur marche d'abord jusqu'au puits, 0,12 s par case), et on vend au marché. Avec l'**ascenseur**, on peut aussi **envoyer** le sac à la surface sans bouger : la cabine vend son chargement en arrivant, puis redescend seule.
6. **Améliorer** : forgeron (pioche suivante, réparation), bazar (sac, seaux d'eau contre la lave), enchanteur (Efficacité, Fortune, Solidité), ascenseur (à l'entrée de la mine ou depuis le fond). Il faut **garder** certains minerais (décochés au marché) : diamants, or, débris antiques pour les pioches, lapis et émeraudes pour les enchantements, fer et redstone pour l'ascenseur et la foreuse.
7. **Descendre plus bas** : chaque pioche a une profondeur maximum. Si la couche suivante est trop profonde pour elle, on creuse une **galerie horizontale** (on n'est jamais bloqué) et un message dit quelle pioche acheter. Seule la **netherite** atteint la bedrock.
8. **Bedrock** : en finissant la couche juste au-dessus de la bedrock (-99 m au prestige 0), on gagne (succès « Bedrock ! », écran de victoire une fois par partie). On peut continuer de creuser des galeries.
9. **Prestige** : à l'arbre de prestige du village, quand toutes les conditions sont remplies (bedrock + tout au plafond du prestige actuel). On repart à -2 m dans une mine plus profonde, avec l'argent à 0, mais on garde les améliorations durables (voir le tableau « Ce qui est gardé » dans [../batiments/prestige.md](../batiments/prestige.md)). On gagne +15 % sur les ventes, +10 % de vitesse de pioche et 1 point de talent.

Pendant ce temps, à partir du prestige 1, la **foreuse** creuse seule (tant qu'elle a du charbon et de la place dans son chariot), et à partir du prestige 2, les **mineurs employés** creusent, remontent et vendent seuls (tant qu'on paie leur salaire). Ces deux-là continuent quand le jeu est fermé (rattrapage de **8 h au plus**) ; le mineur du joueur, lui, ne creuse pas hors ligne.

## La progression, prestige par prestige

La bedrock est à **-(100 + 50 × prestige) m**. Les bonus de prestige s'additionnent : ventes **× (1 + 0,15 × P)**, vitesse des pioches **× (1 + 0,10 × P)**, et les salaires des mineurs montent comme les ventes. On gagne **1 point de talent par prestige**.

Les colonnes « niveau max » donnent ce que le prestige **actuel** permet (les `PLAFONDS` de `donnees.ts`). Ce sont aussi les conditions pour passer au prestige suivant (avec la bedrock). Les détails sont dans [equilibrage.md](equilibrage.md#les-plafonds-par-prestige).

| Prestige | Bedrock | Ventes / vitesse | Ce qui se débloque | Ascenseur | Sac | Efficacité / Fortune / Solidité | Forage / Chariot | Mineurs (nombre, meilleure pioche) | Recruteur |
|---|---|---|---|---|---|---|---|---|---|
| **0** | -100 m | ×1,00 / ×1,0 | Les 6 premiers stands (Arbre de prestige, Mine, Marché, Forgeron, Bazar, Enchanteur) | 2 / 6 | 128 places | I / I / I | — | — | — |
| **1** | -150 m | ×1,15 / ×1,1 | **Foreuse** (à activer) ; arbre des talents (branches Mineur, Marchand, Ingénieur) | 3 | 128 | I / I / I | activée (niv. 1) | — | — |
| **2** | -200 m | ×1,30 / ×1,2 | **Personnel** : mineurs employés ; branche **Patron** | 4 | 256 | II / II / II | 2 / 2 | 2, Pierre | — |
| **3** | -250 m | ×1,45 / ×1,3 | — | 5 | 512 | II / II / II | 3 / 3 | 3, Diamant | — |
| **4** | -300 m | ×1,60 / ×1,4 | **Recruteur** (rareté des mineurs) ; branche **Recrutement** une fois le recruteur embauché | 6 (max) | 1 024 | III / III (max) / III (max) | 4 / 4 | 4, Netherite (max) | 1 |
| **5** | -350 m | ×1,75 / ×1,5 | **Manager** et trésorerie (paie les salaires seul) | 6 | 2 048 (max) | III / III / III | 5 / 5 | 5, Netherite | 2 |
| **6** | -400 m | ×1,90 / ×1,6 | — | 6 | 2 048 | IV / III / III | 6 / 6 | 6 (max), Netherite | 3 |
| **7** | -450 m | ×2,05 / ×1,7 | — | 6 | 2 048 | IV / III / III | 7 / 7 | 6, Netherite | 4 (max) |
| **8** | -500 m | ×2,20 / ×1,8 | Derniers niveaux : Efficacité V, forage et chariot niveau 8 | 6 | 2 048 | V (max) / III / III | 8 / 8 (max) | 6, Netherite | 4 |
| **9 et +** | -550 m, puis -50 m par prestige | +0,15 / +0,1 par prestige | plus rien de nouveau : tout est au plafond | 6 | 2 048 | V / III / III | 8 / 8 | 6, Netherite | 4 |

Notes :

- Le **sac** est compté en places (32, 64, 128 au départ ; un sac de plus par prestige à partir du prestige 2).
- La **foreuse** au prestige 1 : l'activer (5 000 $ + 10 fer + 5 redstone) suffit, son niveau de base n'est pas une condition.
- **Mineurs** : `min(6, prestige)` mineurs au plus à partir du prestige 2, **+1** avec le talent « Grande équipe ». On n'est pas obligé d'embaucher toute l'équipe ; seule la pioche de chaque mineur embauché doit être au plafond.
- Les **pioches du joueur** ne sont pas plafonnées et ne sont pas une condition (mais la netherite est obligatoire pour atteindre la bedrock).
- Le **manager** n'est pas une condition de prestige.
- Avec la mine qui s'agrandit, toutes les profondeurs (minerais, zones, roche dure, profondeur max des pioches) sont **mises à l'échelle** : `profondeur réelle = profondeur de référence × (bedrock / 150)`. Le charbon reste donc près de la surface et les débris antiques tout au fond, à chaque prestige.

### Ce qui est gardé au prestige (résumé)

- **Gardé** : succès, talents, pioches débloquées (toutes réparées, la meilleure équipée), taille du sac, enchantements, niveau de l'ascenseur, foreuse (activation, niveaux, options), mineurs (pioche, rareté), recruteur, manager, objets gardés au marché, stands découverts, argent gagné au total (classement), statistiques totales.
- **Remis à zéro** : argent, trésorerie, contenu du sac, seaux, la mine (on repart à -2 m), la victoire ; la foreuse repart de la surface sans charbon et chariot vidé ; les mineurs repartent de la surface, sac vide, avec au moins 10 minutes de salaire payées (le manager aussi).

Le détail est dans [../batiments/prestige.md](../batiments/prestige.md).

### L'arbre des talents (1 point par prestige)

5 branches de 4 talents ; il faut le talent du dessus pour prendre celui du dessous. Branche **Patron** fermée avant le prestige 2, branche **Recrutement** fermée tant que le recruteur n'est pas embauché. Les talents sont gardés pour toujours. Liste et effets : [../batiments/prestige.md](../batiments/prestige.md#2-larbre-des-talents-à-partir-du-prestige-1) et [equilibrage.md](equilibrage.md#les-talents).

## Glossaire

| Terme | Sens dans le jeu |
|---|---|
| **Améthyste** | Objet (50 $) obtenu en cassant une géode (3 à 6 par géode). Pas de Fortune. |
| **Arbre de prestige** | Le bâtiment tout à gauche du village : conditions du prestige, bouton « Passer prestige », arbre des talents. |
| **Ascenseur** | Une cabine qui monte et descend le puits (6 niveaux). Elle emmène le mineur, ou remonte seule un chargement qu'elle vend en arrivant au village. Gardé au prestige. |
| **Auto (♾️)** | Le creusage automatique : on creuse sans s'arrêter, jusqu'à ce qu'on arrête ou que la pioche casse. |
| **Bedrock** | Le fond de la mine : -100 m au prestige 0, puis 50 m de plus par prestige. La dernière couche creusable est juste au-dessus. L'atteindre = victoire de la partie. |
| **Bloc spécial** | Lave, coffre ou géode : ils déclenchent un effet au lieu d'aller dans le sac. La foreuse et les mineurs n'en trouvent jamais. |
| **Bonus de prestige** | +15 % sur toutes les ventes et +10 % de vitesse des pioches du joueur, par niveau de prestige (cumulés). |
| **Bonus de vente** | Le multiplicateur de toutes les ventes : `1 + 0,15 × prestige + talents` (Négociant +0,10, Grand négociant +0,15). |
| **Cabine** | La partie mobile de l'ascenseur. Les mineurs employés ont chacun la leur. |
| **Capacité** | Nombre d'objets qu'un ascenseur remonte par voyage (32 à 1 024), ou que le chariot de la foreuse contient. |
| **Carburant** | Le charbon chargé dans la foreuse, compté en secondes (1 charbon = 20 s). |
| **Chargement** | Ce que la cabine transporte vers le village ; vendu automatiquement à l'arrivée. |
| **Chariot** | Le réservoir de la foreuse : elle y met ce qu'elle remonte ; on le vide au stand Foreuse (vendre ou mettre dans le sac). 8 niveaux de taille. |
| **Coffre** | Bloc spécial : de l'argent (`(20 à 60) + profondeur × (3 à 8)` $) et 1 minerai du coin. |
| **Conditions de prestige** | Bedrock atteinte + tout amélioré au plafond du prestige actuel (`conditionsPrestige.ts`). |
| **Couche** | Une rangée de 10 blocs à une profondeur donnée. On voit toujours les 4 couches du dessous. |
| **Débris antiques** | Le minerai le plus cher (400 $), très dur (dureté 30), tout au fond. Sert à la pioche en netherite et à la réparer. Pas de Fortune. |
| **Découverte** | Un stand ou une fonction qui vient de se débloquer (foreuse, Personnel, recruteur, manager) : une flèche jaune y guide jusqu'à ce qu'on y passe. |
| **Durabilité / usure** | Chaque pioche a une durabilité (60 à 800) ; chaque bloc cassé peut lui retirer 1 point. À 0, elle est cassée. |
| **Échelle (de la mine)** | 1) Le moyen de monter et descendre sans ascenseur (0,15 s/m). 2) Le facteur `bedrock / 150` qui met les profondeurs de référence à la taille de la mine du prestige. |
| **Efficacité** | Enchantement : +25 % de vitesse de pioche par niveau (max V). |
| **Employé (mineur employé)** | Un mineur embauché au stand Personnel (prestige 2) : il creuse sa propre galerie, remonte et vend seul ; tout l'argent est pour le joueur ; on lui paie un salaire toutes les 10 minutes. |
| **Enchantement** | Efficacité, Fortune ou Solidité, achetés à l'Enchanteur ; valent pour toutes les pioches du joueur ; gardés au prestige. |
| **Envoi automatique** | Option du sac : quand il est plein, l'ascenseur part seul au marché avec les objets cochés. Désactivée par défaut. |
| **Foreuse** | Machine débloquée au prestige 1 : activée une fois, alimentée au charbon, elle creuse seule son propre puits et remplit son chariot. Une seule foreuse, 8 niveaux de forage et de chariot. |
| **Forage** | La vitesse de la foreuse (2 à 30 blocs/s). |
| **Fortune** | Enchantement : 20 % de chance par niveau de **doubler** un minerai (max III, donc 60 %), jamais plus de ×2. |
| **Front de taille** | L'endroit où le mineur creuse, juste au-dessus de la couche en cours (position `profondeur − 1`). |
| **Galerie (horizontale)** | Quand on ne peut pas descendre (pioche trop faible, ou bedrock), on recreuse une couche neuve à la même profondeur : on n'est jamais bloqué. |
| **Géode** | Bloc spécial : 3 à 6 améthystes. |
| **Hors ligne** | Quand on rouvre un monde, le temps écoulé (8 h au plus) est rattrapé : trajets, foreuse, mineurs, manager. Le joueur ne creuse pas. |
| **Indemnités** | Ce que coûte un licenciement : 40 % du prix de la dernière embauche de l'équipe. |
| **Lave** | Bloc spécial : avec un seau d'eau, +1 obsidienne ; sans seau, elle brûle un tiers de chaque pile du sac. |
| **Mains nues** | Miner avec une pioche cassée : vitesse 1, sans aucun bonus. La profondeur max reste celle de la pioche équipée. |
| **Manager** | Débloqué au prestige 5 (50 000 $, puis 3 000 $ / 10 min) : il paie tous les salaires seul avec la trésorerie. |
| **Mine de référence** | La mine de 150 m pour laquelle toutes les profondeurs des données sont écrites (`PROFONDEUR_REFERENCE`). C'est la vraie mine au prestige 1. |
| **Minerai** | Un bloc qui profite de Fortune : charbon, fer, redstone, lapis, or, émeraude, diamant. |
| **Monde** | Une partie séparée (jusqu'à 5), choisie sur l'écran d'accueil. |
| **Objets gardés** | Les objets décochés (jauge à 0) au marché ou dans le sac : ils ne sont pas vendus / pas envoyés, et le jeu s'en souvient. |
| **Objectif** | La barre « 🎯 prochain objectif » : l'achat le plus proche (pioche, ascenseur, sac…), puis la bedrock, puis le prestige. |
| **Obsidienne** | Objet (60 $) obtenu en éteignant une lave avec un seau. |
| **Paie / salaire** | Ce que coûtent 10 minutes de travail d'un mineur employé (selon sa pioche, sa rareté et le prestige). Sans manager, on paie au plus 10 minutes d'avance. |
| **Plafond** | Le niveau maximum d'une amélioration permis par le prestige actuel (`PLAFONDS`). Au-delà : « 🔒 au prestige N ». |
| **Point de talent** | 1 par prestige, à dépenser dans l'arbre des talents. |
| **Prestige** | Recommencer dans une mine plus profonde, avec des bonus permanents. Le niveau de prestige (P0, P1…) commande la profondeur, les bonus et les plafonds. |
| **Profondeur max (d'une pioche)** | Le plus bas où la pioche permet de descendre, mis à l'échelle de la mine du prestige. |
| **Quai** | La zone au pied de l'ascenseur où attendent les blocs quand le sac est plein (jusqu'à la capacité de la cabine). Ils partent en premier au prochain envoi. |
| **Rareté** | Commun, rare, épique, légendaire, mythique : tirée à l'embauche quand on a le recruteur. Multiplie la vitesse et le sac du mineur (×1 à ×5) et son salaire (×1 à ×3). |
| **Recharge automatique** | Option de la foreuse (dès le 3e niveau de forage, ou le 1er avec « Moteur autonome ») : elle brûle le charbon qu'elle remonte tant que sa réserve est sous 60 s. |
| **Recruteur** | Débloqué au prestige 4 (4 niveaux) : donne une rareté aux mineurs embauchés. |
| **Rendement** | Le multiplicateur de rareté d'un mineur (vitesse de creusage et taille du sac). |
| **Revenu ($/s)** | L'estimation de l'argent gagné par seconde (joueur, foreuse, mineurs moins salaires), affichée dans le bandeau (`revenu.ts`). |
| **Roche dure** | La roche des profondeurs (identifiant `deepslate`), sous 94 m de référence : 2 $, et tout y casse 1,5 fois plus lentement. |
| **Sac (à dos)** | L'inventaire du joueur : 32 à 2 048 places (7 tailles au Bazar). Gardé au prestige (vidé). |
| **Seau d'eau** | 25 $ au Bazar : éteint une lave (consommé). |
| **Solidité** | Enchantement : la pioche ne s'use qu'une fois sur (niveau + 1) (max III). |
| **Stand** | Un bâtiment du village (Arbre de prestige, Mine, Marché, Forgeron, Bazar, Enchanteur, Foreuse, Personnel). On l'utilise en marchant devant (à 1,4 tuile près). |
| **Succès** | 16 accomplissements (`succes.ts`), gardés au prestige. |
| **Talent** | Un bonus permanent de l'arbre de prestige (20 talents en 5 branches). |
| **Trésorerie** | La cagnotte du manager, qu'on remplit au stand Personnel ; elle repart de 0 au prestige. |
| **Village** | La surface (position 0) : un chemin avec les stands. Vendre, acheter, réparer et enchanter ne se font qu'au village, à l'arrêt. |
| **Victoire** | Avoir atteint la bedrock dans la partie en cours (`etat.victoire`). |
| **Zone** | L'ambiance selon la profondeur : Surface, Cavernes, Mines, Profondeurs, Roche dure, Abîmes. |

## Les choix de design (à respecter)

Hérités de la v1 Python ([../idle_miner_v1.md](../idle_miner_v1.md)) et des décisions de l'équipe (voir [../../CLAUDE.md](../../CLAUDE.md) et [../../CONTEXTE.md](../../CONTEXTE.md)) :

### Interdit

- ❌ **Pas de creepers** (retirés à la demande de l'auteur de la v1).
- ❌ **Pas de prix du marché variables** : chaque bloc a un prix fixe ; seuls le prestige et les talents font monter les ventes.
- ❌ **Pas de mineurs automatiques (PNJ)**, sauf les exceptions ci-dessous.
- ❌ **Pas de quêtes du marchand.**
- Pas de torches : la lumière est naturelle, on voit toujours les 4 couches du dessous.

### Les exceptions décidées

- ✅ **La foreuse** (16/10, prestige 1) : creuse seule tant qu'on lui donne du charbon. **Une seule** foreuse (20/10), avec 8 niveaux de forage et de chariot.
- ✅ **Les mineurs employés** (19/10, prestige 2, stand Personnel) : ils creusent, remontent et vendent seuls ; on paie leur embauche, leurs pioches et un **salaire toutes les 10 minutes** (20/10 : sinon ils attendent au stand Personnel). Au prestige 4, le **recruteur** leur donne une rareté ; au prestige 5, le **manager** paie les salaires seul avec la trésorerie.

### Les principes

- ✅ **On n'est jamais bloqué** : toutes les pioches débloquées se rachètent neuves, on mine à mains nues avec une pioche cassée, et on creuse une galerie horizontale quand on ne peut pas descendre.
- ✅ **Prestige mérité** (20/10) : on ne passe prestige qu'une fois la bedrock atteinte **et** tout amélioré au maximum de ce que le prestige permet.
- ✅ **Progression étalée** (19/10 et 20/10) : les améliorations sont plafonnées par prestige, pour ne pas tout acheter en un seul prestige.
- ✅ **Économie surtout en argent** (19/10) : les minerais servent d'appoint (pioches, réparation, enchantements) ; le fer et la redstone sont réservés aux machines (ascenseur, foreuse), les améliorations du Personnel se paient en argent seulement.
- ✅ **Sauvegarde** dans `localStorage` (nouveau par rapport à la v1, indispensable sur le web), jusqu'à 5 mondes ; le jeu marche toujours sans réseau.
- ✅ **Tout en français** (interface, code, commentaires), code lisible pour débutants.
- ✅ **Visuel et sons maison** : blocs et animations en CSS (style cartoon arrondi, rien de cubique), sons fabriqués avec Web Audio (aucun fichier à créditer).
- ✅ **Jouable au téléphone** (barre de boutons collée en bas) et installable (PWA, hors ligne).
