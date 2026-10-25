// Un stock de minerais à vendre (25/10) : le coffre de la mine, ou le chariot de la foreuse. La
// même interface pour les deux, toute simple :
//   - le titre et sa jauge (« 120 / 300 ») ;
//   - le gros bouton « Tout vendre » avec ce que ça rapporte ;
//   - une ligne par minerai : combien il y en a, ce que ça vaut, et « Vendre » pour lui seul ;
//   - pour le coffre, une punaise 📌 par minerai : elle ouvre le réglage « garder » (−100, −10,
//     +10, +100, ou tout) ; ce qu'on garde n'est plus vendu, ni par « Tout vendre », ni par le
//     wagonnet, pour payer ses améliorations.
// Aucune règle du jeu ici : le panneau reçoit les actions (vendre, garder).

import { BLOCS, type IdBloc } from '../jeu/donnees'
import { nombre, t } from '../jeu/langue'
import { valeurDe, type EtatJeu, type Inventaire } from '../jeu/mineur'
import type { Action } from '../usePartie'
import { nombreAbrege } from '../nombres'
import { Barre } from './Barre'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'

type Props = {
  titre: string // « 📦 Coffre de la mine »
  contenu: Inventaire
  capacite: number
  blocs: IdBloc[] // les minerais à montrer (même à 0), les plus chers en premier
  vendreTout: Action
  vendre: (bloc: IdBloc) => Action
  aVendre: Inventaire // ce que « Tout vendre » vendrait (sans ce qu'on garde)
  garde?: (bloc: IdBloc) => number // combien on en garde (absent : pas de punaise)
  toutGarde?: (bloc: IdBloc) => boolean // on garde tout ce minerai
  changerGarde?: (bloc: IdBloc, pas: number) => Action // −100, −10, +10, +100
  basculerGarde?: (bloc: IdBloc) => Action // tout garder, ou plus rien
  textePlein?: string
  tuto?: boolean // le bouton « Tout vendre » est une cible du tutoriel
}

export function StockMinerais({ titre, contenu, capacite, blocs, vendreTout, vendre, aVendre, garde, toutGarde, changerGarde, basculerGarde, textePlein, tuto = false }: Props) {
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
          <LigneStock
            key={bloc}
            etat={etat}
            bloc={bloc}
            nombreDe={contenu[bloc] ?? 0}
            aVendre={aVendre[bloc] ?? 0}
            garde={garde?.(bloc) ?? 0}
            toutGarde={toutGarde?.(bloc) ?? false}
            onVendre={() => jouer(vendre(bloc))}
            onChanger={changerGarde && basculerGarde ? (pas) => jouer(changerGarde(bloc, pas)) : undefined}
            onTout={basculerGarde ? () => jouer(basculerGarde(bloc)) : undefined}
          />
        ))}
      </ul>
    </div>
  )
}

type PropsLigne = {
  etat: EtatJeu
  bloc: IdBloc
  nombreDe: number // dans le coffre
  aVendre: number // ce qu'on peut en vendre (sans ce qu'on garde)
  garde: number
  toutGarde: boolean
  onVendre: () => void
  onChanger?: (pas: number) => void
  onTout?: () => void
}

// Les pas du réglage « garder ».
const PAS_GARDER = [-100, -10, 10, 100]

function LigneStock({ etat, bloc, nombreDe, aVendre, garde, toutGarde, onVendre, onChanger, onTout }: PropsLigne) {
  const info = BLOCS[bloc]
  // (25/10) Le réglage « garder » s'ouvre dans une petite fenêtre au milieu de l'écran : la
  // fenêtre de la mine ne grandit plus.
  const [reglage, setReglage] = useState(false)
  const garde_ = toutGarde || garde > 0
  return (
    <li className={`stock-ligne-bloc ${garde_ ? 'gardee' : ''}`}>
      <div className={`stock-ligne ${nombreDe === 0 ? 'vide' : ''}`}>
        <span className="stock-icone" aria-hidden="true">
          {info.emoji}
        </span>
        {/* (25/10) Le prix pièce est au marché (« Prix du marché ») : ici, juste le nom. */}
        <span className="stock-nom">{t(info.nom)}</span>
        <strong className="stock-nombre">
          {nombre(nombreDe)}
          {/* ce qu'on garde, en petit sous le nombre */}
          {garde_ && <small className="stock-garde">📌 {toutGarde ? t('tout') : nombre(garde)}</small>}
        </strong>
        {onChanger && (
          <button className={`btn btn-petit stock-garder ${garde_ ? 'btn-bleu' : 'btn-blanc'}`} onClick={() => setReglage(true)} aria-haspopup="dialog">
            <span className="stock-garder-icone" aria-hidden="true">
              📌
            </span>
            {t('Garder')}
          </button>
        )}
        <button className="btn btn-jaune btn-petit stock-vendre" disabled={aVendre <= 0} onClick={onVendre}>
          +{nombreAbrege(valeurDe({ [bloc]: aVendre }, etat))} $
        </button>
      </div>
      {/* (posée dans <body> : rien de la fenêtre de la mine ne la coupe) */}
      {reglage &&
        onChanger &&
        onTout &&
        createPortal(
        <Fenetre
          titre={t('Garder du {nom}', { nom: t(info.nom) })}
          icone="📌"
          couleur="bleu"
          taille="petite"
          devant
          onFermer={() => setReglage(false)}
          pied={
            <button className="btn btn-jaune" onClick={() => setReglage(false)} autoFocus>
              ✔️ {t('OK')}
            </button>
          }
        >
          <p className="stock-reglage-aide">{t('Ce que tu gardes reste dans le coffre : ni « Tout vendre », ni le wagonnet ne le vendent. Pratique pour payer tes améliorations.')}</p>
          <p className="stock-reglage-titre">
            <span aria-hidden="true">{info.emoji}</span> {t('Dans le coffre : {n}', { n: nombre(nombreDe) })} · 📌 {t('Gardé :')} <b>{toutGarde ? t('tout') : nombre(garde)}</b>
          </p>
          <div className="stock-reglage-boutons">
            {PAS_GARDER.map((pas) => (
              <button key={pas} className={`btn btn-petit ${pas < 0 ? 'btn-blanc' : 'btn-bleu'}`} disabled={pas < 0 && !garde_} onClick={() => onChanger(pas)}>
                {pas > 0 ? `+${pas}` : `−${-pas}`}
              </button>
            ))}
            <button className={`btn btn-petit ${toutGarde ? 'btn-bleu' : 'btn-blanc'}`} aria-pressed={toutGarde} onClick={onTout}>
              {t('Tout')}
            </button>
          </div>
        </Fenetre>,
          document.body,
        )}
    </li>
  )
}
