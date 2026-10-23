// La page du jeu : elle assemble les composants, relie les boutons et le clavier aux actions.
//
// Tout se passe au village vu du ciel (22/10 : la mine ne se visite plus) : on s'y promène, on
// pose et on déplace ses bâtiments (menus Bâtiments et Modifier), et devant la mine
// on clique sur le bloc pour creuser (panneau de la mine).
//
// Clavier : les flèches pour marcher (on peut les combiner), Espace pour sauter, Échap pour
// annuler ce qu'on est en train de poser.

import { useCallback, useEffect, useState } from 'react'
import { basculerMusique, musiqueActive } from './ambiance'
import { basculerSon, sonActif, sons } from './sons'
import { Accueil } from './composants/Accueil'
import { Missions } from './composants/Missions'
import { Gains } from './composants/Gains'
import { Hud } from './composants/Hud'
import { FenetreStatistiques } from './composants/Statistiques'
import { MenuConstruction } from './composants/MenuConstruction'
import { PanneauEmployes } from './composants/PanneauEmployes'
import { PanneauMine } from './composants/PanneauMine'
import { PanneauBazar, PanneauForeuse, PanneauGenerateur, PanneauMarche, PanneauPioches, PanneauSucces } from './composants/Panneaux'
import { Toasts } from './composants/Toasts'
import { VueVillage } from './composants/VueVillage'
import { FenetreAbsence } from './composants/FenetreAbsence'
import { FeteNiveau } from './composants/FeteNiveau'
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
import { notificationsBatiments } from './jeu/notifications'
import type { InfoMonde } from './jeu/sauvegarde'
import { SUCCES } from './jeu/succes'
import {
  RAYON_BATIMENT,
  MARGE_CLIC_BATIMENT,
  batimentProcheDe,
  batimentPose,
  caseAccesProche,
  cleCase,
  distanceAuBatiment,
  empriseBatiment,
  empriseLibre,
  type Case,
  type Occupant,
} from './jeu/village'
import { capaciteCoffre, coffrePlein, nbDansCoffre, nbDansSac, peutPayer, sacPlein, valeurDe } from './jeu/mineur'
import { joueurPousse, liaisonsSurLaCase, reglerTrajet, trajetsAProposer, type ReglageTrajet } from './jeu/wagonnet'
import { useCompte } from './useCompte'
import { useJoueurVillage, type DirectionFleche } from './useJoueurVillage'
import { usePartie } from './usePartie'
import { nombreAbrege } from './nombres'

const FLECHES: Record<string, DirectionFleche> = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }

