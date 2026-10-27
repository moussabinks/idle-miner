// Le décor du fond de l'écran d'accueil (20/10) : un village tout fait, dessiné comme dans le jeu
// (la clairière, la mine, les bâtiments, des décorations, des rails), avec des taupes qui vont et
// viennent et des wagonnets qui roulent. (27/10) C'est le village de rêve de la fin de partie,
// copié sur celui du propriétaire (voir BATIMENTS_SCENE).
// Rien n'est joué ici : c'est une image qui bouge. Elle remplit toute sa boîte, comme une photo
// recadrée (« cover »).

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BLOCS, DECORATIONS, type IdBatiment, type IdBloc, type IdDecoration, type IdRarete } from '../jeu/donnees'
import { t } from '../jeu/langue'
import {
  batimentPose,
  cheminEntre,
  cleCase,
  lireCle,
  longueurChemin,
  nouveauVillage,
  railsEntre,
  type BatimentPose,
  type Case,
  type Village,
} from '../jeu/village'
import { BoiteSvg, CaseChemin, RailsDuVillage, DessinDecoration, DessinEvolutionMine, TerrainVillage } from './DessinsVillage'
import { WagonnetPose } from './Wagonnet3D'
import { DUREE_VENTE, VenteWagonnet } from './WagonnetVillage'
import { ImageBatiment, Perso } from './ElementsVillage'
import { EauPlage, ObjetsPlage, SolPlage } from './PlageVillage'
import { ForetDerriere, ForetDevant } from './ForetVillage'
import { ChateauVillage, CheminChateau } from './ChateauVillage'
import { HAUTEUR_MONDE, LARGEUR_MONDE, LIMITES_TERRAIN, devant, hauteurDecoration, longueurTrace, orienter, profondeur, surLaTrace, surLeChemin, traceDeLaVoie, versEcran } from './iso'

// Un wagonnet vide (toujours le même objet : son dessin n'est pas refait à chaque image).
const VIDE = {}

// ---------------------------------------------------------------------------
// Le village de la scène (posé une fois pour toutes)
// ---------------------------------------------------------------------------

// (27/10, demandé par le propriétaire) Le village de rêve de la fin de partie, celui du
// propriétaire : tout est posé, symétrique de part et d'autre de l'axe mine → générateur → marché
// (le milieu de l'écran). Les rails font un losange autour du générateur, les ateliers s'y
// branchent, et deux boucles descendent jusqu'au marché.
const BATIMENTS_SCENE: BatimentPose[] = [
  { id: 'puits', x: 4, y: 4, miroir: false },
  { id: 'generateur', x: 17, y: 17, miroir: false },
  { id: 'marche', x: 28, y: 28, miroir: false },
  { id: 'employes', x: 2, y: 17, miroir: false },
  { id: 'foreuse', x: 17, y: 2, miroir: false },
  { id: 'joaillerie', x: 12, y: 27, miroir: false },
  { id: 'fonderie', x: 27, y: 12, miroir: false },
  // (la forge, en bas à gauche du marché, sous la boucle de gauche)
  { id: 'forgeron', x: 23, y: 34, miroir: true },
]

// Les décorations, elles aussi de part et d'autre de l'axe (une case (x, y) et son reflet (y, x)).
const DECORATIONS_SCENE: { id: IdDecoration; x: number; y: number; miroir?: boolean }[] = [
  // Entre la mine et le générateur : des fleurs sur l'axe, et des lanternes.
  { id: 'fleurs-violettes', x: 15, y: 15 },
  { id: 'fleurs-jaunes', x: 16, y: 15 },
  { id: 'fleurs-jaunes', x: 15, y: 16 },
  { id: 'fleurs-rouges', x: 12, y: 16 },
  { id: 'fleurs-rouges', x: 16, y: 12 },
  { id: 'fleurs-jaunes', x: 13, y: 18 },
  { id: 'fleurs-jaunes', x: 18, y: 13 },
  { id: 'lanterne', x: 11, y: 22 },
  { id: 'lanterne', x: 22, y: 11 },
  { id: 'buisson', x: 11, y: 19 },
  { id: 'buisson', x: 19, y: 11 },
  // Sous le générateur, une fontaine sur l'axe, et (27/10) une de chaque côté de lui ; dans les
  // boucles du marché, des bancs, des fleurs.
  { id: 'fontaine', x: 22, y: 22 },
  { id: 'fontaine', x: 14, y: 21 },
  { id: 'fontaine', x: 21, y: 14 },
  { id: 'buisson', x: 26, y: 26 },
  { id: 'fleurs-violettes', x: 25, y: 25 },
  { id: 'lanterne', x: 27, y: 25 },
  { id: 'lanterne', x: 25, y: 27 },
  { id: 'banc', x: 22, y: 27 },
  { id: 'banc', x: 27, y: 22, miroir: true },
  { id: 'fleurs-rouges', x: 21, y: 26 },
  { id: 'fleurs-rouges', x: 26, y: 21 },
  { id: 'fleurs-jaunes', x: 23, y: 28 },
  { id: 'fleurs-jaunes', x: 28, y: 23 },
  { id: 'buisson', x: 21, y: 28 },
  { id: 'buisson', x: 28, y: 21 },
  // Autour : des arbres, des tonneaux et des caisses devant les bâtiments.
  { id: 'cerisier', x: 4, y: 25 },
  { id: 'cerisier', x: 25, y: 4 },
  { id: 'arbre', x: 7, y: 31 },
  { id: 'arbre', x: 31, y: 7 },
  { id: 'sapin', x: 3, y: 34 },
  { id: 'sapin', x: 34, y: 3 },
  { id: 'fleurs-violettes', x: 8, y: 27 },
  { id: 'fleurs-violettes', x: 27, y: 8 },
  { id: 'tonneau', x: 33, y: 29 },
  { id: 'caisse', x: 29, y: 33 },
  { id: 'rocher', x: 36, y: 30 },
  { id: 'rocher', x: 30, y: 36 },
  { id: 'fleurs-jaunes', x: 18, y: 8 },
  { id: 'fleurs-jaunes', x: 8, y: 22 },
]

