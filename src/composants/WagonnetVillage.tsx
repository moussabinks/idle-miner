// Un wagonnet sur les rails (23/10 ; un par trajet depuis le 24/10), et celui qui le pousse
// (toi ou un mineur).
//
// Pour qu'il roule de façon bien fluide, il a sa propre petite animation, à chaque image de
// l'écran : le jeu ne donne sa position que 20 fois par seconde, alors entre deux nouvelles, on
// le fait avancer tout seul à sa vitesse (on « devine » où il est). Il suit la voie : tout droit
// au milieu des cases, en quart de cercle dans les virages (traceDeLaVoie), et il se tourne
// dans le sens de la voie, d'un essieu à l'autre. On le dessine en 3D (Wagonnet3D.tsx).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BLOCS, LIAISONS, RARETES, type IdBatiment } from '../jeu/donnees'
import { totalObjets, valeurDe, type EtatJeu, type Inventaire, type Trajet } from '../jeu/mineur'
import { capaciteTrajet, ligneDe, longueurTrajet, secondesArret, vitesseTrajet } from '../jeu/wagonnet'
import { sons } from '../sons'
import { MiniJauge, Perso } from './ElementsVillage'
import { DessinWagonnet3D } from './Wagonnet3D'
import { longueurTrace, orienter, profondeur, surLaTrace, traceDeLaVoie, versEcran } from './iso'
import { nomEmploye, t } from '../jeu/langue'

// Les deux essieux sont à cette distance l'un de l'autre (en cases, le long de la voie) : le
// wagonnet se place entre eux et regarde de l'un vers l'autre. Dans un virage, il tourne donc
// petit à petit, comme un vrai wagonnet sur ses rails.
const ESSIEUX = 0.6
// Le pousseur marche à cette distance derrière le wagonnet (en cases, le long de la voie).
const RECUL_POUSSEUR = 1.15

// Ce que fait le wagonnet à son arrivée, selon le bâtiment.
// (une fonction : le texte est traduit au moment de l'afficher, dans la langue choisie)
const TEXTES_LIVRAISON: Partial<Record<IdBatiment, () => string>> = {
  marche: () => `💰 ${t('Vente')}`,
  foreuse: () => `⚫ ${t('Livraison du charbon')}`,
  generateur: () => `🔴 ${t('Livraison de la redstone')}`,
}

// La vente d'un wagonnet au marché (27/10) : quand il a fini de décharger, un « +X $ » doré
// jaillit juste au-dessus de lui (par-dessus le marché), compte de 0 jusqu'au montant, avec une
// onde, des étoiles, les minerais vendus qui sautent et une fontaine de pièces qui retombent.
type Vente = { id: number; montant: number; x: number; y: number; objets: string[] }
const DUREE_VENTE = 2000 // ms
let prochaineVente = 0

// La fontaine de pièces : 12 pièces en éventail, qui montent puis retombent.
const PIECES = Array.from({ length: 12 }, (_, i) => {
  const angle = Math.PI * (1.12 + (i / 11) * 0.76)
  const portee = 34 + (i % 3) * 12
  return { dx: Math.round(Math.cos(angle) * portee), dy: Math.round(Math.sin(angle) * portee), retard: (i % 4) * 40 }
})
// Les étoiles autour du montant.
const ETOILES = [
  { dx: -46, dy: -12, retard: 60 },
  { dx: 44, dy: -18, retard: 140 },
  { dx: -30, dy: -38, retard: 220 },
  { dx: 32, dy: -40, retard: 300 },
]

