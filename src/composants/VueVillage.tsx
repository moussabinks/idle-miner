// Le village vu du ciel (vue isométrique, comme Clash of Clans) : le décor de la clairière, la
// mine au milieu, et tout ce que le joueur a posé (bâtiments, rails, chemins, décorations).
// On y voit le joueur, les mineurs employés qui vont au marché ou à la forge, le manager et le
// recruteur devant le Personnel, les wagonnets, et des bulles de notification au-dessus des
// bâtiments.
// La caméra : on fait glisser la carte avec la souris ou le doigt, on zoome avec la molette ou en
// pinçant. Elle suit le joueur quand il marche.

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { BATIMENTS, DECORATIONS, PIOCHES, RARETES, VITESSE_MARCHE, profondeurBedrock, type IdBatiment } from '../jeu/donnees'
import { foreuseEnMarche } from '../jeu/foreuse'
import { ascenseurEnMouvement, estCassee, piocheEquipee, type EtatJeu, type Employe } from '../jeu/mineur'
import type { Notification } from '../jeu/notifications'
import {
  batimentPose,
  cheminEntre,
  lireCle,
  longueurChemin,
  occupation,
  raccordsRail,
  railsMineMarche,
  type Case,
} from '../jeu/village'
import type { EtatJoueurVillage } from '../useJoueurVillage'
import { tailleFantome, type CibleVillage, type Fantome } from './fantome'
import {
  BoiteSvg,
  CaseChemin,
  CaseRail,
  DessinDecoration,
  DessinMine,
  DessinWagonnet,
  LosangeEmprise,
} from './DessinsVillage'
import { ImageBatiment, Perso } from './ElementsVillage'
import { Hamster } from './Hamster'
import {
  HAUTEUR_MONDE,
  devant,
  hauteurDecoration,
  LARGEUR_MONDE,
  losange,
  orienter,
  profondeur,
  surLeChemin,
  versEcran,
  versGrille,
  type Point,
} from './iso'

type Props = {
  etat: EtatJeu
  joueur: EtatJoueurVillage
  notifications: Partial<Record<IdBatiment, Notification[]>>
  batimentActif: IdBatiment | null
  edition: boolean // on montre la grille (poser, déplacer, peindre des rails...)
  fantome: Fantome | null
  fantomeLibre: boolean
  pinceau: boolean // on peint des rails ou des chemins : chaque case touchée en reçoit un
  onTap: (c: Case, cible: CibleVillage | null) => void
  onSurvol: (c: Case) => void // la souris passe sur une case (pour le fantôme)
  onPeindre: (c: Case) => void // le doigt glisse sur une case en mode pinceau
  transition: 'entree' | 'sortie' | null
  onTransitionFinie: () => void
}

type Camera = { z: number; cx: number; cy: number; douce: boolean }

const ZOOM_MAX = 2.6
const ZOOM_ENTREE = 3.2

