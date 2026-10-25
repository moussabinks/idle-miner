// L'animation d'embauche avec le recruteur (palier 4 de la mine) : la carte du nouveau mineur
// tremble pendant que les couleurs des raretés défilent (le suspense, 1,6 s), puis elle se
// retourne : sa rareté apparaît en grand, avec des rayons et des confettis. Plus il est rare,
// plus c'est la fête ! Un clic pendant le suspense dévoile tout de suite la carte.

import { useEffect, useState } from 'react'
import { LISTE_RARETES, RARETES } from '../jeu/donnees'
import { rareteDe, salaireEmploye } from '../jeu/employes'
import { nombre, nomEmploye, t } from '../jeu/langue'
import type { Employe } from '../jeu/mineur'
import { forcePousseur } from '../jeu/wagonnet'
import { sons } from '../sons'
import { tirerConfettis } from './confettis'
import { nomTrajet } from './nomTrajet'

const DUREE_SUSPENSE = 1600 // ms

type Props = { employe: Employe; onFermer: () => void }

export function RevelationRecrue({ employe, onFermer }: Props) {
  const rarete = rareteDe(employe)
  const rang = LISTE_RARETES.indexOf(rarete.id)
  const [devoilee, setDevoilee] = useState(false)
  // Plus il est rare, plus il y a de confettis (aux couleurs de sa rareté).
  const [confettis] = useState(() => tirerConfettis(24 + rang * 18, [rarete.couleur, '#ffffff', '#f9d65a', RARETES.mythique.couleur]))

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
  const pousseur = employe.role === 'pousseur'
  const bonus = pousseur ? forcePousseur(rarete.id) : rarete.rendement

  return (
    <div
      className={`voile voile-devant revelation ${devoilee ? 'revelation-devoilee' : 'revelation-suspense'}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('Nouvelle recrue')}
      onClick={() => (devoilee ? onFermer() : setDevoilee(true))}
      style={{ ['--couleur-rarete' as string]: rarete.couleur }}
    >
      <div className="revelation-scene" onClick={(e) => e.stopPropagation()}>
        {devoilee && <div className="revelation-rayons" aria-hidden="true" />}
        <div className="revelation-carte" onClick={() => !devoilee && setDevoilee(true)}>
          {/* Le dos de la carte : un point d'interrogation pendant le suspense. */}
          <div className="revelation-face revelation-dos" aria-hidden={devoilee}>
            <span className="revelation-chapeau">🎩</span>
            <span className="revelation-question">?</span>
            <span>{t('Le recruteur cherche…')}</span>
          </div>
          {/* La face : la recrue et sa rareté. */}
          <div className="revelation-face revelation-face-avant" aria-hidden={!devoilee}>
            <span className="revelation-etoiles">{etoiles}</span>
            <span className="revelation-rarete">{t(rarete.nom)} !</span>
            <span className="revelation-mineur">{pousseur ? '🛤️' : '👷'}</span>
            <strong className="revelation-nom">{nomEmploye(employe.nom)}</strong>
            <span className="etiquette etiquette-jaune">{bonus > 1 ? (pousseur ? t('Pousse ×{n} plus vite', { n: nombre(bonus, 2) }) : t('Creuse ×{n} plus vite', { n: nombre(bonus, 2) })) : t('Solide et fiable')}</span>
            {pousseur && employe.trajet && <span className="revelation-detail">🛤️ {nomTrajet(employe.trajet)}</span>}
            <span className="revelation-detail">💵 {t('{n} $ / 5 min', { n: nombre(salaireEmploye(employe)) })}</span>
          </div>
        </div>

        {devoilee && (
          <div className="revelation-confettis" aria-hidden="true">
            {confettis.map((c, i) => (
              <i
                key={i}
                className={c.rond ? 'revelation-confetti rond' : 'revelation-confetti'}
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
          <button className="btn btn-jaune btn-grand revelation-bouton" onClick={onFermer}>
            {rang >= 3 ? t('Incroyable !') : rang >= 1 ? t('Super !') : t('Au travail !')}
          </button>
        )}
      </div>
    </div>
  )
}
