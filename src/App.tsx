// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Clavier :
//   au village : ← → pour marcher le long du chemin (garder la touche), ↓ pour descendre dans le puits ;
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
import { STANDS, X_PUITS, standProche } from './composants/stands'
import { Toasts } from './composants/Toasts'
import { Victoire } from './composants/Victoire'
import { VueMonde } from './composants/VueMonde'
import { LARGEUR_MINE, PRIX_ASSISTANT } from './jeu/donnees'
import {
  aLaSurface,
  allerA,
  appelerAscenseur,
  arreterSurEchelle,
  ascenseurDisponible,
  ascenseurEnMouvement,
  auFond,
  deplacerMineur,
  dureeAscenseur,
  dureeEchelle,
  embaucherAssistant,
  estCassee,
  peutEmbaucherAssistant,
  piocheEquipee,
  positionFront,
  prendreAscenseur,
  type EtatJeu,
} from './jeu/mineur'
import { SUCCES } from './jeu/succes'
import { useMarcheVillage } from './useMarcheVillage'
import { usePartie } from './usePartie'

type OngletMine = 'sac' | 'pioches'

// Aller au village (0) ou au front de taille : en ascenseur s'il est là, sinon à l'échelle.
function voyagerVers(etat: EtatJeu, destination: number): string[] {
  if (ascenseurDisponible(etat)) return prendreAscenseur(etat, destination)
  return allerA(etat, destination)
}