function VenteWagonnet({ vente }: { vente: Vente }) {
  // Le montant monte de 0 jusqu'au total en un peu moins d'une demi-seconde (ralenti à la fin).
  const [affiche, setAffiche] = useState(0)
  useEffect(() => {
    let image = 0
    const debut = performance.now()
    const compter = (maintenant: number) => {
      const t = Math.max(0, Math.min(1, (maintenant - debut) / 450))
      setAffiche(Math.round(vente.montant * (1 - (1 - t) ** 3)))
      if (t < 1) image = requestAnimationFrame(compter)
    }
    image = requestAnimationFrame(compter)
    return () => cancelAnimationFrame(image)
  }, [vente.montant])
  const fini = affiche === vente.montant
  return (
    <span className="vente-wagonnet" style={{ left: vente.x, top: vente.y }} aria-hidden="true">
      <span className="vente-onde" />
      {vente.objets.map((emoji, i) => (
        <span key={i} className="vente-objet" style={{ ['--dx' as string]: `${(i - (vente.objets.length - 1) / 2) * 18}px`, animationDelay: `${i * 70}ms` }}>
          {emoji}
        </span>
      ))}
      {PIECES.map((p, i) => (
        <i key={i} className="vente-piece" style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, animationDelay: `${120 + p.retard}ms` }} />
      ))}
      {ETOILES.map((e, i) => (
        <b key={i} className="vente-etoile" style={{ ['--dx' as string]: `${e.dx}px`, ['--dy' as string]: `${e.dy}px`, animationDelay: `${e.retard}ms` }}>
          ✦
        </b>
      ))}
      <span className={`vente-texte ${fini ? 'vente-fini' : ''} ${vente.montant >= 500 ? 'vente-grosse' : ''}`}>
        +{affiche.toLocaleString('fr-FR')} $
      </span>
    </span>
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
  // (au marché, c'est la caisse qui sonne : voir sons.venteMarche)
  const versLeMarche = info.arrivee === 'marche'
  useEffect(() => {
    if (etapeAvant.current === 'aller' && w.etape === 'retour' && !versLeMarche) sons.cloche()
    etapeAvant.current = w.etape
  }, [w.etape, versLeMarche])

  // La vente au marché : le chargement vient d'être vidé (à la fin du déchargement).
  const [ventes, setVentes] = useState<Vente[]>([])
  const chargementAvant = useRef<Inventaire>(w.chargement)
  useEffect(() => {
    const avant = chargementAvant.current
    chargementAvant.current = w.chargement
    if (!versLeMarche || !trace || w.etape !== 'retour' || totalObjets(avant) === 0 || totalObjets(w.chargement) > 0) return
    const montant = valeurDe(avant)
    if (montant <= 0) return
    // Les 3 minerais les plus chers du chargement, qui sautent avant de devenir des pièces.
    const objets = Object.keys(avant)
      .sort((a, b) => BLOCS[b as keyof typeof BLOCS].prix - BLOCS[a as keyof typeof BLOCS].prix)
      .slice(0, 3)
      .map((id) => BLOCS[id as keyof typeof BLOCS].emoji)
    // Il a fini de décharger au bout de la voie, devant le marché : c'est là que jaillit la vente.
    const fin = longueurTrace(trace)
    const a = surLaTrace(trace, fin)
    const b = surLaTrace(trace, Math.max(0, fin - ESSIEUX / 2))
    const ou = versEcran((a.x + b.x) / 2, (a.y + b.y) / 2)
    const vente = { id: prochaineVente++, montant, x: ou.x, y: ou.y - 46, objets }
    setVentes((liste) => [...liste.slice(-1), vente])
    window.setTimeout(() => setVentes((liste) => liste.filter((v) => v.id !== vente.id)), DUREE_VENTE)
  }, [w.chargement, w.etape, versLeMarche, trace])
  const ventesVisibles = ventes.map((v) => <VenteWagonnet key={`vente${v.id}`} vente={v} />)

  if (!ligne || !trace) return <>{ventesVisibles}</>
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
  const remplissage = Math.min(1, totalObjets(w.chargement) / capaciteTrajet(etat, w.liaison))
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
  // (pendant ce temps, le pousseur attend à l'arrêt, sans marcher : 28/10)
  const textePause = w.etape === 'aller' ? (info.depart === 'foreuse' ? `⚙️ ${t('Chargement du chariot')}` : `📦 ${t('Chargement')}`) : (TEXTES_LIVRAISON[info.arrivee]?.() ?? `📦 ${t('Déchargement')}`)
  return (
    <>
      {ventesVisibles}
      {/* (23/10) La jauge seulement quand il vend au marché (plus pour charger ou décharger). */}
      {enPause && w.etape !== 'aller' && info.arrivee === 'marche' && <MiniJauge x={e.x} y={e.y - 40} texte={textePause} part={1 - restePause / secondesArret(etat, w.liaison)} secondes={restePause} />}
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
      {joueurPousse && <Perso qui="joueur" x={pousseurIci.x} y={pousseurIci.y} sens={orientation.sens} vue={orientation.vue} marche={!enPause} classe="perso-joueur perso-pousseur" />}
      {mineur && (
        <Perso
          qui={RARETES[mineur.rarete] ? mineur.rarete : 'commun'}
          x={pousseurIci.x}
          y={pousseurIci.y}
          sens={orientation.sens}
          vue={orientation.vue}
          marche={!enPause}
          classe="perso-mineur perso-pousseur"
          etiquette={<span className={`etiquette-perso rarete-${mineur.rarete}`}>{nomEmploye(mineur.nom)}</span>}
        />
      )}
    </>
  )
}
