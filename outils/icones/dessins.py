# Les dessins des icônes (27/10). Chaque icône est une fonction qui renvoie ses couches, de la
# plus basse à la plus haute : (couleur, forme). Le gros contour brun et l'ombre sont ajoutés
# tout seuls (fabriquer.py). On dessine dans un carré de 100 × 100 (y vers le bas), en laissant
# environ 6 de marge pour le contour.
#
# Les couleurs reviennent souvent : on les nomme ici (base, clair, foncé).

import math

from formes import (
    cercle,
    contour,
    courbe,
    deplace,
    eclat,
    ellipse,
    etoile,
    grossir,
    inter,
    miroir,
    moins,
    poly,
    rect,
    reflet,
    relief,
    svg,
    tourne,
    trait,
    union,
)

BOIS = ('#a86a33', '#d39250', '#76461e')
METAL = ('#9aa6b2', '#e3eaf1', '#66717d')
OR = ('#f5b82e', '#ffe68a', '#c98512')
VERT = ('#45b84f', '#9be585', '#2a8237')
ROUGE = ('#e8452f', '#ff9a7d', '#a8261a')
BLEU = ('#3a8ee8', '#9ad0ff', '#2563b0')
VIOLET = ('#8a5ad8', '#c7a6ff', '#5c37a0')
BLANC = ('#f4f1ea', '#ffffff', '#c9c2b4')
NOIR = ('#3d3a40', '#6e6a74', '#1f1d22')
PEAU = ('#ffc98f', '#ffe3c2', '#d99a5c')
ORANGE = ('#ff8a1f', '#ffc06a', '#c75a0a')
FONCE = '#2a2140'  # (25/10 : le bleu nuit des contours ; avant, brun)
BLANC_PUR = '#ffffff'

ICONES = {}


def icone(*caracteres):
    """Enregistre le dessin pour ces caractères."""

    def enregistrer(fonction):
        for c in caracteres:
            ICONES[c] = fonction
        return fonction

    return enregistrer


def r(forme, couleurs, d=4.5, brillance=True, bx=None, by=None, brx=9, bry=5):
    """Une forme en relief avec ses trois couleurs (et un reflet en haut à gauche)."""
    b = None
    if brillance:
        x0, y0, x1, y1 = forme.bounds
        cx = bx if bx is not None else x0 + (x1 - x0) * 0.32
        cy = by if by is not None else y0 + (y1 - y0) * 0.22
        b = reflet(forme, cx, cy, brx, bry)
    return relief(forme, *couleurs, d=d, brillance=b)


# ---------------------------------------------------------------------------
# Les outils
# ---------------------------------------------------------------------------


def _pioche():
    manche = trait([(20, 88), (64, 36)], 11)
    tete = svg('M 22 30 Q 56 -2 92 50 Q 88 56 82 52 Q 62 24 30 38 Q 22 38 22 30 Z')
    bague = rect(55, 24, 16, 16, 4, angle=-48)
    return manche, tete, bague


@icone('⛏')
def pioche():
    manche, tete, bague = _pioche()
    return r(manche, BOIS, brillance=False) + r(tete, METAL, by=20, bx=42) + r(bague, OR, d=3, brillance=False)


@icone('🔨')
def marteau():
    manche = trait([(24, 88), (58, 46)], 11)
    tete = rect(34, 12, 50, 26, 6, angle=-38)
    return r(manche, BOIS, brillance=False) + r(tete, METAL)


@icone('⚒')
def marteau_et_pioche():
    manche, tete, bague = _pioche()
    m2 = trait([(80, 88), (40, 42)], 10)
    t2 = rect(14, 14, 44, 22, 5, angle=38)
    return r(manche, BOIS, brillance=False) + r(tete, METAL, brillance=False) + r(m2, BOIS, brillance=False) + r(t2, METAL)


@icone('🔧')
def cle():
    corps = union(trait([(28, 76), (64, 36)], 12), cercle(70, 28, 17))
    corps = moins(corps, rect(64, 4, 14, 26, 3, angle=45), cercle(26, 78, 4))
    corps = union(corps, cercle(25, 79, 11))
    corps = moins(corps, cercle(25, 79, 4.5))
    return r(corps, METAL)


@icone('✏')
def crayon():
    corps = rect(36, 6, 24, 70, 3, angle=40)
    pointe = poly((14, 92), (20, 70), (34, 84))
    gomme = rect(58, 4, 24, 16, 6, angle=40)
    bague = rect(54, 14, 26, 8, 0, angle=40)
    return r(corps, OR, brillance=False) + [('#f2d3a8', pointe), (FONCE, poly((14, 92), (16, 84), (22, 89)))] + r(gomme, ('#ff8fa8', '#ffc4d2', '#d4607c'), brillance=False) + r(bague, METAL, d=2, brillance=False)


@icone('🖌')
def pinceau():
    manche = trait([(80, 14), (46, 52)], 10)
    bague = rect(36, 48, 20, 14, 3, angle=-48)
    poils = svg('M 34 56 Q 46 66 42 72 Q 30 92 10 92 Q 14 72 30 60 Z')
    return r(manche, BOIS, brillance=False) + r(bague, METAL, d=2, brillance=False) + r(poils, ROUGE, d=3, brillance=False)


@icone('🔌')
def prise():
    fil = courbe('M 50 70 Q 50 90 72 92', 7)
    corps = rect(26, 30, 48, 42, 10)
    broches = union(rect(34, 8, 9, 26, 3), rect(57, 8, 9, 26, 3))
    return [('#3d3a40', fil)] + r(broches, OR, d=2, brillance=False) + r(corps, NOIR)


# ---------------------------------------------------------------------------
# Les minerais
# ---------------------------------------------------------------------------


@icone('🪨')
def pierre():
    roche = poly((14, 70), (20, 40), (40, 22), (66, 20), (86, 40), (90, 70), (70, 86), (30, 86), arrondi=6)
    facette = inter(roche, poly((40, 22), (66, 20), (60, 46), (36, 48)))
    return r(roche, ('#9b9a96', '#cfcdc6', '#6a6966'), brillance=False) + [('#b9b7b0', facette), ('#7e7d79', inter(roche, poly((60, 46), (90, 70), (70, 86), (52, 62))))]


@icone('⚫')
def charbon():
    roche = poly((16, 66), (22, 36), (46, 18), (72, 24), (88, 48), (82, 78), (54, 88), (26, 84), arrondi=6)
    return r(roche, NOIR, brillance=False) + [
        ('#57535c', inter(roche, poly((46, 18), (72, 24), (60, 48), (34, 44)))),
        ('#2a272d', inter(roche, poly((60, 48), (88, 48), (82, 78), (56, 70)))),
        ('#ffffffd0', eclat(38, 36, 7)),
    ]


def _gemme(couleurs, forme='hexa'):
    if forme == 'hexa':
        g = poly((30, 14), (70, 14), (90, 46), (50, 90), (10, 46))
        haut = poly((30, 14), (70, 14), (62, 32), (38, 32))
        gauche = poly((10, 46), (38, 32), (50, 90))
        # (26/10) Les facettes tournent dans le même sens que la gemme : sinon, à leur union, le
        # bord en bas à droite disparaissait (plus de contour d'encre de ce côté).
        droite = poly((62, 32), (90, 46), (50, 90))
    return [
        (couleurs[0], g),
        (couleurs[1], haut),
        (couleurs[2], droite),
        (couleurs[0], moins(gauche, droite)),
        ('#ffffffc0', poly((36, 18), (50, 18), (44, 28), (32, 28))),
        ('#ffffffd0', eclat(74, 22, 8)),
    ]


@icone('💎', '💠')
def diamant():
    return _gemme(('#4fd3f0', '#b8f3ff', '#1f9ec4'))


@icone('💚', '🟢')
def emeraude():
    g = poly((34, 10), (66, 10), (84, 30), (84, 70), (66, 90), (34, 90), (16, 70), (16, 30))
    milieu = rect(32, 28, 36, 44, 4)
    return [
        ('#2fb35a', g),
        ('#7cf0a0', inter(g, poly((34, 10), (66, 10), (68, 28), (32, 28)))),
        ('#1c7c3c', inter(g, poly((68, 28), (84, 30), (84, 70), (68, 72)))),
        ('#45cf72', milieu),
        ('#ffffffb0', rect(38, 32, 8, 26, 4)),
        ('#ffffffd0', eclat(74, 18, 7)),
    ]


@icone('🔴')
def redstone():
    g = poly((50, 8), (86, 30), (86, 70), (50, 92), (14, 70), (14, 30))
    return [
        ('#e0261f', g),
        ('#ff8a6e', poly((50, 8), (86, 30), (50, 40), (14, 30))),
        ('#9e140f', poly((86, 30), (86, 70), (50, 92), (50, 40))),
        ('#ff4a3a', cercle(50, 52, 12)),
        ('#ffffffc0', ellipse(36, 26, 9, 4, -20)),
        ('#ffffffd0', eclat(74, 60, 7)),
    ]


def _facettes(table, bord, couleurs, lumiere=225):
    """Les facettes d'une gemme taillée, entre sa table (le polygone du milieu) et son bord : une
    facette par côté de la table, coloriée selon qu'elle regarde la lumière (en haut à gauche,
    « lumiere » en degrés, y vers le bas) ou pas. « couleurs » : de la plus claire à la plus sombre."""
    cx = sum(x for x, _ in table) / len(table)
    cy = sum(y for _, y in table) / len(table)
    couches = []
    n = len(table)
    for i in range(n):
        a, b = table[i], table[(i + 1) % n]
        # On prolonge les deux arêtes loin vers l'extérieur, puis on coupe au bord de la gemme.
        loin_a = (cx + (a[0] - cx) * 3, cy + (a[1] - cy) * 3)
        loin_b = (cx + (b[0] - cx) * 3, cy + (b[1] - cy) * 3)
        facette = inter(bord, poly(a, b, loin_b, loin_a))
        # De quel côté regarde la facette (son milieu, vu du centre) ?
        angle = math.degrees(math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx))
        ecart = abs((angle - lumiere + 180) % 360 - 180)  # 0 : face à la lumière, 180 : à l'ombre
        couleur = couleurs[min(len(couleurs) - 1, int(ecart / 180 * len(couleurs)))]
        couches.append((couleur, facette))
    return couches


