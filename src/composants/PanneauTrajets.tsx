// Les trajets des wagonnets qui partent d'un bâtiment (24/10), dans son panneau (la mine, la
// foreuse). Pour chaque arrivée possible :
//   - pas encore de rails jusque-là : on explique comment faire ;
//   - des rails, mais pas de trajet : « Envoyer un wagonnet vers… » (c'est le joueur qui choisit) ;
//   - un trajet : où en est son wagonnet, le pousser soi-même, ou arrêter le trajet.
// À la mine, on peut aussi agrandir les wagonnets (pour tous les trajets).
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu.

import { BATIMENTS, LIAISONS, NIVEAUX_WAGONNET, type IdBatiment, type IdLiaison } from '../jeu/donnees'
import { peutPayer } from '../jeu/mineur'
import {
  aCharger,
  ameliorerWagonnet,
  capaciteWagonnet,
  creerTrajet,
  distanceDepuisLeDepart,
  enRoute,
  ligneDe,
  liaisonsDepuis,
  longueurTrajet,
  peutPousser,
  pousserTrajet,
  prochainNiveauWagonnet,
  supprimerTrajet,
  trajetDe,
  trajetElectrique,
} from '../jeu/wagonnet'
import { Amelioration } from './Amelioration'
import { Barre } from './Barre'
import type { PropsPanneau } from './Panneaux'

// Les bâtiments des trajets, avec leur article (« la mine », « le marché »...).
const NOMS: Partial<Record<IdBatiment, { le: string; au: string }>> = {
  puits: { le: 'la mine', au: 'à la mine' },
  marche: { le: 'le marché', au: 'au marché' },
  foreuse: { le: 'la foreuse', au: 'à la foreuse' },
  generateur: { le: 'le générateur', au: 'au générateur' },
}
const le = (id: IdBatiment) => NOMS[id]?.le ?? BATIMENTS[id].nom
const au = (id: IdBatiment) => NOMS[id]?.au ?? BATIMENTS[id].nom

function Trajet({ etat, jouer, liaison }: PropsPanneau & { liaison: IdLiaison }) {
  const info = LIAISONS[liaison]
  const depart = BATIMENTS[info.depart]
  const arrivee = BATIMENTS[info.arrivee]
  const ligne = ligneDe(etat, liaison)
  const trajet = trajetDe(etat, liaison)
  const titre = (
    <strong>
      {info.emoji} {depart.nom} → {arrivee.nom}
    </strong>
  )

  if (!ligne) {
    return (
      <div className="ligne-achat trajet trajet-sans-rails">
        {titre}
        <span className="discret">
          Relie {le(info.depart)} {au(info.arrivee)} avec des rails (menu Bâtiments, 3 🔩 fer la case) : un wagonnet {info.description}.
        </span>
      </div>
    )
  }

  if (!trajet) {
    return (
      <div className="ligne-achat trajet">
        {titre}
        <span className="discret">Les rails sont posés ! Un wagonnet {info.description}.</span>
        <div className="boutons">
          <button className="bouton bouton-petit bouton-acheter" onClick={() => jouer((e) => creerTrajet(e, liaison))}>
            🛤️ Envoyer un wagonnet vers {le(info.arrivee)}
          </button>
        </div>
      </div>
    )
  }

  const electrique = trajetElectrique(etat, liaison)
  const pousseur = trajet.pousseur === 'joueur' ? 'toi' : trajet.pousseur === 'electricite' ? 'l’électricité ⚡' : trajet.pousseur
  const aPorter = aCharger(etat, liaison)
  return (
    <div className="ligne-achat trajet trajet-actif">
      <div className="ligne-titre">
        {titre}
        {electrique && <span className="badge badge-vert">⚡ Électrique</span>}
      </div>
      <span className="discret">
        {enRoute(trajet)
          ? `${trajet.etape === 'aller' ? `En route vers ${le(info.arrivee)}` : `Revient ${au(info.depart)}`}, poussé par ${pousseur}.`
          : aPorter === 0
            ? 'Au quai : rien à porter pour l’instant.'
            : electrique
              ? 'Il part tout seul.'
              : etat.employes.some((e) => e.role === 'pousseur' && e.trajet === liaison)
                ? 'Son pousseur va le pousser.'
                : 'Au quai. Pousse-le, ou embauche un pousseur pour ce trajet au Personnel.'}
      </span>
      {enRoute(trajet) && (
        <Barre valeur={distanceDepuisLeDepart(etat, trajet)} max={longueurTrajet(ligne)} texte={trajet.etape === 'aller' ? `→ ${arrivee.nom}` : `← ${depart.nom}`} couleur="or" />
      )}
      <div className="boutons">
        <button className="bouton bouton-petit bouton-voyage" disabled={!peutPousser(etat, liaison)} onClick={() => jouer((e) => pousserTrajet(e, liaison))}>
          🛤️ Pousser ({Math.min(capaciteWagonnet(etat), aPorter)} objets)
        </button>
        <button className="bouton bouton-petit bouton-stop" title="Arrêter ce trajet (les rails restent)" onClick={() => jouer((e) => supprimerTrajet(e, liaison))}>
          ✖ Arrêter
        </button>
      </div>
    </div>
  )
}

export function PanneauTrajets({ etat, jouer, depart }: PropsPanneau & { depart: IdBatiment }) {
  const liaisons = liaisonsDepuis(etat, depart)
  const prochain = prochainNiveauWagonnet(etat)
  if (liaisons.length === 0) return null
  return (
    <>
      <h4 className="titre-trajets">🛤️ Wagonnets</h4>
      {liaisons.map((liaison) => (
        <Trajet key={liaison} etat={etat} jouer={jouer} liaison={liaison} />
      ))}
      {depart === 'puits' && etat.trajets.length > 0 && (
        <div className="ligne-achat">
          <strong>🛒 Taille des wagonnets</strong>
          <Amelioration
            etat={etat}
            actuel={`${capaciteWagonnet(etat).toLocaleString('fr-FR')} places`}
            niveau={etat.niveauWagonnets + 1}
            niveauMax={NIVEAUX_WAGONNET.length}
            suivant={prochain && { cout: prochain.cout, texte: `⬆ ${prochain.capacite.toLocaleString('fr-FR')} places` }}
            possible={prochain !== null && peutPayer(etat, prochain.cout)}
            onAmeliorer={() => jouer(ameliorerWagonnet)}
          />
        </div>
      )}
    </>
  )
}
