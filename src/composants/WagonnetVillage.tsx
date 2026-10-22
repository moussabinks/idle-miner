// Un wagonnet sur les rails (23/10 ; un par trajet depuis le 24/10), et celui qui le pousse
// (toi ou un mineur).
//
// Pour qu'il roule de façon bien fluide, il a sa propre petite animation, à chaque image de
// l'écran : le jeu ne donne sa position que 20 fois par seconde, alors entre deux nouvelles, on
// le fait avancer tout seul à sa vitesse (on « devine » où il est). Il suit la voie : tout droit
// au milieu des cases, en quart de cercle dans les virages (traceDeLaVoie), et il se tourne
// dans le sens de la voie. On le dessine comme une petite benne en volume (vue de 3/4).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LIAISONS, RARETES, type IdLiaison } from '../jeu/donnees'
import type { EtatJeu, Trajet } from '../jeu/mineur'
import { ligneDe, longueurTrajet, vitesseTrajet } from '../jeu/wagonnet'
import { sons } from '../sons'
import { Perso } from './ElementsVillage'
import { longueurTrace, orienter, profondeur, surLaTrace, traceDeLaVoie, versEcran } from './iso'

type Point = { x: number; y: number }

// La taille de la benne, en cases (vue de dessus), et la hauteur de ses parois, en pixels du monde.
const LONGUEUR = 1.05
const LARGEUR = 0.84
const HAUTEUR = 15
// Les roues roulent sur les rails : la benne est posée à leur hauteur (en pixels du monde).
const SUR_LES_RAILS = 3.6
// Le pousseur marche à cette distance derrière la benne (en cases, le long de la voie).
const RECUL_POUSSEUR = 1.15

// Ce que porte le wagonnet, selon son trajet : des minerais de toutes les couleurs (vers le
// marché), du charbon (vers la foreuse), de la redstone (vers le générateur).
const CHARGEMENTS: Record<IdLiaison, [string, string][]> = {
  'mine-marche': [['#4ee8dc', '#1a7a72'], ['#ffd84a', '#9a7a10'], ['#e04848', '#7a1a1a'], ['#9a9a9a', '#555']],
  'foreuse-marche': [['#ffd84a', '#9a7a10'], ['#c9c9c9', '#666'], ['#4ee8dc', '#1a7a72'], ['#d89a6a', '#7a4a22']],
  'mine-foreuse': [['#2e2e34', '#0e0e12'], ['#3a3a40', '#111'], ['#26262c', '#0a0a0e'], ['#45454c', '#151518']],
  'mine-generateur': [['#ff3b2e', '#7a0a06'], ['#e02218', '#6a0804'], ['#ff5a48', '#8a1008'], ['#c81a12', '#5a0602']],
}