def _saphir(cx=50, cy=52, l=42, h=36, eclat_=True):
    # (26/10, redessiné) Le saphir : une gemme taillée en ovale (taille « coussin »), plus large que
    # haute, d'un bleu roi profond. Au milieu, la table (un octogone) ; autour, huit facettes, les
    # plus claires en haut à gauche (la lumière), les plus sombres en bas à droite. Le diamant 💎
    # est bleu ciel et pointu en bas, l'émeraude 💚 un octogone vert plus haut que large.
    bord = ellipse(cx, cy, l, h)
    table = [(cx + l * 0.5 * math.cos(math.radians(a)), cy + h * 0.5 * math.sin(math.radians(a))) for a in range(0, 360, 45)]
    couches = [('#3a66e0', bord)]
    couches += _facettes(table, bord, ('#a4c0ff', '#6f96f7', '#3a66e0', '#2647b4', '#1a3285'))
    couches += [
        ('#4c78ec', poly(*table)),
        # le reflet de la table (une bande blanche en biais), et un petit reflet sur le bord
        ('#ffffffb0', inter(poly(*table), poly((cx - l * 0.3, cy - h * 0.6), (cx - l * 0.08, cy - h * 0.6), (cx - l * 0.36, cy + h * 0.3), (cx - l * 0.58, cy + h * 0.3)))),
        ('#ffffffc0', ellipse(cx - l * 0.62, cy - h * 0.52, l * 0.16, h * 0.08, -32)),
    ]
    if eclat_:
        couches.append(('#ffffffe0', eclat(cx + l * 0.68, cy - h * 0.78, max(3, l * 0.2))))
    return couches


@icone('🔷')
def saphir():
    # (26/10) Le saphir, la gemme du niveau 5 de la mine.
    return _saphir(50, 54, 43, 36)


def _rubis(cx=50, cy=52, k=1.0, eclat_=True):
    # (26/10, redessiné) Le rubis : une gemme taillée en cœur, rouge cramoisi (la redstone 🔴 est
    # un cristal rouge orangé à six côtés). Un cœur à facettes (des côtés droits, pas un cœur tout
    # rond) : au milieu, la table (un petit cœur), et autour une facette par côté, claires en haut
    # à gauche, sombres en bas à droite.
    def pt(x, y, f=1.0):
        return (cx + x * k * f, cy + (y + 4) * k * f - 4 * k)

    # le cœur, autour de (0, 0) : les deux bosses en haut, la pointe en bas
    coeur = [(0, -22), (12, -38), (30, -40), (44, -26), (42, -6), (0, 42), (-42, -6), (-44, -26), (-30, -40), (-12, -38)]
    bord = poly(*[pt(x, y) for x, y in coeur], arrondi=2 * k)
    table = [pt(x, y, 0.5) for x, y in coeur]
    couches = [('#e8304f', bord)]
    couches += _facettes(table, bord, ('#ff7d93', '#f04a68', '#dc2848', '#a8142f', '#7c0d24'))
    couches += [
        ('#e8304f', poly(*table)),
        ('#ffffffb0', inter(poly(*table), poly(pt(-22, -30), pt(-12, -30), pt(-20, 4), pt(-30, 4)))),
        ('#ffffffc0', ellipse(*pt(-30, -30), 7 * k, 3.5 * k, -40)),
    ]
    if eclat_:
        couches.append(('#ffffffe0', eclat(*pt(36, -40), 8 * k)))
    return couches


@icone('🔺')
def rubis():
    # (26/10) Le rubis, la gemme du niveau 6 de la mine.
    return _rubis(50, 52, 1.0)


# ---------------------------------------------------------------------------
# (26/10, redessinés) Les minerais bruts (fer 🔩, or 🟡) et les lingots (⬜, 🟨)
# ---------------------------------------------------------------------------
#
# Le minerai brut : un gros caillou taillé à facettes (la face du dessus claire, les faces à
# l'ombre en bas à droite), avec de grosses pépites de métal qui en sortent. Le métal doit couvrir
# presque la moitié du caillou : à 16 px, on voit d'abord sa couleur (rose-beige pour le fer, jaune
# d'or pour l'or), pas la pierre grise 🪨. Chaque pépite est elle aussi taillée à facettes (par
# `_facettes()`, comme les gemmes), entourée d'un creux sombre dans la roche, avec un reflet blanc.
# Le fer a des pépites anguleuses, allongées en filon ; l'or des pépites rondes et dodues qui
# scintillent (des étincelles autour).

ROCHE_MINERAI = ('#d8d6cf', '#bdbbb4', '#a2a09a', '#86847f', '#6b6a66')
ROCHE_CREUX = '#4a4743'

# fer : du plus clair au plus sombre (beige rosé, comme le minerai de fer de Minecraft, et rouille)
FER_TONS = ('#fff4ec', '#fbd5c0', '#e5ad94', '#bf7f68', '#8e5446')
FER_CREUX = '#55332e'
# or : du plus clair au plus sombre
OR_TONS = ('#fffbe3', '#ffe98f', '#f9c63a', '#e09a16', '#b06d0c')


def _roche_taillee(contour_roche, dessus):
    """Un caillou taillé : la forme entière, et sa face du dessus (« dessus ») ; les autres faces
    vont de la plus claire (en haut à gauche) à la plus sombre (en bas à droite)."""
    roche = poly(*contour_roche, arrondi=5)
    couches = [(ROCHE_MINERAI[2], roche)]
    couches += _facettes(dessus, roche, ROCHE_MINERAI[1:])
    couches.append((ROCHE_MINERAI[0], poly(*dessus)))
    return roche, couches


def _pepite_taillee(points, tons, creux, arrondi=1.2):
    """Une pépite de métal prise dans la roche. « points » : son contour. Comme une bille de
    métal à plat : un bord clair en haut à gauche, une ombre en bas à droite (et un fil plus sombre
    tout au bord), et un gros reflet presque blanc, avec un petit point de lumière."""
    pepite = poly(*points, arrondi=arrondi)
    x0, y0, x1, y1 = pepite.bounds
    l, h = x1 - x0, y1 - y0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d = max(1.6, l * 0.16)
    couches = [
        (creux, grossir(pepite, 2.6)),
        (tons[2], pepite),
        (tons[1], moins(pepite, deplace(pepite, d * 0.55, d * 0.7))),
        (tons[3], moins(pepite, deplace(pepite, -d * 0.7, -d * 0.85))),
        (tons[4], moins(pepite, deplace(pepite, -d * 0.25, -d * 0.32))),
        # le reflet : une tache claire penchée, et un point de lumière à côté
        (tons[0], inter(pepite, ellipse(cx - l * 0.12, cy - h * 0.14, l * 0.2, h * 0.1, -35))),
        (tons[0], cercle(cx + l * 0.12, cy - h * 0.28, max(0.9, l * 0.05))),
    ]
    return pepite, couches


def _blob(cx, cy, rx, ry, bosses, angle=0):
    """Le contour d'une pépite cabossée : un ovale dont les points rentrent ou sortent un peu
    (« bosses » : un facteur par point, autour du centre)."""
    n = len(bosses)
    a0 = math.radians(angle)
    pts = []
    for i, k in enumerate(bosses):
        a = 2 * math.pi * i / n
        x, y = rx * k * math.cos(a), ry * k * math.sin(a)
        pts.append((cx + x * math.cos(a0) - y * math.sin(a0), cy + x * math.sin(a0) + y * math.cos(a0)))
    return pts


ROCHE_FER = [(8, 62), (14, 34), (34, 15), (62, 11), (86, 26), (94, 56), (82, 84), (52, 93), (20, 86)]
DESSUS_FER = [(30, 30), (56, 22), (72, 36), (60, 52), (34, 52), (24, 42)]


@icone('🔩')
def fer():
    # (26/10, redessiné) Le fer brut (le minerai), à fondre en lingots ⬜ à la fonderie : un caillou
    # taillé, traversé en biais par un gros filon de pépites rose-beige anguleuses (et deux petites).
    _, couches = _roche_taillee(ROCHE_FER, DESSUS_FER)
    for pts in (
        # le filon : trois grosses pépites anguleuses, en biais du haut à gauche vers le bas à droite
        [(14, 40), (26, 26), (42, 28), (46, 42), (34, 54), (18, 54)],
        [(42, 52), (54, 38), (70, 40), (76, 56), (64, 68), (46, 66)],
        [(60, 74), (72, 66), (88, 70), (86, 84), (72, 90), (60, 86)],
        # deux petites pépites
        [(66, 18), (76, 16), (82, 26), (74, 32), (64, 28)],
        [(22, 66), (32, 62), (38, 72), (30, 80), (20, 76)],
    ):
        # (un peu plus grosses que dessinées : le métal doit dominer à 16 px)
        mx = sum(x for x, _ in pts) / len(pts)
        my = sum(y for _, y in pts) / len(pts)
        pts = [(mx + (x - mx) * 1.12, my + (y - my) * 1.12) for x, y in pts]
        couches += _pepite_taillee(pts, FER_TONS, FER_CREUX, arrondi=2)[1]
    couches.append(('#ffffffe0', eclat(84, 40, 6.5)))
    return couches


ROCHE_OR = [(8, 64), (12, 36), (32, 18), (60, 14), (84, 26), (94, 54), (84, 82), (54, 93), (22, 88)]
DESSUS_OR = [(30, 32), (56, 24), (72, 38), (60, 54), (34, 54), (24, 44)]


@icone('🟡')
def or_():
    # (26/10, redessiné) L'or brut (le minerai), à fondre en lingots 🟨 : un caillou taillé plein de
    # grosses pépites d'or rondes et dodues (l'une dépasse en haut), qui scintillent.
    _, couches = _roche_taillee(ROCHE_OR, DESSUS_OR)
    # des paillettes d'or dans la roche
    for x, y, rayon in ((50, 30, 1.8), (16, 56, 1.6), (50, 76, 1.8), (80, 76, 1.5)):
        couches += [(OR_CREUX, cercle(x, y, rayon + 1.2)), (OR_TONS[1], cercle(x, y, rayon))]
    for cx, cy, rx, ry, bosses, angle in (
        (36, 44, 19, 16, (1, 0.86, 1.06, 0.92, 1.08, 0.88, 1, 0.84, 1.05, 0.93), -12),
        (68, 61, 18, 16, (0.95, 1.08, 0.86, 1.02, 1.06, 0.88, 1.04, 0.9, 1.0, 0.94), 14),
        (66, 22, 13, 11, (1, 0.86, 1.07, 0.9, 1.04, 0.88, 1.05, 0.95), 0),
        (30, 76, 11, 9, (1, 0.86, 1.06, 0.92, 1.04, 0.88, 1.02), 20),
        (83, 40, 7, 6, (1, 0.88, 1.06, 0.92, 1.02, 0.9), 0),
    ):
        couches += _pepite_taillee(_blob(cx, cy, rx, ry, bosses, angle), OR_TONS, OR_CREUX, arrondi=2.2)[1]
    couches += [('#ffffffe8', eclat(86, 14, 9)), ('#ffffffd8', eclat(14, 26, 6)), ('#ffffffe0', eclat(52, 84, 5))]
    return couches


# Le lingot : vu de trois quarts, un tronc de pyramide couché (le dessus plus petit que le
# dessous). On le place en trois dimensions (u : la longueur, v : la profondeur, z : la hauteur),
# puis on le projette : ce qui est plus loin est un peu plus haut et plus à droite. On voit le
# dessus (le plus clair), le bout de gauche (éclairé), la face de devant et le bout de droite (le
# plus sombre). Sur le dessus, un creux (le poinçon), et une bande de lumière blanche en biais.


