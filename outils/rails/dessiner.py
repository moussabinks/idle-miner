# Dessine les tuiles des rails (vue de dessus), dans le style de « propriété-rail-design »
# (Google Drive, 22/10) : un talus de terre brune avec des cailloux, des traverses en bois
# épaisses, des rails en acier cerclés de foncé, avec du relief.
#
# Un rail se pose sur UNE case, mais la voie est large de DEUX cases (24/10) : elle déborde d'une
# demi-case à gauche et à droite. Chaque tuile couvre donc un carré de 2 × 2 cases centré sur la
# case du rail (512 × 512 pixels) ; dans le sens de la voie, elle s'arrête au bord de la case
# (les tuiles voisines prennent la suite), sur les côtés elle déborde.
#
# Les quatre formes : droit (nord – sud), virage (sud – est), t (la ligne nord – sud continue
# d'un côté, deux rails en L qui tournent vers l'est de l'autre, un plancher au centre) et croix
# (quatre rails en L : les rails ne se croisent jamais, un plancher au centre).
#
# Pour chaque forme, quatre calques (le jeu pose le premier calque de toutes les cases, puis le
# deuxième de toutes les cases, etc.) :
#   - rail_<forme>_cote    : le flanc du talus (la forme du ballast, plus sombre), posé un peu plus
#                            bas à l'écran : on voit l'épaisseur du talus ;
#   - rail_<forme>_ballast : le dessus du talus (la terre et les cailloux) ;
#   - rail_<forme>_ombre   : l'ombre des traverses et des rails (posée un peu à côté) ;
#   - rail_<forme>_voie    : les traverses et les rails.
#
# Usage : python3 outils/rails/dessiner.py public/images/rails
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

dossier = sys.argv[1]
TAILLE = 512  # la tuile finale (2 × 2 cases)
GRAND = TAILLE * 3  # on dessine 3 fois plus grand, puis on réduit (bords plus doux)
CASES = 2.0  # la tuile fait 2 cases de côté ; la case du rail va de 0,5 à 1,5
C = 1.0  # le centre de la case du rail
D = 0.4  # le demi-écartement des rails (en cases)
A, B = C - D, C + D  # les deux rails d'une voie nord – sud
LARGEUR_TALUS = 0.97  # la demi-largeur du talus (presque une case de chaque côté)
RAYON_COIN = 0.1  # l'arrondi des rails en L
DEMI_TRAVERSE = 0.62
EPAISSEUR_TRAVERSE = 0.17
COURTE = 0.55  # les traverses des embranchements, un peu plus courtes
PAS_TRAVERSES = 1 / 3  # à 1/6, 1/2 et 5/6 de la case : elles se raccordent d'une case à l'autre

TERRE = (156, 98, 56)
TERRE_FONCEE = (104, 60, 32)
FLANC = (92, 54, 30)
BOIS = (190, 100, 46)
BOIS_CLAIR = (226, 140, 72)
BOIS_FONCE = (84, 38, 16)
ACIER = (196, 205, 216)
ACIER_CLAIR = (246, 249, 252)
ACIER_FONCE = (44, 50, 62)


def px(v):
    return v / CASES * GRAND


u = (np.arange(GRAND) + 0.5) / GRAND * CASES
U, V = np.meshgrid(u, u)


# --- Les formes (masques) -----------------------------------------------------------------
def bras(direction, w):
    # Une bande du centre jusqu'au bord de la case, dans une direction ('n', 'e', 's', 'o').
    # Sur les côtés, elle est large de w de chaque côté de l'axe.
    if direction == 'n':
        return (np.abs(U - C) <= w) & (V >= 0.5) & (V <= C)
    if direction == 's':
        return (np.abs(U - C) <= w) & (V >= C) & (V <= 1.5)
    if direction == 'e':
        return (np.abs(V - C) <= w) & (U >= C) & (U <= 1.5)
    return (np.abs(V - C) <= w) & (U >= 0.5) & (U <= C)


def forme_droite(directions, w):
    # Les bras demandés, et le milieu de la case. Entre deux bras voisins (un virage d'un
    # embranchement), le coin de la case est rempli aussi.
    m = (np.abs(U - C) <= 0.45) & (np.abs(V - C) <= 0.45) & (np.hypot(U - C, V - C) <= w)
    for d in directions:
        m |= bras(d, w)
    for sx, bx in ((-1, 'o'), (1, 'e')):
        for sy, by in ((-1, 'n'), (1, 's')):
            if bx in directions and by in directions:
                m |= (sx * (U - C) >= 0) & (sx * (U - C) <= 0.5) & (sy * (V - C) >= 0) & (sy * (V - C) <= 0.5)
    return m


