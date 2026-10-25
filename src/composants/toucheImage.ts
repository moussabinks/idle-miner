// Toucher une image au pixel près (25/10). Une image de bâtiment est un grand rectangle, avec
// beaucoup de vide transparent autour du dessin : la mine surtout, très grande. Avant, toucher ce
// vide (par exemple un bâtiment juste derrière la mine) ouvrait la mine. Maintenant, on regarde
// si le pixel touché est vraiment dessiné.
//
// Comment : la première fois, on recopie l'image en petit dans un canevas (128 pixels de large)
// et on garde la transparence de chaque pixel. Ensuite, c'est une simple lecture dans un tableau.

type Masque = { largeur: number; hauteur: number; alpha: Uint8ClampedArray }

const LARGEUR_MASQUE = 128
const masques = new Map<string, Masque | null>()

function masqueDe(image: HTMLImageElement): Masque | null {
  const deja = masques.get(image.src)
  if (deja !== undefined) return deja
  if (!image.complete || image.naturalWidth === 0) return null // pas encore chargée : on réessaiera
  let masque: Masque | null = null
  try {
    const largeur = LARGEUR_MASQUE
    const hauteur = Math.max(1, Math.round((LARGEUR_MASQUE * image.naturalHeight) / image.naturalWidth))
    const canevas = document.createElement('canvas')
    canevas.width = largeur
    canevas.height = hauteur
    const ctx = canevas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      ctx.drawImage(image, 0, 0, largeur, hauteur)
      const donnees = ctx.getImageData(0, 0, largeur, hauteur).data
      const alpha = new Uint8ClampedArray(largeur * hauteur)
      for (let i = 0; i < alpha.length; i++) alpha[i] = donnees[i * 4 + 3]
      masque = { largeur, hauteur, alpha }
    }
  } catch {
    masque = null // (une image d'un autre site : on ne peut pas la lire)
  }
  masques.set(image.src, masque)
  return masque
}

// Le point (sx, sy) de l'écran tombe-t-il sur un pixel dessiné de l'image ? « miroir » : l'image
// est retournée. Si on ne peut pas savoir (image pas chargée), on répond oui, comme avant.
export function pixelDessine(image: HTMLImageElement, sx: number, sy: number, miroir: boolean): boolean {
  const boite = image.getBoundingClientRect()
  if (boite.width <= 0 || boite.height <= 0) return false
  let u = (sx - boite.left) / boite.width
  const v = (sy - boite.top) / boite.height
  if (u < 0 || u > 1 || v < 0 || v > 1) return false
  if (miroir) u = 1 - u
  const masque = masqueDe(image)
  if (!masque) return true
  // Un pixel autour aussi : toucher le bord du dessin compte (plus facile au doigt).
  const px = Math.floor(u * (masque.largeur - 1))
  const py = Math.floor(v * (masque.hauteur - 1))
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = px + dx
      const y = py + dy
      if (x < 0 || y < 0 || x >= masque.largeur || y >= masque.hauteur) continue
      if (masque.alpha[y * masque.largeur + x] > 40) return true
    }
  }
  return false
}
