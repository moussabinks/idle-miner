// La marche du mineur dans le village : il avance tant qu'on garde ← ou → appuyée,
// ou il marche tout seul jusqu'à un stand quand on clique dessus.
// C'est seulement de l'affichage (pas une règle du jeu) : ça reste côté React.

import { useCallback, useEffect, useRef, useState } from 'react'
import { LONGUEUR_VILLAGE, X_PUITS } from './composants/stands'

const VITESSE_MARCHE = 6 // tuiles par seconde

type Destination = { x: number; quandArrive?: () => void }

export function useMarcheVillage(actif: boolean) {
  const [x, setX] = useState(X_PUITS)
  const [versLaGauche, setVersLaGauche] = useState(false)
  const [enMarche, setEnMarche] = useState(false)

  // Des références, pour que la boucle d'animation lise toujours les bonnes valeurs.
  const xRef = useRef(X_PUITS)
  const sensRef = useRef(0) // -1 = gauche, +1 = droite, 0 = on ne tient pas de touche
  const destinationRef = useRef<Destination | null>(null)

  const changerX = useCallback((nouveau: number) => {
    xRef.current = Math.min(LONGUEUR_VILLAGE - 1, Math.max(0.5, nouveau))
    setX(xRef.current)
  }, [])

  // La boucle d'animation : à chaque image, on avance un peu.
  useEffect(() => {
    if (!actif) return
    let derniereFois = performance.now()
    let image = 0
    const avancer = (maintenant: number) => {
      const secondes = Math.min(0.1, (maintenant - derniereFois) / 1000)
      derniereFois = maintenant
      const pas = VITESSE_MARCHE * secondes
      const destination = destinationRef.current

      if (sensRef.current !== 0) {
        changerX(xRef.current + sensRef.current * pas)
        setEnMarche(true)
      } else if (destination !== null) {
        const ecart = destination.x - xRef.current
        if (Math.abs(ecart) <= pas) {
          changerX(destination.x)
          destinationRef.current = null
          setEnMarche(false)
          destination.quandArrive?.()
        } else {
          setVersLaGauche(ecart < 0)
          changerX(xRef.current + Math.sign(ecart) * pas)
          setEnMarche(true)
        }
      }
      image = requestAnimationFrame(avancer)
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [actif, changerX])

  // Commencer à marcher dans un sens (touche ou bouton appuyé).
  const commencer = useCallback((sens: number) => {
    destinationRef.current = null
    sensRef.current = sens
    setVersLaGauche(sens < 0)
  }, [])

  // On relâche la touche : il s'arrête.
  const arreter = useCallback(() => {
    sensRef.current = 0
    setEnMarche(false)
  }, [])

  // Marcher tout seul jusqu'à un endroit (et faire quelque chose en arrivant).
  const allerVers = useCallback((cible: number, quandArrive?: () => void) => {
    sensRef.current = 0
    if (Math.abs(cible - xRef.current) < 0.05) {
      quandArrive?.()
      return
    }
    destinationRef.current = { x: cible, quandArrive }
  }, [])

  // Placer le mineur directement (en sortant du puits, par exemple).
  const placer = useCallback(
    (nouveau: number) => {
      sensRef.current = 0
      destinationRef.current = null
      changerX(nouveau)
      setEnMarche(false)
    },
    [changerX],
  )

  return { x, versLaGauche, enMarche, commencer, arreter, allerVers, placer }
}
