// Les tenues du joueur, vendues au Bazar : un chapeau et un haut, juste pour le style.
// On voit le hamster avec sa tenue, on achète (une fois) puis on change gratuitement.

import { LISTE_TENUES, TENUES, type IdTenue, type PartieTenue } from '../jeu/donnees'
import { estCassee, piocheEquipee, type EtatJeu } from '../jeu/mineur'
import { acheterTenue, peutAcheterTenue, porterTenue, tenueDebloquee } from '../jeu/tenues'
import type { Action } from '../usePartie'
import { Hamster } from './Hamster'

type Props = { etat: EtatJeu; jouer: (action: Action) => unknown }

function LigneTenue({ etat, jouer, id }: Props & { id: IdTenue }) {
  const tenue = TENUES[id]
  const achetee = etat.tenuesAchetees.includes(id)
  const portee = etat.tenue[tenue.partie] === id
  if (!tenueDebloquee(etat, id)) {
    return (
      <li className="ligne-tenue tenue-bloquee">
        <span>🔒 {tenue.nom}</span>
        <span className="discret">au prestige {tenue.prestige}</span>
      </li>
    )
  }
  return (
    <li className={`ligne-tenue ${portee ? 'tenue-portee' : ''}`}>
      <span>{tenue.nom}</span>
      {achetee ? (
        <button className="bouton bouton-petit bouton-neutre" disabled={portee} onClick={() => jouer((e) => porterTenue(e, tenue.partie, id))}>
          {portee ? '✔ Portée' : 'Porter'}
        </button>
      ) : (
        <button className="bouton bouton-petit bouton-acheter" disabled={!peutAcheterTenue(etat, id)} onClick={() => jouer((e) => acheterTenue(e, id))}>
          {tenue.prix.toLocaleString('fr-FR')} $
        </button>
      )}
    </li>
  )
}

function Partie({ etat, jouer, partie, titre }: Props & { partie: PartieTenue; titre: string }) {
  return (
    <div>
      <div className="titre-partie-tenue">
        <strong>{titre}</strong>
        {etat.tenue[partie] !== null && (
          <button className="lien" onClick={() => jouer((e) => porterTenue(e, partie, null))}>
            {partie === 'chapeau' ? 'Enlever' : 'Tenue de départ'}
          </button>
        )}
      </div>
      <ul className="liste-tenues">
        {LISTE_TENUES.filter((id) => TENUES[id].partie === partie).map((id) => (
          <LigneTenue key={id} etat={etat} jouer={jouer} id={id} />
        ))}
      </ul>
    </div>
  )
}

export function PanneauTenues({ etat, jouer }: Props) {
  return (
    <div className="ligne-achat panneau-tenues">
      <strong>👕 Tenues</strong>
      <span className="discret">Juste pour le style : tu les gardes au prestige.</span>
      <div className="tenues">
        <div className="apercu-tenue" aria-hidden="true">
          <Hamster role="joueur" couleurPioche={estCassee(etat) ? null : piocheEquipee(etat).couleur} chapeau={etat.tenue.chapeau} haut={etat.tenue.haut} />
        </div>
        <div className="choix-tenues">
          <Partie etat={etat} jouer={jouer} partie="chapeau" titre="🎩 Chapeaux" />
          <Partie etat={etat} jouer={jouer} partie="haut" titre="🦺 Hauts" />
        </div>
      </div>
    </div>
  )
}
