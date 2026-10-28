// La fenêtre du jeu (25/10) : la même partout (bâtiments, succès, statistiques, boutique...).
//   - un voile derrière (sombre, ou presque transparent pour les bâtiments : on voit le village) ;
//   - un bandeau de couleur en haut avec l'icône et le titre, et le bouton ✖ rond ;
//   - Échap ou un clic à côté la ferment (sauf si « fermable » est faux) ;
//   - « pied » : les boutons du bas (« Continuer », « Annuler »...).
// Sur téléphone, elle monte du bas de l'écran (voir src/styles/theme.css).
// (28/10) Quand son contenu défile, une barre de défilement bien visible est dessinée à droite
// (les téléphones n'en montrent pas, ou seulement pendant qu'on fait défiler) : on voit qu'il y a
// encore des choses plus bas, et on peut la faire glisser du doigt.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { t } from '../jeu/langue'

export type CouleurFenetre = 'vert' | 'jaune' | 'bleu' | 'rose' | 'violet' | 'orange' | 'creme'

type Props = {
  titre: ReactNode
  icone?: string
  couleur?: CouleurFenetre
  taille?: 'petite' | 'moyenne' | 'grande'
  voile?: 'sombre' | 'clair'
  devant?: boolean // au-dessus de tout (pendant le tutoriel, une confirmation...)
  fermable?: boolean // false : pas de ✖, ni Échap, ni clic à côté (il faut choisir en bas)
  onFermer: () => void
  pied?: ReactNode
  classe?: string // une classe de plus sur la fenêtre (pour placer son contenu)
  children: ReactNode
}

// La barre de défilement : sa poignée (en % de la hauteur de la zone qui défile), ou null quand
// tout tient sans défiler.
type Poignee = { haut: number; hauteur: number }

function useBarreDefilement(corps: React.RefObject<HTMLDivElement | null>): Poignee | null {
  const [poignee, setPoignee] = useState<Poignee | null>(null)
  useEffect(() => {
    const zone = corps.current
    if (!zone) return
    let image = 0
    const mesurer = () => {
      image = 0
      const { scrollTop, scrollHeight, clientHeight } = zone
      if (scrollHeight <= clientHeight + 2) {
        setPoignee((avant) => (avant === null ? avant : null))
        return
      }
      const hauteur = Math.max(12, (clientHeight / scrollHeight) * 100)
      const haut = (scrollTop / (scrollHeight - clientHeight)) * (100 - hauteur)
      setPoignee((avant) => (avant && Math.abs(avant.haut - haut) < 0.2 && Math.abs(avant.hauteur - hauteur) < 0.2 ? avant : { haut, hauteur }))
    }
    // (au plus une mesure par image, même si on défile très vite)
    const bientot = () => {
      if (image === 0) image = requestAnimationFrame(mesurer)
    }
    mesurer()
    zone.addEventListener('scroll', bientot, { passive: true })
    // Le contenu change (un onglet, une carte qui s'ouvre) ou la fenêtre change de taille.
    const taille = new ResizeObserver(bientot)
    taille.observe(zone)
    const contenu = new MutationObserver(bientot)
    contenu.observe(zone, { childList: true, subtree: true })
    return () => {
      zone.removeEventListener('scroll', bientot)
      taille.disconnect()
      contenu.disconnect()
      cancelAnimationFrame(image)
    }
  }, [corps])
  return poignee
}

// Faire défiler la zone en faisant glisser le doigt (ou la souris) sur la barre : le haut de la
// barre = le haut du contenu, le bas de la barre = la fin.
function glisserSurLaBarre(evenement: React.PointerEvent<HTMLDivElement>, zone: HTMLDivElement | null) {
  if (!zone) return
  const barre = evenement.currentTarget
  evenement.preventDefault()
  evenement.stopPropagation()
  barre.setPointerCapture(evenement.pointerId)
  const allerA = (y: number) => {
    const r = barre.getBoundingClientRect()
    const part = Math.min(1, Math.max(0, (y - r.top) / Math.max(1, r.height)))
    zone.scrollTop = part * (zone.scrollHeight - zone.clientHeight)
  }
  allerA(evenement.clientY)
  const bouger = (e: PointerEvent) => allerA(e.clientY)
  const lacher = () => {
    barre.removeEventListener('pointermove', bouger)
    barre.removeEventListener('pointerup', lacher)
    barre.removeEventListener('pointercancel', lacher)
  }
  barre.addEventListener('pointermove', bouger)
  barre.addEventListener('pointerup', lacher)
  barre.addEventListener('pointercancel', lacher)
}

export function Fenetre({ titre, icone, couleur = 'vert', taille = 'moyenne', voile = 'sombre', devant = false, fermable = true, onFermer, pied, classe = '', children }: Props) {
  const idTitre = useId()
  const voileRef = useRef<HTMLDivElement>(null)
  const corpsRef = useRef<HTMLDivElement>(null)
  const poignee = useBarreDefilement(corpsRef)

  // Échap ferme la fenêtre... seulement celle du dessus (25/10 : avec une fenêtre ouverte sur une
  // autre, Échap les fermait toutes les deux).
  useEffect(() => {
    if (!fermable) return
    function touche(evenement: KeyboardEvent) {
      if (evenement.key !== 'Escape') return
      const voiles = [...document.querySelectorAll('.voile')]
      const dessus = voiles.reduce<Element | null>((haut, v) => (haut === null || Number(getComputedStyle(v).zIndex) >= Number(getComputedStyle(haut).zIndex) ? v : haut), null)
      if (dessus === voileRef.current) onFermer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [fermable, onFermer])

  return (
    <div
      ref={voileRef}
      className={`voile ${voile === 'clair' ? 'voile-clair' : ''} ${devant ? 'voile-devant' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      onClick={fermable ? onFermer : undefined}
    >
      <div className={`fenetre ${taille === 'moyenne' ? '' : `fenetre-${taille}`} ${classe}`} onClick={(e) => e.stopPropagation()}>
        <header className={`fenetre-entete ${couleur === 'vert' ? '' : `fenetre-entete-${couleur}`}`}>
          {icone && (
            <span className="fenetre-icone" aria-hidden="true">
              {icone}
            </span>
          )}
          <h2 id={idTitre}>{titre}</h2>
          {fermable && (
            <button className="btn btn-blanc btn-rond" onClick={onFermer} aria-label={t('Fermer')} data-tuto="fermer-fenetre">
              ✖
            </button>
          )}
        </header>
        <div className="fenetre-milieu">
          <div ref={corpsRef} className="fenetre-corps">
            {children}
          </div>
          {poignee && (
            <div className="fenetre-defilement" aria-hidden="true" onPointerDown={(e) => glisserSurLaBarre(e, corpsRef.current)}>
              <i style={{ top: `${poignee.haut}%`, height: `${poignee.hauteur}%` }} />
            </div>
          )}
        </div>
        {pied && <footer className="fenetre-pied">{pied}</footer>}
      </div>
    </div>
  )
}
