// La forêt autour de la clairière (21/10) : des arbres au style cartoon (7 sortes, voir arbres.ts),
// plantés tout autour de la clairière. Le premier
// rang (la lisière) est planté bien en ligne, à la même distance du bord et au même écart (22/10 :
// avant, certains troncs avançaient plus que d'autres dans la clairière). Derrière, la forêt est
// plus libre et de plus en plus serrée. On ne peut pas y aller : la forêt est hors de la grille.
// Les arbres sont toujours plantés au même endroit (hasard à graine fixe) : la forêt ne change
// pas d'une partie à l'autre.
//
// Il y a environ 240 arbres (25/10 : quatre fois moins qu'au début, pour aérer la carte) : en faire
// des centaines d'images de la page rendait la carte lente à faire
// glisser. On les dessine donc dans des « toiles » (canvas), découpées en tuiles carrées, une
// fois pour toutes. Après un zoom, les tuiles qu'on voit sont redessinées avec plus de pixels
// (nettes de près) ; les autres restent légères.

import { memo, useEffect, useRef, useState } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { ARBRES } from './arbres'
import { surLaPlage } from './plage'
import { DEMI_LARGEUR, LIMITES_CAMERA, profondeur, versEcran, versGrille } from './iso'

type Arbre = {
  sorte: number
  x: number
  y: number
  lointain: number // 0, 1 ou 2 : plus loin dans la forêt, l'arbre est un peu plus sombre
  devant: boolean // en bas de la carte : il passe devant les bâtiments et les personnages
  miroir: boolean
  // Où et à quelle taille on le dessine (en pixels du monde) : son coin haut-gauche et son échelle.
  gauche: number
  haut: number
  echelle: number
}

// Combien de chances de tirer chaque sorte d'arbre (dans l'ordre d'ARBRES : rond, nuage, sapin,
// buisson, cerisier, automne, palmier). Des feuillus et des sapins surtout, un peu de rose et de
// jaune pour égayer, et pas de palmier (ils sont sur la plage).
const POIDS_SORTES = [3, 3, 2.6, 1.6, 0.5, 0.25, 0]

// La lisière : à combien de cases du bord de la clairière poussent les troncs du premier rang, et
// l'écart (en cases) entre deux arbres de ce rang. Les autres arbres restent derrière ce rang.
// (25/10 : deux fois moins d'arbres qu'avant, pour aérer la carte ; puis encore deux fois moins,
// environ 230 : la lisière est un peu moins serrée, et la forêt derrière est faite de bosquets
// séparés par des clairières.)
const DISTANCE_LISIERE = 1.3
const ECART_LISIERE = 3.1
const RECUL_DERRIERE = 1.8
// L'écart moyen (en cases) entre deux arbres de la forêt, derrière la lisière.
const PAS_FORET = 2.9

// Des bosquets et des clairières : un nombre qui varie doucement d'un endroit à l'autre de la
// forêt (entre -1 et 1 à peu près). Là où il est bas, on plante moins : de l'herbe entre des
// groupes d'arbres, comme une vraie forêt, plutôt que des arbres tous au même écart.
function touffu(x: number, y: number): number {
  return 0.6 * Math.sin(x * 0.37 + 1.3) * Math.sin(y * 0.41 + 0.4) + 0.4 * Math.sin((x - y) * 0.23 + 2.1)
}

