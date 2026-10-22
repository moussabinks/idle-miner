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
import { FenetreTrajet } from './composants/FenetreTrajet'
import { Tutoriel } from './composants/Tutoriel'
import { avancerTutoriel, avecBouton, etapeFaite, etapeSuivante, etapeTutoriel, passerTutoriel } from './jeu/tutoriel'
import { tailleFantome, type CibleVillage, type Fantome } from './composants/fantome'
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
  batimentPose,
  caseAccesProche,
  cleCase,
  distanceAuBatiment,
  empriseBatiment,
  empriseLibre,
  type Case,
  type Occupant,
} from './jeu/village'
import { capaciteCoffre, coffrePlein, nbDansCoffre, nbDansSac, sacPlein, valeurDe } from './jeu/mineur'
import { joueurPousse, liaisonsSurLaCase, reglerTrajet, type ReglageTrajet } from './jeu/wagonnet'
import { useCompte } from './useCompte'
import { useJoueurVillage, type DirectionFleche } from './useJoueurVillage'
import { usePartie } from './usePartie'
import { nombreAbrege } from './nombres'

const FLECHES: Record<string, DirectionFleche> = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }

// Le jeu, dans le monde (la sauvegarde) choisi sur l'écran d'accueil.
function Jeu({ monde, onQuitter }: { monde: InfoMonde; onQuitter: () => void }) {
  const { etat, toasts, gains, eclats, trouvailles, nbVentes, jouer, cliquer, recommencer } = usePartie(monde.id)
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
  const [modifier, setModifier] = useState(false)
  // Le trajet qu'on regarde en embauchant un pousseur (au Personnel) : il brille sur la carte.
  const [apercuTrajet, setApercuTrajet] = useState<IdLiaison | null>(null)
  const edition = fantome !== null || pinceau !== null || modifier
  // La fenêtre des trajets ouverte (27/10) : les trajets des rails qu'on a touchés.
  const [trajetsOuverts, setTrajetsOuverts] = useState<IdLiaison[] | null>(null)
  const fermerTrajets = useCallback(() => setTrajetsOuverts(null), [])

  function validerTrajets(reglages: Partial<Record<IdLiaison, ReglageTrajet>>) {
    jouer((e) => Object.entries(reglages).flatMap(([liaison, reglage]) => reglerTrajet(e, liaison as IdLiaison, reglage as ReglageTrajet)))
    setTrajetsOuverts(null)
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

  // En mode pinceau, chaque case touchée reçoit un rail (ou un pavé) si elle est libre.
  function peindre(c: Case) {
    if (pinceau === null) return
    if (!peutPoserSol(etat, pinceau, c.x, c.y)) return
    jouer((e) => poserSol(e, pinceau, c.x, c.y))
    if (pinceau === 'rail') sons.rail()
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
    // Des rails qui relient des bâtiments : on ouvre la fenêtre de leurs trajets (27/10).
    if (cible?.type === 'rail') {
      const liaisons = liaisonsSurLaCase(etat, cible.x, cible.y)
      if (liaisons.length > 0) {
        setTrajetsOuverts(liaisons)
        return
      }
    }
    // Il pousse le wagonnet : il ne peut pas aller ailleurs avant d'être revenu.
    if (pousse) return
    if (cible?.type === 'batiment') allerAuBatiment(cible.id)
    else {
      setBatimentVise(null)
      village.allerVers(c)
    }
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
        {batimentActif === 'puits' && <PanneauMine etat={etat} jouer={jouer} eclats={eclats} trouvailles={trouvailles} onCliquer={cliquer} />}
        {batimentActif === 'marche' && <PanneauMarche etat={etat} jouer={jouer} />}
        {batimentActif === 'forgeron' && <PanneauPioches etat={etat} jouer={jouer} />}
        {batimentActif === 'bazar' && <PanneauBazar etat={etat} jouer={jouer} />}
        {batimentActif === 'foreuse' && <PanneauForeuse etat={etat} jouer={jouer} />}
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
        {!fantomeFixe && <p className="consigne-edition">👆 Clique (ou touche) la carte pour placer, puis valide.</p>}
        <button className="bouton bouton-vendre" data-tuto="construire-ici" disabled={!libre} onClick={validerFantome}>
          ✔ {nouveau ? 'Construire ici' : 'Poser ici'}
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
  } else if (pinceau !== null) {
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
    <div className={`jeu plein-ecran mode-village ${etat.employes.length > 0 ? 'avec-mineurs' : ''} ${panneau ? 'avec-panneau' : ''}`}>
      {/* La scène prend tout l'écran : le village vu du ciel. */}
      <main className="scene">
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
          trajetEnSurbrillance={batimentActif === 'employes' ? apercuTrajet : null}
          zonesRails={pinceau === 'rail' || (fantome?.type === 'sol' && fantome.sol === 'rail')}
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
          ui={{ batimentOuvert: batimentActif, menuConstruction, posePrevue: fantome?.type === 'batiment' ? fantome.id : null }}
          onSuivant={() => jouer(etapeSuivante)}
          onPasser={() => jouer(passerTutoriel)}
        />
      )}
      {trajetsOuverts && <FenetreTrajet etat={etat} liaisons={trajetsOuverts} onValider={validerTrajets} onFermer={fermerTrajets} />}
      {statsOuvertes && <FenetreStatistiques etat={etat} onFermer={() => setStatsOuvertes(false)} />}
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

