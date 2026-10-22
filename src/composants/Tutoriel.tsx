// Le tutoriel (27/10), dans le style du jeu : une carte en haut de l'écran où Pépite, un hamster
// mineur, explique quoi faire, et une grosse flèche qui rebondit sur ce qu'il faut toucher (un
// bâtiment, le bloc, un bouton), avec un cercle doré autour et le reste de l'écran un peu
// assombri. On ne passe à l'étape suivante qu'en faisant l'action (les règles sont dans
// src/jeu/tutoriel.ts).
//
// La cible est trouvée dans la page par son attribut (data-tuto="bloc", data-cible="batiment:puits"...) :
// on suit sa position à chaque image (la carte du village bouge, les panneaux défilent).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { IdBatiment } from '../jeu/donnees'
import { nbDansSac, type EtatJeu } from '../jeu/mineur'
import { avecBouton, BLOCS_TUTORIEL, ETAPES_TUTORIEL, etapeTutoriel, type IdEtapeTutoriel } from '../jeu/tutoriel'
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

type Consigne = { titre: string; texte: string; cible: string | null }

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
      return {
        titre: 'Salut, mineur !',
        texte: 'Moi, c’est Pépite. Je vais te montrer comment creuser, vendre… et devenir riche. Suis les flèches !',
        cible: null,
      }
    case 'creuser':
      return aLaMine
        ? {
            titre: `Casse ${BLOCS_TUTORIEL} blocs (${Math.min(etat.stats.blocsCasses, BLOCS_TUTORIEL)} / ${BLOCS_TUTORIEL})`,
            texte: 'Clique sur le bloc, encore et encore ! Tout ce qui tombe va dans le coffre de la mine.',
            cible: '[data-tuto="bloc"]',
          }
        : { titre: 'Va à la mine', texte: 'Touche la mine : ton hamster y va tout seul.', cible: batiment('puits') }
    case 'marche':
      if (ui.posePrevue === 'marche')
        return { titre: 'Choisis sa place', texte: 'Touche la carte pour placer le marché, puis valide.', cible: '[data-tuto="construire-ici"]' }
      if (ui.menuConstruction) return { titre: 'Pose le marché', texte: 'Il est gratuit ! C’est là que tu vendras tes minerais.', cible: '[data-tuto="poser-marche"]' }
      return { titre: 'Construis le marché', texte: 'Pour vendre ce que tu creuses, il te faut un marché. Ouvre le menu Bâtiments.', cible: '[data-tuto="batiments"]' }
    case 'sac':
      return aLaMine
        ? { titre: 'Remplis ton sac', texte: 'Mets le contenu du coffre dans ton sac à dos, pour l’emporter au marché.', cible: '[data-tuto="sac"]' }
        : { titre: 'Retourne à la mine', texte: 'Ton coffre se remplit : va le chercher !', cible: batiment('puits') }
    case 'vendre':
      return ui.batimentOuvert === 'marche'
        ? { titre: 'Vends tout !', texte: 'Ton argent sert à tout construire et tout améliorer.', cible: '[data-tuto="vendre"]' }
        : {
            titre: 'Va au marché',
            texte: `Ton sac est plein de minerais (${nbDansSac(etat)}). Emporte-les au marché !`,
            cible: batiment('marche'),
          }
    case 'bravo':
      return {
        titre: 'Bravo, tu as compris !',
        texte: 'La suite est dans ta liste de tâches, en haut à droite : embauche des mineurs, pose des rails, automatise tout !',
        cible: '.missions',
      }
  }
}

// La position de la cible à l'écran, suivie à chaque image.
function useRectangle(selecteur: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const dernier = useRef('')
  useEffect(() => {
    dernier.current = '?' // (la première image met toujours la position à jour)
    if (!selecteur) return
    let image = 0
    let defile = false
    const suivre = () => {
      const element = document.querySelector(selecteur)
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
    return () => cancelAnimationFrame(image)
  }, [selecteur])
  return selecteur ? rect : null
}

export function Tutoriel({ etat, ui, onSuivant, onPasser }: Props) {
  const etape = etapeTutoriel(etat)
  const [confirmer, setConfirmer] = useState(false)
  // Une petite fanfare à chaque étape réussie.
  const avant = useRef(etape)
  useLayoutEffect(() => {
    if (avant.current !== null && etape !== avant.current && etape !== null) sons.succes()
    avant.current = etape
  }, [etape])
  const c = etape ? consigne(etape, etat, ui) : null
  const rect = useRectangle(c?.cible ?? null)
  if (!etape || !c) return null

  const numero = ETAPES_TUTORIEL.indexOf(etape)
  // La flèche au-dessus de la cible (en dessous si la cible est tout en haut de l'écran).
  const dessous = rect !== null && rect.top < 120
  const marge = 8
  return (
    <>
      {rect && (
        <div className="tuto-cible" aria-hidden="true">
          <div
            className="tuto-cercle"
            style={{ left: rect.left - marge, top: rect.top - marge, width: rect.width + marge * 2, height: rect.height + marge * 2 }}
          />
          <div
            className={`tuto-fleche ${dessous ? 'tuto-fleche-dessous' : ''}`}
            style={{ left: rect.left + rect.width / 2, top: dessous ? rect.bottom + marge : rect.top - marge }}
          >
            <span>⬇</span>
          </div>
        </div>
      )}
      <section key={etape} className="tuto-carte" role="dialog" aria-live="polite" aria-label="Tutoriel">
        <img className="tuto-pepite" src="/images/personnages/sprites/mineur_commun_devant.webp" alt="" draggable={false} />
        <div className="tuto-bulle">
          <div className="tuto-etapes" aria-label={`Étape ${numero + 1} sur ${ETAPES_TUTORIEL.length}`}>
            {ETAPES_TUTORIEL.map((e, i) => (
              <i key={e} className={i < numero ? 'faite' : i === numero ? 'en-cours' : ''} />
            ))}
          </div>
          <strong className="tuto-titre">{c.titre}</strong>
          <p className="tuto-texte">{c.texte}</p>
          <div className="tuto-boutons">
            {avecBouton(etape) && (
              <button className="bouton bouton-vendre tuto-suivant" onClick={onSuivant} autoFocus>
                {etape === 'bonjour' ? '⛏️ C’est parti !' : '✔ Terminer'}
              </button>
            )}
            {etape !== 'bravo' && (
              <button className="tuto-passer" onClick={() => setConfirmer(true)}>
                Passer le tutoriel
              </button>
            )}
          </div>
        </div>
      </section>
      {confirmer && (
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
      )}
    </>
  )
}
