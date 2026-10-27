// Les feux d'artifice de la restauration du château (27/10, plus réalistes le 27/10 : retours du
// propriétaire). Par-dessus tout l'écran, le ciel s'assombrit un peu ; des fusées montent en
// laissant une traînée d'étincelles, puis éclatent en gerbes qui brillent (les couleurs
// s'additionnent, comme de la lumière), laissent des traînées, ralentissent dans l'air, retombent
// et s'éteignent en scintillant. Plusieurs sortes de gerbes : pivoine (une boule de couleur),
// chrysanthème (avec des traînées dorées), saule (de longs fils d'or qui pleurent), anneau,
// palmier (de grosses comètes) et crépitement (des étincelles qui pétillent en blanc). Un bouquet
// final serré, pour finir.
//
// Une « toile » (canvas) seulement le temps du spectacle. Les traînées : à chaque image, on efface
// un peu l'image d'avant au lieu de tout effacer.

import { useEffect, useRef } from 'react'
import { sons } from '../sons'

// Les couleurs des gerbes (vives, comme de vrais feux d'artifice).
const COULEURS = ['#ff4d6d', '#ffd23f', '#4dd8ff', '#b06cff', '#5cff8a', '#ff9f1c', '#ff6ec7', '#ffffff']
const OR = '#ffc95e'
const GRAVITE = 140 // pixels par seconde, chaque seconde
const FREIN = 1.4 // la résistance de l'air (par seconde)

type Sorte = 'pivoine' | 'chrysantheme' | 'saule' | 'anneau' | 'palmier' | 'crepitement'
const SORTES: Sorte[] = ['pivoine', 'chrysantheme', 'saule', 'anneau', 'palmier', 'crepitement']

type Fusee = { x: number; y: number; vx: number; vy: number; cible: number; couleur: string; sorte: Sorte }
type Etincelle = {
  x: number
  y: number
  vx: number
  vy: number
  vie: number
  duree: number
  couleur: string
  taille: number
  frein: number // la résistance de l'air (le saule ralentit beaucoup)
  poids: number // la part de la gravité (les étincelles légères flottent)
  scintille: boolean
  traine: boolean // elle laisse derrière elle des petites étincelles dorées
  crepite: boolean // à la fin, elle éclate en petites étincelles blanches
}

type Props = {
  duree: number // secondes pendant lesquelles on lance des fusées (le spectacle finit un peu après)
  onFini: () => void
}

