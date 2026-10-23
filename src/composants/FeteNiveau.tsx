// La fête du niveau (23/10) : quand le joueur passe un niveau, une grande fenêtre surgit. L'étoile
// tombe et rebondit avec l'ancien niveau, le chiffre monte jusqu'au nouveau (un « tic » par
// niveau gagné), une gerbe de rayons et de confettis éclate, puis tout ce qu'on vient de débloquer
// (bâtiments, améliorations) arrive ligne par ligne, chacun avec son icône et un petit son.
// Aucune règle du jeu ici : ce qui se débloque vient de src/jeu/niveaux.ts.

import { useEffect, useState } from 'react'
import { deblocagesDuNiveau } from '../jeu/niveaux'
import { sons } from '../sons'
import { tirerConfettis } from './confettis'

type Props = {
  avant: number // le niveau d'avant
  niveau: number // le nouveau niveau
  prochain: { niveau: number; choses: string[] } | null // ce qui attend au niveau suivant
  onFermer: () => void
}

// Le temps avant que le chiffre ne se mette à monter, puis entre deux niveaux (ms).
const DEBUT_COMPTEUR = 650
const PAS_COMPTEUR = 260
// Entre deux lignes de la liste des déblocages (ms).
const PAS_LISTE = 230

// « ⛏️ Mine niveau 2 : Veine de redstone » → l'icône, puis le texte.
function couper(chose: string): { icone: string; texte: string } {
  const espace = chose.indexOf(' ')
  return espace > 0 ? { icone: chose.slice(0, espace), texte: chose.slice(espace + 1) } : { icone: '✨', texte: chose }
}

export function FeteNiveau({ avant, niveau, prochain, onFermer }: Props) {
  // Tout ce qui se débloque, de tous les niveaux gagnés d'un coup.
  const choses = Array.from({ length: niveau - avant }, (_, i) => deblocagesDuNiveau(avant + 1 + i)).flat()
  const [affiche, setAffiche] = useState(avant)
  const [lignes, setLignes] = useState(0)
  const [confettis] = useState(() => tirerConfettis(46, ['#ffd84a', '#ffffff', '#ff9d2e', '#9cf08f', '#7fd3ff', '#c792ff']))
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

  // Puis les déblocages arrivent un par un.
  useEffect(() => {
    const minuteurs: number[] = []
    for (let i = 1; i <= choses.length; i++) {
      minuteurs.push(
        window.setTimeout(() => {
          setLignes(i)
          sons.ligneDeblocage(i)
        }, finCompteur + 350 + (i - 1) * PAS_LISTE),
      )
    }
    return () => minuteurs.forEach((m) => clearTimeout(m))
  }, [choses.length, finCompteur])

  const arrive = affiche === niveau
  return (
    <div className="voile voile-devant fete-niveau" role="dialog" aria-modal="true" aria-labelledby="titre-fete-niveau" onClick={onFermer}>
      <section className="carte fete-niveau-carte" onClick={(e) => e.stopPropagation()}>
        {/* Les rayons qui tournent derrière l'étoile, et les confettis qui éclatent. */}
        <span className={`fete-rayons ${arrive ? 'fete-rayons-on' : ''}`} aria-hidden="true" />
        {arrive && (
          <span className="fete-confettis" aria-hidden="true">
            {confettis.map((c, i) => (
              <i
                key={i}
                className={c.rond ? 'rond' : ''}
                style={{
                  ['--dx' as string]: `${c.dx}px`,
                  ['--dy' as string]: `${c.dy}px`,
                  ['--tour' as string]: `${c.tour}deg`,
                  animationDelay: `${c.delai}ms`,
                  background: c.couleur,
                }}
              />
            ))}
          </span>
        )}
        <p className="fete-sur-titre" id="titre-fete-niveau">
          Niveau supérieur !
        </p>
        <div className={`fete-etoile ${arrive ? 'fete-etoile-arrive' : ''}`}>
          <span className="fete-etoile-fond" aria-hidden="true">
            ⭐
          </span>
          {/* (la clé change à chaque niveau : le chiffre rejoue son animation de saut) */}
          <span key={affiche} className="fete-chiffre">
            {affiche}
          </span>
        </div>
        {choses.length > 0 ? (
          <>
            <p className="fete-sous-titre">{choses.length === 1 ? 'Tu débloques :' : `Tu débloques ${choses.length} choses :`}</p>
            <ul className="fete-liste">
              {choses.map((chose, i) => {
                const { icone, texte } = couper(chose)
                return (
                  <li key={chose} className={i < lignes ? 'fete-ligne-on' : ''}>
                    <span className="fete-ligne-icone" aria-hidden="true">
                      {icone}
                    </span>
                    <span>{texte}</span>
                    <span className="fete-ligne-nouveau">Nouveau !</span>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="fete-sous-titre">Bravo, continue comme ça !</p>
        )}
        {prochain && (
          <p className="discret fete-prochain">
            Au niveau {prochain.niveau} : {prochain.choses.slice(0, 2).join(', ')}
            {prochain.choses.length > 2 ? '…' : ''}
          </p>
        )}
        <button className="bouton bouton-vendre tuto-gros-bouton fete-bouton" onClick={onFermer} autoFocus>
          🎉 Génial !
        </button>
      </section>
    </div>
  )
}
