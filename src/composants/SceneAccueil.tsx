// Le décor du haut de l'écran d'accueil (20/10) : un petit village tout fait, dessiné comme dans
// le jeu (la clairière, la mine au milieu, des bâtiments, des décorations, des rails), avec des
// hamsters qui vont et viennent entre la mine, le marché et la forge, et un wagonnet qui roule.
// Rien n'est joué ici : c'est une image qui bouge. Elle remplit toute sa boîte, comme une photo
// recadrée (« cover »).

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DECORATIONS, type IdBatiment, type IdDecoration, type IdRarete } from '../jeu/donnees'
import {
  batimentPose,
  cheminEntre,
  cleCase,
  lireCle,
  longueurChemin,
  nouveauVillage,
  railsMineMarche,
  type BatimentPose,
  type Case,
  type Village,
} from '../jeu/village'
import { BoiteSvg, CaseChemin, RailsDuVillage, DessinDecoration, DessinEvolutionMine, TerrainVillage } from './DessinsVillage'
import { DessinWagonnet3D } from './Wagonnet3D'
import { ImageBatiment, Perso } from './ElementsVillage'
import { ObjetsPlage, SolPlage } from './PlageVillage'
import { ForetDerriere, ForetDevant } from './ForetVillage'
import { HAUTEUR_MONDE, LARGEUR_MONDE, LIMITES_TERRAIN, devant, hauteurDecoration, orienter, profondeur, surLeChemin, versEcran } from './iso'

// ---------------------------------------------------------------------------
// Le village de la scène (posé une fois pour toutes)
// ---------------------------------------------------------------------------

// Le village est posé dans la moitié droite de la clairière : sur un ordinateur, le texte de
// l'accueil prend la moitié gauche de l'écran.
const BATIMENTS_SCENE: BatimentPose[] = [
  { id: 'puits', x: 30, y: 20, miroir: false },
  { id: 'marche', x: 28, y: 32, miroir: true },
  { id: 'forgeron', x: 42, y: 24, miroir: true },
  { id: 'employes', x: 21, y: 25, miroir: false },
  { id: 'bazar', x: 43, y: 14, miroir: false },
  { id: 'foreuse', x: 41, y: 32, miroir: false },
  { id: 'generateur', x: 36, y: 4, miroir: false },
]

const DECORATIONS_SCENE: { id: IdDecoration; x: number; y: number; miroir?: boolean }[] = [
  { id: 'fontaine', x: 37, y: 33 },
  { id: 'statue', x: 26, y: 20 },
  { id: 'cerisier', x: 18, y: 19 },
  { id: 'cerisier', x: 47, y: 29 },
  { id: 'sapin', x: 17, y: 23 },
  { id: 'sapin', x: 47, y: 19 },
  { id: 'arbre', x: 18, y: 32 },
  { id: 'arbre', x: 39, y: 10 },
  { id: 'arbre', x: 35, y: 39 },
  { id: 'lanterne', x: 36, y: 31 },
  { id: 'lanterne', x: 40, y: 31 },
  { id: 'lanterne', x: 27, y: 30 },
  { id: 'tonneau', x: 34, y: 35 },
  { id: 'caisse', x: 35, y: 35 },
  { id: 'banc', x: 40, y: 35, miroir: true },
  { id: 'rocher', x: 48, y: 23 },
  { id: 'buisson', x: 20, y: 31 },
  { id: 'buisson', x: 46, y: 23 },
  { id: 'fleurs-rouges', x: 27, y: 24 },
  { id: 'fleurs-jaunes', x: 28, y: 25 },
  { id: 'fleurs-violettes', x: 27, y: 29 },
  { id: 'fleurs-rouges', x: 41, y: 20 },
  { id: 'fleurs-jaunes', x: 40, y: 19 },
  { id: 'fleurs-violettes', x: 32, y: 16 },
  { id: 'fleurs-jaunes', x: 31, y: 17 },
  { id: 'fleurs-rouges', x: 39, y: 38 },
]

// Les rails de la mine au marché (avec un virage), et des chemins de pavés vers le Personnel
// et vers la forge.
const RAILS_SCENE: Case[] = [
  { x: 34, y: 30 },
  { x: 34, y: 31 },
  { x: 34, y: 32 },
  { x: 33, y: 32 },
]
const CHEMINS_SCENE: Case[] = [
  { x: 27, y: 27 },
  { x: 28, y: 27 },
  { x: 29, y: 27 },
  { x: 40, y: 29 },
  { x: 41, y: 29 },
  { x: 42, y: 29 },
  { x: 43, y: 29 },
  { x: 44, y: 29 },
]

function villageDeLaScene(): Village {
  const village = nouveauVillage()
  village.batiments = BATIMENTS_SCENE.map((b) => ({ ...b }))
  village.decorations = DECORATIONS_SCENE.map((d, n) => ({ n, id: d.id, x: d.x, y: d.y, miroir: d.miroir ?? false }))
  village.prochainNumero = DECORATIONS_SCENE.length
  village.rails = RAILS_SCENE.map((c) => cleCase(c.x, c.y))
  village.chemins = CHEMINS_SCENE.map((c) => cleCase(c.x, c.y))
  return village
}

