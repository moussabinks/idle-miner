// Les textes à traduire (25/10).
//
// Ce script lit tout le code du jeu (src/**/*.ts et *.tsx, sans les tests) et y cherche :
//   1. les appels à t() dont le premier argument est un texte écrit en entier :
//        t('Vends le coffre de la mine')
//        t("Pas assez d'argent")
//        t(`Plein !`)              (un texte entre accents graves, mais sans ${...})
//   2. les textes des tables de données : les propriétés « nom », « titre », « texte »,
//      « description » et « detail » écrites avec un texte, par exemple dans donnees.ts :
//        pierre: { id: 'pierre', nom: 'Pierre', ... }
//      L'interface les traduit au moment de les afficher : t(BLOCS[bloc].nom).
//
// Puis il compare avec la traduction anglaise (src/jeu/traductions/en.ts) et affiche (27/10 : aussi
// les textes pas encore traduits en espagnol, es.ts, et en portugais, pt.ts) :
//   - les textes qui n'ont pas encore de traduction anglaise ;
//   - les traductions qui ne servent plus (le texte français a changé ou a disparu).
//
// Utilisation :
//   npm run traductions                 affiche le bilan
//   npm run traductions -- --ecrire     écrit aussi outils/traductions/manquantes.json : les
//                                       textes à traduire, prêts à recopier dans en.ts
//   npm run traductions -- --verifier   s'arrête en erreur s'il manque des traductions
//                                       (pour plus tard, quand tout sera traduit)
//
// Pas de bibliothèque : on lit le code nous-mêmes, avec un petit « lecteur » qui sait sauter les
// commentaires et reconnaître les textes entre guillemets.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DOSSIER_SOURCES = join(RACINE, 'src')
const FICHIER_ANGLAIS = join(RACINE, 'src', 'jeu', 'traductions', 'en.ts')
const FICHIER_MANQUANTES = join(RACINE, 'outils', 'traductions', 'manquantes.json')

// Les propriétés des tables de données dont le texte est montré au joueur.
const PROPRIETES_TEXTE = ['nom', 'titre', 'texte', 'description', 'detail']

// ---------------------------------------------------------------------------
// Trouver les fichiers
// ---------------------------------------------------------------------------

// Tous les fichiers .ts et .tsx d'un dossier (et de ses sous-dossiers), sauf les tests et les
// traductions elles-mêmes.
function fichiersDuCode(dossier) {
  const liste = []
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name)
    if (entree.isDirectory()) {
      if (chemin === dirname(FICHIER_ANGLAIS)) continue
      liste.push(...fichiersDuCode(chemin))
    } else if (/\.tsx?$/.test(entree.name) && !/\.test\.tsx?$/.test(entree.name) && !entree.name.endsWith('.d.ts')) {
      liste.push(chemin)
    }
  }
  return liste
}

// ---------------------------------------------------------------------------
// Lire le code
// ---------------------------------------------------------------------------

// Remplace les commentaires par des espaces (en gardant les retours à la ligne, pour que les
// numéros de ligne restent justes). Les textes entre guillemets sont gardés tels quels : un
// « // » dans un texte n'est pas un commentaire.
function sansCommentaires(code) {
  let resultat = ''
  let i = 0
  // La pile des accents graves ouverts : dans un `texte ${ ... }`, on revient au code pendant
  // le ${ ... }, puis au texte à la fermeture de l'accolade. « accolades » compte les { } du code
  // à l'intérieur du ${ ... }.
  const pile = []
  let dansGabarit = false
  while (i < code.length) {
    const c = code[i]
    if (dansGabarit) {
      // Dans un texte entre accents graves.
      if (c === '\\') {
        resultat += code.slice(i, i + 2)
        i += 2
      } else if (c === '`') {
        resultat += c
        i++
        dansGabarit = false
      } else if (c === '$' && code[i + 1] === '{') {
        resultat += '${'
        i += 2
        pile.push(0)
        dansGabarit = false
      } else {
        resultat += c
        i++
      }
      continue
    }
    if (c === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') {
        resultat += ' '
        i++
      }
    } else if (c === '/' && code[i + 1] === '*') {
      const fin = code.indexOf('*/', i + 2)
      const bout = code.slice(i, fin === -1 ? code.length : fin + 2)
      resultat += bout.replace(/[^\n]/g, ' ')
      i += bout.length
    } else if (c === "'" || c === '"') {
      const fin = finDuTexte(code, i)
      resultat += code.slice(i, fin)
      i = fin
    } else if (c === '`') {
      resultat += c
      i++
      dansGabarit = true
    } else if (c === '{' && pile.length > 0) {
      pile[pile.length - 1]++
      resultat += c
      i++
    } else if (c === '}' && pile.length > 0) {
      resultat += c
      i++
      if (pile[pile.length - 1] === 0) {
        pile.pop()
        dansGabarit = true
      } else pile[pile.length - 1]--
    } else {
      resultat += c
      i++
    }
  }
  return resultat
}

