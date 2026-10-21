// Les petits morceaux du village vu du ciel, partagés par la carte du jeu (VueVillage) et par le
// décor de l'écran d'accueil (SceneAccueil) : un personnage posé sur la grille, et l'image d'un
// bâtiment calée sur son emprise.

import { memo, type ReactNode } from 'react'
import { BATIMENTS, type IdBatiment } from '../jeu/donnees'
import { CALAGES, IMAGES_BATIMENTS, profondeur, transformationSprite, versEcran } from './iso'

// Un personnage posé dans le monde (ses pieds sur le point de la grille).
export function Perso({ x, y, sens, vue, marche, saut = 0, etiquette, classe = '', children }: {
  x: number
  y: number
  sens: 1 | -1
  vue: 'face' | 'dos'
  marche: boolean
  saut?: number
  etiquette?: ReactNode
  classe?: string
  children: (vue: 'face' | 'dos') => ReactNode
}) {
  const e = versEcran(x, y)
  return (
    <div className={`perso-village ${marche ? 'perso-marche' : ''} ${classe}`} style={{ left: e.x, top: e.y, zIndex: profondeur(x, y) + 5 }}>
      <span className="perso-ombre" />
      <div key={saut} className={`perso-saut ${saut > 0 ? 'saute' : ''}`}>
        <div className="perso-retourne" style={{ ['--sens' as string]: sens }}>
          {children(vue)}
        </div>
      </div>
      {etiquette}
    </div>
  )
}

// Une image de bâtiment (« memo » : elle ne change que si on la déplace).
export const ImageBatiment = memo(function ImageBatiment({ id, x, y, miroir, classe }: { id: IdBatiment; x: number; y: number; miroir: boolean; classe: string }) {
  const calage = CALAGES[id]
  const taille = BATIMENTS[id].taille
  return (
    <img
      className={`sprite-batiment ${classe}`}
      src={IMAGES_BATIMENTS[id]}
      alt={BATIMENTS[id].nom}
      width={calage.largeur}
      height={calage.hauteur}
      draggable={false}
      data-cible={`batiment:${id}`}
      style={{ transform: transformationSprite(calage, x, y, taille, miroir), zIndex: profondeur(x + taille / 2, y + taille / 2) }}
    />
  )
})
