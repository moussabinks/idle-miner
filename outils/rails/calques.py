# Sépare la tuile droite en trois calques (ballast, traverses, rails), puis compose les tuiles
# de tous les morceaux de voie : droit, virage, T et croisement. Vue de dessus, 256 × 256.
import sys
from PIL import Image
import numpy as np
dossier = sys.argv[1]
N = 256
t = np.array(Image.open(f'{dossier}/rail_droit.png').convert('RGBA')).astype(float)
R, G, B, A = t[..., 0], t[..., 1], t[..., 2], t[..., 3]
X = np.arange(N)[None, :].repeat(N, 0)
bandes = ((X >= 62) & (X <= 102)) | ((X >= 164) & (X <= 204))
gris = (np.abs(R - G) < 22) & (np.abs(G - B) < 28)
sombre = (R + G + B) < 200
rail = bandes & (gris | (sombre & (np.abs(R - G) < 30)))
traverse = (~rail) & (A > 10) & (R > 50) & ((G / np.maximum(R, 1)) < 0.68)
# On nettoie le contour des traverses : on bouche les petits trous, et on retire les poussières.
def dilater(m, n):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m
def eroder(m, n):
    return ~dilater(~m, n)
traverse = dilater(eroder(dilater(traverse, 2), 4), 2) & (~rail) & (A > 10)
# Le ballast seul, refait au propre : de la terre tassée (même couleur que la planche), avec des
# cailloux gris arrondis semés au hasard (toujours les mêmes). La forme (le bord) reste celle d'origine.
from PIL import ImageDraw, ImageFilter
rng = np.random.default_rng(23)
terre = Image.new('RGB', (N, N), (184, 146, 92))
dessin = ImageDraw.Draw(terre)
for _ in range(900):
    x, y = rng.uniform(0, N, 2)
    r = rng.uniform(1, 3)
    teinte = int(rng.uniform(-22, 18))
    dessin.ellipse((x - r, y - r, x + r, y + r), fill=(184 + teinte, 146 + teinte, 92 + teinte // 2))
terre = terre.filter(ImageFilter.GaussianBlur(1.2))
dessin = ImageDraw.Draw(terre)
for _ in range(70):
    x, y = rng.uniform(0, N, 2)
    rx, ry = rng.uniform(4, 9), rng.uniform(3, 7)
    gris = int(rng.uniform(150, 205))
    dessin.ellipse((x - rx + 1, y - ry + 2, x + rx + 1, y + ry + 2), fill=(120, 96, 64))  # son ombre
    dessin.ellipse((x - rx, y - ry, x + rx, y + ry), fill=(gris, gris - 4, gris - 12))
    dessin.ellipse((x - rx * 0.5, y - ry * 0.7, x + rx * 0.2, y - ry * 0.1), fill=(min(255, gris + 35),) * 3)
fond = np.array(terre.filter(ImageFilter.GaussianBlur(0.6))).astype(float)
ballast = np.dstack([fond, A])
calque_traverses = np.zeros_like(t); calque_traverses[traverse] = t[traverse]
calque_rails = np.zeros_like(t); calque_rails[rail] = t[rail]

def courber(img, centre_vide=False):
    # Le même morceau courbé en quart de cercle autour du coin sud-est (relie le sud et l'est).
    u = (np.arange(N) + 0.5) / N
    U, V = np.meshgrid(u, u)
    r = np.hypot(1 - U, 1 - V)
    th = np.arctan2(1 - V, 1 - U)
    xs = np.clip((1 - r) * N - 0.5, 0, N - 1.001)
    ys = np.clip(th / (np.pi / 2) * N - 0.5, 0, N - 1.001)
    xi = np.floor(xs).astype(int); yi = np.floor(ys).astype(int); fx = xs - xi; fy = ys - yi
    c = lambda yy, xx: img[yy, xx]
    out = c(yi, xi) * ((1 - fx) * (1 - fy))[..., None] + c(yi, xi + 1) * (fx * (1 - fy))[..., None] + c(yi + 1, xi) * ((1 - fx) * fy)[..., None] + c(yi + 1, xi + 1) * (fx * fy)[..., None]
    out[r > 1] = 0
    if centre_vide:
        out[r < 0.16] = 0  # au ras du coin, les traverses se serreraient en étoile : on les enlève
    return out

calques_droit = [ballast, calque_traverses, calque_rails]
calques_virage = [courber(ballast), courber(calque_traverses, True), courber(calque_rails, True)]

def tourner(img, quarts):
    return np.rot90(img, k=-quarts, axes=(0, 1)).copy()

def par_dessus(fond, img):
    a = img[..., 3:4] / 255
    out = fond.copy()
    out[..., :3] = img[..., :3] * a + fond[..., :3] * (1 - a)
    out[..., 3:4] = 255 * (a + fond[..., 3:4] / 255 * (1 - a))
    return out

def composer(morceaux):
    # morceaux : liste de (calques, quarts). D'abord tous les ballasts, puis toutes les traverses,
    # puis tous les rails : les voies se mêlent sans qu'un morceau en cache un autre.
    out = np.zeros((N, N, 4))
    for couche in range(3):
        for calques, quarts in morceaux:
            out = par_dessus(out, tourner(calques[couche], quarts))
    return out

tuiles = {
    'rail_droit': [(calques_droit, 0)],
    'rail_virage': [(calques_virage, 0)],
    # Le T : la ligne droite nord-sud, et deux virages qui partent vers l'est.
    'rail_t': [(calques_droit, 0), (calques_virage, 0), (calques_virage, 3)],
    # Le croisement : les deux lignes droites, l'une sur l'autre.
    'rail_croix': [(calques_droit, 0), (calques_droit, 1)],
}
for nom, morceaux in tuiles.items():
    img = composer(morceaux)
    Image.fromarray(img.clip(0, 255).astype('uint8'), 'RGBA').save(f'{dossier}/{nom}.png')
    Image.fromarray(img.clip(0, 255).astype('uint8'), 'RGBA').save(f'{dossier}/{nom}.webp', 'WEBP', quality=88, method=6)
for nom, img in [('calque_ballast', ballast), ('calque_traverses', calque_traverses), ('calque_rails', calque_rails)]:
    Image.fromarray(img.clip(0, 255).astype('uint8'), 'RGBA').save(f'{dossier}/{nom}.png')
