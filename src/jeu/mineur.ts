// État du mineur et règles du jeu.
//
// Tout l'état d'une partie tient dans un objet `EtatJeu` composé uniquement de
// nombres, de textes et de listes. On peut donc le sauvegarder tel quel en JSON.
//
// Les fonctions « actions » (casserBloc, vendre, reparer, ...) modifient l'état
// qu'on leur donne et renvoient la liste des messages à afficher au joueur.

import { choisir, entierEntre, type Aleatoire } from './aleatoire'
import {
  BLOCS,
  BONUS_PRESTIGE,
  ECART_TORCHES,
  ENCHANTEMENTS,
  LISTE_ENCHANTEMENTS,
  MINERAIS_COFFRE,
  MULTIPLICATEUR_ACHAT,
  NIVEAUX_ASCENSEUR,
  PIOCHES,
  PORTEE_TORCHE,
  LARGEUR_MINE,
  PRIX_PLANCHE,
  PRIX_SEAU,
  PROFONDEUR_BEDROCK,
  REPARATION_PAR_UNITE,
  SACS,
  SECONDES_PAR_METRE_ECHELLE,
  TORCHES_DEPART,
  TORCHES_PAR_CHARBON,
  VISION_ECLAIREE,
  VISION_SOMBRE,
  VITESSE_MAINS_NUES,
  dureeCasse,
  type IdBloc,
  type IdEnchantement,
  type NiveauAscenseur,
  type Pioche,
} from './donnees'
import { genererCouche, poidsDesBlocs } from './mine'

// Nombre de couches gardées en mémoire sous la couche en cours (pour la vision).
export const COUCHES_EN_AVANCE = VISION_ECLAIREE - 1

export type Inventaire = Partial<Record<IdBloc, number>>

export type Statistiques = {
  blocsCasses: number
  argentGagne: number
  tempsMinage: number // en secondes de jeu
  coffresOuverts: number
  geodesCassees: number
  lavesEteintes: number
  diamantsTrouves: number
}

export type Ascenseur = {
  niveau: number // 0 = pas encore construit
  chargement: Inventaire // ce qu'il remonte en ce moment
  tempsRestant: number // 0 = il attend au niveau du joueur
  tempsTotal: number // durée de l'aller-retour en cours
}

export type Foreuse = {
  active: boolean // activée une fois pour toutes (avec du fer et de la redstone)
  carburant: number // secondes de forage restantes (le charbon brûlé)
  niveauVitesse: number // index dans NIVEAUX_FORAGE
  niveauChariot: number // index dans NIVEAUX_CHARIOT
  chariot: Inventaire // ce que la foreuse a remonté
  profondeur: number // profondeur atteinte par la foreuse
  progression: number // fraction du prochain bloc foré (0 à 1)
  blocsFores: number
}

export type EtatJeu = {
  version: number
  // Position du joueur sur l'échelle, en mètres : 0 = au village, profondeur - 1 = au front de taille.
  // C'est un nombre à virgule pendant qu'il grimpe.
  position: number
  cible: number // là où le joueur se dirige sur l'échelle
  colonneMineur: number // où se tient le mineur au-dessus de la couche en cours (0 à 5)
  argent: number
  profondeur: number // profondeur de la couche en cours, en mètres (1 = juste sous l'herbe)
  coucheActuelle: (IdBloc | null)[] // null = bloc déjà cassé
  couchesDessous: IdBloc[][] // couches sous la couche en cours (profondeur + 1, + 2, ...)
  enGalerie: boolean // true = on creuse à l'horizontale
  pioches: Record<number, number> // pioches possédées : niveau -> usure
  niveauPioche: number // la pioche équipée
  meilleure: number // plus haut niveau de pioche débloqué
  inventaire: Inventaire // le contenu du sac
  nonAVendre: IdBloc[] // objets décochés au marché : « Vendre tout » les garde
  ascenseur: Ascenseur
  foreuse: Foreuse
  enchantements: Record<IdEnchantement, number>
  niveauSac: number
  seaux: number
  torches: number
  torchesPosees: number[] // profondeurs où une torche est posée
  prestige: number
  succes: string[] // identifiants des succès débloqués (gardés au prestige)
  stats: Statistiques
  victoire: boolean
}

