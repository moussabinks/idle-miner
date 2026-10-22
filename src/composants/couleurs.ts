// Éclaircir ou assombrir une couleur (pour le relief des dessins, voir Relief.tsx).

// Une couleur « #rrggbb » éclaircie (facteur > 1) ou assombrie (facteur < 1).
export function nuance(couleur: string, facteur: number): string {
  const n = parseInt(couleur.slice(1), 16)
  const canal = (decalage: number) => Math.max(0, Math.min(255, Math.round(((n >> decalage) & 255) * facteur)))
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}
