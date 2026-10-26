// La fenêtre des trajets de wagonnets (27/10, refaite le 25/10). Elle s'ouvre quand on touche des
// rails qui relient deux bâtiments, ou « Automatiser » / « Régler » dans le panneau d'un bâtiment.
// C'est le poste d'aiguillage :
//   - un onglet par trajet qui passe par ces rails (s'il y en a plusieurs) ;
//   - le dessin du trajet : le départ, les rails où roule le wagonnet, l'arrivée ;
//   - l'interrupteur : automatisation activée ou arrêtée ;
//   - les minerais, en tuiles à toucher : vert = le wagonnet l'emporte, gris = il le laisse ;
//   - l'aperçu du prochain voyage, qui change à chaque toucher.
// Rien ne change tant qu'on n'a pas validé. Aucune règle du jeu ici : on lit l'état et on
// appelle reglerTrajet / apercuTrajet (src/jeu/wagonnet.ts).

import { useState } from 'react'
import { BATIMENTS, BLOCS, LIAISONS, SECONDES_PAR_CHARBON, SECONDES_PAR_REDSTONE, type IdBloc, type IdLiaison } from '../jeu/donnees'
import { charbonMaxForeuse } from '../jeu/foreuse'
import { reserveMaxGenerateur } from '../jeu/generateur'
import { nombre, t } from '../jeu/langue'
import type { EtatJeu, Inventaire } from '../jeu/mineur'
import { apercuTrajet, exclusAffiches, objetFixe, objetsAuChoix, trajetDe, type ReglageTrajet } from '../jeu/wagonnet'
import { nombreAbrege } from '../nombres'
import { Barre } from './Barre'
import { Fenetre } from './Fenetre'
import { BoutonsRail } from './FenetreRail'
import { Interrupteur } from './Interrupteur'
import { IMAGES_BATIMENTS } from './iso'
import { OngletsPanneau } from './OngletsPanneau'
import { AlerteChariot } from './AlerteChariot'
import { analyseWagonnet } from '../jeu/production'

type Props = {
  etat: EtatJeu
  liaisons: IdLiaison[] // les trajets qui passent par les rails touchés
  onValider: (reglages: Partial<Record<IdLiaison, ReglageTrajet>>) => void
  onFermer: () => void
  // (30/10) On a touché un rail : de quoi le déplacer ou le retirer, en bas de la fenêtre.
  actionsRail?: { onDeplacer: () => void; onRetirer: () => void } | null
  // (26/10) Ouvrir le Personnel (pour agrandir le chariot d'un pousseur qui ne suit pas)
  onAllerAuPersonnel?: () => void
}

// Ce qu'il y a au départ du trajet (le coffre de la mine, ou le chariot de la foreuse).
function stockDuDepart(etat: EtatJeu, liaison: IdLiaison): Inventaire {
  return LIAISONS[liaison].depart === 'foreuse' ? etat.foreuse.chariot : etat.coffre.contenu
}

// « 45 s », « 2 min 05 »
function duree(s: number): string {
  return s < 60 ? t('{n} s', { n: Math.round(s) }) : t('{m} min {s}', { m: Math.floor(s / 60), s: String(Math.round(s % 60)).padStart(2, '0') })
}

// Le dessin du trajet : le départ, les rails (le wagonnet y roule quand le trajet est activé), l'arrivée.
function DessinTrajet({ liaison, actif }: { liaison: IdLiaison; actif: boolean }) {
  const info = LIAISONS[liaison]
  return (
    <div className={`trajet-dessin ${actif ? 'trajet-dessin-actif' : ''}`} aria-hidden="true">
      <span className="trajet-batiment">
        <img src={IMAGES_BATIMENTS[info.depart]} alt="" draggable={false} />
        <small>{t(BATIMENTS[info.depart].nom)}</small>
      </span>
      <span className="trajet-rails">
        <span className="trajet-wagonnet">🛒</span>
      </span>
      <span className="trajet-batiment">
        <img src={IMAGES_BATIMENTS[info.arrivee]} alt="" draggable={false} />
        <small>{t(BATIMENTS[info.arrivee].nom)}</small>
      </span>
    </div>
  )
}

// La réserve que le wagonnet remplit (le charbon de la foreuse, la redstone du générateur).
function Reserve({ etat, liaison }: { etat: EtatJeu; liaison: IdLiaison }) {
  const foreuse = liaison === 'mine-foreuse'
  const bloc = foreuse ? 'charbon' : 'redstone'
  const max = foreuse ? charbonMaxForeuse(etat) : Math.round(reserveMaxGenerateur(etat) / SECONDES_PAR_REDSTONE)
  const actuel = Math.min(max, Math.floor(foreuse ? etat.foreuse.carburant / SECONDES_PAR_CHARBON : etat.generateur.carburant / SECONDES_PAR_REDSTONE))
  return (
    <div className="carte trajet-reserve">
      <strong>
        {BLOCS[bloc].emoji} {foreuse ? t('Il apporte le charbon du coffre') : t('Il apporte la redstone du coffre')}
      </strong>
      <Barre valeur={actuel} max={max} texte={`${nombre(actuel)} / ${nombre(max)}`} couleur={foreuse ? 'or' : 'rouge'} />
    </div>
  )
}

