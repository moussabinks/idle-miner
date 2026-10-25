// La fenêtre de paiement d'un pack de gemmes (25/10). Pour l'instant, aucun vrai paiement :
// pendant le développement, un paiement simulé (aucun argent n'est pris) ; en ligne, « bientôt
// disponible ». Voir PAIEMENT_SIMULE dans src/portail.ts.

import { createPortal } from 'react-dom'
import type { PackGemmes } from '../jeu/gemmes'
import { nombre, prixEuros, t } from '../jeu/langue'
import { PAIEMENT_SIMULE } from '../portail'
import { Fenetre } from './Fenetre'

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
        PAIEMENT_SIMULE ? (
          <>
            <button className="btn btn-blanc" onClick={onFermer}>
              {t('Annuler')}
            </button>
            <button className="btn btn-jaune" onClick={onPaye} autoFocus>
              {t('Payer {prix}', { prix })}
            </button>
          </>
        ) : (
          <button className="btn btn-jaune" onClick={onFermer} autoFocus>
            {t('OK')}
          </button>
        )
      }
    >
      <div className="paiement-pack">
        <span aria-hidden="true">💎</span>
        <strong>{nombre(pack.gemmes)}</strong>
        <span>{t('gemmes')}</span>
        <span className="paiement-prix">{prix}</span>
      </div>
      {PAIEMENT_SIMULE ? (
        <p className="paiement-note">{t('Simulation de paiement : aucun argent n’est pris. Elle sert à tester la boutique.')}</p>
      ) : (
        <p className="paiement-note">{t('Le paiement arrive bientôt ! En attendant, regarde une publicité pour gagner des gemmes.')}</p>
      )}
    </Fenetre>,
    document.body,
  )
}