def _lingot(ox, oy, tons, creux, u0=0, v0=0, z0=0, L=46, D=22, H=16, su=8, sv=4):
    """Un lingot posé en (u0, v0, z0) ; le point (0, 0, 0) du monde est en (ox, oy) sur le dessin.
    « su » : de combien les bouts penchent, « sv » : les côtés. « tons » : du plus clair au plus
    sombre (reflet, dessus, bout de gauche, devant, bout de droite)."""

    def p(u, v, z):
        u, v, z = u + u0, v + v0, z + z0
        return (ox + u + v * 0.42, oy - z - v * 0.58)

    dessus = poly(p(su, sv, H), p(L - su, sv, H), p(L - su, D - sv, H), p(su, D - sv, H))
    devant = poly(p(0, 0, 0), p(L, 0, 0), p(L - su, sv, H), p(su, sv, H))
    droite = poly(p(L, 0, 0), p(L, D, 0), p(L - su, D - sv, H), p(L - su, sv, H))
    gauche = poly(p(0, 0, 0), p(su, sv, H), p(su, D - sv, H), p(0, D, 0))
    tout = union(dessus, devant, droite, gauche)
    m = (L - 2 * su) * 0.18
    poincon = poly(p(su + m, sv + 3, H), p(L - su - m, sv + 3, H), p(L - su - m, D - sv - 3, H), p(su + m, D - sv - 3, H))

    def bande(u, largeur):
        """Une bande de lumière en biais, sur le dessus et le devant."""
        return inter(union(dessus, devant), poly(p(u, 0, -2), p(u + largeur, 0, -2), p(u + largeur + 10, D, H + 2), p(u + 10, D, H + 2)))

    couches = [
        # (un trait d'encre autour : il sépare le lingot de ceux qu'il cache)
        (FONCE, grossir(tout, 2.4)),
        (tons[2], gauche),
        (tons[4], droite),
        (tons[3], devant),
        (tons[1], dessus),
        (creux, poincon),
        (tons[1], moins(poincon, deplace(poincon, -1.4, 1.4))),
        (tons[0] + 'c8', bande(L * 0.2, L * 0.14)),
        (tons[0] + '90', bande(L * 0.2 + L * 0.2, L * 0.05)),
        # le fil de lumière sur l'arête de devant du dessus
        (tons[0], trait([p(su + 1, sv, H), p(L - su - 1, sv, H)], 1.6)),
    ]
    return tout, couches


ACIER_TONS = ('#ffffff', '#eaf1f9', '#c4d0de', '#a3b2c4', '#6a7b90')
ACIER_CREUX = '#8794a4'
LINGOT_OR_TONS = ('#fffbe3', '#ffe98f', '#ffd24d', '#f5b82e', '#c98512')


@icone('⬜')
def lingot_fer():
    # (26/10, redessiné) Le lingot de fer (la fonderie le fabrique avec le fer brut 🔩) : deux
    # lingots d'acier poli gris bleuté, l'un sur l'autre, avec leur poinçon et une bande de
    # lumière. (Le lingot d'or 🟨 est une pyramide de trois lingots.)
    couches = _lingot(8, 90, ACIER_TONS, ACIER_CREUX, L=62, D=30, H=20, su=9, sv=5)[1]
    couches += _lingot(8, 90, ACIER_TONS, ACIER_CREUX, u0=10, v0=6, z0=20, L=56, D=26, H=19, su=9, sv=5)[1]
    couches += [('#ffffffe8', eclat(80, 30, 8)), ('#ffffffd0', eclat(22, 82, 4.5))]
    return couches


@icone('🟨')
def lingot_or():
    # (26/10, redessiné) Le lingot d'or (la fonderie le fabrique avec l'or brut 🟡) : une pyramide
    # de trois lingots d'or qui brillent, avec leur poinçon, une bande de lumière et des étincelles.
    t = dict(L=40, D=22, H=17, su=7, sv=4)
    couches = _lingot(6, 92, LINGOT_OR_TONS, OR_CREUX, **t)[1]
    couches += _lingot(6, 92, LINGOT_OR_TONS, OR_CREUX, u0=44, **t)[1]
    couches += _lingot(6, 92, LINGOT_OR_TONS, OR_CREUX, u0=20, v0=5, z0=17, **t)[1]
    couches += [('#ffffffe8', eclat(78, 40, 9)), ('#ffffffd8', eclat(20, 58, 5.5)), ('#ffffffe0', eclat(54, 82, 4))]
    return couches


# ---------------------------------------------------------------------------
# (26/10) Les bijoux (la joaillerie taille les gemmes en bijoux) : de l'or et une gemme
# ---------------------------------------------------------------------------
#
# (26/10, redessinés en vrais bijoux de luxe) L'or des bijoux a quatre tons à plat : un bord
# clair en haut à gauche (la lumière), la couleur, une ombre en bas à droite, et un brun doré
# pour les creux ; plus de petits reflets presque blancs. Les gemmes serties sont les mêmes
# dessins que les gemmes brutes (💚 💎 🔷 🔺), en plus petit, pour qu'on les reconnaisse.

OR_CLAIR = '#ffe98f'
OR_BASE = '#f5b82e'
OR_OMBRE = '#d08a12'
OR_CREUX = '#94590a'
OR_REFLET = '#fffbe3'
PERLE = ('#f6f0e4', '#ffffff', '#c8bba6')


def _or(forme, d=3.0, clair=True):
    """Une pièce d'or à plat : sa couleur, un bord clair en haut à gauche et une ombre en bas à
    droite (épais de « d »)."""
    couches = [(OR_BASE, forme)]
    if clair:
        couches.append((OR_CLAIR, moins(forme, deplace(forme, d * 0.55, d * 0.75))))
    couches.append((OR_OMBRE, moins(forme, deplace(forme, -d * 0.55, -d * 0.75))))
    return couches


def _boule_or(cx, cy, rayon):
    """Une perle d'or (une boule) : ombre en bas à droite et un point de lumière."""
    boule = cercle(cx, cy, rayon)
    return _or(boule, d=max(1.2, rayon * 0.45), clair=False) + [(OR_REFLET, cercle(cx - rayon * 0.35, cy - rayon * 0.35, rayon * 0.32))]


def _perle(cx, cy, rayon):
    """Une perle blanche nacrée."""
    boule = cercle(cx, cy, rayon)
    return [
        (PERLE[0], boule),
        (PERLE[2], moins(boule, deplace(boule, -rayon * 0.3, -rayon * 0.4))),
        (PERLE[1], cercle(cx - rayon * 0.35, cy - rayon * 0.35, rayon * 0.35)),
    ]


def _sur_courbe(p0, p1, p2, t):
    """Le point de la courbe (de Bézier, du second degré) p0 → p2, tirée vers p1, à « t » (0 à 1)."""
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])


def _brillant(cx, cy, rayon):
    """Un petit diamant rond (vu de dessus), serti dans un anneau d'or : sa table en octogone et
    huit facettes (le même bleu ciel que le diamant 💎)."""
    pierre = cercle(cx, cy, rayon)
    table = [(cx + rayon * 0.5 * math.cos(math.radians(a + 22.5)), cy + rayon * 0.5 * math.sin(math.radians(a + 22.5))) for a in range(0, 360, 45)]
    couches = _or(grossir(pierre, 1.6), d=1.4, clair=False) + [('#4fd3f0', pierre)]
    couches += _facettes(table, pierre, ('#e6fbff', '#b8f3ff', '#4fd3f0', '#1f9ec4'))
    couches += [('#8fe6f8', poly(*table)), ('#ffffffd0', cercle(cx - rayon * 0.3, cy - rayon * 0.3, rayon * 0.28))]
    return couches


def _emeraude_petite(cx, cy, k):
    """Une petite émeraude (le dessin de 💚, en plus petit), au milieu en (cx, cy)."""
    def pt(x, y):
        return (cx + (x - 50) * k, cy + (y - 50) * k)

    g = poly(pt(34, 10), pt(66, 10), pt(84, 30), pt(84, 70), pt(66, 90), pt(34, 90), pt(16, 70), pt(16, 30))
    return g, [
        ('#2fb35a', g),
        ('#7cf0a0', inter(g, poly(pt(34, 10), pt(66, 10), pt(68, 28), pt(32, 28)))),
        ('#1c7c3c', inter(g, poly(pt(68, 28), pt(84, 30), pt(84, 70), pt(68, 72)))),
        # (les marches de la taille « émeraude » : un deuxième rang, à gauche et en bas)
        ('#38c066', inter(g, poly(pt(16, 30), pt(32, 28), pt(32, 72), pt(16, 70)))),
        ('#22914a', inter(g, poly(pt(32, 72), pt(68, 72), pt(66, 90), pt(34, 90)))),
        ('#45cf72', rect(cx - 18 * k, cy - 22 * k, 36 * k, 44 * k, 3 * k)),
        ('#ffffffb0', rect(cx - 12 * k, cy - 18 * k, 7 * k, 22 * k, 3 * k)),
    ]


@icone('📿')
def bijou_emeraude():
    # Le collier d'émeraude : une chaîne de perles d'or qui descend en U, deux petites émeraudes
    # serties dans la chaîne, et en pendentif une grosse émeraude taillée, dans un cadre d'or à
    # griffes, avec sa bélière (l'anneau qui la tient) et une goutte d'or en dessous.
    couches = []
    gauche = ((12, 6), (12, 44), (46, 44))
    droite = ((88, 6), (88, 44), (54, 44))
    # le fil de la chaîne, sous les perles
    fil = union(courbe('M 12 6 Q 12 44 46 44', 3), courbe('M 88 6 Q 88 44 54 44', 3))
    couches.append((OR_OMBRE, fil))
    accents = []
    for p0, p1, p2 in (gauche, droite):
        for i in range(9):
            t = i / 8.6
            x, y = _sur_courbe(p0, p1, p2, t)
            if i == 6:
                accents.append((x, y))
            elif i % 2 == 0:
                couches += _boule_or(x, y, 4.4)
            else:
                couches += _boule_or(x, y, 2.8)
    # les deux petites émeraudes de la chaîne, dans leur chaton d'or
    for x, y in accents:
        petite, couches_petite = _emeraude_petite(x, y, 0.15)
        couches += _or(grossir(petite, 1.8), d=1.4, clair=False) + couches_petite
    # la bélière
    couches += _or(contour(ellipse(50, 45, 4.5, 5), 3.2), d=1.4)
    # le pendentif : le cadre d'or (à huit côtés, comme la gemme), puis l'émeraude
    gemme, couches_gemme = _emeraude_petite(50, 69, 0.42)
    cadre = grossir(gemme, 4.2)
    couches += _boule_or(50, 91, 3.6)
    couches += _or(cadre, d=3)
    couches.append((OR_CREUX, moins(grossir(gemme, 1.2), gemme)))
    couches += couches_gemme
    # les griffes, aux quatre coins de l'émeraude, et une perle d'or en haut du cadre
    for x, y in ((50 - 13, 69 - 15), (50 + 13, 69 - 15), (50 - 13, 69 + 15), (50 + 13, 69 + 15)):
        couches += _boule_or(x, y, 2.6)
    couches += _boule_or(50, 50.5, 3)
    couches += [('#ffffffe0', eclat(80, 76, 7)), ('#ffffffd0', eclat(24, 70, 4.5))]
    return couches


