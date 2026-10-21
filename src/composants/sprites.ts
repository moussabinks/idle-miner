// Les personnages dessinés par l'équipe (21/10) : les planches de chaque personnage (devant,
// derrière, gauche, droite), détourées en images (public/images/personnages/sprites). Dans le
// village (vue de 3/4 du ciel), on choisit l'image selon le sens de la marche : c'est ce qui
// donne l'impression d'un personnage en volume qui se retourne.
// Le joueur n'a pas encore de planche à lui : il a celle du mineur, avec le casque jaune
// d'origine. Les mineurs employés ont la même, avec un casque de la couleur de leur rareté.

import { RARETES, type IdRarete } from '../jeu/donnees'

export type VueSprite = 'devant' | 'derriere' | 'gauche' | 'droite'

// Qui on dessine : le joueur, un mineur (sa rareté), le manager ou le recruteur.
export type QuiSprite = 'joueur' | IdRarete | 'manager' | 'recruteur'

// Une image : sa taille en pixels, et le point du sol entre ses deux pieds.
export type CalageSprite = { largeur: number; hauteur: number; pied: { x: number; y: number } }

// Le joueur et les mineurs (mêmes images, seul le casque change de couleur).
const CALAGES_MINEUR: Record<VueSprite, CalageSprite> = {
  devant: { largeur: 305, hauteur: 369, pied: { x: 177, y: 365 } },
  derriere: { largeur: 328, hauteur: 371, pied: { x: 131, y: 367 } },
  gauche: { largeur: 298, hauteur: 382, pied: { x: 109, y: 378 } },
  droite: { largeur: 330, hauteur: 387, pied: { x: 214, y: 383 } },
}

// Le manager et le recruteur restent à leur poste : on n'a besoin que de leur image de face.
const CALAGE_MANAGER: CalageSprite = { largeur: 384, hauteur: 437, pied: { x: 175, y: 432 } }
const CALAGE_RECRUTEUR: CalageSprite = { largeur: 322, hauteur: 387, pied: { x: 126, y: 384 } }

// La taille d'un personnage dans le monde : combien de pixels du monde pour un pixel de l'image
// (un mineur fait environ 46 pixels de haut, comme dans Clash of Clans : petit à côté des bâtiments).
export const ECHELLE_SPRITE = 46 / 370

const DOSSIER = '/images/personnages/sprites'

// L'image et son calage pour un personnage vu sous un angle.
export function spritePerso(qui: QuiSprite, vue: VueSprite): { fichier: string; calage: CalageSprite } {
  if (qui === 'manager') return { fichier: `${DOSSIER}/manager_devant.webp`, calage: CALAGE_MANAGER }
  if (qui === 'recruteur') return { fichier: `${DOSSIER}/recruteur_devant.webp`, calage: CALAGE_RECRUTEUR }
  const nom = qui === 'joueur' ? 'joueur' : `mineur_${qui}`
  return { fichier: `${DOSSIER}/${nom}_${vue}.webp`, calage: CALAGES_MINEUR[vue] }
}

// Quelle image montrer, selon le sens de la marche (orienter() dans iso.ts) :
//   - il vient vers nous en allant vers la droite de l'écran : l'image « droite » ;
//   - il vient vers nous en allant vers la gauche : l'image « gauche » ;
//   - il s'éloigne : on le voit de dos (retourné en miroir s'il part vers la gauche) ;
//   - à l'arrêt : de face.
export function choisirVue(orientation: { sens: 1 | -1; vue: 'face' | 'dos' }, marche: boolean): { vue: VueSprite; miroir: boolean } {
  if (!marche) return { vue: 'devant', miroir: false }
  if (orientation.vue === 'dos') return { vue: 'derriere', miroir: orientation.sens < 0 }
  return { vue: orientation.sens > 0 ? 'droite' : 'gauche', miroir: false }
}

// La rareté d'un mineur à partir de la couleur de son casque (la mine en coupe ne connaît que la
// couleur). Une couleur inconnue : le joueur.
export function quiSelonCasque(casque: string | null | undefined): QuiSprite {
  if (!casque) return 'joueur'
  const rarete = Object.values(RARETES).find((r) => r.couleur === casque)
  return rarete ? rarete.id : 'joueur'
}

