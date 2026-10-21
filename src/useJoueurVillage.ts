// Le joueur qui se promène dans le village vu du ciel : il marche avec les flèches du clavier
// (on avance tant que la touche est appuyée, sans traverser les bâtiments), ou tout seul jusqu'à
// un bâtiment quand on clique dessus (il contourne ce qui le gêne), puis il fait quelque chose en
// arrivant (ouvrir le panneau du bâtiment, entrer dans la mine...). La barre d'espace le fait sauter.
// C'est seulement de l'affichage : la logique du jeu ne sait pas où il est dans le village.

import { useCallback, useEffect, useRef, useState } from 'react'
import { TAILLE_GRILLE, VITESSE_JOUEUR } from './jeu/donnees'
import { batimentPose, caseAcces, caseBloquee, trouverChemin, type Case, type Village } from './jeu/village'

export type DirectionFleche = 'haut' | 'bas' | 'gauche' | 'droite'

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
}

// Là où le joueur apparaît : devant l'entrée de la mine.
function departMine(village: Village): { x: number; y: number } {
  const mine = batimentPose(village, 'puits')
  if (!mine) return { x: TAILLE_GRILLE / 2, y: TAILLE_GRILLE - 2 }
  const acces = caseAcces(village, mine)
  return { x: acces.x + 0.5, y: acces.y + 0.5 }
}

export function useJoueurVillage(village: Village, actif: boolean) {
  const [joueur, setJoueur] = useState<EtatJoueurVillage>(() => ({ ...departMine(village), sens: 1, vue: 'face', marche: false, saut: 0 }))
  const joueurRef = useRef(joueur)
  const villageRef = useRef(village)
  useEffect(() => {
    villageRef.current = village
  }, [village])
  const touches = useRef(new Set<DirectionFleche>())
  const chemin = useRef<{ points: { x: number; y: number }[]; quandArrive?: () => void } | null>(null)

  const changer = useCallback((nouveau: Partial<EtatJoueurVillage>) => {
    joueurRef.current = { ...joueurRef.current, ...nouveau }
    setJoueur(joueurRef.current)
  }, [])

  // Dans quel sens il regarde, d'après son mouvement sur la grille.
  const orientation = (dx: number, dy: number): Pick<EtatJoueurVillage, 'sens' | 'vue'> => {
    const ecranX = dx - dy
    const ecranY = dx + dy
    return {
      sens: Math.abs(ecranX) > 0.01 ? (ecranX > 0 ? 1 : -1) : joueurRef.current.sens,
      vue: Math.abs(ecranY) > 0.01 ? (ecranY < 0 ? 'dos' : 'face') : joueurRef.current.vue,
    }
  }

  // Peut-il se tenir à cet endroit ? (pas dans un bâtiment, ni hors de la clairière)
  const libre = (x: number, y: number) => !caseBloquee(villageRef.current, Math.floor(x), Math.floor(y))

  // La boucle d'animation : à chaque image, il avance un peu.
  useEffect(() => {
    if (!actif) return
    let derniereFois = performance.now()
    let image = 0
    const avancer = (maintenant: number) => {
      const secondes = Math.min(0.1, (maintenant - derniereFois) / 1000)
      derniereFois = maintenant
      const pas = VITESSE_JOUEUR * secondes
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
          dx = (dx / longueur) * pas
          dy = (dy / longueur) * pas
          // On glisse le long des obstacles : on essaie les deux axes séparément.
          let nx = x
          let ny = y
          if (libre(x + dx, y)) nx = x + dx
          if (libre(nx, y + dy)) ny = y + dy
          changer({ x: nx, y: ny, marche: true, ...orientation(dx, dy) })
        }
      } else if (chemin.current !== null) {
        // Il suit son chemin, point par point.
        const cible = chemin.current.points[0]
        const ex = cible.x - x
        const ey = cible.y - y
        const distance = Math.hypot(ex, ey)
        if (distance <= pas) {
          chemin.current.points.shift()
          changer({ x: cible.x, y: cible.y, marche: true })
          if (chemin.current.points.length === 0) {
            const quandArrive = chemin.current.quandArrive
            chemin.current = null
            changer({ marche: false })
            quandArrive?.()
          }
        } else {
          changer({ x: x + (ex / distance) * pas, y: y + (ey / distance) * pas, marche: true, ...orientation(ex, ey) })
        }
      } else if (joueurRef.current.marche) {
        changer({ marche: false })
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
      touches.current.add(direction)
    } else touches.current.delete(direction)
  }, [])

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
      quandArrive?.()
      return
    }
    const cases = trouverChemin(villageRef.current, depart, cible) ?? [depart, cible]
    chemin.current = { points: cases.slice(1).map((c) => ({ x: c.x + 0.5, y: c.y + 0.5 })), quandArrive }
    if (chemin.current.points.length === 0) chemin.current.points.push({ x: cible.x + 0.5, y: cible.y + 0.5 })
  }, [])

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