// Les rails, en lignes droites : de (x0, y0) à (x1, y1), case par case.
function ligne(x0: number, y0: number, x1: number, y1: number): Case[] {
  const cases: Case[] = []
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= n; i++) cases.push({ x: x0 + Math.sign(x1 - x0) * i, y: y0 + Math.sign(y1 - y0) * i })
  return cases
}

// Le losange autour du générateur (il part des deux faces du bas de la mine et se referme sous
// le générateur), les branches vers la foreuse, la fonderie, la joaillerie et le générateur, et
// les deux boucles qui prolongent les branches du générateur jusqu'au marché.
const RAILS_SCENE: Case[] = [
  ...ligne(14, 10, 24, 10),
  ...ligne(24, 11, 24, 24),
  ...ligne(10, 14, 10, 24),
  ...ligne(11, 24, 23, 24),
  ...ligne(20, 7, 20, 9),
  ...ligne(25, 14, 26, 14),
  ...ligne(14, 25, 14, 26),
  ...ligne(22, 19, 23, 19),
  ...ligne(19, 22, 19, 23),
  ...ligne(25, 19, 30, 19),
  ...ligne(30, 20, 30, 27),
  ...ligne(19, 25, 19, 30),
  ...ligne(20, 30, 27, 30),
]
// Des pavés devant le Personnel.
const CHEMINS_SCENE: Case[] = [7, 8, 9].flatMap((x) => [18, 19, 20].map((y) => ({ x, y })))

function villageDeLaScene(): Village {
  const village = nouveauVillage()
  village.batiments = BATIMENTS_SCENE.map((b) => ({ ...b }))
  village.rails = RAILS_SCENE.map((c) => cleCase(c.x, c.y))
  village.chemins = CHEMINS_SCENE.map((c) => cleCase(c.x, c.y))
  return village
}

const VILLAGE = villageDeLaScene()

// La voie de chaque wagonnet (une courbe douce dans les virages, comme dans le jeu), calculée une fois.
const TRACES: Partial<Record<IdBatiment, { x: number; y: number }[]>> = {}
for (const de of ['puits', 'foreuse', 'fonderie', 'joaillerie'] as IdBatiment[]) {
  const rails = railsEntre(VILLAGE, de, 'marche')
  if (rails) TRACES[de] = traceDeLaVoie(VILLAGE, rails, de, 'marche')
}

// Les mineurs qui font des allers-retours : d'où à où, leur rareté (la couleur du casque), et un
// décalage pour qu'ils ne marchent pas tous ensemble.
// (27/10) Des prénoms de gourmandises (Noisette, Pépite...), traduits dans chaque langue avec t()
// (avant, nomEmploye les laissait en français : ils ne sont pas dans NOMS_EMPLOYES).
const MINEURS_SCENE: { nom: string; de: IdBatiment; vers: IdBatiment; rarete: IdRarete; decalage: number }[] = [
  { nom: 'Noisette', de: 'puits', vers: 'marche', rarete: 'legendaire', decalage: 0 },
  { nom: 'Pépite', de: 'puits', vers: 'forgeron', rarete: 'epique', decalage: 0.35 },
  { nom: 'Caramel', de: 'puits', vers: 'marche', rarete: 'rare', decalage: 0.55 },
  { nom: 'Biscotte', de: 'puits', vers: 'employes', rarete: 'mythique', decalage: 0.8 },
]

