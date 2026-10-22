// La fenêtre d'un trajet de wagonnet (27/10). Elle s'ouvre quand on touche la bulle « 🛤️ » au
// milieu d'une ligne de rails (des rails viennent de relier deux bâtiments), ou quand on touche
// des rails déjà posés. On y règle chaque trajet qui passe par là :
//   - l'automatisation est-elle activée (du bâtiment A vers le bâtiment B) ?
//   - quels objets le wagonnet emporte (vers le marché) ?
// Rien ne change tant qu'on n'a pas validé. Aucune règle du jeu ici : on lit l'état et on
// appelle reglerTrajet (src/jeu/wagonnet.ts).

import { useEffect, useState } from 'react'
import { BATIMENTS, BLOCS, LIAISONS, type IdBloc, type IdLiaison } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { aUnPousseur, exclusDe, objetFixe, objetsAuChoix, trajetDe, trajetElectrique, type ReglageTrajet } from '../jeu/wagonnet'

type Props = {
  etat: EtatJeu
  liaisons: IdLiaison[] // les trajets qui passent par les rails touchés
  onValider: (reglages: Partial<Record<IdLiaison, ReglageTrajet>>) => void
  onFermer: () => void
}

export function FenetreTrajet({ etat, liaisons, onValider, onFermer }: Props) {
  // Les réglages en cours (pas encore validés). Un trajet pas encore créé est proposé activé :
  // c'est pour ça qu'on a posé les rails.
  const [reglages, setReglages] = useState<Partial<Record<IdLiaison, ReglageTrajet>>>(() =>
    Object.fromEntries(liaisons.map((l) => [l, { actif: true, exclus: exclusDe(etat, l) }])),
  )

  // Échap ferme la fenêtre sans rien changer.
  useEffect(() => {
    function touche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [onFermer])

  function changer(liaison: IdLiaison, modif: Partial<ReglageTrajet>) {
    setReglages((r) => ({ ...r, [liaison]: { ...(r[liaison] as ReglageTrajet), ...modif } }))
  }

  function basculerObjet(liaison: IdLiaison, bloc: IdBloc) {
    const exclus = reglages[liaison]?.exclus ?? []
    changer(liaison, { exclus: exclus.includes(bloc) ? exclus.filter((b) => b !== bloc) : [...exclus, bloc] })
  }

  const nouveau = liaisons.some((l) => trajetDe(etat, l) === null)

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-fenetre-trajet" onClick={onFermer}>
      <div className="carte fenetre-trajet" onClick={(e) => e.stopPropagation()}>
        <h2 id="titre-fenetre-trajet">🛤️ {nouveau ? 'Automatiser le trajet' : 'Régler le trajet'}</h2>
        {liaisons.map((liaison) => {
          const info = LIAISONS[liaison]
          const reglage = reglages[liaison] as ReglageTrajet
          const existe = trajetDe(etat, liaison) !== null
          const choix = objetsAuChoix(etat, liaison)
          const fixe = objetFixe(liaison)
          const electrique = trajetElectrique(etat, liaison)
          return (
            <section key={liaison} className={`reglage-trajet ${reglage.actif ? 'reglage-actif' : ''}`}>
              <div className="reglage-titre">
                <strong>
                  {info.emoji} {BATIMENTS[info.depart].nom} → {BATIMENTS[info.arrivee].nom}
                </strong>
                {existe && electrique && <span className="badge badge-vert">⚡ Électrique</span>}
              </div>
              <p className="discret">Un wagonnet {info.description}.</p>

              {/* L'interrupteur : un gros bouton qui passe du rouge au vert. */}
              <button
                className={`interrupteur-trajet ${reglage.actif ? 'allume' : ''}`}
                role="switch"
                aria-checked={reglage.actif}
                onClick={() => changer(liaison, { actif: !reglage.actif })}
              >
                <span className="interrupteur-curseur" aria-hidden="true" />
                {reglage.actif ? 'Automatisation activée' : 'Automatisation arrêtée'}
              </button>

              {reglage.actif && choix.length > 0 && (
                <>
                  <p className="reglage-sous-titre">Objets à envoyer :</p>
                  <div className="objets-trajet">
                    {choix.map((bloc) => {
                      const envoye = !reglage.exclus.includes(bloc)
                      return (
                        <button
                          key={bloc}
                          className={`objet-trajet ${envoye ? 'envoye' : ''}`}
                          aria-pressed={envoye}
                          title={envoye ? `${BLOCS[bloc].nom} : envoyé` : `${BLOCS[bloc].nom} : gardé`}
                          onClick={() => basculerObjet(liaison, bloc)}
                        >
                          <span aria-hidden="true">{BLOCS[bloc].emoji}</span> {BLOCS[bloc].nom}
                          <span className="objet-trajet-coche" aria-hidden="true">
                            {envoye ? '✔' : '✖'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {info.depart === 'puits' && (
                    <p className="discret petit">
                      Ce qui n’est pas envoyé reste dans le coffre de la mine (attention, plein, la mine s’arrête). Le charbon et la redstone des trajets vers la foreuse et le
                      générateur passent en premier.
                    </p>
                  )}
                </>
              )}
              {reglage.actif && fixe && (
                <p className="discret">
                  Emporte : {BLOCS[fixe].emoji} {BLOCS[fixe].nom}, quand il en manque.
                </p>
              )}
              {/* Un trajet automatique a toujours son pousseur (27/10). */}
              {reglage.actif && (
                <p className="discret petit">
                  {aUnPousseur(etat, liaison)
                    ? `👷 Son pousseur est embauché.${electrique ? ' ⚡ Électrique : il roule tout seul, bien plus vite.' : ' 💡 Dans le rayon du générateur, il roulera bien plus vite.'}`
                    : '👷 Il faut un pousseur pour ce trajet : embauche-le au Personnel (sinon, pousse-le toi-même).'}
                </p>
              )}
            </section>
          )
        })}
        <div className="boutons boutons-centre">
          <button className="bouton bouton-vendre" onClick={() => onValider(reglages)} autoFocus>
            ✔ Valider
          </button>
          <button className="bouton bouton-stop" onClick={onFermer}>
            ✖ Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
