// Un stock de minerais (27/10) : le coffre de la mine, ou le chariot de la foreuse. La même
// interface pour les deux : le titre et sa barre sur une ligne, puis une ligne par minerai que
// sort la mine à son niveau (même s'il n'y en a pas encore) : combien il y en a, ce que fait le
// wagonnet vers le marché (🚃 Vendre / Garder, s'il y a ce trajet), et 🎒 pour le mettre dans son
// sac. (23/10) Un curseur par minerai règle combien en GARDER (par exemple 40 fer) : le wagonnet
// et le bouton 🎒 ne prennent que ce qu'il y a en plus, à chaque fois. Puis « Tout mettre dans le
// sac » (lui aussi laisse ce qu'on garde). On ne vend jamais sur place : on porte au marché, ou un
// wagonnet le fait.
// Aucune règle du jeu ici : le panneau donne les actions (prendre, envoyer).

import { BLOCS, type IdBloc, type IdLiaison } from '../jeu/donnees'
import { blocsDuNiveau } from '../jeu/mine'
import { placeLibre, quantiteAGarder, quantiteEnPlus, reglerGarde, type EtatJeu, type Inventaire, type Stock } from '../jeu/mineur'
import { envoyerObjet, objetEnvoye, trajetDe } from '../jeu/wagonnet'
import { Barre } from './Barre'
import type { PropsPanneau } from './Panneaux'

type Props = PropsPanneau & {
  titre: string // « 📦 Coffre », « 🛒 Chariot »
  nomStock: string // « coffre », « chariot » (pour les phrases)
  stock: Stock // où on garde les minerais (le réglage « garder »)
  contenu: Inventaire
  capacite: number
  textePlein: string // dans la barre quand il est plein
  liaison: IdLiaison // le trajet du wagonnet vers le marché
  reserve?: Partial<Record<IdBloc, string>> // une petite mention sous un minerai (« 🔥 foreuse d'abord »)
  prendre: (e: EtatJeu, lot?: Inventaire) => string[] // mettre dans le sac (sans lot : tout)
  tutoSac?: boolean // le bouton « Tout mettre dans le sac » est une cible du tutoriel
}

export function StockMinerais({ etat, jouer, titre, nomStock, stock, contenu, capacite, textePlein, liaison, reserve = {}, prendre, tutoSac = false }: Props) {
  const placeSac = placeLibre(etat)
  const wagonnet = trajetDe(etat, liaison) !== null
  const total = Object.values(contenu).reduce((t, n) => t + (n ?? 0), 0)
  // Ce qu'on peut prendre (tout, sauf ce qu'on garde).
  const enPlus = (Object.entries(contenu) as [IdBloc, number][]).reduce((t, [bloc, n]) => t + quantiteEnPlus(etat, stock, bloc, n ?? 0), 0)
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
        <span className="entete-coffre" title="Combien en garder : le wagonnet et 🎒 ne prennent que le reste">📌 Garder · 🎒 Prendre</span>
        {blocs.map((bloc) => {
          const nombre = contenu[bloc] ?? 0
          const garde = quantiteAGarder(etat, stock, bloc)
          const voulu = quantiteEnPlus(etat, stock, bloc, nombre)
          const envoye = wagonnet && objetEnvoye(etat, liaison, bloc)
          return (
            <div key={bloc} className={`ligne-coffre ${nombre === 0 ? 'ligne-vide' : ''}`}>
              <span className="nom-coffre" title={`${BLOCS[bloc].prix} $ pièce`}>
                <span aria-hidden="true">{BLOCS[bloc].emoji}</span> {BLOCS[bloc].nom}
                <small className="discret"> {BLOCS[bloc].prix} $</small>
                {reserve[bloc] && <small className="reserve-coffre">{reserve[bloc]}</small>}
              </span>
              <strong className="nombre">{nombre.toLocaleString('fr-FR')}</strong>
              {wagonnet && (
                <span className="choix-wagonnet" role="group" aria-label={`Wagonnet : ${BLOCS[bloc].nom}`}>
                  <button className={envoye ? 'actif vendre' : ''} aria-pressed={envoye} title="Le wagonnet l’emporte et le vend au marché" onClick={() => jouer((e) => envoyerObjet(e, liaison, bloc, true))}>
                    Vendre
                  </button>
                  <button className={envoye ? '' : 'actif garder'} aria-pressed={!envoye} title={`Le wagonnet le laisse dans le ${nomStock}`} onClick={() => jouer((e) => envoyerObjet(e, liaison, bloc, false))}>
                    Garder
                  </button>
                </span>
              )}
              <span className="prendre-coffre">
                {/* (23/10) Le curseur règle combien en garder (il reste réglé) : le wagonnet et 🎒
                    prennent seulement ce qu'il y a en plus. */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(nombre, garde)}
                  value={garde}
                  disabled={nombre === 0 && garde === 0}
                  aria-label={`Combien de ${BLOCS[bloc].nom} garder dans le ${nomStock}`}
                  title={`Garder ${garde} ${BLOCS[bloc].nom.toLowerCase()} dans le ${nomStock}`}
                  onChange={(e) => {
                    const valeur = Number(e.target.value)
                    jouer((x) => reglerGarde(x, stock, bloc, valeur))
                  }}
                />
                <small className={`prendre-compteur ${garde > 0 ? 'garde-active' : ''}`} title={`On garde ${garde} ${BLOCS[bloc].nom.toLowerCase()}`}>
                  📌{garde}
                </small>
                <button
                  className="bouton bouton-petit bouton-sac bouton-sac-ligne"
                  disabled={voulu === 0 || placeSac === 0}
                  title={`Mettre ${Math.min(voulu, placeSac)} ${BLOCS[bloc].nom.toLowerCase()} dans ton sac`}
                  onClick={() => jouer((e) => prendre(e, { [bloc]: voulu }))}
                >
                  🎒 {Math.min(voulu, placeSac)}
                </button>
              </span>
            </div>
          )
        })}
      </div>
      <div className="boutons">
        {/* (23/10) Plein : le bouton est mis en avant (doucement), pour qu'on sache quoi faire. */}
        <button
          className={`bouton bouton-sac ${plein && placeSac > 0 ? 'bouton-sac-urgent' : ''}`}
          data-tuto={tutoSac ? 'sac' : undefined}
          disabled={enPlus === 0 || placeSac === 0}
          onClick={() => jouer((e) => prendre(e))}
        >
          🎒 Tout mettre dans le sac ({Math.min(enPlus, placeSac)})
        </button>
      </div>
      <span className="discret">📌 Règle combien garder de chaque minerai : le wagonnet et 🎒 prennent seulement le reste.</span>
      {placeSac === 0 && <span className="discret manque">🎒 Sac plein : va d’abord vendre au marché.</span>}
      {!wagonnet && <span className="discret">🛤️ Des rails jusqu’au marché : un wagonnet vendra le {nomStock} tout seul.</span>}
    </div>
  )
}
