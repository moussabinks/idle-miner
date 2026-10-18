// Le module de l'ascenseur, directement dans la mine : on le construit, on l'améliore
// (avec du fer et de la redstone), on l'appelle, on monte dedans, ou on l'envoie
// seul vendre les minerais cochés au marché.

import { useState } from 'react'
import { BLOCS, type IdBloc } from '../jeu/donnees'
import {
  ameliorerAscenseur,
  appelerAscenseur,
  ascenseurDisponible,
  ascenseurEnMouvement,
  basculerChargement,
  enMouvement,
  envoyerAscenseur,
  nbSurQuai,
  niveauAscenseur,
  peutAmeliorerAscenseur,
  positionFront,
  prendreAscenseur,
  prochainNiveauAscenseur,
  quantite,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'

// « 12/20 fer » en vert s'il y en a assez, en rouge sinon.
function Besoin({ etat, bloc, nombre }: { etat: EtatJeu; bloc: 'fer' | 'redstone'; nombre: number }) {
  const possede = quantite(etat, bloc)
  return (
    <span className={possede >= nombre ? 'ok' : 'manque'}>
      {Math.min(possede, nombre)}/{nombre} {BLOCS[bloc].nom.toLowerCase()}
    </span>
  )
}

// Où en est la cabine, en quelques mots.
function etatCabine(etat: EtatJeu): string {
  const ascenseur = etat.ascenseur
  if (ascenseur.passager) return ascenseur.cible === 0 ? 'Tu montes vers le village…' : 'Tu descends vers le front…'
  if (ascenseurEnMouvement(etat)) {
    const ou = Math.round(ascenseur.position)
    return ascenseur.cible < ascenseur.position ? `Monte au marché… (-${ou} m)` : `Descend… (-${ou} m)`
  }
  if (ascenseurDisponible(etat)) return 'Prête, à ton niveau'
  return ascenseur.position === 0 ? 'Attend au village' : `Attend à -${Math.round(ascenseur.position)} m`
}

export function ModuleAscenseur({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  const [choixOuvert, setChoixOuvert] = useState(false)
  // Sur un petit écran, le module commence replié pour ne pas cacher la mine.
  const [replie, setReplie] = useState(() => window.innerWidth < 600)
  const niveau = niveauAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  const ascenseur = etat.ascenseur
  const ici = ascenseurDisponible(etat)
  const front = positionFront(etat)
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)

  return (
    <div className="module-ascenseur">
      <button className="module-titre" onClick={() => setReplie(!replie)} aria-expanded={!replie}>
        <strong>
          {replie ? '▸' : '▾'} Ascenseur
        </strong>
        {niveau ? (
          <span className="discret">
            {replie ? etatCabine(etat) : `niv. ${niveau.niveau} · ${niveau.capacite} objets · quai ${nbSurQuai(etat)}/${niveau.capacite}`}
          </span>
        ) : (
          <span className="discret">pas encore construit</span>
        )}
      </button>
      {replie ? null : (
        <>
          {niveau && (
            <>
              <div className="module-ligne">
                <span className="module-etat">{etatCabine(etat)}</span>
                {!ici && !ascenseurEnMouvement(etat) && (
                  <button className="bouton bouton-petit" disabled={enMouvement(etat)} onClick={() => jouer(appelerAscenseur)}>
                    Appeler
                  </button>
                )}
              </div>
              <div className="module-boutons">
                <button className="bouton bouton-petit" disabled={!ici || etat.position === 0} onClick={() => jouer((e) => prendreAscenseur(e, 0))}>
                  ⏫ Monter avec
                </button>
                <button className="bouton bouton-petit" disabled={!ici || etat.position >= front} onClick={() => jouer((e) => prendreAscenseur(e, front))}>
                  ⏬ Descendre avec
                </button>
                <button className="bouton bouton-petit bouton-vendre" disabled={!ici || etat.position === 0} onClick={() => jouer(envoyerAscenseur)}>
                  Envoyer seul
                </button>
              </div>

              {/* Les minerais que l'ascenseur emporte : décochés, ils restent dans le sac. */}
              <button className="lien" onClick={() => setChoixOuvert(!choixOuvert)}>
                {choixOuvert ? '▾' : '▸'} Ce qu'il remonte ({etat.ascenseur.garder.length > 0 ? `${etat.ascenseur.garder.length} gardé(s)` : 'tout'})
              </button>
              {choixOuvert && (
                <div className="choix-chargement">
                  {piles.length === 0 && <span className="discret">Ton sac est vide.</span>}
                  {piles.map(([id, nombre]) => (
                    <label key={id} className={ascenseur.garder.includes(id) ? 'garde' : ''}>
                      <input type="checkbox" checked={!ascenseur.garder.includes(id)} onChange={() => jouer((e) => basculerChargement(e, id))} />
                      <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
                      {BLOCS[id].nom} ×{nombre}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {prochain ? (
            <div className="module-ligne">
              <span className="materiaux">
                <Besoin etat={etat} bloc="fer" nombre={prochain.fer} />
                <Besoin etat={etat} bloc="redstone" nombre={prochain.redstone} />
              </span>
              <button
                className="bouton bouton-petit"
                disabled={!peutAmeliorerAscenseur(etat) || ascenseurEnMouvement(etat)}
                onClick={() => jouer(ameliorerAscenseur)}
              >
                {niveau ? `Améliorer (niv. ${prochain.niveau})` : 'Construire'}
              </button>
            </div>
          ) : (
            <span className="ok">Niveau maximum !</span>
          )}
        </>
      )}
    </div>
  )
}
