// Les réglages (25/10) : une fenêtre (le bouton ⚙️ en haut à droite). Le monde en cours, le son,
// la musique, la langue, l'aide, changer de monde, et recommencer à zéro (avec confirmation).

import { useState } from 'react'
import { basculerMusique, musiqueActive } from '../ambiance'
import { LANGUES, NOMS_LANGUES, langue, t, type Langue } from '../jeu/langue'
import { choisirLangue } from '../langueNavigateur'
import { basculerSon, sonActif } from '../sons'
import { Confirmation } from './Confirmation'
import { Fenetre } from './Fenetre'
import { Drapeau } from './Drapeau'

type Props = {
  nomMonde: string
  onFermer: () => void
  onChangerDeMonde: () => void
  onRecommencer: () => void
  onAide: () => void
  onLangue: (langue: Langue) => void // pour redessiner tout le jeu dans la nouvelle langue
}

export function Reglages({ nomMonde, onFermer, onChangerDeMonde, onRecommencer, onAide, onLangue }: Props) {
  const [son, setSon] = useState(sonActif)
  const [musique, setMusique] = useState(musiqueActive)
  const [confirmer, setConfirmer] = useState(false)
  return (
    <Fenetre titre={t('Réglages')} icone="⚙️" couleur="bleu" taille="petite" onFermer={onFermer}>
      <p className="reglages-monde">
        🌍 <strong>{nomMonde}</strong>
      </p>
      <div className="reglages-liste">
        <button className="btn btn-blanc btn-large" onClick={() => setSon(basculerSon())}>
          {son ? `🔊 ${t('Son : oui')}` : `🔇 ${t('Son : non')}`}
        </button>
        <button className="btn btn-blanc btn-large" onClick={() => setMusique(basculerMusique())}>
          {musique ? `🎵 ${t('Musique : oui')}` : `🎵 ${t('Musique : non')}`}
        </button>
        <div className="reglages-langues" role="group" aria-label={t('Langue')}>
          {LANGUES.map((l) => (
            <button
              key={l}
              className={`btn btn-petit ${langue() === l ? 'btn-jaune' : 'btn-blanc'}`}
              onClick={() => {
                choisirLangue(l)
                onLangue(l)
              }}
            >
              <Drapeau langue={l} /> {NOMS_LANGUES[l]}
            </button>
          ))}
        </div>
        <button className="btn btn-bleu btn-large" onClick={onAide}>
          ❔ {t('Comment jouer')}
        </button>
        <button className="btn btn-bleu btn-large" onClick={onChangerDeMonde}>
          🌍 {t('Changer de monde')}
        </button>
        <button className="btn btn-rose btn-large" onClick={() => setConfirmer(true)}>
          🔄 {t('Recommencer à zéro')}
        </button>
      </div>
      {confirmer && (
        <Confirmation
          titre={t('Recommencer à zéro ?')}
          danger
          texteConfirmer={t('Tout effacer')}
          onAnnuler={() => setConfirmer(false)}
          onConfirmer={() => {
            setConfirmer(false)
            onRecommencer()
          }}
        >
          {t('La partie du monde « {nom} » sera effacée (village et succès compris). Impossible de revenir en arrière.', { nom: nomMonde })}
        </Confirmation>
      )}
    </Fenetre>
  )
}
