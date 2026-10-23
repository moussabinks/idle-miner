// Les wagonnets et leurs trajets (24/10).
//
// Au début, il n'y a aucun trajet : le joueur achète des rails, les pose au sol pour relier deux
// bâtiments, puis il choisit, dans le panneau du bâtiment de départ, « envoyer un wagonnet
// vers… ». Chaque trajet a son wagonnet, qui ne va que de son départ à son arrivée (il ne
// choisit jamais sa route au hasard) :
//   - Mine → Marché : il emporte le coffre de la mine et le vend ;
//   - Mine → Foreuse : il apporte le charbon du coffre à la foreuse ;
//   - Mine → Générateur : il apporte la redstone du coffre au générateur ;
//   - Foreuse → Marché : il vend le chariot de la foreuse.
// Les rails ne font jamais de boucle (voir batiments.ts) : entre deux bâtiments, il n'y a donc
// qu'une seule route. Plusieurs wagonnets peuvent rouler sur les mêmes rails : ils se croisent
// sans se gêner.
//
// Un wagonnet ne roule pas tout seul :
//   - le joueur peut le pousser (bouton dans le panneau du départ) : il fait l'aller-retour avec lui ;
//   - un trajet automatique a toujours son pousseur (27/10 : un employé embauché au Personnel
//     pour ce trajet, un par trajet). Il le pousse dès qu'il a quelque chose à porter ;
//   - si toutes les cases du trajet sont dans le rayon du générateur allumé, le wagonnet roule
//     tout seul, bien plus vite, mais il faut toujours son pousseur (il le lance du quai).

import {
  BLOCS,
  LIAISONS,
  LISTE_LIAISONS,
  NIVEAUX_POUSSEUR,
  NIVEAUX_WAGONNET,
  RARETES,
  RESERVE_GENERATEUR_WAGONNET,
  SECONDES_CHARGEMENT_WAGONNET,
  SECONDES_PAR_REDSTONE,
  VITESSE_POUSSE_JOUEUR,
  VITESSE_POUSSE_MINEUR,
  type IdBatiment,
  type IdBloc,
  type IdLiaison,
  type IdRarete,
  type NiveauPousseur,
} from './donnees'
import { livrerCharbon, placeCharbonForeuse, retirerDuChariot } from './foreuse'
import { blocsDuNiveau } from './mine'
import { casesDansLeRayon, generateurEnMarche, multiplicateurGenerateur } from './generateur'
import { ajouterA, encaisser, nouveauTrajet, parPrix, payer, peutPayer, retirerDe, totalObjets, valeurDe, type EtatJeu, type Employe, type Inventaire, type Trajet } from './mineur'
import { batimentPose, railsEntre, type Case } from './village'
import { debloque } from './niveaux'

// ---------------------------------------------------------------------------
// Les lignes de rails et les trajets
// ---------------------------------------------------------------------------

// La ligne de rails d'une liaison (null : un des deux bâtiments n'est pas posé, ou les rails ne
// les relient pas).
export function ligneDe(etat: EtatJeu, liaison: IdLiaison): Case[] | null {
  const { depart, arrivee } = LIAISONS[liaison]
  if (!batimentPose(etat.village, depart) || !batimentPose(etat.village, arrivee)) return null
  return railsEntre(etat.village, depart, arrivee)
}

// Les liaisons qui partent d'un bâtiment et dont l'arrivée est construite.
export function liaisonsDepuis(etat: EtatJeu, depart: IdBatiment): IdLiaison[] {
  return LISTE_LIAISONS.filter((id) => LIAISONS[id].depart === depart && batimentPose(etat.village, LIAISONS[id].arrivee) !== null)
}

export function trajetDe(etat: EtatJeu, liaison: IdLiaison): Trajet | null {
  return etat.trajets.find((t) => t.liaison === liaison) ?? null
}

// La longueur d'un trajet, en cases (on part du bord du départ et on arrive au bord de l'arrivée).
export function longueurTrajet(ligne: Case[]): number {
  return ligne.length + 1
}

export function peutCreerTrajet(etat: EtatJeu, liaison: IdLiaison): boolean {
  return trajetDe(etat, liaison) === null && ligneDe(etat, liaison) !== null
}

