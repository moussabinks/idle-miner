# 💎 Les gemmes et les récompenses

> Depuis la **grande mise à jour du 25/10**, le jeu a une deuxième monnaie : les **gemmes** (💎). On en gagne en regardant une **publicité**, en **montant de niveau** et avec le **cadeau du jour** ; on les dépense pour **payer une amélioration** sans argent ni minerais, ou à la **boutique** (des bonus pour un temps, ou un trésor). Au retour d'une absence, une publicité **double** ce que l'absence a rapporté.
> Écrit d'après le code au 25/10 : les règles sont dans `src/jeu/gemmes.ts` (et `doublerAbsence` dans `src/jeu/absence.ts`), les écrans dans `src/composants/Boutique.tsx`, `RecompensesQuotidiennes.tsx`, `Publicite.tsx`, `FenetreAbsence.tsx` et `Amelioration.tsx`, et la publicité de CrazyGames dans `src/portail.ts`.

**La règle d'or** : les publicités restent **toujours au choix**. Elles font gagner du temps, jamais elles ne débloquent la progression : tout ce qu'on achète en gemmes s'achète aussi avec de l'argent, avec les mêmes cadenas (niveau du joueur, palier de la mine).

---

## 1. Gagner des gemmes

| Comment | Combien | Code |
|---|---:|---|
| 📺 Regarder une **publicité** jusqu'au bout | **1 💎** | `GEMMES_PAR_PUB`, `recompenserPub` |
| 📺 (27/10) Le rond violet **💰 Ventes × 2**, en bas à côté de la mine | pas de gemme : les **ventes × 2 pendant 10 min** (une seule à la fois ; le rond montre le temps qui reste) | `recompenserPubVentes`, `BoutonPubVentes` (`PubsProposees.tsx`) |
| 📺 (27/10) Après un **achat en gemmes**, la fenêtre « Une amélioration offerte ? » | pas de gemme : la **prochaine amélioration offerte**, au choix (voir 2) | `offrirAmelioration`, `PropositionPub` |
| ⭐ Gagner un **niveau du joueur** | **1 💎** par niveau (14 du niveau 2 au niveau 15 ; 3 avant le 25/10) | `GEMMES_PAR_NIVEAU`, dans `mettreAJourXp` (`niveaux.ts`) |
| 🎁 Le **cadeau du jour** | 2 à 12 💎 selon le jour de la série (35 par semaine), plus des bonus | `RECOMPENSES_QUOTIDIENNES` |
| 🎉 Une **ancienne partie** convertie le 25/10 | 10 💎 offertes (une fois) | `GEMMES_CADEAU` dans `sauvegarde.ts` |
| 💶 **Acheter un pack** avec de l'argent réel (25/10) | 10, 30, 60 ou 100 💎 | `PACKS_GEMMES`, `crediterPack` |

### Les packs de gemmes (argent réel, 25/10)

Dans la boutique, sous la publicité, la section **« Acheter des gemmes »** : quatre cartes (deux par ligne sur téléphone). Prix du propriétaire :

| Pack | Prix | En plus, par rapport au petit pack (`bonusPack`) |
|---|---:|---:|
| 10 💎 | 1,99 € | — |
| 30 💎 (« Populaire ») | 4,99 € | +20 % |
| 60 💎 | 6,99 € | +71 % |
| 100 💎 (« Meilleure offre ») | 8,99 € | +121 % |

Les prix s'écrivent à la façon de la langue (`prixEuros` dans `langue.ts` : « 1,99 € », « €1.99 »). Toucher une carte ouvre la fenêtre de paiement (`Paiement.tsx`).

