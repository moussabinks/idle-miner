// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Clavier :
//   à la surface : ← → pour aller d'un stand à l'autre, ↓ (ou Espace) au puits pour descendre ;
//   dans la mine : ← → pour se déplacer, ↓ (ou Espace) pour creuser, ↑ pour remonter à l'échelle.

import { useEffect, useState } from 'react'
import { Hud } from './composants/Hud'
import { Inventaire } from './composants/Inventaire'
import {
  PanneauAtelier,
  PanneauBazar,
  PanneauEnchanter,
  PanneauMarche,
  PanneauPioches,
  PanneauSucces,
} from './composants/Panneaux'
import { Toasts } from './composants/Toasts'
import { Victoire } from './composants/Victoire'
import { VueEchelle } from './composants/VueEchelle'
import { VueMine } from './composants/VueMine'
import { POSITION_PUITS, STANDS } from './composants/stands'
import { VueSurface } from './composants/VueSurface'
import { LARGEUR_MINE } from './jeu/donnees'
import {
  aLaSurface,
  ascenseurDisponible,
  auFond,
  deplacerMineur,
  descendreDansLaMine,
  dureeEchelle,
  envoyerAscenseur,
  monterALaSurface,
  objetsAVendre,
} from './jeu/mineur'
import { SUCCES } from './jeu/succes'
import { usePartie } from './usePartie'

type OngletMine = 'sac' | 'pioches'

const DUREE_PAS = 250 // ms : durée de l'animation de marche à la surface

