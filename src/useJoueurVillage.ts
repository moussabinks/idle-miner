// Le joueur qui se promène dans le village vu du ciel : il marche avec les flèches du clavier
// (on avance tant que la touche est appuyée, sans traverser les bâtiments), ou tout seul jusqu'à
// un bâtiment quand on clique dessus (il contourne ce qui le gêne), puis il fait quelque chose en
// arrivant (ouvrir le panneau du bâtiment, entrer dans la mine...). La barre d'espace le fait sauter.
// C'est seulement de l'affichage : la logique du jeu ne sait pas où il est dans le village.

import { useCallback, useEffect, useRef, useState } from 'react'
import { TAILLE_GRILLE, VITESSE_JOUEUR } from './jeu/donnees'
import { batimentPose, caseAcces, caseBloquee, casesBloquees, cleCase, trouverChemin, type Case, type Village } from './jeu/village'

export type DirectionFleche = 'haut' | 'bas' | 'gauche' | 'droite'

// Pour une marche fluide (23/10) : il prend de l'élan au départ et freine à l'arrivée, au lieu
// de démarrer et de s'arrêter d'un coup.
const ACCELERATION = 30 // cases par seconde, chaque seconde
const FREINAGE = 18

// Une flèche du clavier → une direction sur la grille (la vue est tournée de 45°) :
// ↑ monte vers le haut de l'écran (x et y diminuent), → va vers la droite (x augmente, y diminue)...
const DIRECTIONS: Record<DirectionFleche, { x: number; y: number }> = {
  haut: { x: -1, y: -1 },
  bas: { x: 1, y: 1 },
  gauche: { x: -1, y: 1 },
  droite: { x: 1, y: -1 },
}

export type EtatJoueurVillage = {
  x: number
  y: number
  sens: 1 | -1 // 1 = tourné vers la droite de l'écran
  vue: 'face' | 'dos' // de face quand il vient vers nous, de dos quand il s'éloigne
  marche: boolean
  saut: number // change à chaque saut (pour relancer l'animation)
  destination: { x: number; y: number } | null // là où il va (un petit repère y est dessiné)
}

// Là où le joueur apparaît : devant l'entrée de la mine.
function departMine(village: Village): { x: number; y: number } {
  const mine = batimentPose(village, 'puits')
  if (!mine) return { x: TAILLE_GRILLE / 2, y: TAILLE_GRILLE - 2 }
  const acces = caseAcces(village, mine)
  return { x: acces.x + 0.5, y: acces.y + 0.5 }
}

