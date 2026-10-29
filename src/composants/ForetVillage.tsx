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
import { SUR_TELEPHONE } from '../fluidite'

// Toutes les images du décor : les arbres (dans l'ordre d'ARBRES), puis les vignettes du paysage.
const SORTES_PAYSAGE = Object.keys(VIGNETTES) as SorteVignette[]
const IMAGES: { fichier: string; largeur: number; hauteur: number }[] = [...ARBRES, ...SORTES_PAYSAGE.map((sorte) => VIGNETTES[sorte])]

// Un arbre de la lisière, ou une vignette du paysage.
type Arbre = {
  sorte: number // sa place dans IMAGES
  x: number
  y: number
  devant: boolean // en bas de la carte : il passe devant les bâtiments et les personnages
  paysage: boolean // une vignette du paysage (une colline, une montagne), pas un arbre de la lisière
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

// La lisière : à combien de cases du bord de la clairière poussent les troncs du premier rang,
// l'écart (en cases) entre deux arbres de ce rang, et la largeur du pied de chaque arbre (en
// cases). (26/10) Tous les arbres ont la même taille, ceux des collines et des montagnes aussi
// (TAILLE_ARBRE dans outils/art/montagnes.mjs) : avant, elle changeait un peu d'un arbre à l'autre.
const DISTANCE_LISIERE = 1.3
const ECART_LISIERE = 3.1
const TAILLE_ARBRE = 2

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
    // (27/10) Ni sur les trois arbres du coin du haut : le chemin du château passe par là.
    if (x + y < 1) return
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
      paysage: false,
      miroir,
      gauche: p.x - piedX * echelle,
      haut: p.y - image.pied.y * echelle,
      echelle,
    })
  }
  // Le premier rang, tout autour de la clairière : un carré de troncs à DISTANCE_LISIERE du bord,
  // un arbre tous les ECART_LISIERE (le côté est découpé en parts égales, pour que les coins
  // tombent juste). Seule la sorte change d'un arbre à l'autre.
  const debut = -DISTANCE_LISIERE
  const fin = n + DISTANCE_LISIERE
  const nbParCote = Math.round((fin - debut) / ECART_LISIERE)
  const ecart = (fin - debut) / nbParCote
  for (let i = 0; i < nbParCote; i++) {
    const t = debut + i * ecart
    planter(t, debut, TAILLE_ARBRE) // le bord du haut à droite
    planter(fin, t, TAILLE_ARBRE) // en bas à droite
    planter(fin - (t - debut), fin, TAILLE_ARBRE) // en bas à gauche
    planter(debut, fin - (t - debut), TAILLE_ARBRE) // en haut à gauche
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
      paysage: true,
      miroir: false, // (jamais en miroir : la lumière vient toujours de la gauche)
      gauche: e.x - image.pied.x * p.echelle,
      haut: e.y - image.pied.y * p.echelle,
      echelle: p.echelle,
    })
  }
  // Du fond vers l'avant : un arbre plus bas sur l'écran est dessiné par-dessus. Sauf derrière la
  // clairière (26/10) : là, les collines et les montagnes passent toutes sous la lisière. Elles
  // sont plus loin qu'elle, mais près des coins, une colline plantée sur le côté pouvait être plus
  // bas sur l'écran qu'un arbre de la lisière, et le cacher : la rangée avait un trou en haut.
  const rang = (a: Arbre) => (a.devant || a.paysage ? 0 : 1)
  return arbres.sort((a, b) => rang(a) - rang(b) || profondeur(a.x, a.y) - profondeur(b.x, b.y))
}

const FORET = planterForet()

// Les tuiles : des carrés de TUILE pixels du monde qui couvrent tout le décor. Chaque tuile est
// ensuite recadrée au plus près de ce qu'elle contient (sa largeur et sa hauteur) : une image plus
// petite chevauche moins le reste du village (moins de travail pour le navigateur).
const TUILE = 384
type Tuile = { gauche: number; haut: number; largeur: number; hauteur: number; arbres: Arbre[] }

