// Le classement des joueurs (leaderboard), sur l'écran d'accueil.
// (23/10) Un seul classement : l'argent en poche (le meilleur des mondes du joueur, mis à jour
// toutes les 5 minutes). Le niveau de la
// mine est affiché à côté de chacun, mais il ne compte pas. Tout le monde peut le voir ; pour y
// apparaître, il faut un compte (le score part avec la sauvegarde en ligne).
// En haut, un podium pour les 3 premiers, puis les 7 suivants (le top 10, 23/10) ; en bas, la place du joueur et celui qu'il doit
// dépasser (« encore 3 000 $ pour dépasser Jade »).

import { useEffect, useState } from 'react'
import { niveauMineAffiche, type LigneClassement } from '../jeu/classement'
import { lireClassement, placeDuScore } from '../enLigne'
import type { Joueur } from '../enLigne'

// (23/10) Le top 10 : le podium, puis les 7 suivants en dessous.
const NB_LIGNES = 10
// (23/10) Le classement se relit tout seul toutes les 5 minutes (le rythme d'envoi des scores).
const INTERVALLE_ACTUALISATION = 5 * 60 * 1000 // ms
const MEDAILLES = ['🥇', '🥈', '🥉']

// « 1 250 $ », « 3,5 k$ », « 2,45 M$ » : court, pour que tout tienne sur une ligne.
function dollars(n: number): string {
  if (n < 10_000) return `${Math.floor(n).toLocaleString('fr-FR')} $`
  if (n < 1_000_000) return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k$`
  return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M$`
}

function Niveau({ ligne }: { ligne: LigneClassement }) {
  const niveau = niveauMineAffiche(ligne)
  return niveau === null ? null : (
    <span className="classement-mine" title="Le niveau de sa mine (il ne compte pas dans le classement)">
      🕳️ {niveau}
    </span>
  )
}

type Props = {
  joueur: Joueur | null
  dernierEnvoi: number | null // l'heure du dernier envoi du score ; quand elle change, on relit le classement
  monArgent: number // le plus d'argent en poche dans les mondes de ce navigateur
  onSeConnecter: () => void // « Crée un compte » : montre le formulaire du compte
}

export function CarteClassement({ joueur, dernierEnvoi, monArgent, onSeConnecter }: Props) {
  const [lignes, setLignes] = useState<LigneClassement[] | null>(null) // null = en cours de chargement
  const [erreur, setErreur] = useState(false)
  const [place, setPlace] = useState<{ devant: number; suivant: LigneClassement | null } | null>(null)
  // Change quand on clique sur « Actualiser » : le classement est relu.
  const [actualisation, setActualisation] = useState(0)

  // Toutes les 5 minutes, on relit le classement (l'argent en poche des joueurs a pu changer).
  useEffect(() => {
    const minuterie = window.setInterval(() => setActualisation((n) => n + 1), INTERVALLE_ACTUALISATION)
    return () => window.clearInterval(minuterie)
  }, [])

  useEffect(() => {
    let annule = false
    lireClassement(NB_LIGNES)
      .then((resultat) => {
        if (annule) return
        setLignes(resultat)
        setErreur(false)
      })
      .catch(() => {
        if (!annule) setErreur(true)
      })
    // La place du joueur (même s'il n'est pas dans les 10 premiers, ou pas encore connecté).
    placeDuScore(monArgent, joueur?.pseudo ?? null)
      .then((resultat) => {
        if (!annule) setPlace(resultat)
      })
      .catch(() => {
        if (!annule) setPlace(null)
      })
    return () => {
      annule = true
    }
  }, [actualisation, dernierEnvoi, monArgent, joueur])

  const estMoi = (ligne: LigneClassement) => joueur !== null && ligne.pseudo.toLowerCase() === joueur.pseudo.toLowerCase()

  let contenu
  if (erreur) contenu = <p className="manque classement-message">Impossible de charger le classement. Vérifie ta connexion.</p>
  else if (lignes === null) contenu = <p className="discret classement-message">Chargement du classement…</p>
  else if (lignes.length === 0) contenu = <p className="discret classement-message">Personne n'est encore classé : à toi d'être le premier !</p>
  else {
    const podium = lignes.slice(0, 3)
    contenu = (
      <>
        {/* Le podium : le 2e à gauche, le 1er au milieu (plus haut, avec sa couronne), le 3e à droite. */}
        <div className="podium">
          {[1, 0, 2].map((rang) => {
            const ligne = podium[rang]
            if (!ligne) return <div key={rang} className={`podium-place podium-${rang + 1} podium-vide`} />
            return (
              <div key={ligne.pseudo} className={`podium-place podium-${rang + 1} ${estMoi(ligne) ? 'podium-moi' : ''}`} style={{ animationDelay: `${[200, 0, 350][rang]}ms` }}>
                {rang === 0 && (
                  <span className="podium-couronne" aria-hidden="true">
                    👑
                  </span>
                )}
                <span className="podium-medaille" aria-hidden="true">
                  {MEDAILLES[rang]}
                </span>
                <strong className="podium-pseudo">{ligne.pseudo}</strong>
                <span className="podium-argent">{dollars(ligne.argent)}</span>
                <Niveau ligne={ligne} />
                <span className="podium-socle">{rang + 1}</span>
              </div>
            )
          })}
        </div>
        <ol className="classement-liste" start={4}>
          {lignes.slice(3).map((ligne, i) => (
            <li key={ligne.pseudo} className={estMoi(ligne) ? 'classement-moi' : ''} style={{ animationDelay: `${300 + i * 40}ms` }}>
              <span className="classement-rang">{i + 4}</span>
              <span className="classement-pseudo">{ligne.pseudo}</span>
              <Niveau ligne={ligne} />
              <span className="classement-valeur">{dollars(ligne.argent)}</span>
            </li>
          ))}
        </ol>
      </>
    )
  }

  // En bas : ta place, et qui dépasser.
  // (sans compte ni argent, pas encore de place)
  const rang = place && (joueur || monArgent > 0) ? place.devant + 1 : null
  const ecart = place?.suivant ? place.suivant.argent - monArgent + 1 : 0
  return (
    <section className="carte carte-classement">
      <div className="classement-haut">
        <h2>🏆 Classement</h2>
        <span className="classement-critere" title="L'argent en poche du meilleur monde de chaque joueur, mis à jour toutes les 5 minutes">💰 Argent en poche</span>
        <button className="lien" onClick={() => setActualisation((n) => n + 1)} aria-label="Actualiser le classement">
          🔄
        </button>
      </div>
      <div className="classement-defile">{contenu}</div>

      <div className={`classement-toi ${joueur ? '' : 'classement-toi-invite'}`}>
        <span className="classement-toi-rang">{rang === null ? '?' : `#${rang}`}</span>
        <span className="classement-toi-texte">
          {joueur ? (
            <strong>Toi · {dollars(monArgent)}</strong>
          ) : (
            <strong>{monArgent > 0 ? `Avec ${dollars(monArgent)}, tu serais ${rang ?? '?'}e !` : 'Joue pour entrer dans le classement !'}</strong>
          )}
          {place?.suivant ? (
            <span>
              🔥 Encore <b>{dollars(ecart)}</b> pour dépasser <b>{place.suivant.pseudo}</b>
            </span>
          ) : rang === 1 && monArgent > 0 ? (
            <span>👑 Tu es le numéro 1 !</span>
          ) : null}
        </span>
        {!joueur && (
          <button className="bouton bouton-petit bouton-acheter" onClick={onSeConnecter}>
            Entrer
          </button>
        )}
      </div>
    </section>
  )
}
