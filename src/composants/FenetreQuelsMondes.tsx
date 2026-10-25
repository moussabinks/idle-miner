// La question posée à la connexion quand le compte et ce navigateur ont des mondes différents :
// lesquels garder ? (Voir useCompte.ts.) Il faut choisir : pas de ✖ ni de clic à côté.

import { t } from '../jeu/langue'
import type { QuestionMondes } from '../useCompte'
import { Fenetre } from './Fenetre'

export function FenetreQuelsMondes({ question }: { question: QuestionMondes }) {
  const date = new Date(question.envoyeeLe).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  return (
    <Fenetre
      titre={t('Quels mondes garder ?')}
      icone="☁️"
      couleur="bleu"
      taille="petite"
      devant
      fermable={false}
      onFermer={() => question.repondre(false)}
      pied={
        <>
          <button className="btn btn-blanc" onClick={() => question.repondre(false)}>
            📲 {t('Garder ceux d’ici')}
          </button>
          <button className="btn btn-jaune" onClick={() => question.repondre(true)} autoFocus>
            ☁️ {t('Prendre ceux du compte')}
          </button>
        </>
      }
    >
      <p>{t('Ton compte a déjà {n} monde(s) en ligne, sauvegardé(s) le {date}, et ce navigateur a d’autres mondes.', { n: question.nombre, date })}</p>
      <p className="discret">{t('Ceux que tu ne gardes pas seront remplacés.')}</p>
    </Fenetre>
  )
}
