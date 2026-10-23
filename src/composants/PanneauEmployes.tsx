// Le stand Personnel : on embauche des mineurs qui creusent tout seuls au fond de la mine (la
// caisse de l'ascenseur remonte ce qu'ils cassent dans le coffre de la mine), et (26/10) des pousseurs, chacun pour un trajet de wagonnet : on
// choisit son départ et son arrivée, et le trajet brille sur la carte avant qu'on confirme.
// On leur paie un salaire toutes les 5 minutes (ou c'est le manager qui s'en charge, au
// niveau 4 de la mine). Au niveau 3, le recruteur trouve des mineurs plus ou moins rares :
// chaque embauche est une surprise.

import { useEffect, useState, type ReactNode } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import {
  LISTE_RARETES,
  NIVEAUX_EMPLOYE,
  NIVEAUX_POUSSEUR,
  NIVEAUX_RECRUTEUR,
  NIVEAU_JOUEUR_POUR,
  NIVEAU_MINE_MANAGER,
  NIVEAU_MINE_RECRUTEUR,
  PRIX_MANAGER,
  BATIMENTS,
  LIAISONS,
  LISTE_LIAISONS,
  RARETES,
  SECONDES_PAR_PAIE,
  type IdLiaison,
} from '../jeu/donnees'
import {
  activiteEmploye,
  ameliorerEmploye,
  ameliorerRecruteur,
  chancesRecrutement,
  coutAmeliorationEmploye,
  coutSalaires,
  deposerTresorerie,
  depensesParPaie,
  manquePourUnePaie,
  embaucher,
  gainAmeliorationEmploye,
  changerTrajet,
  embaucherPousseur,
  peutEmbaucherPousseur,
  trajetPris,
  embaucherManager,
  iconeActiviteEmploye,
  indemnites,
  licencier,
  managerAuTravail,
  managerDebloque,
  maxEmployes,
  nbDuRole,
  nbDansSacEmploye,
  nbSansSalaire,
  payerSalaires,
  peutAmeliorerEmploye,
  peutAmeliorerRecruteur,
  peutPayerSalaires,
  prixEmbauche,
  prochainNiveauRecruteur,
  rareteDe,
  recruteurDebloque,
  retirerTresorerie,
  salaireEmploye,
  salaireManager,
  salairesParPaie,
  secondesRestantesEmploye,
  tailleSacEmploye,
  tempsPayeMin,
  vitesseEmploye,
} from '../jeu/employes'
import type { Employe, EtatJeu } from '../jeu/mineur'
import { batimentPose } from '../jeu/village'
import { capaciteWagonnet, forcePousseur, ligneDe, trajetDe } from '../jeu/wagonnet'
import { revenuBrutEmploye } from '../jeu/revenu'
import type { Action } from '../usePartie'
import { Achat, Amelioration, BadgeXp } from './Amelioration'
import { Barre } from './Barre'
import { Confirmation } from './Confirmation'
import { OngletsPanneau } from './OngletsPanneau'
import { RevelationRecrue } from './RevelationRecrue'
import { verrou } from '../jeu/niveaux'

type Props = { etat: EtatJeu; jouer: (action: Action) => EtatJeu }
type PropsPanneau = Props & { onApercuTrajet?: (liaison: IdLiaison | null) => void }

// « Mine → Marché ».
function nomTrajet(liaison: IdLiaison): string {
  return `${BATIMENTS[LIAISONS[liaison].depart].nom} → ${BATIMENTS[LIAISONS[liaison].arrivee].nom}`
}

