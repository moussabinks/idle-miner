// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Deux vues :
//   - le village vu du ciel (à la surface) : on s'y promène, on pose et on déplace ses bâtiments
//     (menus Bâtiments, Décorations et Modifier), on entre dans la mine par son bâtiment ;
//   - la mine en coupe (la vue d'avant, en 2D) : on y creuse, avec l'échelle et l'ascenseur.
//
// Clavier :
//   au village : les flèches pour marcher (on peut les combiner), Espace pour sauter, Échap pour
//   annuler ce qu'on est en train de poser ;
//   sur l'échelle : ↑ pour monter, ↓ pour descendre (on avance tant que la touche est appuyée) ;
//   au front de taille : ← → pour se déplacer, ↑ pour remonter (on creuse seulement avec les boutons).

import { useCallback, useEffect, useState } from 'react'
import { reglerLieu } from './ambiance'
import { Accueil } from './composants/Accueil'
import { ArbrePrestige } from './composants/ArbrePrestige'
import { CartePrestige } from './composants/CartePrestige'
import { ProchainObjectif } from './composants/ProchainObjectif'
import { FetePrestige } from './composants/FetePrestige'
import { Hud } from './composants/Hud'
import { FenetreStatistiques } from './composants/Statistiques'
import { Icone } from './composants/Icone'
import { Inventaire } from './composants/Inventaire'
import { AmeliorationAscenseur } from './composants/Ascenseur'
import { MenuConstruction, type OngletConstruction } from './composants/MenuConstruction'
import { PanneauEmployes } from './composants/PanneauEmployes'
import { PanneauTenues } from './composants/PanneauTenues'
import { PanneauBazar, PanneauEnchanter, PanneauForeuse, PanneauMarche, PanneauPioches, PanneauSucces } from './composants/Panneaux'
import { Toasts } from './composants/Toasts'
import { Victoire } from './composants/Victoire'
import { VueMonde } from './composants/VueMonde'
import { VueVillage } from './composants/VueVillage'
import { tailleFantome, type CibleVillage, type Fantome } from './composants/fantome'
import { Jauges } from './composants/Jauges'
import { lotChoisi, type Choix } from './choix'
import {
  aLaSurface,
  appelerAscenseur,
  arreterSurEchelle,
  ascenseurEnMouvement,
  auFond,
  bonusVente,
  deplacerMineur,
  dureeAscenseur,
  dureeEchelle,
  estCassee,
  positionFront,
  voyager,
} from './jeu/mineur'
import {
  acheterDecoration,
  construireBatiment,
  deplacerBatiment,
  deplacerDecoration,
  deplacerSol,
  estPose,
  marquerBatimentsVus,
  nouveautesBatiments,
  batimentsConstructibles,
  peutPoserSol,
  poserSol,
  retirerDecoration,
  retirerSol,
  type TypeSol,
} from './jeu/batiments'
import { chargerWagonnet, nbEnRoute, wagonnetDisponible } from './jeu/convois'
import { peutPasserPrestige } from './jeu/conditionsPrestige'
import { DECOUVERTES, decouvertesAMontrer, marquerDecouvert } from './jeu/decouvertes'
import { BATIMENTS, BLOCS, COUT_CHEMIN, COUT_RAIL, DECORATIONS, profondeurBedrock, type IdBatiment, type IdBloc, type IdDecoration } from './jeu/donnees'
import { notificationsBatiments } from './jeu/notifications'
import { marquerStandVu, standsAvecNouveauxNiveaux } from './jeu/objectifs'
import type { InfoMonde } from './jeu/sauvegarde'
import { SUCCES } from './jeu/succes'
import { pointsDisponibles } from './jeu/talents'
import {
  RAYON_BATIMENT,
  batimentPose,
  caseAccesProche,
  cleCase,
  distanceAuBatiment,
  empriseBatiment,
  empriseDecoration,
  empriseLibre,
  type Case,
  type Occupant,
} from './jeu/village'
import { useCompte } from './useCompte'
import { useJoueurVillage, type DirectionFleche } from './useJoueurVillage'
import { usePartie } from './usePartie'

type OngletMine = 'sac' | 'pioches'

const FLECHES: Record<string, DirectionFleche> = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }

