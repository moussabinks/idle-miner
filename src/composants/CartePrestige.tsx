// La carte du prestige, à l'entrée de la mine (et sur l'écran de victoire) : ce qu'il reste
// à faire avant de pouvoir passer prestige, avec une jauge qui se remplit.
// Les règles sont dans src/jeu/conditionsPrestige.ts.

import { BONUS_PRESTIGE, BONUS_VITESSE_PRESTIGE, profondeurBedrock } from '../jeu/donnees'
import { conditionsPrestige } from '../jeu/conditionsPrestige'
import type { EtatJeu } from '../jeu/mineur'

type Props = {
  etat: EtatJeu
  onPrestige: () => void
  compacte?: boolean // sur l'écran de victoire : seulement ce qui manque
}

export function CartePrestige({ etat, onPrestige, compacte = false }: Props) {
  const conditions = conditionsPrestige(etat)
  const faites = conditions.filter((c) => c.faite).length
  const pret = faites === conditions.length
  const montrees = compacte ? conditions.filter((c) => !c.faite) : conditions

  return (
    <div className={`ligne-achat carte-prestige ${pret ? 'carte-prestige-prete' : ''}`}>
      <div className="ligne-titre">
        <strong>⭐ Prestige {etat.prestige + 1}</strong>
        <span className={`badge ${pret ? 'badge-vert' : ''}`}>{pret ? 'Prêt !' : `${faites}/${conditions.length}`}</span>
      </div>
      <div className="jauge-prestige" role="meter" aria-valuenow={faites} aria-valuemin={0} aria-valuemax={conditions.length}>
        <div className="jauge-prestige-remplie" style={{ width: `${(faites / conditions.length) * 100}%` }} />
        <span className="jauge-prestige-texte">
          Prêt pour le prestige : {faites}/{conditions.length}
        </span>
      </div>
      {montrees.length > 0 && (
        <ul className="liste-conditions">
          {montrees.map((c) => (
            <li key={c.id} className={c.faite ? 'condition-faite' : ''}>
              <span className="condition-marque" aria-hidden="true">
                {c.faite ? '✔' : '✗'}
              </span>
              <span className="condition-texte">{c.texte}</span>
              <span className="condition-avance">{c.avance}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="discret">
        {pret
          ? `Tout est au maximum ! Au prestige ${etat.prestige + 1}, la mine descend jusqu'à -${profondeurBedrock(etat.prestige + 1)} m, tes ventes rapportent +${Math.round((etat.prestige + 1) * BONUS_PRESTIGE * 100)} %, tes pioches vont ${Math.round((etat.prestige + 1) * BONUS_VITESSE_PRESTIGE * 100)} % plus vite, et tu gagnes un point dans l'arbre de prestige.`
          : 'Pour passer prestige : atteins la bedrock, et améliore au maximum tout ce que ce prestige permet (les niveaux 🔒 attendront le prochain).'}
      </span>
      <button className="bouton bouton-prestige" disabled={!pret} onClick={onPrestige}>
        ⭐ Passer prestige {etat.prestige + 1}
      </button>
    </div>
  )
}
