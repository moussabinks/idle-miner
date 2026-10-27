// Le tutoriel (25/10, nouveau style). Pépite, une taupe mineuse, accompagne le joueur :
//   - au début, une fenêtre se présente avec le jeu en 4 étapes (les mêmes que dans l'aide et
//     sur l'accueil : une seule promesse partout) ;
//   - à chaque étape, une petite carte dit quoi faire (en haut de l'écran, ou en bas si ce qu'il
//     faut toucher est en haut). Le reste de l'écran s'assombrit ; ce qu'il faut toucher est
//     entouré d'un anneau doré, avec une grosse flèche qui rebondit et une étiquette
//     (« Touche ici ! »), et la cible elle-même palpite (attribut data-tuto-actif) ;
//   - chaque étape réussie fait jaillir un « Bravo ! » au milieu de l'écran ;
//   - à la fin, une fenêtre de félicitations montre la suite (la liste des tâches).
// On ne passe à l'étape suivante qu'en faisant l'action (les règles sont dans src/jeu/tutoriel.ts).
// Le style est dans src/styles/fenetres.css (« Le tutoriel »).
//
// La cible est trouvée dans la page par son attribut (data-tuto="bloc", data-cible="batiment:employes"...) :
// on suit sa position à chaque image (la carte du village bouge, les fenêtres défilent).

import { useEffect, useRef, useState } from 'react'
import { BATIMENTS, PRIX_EMBAUCHE, type IdBatiment } from '../jeu/donnees'
import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { BLOCS_TUTORIEL, ETAPES_TUTORIEL, etapeTutoriel, type IdEtapeTutoriel } from '../jeu/tutoriel'
import { sons } from '../sons'
import { ETAPES_DU_JEU } from './etapesDuJeu'
import { Confirmation } from './Confirmation'
import { Fenetre } from './Fenetre'
import { cheminPublic } from '../chemins'
import { versCss } from '../echelle'

// Ce que l'interface montre en ce moment (pour savoir où mettre la flèche).
export type EtatInterface = {
  batimentOuvert: IdBatiment | null // le bâtiment dont la fenêtre est ouverte
  menuConstruction: boolean
  posePrevue: IdBatiment | null // le bâtiment qu'on est en train de placer
  poseChoisie: boolean // le joueur a touché la carte : la place du bâtiment est choisie
}

type Props = {
  etat: EtatJeu
  ui: EtatInterface
  onSuivant: () => void
  onPasser: () => void
}

type Consigne = {
  titre: string
  texte: string
  geste: string // l'étiquette sur la flèche (« Touche ici ! »)
  cible: string | null // ce qu'il faut toucher (un sélecteur CSS), ou rien
}

// Le portrait de Pépite, la taupe qui guide le joueur.
const PORTRAIT_PEPITE = cheminPublic('/images/personnages/mineur.svg')

// Les cibles. (Un bâtiment sur la carte a l'attribut data-cible ; le reste, data-tuto.)
const BOUTON_MINE = '[data-tuto="mine"]'
// (25/10 : le bouton « Construire » lui-même, pas toute la carte : la flèche montre ce qu'il faut toucher)
const CHOIX_PERSONNEL = '[data-tuto="poser-employes"]'
const batiment = (id: IdBatiment) => `[data-cible="batiment:${id}"]`

// (27/10) Une fenêtre qui n'a rien à voir avec l'étape est ouverte (le menu Bâtiments pendant
// « Ouvre le Personnel »...) : ce qu'il faut toucher est caché derrière. On fait d'abord fermer
// la fenêtre (avant, l'anneau doré montrait un endroit caché, au milieu de la fenêtre).
const FERMER_LA_FENETRE = (): Consigne => ({
  titre: t('Ferme cette fenêtre'),
  texte: t('Touche ✖, en haut à droite de la fenêtre.'),
  geste: t('Ferme !'),
  cible: '[data-tuto="fermer-fenetre"]',
})

