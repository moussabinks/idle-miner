// Les lignes d'achat et d'amélioration, les mêmes partout (mine, coffre, ascenseur, foreuse,
// générateur, mineurs, sac) pour que le jeu se lise d'un coup d'œil :
//   - des petits carrés pour les niveaux : pleins = déjà achetés, vides = à acheter ;
//   - ce qu'on a maintenant, puis le prix et le bouton du niveau suivant ;
//   - ou « 🔒 ... » si ce n'est pas encore débloqué, ou « ✔ Niveau max ».

import type { ReactNode } from 'react'
import type { Cout } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { PrixCout } from './PrixCout'

type Props = {
  etat: EtatJeu
  actuel: ReactNode // ce qu'on a maintenant (« 0,5 bloc/s », « 200 places »...)
  niveau: number // le nombre de niveaux achetés (pour les carrés)
  niveauMax: number // le nombre de niveaux en tout
  // Le niveau suivant : son prix et ce que dit le bouton (null = niveau maximum atteint).
  suivant: { cout: Cout; texte: ReactNode } | null
  verrou?: string | null // ce qu'il faut pour débloquer le niveau suivant (« au niveau 3 de la mine »)
  possible: boolean // on a de quoi payer (et rien d'autre ne l'empêche)
  onAmeliorer: () => void
  genre?: 'ameliorer' | 'acheter'
}

export function Amelioration({
  etat,
  actuel,
  niveau,
  niveauMax,
  suivant,
  verrou = null,
  possible,
  onAmeliorer,
  genre = 'ameliorer',
}: Props) {
  return (
    <div className="amelioration">
      <div className="amelioration-haut">
        <span className="amelioration-actuel">{actuel}</span>
        <span className="niveaux" aria-label={`Niveau ${niveau} sur ${niveauMax}`}>
          {Array.from({ length: niveauMax }, (_, i) => (
            <i key={i} className={i < niveau ? 'niveau-achete' : 'niveau-libre'} />
          ))}
        </span>
      </div>
      {suivant === null ? (
        <span className="amelioration-max">✔ Niveau max</span>
      ) : verrou !== null ? (
        <span className="amelioration-verrou">
          🔒 {suivant.texte} · {verrou}
        </span>
      ) : (
        <Achat etat={etat} cout={suivant.cout} texte={suivant.texte} possible={possible} onAcheter={onAmeliorer} genre={genre} />
      )}
    </div>
  )
}

// Un achat simple, présenté partout de la même façon : le prix à gauche (en vert ce qu'on
// a, en rouge ce qui manque), le bouton à droite avec ce qu'il fait.
export function Achat({
  etat,
  cout,
  texte,
  possible,
  onAcheter,
  genre = 'acheter',
}: {
  etat: EtatJeu
  cout: Cout
  texte: ReactNode
  possible: boolean
  onAcheter: () => void
  genre?: 'ameliorer' | 'acheter' | 'reparer' | 'recruter' | 'payer'
}) {
  return (
    <div className="module-ligne">
      <PrixCout etat={etat} cout={cout} />
      <button className={`bouton bouton-petit bouton-${genre}`} disabled={!possible} onClick={onAcheter}>
        {texte}
      </button>
    </div>
  )
}
