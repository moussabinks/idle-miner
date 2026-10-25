// Le village vu du ciel (vue isométrique, comme Clash of Clans) : le décor de la clairière, la
// mine au milieu, et tout ce que le joueur a posé (bâtiments, rails, chemins).
// On y voit le joueur, les mineurs employés qui vont à la forge ou attendent le wagonnet, le
// manager et le recruteur devant le Personnel, le wagonnet sur les rails (avec celui qui le
// pousse), le rayon du générateur, et des bulles de notification au-dessus des bâtiments.
// La caméra : on fait glisser la carte avec la souris ou le doigt, on zoome avec la molette ou en
// pinçant. Elle suit le joueur quand il marche.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { BATIMENTS, BATIMENTS_DES_RAILS, LIAISONS, RARETES, SECONDES_FORGE_EMPLOYE, VITESSE_MARCHE, type IdBatiment, type IdLiaison } from '../jeu/donnees'
import { centreGenerateur, generateurEnMarche, rayonGenerateur, reserveMaxGenerateur } from '../jeu/generateur'
import { foreuseEnMarche, vitesseForage } from '../jeu/foreuse'
import { capaciteCoffre, nbDansCoffre, secondesTrajetMineur, secondesVidageAscenseur, type EtatJeu, type Employe } from '../jeu/mineur'
import { caseQuai, cheminEmploye, hauteurNavette, lireNavette, passagersNavette } from '../jeu/employes'
import { distanceDepuisLeDepart, ligneDe, longueurTrajet, milieuDeLigne, trajetDuJoueur, trajetsAProposer } from '../jeu/wagonnet'
import type { Notification } from '../jeu/notifications'
import {
  batimentPose,
  batimentProcheDe,
  cleCase,
  MARGE_CLIC_BATIMENT,
  bordsDeVoie,
  lireCle,
  longueurChemin,
  occupation,
  type Case,
} from '../jeu/village'
import type { EtatJoueurVillage } from '../useJoueurVillage'
import { tailleFantome, type CibleVillage, type Fantome } from './fantome'
import { pixelDessine } from './toucheImage'
import { t } from '../jeu/langue'
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
  POINTS_MINE,
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
  // (30/10) Ce qu'on peint, et si on peut le poser sur une case : un aperçu suit la souris.
  typePinceau?: 'rail' | 'chemin' | null
  peutPeindre?: (c: Case) => boolean
  onTap: (c: Case, cible: CibleVillage | null) => void
  onSurvol: (c: Case) => void // la souris passe sur une case (le fantôme la suit tant qu'il n'est pas fixé)
  onGlisser: (c: Case) => void // on fait glisser le fantôme avec le doigt ou la souris
  onPeindre: (c: Case) => void // le doigt glisse sur une case en mode pinceau
  trajetEnSurbrillance?: IdLiaison | null // un trajet qui brille sur la carte (quand on embauche un pousseur)
  zonesRails?: boolean // on pose des rails : les bâtiments qu'on peut relier sont entourés de jaune
  onOuvrirTrajet?: (liaisons: IdLiaison[]) => void // on touche la bulle « 🛤️ » d'un trajet à créer
  // (23/10) Le rail proposé (doré) qu'on posera avec le bouton « Poser », et s'il peut l'être.
  railPropose?: { c: Case; ok: boolean; depuis: Case | null; sens: { x: number; y: number } } | null
}

type Camera = { z: number; cx: number; cy: number; douce: boolean }