export function FenetreTrajet({ etat, liaisons, onValider, onFermer, actionsRail = null, onAllerAuPersonnel }: Props) {
  // Les réglages en cours (pas encore validés), un par trajet. Un trajet pas encore créé est
  // proposé activé : c'est pour ça qu'on a posé les rails.
  const [reglages, setReglages] = useState<Partial<Record<IdLiaison, ReglageTrajet>>>(() =>
    Object.fromEntries(liaisons.map((l) => [l, { actif: true, exclus: exclusAffiches(etat, l) }])),
  )
  const [ouvert, setOuvert] = useState<IdLiaison>(liaisons[0])

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
  }

  return (
    <Fenetre
      titre={nouveau ? t('Automatiser') : t('Trajet')}
      icone="🛤️"
      couleur="bleu"
      devant
      onFermer={onFermer}
      classe="fenetre-wagonnet"
      pied={
        <>
          <button className="btn btn-blanc" onClick={onFermer}>
            {t('Annuler')}
          </button>
          <button className="btn btn-jaune" onClick={() => onValider(reglages)} autoFocus>
            ✔ {t('Valider')}
          </button>
        </>
      }
    >
      {/* Un onglet par trajet qui passe par ces rails (✔ : activé). */}
      {liaisons.length > 1 && (
        <OngletsPanneau
          onglets={liaisons.map((l) => ({ id: l, titre: `${reglages[l]?.actif ? '✔ ' : ''}${LIAISONS[l].emoji} ${t(BATIMENTS[LIAISONS[l].arrivee].nom)}` }))}
          actif={ouvert}
          onChoisir={setOuvert}
        />
      )}

      <DessinTrajet liaison={liaison} actif={reglage.actif} />
      <p className="trajet-description">{t('Un wagonnet {action}.', { action: t(info.description) })}</p>
      {/* (26/10) Son chariot ne suit pas la production : l'alerte en haut, et un bouton vers le Personnel */}
      <AlerteChariot analyse={analyseWagonnet(etat, liaison)} batiment={info.depart === 'foreuse' ? t('la foreuse') : t('la mine')} onAllerAuPersonnel={onAllerAuPersonnel} />

      <Interrupteur allume={reglage.actif} texte={reglage.actif ? t('Automatisation activée') : t('Automatisation arrêtée')} onBasculer={() => changer(liaison, { actif: !reglage.actif })} />

      {reglage.actif && (
        <>
          {choix.length > 0 && (
            <section className="trajet-objets">
              <div className="rangee trajet-objets-titre">
                <h3 className="titre-section">{t('Ce qu’il vend')}</h3>
                <button className="btn btn-blanc btn-petit" onClick={() => changer(liaison, { exclus: [] })}>
                  {t('Tout')}
                </button>
                <button className="btn btn-blanc btn-petit" onClick={() => changer(liaison, { exclus: [...choix] })}>
                  {t('Rien')}
                </button>
              </div>
              <div className="objet-tuiles">
                {choix.map((bloc) => {
                  const envoye = !reglage.exclus.includes(bloc)
                  return (
                    <button key={bloc} className={`objet-tuile ${envoye ? 'objet-envoye' : ''}`} aria-pressed={envoye} onClick={() => basculer(bloc)}>
                      <span className="objet-coche" aria-hidden="true">
                        {envoye ? '✔' : '✖'}
                      </span>
                      <span className="objet-icone" aria-hidden="true">
                        {BLOCS[bloc].emoji}
                      </span>
                      <span className="objet-nom">{t(BLOCS[bloc].nom)}</span>
                      <span className="objet-infos">×{nombreAbrege(stock[bloc] ?? 0)}</span>
                    </button>
                  )
                })}
              </div>
              <p className="discret">{t('Vert : il l’emporte et le vend. Gris : il reste dans le coffre.')}</p>
            </section>
          )}
          {fixe && <Reserve etat={etat} liaison={liaison} />}

          {/* L'aperçu du prochain voyage : il change à chaque toucher. */}
          <section className="carte carte-creme trajet-apercu">
            <span className="titre-section">{t('Prochain voyage')}</span>
            <span className="trajet-apercu-objets">
              {apercu.objets.length === 0 ? (
                <span className="discret">{t('Rien à emporter pour l’instant')}</span>
              ) : (
                apercu.objets.map(([bloc, n]) => (
                  <span key={bloc} className="etiquette">
                    {BLOCS[bloc].emoji} {nombre(n)}
                  </span>
                ))
              )}
            </span>
            <span className="trajet-apercu-chiffres">
              {versLeMarche && <strong className="texte-ok">+{nombre(apercu.valeur)} $</strong>}
              <span>⏱️ {t('{duree} l’aller-retour', { duree: duree(apercu.secondes) })}</span>
              {versLeMarche && apercu.parMinute > 0 && <span>≈ {t('{n} $/min', { n: nombre(Math.round(apercu.parMinute)) })}</span>}
            </span>
          </section>

          {/* Qui le fait rouler (un pousseur par trajet automatique). */}
          {apercu.moteur !== 'toi' ? (
            <p className="texte-ok">👷 {t('{nom} le pousse.', { nom: pousseur?.nom ?? '' })}</p>
          ) : (
            <p className="texte-alerte">👷 {t('Pas de pousseur : embauche-en un au Personnel (sinon, pousse-le toi-même).')}</p>
          )}
        </>
      )}

      {actionsRail && (
        <div className="trajet-actions-rail">
          <span className="discret">{t('Ce rail :')}</span>
          <BoutonsRail onDeplacer={actionsRail.onDeplacer} onRetirer={actionsRail.onRetirer} />
        </div>
      )}
    </Fenetre>
  )
}
