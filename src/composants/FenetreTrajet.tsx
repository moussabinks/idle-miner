// La fenêtre des trajets de wagonnets (27/10). Elle s'ouvre quand on touche la bulle « 🛤️ » au
// milieu d'une ligne de rails (des rails viennent de relier deux bâtiments), ou quand on touche
// des rails déjà posés. C'est le poste d'aiguillage :
//   - en haut, un onglet par trajet qui passe par ces rails (s'il y en a plusieurs) ;
//   - le dessin du trajet : le bâtiment de départ, les rails où roule le wagonnet, l'arrivée ;
//   - l'interrupteur : automatisation activée ou arrêtée ;
//   - les objets, en grosses tuiles à toucher : vert = le wagonnet l'emporte, gris = il le laisse
//     (avec combien il y en a au départ) ; « Tout » et « Rien » ;
//   - l'aperçu du prochain voyage, qui change à chaque toucher : ce qu'il emporte, ce que ça
//     vaut, le temps d'un aller-retour, et ce que ça rapporte par minute.
// Rien ne change tant qu'on n'a pas validé. Aucune règle du jeu ici : on lit l'état et on
// appelle reglerTrajet / apercuTrajet (src/jeu/wagonnet.ts).

import { useEffect, useState } from 'react'
import { BATIMENTS, BLOCS, LIAISONS, SECONDES_PAR_CHARBON, SECONDES_PAR_REDSTONE, type IdBloc, type IdLiaison } from '../jeu/donnees'
import type { EtatJeu, Inventaire } from '../jeu/mineur'
import { charbonMaxForeuse } from '../jeu/foreuse'
import { multiplicateurGenerateur, reserveMaxGenerateur, texteBonusGenerateur } from '../jeu/generateur'
import { apercuTrajet, exclusAffiches, objetFixe, objetsAuChoix, trajetDe, type ReglageTrajet } from '../jeu/wagonnet'
import { IMAGES_BATIMENTS } from './iso'
import { BoutonsRail } from './FenetreRail'

type Props = {
  etat: EtatJeu
  liaisons: IdLiaison[] // les trajets qui passent par les rails touchés
  onValider: (reglages: Partial<Record<IdLiaison, ReglageTrajet>>) => void
  onFermer: () => void
  // (30/10) On a touché un rail : de quoi le déplacer ou le retirer, en bas de la fenêtre.
  actionsRail?: { onDeplacer: () => void; onRetirer: () => void } | null
}

// Ce qu'il y a au départ du trajet (le coffre de la mine, ou le chariot de la foreuse).
function stockDuDepart(etat: EtatJeu, liaison: IdLiaison): Inventaire {
  return LIAISONS[liaison].depart === 'foreuse' ? etat.foreuse.chariot : etat.coffre.contenu
}

