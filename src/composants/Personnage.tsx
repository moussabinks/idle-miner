// Le personnage dans la vue en coupe de la mine : les mêmes images que dans le village (les
// planches de l'équipe, voir sprites.ts). De profil quand il creuse ou marche (tourné vers la
// gauche ou vers la droite), de dos quand il grimpe à l'échelle, de face au repos (dans une
// cabine d'ascenseur). Les mineurs employés ont un casque de la couleur de leur rareté.
// Les tenues du Bazar ne se voient pas encore sur ces images (il faudra une planche du joueur).

import type { IdTenue } from '../jeu/donnees'
import { quiSelonCasque, spritePerso, type VueSprite } from './sprites'

export type ActionPersonnage = 'repos' | 'creuse' | 'marche' | 'grimpe'

// Ce que porte le personnage : un casque de mineur (sa couleur), ou la tenue du joueur.
export type Habits = { casque?: string | null; chapeau?: IdTenue | null; haut?: IdTenue | null }

type Props = {
  couleurPioche: string | null // null = mains nues (pas encore visible sur les images)
  action: ActionPersonnage
  versLaGauche?: boolean
  habits?: Habits
}

function vueSelonAction(action: ActionPersonnage, versLaGauche: boolean): VueSprite {
  if (action === 'grimpe') return 'derriere'
  if (action === 'repos') return 'devant'
  return versLaGauche ? 'gauche' : 'droite'
}

export function Personnage({ action, versLaGauche = false, habits = {} }: Props) {
  const { fichier, calage } = spritePerso(quiSelonCasque(habits.casque), vueSelonAction(action, versLaGauche))
  return (
    <img
      className={`personnage personnage-${action} ${versLaGauche ? 'vers-la-gauche' : ''}`}
      src={fichier}
      width={calage.largeur}
      height={calage.hauteur}
      draggable={false}
      alt="Le mineur"
    />
  )
}
