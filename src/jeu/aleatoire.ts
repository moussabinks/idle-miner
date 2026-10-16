// L'aléatoire du jeu passe toujours par une fonction de type `Aleatoire`.
// En jeu, c'est Math.random. Dans les tests, on donne un générateur avec une
// graine fixe : la partie est alors toujours la même (tests déterministes).

// Une fonction qui renvoie un nombre entre 0 (inclus) et 1 (exclu).
export type Aleatoire = () => number

export const aleatoireNavigateur: Aleatoire = () => Math.random()

// Générateur pseudo-aléatoire « mulberry32 » : avec la même graine,
// il donne toujours la même suite de nombres.
export function aleatoireAvecGraine(graine: number): Aleatoire {
  let etat = graine >>> 0
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Entier au hasard entre min et max (les deux inclus), comme randint en Python.
export function entierEntre(aleatoire: Aleatoire, min: number, max: number): number {
  return min + Math.floor(aleatoire() * (max - min + 1))
}

// Choisit un élément au hasard dans une liste.
export function choisir<T>(aleatoire: Aleatoire, liste: T[]): T {
  return liste[Math.floor(aleatoire() * liste.length)]
}

// Choisit un élément au hasard selon des poids : un poids 2 sort deux fois plus souvent qu'un poids 1.
export function choisirPondere<T>(aleatoire: Aleatoire, choix: { valeur: T; poids: number }[]): T {
  const total = choix.reduce((somme, c) => somme + c.poids, 0)
  let tirage = aleatoire() * total
  for (const c of choix) {
    tirage -= c.poids
    if (tirage < 0) return c.valeur
  }
  return choix[choix.length - 1].valeur
}
