// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Tout se passe au village vu du ciel : on y pose et on déplace ses bâtiments (menus Bâtiments
// et Modifier), et on touche un bâtiment pour ouvrir sa fenêtre (25/10 : tout de suite, sans
// attendre que le personnage y soit arrivé).
//
// Clavier : les flèches pour marcher (on peut les combiner), Espace pour sauter, Échap pour
// fermer une fenêtre ou annuler ce qu'on est en train de poser.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { couperPourPub, sons } from './sons'
import { Accueil } from './composants/Accueil'
import { Aide } from './composants/Aide'
import { Boutique } from './composants/Boutique'
import { ContexteJeuReact, type ContexteJeu } from './composants/contexteJeu'
import { Fenetre, type CouleurFenetre } from './composants/Fenetre'
import { Missions } from './composants/Missions'
import { Gains } from './composants/Gains'
import { Hud } from './composants/Hud'
import { FenetreStatistiques } from './composants/Statistiques'
import { MenuConstruction } from './composants/MenuConstruction'
import { PanneauEmployes } from './composants/PanneauEmployes'
import { PanneauMine } from './composants/PanneauMine'
import { PanneauForeuse, PanneauGenerateur, PanneauMarche, PanneauPioches, PanneauSucces } from './composants/Panneaux'
import { Publicite } from './composants/Publicite'
import { RecompensesQuotidiennes } from './composants/RecompensesQuotidiennes'
import { Reglages } from './composants/Reglages'
import { Toasts } from './composants/Toasts'
import { VueVillage } from './composants/VueVillage'
import { FenetreAbsence } from './composants/FenetreAbsence'
import { FenetreQuelsMondes } from './composants/FenetreQuelsMondes'
import { FeteNiveau } from './composants/FeteNiveau'
import { FenetreBilan } from './composants/FenetreBilan'
import { niveauJoueur, prochainDeblocage } from './jeu/niveaux'
import { FenetreRail } from './composants/FenetreRail'
import { FenetreTrajet } from './composants/FenetreTrajet'
import { Tutoriel } from './composants/Tutoriel'
import { avancerTutoriel, avecBouton, etapeFaite, etapeSuivante, etapeTutoriel, passerTutoriel } from './jeu/tutoriel'
import { tailleFantome, type CibleVillage, type Fantome } from './composants/fantome'
import { avancer as avancerCase, sensDeDepart, tourner, virageEntre, type TraceRail, type Virage } from './composants/traceRail'
import {
  construireBatiment,
  deplacerBatiment,
  deplacerSol,
  estPose,
  marquerBatimentsVus,
  nouveautesBatiments,
  batimentsConstructibles,
  peutPoserSol,
  placePourUnRail,
  poserSol,
  raisonSolImpossible,
  retirerSol,
  type TypeSol,
} from './jeu/batiments'
import { DECOUVERTES, decouvertesAMontrer, marquerDecouvert } from './jeu/decouvertes'
import { BATIMENTS, COUT_CHEMIN, COUT_RAIL, TAILLE_GRILLE, type IdBatiment, type IdLiaison } from './jeu/donnees'
import { etatQuotidien, jourDe } from './jeu/gemmes'
import { t, type Langue } from './jeu/langue'
import { notificationsBatiments } from './jeu/notifications'
import type { InfoMonde } from './jeu/sauvegarde'
import { SUCCES } from './jeu/succes'
import { MARGE_CLIC_BATIMENT, batimentProcheDe, batimentPose, caseAccesProche, cleCase, empriseBatiment, empriseLibre, type Case, type Occupant } from './jeu/village'
import { capaciteCoffre, coffrePlein, nbDansCoffre } from './jeu/mineur'
import { joueurPousse, liaisonsSurLaCase, reglerTrajet, trajetsAProposer, type ReglageTrajet } from './jeu/wagonnet'
import { grandMoment, jeuEnCours, jeuEnPause, pubRecompensee, sdkDisponible } from './portail'
import { useCompte } from './useCompte'
import { useJoueurVillage, type DirectionFleche } from './useJoueurVillage'
import { usePartie } from './usePartie'

const FLECHES: Record<string, DirectionFleche> = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }

// La couleur du bandeau de la fenêtre de chaque bâtiment.
const COULEURS_BATIMENTS: Record<IdBatiment, CouleurFenetre> = {
  puits: 'jaune',
  marche: 'vert',
  forgeron: 'rose',
  employes: 'bleu',
  foreuse: 'orange',
  generateur: 'violet',
}

// Les fenêtres qu'on peut ouvrir depuis les boutons du haut.
type FenetreHaut = 'stats' | 'succes' | 'bilan' | 'boutique' | 'quotidien' | 'reglages' | 'aide'

