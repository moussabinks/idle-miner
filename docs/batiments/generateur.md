# ⚡ Générateur

> Une machine à éclairs, ajoutée le 22/10 avec son dessin. **Elle ne sert encore à rien** : son rôle sera décidé plus tard (l'équipe l'expliquera).

## Où et quand

- **Taille** : 5 × 5 cases, comme les autres bâtiments. Le pied de sa dalle de pavés tombe pile sur le bord de son emprise.
- **Déblocage** : dès le prestige 0, dans le menu 🏗️ Bâtiments (pastille « Nouveau ! » la première fois).
- **Prix pour le poser** : 1 000 $ + 40 pierre (ou roche dure) + 15 fer, une seule fois ; il reste au prestige.
- **Porte** : face avant droite (à gauche s'il est retourné).

## Ce qu'on peut y faire

Rien pour l'instant : son panneau ne montre que sa description. Il n'est **pas proposé** dans la barre « 🎯 prochain objectif » (pour ne pas pousser le joueur à payer un bâtiment qui ne sert à rien).

## Fichiers du code

- `src/jeu/donnees.ts` : `BATIMENTS.generateur` (prix, taille, porte, déblocage) et `LISTE_BATIMENTS`.
- `src/jeu/objectifs.ts` : il est sauté dans `achatsPossibles`.
- `src/composants/iso.ts` : son image (`public/images/batiments/generateur.webp`) et son calage (`CALAGES`).
- `src/composants/SceneAccueil.tsx` : il est posé dans le village de l'écran d'accueil.
