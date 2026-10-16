// La surface : le village avec ses stands et le puits qui descend dans la mine.
// Le joueur se déplace d'un stand à l'autre avec les flèches (ou en cliquant).

import { piocheEquipee, estCassee, type EtatJeu } from '../jeu/mineur'
import { Personnage } from './Personnage'
import { STANDS } from './stands'

type Props = {
  etat: EtatJeu
  position: number
  versLaGauche: boolean
  enMarche: boolean
  onAller: (position: number) => void
}

export function VueSurface({ etat, position, versLaGauche, enMarche, onAller }: Props) {
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur

  return (
    <section className="surface" aria-label="La surface">
      <div className="soleil" aria-hidden="true" />
      <div className="nuage nuage-1" aria-hidden="true" />
      <div className="nuage nuage-2" aria-hidden="true" />

      <div className="rue">
        {STANDS.map((stand, index) => (
          <button
            key={stand.id}
            className={`stand stand-${stand.id} ${index === position ? 'stand-actif' : ''}`}
            onClick={() => onAller(index)}
            title={stand.description}
          >
            {stand.id === 'puits' ? (
              <span className="puits" aria-hidden="true">
                <span className="puits-toit" />
                <span className="puits-echelle" />
                <span className="puits-margelle" />
              </span>
            ) : (
              <span className="echoppe" aria-hidden="true">
                <span className="auvent" />
                <span className="comptoir">{stand.emoji}</span>
              </span>
            )}
            <span className="stand-nom">{stand.nom}</span>
          </button>
        ))}
      </div>

      <div className="sol">
        {STANDS.map((stand, index) => (
          <div key={stand.id} className="sol-case">
            {index === position && (
              <Personnage couleurPioche={couleurPioche} action={enMarche ? 'marche' : 'repos'} versLaGauche={versLaGauche} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
