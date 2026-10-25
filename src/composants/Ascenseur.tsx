// L'ascenseur de la mine : sa caisse fait des allers-retours sans cesse (23/10) et remonte ce que
// les mineurs creusent. L'améliorer : une caisse plus grande et plus rapide, chargée et vidée plus
// vite. La ligne d'amélioration est dans le panneau de la mine.

import { NIVEAUX_ASCENSEUR } from '../jeu/donnees'
import { nombre, t } from '../jeu/langue'
import { ameliorerAscenseur, debitAscenseur, peutPayer, prochainNiveauAscenseur, type EtatJeu } from '../jeu/mineur'
import { verrou } from '../jeu/niveaux'
import { Amelioration } from './Amelioration'

export function AmeliorationAscenseur({ etat }: { etat: EtatJeu }) {
  const prochain = prochainNiveauAscenseur(etat)
  const avecProchain = prochain ? { ...etat, ascenseur: { ...etat.ascenseur, niveau: prochain.niveau } } : null
  const debit = (e: EtatJeu) => nombre(debitAscenseur(e), 1)
  return (
    <Amelioration
      icone="🛗"
      titre={t('Ascenseur')}
      niveau={etat.ascenseur.niveau}
      niveauMax={NIVEAUX_ASCENSEUR.length}
      effet={
        avecProchain ? (
          <>
            {t('{n} blocs/s', { n: debit(etat) })} → <strong>{t('{n} blocs/s', { n: debit(avecProchain) })}</strong>
          </>
        ) : (
          t('{n} blocs/s', { n: debit(etat) })
        )
      }
      cout={prochain?.cout ?? null}
      verrou={verrou(etat, 'ascenseur', etat.ascenseur.niveau)}
      possible={prochain !== null && verrou(etat, 'ascenseur', etat.ascenseur.niveau) === null && peutPayer(etat, prochain.cout)}
      action={ameliorerAscenseur}
    />
  )
}
