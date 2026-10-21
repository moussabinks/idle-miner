// Le wagonnet (22/10) : quand une ligne de rails continue relie la mine au marché, il charge le
// coffre de la mine, roule jusqu'au marché, y vend tout, puis revient au quai.
// Il ne roule pas tout seul :
//   - le joueur peut le pousser (bouton au bâtiment Mine) : il fait l'aller-retour avec lui ;
//   - un mineur « pousseur » (au Personnel) le pousse dès que le coffre n'est pas vide ;
//   - avec le générateur, si toute la ligne est dans son rayon, il roule tout seul, plus vite :
//     c'est le revenu passif.

import {
  NIVEAUX_WAGONNET,
  SECONDES_CHARGEMENT_WAGONNET,
  VITESSE_POUSSE_JOUEUR,
  VITESSE_POUSSE_MINEUR,
  VITESSE_RAILS,
} from './donnees'
import { puissanceGenerateur, railsAlimentes } from './generateur'
import { ajouterA, encaisser, nbDansCoffre, parPrix, payer, peutPayer, retirerDe, totalObjets, valeurDe, type EtatJeu } from './mineur'
import { batimentPose, railsMineMarche, type Case } from './village'

// La ligne de rails de la mine au marché (null : pas de ligne complète, ou pas de marché).
export function ligneDuWagonnet(etat: EtatJeu): Case[] | null {
  if (!batimentPose(etat.village, 'marche')) return null
  return railsMineMarche(etat.village)
}

// La longueur d'un trajet, en cases (on part du bord de la mine et on arrive au bord du marché).
export function longueurTrajet(ligne: Case[]): number {
  return ligne.length + 1
}

export function capaciteWagonnet(etat: EtatJeu): number {
  return NIVEAUX_WAGONNET[Math.min(etat.wagonnet.niveau, NIVEAUX_WAGONNET.length - 1)].capacite
}

export function prochainNiveauWagonnet(etat: EtatJeu) {
  return NIVEAUX_WAGONNET[etat.wagonnet.niveau + 1] ?? null
}

export function wagonnetEnRoute(etat: EtatJeu): boolean {
  return etat.wagonnet.etape !== 'quai'
}

// Le joueur est en train de le pousser (il fait l'aller-retour avec lui).
export function joueurPousse(etat: EtatJeu): boolean {
  return wagonnetEnRoute(etat) && etat.wagonnet.pousseur === 'joueur'
}

// Sa vitesse en ce moment (cases par seconde). Électrique : plus vite avec un générateur
// puissant ; s'il perd le courant en route, il finit son trajet doucement, sur sa lancée.
export function vitesseWagonnet(etat: EtatJeu): number {
  const pousseur = etat.wagonnet.pousseur
  if (pousseur === 'joueur') return VITESSE_POUSSE_JOUEUR
  if (pousseur === 'electricite') return railsAlimentes(etat) ? VITESSE_RAILS * puissanceGenerateur(etat) : VITESSE_POUSSE_MINEUR / 2
  return VITESSE_POUSSE_MINEUR
}

// Le temps d'un aller-retour (chargement et vidage compris), pour l'affichage et l'estimation du revenu.
export function secondesAllerRetour(etat: EtatJeu, vitesse = vitesseWagonnet(etat)): number {
  const ligne = ligneDuWagonnet(etat)
  if (!ligne) return 0
  return (2 * longueurTrajet(ligne)) / vitesse + 2 * SECONDES_CHARGEMENT_WAGONNET
}

// Remplit le wagonnet avec le coffre (les objets les plus chers d'abord).
function charger(etat: EtatJeu): void {
  let place = capaciteWagonnet(etat) - totalObjets(etat.wagonnet.chargement)
  for (const [bloc, nombre] of parPrix(etat.coffre.contenu)) {
    const pris = Math.min(nombre, place)
    if (pris <= 0) continue
    ajouterA(etat.wagonnet.chargement, bloc, pris)
    retirerDe(etat.coffre.contenu, bloc, pris)
    place -= pris
  }
}

function partir(etat: EtatJeu, pousseur: string): void {
  charger(etat)
  etat.wagonnet.etape = 'aller'
  // Le chargement prend un peu de temps : on part « en arrière » de quelques cases.
  etat.wagonnet.distance = -SECONDES_CHARGEMENT_WAGONNET * vitesseDe(etat, pousseur)
  etat.wagonnet.pousseur = pousseur
}

