// L'animation de félicitations à chaque prestige : une grande étoile qui tourne, des rayons,
// des confettis et une fanfare, avec ce qu'on vient de gagner. Le bouton ouvre ensuite
// l'arbre de prestige pour choisir sa récompense.

import { useState } from 'react'
import { BONUS_PRESTIGE, BONUS_VITESSE_PRESTIGE, profondeurBedrock } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'

// Les couleurs des confettis : le rose du prestige, l'or, le blanc, et quelques autres.
const COULEURS = ['#e85aa8', '#ffd36b', '#ffffff', '#6fb8ff', '#5cc95c', '#b06cf0']

type Confetti = { dx: number; dy: number; tour: number; delai: number; couleur: string; rond: boolean }

function tirerConfettis(nombre: number): Confetti[] {
  return Array.from({ length: nombre }, (_, i) => {
    // Répartis tout autour de l'étoile, avec un peu de hasard pour que ce soit vivant.
    const angle = (i / nombre) * Math.PI * 2 + Math.random() * 0.4
    const distance = 140 + ((i * 37) % 100) * 2.4 + Math.random() * 40
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance * 0.8 - 60),
      tour: Math.round((Math.random() - 0.5) * 1080),
      delai: Math.round(Math.random() * 400),
      couleur: COULEURS[i % COULEURS.length],
      rond: i % 3 === 0,
    }
  })
}

type Props = { etat: EtatJeu; onContinuer: () => void } // etat : la nouvelle partie, juste après le prestige

export function FetePrestige({ etat, onContinuer }: Props) {
  const [confettis] = useState(() => tirerConfettis(90))
  const p = etat.prestige

  return (
    <div className="voile fete-prestige" role="dialog" aria-modal="true" aria-labelledby="titre-fete">
      <div className="revelation-flash" aria-hidden="true" />
      <div className="fete-scene">
        <div className="revelation-rayons fete-rayons" aria-hidden="true" />
        <div className="fete-carte">
          <span className="fete-etoile" aria-hidden="true">
            ⭐
          </span>
          <span className="fete-bravo">Félicitations !</span>
          <h2 id="titre-fete" className="fete-titre">
            Prestige {p}
          </h2>
          <ul className="fete-gains">
            <li>💰 Ventes +{Math.round(p * BONUS_PRESTIGE * 100)} %</li>
            <li>⛏️ Pioches {Math.round(p * BONUS_VITESSE_PRESTIGE * 100)} % plus rapides</li>
            <li>🕳️ Mine jusqu'à -{profondeurBedrock(p)} m</li>
            <li>🌟 +1 point dans l'arbre de prestige</li>
          </ul>
          <button className="bouton bouton-prestige fete-bouton" onClick={onContinuer} autoFocus>
            🌟 Choisir mon talent
          </button>
        </div>
        <div className="revelation-confettis" aria-hidden="true">
          {confettis.map((c, i) => (
            <i
              key={i}
              className={c.rond ? 'confetti confetti-rond' : 'confetti'}
              style={{
                ['--dx' as string]: `${c.dx}px`,
                ['--dy' as string]: `${c.dy}px`,
                ['--tour' as string]: `${c.tour}deg`,
                background: c.couleur,
                animationDelay: `${c.delai}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