export const VERSION_ETAT = 3

// ---------------------------------------------------------------------------
// Création d'une partie
// ---------------------------------------------------------------------------

// Le premier mètre est l'entrée du puits, déjà creusée : on commence à creuser à -2 m.
export const PROFONDEUR_DEPART = 2

export function nouvelleForeuse(): Foreuse {
  return { active: false, carburant: 0, niveauVitesse: 0, niveauChariot: 0, chariot: {}, profondeur: 1, progression: 0, blocsFores: 0 }
}

export function creerPartie(
  aleatoire: Aleatoire,
  prestige = 0,
  succes: string[] = [],
  nonAVendre: IdBloc[] = [],
  foreuse: Foreuse = nouvelleForeuse(),
): EtatJeu {
  const couchesDessous: IdBloc[][] = []
  for (let i = 1; i <= COUCHES_EN_AVANCE; i++) couchesDessous.push(genererCouche(PROFONDEUR_DEPART + i, aleatoire))

  return {
    version: VERSION_ETAT,
    position: 0, // on commence au village
    cible: 0,
    colonneMineur: 0,
    argent: 0,
    profondeur: PROFONDEUR_DEPART,
    coucheActuelle: genererCouche(PROFONDEUR_DEPART, aleatoire),
    couchesDessous,
    enGalerie: false,
    pioches: { 0: 0 }, // la pioche en bois est offerte
    niveauPioche: 0,
    meilleure: 0,
    inventaire: {},
    nonAVendre: [...nonAVendre],
    ascenseur: { niveau: 0, chargement: {}, tempsRestant: 0, tempsTotal: 0 },
    foreuse: structuredClone(foreuse),
    enchantements: { efficacite: 0, fortune: 0, solidite: 0 },
    niveauSac: 0,
    seaux: 0,
    torches: TORCHES_DEPART,
    torchesPosees: [],
    prestige,
    succes: [...succes],
    stats: {
      blocsCasses: 0,
      argentGagne: 0,
      tempsMinage: 0,
      coffresOuverts: 0,
      geodesCassees: 0,
      lavesEteintes: 0,
      diamantsTrouves: 0,
    },
    victoire: false,
  }
}

// Recommence une partie après la bedrock, avec un niveau de prestige en plus.
// On garde les succès, les objets décochés au marché et la foreuse.
export function prestige(etat: EtatJeu, aleatoire: Aleatoire): EtatJeu {
  return creerPartie(aleatoire, etat.prestige + 1, etat.succes, etat.nonAVendre, etat.foreuse)
}

// ---------------------------------------------------------------------------
// Informations calculées à partir de l'état
// ---------------------------------------------------------------------------

export function piocheEquipee(etat: EtatJeu): Pioche {
  return PIOCHES[etat.niveauPioche]
}

export function usure(etat: EtatJeu): number {
  return etat.pioches[etat.niveauPioche] ?? 0
}

export function durabiliteRestante(etat: EtatJeu): number {
  return Math.max(0, piocheEquipee(etat).durabilite - usure(etat))
}

export function estCassee(etat: EtatJeu): boolean {
  return durabiliteRestante(etat) === 0
}

export function vitesse(etat: EtatJeu): number {
  if (estCassee(etat)) return VITESSE_MAINS_NUES
  const bonusEfficacite = 1 + 0.25 * etat.enchantements.efficacite
  return piocheEquipee(etat).vitesse * bonusEfficacite
}

export function tailleSac(etat: EtatJeu): number {
  return SACS[etat.niveauSac].taille
}

export function nbDansSac(etat: EtatJeu): number {
  let total = 0
  for (const quantite of Object.values(etat.inventaire)) total += quantite ?? 0
  return total
}

export function placeLibre(etat: EtatJeu): number {
  return Math.max(0, tailleSac(etat) - nbDansSac(etat))
}

export function sacPlein(etat: EtatJeu): boolean {
  return placeLibre(etat) === 0
}

