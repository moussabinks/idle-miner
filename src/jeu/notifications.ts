// Les notifications au-dessus des bâtiments du village : de petites icônes qui sautent pour dire
// qu'il y a quelque chose à faire là-bas (coffre de la mine plein, chariot de la foreuse plein,
// plus de redstone, salaires à payer, rails coupés, amélioration achetable...).

import { analyseWagonnet, chariotTropPetit } from './production'
import { atelierPose, besoinCharbonFonderie, joailliers, sortiePleine } from './ateliers'
import { BATIMENTS, LIAISONS, type IdBatiment } from './donnees'
import { DECOUVERTES, decouvertesAMontrer } from './decouvertes'
import { alerteSalaires } from './employes'
import { chariotPlein } from './foreuse'
import { generateurPose } from './generateur'
import { coffrePlein, estCassee, type EtatJeu } from './mineur'
import { standsAchetables } from './objectifs'
import { etapeTutoriel } from './tutoriel'
import { t } from './langue'
import { batimentPose } from './village'
import { ligneDe, trajetDe } from './wagonnet'

// La sorte de notification décide de sa couleur et de sa priorité (la plus urgente d'abord).
export type SorteNotification = 'alerte' | 'pret' | 'nouveau' | 'achat'

// « court » : deux ou trois mots écrits dans la bulle (« Plein ! », « À payer »).
export type Notification = { icone: string; texte: string; court: string; sorte: SorteNotification }

const PRIORITE: Record<SorteNotification, number> = { alerte: 0, pret: 1, nouveau: 2, achat: 3 }