function argent(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} $`
}

// « 1 h 05 min », « 12 min », « 45 s ». (23/10) Les minutes sont arrondies au-dessus : un
// salaire de 5 minutes qui vient de commencer affiche « 5 min » (avant, « 4 min »).
function duree(secondes: number): string {
  if (secondes < 60) return `${Math.max(0, Math.ceil(secondes))} s`
  const minutes = Math.ceil(secondes / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

// Les chances de chaque rareté, en petites pastilles de couleur.
function Chances({ etat, apercu }: { etat: EtatJeu; apercu: boolean }) {
  // Sans recruteur, on montre ce qu'il donnera dès son embauche.
  const chances = apercu ? NIVEAUX_RECRUTEUR[0].chances : chancesRecrutement(etat)
  return (
    <ul className="chances-rarete">
      {LISTE_RARETES.map((id) => (
        <li key={id} className={`pastille-rarete rarete-${id}`}>
          {RARETES[id].nom} <strong>{chances[id].toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %</strong>
          {RARETES[id].rendement > 1 && <em> ×{RARETES[id].rendement.toLocaleString('fr-FR')}</em>}
        </li>
      ))}
    </ul>
  )
}

// Les salaires (sans le manager) : on complète jusqu'à 5 minutes payées, pas plus (pour
// payer d'avance plus longtemps, il faut le manager, au niveau 4 de la mine).
function Salaires({ etat, jouer }: Props) {
  const sansSalaire = nbSansSalaire(etat)
  const cout10 = coutSalaires(etat, SECONDES_PAR_PAIE)
  return (
    // Sur une ligne (27/10) : le total, le temps payé et le bouton ; l'alerte dessous s'il le faut.
    <div className={`ligne-achat carte-salaires ${sansSalaire > 0 ? 'carte-alerte' : ''}`}>
      <div className="ligne-titre">
        <strong title={`${argent(salairesParPaie(etat))} toutes les 5 minutes${etat.niveauMine < NIVEAU_MINE_MANAGER ? ` (le manager, au niveau ${NIVEAU_MINE_MANAGER} de la mine, les paiera pour toi)` : ''}`}>
          💵 Salaires
        </strong>
        <span className="discret salaires-resume">
          {argent(salairesParPaie(etat))}/5 min{sansSalaire === 0 && ` · payés ${duree(tempsPayeMin(etat))}`}
        </span>
        <button
          className="bouton bouton-petit bouton-payer"
          disabled={!peutPayerSalaires(etat, SECONDES_PAR_PAIE)}
          onClick={() => jouer((e) => payerSalaires(e, SECONDES_PAR_PAIE))}
        >
          Payer · {argent(cout10)}
        </button>
      </div>
      {sansSalaire > 0 && (
        <span className="texte-alerte">
          {sansSalaire === 1 ? '😠 Un mineur attend son salaire : il ne creuse plus !' : `😠 ${sansSalaire} mineurs attendent leur salaire : ils ne creusent plus !`}
        </span>
      )}
    </div>
  )
}

// Le titre de la carte du manager ou du recruteur, avec son portrait (le même hamster que celui
// qui attend devant le Personnel, au village).
function TitreChef({ role, titre, children }: { role: 'manager' | 'recruteur'; titre: string; children?: ReactNode }) {
  return (
    <div className="ligne-titre titre-chef">
      <img className="portrait-chef" src={`/images/personnages/${role}.webp`} alt="" width={56} height={56} draggable={false} />
      <strong>{titre}</strong>
      {children}
    </div>
  )
}

// Le manager (niveau 4 de la mine) et sa trésorerie.
function Manager({ etat, jouer }: Props) {
  if (!managerDebloque(etat)) {
    return (
      <div className="ligne-achat verrouille">
        <strong>
          🔒 Manager · {etat.niveauMine < NIVEAU_MINE_MANAGER ? `mine niveau ${NIVEAU_MINE_MANAGER}` : <BadgeXp texte={`⭐ ${NIVEAU_JOUEUR_POUR.manager}`} />}
        </strong>
        <span className="discret">Il paiera tous les salaires tout seul, avec l'argent que tu mets dans une cagnotte (la trésorerie).</span>
      </div>
    )
  }
  if (!etat.manager.embauche) {
    return (
      <div className="ligne-achat carte-manager">
        <TitreChef role="manager" titre="💼 Manager" />
        <span className="discret">
          Il paie les salaires tout seul (le sien aussi : {argent(salaireManager())} toutes les 5 minutes), avec l'argent de la trésorerie. Fini
          les mineurs qui attendent !
        </span>
        <Achat
          etat={etat}
          cout={{ argent: PRIX_MANAGER, materiaux: {} }}
          texte="💼 Embaucher le manager"
          possible={etat.argent >= PRIX_MANAGER}
          onAcheter={() => jouer(embaucherManager)}
        />
      </div>
    )
  }
  const depenses = depensesParPaie(etat)
  const manque = manquePourUnePaie(etat)
  const vide = !managerAuTravail(etat) || nbSansSalaire(etat) > 0
  return (
    <div className={`ligne-achat carte-manager ${vide ? 'carte-alerte' : ''}`}>
      <TitreChef role="manager" titre="💼 Manager">
        <span className={`badge ${vide ? '' : 'badge-vert'}`}>{managerAuTravail(etat) ? 'Au travail' : '😠 Pas payé'}</span>
      </TitreChef>
      <div className="tresorerie">
        <span>Trésorerie</span>
        <strong>{argent(etat.tresorerie)}</strong>
      </div>
      {/* Combien il faut pour payer tout le monde une fois (5 min) : la jauge se remplit jusque-là. */}
      <Barre
        valeur={etat.tresorerie}
        max={depenses}
        texte={manque > 0 ? `Une paie de toute l'équipe : ${argent(etat.tresorerie)} / ${argent(depenses)}` : `✔ Une paie de toute l'équipe : ${argent(depenses)}`}
        couleur={manque > 0 ? 'rouge' : 'vert'}
      />
      {manque > 0 && (
        <div className="module-ligne">
          <span className="texte-alerte">Il manque {argent(manque)} pour payer tout le monde (le manager se paie d'abord, puis les mineurs les moins chers).</span>
          <button
            className="bouton bouton-petit bouton-payer"
            disabled={etat.argent < manque}
            onClick={() => jouer((e) => deposerTresorerie(e, manquePourUnePaie(e)))}
          >
            +{argent(manque)}
          </button>
        </div>
      )}
      <span className={vide ? 'texte-alerte' : 'discret'}>
        {vide
          ? '💼 La trésorerie est vide : remets de l’argent, sinon personne n’est payé !'
          : `La trésorerie tient environ ${duree((etat.tresorerie / depenses) * SECONDES_PAR_PAIE)}.`}
      </span>
      <div className="boutons">
        <button
          className="bouton bouton-petit bouton-payer"
          disabled={etat.argent < 1}
          onClick={() => jouer((e) => deposerTresorerie(e, Math.max(0, 6 * depensesParPaie(e) - e.tresorerie)))}
          title="Assez pour payer toute l'équipe pendant 1 h"
        >
          Remplir pour 1 h
        </button>
        {[10000].map((montant) => (
          <button
            key={montant}
            className="bouton bouton-petit bouton-payer"
            disabled={etat.argent < 1}
            onClick={() => jouer((e) => deposerTresorerie(e, montant))}
          >
            +{montant.toLocaleString('fr-FR')} $
          </button>
        ))}
        <button className="bouton bouton-petit bouton-payer" disabled={etat.argent < 1} onClick={() => jouer((e) => deposerTresorerie(e, e.argent))}>
          Tout mettre
        </button>
        <button
          className="bouton bouton-petit bouton-neutre"
          disabled={etat.tresorerie < 1}
          onClick={() => jouer((e) => retirerTresorerie(e, e.tresorerie))}
        >
          Tout reprendre
        </button>
      </div>
    </div>
  )
}

// Le recruteur (niveau 3 de la mine) : il trouve des mineurs rares. Il se paie seulement en argent.
function Recruteur({ etat, jouer }: Props) {
  if (!recruteurDebloque(etat)) {
    return (
      <div className="ligne-achat verrouille">
        <strong>🔒 Recruteur · mine niveau {NIVEAU_MINE_RECRUTEUR}</strong>
        <span className="discret">
          Pour l'instant, tous tes mineurs sont communs. Le recruteur trouvera des mineurs rares, épiques, légendaires... et même mythiques,
          qui rapportent jusqu'à 5 fois plus !
        </span>
        <Chances etat={etat} apercu />
      </div>
    )
  }
  const prochain = prochainNiveauRecruteur(etat)
  return (
    <div className="ligne-achat carte-recruteur">
      <TitreChef role="recruteur" titre="🎩 Recruteur" />
      <span className="discret">
        {etat.recruteur === 0
          ? 'Embauche-le : chaque nouveau mineur aura une rareté tirée au hasard. Plus il a de niveaux, plus les mineurs rares sortent souvent.'
          : 'Chances à la prochaine embauche :'}
      </span>
      <Chances etat={etat} apercu={etat.recruteur === 0} />
      <Amelioration
        etat={etat}
        actuel={etat.recruteur === 0 ? 'Pas encore embauché' : `Niveau ${etat.recruteur}`}
        niveau={etat.recruteur}
        niveauMax={NIVEAUX_RECRUTEUR.length}
        suivant={prochain && { cout: prochain.cout, texte: etat.recruteur === 0 ? '🎩 Embaucher' : `⬆ Niveau ${etat.recruteur + 1}` }}
        verrou={verrou(etat, 'recruteur', etat.recruteur)}
        possible={peutAmeliorerRecruteur(etat)}
        onAmeliorer={() => jouer(ameliorerRecruteur)}
        genre={etat.recruteur === 0 ? 'acheter' : 'ameliorer'}
      />
    </div>
  )
}

// La carte d'un mineur, compacte pour voir toute l'équipe d'un coup d'œil :
//   - son nom, sa rareté, ce qu'il fait (icône + temps restant) et « Licencier » ;
//   - pour un pousseur : son trajet (on peut le changer) ;
//   - ce qu'il creuse, son salaire et ce qu'il rapporte, sur une ligne ;
//   - ce qu'il fait en ce moment ;
//   - deux petites jauges côte à côte : le temps payé et le sac ;
//   - sa prochaine pioche : ses blocs par seconde avant ➜ après, et le bouton.
// (23/10) Tout est sur la carte, directement dans l'onglet Employés : plus de fiche à ouvrir.
// « 0,5 », « 1,2 » : des blocs par seconde, lisibles.
const blocsParS = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

function CarteMineur({ etat, jouer, employe, index, onLicencier }: Props & { employe: Employe; index: number; onLicencier: () => void }) {
  const rarete = rareteDe(employe)
  const coutPioche = coutAmeliorationEmploye(employe)
  const prochaine = NIVEAUX_EMPLOYE[employe.niveau + 1]
  const gain = gainAmeliorationEmploye(employe)
  // Ce que valent en moyenne les blocs qu'il remonte en 5 minutes.
  const rapporte = revenuBrutEmploye(etat, { ...employe, role: 'mineur' }) * SECONDES_PAR_PAIE
  const etape = employe.etape === 'attend' ? 'pas payé' : employe.etape === 'quai' || employe.etape === 'pousse' || employe.etape === 'creuse' ? '' : `${Math.ceil(secondesRestantesEmploye(etat, employe))} s`
  const pousseur = employe.role === 'pousseur'
  // (23/10) Pour un pousseur : son niveau, le suivant, et les places de son wagonnet avant / après.
  const niveauPousseurActuel = NIVEAUX_POUSSEUR[Math.min(employe.niveau, NIVEAUX_POUSSEUR.length - 1)]
  const niveauPousseurSuivant = pousseur ? (NIVEAUX_POUSSEUR[employe.niveau + 1] ?? null) : null
  const placesAvant = Math.round(capaciteWagonnet(etat) * niveauPousseurActuel.places)
  const placesApres = niveauPousseurSuivant ? Math.round(capaciteWagonnet(etat) * niveauPousseurSuivant.places) : placesAvant

  return (
    <div className={`ligne-achat carte-employe carte-compacte rarete-${employe.rarete} ${employe.tempsPaye > 0 ? '' : 'carte-employe-alerte'}`}>
      <div className="ligne-titre">
        <strong className="nom-employe">
          {employe.nom}
          <span className={`pastille-rarete rarete-${employe.rarete}`}>
            {rarete.nom}
            {rarete.rendement > 1 && ` ×${(pousseur ? forcePousseur(rarete.id) : rarete.rendement).toLocaleString('fr-FR')}`}
          </span>
          <span className="etape-employe">
            {iconeActiviteEmploye(employe)} {etape}
          </span>
        </strong>
        <button className="lien lien-licencier" disabled={employe.etape === 'pousse'} onClick={onLicencier} title="Licencier ce mineur">
          Licencier
        </button>
      </div>
      {pousseur ? (
        <div className="module-ligne">
          <span className="discret">
            🛤️ Pousse le wagonnet {employe.trajet ? <strong>{nomTrajet(employe.trajet)}</strong> : 'de… (aucun trajet)'} · {placesAvant} places · arrêts de {secondes(niveauPousseurActuel.secondesArret)} · salaire {argent(salaireEmploye(employe))} / 5 min
          </span>
          <select
            className="choix-trajet"
            value={employe.trajet ?? ''}
            onChange={(ev) => jouer((e) => changerTrajet(e, index, ev.target.value as IdLiaison))}
            title="Changer son trajet"
          >
            {LISTE_LIAISONS.filter((l) => l === employe.trajet || ligneDe(etat, l) !== null).map((l) => (
              // (23/10) un trajet qui a déjà son pousseur ne se choisit pas
              <option key={l} value={l} disabled={l !== employe.trajet && trajetPris(etat, l)}>
                {nomTrajet(l)}
                {l !== employe.trajet && trajetPris(etat, l) ? ' (déjà un pousseur)' : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="module-ligne">
          {/* (23/10) Tout est visible sur sa carte : ce qu'il creuse, son salaire, ce qu'il fait. */}
          <span className="discret">
            ⛏️ <strong>{blocsParS(vitesseEmploye(employe))} bloc/s</strong> · salaire {argent(salaireEmploye(employe))} / 5 min · rapporte ≈ {argent(rapporte)} / 5 min
          </span>
        </div>
      )}
      <span className="discret activite-employe">
        {activiteEmploye(etat, employe)}
        {!pousseur && ` · ${employe.blocsCasses.toLocaleString('fr-FR')} blocs cassés`}
      </span>
      <div className="jauges-employe">
        <Barre
          valeur={employe.tempsPaye}
          max={Math.max(SECONDES_PAR_PAIE, employe.tempsPaye)}
          texte={employe.tempsPaye > 0 ? `⏳ ${duree(employe.tempsPaye)}` : '😠 Plus payé'}
          couleur={employe.tempsPaye > 0 ? 'vert' : 'rouge'}
        />
        {!pousseur && (
          <Barre
            valeur={nbDansSacEmploye(employe)}
            max={tailleSacEmploye(employe)}
            texte={`🎒 ${nbDansSacEmploye(employe)} / ${tailleSacEmploye(employe)}`}
            couleur="or"
          />
        )}
      </div>
      {/* Sa pioche : seulement s'il reste une amélioration (au niveau max, rien à montrer). */}
      {!pousseur && coutPioche !== null && prochaine && gain && (
      <>
      {/* (23/10) Ce que change la nouvelle pioche, en grand : ses blocs par seconde, avant → après. */}
      <div className="gain-pioche" aria-label={`Nouvelle pioche : ${blocsParS(gain.avant)} puis ${blocsParS(gain.apres)} blocs par seconde`}>
        <span className="gain-pioche-avant">{blocsParS(gain.avant)}</span>
        <span className="gain-pioche-fleche" aria-hidden="true">
          ➜
        </span>
        <span className="gain-pioche-apres">{blocsParS(gain.apres)}</span>
        <span className="gain-pioche-unite">bloc/s</span>
      </div>
      <Amelioration
        etat={etat}
        actuel={`⛏️ Pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom}`}
        niveau={employe.niveau + 1}
        niveauMax={NIVEAUX_EMPLOYE.length}
        suivant={coutPioche !== null && prochaine ? { cout: coutPioche, texte: `⬆ Pioche en ${prochaine.nom}` } : null}
        verrou={verrou(etat, 'equipement', employe.niveau + 1)}
        possible={peutAmeliorerEmploye(etat, employe)}
        onAmeliorer={() => jouer((e) => ameliorerEmploye(e, index))}
      />
      </>
      )}
      {/* (23/10) Le niveau d'un pousseur : son wagonnet porte plus, et ses arrêts (charger,
          décharger, vendre) sont plus courts. Avant ➜ après, en grand, comme la pioche. */}
      {pousseur && niveauPousseurSuivant && (
        <>
          <div className="gain-pioche" aria-label={`Niveau suivant : ${placesAvant} puis ${placesApres} places, arrêts de ${secondes(niveauPousseurActuel.secondesArret)} puis ${secondes(niveauPousseurSuivant.secondesArret)}`}>
            <span className="gain-pioche-avant">{placesAvant}</span>
            <span className="gain-pioche-fleche" aria-hidden="true">
              ➜
            </span>
            <span className="gain-pioche-apres">{placesApres}</span>
            <span className="gain-pioche-unite">places</span>
            <span className="gain-pioche-avant">⏱ {secondes(niveauPousseurActuel.secondesArret)}</span>
            <span className="gain-pioche-fleche" aria-hidden="true">
              ➜
            </span>
            <span className="gain-pioche-apres">{secondes(niveauPousseurSuivant.secondesArret)}</span>
          </div>
          <Amelioration
            etat={etat}
            actuel={`🛤️ Pousseur ${niveauPousseurActuel.nom.toLowerCase()}`}
            niveau={employe.niveau + 1}
            niveauMax={NIVEAUX_POUSSEUR.length}
            suivant={coutPioche !== null ? { cout: coutPioche, texte: `⬆ Pousseur ${niveauPousseurSuivant.nom.toLowerCase()}` } : null}
            verrou={verrou(etat, 'pousseur', employe.niveau + 1)}
            possible={peutAmeliorerEmploye(etat, employe)}
            onAmeliorer={() => jouer((e) => ameliorerEmploye(e, index))}
          />
        </>
      )}
    </div>
  )
}

// « 1,6 s »
const secondes = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`