// La position juste après le texte entre guillemets qui commence à « debut ».
function finDuTexte(code, debut) {
  const guillemet = code[debut]
  let i = debut + 1
  while (i < code.length && code[i] !== guillemet && code[i] !== '\n') i += code[i] === '\\' ? 2 : 1
  return i + 1
}

// Le texte écrit à cette position (entre ' ', " " ou ` ` sans ${...}), ou null s'il n'y a pas
// de texte écrit en entier ici (une variable, un calcul...).
function texteA(code, debut) {
  const guillemet = code[debut]
  if (guillemet !== "'" && guillemet !== '"' && guillemet !== '`') return null
  let texte = ''
  let i = debut + 1
  while (i < code.length && code[i] !== guillemet) {
    if (guillemet === '`' && code[i] === '$' && code[i + 1] === '{') return null
    if (code[i] === '\\') {
      const suivant = code[i + 1]
      const echappements = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '`': '`', $: '$' }
      if (suivant === 'u' && code[i + 2] === '{') {
        const fin = code.indexOf('}', i)
        texte += String.fromCodePoint(parseInt(code.slice(i + 3, fin), 16))
        i = fin + 1
      } else if (suivant === 'u') {
        texte += String.fromCharCode(parseInt(code.slice(i + 2, i + 6), 16))
        i += 6
      } else {
        texte += echappements[suivant] ?? suivant
        i += 2
      }
    } else {
      texte += code[i]
      i++
    }
  }
  // Le texte doit continuer par la fin de l'argument : une virgule ou une parenthèse (sinon,
  // c'est un calcul, comme t('a' + b), qu'on ne sait pas lire).
  return { texte, fin: i + 1 }
}

function numeroDeLigne(code, position) {
  return code.slice(0, position).split('\n').length
}