export function bonusVente(etat: EtatJeu): number {
  return 1 + BONUS_PRESTIGE * etat.prestige
}

export function quantite(etat: EtatJeu, bloc: IdBloc): number {
  return etat.inventaire[bloc] ?? 0
}

// La position du front de taille : juste au-dessus de la couche qu'on creuse.
export function positionFront(etat: EtatJeu): number {
  return etat.profondeur - 1
}

export function enMouvement(etat: EtatJeu): boolean {
  return etat.position !== etat.cible
}

// Le joueur est au village (et ne bouge pas) : il peut vendre et acheter.
export function aLaSurface(etat: EtatJeu): boolean {
  return etat.position === 0 && !enMouvement(etat)
}

// Le joueur est au front de taille, prêt à creuser.
export function auFond(etat: EtatJeu): boolean {
  return etat.position === positionFront(etat) && !enMouvement(etat)
}

export function estEclaire(etat: EtatJeu): boolean {
  if (etat.profondeur <= 6) return true
  return etat.torchesPosees.some((d) => d <= etat.profondeur && etat.profondeur - d <= PORTEE_TORCHE)
}

// Nombre de couches visibles (la couche en cours comprise).
export function vision(etat: EtatJeu): number {
  return estEclaire(etat) ? VISION_ECLAIREE : VISION_SOMBRE
}

// Le prochain bloc à casser : celui sous le mineur, sinon le plus proche de lui.
// Renvoie -1 si la couche est finie.
export function indexBlocActuel(etat: EtatJeu): number {
  let meilleur = -1
  etat.coucheActuelle.forEach((bloc, colonne) => {
    if (bloc === null) return
    const distance = Math.abs(colonne - etat.colonneMineur)
    if (meilleur === -1 || distance < Math.abs(meilleur - etat.colonneMineur)) meilleur = colonne
  })
  return meilleur
}

export function blocActuel(etat: EtatJeu): IdBloc | null {
  const index = indexBlocActuel(etat)
  return index === -1 ? null : etat.coucheActuelle[index]
}

// Temps (en secondes) pour casser le prochain bloc.
export function dureeBlocActuel(etat: EtatJeu): number {
  const bloc = blocActuel(etat)
  if (bloc === null) return 0
  return dureeCasse(BLOCS[bloc].durete, etat.profondeur, vitesse(etat))
}

// ---------------------------------------------------------------------------
// Petits outils sur l'inventaire
// ---------------------------------------------------------------------------

export function ajouter(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  if (nombre <= 0) return
  etat.inventaire[bloc] = quantite(etat, bloc) + nombre
}

export function retirer(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  const reste = quantite(etat, bloc) - nombre
  if (reste > 0) etat.inventaire[bloc] = reste
  else delete etat.inventaire[bloc] // on nettoie les zéros
}

// Met des objets dans le sac s'il reste de la place. Renvoie le nombre qui n'a pas tenu.
export function ramasser(etat: EtatJeu, bloc: IdBloc, nombre: number): number {
  const rentre = Math.min(nombre, placeLibre(etat))
  ajouter(etat, bloc, rentre)
  return nombre - rentre
}

export function possede(etat: EtatJeu, materiaux: Inventaire): boolean {
  return Object.entries(materiaux).every(([bloc, nombre]) => quantite(etat, bloc as IdBloc) >= (nombre ?? 0))
}

export function payerMateriaux(etat: EtatJeu, materiaux: Inventaire): void {
  for (const [bloc, nombre] of Object.entries(materiaux)) retirer(etat, bloc as IdBloc, nombre ?? 0)
}

// ---------------------------------------------------------------------------
// Minage
// ---------------------------------------------------------------------------

// Nombre d'objets obtenus en cassant un bloc (enchantement Fortune sur les minerais).
export function nbDrops(etat: EtatJeu, bloc: IdBloc, aleatoire: Aleatoire): number {
  const fortune = etat.enchantements.fortune
  if (!BLOCS[bloc].minerai || fortune === 0) return 1
  return 1 + Math.max(0, entierEntre(aleatoire, 0, fortune + 1) - 1)
}