// L'embauche d'un pousseur (26/10) : on choisit le départ, puis l'arrivée de son trajet ; le
// trajet brille sur la carte (s'il y a des rails), puis on confirme.
function EmbauchePousseur({ etat, jouer, onApercuTrajet, onRecrue }: PropsPanneau & { onRecrue: (employe: Employe) => void }) {
  // Tous les trajets possibles (leurs deux bâtiments sont posés), dans une liste à cocher (28/10) :
  // on voit d'un coup d'œil lesquels ont des rails et combien de pousseurs ils ont déjà.
  const trajets = LISTE_LIAISONS.filter((l) => batimentPose(etat.village, LIAISONS[l].depart) && batimentPose(etat.village, LIAISONS[l].arrivee))
  const avecDesRails = trajets.filter((l) => ligneDe(etat, l) !== null)
  // (23/10) Un seul pousseur par trajet : on propose seulement les trajets libres.
  const libres = avecDesRails.filter((l) => !trajetPris(etat, l))
  const [liaison, setLiaison] = useState<IdLiaison | null>(libres.length === 1 ? libres[0] : null)
  const choisie = liaison && trajets.includes(liaison) && !trajetPris(etat, liaison) ? liaison : null
  const avecRails = choisie !== null && ligneDe(etat, choisie) !== null
  // Le trajet choisi brille sur la carte (et plus rien quand on ferme le panneau).
  useEffect(() => {
    onApercuTrajet?.(avecRails ? choisie : null)
  }, [choisie, avecRails, onApercuTrajet])
  useEffect(() => () => onApercuTrajet?.(null), [onApercuTrajet])
  const prix = prixEmbauche(etat, 'pousseur')
  if (trajets.length === 0) return null
  return (
    <div className="ligne-achat carte-pousseur">
      <div className="ligne-titre">
        <strong>🛤️ Embaucher un pousseur</strong>
      </div>
      <span className="discret">Il pousse le wagonnet d'un seul trajet. Coche son trajet :</span>
      <div className="liste-trajets-pousseur" role="radiogroup">
        {trajets.map((l) => {
          const rails = ligneDe(etat, l) !== null
          const sonPousseur = etat.employes.find((e) => e.role === 'pousseur' && e.trajet === l)
          return (
            <label key={l} className={`trajet-pousseur ${choisie === l ? 'choisi' : ''} ${rails && !sonPousseur ? '' : 'sans-rails'}`}>
              <input type="radio" name="trajet-pousseur" checked={choisie === l} disabled={sonPousseur !== undefined} onChange={() => setLiaison(l)} />
              <span className="trajet-pousseur-nom">
                {BATIMENTS[LIAISONS[l].depart].emoji} {BATIMENTS[LIAISONS[l].depart].nom} → {BATIMENTS[LIAISONS[l].arrivee].emoji}{' '}
                {BATIMENTS[LIAISONS[l].arrivee].nom}
              </span>
              <span className={`badge ${sonPousseur ? '' : !rails ? 'badge-rouge' : 'badge-vert'}`}>
                {sonPousseur ? `✔ ${sonPousseur.nom}` : !rails ? 'Pas de rails' : 'Libre'}
              </span>
            </label>
          )
        })}
      </div>
      {choisie &&
        (avecRails ? (
          <span className="texte-ok">
            ✨ Le trajet {nomTrajet(choisie)} brille sur la carte.{!trajetDe(etat, choisie) && ' Son wagonnet sera créé avec l’embauche.'}
          </span>
        ) : (
          <span className="texte-alerte">Pas de rails entre ces deux bâtiments : pose-les d'abord (menu Bâtiments).</span>
        ))}
      {prix === null || trajets.every((l) => trajetPris(etat, l)) ? (
        <span className="discret">Chaque trajet a déjà son pousseur (un seul par trajet). Améliore-les dans l’onglet Employés : leur wagonnet portera plus, et ils iront plus vite.</span>
      ) : (
        <Achat
          etat={etat}
          cout={{ argent: prix, materiaux: {} }}
          texte={etat.recruteur > 0 ? '🎲 Recruter pour ce trajet' : '🛤️ Embaucher pour ce trajet'}
          possible={choisie !== null && peutEmbaucherPousseur(etat, choisie)}
          onAcheter={() => {
            if (!choisie) return
            const avant = etat.employes.length
            const apres = jouer((e) => embaucherPousseur(e, aleatoireNavigateur, choisie))
            // Avec le recruteur, sa rareté est une surprise : on la dévoile en grand, comme pour un mineur.
            if (etat.recruteur > 0 && apres.employes.length > avant) onRecrue(apres.employes[apres.employes.length - 1])
          }}
          genre="recruter"
        />
      )}
    </div>
  )
}

