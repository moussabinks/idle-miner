// L'ascenseur de la mine : sa caisse fait des allers-retours sans cesse (23/10) et remonte ce que
// les mineurs creusent. L'améliorer : une caisse plus grande et plus rapide, chargée et vidée plus
// vite.
// Le bloc pour l'améliorer est dans le panneau de la mine.

import { NIVEAUX_ASCENSEUR } from '../jeu/donnees'
import { ameliorerAscenseur, capaciteAscenseur, debitAscenseur, niveauAscenseur, peutPayer, prochainNiveauAscenseur, secondesChargementAscenseur, secondesVidageAscenseur, type EtatJeu } from '../jeu/mineur'
import type { Action } from '../usePartie'
import { Amelioration } from './Amelioration'
import { verrou } from '../jeu/niveaux'

const parSeconde = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

export function AmeliorationAscenseur({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  const niveau = niveauAscenseur(etat)
  const prochain = prochainNiveauAscenseur(etat)
  const avecProchain = prochain ? { ...etat, ascenseur: { ...etat.ascenseur, niveau: prochain.niveau } } : null
  return (
    <Amelioration
      etat={etat}
      actuel={`Caisse de ${capaciteAscenseur(etat)} blocs · charge ${parSeconde(secondesChargementAscenseur(etat))} s, vide ${parSeconde(secondesVidageAscenseur(etat))} s · ${parSeconde(debitAscenseur(etat))} bloc/s au plus`}
      niveau={etat.ascenseur.niveau}
      niveauMax={NIVEAUX_ASCENSEUR.length}
      suivant={prochain && avecProchain && { cout: prochain.cout, texte: niveau ? `⬆ ${prochain.capacite} blocs · charge ${parSeconde(prochain.secondesChargement)} s, vide ${parSeconde(prochain.secondesVidage)} s · ${parSeconde(debitAscenseur(avecProchain))} bloc/s` : '🔨 Construire' }}
      verrou={verrou(etat, 'ascenseur', etat.ascenseur.niveau)}
      possible={prochain !== null && peutPayer(etat, prochain.cout)}
      onAmeliorer={() => jouer(ameliorerAscenseur)}
    />
  )
}
