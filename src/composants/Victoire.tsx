// L'écran de victoire, quand on atteint la bedrock.

import { BONUS_PRESTIGE, BONUS_VITESSE_PRESTIGE } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'

type Props = {
  etat: EtatJeu
  onPrestige: () => void
  onFermer: () => void
}

function formaterTemps(secondes: number): string {
  const minutes = Math.floor(secondes / 60)
  const reste = Math.round(secondes % 60)
  return `${minutes} min ${reste.toString().padStart(2, '0')} s`
}

export function Victoire({ etat, onPrestige, onFermer }: Props) {
  const bonusVente = Math.round((etat.prestige + 1) * BONUS_PRESTIGE * 100)
  const bonusVitesse = Math.round((etat.prestige + 1) * BONUS_VITESSE_PRESTIGE * 100)
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-victoire">
      <div className="carte victoire">
        <div className="victoire-trophee">🏆</div>
        <h2 id="titre-victoire">Bedrock atteinte !</h2>
        <p>Tu as creusé jusqu'à -128 m. Bravo, mineur !</p>
        <ul className="victoire-stats">
          <li>
            <strong>{etat.stats.blocsCasses.toLocaleString('fr-FR')}</strong> blocs cassés
          </li>
          <li>
            <strong>{etat.stats.argentGagne.toLocaleString('fr-FR')} $</strong> gagnés
          </li>
          <li>
            <strong>{formaterTemps(etat.stats.tempsMinage)}</strong> de minage
          </li>
          <li>
            <strong>{etat.stats.coffresOuverts}</strong> coffres ouverts
          </li>
        </ul>
        <p className="discret">
          Prestige : tu recommences à zéro, mais tes ventes rapportent +{bonusVente} % et tes pioches vont {bonusVitesse} % plus vite, et tu
          choisis une récompense dans l'arbre de prestige. Tu gardes tes succès, tes talents, l'ascenseur, la foreuse et tes mineurs. Tu peux aussi continuer à creuser ici pour tester tes enchantements, et passer prestige plus tard à l'entrée de la mine.
          {etat.prestige === 0 && ' Et au village, la barrière de la foreuse s’ouvre !'}
        </p>
        <div className="boutons boutons-centre">
          <button className="bouton bouton-prestige" onClick={onPrestige}>
            ⭐ Passer prestige {etat.prestige + 1}
          </button>
          <button className="bouton" onClick={onFermer}>
            Continuer à creuser
          </button>
        </div>
      </div>
    </div>
  )
}
