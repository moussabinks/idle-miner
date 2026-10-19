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
  BONUS_VITESSE_PRESTIGE,
  COUCHES_VISIBLES_DESSOUS,
  ENCHANTEMENTS,
  LISTE_ENCHANTEMENTS,
  MINERAIS_COFFRE,
  MULTIPLICATEUR_ACHAT,
  NIVEAUX_ASCENSEUR,
  PIOCHES,
  LARGEUR_MINE,
  PRIX_PLANCHE,
  PRIX_SEAU,
  PROFONDEUR_BEDROCK,
  REPARATION_PAR_UNITE,
  SACS,
  SECONDES_PAR_CASE,
  SECONDES_PAR_METRE_ECHELLE,
  VITESSE_MAINS_NUES,
  dureeCasse,
  type Cout,
  type IdBloc,
  type IdEnchantement,
  type NiveauAscenseur,
  type Pioche,
} from './donnees'
import { genererCouche, poidsDesBlocs } from './mine'
import {
  appliquerTalentsDeDepart,
  bonusVenteTalents,
  multiplicateurCoffre,
  multiplicateurAscenseur,
  multiplicateurPioche,
  type IdTalent,
} from './talents'

// Nombre de couches gardées en mémoire (et affichées) sous la couche en cours.
export const COUCHES_EN_AVANCE = COUCHES_VISIBLES_DESSOUS

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

// L'ascenseur : une cabine qui monte et descend le long du puits.
// Il peut remonter les minerais tout seul, ou emmener le mineur.
export type Ascenseur = {
  niveau: number // 0 = pas encore construit
  position: number // où est la cabine, en mètres (0 = au village), comme le joueur
  cible: number // où va la cabine
  chargement: Inventaire // ce qu'elle transporte (vendu en arrivant au village)
  passager: boolean // true = le mineur est dans la cabine
  retourAuFront: boolean // true = après avoir vendu, elle redescend toute seule au front de taille
  quai: Inventaire // les blocs qui attendent au pied de l'ascenseur quand le sac est plein
  garder: IdBloc[] // les objets que l'ascenseur ne prend pas (décochés dans le sac)
  envoiDemande: boolean // true = on a demandé un envoi : la cabine vient, puis repart chargée
  lotDemande: Inventaire | null // ce qu'on a choisi d'envoyer (null = tous les objets cochés)
  envoiAuto: boolean // true = quand le sac est plein, l'ascenseur part tout seul au marché
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
  nonCoches: IdBloc[] // les objets du chariot décochés (ni vendus, ni mis dans le sac)
  rechargeAuto: boolean // la foreuse brûle le charbon qu'elle remonte (débloqué au niveau 3 de forage)
  nombre: number // combien de foreuses (à partir du prestige 3, on peut en acheter d'autres)
}

// Un mineur employé (prestige 2) : il creuse tout seul dans sa propre galerie, remonte
// vendre sa récolte quand son sac est plein, puis redescend. Les règles sont dans employes.ts.
export type Employe = {
  nom: string
  niveau: number // sa pioche (index dans NIVEAUX_EMPLOYE)
  profondeur: number // la profondeur de sa galerie
  etape: 'creuse' | 'monte' | 'vend' | 'descend'
  position: number // où il est pendant ses trajets (0 = au village)
  sac: Inventaire
  progression: number // fraction du prochain bloc (en creusant), ou secondes passées au marché (en vendant)
  blocsCasses: number
  gagne: number // ce qu'il t'a rapporté (après son salaire)
}

// Pour quitter le front de taille, le mineur marche d'abord jusqu'au puits (à gauche),
// puis prend l'ascenseur s'il est là, sinon l'échelle.
export type Depart = {
  destination: number // où il va ensuite (0 = village)
  parEchelle: boolean // true = il prend l'échelle même si l'ascenseur est là
  temps: number // secondes passées sur la case en cours
  lot?: Inventaire // ce que l'ascenseur emporte en montant (sinon : tout ce qui n'est pas gardé)
}

