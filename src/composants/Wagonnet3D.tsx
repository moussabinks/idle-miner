// Le wagonnet en 3D (26/10), d'après le dessin « wagonnets-design » de l'équipe (Google Drive) :
// une caisse en planches de bois, évasée vers le haut, tenue par un cadre en acier boulonné, sur
// quatre grosses roues en fer, avec un attelage devant. Chargé, il se remplit de minerais à
// facettes (charbon, pierre, fer, redstone, or, émeraude, diamant), plus ou moins haut selon ce
// qu'il porte : vide, à moitié plein, ou plein à ras bord (avec un petit tas qui dépasse).
//
// C'est un vrai petit modèle 3D, recalculé à chaque image : chaque face est un polygone en 3D,
// projeté dans la vue du village (la même que les rails en 3D), éclairé selon la direction de la
// lumière (en haut à gauche), avec son ombre portée sur le talus. Comme il est recalculé, il peut
// tourner d'un tout petit angle à la fois : il prend les virages en douceur.
//
// Les coordonnées : en cases. « a » va vers l'avant du wagonnet, « b » vers sa gauche, « z » vers
// le haut (0 : le sol ; le dessus des rails est à 0,195).

import type { IdBloc } from '../jeu/donnees'
import { versEcran } from './iso'
import { minerais } from './minerais'

type P3 = [number, number, number]
type Point = { x: number; y: number }

const HAUTEUR_Z = 19.05 // une case de hauteur, en pixels du monde (comme les rails en 3D)

const normer = (v: P3): P3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}
const scalaire = (a: P3, b: P3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const moins = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const vectoriel = (a: P3, b: P3): P3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

// La lumière (en haut à gauche de l'écran) et la caméra : les mêmes que pour les rails.
const LUMIERE = normer([-0.62, -0.18, 0.76])
const CAMERA = normer([1, 1, 1])
const MI_CHEMIN = normer([LUMIERE[0] + CAMERA[0], LUMIERE[1] + CAMERA[1], LUMIERE[2] + CAMERA[2]])

// --- Les dimensions (en cases) ----------------------------------------------------------------
const RAIL = 0.195 // le dessus des rails
const ROUE = { r: 0.13, a: 0.3, b: 0.4, epaisseur: 0.055 } // les roues roulent sur les rails (à ±0,4)
const CAISSE = { bas: 0.36, haut: 0.86, a0: 0.38, b0: 0.27, a1: 0.5, b1: 0.4 } // évasée vers le haut
const REBORD = 0.035 // le cadre d'acier qui fait le tour du haut

// --- Les couleurs ------------------------------------------------------------------------------
const BOIS = '#c48450'
const BOIS_DEDANS = '#a06a40'
const ACIER = '#a3aab5'
const ACIER_SOMBRE = '#5a606b'
const FER_ROUE = '#4a4f58'

function lireCouleur(couleur: string): P3 {
  const n = parseInt(couleur.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// La couleur d'une face selon sa normale : la lumière du ciel, celle du soleil, et un reflet
// (pour l'acier).
function eclairer(couleur: string, normale: P3, brillance = 0, ombre = 1): string {
  const [r, v, b] = lireCouleur(couleur)
  const soleil = Math.max(0, scalaire(normale, LUMIERE)) * ombre
  const facteur = 0.62 + 0.14 * normale[2] + 0.5 * soleil
  const reflet = brillance * Math.pow(Math.max(0, scalaire(normale, MI_CHEMIN)), 24) * 150 * ombre
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x * facteur + reflet)))
  return `rgb(${c(r)} ${c(v)} ${c(b)})`
}

// --- Les minerais du chargement ----------------------------------------------------------------
// Chaque bloc a son minerai à facettes : un cristal (redstone, or, émeraude, diamant) ou un
// caillou (pierre, charbon, fer).
const MINERAIS: Record<IdBloc, { couleur: string; cristal: boolean }> = {
  pierre: { couleur: '#b5aa9c', cristal: false },
  charbon: { couleur: '#3a3a42', cristal: false },
  fer: { couleur: '#cdb79a', cristal: false },
  redstone: { couleur: '#e0303a', cristal: true },
  or: { couleur: '#f2b32a', cristal: true },
  emeraude: { couleur: '#28b467', cristal: true },
  diamant: { couleur: '#4cc0f2', cristal: true },
}