// Le panneau de la mine (au village) : entrer dans la mine, appeler l'ascenseur, l'améliorer,
// et charger le wagonnet quand des rails relient la mine au marché.
function PanneauMine({ etat, jouer, onEntrer }: { etat: ReturnType<typeof usePartie>['etat']; jouer: ReturnType<typeof usePartie>['jouer']; onEntrer: () => void }) {
  const [choix, setChoix] = useState<Choix>({})
  const cabineAuVillage = etat.ascenseur.niveau > 0 && !ascenseurEnMouvement(etat) && etat.ascenseur.position === 0
  const wagonnet = wagonnetDisponible(etat)
  // Les objets les plus précieux en premier, comme au marché (les objets gardés partent à 0).
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const lot = lotChoisi(choix, etat.nonAVendre, piles)
  const nbLot = Object.values(lot).reduce((t, n) => t + (n ?? 0), 0)
  return (
    <div className="liste-cartes">
      <p>
        Ta mine descend à <strong>-{etat.profondeur} m</strong> (la bedrock est à -{profondeurBedrock(etat.prestige)} m).{' '}
        {cabineAuVillage ? `L'ascenseur t'attend : descente en ${Math.ceil(dureeAscenseur(etat))} s.` : `À l'échelle, il faut ${Math.ceil(dureeEchelle(etat))} s pour y descendre.`}
      </p>
      <button className="bouton bouton-creuser bouton-entrer-mine" onClick={onEntrer}>
        ⛏️ Entrer dans la mine
      </button>
      {etat.ascenseur.niveau > 0 && !cabineAuVillage && (
        <button className="bouton bouton-petit bouton-ascenseur" disabled={ascenseurEnMouvement(etat)} onClick={() => jouer(appelerAscenseur)}>
          🛗 Appeler l'ascenseur
        </button>
      )}

      {/* Avec des rails jusqu'au marché, on charge le wagonnet ici : pas besoin d'aller au marché. */}
      {wagonnet && Object.keys(etat.inventaire).length > 0 && (
        <div className="ligne-achat">
          <strong>🛤️ Wagonnet</strong>
          <span className="discret">Les rails vont jusqu'au marché : charge le wagonnet, tes minerais y seront vendus à l'arrivée.</span>
          <Jauges
            piles={piles}
            choix={choix}
            gardes={etat.nonAVendre}
            onChanger={(bloc, valeur) => setChoix({ ...choix, [bloc]: valeur })}
            prixUnitaire={(bloc) => BLOCS[bloc].prix * bonusVente(etat)}
            onToutSelectionner={() => setChoix(Object.fromEntries(piles.map(([bloc]) => [bloc, 'max'])))}
          />
          <button className="bouton bouton-ascenseur" disabled={nbLot === 0} onClick={() => {
            jouer((e) => chargerWagonnet(e, lot))
            setChoix({})
          }}>
            🛤️ Charger {nbLot} objet{nbLot > 1 ? 's' : ''}
          </button>
        </div>
      )}
      {nbEnRoute(etat) > 0 && <p className="discret">🛒 {nbEnRoute(etat)} objet(s) en route vers le marché.</p>}

      {/* L'ascenseur se construit et s'améliore aussi d'ici, sans descendre. */}
      <div className="ligne-achat">
        <strong>🛗 Ascenseur</strong>
        <AmeliorationAscenseur etat={etat} jouer={jouer} />
      </div>
    </div>
  )
}

