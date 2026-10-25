# 💎 Les gemmes et les récompenses

> Depuis la **grande mise à jour du 25/10**, le jeu a une deuxième monnaie : les **gemmes** (💎). On en gagne en regardant une **publicité**, en **montant de niveau** et avec le **cadeau du jour** ; on les dépense pour **payer une amélioration** sans argent ni minerais, ou à la **boutique** (des bonus pour un temps, ou un trésor). Au retour d'une absence, une publicité **double** ce que l'absence a rapporté.
> Écrit d'après le code au 25/10 : les règles sont dans `src/jeu/gemmes.ts` (et `doublerAbsence` dans `src/jeu/absence.ts`), les écrans dans `src/composants/Boutique.tsx`, `RecompensesQuotidiennes.tsx`, `Publicite.tsx`, `FenetreAbsence.tsx` et `Amelioration.tsx`, et la publicité de CrazyGames dans `src/portail.ts`.

**La règle d'or** : les publicités restent **toujours au choix**. Elles font gagner du temps, jamais elles ne débloquent la progression : tout ce qu'on achète en gemmes s'achète aussi avec de l'argent, avec les mêmes cadenas (niveau du joueur, palier de la mine).

---

## 1. Gagner des gemmes

| Comment | Combien | Code |
|---|---:|---|
| 📺 Regarder une **publicité** jusqu'au bout | **1 💎** | `GEMMES_PAR_PUB`, `recompenserPub` |
| ⭐ Gagner un **niveau du joueur** | **3 💎** par niveau (42 du niveau 2 au niveau 15) | `GEMMES_PAR_NIVEAU`, dans `mettreAJourXp` (`niveaux.ts`) |
| 🎁 Le **cadeau du jour** | 2 à 12 💎 selon le jour de la série (35 par semaine), plus des bonus | `RECOMPENSES_QUOTIDIENNES` |
| 🎉 Une **ancienne partie** convertie le 25/10 | 10 💎 offertes (une fois) | `GEMMES_CADEAU` dans `sauvegarde.ts` |

Une nouvelle partie commence avec **0 gemme**. Le nombre de gemmes est affiché dans le bandeau du haut (case 💎) : la toucher ouvre la boutique. Le message d'un passage de niveau le dit : « 🎉 Niveau 4 ! +3 💎 ».

### La publicité

- **Pour l'instant, c'est une fausse publicité** (`Publicite.tsx`) : un écran noir et un compte à rebours de **30 secondes** (`SECONDES_PUB`), puis le bouton de la récompense. Quitter avant la fin ne donne rien. Elle sert à tester le jeu sans régie de publicité.
- **Dans la version CrazyGames** (`VITE_PORTAIL=crazygames`, voir [architecture.md](architecture.md)), c'est la vraie **publicité récompensée** de leur SDK (`pubRecompensee` dans `src/portail.ts`) ; la récompense n'arrive que si elle a été vue jusqu'au bout. Sans SDK (en local, sur Vercel), on retombe sur la fausse publicité. ⚠️ Le branchement au vrai SDK n'a pas encore été testé.
- Pendant une publicité, les sons et la musique se taisent.
- Côté code, un composant demande une publicité avec `regarderPub(quandFinie)` (donné par `useJeu()`, `src/composants/contexteJeu.ts`) : `quandFinie` n'est appelé que si elle a été regardée jusqu'au bout.

## 2. Payer une amélioration en gemmes

Chaque ligne d'amélioration (`Amelioration.tsx`) a **deux boutons** : le vert, avec le prix en argent et en minerais, et le **violet 💎**, avec le prix en gemmes. Payer en gemmes ne prend **ni argent, ni minerais**. Les conditions restent les mêmes : il faut le **palier de la mine** (ou le niveau du joueur) qu'il faut pour cette amélioration.

**Le prix en gemmes** (`prixEnGemmes`) dépend de ce que vaut l'achat en dollars (`valeurEnDollars` : l'argent, plus chaque minerai à son prix au marché) :

```
prix en gemmes = arrondi( racine carrée(valeur en $) ÷ 5 ), au moins 1
```

La racine carrée fait que les gros achats coûtent **beaucoup moins de gemmes, en proportion**, que les petits : une gemme vaut environ 25 $ au début, et plus de 2 000 $ à la fin.

