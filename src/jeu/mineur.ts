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
  PIOCHES,
  PORTEE_TORCHE,
  PRIX_PLANCHE,
  PRIX_SEAU,
  PROFONDEUR_BEDROCK,
  REPARATION_PAR_UNITE,
  SACS,
  TORCHES_DEPART,
  TORCHES_PAR_CHARBON,
  VISION_ECLAIREE,
  VISION_SOMBRE,
  VITESSE_MAINS_NUES,
  dureeCasse,
  type IdBloc,
  type IdEnchantement,
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

export type EtatJeu = {
  version: number
  argent: number
  profondeur: number // profondeur de la couche en cours, en mètres (1 = juste sous l'herbe)
  coucheActuelle: (IdBloc | null)[] // null = bloc déjà cassé
  couchesDessous: IdBloc[][] // couches sous la couche en cours (profondeur + 1, + 2, ...)
  enGalerie: boolean // true = on creuse à l'horizontale
  pioches: Record<number, number> // pioches possédées : niveau -> usure
  niveauPioche: number // la pioche équipée
  meilleure: number // plus haut niveau de pioche débloqué
  inventaire: Inventaire // le contenu du sac
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

export const VERSION_ETAT = 1

// ---------------------------------------------------------------------------
// Création d'une partie
// ---------------------------------------------------------------------------

export function creerPartie(aleatoire: Aleatoire, prestige = 0, succes: string[] = []): EtatJeu {
  const couchesDessous: IdBloc[][] = []
  for (let i = 1; i <= COUCHES_EN_AVANCE; i++) couchesDessous.push(genererCouche(1 + i, aleatoire))

  return {
    version: VERSION_ETAT,
    argent: 0,
    profondeur: 1,
    coucheActuelle: genererCouche(1, aleatoire),
    couchesDessous,
    enGalerie: false,
    pioches: { 0: 0 }, // la pioche en bois est offerte
    niveauPioche: 0,
    meilleure: 0,
    inventaire: {},
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
export function prestige(etat: EtatJeu, aleatoire: Aleatoire): EtatJeu {
  return creerPartie(aleatoire, etat.prestige + 1, etat.succes)
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

// Nombre de couches visibles (la couche en cours comprise).
export function vision(etat: EtatJeu): number {
  if (etat.profondeur <= 3) return VISION_ECLAIREE
  const eclaire = etat.torchesPosees.some((d) => d <= etat.profondeur && etat.profondeur - d <= PORTEE_TORCHE)
  return eclaire ? VISION_ECLAIREE : VISION_SOMBRE
}

// Le prochain bloc à casser dans la couche en cours.
export function indexBlocActuel(etat: EtatJeu): number {
  return etat.coucheActuelle.findIndex((b) => b !== null)
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

function ajouter(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  if (nombre <= 0) return
  etat.inventaire[bloc] = quantite(etat, bloc) + nombre
}

function retirer(etat: EtatJeu, bloc: IdBloc, nombre: number): void {
  const reste = quantite(etat, bloc) - nombre
  if (reste > 0) etat.inventaire[bloc] = reste
  else delete etat.inventaire[bloc] // on nettoie les zéros
}

// Met des objets dans le sac s'il reste de la place. Renvoie le nombre qui n'a pas tenu.
function ramasser(etat: EtatJeu, bloc: IdBloc, nombre: number): number {
  const rentre = Math.min(nombre, placeLibre(etat))
  ajouter(etat, bloc, rentre)
  return nombre - rentre
}

function possede(etat: EtatJeu, materiaux: Inventaire): boolean {
  return Object.entries(materiaux).every(([bloc, nombre]) => quantite(etat, bloc as IdBloc) >= (nombre ?? 0))
}

function payerMateriaux(etat: EtatJeu, materiaux: Inventaire): void {
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
  if (etat.victoire || index === -1) return messages
  const bloc = etat.coucheActuelle[index] as IdBloc

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
  if (perdus > 0) messages.push('🎒 Sac plein ! Vends pour faire de la place.')
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
    etat.coucheActuelle = []
    etat.couchesDessous = []
    etat.victoire = true
    messages.push('🏆 Tu as atteint la bedrock !')
    return messages
  }

  // On descend d'un mètre : la première couche du dessous devient la couche en cours.
  etat.profondeur = suivante
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

// Ce que la vente garde de côté : les matériaux de la prochaine pioche, et les
// lapis et émeraudes encore nécessaires pour les enchantements.
export function quantitesReservees(etat: EtatJeu): Inventaire {
  const reserve: Inventaire = {}

  const prochaine = PIOCHES[etat.meilleure + 1]
  if (prochaine) {
    for (const [bloc, nombre] of Object.entries(prochaine.materiaux)) reserve[bloc as IdBloc] = nombre
  }

  let lapis = 0
  let emeraudes = 0
  for (const id of LISTE_ENCHANTEMENTS) {
    const e = ENCHANTEMENTS[id]
    for (let n = etat.enchantements[id] + 1; n <= e.niveauMax; n++) {
      lapis += e.lapisParNiveau * n
      emeraudes += e.emeraudesParNiveau * n
    }
  }
  if (lapis > 0) reserve.lapis = lapis
  if (emeraudes > 0) reserve.emeraude = emeraudes

  return reserve
}

// Ce que rapporterait la vente, et ce qu'elle vendrait.
export function apercuVente(etat: EtatJeu): { gain: number; vendus: Inventaire } {
  const reserve = quantitesReservees(etat)
  const vendus: Inventaire = {}
  let gain = 0
  for (const [id, nombre] of Object.entries(etat.inventaire)) {
    const bloc = id as IdBloc
    const aVendre = Math.max(0, (nombre ?? 0) - (reserve[bloc] ?? 0))
    if (aVendre > 0) {
      vendus[bloc] = aVendre
      gain += aVendre * BLOCS[bloc].prix
    }
  }
  return { gain: Math.round(gain * bonusVente(etat)), vendus }
}

export function vendre(etat: EtatJeu): string[] {
  const { gain, vendus } = apercuVente(etat)
  if (gain === 0) return ['Rien à vendre pour le moment.']
  for (const [bloc, nombre] of Object.entries(vendus)) retirer(etat, bloc as IdBloc, nombre ?? 0)
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`💰 Vente : +${gain} $`]
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
  if (!peutReparer(etat, niveau)) return []
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
  if (!peutAcheterPioche(etat, niveau)) return []
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
  if (prix === null || etat.argent < prix) return []
  etat.argent -= prix
  etat.niveauSac += 1
  return [`🎒 Nouveau sac : ${tailleSac(etat)} places !`]
}

export function acheterSeau(etat: EtatJeu): string[] {
  if (etat.argent < PRIX_SEAU) return []
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
  if (cout === null || !peutEnchanter(etat, id)) return []
  retirer(etat, 'lapis', cout.lapis)
  retirer(etat, 'emeraude', cout.emeraudes)
  etat.enchantements[id] += 1
  return [`✨ ${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])} !`]
}

export function chiffreRomain(n: number): string {
  return ['0', 'I', 'II', 'III', 'IV', 'V'][n] ?? String(n)
}
