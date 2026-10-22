// Les notifications au-dessus des bâtiments du village : de petites icônes qui sautent pour dire
// qu'il y a quelque chose à faire là-bas (coffre de la mine plein, chariot de la foreuse plein,
// plus de redstone, salaires à payer, rails coupés, amélioration achetable...).

import { BATIMENTS, LIAISONS, type IdBatiment } from './donnees'
import { DECOUVERTES, decouvertesAMontrer } from './decouvertes'
import { alerteSalaires } from './employes'
import { chariotPlein } from './foreuse'
import { generateurPose } from './generateur'
import { coffrePlein, estCassee, sacPlein, type EtatJeu } from './mineur'
import { standsAchetables } from './objectifs'
import { etapeTutoriel } from './tutoriel'
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
  if (salaires) ajouter('employes', { icone: '😠', texte: salaires, court: 'Salaires !', sorte: 'alerte' })
  // Un trajet dont les rails sont coupés (un rail enlevé, un bâtiment déplacé) : son wagonnet
  // attend au quai. La bulle est sur ses deux bâtiments.
  for (const t of etat.trajets) {
    if (ligneDe(etat, t.liaison)) continue
    const { depart, arrivee } = LIAISONS[t.liaison]
    const texte = `Rails coupés entre ${BATIMENTS[depart].nom.toLowerCase()} et ${BATIMENTS[arrivee].nom.toLowerCase()} : le wagonnet attend. Repose les rails !`
    ajouter(depart, { icone: '🚧', texte, court: 'Rails coupés', sorte: 'alerte' })
    ajouter(arrivee, { icone: '🚧', texte, court: 'Rails coupés', sorte: 'alerte' })
  }
  // Un trajet sans pousseur (27/10) : son wagonnet ne part pas tout seul, même électrique.
  if (batimentPose(etat.village, 'employes')) {
    // (un pousseur pas payé a déjà son alerte « Salaires ! »)
    const sansPousseur = etat.trajets.filter((t) => ligneDe(etat, t.liaison) && !etat.employes.some((e) => e.role === 'pousseur' && e.trajet === t.liaison)).length
    if (sansPousseur > 0) {
      ajouter('employes', {
        icone: '🛤️',
        texte: sansPousseur === 1 ? 'Un trajet de wagonnet n’a pas de pousseur : embauches-en un' : `${sansPousseur} trajets de wagonnet n’ont pas de pousseur : embauches-en`,
        court: 'Pousseur ?',
        sorte: 'alerte',
      })
    }
  }
  // Des pousseurs dont le trajet a été arrêté : ils attendent au quai, pour rien.
  const sansTrajet = etat.employes.filter((e) => e.role === 'pousseur' && (e.trajet === null || !trajetDe(etat, e.trajet))).length
  if (sansTrajet > 0) {
    ajouter('employes', { icone: '🛤️', texte: `${sansTrajet} pousseur${sansTrajet > 1 ? 's' : ''} sans trajet : choisis-leur un trajet au Personnel`, court: 'Sans trajet', sorte: 'alerte' })
  }
  if (batimentPose(etat.village, 'foreuse')) {
    if (chariotPlein(etat)) ajouter('foreuse', { icone: '🛒', texte: 'Le chariot est plein : viens le vider !', court: 'Plein !', sorte: 'alerte' })
    else if (etat.foreuse.carburant <= 0) ajouter('foreuse', { icone: '🔥', texte: 'Plus de charbon !', court: 'Charbon ?', sorte: 'alerte' })
  }
  if (generateurPose(etat) && etat.generateur.allume && etat.generateur.carburant <= 0) {
    ajouter('generateur', { icone: '🔴', texte: 'Plus de redstone !', court: 'Redstone ?', sorte: 'alerte' })
  }
  if (estCassee(etat)) ajouter('forgeron', { icone: '🔧', texte: 'Ta pioche est cassée : fais-la réparer !', court: 'Réparer', sorte: 'alerte' })
  if (sacPlein(etat)) ajouter('marche', { icone: '🎒', texte: 'Ton sac est plein : viens vendre !', court: 'Vendre !', sorte: 'alerte' })
  // (Plus de bulle rose « 20 objets » sur la mine, 27/10 : la jauge du coffre au-dessus d'elle le montre déjà.)
  if (coffrePlein(etat)) ajouter('puits', { icone: '📦', texte: 'Le coffre de la mine est plein : viens le vider !', court: 'Plein !', sorte: 'alerte' })

  // Ce qui vient de se débloquer (recruteur, manager) et ce qui est achetable.
  for (const id of decouvertesAMontrer(etat)) ajouter(DECOUVERTES[id].stand, { icone: '✨', texte: `Nouveau : ${DECOUVERTES[id].nom} !`, court: 'Nouveau', sorte: 'nouveau' })
  // (30/10) « Achetable » seulement pendant le tutoriel : ensuite, il y aurait presque toujours une
  // bulle (on peut presque toujours embaucher...), et trop de bulles noient le joueur. La liste
  // des tâches propose déjà les achats.
  if (etapeTutoriel(etat) !== null) {
    for (const id of standsAchetables(etat)) ajouter(id, { icone: '⬆️', texte: 'Une amélioration est achetable !', court: 'Achetable', sorte: 'achat' })
  }

  for (const id of Object.keys(liste) as IdBatiment[]) liste[id] = (liste[id] ?? []).sort((a, b) => PRIORITE[a.sorte] - PRIORITE[b.sorte])
  return liste
}