function App() {
  const { etat, toasts, gains, enMinage, jouer, creuser, arreter, recommencer, passerPrestige } = usePartie()
  const [ongletMine, setOngletMine] = useState<OngletMine>('sac')
  const [victoireFermee, setVictoireFermee] = useState(false)
  const [positionSurface, setPositionSurface] = useState(POSITION_PUITS)
  const [versLaGauche, setVersLaGauche] = useState(false)
  const [enMarche, setEnMarche] = useState(false)

  const enVille = aLaSurface(etat)
  const enBas = auFond(etat)
  const stand = STANDS[positionSurface]

  // En sortant du puits, on arrive... devant le puits.
  const [dernierLieu, setDernierLieu] = useState(etat.lieu)
  if (dernierLieu !== etat.lieu) {
    setDernierLieu(etat.lieu)
    if (etat.lieu === 'surface') setPositionSurface(POSITION_PUITS)
  }

  // --- Les actions des boutons et du clavier -------------------------------

  function marcherVers(position: number) {
    const cible = Math.min(STANDS.length - 1, Math.max(0, position))
    if (cible === positionSurface) return
    setVersLaGauche(cible < positionSurface)
    setPositionSurface(cible)
    setEnMarche(true)
    setTimeout(() => setEnMarche(false), DUREE_PAS)
  }

  function descendre() {
    setPositionSurface(POSITION_PUITS)
    jouer(descendreDansLaMine)
  }

  function remonter() {
    arreter()
    jouer(monterALaSurface)
  }

  function deplacerDansLaMine(sens: number) {
    setVersLaGauche(sens < 0)
    jouer((e) => deplacerMineur(e, sens))
  }

  // Le clavier. On relit tout à chaque rendu : c'est simple et largement assez rapide.
  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.target instanceof HTMLInputElement) return
      const touche = evenement.key
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(touche)) return
      evenement.preventDefault()

      if (enVille) {
        if (touche === 'ArrowLeft') marcherVers(positionSurface - 1)
        if (touche === 'ArrowRight') marcherVers(positionSurface + 1)
        if ((touche === 'ArrowDown' || touche === ' ') && positionSurface === POSITION_PUITS) descendre()
      } else if (enBas && !etat.victoire) {
        if (touche === 'ArrowLeft') deplacerDansLaMine(-1)
        if (touche === 'ArrowRight') deplacerDansLaMine(+1)
        if (touche === 'ArrowUp') remonter()
        if ((touche === 'ArrowDown' || touche === ' ') && !enMinage) creuser(1)
      }
    }
    window.addEventListener('keydown', auClavier)
    return () => window.removeEventListener('keydown', auClavier)
  })

  function demanderRecommencer() {
    if (window.confirm('Effacer ta partie et tout recommencer (succès compris) ?')) {
      recommencer()
      setVictoireFermee(false)
      setPositionSurface(POSITION_PUITS)
    }
  }

  function faireLePrestige() {
    passerPrestige()
    setVictoireFermee(false)
  }

  const chargementPossible = Object.keys(objetsAVendre(etat)).length > 0

  // --- La vue de gauche : surface, échelle ou mine ------------------------

  let vue
  if (etat.trajet !== null) vue = <VueEchelle etat={etat} />
  else if (enVille)
    vue = <VueSurface etat={etat} position={positionSurface} versLaGauche={versLaGauche} enMarche={enMarche} onAller={marcherVers} />
  else vue = <VueMine etat={etat} enMinage={enMinage} versLaGauche={versLaGauche} gains={gains} />

  // --- Le panneau de droite : le stand où l'on est, ou le sac dans la mine --

  let panneau
  if (enVille) {
    panneau = (
      <section className="carte panneau">
        <h2>
          {stand.emoji} {stand.nom}
        </h2>
        <p className="discret">{stand.description}</p>
        {stand.id === 'marche' && <PanneauMarche etat={etat} jouer={jouer} />}
        {stand.id === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {stand.id === 'bazar' && <PanneauBazar etat={etat} jouer={jouer} />}
        {stand.id === 'enchanteur' && <PanneauEnchanter etat={etat} jouer={jouer} />}
        {stand.id === 'atelier' && <PanneauAtelier etat={etat} jouer={jouer} />}
        {stand.id === 'puits' && (
          <div className="liste-cartes">
            <p>
              Ton front de taille est à <strong>-{etat.profondeur} m</strong>. Descendre prend {Math.ceil(dureeEchelle(etat))} s.
            </p>
            <button className="bouton bouton-principal" onClick={descendre} disabled={etat.victoire}>
              🪜 Descendre dans la mine
            </button>
          </div>
        )}
      </section>
    )
  } else {
    panneau = (
      <section className="carte panneau">
        <nav className="onglets" role="tablist">
          <button role="tab" aria-selected={ongletMine === 'sac'} className={`onglet ${ongletMine === 'sac' ? 'actif' : ''}`} onClick={() => setOngletMine('sac')}>
            🎒 Sac
          </button>
          <button
            role="tab"
            aria-selected={ongletMine === 'pioches'}
            className={`onglet ${ongletMine === 'pioches' ? 'actif' : ''}`}
            onClick={() => setOngletMine('pioches')}
          >
            🧰 Pioches
          </button>
        </nav>
        <div className="panneau-contenu" role="tabpanel">
          {ongletMine === 'sac' && <Inventaire etat={etat} jouer={jouer} />}
          {ongletMine === 'pioches' && <PanneauPioches etat={etat} jouer={jouer} />}
        </div>
      </section>
    )
  }

  return (
    <div className="jeu">
      <h1 className="titre">⛏️ Idle Miner</h1>
      <Hud etat={etat} />

      <main className="plateau">
        <div className="colonne-mine">
          {vue}

          <div className="actions">
            {etat.victoire ? (
              <button className="bouton bouton-principal" onClick={faireLePrestige}>
                ⭐ Passer prestige {etat.prestige + 1}
              </button>
            ) : enVille ? (
              <>
                <button className="bouton" onClick={() => marcherVers(positionSurface - 1)} aria-label="Aller à gauche">
                  ◀
                </button>
                <button className="bouton" onClick={() => marcherVers(positionSurface + 1)} aria-label="Aller à droite">
                  ▶
                </button>
                <button className="bouton bouton-principal" onClick={descendre}>
                  🪜 Descendre
                </button>
              </>
            ) : enBas ? (
              <>
                <button className="bouton" onClick={() => deplacerDansLaMine(-1)} disabled={etat.colonneMineur === 0} aria-label="Aller à gauche">
                  ◀
                </button>
                <button
                  className="bouton"
                  onClick={() => deplacerDansLaMine(+1)}
                  disabled={etat.colonneMineur === LARGEUR_MINE - 1}
                  aria-label="Aller à droite"
                >
                  ▶
                </button>
                {enMinage ? (
                  <button className="bouton bouton-stop" onClick={arreter}>
                    ⏹️ Arrêter
                  </button>
                ) : (
                  <>
                    <button className="bouton bouton-principal" onClick={() => creuser(1)}>
                      ⛏️ Creuser
                    </button>
                    <button className="bouton" onClick={() => creuser(10)}>
                      ⛏️ x10
                    </button>
                  </>
                )}
                <button className="bouton" onClick={remonter}>
                  🪜 Remonter
                </button>
                {etat.ascenseur.possede && (
                  <button
                    className="bouton bouton-vendre"
                    disabled={!ascenseurDisponible(etat) || !chargementPossible}
                    onClick={() => jouer(envoyerAscenseur)}
                  >
                    🛗 Envoyer
                  </button>
                )}
              </>
            ) : (
              <button className="bouton" disabled>
                🪜 Sur l'échelle…
              </button>
            )}
          </div>
          <p className="aide-clavier">
            {enVille
              ? '⌨️ ← → pour te déplacer · ↓ au puits pour descendre'
              : '⌨️ ← → pour te déplacer · ↓ ou Espace pour creuser · ↑ pour remonter'}
          </p>
        </div>

        <div className="colonne-panneaux">
          {panneau}
          <details className="carte succes-repliable">
            <summary>
              🏅 Succès {etat.succes.length}/{SUCCES.length}
            </summary>
            <PanneauSucces etat={etat} />
          </details>
        </div>
      </main>

      <footer className="pied">
        <span>Partie sauvegardée automatiquement dans ce navigateur.</span>
        <button className="lien" onClick={demanderRecommencer}>
          Recommencer à zéro
        </button>
      </footer>

      {etat.victoire && !victoireFermee && (
        <Victoire etat={etat} onPrestige={faireLePrestige} onFermer={() => setVictoireFermee(true)} />
      )}
      <Toasts toasts={toasts} />
    </div>
  )
}

export default App