// Casse le prochain bloc de la couche en cours.
export function casserBloc(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  const index = indexBlocActuel(etat)
  if (etat.victoire || !auFond(etat) || index === -1) return messages
  const bloc = etat.coucheActuelle[index] as IdBloc
  etat.colonneMineur = index // le mineur se place au-dessus du bloc

  etat.stats.tempsMinage += dureeBlocActuel(etat)
  etat.stats.blocsCasses += 1

  // Usure de la pioche (Solidité : 1 chance sur n+1 de l'user).
  if (!estCassee(etat)) {
    const chanceUsure = 1 / (etat.enchantements.solidite + 1)
    if (aleatoire() < chanceUsure) {
      etat.pioches[etat.niveauPioche] = usure(etat) + 1
      if (estCassee(etat)) {
        messages.push(`💥 Ta pioche en ${piocheEquipee(etat).nom} est cassée ! Tu mines à mains nues.`)
      }
    }
  }

  messages.push(...recolter(etat, bloc, aleatoire))

  // Le bloc est cassé : on passe à la couche suivante si c'était le dernier.
  etat.coucheActuelle[index] = null
  if (indexBlocActuel(etat) === -1) messages.push(...passerCoucheSuivante(etat, aleatoire))

  return messages
}

// Ce qu'on obtient en cassant un bloc.
function recolter(etat: EtatJeu, bloc: IdBloc, aleatoire: Aleatoire): string[] {
  const messages: string[] = []

  if (bloc === 'lave') {
    if (etat.seaux > 0) {
      etat.seaux -= 1
      etat.stats.lavesEteintes += 1
      ramasser(etat, 'obsidienne', 1)
      messages.push('🪣 Lave éteinte avec ton seau : +1 obsidienne !')
    } else {
      // Sans seau, la lave brûle un tiers de chaque pile du sac.
      let perdus = 0
      for (const [id, nombre] of Object.entries(etat.inventaire)) {
        const perte = Math.floor((nombre ?? 0) / 3)
        retirer(etat, id as IdBloc, perte)
        perdus += perte
      }
      messages.push(`🔥 Aïe, de la lave ! ${perdus} objets brûlés. Achète un seau d'eau.`)
    }
    return messages
  }

  if (bloc === 'coffre') {
    const argent = entierEntre(aleatoire, 20, 60) + etat.profondeur * entierEntre(aleatoire, 3, 8)
    etat.argent += argent
    etat.stats.argentGagne += argent
    etat.stats.coffresOuverts += 1
    // Un minerai parmi ceux qu'on trouve à cette profondeur.
    const minerais = poidsDesBlocs(etat.profondeur)
      .map((c) => c.valeur)
      .filter((id) => MINERAIS_COFFRE.includes(id))
    const minerai = minerais.length > 0 ? choisir(aleatoire, minerais) : 'charbon'
    ramasser(etat, minerai, 1)
    messages.push(`🧰 Coffre au trésor : +${argent} $ et 1 ${BLOCS[minerai].nom} !`)
    return messages
  }

  if (bloc === 'geode') {
    const nombre = entierEntre(aleatoire, 3, 6)
    etat.stats.geodesCassees += 1
    const perdus = ramasser(etat, 'amethyste', nombre)
    messages.push(`🔮 Géode : +${nombre - perdus} améthystes !`)
    return messages
  }

  // Bloc normal : il va dans le sac.
  const nombre = nbDrops(etat, bloc, aleatoire)
  if (bloc === 'diamant') etat.stats.diamantsTrouves += nombre
  const perdus = ramasser(etat, bloc, nombre)
  if (perdus > 0) messages.push('🎒 Sac plein ! Remonte vendre au marché (ou envoie l’ascenseur).')
  return messages
}