| Achat | Valeur | Prix en gemmes |
|---|---:|---:|
| Premier mineur | 50 $ | 1 💎 |
| Coffre de 300 places (200 $ + 40 pierre) | 240 $ | 3 💎 |
| Pioche en fer (300 $ + 20 fer) | 540 $ | 5 💎 |
| Une amélioration à 1 000 $ | 1 000 $ | 6 💎 |
| Mine niveau 2 (800 $ + 40 fer) | 1 280 $ | 7 💎 |
| Mine niveau 3 (12 000 $ + 100 fer + 40 redstone) | 13 800 $ | 23 💎 |
| Une amélioration à 80 000 $ | 80 000 $ | 57 💎 |
| Générateur niveau 5 (100 000 $ + 400 fer + 350 redstone) | 110 050 $ | 66 💎 |
| Mine niveau 5 (320 000 $ + 90 or + 35 émeraudes) | 325 950 $ | 114 💎 |

Côté code : une action d'achat ordinaire (agrandir le coffre, embaucher…) est lancée dans `acheterAvecGemmes(() => action)` (`mineur.ts`) : pendant ce temps, `payer` retire des gemmes au lieu de l'argent et des minerais. `peutPayerEnGemmes` dit si on en a assez.

## 3. La boutique des gemmes (`Boutique.tsx`)

On l'ouvre en touchant la case 💎 du bandeau. En haut, le solde de gemmes et un bouton **📺 +1 💎** pour regarder une publicité. Dessous, les **bonus** (`BOOSTS`) et le **trésor** (`TRESOR`) :

