// Le bilan : on touche l'argent du bandeau, et une fenêtre dit, minute par minute, ce que la
// partie gagne (la mine, les mineurs, la foreuse) et ce qu'elle paie (les salaires), et donc si
// elle est rentable. En grand : le solde par minute, avec une mascotte qui sourit ou fait la
// grimace ; puis deux colonnes de barres (vert : ce qui rentre, rose : ce qui sort).
// Aucune règle du jeu ici : les chiffres viennent de src/jeu/revenu.ts (bilanParMinute).

import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { bilanParMinute, type LigneBilan } from '../jeu/revenu'
import { nombreAbrege } from '../nombres'
import { Fenetre } from './Fenetre'

type Props = {
  etat: EtatJeu
  onFermer: () => void
}

// « 1 250 $ », « 3,5 k $ » : par minute, arrondi, sans signe.
function dollars(n: number): string {
  return `${nombreAbrege(Math.round(Math.abs(n)))} $`
}

// Le verdict, selon le solde : une mascotte et une phrase.
function verdict(net: number, gains: number): { icone: string; titre: string; texte: string; sorte: string } {
  if (gains <= 0 && net >= 0) return { icone: '💤', titre: t('Rien ne tourne'), texte: t('Embauche un mineur ou descends la mine : elle creusera pour toi.'), sorte: 'neutre' }
  if (net < 0) return { icone: '⚠️', titre: t('Tu perds de l’argent'), texte: t('Tes salaires coûtent plus que ce que tu produis : améliore les pioches ou l’ascenseur, ou descends la mine.'), sorte: 'perte' }
  if (net < gains * 0.25) return { icone: '⭐', titre: t('Tout juste rentable'), texte: t('Tu gagnes un peu : une meilleure pioche ferait la différence.'), sorte: 'juste' }
  return { icone: '🤑', titre: t('Rentable !'), texte: t('Ta mine te rapporte plus qu’elle ne te coûte. Continue !'), sorte: 'rentable' }
}

function Colonne({ titre, lignes, total, sorte, max }: { titre: string; lignes: LigneBilan[]; total: number; sorte: 'gain' | 'depense'; max: number }) {
  const signe = sorte === 'gain' ? '+' : '−'
  return (
    <section className={`carte bilan-colonne bilan-${sorte}`}>
      <h3 className="bilan-colonne-titre">
        <span>{titre}</span>
        <strong>
          {signe}
          {dollars(total)}
          <small>{t('/min')}</small>
        </strong>
      </h3>
      <ul>
        {lignes.map((l, i) => (
          <li key={l.id} className={l.parMinute <= 0 ? 'bilan-ligne-vide' : ''} style={{ animationDelay: `${120 + i * 90}ms` }}>
            <span className="bilan-icone" aria-hidden="true">
              {l.icone}
            </span>
            <span className="bilan-nom">
              {t(l.nom)}
              <small>{t(l.detail)}</small>
            </span>
            <span className="bilan-montant">
              {signe}
              {dollars(l.parMinute)}
            </span>
            <span className={`jauge bilan-jauge ${sorte === 'depense' ? 'jauge-rose' : ''}`} aria-hidden="true">
              <i style={{ width: `${max > 0 ? Math.max(l.parMinute > 0 ? 4 : 0, (l.parMinute / max) * 100) : 0}%` }} />
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
    <Fenetre titre={t('Mon bilan')} icone="💰" couleur="vert" devant onFermer={onFermer} classe={`bilan bilan-${v.sorte}`}>
      {/* Le solde, en grand, avec la mascotte. */}
      <div className="carte bilan-solde">
        <span className="bilan-mascotte" aria-hidden="true">
          {v.icone}
        </span>
        <div className="bilan-solde-texte">
          <span className="discret">{t('Chaque minute, en ce moment')}</span>
          <strong className="bilan-net">
            {bilan.net >= 0 ? '+' : '−'}
            {dollars(bilan.net)}
            <small>{t('/min')}</small>
          </strong>
          <span className="bilan-verdict">{v.titre}</span>
        </div>
      </div>

      {/* Combien des gains partent en salaires. */}
      <div className="bilan-part" title={t('La part de ce que tu produis qui part en salaires')}>
        <span className="jauge jauge-rose" aria-hidden="true">
          <i style={{ width: `${Math.round(part * 100)}%` }} />
        </span>
        <small className="discret">{bilan.totalGains > 0 ? t('{n} % de tes gains partent en salaires', { n: Math.round(part * 100) }) : t('Pas encore de gains')}</small>
      </div>

      <div className="bilan-colonnes">
        <Colonne titre={t('Ce que tu gagnes')} lignes={bilan.gains} total={bilan.totalGains} sorte="gain" max={max} />
        <Colonne titre={t('Ce que tu paies')} lignes={bilan.depenses} total={bilan.totalDepenses} sorte="depense" max={max} />
      </div>

      <p className="carte carte-creme bilan-conseil">💡 {v.texte}</p>
      <p className="discret">{t('Les gains sont la valeur des blocs produits, une fois vendus. Tes clics ne sont pas comptés.')}</p>
    </Fenetre>
  )
}
