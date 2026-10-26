// Ce qui guide le joueur au village :
//   - les bâtiments à construire (le marché d'abord : il est gratuit) ;
//   - les stands où une amélioration est payable tout de suite (pastille « Achetable ! ») ;
//   - les améliorations à proposer dans les missions (missions.ts).

import { BATIMENTS, LISTE_BATIMENTS, NIVEAUX_CHARIOT_POUSSEUR, NIVEAUX_EMPLOYE, NIVEAUX_POUSSEUR, PIOCHES, PRIX_MANAGER, type Cout, type IdBatiment } from './donnees'
import { batimentDebloque } from './batiments'
import { coutAmeliorationEmploye, coutChariotPousseur, verrouMinePioche, managerDebloque, prixEmbauche, prochainNiveauRecruteur, recruteurDebloque } from './employes'
import { prochainNiveauChariot, prochainNiveauForage } from './foreuse'
// (26/10) La tâche du générateur montre la vitesse qu'il donne (avant : son rayon)
import { generateurPose, prochainNiveauGenerateur, texteBonusGenerateur } from './generateur'
import {
  coutPioche,
  peutPayer,
  prochainNiveauAscenseur,
  prochainNiveauCoffre,
  prochainNiveauMine,
  type EtatJeu,
} from './mineur'
import { debloque } from './niveaux'
import { batimentPose } from './village'
import { nombre, t } from './langue'

// Les stands du village : ce sont les bâtiments posés sur la grille (voir village.ts).
export type IdStand = IdBatiment

// Une amélioration qu'on peut acheter, ou un bâtiment à construire (« construction » : il
// s'achète dans le menu Bâtiments).
// (25/10) « employe » : une amélioration pour UN employé (sa pioche, sa vitesse, son chariot),
// et « chariotPousseur » quand c'est le chariot d'un pousseur : les tâches les gardent pour la fin.
export type AchatPossible = { stand: IdStand; nom: string; cout: Cout; construction?: boolean; employe?: string; chariotPousseur?: boolean }

// Toutes les prochaines améliorations du moment, stand par stand : d'abord les bâtiments à
// construire, puis le forgeron et la mine (le cœur de la progression). On ne propose les
// améliorations d'un bâtiment qu'une fois qu'il est posé.
export function achatsPossibles(etat: EtatJeu): AchatPossible[] {
  const achats: AchatPossible[] = []
  const pose = (id: IdBatiment) => batimentPose(etat.village, id) !== null

  for (const id of LISTE_BATIMENTS) {
    if (batimentDebloque(etat, id) && !pose(id)) achats.push({ stand: id, nom: t('Construire : {nom}', { nom: t(BATIMENTS[id].nom) }), cout: BATIMENTS[id].cout, construction: true })
  }

  const pioche = PIOCHES[etat.meilleure + 1]
  if (pioche && pose('forgeron') && debloque(etat, 'pioches', pioche.niveau)) achats.push({ stand: 'forgeron', nom: t('Pioche en {nom}', { nom: t(pioche.nom) }), cout: coutPioche(pioche.niveau) })

  const niveau = prochainNiveauMine(etat)
  if (niveau && debloque(etat, 'mine', etat.niveauMine)) achats.push({ stand: 'puits', nom: t('Mine niveau {n} : {nom}', { n: niveau.niveau, nom: t(niveau.nom) }), cout: niveau.cout })
  const coffre = prochainNiveauCoffre(etat)
  if (coffre && debloque(etat, 'coffre', etat.coffre.niveau + 1)) achats.push({ stand: 'puits', nom: t('Coffre de {places} places', { places: nombre(coffre.capacite) }), cout: coffre.cout })
  const ascenseur = prochainNiveauAscenseur(etat)
  if (ascenseur && etat.employes.length > 0 && debloque(etat, 'ascenseur', etat.ascenseur.niveau)) {
    achats.push({ stand: 'puits', nom: etat.ascenseur.niveau === 0 ? t('Construire l’ascenseur') : t('Ascenseur niveau {n}', { n: ascenseur.niveau }), cout: ascenseur.cout })
  }
  if (pose('foreuse')) {
    const forage = prochainNiveauForage(etat)
    if (forage && debloque(etat, 'forage', etat.foreuse.niveauVitesse + 1)) achats.push({ stand: 'foreuse', nom: t('Forage {vitesse} blocs/s', { vitesse: forage.vitesse }), cout: forage.cout })
    const chariot = prochainNiveauChariot(etat)
    if (chariot && debloque(etat, 'chariot', etat.foreuse.niveauChariot + 1)) achats.push({ stand: 'foreuse', nom: t('Chariot de la foreuse : {places} places', { places: nombre(chariot.capacite) }), cout: chariot.cout })
  }

  if (generateurPose(etat)) {
    const prochain = prochainNiveauGenerateur(etat)
    if (prochain && debloque(etat, 'generateur', etat.generateur.niveau + 1)) achats.push({ stand: 'generateur', nom: t('Générateur : vitesse {bonus}', { bonus: texteBonusGenerateur(prochain.bonus) }), cout: prochain.cout })
  }

  if (pose('employes')) {
    const prix = prixEmbauche(etat)
    if (prix !== null) achats.push({ stand: 'employes', nom: t('Embaucher un mineur'), cout: { argent: prix, materiaux: {} } })
    for (const employe of etat.employes) {
      const cout = coutAmeliorationEmploye(etat, employe)
      if (cout && employe.role === 'mineur' && verrouMinePioche(etat, employe) === null) achats.push({ stand: 'employes', nom: t('Pioche en {pioche} pour {nom}', { pioche: t(NIVEAUX_EMPLOYE[employe.niveau + 1].nom), nom: employe.nom }), cout, employe: employe.nom })
      if (cout && employe.role === 'pousseur' && debloque(etat, 'pousseur', employe.niveau + 1)) achats.push({ stand: 'employes', nom: t('Vitesse de {nom} : pousseur {vitesse}', { nom: employe.nom, vitesse: t(NIVEAUX_POUSSEUR[employe.niveau + 1].nom).toLowerCase() }), cout, employe: employe.nom })
      // (23/10) le chariot de chaque pousseur
      const coutChariot = coutChariotPousseur(etat, employe)
      if (coutChariot && debloque(etat, 'chariotPousseur', (employe.chariot ?? 0) + 1)) achats.push({ stand: 'employes', nom: t('Chariot de {nom} : {places} places', { nom: employe.nom, places: NIVEAUX_CHARIOT_POUSSEUR[(employe.chariot ?? 0) + 1].places }), cout: coutChariot, employe: employe.nom, chariotPousseur: true })
    }
    const recruteur = prochainNiveauRecruteur(etat)
    if (recruteurDebloque(etat) && recruteur && debloque(etat, 'recruteur', etat.recruteur)) {
      achats.push({ stand: 'employes', nom: etat.recruteur === 0 ? t('Embaucher le recruteur') : t('Recruteur niveau {n}', { n: etat.recruteur + 1 }), cout: recruteur.cout })
    }
    if (managerDebloque(etat) && !etat.manager.embauche) {
      achats.push({ stand: 'employes', nom: t('Embaucher le manager'), cout: { argent: PRIX_MANAGER, materiaux: {} } })
    }
  }
  return achats
}

// Les bâtiments posés où au moins une amélioration est payable tout de suite.
export function standsAchetables(etat: EtatJeu): IdStand[] {
  return [...new Set(achatsPossibles(etat).filter((a) => !a.construction && peutPayer(etat, a.cout)).map((a) => a.stand))]
}
