# 💰 Marché

> Depuis la grande mise à jour du 25/10, le marché sert **seulement à l'automatisation** : c'est l'arrivée des wagonnets **Mine → Marché** (le coffre de la mine) et **Foreuse → Marché** (le chariot de la foreuse), qui y **vendent tout seuls**, même jeu fermé. On ne vient plus y vendre à la main : le coffre se vend directement depuis la mine (et le chariot de la foreuse sur place).

## Où et quand

- **Où** : là où tu le poses dans la clairière. C'est un bâtiment de **5 × 5 cases**, **gratuit**. Mieux vaut le poser **près de la mine** : moins de rails (3 fer la case), des voyages plus courts, et un trajet plus facile à mettre entier dans le rayon du générateur.
- **Quand le poser** : dès le début (il n'a pas de cadenas), mais il ne sert à rien sans rails. La mission **« Construis le marché (gratuit) : le wagonnet y vendra tout seul »** arrive au bon moment : quand on a vendu une première fois, embauché un mineur et atteint le **niveau 2 du joueur** (les rails). Construire un bâtiment rapporte 70 XP.
- **Le poser** : menu **🏗️ Bâtiments** → carte « 💰 Marché » → **🏗️ Poser** ; un fantôme suit le doigt ou la souris (vert si la place est libre, rouge sinon), **✔ Construire ici** le pose. **✏️ Modifier** permet ensuite de le déplacer ou de le retourner gratuitement.
- **La porte** : sur la face avant **gauche** du dessin (à droite s'il est retourné).
- **Le dessin au village** (25/10, SVG plat au contour d'encre, `public/images/batiments/marche.svg`, dessiné par `marche()` dans `outils/art/batiments.mjs`) : sur une dalle de 5 × 5 pavés, un étal à l'auvent rayé rouge et blanc, une étagère de bocaux de minerais, un comptoir et ses caisses, une grosse pièce d'or plantée au-dessus, et devant, une caisse de charbon, un tonneau et un tas de pièces.
- **Description** : « Relie-le à la mine avec des rails : le wagonnet y vend tout seul le coffre. »
- **Bulles au-dessus** (`notifications.ts`) : **🚧 « Rails coupés »** (alerte rouge) quand un trajet qui arrive ici n'a plus de rails complets (la même bulle est sur son bâtiment de départ). Le marché n'a pas d'amélioration. (La bulle 🎒 « sac plein » a disparu avec le sac.)

## Ce qu'on peut y faire

Le panneau (`PanneauMarche` dans `Panneaux.tsx`, refait le 25/10) :

- **💰 Vendu par les wagonnets** : tout l'argent que les wagonnets ont vendu ici (`stats.argentWagonnet`).
- **Sans rails** vers le marché : une carte **« 🛤️ Relie la mine au marché avec des rails »** (« Un wagonnet y vendra le coffre de la mine tout seul, même quand tu ne joues pas. »), avec le bouton **🛤️ Poser des rails** (ou le cadenas « 🔒 ⭐ 2 » avant le niveau 2 du joueur).
- **Wagonnets vers le marché** : les trajets qui arrivent ici (Mine → Marché, Foreuse → Marché), avec où en est chaque wagonnet, **Pousser** et **⚙️ Régler** (`PanneauTrajets`, `arrivee="marche"`).

Il n'y a plus de vente à la main ici : pour vendre soi-même, c'est **💰 Tout vendre** au panneau de la mine (voir [mine.md](mine.md#-le-coffre--vendre-dun-clic-2510)), ou au panneau de la foreuse pour son chariot.

### Les prix de vente

Prix tirés de `BLOCS` (`src/jeu/donnees.ts`). Ils ne changent jamais (pas de prix variables). Ce sont les mêmes partout : au marché, au coffre de la mine et au chariot de la foreuse.

| Objet | Prix | Doublé par la pioche ? | Sort de la mine à partir du |
|---|---:|:---:|---|
| 🪨 Pierre | 1 $ | non | niveau 1 |
| ⚫ Charbon | 5 $ | oui | niveau 1 |
| 🔩 Fer | 12 $ | oui | niveau 1 |
| 🔴 Redstone | 15 $ | oui | niveau 2 |
| 🟡 Or | 35 $ | oui | niveau 3 |
| 💚 Émeraude | 80 $ | oui | niveau 4 |
| 💎 Diamant | 100 $ | oui | niveau 5 |

## Règles et comportement

- **Le wagonnet Mine → Marché** emporte le coffre (jusqu'aux places du chariot de son pousseur), **sauf les minerais épinglés 📌** au panneau de la mine, les objets décochés dans la fenêtre du trajet, et le charbon et la redstone qui manquent à la foreuse et au générateur (si leurs trajets ont un pousseur). Au marché, il vend tout son chargement (`valeurDe`), puis repart vers la mine.
- **Le wagonnet Foreuse → Marché** emporte le chariot de la foreuse et le vend.
- **Il faut un pousseur** embauché au Personnel pour chaque trajet qui roule tout seul (même électrique). Sinon, le joueur peut le pousser lui-même (« Pousser »).
- **Toutes les ventes utilisent le même calcul** (`valeurDe` : la somme des prix, arrondie, × 2 pendant le bonus « 💰 Ventes × 2 » de la boutique des gemmes).
- **Statistiques** : l'argent des wagonnets va dans `argentWagonnet` (la part « 🛤️ Wagonnet » de l'écran 📊) et dans l'argent gagné (`argentGagne`, qui compte pour les succès et le **classement**). La fenêtre du retour dit en grand ce que les wagonnets ont vendu pendant l'absence.
- **Pas de marché, pas de trajet vers le marché** : tant qu'il n'est pas posé, aucun wagonnet ne peut y aller.
- **Quand un wagonnet y vend** : un « +X $ » doré jaillit au-dessus du wagonnet, avec une fontaine de pièces et le « cha-ching » de la caisse (`public/sons/cash.mp3`).

## Lien avec le reste du jeu

- **Mine** : on y vend le coffre à la main au début ; le wagonnet Mine → Marché prend le relais. **Foreuse** : son chariot se vend sur place, ou part au marché en wagonnet. **Personnel** : les pousseurs. **Générateur** : avec tous les rails d'un trajet dans son rayon, le pousseur va plus vite.
- **Missions** : « Construis le marché (gratuit) : le wagonnet y vendra tout seul », puis « Pose des rails de la mine au marché (3 fer la case) », « Touche la bulle 🛤️ sur les rails : automatise le trajet », « Embauche un pousseur pour le wagonnet », et plus tard « Relie la foreuse au marché (rails) : elle vendra toute seule ».
- **Succès** : « 🛤️ Cheminot » (un trajet), « 🚃 Ligne régulière » (100 voyages), « 💰 Riche » (5 000 $ gagnés), « 🤑 Magnat » (100 000 $).
- **Bot de simulation** : il pose le marché en (18, 28), juste sous la mine, avec 3 cases de rails.

## Fichiers du code

- `src/jeu/donnees.ts` : le bâtiment (`BATIMENTS.marche` : gratuit, 5 × 5, porte à gauche) et les prix de vente (`BLOCS`).
- `src/jeu/batiments.ts` : poser, déplacer et retourner le bâtiment.
- `src/jeu/wagonnet.ts` : les wagonnets qui vendent au marché (trajets `mine-marche` et `foreuse-marche`, `avancerWagonnets`).
- `src/jeu/mineur.ts` : le calcul d'une vente (`valeurDe`, `encaisser`).
- `src/jeu/notifications.ts` : la bulle 🚧 « rails coupés ».
- `src/jeu/missions.ts` : la mission « Construis le marché (gratuit) » et les étapes de l'automatisation.
- `src/composants/Panneaux.tsx` (`PanneauMarche`) : le panneau ; `src/composants/PanneauTrajets.tsx` : les wagonnets qui arrivent ici.
- `src/composants/WagonnetVillage.tsx` et `sons.venteMarche` : le « +X $ » au-dessus du wagonnet et le son de la vente.
