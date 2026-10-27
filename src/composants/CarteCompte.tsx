// Le compte (facultatif), dans la fenêtre « Ton compte » de l'écran d'accueil : se connecter ou
// créer un compte avec un pseudo, pour retrouver ses mondes sur n'importe quel appareil.

import { useState } from 'react'
import { PSEUDO_MAX } from '../jeu/compte'
import { formatLangue, t } from '../jeu/langue'
import type { Compte } from '../useCompte'

// « 14:05 » aujourd'hui, sinon « 18/10 à 14:05 ».
function heure(date: number): string {
  const format = formatLangue()
  const jour = new Date(date)
  const texte = jour.toLocaleTimeString(format, { hour: '2-digit', minute: '2-digit' })
  if (jour.toDateString() === new Date().toDateString()) return texte
  return t('{jour} à {heure}', { jour: jour.toLocaleDateString(format, { day: '2-digit', month: '2-digit' }), heure: texte })
}

export function CarteCompte({ compte }: { compte: Compte }) {
  const [pseudo, setPseudo] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function valider(nouveauCompte: boolean) {
    setEnCours(true)
    setErreur(null)
    const probleme = await compte.connecter(pseudo, motDePasse, nouveauCompte)
    setEnCours(false)
    setErreur(probleme)
    if (probleme === null) setMotDePasse('')
  }

  if (compte.statut === 'chargement') {
    return <p className="discret">☁️ {t('Recherche de ton compte…')}</p>
  }

  // Connecté : le pseudo, l'état de la sauvegarde en ligne et la déconnexion.
  if (compte.joueur) {
    let etatSauvegarde = t('Tes mondes sont sauvegardés en ligne.')
    if (compte.statut === 'synchro') etatSauvegarde = t('Synchronisation de tes mondes…')
    else if (compte.statut === 'hors-ligne') etatSauvegarde = t('Serveur injoignable : tes mondes restent dans ce navigateur, on réessaie tout seul.')
    else if (compte.envoyeeLe) etatSauvegarde = t('Mondes sauvegardés en ligne (dernier envoi : {heure}).', { heure: heure(compte.envoyeeLe) })

    return (
      <div className="compte">
        <div className="carte compte-connecte">
          <span className="compte-avatar" aria-hidden="true">
            👤
          </span>
          <span className="compte-texte">
            <strong>{compte.joueur.pseudo}</strong>
            <span className={compte.statut === 'hors-ligne' ? 'texte-alerte' : 'discret'}>
              {compte.statut === 'hors-ligne' ? '⚠️' : '☁️'} {etatSauvegarde}
            </span>
          </span>
        </div>
        <button className="btn btn-blanc" onClick={() => void compte.deconnecter()}>
          {t('Se déconnecter')}
        </button>
      </div>
    )
  }

  // Pas connecté : le formulaire (le même pour se connecter et pour créer un compte).
  return (
    <form
      className="compte"
      onSubmit={(e) => {
        e.preventDefault()
        void valider(false)
      }}
    >
      <p className="discret">{t('Facultatif : pour retrouver tes mondes sur un autre appareil, et entrer au classement.')}</p>
      <input
        className="champ"
        value={pseudo}
        maxLength={PSEUDO_MAX}
        placeholder={t('Pseudo')}
        autoComplete="username"
        aria-label={t('Pseudo')}
        onChange={(e) => setPseudo(e.target.value)}
      />
      <input
        className="champ"
        type="password"
        value={motDePasse}
        placeholder={t('Mot de passe')}
        autoComplete="current-password"
        aria-label={t('Mot de passe')}
        onChange={(e) => setMotDePasse(e.target.value)}
      />
      {erreur && <p className="texte-alerte">{erreur}</p>}
      <div className="compte-boutons">
        <button className="btn btn-jaune" type="submit" disabled={enCours}>
          {t('Se connecter')}
        </button>
        <button className="btn btn-vert" type="button" disabled={enCours} onClick={() => void valider(true)}>
          {t('Créer un compte')}
        </button>
      </div>
      <p className="discret compte-note">⚠️ {t('Il n’y a pas d’email : un mot de passe oublié ne peut pas être récupéré.')}</p>
    </form>
  )
}
