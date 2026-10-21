// Les notifications au-dessus des bâtiments du village (20/10) : de petites icônes qui sautent
// pour dire qu'il y a quelque chose à faire là-bas (chariot de la foreuse plein, plus de charbon,
// salaires à payer, amélioration achetable, nouveaux niveaux, prestige prêt...).

import type { IdBatiment } from './donnees'
import { peutPasserPrestige } from './conditionsPrestige'
import { DECOUVERTES, decouvertesAMontrer } from './decouvertes'
import { alerteSalaires } from './employes'
import { chariotPlein } from './foreuse'
import { estCassee, nbDansReservoir, reservoirPlein, sacPlein, type EtatJeu } from './mineur'
import { standsAchetables, standsAvecNouveauxNiveaux } from './objectifs'
import { pointsDisponibles } from './talents'
import { batimentPose } from './village'

// La sorte de notification décide de sa couleur et de sa priorité (la plus urgente d'abord).
export type SorteNotification = 'alerte' | 'pret' | 'nouveau' | 'niveaux' | 'achat'

export type Notification = { icone: string; texte: string; sorte: SorteNotification }

const PRIORITE: Record<SorteNotification, number> = { alerte: 0, pret: 1, nouveau: 2, niveaux: 3, achat: 4 }

export function notificationsBatiments(etat: EtatJeu): Partial<Record<IdBatiment, Notification[]>> {
  const liste: Partial<Record<IdBatiment, Notification[]>> = {}
  const ajouter = (id: IdBatiment, notification: Notification) => {
    if (!batimentPose(etat.village, id)) return
    liste[id] = [...(liste[id] ?? []), notification]
  }

  // Les urgences.
  const salaires = alerteSalaires(etat)
  if (salaires) ajouter('employes', { icone: '😠', texte: salaires, sorte: 'alerte' })
  if (etat.foreuse.active && chariotPlein(etat)) ajouter('foreuse', { icone: '🛒', texte: 'Le chariot est plein : viens le vider !', sorte: 'alerte' })
  else if (etat.foreuse.active && etat.foreuse.carburant <= 0) ajouter('foreuse', { icone: '🔥', texte: 'Plus de charbon !', sorte: 'alerte' })
  if (estCassee(etat)) ajouter('forgeron', { icone: '🔧', texte: 'Ta pioche est cassée : fais-la réparer !', sorte: 'alerte' })
  if (sacPlein(etat)) ajouter('marche', { icone: '🎒', texte: 'Ton sac est plein : viens vendre !', sorte: 'alerte' })
  if (reservoirPlein(etat)) ajouter('puits', { icone: '📦', texte: 'Le réservoir de la mine est plein : viens le vider !', sorte: 'alerte' })
  else if (nbDansReservoir(etat) > 0) ajouter('puits', { icone: '📦', texte: `${nbDansReservoir(etat)} objet(s) dans le réservoir : porte-les au marché`, sorte: 'pret' })

  // Le prestige.
  if (peutPasserPrestige(etat)) ajouter('prestige', { icone: '⭐', texte: 'Prêt pour le prestige !', sorte: 'pret' })
  const points = pointsDisponibles(etat)
  if (points > 0) ajouter('prestige', { icone: '🌟', texte: `${points} point${points > 1 ? 's' : ''} de talent à dépenser`, sorte: 'pret' })

  // Ce qui vient de se débloquer (recruteur, manager...), les nouveaux niveaux, et ce qui est achetable.
  for (const id of decouvertesAMontrer(etat)) ajouter(DECOUVERTES[id].stand, { icone: '✨', texte: `Nouveau : ${DECOUVERTES[id].nom} !`, sorte: 'nouveau' })
  for (const id of standsAvecNouveauxNiveaux(etat)) ajouter(id, { icone: '⬆️', texte: 'Nouveaux niveaux débloqués !', sorte: 'niveaux' })
  for (const id of standsAchetables(etat)) ajouter(id, { icone: '💰', texte: 'Une amélioration est achetable !', sorte: 'achat' })

  for (const id of Object.keys(liste) as IdBatiment[]) liste[id] = (liste[id] ?? []).sort((a, b) => PRIORITE[a.sorte] - PRIORITE[b.sorte])
  return liste
}