export function notificationsBatiments(etat: EtatJeu): Partial<Record<IdBatiment, Notification[]>> {
  const liste: Partial<Record<IdBatiment, Notification[]>> = {}
  const ajouter = (id: IdBatiment, notification: Notification) => {
    if (!batimentPose(etat.village, id)) return
    liste[id] = [...(liste[id] ?? []), notification]
  }

  // Les urgences.
  const salaires = alerteSalaires(etat)
  if (salaires) {
    ajouter('employes', { icone: '😠', texte: salaires, court: t('Salaires !'), sorte: 'alerte' })
    // (25/10) Plus aussi au-dessus de la mine : une seule alerte par chose (le Personnel).
  }
  // Un trajet dont les rails sont coupés (un rail enlevé, un bâtiment déplacé) : son wagonnet
  // attend au quai. La bulle est sur ses deux bâtiments.
  for (const trajet of etat.trajets) {
    if (ligneDe(etat, trajet.liaison)) continue
    const { depart, arrivee } = LIAISONS[trajet.liaison]
    const texte = t('Rails coupés entre {depart} et {arrivee} : le wagonnet attend. Repose les rails !', { depart: t(BATIMENTS[depart].nom).toLowerCase(), arrivee: t(BATIMENTS[arrivee].nom).toLowerCase() })
    ajouter(depart, { icone: '🚧', texte, court: t('Rails coupés'), sorte: 'alerte' })
    ajouter(arrivee, { icone: '🚧', texte, court: t('Rails coupés'), sorte: 'alerte' })
  }
  // Un trajet sans pousseur (27/10) : son wagonnet ne part pas tout seul, même électrique.
  if (batimentPose(etat.village, 'employes')) {
    // (un pousseur pas payé a déjà son alerte « Salaires ! »)
    const sansPousseur = etat.trajets.filter((trajet) => ligneDe(etat, trajet.liaison) && !etat.employes.some((e) => e.role === 'pousseur' && e.trajet === trajet.liaison)).length
    if (sansPousseur > 0) {
      ajouter('employes', {
        icone: '🛤️',
        texte: sansPousseur === 1 ? t('Un trajet de wagonnet n’a pas de pousseur : embauches-en un') : t('{n} trajets de wagonnet n’ont pas de pousseur : embauches-en', { n: sansPousseur }),
        court: t('Pousseur ?'),
        sorte: 'alerte',
      })
    }
  }
  // (26/10) Un wagonnet qui vend moins que ce qui sort (son chariot est trop petit) : l'argent
  // s'entasse dans le coffre au lieu d'arriver dans la poche. On agrandit le chariot au Personnel.
  for (const liaison of ['mine-marche', 'foreuse-marche', 'fonderie-marche', 'joaillerie-marche'] as const) {
    if (!chariotTropPetit(analyseWagonnet(etat, liaison))) continue
    ajouter('employes', { icone: '🚃', texte: t('Le wagonnet ne suit pas : agrandis le chariot de son pousseur'), court: t('Chariot !'), sorte: 'alerte' })
    break
  }
  // Des pousseurs dont le trajet a été arrêté : ils attendent au quai, pour rien.
  const sansTrajet = etat.employes.filter((e) => e.role === 'pousseur' && (e.trajet === null || !trajetDe(etat, e.trajet))).length
  if (sansTrajet > 0) {
    ajouter('employes', { icone: '🛤️', texte: sansTrajet > 1 ? t('{n} pousseurs sans trajet : choisis-leur un trajet au Personnel', { n: sansTrajet }) : t('{n} pousseur sans trajet : choisis-leur un trajet au Personnel', { n: sansTrajet }), court: t('Sans trajet'), sorte: 'alerte' })
  }
  if (batimentPose(etat.village, 'foreuse')) {
    if (chariotPlein(etat)) ajouter('foreuse', { icone: '🛒', texte: t('Le chariot est plein : viens le vider !'), court: t('Plein !'), sorte: 'alerte' })
    else if (etat.foreuse.carburant <= 0) ajouter('foreuse', { icone: '🔥', texte: t('Plus de charbon !'), court: t('Charbon ?'), sorte: 'alerte' })
  }
  // (26/10) La fonderie : plus de charbon (alors qu'elle a du minerai), ou sa réserve est pleine.
  // La joaillerie : sa réserve est pleine, ou personne n'y travaille.
  if (besoinCharbonFonderie(etat)) ajouter('fonderie', { icone: '⚫', texte: t('Plus de charbon dans le four de la fonderie !'), court: t('Charbon ?'), sorte: 'alerte' })
  else if (atelierPose(etat, 'fonderie') && sortiePleine(etat, 'fonderie')) ajouter('fonderie', { icone: '🟨', texte: t('La réserve de lingots est pleine : vends-la !'), court: t('Plein !'), sorte: 'alerte' })
  if (atelierPose(etat, 'joaillerie') && sortiePleine(etat, 'joaillerie')) ajouter('joaillerie', { icone: '💍', texte: t('La réserve de bijoux est pleine : vends-la !'), court: t('Plein !'), sorte: 'alerte' })
  else if (atelierPose(etat, 'joaillerie') && !joailliers(etat).some((e) => e.tempsPaye > 0)) {
    ajouter('joaillerie', { icone: '💍', texte: t('Personne ne taille les gemmes : embauche un joaillier au Personnel'), court: t('Joaillier ?'), sorte: 'alerte' })
  }
  if (generateurPose(etat) && etat.generateur.allume && etat.generateur.carburant <= 0) {
    ajouter('generateur', { icone: '🔴', texte: t('Plus de redstone !'), court: t('Redstone ?'), sorte: 'alerte' })
  }
  if (estCassee(etat)) ajouter('forgeron', { icone: '🔧', texte: t('Ta pioche est cassée : fais-la réparer !'), court: t('Réparer'), sorte: 'alerte' })
  // (Plus de bulle rose « 20 objets » sur la mine, 27/10 : la jauge du coffre au-dessus d'elle le montre déjà.)
  if (coffrePlein(etat)) ajouter('puits', { icone: '📦', texte: t('Le coffre de la mine est plein : vends-le !'), court: t('Plein !'), sorte: 'alerte' })

  // Ce qui vient de se débloquer (recruteur, manager) et ce qui est achetable.
  for (const id of decouvertesAMontrer(etat)) ajouter(DECOUVERTES[id].stand, { icone: '✨', texte: t('Nouveau : {nom} !', { nom: t(DECOUVERTES[id].nom) }), court: t('Nouveau'), sorte: 'nouveau' })
  // (30/10) « Achetable » seulement pendant le tutoriel : ensuite, il y aurait presque toujours une
  // bulle (on peut presque toujours embaucher...), et trop de bulles noient le joueur. La liste
  // des tâches propose déjà les achats.
  if (etapeTutoriel(etat) !== null) {
    for (const id of standsAchetables(etat)) ajouter(id, { icone: '⬆️', texte: t('Une amélioration est achetable !'), court: t('Achetable'), sorte: 'achat' })
  }

  for (const id of Object.keys(liste) as IdBatiment[]) liste[id] = (liste[id] ?? []).sort((a, b) => PRIORITE[a.sorte] - PRIORITE[b.sorte])
  return liste
}
