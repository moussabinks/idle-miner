// Le contenu du sac, au fond de la mine. On ne peut pas vendre ici, mais avec
// l'ascenseur on choisit (avec les jauges) ce qu'on envoie à la surface, vendu en arrivant.

import { useState } from 'react'
import { lotChoisi, type Choix } from '../choix'
import { BLOCS, type IdBloc } from '../jeu/donnees'
import {
  ascenseurEnMouvement,
  basculerEnvoiAuto,
  bonusVente,
  demanderEnvoi,
  enMouvement,
  nbAEnvoyer,
  nbSurQuai,
  reglerChargement,
  secondesAvantArretAscenseur,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'
import { Jauges } from './Jauges'

export function Inventaire({ etat, jouer }: { etat: EtatJeu; jouer: (action: Action) => void }) {
  // Les quantités choisies avec les jauges (par défaut : tout, sauf les objets gardés).
  const [choix, setChoix] = useState<Choix>({})
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const ascenseur = etat.ascenseur
  const avecAscenseur = ascenseur.niveau > 0
  const lot = lotChoisi(choix, ascenseur.garder, piles)
  const aEnvoyer = nbAEnvoyer(etat, lot)
  const surLeQuai = nbSurQuai(etat)
  const enVoyage = ascenseurEnMouvement(etat)
  const prixUnitaire = (bloc: IdBloc) => BLOCS[bloc].prix * bonusVente(etat)

  // Une jauge mise à 0 : l'objet est « gardé » (le jeu s'en souvient, aussi pour l'envoi automatique).
  function changer(bloc: IdBloc, valeur: number | 'max') {
    setChoix({ ...choix, [bloc]: valeur })
    const garde = ascenseur.garder.includes(bloc)
    if ((valeur === 0) !== garde) jouer((e) => reglerChargement(e, bloc, valeur !== 0))
  }

  return (
    <div className="inventaire">
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Creuse !</p>
      ) : avecAscenseur ? (
        <>
          <p className="discret">Choisis combien l'ascenseur emporte de chaque objet au marché.</p>
          <Jauges piles={piles} choix={choix} gardes={ascenseur.garder} onChanger={changer} prixUnitaire={prixUnitaire} />
        </>
      ) : (
        // Sans ascenseur, on ne peut rien faire d'ici : juste regarder.
        <ul>
          {piles.map(([id, nombre]) => (
            <li key={id}>
              <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
              <span className="inventaire-nom">{BLOCS[id].nom}</span>
              <span className="inventaire-nombre">×{nombre}</span>
              <span className="inventaire-valeur">{Math.round(nombre * prixUnitaire(id))} $</span>
            </li>
          ))}
        </ul>
      )}

      {avecAscenseur ? (
        <div className="envoi-ascenseur">
          {surLeQuai > 0 && <p className="discret">📦 {surLeQuai} objet(s) attendent sur le quai de l'ascenseur : ils partent en premier.</p>}
          <button
            className="bouton bouton-ascenseur"
            disabled={aEnvoyer === 0 || enVoyage || ascenseur.envoiDemande || ascenseur.passager || enMouvement(etat)}
            onClick={() => {
              jouer((e) => demanderEnvoi(e, lot))
              setChoix({}) // les jauges reviennent à « tout » pour le prochain envoi
            }}
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