export type EtatJeu = {
  version: number
  // Position du joueur sur l'échelle, en mètres : 0 = au village, profondeur - 1 = au front de taille.
  // C'est un nombre à virgule pendant qu'il grimpe.
  position: number
  cible: number // là où le joueur se dirige sur l'échelle
  colonneMineur: number // où se tient le mineur au-dessus de la couche en cours (0 à 9)
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
  prestige: number
  succes: string[] // identifiants des succès débloqués (gardés au prestige)
  stats: Statistiques
  argentGagneAvant: number // l'argent gagné pendant les prestiges précédents (pour le classement)
  victoire: boolean
  talents: IdTalent[] // l'arbre de prestige (gardé à chaque prestige)
  employes: Employe[] // les mineurs employés (gardés à chaque prestige)
  depart: Depart | null // le mineur marche jusqu'au puits avant de monter (null = il ne part pas)
  peculeRecu: boolean // le talent « Pécule » a-t-il déjà donné son argent dans cette partie ?
}

export const VERSION_ETAT = 11

// ---------------------------------------------------------------------------
// Création d'une partie
// ---------------------------------------------------------------------------

// Le premier mètre est l'entrée du puits, déjà creusée : on commence à creuser à -2 m.
export const PROFONDEUR_DEPART = 2

export function nouvelleForeuse(): Foreuse {
  return {
    active: false,
    carburant: 0,
    niveauVitesse: 0,
    niveauChariot: 0,
    chariot: {},
    profondeur: 1,
    progression: 0,
    blocsFores: 0,
    nonCoches: [],
    rechargeAuto: false,
    nombre: 1,
  }
}

export function nouvelAscenseur(): Ascenseur {
  return {
    niveau: 0,
    position: 0,
    cible: 0,
    chargement: {},
    passager: false,
    retourAuFront: false,
    quai: {},
    garder: [],
    envoiDemande: false,
    lotDemande: null,
    envoiAuto: false,
  }
}

// Ce qu'une nouvelle partie reprend de la précédente, au prestige.
export type Heritage = {
  succes: string[]
  nonAVendre: IdBloc[]
  foreuse: Foreuse
  talents: IdTalent[]
  niveauAscenseur: number
  employes: Employe[]
  argentGagneAvant: number
}

export function creerPartie(aleatoire: Aleatoire, prestige = 0, heritage: Partial<Heritage> = {}): EtatJeu {
  const {
    succes = [],
    nonAVendre = [],
    foreuse = nouvelleForeuse(),
    talents = [],
    niveauAscenseur = 0,
    employes = [],
    argentGagneAvant = 0,
  } = heritage
  const couchesDessous: IdBloc[][] = []
  for (let i = 1; i <= COUCHES_EN_AVANCE; i++) couchesDessous.push(genererCouche(PROFONDEUR_DEPART + i, aleatoire))

  const etat: EtatJeu = {
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
    // L'ascenseur garde son niveau (la cabine attend au village).
    ascenseur: { ...nouvelAscenseur(), niveau: niveauAscenseur },
    foreuse: structuredClone(foreuse),
    enchantements: { efficacite: 0, fortune: 0, solidite: 0 },
    niveauSac: 0,
    seaux: 0,
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
    argentGagneAvant,
    victoire: false,
    talents: [...talents],
    employes: structuredClone(employes),
    depart: null,
    peculeRecu: false,
  }
  appliquerTalentsDeDepart(etat)
  return etat
}

// Recommence une partie après la bedrock, avec un niveau de prestige en plus.
// On garde les succès, les objets gardés au marché, les talents, et tout ce qui
// automatise le jeu : la foreuse, le niveau de l'ascenseur et les mineurs employés.
// L'argent gagné est ajouté au total de la partie (pour le classement).
// Le point de prestige gagné se dépense ensuite dans l'arbre (voir talents.ts).
export function prestige(etat: EtatJeu, aleatoire: Aleatoire): EtatJeu {
  return creerPartie(aleatoire, etat.prestige + 1, {
    succes: etat.succes,
    nonAVendre: etat.nonAVendre,
    foreuse: foreuseApresPrestige(etat.foreuse),
    talents: etat.talents,
    niveauAscenseur: etat.ascenseur.niveau,
    employes: etat.employes.map(employeApresPrestige),
    argentGagneAvant: argentGagneTotal(etat),
  })
}

// Au prestige, la foreuse garde seulement ses améliorations (activation, vitesse, chariot,
// nombre de foreuses, options) : plus de charbon, chariot vide, et elle repart de la surface.
export function foreuseApresPrestige(foreuse: Foreuse): Foreuse {
  return {
    ...nouvelleForeuse(),
    active: foreuse.active,
    niveauVitesse: foreuse.niveauVitesse,
    niveauChariot: foreuse.niveauChariot,
    nombre: foreuse.nombre,
    rechargeAuto: foreuse.rechargeAuto,
    nonCoches: [...foreuse.nonCoches],
  }
}

