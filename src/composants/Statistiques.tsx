// La fenêtre des statistiques (bouton 📊 du bandeau) : les grands chiffres de la partie, d'où
// vient l'argent (tes ventes, le wagonnet, la foreuse) et les blocs cassés, sorte par sorte.
// Les calculs sont dans src/jeu/statistiques.ts.

import { BLOCS } from '../jeu/donnees'
import { nombre, t } from '../jeu/langue'
import type { EtatJeu, Statistiques as Stats } from '../jeu/mineur'
import { argentParSource, blocsLesPlusCasses } from '../jeu/statistiques'
import { BlocDessin } from './BlocDessin'
import { Fenetre } from './Fenetre'

// Les trois sources d'argent, chacune sa couleur pastel (celles du style du jeu).
const SOURCES = [
  { id: 'joueur', nom: 'Tes ventes', emoji: '💰', couleur: 'var(--jaune)' },
  { id: 'wagonnet', nom: 'Wagonnet', emoji: '🛤️', couleur: 'var(--violet)' },
  { id: 'foreuse', nom: 'Foreuse', emoji: '⚙️', couleur: 'var(--ciel)' },
] as const

// Combien de sortes de blocs on montre (les plus cassées d'abord).
const NB_BLOCS_MONTRES = 12

// « 1 h 05 min », « 12 min », « 45 s ».
function duree(secondes: number): string {
  const minutes = Math.floor(secondes / 60)
  if (minutes < 1) return t('{n} s', { n: Math.round(secondes) })
  if (minutes < 60) return t('{n} min', { n: minutes })
  return t('{h} h {m} min', { h: Math.floor(minutes / 60), m: String(minutes % 60).padStart(2, '0') })
}

// Une tuile avec un grand chiffre.
function Tuile({ emoji, titre, valeur }: { emoji: string; titre: string; valeur: string }) {
  return (
    <div className="carte stat-tuile">
      <span className="stat-tuile-titre">
        <span aria-hidden="true">{emoji}</span> {titre}
      </span>
      <strong className="stat-tuile-valeur">{valeur}</strong>
    </div>
  )
}

// D'où vient l'argent : une barre partagée en trois, avec la légende et les montants.
function ArgentParSource({ stats }: { stats: Stats }) {
  const sources = argentParSource(stats)
  const total = sources.joueur + sources.wagonnet + sources.foreuse
  return (
    <section className="carte stat-bloc">
      <h3 className="titre-section">{t('D’où vient ton argent')}</h3>
      {total === 0 ? (
        <p className="discret">{t('Pas encore d’argent gagné.')}</p>
      ) : (
        <>
          <div className="stat-barre-sources" role="img" aria-label={t('Part de l’argent gagné par source')}>
            {SOURCES.filter((s) => sources[s.id] > 0).map((s) => (
              <span key={s.id} style={{ flexGrow: sources[s.id], background: s.couleur }} title={`${t(s.nom)} : ${nombre(sources[s.id])} $`} />
            ))}
          </div>
          <ul className="stat-legende">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <span className="stat-pastille" style={{ background: s.couleur }} aria-hidden="true" />
                <span className="stat-legende-nom">
                  {s.emoji} {t(s.nom)}
                </span>
                <strong>{nombre(sources[s.id])} $</strong>
                <span className="discret">{Math.round((sources[s.id] / total) * 100)} %</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

// Les blocs cassés, sorte par sorte : une barre par sorte, la plus longue pour la plus cassée.
function BlocsCasses({ stats }: { stats: Stats }) {
  const blocs = blocsLesPlusCasses(stats).slice(0, NB_BLOCS_MONTRES)
  const plusGrand = blocs[0]?.[1] ?? 1
  return (
    <section className="carte stat-bloc">
      <h3 className="titre-section">{t('Tes blocs cassés à la main')}</h3>
      {blocs.length === 0 ? (
        <p className="discret">{t('Pas encore de bloc cassé.')}</p>
      ) : (
        <ul className="stat-blocs">
          {blocs.map(([bloc, n]) => (
            <li key={bloc}>
              <span className="stat-bloc-dessin">
                <BlocDessin bloc={bloc} />
              </span>
              <span className="stat-bloc-nom">{t(BLOCS[bloc].nom)}</span>
              <span className="jauge stat-bloc-jauge" aria-hidden="true">
                <i style={{ width: `${Math.max(3, (n / plusGrand) * 100)}%` }} />
              </span>
              <strong className="stat-bloc-valeur">{nombre(n)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function FenetreStatistiques({ etat, onFermer }: { etat: EtatJeu; onFermer: () => void }) {
  const stats = etat.stats
  return (
    <Fenetre titre={t('Statistiques')} icone="📊" couleur="bleu" taille="grande" onFermer={onFermer}>
      <div className="stat-tuiles">
        <Tuile emoji="💵" titre={t('Argent gagné')} valeur={`${nombre(stats.argentGagne)} $`} />
        <Tuile emoji="⛏️" titre={t('Blocs cassés')} valeur={nombre(stats.blocsCasses)} />
        <Tuile emoji="🕳️" titre={t('Mine')} valeur={t('niveau {n}', { n: etat.niveauMine })} />
        <Tuile emoji="⏱️" titre={t('Temps de jeu')} valeur={duree(stats.tempsDeJeu)} />
      </div>

      <div className="stat-colonnes">
        <ArgentParSource stats={stats} />
        <BlocsCasses stats={stats} />
      </div>

      <ul className="stat-petits">
        <li className="carte">🕳️ {t('{n} blocs sortis tout seuls de la mine', { n: nombre(stats.blocsMine) })}</li>
        <li className="carte">👷 {t('{n} blocs creusés par les mineurs', { n: nombre(stats.blocsMineurs) })}</li>
        <li className="carte">⚙️ {t('{n} blocs forés par la foreuse', { n: nombre(stats.blocsForeuse) })}</li>
        <li className="carte">🛤️ {t('{n} voyages de wagonnet', { n: nombre(stats.voyagesWagonnet) })}</li>
        <li className="carte">💵 {t('{n} $ de salaires payés', { n: nombre(stats.salairesPayes) })}</li>
        <li className="carte">💎 {t('{n} diamants trouvés', { n: nombre(stats.diamantsTrouves) })}</li>
      </ul>
    </Fenetre>
  )
}
