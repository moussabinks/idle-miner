# La voie des rails en vrai 3D (25/10) : les traverses, les rails, les selles et les tire-fonds
# sont de petits volumes (des triangles), éclairés et rendus en vue isométrique, exactement
# comme le jeu voit le village. Le talus de terre, lui, reste à plat au sol (voir talus.py).
#
# Un petit moteur de rendu « à la main », en Python et numpy :
#   1. on construit le modèle 3D d'une case (des boîtes pour les traverses, des profilés de rail
#      tirés le long de la voie) ;
#   2. on le tourne dans la bonne direction (les 11 formes possibles d'une case) ;
#   3. on calcule l'ombre (une « carte d'ombre » vue depuis la lumière, en haut à gauche) ;
#   4. on dessine chaque triangle, du plus loin au plus près (un tampon de profondeur), avec sa
#      lumière, son ombre, un reflet sur l'acier, et un contour foncé comme les bâtiments ;
#   5. l'ombre portée sur le talus est dessinée aussi (en noir transparent), sous la voie.
#
# Les coordonnées : x vers l'est (en bas à droite de l'écran), y vers le sud (en bas à gauche),
# z vers le haut, en cases. La case du rail va de 0 à 1 ; la voie déborde sur les côtés.
#
# Usage : python3 outils/rails/modele3d.py public/images/rails
import sys
import numpy as np
from PIL import Image

dossier = sys.argv[1]

# --- La vue (la même que le jeu, voir src/composants/iso.ts) -------------------------------
DEMI_LARGEUR = 16.5
DEMI_HAUTEUR = 9.57
HAUTEUR_Z = 19.05  # une case de hauteur, en pixels du monde (vue isométrique « vraie »)
FINALE = 4  # pixels de l'image par pixel du monde (net jusqu'au zoom maximal)
SUR = 2  # on dessine 2 fois plus fin, puis on réduit (bords lisses)
F = FINALE * SUR
# Le cadre de l'image, en pixels du monde, par rapport au coin (0, 0) de la case.
CADRE = {'x0': -35, 'x1': 35, 'y0': -15, 'y1': 31}
LARGEUR_IMG = (CADRE['x1'] - CADRE['x0']) * F
HAUTEUR_IMG = (CADRE['y1'] - CADRE['y0']) * F

# D'où vient la lumière (en haut à gauche de l'écran, assez haut) ; vers où est la caméra.
LUMIERE = np.array([-0.62, -0.18, 0.76])
LUMIERE /= np.linalg.norm(LUMIERE)
CAMERA = np.array([1.0, 1.0, 1.0]) / np.sqrt(3)

# --- Les dimensions de la voie (en cases) ---------------------------------------------------
C = 0.5
D = 0.4  # le demi-écartement des rails
A, B = C - D, C + D
R_COIN = 0.1  # l'arrondi des rails en L
TRAVERSE = {'demi': 0.62, 'largeur': 0.17, 'bas': -0.02, 'haut': 0.06}
COURTE = 0.55
SELLE = {'long': 0.15, 'large': 0.21, 'haut': 0.075}  # la plaque d'acier sous le rail
# Le profil du rail (la coupe) : le patin (en bas, large), l'âme (fine), le champignon (en haut).
PATIN = (0.13, 0.075, 0.098)  # largeur, bas, haut
AME = (0.04, 0.098, 0.15)
CHAMPIGNON = (0.085, 0.15, 0.195)

# Les matières : couleur de base, et reflet (0 : mat, 1 : brillant).
MATIERES = {
    'bois': ((178, 98, 50), 0.05),
    'planche': ((190, 112, 60), 0.05),
    'acier': ((132, 140, 152), 0.6),
    'champignon': ((214, 220, 230), 1.0),
    'selle': ((72, 76, 86), 0.3),
    'boulon': ((60, 63, 72), 0.5),
}
NOMS_MATIERES = list(MATIERES)


