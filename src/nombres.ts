import { nombre } from './jeu/langue'

// « 950 », « 1,2 k », « 12 k », « 3,2 M » : un nombre en court, pour les petits badges et jauges.
// (25/10 : écrit à la façon de la langue du joueur : « 1,2 k » en français, « 1.2k » en anglais)
export function nombreAbrege(n: number): string {
  if (n < 1000) return nombre(Math.floor(n))
  if (n < 10_000) return `${nombre(Math.floor(n / 100) / 10, 1)} k`
  if (n < 1_000_000) return `${nombre(Math.floor(n / 1000))} k`
  if (n < 1_000_000_000) return `${nombre(n / 1_000_000, 1)} M`
  return `${nombre(n / 1_000_000_000, 1)} Md`
}

// « 4:05 » : un temps en minutes et secondes.
export function minutesSecondes(secondes: number): string {
  const s = Math.max(0, Math.ceil(secondes))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
