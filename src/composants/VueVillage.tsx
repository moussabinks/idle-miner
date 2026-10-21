// Le village vu du ciel (vue isométrique, comme Clash of Clans) : le décor de la clairière, la
// mine au milieu, et tout ce que le joueur a posé (bâtiments, rails, chemins, décorations).
// On y voit le joueur, les mineurs employés qui vont à la forge ou attendent le wagonnet, le
// manager et le recruteur devant le Personnel, le wagonnet sur les rails (avec celui qui le
// pousse), le rayon du générateur, et des bulles de notification au-dessus des bâtiments.
// La caméra : on fait glisser la carte avec la souris ou le doigt, on zoome avec la molette ou en
// pinçant. Elle suit le joueur quand il marche.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { BATIMENTS, DECORATIONS, RARETES, VITESSE_MARCHE, type IdBatiment } from '../jeu/donnees'
import { centreGenerateur, generateurEnMarche, rayonGenerateur } from '../jeu/generateur'
import { foreuseEnMarche } from '../jeu/foreuse'
import { secondesTrajetMineur, type EtatJeu, type Employe } from '../jeu/mineur'
import { distanceDepuisLaMine, joueurPousse, ligneDuWagonnet, longueurTrajet } from '../jeu/wagonnet'
import type { Notification } from '../jeu/notifications'
import {
  batimentPose,
  cheminEntre,
  lireCle,
  longueurChemin,
  occupation,
  raccordsRail,
  type Case,
} from '../jeu/village'
import type { EtatJoueurVillage } from '../useJoueurVillage'
import { tailleFantome, type CibleVillage, type Fantome } from './fantome'
import {
  BoiteSvg,
  CaseChemin,
  CaseRail,
  DessinDecoration,
  DessinEvolutionMine,
  DessinWagonnet,
  LosangeEmprise,
  TerrainVillage,
} from './DessinsVillage'
import { AmbianceVillage } from './AmbianceVillage'
import { ImageBatiment, Perso } from './ElementsVillage'
import { ObjetsPlage, SolPlage } from './PlageVillage'
import { ForetDerriere, ForetDevant, type VueForet } from './ForetVillage'
import {
  HAUTEUR_MONDE,
  LIMITES_CAMERA,
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
  fantome: Fantome | null
  fantomeLibre: boolean
  pinceau: boolean // on peint des rails ou des chemins : chaque case touchée en reçoit un
  onTap: (c: Case, cible: CibleVillage | null) => void
  onSurvol: (c: Case) => void // la souris passe sur une case (le fantôme la suit tant qu'il n'est pas fixé)
  onGlisser: (c: Case) => void // on fait glisser le fantôme avec le doigt ou la souris
  onPeindre: (c: Case) => void // le doigt glisse sur une case en mode pinceau
  panneauOuvert: boolean // un panneau est ouvert à droite (ordinateur) : la caméra se décale à gauche
}

type Camera = { z: number; cx: number; cy: number; douce: boolean }

const ZOOM_MAX = 2.6