// Appelé quand les blocs de la couche en cours sont tous cassés.
function passerCoucheSuivante(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  const suivante = etat.profondeur + 1

  // La pioche ne peut pas descendre plus bas : galerie horizontale.
  if (suivante > piocheEquipee(etat).profMax) {
    if (!etat.enGalerie) {
      messages.push(`↔️ Ta pioche en ${piocheEquipee(etat).nom} ne descend pas plus bas : tu creuses une galerie.`)
    }
    etat.enGalerie = true
    etat.coucheActuelle = genererCouche(etat.profondeur, aleatoire)
    return messages
  }

  etat.enGalerie = false

  // On arrive sur la bedrock : victoire !
  if (suivante >= PROFONDEUR_BEDROCK) {
    etat.profondeur = PROFONDEUR_BEDROCK
    etat.position = positionFront(etat)
    etat.cible = etat.position
    etat.coucheActuelle = []
    etat.couchesDessous = []
    etat.victoire = true
    messages.push('🏆 Tu as atteint la bedrock !')
    return messages
  }

  // On descend d'un mètre : la première couche du dessous devient la couche en cours,
  // et le mineur descend avec elle.
  const joueurAuFront = auFond(etat)
  etat.profondeur = suivante
  if (joueurAuFront) {
    etat.position = positionFront(etat)
    etat.cible = etat.position
  }
  etat.coucheActuelle = etat.couchesDessous.shift() ?? genererCouche(suivante, aleatoire)
  const profondeurAGenerer = suivante + COUCHES_EN_AVANCE
  etat.couchesDessous.push(profondeurAGenerer < PROFONDEUR_BEDROCK ? genererCouche(profondeurAGenerer, aleatoire) : [])

  // Une torche est posée automatiquement tous les 5 m.
  if (suivante % ECART_TORCHES === 0) {
    if (etat.torches > 0) {
      etat.torches -= 1
      etat.torchesPosees.push(suivante)
    } else {
      messages.push('🕯️ Plus de torches : il fait noir ! Fabrique-en avec du charbon.')
    }
  }

  return messages
}

// ---------------------------------------------------------------------------
// Vente
// ---------------------------------------------------------------------------

// Valeur d'un lot d'objets au marché (avec le bonus de prestige).
export function valeurDe(etat: EtatJeu, objets: Inventaire): number {
  let total = 0
  for (const [id, nombre] of Object.entries(objets)) total += (nombre ?? 0) * BLOCS[id as IdBloc].prix
  return Math.round(total * bonusVente(etat))
}

// Ce que « Vendre tout » mettrait en vente : tout le sac, sauf les objets décochés.
export function objetsAVendre(etat: EtatJeu): Inventaire {
  const objets: Inventaire = {}
  for (const [id, nombre] of Object.entries(etat.inventaire)) {
    const bloc = id as IdBloc
    if (!etat.nonAVendre.includes(bloc) && (nombre ?? 0) > 0) objets[bloc] = nombre
  }
  return objets
}

export function apercuVente(etat: EtatJeu): number {
  return valeurDe(etat, objetsAVendre(etat))
}

// Coche ou décoche un objet au marché.
export function basculerVente(etat: EtatJeu, bloc: IdBloc): string[] {
  if (etat.nonAVendre.includes(bloc)) etat.nonAVendre = etat.nonAVendre.filter((b) => b !== bloc)
  else etat.nonAVendre.push(bloc)
  return []
}

// « Vendre tout » au marché de la surface.
export function vendre(etat: EtatJeu): string[] {
  if (!aLaSurface(etat)) return ['⬆️ Le marché est à la surface : remonte par l’échelle.']
  const objets = objetsAVendre(etat)
  const gain = valeurDe(etat, objets)
  if (gain === 0) return ['Rien à vendre pour le moment.']
  for (const [bloc, nombre] of Object.entries(objets)) retirer(etat, bloc as IdBloc, nombre ?? 0)
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`💰 Vente : +${gain} $`]
}

// ---------------------------------------------------------------------------
// Déplacements : à gauche et à droite au front, en haut et en bas sur l'échelle
// ---------------------------------------------------------------------------