function decouper(arbres: Arbre[]): Tuile[] {
  const tuiles = new Map<string, Tuile>()
  for (const a of arbres) {
    const image = IMAGES[a.sorte]
    const droite = a.gauche + image.largeur * a.echelle
    const bas = a.haut + image.hauteur * a.echelle
    for (let tx = Math.floor(a.gauche / TUILE); tx <= Math.floor(droite / TUILE); tx++) {
      for (let ty = Math.floor(a.haut / TUILE); ty <= Math.floor(bas / TUILE); ty++) {
        const cle = `${tx},${ty}`
        const tuile = tuiles.get(cle) ?? { gauche: tx * TUILE, haut: ty * TUILE, largeur: TUILE, hauteur: TUILE, arbres: [] }
        tuile.arbres.push(a) // déjà dans l'ordre, du fond vers l'avant
        tuiles.set(cle, tuile)
      }
    }
  }
  // Le recadrage : le rectangle qui contient tous les dessins de la tuile (sans sortir du carré).
  return [...tuiles.values()].map((tuile) => {
    const x1 = tuile.gauche + TUILE
    const y1 = tuile.haut + TUILE
    let g = x1
    let h = y1
    let d = tuile.gauche
    let b = tuile.haut
    for (const a of tuile.arbres) {
      const image = IMAGES[a.sorte]
      g = Math.min(g, Math.max(tuile.gauche, a.gauche))
      h = Math.min(h, Math.max(tuile.haut, a.haut))
      d = Math.max(d, Math.min(x1, a.gauche + image.largeur * a.echelle))
      b = Math.max(b, Math.min(y1, a.haut + image.hauteur * a.echelle))
    }
    const gauche = Math.floor(g)
    const haut = Math.floor(h)
    return { ...tuile, gauche, haut, largeur: Math.ceil(d) - gauche, hauteur: Math.ceil(b) - haut }
  })
}

const TUILES_DERRIERE = decouper(FORET.filter((a) => !a.devant))
// (26/10) La lisière de devant (le premier rang d'arbres, en bas de la clairière) a sa propre
// couche : en édition, elle devient translucide, pour voir les rails cachés derrière. Les collines
// et les montagnes de devant restent pleines (plus bas sur l'écran, elles passent par-dessus).
const TUILES_LISIERE_DEVANT = decouper(FORET.filter((a) => a.devant && !a.paysage))
const TUILES_DEVANT = decouper(FORET.filter((a) => a.devant && a.paysage))

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
  toile.width = Math.round(tuile.largeur * densite)
  toile.height = Math.round(tuile.hauteur * densite)
  const ctx = toile.getContext('2d')
  if (!ctx) return
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

// (25/10, fluidité) Une tuile dessinée devient une simple image (une <img>) : une « toile »
// (canvas) affichée dans la page coûte du travail au navigateur à chaque image, même si elle ne
// change jamais (le jeu passait de 10 à 22 images par seconde sans elles, sur un ordinateur lent).
// Une image, elle, est dessinée une fois puis simplement recopiée, comme le sol (ImageFigee).
// Les images à la densité 1 sont gardées pour tout le jeu (l'accueil et le village les partagent).
const IMAGES_DE_BASE = new Map<string, string>()

// Dessine la tuile dans une toile (hors de la page), puis en fait une image (une adresse « blob: »).
// En WebP sans perte : le navigateur le fabrique sans bloquer le jeu, plus vite qu'un PNG (un
// navigateur qui ne sait pas faire de WebP fait un PNG, c'est prévu).
function tuileEnImage(tuile: Tuile, densite: number, dessins: HTMLImageElement[]): Promise<string | null> {
  const toile = document.createElement('canvas')
  dessinerTuile(toile, tuile, densite, dessins)
  return new Promise((resoudre) => {
    toile.toBlob(
      (contenu) => {
        // (la toile n'est plus utile : on libère sa mémoire tout de suite)
        toile.width = 0
        toile.height = 0
        resoudre(contenu ? URL.createObjectURL(contenu) : null)
      },
      'image/webp',
      1,
    )
  })
}

