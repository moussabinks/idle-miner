# 🏪 Joaillerie

> Un atelier débloqué au **niveau 6 de la mine** (26/10, la grosse mise à jour des gemmes) : ses **joailliers** (des taupes embauchées au Personnel) **taillent les gemmes en bijoux**, qui valent **2,5 fois** leur gemme. Les gemmes (émeraude, saphir, rubis, diamant) arrivent à la main (« 📦 Apporter », depuis le coffre de la mine) ou en wagonnet (de la mine ou de la foreuse) ; les bijoux attendent dans sa **réserve**, qu'on vend d'un clic ou qu'un wagonnet emporte au marché. Un joaillier rare taille plus vite, et dans le rayon du générateur, tous vont plus vite.
> Écrit d'après le code au 26/10 (`src/jeu/ateliers.ts`, `src/jeu/employes.ts`, `src/jeu/donnees.ts`, `src/composants/PanneauxAteliers.tsx`).

## Où et quand

- **Où** : là où tu la poses dans la clairière : un bâtiment de **5 × 5 cases**, acheté une fois dans le menu **🏗️ Bâtiments** pour **150 000 $ + 40 émeraude + 30 saphir** (les minerais se prennent dans le coffre de la mine ; on peut aussi payer en gemmes). **✏️ Modifier** la déplace ou la retourne (miroir) gratuitement.
- **Déblocage** : au **niveau 6 de la mine** (« Veine de rubis », `BATIMENTS.joaillerie.niveauMine = 6`). Avant, sa carte du menu Bâtiments a un cadenas « 🔒 Mine niveau 6 ». Ses niveaux suivent leurs propres **paliers** (`PALIER_JOAILLERIE`, voir plus bas).
- **La porte** : sur la face avant **droite** du dessin (à gauche si elle est retournée).
- **Le dessin au village** (26/10, SVG plat au contour d'encre, `public/images/batiments/joaillerie.svg`, dessiné par `joaillerie()` dans `outils/art/batiments.mjs`) : une **boutique en pierre claire au toit violet** bordé d'or, une **grosse gemme bleu ciel** en enseigne sur le toit, la **vitrine aux bijoux** sous un auvent violet et lilas, la porte violette et deux buis en pot ; devant, l'**établi et sa loupe**, et un petit coffre ouvert plein de gemmes (`coffreGemmes()`). Il n'y a pas de dessin « en marche » : on voit les joailliers au travail devant la boutique.
- **L'ouvrir** : toucher (ou cliquer) la joaillerie : la taupe du joueur y marche, puis le panneau s'ouvre (fenêtre violette).
- **Description** : « Ses joailliers taillent les gemmes en bijoux, qui valent 2,5 fois plus. »
- **Bulles au-dessus** (`notifications.ts`) :
  - **💍 « Plein ! »** (alerte rouge) : « La réserve de bijoux est pleine : vends-la ! » ;
  - sinon **💍 « Joaillier ? »** (alerte rouge) : « Personne ne taille les gemmes : embauche un joaillier au Personnel », quand aucun joaillier n'est payé ;
  - **🚧 « Rails coupés »** (alerte rouge) quand un trajet qui part d'ici ou y arrive n'a plus de rails complets ;
  - et au Personnel, **🚃 « Chariot ! »** quand le wagonnet Joaillerie → Marché ne suit pas ce qu'elle fabrique.
- **Les joailliers au village** : ils travaillent **devant la joaillerie**, l'un à côté de l'autre (étape `taille`), avec leur casque de la couleur de leur rareté et leur prénom au-dessus de la tête.

## Ce qu'on peut y faire

Le panneau (`PanneauJoaillerie` dans `PanneauxAteliers.tsx`) a **trois onglets**. Il s'ouvre sur « Bijoux » quand la réserve est pleine. En haut de chaque onglet, l'alerte du chariot (`AlerteChariot`) si le wagonnet Joaillerie → Marché ne suit pas, avec un bouton vers le Personnel.

### 1. 🔨 Établis

- **Une carte d'état** : « *N* bijoux/min » (ce que taillent les joailliers au travail), et une étiquette : **Au travail** (⚡ si elle est dans le rayon du générateur allumé), **Réserve pleine**, **Pas de joaillier** ou **Rien à tailler** ; dessous, « *N* bijoux taillés ». Pastille « ! » sur l'onglet quand aucun joaillier n'est payé.
- Réserve pleine : un bouton **💍 Réserve pleine : vendre les bijoux** mène à l'onglet Bijoux.
- **Établis *n* / *max*** : une ligne par joaillier, avec la gemme qu'il taille, son prénom, une étiquette de la couleur de sa rareté (« *N* bijoux/min »), et une jauge « Taille : saphir » ; ou « 😠 Pas payé » (ligne rouge), « Il arrive à son établi. », « Il attend une gemme. ».
- **Les établis libres** : une carte « 💍 *N* établis libres » : « Embauche un joaillier au Personnel : un joaillier rare taille plus vite. », avec le bouton bleu **👷 Aller au Personnel** et le prix de la prochaine embauche (le bouton attire l'œil tant qu'il n'y a aucun joaillier).
- **Ce qu'ils taillent** : la jauge de l'**entrée** (« Entrée : *n* / *places* »), puis une ligne par gemme : « 💚 → 📿 Émeraude → Collier d'émeraude · 80 $ → 200 $ · *n* à l'entrée », de même pour le saphir (🔷 → 🧿), le rubis (🔺 → 🫅) et le diamant (💎 → 💍), avec **📦 Apporter *N*** (`apporterAuAtelier`) ; une gemme que la mine ne sort pas encore a le cadenas « 🔒 🕳️ Mine 7 » (le diamant, au niveau 6). Dessous, en gris, **✖ Refusé ici** et les icônes de ce que sort la mine et qu'elle ne prend pas (pierre, charbon, fer, redstone, or). « « Apporter » prend dans le coffre de la mine (sauf ce que tu gardes 📌). Avec des rails, un wagonnet l'apporte tout seul. »
- **Wagonnets** : les trajets qui partent d'ici ou y arrivent (`PanneauTrajets`), avec **Pousser** et **⚙️ Régler**.

### 2. 💍 Bijoux : la réserve

- La **même interface que le coffre de la mine** (`StockMinerais.tsx`) : « 💍 Bijoux » et sa jauge (rouge « Plein : les joailliers s'arrêtent ! »), le gros bouton **💰 Tout vendre · +X $**, et une ligne par bijou (sa quantité, son prix, **Vendre**). Pastille « ! » sur l'onglet quand elle est pleine.
- La vente se fait **au prix du marché** (`vendreSortie`), × 2 pendant le bonus « 💰 Ventes × 2 ». Message : « 💰 Bijoux vendus : +X $ ».

### 3. ⬆️ Améliorer (5 niveaux)

Une ligne d'amélioration (`Amelioration`) : « Établis *a* → *b* », « Outils ×*v* → ×*w* », « *p* places → *q* », avec le bouton vert (le prix) et le bouton violet **💎** (en gemmes). Sans le palier : « 🕳️ Mine *N* ». Message : « 🏪 Joaillerie niveau *N* : *E* établi(s), outils ×*V*, *P* places. »

| Niveau | Établis (joailliers au plus) | Outils | Un bijou, joaillier commun (sans électricité) | Entrée et réserve | Prix | Palier (`PALIER_JOAILLERIE`) |
|---|---:|---:|---:|---:|---|---:|
| 1 | 1 | × 1 | 10 s (6 par minute) | 30 places chacune | (le bâtiment) | 6 |
| 2 | 2 | × 1,15 | 8,7 s (6,9 par minute) | 50 | 120 000 $ + 30 saphir | 6 |
| 3 | 3 | × 1,3 | 7,7 s (7,8 par minute) | 80 | 220 000 $ + 25 rubis | 6 |
| 4 | 4 | × 1,5 | 6,7 s (9 par minute) | 120 | 400 000 $ + 40 rubis + 10 diamant | 7 |
| 5 | 5 | × 1,75 | 5,7 s (10,5 par minute) | 180 | 700 000 $ + 25 diamant | 7 |

Tous les niveaux : 1 440 000 $ + 30 saphir + 65 rubis + 35 diamant. Chaque niveau rapporte 30 XP (et 1 XP par 25 $ de son prix).

## Les joailliers

Un **métier à part**, embauché au **Personnel** (section **💍 Joailliers *n* / *max***, qui n'apparaît qu'une fois la joaillerie posée ; voir [personnel.md](personnel.md#3-bis-les-joailliers-2610)) :

- **Combien** : autant que d'**établis** (`maxJoailliers`), de 1 à 5 selon le niveau de la joaillerie. Ils ne prennent pas la place d'un mineur.
- **L'embauche** (`embaucherJoaillier`, `PRIX_EMBAUCHE_JOAILLIER`) : **8 000, 20 000, 45 000, 90 000 et 160 000 $** pour le 1er au 5e. Il sort du Personnel et marche jusqu'à la joaillerie, ses 5 premières minutes de salaire comprises. Chaque embauche rapporte 40 XP.
- **Le salaire** : **1 500 $ toutes les 5 minutes** × sa rareté (`SALAIRE_JOAILLIER`), comme les autres employés (on le paie au Personnel, ou le manager s'en charge).
- **La rareté** (avec le recruteur) : un joaillier rare taille × 1,5, épique × 2, légendaire × 3, mythique × 5 (et son salaire monte aussi, × 1,4 à × 4). Le recruteur peut le **remplacer** (un nouveau prend son établi).
- **Pas d'amélioration** à lui : on améliore la joaillerie (ses outils et ses établis).
- **Non payé**, il quitte son établi, va attendre devant le Personnel (😠), et la gemme qu'il taillait **retourne à l'entrée**. **Licencié**, il laisse aussi sa gemme à l'entrée.

## Règles et comportement

- **Ce qu'elle accepte** (`BIJOU_DE`, `accepte`, `objetsAcceptes`) : seulement les **quatre gemmes**. Un bijou vaut **2,5 fois** sa gemme :

| Gemme | Bijou | Prix du bijou | Ce que la joaillerie ajoute |
|---|---|---:|---:|
| 💚 Émeraude (80 $) | 📿 Collier d'émeraude | 200 $ | 120 $ |
| 🔷 Saphir (120 $) | 🧿 Pendentif de saphir | 300 $ | 180 $ |
| 🔺 Rubis (170 $) | 🫅 Couronne de rubis | 425 $ | 255 $ |
| 💎 Diamant (240 $) | 💍 Bague de diamant | 600 $ | 360 $ |

- **Le travail** (`avancerJoaillerie`) : chaque joaillier **à son établi et payé** (`joaillierAuTravail`) prend **la gemme la plus chère** de l'entrée et la taille, **une à la fois**. Le bijou fini va dans la réserve ; si elle est pleine, il attend avec son bijou fini. Plus de gemme à l'entrée : il attend (« 💤 attend des gemmes à la joaillerie »).
- **Le temps d'un bijou** = `SECONDES_PAR_BIJOU` (10 s) ÷ (outils × rareté × bonus du générateur × bonus de la boutique) (`vitesseJoaillier`) :
  - **l'électricité** : dans le rayon du générateur allumé (son centre dans le cercle, `atelierAlimente`), + 30 % à + 100 % ;
  - **« 👷 Employés × 2 »** (boutique des gemmes, ou le cadeau du jour) : deux fois plus vite (`multiplicateurEmployes`).
- Un joaillier commun au niveau 1 qui taille des saphirs ajoute 0,1 × 180 = **18 $/s**, pour 5 $/s de salaire.
- **L'entrée et la réserve** ont le même nombre de places (`stock`). Entrée pleine : on ne peut plus rien apporter, et les wagonnets repartent avec ce qui n'a pas trouvé de place.
- **Il n'y a qu'une seule joaillerie**.
- **Hors ligne** : les joailliers continuent de tailler tant qu'ils sont payés (**8 heures au plus**). Au retour, **sa réserve est vendue toute seule** avec le coffre de la mine (`vendreCoffreAuRetour`).

## Les trajets de wagonnets

Trois trajets touchent la joaillerie (voir [mine.md](mine.md#les-wagonnets) et [../jeu/village.md](../jeu/village.md#4-les-rails-et-les-trajets-de-wagonnets)). Pour qu'un trajet roule tout seul, il faut **un pousseur** embauché au Personnel pour lui :

| Trajet | Ce que fait le wagonnet |
|---|---|
| 🏪 **Mine → Joaillerie** | il apporte les gemmes **choisies** du coffre de la mine, sans dépasser la place de l'entrée (les plus chères d'abord, sauf ce qu'on garde 📌). |
| 🏪 **Foreuse → Joaillerie** | la même chose, depuis le chariot de la foreuse. |
| 💍 **Joaillerie → Marché** | il emporte les bijoux choisis de la réserve et les vend au marché. |

- **La fenêtre du trajet** vers la joaillerie dit « Ce qu'il apporte » : les tuiles des gemmes que sort la mine (vertes = il les emporte, grises = elles restent au départ), puis, **grisées avec ✖ « Refusé ici »**, les autres minerais (`objetsRefuses`) ; « Vert : il l'apporte à la joaillerie. Gris : il reste au départ. La joaillerie ne taille que les gemmes. »
- **À l'arrivée** (`livrerAtelier`), la joaillerie prend ce qu'elle accepte tant qu'il y a de la place ; le reste repart au départ.
- **Le partage avec le marché** (`reservePourLesAteliers`) : si Mine → Joaillerie (ou Foreuse → Joaillerie) a un pousseur, le wagonnet vers le marché laisse au départ les gemmes choisies pour la joaillerie, autant qu'il reste de place à son entrée. Quand elle est pleine, le reste part au marché.

## Lien avec le reste du jeu

- **Missions** (`missions.ts`, `objectifs.ts`) : « Construis : Joaillerie » dès le niveau 6 de la mine ; une fois posée, « Embauche un joaillier au Personnel : il taillera les gemmes », puis « Relie la joaillerie à la mine (rails) : les gemmes y iront toutes seules », « Touche la bulle 🛤️ sur les rails mine → joaillerie », « Relie la joaillerie au marché (rails) : ses bijoux s'y vendront tout seuls » et « Touche la bulle 🛤️ sur les rails joaillerie → marché ». Dans les achats possibles : « Joaillerie niveau *N* » et « Embaucher un joaillier ».
- **Revenus** (`revenu.ts`) : le « $/s » du bandeau compte **ce qu'elle ajoute** (`plusValueParSeconde` : les bijoux par seconde × la différence moyenne entre le bijou et sa gemme, selon ce qui attend à l'entrée) ; le bilan a une ligne « 💍 La joaillerie » dans les gains et « 💍 Salaires des joailliers » dans les dépenses.
- **Succès** : « 💍 Joaillier » : tailler ton premier bijou (`joaillerie.fabriques`).
- **Le marché** montre les prix des bijoux (« Prix du marché ») une fois la joaillerie construite.
- **Bot de simulation** (`bot.ts`) : il la pose en (26, 8) dès le niveau 6 de la mine, embauche un joaillier dès qu'un établi est libre (avec une paie d'avance), y apporte à la main toutes ses gemmes (sauf ce qu'il garde pour ses achats), l'améliore quand il a 1,5 fois le prix et vend sa réserve. Mesuré le 26/10 : environ 400 bijoux par partie (de 370 à 1 600), joaillerie au niveau 1 à la fin.
- **Anciennes parties** : une partie de la version 29 (d'avant le 26/10) reçoit une joaillerie vide, pas encore posée (`convertirVersion29`, `nouvelAtelier`).

## Fichiers du code

- `src/jeu/ateliers.ts` : toutes les règles (ce qu'elle accepte, ses niveaux `infoJoaillerie`, `ameliorerAtelier`, l'entrée `placeEntree` / `livrerAtelier` / `apporterAuAtelier`, la vente `vendreSortie`, les joailliers `joailliers`, `maxJoailliers`, `vitesseJoaillier`, `joaillierAuTravail`, `gemmeEnCours`, le travail `avancerJoaillerie`, `joaillerieEnMarche`, la plus-value `plusValueParSeconde`).
- `src/jeu/employes.ts` : l'embauche (`embaucherJoaillier`, `peutEmbaucherJoaillier`, `prixEmbauche(etat, 'joaillier')`), le salaire (`salaireEmploye`), `bijouxParMinute`, le remplacement, le licenciement, et sa marche jusqu'à son établi (`maisonDe`, étape `taille`).
- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.joaillerie` : 150 000 $ + 40 émeraude + 30 saphir, 5 × 5, porte à droite, niveau 6 de la mine), les bijoux dans `BLOCS` (`sorte: 'bijou'`), `BIJOU_DE`, `SECONDES_PAR_BIJOU`, `NIVEAUX_JOAILLERIE`, `PALIER_JOAILLERIE`, `PRIX_EMBAUCHE_JOAILLIER`, `SALAIRE_JOAILLIER`, les trajets dans `LIAISONS`.
- `src/jeu/mineur.ts` : le type `Atelier`, `nouvelAtelier()`, le rôle `'joaillier'` et l'étape `'taille'` d'un `Employe`.
- `src/jeu/wagonnet.ts` : les trajets vers la joaillerie et depuis la joaillerie (`atelierDArrivee`, `stockDuDepart`, `objetsAuChoix`, `objetsRefuses`, `reservePourLesAteliers`).
- `src/jeu/generateur.ts` : `atelierAlimente` ; `src/jeu/gemmes.ts` : `multiplicateurEmployes`.
- `src/jeu/temps.ts` : `avancerJoaillerie` à chaque tic ; `src/jeu/absence.ts` : la réserve vendue au retour.
- `src/jeu/production.ts`, `src/jeu/revenu.ts`, `src/jeu/notifications.ts`, `src/jeu/missions.ts`, `src/jeu/objectifs.ts`, `src/jeu/succes.ts`, `src/jeu/niveaux.ts` : chariot du wagonnet, revenus, bulles, missions, achats, succès, paliers.
- `src/jeu/ateliers.test.ts` : les tests.
- `src/composants/PanneauxAteliers.tsx` (`PanneauJoaillerie`, `Etablis`, `CeQuIlAccepte`, `Reserve`) : le panneau ; `src/composants/PanneauEmployes.tsx` (`EmbaucheJoaillier`) : la section des joailliers au Personnel ; `src/composants/VueVillage.tsx` : les joailliers devant la boutique ; `src/styles/batiments.css` : `.appel-joaillier`, les lignes « ce qu'ils taillent » et les tuiles refusées.
- `public/images/batiments/joaillerie.svg` : le dessin, fabriqué par `node outils/art/fabriquer.mjs` (`joaillerie()` dans `outils/art/batiments.mjs`, voir son LISEZMOI) ; les icônes 🏪, 📿, 🧿, 🫅 et 💍 dans `outils/icones/dessins.py`.
