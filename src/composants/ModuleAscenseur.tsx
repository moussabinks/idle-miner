// Le module de l'ascenseur, directement dans la mine : on le construit, on
// l'améliore (avec du fer et de la redstone) et on l'envoie au marché.

import { BLOCS } from '../jeu/donnees'
import {
  ameliorerAscenseur,
  ascenseurDisponible,
  auFond,
  envoyerAscenseur,
  niveauAscenseur,
  objetsAVendre,
  peutAmeliorerAscenseur,
  prochainNiveauAscenseur,
  quantite,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'

// « 12/20 fer » en vert s'il y en a assez, en rouge sinon.
function Besoin({ etat, bloc, nombre }: { etat: EtatJeu; bloc: 'fer' | 'redstone'; nombre: number }) {
  const possede = quantite(etat, bloc)
  return (
    <span className={possede >= nombre ? 'ok' : 'manque'}>
      {Math.min(possede, nombre)}/{nombre} {BLOCS[bloc].nom.toLowerCase()}
    </span>
  )
}

export function ModuleAscenseur({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  const niveau = niveauAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  const ascenseur = etat.ascenseur
  const enRoute = ascenseur.tempsRestant > 0
  const peutEnvoyer = auFond(etat) && ascenseurDisponible(etat) && Object.keys(objetsAVendre(etat)).length > 0

  return (
    <div className="module-ascenseur">
      <div className="module-titre">
        <strong>Ascenseur</strong>
        {niveau ? (
          <span className="discret">
            niv. {niveau.niveau} · {niveau.capacite} objets par voyage
          </span>
        ) : (
          <span className="discret">pas encore construit</span>
        )}
      </div>

      {niveau && (
        <div className="module-ligne">
          <span className="module-etat">
            {enRoute
              ? `${ascenseur.tempsRestant > ascenseur.tempsTotal / 2 ? 'Monte au marché' : 'Redescend'}… ${Math.ceil(ascenseur.tempsRestant)} s`
              : 'Prêt, à ton niveau'}
          </span>
          <button className="bouton bouton-petit bouton-vendre" disabled={!peutEnvoyer} onClick={() => jouer(envoyerAscenseur)}>
            Envoyer au marché
          </button>
        </div>
      )}

      {prochain ? (
        <div className="module-ligne">
          <span className="materiaux">
            <Besoin etat={etat} bloc="fer" nombre={prochain.fer} />
            <Besoin etat={etat} bloc="redstone" nombre={prochain.redstone} />
          </span>
          <button
            className="bouton bouton-petit"
            disabled={!peutAmeliorerAscenseur(etat) || enRoute}
            onClick={() => jouer(ameliorerAscenseur)}
          >
            {niveau ? `Améliorer (niv. ${prochain.niveau})` : 'Construire'}
          </button>
        </div>
      ) : (
        <span className="ok">Niveau maximum !</span>
      )}
    </div>
  )
}
