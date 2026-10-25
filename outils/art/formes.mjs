// Les outils de dessin partagés par tous les dessins du village (bâtiments, arbres...) : la
// palette, les teintes, et une petite « toile » isométrique qui sait dessiner des boîtes, des
// toits, des cylindres... en vue du ciel, exactement à l'angle des cases du jeu.
//
// Le style (25/10) : des aplats de couleur (une seule teinte plus sombre par face, jamais de
// dégradé ni de flou), un contour bleu nuit épais partout, des formes rondes et simples.

// ---------------------------------------------------------------------------
// La palette (la même que l'interface du jeu)
// ---------------------------------------------------------------------------

export const C = {
  encre: '#2a2140', // le contour de tout
  creme: '#fdf6e3',
  blanc: '#ffffff',
  herbe: '#8fd36f',
  herbeClaire: '#a6e08a',
  herbeFoncee: '#74bf57',
  feuillage: '#5fbf6a',
  feuillageFonce: '#4aa65a',
  tronc: '#9a6a45',
  bois: '#c98a55',
  boisFonce: '#9a6237',
  pierre: '#c9ccd6',
  pierreFoncee: '#a9adbb',
  toit: '#ee6b6b',
  jaune: '#f9d65a',
  bleu: '#8cc8f5',
  rose: '#f39aa8',
  violet: '#a77df0',
  orange: '#f6a04d',
  metal: '#b8c0cc',
  // les minerais
  charbon: '#3d3a46',
  fer: '#e7d3c0',
  redstone: '#e2483d',
  or: '#f9d65a',
  emeraude: '#3ccf7a',
  diamant: '#5fe0e6',
}

// Mélanger deux couleurs « #rrggbb » (t = 0 : la première, t = 1 : la seconde).
export function melanger(a, b, t) {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const canal = (d) => Math.round(((na >> d) & 255) * (1 - t) + ((nb >> d) & 255) * t)
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}

// Une teinte plus sombre (on la mélange avec l'encre : les ombres restent dans la même famille de
// couleurs que les contours) ou plus claire (avec du blanc).
export const fonce = (c, t = 0.2) => melanger(c, C.encre, t)
export const clair = (c, t = 0.3) => melanger(c, C.blanc, t)

// Les trois teintes d'un volume : le dessus (éclairé), la face de gauche (la couleur elle-même)
// et la face de droite (à l'ombre). La lumière vient d'en haut à gauche.
export function teintes(base, sombre = fonce(base), dessus = clair(base, 0.25)) {
  return { haut: dessus, gauche: base, droite: sombre }
}

// Un nombre arrondi à 0,1 près (pour que les fichiers restent courts).
export const r1 = (n) => Math.round(n * 10) / 10
export const points = (liste) => liste.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')

// ---------------------------------------------------------------------------
// La toile isométrique
// ---------------------------------------------------------------------------

// Les dessins sont faits 2 fois plus grands que le monde du jeu (S = 2) : une case y fait 66
// pixels de large sur 38,28 de haut (dans le jeu : 33 × 19,14, voir src/composants/iso.ts).
export const S = 2
export const DX = 16.5 * S // la moitié de la largeur d'une case
export const DY = 9.57 * S // la moitié de sa hauteur
// L'épaisseur du contour : 6 pixels du dessin, soit 3 pixels à l'écran au zoom 1.
export const TRAIT = 6
export const TRAIT_FIN = 4

// Pour savoir si une face se voit, il faut la vraie forme 3D : une case fait 46,67 pixels de côté
// « en vrai », et la vue est penchée de 35,5° (la hauteur est donc un peu écrasée à l'écran).
const COTE_CASE = DX * Math.SQRT2
const ECRASEMENT_HAUTEUR = 0.8146
// La direction d'où l'on regarde (vers la caméra), en vrai 3D.
const REGARD = { x: 0.576, y: 0.576, z: 0.58 }

