// Le tutoriel (25/10, nouveau style). Pépite, une taupe mineuse, accompagne le joueur :
//   - au début, une fenêtre se présente avec le jeu en 4 étapes (les mêmes que dans l'aide et
//     sur l'accueil : une seule promesse partout) ;
//   - à chaque étape, une petite carte dit quoi faire (en haut de l'écran, ou en bas si ce qu'il
//     faut toucher est en haut). Le reste de l'écran s'assombrit ; ce qu'il faut toucher est
//     entouré d'un anneau doré, avec une grosse flèche qui rebondit et une étiquette
//     (« Touche ici ! »), et la cible elle-même palpite (attribut data-tuto-actif) ;
//   - chaque étape réussie fait jaillir un « Bravo ! » au milieu de l'écran ;
//   - à la fin, une fenêtre de félicitations montre la suite (la liste des tâches).
// On ne passe à l'étape suivante qu'en faisant l'action (les règles sont dans src/jeu/tutoriel.ts).
// Le style est dans src/styles/fenetres.css (« Le tutoriel »).
//
// La cible est trouvée dans la page par son attribut (data-tuto="bloc", data-cible="batiment:employes"...) :
// on suit sa position à chaque image (la carte du village bouge, les fenêtres défilent).

import { useEffect, useRef, useState } from 'react'
import { BATIMENTS, PRIX_EMBAUCHE, type IdBatiment } from '../jeu/donnees'
import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { BLOCS_TUTORIEL, ETAPES_TUTORIEL, etapeTutoriel, type IdEtapeTutoriel } from '../jeu/tutoriel'
import { sons } from '../sons'
import { ETAPES_DU_JEU } from './etapesDuJeu'
import { Confirmation } from './Confirmation'
import { Fenetre } from './Fenetre'
import { cheminPublic } from '../chemins'

// Ce que l'interface montre en ce moment (pour savoir où mettre la flèche).
export type EtatInterface = {
  batimentOuvert: IdBatiment | null // le bâtiment dont la fenêtre est ouverte
  menuConstruction: boolean
  posePrevue: IdBatiment | null // le bâtiment qu'on est en train de placer
  poseChoisie: boolean // le joueur a touché la carte : la place du bâtiment est choisie
}

type Props = {
  etat: EtatJeu
  ui: EtatInterface
  onSuivant: () => void
  onPasser: () => void
}

type Consigne = {
  titre: string
  texte: string
  geste: string // l'étiquette sur la flèche (« Touche ici ! »)
  cible: string | null // ce qu'il faut toucher (un sélecteur CSS), ou rien
}

// Le portrait de Pépite, la taupe qui guide le joueur.
const PORTRAIT_PEPITE = cheminPublic('/images/personnages/mineur.svg')

// Les cibles. (Un bâtiment sur la carte a l'attribut data-cible ; le reste, data-tuto.)
const BOUTON_MINE = '[data-tuto="mine"]'
const CHOIX_PERSONNEL = '[data-tuto="batiment-employes"], [data-tuto="poser-employes"]'
const batiment = (id: IdBatiment) => `[data-cible="batiment:${id}"]`

