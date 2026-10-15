// Données du jeu : pioches et formule de minage.
// Les valeurs viennent de docs/idle_miner_v1.md (version notebook Python).

export type Pioche = {
  niveau: number
  nom: string
  vitesse: number
  profMax: number // profondeur max en mètres (valeur positive)
  durabilite: number
  prix: number
}

export const PIOCHES: Pioche[] = [
  { niveau: 0, nom: 'Bois', vitesse: 2, profMax: 15, durabilite: 60, prix: 5 },
  { niveau: 1, nom: 'Pierre', vitesse: 4, profMax: 30, durabilite: 160, prix: 40 },
  { niveau: 2, nom: 'Fer', vitesse: 6, profMax: 48, durabilite: 250, prix: 300 },
  { niveau: 3, nom: 'Diamant', vitesse: 8, profMax: 60, durabilite: 500, prix: 2000 },
  { niveau: 4, nom: 'Netherite', vitesse: 9, profMax: 64, durabilite: 800, prix: 3000 },
]

export const VITESSE_JEU = 0.45

// Durée (en secondes) pour casser un bloc.
export function dureeCasse(durete: number, profondeur: number, vitesse: number): number {
  const malusProfondeur = profondeur > 40 ? 1.5 : 1
  return ((durete * malusProfondeur) / vitesse) * VITESSE_JEU
}
