// L'ascenseur à l'écran : où en est la cabine, et le bloc pour le construire ou
// l'améliorer (dans le sac de la mine, et à l'entrée de la mine au village).

import {
  ameliorerAscenseur,
  ascenseurDisponible,
  ascenseurEnMouvement,
  niveauAscenseur,
  peutAmeliorerAscenseur,
  prochainNiveauAscenseur,
  secondesAvantArretAscenseur,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'
import { PrixCout } from './PrixCout'

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
    <>
      {niveau && (
        <span className="discret">
          Niveau {niveau.niveau} : {niveau.capacite} objets par voyage · {etatCabine(etat)}
        </span>
      )}
      {prochain ? (
        <div className="module-ligne">
          <PrixCout etat={etat} cout={prochain.cout} />
          <button
            className="bouton bouton-petit bouton-ameliorer"
            disabled={!peutAmeliorerAscenseur(etat) || ascenseurEnMouvement(etat)}
            onClick={() => jouer(ameliorerAscenseur)}
          >
            {niveau ? `Améliorer (niv. ${prochain.niveau}, ${prochain.capacite} places)` : 'Construire'}
          </button>
        </div>
      ) : (
        <span className="ok">Niveau maximum !</span>
      )}
    </>
  )
}
