// Ce qui guide le joueur au village :
//   - les bâtiments à construire (le marché d'abord : il est gratuit) ;
//   - les stands où une amélioration est payable tout de suite (pastille « Achetable ! ») ;
//   - le prochain objectif (la petite barre sous le bandeau : « Pioche en Fer : 180 / 300 $ »).

import { BATIMENTS, LISTE_BATIMENTS, NIVEAUX_EMPLOYE, PIOCHES, PRIX_MANAGER, SACS, type Cout, type IdBatiment, type IdBloc } from './donnees'
import { batimentDebloque } from './batiments'
import { coutAmeliorationEmploye, managerDebloque, prixEmbauche, prochainNiveauRecruteur, recruteurDebloque } from './employes'
import { prochainNiveauChariot, prochainNiveauForage } from './foreuse'
import { generateurPose, prochainNiveauGenerateur, railsAlimentes } from './generateur'
import {
  coutPioche,
  disponible,
  peutPayer,
  prixProchainSac,
  prochainNiveauAscenseur,
  prochainNiveauCoffre,
  prochainNiveauMine,
  type EtatJeu,
} from './mineur'
import { batimentPose } from './village'
import { ligneDuWagonnet, prochainNiveauWagonnet } from './wagonnet'

// Les stands du village : ce sont les bâtiments posés sur la grille (voir village.ts).
export type IdStand = IdBatiment

// Une amélioration qu'on peut acheter, ou un bâtiment à construire (« construction » : il
// s'achète dans le menu Bâtiments).
export type AchatPossible = { stand: IdStand; nom: string; cout: Cout; construction?: boolean }

// Toutes les prochaines améliorations du moment, stand par stand : d'abord les bâtiments à
// construire, puis le forgeron et la mine (le cœur de la progression). On ne propose les
// améliorations d'un bâtiment qu'une fois qu'il est posé.
export function achatsPossibles(etat: EtatJeu): AchatPossible[] {
  const achats: AchatPossible[] = []
  const pose = (id: IdBatiment) => batimentPose(etat.village, id) !== null

  for (const id of LISTE_BATIMENTS) {
    if (batimentDebloque(etat, id) && !pose(id)) achats.push({ stand: id, nom: `Construire : ${BATIMENTS[id].nom}`, cout: BATIMENTS[id].cout, construction: true })
  }

  const pioche = PIOCHES[etat.meilleure + 1]
  if (pioche && pose('forgeron')) achats.push({ stand: 'forgeron', nom: `Pioche en ${pioche.nom}`, cout: coutPioche(pioche.niveau) })

  const niveau = prochainNiveauMine(etat)
  if (niveau) achats.push({ stand: 'puits', nom: `Mine niveau ${niveau.niveau} : ${niveau.nom}`, cout: niveau.cout })
  const coffre = prochainNiveauCoffre(etat)
  if (coffre) achats.push({ stand: 'puits', nom: `Coffre de ${coffre.capacite.toLocaleString('fr-FR')} places`, cout: coffre.cout })
  const ascenseur = prochainNiveauAscenseur(etat)
  if (ascenseur && etat.employes.length > 0) {
    achats.push({ stand: 'puits', nom: etat.ascenseur.niveau === 0 ? 'Construire l’ascenseur' : `Ascenseur niveau ${ascenseur.niveau}`, cout: ascenseur.cout })
  }
  const wagonnet = prochainNiveauWagonnet(etat)
  if (wagonnet && ligneDuWagonnet(etat)) achats.push({ stand: 'puits', nom: `Wagonnet de ${wagonnet.capacite.toLocaleString('fr-FR')} places`, cout: wagonnet.cout })

  const prixSac = prixProchainSac(etat)
  if (prixSac !== null && pose('bazar')) achats.push({ stand: 'bazar', nom: `Sac de ${SACS[etat.niveauSac + 1].taille} places`, cout: { argent: prixSac, materiaux: {} } })

  if (pose('foreuse')) {
    const forage = prochainNiveauForage(etat)
    if (forage) achats.push({ stand: 'foreuse', nom: `Forage ${forage.vitesse} blocs/s`, cout: forage.cout })
    const chariot = prochainNiveauChariot(etat)
    if (chariot) achats.push({ stand: 'foreuse', nom: `Chariot de ${chariot.capacite.toLocaleString('fr-FR')} places`, cout: chariot.cout })
  }

  if (generateurPose(etat)) {
    const prochain = prochainNiveauGenerateur(etat)
    if (prochain) achats.push({ stand: 'generateur', nom: `Générateur : rayon ${prochain.rayon} cases`, cout: prochain.cout })
  }

  if (pose('employes')) {
    const prix = prixEmbauche(etat)
    if (prix !== null) achats.push({ stand: 'employes', nom: 'Embaucher un mineur', cout: { argent: prix, materiaux: {} } })
    for (const employe of etat.employes) {
      const cout = coutAmeliorationEmploye(employe)
      if (cout) achats.push({ stand: 'employes', nom: `Pioche en ${NIVEAUX_EMPLOYE[employe.niveau + 1].nom} pour ${employe.nom}`, cout })
    }
    const recruteur = prochainNiveauRecruteur(etat)
    if (recruteurDebloque(etat) && recruteur) {
      achats.push({ stand: 'employes', nom: etat.recruteur === 0 ? 'Embaucher le recruteur' : `Recruteur niveau ${etat.recruteur + 1}`, cout: recruteur.cout })
    }
    if (managerDebloque(etat) && !etat.manager.embauche) {
      achats.push({ stand: 'employes', nom: 'Embaucher le manager', cout: { argent: PRIX_MANAGER, materiaux: {} } })
    }
  }
  return achats
}