// Le texte et la cible de chaque étape, selon ce qui est ouvert.
function consigne(etape: IdEtapeTutoriel, etat: EtatJeu, ui: EtatInterface): Consigne {
  const aLaMine = ui.batimentOuvert === 'puits'
  // Ce qui gêne chaque étape : une autre fenêtre que celle dont elle a besoin.
  const autreFenetre =
    ((etape === 'creuser' || etape === 'vendre') && (ui.menuConstruction || (ui.batimentOuvert !== null && !aLaMine))) ||
    (etape === 'personnel' && ui.batimentOuvert !== null) ||
    (etape === 'embaucher' && (ui.menuConstruction || (ui.batimentOuvert !== null && ui.batimentOuvert !== 'employes')))
  if (autreFenetre) return FERMER_LA_FENETRE()
  switch (etape) {
    case 'bonjour':
    case 'bravo':
      return { titre: '', texte: '', geste: '', cible: null }

    case 'creuser':
      return aLaMine
        ? {
            titre: t('Casse {n} blocs : {fait} / {n}', { n: BLOCS_TUTORIEL, fait: Math.min(etat.stats.blocsCasses, BLOCS_TUTORIEL) }),
            texte: t('Clique sur le bloc, encore et encore ! Tout va dans le coffre de la mine.'),
            geste: t('Clique vite !'),
            // (27/10) l'anneau autour du cube lui-même : autour de tout le bouton (aussi large que la
            // fenêtre), il passait sur le titre « Niveau 1 » et sur les jauges
            cible: '[data-tuto="bloc"] .bloc-pousse',
          }
        : {
            titre: t('Ouvre ta mine'),
            texte: t('Touche le bouton Mine, en bas à gauche.'),
            geste: t('Touche ici !'),
            cible: BOUTON_MINE,
          }

    case 'vendre':
      return aLaMine
        ? {
            titre: t('Vends le coffre'),
            texte: t('Touche « Tout vendre » : les blocs deviennent de l’argent.'),
            geste: t('Vends !'),
            cible: '[data-tuto="vendre"]',
          }
        : {
            titre: t('Rouvre ta mine'),
            texte: t('Ton coffre t’attend : touche le bouton Mine.'),
            geste: t('Touche ici !'),
            cible: BOUTON_MINE,
          }

    case 'personnel': {
      const prix = BATIMENTS.employes.cout.argent ?? 0
      // En deux temps : d'abord toucher la carte (rien n'est assombri, pas de flèche), puis,
      // une fois la place choisie, le bouton « Construire ici ».
      if (ui.posePrevue === 'employes')
        return ui.poseChoisie
          ? { titre: t('Valide sa place'), texte: t('Touche « Construire ici ». (Tu peux encore toucher la carte pour le déplacer.)'), geste: t('Valide !'), cible: '[data-tuto="construire-ici"]' }
          : { titre: t('Choisis sa place'), texte: t('Touche la carte, là où tu veux poser le Personnel.'), geste: '', cible: null }
      if (ui.menuConstruction)
        return { titre: t('Choisis le Personnel'), texte: t('C’est là qu’on embauche des mineurs. Il coûte {prix} $.', { prix }), geste: t('Celui-ci !'), cible: CHOIX_PERSONNEL }
      return { titre: t('Construis le Personnel'), texte: t('Ouvre le menu Bâtiments, en bas à droite.'), geste: t('Touche ici !'), cible: '[data-tuto="batiments"]' }
    }

    case 'embaucher':
      return ui.batimentOuvert === 'employes'
        ? {
            titre: t('Embauche un mineur'),
            texte: t('Le premier ne coûte que {prix} $. Il creusera pour toi, même quand tu ne joues pas !', { prix: PRIX_EMBAUCHE[0] }),
            geste: t('Embauche !'),
            cible: '[data-tuto="embaucher"]',
          }
        : {
            titre: t('Ouvre le Personnel'),
            texte: t('Touche le Personnel, sur la carte.'),
            geste: t('Touche ici !'),
            cible: batiment('employes'),
          }
  }
}

// La position de la cible à l'écran, suivie à chaque image. La cible reçoit aussi l'attribut
// data-tuto-actif : elle palpite.
// Pour la fluidité, on ne redessine pas le tutoriel à chaque image : la position est écrite
// directement dans des variables CSS du calque doré (--x, --y, --l, --h), et les éléments s'y
// déplacent avec transform. React ne change que quand la cible apparaît, disparaît, ou passe
// d'une moitié de l'écran à l'autre.
// Fait défiler (de haut en bas seulement) la boîte qui contient l'élément, pour qu'on le voie en
// entier. (scrollIntoView ferait aussi défiler de côté une fenêtre trop large.)
// La boîte qui défile autour d'un élément (le corps d'une fenêtre), ou rien.
function boiteQuiDefile(element: Element): HTMLElement | null {
  let boite = element.parentElement
  while (boite && !(boite.scrollHeight > boite.clientHeight && /auto|scroll/.test(getComputedStyle(boite).overflowY))) boite = boite.parentElement
  return boite
}

function defilerJusqua(element: Element) {
  const boite = boiteQuiDefile(element)
  if (!boite) return
  const r = element.getBoundingClientRect()
  const b = boite.getBoundingClientRect()
  // (27/10) avec la place pour l'anneau doré autour (PLACE_VOULUE)
  const marge = (24 * 100) / Math.max(1, versCss(100)) // (24 px du CSS, en px de l'écran)
  if (r.top - marge < b.top) boite.scrollBy({ top: versCss(r.top - b.top) - 24, behavior: 'smooth' })
  else if (r.bottom + marge > b.bottom) boite.scrollBy({ top: versCss(r.bottom - b.bottom) + 24, behavior: 'smooth' })
}

// (27/10) La forme de la cible, mesurée pour que l'anneau doré ne la touche jamais :
//   - sa vraie taille (offsetWidth : sans l'animation qui la fait palpiter ou respirer) ;
//   - ce qui dépasse d'elle (la pastille « 3 », l'étiquette « Bâtiments » sous un rond) et son
//     ombre portée (le relief sous les boutons) ;
//   - l'arrondi de ses coins (un rond reste un rond : l'anneau prend la même forme).
// Les positions sont celles du CSS (versCss), par rapport au milieu de la cible.
type FormeCible = { debordants: Element[]; ombreBas: number; arrondi: number; rond: boolean }