// La benne vue de 3/4 : le fond, les quatre parois (les plus loin d'abord), le chargement, et les roues.
function DessinBenne({ x, y, dx, dy, plein, chargement, electrique }: { x: number; y: number; dx: number; dy: number; plein: boolean; chargement: [string, string][]; electrique: boolean }) {
  const longueur = Math.hypot(dx, dy) || 1
  const avant = { x: dx / longueur, y: dy / longueur }
  const cote = { x: -avant.y, y: avant.x }
  // Les quatre coins du bas, sur la grille, puis à l'écran ; les coins du haut sont plus haut à l'écran.
  const coins = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ].map(([a, b]) => {
    const g = { x: x + avant.x * (LONGUEUR / 2) * a + cote.x * (LARGEUR / 2) * b, y: y + avant.y * (LONGUEUR / 2) * a + cote.y * (LARGEUR / 2) * b }
    const e = versEcran(g.x, g.y)
    return { x: e.x, y: e.y - SUR_LES_RAILS }
  })
  const hauts = coins.map((c) => ({ x: c.x, y: c.y - HAUTEUR }))
  const pts = (liste: Point[]) => liste.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  // Les parois, triées de la plus loin (en haut de l'écran) à la plus proche.
  const parois = [0, 1, 2, 3]
    .map((i) => {
      const j = (i + 1) % 4
      const milieu = (coins[i].y + coins[j].y) / 2
      // Une paroi tournée vers la droite de l'écran est plus claire (la lumière vient de la droite).
      const versDroite = (coins[i].x + coins[j].x) / 2 > (coins[0].x + coins[2].x) / 2
      return { i, j, milieu, versDroite }
    })
    .sort((a, b) => a.milieu - b.milieu)
  const centre = versEcran(x, y)
  const centreHaut = { x: centre.x, y: centre.y - HAUTEUR - SUR_LES_RAILS }
  // Les roues : sous les deux grands côtés, vers l'avant et vers l'arrière.
  const roues = [
    [0.6, 1],
    [-0.6, 1],
    [0.6, -1],
    [-0.6, -1],
  ]
    .map(([a, b]) => versEcran(x + avant.x * (LONGUEUR / 2) * a + cote.x * (LARGEUR / 2 + 0.02) * b, y + avant.y * (LONGUEUR / 2) * a + cote.y * (LARGEUR / 2 + 0.02) * b))
    .map((r) => ({ x: r.x, y: r.y - SUR_LES_RAILS }))
  return (
    <g className={electrique ? 'benne-electrique' : ''}>
      <ellipse cx={centre.x} cy={centre.y + 1.5} rx={21} ry={9} fill="rgb(0 0 0 / 0.28)" />
      {roues
        .filter((r) => r.y < centre.y)
        .map((r, i) => (
          <ellipse key={`rf${i}`} cx={r.x} cy={r.y - 1} rx={3.8} ry={3.2} fill="#1e1e24" stroke="#000" strokeWidth={0.5} />
        ))}
      {/* Le fond de la benne (vu par l'ouverture). */}
      <polygon points={pts(hauts)} fill="#3a3a42" />
      {parois.map(({ i, j, versDroite }, k) => (
        <polygon
          key={k}
          points={pts([coins[i], coins[j], hauts[j], hauts[i]])}
          fill={versDroite ? '#8a8a96' : '#62626e'}
          stroke="#25252b"
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      ))}
      {/* Le chargement qui dépasse, seulement à l'aller. */}
      {plein && (
        <g>
          {[
            [-6, -1, 4.6],
            [3, -3.5, 4.3],
            [8, 0, 3.9],
            [-1, 2, 3.6],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={centreHaut.x + cx} cy={centreHaut.y + cy} r={r} fill={chargement[i][0]} stroke={chargement[i][1]} strokeWidth={0.5} />
          ))}
        </g>
      )}
      {/* Le bord doré, tout autour du haut. */}
      <polygon points={pts(hauts)} fill="none" stroke="#e2b13a" strokeWidth={1.4} strokeLinejoin="round" />
      {roues
        .filter((r) => r.y >= centre.y)
        .map((r, i) => (
          <ellipse key={`rv${i}`} cx={r.x} cy={r.y - 1} rx={3.8} ry={3.2} fill="#2a2a30" stroke="#000" strokeWidth={0.5} />
        ))}
    </g>
  )
}

