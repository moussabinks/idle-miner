# Fabrique les tuiles des rails (vue de dessus) à partir de la planche du Drive.
import sys
from PIL import Image
import numpy as np
dossier = sys.argv[1]
t = Image.open(f'{dossier}/droit_dessus.png').convert('RGB')
N = 256
x0 = 3.6
crop = t.crop((round(x0), 108, round(x0) + N, 293)).resize((N, N), Image.LANCZOS)
a = np.array(crop).astype(float)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
vert = (G - R) + (G - B) * 0.5
alpha = np.clip(1 - (vert - 35) / 30, 0, 1)
rgba = np.dstack([a, alpha * 255]).clip(0, 255).astype('uint8')
Image.fromarray(rgba, 'RGBA').save(f'{dossier}/rail_droit.png')
S = rgba.astype(float)
u = (np.arange(N) + 0.5) / N
U, V = np.meshgrid(u, u)
r = np.hypot(1 - U, 1 - V)
th = np.arctan2(1 - V, 1 - U)
us = 1 - r
vs = th / (np.pi / 2)
xs = np.clip(us * N - 0.5, 0, N - 1.001)
ys = np.clip(vs * N - 0.5, 0, N - 1.001)
xi = np.floor(xs).astype(int); yi = np.floor(ys).astype(int); fx = xs - xi; fy = ys - yi
c = lambda yy, xx: S[yy, xx]
out = c(yi, xi) * ((1 - fx) * (1 - fy))[..., None] + c(yi, xi + 1) * (fx * (1 - fy))[..., None] + c(yi + 1, xi) * ((1 - fx) * fy)[..., None] + c(yi + 1, xi + 1) * (fx * fy)[..., None]
out[r > 1, 3] = 0
Image.fromarray(out.clip(0, 255).astype('uint8'), 'RGBA').save(f'{dossier}/rail_virage.png')
