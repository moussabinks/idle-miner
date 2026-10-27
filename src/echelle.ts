// L'interface réduite d'un bloc sur les petits écrans d'ordinateur (27/10, demandé par le
// propriétaire).
//
// Le jeu est dessiné pour un écran d'au moins 800 px de haut. Dans une fenêtre plus basse, à la
// souris (le petit cadre de CrazyGames, environ 1000 × 525 ; un portable), on ne change PAS la
// disposition : toute la page est réduite d'un bloc (la propriété CSS « zoom » sur <html>), comme
// si on regardait un écran de 800 px de haut de plus loin. Les fenêtres, les boutons, le tutoriel
// sont exactement les mêmes qu'en plein écran, juste plus petits.
// Au doigt (téléphone), rien ne change : paysage.css a sa propre disposition.
//
// Le zoom change deux choses pour le code :
//   - les unités d'écran (vh, vw) du CSS seraient réduites aussi : on donne au CSS la vraie taille
//     de l'écran « agrandi » dans --vh et --vw (theme.css s'en sert) ;
//   - les positions données par le navigateur (clientX, getBoundingClientRect) sont celles de
//     l'écran, alors que les positions qu'on écrit dans le CSS (left, translate...) sont réduites
//     par le zoom : versCss() les convertit (la carte du village, le tutoriel).

const HAUTEUR_VOULUE = 800 // px : en dessous, à la souris, l'interface est réduite

let zoom = 1
// Le rapport entre les positions de l'écran et celles du CSS, mesuré (selon le navigateur, il
// vaut le zoom, ou 1 s'il donne déjà les positions du CSS).
let facteur = 1

// Une position de l'écran (clientX, getBoundingClientRect) → une position du CSS.
export function versCss(valeur: number): number {
  return valeur / facteur
}

function appliquer(): void {
  const racine = document.documentElement
  const souris = window.matchMedia('(pointer: fine)').matches
  zoom = souris && window.innerHeight < HAUTEUR_VOULUE ? window.innerHeight / HAUTEUR_VOULUE : 1
  racine.style.setProperty('zoom', zoom === 1 ? '' : String(zoom))
  // Les quelques règles de l'accueil qui dépendent de la largeur suivent celle de l'interface
  // (voir accueil.css) : les media queries, elles, voient toujours la vraie fenêtre.
  const largeur = window.innerWidth / zoom
  racine.classList.toggle('interface-reduite', zoom !== 1)
  racine.classList.toggle('largeur-1240', zoom !== 1 && largeur <= 1240)
  racine.classList.toggle('largeur-960', zoom !== 1 && largeur <= 960)
  if (zoom === 1) {
    racine.style.removeProperty('--vh')
    racine.style.removeProperty('--vw')
    facteur = 1
    return
  }
  racine.style.setProperty('--vh', `${window.innerHeight / zoom / 100}px`)
  racine.style.setProperty('--vw', `${window.innerWidth / zoom / 100}px`)
  // On mesure ce que le navigateur fait vraiment : une boîte de 100 px du CSS, à l'écran.
  const sonde = document.createElement('div')
  sonde.style.cssText = 'position:absolute;left:0;top:0;width:100px;height:1px;visibility:hidden;pointer-events:none'
  document.body.appendChild(sonde)
  facteur = sonde.getBoundingClientRect().width / 100 || 1
  sonde.remove()
}

// Au démarrage, puis à chaque changement de taille de la fenêtre.
export function initialiserEchelle(): void {
  appliquer()
  window.addEventListener('resize', appliquer)
}
