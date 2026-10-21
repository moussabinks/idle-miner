// Le décor du haut de l'écran d'accueil (20/10) : un petit village tout fait, dessiné comme dans
// le jeu (la clairière, la mine au milieu, des bâtiments, des décorations, des rails), avec des
// hamsters qui vont et viennent entre la mine, le marché et la forge, et un wagonnet qui roule.
// Rien n'est joué ici : c'est une image qui bouge. Elle remplit toute sa boîte, comme une photo
// recadrée (« cover »).

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { DECORATIONS, RARETES, type IdBatiment, type IdDecoration, type IdRarete } from '../jeu/donnees'
import {
  batimentPose,
  cheminEntre,
  cleCase,
  lireCle,
  longueurChemin,
  nouveauVillage,
  raccordsRail,
  railsMineMarche,
  type BatimentPose,
  type Case,
  type Village,
} from '../jeu/village'
import { BoiteSvg, CaseChemin, CaseRail, DessinDecoration, DessinMine, DessinWagonnet } from './DessinsVillage'
import { ImageBatiment, Perso } from './ElementsVillage'
import { Hamster } from './Hamster'
import { HAUTEUR_MONDE, LARGEUR_MONDE, devant, hauteurDecoration, orienter, profondeur, surLeChemin, versEcran } from './iso'

// ---------------------------------------------------------------------------
// Le village de la scène (posé une fois pour toutes)
// ---------------------------------------------------------------------------

// Le village est posé dans la moitié droite de la clairière : sur un ordinateur, le texte de
// l'accueil prend la moitié gauche de l'écran.
const BATIMENTS_SCENE: BatimentPose[] = [
  { id: 'puits', x: 20, y: 10, miroir: false },
  { id: 'marche', x: 18, y: 22, miroir: true },
  { id: 'forgeron', x: 32, y: 14, miroir: true },
  { id: 'employes', x: 11, y: 15, miroir: false },
  { id: 'enchanteur', x: 13, y: 3, miroir: false },
  { id: 'prestige', x: 23, y: 0, miroir: false },
  { id: 'bazar', x: 33, y: 4, miroir: false },
  { id: 'foreuse', x: 31, y: 22, miroir: false },
]

const DECORATIONS_SCENE: { id: IdDecoration; x: number; y: number; miroir?: boolean }[] = [
  { id: 'fontaine', x: 27, y: 23 },
  { id: 'statue', x: 16, y: 10 },
  { id: 'cerisier', x: 8, y: 9 },
  { id: 'cerisier', x: 37, y: 19 },
  { id: 'sapin', x: 7, y: 13 },
  { id: 'sapin', x: 37, y: 9 },
  { id: 'arbre', x: 8, y: 22 },
  { id: 'arbre', x: 29, y: 0 },
  { id: 'arbre', x: 25, y: 29 },
  { id: 'lanterne', x: 26, y: 21 },
  { id: 'lanterne', x: 30, y: 21 },
  { id: 'lanterne', x: 17, y: 20 },
  { id: 'tonneau', x: 24, y: 25 },
  { id: 'caisse', x: 25, y: 25 },
  { id: 'banc', x: 30, y: 25, miroir: true },
  { id: 'rocher', x: 38, y: 13 },
  { id: 'buisson', x: 10, y: 21 },
  { id: 'buisson', x: 36, y: 13 },
  { id: 'fleurs-rouges', x: 17, y: 14 },
  { id: 'fleurs-jaunes', x: 18, y: 15 },
  { id: 'fleurs-violettes', x: 17, y: 19 },
  { id: 'fleurs-rouges', x: 31, y: 10 },
  { id: 'fleurs-jaunes', x: 30, y: 9 },
  { id: 'fleurs-violettes', x: 22, y: 6 },
  { id: 'fleurs-jaunes', x: 21, y: 7 },
  { id: 'fleurs-rouges', x: 29, y: 28 },
]

