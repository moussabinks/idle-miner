// Le nom d'un trajet de wagonnet, dans la langue du joueur : « Mine → Marché ».

import { BATIMENTS, LIAISONS, type IdLiaison } from '../jeu/donnees'
import { t } from '../jeu/langue'

export function nomTrajet(liaison: IdLiaison): string {
  const info = LIAISONS[liaison]
  return `${t(BATIMENTS[info.depart].nom)} → ${t(BATIMENTS[info.arrivee].nom)}`
}
