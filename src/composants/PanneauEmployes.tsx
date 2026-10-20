// Le stand Personnel (débloqué au prestige 2) : on embauche des mineurs qui creusent tout
// seuls, remontent vendre leur récolte et te donnent l'argent. On leur paie un salaire toutes
// les 10 minutes (ou c'est le manager qui s'en charge, au prestige 5). Au prestige 4, le
// recruteur trouve des mineurs plus ou moins rares : chaque embauche est une surprise.

import { useState } from 'react'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import {
  LISTE_RARETES,
  NIVEAUX_EMPLOYE,
  NIVEAUX_RECRUTEUR,
  PRESTIGE_EMPLOYES,
  PRESTIGE_MANAGER,
  PRESTIGE_RECRUTEUR,
  PRIX_MANAGER,
  RARETES,
  SECONDES_PAR_PAIE,
  SECONDES_PAYEES_MAX,
  niveauMaxAuPrestige,
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
  embaucher,
  embaucherManager,
  employeBloqueAuPrestige,
  employesDebloques,
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
  profondeurMaxEmploye,
  rareteDe,
  recruteurBloqueAuPrestige,
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
import { aLaSurface, type Employe, type EtatJeu } from '../jeu/mineur'
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

// Les salaires (sans le manager) : on paie 10 minutes de plus, ou tout le monde jusqu'à 1 h.
function Salaires({ etat, jouer }: Props) {
  const sansSalaire = nbSansSalaire(etat)
  const cout10 = coutSalaires(etat, SECONDES_PAR_PAIE)
  const cout1h = coutSalaires(etat, SECONDES_PAYEES_MAX)
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
          : `Tout le monde est payé pour encore ${duree(tempsPayeMin(etat))}. On peut payer d'avance, jusqu'à 1 h.`}
      </span>
      <div className="boutons">
        <button
          className="bouton bouton-petit bouton-payer"
          disabled={!aLaSurface(etat) || !peutPayerSalaires(etat, SECONDES_PAR_PAIE)}
          onClick={() => jouer((e) => payerSalaires(e, SECONDES_PAR_PAIE))}
        >
          💵 +10 min · {argent(cout10)}
        </button>
        <button
          className="bouton bouton-petit bouton-payer"
          disabled={!aLaSurface(etat) || !peutPayerSalaires(etat, SECONDES_PAYEES_MAX)}
          onClick={() => jouer((e) => payerSalaires(e, SECONDES_PAYEES_MAX))}
        >
          💵 Payer 1 h · {argent(cout1h)}
        </button>
      </div>
    </div>
  )
}