function formeDe(element: Element): FormeCible {
  const style = getComputedStyle(element)
  // Les morceaux posés en absolu (pastilles, étiquettes) : ils peuvent dépasser de la cible.
  const debordants = [...element.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'absolute').slice(0, 6)
  // L'ombre dure sous les boutons (« 0px 5px 0px ») : elle allonge le bouton vers le bas.
  let ombreBas = 0
  for (const ombre of style.boxShadow.split(/,(?![^(]*\))/)) {
    if (ombre.includes('inset')) continue
    const nombres = ombre.replace(/rgba?\([^)]*\)/g, '').match(/-?[\d.]+px/g)
    if (nombres && nombres.length >= 2) ombreBas = Math.max(ombreBas, parseFloat(nombres[1]))
  }
  const largeur = element instanceof HTMLElement ? element.offsetWidth : 0
  const hauteur = element instanceof HTMLElement ? element.offsetHeight : 0
  const brut = style.borderTopLeftRadius
  const arrondi = brut.endsWith('%') ? (parseFloat(brut) / 100) * Math.min(largeur, hauteur) : parseFloat(brut) || 0
  const rond = largeur > 0 && arrondi >= Math.min(largeur, hauteur) / 2 - 1
  return { debordants, ombreBas, arrondi: Math.min(arrondi, Math.min(largeur, hauteur) / 2), rond }
}

// Le plus grand arrondi des coins d'une boîte tel que tous les points restent dedans (ils sont à
// l'intérieur de la boîte, mais un coin trop arrondi en couperait un).
function arrondiQuiContient(boite: { gauche: number; droite: number; haut: number; bas: number }, points: [number, number][]): number {
  const maximum = Math.min(boite.droite - boite.gauche, boite.bas - boite.haut) / 2
  const dedans = (rayon: number) =>
    points.every(([x, y]) => {
      // le centre de l'arrondi du coin le plus proche du point
      const cx = x < boite.gauche + rayon ? boite.gauche + rayon : x > boite.droite - rayon ? boite.droite - rayon : x
      const cy = y < boite.haut + rayon ? boite.haut + rayon : y > boite.bas - rayon ? boite.bas - rayon : y
      return Math.hypot(x - cx, y - cy) <= rayon + 0.5
    })
  for (let rayon = maximum; rayon > 0; rayon -= 1) if (dedans(rayon)) return rayon
  return 0
}

// (27/10) L'anneau doré, le même que sur le site (épais : encre, 5 px de jaune, encre) : il entoure
// la cible à --ecart (11 px, fenetres.css) avec 3 px de vide, son contour d'encre dépasse de 3 px
// et il pulse de 3 px. Ce qu'il prend autour de la cible :
const ANNEAU_HORS_CIBLE = 17

// (27/10) La place libre de chaque côté d'un élément (en px du CSS, jusqu'à « jusqua ») : jusqu'au
// premier voisin (un texte, un bouton...) et jusqu'au bord de l'écran, séparément.
type Cote = 'haut' | 'bas' | 'gauche' | 'droite'
const COTES: Cote[] = ['haut', 'bas', 'gauche', 'droite']
function espaceAutour(element: Element, jusqua: number): Record<Cote, { voisin: number; bord: number }> {
  const r = element.getBoundingClientRect()
  const ecran = (px: number) => (px * 100) / Math.max(1, versCss(100)) // px du CSS → écran
  const libre = (x: number, y: number) => {
    const dessus = document.elementsFromPoint(x, y).find((e) => !e.closest('.tuto-cible, .tuto-carte'))
    return !dessus || dessus.contains(element) || element.contains(dessus)
  }
  const resultat = {} as Record<Cote, { voisin: number; bord: number }>
  for (const cote of COTES) {
    const bord = versCss(cote === 'haut' ? r.top : cote === 'bas' ? window.innerHeight - r.bottom : cote === 'gauche' ? r.left : window.innerWidth - r.right)
    let voisin = jusqua
    sonde: for (let d = 1; d <= jusqua && d < bord; d++) {
      const e = ecran(d)
      for (let k = 1; k < 8; k++) {
        const fx = r.left + (r.width * k) / 8
        const fy = r.top + (r.height * k) / 8
        const [x, y] = cote === 'haut' ? [fx, r.top - e] : cote === 'bas' ? [fx, r.bottom + e] : cote === 'gauche' ? [r.left - e, fy] : [r.right + e, fy]
        if (!libre(x, y)) {
          voisin = d - 1
          break sonde
        }
      }
    }
    resultat[cote] = { voisin, bord }
  }
  return resultat
}

// La place que demande l'anneau autour de la cible, et 2 px de vide avant un voisin.
const PLACE_VOULUE = 19
// Au plus, la cible s'écarte de ses voisins de tant (pour ne pas bouleverser la fenêtre).
const MARGE_MAX = 22

// (27/10) La cible ne grossit plus (elle passait sous l'anneau) : c'est l'anneau qui pulse.
const PALPITE_MAX = 1


