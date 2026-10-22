// Les trajets des wagonnets qui partent d'un bâtiment (24/10), dans son panneau (la mine, la
// foreuse). Pour chaque arrivée possible :
//   - pas encore de rails jusque-là : on explique comment faire ;
//   - des rails, mais pas de trajet : on le crée avec la bulle « 🛤️ Automatiser » sur les rails ;
//   - un trajet : où en est son wagonnet, le pousser soi-même, ou arrêter le trajet.
// À la mine, on peut aussi agrandir les wagonnets (pour tous les trajets).
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu.

import { BATIMENTS, LIAISONS, NIVEAUX_WAGONNET, type IdBatiment, type IdLiaison } from '../jeu/donnees'
import { peutPayer } from '../jeu/mineur'
import {
  aCharger,
  aUnPousseur,
  ameliorerWagonnet,
  capaciteWagonnet,
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

function Trajet({ etat, jouer, liaison, onReglerTrajet }: PropsPanneau & { liaison: IdLiaison }) {
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
    // Une seule ligne (27/10) : l'explication complète est dans la bulle d'aide.
    return (
      <div
        className="ligne-achat trajet trajet-sans-rails"
        title={`Relie ${le(info.depart)} ${au(info.arrivee)} avec des rails (menu Bâtiments, 3 fer la case), puis touche la bulle 🛤️ sur les rails : un wagonnet ${info.description}.`}
      >
        <div className="ligne-titre">
          {titre}
          <span className="discret">🛤️ Pas encore de rails</span>
        </div>
      </div>
    )
  }

  if (!trajet) {
    // Le trajet se crée sur la carte (27/10) : la bulle « 🛤️ Automatiser » au milieu des rails.
    return (
      <div className="ligne-achat trajet">
        {titre}
        <span className="discret">Les rails sont posés ! Touche la bulle 🛤️ Automatiser sur les rails pour lancer le wagonnet ({info.description}).</span>
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
          : !aUnPousseur(etat, liaison)
            ? 'Pas de pousseur : embauche-en un pour ce trajet au Personnel (ou pousse-le toi-même).'
            : aPorter === 0
              ? 'Au quai : rien à porter pour l’instant.'
              : electrique
                ? 'Son pousseur le lance : il roule tout seul ⚡.'
                : 'Son pousseur va le pousser.'}
      </span>
      {enRoute(trajet) && (
        <Barre valeur={distanceDepuisLeDepart(etat, trajet)} max={longueurTrajet(ligne)} texte={trajet.etape === 'aller' ? `→ ${arrivee.nom}` : `← ${depart.nom}`} couleur="or" />
      )}
      <div className="boutons">
        <button className="bouton bouton-petit bouton-voyage" disabled={!peutPousser(etat, liaison)} onClick={() => jouer((e) => pousserTrajet(e, liaison))}>
          🛤️ Pousser ({Math.min(capaciteWagonnet(etat), aPorter)} objets)
        </button>
        {/* La fenêtre des trajets : les objets à envoyer, l'aperçu des voyages (27/10). */}
        {onReglerTrajet && (
          <button className="bouton bouton-petit bouton-neutre" title="Choisir les objets à envoyer" onClick={() => onReglerTrajet([liaison])}>
            ⚙️ Régler
          </button>
        )}
        <button className="bouton bouton-petit bouton-stop" title="Arrêter ce trajet (les rails restent)" onClick={() => jouer((e) => supprimerTrajet(e, liaison))}>
          ✖ Arrêter
        </button>
      </div>
    </div>
  )
}

export function PanneauTrajets({ etat, jouer, depart, onReglerTrajet }: PropsPanneau & { depart: IdBatiment }) {
  const liaisons = liaisonsDepuis(etat, depart)
  const prochain = prochainNiveauWagonnet(etat)
  if (liaisons.length === 0) return null
  return (
    <>
      <h4 className="titre-trajets">🛤️ Wagonnets</h4>
      {liaisons.map((liaison) => (
        <Trajet key={liaison} etat={etat} jouer={jouer} liaison={liaison} onReglerTrajet={onReglerTrajet} />
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
