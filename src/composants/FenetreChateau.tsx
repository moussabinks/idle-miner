// La fenêtre du château (27/10), quand on le touche au fond de la carte.
//   - En ruine : son histoire, ce qu'il coûte (20 millions), une jauge de l'argent qu'on a, et le
//     gros bouton jaune « Restaurer le château ».
//   - Restauré (et juste après la restauration, « victoire ») : bravo, tu as fini Mega Digger !
//     Le temps qu'il a fallu, et de quoi revoir le feu d'artifice.

import { PRIX_CHATEAU } from '../jeu/donnees'
import { chateauRestaure, peutRestaurerChateau } from '../jeu/chateau'
import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { nombreAbrege } from '../nombres'
import { IMAGE_CHATEAU_NEUF, IMAGE_CHATEAU_RUINE } from './chateau'
import { Fenetre } from './Fenetre'

type Props = {
  etat: EtatJeu
  victoire: boolean // juste après la restauration : la fenêtre de la victoire
  onRestaurer: () => void
  onFeuArtifice: () => void
  onFermer: () => void
}

// « 3 h 12 », « 45 min » : le temps de jeu qu'il a fallu.
function dureeLisible(secondes: number): string {
  const heures = Math.floor(secondes / 3600)
  const minutes = Math.floor((secondes % 3600) / 60)
  return heures > 0 ? t('{h} h {min}', { h: heures, min: String(minutes).padStart(2, '0') }) : t('{n} min', { n: Math.max(1, minutes) })
}

export function FenetreChateau({ etat, victoire, onRestaurer, onFeuArtifice, onFermer }: Props) {
  const restaure = chateauRestaure(etat)
  const part = Math.min(1, etat.argent / PRIX_CHATEAU)
  if (restaure) {
    return (
      <Fenetre
        titre={victoire ? t('Bravo, châtelain !') : t('Ton château')}
        icone="🏰"
        couleur="violet"
        onFermer={onFermer}
        classe="fenetre-chateau"
        pied={
          <div className="rangee rangee-centre">
            <button className="btn btn-bleu" onClick={onFeuArtifice}>
              ✨ {t('Feu d’artifice')}
            </button>
            <button className="btn btn-jaune" onClick={onFermer}>
              {victoire ? t('Continuer à jouer') : t('Fermer')}
            </button>
          </div>
        }
      >
        <img className="chateau-vignette" src={IMAGE_CHATEAU_NEUF} alt="" />
        <p className="chateau-texte">
          <strong>{victoire ? t('Le château est restauré : tu as fini Mega Digger !') : t('Le château brille de mille feux au-dessus de la vallée.')}</strong>
        </p>
        {etat.chateau && <p className="discret chateau-texte">⏱️ {t('Restauré après {duree} de jeu.', { duree: dureeLisible(etat.chateau.tempsDeJeu) })}</p>}
        {victoire && <p className="discret chateau-texte">{t('Ta mine continue de tourner : tu peux encore gagner de l’argent et monter au classement.')}</p>}
      </Fenetre>
    )
  }
  const peut = peutRestaurerChateau(etat)
  return (
    <Fenetre titre={t('Le château en ruine')} icone="🏰" couleur="violet" onFermer={onFermer} classe="fenetre-chateau">
      <img className="chateau-vignette" src={IMAGE_CHATEAU_RUINE} alt="" />
      <p className="chateau-texte">{t('Un vieux château en ruine domine la vallée, entre les montagnes. Restaure-le pour devenir le maître des lieux : c’est la quête finale de Mega Digger !')}</p>
      <div className="chateau-prix">
        <span className="jauge jauge-texte jauge-jaune">
          <i style={{ width: `${part * 100}%` }} />
          <span>
            💵 {nombreAbrege(Math.floor(etat.argent))} / {nombreAbrege(PRIX_CHATEAU)} $
          </span>
        </span>
      </div>
      <button className="btn btn-jaune btn-large chateau-restaurer" disabled={!peut} onClick={onRestaurer}>
        🏰 {t('Restaurer le château')} · {nombreAbrege(PRIX_CHATEAU)} $
      </button>
      {!peut && <p className="discret chateau-texte">{t('Il te manque {argent} $.', { argent: nombreAbrege(Math.ceil(PRIX_CHATEAU - etat.argent)) })}</p>}
    </Fenetre>
  )
}