// (27/10) La flèche et son étiquette ne doivent cacher aucun texte ni bouton : on regarde si la
// place est libre au-dessus de la cible (puis en dessous). Libre : la carte du village, ou le fond
// de la fenêtre où est la cible ; pris : tout le reste de l'interface (un texte, une jauge...).
function zoneLibre(cible: Element, gauche: number, haut: number, droite: number, bas: number): boolean {
  if (haut < 0 || bas > window.innerHeight || gauche < 0 || droite > window.innerWidth) return false
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 4; j++) {
      const x = gauche + ((droite - gauche) * i) / 6
      const y = haut + ((bas - haut) * j) / 4
      const dessus = document.elementsFromPoint(x, y).find((e) => !e.closest('.tuto-cible, .tuto-carte'))
      if (!dessus || dessus.contains(cible) || cible.contains(dessus)) continue
      if (dessus.closest('.fenetre, .interface-haut, .interface-bas, .barre-edition, .voile')) return false
    }
  }
  return true
}

type PlaceFleche = 'dessus' | 'dessous' | 'aucune'

type Suivi = {
  visible: boolean
  dessous: boolean // la flèche passe dessous (pas de place libre au-dessus)
  sansFleche: boolean // ni au-dessus ni en dessous : pas de flèche (l'anneau suffit)
  sansVoile: boolean // un rond de la barre (pastille, étiquette) : pas de voile sombre autour
  enHaut: boolean // la cible est dans le haut de l'écran : la carte d'étape va en bas
}
const SUIVI_VIDE: Suivi = { visible: false, dessous: false, sansFleche: false, sansVoile: false, enHaut: false }