// Le texte et la cible de chaque étape, selon ce qui est ouvert.
function consigne(etape: IdEtapeTutoriel, etat: EtatJeu, ui: EtatInterface): Consigne {
  const aLaMine = ui.batimentOuvert === 'puits'
  switch (etape) {
    case 'bonjour':
    case 'bravo':
      return { titre: '', texte: '', geste: '', cible: null }

    case 'creuser':
      return aLaMine
        ? {
            titre: t('Casse {n} blocs : {fait} / {n}', { n: BLOCS_TUTORIEL, fait: Math.min(etat.stats.blocsCasses, BLOCS_TUTORIEL) }),
            texte: t('Clique sur le bloc, encore et encore ! Tout va dans le coffre de la mine.'),
            geste: t('Clique vite !'),
            cible: '[data-tuto="bloc"]',
          }
        : {
            titre: t('Ouvre ta mine'),
            texte: t('Touche le bouton Mine, en bas à gauche.'),
            geste: t('Touche ici !'),
            cible: BOUTON_MINE,
          }

    case 'vendre':
      return aLaMine
        ? {
            titre: t('Vends le coffre'),
            texte: t('Touche « Tout vendre » : les blocs deviennent de l’argent.'),
            geste: t('Vends !'),
            cible: '[data-tuto="vendre"]',
          }
        : {
            titre: t('Rouvre ta mine'),
            texte: t('Ton coffre t’attend : touche le bouton Mine.'),
            geste: t('Touche ici !'),
            cible: BOUTON_MINE,
          }

    case 'personnel': {
      const prix = BATIMENTS.employes.cout.argent ?? 0
      // En deux temps : d'abord toucher la carte (rien n'est assombri, pas de flèche), puis,
      // une fois la place choisie, le bouton « Construire ici ».
      if (ui.posePrevue === 'employes')
        return ui.poseChoisie
          ? { titre: t('Valide sa place'), texte: t('Touche « Construire ici ». (Tu peux encore toucher la carte pour le déplacer.)'), geste: t('Valide !'), cible: '[data-tuto="construire-ici"]' }
          : { titre: t('Choisis sa place'), texte: t('Touche la carte, là où tu veux poser le Personnel.'), geste: '', cible: null }
      if (ui.menuConstruction)
        return { titre: t('Choisis le Personnel'), texte: t('C’est là qu’on embauche des mineurs. Il coûte {prix} $.', { prix }), geste: t('Celui-ci !'), cible: CHOIX_PERSONNEL }
      return { titre: t('Construis le Personnel'), texte: t('Ouvre le menu Bâtiments, en bas à droite.'), geste: t('Touche ici !'), cible: '[data-tuto="batiments"]' }
    }

    case 'embaucher':
      return ui.batimentOuvert === 'employes'
        ? {
            titre: t('Embauche un mineur'),
            texte: t('Le premier ne coûte que {prix} $. Il creusera pour toi, même quand tu ne joues pas !', { prix: PRIX_EMBAUCHE[0] }),
            geste: t('Embauche !'),
            cible: '[data-tuto="embaucher"]',
          }
        : {
            titre: t('Ouvre le Personnel'),
            texte: t('Touche le Personnel, sur la carte.'),
            geste: t('Touche ici !'),
            cible: batiment('employes'),
          }
  }
}

// La position de la cible à l'écran, suivie à chaque image. La cible reçoit aussi l'attribut
// data-tuto-actif : elle palpite.
// Pour la fluidité, on ne redessine pas le tutoriel à chaque image : la position est écrite
// directement dans des variables CSS du calque doré (--x, --y, --l, --h), et les éléments s'y
// déplacent avec transform. React ne change que quand la cible apparaît, disparaît, ou passe
// d'une moitié de l'écran à l'autre.
// Fait défiler (de haut en bas seulement) la boîte qui contient l'élément, pour qu'on le voie en
// entier. (scrollIntoView ferait aussi défiler de côté une fenêtre trop large.)
function defilerJusqua(element: Element) {
  let boite = element.parentElement
  while (boite && !(boite.scrollHeight > boite.clientHeight && /auto|scroll/.test(getComputedStyle(boite).overflowY))) boite = boite.parentElement
  if (!boite) return
  const r = element.getBoundingClientRect()
  const b = boite.getBoundingClientRect()
  if (r.top < b.top) boite.scrollBy({ top: r.top - b.top - 12, behavior: 'smooth' })
  else if (r.bottom > b.bottom) boite.scrollBy({ top: r.bottom - b.bottom + 12, behavior: 'smooth' })
}

type Suivi = {
  visible: boolean
  dessous: boolean // la cible est tout en haut : la flèche passe dessous
  enHaut: boolean // la cible est dans le haut de l'écran : la carte d'étape va en bas
}
const SUIVI_VIDE: Suivi = { visible: false, dessous: false, enHaut: false }

