// Pendant qu'on grimpe à l'échelle (vers la surface ou vers le fond).

import { profondeurDuJoueur, estCassee, piocheEquipee, type EtatJeu } from '../jeu/mineur'
import { Barre } from './Barre'
import { Personnage } from './Personnage'

export function VueEchelle({ etat }: { etat: EtatJeu }) {
  if (etat.trajet === null) return null
  const monte = etat.trajet.vers === 'surface'
  const avancement = 1 - etat.trajet.tempsRestant / etat.trajet.tempsTotal
  const profondeur = profondeurDuJoueur(etat)
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur

  return (
    <section className={`vue-echelle ${monte ? 'monte' : 'descend'}`} aria-label="L'échelle">
      <div className="puits-vertical" aria-hidden="true">
        <div className="barreaux" />
        <div className="grimpeur">
          <Personnage couleurPioche={couleurPioche} action="grimpe" />
        </div>
      </div>
      <div className="echelle-infos">
        <strong>{monte ? '🪜 Tu remontes à la surface' : '🪜 Tu descends dans la mine'}</strong>
        <span className="echelle-profondeur">{profondeur === 0 ? 'Surface' : `-${profondeur} m`}</span>
        <Barre valeur={avancement * 100} max={100} texte={`${Math.ceil(etat.trajet.tempsRestant)} s`} couleur="or" />
        <span className="discret">Plus tu es profond, plus le trajet est long. L'ascenseur t'évite de remonter pour vendre !</span>
      </div>
    </section>
  )
}