@icone('🧿')
def bijou_saphir():
    # Le pendentif de saphir : un médaillon en or au bord festonné (une couronne de petites
    # boules), un saphir ovale (le dessin de 🔷) dans un cercle de perles d'or, quatre petits
    # diamants autour, et en haut une bélière et une courte chaîne.
    couches = []
    # la chaîne, en V, de maillons ovales
    for x0, y0, x1, y1 in ((16, 6, 44, 26), (84, 6, 56, 26)):
        angle = math.degrees(math.atan2(y1 - y0, x1 - x0))
        for i in range(5):
            t = i / 4
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            # (un gros maillon ouvert, puis un petit maillon plein)
            maillon = contour(ellipse(x, y, 4.2, 2.6, angle), 2.2) if i % 2 == 0 else ellipse(x, y, 2.6, 1.6, angle)
            couches += _or(maillon, d=1.2, clair=False)
    # la bélière (un anneau, puis un petit tube d'or)
    couches += _or(contour(cercle(50, 26, 4.6), 3), d=1.4)
    couches += _or(rect(45, 29, 10, 8, 3), d=1.6)
    # le médaillon festonné : un ovale et des petites bosses tout autour
    cx, cy, l, h = 50, 64, 28, 25
    bosses = [cercle(cx + l * math.cos(a), cy + h * math.sin(a), 5.2) for a in [i * math.pi / 8 for i in range(16)]]
    medaillon = union(ellipse(cx, cy, l, h), *bosses)
    couches += _or(medaillon, d=3.4)
    # le creux, puis le cercle de perles d'or autour du saphir
    couches.append((OR_CREUX, ellipse(cx, cy, l - 6, h - 6)))
    couches.append((OR_OMBRE, ellipse(cx, cy, l - 7.5, h - 7.5)))
    couches += [(OR_CLAIR, cercle(cx + (l - 6) * math.cos(a), cy + (h - 6) * math.sin(a), 1.7)) for a in [i * math.pi / 9 for i in range(18)]]
    couches += _saphir(cx, cy + 0.5, 17, 14, eclat_=False)
    # les quatre petits diamants, sur le bord
    for x, y in ((cx - l - 1, cy), (cx + l + 1, cy), (cx, cy + h + 1), (cx, cy - h - 1)):
        couches += _brillant(x, y, 3.6)
    couches += [('#ffffffe0', eclat(80, 34, 7)), ('#ffffffd0', eclat(20, 38, 4.5))]
    return couches


@icone('🫅')
def bijou_rubis():
    # La couronne de rubis : une couronne royale. Derrière, le bonnet de velours rouge ; devant,
    # cinq pointes d'or (les grandes ont une perle au bout), un bandeau gravé avec trois rubis
    # taillés en cœur (le dessin de 🔺) et des perles entre eux. (👑 reste la couronne du
    # classement, plus simple.)
    couches = []
    # le velours, qu'on voit entre les pointes
    velours = svg('M 16 66 Q 14 26 50 22 Q 86 26 84 66 Z')
    couches += [
        ('#b8173a', velours),
        ('#7e0c27', moins(velours, deplace(velours, -4, -3))),
        ('#e04a68', inter(velours, ellipse(36, 31, 7, 3.2, -25))),
    ]
    # les pointes : de grandes pointes au milieu et aux bords, de petites entre elles
    pointes = poly(
        (10, 68), (12, 30), (24, 52), (31, 40), (38, 52), (50, 20),
        (62, 52), (69, 40), (76, 52), (88, 30), (90, 68),
        arrondi=2,
    )
    couches += _or(pointes, d=3.5)
    # une arête claire au milieu de chaque grande pointe (l'or est bombé)
    for x0, y0, x1 in ((12, 34, 16), (50, 26, 50), (88, 34, 84)):
        couches.append((OR_REFLET, trait([(x0, y0 + 4), (x1, y0 + 20)], 2.2)))
    # le bandeau, gravé : un liseré clair en haut, un liseré sombre en bas
    bandeau = rect(9, 62, 82, 24, 4)
    couches += _or(bandeau, d=3)
    couches += [
        (OR_CLAIR, rect(12, 64, 76, 3, 1.5)),
        (OR_CREUX, rect(12, 80.5, 76, 2, 1)),
    ]
    # les perles au bout des pointes
    for x, y, rayon in ((12, 27, 5.4), (50, 16, 6), (88, 27, 5.4)):
        couches += _perle(x, y, rayon)
    for x, y in ((31, 37), (69, 37)):
        couches += _boule_or(x, y, 3.4)
    # les rubis du bandeau, chacun dans son chaton d'or, et les perles entre eux
    for x, k in ((50, 0.23), (27, 0.18), (73, 0.18)):
        couches += _or(grossir(poly(*[(x + px * k, 73 + py * k) for px, py in ((0, -22), (12, -38), (30, -40), (44, -26), (42, -6), (0, 42), (-42, -6), (-44, -26), (-30, -40), (-12, -38))]), 1.8), d=1.2, clair=False)
        couches += _rubis(x, 73, k, eclat_=False)
    for x in (16, 38, 62, 84):
        couches += _perle(x, 73, 2.6)
    # un petit rubis rond au pied de la grande pointe du milieu
    couches += _or(cercle(50, 48, 4.6), d=1.4, clair=False) + [('#e8304f', cercle(50, 48, 3.2)), ('#ff9fb0', cercle(49, 47, 1.2))]
    couches += [('#ffffffe0', eclat(74, 16, 6))]
    return couches


def _diamant_taille(cx, cy, k):
    """Le diamant 💎 (la même taille et les mêmes couleurs), en plus petit, au milieu en (cx, cy) :
    sa couronne (la table et ses côtés) et sa culasse (la pointe), avec deux facettes de plus en
    bas pour qu'il scintille."""
    def pt(x, y):
        return (cx + (x - 50) * k, cy + (y - 52) * k)

    g = poly(pt(30, 14), pt(70, 14), pt(90, 46), pt(50, 90), pt(10, 46))
    haut = poly(pt(30, 14), pt(70, 14), pt(62, 32), pt(38, 32))
    gauche = poly(pt(10, 46), pt(38, 32), pt(50, 90))
    droite = poly(pt(90, 46), pt(62, 32), pt(50, 90))
    return g, [
        ('#4fd3f0', g),
        ('#b8f3ff', haut),
        ('#1f9ec4', droite),
        ('#4fd3f0', moins(gauche, droite)),
        ('#8fe6f8', poly(pt(38, 32), pt(50, 90), pt(26, 42))),
        ('#178ab0', poly(pt(62, 32), pt(74, 42), pt(50, 90))),
        ('#ffffffc0', poly(pt(36, 18), pt(50, 18), pt(44, 28), pt(32, 28))),
    ]


@icone('💍')
def bijou_diamant():
    # La bague de diamant (un solitaire) : un anneau d'or vu un peu de biais (plus épais devant),
    # une monture en corbeille à quatre griffes qui tient un gros diamant (le dessin de 💎), et
    # deux petits diamants ronds sur les épaules de l'anneau.
    couches = []
    exterieur = ellipse(50, 67, 33, 25)
    trou = ellipse(50, 64, 22, 15)
    anneau = moins(exterieur, trou)
    couches += _or(anneau, d=4)
    # l'intérieur de l'anneau, qu'on voit au fond (en haut du trou)
    couches.append((OR_CREUX, moins(trou, deplace(trou, 0, 5))))
    # un reflet net sur le devant de l'anneau
    couches.append((OR_REFLET, courbe('M 26 78 Q 34 88 48 89', 2.4)))
    # les épaules : deux petits diamants
    couches += _brillant(24, 52, 4.4)
    couches += _brillant(76, 52, 4.4)
    # la monture (la corbeille sous le diamant)
    corbeille = poly((32, 36), (68, 36), (59, 54), (41, 54), arrondi=1.5)
    couches += _or(corbeille, d=2.5)
    couches.append((OR_CREUX, poly((42, 42), (58, 42), (55, 48), (45, 48))))
    # le diamant, puis les griffes par-dessus son bord
    gemme, couches_gemme = _diamant_taille(50, 28, 0.6)
    couches += couches_gemme
    for (x0, y0), (x1, y1) in (((35, 39), (28, 23)), ((65, 39), (72, 23)), ((44, 42), (41, 29)), ((56, 42), (59, 29))):
        couches += _or(trait([(x0, y0), (x1, y1)], 3.4), d=1.2, clair=False)
        couches += _boule_or(x1, y1, 2.3)
    couches += [('#ffffffe0', eclat(84, 14, 7)), ('#ffffffd0', eclat(16, 26, 4.5)), ('#ffffffe0', eclat(44, 14, 3.2))]
    return couches


# ---------------------------------------------------------------------------
# L'argent
# ---------------------------------------------------------------------------


@icone('💰')
def sac_argent():
    sac = svg('M 50 28 Q 90 38 90 66 Q 90 92 50 92 Q 10 92 10 66 Q 10 38 50 28 Z')
    col = svg('M 34 30 L 26 10 Q 50 20 74 10 L 66 30 Z')
    dollar = union(courbe('M 60 54 Q 52 46 44 50 Q 36 56 48 62 Q 62 68 56 76 Q 48 82 38 74', 6.5), rect(47, 40, 6, 46, 3))
    return r(sac, ('#d39a48', '#f0c47c', '#9c6524'), brillance=False) + r(col, ('#d39a48', '#f0c47c', '#9c6524'), d=3, brillance=False) + [
        ('#7a4b1c', rect(30, 26, 40, 8, 4)),
        (OR[2], deplace(dollar, 1, 2)),
        (OR[0], dollar),
    ]


@icone('💵')
def billets():
    b1 = rect(10, 30, 76, 44, 6, angle=-10)
    b2 = rect(16, 26, 76, 44, 6, angle=6)
    centre = cercle(54, 48, 11)
    return r(b1, ('#5aa65a', '#9dd58a', '#3a7a3a'), brillance=False) + r(b2, ('#6cc06a', '#b2ea9c', '#3d8a3d'), brillance=False) + [
        ('#3d8a3d', contour(rect(22, 32, 64, 32, 4, angle=6), 3)),
        ('#b2ea9c', centre),
        ('#2f6f2f', courbe('M 58 42 Q 50 38 48 44 Q 48 48 54 50 Q 60 52 58 56 Q 54 60 48 56', 3.5)),
    ]


