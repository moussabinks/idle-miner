// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Clavier :
//   au village : ← → pour aller d'un stand à l'autre, ↓ pour descendre dans le puits ;
//   sur l'échelle : ↑ pour monter, ↓ pour descendre (on avance tant que la touche est appuyée) ;
//   au front de taille : ← → pour se déplacer, ↓ ou Espace pour creuser, ↑ pour remonter.

import { useEffect, useRef, useState } from 'react'
import { Hud } from './composants/Hud'
import { IconePixel } from './composants/IconePixel'
import { Inventaire } from './composants/Inventaire'
import {
  PanneauBazar,
  PanneauEnchanter,
  PanneauForeuse,
  PanneauMarche,
  PanneauPioches,
  PanneauSucces,
} from './composants/Panneaux'
import { PersonnageMacron } from './composants/PersonnageMacron'
import { POSITION_PUITS, STANDS } from './composants/stands'
import { Toasts } from './composants/Toasts'
import { Victoire } from './composants/Victoire'
import { VueMonde } from './composants/VueMonde'
import { LARGEUR_MINE, PRIX_ASSISTANT } from './jeu/donnees'
import {
  aLaSurface,
  allerA,
  arreterSurEchelle,
  auFond,
  deplacerMineur,
  dureeEchelle,
  embaucherAssistant,
  estCassee,
  peutEmbaucherAssistant,
  piocheEquipee,
  positionFront,
} from './jeu/mineur'
import { SUCCES } from './jeu/succes'
import { usePartie } from './usePartie'

type OngletMine = 'sac' | 'pioches'

const DUREE_PAS = 250 // ms : durée de l'animation de marche au village

