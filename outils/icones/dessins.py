# Les dessins des icônes (27/10). Chaque icône est une fonction qui renvoie ses couches, de la
# plus basse à la plus haute : (couleur, forme). Le gros contour brun et l'ombre sont ajoutés
# tout seuls (fabriquer.py). On dessine dans un carré de 100 × 100 (y vers le bas), en laissant
# environ 6 de marge pour le contour.
#
# Les couleurs reviennent souvent : on les nomme ici (base, clair, foncé).

from formes import (
    cercle,
    contour,
    courbe,
    deplace,
    eclat,
    ellipse,
    etoile,
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
FONCE = '#3b2412'
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


@icone('🔩')
def fer():
    # Un lingot de fer vu de trois quarts, et un deuxième derrière.
    def lingot(dx, dy):
        dessus = poly((20 + dx, 30 + dy), (80 + dx, 30 + dy), (94 + dx, 54 + dy), (6 + dx, 54 + dy))
        face = poly((6 + dx, 54 + dy), (94 + dx, 54 + dy), (86 + dx, 80 + dy), (14 + dx, 80 + dy))
        return [
            ('#8e9aa6', union(dessus, face)),
            ('#d6dee6', dessus),
            ('#ffffffb0', poly((26 + dx, 34 + dy), (52 + dx, 34 + dy), (48 + dx, 42 + dy), (22 + dx, 42 + dy))),
            ('#66717d', poly((74 + dx, 54 + dy), (94 + dx, 54 + dy), (86 + dx, 80 + dy), (70 + dx, 80 + dy))),
        ]

    return lingot(0, -14) + lingot(0, 14)


def _gemme(couleurs, forme='hexa'):
    if forme == 'hexa':
        g = poly((30, 14), (70, 14), (90, 46), (50, 90), (10, 46))
        haut = poly((30, 14), (70, 14), (62, 32), (38, 32))
        gauche = poly((10, 46), (38, 32), (50, 90))
        droite = poly((90, 46), (62, 32), (50, 90))
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


@icone('🟡')
def pepite():
    p = poly((14, 62), (24, 34), (50, 20), (78, 28), (90, 56), (74, 82), (40, 86), arrondi=8)
    return r(p, OR, by=34, bx=38, brx=11, bry=6) + [('#ffffffe0', eclat(70, 40, 8)), ('#e3a11e', inter(p, cercle(58, 66, 8)))]


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


@icone('🗑')
def poubelle():
    seau = poly((20, 30), (80, 30), (72, 92), (28, 92), arrondi=4)
    couvercle = rect(12, 18, 76, 12, 5)
    anse = rect(40, 8, 20, 12, 4)
    lignes = union(rect(36, 42, 5, 40, 2.5), rect(48, 42, 5, 40, 2.5), rect(60, 42, 5, 40, 2.5))
    return r(anse, METAL, d=2, brillance=False) + r(seau, METAL, brillance=False) + [('#66717d', lignes)] + r(couvercle, METAL, d=3, brillance=False)


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
