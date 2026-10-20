// Sur l'écran d'accueil : une petite carte pour installer le jeu comme une application
// (icône sur l'écran d'accueil du téléphone, plein écran, marche hors ligne).
// On peut la masquer avec « Plus tard » (réglage gardé dans le localStorage).

import { useState } from 'react'
import { useInstallation } from '../installation'

const CLE_MASQUEE = 'idle-miner-installation-masquee'

function lireMasquee(): boolean {
  try {
    return window.localStorage.getItem(CLE_MASQUEE) === 'oui'
  } catch {
    return false
  }
}

export function CarteInstallation() {
  const { mode, installer } = useInstallation()
  const [masquee, setMasquee] = useState(lireMasquee)

  if (masquee || mode === 'installe' || mode === 'rien') return null

  function masquer() {
    setMasquee(true)
    try {
      window.localStorage.setItem(CLE_MASQUEE, 'oui')
    } catch {
      // Tant pis : elle reviendra au prochain lancement.
    }
  }

  return (
    <section className="carte carte-installation">
      <img className="carte-installation-icone" src="/icones/icone-192.png" alt="" width={48} height={48} />
      <div className="carte-installation-texte">
        <strong>📲 Installe Idle Miner</strong>
        {mode === 'bouton' ? (
          <span className="discret">Une icône sur ton écran d'accueil, le jeu en plein écran, même sans réseau.</span>
        ) : (
          <span className="discret">
            Dans Safari, touche <strong>Partager</strong> (le carré avec une flèche ↑), puis <strong>Sur l'écran d'accueil</strong>.
          </span>
        )}
      </div>
      <div className="carte-installation-boutons">
        {mode === 'bouton' && (
          <button className="bouton bouton-petit bouton-acheter" onClick={() => void installer()}>
            Installer
          </button>
        )}
        <button className="lien" onClick={masquer}>
          Plus tard
        </button>
      </div>
    </section>
  )
}