export function useJoueurVillage(village: Village, actif: boolean) {
  const [joueur, setJoueur] = useState<EtatJoueurVillage>(() => ({ ...departMine(village), sens: 1, vue: 'face', marche: false, saut: 0, destination: null }))
  const joueurRef = useRef(joueur)
  const villageRef = useRef(village)
  // Les cases où l'on ne passe pas, calculées une fois par changement du village (pas à chaque image).
  const bloqueesRef = useRef(casesBloquees(village))
  useEffect(() => {
    villageRef.current = village
    bloqueesRef.current = casesBloquees(village)
  }, [village])
  const touches = useRef(new Set<DirectionFleche>())
  const chemin = useRef<{ points: { x: number; y: number }[]; quandArrive?: () => void } | null>(null)

  const changer = useCallback((nouveau: Partial<EtatJoueurVillage>) => {
    joueurRef.current = { ...joueurRef.current, ...nouveau }
    setJoueur(joueurRef.current)
  }, [])

  // Peut-il se tenir à cet endroit ? (pas dans un bâtiment, ni hors de la clairière)
  const libre = (x: number, y: number) => {
    const cx = Math.floor(x)
    const cy = Math.floor(y)
    return cx >= 0 && cy >= 0 && cx < TAILLE_GRILLE && cy < TAILLE_GRILLE && !bloqueesRef.current.has(cleCase(cx, cy))
  }

  // Sa vitesse en ce moment (en cases par seconde) : elle monte jusqu'à VITESSE_JOUEUR.
  const vitesse = useRef(0)

  // Dans quel sens il regarde, sans changer d'image à chaque petit écart (sinon il « clignote »
  // entre deux images dans les virages) : il faut que le mouvement aille assez nettement d'un côté.
  const regarder = (dx: number, dy: number): Pick<EtatJoueurVillage, 'sens' | 'vue'> => {
    const ecranX = dx - dy
    const ecranY = dx + dy
    const longueur = Math.hypot(ecranX, ecranY)
    if (longueur === 0) return { sens: joueurRef.current.sens, vue: joueurRef.current.vue }
    return {
      sens: Math.abs(ecranX) > 0.3 * longueur ? (ecranX > 0 ? 1 : -1) : joueurRef.current.sens,
      vue: Math.abs(ecranY) > 0.3 * longueur ? (ecranY < 0 ? 'dos' : 'face') : joueurRef.current.vue,
    }
  }

  // La boucle d'animation : à chaque image, il avance un peu.
  useEffect(() => {
    if (!actif) return
    let derniereFois = performance.now()
    let image = 0
    const avancer = (maintenant: number) => {
      const secondes = Math.max(0, Math.min(0.05, (maintenant - derniereFois) / 1000))
      derniereFois = maintenant
      const { x, y } = joueurRef.current

      if (touches.current.size > 0) {
        // Au clavier : on additionne les flèches appuyées (↑ + → = en diagonale).
        let dx = 0
        let dy = 0
        for (const t of touches.current) {
          dx += DIRECTIONS[t].x
          dy += DIRECTIONS[t].y
        }
        const longueur = Math.hypot(dx, dy)
        if (longueur > 0) {
          vitesse.current = Math.min(VITESSE_JOUEUR, vitesse.current + ACCELERATION * secondes)
          const pas = vitesse.current * secondes
          dx = (dx / longueur) * pas
          dy = (dy / longueur) * pas
          // On glisse le long des obstacles : on essaie les deux axes séparément.
          let nx = x
          let ny = y
          if (libre(x + dx, y)) nx = x + dx
          if (libre(nx, y + dy)) ny = y + dy
          changer({ x: nx, y: ny, marche: true, ...regarder(dx, dy) })
        }
      } else if (chemin.current !== null && chemin.current.points.length > 0) {
        // Il suit son chemin (déjà lissé : de grandes lignes droites), en freinant à l'arrivée.
        const points = chemin.current.points
        let reste = 0
        let px = x
        let py = y
        for (const point of points) {
          reste += Math.hypot(point.x - px, point.y - py)
          px = point.x
          py = point.y
        }
        const vitesseMax = Math.min(VITESSE_JOUEUR, Math.sqrt(2 * FREINAGE * reste) + 0.8)
        vitesse.current = Math.min(vitesseMax, vitesse.current + ACCELERATION * secondes)
        let pas = vitesse.current * secondes
        let nx = x
        let ny = y
        let dernierDx = 0
        let dernierDy = 0
        // On avance du pas, quitte à passer un ou plusieurs points dans la même image.
        while (pas > 0 && points.length > 0) {
          const cible = points[0]
          const ex = cible.x - nx
          const ey = cible.y - ny
          const distance = Math.hypot(ex, ey)
          if (distance <= pas) {
            nx = cible.x
            ny = cible.y
            pas -= distance
            points.shift()
            if (distance > 0) {
              dernierDx = ex
              dernierDy = ey
            }
          } else {
            nx += (ex / distance) * pas
            ny += (ey / distance) * pas
            dernierDx = ex
            dernierDy = ey
            pas = 0
          }
        }
        if (points.length === 0) {
          const quandArrive = chemin.current.quandArrive
          chemin.current = null
          vitesse.current = 0
          changer({ x: nx, y: ny, marche: false, destination: null, ...regarder(dernierDx, dernierDy) })
          quandArrive?.()
        } else {
          changer({ x: nx, y: ny, marche: true, ...regarder(dernierDx, dernierDy) })
        }
      } else {
        vitesse.current = 0
        if (joueurRef.current.marche) changer({ marche: false })
      }
      image = requestAnimationFrame(avancer)
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [actif, changer])

  // Une flèche appuyée (ou relâchée) : il marche dans cette direction.
  const fleche = useCallback((direction: DirectionFleche, appuyee: boolean) => {
    if (appuyee) {
      chemin.current = null // les flèches reprennent la main
      if (joueurRef.current.destination) changer({ destination: null })
      touches.current.add(direction)
    } else touches.current.delete(direction)
  }, [changer])

  const arreterFleches = useCallback(() => touches.current.clear(), [])

  // Marcher tout seul jusqu'à une case (en contournant ce qui gêne), puis faire quelque chose.
  // Une case hors de la clairière (dans la forêt, sur la plage) : il marche vers elle, mais
  // s'arrête au bord de la clairière, comme contre une barrière invisible (22/10).
  const allerVers = useCallback((demandee: Case, quandArrive?: () => void) => {
    touches.current.clear()
    const cible = caseLibreProche(villageRef.current, auBordDeLaClairiere(joueurRef.current, demandee))
    const depart = { x: Math.floor(joueurRef.current.x), y: Math.floor(joueurRef.current.y) }
    if (depart.x === cible.x && depart.y === cible.y) {
      chemin.current = null
      changer({ destination: null })
      quandArrive?.()
      return
    }
    const cases = trouverChemin(villageRef.current, depart, cible) ?? [depart, cible]
    const centres = cases.slice(1).map((c) => ({ x: c.x + 0.5, y: c.y + 0.5 }))
    if (centres.length === 0) centres.push({ x: cible.x + 0.5, y: cible.y + 0.5 })
    // On lisse le chemin : au lieu de passer par le centre de chaque case (en escalier), il va en
    // ligne droite jusqu'au point le plus loin qu'il voit sans obstacle.
    chemin.current = { points: lisserChemin(villageRef.current, joueurRef.current, centres), quandArrive }
    changer({ destination: centres[centres.length - 1] })
  }, [changer])

  const sauter = useCallback(() => changer({ saut: joueurRef.current.saut + 1 }), [changer])

  // Le remettre devant la mine (au chargement de la partie...).
  const placerALaMine = useCallback(() => {
    touches.current.clear()
    chemin.current = null
    changer({ ...departMine(villageRef.current), marche: false, vue: 'face' })
  }, [changer])

  // Un bâtiment vient d'être posé sur lui : il sort par la case libre la plus proche.
  useEffect(() => {
    const { x, y } = joueurRef.current
    if (!caseBloquee(village, Math.floor(x), Math.floor(y))) return
    for (let rayon = 1; rayon < TAILLE_GRILLE; rayon++) {
      for (let dx = -rayon; dx <= rayon; dx++) {
        for (let dy = -rayon; dy <= rayon; dy++) {
          if (!caseBloquee(village, Math.floor(x) + dx, Math.floor(y) + dy)) {
            changer({ x: Math.floor(x) + dx + 0.5, y: Math.floor(y) + dy + 0.5 })
            return
          }
        }
      }
    }
  }, [village, changer])

  return { joueur, fleche, arreterFleches, allerVers, sauter, placerALaMine }
}

// Le point où l'on sort de la clairière en allant de « depuis » vers la case demandée (ou la case
// elle-même si elle est dans la clairière) : la marche s'arrête là, au bord.
function auBordDeLaClairiere(depuis: { x: number; y: number }, demandee: Case): Case {
  const n = TAILLE_GRILLE
  const dedans = (c: Case) => c.x >= 0 && c.y >= 0 && c.x < n && c.y < n
  if (dedans(demandee)) return demandee
  // On avance le long du trait, du joueur vers le clic, tant qu'on reste à l'intérieur.
  const bx = demandee.x + 0.5
  const by = demandee.y + 0.5
  let t = 1
  const limite = (depart: number, arrivee: number) => {
    const d = arrivee - depart
    if (d > 0 && arrivee > n - 0.5) t = Math.min(t, (n - 0.5 - depart) / d)
    if (d < 0 && arrivee < 0.5) t = Math.min(t, (0.5 - depart) / d)
  }
  limite(depuis.x, bx)
  limite(depuis.y, by)
  t = Math.max(0, t)
  const x = Math.floor(depuis.x + (bx - depuis.x) * t)
  const y = Math.floor(depuis.y + (by - depuis.y) * t)
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) }
}