export class Toile {
  // taille : la largeur de l'emprise, en cases (5 pour un bâtiment, 10 pour la mine).
  // haut : la place au-dessus du coin du haut de l'emprise (pour les toits, les cheminées...).
  constructor({ taille, haut, marge = 12, bas = 12 }) {
    this.taille = taille
    this.marge = marge
    this.ox = marge + taille * DX // le coin du haut de l'emprise (la case 0, 0)
    this.oy = haut
    this.largeur = Math.round(2 * taille * DX + 2 * marge)
    this.hauteur = Math.round(haut + 2 * taille * DY + bas)
    this.morceaux = []
    this.defs = []
    this.nbIds = 0
  }

  // Un point de la grille (x, y en cases, z en pixels vers le haut) → un point du dessin.
  pt(x, y, z = 0) {
    return [this.ox + (x - y) * DX, this.oy + (x + y) * DY - z]
  }

  // Le calage pour le jeu (src/composants/iso.ts) : la taille du dessin et les trois coins de
  // son emprise au sol (gauche, bas, droite).
  calage() {
    const n = this.taille
    return {
      largeur: this.largeur,
      hauteur: this.hauteur,
      gauche: { x: r1(this.marge), y: r1(this.oy + n * DY) },
      bas: { x: r1(this.ox), y: r1(this.oy + 2 * n * DY) },
      droite: { x: r1(this.marge + 2 * n * DX), y: r1(this.oy + n * DY) },
    }
  }

  ajouter(svg) {
    this.morceaux.push(svg)
  }

  // Un identifiant unique dans ce dessin (pour les clipPath).
  nouvelId(prefixe) {
    this.nbIds += 1
    return `${prefixe}${this.nbIds}`
  }

  // Un polygone de points 3D, rempli, avec son contour.
  poly(points3, couleur, { trait = TRAIT, contour = C.encre } = {}) {
    const p = points3.map(([x, y, z]) => this.pt(x, y, z))
    this.ajouter(polygone(p, couleur, trait, contour))
  }

  // Une ligne entre deux points 3D (fine, sans contour).
  ligne(a, b, couleur, largeur = TRAIT_FIN) {
    const [x1, y1] = this.pt(...a)
    const [x2, y2] = this.pt(...b)
    this.ajouter(`<path d="M${r1(x1)} ${r1(y1)} L${r1(x2)} ${r1(y2)}" stroke="${couleur}" stroke-width="${largeur}" fill="none"/>`)
  }

  // Une poutre ronde vue de loin : un gros trait d'encre, puis la couleur par-dessus.
  poutre(a, b, couleur, largeur = 10) {
    const [x1, y1] = this.pt(...a)
    const [x2, y2] = this.pt(...b)
    const d = `M${r1(x1)} ${r1(y1)} L${r1(x2)} ${r1(y2)}`
    this.ajouter(`<path d="${d}" stroke="${C.encre}" stroke-width="${largeur + 2 * TRAIT}" fill="none"/>`)
    this.ajouter(`<path d="${d}" stroke="${couleur}" stroke-width="${largeur}" fill="none"/>`)
  }