// Le manager (prestige 5) et sa trésorerie.
function Manager({ etat, jouer }: Props) {
  if (!managerDebloque(etat)) {
    return (
      <div className="ligne-achat verrouille">
        <strong>🔒 Manager · prestige {PRESTIGE_MANAGER}</strong>
        <span className="discret">Il paiera tous les salaires tout seul, avec l'argent que tu mets dans une cagnotte (la trésorerie).</span>
      </div>
    )
  }
  if (!etat.manager.embauche) {
    return (
      <div className="ligne-achat carte-manager">
        <strong>💼 Manager</strong>
        <span className="discret">
          Il paie les salaires tout seul (le sien aussi : {argent(salaireManager())} toutes les 10 minutes), avec l'argent de la trésorerie. Fini
          les mineurs qui attendent !
        </span>
        <Achat
          etat={etat}
          cout={{ argent: PRIX_MANAGER, materiaux: {} }}
          texte="💼 Embaucher le manager"
          possible={aLaSurface(etat) && etat.argent >= PRIX_MANAGER}
          onAcheter={() => jouer(embaucherManager)}
        />
      </div>
    )
  }
  const depenses = depensesParPaie(etat)
  const vide = !managerAuTravail(etat) || nbSansSalaire(etat) > 0
  return (
    <div className={`ligne-achat carte-manager ${vide ? 'carte-alerte' : ''}`}>
      <div className="ligne-titre">
        <strong>💼 Manager</strong>
        <span className={`badge ${vide ? '' : 'badge-vert'}`}>{managerAuTravail(etat) ? 'Au travail' : '😠 Pas payé'}</span>
      </div>
      <div className="tresorerie">
        <span>Trésorerie</span>
        <strong>{argent(etat.tresorerie)}</strong>
      </div>
      <span className={vide ? 'texte-alerte' : 'discret'}>
        {vide
          ? '💼 La trésorerie est vide : remets de l’argent, sinon personne n’est payé !'
          : `Salaires de l'équipe (manager compris) : ${argent(depenses)} toutes les 10 minutes. La trésorerie tient environ ${duree((etat.tresorerie / depenses) * SECONDES_PAR_PAIE)}.`}
      </span>
      <div className="boutons">
        {[1000, 10000, 100000].map((montant) => (
          <button
            key={montant}
            className="bouton bouton-petit bouton-payer"
            disabled={!aLaSurface(etat) || etat.argent < 1}
            onClick={() => jouer((e) => deposerTresorerie(e, montant))}
          >
            +{montant.toLocaleString('fr-FR')} $
          </button>
        ))}
        <button className="bouton bouton-petit bouton-payer" disabled={!aLaSurface(etat) || etat.argent < 1} onClick={() => jouer((e) => deposerTresorerie(e, e.argent))}>
          Tout mettre
        </button>
        <button
          className="bouton bouton-petit bouton-neutre"
          disabled={!aLaSurface(etat) || etat.tresorerie < 1}
          onClick={() => jouer((e) => retirerTresorerie(e, e.tresorerie))}
        >
          Tout reprendre
        </button>
      </div>
      <span className="discret">⚠️ Au prestige, la trésorerie repart de 0 (comme ton argent).</span>
    </div>
  )
}

