// La fenêtre de paiement d'un pack de gemmes (25/10). Pas encore de vrai paiement :
//   - en ligne (27/10), la fenêtre a l'air prête, mais le bouton dit « Bientôt disponible » et
//     ne fait rien (aucun argent n'est pris, aucune gemme n'est donnée) ;
//   - pendant le développement, un paiement SIMULÉ donne les gemmes (PAIEMENT_SIMULE dans
//     src/portail.ts), pour tester la boutique.
// Le jour où la boutique de CrazyGames est ouverte au jeu, c'est ici qu'on l'appellera.

import { createPortal } from 'react-dom'
import type { PackGemmes } from '../jeu/gemmes'
import { nombre, prixEuros, t } from '../jeu/langue'
import { Fenetre } from './Fenetre'
import { PAIEMENT_SIMULE } from '../portail'

type Props = {
  pack: PackGemmes
  onPaye: () => void // le paiement est passé : les gemmes arrivent
  onFermer: () => void
}

export function Paiement({ pack, onPaye, onFermer }: Props) {
  const prix = prixEuros(pack.centimes)
  return createPortal(
    <Fenetre
      titre={t('Acheter des gemmes')}
      icone="💎"
      couleur="violet"
      taille="petite"
      devant
      onFermer={onFermer}
      pied={
        <>
          <button className="btn btn-blanc" onClick={onFermer}>
            {t('Annuler')}
          </button>
          {PAIEMENT_SIMULE ? (
            <button className="btn btn-jaune" onClick={onPaye} autoFocus>
              {t('Payer {prix}', { prix })}
            </button>
          ) : (
            <button className="btn btn-jaune" disabled>
              🔒 {t('Bientôt disponible')}
            </button>
          )}
        </>
      }
    >
      <div className="paiement-pack">
        <span aria-hidden="true">💎</span>
        <strong>{nombre(pack.gemmes)}</strong>
        <span>{t('gemmes')}</span>
        <span className="paiement-prix">{prix}</span>
      </div>
      <p className="paiement-note">
        {PAIEMENT_SIMULE
          ? t('Simulation de paiement : aucun argent n’est pris. Elle sert à tester la boutique.')
          : t('Les achats de gemmes arrivent très bientôt ! En attendant, regarde une publicité pour gagner des gemmes.')}
      </p>
    </Fenetre>,
    document.body,
  )
}
