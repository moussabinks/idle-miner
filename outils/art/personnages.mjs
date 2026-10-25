// Les personnages du jeu (25/10) : des TAUPES, dessinées en SVG dans le style cartoon du jeu
// (aplats de couleur, contours bleu nuit épais, formes rondes, ni dégradé ni flou).
//
// Ce script écrit :
//   - les images du village (public/images/personnages/sprites/) : le joueur et un mineur de
//     chaque rareté, vus de devant, de derrière, de gauche et de droite ; le manager et le
//     recruteur, vus de face ;
//   - les trois portraits ronds (public/images/personnages/) : Pépite (mineur.svg), le manager
//     et le recruteur.
//
// Usage : node outils/art/personnages.mjs
//
// Toutes les images du village ont le même cadre (LARGEUR × HAUTEUR), et les pieds au même
// endroit (PIED) : c'est le calage à recopier dans src/composants/sprites.ts.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DOSSIER_SPRITES = join(RACINE, 'public/images/personnages/sprites')
const DOSSIER_PORTRAITS = join(RACINE, 'public/images/personnages')

// --- Le cadre des images du village ------------------------------------------------------------
// On dessine autour de x = 60 (le milieu du personnage) ; le cadre déborde de MARGE de chaque
// côté, pour la pioche et le porte-voix.
const MILIEU = 60
const MARGE = 8
export const LARGEUR = 2 * (MILIEU + MARGE)
export const HAUTEUR = 132
export const PIED = { x: MILIEU + MARGE, y: 127 } // le point du sol entre les deux pieds (dans l'image)

// --- La palette ----------------------------------------------------------------------------------
const ENCRE = '#2a2140' // les contours
const BLANC = '#ffffff'
const CREME = '#fdf6e3'
const POIL = '#7a6a7e' // le pelage de la taupe
const POIL_FONCE = '#5e5063' // les pieds, le dos
const POIL_CLAIR = '#a597a6' // le ventre et le museau
const ROSE = '#f39aa8' // le nez, les mains
const ROSE_CLAIR = '#f8bcc5' // les joues
const JAUNE = '#f9d65a'
const BOIS = '#c98a55'
const BOIS_FONCE = '#9a6237'
const METAL = '#b8c0cc'
const METAL_FONCE = '#8d96a5'

// La couleur du casque : jaune pour le joueur, celle de la rareté pour les mineurs
// (les mêmes que RARETES dans src/jeu/donnees.ts).
const CASQUES = {
  joueur: '#f9d65a',
  commun: '#b9b4ab',
  rare: '#4f9df0',
  epique: '#b06cf0',
  legendaire: '#f5a524',
  mythique: '#ff4d8d',
}

const TRAIT = 4.5 // l'épaisseur des contours (en unités de l'image)

// Une couleur un peu plus foncée (la seule « ombre » permise : un aplat plus foncé).
function assombrir(hex, facteur = 0.78) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v) => Math.round(v * facteur).toString(16).padStart(2, '0')
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`
}

// Un nombre court dans le SVG (deux chiffres après la virgule au plus).
const n = (v) => String(Math.round(v * 100) / 100)

// --- Les petites briques -------------------------------------------------------------------------
const ellipse = (cx, cy, rx, ry, couleur, trait = TRAIT) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${couleur}"${trait ? ` stroke="${ENCRE}" stroke-width="${trait}"` : ''}/>`
const rond = (cx, cy, r, couleur, trait = TRAIT) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${couleur}"${trait ? ` stroke="${ENCRE}" stroke-width="${trait}"` : ''}/>`
const chemin = (d, couleur, trait = TRAIT) => `<path d="${d}" fill="${couleur}"${trait ? ` stroke="${ENCRE}" stroke-width="${trait}"` : ''}/>`
const ligne = (d, epaisseur = 3, couleur = ENCRE) => `<path d="${d}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}"/>`

// Un œil : un grand rond blanc, la pupille noire (décalée vers où il regarde) et un reflet.
function oeil(cx, cy, r, regard = { x: 0, y: 0.15 }) {
  const px = cx + regard.x * r * 0.42
  const py = cy + regard.y * r * 0.42
  return rond(cx, cy, r, BLANC, TRAIT * 0.8) + rond(px, py, r * 0.5, ENCRE, 0) + rond(px + r * 0.2, py - r * 0.22, r * 0.17, BLANC, 0)
}

