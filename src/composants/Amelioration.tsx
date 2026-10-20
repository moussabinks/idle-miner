// Les lignes d'achat et d'amélioration, les mêmes partout (ascenseur, foreuse, chariot, mineurs, sac,
// enchantements) pour que le jeu se lise d'un coup d'œil :
//   - des petits carrés pour les niveaux : pleins = déjà achetés, vides = à acheter,
//     avec un cadenas = bloqués par le prestige ;
//   - ce qu'on a maintenant, puis le prix et le bouton du niveau suivant ;
//   - ou « 🔒 Prestige N » si le prestige ne le permet pas encore, ou « ✔ Niveau max ».

import type { ReactNode } from 'react'
import type { Cout } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { PrixCout } from './PrixCout'

type Props = {
  etat: EtatJeu
  actuel: ReactNode // ce qu'on a maintenant (« 0,5 bloc/s », « 200 places »...)
  niveau: number // le nombre de niveaux achetés (pour les carrés)
  niveauMax: number // le nombre de niveaux en tout
  niveauPermis?: number // jusqu'où le prestige permet d'aller (par défaut : tout)
  // Le niveau suivant : son prix et ce que dit le bouton (null = niveau maximum atteint).
  suivant: { cout: Cout; texte: ReactNode } | null
  bloqueAuPrestige?: number | null // le prestige qu'il faut pour le niveau suivant
  possible: boolean // on a de quoi payer (et rien d'autre ne l'empêche)
  onAmeliorer: () => void
  genre?: 'ameliorer' | 'acheter' | 'enchanter'
}

export function Amelioration({
  etat,
  actuel,
  niveau,
  niveauMax,
  niveauPermis = niveauMax,
  suivant,
  bloqueAuPrestige = null,
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
            <i key={i} className={i < niveau ? 'niveau-achete' : i < niveauPermis ? 'niveau-libre' : 'niveau-bloque'} />
          ))}
        </span>
      </div>
      {suivant === null ? (
        <span className="amelioration-max">✔ Niveau max</span>
      ) : bloqueAuPrestige !== null ? (
        <span className="amelioration-verrou">
          🔒 {suivant.texte} · au prestige {bloqueAuPrestige}
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
  genre?: 'ameliorer' | 'acheter' | 'enchanter' | 'reparer' | 'recruter' | 'payer'
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