// Le joueur envoie un wagonnet sur ce trajet (gratuit : ce sont les rails qui coûtent).
export function creerTrajet(etat: EtatJeu, liaison: IdLiaison): string[] {
  if (!peutCreerTrajet(etat, liaison)) return []
  etat.trajets.push(nouveauTrajet(liaison))
  return [`🛤️ Nouveau trajet : un wagonnet ${LIAISONS[liaison].description}.`]
}

// ---------------------------------------------------------------------------
// Régler un trajet (la fenêtre qui s'ouvre en touchant ses rails, 27/10)
// ---------------------------------------------------------------------------
// Dès que des rails relient deux bâtiments, une bulle apparaît au milieu de la ligne : on la
// touche (ou on touche les rails) pour régler le trajet : l'activer ou non, et choisir les objets
// que le wagonnet emporte.

// Les objets qu'on peut choisir d'envoyer sur ce trajet. Vers le marché : tout ce que sort la
// mine à son niveau actuel. Vers la foreuse et le générateur, il n'y a pas le choix (le charbon,
// la redstone) : la liste est vide.
export function objetsAuChoix(etat: EtatJeu, liaison: IdLiaison): IdBloc[] {
  if (LIAISONS[liaison].arrivee !== 'marche') return []
  return blocsDuNiveau(etat.niveauMine)
}

// Ce que le wagonnet de ce trajet emporte toujours (sans choix).
export function objetFixe(liaison: IdLiaison): IdBloc | null {
  if (liaison === 'mine-foreuse') return 'charbon'
  if (liaison === 'mine-generateur') return 'redstone'
  return null
}

export function exclusDe(etat: EtatJeu, liaison: IdLiaison): IdBloc[] {
  return trajetDe(etat, liaison)?.exclus ?? []
}

export type ReglageTrajet = { actif: boolean; exclus: IdBloc[] }

// Le joueur valide la fenêtre du trajet : on crée le trajet, on change ses objets, ou on l'arrête.
export function reglerTrajet(etat: EtatJeu, liaison: IdLiaison, reglage: ReglageTrajet): string[] {
  const exclus = reglage.exclus.filter((bloc) => bloc in BLOCS)
  if (!reglage.actif) return supprimerTrajet(etat, liaison)
  const messages = trajetDe(etat, liaison) ? [] : creerTrajet(etat, liaison)
  const trajet = trajetDe(etat, liaison)
  if (!trajet) return messages
  trajet.exclus = exclus
  // Un objet envoyé depuis la mine n'est plus « gardé » au marché non plus (sinon le wagonnet le
  // laisserait quand même dans le coffre).
  if (LIAISONS[liaison].depart === 'puits') {
    const auChoix = objetsAuChoix(etat, liaison)
    etat.nonAVendre = etat.nonAVendre.filter((b) => !auChoix.includes(b) || exclus.includes(b))
  }
  return messages.length > 0 ? messages : ['🛤️ Trajet réglé.']
}

// Les objets décochés de ce trajet, tels que la fenêtre du trajet les montre au départ.
export function exclusAffiches(etat: EtatJeu, liaison: IdLiaison): IdBloc[] {
  return objetsAuChoix(etat, liaison).filter((bloc) => trajetDe(etat, liaison) !== null && !objetEnvoye(etat, liaison, bloc))
}

// L'aperçu d'un trajet (27/10), pour la fenêtre du trajet : ce que le wagonnet emporterait au
// prochain voyage avec ces objets décochés, ce que ça vaut, qui le fait rouler, le temps d'un
// aller-retour, et ce que ça rapporterait par minute.
export type ApercuTrajet = {
  objets: [IdBloc, number][] // le prochain chargement (les plus chers d'abord, dans la limite des places)
  places: number
  valeur: number // ce qu'il vendrait (0 si l'arrivée n'est pas le marché)
  moteur: 'electricite' | 'pousseur' | 'toi'
  secondes: number // un aller-retour, chargement compris
  parMinute: number // $ par minute, à ce rythme et avec ce stock
}

