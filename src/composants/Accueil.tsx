// L'écran d'accueil (25/10, nouveau style) : clair, coloré, avec de gros contours.
//   - au fond, le petit village vivant (la même vue du ciel que dans le jeu : l'aperçu du jeu) ;
//   - en haut, un bandeau crème : le logo, la phrase du jeu, la langue et le compte ;
//   - à gauche : le gros bouton Jouer et les mondes (jusqu'à 5 sauvegardes : on y crée,
//     renomme, duplique, supprime un monde, et on choisit sur lequel jouer) ;
//   - en bas au milieu : le jeu en 4 étapes (les mêmes que dans l'aide et le tutoriel) ;
//   - à droite : le classement.
// Sur téléphone, tout est empilé (on fait défiler) : le village en haut, puis les cartes.
// Dans la version portail (CrazyGames), pas de compte ni de classement, ni d'installation.
// (27/10) Son accueil est épuré : le bandeau s'aligne sur la carte « Jouer », et plus de numéro
// de version en bas (accueil-portail dans src/styles/accueil.css).

import { useEffect, useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { meilleurArgent } from '../jeu/classement'
import { LANGUES, NOMS_LANGUES, langue, t, type Langue } from '../jeu/langue'
import { creerPartie, type EtatJeu } from '../jeu/mineur'
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
import { choisirLangue } from '../langueNavigateur'
import { nombreAbrege } from '../nombres'
import { AVEC_COMPTES, AVEC_INSTALLATION, PORTAIL } from '../portail'
import { stockage, stockagePersistant } from '../stockage'
import type { Compte } from '../useCompte'
import { ETAPES_DU_JEU } from './etapesDuJeu'
import { CarteClassement } from './CarteClassement'
import { CarteCompte } from './CarteCompte'
import { CarteInstallation } from './CarteInstallation'
import { Confirmation } from './Confirmation'
import { Fenetre } from './Fenetre'
import { SceneAccueil } from './SceneAccueil'
import { Drapeau } from './Drapeau'

// Les couleurs des mondes (une par monde, pour les reconnaître d'un coup d'œil), en pastel.
const COULEURS_MONDES = ['#f9d65a', '#8cc8f5', '#8fe08f', '#f39aa8', '#b9a0f5']

// La place des panneaux de gauche et de droite sur grand écran (en pixels, voir
// src/styles/accueil.css) : le village se met au milieu de ce qui reste.
const MARGES_AVEC_CLASSEMENT = { gauche: 420, droite: 400 }
const MARGES_SANS_CLASSEMENT = { gauche: 420, droite: 0 }

// Si le serveur des comptes ne répond pas, on ne bloque pas les parties plus longtemps que ça (ms).
const ATTENTE_COMPTE_MAX = 8000

// « il y a 5 min », « il y a 3 h »...
function depuis(date: number): string {
  const minutes = Math.floor((Date.now() - date) / 60000)
  if (minutes < 1) return t('à l’instant')
  if (minutes < 60) return t('il y a {n} min', { n: minutes })
  const heures = Math.floor(minutes / 60)
  if (heures < 24) return t('il y a {n} h', { n: heures })
  const jours = Math.floor(heures / 24)
  return jours > 1 ? t('il y a {n} jours', { n: jours }) : t('il y a 1 jour')
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
  const [confirmer, setConfirmer] = useState(false)
  const [nom, setNom] = useState(monde.nom)
  const etat = charger(stockage, monde.id)

  function valider() {
    renommerMonde(stockage, monde.id, nom)
    setEdition(false)
    onChangement()
  }

  return (
    <li className={`accueil-monde ${dernier ? 'accueil-monde-dernier' : ''}`} style={{ ['--couleur-monde' as string]: COULEURS_MONDES[monde.couleur] ?? COULEURS_MONDES[0] }}>
      <div className="accueil-monde-haut">
        <span className="accueil-monde-pastille" aria-hidden="true">
          🌍
        </span>
        <span className="accueil-monde-texte">
          {edition ? (
            <form
              className="accueil-monde-renommer"
              onSubmit={(e) => {
                e.preventDefault()
                valider()
              }}
            >
              <input className="champ" value={nom} maxLength={24} autoFocus onChange={(e) => setNom(e.target.value)} aria-label={t('Nom du monde')} />
              <button className="btn btn-jaune btn-petit" type="submit">
                {t('OK')}
              </button>
            </form>
          ) : (
            <strong className="accueil-monde-nom">{monde.nom}</strong>
          )}
          <span className="accueil-monde-infos">
            {etat ? (
              <>
                <span>🕳️ {etat.niveauMine}</span>
                <span>💵 {nombreAbrege(etat.argent)} $</span>
                <span>👷 {etat.employes.length}</span>
              </>
            ) : partieAncienne(stockage, monde.id) ? (
              <span>{t('Ancienne version : repart de zéro')}</span>
            ) : (
              <span>{t('Partie illisible : repart de zéro')}</span>
            )}
            <span className="accueil-monde-date">{depuis(monde.joueLe)}</span>
          </span>
        </span>
        <button className="btn btn-blanc btn-rond accueil-monde-plus" onClick={() => setOuvert(!ouvert)} aria-label={t('Réglages du monde')} aria-expanded={ouvert}>
          ⋯
        </button>
        <button className="btn btn-jaune btn-rond" disabled={bloque} onClick={onJouer} aria-label={t('Jouer à {nom}', { nom: monde.nom })}>
          ▶
        </button>
      </div>
      {ouvert && (
        <div className="accueil-monde-actions">
          <button className="btn btn-blanc btn-petit" onClick={() => setEdition(!edition)}>
            ✏️ {t('Renommer')}
          </button>
          <button
            className="btn btn-vert btn-petit"
            disabled={!peutDupliquer}
            title={peutDupliquer ? t('Faire une copie de ce monde') : t('{n} mondes au maximum', { n: NB_MONDES_MAX })}
            onClick={() => {
              dupliquerMonde(stockage, monde.id)
              onChangement()
            }}
          >
            📄 {t('Dupliquer')}
          </button>
          <button className="btn btn-rose btn-petit" onClick={() => setConfirmer(true)}>
            🗑️ {t('Supprimer')}
          </button>
        </div>
      )}
      {confirmer && (
        <Confirmation
          titre={t('Supprimer ce monde ?')}
          danger
          texteConfirmer={t('Supprimer')}
          onAnnuler={() => setConfirmer(false)}
          onConfirmer={() => {
            setConfirmer(false)
            supprimerMonde(stockage, monde.id)
            onChangement()
          }}
        >
          {t('Le monde « {nom} » sera perdu pour toujours.', { nom: monde.nom })}
        </Confirmation>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Le choix de la langue : deux pilules
// ---------------------------------------------------------------------------

function ChoixLangue({ onLangue }: { onLangue: (l: Langue) => void }) {
  return (
    <div className="onglets accueil-langues" role="group" aria-label={t('Langue')}>
      {LANGUES.map((l) => (
        <button
          key={l}
          className={`onglet ${langue() === l ? 'actif' : ''}`}
          aria-pressed={langue() === l}
          onClick={() => {
            choisirLangue(l)
            onLangue(l)
          }}
        >
          <Drapeau langue={l} /> {NOMS_LANGUES[l]}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// L'écran entier
// ---------------------------------------------------------------------------

type Props = {
  compte: Compte
  onJouer: (monde: InfoMonde) => void
  onLangue: (langue: Langue) => void // pour redessiner tout le jeu dans la nouvelle langue
  onVisiter: (pseudo: string, partie: EtatJeu) => void // (26/10) visiter le village d'un joueur du classement
}

export function Accueil({ compte, onJouer, onLangue, onVisiter }: Props) {
  // Change à chaque modification : le composant se redessine et relit la liste des mondes.
  const [, setVersion] = useState(0)
  const mondes = listerMondes(stockage)
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouveauOuvert, setNouveauOuvert] = useState(false)
  const [compteOuvert, setCompteOuvert] = useState(false)
  // Le serveur des comptes met trop longtemps à répondre : on laisse jouer quand même.
  const [attenteFinie, setAttenteFinie] = useState(false)
  useEffect(() => {
    const minuteur = window.setTimeout(() => setAttenteFinie(true), ATTENTE_COMPTE_MAX)
    return () => clearTimeout(minuteur)
  }, [])
  const place = mondes.length < NB_MONDES_MAX
  // Pendant un échange avec le compte, les mondes peuvent être remplacés : on attend.
  const bloque = AVEC_COMPTES && (compte.statut === 'synchro' || (compte.statut === 'chargement' && !attenteFinie))

  function creer() {
    const info = creerMonde(stockage, nouveauNom || t('Monde {n}', { n: mondes.length + 1 }), creerPartie(aleatoireNavigateur))
    if (info) onJouer(info)
  }

  // Le gros bouton : reprendre le dernier monde joué, ou en créer un premier.
  const dernierMonde = mondes[0] ?? null
  const etatDernier = dernierMonde ? charger(stockage, dernierMonde.id) : null
  // Le meilleur argent gagné dans ces mondes : la place qu'on aurait au classement.
  const monArgent = meilleurArgent(mondes.map((m) => charger(stockage, m.id)))

  return (
    <div className={`accueil ${AVEC_COMPTES ? '' : 'accueil-sans-classement'} ${PORTAIL ? 'accueil-portail' : ''}`}>
      {/* Au fond : le petit village vivant, vu du ciel comme dans le jeu. */}
      <div className="accueil-scene">
        <SceneAccueil marges={AVEC_COMPTES ? MARGES_AVEC_CLASSEMENT : MARGES_SANS_CLASSEMENT} />
      </div>

      {/* En haut : le bandeau crème. */}
      <header className="accueil-bandeau">
        <span className="accueil-logo-icone" aria-hidden="true">
          ⛏️
        </span>
        <div className="accueil-logo-texte">
          <h1 className="accueil-logo">Mega Digger</h1>
          <p className="accueil-accroche">{t('Creuse jusqu’au cœur de diamant. Embauche. Automatise.')}</p>
        </div>
        <div className="accueil-bandeau-droite">
          <ChoixLangue onLangue={onLangue} />
          {AVEC_COMPTES && (
            <button className="btn btn-blanc btn-petit accueil-compte" onClick={() => setCompteOuvert(true)}>
              👤 {compte.joueur ? compte.joueur.pseudo : t('Mon compte')}
            </button>
          )}
        </div>
      </header>

      <div className="accueil-contenu">
        {/* À gauche : Jouer et les mondes. */}
        <section className="accueil-panneau accueil-jouer">
          {dernierMonde ? (
            <button className="btn btn-jaune btn-grand btn-large accueil-gros-bouton" disabled={bloque} onClick={() => onJouer(dernierMonde)}>
              <span>▶ {t('Jouer')}</span>
              <small>
                {dernierMonde.nom}
                {etatDernier ? ` · 🕳️ ${t('niveau {n}', { n: etatDernier.niveauMine })} · ${nombreAbrege(etatDernier.argent)} $` : ''}
              </small>
            </button>
          ) : (
            <>
              {/* Un nouveau joueur : le jeu en 4 étapes, puis Commencer. */}
              <ol className="accueil-etapes-liste">
                {ETAPES_DU_JEU.map((e, i) => (
                  <li key={e.titre}>
                    <span className="accueil-etape-numero">{i + 1}</span>
                    <span className="accueil-etape-icone" aria-hidden="true">
                      {e.icone}
                    </span>
                    <span>
                      <strong>{t(e.titre)}</strong>
                      <span className="discret">{t(e.texte)}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <button className="btn btn-jaune btn-grand btn-large accueil-gros-bouton" disabled={bloque} onClick={creer}>
                <span>⛏️ {t('Commencer')}</span>
                <small>{t('Pépite la taupe te guide pas à pas')}</small>
              </button>
            </>
          )}

          {mondes.length > 0 && (
            <>
              <h2 className="titre-section accueil-titre-mondes">
                {t('Tes mondes')} <span className="etiquette">{mondes.length} / {NB_MONDES_MAX}</span>
              </h2>
              <ul className="accueil-mondes">
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
                    className="accueil-nouveau"
                    onSubmit={(e) => {
                      e.preventDefault()
                      creer()
                    }}
                  >
                    <input
                      className="champ"
                      value={nouveauNom}
                      maxLength={24}
                      autoFocus
                      placeholder={t('Monde {n}', { n: mondes.length + 1 })}
                      onChange={(e) => setNouveauNom(e.target.value)}
                      aria-label={t('Nom du nouveau monde')}
                    />
                    <button className="btn btn-vert" type="submit" disabled={bloque}>
                      {t('Créer')}
                    </button>
                  </form>
                ) : (
                  <button className="btn btn-vert btn-large" onClick={() => setNouveauOuvert(true)}>
                    ✨ {t('Nouveau monde')}
                  </button>
                )
              ) : (
                <p className="discret">{t('{n} mondes au maximum : supprime-en un pour en créer un nouveau.', { n: NB_MONDES_MAX })}</p>
              )}
            </>
          )}
          {AVEC_INSTALLATION && <CarteInstallation />}
        </section>

        {/* À droite : le classement. */}
        {AVEC_COMPTES && (
          <section className="accueil-panneau accueil-classement">
            <CarteClassement joueur={compte.joueur} dernierEnvoi={compte.envoyeeLe} monArgent={monArgent} onSeConnecter={() => setCompteOuvert(true)} onVisiter={onVisiter} />
          </section>
        )}
      </div>

      {/* En bas au milieu : le jeu en 4 étapes (pour ceux qui ont déjà un monde). */}
      {mondes.length > 0 && (
        <ol className="accueil-etapes" aria-label={t('Comment jouer')}>
          {ETAPES_DU_JEU.map((e, i) => (
            <li key={e.titre} title={`${i + 1}. ${t(e.texte)}`}>
              <span className="accueil-etape-icone" aria-hidden="true">
                {e.icone}
              </span>
              <strong>{t(e.titre)}</strong>
            </li>
          ))}
        </ol>
      )}

      {/* La version en ligne (commit et date du build) : pour vérifier que Vercel est à jour.
          (27/10) Pas sur CrazyGames : seulement l'avertissement, s'il y a lieu. */}
      {(!PORTAIL || !stockagePersistant) && (
        <p className="accueil-version">
          {/* Le navigateur refuse la sauvegarde (navigation privée, site dans un cadre...) : on prévient. */}
          {!stockagePersistant && <strong className="accueil-sans-sauvegarde">⚠️ {t('Ce navigateur ne garde pas les parties : elles seront perdues en fermant la page.')} </strong>}
          {!PORTAIL && t('Version {v}', { v: __VERSION_JEU__ })}
        </p>
      )}

      {compteOuvert && AVEC_COMPTES && (
        <Fenetre titre={t('Ton compte')} icone="👤" couleur="bleu" taille="petite" onFermer={() => setCompteOuvert(false)}>
          <CarteCompte compte={compte} />
        </Fenetre>
      )}
    </div>
  )
}