// Le recruteur (prestige 4) : il trouve des mineurs rares. Il se paie seulement en argent.
function Recruteur({ etat, jouer }: Props) {
  if (!recruteurDebloque(etat)) {
    return (
      <div className="ligne-achat verrouille">
        <strong>🔒 Recruteur débloquable au prestige {PRESTIGE_RECRUTEUR}</strong>
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
      <strong>🎩 Recruteur</strong>
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
        niveauPermis={niveauMaxAuPrestige('recruteur', etat.prestige)}
        suivant={prochain && { cout: prochain.cout, texte: etat.recruteur === 0 ? '🎩 Embaucher' : `⬆ Niveau ${etat.recruteur + 1}` }}
        bloqueAuPrestige={recruteurBloqueAuPrestige(etat)}
        possible={aLaSurface(etat) && peutAmeliorerRecruteur(etat)}
        onAmeliorer={() => jouer(ameliorerRecruteur)}
        genre={etat.recruteur === 0 ? 'acheter' : 'ameliorer'}
      />
    </div>
  )
}

// La carte d'un mineur, compacte pour voir toute l'équipe d'un coup d'œil :
//   - son nom, sa rareté, ce qu'il fait (icône + profondeur ou temps restant) et « Licencier » ;
//   - ce qu'il rapporte et son salaire, sur une ligne ;
//   - deux petites jauges côte à côte : le temps payé et le sac ;
//   - l'amélioration de son équipement (prix et bouton).
// Le détail complet (activité, ce qu'il t'a rapporté...) est dans l'infobulle.
function CarteMineur({ etat, jouer, employe, index, onLicencier }: Props & { employe: Employe; index: number; onLicencier: () => void }) {
  const rarete = rareteDe(employe)
  const coutPioche = coutAmeliorationEmploye(employe)
  const prochaine = NIVEAUX_EMPLOYE[employe.niveau + 1]
  // Ce qu'il rapporte une fois au fond de sa galerie (là où sont les minerais les plus chers).
  const fond = profondeurMaxEmploye(etat, employe)
  const rapporte = revenuBrutEmploye(etat, { ...employe, profondeur: fond }) * SECONDES_PAR_PAIE
  const etape = employe.etape === 'creuse' ? `-${employe.profondeur} m` : employe.etape === 'attend' ? 'pas payé' : `${Math.ceil(secondesRestantesEmploye(etat, employe))} s`
  const detail = `${activiteEmploye(etat, employe)} · ${vitesseEmploye(etat, employe).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} bloc/s · t'a rapporté ${argent(employe.gagne)}`

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
        <button className="lien lien-licencier" disabled={!aLaSurface(etat)} onClick={onLicencier} title="Licencier ce mineur">
          Licencier
        </button>
      </div>
      <span className="discret">
        💰 ~{argent(rapporte)} / 10 min au fond (-{fond} m) · salaire {argent(salaireEmploye(etat, employe))}
      </span>
      <div className="jauges-employe">
        <Barre
          valeur={employe.tempsPaye}
          max={SECONDES_PAYEES_MAX}
          texte={employe.tempsPaye > 0 ? `⏳ ${duree(employe.tempsPaye)}` : '😠 Plus payé'}
          couleur={employe.tempsPaye > 0 ? 'vert' : 'rouge'}
        />
        <Barre
          valeur={nbDansSacEmploye(employe)}
          max={tailleSacEmploye(etat, employe)}
          texte={`🎒 ${nbDansSacEmploye(employe)} / ${tailleSacEmploye(etat, employe)}`}
          couleur="or"
        />
      </div>
      <Amelioration
        etat={etat}
        actuel={`Pioche en ${NIVEAUX_EMPLOYE[employe.niveau].nom}`}
        niveau={employe.niveau + 1}
        niveauMax={NIVEAUX_EMPLOYE.length}
        niveauPermis={niveauMaxAuPrestige('mineur', etat.prestige) + 1}
        suivant={coutPioche !== null && prochaine ? { cout: coutPioche, texte: `⬆ ${prochaine.nom}` } : null}
        bloqueAuPrestige={employeBloqueAuPrestige(etat, employe)}
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

  if (!employesDebloques(etat)) {
    return (
      <div className="liste-cartes">
        <div className="ligne-achat verrouille">
          <strong>🔒 Fermé par une barrière</strong>
          <span className="discret">
            Ce bureau d'embauche s'ouvre au prestige {PRESTIGE_EMPLOYES}. Tu pourras y employer des mineurs qui creusent pour toi, même quand
            le jeu est fermé.
          </span>
        </div>
      </div>
    )
  }

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
        Tes mineurs creusent et vendent pour toi (tout l'argent est pour toi), même jeu fermé. En échange : un salaire toutes les 10 minutes, sinon
        ils attendent ici, mécontents.
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
            Ton équipe est complète. Chaque prestige te permet d'en employer un de plus (6 au plus).
            {avecRecruteur && ' Licencie un mineur pour tenter ta chance avec un autre !'}
          </span>
        ) : (
          <>
            <span className="discret">
              {avecRecruteur ? 'Commun, rare... ou mythique ? On ne refuse personne : c’est la surprise ! ' : ''}
              Ses 10 premières minutes de salaire sont comprises.
            </span>
            <Achat
              etat={etat}
              cout={{ argent: prix, materiaux: {} }}
              texte={avecRecruteur ? '🎲 Recruter' : '👷 Embaucher'}
              possible={etat.argent >= prix && aLaSurface(etat)}
              onAcheter={recruter}
              genre={avecRecruteur ? 'recruter' : 'acheter'}
            />
          </>
        )}
      </div>

      {etat.employes.map((employe, index) => (
        <CarteMineur key={`${employe.nom}-${index}`} etat={etat} jouer={jouer} employe={employe} index={index} onLicencier={() => setALicencier(index)} />
      ))}

      {recrue && <RevelationRecrue employe={recrue} etat={etat} onFermer={() => setRecrue(null)} />}
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