function CoucheForet({ tuiles, vue, classe, extra = '', children }: { tuiles: Tuile[]; vue: VueForet; classe: string; extra?: string; children?: ReactNode }) {
  // Pour chaque tuile : l'adresse de son image, et la densité à laquelle elle est dessinée.
  const [sources, setSources] = useState<(string | undefined)[]>(() => tuiles.map((_, i) => IMAGES_DE_BASE.get(`${classe}-${i}`)))
  const densites = useRef<number[]>(tuiles.map((_, i) => (IMAGES_DE_BASE.has(`${classe}-${i}`) ? 1 : 0)))
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
  // On les fait deux par deux, en laissant le navigateur respirer entre deux (celles qu'on voit
  // d'abord) : le jeu ne se fige pas pendant qu'elles se dessinent. En attendant, chaque tuile
  // garde son image d'avant.
  useEffect(() => {
    if (!pretes) return
    // (28/10, fluidité sur téléphone) Un écran compté comme 2 pixels par point au plus, et au plus
    // 2 pixels par pixel du monde (au lieu de 3) : sur un téléphone, c'est déjà net, chaque tuile
    // se dessine plus de deux fois plus vite, et carte dézoomée, les tuiles n'ont rien à redessiner.
    const ecran = SUR_TELEPHONE ? Math.min(2, window.devicePixelRatio || 1) : window.devicePixelRatio || 1
    const densiteMax = SUR_TELEPHONE ? 2 : 3
    // (sur téléphone, arrondie au plus proche plutôt qu'au-dessus : un peu moins de tuiles à redessiner)
    const paliers = vue.z * ecran * 2
    const voulue = Math.min(densiteMax, Math.max(1, (SUR_TELEPHONE ? Math.round(paliers) : Math.ceil(paliers)) / 2))
    const aFaire: { i: number; densite: number; visible: boolean }[] = []
    tuiles.forEach((tuile, i) => {
      const visible = tuile.gauche < vue.x1 && tuile.gauche + tuile.largeur > vue.x0 && tuile.haut < vue.y1 && tuile.haut + tuile.hauteur > vue.y0
      const densite = visible ? voulue : Math.min(voulue, 1)
      // (28/10) Sur téléphone, une tuile déjà plus nette que voulu n'est pas redessinée (après un
      // dézoom, le téléphone redessinait toutes les tuiles en moins net : c'était la grosse
      // saccade). Elle n'est redessinée que pour devenir plus nette.
      // (29/10 : sur tous les appareils)
      const dejaAssez = densites.current[i] >= densite
      if (densites.current[i] !== densite && !dejaAssez) aFaire.push({ i, densite, visible })
    })
    aFaire.sort((a, b) => Number(b.visible) - Number(a.visible))
    let annule = false
    const minuteurs: number[] = []
    const suivante = async () => {
      const tache = aFaire.shift()
      if (!tache || annule) return
      const { i, densite } = tache
      const adresse = await tuileEnImage(tuiles[i], densite, pretes)
      if (annule || !adresse) {
        if (adresse) URL.revokeObjectURL(adresse)
        return
      }
      densites.current[i] = densite
      const cle = `${classe}-${i}`
      if (densite === 1 && !IMAGES_DE_BASE.has(cle)) IMAGES_DE_BASE.set(cle, adresse)
      setSources((avant) => {
        const ancienne = avant[i]
        // (on oublie l'ancienne image un peu plus tard, une fois la nouvelle affichée ; jamais
        // celles de la densité 1, gardées pour tout le jeu)
        if (ancienne && ![...IMAGES_DE_BASE.values()].includes(ancienne)) window.setTimeout(() => URL.revokeObjectURL(ancienne), 2000)
        const copie = [...avant]
        copie[i] = adresse
        return copie
      })
      minuteurs.push(window.setTimeout(suivante, 0))
    }
    // (deux à la fois : c'est deux fois plus rapide, et le jeu reste fluide)
    minuteurs.push(window.setTimeout(suivante, 0), window.setTimeout(suivante, 0))
    return () => {
      annule = true
      minuteurs.forEach(clearTimeout)
    }
  }, [pretes, tuiles, vue, classe])

  return (
    <div className={`foret-village ${classe} ${extra}`} aria-hidden="true">
      {tuiles.map((tuile, i) =>
        sources[i] ? (
          <img key={i} className="tuile-foret" src={sources[i]} alt="" draggable={false} style={{ left: tuile.gauche, top: tuile.haut, width: tuile.largeur, height: tuile.hauteur }} />
        ) : null,
      )}
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
// « translucide » (26/10) : en édition, la lisière de devant laisse voir ce qui est derrière.
export const ForetDevant = memo(function ForetDevant({ vue, translucide = false }: { vue: VueForet; translucide?: boolean }) {
  return (
    <>
      <CoucheForet tuiles={TUILES_LISIERE_DEVANT} vue={vue} classe="foret-lisiere" extra={translucide ? 'lisiere-translucide' : ''} />
      <CoucheForet tuiles={TUILES_DEVANT} vue={vue} classe="foret-devant" />
    </>
  )
})