def _piece(cx, cy, rx=26, ry=11, h=7):
    tranche = union(ellipse(cx, cy + h, rx, ry), rect(cx - rx, cy, rx * 2, h))
    dessus = ellipse(cx, cy, rx, ry)
    return [(OR[2], tranche), (OR[0], dessus), (OR[1], ellipse(cx, cy, rx * 0.7, ry * 0.62)), (OR[0], ellipse(cx, cy + 1, rx * 0.55, ry * 0.45))]


@icone('🤑')
def pieces():
    couches = []
    for y in (78, 66, 54, 42):
        couches += _piece(42, y)
    couches += _piece(70, 74, 20, 9, 6)
    couches.append(('#ffffffe0', eclat(26, 30, 9)))
    return couches


# ---------------------------------------------------------------------------
# Les bâtiments et le village
# ---------------------------------------------------------------------------


@icone('📦')
def coffre():
    corps = rect(10, 40, 80, 48, 8)
    couvercle = svg('M 10 44 L 10 32 Q 10 14 50 14 Q 90 14 90 32 L 90 44 Z')
    return (
        r(corps, BOIS, brillance=False)
        + r(couvercle, BOIS, brillance=False)
        + [
            ('#5e3818', rect(10, 42, 80, 5)),
            (OR[0], rect(18, 15, 10, 73, 2)),
            (OR[0], rect(72, 15, 10, 73, 2)),
            (OR[1], rect(18, 15, 4, 73, 2)),
            (OR[1], rect(72, 15, 4, 73, 2)),
        ]
        + r(rect(40, 36, 20, 20, 5), OR, d=3, brillance=False)
        + [(FONCE, rect(47, 42, 6, 9, 3))]
    )


@icone('🎒')
def sac_a_dos():
    corps = rect(18, 22, 64, 70, 18)
    rabat = svg('M 18 46 Q 18 22 50 22 Q 82 22 82 46 L 82 50 Q 50 58 18 50 Z')
    poche = rect(30, 62, 40, 24, 8)
    anse = contour(svg('M 38 24 Q 38 8 50 8 Q 62 8 62 24'), 6)
    couleurs = ('#e07a2e', '#ffb06a', '#a8521a')
    return [('#7a4520', anse)] + r(corps, couleurs, brillance=False) + r(rabat, ('#c45f1f', '#f09a5a', '#8a3e10'), d=3, brillance=False) + r(poche, couleurs, d=3, brillance=False) + r(rect(44, 46, 12, 12, 3), OR, d=2, brillance=False)


@icone('🏗')
def chantier():
    tour = rect(22, 20, 14, 74, 2)
    fleche = rect(10, 14, 82, 11, 3)
    cable = rect(72, 24, 3, 30)
    charge = rect(62, 52, 24, 18, 3)
    croisillons = union(trait([(23, 30), (35, 46)], 2.5), trait([(35, 46), (23, 62)], 2.5), trait([(23, 62), (35, 78)], 2.5))
    return [(FONCE, cable)] + r(tour, OR, brillance=False) + [('#c98512', croisillons)] + r(fleche, OR, brillance=False) + r(charge, ('#d9662b', '#ff9a5a', '#a0441a'), d=3, brillance=False)


@icone('🧱')
def briques():
    couches = []
    for ligne, y in enumerate((18, 40, 62)):
        decal = 0 if ligne % 2 == 0 else -18
        for x in (12, 48, 84):
            b = inter(rect(x + decal, y, 34, 20, 3), rect(8, 0, 84, 100))
            couches += r(b, ('#d65a36', '#f59a74', '#9e3a20'), d=3, brillance=False)
    return couches


@icone('🏡')
def maison():
    murs = rect(20, 46, 60, 44, 4)
    toit = poly((8, 50), (50, 12), (92, 50), (84, 56), (50, 26), (16, 56), arrondi=2)
    toit_plein = poly((14, 50), (50, 18), (86, 50))
    porte = rect(42, 62, 16, 28, 6)
    return r(murs, ('#f2dfb8', '#fff3d8', '#c9ad7c'), brillance=False) + [('#c9ad7c', toit_plein)] + r(toit, ROUGE, d=3, brillance=False) + r(porte, BOIS, d=2, brillance=False) + r(rect(64, 58, 10, 10, 2), BLEU, d=2, brillance=False)


@icone('🏰')
def chateau():
    # (27/10) Le château de la quête finale, restauré : un donjon au toit pointu bleu roi, deux tours
    # rondes aux toits pointus et leurs fanions, un mur crénelé en pierre crème, et la grande porte
    # en bois en arc.
    pierre = ('#f3e7cc', '#fffaf0', '#cdb88f')
    toit = ('#5f7fe8', '#a9bcff', '#3a56b8')
    donjon = rect(34, 30, 32, 40, 2)
    toit_donjon = poly((29, 33), (50, 5), (71, 33), arrondi=2)
    tour_g = rect(7, 44, 21, 48, 3)
    toit_g = poly((3, 46), (17.5, 15), (32, 46), arrondi=2)
    tour_d = rect(72, 44, 21, 48, 3)
    toit_d = poly((68, 46), (82.5, 15), (97, 46), arrondi=2)
    mur = union(rect(25, 60, 50, 32, 2), *[rect(x, 53, 7, 9, 1.5) for x in (26, 36.5, 46.5, 56.5, 67)])
    porte = svg('M 40 92 L 40 78 Q 40 67 50 67 Q 60 67 60 78 L 60 92 Z')
    fenetres = union(rect(14.5, 56, 6, 11, 3), rect(79.5, 56, 6, 11, 3), rect(46, 40, 8, 13, 4))
    fanions = union(poly((17.5, 6), (29, 9.5), (17.5, 13)), poly((82.5, 6), (94, 9.5), (82.5, 13)))
    mats = union(trait([(17.5, 16), (17.5, 5)], 2.5), trait([(82.5, 16), (82.5, 5)], 2.5))
    return (
        r(donjon, pierre, d=3, brillance=False)
        + r(toit_donjon, toit, d=3, bx=42, by=18)
        + [(FONCE, fenetres)]
        + [(NOIR[0], mats)]
        + r(fanions, ROUGE, d=1.5, brillance=False)
        + r(tour_g, pierre, d=3, brillance=False)
        + r(tour_d, pierre, d=3, brillance=False)
        + [(FONCE, inter(fenetres, union(tour_g, tour_d)))]
        + r(toit_g, toit, d=3, bx=13, by=30, brx=4, bry=6)
        + r(toit_d, toit, d=3, bx=78, by=30, brx=4, bry=6)
        + r(mur, pierre, d=3, brillance=False)
        + r(porte, BOIS, d=2, brillance=False)
        + [(BOIS[2], trait([(50, 68), (50, 92)], 2.5)), (OR[0], cercle(54.5, 81, 1.8))]
    )


@icone('🛗')
def ascenseur():
    cabine = rect(16, 10, 68, 82, 8)
    vitre = rect(26, 20, 48, 62, 4)
    haut = poly((50, 28), (62, 44), (38, 44))
    bas = poly((50, 74), (62, 58), (38, 58))
    return r(cabine, METAL, brillance=False) + [('#4a5560', vitre), (OR[0], haut), (OR[0], bas)]


@icone('🕳')
def entree_mine():
    cadre = svg('M 10 92 L 10 40 Q 10 10 50 10 Q 90 10 90 40 L 90 92 Z')
    trou = svg('M 24 92 L 24 44 Q 24 24 50 24 Q 76 24 76 44 L 76 92 Z')
    rails = union(trait([(38, 92), (44, 60)], 3), trait([(62, 92), (56, 60)], 3))
    return r(cadre, BOIS, brillance=False) + [('#1f1610', trou), ('#3a2a1c', inter(trou, rect(0, 70, 100, 30))), ('#9aa6b2', rails), (OR[0], cercle(50, 34, 4))]


@icone('🚧')
def barriere():
    pieds = union(rect(20, 40, 8, 52, 2), rect(72, 40, 8, 52, 2))
    planche = rect(8, 30, 84, 26, 5)
    rayures = inter(planche, union(*[poly((x, 30), (x + 12, 30), (x - 2, 56), (x - 14, 56)) for x in (14, 38, 62, 86)]))
    return r(pieds, METAL, d=2, brillance=False) + [(BLANC[0], planche), (ORANGE[0], rayures), ('#ffffff80', rect(10, 32, 80, 5, 2))] + r(cercle(16, 22, 6), ORANGE, d=2, brillance=False) + r(cercle(84, 22, 6), ORANGE, d=2, brillance=False)


@icone('🌍')
def globe():
    boule = cercle(50, 50, 40)
    terres = inter(
        boule,
        union(
            svg('M 22 30 Q 36 18 50 26 Q 52 40 40 44 Q 36 56 26 54 Q 14 44 22 30 Z'),
            svg('M 56 50 Q 70 44 80 54 Q 82 70 66 80 Q 56 74 60 64 Q 52 58 56 50 Z'),
            svg('M 58 16 Q 70 14 76 24 Q 66 28 58 16 Z'),
        ),
    )
    return r(boule, BLEU, brillance=False) + [(VERT[0], terres), (VERT[2], moins(terres, deplace(terres, -2, -3))), ('#ffffff90', ellipse(34, 26, 12, 6, -30))]


@icone('🗺')
def carte():
    papier = poly((10, 22), (36, 12), (64, 22), (90, 12), (90, 78), (64, 88), (36, 78), (10, 88))
    plis = union(poly((36, 12), (64, 22), (64, 88), (36, 78)))
    chemin = courbe('M 22 72 Q 30 50 46 56 Q 60 62 66 42', 3.5)
    croix = union(trait([(66, 28), (78, 40)], 5), trait([(78, 28), (66, 40)], 5))
    return [('#f0d9a4', papier), ('#d9bd80', plis), ('#a8743a', chemin), (ROUGE[0], croix)]


BRIQUE = ('#d65a36', '#f59a74', '#9e3a20')


@icone('🏭')
def fonderie():
    # (26/10) La fonderie : un four en briques à la bouche orange qui rougeoie, sa cheminée qui
    # fume, et un lingot d'or tout juste sorti du moule.
    four = svg('M 10 92 L 10 52 Q 10 32 32 32 L 62 32 Q 84 32 84 52 L 84 92 Z')
    cheminee = rect(58, 10, 18, 30, 3)
    bouche = svg('M 26 92 L 26 68 Q 26 52 46 52 Q 66 52 66 68 L 66 92 Z')
    joints = union(*[rect(x, y, 14, 4, 2) for x, y in ((16, 42), (40, 40), (70, 46), (14, 60), (72, 64), (14, 78), (72, 80))])
    flamme = svg('M 32 92 Q 30 76 40 68 Q 40 78 46 78 Q 44 64 52 58 Q 54 72 60 74 Q 62 84 60 92 Z')
    coeur = svg('M 38 92 Q 38 82 46 78 Q 48 84 52 84 Q 56 86 54 92 Z')
    fumee = union(cercle(70, 8, 6), cercle(82, 6, 8), cercle(92, 14, 5))
    lingot = poly((60, 84), (84, 84), (90, 94), (54, 94))
    return (
        r(fumee, BLANC, d=2, brillance=False)
        + r(cheminee, NOIR, d=3, brillance=False)
        + [('#ffffff40', rect(61, 13, 4, 22, 2))]
        + r(four, BRIQUE, brillance=False)
        + [(BRIQUE[2], joints), (FONCE, bouche), ('#ff8a1f40', grossir(bouche, 3)), (ORANGE[0], flamme), (OR[1], coeur)]
        + r(lingot, OR, d=2, brillance=False)
        + [(OR[1], poly((62, 85), (82, 85), (84, 88), (60, 88)))]
    )