export function apercuTrajet(etat: EtatJeu, liaison: IdLiaison, exclus: IdBloc[]): ApercuTrajet {
  const places = capaciteTrajet(etat, liaison)
  let reste = places
  const objets: [IdBloc, number][] = []
  for (const [bloc, nombre] of aEmporter(etat, liaison, exclus)) {
    const pris = Math.min(nombre, reste)
    if (pris <= 0) continue
    objets.push([bloc, pris])
    reste -= pris
  }
  const versLeMarche = LIAISONS[liaison].arrivee === 'marche'
  const valeur = versLeMarche ? valeurDe(Object.fromEntries(objets)) : 0
  const pousseur = etat.employes.find((e) => e.role === 'pousseur' && e.trajet === liaison && e.tempsPaye > 0)
  const moteur = pousseur ? (trajetElectrique(etat, liaison) ? 'electricite' : 'pousseur') : 'toi'
  const vitesse = pousseur ? VITESSE_POUSSE_MINEUR * forcePousseur(pousseur.rarete) * (moteur === 'electricite' ? multiplicateurGenerateur(etat) : 1) : VITESSE_POUSSE_JOUEUR
  const secondes = secondesAllerRetour(etat, liaison, vitesse)
  return { objets, places, valeur, moteur, secondes, parMinute: secondes > 0 ? (valeur / secondes) * 60 : 0 }
}

// Le wagonnet de ce trajet emporte-t-il ce minerai ? (Non s'il est décoché pour ce trajet, ou
// « gardé » au marché pour le trajet de la mine.)
export function objetEnvoye(etat: EtatJeu, liaison: IdLiaison, bloc: IdBloc): boolean {
  if (exclusDe(etat, liaison).includes(bloc)) return false
  return !(LIAISONS[liaison].depart === 'puits' && etat.nonAVendre.includes(bloc))
}

// Cocher ou décocher un minerai pour le wagonnet d'un trajet (au panneau de la mine).
export function envoyerObjet(etat: EtatJeu, liaison: IdLiaison, bloc: IdBloc, envoyer: boolean): string[] {
  const trajet = trajetDe(etat, liaison)
  if (!trajet) return []
  const exclus = (trajet.exclus ?? []).filter((b) => b !== bloc)
  trajet.exclus = envoyer ? exclus : [...exclus, bloc]
  // Envoyé : il n'est plus « gardé » non plus (sinon le wagonnet le laisserait quand même).
  if (envoyer && LIAISONS[liaison].depart === 'puits') etat.nonAVendre = etat.nonAVendre.filter((b) => b !== bloc)
  return []
}

// ---------------------------------------------------------------------------
// Ce que le wagonnet du marché fait de chaque minerai du coffre (23/10)
// ---------------------------------------------------------------------------

// Trois choix, au panneau de la mine : tout vendre, en garder un nombre fixe dans le coffre (le
// wagonnet emporte le reste), ou tout garder.
export type ChoixWagonnet = 'vendre' | 'garder' | 'tout-garder'

export function choixWagonnet(etat: EtatJeu, bloc: IdBloc): { choix: ChoixWagonnet; nombre: number } {
  if (!objetEnvoye(etat, 'mine-marche', bloc)) return { choix: 'tout-garder', nombre: 0 }
  const nombre = etat.coffre.garder?.[bloc] ?? 0
  return nombre > 0 ? { choix: 'garder', nombre } : { choix: 'vendre', nombre: 0 }
}

export function reglerWagonnet(etat: EtatJeu, bloc: IdBloc, choix: ChoixWagonnet, nombre = 0): string[] {
  if (!trajetDe(etat, 'mine-marche')) return []
  envoyerObjet(etat, 'mine-marche', bloc, choix !== 'tout-garder')
  const garder = (etat.coffre.garder ??= {})
  const n = Math.max(0, Math.floor(nombre))
  if (choix === 'garder' && n > 0) garder[bloc] = n
  else delete garder[bloc]
  return []
}

// Les trajets qui passent par cette case de rails (on la touche pour les régler).
export function liaisonsSurLaCase(etat: EtatJeu, x: number, y: number): IdLiaison[] {
  return LISTE_LIAISONS.filter((id) => ligneDe(etat, id)?.some((c) => c.x === x && c.y === y) ?? false)
}

// Les trajets possibles (leurs rails sont posés) mais pas encore créés : une bulle « 🛤️ » les
// signale au milieu de leur ligne.
export function trajetsAProposer(etat: EtatJeu): IdLiaison[] {
  return LISTE_LIAISONS.filter((id) => trajetDe(etat, id) === null && ligneDe(etat, id) !== null)
}

// La case au milieu d'une ligne de rails (là où on met sa bulle).
export function milieuDeLigne(ligne: Case[]): Case {
  return ligne[Math.floor((ligne.length - 1) / 2)]
}