function App() {
  const { etat, toasts, gains, enMinage, jouer, creuser, arreter, recommencer, passerPrestige } = usePartie()
  const [ongletMine, setOngletMine] = useState<OngletMine>('sac')
  const [victoireFermee, setVictoireFermee] = useState(false)
  const [positionSurface, setPositionSurface] = useState(POSITION_PUITS)
  const [versLaGauche, setVersLaGauche] = useState(false)
  const [enMarche, setEnMarche] = useState(false)

  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const stand = STANDS[positionSurface]

  // En sortant du puits, on arrive... devant le puits.
  const [etaitAuVillage, setEtaitAuVillage] = useState(enVille)
  if (etaitAuVillage !== enVille) {
    setEtaitAuVillage(enVille)
    if (enVille) setPositionSurface(POSITION_PUITS)
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

  // Commencer à monter (sens = -1) ou à descendre (sens = +1) l'échelle.
  // On avance jusqu'à ce que la touche (ou le bouton) soit relâchée.
  function commencerEchelle(sens: number) {
    arreter()
    if (enVille) setPositionSurface(POSITION_PUITS) // on entre dans le puits
    jouer((e) => allerA(e, sens < 0 ? 0 : positionFront(e)))
  }

  function finirEchelle() {
    jouer(arreterSurEchelle)
  }

  // Les boutons ▲ ▼ : on grimpe tant que le bouton est appuyé.
  const boutonEchelleAppuye = useRef(false)
  function appuiBoutonEchelle(sens: number) {
    boutonEchelleAppuye.current = true
    commencerEchelle(sens)
  }
  function relacheBoutonEchelle() {
    if (!boutonEchelleAppuye.current) return
    boutonEchelleAppuye.current = false
    finirEchelle()
  }

  function allerAuVillage() {
    arreter()
    jouer((e) => allerA(e, 0))
  }

  function allerAuFront() {
    setPositionSurface(POSITION_PUITS)
    jouer((e) => allerA(e, positionFront(e)))
  }

  function deplacerAuFront(sens: number) {
    setVersLaGauche(sens < 0)
    jouer((e) => deplacerMineur(e, sens))
  }

  // Le clavier. On le rebranche à chaque rendu : c'est simple et largement assez rapide.
  useEffect(() => {
    function toucheAppuyee(evenement: KeyboardEvent) {
      if (evenement.target instanceof HTMLInputElement) return
      const touche = evenement.key
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(touche)) return
      evenement.preventDefault()
      // Une touche gardée appuyée se répète : pour l'échelle, seul le premier appui compte.
      const repetition = evenement.repeat

      if (enVille) {
        if (touche === 'ArrowLeft') marcherVers(positionSurface - 1)
        if (touche === 'ArrowRight') marcherVers(positionSurface + 1)
        if (touche === 'ArrowDown' && !repetition && !etat.victoire) commencerEchelle(+1)
      } else if (auFront && !etat.victoire) {
        if (touche === 'ArrowLeft') deplacerAuFront(-1)
        if (touche === 'ArrowRight') deplacerAuFront(+1)
        if (touche === 'ArrowUp' && !repetition) commencerEchelle(-1)
        if ((touche === 'ArrowDown' || touche === ' ') && !enMinage) creuser(1)
      } else {
        // Sur l'échelle.
        if (touche === 'ArrowUp' && !repetition) commencerEchelle(-1)
        if (touche === 'ArrowDown' && !repetition) commencerEchelle(+1)
      }
    }

    function toucheRelachee(evenement: KeyboardEvent) {
      if (evenement.key === 'ArrowUp' || evenement.key === 'ArrowDown') finirEchelle()
    }

    window.addEventListener('keydown', toucheAppuyee)
    window.addEventListener('keyup', toucheRelachee)
    return () => {
      window.removeEventListener('keydown', toucheAppuyee)
      window.removeEventListener('keyup', toucheRelachee)
    }
  })

  function demanderRecommencer() {
    if (window.confirm('Effacer ta partie et tout recommencer (succès et foreuse compris) ?')) {
      recommencer()
      setVictoireFermee(false)
      setPositionSurface(POSITION_PUITS)
    }
  }

  function faireLePrestige() {
    passerPrestige()
    setVictoireFermee(false)
    setPositionSurface(POSITION_PUITS)
  }

  // --- Le panneau de droite : le stand où l'on est, ou le sac dans la mine --

  let panneau
  if (enVille) {
    panneau = (
      <section className="carte panneau">
        <h2 className="titre-stand">
          {stand.icone && <IconePixel nom={stand.icone} taille={28} />}
          {stand.nom}
        </h2>
        <p className="discret">{stand.description}</p>
        {stand.id === 'marche' && <PanneauMarche etat={etat} jouer={jouer} />}
        {stand.id === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {stand.id === 'bazar' && <PanneauBazar etat={etat} jouer={jouer} />}
        {stand.id === 'enchanteur' && <PanneauEnchanter etat={etat} jouer={jouer} />}
        {stand.id === 'foreuse' && <PanneauForeuse etat={etat} jouer={jouer} />}
        {stand.id === 'puits' && (
          <div className="liste-cartes">
            <p>
              Ton front de taille est à <strong>-{etat.profondeur} m</strong>. Il faut {Math.ceil(dureeEchelle(etat))} s pour y descendre à
              l'échelle.
            </p>
            <button className="bouton bouton-principal" onClick={allerAuFront} disabled={etat.victoire}>
              ⏬ Descendre au front de taille
            </button>

            {/* L'assistant : on l'embauche ici, il descend avec nous. */}
            <div className="ligne-achat carte-assistant">
              <div className="portrait-assistant">
                <PersonnageMacron couleurPioche={estCassee(etat) ? null : piocheEquipee(etat).couleur} action="repos" />
              </div>
              <div className="liste-cartes">
                <strong>Emmanuel Macron, assistant mineur</strong>
                <span className="discret">
                  Quand tu creuses, il creuse en même temps un autre bloc de la couche, avec la même pioche que toi (sans l'user).
                  Tout ce qu'il casse va dans ton sac. Il repart au prochain prestige.
                </span>
                {etat.assistant.embauche ? (
                  <span className="ok">Embauché : il t'attend au front de taille.</span>
                ) : (
                  <div className="boutons">
                    <button
                      className="bouton bouton-petit"
                      disabled={!peutEmbaucherAssistant(etat)}
                      onClick={() => jouer(embaucherAssistant)}
                    >
                      Embaucher · {PRIX_ASSISTANT.toLocaleString('fr-FR')} $
                    </button>
                  </div>
                )}
              </div>
            </div>
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
          {ongletMine === 'sac' && <Inventaire etat={etat} />}
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
          <VueMonde
            etat={etat}
            jouer={jouer}
            enMinage={enMinage}
            enMarche={enMarche}
            versLaGauche={versLaGauche}
            positionSurface={positionSurface}
            onAllerStand={marcherVers}
            gains={gains}
          />

          {/* La barre de boutons : toujours les mêmes 8 boutons, toujours à la même place.
              Ceux qui ne servent pas à l'endroit où l'on est sont simplement grisés. */}
          <div className="actions">
            <button
              className="bouton"
              onClick={() => (enVille ? marcherVers(positionSurface - 1) : deplacerAuFront(-1))}
              disabled={enVille ? positionSurface === 0 : !auFront || etat.victoire || etat.colonneMineur === 0}
              aria-label="Aller à gauche"
            >
              ◀
            </button>
            {/* ▲ ▼ sont « à maintenir » : on grimpe tant qu'on appuie (pratique sur mobile). */}
            <button
              className="bouton"
              onPointerDown={() => appuiBoutonEchelle(-1)}
              onPointerUp={relacheBoutonEchelle}
              onPointerLeave={relacheBoutonEchelle}
              disabled={enVille}
              aria-label="Monter l'échelle (maintenir)"
            >
              ▲
            </button>
            <button
              className="bouton"
              onPointerDown={() => appuiBoutonEchelle(+1)}
              onPointerUp={relacheBoutonEchelle}
              onPointerLeave={relacheBoutonEchelle}
              disabled={auFront || etat.victoire}
              aria-label="Descendre l'échelle (maintenir)"
            >
              ▼
            </button>
            <button
              className="bouton"
              onClick={() => (enVille ? marcherVers(positionSurface + 1) : deplacerAuFront(+1))}
              disabled={enVille ? positionSurface === STANDS.length - 1 : !auFront || etat.victoire || etat.colonneMineur === LARGEUR_MINE - 1}
              aria-label="Aller à droite"
            >
              ▶
            </button>

            {/* Le même emplacement sert à creuser, à arrêter, ou à passer prestige. */}
            {etat.victoire ? (
              <button className="bouton bouton-principal" onClick={faireLePrestige}>
                <span className="emoji-bouton">⭐ </span>Prestige
              </button>
            ) : enMinage ? (
              <button className="bouton bouton-stop" onClick={arreter}>
                <span className="emoji-bouton">⏹️ </span>Arrêter
              </button>
            ) : (
              <button className="bouton bouton-principal" onClick={() => creuser(1)} disabled={!auFront}>
                <span className="emoji-bouton">⛏️ </span>Creuser
              </button>
            )}
            <button className="bouton" onClick={() => creuser(10)} disabled={!auFront || enMinage || etat.victoire}>
              <span className="emoji-bouton">⛏️ </span>x10
            </button>
            <button className="bouton" onClick={allerAuVillage} disabled={enVille}>
              <span className="emoji-bouton">⏫ </span>Village
            </button>
            <button className="bouton" onClick={allerAuFront} disabled={auFront || etat.victoire}>
              <span className="emoji-bouton">⏬ </span>Front
            </button>
          </div>
          <p className="aide-clavier">
            {enVille
              ? '⌨️ ← → pour aller d’un stand à l’autre · ↓ pour descendre dans le puits'
              : auFront
                ? '⌨️ ← → pour te déplacer · ↓ ou Espace pour creuser · ↑ pour remonter l’échelle'
                : '⌨️ ↑ ↓ pour monter ou descendre l’échelle (garde la touche appuyée)'}
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