function planterForet(): Arbre[] {
  const hasard = aleatoireAvecGraine(2026)
  const total = POIDS_SORTES.reduce((a, b) => a + b, 0)
  const tirerSorte = () => {
    let r = hasard() * total
    for (let i = 0; i < POIDS_SORTES.length; i++) {
      r -= POIDS_SORTES[i]
      if (r < 0) return i
    }
    return 0
  }
  const arbres: Arbre[] = []
  const n = TAILLE_GRILLE
  // Planter un arbre dont le tronc est sur le point (x, y) de la grille, large de « taille » cases.
  const planter = (x: number, y: number, taille: number, dehors: number) => {
    // Pas d'arbre sur la plage ni dans la mer (en bas à gauche, voir PlageVillage).
    if (surLaPlage(x, y)) return
    const sorte = tirerSorte()
    const miroir = hasard() < 0.5
    const p = versEcran(x, y)
    // Le pied de l'image sur le point (x, y), la largeur du pied égale à « taille » cases.
    const image = ARBRES[sorte]
    const echelle = (taille * 2 * DEMI_LARGEUR) / image.largeurPied
    const piedX = miroir ? image.largeur - image.pied.x : image.pied.x
    arbres.push({
      sorte,
      x,
      y,
      lointain: dehors > 9 ? 2 : dehors > 5 ? 1 : 0,
      devant: x > n || y > n,
      miroir,
      gauche: p.x - piedX * echelle,
      haut: p.y - image.pied.y * echelle,
      echelle,
    })
  }
  // Le premier rang, tout autour de la clairière : un carré de troncs à DISTANCE_LISIERE du bord,
  // un arbre tous les ECART_LISIERE (le côté est découpé en parts égales, pour que les coins
  // tombent juste). Seule la taille et la sorte changent d'un arbre à l'autre.
  const debut = -DISTANCE_LISIERE
  const fin = n + DISTANCE_LISIERE
  const nbParCote = Math.round((fin - debut) / ECART_LISIERE)
  const ecart = (fin - debut) / nbParCote
  for (let i = 0; i < nbParCote; i++) {
    const t = debut + i * ecart
    const taille = () => 1.85 + hasard() * 0.3
    planter(t, debut, taille(), DISTANCE_LISIERE) // le bord du haut à droite
    planter(fin, t, taille(), DISTANCE_LISIERE) // en bas à droite
    planter(fin - (t - debut), fin, taille(), DISTANCE_LISIERE) // en bas à gauche
    planter(debut, fin - (t - debut), taille(), DISTANCE_LISIERE) // en haut à gauche
  }
  // Les cases à couvrir : tout ce que la caméra peut voir (les 4 coins de ses limites, avec une
  // marge pour les arbres qui dépassent au-dessus de leur pied).
  const { x0, y0, x1, y1 } = LIMITES_CAMERA
  const coins = [versGrille(x0 - 80, y0 - 20), versGrille(x1 + 80, y0 - 20), versGrille(x0 - 80, y1 + 160), versGrille(x1 + 80, y1 + 160)]
  const minX = Math.floor(Math.min(...coins.map((c) => c.x)))
  const maxX = Math.ceil(Math.max(...coins.map((c) => c.x)))
  const minY = Math.floor(Math.min(...coins.map((c) => c.y)))
  const maxY = Math.ceil(Math.max(...coins.map((c) => c.y)))
  for (let gx = minX; gx < maxX; gx += PAS_FORET) {
    for (let gy = minY; gy < maxY; gy += PAS_FORET) {
      // Chaque arbre bouge un peu autour de son point : on ne devine pas de quadrillage.
      const x = gx + (hasard() - 0.5) * 1.5
      const y = gy + (hasard() - 0.5) * 1.5
      // De combien de cases on est sorti de la clairière.
      const dehors = Math.max(-x, -y, x - n, y - n)
      // Rien devant la lisière : les autres arbres restent derrière le premier rang.
      if (dehors < DISTANCE_LISIERE + RECUL_DERRIERE) continue
      // Juste derrière la lisière, un peu moins d'arbres, puis de plus en plus. Au fond de la
      // forêt, des arbres plus gros et moins nombreux (on n'en voit que le haut).
      const loin = dehors > 6
      const chance = (dehors < 3.5 ? 0.42 : loin ? 0.38 : 0.62) + 0.42 * touffu(x, y)
      if (hasard() > chance) continue
      // Seulement là où la caméra peut voir (un arbre haut dépasse au-dessus de son pied).
      const p = versEcran(x, y)
      if (p.x < x0 - 80 || p.x > x1 + 80 || p.y < y0 - 20 || p.y > y1 + 160) continue
      planter(x, y, loin ? 1.95 + hasard() * 0.55 : 1.7 + hasard() * 0.5, dehors)
    }
  }
  // Du fond vers l'avant : un arbre plus bas sur l'écran est dessiné par-dessus.
  return arbres.sort((a, b) => profondeur(a.x, a.y) - profondeur(b.x, b.y))
}

const FORET = planterForet()

// Les tuiles : des carrés de TUILE pixels du monde qui couvrent toute la forêt.
const TUILE = 384
type Tuile = { gauche: number; haut: number; arbres: Arbre[] }

function decouper(arbres: Arbre[]): Tuile[] {
  const tuiles = new Map<string, Tuile>()
  for (const a of arbres) {
    const image = ARBRES[a.sorte]
    const droite = a.gauche + image.largeur * a.echelle
    const bas = a.haut + image.hauteur * a.echelle
    for (let tx = Math.floor(a.gauche / TUILE); tx <= Math.floor(droite / TUILE); tx++) {
      for (let ty = Math.floor(a.haut / TUILE); ty <= Math.floor(bas / TUILE); ty++) {
        const cle = `${tx},${ty}`
        const tuile = tuiles.get(cle) ?? { gauche: tx * TUILE, haut: ty * TUILE, arbres: [] }
        tuile.arbres.push(a) // déjà dans l'ordre, du fond vers l'avant
        tuiles.set(cle, tuile)
      }
    }
  }
  return [...tuiles.values()]
}

