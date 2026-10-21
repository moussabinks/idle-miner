# Remet à plat (vue de dessus) le morceau de rails tout droit de la planche de l'équipe
# (« Tuiles de voies ferrées isométriques.png », sur le Drive). Sur la planche, une case fait
# 402 × 236,5 pixels ; le coin du haut du morceau droit (1 case × 2 cases) est en (412,5 ; 245).
# Usage : python3 remettre_a_plat.py <dossier contenant planche.png>
# Ensuite : faire_tuiles.py (le morceau droit d'une case), puis calques.py (toutes les tuiles).
import sys
from PIL import Image
import numpy as np
dossier = sys.argv[1]
src = np.array(Image.open(f'{dossier}/planche.png').convert('RGB')).astype(float)
O = np.array([412.5, 245.05])
EX = np.array([201, 118.25])
EY = np.array([-201, 118.25])
N = 256
gx0, gx1, gy0, gy1 = -0.1, 1.1, -0.1, 2.1
u = np.arange(int((gx1 - gx0) * N)) / N + gx0
v = np.arange(int((gy1 - gy0) * N)) / N + gy0
U, V = np.meshgrid(u, v)
X = O[0] + U * EX[0] + V * EY[0]
Y = O[1] + U * EX[1] + V * EY[1]
x0 = np.clip(np.floor(X).astype(int), 0, src.shape[1] - 2)
y0 = np.clip(np.floor(Y).astype(int), 0, src.shape[0] - 2)
fx = (X - np.floor(X))[..., None]
fy = (Y - np.floor(Y))[..., None]
out = src[y0, x0] * (1 - fx) * (1 - fy) + src[y0, x0 + 1] * fx * (1 - fy) + src[y0 + 1, x0] * (1 - fx) * fy + src[y0 + 1, x0 + 1] * fx * fy
Image.fromarray(out.clip(0, 255).astype('uint8')).save(f'{dossier}/droit_dessus.png')
