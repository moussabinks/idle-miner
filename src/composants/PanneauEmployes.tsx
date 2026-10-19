// Le stand des mineurs (débloqué au prestige 2) : on embauche des mineurs qui creusent
// tout seuls, remontent vendre leur récolte et te donnent l'argent (moins leur salaire).

import { NIVEAUX_EMPLOYE, PRESTIGE_EMPLOYES } from '../jeu/donnees'
import {
  activiteEmploye,
  ameliorerEmploye,
  embaucher,
  employesDebloques,
  maxEmployes,
  nbDansSacEmploye,
  prixAmeliorationEmploye,
  prixEmbauche,
  tailleSacEmploye,
  vitesseEmploye,
} from '../jeu/employes'
import type { EtatJeu } from '../jeu/mineur'
import { partSalaire } from '../jeu/talents'
import type { Action } from '../usePartie'
import { Barre } from './Barre'

export function PanneauEmployes({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  if (!employesDebloques(etat)) {
    return (
      <div className="liste-cartes">
        <div className="ligne-achat verrouille">
          <strong>🔒 Fermé par une barrière</strong>
          <span className="discret">
            Ce bureau d'embauche s'ouvre au prestige {PRESTIGE_EMPLOYES}. Tu pourras y employer des mineurs qui creusent pour toi, même quand
            le jeu est fermé.
          </span>
        </div>
      </div>
    )
  }

  const prix = prixEmbauche(etat)
  const max = maxEmployes(etat)

  return (
    <div className="liste-cartes">
      <p className="discret">
        Tes mineurs creusent tout seuls. Quand leur sac est plein, ils remontent (en ascenseur s'il est construit, sinon à l'échelle), vendent
        leur récolte au marché puis redescendent : pendant ce temps-là, ils ne creusent pas. Ils s'occupent de leur équipement. Ils gardent {Math.round(partSalaire(etat) * 100)} % de leurs ventes comme salaire : le reste est pour toi. Ils
        travaillent même quand le jeu est fermé, et restent après un prestige.
      </p>

      <div className="ligne-achat">
        <div className="ligne-titre">
          <strong>👷 Embaucher un mineur</strong>
          <span className="badge">
            {etat.employes.length} / {max}
          </span>
        </div>
        {prix === null ? (
          <span className="discret">Ton équipe est complète. Chaque prestige te permet d'en employer un de plus (6 au plus).</span>
        ) : (
          <div className="boutons">
            <button className="bouton bouton-petit bouton-acheter" disabled={etat.argent < prix} onClick={() => jouer(embaucher)}>
              Embaucher · {prix.toLocaleString('fr-FR')} $
            </button>
          </div>
        )}
      </div>

      {etat.employes.map((employe, index) => {
        const prixPioche = prixAmeliorationEmploye(employe)
        const prochaine = NIVEAUX_EMPLOYE[employe.niveau + 1]
        return (
          <div key={index} className="ligne-achat carte-employe">
            <div className="ligne-titre">
              <strong>👷 {employe.nom}</strong>
              <span className="badge">Pioche en {NIVEAUX_EMPLOYE[employe.niveau].nom}</span>
            </div>
            <span className="discret">
              {activiteEmploye(etat, employe)} · {vitesseEmploye(etat, employe).toLocaleString('fr-FR')} bloc/s · t'a rapporté{' '}
              {employe.gagne.toLocaleString('fr-FR')} $
            </span>
            <Barre
              valeur={nbDansSacEmploye(employe)}
              max={tailleSacEmploye(etat, employe)}
              texte={`Sac : ${nbDansSacEmploye(employe)} / ${tailleSacEmploye(etat, employe)}`}
              couleur="or"
            />
            {prixPioche !== null && prochaine && (
              <div className="boutons">
                <span className="discret">
                  Pioche en {prochaine.nom} : plus rapide, jusqu'à -{prochaine.profMax} m, et sac de {prochaine.sac * (tailleSacEmploye(etat, employe) / NIVEAUX_EMPLOYE[employe.niveau].sac)} places
                </span>
                <button
                  className="bouton bouton-petit bouton-ameliorer"
                  disabled={etat.argent < prixPioche}
                  onClick={() => jouer((e) => ameliorerEmploye(e, index))}
                >
                  Améliorer · {prixPioche.toLocaleString('fr-FR')} $
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
