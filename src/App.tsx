// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Clavier :
//   au village : ← → pour marcher le long du chemin (garder la touche), ↓ pour descendre dans la mine ;
//   sur l'échelle : ↑ pour monter, ↓ pour descendre (on avance tant que la touche est appuyée) ;
//   au front de taille : ← → pour se déplacer, ↑ pour remonter (on creuse seulement avec les boutons).
// Sur l'écran, il n'y a pas de flèches : les boutons Village et Mine font les trajets.

import { useEffect, useState } from 'react'
import { reglerLieu } from './ambiance'
import { Accueil } from './composants/Accueil'
import { ArbrePrestige } from './composants/ArbrePrestige'
import { CartePrestige } from './composants/CartePrestige'
import { FetePrestige } from './composants/FetePrestige'
import { Hud } from './composants/Hud'
import { FenetreStatistiques } from './composants/Statistiques'
import { Icone } from './composants/Icone'
import { Inventaire } from './composants/Inventaire'
import { AmeliorationAscenseur } from './composants/Ascenseur'
import { PanneauEmployes } from './composants/PanneauEmployes'
import {
  PanneauBazar,
  PanneauEnchanter,
  PanneauForeuse,
  PanneauMarche,
  PanneauPioches,
  PanneauSucces,
} from './composants/Panneaux'
import { STANDS, X_PUITS, standProche } from './composants/stands'
import { Toasts } from './composants/Toasts'
import { Victoire } from './composants/Victoire'
import { VueMonde } from './composants/VueMonde'
import {
  aLaSurface,
  appelerAscenseur,
  arreterSurEchelle,
  ascenseurEnMouvement,
  auFond,
  deplacerMineur,
  dureeAscenseur,
  dureeEchelle,
  estCassee,
  positionFront,
  voyager,
} from './jeu/mineur'
import { peutPasserPrestige } from './jeu/conditionsPrestige'
import { DECOUVERTES, decouvertesAMontrer, marquerDecouvert } from './jeu/decouvertes'
import { profondeurBedrock } from './jeu/donnees'
import type { InfoMonde } from './jeu/sauvegarde'
import { SUCCES } from './jeu/succes'
import { pointsDisponibles } from './jeu/talents'
import { useCompte } from './useCompte'
import { useMarcheVillage } from './useMarcheVillage'
import { usePartie } from './usePartie'

type OngletMine = 'sac' | 'pioches'

