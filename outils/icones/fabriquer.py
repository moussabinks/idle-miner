# Fabrique la police d'icônes du jeu (27/10) : public/fonts/icones-mega.woff2 et src/icones.css.
#
# Le jeu écrivait ses icônes avec des emojis (⛏️, 📦, 💰...), dessinés différemment sur chaque
# téléphone. Cette police remplace chacun de ces emojis par un vrai dessin, dans le style cartoon
# du jeu : un gros contour brun foncé, des couleurs franches, une ombre et un reflet. Comme c'est
# une police (couleur), il n'y a rien à changer dans le code : partout où un emoji est écrit, le
# navigateur prend notre dessin à la place.
#
# (25/10) Deux formats de couleur dans la même police, pour que TOUS les navigateurs la lisent :
#   - COLR (des calques de couleur) : Chrome, Edge, Firefox ;
#   - SVG (un petit dessin SVG par icône) : Safari, sur Mac et iPhone.
# Et des contours au format TrueType (glyf), le plus répandu. Avant (COLR seul, contours CFF),
# Safari montrait les emojis d'Apple à la place de nos dessins (le fer devenait un boulon 🔩).
#
# Lancer : python3 outils/icones/fabriquer.py (il faut fonttools, skia-pathops et brotli :
# pip install fonttools skia-pathops brotli). Les dessins sont dans dessins.py.

import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import newTable

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

CONTOUR = '#2a2140'  # le gros trait bleu nuit autour de chaque icône (25/10 : avant, brun)
EPAISSEUR_CONTOUR = 3.6
OMBRE = '#2a214055'  # une ombre dure, décalée vers le bas


def couleur(hexa):
    hexa = hexa.lstrip('#')
    if len(hexa) == 6:
        hexa += 'ff'
    return tuple(int(hexa[i : i + 2], 16) / 255 for i in (0, 2, 4, 6))


def vers_police(chemin):
    """Le chemin (en 100 × 100, y vers le bas) dans les unités de la police (y vers le haut),
    en contour TrueType (courbes du second degré)."""
    pen = TTGlyphPen(None)
    chemin.draw(TransformPen(Cu2QuPen(pen, 1.0, reverse_direction=False), (TAILLE, 0, 0, -TAILLE, (AVANCE - 100 * TAILLE) / 2, HAUT)))
    return pen.glyph()


def vers_svg(chemin):
    """Le même chemin pour la table SVG : unités de la police, mais y vers le bas (la ligne de
    base est à y = 0, le haut du dessin à y = -HAUT)."""
    pen = SVGPathPen(None, ntos=lambda v: str(round(v)))  # (nombres entiers : la police est plus légère)
    chemin.draw(TransformPen(pen, (TAILLE, 0, 0, TAILLE, (AVANCE - 100 * TAILLE) / 2, -HAUT)))
    return pen.getCommands()


def couleur_svg(hexa):
    """« #rrggbbaa » → fill et fill-opacity pour le SVG."""
    hexa = hexa.lstrip('#')
    opacite = int(hexa[6:8], 16) / 255 if len(hexa) == 8 else 1
    return f'fill="#{hexa[:6]}"' + (f' fill-opacity="{opacite:.3f}"' if opacite < 1 else '')


def vide(avance):
    return TTGlyphPen(None).glyph()


def fabriquer():
    ordre = ['.notdef', 'space', 'uFE0F']
    dessins = {'.notdef': vide(AVANCE), 'space': vide(300), 'uFE0F': vide(0)}
    largeurs = {'.notdef': AVANCE, 'space': 300, 'uFE0F': 0}
    cmap = {0x20: 'space', 0xFE0F: 'uFE0F'}
    palette = []
    couches = {}
    svgs = {}  # nom de l'icône → ses calques en SVG

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
        # (25/10) le glyphe de base a la silhouette entière (contour et ombre compris) : sans elle,
        # certains navigateurs coupaient le dessin en couleur à une boîte vide
        dessins[nom] = vers_police(union(bord, deplace(bord, 0, 2.6)))
        largeurs[nom] = AVANCE
        cmap[code] = nom
        couches[nom] = []
        svgs[nom] = ''.join(f'<path {couleur_svg(c)} d="{vers_svg(forme)}"/>' for c, forme in tous)
        for i, (c, forme) in enumerate(tous):
            nom_couche = f'{nom}.{i}'
            ordre.append(nom_couche)
            dessins[nom_couche] = vers_police(forme)
            largeurs[nom_couche] = AVANCE
            couches[nom].append((nom_couche, indice(c)))

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(ordre)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(dessins)
    # (TrueType : la marge de gauche doit être le bord gauche du dessin, sinon il glisse)
    glyf = fb.font['glyf']
    fb.setupHorizontalMetrics({nom: (largeurs[nom], getattr(glyf[nom], 'xMin', 0)) for nom in ordre})
    fb.setupHorizontalHeader(ascent=900, descent=-200)
    fb.setupNameTable({'familyName': NOM, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-200, usWinAscent=1000, usWinDescent=250)
    fb.setupPost()
    fb.setupCOLR(couches, version=0)
    fb.setupCPAL([palette])
    fb.setupMaxp()

    # La table SVG (pour Safari) : un document par icône, qui dessine le glyphe « glyphN ».
    table = newTable('SVG ')
    table.docList = []
    for nom in svgs:
        gid = ordre.index(nom)
        table.docList.append((f'<svg xmlns="http://www.w3.org/2000/svg"><g id="glyph{gid}">{svgs[nom]}</g></svg>', gid, gid))
    table.compressed = False
    fb.font['SVG '] = table

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

    # (25/10) Les minerais aussi en images SVG (public/images/icones/u1F7E1.svg...) : les bulles
    # « +1 » qui s'envolent de la mine les affichent en <img>. Dans ces bulles animées, Safari ne
    # prenait pas la police et montrait les emojis d'Apple (le fer redevenait un boulon 🔩).
    dossier_images = os.path.join(RACINE, 'public', 'images', 'icones')
    os.makedirs(dossier_images, exist_ok=True)
    for caractere in ICONES_EN_IMAGE:
        nom = f'u{ord(caractere):04X}'
        with open(os.path.join(dossier_images, f'{nom}.svg'), 'w', encoding='utf-8') as f:
            # (le dessin va de x = 50 à 1 150, et de y = -900 à 200, contour et ombre compris)
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -930 1200 1200">{svgs[nom]}</svg>\n')
    print(f'{len(ICONES_EN_IMAGE)} icônes en images')


# Les icônes qui existent aussi en image (les minerais du coffre : BLOCS dans src/jeu/donnees.ts).
ICONES_EN_IMAGE = ['🪨', '⚫', '🔩', '🔴', '🟡', '💚', '💎']


if __name__ == '__main__':
    fabriquer()
