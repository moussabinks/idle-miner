// Le stand Personnel : on embauche des mineurs qui creusent tout seuls et remontent leur sac
// dans le coffre de la mine. Un mineur peut aussi pousser le wagonnet (rôle « pousseur »).
// On leur paie un salaire toutes les 10 minutes (ou c'est le manager qui s'en charge, au
// niveau 4 de la mine). Au niveau 3, le recruteur trouve des mineurs plus ou moins rares :
// chaque embauche est une surprise.

import { useState, type ReactNode } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import {
  LISTE_RARETES,
  NIVEAUX_EMPLOYE,
  NIVEAUX_RECRUTEUR,
  NIVEAU_MINE_MANAGER,
  NIVEAU_MINE_RECRUTEUR,
  PRIX_MANAGER,
  RARETES,
  SECONDES_PAR_PAIE,
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
  blocsParSecondeEmploye,
  changerRole,
  embaucherManager,
  iconeActiviteEmploye,
  indemnites,
  licencier,
  managerAuTravail,
  managerDebloque,
  maxEmployes,
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
import { revenuBrutEmploye } from '../jeu/revenu'
import type { Action } from '../usePartie'
import { Achat, Amelioration } from './Amelioration'
import { Barre } from './Barre'
import { Confirmation } from './Confirmation'
import { RevelationRecrue } from './RevelationRecrue'

type Props = { etat: EtatJeu; jouer: (action: Action) => EtatJeu }

function argent(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} $`
}

// « 1 h 05 min », « 12 min », « 45 s ».
function duree(secondes: number): string {
  const minutes = Math.floor(secondes / 60)
  if (minutes < 1) return `${Math.max(0, Math.ceil(secondes))} s`
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

// Les salaires (sans le manager) : on complète jusqu'à 10 minutes payées, pas plus (pour
// payer d'avance plus longtemps, il faut le manager, au niveau 4 de la mine).
function Salaires({ etat, jouer }: Props) {
  const sansSalaire = nbSansSalaire(etat)
  const cout10 = coutSalaires(etat, SECONDES_PAR_PAIE)
  return (
    <div className={`ligne-achat carte-salaires ${sansSalaire > 0 ? 'carte-alerte' : ''}`}>
      <div className="ligne-titre">
        <strong>💵 Salaires</strong>
        <span className="badge">{argent(salairesParPaie(etat))} / 10 min</span>
      </div>
      <span className={sansSalaire > 0 ? 'texte-alerte' : 'discret'}>
        {sansSalaire > 0
          ? sansSalaire === 1
            ? '😠 Un mineur attend son salaire : sans salaire, il ne creuse plus !'
            : `😠 ${sansSalaire} mineurs attendent leur salaire : sans salaire, ils ne creusent plus !`
          : `Tout le monde est payé pour encore ${duree(tempsPayeMin(etat))}. On paie 10 minutes à la fois${etat.niveauMine < NIVEAU_MINE_MANAGER ? ` (le manager, au niveau ${NIVEAU_MINE_MANAGER} de la mine, s'en chargera pour toi)` : ''}.`}
      </span>
      <div className="boutons">
        <button
          className="bouton bouton-petit bouton-payer"
          disabled={!peutPayerSalaires(etat, SECONDES_PAR_PAIE)}
          onClick={() => jouer((e) => payerSalaires(e, SECONDES_PAR_PAIE))}
        >
          💵 Payer 10 min · {argent(cout10)}
        </button>
      </div>
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
        <strong>🔒 Manager · niveau {NIVEAU_MINE_MANAGER} de la mine</strong>
        <span className="discret">Il paiera tous les salaires tout seul, avec l'argent que tu mets dans une cagnotte (la trésorerie).</span>
      </div>
    )
  }
  if (!etat.manager.embauche) {
    return (
      <div className="ligne-achat carte-manager">
        <TitreChef role="manager" titre="💼 Manager" />
        <span className="discret">
          Il paie les salaires tout seul (le sien aussi : {argent(salaireManager())} toutes les 10 minutes), avec l'argent de la trésorerie. Fini
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
      {/* Combien il faut pour payer tout le monde une fois (10 min) : la jauge se remplit jusque-là. */}
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
        {[1000, 10000, 100000].map((montant) => (
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
        <strong>🔒 Recruteur · niveau {NIVEAU_MINE_RECRUTEUR} de la mine</strong>
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
        possible={peutAmeliorerRecruteur(etat)}
        onAmeliorer={() => jouer(ameliorerRecruteur)}
        genre={etat.recruteur === 0 ? 'acheter' : 'ameliorer'}
      />
    </div>
  )
}

// La carte d'un mineur, compacte pour voir toute l'équipe d'un coup d'œil :
//   - son nom, sa rareté, ce qu'il fait (icône + temps restant) et « Licencier » ;
//   - son rôle (il creuse, ou il pousse le wagonnet) ;
//   - ce qu'il rapporte et son salaire, sur une ligne ;
//   - deux petites jauges côte à côte : le temps payé et le sac ;
//   - l'amélioration de son équipement (prix et bouton).
// Le détail complet (activité, ce qu'il t'a rapporté...) est dans l'infobulle.
function CarteMineur({ etat, jouer, employe, index, onLicencier }: Props & { employe: Employe; index: number; onLicencier: () => void }) {
  const rarete = rareteDe(employe)
  const coutPioche = coutAmeliorationEmploye(employe)
  const prochaine = NIVEAUX_EMPLOYE[employe.niveau + 1]
  // Ce que valent en moyenne les blocs qu'il remonte en 10 minutes.
  const rapporte = revenuBrutEmploye(etat, { ...employe, role: 'mineur' }) * SECONDES_PAR_PAIE
  const etape = employe.etape === 'attend' ? 'pas payé' : employe.etape === 'quai' || employe.etape === 'pousse' ? '' : `${Math.ceil(secondesRestantesEmploye(etat, employe))} s`
  const detail = `${activiteEmploye(etat, employe)} · ${vitesseEmploye(employe).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} bloc/s en creusant · ${employe.blocsCasses.toLocaleString('fr-FR')} blocs cassés`
  const pousseur = employe.role === 'pousseur'

  return (
    <div className={`ligne-achat carte-employe carte-compacte rarete-${employe.rarete}`} title={detail}>
      <div className="ligne-titre">
        <strong className="nom-employe">
          {employe.nom}
          <span className={`pastille-rarete rarete-${employe.rarete}`}>
            {rarete.nom}
            {rarete.rendement > 1 && ` ×${rarete.rendement.toLocaleString('fr-FR')}`}
          </span>
          <span className="etape-employe">
            {iconeActiviteEmploye(employe)} {etape}
          </span>
        </strong>
        <button className="lien lien-licencier" disabled={employe.etape === 'pousse'} onClick={onLicencier} title="Licencier ce mineur">
          Licencier
        </button>
      </div>
      <div className="module-ligne">
        <span className="discret">
          {pousseur
            ? `🛤️ Pousse le wagonnet · salaire ${argent(salaireEmploye(employe))}`
            : `⛏️ ~${argent(rapporte)} de blocs / 10 min (${(blocsParSecondeEmploye(etat, employe) * 60).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / min) · salaire ${argent(salaireEmploye(employe))}`}
        </span>
        <button
          className="bouton bouton-petit bouton-neutre"
          onClick={() => jouer((e) => changerRole(e, index, pousseur ? 'mineur' : 'pousseur'))}
          title={pousseur ? 'Il retourne creuser' : 'Il attend le wagonnet au quai et le pousse jusqu’au marché'}
        >
          {pousseur ? '⛏️ Creuser' : '🛤️ Pousser le wagonnet'}
        </button>
      </div>
      <div className="jauges-employe">
        <Barre
          valeur={employe.tempsPaye}
          max={Math.max(SECONDES_PAR_PAIE, employe.tempsPaye)}
          texte={employe.tempsPaye > 0 ? `⏳ ${duree(employe.tempsPaye)}` : '😠 Plus payé'}
          couleur={employe.tempsPaye > 0 ? 'vert' : 'rouge'}
        />
        <Barre
          valeur={nbDansSacEmploye(employe)}
          max={tailleSacEmploye(employe)}
          texte={`🎒 ${nbDansSacEmploye(employe)} / ${tailleSacEmploye(employe)}`}
          couleur="or"
        />
      </div>
      <Amelioration
        etat={etat}
        actuel={`Pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom}`}
        niveau={employe.niveau + 1}
        niveauMax={NIVEAUX_EMPLOYE.length}
        suivant={coutPioche !== null && prochaine ? { cout: coutPioche, texte: `⬆ ${prochaine.nom}` } : null}
        possible={peutAmeliorerEmploye(etat, employe)}
        onAmeliorer={() => jouer((e) => ameliorerEmploye(e, index))}
      />
    </div>
  )
}

export function PanneauEmployes({ etat, jouer }: Props) {
  // Le mineur qu'on vient de recruter (avec le recruteur) : on dévoile sa rareté en grand.
  const [recrue, setRecrue] = useState<Employe | null>(null)
  // Le mineur qu'on veut licencier : on demande d'abord confirmation (fenêtre du jeu).
  const [aLicencier, setALicencier] = useState<number | null>(null)

  const prix = prixEmbauche(etat)
  const max = maxEmployes(etat)
  const avecRecruteur = etat.recruteur > 0

  function recruter() {
    const avant = etat.employes.length
    const apres = jouer((e) => embaucher(e, aleatoireNavigateur))
    if (avecRecruteur && apres.employes.length > avant) setRecrue(apres.employes[apres.employes.length - 1])
  }

  return (
    <div className="liste-cartes">
      <p className="discret">
        Tes mineurs creusent pour toi et remontent leur sac dans le coffre de la mine, même jeu fermé. En échange : un salaire toutes les 10
        minutes, sinon ils attendent ici, mécontents.
      </p>

      {etat.employes.length > 0 && !etat.manager.embauche && <Salaires etat={etat} jouer={jouer} />}
      <Manager etat={etat} jouer={jouer} />
      <Recruteur etat={etat} jouer={jouer} />

      <div className={`ligne-achat ${avecRecruteur ? 'carte-recrutement' : ''}`}>
        <div className="ligne-titre">
          <strong>{avecRecruteur ? '🎲 Recruter un mineur' : '👷 Embaucher un mineur'}</strong>
          <span className="badge">
            {etat.employes.length} / {max}
          </span>
        </div>
        {prix === null ? (
          <span className="discret">
            Ton équipe est complète. Chaque niveau de la mine te permet d'en employer 2 de plus.
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

      {etat.employes.map((employe, index) => (
        <CarteMineur key={`${employe.nom}-${index}`} etat={etat} jouer={jouer} employe={employe} index={index} onLicencier={() => setALicencier(index)} />
      ))}

      {recrue && <RevelationRecrue employe={recrue} onFermer={() => setRecrue(null)} />}
      {aLicencier !== null && etat.employes[aLicencier] && (
        <Confirmation
          titre={`Licencier ${etat.employes[aLicencier].nom} ?`}
          texteConfirmer="Licencier"
          possible={etat.argent >= indemnites(etat)}
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
            Indemnités : <strong>{argent(indemnites(etat))}</strong>
            {etat.argent < indemnites(etat) && <span className="texte-alerte"> (il te manque {argent(indemnites(etat) - etat.argent)})</span>}
          </p>
        </Confirmation>
      )}
    </div>
  )
}
