// Le contenu du sac (au fond de la mine, on ne peut pas vendre : seulement regarder).

import { BLOCS, TORCHES_PAR_CHARBON, type IdBloc } from '../jeu/donnees'
import { bonusVente, fabriquerTorches, quantite, type EtatJeu } from '../jeu/mineur'
import type { Action } from '../usePartie'

export function Inventaire({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)

  return (
    <div className="inventaire">
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Creuse !</p>
      ) : (
        <ul>
          {piles.map(([id, nombre]) => (
            <li key={id} className={etat.nonAVendre.includes(id) ? 'garde' : ''}>
              <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
              <span className="inventaire-nom">{BLOCS[id].nom}</span>
              <span className="inventaire-nombre">×{nombre}</span>
              <span className="inventaire-valeur">
                {etat.nonAVendre.includes(id) ? '🔒' : `${Math.round(nombre * BLOCS[id].prix * bonusVente(etat))} $`}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="boutons">
        <button className="bouton bouton-petit" disabled={quantite(etat, 'charbon') < 1} onClick={() => jouer(fabriquerTorches)}>
          🕯️ Fabriquer {TORCHES_PAR_CHARBON} torches · 1 charbon
        </button>
      </div>
    </div>
  )
}
