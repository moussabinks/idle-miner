// De petits outils pour donner du relief aux dessins du village (24/10). La lumière vient
// d'en haut à gauche, comme sur les bâtiments : ce qui regarde en haut à gauche est plus clair,
// ce qui regarde en bas à droite est plus sombre.

import { nuance } from './couleurs'

// Une boule en volume (un buisson, le feuillage d'un arbre, une fleur) : le côté à l'ombre, la
// partie éclairée un peu décalée vers la lumière, et un petit reflet.
export function Boule({ cx, cy, r, couleur, contour = true, reflet = true }: { cx: number; cy: number; r: number; couleur: string; contour?: boolean; reflet?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={nuance(couleur, 0.72)} stroke={contour ? 'rgb(0 0 0 / 0.32)' : 'none'} strokeWidth={contour ? 1.1 : 0} />
      <circle cx={cx - r * 0.12} cy={cy - r * 0.12} r={r * 0.84} fill={couleur} />
      <circle cx={cx - r * 0.24} cy={cy - r * 0.26} r={r * 0.5} fill={nuance(couleur, 1.12)} opacity="0.8" />
      {reflet && <ellipse cx={cx - r * 0.4} cy={cy - r * 0.46} rx={r * 0.22} ry={r * 0.14} fill="#ffffff" opacity="0.35" />}
    </g>
  )
}

// Une ombre douce posée au sol, un peu vers la droite (la lumière vient de la gauche).
export function OmbreAuSol({ cx, cy, rx, ry, force = 0.26 }: { cx: number; cy: number; rx: number; ry: number; force?: number }) {
  return (
    <g>
      <ellipse cx={cx + rx * 0.12} cy={cy} rx={rx} ry={ry} fill={`rgb(0 0 0 / ${force * 0.6})`} />
      <ellipse cx={cx + rx * 0.08} cy={cy} rx={rx * 0.7} ry={ry * 0.7} fill={`rgb(0 0 0 / ${force * 0.6})`} />
    </g>
  )
}
