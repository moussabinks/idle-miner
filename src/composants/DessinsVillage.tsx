// Les dessins du village faits en SVG par le jeu, dans le style cartoon des bâtiments (25/10 :
// des aplats, un contour bleu nuit épais, ni dégradé ni flou) : le sol, ce qui bouge sur la mine
// (la caisse de l'ascenseur et ses câbles, le panneau du niveau), les rails et les chemins de
// pavés (ils se raccordent tout seuls), les décorations et le petit losange de la grille.
// Tout est dessiné dans les coordonnées de l'image du monde (voir iso.ts).

import { memo, type ReactNode } from 'react'
import { aleatoireAvecGraine } from '../jeu/aleatoire'
import { TAILLE_GRILLE, type IdBloc, type IdDecoration, type IdRarete } from '../jeu/donnees'
import { ECHELLE_SPRITE, spritePerso } from './sprites'
import { CALAGES, DEMI_HAUTEUR, DEMI_LARGEUR, LIMITES_TERRAIN, POINTS_MINE, pointSurSprite, transformationSprite, versEcran, type Point } from './iso'
import { ARBRE_ROND, CERISIER, SAPIN, type ImageArbre } from './arbres'
import { ImageFigee } from './ImageFigee'
import { TasDeRochers } from './Rochers'
import { cleCase, DIRECTION, lireCle, raccordsRail, viragesDoux, type Case, type VirageDoux, type Village } from '../jeu/village'
import { cheminPublic } from '../chemins'

// Un point de la grille → « x,y » pour un attribut SVG.
const p = (x: number, y: number) => {
  const e = versEcran(x, y)
  return `${e.x.toFixed(1)},${e.y.toFixed(1)}`
}

// Un polygone de la grille (une liste de cases), projeté à l'écran.
const poly = (points: [number, number][]) => points.map(([x, y]) => p(x, y)).join(' ')

