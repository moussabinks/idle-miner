// Le décor du haut de l'écran d'accueil (20/10) : un petit village tout fait, dessiné comme dans
// le jeu (la clairière, la mine au milieu, des bâtiments, des décorations, des rails), avec des
// taupes qui vont et viennent entre la mine, le marché et la forge, et un wagonnet qui roule.
// (25/10) Replacé sur la clairière de 40 × 40 cases (la mine au milieu, en 15 ; 15).
// Rien n'est joué ici : c'est une image qui bouge. Elle remplit toute sa boîte, comme une photo
// recadrée (« cover »).

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DECORATIONS, type IdBatiment, type IdDecoration, type IdRarete } from '../jeu/donnees'
import { nomEmploye, t } from '../jeu/langue'
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
import { EauPlage, ObjetsPlage, SolPlage } from './PlageVillage'
import { ForetDerriere, ForetDevant } from './ForetVillage'
import { HAUTEUR_MONDE, LARGEUR_MONDE, LIMITES_TERRAIN, devant, hauteurDecoration, orienter, profondeur, surLeChemin, versEcran } from './iso'

// ---------------------------------------------------------------------------
// Le village de la scène (posé une fois pour toutes)
// ---------------------------------------------------------------------------

// Le village tout autour de la mine (qui est au milieu de la clairière).
const BATIMENTS_SCENE: BatimentPose[] = [
  { id: 'puits', x: 15, y: 15, miroir: false },
  { id: 'marche', x: 13, y: 27, miroir: true },
  { id: 'forgeron', x: 27, y: 19, miroir: true },
  { id: 'employes', x: 6, y: 20, miroir: false },
  { id: 'foreuse', x: 26, y: 27, miroir: false },
  { id: 'generateur', x: 27, y: 8, miroir: false },
]

const DECORATIONS_SCENE: { id: IdDecoration; x: number; y: number; miroir?: boolean }[] = [
  { id: 'fontaine', x: 22, y: 28 },
  { id: 'statue', x: 11, y: 15 },
  { id: 'cerisier', x: 3, y: 14 },
  { id: 'cerisier', x: 32, y: 24 },
  { id: 'sapin', x: 2, y: 18 },
  { id: 'sapin', x: 32, y: 14 },
  { id: 'arbre', x: 3, y: 27 },
  { id: 'arbre', x: 24, y: 5 },
  { id: 'arbre', x: 20, y: 34 },
  { id: 'lanterne', x: 21, y: 26 },
  { id: 'lanterne', x: 25, y: 26 },
  { id: 'lanterne', x: 12, y: 25 },
  { id: 'tonneau', x: 19, y: 30 },
  { id: 'caisse', x: 20, y: 30 },
  { id: 'banc', x: 25, y: 30, miroir: true },
  { id: 'rocher', x: 33, y: 18 },
  { id: 'buisson', x: 5, y: 26 },
  { id: 'buisson', x: 31, y: 18 },
  { id: 'fleurs-rouges', x: 12, y: 19 },
  { id: 'fleurs-jaunes', x: 13, y: 20 },
  { id: 'fleurs-violettes', x: 12, y: 24 },
  { id: 'fleurs-rouges', x: 26, y: 15 },
  { id: 'fleurs-jaunes', x: 25, y: 14 },
  { id: 'fleurs-violettes', x: 17, y: 11 },
  { id: 'fleurs-jaunes', x: 16, y: 12 },
  { id: 'fleurs-rouges', x: 24, y: 33 },
  { id: 'cerisier', x: 33, y: 4 },
  { id: 'sapin', x: 29, y: 3 },
  { id: 'arbre', x: 36, y: 9 },
  { id: 'fleurs-jaunes', x: 34, y: 11 },
  { id: 'fleurs-violettes', x: 26, y: 6 },
  { id: 'buisson', x: 35, y: 13 },
  { id: 'rocher', x: 30, y: 14 },
  { id: 'lanterne', x: 26, y: 10 },
]

// Les rails de la mine au marché (avec un virage), et des chemins de pavés vers le Personnel
// et vers la forge.
const RAILS_SCENE: Case[] = [
  { x: 19, y: 25 },
  { x: 19, y: 26 },
  { x: 19, y: 27 },
  { x: 18, y: 27 },
]
const CHEMINS_SCENE: Case[] = [
  { x: 12, y: 22 },
  { x: 13, y: 22 },
  { x: 14, y: 22 },
  { x: 25, y: 24 },
  { x: 26, y: 24 },
  { x: 27, y: 24 },
  { x: 28, y: 24 },
  { x: 29, y: 24 },
]

