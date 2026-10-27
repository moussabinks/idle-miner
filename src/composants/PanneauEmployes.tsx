// Le Personnel (refait le 25/10, avec le nouveau style). Trois onglets :
//   - Équipe : les salaires, puis une carte par employé (ses chiffres, ses améliorations, et
//     « Payer » / « Licencier ») ;
//   - Embaucher : un mineur (il creuse tout seul au fond de la mine ; l'ascenseur remonte ce
//     qu'il casse dans le coffre), ou un pousseur pour un trajet de wagonnet (le trajet brille
//     sur la carte pendant qu'on le choisit) ;
//   - (26/10) les joailliers, à la joaillerie (niveau 6 de la mine) : ils taillent les gemmes ;
//   - Chefs : le manager (palier 3 de la mine : il paie les salaires avec ton argent) et le
//     recruteur (palier 4 : chaque embauche a une rareté tirée au hasard).
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu/employes.ts.

import { useEffect, useRef, useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import {
  BLOCS,
  LIAISONS,
  LISTE_LIAISONS,
  LISTE_RARETES,
  NIVEAUX_CHARIOT_POUSSEUR,
  NIVEAUX_EMPLOYE,
  NIVEAUX_MANAGER,
  NIVEAUX_POUSSEUR,
  NIVEAUX_RECRUTEUR,
  NIVEAU_MINE_MANAGER,
  NIVEAU_MINE_RECRUTEUR,
  PRIX_MANAGER,
  VITESSE_POUSSE_MINEUR,
  RARETES,
  SECONDES_PAR_PAIE,
  type IdLiaison,
} from '../jeu/donnees'
import {
  agrandirChariot,
  apercuRecrue,
  bijouxParMinute,
  ameliorerEmploye,
  ameliorerManager,
  ameliorerRecruteur,
  basculerManager,
  chancesRecrutement,
  changerTrajet,
  coutAmeliorationEmploye,
  coutChariotPousseur,
  coutSalaireEmploye,
  coutSalaires,
  depensesParPaie,
  embaucher,
  embaucherJoaillier,
  embaucherManager,
  embaucherPousseur,
  fatigueManager,
  iconeActiviteEmploye,
  indemnites,
  licencier,
  managerActif,
  managerAuTravail,
  managerDebloque,
  managerEndormi,
  managerPaieLesSalaires,
  maxEmployes,
  nbDuRole,
  nbSansSalaire,
  payerEmploye,
  payerSalaires,
  peutAgrandirChariot,
  peutAmeliorerEmploye,
  peutAmeliorerManager,
  peutAmeliorerRecruteur,
  peutEmbaucherJoaillier,
  peutEmbaucherPousseur,
  peutPayerEmploye,
  peutPayerSalaires,
  peutRemplacer,
  prixEmbauche,
  prixRemplacement,
  prochainNiveauManager,
  prochainNiveauRecruteur,
  rareteDe,
  recruteurDebloque,
  remplacerMineur,
  reveillerManager,
  salaireEmploye,
  salairesParPaie,
  secondesAvantSommeil,
  secondesEveilManager,
  tempsPayeMin,
  trajetPris,
  verrouMinePioche,
  vitesseEmploye,
} from '../jeu/employes'
import { gemmeEnCours, maxJoailliers } from '../jeu/ateliers'
import { nombre, nomEmploye, t } from '../jeu/langue'
import type { Employe, EtatJeu } from '../jeu/mineur'
import { verrou } from '../jeu/niveaux'
import { batimentPose } from '../jeu/village'
import { forcePousseur, ligneDe, placesChariot, placesReelles, vitesseAdoucie, vitesseBrute } from '../jeu/wagonnet'
import { nombreAbrege } from '../nombres'
import type { Action } from '../usePartie'
import { Achat, Amelioration } from './Amelioration'
import { Barre } from './Barre'
import { Confirmation } from './Confirmation'
import { useJeu } from './contexteJeu'
import { Interrupteur } from './Interrupteur'
import { OngletsPanneau } from './OngletsPanneau'
import { nomTrajet } from './nomTrajet'
import { RevelationRecrue } from './RevelationRecrue'
import { cheminPublic } from '../chemins'
import { analyseWagonnet, chariotTropPetit } from '../jeu/production'

type Props = { etat: EtatJeu; jouer: (action: Action) => EtatJeu }
type PropsPanneau = Props & { onApercuTrajet?: (liaison: IdLiaison | null) => void }

// « 1 h 05 », « 12 min », « 45 s ». Les minutes sont arrondies au-dessus : un salaire de 5 minutes
// qui vient de commencer affiche « 5 min ».
function duree(secondes: number): string {
  if (secondes < 60) return t('{n} s', { n: Math.max(0, Math.ceil(secondes)) })
  const minutes = Math.ceil(secondes / 60)
  if (minutes < 60) return t('{n} min', { n: minutes })
  return t('{h} h {m}', { h: Math.floor(minutes / 60), m: String(minutes % 60).padStart(2, '0') })
}

// « 0,5 », « 1,25 » : des blocs par seconde, lisibles.
const parSeconde = (n: number) => nombre(n, 2)

// L'étiquette de rareté d'un employé, à sa couleur (« Rare ×1,5 »).
function EtiquetteRarete({ employe }: { employe: Employe }) {
  const rarete = rareteDe(employe)
  const bonus = employe.role === 'pousseur' ? forcePousseur(rarete.id) : rarete.rendement
  return (
    <span className="etiquette" style={{ background: rarete.couleur }}>
      {t(rarete.nom)}
      {bonus > 1 && ` ×${nombre(bonus, 2)}`}
    </span>
  )
}

// Les chances de chaque rareté, en petites étiquettes de couleur.
function Chances({ etat, apercu }: { etat: EtatJeu; apercu: boolean }) {
  // Sans recruteur, on montre ce qu'il donnera dès son embauche.
  const chances = apercu ? NIVEAUX_RECRUTEUR[0].chances : chancesRecrutement(etat)
  // (26/10) Un tableau bien rangé, de la plus commune à la plus rare : la chance de tomber dessus,
  // ce que creuse une recrue de cette rareté (avec la pioche de départ), et son salaire.
  return (
    <div className="tableau-raretes" role="table" aria-label={t('Les raretés')}>
      <div className="tableau-raretes-ligne tableau-raretes-entete" role="row">
        <span role="columnheader">{t('Rareté')}</span>
        <span role="columnheader">
          <span className="tableau-raretes-icone">🎲 </span>
          {t('Chance')}
        </span>
        <span role="columnheader">
          <span className="tableau-raretes-icone">⛏️ </span>
          {t('Minage')}
        </span>
        <span role="columnheader">💵 {t('/ 5 min')}</span>
      </div>
      {LISTE_RARETES.map((id) => {
        const recrue = apercuRecrue('mineur', id)
        return (
          <div key={id} className="tableau-raretes-ligne" role="row">
            <span role="cell">
              <span className="etiquette" style={{ background: RARETES[id].couleur }}>
                {t(RARETES[id].nom)}
              </span>
            </span>
            <span role="cell">
              <strong>{nombre(chances[id], 2)} %</strong>
            </span>
            <span role="cell">
              {t('{n} blocs/s', { n: parSeconde(recrue.vitesse) })} <small className="discret tableau-raretes-fois">×{nombre(RARETES[id].rendement, 1)}</small>
            </span>
            <span role="cell">{nombre(recrue.salaire)} $</span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// L'équipe
// ---------------------------------------------------------------------------

// Les salaires (sans le manager) : on paie tout le monde jusqu'à 5 minutes de travail.
function Salaires({ etat, jouer }: Props) {
  const sansSalaire = nbSansSalaire(etat)
  const cout = coutSalaires(etat, SECONDES_PAR_PAIE)
  return (
    <div className={`carte salaires ${sansSalaire > 0 ? 'carte-alerte' : ''}`}>
      <span className="salaires-texte">
        <strong>
          💵 {t('Salaires')} · {t('{n} $ / 5 min', { n: nombre(salairesParPaie(etat)) })}
        </strong>
        {sansSalaire > 0 ? (
          <span className="texte-alerte">😠 {sansSalaire === 1 ? t('Un employé attend son salaire : il ne travaille plus !') : t('{n} employés attendent leur salaire : ils ne travaillent plus !', { n: sansSalaire })}</span>
        ) : (
          <span className="discret">{t('Tout le monde est payé encore {duree}.', { duree: duree(tempsPayeMin(etat)) })}</span>
        )}
      </span>
      <button className={`btn btn-jaune ${sansSalaire > 0 ? 'btn-attention' : ''}`} disabled={!peutPayerSalaires(etat, SECONDES_PAR_PAIE)} onClick={() => jouer((e) => payerSalaires(e, SECONDES_PAR_PAIE))}>
        <span>💵 {t('Payer tout le monde')}</span>
        {cout > 0 && <span className="prix">{nombreAbrege(cout)} $</span>}
      </button>
    </div>
  )
}

// Le chariot de ce pousseur ne suit pas la production de son trajet (26/10).
function pousseurNeSuitPas(etat: EtatJeu, employe: Employe): boolean {
  if (employe.role !== 'pousseur' || !employe.trajet) return false
  const analyse = analyseWagonnet(etat, employe.trajet)
  return analyse !== null && analyse.pousseur?.nom === employe.nom && chariotTropPetit(analyse)
}

// La carte d'un employé : qui il est, ses chiffres, ses améliorations, et ses boutons.
function CarteEmploye({ etat, jouer, employe, index, onLicencier, onRemplacer }: Props & { employe: Employe; index: number; onLicencier: () => void; onRemplacer: () => void }) {
  const pousseur = employe.role === 'pousseur'
  const joaillier = employe.role === 'joaillier'
  const paye = employe.tempsPaye > 0
  const gemme = joaillier ? gemmeEnCours(employe) : null
  const coutNiveau = coutAmeliorationEmploye(etat, employe)
  const verrouNiveau = verrouMinePioche(etat, employe)
  const pioche = NIVEAUX_EMPLOYE[employe.niveau]
  const piocheSuivante = NIVEAUX_EMPLOYE[employe.niveau + 1] ?? null
  // (pour un pousseur : sa vitesse et son chariot, les places de son wagonnet)
  const vitesse = NIVEAUX_POUSSEUR[Math.min(employe.niveau, NIVEAUX_POUSSEUR.length - 1)]
  const vitesseSuivante = pousseur ? (NIVEAUX_POUSSEUR[employe.niveau + 1] ?? null) : null
  const chariotSuivant = pousseur ? (NIVEAUX_CHARIOT_POUSSEUR[(employe.chariot ?? 0) + 1] ?? null) : null
  const coutChariot = coutChariotPousseur(etat, employe)
  // (27/10) Les vraies places de son chariot : agrandi d'autant que sa vitesse est adoucie.
  const places = (n: number) => placesReelles(etat, n, employe.trajet, employe)
  // (27/10) Sur son trajet, à ce niveau de vitesse : ce qu'on voit sur la carte (cases/s) et les
  // places de son chariot (agrandi d'autant que sa vitesse est adoucie).
  const auNiveau = (niveau: number) => {
    if (!employe.trajet) return null
    const e = { ...employe, niveau }
    return { vitesse: vitesseAdoucie(vitesseBrute(etat, employe.trajet, e)), places: placesReelles(etat, placesChariot(e), employe.trajet, e) }
  }
  const maintenant = pousseur ? auNiveau(employe.niveau) : null
  const ensuite = pousseur && vitesseSuivante ? auNiveau(employe.niveau + 1) : null
  // Avec une nouvelle pioche, combien il creuserait.
  const avecPiocheSuivante = piocheSuivante ? vitesseEmploye({ ...employe, niveau: employe.niveau + 1 }) : 0
  const trajetsPossibles = LISTE_LIAISONS.filter((l) => l === employe.trajet || (ligneDe(etat, l) !== null && !trajetPris(etat, l)))
  // (26/10) Son chariot ne suit pas la production : l'alerte, ici, sur sa carte (et son chariot en avant)
  const analyse = pousseur && employe.trajet ? analyseWagonnet(etat, employe.trajet) : null
  const chariotNeSuitPas = pousseurNeSuitPas(etat, employe)

  return (
    <article className={`carte carte-employe ${paye && !chariotNeSuitPas ? '' : 'carte-alerte'}`}>
      <header className="carte-employe-entete">
        <span className="carte-employe-icone" aria-hidden="true">
          {iconeActiviteEmploye(employe)}
        </span>
        <span className="carte-employe-nom">
          <strong>{nomEmploye(employe.nom)}</strong>
          <EtiquetteRarete employe={employe} />
        </span>
        <span className={`etiquette ${paye ? '' : 'etiquette-rose'}`}>{paye ? `⏳ ${duree(employe.tempsPaye)}` : `😠 ${t('Pas payé')}`}</span>
      </header>

      <p className="carte-employe-chiffres">
        {pousseur ? (
          <>
            🛤️ {employe.trajet ? nomTrajet(employe.trajet) : t('Aucun trajet')} · 🛒 {t('{n} places', { n: places(placesChariot(employe)) })}
          </>
        ) : joaillier ? (
          <>
            💍 {t('{n} bijoux/min', { n: nombre(bijouxParMinute(etat, employe), 1) })}
            {gemme && ` · ${BLOCS[gemme].emoji} ${t('{n} %', { n: Math.floor(employe.progression * 100) })}`}
          </>
        ) : (
          <>
            ⛏️ {t('{n} blocs/s', { n: parSeconde(vitesseEmploye(employe)) })}
          </>
        )}{' '}
        · 💵 {t('{n} $ / 5 min', { n: nombre(salaireEmploye(employe)) })}
      </p>

      {/* Un pousseur peut changer de trajet (seulement vers un trajet libre, avec des rails). */}
      {pousseur && trajetsPossibles.length > 1 && (
        <label className="carte-employe-trajet">
          <span className="discret">{t('Son trajet')}</span>
          <select className="champ" value={employe.trajet ?? ''} onChange={(ev) => jouer((e) => changerTrajet(e, index, ev.target.value as IdLiaison))}>
            {trajetsPossibles.map((l) => (
              <option key={l} value={l}>
                {nomTrajet(l)}
              </option>
            ))}
          </select>
        </label>
      )}

      {!pousseur && !joaillier && (
        <Amelioration
          icone="⛏️"
          titre={t('Pioche en {nom}', { nom: t(pioche.nom) })}
          niveau={employe.niveau + 1}
          niveauMax={NIVEAUX_EMPLOYE.length}
          effet={
            piocheSuivante ? (
              <>
                {t('{n} blocs/s', { n: parSeconde(vitesseEmploye(employe)) })} → <strong>{t('{n} blocs/s', { n: parSeconde(avecPiocheSuivante) })}</strong>
              </>
            ) : undefined
          }
          cout={piocheSuivante ? coutNiveau : null}
          verrou={verrouNiveau}
          possible={peutAmeliorerEmploye(etat, employe)}
          action={(e) => ameliorerEmploye(e, index)}
        />
      )}
      {pousseur && (
        <Amelioration
          icone="⏱️"
          titre={t('Vitesse')}
          niveau={employe.niveau + 1}
          niveauMax={NIVEAUX_POUSSEUR.length}
          effet={
            maintenant ? (
              ensuite ? (
                <>
                  {t('{n} cases/s', { n: nombre(maintenant.vitesse, 1) })} → <strong>{t('{n} cases/s', { n: nombre(ensuite.vitesse, 1) })}</strong>
                  {ensuite.places > maintenant.places && (
                    <>
                      {' · 🛒 '}
                      {nombre(maintenant.places)} → <strong>{t('{n} places', { n: ensuite.places })}</strong>
                    </>
                  )}
                </>
              ) : (
                t('{n} cases/s', { n: nombre(maintenant.vitesse, 1) })
              )
            ) : vitesseSuivante ? (
              <>
                ×{nombre(vitesse.vitesse, 2)} → <strong>×{nombre(vitesseSuivante.vitesse, 2)}</strong>
              </>
            ) : (
              `×${nombre(vitesse.vitesse, 2)}`
            )
          }
          cout={vitesseSuivante ? coutNiveau : null}
          verrou={verrou(etat, 'pousseur', employe.niveau + 1)}
          possible={peutAmeliorerEmploye(etat, employe)}
          action={(e) => ameliorerEmploye(e, index)}
        />
      )}
      {chariotNeSuitPas && analyse && (
        <p className="texte-alerte">
          ⚠️ {t('Son chariot ne suit pas : il emporte {a} blocs/s, il en sort {b}. Agrandis-le !', { a: nombre(analyse.debitMax, 2), b: nombre(analyse.apport, 2) })}
        </p>
      )}
      {pousseur && (
        <Amelioration
          icone="🛒"
          titre={t('Chariot')}
          niveau={(employe.chariot ?? 0) + 1}
          niveauMax={NIVEAUX_CHARIOT_POUSSEUR.length}
          effet={
            chariotSuivant ? (
              <>
                {t('{n} places', { n: places(placesChariot(employe)) })} → <strong>{t('{n} places', { n: places(chariotSuivant.places) })}</strong>
              </>
            ) : (
              t('{n} places', { n: places(placesChariot(employe)) })
            )
          }
          cout={chariotSuivant ? coutChariot : null}
          verrou={verrou(etat, 'chariotPousseur', (employe.chariot ?? 0) + 1)}
          possible={peutAgrandirChariot(etat, employe)}
          action={(e) => agrandirChariot(e, index)}
        />
      )}

      <footer className="rangee carte-employe-boutons">
        {/* Le payer, lui seul (sans manager) : jusqu'à 5 minutes de travail. */}
        {!managerPaieLesSalaires(etat) && coutSalaireEmploye(employe) > 0 && (
          <button className={`btn btn-jaune btn-petit ${paye ? '' : 'btn-attention'}`} disabled={!peutPayerEmploye(etat, index)} onClick={() => jouer((e) => payerEmploye(e, index))}>
            💵 {t('Payer')} · {nombreAbrege(coutSalaireEmploye(employe))} $
          </button>
        )}
        {/* Avec le recruteur : une nouvelle recrue prend sa place (même pioche), rareté au hasard. */}
        {etat.recruteur > 0 && (
          // (25/10) Le bouton du hasard : un dé qui roule (on tire une rareté au hasard). (26/10)
          // Turquoise uni, plus d'arc-en-ciel qui défile.
          <button className="btn btn-petit btn-hasard" disabled={!peutRemplacer(etat, index)} onClick={onRemplacer}>
            <span className="btn-hasard-de" aria-hidden="true">
              🎲
            </span>
            <span className="btn-hasard-texte">
              {t('Remplacer')} · {nombreAbrege(prixRemplacement(etat))} $
            </span>
          </button>
        )}
        <button className="btn btn-rose btn-petit carte-employe-licencier" disabled={employe.etape === 'pousse'} onClick={onLicencier}>
          {t('Licencier')}
        </button>
      </footer>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Embaucher
// ---------------------------------------------------------------------------

function EmbaucheMineur({ etat }: { etat: EtatJeu }) {
  // Le tutoriel montre le bouton vert « Embaucher » (data-tuto="embaucher") : la ligne d'achat
  // (Achat) ne sait pas le marquer elle-même, alors on le marque une fois la ligne affichée.
  const ligne = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ligne.current?.querySelector('.btn-vert')?.setAttribute('data-tuto', 'embaucher')
  })
  const prix = prixEmbauche(etat)
  const max = maxEmployes(etat)
  const avecRecruteur = etat.recruteur > 0
  if (prix === null) {
    return (
      <div className="carte carte-creme">
        <strong>
          ⛏️ {t('Mineurs')} {nbDuRole(etat, 'mineur')} / {max}
        </strong>
        <p className="discret">{t('Tu as tous tes mineurs. Chaque niveau de la mine te permet d’en embaucher un de plus.')}</p>
      </div>
    )
  }
  return (
    <div ref={ligne}>
      <Achat
        icone="⛏️"
        titre={`${t('Mineur')} · ${nbDuRole(etat, 'mineur')} / ${max}`}
        effet={
          <>
            {avecRecruteur ? t('Sa rareté est une surprise ! Ses 5 premières minutes sont payées.') : t('Il creuse tout seul au fond de la mine. Ses 5 premières minutes sont payées.')}
            {/* (25/10) Ce qu'il fera, avant de l'embaucher */}
            <span className="stats-recrue">
              <span className="etiquette">
                ⛏️{' '}
                {avecRecruteur
                  ? t('{a} à {b} blocs/s', { a: parSeconde(apercuRecrue('mineur', 'commun').vitesse), b: parSeconde(apercuRecrue('mineur', 'mythique').vitesse) })
                  : t('{n} blocs/s', { n: parSeconde(apercuRecrue('mineur').vitesse) })}
              </span>
              <span className="etiquette">💵 {t('{n} $ / 5 min', { n: nombre(apercuRecrue('mineur').salaire) })}</span>
            </span>
          </>
        }
        cout={{ argent: prix, materiaux: {} }}
        possible={etat.argent >= prix}
        action={(e) => embaucher(e, aleatoireNavigateur)}
        texte={t('Embaucher')}
      />
    </div>
  )
}

// L'embauche d'un pousseur (26/10) : on choisit son trajet (il brille sur la carte), puis on paie.
function EmbauchePousseur({ etat, onApercuTrajet }: { etat: EtatJeu; onApercuTrajet?: (liaison: IdLiaison | null) => void }) {
  // Tous les trajets dont les deux bâtiments sont construits.
  const trajets = LISTE_LIAISONS.filter((l) => batimentPose(etat.village, LIAISONS[l].depart) && batimentPose(etat.village, LIAISONS[l].arrivee))
  const libres = trajets.filter((l) => ligneDe(etat, l) !== null && !trajetPris(etat, l))
  const [liaison, setLiaison] = useState<IdLiaison | null>(libres.length === 1 ? libres[0] : null)
  const choisie = liaison && libres.includes(liaison) ? liaison : null
  // Le trajet choisi brille sur la carte (et plus rien quand on ferme le panneau).
  useEffect(() => {
    onApercuTrajet?.(choisie)
  }, [choisie, onApercuTrajet])
  useEffect(() => () => onApercuTrajet?.(null), [onApercuTrajet])
  const prix = prixEmbauche(etat, 'pousseur')
  if (trajets.length === 0) return null
  return (
    <>
      <h3 className="titre-section">{t('Pousseur')}</h3>
      <p className="discret">{t('Il pousse le wagonnet d’un seul trajet. Choisis lequel :')}</p>
      <div className="choix-trajets" role="radiogroup">
        {trajets.map((l) => {
          const rails = ligneDe(etat, l) !== null
          const sonPousseur = etat.employes.find((e) => e.role === 'pousseur' && e.trajet === l)
          const libre = rails && !sonPousseur
          return (
            <button key={l} role="radio" aria-checked={choisie === l} className={`choix-trajet ${choisie === l ? 'choisi' : ''}`} disabled={!libre} onClick={() => setLiaison(l)}>
              <span aria-hidden="true">{LIAISONS[l].emoji}</span>
              <span className="choix-trajet-nom">{nomTrajet(l)}</span>
              <span className={`etiquette ${libre ? 'etiquette-vert' : ''}`}>{sonPousseur ? `✔ ${sonPousseur.nom}` : !rails ? t('Pas de rails') : t('Libre')}</span>
            </button>
          )
        })}
      </div>
      {prix === null || libres.length === 0 ? (
        <p className="discret">{libres.length === 0 && trajets.some((l) => ligneDe(etat, l) === null) ? t('Pose des rails entre deux bâtiments pour embaucher un pousseur.') : t('Chaque trajet a déjà son pousseur.')}</p>
      ) : (
        <Achat
          icone="🛤️"
          titre={choisie ? nomTrajet(choisie) : t('Choisis un trajet')}
          effet={
            <>
              {choisie ? t('Ce trajet brille sur la carte.') : null}
              <span className="stats-recrue">
                <span className="etiquette">🛤️ {t('{n} cases/s', { n: parSeconde(VITESSE_POUSSE_MINEUR * NIVEAUX_POUSSEUR[0].vitesse) })}</span>
                <span className="etiquette">🚃 {t('{n} places', { n: nombre(NIVEAUX_CHARIOT_POUSSEUR[0].places) })}</span>
                <span className="etiquette">💵 {t('{n} $ / 5 min', { n: nombre(apercuRecrue('pousseur').salaire) })}</span>
              </span>
            </>
          }
          cout={{ argent: prix, materiaux: {} }}
          possible={choisie !== null && peutEmbaucherPousseur(etat, choisie)}
          action={(e) => (choisie ? embaucherPousseur(e, aleatoireNavigateur, choisie) : [])}
          texte={t('Embaucher')}
        />
      )}
    </>
  )
}

// (26/10) L'embauche d'un joaillier : autant que d'établis à la joaillerie.
function EmbaucheJoaillier({ etat }: { etat: EtatJeu }) {
  const prix = prixEmbauche(etat, 'joaillier')
  const max = maxJoailliers(etat)
  const avecRecruteur = etat.recruteur > 0
  if (prix === null) {
    return (
      <div className="carte carte-creme">
        <p className="discret">{t('Tous les établis sont pris. Améliore la joaillerie pour en avoir plus.')}</p>
      </div>
    )
  }
  const commun = bijouxParMinute(etat, { rarete: 'commun' })
  const mythique = bijouxParMinute(etat, { rarete: 'mythique' })
  return (
    <Achat
      icone="💍"
      titre={`${t('Joaillier')} · ${nbDuRole(etat, 'joaillier')} / ${max}`}
      effet={
        <>
          {avecRecruteur ? t('Sa rareté est une surprise : un joaillier rare taille plus vite !') : t('Il taille les gemmes de la joaillerie en bijoux. Ses 5 premières minutes sont payées.')}
          <span className="stats-recrue">
            <span className="etiquette">💍 {avecRecruteur ? t('{a} à {b} bijoux/min', { a: nombre(commun, 1), b: nombre(mythique, 1) }) : t('{n} bijoux/min', { n: nombre(commun, 1) })}</span>
            <span className="etiquette">💵 {t('{n} $ / 5 min', { n: nombre(apercuRecrue('joaillier').salaire) })}</span>
          </span>
        </>
      }
      cout={{ argent: prix, materiaux: {} }}
      possible={peutEmbaucherJoaillier(etat)}
      action={(e) => embaucherJoaillier(e, aleatoireNavigateur)}
      texte={t('Embaucher')}
    />
  )
}

// ---------------------------------------------------------------------------
// Les chefs
// ---------------------------------------------------------------------------

// Le portrait d’un chef (la même taupe que celle qui attend devant le Personnel, au village).
function Portrait({ role }: { role: 'manager' | 'recruteur' }) {
  return <img className="portrait-chef" src={cheminPublic(`/images/personnages/${role}.svg`)} alt="" width={64} height={64} draggable={false} />
}

// (23/10) La fatigue du manager : elle monte pendant qu'il travaille ; pleine, il s'endort.
function FatigueManager({ etat, jouer }: Props) {
  const fatigue = fatigueManager(etat)
  const endormi = managerEndormi(etat)
  return (
    <div className="rangee fatigue-manager">
      <span className="fatigue-jauge">
        <Barre
          valeur={1 - fatigue}
          max={1}
          texte={endormi ? `💤 ${t('Il dort : il ne paie plus personne !')}` : `☕ ${t('Éveillé encore {duree}', { duree: duree(secondesAvantSommeil(etat)) })}`}
          couleur={endormi || fatigue > 0.8 ? 'rouge' : fatigue > 0.5 ? 'or' : 'vert'}
        />
      </span>
      <button className={`btn btn-jaune btn-petit ${endormi || fatigue > 0.8 ? 'btn-attention' : ''}`} onClick={() => jouer(reveillerManager)} disabled={fatigue === 0}>
        ☕ {t('Réveiller')}
      </button>
    </div>
  )
}

// Le manager (palier 3) : il paie les salaires avec ton argent.
function Manager({ etat, jouer }: Props) {
  if (!managerDebloque(etat)) {
    return (
      <div className="carte carte-chef carte-verrouillee">
        <Portrait role="manager" />
        <span className="carte-chef-texte">
          <strong>💼 {t('Manager')}</strong>
          <span className="discret">{t('Il paiera les salaires tout seul, avec ton argent.')}</span>
        </span>
        <span className="verrou">🔒 🕳️ {t('Mine {n}', { n: NIVEAU_MINE_MANAGER })}</span>
      </div>
    )
  }
  if (!etat.manager.embauche) {
    return (
      <div className="carte carte-chef">
        <Portrait role="manager" />
        <div className="carte-chef-texte">
          <Achat
            icone="💼"
            titre={t('Manager')}
            effet={t('Il paie les salaires tout seul, avec ton argent.')}
            cout={{ argent: PRIX_MANAGER, materiaux: {} }}
            possible={etat.argent >= PRIX_MANAGER}
            action={embaucherManager}
            texte={t('Embaucher')}
          />
        </div>
      </div>
    )
  }
  const prochain = prochainNiveauManager(etat)
  const actif = managerActif(etat)
  const endormi = managerEndormi(etat)
  const sansArgent = actif && !endormi && (!managerAuTravail(etat) || nbSansSalaire(etat) > 0)
  const niveau = etat.manager.niveau ?? 0
  return (
    <div className={`carte carte-chef carte-chef-embauche ${sansArgent || endormi ? 'carte-alerte' : ''}`}>
      <Portrait role="manager" />
      <div className="carte-chef-texte">
        <span className="carte-chef-titre">
          <strong>💼 {t('Manager')}</strong>
          <span className={`etiquette ${actif && !endormi && !sansArgent ? 'etiquette-vert' : 'etiquette-rose'}`}>
            {!actif ? `⏸ ${t('Arrêté')}` : endormi ? `💤 ${t('Endormi')}` : sansArgent ? `😠 ${t('Pas assez d’argent')}` : t('Au travail')}
          </span>
        </span>
        {/* C'est une option : on l'arrête et on le remet au travail quand on veut. */}
        <Interrupteur allume={actif} texte={actif ? t('Il paie les salaires') : t('Arrêté : tu paies toi-même')} onBasculer={() => jouer(basculerManager)} />
        {actif && <FatigueManager etat={etat} jouer={jouer} />}
        {actif && !endormi && <span className="discret">{t('Une paie de toute l’équipe : {n} $ toutes les 5 min.', { n: nombre(depensesParPaie(etat)) })}</span>}
        <Amelioration
          icone="☕"
          titre={t('Endurance')}
          niveau={niveau + 1}
          niveauMax={NIVEAUX_MANAGER.length}
          effet={
            prochain ? (
              <>
                {duree(secondesEveilManager(etat))} → <strong>{duree(prochain.minutesEveil * 60)}</strong>
              </>
            ) : (
              duree(secondesEveilManager(etat))
            )
          }
          cout={prochain?.cout ?? null}
          verrou={verrou(etat, 'tempsManager', niveau + 1)}
          possible={peutAmeliorerManager(etat)}
          action={ameliorerManager}
        />
      </div>
    </div>
  )
}

// Le recruteur (palier 4) : il trouve des mineurs rares. Chaque niveau rend les raretés plus fréquentes.
function Recruteur({ etat }: { etat: EtatJeu }) {
  if (!recruteurDebloque(etat)) {
    return (
      <div className="carte carte-chef carte-verrouillee">
        <Portrait role="recruteur" />
        <span className="carte-chef-texte">
          <strong>🎩 {t('Recruteur')}</strong>
          <span className="discret">{t('Il trouvera des mineurs rares, qui rapportent jusqu’à 5 fois plus.')}</span>
        </span>
        <span className="verrou">🔒 🕳️ {t('Mine {n}', { n: NIVEAU_MINE_RECRUTEUR })}</span>
      </div>
    )
  }
  const prochain = prochainNiveauRecruteur(etat)
  return (
    <div className="carte carte-chef">
      <Portrait role="recruteur" />
      <div className="carte-chef-texte">
        <Amelioration
          icone="🎩"
          titre={t('Recruteur')}
          niveau={etat.recruteur}
          niveauMax={NIVEAUX_RECRUTEUR.length}
          effet={etat.recruteur === 0 ? t('Chaque nouveau mineur ou joaillier aura une rareté tirée au hasard.') : t('Les mineurs rares sortent plus souvent.')}
          cout={prochain?.cout ?? null}
          verrou={verrou(etat, 'recruteur', etat.recruteur)}
          possible={peutAmeliorerRecruteur(etat)}
          action={ameliorerRecruteur}
          texte={etat.recruteur === 0 ? t('Embaucher') : undefined}
        />
        <span className="discret">{etat.recruteur === 0 ? t('Ce qu’il trouvera :') : t('Chances à la prochaine embauche :')}</span>
        <Chances etat={etat} apercu={etat.recruteur === 0} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Le panneau
// ---------------------------------------------------------------------------

// (25/10) Un seul onglet « Personnel » : l'équipe et les embauches ensemble ; puis les chefs.
type OngletPersonnel = 'personnel' | 'chefs'

export function PanneauEmployes({ onApercuTrajet }: PropsPanneau) {
  const { etat, jouer } = useJeu()
  // Le mineur qu'on vient de recruter (avec le recruteur) : on dévoile sa rareté en grand.
  const [recrue, setRecrue] = useState<Employe | null>(null)
  // Le mineur qu'on veut licencier : on demande d'abord confirmation.
  const [aLicencier, setALicencier] = useState<number | null>(null)
  const [onglet, setOnglet] = useState<OngletPersonnel>('personnel')

  // Une nouvelle recrue (embauche ou remplacement, en argent ou en gemmes) : avec le recruteur,
  // on la dévoile en grand. On compare les noms de l'équipe avant et après.
  const nomsAvant = useRef(new Set(etat.employes.map((e) => e.nom)))
  useEffect(() => {
    const nouveau = etat.employes.find((e) => !nomsAvant.current.has(e.nom))
    nomsAvant.current = new Set(etat.employes.map((e) => e.nom))
    if (nouveau && etat.recruteur > 0) setRecrue(nouveau)
  }, [etat.employes, etat.recruteur])

  const sansSalaire = nbSansSalaire(etat)
  const prix = prixEmbauche(etat)
  const managerEnPanne = managerEndormi(etat) || (managerActif(etat) && !managerAuTravail(etat))
  // (26/10) Un chef qui vient de se débloquer et pas encore embauché (manager, recruteur) : « ! »
  const chefADebloque = (managerDebloque(etat) && !etat.manager.embauche) || (recruteurDebloque(etat) && etat.recruteur === 0)
  const employe = aLicencier !== null ? etat.employes[aLicencier] : undefined
  // (26/10) « ! » dès qu'une amélioration est payable : la pioche d'un mineur ; et, aux Chefs, le
  // manager ou le recruteur. (27/10, demandé par le propriétaire) Un pousseur, seulement s'il en a
  // besoin : son chariot ne suit pas la production (sinon, pas de « ! » pour rien).
  const employeAmeliorable = etat.employes.some((e) =>
    e.role === 'pousseur' ? pousseurNeSuitPas(etat, e) && (peutAmeliorerEmploye(etat, e) || peutAgrandirChariot(etat, e)) : peutAmeliorerEmploye(etat, e),
  )
  const chefAmeliorable = peutAmeliorerManager(etat) || peutAmeliorerRecruteur(etat)

  return (
    <div className="panneau-bat panneau-personnel">
      <OngletsPanneau
        onglets={[
          // (26/10) « ! » aussi dès qu'une place de mineur est libre (la mine vient de descendre d'un
          // niveau : un mineur de plus), même sans encore l'argent pour l'embaucher
          { id: 'personnel', titre: `👷 ${t('Personnel')}`, pastille: sansSalaire > 0 || prix !== null || prixEmbauche(etat, 'joaillier') !== null || employeAmeliorable ? '!' : null },
          { id: 'chefs', titre: `💼 ${t('Chefs')}`, pastille: managerEnPanne || chefADebloque || chefAmeliorable ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />

      {onglet === 'personnel' && etat.employes.length === 0 && (
        <p className="carte carte-creme vide-equipe">{t('Personne pour l’instant. Tes mineurs creuseront pour toi, même jeu fermé !')}</p>
      )}
      {onglet === 'personnel' && etat.employes.length > 0 && !managerPaieLesSalaires(etat) && <Salaires etat={etat} jouer={jouer} />}
      {/* (26/10) Deux sections : les mineurs (l'équipe, puis en recruter un), et les pousseurs
          (l'équipe, puis en embaucher un). La recrue qu'on est en train de dévoiler n'apparaît
          dans la liste qu'une fois sa carte montrée (sinon, on la voyait derrière avant). */}
      {onglet === 'personnel' &&
        (['mineur', 'pousseur', 'joaillier'] as const).map((role) => {
          // (26/10) Les plus rares en haut (Mythique d'abord) ; à rareté égale, l'ordre d'embauche.
          // (« index » reste sa place dans l'équipe : les actions s'en servent.)
          const rang = (e: Employe) => LISTE_RARETES.indexOf(rareteDe(e).id)
          const liste = etat.employes
            .map((e, index) => ({ e, index }))
            .filter(({ e }) => e.role === role && e.nom !== recrue?.nom)
            .sort((a, b) => rang(b.e) - rang(a.e) || a.index - b.index)
          // (pas encore de trajet de wagonnet : pas de section pousseurs)
          if (role === 'pousseur' && liste.length === 0 && etat.trajets.length === 0) return null
          // (pas de joaillerie : pas de section joailliers)
          if (role === 'joaillier' && liste.length === 0 && !batimentPose(etat.village, 'joaillerie')) return null
          const titre =
            role === 'mineur'
              ? `⛏️ ${t('Mineurs')} ${liste.length} / ${maxEmployes(etat)}`
              : role === 'pousseur'
                ? `🛤️ ${t('Pousseurs')} ${liste.length}`
                : `💍 ${t('Joailliers')} ${liste.length} / ${maxJoailliers(etat)}`
          return (
            <section key={role} className="section-employes">
              <h3 className="titre-section">{titre}</h3>
              {liste.length > 0 && (
                <div className="grille-employes">
                  {liste.map(({ e, index }) => (
                    <CarteEmploye key={`${e.nom}-${index}`} etat={etat} jouer={jouer} employe={e} index={index} onLicencier={() => setALicencier(index)} onRemplacer={() => jouer((x) => remplacerMineur(x, index, aleatoireNavigateur))} />
                  ))}
                </div>
              )}
              {role === 'mineur' ? <EmbaucheMineur etat={etat} /> : role === 'pousseur' ? <EmbauchePousseur etat={etat} onApercuTrajet={onApercuTrajet} /> : <EmbaucheJoaillier etat={etat} />}
            </section>
          )
        })}

      {onglet === 'chefs' && (
        <>
          <Manager etat={etat} jouer={jouer} />
          <Recruteur etat={etat} />
        </>
      )}

      {recrue && <RevelationRecrue employe={recrue} onFermer={() => setRecrue(null)} />}
      {aLicencier !== null && employe && (
        <Confirmation
          titre={t('Licencier {nom} ?', { nom: employe.nom })}
          texteConfirmer={t('Licencier')}
          danger
          possible={etat.argent >= indemnites(etat, employe.role)}
          onConfirmer={() => {
            jouer((e) => licencier(e, aLicencier))
            setALicencier(null)
          }}
          onAnnuler={() => setALicencier(null)}
        >
          <p>{t('Il part avec son équipement.')}</p>
          <p>
            {t('Indemnités : {n} $', { n: nombre(indemnites(etat, employe.role)) })}
            {etat.argent < indemnites(etat, employe.role) && <span className="texte-alerte"> · {t('il te manque {n} $', { n: nombre(indemnites(etat, employe.role) - etat.argent) })}</span>}
          </p>
        </Confirmation>
      )}
    </div>
  )
}
