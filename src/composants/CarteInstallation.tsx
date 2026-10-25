// Sur l'écran d'accueil : une petite carte pour installer le jeu comme une application
// (icône sur l'écran d'accueil du téléphone, plein écran, marche hors ligne).
// On peut la masquer avec « Plus tard » (réglage gardé dans le stockage du navigateur).
// Pas dans la version portail (AVEC_INSTALLATION, src/portail.ts) : c'est l'accueil qui décide.

import { useState } from 'react'
import { t } from '../jeu/langue'
import { useInstallation } from '../installation'
import { ecrireReglage, lireReglage } from '../stockage'

const CLE_MASQUEE = 'idle-miner-installation-masquee'

export function CarteInstallation() {
  const { mode, installer } = useInstallation()
  const [masquee, setMasquee] = useState(() => lireReglage(CLE_MASQUEE) === 'oui')

  if (masquee || mode === 'installe' || mode === 'rien') return null

  function masquer() {
    setMasquee(true)
    ecrireReglage(CLE_MASQUEE, 'oui')
  }

  return (
    <div className="carte installation">
      <img className="installation-icone" src="/icones/icone-192.png" alt="" width={44} height={44} />
      <div className="installation-texte">
        <strong>📲 {t('Installe Mega Digger')}</strong>
        {mode === 'bouton' ? (
          <span className="discret">{t('Une icône sur ton écran d’accueil, même sans réseau.')}</span>
        ) : (
          <span className="discret">{t('Dans Safari : Partager (le carré avec une flèche ↑), puis « Sur l’écran d’accueil ».')}</span>
        )}
      </div>
      <div className="installation-boutons">
        {mode === 'bouton' && (
          <button className="btn btn-vert btn-petit" onClick={() => void installer()}>
            {t('Installer')}
          </button>
        )}
        <button className="btn btn-blanc btn-petit" onClick={masquer}>
          {t('Plus tard')}
        </button>
      </div>
    </div>
  )
}