// Les bâtiments posés où au moins une amélioration est payable tout de suite.
export function standsAchetables(etat: EtatJeu): IdStand[] {
  return [...new Set(achatsPossibles(etat).filter((a) => !a.construction && peutPayer(etat, a.cout)).map((a) => a.stand))]
}

// --- Le prochain objectif ---------------------------------------------------

export type Objectif = {
  texte: string // « Pioche en Fer »
  detail: string // « 180 / 300 $ », « il manque 12 Fer », « achetable au Forgeron ! »
  stand: IdStand | null // où aller (null : au village, rien de précis)
  valeur: number // pour la petite jauge
  max: number
  pret: boolean // on peut l'acheter (ou le faire) tout de suite
  construction: boolean // c'est un bâtiment à poser (le clic ouvre le menu Bâtiments)
}

const NOMS_STANDS: Record<IdStand, string> = {
  puits: 'à la mine',
  marche: 'au marché',
  forgeron: 'au forgeron',
  bazar: 'au bazar',
  foreuse: 'à la foreuse',
  employes: 'au Personnel',
  generateur: 'au générateur',
}

// Le premier minerai qui manque pour un achat (null s'il ne manque rien).
function mineraiManquant(etat: EtatJeu, cout: Cout): { bloc: IdBloc; manque: number } | null {
  for (const [id, nombre] of Object.entries(cout.materiaux)) {
    const manque = (nombre ?? 0) - disponible(etat, id as IdBloc)
    if (manque > 0) return { bloc: id as IdBloc, manque }
  }
  return null
}

// Les grandes étapes de l'automatisation, quand rien n'est à acheter tout de suite.
function etapeAutomatisation(etat: EtatJeu): Objectif | null {
  const objectif = (texte: string, detail: string, stand: IdStand | null): Objectif => ({ texte, detail, stand, valeur: 0, max: 1, pret: false, construction: false })
  if (!batimentPose(etat.village, 'marche')) return null
  if (!ligneDuWagonnet(etat)) return objectif('Relier la mine au marché', 'pose des rails (menu Bâtiments, 3 fer la case)', null)
  if (generateurPose(etat) && !railsAlimentes(etat)) {
    if (etat.generateur.carburant <= 0) return objectif('Allumer le générateur', 'mets-lui de la redstone', 'generateur')
    return objectif('Électrifier les rails', 'toute la ligne doit être dans le rayon du générateur', 'generateur')
  }
  return null
}

// L'objectif à montrer : d'abord ce qu'on peut acheter tout de suite, sinon l'achat dont on est
// le plus proche (ou la prochaine étape de l'automatisation).
export function prochainObjectif(etat: EtatJeu, nomBloc: (bloc: IdBloc) => string): Objectif | null {
  const achats = achatsPossibles(etat)
  const payable = achats.find((a) => peutPayer(etat, a.cout))
  if (payable) {
    const construction = payable.construction === true
    const detail = construction ? (payable.cout.argent ? 'à poser (menu Bâtiments) !' : 'gratuit : pose-le (menu Bâtiments) !') : `achetable ${NOMS_STANDS[payable.stand]} !`
    return { texte: payable.nom, detail, stand: payable.stand, valeur: 1, max: 1, pret: true, construction }
  }
  // Pas de rails : c'est l'étape la plus importante, avant d'économiser pour le reste.
  const etape = etapeAutomatisation(etat)
  if (etape && !ligneDuWagonnet(etat) && disponible(etat, 'fer') > 0) return etape
  if (achats.length > 0) {
    // Le plus proche : celui dont on a la plus grande part de l'argent.
    const part = (a: AchatPossible) => (a.cout.argent ? Math.min(1, etat.argent / a.cout.argent) : 1)
    const proche = [...achats].sort((a, b) => part(b) - part(a))[0]
    const prix = proche.cout.argent ?? 0
    const minerai = mineraiManquant(etat, proche.cout)
    const detail =
      etat.argent < prix
        ? `${Math.floor(etat.argent).toLocaleString('fr-FR')} / ${prix.toLocaleString('fr-FR')} $`
        : minerai
          ? `il manque ${minerai.manque} ${nomBloc(minerai.bloc)}`
          : ''
    return { texte: proche.nom, detail, stand: proche.stand, valeur: Math.min(etat.argent, prix), max: Math.max(1, prix), pret: false, construction: proche.construction === true }
  }
  return etape
}
