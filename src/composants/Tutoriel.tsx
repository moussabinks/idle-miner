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
import { BATIMENTS, type IdBatiment } from '../jeu/donnees'
import { disponible, nbDansSac, peutPayer, type EtatJeu } from '../jeu/mineur'
import { BLOCS_TUTORIEL, ETAPES_TUTORIEL, etapeTutoriel, type IdEtapeTutoriel } from '../jeu/tutoriel'
import { sons } from '../sons'
import { Confirmation } from './Confirmation'

// Ce que l'interface montre en ce moment (pour savoir où mettre la flèche).
export type EtatInterface = {
  batimentOuvert: IdBatiment | null // le panneau ouvert
  menuConstruction: boolean
  posePrevue: IdBatiment | null // le bâtiment qu'on est en train de placer
  poseChoisie: boolean // (23/10) le joueur a touché la carte : la place du bâtiment est choisie
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
      // (23/10) En deux temps : d'abord toucher la carte (rien n'est assombri, aucune flèche sur le
      // bouton), puis, une fois la place choisie, le bouton « Construire ici » est mis en avant.
      if (ui.posePrevue === 'marche')
        return ui.poseChoisie
          ? {
              titre: 'Valide sa place',
              texte: 'Ça te plaît ? Touche « Construire ici ». (Tu peux encore toucher la carte pour le déplacer.)',
              pourquoi: 'Près de la mine, c’est moins de chemin à faire.',
              geste: 'Valide !',
              cible: '[data-tuto="construire-ici"]',
            }
          : {
              titre: 'Choisis sa place',
              texte: 'Touche la carte, là où tu veux poser le marché.',
              pourquoi: 'Près de la mine, c’est moins de chemin à faire.',
              geste: '',
              cible: null,
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
    case 'forgeron': {
      // Il faut un peu d'argent et de pierre : s'il en manque, on retourne creuser et vendre.
      const cout = BATIMENTS.forgeron.cout
      const manque = !peutPayer(etat, cout)
      // (30/10) Il manque de la pierre : on creuse. Il manque de l'argent : on va vendre (en
      // gardant la pierre). Dès qu'on a tout, le panneau de la mine se ferme (App) et la flèche
      // montre le menu Bâtiments.
      const pierreVoulue = cout.materiaux.pierre ?? 0
      const manquePierre = disponible(etat, 'pierre') < pierreVoulue
      if (manque && manquePierre && !ui.menuConstruction && ui.posePrevue !== 'forgeron')
        return {
          titre: `Récupère ${pierreVoulue} pierre : ${Math.min(disponible(etat, 'pierre'), pierreVoulue)} / ${pierreVoulue}`,
          texte: `Le forgeron coûte ${cout.argent ?? 0} $ et ${pierreVoulue} pierre. Creuse encore un peu : la pierre va dans le coffre.`,
          pourquoi: 'Le forgeron répare ta pioche et en fabrique de meilleures.',
          geste: 'Creuse !',
          cible: ui.batimentOuvert === 'puits' ? '[data-tuto="bloc"]' : batiment('puits'),
        }
      // Assez de pierre, mais pas assez d'argent : on arrête de creuser, on va vendre le reste.
      if (manque && !ui.menuConstruction && ui.posePrevue !== 'forgeron')
        return {
          titre: `Assez de pierre ! Gagne ${cout.argent ?? 0} $ : ${Math.floor(etat.argent)} / ${cout.argent ?? 0}`,
          texte:
            nbDansSac(etat) > 0
              ? 'Arrête de creuser : va vendre ton sac au marché (garde ta pierre !).'
              : 'Arrête de creuser : mets le charbon et le fer dans ton sac (garde la pierre), puis vends-les au marché.',
          pourquoi: 'Il te manque un peu d’argent pour le forgeron.',
          geste: 'Touche ici !',
          cible: nbDansSac(etat) > 0 ? batiment('marche') : ui.batimentOuvert === 'puits' ? '[data-tuto="sac"]' : batiment('puits'),
        }
      if (ui.posePrevue === 'forgeron')
        return ui.poseChoisie
          ? {
              titre: 'Valide sa place',
              texte: 'Touche « Construire ici ». (Tu peux encore toucher la carte pour le déplacer.)',
              pourquoi: 'Tu pourras toujours le déplacer plus tard.',
              geste: 'Valide !',
              cible: '[data-tuto="construire-ici"]',
            }
          : {
              titre: 'Choisis sa place',
              texte: 'Touche la carte, là où tu veux poser le forgeron.',
              pourquoi: 'Tu pourras toujours le déplacer plus tard.',
              geste: '',
              cible: null,
            }
      if (ui.menuConstruction)
        return {
          titre: 'Pose le forgeron',
          texte: `Il coûte ${cout.argent ?? 0} $ et ${cout.materiaux.pierre ?? 0} pierre.`,
          pourquoi: 'Le forgeron répare ta pioche et en fabrique de meilleures.',
          geste: 'Pose-le !',
          cible: '[data-tuto="poser-forgeron"]',
        }
      return {
        titre: 'Construis le forgeron',
        texte: 'Ouvre le menu Bâtiments.',
        pourquoi: 'Ta pioche s’use : le forgeron la répare, et en fabrique de meilleures.',
        geste: 'Touche ici !',
        cible: '[data-tuto="batiments"]',
      }
    }
    case 'bravo':
      return { titre: '', texte: '', pourquoi: '', geste: 'Tes quêtes conseillées', cible: '.missions' }
  }
}