const VILLAGE = villageDeLaScene()

// Les mineurs qui font des allers-retours : d'où à où, leur rareté (la couleur du casque), et un
// décalage pour qu'ils ne marchent pas tous ensemble.
const MINEURS_SCENE: { nom: string; de: IdBatiment; vers: IdBatiment; rarete: IdRarete; decalage: number }[] = [
  { nom: 'Noisette', de: 'puits', vers: 'marche', rarete: 'legendaire', decalage: 0 },
  { nom: 'Pépite', de: 'puits', vers: 'forgeron', rarete: 'epique', decalage: 0.35 },
  { nom: 'Caramel', de: 'puits', vers: 'marche', rarete: 'rare', decalage: 0.55 },
  { nom: 'Biscotte', de: 'puits', vers: 'employes', rarete: 'mythique', decalage: 0.8 },
]

// Les mineurs marchent à 4 cases par seconde dans le jeu : ici un peu moins, c'est plus joli.
const VITESSE_SCENE = 2.2
const VITESSE_WAGONNET = 2.5

// Le rectangle du monde (en pixels) où tient tout le village de la scène.
const CADRE = { x: 1025, y: 291, l: 700, h: 560 }

// Une position le long d'un aller-retour : on va, on attend un peu, on revient.
function allerRetour(longueur: number, vitesse: number, temps: number): { distance: number; retour: boolean; pause: boolean } {
  const trajet = longueur / vitesse
  const pause = 1.2
  const cycle = 2 * (trajet + pause)
  const t = ((temps % cycle) + cycle) % cycle
  if (t < trajet) return { distance: t * vitesse, retour: false, pause: false }
  if (t < trajet + pause) return { distance: longueur, retour: false, pause: true }
  if (t < 2 * trajet + pause) return { distance: longueur - (t - trajet - pause) * vitesse, retour: true, pause: false }
  return { distance: 0, retour: true, pause: true }
}

// Le temps qui passe (en secondes), pour animer les personnages. Il reste à 0 si le joueur a
// demandé moins d'animations.
function useTemps(): number {
  const [temps, setTemps] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let image = 0
    const debut = performance.now()
    const avancer = (maintenant: number) => {
      setTemps((maintenant - debut) / 1000)
      image = requestAnimationFrame(avancer)
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [])
  return temps
}

// Ce qui ne bouge pas dans la scène (calculé une seule fois).
function objetsFixes(): ReactNode[] {
  const objets: ReactNode[] = []
  for (const b of VILLAGE.batiments) {
    if (b.id === 'puits') {
      objets.push(
        <ImageBatiment key="puits" id="puits" x={b.x} y={b.y} miroir={b.miroir} classe="" />,
        <BoiteSvg key="puits-evolution" x={b.x} y={b.y} taille={10} hauteur={130} style={{ zIndex: profondeur(b.x + 5, b.y + 5) + 1 }}>
          <DessinEvolutionMine x={b.x} y={b.y} miroir={b.miroir} niveau={3} ascenseur hauteurCabine={0.35} />
        </BoiteSvg>,
      )
    } else {
      objets.push(<ImageBatiment key={b.id} id={b.id} x={b.x} y={b.y} miroir={b.miroir} classe={b.id === 'foreuse' ? 'sprite-vibre' : ''} />)
    }
  }
  for (const d of VILLAGE.decorations) {
    const t = DECORATIONS[d.id].taille
    objets.push(
      <BoiteSvg key={`d${d.n}`} x={d.x} y={d.y} taille={t} hauteur={hauteurDecoration(d.id)} style={{ zIndex: profondeur(d.x + t / 2, d.y + t / 2) }}>
        <DessinDecoration id={d.id} x={d.x} y={d.y} taille={t} miroir={d.miroir} />
      </BoiteSvg>,
    )
  }

  // Le joueur, devant la mine.
  objets.push(
    <Perso key="joueur" qui="joueur" x={36.6} y={31.4} sens={-1} vue="face" marche={false} classe="perso-joueur" />,
  )

  // Le manager et le recruteur, à leur poste devant le Personnel.
  const personnel = batimentPose(VILLAGE, 'employes')
  if (personnel) {
    const pm = devant(personnel, 1, 0.9)
    const pr = devant(personnel, 0, 0.9)
    objets.push(
      <Perso key="manager" qui="manager" x={pm.x} y={pm.y} sens={-1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Manager</span>} />,
      <Perso key="recruteur" qui="recruteur" x={pr.x} y={pr.y} sens={1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Recruteur</span>} />,
    )
  }

  return objets
}

const OBJETS_FIXES = objetsFixes()