⚠️ **Pas de moyen de paiement à nous** (décision du propriétaire, 25/10) : le jeu est préparé pour **CrazyGames**, dont la boutique (Xsolla) gère tout le paiement. Elle est **sur invitation** (il faut la demander à CrazyGames) et réservée aux joueurs **connectés** à leur compte CrazyGames. En attendant (`PAIEMENT_SIMULE` dans `src/portail.ts`) :
- **sur le site, les packs se montrent** (27/10, demandé par le propriétaire : la boutique doit avoir l'air prête) ; **sur CrazyGames, ils sont retirés** (27/10) : une carte « 🔒 Bientôt disponible » à leur place (`AVEC_PACKS` dans `src/portail.ts`). Sur le site, la fenêtre de paiement s'ouvre, mais son bouton dit « 🔒 Bientôt disponible » et ne fait rien : aucun argent pris, aucune gemme donnée (« Les achats de gemmes arrivent très bientôt ! ») ;
- pendant le développement (`npm run dev`), le **paiement est simulé** (« aucun argent n'est pris ») et donne les gemmes, pour tester la boutique.

Le jour où CrazyGames ouvre sa boutique au jeu : déclarer les 4 packs chez eux, appeler leur boutique dans `Paiement.tsx` à la place du paiement simulé (puis `crediterPack`), et montrer les packs seulement aux joueurs connectés.

Une nouvelle partie commence avec **0 gemme**. Le nombre de gemmes est affiché dans le bandeau du haut (case 💎) : la toucher ouvre la boutique. Le message d'un passage de niveau le dit : « 🎉 Niveau 4 ! +1 💎 ».

### La publicité

- **Pour l'instant, c'est une fausse publicité** (`Publicite.tsx`) : un écran noir et un compte à rebours de **30 secondes** (`SECONDES_PUB`), puis le bouton de la récompense. Quitter avant la fin ne donne rien. Elle sert à tester le jeu sans régie de publicité.
- **Dans la version CrazyGames** (`VITE_PORTAIL=crazygames`, voir [architecture.md](architecture.md)), c'est la vraie **publicité récompensée** de leur SDK (`pubRecompensee` dans `src/portail.ts`) ; la récompense n'arrive que si elle a été vue jusqu'au bout. Sans SDK (en local, sur Vercel), on retombe sur la fausse publicité. ⚠️ Le branchement au vrai SDK n'a pas encore été testé.
- Pendant une publicité, les sons et la musique se taisent.
- Côté code, un composant demande une publicité avec `regarderPub(quandFinie)` (donné par `useJeu()`, `src/composants/contexteJeu.ts`) : `quandFinie` n'est appelé que si elle a été regardée jusqu'au bout.

## 2. Payer une amélioration en gemmes

Chaque ligne d'amélioration (`Amelioration.tsx`) a **deux boutons** : le vert, avec le prix en argent et en minerais, et le **violet 💎**, avec le prix en gemmes. Payer en gemmes ne prend **ni argent, ni minerais**. Les conditions restent les mêmes : il faut le **palier de la mine** (ou le niveau du joueur) qu'il faut pour cette amélioration.

**Le prix en gemmes, depuis le 27/10** (demandé par le propriétaire) va de **1 à 3 gemmes** (`GEMMES_MIN`, `GEMMES_MAX` ; du 26/10 au 27/10 : de 2 à 10), **par proportionnalité** : on prend toutes les améliorations que le joueur peut faire en ce moment (débloquées à son palier, pas encore au maximum : `achatsPossibles` sans les constructions ; `bornesGemmes` dans `src/jeu/prixGemmes.ts`). La **moins chère** (en dollars, `valeurEnDollars`) coûte **1 gemme**, la **plus chère 3 gemmes**, et les autres entre les deux, en proportion de leur prix :

```
prix en gemmes = arrondi( 1 + 2 × (valeur − la moins chère) / (la plus chère − la moins chère) ), entre 1 et 3
```

Un achat hors de ces bornes (une réparation, un bâtiment) reste entre 1 et 3. Le prix affiché est calculé avant l'achat, et c'est celui qui est payé. Sans bornes (une seule amélioration possible) : `arrondi(1 + 0,5 × (log10(valeur en $) − 2))`, entre 1 et 3 (100 $ → 1 💎, 1 000 $ → 2 💎, 1 million → 3 💎).

**L'amélioration offerte (27/10, demandé par le propriétaire)** : juste après une amélioration payée en gemmes (`payer`, dans `mineur.ts`, met `propositionPub`), une fenêtre propose **« Une amélioration offerte ? »** (`PropositionPub`, `src/composants/PubsProposees.tsx`). Si le joueur regarde la publicité jusqu'au bout (`offrirAmelioration`), sa **prochaine amélioration est gratuite, celle qu'il veut** (`ameliorationOfferte`) : tous les boutons violets deviennent **« 🎁 Offert »**, et le premier achat fait avec (`acheterGratuitement`) ne coûte rien (ni argent, ni minerais, ni gemmes), avec les mêmes cadenas qu'un achat normal. Elle ne sert qu'une fois, et elle reste là tant qu'elle n'a pas servi (même après avoir fermé le jeu). « Non merci » ferme la fenêtre ; on n'en reparle qu'au prochain achat en gemmes, et jamais tant qu'une amélioration offerte attend.

**Du 26/10 au 27/10** : de 2 à 10 gemmes, avec la même proportion (`arrondi(2 + 8 × ...)`).

**Avant le 26/10** : le prix en gemmes (`prixEnGemmes`, revu le 25/10) allait de **3 gemmes** (une petite amélioration) à **10 gemmes** (la plus grosse) : il faut regarder **3 à 10 publicités** pour payer une amélioration. Il dépend de ce que vaut l'achat en dollars (`valeurEnDollars` : l'argent, plus chaque minerai à son prix au marché) :

```
prix en gemmes = arrondi( 3 + 2,4 × (log10(valeur en $) − 2) ), entre 3 et 10
```

Autrement dit : 2,4 gemmes de plus chaque fois que le prix est multiplié par 10 (25/10, économie revue : avant 2), pour que les prix plus bas de la fin de partie coûtent toujours jusqu'à 10 gemmes. Avant, le prix suivait la racine carrée de la valeur et dépassait 100 gemmes en fin de partie.

| Achat | Valeur | Prix en gemmes |
|---|---:|---:|
| Premier mineur | 50 $ | 3 💎 |
| Coffre de 300 places (200 $ + 40 pierre) | 240 $ | 4 💎 |
| Pioche en fer (300 $ + 20 fer) | 540 $ | 5 💎 |
| Une amélioration à 1 000 $ | 1 000 $ | 5 💎 |
| Mine niveau 2 (800 $ + 40 fer) | 1 280 $ | 6 💎 |
| Mine niveau 3 (6 000 $ + 100 fer + 40 redstone) | 7 800 $ | 8 💎 |
| Une amélioration à 20 000 $ | 20 000 $ | 9 💎 |
| Générateur niveau 5 (70 000 $ + 800 fer + 700 redstone, 26/10) | 90 100 $ | 10 💎 |
| Mine niveau 5 (160 000 $ + 180 or + 70 émeraudes, 26/10) | 171 900 $ | 10 💎 |
| Mine niveau 7 (2 400 000 $ + 240 saphirs + 150 rubis, 26/10) | 2 454 300 $ | 10 💎 |

(26/10) Avec les niveaux 6 et 7, beaucoup d'achats de fin de partie dépassent largement 51 000 $ (la joaillerie niveau 5 : 2 100 000 $ + 75 diamants, hausse de la fin de partie comprise) : ils coûtent tous **10 💎**, le plafond. Les lingots et les bijoux d'un prix comptent à leur prix de vente (`valeurEnDollars`).

Côté code : une action d'achat ordinaire (agrandir le coffre, embaucher…) est lancée dans `acheterAvecGemmes(() => action)` (`mineur.ts`) : pendant ce temps, `payer` retire des gemmes au lieu de l'argent et des minerais. `peutPayerEnGemmes` dit si on en a assez.

## 3. La boutique des gemmes (`Boutique.tsx`)

On l'ouvre en touchant la case 💎 du bandeau. En haut, le solde de gemmes et un bouton **📺 +1 💎** pour regarder une publicité. Dessous, les **bonus** (`BOOSTS`), **3 💎 chacun** (25/10, prix du propriétaire ; plus de trésor) :

| Bonus | Effet | Durée | Prix |
|---|---|---:|---:|
| ⚡ **Production × 2** | La mine (ce qu'elle sort toute seule) et la foreuse creusent deux fois plus vite, et (26/10) la fonderie fond deux fois plus vite (`multiplicateurProduction`). | 15 min | 3 💎 |
| 💰 **Ventes × 2** | Tout ce qu'on vend rapporte le double : le coffre, le chariot de la foreuse, la réserve des ateliers (26/10) et les wagonnets (`multiplicateurVentes`, dans `valeurDe`). | 15 min | 3 💎 |
| 👷 **Employés × 2** | Les mineurs creusent, les pousseurs poussent et (26/10) les joailliers taillent deux fois plus vite (`multiplicateurEmployes`). | 15 min | 3 💎 |
| ⛏️ **Fortune** (`clics`, avant « Clics en or ») | Chaque clic sur le bloc de la mine donne **3 blocs** au lieu d'un (en plus du doublement et des bonus de combo). | 5 min | 3 💎 |

- Acheter un bonus **déjà en cours** ajoute sa durée à ce qui reste (`prolongerBoost`).
- La durée se compte en **temps de jeu** (`stats.tempsDeJeu`) : elle s'use aussi pendant l'absence (le jeu rattrape l'absence en faisant avancer le temps). Un bonus est rangé dans la partie (`etat.boosts` : pour chaque bonus, l'heure de jeu où il s'arrête).
- Le message : « ⚡ Production × 2 pendant 15 min ! ».

## 4. Le cadeau du jour (`RecompensesQuotidiennes.tsx`)

Un **calendrier de 7 jours**. Chaque jour où l'on revient, on ouvre le cadeau du jour. Revenir **le lendemain** fait avancer la **série** ; **un jour manqué**, et elle repart au jour 1. Après le jour 7 (le **gros lot**), on recommence au jour 1.

- **Quand** : le cadeau s'ouvre **tout seul une fois** en arrivant dans le jeu, s'il est disponible (après le tutoriel, et après la fenêtre du retour). Sinon, un bouton rond jaune 🎁 (qui attire l'œil quand le cadeau attend) le rouvre.
- **Le jour** compte à l'heure du joueur (`jourDe` : « 2026-10-25 »). La partie garde le dernier jour pris et la série (`etat.quotidien`, `etatQuotidien`, `recupererQuotidien`).
- **Pas d'argent** (25/10, à la demande du propriétaire) : 3 000 $ au jour 3 ne valaient plus rien trois jours plus tard. Chaque jour donne des **gemmes** et au moins un **bonus** de la boutique (les bonus s'ajoutent au temps qui reste).
- **La fenêtre** : chaque case montre en petit « 🎁 Jour 3 » sur une ligne, puis **en grand** les gemmes et les bonus (« ⚡ ×2 / 15 min », `court` dans `BOOSTS`) ; une légende explique les bonus sous les cases. L'ouverture est animée (rayons, paquet qui saute, récompenses qui sortent).

| Jour | Gemmes | Bonus |
|---:|---:|---|
| 1 | 2 💎 | 👷 Employés × 2 10 min |
| 2 | 3 💎 | 💰 Ventes × 2 15 min |
| 3 | 3 💎 | ⚡ Production × 2 15 min |
| 4 | 4 💎 | 💰 Ventes × 2 30 min |
| 5 | 5 💎 | ⚡ Production × 2 30 min |
| 6 | 6 💎 | 💰 Ventes × 2 30 min + 👷 Employés × 2 30 min |
| **7** | **12 💎** | ⚡ **Production × 2 60 min** + 💰 **Ventes × 2 60 min** |

Une semaine complète rapporte **35 gemmes**. Message : « 🎁 Jour 3 : +3 💎 ! ».

## 5. Le retour d'absence × 2 (`FenetreAbsence.tsx`, `absence.ts`)

Quand on rouvre un monde, le jeu rattrape le temps passé (8 h au plus) et la fenêtre **« Bon retour, mineur ! »** résume l'absence (voir [mine-et-minage.md](mine-et-minage.md#hors-ligne-au-chargement-dun-monde)). Depuis le 25/10 :

- elle affiche en grand le **bénéfice net** (25/10, demandé par le propriétaire : l'argent en plus dans la poche, salaires déduits ; avant, c'était le chiffre d'affaires). Au retour, le **coffre de la mine est vendu tout seul** (`vendreCoffreAuRetour`, sauf ce qu'on garde 📌). Les lignes de l'argent tombent juste : 🚃 ventes des wagonnets + 📦 coffre vendu au retour + 💰 autres ventes (surtout le manager qui vend du coffre pour payer les salaires) − 💵 salaires payés = bénéfice net (`resume.net`) ;
- deux boutons : **📺 Doubler · +X $** (violet : une publicité, puis `doublerAbsence` encaisse **une deuxième fois** le bénéfice net, s'il est positif, en argent, comptés dans l'argent gagné) et **Continuer** ;
- elle rappelle aussi les employés qui attendent leur salaire, et combien de temps le manager paie avant de s'endormir.

## 6. Fichiers du code

| Fichier | Rôle |
|---|---|
| `src/jeu/gemmes.ts` | Toutes les règles : gagner des gemmes (`gagnerGemmes`, `recompenserPub`), le prix en gemmes (`valeurEnDollars`, `prixEnGemmes`), les bonus (`BOOSTS`, `acheterBoost`, `boostActif`, `secondesBoost`, `multiplicateurVentes`, `multiplicateurProduction`), le trésor (`TRESOR`, `acheterTresor`), le cadeau du jour (`RECOMPENSES_QUOTIDIENNES`, `etatQuotidien`, `recupererQuotidien`, `jourDe`, `veille`). Testé dans `gemmes.test.ts`. |
| `src/jeu/mineur.ts` | Les champs `gemmes`, `boosts` et `quotidien` de `EtatJeu` ; `acheterAvecGemmes`, `peutPayerEnGemmes` ; les bonus dans le clic (`cliquerMine`), le débit de la mine (`debitMine`) et les ventes (`valeurDe`). |
| `src/jeu/niveaux.ts` | La gemme de chaque niveau gagné (`mettreAJourXp`). |
| `src/jeu/absence.ts` | `vendreCoffreAuRetour`, `resume.net` (le bénéfice net), `resume.gains` et `doublerAbsence`. |
| `src/composants/Boutique.tsx` | La boutique (publicité, packs de gemmes, bonus). |
| `src/composants/Paiement.tsx` | La fenêtre de paiement d'un pack (simulée pendant le développement). |
| `src/composants/RecompensesQuotidiennes.tsx` | Le calendrier du cadeau du jour. |
| `src/composants/Publicite.tsx` | La fausse publicité de 30 s. |
| `src/composants/Amelioration.tsx` | Le bouton violet 💎 de chaque amélioration. |
| `src/composants/contexteJeu.ts` | `useJeu()` : la partie, `jouer`, `regarderPub` et `ouvrirBoutique`. |
| `src/portail.ts` | La publicité récompensée du SDK de CrazyGames (`pubRecompensee`, `sdkDisponible`). |
| `src/styles/gemmes.css` | Le style de la boutique, du cadeau du jour et de la publicité. |