// Une boîte SVG posée dans le monde, autour d'une emprise (avec de la place au-dessus pour ce
// qui dépasse : un toit, un arbre...). Les enfants dessinent en coordonnées du monde.
export function BoiteSvg({ x, y, taille, hauteur, marge = 12, classe = '', style, children }: {
  x: number
  y: number
  taille: number
  hauteur: number
  marge?: number
  classe?: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  const gauche = versEcran(x, y + taille).x - marge
  const droite = versEcran(x + taille, y).x + marge
  const haut = versEcran(x, y).y - hauteur
  const bas = versEcran(x + taille, y + taille).y + marge
  return (
    <svg
      className={`boite-svg ${classe}`}
      style={{ left: gauche, top: haut, width: droite - gauche, height: bas - haut, ...style }}
      viewBox={`${gauche} ${haut} ${droite - gauche} ${bas - haut}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Le terrain (25/10) : le sol de la clairière, et l'herbe de la forêt tout autour
// ---------------------------------------------------------------------------

// Tout est à plat, sans flou ni texture (le style cartoon) : l'herbe partout, un tout petit peu
// plus sombre sous la forêt, et la clairière en damier de deux verts très proches (comme le sol
// de Clash of Clans) : on devine la grille sans la voir. Quand on construit, une vraie grille
// apparaît (GrilleConstruction).
const VERT_FORET = '#86cc66'
const VERT_BORD = '#8ad06a' // une bande entre la forêt et la clairière, pour adoucir le passage
const VERT_CLAIR = '#8fd36f'
const VERT_DAMIER = '#93d673'
const VERT_TOUFFE = '#74bf57'
const ENCRE = '#2a2140'

// Le losange de la clairière, un peu agrandi (marge en cases), en points « x,y ».
function losangeClairiere(marge: number): string {
  const n = TAILLE_GRILLE
  return [versEcran(-marge, -marge), versEcran(n + marge, -marge), versEcran(n + marge, n + marge), versEcran(-marge, n + marge)].map((p) => `${p.x},${p.y}`).join(' ')
}

// Les petits détails sur l'herbe de la clairière : des touffes (des petits « v »), et de temps en
// temps une fleur ou un caillou. Toujours aux mêmes places (hasard à graine fixe). Ils sont au
// sol : les bâtiments, les chemins et les personnages passent par-dessus.
type Detail = { sorte: 'touffe' | 'fleur' | 'caillou'; x: number; y: number; echelle: number; miroir: boolean; couleur: string }

const COULEURS_FLEURS = ['#ffffff', '#f9d65a', '#f39aa8', '#a77df0']

function semerDetails(): Detail[] {
  const hasard = aleatoireAvecGraine(2210)
  const details: Detail[] = []
  const n = TAILLE_GRILLE
  for (let cx = 0; cx < n; cx++) {
    for (let cy = 0; cy < n; cy++) {
      // Environ un détail pour trois cases, posé n'importe où dans la case.
      if (hasard() > 0.34) continue
      const x = cx + 0.1 + hasard() * 0.8
      const y = cy + 0.1 + hasard() * 0.8
      const tirage = hasard()
      const sorte = tirage < 0.8 ? 'touffe' : tirage < 0.93 ? 'fleur' : 'caillou'
      const e = versEcran(x, y)
      details.push({
        sorte,
        x: e.x,
        y: e.y,
        echelle: 0.8 + hasard() * 0.45,
        miroir: hasard() < 0.5,
        couleur: COULEURS_FLEURS[Math.floor(hasard() * COULEURS_FLEURS.length)],
      })
    }
  }
  // Du fond vers l'avant, pour qu'un détail plus bas passe devant.
  return details.sort((a, b) => a.y - b.y)
}

const DETAILS_HERBE = semerDetails()

// Le dessin d'une touffe d'herbe (trois petits traits en « v »), à réutiliser avec
// <use href="#touffe-herbe" /> (le sol de la plage en a besoin aussi, dans son propre dessin).
export function TouffeHerbe() {
  return <path id="touffe-herbe" d="M-3.4 0 L-4.8 -3.6 M-0.6 0 L0 -5 M2 0 L3.8 -3.4" stroke={VERT_TOUFFE} strokeWidth="1.3" strokeLinecap="round" fill="none" />
}

// Les dessins des détails (centrés sur leur pied, en pixels du monde).
function DetailsHerbe() {
  return (
    <g className="details-herbe">
      {DETAILS_HERBE.map((d, i) => {
        const transformation = `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${(d.miroir ? -1 : 1) * d.echelle} ${d.echelle})`
        if (d.sorte === 'touffe') return <use key={i} href="#touffe-herbe" transform={transformation} />
        if (d.sorte === 'caillou') return <use key={i} href="#caillou-herbe" transform={transformation} />
        return (
          <g key={i} transform={transformation}>
            <circle cx="0" cy="-1.6" r="1.7" fill={d.couleur} stroke={ENCRE} strokeWidth="0.6" />
            <circle cx="0" cy="-1.6" r="0.6" fill="#f6a04d" />
          </g>
        )
      })}
    </g>
  )
}

// Tout le sol, dessiné une seule fois (il ne change jamais), puis figé en image (ImageFigee).
// Du plus loin au plus près : l'herbe de la forêt partout, une bande d'herbe un peu plus claire
// autour de la clairière, puis le damier de la clairière et ses détails.
export const TerrainVillage = memo(function TerrainVillage() {
  const { x0, y0, x1, y1 } = LIMITES_TERRAIN
  const l = x1 - x0
  const h = y1 - y0
  const origine = versEcran(0, 0)
  // Le motif du damier est dessiné en cases, puis posé en vue isométrique par cette matrice.
  const enIso = `matrix(${DEMI_LARGEUR} ${DEMI_HAUTEUR} ${-DEMI_LARGEUR} ${DEMI_HAUTEUR} ${origine.x} ${origine.y})`
  return (
    <ImageFigee nom="terrain">
      <svg className="terrain-village" style={{ left: x0, top: y0, width: l, height: h }} viewBox={`${x0} ${y0} ${l} ${h}`} aria-hidden="true">
        <defs>
          <pattern id="motif-damier" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform={enIso}>
            <rect width="2" height="2" fill={VERT_CLAIR} />
            <rect x="1" width="1" height="1" fill={VERT_DAMIER} />
            <rect y="1" width="1" height="1" fill={VERT_DAMIER} />
          </pattern>
          <TouffeHerbe />
          {/* Un petit caillou plat, avec son contour. */}
          <ellipse id="caillou-herbe" cx="0" cy="-1" rx="2.4" ry="1.5" fill="#c9ccd6" stroke={ENCRE} strokeWidth="0.7" />
        </defs>
        <rect x={x0} y={y0} width={l} height={h} fill={VERT_FORET} />
        <polygon points={losangeClairiere(1.2)} fill={VERT_BORD} />
        <polygon points={losangeClairiere(0)} fill="url(#motif-damier)" />
        <DetailsHerbe />
      </svg>
    </ImageFigee>
  )
})

// La grille de construction (24/10) : quand on pose ou déplace quelque chose (ou qu'on peint des
// rails), de fines lignes claires montrent les cases. Le reste du temps, le sol est un pré.
export function GrilleConstruction() {
  const origine = versEcran(0, 0)
  const enIso = `matrix(${DEMI_LARGEUR} ${DEMI_HAUTEUR} ${-DEMI_LARGEUR} ${DEMI_HAUTEUR} ${origine.x} ${origine.y})`
  return (
    <g className="grille-construction">
      <defs>
        <pattern id="motif-grille" patternUnits="userSpaceOnUse" width="1" height="1" patternTransform={enIso}>
          <path d="M0 0 H1 M0 0 V1" stroke="#ffffff" strokeWidth="0.045" fill="none" />
        </pattern>
      </defs>
      <polygon points={losangeClairiere(0)} fill="url(#motif-grille)" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// La mine (10 × 10) : l'image (mine.svg), et ce qui évolue par-dessus
// ---------------------------------------------------------------------------

type PropsEvolutionMine = {
  x: number
  y: number
  miroir: boolean
  niveau: number // le niveau de la mine (1 à 5), pour le panneau
  ascenseur: boolean // l'ascenseur est construit (on voit sa cabine)
  hauteurCabine: number // où est la cabine : 0 = en haut (au village), 1 = tout en bas
  passagers?: PassagerAscenseur[] // les caisses de minerais qui remontent (ou redescendent vides)
}

// Une caisse dans le puits (27/10) : les mineurs restent au fond, c'est leur sac qui remonte,
// dans une caisse en bois pleine de minerais, puis la caisse vide redescend. Où elle en est
// (0 = en haut, 1 = tout en bas), si elle est pleine (elle monte) ou vide (elle redescend), et
// ce qu'elle porte (le sac du mineur, pour les couleurs des minerais).
export type PassagerAscenseur = { f: number; pleine: boolean; contenu?: Partial<Record<IdBloc, number>>; mineur?: IdRarete }

// La caisse de l'ascenseur (25/10, dessinée par outils/art/fabriquer.mjs) : vide quand elle
// redescend, pleine des minerais du niveau de la mine quand elle remonte.
//   0 : vide ; 1 : pierre, charbon, fer ; 2 : + redstone ; 3 : + or et émeraude ; 4 : + diamant.
const IMAGES_CAISSE = [0, 1, 2, 3, 4].map((n) => cheminPublic(`/images/batiments/caisse-ascenseur-${n}.svg`))
// Le dessin plein selon le niveau de la mine (niveaux 2 et 3 : celui à la redstone).
const CAISSE_DU_NIVEAU = [1, 1, 2, 2, 3, 4]
function imageCaisse(pleine: boolean, niveauMine: number): string {
  return IMAGES_CAISSE[pleine ? CAISSE_DU_NIVEAU[Math.max(1, Math.min(5, niveauMine))] : 0]
}

// Les calques de la mine, dans le même cadre que mine.svg (mêmes pixels, 684 × 570) : le devant
// (les poutres du bord de devant du puits), dessiné par-dessus la caisse quand elle descend.
const IMAGE_DEVANT_MINE = cheminPublic('/images/batiments/mine-devant.svg')

// De combien de pixels de l'image la caisse se décale : tout en haut, elle pend sous le treuil ;
// tout en bas, elle a disparu dans le puits. Sans ascenseur (vieilles parties), les câbles
// pendent au fond.
const CABINE_EN_HAUT = -62
const CABINE_EN_BAS = 190
const CABLES_SANS_ASCENSEUR = 240

// Le bord de devant de la caisse, décalé : un mineur dans la caisse n'est visible qu'au-dessus.
function bordCaisse(decalage: number): string {
  const bord = POINTS_MINE.bordCaisse
  const droite = bord[0]
  const gauche = bord[bord.length - 1]
  const points = [[gauche[0] - 80, -1000], [droite[0] + 80, -1000], [droite[0] + 80, droite[1] + decalage], ...bord.map(([x, y]) => [x, y + decalage]), [gauche[0] - 80, gauche[1] + decalage]]
  return points.map(([x, y]) => `${x},${y}`).join(' ')
}

// La zone où la caisse se voit : tout ce qui est au-dessus du bord du puits.
const ZONE_CABINE = (() => {
  const bord = POINTS_MINE.bordDuPuits
  const gauche = bord[0][0]
  const droite = bord[bord.length - 1][0]
  return [[gauche, -400], [droite, -400], ...bord.slice().reverse()].map(([x, y]) => `${x},${y}`).join(' ')
})()

export function DessinEvolutionMine({ x, y, miroir, niveau, ascenseur, hauteurCabine, passagers = [] }: PropsEvolutionMine) {
  const calage = CALAGES.puits
  const f = Math.max(0, Math.min(1, hauteurCabine))
  const decalage = ascenseur ? CABINE_EN_HAUT + (CABINE_EN_BAS - CABINE_EN_HAUT) * f : CABLES_SANS_ASCENSEUR
  const panneau = pointSurSprite(calage, x, y, 10, miroir, ...POINTS_MINE.panneau)
  // Un identifiant à part pour chaque mine dessinée (l'écran d'accueil en dessine une aussi).
  const idZone = `zone-cabine-${x}-${y}`
  // La caisse est pleine quand elle remonte le sac d'un mineur (à peu près à sa hauteur, ou en
  // haut pendant qu'il le vide), vide quand elle redescend.
  const pleine = passagers.some((p) => p.pleine && Math.abs(p.f - f) < 0.2)
  // (23/10) Un mineur qui descend lui-même (il arrive du village) : on le voit debout dans la caisse.
  const passagerMineur = ascenseur ? passagers.find((p) => p.mineur && Math.abs(p.f - f) < 0.2)?.mineur : undefined
  const sprite = passagerMineur ? spritePerso(passagerMineur, 'devant') : null
  // Sa taille dans l'image de la mine : la mine (CALAGES.puits) est dessinée à une autre échelle
  // que le monde ; un mineur y fait la même taille qu'au village.
  // (l'image de la mine couvre ses 10 cases d'un coin à l'autre : de calage.gauche à calage.droite)
  const pixelsParMonde = (calage.droite.x - calage.gauche.x) / (10 * 2 * DEMI_LARGEUR)
  const echelleMineur = ECHELLE_SPRITE * pixelsParMonde
  const { caisse } = POINTS_MINE
  return (
    <g className="evolution-mine">
      {/* Les câbles, la caisse et le devant, posés comme l'image de la mine (miroir compris). */}
      <g transform={transformationSprite(calage, x, y, 10, miroir)}>
        <clipPath id={idZone}>
          <polygon points={ZONE_CABINE} />
        </clipPath>
        <g clipPath={`url(#${idZone})`}>
          {/* Les câbles tombent du treuil jusqu'aux anneaux de la caisse. Leurs torons défilent
              quand elle bouge : on voit le câble s'enrouler ou se dérouler. */}
          {POINTS_MINE.treuil.map(([tx, ty], i) => {
            const [ax, ay] = POINTS_MINE.accroches[i]
            const chemin = `M${tx} ${ty} L${ax} ${ay + decalage}`
            return (
              <g key={i} className="cable-mine">
                <path d={chemin} stroke={ENCRE} strokeWidth="8" strokeLinecap="round" />
                <path d={chemin} stroke="#b8c0cc" strokeWidth="3" strokeDasharray="6 5" strokeDashoffset={-decalage} strokeLinecap="round" />
              </g>
            )
          })}
          {/* La caisse, avec les minerais du niveau de la mine. */}
          {ascenseur && <image href={imageCaisse(pleine, niveau)} x={caisse.x} y={caisse.y + decalage} width={caisse.largeur} height={caisse.hauteur} />}
          {/* Le mineur dans la caisse, coupé sous le bord de devant (on voit le haut de son corps). */}
          {sprite && (
            <>
              <clipPath id={`${idZone}-mineur`}>
                <polygon points={bordCaisse(decalage)} />
              </clipPath>
              <image
                href={sprite.fichier}
                clipPath={`url(#${idZone}-mineur)`}
                x={POINTS_MINE.piedDansLaCaisse[0] - sprite.calage.pied.x * echelleMineur}
                y={POINTS_MINE.piedDansLaCaisse[1] + decalage - sprite.calage.pied.y * echelleMineur}
                width={sprite.calage.largeur * echelleMineur}
                height={sprite.calage.hauteur * echelleMineur}
              />
            </>
          )}
        </g>
        <image href={IMAGE_DEVANT_MINE} x="0" y="0" width={calage.largeur} height={calage.hauteur} />
      </g>
      {/* Le panneau du niveau de la mine, planté sur le sol de devant. */}
      <g transform={`translate(${panneau.x} ${panneau.y})`}>
        <ellipse cx="0" cy="0" rx="8" ry="3" fill={VERT_TOUFFE} opacity="0.5" />
        <rect x="-2.5" y="-30" width="5" height="30" rx="1.5" fill="#c98a55" stroke={ENCRE} strokeWidth="1.5" />
        <rect x="-22" y="-44" width="44" height="19" rx="5" fill="#fdf6e3" stroke={ENCRE} strokeWidth="2.2" />
        <text x="0" y="-30" textAnchor="middle" fontSize="11" fill={ENCRE} style={{ fontFamily: "var(--police-titre, 'Lilita One'), 'Icones Mega', system-ui, sans-serif" }}>
          Niv. {niveau}
        </text>
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Les rails et les chemins (une case chacun, ils se raccordent tout seuls)
// ---------------------------------------------------------------------------

type Raccords = { n: boolean; e: boolean; s: boolean; o: boolean }

// Les rails (25/10), dessinés en SVG dans le style cartoon du jeu (outils/art/rails.mjs).
// Un rail se pose sur une case, mais la voie est large de presque deux cases : elle déborde de
// chaque côté. Deux couches :
//   1. le ballast, une bande claire à plat sur le sol : des tuiles vues de dessus, de 2 × 2 cases
//      centrées sur la case du rail, posées en losange sur la grille et tournées dans le bon sens.
//      Chaque tuile a deux images : son bord (la bande un peu plus large, en encre) et la bande.
//      On pose d'abord les bords de toutes les cases, puis toutes les bandes : les bandes voisines
//      se fondent, et le trait d'encre ne reste que tout autour de la voie ;
//   2. la voie en vue isométrique : des traverses en bois et deux rails d'acier cernés d'encre.
//      Une image par forme de case (les 11 formes : tout droit, virage, T et croisement, dans
//      tous les sens, plus les bouts de ligne), posées de la plus loin à la plus proche.
// Le joueur n'achète que des rails : chaque case choisit toute seule son dessin selon ses voisines.
const FORMES_RAILS = {
  droit: 'talus_droit', // relie le nord (y - 1) et le sud (y + 1)
  virage: 'talus_virage', // relie le sud (y + 1) et l'est (x + 1)
  t: 'talus_t', // la ligne nord-sud, et l'embranchement vers l'est
  croix: 'talus_croix', // les quatre côtés
}
// Le cadre des images de la voie (en pixels du monde), autour du coin du haut de la case : le
// même que dans outils/art/rails.mjs (CADRE).
const CADRE_VOIE = { x: -35, y: -15, largeur: 70, hauteur: 46 }
// Les virages doux (25/10) : dans un carré de 2 × 2 cases, autour du coin du haut de ce carré
// (outils/art/rails.mjs, CADRE_DOUX).
const CADRE_DOUX = { x: -42, y: -12, largeur: 84, hauteur: 58 }
// Où est la case du coin dans son carré, selon le nombre de quarts de tour (le virage de base,
// sans tourner, a son coin en haut à gauche et ses bras au sud et à l'est).
const COIN_DANS_LE_CARRE: Case[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]

// Le dessin d'un virage doux : son carré de 2 × 2 cases et ses quarts de tour.
function carreDuVirage(v: VirageDoux): { origine: Case; quarts: number } {
  let bras: Cote[] = ['s', 'e']
  for (let k = 0; k < 4; k++) {
    if (bras.every((c) => v.bras.includes(c))) {
      return { origine: { x: v.coin.x - COIN_DANS_LE_CARRE[k].x, y: v.coin.y - COIN_DANS_LE_CARRE[k].y }, quarts: k }
    }
    bras = bras.map((c) => QUART[c])
  }
  return { origine: v.coin, quarts: 0 }
}

type Cote = 'n' | 'e' | 's' | 'o'
const COTES: Cote[] = ['n', 'e', 's', 'o']
// Tourner d'un quart de tour (dans le sens des aiguilles d'une montre, vu de dessus) : n → e → s → o.
const QUART: Record<Cote, Cote> = { n: 'e', e: 's', s: 'o', o: 'n' }
const OPPOSE: Record<Cote, Cote> = { n: 's', e: 'o', s: 'n', o: 'e' }

type Morceau = { image: string; quarts: number } // image : le nom de la forme (sans le calque)

// Combien de quarts de tour pour amener le côté « depuis » sur le côté « vers ».
function quartsDe(depuis: Cote, vers: Cote): number {
  let c = depuis
  for (let k = 0; k < 4; k++) {
    if (c === vers) return k
    c = QUART[c]
  }
  return 0
}

// Le dessin d'une case, selon ses voisines :
//   - aucune voisine, ou une seule : tout droit (vers la voisine) ;
//   - deux voisines en face l'une de l'autre : tout droit ; à angle droit : un virage ;
//   - trois voisines (en T) : la ligne droite et deux virages vers la troisième ;
//   - quatre : un croisement.
function morceauDeVoie(r: Raccords): Morceau {
  const liste = COTES.filter((c) => r[c])
  if (liste.length === 4) return { image: FORMES_RAILS.croix, quarts: 0 }
  if (liste.length === 3) {
    const branche = COTES.find((c) => r[c] && !r[OPPOSE[c]]) as Cote
    return { image: FORMES_RAILS.t, quarts: quartsDe('e', branche) }
  }
  if (liste.length === 2 && OPPOSE[liste[0]] !== liste[1]) {
    // Le virage de base relie le sud et l'est : on le tourne jusqu'à relier les deux voisines.
    const [a, b] = liste
    const quarts = [0, 1, 2, 3].find((k) => {
      let x: Cote = 's'
      let y: Cote = 'e'
      for (let i = 0; i < k; i++) {
        x = QUART[x]
        y = QUART[y]
      }
      return (x === a && y === b) || (x === b && y === a)
    })
    return { image: FORMES_RAILS.virage, quarts: quarts ?? 0 }
  }
  const axe = liste[0] ?? 'n'
  return { image: FORMES_RAILS.droit, quarts: axe === 'n' || axe === 's' ? 0 : 1 }
}

// Le nom de l'image 3D de la voie d'une case : ses côtés reliés, dans l'ordre n, e, s, o (« ns »,
// « es », « nes »...). Un bout de ligne (une seule voisine, et pas de bâtiment) a un butoir du côté
// où la voie s'arrête (« fin_n »...) ; un rail tout seul en a deux (« seul_ns »).
function codeDeVoie(r: Raccords): string {
  const liste = COTES.filter((c) => r[c])
  if (liste.length >= 2) return liste.join('')
  if (liste.length === 1) return `fin_${OPPOSE[liste[0]]}`
  return 'seul_ns'
}

// Tous les rails du village : le ballast de toutes les cases d'abord, puis la voie. Les
// virages doux (sur trois cases) remplacent le dessin de leurs trois cases.
// « seulement » : ne dessiner que ces cases (l'aperçu d'un rail à poser, 23/10), raccordées à
// leurs voisines comme les autres.
export function RailsDuVillage({ village, seulement }: { village: Village; seulement?: string[] }) {
  const virages = seulement ? [] : viragesDoux(village).map((v) => ({ v, ...carreDuVirage(v) }))
  const dansUnVirage = new Set(virages.flatMap(({ v }) => [v.coin, ...v.bras.map((c) => ({ x: v.coin.x + DIRECTION[c].x, y: v.coin.y + DIRECTION[c].y }))].map((c) => cleCase(c.x, c.y))))
  const talus: { cle: string; transform: string; image: string; quarts: number }[] = []
  const voie: { cle: string; profondeur: number; image: string; x: number; y: number; cadre: typeof CADRE_VOIE }[] = []
  for (const cle of seulement ?? village.rails) {
    if (dansUnVirage.has(cle)) continue
    const c = lireCle(cle)
    const raccords = raccordsRail(village, c.x, c.y)
    const morceau = morceauDeVoie(raccords)
    // La tuile du talus (2 × 2 cases) commence une demi-case avant la case du rail, dans les deux sens.
    const coinTalus = versEcran(c.x - 0.5, c.y - 0.5)
    talus.push({ cle, transform: `matrix(${2 * DEMI_LARGEUR} ${2 * DEMI_HAUTEUR} ${-2 * DEMI_LARGEUR} ${2 * DEMI_HAUTEUR} ${coinTalus.x} ${coinTalus.y})`, image: morceau.image, quarts: morceau.quarts })
    const coin = versEcran(c.x, c.y)
    voie.push({ cle, profondeur: c.x + c.y, image: `voie_${codeDeVoie(raccords)}`, x: coin.x, y: coin.y, cadre: CADRE_VOIE })
  }
  for (const { v, origine, quarts } of virages) {
    const cle = `doux${cleCase(v.coin.x, v.coin.y)}`
    // Le talus d'un virage doux : une tuile de 3 × 3 cases, autour de son carré de 2 × 2.
    const coinTalus = versEcran(origine.x - 0.5, origine.y - 0.5)
    talus.push({ cle, transform: `matrix(${3 * DEMI_LARGEUR} ${3 * DEMI_HAUTEUR} ${-3 * DEMI_LARGEUR} ${3 * DEMI_HAUTEUR} ${coinTalus.x} ${coinTalus.y})`, image: 'talus_doux', quarts })
    const coin = versEcran(origine.x, origine.y)
    voie.push({ cle, profondeur: origine.x + origine.y + 1, image: `voie_doux_${v.bras.join('')}`, x: coin.x, y: coin.y, cadre: CADRE_DOUX })
  }
  // De la plus loin à la plus proche (comme les bâtiments).
  voie.sort((a, b) => a.profondeur - b.profondeur)
  return (
    <g className="rails-village">
      {/* Le ballast : les bords d'encre de toutes les cases, puis les bandes claires par-dessus. */}
      {(['_bord', ''] as const).map((calque) => (
        <g key={calque} className={calque ? 'rails-talus-bord' : 'rails-talus'}>
          {talus.map((t) => (
            <g key={t.cle} transform={t.transform}>
              <image
                href={cheminPublic(`/images/rails/${t.image}${calque}.svg`)}
                x="0"
                y="0"
                width="1"
                height="1"
                preserveAspectRatio="none"
                transform={t.quarts ? `rotate(${t.quarts * 90} 0.5 0.5)` : undefined}
              />
            </g>
          ))}
        </g>
      ))}
      <g className="rails-voie">
        {voie.map((v) => (
          <image key={v.cle} href={cheminPublic(`/images/rails/${v.image}.svg`)} x={v.x + v.cadre.x} y={v.y + v.cadre.y} width={v.cadre.largeur} height={v.cadre.hauteur} />
        ))}
      </g>
    </g>
  )
}

export function CaseChemin({ x, y }: { x: number; y: number }) {
  // Quatre pavés plats par case, de deux gris, chacun avec son contour (le style cartoon), sur
  // un fond de terre claire.
  const paves: [number, number, number][] = [
    [0.27, 0.27, 0],
    [0.73, 0.27, 1],
    [0.27, 0.73, 1],
    [0.73, 0.73, 0],
  ]
  return (
    <g className="case-chemin">
      <polygon points={poly([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]])} fill="#e3d0a6" />
      {paves.map(([dx, dy, teinte], i) => {
        const coins = poly([
          [x + dx - 0.19, y + dy - 0.19],
          [x + dx + 0.19, y + dy - 0.19],
          [x + dx + 0.19, y + dy + 0.19],
          [x + dx - 0.19, y + dy + 0.19],
        ])
        return <polygon key={i} points={coins} fill={teinte ? '#b9bdc9' : '#c9ccd6'} stroke={ENCRE} strokeWidth="1" strokeLinejoin="round" />
      })}
    </g>
  )
}

// Le losange d'une emprise (vert si on peut poser, rouge sinon), pendant qu'on place un élément.
export function LosangeEmprise({ x, y, taille, libre }: { x: number; y: number; taille: number; libre: boolean }) {
  return (
    <polygon
      className={`emprise ${libre ? 'emprise-libre' : 'emprise-occupee'}`}
      points={poly([[x, y], [x + taille, y], [x + taille, y + taille], [x, y + taille]])}
    />
  )
}

// ---------------------------------------------------------------------------
// Les décorations (25/10 : au style cartoon, des aplats et un contour bleu nuit)
// ---------------------------------------------------------------------------

const BOIS = '#c98a55'
const BOIS_FONCE = '#9a6237'
const PIERRE = '#c9ccd6'
const PIERRE_FONCEE = '#a9adbb'
const OR = '#f9d65a'
const OR_FONCE = '#e8b13e'

// Une petite ombre plate au pied d'un objet (un vert à peine plus sombre que l'herbe).
function Ombre({ c, rx, ry, dx = 2 }: { c: Point; rx: number; ry: number; dx?: number }) {
  return <ellipse cx={c.x + dx} cy={c.y + 1} rx={rx} ry={ry} fill={VERT_TOUFFE} />
}

// Des ronds réunis sous un seul contour (un buisson, un feuillage) : le contour d'abord (des ronds
// un peu plus grands, à l'encre), puis la teinte sombre, puis la claire décalée vers la lumière.
function Ronds({ ronds, couleur, sombre, trait = 1.6 }: { ronds: [number, number, number][]; couleur: string; sombre: string; trait?: number }) {
  return (
    <g>
      {ronds.map(([x, y, r], i) => (
        <circle key={`c${i}`} cx={x} cy={y} r={r + trait} fill={ENCRE} />
      ))}
      {ronds.map(([x, y, r], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={r} fill={sombre} />
      ))}
      {ronds.map(([x, y, r], i) => (
        <circle key={`l${i}`} cx={x - r * 0.14} cy={y - r * 0.18} r={r * 0.76} fill={couleur} />
      ))}
    </g>
  )
}

function Fleurs({ c, couleur }: { c: Point; couleur: string }) {
  const positions = [
    [-7, -4],
    [5, -6],
    [0, 0],
    [-2, -9],
    [8, -1],
  ]
  return (
    <g>
      <Ombre c={c} rx={14} ry={5} />
      <Ronds
        ronds={[
          [c.x - 5, c.y - 3, 6],
          [c.x + 5, c.y - 3, 6],
          [c.x, c.y - 6, 6.5],
        ]}
        couleur="#6cc66e"
        sombre="#4aa65a"
        trait={1.3}
      />
      {positions.map(([dx, dy], i) => (
        <g key={i}>
          <circle cx={c.x + dx} cy={c.y + dy - 4} r="3" fill={couleur} stroke={ENCRE} strokeWidth="1.1" />
          <circle cx={c.x + dx} cy={c.y + dy - 4} r="1" fill={couleur === OR ? '#f6a04d' : OR} />
        </g>
      ))}
    </g>
  )
}

// Un arbre de la forêt (le même dessin), planté sur une décoration de 2 × 2 cases.
function ArbreImage({ c, arbre }: { c: Point; arbre: ImageArbre }) {
  const echelle = (1.7 * 2 * DEMI_LARGEUR) / arbre.largeurPied
  return <image href={arbre.fichier} x={c.x - arbre.pied.x * echelle} y={c.y - arbre.pied.y * echelle} width={arbre.largeur * echelle} height={arbre.hauteur * echelle} />
}

// Une boîte en vue du ciel, autour du point c (son pied) : demi-largeur l, hauteur h.
function Boite({ c, l, h, haut, gauche, droite, trait = 1.5 }: { c: Point; l: number; h: number; haut: string; gauche: string; droite: string; trait?: number }) {
  const k = 0.58 // l'écrasement de la vue
  const a = { x: c.x - l, y: c.y - l * k } // coin gauche
  const b = { x: c.x, y: c.y } // coin du bas
  const d = { x: c.x + l, y: c.y - l * k } // coin droit
  const e = { x: c.x, y: c.y - 2 * l * k } // coin du fond
  const pts = (liste: Point[]) => liste.map((p) => `${p.x},${p.y}`).join(' ')
  const monte = (p: Point) => ({ x: p.x, y: p.y - h })
  return (
    <g strokeLinejoin="round" stroke={ENCRE} strokeWidth={trait}>
      <polygon points={pts([a, b, monte(b), monte(a)])} fill={gauche} />
      <polygon points={pts([b, d, monte(d), monte(b)])} fill={droite} />
      <polygon points={pts([monte(a), monte(b), monte(d), monte(e)])} fill={haut} />
    </g>
  )
}

export function DessinDecoration({ id, x, y, taille, miroir }: { id: IdDecoration; x: number; y: number; taille: number; miroir: boolean }) {
  const c = versEcran(x + taille / 2, y + taille / 2)
  let dessin: ReactNode = null
  switch (id) {
    case 'fleurs-rouges':
      dessin = <Fleurs c={c} couleur="#e2483d" />
      break
    case 'fleurs-jaunes':
      dessin = <Fleurs c={c} couleur={OR} />
      break
    case 'fleurs-violettes':
      dessin = <Fleurs c={c} couleur="#a77df0" />
      break
    case 'buisson':
      dessin = (
        <g>
          <Ombre c={c} rx={16} ry={5.5} />
          <Ronds
            ronds={[
              [c.x - 7, c.y - 7, 8.5],
              [c.x + 7, c.y - 7, 8.5],
              [c.x, c.y - 13, 9.5],
            ]}
            couleur="#6cc66e"
            sombre="#4aa65a"
          />
          {[
            [4, -14],
            [-6, -6],
            [8, -5],
          ].map(([dx, dy], i) => (
            <circle key={i} cx={c.x + dx} cy={c.y + dy} r="2" fill="#e2483d" stroke={ENCRE} strokeWidth="0.8" />
          ))}
        </g>
      )
      break
    case 'rocher':
      // Un tas de rochers (Rochers.tsx), toujours le même à la même place.
      dessin = <TasDeRochers x={c.x} y={c.y + 3} graine={Math.round(x * 31 + y * 17)} />
      break
    case 'tonneau':
      dessin = (
        <g strokeLinejoin="round">
          <Ombre c={c} rx={13} ry={5} />
          <path d={`M${c.x - 10} ${c.y - 2} Q${c.x - 12.5} ${c.y - 14} ${c.x - 10} ${c.y - 26} L${c.x + 10} ${c.y - 26} Q${c.x + 12.5} ${c.y - 14} ${c.x + 10} ${c.y - 2} Q${c.x} ${c.y + 3} ${c.x - 10} ${c.y - 2} Z`} fill={BOIS} />
          {/* Le côté droit, à l'ombre. */}
          <path d={`M${c.x + 4} ${c.y - 26} L${c.x + 10} ${c.y - 26} Q${c.x + 12.5} ${c.y - 14} ${c.x + 10} ${c.y - 2} Q${c.x + 7} ${c.y} ${c.x + 4} ${c.y + 0.4} Z`} fill={BOIS_FONCE} />
          <path d={`M${c.x - 11.5} ${c.y - 8} Q${c.x} ${c.y - 4} ${c.x + 11.5} ${c.y - 8} M${c.x - 11.5} ${c.y - 20} Q${c.x} ${c.y - 16} ${c.x + 11.5} ${c.y - 20}`} stroke={ENCRE} strokeWidth="1.4" fill="none" />
          <path d={`M${c.x - 10} ${c.y - 2} Q${c.x - 12.5} ${c.y - 14} ${c.x - 10} ${c.y - 26} L${c.x + 10} ${c.y - 26} Q${c.x + 12.5} ${c.y - 14} ${c.x + 10} ${c.y - 2} Q${c.x} ${c.y + 3} ${c.x - 10} ${c.y - 2} Z`} fill="none" stroke={ENCRE} strokeWidth="1.6" />
          <ellipse cx={c.x} cy={c.y - 26} rx="10" ry="4" fill="#d9a46e" stroke={ENCRE} strokeWidth="1.6" />
          <circle cx={c.x - 3} cy={c.y - 27} r="2.3" fill={OR} stroke={ENCRE} strokeWidth="0.8" />
          <circle cx={c.x + 3} cy={c.y - 26} r="2.1" fill="#5fe0e6" stroke={ENCRE} strokeWidth="0.8" />
        </g>
      )
      break
    case 'caisse':
      dessin = (
        <g>
          <Ombre c={c} rx={16} ry={5.5} dx={3} />
          <Boite c={{ x: c.x, y: c.y + 2 }} l={13} h={13} haut="#7a4e2c" gauche={BOIS} droite={BOIS_FONCE} />
          {[
            [-5, -18, '#5fe0e6'],
            [4, -19, '#e2483d'],
            [0, -14, OR],
            [-1, -21, '#3ccf7a'],
          ].map(([dx, dy, couleur], i) => (
            <circle key={i} cx={c.x + Number(dx)} cy={c.y + Number(dy)} r="3.4" fill={String(couleur)} stroke={ENCRE} strokeWidth="1" />
          ))}
        </g>
      )
      break
    case 'lanterne':
      dessin = (
        <g strokeLinejoin="round">
          <Ombre c={c} rx={8} ry={3.5} />
          <circle cx={c.x} cy={c.y - 45} r="15" fill={OR} opacity="0.3" className="lueur-lanterne" />
          <rect x={c.x - 2.5} y={c.y - 40} width="5" height="40" rx="1.5" fill={BOIS} stroke={ENCRE} strokeWidth="1.4" />
          <rect x={c.x - 6} y={c.y - 4} width="12" height="5" rx="2" fill={PIERRE} stroke={ENCRE} strokeWidth="1.4" />
          <rect x={c.x - 6} y={c.y - 52} width="12" height="13" rx="3" fill={OR} stroke={ENCRE} strokeWidth="1.5" />
          <path d={`M${c.x - 8} ${c.y - 52} L${c.x} ${c.y - 59} L${c.x + 8} ${c.y - 52} Z`} fill="#3d3a46" stroke={ENCRE} strokeWidth="1.4" />
        </g>
      )
      break
    case 'banc':
      dessin = (
        <g strokeLinejoin="round" stroke={ENCRE} strokeWidth="1.4">
          <Ombre c={c} rx={16} ry={5.5} />
          {/* les pieds, l'assise (vue du dessus), puis le dossier */}
          <path d={`M${c.x - 11} ${c.y - 7} V${c.y} M${c.x + 11} ${c.y - 3} V${c.y + 3}`} strokeWidth="2.6" />
          <polygon points={`${c.x - 15},${c.y - 8} ${c.x + 3},${c.y + 2} ${c.x + 15},${c.y - 4} ${c.x - 3},${c.y - 14}`} fill={BOIS} />
          <polygon points={`${c.x - 3},${c.y - 14} ${c.x + 15},${c.y - 4} ${c.x + 15},${c.y - 13} ${c.x - 3},${c.y - 23}`} fill={BOIS_FONCE} />
        </g>
      )
      break
    case 'arbre':
      dessin = <ArbreImage c={c} arbre={ARBRE_ROND} />
      break
    case 'cerisier':
      dessin = <ArbreImage c={c} arbre={CERISIER} />
      break
    case 'sapin':
      dessin = <ArbreImage c={c} arbre={SAPIN} />
      break
    case 'fontaine':
      dessin = (
        <g strokeLinejoin="round">
          <Ombre c={c} rx={33} ry={14} />
          {/* Le bassin : son bord en pierre (dessus et côté), et l'eau. */}
          <path d={`M${c.x - 32} ${c.y - 6} V${c.y - 1} A32 14 0 0 0 ${c.x + 32} ${c.y - 1} V${c.y - 6} Z`} fill={PIERRE_FONCEE} stroke={ENCRE} strokeWidth="2" />
          <ellipse cx={c.x} cy={c.y - 6} rx="32" ry="14" fill={PIERRE} stroke={ENCRE} strokeWidth="2" />
          <ellipse cx={c.x} cy={c.y - 6} rx="25" ry="10" fill="#8cc8f5" stroke={ENCRE} strokeWidth="1.6" />
          <ellipse className="eau-fontaine" cx={c.x} cy={c.y - 5} rx="17" ry="6.5" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.8" />
          {/* La colonne, la vasque du haut et les jets d'eau. */}
          <rect x={c.x - 4.5} y={c.y - 34} width="9" height="28" rx="3" fill={PIERRE} stroke={ENCRE} strokeWidth="1.6" />
          <ellipse cx={c.x} cy={c.y - 34} rx="12" ry="4.6" fill={PIERRE} stroke={ENCRE} strokeWidth="1.6" />
          <path className="jet-fontaine" d={`M${c.x} ${c.y - 37} Q${c.x - 12} ${c.y - 54} ${c.x - 16} ${c.y - 32} M${c.x} ${c.y - 37} Q${c.x + 12} ${c.y - 54} ${c.x + 16} ${c.y - 32}`} stroke="#ffffff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx={c.x} cy={c.y - 42} r="3" fill="#8cc8f5" stroke={ENCRE} strokeWidth="1" />
        </g>
      )
      break
    case 'statue':
      // La statue de la taupe d'or (les mineurs du jeu sont des taupes), pioche levée, sur son socle.
      dessin = (
        <g strokeLinejoin="round" strokeLinecap="round">
          <Ombre c={c} rx={28} ry={11} />
          <Boite c={{ x: c.x, y: c.y + 6 }} l={24} h={13} haut={PIERRE} gauche={PIERRE} droite={PIERRE_FONCEE} trait={2} />
          <g className="statue-or" stroke={ENCRE} strokeWidth="2">
            {/* la pioche, derrière la taupe */}
            <path d={`M${c.x + 11} ${c.y - 36} L${c.x + 21} ${c.y - 74}`} strokeWidth="6" />
            <path d={`M${c.x + 11} ${c.y - 36} L${c.x + 21} ${c.y - 74}`} stroke={OR_FONCE} strokeWidth="2.6" />
            <path d={`M${c.x + 7} ${c.y - 78} Q${c.x + 22} ${c.y - 88} ${c.x + 36} ${c.y - 72}`} fill="none" strokeWidth="7" />
            <path d={`M${c.x + 7} ${c.y - 78} Q${c.x + 22} ${c.y - 88} ${c.x + 36} ${c.y - 72}`} fill="none" stroke={OR} strokeWidth="3.2" />
            {/* le corps rond (avec son côté à l'ombre), les pattes */}
            <ellipse cx={c.x} cy={c.y - 32} rx="15" ry="15" fill={OR} />
            <path d={`M${c.x + 6} ${c.y - 45} A15 15 0 0 1 ${c.x + 6} ${c.y - 19} Q${c.x + 12} ${c.y - 32} ${c.x + 6} ${c.y - 45} Z`} fill={OR_FONCE} stroke="none" />
            <ellipse cx={c.x} cy={c.y - 32} rx="15" ry="15" fill="none" />
            <ellipse cx={c.x - 7} cy={c.y - 18} rx="6" ry="3" fill={OR_FONCE} />
            <ellipse cx={c.x + 7} cy={c.y - 18} rx="6" ry="3" fill={OR_FONCE} />
            <ellipse cx={c.x + 12} cy={c.y - 38} rx="4.5" ry="3.5" fill={OR} />
            {/* la tête, son museau, son nez rose et ses petits yeux */}
            <circle cx={c.x} cy={c.y - 54} r="12" fill={OR} />
            <ellipse cx={c.x} cy={c.y - 48} rx="6.5" ry="4.5" fill="#fbe69a" strokeWidth="1.5" />
            <ellipse cx={c.x} cy={c.y - 50} rx="3" ry="2.2" fill="#f39aa8" strokeWidth="1.3" />
            {/* le casque de mineur, et sa lampe */}
            <path d={`M${c.x - 12} ${c.y - 58} Q${c.x - 12} ${c.y - 71} ${c.x} ${c.y - 71} Q${c.x + 12} ${c.y - 71} ${c.x + 12} ${c.y - 58} Z`} fill={OR_FONCE} />
            <circle cx={c.x} cy={c.y - 64} r="3" fill="#ffffff" strokeWidth="1.3" />
          </g>
          <circle cx={c.x - 4.5} cy={c.y - 55} r="1.5" fill={ENCRE} />
          <circle cx={c.x + 4.5} cy={c.y - 55} r="1.5" fill={ENCRE} />
          <path d={`M${c.x - 9} ${c.y - 40} L${c.x - 7} ${c.y - 35}`} stroke="#ffffff" strokeWidth="2" opacity="0.8" />
        </g>
      )
      break
  }
  return <g transform={miroir ? `translate(${2 * c.x} 0) scale(-1 1)` : undefined}>{dessin}</g>
}
