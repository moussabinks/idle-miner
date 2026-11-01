// (01/11) L'heure qu'il est, relue toutes les « periodeMs » millisecondes : pour un compte à
// rebours (le prochain cadeau du jour), sans lire l'horloge pendant le dessin de React.

import { useEffect, useState } from 'react'

export function useMaintenant(periodeMs = 1000): Date {
  const [maintenant, setMaintenant] = useState(() => new Date())
  useEffect(() => {
    const minuteur = window.setInterval(() => setMaintenant(new Date()), periodeMs)
    return () => clearInterval(minuteur)
  }, [periodeMs])
  return maintenant
}
