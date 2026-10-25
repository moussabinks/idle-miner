// L'aide « Comment jouer » (25/10) : la boucle du jeu en 4 étapes, et les gestes de la carte.

import { t } from '../jeu/langue'
import { Fenetre } from './Fenetre'

export const ETAPES_DU_JEU = [
  { icone: '⛏️', titre: 'Creuse', texte: 'Clique sur le bloc de la mine. Tout va dans son coffre, que tu vends d’un clic.' },
  { icone: '👷', titre: 'Embauche', texte: 'Des mineurs creusent pour toi, même quand tu ne joues pas.' },
  { icone: '🛤️', titre: 'Automatise', texte: 'Des rails jusqu’au marché : le wagonnet vend tout seul.' },
  { icone: '💎', titre: 'Descends', texte: 'Chaque niveau de la mine débloque le niveau suivant de tout le reste.' },
]

export function Aide({ onFermer }: { onFermer: () => void }) {
  return (
    <Fenetre titre={t('Comment jouer')} icone="❔" couleur="bleu" onFermer={onFermer}>
      <ol className="aide-etapes">
        {ETAPES_DU_JEU.map((e, i) => (
          <li key={e.titre} className="carte">
            <span className="aide-numero">{i + 1}</span>
            <span className="aide-icone" aria-hidden="true">
              {e.icone}
            </span>
            <span>
              <strong>{t(e.titre)}</strong>
              <span className="discret"> · {t(e.texte)}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="discret">{t('Touche un bâtiment pour l’ouvrir. Fais glisser la carte pour la déplacer, pince ou utilise la molette pour zoomer.')}</p>
      <p className="discret">{t('Au clavier : les flèches pour marcher, Espace pour sauter, Échap pour fermer une fenêtre.')}</p>
    </Fenetre>
  )
}
