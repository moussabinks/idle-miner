// Les publicités que le jeu propose (27/10, demandé par le propriétaire). Toujours au choix :
// jamais pour débloquer la progression.
//   - PropositionPub : juste après une amélioration payée en gemmes, une fenêtre propose une
//     publicité ; regardée jusqu'au bout, la prochaine amélioration est offerte, au choix du joueur
//     (les boutons violets deviennent « 🎁 Offert », voir Amelioration.tsx) ;
//   - BoutonPubVentes : un gros rond violet, toujours en bas de l'écran à côté de la mine : une
//     publicité = les ventes doublées pendant 10 minutes (il montre le temps qui reste).
// Les règles sont dans src/jeu/mineur.ts (offrirAmelioration) et src/jeu/gemmes.ts.

import { MINUTES_VENTES_PUB, peutRegarderPubVentes, recompenserPubVentes, secondesBoost } from '../jeu/gemmes'
import { t } from '../jeu/langue'
import { offrirAmelioration, refuserPropositionPub } from '../jeu/mineur'
import { minutesSecondes } from '../nombres'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'

export function PropositionPub() {
  const { jouer, regarderPub } = useJeu()
  const refuser = () => jouer(refuserPropositionPub)
  return (
    <Fenetre
      titre={t('Une amélioration offerte ?')}
      icone="🎁"
      couleur="violet"
      taille="petite"
      devant
      onFermer={refuser}
      pied={
        <>
          <button className="btn btn-blanc" onClick={refuser}>
            {t('Non merci')}
          </button>
          <button className="btn btn-violet" onClick={() => regarderPub(() => jouer(offrirAmelioration))} autoFocus>
            ▶ {t('Regarder une pub')}
          </button>
        </>
      }
    >
      <div className="proposition-pub">
        <span className="proposition-pub-icone" aria-hidden="true">
          🎁
        </span>
        <p>{t('Regarde une publicité, et ta prochaine amélioration est gratuite : celle que tu veux !')}</p>
      </div>
    </Fenetre>
  )
}

export function BoutonPubVentes() {
  const { etat, jouer, regarderPub } = useJeu()
  const libre = peutRegarderPubVentes(etat)
  const reste = secondesBoost(etat, 'ventes')
  return (
    <button
      className={`gros-rond gros-rond-petit gros-rond-pub ${libre ? 'btn-attention' : 'gros-rond-pub-actif'}`}
      disabled={!libre}
      onClick={() => regarderPub(() => jouer(recompenserPubVentes))}
      aria-label={libre ? t('Regarder une pub : ventes × 2 pendant {minutes} min', { minutes: MINUTES_VENTES_PUB }) : t('Ventes × 2 : encore {temps}', { temps: minutesSecondes(reste) })}
    >
      <span className="gros-rond-icone" aria-hidden="true">
        💰
      </span>
      {libre && (
        <span className="gros-rond-pub-video" aria-hidden="true">
          ▶
        </span>
      )}
      <span className="gros-rond-texte">{libre ? t('Ventes × 2') : minutesSecondes(reste)}</span>
    </button>
  )
}