def forme_virage(w):
    # Autour du coin sud-est de la case, (1,5 ; 1,5) : un anneau, coupé au quart de la case.
    r = np.hypot(U - 1.5, V - 1.5)
    return (np.abs(r - 0.5) <= w) & (U <= 1.5) & (V <= 1.5)


def bord_irregulier(masque, graine):
    # Le bord du talus n'est pas tiré à la règle : on le grignote un peu, au hasard (seulement
    # sur les côtés : le cœur de la voie reste plein, pour qu'elle se raccorde d'une case à l'autre).
    rng = np.random.default_rng(graine)
    bruit = rng.normal(0, 1, (GRAND // 24, GRAND // 24))
    bruit = np.array(Image.fromarray(((bruit + 3) * 40).clip(0, 255).astype('uint8')).resize((GRAND, GRAND), Image.BICUBIC)) / 255 - 0.47
    m = Image.fromarray((masque * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(GRAND / 160))
    return (np.array(m) / 255 + bruit * 0.5) > 0.5


# --- Le talus : le dessus (terre et cailloux) et le flanc ---------------------------------
def talus(masque, graine, limite):
    rng = np.random.default_rng(graine)
    img = np.zeros((GRAND, GRAND, 4))
    bruit = rng.normal(0, 1, (GRAND // 20, GRAND // 20))
    bruit = np.array(Image.fromarray(((bruit + 3) * 40).clip(0, 255).astype('uint8')).resize((GRAND, GRAND), Image.BICUBIC)) / 255 - 0.47
    fin = rng.normal(0, 1, (GRAND, GRAND)) * 0.05
    teinte = 1 + bruit * 0.28 + fin
    for k in range(3):
        img[..., k] = TERRE[k] * teinte
    # Le bord : un liseré plus sombre (l'arête du talus).
    mi = Image.fromarray((masque * 255).astype('uint8'))
    interieur = np.array(mi.filter(ImageFilter.MinFilter(15))) > 128
    bord = masque & ~interieur
    for k in range(3):
        img[..., k][bord] = TERRE_FONCEE[k] * (1 + fin[bord])
    # Plus clair au milieu (le dessus bombé du talus), plus sombre vers les bords.
    bombe = np.array(mi.filter(ImageFilter.GaussianBlur(GRAND / 40))) / 255
    for k in range(3):
        img[..., k] *= 0.84 + 0.22 * bombe
    img[..., 3] = masque * 255
    image = Image.fromarray(img.clip(0, 255).astype('uint8'), 'RGBA')
    # Les cailloux en relief : une ombre, le galet, et un reflet en haut à gauche. Jamais sur
    # le bord de la case dans le sens de la voie (« limite ») : les tuiles se raccordent.
    trait = ImageDraw.Draw(image)
    couleurs = [(200, 166, 128), (178, 142, 106), (214, 184, 148), (160, 124, 92), (150, 146, 140)]
    poses = 0
    for _ in range(9000):
        if poses >= 120:
            break
        x, y = rng.uniform(0, CASES, 2)
        r = rng.uniform(0.022, 0.05)
        ix, iy = int(px(x)), int(px(y))
        if not (0 <= ix < GRAND and 0 <= iy < GRAND) or not interieur[iy, ix] or not limite(x, y, r):
            continue
        poses += 1
        c = couleurs[rng.integers(len(couleurs))]
        rx, ry = px(r), px(r * rng.uniform(0.65, 0.9))
        cx, cy = px(x), px(y)
        trait.ellipse([cx - rx + 4, cy - ry + 6, cx + rx + 4, cy + ry + 6], fill=(70, 40, 22))
        trait.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=c, outline=(84, 52, 30), width=4)
        trait.ellipse([cx - rx * 0.6, cy - ry * 0.75, cx + rx * 0.15, cy - ry * 0.15], fill=tuple(min(255, v + 38) for v in c))
    flanc = np.zeros((GRAND, GRAND, 4))
    flanc[..., 0], flanc[..., 1], flanc[..., 2] = FLANC
    flanc[..., 3] = masque * 255
    return image, Image.fromarray(flanc.astype('uint8'), 'RGBA')


# --- Les traverses, le plancher, les rails ----------------------------------------------
def planche(image, cx, cy, angle, demi_longueur=DEMI_TRAVERSE, epaisseur=EPAISSEUR_TRAVERSE):
    # Une traverse en bois, vue de dessus : le dessus, un reflet sur l'arête, des veines, les
    # bouts plus foncés. « angle » 0 : couchée de l'ouest à l'est (en travers d'une voie nord – sud).
    trait = ImageDraw.Draw(image)
    ca, sa = np.cos(angle), np.sin(angle)

    def point(l, c):
        return (px(cx + l * ca - c * sa), px(cy + l * sa + c * ca))

    l, e = demi_longueur, epaisseur / 2
    trait.polygon([point(-l, -e), point(l, -e), point(l, e), point(-l, e)], fill=BOIS, outline=BOIS_FONCE, width=7)
    trait.line([point(-l + 0.03, -e + 0.025), point(l - 0.03, -e + 0.025)], fill=BOIS_CLAIR, width=8)
    trait.line([point(-l + 0.03, e - 0.022), point(l - 0.03, e - 0.022)], fill=(150, 72, 32), width=6)
    for c, debut, fin in ((-e * 0.2, -0.8, 0.3), (e * 0.35, -0.4, 0.7)):
        trait.line([point(l * debut, c), point(l * fin, c)], fill=(156, 78, 36), width=4)
    trait.line([point(-l, -e), point(-l, e)], fill=BOIS_FONCE, width=9)
    trait.line([point(l, -e), point(l, e)], fill=BOIS_FONCE, width=9)


def plancher(image):
    # Le plancher du centre d'un embranchement : trois planches côte à côte, entre les rails.
    c = D + 0.1
    for k in (-1, 0, 1):
        planche(image, C, C + k * (2 * c / 3), 0, demi_longueur=c, epaisseur=2 * c / 3)


def traverses_droites(image, depuis=0.5, jusqua=1.5, demi_longueur=DEMI_TRAVERSE):
    for k in range(3):
        t = 0.5 + PAS_TRAVERSES * (k + 0.5)
        if depuis <= t <= jusqua:
            planche(image, C, t, 0, demi_longueur)


def droite(a, b):
    return [a, b]


def arc(centre_arc, rayon, a0, a1, n=48):
    return [(centre_arc[0] + rayon * np.cos(a), centre_arc[1] + rayon * np.sin(a)) for a in np.linspace(a0, a1, n)]


def rail(image, *morceaux):
    # Un rail épais : le contour foncé, le flanc du rail (gris moyen), le dessus en acier et le
    # reflet du champignon (le dessus poli par les roues).
    points = []
    for m in morceaux:
        points.extend(m)
    pts = [(px(x), px(y)) for x, y in points]
    trait = ImageDraw.Draw(image)
    trait.line(pts, fill=ACIER_FONCE, width=int(px(0.11)), joint='curve')
    trait.line(pts, fill=(150, 160, 174), width=int(px(0.08)), joint='curve')
    trait.line(pts, fill=ACIER, width=int(px(0.055)), joint='curve')
    trait.line(pts, fill=ACIER_CLAIR, width=int(px(0.022)), joint='curve')


def selles(image, positions):
    # De chaque côté du rail, sur chaque traverse : un tire-fond (avec un petit reflet).
    trait = ImageDraw.Draw(image)
    for x, y, angle in positions:
        ca, sa = np.cos(angle), np.sin(angle)
        for off in (-0.08, 0.08):
            bx, by = x + off * ca, y + off * sa
            r = px(0.022)
            trait.ellipse([px(bx) - r, px(by) - r, px(bx) + r, px(by) + r], fill=(38, 42, 52))
            trait.ellipse([px(bx) - r * 0.45, px(by) - r * 0.6, px(bx) + r * 0.1, px(by) - r * 0.1], fill=(150, 156, 168))


H = np.pi / 2
R = RAYON_COIN


def coin_ne():
    # Le rail en L du coin nord-est : il descend du nord, tourne, et part vers l'est.
    return [droite((B, 0.4), (B, A - R)), arc((B + R, A - R), R, np.pi, H), droite((B + R, A), (1.6, A))]


def coin_se():
    return [droite((1.6, B), (B + R, B)), arc((B + R, B + R), R, -H, -np.pi), droite((B, B + R), (B, 1.6))]


def coin_no():
    return [droite((0.4, A), (A - R, A)), arc((A - R, A - R), R, H, 0), droite((A, A - R), (A, 0.4))]


def coin_so():
    return [droite((A, 1.6), (A, B + R)), arc((A - R, B + R), R, 0, -H), droite((A - R, B), (0.4, B))]


def selles_ns(depuis=0.5, jusqua=1.5):
    pos = []
    for k in range(3):
        t = 0.5 + PAS_TRAVERSES * (k + 0.5)
        if depuis <= t <= jusqua:
            pos += [(A, t, 0), (B, t, 0)]
    return pos


def coupe(image, masque):
    # Garde seulement ce qui est dans le masque (le reste devient transparent).
    a = np.array(image)
    a[..., 3] = (a[..., 3] * masque).astype('uint8')
    return Image.fromarray(a, 'RGBA')


def tuile(nom):
    voie = Image.new('RGBA', (GRAND, GRAND), (0, 0, 0, 0))
    marge = 0.02
    # Les cailloux ne touchent jamais les bords de la case : c'est là que les tuiles se
    # raccordent (sans couture).
    loin = lambda x, y, r: all(abs(v - bord) > r + marge for v in (x, y) for bord in (0.5, 1.5))
    if nom == 'droit':
        masque = forme_droite('ns', LARGEUR_TALUS)
        dessus, flanc = talus((bord_irregulier(masque, 1) & masque) | forme_droite('ns', LARGEUR_TALUS - 0.1), 1, loin)
        traverses_droites(voie)
        rail(voie, droite((A, 0.4), (A, 1.6)))
        rail(voie, droite((B, 0.4), (B, 1.6)))
        selles(voie, selles_ns())
        cadre = forme_droite('ns', 1.0)
    elif nom == 'virage':
        masque = forme_virage(LARGEUR_TALUS)
        dessus, flanc = talus((bord_irregulier(masque, 2) & masque) | forme_virage(LARGEUR_TALUS - 0.1), 2, loin)
        boulons = []
        for k in range(3):
            a = np.pi + H * (k + 0.5) / 3
            planche(voie, 1.5 + 0.5 * np.cos(a), 1.5 + 0.5 * np.sin(a), a)
            for r in (0.5 - D, 0.5 + D):
                boulons.append((1.5 + r * np.cos(a), 1.5 + r * np.sin(a), a))
        rail(voie, arc((1.5, 1.5), 0.5 - D, np.pi - 0.2, 1.5 * np.pi + 0.2))
        rail(voie, arc((1.5, 1.5), 0.5 + D, np.pi - 0.2, 1.5 * np.pi + 0.2))
        selles(voie, boulons)
        cadre = forme_virage(1.0)
    elif nom == 't':
        masque = forme_droite('nse', LARGEUR_TALUS)
        dessus, flanc = talus((bord_irregulier(masque, 3) & masque) | forme_droite('nse', LARGEUR_TALUS - 0.1), 3, loin)
        traverses_droites(voie, jusqua=0.8, demi_longueur=COURTE)
        traverses_droites(voie, depuis=1.2, demi_longueur=COURTE)
        planche(voie, 0.5 + 5 / 6, C, H, COURTE)
        plancher(voie)
        rail(voie, droite((A, 0.4), (A, 1.6)))
        rail(voie, *coin_ne())
        rail(voie, *coin_se())
        selles(voie, selles_ns(jusqua=0.8) + selles_ns(depuis=1.2) + [(0.5 + 5 / 6, y, H) for y in (A, B)])
        cadre = forme_droite('nse', 1.0)
    else:
        masque = forme_droite('nseo', LARGEUR_TALUS)
        dessus, flanc = talus((bord_irregulier(masque, 4) & masque) | forme_droite('nseo', LARGEUR_TALUS - 0.1), 4, loin)
        traverses_droites(voie, jusqua=0.8, demi_longueur=COURTE)
        traverses_droites(voie, depuis=1.2, demi_longueur=COURTE)
        planche(voie, 0.5 + 5 / 6, C, H, COURTE)
        planche(voie, 0.5 + 1 / 6, C, H, COURTE)
        plancher(voie)
        for coin in (coin_ne(), coin_se(), coin_no(), coin_so()):
            rail(voie, *coin)
        bouts = [(x, y, H) for x in (0.5 + 1 / 6, 0.5 + 5 / 6) for y in (A, B)]
        selles(voie, selles_ns(jusqua=0.8) + selles_ns(depuis=1.2) + bouts)
        cadre = forme_droite('nseo', 1.0)
    # La voie ne sort pas de sa forme (dans le sens de la voie, elle s'arrête au bord de la case).
    voie = coupe(voie, cadre)
    # L'ombre de la voie : la même forme, en noir transparent et floue (le jeu la pose à côté).
    a = np.array(voie)
    ombre = np.zeros_like(a)
    ombre[..., 3] = (a[..., 3] * 0.5).astype('uint8')
    ombre = coupe(Image.fromarray(ombre, 'RGBA').filter(ImageFilter.GaussianBlur(5)), cadre)
    calques = {'cote': flanc, 'ballast': dessus, 'ombre': ombre, 'voie': voie}
    return {k: v.resize((TAILLE, TAILLE), Image.LANCZOS) for k, v in calques.items()}


if __name__ == '__main__':
    apercu = Image.new('RGBA', (TAILLE * 4, TAILLE), (110, 180, 60, 255))
    for i, nom in enumerate(['droit', 'virage', 't', 'croix']):
        calques = tuile(nom)
        for cle, image in calques.items():
            image.save(f'{dossier}/rail_{nom}_{cle}.webp', 'WEBP', quality=86, method=6)
        for cle in ('cote', 'ballast', 'ombre', 'voie'):
            apercu.alpha_composite(calques[cle], (i * TAILLE, 0))
    apercu.save(f'{dossier}/apercu.png')
