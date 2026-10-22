// Le village vu du ciel (vue isométrique, comme Clash of Clans) : le décor de la clairière, la
// mine au milieu, et tout ce que le joueur a posé (bâtiments, rails, chemins).
// On y voit le joueur, les mineurs employés qui vont à la forge ou attendent le wagonnet, le
// manager et le recruteur devant le Personnel, le wagonnet sur les rails (avec celui qui le
// pousse), le rayon du générateur, et des bulles de notification au-dessus des bâtiments.
// La caméra : on fait glisser la carte avec la souris ou le doigt, on zoome avec la molette ou en
// pinçant. Elle suit le joueur quand il marche.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { BATIMENTS, BATIMENTS_DES_RAILS, LIAISONS, RARETES, RESERVE_GENERATEUR_WAGONNET, SECONDES_FORGE_EMPLOYE, SECONDES_VIDAGE_EMPLOYE, VITESSE_MARCHE, type IdBatiment, type IdLiaison } from '../jeu/donnees'
import { centreGenerateur, generateurEnMarche, rayonGenerateur } from '../jeu/generateur'
import { foreuseEnMarche, vitesseForage } from '../jeu/foreuse'
import { capaciteCoffre, nbDansCoffre, secondesTrajetMineur, type EtatJeu, type Employe } from '../jeu/mineur'
import { nombreAbrege } from '../nombres'
import { distanceDepuisLeDepart, ligneDe, longueurTrajet, milieuDeLigne, trajetDuJoueur, trajetsAProposer } from '../jeu/wagonnet'
import type { Notification } from '../jeu/notifications'
import {
  batimentPose,
  bordsDeVoie,
  cheminEntre,
  lireCle,
  longueurChemin,
  occupation,
  type Case,
} from '../jeu/village'
import type { EtatJoueurVillage } from '../useJoueurVillage'
import { tailleFantome, type CibleVillage, type Fantome } from './fantome'
import {
  BoiteSvg,
  CaseChemin,
  RailsDuVillage,
  DessinEvolutionMine,
  type PassagerAscenseur,
  LosangeEmprise,
  GrilleConstruction,
  TerrainVillage,
} from './DessinsVillage'
import { AmbianceVillage } from './AmbianceVillage'
import { WagonnetVillage } from './WagonnetVillage'
import { ImageBatiment, MiniJauge, Perso } from './ElementsVillage'
import { EauPlage, ObjetsPlage, SolPlage } from './PlageVillage'
import { BOITES_PLAGE } from './plage'
import { ForetDerriere, ForetDevant, type VueForet } from './ForetVillage'
import {
  CALAGES,
  pointSurSprite,
  HAUTEUR_MONDE,
  LIMITES_CAMERA,
  devant,
  LARGEUR_MONDE,
  losange,
  orienter,
  profondeur,
  surLeChemin,
  surLaTrace,
  longueurTrace,
  traceDeLaVoie,
  versEcran,
  versGrille,
  type Point,
} from './iso'

type Props = {
  etat: EtatJeu
  joueur: EtatJoueurVillage
  notifications: Partial<Record<IdBatiment, Notification[]>>
  batimentActif: IdBatiment | null
  fantome: Fantome | null
  fantomeLibre: boolean
  fantomeFixe: boolean // le fantôme a été posé d'un clic (sinon, à la souris, il suit le curseur)
  pinceau: boolean // on peint des rails ou des chemins : chaque case touchée en reçoit un
  onTap: (c: Case, cible: CibleVillage | null) => void
  onSurvol: (c: Case) => void // la souris passe sur une case (le fantôme la suit tant qu'il n'est pas fixé)
  onGlisser: (c: Case) => void // on fait glisser le fantôme avec le doigt ou la souris
  onPeindre: (c: Case) => void // le doigt glisse sur une case en mode pinceau
  trajetEnSurbrillance?: IdLiaison | null // un trajet qui brille sur la carte (quand on embauche un pousseur)
  zonesRails?: boolean // on pose des rails : les bâtiments qu'on peut relier sont entourés de jaune
  onOuvrirTrajet?: (liaisons: IdLiaison[]) => void // on touche la bulle « 🛤️ » d'un trajet à créer
}

type Camera = { z: number; cx: number; cy: number; douce: boolean }

const ZOOM_MAX = 2.6
// La force du zoom à la molette (par pixel de défilement) et au pincement (27/10, encore plus
// fort depuis : un cran de molette double presque le zoom).
const FORCE_MOLETTE = 0.0085
const FORCE_PINCEMENT = 2.4

