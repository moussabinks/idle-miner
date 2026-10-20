// La petite barre « prochain objectif », juste sous le bandeau : discrète (une seule ligne
// fine), mais elle brille quand l'objectif est atteignable. Un clic emmène au bon stand.
// Les règles (quel objectif montrer) sont dans src/jeu/objectifs.ts.

import { BLOCS } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { prochainObjectif, type IdStand } from '../jeu/objectifs'

type Props = {
  etat: EtatJeu
  onAllerAuStand: (stand: IdStand) => void
}

export function ProchainObjectif({ etat, onAllerAuStand }: Props) {
  const objectif = prochainObjectif(etat, (bloc) => BLOCS[bloc].nom)
  if (objectif === null) return null
  const pourcentage = Math.min(100, (objectif.valeur / objectif.max) * 100)

  return (
    <button
      className={`objectif ${objectif.pret ? 'objectif-pret' : ''}`}
      onClick={() => objectif.stand && onAllerAuStand(objectif.stand)}
      disabled={objectif.stand === null}
      title={objectif.stand ? 'Aller au bon stand' : 'Continue de creuser !'}
    >
      <span className="objectif-texte">
        <span aria-hidden="true">{objectif.pret ? '✨' : '🎯'}</span> <strong>{objectif.texte}</strong>
        {objectif.detail && <span className="objectif-detail"> · {objectif.detail}</span>}
      </span>
      <span className="objectif-piste" aria-hidden="true">
        <span className="objectif-remplie" style={{ width: `${pourcentage}%` }} />
      </span>
    </button>
  )
}