// Les textes d'un fichier : ceux passés à t(), ceux des tables de données, et les appels à t()
// qu'on ne sait pas lire (un texte avec ${...} : il faut le réécrire avec des {trous}).
function textesDuFichier(chemin) {
  const code = sansCommentaires(readFileSync(chemin, 'utf8'))
  const appels = []
  const tables = []
  const illisibles = []

  // 1. Les appels à t( (pas « objet.t( » ni « dict( »).
  for (const trouve of code.matchAll(/(?<![\w$.])t\(\s*/g)) {
    const debut = trouve.index + trouve[0].length
    const lu = texteA(code, debut)
    const ligne = numeroDeLigne(code, trouve.index)
    if (lu === null) {
      if (code[debut] === '`') illisibles.push({ ligne, extrait: code.slice(debut, debut + 60).split('\n')[0] })
      continue
    }
    const apres = code.slice(lu.fin).trimStart()[0]
    if (apres === ',' || apres === ')') appels.push({ texte: lu.texte, ligne })
  }

  // 2. Les textes des tables de données : « nom: 'Pierre' ».
  const motif = new RegExp(`(?<![\\w$.])(?:${PROPRIETES_TEXTE.join('|')})\\s*:\\s*`, 'g')
  for (const trouve of code.matchAll(motif)) {
    const debut = trouve.index + trouve[0].length
    const lu = texteA(code, debut)
    if (lu === null || !/\p{L}/u.test(lu.texte)) continue // pas de lettre : rien à traduire (« $ »)
    const apres = code.slice(lu.fin).trimStart()[0]
    if (apres === ',' || apres === '}' || apres === undefined) tables.push({ texte: lu.texte, ligne: numeroDeLigne(code, trouve.index) })
  }
  return { appels, tables, illisibles }
}

// Les clés d'une traduction : chaque texte suivi de « : » dans son fichier (en.ts par défaut).
function clesAnglaises(fichier = FICHIER_ANGLAIS, table = 'TRADUCTIONS_EN') {
  const code = sansCommentaires(readFileSync(fichier, 'utf8'))
  const cles = new Set()
  const debutObjet = code.indexOf('{', code.indexOf(table))
  let i = debutObjet + 1
  while (i < code.length) {
    const c = code[i]
    if (c === "'" || c === '"' || c === '`') {
      const lu = texteA(code, i)
      const fin = lu ? lu.fin : finDuTexte(code, i)
      if (lu && code.slice(fin).trimStart()[0] === ':') cles.add(lu.texte)
      i = fin
    } else i++
  }
  return cles
}

// ---------------------------------------------------------------------------
// Le bilan
// ---------------------------------------------------------------------------

const arguments_ = process.argv.slice(2)
const textes = new Map() // texte -> les endroits où il est écrit (« src/App.tsx:12 »)
const illisibles = []
let nbAppels = 0
let nbTables = 0

for (const chemin of fichiersDuCode(DOSSIER_SOURCES)) {
  const fichier = relative(RACINE, chemin).split('\\').join('/')
  const trouves = textesDuFichier(chemin)
  for (const { texte, ligne } of [...trouves.appels, ...trouves.tables]) {
    if (!textes.has(texte)) textes.set(texte, [])
    textes.get(texte).push(`${fichier}:${ligne}`)
  }
  nbAppels += trouves.appels.length
  nbTables += trouves.tables.length
  for (const i of trouves.illisibles) illisibles.push(`${fichier}:${i.ligne}  t(${i.extrait}...`)
}

const traduits = clesAnglaises()
const manquants = [...textes.keys()].filter((texte) => !traduits.has(texte)).sort((a, b) => a.localeCompare(b, 'fr'))
const inutiles = [...traduits].filter((texte) => !textes.has(texte)).sort((a, b) => a.localeCompare(b, 'fr'))

console.log(`Textes trouvés : ${textes.size} différents (${nbAppels} appels à t(), ${nbTables} textes de tables de données).`)
console.log(`Traductions anglaises : ${traduits.size}.`)
console.log('')

if (manquants.length > 0) {
  console.log(`❌ ${manquants.length} texte(s) sans traduction anglaise :`)
  for (const texte of manquants) console.log(`   ${JSON.stringify(texte)}   (${textes.get(texte)[0]})`)
  console.log('')
}
if (inutiles.length > 0) {
  console.log(`🗑️ ${inutiles.length} traduction(s) qui ne servent plus (à enlever de en.ts) :`)
  for (const texte of inutiles) console.log(`   ${JSON.stringify(texte)}`)
  console.log('')
}
if (illisibles.length > 0) {
  console.log(`⚠️ ${illisibles.length} appel(s) à t() avec \${...} dans le texte : à réécrire avec des {trous}.`)
  for (const ligne of illisibles) console.log(`   ${ligne}`)
  console.log('')
}
// (27/10) L'espagnol et le portugais : les textes qui n'y sont pas encore traduits.
let manquantsAutres = 0
for (const [nom, fichier, table] of [
  ['espagnole', 'es.ts', 'TRADUCTIONS_ES'],
  ['portugaise', 'pt.ts', 'TRADUCTIONS_PT'],
]) {
  const cles = clesAnglaises(join(dirname(FICHIER_ANGLAIS), fichier), table)
  const sans = [...textes.keys()].filter((texte) => !cles.has(texte))
  manquantsAutres += sans.length
  if (sans.length > 0) {
    console.log(`❌ ${sans.length} texte(s) sans traduction ${nom} (${fichier}) :`)
    for (const texte of sans.slice(0, 30)) console.log(`   ${JSON.stringify(texte)}`)
    if (sans.length > 30) console.log(`   ... et ${sans.length - 30} autres`)
    console.log('')
  }
}
if (manquants.length === 0 && inutiles.length === 0 && manquantsAutres === 0) console.log('✅ Tout est traduit.')

if (arguments_.includes('--ecrire')) {
  const aTraduire = Object.fromEntries(manquants.map((texte) => [texte, '']))
  writeFileSync(FICHIER_MANQUANTES, JSON.stringify(aTraduire, null, 2) + '\n')
  console.log(`📝 Écrit : ${relative(RACINE, FICHIER_MANQUANTES)} (${manquants.length} textes à traduire).`)
}
if (arguments_.includes('--verifier') && manquants.length + manquantsAutres > 0) process.exit(1)