const duree = (s: number) => (s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')}`)

// Le dessin du trajet : le départ, les rails (le wagonnet y roule quand le trajet est activé), l'arrivée.
function DessinTrajet({ liaison, actif }: { liaison: IdLiaison; actif: boolean }) {
  const info = LIAISONS[liaison]
  return (
    <div className={`dessin-trajet ${actif ? 'dessin-actif' : ''}`} aria-hidden="true">
      <span className="dessin-batiment">
        <img src={IMAGES_BATIMENTS[info.depart]} alt="" draggable={false} />
        <small>{BATIMENTS[info.depart].nom}</small>
      </span>
      <span className="dessin-rails">
        <span className="dessin-voie" />
        <span className="dessin-wagonnet">🛒</span>
      </span>
      <span className="dessin-batiment">
        <img src={IMAGES_BATIMENTS[info.arrivee]} alt="" draggable={false} />
        <small>{BATIMENTS[info.arrivee].nom}</small>
      </span>
    </div>
  )
}

// La réserve que le wagonnet remplit (charbon de la foreuse, redstone du générateur).
function Reserve({ etat, liaison }: { etat: EtatJeu; liaison: IdLiaison }) {
  const foreuse = liaison === 'mine-foreuse'
  const bloc = foreuse ? 'charbon' : 'redstone'
  const max = foreuse ? charbonMaxForeuse(etat) : reserveMaxGenerateur(etat) / SECONDES_PAR_REDSTONE
  const actuel = Math.min(max, Math.floor(foreuse ? etat.foreuse.carburant / SECONDES_PAR_CHARBON : etat.generateur.carburant / SECONDES_PAR_REDSTONE))
  return (
    <div className="tuile-fixe">
      <span className="tuile-icone">{BLOCS[bloc].emoji}</span>
      <span className="tuile-fixe-texte">
        <strong>{BLOCS[bloc].nom}, toujours</strong>
        <span className="discret">
          {foreuse
            ? `Quand le réservoir (${max}) n’est plus plein, il emporte tout le charbon du coffre : le surplus va dans le chariot.`
            : `Il en apporte quand il en manque, jusqu’à ${max} dans le générateur.`}
        </span>
        <span className="tuile-reserve">
          <i style={{ width: `${Math.round((actuel / max) * 100)}%` }} />
          <span>
            {actuel} / {max}
          </span>
        </span>
      </span>
    </div>
  )
}

export function FenetreTrajet({ etat, liaisons, onValider, onFermer, actionsRail = null }: Props) {
  // Les réglages en cours (pas encore validés), un par trajet. Un trajet pas encore créé est
  // proposé activé : c'est pour ça qu'on a posé les rails.
  const [reglages, setReglages] = useState<Partial<Record<IdLiaison, ReglageTrajet>>>(() =>
    Object.fromEntries(liaisons.map((l) => [l, { actif: true, exclus: exclusAffiches(etat, l) }])),
  )
  const [ouvert, setOuvert] = useState<IdLiaison>(liaisons[0])
  // Le dernier objet touché (il rebondit).
  const [touche, setTouche] = useState<{ bloc: IdBloc; n: number } | null>(null)

  // Échap ferme la fenêtre sans rien changer.
  useEffect(() => {
    function clavier(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', clavier)
    return () => window.removeEventListener('keydown', clavier)
  }, [onFermer])

  function changer(liaison: IdLiaison, modif: Partial<ReglageTrajet>) {
    setReglages((r) => ({ ...r, [liaison]: { ...(r[liaison] as ReglageTrajet), ...modif } }))
  }

  const liaison = ouvert
  const info = LIAISONS[liaison]
  const reglage = reglages[liaison] as ReglageTrajet
  const choix = objetsAuChoix(etat, liaison)
  const fixe = objetFixe(liaison)
  const stock = stockDuDepart(etat, liaison)
  const apercu = apercuTrajet(etat, liaison, reglage.exclus)
  const versLeMarche = info.arrivee === 'marche'
  const nouveau = liaisons.some((l) => trajetDe(etat, l) === null)
  const pousseur = etat.employes.find((e) => e.role === 'pousseur' && e.trajet === liaison && e.tempsPaye > 0)

  function basculer(bloc: IdBloc) {
    const exclus = reglage.exclus
    changer(liaison, { exclus: exclus.includes(bloc) ? exclus.filter((b) => b !== bloc) : [...exclus, bloc] })
    setTouche((t) => ({ bloc, n: (t?.n ?? 0) + 1 }))
  }

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-fenetre-trajet" onClick={onFermer}>
      <div className="carte fenetre-trajet" onClick={(e) => e.stopPropagation()}>
        <div className="entete-trajet">
          <h2 id="titre-fenetre-trajet">🛤️ {nouveau ? 'Automatiser' : 'Tes trajets'}</h2>
          <button className="bouton-fermer" onClick={onFermer} aria-label="Fermer">
            ✖
          </button>
        </div>

        {/* Un onglet par trajet qui passe par ces rails, avec un voyant (allumé ou éteint). */}
        {liaisons.length > 1 && (
          <div className="onglets-trajets" role="tablist">
            {liaisons.map((l) => (
              <button key={l} role="tab" aria-selected={l === ouvert} className={`onglet-trajet ${l === ouvert ? 'actif' : ''}`} onClick={() => setOuvert(l)}>
                <span className={`voyant ${reglages[l]?.actif ? 'allume' : ''}`} aria-hidden="true" />
                {LIAISONS[l].emoji} {BATIMENTS[LIAISONS[l].arrivee].nom}
              </button>
            ))}
          </div>
        )}

        <DessinTrajet liaison={liaison} actif={reglage.actif} />
        <p className="discret description-trajet">Un wagonnet {info.description}.</p>

        {/* L'interrupteur : un gros bouton qui passe du rouge au vert. */}
        <button className={`interrupteur-trajet ${reglage.actif ? 'allume' : ''}`} role="switch" aria-checked={reglage.actif} onClick={() => changer(liaison, { actif: !reglage.actif })}>
          <span className="interrupteur-curseur" aria-hidden="true" />
          {reglage.actif ? 'Automatisation activée' : 'Automatisation arrêtée'}
        </button>

        {reglage.actif && (
          <>
            {choix.length > 0 && (
              <section className="choix-objets">
                <div className="choix-objets-titre">
                  <strong>Que transporte le wagonnet ?</strong>
                  <span className="choix-rapides">
                    <button onClick={() => changer(liaison, { exclus: [] })}>Tout</button>
                    <button onClick={() => changer(liaison, { exclus: [...choix] })}>Rien</button>
                  </span>
                </div>
                <div className="tuiles-objets">
                  {choix.map((bloc) => {
                    const envoye = !reglage.exclus.includes(bloc)
                    const nombre = stock[bloc] ?? 0
                    return (
                      <button
                        key={touche?.bloc === bloc ? `${bloc}-${touche.n}` : bloc}
                        className={`tuile-objet ${envoye ? 'envoye' : 'garde'} ${touche?.bloc === bloc ? 'touchee' : ''}`}
                        aria-pressed={envoye}
                        title={envoye ? `${BLOCS[bloc].nom} : le wagonnet l’emporte` : `${BLOCS[bloc].nom} : il reste au départ`}
                        onClick={() => basculer(bloc)}
                      >
                        <span className="tuile-badge" aria-hidden="true">
                          {envoye ? '✔' : '✖'}
                        </span>
                        <span className="tuile-icone" aria-hidden="true">
                          {BLOCS[bloc].emoji}
                        </span>
                        <span className="tuile-nom">{BLOCS[bloc].nom}</span>
                        <span className="tuile-infos">
                          {BLOCS[bloc].prix} $ · ×{nombre.toLocaleString('fr-FR')}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="discret petit">
                  Vert : il l’emporte et le vend. Gris : il le laisse au départ.
                  {liaison === 'mine-marche' && ' Le charbon et la redstone des trajets vers la foreuse et le générateur passent avant.'}
                </p>
              </section>
            )}
            {fixe && <Reserve etat={etat} liaison={liaison} />}

            {/* L'aperçu du prochain voyage : il change à chaque toucher. */}
            <section className="apercu-voyage">
              <div className="apercu-chargement">
                <span className="apercu-titre">Prochain voyage</span>
                {apercu.objets.length === 0 ? (
                  <span className="discret">rien à porter pour l’instant</span>
                ) : (
                  <span className="apercu-objets">
                    {apercu.objets.map(([bloc, n]) => (
                      <span key={bloc} className="apercu-objet">
                        {BLOCS[bloc].emoji} {n}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className="apercu-chiffres">
                {versLeMarche && (
                  <span key={apercu.valeur} className="apercu-valeur">
                    +{apercu.valeur.toLocaleString('fr-FR')} $
                  </span>
                )}
                <span className="apercu-detail">
                  ⏱️ {duree(apercu.secondes)} l’aller-retour
                  {versLeMarche && apercu.parMinute > 0 && <> · ≈ {Math.round(apercu.parMinute).toLocaleString('fr-FR')} $/min</>}
                </span>
              </div>
            </section>

            {/* Qui le fait rouler (27/10 : un pousseur par trajet automatique). */}
            <p className={`moteur-trajet moteur-${apercu.moteur}`}>
              {apercu.moteur === 'electricite'
                ? `⚡ Rails électriques : ${pousseur?.nom} le pousse ${texteBonusGenerateur(multiplicateurGenerateur(etat) - 1)} plus vite.`
                : apercu.moteur === 'pousseur'
                  ? `👷 ${pousseur?.nom} le pousse.`
                  : '👷 Pas de pousseur : embauche-le au Personnel pour que ce trajet roule tout seul (sinon, pousse-le toi-même).'}
            </p>
          </>
        )}

        <div className="boutons boutons-centre">
          <button className="bouton bouton-vendre bouton-valider-trajet" onClick={() => onValider(reglages)} autoFocus>
            ✔ Valider
          </button>
          <button className="bouton bouton-stop" onClick={onFermer}>
            ✖ Annuler
          </button>
        </div>
        {actionsRail && (
          <div className="actions-rail">
            <span className="discret">Ce rail :</span>
            <BoutonsRail onDeplacer={actionsRail.onDeplacer} onRetirer={actionsRail.onRetirer} />
          </div>
        )}
      </div>
    </div>
  )
}