const ZOOM_MAX = 2.6
// La force du zoom à la molette (par pixel de défilement) et au pincement. (29/10 : un cran de
// molette zoomait trop d'un coup ; maintenant, un cran change le zoom d'environ 15 %.)
const FORCE_MOLETTE = 0.0016
// Un cran de molette ne compte jamais plus que ça (certaines souris envoient de très grands
// défilements d'un coup).
const CRAN_MAX = 120
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
  typePinceau = null,
  peutPeindre,
  onTap,
  onSurvol,
  onGlisser,
  onPeindre,
  trajetEnSurbrillance = null,
  zonesRails = false,
  onOuvrirTrajet,
  railPropose = null,
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
  // (25/10) Pendant qu'on pose des rails, la caméra va chercher le rail proposé s'il est caché
  // sous la barre du bas (ou hors de l'écran) : on voit toujours la flèche.
  const cleRailPropose = railPropose ? `${railPropose.c.x},${railPropose.c.y}` : null
  const [railSuivi, setRailSuivi] = useState<string | null>(null)
  if (cleRailPropose !== railSuivi) {
    setRailSuivi(cleRailPropose)
    if (railPropose) {
      const z = zoom ?? zoomConfort
      const vue = libre ?? { cx: versEcran(joueur.x, joueur.y).x, cy: versEcran(joueur.x, joueur.y).y - 20 }
      const p = versEcran(railPropose.c.x + 0.5, railPropose.c.y + 0.5)
      const x = milieuX + (p.x - vue.cx) * z
      const y = taille.h / 2 + (p.y - vue.cy) * z
      if (x < taille.l * 0.12 || x > taille.l * 0.88 || y < taille.h * 0.15 || y > taille.h * 0.55) setLibre({ cx: p.x, cy: p.y + (taille.h * 0.12) / z })
    }
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
  // (30/10) Pendant un zoom (molette, pavé tactile, pincement) ou quand on fait glisser la carte,
  // la caméra voulue est gardée ici, hors de React : chaque cran ou chaque mouvement ne redessine
  // plus tout le village (c'est ce qui saccadait). Quand le geste s'arrête, on la recopie dans
  // l'état de React (zoom, libre) en une seule fois.
  const gesteCameraRef = useRef<Camera | null>(null)
  const finGesteRef = useRef(0)
  const recopieRef = useRef(false)
  useLayoutEffect(() => {
    miseEnPageRef.current = { milieuX, hauteur: taille.h }
    // (le geste vient d'être recopié dans l'état : la caméra de React prend le relais)
    if (recopieRef.current) {
      recopieRef.current = false
      gesteCameraRef.current = null
    }
    if (gesteCameraRef.current) return
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
      const geste = gesteCameraRef.current
      const voulue = geste ?? cameraRef.current
      const c = afficheeRef.current
      // Plus elle est loin, plus elle va vite (elle rattrape environ 90 % de l'écart en 0,25 s ;
      // pendant un zoom, un peu plus vite : 90 % en 0,15 s).
      const k = voulue.douce ? 1 - Math.exp(-secondes * (geste ? 15 : 9)) : 1
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

  // La caméra que vise le geste en cours (ou, sans geste, celle de React).
  const cameraVisee = (): Camera => gesteCameraRef.current ?? cameraRef.current

  // Un geste vise une caméra (en douceur pour un zoom, tout de suite pour faire glisser la carte).
  // Quand plus rien ne bouge depuis un moment, elle est recopiée dans l'état de React.
  function viser(c: Camera, douce: boolean) {
    gesteCameraRef.current = { ...c, douce }
    window.clearTimeout(finGesteRef.current)
    const recopier = () => {
      const g = gesteCameraRef.current
      if (!g) return
      const a = afficheeRef.current
      // (on attend que l'image ait presque rejoint la caméra visée : pas de saut à la fin)
      if (Math.abs(a.z - g.z) > 0.002 || Math.abs(a.cx - g.cx) + Math.abs(a.cy - g.cy) > 0.5) {
        finGesteRef.current = window.setTimeout(recopier, 50)
        return
      }
      recopieRef.current = true
      setZoom(g.z)
      setLibre({ cx: g.cx, cy: g.cy })
    }
    finGesteRef.current = window.setTimeout(recopier, 160)
  }
  useEffect(() => () => window.clearTimeout(finGesteRef.current), [])

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
    const taille = tailleFantome(fantome)
    return c.x >= fantome.x && c.y >= fantome.y && c.x < fantome.x + taille && c.y < fantome.y + taille
  }

  function pointerDown(e: React.PointerEvent) {
    conteneurRef.current?.setPointerCapture(e.pointerId)
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()]
      pincement.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), z: cameraVisee().z }
      geste.current = null
      return
    }
    const c = caseSous(e.clientX, e.clientY)
    // Glisser sur le fantôme le déplace ; partout ailleurs, on fait glisser la carte (27/10). À la
    // souris, un fantôme pas encore fixé suit le curseur : il est donc toujours dessous. Tant
    // qu'il n'est pas fixé (par un clic), glisser déplace la carte, pas le bâtiment.
    const surLeFantome = fantome !== null && dansLeFantome(c) && (fantomeFixe || e.pointerType !== 'mouse')
    // (23/10) Avec des rails (ou des chemins) en main, glisser déplace la carte : on ne pose
    // plus rien en glissant. Un simple toucher choisit la case (voir pointerUp).
    const mode = pinceau ? 'pinceau' : surLeFantome ? 'fantome' : 'tap'
    geste.current = { mode, depart: { x: e.clientX, y: e.clientY }, temps: performance.now(), camera: cameraVisee(), deplace: false }
  }

  function pointerMove(e: React.PointerEvent) {
    if (!pointeurs.current.has(e.pointerId)) {
      // La souris passe au-dessus de la carte (sans clic) : le fantôme la suit.
      if (fantome && e.pointerType === 'mouse' && !pinceau) onSurvol(caseSous(e.clientX, e.clientY))
      // (30/10) On pose des rails : l'aperçu du rail suit la souris.
      if (pinceau && e.pointerType === 'mouse') {
        const c = caseSous(e.clientX, e.clientY)
        if (!caseApercu || caseApercu.x !== c.x || caseApercu.y !== c.y) setCaseApercu(c)
      }
      // Le bâtiment sous la souris (ou juste à côté) est entouré au sol.
      if (e.pointerType === 'mouse') {
        const vise = batimentVise(e.clientX, e.clientY)
        if (vise !== survol) setSurvol(vise)
      }
      return
    }
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pincement.current && pointeurs.current.size >= 2) {
      const [a, b] = [...pointeurs.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const depart = pincement.current
      // Le zoom suit le pincement en plus fort (puissance FORCE_PINCEMENT) : un petit geste suffit.
      viser(borner({ ...cameraVisee(), z: depart.z * Math.pow(distance / depart.distance, FORCE_PINCEMENT) }), true)
      return
    }
    const g = geste.current
    if (!g) return
    const dx = e.clientX - g.depart.x
    const dy = e.clientY - g.depart.y
    if (!g.deplace && Math.hypot(dx, dy) > 7) g.deplace = true
    if (!g.deplace) return
    if (g.mode === 'fantome') onGlisser(caseSous(e.clientX, e.clientY))
    else {
      g.mode = 'carte'
      viser(borner({ ...g.camera, cx: g.camera.cx - dx / g.camera.z, cy: g.camera.cy - dy / g.camera.z }), false)
    }
  }

  // Le bâtiment qu'un clic à cet endroit viserait : son image sous la souris, ou un bâtiment
  // juste à côté (29/10). La carte « capture » le doigt ou la souris : e.target est alors la
  // carte elle-même, jamais l'image du bâtiment ; on cherche donc ce qui est vraiment sous le
  // point (en traversant le joueur, les bulles...). Sur un chemin, « juste à côté » ne compte
  // que si on le demande (en mode Modifier, toucher un chemin doit le choisir, lui).
  function batimentVise(sx: number, sy: number, procheSurChemin = true): IdBatiment | null {
    const c = caseSous(sx, sy)
    const occupant = occupation(village).get(`${c.x},${c.y}`)
    // (23/10) Un rail est toujours prioritaire : même juste à côté d'un bâtiment (ou sous son
    // image, qui dépasse de ses cases), toucher un rail choisit le rail, pas le bâtiment.
    if (occupant?.type === 'rail') return null
    // (25/10) Les images sous le point, de la plus proche à la plus lointaine : la première dont
    // le dessin (pas le vide transparent autour) est touché. Le vide de la grande image de la mine
    // laisse donc passer le clic vers le bâtiment juste derrière.
    for (const element of document.elementsFromPoint(sx, sy)) {
      const donnee = element.getAttribute('data-cible')
      if (!donnee?.startsWith('batiment:')) continue
      if (element instanceof HTMLImageElement && !pixelDessine(element, sx, sy, element.dataset.miroir === 'oui')) continue
      return donnee.slice(9) as IdBatiment
    }
    if (occupant?.type === 'batiment') return occupant.id
    if (occupant?.type === 'chemin' && !procheSurChemin) return null
    return batimentProcheDe(village, c.x + 0.5, c.y + 0.5, MARGE_CLIC_BATIMENT)
  }
  const [survol, setSurvol] = useState<IdBatiment | null>(null)

  // Les mineurs qui viennent d'être embauchés (leurs noms), pendant quelques secondes.
  const nomsEmployes = etat.employes.map((m) => m.nom).join('|')
  const [nomsAvant, setNomsAvant] = useState(nomsEmployes)
  const [arrivees, setArrivees] = useState<string[]>([])
  if (nomsEmployes !== nomsAvant) {
    const avant = nomsAvant.split('|')
    const nouveaux = etat.employes.map((m) => m.nom).filter((nom) => !avant.includes(nom))
    setNomsAvant(nomsEmployes)
    if (nouveaux.length > 0) setArrivees((a) => [...a, ...nouveaux])
  }
  useEffect(() => {
    if (arrivees.length === 0) return
    const minuteur = window.setTimeout(() => setArrivees([]), 6000)
    return () => clearTimeout(minuteur)
  }, [arrivees])
  const [caseApercu, setCaseApercu] = useState<Case | null>(null)

  function pointerUp(e: React.PointerEvent) {
    pointeurs.current.delete(e.pointerId)
    if (pointeurs.current.size < 2) pincement.current = null
    const g = geste.current
    geste.current = null
    if (!g || g.deplace) return
    if (performance.now() - g.temps > 600) return
    if (g.mode === 'pinceau') {
      onPeindre(caseSous(e.clientX, e.clientY))
      return
    }
    // Un simple toucher : on regarde ce qu'il y a dessous. Un bâtiment (son image, ses cases, ou
    // juste à côté, 29/10 : avant, un clic sur son toit, qui dépasse de ses cases, ou juste à
    // côté faisait marcher le joueur sans ouvrir son panneau), sinon des rails ou un chemin.
    const c = caseSous(e.clientX, e.clientY)
    let cible: CibleVillage | null = null
    // (un chemin juste à côté d'un bâtiment reste un chemin : App décide, selon le mode)
    const vise = batimentVise(e.clientX, e.clientY, false)
    if (vise) cible = { type: 'batiment', id: vise }
    else {
      const occupant = occupation(village).get(`${c.x},${c.y}`)
      if (occupant?.type === 'rail') cible = { type: 'rail', x: c.x, y: c.y }
      else if (occupant?.type === 'chemin') cible = { type: 'chemin', x: c.x, y: c.y }
    }
    onTap(c, cible)
  }

  function molette(e: React.WheelEvent) {
    // Le point du monde sous la souris, d'après la caméra visée (les crans s'enchaînent bien).
    const c = cameraVisee()
    const rect = conteneurRef.current?.getBoundingClientRect()
    const m = { x: (e.clientX - (rect?.left ?? 0) - milieuX) / c.z + c.cx, y: (e.clientY - (rect?.top ?? 0) - taille.h / 2) / c.z + c.cy }
    // Un cran de molette zoome d'environ 15 % (29/10 : avant, presque du double, c'était trop).
    // Firefox compte parfois en lignes (deltaMode 1) : une ligne vaut environ 33 pixels.
    const brut = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY
    const pixels = Math.max(-CRAN_MAX, Math.min(CRAN_MAX, brut))
    // (le pincement du pavé tactile arrive comme une molette avec Ctrl, en tout petits pas)
    const force = e.ctrlKey ? FORCE_MOLETTE * 5 : FORCE_MOLETTE
    const z = Math.min(ZOOM_MAX, Math.max(zoomMin, c.z * Math.exp(-pixels * force)))
    // On zoome autour du point sous la souris.
    viser(borner({ z, cx: m.x - (m.x - c.cx) * (c.z / z), cy: m.y - (m.y - c.cy) * (c.z / z) }), true)
  }

  // --- Ce qu'on dessine ------------------------------------------------------

  const objets: ReactNode[] = []

  // Les bâtiments (celui qu'on déplace est remplacé par son fantôme).
  for (const b of village.batiments) {
    if (fantome?.type === 'batiment' && fantome.id === b.id) continue
    // (29/10) Toujours la même image, sans classe qui la change : sinon elle devenait floue
    // (voir .sprite-batiment dans village.css).
    if (b.id === 'puits') {
      // La mine : son image, et par-dessus ce qui évolue (cabine d'ascenseur, niveau).
      objets.push(
        <ImageBatiment key="puits" id="puits" x={b.x} y={b.y} miroir={b.miroir} classe="" />,
        <MineAnimee key="puits-evolution" etat={etat} x={b.x} y={b.y} miroir={b.miroir} />,
      )
      continue
    }
    objets.push(<ImageBatiment key={b.id} id={b.id} x={b.x} y={b.y} miroir={b.miroir} classe="" />)
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
  // (30/10) Un mineur tout juste embauché : une gerbe d'étincelles jaillit du Personnel, et il
  // part vers la mine avec un halo doré, des étincelles et une bulle « ✨ Nouveau ! ».
  if (personnel) {
    for (const nom of arrivees) {
      const c = versEcran(personnel.x + BATIMENTS.employes.taille / 2, personnel.y + BATIMENTS.employes.taille / 2)
      objets.push(
        <div key={`embauche-${nom}`} className="eclat-embauche" style={{ left: c.x, top: c.y - 30, zIndex: 100000 }} aria-hidden="true">
          <span className="eclat-embauche-rayons" />
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ ['--angle' as string]: `${i * 36}deg`, animationDelay: `${(i % 3) * 60}ms` }} />
          ))}
          <strong className="eclat-embauche-texte">👷 {nom} arrive !</strong>
        </div>,
      )
    }
  }
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
      // (un pousseur qui va à son wagonnet marche tout droit jusqu'à son quai : cheminEmploye)
      const chemin = cheminEmploye(etat, mineur)
      if (chemin) {
        const point = surLeChemin(chemin, Math.max(0, Math.min(longueurChemin(chemin), mineur.progression * VITESSE_MARCHE)))
        position = point
        orientation = orienter(point.dx, point.dy)
        marche = true
      }
      colere = mineur.tempsPaye <= 0
    } else if (mineur.role === 'mineur' && mineur.etape === 'descend' && !mineur.enCabine) {
      // (23/10) Arrivé à la mine, il attend la caisse de l'ascenseur au bout de son chemin.
      const chemin = cheminEmploye(etat, mineur)
      if (chemin) position = surLeChemin(chemin, longueurChemin(chemin))
    } else if (mineur.etape === 'forge' && mineur.lieu === 'forgeron') {
      // (une vieille partie : il était allé chercher sa pioche lui-même)
      const b = batimentPose(village, 'forgeron')
      if (b) position = devant(b, 1 + (index % 4), 0.9)
    } else if (mineur.etape === 'quai') {
      // Il attend son wagonnet à côté du début des rails de son trajet (au bord de la voie).
      const ligneQuai = mineur.trajet ? ligneDe(etat, mineur.trajet) : null
      const quai = mineur.trajet ? caseQuai(etat, mineur.trajet) : null
      const maison = batimentPose(village, mineur.trajet ? LIAISONS[mineur.trajet].depart : 'puits')
      if (ligneQuai && quai) {
        // (23/10) Au milieu de sa case de quai : là où son chemin s'arrête (pas de petit saut).
        const a = ligneQuai[0]
        const b = ligneQuai[1] ?? a
        const sens = { x: b.x - a.x, y: b.y - a.y }
        position = { x: quai.x + 0.5 + sens.x * 0.6 * auQuai, y: quai.y + 0.5 + sens.y * 0.6 * auQuai++ }
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
        classe={`perso-mineur ${colere ? 'perso-colere' : ''} ${arrivees.includes(mineur.nom) ? 'perso-nouveau' : ''}`}
        etiquette={
          <>
            {colere && <span className="bulle-colere-village">😠</span>}
            {arrivees.includes(mineur.nom) && <span className="bulle-nouveau-mineur">✨ Nouveau !</span>}
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
      <Perso key="manager" qui="manager" x={p.x} y={p.y} sens={-1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">{t('Manager')}</span>} />,
    )
  }
  if (personnel && etat.recruteur > 0) {
    const p = devant(personnel, 0, 0.9)
    objets.push(
      <Perso key="recruteur" qui="recruteur" x={p.x} y={p.y} sens={1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">{t('Recruteur')}</span>} />,
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
    const taille = BATIMENTS[b.id].taille
    const centre = versEcran(b.x + taille / 2, b.y + taille / 2)
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
        title={t('Automatiser le trajet {depart} → {arrivee}', { depart: t(BATIMENTS[info.depart].nom), arrivee: t(BATIMENTS[info.arrivee].nom) })}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onOuvrirTrajet?.([liaison])}
      >
        <span className="bulle-medaille">
          <span className="bulle-icone">🛤️</span>
        </span>
        <span className="bulle-court">
          {info.emoji} {t('Automatiser')}
        </span>
        <span className="bulle-etincelles">
          <i />
          <i />
          <i />
        </span>
      </button>,
    )
  }

  // (25/10) Plus de jauge du coffre au-dessus de la mine : le bandeau du haut la montre déjà
  // (📦 339 / 800), et la bulle « Plein ! » prévient quand il faut vendre.

  // Les mini-jauges des bâtiments qui travaillent (27/10) : la forge qui fait la pioche d'un
  // mineur, la foreuse qui fore son prochain bloc, le générateur et son courant qui reste.
  const auDessus = (id: IdBatiment) => {
    const b = batimentPose(village, id)
    if (!b) return null
    const taille = BATIMENTS[id].taille
    const c = versEcran(b.x + taille / 2, b.y + taille / 2)
    return { x: c.x, y: c.y - 70 }
  }
  const forgeron = etat.employes.filter((m) => m.etape === 'forge').sort((a, b) => b.progression - a.progression)[0]
  const pForge = auDessus('forgeron')
  if (forgeron && pForge) {
    bulles.push(<MiniJauge key="jauge-forge" x={pForge.x} y={pForge.y} texte={`🔨 ${t('Pioche de {nom}', { nom: forgeron.nom })}`} part={forgeron.progression / SECONDES_FORGE_EMPLOYE} secondes={SECONDES_FORGE_EMPLOYE - forgeron.progression} />)
  }
  const pForeuse = auDessus('foreuse')
  if (pForeuse && foreuseEnMarche(etat)) {
    const vitesse = vitesseForage(etat)
    bulles.push(<MiniJauge key="jauge-foreuse" x={pForeuse.x} y={pForeuse.y} texte={`⚙️ ${t('Forage')}`} part={etat.foreuse.progression} secondes={(1 - etat.foreuse.progression) / Math.max(0.01, vitesse)} />)
  }
  const pGenerateur = auDessus('generateur')
  if (pGenerateur && generateurEnMarche(etat)) {
    bulles.push(
      <MiniJauge key="jauge-generateur" x={pGenerateur.x} y={pGenerateur.y} texte={`⚡ ${t('Courant')}`} part={etat.generateur.carburant / reserveMaxGenerateur(etat)} secondes={etat.generateur.carburant} />,
    )
  }

  // Le sol : chemins, rails, grille, emprises.
  const sol = (
    <svg className="sol-village" viewBox={`0 0 ${LARGEUR_MONDE} ${HAUTEUR_MONDE}`} aria-hidden="true">
      {/* Une ombre plate sous chaque bâtiment (25/10, le style cartoon : une ombre dure, d'un vert
          un peu plus sombre que l'herbe), décalée vers la droite (la lumière vient d'en haut à
          gauche) : il est posé sur le sol, pas collé dessus. */}
      {village.batiments
        .filter((b) => b.id !== 'puits')
        .map((b) => (
          <polygon key={`ombre-${b.id}`} className="ombre-batiment" points={losange(b.x + 0.45, b.y + 0.1, BATIMENTS[b.id].taille)} />
        ))}
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
      {/* (23/10) On pose des rails : les bâtiments deviennent presque invisibles (voir
          .batiments-transparents) ; leur contour au sol reste bien visible. */}
      {zonesRails &&
        village.batiments
          .filter((b) => !BATIMENTS_DES_RAILS.includes(b.id))
          .map((b) => <polygon key={`contour-${b.id}`} className="contour-batiment-rails" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} />)}
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
      {/* Le bâtiment survolé à la souris (29/10 : dit « je suis cliquable », sans toucher à son image). */}
      {survol && survol !== batimentActif && !fantome && (() => {
        const b = batimentPose(village, survol)
        return b ? <polygon className="emprise-survol" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} /> : null
      })()}
      {batimentActif && (() => {
        const b = batimentPose(village, batimentActif)
        return b ? <polygon className="emprise-active" points={losange(b.x, b.y, BATIMENTS[b.id].taille)} /> : null
      })()}
      {/* Le rayon du générateur : seulement quand son panneau est ouvert, ou qu'on le pose (23/10). */}
      <RayonGenerateur etat={etat} batimentActif={batimentActif} fantome={fantome} />
      {fantome && <LosangeEmprise x={fantome.x} y={fantome.y} taille={tailleFantome(fantome)} libre={fantomeLibre} />}
      {fantome?.type === 'sol' && fantome.sol === 'chemin' && <CaseChemin x={fantome.x} y={fantome.y} />}
      {/* (30/10) L'aperçu de ce qu'on peint, sous la souris : vert si on peut le poser, rouge sinon. */}
      {/* (23/10) Le rail proposé, en doré, là où « Poser » le mettra (raccordé au dernier rail). */}
      {pinceau && railPropose && (
        <g className={`rail-propose ${railPropose.ok ? '' : 'rail-propose-bloque'}`}>
          <RailsDuVillage village={{ ...village, rails: [...village.rails, cleCase(railPropose.c.x, railPropose.c.y)] }} seulement={[cleCase(railPropose.c.x, railPropose.c.y)]} />
          <polygon className="losange-propose" points={losange(railPropose.c.x, railPropose.c.y, 1)} />
          <FlecheRail depuis={railPropose.depuis} vers={railPropose.c} sens={railPropose.sens} />
        </g>
      )}
      {pinceau && caseApercu && typePinceau && !railPropose && (
        <g className="apercu-pinceau">
          {typePinceau === 'rail' ? (
            <RailsDuVillage village={{ ...village, rails: [cleCase(caseApercu.x, caseApercu.y)] }} />
          ) : (
            <CaseChemin x={caseApercu.x} y={caseApercu.y} />
          )}
          <LosangeEmprise x={caseApercu.x} y={caseApercu.y} taille={1} libre={peutPeindre ? peutPeindre(caseApercu) : true} />
        </g>
      )}
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
      aria-label={t('Le village vu du ciel')}
    >
      <div ref={mondeRef} className={`monde-village ${coucheRapide ? 'couche-rapide' : ''} ${plageVisible ? '' : 'plage-cachee'} ${zonesRails ? 'batiments-transparents' : ''}`}>
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

// Ce qui bouge sur la mine (27/10) : la caisse de l'ascenseur, ses passagers, et une mini-jauge
// de ce qu'elle fait. (23/10) La caisse fait des allers-retours sans cesse (avancerNavette) : on
// la dessine là où elle est, en glissant doucement d'une image à l'autre.
function MineAnimee({ etat, x, y, miroir }: { etat: EtatJeu; x: number; y: number; miroir: boolean }) {
  const caisse = lireNavette(etat)
  const cible = hauteurNavette(etat)
  const duree = secondesTrajetMineur(etat)
  const [hauteur, setHauteur] = useState(cible)
  const hauteurRef = useRef(cible)
  // (la hauteur voulue, mise à jour après chaque rendu, lue à chaque image)
  const cibleRef = useRef(cible)
  useEffect(() => {
    cibleRef.current = cible
  }, [cible])
  useEffect(() => {
    let image = 0
    let avant = performance.now()
    const avancer = (maintenant: number) => {
      const secondes = Math.min(0.1, (maintenant - avant) / 1000)
      avant = maintenant
      const ici = hauteurRef.current
      const voulue = cibleRef.current
      // Un peu plus vite que la caisse, pour la rattraper sans jamais sauter.
      const pas = (1.6 / Math.max(0.5, duree)) * secondes
      const suivante = Math.abs(voulue - ici) <= pas ? voulue : ici + Math.sign(voulue - ici) * pas
      if (Math.abs(suivante - ici) > 1e-4) {
        hauteurRef.current = suivante
        setHauteur(suivante)
      }
      image = requestAnimationFrame(avancer)
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [duree])

  // Dans la caisse : ses blocs, et le mineur qui descend (il arrive) ou remonte (pas payé).
  const passager = passagersNavette(etat)[0]
  const charge = Object.values(caisse.chargement).reduce((t, n) => t + (n ?? 0), 0)
  const passagers: PassagerAscenseur[] = [{ f: cible, pleine: charge > 0, contenu: caisse.chargement, mineur: passager?.rarete }]
  // La mini-jauge : seulement quand la caisse travaille (des mineurs au fond).
  const auTravail = mineursDansLaMine(etat) > 0 || charge > 0
  const enHaut = caisse.etape === 'haut'
  const calage = CALAGES.puits
  const dessus = pointSurSprite(calage, x, y, 10, miroir, ...POINTS_MINE.dessus)
  return (
    <>
      <BoiteSvg x={x} y={y} taille={10} hauteur={130} classe="dessus-batiment" style={{ zIndex: profondeur(x + 5, y + 5) + 1 }}>
        <DessinEvolutionMine x={x} y={y} miroir={miroir} niveau={etat.niveauMine} ascenseur={etat.ascenseur.niveau > 0} hauteurCabine={hauteur} passagers={passagers} />
      </BoiteSvg>
      {auTravail && enHaut && charge > 0 && (
        <MiniJauge
          x={dessus.x}
          y={dessus.y}
          texte={nbDansCoffre(etat) >= capaciteCoffre(etat) ? `📦 ${t('Coffre plein !')}` : `📦 ${t('Déchargement · {n}', { n: charge })}`}
          part={caisse.progression / secondesVidageAscenseur(etat)}
          secondes={secondesVidageAscenseur(etat) - caisse.progression}
        />
      )}
      {/* (23/10 : plus de jauge « Montée » / « Descente » : seulement le déchargement) */}
    </>
  )
}

// Combien de mineurs travaillent dans la mine en ce moment (pour la jauge du coffre).
function mineursDansLaMine(etat: EtatJeu): number {
  return etat.employes.filter((m) => m.role === 'mineur' && ['creuse', 'forge', 'monte', 'vide'].includes(m.etape)).length
}

// Le cercle du rayon du générateur, vu du ciel (une ellipse : la grille est en losange).
function RayonGenerateur({ etat, batimentActif, fantome }: { etat: EtatJeu; batimentActif: IdBatiment | null; fantome: Fantome | null }) {
  // En plaçant le générateur, on voit le rayon autour du fantôme.
  const place = fantome?.type === 'batiment' && fantome.id === 'generateur'
  const taille = BATIMENTS.generateur.taille
  const centre = place ? { x: fantome.x + taille / 2, y: fantome.y + taille / 2 } : centreGenerateur(etat)
  if (!centre) return null
  const enVue = place || batimentActif === 'generateur'
  const allume = generateurEnMarche(etat)
  // (23/10) Plus de cercle en permanence quand il donne du courant : seulement en le regardant.
  if (!enVue) return null
  const r = rayonGenerateur(etat)
  const points = Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * 2 * Math.PI
    const p = versEcran(centre.x + r * Math.cos(angle), centre.y + r * Math.sin(angle))
    return `${p.x},${p.y}`
  }).join(' ')
  return <polygon className={`rayon-generateur ${enVue ? 'rayon-en-vue' : ''} ${allume ? 'rayon-allume' : ''}`} points={points} />
}

// (25/10) La flèche des rails : elle part du dernier rail posé et montre où va la voie (la case
// du rail proposé). Sans rail posé, elle traverse la case proposée dans le sens de départ.
function FlecheRail({ depuis, vers, sens }: { depuis: Case | null; vers: Case; sens: { x: number; y: number } }) {
  const de = depuis ? { x: depuis.x + 0.5, y: depuis.y + 0.5 } : { x: vers.x + 0.5 - sens.x * 0.45, y: vers.y + 0.5 - sens.y * 0.45 }
  const a = versEcran(de.x, de.y)
  const b = versEcran(vers.x + 0.5 + sens.x * 0.6, vers.y + 0.5 + sens.y * 0.6)
  // La pointe : un triangle au bout, tourné dans le sens de la flèche.
  const longueur = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ux = (b.x - a.x) / longueur
  const uy = (b.y - a.y) / longueur
  const base = { x: b.x - ux * 16, y: b.y - uy * 16 }
  const pointe = `${b.x},${b.y} ${base.x - uy * 12},${base.y + ux * 12} ${base.x + uy * 12},${base.y - ux * 12}`
  return (
    <g className="fleche-rail" pointerEvents="none">
      <line x1={a.x} y1={a.y} x2={base.x} y2={base.y} stroke="#2a2140" strokeWidth={13} strokeLinecap="round" />
      <polygon points={pointe} fill="#2a2140" stroke="#2a2140" strokeWidth={6} strokeLinejoin="round" />
      <line x1={a.x} y1={a.y} x2={base.x} y2={base.y} stroke="#f9d65a" strokeWidth={6} strokeLinecap="round" />
      <polygon points={pointe} fill="#f9d65a" />
    </g>
  )
}