export function WagonnetVillage({ etat, trajet: w }: { etat: EtatJeu; trajet: Trajet }) {
  const info = LIAISONS[w.liaison]
  const ligne = ligneDe(etat, w.liaison)
  // La trace de la voie (quelques dizaines de points : vite calculée, même à chaque image).
  const trace = ligne ? traceDeLaVoie(etat.village, ligne, info.depart, info.arrivee) : null
  const longueur = ligne ? longueurTrajet(ligne) : 1
  const vitesse = vitesseTrajet(etat, w)
  const joueurPousse = w.pousseur === 'joueur' && w.etape !== 'quai'

  // La dernière position donnée par le jeu, et quand on l'a reçue.
  const base = useRef({ distance: w.distance, etape: w.etape, temps: 0 }) // l'heure est notée juste après, dans l'effet
  useLayoutEffect(() => {
    base.current = { distance: w.distance, etape: w.etape, temps: performance.now() }
  }, [w.distance, w.etape])
  const vitesseRef = useRef(vitesse)
  useLayoutEffect(() => {
    vitesseRef.current = vitesse
  }, [vitesse])

  // La distance affichée : elle avance à chaque image, entre deux nouvelles du jeu.
  const [distance, setDistance] = useState(w.distance)
  useEffect(() => {
    let image = 0
    const animer = (maintenant: number) => {
      const b = base.current
      const roule = b.etape !== 'quai'
      const estimee = roule ? b.distance + (vitesseRef.current * Math.max(0, maintenant - b.temps)) / 1000 : 0
      setDistance(Math.min(longueur, estimee))
      image = requestAnimationFrame(animer)
    }
    image = requestAnimationFrame(animer)
    return () => cancelAnimationFrame(image)
  }, [longueur])

  // Les bruits : « ta-tac » à chaque joint de rail (une fois par case), et une cloche en arrivant.
  const total = trace ? longueurTrace(trace) : 1
  const dRoule = Math.max(0, Math.min(longueur, distance))
  const caseParcourue = w.etape === 'quai' ? -1 : Math.floor((dRoule / longueur) * total)
  const electrique = w.pousseur === 'electricite'
  useEffect(() => {
    if (caseParcourue > 0) sons.wagonnet(electrique ? 0.6 : 1)
  }, [caseParcourue, electrique])
  const etapeAvant = useRef(w.etape)
  useEffect(() => {
    if (etapeAvant.current === 'aller' && w.etape === 'retour') sons.cloche()
    etapeAvant.current = w.etape
  }, [w.etape])

  if (!ligne || !trace) return null
  // Où on en est sur la trace (du départ à l'arrivée), et dans quel sens on roule.
  const d = dRoule
  const depuisLeDepart = w.etape === 'retour' ? longueur - d : w.etape === 'aller' ? d : 0
  const s = (depuisLeDepart / longueur) * total
  const ici = surLaTrace(trace, s)
  const retour = w.etape === 'retour'
  const dx = retour ? -ici.dx : ici.dx
  const dy = retour ? -ici.dy : ici.dy
  // Le pousseur, un peu derrière, le long de la voie (dans les virages aussi).
  const sPousseur = Math.max(0, Math.min(total, s + (retour ? RECUL_POUSSEUR : -RECUL_POUSSEUR)))
  const pousseurIci = surLaTrace(trace, sPousseur)
  const orientation = orienter(dx, dy)
  const roule = w.etape !== 'quai'
  const mineur = roule && !joueurPousse ? etat.employes.find((m) => m.nom === w.pousseur && m.etape === 'pousse') : undefined
  const e = versEcran(ici.x, ici.y)
  return (
    <>
      <svg
        className={`wagonnet-village ${electrique ? 'wagonnet-electrique' : ''}`}
        style={{ left: e.x - 36, top: e.y - 48, zIndex: profondeur(ici.x, ici.y) + 4 }}
        viewBox={`${e.x - 36} ${e.y - 48} 72 64`}
        width={72}
        height={64}
        aria-hidden="true"
      >
        <DessinBenne x={ici.x} y={ici.y} dx={dx} dy={dy} plein={w.etape === 'aller'} chargement={CHARGEMENTS[w.liaison]} electrique={electrique} />
      </svg>
      {joueurPousse && <Perso qui="joueur" x={pousseurIci.x} y={pousseurIci.y} sens={orientation.sens} vue={orientation.vue} marche classe="perso-joueur" />}
      {mineur && (
        <Perso
          qui={RARETES[mineur.rarete] ? mineur.rarete : 'commun'}
          x={pousseurIci.x}
          y={pousseurIci.y}
          sens={orientation.sens}
          vue={orientation.vue}
          marche
          classe="perso-mineur"
          etiquette={<span className={`etiquette-perso rarete-${mineur.rarete}`}>{mineur.nom}</span>}
        />
      )}
    </>
  )
}