@icone('🏪')
def joaillerie():
    # (26/10) La joaillerie : une petite boutique crème à l'auvent violet festonné, une vitrine où
    # brillent des bijoux, et une grosse gemme en enseigne sur le toit.
    murs = rect(16, 46, 68, 46, 4)
    auvent = union(rect(10, 40, 80, 12, 4), *[cercle(x, 52, 6.8) for x in (17, 30.5, 44, 57.5, 71, 84)])
    rayures = inter(auvent, union(*[rect(x, 30, 13.5, 40) for x in (23.75, 50.75, 77.75)]))
    vitrine = rect(24, 62, 32, 22, 3)
    porte = rect(62, 62, 14, 30, 3)
    k = 0.42

    def pt(x, y):
        return (50 + (x - 50) * k, 22 + (y - 50) * k)

    gemme = poly(pt(30, 14), pt(70, 14), pt(90, 46), pt(50, 90), pt(10, 46))
    return (
        r(murs, BLANC, brillance=False)
        + [(FONCE, rect(46, 34, 8, 8))]
        + [
            ('#4fd3f0', gemme),
            ('#b8f3ff', poly(pt(30, 14), pt(70, 14), pt(62, 32), pt(38, 32))),
            ('#1f9ec4', poly(pt(90, 46), pt(62, 32), pt(50, 90))),
            ('#ffffffd0', eclat(78, 14, 7)),
            ('#ffffffd0', eclat(22, 20, 5)),
        ]
        + r(auvent, VIOLET, d=3, brillance=False)
        + [(VIOLET[1], rayures)]
        + [('#8cc8f5', vitrine), ('#ffffff90', poly((28, 64), (34, 64), (28, 74)))]
        + [(OR[0], contour(ellipse(34, 78, 5, 4), 2.5)), ('#4fd3f0', cercle(34, 73, 2.6)), ('#e8325f', cercle(46, 76, 3.4)), ('#2fb35a', cercle(52, 70, 2.6))]
        + r(porte, VIOLET, d=2, brillance=False)
        + [(OR[0], cercle(72, 78, 2))]
    )


# ---------------------------------------------------------------------------
# Les wagonnets et les rails
# ---------------------------------------------------------------------------


@icone('🛤')
def rails():
    couches = []
    for y, demi in ((84, 40), (66, 34), (50, 29), (36, 24), (24, 20)):
        couches += r(rect(50 - demi, y - 4, demi * 2, 8, 2), BOIS, d=2, brillance=False)
    gauche = poly((22, 94), (30, 94), (46, 14), (42, 14))
    droite = poly((70, 94), (78, 94), (58, 14), (54, 14))
    return couches + [('#7d8894', gauche), ('#7d8894', droite), ('#dfe6ec', poly((22, 94), (25, 94), (43, 14), (42, 14))), ('#dfe6ec', poly((70, 94), (73, 94), (55, 14), (54, 14)))]


def _wagonnet(couleurs, chargement=True):
    caisse = poly((8, 34), (92, 34), (82, 76), (18, 76), arrondi=3)
    couches = []
    if chargement:
        tas = union(cercle(30, 34, 12), cercle(50, 28, 14), cercle(70, 34, 12))
        couches += r(tas, ('#8a8a86', '#c8c8c2', '#5e5e5a'), d=3, brillance=False) + [(OR[0], cercle(48, 26, 6)), ('#4fd3f0', cercle(66, 32, 4.5)), ('#e0261f', cercle(32, 32, 4.5))]
    couches += r(caisse, couleurs, brillance=False)
    couches += [('#00000030', rect(14, 50, 72, 6, 2))]
    for x in (30, 70):
        couches += r(cercle(x, 80, 11), NOIR, d=3, brillance=False) + [(METAL[0], cercle(x, 80, 4))]
    return couches


@icone('🛒')
def wagonnet_plein():
    return _wagonnet(METAL)


@icone('🚃')
def wagonnet():
    return _wagonnet(ROUGE, chargement=False)


# ---------------------------------------------------------------------------
# L'énergie
# ---------------------------------------------------------------------------


@icone('⚡')
def eclair():
    e = poly((60, 4), (20, 54), (46, 54), (36, 96), (82, 40), (54, 40), (68, 4), arrondi=2)
    return r(e, OR, d=4, brillance=False) + [('#ffffffb0', poly((58, 10), (64, 10), (32, 50), (26, 50)))]


@icone('🔥')
def feu():
    f = svg('M 50 6 Q 62 26 74 36 Q 90 52 84 70 Q 76 94 50 94 Q 24 94 16 70 Q 10 52 28 36 Q 30 50 38 52 Q 34 28 50 6 Z')
    dedans = svg('M 50 44 Q 58 56 66 62 Q 72 72 66 82 Q 58 92 50 92 Q 40 92 34 82 Q 28 72 36 62 Q 40 70 46 70 Q 42 56 50 44 Z')
    return r(f, ORANGE, brillance=False) + r(dedans, OR, d=3, brillance=False)


@icone('💡')
def ampoule():
    verre = svg('M 50 6 Q 82 6 82 38 Q 82 54 66 66 L 66 72 L 34 72 L 34 66 Q 18 54 18 38 Q 18 6 50 6 Z')
    culot = rect(34, 72, 32, 20, 5)
    return r(verre, OR, by=24, bx=36, brx=8, bry=10) + r(culot, METAL, d=3, brillance=False) + [('#66717d', rect(34, 78, 32, 3)), ('#66717d', rect(34, 85, 32, 3))]


@icone('⚙')
def engrenage():
    dents = [tourne(rect(42, 4, 16, 20, 3), a) for a in range(0, 360, 45)]
    roue = moins(union(cercle(50, 50, 32), *dents), cercle(50, 50, 12))
    return r(roue, METAL, by=30, bx=34)


# ---------------------------------------------------------------------------
# Les personnages
# ---------------------------------------------------------------------------


def _visage(cx=50, cy=58, rayon=30):
    return cercle(cx, cy, rayon)


@icone('👷')
def mineur():
    tete = _visage()
    casque = union(svg('M 18 52 Q 18 16 50 16 Q 82 16 82 52 Z'), rect(10, 46, 80, 10, 5))
    lampe = cercle(50, 32, 9)
    return (
        r(tete, PEAU, brillance=False)
        + [(FONCE, ellipse(40, 66, 3.5, 4.5)), (FONCE, ellipse(60, 66, 3.5, 4.5)), (FONCE, courbe('M 42 78 Q 50 84 58 78', 3.5)), ('#ff9a8a90', ellipse(32, 74, 5, 3)), ('#ff9a8a90', ellipse(68, 74, 5, 3))]
        + r(casque, OR, brillance=False)
        + r(lampe, BLANC, d=2, brillance=False)
        + [('#fff6a8', cercle(50, 32, 5))]
    )


@icone('😠')
def fache():
    tete = cercle(50, 52, 40)
    return r(tete, ('#ff7a3d', '#ffb07a', '#c94a14'), brillance=False) + [
        (FONCE, trait([(26, 34), (44, 44)], 6)),
        (FONCE, trait([(74, 34), (56, 44)], 6)),
        (FONCE, ellipse(38, 52, 5, 6)),
        (FONCE, ellipse(62, 52, 5, 6)),
        (FONCE, courbe('M 34 76 Q 50 64 66 76', 6)),
        ('#ffffff60', ellipse(30, 26, 10, 5, -30)),
    ]


def _buste(cx, cy, s, couleurs):
    tete = cercle(cx, cy - 16 * s, 15 * s)
    corps = svg(f'M {cx - 28 * s} {cy + 30 * s} Q {cx - 28 * s} {cy + 2 * s} {cx} {cy + 2 * s} Q {cx + 28 * s} {cy + 2 * s} {cx + 28 * s} {cy + 30 * s} Z')
    return r(corps, couleurs, d=3, brillance=False) + r(tete, PEAU, d=3, brillance=False)


@icone('👤')
def personne():
    return _buste(50, 52, 1.35, BLEU)


@icone('👥')
def personnes():
    return _buste(66, 50, 1.05, VIOLET) + _buste(38, 58, 1.15, BLEU)


@icone('🎩')
def chapeau():
    bord = ellipse(50, 78, 42, 12)
    haut = rect(26, 16, 48, 62, 6)
    return r(bord, NOIR, d=3, brillance=False) + r(haut, NOIR, brillance=False) + [(ROUGE[0], rect(26, 58, 48, 11)), ('#ffffff40', rect(32, 20, 8, 36, 4))]


@icone('🚶')
def botte():
    b = svg('M 30 10 L 62 10 L 62 58 Q 92 62 92 82 L 92 90 L 22 90 L 22 60 Q 30 50 30 10 Z')
    return r(b, BOIS, brillance=False) + [('#5e3818', rect(22, 80, 70, 10, 3)), ('#5e3818', rect(30, 22, 32, 5, 2))]


def _main(levee=True):
    paume = rect(26, 44, 50, 46, 16)
    index = rect(40, 6, 16, 50, 8)
    pouce = rect(12, 50, 30, 14, 7, angle=-30)
    plis = union(rect(56, 46, 3, 14, 1.5), rect(66, 48, 3, 12, 1.5))
    return r(union(paume, index, pouce), PEAU, brillance=False) + [(PEAU[2], plis)]


@icone('👆')
def doigt():
    return _main()


@icone('👋')
def coucou():
    paume = rect(26, 40, 48, 50, 18, angle=-15)
    doigts = union(*[rect(x, 10 + abs(x - 46) * 0.3, 12, 44, 6, angle=-15) for x in (30, 44, 58)])
    pouce = rect(64, 50, 30, 13, 6.5, angle=-50)
    main = tourne(union(paume, doigts, pouce), -5)
    return r(main, PEAU, brillance=False) + [(FONCE, courbe('M 8 30 Q 4 40 8 50', 4)), (FONCE, courbe('M 88 14 Q 94 22 92 32', 4))]


# ---------------------------------------------------------------------------
# Le personnel
# ---------------------------------------------------------------------------


