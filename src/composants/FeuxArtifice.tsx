// Les feux d'artifice de la restauration du château (27/10) : par-dessus tout l'écran, des fusées
// montent du bas et éclatent en gerbes de couleurs (les couleurs du jeu, chaque étincelle avec son
// petit contour d'encre, façon cartoon). Une « toile » (canvas) seulement le temps du spectacle.

import { useEffect, useRef } from 'react'
import { sons } from '../sons'

const COULEURS = ['#f9d65a', '#f39aa8', '#8cc8f5', '#a77df0', '#8fe08f', '#f6a04d', '#ffffff', '#5fe0e6']
const ENCRE = '#2a2140'
const GRAVITE = 260 // pixels par seconde, chaque seconde

type Fusee = { x: number; y: number; vy: number; cible: number; couleur: string; sorte: number }
type Etincelle = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number; scintille: boolean }
// L'éclair blanc au cœur de chaque gerbe, au moment où elle éclate.
type Eclair = { x: number; y: number; vie: number; couleur: string }

type Props = {
  duree: number // secondes pendant lesquelles on lance des fusées (le spectacle finit un peu après)
  onFini: () => void
}

export function FeuxArtifice({ duree, onFini }: Props) {
  const toileRef = useRef<HTMLCanvasElement>(null)
  // (onFini change à chaque rendu du parent : on garde le dernier sans relancer le spectacle)
  const finRef = useRef(onFini)
  useEffect(() => {
    finRef.current = onFini
  }, [onFini])

  useEffect(() => {
    const toile = toileRef.current
    const ctx = toile?.getContext('2d')
    if (!toile || !ctx) return
    const densite = Math.min(2, window.devicePixelRatio || 1)
    const mesurer = () => {
      toile.width = Math.round(window.innerWidth * densite)
      toile.height = Math.round(window.innerHeight * densite)
    }
    mesurer()
    window.addEventListener('resize', mesurer)

    const fusees: Fusee[] = []
    const etincelles: Etincelle[] = []
    const eclairs: Eclair[] = []
    let temps = 0
    let prochaine = 0
    let rang = 0
    let avant = performance.now()
    let image = 0

    const lancer = (x: number) => {
      const l = window.innerWidth
      const h = window.innerHeight
      const cible = h * (0.12 + Math.random() * 0.33)
      fusees.push({ x: x * l, y: h + 10, vy: -Math.sqrt(2 * GRAVITE * (h - cible)) * 1.05, cible, couleur: COULEURS[rang % COULEURS.length], sorte: rang % 3 })
      rang += 1
      sons.feuArtifice(0.6 + Math.random() * 0.4)
    }

    const eclater = (f: Fusee) => {
      const petit = window.innerWidth < 600
      const n = f.sorte === 1 ? 34 : 56
      const vitesse = (petit ? 200 : 330) * (0.8 + Math.random() * 0.4)
      eclairs.push({ x: f.x, y: f.y, vie: 0, couleur: f.couleur })
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + Math.random() * 0.08
        // un anneau bien rond (sorte 1), ou une boule pleine (les autres)
        const v = f.sorte === 1 ? vitesse : vitesse * (0.35 + Math.random() * 0.65)
        etincelles.push({
          x: f.x,
          y: f.y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          vie: 0,
          duree: 1.1 + Math.random() * 0.6,
          // une gerbe sur deux mélange deux couleurs
          couleur: f.sorte === 2 && i % 2 ? COULEURS[(rang + 3) % COULEURS.length] : f.couleur,
          taille: petit ? 4.5 : 6.5,
          scintille: f.sorte === 2,
        })
      }
    }

    const dessiner = (maintenant: number) => {
      const dt = Math.min(0.05, (maintenant - avant) / 1000)
      avant = maintenant
      temps += dt
      // Une fusée de temps en temps (un peu plus serré au milieu du spectacle), parfois deux d'un coup.
      if (temps < duree && temps >= prochaine) {
        lancer(0.15 + Math.random() * 0.7)
        if (Math.random() < 0.35) lancer(0.15 + Math.random() * 0.7)
        prochaine = temps + 0.28 + Math.random() * 0.35
      }
      for (const f of fusees) {
        f.vy += GRAVITE * dt
        f.y += f.vy * dt
      }
      for (let i = fusees.length - 1; i >= 0; i--) {
        if (fusees[i].vy >= 0 || fusees[i].y <= fusees[i].cible) {
          eclater(fusees[i])
          fusees.splice(i, 1)
        }
      }
      for (const e of etincelles) {
        e.vie += dt
        e.vx *= 1 - 1.6 * dt
        e.vy = e.vy * (1 - 1.6 * dt) + GRAVITE * 0.35 * dt
        e.x += e.vx * dt
        e.y += e.vy * dt
      }
      for (let i = etincelles.length - 1; i >= 0; i--) if (etincelles[i].vie >= etincelles[i].duree) etincelles.splice(i, 1)
      for (const e of eclairs) e.vie += dt
      for (let i = eclairs.length - 1; i >= 0; i--) if (eclairs[i].vie >= 0.35) eclairs.splice(i, 1)

      ctx.setTransform(densite, 0, 0, densite, 0, 0)
      ctx.clearRect(0, 0, toile.width, toile.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = ENCRE
      // Les fusées qui montent : une petite traînée et une tête dorée.
      for (const f of fusees) {
        ctx.beginPath()
        ctx.moveTo(f.x, f.y)
        ctx.lineTo(f.x, f.y + 22)
        ctx.lineWidth = 5
        ctx.stroke()
        ctx.strokeStyle = '#fff1a8'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.strokeStyle = ENCRE
        ctx.beginPath()
        ctx.arc(f.x, f.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = f.couleur
        ctx.fill()
        ctx.stroke()
      }
      // L'éclair au cœur de la gerbe : un grand rond blanc qui grandit et s'efface.
      for (const e of eclairs) {
        const k = e.vie / 0.35
        ctx.globalAlpha = 0.85 * (1 - k)
        ctx.beginPath()
        ctx.arc(e.x, e.y, 20 + 70 * k, 0, Math.PI * 2)
        ctx.fillStyle = '#fffbe8'
        ctx.fill()
      }
      ctx.globalAlpha = 1
      // Les étincelles : une petite comète colorée au contour d'encre (sa traînée suit sa vitesse),
      // qui rapetisse en s'éteignant.
      ctx.lineCap = 'round'
      for (const e of etincelles) {
        const reste = 1 - e.vie / e.duree
        if (e.scintille && Math.floor(e.vie * 14) % 3 === 0 && reste < 0.6) continue
        const r = e.taille * (0.4 + 0.6 * reste)
        const queue = { x: e.x - e.vx * 0.06, y: e.y - e.vy * 0.06 }
        ctx.globalAlpha = Math.min(1, reste * 2.2)
        ctx.beginPath()
        ctx.moveTo(queue.x, queue.y)
        ctx.lineTo(e.x, e.y)
        ctx.strokeStyle = ENCRE
        ctx.lineWidth = r * 2 + 4
        ctx.stroke()
        ctx.strokeStyle = e.couleur
        ctx.lineWidth = r * 2
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.lineWidth = 2
      ctx.strokeStyle = ENCRE
      if (temps > duree && fusees.length === 0 && etincelles.length === 0 && eclairs.length === 0) {
        finRef.current()
        return
      }
      image = requestAnimationFrame(dessiner)
    }
    image = requestAnimationFrame(dessiner)
    return () => {
      cancelAnimationFrame(image)
      window.removeEventListener('resize', mesurer)
    }
  }, [duree])

  return <canvas ref={toileRef} className="feux-artifice" aria-hidden="true" />
}