const auHasard = <T,>(liste: T[]): T => liste[Math.floor(Math.random() * liste.length)]

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
    let temps = 0
    let prochaine = 0.2
    let avant = performance.now()
    let image = 0
    // La taille des gerbes suit celle de l'écran (plus petites sur téléphone).
    const echelle = () => Math.min(1.25, Math.max(0.55, Math.min(window.innerWidth, window.innerHeight * 1.4) / 900))

    const etincelle = (e: Partial<Etincelle> & { x: number; y: number; vx: number; vy: number; couleur: string }) => {
      etincelles.push({ vie: 0, duree: 1.4, taille: 2.2, frein: FREIN, poids: 1, scintille: false, traine: false, crepite: false, ...e })
    }

    const lancer = () => {
      const l = window.innerWidth
      const h = window.innerHeight
      const cible = h * (0.12 + Math.random() * 0.3)
      const x = l * (0.12 + Math.random() * 0.76)
      // La vitesse qu'il faut pour monter jusqu'à la cible (en freinant un peu en chemin).
      const vy = -Math.sqrt(2 * GRAVITE * (h - cible)) * 1.12
      fusees.push({ x, y: h + 6, vx: (Math.random() - 0.5) * 40, vy, cible, couleur: auHasard(COULEURS), sorte: auHasard(SORTES) })
      sons.fusee()
    }

    const eclater = (f: Fusee) => {
      const k = echelle()
      sons.explosion(f.sorte === 'saule' ? 0.8 : 1)
      // Un éclair au cœur de la gerbe (quelques grosses étincelles blanches qui s'éteignent vite).
      for (let i = 0; i < 6; i++) etincelle({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, couleur: '#ffffff', taille: 9 * k, duree: 0.18, poids: 0 })
      const seconde = auHasard(COULEURS)
      const n = { pivoine: 90, chrysantheme: 80, saule: 70, anneau: 60, palmier: 9, crepitement: 70 }[f.sorte]
      const vitesse = { pivoine: 260, chrysantheme: 270, saule: 210, anneau: 250, palmier: 230, crepitement: 240 }[f.sorte] * k
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + Math.random() * 0.12
        // Une boule : des vitesses au hasard (une sphère vue de face) ; un anneau : toutes pareilles.
        const v = f.sorte === 'anneau' ? vitesse : vitesse * Math.cbrt(Math.random()) * (f.sorte === 'palmier' ? 1 : 0.95)
        const base = { x: f.x, y: f.y, vx: Math.cos(angle) * v + f.vx * 0.3, vy: Math.sin(angle) * v + f.vy * 0.1 }
        switch (f.sorte) {
          case 'pivoine':
            etincelle({ ...base, couleur: i % 3 === 0 ? seconde : f.couleur, duree: 1.3 + Math.random() * 0.5, taille: 2.4 * k, scintille: Math.random() < 0.3 })
            break
          case 'chrysantheme':
            etincelle({ ...base, couleur: f.couleur, duree: 1.5 + Math.random() * 0.5, taille: 2.2 * k, traine: true })
            break
          case 'saule':
            etincelle({ ...base, couleur: OR, duree: 2.6 + Math.random() * 0.8, taille: 2 * k, frein: 2.6, poids: 0.55, traine: true, scintille: true })
            break
          case 'anneau':
            etincelle({ ...base, couleur: f.couleur, duree: 1.4 + Math.random() * 0.3, taille: 2.6 * k })
            break
          case 'palmier':
            etincelle({ ...base, couleur: OR, duree: 1.8, taille: 4 * k, frein: 1, traine: true })
            break
          case 'crepitement':
            etincelle({ ...base, couleur: f.couleur, duree: 0.9 + Math.random() * 0.4, taille: 2.2 * k, crepite: true })
            break
        }
      }
    }

    // Une étincelle qui crépite : elle éclate en quatre petites étincelles blanches.
    const crepiter = (e: Etincelle) => {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2
        etincelle({ x: e.x, y: e.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, couleur: '#fffbe0', taille: 1.6, duree: 0.25 + Math.random() * 0.2, poids: 0.3, scintille: true })
      }
    }

    const dessiner = (maintenant: number) => {
      const dt = Math.min(0.05, (maintenant - avant) / 1000)
      avant = maintenant
      temps += dt
      // Les fusées : une toutes les 0,4 s environ, puis le bouquet final (une rafale serrée).
      const bouquet = temps > duree - 1.6
      if (temps < duree && temps >= prochaine) {
        lancer()
        if (bouquet || Math.random() < 0.25) lancer()
        prochaine = temps + (bouquet ? 0.12 + Math.random() * 0.12 : 0.3 + Math.random() * 0.4)
      }

      // Les fusées montent (en laissant des étincelles orange derrière elles) et éclatent en haut.
      for (let i = fusees.length - 1; i >= 0; i--) {
        const f = fusees[i]
        f.vy += GRAVITE * dt
        f.x += f.vx * dt
        f.y += f.vy * dt
        if (Math.random() < 0.9) etincelle({ x: f.x, y: f.y + 4, vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 40, couleur: '#ffb35c', taille: 1.6, duree: 0.35 + Math.random() * 0.25, poids: 0.4 })
        if (f.vy >= -30 || f.y <= f.cible) {
          eclater(f)
          fusees.splice(i, 1)
        }
      }
      // Les étincelles : la résistance de l'air, la gravité, les traînées, le crépitement.
      for (let i = etincelles.length - 1; i >= 0; i--) {
        const e = etincelles[i]
        e.vie += dt
        const frein = Math.max(0, 1 - e.frein * dt)
        e.vx *= frein
        e.vy = e.vy * frein + GRAVITE * e.poids * dt
        e.x += e.vx * dt
        e.y += e.vy * dt
        if (e.traine && Math.random() < 0.35) etincelle({ x: e.x, y: e.y, vx: 0, vy: 0, couleur: OR, taille: e.taille * 0.6, duree: 0.4 + Math.random() * 0.3, poids: 0.2 })
        if (e.vie >= e.duree) {
          if (e.crepite) crepiter(e)
          etincelles.splice(i, 1)
        }
      }
      if (etincelles.some((e) => e.crepite && e.duree - e.vie < dt * 1.5)) sons.crepitement()

      // Les traînées : on efface seulement un peu l'image d'avant.
      ctx.setTransform(densite, 0, 0, densite, 0, 0)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      // La lumière s'additionne : là où les étincelles se croisent, ça brille plus fort.
      ctx.globalCompositeOperation = 'lighter'
      for (const e of etincelles) {
        const reste = 1 - e.vie / e.duree
        let eclat = Math.min(1, reste * 1.8)
        if (e.scintille && reste < 0.65) eclat *= Math.random() < 0.5 ? 0.15 : 1
        if (eclat <= 0.02) continue
        const r = e.taille * (0.5 + 0.5 * reste)
        // Le halo de couleur, puis le cœur presque blanc.
        ctx.globalAlpha = eclat * 0.35
        ctx.fillStyle = e.couleur
        ctx.beginPath()
        ctx.arc(e.x, e.y, r * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = eclat
        ctx.beginPath()
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = eclat * 0.8
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(e.x, e.y, r * 0.45, 0, Math.PI * 2)
        ctx.fill()
      }
      // Les têtes des fusées : un point blanc-orangé.
      ctx.globalAlpha = 1
      for (const f of fusees) {
        ctx.fillStyle = '#fff1c9'
        ctx.beginPath()
        ctx.arc(f.x, f.y, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      if (temps > duree && fusees.length === 0 && etincelles.length === 0) {
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

  // Le voile qui assombrit le ciel le temps du spectacle (il apparaît, puis s'en va à la fin).
  return (
    <div className="feux-artifice" style={{ ['--duree' as string]: `${duree + 3}s` }} aria-hidden="true">
      <canvas ref={toileRef} />
    </div>
  )
}