@icone('💼')
def mallette():
    anse = contour(rect(36, 12, 28, 20, 6), 6)
    corps = rect(10, 28, 80, 60, 10)
    return [('#5e3818', anse)] + r(corps, BOIS, brillance=False) + [('#76461e', rect(10, 52, 80, 5))] + r(rect(42, 46, 16, 14, 3), OR, d=2, brillance=False)


@icone('🎲')
def de():
    face = rect(14, 14, 72, 72, 16, angle=10)
    points = union(*[tourne(cercle(x, y, 6.5), 10) for x, y in ((32, 32), (50, 50), (68, 68), (68, 32), (32, 68))])
    return r(face, BLANC, brillance=False) + [(ROUGE[0], points)]


# ---------------------------------------------------------------------------
# Les signes
# ---------------------------------------------------------------------------


@icone('✔')
def coche():
    c = trait([(16, 52), (40, 76), (86, 22)], 17)
    return r(c, VERT, d=3, brillance=False) + [('#ffffff70', trait([(20, 50), (40, 70)], 4))]


@icone('☑')
def case_cochee():
    boite = rect(10, 10, 80, 80, 16)
    return r(boite, VERT, brillance=False) + [(BLANC_PUR, trait([(26, 52), (42, 68), (74, 32)], 12))]


@icone('✖')
def croix():
    c = union(trait([(20, 20), (80, 80)], 17), trait([(80, 20), (20, 80)], 17))
    return r(c, ROUGE, d=3, brillance=False)


@icone('➕')
def plus():
    c = union(rect(38, 10, 24, 80, 8), rect(10, 38, 80, 24, 8))
    return r(c, VERT, d=3, brillance=False)


def _fleche(couleurs, vers_le_bas=False):
    f = poly((50, 6), (90, 48), (66, 48), (66, 92), (34, 92), (34, 48), (10, 48), arrondi=4)
    if vers_le_bas:
        f = tourne(f, 180)
    return r(f, couleurs, d=4, brillance=False)


@icone('⬆')
def fleche_haut():
    return _fleche(VERT)


@icone('⬇')
def fleche_bas():
    return _fleche(ORANGE, vers_le_bas=True)


def _double(couleurs, vers_le_bas=False):
    c = union(trait([(16, 50), (50, 18), (84, 50)], 14), trait([(16, 82), (50, 50), (84, 82)], 14))
    if vers_le_bas:
        c = tourne(c, 180)
    return r(c, couleurs, d=3, brillance=False)


@icone('⏫')
def monte():
    return _double(BLEU)


@icone('⏬')
def descend():
    return _double(BLEU, vers_le_bas=True)


@icone('⚠')
def attention():
    t = poly((50, 8), (94, 88), (6, 88), arrondi=6)
    return r(t, OR, brillance=False) + [(FONCE, rect(45, 34, 10, 30, 5)), (FONCE, cercle(50, 74, 6))]


@icone('❔')
def question():
    bulle = cercle(50, 50, 42)
    q = courbe('M 36 38 Q 36 22 50 22 Q 66 22 66 36 Q 66 46 54 52 Q 50 54 50 62', 10)
    return r(bulle, BLEU, brillance=False) + [(BLANC_PUR, q), (BLANC_PUR, cercle(50, 78, 6.5))]


@icone('⏸')
def pause():
    rond = cercle(50, 50, 42)
    return r(rond, ORANGE, brillance=False) + [(BLANC_PUR, rect(32, 28, 13, 44, 4)), (BLANC_PUR, rect(55, 28, 13, 44, 4))]


@icone('🔄', '🔁')
def recommencer():
    arc1 = courbe('M 20 52 Q 18 20 50 18 Q 70 18 78 32', 12, bouts='plat')
    pointe1 = poly((66, 30), (90, 22), (86, 46))
    arc2 = tourne(arc1, 180)
    pointe2 = tourne(pointe1, 180)
    return r(union(arc1, pointe1), BLEU, d=3, brillance=False) + r(union(arc2, pointe2), VERT, d=3, brillance=False)


@icone('✨')
def etincelles():
    return [(OR[0], eclat(42, 54, 32, 10)), (OR[1], eclat(42, 54, 16, 5)), (OR[0], eclat(78, 22, 16, 5)), (OR[0], eclat(80, 78, 12, 4))]


@icone('💥')
def boum():
    b = etoile(50, 50, 46, 24, branches=9)
    return r(b, ORANGE, brillance=False) + [(OR[0], etoile(50, 50, 28, 15, branches=9)), (OR[1], cercle(50, 50, 9))]


# ---------------------------------------------------------------------------
# Le menu, les succès, le classement
# ---------------------------------------------------------------------------


@icone('🔒')
def cadenas():
    anse = contour(svg('M 30 46 L 30 32 Q 30 10 50 10 Q 70 10 70 32 L 70 46'), 10)
    corps = rect(16, 42, 68, 50, 10)
    return r(anse, METAL, d=3, brillance=False) + r(corps, OR, brillance=False) + [(FONCE, union(cercle(50, 62, 7), rect(46, 62, 8, 16, 3)))]


@icone('🔓')
def cadenas_ouvert():
    anse = contour(svg('M 54 32 Q 54 10 72 10 Q 90 10 90 32 L 90 40'), 10)
    corps = rect(10, 42, 68, 50, 10)
    return r(anse, METAL, d=3, brillance=False) + r(corps, OR, brillance=False) + [(FONCE, union(cercle(44, 62, 7), rect(40, 62, 8, 16, 3)))]


@icone('📊')
def graphique():
    fond = rect(8, 10, 84, 80, 10)
    return r(fond, BLANC, brillance=False) + r(rect(20, 52, 16, 28, 3), BLEU, d=2, brillance=False) + r(rect(42, 30, 16, 50, 3), VERT, d=2, brillance=False) + r(rect(64, 42, 16, 38, 3), ORANGE, d=2, brillance=False)


@icone('🎵')
def note():
    tige = union(rect(40, 14, 9, 62, 3), poly((40, 14), (80, 6), (80, 22), (49, 30)), rect(71, 6, 9, 56, 3))
    tetes = union(ellipse(34, 76, 14, 11, -20), ellipse(65, 64, 14, 11, -20))
    return r(union(tige, tetes), VIOLET, d=3, brillance=False)


@icone('☁')
def nuage():
    n = union(cercle(30, 60, 20), cercle(52, 44, 26), cercle(74, 60, 18), rect(30, 56, 44, 24, 8))
    return r(n, BLANC, brillance=False)


@icone('🏆')
def trophee():
    coupe = svg('M 22 12 L 78 12 L 78 30 Q 78 62 50 64 Q 22 62 22 30 Z')
    anses = union(contour(svg('M 24 22 Q 6 22 10 38 Q 14 50 28 48'), 6), contour(svg('M 76 22 Q 94 22 90 38 Q 86 50 72 48'), 6))
    pied = union(rect(44, 60, 12, 16, 2), rect(28, 76, 44, 14, 4))
    return r(anses, OR, d=2, brillance=False) + r(pied, BOIS, d=3, brillance=False) + r(coupe, OR, by=26, bx=36) + [(OR[1], etoile(50, 34, 10, 4.5))]


def _medaille(couleurs, ruban=BLEU):
    r1 = poly((26, 6), (44, 6), (56, 44), (40, 50))
    r2 = poly((74, 6), (56, 6), (44, 44), (60, 50))
    disque = cercle(50, 64, 28)
    return [(ruban[2], r1), (ruban[0], r2)] + r(disque, couleurs, brillance=False) + [(couleurs[1], etoile(50, 64, 15, 7)), (couleurs[2], contour(cercle(50, 64, 21), 2.5))]


@icone('⭐', '🌟')
def etoile_niveau():
    # (29/10) Le niveau du joueur.
    return r(etoile(50, 52, 46, 21), OR, bx=40, by=36) + [(OR[1], etoile(50, 52, 16, 7))]


@icone('🍀')
def trefle():
    # (30/10) Le bonus de combo « Fortune ».
    feuilles = union(cercle(36, 34, 17), cercle(64, 34, 17), cercle(36, 60, 17), cercle(64, 60, 17))
    tige = contour(svg('M 54 64 Q 62 82 74 92'), 6)
    return r(tige, VERT, d=2, brillance=False) + r(feuilles, VERT) + [(VERT[1], cercle(50, 47, 6))]


@icone('🎉')
def cotillon():
    # (29/10) Un niveau gagné : un cornet d'où sortent des confettis.
    cornet = poly((10, 90), (34, 40), (60, 66))
    rayures = union(contour(svg('M 22 64 L 44 78'), 4), contour(svg('M 28 52 L 52 66'), 4))
    return (
        r(cornet, VIOLET, d=3, brillance=False)
        + [(OR[1], rayures)]
        + r(cercle(66, 22, 7), ROUGE, d=2, brillance=False)
        + r(rect(76, 40, 12, 12, 3), BLEU, d=2, brillance=False)
        + r(cercle(48, 18, 6), VERT, d=2, brillance=False)
        + r(etoile(84, 70, 10, 4.5), OR, d=2, brillance=False)
    )


@icone('🏅', '🥇')
def medaille_or():
    return _medaille(OR)


@icone('🥈')
def medaille_argent():
    return _medaille(METAL, ROUGE)


@icone('🥉')
def medaille_bronze():
    return _medaille(('#d08a4a', '#f2b98a', '#985a26'), VERT)


# (26/10, redessinée) La poubelle 🗑️ (les boutons roses « Enlever », « Retirer ») : une vraie
# poubelle de métal gris bleuté vue de trois quarts. Un seau en tronc de cône, rayé de cannelures
# verticales (plus serrées sur les côtés, car le seau est rond), avec un rebord en haut et un
# cerclage en bas. Le couvercle bombé, avec sa poignée, est entrouvert (soulevé à gauche) : une
# boule de papier froissé dépasse. Le métal a cinq tons à plat, du plus clair à gauche (la
# lumière) au plus sombre à droite, comme un cylindre ; un trait d'encre sépare le couvercle.

POUBELLE_TONS = ('#f4f8fc', '#d3dfeb', '#a9bccf', '#7f95ad', '#5a6f88')
POUBELLE_CREUX = '#2f3b52'


def _seau_point(theta, t):
    """Un point de la surface du seau : « theta » fait le tour (0 : le bord gauche, pi : le bord
    droit, en passant par devant), « t » descend du haut (0) au bas (1)."""
    cx = 50
    rx = 32 + (25 - 32) * t  # le seau se rétrécit vers le bas
    cy = 48 + (90 - 48) * t
    ry = 7 + (6 - 7) * t
    return (cx - rx * math.cos(theta), cy + ry * math.sin(theta))


def _seau_morceau(theta0, theta1, t0, t1, pas=10):
    """Le morceau de la surface du seau entre deux « theta » et deux hauteurs « t »."""
    angles = [theta0 + (theta1 - theta0) * i / pas for i in range(pas + 1)]
    haut = [_seau_point(a, t0) for a in angles]
    bas = [_seau_point(a, t1) for a in reversed(angles)]
    return poly(*(haut + bas))