// Les mineurs marchent à 4 cases par seconde dans le jeu : ici un peu moins, c'est plus joli.
const VITESSE_SCENE = 2.2
// (27/10, demandé par le propriétaire : 1,5 fois plus vite, avant 2,5)
const VITESSE_WAGONNET = 3.75

// (27/10) L'ascenseur de la mine monte plein de minerais, se vide en haut, redescend vide, se
// remplit en bas, et recommence (en secondes).
const ASCENSEUR = { trajet: 1.1, arret: 0.35 }
const CONTENU_ASCENSEUR = { or: 3, diamant: 2, emeraude: 2, rubis: 2, saphir: 1 }

// La hauteur de la caisse (0 : en haut, 1 : au fond) et si elle est pleine, à ce moment.
function caisseAscenseur(temps: number): { f: number; pleine: boolean } {
  const { trajet, arret } = ASCENSEUR
  const cycle = 2 * (trajet + arret)
  const t = ((temps % cycle) + cycle) % cycle
  const doux = (k: number) => k * k * (3 - 2 * k) // (elle démarre et s'arrête en douceur)
  if (t < trajet) return { f: 1 - doux(t / trajet), pleine: true } // elle monte
  if (t < trajet + arret) return { f: 0, pleine: true } // en haut : on la vide
  if (t < 2 * trajet + arret) return { f: doux((t - trajet - arret) / trajet), pleine: false } // elle redescend
  return { f: 1, pleine: false } // au fond : on la remplit
}

// Le rectangle du monde (en pixels) où tient tout le village de la scène : centré sur l'axe du
// village, un peu au-dessus du générateur (la mine, en haut, est haute).
const CENTRE_CADRE = versEcran(18, 18)
const CADRE = { x: CENTRE_CADRE.x - 370, y: CENTRE_CADRE.y - 340, l: 740, h: 640 }

// (27/10) Les wagonnets qui roulent vers le marché, chacun poussé par une taupe : d'où ils
// partent, leur chargement, la rareté du pousseur et un décalage pour qu'ils ne partent pas ensemble.
// « vente » : ce que rapporte son chargement au marché (le « +X $ » qui jaillit, comme dans le jeu).
const WAGONNETS_SCENE: { de: IdBatiment; nom: string; rarete: IdRarete; contenu: Partial<Record<IdBloc, number>>; vente: number; decalage: number }[] = [
  { de: 'puits', nom: 'Praline', rarete: 'mythique', contenu: { or: 3, diamant: 2, emeraude: 2, charbon: 3, pierre: 2 }, vente: 11475, decalage: 0 },
  { de: 'foreuse', nom: 'Chouquette', rarete: 'legendaire', contenu: { charbon: 4, fer: 3, redstone: 3 }, vente: 3240, decalage: 4 },
  { de: 'fonderie', nom: 'Myrtille', rarete: 'epique', contenu: { lingot_or: 4, lingot_fer: 4 }, vente: 6860, decalage: 9 },
  { de: 'joaillerie', nom: 'Galette', rarete: 'legendaire', contenu: { bijou_diamant: 2, bijou_rubis: 2, bijou_saphir: 2 }, vente: 18900, decalage: 13 },
]
// (le même écart entre le wagonnet et son pousseur que dans le jeu, voir WagonnetVillage)
const ESSIEUX = 0.6
const RECUL_POUSSEUR = 1.15

// L'arrêt au bout de chaque aller (et du retour), en secondes.
const PAUSE = 1.2

