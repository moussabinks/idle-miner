// La carte du compte, sur l'écran d'accueil : se connecter ou créer un compte avec un pseudo,
// pour retrouver ses mondes sur n'importe quel appareil. Le compte est facultatif.

import { useState } from 'react'
import { PSEUDO_MAX } from '../jeu/compte'
import type { Compte } from '../useCompte'

// « 14:05 » aujourd'hui, sinon « 18/10 à 14:05 ».
function heure(date: number): string {
  const jour = new Date(date)
  const texte = jour.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (jour.toDateString() === new Date().toDateString()) return texte
  return `${jour.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à ${texte}`
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
    return <section className="carte carte-compte discret">☁️ Recherche de ton compte…</section>
  }

  // Connecté : le pseudo, l'état de la sauvegarde en ligne et la déconnexion.
  if (compte.joueur) {
    let etatSauvegarde = '☁️ Tes mondes sont sauvegardés en ligne.'
    if (compte.statut === 'synchro') etatSauvegarde = '☁️ Synchronisation de tes mondes…'
    else if (compte.statut === 'hors-ligne') etatSauvegarde = '⚠️ Serveur injoignable : tes mondes restent dans ce navigateur, on réessaie tout seul.'
    else if (compte.envoyeeLe) etatSauvegarde = `☁️ Mondes sauvegardés en ligne (dernier envoi : ${heure(compte.envoyeeLe)}).`

    return (
      <section className="carte carte-compte">
        <div className="carte-compte-connecte">
          <strong>👤 {compte.joueur.pseudo}</strong>
          <span className={compte.statut === 'hors-ligne' ? 'manque' : 'discret'}>{etatSauvegarde}</span>
          <button className="lien" onClick={() => void compte.deconnecter()}>
            Se déconnecter
          </button>
        </div>
      </section>
    )
  }

  // Pas connecté : le formulaire (le même pour se connecter et pour créer un compte).
  return (
    <section className="carte carte-compte">
      <form
        className="carte-compte-formulaire"
        onSubmit={(e) => {
          e.preventDefault()
          void valider(false)
        }}
      >
        <div className="carte-compte-texte">
          <strong>👤 Ton compte</strong>
          <span className="discret">Facultatif : pour retrouver tes mondes sur un autre appareil.</span>
        </div>
        <input
          value={pseudo}
          maxLength={PSEUDO_MAX}
          placeholder="Pseudo"
          autoComplete="username"
          aria-label="Pseudo"
          onChange={(e) => setPseudo(e.target.value)}
        />
        <input
          type="password"
          value={motDePasse}
          placeholder="Mot de passe"
          autoComplete="current-password"
          aria-label="Mot de passe"
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <button className="bouton bouton-petit bouton-creuser" type="submit" disabled={enCours}>
          Se connecter
        </button>
        <button className="bouton bouton-petit bouton-acheter" type="button" disabled={enCours} onClick={() => void valider(true)}>
          Créer un compte
        </button>
      </form>
      {erreur && <p className="manque carte-compte-erreur">{erreur}</p>}
      <p className="discret carte-compte-erreur">⚠️ Il n'y a pas d'email : un mot de passe oublié ne peut pas être récupéré.</p>
    </section>
  )
}
