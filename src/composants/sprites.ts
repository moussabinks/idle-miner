// Les personnages (25/10) : des taupes dessinées en SVG dans le style cartoon du jeu, une image
// par vue (devant, derrière, gauche, droite), dans public/images/personnages/sprites (fabriquées
// par outils/art/personnages.mjs). Dans le village (vue de 3/4 du ciel), on choisit l'image selon
// le sens de la marche : c'est ce qui donne l'impression d'un personnage en volume qui se retourne.
// Le joueur a un casque jaune ; les mineurs employés, un casque de la couleur de leur rareté.

import { RARETES, type IdRarete } from '../jeu/donnees'
import { cheminPublic } from '../chemins'

export type VueSprite = 'devant' | 'derriere' | 'gauche' | 'droite'

// Qui on dessine : le joueur, un mineur (sa rareté), le manager ou le recruteur.
export type QuiSprite = 'joueur' | IdRarete | 'manager' | 'recruteur'

// Une image : sa taille en pixels, et le point du sol entre ses deux pieds.
export type CalageSprite = { largeur: number; hauteur: number; pied: { x: number; y: number } }

// Toutes les images ont le même cadre (136 × 132), les pieds au même endroit : voir LARGEUR,
// HAUTEUR et PIED dans outils/art/personnages.mjs.
const CALAGE_TAUPE: CalageSprite = { largeur: 136, hauteur: 132, pied: { x: 68, y: 127 } }

// La taille d'un personnage dans le monde : combien de pixels du monde pour un pixel de l'image
// (une taupe casquée fait environ 46 pixels de haut, comme dans Clash of Clans : petite à côté
// des bâtiments).
export const ECHELLE_SPRITE = 46 / 110

const DOSSIER = cheminPublic('/images/personnages/sprites')

// L'image et son calage pour un personnage vu sous un angle.
export function spritePerso(qui: QuiSprite, vue: VueSprite): { fichier: string; calage: CalageSprite } {
  // Le manager et le recruteur restent à leur poste : ils n'ont que leur image de face.
  if (qui === 'manager' || qui === 'recruteur') return { fichier: `${DOSSIER}/${qui}_devant.svg`, calage: CALAGE_TAUPE }
  const nom = qui === 'joueur' ? 'joueur' : `mineur_${qui}`
  return { fichier: `${DOSSIER}/${nom}_${vue}.svg`, calage: CALAGE_TAUPE }
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