export function VueVillage({
  etat,
  joueur,
  notifications,
  batimentActif,
  fantome,
  fantomeLibre,
  pinceau,
  onTap,
  onSurvol,
  onGlisser,
  onPeindre,
  panneauOuvert,
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

  // On ne peut pas dézoomer au point de voir plus loin que les limites de la caméra.
  // Sur un grand écran, le panneau de droite cache une partie de la carte : le milieu de la vue
  // se décale vers la gauche pour que le joueur (et le bâtiment ouvert) restent visibles.
  const decalage = panneauOuvert && taille.l > 860 ? 210 : 0
  const milieuX = taille.l / 2 - decalage
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

  // Le wagonnet sur les rails : où il est, et dans quel sens il roule (pour la caméra et le dessin).
  const ligne = ligneDuWagonnet(etat)
  const wagonnet = (() => {
    if (!ligne) return null
    const k = distanceDepuisLaMine(etat) / longueurTrajet(ligne)
    const point = surLeChemin(ligne, k * longueurChemin(ligne))
    const retour = etat.wagonnet.etape === 'retour'
    return { ...point, dx: retour ? -point.dx : point.dx, dy: retour ? -point.dy : point.dy }
  })()
  // Quand le joueur pousse le wagonnet, c'est lui que la caméra suit.
  const pousse = joueurPousse(etat) && wagonnet !== null
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
      else if (occupant?.type === 'decoration') cible = { type: 'decoration', n: occupant.n }
      else if (occupant?.type === 'rail') cible = { type: 'rail', x: c.x, y: c.y }
      else if (occupant?.type === 'chemin') cible = { type: 'chemin', x: c.x, y: c.y }
    }
    onTap(c, cible)
  }

  function molette(e: React.WheelEvent) {
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

  // Les bâtiments (celui qu'on déplace est remplacé par son fantôme).
  for (const b of village.batiments) {
    if (fantome?.type === 'batiment' && fantome.id === b.id) continue
    const actif = b.id === batimentActif
    if (b.id === 'puits') {
      // La mine : son image, et par-dessus ce qui évolue (cabine d'ascenseur, niveau).
      objets.push(
        <ImageBatiment key="puits" id="puits" x={b.x} y={b.y} miroir={b.miroir} classe={actif ? 'sprite-actif' : ''} />,
        <BoiteSvg key="puits-evolution" x={b.x} y={b.y} taille={10} hauteur={130} style={{ zIndex: profondeur(b.x + 5, b.y + 5) + 1 }}>
          <DessinEvolutionMine
            x={b.x}
            y={b.y}
            miroir={b.miroir}
            niveau={etat.niveauMine}
            ascenseur={etat.ascenseur.niveau > 0}
            hauteurCabine={hauteurCabine(etat)}
          />
        </BoiteSvg>,
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
    objets.push(
      <ImageBatiment key="fantome" id={fantome.id} x={fantome.x} y={fantome.y} miroir={fantome.miroir} classe={`fantome ${fantomeLibre ? '' : 'fantome-bloque'}`} />,
    )
  } else if (fantome?.type === 'decoration') {
    const t = DECORATIONS[fantome.id].taille
    objets.push(
      <BoiteSvg key="fantome" x={fantome.x} y={fantome.y} taille={t} hauteur={hauteurDecoration(fantome.id)} classe={`fantome ${fantomeLibre ? '' : 'fantome-bloque'}`} style={{ zIndex: 99999 }}>
        <DessinDecoration id={fantome.id} x={fantome.x} y={fantome.y} taille={t} miroir={fantome.miroir} />
      </BoiteSvg>,
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
    if (mineur.etape === 'marche') {
      const chemin = cheminEntre(village, mineur.depuis, mineur.lieu)
      if (chemin) {
        const point = surLeChemin(chemin, Math.min(longueurChemin(chemin), mineur.progression * VITESSE_MARCHE))
        position = point
        orientation = orienter(point.dx, point.dy)
        marche = true
      }
      colere = mineur.tempsPaye <= 0
    } else if (mineur.etape === 'forge') {
      const b = batimentPose(village, 'forgeron')
      if (b) position = devant(b, 1 + (index % 4), 0.9)
    } else if (mineur.etape === 'quai' && ligne) {
      // Il attend le wagonnet à côté du début des rails.
      position = { x: ligne[0].x + 1.2 + 0.7 * auQuai, y: ligne[0].y + 0.3 + 0.5 * auQuai++ }
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

  // Le wagonnet sur les rails, et celui qui le pousse (toi ou un mineur), juste derrière lui.
  if (wagonnet) {
    const e = versEcran(wagonnet.x, wagonnet.y)
    objets.push(
      <svg
        key="wagonnet"
        className={`wagonnet-village ${etat.wagonnet.pousseur === 'electricite' ? 'wagonnet-electrique' : ''}`}
        style={{ left: e.x - 20, top: e.y - 28, zIndex: profondeur(wagonnet.x, wagonnet.y) + 4 }}
        viewBox={`${e.x - 20} ${e.y - 28} 40 34`}
        aria-hidden="true"
      >
        <DessinWagonnet c={e} plein={etat.wagonnet.etape === 'aller'} />
      </svg>,
    )
    const longueur = Math.hypot(wagonnet.dx, wagonnet.dy) || 1
    const derriere = { x: wagonnet.x - (wagonnet.dx / longueur) * 0.9, y: wagonnet.y - (wagonnet.dy / longueur) * 0.9 }
    const orientation = orienter(wagonnet.dx, wagonnet.dy)
    const roule = etat.wagonnet.etape !== 'quai'
    if (pousse) {
      objets.push(
        <Perso key="joueur" qui="joueur" x={derriere.x} y={derriere.y} sens={orientation.sens} vue={orientation.vue} marche classe="perso-joueur" />,
      )
    } else if (roule) {
      const mineur = etat.employes.find((m) => m.nom === etat.wagonnet.pousseur && m.etape === 'pousse')
      if (mineur) {
        objets.push(
          <Perso
            key="pousseur"
            qui={RARETES[mineur.rarete] ? mineur.rarete : 'commun'}
            x={derriere.x}
            y={derriere.y}
            sens={orientation.sens}
            vue={orientation.vue}
            marche
            classe="perso-mineur"
            etiquette={<span className={`etiquette-perso rarete-${mineur.rarete}`}>{mineur.nom}</span>}
          />,
        )
      }
    }
  }

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

  // Le sol : chemins, rails, grille, emprises.
  const sol = (
    <svg className="sol-village" viewBox={`0 0 ${LARGEUR_MONDE} ${HAUTEUR_MONDE}`} aria-hidden="true">
      <defs>
        <filter id="flou-ombre-batiment" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* Une ombre douce sous chaque bâtiment (la lumière vient d'en haut à gauche) : il est posé
          sur le sol, pas collé dessus. */}
      {village.batiments
        .filter((b) => b.id !== 'puits')
        .map((b) => (
          <polygon key={`ombre-${b.id}`} className="ombre-batiment" points={losange(b.x + 0.6, b.y + 0.2, BATIMENTS[b.id].taille - 0.5)} filter="url(#flou-ombre-batiment)" />
        ))}
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
      <div ref={mondeRef} className={`monde-village ${coucheRapide ? 'couche-rapide' : ''}`}>
        <TerrainVillage />
        <SolPlage />
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

// Où est la cabine de l'ascenseur (0 = en haut, 1 = en bas) : elle suit le premier mineur qui
// monte ou descend. Sinon, elle attend en haut.
function hauteurCabine(etat: EtatJeu): number {
  const mineur = etat.employes.find((m) => m.etape === 'monte' || m.etape === 'descend')
  if (!mineur) return 0
  const f = Math.min(1, mineur.progression / secondesTrajetMineur(etat))
  return mineur.etape === 'descend' ? f : 1 - f
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