| Bonus | Effet | Durée | Prix |
|---|---|---:|---:|
| ⚡ **Production × 2** | La mine (ce qu'elle sort toute seule), les mineurs et la foreuse creusent deux fois plus vite (`multiplicateurProduction`). | 15 min | 8 💎 |
| 💰 **Ventes × 2** | Tout ce qu'on vend rapporte le double : le coffre, le chariot de la foreuse et les wagonnets (`multiplicateurVentes`, dans `valeurDe`). | 10 min | 8 💎 |
| 👆 **Clics en or** | Chaque clic sur le bloc de la mine en casse **3** (en plus du doublement et des bonus de combo). | 5 min | 4 💎 |
| 💰 **Trésor** | Un tas de pièces tout de suite, selon le palier de la mine : **600 $, 3 500 $, 14 000 $, 45 000 $ ou 140 000 $** (mine niveau 1 à 5, `argentTresor`). | — | 10 💎 |

- Acheter un bonus **déjà en cours** ajoute sa durée à ce qui reste (`prolongerBoost`).
- La durée se compte en **temps de jeu** (`stats.tempsDeJeu`) : elle s'use aussi pendant l'absence (le jeu rattrape l'absence en faisant avancer le temps). Un bonus est rangé dans la partie (`etat.boosts` : pour chaque bonus, l'heure de jeu où il s'arrête).
- Le message : « ⚡ Production × 2 pendant 15 min ! », « 💰 Trésor : +3 500 $ ! ».

## 4. Le cadeau du jour (`RecompensesQuotidiennes.tsx`)

Un **calendrier de 7 jours**. Chaque jour où l'on revient, on ouvre le cadeau du jour. Revenir **le lendemain** fait avancer la **série** ; **un jour manqué**, et elle repart au jour 1. Après le jour 7 (le **gros lot**), on recommence au jour 1.

- **Quand** : le cadeau s'ouvre **tout seul une fois** en arrivant dans le jeu, s'il est disponible (après le tutoriel, et après la fenêtre du retour). Sinon, un bouton rond jaune 🎁 (qui attire l'œil quand le cadeau attend) le rouvre.
- **Le jour** compte à l'heure du joueur (`jourDe` : « 2026-10-25 »). La partie garde le dernier jour pris et la série (`etat.quotidien`, `etatQuotidien`, `recupererQuotidien`).
- **Pas d'argent** (25/10, à la demande du propriétaire) : 3 000 $ au jour 3 ne valaient plus rien trois jours plus tard. Chaque jour donne des **gemmes** et au moins un **bonus** de la boutique (les bonus s'ajoutent au temps qui reste).
- **La fenêtre** : chaque case montre en petit « 🎁 Jour 3 » sur une ligne, puis **en grand** les gemmes et les bonus (« ⚡ ×2 / 15 min », `court` dans `BOOSTS`) ; une légende explique les bonus sous les cases. L'ouverture est animée (rayons, paquet qui saute, récompenses qui sortent).

| Jour | Gemmes | Bonus |
|---:|---:|---|
| 1 | 2 💎 | 👆 Clics en or 10 min |
| 2 | 3 💎 | 💰 Ventes × 2 15 min |
| 3 | 3 💎 | ⚡ Production × 2 15 min |
| 4 | 4 💎 | 💰 Ventes × 2 30 min |
| 5 | 5 💎 | ⚡ Production × 2 30 min |
| 6 | 6 💎 | 💰 Ventes × 2 30 min + 👆 Clics en or 15 min |
| **7** | **12 💎** | ⚡ **Production × 2 60 min** + 💰 **Ventes × 2 60 min** |

Une semaine complète rapporte **35 gemmes**. Message : « 🎁 Jour 3 : +3 💎 ! ».

## 5. Le retour d'absence × 2 (`FenetreAbsence.tsx`, `absence.ts`)

Quand on rouvre un monde, le jeu rattrape le temps passé (8 h au plus) et la fenêtre **« Bon retour, mineur ! »** résume l'absence (voir [mine-et-minage.md](mine-et-minage.md#hors-ligne-au-chargement-dun-monde)). Depuis le 25/10 :

- elle affiche en grand **tout ce que l'absence a rapporté** (`resume.gains`) : l'argent gagné (les wagonnets qui ont vendu au marché), **plus la valeur de ce qui attend en plus** dans le coffre de la mine et le chariot de la foreuse (à leur prix au marché) ;
- deux boutons : **📺 Doubler · +X $** (violet : une publicité, puis `doublerAbsence` encaisse **une deuxième fois** ces gains, en argent, comptés dans l'argent gagné) et **Continuer** ;
- elle rappelle aussi les employés qui attendent leur salaire, et combien de temps le manager paie avant de s'endormir.

## 6. Fichiers du code

| Fichier | Rôle |
|---|---|
| `src/jeu/gemmes.ts` | Toutes les règles : gagner des gemmes (`gagnerGemmes`, `recompenserPub`), le prix en gemmes (`valeurEnDollars`, `prixEnGemmes`), les bonus (`BOOSTS`, `acheterBoost`, `boostActif`, `secondesBoost`, `multiplicateurVentes`, `multiplicateurProduction`), le trésor (`TRESOR`, `acheterTresor`), le cadeau du jour (`RECOMPENSES_QUOTIDIENNES`, `etatQuotidien`, `recupererQuotidien`, `jourDe`, `veille`). Testé dans `gemmes.test.ts`. |
| `src/jeu/mineur.ts` | Les champs `gemmes`, `boosts` et `quotidien` de `EtatJeu` ; `acheterAvecGemmes`, `peutPayerEnGemmes` ; les bonus dans le clic (`cliquerMine`), le débit de la mine (`debitMine`) et les ventes (`valeurDe`). |
| `src/jeu/niveaux.ts` | Les 3 gemmes de chaque niveau gagné (`mettreAJourXp`). |
| `src/jeu/absence.ts` | `resume.gains` et `doublerAbsence`. |
| `src/composants/Boutique.tsx` | La boutique (publicité, bonus, trésor). |
| `src/composants/RecompensesQuotidiennes.tsx` | Le calendrier du cadeau du jour. |
| `src/composants/Publicite.tsx` | La fausse publicité de 30 s. |
| `src/composants/Amelioration.tsx` | Le bouton violet 💎 de chaque amélioration. |
| `src/composants/contexteJeu.ts` | `useJeu()` : la partie, `jouer`, `regarderPub` et `ouvrirBoutique`. |
| `src/portail.ts` | La publicité récompensée du SDK de CrazyGames (`pubRecompensee`, `sdkDisponible`). |
| `src/styles/gemmes.css` | Le style de la boutique, du cadeau du jour et de la publicité. |
