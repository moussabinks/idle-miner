// Un stock de minerais (27/10) : le coffre de la mine, ou le chariot de la foreuse. La même
// interface pour les deux : le titre et sa barre sur une ligne, puis une ligne par minerai que
// sort la mine à son niveau (même s'il n'y en a pas encore) : combien il y en a, ce que fait le
// wagonnet vers le marché (🚃 Vendre / Garder, s'il y a ce trajet : 23/10, un seul bouton qu'on
// touche n'importe où pour passer de l'un à l'autre), et 🎒 pour le mettre dans son sac. (30/10) Comme au marché, un curseur par minerai choisit combien en prendre (tout, par
// défaut). Puis « Tout mettre dans le sac ». On ne vend jamais sur place : on porte au marché, ou un
// wagonnet le fait.
// (23/10) Pour le coffre de la mine, le wagonnet a trois choix par minerai : « 🚃 Vend tout »,
// « 📌 Garde 40 » (il en laisse toujours 40 dans le coffre et vend le reste) ou « 🔒 Garde tout » ;
// on touche la pastille, et un petit encart s'ouvre sous la ligne pour choisir.
// Aucune règle du jeu ici : le panneau donne les actions (prendre, envoyer).

import { useState } from 'react'
import { BLOCS, type IdBloc, type IdLiaison } from '../jeu/donnees'
import { blocsDuNiveau } from '../jeu/mine'
import { placeLibre, type EtatJeu, type Inventaire } from '../jeu/mineur'
import { choixWagonnet, envoyerObjet, objetEnvoye, reglerWagonnet, trajetDe, type ChoixWagonnet } from '../jeu/wagonnet'
import { Barre } from './Barre'
import type { PropsPanneau } from './Panneaux'

type Props = PropsPanneau & {
  titre: string // « 📦 Coffre », « 🛒 Chariot »
  nomStock: string // « coffre », « chariot » (pour les phrases)
  contenu: Inventaire
  capacite: number
  textePlein: string // dans la barre quand il est plein
  liaison: IdLiaison // le trajet du wagonnet vers le marché
  reserve?: Partial<Record<IdBloc, string>> // une petite mention sous un minerai (« 🔥 foreuse d'abord »)
  prendre: (e: EtatJeu, lot?: Inventaire) => string[] // mettre dans le sac (sans lot : tout)
  tutoSac?: boolean // le bouton « Tout mettre dans le sac » est une cible du tutoriel
}

