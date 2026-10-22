# Fabrique les textures du sol du village (24/10), qui se répètent sans couture :
#   - herbe.webp : des taches plus claires et plus sombres, et des petits brins, posées sur le
#     damier (presque transparentes) : le sol a l'air d'un vrai pré, plus d'un quadrillage ;
#   - sable.webp : des grains et de légères ondulations, sur le sable de la plage.
# Le bruit est fabriqué par transformée de Fourier : il est périodique, donc la texture se
# raccorde parfaitement d'un bord à l'autre.
#
# Usage : python3 outils/sol/textures.py public/images/sol
import sys
import numpy as np
from PIL import Image

dossier = sys.argv[1]
T = 256
rng = np.random.default_rng(2410)


def bruit(taille_tache):
    # Un bruit doux et périodique : du bruit blanc dont on garde les grandes ondes.
    blanc = rng.normal(0, 1, (T, T))
    f = np.fft.fftfreq(T)
    fx, fy = np.meshgrid(f, f)
    filtre = np.exp(-(fx**2 + fy**2) * (taille_tache**2) * 2)
    n = np.real(np.fft.ifft2(np.fft.fft2(blanc) * filtre))
    return (n - n.mean()) / (n.std() + 1e-9)


def poser_trait(couche, x, y, dx, dy, longueur, couleur, alpha, epaisseur=1.0):
    # Un petit trait (un brin d'herbe), qui revient de l'autre côté s'il dépasse (sans couture).
    pas = max(1, int(longueur * 2))
    for k in range(pas + 1):
        t = k / pas
        px = (x + dx * longueur * t) % T
        py = (y + dy * longueur * t) % T
        for ox in range(-int(epaisseur), int(epaisseur) + 1):
            ix = int(px + ox) % T
            iy = int(py) % T
            a = alpha * (1 - 0.5 * t)
            couche[iy, ix, :3] = couche[iy, ix, :3] * (1 - a) + np.array(couleur) * a
            couche[iy, ix, 3] = max(couche[iy, ix, 3], a)


# --- L'herbe ---------------------------------------------------------------------------------
grandes = bruit(16)
moyennes = bruit(5)
fines = bruit(1.5)
valeur = grandes * 0.6 + moyennes * 0.3 + fines * 0.25
herbe = np.zeros((T, T, 4))
clair = np.array([176, 222, 96])
sombre = np.array([70, 128, 34])
for k in range(3):
    herbe[..., k] = np.where(valeur > 0, clair[k], sombre[k])
herbe[..., 3] = np.clip(np.abs(valeur) * 0.11, 0, 0.26)
# Des brins d'herbe, clairs et foncés, un peu penchés.
for _ in range(700):
    x, y = rng.uniform(0, T, 2)
    angle = rng.uniform(-0.5, 0.5) - np.pi / 2
    longueur = rng.uniform(2.5, 6)
    couleur = [196, 234, 120] if rng.random() < 0.5 else [62, 116, 30]
    poser_trait(herbe, x, y, np.cos(angle), np.sin(angle), longueur, couleur, rng.uniform(0.18, 0.38))
image = Image.fromarray((np.dstack([herbe[..., :3], herbe[..., 3:] * 255])).clip(0, 255).astype('uint8'), 'RGBA')
image.save(f'{dossier}/herbe.webp', 'WEBP', quality=85, method=6)

# --- Le sable --------------------------------------------------------------------------------
v = bruit(9) * 0.6 + bruit(2.5) * 0.3
sable = np.zeros((T, T, 4))
for k, (c1, c2) in enumerate(zip([255, 246, 214], [196, 160, 96])):
    sable[..., k] = np.where(v > 0, c1, c2)
sable[..., 3] = np.clip(np.abs(v) * 0.12, 0, 0.25)
# Des ondulations douces (le vent sur le sable), un peu déformées par le bruit.
yy, xx = np.mgrid[0:T, 0:T]
onde = np.sin((xx * 2 * np.pi / T) * 3 + (yy * 2 * np.pi / T) * 7 + bruit(10) * 1.6)
creux = onde > 0.86
sable[creux, :3] = [190, 150, 88]
sable[creux, 3] = np.maximum(sable[creux, 3], 0.22)
crete = (onde < 0.86) & (onde > 0.7)
sable[crete, :3] = [255, 248, 222]
sable[crete, 3] = np.maximum(sable[crete, 3], 0.2)
# Des grains : petits points clairs et foncés.
for _ in range(1300):
    x, y = rng.integers(0, T, 2)
    c = [255, 250, 230] if rng.random() < 0.55 else [150, 112, 60]
    a = rng.uniform(0.3, 0.7)
    sable[y, x, :3] = c
    sable[y, x, 3] = a
image = Image.fromarray((np.dstack([sable[..., :3], sable[..., 3:] * 255])).clip(0, 255).astype('uint8'), 'RGBA')
image.save(f'{dossier}/sable.webp', 'WEBP', quality=85, method=6)