// Le jeu, dans le monde (la sauvegarde) choisi sur l'écran d'accueil.
function Jeu({ monde, onQuitter }: { monde: InfoMonde; onQuitter: () => void }) {
  const { etat, toasts, gains, eclats, trouvailles, nbVentes, jouer, cliquer, recommencer, resumeAbsence, recupererAbsence } = usePartie(monde.id)

  // (23/10) La fête du niveau : dès que le joueur passe un niveau, une grande fenêtre (FeteNiveau).
  // (on compare pendant le rendu, comme le conseille React)
  const niveauActuel = niveauJoueur(etat)
  const [niveauVu, setNiveauVu] = useState(niveauActuel)
  const [feteNiveau, setFeteNiveau] = useState<{ avant: number; apres: number } | null>(null)
  if (niveauActuel !== niveauVu) {
    setNiveauVu(niveauActuel)
    if (niveauActuel > niveauVu) setFeteNiveau((f) => ({ avant: f?.avant ?? niveauVu, apres: niveauActuel }))
  }
  const [succesOuverts, setSuccesOuverts] = useState(false)
  const [statsOuvertes, setStatsOuvertes] = useState(false)
  // Le petit menu ⚙️ (changer de monde, recommencer) et l'aide ❔ du village.
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [aideOuverte, setAideOuverte] = useState(false)
  // Le son et la musique se règlent dans le menu ⚙️.
  const [son, setSon] = useState(sonActif)
  const [musique, setMusique] = useState(musiqueActive)

  // Pendant que le joueur pousse le wagonnet, il fait l'aller-retour avec lui : il ne marche pas.
  const pousse = joueurPousse(etat)
  const village = useJoueurVillage(etat.village, true)
  const joueur = village.joueur

  // Le bruit des pas quand le joueur marche (un pas toutes les 0,34 s, comme son animation).
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
  // « fixe » (sans rien construire), puis le bouton « Construire ici » le pose. Sinon, en allant
  // vers le bouton, la souris emmenait le bâtiment avec elle.
  const [fantomeFixe, setFantomeFixe] = useState(false)
  const [pinceau, setPinceau] = useState<TypeSol | null>(null)
  // (23/10) Le tracé des rails, pas à pas : le rail proposé (doré), son sens, les rails posés.
  const [traceRailBrut, setTraceRail] = useState<TraceRail | null>(null)
  const traceRail = pinceau === 'rail' ? traceRailBrut : null
  const [modifier, setModifier] = useState(false)
  // Le trajet qu'on regarde en embauchant un pousseur (au Personnel) : il brille sur la carte.
  const [apercuTrajet, setApercuTrajet] = useState<IdLiaison | null>(null)
  const edition = fantome !== null || pinceau !== null || modifier
  // La fenêtre des trajets ouverte (27/10) : les trajets des rails qu'on a touchés.
  const [trajetsOuverts, setTrajetsOuvertsBrut] = useState<IdLiaison[] | null>(null)
  // Le rail touché (30/10) : sa fenêtre propose aussi de le déplacer ou de le retirer.
  const [railTouche, setRailTouche] = useState<Case | null>(null)
  // Ouvrir la fenêtre des trajets termine toujours la pose des rails (30/10 : sinon, en
  // revenant sur la carte, on avait encore un rail « dans la main » et un clic en posait un).
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

  // Les boutons du rail touché : le déplacer (comme un bâtiment), ou le retirer (remboursé).
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
      if (nouveau && estPose(apres, f.id)) sons.construction()
    }
    else if (f.de) jouer((e) => deplacerSol(e, f.sol, f.de as Case, { x: f.x, y: f.y }))
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
      const t = tailleFantome(f)
      const x = Math.max(0, Math.min(TAILLE_GRILLE - t, c.x - Math.floor(t / 2)))
      const y = Math.max(0, Math.min(TAILLE_GRILLE - t, c.y - Math.floor(t / 2)))
      return f.x === x && f.y === y ? f : { ...f, x, y }
    })
  }

  // En mode pinceau, une case touchée reçoit un pavé si elle est libre. (23/10) Pour les rails,
  // elle devient le rail proposé : on le pose avec le bouton « ✔ Poser ce rail ».
  function peindre(c: Case) {
    if (pinceau === null) return
    if (pinceau === 'rail') {
      const dernier = traceRail?.poses.at(-1)
      // Touchée juste à côté du dernier rail posé : la voie tourne vers elle.
      const voisin = dernier && Math.abs(c.x - dernier.x) + Math.abs(c.y - dernier.y) === 1
      const sens = voisin ? { x: c.x - dernier.x, y: c.y - dernier.y } : sensDeDepart(etat.village, c)
      setTraceRail({ propose: c, sens, sensVoie: voisin && traceRail ? traceRail.sensVoie : sens, poses: voisin && traceRail ? traceRail.poses : [] })
      return
    }
    if (!peutPoserSol(etat, pinceau, c.x, c.y)) {
      // (30/10) On dit pourquoi : plus de fer, une boucle... (et pas sur une case déjà prise)
      const raison = raisonSolImpossible(etat, pinceau, c.x, c.y)
      if (raison) jouer(() => [raison])
      return
    }
    jouer((e) => poserSol(e, pinceau, c.x, c.y))
  }


  // (23/10) Poser le rail proposé, puis proposer le suivant, dans le même sens.
  function poserRailPropose() {
    const t = traceRail
    if (!t) return
    const c = t.propose
    if (!peutPoserSol(etat, 'rail', c.x, c.y)) {
      const raison = raisonSolImpossible(etat, 'rail', c.x, c.y)
      if (raison) jouer(() => [raison])
      return
    }
    const avant = trajetsAProposer(etat)
    const apres = jouer((e) => poserSol(e, 'rail', c.x, c.y))
    sons.rail()
    // Les rails relient deux bâtiments : on range les rails et on ouvre tout de suite la fenêtre
    // pour automatiser ce trajet (30/10).
    const nouveaux = trajetsAProposer(apres).filter((l) => !avant.includes(l))
    if (nouveaux.length > 0) {
      setPinceau(null)
      setTrajetsOuverts(nouveaux)
      return
    }
    setTraceRail({ propose: avancerCase(c, t.sens), sens: t.sens, sensVoie: t.sens, poses: [...t.poses, c] })
  }

  // Les flèches : le rail proposé va tout droit, à gauche ou à droite après le dernier rail posé.
  function tournerRail(virage: Virage) {
    const t = traceRail
    const dernier = t?.poses.at(-1)
    if (!t || !dernier) return
    const sens = tourner(t.sensVoie, virage)
    setTraceRail({ ...t, sens, propose: avancerCase(dernier, sens) })
  }

  // « ↩ Retirer le dernier » : on reprend le dernier rail posé (remboursé), il redevient proposé.
  function retirerDernierRail() {
    const t = traceRail
    const dernier = t?.poses.at(-1)
    if (!t || !dernier) return
    jouer((e) => retirerSol(e, 'rail', dernier.x, dernier.y))
    const poses = t.poses.slice(0, -1)
    const avantDernier = poses.at(-1)
    const sensVoie = avantDernier ? { x: dernier.x - avantDernier.x, y: dernier.y - avantDernier.y } : t.sensVoie
    setTraceRail({ propose: dernier, sens: sensVoie, sensVoie, poses })
  }

  // --- Les bâtiments : on les touche, on marche jusqu'à eux, puis le panneau s'ouvre ---
  const [panneauFerme, setPanneauFerme] = useState(false)

  // Le bâtiment qu'on a touché pour y aller. Son panneau s'ouvre quand le joueur arrive à moins
  // de RAYON_BATIMENT cases de son bord. Seulement lui (27/10) : passer à côté d'un autre
  // bâtiment (en marchant, avec les flèches) n'ouvre plus rien.
  const [batimentVise, setBatimentVise] = useState<IdBatiment | null>(null)
  const vise = batimentVise ? batimentPose(etat.village, batimentVise) : null
  const batimentProche: IdBatiment | null = !pousse && vise && distanceAuBatiment(vise, joueur.x, joueur.y) < RAYON_BATIMENT ? vise.id : null
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

  // Arrivé devant un bâtiment où quelque chose vient de se débloquer (recruteur, manager) :
  // sa notification « Nouveau » disparaît.
  const aDecouvrirIci = batimentActif ? decouvertesAMontrer(etat).filter((id) => DECOUVERTES[id].stand === batimentActif) : []
  const cleDecouvertes = aDecouvrirIci.join(',')
  useEffect(() => {
    if (cleDecouvertes) jouer((e) => marquerDecouvert(e, decouvertesAMontrer(e).filter((id) => cleDecouvertes.split(',').includes(id))))
  }, [cleDecouvertes, jouer])

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
      } else if (cible?.type === 'rail' || cible?.type === 'chemin') {
        setFantome({ type: 'sol', sol: cible.type, x: cible.x, y: cible.y, de: { x: cible.x, y: cible.y } })
      }
      return
    }
    // Un rail touché (30/10) : sa fenêtre s'ouvre, avec les trajets qui y passent (s'il y en a)
    // et de quoi le déplacer ou le retirer (remboursé).
    if (cible?.type === 'rail') {
      setRailTouche({ x: cible.x, y: cible.y })
      setTrajetsOuverts(liaisonsSurLaCase(etat, cible.x, cible.y))
      return
    }
    // Il pousse le wagonnet : il ne peut pas aller ailleurs avant d'être revenu.
    if (pousse) return
    // (29/10) Un chemin juste à côté d'un bâtiment : on va au bâtiment, et son panneau s'ouvre.
    const proche = cible?.type === 'chemin' ? batimentProcheDe(etat.village, c.x + 0.5, c.y + 0.5, MARGE_CLIC_BATIMENT) : null
    if (proche) allerAuBatiment(proche)
    else if (cible?.type === 'batiment') allerAuBatiment(cible.id)
    else {
      setBatimentVise(null)
      village.allerVers(c)
    }
  }

  // (30/10) Au tutoriel, à l'étape du forgeron : dès qu'on a de quoi le payer, le panneau de la
  // mine se ferme tout seul (une fois), pour que la flèche montre le menu Bâtiments.
  const pretPourForgeron = etapeTutoriel(etat) === 'forgeron' && peutPayer(etat, BATIMENTS.forgeron.cout)
  const [pretAvant, setPretAvant] = useState(false)
  if (pretPourForgeron !== pretAvant) {
    setPretAvant(pretPourForgeron)
    if (pretPourForgeron) setPanneauFerme(true)
  }

  // Le tutoriel (27/10) : dès que l'action de l'étape est faite, on passe à la suivante.
  const etapeTuto = etapeTutoriel(etat)
  const etapeTutoFaite = etapeTuto !== null && !avecBouton(etapeTuto) && etapeFaite(etat, etapeTuto)
  useEffect(() => {
    if (etapeTutoFaite) jouer(avancerTutoriel)
  }, [etapeTutoFaite, jouer])

  // Le bouton « Mine » : on va devant la mine (son panneau s'ouvre, avec le bloc à cliquer).
  function allerALaMine() {
    if (pousse) return
    if (batimentProche === 'puits') setPanneauFerme(false)
    else allerAuBatiment('puits')
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

  function ouvrirConstruction() {
    setModifier(false)
    annulerEdition()
    // (23/10) Le menu Bâtiments ferme ce qui était ouvert : le panneau du bâtiment, l'aide, les
    // réglages, la fenêtre des trajets.
    setPanneauFerme(true)
    setAideOuverte(false)
    setReglagesOuverts(false)
    fermerTrajets()
    setMenuConstruction(true)
    jouer(marquerBatimentsVus)
  }

  // Le clavier. On le rebranche à chaque rendu : c'est simple et largement assez rapide.
  useEffect(() => {
    function toucheAppuyee(evenement: KeyboardEvent) {
      if (evenement.target instanceof HTMLInputElement) return
      const touche = evenement.key
      if (touche === 'Escape') {
        annulerEdition()
        setModifier(false)
        setMenuConstruction(false)
        return
      }
      if (pousse) return
      if (touche === ' ') {
        evenement.preventDefault()
        if (!evenement.repeat) village.sauter()
        return
      }
      const direction = FLECHES[touche]
      if (!direction || menuConstruction) return
      evenement.preventDefault()
      if (!evenement.repeat) {
        setBatimentVise(null)
        // Avec les flèches, il ne va plus vers le bâtiment touché : son panneau se ferme.
        setBatimentVise(null)
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

  function demanderRecommencer() {
    if (window.confirm(`Effacer la partie du monde « ${monde.nom} » et tout recommencer (village et succès compris) ?`)) {
      recommencer()
      terminerEdition()
    }
  }

  // --- Le panneau du bâtiment où l'on est ---

  let panneau = null
  if (batimentActif !== null) {
    const info = BATIMENTS[batimentActif]
    panneau = (
      <section className={`carte panneau panneau-batiment ${batimentActif === 'puits' ? 'panneau-mine' : ''}`}>
        <div className="entete-panneau">
          {/* (sa description passe en bulle d'aide sur le titre : la place est comptée, 27/10) */}
          <h2 className="titre-stand" title={info.description}>
            <span aria-hidden="true">{info.emoji}</span> {info.nom}
          </h2>
          <button className="bouton-fermer" onClick={() => setPanneauFerme(true)} aria-label="Fermer">
            ✖
          </button>
        </div>
        {batimentActif === 'puits' && (
          <PanneauMine
            etat={etat}
            jouer={jouer}
            eclats={eclats}
            trouvailles={trouvailles}
            onCliquer={cliquer}
            onReglerTrajet={setTrajetsOuverts}
            onAllerAuPersonnel={batimentPose(etat.village, 'employes') ? () => allerAuBatiment('employes') : undefined}
          />
        )}
        {batimentActif === 'marche' && <PanneauMarche etat={etat} jouer={jouer} />}
        {batimentActif === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {batimentActif === 'bazar' && <PanneauBazar etat={etat} jouer={jouer} />}
        {batimentActif === 'foreuse' && <PanneauForeuse etat={etat} jouer={jouer} onReglerTrajet={setTrajetsOuverts} />}
        {batimentActif === 'generateur' && <PanneauGenerateur etat={etat} jouer={jouer} />}
        {batimentActif === 'employes' && <PanneauEmployes etat={etat} jouer={jouer} onApercuTrajet={setApercuTrajet} />}
      </section>
    )
  } else if (aideOuverte) {
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
          Devant la <strong>mine</strong>, clique sur le bloc pour creuser : tout va dans le coffre de la mine. Mets-le dans ton sac et va le
          vendre au <strong>marché</strong>. Puis relie la mine au marché avec des <strong>rails</strong> et, au panneau de la mine, envoie un <strong>wagonnet</strong> : il fera les voyages pour toi.
        </p>
        <p className="discret">
          Le bouton <strong>Bâtiments</strong> en bas à droite sert à construire, <strong>Modifier</strong> à
          déplacer ou retourner ce qui est posé, et <strong>Mine</strong> (en bas à gauche) à aller creuser.
        </p>
      </section>
    )
  }

  // La barre de boutons du bas : au village (construire, modifier, la mine), ou pendant
  // qu'on pose quelque chose (valider, retourner, annuler).
  // La pastille du menu Bâtiments : les nouveautés pas encore vues, et ce qu'on peut construire tout de suite.
  const coffreRempli = coffrePlein(etat)
  const remplissageCoffre = nbDansCoffre(etat) / Math.max(1, capaciteCoffre(etat))
  const nbNouveautes = new Set([...nouveautesBatiments(etat), ...batimentsConstructibles(etat)]).size
  const libre = fantomeLibre(fantome)
  let barre
  if (fantome !== null) {
    const nouveau = fantome.type === 'batiment' && !estPose(etat, fantome.id)
    const peutRetirer = fantome.type === 'sol' && fantome.de !== null
    barre = (
      <div className="actions actions-edition">
        {!fantomeFixe && <p className="consigne-edition">👆 Clique (ou touche) la carte pour placer, puis valide. Glisse pour déplacer la carte.</p>}
        <button className="bouton bouton-vendre" data-tuto="construire-ici" disabled={!libre} onClick={validerFantome}>
          ✔ {nouveau ? 'Construire ici' : 'Poser ici'}
        </button>
        {fantome.type !== 'sol' && (
          <button className="bouton bouton-neutre" onClick={() => setFantome({ ...fantome, miroir: !fantome.miroir })}>
            ↔ Retourner
          </button>
        )}
        {peutRetirer && (
          <button className="bouton bouton-stop" onClick={retirerFantome} title="Enlever (remboursé)">
            🗑️ Enlever
          </button>
        )}
        <button className="bouton bouton-stop" onClick={() => setFantome(null)}>
          ✖ Annuler
        </button>
      </div>
    )
  } else if (pinceau === 'rail') {
    // (23/10) Les rails, pas à pas : toucher une case pour commencer, « ✔ Poser ce rail », puis
    // les flèches pour tourner. Glisser déplace la carte.
    const t = traceRail
    const dernier = t?.poses.at(-1)
    const okPropose = t !== null && peutPoserSol(etat, 'rail', t.propose.x, t.propose.y)
    const raison = t && !okPropose ? raisonSolImpossible(etat, 'rail', t.propose.x, t.propose.y) ?? 'Case déjà prise : touche une autre case, ou tourne.' : null
    const virage = t && dernier ? virageEntre(t.sensVoie, t.sens) : null
    barre = (
      <div className="actions actions-edition actions-rails">
        <p className="consigne-edition">
          {!t
            ? '🛤️ Touche le sol là où commence ta voie, juste à côté d’un bâtiment.'
            : !dernier
              ? '🛤️ Le rail doré montre où il sera posé. Touche une autre case pour le déplacer.'
              : '🛤️ Choisis où va le prochain rail avec les flèches, puis pose-le.'}{' '}
          ({COUT_RAIL.materiaux.fer} 🔩 fer le rail · glisse pour déplacer la carte)
          {raison && <span className="texte-alerte"> ⚠️ {raison}</span>}
        </p>
        {t && dernier && (
          <div className="fleches-rail" role="group" aria-label="Où va le prochain rail">
            <button className={`bouton bouton-neutre ${virage === 'gauche' ? 'fleche-active' : ''}`} onClick={() => tournerRail('gauche')} title="Le prochain rail tourne à gauche">
              ↰ Gauche
            </button>
            <button className={`bouton bouton-neutre ${virage === 'droit' ? 'fleche-active' : ''}`} onClick={() => tournerRail('droit')} title="Le prochain rail va tout droit">
              ⬆ Tout droit
            </button>
            <button className={`bouton bouton-neutre ${virage === 'droite' ? 'fleche-active' : ''}`} onClick={() => tournerRail('droite')} title="Le prochain rail tourne à droite">
              ↱ Droite
            </button>
          </div>
        )}
        {t && (
          <button className="bouton bouton-acheter" disabled={!okPropose} onClick={poserRailPropose}>
            ✔ Poser ce rail
          </button>
        )}
        {dernier && (
          <button className="bouton bouton-stop" onClick={retirerDernierRail} title="Reprendre le dernier rail posé (le fer est rendu)">
            ↩ Retirer le dernier
          </button>
        )}
        <button className="bouton bouton-vendre" onClick={() => setPinceau(null)}>
          ✔ Terminé
        </button>
      </div>
    )
  } else if (pinceau !== null) {
    // (les chemins : un toucher pose un pavé ; glisser déplace la carte)
    barre = (
      <div className="actions actions-edition">
        <p className="consigne-edition">
          🪨 Touche le sol pour poser un chemin (glisse pour déplacer la carte) ({COUT_CHEMIN.argent ? `${COUT_CHEMIN.argent} $` : `${COUT_CHEMIN.materiaux.fer} 🔩 fer`} la case).
        </p>
        <button className="bouton bouton-vendre" onClick={() => setPinceau(null)}>
          ✔ Terminé
        </button>
      </div>
    )
  } else if (modifier) {
    barre = (
      <div className="actions actions-edition">
        <p className="consigne-edition">✏️ Touche un bâtiment, un rail ou un chemin pour le déplacer.</p>
        <button className="bouton bouton-vendre" onClick={() => setModifier(false)}>
          ✔ Terminé
        </button>
      </div>
    )
  } else {
    barre = (
      // Comme dans Clash of Clans : de gros boutons ronds posés sur la carte, la mine en bas à
      // gauche, la construction en bas à droite.
      <div className="actions actions-village">
        <div className="groupe-boutons-ronds">
          {/* La mine : son anneau doré se remplit avec le coffre. */}
          <button
            className={`bouton bouton-rond bouton-rond-gros bouton-mine ${coffreRempli ? 'bouton-attention' : ''}`}
            style={{ ['--remplissage' as string]: `${Math.round(remplissageCoffre * 100)}%` }}
            onClick={allerALaMine}
            disabled={pousse}
            title={`Aller à la mine · coffre ${nbDansCoffre(etat)} / ${capaciteCoffre(etat)}`}
          >
            <span className="icone-rond" aria-hidden="true">⛏️</span>
            <span className="texte-rond">{pousse ? 'Wagonnet…' : 'Mine'}</span>
            {coffreRempli && <span className="badge-menu">!</span>}
          </button>
          {/* Le marché : seulement quand on a quelque chose à vendre dans son sac. */}
          {batimentPose(etat.village, 'marche') && nbDansSac(etat) > 0 && (
            <button
              className={`bouton bouton-rond bouton-marche-rapide ${sacPlein(etat) ? 'bouton-attention' : ''}`}
              onClick={() => !pousse && allerAuBatiment('marche')}
              disabled={pousse}
              title={`Aller vendre au marché · ${valeurDe(etat.inventaire).toLocaleString('fr-FR')} $ dans ton sac`}
            >
              <span className="icone-rond" aria-hidden="true">💰</span>
              <span className="texte-rond">Vendre</span>
              <span className="badge-menu badge-vert">{nombreAbrege(valeurDe(etat.inventaire))} $</span>
            </button>
          )}
        </div>
        <div className="groupe-boutons-ronds">
          <button className="bouton bouton-rond bouton-petit-rond bouton-neutre" onClick={() => setModifier(true)} title="Déplacer ou retourner ce qui est posé">
            <span className="icone-rond" aria-hidden="true">✏️</span>
            <span className="texte-rond">Modifier</span>
          </button>
          <button
            className={`bouton bouton-rond bouton-construire bouton-rond-gros ${nbNouveautes > 0 ? 'bouton-attention' : ''}`}
            data-tuto="batiments"
            onClick={() => ouvrirConstruction()}
            title="Construire des bâtiments et poser des rails"
          >
            <span className="icone-rond" aria-hidden="true">🏗️</span>
            <span className="texte-rond">Bâtiments</span>
            {nbNouveautes > 0 && <span className="badge-menu">{nbNouveautes}</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`jeu plein-ecran mode-village ${etat.employes.length > 0 ? 'avec-mineurs' : ''} ${panneau ? 'avec-panneau' : ''} ${batimentActif && PANNEAUX_LARGES.includes(batimentActif) ? 'panneau-large' : ''}`}>
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
          railPropose={traceRail ? { c: traceRail.propose, ok: peutPoserSol(etat, 'rail', traceRail.propose.x, traceRail.propose.y) } : null}
          onOuvrirTrajet={setTrajetsOuverts}
        />
        <Gains gains={gains} />
      </main>

      {/* Tout le reste est posé par-dessus la scène, comme dans Clash of Clans. */}
      <div className="interface">
        {/* En haut à gauche (27/10) : la barre (argent, coffre, pioche, sac, mineurs), et dessous
            les petits boutons (stats, succès, aide, réglages). */}
        <div className="interface-haut">
          <Hud etat={etat} nbVentes={nbVentes} />
          <nav className="boutons-coin" aria-label="Menu du jeu">
            <button className="bouton-coin" onClick={() => setStatsOuvertes(true)} title="Statistiques">
              <span aria-hidden="true">📊</span>
            </button>
            <button className="bouton-coin" onClick={() => setSuccesOuverts(true)} title={`Succès : ${etat.succes.length} / ${SUCCES.length}`}>
              <span aria-hidden="true">🏅</span>
              <span className="compteur-coin">{etat.succes.length}</span>
            </button>
            <button className={`bouton-coin ${aideOuverte ? 'actif' : ''}`} onClick={() => setAideOuverte(!aideOuverte)} title="Aide">
              <span aria-hidden="true">❔</span>
            </button>
            <button className={`bouton-coin ${reglagesOuverts ? 'actif' : ''}`} onClick={() => setReglagesOuverts(!reglagesOuverts)} title="Réglages">
              <span aria-hidden="true">⚙️</span>
            </button>
            {reglagesOuverts && (
              <div className="menu-reglages carte">
                <strong className="menu-reglages-titre">🌍 {monde.nom}</strong>
                <button className="bouton bouton-petit bouton-neutre" onClick={onQuitter}>
                  🌍 Changer de monde
                </button>
                <button className="bouton bouton-petit bouton-neutre" onClick={() => setSon(basculerSon())}>
                  {son ? '🔊 Son : oui' : '🔇 Son : non'}
                </button>
                <button className="bouton bouton-petit bouton-neutre" onClick={() => setMusique(basculerMusique())}>
                  {musique ? '🎵 Musique : oui' : '🎵 Musique : non'}
                </button>
                {/* Avec confirmation : il efface la partie de ce monde. */}
                <button className="bouton bouton-petit bouton-stop" onClick={demanderRecommencer}>
                  🔄 Recommencer à zéro
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* En haut à droite : les missions, et dessous le panneau du bâtiment ouvert. */}
        <div className="colonne-droite">
          {/* Pendant le tutoriel, la liste des tâches attend (elle arrive au « bravo »). */}
          {(etapeTuto === null || etapeTuto === 'bravo') && (
            <Missions etat={etat} onAllerAuStand={(id) => allerAuBatiment(id)} onConstruire={() => ouvrirConstruction()} compact={panneau !== null} />
          )}
          {panneau && <div className="panneau-flottant">{panneau}</div>}
        </div>

        <div className="interface-bas">
          {barre}
          {/* Un petit rappel : on se déplace avec les flèches du clavier. */}
          <p className="aide-clavier">
            <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> pour marcher · <kbd>Espace</kbd> pour sauter
          </p>
        </div>

        <Toasts toasts={toasts} />
      </div>

      {menuConstruction && (
        <MenuConstruction
          etat={etat}
          onFermer={() => setMenuConstruction(false)}
          onPoserBatiment={poserBatiment}
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
      {etapeTuto !== null && (
        <Tutoriel
          etat={etat}
          ui={{ batimentOuvert: batimentActif, menuConstruction, posePrevue: fantome?.type === 'batiment' ? fantome.id : null, poseChoisie: fantomeFixe }}
          onSuivant={() => jouer(etapeSuivante)}
          onPasser={() => jouer(passerTutoriel)}
        />
      )}
      {trajetsOuverts && trajetsOuverts.length > 0 && (
        <FenetreTrajet
          etat={etat}
          liaisons={trajetsOuverts}
          onValider={validerTrajets}
          onFermer={fermerTrajets}
          actionsRail={railTouche ? { onDeplacer: deplacerRailTouche, onRetirer: retirerRailTouche } : null}
        />
      )}
      {trajetsOuverts && trajetsOuverts.length === 0 && railTouche && <FenetreRail onDeplacer={deplacerRailTouche} onRetirer={retirerRailTouche} onFermer={fermerTrajets} />}
      {statsOuvertes && <FenetreStatistiques etat={etat} onFermer={() => setStatsOuvertes(false)} />}
      {resumeAbsence && <FenetreAbsence resume={resumeAbsence} onRecuperer={recupererAbsence} />}
      {feteNiveau && !resumeAbsence && (
        <FeteNiveau avant={feteNiveau.avant} niveau={feteNiveau.apres} prochain={prochainDeblocage(etat)} onFermer={() => setFeteNiveau(null)} />
      )}
    </div>
  )
}

// Les bâtiments aux nombreuses options : leur panneau est plus large sur grand écran (30/10).
const PANNEAUX_LARGES: IdBatiment[] = ['puits', 'employes', 'foreuse', 'generateur']

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

