# Publier sur Poki

17 nov. 2026 (d'après la documentation de Poki pour les développeurs : developers.poki.com, pages « PokiSDK: HTML5 » et « Requirements »)

Une troisième version du même code, à côté du site (Vercel) et de CrazyGames : voir aussi [crazygames.md](crazygames.md). Jamais de copie du jeu : tout ce qui est propre à Poki passe par `PORTAIL === 'poki'` (`src/portail.ts`).

| | Poki |
| --- | --- |
| Commande | `npm run build:poki` (mode « poki », `.env.poki` : `VITE_PORTAIL=poki`) |
| Dossier | `dist-poki/`, et le ZIP `mega-digger-poki.zip` à la racine du projet (~0,8 Mo, `index.html` à la racine) |
| Comme CrazyGames | pas de comptes, de classement, de visites, de statistiques Vercel, d'application à installer, d'écran d'accueil ni de plein écran ; un seul monde |
| SDK | `https://game-cdn.poki.com/scripts/v2/poki-sdk.js` (v2) |
| Sauvegarde | le stockage du navigateur (Poki n'a pas de module de sauvegarde) |
| Achats | **aucune interface d'achat de gemmes** (ni packs, ni « Bientôt disponible ») |

## Ce que fait le jeu avec le SDK

| | Quand |
| --- | --- |
| `PokiSDK.init()` | au démarrage ; le jeu attend 6 s au plus (sans SDK, il démarre quand même, sans publicités) |
| `gameLoadingFinished()` | une fois le jeu affiché (`chargementFini`, appelé par `main.tsx`) |
| `gameplayStart()` | au **premier geste** du joueur (pas au chargement), puis après chaque publicité |
| `gameplayStop()` | avant chaque publicité, et au retour au menu ; jamais deux « start » ou deux « stop » de suite (`direAPoki`) |
| `rewardedBreak()` | les 3 publicités récompensées : +1 💎 à la boutique, 💰 Ventes × 2, Doubler au retour d'absence, et l'amélioration offerte ; la récompense seulement si la pub renvoie `true` |

Pas de `commercialBreak()` (pause publicité) pour l'instant : c'est un idle, sans fin de niveau naturelle. Poki demande `commercialBreak()` **et/ou** `rewardedBreak()`.

## Les règles de Poki suivies

- Sans SDK (bloqueur de pubs) : ni fausse publicité, ni récompense, ni message (`SANS_FAUSSE_PUB`) : Poki affiche le sien.
- Le son se coupe pendant une publicité (comme sur CrazyGames).
- Chaque bouton de publicité porte un **clap de cinéma 🎬** (dessiné dans `outils/icones/dessins.py`, jamais l'emoji du système), et aucun n'est vert (ils sont violets).
- Au retour d'absence : « Continuer » **d'abord**, de la même largeur que « Doubler », et le bouton de pub ne clignote pas. Le rond 💰 Ventes × 2 ne clignote pas non plus (pas de bouton de pub insistant).
- Les flèches (le joueur marche avec), Espace et la molette ne font jamais défiler la page qui contient le jeu (`empecherDefilementDeLaPage`).
- Rien n'est chargé ailleurs (polices et images dans le jeu), aucun lien vers l'extérieur.

## À surveiller pendant leur revue

- **Téléphone debout** : le jeu demande de tourner le téléphone (il se joue couché). Poki accepte un jeu en paysage seul, mais il doit remplir l'écran couché.
- **Les gemmes** : Poki refuse une « double monnaie faite pour pousser à l'achat ». Ici, il n'y a rien à acheter : les gemmes se gagnent (niveaux, cadeau du jour, publicités au choix). À expliquer si on nous le demande.
- Le texte de la boutique dit « 30 secondes » de publicité : chez Poki, la durée varie.

## Publier (à faire par le propriétaire)

1. `npm run build:poki`.
2. Tester le dossier `dist-poki/` (ou le ZIP) dans l'**Inspector** de Poki (https://inspector.poki.dev) : la liste de contrôle, le journal des événements (la console montre aussi « [Mega Digger] Poki : gameplayStart / gameplayStop »), le téléphone (QR code).
3. Préparer les **miniatures** (une fixe et une animée, leur guide « Game thumbnail »).
4. Envoyer le jeu depuis le compte Poki for Developers, puis demander la revue.

Attention : Poki demande l'**exclusivité web** pour son meilleur contrat. Ne pas envoyer Mega Digger à GameDistribution ou à un autre portail avant leur réponse.