// La position de la cible à l'écran, suivie à chaque image. La cible reçoit aussi l'attribut
// data-tuto-actif : elle palpite (interface.css).
// (30/10, pour la fluidité) On ne redessine plus le tutoriel à chaque image : la position est
// écrite directement dans des variables CSS du calque doré (--x, --y, --l, --h), et les
// éléments s'y déplacent avec transform (le navigateur n'a qu'à faire glisser leurs calques).
// React ne change que quand la cible apparaît, disparaît, ou passe en haut de l'écran.
type Suivi = { visible: boolean; dessous: boolean }
function useSuiviCible(selecteur: string | null, calque: React.RefObject<HTMLDivElement | null>, surBatiment: boolean): Suivi {
  const [suivi, setSuivi] = useState<Suivi>({ visible: false, dessous: false })
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
        }
      }
      const r = marquee?.getBoundingClientRect() ?? null
      // Un bouton dans un panneau : on le fait défiler jusqu'à lui (une fois).
      if (marquee && !defile && !surBatiment) {
        marquee.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
      if (visible !== dernierSuivi.current.visible || dessous !== dernierSuivi.current.dessous) {
        dernierSuivi.current = { visible, dessous }
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
  return selecteur ? suivi : { visible: false, dessous: false }
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
          Tutoriel terminé !
        </h2>
        <p className="tuto-grande-texte">
          Tu sais <strong>creuser</strong>, <strong>vendre</strong> et <strong>construire</strong>. À partir de maintenant, <strong>tu es libre</strong> : plus rien n’est obligatoire.
        </p>
        {/* (23/10) Les quêtes conseillées : une flèche montre la liste en haut à droite. */}
        <div className="tuto-quetes">
          <span className="tuto-quetes-fleche" aria-hidden="true">
            ↗
          </span>
          <span>
            Des <strong>quêtes conseillées</strong> t’attendent <strong>en haut à droite</strong> (encadrées en doré). Suis-les si tu veux, <strong>dans l’ordre que tu veux</strong>, ou fais à ta façon !
          </span>
        </div>
        <ul className="tuto-suite">
          <li>⭐ Tout ce que tu fais rapporte de l’XP : monte de niveau (en haut à gauche)</li>
          <li>🔓 Chaque niveau débloque des bâtiments et des améliorations</li>
          <li>👷 Mineurs, 🛤️ rails, ⚡ électricité : automatise ta mine</li>
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
  // Un bâtiment a une grande image (avec du vide autour) : la flèche montre son milieu.
  const surBatiment = c?.cible?.startsWith('[data-cible') ?? false
  const calque = useRef<HTMLDivElement>(null)
  const suivi = useSuiviCible(c?.cible ?? null, calque, surBatiment)
  if (!etape || !c) return null

  const fenetrePasser = confirmer && (
    <Confirmation
      titre="Passer le tutoriel ?"
      texteConfirmer="Passer"
      classe="voile-devant"
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
  return (
    <>
      {/* Le calque doré : toujours là (caché tant que la cible n'est pas trouvée), déplacé par
          useSuiviCible sans repasser par React. */}
      {c.cible && (
        <div
          ref={calque}
          className={`tuto-cible ${suivi.visible ? '' : 'tuto-cible-cachee'} ${surBatiment ? 'tuto-sur-batiment' : ''} ${suivi.dessous ? 'tuto-cible-dessous' : ''} ${etape === 'bravo' ? 'tuto-cible-fin' : ''}`}
          aria-hidden="true"
        >
          {/* Le voile sombre autour de la cible (immobile), puis l'anneau doré qui pulse. */}
          <div className="tuto-trou" />
          <div className="tuto-cercle" />
          {/* Des ondes dorées qui partent de la cible, comme un caillou dans l'eau. */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="tuto-onde-place">
              <div className="tuto-onde" style={{ animationDelay: `${i * 0.5}s` }} />
            </div>
          ))}
          <div className="tuto-fleche-place">
            <div className={`tuto-fleche ${suivi.dessous ? 'tuto-fleche-dessous' : ''}`}>
              <span className="tuto-fleche-dessin">⬇</span>
              <span className="tuto-geste">{c.geste}</span>
            </div>
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
