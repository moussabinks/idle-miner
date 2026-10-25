// Les récompenses quotidiennes (25/10) : un calendrier de 7 jours. Chaque jour où l'on revient, on
// ouvre le cadeau du jour ; revenir tous les jours fait monter la série jusqu'au gros lot du
// 7e jour. Un jour manqué, et la série repart au jour 1.
// Les règles sont dans src/jeu/gemmes.ts.

import { BOOSTS, RECOMPENSES_QUOTIDIENNES, argentRecompense, etatQuotidien, jourDe, recupererQuotidien } from '../jeu/gemmes'
import { t } from '../jeu/langue'
import { nombreAbrege } from '../nombres'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'

export function RecompensesQuotidiennes({ onFermer }: { onFermer: () => void }) {
  const { etat, jouer } = useJeu()
  const aujourdhui = jourDe(new Date())
  const { jour, disponible } = etatQuotidien(etat, aujourdhui)
  return (
    <Fenetre titre={t('Cadeau du jour')} icone="🎁" couleur="jaune" onFermer={onFermer}>
      <p className="discret">{t('Reviens chaque jour : plus ta série est longue, plus le cadeau est gros. Le 7e jour, c’est le gros lot !')}</p>
      <ol className="quotidien-jours">
        {RECOMPENSES_QUOTIDIENNES.map((r, i) => {
          const numero = i + 1
          const pris = numero < jour || (numero === jour && !disponible)
          const actuel = numero === jour && disponible
          const argent = argentRecompense(etat, r)
          return (
            <li key={numero} className={`quotidien-jour ${pris ? 'pris' : ''} ${actuel ? 'actuel' : ''} ${numero === 7 ? 'gros-lot' : ''}`}>
              <span className="quotidien-numero">{t('Jour {n}', { n: numero })}</span>
              <span className="quotidien-cadeau" aria-hidden="true">
                {pris ? '✔' : numero === 7 ? '🏆' : '🎁'}
              </span>
              <span className="quotidien-contenu">
                <span>💎 {r.gemmes}</span>
                {argent > 0 && <span>💵 {nombreAbrege(argent)}</span>}
                {r.boost && (
                  <span>
                    {BOOSTS[r.boost.id].emoji} {r.boost.minutes} min
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="rangee rangee-centre">
        {disponible ? (
          <button className="btn btn-jaune btn-grand btn-attention" onClick={() => jouer((e) => recupererQuotidien(e, aujourdhui))}>
            🎁 {t('Ouvrir le cadeau du jour {n}', { n: jour })}
          </button>
        ) : (
          <p className="quotidien-revenir">✔ {t('Cadeau pris ! Reviens demain pour le jour {n}.', { n: (jour % 7) + 1 })}</p>
        )}
      </div>
    </Fenetre>
  )
}
