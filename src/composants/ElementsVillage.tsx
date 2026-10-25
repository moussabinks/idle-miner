// Les petits morceaux du village vu du ciel, partagés par la carte du jeu (VueVillage) et par le
// décor de l'écran d'accueil (SceneAccueil) : un personnage posé sur la grille, et l'image d'un
// bâtiment calée sur son emprise.

import { memo, type ReactNode } from 'react'
import { BATIMENTS, type IdBatiment } from '../jeu/donnees'
import { nombre } from '../jeu/langue'
import { CALAGES, imageBatiment, profondeur, transformationSprite, versEcran } from './iso'
import { ECHELLE_SPRITE, choisirVue, spritePerso, type QuiSprite, type VueSprite } from './sprites'

// Un personnage posé dans le monde (ses pieds sur le point de la grille). On le dessine avec
// l'image qui correspond au sens de sa marche (devant, derrière, gauche ou droite : voir
// sprites.ts), et il sautille en marchant.
export function Perso({ x, y, qui, sens, vue, marche, saut = 0, etiquette, classe = '' }: {
  x: number
  y: number
  qui: QuiSprite
  sens: 1 | -1
  vue: 'face' | 'dos'
  marche: boolean
  saut?: number
  etiquette?: ReactNode
  classe?: string
}) {
  const e = versEcran(x, y)
  const choix = choisirVue({ sens, vue }, marche)
  const estJoueur = qui === 'joueur'
  return (
    <div
      className={`perso-village ${marche ? 'perso-marche' : ''} ${estJoueur ? 'perso-heros' : ''} ${classe}`}
      style={{ left: e.x, top: e.y, zIndex: profondeur(x, y) + 5, ['--sens' as string]: sens }}
    >
      {/* Le joueur a un anneau doré sous les pieds (comme le héros de Clash of Clans). */}
      {estJoueur && <span className="perso-anneau" />}
      <span key={`o${saut}`} className={`perso-ombre ${saut > 0 ? 'saute' : ''}`} />
      {/* En marchant, de petits nuages de poussière sous ses pieds. */}
      {marche && (
        <span className="perso-poussiere">
          <i />
          <i />
        </span>
      )}
      <div key={saut} className={`perso-saut ${saut > 0 ? 'saute' : ''}`}>
        <div className="perso-penche">
          <div className="perso-corps">
            <ImagePerso qui={qui} vue={choix.vue} miroir={choix.miroir} />
          </div>
        </div>
      </div>
      {etiquette}
    </div>
  )
}

// L'image du personnage, ses pieds au bas du cadre (au milieu). En miroir, elle se retourne
// autour de ses pieds.
export function ImagePerso({ qui, vue, miroir = false, echelle = ECHELLE_SPRITE }: { qui: QuiSprite; vue: VueSprite; miroir?: boolean; echelle?: number }) {
  const { fichier, calage } = spritePerso(qui, vue)
  return (
    <img
      className="image-perso"
      src={fichier}
      alt=""
      draggable={false}
      width={calage.largeur}
      height={calage.hauteur}
      style={{
        width: calage.largeur * echelle,
        height: calage.hauteur * echelle,
        marginLeft: -calage.pied.x * echelle,
        marginTop: -calage.pied.y * echelle,
        transformOrigin: `${calage.pied.x * echelle}px 0`,
        transform: miroir ? 'scaleX(-1)' : undefined,
      }}
    />
  )
}

// Une image de bâtiment (« memo » : elle ne change que si on la déplace).
export const ImageBatiment = memo(function ImageBatiment({ id, x, y, miroir, classe }: { id: IdBatiment; x: number; y: number; miroir: boolean; classe: string }) {
  const calage = CALAGES[id]
  const taille = BATIMENTS[id].taille
  return (
    <img
      className={`sprite-batiment ${classe}`}
      src={imageBatiment(id)}
      alt={BATIMENTS[id].nom}
      width={calage.largeur}
      height={calage.hauteur}
      draggable={false}
      data-cible={`batiment:${id}`}
      style={{ transform: transformationSprite(calage, x, y, taille, miroir), zIndex: profondeur(x + taille / 2, y + taille / 2) }}
    />
  )
})

// « 1,4 s », « 42 s », « 12 min ».
function dureeCourte(secondes: number): string {
  const s = Math.max(0, secondes)
  if (s < 10) return `${nombre(s, 1)} s`
  if (s < 60) return `${Math.ceil(s)} s`
  return `${Math.floor(s / 60)} min`
}

// Une mini-jauge au-dessus d'un objet du village (27/10) : ce qui se passe (« 📦 Chargement »),
// le temps qu'il reste, et une petite barre qui se remplit. Pour le wagonnet qui charge ou vend,
// l'ascenseur qui décharge...
export function MiniJauge({ x, y, texte, part, secondes }: { x: number; y: number; texte: string; part: number; secondes: number }) {
  return (
    <div className="mini-jauge" style={{ left: x, top: y }} aria-hidden="true">
      <span className="mini-jauge-texte">
        {texte} <b>{dureeCourte(secondes)}</b>
      </span>
      <span className="mini-jauge-piste">
        <i style={{ width: `${Math.round(Math.max(0, Math.min(1, part)) * 100)}%` }} />
      </span>
    </div>
  )
}
