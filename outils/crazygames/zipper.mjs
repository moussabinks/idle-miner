// (27/10) Met la version CrazyGames (le dossier dist-crazygames/) dans un fichier ZIP prêt à
// envoyer sur leur portail développeur : mega-digger-crazygames.zip, à la racine du projet.
// index.html est à la racine du ZIP (pas dans un sous-dossier), comme CrazyGames le demande.
//
// Lancé tout seul par « npm run build:crazygames ». Pas de module à installer : on écrit le ZIP
// nous-mêmes (le format est simple : chaque fichier compressé, puis un sommaire à la fin).

import { deflateRawSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const DOSSIER = 'dist-crazygames'
const ZIP = 'mega-digger-crazygames.zip'

// Tous les fichiers du dossier, sous-dossiers compris.
function lister(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    return statSync(chemin).isDirectory() ? lister(chemin) : [chemin]
  })
}

// Le « CRC-32 » : une empreinte du fichier, que le ZIP demande pour vérifier qu'il n'est pas abîmé.
const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(octets) {
  let crc = 0xffffffff
  for (const octet of octets) crc = TABLE_CRC[(crc ^ octet) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const morceaux = [] // les fichiers, l'un après l'autre
const sommaire = [] // la fiche de chaque fichier, à la fin du ZIP
let position = 0

for (const chemin of lister(DOSSIER)) {
  const nom = Buffer.from(relative(DOSSIER, chemin).split(sep).join('/'))
  const contenu = readFileSync(chemin)
  const compresse = deflateRawSync(contenu, { level: 9 })
  const crc = crc32(contenu)

  // L'en-tête de chaque fichier.
  const entete = Buffer.alloc(30)
  entete.writeUInt32LE(0x04034b50, 0) // signature
  entete.writeUInt16LE(20, 4) // version du format
  entete.writeUInt16LE(0x0800, 6) // noms en UTF-8
  entete.writeUInt16LE(8, 8) // compression « deflate »
  entete.writeUInt32LE(0, 10) // date et heure : sans importance
  entete.writeUInt32LE(crc, 14)
  entete.writeUInt32LE(compresse.length, 18)
  entete.writeUInt32LE(contenu.length, 22)
  entete.writeUInt16LE(nom.length, 26)
  entete.writeUInt16LE(0, 28)
  morceaux.push(entete, nom, compresse)

  // Sa fiche dans le sommaire.
  const fiche = Buffer.alloc(46)
  fiche.writeUInt32LE(0x02014b50, 0)
  fiche.writeUInt16LE(20, 4)
  fiche.writeUInt16LE(20, 6)
  fiche.writeUInt16LE(0x0800, 8)
  fiche.writeUInt16LE(8, 10)
  fiche.writeUInt32LE(0, 12)
  fiche.writeUInt32LE(crc, 16)
  fiche.writeUInt32LE(compresse.length, 20)
  fiche.writeUInt32LE(contenu.length, 24)
  fiche.writeUInt16LE(nom.length, 28)
  fiche.writeUInt32LE(position, 42) // où commence le fichier dans le ZIP
  sommaire.push(fiche, nom)

  position += entete.length + nom.length + compresse.length
}

// La fin du ZIP : où trouver le sommaire, et combien de fichiers.
const tailleSommaire = sommaire.reduce((total, b) => total + b.length, 0)
const nbFichiers = sommaire.length / 2
const fin = Buffer.alloc(22)
fin.writeUInt32LE(0x06054b50, 0)
fin.writeUInt16LE(nbFichiers, 8)
fin.writeUInt16LE(nbFichiers, 10)
fin.writeUInt32LE(tailleSommaire, 12)
fin.writeUInt32LE(position, 16)

const zip = Buffer.concat([...morceaux, ...sommaire, fin])
writeFileSync(ZIP, zip)
console.log(`${ZIP} : ${nbFichiers} fichiers, ${(zip.length / 1024 / 1024).toFixed(2)} Mo`)
