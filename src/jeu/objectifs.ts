// Ce qui guide le joueur au village :
//   - les bâtiments à construire (le marché d'abord : il est gratuit) ;
//   - les stands où une amélioration est payable tout de suite (pastille « Achetable ! ») ;
//   - les améliorations à proposer dans les missions (missions.ts).

import { BATIMENTS, LISTE_BATIMENTS, NIVEAUX_EMPLOYE, PIOCHES, PRIX_MANAGER, SACS, type Cout, type IdBatiment } from './donnees'
import { batimentDebloque } from './batiments'
import { coutAmeliorationEmploye, managerDebloque, prixEmbauche, prochainNiveauRecruteur, recruteurDebloque } from './employes'
import { prochainNiveauChariot, prochainNiveauForage } from './foreuse'
import { generateurPose, prochainNiveauGenerateur } from './generateur'
import {
  coutPioche,
  peutPayer,
  prixProchainSac,
  prochainNiveauAscenseur,
  prochainNiveauCoffre,
  prochainNiveauMine,
  type EtatJeu,
} from './mineur'
import { debloque } from './niveaux'
import { batimentPose } from './village'
import { prochainNiveauWagonnet } from './wagonnet'

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
  if (pioche && pose('forgeron') && debloque(etat, 'pioches', pioche.niveau)) achats.push({ stand: 'forgeron', nom: `Pioche en ${pioche.nom}`, cout: coutPioche(pioche.niveau) })

  const niveau = prochainNiveauMine(etat)
  if (niveau && debloque(etat, 'mine', etat.niveauMine)) achats.push({ stand: 'puits', nom: `Mine niveau ${niveau.niveau} : ${niveau.nom}`, cout: niveau.cout })
  const coffre = prochainNiveauCoffre(etat)
  if (coffre && debloque(etat, 'coffre', etat.coffre.niveau + 1)) achats.push({ stand: 'puits', nom: `Coffre de ${coffre.capacite.toLocaleString('fr-FR')} places`, cout: coffre.cout })
  const ascenseur = prochainNiveauAscenseur(etat)
  if (ascenseur && etat.employes.length > 0 && debloque(etat, 'ascenseur', etat.ascenseur.niveau)) {
    achats.push({ stand: 'puits', nom: etat.ascenseur.niveau === 0 ? 'Construire l’ascenseur' : `Ascenseur niveau ${ascenseur.niveau}`, cout: ascenseur.cout })
  }
  const wagonnet = prochainNiveauWagonnet(etat)
  if (wagonnet && etat.trajets.length > 0 && debloque(etat, 'wagonnet', etat.niveauWagonnets + 1)) achats.push({ stand: 'puits', nom: `Wagonnets de ${wagonnet.capacite.toLocaleString('fr-FR')} places`, cout: wagonnet.cout })

  const prixSac = prixProchainSac(etat)
  if (prixSac !== null && pose('bazar') && debloque(etat, 'sacs', etat.niveauSac + 1)) achats.push({ stand: 'bazar', nom: `Sac de ${SACS[etat.niveauSac + 1].taille} places`, cout: { argent: prixSac, materiaux: {} } })

  if (pose('foreuse')) {
    const forage = prochainNiveauForage(etat)
    if (forage && debloque(etat, 'forage', etat.foreuse.niveauVitesse + 1)) achats.push({ stand: 'foreuse', nom: `Forage ${forage.vitesse} blocs/s`, cout: forage.cout })
    const chariot = prochainNiveauChariot(etat)
    if (chariot && debloque(etat, 'chariot', etat.foreuse.niveauChariot + 1)) achats.push({ stand: 'foreuse', nom: `Chariot de ${chariot.capacite.toLocaleString('fr-FR')} places`, cout: chariot.cout })
  }

  if (generateurPose(etat)) {
    const prochain = prochainNiveauGenerateur(etat)
    if (prochain && debloque(etat, 'generateur', etat.generateur.niveau + 1)) achats.push({ stand: 'generateur', nom: `Générateur : rayon ${prochain.rayon} cases`, cout: prochain.cout })
  }

  if (pose('employes')) {
    const prix = prixEmbauche(etat)
    if (prix !== null) achats.push({ stand: 'employes', nom: 'Embaucher un mineur', cout: { argent: prix, materiaux: {} } })
    for (const employe of etat.employes) {
      const cout = coutAmeliorationEmploye(employe)
      if (cout && employe.role === 'mineur' && debloque(etat, 'equipement', employe.niveau + 1)) achats.push({ stand: 'employes', nom: `Pioche en ${NIVEAUX_EMPLOYE[employe.niveau + 1].nom} pour ${employe.nom}`, cout })
    }
    const recruteur = prochainNiveauRecruteur(etat)
    if (recruteurDebloque(etat) && recruteur && debloque(etat, 'recruteur', etat.recruteur)) {
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
