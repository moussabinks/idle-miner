// Les stands du village, à la surface, de gauche à droite (le puits est tout à droite).

export type IdStand = 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'atelier' | 'puits'

export type Stand = { id: IdStand; nom: string; emoji: string; description: string }

export const STANDS: Stand[] = [
  { id: 'marche', nom: 'Marché', emoji: '💰', description: 'Vends tes blocs et minerais.' },
  { id: 'forgeron', nom: 'Forgeron', emoji: '⚒️', description: 'Achète et répare tes pioches.' },
  { id: 'bazar', nom: 'Bazar', emoji: '🎒', description: "Sacs à dos, seaux d'eau et torches." },
  { id: 'enchanteur', nom: 'Enchanteur', emoji: '✨', description: 'Enchante tes pioches avec lapis et émeraudes.' },
  { id: 'atelier', nom: 'Atelier', emoji: '🛗', description: "Construis l'ascenseur automatique avec de la redstone." },
  { id: 'puits', nom: 'Puits', emoji: '🪜', description: "L'échelle qui descend dans la mine." },
]

export const POSITION_PUITS = STANDS.length - 1
