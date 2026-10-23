// Les confettis des fêtes (révélation d'une recrue, passage de niveau).

// Les confettis : une direction, une couleur et un délai chacun (tirés une fois, à l'ouverture).
type Confetti = { dx: number; dy: number; tour: number; delai: number; couleur: string; rond: boolean }

export function tirerConfettis(nombre: number, couleurs: string[]): Confetti[] {
  return Array.from({ length: nombre }, (_, i) => {
    // Répartis tout autour de la carte (avec un peu de hasard pour que ce soit vivant).
    const angle = (i / nombre) * Math.PI * 2 + Math.random() * 0.4
    const distance = 120 + ((i * 37) % 100) * 2.2 + Math.random() * 30
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance * 0.8 - 60),
      tour: Math.round((Math.random() - 0.5) * 1080),
      delai: Math.round(Math.random() * 180),
      couleur: couleurs[i % couleurs.length],
      rond: i % 3 === 0,
    }
  })
}
