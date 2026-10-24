# Mega Digger — check-up avant CrazyGames

24 oct. 2026 · Raph

Le jeu est beau et riche, mais trop chargé et pas encore prêt pour l'iframe de CrazyGames. Trois chantiers d'abord : la compatibilité CrazyGames (stockage, chemins, SDK), un début de partie plus court et plus clair, et un vrai but après le niveau 15. Revue faite sur le code (commit 1536690) et en jouant : nouveau monde, partie à 2 h et à 8 h (bot), ordinateur 1280 × 800 et téléphone 390 × 844.

## 1. Bloquants CrazyGames

CrazyGames lance le jeu dans une iframe, sur un autre domaine. Plusieurs choses vont casser ou être refusées à la revue. Les règles CrazyGames ci-dessous sont de mémoire (leur site n'était pas joignable d'ici) : à revérifier sur docs.crazygames.com.

| Problème | Où | Risque | Correctif |
| --- | --- | --- | --- |
| `window.localStorage` lu en direct, hors try/catch | `usePartie.ts:74-78, 226`, `Accueil.tsx:73-193` | Stockage bloqué en iframe tierce (Safari, navigation privée) = écran blanc | Un seul objet `stockage` sûr (try/catch, repli en mémoire), branché ensuite sur le module Data du SDK |
| Chemins absolus `/images`, `/fonts`, `/sw.js` (37 endroits), pas de `base` dans Vite | `vite.config.ts`, composants | Tout casse si le jeu est servi dans un sous-dossier | `base: './'` et chemins via `import.meta.env.BASE_URL` |
| Service worker, manifest, carte « Installer l'appli » | `installation.ts`, `CarteInstallation.tsx` | Interdit ou inutile sur un portail | Couper avec un drapeau de build `VITE_PORTAIL=crazygames` |
| Comptes Supabase (pseudo + mot de passe) et classement maison | `useCompte.ts`, `CarteCompte.tsx`, `CarteClassement.tsx` | CrazyGames refuse en général un login propre au jeu | Version portail : compte CrazyGames (SDK User), sauvegarde SDK Data, classement retiré ou via leur SDK |
| Google Fonts chargé depuis l'extérieur | `index.html:25` | Requête externe, police manquante hors ligne | Mettre Luckiest Guy en woff2 dans `public/fonts/` |
| `window.confirm` (recommencer, supprimer un monde, mondes à la connexion) | `App.tsx:502`, `Accueil.tsx:82`, `useCompte.ts:115` | Boîtes du navigateur bloquées dans certaines iframes | Utiliser `Confirmation.tsx` partout |
| Jeu en français seulement | tout le texte | L'audience CrazyGames est surtout anglophone : portée très réduite | Sortir les textes dans un fichier par langue, anglais d'abord |
| Pas de SDK CrazyGames | — | Pas de pubs, pas de `gameplayStart/Stop`, pas de sauvegarde cloud | Intégrer le SDK v3 (voir plus bas) |
| Meta description qui parle encore de « bedrock » | `index.html:8` | Mauvaise fiche | Mettre à jour |

Le classement à l'accueil reste sur « Chargement du classement… » sans fin quand Supabase ne répond pas (vu en test). Il faut un délai, puis un message « Hors ligne ».

**Le SDK, une chance pour la rétention.** Une pub récompensée colle très bien à un idle : « doubler les gains hors ligne », « ×2 vitesse pendant 5 min », « réveiller le manager ». Toujours en option, jamais pour débloquer la progression. Appeler `gameplayStart` quand on joue, `gameplayStop` dans les menus, et `happytime` aux grands moments (nouveau niveau de mine).

## 2. Les 5 premières minutes

Sur un portail, le joueur décide en 1 à 2 minutes s'il reste. Aujourd'hui, la première automatisation arrive trop tard et l'écran de départ en montre trop.

**Ce qui marche déjà**