  // Un volume convexe (une boîte, un toit, un cristal...) : ses sommets 3D et ses faces (des listes
  // d'indices). On ne dessine que les faces tournées vers nous, chacune de sa teinte : le dessus
  // (presque à plat), la face de gauche ou celle de droite.
  volume(sommets, faces, t, { trait = TRAIT } = {}) {
    const vrai = sommets.map(([x, y, z]) => ({ x: x * COTE_CASE, y: y * COTE_CASE, z: z / ECRASEMENT_HAUTEUR }))
    const centre = vrai.reduce((s, p) => ({ x: s.x + p.x / vrai.length, y: s.y + p.y / vrai.length, z: s.z + p.z / vrai.length }), { x: 0, y: 0, z: 0 })
    for (const face of faces) {
      const [a, b, c] = face.map((i) => vrai[i])
      const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
      const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z }
      let n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x }
      const longueur = Math.hypot(n.x, n.y, n.z) || 1
      n = { x: n.x / longueur, y: n.y / longueur, z: n.z / longueur }
      // La normale doit sortir du volume.
      const milieu = face.reduce((s, i) => ({ x: s.x + vrai[i].x / face.length, y: s.y + vrai[i].y / face.length, z: s.z + vrai[i].z / face.length }), { x: 0, y: 0, z: 0 })
      if (n.x * (milieu.x - centre.x) + n.y * (milieu.y - centre.y) + n.z * (milieu.z - centre.z) < 0) n = { x: -n.x, y: -n.y, z: -n.z }
      if (n.x * REGARD.x + n.y * REGARD.y + n.z * REGARD.z <= 0.01) continue // tournée vers l'arrière
      const couleur = n.z > 0.85 ? t.haut : n.y >= n.x ? t.gauche : t.droite
      this.poly(
        face.map((i) => sommets[i]),
        couleur,
        { trait },
      )
    }
  }

  // Un prisme droit : un polygone de base (en cases, convexe), monté de z0 à z1.
  prisme(base, z0, z1, t, options) {
    const n = base.length
    const sommets = [...base.map(([x, y]) => [x, y, z0]), ...base.map(([x, y]) => [x, y, z1])]
    const faces = [base.map((_, i) => n + i)]
    for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i])
    this.volume(sommets, faces, t, options)
  }

  // Une boîte alignée sur la grille, de (x0, y0) à (x1, y1), de la hauteur z0 à z1.
  boite(x0, y0, x1, y1, z0, z1, t, options) {
    this.prisme(
      [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ],
      z0,
      z1,
      t,
      options,
    )
  }

  // Une pyramide (ou un cristal pointu) : une base à la hauteur z0, et une pointe.
  pyramide(base, z0, pointe, t, options) {
    const n = base.length
    const sommets = [...base.map(([x, y]) => [x, y, z0]), pointe]
    const faces = [base.map((_, i) => i)]
    for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n])
    this.volume(sommets, faces, t, options)
  }

  // Un toit à deux pentes. Le faîte (la ligne du haut) va dans le sens des x (« x ») ou des y.
  // L'emprise du toit : de (x0, y0) à (x1, y1), le bas des pentes à zBas, le faîte à zHaut.
  toit(x0, y0, x1, y1, zBas, zHaut, sens, t, options) {
    let sommets
    if (sens === 'x') {
      const ym = (y0 + y1) / 2
      sommets = [
        [x0, y0, zBas],
        [x1, y0, zBas],
        [x1, y1, zBas],
        [x0, y1, zBas],
        [x0, ym, zHaut],
        [x1, ym, zHaut],
      ]
    } else {
      const xm = (x0 + x1) / 2
      sommets = [
        [x0, y0, zBas],
        [x1, y0, zBas],
        [x1, y1, zBas],
        [x0, y1, zBas],
        [xm, y0, zHaut],
        [xm, y1, zHaut],
      ]
    }
    // Seulement les deux pentes : le pignon (le mur en triangle sous le toit) se dessine à part,
    // de la couleur du mur. (Le centre du volume, pour savoir où est « dehors », compte quand même
    // tous les sommets.)
    const faces =
      sens === 'x'
        ? [
            [0, 1, 5, 4], // la pente du fond
            [3, 2, 5, 4], // la pente de devant
          ]
        : [
            [0, 3, 5, 4],
            [1, 2, 5, 4],
          ]
    this.volume(sommets, faces, t, options)
  }

  // Un cylindre debout (un tonneau, un tuyau, une tour) : centre (cx, cy), rayon r en cases.
  cylindre(cx, cy, r, z0, z1, t, { trait = TRAIT, cerclages = [] } = {}) {
    const [xb, yb] = this.pt(cx, cy, z0)
    const [, yh] = this.pt(cx, cy, z1)
    const rx = r * DX * Math.SQRT2
    const ry = r * DY * Math.SQRT2
    const corps = `M${r1(xb - rx)} ${r1(yh)} L${r1(xb - rx)} ${r1(yb)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(xb + rx)} ${r1(yb)} L${r1(xb + rx)} ${r1(yh)} Z`
    const id = this.nouvelId('cyl')
    this.defs.push(`<clipPath id="${id}"><path d="${corps}"/></clipPath>`)
    this.ajouter(`<path d="${corps}" fill="${t.gauche}"/>`)
    // Le côté droit, à l'ombre.
    this.ajouter(`<rect x="${r1(xb + rx * 0.3)}" y="${r1(yh - ry)}" width="${r1(rx)}" height="${r1(yb - yh + 2 * ry)}" fill="${t.droite}" clip-path="url(#${id})"/>`)
    // Des cerclages (un tonneau) : des bandes à ces hauteurs.
    for (const zc of cerclages) {
      const [, yc] = this.pt(cx, cy, zc)
      this.ajouter(`<path d="M${r1(xb - rx)} ${r1(yc)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(xb + rx)} ${r1(yc)}" stroke="${C.encre}" stroke-width="${TRAIT_FIN}" fill="none" clip-path="url(#${id})"/>`)
    }
    this.ajouter(`<path d="${corps}" fill="none" stroke="${C.encre}" stroke-width="${trait}"/>`)
    this.ajouter(`<ellipse cx="${r1(xb)}" cy="${r1(yh)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${t.haut}" stroke="${C.encre}" stroke-width="${trait}"/>`)
  }

  // Une ellipse posée à plat (un trou, une flaque, une ombre) : centre (cx, cy), rayon r en cases.
  ellipseSol(cx, cy, r, z, couleur, { trait = TRAIT } = {}) {
    const [x, y] = this.pt(cx, cy, z)
    const contour = trait ? ` stroke="${C.encre}" stroke-width="${trait}"` : ''
    this.ajouter(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * DX * Math.SQRT2)}" ry="${r1(r * DY * Math.SQRT2)}" fill="${couleur}"${contour}/>`)
  }

  // Dessiner « à plat » sur une façade : sur la face de gauche (y constant, tournée vers le bas à
  // gauche) ou de droite (x constant). Le point (x, y, z) est l'origine du dessin ; une unité du
  // dessin suit la façade vers la droite de l'écran, et y vers le bas est vers le bas.
  surFace(cote, x, y, z, contenu) {
    const [ex, ey] = this.pt(x, y, z)
    const pente = cote === 'gauche' ? 0.502 : -0.502
    this.ajouter(`<g transform="matrix(0.865 ${pente} 0 1 ${r1(ex)} ${r1(ey)})">${contenu}</g>`)
  }

  // Le fichier SVG complet (avec une largeur et une hauteur : le jeu dessine les arbres dans des
  // « canvas », qui ont besoin de connaître la taille de l'image).
  svg() {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.largeur}" height="${this.hauteur}" viewBox="0 0 ${this.largeur} ${this.hauteur}" stroke-linejoin="round" stroke-linecap="round">` +
      `${defs}${this.morceaux.join('')}</svg>\n`
    )
  }
}