class Modele:
    # Une liste de triangles, chacun avec sa matière et son numéro d'objet (pour le contour).
    def __init__(self):
        self.triangles = []  # (3 sommets (x, y, z), matière, objet, axe du grain)
        self.objet = 0

    def nouvel_objet(self):
        self.objet += 1
        return self.objet

    def triangle(self, a, b, c, matiere, objet, dedans, axe=(1.0, 0.0)):
        # « dedans » : un point à l'intérieur de l'objet. On range les sommets pour que la face
        # regarde vers l'extérieur (sa normale s'éloigne de ce point).
        t = np.array([a, b, c], dtype=float)
        n = np.cross(t[1] - t[0], t[2] - t[0])
        if n @ (t.mean(0) - np.asarray(dedans, dtype=float)) < 0:
            t = t[[0, 2, 1]]
        self.triangles.append((t, NOMS_MATIERES.index(matiere), objet, axe))

    def quad(self, a, b, c, d, matiere, objet, dedans, axe=(1.0, 0.0)):
        self.triangle(a, b, c, matiere, objet, dedans, axe)
        self.triangle(a, c, d, matiere, objet, dedans, axe)

    def boite(self, cx, cy, angle, long, large, bas, haut, matiere, objet=None):
        # Une boîte posée à plat, tournée de « angle » (sa longueur le long de cet angle).
        objet = objet or self.nouvel_objet()
        ca, sa = np.cos(angle), np.sin(angle)
        coins = []
        for sl, sw in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            l, w = sl * long / 2, sw * large / 2
            coins.append((cx + l * ca - w * sa, cy + l * sa + w * ca))
        b = [(x, y, bas) for x, y in coins]
        h = [(x, y, haut) for x, y in coins]
        axe = (ca, sa)
        dedans = (cx, cy, (bas + haut) / 2)
        self.quad(h[0], h[1], h[2], h[3], matiere, objet, dedans, axe)
        self.quad(b[3], b[2], b[1], b[0], matiere, objet, dedans, axe)
        for i in range(4):
            j = (i + 1) % 4
            self.quad(b[i], b[j], h[j], h[i], matiere, objet, dedans, axe)

    def prisme(self, chemin, profil, matiere, matiere_dessus=None, objet=None):
        # Tire un profil convexe (une liste de points (côté, hauteur)) le long d'un chemin au sol.
        objet = objet or self.nouvel_objet()
        chemin = np.array(chemin, dtype=float)
        tangentes = np.gradient(chemin, axis=0)
        tangentes /= np.linalg.norm(tangentes, axis=1, keepdims=True)
        cotes = np.stack([-tangentes[:, 1], tangentes[:, 0]], 1)
        anneaux = []
        w_milieu = np.mean([w for w, _ in profil])
        h_milieu = np.mean([h for _, h in profil])
        centres = []
        for p, n in zip(chemin, cotes):
            anneaux.append([(p[0] + w * n[0], p[1] + w * n[1], h) for w, h in profil])
            centres.append(np.array([p[0] + w_milieu * n[0], p[1] + w_milieu * n[1], h_milieu]))
        m = len(profil)
        for i in range(len(chemin) - 1):
            t = tangentes[i]
            for k in range(m):
                k2 = (k + 1) % m
                # Le dessus du champignon (la face presque horizontale tout en haut) est poli.
                dessus = profil[k][1] == profil[k2][1] and profil[k][1] == max(h for _, h in profil)
                mat = matiere_dessus if (dessus and matiere_dessus) else matiere
                dedans = (centres[i] + centres[i + 1]) / 2
                self.quad(anneaux[i][k], anneaux[i][k2], anneaux[i + 1][k2], anneaux[i + 1][k], mat, objet, dedans, tuple(t))
        # Les deux bouts (en éventail : le profil est convexe).
        for bout, suivant in ((0, 1), (-1, -2)):
            anneau = anneaux[bout]
            dedans = centres[suivant]
            for k in range(1, m - 1):
                self.triangle(anneau[0], anneau[k + 1], anneau[k], matiere, objet, dedans)


def profil_rectangle(largeur, bas, haut):
    w = largeur / 2
    return [(-w, bas), (w, bas), (w, haut), (-w, haut)]


def profil_champignon():
    w = CHAMPIGNON[0] / 2
    bas, haut = CHAMPIGNON[1], CHAMPIGNON[2]
    ch = 0.016  # les arêtes du haut, arrondies
    return [(-w, bas), (w, bas), (w, haut - ch), (w - ch, haut), (-w + ch, haut), (-w, haut - ch)]


