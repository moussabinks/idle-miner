# Les briques pour dessiner les icônes (27/10) : des formes simples (cercles, rectangles arrondis,
# polygones, chemins SVG) qu'on assemble en couches de couleur.
#
# On dessine dans un carré de 100 × 100 (x vers la droite, y vers le bas, comme en SVG). Les
# formes sont des chemins skia-pathops : on peut les additionner (union), les soustraire, et en
# faire le contour (stroke), ce qui donne le gros trait foncé des dessins animés.

import math

import pathops
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

# Le nombre magique pour faire un quart de cercle avec une courbe de Bézier.
K = 0.5522847498


def _ellipse(pen, cx, cy, rx, ry):
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + K * ry), (cx + K * rx, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - K * rx, cy + ry), (cx - rx, cy + K * ry), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - K * ry), (cx - K * rx, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + K * rx, cy - ry), (cx + rx, cy - K * ry), (cx + rx, cy))
    pen.closePath()


def _nouveau():
    return pathops.Path()


def tourne(chemin, angle, cx=50, cy=50):
    """Le même chemin, tourné de « angle » degrés autour de (cx, cy)."""
    a = math.radians(angle)
    c, s = math.cos(a), math.sin(a)
    resultat = _nouveau()
    t = (c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy)
    chemin.draw(TransformPen(resultat.getPen(), t))
    return resultat


def deplace(chemin, dx, dy):
    resultat = _nouveau()
    chemin.draw(TransformPen(resultat.getPen(), (1, 0, 0, 1, dx, dy)))
    return resultat


def echelle(chemin, sx, sy=None, cx=50, cy=50):
    sy = sx if sy is None else sy
    resultat = _nouveau()
    chemin.draw(TransformPen(resultat.getPen(), (sx, 0, 0, sy, cx - sx * cx, cy - sy * cy)))
    return resultat


def miroir(chemin, cx=50):
    """Retourné de gauche à droite."""
    return echelle(chemin, -1, 1, cx, 50)


def cercle(cx, cy, r):
    p = _nouveau()
    _ellipse(p.getPen(), cx, cy, r, r)
    return p


def ellipse(cx, cy, rx, ry, angle=0):
    p = _nouveau()
    _ellipse(p.getPen(), cx, cy, rx, ry)
    return tourne(p, angle, cx, cy) if angle else p


def rect(x, y, l, h, r=0, angle=0):
    """Un rectangle (coins arrondis de rayon r)."""
    p = _nouveau()
    pen = p.getPen()
    r = min(r, l / 2, h / 2)
    if r <= 0:
        pen.moveTo((x, y))
        pen.lineTo((x + l, y))
        pen.lineTo((x + l, y + h))
        pen.lineTo((x, y + h))
        pen.closePath()
    else:
        k = K * r
        pen.moveTo((x + r, y))
        pen.lineTo((x + l - r, y))
        pen.curveTo((x + l - r + k, y), (x + l, y + r - k), (x + l, y + r))
        pen.lineTo((x + l, y + h - r))
        pen.curveTo((x + l, y + h - r + k), (x + l - r + k, y + h), (x + l - r, y + h))
        pen.lineTo((x + r, y + h))
        pen.curveTo((x + r - k, y + h), (x, y + h - r + k), (x, y + h - r))
        pen.lineTo((x, y + r))
        pen.curveTo((x, y + r - k), (x + r - k, y), (x + r, y))
        pen.closePath()
    return tourne(p, angle, x + l / 2, y + h / 2) if angle else p


def poly(*points, arrondi=0):
    """Un polygone. Avec « arrondi », ses coins sont adoucis (on l'épaissit puis l'amincit)."""
    p = _nouveau()
    pen = p.getPen()
    pen.moveTo(points[0])
    for pt in points[1:]:
        pen.lineTo(pt)
    pen.closePath()
    if arrondi:
        p = arrondir(p, arrondi)
    return p


def svg(d):
    """Un chemin écrit comme en SVG (« M 10 10 L 20 20 ... Z »)."""
    p = _nouveau()
    parse_path(d, p.getPen())
    return union(p)