function nuance(couleur: string, facteur: number): string {
  const [r, v, b] = lireCouleur(couleur)
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x * facteur)))
  return `rgb(${c(r)} ${c(v)} ${c(b)})`
}

// Un minerai à l'écran (taille t en pixels) : ses facettes éclairées en haut à gauche.
// (aussi dans la caisse de l'ascenseur de la mine, pour que tous les minerais se ressemblent)
export function Minerai({ x, y, t, bloc, variante }: { x: number; y: number; t: number; bloc: IdBloc; variante: number }) {
  const { couleur, cristal } = MINERAIS[bloc]
  const p = (liste: [number, number][]) => liste.map(([a, b]) => `${(x + a * t).toFixed(1)},${(y + b * t).toFixed(1)}`).join(' ')
  if (cristal) {
    // Un cristal taillé : la table (le dessus), les facettes de gauche et de droite, la pointe.
    return (
      <g>
        <polygon points={p([[-1, -0.15], [-0.55, -0.75], [0.55, -0.75], [1, -0.15], [0, 0.85]])} fill={nuance(couleur, 0.62)} stroke="rgb(20 14 10 / 0.75)" strokeWidth={0.12 * t} strokeLinejoin="round" />
        <polygon points={p([[-0.45, -0.45], [-0.25, -0.72], [0.25, -0.72], [0.45, -0.45], [0, -0.2]])} fill={nuance(couleur, 1.35)} />
        <polygon points={p([[-1, -0.15], [-0.45, -0.45], [0, -0.2], [0, 0.85]])} fill={nuance(couleur, 1.05)} />
        <polygon points={p([[-0.45, -0.45], [-0.55, -0.75], [-0.25, -0.72]])} fill={nuance(couleur, 1.5)} />
        <circle cx={x - 0.3 * t} cy={y - 0.55 * t} r={0.13 * t} fill="#ffffff" opacity={0.7} />
      </g>
    )
  }
  // Un caillou à facettes, un peu différent selon la variante.
  const formes: [number, number][][] = [
    [[-0.95, 0.2], [-0.7, -0.55], [0.05, -0.85], [0.8, -0.45], [0.95, 0.25], [0.2, 0.75], [-0.55, 0.65]],
    [[-0.9, 0.05], [-0.45, -0.7], [0.45, -0.75], [0.95, -0.1], [0.6, 0.6], [-0.3, 0.75]],
    [[-1, -0.1], [-0.5, -0.65], [0.3, -0.8], [0.9, -0.3], [0.85, 0.4], [0, 0.8], [-0.7, 0.55]],
  ]
  const forme = formes[variante % formes.length]
  return (
    <g>
      <polygon points={p(forme)} fill={nuance(couleur, 0.7)} stroke="rgb(20 14 10 / 0.75)" strokeWidth={0.12 * t} strokeLinejoin="round" />
      <polygon points={p([forme[0], forme[1], forme[2], [0.05, -0.1]])} fill={nuance(couleur, 1.18)} />
      <polygon points={p([forme[2], forme[3], [0.55, 0.05], [0.05, -0.1]])} fill={nuance(couleur, 0.95)} />
      <circle cx={x - 0.4 * t} cy={y - 0.35 * t} r={0.12 * t} fill="#ffffff" opacity={0.35} />
    </g>
  )
}

// --- Le dessin ----------------------------------------------------------------------------------
type Props = {
  x: number // le milieu du wagonnet, sur la grille (en cases)
  y: number
  dx: number // sa direction (vers l'avant)
  dy: number
  remplissage: number // de 0 (vide) à 1 (plein)
  contenu: Partial<Record<IdBloc, number>> // ce qu'il porte (pour les couleurs des minerais)
}

