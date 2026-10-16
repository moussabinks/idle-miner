// Petites icônes en pixel art (12 × 12), dans le style du jeu, pour les stands du village.
// Chaque dessin est une liste de lignes : une lettre = un pixel, '.' = transparent.
// Les couleurs de chaque lettre sont dans PALETTE.

export type NomIcone = 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'foreuse' | 'cadenas'

const PALETTE: Record<string, string> = {
  K: '#1a1a1a', // contour
  Y: '#f5c518', // or
  y: '#c8960c', // or foncé
  W: '#fff6c0', // reflet
  G: '#8a8f99', // fer
  g: '#5a5f68', // fer foncé
  w: '#d4d8de', // fer clair
  B: '#8a5a2b', // cuir
  L: '#b07a3f', // cuir clair
  R: '#b8282c', // rouge
  r: '#7a1518', // rouge foncé
  p: '#5b2fa0', // violet (écriture magique)
  C: '#4ee8dc', // diamant
  O: '#2a1a3a', // obsidienne
  D: '#efe6cf', // papier
}

const DESSINS: Record<NomIcone, string[]> = {
  // Une pile de pièces d'or
  marche: [
    '....KKKK....',
    '...KYYYYK...',
    '..KYWYYyYK..',
    '..KYYyyYYK..',
    '...KKKKKK...',
    '..KYYYYYYK..',
    '.KYWYYYYyYK.',
    '.KYYYyyYYyK.',
    '.KKKKKKKKKK.',
    'KYYYYYYYYYYK',
    'KYWYYYYYYyyK',
    'KKKKKKKKKKKK',
  ],
  // Une enclume
  forgeron: [
    '............',
    'KKKKKKKKKK..',
    'KwwwwwwwwGKK',
    'KGGGGGGGGGGK',
    '.KKGGGGGGKK.',
    '...KGGGgK...',
    '...KGGGgK...',
    '...KGGGgK...',
    '..KGGGGGgK..',
    '.KGGGGGGGgK.',
    '.KggggggggK.',
    '.KKKKKKKKKK.',
  ],
  // Un sac à dos
  bazar: [
    '....KKKK....',
    '...KB..BK...',
    '..KKKKKKKK..',
    '.KLLLLLLLBK.',
    '.KLKKKKKKBK.',
    '.KLKYYYYKBK.',
    '.KLKKKKKKBK.',
    '.KLLLLLLLBK.',
    '.KLLLLLLLBK.',
    '.KLLLLLLLBK.',
    '.KBBBBBBBBK.',
    '..KKKKKKKK..',
  ],
  // Une table d'enchantement : un livre ouvert sur un bloc d'obsidienne
  enchanteur: [
    '..KKKK.KKKK.',
    '.KDDDDKDDDDK',
    '.KDppDKDppDK',
    '.KDDDDKDDDDK',
    '..KRRRKRRRK.',
    'KKKKKKKKKKKK',
    'KrRRRRRRRRrK',
    'KCOOOOOOOOCK',
    'KOOOOOOOOOOK',
    'KOOpOOOOpOOK',
    'KOOOOOOOOOOK',
    'KKKKKKKKKKKK',
  ],
  // Une foreuse : un moteur jaune et une mèche en fer
  foreuse: [
    '..KKKKKK....',
    '.KYYYYYYK...',
    '.KYKKKKYK...',
    '.KYKggKYKKKK',
    '.KYKggKYGGGK',
    '.KYYYYYYKwGK',
    '..KKKKKKKGK.',
    '....KGGGGK..',
    '....KwGGK...',
    '.....KGK....',
    '.....KwK....',
    '......K.....',
  ],
  // Un cadenas
  cadenas: [
    '...KKKKKK...',
    '..KG....GK..',
    '..KG....GK..',
    '..KG....GK..',
    '.KKKKKKKKKK.',
    '.KYYYYYYYYK.',
    '.KYWYYYYyYK.',
    '.KYYYKKYYyK.',
    '.KYYYKKYYyK.',
    '.KYYYYYYYyK.',
    '.KyyyyyyyyK.',
    '.KKKKKKKKKK.',
  ],
}

export function IconePixel({ nom, taille = 32 }: { nom: NomIcone; taille?: number }) {
  const pixels: { x: number; y: number; couleur: string }[] = []
  DESSINS[nom].forEach((ligne, y) => {
    for (let x = 0; x < ligne.length; x++) {
      const couleur = PALETTE[ligne[x]]
      if (couleur) pixels.push({ x, y, couleur })
    }
  })

  return (
    <svg className="icone-pixel" width={taille} height={taille} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((p) => (
        <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width="1" height="1" fill={p.couleur} />
      ))}
    </svg>
  )
}