// Le jeu, dans le monde (la sauvegarde) choisi sur l'écran d'accueil.
function Jeu({ monde, onQuitter }: { monde: InfoMonde; onQuitter: () => void }) {
  const { etat, toasts, gains, eclats, trouvailles, nbVentes, enMinage, enAuto, jouer, creuser, creuserAuto, arreter, recommencer, passerPrestige } =
    usePartie(monde.id)
  const [arbreOuvert, setArbreOuvert] = useState(false)
  const [feteOuverte, setFeteOuverte] = useState(false)
  const [succesOuverts, setSuccesOuverts] = useState(false)
  const [statsOuvertes, setStatsOuvertes] = useState(false)
  const [ongletMine, setOngletMine] = useState<OngletMine>('sac')
  const [versLaGauche, setVersLaGauche] = useState(false)

  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const dansLaCabine = etat.ascenseur.passager

  // La musique d'ambiance suit le joueur : oiseaux et vent au village, grotte dans la mine.
  // Où on est entre la surface et la bedrock (la grotte s'entend de plus en plus en descendant).
  const auFondDeLaMine = Math.round((etat.position / profondeurBedrock(etat.prestige)) * 50) / 50
  useEffect(() => reglerLieu(enVille, auFondDeLaMine), [enVille, auFondDeLaMine])

  // La marche dans le village.
  const village = useMarcheVillage(enVille)
  const stand = enVille ? standProche(village.x) : null
  const prochePuits = Math.abs(village.x - X_PUITS) < 1

  // Arrivé devant un stand tout juste débloqué (foreuse, Personnel, recruteur, manager) : la
  // flèche du village disparaît.
  const aDecouvrirIci = stand ? decouvertesAMontrer(etat).filter((id) => DECOUVERTES[id].stand === stand.id) : []
  const cleDecouvertes = aDecouvrirIci.join(',')
  useEffect(() => {
    if (cleDecouvertes) jouer((e) => marquerDecouvert(e, decouvertesAMontrer(e).filter((id) => cleDecouvertes.split(',').includes(id))))
  }, [cleDecouvertes, jouer])

  // L'écran de victoire s'affiche une seule fois, au moment où l'on atteint la bedrock.
  const [victoireAffichee, setVictoireAffichee] = useState(false)
  const [avaitGagne, setAvaitGagne] = useState(etat.victoire)
  if (avaitGagne !== etat.victoire) {
    setAvaitGagne(etat.victoire)
    if (etat.victoire) setVictoireAffichee(true)
  }

  // --- Les actions des boutons et du clavier -------------------------------

  // Commencer à monter (sens = -1) ou à descendre (sens = +1) l'échelle, au clavier.
  // On avance jusqu'à ce que la touche soit relâchée. Depuis le front de taille, le
  // mineur marche d'abord jusqu'à l'échelle.
  function commencerEchelle(sens: number) {
    arreter()
    jouer((e) => voyager(e, sens < 0 ? 0 : positionFront(e), true))
  }

  function finirEchelle() {
    jouer(arreterSurEchelle)
  }

  // Remonter au village : le mineur marche jusqu'au puits, puis prend l'ascenseur
  // s'il est là, sinon l'échelle.
  function allerAuVillage() {
    arreter()
    jouer((e) => voyager(e, 0))
  }

  // Descendre dans la mine : depuis le village, on marche d'abord jusqu'à l'entrée.
  function allerALaMine() {
    if (enVille) village.allerVers(X_PUITS, () => jouer((e) => voyager(e, positionFront(e))))
    else jouer((e) => voyager(e, positionFront(e)))
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
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(touche)) return
      evenement.preventDefault()
      // Une touche gardée appuyée se répète : pour marcher et grimper, seul le premier appui compte.
      const repetition = evenement.repeat

      if (enVille) {
        if (touche === 'ArrowLeft' && !repetition) village.commencer(-1)
        if (touche === 'ArrowRight' && !repetition) village.commencer(+1)
        if (touche === 'ArrowDown' && !repetition) {
          if (prochePuits) commencerEchelle(+1)
          else allerALaMine()
        }
      } else if (auFront) {
        if (touche === 'ArrowLeft') deplacerAuFront(-1)
        if (touche === 'ArrowRight') deplacerAuFront(+1)
        if (touche === 'ArrowUp' && !repetition) commencerEchelle(-1)
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
    if (window.confirm(`Effacer la partie du monde « ${monde.nom} » et tout recommencer (succès et foreuse compris) ?`)) {
      recommencer()
      village.placer(X_PUITS)
    }
  }

  // Après le prestige, on choisit tout de suite sa récompense dans l'arbre.
  // (Seulement quand tout est au maximum : voir conditionsPrestige.ts.)
  function faireLePrestige() {
    if (!peutPasserPrestige(etat)) return
    passerPrestige()
    setVictoireAffichee(false)
    village.placer(X_PUITS)
    // D'abord la fête (confettis !), puis l'arbre de prestige quand on clique sur « Choisir mon talent ».
    setFeteOuverte(true)
  }

  // --- Le panneau de droite : le stand où l'on est, ou le sac dans la mine --

  let panneau
  if (enVille && stand === null) {
    // Entre deux stands : on rappelle comment se promener.
    panneau = (
      <section className="carte panneau">
        <h2>Le village</h2>
        <p className="discret">Promène-toi le long du chemin avec ← →, ou clique sur un stand pour y aller.</p>
      </section>
    )
  } else if (enVille && stand !== null) {
    const cabineAuVillage = etat.ascenseur.niveau > 0 && !ascenseurEnMouvement(etat) && etat.ascenseur.position === 0
    panneau = (
      <section className="carte panneau">
        <h2 className="titre-stand">
          {stand.icone && <Icone nom={stand.icone} taille={28} />}
          {stand.nom}
        </h2>
        <p className="discret">{stand.description}</p>
        {stand.id === 'marche' && <PanneauMarche etat={etat} jouer={jouer} />}
        {stand.id === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {stand.id === 'bazar' && <PanneauBazar etat={etat} jouer={jouer} />}
        {stand.id === 'enchanteur' && <PanneauEnchanter etat={etat} jouer={jouer} />}
        {stand.id === 'foreuse' && <PanneauForeuse etat={etat} jouer={jouer} />}
        {stand.id === 'employes' && <PanneauEmployes etat={etat} jouer={jouer} />}
        {stand.id === 'puits' && (
          <div className="liste-cartes">
            {/* C'est ici qu'on passe prestige : la liste de ce qu'il reste à faire, avec sa jauge. */}
            <CartePrestige etat={etat} onPrestige={faireLePrestige} />

            {etat.prestige > 0 && (
              <div className="ligne-achat">
                <strong className="titre-avec-icone">
                  <Icone nom="etoile" taille={20} /> Arbre de prestige
                </strong>
                <span className="discret">
                  {pointsDisponibles(etat) > 0
                    ? `Tu as ${pointsDisponibles(etat)} point(s) à dépenser !`
                    : `${etat.talents.length} talent(s) débloqué(s). Le prochain prestige te donnera 1 point de plus.`}
                </span>
                <div className="boutons">
                  <button className="bouton bouton-petit bouton-prestige" onClick={() => setArbreOuvert(true)}>
                    Ouvrir l'arbre
                  </button>
                </div>
              </div>
            )}

            <p>
              Ta mine descend à <strong>-{etat.profondeur} m</strong>.{' '}
              {cabineAuVillage
                ? `L'ascenseur t'attend : descente en ${Math.ceil(dureeAscenseur(etat))} s.`
                : `À l'échelle, il faut ${Math.ceil(dureeEchelle(etat))} s pour y descendre.`}
            </p>
            <div className="boutons">
              <button className="bouton bouton-voyage" onClick={allerALaMine}>
                ⏬ Descendre dans la mine {cabineAuVillage ? 'en ascenseur' : "à l'échelle"}
              </button>
              {etat.ascenseur.niveau > 0 && !cabineAuVillage && (
                <button className="bouton bouton-ascenseur" disabled={ascenseurEnMouvement(etat)} onClick={() => jouer(appelerAscenseur)}>
                  🛗 Appeler l'ascenseur
                </button>
              )}
            </div>

            {/* L'ascenseur se construit et s'améliore aussi d'ici, sans descendre. */}
            <div className="ligne-achat">
              <strong>🛗 Ascenseur</strong>
              <AmeliorationAscenseur etat={etat} jouer={jouer} />
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
          {ongletMine === 'sac' && <Inventaire etat={etat} jouer={jouer} onRemonter={arreter} />}
          {ongletMine === 'pioches' && <PanneauPioches etat={etat} jouer={jouer} />}
        </div>
      </section>
    )
  }

  return (
    <div className={`jeu ${etat.employes.length > 0 ? 'avec-mineurs' : ''}`}>
      <header className="entete">
        <h1 className="titre">⛏️ Idle Miner</h1>
        {/* Le monde en cours : on clique pour revenir à l'écran d'accueil (la partie est sauvegardée). */}
        {/* Petit lien discret (avec confirmation) : il efface la partie de ce monde. */}
        <button className="lien lien-recommencer" onClick={demanderRecommencer}>
          Recommencer à zéro
        </button>
        <button className="bouton-succes bouton-monde" onClick={onQuitter} title="Changer de monde (ta partie est sauvegardée automatiquement)">
          🌍 {monde.nom}
        </button>
        {/* Les statistiques et les succès : de petits boutons discrets, ils s'ouvrent dans une fenêtre. */}
        <button className="bouton-succes" onClick={() => setStatsOuvertes(true)} title="Voir les statistiques">
          📊 Stats
        </button>
        <button className="bouton-succes" onClick={() => setSuccesOuverts(true)} title="Voir les succès">
          🏅 {etat.succes.length}/{SUCCES.length}
        </button>
      </header>
      <Hud etat={etat} nbVentes={nbVentes} enMinage={enMinage} onOuvrirArbre={() => setArbreOuvert(true)} />

      <main className="plateau">
        <div className="colonne-mine">
          <VueMonde
            etat={etat}
            enMinage={enMinage}
            versLaGauche={versLaGauche}
            xVillage={village.x}
            versLaGaucheVillage={village.versLaGauche}
            enMarcheVillage={village.enMarche}
            onAllerStand={(index) => village.allerVers(STANDS[index].x)}
            gains={gains}
            eclats={eclats}
            trouvailles={trouvailles}
          />

          {/* La barre de boutons : toujours les mêmes 4 boutons, toujours à la même place.
              Ceux qui ne servent pas à l'endroit où l'on est sont simplement grisés. */}
          <div className="actions">
            {/* « Creuser » casse une couche (et devient « Arrêter » pendant ce temps). */}
            {enMinage && !enAuto ? (
              <button className="bouton bouton-stop" onClick={arreter}>
                <span className="emoji-bouton">⏹️ </span>Arrêter
              </button>
            ) : (
              <button className="bouton bouton-creuser" onClick={() => creuser(1)} disabled={!auFront || enMinage}>
                <span className="emoji-bouton">⛏️ </span>Creuser
              </button>
            )}
            {/* « Auto » creuse sans s'arrêter, jusqu'à ce qu'on reclique (« Arrêt »).
                Il s'arrête aussi tout seul si la pioche casse : pas de minage à mains nues sans toi. */}
            {enAuto ? (
              <button className="bouton bouton-stop" onClick={arreter}>
                <span className="emoji-bouton">⏹️ </span>Arrêt
              </button>
            ) : (
              <button
                className="bouton bouton-creuser-x10"
                onClick={creuserAuto}
                disabled={!auFront || enMinage || estCassee(etat)}
                title={estCassee(etat) ? 'Ta pioche est cassée : répare-la (ou creuse à la main avec « Creuser »)' : 'Creuser sans s’arrêter'}
              >
                <span className="emoji-bouton">♾️ </span>Auto
              </button>
            )}
            <button className="bouton bouton-voyage" onClick={allerAuVillage} disabled={enVille || dansLaCabine}>
              <span className="emoji-bouton">🏠 </span>Village
            </button>
            <button className="bouton bouton-voyage" onClick={allerALaMine} disabled={auFront || dansLaCabine}>
              <span className="emoji-bouton">⛏️ </span>Mine
            </button>
          </div>
          {/* Un petit rappel : on se déplace avec les flèches du clavier. */}
          <p className="aide-clavier">
            <kbd>←</kbd> <kbd>→</kbd> {enVille ? 'pour marcher dans le village' : 'pour te déplacer dans la mine'}
          </p>
        </div>

        <div className="colonne-panneaux">
          {panneau}
          {/* Les notifications, sous le panneau de droite : bien visibles, sans cacher le jeu. */}
          <Toasts toasts={toasts} />
        </div>
      </main>

      {succesOuverts && (
        <div className="voile" role="dialog" aria-modal="true" aria-label="Succès" onClick={() => setSuccesOuverts(false)}>
          <div className="carte fenetre-succes" onClick={(e) => e.stopPropagation()}>
            <h2>🏅 Succès</h2>
            <PanneauSucces etat={etat} />
            <div className="boutons boutons-centre">
              <button className="bouton bouton-neutre" onClick={() => setSuccesOuverts(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      {statsOuvertes && <FenetreStatistiques etat={etat} onFermer={() => setStatsOuvertes(false)} />}
      {feteOuverte && (
        <FetePrestige
          etat={etat}
          onContinuer={() => {
            setFeteOuverte(false)
            setArbreOuvert(true)
          }}
        />
      )}
      {arbreOuvert && <ArbrePrestige etat={etat} jouer={jouer} onFermer={() => setArbreOuvert(false)} />}
      {victoireAffichee && <Victoire etat={etat} onPrestige={faireLePrestige} onFermer={() => setVictoireAffichee(false)} />}
    </div>
  )
}

// L'application : l'écran d'accueil (choix du monde et compte), puis le jeu.
function App() {
  const [monde, setMonde] = useState<InfoMonde | null>(null)
  // Le compte reste ouvert pendant la partie : il recopie les mondes en ligne régulièrement.
  const compte = useCompte()
  if (monde === null) return <Accueil compte={compte} onJouer={setMonde} />

  function quitter() {
    compte.envoyerMaintenant() // la partie qu'on vient de jouer part tout de suite en ligne
    setMonde(null)
  }
  // « key » : changer de monde repart d'un jeu tout neuf (aucun état de l'ancien monde ne reste).
  return <Jeu key={monde.id} monde={monde} onQuitter={quitter} />
}

export default App