export function StockMinerais({ etat, jouer, titre, nomStock, contenu, capacite, textePlein, liaison, reserve = {}, prendre, tutoSac = false }: Props) {
  const placeSac = placeLibre(etat)
  // Combien prendre de chaque minerai (absent : tout ce qu'il y a).
  const [choix, setChoix] = useState<Partial<Record<IdBloc, number>>>({})
  // (23/10) Le minerai dont on règle le wagonnet (l'encart ouvert sous sa ligne).
  const [regle, setRegle] = useState<IdBloc | null>(null)
  const avecGarde = liaison === 'mine-marche'
  const wagonnet = trajetDe(etat, liaison) !== null
  const total = Object.values(contenu).reduce((t, n) => t + (n ?? 0), 0)
  const plein = total >= capacite
  // Les minerais du niveau, et ceux d'avant qui resteraient dans le stock (les plus chers en haut).
  const blocs = [...new Set([...blocsDuNiveau(etat.niveauMine), ...(Object.keys(contenu) as IdBloc[])])].sort((a, b) => BLOCS[b].prix - BLOCS[a].prix)
  return (
    <div className="ligne-achat coffre-mine">
      {/* Le titre et la barre sur une seule ligne (la place est comptée). */}
      <div className="coffre-entete">
        <strong>{titre}</strong>
        <div className="coffre-barre">
          <Barre valeur={total} max={capacite} texte={plein ? textePlein : `${total} / ${capacite}`} couleur={plein ? 'rouge' : 'or'} />
        </div>
      </div>
      <div className={`table-coffre ${wagonnet ? '' : 'sans-wagonnet'}`}>
        <span className="entete-coffre">Minerai</span>
        <span className="entete-coffre nombre">{nomStock}</span>
        {wagonnet && <span className="entete-coffre">🚃 Wagonnet</span>}
        <span className="entete-coffre">🎒 Prendre</span>
        {blocs.map((bloc) => {
          const nombre = contenu[bloc] ?? 0
          const voulu = Math.min(nombre, choix[bloc] ?? nombre)
          const envoye = wagonnet && objetEnvoye(etat, liaison, bloc)
          return (
            <div key={bloc} className={`ligne-coffre ${nombre === 0 ? 'ligne-vide' : ''}`}>
              <span className="nom-coffre" title={`${BLOCS[bloc].nom} · ${BLOCS[bloc].prix} $ pièce${reserve[bloc] ? ` · ${reserve[bloc]}` : ''}`}>
                <span aria-hidden="true">{BLOCS[bloc].emoji}</span> {BLOCS[bloc].nom}
                <small className="discret"> {BLOCS[bloc].prix} $</small>
                {/* (23/10) juste l'icône (🔥, ⚡), le détail en bulle : tout tient sur une ligne */}
                {reserve[bloc] && (
                  <small className="reserve-coffre" title={reserve[bloc]}>
                    {[...(reserve[bloc] ?? '')][0]}
                  </small>
                )}
              </span>
              <strong className="nombre">{nombre.toLocaleString('fr-FR')}</strong>
              {wagonnet && avecGarde && (
                <PastilleWagonnet etat={etat} bloc={bloc} ouvert={regle === bloc} onToucher={() => setRegle(regle === bloc ? null : bloc)} />
              )}
              {wagonnet && !avecGarde && (
                // (23/10) Un seul bouton : le toucher n'importe où passe de « Vendre » à « Garder »
                // (et inversement) ; le côté allumé dit ce que fait le wagonnet.
                <button
                  className="choix-wagonnet"
                  role="switch"
                  aria-checked={envoye}
                  aria-label={`Wagonnet : ${BLOCS[bloc].nom}, ${envoye ? 'vendu' : 'gardé'}`}
                  title={envoye ? `Le wagonnet le vend au marché (touche pour le garder dans le ${nomStock})` : `Le wagonnet le laisse dans le ${nomStock} (touche pour le vendre)`}
                  onClick={() => jouer((e) => envoyerObjet(e, liaison, bloc, !envoye))}
                >
                  <span className={envoye ? 'actif vendre' : ''}>Vendre</span>
                  <span className={envoye ? '' : 'actif garder'}>Garder</span>
                </button>
              )}
              <span className="prendre-coffre">
                <input
                  type="range"
                  min={0}
                  max={nombre}
                  value={voulu}
                  disabled={nombre === 0}
                  aria-label={`Combien de ${BLOCS[bloc].nom} mettre dans le sac`}
                  onChange={(e) => {
                    const valeur = Number(e.target.value)
                    setChoix({ ...choix, [bloc]: valeur >= nombre ? undefined : valeur })
                  }}
                />
                <small className="prendre-compteur">{Math.min(voulu, placeSac)}</small>
                <button
                  className="bouton bouton-petit bouton-sac bouton-sac-ligne"
                  disabled={voulu === 0 || placeSac === 0}
                  title={`Mettre ${Math.min(voulu, placeSac)} ${BLOCS[bloc].nom.toLowerCase()} dans ton sac`}
                  onClick={() => {
                    jouer((e) => prendre(e, { [bloc]: voulu }))
                    setChoix({ ...choix, [bloc]: undefined })
                  }}
                >
                  🎒
                </button>
              </span>
              {wagonnet && avecGarde && regle === bloc && (
                <EncartWagonnet etat={etat} bloc={bloc} nombre={nombre} onChoisir={(c, n) => jouer((e) => reglerWagonnet(e, bloc, c, n))} onFermer={() => setRegle(null)} />
              )}
            </div>
          )
        })}
      </div>
      <div className="boutons">
        {/* (23/10) Plein : le bouton est mis en avant (doucement), pour qu'on sache quoi faire. */}
        <button
          className={`bouton bouton-sac ${plein && placeSac > 0 ? 'bouton-sac-urgent' : ''}`}
          data-tuto={tutoSac ? 'sac' : undefined}
          disabled={total === 0 || placeSac === 0}
          onClick={() => jouer((e) => prendre(e))}
        >
          🎒 Tout mettre dans le sac ({Math.min(total, placeSac)})
        </button>
      </div>
      {placeSac === 0 && <span className="discret manque">🎒 Sac plein : va d’abord vendre au marché.</span>}
      {!wagonnet && <span className="discret">🛤️ Des rails jusqu’au marché : un wagonnet vendra le {nomStock} tout seul.</span>}
    </div>
  )
}

