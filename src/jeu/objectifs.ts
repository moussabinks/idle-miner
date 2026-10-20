// Ce qui guide le joueur au village (20/10) :
//   - les stands où une amélioration est payable tout de suite (pastille « Achetable ! ») ;
//   - les stands qui ont de nouveaux niveaux depuis le dernier prestige (badge et flèche
//     « ⬆ Nouveaux niveaux ! », jusqu'à ce qu'on soit passé devant) ;
//   - le prochain objectif (la petite barre sous le bandeau : « Pioche en Fer : 180 / 300 $ »).

import {
  COUT_ACTIVATION_FOREUSE,
  ENCHANTEMENTS,
  LISTE_ENCHANTEMENTS,
  NIVEAUX_EMPLOYE,
  PIOCHES,
  PRIX_MANAGER,
  SACS,
  niveauMaxAuPrestige,
  profondeurBedrock,
  type Cout,
  type IdBloc,
  type IdPlafond,
} from './donnees'
import { peutPasserPrestige } from './conditionsPrestige'
import {
  coutAmeliorationEmploye,
  employeBloqueAuPrestige,
  employesDebloques,
  managerDebloque,
  prixEmbauche,
  prochainNiveauRecruteur,
  recruteurBloqueAuPrestige,
  recruteurDebloque,
} from './employes'
import { chariotBloqueAuPrestige, forageBloqueAuPrestige, foreuseDebloquee, prochainNiveauChariot, prochainNiveauForage } from './foreuse'
import {
  ascenseurBloqueAuPrestige,
  coutPioche,
  chiffreRomain,
  coutEnchantement,
  enchantementBloqueAuPrestige,
  peutPayer,
  prixProchainSac,
  prochainNiveauAscenseur,
  quantite,
  sacBloqueAuPrestige,
  type EtatJeu,
} from './mineur'

// Les stands du village (les mêmes identifiants que dans src/composants/stands.ts).
export type IdStand = 'prestige' | 'puits' | 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'foreuse' | 'employes'

// Une amélioration qu'on peut acheter à ce prestige (pas bloquée par un cadenas).
export type AchatPossible = { stand: IdStand; nom: string; cout: Cout }

// Toutes les prochaines améliorations du moment, stand par stand (le forgeron d'abord : la
// prochaine pioche est le cœur de la progression).
export function achatsPossibles(etat: EtatJeu): AchatPossible[] {
  const achats: AchatPossible[] = []

  const pioche = PIOCHES[etat.meilleure + 1]
  if (pioche) achats.push({ stand: 'forgeron', nom: `Pioche en ${pioche.nom}`, cout: coutPioche(pioche.niveau) })

  const ascenseur = prochainNiveauAscenseur(etat)
  if (ascenseur && ascenseurBloqueAuPrestige(etat) === null) {
    achats.push({ stand: 'puits', nom: etat.ascenseur.niveau === 0 ? 'Construire l’ascenseur' : `Ascenseur niveau ${ascenseur.niveau}`, cout: ascenseur.cout })
  }

  const prixSac = prixProchainSac(etat)
  if (prixSac !== null && sacBloqueAuPrestige(etat) === null) {
    achats.push({ stand: 'bazar', nom: `Sac de ${SACS[etat.niveauSac + 1].taille} places`, cout: { argent: prixSac, materiaux: {} } })
  }

  for (const id of LISTE_ENCHANTEMENTS) {
    const cout = coutEnchantement(etat, id)
    if (cout && enchantementBloqueAuPrestige(etat, id) === null) {
      achats.push({ stand: 'enchanteur', nom: `${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id] + 1)}`, cout })
    }
  }

  if (foreuseDebloquee(etat)) {
    if (!etat.foreuse.active) {
      achats.push({ stand: 'foreuse', nom: 'Activer la foreuse', cout: COUT_ACTIVATION_FOREUSE })
    } else {
      const forage = prochainNiveauForage(etat)
      if (forage && forageBloqueAuPrestige(etat) === null) achats.push({ stand: 'foreuse', nom: `Forage ${forage.vitesse} blocs/s`, cout: forage.cout })
      const chariot = prochainNiveauChariot(etat)
      if (chariot && chariotBloqueAuPrestige(etat) === null) {
        achats.push({ stand: 'foreuse', nom: `Chariot de ${chariot.capacite.toLocaleString('fr-FR')} places`, cout: chariot.cout })
      }
    }
  }

  if (employesDebloques(etat)) {
    const prix = prixEmbauche(etat)
    if (prix !== null) achats.push({ stand: 'employes', nom: 'Embaucher un mineur', cout: { argent: prix, materiaux: {} } })
    for (const employe of etat.employes) {
      const cout = coutAmeliorationEmploye(employe)
      if (cout && employeBloqueAuPrestige(etat, employe) === null) {
        achats.push({ stand: 'employes', nom: `Pioche en ${NIVEAUX_EMPLOYE[employe.niveau + 1].nom} pour ${employe.nom}`, cout })
      }
    }
    const recruteur = prochainNiveauRecruteur(etat)
    if (recruteurDebloque(etat) && recruteur && recruteurBloqueAuPrestige(etat) === null) {
      achats.push({ stand: 'employes', nom: etat.recruteur === 0 ? 'Embaucher le recruteur' : `Recruteur niveau ${etat.recruteur + 1}`, cout: recruteur.cout })
    }
    if (managerDebloque(etat) && !etat.manager.embauche) {
      achats.push({ stand: 'employes', nom: 'Embaucher le manager', cout: { argent: PRIX_MANAGER, materiaux: {} } })
    }
  }
  return achats
}