// Le joueur arrête un trajet : son chargement retourne d'où il vient.
export function supprimerTrajet(etat: EtatJeu, liaison: IdLiaison): string[] {
  const trajet = trajetDe(etat, liaison)
  if (!trajet) return []
  rentrerAuQuai(etat, trajet)
  etat.trajets = etat.trajets.filter((t) => t !== trajet)
  return ['🛤️ Trajet arrêté.']
}

// ---------------------------------------------------------------------------
// La taille des wagonnets (pour tous les trajets)
// ---------------------------------------------------------------------------

export function capaciteWagonnet(etat: EtatJeu): number {
  return NIVEAUX_WAGONNET[Math.min(etat.niveauWagonnets, NIVEAUX_WAGONNET.length - 1)].capacite
}

export function prochainNiveauWagonnet(etat: EtatJeu) {
  return NIVEAUX_WAGONNET[etat.niveauWagonnets + 1] ?? null
}

// ---------------------------------------------------------------------------
// Le pousseur d'un trajet et son niveau (23/10)
// ---------------------------------------------------------------------------

// Le pousseur embauché pour ce trajet (un seul par trajet ; null : personne).
export function pousseurDuTrajet(etat: EtatJeu, liaison: IdLiaison): Employe | null {
  return etat.employes.find((e) => e.role === 'pousseur' && e.trajet === liaison) ?? null
}

// Ce trajet roule tout seul : il existe, et un pousseur est embauché pour lui (23/10).
export function trajetAutomatique(etat: EtatJeu, liaison: IdLiaison): boolean {
  return trajetDe(etat, liaison) !== null && pousseurDuTrajet(etat, liaison) !== null
}

// Le niveau du pousseur de ce trajet (débutant s'il n'y en a pas).
export function niveauPousseur(employe: Employe | null): NiveauPousseur {
  return NIVEAUX_POUSSEUR[Math.max(0, Math.min(employe?.niveau ?? 0, NIVEAUX_POUSSEUR.length - 1))]
}

// Combien de places a le wagonnet de ce trajet : la taille des wagonnets × le bonus de son pousseur.
export function capaciteTrajet(etat: EtatJeu, liaison: IdLiaison): number {
  return Math.round(capaciteWagonnet(etat) * niveauPousseur(pousseurDuTrajet(etat, liaison)).places)
}

// Le temps de chaque arrêt (charger au départ, décharger ou vendre à l'arrivée) : plus court avec
// un pousseur amélioré.
export function secondesArret(etat: EtatJeu, liaison: IdLiaison): number {
  const pousseur = pousseurDuTrajet(etat, liaison)
  return pousseur ? niveauPousseur(pousseur).secondesArret : SECONDES_CHARGEMENT_WAGONNET
}