export function DessinWagonnet3D({ x, y, dx, dy, remplissage, contenu }: Props) {
  const l = Math.hypot(dx, dy) || 1
  const av: P3 = [dx / l, dy / l, 0] // vers l'avant
  const ga: P3 = [-dy / l, dx / l, 0] // vers la gauche
  // Un point du wagonnet (a, b, z) → la grille en 3D.
  const monde = (a: number, b: number, z: number): P3 => [x + a * av[0] + b * ga[0], y + a * av[1] + b * ga[1], z]
  // → l'écran.
  const ecran = (p: P3): Point => {
    const e = versEcran(p[0], p[1])
    return { x: e.x, y: e.y - p[2] * HAUTEUR_Z }
  }
  const pts = (liste: P3[]) =>
    liste
      .map(ecran)
      .map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`)
      .join(' ')
  const normaleDe = (liste: P3[], dedans: P3): P3 => {
    let n = normer(vectoriel(moins(liste[1], liste[0]), moins(liste[2], liste[0])))
    const centre = liste.reduce<P3>((s, p) => [s[0] + p[0] / liste.length, s[1] + p[1] / liste.length, s[2] + p[2] / liste.length], [0, 0, 0])
    if (scalaire(n, moins(centre, dedans)) < 0) n = [-n[0], -n[1], -n[2]]
    return n
  }
  const milieuCaisse = monde(0, 0, (CAISSE.bas + CAISSE.haut) / 2)

  // Les huit coins de la caisse.
  const { a0, b0, a1, b1, bas, haut } = CAISSE
  const coinsBas = [monde(a0, b0, bas), monde(a0, -b0, bas), monde(-a0, -b0, bas), monde(-a0, b0, bas)]
  const coinsHaut = [monde(a1, b1, haut), monde(a1, -b1, haut), monde(-a1, -b1, haut), monde(-a1, b1, haut)]

  // L'ombre portée sur le talus : la caisse et les roues projetées le long de la lumière.
  const auSol = (p: P3): Point => {
    // (Un peu plus courte que la vraie, pour qu'elle reste sous le wagonnet et sur sa voie.)
    const q: P3 = [p[0] - (p[2] * LUMIERE[0] * 0.65) / LUMIERE[2], p[1] - (p[2] * LUMIERE[1] * 0.65) / LUMIERE[2], 0]
    return ecran(q)
  }
  const ombre = enveloppe([...coinsBas, ...coinsHaut, monde(ROUE.a, ROUE.b, RAIL), monde(-ROUE.a, ROUE.b, RAIL), monde(ROUE.a, -ROUE.b, RAIL), monde(-ROUE.a, -ROUE.b, RAIL)].map(auSol))
  const texteOmbre = ombre.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')

  // Les quatre parois : celles tournées vers nous sont « devant » (on voit leur face extérieure),
  // les autres « derrière » (on voit leur face intérieure, par l'ouverture).
  const parois = [0, 1, 2, 3].map((i) => {
    const j = (i + 1) % 4
    const quad = [coinsBas[i], coinsBas[j], coinsHaut[j], coinsHaut[i]]
    const n = normaleDe(quad, milieuCaisse)
    return { quad, n, devant: scalaire(n, CAMERA) > 0 }
  })

  // Les planches d'une paroi : des lignes à 1/4, 1/2 et 3/4 de sa hauteur.
  const planches = (quad: P3[]) =>
    [0.27, 0.52, 0.76].map((t) => {
      const g = quad[0].map((v, k) => v + (quad[3][k] - v) * t) as P3
      const d = quad[1].map((v, k) => v + (quad[2][k] - v) * t) as P3
      return pts([g, d])
    })

  // Les montants d'acier, le long des arêtes de la caisse, sur une paroi de devant.
  const montants = (quad: P3[]) => {
    const bande = (gauche: boolean) => {
      const [p0, p1, p2, p3] = quad
      const k = 0.16
      const mix = (a: P3, b: P3, t: number) => a.map((v, i) => v + (b[i] - v) * t) as P3
      return gauche ? [p0, mix(p0, p1, k), mix(p3, p2, k), p3] : [mix(p0, p1, 1 - k), p1, p2, mix(p3, p2, 1 - k)]
    }
    return [bande(true), bande(false)]
  }

  // Une roue : deux disques (l'épaisseur) et le moyeu. « devant » : du côté de la caméra.
  const roue = (a: number, b: number, cle: string) => {
    const cote = Math.sign(b)
    const centre = (decalage: number, rayon: number) =>
      Array.from({ length: 14 }, (_, k) => {
        const t = (k / 14) * Math.PI * 2
        return monde(a + Math.cos(t) * rayon, b + decalage, RAIL + ROUE.r + Math.sin(t) * rayon)
      })
    const exterieur: P3 = [ga[0] * cote, ga[1] * cote, 0]
    const vueDehors = scalaire(exterieur, CAMERA) > 0
    const face = vueDehors ? ROUE.epaisseur / 2 : -ROUE.epaisseur / 2
    const n: P3 = vueDehors ? exterieur : [-exterieur[0], -exterieur[1], 0]
    return (
      <g key={cle}>
        <polygon points={pts(centre(-face * cote, ROUE.r))} fill="#24262c" stroke="#111216" strokeWidth={0.5} />
        <polygon points={pts(centre(face * cote, ROUE.r))} fill={eclairer(FER_ROUE, n, 0.6)} stroke="#15171b" strokeWidth={0.6} />
        <polygon points={pts(centre(face * cote, ROUE.r * 0.72))} fill={eclairer(ACIER_SOMBRE, n, 0.3)} />
        <polygon points={pts(centre(face * cote * 1.6, ROUE.r * 0.34))} fill={eclairer(ACIER, n, 0.9)} stroke="#2a2d33" strokeWidth={0.4} />
      </g>
    )
  }
  const gaucheDevant = scalaire(ga, CAMERA) > 0 // les roues de gauche sont-elles du côté de la caméra ?
  const rouesDerriere = [ROUE.a, -ROUE.a].map((a) => roue(a, gaucheDevant ? -ROUE.b : ROUE.b, `rd${a}`))
  const rouesDevant = [ROUE.a, -ROUE.a].map((a) => roue(a, gaucheDevant ? ROUE.b : -ROUE.b, `rv${a}`))

  // Le chargement : des minerais posés sur une surface qui monte avec le remplissage (et un petit
  // tas au-dessus du bord quand il est presque plein).
  const liste = remplissage > 0 ? minerais(contenu) : []
  const niveau = bas + 0.05 + Math.min(1, remplissage) * (haut - bas - 0.06)
  const t = (niveau - bas) / (haut - bas)
  const ha = a0 + (a1 - a0) * t - 0.06
  const hb = b0 + (b1 - b0) * t - 0.06
  const tas = Math.max(0, remplissage - 0.75) / 0.25
  const cailloux: { p: Point; profondeur: number; bloc: IdBloc; taille: number; variante: number }[] = []
  if (liste.length > 0) {
    let n = 0
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const decale = ((i + j) % 2) * 0.05
        const a = -ha + ((i + 0.5) / 4) * 2 * ha + decale
        const b = -hb + ((j + 0.5) / 3) * 2 * hb - decale
        const bosse = tas * 0.12 * (1 - (a / (ha + 0.06)) ** 2) * (1 - (b / (hb + 0.06)) ** 2)
        const p = monde(a, b, niveau + bosse)
        cailloux.push({ p: ecran(p), profondeur: p[0] + p[1] + p[2], bloc: liste[n % liste.length], taille: 3.4 + ((i * 3 + j) % 3) * 0.5, variante: n })
        n++
      }
    }
    // Plein à ras bord : une deuxième couche, plus haut, au milieu.
    if (tas > 0.3) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          const a = -ha * 0.6 + ((i + 0.5) / 3) * 1.2 * ha
          const b = -hb * 0.5 + ((j + 0.5) / 2) * hb
          const p = monde(a, b, niveau + tas * 0.13)
          cailloux.push({ p: ecran(p), profondeur: p[0] + p[1] + p[2], bloc: liste[n % liste.length], taille: 3.8, variante: n })
          n++
        }
      }
    }
    cailloux.sort((u, v) => u.profondeur - v.profondeur)
  }

  // Le rebord d'acier en haut : une bande au-dessus de chaque paroi.
  const rebord = (i: number) => {
    const j = (i + 1) % 4
    const dehors = (p: P3, q: P3, r: number): P3 => {
      // Un peu vers l'extérieur de la caisse.
      const m = moins(p, milieuCaisse)
      const lm = Math.hypot(m[0], m[1]) || 1
      return [p[0] + (m[0] / lm) * r, p[1] + (m[1] / lm) * r, q[2]]
    }
    const h = haut + 0.03
    const exterieur = [dehors(coinsHaut[i], [0, 0, h], REBORD), dehors(coinsHaut[j], [0, 0, h], REBORD)]
    const dessous = [dehors(coinsHaut[i], [0, 0, haut - 0.06], REBORD), dehors(coinsHaut[j], [0, 0, haut - 0.06], REBORD)]
    const dedans = [[coinsHaut[i][0], coinsHaut[i][1], h] as P3, [coinsHaut[j][0], coinsHaut[j][1], h] as P3]
    const dessus = [dedans[0], dedans[1], exterieur[1], exterieur[0]]
    const cote = [dessous[0], dessous[1], exterieur[1], exterieur[0]]
    return (
      <g key={`re${i}`}>
        {parois[i].devant && <polygon points={pts(cote)} fill={eclairer(ACIER, parois[i].n, 0.8)} stroke="#2a2d33" strokeWidth={0.5} strokeLinejoin="round" />}
        <polygon points={pts(dessus)} fill={eclairer(ACIER, [0, 0, 1], 0.8)} stroke="#2a2d33" strokeWidth={0.5} strokeLinejoin="round" />
      </g>
    )
  }

  // Les coins du haut : une plaque d'acier boulonnée sur chaque coin.
  const plaques = coinsHaut.map((c, i) => {
    const e = ecran([c[0], c[1], haut + 0.04])
    return (
      <g key={`pl${i}`}>
        <rect x={e.x - 1.8} y={e.y - 1.3} width={3.6} height={2.6} rx={0.6} fill={eclairer(ACIER_SOMBRE, [0, 0, 1], 0.6)} stroke="#2a2d33" strokeWidth={0.5} />
        <circle cx={e.x} cy={e.y} r={0.7} fill="#c9ced6" />
      </g>
    )
  })

  // L'attelage (un bloc d'acier boulonné), au bout qui est tourné vers nous.
  const avantDevant = scalaire(av, CAMERA) > 0
  const s = avantDevant ? 1 : -1
  const attelage = (() => {
    const a = s * (a0 + 0.09)
    const coin = (da: number, db: number, z: number) => monde(a + da * s, db, z)
    const face = [coin(0.05, -0.07, 0.4), coin(0.05, 0.07, 0.4), coin(0.05, 0.07, 0.5), coin(0.05, -0.07, 0.5)]
    const dessus = [coin(-0.05, -0.07, 0.5), coin(-0.05, 0.07, 0.5), coin(0.05, 0.07, 0.5), coin(0.05, -0.07, 0.5)]
    const centre = ecran(monde(a + 0.05 * s, 0, 0.45))
    return (
      <g>
        <polygon points={pts(dessus)} fill={eclairer(ACIER, [0, 0, 1], 0.6)} stroke="#2a2d33" strokeWidth={0.5} />
        <polygon points={pts(face)} fill={eclairer(ACIER_SOMBRE, [av[0] * s, av[1] * s, 0], 0.6)} stroke="#2a2d33" strokeWidth={0.5} />
        <circle cx={centre.x} cy={centre.y} r={1.1} fill={eclairer(ACIER, [av[0] * s, av[1] * s, 0.3], 0.9)} stroke="#2a2d33" strokeWidth={0.4} />
      </g>
    )
  })()

  // Le fond de la caisse (vu par l'ouverture).
  const fond = [monde(a0 - 0.02, b0 - 0.02, bas + 0.01), monde(a0 - 0.02, -b0 + 0.02, bas + 0.01), monde(-a0 + 0.02, -b0 + 0.02, bas + 0.01), monde(-a0 + 0.02, b0 - 0.02, bas + 0.01)]

  return (
    <g className="wagonnet-3d">
      {/* L'ombre portée, et l'ombre de contact sous les roues. */}
      <polygon points={texteOmbre} fill="rgb(20 10 4 / 0.24)" />
      {[ROUE.a, -ROUE.a].flatMap((a) =>
        [ROUE.b, -ROUE.b].map((b) => {
          const e = ecran(monde(a, b, RAIL))
          return <ellipse key={`c${a}${b}`} cx={e.x} cy={e.y} rx={3} ry={1.4} fill="rgb(0 0 0 / 0.35)" />
        }),
      )}
      {rouesDerriere}
      {/* Le fond, puis l'intérieur des parois de derrière. */}
      <polygon points={pts(fond)} fill={eclairer(BOIS_DEDANS, [0, 0, 1], 0, 0.55)} />
      {parois
        .filter((p) => !p.devant)
        .map((p, i) => (
          <g key={`pd${i}`}>
            <polygon points={pts(p.quad)} fill={eclairer(BOIS_DEDANS, [-p.n[0], -p.n[1], -p.n[2]], 0, 0.8)} stroke="#2b190c" strokeWidth={0.6} strokeLinejoin="round" />
            {planches(p.quad).map((d, k) => (
              <polyline key={k} points={d} stroke="rgb(40 22 10 / 0.55)" strokeWidth={0.6} />
            ))}
          </g>
        ))}
      {[0, 1, 2, 3].filter((i) => !parois[i].devant).map(rebord)}
      {/* Le chargement. */}
      {cailloux.map((c, i) => (
        <Minerai key={`m${i}`} x={c.p.x} y={c.p.y} t={c.taille} bloc={c.bloc} variante={c.variante} />
      ))}
      {/* Les parois de devant : le bois, ses planches, les montants d'acier et leurs boulons. */}
      {parois
        .filter((p) => p.devant)
        .map((p, i) => (
          <g key={`pv${i}`}>
            <polygon points={pts(p.quad)} fill={eclairer(BOIS, p.n, 0.05)} stroke="#2b190c" strokeWidth={0.7} strokeLinejoin="round" />
            {planches(p.quad).map((d, k) => (
              <polyline key={k} points={d} stroke="rgb(40 22 10 / 0.6)" strokeWidth={0.6} />
            ))}
            {montants(p.quad).map((m, k) => (
              <polygon key={`mo${k}`} points={pts(m)} fill={eclairer(ACIER, p.n, 0.7)} stroke="#2a2d33" strokeWidth={0.5} strokeLinejoin="round" />
            ))}
            {[p.quad[0], p.quad[1]].map((c, k) => {
              const e = ecran([c[0] * 0.92 + p.quad[k === 0 ? 1 : 0][0] * 0.08, c[1] * 0.92 + p.quad[k === 0 ? 1 : 0][1] * 0.08, bas + 0.06])
              return <circle key={`bo${k}`} cx={e.x} cy={e.y} r={0.75} fill="#33373e" />
            })}
          </g>
        ))}
      {[0, 1, 2, 3].filter((i) => parois[i].devant).map(rebord)}
      {plaques}
      {attelage}
      {rouesDevant}
    </g>
  )
}

// L'enveloppe convexe de points (pour l'ombre portée).
function enveloppe(points: Point[]): Point[] {
  const tries = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const croix = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const bas: Point[] = []
  for (const p of tries) {
    while (bas.length >= 2 && croix(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop()
    bas.push(p)
  }
  const haut: Point[] = []
  for (const p of [...tries].reverse()) {
    while (haut.length >= 2 && croix(haut[haut.length - 2], haut[haut.length - 1], p) <= 0) haut.pop()
    haut.push(p)
  }
  return [...bas.slice(0, -1), ...haut.slice(0, -1)]
}