// Le jeu, dans le monde (la sauvegarde) choisi sur l'écran d'accueil.
function Jeu({ monde, onQuitter }: { monde: InfoMonde; onQuitter: () => void }) {
  const { etat, toasts, gains, eclats, trouvailles, nbVentes, enMinage, enAuto, jouer, creuser, creuserAuto, arreter, recommencer, passerPrestige } =
    usePartie(monde.id)
  const [arbreOuvert, setArbreOuvert] = useState(false)
  const [feteOuverte, setFeteOuverte] = useState(false)
  const [succesOuverts, setSuccesOuverts] = useState(false)
  const [statsOuvertes, setStatsOuvertes] = useState(false)
  const [ongletMine, setOngletMine] = useState<OngletMine>('sac')
  // Le petit menu ⚙️ (changer de monde, recommencer), l'aide ❔ du village, et le panneau du sac
  // dans la mine sur téléphone (il s'ouvre avec le bouton 🎒 : sinon il cacherait la mine).
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [aideOuverte, setAideOuverte] = useState(false)
  const [sacOuvert, setSacOuvert] = useState(false)
  const [versLaGauche, setVersLaGauche] = useState(false)

  // --- Où est le joueur : au village (vue du ciel) ou dans la mine (vue en coupe) ---
  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const dansLaCabine = etat.ascenseur.passager
  const [transition, setTransition] = useState<'entree' | 'sortie' | null>(null)
  const village = useJoueurVillage(etat.village, enVille)
  const joueur = village.joueur

  // On revient de la mine : le village réapparaît (on « ressort » du trou) et le joueur est devant la mine.
  const [etaitEnVille, setEtaitEnVille] = useState(enVille)
  if (etaitEnVille !== enVille) {
    setEtaitEnVille(enVille)
    if (enVille) setTransition('sortie')
  }
  const placerALaMine = village.placerALaMine
  useEffect(() => {
    if (transition === 'sortie') placerALaMine()
  }, [transition, placerALaMine])

  // La musique d'ambiance suit le joueur : oiseaux et vent au village, grotte dans la mine.
  const auFondDeLaMine = Math.round((etat.position / profondeurBedrock(etat.prestige)) * 50) / 50
  useEffect(() => reglerLieu(enVille, auFondDeLaMine), [enVille, auFondDeLaMine])

  // --- Construire, décorer, modifier -----------------------------------------
  const [menuConstruction, setMenuConstruction] = useState<OngletConstruction | null>(null)
  const [fantome, setFantome] = useState<Fantome | null>(null)
  // Le placement se fait en deux temps : le fantôme suit la souris, un clic sur la carte le
  // « fixe » (sans rien construire), puis le bouton « Construire ici » le pose. Sinon, en allant
  // vers le bouton, la souris emmenait le bâtiment avec elle.
  const [fantomeFixe, setFantomeFixe] = useState(false)
  const [pinceau, setPinceau] = useState<TypeSol | null>(null)
  const [modifier, setModifier] = useState(false)
  const edition = fantome !== null || pinceau !== null || modifier

  // Le fantôme peut-il être posé là où il est ?
  function fantomeLibre(f: Fantome | null): boolean {
    if (!f) return false
    if (f.type === 'batiment') {
      const ignorer: Occupant | null = estPose(etat, f.id) ? { type: 'batiment', id: f.id } : null
      return empriseLibre(etat.village, empriseBatiment(f), ignorer)
    }
    if (f.type === 'decoration') return empriseLibre(etat.village, empriseDecoration(f), f.n !== null ? { type: 'decoration', n: f.n } : null)
    const ignorer = f.de ? ({ type: f.sol, cle: cleCase(f.de.x, f.de.y) } as Occupant & { cle: string }) : null
    return empriseLibre(etat.village, { x: f.x, y: f.y, taille: 1 }, ignorer)
  }

  // Une place libre pour un nouvel élément, près du joueur (en tournant autour de lui).
  function placeProche(taille: number): Case {
    const depart = { x: Math.round(joueur.x - taille / 2), y: Math.round(joueur.y - taille - 1) }
    for (let rayon = 0; rayon < 40; rayon++) {
      for (let dx = -rayon; dx <= rayon; dx++) {
        for (let dy = -rayon; dy <= rayon; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rayon) continue
          const c = { x: depart.x + dx, y: depart.y + dy }
          if (empriseLibre(etat.village, { ...c, taille })) return c
        }
      }
    }
    return depart
  }

  function poserBatiment(id: IdBatiment) {
    setMenuConstruction(null)
    setFantomeFixe(false)
    setFantome({ type: 'batiment', id, ...placeProche(BATIMENTS[id].taille), miroir: false })
  }

  function poserDecoration(id: IdDecoration) {
    setMenuConstruction(null)
    setFantomeFixe(false)
    setFantome({ type: 'decoration', id, n: null, ...placeProche(DECORATIONS[id].taille), miroir: false })
  }

  function commencerPinceau(sol: TypeSol) {
    setMenuConstruction(null)
    setPinceau(sol)
  }

  function annulerEdition() {
    setFantome(null)
    setPinceau(null)
  }

  function terminerEdition() {
    setFantome(null)
    setPinceau(null)
    setModifier(false)
  }

  function validerFantome() {
    const f = fantome
    if (!f || !fantomeLibre(f)) return
    if (f.type === 'batiment') jouer((e) => (estPose(e, f.id) ? deplacerBatiment(e, f.id, f.x, f.y, f.miroir) : construireBatiment(e, f.id, f.x, f.y, f.miroir)))
    else if (f.type === 'decoration') jouer((e) => (f.n !== null ? deplacerDecoration(e, f.n, f.x, f.y, f.miroir) : acheterDecoration(e, f.id, f.x, f.y, f.miroir)))
    else if (f.de) jouer((e) => deplacerSol(e, f.sol, f.de as Case, { x: f.x, y: f.y }))
    setFantome(null)
  }

  function retirerFantome() {
    const f = fantome
    if (!f) return
    if (f.type === 'decoration' && f.n !== null) jouer((e) => retirerDecoration(e, f.n as number))
    if (f.type === 'sol' && f.de) jouer((e) => retirerSol(e, f.sol, (f.de as Case).x, (f.de as Case).y))
    setFantome(null)
  }

  function deplacerFantome(c: Case) {
    setFantome((f) => {
      if (!f) return f
      const t = tailleFantome(f)
      const x = Math.max(0, Math.min(40 - t, c.x - Math.floor(t / 2)))
      const y = Math.max(0, Math.min(40 - t, c.y - Math.floor(t / 2)))
      return f.x === x && f.y === y ? f : { ...f, x, y }
    })
  }

  // En mode pinceau, chaque case touchée reçoit un rail (ou un pavé) si elle est libre.
  function peindre(c: Case) {
    if (pinceau === null) return
    if (peutPoserSol(etat, pinceau, c.x, c.y)) jouer((e) => poserSol(e, pinceau, c.x, c.y))
  }

  // --- Les bâtiments : on marche jusqu'à eux, puis le panneau s'ouvre ---
  const [panneauFerme, setPanneauFerme] = useState(false)

  // Le bâtiment près duquel se tient le joueur : à moins de RAYON_BATIMENT cases de son bord,
  // de n'importe quel côté (plus besoin de chercher la porte).
  // Le bâtiment qu'on a touché pour y aller : s'il est assez près, c'est lui qu'on ouvre (même si
  // un autre bâtiment voisin est aussi près, par exemple entre la forge et la mine).
  const [batimentVise, setBatimentVise] = useState<IdBatiment | null>(null)
  let batimentProche: IdBatiment | null = null
  const vise = batimentVise ? batimentPose(etat.village, batimentVise) : null
  if (enVille && transition === null && vise && distanceAuBatiment(vise, joueur.x, joueur.y) < RAYON_BATIMENT) {
    batimentProche = vise.id
  } else if (enVille && transition === null) {
    let meilleure = RAYON_BATIMENT
    for (const b of etat.village.batiments) {
      const distance = distanceAuBatiment(b, joueur.x, joueur.y)
      if (distance < meilleure) {
        meilleure = distance
        batimentProche = b.id
      }
    }
  }
  // Le panneau s'ouvre quand on arrive en marchant devant un bâtiment, mais pas quand on y
  // apparaît d'un coup (au chargement de la partie, en sortant de la mine) : sur téléphone, il
  // cacherait la carte.
  const [dernierProche, setDernierProche] = useState<IdBatiment | null>(null)
  if (dernierProche !== batimentProche) {
    setDernierProche(batimentProche)
    setPanneauFerme(!joueur.marche)
  }
  const batimentActif = !edition && !panneauFerme ? batimentProche : null

  const allerAuBatiment = useCallback(
    (id: IdBatiment, quandArrive?: () => void) => {
      const b = batimentPose(etat.village, id)
      if (!b) return
      setPanneauFerme(false)
      setBatimentVise(id)
      // Il marche jusqu'au côté du bâtiment le plus proche de lui.
      village.allerVers(caseAccesProche(etat.village, b, joueur), quandArrive)
    },
    [etat.village, village, joueur],
  )

  // Arrivé devant un bâtiment tout juste débloqué (foreuse, Personnel, recruteur, manager) :
  // sa notification « Nouveau » disparaît. Pareil pour le badge « Nouveaux niveaux ».
  const aDecouvrirIci = batimentActif ? decouvertesAMontrer(etat).filter((id) => DECOUVERTES[id].stand === batimentActif) : []
  const cleDecouvertes = aDecouvrirIci.join(',')
  useEffect(() => {
    if (cleDecouvertes) jouer((e) => marquerDecouvert(e, decouvertesAMontrer(e).filter((id) => cleDecouvertes.split(',').includes(id))))
  }, [cleDecouvertes, jouer])
  const standAvecNiveaux = batimentActif && standsAvecNouveauxNiveaux(etat).includes(batimentActif) ? batimentActif : null
  useEffect(() => {
    if (standAvecNiveaux) jouer((e) => marquerStandVu(e, standAvecNiveaux))
  }, [standAvecNiveaux, jouer])

  // Un toucher sur la carte du village.
  function toucherCarte(c: Case, cible: CibleVillage | null) {
    if (pinceau !== null) return
    if (fantome !== null) {
      // Un clic pose le fantôme à cet endroit et l'y fixe : on peut alors aller cliquer sur
      // « Construire ici » sans l'emmener. Un autre clic le déplace (il reste fixé).
      deplacerFantome(c)
      setFantomeFixe(true)
      return
    }
    if (modifier) {
      // On choisit l'élément à déplacer : il est déjà à sa place, donc fixé.
      setFantomeFixe(true)
      if (cible?.type === 'batiment') {
        const b = batimentPose(etat.village, cible.id)
        if (b) setFantome({ type: 'batiment', id: b.id, x: b.x, y: b.y, miroir: b.miroir })
      } else if (cible?.type === 'decoration') {
        const d = etat.village.decorations.find((x) => x.n === cible.n)
        if (d) setFantome({ type: 'decoration', id: d.id, n: d.n, x: d.x, y: d.y, miroir: d.miroir })
      } else if (cible?.type === 'rail' || cible?.type === 'chemin') {
        setFantome({ type: 'sol', sol: cible.type, x: cible.x, y: cible.y, de: { x: cible.x, y: cible.y } })
      }
      return
    }
    if (cible?.type === 'batiment') allerAuBatiment(cible.id)
    else {
      setBatimentVise(null)
      village.allerVers(c)
    }
  }

  // --- Entrer dans la mine (et en sortir) ---
  function entrerDansLaMine() {
    if (transition !== null) return
    const commencer = () => {
      arreter()
      setTransition('entree')
    }
    if (batimentProche === 'puits') commencer()
    else allerAuBatiment('puits', commencer)
  }

  function finTransition() {
    if (transition === 'entree') jouer((e) => voyager(e, positionFront(e)))
    setTransition(null)
  }

  // Pendant la partie, le navigateur ne zoome pas la page (sinon les boutons grossissaient et
  // sortaient de l'écran) : seul le zoom de la carte marche (molette, pincement sur la carte).
  // On bloque Ctrl + molette et le pincement du pavé tactile, Ctrl + / Ctrl -, et le pincement
  // de Safari sur iPhone.
  useEffect(() => {
    const molette = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    const touches = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault()
    }
    const geste = (e: Event) => e.preventDefault()
    window.addEventListener('wheel', molette, { passive: false })
    window.addEventListener('keydown', touches)
    document.addEventListener('gesturestart', geste)
    document.addEventListener('gesturechange', geste)
    return () => {
      window.removeEventListener('wheel', molette)
      window.removeEventListener('keydown', touches)
      document.removeEventListener('gesturestart', geste)
      document.removeEventListener('gesturechange', geste)
    }
  }, [])

  // L'écran de victoire s'affiche une seule fois, au moment où l'on atteint la bedrock.
  const [victoireAffichee, setVictoireAffichee] = useState(false)
  const [avaitGagne, setAvaitGagne] = useState(etat.victoire)
  if (avaitGagne !== etat.victoire) {
    setAvaitGagne(etat.victoire)
    if (etat.victoire) setVictoireAffichee(true)
  }

  // --- La mine : échelle, ascenseur, déplacements au front ---

  function commencerEchelle(sens: number) {
    arreter()
    jouer((e) => voyager(e, sens < 0 ? 0 : positionFront(e), true))
  }

  function allerAuVillage() {
    arreter()
    jouer((e) => voyager(e, 0))
  }

  function allerAuFront() {
    if (enVille) entrerDansLaMine()
    else jouer((e) => voyager(e, positionFront(e)))
  }

  // Le clic sur le prochain objectif : au village, on marche jusqu'au bâtiment ; dans la mine, on remonte.
  function allerAuStand(id: IdBatiment) {
    if (enVille) allerAuBatiment(id)
    else allerAuVillage()
  }

  function ouvrirConstruction(onglet: OngletConstruction) {
    setModifier(false)
    annulerEdition()
    setMenuConstruction(onglet)
    if (onglet === 'batiments') jouer(marquerBatimentsVus)
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
      if (enVille) {
        if (touche === 'Escape') {
          annulerEdition()
          setModifier(false)
          setMenuConstruction(null)
          return
        }
        if (touche === ' ') {
          evenement.preventDefault()
          if (!evenement.repeat) village.sauter()
          return
        }
        const direction = FLECHES[touche]
        if (!direction || menuConstruction !== null) return
        evenement.preventDefault()
        if (!evenement.repeat) {
          setBatimentVise(null)
          village.fleche(direction, true)
        }
        return
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(touche)) return
      evenement.preventDefault()
      const repetition = evenement.repeat
      if (auFront) {
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
      const direction = FLECHES[evenement.key]
      if (direction) village.fleche(direction, false)
      if (!enVille && (evenement.key === 'ArrowUp' || evenement.key === 'ArrowDown')) jouer(arreterSurEchelle)
    }

    const perdreFocus = () => village.arreterFleches()
    window.addEventListener('keydown', toucheAppuyee)
    window.addEventListener('keyup', toucheRelachee)
    window.addEventListener('blur', perdreFocus)
    return () => {
      window.removeEventListener('keydown', toucheAppuyee)
      window.removeEventListener('keyup', toucheRelachee)
      window.removeEventListener('blur', perdreFocus)
    }
  })

  function demanderRecommencer() {
    if (window.confirm(`Effacer la partie du monde « ${monde.nom} » et tout recommencer (village, succès et foreuse compris) ?`)) {
      recommencer()
      terminerEdition()
    }
  }

  // Après le prestige, on choisit tout de suite sa récompense dans l'arbre.
  // (Seulement quand tout est au maximum : voir conditionsPrestige.ts.)
  function faireLePrestige() {
    if (!peutPasserPrestige(etat)) return
    passerPrestige()
    setVictoireAffichee(false)
    // D'abord la fête (confettis !), puis l'arbre de prestige quand on clique sur « Choisir mon talent ».
    setFeteOuverte(true)
  }

  // --- Le panneau : le bâtiment où l'on est, ou le sac dans la mine ---

  let panneau = null
  if (enVille && batimentActif !== null) {
    const info = BATIMENTS[batimentActif]
    panneau = (
      <section className="carte panneau panneau-batiment">
        <div className="entete-panneau">
          <h2 className="titre-stand">
            <span aria-hidden="true">{info.emoji}</span> {info.nom}
          </h2>
          <button className="bouton-fermer" onClick={() => setPanneauFerme(true)} aria-label="Fermer">
            ✖
          </button>
        </div>
        <p className="discret">{info.description}</p>
        {batimentActif === 'marche' && <PanneauMarche etat={etat} jouer={jouer} />}
        {batimentActif === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {batimentActif === 'bazar' && (
          <>
            <PanneauBazar etat={etat} jouer={jouer} />
            <PanneauTenues etat={etat} jouer={jouer} />
          </>
        )}
        {batimentActif === 'enchanteur' && <PanneauEnchanter etat={etat} jouer={jouer} />}
        {batimentActif === 'foreuse' && <PanneauForeuse etat={etat} jouer={jouer} />}
        {batimentActif === 'employes' && <PanneauEmployes etat={etat} jouer={jouer} />}
        {batimentActif === 'puits' && <PanneauMine etat={etat} jouer={jouer} onEntrer={entrerDansLaMine} />}
        {batimentActif === 'prestige' && (
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
          </div>
        )}
      </section>
    )
  } else if (enVille && aideOuverte) {
    panneau = (
      <section className="carte panneau panneau-aide-village">
        <div className="entete-panneau">
          <h2>🏡 Ton village</h2>
          <button className="bouton-fermer" onClick={() => setAideOuverte(false)} aria-label="Fermer">
            ✖
          </button>
        </div>
        <p className="discret">
          Touche un bâtiment pour y aller (ou marche avec les flèches du clavier, <kbd>Espace</kbd> pour sauter). Fais glisser la carte pour la
          déplacer, pince ou utilise la molette pour zoomer.
        </p>
        <p className="discret">
          Les boutons <strong>Bâtiments</strong> et <strong>Décos</strong> en bas à droite servent à construire, <strong>Modifier</strong> à
          déplacer ou retourner ce qui est posé, et <strong>Mine</strong> (en bas à gauche) à descendre creuser.
        </p>
      </section>
    )
  } else if (!enVille) {
    panneau = (
      <section className={`carte panneau panneau-sac ${sacOuvert ? 'sac-ouvert' : ''}`}>
        <button className="bouton-fermer fermer-sac" onClick={() => setSacOuvert(false)} aria-label="Fermer le sac">
          ✖
        </button>
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

  // La barre de boutons du bas : au village (construire, décorer, modifier, la mine), pendant qu'on
  // pose quelque chose (valider, retourner, annuler), ou dans la mine (creuser...).
  // La pastille du menu Bâtiments : les nouveautés pas encore vues, et ce qu'on peut construire tout de suite.
  const nbNouveautes = new Set([...nouveautesBatiments(etat), ...batimentsConstructibles(etat)]).size
  const libre = fantomeLibre(fantome)
  let barre
  if (enVille && fantome !== null) {
    const nouveau = (fantome.type === 'batiment' && !estPose(etat, fantome.id)) || (fantome.type === 'decoration' && fantome.n === null)
    const peutRetirer = (fantome.type === 'decoration' && fantome.n !== null) || (fantome.type === 'sol' && fantome.de !== null)
    barre = (
      <div className="actions actions-edition">
        {!fantomeFixe && <p className="consigne-edition">👆 Clique (ou touche) la carte pour placer, puis valide.</p>}
        <button className="bouton bouton-vendre" disabled={!libre} onClick={validerFantome}>
          ✔ {nouveau ? (fantome.type === 'decoration' ? `Poser (${DECORATIONS[fantome.id].prix} $)` : 'Construire ici') : 'Poser ici'}
        </button>
        {fantome.type !== 'sol' && (
          <button className="bouton bouton-neutre" onClick={() => setFantome({ ...fantome, miroir: !fantome.miroir })}>
            ↔ Retourner
          </button>
        )}
        {peutRetirer && (
          <button className="bouton bouton-stop" onClick={retirerFantome} title="Enlever (sans remboursement)">
            🗑️ Enlever
          </button>
        )}
        <button className="bouton bouton-stop" onClick={() => setFantome(null)}>
          ✖ Annuler
        </button>
      </div>
    )
  } else if (enVille && pinceau !== null) {
    const cout = pinceau === 'rail' ? COUT_RAIL : COUT_CHEMIN
    barre = (
      <div className="actions actions-edition">
        <p className="consigne-edition">
          {pinceau === 'rail' ? '🛤️ Touche ou glisse sur les cases pour poser des rails' : '🪨 Touche ou glisse sur les cases pour poser un chemin'} (
          {cout.argent ? `${cout.argent} $` : `${cout.materiaux.fer} 🔩 fer`} la case).
        </p>
        <button className="bouton bouton-vendre" onClick={() => setPinceau(null)}>
          ✔ Terminé
        </button>
      </div>
    )
  } else if (enVille && modifier) {
    barre = (
      <div className="actions actions-edition">
        <p className="consigne-edition">✏️ Touche un bâtiment, une décoration, un rail ou un chemin pour le déplacer.</p>
        <button className="bouton bouton-vendre" onClick={() => setModifier(false)}>
          ✔ Terminé
        </button>
      </div>
    )
  } else if (enVille) {
    barre = (
      // Comme dans Clash of Clans : de gros boutons ronds posés sur la carte, la mine en bas à
      // gauche, la construction en bas à droite.
      <div className="actions actions-village">
        <button className="bouton bouton-rond bouton-voyage bouton-rond-gros" onClick={entrerDansLaMine} disabled={transition !== null}>
          <span className="icone-rond" aria-hidden="true">⛏️</span>
          <span className="texte-rond">Mine</span>
        </button>
        <div className="groupe-boutons-ronds">
          <button className="bouton bouton-rond bouton-neutre" onClick={() => setModifier(true)}>
            <span className="icone-rond" aria-hidden="true">✏️</span>
            <span className="texte-rond">Modifier</span>
          </button>
          <button className="bouton bouton-rond bouton-decorer" onClick={() => ouvrirConstruction('decorations')}>
            <span className="icone-rond" aria-hidden="true">🌸</span>
            <span className="texte-rond">Décos</span>
          </button>
          <button className="bouton bouton-rond bouton-construire bouton-rond-gros" onClick={() => ouvrirConstruction('batiments')}>
            <span className="icone-rond" aria-hidden="true">🏗️</span>
            <span className="texte-rond">Bâtiments</span>
            {nbNouveautes > 0 && <span className="badge-menu">{nbNouveautes}</span>}
          </button>
        </div>
      </div>
    )
  } else {
    barre = (
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
        <button className="bouton bouton-voyage" onClick={allerAuVillage} disabled={dansLaCabine}>
          <span className="emoji-bouton">🏠 </span>Village
        </button>
        <button className="bouton bouton-voyage" onClick={allerAuFront} disabled={auFront || dansLaCabine}>
          <span className="emoji-bouton">⛏️ </span>Front
        </button>
        {/* Sur téléphone, le sac s'ouvre par-dessus la mine avec ce bouton (sur ordinateur, il est toujours là). */}
        <button className={`bouton bouton-mettre-sac bouton-sac-telephone ${sacOuvert ? 'actif' : ''}`} onClick={() => setSacOuvert(!sacOuvert)}>
          <span className="emoji-bouton">🎒 </span>Sac
        </button>
      </div>
    )
  }

  return (
    <div className={`jeu plein-ecran ${enVille ? 'mode-village' : 'mode-mine'} ${etat.employes.length > 0 ? 'avec-mineurs' : ''} ${panneau ? 'avec-panneau' : ''}`}>
      {/* La scène prend tout l'écran : le village vu du ciel, ou la mine en coupe. */}
      <main className="scene">
        {enVille ? (
          <VueVillage
            etat={etat}
            joueur={joueur}
            notifications={notificationsBatiments(etat)}
            batimentActif={batimentActif}
            fantome={fantome}
            fantomeLibre={libre}
            pinceau={pinceau !== null}
            onTap={toucherCarte}
            onSurvol={(c) => {
              if (!fantomeFixe) deplacerFantome(c)
            }}
            onGlisser={deplacerFantome}
            onPeindre={peindre}
            transition={transition}
            onTransitionFinie={finTransition}
            panneauOuvert={panneau !== null}
          />
        ) : (
          <div className="entree-dans-la-mine">
            <VueMonde etat={etat} enMinage={enMinage} versLaGauche={versLaGauche} gains={gains} eclats={eclats} trouvailles={trouvailles} />
          </div>
        )}
      </main>

      {/* Tout le reste est posé par-dessus la scène, comme dans Clash of Clans. */}
      <div className="interface">
        <div className="interface-haut">
          {/* En haut à gauche : le monde, les stats, les succès, les réglages (et l'aide au village). */}
          <nav className="boutons-coin" aria-label="Menu du jeu">
            <button className="bouton-coin" onClick={onQuitter} title="Changer de monde (ta partie est sauvegardée automatiquement)">
              <span aria-hidden="true">🌍</span>
              <span className="texte-coin">{monde.nom}</span>
            </button>
            <button className="bouton-coin" onClick={() => setStatsOuvertes(true)} title="Voir les statistiques">
              <span aria-hidden="true">📊</span>
              <span className="texte-coin">Stats</span>
            </button>
            <button className="bouton-coin" onClick={() => setSuccesOuverts(true)} title="Voir les succès">
              <span aria-hidden="true">🏅</span>
              <span className="texte-coin">
                {etat.succes.length}/{SUCCES.length}
              </span>
            </button>
            {enVille && (
              <button className={`bouton-coin ${aideOuverte ? 'actif' : ''}`} onClick={() => setAideOuverte(!aideOuverte)} title="Aide">
                <span aria-hidden="true">❔</span>
                <span className="texte-coin">Aide</span>
              </button>
            )}
            <button className={`bouton-coin ${reglagesOuverts ? 'actif' : ''}`} onClick={() => setReglagesOuverts(!reglagesOuverts)} title="Réglages">
              <span aria-hidden="true">⚙️</span>
              <span className="texte-coin">Réglages</span>
            </button>
            {reglagesOuverts && (
              <div className="menu-reglages carte">
                <button className="bouton bouton-petit bouton-neutre" onClick={onQuitter}>
                  🌍 Changer de monde
                </button>
                {/* Avec confirmation : il efface la partie de ce monde. */}
                <button className="bouton bouton-petit bouton-stop" onClick={demanderRecommencer}>
                  🔄 Recommencer à zéro
                </button>
              </div>
            )}
          </nav>
          <Hud etat={etat} nbVentes={nbVentes} enMinage={enMinage} onOuvrirArbre={() => setArbreOuvert(true)} />
        </div>
        <ProchainObjectif etat={etat} onAllerAuStand={allerAuStand} onConstruire={() => (enVille ? ouvrirConstruction('batiments') : allerAuVillage())} />

        {/* Le panneau du bâtiment (ou le sac dans la mine), par-dessus la carte. */}
        {panneau && <div className="panneau-flottant">{panneau}</div>}

        <div className="interface-bas">
          {barre}
          {/* Un petit rappel : on se déplace avec les flèches du clavier. */}
          <p className="aide-clavier">
            {enVille ? (
              <>
                <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> pour marcher · <kbd>Espace</kbd> pour sauter
              </>
            ) : (
              <>
                <kbd>←</kbd> <kbd>→</kbd> pour te déplacer · <kbd>↑</kbd> <kbd>↓</kbd> sur l'échelle
              </>
            )}
          </p>
        </div>

        <Toasts toasts={toasts} />
      </div>

      {menuConstruction !== null && (
        <MenuConstruction
          etat={etat}
          onglet={menuConstruction}
          onOnglet={(onglet) => ouvrirConstruction(onglet)}
          onFermer={() => setMenuConstruction(null)}
          onPoserBatiment={poserBatiment}
          onPoserDecoration={poserDecoration}
          onPinceau={commencerPinceau}
        />
      )}
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