export function PanneauEmployes({ etat, jouer, onApercuTrajet }: PropsPanneau) {
  // Le mineur qu'on vient de recruter (avec le recruteur) : on dévoile sa rareté en grand.
  const [recrue, setRecrue] = useState<Employe | null>(null)
  // Le mineur qu'on veut licencier : on demande d'abord confirmation (fenêtre du jeu).
  const [aLicencier, setALicencier] = useState<number | null>(null)

  const [onglet, setOnglet] = useState<'equipe' | 'recruter' | 'chefs'>(etat.employes.length === 0 ? 'recruter' : 'equipe')
  const prix = prixEmbauche(etat)
  const max = maxEmployes(etat)
  const avecRecruteur = etat.recruteur > 0

  function recruter() {
    const avant = etat.employes.length
    const apres = jouer((e) => embaucher(e, aleatoireNavigateur))
    if (avecRecruteur && apres.employes.length > avant) setRecrue(apres.employes[apres.employes.length - 1])
  }

  const sansSalaire = nbSansSalaire(etat)
  const managerVide = etat.manager.embauche && !managerAuTravail(etat)
  return (
    <div className="liste-cartes">
      {/* Trois onglets (27/10) : les employés (et les salaires), recruter, les chefs. */}
      <OngletsPanneau
        onglets={[
          { id: 'equipe', titre: `👷 Employés (${etat.employes.length})`, pastille: sansSalaire > 0 ? '!' : null },
          { id: 'recruter', titre: '➕ Recruter', pastille: prix !== null && etat.argent >= prix ? '+' : null },
          { id: 'chefs', titre: '💼 Chefs', pastille: managerVide ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />

      {onglet === 'equipe' && etat.employes.length === 0 && (
        <div className="ligne-achat">
          <span className="discret">Personne pour l'instant. Tes mineurs creuseront pour toi, même jeu fermé !</span>
          <button className="bouton bouton-petit bouton-acheter" onClick={() => setOnglet('recruter')}>
            ➕ Recruter un mineur
          </button>
        </div>
      )}
      {onglet === 'equipe' && etat.employes.length > 0 && !etat.manager.embauche && <Salaires etat={etat} jouer={jouer} />}
      {/* (23/10) Tous les employés, chacun sa carte avec ses infos et ses stats (plus de fiche à
          ouvrir) : les mineurs, puis les pousseurs. */}
      {onglet === 'equipe' && etat.employes.length > 0 && (
        <div className="liste-employes">
          {etat.employes
            .map((employe, index) => ({ employe, index }))
            .sort((a, b) => (a.employe.role === b.employe.role ? 0 : a.employe.role === 'mineur' ? -1 : 1))
            .map(({ employe, index }) => (
              <CarteMineur key={`${employe.nom}-${index}`} etat={etat} jouer={jouer} employe={employe} index={index} onLicencier={() => setALicencier(index)} />
            ))}
        </div>
      )}

      {onglet === 'chefs' && <Manager etat={etat} jouer={jouer} />}
      {onglet === 'chefs' && <Recruteur etat={etat} jouer={jouer} />}

      {onglet === 'recruter' && (
        <div className={`ligne-achat ${avecRecruteur ? 'carte-recrutement' : ''}`}>
          <div className="ligne-titre">
            <strong>{avecRecruteur ? '🎲 Recruter un mineur' : '👷 Embaucher un mineur'}</strong>
            <span className="badge">
              {nbDuRole(etat, 'mineur')} / {max}
            </span>
          </div>
          {prix === null ? (
            <span className="discret">
              Tu as tous tes mineurs. Chaque niveau de la mine te permet d'en employer 2 de plus.
              {avecRecruteur && ' Licencie un mineur pour tenter ta chance avec un autre !'}
            </span>
          ) : (
            <>
              <span className="discret">
                {avecRecruteur ? 'Commun, rare... ou mythique ? On ne refuse personne : c’est la surprise ! ' : ''}
                Ses 10 premières minutes de salaire sont comprises. Le prix monte avec la taille de l'équipe.
              </span>
              <Achat
                etat={etat}
                cout={{ argent: prix, materiaux: {} }}
                texte={avecRecruteur ? '🎲 Recruter' : '👷 Embaucher'}
                possible={etat.argent >= prix}
                onAcheter={recruter}
                genre={avecRecruteur ? 'recruter' : 'acheter'}
              />
            </>
          )}
        </div>
      )}

      {onglet === 'recruter' && <EmbauchePousseur etat={etat} jouer={jouer} onApercuTrajet={onApercuTrajet} onRecrue={setRecrue} />}

      {recrue && <RevelationRecrue employe={recrue} onFermer={() => setRecrue(null)} />}
      {aLicencier !== null && etat.employes[aLicencier] && (
        <Confirmation
          titre={`Licencier ${etat.employes[aLicencier].nom} ?`}
          texteConfirmer="Licencier"
          possible={etat.argent >= indemnites(etat, etat.employes[aLicencier].role)}
          onConfirmer={() => {
            jouer((e) => licencier(e, aLicencier))
            setALicencier(null)
          }}
          onAnnuler={() => setALicencier(null)}
        >
          <p>
            {etat.employes[aLicencier].nom} ({rareteDe(etat.employes[aLicencier]).nom.toLowerCase()}) part avec son équipement.
          </p>
          <p>
            Indemnités : <strong>{argent(indemnites(etat, etat.employes[aLicencier].role))}</strong>
            {etat.argent < indemnites(etat, etat.employes[aLicencier].role) && (
              <span className="texte-alerte"> (il te manque {argent(indemnites(etat, etat.employes[aLicencier].role) - etat.argent)})</span>
            )}
          </p>
        </Confirmation>
      )}
    </div>
  )
}
