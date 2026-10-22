// Le tutoriel (27/10), dans le style du jeu. Pépite, un hamster mineur, accompagne le joueur :
//   - au début, une grande fenêtre explique le but du jeu (creuser, vendre, construire,
//     automatiser, jusqu'au cœur de diamant) ;
//   - à chaque étape, une carte en haut de l'écran dit quoi faire et pourquoi. Le reste de
//     l'écran s'assombrit ; ce qu'il faut toucher est entouré d'un cercle doré qui pulse, avec des
//     ondes qui en partent, une grosse flèche qui rebondit et une étiquette « Touche ici ! », et
//     la cible elle-même brille et palpite (attribut data-tuto-actif, voir interface.css) ;
//   - chaque étape réussie fait jaillir un « Bravo ! » au milieu de l'écran, avec des confettis ;
//   - à la fin, une grande fenêtre de félicitations montre la suite.
// On ne passe à l'étape suivante qu'en faisant l'action (les règles sont dans src/jeu/tutoriel.ts).
//
// La cible est trouvée dans la page par son attribut (data-tuto="bloc", data-cible="batiment:puits"...) :
// on suit sa position à chaque image (la carte du village bouge, les panneaux défilent).

import { useEffect, useRef, useState } from 'react'
import type { IdBatiment } from '../jeu/donnees'
import { nbDansSac, type EtatJeu } from '../jeu/mineur'
import { BLOCS_TUTORIEL, ETAPES_TUTORIEL, etapeTutoriel, type IdEtapeTutoriel } from '../jeu/tutoriel'
import { sons } from '../sons'
import { Confirmation } from './Confirmation'

// Ce que l'interface montre en ce moment (pour savoir où mettre la flèche).
export type EtatInterface = {
  batimentOuvert: IdBatiment | null // le panneau ouvert
  menuConstruction: boolean
  posePrevue: IdBatiment | null // le bâtiment qu'on est en train de placer
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
  pourquoi: string // pourquoi on le fait (pour comprendre le but)
  geste: string // l'étiquette sous la flèche (« Touche ici ! »)
  cible: string | null
}

const PEPITE = '/images/personnages/sprites/mineur_commun_devant.webp'

// Un bâtiment sur la carte. Sur téléphone, le panneau ouvert cache souvent la carte : la flèche
// montre alors le gros bouton rond du bas (⛏️ Mine, 💰 Vendre), toujours visible.
const BOUTONS_RONDS: Partial<Record<IdBatiment, string>> = { puits: '.bouton-mine', marche: '.bouton-marche-rapide' }
function batiment(id: IdBatiment): string {
  const rond = BOUTONS_RONDS[id]
  if (rond && window.innerWidth <= 860 && document.querySelector(rond)) return rond
  return `[data-cible="batiment:${id}"]`
}

// Le texte et la cible de chaque étape, selon ce qui est ouvert.
function consigne(etape: IdEtapeTutoriel, etat: EtatJeu, ui: EtatInterface): Consigne {
  const aLaMine = ui.batimentOuvert === 'puits'
  switch (etape) {
    case 'bonjour':
      return { titre: '', texte: '', pourquoi: '', geste: '', cible: null }
    case 'creuser':
      return aLaMine
        ? {
            titre: `Casse ${BLOCS_TUTORIEL} blocs : ${Math.min(etat.stats.blocsCasses, BLOCS_TUTORIEL)} / ${BLOCS_TUTORIEL}`,
            texte: 'Clique sur le bloc, encore et encore ! Tout ce qui tombe va dans le coffre de la mine.',
            pourquoi: 'Les blocs et les minerais se vendent au marché.',
            geste: 'Clique vite !',
            cible: '[data-tuto="bloc"]',
          }
        : {
            titre: 'Va à la mine',
            texte: 'Touche la mine : ton hamster y va tout seul.',
            pourquoi: 'Tout commence ici : c’est là que tu creuses.',
            geste: 'Touche ici !',
            cible: batiment('puits'),
          }
    case 'marche':
      if (ui.posePrevue === 'marche')
        return {
          titre: 'Choisis sa place',
          texte: 'Touche la carte pour placer le marché où tu veux, puis valide.',
          pourquoi: 'Près de la mine, c’est moins de chemin à faire.',
          geste: 'Valide !',
          cible: '[data-tuto="construire-ici"]',
        }
      if (ui.menuConstruction)
        return {
          titre: 'Pose le marché',
          texte: 'Il est gratuit !',
          pourquoi: 'C’est là que tes minerais deviennent de l’argent.',
          geste: 'Pose-le !',
          cible: '[data-tuto="poser-marche"]',
        }
      return {
        titre: 'Construis le marché',
        texte: 'Ouvre le menu Bâtiments.',
        pourquoi: 'Pour vendre ce que tu creuses, il te faut un marché.',
        geste: 'Touche ici !',
        cible: '[data-tuto="batiments"]',
      }
    case 'sac':
      return aLaMine
        ? {
            titre: 'Remplis ton sac',
            texte: 'Mets tout le coffre dans ton sac à dos.',
            pourquoi: 'Ton sac sert à porter les minerais jusqu’au marché.',
            geste: 'Touche ici !',
            cible: '[data-tuto="sac"]',
          }
        : {
            titre: 'Retourne à la mine',
            texte: 'Ton coffre t’attend : va le chercher !',
            pourquoi: 'Tout ce que tu casses attend dans le coffre de la mine.',
            geste: 'Touche ici !',
            cible: batiment('puits'),
          }
    case 'vendre':
      return ui.batimentOuvert === 'marche'
        ? {
            titre: 'Vends tout !',
            texte: 'Touche « Vendre la sélection ».',
            pourquoi: 'L’argent sert à tout construire et tout améliorer.',
            geste: 'Vends !',
            cible: '[data-tuto="vendre"]',
          }
        : {
            titre: 'Va au marché',
            texte: `Ton sac porte ${nbDansSac(etat)} minerais : emporte-les au marché !`,
            pourquoi: 'Chaque minerai a son prix : le diamant vaut 100 fois la pierre.',
            geste: 'Touche ici !',
            cible: batiment('marche'),
          }
    case 'bravo':
      return { titre: '', texte: '', pourquoi: '', geste: 'Ta liste de tâches', cible: '.missions' }
  }
}