// Déplace le mineur d'une case au front de taille (sens = -1 pour la gauche, +1 pour la droite).
export function deplacerMineur(etat: EtatJeu, sens: number): string[] {
  if (!auFond(etat)) return []
  etat.colonneMineur = Math.min(LARGEUR_MINE - 1, Math.max(0, etat.colonneMineur + sens))
  return []
}

// Choisit où aller sur l'échelle (0 = village, positionFront = front de taille).
// Le joueur y va ensuite petit à petit (voir avancerTemps).
export function allerA(etat: EtatJeu, position: number): string[] {
  if (etat.victoire && position > etat.position) return []
  etat.cible = Math.min(positionFront(etat), Math.max(0, Math.round(position)))
  return []
}

// Arrête le joueur sur le prochain barreau (quand on relâche la flèche).
// S'il est pile sur un barreau, il avance quand même d'un barreau : un appui
// très court fait donc toujours bouger d'un mètre.
export function arreterSurEchelle(etat: EtatJeu): string[] {
  const p = etat.position
  if (etat.cible < p) etat.cible = Math.max(etat.cible, Number.isInteger(p) ? p - 1 : Math.floor(p))
  if (etat.cible > p) etat.cible = Math.min(etat.cible, Number.isInteger(p) ? p + 1 : Math.ceil(p))
  return []
}

// Temps pour parcourir toute l'échelle depuis le front de taille.
export function dureeEchelle(etat: EtatJeu): number {
  return positionFront(etat) * SECONDES_PAR_METRE_ECHELLE
}

// Fait grimper le joueur vers sa cible pendant quelques secondes.
export function avancerSurEchelle(etat: EtatJeu, secondes: number): string[] {
  if (!enMouvement(etat)) return []
  const pas = secondes / SECONDES_PAR_METRE_ECHELLE
  if (Math.abs(etat.cible - etat.position) <= pas) etat.position = etat.cible
  else etat.position += Math.sign(etat.cible - etat.position) * pas

  if (etat.position !== etat.cible) return []
  if (etat.position === 0) return ['☀️ Te voilà au village !']
  if (etat.position === positionFront(etat)) return [`⛏️ Au front de taille, à -${etat.profondeur} m.`]
  return []
}

// ---------------------------------------------------------------------------
// L'ascenseur automatique (construit et amélioré avec du fer et de la redstone)
// ---------------------------------------------------------------------------

// Les caractéristiques du niveau actuel (null s'il n'est pas construit).
export function niveauAscenseur(etat: EtatJeu): NiveauAscenseur | null {
  return NIVEAUX_ASCENSEUR[etat.ascenseur.niveau - 1] ?? null
}

// Le prochain niveau à construire (null s'il est au max).
export function prochainNiveauAscenseur(etat: EtatJeu): NiveauAscenseur | null {
  return NIVEAUX_ASCENSEUR[etat.ascenseur.niveau] ?? null
}

export function peutAmeliorerAscenseur(etat: EtatJeu): boolean {
  const prochain = prochainNiveauAscenseur(etat)
  if (prochain === null) return false
  return quantite(etat, 'fer') >= prochain.fer && quantite(etat, 'redstone') >= prochain.redstone
}

// Construit l'ascenseur (niveau 1) ou l'améliore. Ça se fait directement dans la mine.
export function ameliorerAscenseur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauAscenseur(etat)
  if (prochain === null || !peutAmeliorerAscenseur(etat) || etat.ascenseur.tempsRestant > 0) return []
  retirer(etat, 'fer', prochain.fer)
  retirer(etat, 'redstone', prochain.redstone)
  etat.ascenseur.niveau = prochain.niveau
  if (prochain.niveau === 1) return ['🛗 Ascenseur construit ! Il remonte ton sac au marché quand il est plein.']
  return [`🛗 Ascenseur amélioré au niveau ${prochain.niveau} : ${prochain.capacite} objets par voyage.`]
}

// L'ascenseur attend au niveau du joueur, prêt à partir.
export function ascenseurDisponible(etat: EtatJeu): boolean {
  return etat.ascenseur.niveau > 0 && etat.ascenseur.tempsRestant === 0
}