function vitesseDe(etat: EtatJeu, pousseur: string): number {
  const avant = etat.wagonnet.pousseur
  etat.wagonnet.pousseur = pousseur
  const vitesse = vitesseWagonnet(etat)
  etat.wagonnet.pousseur = avant
  return vitesse
}

// Le joueur peut-il pousser le wagonnet maintenant ?
export function peutPousserWagonnet(etat: EtatJeu): boolean {
  return ligneDuWagonnet(etat) !== null && !wagonnetEnRoute(etat) && nbDansCoffre(etat) > 0
}

// Le joueur pousse le wagonnet jusqu'au marché (et le ramène).
export function pousserWagonnet(etat: EtatJeu): string[] {
  if (!peutPousserWagonnet(etat)) return []
  partir(etat, 'joueur')
  return ['🛤️ Tu pousses le wagonnet jusqu’au marché !']
}

export function ameliorerWagonnet(etat: EtatJeu): string[] {
  const prochain = prochainNiveauWagonnet(etat)
  if (prochain === null || wagonnetEnRoute(etat) || !peutPayer(etat, prochain.cout)) return []
  payer(etat, prochain.cout)
  etat.wagonnet.niveau += 1
  return [`🛒 Wagonnet plus grand : ${prochain.capacite} places.`]
}

// ---------------------------------------------------------------------------
// Le temps qui passe
// ---------------------------------------------------------------------------

export function avancerWagonnet(etat: EtatJeu, secondes: number): string[] {
  const w = etat.wagonnet
  const ligne = ligneDuWagonnet(etat)
  // Plus de ligne (un rail enlevé, le marché déplacé...) : il revient au quai, et son
  // chargement retourne dans le coffre.
  if (!ligne) {
    if (wagonnetEnRoute(etat) || totalObjets(w.chargement) > 0) {
      for (const [bloc, nombre] of parPrix(w.chargement)) ajouterA(etat.coffre.contenu, bloc, nombre)
      libererPousseur(etat)
      Object.assign(w, { etape: 'quai', distance: 0, chargement: {}, pousseur: null })
    }
    return []
  }

  if (w.etape === 'quai') {
    if (nbDansCoffre(etat) === 0) return []
    if (railsAlimentes(etat)) {
      partir(etat, 'electricite')
    } else {
      const pousseur = etat.employes.find((e) => e.role === 'pousseur' && e.etape === 'quai' && e.tempsPaye > 0)
      if (!pousseur) return []
      partir(etat, pousseur.nom)
      pousseur.etape = 'pousse'
    }
  }

  const messages: string[] = []
  const longueur = longueurTrajet(ligne)
  w.distance += secondes * vitesseWagonnet(etat)
  if (w.etape === 'aller' && w.distance >= longueur) {
    // Au marché : il vend tout (le vidage prend un peu de temps, compté sur le retour).
    const gain = valeurDe(w.chargement)
    encaisser(etat, gain)
    etat.stats.argentWagonnet += gain
    etat.stats.voyagesWagonnet += 1
    if (w.pousseur === 'joueur' && gain > 0) messages.push(`🛤️ Le wagonnet a vendu le coffre au marché : +${gain} $`)
    w.chargement = {}
    w.etape = 'retour'
    w.distance = -SECONDES_CHARGEMENT_WAGONNET * vitesseWagonnet(etat)
  } else if (w.etape === 'retour' && w.distance >= longueur) {
    libererPousseur(etat)
    w.etape = 'quai'
    w.distance = 0
    w.pousseur = null
  }
  return messages
}

// Le mineur qui poussait le wagonnet retourne l'attendre au quai.
function libererPousseur(etat: EtatJeu): void {
  const nom = etat.wagonnet.pousseur
  const mineur = etat.employes.find((e) => e.nom === nom)
  if (mineur && mineur.etape === 'pousse') mineur.etape = 'quai'
}

// Où est le wagonnet sur la ligne : la distance depuis la mine (0) jusqu'au marché (longueur).
export function distanceDepuisLaMine(etat: EtatJeu): number {
  const ligne = ligneDuWagonnet(etat)
  if (!ligne) return 0
  const longueur = longueurTrajet(ligne)
  const d = Math.max(0, Math.min(longueur, etat.wagonnet.distance))
  if (etat.wagonnet.etape === 'aller') return d
  if (etat.wagonnet.etape === 'retour') return longueur - d
  return 0
}
