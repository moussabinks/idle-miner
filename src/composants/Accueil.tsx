// L'écran d'accueil : il explique le but du jeu (avec une coupe de la mine) et
// montre les mondes (jusqu'à 5 sauvegardes). On y crée, renomme, duplique,
// supprime un monde, et on choisit sur lequel jouer. On peut aussi se connecter
// à son compte pour retrouver ses mondes sur un autre appareil.

import { useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { PROFONDEUR_BEDROCK, type IdBloc } from '../jeu/donnees'
import { creerPartie } from '../jeu/mineur'
import {
  NB_MONDES_MAX,
  charger,
  creerMonde,
  dupliquerMonde,
  listerMondes,
  renommerMonde,
  supprimerMonde,
  type InfoMonde,
} from '../jeu/sauvegarde'
import type { Compte } from '../useCompte'
import { CarteClassement } from './CarteClassement'
import { CarteCompte } from './CarteCompte'
import { Personnage } from './Personnage'

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
// L'illustration : une coupe de la mine, de l'herbe jusqu'à la bedrock
// ---------------------------------------------------------------------------

type LigneIllustration = { etiquette: string; roche: 'pierre' | 'deepslate'; blocs: (IdBloc | 'bedrock' | null)[] }

// null = déjà creusé (le puits du mineur, à gauche).
const COUPE: LigneIllustration[] = [
  { etiquette: '-2 m', roche: 'pierre', blocs: [null, 'terre', 'terre', 'gravier', 'terre', 'terre'] },
  { etiquette: '-24 m', roche: 'pierre', blocs: [null, 'pierre', 'charbon', 'pierre', 'fer', 'pierre'] },
  { etiquette: '-70 m', roche: 'pierre', blocs: [null, 'redstone', 'pierre', 'or', 'pierre', 'lapis'] },
  { etiquette: '-117 m', roche: 'deepslate', blocs: ['deepslate', 'emeraude', 'deepslate', 'diamant', 'deepslate', 'deepslate'] },
  { etiquette: '-140 m', roche: 'deepslate', blocs: ['deepslate', 'deepslate', 'debris', 'deepslate', 'lave', 'deepslate'] },
  { etiquette: '-150 m', roche: 'deepslate', blocs: ['bedrock', 'bedrock', 'bedrock', 'bedrock', 'bedrock', 'bedrock'] },
]

function IllustrationMine() {
  return (
    <div className="illustration" aria-hidden="true">
      <div className="illustration-ciel">
        <span className="illustration-soleil" />
        <span className="illustration-stand" />
      </div>
      <div className="illustration-herbe" />
      {COUPE.map((ligne, rang) => (
        <div key={ligne.etiquette} className="illustration-ligne">
          <span className="illustration-etiquette">{ligne.etiquette}</span>
          {ligne.blocs.map((bloc, colonne) =>
            bloc === null ? (
              <span key={colonne} className="illustration-case case vide">
                {/* Le mineur creuse au fond de son puits. */}
                {rang === 2 && (
                  <span className="illustration-mineur">
                    <Personnage couleurPioche="#4ee8dc" action="creuse" />
                  </span>
                )}
              </span>
            ) : (
              <span key={colonne} className={`illustration-case case bloc bloc-${bloc} roche-${ligne.roche}`} />
            ),
          )}
        </div>
      ))}
      <span className="illustration-trophee">🏆 Bedrock</span>
    </div>
  )
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

  return (
    <div className="accueil">
      <section className="accueil-heros">
        <div className="accueil-texte">
          <h1 className="titre accueil-titre">⛏️ Idle Miner</h1>
          <p className="accueil-accroche">
            Creuse, vends tes minerais, achète de meilleures pioches… et descends jusqu'à la <strong>bedrock, à -{PROFONDEUR_BEDROCK} m</strong> !
          </p>
          <ol className="accueil-etapes">
            <li>
              <span className="etape-icone">⛏️</span>
              <span>
                <strong>Creuse</strong> la mine couche par couche : charbon, fer, or, diamants…
              </span>
            </li>
            <li>
              <span className="etape-icone">💰</span>
              <span>
                <strong>Vends</strong> tes minerais au marché du village.
              </span>
            </li>
            <li>
              <span className="etape-icone">🛗</span>
              <span>
                <strong>Améliore</strong> ta pioche, ton sac et l'ascenseur, puis automatise avec la foreuse et des mineurs.
              </span>
            </li>
            <li>
              <span className="etape-icone">🏆</span>
              <span>
                <strong>Atteins la bedrock</strong> et passe prestige pour recommencer encore plus fort.
              </span>
            </li>
          </ol>
        </div>
        <IllustrationMine />
      </section>

      <section className="accueil-mondes">
        <CarteCompte compte={compte} />
        <h2>
          Choisis ton monde{' '}
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