// Charge l'ascenseur avec le sac (sauf les objets décochés, et dans la limite de sa
// capacité, les objets les plus précieux d'abord) et l'envoie au marché.
export function envoyerAscenseur(etat: EtatJeu): string[] {
  const niveau = niveauAscenseur(etat)
  if (niveau === null || !auFond(etat) || !ascenseurDisponible(etat)) return []

  const chargement: Inventaire = {}
  let place = niveau.capacite
  const objets = (Object.entries(objetsAVendre(etat)) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  for (const [bloc, nombre] of objets) {
    const pris = Math.min(nombre, place)
    if (pris <= 0) break
    chargement[bloc] = pris
    retirer(etat, bloc, pris)
    place -= pris
  }
  if (Object.keys(chargement).length === 0) return []

  // Aller jusqu'à la surface, puis retour au niveau du joueur.
  const duree = Math.max(1, 2 * positionFront(etat) * niveau.secondesParMetre)
  etat.ascenseur = { niveau: etat.ascenseur.niveau, chargement, tempsRestant: duree, tempsTotal: duree }
  return ['🛗 L’ascenseur remonte ton chargement au marché.']
}

// Fait voyager l'ascenseur. Il vend son chargement en arrivant en haut (à mi-parcours).
export function avancerAscenseur(etat: EtatJeu, secondes: number): string[] {
  const ascenseur = etat.ascenseur
  if (ascenseur.tempsRestant <= 0) return []
  ascenseur.tempsRestant = Math.max(0, ascenseur.tempsRestant - secondes)
  const arriveEnHaut = ascenseur.tempsRestant <= ascenseur.tempsTotal / 2
  if (!arriveEnHaut || Object.keys(ascenseur.chargement).length === 0) return []

  const gain = valeurDe(etat, ascenseur.chargement)
  ascenseur.chargement = {}
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`🛗 L’ascenseur a vendu ton chargement : +${gain} $`]
}

// ---------------------------------------------------------------------------
// Réparation
// ---------------------------------------------------------------------------

export type DevisReparation = {
  unites: number // unités de matériau nécessaires
  dansLeSac: number // unités prises dans le sac
  aAcheter: number // unités achetées automatiquement
  cout: number // prix en $
  materiau: string // nom du matériau
}

export function devisReparation(etat: EtatJeu, niveau = etat.niveauPioche): DevisReparation {
  const pioche = PIOCHES[niveau]
  const usureActuelle = etat.pioches[niveau] ?? 0
  const unites = Math.ceil(usureActuelle / (pioche.durabilite * REPARATION_PAR_UNITE))

  if (pioche.reparation === 'planche') {
    return { unites, dansLeSac: 0, aAcheter: unites, cout: unites * PRIX_PLANCHE, materiau: 'planches' }
  }
  const materiau = pioche.reparation
  const dansLeSac = Math.min(unites, quantite(etat, materiau))
  const aAcheter = unites - dansLeSac
  const cout = aAcheter * BLOCS[materiau].prix * MULTIPLICATEUR_ACHAT
  return { unites, dansLeSac, aAcheter, cout, materiau: BLOCS[materiau].nom }
}

export function peutReparer(etat: EtatJeu, niveau = etat.niveauPioche): boolean {
  if (!(niveau in etat.pioches)) return false
  const devis = devisReparation(etat, niveau)
  return devis.unites > 0 && etat.argent >= devis.cout
}

export function reparer(etat: EtatJeu, niveau = etat.niveauPioche): string[] {
  if (!aLaSurface(etat) || !peutReparer(etat, niveau)) return []
  const devis = devisReparation(etat, niveau)
  const pioche = PIOCHES[niveau]
  if (pioche.reparation !== 'planche') retirer(etat, pioche.reparation, devis.dansLeSac)
  etat.argent -= devis.cout
  etat.pioches[niveau] = 0
  return [`🔧 Pioche en ${pioche.nom} réparée (${devis.unites} ${devis.materiau}).`]
}

// ---------------------------------------------------------------------------
// Pioches
// ---------------------------------------------------------------------------