def rail(modele, chemin):
    # Un rail : le patin, l'âme et le champignon, chacun tiré le long du chemin.
    objet = modele.nouvel_objet()
    modele.prisme(chemin, profil_rectangle(*PATIN), 'acier', objet=objet)
    modele.prisme(chemin, profil_rectangle(*AME), 'acier', objet=objet)
    modele.prisme(chemin, profil_champignon(), 'acier', matiere_dessus='champignon', objet=objet)


def droite(a, b, n=2):
    return [(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) for t in np.linspace(0, 1, n)]


def arc(centre, rayon, a0, a1, n=28):
    return [(centre[0] + rayon * np.cos(a), centre[1] + rayon * np.sin(a)) for a in np.linspace(a0, a1, n)]


def joindre(*morceaux):
    points = []
    for m in morceaux:
        for p in m:
            if not points or np.hypot(p[0] - points[-1][0], p[1] - points[-1][1]) > 1e-6:
                points.append(p)
    return points


def traverse(modele, cx, cy, angle, demi=TRAVERSE['demi'], rails_sur=()):
    # Une traverse en bois, un peu enfoncée dans le talus, avec sous chaque rail une selle
    # d'acier et deux tire-fonds. « rails_sur » : où passent les rails, le long de la traverse.
    teinte = 'bois'
    modele.boite(cx, cy, angle, 2 * demi, TRAVERSE['largeur'], TRAVERSE['bas'], TRAVERSE['haut'], teinte)
    ca, sa = np.cos(angle), np.sin(angle)
    for l in rails_sur:
        x, y = cx + l * ca, cy + l * sa
        modele.boite(x, y, angle, SELLE['large'], SELLE['long'], TRAVERSE['haut'], SELLE['haut'], 'selle')
        for dl in (-0.075, 0.075):
            modele.boite(x + dl * ca, y + dl * sa, angle, 0.028, 0.028, SELLE['haut'], SELLE['haut'] + 0.02, 'boulon')


H = np.pi / 2
PAS = [1 / 6, 1 / 2, 5 / 6]  # les traverses, à 1/6, 1/2 et 5/6 de la case : sans couture


def coin_ne():
    return joindre(droite((B, 0), (B, A - R_COIN)), arc((B + R_COIN, A - R_COIN), R_COIN, np.pi, H), droite((B + R_COIN, A), (1, A)))


def coin_se():
    return joindre(droite((1, B), (B + R_COIN, B)), arc((B + R_COIN, B + R_COIN), R_COIN, -H, -np.pi), droite((B, B + R_COIN), (B, 1)))


def coin_no():
    return joindre(droite((0, A), (A - R_COIN, A)), arc((A - R_COIN, A - R_COIN), R_COIN, H, 0), droite((A, A - R_COIN), (A, 0)))


def coin_so():
    return joindre(droite((A, 1), (A, B + R_COIN)), arc((A - R_COIN, B + R_COIN), R_COIN, 0, -H), droite((A - R_COIN, B), (0, B)))


def plancher(modele):
    # Le plancher du centre d'un embranchement : trois grosses planches, au niveau des traverses.
    c = D + 0.1
    for k in (-1, 0, 1):
        modele.boite(C, C + k * (2 * c / 3), 0, 2 * c, 2 * c / 3 - 0.012, TRAVERSE['bas'], TRAVERSE['haut'], 'planche')