// Une main de taupe : une grosse patte rose, et trois petites griffes.
function main(cx, cy, r = 8.5) {
  return (
    ellipse(cx, cy, r, r * 0.9, ROSE) +
    ligne(`M${n(cx - r * 0.4)} ${n(cy + r * 0.25)}v${n(r * 0.55)}M${n(cx)} ${n(cy + r * 0.35)}v${n(r * 0.55)}M${n(cx + r * 0.4)} ${n(cy + r * 0.25)}v${n(r * 0.55)}`, 2.2)
  )
}

// Une pioche : le manche (du bas « b » au haut « h ») et le fer, recourbé, en travers du haut.
function pioche(bx, by, hx, hy, demiFer = 17) {
  const l = Math.hypot(hx - bx, hy - by)
  const d = { x: (hx - bx) / l, y: (hy - by) / l } // vers le haut du manche
  const p = { x: -d.y, y: d.x } // en travers
  // Les deux pointes du fer, un peu rabattues vers le bas du manche.
  const pointe = (s) => ({ x: hx + s * p.x * demiFer - d.x * 6, y: hy + s * p.y * demiFer - d.y * 6 })
  const a = pointe(1)
  const b = pointe(-1)
  const dessus = { x: hx + d.x * 7, y: hy + d.y * 7 }
  const dessous = { x: hx - d.x * 1, y: hy - d.y * 1 }
  const manche =
    ligne(`M${n(bx)} ${n(by)}L${n(hx)} ${n(hy)}`, 9.5) + // le contour du manche
    ligne(`M${n(bx)} ${n(by)}L${n(hx)} ${n(hy)}`, 4.5, BOIS)
  const fer = chemin(
    `M${n(a.x)} ${n(a.y)}Q${n(dessus.x + p.x * 6)} ${n(dessus.y + p.y * 6)} ${n(dessus.x)} ${n(dessus.y)}` +
      `Q${n(dessus.x - p.x * 6)} ${n(dessus.y - p.y * 6)} ${n(b.x)} ${n(b.y)}` +
      `Q${n(dessous.x - p.x * 5)} ${n(dessous.y - p.y * 5)} ${n(dessous.x)} ${n(dessous.y)}` +
      `Q${n(dessous.x + p.x * 5)} ${n(dessous.y + p.y * 5)} ${n(a.x)} ${n(a.y)}Z`,
    METAL,
    TRAIT * 0.85,
  )
  // La bague qui tient le fer sur le manche.
  const bague = rond(hx, hy + 0, 3.2, METAL_FONCE, 2.4)
  return manche + fer + bague
}

// Le casque de mineur, vu de face (« decalage » : le regard part vers la droite, en 3/4).
function casque(couleur, { cx = 60, decalage = 0, lampe = true, dos = false } = {}) {
  const fonce = assombrir(couleur)
  const g = cx - 33
  const d = cx + 33
  const dome = chemin(`M${n(g)} 54C${n(g)} 20 ${n(d)} 20 ${n(d)} 54Z`, couleur)
  // De dos : une bande plus foncée au milieu du casque (sa crête).
  const crete = dos ? `<rect x="${n(cx - 4.5)}" y="30" width="9" height="20" fill="${fonce}"/>` : ''
  const domeContour = ligne(`M${n(g)} 54C${n(g)} 20 ${n(d)} 20 ${n(d)} 54`, TRAIT)
  // La visière : plus longue du côté où il regarde.
  const visiere = `<rect x="${n(g - 6 + Math.min(0, decalage) * 0.3)}" y="48.5" width="${n(78 + Math.abs(decalage) * 0.3)}" height="9" rx="4.5" fill="${fonce}" stroke="${ENCRE}" stroke-width="${TRAIT}"/>`
  let morceaux = dome + crete + domeContour + visiere
  if (lampe) {
    const lx = cx + decalage
    morceaux += `<rect x="${n(lx - 8)}" y="34" width="16" height="12" rx="3" fill="${METAL_FONCE}" stroke="${ENCRE}" stroke-width="${TRAIT * 0.8}"/>`
    morceaux += rond(lx, 37, 8, JAUNE) + rond(lx - 2.3, 34.8, 2.6, BLANC, 0)
  }
  if (dos) {
    // Derrière : la pile de la lampe, accrochée au casque.
    morceaux += `<rect x="${n(cx - 8)}" y="36" width="16" height="10" rx="3" fill="${METAL_FONCE}" stroke="${ENCRE}" stroke-width="${TRAIT * 0.8}"/>`
  }
  return morceaux
}

