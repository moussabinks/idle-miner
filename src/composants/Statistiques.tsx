// L'écran des statistiques (bouton 📊 du bandeau) : les grands chiffres de la partie, d'où
// vient l'argent (toi au marché, le wagonnet, la foreuse) et les blocs cassés, sorte par sorte.

import { BLOCS } from '../jeu/donnees'
import type { EtatJeu, Statistiques as Stats } from '../jeu/mineur'
import { argentParSource, blocsLesPlusCasses } from '../jeu/statistiques'

// Les couleurs des trois sources d'argent (vérifiées pour les daltoniens, sur le fond sombre).
const SOURCES = [
  { id: 'joueur', nom: 'Toi (marché)', emoji: '💰', couleur: '#c4841a' },
  { id: 'wagonnet', nom: 'Wagonnet', emoji: '🛤️', couleur: '#8a5fd4' },
  { id: 'foreuse', nom: 'Foreuse', emoji: '⚙️', couleur: '#16958a' },
] as const

// Combien de sortes de blocs on montre (les plus cassées d'abord).
const NB_BLOCS_MONTRES = 12

function nombre(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

// « 1 h 05 min », « 12 min », « 45 s ».
function duree(secondes: number): string {
  const minutes = Math.floor(secondes / 60)
  if (minutes < 1) return `${Math.round(secondes)} s`
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

// Une tuile avec un grand chiffre.
function Tuile({ emoji, titre, valeur }: { emoji: string; titre: string; valeur: string }) {
  return (
    <div className="stat-tuile">
      <span className="stat-tuile-titre">
        {emoji} {titre}
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
    <section className="stat-bloc">
      <h3>💰 D'où vient ton argent</h3>
      {total === 0 ? (
        <p className="discret">Pas encore d'argent gagné.</p>
      ) : (
        <>
          <div className="barre-sources" role="img" aria-label="Part de l'argent gagné par source">
            {SOURCES.filter((s) => sources[s.id] > 0).map((s) => (
              <span
                key={s.id}
                className="barre-source"
                style={{ flexGrow: sources[s.id], background: s.couleur }}
                title={`${s.nom} : ${nombre(sources[s.id])} $ (${Math.round((sources[s.id] / total) * 100)} %)`}
              />
            ))}
          </div>
          <ul className="legende-sources">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <span className="pastille" style={{ background: s.couleur }} aria-hidden="true" />
                <span>
                  {s.emoji} {s.nom}
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
  const sortes = Object.keys(stats.blocsParType).length
  return (
    <section className="stat-bloc">
      <h3>
        🧱 Tes blocs cassés en cliquant <span className="discret">({sortes} sortes différentes)</span>
      </h3>
      {blocs.length === 0 ? (
        <p className="discret">Pas encore de bloc cassé.</p>
      ) : (
        <ul className="barres-blocs">
          {blocs.map(([bloc, n]) => (
            <li key={bloc} title={`${BLOCS[bloc].nom} : ${nombre(n)} (${Math.round((n / stats.blocsCasses) * 100)} % de tes blocs)`}>
              <span className={`mini-bloc bloc-${bloc} roche-pierre`} aria-hidden="true" />
              <span className="barre-bloc-nom">{BLOCS[bloc].nom}</span>
              <span className="barre-bloc-piste">
                <span className="barre-bloc" style={{ width: `${Math.max(2, (n / plusGrand) * 100)}%` }} />
              </span>
              <strong className="barre-bloc-valeur">{nombre(n)}</strong>
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
    <div className="voile" role="dialog" aria-modal="true" aria-label="Statistiques" onClick={onFermer}>
      <div className="carte fenetre-stats" onClick={(e) => e.stopPropagation()}>
        <h2>📊 Statistiques</h2>

        <div className="stat-tuiles">
          <Tuile emoji="💵" titre="Argent gagné" valeur={`${nombre(stats.argentGagne)} $`} />
          <Tuile emoji="⛏️" titre="Blocs cassés" valeur={nombre(stats.blocsCasses)} />
          <Tuile emoji="🕳️" titre="Mine" valeur={`niveau ${etat.niveauMine}`} />
          <Tuile emoji="⏱️" titre="Temps de jeu" valeur={duree(stats.tempsDeJeu)} />
        </div>

        <div className="stat-colonnes">
          <ArgentParSource stats={stats} />
          <BlocsCasses stats={stats} />
        </div>

        <ul className="stat-petits">
          <li>🕳️ {nombre(stats.blocsMine)} blocs sortis tout seuls de la mine</li>
          <li>👷 {nombre(stats.blocsMineurs)} blocs creusés par les mineurs</li>
          <li>⚙️ {nombre(stats.blocsForeuse)} blocs forés par la foreuse</li>
          <li>🛤️ {nombre(stats.voyagesWagonnet)} voyages de wagonnet</li>
          <li>💵 {nombre(stats.salairesPayes)} $ de salaires payés</li>
          <li>💎 {nombre(stats.diamantsTrouves)} diamants trouvés</li>
        </ul>

        <div className="boutons boutons-centre">
          <button className="bouton bouton-neutre" onClick={onFermer}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
