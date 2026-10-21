// L'écran d'accueil : le logo, un petit village vivant (la même vue du ciel que dans le jeu),
// le but du jeu en 4 cartes, et les mondes (jusqu'à 5 sauvegardes). On y crée, renomme,
// duplique, supprime un monde, et on choisit sur lequel jouer. On peut aussi se connecter à son
// compte pour retrouver ses mondes sur un autre appareil, et voir le classement.

import { useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { LISTE_BATIMENTS, PROFONDEUR_EN_PLUS_PAR_PRESTIGE, profondeurBedrock } from '../jeu/donnees'
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

// Les couleurs des cartes des mondes (une par monde, pour les reconnaître d'un coup d'œil).
const COULEURS_MONDES = ['#f2b33d', '#4a8af0', '#22b5a3', '#e85aa8', '#9b6cf0']

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

// ---------------------------------------------------------------------------
// Une carte de monde
// ---------------------------------------------------------------------------

type PropsCarte = {
  monde: InfoMonde
  dernier: boolean // le dernier monde joué
  peutDupliquer: boolean
  bloque: boolean // pendant la synchronisation avec le compte, on ne lance pas de partie
  onJouer: () => void
  onChangement: () => void // pour rafraîchir la liste après une modification
}

function CarteMonde({ monde, dernier, peutDupliquer, bloque, onJouer, onChangement }: PropsCarte) {
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
    <article className="carte carte-monde" style={{ ['--couleur-monde' as string]: COULEURS_MONDES[monde.couleur] ?? COULEURS_MONDES[0] }}>
      <div className="carte-monde-haut">
        {edition ? (
          <form
            className="carte-monde-renommer"
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
          <h3>🌍 {monde.nom}</h3>
        )}
        {dernier && <span className="badge">Dernière partie</span>}
      </div>

      {etat ? (
        <ul className="carte-monde-infos">
          <li>📏 {etat.victoire ? 'Bedrock atteinte' : `-${etat.profondeur} m`}</li>
          <li>💵 {etat.argent.toLocaleString('fr-FR')} $</li>
          <li>⭐ Prestige {etat.prestige}</li>
          <li>⛏️ {etat.stats.blocsCasses.toLocaleString('fr-FR')} blocs</li>
        </ul>
      ) : partieAncienne(window.localStorage, monde.id) ? (
        <p className="carte-monde-ancienne">🏡 Partie de l’ancienne version : elle repart de zéro dans le nouveau village vu du ciel.</p>
      ) : (
        <p className="discret">Partie illisible : elle recommencera à zéro.</p>
      )}
      <span className="discret">Joué {depuis(monde.joueLe)}</span>

      <div className="boutons">
        <button className="bouton bouton-creuser" disabled={bloque} onClick={onJouer}>
          ▶ Jouer
        </button>
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
          🗑️
        </button>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// L'écran entier
// ---------------------------------------------------------------------------

// Comment jouer, en 4 cartes (avec les dessins du jeu).
const ETAPES = [
  { image: '/images/personnages/mineur.webp', portrait: true, titre: 'Creuse', texte: 'Couche par couche : charbon, fer, or, diamants… jusqu’à la bedrock.', couleur: '#f2b33d' },
  { image: '/images/batiments/forgeron.webp', portrait: false, titre: 'Construis', texte: 'Pose le marché, la forge, le bazar… où tu veux dans la clairière, et décore ton village.', couleur: '#5cc95c' },
  { image: '/images/personnages/recruteur.webp', portrait: true, titre: 'Embauche', texte: 'Des mineurs rares, épiques… mythiques creusent et vont vendre à pied ou en wagonnet.', couleur: '#4f9df0' },
  { image: '/images/batiments/prestige.webp', portrait: false, titre: 'Prestige', texte: 'Atteins la bedrock et repars plus fort, dans une mine encore plus profonde.', couleur: '#e85aa8' },
]

export function Accueil({ compte, onJouer }: { compte: Compte; onJouer: (monde: InfoMonde) => void }) {
  // Change à chaque modification : le composant se redessine et relit la liste des mondes.
  const [, setVersion] = useState(0)
  const mondes = listerMondes(window.localStorage)
  const [nouveauNom, setNouveauNom] = useState('')
  const place = mondes.length < NB_MONDES_MAX
  // Pendant un échange avec le compte, les mondes peuvent être remplacés : on attend.
  const bloque = compte.statut === 'chargement' || compte.statut === 'synchro'

  function creer() {
    const info = creerMonde(window.localStorage, nouveauNom || `Monde ${mondes.length + 1}`, creerPartie(aleatoireNavigateur))
    if (info) onJouer(info)
  }

  // Le gros bouton du haut : reprendre le dernier monde joué, ou en créer un premier.
  const dernierMonde = mondes[0] ?? null
  const etatDernier = dernierMonde ? charger(window.localStorage, dernierMonde.id) : null

  return (
    // Sur téléphone, un joueur qui a déjà des mondes les voit en premier (voir accueil.css).
    <div className={`accueil ${mondes.length > 0 ? 'accueil-avec-mondes' : ''}`}>
      <section className="heros">
        {/* Le décor : un petit village vivant, vu du ciel comme dans le jeu. */}
        <div className="heros-scene">
          <SceneAccueil />
        </div>
        <div className="heros-voile" aria-hidden="true" />

        <div className="heros-contenu">
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
          <p className="heros-description">
            Descends jusqu’à la <strong>bedrock</strong>, bâtis ton village où tu veux dans la clairière, embauche des mineurs (rares, épiques…
            mythiques !) et passe prestige pour une mine toujours plus profonde.
          </p>

          <div className="heros-boutons">
            {dernierMonde ? (
              <button className="bouton bouton-mega" disabled={bloque} onClick={() => onJouer(dernierMonde)}>
                <span className="bouton-mega-titre">▶ Jouer</span>
                <span className="bouton-mega-detail">
                  {dernierMonde.nom}
                  {etatDernier ? ` · ⭐ ${etatDernier.prestige} · -${etatDernier.profondeur} m` : ' · nouveau village'}
                </span>
              </button>
            ) : (
              <button className="bouton bouton-mega" disabled={bloque} onClick={creer}>
                <span className="bouton-mega-titre">⛏️ Commencer</span>
                <span className="bouton-mega-detail">Ta clairière et ta mine t’attendent</span>
              </button>
            )}
            <a className="bouton bouton-mondes" href="#mondes">
              🌍 Mes mondes
            </a>
          </div>

          <ul className="heros-chiffres">
            <li>
              <strong>-{profondeurBedrock(0)} m</strong>
              <span>jusqu’à la bedrock</span>
            </li>
            <li>
              <strong>+{PROFONDEUR_EN_PLUS_PAR_PRESTIGE} m</strong>
              <span>à chaque prestige</span>
            </li>
            <li>
              <strong>{LISTE_BATIMENTS.length}</strong>
              <span>bâtiments à poser</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Comment jouer, en 4 cartes. */}
      <ol className="etapes">
        {ETAPES.map((etape, i) => (
          <li key={etape.titre} className="etape" style={{ ['--couleur-etape' as string]: etape.couleur }}>
            <span className="etape-numero">{i + 1}</span>
            <span className={`etape-image ${etape.portrait ? 'etape-portrait' : ''}`} aria-hidden="true">
              <img src={etape.image} alt="" loading="lazy" draggable={false} />
            </span>
            <strong>{etape.titre}</strong>
            <span className="discret">{etape.texte}</span>
          </li>
        ))}
      </ol>

      <section className="accueil-mondes" id="mondes">
        <CarteInstallation />
        <CarteCompte compte={compte} />
        <h2 className="titre-section">
          🌍 Tes mondes{' '}
          <span className="discret">
            ({mondes.length}/{NB_MONDES_MAX})
          </span>
        </h2>
        <div className="grille-mondes">
          {mondes.map((monde, index) => (
            <CarteMonde
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

          {/* Un nouveau monde (s'il reste de la place). */}
          {place ? (
            <form
              className="carte carte-monde carte-nouveau-monde"
              onSubmit={(e) => {
                e.preventDefault()
                creer()
              }}
            >
              <h3>✨ Nouveau monde</h3>
              <span className="discret">Une nouvelle partie, depuis le tout début.</span>
              <input
                value={nouveauNom}
                maxLength={24}
                placeholder={`Monde ${mondes.length + 1}`}
                onChange={(e) => setNouveauNom(e.target.value)}
                aria-label="Nom du nouveau monde"
              />
              <button className="bouton bouton-creuser" type="submit" disabled={bloque}>
                ⛏️ Créer et jouer
              </button>
            </form>
          ) : (
            <p className="discret">{NB_MONDES_MAX} mondes au maximum : supprime-en un pour en créer un nouveau.</p>
          )}
        </div>
      </section>

      <CarteClassement joueur={compte.joueur} dernierEnvoi={compte.envoyeeLe} />

      {/* La version en ligne (commit et date du build) : pour vérifier que Vercel est à jour. */}
      <p className="accueil-version discret">Version {__VERSION_JEU__}</p>
    </div>
  )
}
