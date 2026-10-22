# Dessine le talus des rails (25/10) : la terre brune posée à plat sur le sol, avec quelques
# petits cailloux pour la texture, dans le style de « propriété-rail-design » (Google Drive).
# Les traverses et les rails, eux, sont de vrais modèles 3D (voir modele3d.py).
#
# Un rail se pose sur UNE case, mais la voie est large de DEUX cases : elle déborde d'une
# demi-case à gauche et à droite. Chaque tuile couvre donc un carré de 2 × 2 cases centré sur la
# case du rail (512 × 512 pixels, vue de dessus ; le jeu la pose en losange sur la grille). Dans
# le sens de la voie, elle s'arrête au bord de la case (les tuiles voisines prennent la suite).
#
# Les quatre formes : droit (nord – sud), virage (sud – est), t (nord – sud et l'est), croix.
# Le jeu les tourne pour les autres directions.
#
# Usage : python3 outils/rails/talus.py public/images/rails
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

dossier = sys.argv[1]
TAILLE = 512  # la tuile finale (2 × 2 cases)
GRAND = TAILLE * 3  # on dessine 3 fois plus grand, puis on réduit (bords plus doux)
CASES = 2.0  # la tuile fait 2 cases de côté ; la case du rail va de 0,5 à 1,5
C = 1.0  # le centre de la case du rail
LARGEUR_TALUS = 0.97  # la demi-largeur du talus (presque une case de chaque côté)

TERRE = (156, 98, 56)
TERRE_FONCEE = (112, 68, 38)


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


# --- Le talus : la terre et ses cailloux ----------------------------------------------
def talus(masque, graine, limite):
    rng = np.random.default_rng(graine)
    img = np.zeros((GRAND, GRAND, 4))
    bruit = rng.normal(0, 1, (GRAND // 20, GRAND // 20))
    bruit = np.array(Image.fromarray(((bruit + 3) * 40).clip(0, 255).astype('uint8')).resize((GRAND, GRAND), Image.BICUBIC)) / 255 - 0.47
    fin = rng.normal(0, 1, (GRAND, GRAND)) * 0.05
    teinte = 1 + bruit * 0.28 + fin
    for k in range(3):
        img[..., k] = TERRE[k] * teinte
    # Le bord : un peu plus sombre (la terre tassée au pied du talus).
    mi = Image.fromarray((masque * 255).astype('uint8'))
    interieur = np.array(mi.filter(ImageFilter.MinFilter(15))) > 128
    bord = masque & ~interieur
    for k in range(3):
        img[..., k][bord] = TERRE_FONCEE[k] * (1 + fin[bord])
    # Un peu plus clair au milieu, plus sombre vers les bords.
    bombe = np.array(mi.filter(ImageFilter.GaussianBlur(GRAND / 40))) / 255
    for k in range(3):
        img[..., k] *= 0.9 + 0.14 * bombe
    img[..., 3] = masque * 255
    image = Image.fromarray(img.clip(0, 255).astype('uint8'), 'RGBA')
    # Quelques petits cailloux, pour la texture : une ombre, le galet, un reflet. Jamais sur
    # le bord de la case dans le sens de la voie (« limite ») : les tuiles se raccordent.
    trait = ImageDraw.Draw(image)
    couleurs = [(200, 166, 128), (178, 142, 106), (214, 184, 148), (160, 124, 92), (150, 146, 140)]
    poses = 0
    for _ in range(9000):
        if poses >= 55:
            break
        x, y = rng.uniform(0, CASES, 2)
        r = rng.uniform(0.018, 0.04)
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
    # Le bord se fond un peu dans l'herbe : le talus est posé au sol, il ne flotte pas.
    a = np.array(image)
    doux = np.array(Image.fromarray(a[..., 3]).filter(ImageFilter.GaussianBlur(3)))
    a[..., 3] = np.minimum(a[..., 3], doux)
    return Image.fromarray(a, 'RGBA')


def tuile(nom):
    marge = 0.02
    # Les cailloux ne touchent jamais les bords de la case : c'est là que les tuiles se
    # raccordent (sans couture).
    loin = lambda x, y, r: all(abs(v - bord) > r + marge for v in (x, y) for bord in (0.5, 1.5))
    if nom == 'virage':
        masque, coeur = forme_virage(LARGEUR_TALUS), forme_virage(LARGEUR_TALUS - 0.1)
    else:
        cotes = {'droit': 'ns', 't': 'nse', 'croix': 'nseo'}[nom]
        masque, coeur = forme_droite(cotes, LARGEUR_TALUS), forme_droite(cotes, LARGEUR_TALUS - 0.1)
    graine = ['droit', 'virage', 't', 'croix'].index(nom) + 1
    image = talus((bord_irregulier(masque, graine) & masque) | coeur, graine, loin)
    return image.resize((TAILLE, TAILLE), Image.LANCZOS)


def tuile_douce():
    # Le virage doux (25/10) : une tuile de 3 × 3 cases autour d'un carré de 2 × 2 cases (de 0,5
    # à 2,5 ici) ; le coin du virage est la case du haut à gauche, ses bras au sud et à l'est.
    # Un anneau de rayon 1,5 autour du coin du bas à droite (2,5 ; 2,5).
    global TAILLE, GRAND, CASES, U, V
    TAILLE, CASES = 768, 3.0
    GRAND = TAILLE * 3
    u = (np.arange(GRAND) + 0.5) / GRAND * CASES
    U, V = np.meshgrid(u, u)
    r = np.hypot(U - 2.5, V - 2.5)
    dans = (U <= 2.5) & (V <= 2.5)
    masque = (np.abs(r - 1.5) <= LARGEUR_TALUS) & dans
    coeur = (np.abs(r - 1.5) <= LARGEUR_TALUS - 0.1) & dans
    loin = lambda x, y, rayon: abs(x - 2.5) > rayon + 0.02 and abs(y - 2.5) > rayon + 0.02
    image = talus((bord_irregulier(masque, 5) & masque) | coeur, 5, loin)
    return image.resize((TAILLE, TAILLE), Image.LANCZOS)


if __name__ == '__main__':
    for nom in ['droit', 'virage', 't', 'croix']:
        tuile(nom).save(f'{dossier}/talus_{nom}.webp', 'WEBP', quality=86, method=6)
    tuile_douce().save(f'{dossier}/talus_doux.webp', 'WEBP', quality=86, method=6)