- L'accueil est beau : logo, village en fond, un gros bouton « Commencer ».
- Le tutoriel est guidé par l'action (on avance en faisant, pas en lisant), avec Pépite comme mascotte.
- Le clic sur le bloc a du jus : combo « ×10 = Fortune », compteur, jauge de pioche.

**Ce qui fait partir le joueur**

1. **Rien ne tourne tout seul avant longtemps.** La mine niveau 1 ne produit rien (`debit: 0`). Le premier mineur coûte 500 $ puis 220 $ toutes les 5 minutes, soit environ 200 clics et plusieurs allers-retours à pied au marché. Le bot met 15 à 40 minutes pour la mine niveau 2. Sur CrazyGames, il faut un premier revenu passif en moins de 2 minutes. Piste : un premier mineur gratuit offert par le tutoriel, sans salaire pendant 10 minutes.
2. **Vendre demande de marcher.** Coffre → sac → marcher au marché → vendre : quatre gestes pour le geste de base d'un idle. Piste : un bouton « Vendre le coffre » direct au début (moins cher qu'au marché, par exemple 50 %), les rails restant la vraie solution.
3. **Six compteurs sans nom dès la seconde 1** (XP 0/60, argent, coffre 0/100, pioche 150/150, sac 0/32, puis mineurs). Le nouveau joueur ne sait pas lequel regarder. Piste : afficher argent et coffre seulement, et faire apparaître les autres quand ils servent (pioche quand elle s'use, sac après le marché, mineurs après le Personnel).
4. **Deux promesses différentes.** L'accueil dit « Creuse, Construis, Embauche, Automatise ». La fenêtre de bienvenue dit « Creuse, Vends, Construis, Automatise ». Garder une seule boucle de 4 mots partout.
5. **Le tutoriel s'arrête au forgeron**, avant le moment fort (embaucher). Le faire aller jusqu'au premier mineur qui remplit le coffre seul : c'est la promesse du jeu.
6. **Le texte d'accueil est long** (une phrase de 4 lignes sur téléphone). La moitié suffit : « Creuse jusqu'au cœur de diamant. Embauche. Automatise. »

**Un fil rouge simple pour la première session :** 0:00 clic → 0:30 première vente → 1:30 premier mineur → 3:00 première amélioration → 5:00 première fenêtre « niveau supérieur » avec une récompense visible. À vérifier avec le bot : ajouter ces repères dans `bot.test.ts`.

## 3. Rétention

Le jeu a de quoi tenir 6 à 9 heures, puis plus rien. Après le niveau 15 du joueur, aucun déblocage. Il n'y a pas de but final, et le classement punit la dépense.

**Ce que débloque chaque niveau du joueur** (`NIVEAU_JOUEUR_POUR`, `donnees.ts:677`)

| Niveau | Déblocage principal |
| --- | --- |
| 1 | Marché, forgeron |
| 2 | Personnel, coffre 2 |
| 3 | Bazar, rails |
| 4 | Mine niveau 2, pioche en fer |
| 5 | Foreuse |
| 6 | Générateur |
| 7 | Mine niveau 3 |
| 9 | Manager |
| 10 | Mine niveau 4 |
| 11 | Recruteur |
| 13 | Mine niveau 5 |
| 15 | Dernières améliorations |
| 16 à 30 | Rien (environ 241 000 XP à gagner pour rien, contre 38 000 jusqu'au 15) |

Les niveaux 8, 12 et 14 n'apportent que des niveaux d'amélioration. Ils paraissent vides au joueur.

**Les problèmes**

1. **Pas de fin ni de boucle longue.** Le prestige est archivé et rien ne le remplace (`CONTEXTE.md`, feuille de route 1 bis). C'est le premier moteur de rétention d'un idle. Piste : une « nouvelle mine » (un nouveau biome) qui repart de zéro avec un bonus permanent, en réutilisant le code dans `archives/`.
2. **Niveaux 16 à 30 vides.** Soit plafonner à 15, soit y mettre la boucle longue (nouvelle mine, cosmétiques, emplacements de mineurs).
3. **Le classement compte l'argent en poche** (`classement.ts:3`). Acheter fait baisser son rang : le jeu dit « dépense » et le classement dit « garde ». Classer à l'argent gagné au total (comme le dit déjà `CLAUDE.md`), ou au niveau de mine puis au temps.
4. **Le hors-ligne s'arrête vite.** Rattrapage plafonné à 8 h (`usePartie.ts:33`), mais en vrai le manager s'endort après 15 à 90 min. Sans manager, les mineurs s'arrêtent au bout de leur salaire. Le joueur revient le lendemain et trouve un jeu à l'arrêt. Piste : la fenêtre de retour montre un gros « +X $ pendant ton absence », avec « ×2 avec une pub ».
5. **Rien n'appelle à revenir demain.** Pas de cadeau du jour, pas de série de jours, pas d'objectif de session. Piste : un coffre quotidien (minerais, un mineur rare de temps en temps), 3 défis du jour tirés de la liste des tâches.
6. **Le recruteur et les raretés arrivent tard** (niveau 11). La collection de mineurs rares est un bon aimant : la montrer plus tôt, même en aperçu (« 3/24 mineurs découverts »).
7. **Docs en retard sur le code** : `CLAUDE.md` dit « salaire toutes les 10 minutes », le code dit 5 (`SECONDES_PAR_PAIE`). Un commentaire dit 30 min pour le manager, l'écran dit 15.

Ces pistes respectent les choix de départ : pas de creepers, pas de prix variables, pas de quêtes du marchand.

## 4. UX/UI à homogénéiser

Le jeu a grandi vite : chaque fenêtre, chaque bouton et chaque alerte a été fait à part. Résultat : trop de systèmes qui parlent en même temps, et des règles différentes d'un écran à l'autre.

### Fenêtres : une seule base

- **11 fenêtres, aucune base commune.** Chacune refait son voile (`Statistiques`, `FenetreBilan`, `FenetreAbsence`, `FeteNiveau`, `FenetreTrajet`, `FenetreRail`, `MenuConstruction`, `Confirmation`, `RevelationRecrue`, les succès dans `App.tsx:774`, et le tutoriel).
- **4 façons de fermer** : ✖ en haut à droite, ✖ d'un autre style (Bilan), bouton « Fermer » en bas (Succès, Stats), ou rien (Absence, Fête).
- **Échap ne marche que sur 4 fenêtres.** Ni Stats, ni Succès, ni Bilan, ni panneau de bâtiment, ni ⚙️.
- **Correctif :** un composant `Fenetre` (voile, titre, ✖ rond en haut à droite, Échap, clic sur le voile, taille, `role="dialog"`). Toutes les fenêtres passent dessus.

### Boutons : la règle des couleurs n'est plus suivie

- Le vert « vendre » sert aussi à valider (« Construire ici », « Terminé », « Génial ! »). « Poser ce rail » est bleu alors que « Construire ici » est vert.
- Le rouge sert à la fois pour Annuler et pour Recommencer à zéro (destructif).
- Deux composants de bouton se recoupent : `BoutonAction` (`Panneaux.tsx:80`) et `Amelioration.tsx:84`.
- Dans les tâches, trois verbes pour le même geste : « Construire », « Go ! », « Aller ».
- Le commentaire « Les couleurs des boutons » (`index.css:570`) cite encore Enchanter, Prestige, Trésorerie, Décorer.
- **Correctif :** 5 rôles seulement. Principal (valider, construire), Achat/Amélioration, Vente, Neutre (annuler, fermer), Danger (supprimer, licencier). Un seul composant `Bouton`.

### Guidage : trop de voix en même temps

Au moins 12 systèmes : tutoriel, liste de tâches, bulles sur les bâtiments, bulles ✨ de découverte, badge du bouton Bâtiments, « ! » sur Mine, pastilles des onglets, cases du bandeau qui rougissent, toasts, fête de niveau, aide ❔, conseil du bilan.

- **Un coffre plein est signalé 4 fois** : case rouge, « ! » sur Mine, bulle sur la mine, tâche urgente.
- **Chaque montée de niveau ferme tout** (`App.tsx:427-440`) : panneau, menus, trajets. Le joueur est coupé en plein achat, une quinzaine de fois.
- **Correctif :** une règle par sorte de message. Un état (plein, en panne) = bulle sur le bâtiment, rien d'autre. Un conseil = la liste de tâches. Un événement = un toast. La fête de niveau attend que le panneau soit fermé.

### Vocabulaire

| Aujourd'hui | Problème | À garder |
| --- | --- | --- |
| Tâches / quêtes conseillées / missions | Trois noms pour la même liste | Tâches |
| Chariot (foreuse) / chariot (pousseur) / chariot (wagonnet) | Trois sens | Réserve de la foreuse, Capacité du pousseur, Wagonnet |
| Personnel / Employés / mineur | Bâtiment et onglet différents | Personnel (bâtiment), Équipe (onglet) |
| Coffre / réservoir | Deux mots pour « ce qui stocke » | Coffre (mine), Réservoir (charbon, redstone) |
| Wagons (onglet) / wagonnet | Deux mots | Wagonnets |
| « HIRING » sur l'image du Personnel | Anglais dans un jeu français | Adapter à la langue (« EMBAUCHE ») |

### Téléphone et lisibilité

- **Le haut de l'écran est plein.** Sur téléphone, bandeau sur 2 lignes + 4 boutons ronds + liste de tâches = environ 30 % de l'écran. Sur ordinateur, le bandeau passe sur 3 lignes quand un panneau s'ouvre : l'écran saute.
- **Le panneau de la mine défile sur téléphone** (le coffre est coupé en bas), alors que la doc dit le contraire.
- **Textes trop petits** : 45 tailles de police, une vingtaine sous 11 px. Les noms au-dessus des personnages sont à 6,5 px (`village.css:377`). Les bulles « Courant 2 min », « Vente 0,8 s » sont illisibles sur téléphone. Minimum 12 px partout, 14 px pour ce qu'on doit lire.
- **Infos cachées au survol** (`title=`) : invisibles au doigt. La description d'un bâtiment n'existe que là (`App.tsx:528`).
- **Petites cibles** : bouton ✖ à 32 px, `bouton-petit` à 28 px. Viser 44 px.
- **Le coffre de la mine est un tableur** : par minerai, un menu « Garde tout / Vend tout », un curseur et un bouton sac, plus « Garder N » et ±100. Trop pour un idle. Garder par défaut un seul bouton « Tout vendre » ou « Tout au sac », et mettre le réglage fin dans un « Réglages du wagonnet ».
- **Menu Bâtiments** : les bâtiments déjà construits prennent autant de place que les nouveaux. Mettre à construire en premier, construits en bas et en petit.
- **Bandeau sans étiquettes** : « 598/9840 », « 1847/4000 », « 612/750 » se ressemblent. Icônes plus grandes, et un appui long qui explique.

## 5. Design visuel

Le village est le point fort : il tient la comparaison avec les jeux mobiles du genre. Le problème est l'interface par-dessus, qui mélange trois styles, et le bloc à cliquer, plus pauvre que le décor.

**Ce qui marche**

- Bâtiments isométriques riches et cohérents, hamsters attachants, forêt et plage bien finies.
- La police d'icônes maison donne une vraie identité et le même rendu sur tous les appareils.
- Les gros boutons ronds du bas (Mine, Bâtiments) sont clairs et faits pour le pouce.

**Ce qui jure**

1. **Trois habillages de fenêtre.** Crème à bord marron (bienvenue), bois clair (tâches, bandeau), ardoise sombre presque « appli web » (panneau de la mine, menu Bâtiments). Choisir le style bois + crème des tâches et l'appliquer partout : il va avec les bâtiments.
2. **Titres dans deux polices.** « TÂCHES » est en Luckiest Guy, « Mine » et « Bâtiments » en police système. Tous les titres de fenêtre en Luckiest Guy.
3. **Le bloc à cliquer est un carré gris plat.** C'est le geste principal du jeu, et il est le dessin le plus simple de l'écran. Un vrai cube en 3/4 dans le style des bâtiments (pierre, minerai qui brille), qui se fissure en 3 étapes, rendrait chaque clic bien plus satisfaisant.
4. **Beaucoup d'herbe vide.** À l'ouverture, le village occupe un tiers de l'écran. Zoomer davantage par défaut, ou centrer la caméra sur les bâtiments.
5. **La barre « ←↑→↓ pour marcher · Espace pour sauter » reste tout le temps** en bas sur ordinateur. La cacher après le premier déplacement.
6. **Texte flottant mal rendu** : un « +0 » fantôme reste au-dessus du marché (vu sur la partie à 2 h). Vérifier les gains à 0 $ et leur fin d'animation.
7. **Le bandeau en haut** a des icônes trop petites dans des cases sombres : on lit des nombres, pas des objets. Icônes plus grandes, couleurs propres à chaque case (or pour l'argent, bois pour le coffre).

**Pour la fiche CrazyGames** : il faut une vignette, un GIF ou une vidéo courte. Montrer le village avec des wagonnets qui roulent et des « +$ » qui jaillissent. C'est l'image qui vend le jeu, pas le bloc.

## 6. Plan d'action

Dans l'ordre : d'abord ce qui empêche de publier, puis ce qui retient le joueur, puis le polish. Chaque ligne tient dans une PR.

**Avant de publier (bloquant)**

- [ ] Stockage sûr : un seul objet `stockage` avec try/catch et repli en mémoire
- [ ] `base: './'` dans Vite et chemins relatifs pour images, polices, sons
- [ ] Version « portail » : sans service worker, manifest, carte d'installation, comptes Supabase
- [ ] SDK CrazyGames : sauvegarde Data, `gameplayStart/Stop`, `happytime`
- [ ] Police Luckiest Guy servie depuis `public/fonts/`
- [ ] Remplacer les `window.confirm` par `Confirmation`
- [ ] Traduction anglaise (textes sortis dans un fichier par langue)

**Première session (rétention J0)**

- [ ] Premier revenu passif avant 2 minutes (mineur offert par le tutoriel)
- [ ] Tutoriel jusqu'au premier mineur embauché
- [ ] Bandeau qui se révèle petit à petit (argent + coffre au départ)
- [ ] Une seule boucle en 4 mots, sur l'accueil et la bienvenue
- [ ] Repères du fil rouge des 5 minutes ajoutés au bot

**Revenir (rétention J1 et J7)**

- [ ] Boucle longue : « nouvelle mine » avec bonus permanent (à partir de `archives/`)
- [ ] Niveaux 16 à 30 remplis, ou plafond à 15
- [ ] Classement à l'argent gagné au total
- [ ] Fenêtre de retour avec gros « +X $ » et « ×2 avec une pub »
- [ ] Coffre quotidien et 3 défis du jour
- [ ] Collection de mineurs visible tôt

**Homogénéiser l'interface**

- [ ] Composant `Fenetre` commun (✖, Échap, voile), toutes les fenêtres dessus
- [ ] Composant `Bouton` à 5 rôles, couleurs revues
- [ ] Une règle par sorte d'alerte ; la fête de niveau ne ferme plus le panneau
- [ ] Vocabulaire unifié (tableau de la section 4)
- [ ] Textes à 12 px minimum, cibles à 44 px, plus d'info seulement au survol
- [ ] Coffre de la mine simplifié, réglages fins à part
- [ ] Menu Bâtiments : à construire d'abord

**Polish visuel**

- [ ] Un seul habillage de fenêtre (bois + crème), titres en Luckiest Guy
- [ ] Nouveau bloc à cliquer en 3/4, qui se fissure
- [ ] Caméra plus proche au départ
- [ ] Barre d'aide clavier qui disparaît
- [ ] Vignette et GIF pour la fiche CrazyGames
- [ ] Nettoyer le CSS mort (prestige, vue en coupe, enchanteur : environ 90 classes)