// Une position le long d'un aller-retour : on va, on attend un peu, on revient.
function allerRetour(longueur: number, vitesse: number, temps: number): { distance: number; retour: boolean; pause: boolean } {
  const trajet = longueur / vitesse
  const pause = PAUSE
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
        // (son ascenseur, qui bouge, est dessiné à chaque image : voir SceneAccueil)
      )
    } else {
      // (27/10, demandé par le propriétaire) La foreuse fore : sa mèche tourne, comme au village.
      objets.push(<ImageBatiment key={b.id} id={b.id} x={b.x} y={b.y} miroir={b.miroir} classe="" enMarche={b.id === 'foreuse'} />)
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
    <Perso key="joueur" qui="joueur" x={22.2} y={36.8} sens={-1} vue="face" marche={false} classe="perso-joueur" />,
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
  const vise = large ? { x: CADRE.x + CADRE.l / 2, y: CADRE.y + CADRE.h / 2 } : versEcran(18, 19)
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

  // L'ascenseur de la mine, qui monte et redescend.
  const mine = VILLAGE.batiments.find((b) => b.id === 'puits')
  if (mine) {
    const caisse = caisseAscenseur(temps)
    objets.push(
      <BoiteSvg key="puits-evolution" x={mine.x} y={mine.y} taille={10} hauteur={130} style={{ zIndex: profondeur(mine.x + 5, mine.y + 5) + 1 }}>
        <DessinEvolutionMine x={mine.x} y={mine.y} miroir={mine.miroir} niveau={7} ascenseur hauteurCabine={caisse.f} passagers={[{ f: caisse.f, pleine: caisse.pleine, contenu: CONTENU_ASCENSEUR }]} />
      </BoiteSvg>,
    )
  }

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
        etiquette={<span className={`etiquette-perso rarete-${m.rarete}`}>{t(m.nom)}</span>}
      />,
    )
  })

  // Les wagonnets qui font la navette jusqu'au marché, avec leur pousseur derrière eux.
  for (const w of WAGONNETS_SCENE) {
    const trace = TRACES[w.de]
    if (!trace) continue
    const longueur = longueurTrace(trace)
    const etape = allerRetour(longueur, VITESSE_WAGONNET, temps + w.decalage)
    // La vente au marché : quand il a fini de décharger (au début du retour), le « +X $ » doré
    // jaillit au bout de la voie pendant 2 secondes (un nouveau à chaque voyage).
    const cycle = 2 * (longueur / VITESSE_WAGONNET + PAUSE)
    const voyage = Math.floor((temps + w.decalage) / cycle)
    const depuisLaVente = (temps + w.decalage) - voyage * cycle - (longueur / VITESSE_WAGONNET + PAUSE)
    if (temps > 0 && depuisLaVente >= 0 && depuisLaVente < DUREE_VENTE / 1000) {
      const bout = surLaTrace(trace, Math.max(0, longueur - ESSIEUX / 2))
      const ou = versEcran(bout.x, bout.y)
      const objetsVendus = Object.keys(w.contenu)
        .sort((a, b) => BLOCS[b as IdBloc].prix - BLOCS[a as IdBloc].prix)
        .slice(0, 3)
        .map((id) => BLOCS[id as IdBloc].emoji)
      objets.push(
        <div key={`vente-${w.de}-${voyage}`} style={{ position: 'absolute', left: 0, top: 0, zIndex: 100000 }}>
          <VenteWagonnet vente={{ id: voyage, montant: w.vente, x: ou.x, y: ou.y - 46, objets: objetsVendus }} />
        </div>,
      )
    }
    const s = etape.distance
    const borne = (v: number) => Math.max(0, Math.min(longueur, v))
    const a = surLaTrace(trace, borne(s + ESSIEUX / 2))
    const b = surLaTrace(trace, borne(s - ESSIEUX / 2))
    const ici = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const dx = (etape.retour ? -1 : 1) * (a.x - b.x || a.dx)
    const dy = (etape.retour ? -1 : 1) * (a.y - b.y || a.dy)
    const pousseur = surLaTrace(trace, borne(s + (etape.retour ? RECUL_POUSSEUR : -RECUL_POUSSEUR)))
    const sens = orienter(dx, dy)
    objets.push(
      // (plein à l'aller, vide au retour : il a tout vendu au marché)
      <WagonnetPose key={`wagonnet-${w.de}`} x={ici.x} y={ici.y} dx={dx} dy={dy} remplissage={etape.retour ? 0 : 0.8} contenu={etape.retour ? VIDE : w.contenu} />,
      <Perso
        key={`pousseur-${w.de}`}
        qui={w.rarete}
        x={pousseur.x}
        y={pousseur.y}
        sens={sens.sens}
        vue={sens.vue}
        marche={!etape.pause}
        classe="perso-mineur perso-pousseur"
        etiquette={<span className={`etiquette-perso rarete-${w.rarete}`}>{t(w.nom)}</span>}
      />,
    )
  }

  return (
    <div ref={boiteRef} className="scene-accueil" aria-hidden="true">
      <div className="monde-village" style={{ transform: `scale(${z}) translate(${-gauche}px, ${-haut}px)` }}>
        <TerrainVillage />
        <SolPlage />
        {SOL}
        {/* (27/10) Le château en ruine et son chemin, comme au village */}
        <ForetDerriere vue={vueForet} />
        <ChateauVillage restaure={false} animation={false} touchable={false} />
        <CheminChateau />
        {/* (après le décor du fond : voir VueVillage) */}
        <EauPlage />
        <div className="objets-village">{objets}</div>
        <ObjetsPlage />
        <ForetDevant vue={vueForet} />
      </div>
    </div>
  )
}