// Les stands où au moins une amélioration est payable tout de suite.
export function standsAchetables(etat: EtatJeu): IdStand[] {
  return [...new Set(achatsPossibles(etat).filter((a) => peutPayer(etat, a.cout)).map((a) => a.stand))]
}

// --- Les nouveaux niveaux après un prestige ---------------------------------

// Les améliorations de chaque stand qui sont plafonnées par le prestige.
function plafondsDuStand(etat: EtatJeu, stand: IdStand): IdPlafond[] {
  if (stand === 'puits') return ['ascenseur']
  if (stand === 'bazar') return ['sac']
  if (stand === 'enchanteur') return [...LISTE_ENCHANTEMENTS]
  if (stand === 'foreuse') return foreuseDebloquee(etat) ? ['forage', 'chariot'] : []
  if (stand === 'employes') return [...(etat.employes.length > 0 ? (['mineur'] as IdPlafond[]) : []), ...(etat.recruteur > 0 ? (['recruteur'] as IdPlafond[]) : [])]
  return []
}

// Les stands où ce prestige a débloqué un niveau de plus, et que le joueur n'a pas encore visités.
export function standsAvecNouveauxNiveaux(etat: EtatJeu): IdStand[] {
  if (etat.prestige === 0) return []
  const stands: IdStand[] = ['puits', 'bazar', 'enchanteur', 'foreuse', 'employes']
  return stands.filter(
    (stand) =>
      !etat.standsVus.includes(stand) &&
      plafondsDuStand(etat, stand).some((id) => niveauMaxAuPrestige(id, etat.prestige) > niveauMaxAuPrestige(id, etat.prestige - 1)),
  )
}

// Le joueur est passé devant le stand : le badge « Nouveaux niveaux » disparaît.
export function marquerStandVu(etat: EtatJeu, stand: IdStand): string[] {
  if (etat.standsVus.includes(stand)) return []
  etat.standsVus = [...etat.standsVus, stand]
  return []
}

// --- Le prochain objectif ---------------------------------------------------

export type Objectif = {
  texte: string // « Pioche en Fer »
  detail: string // « 180 / 300 $ », « il manque 12 Fer », « achetable au Forgeron ! »
  stand: IdStand | null // où aller (null : dans la mine)
  valeur: number // pour la petite jauge
  max: number
  pret: boolean // on peut l'acheter tout de suite (ou passer prestige)
}

const NOMS_STANDS: Record<IdStand, string> = {
  prestige: 'à l’arbre de prestige',
  puits: 'à l’entrée de la mine',
  marche: 'au marché',
  forgeron: 'au forgeron',
  bazar: 'au bazar',
  enchanteur: 'à l’enchanteur',
  foreuse: 'à la foreuse',
  employes: 'au stand Personnel',
}

// Le premier minerai qui manque pour un achat (null s'il ne manque rien).
function mineraiManquant(etat: EtatJeu, cout: Cout): { bloc: IdBloc; manque: number } | null {
  for (const [id, nombre] of Object.entries(cout.materiaux)) {
    const manque = (nombre ?? 0) - quantite(etat, id as IdBloc)
    if (manque > 0) return { bloc: id as IdBloc, manque }
  }
  return null
}

// L'objectif à montrer : d'abord ce qu'on peut acheter tout de suite (la pioche en premier),
// sinon l'achat dont on est le plus proche ; quand tout est fait, la bedrock puis le prestige.
export function prochainObjectif(etat: EtatJeu, nomBloc: (bloc: IdBloc) => string): Objectif | null {
  const achats = achatsPossibles(etat)
  const payable = achats.find((a) => peutPayer(etat, a.cout))
  if (payable) {
    return { texte: payable.nom, detail: `achetable ${NOMS_STANDS[payable.stand]} !`, stand: payable.stand, valeur: 1, max: 1, pret: true }
  }
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
    return { texte: proche.nom, detail, stand: proche.stand, valeur: Math.min(etat.argent, prix), max: Math.max(1, prix), pret: false }
  }
  if (!etat.victoire) {
    const bedrock = profondeurBedrock(etat.prestige)
    return { texte: 'Atteindre la bedrock', detail: `-${etat.profondeur} / -${bedrock} m`, stand: null, valeur: etat.profondeur, max: bedrock, pret: false }
  }
  if (peutPasserPrestige(etat)) {
    return { texte: `Prestige ${etat.prestige + 1}`, detail: 'tout est prêt, à l’arbre de prestige !', stand: 'prestige', valeur: 1, max: 1, pret: true }
  }
  return null
}