function villageDeLaScene(): Village {
  const village = nouveauVillage()
  village.batiments = BATIMENTS_SCENE.map((b) => ({ ...b }))
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

// Le rectangle du monde (en pixels) où tient tout le village de la scène : centré un peu
// au-dessus de la mine (les bâtiments sont hauts), sur la case (19,2 ; 14,4).
const CENTRE_CADRE = versEcran(19.2, 14.4)
const CADRE = { x: CENTRE_CADRE.x - 350, y: CENTRE_CADRE.y - 280, l: 700, h: 560 }

// Une position le long d'un aller-retour : on va, on attend un peu, on revient.
function allerRetour(longueur: number, vitesse: number, temps: number): { distance: number; retour: boolean; pause: boolean } {
  const trajet = longueur / vitesse
  const pause = 1.2
  const cycle = 2 * (trajet + pause)
  const instant = ((temps % cycle) + cycle) % cycle
  if (instant < trajet) return { distance: instant * vitesse, retour: false, pause: false }
  if (instant < trajet + pause) return { distance: longueur, retour: false, pause: true }
  if (instant < 2 * trajet + pause) return { distance: longueur - (instant - trajet - pause) * vitesse, retour: true, pause: false }
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

// Ce qui ne bouge pas dans la scène (calculé une seule fois par langue : « noms », les
// étiquettes du manager et du recruteur).
function objetsFixes(noms: { manager: string; recruteur: string }): ReactNode[] {
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
      objets.push(<ImageBatiment key={b.id} id={b.id} x={b.x} y={b.y} miroir={b.miroir} classe="" />)
    }
  }
  // Les décorations du décor (on ne les achète plus dans le jeu, mais elles ornent l'accueil).
  DECORATIONS_SCENE.forEach((d, n) => {
    const taille = DECORATIONS[d.id].taille
    objets.push(
      <BoiteSvg key={`d${n}`} x={d.x} y={d.y} taille={taille} hauteur={hauteurDecoration(d.id)} style={{ zIndex: profondeur(d.x + taille / 2, d.y + taille / 2) }}>
        <DessinDecoration id={d.id} x={d.x} y={d.y} taille={taille} miroir={d.miroir ?? false} />
      </BoiteSvg>,
    )
  })

  // Le joueur, devant la mine.
  objets.push(
    <Perso key="joueur" qui="joueur" x={21.6} y={26.4} sens={-1} vue="face" marche={false} classe="perso-joueur" />,
  )

  // Le manager et le recruteur, à leur poste devant le Personnel.
  const personnel = batimentPose(VILLAGE, 'employes')
  if (personnel) {
    const pm = devant(personnel, 1, 0.9)
    const pr = devant(personnel, 0, 0.9)
    objets.push(
      <Perso key="manager" qui="manager" x={pm.x} y={pm.y} sens={-1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">{noms.manager}</span>} />,
      <Perso key="recruteur" qui="recruteur" x={pr.x} y={pr.y} sens={1} vue="face" marche={false} classe="perso-poste" etiquette={<span className="etiquette-perso etiquette-chef">{noms.recruteur}</span>} />,
    )
  }

  return objets
}


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

// (23/10) « marges » : la place prise par les panneaux du menu à gauche et à droite (en pixels) ;
// le village se met au milieu de ce qui reste.
export function SceneAccueil({ marges }: { marges?: { gauche: number; droite: number } } = {}) {
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
  // village, un peu plus gros, sous le bandeau du haut (25/10 : le bandeau cache le haut).
  const large = marges ? taille.l > marges.gauche + marges.droite + 200 : taille.l / taille.h > 1.5
  const margeGauche = marges ? marges.gauche : taille.l * 0.5
  const margeDroite = marges ? marges.droite : 0
  // (au moins 45 % de la largeur : sur un petit écran, le village passe un peu sous les panneaux)
  const largeurLibre = large ? Math.max(taille.l - margeGauche - margeDroite, taille.l * 0.45) : taille.l
  const zoomVillage = large ? Math.min(largeurLibre / CADRE.l, taille.h / CADRE.h) : Math.min(taille.l / 560, taille.h / 440)
  // Le décor (la forêt) doit toujours remplir toute la boîte.
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  const zoomMin = Math.max(taille.l / (x1 - x0), taille.h / (y1 - y0))
  const z = Math.max(zoomMin, zoomVillage)
  const centreX = large ? margeGauche + largeurLibre / 2 : taille.l / 2
  const centreY = large ? taille.h / 2 : taille.h * 0.62
  // Le point du monde qu'on met là : le milieu du village, ou le milieu de la mine sur téléphone.
  const vise = large ? { x: CADRE.x + CADRE.l / 2, y: CADRE.y + CADRE.h / 2 } : versEcran(20, 21)
  const borner = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const gauche = borner(vise.x - centreX / z, x0, x1 - taille.l / z)
  const haut = borner(vise.y - centreY / z, y0, y1 - taille.h / z)

  // Ce qu'on voit de la forêt (elle ne change que si la boîte change de taille).
  const vueForet = useMemo(() => ({ x0: gauche, y0: haut, x1: gauche + taille.l / z, y1: haut + taille.h / z, z }), [gauche, haut, taille, z])

  // Les bâtiments, les décorations et le joueur ne bougent pas : on les dessine une seule fois
  // (React ne redessine pas un élément qui n'a pas changé).
  // (refaits seulement si la langue change : les étiquettes « Manager » et « Recruteur »)
  const nomManager = t('Manager')
  const nomRecruteur = t('Recruteur')
  const objetsFixesDeLaScene = useMemo(() => objetsFixes({ manager: nomManager, recruteur: nomRecruteur }), [nomManager, nomRecruteur])
  const objets: ReactNode[] = [...objetsFixesDeLaScene]

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
        etiquette={<span className={`etiquette-perso rarete-${m.rarete}`}>{nomEmploye(m.nom)}</span>}
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
        {/* (après le décor du fond : voir VueVillage) */}
        <EauPlage />
        <div className="objets-village">{objets}</div>
        <ObjetsPlage />
        <ForetDevant vue={vueForet} />
      </div>
    </div>
  )
}
