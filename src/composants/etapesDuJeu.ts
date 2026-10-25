// La boucle du jeu en 4 étapes (25/10) : la même promesse partout (accueil, tutoriel, aide).
// Les textes sont en français : on les affiche avec t().

export const ETAPES_DU_JEU = [
  { icone: '⛏️', titre: 'Creuse', texte: 'Clique sur le bloc de la mine. Tout va dans son coffre, que tu vends d’un clic.' },
  { icone: '👷', titre: 'Embauche', texte: 'Des mineurs creusent pour toi, même quand tu ne joues pas.' },
  { icone: '🛤️', titre: 'Automatise', texte: 'Des rails jusqu’au marché : le wagonnet vend tout seul.' },
  { icone: '💎', titre: 'Descends', texte: 'Chaque niveau de la mine débloque le niveau suivant de tout le reste.' },
]
