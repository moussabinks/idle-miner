// Le stand des mineurs (débloqué au prestige 2) : on embauche des mineurs qui creusent
// tout seuls, remontent vendre leur récolte et te donnent l'argent (moins leur salaire).

import { NIVEAUX_EMPLOYE, PRESTIGE_EMPLOYES, niveauMaxAuPrestige } from '../jeu/donnees'
import {
  activiteEmploye,
  ameliorerEmploye,
  embaucher,
  employeBloqueAuPrestige,
  iconeActiviteEmploye,
  employesDebloques,
  maxEmployes,
  nbDansSacEmploye,
  peutAmeliorerEmploye,
  coutAmeliorationEmploye,
  prixEmbauche,
  profondeurMaxEmploye,
  tailleSacEmploye,
  vitesseEmploye,
} from '../jeu/employes'
import { aLaSurface, type EtatJeu } from '../jeu/mineur'
import { multiplicateurSacMineurs, partSalaire } from '../jeu/talents'
import type { Action } from '../usePartie'
import { Achat, Amelioration } from './Amelioration'
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
        Tes mineurs creusent tout seuls. Quand leur sac est plein, ils remontent dans leur propre ascenseur (aussi rapide que le tien,
        donc améliorer ton ascenseur les aide), vendent leur récolte au marché puis redescendent : pendant ce temps-là, ils ne creusent pas. Ils s'occupent de leur équipement. Ils gardent {Math.round(partSalaire(etat) * 100)} % de leurs ventes comme salaire : le reste est pour toi. Ils
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
          <Achat
            etat={etat}
            cout={{ argent: prix, materiaux: {} }}
            texte="👷 Embaucher"
            possible={etat.argent >= prix && aLaSurface(etat)}
            onAcheter={() => jouer(embaucher)}
          />
        )}
      </div>

      {etat.employes.map((employe, index) => {
        const coutPioche = coutAmeliorationEmploye(employe)
        const prochaine = NIVEAUX_EMPLOYE[employe.niveau + 1]
        return (
          <div key={index} className="ligne-achat carte-employe">
            <div className="ligne-titre">
              <strong>👷 {employe.nom}</strong>
              <span className="badge">{iconeActiviteEmploye(employe)}</span>
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
            {prochaine && (
              <span className="discret">
                Équipement suivant : pioche en {prochaine.nom} (plus rapide, jusqu'à -{profondeurMaxEmploye(etat, { ...employe, niveau: employe.niveau + 1 })} m) et sac de{' '}
                {prochaine.sac * multiplicateurSacMineurs(etat)} places.
              </span>
            )}
            <Amelioration
              etat={etat}
              actuel={`Pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom} · sac de ${tailleSacEmploye(etat, employe)}`}
              niveau={employe.niveau + 1}
              niveauMax={NIVEAUX_EMPLOYE.length}
              niveauPermis={niveauMaxAuPrestige('mineur', etat.prestige) + 1}
              suivant={coutPioche !== null && prochaine ? { cout: coutPioche, texte: `⬆ Pioche en ${prochaine.nom}` } : null}
              bloqueAuPrestige={employeBloqueAuPrestige(etat, employe)}
              possible={peutAmeliorerEmploye(etat, employe)}
              onAmeliorer={() => jouer((e) => ameliorerEmploye(e, index))}
            />
          </div>
        )
      })}
    </div>
  )
}