export function VueVillage({
  etat,
  joueur,
  notifications,
  batimentActif,
  edition,
  fantome,
  fantomeLibre,
  pinceau,
  onTap,
  onSurvol,
  onPeindre,
  transition,
  onTransitionFinie,
}: Props) {
  const conteneurRef = useRef<HTMLDivElement>(null)
  const [taille, setTaille] = useState({ l: 800, h: 600 })
  const village = etat.village
  const mine = batimentPose(village, 'puits')
  const centreMine = mine ? versEcran(mine.x + 5, mine.y + 5) : { x: LARGEUR_MONDE / 2, y: HAUTEUR_MONDE / 2 }

  // --- La caméra --------------------------------------------------------------
  // Elle suit le joueur, sauf si on a fait glisser la carte à la main (« libre ») : elle le suit
  // de nouveau dès qu'il se remet à marcher. Le zoom est gardé à part (null : le zoom de départ).

  useLayoutEffect(() => {
    const conteneur = conteneurRef.current
    if (!conteneur) return
    const mesurer = () => setTaille({ l: conteneur.clientWidth, h: conteneur.clientHeight })
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(conteneur)
    return () => observateur.disconnect()
  }, [])

  const zoomMin = Math.max(taille.l / LARGEUR_MONDE, taille.h / HAUTEUR_MONDE)
  const zoomConfort = Math.min(ZOOM_MAX, Math.max(zoomMin, taille.l / 760))
  const [zoom, setZoom] = useState<number | null>(null)
  const [libre, setLibre] = useState<{ cx: number; cy: number } | null>(null)

  // Le joueur se remet à marcher : la caméra le suit de nouveau.
  const [marchait, setMarchait] = useState(joueur.marche)
  if (marchait !== joueur.marche) {
    setMarchait(joueur.marche)
    if (joueur.marche && libre !== null) setLibre(null)
  }

  // On garde la carte dans l'écran (pas de vide sur les bords).
  const borner = useCallback(
    (c: { z: number; cx: number; cy: number }): Camera => {
      const z = Math.min(ZOOM_MAX, Math.max(zoomMin, c.z))
      const demiL = taille.l / 2 / z
      const demiH = taille.h / 2 / z
      const cx = demiL * 2 >= LARGEUR_MONDE ? LARGEUR_MONDE / 2 : Math.min(LARGEUR_MONDE - demiL, Math.max(demiL, c.cx))
      const cy = demiH * 2 >= HAUTEUR_MONDE ? HAUTEUR_MONDE / 2 : Math.min(HAUTEUR_MONDE - demiH, Math.max(demiH, c.cy))
      return { z, cx, cy, douce: false }
    },
    [taille, zoomMin],
  )

  // L'entrée dans la mine : on plonge vers le trou et l'écran devient noir. La sortie : l'inverse.
  // « phase » passe de « début » à « fin » juste après l'affichage, pour que l'animation se joue.
  const [phase, setPhase] = useState<'debut' | 'fin'>('debut')
  const [derniereTransition, setDerniereTransition] = useState(transition)
  if (derniereTransition !== transition) {
    setDerniereTransition(transition)
    setPhase('debut')
  }
  const quandFini = useRef(onTransitionFinie)
  useLayoutEffect(() => {
    quandFini.current = onTransitionFinie
  }, [onTransitionFinie])
  useEffect(() => {
    if (transition === null) return
    const image = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('fin')))
    const minuteur = window.setTimeout(() => quandFini.current(), transition === 'entree' ? 750 : 820)
    return () => {
      cancelAnimationFrame(image)
      clearTimeout(minuteur)
    }
  }, [transition])

  const ecranJoueur = versEcran(joueur.x, joueur.y)
  const normale = borner({ z: zoom ?? zoomConfort, ...(libre ?? { cx: ecranJoueur.x, cy: ecranJoueur.y - 20 }) })
  const plongee: Camera = { z: ZOOM_ENTREE, cx: centreMine.x, cy: centreMine.y + 10, douce: true }
  let camera: Camera = { ...normale, douce: libre === null }
  if (transition === 'entree' && phase === 'fin') camera = plongee
  if (transition === 'sortie') camera = phase === 'fin' ? { ...normale, douce: true } : { ...plongee, douce: false }
  const cameraRef = useRef(camera)
  useLayoutEffect(() => {
    cameraRef.current = camera
  })

  // --- Souris, doigts, molette ------------------------------------------------

  const pointeurs = useRef(new Map<number, { x: number; y: number }>())
  const geste = useRef<{ mode: 'tap' | 'carte' | 'fantome' | 'pinceau'; depart: { x: number; y: number }; temps: number; camera: Camera; deplace: boolean } | null>(null)
  const pincement = useRef<{ distance: number; z: number } | null>(null)

  // Un point de l'écran (dans la vue) → un point du monde.
  const versMonde = useCallback(
    (sx: number, sy: number): Point => {
      const c = cameraRef.current
      const rect = conteneurRef.current?.getBoundingClientRect()
      const ox = rect ? sx - rect.left : sx
      const oy = rect ? sy - rect.top : sy
      return { x: (ox - taille.l / 2) / c.z + c.cx, y: (oy - taille.h / 2) / c.z + c.cy }
    },
    [taille],
  )

  const caseSous = useCallback(
    (sx: number, sy: number): Case => {
      const m = versMonde(sx, sy)
      const g = versGrille(m.x, m.y)
      return { x: Math.floor(g.x), y: Math.floor(g.y) }
    },
    [versMonde],
  )

  function dansLeFantome(c: Case): boolean {
    if (!fantome) return false
    const t = tailleFantome(fantome)
    return c.x >= fantome.x && c.y >= fantome.y && c.x < fantome.x + t && c.y < fantome.y + t
  }

  function pointerDown(e: React.PointerEvent) {
    if (transition !== null) return
    conteneurRef.current?.setPointerCapture(e.pointerId)
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()]
      pincement.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), z: cameraRef.current.z }
      geste.current = null
      return
    }
    const c = caseSous(e.clientX, e.clientY)
    const mode = pinceau ? 'pinceau' : fantome && dansLeFantome(c) ? 'fantome' : 'tap'
    geste.current = { mode, depart: { x: e.clientX, y: e.clientY }, temps: performance.now(), camera: cameraRef.current, deplace: false }
    if (mode === 'pinceau') onPeindre(c)
  }

  function pointerMove(e: React.PointerEvent) {
    if (!pointeurs.current.has(e.pointerId)) {
      // La souris passe au-dessus de la carte (sans clic) : le fantôme la suit.
      if (fantome && e.pointerType === 'mouse' && !pinceau) onSurvol(caseSous(e.clientX, e.clientY))
      return
    }
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pincement.current && pointeurs.current.size >= 2) {
      const [a, b] = [...pointeurs.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const depart = pincement.current
      setZoom(borner({ ...cameraRef.current, z: depart.z * (distance / depart.distance) }).z)
      return
    }
    const g = geste.current
    if (!g) return
    const dx = e.clientX - g.depart.x
    const dy = e.clientY - g.depart.y
    if (!g.deplace && Math.hypot(dx, dy) > 7) g.deplace = true
    if (!g.deplace) return
    if (g.mode === 'fantome') onSurvol(caseSous(e.clientX, e.clientY))
    else if (g.mode === 'pinceau') onPeindre(caseSous(e.clientX, e.clientY))
    else {
      g.mode = 'carte'
      const c = borner({ ...g.camera, cx: g.camera.cx - dx / g.camera.z, cy: g.camera.cy - dy / g.camera.z })
      setLibre({ cx: c.cx, cy: c.cy })
    }
  }

  function pointerUp(e: React.PointerEvent) {
    pointeurs.current.delete(e.pointerId)
    if (pointeurs.current.size < 2) pincement.current = null
    const g = geste.current
    geste.current = null
    if (!g || g.deplace || g.mode === 'pinceau') return
    if (performance.now() - g.temps > 600) return
    // Un simple toucher : on regarde ce qu'il y a dessous (une image de bâtiment, ou la case).
    const element = (e.target as HTMLElement).closest('[data-cible]')
    const c = caseSous(e.clientX, e.clientY)
    let cible: CibleVillage | null = null
    const donnee = element?.getAttribute('data-cible')
    if (donnee?.startsWith('batiment:')) cible = { type: 'batiment', id: donnee.slice(9) as IdBatiment }
    if (cible === null) {
      const occupant = occupation(village).get(`${c.x},${c.y}`)
      if (occupant?.type === 'batiment') cible = { type: 'batiment', id: occupant.id }
      else if (occupant?.type === 'decoration') cible = { type: 'decoration', n: occupant.n }
      else if (occupant?.type === 'rail') cible = { type: 'rail', x: c.x, y: c.y }
      else if (occupant?.type === 'chemin') cible = { type: 'chemin', x: c.x, y: c.y }
    }
    onTap(c, cible)
  }

  function molette(e: React.WheelEvent) {
    if (transition !== null) return
    const m = versMonde(e.clientX, e.clientY)
    const c = cameraRef.current
    const z = Math.min(ZOOM_MAX, Math.max(zoomMin, c.z * Math.exp(-e.deltaY * 0.0015)))
    // On zoome autour du point sous la souris.
    const nouvelle = borner({ z, cx: m.x - (m.x - c.cx) * (c.z / z), cy: m.y - (m.y - c.cy) * (c.z / z) })
    setZoom(nouvelle.z)
    setLibre({ cx: nouvelle.cx, cy: nouvelle.cy })
  }

  // --- Ce qu'on dessine ------------------------------------------------------

  const objets: ReactNode[] = []
  const editionOuFantome = edition || fantome !== null

  // Les bâtiments (celui qu'on déplace est remplacé par son fantôme).
  for (const b of village.batiments) {
    if (fantome?.type === 'batiment' && fantome.id === b.id) continue
    const actif = b.id === batimentActif
    if (b.id === 'puits') {
      objets.push(
        <BoiteSvg key="puits" x={b.x} y={b.y} taille={10} hauteur={140} classe={`sprite-mine ${actif ? 'sprite-actif' : ''}`} style={{ zIndex: profondeur(b.x + 5, b.y + 5) }}>
          <g data-cible="batiment:puits">
            <DessinMine
              x={b.x}
              y={b.y}
              miroir={b.miroir}
              fraction={Math.min(1, etat.profondeur / profondeurBedrock(etat.prestige))}
              ascenseur={etat.ascenseur.niveau}
              cabineEnHaut={etat.ascenseur.position === 0}
              enMouvement={ascenseurEnMouvement(etat) || etat.employes.some((m) => m.etape === 'monte' || m.etape === 'descend')}
              nbMineurs={etat.employes.length}
            />
          </g>
        </BoiteSvg>,
      )
      continue
    }
    const classes = [actif ? 'sprite-actif' : '', b.id === 'foreuse' && foreuseEnMarche(etat) ? 'sprite-vibre' : ''].join(' ')
    objets.push(<ImageBatiment key={b.id} id={b.id} x={b.x} y={b.y} miroir={b.miroir} classe={classes} />)
  }

  // Les décorations.
  for (const d of village.decorations) {
    if (fantome?.type === 'decoration' && fantome.n === d.n) continue
    const t = DECORATIONS[d.id].taille
    objets.push(
      <BoiteSvg key={`d${d.n}`} x={d.x} y={d.y} taille={t} hauteur={hauteurDecoration(d.id)} classe="sprite-deco" style={{ zIndex: profondeur(d.x + t / 2, d.y + t / 2) }}>
        <DessinDecoration id={d.id} x={d.x} y={d.y} taille={t} miroir={d.miroir} />
      </BoiteSvg>,
    )
  }

  // Le fantôme de ce qu'on place.
  if (fantome?.type === 'batiment') {
    if (fantome.id === 'puits') {
      objets.push(
        <BoiteSvg key="fantome" x={fantome.x} y={fantome.y} taille={10} hauteur={140} classe={`fantome ${fantomeLibre ? '' : 'fantome-bloque'}`} style={{ zIndex: 99999 }}>
          <DessinMine x={fantome.x} y={fantome.y} miroir={fantome.miroir} fraction={etat.profondeur / profondeurBedrock(etat.prestige)} ascenseur={etat.ascenseur.niveau} cabineEnHaut={false} enMouvement={false} nbMineurs={etat.employes.length} />
        </BoiteSvg>,
      )
    } else {
      objets.push(
        <ImageBatiment key="fantome" id={fantome.id} x={fantome.x} y={fantome.y} miroir={fantome.miroir} classe={`fantome ${fantomeLibre ? '' : 'fantome-bloque'}`} />,
      )
    }
  } else if (fantome?.type === 'decoration') {
    const t = DECORATIONS[fantome.id].taille
    objets.push(
      <BoiteSvg key="fantome" x={fantome.x} y={fantome.y} taille={t} hauteur={hauteurDecoration(fantome.id)} classe={`fantome ${fantomeLibre ? '' : 'fantome-bloque'}`} style={{ zIndex: 99999 }}>
        <DessinDecoration id={fantome.id} x={fantome.x} y={fantome.y} taille={t} miroir={fantome.miroir} />
      </BoiteSvg>,
    )
  }

  // Le joueur.
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur
  objets.push(
    <Perso key="joueur" x={joueur.x} y={joueur.y} sens={joueur.sens} vue={joueur.vue} marche={joueur.marche} saut={joueur.saut} classe="perso-joueur">
      {(vue) => <Hamster role="joueur" vue={vue} couleurPioche={couleurPioche} chapeau={etat.tenue.chapeau} haut={etat.tenue.haut} />}
    </Perso>,
  )

  // Les mineurs employés quand ils sont au village.
  const personnel = batimentPose(village, 'employes')
  let enAttente = 0
  etat.employes.forEach((mineur: Employe, index) => {
    const couleur = RARETES[mineur.rarete]?.couleur ?? RARETES.commun.couleur
    const pioche = PIOCHES[mineur.niveau]?.couleur ?? null
    const etiquette = <span className={`etiquette-perso rarete-${mineur.rarete}`}>{mineur.nom}</span>
    let position: { x: number; y: number } | null = null
    let orientation: { sens: 1 | -1; vue: 'face' | 'dos' } = { sens: 1, vue: 'face' }
    let marche = false
    let colere = false
    if (mineur.etape === 'marche') {
      const chemin = cheminEntre(village, mineur.depuis, mineur.lieu)
      if (chemin) {
        const point = surLeChemin(chemin, Math.min(longueurChemin(chemin), mineur.progression * VITESSE_MARCHE))
        position = point
        orientation = orienter(point.dx, point.dy)
        marche = true
      }
      colere = mineur.tempsPaye <= 0
    } else if (mineur.etape === 'vend' || mineur.etape === 'forge') {
      const b = batimentPose(village, mineur.etape === 'vend' ? 'marche' : 'forgeron')
      if (b) position = devant(b, 1 + (index % 4), 0.9)
    } else if (mineur.etape === 'attend' && personnel) {
      position = devant(personnel, 2 + enAttente++, 1.6)
      colere = true
    }
    if (!position) return
    objets.push(
      <Perso
        key={`m${index}`}
        x={position.x}
        y={position.y}
        sens={orientation.sens}
        vue={orientation.vue}
        marche={marche}
        classe={`perso-mineur ${colere ? 'perso-colere' : ''}`}
        etiquette={
          <>
            {colere && <span className="bulle-colere-village">😠</span>}
            {etiquette}
          </>
        }
      >
        {(vue) => <Hamster role="mineur" vue={vue} casque={couleur} couleurPioche={pioche} charge={mineur.etape === 'marche' && mineur.lieu === 'marche'} />}
      </Perso>,
    )
  })

  // Le manager et le recruteur, devant le Personnel.
  if (personnel && etat.manager.embauche) {
    const p = devant(personnel, 1, 0.9)
    objets.push(
      <Perso key="manager" x={p.x} y={p.y} sens={-1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Manager</span>}>
        {(vue) => <Hamster role="manager" vue={vue} />}
      </Perso>,
    )
  }
  if (personnel && etat.recruteur > 0) {
    const p = devant(personnel, 0, 0.9)
    objets.push(
      <Perso key="recruteur" x={p.x} y={p.y} sens={1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Recruteur</span>}>
        {(vue) => <Hamster role="recruteur" vue={vue} />}
      </Perso>,
    )
  }

  // Les chargements qui roulent vers le marché.
  const rails = railsMineMarche(village)
  const cheminMarche = cheminEntre(village, 'puits', 'marche')
  etat.convois.forEach((convoi, i) => {
    if (convoi.duree <= 0) return
    const k = Math.min(1, convoi.temps / convoi.duree)
    const trajet = convoi.parRails ? rails : cheminMarche
    if (!trajet) return
    const point = surLeChemin(trajet, k * longueurChemin(trajet))
    const e = versEcran(point.x, point.y)
    objets.push(
      <svg
        key={`c${i}`}
        className="wagonnet-village"
        style={{ left: e.x - 20, top: e.y - 28, zIndex: profondeur(point.x, point.y) + 4 }}
        viewBox={`${e.x - 20} ${e.y - 28} 40 34`}
        aria-hidden="true"
      >
        <DessinWagonnet c={e} parRails={convoi.parRails} />
      </svg>,
    )
  })

  // Les bulles de notification au-dessus des bâtiments.
  const bulles: ReactNode[] = []
  for (const b of village.batiments) {
    const liste = notifications[b.id]
    if (!liste || liste.length === 0 || (fantome?.type === 'batiment' && fantome.id === b.id)) continue
    const t = BATIMENTS[b.id].taille
    const centre = versEcran(b.x + t / 2, b.y + t / 2)
    const hauteur = b.id === 'puits' ? 92 : 112
    bulles.push(
      <button
        key={b.id}
        className={`bulle-notif bulle-${liste[0].sorte}`}
        style={{ left: centre.x, top: centre.y - hauteur }}
        title={liste.map((n) => n.texte).join(' · ')}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onTap({ x: b.x, y: b.y }, { type: 'batiment', id: b.id })}
      >
        {liste.slice(0, 2).map((n, i) => (
          <span key={i} className="bulle-icone">
            {n.icone}
          </span>
        ))}
      </button>,
    )
  }

  // Le sol : chemins, rails, grille, emprises.
  const sol = (
    <svg className="sol-village" viewBox={`0 0 ${LARGEUR_MONDE} ${HAUTEUR_MONDE}`} aria-hidden="true">
      {village.chemins.map((cle) => {
        const c = lireCle(cle)
        return <CaseChemin key={`ch${cle}`} x={c.x} y={c.y} />
      })}
      {village.rails.map((cle) => {
        const c = lireCle(cle)
        return <CaseRail key={`r${cle}`} x={c.x} y={c.y} raccords={raccordsRail(village, c.x, c.y)} />
      })}
      {batimentActif && (() => {
        const b = batimentPose(village, batimentActif)
        return b ? <polygon className="emprise-active" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} /> : null
      })()}
      {editionOuFantome && <Grille />}
      {fantome && <LosangeEmprise x={fantome.x} y={fantome.y} taille={tailleFantome(fantome)} libre={fantomeLibre} />}
      {fantome?.type === 'sol' && fantome.sol === 'chemin' && <CaseChemin x={fantome.x} y={fantome.y} />}
    </svg>
  )

  const styleMonde: CSSProperties = {
    transform: `translate(${taille.l / 2 - camera.cx * camera.z}px, ${taille.h / 2 - camera.cy * camera.z}px) scale(${camera.z})`,
    transition: !camera.douce ? 'none' : transition ? 'transform 0.75s cubic-bezier(0.55, 0, 0.6, 1)' : 'transform 0.18s linear',
  }

  return (
    <div
      ref={conteneurRef}
      className={`vue-village ${pinceau ? 'mode-pinceau' : ''} ${fantome ? 'mode-placement' : ''}`}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onWheel={molette}
      aria-label="Le village vu du ciel"
    >
      <div className="monde-village" style={styleMonde}>
        <img className="fond-village" src="/images/village/fond.webp" alt="" width={LARGEUR_MONDE} height={HAUTEUR_MONDE} draggable={false} />
        {sol}
        <div className="objets-village">{objets}</div>
        <div className="bulles-village">{bulles}</div>
      </div>
      {transition && <div className={`fondu-mine fondu-${transition}`} />}
    </div>
  )
}

// La grille de la clairière (pendant qu'on construit ou qu'on modifie le village).
const Grille = memo(function Grille() {
  const lignes: ReactNode[] = []
  for (let i = 0; i <= 40; i++) {
    const a = versEcran(i, 0)
    const b = versEcran(i, 40)
    const c = versEcran(0, i)
    const d = versEcran(40, i)
    lignes.push(<line key={`a${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />, <line key={`b${i}`} x1={c.x} y1={c.y} x2={d.x} y2={d.y} />)
  }
  return <g className="grille-village">{lignes}</g>
})
