// Une jauge par objet du sac, pour choisir combien en vendre (au marché) ou en envoyer
// (par l'ascenseur) : on fait glisser le curseur, ou on clique sur « Max » pour tout prendre.
// « Tout sélectionner » met toutes les jauges au maximum d'un coup.
//
// Le choix est gardé dans le composant qui affiche les jauges. Un objet « gardé »
// (jauge mise à 0, retenu par le jeu) recommence à 0 la fois suivante.

import { BLOCS, type IdBloc } from '../jeu/donnees'
import { quantiteVoulue, type Choix } from '../choix'

type Props = {
  piles: [IdBloc, number][]
  choix: Choix
  gardes: IdBloc[]
  onChanger: (bloc: IdBloc, valeur: number | 'max') => void
  prixUnitaire: (bloc: IdBloc) => number // prix de vente d'un objet (bonus compris)
  onToutSelectionner: () => void
}

export function Jauges({ piles, choix, gardes, onChanger, prixUnitaire, onToutSelectionner }: Props) {
  const toutSelectionne = piles.every(([bloc, nombre]) => quantiteVoulue(choix, gardes, bloc, nombre) === nombre)
  return (
    <>
      <button className="bouton bouton-petit bouton-neutre tout-selectionner" disabled={toutSelectionne} onClick={onToutSelectionner}>
        ☑️ Tout sélectionner
      </button>
      <ul className="jauges">
        {piles.map(([bloc, nombre]) => {
          const quantite = quantiteVoulue(choix, gardes, bloc, nombre)
          return (
            // Tout sur une ligne (pour que la liste reste courte) : le bloc, son nom, la jauge,
            // le compteur, la valeur et le bouton « Max ».
            <li key={bloc} className={quantite === 0 ? 'garde' : ''} title={BLOCS[bloc].nom}>
              <span className={`mini-bloc bloc-${bloc} roche-pierre`} aria-hidden="true" />
              <span className="jauge-nom">{BLOCS[bloc].nom}</span>
              <input
                type="range"
                min={0}
                max={nombre}
                value={quantite}
                aria-label={`Quantité de ${BLOCS[bloc].nom}`}
                onChange={(e) => {
                  const valeur = Number(e.target.value)
                  onChanger(bloc, valeur >= nombre ? 'max' : valeur)
                }}
              />
              {/* Le compteur : combien sont choisis, sur combien. */}
              <span className="jauge-compteur">
                {quantite}/{nombre}
              </span>
              <span className="jauge-valeur">{Math.round(quantite * prixUnitaire(bloc))} $</span>
              <button className="bouton bouton-petit bouton-neutre jauge-max" disabled={quantite === nombre} onClick={() => onChanger(bloc, 'max')}>
                Max
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