function useSuiviCible(selecteur: string | null, calque: React.RefObject<HTMLDivElement | null>, surBatiment: boolean): Suivi {
  const [suivi, setSuivi] = useState<Suivi>(SUIVI_VIDE)
  const dernierSuivi = useRef(suivi)
  useEffect(() => {
    if (!selecteur) return
    let image = 0
    let defile = false
    let marquee: Element | null = null
    let placeFleche: PlaceFleche | null = null
    // La marge ajoutée à la cible de chaque côté pour l'écarter de ses voisins (et son style d'avant).
    let marges: Record<Cote, number> = { haut: 0, bas: 0, gauche: 0, droite: 0 }
    let margeAvant = ''
    const rendreMarge = () => {
      if (marquee instanceof HTMLElement || marquee instanceof SVGElement) marquee.style.margin = margeAvant
      marges = { haut: 0, bas: 0, gauche: 0, droite: 0 }
    }
    let forme: FormeCible | null = null
    // (27/10) Ce dont la barre du bas est décalée vers l'intérieur, pour que l'anneau autour de
    // Mine ou de Bâtiments ne sorte pas de l'écran (--tuto-decale-*, voir jeu.css).
    const decale = { gauche: 0, droite: 0, bas: 0 }
    const racine = document.documentElement
    let derniere = ''
    let n = 0
    const suivre = () => {
      // (on ne cherche la cible dans la page que de temps en temps, ou si elle a disparu)
      if (!marquee || !marquee.isConnected || n++ % 15 === 0) {
        const element = document.querySelector(selecteur)
        if (element !== marquee) {
          rendreMarge()
          if (marquee instanceof HTMLElement) delete marquee.dataset.tutoMargeBase
          marquee?.removeAttribute('data-tuto-actif')
          // (on mesure la forme avant de poser l'anneau : il change ses ombres)
          forme = element ? formeDe(element) : null
          element?.setAttribute('data-tuto-actif', '')
          marquee = element
          defile = false
          placeFleche = null
          margeAvant = element instanceof HTMLElement || element instanceof SVGElement ? element.style.margin : ''
        }
        // (toutes les demi-secondes : ce bloc tourne une image sur 15, n vaut alors 15k + 1) L'anneau a-t-il la place ? Sinon, la cible s'écarte de ses
        // voisins (une marge, au plus MARGE_MAX), et près du bord de l'écran l'anneau ne pulse pas.
        if (marquee && !surBatiment && (n % 30 === 1 || n < 3) && (marquee instanceof HTMLElement || marquee instanceof SVGElement)) {
          const place = espaceAutour(marquee, PLACE_VOULUE)
          const enBas = !!marquee.closest('.interface-bas') // (la barre du bas s'écarte toute seule des bords)
          let serre = false
          for (const cote of COTES) {
            const { voisin, bord } = place[cote]
            if (voisin < PLACE_VOULUE && voisin < bord) marges[cote] = Math.min(MARGE_MAX, marges[cote] + (PLACE_VOULUE - voisin))
            if (!enBas && bord < ANNEAU_HORS_CIBLE) serre = true
          }
          // Les marges ne doivent pas pousser la cible hors de l'écran (une fenêtre qui ne défile
          // pas) : si l'anneau n'y tient plus en haut ou en bas, on les reprend d'autant.
          if (!enBas) {
            const manqueBas = ANNEAU_HORS_CIBLE - place.bas.bord
            const manqueHaut = ANNEAU_HORS_CIBLE - place.haut.bord
            // (si la fenêtre peut encore défiler de ce côté, elle défile : les marges restent)
            const defileur = boiteQuiDefile(marquee)
            const peutDescendre = !!defileur && defileur.scrollTop + defileur.clientHeight < defileur.scrollHeight - 1
            const peutMonter = !!defileur && defileur.scrollTop > 0
            if (manqueBas > 0 && peutDescendre) defile = false
            else if (manqueBas > 0) {
              const reprise = Math.min(manqueBas, marges.haut + marges.bas)
              const surHaut = Math.min(reprise, marges.haut)
              marges.haut -= surHaut
              marges.bas -= reprise - surHaut
            }
            if (manqueHaut > 0 && peutMonter) defile = false
            else if (manqueHaut > 0) {
              const reprise = Math.min(manqueHaut, marges.haut + marges.bas)
              const surBas = Math.min(reprise, marges.bas)
              marges.bas -= surBas
              marges.haut -= reprise - surBas
            }
          }
          const style = getComputedStyle(marquee)
          const base = (cote: Cote) => parseFloat(cote === 'haut' ? style.marginTop : cote === 'bas' ? style.marginBottom : cote === 'gauche' ? style.marginLeft : style.marginRight) || 0
          if (marquee.style.margin === margeAvant && COTES.some((c) => marges[c] > 0)) {
            const de = { haut: base('haut'), bas: base('bas'), gauche: base('gauche'), droite: base('droite') }
            marquee.dataset.tutoMargeBase = JSON.stringify(de)
          }
          const de = JSON.parse((marquee as HTMLElement).dataset.tutoMargeBase ?? '{"haut":0,"bas":0,"gauche":0,"droite":0}') as Record<Cote, number>
          const nouvelle = `${de.haut + marges.haut}px ${de.droite + marges.droite}px ${de.bas + marges.bas}px ${de.gauche + marges.gauche}px`
          if (COTES.some((c) => marges[c] > 0) && marquee.style.margin !== nouvelle) {
            marquee.style.margin = nouvelle
            defile = false // (la fenêtre redéfile pour montrer la cible et son anneau en entier)
          }
          calque.current?.classList.toggle('tuto-sans-pouls', serre)
        }
      }
      const r = marquee?.getBoundingClientRect() ?? null
      // Un bouton dans une fenêtre : on la fait défiler jusqu'à lui (une fois).
      if (marquee && !defile && !surBatiment) {
        defilerJusqua(marquee)
        defile = true
      }
      const visible = r !== null && r.width > 0
      // La boîte à entourer (en positions du CSS : l'interface peut être réduite d'un bloc,
      // src/echelle.ts) : la cible à sa vraie taille, autour de son milieu, plus ce qui dépasse.
      let boite = { x: 0, y: 0, l: 0, h: 0, arrondi: 18 }
      if (visible && marquee) {
        const milieuX = versCss(r.left + r.width / 2)
        const milieuY = versCss(r.top + r.height / 2)
        const vraieLargeur = marquee instanceof HTMLElement && marquee.offsetWidth > 0 ? marquee.offsetWidth : versCss(r.width)
        const vraieHauteur = marquee instanceof HTMLElement && marquee.offsetHeight > 0 ? marquee.offsetHeight : versCss(r.height)
        // (l'échelle de l'animation en ce moment : pour ramener ce qui dépasse à sa vraie place)
        const animation = versCss(r.width) / vraieLargeur || 1
        let gauche = -vraieLargeur / 2
        let droite = vraieLargeur / 2
        let haut = -vraieHauteur / 2
        let bas = vraieHauteur / 2 + (forme?.ombreBas ?? 0)
        // Le contour de chaque morceau (des points par rapport au milieu de la cible) : pour un rond,
        // l'anneau longe ces points au plus près (voir arrondiQuiContient).
        const contour: [number, number][] = []
        const ajouterRond = (cx: number, cy: number, r: number) => {
          for (let k = 0; k < 32; k++) contour.push([cx + Math.cos((k / 32) * Math.PI * 2) * r, cy + Math.sin((k / 32) * Math.PI * 2) * r])
        }
        // le rond lui-même, et son ombre dure en dessous
        ajouterRond(0, 0, vraieLargeur / 2)
        if (forme?.ombreBas) ajouterRond(0, forme.ombreBas, vraieLargeur / 2)
        for (const morceau of forme?.debordants ?? []) {
          const m = morceau.getBoundingClientRect()
          if (m.width <= 0) continue
          const g = (versCss(m.left) - milieuX) / animation
          const d = (versCss(m.right) - milieuX) / animation
          const hh = (versCss(m.top) - milieuY) / animation
          const bb = (versCss(m.bottom) - milieuY) / animation
          gauche = Math.min(gauche, g)
          droite = Math.max(droite, d)
          haut = Math.min(haut, hh)
          bas = Math.max(bas, bb)
          // une pastille ronde compte comme un rond, le reste par les coins de sa boîte (arrondis)
          const rayonMorceau = Math.min(d - g, bb - hh) / 2
          const arrondiMorceau = parseFloat(getComputedStyle(morceau).borderTopLeftRadius) || 0
          if (arrondiMorceau >= rayonMorceau - 1 && Math.abs(d - g - (bb - hh)) < 2) ajouterRond((g + d) / 2, (hh + bb) / 2, rayonMorceau)
          else {
            const a = Math.min(arrondiMorceau, rayonMorceau)
            for (const [cx, cy, sx, sy] of [[g + a, hh + a, -1, -1], [d - a, hh + a, 1, -1], [g + a, bb - a, -1, 1], [d - a, bb - a, 1, 1]])
              for (let k = 0; k <= 6; k++) {
                const angle = (k / 6) * (Math.PI / 2)
                contour.push([cx + sx * Math.cos(angle) * a, cy + sy * Math.sin(angle) * a])
              }
          }
        }
        // La place pour la plus grande taille de la cible quand elle palpite (autour de son milieu).
        if (!surBatiment) {
          gauche *= PALPITE_MAX
          droite *= PALPITE_MAX
          haut *= PALPITE_MAX
          bas *= PALPITE_MAX
        }
        const l = droite - gauche
        const h = bas - haut
        // Un rond : les coins les plus arrondis possible sans toucher aucun morceau (un vrai rond
        // s'il n'y a rien autour ; sinon, l'anneau longe le rond, la pastille et l'étiquette).
        // Sinon, les mêmes coins arrondis que la cible.
        const echelleContour = surBatiment ? 1 : PALPITE_MAX
        const arrondi = forme?.rond
          ? arrondiQuiContient({ gauche, droite, haut, bas }, contour.map(([x, y]) => [x * echelleContour, y * echelleContour]))
          : Math.min((forme?.arrondi ?? 12) * PALPITE_MAX, Math.min(l, h) / 2)
        boite = { x: milieuX + gauche, y: milieuY + haut, l, h, arrondi }
      }
      // L'anneau (et son pouls) tient-il dans l'écran ? Sinon, pour un bouton de la barre du bas,
      // on décale la barre de ce qui manque (au fil des images, jusqu'à ce que ça tienne juste).
      if (visible && marquee?.closest('.interface-bas')) {
        const marge = ANNEAU_HORS_CIBLE + Math.max(boite.l, boite.h) * 0.03 + 4
        const largeurEcran = versCss(window.innerWidth)
        const hauteurEcran = versCss(window.innerHeight)
        const nouveau = {
          gauche: Math.max(0, decale.gauche + (marge - boite.x)),
          droite: Math.max(0, decale.droite + (boite.x + boite.l + marge - largeurEcran)),
          bas: Math.max(0, decale.bas + (boite.y + boite.h + marge - hauteurEcran)),
        }
        for (const cote of ['gauche', 'droite', 'bas'] as const) {
          if (Math.abs(nouveau[cote] - decale[cote]) < 0.5) continue
          decale[cote] = nouveau[cote]
          racine.style.setProperty(`--tuto-decale-${cote}`, `${Math.round(decale[cote])}px`)
        }
      }
      const cle = visible ? `${Math.round(boite.x)},${Math.round(boite.y)},${Math.round(boite.l)},${Math.round(boite.h)},${Math.round(boite.arrondi)}` : ''
      if (visible && cle !== derniere && calque.current) {
        derniere = cle
        const style = calque.current.style
        style.setProperty('--x', `${Math.round(boite.x)}px`)
        style.setProperty('--y', `${Math.round(boite.y)}px`)
        style.setProperty('--l', `${Math.round(boite.l)}px`)
        style.setProperty('--h', `${Math.round(boite.h)}px`)
        style.setProperty('--arrondi', `${Math.round(boite.arrondi)}px`)
      }
      // La place de la flèche (une fois par demi-seconde : elle sonde l'écran).
      if (visible && marquee && (placeFleche === null || n % 30 === 2)) {
        if (surBatiment) placeFleche = 'dessus'
        else {
          const centre = r.left + r.width / 2
          const ecran = (px: number) => (px * 100) / Math.max(1, versCss(100)) // px du CSS → écran
          const demi = ecran(48)
          const ecart = ecran(ANNEAU_HORS_CIBLE)
          const hauteurFleche = ecran(92) // la flèche (52 px), son étiquette et le rebond
          if (zoneLibre(marquee, centre - demi, r.top - ecart - hauteurFleche, centre + demi, r.top - ecart)) placeFleche = 'dessus'
          else if (zoneLibre(marquee, centre - demi, r.bottom + ecart, centre + demi, r.bottom + ecart + hauteurFleche)) placeFleche = 'dessous'
          else placeFleche = 'aucune'
        }
      }
      const dessous = visible && placeFleche === 'dessous'
      const sansFleche = visible && placeFleche === 'aucune'
      const sansVoile = visible && !surBatiment && (forme?.debordants.length ?? 0) > 0
      // (27/10) Un bâtiment montré : les bulles du village (« Abordable »...) se cachent, la flèche
      // passerait dessus (et le tutoriel dit déjà quoi faire).
      racine.classList.toggle('tuto-batiment', visible && surBatiment)
      // (27/10) Un bouton montré : sur téléphone, la fenêtre laisse plus de place autour d'elle
      // (paysage.css), pour que l'anneau autour de son ✖ ou de ses boutons reste dans l'écran.
      racine.classList.toggle('tuto-bouton', visible && !surBatiment)
      const enHaut = visible && r.top + r.height / 2 < window.innerHeight * 0.5
      const avant = dernierSuivi.current
      if (visible !== avant.visible || dessous !== avant.dessous || sansFleche !== avant.sansFleche || sansVoile !== avant.sansVoile || enHaut !== avant.enHaut) {
        dernierSuivi.current = { visible, dessous, sansFleche, sansVoile, enHaut }
        setSuivi(dernierSuivi.current)
      }
      image = requestAnimationFrame(suivre)
    }
    image = requestAnimationFrame(suivre)
    return () => {
      cancelAnimationFrame(image)
      marquee?.removeAttribute('data-tuto-actif')
      racine.classList.remove('tuto-batiment', 'tuto-bouton')
      rendreMarge()
      if (marquee instanceof HTMLElement) delete marquee.dataset.tutoMargeBase
      for (const cote of ['gauche', 'droite', 'bas']) racine.style.removeProperty(`--tuto-decale-${cote}`)
    }
  }, [selecteur, calque, surBatiment])
  return selecteur ? suivi : SUIVI_VIDE
}