function App() {
  const { etat, toasts, gains, enMinage, jouer, creuser, arreter, recommencer, passerPrestige } = usePartie()
  const [ongletMine, setOngletMine] = useState<OngletMine>('sac')
  const [versLaGauche, setVersLaGauche] = useState(false)

  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const dansLaCabine = etat.ascenseur.passager

  // La marche dans le village.
  const village = useMarcheVillage(enVille)
  const stand = enVille ? standProche(village.x) : null
  const prochePuits = Math.abs(village.x - X_PUITS) < 1

  // L'écran de victoire s'affiche une seule fois, au moment où l'on atteint la bedrock.
  const [victoireAffichee, setVictoireAffichee] = useState(false)
  const [avaitGagne, setAvaitGagne] = useState(etat.victoire)
  if (avaitGagne !== etat.victoire) {
    setAvaitGagne(etat.victoire)
    if (etat.victoire) setVictoireAffichee(true)
  }

  // --- Les actions des boutons et du clavier -------------------------------

  // Commencer à monter (sens = -1) ou à descendre (sens = +1) l'échelle.
  // On avance jusqu'à ce que la touche (ou le bouton) soit relâchée.
  function commencerEchelle(sens: number) {
    arreter()
    jouer((e) => allerA(e, sens < 0 ? 0 : positionFront(e)))
  }

  function finirEchelle() {
    jouer(arreterSurEchelle)
  }

  // Les boutons « à maintenir » (▲ ▼, et ◀ ▶ au village).
  const boutonAppuye = useRef<'echelle' | 'village' | null>(null)
  function appuiEchelle(sens: number) {
    boutonAppuye.current = 'echelle'
    commencerEchelle(sens)
  }
  function appuiMarche(sens: number) {
    boutonAppuye.current = 'village'
    village.commencer(sens)
  }
  function relacheBouton() {
    if (boutonAppuye.current === 'echelle') finirEchelle()
    if (boutonAppuye.current === 'village') village.arreter()
    boutonAppuye.current = null
  }

  function allerAuVillage() {
    arreter()
    jouer((e) => voyagerVers(e, 0))
  }

  // Depuis le village, on marche d'abord jusqu'au puits, puis on descend.
  function allerAuFront() {
    if (enVille) village.allerVers(X_PUITS, () => jouer((e) => voyagerVers(e, positionFront(e))))
    else jouer((e) => voyagerVers(e, positionFront(e)))
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
      // Une touche gardée appuyée se répète : pour marcher et grimper, seul le premier appui compte.
      const repetition = evenement.repeat

      if (enVille) {
        if (touche === 'ArrowLeft' && !repetition) village.commencer(-1)
        if (touche === 'ArrowRight' && !repetition) village.commencer(+1)
        if (touche === 'ArrowDown' && !repetition) {
          if (prochePuits) commencerEchelle(+1)
          else allerAuFront()
        }
      } else if (auFront) {
        if (touche === 'ArrowLeft') deplacerAuFront(-1)
        if (touche === 'ArrowRight') deplacerAuFront(+1)
        if (touche === 'ArrowUp' && !repetition) commencerEchelle(-1)
        if ((touche === 'ArrowDown' || touche === ' ') && !enMinage) creuser(1)
      } else if (!dansLaCabine) {
        // Sur l'échelle.
        if (touche === 'ArrowUp' && !repetition) commencerEchelle(-1)
        if (touche === 'ArrowDown' && !repetition) commencerEchelle(+1)
      }
    }

    function toucheRelachee(evenement: KeyboardEvent) {
      if (evenement.key === 'ArrowUp' || evenement.key === 'ArrowDown') finirEchelle()
      if (evenement.key === 'ArrowLeft' || evenement.key === 'ArrowRight') village.arreter()
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
      village.placer(X_PUITS)
    }
  }

  function faireLePrestige() {
    passerPrestige()
    setVictoireAffichee(false)
    village.placer(X_PUITS)
  }

  // --- Le panneau de droite : le stand où l'on est, ou le sac dans la mine --

  let panneau
  if (enVille && stand === null) {
    // Entre deux stands : on rappelle comment se promener.
    panneau = (
      <section className="carte panneau">
        <h2>Le village</h2>
        <p className="discret">Promène-toi le long du chemin avec ← → (garde la touche appuyée), ou clique sur un stand pour y aller.</p>
        <div className="liste-cartes">
          {STANDS.map((s, index) => (
            <button key={s.id} className="bouton bouton-petit bouton-aller" onClick={() => village.allerVers(STANDS[index].x)}>
              {s.icone && <IconePixel nom={s.icone} taille={18} />} {s.nom}
            </button>
          ))}
        </div>
      </section>
    )
  } else if (enVille && stand !== null) {
    const cabineAuVillage = etat.ascenseur.niveau > 0 && !ascenseurEnMouvement(etat) && etat.ascenseur.position === 0
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
            {/* Après la bedrock, c'est ici qu'on passe prestige. */}
            {etat.victoire && (
              <div className="ligne-achat carte-prestige">
                <strong>🏆 Bedrock atteinte !</strong>
                <span className="discret">
                  Passe prestige quand tu veux : tu recommences avec +15 % sur les ventes et des pioches 10 % plus rapides (à chaque prestige).
                </span>
                <button className="bouton bouton-principal" onClick={faireLePrestige}>
                  ⭐ Passer prestige {etat.prestige + 1}
                </button>
              </div>
            )}

            <p>
              Ton front de taille est à <strong>-{etat.profondeur} m</strong>.{' '}
              {cabineAuVillage
                ? `L'ascenseur t'attend : descente en ${Math.ceil(dureeAscenseur(etat))} s.`
                : `À l'échelle, il faut ${Math.ceil(dureeEchelle(etat))} s pour y descendre.`}
            </p>
            <div className="boutons">
              <button className="bouton bouton-principal" onClick={allerAuFront}>
                ⏬ Descendre au front {cabineAuVillage ? 'en ascenseur' : "à l'échelle"}
              </button>
              {etat.ascenseur.niveau > 0 && !cabineAuVillage && (
                <button className="bouton" disabled={ascenseurEnMouvement(etat)} onClick={() => jouer(appelerAscenseur)}>
                  🛗 Appeler l'ascenseur
                </button>
              )}
            </div>

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
                    <button className="bouton bouton-petit" disabled={!peutEmbaucherAssistant(etat)} onClick={() => jouer(embaucherAssistant)}>
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
            versLaGauche={versLaGauche}
            xVillage={village.x}
            versLaGaucheVillage={village.versLaGauche}
            enMarcheVillage={village.enMarche}
            onAllerStand={(index) => village.allerVers(STANDS[index].x)}
            gains={gains}
          />

          {/* La barre de boutons : toujours les mêmes 8 boutons, toujours à la même place.
              Ceux qui ne servent pas à l'endroit où l'on est sont simplement grisés. */}
          <div className="actions">
            {/* ◀ ▶ : au village, on marche tant qu'on appuie ; au front, on change de case. */}
            <button
              className="bouton"
              onPointerDown={() => (enVille ? appuiMarche(-1) : deplacerAuFront(-1))}
              onPointerUp={relacheBouton}
              onPointerLeave={relacheBouton}
              disabled={!enVille && (!auFront || etat.colonneMineur === 0)}
              aria-label="Aller à gauche"
            >
              ◀
            </button>
            {/* ▲ ▼ sont « à maintenir » : on grimpe tant qu'on appuie (pratique sur mobile). */}
            <button
              className="bouton"
              onPointerDown={() => appuiEchelle(-1)}
              onPointerUp={relacheBouton}
              onPointerLeave={relacheBouton}
              disabled={enVille || dansLaCabine}
              aria-label="Monter l'échelle (maintenir)"
            >
              ▲
            </button>
            <button
              className="bouton"
              onPointerDown={() => (enVille && !prochePuits ? allerAuFront() : appuiEchelle(+1))}
              onPointerUp={relacheBouton}
              onPointerLeave={relacheBouton}
              disabled={auFront || dansLaCabine}
              aria-label="Descendre l'échelle (maintenir)"
            >
              ▼
            </button>
            <button
              className="bouton"
              onPointerDown={() => (enVille ? appuiMarche(+1) : deplacerAuFront(+1))}
              onPointerUp={relacheBouton}
              onPointerLeave={relacheBouton}
              disabled={!enVille && (!auFront || etat.colonneMineur === LARGEUR_MINE - 1)}
              aria-label="Aller à droite"
            >
              ▶
            </button>

            {/* Le même emplacement sert à creuser ou à arrêter. */}
            {enMinage ? (
              <button className="bouton bouton-stop" onClick={arreter}>
                <span className="emoji-bouton">⏹️ </span>Arrêter
              </button>
            ) : (
              <button className="bouton bouton-principal" onClick={() => creuser(1)} disabled={!auFront}>
                <span className="emoji-bouton">⛏️ </span>Creuser
              </button>
            )}
            <button className="bouton" onClick={() => creuser(10)} disabled={!auFront || enMinage}>
              <span className="emoji-bouton">⛏️ </span>x10
            </button>
            <button className="bouton" onClick={allerAuVillage} disabled={enVille || dansLaCabine}>
              <span className="emoji-bouton">⏫ </span>Village
            </button>
            <button className="bouton" onClick={allerAuFront} disabled={auFront || dansLaCabine}>
              <span className="emoji-bouton">⏬ </span>Front
            </button>
          </div>
          <p className="aide-clavier">
            {enVille
              ? '⌨️ ← → pour marcher (garde la touche appuyée) · ↓ pour descendre dans le puits'
              : auFront
                ? '⌨️ ← → pour te déplacer · ↓ ou Espace pour creuser · ↑ pour remonter · Village et Front prennent l’ascenseur s’il est là'
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

      {victoireAffichee && <Victoire etat={etat} onPrestige={faireLePrestige} onFermer={() => setVictoireAffichee(false)} />}
      <Toasts toasts={toasts} />
    </div>
  )
}

export default App