// --- Les vues d'un mineur --------------------------------------------------------------------
// Toutes dans le même cadre (LARGEUR × HAUTEUR), les pieds en PIED.

// De face : il nous regarde, la pioche sur l'épaule.
function mineurDevant(couleurCasque) {
  return [
    pioche(96, 112, 101, 34),
    ellipse(46, 121, 12, 6.5, POIL_FONCE), // les pieds
    ellipse(74, 121, 12, 6.5, POIL_FONCE),
    ellipse(60, 82, 35, 42, POIL), // le corps (et la tête : une taupe n'a pas de cou)
    ellipse(60, 101, 21, 18, POIL_CLAIR, 0), // le ventre
    ellipse(60, 80, 15, 9.5, POIL_CLAIR, 0), // le museau
    ellipse(41, 78, 5, 3.2, ROSE_CLAIR, 0), // les joues
    ellipse(79, 78, 5, 3.2, ROSE_CLAIR, 0),
    oeil(49.5, 66, 9),
    oeil(70.5, 66, 9),
    ellipse(60, 76.5, 7.5, 5.5, ROSE, TRAIT * 0.75), // le nez
    rond(57.8, 75, 1.7, BLANC, 0),
    ligne('M54.5 85Q60 89.5 65.5 85', 2.8), // le sourire
    main(26, 97), // les mains
    main(95, 99),
    casque(couleurCasque),
  ].join('')
}

// De dos : la pioche en travers du dos, la petite queue rose.
function mineurDerriere(couleurCasque) {
  return [
    ellipse(46, 121, 12, 6.5, POIL_FONCE),
    ellipse(74, 121, 12, 6.5, POIL_FONCE),
    ellipse(60, 82, 35, 42, POIL),
    ellipse(60, 92, 25, 24, assombrir(POIL, 0.9), 0), // le dos, un peu plus foncé
    ellipse(60, 117, 4.5, 4, ROSE, TRAIT * 0.7), // la queue
    main(94, 97),
    casque(couleurCasque, { lampe: false, dos: true }),
    pioche(88, 113, 24, 42), // accrochée en travers du dos
    main(26, 97),
  ].join('')
}

// De 3/4, il vient vers nous en allant vers la droite de l'écran (la vue « droite »).
function mineurDroite(couleurCasque) {
  return [
    pioche(56, 98, 24, 36), // sur l'épaule de derrière
    ellipse(47, 120, 11.5, 6.2, POIL_FONCE), // le pied de derrière
    ellipse(60, 82, 34, 42, POIL),
    ellipse(67, 101, 18, 18, POIL_CLAIR, 0),
    ellipse(84, 81, 13, 9, POIL_CLAIR, 0),
    ellipse(68, 79, 4.5, 3, ROSE_CLAIR, 0),
    oeil(65, 66, 9, { x: 0.55, y: 0.15 }),
    oeil(84, 65.5, 7.8, { x: 0.55, y: 0.15 }),
    ellipse(95, 77, 7.5, 5.5, ROSE, TRAIT * 0.75), // le nez, qui dépasse du profil
    rond(93, 75.5, 1.7, BLANC, 0),
    ligne('M80 86Q86 90 91.5 85.5', 2.8),
    main(31, 92), // la main de derrière tient la pioche
    ellipse(76, 122, 12.5, 6.5, POIL_FONCE), // le pied de devant
    main(90, 101), // la main de devant se balance
    casque(couleurCasque, { cx: 62, decalage: 14 }),
  ].join('')
}

// --- Le manager et le recruteur (de face, à leur poste) -----------------------------------------

// Une tête de taupe sans casque : une petite houppe de poils sur le dessus.
function houppe(cx = 60) {
  return chemin(`M${n(cx - 8)} 44Q${n(cx - 6)} 32 ${n(cx - 1)} 36Q${n(cx)} 28 ${n(cx + 4)} 35Q${n(cx + 9)} 31 ${n(cx + 8)} 44Z`, POIL)
}

