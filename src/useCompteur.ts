// Un nombre qui « défile » jusqu'à sa nouvelle valeur au lieu de sauter d'un coup
// (le compteur d'argent après une vente) : c'est plus satisfaisant à regarder.
// Ce n'est que de l'affichage : la vraie valeur reste celle du jeu.

import { useEffect, useRef, useState } from 'react'

const DUREE_DEFILEMENT = 600 // millisecondes

export function useCompteur(valeur: number): number {
  const [affiche, setAffiche] = useState(valeur)
  const depart = useRef({ valeur, temps: 0 })
  const afficheRef = useRef(valeur)

  useEffect(() => {
    // Les petits changements (quelques $ des mineurs) s'affichent tout de suite.
    if (Math.abs(valeur - afficheRef.current) < 5 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      afficheRef.current = valeur
      setAffiche(valeur)
      return
    }
    depart.current = { valeur: afficheRef.current, temps: performance.now() }
    let image = 0
    function avancer(maintenant: number) {
      const avancement = Math.min(1, (maintenant - depart.current.temps) / DUREE_DEFILEMENT)
      // Rapide au début, puis ralentit en arrivant (« ease-out »).
      const adouci = 1 - (1 - avancement) ** 3
      const nouveau = Math.round(depart.current.valeur + (valeur - depart.current.valeur) * adouci)
      afficheRef.current = nouveau
      setAffiche(nouveau)
      if (avancement < 1) image = requestAnimationFrame(avancer)
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [valeur])

  return affiche
}
