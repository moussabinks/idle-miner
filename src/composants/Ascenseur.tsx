// L'ascenseur à l'écran : où en est la cabine, et le bloc pour le construire ou
// l'améliorer (dans le sac de la mine, et à l'entrée de la mine au village).

import { NIVEAUX_ASCENSEUR, niveauMaxAuPrestige } from '../jeu/donnees'
import {
  ameliorerAscenseur,
  ascenseurBloqueAuPrestige,
  ascenseurDisponible,
  ascenseurEnMouvement,
  niveauAscenseur,
  peutAmeliorerAscenseur,
  prochainNiveauAscenseur,
  secondesAvantArretAscenseur,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'
import { Amelioration } from './Amelioration'

// Où en est la cabine, en quelques mots, avec le temps qu'il lui reste.
function etatCabine(etat: EtatJeu): string {
  const ascenseur = etat.ascenseur
  if (ascenseur.niveau === 0) return 'pas encore construit'
  const reste = `${Math.ceil(secondesAvantArretAscenseur(etat))} s`
  if (ascenseur.passager) return ascenseur.cible === 0 ? `tu montes au village… ${reste}` : `tu descends dans la mine… ${reste}`
  if (ascenseurEnMouvement(etat)) {
    if (ascenseur.retourAuFront) return `au marché · retour dans ${reste}`
    if (ascenseur.cible === etat.position) return `arrive dans ${reste}`
    return `en route… ${reste}`
  }
  if (ascenseurDisponible(etat)) return 'prête, à ton niveau'
  return ascenseur.position === 0 ? 'attend au village' : `attend à -${Math.round(ascenseur.position)} m`
}

// Construire ou améliorer l'ascenseur.
export function AmeliorationAscenseur({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  const niveau = niveauAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  return (
    <Amelioration
      etat={etat}
      actuel={niveau ? `${niveau.capacite} objets par voyage · ${etatCabine(etat)}` : 'Pas encore construit'}
      niveau={etat.ascenseur.niveau}
      niveauMax={NIVEAUX_ASCENSEUR.length}
      niveauPermis={niveauMaxAuPrestige('ascenseur', etat.prestige)}
      suivant={prochain && { cout: prochain.cout, texte: niveau ? `⬆ ${prochain.capacite} places` : '🔨 Construire' }}
      bloqueAuPrestige={ascenseurBloqueAuPrestige(etat)}
      possible={peutAmeliorerAscenseur(etat) && !ascenseurEnMouvement(etat)}
      onAmeliorer={() => jouer(ameliorerAscenseur)}
    />
  )
}