// Pareil pour les mineurs employés : ils gardent leur pioche, mais recommencent
// une galerie depuis la surface, le sac vide.
export function employeApresPrestige(employe: Employe): Employe {
  return { ...employe, profondeur: 2, etape: 'descend', position: 0, sac: {}, progression: 0 }
}

// Tout l'argent gagné depuis le début, prestiges compris (c'est ce que classe le leaderboard).
export function argentGagneTotal(etat: EtatJeu): number {
  return etat.argentGagneAvant + etat.stats.argentGagne
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

// Bonus de vitesse des pioches gagné avec les prestiges (+10 % par prestige).
export function bonusVitessePrestige(etat: EtatJeu): number {
  return 1 + BONUS_VITESSE_PRESTIGE * etat.prestige
}

export function vitesse(etat: EtatJeu): number {
  if (estCassee(etat)) return VITESSE_MAINS_NUES
  const bonusEfficacite = 1 + 0.25 * etat.enchantements.efficacite
  return piocheEquipee(etat).vitesse * bonusEfficacite * bonusVitessePrestige(etat) * multiplicateurPioche(etat)
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
  return 1 + BONUS_PRESTIGE * etat.prestige + bonusVenteTalents(etat)
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

// A-t-on de quoi payer ce coût (argent et matériaux du sac) ?
export function peutPayer(etat: EtatJeu, cout: Cout): boolean {
  return etat.argent >= (cout.argent ?? 0) && possede(etat, cout.materiaux)
}

export function payer(etat: EtatJeu, cout: Cout): void {
  etat.argent -= cout.argent ?? 0
  payerMateriaux(etat, cout.materiaux)
}

export function payerMateriaux(etat: EtatJeu, materiaux: Inventaire): void {
  for (const [bloc, nombre] of Object.entries(materiaux)) retirer(etat, bloc as IdBloc, nombre ?? 0)
}

// ---------------------------------------------------------------------------
// Minage
// ---------------------------------------------------------------------------

// La chance de doubler un minerai avec Fortune : 20 % par niveau (Fortune III : 60 %).
export const CHANCE_FORTUNE_PAR_NIVEAU = 0.2

// Nombre d'objets obtenus en cassant un bloc (enchantement Fortune sur les minerais) :
// 1, ou 2 si la chance de Fortune tombe.
export function nbDrops(etat: EtatJeu, bloc: IdBloc, aleatoire: Aleatoire): number {
  const fortune = etat.enchantements.fortune
  if (!BLOCS[bloc].minerai || fortune === 0) return 1
  return aleatoire() < fortune * CHANCE_FORTUNE_PAR_NIVEAU ? 2 : 1
}

// Casse le prochain bloc de la couche en cours.
export function casserBloc(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  const index = indexBlocActuel(etat)
  if (!auFond(etat) || index === -1 || etat.depart !== null) return messages
  const bloc = etat.coucheActuelle[index] as IdBloc
  etat.colonneMineur = index // le mineur se place au-dessus du bloc

  etat.stats.tempsMinage += dureeBlocActuel(etat)

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

  messages.push(...finirBloc(etat, index, bloc, aleatoire))
  return messages
}

// Ce qui se passe une fois un bloc cassé :
// on récolte, puis on passe à la couche suivante si c'était le dernier bloc.
function finirBloc(etat: EtatJeu, index: number, bloc: IdBloc, aleatoire: Aleatoire): string[] {
  etat.stats.blocsCasses += 1
  const messages = recolter(etat, bloc, aleatoire)
  etat.coucheActuelle[index] = null
  if (indexBlocActuel(etat) === -1) messages.push(...passerCoucheSuivante(etat, aleatoire))
  return messages
}

// Range des objets : dans le sac, et s'il est plein, sur le quai de l'ascenseur
// (ils seront remontés au prochain voyage). Renvoie le nombre d'objets perdus.
function stocker(etat: EtatJeu, bloc: IdBloc, nombre: number): number {
  const reste = ramasser(etat, bloc, nombre)
  const surLeQuai = Math.min(reste, placeQuai(etat))
  if (surLeQuai > 0) etat.ascenseur.quai[bloc] = (etat.ascenseur.quai[bloc] ?? 0) + surLeQuai
  return reste - surLeQuai
}

// Peut-on encore ranger un bloc (dans le sac ou sur le quai de l'ascenseur) ?
export function peutStocker(etat: EtatJeu): boolean {
  return placeLibre(etat) > 0 || placeQuai(etat) > 0
}

// Les minerais qu'on peut trouver à cette profondeur (pour les coffres).
function mineraisDuCoin(etat: EtatJeu): IdBloc[] {
  const minerais = poidsDesBlocs(etat.profondeur)
    .map((c) => c.valeur)
    .filter((id) => MINERAIS_COFFRE.includes(id))
  return minerais.length > 0 ? minerais : ['charbon']
}

// Ce qu'on obtient en cassant un bloc.
function recolter(etat: EtatJeu, bloc: IdBloc, aleatoire: Aleatoire): string[] {
  const messages: string[] = []

  if (bloc === 'lave') {
    if (etat.seaux > 0) {
      etat.seaux -= 1
      etat.stats.lavesEteintes += 1
      stocker(etat, 'obsidienne', 1)
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
    const argent = (entierEntre(aleatoire, 20, 60) + etat.profondeur * entierEntre(aleatoire, 3, 8)) * multiplicateurCoffre(etat)
    etat.argent += argent
    etat.stats.argentGagne += argent
    etat.stats.coffresOuverts += 1
    // Un minerai parmi ceux qu'on trouve à cette profondeur.
    const minerai = choisir(aleatoire, mineraisDuCoin(etat))
    stocker(etat, minerai, 1)
    messages.push(`🧰 Coffre au trésor : +${argent} $ et 1 ${BLOCS[minerai].nom} !`)
    return messages
  }

  if (bloc === 'geode') {
    const nombre = entierEntre(aleatoire, 3, 6)
    etat.stats.geodesCassees += 1
    const perdus = stocker(etat, 'amethyste', nombre)
    messages.push(`🔮 Géode : +${nombre - perdus} améthystes !`)
    return messages
  }

  // Bloc normal : il va dans le sac.
  const nombre = nbDrops(etat, bloc, aleatoire)
  if (bloc === 'diamant') etat.stats.diamantsTrouves += nombre
  const perdus = stocker(etat, bloc, nombre)
  if (perdus > 0) messages.push('🎒 Sac plein ! Remonte vendre au marché (bouton Village) ou envoie l’ascenseur.')
  return messages
}

// Appelé quand les blocs de la couche en cours sont tous cassés.
function passerCoucheSuivante(etat: EtatJeu, aleatoire: Aleatoire): string[] {
  const messages: string[] = []
  const suivante = etat.profondeur + 1

  // Juste au-dessus de la bedrock : on ne peut plus descendre, mais on continue
  // de creuser des galeries (pour tester ses enchantements avant le prestige).
  if (suivante >= PROFONDEUR_BEDROCK) {
    if (!etat.victoire) {
      etat.victoire = true
      messages.push('🏆 Tu as atteint la bedrock ! Continue de creuser ici, ou passe prestige à l’entrée de la mine (village).')
    }
    etat.enGalerie = true
    etat.coucheActuelle = genererCouche(etat.profondeur, aleatoire)
    return messages
  }

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

  // On descend d'un mètre : la première couche du dessous devient la couche en cours,
  // et le mineur descend avec elle.
  const joueurAuFront = auFond(etat)
  const ancienFront = positionFront(etat)
  etat.profondeur = suivante
  if (joueurAuFront) {
    etat.position = positionFront(etat)
    etat.cible = etat.position
  }

  // L'ascenseur suit le front de taille (s'il y attendait, ou s'il y redescendait).
  const ascenseur = etat.ascenseur
  if (ascenseur.niveau > 0 && !ascenseur.passager && ascenseur.cible === ancienFront) {
    ascenseur.cible = positionFront(etat)
    if (ascenseur.position === ancienFront) ascenseur.position = ascenseur.cible
  }

  etat.coucheActuelle = etat.couchesDessous.shift() ?? genererCouche(suivante, aleatoire)
  const profondeurAGenerer = suivante + COUCHES_EN_AVANCE
  etat.couchesDessous.push(profondeurAGenerer < PROFONDEUR_BEDROCK ? genererCouche(profondeurAGenerer, aleatoire) : [])

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

// Garder (aVendre = false) ou non un objet quand on vend tout.
export function reglerVente(etat: EtatJeu, bloc: IdBloc, aVendre: boolean): string[] {
  const garder = etat.nonAVendre.filter((b) => b !== bloc)
  etat.nonAVendre = aVendre ? garder : [...garder, bloc]
  return []
}

// Vend une partie du sac : les quantités choisies avec les jauges du marché.
export function vendreLot(etat: EtatJeu, lot: Inventaire): string[] {
  if (!aLaSurface(etat)) return ['⬆️ Le marché est à la surface : remonte au village.']
  const vendus: Inventaire = {}
  for (const [id, nombre] of Object.entries(lot)) {
    const bloc = id as IdBloc
    const pris = Math.max(0, Math.min(Math.floor(nombre ?? 0), quantite(etat, bloc)))
    if (pris > 0) vendus[bloc] = pris
  }
  const gain = valeurDe(etat, vendus)
  if (gain === 0) return ['Rien à vendre pour le moment.']
  for (const [bloc, nombre] of Object.entries(vendus)) retirer(etat, bloc as IdBloc, nombre ?? 0)
  etat.argent += gain
  etat.stats.argentGagne += gain
  return [`💰 Vente : +${gain} $`]
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
  etat.depart = null // on change d'avis : il ne part plus
  etat.colonneMineur = Math.min(LARGEUR_MINE - 1, Math.max(0, etat.colonneMineur + sens))
  return []
}

// Choisit où aller sur l'échelle (0 = village, positionFront = front de taille).
// Le joueur y va ensuite petit à petit (voir avancerTemps).
export function allerA(etat: EtatJeu, position: number): string[] {
  if (etat.ascenseur.passager) return [] // dans l'ascenseur, c'est la cabine qui nous porte
  etat.cible = Math.min(positionFront(etat), Math.max(0, Math.round(position)))
  return []
}

// Aller au village (0) ou au front de taille. Depuis le front, le mineur marche d'abord
// jusqu'au puits ; ensuite il prend l'ascenseur s'il est là (sauf parEchelle), sinon l'échelle.
export function voyager(etat: EtatJeu, destination: number, parEchelle = false, lot?: Inventaire): string[] {
  if (etat.ascenseur.passager) return []
  const arrivee = Math.min(positionFront(etat), Math.max(0, Math.round(destination)))
  if (auFond(etat) && etat.colonneMineur > 0 && arrivee < etat.position) {
    etat.depart = { destination: arrivee, parEchelle, temps: 0, lot }
    return []
  }
  etat.depart = null
  if (!parEchelle && ascenseurDisponible(etat)) {
    const messages = prendreAscenseur(etat, arrivee, lot)
    if (messages.length > 0) return messages
  }
  return allerA(etat, arrivee)
}

// Fait marcher le mineur vers le puits, case par case, puis le fait partir.
export function avancerMarche(etat: EtatJeu, secondes: number): string[] {
  const depart = etat.depart
  if (depart === null) return []
  if (!auFond(etat)) {
    etat.depart = null
    return []
  }
  depart.temps += secondes
  while (depart.temps >= SECONDES_PAR_CASE && etat.colonneMineur > 0) {
    depart.temps -= SECONDES_PAR_CASE
    etat.colonneMineur -= 1
  }
  if (etat.colonneMineur > 0) return []
  etat.depart = null
  return voyager(etat, depart.destination, depart.parEchelle, depart.lot)
}

// Arrête le joueur sur le prochain barreau (quand on relâche la flèche).
// S'il est pile sur un barreau, il avance quand même d'un barreau : un appui
// très court fait donc toujours bouger d'un mètre.
export function arreterSurEchelle(etat: EtatJeu): string[] {
  etat.depart = null // s'il marchait encore vers l'échelle, il s'arrête là
  const p = etat.position
  if (etat.cible < p) etat.cible = Math.max(etat.cible, Number.isInteger(p) ? p - 1 : Math.floor(p))
  if (etat.cible > p) etat.cible = Math.min(etat.cible, Number.isInteger(p) ? p + 1 : Math.ceil(p))
  return []
}

// Temps pour parcourir toute l'échelle depuis le front de taille.
export function dureeEchelle(etat: EtatJeu): number {
  return positionFront(etat) * secondesParMetre()
}

// Le temps pour grimper d'un mètre à l'échelle.
export function secondesParMetre(): number {
  return SECONDES_PAR_METRE_ECHELLE
}

// Le temps pour un mètre en ascenseur (plus court avec le talent « Ascenseur express »).
export function secondesParMetreAscenseur(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  return niveau === null ? 0 : niveau.secondesParMetre * multiplicateurAscenseur(etat)
}

// Fait grimper le joueur vers sa cible pendant quelques secondes.
export function avancerSurEchelle(etat: EtatJeu, secondes: number): string[] {
  if (!enMouvement(etat) || etat.ascenseur.passager) return []
  const pas = secondes / secondesParMetre()
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
  return prochain !== null && peutPayer(etat, prochain.cout)
}

// Construit l'ascenseur (niveau 1) ou l'améliore. Ça se fait directement dans la mine.
export function ameliorerAscenseur(etat: EtatJeu): string[] {
  const prochain = prochainNiveauAscenseur(etat)
  if (prochain === null || !peutAmeliorerAscenseur(etat) || ascenseurEnMouvement(etat)) return []
  payer(etat, prochain.cout)
  // À la construction, la cabine est installée là où se trouve le joueur.
  if (etat.ascenseur.niveau === 0) {
    etat.ascenseur.position = Math.round(etat.position)
    etat.ascenseur.cible = etat.ascenseur.position
  }
  etat.ascenseur.niveau = prochain.niveau
  if (prochain.niveau === 1) return ['🛗 Ascenseur construit ! Il remonte tes minerais (et toi) jusqu’au village.']
  return [`🛗 Ascenseur amélioré au niveau ${prochain.niveau} : ${prochain.capacite} objets par voyage.`]
}

export function ascenseurEnMouvement(etat: EtatJeu): boolean {
  return etat.ascenseur.position !== etat.ascenseur.cible
}

// La cabine est arrêtée au même endroit que le joueur (lui aussi arrêté) : on peut l'utiliser.
export function ascenseurDisponible(etat: EtatJeu): boolean {
  return (
    etat.ascenseur.niveau > 0 && !ascenseurEnMouvement(etat) && !enMouvement(etat) && etat.ascenseur.position === etat.position
  )
}

// Nombre d'objets qui attendent sur le quai, et la place qu'il y reste.
export function nbSurQuai(etat: EtatJeu): number {
  let total = 0
  for (const nombre of Object.values(etat.ascenseur.quai)) total += nombre ?? 0
  return total
}

export function placeQuai(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  return niveau === null ? 0 : Math.max(0, niveau.capacite - nbSurQuai(etat))
}

// Coche ou décoche un objet du sac (décoché = l'ascenseur le laisse dans le sac).
export function basculerChargement(etat: EtatJeu, bloc: IdBloc): string[] {
  const garder = etat.ascenseur.garder
  etat.ascenseur.garder = garder.includes(bloc) ? garder.filter((b) => b !== bloc) : [...garder, bloc]
  return []
}

// Coche ou décoche l'envoi automatique quand le sac est plein.
export function basculerEnvoiAuto(etat: EtatJeu): string[] {
  etat.ascenseur.envoiAuto = !etat.ascenseur.envoiAuto
  return []
}

// Combien d'objets partiraient au prochain envoi : le quai, puis les objets cochés du sac,
// dans la limite de la place dans la cabine.
// Avec un « lot » (les quantités choisies avec les jauges du sac), on n'envoie que ça ;
// sans lot, tous les objets qui ne sont pas gardés.
export function nbAEnvoyer(etat: EtatJeu, lot?: Inventaire): number {
  const niveau = niveauAscenseur(etat)
  if (niveau === null) return 0
  let total = nbSurQuai(etat)
  for (const [id, nombre] of Object.entries(etat.inventaire)) {
    total += quantiteChoisie(etat, id as IdBloc, nombre ?? 0, lot)
  }
  return Math.min(niveau.capacite, total)
}

// Combien d'objets de cette pile partent : la quantité du lot (sans dépasser la pile),
// ou toute la pile si l'objet n'est pas gardé.
function quantiteChoisie(etat: EtatJeu, bloc: IdBloc, nombre: number, lot?: Inventaire): number {
  if (lot) return Math.max(0, Math.min(nombre, lot[bloc] ?? 0))
  return etat.ascenseur.garder.includes(bloc) ? 0 : nombre
}

// Garder (envoyer = false) ou non un objet dans le sac quand l'ascenseur part.
export function reglerChargement(etat: EtatJeu, bloc: IdBloc, envoyer: boolean): string[] {
  const garder = etat.ascenseur.garder.filter((b) => b !== bloc)
  etat.ascenseur.garder = envoyer ? garder : [...garder, bloc]
  return []
}

// Remplit la cabine : d'abord ce qui attend sur le quai, puis le sac (sauf les objets
// décochés), les plus précieux en premier, dans la limite de sa capacité.
function chargerCabine(etat: EtatJeu, lot?: Inventaire): Inventaire {
  const niveau = niveauAscenseur(etat)
  const chargement: Inventaire = {}
  if (niveau === null) return chargement
  let place = niveau.capacite
  const parPrix = (a: [string, number | undefined], b: [string, number | undefined]) => BLOCS[b[0] as IdBloc].prix - BLOCS[a[0] as IdBloc].prix

  for (const [id, nombre] of Object.entries(etat.ascenseur.quai).sort(parPrix)) {
    const bloc = id as IdBloc
    const pris = Math.min(nombre ?? 0, place)
    if (pris <= 0) continue
    chargement[bloc] = (chargement[bloc] ?? 0) + pris
    const reste = (nombre ?? 0) - pris
    if (reste > 0) etat.ascenseur.quai[bloc] = reste
    else delete etat.ascenseur.quai[bloc]
    place -= pris
  }

  for (const [id, nombre] of Object.entries(etat.inventaire).sort(parPrix)) {
    const bloc = id as IdBloc
    const pris = Math.min(quantiteChoisie(etat, bloc, nombre ?? 0, lot), place)
    if (pris <= 0) continue
    chargement[bloc] = (chargement[bloc] ?? 0) + pris
    retirer(etat, bloc, pris)
    place -= pris
  }
  return chargement
}

// Envoie la cabine (sans le mineur) vendre au marché. Elle redescend ensuite au front de taille.
export function envoyerAscenseur(etat: EtatJeu, lot?: Inventaire): string[] {
  if (!ascenseurDisponible(etat) || etat.position === 0) return []
  const chargement = chargerCabine(etat, lot)
  if (Object.keys(chargement).length === 0) return []
  etat.ascenseur.chargement = chargement
  etat.ascenseur.cible = 0
  etat.ascenseur.retourAuFront = true
  return ['🛗 L’ascenseur remonte ton chargement au marché.']
}

// Le bouton « Envoyer à la surface » du sac : si la cabine est là, elle part tout de suite ;
// sinon on l'appelle (ou on attend qu'elle ait fini son voyage) et elle repartira chargée.
export function demanderEnvoi(etat: EtatJeu, lot?: Inventaire): string[] {
  if (etat.ascenseur.niveau === 0 || etat.position === 0 || nbAEnvoyer(etat, lot) === 0) return []
  if (ascenseurDisponible(etat)) return envoyerAscenseur(etat, lot)
  etat.ascenseur.envoiDemande = true
  etat.ascenseur.lotDemande = lot ?? null
  if (!ascenseurEnMouvement(etat)) appelerAscenseur(etat)
  return ['🛗 L’ascenseur arrive pour prendre ton chargement.']
}

// Fait venir la cabine là où se trouve le joueur.
export function appelerAscenseur(etat: EtatJeu): string[] {
  if (etat.ascenseur.niveau === 0 || ascenseurEnMouvement(etat) || enMouvement(etat)) return []
  if (etat.ascenseur.position === etat.position) return []
  etat.ascenseur.cible = etat.position
  etat.ascenseur.retourAuFront = false
  return ['🛗 L’ascenseur arrive.']
}

// Le mineur monte dans la cabine, vers le village (0) ou vers le front de taille.
// En montant, la cabine emporte aussi les minerais cochés : ils sont vendus en arrivant.
// En montant, la cabine emporte le « lot » choisi (ou tout ce qui n'est pas gardé).
export function prendreAscenseur(etat: EtatJeu, destination: number, lot?: Inventaire): string[] {
  if (!ascenseurDisponible(etat)) return []
  const arrivee = Math.min(positionFront(etat), Math.max(0, destination))
  if (arrivee === etat.position) return []
  const ascenseur = etat.ascenseur
  if (arrivee < etat.position) ascenseur.chargement = chargerCabine(etat, lot)
  ascenseur.passager = true
  ascenseur.retourAuFront = false
  ascenseur.cible = arrivee
  return [arrivee === 0 ? '🛗 En route vers le village !' : '🛗 En route vers le front de taille !']
}

// Temps pour que la cabine parcoure tout le puits (du front de taille au village).
export function dureeAscenseur(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  return niveau === null ? 0 : positionFront(etat) * secondesParMetreAscenseur(etat)
}

// Dans combien de secondes la cabine aura fini son voyage (retour au front compris,
// quand elle revient toute seule après avoir vendu). 0 si elle est arrêtée.
export function secondesAvantArretAscenseur(etat: EtatJeu): number {
  const niveau = niveauAscenseur(etat)
  const ascenseur = etat.ascenseur
  if (niveau === null || !ascenseurEnMouvement(etat)) return 0
  const metres = ascenseur.retourAuFront
    ? ascenseur.position + positionFront(etat) // elle monte au village, puis redescend au front
    : Math.abs(ascenseur.cible - ascenseur.position)
  return metres * secondesParMetreAscenseur(etat)
}

// Fait avancer la cabine (et le mineur s'il est dedans).
export function avancerAscenseur(etat: EtatJeu, secondes: number): string[] {
  const ascenseur = etat.ascenseur
  const niveau = niveauAscenseur(etat)
  if (niveau === null || !ascenseurEnMouvement(etat)) return []

  const pas = secondes / secondesParMetreAscenseur(etat)
  if (Math.abs(ascenseur.cible - ascenseur.position) <= pas) ascenseur.position = ascenseur.cible
  else ascenseur.position += Math.sign(ascenseur.cible - ascenseur.position) * pas

  // Le passager bouge avec la cabine.
  if (ascenseur.passager) {
    etat.position = ascenseur.position
    etat.cible = ascenseur.position
  }
  if (ascenseurEnMouvement(etat)) return []

  // La cabine est arrivée.
  const messages: string[] = []
  if (ascenseur.position === 0 && Object.keys(ascenseur.chargement).length > 0) {
    const gain = valeurDe(etat, ascenseur.chargement)
    ascenseur.chargement = {}
    etat.argent += gain
    etat.stats.argentGagne += gain
    messages.push(`🛗 L’ascenseur a vendu son chargement : +${gain} $`)
  }
  if (ascenseur.passager) {
    ascenseur.passager = false
    messages.push(etat.position === 0 ? '☀️ Te voilà au village !' : `⛏️ Au front de taille, à -${etat.profondeur} m.`)
  }
  if (ascenseur.retourAuFront && ascenseur.position === 0) {
    ascenseur.retourAuFront = false
    ascenseur.cible = positionFront(etat)
    return messages
  }

  // Un envoi a été demandé : la cabine repart chargée si le mineur est là,
  // sinon elle va le chercher (et on oublie la demande s'il est remonté au village).
  if (ascenseur.envoiDemande) {
    if (etat.position === 0) {
      ascenseur.envoiDemande = false
      ascenseur.lotDemande = null
    } else if (ascenseurDisponible(etat)) {
      const lot = ascenseur.lotDemande ?? undefined
      ascenseur.envoiDemande = false
      ascenseur.lotDemande = null
      messages.push(...envoyerAscenseur(etat, lot))
    } else if (!enMouvement(etat)) {
      ascenseur.cible = etat.position
    }
  }
  return messages
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

// ---------------------------------------------------------------------------
// Enchantements
// ---------------------------------------------------------------------------

// Coût du prochain niveau d'un enchantement (null s'il est déjà au max).
export function coutEnchantement(etat: EtatJeu, id: IdEnchantement): Cout | null {
  const e = ENCHANTEMENTS[id]
  const prochain = etat.enchantements[id] + 1
  if (prochain > e.niveauMax) return null
  return {
    argent: e.argentParNiveau * prochain,
    materiaux: { lapis: e.lapisParNiveau * prochain, emeraude: e.emeraudesParNiveau * prochain },
  }
}

export function peutEnchanter(etat: EtatJeu, id: IdEnchantement): boolean {
  const cout = coutEnchantement(etat, id)
  return cout !== null && peutPayer(etat, cout)
}

export function peutEncoreEnchanter(etat: EtatJeu): boolean {
  return LISTE_ENCHANTEMENTS.some((id) => coutEnchantement(etat, id) !== null)
}

export function enchanter(etat: EtatJeu, id: IdEnchantement): string[] {
  const cout = coutEnchantement(etat, id)
  if (!aLaSurface(etat) || cout === null || !peutEnchanter(etat, id)) return []
  payer(etat, cout)
  etat.enchantements[id] += 1
  return [`✨ ${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])} !`]
}

export function chiffreRomain(n: number): string {
  return ['0', 'I', 'II', 'III', 'IV', 'V'][n] ?? String(n)
}
