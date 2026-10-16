// Le contenu du sac (au fond de la mine, on ne peut pas vendre : seulement regarder).

import { BLOCS, type IdBloc } from '../jeu/donnees'
import { bonusVente, type EtatJeu } from '../jeu/mineur'

export function Inventaire({ etat }: { etat: EtatJeu }) {
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
    </div>
  )
}
