# Fabrique la police d'icônes du jeu (27/10) : public/fonts/icones-mega.woff2 et src/icones.css.
#
# Le jeu écrivait ses icônes avec des emojis (⛏️, 📦, 💰...), dessinés différemment sur chaque
# téléphone. Cette police remplace chacun de ces emojis par un vrai dessin, dans le style cartoon
# du jeu : un gros contour brun foncé, des couleurs franches, une ombre et un reflet. Comme c'est
# une police (couleur, format COLR), il n'y a rien à changer dans le code : partout où un emoji
# est écrit, le navigateur prend notre dessin à la place.
#
# Lancer : python3 outils/icones/fabriquer.py (il faut fonttools, skia-pathops et brotli :
# pip install fonttools skia-pathops brotli). Les dessins sont dans dessins.py.

import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen

sys.path.insert(0, os.path.dirname(__file__))
from dessins import ICONES  # noqa: E402
from formes import deplace, grossir, union  # noqa: E402

RACINE = os.path.join(os.path.dirname(__file__), '..', '..')
NOM = 'Icones Mega'
FICHIER = 'icones-mega'

# La place d'une icône dans la police (1 000 unités = la taille du texte). Le dessin de 100 × 100
# devient un carré de 1 000 posé un peu sous la ligne de base, comme un emoji.
UPM = 1000
TAILLE = 11  # 1 unité du dessin = 11 unités de la police : l'icône fait 1,1 fois la taille du texte
AVANCE = 1200
HAUT = 900  # le haut du dessin

CONTOUR = '#3b2412'  # le gros trait brun foncé autour de chaque icône
EPAISSEUR_CONTOUR = 3.4
OMBRE = '#00000040'


def couleur(hexa):
    hexa = hexa.lstrip('#')
    if len(hexa) == 6:
        hexa += 'ff'
    return tuple(int(hexa[i : i + 2], 16) / 255 for i in (0, 2, 4, 6))


def vers_police(chemin):
    """Le chemin (en 100 × 100, y vers le bas) dans les unités de la police (y vers le haut)."""
    pen = T2CharStringPen(AVANCE, None)
    chemin.draw(TransformPen(pen, (TAILLE, 0, 0, -TAILLE, (AVANCE - 100 * TAILLE) / 2, HAUT)))
    return pen.getCharString()


def vide(avance):
    pen = T2CharStringPen(avance, None)
    return pen.getCharString()


def fabriquer():
    ordre = ['.notdef', 'space', 'uFE0F']
    dessins = {'.notdef': vide(AVANCE), 'space': vide(300), 'uFE0F': vide(0)}
    largeurs = {'.notdef': AVANCE, 'space': 300, 'uFE0F': 0}
    cmap = {0x20: 'space', 0xFE0F: 'uFE0F'}
    palette = []
    couches = {}

    def indice(c):
        valeur = couleur(c)
        if valeur not in palette:
            palette.append(valeur)
        return palette.index(valeur)

    for caractere, dessiner in ICONES.items():
        code = ord(caractere[0])
        nom = f'u{code:04X}'
        calques = dessiner()
        silhouette = union(*[forme for _, forme in calques])
        bord = grossir(silhouette, EPAISSEUR_CONTOUR)
        # Dessous : l'ombre (le contour décalé vers le bas), puis le contour, puis les couleurs.
        tous = [(OMBRE, deplace(bord, 0, 2.6)), (CONTOUR, bord)] + calques
        ordre.append(nom)
        dessins[nom] = vide(AVANCE)
        largeurs[nom] = AVANCE
        cmap[code] = nom
        couches[nom] = []
        for i, (c, forme) in enumerate(tous):
            nom_couche = f'{nom}.{i}'
            ordre.append(nom_couche)
            dessins[nom_couche] = vers_police(forme)
            largeurs[nom_couche] = AVANCE
            couches[nom].append((nom_couche, indice(c)))

    fb = FontBuilder(UPM, isTTF=False)
    fb.setupGlyphOrder(ordre)
    fb.setupCharacterMap(cmap)
    fb.setupCFF(NOM.replace(' ', ''), {'FullName': NOM}, dessins, {})
    fb.setupHorizontalMetrics({nom: (largeurs[nom], 0) for nom in ordre})
    fb.setupHorizontalHeader(ascent=900, descent=-200)
    fb.setupNameTable({'familyName': NOM, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-200, usWinAscent=1000, usWinDescent=250)
    fb.setupPost()
    fb.setupCOLR(couches, version=0)
    fb.setupCPAL([palette])

    dossier = os.path.join(RACINE, 'public', 'fonts')
    os.makedirs(dossier, exist_ok=True)
    fb.font.flavor = 'woff2'
    fb.save(os.path.join(dossier, f'{FICHIER}.woff2'))

    # La feuille de style : la police ne sert qu'à ces caractères (unicode-range).
    codes = sorted(c for c in cmap if c != 0x20)
    plages = ', '.join(f'U+{c:04X}' for c in codes)
    with open(os.path.join(RACINE, 'src', 'icones.css'), 'w', encoding='utf-8') as f:
        f.write(
            '/* Fabriqué par outils/icones/fabriquer.py : ne pas modifier à la main.\n'
            '   La police des icônes du jeu (27/10) : chaque emoji est remplacé par un dessin cartoon.\n'
            '   Elle passe en premier dans la liste des polices, mais ne sert qu\'à ces caractères. */\n'
            '@font-face {\n'
            f"  font-family: '{NOM}';\n"
            f"  src: url('/fonts/{FICHIER}.woff2') format('woff2');\n"
            '  font-display: block;\n'
            f'  unicode-range: {plages};\n'
            '}\n'
        )
    print(f'{len(couches)} icônes, {len(palette)} couleurs')


if __name__ == '__main__':
    fabriquer()
