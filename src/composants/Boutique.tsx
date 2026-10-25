// La boutique des gemmes (25/10) : regarder une publicité pour gagner une gemme, et dépenser ses
// gemmes en bonus (production × 2, ventes × 2, employés × 2, fortune), 3 gemmes chacun.
// (25/10) Et acheter des packs de gemmes avec de l'argent réel (Paiement.tsx).
// Les règles sont dans src/jeu/gemmes.ts.

import { useState } from 'react'
import { BOOSTS, GEMMES_PAR_PUB, LISTE_BOOSTS, PACKS_GEMMES, acheterBoost, bonusPack, crediterPack, peutAcheterBoost, recompenserPub, secondesBoost, type PackGemmes } from '../jeu/gemmes'
import { nombre, prixEuros, t } from '../jeu/langue'
import { minutesSecondes } from '../nombres'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'
import { Paiement } from './Paiement'

export function Boutique({ onFermer }: { onFermer: () => void }) {
  const { etat, jouer, regarderPub } = useJeu()
  // Le pack qu'on est en train de payer (sa fenêtre de paiement est ouverte).
  const [enPaiement, setEnPaiement] = useState<PackGemmes | null>(null)
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

      {/* (25/10) Acheter des gemmes */}
      <h3 className="titre-section">{t('Acheter des gemmes')}</h3>
      <div className="boutique-packs">
        {PACKS_GEMMES.map((pack) => {
          const bonus = bonusPack(pack)
          return (
            <button key={pack.id} className={`boutique-pack ${pack.etiquette ? 'boutique-pack-vedette' : ''}`} onClick={() => setEnPaiement(pack)}>
              {pack.etiquette && <span className="boutique-pack-etiquette">{pack.etiquette === 'populaire' ? t('Populaire') : t('Meilleure offre')}</span>}
              <span className="boutique-pack-gemmes">
                <span aria-hidden="true">💎</span> {nombre(pack.gemmes)}
              </span>
              <span className="boutique-pack-bonus">{bonus > 0 ? t('+{n} % offert', { n: bonus }) : '\u00a0'}</span>
              <span className="boutique-pack-prix">{prixEuros(pack.centimes)}</span>
            </button>
          )
        })}
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

      {enPaiement && (
        <Paiement
          pack={enPaiement}
          onFermer={() => setEnPaiement(null)}
          onPaye={() => {
            jouer((e) => crediterPack(e, enPaiement.id))
            setEnPaiement(null)
          }}
        />
      )}

      <p className="discret">{t('Astuce : les gemmes paient aussi n’importe quelle amélioration (le bouton violet 💎, à côté du prix).')}</p>
    </Fenetre>
  )
}