@icone('🗑')
def poubelle():
    pi = math.pi
    T = POUBELLE_TONS
    seau = union(_seau_morceau(0, pi, 0, 1, 24), ellipse(50, 48, 32, 7))
    couches = [(T[2], seau)]
    # les tons du cylindre : clair à gauche, sombre à droite
    couches += [
        (T[1], inter(seau, _seau_morceau(0.08 * pi, 0.34 * pi, 0, 1))),
        (T[3], inter(seau, _seau_morceau(0.66 * pi, 0.86 * pi, 0, 1))),
        (T[4], inter(seau, _seau_morceau(0.86 * pi, pi, 0, 1))),
    ]
    # les cannelures : un creux sombre, et à sa gauche un fil de lumière
    for k in range(1, 7):
        a = pi * k / 7
        creux = trait([_seau_point(a, 0.2), _seau_point(a, 0.82)], 2.6)
        fil = trait([_seau_point(a - 0.07, 0.2), _seau_point(a - 0.07, 0.82)], 1.4)
        couches += [(T[0] if a < 0.6 * pi else T[2], fil), (POUBELLE_CREUX + 'b0', creux)]
    # le cerclage du bas et le rebord du haut (des bandes en relief)
    couches += [
        (T[3], _seau_morceau(0, pi, 0.88, 1, 24)),
        (T[2], _seau_morceau(0.1 * pi, 0.6 * pi, 0.89, 0.95, 16)),
        (T[3], _seau_morceau(0, pi, 0.06, 0.15, 24)),
        (T[1], _seau_morceau(0.08 * pi, 0.62 * pi, 0.065, 0.11, 16)),
        # le grand reflet du seau, en long à gauche
        (T[0] + 'd0', _seau_morceau(0.2 * pi, 0.26 * pi, 0.2, 0.8, 4)),
    ]
    # l'ouverture : le rebord rond et le noir du dedans
    couches += [
        (T[1], ellipse(50, 48, 32, 7)),
        (POUBELLE_CREUX, ellipse(50, 48.6, 28, 5.2)),
    ]
    # la boule de papier froissé qui dépasse, à gauche : une boule cabossée à facettes (comme les
    # gemmes, par `_facettes()`), blanc crème, avec des plis
    papier = poly(*_blob(30, 42, 14, 10.5, (1.0, 0.86, 1.05, 0.9, 1.06, 0.88, 1.02, 0.84, 1.04, 0.92), -10), arrondi=1.5)
    milieu = _blob(28, 41, 6.5, 4.8, (1.0, 0.8, 1.1, 0.85, 1.0), 20)
    couches += [(FONCE, grossir(papier, 2.2)), ('#efe9dc', papier)]
    couches += _facettes(milieu, papier, ('#ffffff', '#f7f2e8', '#e6dece', '#cfc4b0', '#b3a68f'))
    couches += [
        ('#fbf8f1', poly(*milieu)),
        ('#b3a68f', trait([milieu[1], (33, 50)], 1.3)),
        ('#b3a68f', trait([milieu[3], (17, 41)], 1.3)),
        ('#b3a68f', trait([(24, 39), (27, 42), (31, 39)], 1.2)),
    ]
    # le couvercle bombé, soulevé à gauche (il tourne autour de son bord droit)
    bord = union(ellipse(50, 41, 35, 8), rect(15, 36, 70, 5), ellipse(50, 36, 35, 8))
    dome = moins(ellipse(50, 36, 28, 16), rect(0, 36, 100, 50))
    poignee = courbe('M 41 22 Q 40 11 50 11 Q 60 11 59 22', 6)
    couvercle = union(bord, dome)

    def penche(forme):
        return deplace(tourne(forme, 18, 86, 42), 0, 2.5)

    couches += [
        (FONCE, penche(grossir(couvercle, 2.2))),
        (T[2], penche(couvercle)),
        (T[3], penche(moins(bord, ellipse(50, 36, 35, 8)))),
        (T[4], penche(inter(moins(bord, ellipse(50, 36, 35, 8)), rect(64, 0, 40, 100)))),
        (T[1], penche(ellipse(50, 36, 35, 8))),
        (T[2], penche(dome)),
        (T[1], penche(inter(dome, ellipse(40, 36, 17, 15)))),
        (T[3], penche(inter(dome, moins(ellipse(50, 36, 28, 16), ellipse(45, 37, 28, 16))))),
        (T[0], penche(ellipse(37, 27, 7, 3.2, -25))),
        (FONCE, penche(grossir(poignee, 2.0))),
        (T[2], penche(poignee)),
        (T[0], penche(courbe('M 42.8 19 Q 42.8 13.5 49 13.3', 2))),
    ]
    couches.append(('#ffffffe0', eclat(31, 70, 4.5)))
    return couches


@icone('📄')
def page():
    feuille = poly((18, 8), (64, 8), (82, 26), (82, 92), (18, 92))
    coin = poly((64, 8), (82, 26), (64, 26))
    lignes = union(*[rect(28, y, 44, 5, 2.5) for y in (40, 54, 68)])
    return r(feuille, BLANC, brillance=False) + [(BLANC[2], coin), ('#a8b4c0', lignes)]


@icone('📲')
def telephone():
    corps = rect(26, 6, 48, 88, 10)
    ecran = rect(32, 16, 36, 62, 4)
    fleche = poly((56, 30), (56, 22), (90, 47), (56, 72), (56, 64), (36, 64), (36, 30), arrondi=2)
    return r(corps, NOIR, brillance=False) + [(BLEU[1], ecran), (BLANC[1], cercle(50, 86, 3.5))] + r(fleche, VERT, d=3, brillance=False)


@icone('⏱')
def chrono():
    cadran = cercle(50, 56, 36)
    bouton = rect(42, 6, 16, 12, 3)
    return r(bouton, METAL, d=2, brillance=False) + r(cadran, OR, brillance=False) + [(BLANC[0], cercle(50, 56, 28)), (FONCE, trait([(50, 56), (50, 36)], 5)), (ROUGE[0], trait([(50, 56), (64, 64)], 4)), (FONCE, cercle(50, 56, 4))]


@icone('⏳')
def sablier():
    verre = svg('M 26 14 L 74 14 Q 74 40 54 50 Q 74 60 74 86 L 26 86 Q 26 60 46 50 Q 26 40 26 14 Z')
    sable_haut = inter(verre, rect(0, 30, 100, 16))
    sable_bas = inter(verre, svg('M 26 86 Q 50 62 74 86 Z'))
    cadres = union(rect(16, 6, 68, 10, 4), rect(16, 84, 68, 10, 4))
    return [('#cfeaf5', verre), (OR[0], sable_haut), (OR[0], sable_bas), (OR[0], rect(48, 48, 4, 26))] + r(cadres, BOIS, d=2, brillance=False)


def _haut_parleur():
    return union(rect(12, 36, 20, 28, 4), poly((26, 36), (54, 14), (54, 86), (26, 64)))


@icone('🔊')
def son():
    ondes = union(courbe('M 64 36 Q 72 50 64 64', 6), courbe('M 74 24 Q 90 50 74 76', 6))
    return r(_haut_parleur(), BLEU, brillance=False) + [(BLEU[0], ondes)]


@icone('🔇')
def muet():
    x = union(trait([(64, 36), (88, 64)], 8), trait([(88, 36), (64, 64)], 8))
    return r(_haut_parleur(), METAL, brillance=False) + [(ROUGE[0], x)]


# ---------------------------------------------------------------------------
# (25/10) Les gemmes, la publicité et le cadeau du jour
# ---------------------------------------------------------------------------


@icone('🎁')
def cadeau():
    boite = rect(14, 42, 72, 46, 6)
    couvercle = rect(8, 30, 84, 16, 5)
    ruban = rect(43, 30, 14, 58, 2)
    noeud_g = svg('M 50 30 Q 30 6 20 18 Q 14 28 50 30 Z')
    noeud_d = miroir(noeud_g)
    return r(boite, ROUGE, brillance=False) + r(couvercle, ROUGE, brillance=False) + [(OR[0], ruban), (OR[0], noeud_g), (OR[0], noeud_d), (OR[2], rect(43, 42, 14, 4))]


@icone('📺')
def television():
    caisse = rect(8, 22, 84, 62, 10)
    ecran = rect(17, 31, 52, 44, 6)
    antenne = union(trait([(50, 22), (32, 6)], 4), trait([(50, 22), (66, 6)], 4))
    return [(FONCE, antenne)] + r(caisse, VIOLET, brillance=False) + [('#2f2a48', ecran), ('#8cc8f5', rect(21, 35, 44, 36, 4)), (BLANC_PUR, poly((38, 44), (38, 62), (52, 53), arrondi=2)), (OR[0], cercle(80, 40, 5)), (OR[0], cercle(80, 58, 5))]


@icone('📌')
def punaise():
    tete = svg('M 30 12 Q 50 2 70 12 L 64 40 Q 50 46 36 40 Z')
    aiguille = trait([(50, 44), (50, 92)], 5)
    return [(METAL[2], aiguille)] + r(tete, ROUGE, brillance=True) + [(ROUGE[2], rect(28, 38, 44, 10, 5))]


@icone('☀')
def soleil():
    rayons = union(*[tourne(rect(46, 2, 8, 22, 4), a) for a in range(0, 360, 45)])
    return [(OR[2], rayons)] + r(cercle(50, 50, 26), OR, brillance=True)


@icone('❓')
def question():
    crochet = courbe('M 34 32 Q 34 12 52 12 Q 70 12 70 30 Q 70 44 52 50 L 52 62', 14)
    return [(ROUGE[0], crochet), (ROUGE[0], cercle(52, 82, 8))]


@icone('💤')
def sommeil():
    z = lambda x, y, t: poly((x, y), (x + t, y), (x, y + t), (x + t, y + t), arrondi=0)
    return [(BLEU[0], contour(z(10, 50, 34), 7)), (BLEU[1], contour(z(52, 28, 24), 6)), (BLEU[1], contour(z(76, 10, 14), 5))]


@icone('☕')
def cafe():
    tasse = svg('M 14 36 L 72 36 L 66 84 Q 64 90 56 90 L 30 90 Q 22 90 20 84 Z')
    anse = contour(ellipse(76, 56, 12, 14), 7)
    return [(BLANC[2], anse)] + r(tasse, BLANC, brillance=False) + [('#7a4a26', rect(18, 36, 50, 8, 3)), (BLANC[1], courbe('M 34 28 Q 28 18 36 8', 5)), (BLANC[1], courbe('M 52 28 Q 46 18 54 8', 5))]


@icone('👑')
def couronne():
    forme = poly((10, 76), (14, 28), (32, 50), (50, 18), (68, 50), (86, 28), (90, 76), arrondi=3)
    return r(forme, OR, brillance=True) + [(ROUGE[0], cercle(50, 62, 7)), (BLEU[0], cercle(28, 66, 5)), (VERT[0], cercle(72, 66, 5))]
