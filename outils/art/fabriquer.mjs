// Fabrique tous les dessins du village en SVG (25/10, le style cartoon) : les bâtiments, la mine
// et ses calques, les caisses de l'ascenseur, l'icône des rails, les arbres, et (25/10) les
// collines et les montagnes du paysage autour de la clairière.
//
// Lancer depuis la racine du projet :   node outils/art/fabriquer.mjs
//
// Le script écrit les fichiers dans public/images/, puis affiche les « calages » (la taille de
// chaque dessin et les coins de son emprise au sol) : s'ils ont changé, les recopier dans
// src/composants/iso.ts (CALAGES), src/composants/arbres.ts (ARBRES), src/composants/paysage.ts
// (VIGNETTES, EAU_CASCADE) et, pour la mine, dans
// src/composants/DessinsVillage.tsx (POINTS_MINE, CAISSE...). Voir LISEZMOI.md.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { employes, fonderie, forgeron, foreuse, generateur, iconeRails, joaillerie, marche } from './batiments.mjs'
import { mine } from './mine.mjs'
import { arbres } from './arbres.mjs'
import { montagnes } from './montagnes.mjs'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BATIMENTS = join(RACINE, 'public/images/batiments')
const ARBRES = join(RACINE, 'public/images/village/arbres')
const PAYSAGE = join(RACINE, 'public/images/village/paysage')

function ecrire(dossier, nom, contenu) {
  mkdirSync(dossier, { recursive: true })
  writeFileSync(join(dossier, nom), contenu)
}

// Les bâtiments de 5 × 5 cases.
const calages = {}
for (const [id, fichier, dessiner] of [
  ['marche', 'marche.svg', marche],
  ['forgeron', 'forgeron.svg', forgeron],
  ['employes', 'employes.svg', employes],
  ['foreuse', 'foreuse.svg', foreuse],
  ['generateur', 'generateur.svg', generateur],
  ['fonderie', 'fonderie.svg', fonderie], // (26/10)
  ['joaillerie', 'joaillerie.svg', joaillerie], // (26/10)
]) {
  const toile = dessiner()
  ecrire(BATIMENTS, fichier, toile.svg())
  calages[id] = toile.calage()
}
// (26/10) La foreuse en marche : le même dessin, mais la mèche tourne.
ecrire(BATIMENTS, 'foreuse-active.svg', foreuse({ enMarche: true }).svg())
// (26/10) La fonderie en marche : le feu danse, le creuset verse le métal fondu, la fumée monte.
ecrire(BATIMENTS, 'fonderie-active.svg', fonderie({ enMarche: true }).svg())
ecrire(BATIMENTS, 'rails.svg', iconeRails().svg())

// La mine, son calque de devant et les caisses de l'ascenseur.
const laMine = mine()
ecrire(BATIMENTS, 'mine.svg', laMine.fond.svg())
ecrire(BATIMENTS, 'mine-devant.svg', laMine.devant.svg())
laMine.caisses.forEach((svg, n) => ecrire(BATIMENTS, `caisse-ascenseur-${n}.svg`, svg))
calages.puits = laMine.fond.calage()

// Les arbres.
const lesArbres = arbres()
for (const arbre of lesArbres) ecrire(ARBRES, `${arbre.nom}.svg`, arbre.svg)

// Le paysage : les collines et les montagnes (après les arbres : ils partagent un compteur).
const lePaysage = montagnes()
for (const vignette of lePaysage) ecrire(PAYSAGE, `${vignette.nom}.svg`, vignette.svg)

// Les chiffres à recopier dans le jeu.
console.log('CALAGES (src/composants/iso.ts) :')
for (const [id, c] of Object.entries(calages)) {
  console.log(`  ${id}: { largeur: ${c.largeur}, hauteur: ${c.hauteur}, gauche: { x: ${c.gauche.x}, y: ${c.gauche.y} }, bas: { x: ${c.bas.x}, y: ${c.bas.y} }, droite: { x: ${c.droite.x}, y: ${c.droite.y} } },`)
}
console.log('\nLA MINE (src/composants/DessinsVillage.tsx) :')
console.log(JSON.stringify(laMine.points, null, 1).replace(/\n\s*/g, ' '))
console.log('\nARBRES (src/composants/arbres.ts) :')
for (const a of lesArbres) {
  console.log(`  { nom: '${a.nom}', largeur: ${a.largeur}, hauteur: ${a.hauteur}, pied: { x: ${a.pied.x}, y: ${a.pied.y} }, largeurPied: ${a.largeurPied} },`)
}
console.log('\nPAYSAGE (src/composants/paysage.ts, VIGNETTES) :')
for (const v of lePaysage) {
  console.log(`  '${v.nom}': vignette('${v.nom}', ${v.largeur}, ${v.hauteur}, ${v.pied.x}, ${v.pied.y}),`)
  if (v.cascade) console.log(`  (EAU_CASCADE) { x: ${v.cascade.x}, y: ${v.cascade.y}, largeur: ${v.cascade.largeur}, hauteur: ${v.cascade.hauteur} }`)
}
