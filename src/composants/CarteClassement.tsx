// Le classement des joueurs (leaderboard), sur l'écran d'accueil.
// (25/10) Classé à l'argent GAGNÉ en tout (stats.argentGagne, le meilleur des mondes du joueur,
// envoyé toutes les 5 minutes au plus). Le niveau de la mine est affiché à côté de chacun, mais
// il ne compte pas. Tout le monde peut le voir ; pour y apparaître, il faut un compte.
// Le top 10, une ligne chacun (les 3 premiers avec leur médaille) ; en bas, la place du joueur
// et celui qu'il doit dépasser (« encore 3 000 $ pour dépasser Jade »).
// Si le serveur ne répond pas au bout de quelques secondes : « Classement hors ligne ».

import { useEffect, useState } from 'react'
import { niveauMineAffiche, type LigneClassement } from '../jeu/classement'
import { t } from '../jeu/langue'
import { lireClassement, placeDuScore } from '../enLigne'
import type { Joueur } from '../enLigne'
import { nombreAbrege } from '../nombres'

// Le top 10.
const NB_LIGNES = 10
// Le classement se relit tout seul toutes les 5 minutes (le rythme d'envoi des scores).
const INTERVALLE_ACTUALISATION = 5 * 60 * 1000 // ms
// Au bout de ce temps sans réponse du serveur, on arrête d'attendre (ms).
const ATTENTE_MAX = 6000
const MEDAILLES = ['🥇', '🥈', '🥉']

type Props = {
  joueur: Joueur | null
  dernierEnvoi: number | null // l'heure du dernier envoi du score ; quand elle change, on relit le classement
  monArgent: number // le plus d'argent gagné dans les mondes de ce navigateur
  onSeConnecter: () => void // « Entrer » : ouvre la fenêtre du compte
}

export function CarteClassement({ joueur, dernierEnvoi, monArgent, onSeConnecter }: Props) {
  const [lignes, setLignes] = useState<LigneClassement[] | null>(null) // null = en cours de chargement
  const [horsLigne, setHorsLigne] = useState(false)
  const [place, setPlace] = useState<{ devant: number; suivant: LigneClassement | null } | null>(null)
  // Change quand on clique sur « Actualiser » : le classement est relu.
  const [actualisation, setActualisation] = useState(0)

  // Toutes les 5 minutes, on relit le classement.
  useEffect(() => {
    const minuterie = window.setInterval(() => setActualisation((n) => n + 1), INTERVALLE_ACTUALISATION)
    return () => window.clearInterval(minuterie)
  }, [])

  useEffect(() => {
    let annule = false
    let recu = false
    // Le serveur ne répond pas : on le dit au lieu de rester sur « Chargement… ».
    const attente = window.setTimeout(() => {
      if (!annule && !recu) setHorsLigne(true)
    }, ATTENTE_MAX)
    lireClassement(NB_LIGNES)
      .then((resultat) => {
        recu = true
        if (annule) return
        setLignes(resultat)
        setHorsLigne(false)
      })
      .catch(() => {
        recu = true
        if (!annule) setHorsLigne(true)
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
      clearTimeout(attente)
    }
  }, [actualisation, dernierEnvoi, monArgent, joueur])

  const estMoi = (ligne: LigneClassement) => joueur !== null && ligne.pseudo.toLowerCase() === joueur.pseudo.toLowerCase()

  let contenu
  if (horsLigne && lignes === null) contenu = <p className="classement-message">📡 {t('Classement hors ligne')}</p>
  else if (lignes === null) contenu = <p className="classement-message discret">{t('Chargement du classement…')}</p>
  else if (lignes.length === 0) contenu = <p className="classement-message discret">{t('Personne n’est encore classé : à toi d’être le premier !')}</p>
  else
    contenu = (
      <ol className="classement-liste">
        {lignes.map((ligne, i) => {
          const niveau = niveauMineAffiche(ligne)
          return (
            <li key={ligne.pseudo} className={`classement-ligne ${estMoi(ligne) ? 'classement-moi' : ''} ${i < 3 ? `classement-podium classement-${i + 1}` : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
              <span className="classement-rang">{i < 3 ? MEDAILLES[i] : `#${i + 1}`}</span>
              <span className="classement-pseudo">{ligne.pseudo}</span>
              {niveau !== null && (
                <span className="etiquette classement-mine" title={t('Le niveau de sa mine (il ne compte pas dans le classement)')}>
                  🕳️ {niveau}
                </span>
              )}
              <span className="classement-valeur">{nombreAbrege(ligne.argent)} $</span>
            </li>
          )
        })}
      </ol>
    )

  // En bas : ta place, et qui dépasser (sans compte ni argent, pas encore de place).
  const rang = place && (joueur || monArgent > 0) ? place.devant + 1 : null
  const ecart = place?.suivant ? place.suivant.argent - monArgent + 1 : 0
  return (
    <div className="classement">
      <div className="classement-haut">
        <h2>🏆 {t('Classement')}</h2>
        <span className="etiquette etiquette-vert" title={t('L’argent gagné en tout, dans le meilleur monde de chaque joueur')}>
          💵 {t('Argent gagné')}
        </span>
        <button className="btn btn-blanc btn-rond btn-petit classement-actualiser" onClick={() => setActualisation((n) => n + 1)} aria-label={t('Actualiser le classement')}>
          🔄
        </button>
      </div>
      <div className="classement-defile">{contenu}</div>

      <div className="classement-toi">
        <span className="classement-toi-rang">{rang === null ? '?' : `#${rang}`}</span>
        <span className="classement-toi-texte">
          {joueur ? (
            <strong>{t('Toi · {argent} $', { argent: nombreAbrege(monArgent) })}</strong>
          ) : (
            <strong>{monArgent > 0 ? t('Avec {argent} $, tu serais {rang}e !', { argent: nombreAbrege(monArgent), rang: rang ?? '?' }) : t('Joue pour entrer dans le classement !')}</strong>
          )}
          {place?.suivant ? (
            <span>🔥 {t('Encore {argent} $ pour dépasser {pseudo}', { argent: nombreAbrege(ecart), pseudo: place.suivant.pseudo })}</span>
          ) : rang === 1 && monArgent > 0 ? (
            <span>👑 {t('Tu es le numéro 1 !')}</span>
          ) : null}
        </span>
        {!joueur && (
          <button className="btn btn-vert btn-petit" onClick={onSeConnecter}>
            {t('Entrer')}
          </button>
        )}
      </div>
    </div>
  )
}