// Les rails de la mine au marché (avec un virage), et des chemins de pavés vers le Personnel
// et vers la forge.
const RAILS_SCENE: Case[] = [
  { x: 24, y: 20 },
  { x: 24, y: 21 },
  { x: 24, y: 22 },
  { x: 23, y: 22 },
]
const CHEMINS_SCENE: Case[] = [
  { x: 17, y: 17 },
  { x: 18, y: 17 },
  { x: 19, y: 17 },
  { x: 30, y: 19 },
  { x: 31, y: 19 },
  { x: 32, y: 19 },
  { x: 33, y: 19 },
  { x: 34, y: 19 },
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

// Les mineurs qui font des allers-retours : d'où à où, leur rareté (la couleur du casque), leur
// pioche, et un décalage pour qu'ils ne marchent pas tous ensemble.
const MINEURS_SCENE: { nom: string; de: IdBatiment; vers: IdBatiment; rarete: IdRarete; pioche: string; decalage: number }[] = [
  { nom: 'Noisette', de: 'puits', vers: 'marche', rarete: 'legendaire', pioche: '#4ee8dc', decalage: 0 },
  { nom: 'Pépite', de: 'puits', vers: 'forgeron', rarete: 'epique', pioche: '#e6e6e6', decalage: 0.35 },
  { nom: 'Caramel', de: 'puits', vers: 'marche', rarete: 'rare', pioche: '#8f8f8f', decalage: 0.55 },
  { nom: 'Biscotte', de: 'puits', vers: 'employes', rarete: 'mythique', pioche: '#4ee8dc', decalage: 0.8 },
]

// Les mineurs marchent à 4 cases par seconde dans le jeu : ici un peu moins, c'est plus joli.
const VITESSE_SCENE = 2.2
const VITESSE_WAGONNET = 2.5

// Le rectangle du monde (en pixels) où tient tout le village de la scène.
const CADRE = { x: 695, y: 100, l: 700, h: 560 }

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
        <BoiteSvg key="puits" x={b.x} y={b.y} taille={10} hauteur={140} style={{ zIndex: profondeur(b.x + 5, b.y + 5) }}>
          <DessinMine x={b.x} y={b.y} miroir={b.miroir} fraction={0.55} ascenseur={3} cabineEnHaut={false} enMouvement nbMineurs={MINEURS_SCENE.length} />
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

  // Le joueur, devant la mine, sa pioche en diamant à la main.
  objets.push(
    <Perso key="joueur" x={26.6} y={21.4} sens={-1} vue="face" marche={false} classe="perso-joueur">
      {(vue) => <Hamster role="joueur" vue={vue} couleurPioche="#4ee8dc" />}
    </Perso>,
  )

  // Le manager et le recruteur, à leur poste devant le Personnel.
  const personnel = batimentPose(VILLAGE, 'employes')
  if (personnel) {
    const pm = devant(personnel, 1, 0.9)
    const pr = devant(personnel, 0, 0.9)
    objets.push(
      <Perso key="manager" x={pm.x} y={pm.y} sens={-1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Manager</span>}>
        {(vue) => <Hamster role="manager" vue={vue} />}
      </Perso>,
      <Perso key="recruteur" x={pr.x} y={pr.y} sens={1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">Recruteur</span>}>
        {(vue) => <Hamster role="recruteur" vue={vue} />}
      </Perso>,
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
    {VILLAGE.rails.map((cle) => {
      const c = lireCle(cle)
      return <CaseRail key={`r${cle}`} x={c.x} y={c.y} raccords={raccordsRail(VILLAGE, c.x, c.y)} />
    })}
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
  // Le décor doit toujours remplir toute la boîte.
  const zoomMin = Math.max(taille.l / LARGEUR_MONDE, taille.h / HAUTEUR_MONDE)
  const z = Math.max(zoomMin, zoomVillage)
  const centreX = taille.l * zoneTexte + largeurLibre / 2
  const centreY = large ? taille.h / 2 : taille.h * 0.4
  // Le point du monde qu'on met là : le milieu du village, ou le milieu de la mine sur téléphone.
  const vise = large ? { x: CADRE.x + CADRE.l / 2, y: CADRE.y + CADRE.h / 2 } : versEcran(25, 16)
  const borner = (v: number, max: number) => Math.max(0, Math.min(max, v))
  const gauche = borner(vise.x - centreX / z, LARGEUR_MONDE - taille.l / z)
  const haut = borner(vise.y - centreY / z, HAUTEUR_MONDE - taille.h / z)

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
    const couleur = RARETES[m.rarete].couleur
    objets.push(
      <Perso
        key={`m${i}`}
        x={point.x}
        y={point.y}
        sens={sens.sens}
        vue={sens.vue}
        marche={!etape.pause}
        classe="perso-mineur"
        etiquette={<span className={`etiquette-perso rarete-${m.rarete}`}>{m.nom}</span>}
      >
        {(vue) => <Hamster role="mineur" vue={vue} casque={couleur} couleurPioche={m.pioche} charge={!etape.retour && m.vers === 'marche'} />}
      </Perso>,
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
        style={{ left: e.x - 20, top: e.y - 28, zIndex: profondeur(point.x, point.y) + 4 }}
        viewBox={`${e.x - 20} ${e.y - 28} 40 34`}
        aria-hidden="true"
      >
        <DessinWagonnet c={e} parRails />
      </svg>,
    )
  }

  return (
    <div ref={boiteRef} className="scene-accueil" aria-hidden="true">
      <div className="monde-village" style={{ transform: `scale(${z}) translate(${-gauche}px, ${-haut}px)` }}>
        <img className="fond-village" src="/images/village/fond.webp" alt="" width={LARGEUR_MONDE} height={HAUTEUR_MONDE} draggable={false} />
        {SOL}
        <div className="objets-village">{objets}</div>
      </div>
    </div>
  )
}
