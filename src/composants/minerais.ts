// Quels minerais dessiner pour un chargement (Wagonnet3D.tsx et la caisse de l'ascenseur).

import type { IdBloc } from '../jeu/donnees'

// Les minerais à dessiner dans un wagonnet (ou la caisse de l'ascenseur), à partir de ce qu'il porte : chaque sorte en proportion,
// mélangées (une liste de 24 places, toujours dans le même ordre).
export function minerais(contenu: Partial<Record<IdBloc, number>>): IdBloc[] {
  const sortes = (Object.entries(contenu) as [IdBloc, number][]).filter(([, n]) => n > 0)
  const total = sortes.reduce((t, [, n]) => t + n, 0)
  if (total === 0) return []
  const liste: IdBloc[] = []
  for (const [bloc, n] of sortes) for (let k = 0; k < Math.max(1, Math.round((n / total) * 24)); k++) liste.push(bloc)
  // Un mélange toujours pareil : on prend une place sur sept, en tournant.
  const melange: IdBloc[] = []
  for (let i = 0; i < liste.length; i++) melange.push(liste[(i * 7) % liste.length])
  return melange
}