// Un polygone en points du dessin (déjà projetés), rempli, avec son contour.
export function polygone(p, couleur, trait = TRAIT, contour = C.encre) {
  const bord = trait ? ` stroke="${contour}" stroke-width="${trait}"` : ''
  return `<polygon points="${points(p)}" fill="${couleur}"${bord}/>`
}

// Un hasard à graine (toujours les mêmes nombres pour la même graine), comme dans le jeu.
export function hasardAvecGraine(graine) {
  let etat = graine >>> 0
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Un rocher tout rond (un galet cabossé), en points du dessin : son pied au milieu en (x, y).
// Deux teintes : le corps (à l'ombre) et le dessus éclairé, un peu décalé vers la lumière.
export function rocher(x, y, largeur, hauteur, graine, couleur = C.pierre, trait = TRAIT) {
  const hasard = hasardAvecGraine(graine)
  const n = 9
  const contour = []
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI // de la gauche à la droite, par le haut
    const k = 0.85 + hasard() * 0.25
    contour.push([x + Math.cos(a) * (largeur / 2) * k, y - hauteur * 0.15 + Math.sin(a) * hauteur * 0.85 * k])
  }
  contour.push([x + largeur * 0.42, y], [x - largeur * 0.42, y])
  const eclaire = contour.map(([px, py]) => [x - largeur * 0.1 + (px - x) * 0.72, y - hauteur * 0.22 + (py - y) * 0.72])
  return polygone(contour, fonce(couleur, 0.18), 0) + polygone(eclaire, couleur, 0) + polygone(contour, 'none', trait)
}