// Les confettis du « Bravo ! » et de la fenêtre de fin : des petits carrés au contour sombre.
const CONFETTIS = Array.from({ length: 18 }, (_, i) => ({
  x: Math.round(Math.cos((i / 18) * Math.PI * 2) * (90 + (i % 3) * 30)),
  y: Math.round(Math.sin((i / 18) * Math.PI * 2) * (70 + (i % 4) * 20)),
  couleur: ['#f9d65a', '#8fe08f', '#8cc8f5', '#f39aa8', '#b9a0f5'][i % 5],
  retard: (i % 5) * 40,
}))

function Confettis() {
  return (
    <span className="tuto-confettis" aria-hidden="true">
      {CONFETTIS.map((c, i) => (
        <i key={i} style={{ ['--x' as string]: `${c.x}px`, ['--y' as string]: `${c.y}px`, background: c.couleur, animationDelay: `${c.retard}ms` }} />
      ))}
    </span>
  )
}

// Pépite qui parle : son portrait et une bulle.
function Pepite({ children }: { children: React.ReactNode }) {
  return (
    <div className="tuto-pepite-parle">
      <img className="tuto-pepite-portrait" src={PORTRAIT_PEPITE} alt="" draggable={false} />
      <p className="tuto-pepite-bulle">{children}</p>
    </div>
  )
}