function visage({ lunettes = false, bouche = 'sourire' } = {}) {
  const yeux = lunettes
    ? // Des lunettes rondes : un cercle d'encre autour de chaque œil, et le pont entre les deux.
      rond(49, 64, 11.5, CREME, TRAIT * 0.9) + rond(71, 64, 11.5, CREME, TRAIT * 0.9) + ligne('M60.5 62.5Q60 60.5 59.5 62.5', 3) + oeil(49, 64.5, 7.5) + oeil(71, 64.5, 7.5)
    : oeil(49.5, 64, 9) + oeil(70.5, 64, 9)
  const sourire = bouche === 'ouverte' ? chemin('M53.5 83Q60 92 66.5 83Z', '#c9506a', 2.8) : ligne('M54.5 84Q60 88.5 65.5 84', 2.8)
  return [
    ellipse(60, 79, 15, 9.5, POIL_CLAIR, 0),
    ellipse(40.5, 77, 5, 3.2, ROSE_CLAIR, 0),
    ellipse(79.5, 77, 5, 3.2, ROSE_CLAIR, 0),
    yeux,
    ellipse(60, 75.5, 7.5, 5.5, ROSE, TRAIT * 0.75),
    rond(57.8, 74, 1.7, BLANC, 0),
    sourire,
  ].join('')
}

// Le manager : chemise blanche, cravate rouge, petites lunettes, et son bloc-notes.
function managerDevant() {
  return [
    ellipse(46, 121, 12, 6.5, POIL_FONCE),
    ellipse(74, 121, 12, 6.5, POIL_FONCE),
    houppe(),
    ellipse(60, 84, 35, 40, POIL),
    // Le gilet bleu nuit, puis le plastron blanc en V et la cravate.
    chemin('M29 96Q32 120 60 123Q88 120 91 96L74 92L60 112L46 92Z', '#4c5a9e', TRAIT * 0.8),
    chemin('M46 92L60 112L74 92Z', BLANC, TRAIT * 0.8),
    chemin('M56.5 92.5L63.5 92.5L62 96L65 107L60 112L55 107L58 96Z', '#e8505b', TRAIT * 0.7),
    rond(60, 117, 1.8, JAUNE, 1.6),
    visage({ lunettes: true }),
    // Le bloc-notes, tenu contre lui (à gauche de l'écran).
    `<g transform="rotate(-8 21 97)">`,
    `<rect x="8" y="80" width="27" height="34" rx="3" fill="${BOIS}" stroke="${ENCRE}" stroke-width="${TRAIT}"/>`,
    `<rect x="12" y="86" width="19" height="24" rx="1.5" fill="${CREME}" stroke="${ENCRE}" stroke-width="2.4"/>`,
    ligne('M15 92.5h12M15 98h13M15 103.5h9', 2.4),
    `<rect x="16" y="78" width="11" height="6" rx="2" fill="${METAL}" stroke="${ENCRE}" stroke-width="2.6"/>`,
    `</g>`,
    main(31, 104),
    main(93, 99),
  ].join('')
}

