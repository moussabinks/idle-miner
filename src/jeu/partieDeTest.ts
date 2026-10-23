// Pour les tests (29/10) : une nouvelle partie où le joueur est déjà au niveau maximum, pour
// tester une règle sans être gêné par les niveaux à débloquer (ceux-là sont testés dans
// niveaux.test.ts).

import type { Aleatoire } from './aleatoire'
import { NIVEAU_JOUEUR_MAX } from './donnees'
import { creerPartie, type EtatJeu } from './mineur'
import { xpTotalePourNiveau } from './niveaux'

export function partieDeTest(aleatoire: Aleatoire): EtatJeu {
  const etat = creerPartie(aleatoire)
  etat.xp = xpTotalePourNiveau(NIVEAU_JOUEUR_MAX)
  etat.argent = 0 // (sans l'argent de poche du départ : les tests comptent depuis 0 $)
  return etat
}
