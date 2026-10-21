// La forêt autour de la clairière (21/10) : les arbres dessinés par l'équipe (12 sortes, en vue
// isométrique, même angle que les bâtiments), plantés tout autour de la clairière. Près du bord,
// ils sont plus espacés (une lisière naturelle), puis de plus en plus serrés. On ne peut pas y
// aller : la forêt est hors de la grille.
// Les arbres sont toujours plantés au même endroit (hasard à graine fixe) : la forêt ne change
// pas d'une partie à l'autre.
//
// Il y a plus de mille arbres : en faire mille images de la page rendait la carte lente à faire
// glisser. On les dessine donc dans des « toiles » (canvas), découpées en tuiles carrées, une
// fois pour toutes. Après un zoom, les tuiles qu'on voit sont redessinées avec plus de pixels
// (nettes de près) ; les autres restent légères.

import { memo, useEffect, useRef, useState } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { ARBRES } from './arbres'
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

// Combien de chances de tirer chaque sorte d'arbre (feuillus et sapins surtout, peu de palmiers).
const POIDS_SORTES = [3, 3, 3, 2.5, 3, 3, 1.5, 1.5, 0.6, 0.6, 3, 1.5]

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
  const pas = 1.55
  // Les cases à couvrir : tout ce que la caméra peut voir (les 4 coins de ses limites, avec une
  // marge pour les arbres qui dépassent au-dessus de leur pied).
  const { x0, y0, x1, y1 } = LIMITES_CAMERA
  const coins = [versGrille(x0 - 80, y0 - 20), versGrille(x1 + 80, y0 - 20), versGrille(x0 - 80, y1 + 160), versGrille(x1 + 80, y1 + 160)]
  const minX = Math.floor(Math.min(...coins.map((c) => c.x)))
  const maxX = Math.ceil(Math.max(...coins.map((c) => c.x)))
  const minY = Math.floor(Math.min(...coins.map((c) => c.y)))
  const maxY = Math.ceil(Math.max(...coins.map((c) => c.y)))
  for (let gx = minX; gx < maxX; gx += pas) {
    for (let gy = minY; gy < maxY; gy += pas) {
      const x = gx + (hasard() - 0.5) * 1.1
      const y = gy + (hasard() - 0.5) * 1.1
      // De combien de cases on est sorti de la clairière.
      const dehors = Math.max(-x, -y, x - n, y - n)
      if (dehors < 0.9) continue
      // La lisière : peu d'arbres tout près du bord, puis de plus en plus. Au fond de la forêt,
      // des arbres plus gros et moins nombreux (on n'en voit que le haut).
      const loin = dehors > 6
      const chance = dehors < 2 ? 0.3 : dehors < 3.5 ? 0.65 : loin ? 0.42 : 0.95
      if (hasard() > chance) continue
      // Seulement là où la caméra peut voir (un arbre haut dépasse au-dessus de son pied).
      const p = versEcran(x, y)
      if (p.x < x0 - 80 || p.x > x1 + 80 || p.y < y0 - 20 || p.y > y1 + 160) continue
      const sorte = tirerSorte()
      const taille = loin ? 2.5 + hasard() * 0.8 : 1.7 + hasard() * 0.7
      const miroir = hasard() < 0.5
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

const ASSOMBRIR = ['none', 'brightness(0.88) saturate(0.95)', 'brightness(0.76) saturate(0.9)']

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
