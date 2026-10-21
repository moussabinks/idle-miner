// L'animation d'embauche avec le recruteur (niveau 3 de la mine) : la carte du nouveau mineur tremble
// pendant que les couleurs des raretés défilent (le suspense, 1,6 s), puis elle se retourne :
// sa rareté apparaît en grand, avec des rayons, des confettis et des étincelles. Plus il est
// rare, plus c'est la fête ! Un clic pendant le suspense dévoile tout de suite la carte.

import { useEffect, useState } from 'react'
import { LISTE_RARETES, RARETES } from '../jeu/donnees'
import { rareteDe, salaireEmploye } from '../jeu/employes'
import type { Employe } from '../jeu/mineur'
import { sons } from '../sons'

const DUREE_SUSPENSE = 1600 // ms

// Les confettis : une direction, une couleur et un délai chacun (tirés une fois, à l'ouverture).
type Confetti = { dx: number; dy: number; tour: number; delai: number; couleur: string; rond: boolean }

function tirerConfettis(nombre: number, couleurs: string[]): Confetti[] {
  return Array.from({ length: nombre }, (_, i) => {
    // Répartis tout autour de la carte (avec un peu de hasard pour que ce soit vivant).
    const angle = (i / nombre) * Math.PI * 2 + Math.random() * 0.4
    const distance = 120 + ((i * 37) % 100) * 2.2 + Math.random() * 30
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance * 0.8 - 60),
      tour: Math.round((Math.random() - 0.5) * 1080),
      delai: Math.round(Math.random() * 180),
      couleur: couleurs[i % couleurs.length],
      rond: i % 3 === 0,
    }
  })
}

type Props = { employe: Employe; onFermer: () => void }

export function RevelationRecrue({ employe, onFermer }: Props) {
  const rarete = rareteDe(employe)
  const rang = LISTE_RARETES.indexOf(rarete.id)
  const [devoilee, setDevoilee] = useState(false)
  // Plus il est rare, plus il y a de confettis (et ils prennent les couleurs de sa rareté).
  const [confettis] = useState(() => tirerConfettis(24 + rang * 18, [rarete.couleur, '#ffffff', '#ffd36b', RARETES.mythique.couleur]))

  // Le suspense, puis la révélation (avec sa fanfare).
  useEffect(() => {
    if (devoilee) {
      sons.revelationRecrue(rang)
      return
    }
    sons.suspenseRecrue()
    const minuteur = setTimeout(() => setDevoilee(true), DUREE_SUSPENSE)
    return () => clearTimeout(minuteur)
  }, [devoilee, rang])

  const etoiles = '★'.repeat(rang + 1) + '☆'.repeat(LISTE_RARETES.length - rang - 1)

  return (
    <div
      className={`voile revelation rarete-${rarete.id} ${devoilee ? 'revelation-devoilee' : 'revelation-suspense'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Nouveau mineur"
      onClick={() => (devoilee ? onFermer() : setDevoilee(true))}
      style={{ ['--couleur-rarete' as string]: rarete.couleur }}
    >
      {devoilee && rang >= 3 && <div className="revelation-flash" aria-hidden="true" />}
      <div className="revelation-scene" onClick={(e) => e.stopPropagation()}>
        {devoilee && <div className="revelation-rayons" aria-hidden="true" />}
        <div className="revelation-carte" onClick={() => !devoilee && setDevoilee(true)}>
          {/* Le dos de la carte : un point d'interrogation pendant le suspense. */}
          <div className="revelation-face revelation-dos" aria-hidden={devoilee}>
            <span className="revelation-chapeau">🎩</span>
            <span className="revelation-question">?</span>
            <span className="revelation-recherche">Le recruteur cherche...</span>
          </div>
          {/* La face : le nouveau mineur et sa rareté. */}
          <div className="revelation-face revelation-face-avant" aria-hidden={!devoilee}>
            <span className="revelation-etoiles">{etoiles}</span>
            <span className="revelation-rarete">{rarete.nom} !</span>
            <span className="revelation-mineur">👷</span>
            <strong className="revelation-nom">{employe.nom}</strong>
            {rarete.rendement > 1 ? (
              <span className="revelation-bonus">
                ⚡ Rendement ×{rarete.rendement.toLocaleString('fr-FR')}
                <small>
                  Il creuse {rarete.rendement.toLocaleString('fr-FR')} fois plus vite et porte {rarete.rendement.toLocaleString('fr-FR')} fois plus.
                </small>
              </span>
            ) : (
              <span className="revelation-bonus">
                Un mineur solide et fiable.
                <small>Le prochain sera peut-être rare...</small>
              </span>
            )}
            <span className="revelation-salaire">Salaire : {salaireEmploye(employe).toLocaleString('fr-FR')} $ / 10 min</span>
          </div>
        </div>

        {devoilee && (
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
        )}

        {devoilee && (
          <button className="bouton bouton-recruter revelation-bouton" onClick={onFermer}>
            {rang >= 3 ? 'Incroyable !' : rang >= 1 ? 'Super !' : 'Au travail !'}
          </button>
        )}
      </div>
    </div>
  )
}
