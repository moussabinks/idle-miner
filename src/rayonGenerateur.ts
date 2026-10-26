// (26/10, demandé par le propriétaire) « Afficher le rayon » : une case à cocher dans le panneau du
// générateur. Cochée, le cercle jaune de son rayon reste sur la carte, même panneau fermé.
// C'est un réglage de l'écran (pas de la partie) : il est gardé dans le stockage du navigateur.

import { ecrireReglage, lireReglage } from './stockage'

const CLE_RAYON = 'idle-miner-rayon-generateur'

// Lu une seule fois au démarrage : la carte le demande à chaque image.
let visible = lireReglage(CLE_RAYON) === 'oui'

export function rayonToujoursVisible(): boolean {
  return visible
}

export function montrerRayon(oui: boolean): void {
  visible = oui
  ecrireReglage(CLE_RAYON, oui ? 'oui' : 'non')
}
