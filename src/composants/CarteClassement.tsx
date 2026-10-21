// Le classement des joueurs (leaderboard), sur l'écran d'accueil.
// Deux onglets : au niveau de la mine (gardé dans la colonne « prestige » du serveur) et à
// l'argent gagné. Tout le monde peut le voir ;
// pour y apparaître, il faut un compte (le score part avec la sauvegarde en ligne).

import { useEffect, useState } from 'react'
import type { LigneClassement, TriClassement } from '../jeu/classement'
import { lireClassement } from '../enLigne'
import type { Joueur } from '../enLigne'

const NB_LIGNES = 20
const MEDAILLES = ['🥇', '🥈', '🥉']

// dernierEnvoi : l'heure du dernier envoi du score du joueur ; quand elle change, on relit le classement.
export function CarteClassement({ joueur, dernierEnvoi }: { joueur: Joueur | null; dernierEnvoi: number | null }) {
  const [tri, setTri] = useState<TriClassement>('prestige')
  const [lignes, setLignes] = useState<LigneClassement[] | null>(null) // null = en cours de chargement
  const [erreur, setErreur] = useState(false)
  // Change quand on clique sur « Actualiser » : le classement est relu.
  const [actualisation, setActualisation] = useState(0)

  useEffect(() => {
    let annule = false // si on change d'onglet avant la réponse, on ignore l'ancienne
    lireClassement(tri, NB_LIGNES)
      .then((resultat) => {
        if (annule) return
        setLignes(resultat)
        setErreur(false)
      })
      .catch(() => {
        if (!annule) setErreur(true)
      })
    return () => {
      annule = true
    }
  }, [tri, actualisation, dernierEnvoi])

  function changerTri(nouveau: TriClassement) {
    if (nouveau === tri) return
    setLignes(null)
    setTri(nouveau)
  }

  let contenu
  if (erreur) contenu = <p className="manque">Impossible de charger le classement. Vérifie ta connexion.</p>
  else if (lignes === null) contenu = <p className="discret">Chargement du classement…</p>
  else if (lignes.length === 0) contenu = <p className="discret">Personne n'est encore classé : à toi d'être le premier !</p>
  else
    contenu = (
      <ol className="classement-liste">
        {lignes.map((ligne, rang) => (
          <li key={ligne.pseudo} className={joueur && ligne.pseudo.toLowerCase() === joueur.pseudo.toLowerCase() ? 'classement-moi' : ''}>
            <span className="classement-rang">{MEDAILLES[rang] ?? `${rang + 1}.`}</span>
            <span className="classement-pseudo">{ligne.pseudo}</span>
            <span className={tri === 'prestige' ? 'classement-valeur' : 'classement-autre'}>🕳️ {ligne.prestige}</span>
            <span className={tri === 'argent' ? 'classement-valeur' : 'classement-autre'}>💰 {ligne.argent.toLocaleString('fr-FR')} $</span>
          </li>
        ))}
      </ol>
    )

  return (
    <section className="carte carte-classement">
      <div className="classement-haut">
        <h2>🏆 Classement</h2>
        <nav className="onglets classement-onglets" role="tablist">
          <button role="tab" aria-selected={tri === 'prestige'} className={`onglet ${tri === 'prestige' ? 'actif' : ''}`} onClick={() => changerTri('prestige')}>
            🕳️ Niveau de mine
          </button>
          <button role="tab" aria-selected={tri === 'argent'} className={`onglet ${tri === 'argent' ? 'actif' : ''}`} onClick={() => changerTri('argent')}>
            💰 Argent
          </button>
        </nav>
        <button className="lien" onClick={() => setActualisation((n) => n + 1)}>
          Actualiser
        </button>
      </div>
      <p className="discret classement-explication">
        {tri === 'prestige' ? 'Le plus bas niveau de mine atteint' : "Tout l'argent gagné dans la partie"} (le meilleur de tes
        mondes).{joueur ? '' : ' Connecte-toi pour apparaître dans le classement.'}
      </p>
      {contenu}
    </section>
  )
}