// Les wagonnets déjà chargés gardent leur chargement : la nouvelle taille compte au prochain départ.
export function ameliorerWagonnet(etat: EtatJeu): string[] {
  const prochain = prochainNiveauWagonnet(etat)
  if (prochain === null || !debloque(etat, 'wagonnet', etat.niveauWagonnets + 1) || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.niveauWagonnets += 1
  return [`🛒 Wagonnets plus grands : ${prochain.capacite} places.`]
}

// ---------------------------------------------------------------------------
// Où en sont les wagonnets
// ---------------------------------------------------------------------------

export function enRoute(trajet: Trajet): boolean {
  return trajet.etape !== 'quai'
}

// Le trajet que le joueur est en train de pousser (il fait l'aller-retour avec lui).
export function trajetDuJoueur(etat: EtatJeu): Trajet | null {
  return etat.trajets.find((t) => enRoute(t) && t.pousseur === 'joueur') ?? null
}

export function joueurPousse(etat: EtatJeu): boolean {
  return trajetDuJoueur(etat) !== null
}

// Toutes les cases de ce trajet sont électriques : son wagonnet roule tout seul.
export function trajetElectrique(etat: EtatJeu, liaison: IdLiaison): boolean {
  if (!generateurEnMarche(etat)) return false
  const ligne = ligneDe(etat, liaison)
  return ligne !== null && casesDansLeRayon(etat, ligne)
}

// Au moins un trajet est électrique (l'éclair du bandeau, le succès « Électricien »).
export function railsAlimentes(etat: EtatJeu): boolean {
  return etat.trajets.some((t) => trajetElectrique(etat, t.liaison))
}

// La vitesse d'un wagonnet en ce moment (cases par seconde). (23/10) Il est toujours poussé : sur
// des rails électriques (toutes ses cases dans le rayon du générateur allumé), son pousseur va
// un peu plus vite (+ 30 % à + 75 % selon le générateur ; avant, il roulait tout seul, bien trop
// vite).
export function vitesseTrajet(etat: EtatJeu, trajet: Trajet, pousseur = trajet.pousseur): number {
  if (pousseur === 'joueur') return VITESSE_POUSSE_JOUEUR
  const bonus = trajetElectrique(etat, trajet.liaison) ? multiplicateurGenerateur(etat) : 1
  // (« electricite » : une vieille partie, un wagonnet parti tout seul ; il finit son voyage)
  if (pousseur === 'electricite') return VITESSE_POUSSE_MINEUR * bonus
  // Un pousseur rare pousse plus vite (avec le recruteur, sa rareté est tirée au hasard).
  const employe = etat.employes.find((e) => e.nom === pousseur)
  return VITESSE_POUSSE_MINEUR * (employe ? forcePousseur(employe.rarete) : 1) * bonus
}

// Combien de fois plus vite pousse un pousseur, selon sa rareté : la moitié du bonus d'un
// mineur (un mythique, ×5 en creusant, pousse ×3).
export function forcePousseur(rarete: IdRarete): number {
  return 1 + ((RARETES[rarete]?.rendement ?? 1) - 1) / 2
}

// Le temps d'un aller-retour (chargement et vidage compris), à cette vitesse.
export function secondesAllerRetour(etat: EtatJeu, liaison: IdLiaison, vitesse: number): number {
  const ligne = ligneDe(etat, liaison)
  if (!ligne) return 0
  return (2 * longueurTrajet(ligne)) / vitesse + 2 * secondesArret(etat, liaison)
}

// Où est le wagonnet sur sa ligne : la distance depuis le départ (0) jusqu'à l'arrivée (longueur).
export function distanceDepuisLeDepart(etat: EtatJeu, trajet: Trajet): number {
  const ligne = ligneDe(etat, trajet.liaison)
  if (!ligne) return 0
  const longueur = longueurTrajet(ligne)
  const d = Math.max(0, Math.min(longueur, trajet.distance))
  if (trajet.etape === 'aller') return d
  if (trajet.etape === 'retour') return longueur - d
  return 0
}

// ---------------------------------------------------------------------------
// Ce que porte chaque wagonnet
// ---------------------------------------------------------------------------

// Le charbon et la redstone qui manquent à la foreuse (son réservoir) et au générateur.
function besoinCharbon(etat: EtatJeu): number {
  return placeCharbonForeuse(etat)
}

function besoinRedstone(etat: EtatJeu): number {
  return Math.max(0, Math.ceil((RESERVE_GENERATEUR_WAGONNET - etat.generateur.carburant) / SECONDES_PAR_REDSTONE))
}

// Ce que le wagonnet du marché laisse dans le coffre : les objets « gardés » au marché (le fer
// pour les rails, par exemple), et ce dont les autres trajets ont besoin (le charbon de la
// foreuse, la redstone du générateur).
// « exclus » : les objets décochés pour ce trajet (par défaut, ceux du trajet et les objets
// gardés au marché ; la fenêtre du trajet en donne d'autres pour son aperçu).
function gardeDansLeCoffre(etat: EtatJeu, bloc: IdBloc, exclus?: IdBloc[]): number {
  const garde = exclus ? exclus.includes(bloc) : etat.nonAVendre.includes(bloc) || exclusDe(etat, 'mine-marche').includes(bloc)
  if (garde) return Infinity
  // (23/10) On ne garde le charbon ou la redstone pour la foreuse ou le générateur que si leur
  // wagonnet a un pousseur embauché : sinon, rien ne les emporterait, et ils restaient bloqués
  // dans le coffre au lieu d'être vendus.
  // (23/10) « Garder 40 » : ce nombre-là reste toujours dans le coffre, le wagonnet prend le reste.
  const fixe = etat.coffre.garder?.[bloc] ?? 0
  if (bloc === 'charbon' && trajetAutomatique(etat, 'mine-foreuse')) return Math.max(fixe, besoinCharbon(etat))
  if (bloc === 'redstone' && trajetAutomatique(etat, 'mine-generateur')) return Math.max(fixe, besoinRedstone(etat))
  return fixe
}

// Ce qu'il y a à emporter au départ de ce trajet, objet par objet (les plus chers d'abord).
function aEmporter(etat: EtatJeu, liaison: IdLiaison, exclusAutres?: IdBloc[]): [IdBloc, number][] {
  switch (liaison) {
    case 'mine-marche':
      return parPrix(etat.coffre.contenu)
        .map(([bloc, nombre]): [IdBloc, number] => [bloc, Math.max(0, nombre - gardeDansLeCoffre(etat, bloc, exclusAutres))])
        .filter(([, nombre]) => nombre > 0)
    case 'mine-foreuse': {
      // Dès que le réservoir n'est plus plein, il emporte tout le charbon du coffre : le surplus
      // ira dans le chariot de la foreuse (28/10).
      const nombre = besoinCharbon(etat) > 0 ? (etat.coffre.contenu.charbon ?? 0) : 0
      return nombre > 0 ? [['charbon', nombre]] : []
    }
    case 'mine-generateur': {
      const nombre = Math.min(etat.coffre.contenu.redstone ?? 0, besoinRedstone(etat))
      return nombre > 0 ? [['redstone', nombre]] : []
    }
    case 'foreuse-marche': {
      const exclus = exclusAutres ?? exclusDe(etat, liaison)
      return parPrix(etat.foreuse.chariot).filter(([bloc]) => !exclus.includes(bloc))
    }
  }
}

export function aCharger(etat: EtatJeu, liaison: IdLiaison): number {
  return aEmporter(etat, liaison).reduce((total, [, nombre]) => total + nombre, 0)
}

// Remplit le wagonnet au départ (dans le coffre de la mine, ou le chariot de la foreuse).
function charger(etat: EtatJeu, trajet: Trajet): void {
  let place = capaciteTrajet(etat, trajet.liaison) - totalObjets(trajet.chargement)
  for (const [bloc, nombre] of aEmporter(etat, trajet.liaison)) {
    const pris = Math.min(nombre, place)
    if (pris <= 0) continue
    ajouterA(trajet.chargement, bloc, pris)
    if (trajet.liaison === 'foreuse-marche') retirerDuChariot(etat, bloc, pris)
    else retirerDe(etat.coffre.contenu, bloc, pris)
    place -= pris
  }
}

// À l'arrivée : il vend (au marché) ou il remplit (la foreuse, le générateur).
function livrer(etat: EtatJeu, trajet: Trajet): string[] {
  const chargement = trajet.chargement
  trajet.chargement = {}
  etat.stats.voyagesWagonnet += 1
  if (LIAISONS[trajet.liaison].arrivee === 'marche') {
    const gain = valeurDe(chargement)
    encaisser(etat, gain)
    etat.stats.argentWagonnet += gain
    return trajet.pousseur === 'joueur' && gain > 0 ? [`🛤️ Le wagonnet a tout vendu au marché : +${gain} $`] : []
  }
  if (trajet.liaison === 'mine-foreuse') {
    // Le réservoir, puis le chariot ; ce qui ne rentre nulle part repart avec le wagonnet.
    const reste = livrerCharbon(etat, chargement.charbon ?? 0)
    if (reste > 0) trajet.chargement = { charbon: reste }
  }
  if (trajet.liaison === 'mine-generateur') etat.generateur.carburant += (chargement.redstone ?? 0) * SECONDES_PAR_REDSTONE
  return trajet.pousseur === 'joueur' ? [`🛤️ Livré : ${totalObjets(chargement)} ${trajet.liaison === 'mine-foreuse' ? 'charbon' : 'redstone'}.`] : []
}

// Le chargement retourne d'où il vient (trajet arrêté, ou rails coupés en route).
function rendreChargement(etat: EtatJeu, trajet: Trajet): void {
  const retour: Inventaire = trajet.liaison === 'foreuse-marche' ? etat.foreuse.chariot : etat.coffre.contenu
  for (const [bloc, nombre] of parPrix(trajet.chargement)) ajouterA(retour, bloc, nombre)
  trajet.chargement = {}
}

function rentrerAuQuai(etat: EtatJeu, trajet: Trajet): void {
  rendreChargement(etat, trajet)
  libererPousseur(etat, trajet)
  Object.assign(trajet, { etape: 'quai', distance: 0, pousseur: null })
}

function partir(etat: EtatJeu, trajet: Trajet, pousseur: string): void {
  charger(etat, trajet)
  trajet.etape = 'aller'
  trajet.pousseur = pousseur
  // Le chargement prend un peu de temps : on part « en arrière » de quelques cases.
  trajet.distance = -secondesArret(etat, trajet.liaison) * vitesseTrajet(etat, trajet)
}

// Le mineur qui poussait ce wagonnet retourne attendre au quai.
function libererPousseur(etat: EtatJeu, trajet: Trajet): void {
  const mineur = etat.employes.find((e) => e.nom === trajet.pousseur)
  if (mineur && mineur.etape === 'pousse') mineur.etape = 'quai'
}

// ---------------------------------------------------------------------------
// Pousser soi-même
// ---------------------------------------------------------------------------

export function peutPousser(etat: EtatJeu, liaison: IdLiaison): boolean {
  const trajet = trajetDe(etat, liaison)
  return trajet !== null && !enRoute(trajet) && !joueurPousse(etat) && ligneDe(etat, liaison) !== null && aCharger(etat, liaison) > 0
}

export function pousserTrajet(etat: EtatJeu, liaison: IdLiaison): string[] {
  const trajet = trajetDe(etat, liaison)
  if (!trajet || !peutPousser(etat, liaison)) return []
  partir(etat, trajet, 'joueur')
  return ['🛤️ Tu pousses le wagonnet !']
}

// ---------------------------------------------------------------------------
// Le temps qui passe
// ---------------------------------------------------------------------------

// Le pousseur payé de ce trajet qui attend au quai (null : personne).
export function pousseurAuQuai(etat: EtatJeu, liaison: IdLiaison) {
  const depart = LIAISONS[liaison].depart
  return etat.employes.find((e) => e.role === 'pousseur' && e.trajet === liaison && e.etape === 'quai' && e.lieu === depart && e.tempsPaye > 0) ?? null
}

// Ce trajet a-t-il un pousseur payé (au quai ou en train de pousser) ?
export function aUnPousseur(etat: EtatJeu, liaison: IdLiaison): boolean {
  return etat.employes.some((e) => e.role === 'pousseur' && e.trajet === liaison && e.tempsPaye > 0)
}

export function avancerWagonnets(etat: EtatJeu, secondes: number): string[] {
  const messages: string[] = []
  for (const trajet of etat.trajets) messages.push(...avancerTrajet(etat, trajet, secondes))
  return messages
}

function avancerTrajet(etat: EtatJeu, trajet: Trajet, secondes: number): string[] {
  const ligne = ligneDe(etat, trajet.liaison)
  // Plus de ligne (un rail enlevé, un bâtiment déplacé...) : il revient au quai, et son
  // chargement retourne d'où il vient. Le trajet reste : il repartira quand les rails seront refaits.
  if (!ligne) {
    if (enRoute(trajet) || totalObjets(trajet.chargement) > 0) rentrerAuQuai(etat, trajet)
    return []
  }

  if (trajet.etape === 'quai') {
    if (aCharger(etat, trajet.liaison) === 0) return []
    // Le pousseur de ce trajet, s'il attend au quai (devant le bâtiment de départ) : sans lui,
    // pas de départ. (23/10) Il le pousse toujours, même sur des rails électriques (il va
    // seulement plus vite).
    const pousseur = pousseurAuQuai(etat, trajet.liaison)
    if (!pousseur) return []
    partir(etat, trajet, pousseur.nom)
    pousseur.etape = 'pousse'
  }

  const messages: string[] = []
  const longueur = longueurTrajet(ligne)
  const avant = trajet.distance
  trajet.distance += secondes * vitesseTrajet(etat, trajet)
  // Le vidage à l'arrivée prend un peu de temps (la distance du retour est négative pendant ce
  // temps-là) : il ne livre (et ne vend) qu'une fois le vidage fini, quand il repart.
  if (trajet.etape === 'retour' && avant < 0 && trajet.distance >= 0) messages.push(...livrer(etat, trajet))
  if (trajet.etape === 'aller' && trajet.distance >= longueur) {
    // À l'arrivée : il s'arrête pour vider son chargement (la livraison se fait à la fin).
    trajet.etape = 'retour'
    trajet.distance = -secondesArret(etat, trajet.liaison) * vitesseTrajet(etat, trajet)
  } else if (trajet.etape === 'retour' && trajet.distance >= longueur) {
    // Ce qui n'a pas pu être livré retourne dans le coffre.
    if (totalObjets(trajet.chargement) > 0) rendreChargement(etat, trajet)
    libererPousseur(etat, trajet)
    trajet.etape = 'quai'
    trajet.distance = 0
    trajet.pousseur = null
  }
  return messages
}