// Le recruteur : une casquette verte, un badge, et son porte-voix pour appeler les recrues.
function recruteurDevant() {
  const vert = '#5cc46b'
  return [
    ellipse(46, 121, 12, 6.5, POIL_FONCE),
    ellipse(74, 121, 12, 6.5, POIL_FONCE),
    ellipse(60, 84, 35, 40, POIL),
    ellipse(60, 102, 21, 17, POIL_CLAIR, 0),
    // La sacoche en bandoulière.
    ligne('M33 70L84 112', 9.5),
    ligne('M33 70L84 112', 4.5, BOIS_FONCE),
    `<rect x="74" y="103" width="20" height="16" rx="3" fill="${BOIS}" stroke="${ENCRE}" stroke-width="${TRAIT}"/>`,
    ligne('M74 109h20', 2.4),
    visage({ bouche: 'ouverte' }),
    // Le badge (une étoile).
    chemin('M42 96l2.5 5 5.5.6-4 3.8 1 5.4-5-2.6-5 2.6 1-5.4-4-3.8 5.5-.6Z', JAUNE, 2.4),
    // La casquette, mise de côté : la calotte, son bandeau, et la visière qui part sur le côté.
    chemin('M31 51L7 53Q4 58 9 59L31 57Z', assombrir(vert)),
    chemin('M28 54C28 24 92 24 92 54Z', vert),
    `<rect x="26" y="48.5" width="68" height="7.5" rx="3.75" fill="${assombrir(vert)}" stroke="${ENCRE}" stroke-width="${TRAIT}"/>`,
    rond(60, 26.5, 3.5, assombrir(vert), 2.4),
    // Le porte-voix, levé (à droite de l'écran).
    chemin('M93 84L112 64L118 82L98 92Z', '#ef6b5b'),
    chemin('M110.5 63L119.5 81.5', 'none', TRAIT),
    `<g transform="rotate(-24 115 72.5)">${ellipse(115, 72.5, 4, 10.5, CREME)}</g>`,
    main(94, 92),
    main(26, 98),
  ].join('')
}

// --- Les portraits (dans un rond de 64 à 84 pixels : on montre la tête et les épaules) -----------

// Pépite, la mascotte du tutoriel : une taupe mineuse toute contente, qui salue, sa pioche levée.
function portraitPepite() {
  return [
    pioche(98, 118, 104, 40, 19),
    ellipse(60, 84, 37, 42, POIL),
    ellipse(60, 104, 22, 16, POIL_CLAIR, 0),
    visage({ bouche: 'ouverte' }),
    main(96, 100, 9.5),
    // La main qui salue, levée près de la joue.
    ellipse(22, 74, 9.5, 9, ROSE),
    ligne('M17 66.5v-5M22 65.5v-5.5M27 66.5v-5', 2.2),
    casque(CASQUES.joueur),
    // Une petite étincelle à côté de la lampe.
    chemin('M84 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z', BLANC, 2.2),
  ].join('')
}

// --- L'écriture des fichiers --------------------------------------------------------------------

function svg(contenu, largeur, hauteur, viewBox = `${-MARGE} 0 ${largeur} ${hauteur}`) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${largeur}" height="${hauteur}">` +
    `<g stroke-linejoin="round" stroke-linecap="round">${contenu}</g></svg>\n`
  )
}

// Retourner un dessin en miroir autour du milieu du cadre (la vue « gauche » = « droite » en miroir).
const miroir = (contenu) => `<g transform="matrix(-1 0 0 1 ${2 * MILIEU} 0)">${contenu}</g>`

function ecrire(fichier, texte) {
  mkdirSync(dirname(fichier), { recursive: true })
  writeFileSync(fichier, texte)
  console.log('écrit', fichier.replace(RACINE + '/', ''))
}

export function toutEcrire() {
  for (const [qui, couleur] of Object.entries(CASQUES)) {
    const nom = qui === 'joueur' ? 'joueur' : `mineur_${qui}`
    const vues = {
      devant: mineurDevant(couleur),
      derriere: mineurDerriere(couleur),
      droite: mineurDroite(couleur),
      gauche: miroir(mineurDroite(couleur)),
    }
    for (const [vue, contenu] of Object.entries(vues)) ecrire(join(DOSSIER_SPRITES, `${nom}_${vue}.svg`), svg(contenu, LARGEUR, HAUTEUR))
  }
  ecrire(join(DOSSIER_SPRITES, 'manager_devant.svg'), svg(managerDevant(), LARGEUR, HAUTEUR))
  ecrire(join(DOSSIER_SPRITES, 'recruteur_devant.svg'), svg(recruteurDevant(), LARGEUR, HAUTEUR))
  // Les portraits : un carré autour de la tête et des épaules.
  ecrire(join(DOSSIER_PORTRAITS, 'mineur.svg'), svg(portraitPepite(), 200, 200, '10 14 100 100'))
  ecrire(join(DOSSIER_PORTRAITS, 'manager.svg'), svg(managerDevant(), 200, 200, '12 24 96 96'))
  ecrire(join(DOSSIER_PORTRAITS, 'recruteur.svg'), svg(recruteurDevant(), 200, 200, '8 16 104 104'))
}

toutEcrire()
