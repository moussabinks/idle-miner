"""Les bâtiments retournés (mode miroir) gardent leurs écritures à l'endroit (27/10).

Dans le jeu, un bâtiment en mode miroir est son image retournée gauche-droite : les écritures
peintes dessus (« HIRING » sur le Personnel) se lisent alors à l'envers. Ce script fabrique, pour
chaque bâtiment qui a du texte, une image « -miroir » : la même image, mais où chaque panneau à
texte est déjà retourné (et sa pente inversée). Le jeu retourne ensuite toute l'image : le
panneau revient à l'endroit, penché dans le bon sens, sur la façade retournée.

Un panneau est un parallélogramme posé sur une façade : bords gauche et droit verticaux, haut et
bas penchés de la même pente (en pixels de y par pixel de x).

Lancer depuis la racine du projet : python3 outils/batiments/textes_miroir.py
"""

from PIL import Image

DOSSIER = "public/images/batiments/"

# Les panneaux à texte de chaque bâtiment : x de gauche et de droite, y du haut et du bas au bord
# gauche, et la pente (le haut et le bas montent vers la droite quand elle est négative).
PANNEAUX = {
    "employes": [
        # Le panneau crème « HIRING » au-dessus de l'entrée.
        {"gauche": 574, "droite": 777, "haut": 452, "bas": 514, "pente": -0.36},
    ],
}


def retourner_panneau(image: Image.Image, panneau: dict) -> None:
    """Remplace le panneau par lui-même retourné, pente inversée (directement dans l'image)."""
    pixels = image.load()
    copie = image.copy().load()
    gauche, droite, pente = panneau["gauche"], panneau["droite"], panneau["pente"]
    milieu = (gauche + droite) / 2
    for x in range(gauche, droite + 1):
        # Le point qu'on vient chercher : de l'autre côté du milieu...
        source_x = round(2 * milieu - x)
        for decalage in range(0, panneau["bas"] - panneau["haut"] + 1):
            # ... à la même hauteur dans le panneau (le haut du panneau descend avec la pente).
            y = round(panneau["haut"] + pente * (x - gauche)) + decalage
            source_y = round(panneau["haut"] + pente * (source_x - gauche)) + decalage
            pixels[x, y] = copie[source_x, source_y]


def main() -> None:
    for nom, panneaux in PANNEAUX.items():
        image = Image.open(f"{DOSSIER}{nom}.webp").convert("RGBA")
        for panneau in panneaux:
            retourner_panneau(image, panneau)
        image.save(f"{DOSSIER}{nom}-miroir.webp", quality=90, method=6)
        print(f"{nom}-miroir.webp")


if __name__ == "__main__":
    main()