export function VueVillage({
  etat,
  joueur,
  notifications,
  batimentActif,
  fantome,
  fantomeLibre,
  fantomeFixe,
  pinceau,
  onTap,
  onSurvol,
  onGlisser,
  onPeindre,
  trajetEnSurbrillance = null,
  zonesRails = false,
  onOuvrirTrajet,
}: Props) {
  const conteneurRef = useRef<HTMLDivElement>(null)
  const [taille, setTaille] = useState({ l: 800, h: 600 })
  const village = etat.village

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

  // Le milieu de l'écran. La caméra ne bouge pas quand un panneau s'ouvre à droite (27/10) :
  // le joueur garde sa vue.
  const milieuX = taille.l / 2
  // On ne peut pas dézoomer au point de voir plus loin que les limites de la caméra.
  const zoomMin = Math.max(taille.l / (LIMITES_CAMERA.x1 - LIMITES_CAMERA.x0), taille.h / (LIMITES_CAMERA.y1 - LIMITES_CAMERA.y0))
  const zoomConfort = Math.min(ZOOM_MAX, Math.max(zoomMin, taille.l / 760))
  const [zoom, setZoom] = useState<number | null>(null)
  const [libre, setLibre] = useState<{ cx: number; cy: number } | null>(null)

  // Le joueur se remet à marcher : la caméra le suit de nouveau.
  const [marchait, setMarchait] = useState(joueur.marche)
  if (marchait !== joueur.marche) {
    setMarchait(joueur.marche)
    if (joueur.marche && libre !== null) setLibre(null)
  }

  // On garde la caméra dans ses limites : la clairière et la forêt autour, jamais au-delà.
  const borner = useCallback(
    (c: { z: number; cx: number; cy: number }): Camera => {
      const { x0, y0, x1, y1 } = LIMITES_CAMERA
      const z = Math.min(ZOOM_MAX, Math.max(zoomMin, c.z))
      const demiL = taille.l / 2 / z
      const demiH = taille.h / 2 / z
      const cx = demiL * 2 >= x1 - x0 ? (x0 + x1) / 2 : Math.min(x1 - demiL, Math.max(x0 + demiL, c.cx))
      const cy = demiH * 2 >= y1 - y0 ? (y0 + y1) / 2 : Math.min(y1 - demiH, Math.max(y0 + demiH, c.cy))
      return { z, cx, cy, douce: false }
    },
    [taille, zoomMin],
  )

  // Le wagonnet que pousse le joueur : où il est (pour la caméra).
  const trajetPousse = trajetDuJoueur(etat)
  const wagonnet = (() => {
    if (!trajetPousse) return null
    const ligneDuJoueur = ligneDe(etat, trajetPousse.liaison)
    if (!ligneDuJoueur) return null
    const info = LIAISONS[trajetPousse.liaison]
    const trace = traceDeLaVoie(village, ligneDuJoueur, info.depart, info.arrivee)
    const k = distanceDepuisLeDepart(etat, trajetPousse) / longueurTrajet(ligneDuJoueur)
    return surLaTrace(trace, k * longueurTrace(trace))
  })()
  // Quand le joueur pousse un wagonnet, c'est lui que la caméra suit.
  const pousse = wagonnet !== null
  // Le joueur se met à pousser le wagonnet : la caméra le suit de nouveau (même si on avait
  // déplacé la carte à la main).
  const [poussait, setPoussait] = useState(pousse)
  if (poussait !== pousse) {
    setPoussait(pousse)
    if (pousse && libre !== null) setLibre(null)
  }
  const suivi = pousse && wagonnet ? wagonnet : joueur
  const ecranJoueur = versEcran(suivi.x, suivi.y)
  const normale = borner({ z: zoom ?? zoomConfort, ...(libre ?? { cx: ecranJoueur.x, cy: ecranJoueur.y - 20 }) })
  const camera: Camera = { ...normale, douce: libre === null }
  const cameraRef = useRef(camera)
  useLayoutEffect(() => {
    cameraRef.current = camera
  })

  // La caméra affichée (23/10) : elle rejoint la caméra voulue en douceur, à chaque image de
  // l'écran (au lieu d'une transition CSS relancée à chaque pas du joueur, qui saccadait). Quand
  // on fait glisser la carte ou qu'on zoome, elle y va tout de suite.
  const mondeRef = useRef<HTMLDivElement>(null)
  const afficheeRef = useRef({ z: camera.z, cx: camera.cx, cy: camera.cy })
  const miseEnPageRef = useRef({ milieuX, hauteur: taille.h })
  const appliquerCamera = useCallback(() => {
    const c = afficheeRef.current
    const { milieuX: mx, hauteur } = miseEnPageRef.current
    if (mondeRef.current) mondeRef.current.style.transform = `translate(${mx - c.cx * c.z}px, ${hauteur / 2 - c.cy * c.z}px) scale(${c.z})`
  }, [])
  useLayoutEffect(() => {
    miseEnPageRef.current = { milieuX, hauteur: taille.h }
    if (!cameraRef.current.douce) afficheeRef.current = { z: cameraRef.current.z, cx: cameraRef.current.cx, cy: cameraRef.current.cy }
    appliquerCamera()
  })
  useEffect(() => {
    let image = 0
    let avant = performance.now()
    const suivre = (maintenant: number) => {
      // (le temps d’une image peut être un peu négatif à la première image : on le borne à 0)
      const secondes = Math.max(0, Math.min(0.1, (maintenant - avant) / 1000))
      avant = maintenant
      const voulue = cameraRef.current
      const c = afficheeRef.current
      // Plus elle est loin, plus elle va vite (elle rattrape environ 90 % de l'écart en 0,25 s).
      const k = voulue.douce ? 1 - Math.exp(-secondes * 9) : 1
      const nouvelle = { z: c.z + (voulue.z - c.z) * k, cx: c.cx + (voulue.cx - c.cx) * k, cy: c.cy + (voulue.cy - c.cy) * k }
      const bouge = Math.abs(nouvelle.cx - c.cx) + Math.abs(nouvelle.cy - c.cy) + Math.abs(nouvelle.z - c.z) * 100 > 0.01
      afficheeRef.current = nouvelle
      if (bouge) appliquerCamera()
      image = requestAnimationFrame(suivre)
    }
    image = requestAnimationFrame(suivre)
    return () => cancelAnimationFrame(image)
  }, [appliquerCamera])

  // --- Souris, doigts, molette ------------------------------------------------

  const pointeurs = useRef(new Map<number, { x: number; y: number }>())
  const geste = useRef<{ mode: 'tap' | 'carte' | 'fantome' | 'pinceau'; depart: { x: number; y: number }; temps: number; camera: Camera; deplace: boolean } | null>(null)
  const pincement = useRef<{ distance: number; z: number } | null>(null)

  // Un point de l'écran (dans la vue) → un point du monde.
  const versMonde = useCallback(
    (sx: number, sy: number): Point => {
      const c = afficheeRef.current // ce qu'on voit vraiment à l'écran
      const rect = conteneurRef.current?.getBoundingClientRect()
      const ox = rect ? sx - rect.left : sx
      const oy = rect ? sy - rect.top : sy
      return { x: (ox - milieuX) / c.z + c.cx, y: (oy - taille.h / 2) / c.z + c.cy }
    },
    [taille, milieuX],
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
    conteneurRef.current?.setPointerCapture(e.pointerId)
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()]
      pincement.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), z: cameraRef.current.z }
      geste.current = null
      return
    }
    const c = caseSous(e.clientX, e.clientY)
    // Glisser sur le fantôme le déplace ; partout ailleurs, on fait glisser la carte (27/10). À la
    // souris, un fantôme pas encore fixé suit le curseur : il est donc toujours dessous. Tant
    // qu'il n'est pas fixé (par un clic), glisser déplace la carte, pas le bâtiment.
    const surLeFantome = fantome !== null && dansLeFantome(c) && (fantomeFixe || e.pointerType !== 'mouse')
    const mode = pinceau ? 'pinceau' : surLeFantome ? 'fantome' : 'tap'
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
      // Le zoom suit le pincement en plus fort (puissance FORCE_PINCEMENT) : un petit geste suffit.
      setZoom(borner({ ...cameraRef.current, z: depart.z * Math.pow(distance / depart.distance, FORCE_PINCEMENT) }).z)
      return
    }
    const g = geste.current
    if (!g) return
    const dx = e.clientX - g.depart.x
    const dy = e.clientY - g.depart.y
    if (!g.deplace && Math.hypot(dx, dy) > 7) g.deplace = true
    if (!g.deplace) return
    if (g.mode === 'fantome') onGlisser(caseSous(e.clientX, e.clientY))
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
      else if (occupant?.type === 'rail') cible = { type: 'rail', x: c.x, y: c.y }
      else if (occupant?.type === 'chemin') cible = { type: 'chemin', x: c.x, y: c.y }
    }
    onTap(c, cible)
  }

  function molette(e: React.WheelEvent) {
    const m = versMonde(e.clientX, e.clientY)
    const c = cameraRef.current
    // Un cran de molette zoome presque du double (27/10 : avant, il fallait tourner longtemps).
    // Firefox compte parfois en lignes (deltaMode 1) : une ligne vaut environ 33 pixels.
    const pixels = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY
    const z = Math.min(ZOOM_MAX, Math.max(zoomMin, c.z * Math.exp(-pixels * FORCE_MOLETTE)))
    // On zoome autour du point sous la souris.
    const nouvelle = borner({ z, cx: m.x - (m.x - c.cx) * (c.z / z), cy: m.y - (m.y - c.cy) * (c.z / z) })
    setZoom(nouvelle.z)
    setLibre({ cx: nouvelle.cx, cy: nouvelle.cy })
  }

  // --- Ce qu'on dessine ------------------------------------------------------

  const objets: ReactNode[] = []

  // Les bâtiments (celui qu'on déplace est remplacé par son fantôme).
  for (const b of village.batiments) {
    if (fantome?.type === 'batiment' && fantome.id === b.id) continue
    const actif = b.id === batimentActif
    if (b.id === 'puits') {
      // La mine : son image, et par-dessus ce qui évolue (cabine d'ascenseur, niveau).
      objets.push(
        <ImageBatiment key="puits" id="puits" x={b.x} y={b.y} miroir={b.miroir} classe={actif ? 'sprite-actif' : ''} />,
        <MineAnimee key="puits-evolution" etat={etat} x={b.x} y={b.y} miroir={b.miroir} />,
      )
      continue
    }
    const classes = [
      actif ? 'sprite-actif' : '',
      b.id === 'foreuse' && foreuseEnMarche(etat) ? 'sprite-vibre' : '',
      b.id === 'generateur' && generateurEnMarche(etat) && !actif ? 'sprite-electrique' : '',
    ].join(' ')
    objets.push(<ImageBatiment key={b.id} id={b.id} x={b.x} y={b.y} miroir={b.miroir} classe={classes} />)
  }

  // Le fantôme de ce qu'on place.
  if (fantome?.type === 'batiment') {
    objets.push(
      <ImageBatiment key="fantome" id={fantome.id} x={fantome.x} y={fantome.y} miroir={fantome.miroir} classe={`fantome ${fantomeLibre ? '' : 'fantome-bloque'}`} />,
    )
  }

  // Là où le joueur va : un petit repère doré qui pulse sur le sol (comme dans Clash of Clans).
  if (joueur.destination && !pousse) {
    const d = versEcran(joueur.destination.x, joueur.destination.y)
    objets.push(<span key="destination" className="repere-destination" style={{ left: d.x, top: d.y, zIndex: profondeur(joueur.destination.x, joueur.destination.y) }} />)
  }

  // Le joueur (quand il pousse le wagonnet, il est dessiné avec lui, plus bas).
  if (!pousse) {
    objets.push(
      <Perso key="joueur" qui="joueur" x={joueur.x} y={joueur.y} sens={joueur.sens} vue={joueur.vue} marche={joueur.marche} saut={joueur.saut} classe="perso-joueur" />,
    )
  }

  // Les mineurs employés quand ils sont au village.
  const personnel = batimentPose(village, 'employes')
  let enAttente = 0
  let auQuai = 0
  etat.employes.forEach((mineur: Employe, index) => {
    const etiquette = <span className={`etiquette-perso rarete-${mineur.rarete}`}>{mineur.nom}</span>
    let position: { x: number; y: number } | null = null
    let orientation: { sens: 1 | -1; vue: 'face' | 'dos' } = { sens: 1, vue: 'face' }
    let marche = false
    let colere = false
    if (mineur.etape === 'marche' && mineur.progression < 0 && mineur.depuis === 'employes' && personnel) {
      // Payé, il attend son tour pour partir, à sa place devant le Personnel.
      position = devant(personnel, 2 + enAttente++, 1.6)
    } else if (mineur.etape === 'marche') {
      const chemin = cheminEntre(village, mineur.depuis, mineur.lieu)
      if (chemin) {
        const point = surLeChemin(chemin, Math.max(0, Math.min(longueurChemin(chemin), mineur.progression * VITESSE_MARCHE)))
        position = point
        orientation = orienter(point.dx, point.dy)
        marche = true
      }
      colere = mineur.tempsPaye <= 0
    } else if (mineur.etape === 'forge') {
      const b = batimentPose(village, 'forgeron')
      if (b) position = devant(b, 1 + (index % 4), 0.9)
    } else if (mineur.etape === 'quai') {
      // Il attend son wagonnet à côté du début des rails de son trajet (au bord de la voie).
      const ligneQuai = mineur.trajet ? ligneDe(etat, mineur.trajet) : null
      const maison = batimentPose(village, mineur.trajet ? LIAISONS[mineur.trajet].depart : 'puits')
      if (ligneQuai) {
        const a = ligneQuai[0]
        const b = ligneQuai[1] ?? a
        const sens = { x: b.x - a.x, y: b.y - a.y }
        const cote = sens.x === 0 && sens.y === 0 ? { x: 1, y: 0 } : { x: -sens.y, y: sens.x }
        position = { x: a.x + 0.5 + cote.x * 1.3 + sens.x * 0.6 * auQuai, y: a.y + 0.5 + cote.y * 1.3 + sens.y * 0.6 * auQuai++ }
      } else if (maison) {
        position = devant(maison, 3 + auQuai++, 1.2)
      }
    } else if (mineur.etape === 'attend' && personnel) {
      position = devant(personnel, 2 + enAttente++, 1.6)
      colere = true
    }
    if (!position) return
    objets.push(
      <Perso
        key={`m${index}`}
        qui={RARETES[mineur.rarete] ? mineur.rarete : 'commun'}
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
      />,
    )
  })

  // Le manager et le recruteur, devant le Personnel.
  if (personnel && etat.manager.embauche) {
    const p = devant(personnel, 1, 0.9)
    objets.push(
      <Perso key="manager" qui="manager" x={p.x} y={p.y} sens={-1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Manager</span>} />,
    )
  }
  if (personnel && etat.recruteur > 0) {
    const p = devant(personnel, 0, 0.9)
    objets.push(
      <Perso key="recruteur" qui="recruteur" x={p.x} y={p.y} sens={1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Recruteur</span>} />,
    )
  }

  // Les wagonnets sur les rails (un par trajet), et celui qui pousse chacun (toi ou un mineur),
  // juste derrière : chacun a sa propre animation, à chaque image (WagonnetVillage).
  for (const trajet of etat.trajets) objets.push(<WagonnetVillage key={`w${trajet.liaison}`} etat={etat} trajet={trajet} />)

  // Les bulles de notification au-dessus des bâtiments.
  const bulles: ReactNode[] = []
  for (const b of village.batiments) {
    const liste = notifications[b.id]
    if (!liste || liste.length === 0 || (fantome?.type === 'batiment' && fantome.id === b.id)) continue
    const t = BATIMENTS[b.id].taille
    const centre = versEcran(b.x + t / 2, b.y + t / 2)
    // (au-dessus de la mine, la bulle passe au-dessus de la jauge du coffre)
    const hauteur = b.id === 'puits' ? 112 : 96
    bulles.push(
      <button
        key={b.id}
        className={`bulle-notif bulle-${liste[0].sorte}`}
        style={{ left: centre.x, top: centre.y - hauteur }}
        title={liste.map((n) => n.texte).join(' · ')}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onTap({ x: b.x, y: b.y }, { type: 'batiment', id: b.id })}
      >
        {/* La plus urgente en grand (son icône et deux mots), et combien d'autres attendent. */}
        <span className="bulle-medaille">
          <span className="bulle-icone">{liste[0].icone}</span>
        </span>
        <span className="bulle-court">{liste[0].court}</span>
        {liste.length > 1 && <span className="bulle-compte">+{liste.length - 1}</span>}
        {liste[0].sorte === 'achat' && (
          <span className="bulle-etincelles">
            <i />
            <i />
            <i />
          </span>
        )}
      </button>,
    )
  }

  // Les trajets à créer (27/10) : dès que des rails relient deux bâtiments, une bulle « 🛤️ »
  // apparaît au milieu de la ligne. On la touche pour régler l'automatisation du trajet.
  for (const liaison of trajetsAProposer(etat)) {
    const ligneProposee = ligneDe(etat, liaison)
    if (!ligneProposee) continue
    const milieu = milieuDeLigne(ligneProposee)
    const p = versEcran(milieu.x + 0.5, milieu.y + 0.5)
    const info = LIAISONS[liaison]
    bulles.push(
      <button
        key={`trajet-${liaison}`}
        className="bulle-notif bulle-trajet"
        style={{ left: p.x, top: p.y - 24 }}
        title={`Automatiser le trajet ${BATIMENTS[info.depart].nom} → ${BATIMENTS[info.arrivee].nom}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onOuvrirTrajet?.([liaison])}
      >
        <span className="bulle-medaille">
          <span className="bulle-icone">🛤️</span>
        </span>
        <span className="bulle-court">{info.emoji} Automatiser</span>
        <span className="bulle-etincelles">
          <i />
          <i />
          <i />
        </span>
      </button>,
    )
  }

  // La jauge du coffre de la mine, toujours au-dessus d'elle (27/10) : on voit d'un coup d'œil
  // s'il faut le vider. Elle passe à l'orange puis au rouge (et clignote) quand il est plein.
  const puits = batimentPose(village, 'puits')
  if (puits) {
    const t = BATIMENTS.puits.taille
    const centre = versEcran(puits.x + t / 2, puits.y + t / 2)
    const dans = nbDansCoffre(etat)
    const capacite = capaciteCoffre(etat)
    const part = Math.min(1, dans / Math.max(1, capacite))
    const niveau = part >= 1 ? 'jauge-pleine' : part >= 0.75 ? 'jauge-haute' : ''
    const mineursAuFond = mineursDansLaMine(etat)
    bulles.push(
      <div key="jauge-coffre" className={`jauge-coffre-mine ${niveau}`} style={{ left: centre.x, top: centre.y - 78 }} title={`Coffre de la mine : ${dans} / ${capacite}`}>
        <span className="jauge-coffre-icone" aria-hidden="true">
          📦
        </span>
        <span className="jauge-coffre-barre">
          <i style={{ width: `${Math.round(part * 100)}%` }} />
          <span className="jauge-coffre-texte">
            {nombreAbrege(dans)} / {nombreAbrege(capacite)}
          </span>
        </span>
        {/* Les mineurs au travail dans la mine (on ne les voit pas : ils sont au fond). */}
        {mineursAuFond > 0 && (
          <span className="jauge-coffre-mineurs" title={`${mineursAuFond} mineur(s) au travail dans la mine`}>
            👷 {mineursAuFond}
          </span>
        )}
      </div>,
    )
  }

  // Les mini-jauges des bâtiments qui travaillent (27/10) : la forge qui fait la pioche d'un
  // mineur, la foreuse qui fore son prochain bloc, le générateur et son courant qui reste.
  const auDessus = (id: IdBatiment) => {
    const b = batimentPose(village, id)
    if (!b) return null
    const t = BATIMENTS[id].taille
    const c = versEcran(b.x + t / 2, b.y + t / 2)
    return { x: c.x, y: c.y - 70 }
  }
  const forgeron = etat.employes.filter((m) => m.etape === 'forge').sort((a, b) => b.progression - a.progression)[0]
  const pForge = auDessus('forgeron')
  if (forgeron && pForge) {
    bulles.push(<MiniJauge key="jauge-forge" x={pForge.x} y={pForge.y} texte={`🔨 Pioche de ${forgeron.nom}`} part={forgeron.progression / SECONDES_FORGE_EMPLOYE} secondes={SECONDES_FORGE_EMPLOYE - forgeron.progression} />)
  }
  const pForeuse = auDessus('foreuse')
  if (pForeuse && foreuseEnMarche(etat)) {
    const vitesse = vitesseForage(etat)
    bulles.push(<MiniJauge key="jauge-foreuse" x={pForeuse.x} y={pForeuse.y} texte="⚙️ Forage" part={etat.foreuse.progression} secondes={(1 - etat.foreuse.progression) / Math.max(0.01, vitesse)} />)
  }
  const pGenerateur = auDessus('generateur')
  if (pGenerateur && generateurEnMarche(etat)) {
    bulles.push(
      <MiniJauge key="jauge-generateur" x={pGenerateur.x} y={pGenerateur.y} texte="⚡ Courant" part={etat.generateur.carburant / RESERVE_GENERATEUR_WAGONNET} secondes={etat.generateur.carburant} />,
    )
  }

  // Le sol : chemins, rails, grille, emprises.
  const sol = (
    <svg className="sol-village" viewBox={`0 0 ${LARGEUR_MONDE} ${HAUTEUR_MONDE}`} aria-hidden="true">
      {/* Une ombre douce sous chaque bâtiment (la lumière vient d'en haut à gauche) : il est posé
          sur le sol, pas collé dessus. Trois losanges transparents l'un sur l'autre, du plus grand
          au plus petit : le bord est doux sans flou (un flou faisait ramer le jeu). */}
      {village.batiments
        .filter((b) => b.id !== 'puits')
        .flatMap((b) =>
          [0.6, 0, -0.6].map((marge) => {
            const taille = BATIMENTS[b.id].taille - 0.5 + marge
            return <polygon key={`ombre-${b.id}-${marge}`} className="ombre-batiment" points={losange(b.x + 0.6 - marge / 2, b.y + 0.2 - marge / 2, taille)} />
          }),
        )}
      {(fantome || pinceau) && <GrilleConstruction />}
      {village.chemins.map((cle) => {
        const c = lireCle(cle)
        return <CaseChemin key={`ch${cle}`} x={c.x} y={c.y} />
      })}
      <RailsDuVillage village={village} />
      {/* Le trajet qu'on regarde au Personnel : une ligne jaune épaisse qui brille, du centre du
          bâtiment de départ au centre de celui d'arrivée en suivant les rails (les bâtiments,
          dessinés par-dessus, la cachent à leurs deux bouts). Leurs emprises sont entourées d'or. */}
      {trajetEnSurbrillance &&
        (() => {
          const ligneVue = ligneDe(etat, trajetEnSurbrillance)
          if (!ligneVue) return null
          const { depart, arrivee } = LIAISONS[trajetEnSurbrillance]
          const batimentDepart = batimentPose(village, depart)
          const batimentArrivee = batimentPose(village, arrivee)
          // Les points de la ligne, au milieu de chaque case (et des deux bâtiments).
          const etapes: { x: number; y: number }[] = ligneVue.map((c) => ({ x: c.x + 0.5, y: c.y + 0.5 }))
          if (batimentDepart) etapes.unshift({ x: batimentDepart.x + BATIMENTS[depart].taille / 2, y: batimentDepart.y + BATIMENTS[depart].taille / 2 })
          if (batimentArrivee) etapes.push({ x: batimentArrivee.x + BATIMENTS[arrivee].taille / 2, y: batimentArrivee.y + BATIMENTS[arrivee].taille / 2 })
          const points = etapes
            .map((p) => {
              const e = versEcran(p.x, p.y)
              return `${e.x},${e.y}`
            })
            .join(' ')
          return (
            <g className="trajet-en-surbrillance">
              {[batimentDepart && depart, batimentArrivee && arrivee].map((id) => {
                const b = id ? batimentPose(village, id) : null
                return id && b ? <polygon key={id} className="emprise-trajet" points={losange(b.x, b.y, BATIMENTS[id].taille)} /> : null
              })}
              {/* Le halo (large et flou), puis la ligne jaune, puis un filet clair au milieu. */}
              <polyline className="ligne-trajet-halo" points={points} />
              <polyline className="ligne-trajet" points={points} />
              <polyline className="ligne-trajet-reflet" points={points} />
            </g>
          )
        })()}
      {/* On pose des rails (27/10) : les bâtiments qu'on peut relier (mine, marché, foreuse,
          générateur) sont entourés d'une ligne jaune qui brille, tout pile sur le bord de leur
          emprise. Les rails partent de là. */}
      {zonesRails &&
        village.batiments
          .filter((b) => BATIMENTS_DES_RAILS.includes(b.id))
          .map((b) => (
            <g key={`zone-${b.id}`} className="zone-connectable">
              <polygon className="zone-connectable-halo" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} />
              <polygon className="zone-connectable-ligne" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} />
            </g>
          ))}
      {/* Quand on pose un bâtiment ou un chemin : les cases au bord des voies (sous
          la demi-voie qui déborde de chaque côté du rail) sont interdites, en rouge. */}
      {fantome &&
        !(fantome.type === 'sol' && fantome.sol === 'rail') &&
        [...bordsDeVoie(village)].map((cle) => {
          const c = lireCle(cle)
          return <polygon key={`bord${cle}`} className="case-bord-voie" points={losange(c.x, c.y, 1)} />
        })}
      {batimentActif && (() => {
        const b = batimentPose(village, batimentActif)
        return b ? <polygon className="emprise-active" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} /> : null
      })()}
      {/* Le rayon du générateur : quand on le regarde (ou qu'on le pose), et en tout petit
          quand il donne du courant. */}
      <RayonGenerateur etat={etat} batimentActif={batimentActif} fantome={fantome} />
      {fantome && <LosangeEmprise x={fantome.x} y={fantome.y} taille={tailleFantome(fantome)} libre={fantomeLibre} />}
      {fantome?.type === 'sol' && fantome.sol === 'chemin' && <CaseChemin x={fantome.x} y={fantome.y} />}
    </svg>
  )

  // Pendant qu'on fait glisser la carte, le navigateur la garde toute prête (« couche rapide »,
  // will-change) : c'est fluide même avec des centaines d'arbres. Mais alors il ne la redessine
  // pas quand on zoome, et elle devient floue : une fois le zoom fini, on enlève la couche une
  // image pour qu'il la redessine nette, puis on la remet.
  const zoomArrondi = Math.round(camera.z * 100)
  const [coucheRapide, setCoucheRapide] = useState(true)

  // La partie du monde qu'on voit (pour redessiner nettes les tuiles de forêt visibles), mise à
  // jour quand la caméra s'arrête.
  const [vueForet, setVueForet] = useState<VueForet>({ x0: 0, y0: 0, x1: 0, y1: 0, z: 1 })
  const visibleX0 = Math.round(camera.cx - milieuX / camera.z)
  const visibleY0 = Math.round(camera.cy - taille.h / 2 / camera.z)
  const visibleX1 = Math.round(camera.cx + (taille.l - milieuX) / camera.z)
  const visibleY1 = Math.round(camera.cy + taille.h / 2 / camera.z)
  useEffect(() => {
    const minuteur = window.setTimeout(() => setVueForet({ x0: visibleX0, y0: visibleY0, x1: visibleX1, y1: visibleY1, z: zoomArrondi / 100 }), 250)
    return () => clearTimeout(minuteur)
  }, [visibleX0, visibleY0, visibleX1, visibleY1, zoomArrondi])
  // La plage est-elle à l'écran ? Sinon, ses animations s'arrêtent (voir BOITES_PLAGE).
  const plageVisible = BOITES_PLAGE.some((b) => vueForet.x1 > b.x0 && vueForet.x0 < b.x1 && vueForet.y1 > b.y0 && vueForet.y0 < b.y1)
  useEffect(() => {
    let image = 0
    const minuteur = window.setTimeout(() => {
      setCoucheRapide(false)
      image = requestAnimationFrame(() => requestAnimationFrame(() => setCoucheRapide(true)))
    }, 220)
    return () => {
      clearTimeout(minuteur)
      cancelAnimationFrame(image)
    }
  }, [zoomArrondi])

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
      <div ref={mondeRef} className={`monde-village ${coucheRapide ? 'couche-rapide' : ''} ${plageVisible ? '' : 'plage-cachee'}`}>
        <TerrainVillage />
        <SolPlage />
        <EauPlage />
        {sol}
        <ForetDerriere vue={vueForet} />
        <div className="objets-village">{objets}</div>
        <ObjetsPlage />
        <ForetDevant vue={vueForet} />
        <AmbianceVillage />
        <div className="bulles-village">{bulles}</div>
      </div>
    </div>
  )
}

// Ce qui bouge sur la mine (27/10) : la cabine de l'ascenseur, ses passagers, et la mini-jauge
// quand un mineur vide son sac dans le coffre. La cabine a sa propre position, qui avance à
// vitesse limitée vers le mineur le plus proche (ou remonte en haut quand personne ne bouge) :
// elle fait des allers-retours, sans jamais sauter d'un bout à l'autre du puits.
function MineAnimee({ etat, x, y, miroir }: { etat: EtatJeu; x: number; y: number; miroir: boolean }) {
  const passagers = passagersAscenseur(etat)
  const duree = secondesTrajetMineur(etat)
  // La hauteur où la cabine doit aller : celle du passager le plus proche d'elle, sinon en haut.
  const [hauteur, setHauteur] = useState(0)
  const hauteurRef = useRef(0)
  // (les hauteurs des passagers, mises à jour après chaque rendu, lues à chaque image)
  const cibles = useRef<number[]>([])
  const cleCibles = passagers.map((p) => p.f.toFixed(3)).join(',')
  useEffect(() => {
    cibles.current = cleCibles ? cleCibles.split(',').map(Number) : []
  }, [cleCibles])
  useEffect(() => {
    let image = 0
    let avant = performance.now()
    const avancer = (maintenant: number) => {
      const secondes = Math.min(0.1, (maintenant - avant) / 1000)
      avant = maintenant
      const ici = hauteurRef.current
      const liste = cibles.current
      const cible = liste.length === 0 ? 0 : liste.reduce((meilleure, f) => (Math.abs(f - ici) < Math.abs(meilleure - ici) ? f : meilleure), liste[0])
      // Un peu plus vite que les mineurs, pour rattraper celui qu'elle va chercher.
      const pas = (1.6 / Math.max(0.5, duree)) * secondes
      const suivante = Math.abs(cible - ici) <= pas ? cible : ici + Math.sign(cible - ici) * pas
      if (Math.abs(suivante - ici) > 1e-4) {
        hauteurRef.current = suivante
        setHauteur(suivante)
      }
      image = requestAnimationFrame(avancer)
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [duree])

  // Ce qui se passe dans le puits, en mini-jauge au-dessus de la cabine : un mineur qui vide son
  // sac dans le coffre, sinon celui qui remonte (ou descend) depuis le plus longtemps.
  const videur = etat.employes.filter((m) => m.etape === 'vide').sort((a, b) => b.progression - a.progression)[0]
  const voyageur = etat.employes.filter((m) => m.etape === 'monte' || m.etape === 'descend').sort((a, b) => b.progression - a.progression)[0]
  const calage = CALAGES.puits
  const dessus = pointSurSprite(calage, x, y, 10, miroir, 640, 330)
  return (
    <>
      <BoiteSvg x={x} y={y} taille={10} hauteur={130} style={{ zIndex: profondeur(x + 5, y + 5) + 1 }}>
        <DessinEvolutionMine x={x} y={y} miroir={miroir} niveau={etat.niveauMine} ascenseur={etat.ascenseur.niveau > 0} hauteurCabine={hauteur} passagers={passagers} />
      </BoiteSvg>
      {videur && (
        <MiniJauge
          x={dessus.x}
          y={dessus.y}
          texte="📦 Déchargement"
          part={videur.progression / SECONDES_VIDAGE_EMPLOYE}
          secondes={SECONDES_VIDAGE_EMPLOYE - videur.progression}
        />
      )}
      {!videur && voyageur && (
        <MiniJauge
          x={dessus.x}
          y={dessus.y}
          texte={voyageur.etape === 'monte' ? '⬆️ Remontée du sac' : '⬇️ Descente'}
          part={voyageur.progression / duree}
          secondes={duree - voyageur.progression}
        />
      )}
    </>
  )
}

// Les mineurs qui descendent dans le puits ou en remontent (dans la cabine, ou sur l'échelle).
function passagersAscenseur(etat: EtatJeu): PassagerAscenseur[] {
  return etat.employes
    .filter((m) => m.etape === 'monte' || m.etape === 'descend')
    .map((m) => {
      const f = Math.max(0, Math.min(1, m.progression / secondesTrajetMineur(etat)))
      return { qui: RARETES[m.rarete] ? m.rarete : 'commun', f: m.etape === 'descend' ? f : 1 - f, descend: m.etape === 'descend' }
    })
}

// Combien de mineurs travaillent dans la mine en ce moment (pour la jauge du coffre).
function mineursDansLaMine(etat: EtatJeu): number {
  return etat.employes.filter((m) => m.role === 'mineur' && ['descend', 'creuse', 'monte', 'vide'].includes(m.etape)).length
}

// Le cercle du rayon du générateur, vu du ciel (une ellipse : la grille est en losange).
function RayonGenerateur({ etat, batimentActif, fantome }: { etat: EtatJeu; batimentActif: IdBatiment | null; fantome: Fantome | null }) {
  // En plaçant le générateur, on voit le rayon autour du fantôme.
  const place = fantome?.type === 'batiment' && fantome.id === 'generateur'
  const t = BATIMENTS.generateur.taille
  const centre = place ? { x: fantome.x + t / 2, y: fantome.y + t / 2 } : centreGenerateur(etat)
  if (!centre) return null
  const enVue = place || batimentActif === 'generateur'
  const allume = generateurEnMarche(etat)
  if (!enVue && !allume) return null
  const r = rayonGenerateur(etat)
  const points = Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * 2 * Math.PI
    const p = versEcran(centre.x + r * Math.cos(angle), centre.y + r * Math.sin(angle))
    return `${p.x},${p.y}`
  }).join(' ')
  return <polygon className={`rayon-generateur ${enVue ? 'rayon-en-vue' : ''} ${allume ? 'rayon-allume' : ''}`} points={points} />
}