def trait(points, epaisseur, bouts='rond'):
    """Une ligne épaisse qui passe par ces points (bouts ronds)."""
    p = _nouveau()
    pen = p.getPen()
    pen.moveTo(points[0])
    for pt in points[1:]:
        pen.lineTo(pt)
    pen.endPath()
    return contour(p, epaisseur, bouts)


def courbe(d, epaisseur, bouts='rond'):
    """Un trait épais qui suit un chemin SVG ouvert."""
    p = _nouveau()
    parse_path(d, p.getPen())
    return contour(p, epaisseur, bouts)


def contour(chemin, epaisseur, bouts='rond'):
    """Le contour d'un chemin, épais de « epaisseur » (moitié dedans, moitié dehors)."""
    p = _nouveau()
    chemin.draw(p.getPen())
    cap = pathops.LineCap.ROUND_CAP if bouts == 'rond' else pathops.LineCap.BUTT_CAP
    p.stroke(epaisseur, cap, pathops.LineJoin.ROUND_JOIN, 4)
    p.convertConicsToQuads()  # (le contour fait des arcs « coniques », que les polices ne connaissent pas)
    return union(p)


def union(*chemins):
    resultat = _nouveau()
    liste = [c for c in chemins if c is not None]
    if not liste:
        return resultat
    return pathops.op(_tout(liste), _nouveau(), pathops.PathOp.UNION, fix_winding=True)


def _tout(liste):
    p = _nouveau()
    pen = p.getPen()
    for c in liste:
        c.draw(pen)
    return pathops.simplify(p, fix_winding=True)


def moins(a, *b):
    """« a » sans « b »."""
    return pathops.op(a, _tout(list(b)), pathops.PathOp.DIFFERENCE, fix_winding=True)


def inter(a, b):
    """Ce que « a » et « b » ont en commun (pour ombrer une forme sans déborder)."""
    return pathops.op(a, b, pathops.PathOp.INTERSECTION, fix_winding=True)


def grossir(chemin, marge):
    """La forme, plus grosse de « marge » tout autour."""
    return union(chemin, contour(chemin, marge * 2))


def arrondir(chemin, r):
    """Les coins adoucis : on grossit, puis on enlève le bord."""
    gros = grossir(chemin, r)
    bord = contour(gros, r * 2)
    return moins(gros, bord)


def etoile(cx, cy, r1, r2, branches=5, angle=-90):
    pts = []
    for i in range(branches * 2):
        r = r1 if i % 2 == 0 else r2
        a = math.radians(angle + i * 180 / branches)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return poly(*pts)


def eclat(cx, cy, r, epais=None):
    """Une petite étincelle à 4 branches (comme ✦)."""
    e = epais if epais is not None else r * 0.28
    return svg(
        f'M {cx} {cy - r} Q {cx + e * 0.4} {cy - e * 0.4} {cx + r} {cy} Q {cx + e * 0.4} {cy + e * 0.4} {cx} {cy + r} '
        f'Q {cx - e * 0.4} {cy + e * 0.4} {cx - r} {cy} Q {cx - e * 0.4} {cy - e * 0.4} {cx} {cy - r} Z'
    )


def relief(forme, base, clair, fonce, d=4.5, brillance=None):
    """Une forme à plat, dans le style cartoon du jeu (25/10) : sa couleur et une seule ombre plus
    foncée en bas à droite (plus de bord clair : le style est plus simple). « clair » est gardé
    pour ne pas changer tous les dessins."""
    del clair
    couches = [
        (base, forme),
        (fonce, moins(forme, deplace(forme, -d * 0.6, -d))),
    ]
    if brillance:
        couches.append(brillance)
    return couches


def reflet(forme, cx, cy, rx, ry, angle=-30, couleur='#ffffff80'):
    """Un petit reflet blanc (une ellipse), coupé au bord de la forme."""
    return (couleur, inter(forme, ellipse(cx, cy, rx, ry, angle)))
