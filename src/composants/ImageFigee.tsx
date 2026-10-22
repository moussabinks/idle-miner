// Un dessin SVG qui ne change jamais (le sol du village, la plage), « figé » en image (26/10).
//
// Pourquoi : le sol est fait de milliers de formes et de flous. Tant qu'il reste du SVG, le
// navigateur le redessine en entier dès que quelque chose bouge par-dessus (un oiseau, un
// wagonnet...) : le jeu tombait à 5 images par seconde. Une fois transformé en image, il est
// dessiné une seule fois, puis simplement recopié : c'est beaucoup plus léger.
//
// Comment : on affiche d'abord le SVG normalement. Juste après, on le recopie en texte, on met
// ses images (textures) directement dedans, et on en fait une <img> qui le remplace. Le
// résultat est gardé de côté : la prochaine fois (changement de monde...), l'image est prête.

import { useEffect, useRef, useState, type ReactElement } from 'react'

type Figee = { src: string; className: string; style: string }

// Les dessins déjà figés, par nom.
const dejaFigees = new Map<string, Figee>()

// Une image du jeu (une texture), lue en « data URL » pour la mettre dans le SVG : une image
// faite d'un SVG n'a pas le droit d'aller chercher d'autres fichiers.
async function enDataUrl(adresse: string): Promise<string> {
  const reponse = await fetch(adresse)
  const contenu = await reponse.blob()
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resoudre(String(lecteur.result))
    lecteur.onerror = () => rejeter(lecteur.error)
    lecteur.readAsDataURL(contenu)
  })
}

async function figer(svg: SVGSVGElement): Promise<Figee> {
  const copie = svg.cloneNode(true) as SVGSVGElement
  copie.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  // Sa taille, en pixels (dans la page, elle vient du style).
  copie.setAttribute('width', String(svg.clientWidth || parseFloat(svg.style.width)))
  copie.setAttribute('height', String(svg.clientHeight || parseFloat(svg.style.height)))
  for (const image of Array.from(copie.querySelectorAll('image'))) {
    const adresse = image.getAttribute('href')
    if (adresse && !adresse.startsWith('data:')) image.setAttribute('href', await enDataUrl(adresse))
  }
  const texte = new XMLSerializer().serializeToString(copie)
  const src = URL.createObjectURL(new Blob([texte], { type: 'image/svg+xml' }))
  // On attend que l'image soit prête avant de remplacer le SVG (sinon on verrait un trou).
  const essai = new Image()
  essai.src = src
  await essai.decode()
  return { src, className: svg.getAttribute('class') ?? '', style: svg.getAttribute('style') ?? '' }
}

// Transforme le style écrit en texte (« left: 3px; top: 5px ») en objet pour React.
function styleEnObjet(texte: string): Record<string, string> {
  const style: Record<string, string> = {}
  for (const regle of texte.split(';')) {
    const [nom, ...valeur] = regle.split(':')
    if (!nom.trim() || valeur.length === 0) continue
    const nomReact = nom.trim().replace(/-([a-z])/g, (_, lettre: string) => lettre.toUpperCase())
    style[nomReact] = valeur.join(':').trim()
  }
  return style
}

// `nom` : un nom unique pour ce dessin. `children` : le dessin, un seul <svg> qui ne change jamais.
export function ImageFigee({ nom, children }: { nom: string; children: ReactElement }) {
  const boite = useRef<HTMLDivElement>(null)
  const [figee, setFigee] = useState<Figee | null>(() => dejaFigees.get(nom) ?? null)

  useEffect(() => {
    if (figee) return
    const svg = boite.current?.querySelector('svg')
    if (!svg) return
    let annule = false
    figer(svg)
      .then((resultat) => {
        dejaFigees.set(nom, resultat)
        if (!annule) setFigee(resultat)
      })
      // Si ça rate (vieux navigateur...), on garde simplement le SVG : le jeu marche quand même.
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [figee, nom])

  if (figee) return <img className={figee.className} style={styleEnObjet(figee.style)} src={figee.src} alt="" aria-hidden="true" draggable={false} />
  // « display: contents » : la boîte ne compte pas dans la mise en page, le SVG est placé comme avant.
  return (
    <div ref={boite} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