// La fenêtre du début : Pépite se présente, et le jeu en 4 étapes.
function Bienvenue({ onSuivant, onPasser }: { onSuivant: () => void; onPasser: () => void }) {
  return (
    <Fenetre
      titre={t('Bienvenue, mineur !')}
      icone="⛏️"
      couleur="jaune"
      taille="petite"
      devant
      fermable={false}
      onFermer={onSuivant}
      classe="tuto-fenetre"
      pied={
        <>
          <button className="btn btn-jaune btn-grand btn-large" onClick={onSuivant} autoFocus>
            {t('C’est parti !')}
          </button>
          <button className="btn btn-blanc btn-petit" onClick={onPasser}>
            {t('Passer le tutoriel')}
          </button>
        </>
      }
    >
      <Pepite>{t('Moi, c’est Pépite ! Creusons ensemble jusqu’au cœur de diamant.')}</Pepite>
      <ol className="tuto-etapes-jeu">
        {ETAPES_DU_JEU.map((e, i) => (
          <li key={e.titre} className="carte" style={{ animationDelay: `${150 + i * 110}ms` }}>
            <span className="tuto-etape-numero">{i + 1}</span>
            <span className="tuto-etape-icone" aria-hidden="true">
              {e.icone}
            </span>
            <span className="tuto-etape-texte">
              <strong>{t(e.titre)}</strong>
              <span className="discret">{t(e.texte)}</span>
            </span>
          </li>
        ))}
      </ol>
    </Fenetre>
  )
}

// La fenêtre de la fin : bravo, et la suite.
function Felicitations({ onSuivant }: { onSuivant: () => void }) {
  return (
    <Fenetre
      titre={t('Bravo, ta mine tourne !')}
      icone="🎉"
      couleur="jaune"
      taille="petite"
      voile="clair"
      fermable={false}
      onFermer={onSuivant}
      classe="tuto-fenetre"
      pied={
        <button className="btn btn-jaune btn-grand btn-large" onClick={onSuivant} autoFocus>
          {t('À moi de jouer !')}
        </button>
      }
    >
      <Confettis />
      <Pepite>{t('Ton mineur creuse pour toi, même quand tu ne joues pas. Maintenant, tu es libre !')}</Pepite>
      <ul className="tuto-suite">
        <li className="carte">☑️ {t('Ta liste de tâches (en haut à droite) te donne des idées.')}</li>
        <li className="carte">⭐ {t('Chaque niveau débloque des bâtiments et rapporte des gemmes.')}</li>
        <li className="carte">🛤️ {t('Plus tard : des rails jusqu’au marché, et tout se vend tout seul.')}</li>
      </ul>
    </Fenetre>
  )
}

