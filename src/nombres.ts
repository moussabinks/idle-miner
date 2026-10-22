// « 950 », « 1,2 k », « 12 k », « 3,2 M » : un nombre en court, pour les petits badges et jauges.
export function nombreAbrege(n: number): string {
  if (n < 1000) return String(Math.floor(n))
  if (n < 10_000) return `${(Math.floor(n / 100) / 10).toLocaleString('fr-FR')} k`
  if (n < 1_000_000) return `${Math.floor(n / 1000)} k`
  return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`
}
