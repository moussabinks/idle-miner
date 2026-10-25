// (25/10) Une icône du jeu en IMAGE (public/images/icones/, fabriquées par
// outils/icones/fabriquer.py avec les mêmes dessins que la police d'icônes). Pour les endroits où
// la police ne s'affiche pas partout : dans les bulles « +1 » animées de la mine, Safari montrait
// les emojis d'Apple (le fer devenait un boulon 🔩).
// Seules les icônes de ICONES_EN_IMAGE (dans fabriquer.py) existent en image : les minerais.

import { cheminPublic } from '../chemins'

export function IconeImage({ emoji }: { emoji: string }) {
  const code = (emoji.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')
  return <img className="icone-image" src={cheminPublic(`images/icones/u${code}.svg`)} alt="" aria-hidden="true" draggable={false} />
}
