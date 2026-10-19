// Le petit module de l'ascenseur, en bas à gauche de la mine : on le construit,
// on l'améliore (fer et redstone), on l'appelle, ou on monte dedans.
// Pour envoyer des minerais au marché, c'est dans le sac (panneau de droite).
// Il reste replié tant qu'on ne l'ouvre pas, pour ne pas cacher la mine.

import { useState } from 'react'
import { BLOCS } from '../jeu/donnees'
import {
  ameliorerAscenseur,
  appelerAscenseur,
  ascenseurDisponible,
  ascenseurEnMouvement,
  enMouvement,
  niveauAscenseur,
  peutAmeliorerAscenseur,
  positionFront,
  prendreAscenseur,
  prochainNiveauAscenseur,
  quantite,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'

// Ouvert ou replié : gardé ici pour qu'il reste comme on l'a laissé quand on remonte puis redescend.
let ouvertMemorise = false

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
  if (ascenseur.niveau === 0) return 'pas encore construit'
  if (ascenseur.passager) return ascenseur.cible === 0 ? 'tu montes au village…' : 'tu descends au front…'
  if (ascenseurEnMouvement(etat)) return ascenseur.cible < ascenseur.position ? 'monte au marché…' : 'descend…'
  if (ascenseurDisponible(etat)) return 'prête, à ton niveau'
  return ascenseur.position === 0 ? 'attend au village' : `attend à -${Math.round(ascenseur.position)} m`
}

export function ModuleAscenseur({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  const [ouvert, setOuvert] = useState(ouvertMemorise)
  const niveau = niveauAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  const ici = ascenseurDisponible(etat)
  const front = positionFront(etat)

  function changerOuvert(valeur: boolean) {
    ouvertMemorise = valeur
    setOuvert(valeur)
  }

  // Monter dans la cabine : le module se replie pour laisser voir le trajet.
  function voyager(destination: number) {
    jouer((e) => prendreAscenseur(e, destination))
    changerOuvert(false)
  }

  return (
    <div className={`module-ascenseur ${ouvert ? 'ouvert' : ''}`}>
      <button className="module-titre" onClick={() => changerOuvert(!ouvert)} aria-expanded={ouvert}>
        <strong>{ouvert ? '▾' : '▸'} Ascenseur</strong>
        <span className="discret">
          {niveau ? `niv. ${niveau.niveau} · ` : ''}
          {etatCabine(etat)}
        </span>
      </button>
      {ouvert && (
        <>
          {niveau && (
            <div className="module-boutons">
              {!ici && !ascenseurEnMouvement(etat) && (
                <button className="bouton bouton-petit bouton-ascenseur" disabled={enMouvement(etat)} onClick={() => jouer(appelerAscenseur)}>
                  Appeler
                </button>
              )}
              <button className="bouton bouton-petit bouton-voyage" disabled={!ici || etat.position === 0} onClick={() => voyager(0)}>
                ⏫ Monter avec
              </button>
              <button className="bouton bouton-petit bouton-voyage" disabled={!ici || etat.position >= front} onClick={() => voyager(front)}>
                ⏬ Descendre avec
              </button>
            </div>
          )}

          {prochain ? (
            <div className="module-ligne">
              <span className="materiaux">
                <Besoin etat={etat} bloc="fer" nombre={prochain.fer} />
                <Besoin etat={etat} bloc="redstone" nombre={prochain.redstone} />
              </span>
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
      )}
    </div>
  )
}