// On peut acheter (ou racheter neuve) toute pioche déjà débloquée, et débloquer la suivante.
export function peutAcheterPioche(etat: EtatJeu, niveau: number): boolean {
  const pioche = PIOCHES[niveau]
  if (!pioche || niveau > etat.meilleure + 1) return false
  return etat.argent >= pioche.prix && possede(etat, pioche.materiaux)
}

export function acheterPioche(etat: EtatJeu, niveau: number): string[] {
  if (!aLaSurface(etat) || !peutAcheterPioche(etat, niveau)) return []
  const pioche = PIOCHES[niveau]
  const nouvelle = niveau > etat.meilleure
  etat.argent -= pioche.prix
  payerMateriaux(etat, pioche.materiaux)
  etat.pioches[niveau] = 0
  etat.niveauPioche = niveau
  etat.meilleure = Math.max(etat.meilleure, niveau)
  return [nouvelle ? `⛏️ Nouvelle pioche en ${pioche.nom} débloquée !` : `⛏️ Pioche en ${pioche.nom} neuve achetée.`]
}

export function equiper(etat: EtatJeu, niveau: number): string[] {
  if (!(niveau in etat.pioches) || niveau === etat.niveauPioche) return []
  etat.niveauPioche = niveau
  return [`Tu as équipé la pioche en ${PIOCHES[niveau].nom}.`]
}

// ---------------------------------------------------------------------------
// Boutique
// ---------------------------------------------------------------------------

export function prixProchainSac(etat: EtatJeu): number | null {
  const prochain = SACS[etat.niveauSac + 1]
  return prochain ? prochain.prix : null
}

export function acheterSac(etat: EtatJeu): string[] {
  const prix = prixProchainSac(etat)
  if (!aLaSurface(etat) || prix === null || etat.argent < prix) return []
  etat.argent -= prix
  etat.niveauSac += 1
  return [`🎒 Nouveau sac : ${tailleSac(etat)} places !`]
}

export function acheterSeau(etat: EtatJeu): string[] {
  if (!aLaSurface(etat) || etat.argent < PRIX_SEAU) return []
  etat.argent -= PRIX_SEAU
  etat.seaux += 1
  return ["🪣 Seau d'eau acheté."]
}

export function fabriquerTorches(etat: EtatJeu): string[] {
  if (quantite(etat, 'charbon') < 1) return []
  retirer(etat, 'charbon', 1)
  etat.torches += TORCHES_PAR_CHARBON
  return [`🕯️ +${TORCHES_PAR_CHARBON} torches.`]
}

// ---------------------------------------------------------------------------
// Enchantements
// ---------------------------------------------------------------------------

// Coût du prochain niveau d'un enchantement (null s'il est déjà au max).
export function coutEnchantement(etat: EtatJeu, id: IdEnchantement): { lapis: number; emeraudes: number } | null {
  const e = ENCHANTEMENTS[id]
  const prochain = etat.enchantements[id] + 1
  if (prochain > e.niveauMax) return null
  return { lapis: e.lapisParNiveau * prochain, emeraudes: e.emeraudesParNiveau * prochain }
}

export function peutEnchanter(etat: EtatJeu, id: IdEnchantement): boolean {
  const cout = coutEnchantement(etat, id)
  return cout !== null && quantite(etat, 'lapis') >= cout.lapis && quantite(etat, 'emeraude') >= cout.emeraudes
}

export function peutEncoreEnchanter(etat: EtatJeu): boolean {
  return LISTE_ENCHANTEMENTS.some((id) => coutEnchantement(etat, id) !== null)
}

export function enchanter(etat: EtatJeu, id: IdEnchantement): string[] {
  const cout = coutEnchantement(etat, id)
  if (!aLaSurface(etat) || cout === null || !peutEnchanter(etat, id)) return []
  retirer(etat, 'lapis', cout.lapis)
  retirer(etat, 'emeraude', cout.emeraudes)
  etat.enchantements[id] += 1
  return [`✨ ${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])} !`]
}

export function chiffreRomain(n: number): string {
  return ['0', 'I', 'II', 'III', 'IV', 'V'][n] ?? String(n)
}
