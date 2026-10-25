// (25/10) Une icône du jeu en IMAGE (public/images/icones/, fabriquées par
// outils/icones/fabriquer.py avec les mêmes dessins que la police d'icônes). Pour les endroits qui
// bougent (les bulles « +1 » de la mine, les bulles au-dessus des bâtiments) : Safari n'y prenait
// pas la police, et montrait ses propres emojis (le fer devenait un boulon 🔩, la redstone un
// rond rouge 🔴). Si l'image n'existe pas (un emoji sans dessin), on écrit l'emoji.

import { useState } from 'react'
import { cheminPublic } from '../chemins'

export function IconeImage({ emoji }: { emoji: string }) {
  const [sansImage, setSansImage] = useState(false)
  if (sansImage) return <>{emoji}</>
  const code = (emoji.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')
  return <img className="icone-image" src={cheminPublic(`images/icones/u${code}.svg`)} alt="" aria-hidden="true" draggable={false} onError={() => setSansImage(true)} />
}
