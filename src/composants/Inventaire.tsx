// Le contenu du sac, au fond de la mine. On ne peut pas vendre ici, mais avec
// l'ascenseur on choisit (avec les jauges) ce qu'on envoie à la surface, vendu en arrivant.

import { useState } from 'react'
import { lotChoisi, type Choix } from '../choix'
import { BLOCS, type IdBloc } from '../jeu/donnees'
import {
  appelerAscenseur,
  ascenseurEnMouvement,
  basculerEnvoiAuto,
  bonusVente,
  demanderEnvoi,
  enMouvement,
  nbAEnvoyer,
  nbSurQuai,
  reglerChargement,
  secondesAvantArretAscenseur,
  voyager,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action } from '../usePartie'
import { AmeliorationAscenseur } from './Ascenseur'
import { Jauges } from './Jauges'

type Props = {
  etat: EtatJeu
  jouer: (action: Action) => void
  onRemonter: () => void // arrête le minage avant de partir
}

export function Inventaire({ etat, jouer, onRemonter }: Props) {
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
  // La cabine est-elle à ton niveau (tu peux monter dedans) ?
  const ici = ascenseur.niveau > 0 && !enVoyage && ascenseur.position === etat.position
  // Pendant un voyage (ou si tu bouges déjà), on ne peut rien demander d'autre.
  const occupe = enVoyage || ascenseur.envoiDemande || ascenseur.passager || enMouvement(etat) || etat.depart !== null
  const minuteur = `${ascenseur.retourAuFront ? 'De retour' : 'Là'} dans ${Math.ceil(secondesAvantArretAscenseur(etat))} s`
  const prixUnitaire = (bloc: IdBloc) => BLOCS[bloc].prix * bonusVente(etat)

  // Une jauge mise à 0 : l'objet est « gardé » (le jeu s'en souvient, aussi pour l'envoi automatique).
  function changer(bloc: IdBloc, valeur: number | 'max') {
    setChoix({ ...choix, [bloc]: valeur })
    const garde = ascenseur.garder.includes(bloc)
    if ((valeur === 0) !== garde) jouer((e) => reglerChargement(e, bloc, valeur !== 0))
  }

  // Toutes les jauges au maximum : l'ascenseur emporte tout (plus aucun objet gardé).
  function toutSelectionner() {
    setChoix({})
    jouer((e) => {
      for (const [bloc] of piles) reglerChargement(e, bloc, true)
      return []
    })
  }

  // Remonter au village avec la cabine (le mineur marche d'abord jusqu'au puits) :
  // seulement le mineur, avec son sac. Rien n'est vendu : c'est « Envoyer » qui vend.
  function remonter() {
    onRemonter()
    jouer((e) => voyager(e, 0, false, {}))
  }

  return (
    <div className="inventaire">
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Creuse !</p>
      ) : avecAscenseur ? (
        <>
          <p className="discret">Choisis combien l'ascenseur emporte de chaque objet au marché.</p>
          <Jauges
            piles={piles}
            choix={choix}
            gardes={ascenseur.garder}
            onChanger={changer}
            prixUnitaire={prixUnitaire}
            onToutSelectionner={toutSelectionner}
          />
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
          {/* Deux boutons : envoyer les objets (vendus en arrivant), ou remonter soi-même (le sac
              reste plein). Pendant que la cabine voyage, ils sont grisés et comptent les secondes. */}
          <div className="boutons-ascenseur">
            <button
              className="bouton bouton-petit bouton-ascenseur"
              disabled={aEnvoyer === 0 || occupe}
              onClick={() => {
                jouer((e) => demanderEnvoi(e, lot))
                setChoix({}) // les jauges reviennent à « tout » pour le prochain envoi
              }}
            >
              {enVoyage ? `🛗 ${minuteur}` : aEnvoyer === 0 ? '📦 Rien à envoyer' : `📦 Envoyer ${aEnvoyer} objet${aEnvoyer > 1 ? 's' : ''}`}
            </button>
            {ici ? (
              <button className="bouton bouton-petit bouton-voyage" disabled={occupe} onClick={remonter}>
                ⏫ Remonter
              </button>
            ) : (
              <button className="bouton bouton-petit bouton-voyage" disabled={occupe} onClick={() => jouer(appelerAscenseur)}>
                {enVoyage ? `🛗 ${minuteur}` : "🛗 Appeler l'ascenseur"}
              </button>
            )}
          </div>
          <label className="case-option">
            <input type="checkbox" checked={ascenseur.envoiAuto} onChange={() => jouer(basculerEnvoiAuto)} />
            Envoi automatique quand le sac est plein
          </label>
        </div>
      ) : null}

      {/* L'ascenseur se construit et s'améliore directement d'ici. */}
      <div className="ligne-achat carte-ascenseur">
        <strong>🛗 Ascenseur</strong>
        {!avecAscenseur && <span className="discret">Il remonte tes minerais (et toi) jusqu'au marché, sans échelle.</span>}
        <AmeliorationAscenseur etat={etat} jouer={jouer} />
      </div>
    </div>
  )
}
