// La boutique des gemmes (25/10) : regarder une publicité pour gagner une gemme, et dépenser ses
// gemmes en bonus (production × 2, ventes × 2, employés × 2, fortune), 3 gemmes chacun.
// Les règles sont dans src/jeu/gemmes.ts.

import { BOOSTS, GEMMES_PAR_PUB, LISTE_BOOSTS, acheterBoost, peutAcheterBoost, recompenserPub, secondesBoost } from '../jeu/gemmes'
import { nombre, t } from '../jeu/langue'
import { minutesSecondes } from '../nombres'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'

export function Boutique({ onFermer }: { onFermer: () => void }) {
  const { etat, jouer, regarderPub } = useJeu()
  return (
    <Fenetre titre={t('Boutique des gemmes')} icone="💎" couleur="violet" onFermer={onFermer}>
      <div className="boutique-solde">
        <span aria-hidden="true">💎</span>
        <strong>{nombre(etat.gemmes)}</strong>
        <span className="discret">{t('gemmes')}</span>
      </div>

      {/* Gagner des gemmes : une publicité. */}
      <div className="boutique-video carte">
        <span className="boutique-video-icone" aria-hidden="true">
          📺
        </span>
        <span className="boutique-ligne-texte">
          <strong>{t('Regarde une publicité')}</strong>
          <span className="discret">{t('30 secondes, et +{n} gemme pour toi !', { n: GEMMES_PAR_PUB })}</span>
        </span>
        <button className="btn btn-violet" onClick={() => regarderPub(() => jouer(recompenserPub))}>
          ▶ +{GEMMES_PAR_PUB} 💎
        </button>
      </div>

      <h3 className="titre-section">{t('Bonus')}</h3>
      {LISTE_BOOSTS.map((id) => {
        const boost = BOOSTS[id]
        const reste = secondesBoost(etat, id)
        return (
          <div key={id} className="ligne-amelioration">
            <span className="boutique-icone" aria-hidden="true">
              {boost.emoji}
            </span>
            <span className="ligne-amelioration-texte">
              <span className="ligne-amelioration-nom">
                {t(boost.nom)} <span className="etiquette">{t('{n} min', { n: boost.minutes })}</span>
                {reste > 0 && <span className="etiquette etiquette-vert">⏳ {minutesSecondes(reste)}</span>}
              </span>
              <span className="ligne-amelioration-effet">{t(boost.description)}</span>
            </span>
            <button className="btn btn-violet btn-petit" disabled={!peutAcheterBoost(etat, id)} onClick={() => jouer((e) => acheterBoost(e, id))}>
              {reste > 0 ? '+' : ''}💎 {boost.gemmes}
            </button>
          </div>
        )
      })}

      <p className="discret">{t('Astuce : les gemmes paient aussi n’importe quelle amélioration (le bouton violet 💎, à côté du prix).')}</p>
    </Fenetre>
  )
}