const TUILES_DERRIERE = decouper(FORET.filter((a) => !a.devant))
const TUILES_DEVANT = decouper(FORET.filter((a) => a.devant))

// Les images des arbres, chargées une seule fois.
const images: HTMLImageElement[] = []
function chargerImages(): Promise<HTMLImageElement[]> {
  if (images.length === 0) {
    for (const arbre of ARBRES) {
      const image = new Image()
      image.src = arbre.fichier
      images.push(image)
    }
  }
  return Promise.all(images.map((image) => (image.complete ? Promise.resolve() : image.decode().catch(() => undefined)))).then(() => images)
}

// Plus loin dans la forêt, les arbres sont un tout petit peu plus sombres (on devine la
// profondeur), sans devenir des taches sombres.
const ASSOMBRIR = ['none', 'brightness(0.95)', 'brightness(0.9)']

function dessinerTuile(toile: HTMLCanvasElement, tuile: Tuile, densite: number, dessins: HTMLImageElement[]): void {
  const taille = Math.round(TUILE * densite)
  if (toile.width !== taille) {
    toile.width = taille
    toile.height = taille
  }
  const ctx = toile.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, taille, taille)
  ctx.imageSmoothingQuality = 'high'
  for (const a of tuile.arbres) {
    const image = dessins[a.sorte]
    if (!image?.complete) continue
    ctx.setTransform(densite * a.echelle, 0, 0, densite * a.echelle, (a.gauche - tuile.gauche) * densite, (a.haut - tuile.haut) * densite)
    if (a.miroir) {
      ctx.translate(ARBRES[a.sorte].largeur, 0)
      ctx.scale(-1, 1)
    }
    ctx.filter = ASSOMBRIR[a.lointain]
    ctx.drawImage(image, 0, 0)
  }
  ctx.filter = 'none'
}

// La partie du monde qu'on voit, et le zoom (une fois la caméra arrêtée).
export type VueForet = { x0: number; y0: number; x1: number; y1: number; z: number }

function CoucheForet({ tuiles, vue, classe }: { tuiles: Tuile[]; vue: VueForet; classe: string }) {
  const toiles = useRef<(HTMLCanvasElement | null)[]>([])
  const densites = useRef<number[]>([])
  const [pretes, setPretes] = useState<HTMLImageElement[] | null>(null)

  useEffect(() => {
    let annule = false
    chargerImages().then((dessins) => {
      if (!annule) setPretes(dessins)
    })
    return () => {
      annule = true
    }
  }, [])

  // Une densité (pixels par pixel du monde) adaptée au zoom et à l'écran, par paliers. Les
  // tuiles qu'on voit sont redessinées à cette densité ; les autres restent à 1 (légères).
  useEffect(() => {
    if (!pretes) return
    const ecran = window.devicePixelRatio || 1
    const voulue = Math.min(3, Math.max(1, Math.ceil(vue.z * ecran * 2) / 2))
    tuiles.forEach((tuile, i) => {
      const toile = toiles.current[i]
      if (!toile) return
      const visible = tuile.gauche < vue.x1 && tuile.gauche + TUILE > vue.x0 && tuile.haut < vue.y1 && tuile.haut + TUILE > vue.y0
      const densite = visible ? voulue : Math.min(voulue, 1)
      if (densites.current[i] === densite) return
      densites.current[i] = densite
      dessinerTuile(toile, tuile, densite, pretes)
    })
  }, [pretes, tuiles, vue])

  return (
    <div className={`foret-village ${classe}`} aria-hidden="true">
      {tuiles.map((tuile, i) => (
        <canvas
          key={i}
          ref={(toile) => {
            toiles.current[i] = toile
          }}
          className="tuile-foret"
          style={{ left: tuile.gauche, top: tuile.haut, width: TUILE, height: TUILE }}
        />
      ))}
    </div>
  )
}

// Les arbres derrière (en haut de la carte et sur les côtés) : sous les bâtiments.
export const ForetDerriere = memo(function ForetDerriere({ vue }: { vue: VueForet }) {
  return <CoucheForet tuiles={TUILES_DERRIERE} vue={vue} classe="foret-derriere" />
})

// Les arbres devant (en bas de la carte) : par-dessus les bâtiments et les personnages.
export const ForetDevant = memo(function ForetDevant({ vue }: { vue: VueForet }) {
  return <CoucheForet tuiles={TUILES_DEVANT} vue={vue} classe="foret-devant" />
})
