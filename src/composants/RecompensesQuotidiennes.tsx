// Les récompenses quotidiennes (25/10) : un calendrier de 7 jours. Chaque jour où l'on revient, on
// ouvre le cadeau du jour ; revenir tous les jours fait monter la série jusqu'au gros lot du
// 7e jour. Un jour manqué, et la série repart au jour 1.
// Les règles sont dans src/jeu/gemmes.ts.
// Ouvrir le cadeau (25/10) : le paquet tremble, s'ouvre dans des rayons, et ce qu'il contient
// saute dehors, une chose après l'autre, avec une fanfare.

import { useState } from 'react'
import { BOOSTS, RECOMPENSES_QUOTIDIENNES, argentRecompense, etatQuotidien, jourDe, recupererQuotidien, type Recompense } from '../jeu/gemmes'
import { t } from '../jeu/langue'
import { nombreAbrege } from '../nombres'
import { sons } from '../sons'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'

export function RecompensesQuotidiennes({ onFermer }: { onFermer: () => void }) {
  const { etat, jouer } = useJeu()
  // (le jour est lu à l'ouverture de la fenêtre)
  const [aujourdhui] = useState(() => jourDe(new Date()))
  const { jour, disponible } = etatQuotidien(etat, aujourdhui)
  // Les jours de suite déjà pris (le cadeau du jour compte s'il est pris).
  const serie = disponible ? jour - 1 : jour
  // Le cadeau qu'on vient d'ouvrir (null : pas encore ouvert).
  const [ouvert, setOuvert] = useState<{ jour: number; recompense: Recompense; argent: number } | null>(null)

  function ouvrir() {
    const recompense = RECOMPENSES_QUOTIDIENNES[jour - 1]
    setOuvert({ jour, recompense, argent: argentRecompense(etat, recompense) })
    // (pas de message en bas : la fenêtre montre déjà ce qu'on a gagné)
    jouer((e) => {
      recupererQuotidien(e, aujourdhui)
      return []
    })
    sons.niveauGagne()
  }

  if (ouvert) return <CadeauOuvert {...ouvert} onFermer={onFermer} />

  return (
    <Fenetre titre={t('Cadeau du jour')} icone="🎁" couleur="jaune" onFermer={onFermer}>
      {serie >= 2 && <p className="quotidien-serie">🔥 {t('Série : {n} jours de suite !', { n: serie })}</p>}
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
          <button className="btn btn-jaune btn-grand btn-attention" onClick={ouvrir}>
            🎁 {t('Ouvrir le cadeau du jour {n}', { n: jour })}
          </button>
        ) : (
          <p className="quotidien-revenir">✔ {t('Cadeau pris ! Reviens demain pour le jour {n}.', { n: (jour % 7) + 1 })}</p>
        )}
      </div>
    </Fenetre>
  )
}

// Le cadeau ouvert : des rayons qui tournent, le paquet qui saute, puis ce qu'il contenait.
function CadeauOuvert({ jour, recompense, argent, onFermer }: { jour: number; recompense: Recompense; argent: number; onFermer: () => void }) {
  const contenu = [`💎 +${recompense.gemmes}`]
  if (argent > 0) contenu.push(`💵 +${nombreAbrege(argent)} $`)
  if (recompense.boost) contenu.push(`${BOOSTS[recompense.boost.id].emoji} ${t(BOOSTS[recompense.boost.id].nom)} · ${recompense.boost.minutes} min`)
  return (
    <Fenetre
      titre={t('Jour {n} : bravo !', { n: jour })}
      icone="🎉"
      couleur="jaune"
      taille="petite"
      onFermer={onFermer}
      pied={
        <button className="btn btn-jaune" onClick={onFermer} autoFocus>
          {t('Super !')}
        </button>
      }
    >
      <div className="cadeau-ouvert">
        <span className="cadeau-rayons" aria-hidden="true" />
        <span className="cadeau-paquet" aria-hidden="true">
          {jour === 7 ? '🏆' : '🎁'}
        </span>
        <ul className="cadeau-contenu">
          {contenu.map((texte, i) => (
            // (chaque chose saute dehors un peu après la précédente)
            <li key={texte} className="etiquette cadeau-chose" style={{ animationDelay: `${0.55 + i * 0.25}s` }}>
              {texte}
            </li>
          ))}
        </ul>
      </div>
    </Fenetre>
  )
}
