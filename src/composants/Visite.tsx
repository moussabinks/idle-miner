// La visite du village d'un autre joueur (26/10), depuis le bouton « Visiter » du classement.
// On s'y promène (toucher le sol, ou les flèches du clavier), on regarde ses taupes travailler,
// mais on ne peut rien ouvrir ni rien toucher : ni bulle, ni message, ni fenêtre de bâtiment.
// Le temps y passe pour l'animation seulement (src/jeu/visite.ts) : rien n'est sauvegardé.

import { useEffect, useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { niveauJoueur } from '../jeu/niveaux'
import { avancerVisite } from '../jeu/visite'
import { useJoueurVillage, type DirectionFleche } from '../useJoueurVillage'
import { VueVillage } from './VueVillage'

const FLECHES: Record<string, DirectionFleche> = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }
const INTERVALLE_HORLOGE = 50 // ms entre deux « tics » (comme dans usePartie)

type Props = {
  pseudo: string
  partie: EtatJeu // déjà préparée par preparerVisite
  onRentrer: () => void
}

export function Visite({ pseudo, partie, onRentrer }: Props) {
  const [etat, setEtat] = useState(partie)
  const village = useJoueurVillage(etat.village, true)

  // L'horloge : le village vit (sur une copie, à chaque tic).
  useEffect(() => {
    let derniereFois = performance.now()
    const horloge = setInterval(() => {
      const maintenant = performance.now()
      const secondes = Math.min(1, (maintenant - derniereFois) / 1000)
      derniereFois = maintenant
      setEtat((ancien) => {
        const copie = structuredClone(ancien)
        avancerVisite(copie, secondes, aleatoireNavigateur)
        return copie
      })
    }, INTERVALLE_HORLOGE)
    return () => clearInterval(horloge)
  }, [])

  // Le clavier : les flèches pour marcher, Espace pour sauter, Échap pour rentrer.
  useEffect(() => {
    function toucheAppuyee(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') {
        onRentrer()
        return
      }
      if (evenement.key === ' ') {
        evenement.preventDefault()
        if (!evenement.repeat) village.sauter()
        return
      }
      const direction = FLECHES[evenement.key]
      if (!direction) return
      evenement.preventDefault()
      if (!evenement.repeat) village.fleche(direction, true)
    }
    function toucheRelachee(evenement: KeyboardEvent) {
      const direction = FLECHES[evenement.key]
      if (direction) village.fleche(direction, false)
    }
    const perdreFocus = () => village.arreterFleches()
    window.addEventListener('keydown', toucheAppuyee)
    window.addEventListener('keyup', toucheRelachee)
    window.addEventListener('blur', perdreFocus)
    return () => {
      window.removeEventListener('keydown', toucheAppuyee)
      window.removeEventListener('keyup', toucheRelachee)
      window.removeEventListener('blur', perdreFocus)
    }
  })

  return (
    <div className="jeu visite">
      <main className="scene">
        <VueVillage
          etat={etat}
          joueur={village.joueur}
          notifications={{}}
          batimentActif={null}
          fantome={null}
          fantomeLibre={false}
          fantomeFixe={false}
          pinceau={false}
          // On touche le sol (ou un bâtiment) : on y marche, sans rien ouvrir.
          onTap={(c) => village.allerVers(c)}
          onSurvol={() => {}}
          onGlisser={() => {}}
          onPeindre={() => {}}
          visite
        />
      </main>

      <div className="interface">
        <div className="interface-haut">
          <header className="hud">
            <div className="hud-ligne">
              <div className="hud-case">
                <span className="hud-icone" aria-hidden="true">
                  🏡
                </span>
                <span className="hud-valeurs">
                  <strong>{t('Le village de {pseudo}', { pseudo })}</strong>
                  <small>
                    ⭐ {t('Niveau {n}', { n: niveauJoueur(etat) })} · 🕳️ {t('Mine niveau {n}', { n: etat.niveauMine })}
                  </small>
                </span>
              </div>
            </div>
          </header>
        </div>
        <div className="interface-bas">
          <div className="barre-edition">
            <div className="rangee rangee-centre">
              <button className="btn btn-jaune" onClick={onRentrer}>
                🚶 {t('Rentrer')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
