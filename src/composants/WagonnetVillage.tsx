// Le wagonnet sur les rails (23/10), et celui qui le pousse (toi ou un mineur).
//
// Pour qu'il roule de façon bien fluide, il a sa propre petite animation, à chaque image de
// l'écran : le jeu ne donne sa position que 20 fois par seconde, alors entre deux nouvelles, on
// le fait avancer tout seul à sa vitesse (on « devine » où il est). Il suit la voie : tout droit
// au milieu des cases, en quart de cercle dans les virages (traceDeLaVoie), et il se tourne
// dans le sens de la voie. On le dessine comme une petite benne en volume (vue de 3/4).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { RARETES } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { ligneDuWagonnet, longueurTrajet, vitesseWagonnet } from '../jeu/wagonnet'
import { sons } from '../sons'
import { Perso } from './ElementsVillage'
import { longueurTrace, orienter, profondeur, surLaTrace, traceDeLaVoie, versEcran } from './iso'

type Point = { x: number; y: number }

// La taille de la benne, en cases (vue de dessus), et la hauteur de ses parois, en pixels du monde.
const LONGUEUR = 0.7
const LARGEUR = 0.5
const HAUTEUR = 11
// Le pousseur marche à cette distance derrière la benne (en cases, le long de la voie).
const RECUL_POUSSEUR = 0.85

// La benne vue de 3/4 : le fond, les quatre parois (les plus loin d'abord), le chargement, et les roues.
function DessinBenne({ x, y, dx, dy, plein, electrique }: { x: number; y: number; dx: number; dy: number; plein: boolean; electrique: boolean }) {
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
    return versEcran(g.x, g.y)
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
  const centreHaut = { x: centre.x, y: centre.y - HAUTEUR }
  // Les roues : sous les deux grands côtés, vers l'avant et vers l'arrière.
  const roues = [
    [0.6, 1],
    [-0.6, 1],
    [0.6, -1],
    [-0.6, -1],
  ].map(([a, b]) => versEcran(x + avant.x * (LONGUEUR / 2) * a + cote.x * (LARGEUR / 2 + 0.02) * b, y + avant.y * (LONGUEUR / 2) * a + cote.y * (LARGEUR / 2 + 0.02) * b))
  return (
    <g className={electrique ? 'benne-electrique' : ''}>
      <ellipse cx={centre.x} cy={centre.y + 1.5} rx={14} ry={6} fill="rgb(0 0 0 / 0.28)" />
      {roues
        .filter((r) => r.y < centre.y)
        .map((r, i) => (
          <ellipse key={`rf${i}`} cx={r.x} cy={r.y - 1} rx={2.8} ry={2.4} fill="#1e1e24" stroke="#000" strokeWidth={0.5} />
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
      {/* Le chargement : des minerais qui dépassent, seulement à l'aller. */}
      {plein && (
        <g>
          <circle cx={centreHaut.x - 4} cy={centreHaut.y - 1} r={3.3} fill="#4ee8dc" stroke="#1a7a72" strokeWidth={0.5} />
          <circle cx={centreHaut.x + 2} cy={centreHaut.y - 2.5} r={3.1} fill="#ffd84a" stroke="#9a7a10" strokeWidth={0.5} />
          <circle cx={centreHaut.x + 6} cy={centreHaut.y} r={2.8} fill="#e04848" stroke="#7a1a1a" strokeWidth={0.5} />
          <circle cx={centreHaut.x - 1} cy={centreHaut.y + 1.5} r={2.6} fill="#9a9a9a" stroke="#555" strokeWidth={0.5} />
        </g>
      )}
      {/* Le bord doré, tout autour du haut. */}
      <polygon points={pts(hauts)} fill="none" stroke="#e2b13a" strokeWidth={1.4} strokeLinejoin="round" />
      {roues
        .filter((r) => r.y >= centre.y)
        .map((r, i) => (
          <ellipse key={`rv${i}`} cx={r.x} cy={r.y - 1} rx={2.8} ry={2.4} fill="#2a2a30" stroke="#000" strokeWidth={0.5} />
        ))}
    </g>
  )
}

export function WagonnetVillage({ etat, joueurPousse }: { etat: EtatJeu; joueurPousse: boolean }) {
  const ligne = ligneDuWagonnet(etat)
  const w = etat.wagonnet
  // La trace de la voie (quelques dizaines de points : vite calculée, même à chaque image).
  const trace = ligne ? traceDeLaVoie(etat.village, ligne) : null
  const longueur = ligne ? longueurTrajet(ligne) : 1
  const vitesse = vitesseWagonnet(etat)

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

  // Les bruits : « ta-tac » à chaque joint de rail (une fois par case), et une cloche en arrivant
  // au marché.
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
  // Où on en est sur la trace (de la mine au marché), et dans quel sens on roule.
  const d = dRoule
  const depuisLaMine = w.etape === 'retour' ? longueur - d : w.etape === 'aller' ? d : 0
  const s = (depuisLaMine / longueur) * total
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
        className={`wagonnet-village ${w.pousseur === 'electricite' ? 'wagonnet-electrique' : ''}`}
        style={{ left: e.x - 24, top: e.y - 34, zIndex: profondeur(ici.x, ici.y) + 4 }}
        viewBox={`${e.x - 24} ${e.y - 34} 48 44`}
        width={48}
        height={44}
        aria-hidden="true"
      >
        <DessinBenne x={ici.x} y={ici.y} dx={dx} dy={dy} plein={w.etape === 'aller'} electrique={w.pousseur === 'electricite'} />
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
