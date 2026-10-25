// Le décor autour de la clairière : la rangée d'arbres de la lisière (21/10), et au-delà, le
// paysage de collines et de montagnes (25/10, voir paysage.ts).
//
// La lisière : des arbres au style cartoon (7 sortes, voir arbres.ts), plantés bien en ligne tout
// autour de la clairière, à la même distance du bord et au même écart (22/10 : avant, certains
// troncs avançaient plus que d'autres dans la clairière). Ils sont toujours plantés au même
// endroit (hasard à graine fixe). On ne peut pas y aller : c'est hors de la grille.
//
// (25/10) Derrière la lisière, il y avait une forêt de 240 arbres : elle est remplacée par des
// collines et des montagnes enneigées (paysage.ts). Il y a beaucoup moins d'images à dessiner.
//
// Tout est dessiné dans des « toiles » (canvas), découpées en tuiles carrées, une fois pour
// toutes : en faire des centaines d'images de la page rendait la carte lente à faire glisser.
// Après un zoom, les tuiles qu'on voit sont redessinées avec plus de pixels (nettes de près) ;
// les autres restent légères. Seule l'eau de la cascade bouge (une toute petite animation à part,
// qui ne fait jamais redessiner les toiles).

import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE } from '../jeu/donnees'
import { ARBRES } from './arbres'
import { surLaPlage } from './plage'
import { DEMI_LARGEUR, profondeur, versEcran } from './iso'
import { VIGNETTES, deDevant, eauDeLaCascade, planterPaysage, type SorteVignette } from './paysage'

// Toutes les images du décor : les arbres (dans l'ordre d'ARBRES), puis les vignettes du paysage.
const SORTES_PAYSAGE = Object.keys(VIGNETTES) as SorteVignette[]
const IMAGES: { fichier: string; largeur: number; hauteur: number }[] = [...ARBRES, ...SORTES_PAYSAGE.map((sorte) => VIGNETTES[sorte])]

// Un arbre de la lisière, ou une vignette du paysage.
type Arbre = {
  sorte: number // sa place dans IMAGES
  x: number
  y: number
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
// l'écart (en cases) entre deux arbres de ce rang.
const DISTANCE_LISIERE = 1.3
const ECART_LISIERE = 3.1

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
  const planter = (x: number, y: number, taille: number) => {
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
    planter(t, debut, taille()) // le bord du haut à droite
    planter(fin, t, taille()) // en bas à droite
    planter(fin - (t - debut), fin, taille()) // en bas à gauche
    planter(debut, fin - (t - debut), taille()) // en haut à gauche
  }
  // Au-delà de la lisière : les collines et les montagnes.
  for (const p of planterPaysage()) {
    const image = VIGNETTES[p.sorte]
    const e = versEcran(p.x, p.y)
    arbres.push({
      sorte: ARBRES.length + SORTES_PAYSAGE.indexOf(p.sorte),
      x: p.x,
      y: p.y,
      devant: deDevant(p.x, p.y),
      miroir: false, // (jamais en miroir : la lumière vient toujours de la gauche)
      gauche: e.x - image.pied.x * p.echelle,
      haut: e.y - image.pied.y * p.echelle,
      echelle: p.echelle,
    })
  }
  // Du fond vers l'avant : un arbre plus bas sur l'écran est dessiné par-dessus.
  return arbres.sort((a, b) => profondeur(a.x, a.y) - profondeur(b.x, b.y))
}

const FORET = planterForet()

// Les tuiles : des carrés de TUILE pixels du monde qui couvrent tout le décor.
const TUILE = 384
type Tuile = { gauche: number; haut: number; arbres: Arbre[] }

function decouper(arbres: Arbre[]): Tuile[] {
  const tuiles = new Map<string, Tuile>()
  for (const a of arbres) {
    const image = IMAGES[a.sorte]
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

// Les images du décor, chargées une seule fois.
const images: HTMLImageElement[] = []
function chargerImages(): Promise<HTMLImageElement[]> {
  if (images.length === 0) {
    for (const dessin of IMAGES) {
      const image = new Image()
      image.src = dessin.fichier
      images.push(image)
    }
  }
  return Promise.all(images.map((image) => (image.complete ? Promise.resolve() : image.decode().catch(() => undefined)))).then(() => images)
}

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
      ctx.translate(IMAGES[a.sorte].largeur, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(image, 0, 0)
  }
}

// La partie du monde qu'on voit, et le zoom (une fois la caméra arrêtée).
export type VueForet = { x0: number; y0: number; x1: number; y1: number; z: number }

function CoucheForet({ tuiles, vue, classe, children }: { tuiles: Tuile[]; vue: VueForet; classe: string; children?: ReactNode }) {
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
      {children}
    </div>
  )
}

// L'eau de la cascade (25/10), qui coule par-dessus son dessin (montagne-cascade) : une petite
// boîte posée pile sur la bande d'eau, où des traits blancs descendent sans fin. Seul ce petit
// morceau bouge (en « transform », que le navigateur fait glisser sans rien redessiner), et il
// s'arrête quand la caméra ne le voit pas.
const EAU = eauDeLaCascade()
function Cascade({ vue }: { vue: VueForet }) {
  const visible = vue.x1 > EAU.x0 && vue.x0 < EAU.x1 && vue.y1 > EAU.y0 && vue.y0 < EAU.y1
  const largeur = EAU.x1 - EAU.x0
  const hauteur = EAU.y1 - EAU.y0
  // Des traits blancs (x, haut, longueur) sur une hauteur de MOTIF pixels, répétés deux fois : le
  // motif descend d'une hauteur de MOTIF, puis recommence (on ne voit pas la couture).
  const MOTIF = 60
  const traits = [
    [0.22, 4, 20],
    [0.62, 18, 26],
    [0.4, 40, 14],
    [0.8, 46, 10],
    [0.15, 34, 8],
  ]
  return (
    <div className={`cascade-village ${visible ? '' : 'cascade-arretee'}`} style={{ left: EAU.x0, top: EAU.y0, width: largeur, height: hauteur }}>
      <svg className="cascade-flot" width={largeur} height={MOTIF * 2 + hauteur} viewBox={`0 0 ${largeur} ${MOTIF * 2 + hauteur}`} aria-hidden="true">
        {Array.from({ length: Math.ceil(hauteur / MOTIF) + 2 }, (_, k) =>
          traits.map(([x, y, l], i) => <line key={`${k}-${i}`} x1={x * largeur} x2={x * largeur} y1={k * MOTIF + y} y2={k * MOTIF + y + l} />),
        )}
      </svg>
    </div>
  )
}

// Le décor derrière (en haut de la carte et sur les côtés) : sous les bâtiments.
export const ForetDerriere = memo(function ForetDerriere({ vue }: { vue: VueForet }) {
  return (
    <CoucheForet tuiles={TUILES_DERRIERE} vue={vue} classe="foret-derriere">
      <Cascade vue={vue} />
    </CoucheForet>
  )
})

// Le décor devant (en bas de la carte) : par-dessus les bâtiments et les personnages.
export const ForetDevant = memo(function ForetDevant({ vue }: { vue: VueForet }) {
  return <CoucheForet tuiles={TUILES_DEVANT} vue={vue} classe="foret-devant" />
})