function useSuiviCible(selecteur: string | null, calque: React.RefObject<HTMLDivElement | null>, surBatiment: boolean): Suivi {
  const [suivi, setSuivi] = useState<Suivi>(SUIVI_VIDE)
  const dernierSuivi = useRef(suivi)
  useEffect(() => {
    if (!selecteur) return
    let image = 0
    let defile = false
    let marquee: Element | null = null
    let derniere = ''
    let n = 0
    const suivre = () => {
      // (on ne cherche la cible dans la page que de temps en temps, ou si elle a disparu)
      if (!marquee || !marquee.isConnected || n++ % 15 === 0) {
        const element = document.querySelector(selecteur)
        if (element !== marquee) {
          marquee?.removeAttribute('data-tuto-actif')
          element?.setAttribute('data-tuto-actif', '')
          marquee = element
          defile = false
        }
      }
      const r = marquee?.getBoundingClientRect() ?? null
      // Un bouton dans une fenêtre : on la fait défiler jusqu'à lui (une fois).
      if (marquee && !defile && !surBatiment) {
        defilerJusqua(marquee)
        defile = true
      }
      const visible = r !== null && r.width > 0
      const cle = visible ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` : ''
      if (visible && cle !== derniere && calque.current) {
        derniere = cle
        const style = calque.current.style
        style.setProperty('--x', `${Math.round(r.left)}px`)
        style.setProperty('--y', `${Math.round(r.top)}px`)
        style.setProperty('--l', `${Math.round(r.width)}px`)
        style.setProperty('--h', `${Math.round(r.height)}px`)
      }
      const dessous = visible && !surBatiment && r.top < 140
      const enHaut = visible && r.top + r.height / 2 < window.innerHeight * 0.5
      const avant = dernierSuivi.current
      if (visible !== avant.visible || dessous !== avant.dessous || enHaut !== avant.enHaut) {
        dernierSuivi.current = { visible, dessous, enHaut }
        setSuivi(dernierSuivi.current)
      }
      image = requestAnimationFrame(suivre)
    }
    image = requestAnimationFrame(suivre)
    return () => {
      cancelAnimationFrame(image)
      marquee?.removeAttribute('data-tuto-actif')
    }
  }, [selecteur, calque, surBatiment])
  return selecteur ? suivi : SUIVI_VIDE
}

// Les confettis du « Bravo ! » et de la fenêtre de fin : des petits carrés au contour sombre.
const CONFETTIS = Array.from({ length: 18 }, (_, i) => ({
  x: Math.round(Math.cos((i / 18) * Math.PI * 2) * (90 + (i % 3) * 30)),
  y: Math.round(Math.sin((i / 18) * Math.PI * 2) * (70 + (i % 4) * 20)),
  couleur: ['#f9d65a', '#8fe08f', '#8cc8f5', '#f39aa8', '#b9a0f5'][i % 5],
  retard: (i % 5) * 40,
}))

function Confettis() {
  return (
    <span className="tuto-confettis" aria-hidden="true">
      {CONFETTIS.map((c, i) => (
        <i key={i} style={{ ['--x' as string]: `${c.x}px`, ['--y' as string]: `${c.y}px`, background: c.couleur, animationDelay: `${c.retard}ms` }} />
      ))}
    </span>
  )
}

// Pépite qui parle : son portrait et une bulle.
function Pepite({ children }: { children: React.ReactNode }) {
  return (
    <div className="tuto-pepite-parle">
      <img className="tuto-pepite-portrait" src={PORTRAIT_PEPITE} alt="" draggable={false} />
      <p className="tuto-pepite-bulle">{children}</p>
    </div>
  )
}

// La fenêtre du début : Pépite se présente, et le jeu en 4 étapes.
function Bienvenue({ onSuivant, onPasser }: { onSuivant: () => void; onPasser: () => void }) {
  return (
    <Fenetre
      titre={t('Bienvenue, mineur !')}
      icone="⛏️"
      couleur="jaune"
      taille="petite"
      devant
      fermable={false}
      onFermer={onSuivant}
      classe="tuto-fenetre"
      pied={
        <>
          <button className="btn btn-jaune btn-grand btn-large" onClick={onSuivant} autoFocus>
            {t('C’est parti !')}
          </button>
          <button className="btn btn-blanc btn-petit" onClick={onPasser}>
            {t('Passer le tutoriel')}
          </button>
        </>
      }
    >
      <Pepite>{t('Moi, c’est Pépite ! Creusons ensemble jusqu’au cœur de diamant.')}</Pepite>
      <ol className="tuto-etapes-jeu">
        {ETAPES_DU_JEU.map((e, i) => (
          <li key={e.titre} className="carte" style={{ animationDelay: `${150 + i * 110}ms` }}>
            <span className="tuto-etape-numero">{i + 1}</span>
            <span className="tuto-etape-icone" aria-hidden="true">
              {e.icone}
            </span>
            <span className="tuto-etape-texte">
              <strong>{t(e.titre)}</strong>
              <span className="discret">{t(e.texte)}</span>
            </span>
          </li>
        ))}
      </ol>
    </Fenetre>
  )
}

// La fenêtre de la fin : bravo, et la suite.
function Felicitations({ onSuivant }: { onSuivant: () => void }) {
  return (
    <Fenetre
      titre={t('Bravo, ta mine tourne !')}
      icone="🎉"
      couleur="jaune"
      taille="petite"
      voile="clair"
      fermable={false}
      onFermer={onSuivant}
      classe="tuto-fenetre"
      pied={
        <button className="btn btn-jaune btn-grand btn-large" onClick={onSuivant} autoFocus>
          {t('À moi de jouer !')}
        </button>
      }
    >
      <Confettis />
      <Pepite>{t('Ton mineur creuse pour toi, même quand tu ne joues pas. Maintenant, tu es libre !')}</Pepite>
      <ul className="tuto-suite">
        <li className="carte">☑️ {t('Ta liste de tâches (en haut à droite) te donne des idées.')}</li>
        <li className="carte">⭐ {t('Chaque niveau débloque des bâtiments et rapporte des gemmes.')}</li>
        <li className="carte">🛤️ {t('Plus tard : des rails jusqu’au marché, et tout se vend tout seul.')}</li>
      </ul>
    </Fenetre>
  )
}

export function Tutoriel({ etat, ui, onSuivant, onPasser }: Props) {
  const etape = etapeTutoriel(etat)
  const [confirmer, setConfirmer] = useState(false)
  // « Bravo ! » au milieu de l'écran quand une étape est réussie (avec une petite fanfare).
  const [fete, setFete] = useState(0)
  const avant = useRef(etape)
  useEffect(() => {
    const precedente = avant.current
    avant.current = etape
    // (pas au début : le bonjour n'est pas une action ; pas à la fin : la fenêtre fait déjà la fête)
    if (precedente === null || etape === null || etape === precedente || precedente === 'bonjour' || etape === 'bravo') return
    sons.succes()
    const debut = window.setTimeout(() => setFete((n) => n + 1), 0)
    const fin = window.setTimeout(() => setFete(0), 1300)
    return () => {
      clearTimeout(debut)
      clearTimeout(fin)
    }
  }, [etape])
  const c = etape ? consigne(etape, etat, ui) : null
  // Un bâtiment a une grande image (avec du vide autour) : la flèche montre son milieu, sans voile.
  const surBatiment = c?.cible?.startsWith('[data-cible') ?? false
  const calque = useRef<HTMLDivElement>(null)
  const suivi = useSuiviCible(c?.cible ?? null, calque, surBatiment)
  if (!etape || !c) return null

  const fenetrePasser = confirmer && (
    <Confirmation
      titre={t('Passer le tutoriel ?')}
      texteConfirmer={t('Passer')}
      onConfirmer={() => {
        setConfirmer(false)
        onPasser()
      }}
      onAnnuler={() => setConfirmer(false)}
    >
      {t('Tu pourras toujours suivre ta liste de tâches, en haut à droite.')}
    </Confirmation>
  )

  if (etape === 'bonjour') {
    return (
      <>
        <Bienvenue onSuivant={onSuivant} onPasser={() => setConfirmer(true)} />
        {fenetrePasser}
      </>
    )
  }
  if (etape === 'bravo') return <Felicitations onSuivant={onSuivant} />

  // Les étapes avec une action (sans le bonjour ni le bravo).
  const etapesAction = ETAPES_TUTORIEL.slice(1, -1)
  const numero = etapesAction.indexOf(etape) + 1
  return (
    <>
      {/* Le calque doré : toujours là (caché tant que la cible n'est pas trouvée), déplacé par
          useSuiviCible sans repasser par React. */}
      {c.cible && (
        <div
          ref={calque}
          className={`tuto-cible ${suivi.visible ? '' : 'tuto-cible-cachee'} ${surBatiment ? 'tuto-sur-batiment' : ''} ${suivi.dessous ? 'tuto-cible-dessous' : ''}`}
          aria-hidden="true"
        >
          {/* Le voile sombre autour de la cible (immobile), puis l'anneau doré qui pulse. */}
          <div className="tuto-trou" />
          <div className="tuto-cercle" />
          <div className="tuto-fleche-place">
            <div className="tuto-fleche">
              <span className="tuto-fleche-dessin">
                <svg viewBox="0 0 40 48" width="44" height="52">
                  <path d="M13 3 h14 v20 h9 L20 45 L4 23 h9 Z" fill="#f9d65a" stroke="#2a2140" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </span>
              {c.geste && <span className="tuto-geste">{c.geste}</span>}
            </div>
          </div>
        </div>
      )}
      <section key={`${etape}-${c.titre.split(':')[0]}`} className={`tuto-carte ${suivi.enHaut ? 'tuto-carte-en-bas' : ''}`} role="status" aria-live="polite" aria-label={t('Tutoriel')}>
        <img className="tuto-carte-pepite" src={PORTRAIT_PEPITE} alt="" draggable={false} />
        <div className="tuto-carte-texte">
          <div className="tuto-progression" aria-label={t('Étape {n} sur {max}', { n: numero, max: etapesAction.length })}>
            {etapesAction.map((e, i) => (
              <i key={e} className={i + 1 < numero ? 'faite' : i + 1 === numero ? 'en-cours' : ''} />
            ))}
          </div>
          <strong className="tuto-titre">{c.titre}</strong>
          <p className="tuto-texte">{c.texte}</p>
        </div>
        <button className="tuto-passer" onClick={() => setConfirmer(true)} aria-label={t('Passer le tutoriel')} title={t('Passer le tutoriel')}>
          ✖
        </button>
      </section>
      {fete > 0 && (
        <div key={fete} className="tuto-fete" aria-hidden="true">
          <Confettis />
          <span className="tuto-fete-texte">✔ {t('Bravo !')}</span>
        </div>
      )}
      {fenetrePasser}
    </>
  )
}
