// Un wagonnet sur les rails (23/10 ; un par trajet depuis le 24/10), et celui qui le pousse
// (toi ou un mineur).
//
// Pour qu'il roule de façon bien fluide, il a sa propre petite animation, à chaque image de
// l'écran : le jeu ne donne sa position que 20 fois par seconde, alors entre deux nouvelles, on
// le fait avancer tout seul à sa vitesse (on « devine » où il est). Il suit la voie : tout droit
// au milieu des cases, en quart de cercle dans les virages (traceDeLaVoie), et il se tourne
// dans le sens de la voie, d'un essieu à l'autre. On le dessine en 3D (Wagonnet3D.tsx).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LIAISONS, RARETES, SECONDES_CHARGEMENT_WAGONNET, type IdBatiment } from '../jeu/donnees'
import { totalObjets, type EtatJeu, type Trajet } from '../jeu/mineur'
import { capaciteWagonnet, ligneDe, longueurTrajet, vitesseTrajet } from '../jeu/wagonnet'
import { sons } from '../sons'
import { MiniJauge, Perso } from './ElementsVillage'
import { DessinWagonnet3D } from './Wagonnet3D'
import { longueurTrace, orienter, profondeur, surLaTrace, traceDeLaVoie, versEcran } from './iso'

// Les deux essieux sont à cette distance l'un de l'autre (en cases, le long de la voie) : le
// wagonnet se place entre eux et regarde de l'un vers l'autre. Dans un virage, il tourne donc
// petit à petit, comme un vrai wagonnet sur ses rails.
const ESSIEUX = 0.6
// Le pousseur marche à cette distance derrière le wagonnet (en cases, le long de la voie).
const RECUL_POUSSEUR = 1.15

// Ce que fait le wagonnet à son arrivée, selon le bâtiment.
const TEXTES_LIVRAISON: Partial<Record<IdBatiment, string>> = {
  marche: '💰 Vente',
  foreuse: '⚫ Livraison du charbon',
  generateur: '🔴 Livraison de la redstone',
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
  // (au marché, c'est la caisse qui sonne : voir sons.venteMarche)
  const versLeMarche = info.arrivee === 'marche'
  useEffect(() => {
    if (etapeAvant.current === 'aller' && w.etape === 'retour' && !versLeMarche) sons.cloche()
    etapeAvant.current = w.etape
  }, [w.etape, versLeMarche])

  if (!ligne || !trace) return null
  // Où on en est sur la trace (du départ à l'arrivée), et dans quel sens on roule.
  const d = dRoule
  const depuisLeDepart = w.etape === 'retour' ? longueur - d : w.etape === 'aller' ? d : 0
  const s = (depuisLeDepart / longueur) * total
  const retour = w.etape === 'retour'
  // Les deux essieux, sur la voie ; le wagonnet est entre les deux, tourné de l'un vers l'autre.
  const borne = (v: number) => Math.max(0, Math.min(total, v))
  const essieuA = surLaTrace(trace, borne(s + ESSIEUX / 2))
  const essieuB = surLaTrace(trace, borne(s - ESSIEUX / 2))
  const ici = { x: (essieuA.x + essieuB.x) / 2, y: (essieuA.y + essieuB.y) / 2 }
  const cap = Math.hypot(essieuA.x - essieuB.x, essieuA.y - essieuB.y) > 1e-3 ? { dx: essieuA.x - essieuB.x, dy: essieuA.y - essieuB.y } : surLaTrace(trace, s)
  const dx = retour ? -cap.dx : cap.dx
  const dy = retour ? -cap.dy : cap.dy
  // Plus il porte, plus il est rempli (le chargement est vidé à l'arrivée).
  const remplissage = Math.min(1, totalObjets(w.chargement) / capaciteWagonnet(etat))
  // Le pousseur, un peu derrière, le long de la voie (dans les virages aussi).
  const sPousseur = Math.max(0, Math.min(total, s + (retour ? RECUL_POUSSEUR : -RECUL_POUSSEUR)))
  const pousseurIci = surLaTrace(trace, sPousseur)
  const orientation = orienter(dx, dy)
  const roule = w.etape !== 'quai'
  const mineur = roule && !joueurPousse ? etat.employes.find((m) => m.nom === w.pousseur && m.etape === 'pousse') : undefined
  const e = versEcran(ici.x, ici.y)
  // À l'arrêt pour charger (au départ) ou pour livrer (à l'arrivée) : la distance est négative
  // pendant ce temps-là (voir wagonnet.ts). Une mini-jauge montre ce qui se passe.
  const enPause = roule && distance < 0 && vitesse > 0
  const restePause = enPause ? -distance / vitesse : 0
  const textePause = w.etape === 'aller' ? (info.depart === 'foreuse' ? '⚙️ Chargement du chariot' : '📦 Chargement') : TEXTES_LIVRAISON[info.arrivee] ?? '📦 Déchargement'
  return (
    <>
      {enPause && <MiniJauge x={e.x} y={e.y - 40} texte={textePause} part={1 - restePause / SECONDES_CHARGEMENT_WAGONNET} secondes={restePause} />}
      <svg
        className={`wagonnet-village ${electrique ? 'wagonnet-electrique' : ''}`}
        style={{ left: e.x - 40, top: e.y - 44, zIndex: profondeur(ici.x, ici.y) + 4 }}
        viewBox={`${e.x - 40} ${e.y - 44} 80 64`}
        width={80}
        height={64}
        aria-hidden="true"
      >
        <DessinWagonnet3D x={ici.x} y={ici.y} dx={dx} dy={dy} remplissage={remplissage} contenu={w.chargement} />
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