// La pastille du wagonnet pour un minerai du coffre (23/10) : ce qu'il en fait, en un mot.
function PastilleWagonnet({ etat, bloc, ouvert, onToucher }: { etat: EtatJeu; bloc: IdBloc; ouvert: boolean; onToucher: () => void }) {
  const { choix, nombre } = choixWagonnet(etat, bloc)
  const texte = choix === 'vendre' ? '🚃 Vend tout' : choix === 'garder' ? `📌 Garde ${nombre.toLocaleString('fr-FR')}` : '🔒 Garde tout'
  return (
    <button
      className={`pastille-wagonnet pastille-${choix} ${ouvert ? 'pastille-ouverte' : ''}`}
      aria-expanded={ouvert}
      title={`Que fait le wagonnet du marché avec le ${BLOCS[bloc].nom.toLowerCase()} ? (touche pour changer)`}
      onClick={onToucher}
    >
      {texte}
      <span className="pastille-fleche" aria-hidden="true">
        {ouvert ? '▴' : '▾'}
      </span>
    </button>
  )
}

// L'encart qui s'ouvre sous la ligne (23/10) : trois gros choix, et pour « Garder », un compteur
// qu'on règle par 10 (− / +). Le choix compte tout de suite ; « ✔ OK » referme l'encart.
function EncartWagonnet({
  etat,
  bloc,
  nombre,
  onChoisir,
  onFermer,
}: {
  etat: EtatJeu
  bloc: IdBloc
  nombre: number
  onChoisir: (choix: ChoixWagonnet, nombre?: number) => void
  onFermer: () => void
}) {
  const actuel = choixWagonnet(etat, bloc)
  // Le nombre à garder proposé : celui d'avant, sinon la moitié de ce qu'il y a (au moins 10).
  const garde = actuel.choix === 'garder' ? actuel.nombre : Math.max(10, Math.round(nombre / 2 / 10) * 10)
  const nom = BLOCS[bloc].nom.toLowerCase()
  const vendu = Math.max(0, nombre - garde)
  return (
    <div className="encart-wagonnet" role="group" aria-label={`Le wagonnet et le ${nom}`}>
      <span className="encart-titre">
        🚃 Que fait le wagonnet avec le {BLOCS[bloc].emoji} {nom} ?
      </span>
      <div className="encart-choix">
        <button className={`encart-option option-vendre ${actuel.choix === 'vendre' ? 'option-active' : ''}`} onClick={() => onChoisir('vendre')}>
          <b>🚃</b>
          Tout vendre
        </button>
        <div className={`encart-option option-garder ${actuel.choix === 'garder' ? 'option-active' : ''}`}>
          <button className="option-garder-titre" onClick={() => onChoisir('garder', garde)}>
            <b>📌</b>
            Garder
          </button>
          <span className="compteur-garde">
            <button aria-label="10 de moins" disabled={garde <= 10} onClick={() => onChoisir('garder', Math.max(10, garde - 10))}>
              −
            </button>
            <strong>{garde.toLocaleString('fr-FR')}</strong>
            <button aria-label="10 de plus" onClick={() => onChoisir('garder', garde + 10)}>
              +
            </button>
          </span>
          <small>et vendre le reste</small>
        </div>
        <button className={`encart-option option-tout-garder ${actuel.choix === 'tout-garder' ? 'option-active' : ''}`} onClick={() => onChoisir('tout-garder')}>
          <b>🔒</b>
          Tout garder
        </button>
      </div>
      <span className="encart-exemple">
        {actuel.choix === 'garder'
          ? `Le wagonnet laisse toujours ${garde.toLocaleString('fr-FR')} ${nom} dans le coffre${nombre > 0 ? ` : là, il en vendrait ${vendu.toLocaleString('fr-FR')}` : ''}.`
          : actuel.choix === 'tout-garder'
            ? `Le wagonnet laisse tout le ${nom} dans le coffre.`
            : `Le wagonnet vend tout le ${nom} au marché.`}
      </span>
      <button className="bouton bouton-petit bouton-vendre encart-ok" onClick={onFermer}>
        ✔ OK
      </button>
    </div>
  )
}