def modele_de_base(forme):
    # Les quatre formes de base (comme les tuiles du talus) : droit nord – sud, virage sud – est,
    # T (ligne nord – sud, branche à l'est) et croisement.
    m = Modele()
    if forme == 'droit':
        for v in PAS:
            traverse(m, C, v, 0, rails_sur=(-D, D))
        rail(m, droite((A, 0), (A, 1)))
        rail(m, droite((B, 0), (B, 1)))
    elif forme == 'virage':
        for k in range(3):
            a = np.pi + H * (k + 0.5) / 3
            traverse(m, 1 + 0.5 * np.cos(a), 1 + 0.5 * np.sin(a), a, rails_sur=(-D, D))
        rail(m, arc((1, 1), 0.5 - D, np.pi, 1.5 * np.pi, n=14))
        rail(m, arc((1, 1), 0.5 + D, np.pi, 1.5 * np.pi, n=36))
    elif forme == 't':
        traverse(m, C, PAS[0], 0, COURTE, rails_sur=(-D, D))
        traverse(m, C, PAS[2], 0, COURTE, rails_sur=(-D, D))
        traverse(m, PAS[2], C, H, COURTE, rails_sur=(-D, D))
        plancher(m)
        rail(m, droite((A, 0), (A, 1)))
        rail(m, coin_ne())
        rail(m, coin_se())
    else:
        traverse(m, C, PAS[0], 0, COURTE, rails_sur=(-D, D))
        traverse(m, C, PAS[2], 0, COURTE, rails_sur=(-D, D))
        traverse(m, PAS[0], C, H, COURTE, rails_sur=(-D, D))
        traverse(m, PAS[2], C, H, COURTE, rails_sur=(-D, D))
        plancher(m)
        for coin in (coin_ne(), coin_se(), coin_no(), coin_so()):
            rail(m, coin)
    return m


# Les côtés d'une forme de base, et comment on tourne : un quart de tour envoie n → e → s → o.
COTES_DE_BASE = {'droit': 'ns', 'virage': 'se', 't': 'nse', 'croix': 'nseo'}
QUART = {'n': 'e', 'e': 's', 's': 'o', 'o': 'n'}


def cote_code(cotes):
    return ''.join(c for c in 'neso' if c in cotes)


def toutes_les_formes():
    # Les 11 formes d'une case : (nom du fichier, forme de base, quarts de tour).
    formes = {}
    for base, cotes in COTES_DE_BASE.items():
        c = set(cotes)
        for k in range(4):
            code = cote_code(c)
            if code not in formes:
                formes[code] = (base, k)
            c = {QUART[x] for x in c}
    return formes


def tourner(points, quarts):
    # Un quart de tour (n → e) autour du centre de la case : (dx, dy) → (-dy, dx).
    p = points.copy()
    for _ in range(quarts):
        dx, dy = p[..., 0] - C, p[..., 1] - C
        p[..., 0], p[..., 1] = C - dy, C + dx
    return p


def tourner_axe(axe, quarts):
    x, y = axe
    for _ in range(quarts):
        x, y = -y, x
    return (x, y)


# --- Le rendu -------------------------------------------------------------------------------
def vers_image(p):
    # Un point 3D (cases) → l'image (pixels de l'image), et sa profondeur (plus grand = plus près).
    X = ((p[..., 0] - p[..., 1]) * DEMI_LARGEUR - CADRE['x0']) * F
    Y = ((p[..., 0] + p[..., 1]) * DEMI_HAUTEUR - p[..., 2] * HAUTEUR_Z - CADRE['y0']) * F
    profondeur = p @ CAMERA
    return X, Y, profondeur


def rasteriser(triangles2d, profondeurs, largeur, hauteur, valeurs):
    # Remplit les triangles dans une grille, en gardant pour chaque pixel le plus proche.
    # « valeurs » : pour chaque triangle, ce qu'on veut retrouver aux sommets (interpolé).
    tampon = np.full((hauteur, largeur), -np.inf)
    sortie = np.zeros((hauteur, largeur, valeurs.shape[2]))
    numero = np.full((hauteur, largeur), -1)
    for i, (t, z) in enumerate(zip(triangles2d, profondeurs)):
        x0, x1 = int(max(0, np.floor(t[:, 0].min()))), int(min(largeur - 1, np.ceil(t[:, 0].max())))
        y0, y1 = int(max(0, np.floor(t[:, 1].min()))), int(min(hauteur - 1, np.ceil(t[:, 1].max())))
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax, ay), (bx, by), (cx, cy) = t
        aire = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        if abs(aire) < 1e-9:
            continue
        w0 = ((bx - xs) * (cy - ys) - (by - ys) * (cx - xs)) / aire
        w1 = ((cx - xs) * (ay - ys) - (cy - ys) * (ax - xs)) / aire
        w2 = 1 - w0 - w1
        dedans = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not dedans.any():
            continue
        zp = w0 * z[0] + w1 * z[1] + w2 * z[2]
        zone = tampon[y0:y1 + 1, x0:x1 + 1]
        mieux = dedans & (zp > zone)
        if not mieux.any():
            continue
        zone[mieux] = zp[mieux]
        v = valeurs[i]
        interp = w0[..., None] * v[0] + w1[..., None] * v[1] + w2[..., None] * v[2]
        sortie[y0:y1 + 1, x0:x1 + 1][mieux] = interp[mieux]
        numero[y0:y1 + 1, x0:x1 + 1][mieux] = i
    return tampon, sortie, numero