export function Tutoriel({ etat, ui, onSuivant, onPasser }: Props) {
  const etape = etapeTutoriel(etat)
  const [confirmer, setConfirmer] = useState(false)
  // « Bravo ! » au milieu de l'écran quand une étape est réussie (avec une petite fanfare).
  const [fete, setFete] = useState(0)
  const avant = useRef(etape)
  useEffect(() => {
    const precedente = avant.current
    avant.current = etape
    // (pas au début : le bonjour n'est pas une action ; pas à la fin : la fenêtre fait déjà la fête)
    if (precedente === null || etape === null || etape === precedente || precedente === 'bonjour' || etape === 'bravo') return
    sons.succes()
    const debut = window.setTimeout(() => setFete((n) => n + 1), 0)
    const fin = window.setTimeout(() => setFete(0), 1300)
    return () => {
      clearTimeout(debut)
      clearTimeout(fin)
    }
  }, [etape])
  const c = etape ? consigne(etape, etat, ui) : null
  // Un bâtiment a une grande image (avec du vide autour) : la flèche montre son milieu, sans voile.
  const surBatiment = c?.cible?.startsWith('[data-cible') ?? false
  const calque = useRef<HTMLDivElement>(null)
  const suivi = useSuiviCible(c?.cible ?? null, calque, surBatiment)
  if (!etape || !c) return null

  const fenetrePasser = confirmer && (
    <Confirmation
      titre={t('Passer le tutoriel ?')}
      texteConfirmer={t('Passer')}
      onConfirmer={() => {
        setConfirmer(false)
        onPasser()
      }}
      onAnnuler={() => setConfirmer(false)}
    >
      {t('Tu pourras toujours suivre ta liste de tâches, en haut à droite.')}
    </Confirmation>
  )

  if (etape === 'bonjour') {
    return (
      <>
        <Bienvenue onSuivant={onSuivant} onPasser={() => setConfirmer(true)} />
        {fenetrePasser}
      </>
    )
  }
  if (etape === 'bravo') return <Felicitations onSuivant={onSuivant} />

  // Les étapes avec une action (sans le bonjour ni le bravo).
  const etapesAction = ETAPES_TUTORIEL.slice(1, -1)
  const numero = etapesAction.indexOf(etape) + 1
  return (
    <>
      {/* Le calque doré : toujours là (caché tant que la cible n'est pas trouvée), déplacé par
          useSuiviCible sans repasser par React. */}
      {c.cible && (
        <div
          ref={calque}
          className={`tuto-cible ${suivi.visible ? '' : 'tuto-cible-cachee'} ${surBatiment ? 'tuto-sur-batiment' : ''} ${suivi.dessous ? 'tuto-cible-dessous' : ''} ${suivi.sansFleche ? 'tuto-sans-fleche' : ''} ${suivi.sansVoile ? 'tuto-sans-voile' : ''}`}
          aria-hidden="true"
        >
          {/* Le voile sombre autour de la cible (immobile), puis l'anneau doré qui pulse. */}
          <div className="tuto-trou" />
          <div className="tuto-cercle" />
          <div className="tuto-fleche-place">
            <div className="tuto-fleche">
              <span className="tuto-fleche-dessin">
                <svg viewBox="0 0 40 48" width="44" height="52">
                  <path d="M13 3 h14 v20 h9 L20 45 L4 23 h9 Z" fill="#f9d65a" stroke="#2a2140" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </span>
              {c.geste && <span className="tuto-geste">{c.geste}</span>}
            </div>
          </div>
        </div>
      )}
      <section key={`${etape}-${c.titre.split(':')[0]}`} className={`tuto-carte ${suivi.enHaut ? 'tuto-carte-en-bas' : ''}`} role="status" aria-live="polite" aria-label={t('Tutoriel')}>
        <img className="tuto-carte-pepite" src={PORTRAIT_PEPITE} alt="" draggable={false} />
        <div className="tuto-carte-texte">
          <div className="tuto-progression" aria-label={t('Étape {n} sur {max}', { n: numero, max: etapesAction.length })}>
            {etapesAction.map((e, i) => (
              <i key={e} className={i + 1 < numero ? 'faite' : i + 1 === numero ? 'en-cours' : ''} />
            ))}
          </div>
          <strong className="tuto-titre">{c.titre}</strong>
          <p className="tuto-texte">{c.texte}</p>
        </div>
        <button className="tuto-passer" onClick={() => setConfirmer(true)} aria-label={t('Passer le tutoriel')} title={t('Passer le tutoriel')}>
          ✖
        </button>
      </section>
      {fete > 0 && (
        <div key={fete} className="tuto-fete" aria-hidden="true">
          <Confettis />
          <span className="tuto-fete-texte">✔ {t('Bravo !')}</span>
        </div>
      )}
      {fenetrePasser}
    </>
  )
}
