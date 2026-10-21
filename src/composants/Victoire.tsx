// L'écran de victoire, quand on atteint la bedrock.

import { peutPasserPrestige } from '../jeu/conditionsPrestige'
import { profondeurBedrock } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { CartePrestige } from './CartePrestige'

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
  const pret = peutPasserPrestige(etat)
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-victoire">
      <div className="carte victoire">
        <div className="victoire-trophee">🏆</div>
        <h2 id="titre-victoire">Bedrock atteinte !</h2>
        <p>Tu as creusé jusqu'à -{profondeurBedrock(etat.prestige)} m. Bravo, mineur ! Au prochain prestige, la mine descendra jusqu'à -{profondeurBedrock(etat.prestige + 1)} m.</p>
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
          Prestige : tu recommences à zéro, mais tu gardes tes succès, tes talents, tes pioches, ton sac, tes enchantements, l'ascenseur, la
          foreuse et ton personnel.
          {etat.prestige === 0 && ' Et tu pourras construire la foreuse au village (menu Bâtiments) !'}
          {pret
            ? ' Tu peux aussi continuer à creuser ici, et passer prestige plus tard au bâtiment Arbre de prestige du village.'
            : ' Avant, améliore au maximum ce que ce prestige permet (l’arbre de prestige du village te le rappelle) :'}
        </p>
        <CartePrestige etat={etat} onPrestige={onPrestige} compacte />
        <div className="boutons boutons-centre">
          <button className="bouton" onClick={onFermer}>
            {pret ? 'Continuer à creuser' : 'Je m’en occupe !'}
          </button>
        </div>
      </div>
    </div>
  )
}
