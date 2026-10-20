// L'arbre de prestige : cinq branches de talents (mineur, marchand, ingénieur, patron,
// recrutement). À chaque prestige, on gagne 1 point et on choisit sa récompense. Il s'ouvre
// tout seul après un prestige, et on peut le rouvrir au bâtiment « Arbre de prestige » du village (ou
// avec l'étoile du bandeau). La branche Recrutement reste fermée tant qu'on n'a pas le recruteur.

import { useState } from 'react'
import { PRESTIGE_EMPLOYES, PRESTIGE_RECRUTEUR } from '../jeu/donnees'
import {
  aLeTalent,
  BRANCHES,
  brancheOuverte,
  choisirTalent,
  peutChoisirTalent,
  pointsDisponibles,
  TALENTS,
  type IdBranche,
  type IdTalent,
} from '../jeu/talents'
import type { EtatJeu } from '../jeu/mineur'
import type { Action } from '../usePartie'
import { Icone, type NomIcone } from './Icone'

const ICONES_BRANCHES: Record<IdBranche, NomIcone> = {
  mineur: 'forgeron',
  marchand: 'marche',
  ingenieur: 'foreuse',
  patron: 'employes',
  recrutement: 'recrutement',
}

type Props = {
  etat: EtatJeu
  jouer: (action: Action) => void
  onFermer: () => void
}

export function ArbrePrestige({ etat, jouer, onFermer }: Props) {
  // Le dernier talent choisi, pour le faire briller un instant.
  const [dernier, setDernier] = useState<IdTalent | null>(null)
  const points = pointsDisponibles(etat)

  function choisir(id: IdTalent) {
    jouer((e) => choisirTalent(e, id))
    setDernier(id)
  }

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-arbre">
      <div className="carte arbre-prestige">
        <h2 id="titre-arbre" className="titre-avec-icone">
          <Icone nom="etoile" taille={26} /> Arbre de prestige
        </h2>
        <p className={points > 0 ? 'points-arbre points-a-depenser' : 'points-arbre'}>
          {points > 0 ? `Choisis ta récompense : ${points} point${points > 1 ? 's' : ''} à dépenser` : 'Aucun point à dépenser'}
        </p>
        <p className="discret">
          Chaque prestige donne 1 point. Il faut le talent du dessus pour prendre celui du dessous. Les talents sont gardés pour toujours.
        </p>

        <div className="arbre">
          {BRANCHES.map((branche) => (
            <div key={branche.id} className={`branche branche-${branche.id} ${brancheOuverte(etat, branche.id) ? '' : 'branche-fermee'}`}>
              <h3 className="titre-avec-icone">
                <Icone nom={ICONES_BRANCHES[branche.id]} taille={20} /> {branche.nom}
              </h3>
              {!brancheOuverte(etat, branche.id) && (
                <span className="branche-verrou">
                  {branche.id === 'patron'
                    ? `🔒 S'ouvre avec les mineurs employés (prestige ${PRESTIGE_EMPLOYES}).`
                    : `🔒 S'ouvre quand tu embauches le recruteur (stand Personnel, prestige ${PRESTIGE_RECRUTEUR}).`}
                </span>
              )}
              {TALENTS.filter((t) => t.branche === branche.id).map((t) => {
                const pris = aLeTalent(etat, t.id)
                const possible = peutChoisirTalent(etat, t.id)
                const etatTalent = pris ? 'pris' : possible ? 'disponible' : 'verrouille'
                return (
                  <button
                    key={t.id}
                    className={`talent talent-${etatTalent} ${dernier === t.id ? 'talent-nouveau' : ''}`}
                    disabled={!possible}
                    onClick={() => choisir(t.id)}
                  >
                    <strong>{t.nom}</strong>
                    <span>{t.description}</span>
                    <em>{pris ? '✔ Débloqué' : possible ? 'Choisir (1 point)' : '🔒'}</em>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="boutons boutons-centre">
          <button className="bouton bouton-neutre" onClick={onFermer}>
            {points > 0 ? 'Plus tard' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  )
}
