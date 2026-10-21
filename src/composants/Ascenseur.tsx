// L'ascenseur de la mine : il raccourcit les trajets des mineurs (montée et descente).
// Le bloc pour le construire ou l'améliorer est dans le panneau de la mine.

import { NIVEAUX_ASCENSEUR, SECONDES_ECHELLE } from '../jeu/donnees'
import { ameliorerAscenseur, niveauAscenseur, peutPayer, prochainNiveauAscenseur, type EtatJeu } from '../jeu/mineur'
import type { Action } from '../usePartie'
import { Amelioration } from './Amelioration'

export function AmeliorationAscenseur({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  const niveau = niveauAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  return (
    <Amelioration
      etat={etat}
      actuel={niveau ? `Un trajet de mineur en ${niveau.secondesTrajet} s` : `Pas encore construit : à l'échelle, un trajet prend ${SECONDES_ECHELLE} s`}
      niveau={etat.ascenseur.niveau}
      niveauMax={NIVEAUX_ASCENSEUR.length}
      suivant={prochain && { cout: prochain.cout, texte: niveau ? `⬆ Trajet en ${prochain.secondesTrajet} s` : '🔨 Construire' }}
      possible={prochain !== null && peutPayer(etat, prochain.cout)}
      onAmeliorer={() => jouer(ameliorerAscenseur)}
    />
  )
}