def base_lumiere():
    # Deux axes perpendiculaires à la lumière : la « carte d'ombre » est vue depuis la lumière.
    e1 = np.cross(LUMIERE, [0, 0, 1.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(LUMIERE, e1)
    return e1, e2


TAILLE_OMBRE = 1400
ZONE_OMBRE = (-1.4, 1.4)  # en cases, autour du centre de la case, dans la vue de la lumière


def vers_lumiere(p):
    e1, e2 = base_lumiere()
    q = p - np.array([C, C, 0])
    a = (q @ e1 - ZONE_OMBRE[0]) / (ZONE_OMBRE[1] - ZONE_OMBRE[0]) * TAILLE_OMBRE
    b = (q @ e2 - ZONE_OMBRE[0]) / (ZONE_OMBRE[1] - ZONE_OMBRE[0]) * TAILLE_OMBRE
    return a, b, q @ LUMIERE


def rendre(modele, quarts):
    sommets = np.array([t[0] for t in modele.triangles])  # (n, 3, 3)
    sommets = tourner(sommets, quarts)
    matieres = np.array([t[1] for t in modele.triangles])
    objets = np.array([t[2] for t in modele.triangles])
    axes = np.array([tourner_axe(t[3], quarts) for t in modele.triangles])
    normales = np.cross(sommets[:, 1] - sommets[:, 0], sommets[:, 2] - sommets[:, 0])
    normales /= np.linalg.norm(normales, axis=1, keepdims=True) + 1e-12

    # 1. La carte d'ombre : vue depuis la lumière, on garde le plus proche d'elle.
    la, lb, lz = vers_lumiere(sommets)
    tri_l = np.stack([la, lb], -1)
    carte, _, _ = rasteriser(tri_l, lz, TAILLE_OMBRE, TAILLE_OMBRE, np.zeros((len(sommets), 3, 1)))

    def dans_l_ombre(points):
        a, b, z = vers_lumiere(points)
        total = np.zeros(points.shape[:-1])
        # Quelques échantillons autour du point : une ombre aux bords doux.
        for da in (-2, 0, 2):
            for db in (-2, 0, 2):
                ia = np.clip((a + da).astype(int), 0, TAILLE_OMBRE - 1)
                ib = np.clip((b + db).astype(int), 0, TAILLE_OMBRE - 1)
                total += carte[ib, ia] > z + 0.006
        return total / 9

    # 2. La vue de la caméra : seulement les faces tournées vers elle, plus le sol (z = 0) qui
    # reçoit les ombres (il est invisible, sauf l'ombre).
    visibles = normales @ CAMERA > 1e-4
    sol = np.array([[[-0.6, -0.6, 0], [1.6, -0.6, 0], [1.6, 1.6, 0]], [[-0.6, -0.6, 0], [1.6, 1.6, 0], [-0.6, 1.6, 0]]])
    tri = np.concatenate([sommets[visibles], sol])
    X, Y, P = vers_image(tri)
    valeurs = tri  # on retrouve la position 3D de chaque pixel
    profondeur, positions, numero = rasteriser(np.stack([X, Y], -1), P, LARGEUR_IMG, HAUTEUR_IMG, valeurs)
    n_vis = visibles.sum()
    indices_vis = np.nonzero(visibles)[0]

    image = np.zeros((HAUTEUR_IMG, LARGEUR_IMG, 4))
    plein = numero >= 0
    est_sol = numero >= n_vis
    est_objet = plein & ~est_sol
    ombre = np.zeros(numero.shape)
    ombre[plein] = dans_l_ombre(positions[plein])

    # Le sol : seulement l'ombre portée (noir transparent), et un peu d'ombre de contact.
    image[est_sol, 3] = 0.42 * ombre[est_sol]

    # Les objets : la lumière (diffuse + reflet), l'ombre, et un peu d'occlusion près du sol.
    idx = indices_vis[numero[est_objet]]
    n = normales[idx]
    mat = matieres[idx]
    couleur = np.array([MATIERES[NOMS_MATIERES[k]][0] for k in mat], dtype=float)
    brillance = np.array([MATIERES[NOMS_MATIERES[k]][1] for k in mat])
    pos = positions[est_objet]
    # Le grain du bois : des veines le long de la traverse, et chaque traverse un peu différente.
    bois = np.isin(mat, [NOMS_MATIERES.index('bois'), NOMS_MATIERES.index('planche')])
    if bois.any():
        ax = axes[idx][bois]
        travers = pos[bois, 0] * -ax[:, 1] + pos[bois, 1] * ax[:, 0]
        le_long = pos[bois, 0] * ax[:, 0] + pos[bois, 1] * ax[:, 1]
        # Les planches du plancher sont plus larges : des veines plus espacées.
        frequence = np.where(mat[bois] == NOMS_MATIERES.index('planche'), 34, 75)
        veine = np.sin(travers * frequence + np.sin(le_long * 7 + travers * 20) * 2.2) * 0.5 + 0.5
        noeuds = np.sin(le_long * 23 + objets[idx][bois]) * np.sin(travers * 31)
        teinte = 0.86 + 0.2 * ((objets[idx][bois] * 7919) % 11) / 10
        couleur[bois] *= (teinte * (0.82 + 0.22 * veine - 0.06 * (noeuds > 0.8)))[:, None]
    lum = np.clip(n @ LUMIERE, 0, 1) * (1 - ombre[est_objet])
    ciel = 0.5 + 0.18 * n[:, 2]  # la lumière du ciel : le dessus est plus clair
    occlusion = 0.72 + 0.28 * np.clip((pos[:, 2] - TRAVERSE['bas']) / 0.07, 0, 1)
    milieu = (LUMIERE + CAMERA) / np.linalg.norm(LUMIERE + CAMERA)
    reflet = brillance * np.clip(n @ milieu, 0, 1) ** 28 * (1 - ombre[est_objet]) * 170
    rgb = couleur * (ciel + 0.62 * lum)[:, None] * occlusion[:, None] + reflet[:, None]
    image[est_objet, :3] = rgb
    image[est_objet, 3] = 1

    # 3. Le contour : un trait foncé autour de chaque objet (comme les bâtiments), plus fin entre
    # deux objets qui se touchent.
    obj_pixel = np.full(numero.shape, 0)
    obj_pixel[est_objet] = objets[idx]
    bord_dehors = np.zeros(numero.shape, bool)
    bord_dedans = np.zeros(numero.shape, bool)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)):
        voisin = np.roll(np.roll(obj_pixel, dy, 0), dx, 1)
        prof_v = np.roll(np.roll(profondeur, dy, 0), dx, 1)
        bord_dehors |= est_objet & (voisin == 0)
        bord_dedans |= est_objet & (voisin != 0) & (voisin != obj_pixel) & (prof_v > profondeur)
    image[bord_dehors, :3] = image[bord_dehors, :3] * 0.28 + np.array([30, 18, 10]) * 0.3
    image[bord_dedans & ~bord_dehors, :3] *= 0.55

    # 4. On réduit (SUR × SUR pixels → 1) : les bords deviennent lisses.
    h, w = HAUTEUR_IMG // SUR, LARGEUR_IMG // SUR
    rgba = image.reshape(h, SUR, w, SUR, 4)
    alpha = rgba[..., 3].mean(axis=(1, 3))
    rgb = (rgba[..., :3] * rgba[..., 3:4]).sum(axis=(1, 3)) / np.maximum(rgba[..., 3:4].sum(axis=(1, 3)), 1e-9)
    final = np.dstack([rgb, alpha * 255]).clip(0, 255).astype('uint8')
    return Image.fromarray(final, 'RGBA')


if __name__ == '__main__':
    formes = toutes_les_formes()
    seules = sys.argv[2:]  # on peut n'en refaire que quelques-unes (pour essayer)
    for code, (base, quarts) in formes.items():
        if seules and code not in seules:
            continue
        image = rendre(modele_de_base(base), quarts)
        image.save(f'{dossier}/voie_{code}.webp', 'WEBP', quality=90, method=6)
        print(code, base, quarts, image.size)