// Le jeu, dans le monde (la sauvegarde) choisi sur l'écran d'accueil.
function Jeu({ monde, onQuitter, onLangue }: { monde: InfoMonde; onQuitter: () => void; onLangue: (langue: Langue) => void }) {
  const { etat, toasts, gains, eclats, trouvailles, nbVentes, jouer, cliquer, recommencer, resumeAbsence, recupererAbsence } = usePartie(monde.id)

  // --- La publicité (fausse pour l'instant, ou celle de CrazyGames) -----------
  const [pubEnCours, setPubEnCours] = useState<{ quandFinie: () => void } | null>(null)
  const regarderPub = useCallback((quandFinie: () => void) => {
    couperPourPub(true)
    if (sdkDisponible()) {
      pubRecompensee(
        () => {
          couperPourPub(false)
          quandFinie()
        },
        () => couperPourPub(false),
      )
      return
    }
    setPubEnCours({ quandFinie })
  }, [])

  const [fenetreHaut, setFenetreHaut] = useState<FenetreHaut | null>(null)
  const contexte: ContexteJeu = useMemo(() => ({ etat, jouer, regarderPub, ouvrirBoutique: () => setFenetreHaut('boutique') }), [etat, jouer, regarderPub])

  // (23/10) La fête du niveau : dès que le joueur passe un niveau, une grande fenêtre (FeteNiveau).
  // (25/10) Elle attend que les autres fenêtres soient fermées (avant, elle fermait tout d'un coup).
  const niveauActuel = niveauJoueur(etat)
  const [niveauVu, setNiveauVu] = useState(niveauActuel)
  const [feteNiveau, setFeteNiveau] = useState<{ avant: number; apres: number } | null>(null)
  if (niveauActuel !== niveauVu) {
    setNiveauVu(niveauActuel)
    if (niveauActuel > niveauVu) setFeteNiveau((f) => ({ avant: f?.avant ?? niveauVu, apres: niveauActuel }))
  }

  // Pendant que le joueur pousse le wagonnet, il fait l'aller-retour avec lui : il ne marche pas.
  const pousse = joueurPousse(etat)
  const village = useJoueurVillage(etat.village, true)
  const joueur = village.joueur

  // Le bruit des pas quand le joueur marche.
  const marche = joueur.marche
  useEffect(() => {
    if (!marche) return
    sons.pas()
    const minuteur = window.setInterval(() => sons.pas(), 340)
    return () => clearInterval(minuteur)
  }, [marche])

  // --- Construire, modifier -------------------------------------------------
  const [menuConstruction, setMenuConstruction] = useState(false)
  const [fantome, setFantome] = useState<Fantome | null>(null)
  // Le placement se fait en deux temps : le fantôme suit la souris, un clic sur la carte le
  // « fixe » (sans rien construire), puis le bouton « Construire ici » le pose.
  const [fantomeFixe, setFantomeFixe] = useState(false)
  const [pinceau, setPinceau] = useState<TypeSol | null>(null)
  const [traceRailBrut, setTraceRail] = useState<TraceRail | null>(null)
  const traceRail = pinceau === 'rail' ? traceRailBrut : null
  const [modifier, setModifier] = useState(false)
  // Le trajet qu'on regarde en embauchant un pousseur (au Personnel) : il brille sur la carte.
  const [apercuTrajet, setApercuTrajet] = useState<IdLiaison | null>(null)
  const edition = fantome !== null || pinceau !== null || modifier
  const [trajetsOuverts, setTrajetsOuvertsBrut] = useState<IdLiaison[] | null>(null)
  const [railTouche, setRailTouche] = useState<Case | null>(null)
  const setTrajetsOuverts = useCallback((liaisons: IdLiaison[] | null) => {
    setTrajetsOuvertsBrut(liaisons)
    if (liaisons !== null) setPinceau(null)
  }, [])
  const fermerTrajets = useCallback(() => {
    setTrajetsOuvertsBrut(null)
    setRailTouche(null)
  }, [])

  function validerTrajets(reglages: Partial<Record<IdLiaison, ReglageTrajet>>) {
    jouer((e) => Object.entries(reglages).flatMap(([liaison, reglage]) => reglerTrajet(e, liaison as IdLiaison, reglage as ReglageTrajet)))
    fermerTrajets()
  }

  function deplacerRailTouche() {
    if (!railTouche) return
    fermerTrajets()
    setFantomeFixe(true)
    setFantome({ type: 'sol', sol: 'rail', x: railTouche.x, y: railTouche.y, de: railTouche })
  }
  function retirerRailTouche() {
    if (!railTouche) return
    const { x, y } = railTouche
    fermerTrajets()
    jouer((e) => retirerSol(e, 'rail', x, y))
  }

  // Le fantôme peut-il être posé là où il est ?
  function fantomeLibre(f: Fantome | null): boolean {
    if (!f) return false
    if (f.type === 'batiment') {
      const ignorer: Occupant | null = estPose(etat, f.id) ? { type: 'batiment', id: f.id } : null
      return empriseLibre(etat.village, empriseBatiment(f), ignorer)
    }
    if (f.sol === 'rail') return placePourUnRail(etat.village, f.x, f.y, f.de ?? null) === 'ok'
    const ignorer = f.de ? ({ type: f.sol, cle: cleCase(f.de.x, f.de.y) } as Occupant & { cle: string }) : null
    return empriseLibre(etat.village, { x: f.x, y: f.y, taille: 1 }, ignorer)
  }

  // Une place libre pour un nouvel élément, près du joueur (en tournant autour de lui).
  function placeProche(taille: number): Case {
    const depart = { x: Math.round(joueur.x - taille / 2), y: Math.round(joueur.y - taille - 1) }
    for (let rayon = 0; rayon < TAILLE_GRILLE; rayon++) {
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
    setMenuConstruction(false)
    setFantomeFixe(false)
    setFantome({ type: 'batiment', id, ...placeProche(BATIMENTS[id].taille), miroir: false })
  }

  function commencerPinceau(sol: TypeSol) {
    setMenuConstruction(false)
    setTraceRail(null)
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
    if (f.type === 'batiment') {
      const nouveau = !estPose(etat, f.id)
      const apres = jouer((e) => (estPose(e, f.id) ? deplacerBatiment(e, f.id, f.x, f.y, f.miroir) : construireBatiment(e, f.id, f.x, f.y, f.miroir)))
      if (nouveau && estPose(apres, f.id)) {
        sons.construction()
        grandMoment()
      }
    } else if (f.de) jouer((e) => deplacerSol(e, f.sol, f.de as Case, { x: f.x, y: f.y }))
    setFantome(null)
  }

  function retirerFantome() {
    const f = fantome
    if (!f) return
    if (f.type === 'sol' && f.de) jouer((e) => retirerSol(e, f.sol, (f.de as Case).x, (f.de as Case).y))
    setFantome(null)
  }

  function deplacerFantome(c: Case) {
    setFantome((f) => {
      if (!f) return f
      const taille = tailleFantome(f)
      const x = Math.max(0, Math.min(TAILLE_GRILLE - taille, c.x - Math.floor(taille / 2)))
      const y = Math.max(0, Math.min(TAILLE_GRILLE - taille, c.y - Math.floor(taille / 2)))
      return f.x === x && f.y === y ? f : { ...f, x, y }
    })
  }

  // En mode pinceau, une case touchée reçoit un pavé si elle est libre. Pour les rails, elle
  // devient le rail proposé : on le pose avec le bouton « Poser ce rail ».
  function peindre(c: Case) {
    if (pinceau === null) return
    if (pinceau === 'rail') {
      const dernier = traceRail?.poses.at(-1)
      const voisin = dernier && Math.abs(c.x - dernier.x) + Math.abs(c.y - dernier.y) === 1
      const sens = voisin ? { x: c.x - dernier.x, y: c.y - dernier.y } : sensDeDepart(etat.village, c)
      setTraceRail({ propose: c, sens, sensVoie: voisin && traceRail ? traceRail.sensVoie : sens, poses: voisin && traceRail ? traceRail.poses : [] })
      return
    }
    if (!peutPoserSol(etat, pinceau, c.x, c.y)) {
      const raison = raisonSolImpossible(etat, pinceau, c.x, c.y)
      if (raison) jouer(() => [raison])
      return
    }
    jouer((e) => poserSol(e, pinceau, c.x, c.y))
  }

  function poserRailPropose() {
    const tr = traceRail
    if (!tr) return
    const c = tr.propose
    if (!peutPoserSol(etat, 'rail', c.x, c.y)) {
      const raison = raisonSolImpossible(etat, 'rail', c.x, c.y)
      if (raison) jouer(() => [raison])
      return
    }
    const avant = trajetsAProposer(etat)
    const apres = jouer((e) => poserSol(e, 'rail', c.x, c.y))
    sons.rail()
    // Les rails relient deux bâtiments : on range les rails et on ouvre tout de suite la fenêtre
    // pour automatiser ce trajet.
    const nouveaux = trajetsAProposer(apres).filter((l) => !avant.includes(l))
    if (nouveaux.length > 0) {
      setPinceau(null)
      setTrajetsOuverts(nouveaux)
      return
    }
    setTraceRail({ propose: avancerCase(c, tr.sens), sens: tr.sens, sensVoie: tr.sens, poses: [...tr.poses, c] })
    suivreRail()
  }

  // (25/10) La caméra ne va chercher le rail proposé que quand il bouge à cause d'un bouton
  // (poser, tourner, demi-tour, retirer) : toucher la carte ne la déplace jamais.
  const [suiviRail, setSuiviRail] = useState(0)
  const suivreRail = () => setSuiviRail((n) => n + 1)

  function tournerRail(virage: Virage) {
    const tr = traceRail
    const dernier = tr?.poses.at(-1)
    if (!tr || !dernier) return
    const sens = tourner(tr.sensVoie, virage)
    setTraceRail({ ...tr, sens, propose: avancerCase(dernier, sens) })
    suivreRail()
  }

  // (25/10) La flèche « arrière » : la voie repart dans l'autre sens. Sans rail posé, la flèche se
  // retourne ; sinon, la voie continue de l'autre bout (le premier rail posé).
  function inverserRail() {
    const tr = traceRail
    if (!tr) return
    const inverse = (s: { x: number; y: number }) => ({ x: -s.x, y: -s.y })
    if (tr.poses.length === 0) {
      setTraceRail({ ...tr, sens: inverse(tr.sens), sensVoie: inverse(tr.sensVoie) })
    } else {
      const poses = [...tr.poses].reverse()
      const bout = poses[poses.length - 1]
      const avant = poses[poses.length - 2]
      const sensVoie = avant ? { x: bout.x - avant.x, y: bout.y - avant.y } : inverse(tr.sensVoie)
      setTraceRail({ propose: avancerCase(bout, sensVoie), sens: sensVoie, sensVoie, poses })
    }
    suivreRail()
  }

  function retirerDernierRail() {
    const tr = traceRail
    const dernier = tr?.poses.at(-1)
    if (!tr || !dernier) return
    jouer((e) => retirerSol(e, 'rail', dernier.x, dernier.y))
    const poses = tr.poses.slice(0, -1)
    const avantDernier = poses.at(-1)
    const sensVoie = avantDernier ? { x: dernier.x - avantDernier.x, y: dernier.y - avantDernier.y } : tr.sensVoie
    setTraceRail({ propose: dernier, sens: sensVoie, sensVoie, poses })
    suivreRail()
  }

  // --- Les bâtiments : on les touche, leur fenêtre s'ouvre tout de suite (25/10) ---------------
  const [batimentOuvert, setBatimentOuvert] = useState<IdBatiment | null>(null)
  const batimentActif = !edition && batimentOuvert && batimentPose(etat.village, batimentOuvert) ? batimentOuvert : null

  const ouvrirBatiment = useCallback(
    (id: IdBatiment) => {
      const b = batimentPose(etat.village, id)
      if (!b) return
      setBatimentOuvert(id)
      // Le personnage y va quand même (pour le plaisir de le voir marcher).
      if (!pousse) village.allerVers(caseAccesProche(etat.village, b, joueur))
    },
    [etat.village, village, joueur, pousse],
  )

  // Un bâtiment ouvert où quelque chose vient de se débloquer (recruteur, manager) : sa
  // notification « Nouveau » disparaît.
  const aDecouvrirIci = batimentActif ? decouvertesAMontrer(etat).filter((id) => DECOUVERTES[id].stand === batimentActif) : []
  const cleDecouvertes = aDecouvrirIci.join(',')
  useEffect(() => {
    if (cleDecouvertes) jouer((e) => marquerDecouvert(e, decouvertesAMontrer(e).filter((id) => cleDecouvertes.split(',').includes(id))))
  }, [cleDecouvertes, jouer])

  // Un toucher sur la carte du village.
  function toucherCarte(c: Case, cible: CibleVillage | null) {
    if (pinceau !== null) return
    if (fantome !== null) {
      deplacerFantome(c)
      setFantomeFixe(true)
      return
    }
    if (modifier) {
      setFantomeFixe(true)
      if (cible?.type === 'batiment') {
        const b = batimentPose(etat.village, cible.id)
        if (b) setFantome({ type: 'batiment', id: b.id, x: b.x, y: b.y, miroir: b.miroir })
      } else if (cible?.type === 'rail' || cible?.type === 'chemin') {
        setFantome({ type: 'sol', sol: cible.type, x: cible.x, y: cible.y, de: { x: cible.x, y: cible.y } })
      }
      return
    }
    if (cible?.type === 'rail') {
      setRailTouche({ x: cible.x, y: cible.y })
      setTrajetsOuverts(liaisonsSurLaCase(etat, cible.x, cible.y))
      return
    }
    // Un chemin juste à côté d'un bâtiment : on ouvre le bâtiment.
    const proche = cible?.type === 'chemin' ? batimentProcheDe(etat.village, c.x + 0.5, c.y + 0.5, MARGE_CLIC_BATIMENT) : null
    if (proche) ouvrirBatiment(proche)
    else if (cible?.type === 'batiment') ouvrirBatiment(cible.id)
    else if (!pousse) village.allerVers(c)
  }

  // Le tutoriel : dès que l'action de l'étape est faite, on passe à la suivante.
  const etapeTuto = etapeTutoriel(etat)
  const etapeTutoFaite = etapeTuto !== null && !avecBouton(etapeTuto) && etapeFaite(etat, etapeTuto)
  useEffect(() => {
    if (etapeTutoFaite) jouer(avancerTutoriel)
  }, [etapeTutoFaite, jouer])
  // (25/10) Au tutoriel, une fois le coffre vendu, la fenêtre de la mine se ferme (une fois) pour
  // que la flèche montre le menu Bâtiments (le Personnel à construire).
  const [tutoFerme, setTutoFerme] = useState<string | null>(null)
  if (etapeTuto === 'personnel' && tutoFerme !== 'personnel') {
    setTutoFerme('personnel')
    setBatimentOuvert(null)
  }

  // Pendant la partie, le navigateur ne zoome pas la page (seul le zoom de la carte marche).
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

  function ouvrirConstruction() {
    setModifier(false)
    annulerEdition()
    setBatimentOuvert(null)
    setFenetreHaut(null)
    fermerTrajets()
    setMenuConstruction(true)
    jouer(marquerBatimentsVus)
  }

  // Le rappel des flèches du clavier : il disparaît dès qu'on s'en est servi.
  const [flechesUtilisees, setFlechesUtilisees] = useState(false)

  // Le clavier. On le rebranche à chaque rendu : c'est simple et largement assez rapide.
  useEffect(() => {
    function toucheAppuyee(evenement: KeyboardEvent) {
      if (evenement.target instanceof HTMLInputElement) return
      const touche = evenement.key
      if (touche === 'Escape') {
        // (les fenêtres se ferment elles-mêmes avec Échap : ici, la construction en cours)
        annulerEdition()
        setModifier(false)
        return
      }
      if (pousse) return
      if (touche === ' ') {
        if (document.querySelector('.voile')) return
        evenement.preventDefault()
        if (!evenement.repeat) village.sauter()
        return
      }
      const direction = FLECHES[touche]
      if (!direction || menuConstruction) return
      evenement.preventDefault()
      if (!evenement.repeat) {
        setFlechesUtilisees(true)
        village.fleche(direction, true)
      }
    }
    function toucheRelachee(evenement: KeyboardEvent) {
      const direction = FLECHES[evenement.key]
      if (direction) village.fleche(direction, false)
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

  // --- Le cadeau du jour : il s'ouvre tout seul une fois, au retour, après le tutoriel ----------
  // (le jour est lu au début de la partie : passé minuit, il faut rouvrir le monde)
  const [aujourdhui] = useState(() => jourDe(new Date()))
  const cadeauDisponible = etatQuotidien(etat, aujourdhui).disponible
  const [cadeauPropose, setCadeauPropose] = useState(false)
  if (!cadeauPropose && cadeauDisponible && etapeTuto === null && !resumeAbsence) {
    setCadeauPropose(true)
    setFenetreHaut('quotidien')
  }

  // Une fenêtre est-elle ouverte ? (la fête du niveau attend, et CrazyGames sait qu'on est en pause)
  const fenetreOuverte = batimentActif !== null || fenetreHaut !== null || menuConstruction || trajetsOuverts !== null || resumeAbsence !== null || pubEnCours !== null
  useEffect(() => {
    if (fenetreOuverte) jeuEnPause()
    else jeuEnCours()
  }, [fenetreOuverte])
  useEffect(() => {
    if (feteNiveau) grandMoment()
  }, [feteNiveau])

  // --- La fenêtre du bâtiment ouvert ---
  let panneau = null
  if (batimentActif !== null) {
    const info = BATIMENTS[batimentActif]
    const surLePersonnel = batimentPose(etat.village, 'employes') ? () => ouvrirBatiment('employes') : undefined
    panneau = (
      <Fenetre
        titre={t(info.nom)}
        icone={info.emoji}
        couleur={COULEURS_BATIMENTS[batimentActif]}
        taille={batimentActif === 'puits' || batimentActif === 'employes' ? 'grande' : 'moyenne'}
        voile="clair"
        onFermer={() => setBatimentOuvert(null)}
        classe={`fenetre-batiment fenetre-${batimentActif}`}
      >
        <p className="description-batiment discret">{t(info.description)}</p>
        {batimentActif === 'puits' && <PanneauMine eclats={eclats} trouvailles={trouvailles} onCliquer={cliquer} onReglerTrajet={setTrajetsOuverts} onAllerAuPersonnel={surLePersonnel} />}
        {batimentActif === 'marche' && (
          <PanneauMarche
            etat={etat}
            jouer={jouer}
            onReglerTrajet={setTrajetsOuverts}
            onConstruireRails={() => {
              setBatimentOuvert(null)
              commencerPinceau('rail')
            }}
          />
        )}
        {batimentActif === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {batimentActif === 'foreuse' && <PanneauForeuse etat={etat} jouer={jouer} onReglerTrajet={setTrajetsOuverts} onAllerAuPersonnel={surLePersonnel} />}
        {batimentActif === 'generateur' && <PanneauGenerateur etat={etat} jouer={jouer} />}
        {batimentActif === 'employes' && <PanneauEmployes etat={etat} jouer={jouer} onApercuTrajet={setApercuTrajet} />}
      </Fenetre>
    )
  }

  // La barre de boutons du bas : au village (la mine, construire, modifier), ou pendant qu'on pose
  // quelque chose (valider, retourner, annuler).
  const coffreRempli = coffrePlein(etat)
  const remplissageCoffre = nbDansCoffre(etat) / Math.max(1, capaciteCoffre(etat))
  const nbNouveautes = new Set([...nouveautesBatiments(etat), ...batimentsConstructibles(etat)]).size
  const libre = fantomeLibre(fantome)
  let barre
  if (fantome !== null) {
    const nouveau = fantome.type === 'batiment' && !estPose(etat, fantome.id)
    const peutRetirer = fantome.type === 'sol' && fantome.de !== null
    barre = (
      <div className="barre-edition">
        {!fantomeFixe && <p className="consigne">👆 {t('Touche la carte pour placer, puis valide. Glisse pour déplacer la carte.')}</p>}
        <div className="rangee rangee-centre">
          <button className="btn btn-blanc" onClick={() => setFantome(null)}>
            ✖ {t('Annuler')}
          </button>
          {fantome.type !== 'sol' && (
            <button className="btn btn-blanc" onClick={() => setFantome({ ...fantome, miroir: !fantome.miroir })}>
              ↔ {t('Retourner')}
            </button>
          )}
          {peutRetirer && (
            <button className="btn btn-rose" onClick={retirerFantome}>
              🗑️ {t('Enlever')}
            </button>
          )}
          <button className="btn btn-vert" data-tuto="construire-ici" disabled={!libre} onClick={validerFantome}>
            ✔ {nouveau ? t('Construire ici') : t('Poser ici')}
          </button>
        </div>
      </div>
    )
  } else if (pinceau === 'rail') {
    const tr = traceRail
    const dernier = tr?.poses.at(-1)
    const okPropose = tr !== null && peutPoserSol(etat, 'rail', tr.propose.x, tr.propose.y)
    const raison = tr && !okPropose ? (raisonSolImpossible(etat, 'rail', tr.propose.x, tr.propose.y) ?? t('Case déjà prise : touche une autre case, ou tourne.')) : null
    const virage = tr && dernier ? virageEntre(tr.sensVoie, tr.sens) : null
    barre = (
      <div className="barre-edition">
        <p className="consigne">
          🛤️{' '}
          {!tr
            ? t('Touche le sol là où commence ta voie, juste à côté d’un bâtiment.')
            : !dernier
              ? t('Le rail doré montre où il sera posé. Touche une autre case pour le déplacer.')
              : t('Choisis où va le prochain rail avec les flèches, puis pose-le.')}{' '}
          ({t('{n} 🔩 fer le rail', { n: COUT_RAIL.materiaux.fer ?? 0 })})
          {raison && <span className="texte-alerte"> ⚠️ {raison}</span>}
        </p>
        <div className="rails-commandes">
          {/* (25/10) La croix des rails, comme une manette, avec des flèches toutes pareilles : en
              haut, tout droit ; à gauche et à droite, les virages ; en bas, demi-tour (la voie
              repart dans l'autre sens) ; au milieu, poser. La poubelle retire le dernier rail. */}
          {tr && (
            <div className="croix-rails">
              <button className={`btn croix-haut ${virage === 'droit' ? 'btn-jaune' : 'btn-blanc'}`} disabled={!dernier} onClick={() => tournerRail('droit')} aria-label={t('Tout droit')}>
                <FlecheCroix sorte="haut" />
              </button>
              <button className={`btn croix-gauche ${virage === 'gauche' ? 'btn-jaune' : 'btn-blanc'}`} disabled={!dernier} onClick={() => tournerRail('gauche')} aria-label={t('Gauche')}>
                <FlecheCroix sorte="gauche" />
              </button>
              <button className="btn btn-vert croix-centre" disabled={!okPropose} onClick={poserRailPropose} aria-label={t('Poser ce rail')}>
                ✔️
              </button>
              <button className={`btn croix-droite ${virage === 'droite' ? 'btn-jaune' : 'btn-blanc'}`} disabled={!dernier} onClick={() => tournerRail('droite')} aria-label={t('Droite')}>
                <FlecheCroix sorte="droite" />
              </button>
              <button className="btn btn-blanc croix-bas" onClick={inverserRail} aria-label={t('Demi-tour')}>
                <FlecheCroix sorte="demi-tour" />
              </button>
            </div>
          )}
          <div className="rails-cote">
            {tr && (
              <button className="btn btn-rose btn-petit" disabled={!dernier} onClick={retirerDernierRail} aria-label={t('Retirer le dernier')}>
                🗑️ {t('Retirer')}
              </button>
            )}
            <button className="btn btn-jaune btn-petit" onClick={() => setPinceau(null)}>
              ✔️ {t('Terminé')}
            </button>
          </div>
        </div>
      </div>
    )
  } else if (pinceau !== null) {
    barre = (
      <div className="barre-edition">
        <p className="consigne">🪨 {t('Touche le sol pour poser un chemin ({n} $ la case).', { n: COUT_CHEMIN.argent ?? 0 })}</p>
        <div className="rangee rangee-centre">
          <button className="btn btn-jaune" onClick={() => setPinceau(null)}>
            {t('Terminé')}
          </button>
        </div>
      </div>
    )
  } else if (modifier) {
    barre = (
      <div className="barre-edition">
        <p className="consigne">✏️ {t('Touche un bâtiment, un rail ou un chemin pour le déplacer.')}</p>
        <div className="rangee rangee-centre">
          <button className="btn btn-jaune" onClick={() => setModifier(false)}>
            {t('Terminé')}
          </button>
        </div>
      </div>
    )
  } else {
    barre = (
      // De gros boutons ronds posés sur la carte : la mine en bas à gauche, la construction en bas à droite.
      <div className="barre-village">
        <button
          className={`gros-rond gros-rond-mine ${coffreRempli ? 'btn-attention' : ''}`}
          style={{ ['--remplissage' as string]: `${Math.round(remplissageCoffre * 100)}%` }}
          onClick={() => ouvrirBatiment('puits')}
          data-tuto="mine"
          title={t('La mine · coffre {n} / {max}', { n: nbDansCoffre(etat), max: capaciteCoffre(etat) })}
        >
          <span className="gros-rond-icone" aria-hidden="true">
            ⛏️
          </span>
          <span className="gros-rond-texte">{t('Mine')}</span>
        </button>
        {!flechesUtilisees && (
          <p className="aide-clavier">
            <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> {t('pour marcher')}
          </p>
        )}
        <div className="barre-village-droite">
          <button className="gros-rond gros-rond-petit" onClick={() => setModifier(true)} title={t('Déplacer ou retourner ce qui est posé')}>
            <span className="gros-rond-icone" aria-hidden="true">
              ✏️
            </span>
            <span className="gros-rond-texte">{t('Modifier')}</span>
          </button>
          <button className={`gros-rond gros-rond-construire ${nbNouveautes > 0 ? 'btn-attention' : ''}`} data-tuto="batiments" onClick={() => ouvrirConstruction()} title={t('Construire des bâtiments et poser des rails')}>
            <span className="gros-rond-icone" aria-hidden="true">
              🏗️
            </span>
            <span className="gros-rond-texte">{t('Bâtiments')}</span>
            {nbNouveautes > 0 && <span className="pastille">{nbNouveautes}</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <ContexteJeuReact.Provider value={contexte}>
      <div className={`jeu ${edition ? 'en-edition' : ''}`}>
        {/* La scène prend tout l'écran : le village vu du ciel. */}
        <main className="scene">
          <VueVillage
            etat={etat}
            joueur={joueur}
            notifications={notificationsBatiments(etat)}
            batimentActif={batimentActif}
            fantome={fantome}
            fantomeLibre={libre}
            fantomeFixe={fantomeFixe}
            pinceau={pinceau !== null}
            typePinceau={pinceau}
            peutPeindre={(c) => pinceau !== null && peutPoserSol(etat, pinceau, c.x, c.y)}
            onTap={toucherCarte}
            onSurvol={(c) => {
              if (!fantomeFixe) deplacerFantome(c)
            }}
            onGlisser={deplacerFantome}
            onPeindre={peindre}
            trajetEnSurbrillance={batimentActif === 'employes' ? apercuTrajet : null}
            zonesRails={pinceau === 'rail' || (fantome?.type === 'sol' && fantome.sol === 'rail')}
            railPropose={traceRail ? { c: traceRail.propose, ok: peutPoserSol(etat, 'rail', traceRail.propose.x, traceRail.propose.y), depuis: traceRail.poses.at(-1) ?? null, sens: traceRail.sens, suivi: suiviRail } : null}
            onOuvrirTrajet={setTrajetsOuverts}
          />
          <Gains gains={gains} />
        </main>

        {/* Tout le reste est posé par-dessus la scène. */}
        <div className="interface">
          <div className="interface-haut">
            <Hud etat={etat} nbVentes={nbVentes} onOuvrirBilan={() => setFenetreHaut('bilan')} onOuvrirBoutique={() => setFenetreHaut('boutique')} />
            <div className="interface-haut-droite">
              <nav className="boutons-haut" aria-label={t('Menu du jeu')}>
                {etapeTuto === null && (
                  <button className={`btn btn-rond btn-jaune ${cadeauDisponible ? 'btn-attention' : ''}`} onClick={() => setFenetreHaut('quotidien')} title={t('Cadeau du jour')}>
                    🎁{cadeauDisponible && <span className="pastille">1</span>}
                  </button>
                )}
                <button className="btn btn-rond btn-blanc" onClick={() => setFenetreHaut('stats')} title={t('Statistiques')}>
                  📊
                </button>
                <button className="btn btn-rond btn-blanc" onClick={() => setFenetreHaut('succes')} title={t('Succès : {n} / {max}', { n: etat.succes.length, max: SUCCES.length })}>
                  🏅
                </button>
                <button className="btn btn-rond btn-blanc" onClick={() => setFenetreHaut('reglages')} title={t('Réglages')}>
                  ⚙️
                </button>
              </nav>
              {/* Pendant le tutoriel, la liste des tâches attend (elle arrive au « bravo »). */}
              {(etapeTuto === null || etapeTuto === 'bravo') && <Missions etat={etat} onAllerAuStand={ouvrirBatiment} onConstruire={ouvrirConstruction} />}
            </div>
          </div>

          <div className="interface-bas">{barre}</div>

          <Toasts toasts={toasts} />
        </div>

        {panneau}
        {menuConstruction && <MenuConstruction etat={etat} onFermer={() => setMenuConstruction(false)} onPoserBatiment={poserBatiment} onPinceau={commencerPinceau} />}
        {fenetreHaut === 'succes' && (
          <Fenetre titre={t('Succès')} icone="🏅" couleur="jaune" onFermer={() => setFenetreHaut(null)}>
            <PanneauSucces etat={etat} />
          </Fenetre>
        )}
        {fenetreHaut === 'stats' && <FenetreStatistiques etat={etat} onFermer={() => setFenetreHaut(null)} />}
        {fenetreHaut === 'bilan' && <FenetreBilan etat={etat} onFermer={() => setFenetreHaut(null)} />}
        {fenetreHaut === 'boutique' && <Boutique onFermer={() => setFenetreHaut(null)} />}
        {fenetreHaut === 'quotidien' && <RecompensesQuotidiennes onFermer={() => setFenetreHaut(null)} />}
        {fenetreHaut === 'aide' && <Aide onFermer={() => setFenetreHaut(null)} />}
        {fenetreHaut === 'reglages' && (
          <Reglages
            nomMonde={monde.nom}
            onFermer={() => setFenetreHaut(null)}
            onChangerDeMonde={onQuitter}
            onAide={() => setFenetreHaut('aide')}
            onLangue={onLangue}
            onRecommencer={() => {
              recommencer()
              terminerEdition()
              setFenetreHaut(null)
            }}
          />
        )}
        {etapeTuto !== null && (
          <Tutoriel
            etat={etat}
            ui={{ batimentOuvert: batimentActif, menuConstruction, posePrevue: fantome?.type === 'batiment' ? fantome.id : null, poseChoisie: fantomeFixe }}
            onSuivant={() => jouer(etapeSuivante)}
            onPasser={() => jouer(passerTutoriel)}
          />
        )}
        {trajetsOuverts && trajetsOuverts.length > 0 && (
          <FenetreTrajet etat={etat} liaisons={trajetsOuverts} onValider={validerTrajets} onFermer={fermerTrajets} actionsRail={railTouche ? { onDeplacer: deplacerRailTouche, onRetirer: retirerRailTouche } : null} />
        )}
        {trajetsOuverts && trajetsOuverts.length === 0 && railTouche && <FenetreRail onDeplacer={deplacerRailTouche} onRetirer={retirerRailTouche} onFermer={fermerTrajets} />}
        {resumeAbsence && <FenetreAbsence resume={resumeAbsence} onFermer={recupererAbsence} />}
        {feteNiveau && !fenetreOuverte && <FeteNiveau avant={feteNiveau.avant} niveau={feteNiveau.apres} prochain={prochainDeblocage(etat)} onFermer={() => setFeteNiveau(null)} />}
        {pubEnCours && (
          <Publicite
            onFinie={() => {
              const { quandFinie } = pubEnCours
              setPubEnCours(null)
              couperPourPub(false)
              quandFinie()
            }}
            onAnnulee={() => {
              setPubEnCours(null)
              couperPourPub(false)
            }}
          />
        )}
      </div>
    </ContexteJeuReact.Provider>
  )
}

// L'application : l'écran d'accueil (choix du monde et compte), puis le jeu.
function App() {
  const [monde, setMonde] = useState<InfoMonde | null>(null)
  // (25/10) Changer de langue redessine tout le jeu.
  const [, setLangue] = useState<Langue | null>(null)
  // Le compte reste ouvert pendant la partie : il recopie les mondes en ligne régulièrement.
  const compte = useCompte()
  // (la question « quels mondes garder ? » peut venir sur l'accueil ou pendant la partie)
  const question = compte.question && <FenetreQuelsMondes question={compte.question} />
  if (monde === null)
    return (
      <>
        <Accueil compte={compte} onJouer={setMonde} onLangue={setLangue} />
        {question}
      </>
    )

  function quitter() {
    compte.envoyerMaintenant() // la partie qu'on vient de jouer part tout de suite en ligne
    setMonde(null)
  }
  // « key » : changer de monde repart d'un jeu tout neuf (aucun état de l'ancien monde ne reste).
  return (
    <>
      <Jeu key={monde.id} monde={monde} onQuitter={quitter} onLangue={setLangue} />
      {question}
    </>
  )
}

export default App

// (25/10) Les flèches de la croix des rails : toutes dessinées pareil (même épaisseur, même
// couleur, contour d'encre), seule la forme change.
function FlecheCroix({ sorte }: { sorte: 'haut' | 'gauche' | 'droite' | 'demi-tour' }) {
  // Le trait de la flèche (dans un carré de 24 × 24), puis sa pointe.
  const formes = {
    haut: { trait: 'M12 20 V6', pointe: 'M6 11 L12 4 L18 11' },
    gauche: { trait: 'M17 20 V12 Q17 8 13 8 H6', pointe: 'M10 3 L5 8 L10 13' },
    droite: { trait: 'M7 20 V12 Q7 8 11 8 H18', pointe: 'M14 3 L19 8 L14 13' },
    'demi-tour': { trait: 'M12 4 V18', pointe: 'M6 13 L12 20 L18 13' },
  }[sorte]
  return (
    <svg className="fleche-croix" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <path d={formes.trait} fill="none" stroke="#2a2140" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={formes.pointe} fill="none" stroke="#2a2140" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={formes.trait} fill="none" stroke="#fdf6e3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d={formes.pointe} fill="none" stroke="#fdf6e3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
