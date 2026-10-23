// Le bilan (23/10) : on touche l'argent en haut à gauche, et une fenêtre dit, minute par minute,
// ce que la partie gagne (la mine, les mineurs, la foreuse) et ce qu'elle paie (les salaires), et
// donc si elle est rentable. En grand : le solde par minute, avec une mascotte qui sourit ou fait la
// grimace ; puis deux colonnes de barres (vert : ce qui rentre, rouge : ce qui sort).
// Aucune règle du jeu ici : les chiffres viennent de src/jeu/revenu.ts (bilanParMinute).

import { bilanParMinute, type LigneBilan } from '../jeu/revenu'
import type { EtatJeu } from '../jeu/mineur'

type Props = {
  etat: EtatJeu
  onFermer: () => void
}

// « 1 250 $ », « 3,5 k$ » : par minute, arrondi.
function dollars(n: number): string {
  const v = Math.round(Math.abs(n))
  if (v < 10_000) return `${v.toLocaleString('fr-FR')} $`
  if (v < 1_000_000) return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k$`
  return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M$`
}

// Le verdict, selon le solde : une mascotte et une phrase.
function verdict(net: number, gains: number): { icone: string; titre: string; texte: string; sorte: string } {
  if (gains <= 0 && net >= 0) return { icone: '😴', titre: 'Rien ne tourne', texte: 'Embauche un mineur ou descends la mine : elle creusera pour toi.', sorte: 'neutre' }
  if (net < 0) return { icone: '😬', titre: 'Tu perds de l’argent', texte: 'Tes salaires coûtent plus que ce que tu produis : améliore les pioches ou l’ascenseur, ou descends la mine.', sorte: 'perte' }
  if (net < gains * 0.25) return { icone: '🙂', titre: 'Tout juste rentable', texte: 'Tu gagnes un peu : une meilleure pioche ferait la différence.', sorte: 'juste' }
  return { icone: '🤑', titre: 'Rentable !', texte: 'Ta mine te rapporte plus qu’elle ne te coûte. Continue !', sorte: 'rentable' }
}

function Colonne({ titre, lignes, total, sorte, max }: { titre: string; lignes: LigneBilan[]; total: number; sorte: 'gain' | 'depense'; max: number }) {
  return (
    <section className={`bilan-colonne bilan-${sorte}`}>
      <h3>
        {titre}
        <strong>
          {sorte === 'gain' ? '+' : '−'}
          {dollars(total)}
          <small>/min</small>
        </strong>
      </h3>
      <ul>
        {lignes.map((l, i) => (
          <li key={l.id} className={l.parMinute <= 0 ? 'bilan-ligne-vide' : ''} style={{ animationDelay: `${120 + i * 90}ms` }}>
            <span className="bilan-icone" aria-hidden="true">
              {l.icone}
            </span>
            <span className="bilan-nom">
              {l.nom}
              <small>{l.detail}</small>
            </span>
            <span className="bilan-montant">
              {sorte === 'gain' ? '+' : '−'}
              {dollars(l.parMinute)}
            </span>
            <span className="bilan-barre" aria-hidden="true">
              <i style={{ width: `${max > 0 ? Math.max(l.parMinute > 0 ? 4 : 0, (l.parMinute / max) * 100) : 0}%`, animationDelay: `${200 + i * 90}ms` }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FenetreBilan({ etat, onFermer }: Props) {
  const bilan = bilanParMinute(etat)
  const v = verdict(bilan.net, bilan.totalGains)
  const max = Math.max(...bilan.gains.map((l) => l.parMinute), ...bilan.depenses.map((l) => l.parMinute), 1)
  // La part des gains qui part en salaires (la jauge du haut).
  const part = bilan.totalGains > 0 ? Math.min(1, bilan.totalDepenses / bilan.totalGains) : bilan.totalDepenses > 0 ? 1 : 0
  return (
    <div className="voile voile-devant" role="dialog" aria-modal="true" aria-labelledby="titre-bilan" onClick={onFermer}>
      <section className={`carte fenetre-bilan bilan-${v.sorte}`} onClick={(e) => e.stopPropagation()}>
        <button className="bouton-fermer bouton bouton-petit bouton-neutre bilan-fermer" onClick={onFermer} aria-label="Fermer">
          ✖
        </button>
        <h2 id="titre-bilan">💰 Mon bilan</h2>
        <p className="discret bilan-sous-titre">En moyenne, chaque minute, en ce moment</p>

        {/* Le solde, en grand, avec la mascotte. */}
        <div className="bilan-solde">
          <span className="bilan-mascotte" aria-hidden="true">
            {v.icone}
          </span>
          <div>
            <strong className="bilan-net">
              {bilan.net >= 0 ? '+' : '−'}
              {dollars(bilan.net)}
              <small>/min</small>
            </strong>
            <span className="bilan-verdict">{v.titre}</span>
          </div>
        </div>

        {/* Combien des gains partent en salaires. */}
        <div className="bilan-part" title="La part de ce que tu produis qui part en salaires">
          <span className="bilan-part-piste">
            <i style={{ width: `${Math.round(part * 100)}%` }} />
          </span>
          <small>{bilan.totalGains > 0 ? `${Math.round(part * 100)} % de tes gains partent en salaires` : 'Pas encore de gains'}</small>
        </div>

        <div className="bilan-colonnes">
          <Colonne titre="Ce que tu gagnes" lignes={bilan.gains} total={bilan.totalGains} sorte="gain" max={max} />
          <Colonne titre="Ce que tu paies" lignes={bilan.depenses} total={bilan.totalDepenses} sorte="depense" max={max} />
        </div>

        <p className="bilan-conseil">{v.texte}</p>
        <p className="discret bilan-note">Les gains sont la valeur des blocs, à vendre au marché (à la main ou en wagonnet). Tes clics ne sont pas comptés.</p>
      </section>
    </div>
  )
}