// Le sol : les chemins de pavés et les rails.
const SOL = (
  <svg className="sol-village" viewBox={`0 0 ${LARGEUR_MONDE} ${HAUTEUR_MONDE}`}>
    {VILLAGE.chemins.map((cle) => {
      const c = lireCle(cle)
      return <CaseChemin key={`ch${cle}`} x={c.x} y={c.y} />
    })}
    <RailsDuVillage village={VILLAGE} />
  </svg>
)

export function SceneAccueil() {
  const boiteRef = useRef<HTMLDivElement>(null)
  const [taille, setTaille] = useState({ l: 800, h: 450 })
  const temps = useTemps()

  useLayoutEffect(() => {
    const boite = boiteRef.current
    if (!boite) return
    const mesurer = () => setTaille({ l: boite.clientWidth, h: boite.clientHeight })
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(boite)
    return () => observateur.disconnect()
  }, [])

  // Dans une boîte large (ordinateur), le texte prend la moitié gauche : le village tient en
  // entier dans la moitié droite. Dans une boîte étroite (téléphone), on voit le milieu du
  // village, un peu plus gros, dans le haut de la boîte (le logo cache le bas).
  const large = taille.l / taille.h > 1.5
  const zoneTexte = large ? 0.5 : 0
  const largeurLibre = taille.l * (1 - zoneTexte)
  const zoomVillage = large ? Math.min(largeurLibre / CADRE.l, taille.h / CADRE.h) : Math.min(taille.l / 560, taille.h / 440)
  // Le décor (la forêt) doit toujours remplir toute la boîte.
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  const zoomMin = Math.max(taille.l / (x1 - x0), taille.h / (y1 - y0))
  const z = Math.max(zoomMin, zoomVillage)
  const centreX = taille.l * zoneTexte + largeurLibre / 2
  const centreY = large ? taille.h / 2 : taille.h * 0.4
  // Le point du monde qu'on met là : le milieu du village, ou le milieu de la mine sur téléphone.
  const vise = large ? { x: CADRE.x + CADRE.l / 2, y: CADRE.y + CADRE.h / 2 } : versEcran(35, 26)
  const borner = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const gauche = borner(vise.x - centreX / z, x0, x1 - taille.l / z)
  const haut = borner(vise.y - centreY / z, y0, y1 - taille.h / z)

  // Ce qu'on voit de la forêt (elle ne change que si la boîte change de taille).
  const vueForet = useMemo(() => ({ x0: gauche, y0: haut, x1: gauche + taille.l / z, y1: haut + taille.h / z, z }), [gauche, haut, taille, z])

  // Les bâtiments, les décorations et le joueur ne bougent pas : on les dessine une seule fois
  // (React ne redessine pas un élément qui n'a pas changé).
  const objets: ReactNode[] = [...OBJETS_FIXES]

  // Les mineurs qui vont et viennent.
  MINEURS_SCENE.forEach((m, i) => {
    const chemin = cheminEntre(VILLAGE, m.de, m.vers)
    if (!chemin) return
    const longueur = longueurChemin(chemin)
    const etape = allerRetour(longueur, VITESSE_SCENE, temps + m.decalage * (2 * longueur) / VITESSE_SCENE)
    const point = surLeChemin(chemin, etape.distance)
    const sens = etape.retour ? orienter(-point.dx, -point.dy) : orienter(point.dx, point.dy)
    objets.push(
      <Perso
        key={`m${i}`}
        qui={m.rarete}
        x={point.x}
        y={point.y}
        sens={sens.sens}
        vue={sens.vue}
        marche={!etape.pause}
        classe="perso-mineur"
        etiquette={<span className={`etiquette-perso rarete-${m.rarete}`}>{m.nom}</span>}
      />,
    )
  })

  // Le wagonnet qui fait la navette sur les rails.
  const rails = railsMineMarche(VILLAGE)
  if (rails) {
    const longueur = longueurChemin(rails)
    const point = surLeChemin(rails, allerRetour(longueur, VITESSE_WAGONNET, temps).distance)
    const e = versEcran(point.x, point.y)
    objets.push(
      <svg
        key="wagonnet"
        className="wagonnet-village"
        style={{ left: e.x - 40, top: e.y - 44, zIndex: profondeur(point.x, point.y) + 4 }}
        viewBox={`${e.x - 40} ${e.y - 44} 80 64`}
        width={80}
        height={64}
        aria-hidden="true"
      >
        <DessinWagonnet3D x={point.x} y={point.y} dx={point.dx} dy={point.dy} remplissage={0.8} contenu={{ or: 3, diamant: 2, emeraude: 2, charbon: 3, pierre: 2 }} />
      </svg>,
    )
  }

  return (
    <div ref={boiteRef} className="scene-accueil" aria-hidden="true">
      <div className="monde-village" style={{ transform: `scale(${z}) translate(${-gauche}px, ${-haut}px)` }}>
        <TerrainVillage />
        <SolPlage />
        {SOL}
        <ForetDerriere vue={vueForet} />
        <div className="objets-village">{objets}</div>
        <ObjetsPlage />
        <ForetDevant vue={vueForet} />
      </div>
    </div>
  )
}
