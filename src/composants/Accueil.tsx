// L'écran d'accueil, en plein écran (23/10) : tout tient sans faire défiler.
//   - au fond, le petit village vivant (la même vue du ciel que dans le jeu : l'aperçu du jeu) ;
//   - à gauche : le logo, le gros bouton Jouer et les mondes (jusqu'à 5 sauvegardes : on y crée,
//     renomme, duplique, supprime un monde, et on choisit sur lequel jouer) ;
//   - au milieu, en bas : le jeu en 4 étapes ;
//   - à droite : le compte (pour retrouver ses mondes sur un autre appareil) et le classement.
// Sur téléphone, une barre d'onglets en bas : Jouer, Classement, Compte.

import { useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { meilleurArgent } from '../jeu/classement'
import { creerPartie } from '../jeu/mineur'
import {
  NB_MONDES_MAX,
  charger,
  creerMonde,
  dupliquerMonde,
  listerMondes,
  partieAncienne,
  renommerMonde,
  supprimerMonde,
  type InfoMonde,
} from '../jeu/sauvegarde'
import type { Compte } from '../useCompte'
import { CarteClassement } from './CarteClassement'
import { CarteCompte } from './CarteCompte'
import { CarteInstallation } from './CarteInstallation'
import { SceneAccueil } from './SceneAccueil'

// Les couleurs des mondes (une par monde, pour les reconnaître d'un coup d'œil).
const COULEURS_MONDES = ['#f2b33d', '#4a8af0', '#22b5a3', '#e85aa8', '#9b6cf0']

// La place des panneaux de gauche et de droite sur grand écran (en pixels, voir accueil.css) :
// le village se met au milieu de ce qui reste.
const MARGES_SCENE = { gauche: 400, droite: 420 }

// « il y a 5 min », « il y a 3 h »...
function depuis(date: number): string {
  const minutes = Math.floor((Date.now() - date) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.floor(heures / 24)
  return `il y a ${jours} jour${jours > 1 ? 's' : ''}`
}

// « 12 500 $ », « 3,5 k$ »
function argentCourt(n: number): string {
  const v = Math.floor(n)
  if (v < 10_000) return `${v.toLocaleString('fr-FR')} $`
  if (v < 1_000_000) return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k$`
  return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M$`
}

// ---------------------------------------------------------------------------
// Un monde : une ligne (nom, niveau, argent, ▶), et ses réglages en la dépliant (⋯)
// ---------------------------------------------------------------------------

type PropsMonde = {
  monde: InfoMonde
  dernier: boolean // le dernier monde joué
  peutDupliquer: boolean
  bloque: boolean // pendant la synchronisation avec le compte, on ne lance pas de partie
  onJouer: () => void
  onChangement: () => void // pour rafraîchir la liste après une modification
}

function LigneMonde({ monde, dernier, peutDupliquer, bloque, onJouer, onChangement }: PropsMonde) {
  const [ouvert, setOuvert] = useState(false)
  const [edition, setEdition] = useState(false)
  const [nom, setNom] = useState(monde.nom)
  const etat = charger(window.localStorage, monde.id)

  function valider() {
    renommerMonde(window.localStorage, monde.id, nom)
    setEdition(false)
    onChangement()
  }

  function supprimer() {
    if (window.confirm(`Supprimer le monde « ${monde.nom} » ? Sa partie sera perdue pour toujours.`)) {
      supprimerMonde(window.localStorage, monde.id)
      onChangement()
    }
  }

  return (
    <li className={`ligne-monde ${dernier ? 'ligne-monde-dernier' : ''} ${ouvert ? 'ligne-monde-ouverte' : ''}`} style={{ ['--couleur-monde' as string]: COULEURS_MONDES[monde.couleur] ?? COULEURS_MONDES[0] }}>
      <div className="ligne-monde-haut">
        <span className="ligne-monde-pastille" aria-hidden="true">
          🌍
        </span>
        <span className="ligne-monde-texte">
          {edition ? (
            <form
              className="ligne-monde-renommer"
              onSubmit={(e) => {
                e.preventDefault()
                valider()
              }}
            >
              <input value={nom} maxLength={24} autoFocus onChange={(e) => setNom(e.target.value)} aria-label="Nom du monde" />
              <button className="bouton bouton-petit bouton-ameliorer" type="submit">
                OK
              </button>
            </form>
          ) : (
            <strong>{monde.nom}</strong>
          )}
          <span className="ligne-monde-infos">
            {etat ? (
              <>
                <span>🕳️ {etat.niveauMine}</span>
                <span>💵 {argentCourt(etat.argent)}</span>
                <span>👷 {etat.employes.length}</span>
              </>
            ) : partieAncienne(window.localStorage, monde.id) ? (
              <span>🏡 ancienne version : repart de zéro</span>
            ) : (
              <span>partie illisible : repart de zéro</span>
            )}
            <span className="ligne-monde-date">{depuis(monde.joueLe)}</span>
          </span>
        </span>
        <button className="lien ligne-monde-plus" onClick={() => setOuvert(!ouvert)} aria-label="Réglages du monde" aria-expanded={ouvert}>
          ⋯
        </button>
        <button className="bouton bouton-petit bouton-creuser ligne-monde-jouer" disabled={bloque} onClick={onJouer} aria-label={`Jouer à ${monde.nom}`}>
          ▶
        </button>
      </div>
      {ouvert && (
        <div className="ligne-monde-actions">
          <button className="bouton bouton-petit bouton-neutre" onClick={() => setEdition(!edition)}>
            ✏️ Renommer
          </button>
          <button
            className="bouton bouton-petit bouton-acheter"
            disabled={!peutDupliquer}
            title={peutDupliquer ? 'Faire une copie de ce monde' : `${NB_MONDES_MAX} mondes au maximum`}
            onClick={() => {
              dupliquerMonde(window.localStorage, monde.id)
              onChangement()
            }}
          >
            📄 Dupliquer
          </button>
          <button className="bouton bouton-petit bouton-stop" onClick={supprimer}>
            🗑️ Supprimer
          </button>
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// L'écran entier
// ---------------------------------------------------------------------------

// Comment jouer, en 4 cartes (avec les dessins du jeu).
const ETAPES = [
  { image: '/images/personnages/mineur.webp', portrait: true, titre: 'Creuse', texte: 'Clique sur le bloc de la mine : charbon, fer, redstone, or, émeraudes, diamants…', couleur: '#f2b33d' },
  { image: '/images/batiments/forgeron.webp', portrait: false, titre: 'Construis', texte: 'Pose le marché, la forge, le bazar… où tu veux dans la clairière, et relie-les par des rails.', couleur: '#5cc95c' },
  { image: '/images/personnages/recruteur.webp', portrait: true, titre: 'Embauche', texte: 'Des mineurs rares, épiques… mythiques creusent pour toi et remplissent le coffre de la mine.', couleur: '#4f9df0' },
  { image: '/images/batiments/generateur.webp', portrait: false, titre: 'Automatise', texte: 'Relie la mine au marché avec des rails, et électrifie-les avec le générateur : l’argent tombe tout seul !', couleur: '#e85aa8' },
]

type OngletTelephone = 'jouer' | 'classement' | 'compte'

export function Accueil({ compte, onJouer }: { compte: Compte; onJouer: (monde: InfoMonde) => void }) {
  // Change à chaque modification : le composant se redessine et relit la liste des mondes.
  const [, setVersion] = useState(0)
  const mondes = listerMondes(window.localStorage)
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouveauOuvert, setNouveauOuvert] = useState(false)
  // Sur téléphone, on voit un panneau à la fois (la barre d'onglets en bas).
  const [onglet, setOnglet] = useState<OngletTelephone>('jouer')
  const place = mondes.length < NB_MONDES_MAX
  // Pendant un échange avec le compte, les mondes peuvent être remplacés : on attend.
  const bloque = compte.statut === 'chargement' || compte.statut === 'synchro'

  function creer() {
    const info = creerMonde(window.localStorage, nouveauNom || `Monde ${mondes.length + 1}`, creerPartie(aleatoireNavigateur))
    if (info) onJouer(info)
  }

  // Le gros bouton : reprendre le dernier monde joué, ou en créer un premier.
  const dernierMonde = mondes[0] ?? null
  const etatDernier = dernierMonde ? charger(window.localStorage, dernierMonde.id) : null
  // Le meilleur argent gagné dans ces mondes : la place qu'on aurait au classement.
  const monArgent = meilleurArgent(mondes.map((m) => charger(window.localStorage, m.id)))

  // « Entrer » au classement : on montre le formulaire du compte, prêt à remplir.
  function montrerCompte() {
    setOnglet('compte')
    window.setTimeout(() => document.querySelector<HTMLInputElement>('.carte-compte input')?.focus(), 50)
  }

  return (
    <div className={`accueil menu-plein-ecran menu-onglet-${onglet}`}>
      {/* Au fond : le petit village vivant, vu du ciel comme dans le jeu. */}
      <div className="menu-scene">
        <SceneAccueil marges={MARGES_SCENE} />
      </div>
      <div className="menu-voile" aria-hidden="true" />

      {/* À gauche : le logo, Jouer, les mondes. */}
      <aside className="menu-gauche menu-panneau-jouer">
        <h1 className="logo" aria-label="Mega Digger">
          <span className="logo-panneau">
            <span className="logo-mots">
              <span className="logo-mega">MEGA</span>
              <span className="logo-digger">DIGGER</span>
            </span>
          </span>
          {/* Le hamster du joueur, sa pioche à la main, à côté du panneau. */}
          <img className="logo-hamster" src="/images/personnages/sprites/joueur_droite.webp" alt="" aria-hidden="true" draggable={false} />
        </h1>
        <p className="heros-accroche">
          Creuse. Construis. <strong>Deviens riche.</strong>
        </p>

        {dernierMonde ? (
          <button className="bouton bouton-mega" disabled={bloque} onClick={() => onJouer(dernierMonde)}>
            <span className="bouton-mega-titre">▶ Jouer</span>
            <span className="bouton-mega-detail">
              {dernierMonde.nom}
              {etatDernier ? ` · 🕳️ niveau ${etatDernier.niveauMine} · ${argentCourt(etatDernier.argent)}` : ' · nouveau village'}
            </span>
          </button>
        ) : (
          <button className="bouton bouton-mega" disabled={bloque} onClick={creer}>
            <span className="bouton-mega-titre">⛏️ Commencer</span>
            <span className="bouton-mega-detail">Pépite te guide pas à pas</span>
          </button>
        )}

        {/* Un nouveau joueur : le jeu en quelques mots. */}
        {mondes.length === 0 && (
          <p className="heros-description menu-description">
            Creuse ta mine jusqu’au <strong>cœur de diamant</strong>, bâtis ton village où tu veux dans la clairière, embauche des mineurs (rares,
            épiques… mythiques !) et relie tout avec des rails électriques.
          </p>
        )}

        {mondes.length > 0 && (
          <section className="menu-mondes">
            <h2 className="menu-titre">
              🌍 Tes mondes <span>{mondes.length}/{NB_MONDES_MAX}</span>
            </h2>
            <ul className="liste-mondes">
              {mondes.map((monde, index) => (
                <LigneMonde
                  // La version change quand les mondes du compte remplacent ceux du navigateur.
                  key={`${compte.versionMondes}-${monde.id}`}
                  monde={monde}
                  dernier={index === 0}
                  peutDupliquer={place}
                  bloque={bloque}
                  onJouer={() => onJouer(monde)}
                  onChangement={() => setVersion((v) => v + 1)}
                />
              ))}
            </ul>
            {/* Un nouveau monde (s'il reste de la place) : un bouton, puis son nom. */}
            {place ? (
              nouveauOuvert ? (
                <form
                  className="nouveau-monde"
                  onSubmit={(e) => {
                    e.preventDefault()
                    creer()
                  }}
                >
                  <input
                    value={nouveauNom}
                    maxLength={24}
                    autoFocus
                    placeholder={`Monde ${mondes.length + 1}`}
                    onChange={(e) => setNouveauNom(e.target.value)}
                    aria-label="Nom du nouveau monde"
                  />
                  <button className="bouton bouton-petit bouton-creuser" type="submit" disabled={bloque}>
                    ⛏️ Créer
                  </button>
                </form>
              ) : (
                <button className="bouton bouton-petit bouton-acheter nouveau-monde-bouton" onClick={() => setNouveauOuvert(true)}>
                  ✨ Nouveau monde
                </button>
              )
            ) : (
              <p className="discret menu-note">{NB_MONDES_MAX} mondes au maximum : supprime-en un pour en créer un nouveau.</p>
            )}
          </section>
        )}
        <CarteInstallation />
      </aside>

      {/* Au milieu, en bas : le jeu en 4 étapes (sur le village). */}
      <ol className="menu-etapes">
        {ETAPES.map((etape, i) => (
          <li key={etape.titre} className="menu-etape" style={{ ['--couleur-etape' as string]: etape.couleur, animationDelay: `${i * 120}ms` }} title={etape.texte}>
            <span className={`menu-etape-image ${etape.portrait ? 'etape-portrait' : ''}`} aria-hidden="true">
              <img src={etape.image} alt="" draggable={false} />
            </span>
            <strong>
              {i + 1}. {etape.titre}
            </strong>
          </li>
        ))}
      </ol>

      {/* À droite : le compte, puis le classement. */}
      <aside className="menu-droite">
        <div className="menu-panneau-compte">
          <CarteCompte compte={compte} />
        </div>
        <div className="menu-panneau-classement">
          <CarteClassement joueur={compte.joueur} dernierEnvoi={compte.envoyeeLe} monArgent={monArgent} onSeConnecter={montrerCompte} />
        </div>
      </aside>

      {/* Sur téléphone : un onglet à la fois. */}
      <nav className="menu-onglets" aria-label="Menu">
        {(
          [
            ['jouer', '⛏️', 'Jouer'],
            ['classement', '🏆', 'Classement'],
            ['compte', '👤', 'Compte'],
          ] as const
        ).map(([id, icone, nom]) => (
          <button key={id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)} aria-pressed={onglet === id}>
            <span aria-hidden="true">{icone}</span>
            {nom}
          </button>
        ))}
      </nav>

      {/* La version en ligne (commit et date du build) : pour vérifier que Vercel est à jour. */}
      <p className="accueil-version discret">Version {__VERSION_JEU__}</p>
    </div>
  )
}
