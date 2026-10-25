// Un stock de minerais à vendre (25/10) : le coffre de la mine, ou le chariot de la foreuse. La
// même interface pour les deux, toute simple :
//   - le titre et sa jauge (« 120 / 300 ») ;
//   - le gros bouton « Tout vendre » avec ce que ça rapporte ;
//   - une ligne par minerai : combien il y en a, ce que ça vaut, et « Vendre » pour lui seul ;
//   - pour le coffre, une punaise 📌 par minerai : le garder (il n'est plus vendu, ni par « Tout
//     vendre », ni par le wagonnet) pour payer ses améliorations.
// Aucune règle du jeu ici : le panneau reçoit les actions (vendre, garder).

import { BLOCS, type IdBloc } from '../jeu/donnees'
import { nombre, t } from '../jeu/langue'
import { valeurDe, type EtatJeu, type Inventaire } from '../jeu/mineur'
import type { Action } from '../usePartie'
import { nombreAbrege } from '../nombres'
import { Barre } from './Barre'
import { useJeu } from './contexteJeu'

type Props = {
  titre: string // « 📦 Coffre de la mine »
  contenu: Inventaire
  capacite: number
  blocs: IdBloc[] // les minerais à montrer (même à 0), les plus chers en premier
  vendreTout: Action
  vendre: (bloc: IdBloc) => Action
  aVendre: Inventaire // ce que « Tout vendre » vendrait (sans ce qu'on garde)
  garde?: (bloc: IdBloc) => boolean // ce minerai est-il gardé ? (absent : pas de punaise)
  basculerGarde?: (bloc: IdBloc) => Action
  textePlein?: string
  tuto?: boolean // le bouton « Tout vendre » est une cible du tutoriel
}

export function StockMinerais({ titre, contenu, capacite, blocs, vendreTout, vendre, aVendre, garde, basculerGarde, textePlein, tuto = false }: Props) {
  const { etat, jouer } = useJeu()
  const total = Object.values(contenu).reduce((somme, n) => somme + (n ?? 0), 0)
  const plein = total >= capacite
  const gain = valeurDe(aVendre, etat)
  return (
    <div className="stock">
      <div className="stock-entete">
        <strong>{titre}</strong>
        <Barre valeur={total} max={capacite} texte={plein ? (textePlein ?? t('Plein !')) : `${nombre(total)} / ${nombre(capacite)}`} couleur={plein ? 'rouge' : 'or'} />
      </div>
      <button className={`btn btn-jaune btn-large btn-grand ${plein ? 'btn-attention' : ''}`} data-tuto={tuto ? 'vendre' : undefined} disabled={gain <= 0} onClick={() => jouer(vendreTout)}>
        💰 {t('Tout vendre')} {gain > 0 && <span className="stock-gain">+{nombreAbrege(gain)} $</span>}
      </button>
      <ul className="stock-lignes">
        {blocs.map((bloc) => (
          <LigneStock key={bloc} etat={etat} bloc={bloc} nombreDe={contenu[bloc] ?? 0} garde={garde?.(bloc) ?? false} onVendre={() => jouer(vendre(bloc))} onGarder={basculerGarde ? () => jouer(basculerGarde(bloc)) : undefined} />
        ))}
      </ul>
    </div>
  )
}

function LigneStock({ etat, bloc, nombreDe, garde, onVendre, onGarder }: { etat: EtatJeu; bloc: IdBloc; nombreDe: number; garde: boolean; onVendre: () => void; onGarder?: () => void }) {
  const info = BLOCS[bloc]
  return (
    <li className={`stock-ligne ${nombreDe === 0 ? 'vide' : ''} ${garde ? 'gardee' : ''}`}>
      <span className="stock-icone" aria-hidden="true">
        {info.emoji}
      </span>
      <span className="stock-nom">
        {t(info.nom)}
        <small>{t('{prix} $ pièce', { prix: nombre(info.prix) })}</small>
      </span>
      <strong className="stock-nombre">{nombre(nombreDe)}</strong>
      {onGarder && (
        <button className={`btn btn-petit btn-rond stock-punaise ${garde ? 'btn-bleu' : 'btn-blanc'}`} onClick={onGarder} aria-pressed={garde} title={garde ? t('Gardé : ni vendu, ni emporté par le wagonnet. Touche pour le vendre de nouveau.') : t('Garder ce minerai (pour tes améliorations)')}>
          📌
        </button>
      )}
      <button className="btn btn-jaune btn-petit stock-vendre" disabled={nombreDe <= 0} onClick={onVendre}>
        +{nombreAbrege(valeurDe({ [bloc]: nombreDe }, etat))} $
      </button>
    </li>
  )
}