// La position de la cible à l'écran, suivie à chaque image. La cible reçoit aussi l'attribut
// data-tuto-actif : elle brille et palpite (interface.css).
function useRectangle(selecteur: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const dernier = useRef('')
  useEffect(() => {
    dernier.current = '?' // (la première image met toujours la position à jour)
    if (!selecteur) return
    let image = 0
    let defile = false
    let marquee: Element | null = null
    const suivre = () => {
      const element = document.querySelector(selecteur)
      if (element !== marquee) {
        marquee?.removeAttribute('data-tuto-actif')
        element?.setAttribute('data-tuto-actif', '')
        marquee = element
      }
      const r = element?.getBoundingClientRect() ?? null
      // Un bouton dans un panneau : on le fait défiler jusqu'à lui (une fois).
      if (element && !defile && !selecteur.startsWith('[data-cible')) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        defile = true
      }
      const cle = r && r.width > 0 ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` : ''
      if (cle !== dernier.current) {
        dernier.current = cle
        setRect(cle ? r : null)
      }
      image = requestAnimationFrame(suivre)
    }
    image = requestAnimationFrame(suivre)
    return () => {
      cancelAnimationFrame(image)
      marquee?.removeAttribute('data-tuto-actif')
    }
  }, [selecteur])
  return selecteur ? rect : null
}

// Les confettis du « Bravo ! » et des grandes fenêtres.
const CONFETTIS = Array.from({ length: 18 }, (_, i) => ({
  x: Math.round(Math.cos((i / 18) * Math.PI * 2) * (90 + (i % 3) * 30)),
  y: Math.round(Math.sin((i / 18) * Math.PI * 2) * (70 + (i % 4) * 20)),
  couleur: ['#ffd21f', '#3fa34d', '#3a8ee8', '#e8452f', '#d23d93'][i % 5],
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

// Le but du jeu, en 4 étapes illustrées.
const BUT = [
  { icone: '⛏️', titre: 'Creuse', texte: 'des blocs à la mine' },
  { icone: '💰', titre: 'Vends', texte: 'tes minerais au marché' },
  { icone: '🏗️', titre: 'Construis', texte: 'ton village' },
  { icone: '⚡', titre: 'Automatise', texte: 'mineurs, rails, électricité' },
]

// La grande fenêtre du début : Pépite se présente et explique le but.
function Bienvenue({ onSuivant, onPasser }: { onSuivant: () => void; onPasser: () => void }) {
  return (
    <div className="tuto-voile" role="dialog" aria-modal="true" aria-labelledby="tuto-bienvenue-titre">
      <section className="tuto-grande">
        <img className="tuto-grande-pepite" src={PEPITE} alt="" draggable={false} />
        <h2 id="tuto-bienvenue-titre" className="tuto-grande-titre">
          Bienvenue, mineur !
        </h2>
        <p className="tuto-grande-texte">
          Moi, c’est <strong>Pépite</strong>. Ton but : devenir <strong>le plus riche des mineurs</strong> et creuser jusqu’au <strong>cœur de diamant 💎</strong>.
        </p>
        <ol className="tuto-but">
          {BUT.map((b, i) => (
            <li key={b.titre} style={{ animationDelay: `${200 + i * 140}ms` }}>
              <span className="tuto-but-icone" aria-hidden="true">
                {b.icone}
              </span>
              <strong>{b.titre}</strong>
              <span>{b.texte}</span>
            </li>
          ))}
        </ol>
        <p className="tuto-grande-texte">Je te montre les premiers pas : suis la flèche !</p>
        <button className="bouton bouton-vendre tuto-gros-bouton" onClick={onSuivant} autoFocus>
          ⛏️ C’est parti !
        </button>
        <button className="tuto-passer" onClick={onPasser}>
          Je connais déjà : passer le tutoriel
        </button>
      </section>
    </div>
  )
}

// La grande fenêtre de la fin : bravo, et la suite.
function Felicitations({ onSuivant }: { onSuivant: () => void }) {
  return (
    <div className="tuto-voile tuto-voile-leger" role="dialog" aria-modal="true" aria-labelledby="tuto-bravo-titre">
      <section className="tuto-grande">
        <Confettis />
        <img className="tuto-grande-pepite" src={PEPITE} alt="" draggable={false} />
        <h2 id="tuto-bravo-titre" className="tuto-grande-titre">
          Bravo, tu as compris !
        </h2>
        <p className="tuto-grande-texte">
          Tu sais <strong>creuser</strong> et <strong>vendre</strong>. La suite est dans ta <strong>liste de tâches</strong>, en haut à droite :
        </p>
        <ul className="tuto-suite">
          <li>👷 Embauche des mineurs qui creusent pour toi</li>
          <li>🛤️ Pose des rails : un wagonnet vend le coffre tout seul</li>
          <li>⬇️ Descends la mine : de nouveaux minerais, plus chers</li>
        </ul>
        <button className="bouton bouton-vendre tuto-gros-bouton" onClick={onSuivant} autoFocus>
          ✔ À moi de jouer !
        </button>
      </section>
    </div>
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
    // (pas au début : le bonjour n'est pas une action ; pas à la fin : la grande fenêtre fait déjà la fête)
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
  const rect = useRectangle(c?.cible ?? null)
  if (!etape || !c) return null

  const fenetrePasser = confirmer && (
    <Confirmation
      titre="Passer le tutoriel ?"
      texteConfirmer="Passer"
      onConfirmer={() => {
        setConfirmer(false)
        onPasser()
      }}
      onAnnuler={() => setConfirmer(false)}
    >
      <p>Tu pourras toujours suivre ta liste de tâches, en haut à droite.</p>
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

  const numero = ETAPES_TUTORIEL.indexOf(etape)
  // La flèche au-dessus de la cible (en dessous si la cible est tout en haut de l'écran). Un
  // bâtiment a une grande image (avec du vide autour) : la flèche montre son milieu.
  const surBatiment = c.cible?.startsWith('[data-cible') ?? false
  const dessous = rect !== null && !surBatiment && rect.top < 140
  const marge = 8
  const centreX = rect ? rect.left + rect.width / 2 : 0
  const centreY = rect ? rect.top + rect.height / 2 : 0
  const hautFleche = rect ? (surBatiment ? centreY : dessous ? rect.bottom + marge : rect.top - marge) : 0
  return (
    <>
      {rect && (
        <div className="tuto-cible" aria-hidden="true">
          <div
            className="tuto-cercle"
            style={{ left: rect.left - marge, top: rect.top - marge, width: rect.width + marge * 2, height: rect.height + marge * 2 }}
          />
          {/* Des ondes dorées qui partent de la cible, comme un caillou dans l'eau. */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="tuto-onde"
              style={{
                left: centreX,
                top: centreY,
                width: Math.min(220, Math.max(60, rect.width)),
                height: Math.min(220, Math.max(60, rect.width)),
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
          <div
            className={`tuto-fleche ${dessous ? 'tuto-fleche-dessous' : ''}`}
            style={{ left: centreX, top: hautFleche }}
          >
            <span className="tuto-fleche-dessin">⬇</span>
            <span className="tuto-geste">{c.geste}</span>
          </div>
        </div>
      )}
      {etape === 'bravo' ? (
        <Felicitations onSuivant={onSuivant} />
      ) : (
        <section key={`${etape}-${c.titre.split(':')[0]}`} className="tuto-carte" role="dialog" aria-live="polite" aria-label="Tutoriel">
          <img className="tuto-pepite" src={PEPITE} alt="" draggable={false} />
          <div className="tuto-bulle">
            <div className="tuto-etapes" aria-label={`Étape ${numero} sur ${ETAPES_TUTORIEL.length - 2}`}>
              <span className="tuto-numero">
                Étape {numero} / {ETAPES_TUTORIEL.length - 2}
              </span>
              {ETAPES_TUTORIEL.slice(1, -1).map((e, i) => (
                <i key={e} className={i + 1 < numero ? 'faite' : i + 1 === numero ? 'en-cours' : ''} />
              ))}
            </div>
            <strong className="tuto-titre">{c.titre}</strong>
            <p className="tuto-texte">{c.texte}</p>
            <p className="tuto-pourquoi">💡 {c.pourquoi}</p>
            <button className="tuto-passer" onClick={() => setConfirmer(true)}>
              Passer le tutoriel
            </button>
          </div>
        </section>
      )}
      {fete > 0 && (
        <div key={fete} className="tuto-fete" aria-hidden="true">
          <Confettis />
          <span className="tuto-fete-coche">✔</span>
          <span className="tuto-fete-texte">Bravo !</span>
        </div>
      )}
      {fenetrePasser}
    </>
  )
}
