// Le contenu du sac, avec la valeur de chaque pile.

import { BLOCS, type IdBloc } from '../jeu/donnees'
import { bonusVente, quantitesReservees, type EtatJeu } from '../jeu/mineur'

export function Inventaire({ etat }: { etat: EtatJeu }) {
  const reserve = quantitesReservees(etat)
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(
    ([a], [b]) => BLOCS[b].prix - BLOCS[a].prix,
  )

  return (
    <section className="carte inventaire">
      <h2>🎒 Inventaire</h2>
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Creuse !</p>
      ) : (
        <ul>
          {piles.map(([id, nombre]) => {
            const garde = Math.min(nombre, reserve[id] ?? 0)
            return (
              <li key={id}>
                <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
                <span className="inventaire-nom">{BLOCS[id].nom}</span>
                <span className="inventaire-nombre">×{nombre}</span>
                <span className="inventaire-valeur">
                  {garde > 0 ? (
                    <span title="Gardé pour une pioche ou un enchantement">🔒 {garde}</span>
                  ) : (
                    `${Math.round(nombre * BLOCS[id].prix * bonusVente(etat))} $`
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
