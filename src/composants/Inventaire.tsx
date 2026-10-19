// Le contenu du sac, au fond de la mine. On ne peut pas vendre ici, mais avec
// l'ascenseur on coche ce qu'on veut envoyer à la surface (vendu en arrivant).

import { BLOCS, type IdBloc } from '../jeu/donnees'
import {
  ascenseurEnMouvement,
  basculerChargement,
  basculerEnvoiAuto,
  bonusVente,
  demanderEnvoi,
  enMouvement,
  nbAEnvoyer,
  nbSurQuai,
  secondesAvantArretAscenseur,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'

export function Inventaire({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const ascenseur = etat.ascenseur
  const avecAscenseur = ascenseur.niveau > 0
  const aEnvoyer = nbAEnvoyer(etat)
  const surLeQuai = nbSurQuai(etat)
  const enVoyage = ascenseurEnMouvement(etat)

  return (
    <div className="inventaire">
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Creuse !</p>
      ) : (
        <>
          {avecAscenseur && <p className="discret">Coche ce que l'ascenseur emporte au marché.</p>}
          <ul>
            {piles.map(([id, nombre]) => {
              const envoye = !ascenseur.garder.includes(id)
              const ligne = (
                <>
                  {avecAscenseur && <input type="checkbox" checked={envoye} onChange={() => jouer((e) => basculerChargement(e, id))} />}
                  <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
                  <span className="inventaire-nom">{BLOCS[id].nom}</span>
                  <span className="inventaire-nombre">×{nombre}</span>
                  <span className="inventaire-valeur">{Math.round(nombre * BLOCS[id].prix * bonusVente(etat))} $</span>
                </>
              )
              return (
                <li key={id} className={avecAscenseur && !envoye ? 'garde' : ''}>
                  {/* Avec l'ascenseur, toute la ligne est cliquable pour cocher / décocher. */}
                  {avecAscenseur ? <label className="inventaire-ligne">{ligne}</label> : ligne}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {avecAscenseur ? (
        <div className="envoi-ascenseur">
          {surLeQuai > 0 && <p className="discret">📦 {surLeQuai} objet(s) attendent sur le quai de l'ascenseur : ils partent en premier.</p>}
          <button
            className="bouton bouton-ascenseur"
            disabled={aEnvoyer === 0 || enVoyage || ascenseur.envoiDemande || ascenseur.passager || enMouvement(etat)}
            onClick={() => jouer(demanderEnvoi)}
          >
            {/* Pendant que la cabine voyage, le bouton est grisé et compte les secondes. */}
            {enVoyage
              ? `🛗 Ascenseur ${ascenseur.retourAuFront ? 'de retour' : 'là'} dans ${Math.ceil(secondesAvantArretAscenseur(etat))} s`
              : aEnvoyer === 0
                ? '🛗 Rien à envoyer'
                : `🛗 Envoyer ${aEnvoyer} objet${aEnvoyer > 1 ? 's' : ''} à la surface`}
          </button>
          <label className="case-option">
            <input type="checkbox" checked={ascenseur.envoiAuto} onChange={() => jouer(basculerEnvoiAuto)} />
            Envoi automatique quand le sac est plein
          </label>
        </div>
      ) : (
        <p className="discret">Construis l'ascenseur (en bas à gauche de la mine) pour envoyer tes minerais au marché sans remonter.</p>
      )}
    </div>
  )
}