// La case libre la plus proche (elle-même si elle est libre) : on ne s'arrête pas dans un bâtiment.
function caseLibreProche(village: Village, c: Case): Case {
  if (!caseBloquee(village, c.x, c.y)) return c
  for (let rayon = 1; rayon < TAILLE_GRILLE; rayon++) {
    for (let dx = -rayon; dx <= rayon; dx++) {
      for (let dy = -rayon; dy <= rayon; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rayon) continue
        if (!caseBloquee(village, c.x + dx, c.y + dy)) return { x: c.x + dx, y: c.y + dy }
      }
    }
  }
  return c
}

// Peut-on aller en ligne droite de a à b sans toucher un bâtiment ? On regarde des points tout
// le long du trait, et un peu à gauche et à droite (le personnage a une largeur).
function ligneLibre(bloquees: Set<string>, a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  const longueur = Math.hypot(b.x - a.x, b.y - a.y)
  if (longueur === 0) return true
  const nx = -(b.y - a.y) / longueur
  const ny = (b.x - a.x) / longueur
  const etapes = Math.ceil(longueur / 0.25)
  for (let i = 0; i <= etapes; i++) {
    const t = i / etapes
    const x = a.x + (b.x - a.x) * t
    const y = a.y + (b.y - a.y) * t
    for (const cote of [-0.28, 0, 0.28]) {
      const cx = Math.floor(x + nx * cote)
      const cy = Math.floor(y + ny * cote)
      if (cx < 0 || cy < 0 || cx >= TAILLE_GRILLE || cy >= TAILLE_GRILLE || bloquees.has(cleCase(cx, cy))) return false
    }
  }
  return true
}

// Le chemin lissé : depuis là où il est, on saute au point le plus loin qu'on voit en ligne droite.
function lisserChemin(village: Village, depart: { x: number; y: number }, points: { x: number; y: number }[]): { x: number; y: number }[] {
  const bloquees = casesBloquees(village) // calculé une seule fois pour tout le chemin
  const lisse: { x: number; y: number }[] = []
  let ici = depart
  let i = 0
  while (i < points.length) {
    let loin = i
    for (let j = points.length - 1; j > i; j--) {
      if (ligneLibre(bloquees, ici, points[j])) {
        loin = j
        break
      }
    }
    lisse.push(points[loin])
    ici = points[loin]
    i = loin + 1
  }
  return lisse
}
