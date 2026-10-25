// Les trajets des wagonnets d'un bâtiment (24/10, refait le 25/10), dans son panneau : ceux qui
// en partent (la mine, la foreuse) et/ou ceux qui y arrivent (le marché, la foreuse).
// Une ligne par trajet, avec une seule chose à faire :
//   - pas encore de rails : « Pas de rails » (on les pose avec 🏗️ Construire) ;
//   - des rails, mais pas de trajet : « Automatiser » (ouvre la fenêtre du trajet) ;
//   - un trajet : où en est son wagonnet, « Pousser » si personne ne le pousse, et « Régler ».
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu.

import { BATIMENTS, LIAISONS, LISTE_LIAISONS, type IdBatiment, type IdLiaison } from '../jeu/donnees'
import { nombre, t } from '../jeu/langue'
import { batimentPose } from '../jeu/village'
import { aCharger, aUnPousseur, capaciteTrajet, distanceDepuisLeDepart, enRoute, ligneDe, longueurTrajet, peutPousser, pousserTrajet, trajetDe, trajetElectrique } from '../jeu/wagonnet'
import { Barre } from './Barre'
import { useJeu } from './contexteJeu'
import { nomTrajet } from './nomTrajet'
import type { PropsPanneau } from './Panneaux'

// Une ligne : le nom du trajet, son état, et le bouton.
export function LigneTrajet({ liaison, onReglerTrajet }: { liaison: IdLiaison; onReglerTrajet?: (liaisons: IdLiaison[]) => void }) {
  const { etat, jouer } = useJeu()
  const info = LIAISONS[liaison]
  const ligne = ligneDe(etat, liaison)
  const trajet = trajetDe(etat, liaison)

  let etiquette: { texte: string; classe: string }
  let detail: string
  if (!ligne) {
    etiquette = { texte: t('Pas de rails'), classe: '' }
    detail = t('Relie les deux bâtiments avec des rails (🏗️ Construire).')
  } else if (!trajet) {
    etiquette = { texte: t('Rails posés'), classe: 'etiquette-jaune' }
    detail = t('Un wagonnet {action}.', { action: t(info.description) })
  } else if (enRoute(trajet)) {
    etiquette = { texte: trajetElectrique(etat, liaison) ? `⚡ ${t('En route')}` : t('En route'), classe: 'etiquette-vert' }
    detail = trajet.etape === 'aller' ? `→ ${t(BATIMENTS[info.arrivee].nom)}` : `← ${t(BATIMENTS[info.depart].nom)}`
  } else if (!aUnPousseur(etat, liaison)) {
    etiquette = { texte: t('Pas de pousseur'), classe: 'etiquette-rose' }
    detail = t('Embauche un pousseur au Personnel, ou pousse-le toi-même.')
  } else {
    etiquette = { texte: t('Au quai'), classe: 'etiquette-bleu' }
    detail = aCharger(etat, liaison) === 0 ? t('Rien à emporter pour l’instant.') : t('Son pousseur va repartir.')
  }

  const aPorter = Math.min(capaciteTrajet(etat, liaison), aCharger(etat, liaison))
  return (
    <div className="ligne-amelioration ligne-wagonnet">
      <span className="ligne-wagonnet-icone" aria-hidden="true">
        {info.emoji}
      </span>
      <div className="ligne-amelioration-texte">
        <span className="ligne-amelioration-nom">
          {nomTrajet(liaison)} <span className={`etiquette ${etiquette.classe}`}>{etiquette.texte}</span>
        </span>
        {trajet && ligne && enRoute(trajet) ? (
          <Barre valeur={distanceDepuisLeDepart(etat, trajet)} max={longueurTrajet(ligne)} texte={detail} couleur="or" />
        ) : (
          <span className="ligne-amelioration-effet">{detail}</span>
        )}
      </div>
      {ligne && (
        <span className="ligne-amelioration-boutons">
          {/* Personne ne le pousse : le joueur peut le pousser lui-même. */}
          {trajet && !aUnPousseur(etat, liaison) && (
            <button className="btn btn-jaune btn-petit" disabled={!peutPousser(etat, liaison)} onClick={() => jouer((e) => pousserTrajet(e, liaison))}>
              <span>🛒 {t('Pousser')}</span>
              {aPorter > 0 && <span className="prix">{t('{n} blocs', { n: nombre(aPorter) })}</span>}
            </button>
          )}
          {onReglerTrajet && (
            <button className={`btn btn-petit ${trajet ? 'btn-bleu' : 'btn-vert'}`} onClick={() => onReglerTrajet([liaison])}>
              {trajet ? `⚙️ ${t('Régler')}` : `🛤️ ${t('Automatiser')}`}
            </button>
          )}
        </span>
      )}
    </div>
  )
}

// Les trajets qui partent de « depart » et/ou arrivent à « arrivee » (les deux bâtiments construits).
export function PanneauTrajets({ depart, arrivee, onReglerTrajet }: Partial<PropsPanneau> & { depart?: IdBatiment; arrivee?: IdBatiment }) {
  const { etat } = useJeu()
  const liaisons = LISTE_LIAISONS.filter((l) => {
    const info = LIAISONS[l]
    const concerne = info.depart === depart || info.arrivee === arrivee
    return concerne && batimentPose(etat.village, info.depart) !== null && batimentPose(etat.village, info.arrivee) !== null
  })
  if (liaisons.length === 0) return <p className="discret">{t('Aucun trajet possible pour l’instant : construis le bâtiment d’arrivée.')}</p>
  return (
    <div className="liste-lignes">
      {liaisons.map((liaison) => (
        <LigneTrajet key={liaison} liaison={liaison} onReglerTrajet={onReglerTrajet} />
      ))}
    </div>
  )
}
