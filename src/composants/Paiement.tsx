// La fenêtre de paiement d'un pack de gemmes (25/10). Pour l'instant, un paiement SIMULÉ (aucun
// argent n'est pris) : elle ne s'ouvre que pendant le développement (PACKS_VISIBLES dans
// src/portail.ts). Le jour où la boutique de CrazyGames est ouverte au jeu, c'est ici qu'on
// l'appellera à la place.

import { createPortal } from 'react-dom'
import type { PackGemmes } from '../jeu/gemmes'
import { nombre, prixEuros, t } from '../jeu/langue'
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
        <>
          <button className="btn btn-blanc" onClick={onFermer}>
            {t('Annuler')}
          </button>
          <button className="btn btn-jaune" onClick={onPaye} autoFocus>
            {t('Payer {prix}', { prix })}
          </button>
        </>
      }
    >
      <div className="paiement-pack">
        <span aria-hidden="true">💎</span>
        <strong>{nombre(pack.gemmes)}</strong>
        <span>{t('gemmes')}</span>
        <span className="paiement-prix">{prix}</span>
      </div>
      <p className="paiement-note">{t('Simulation de paiement : aucun argent n’est pris. Elle sert à tester la boutique.')}</p>
    </Fenetre>,
    document.body,
  )
}
