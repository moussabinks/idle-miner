// La fête du niveau : quand le joueur passe un niveau, une fenêtre surgit (App ne la montre que
// quand aucune autre fenêtre n'est ouverte). L'étoile arrive avec l'ancien niveau, le chiffre
// monte jusqu'au nouveau (un « tic » par niveau gagné), des confettis éclatent, puis les gemmes
// gagnées et tout ce qu'on vient de débloquer arrivent ligne par ligne, avec un petit son.
// Aucune règle du jeu ici : ce qui se débloque vient de src/jeu/niveaux.ts, les gemmes de
// src/jeu/gemmes.ts (GEMMES_PAR_NIVEAU).

import { useEffect, useState } from 'react'
import { GEMMES_PAR_NIVEAU } from '../jeu/gemmes'
import { t } from '../jeu/langue'
import { deblocagesDuNiveau } from '../jeu/niveaux'
import { sons } from '../sons'
import { tirerConfettis } from './confettis'
import { Fenetre } from './Fenetre'

type Props = {
  avant: number // le niveau d'avant
  niveau: number // le nouveau niveau
  prochain: { niveau: number; choses: string[] } | null // ce qui attend au niveau suivant
  onFermer: () => void
}

// Le temps avant que le chiffre ne se mette à monter, puis entre deux niveaux (ms).
const DEBUT_COMPTEUR = 500
const PAS_COMPTEUR = 260
// Entre deux lignes de la liste (ms).
const PAS_LISTE = 230
// On ne peut pas la fermer pendant la première seconde (ms) : un joueur qui clique vite sur la
// mine la fermait sans la voir.
const DELAI_AVANT_FERMER = 1000

// « ⛏️ Mine niveau 2 : Veine de redstone » → l'icône, puis le texte.
function couper(chose: string): { icone: string; texte: string } {
  const espace = chose.indexOf(' ')
  return espace > 0 ? { icone: chose.slice(0, espace), texte: chose.slice(espace + 1) } : { icone: '✨', texte: chose }
}

export function FeteNiveau({ avant, niveau, prochain, onFermer }: Props) {
  const nbNiveaux = Math.max(1, niveau - avant)
  // Tout ce qui se débloque, de tous les niveaux gagnés d'un coup.
  const choses = Array.from({ length: niveau - avant }, (_, i) => deblocagesDuNiveau(avant + 1 + i)).flat()
  const gemmes = nbNiveaux * GEMMES_PAR_NIVEAU
  // Les lignes à faire arriver : d'abord les gemmes, puis les déblocages.
  const lignesTotal = 1 + choses.length
  const [affiche, setAffiche] = useState(avant)
  const [lignes, setLignes] = useState(0)
  const [peutFermer, setPeutFermer] = useState(false)
  const [confettis] = useState(() => tirerConfettis(36, ['#f9d65a', '#8fe08f', '#8cc8f5', '#f39aa8', '#b9a0f5']))
  const finCompteur = DEBUT_COMPTEUR + (niveau - avant) * PAS_COMPTEUR

  // Le chiffre qui monte, avec un « tic » à chaque niveau, et la fanfare à la fin.
  useEffect(() => {
    const minuteurs: number[] = []
    for (let n = avant + 1; n <= niveau; n++) {
      minuteurs.push(
        window.setTimeout(() => {
          setAffiche(n)
          if (n === niveau) sons.niveauGagne()
          else sons.ticNiveau(n - avant)
        }, DEBUT_COMPTEUR + (n - avant - 1) * PAS_COMPTEUR),
      )
    }
    return () => minuteurs.forEach((m) => clearTimeout(m))
  }, [avant, niveau])

  // Puis les lignes arrivent une par une.
  useEffect(() => {
    const minuteurs: number[] = []
    for (let i = 1; i <= lignesTotal; i++) {
      minuteurs.push(
        window.setTimeout(() => {
          setLignes(i)
          sons.ligneDeblocage(i)
        }, finCompteur + 300 + (i - 1) * PAS_LISTE),
      )
    }
    return () => minuteurs.forEach((m) => clearTimeout(m))
  }, [lignesTotal, finCompteur])

  // Au bout d'une seconde, on peut la fermer.
  useEffect(() => {
    const minuteur = window.setTimeout(() => setPeutFermer(true), DELAI_AVANT_FERMER)
    return () => clearTimeout(minuteur)
  }, [])
  function fermer() {
    if (peutFermer) onFermer()
  }

  const arrive = affiche === niveau
  return (
    <Fenetre
      titre={t('Niveau supérieur !')}
      icone="⭐"
      couleur="jaune"
      taille="petite"
      devant
      fermable={peutFermer}
      onFermer={fermer}
      classe="fete-niveau"
      pied={
        <button className="btn btn-jaune btn-grand btn-large" onClick={fermer} disabled={!peutFermer} autoFocus>
          🎉 {t('Génial !')}
        </button>
      }
    >
      {/* L'étoile avec le niveau, et les confettis qui éclatent. */}
      <div className="fete-etoile-zone">
        {arrive && (
          <span className="fete-confettis" aria-hidden="true">
            {confettis.map((c, i) => (
              <i
                key={i}
                className={c.rond ? 'rond' : ''}
                style={{
                  ['--dx' as string]: `${c.dx * 0.7}px`,
                  ['--dy' as string]: `${c.dy * 0.6}px`,
                  ['--tour' as string]: `${c.tour}deg`,
                  animationDelay: `${c.delai}ms`,
                  background: c.couleur,
                }}
              />
            ))}
          </span>
        )}
        <div className={`fete-etoile ${arrive ? 'fete-etoile-arrive' : ''}`}>
          <svg className="fete-etoile-dessin" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M50 6 L62 36 L94 38 L69 58 L77 90 L50 72 L23 90 L31 58 L6 38 L38 36 Z" fill="#f9d65a" stroke="#2a2140" strokeWidth="6" strokeLinejoin="round" />
          </svg>
          {/* (la clé change à chaque niveau : le chiffre rejoue son animation de saut) */}
          <span key={affiche} className="fete-chiffre">
            {affiche}
          </span>
        </div>
      </div>

      <ul className="fete-liste">
        {/* Les gemmes gagnées. */}
        <li className={`carte fete-ligne fete-gemmes ${lignes >= 1 ? 'fete-ligne-on' : ''}`}>
          <span className="fete-ligne-icone" aria-hidden="true">
            💎
          </span>
          <span className="fete-ligne-texte">{t('Gemmes gagnées')}</span>
          <span className="etiquette etiquette-violet">+{gemmes} 💎</span>
        </li>
        {/* Ce qui se débloque. */}
        {choses.map((chose, i) => {
          const { icone, texte } = couper(chose)
          return (
            <li key={chose} className={`carte fete-ligne ${i + 2 <= lignes ? 'fete-ligne-on' : ''}`}>
              <span className="fete-ligne-icone" aria-hidden="true">
                {icone}
              </span>
              <span className="fete-ligne-texte">{t(texte)}</span>
              <span className="etiquette etiquette-vert">{t('Nouveau !')}</span>
            </li>
          )
        })}
      </ul>

      {prochain && (
        <p className="discret fete-prochain">
          🔒 {t('Au niveau {n} : {choses}', { n: prochain.niveau, choses: prochain.choses.slice(0, 2).map((c) => t(couper(c).texte)).join(', ') })}
          {prochain.choses.length > 2 ? '…' : ''}
        </p>
      )}
    </Fenetre>
  )
}
