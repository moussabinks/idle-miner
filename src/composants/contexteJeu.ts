// Ce que tous les composants du jeu peuvent lire sans le recevoir en paramètre (25/10) : la
// partie, « jouer » (faire une action), et « regarderPub » (montrer une publicité, puis dire si
// elle a été regardée jusqu'au bout). C'est le « contexte » de React.

import { createContext, useContext } from 'react'
import type { EtatJeu } from '../jeu/mineur'
import type { Action } from '../usePartie'

export type ContexteJeu = {
  etat: EtatJeu
  jouer: (action: Action) => EtatJeu
  // Montre une publicité (pour l'instant une fausse : un écran noir de 30 s). « quandFinie » est
  // appelé seulement si le joueur l'a regardée jusqu'au bout.
  regarderPub: (quandFinie: () => void) => void
  ouvrirBoutique: () => void
}

export const ContexteJeuReact = createContext<ContexteJeu | null>(null)

export function useJeu(): ContexteJeu {
  const contexte = useContext(ContexteJeuReact)
  if (!contexte) throw new Error('useJeu : il manque <ContexteJeuReact.Provider> autour du jeu')
  return contexte
}
